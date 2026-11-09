-- Plandagen: opslaan en verwijderen met rooster mee (9 nov 2026).
-- bewaar_plan_dagen(schema, week, map): plan opslaan vanuit de workout-builder; de map
--   oude dagsleutel -> nieuwe ('dag3' -> 'dag2') schuift rooster, vooruit geplande weken
--   en client_exercise_overrides mee. Lege map = alleen het plan.
-- verwijder_plandag(schema, dag): dag uit een klantplan, hernummert dag1..dagN.
-- Alleen coaches (rls_is_coach), draait als invoker (RLS blijft gelden).

create or replace function public.verwijder_plandag(p_schema_id uuid, p_dag_key text)
returns void language plpgsql set search_path = public as $$
declare
  v_week jsonb; v_client uuid; v_nieuw jsonb := '{}'; v_map jsonb := '{}';
  r record; n int := 0; v_actief boolean; v_oud jsonb; v_rij record;
begin
  if not rls_is_coach() then raise exception 'alleen voor coaches'; end if;
  select week_structure, client_id into v_week, v_client from workout_schemas where id = p_schema_id for update;
  if v_week is null or v_client is null then raise exception 'plan niet gevonden of geen klantplan'; end if;
  if not v_week ? p_dag_key then raise exception 'dag bestaat niet'; end if;
  if exists (select 1 from jsonb_object_keys(v_week) k where k !~ '^dag[0-9]+$') then raise exception 'onbekende dagindeling'; end if;
  if (select count(*) from jsonb_object_keys(v_week)) < 2 then raise exception 'laatste dag van het plan'; end if;

  -- Dagen hernummeren: de builder schrijft altijd dag1..dagN.
  for r in select key, value from jsonb_each(v_week) where key <> p_dag_key order by substring(key from 4)::int loop
    n := n + 1;
    v_nieuw := v_nieuw || jsonb_build_object('dag' || n, r.value);
    v_map := v_map || jsonb_build_object(r.key, 'dag' || n);
  end loop;
  update workout_schemas set week_structure = v_nieuw, days_per_week = n, updated_at = now() where id = p_schema_id;

  select assigned_schema_id = p_schema_id into v_actief from clients where id = v_client;

  -- Rooster en vooruit geplande weken meenemen.
  select workout_schedule into v_oud from clients where id = v_client;
  if v_oud is not null then
    update clients set workout_schedule = public._plandag_rooster(v_oud, p_schema_id, p_dag_key, v_map, coalesce(v_actief, false)), updated_at = now() where id = v_client;
  end if;
  for v_rij in select client_id, week_start, schedule from client_week_schedules where client_id = v_client loop
    update client_week_schedules set schedule = public._plandag_rooster(v_rij.schedule, p_schema_id, p_dag_key, v_map, coalesce(v_actief, false))
    where client_id = v_rij.client_id and week_start = v_rij.week_start;
  end loop;

  -- Wissels per week horen bij de dagsleutel. Oplopend, dan botst de unieke index niet.
  delete from client_exercise_overrides where schema_id = p_schema_id and day_key = p_dag_key;
  for r in select key, value #>> '{}' as nieuw from jsonb_each(v_map) where key <> value #>> '{}' order by substring(key from 4)::int loop
    update client_exercise_overrides set day_key = r.nieuw where schema_id = p_schema_id and day_key = r.key;
  end loop;
end $$;

