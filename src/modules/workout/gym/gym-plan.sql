-- Plan per sportschool (13 nov 2026, Kersten): een klant kan per sportschool
-- een eigen workoutplan hebben (High Five, Basic Fit, Thuis). Wisselt hij van
-- sportschool, dan wisselt zijn actieve plan mee.
--
-- Alleen toevoegen: twee kolommen, één extra policy, twee triggers. Het
-- wisselen gebeurt in de database en niet in de app, zodat het ook werkt voor
-- klanten op een oudere app-versie (die zetten alleen clients.actieve_gym_id).
--
-- Regels:
--  * client_gyms.schema_id = het plan van die sportschool (leeg = geen eigen plan).
--  * Wisselt de klant naar een sportschool mét plan, dan wordt dat het actieve
--    plan, met de weekindeling die bij die sportschool hoorde.
--  * De sportschool waar hij vandaan komt onthoudt het plan en de weekindeling
--    die hij daar had, zodat terugwisselen alles terugzet.
--  * Naar een sportschool zonder plan: er verandert niets aan het plan.
--  * Zet de coach (of de klant) zelf een ander plan actief, dan volgt de
--    koppeling van de sportschool waar hij op dat moment staat.
--  * Geen melding "nieuw plan" bij een gymwissel: de trigger wijzigt de rij
--    zelf, waardoor de meldingstrigger (UPDATE OF assigned_schema_id) niet vuurt.

alter table public.client_gyms add column if not exists schema_id uuid references public.workout_schemas(id) on delete set null;
alter table public.client_gyms add column if not exists workout_schedule jsonb;

-- De coach mag de sportscholen van zijn klanten zien en beheren (stond alleen
-- open voor de klant zelf en de trainer).
drop policy if exists client_gyms_coach on public.client_gyms;
create policy client_gyms_coach on public.client_gyms for all to authenticated
  using (client_id in (select c.id from clients c where c.coach_id = auth.uid() or c.trainer_id = auth.uid()
    or c.coach_id in (select o.coach_id from coach_team_members m join coach_team_members o on o.team_id = m.team_id where m.coach_id = auth.uid())))
  with check (client_id in (select c.id from clients c where c.coach_id = auth.uid() or c.trainer_id = auth.uid()
    or c.coach_id in (select o.coach_id from coach_team_members m join coach_team_members o on o.team_id = m.team_id where m.coach_id = auth.uid())));

-- Gymwissel: plan mee laten wisselen.
create or replace function public.trg_gym_wissel_plan() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare g record;
begin
  begin
    if new.actieve_gym_id is not distinct from old.actieve_gym_id or new.actieve_gym_id is null then return new; end if;
    -- Zette dezelfde schrijfactie zelf al een ander plan, dan wint die.
    if new.assigned_schema_id is distinct from old.assigned_schema_id then return new; end if;

    -- De sportschool waar hij vandaan komt: weekindeling bijwerken als die bij dit plan hoort.
    if old.actieve_gym_id is not null then
      update client_gyms set workout_schedule = old.workout_schedule, updated_at = now()
       where id = old.actieve_gym_id and client_id = new.id and schema_id is not null and schema_id = old.assigned_schema_id;
    end if;

    select schema_id, workout_schedule into g from client_gyms where id = new.actieve_gym_id and client_id = new.id;
    if g.schema_id is null or g.schema_id is not distinct from old.assigned_schema_id then return new; end if;
    -- Het plan moet nog bestaan. Niet strenger: het plan dat een klant al volgde
    -- kan een gedeeld plan zijn dat niet op zijn naam staat.
    if not exists (select 1 from workout_schemas s where s.id = g.schema_id) then return new; end if;

    -- Had de vorige sportschool nog geen plan, dan onthoudt hij nu wat er liep.
    if old.actieve_gym_id is not null and old.assigned_schema_id is not null then
      update client_gyms set schema_id = old.assigned_schema_id, workout_schedule = old.workout_schedule, updated_at = now()
       where id = old.actieve_gym_id and client_id = new.id and schema_id is null;
    end if;

    new.assigned_schema_id := g.schema_id;
    if g.workout_schedule is not null and jsonb_typeof(g.workout_schedule) = 'object' and g.workout_schedule <> '{}'::jsonb then
      new.workout_schedule := g.workout_schedule;
    end if;
  exception when others then
    null; -- een gymwissel mag nooit mislukken door de plankoppeling
  end;
  return new;
end $$;
drop trigger if exists trg_gym_wissel_plan on public.clients;
create trigger trg_gym_wissel_plan before update of actieve_gym_id on public.clients
  for each row execute function public.trg_gym_wissel_plan();

-- Ander plan actief gezet (builder, planwissel van de klant): de sportschool
-- waar hij nu staat volgt, als die een eigen plan had.
create or replace function public.trg_gym_volgt_plan() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  begin
    if new.assigned_schema_id is distinct from old.assigned_schema_id
       and new.assigned_schema_id is not null and new.actieve_gym_id is not null then
      update client_gyms set schema_id = new.assigned_schema_id, workout_schedule = new.workout_schedule, updated_at = now()
       where id = new.actieve_gym_id and client_id = new.id and schema_id is not null;
    end if;
  exception when others then
    null;
  end;
  return new;
end $$;
drop trigger if exists trg_gym_volgt_plan on public.clients;
create trigger trg_gym_volgt_plan after update of assigned_schema_id on public.clients
  for each row execute function public.trg_gym_volgt_plan();

-- Plangeschiedenis: ook een planwissel via de sportschool vastleggen. De
-- trigger hing aan UPDATE OF assigned_schema_id en vuurt dan niet, omdat de
-- gymwissel het plan in een BEFORE-trigger zet. De functie zelf kijkt al of
-- het plan echt veranderde.
drop trigger if exists trg_plan_historie_toewijzing on public.clients;
create trigger trg_plan_historie_toewijzing after update on public.clients
  for each row execute function public.trg_plan_historie_toewijzing();
