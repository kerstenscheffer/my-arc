-- Elke wijziging die een KLANT zelf in zijn workout- of maaltijdplan zet,
-- met alleen de gewijzigde dagen (oud en nieuw). De coach kan dat per
-- wijziging terugzetten via zet_planwijziging_terug(). Sinds 20 okt 2026.
create table if not exists public.client_plan_versies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  soort text not null check (soort in ('workout', 'meal')),
  plan_id uuid not null,
  oud jsonb not null,      -- { dag: oude dag-inhoud }  (+ '_pre_workout_meal' bij meal)
  nieuw jsonb not null,
  created_at timestamptz not null default now(),
  teruggezet_at timestamptz,
  teruggezet_door uuid
);
create index if not exists cpv_client_tijd on public.client_plan_versies (client_id, created_at desc);
alter table public.client_plan_versies enable row level security;
drop policy if exists cpv_select on public.client_plan_versies;
create policy cpv_select on public.client_plan_versies for select to authenticated
  using (client_id in (select c.id from clients c where c.coach_id = auth.uid() or c.trainer_id = auth.uid()
    or c.coach_id in (select o.coach_id from coach_team_members m join coach_team_members o on o.team_id = m.team_id where m.coach_id = auth.uid())));

create or replace function public.log_klant_planwijziging() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare
  v_client uuid;
  v_oud jsonb := '{}'; v_nieuw jsonb := '{}';
  k text;
begin
  if tg_table_name = 'client_meal_plans' then
    select id into v_client from clients where id = new.client_id and auth_user_id = auth.uid();
  else
    select id into v_client from clients where auth_user_id = auth.uid()
      and (id = new.client_id or assigned_schema_id = new.id) limit 1;
  end if;
  if v_client is null then return new; end if; -- alleen wijzigingen door de klant zelf

  if jsonb_typeof(old.week_structure) = 'object' and jsonb_typeof(new.week_structure) = 'object' then
    for k in select jsonb_object_keys(old.week_structure) union select jsonb_object_keys(new.week_structure) loop
      if old.week_structure -> k is distinct from new.week_structure -> k then
        v_oud := v_oud || jsonb_build_object(k, coalesce(old.week_structure -> k, 'null'::jsonb));
        v_nieuw := v_nieuw || jsonb_build_object(k, coalesce(new.week_structure -> k, 'null'::jsonb));
      end if;
    end loop;
  end if;
  if tg_table_name = 'client_meal_plans' and new.pre_workout_meal is distinct from old.pre_workout_meal then
    v_oud := v_oud || jsonb_build_object('_pre_workout_meal', coalesce(old.pre_workout_meal, 'null'::jsonb));
    v_nieuw := v_nieuw || jsonb_build_object('_pre_workout_meal', coalesce(new.pre_workout_meal, 'null'::jsonb));
  end if;
  if v_oud = '{}'::jsonb then return new; end if;

  insert into client_plan_versies (client_id, soort, plan_id, oud, nieuw)
  values (v_client, case when tg_table_name = 'client_meal_plans' then 'meal' else 'workout' end, new.id, v_oud, v_nieuw);
  return new;
end $$;

drop trigger if exists trg_klant_planwijziging on public.workout_schemas;
create trigger trg_klant_planwijziging after update of week_structure on public.workout_schemas
  for each row execute function public.log_klant_planwijziging();
drop trigger if exists trg_klant_planwijziging on public.client_meal_plans;
create trigger trg_klant_planwijziging after update of week_structure, pre_workout_meal on public.client_meal_plans
  for each row execute function public.log_klant_planwijziging();

-- Terugzetten: per gewijzigde dag de oude inhoud terug, maar alleen als die
-- dag sindsdien niet nog eens veranderd is (anders eerst de latere terugzetten).
create or replace function public.zet_planwijziging_terug(p_id uuid) returns text
language plpgsql security definer set search_path to 'public' as $$
declare
  v record; v_week jsonb; v_pre jsonb; k text; v_coach boolean;
begin
  select * into v from client_plan_versies where id = p_id;
  if v is null then return 'niet gevonden'; end if;
  if v.teruggezet_at is not null then return 'al teruggezet'; end if;
  select exists (select 1 from clients c where c.id = v.client_id and (c.coach_id = auth.uid() or c.trainer_id = auth.uid()
    or c.coach_id in (select o.coach_id from coach_team_members m join coach_team_members o on o.team_id = m.team_id where m.coach_id = auth.uid())))
    into v_coach;
  if not v_coach then return 'geen toegang'; end if;

  if v.soort = 'meal' then
    select week_structure, pre_workout_meal into v_week, v_pre from client_meal_plans where id = v.plan_id for update;
  else
    select week_structure into v_week from workout_schemas where id = v.plan_id for update;
  end if;
  if not found then return 'plan bestaat niet meer'; end if;

  for k in select jsonb_object_keys(v.nieuw) loop
    if k = '_pre_workout_meal' then
      if coalesce(v_pre, 'null'::jsonb) is distinct from v.nieuw -> k then return 'later nog aangepast'; end if;
    elsif coalesce(v_week -> k, 'null'::jsonb) is distinct from v.nieuw -> k then
      return 'later nog aangepast';
    end if;
  end loop;

  for k in select jsonb_object_keys(v.oud) loop
    if k = '_pre_workout_meal' then
      v_pre := nullif(v.oud -> k, 'null'::jsonb);
    elsif v.oud -> k = 'null'::jsonb then
      v_week := v_week - k;
    else
      v_week := jsonb_set(v_week, array[k], v.oud -> k, true);
    end if;
  end loop;

  if v.soort = 'meal' then
    update client_meal_plans set week_structure = v_week, pre_workout_meal = v_pre, updated_at = now() where id = v.plan_id;
  else
    update workout_schemas set week_structure = v_week, updated_at = now() where id = v.plan_id;
  end if;
  update client_plan_versies set teruggezet_at = now(), teruggezet_door = auth.uid() where id = p_id;
  return 'ok';
end $$;
revoke all on function public.zet_planwijziging_terug(uuid) from public, anon;
grant execute on function public.zet_planwijziging_terug(uuid) to authenticated;