create or replace function public._plandag_rooster(p_rooster jsonb, p_schema_id uuid, p_dag_key text, p_map jsonb, p_actief boolean)
returns jsonb language sql immutable set search_path = public as $$
  select coalesce(jsonb_object_agg(e.key, to_jsonb(e.nieuw)), '{}'::jsonb) from (
    select r.key, case
      when p_actief and r.value #>> '{}' ~ '^dag[0-9]+$' then coalesce(p_map ->> (r.value #>> '{}'), r.value #>> '{}')
      when r.value #>> '{}' like 'plan_' || p_schema_id::text || '__%' then 'plan_' || p_schema_id::text || '__' || (p_map ->> split_part(r.value #>> '{}', '__', 2))
      else r.value #>> '{}' end as nieuw
    from jsonb_each(p_rooster) r
    where not ((p_actief and r.value #>> '{}' = p_dag_key) or r.value #>> '{}' = 'plan_' || p_schema_id::text || '__' || p_dag_key)
  ) e
$$;
revoke all on function public.verwijder_plandag(uuid, text) from public, anon;
grant execute on function public.verwijder_plandag(uuid, text) to authenticated;


create or replace function public._plandagen_rooster(p_rooster jsonb, p_schema_id uuid, p_map jsonb, p_actief boolean)
returns jsonb language sql immutable set search_path = public as $$
  with r as (
    select e.key, e.value #>> '{}' as v from jsonb_each(p_rooster) e
  ), m as (
    select key,
      case when p_actief and v ~ '^dag[0-9]+$' then p_map ->> v
           when v like 'plan_' || p_schema_id::text || '\_\_%' then
             case when p_map ? split_part(v, '__', 2) then 'plan_' || p_schema_id::text || '__' || (p_map ->> split_part(v, '__', 2)) end
           else v end as nieuw
    from r
  ), g as (
    select key, nieuw, row_number() over (partition by split_part(key, '#', 1) order by coalesce(nullif(split_part(key, '#', 2), '')::int, 0)) rn
    from m where nieuw is not null
  )
  select coalesce(jsonb_object_agg(case when rn = 1 then split_part(key, '#', 1) else key end, to_jsonb(nieuw)), '{}'::jsonb) from g
$$;

create or replace function public.bewaar_plan_dagen(p_schema_id uuid, p_week jsonb, p_map jsonb)
returns void language plpgsql set search_path = public as $$
declare k record; w record; v_actief boolean;
begin
  if not rls_is_coach() then raise exception 'alleen voor coaches'; end if;
  perform 1 from workout_schemas where id = p_schema_id for update;
  if not found then raise exception 'plan niet gevonden'; end if;
  update workout_schemas set week_structure = p_week, days_per_week = (select count(*) from jsonb_object_keys(p_week)), updated_at = now() where id = p_schema_id;
  -- Geen bekende oude dagen meegegeven: rooster en wissels niet aanraken (oude gedrag),
  -- anders zou een lege map het hele rooster leeggooien.
  if p_map is null or p_map = '{}'::jsonb then return; end if;

  for k in select c.id, c.workout_schedule, c.assigned_schema_id = p_schema_id as actief from clients c
           where c.assigned_schema_id = p_schema_id or c.id = (select client_id from workout_schemas where id = p_schema_id) loop
    v_actief := coalesce(k.actief, false);
    if jsonb_typeof(k.workout_schedule) = 'object' and k.workout_schedule is distinct from _plandagen_rooster(k.workout_schedule, p_schema_id, p_map, v_actief) then
      update clients set workout_schedule = _plandagen_rooster(k.workout_schedule, p_schema_id, p_map, v_actief), updated_at = now() where id = k.id;
    end if;
    for w in select week_start, schedule from client_week_schedules where client_id = k.id and jsonb_typeof(schedule) = 'object' loop
      if w.schedule is distinct from _plandagen_rooster(w.schedule, p_schema_id, p_map, v_actief) then
        update client_week_schedules set schedule = _plandagen_rooster(w.schedule, p_schema_id, p_map, v_actief) where client_id = k.id and week_start = w.week_start;
      end if;
    end loop;
  end loop;

  delete from client_exercise_overrides where schema_id = p_schema_id and not p_map ? day_key;
  update client_exercise_overrides o set day_key = '~' || (p_map ->> o.day_key) where o.schema_id = p_schema_id;
  update client_exercise_overrides set day_key = substr(day_key, 2) where schema_id = p_schema_id and day_key like '~%';
end $$;
revoke all on function public.bewaar_plan_dagen(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.bewaar_plan_dagen(uuid, jsonb, jsonb) to authenticated;

