-- Plangeschiedenis workout (13 nov 2026, Kersten): elke wijziging in het
-- workoutplan van een klant bewaren, zodat terug te zien is wat iemands plan
-- rond een bepaalde datum was.
--
-- Eén rij = het HELE plan zoals het na de wijziging was. "Plan op datum X" is
-- dan gewoon de laatste rij van die klant met created_at <= X. Wijzigingen
-- van dezelfde persoon binnen 10 minuten vallen samen in één rij (de laatste
-- stand telt), anders levert elke set die een klant aanpast een eigen rij op.
--
-- Alleen toevoegen: nieuwe tabel + twee triggers. De triggers vangen elke fout
-- zelf op, zodat plan opslaan nooit kan mislukken door de geschiedenis.

create table if not exists public.workout_plan_historie (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  schema_id uuid not null,
  naam text,
  week_structure jsonb not null,
  cyclus jsonb,
  gebeurtenis text not null default 'gewijzigd',  -- 'start' | 'gewijzigd' | 'toegewezen'
  door uuid,                                       -- auth.uid() van wie het deed, null = systeem
  door_rol text not null default 'coach',          -- 'coach' | 'klant' | 'systeem'
  created_at timestamptz not null default now(),
  bijgewerkt_at timestamptz not null default now()
);
create index if not exists wph_client_tijd on public.workout_plan_historie (client_id, created_at desc);
create index if not exists wph_schema_tijd on public.workout_plan_historie (schema_id, created_at desc);

alter table public.workout_plan_historie enable row level security;
drop policy if exists wph_select on public.workout_plan_historie;
create policy wph_select on public.workout_plan_historie for select to authenticated
  using (client_id in (select c.id from clients c where c.coach_id = auth.uid() or c.trainer_id = auth.uid()
    or c.coach_id in (select o.coach_id from coach_team_members m join coach_team_members o on o.team_id = m.team_id where m.coach_id = auth.uid())));

-- Eén stand vastleggen voor één klant.
create or replace function public.bewaar_plan_stand(p_client uuid, p_schema uuid, p_gebeurtenis text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  s record; v_laatste record; v_rol text; v_uid uuid := auth.uid();
begin
  select id, name, week_structure, cyclus into s from workout_schemas where id = p_schema;
  if s.id is null or s.week_structure is null then return; end if;

  v_rol := case
    when v_uid is null then 'systeem'
    when exists (select 1 from clients where id = p_client and auth_user_id = v_uid) then 'klant'
    else 'coach' end;

  select * into v_laatste from workout_plan_historie
   where client_id = p_client order by created_at desc limit 1;

  -- Niets veranderd ten opzichte van de laatste stand: geen nieuwe rij.
  if v_laatste.id is not null and v_laatste.schema_id = p_schema
     and v_laatste.week_structure = s.week_structure
     and v_laatste.naam is not distinct from s.name
     and v_laatste.cyclus is not distinct from s.cyclus then
    return;
  end if;

  -- Zelfde persoon, zelfde plan, binnen 10 minuten: de bestaande rij bijwerken.
  if p_gebeurtenis = 'gewijzigd' and v_laatste.id is not null and v_laatste.schema_id = p_schema
     and v_laatste.gebeurtenis = 'gewijzigd' and v_laatste.door is not distinct from v_uid
     and v_laatste.bijgewerkt_at > now() - interval '10 minutes' then
    update workout_plan_historie
       set naam = s.name, week_structure = s.week_structure, cyclus = s.cyclus, bijgewerkt_at = now()
     where id = v_laatste.id;
    return;
  end if;

  insert into workout_plan_historie (client_id, schema_id, naam, week_structure, cyclus, gebeurtenis, door, door_rol)
  values (p_client, p_schema, s.name, s.week_structure, s.cyclus, p_gebeurtenis, v_uid, v_rol);
end $$;
revoke all on function public.bewaar_plan_stand(uuid, uuid, text) from public, anon, authenticated;

-- Plan zelf gewijzigd (door coach, klant of systeem).
create or replace function public.trg_plan_historie_schema() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare c record;
begin
  begin
    -- Alleen het plan dat een klant nu volgt; sjablonen en reserveplannen niet.
    for c in select id from clients where assigned_schema_id = new.id loop
      perform bewaar_plan_stand(c.id, new.id, 'gewijzigd');
    end loop;
  exception when others then
    null; -- de geschiedenis mag het opslaan van een plan nooit breken
  end;
  return new;
end $$;
drop trigger if exists trg_plan_historie on public.workout_schemas;
create trigger trg_plan_historie after update of week_structure, name, cyclus on public.workout_schemas
  for each row execute function public.trg_plan_historie_schema();

-- Klant krijgt een ander plan toegewezen (of wisselt zelf).
create or replace function public.trg_plan_historie_toewijzing() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  begin
    if new.assigned_schema_id is not null and new.assigned_schema_id is distinct from old.assigned_schema_id then
      perform bewaar_plan_stand(new.id, new.assigned_schema_id, 'toegewezen');
    end if;
  exception when others then
    null;
  end;
  return new;
end $$;
drop trigger if exists trg_plan_historie_toewijzing on public.clients;
create trigger trg_plan_historie_toewijzing after update of assigned_schema_id on public.clients
  for each row execute function public.trg_plan_historie_toewijzing();

-- Beginstand: het plan dat elke klant nu volgt, zodat de geschiedenis vandaag start.
insert into public.workout_plan_historie (client_id, schema_id, naam, week_structure, cyclus, gebeurtenis, door, door_rol)
select c.id, s.id, s.name, s.week_structure, s.cyclus, 'start', null, 'systeem'
  from clients c join workout_schemas s on s.id = c.assigned_schema_id
 where s.week_structure is not null
   and not exists (select 1 from workout_plan_historie h where h.client_id = c.id);
