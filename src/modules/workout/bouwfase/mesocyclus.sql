-- ─────────────────────────────────────────────────────────────────────────────
-- VOORSTEL, NOG NIET UITGEVOERD (13 nov 2026). Wacht op go van Kersten.
--
-- Mesocyclus + deload + gemeten TDEE, bovenop de bestaande bouwfase
-- (training_fases). Alleen toevoegen: bestaande rijen en oude app-versies
-- blijven werken. Een rij zonder `nummer` is een oude bouwfase en gedraagt zich
-- zoals altijd (deload op datum, zonder schema- of macrowissel).
--
-- Wat een deload bij een NIEUWE mesocyclus doet:
--   * het deload-schema (kopie met halve sets en reps) wordt het actieve plan;
--   * de weekindeling blijft staan (zelfde dagen, zelfde dagnummers);
--   * in een cut gaan de kcal naar onderhoud, het verschil komt bij koolhydraten;
--   * de klant krijgt GEEN melding "nieuw trainingsschema": de app toont overal
--     "Deload week";
--   * de sportschoolkoppeling (gym-plan.sql) neemt het deload-schema niet over;
--   * einde deload zet schema, weekindeling en macro's terug.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Mesocyclus-velden op de fase. Allemaal leeg voor bestaande rijen.
alter table public.training_fases add column if not exists nummer int;
alter table public.training_fases add column if not exists client_phase_id uuid;        -- de cut of build waar hij onder valt
alter table public.training_fases add column if not exists deload_schema_id uuid references public.workout_schemas(id) on delete set null;
alter table public.training_fases add column if not exists schema_voor_deload uuid;     -- om terug te zetten
alter table public.training_fases add column if not exists rooster_voor_deload jsonb;   -- om terug te zetten
alter table public.training_fases add column if not exists macros_voor_deload jsonb;    -- { calories, protein, carbs, fat }
alter table public.training_fases add column if not exists deload_gestart_op date;
alter table public.training_fases add column if not exists afgerond_op date;
alter table public.training_fases add column if not exists deload_reden text;           -- 'gepland' | 'eerder: prestatie' | 'eerder: herstel'

-- 2. Een deload-schema herkennen: het wijst naar het plan waar het van afgeleid is.
alter table public.workout_schemas add column if not exists deload_van uuid references public.workout_schemas(id) on delete set null;

-- Mag deze gebruiker bij deze klant (coach, trainer of teamgenoot)?
create or replace function public.is_coach_van(p_client uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from clients c where c.id = p_client and (c.coach_id = auth.uid() or c.trainer_id = auth.uid()
    or c.coach_id in (select o.coach_id from coach_team_members m join coach_team_members o on o.team_id = m.team_id where m.coach_id = auth.uid())))
$$;

-- 3. Geen melding "nieuw trainingsschema" bij de wissel van en naar een deload.
--    Verder ongewijzigd ten opzichte van de bestaande functie.
create or replace function public.notify_client_new_workout_plan() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
declare
  plan_naam text;
begin
  if new.assigned_schema_id is null
     or new.assigned_schema_id is not distinct from old.assigned_schema_id then
    return new;
  end if;
  -- Deload erin of eruit: de app toont "Deload week", geen losse melding.
  if exists (select 1 from workout_schemas where id in (new.assigned_schema_id, old.assigned_schema_id) and deload_van is not null) then
    return new;
  end if;

  select name into plan_naam from workout_schemas where id = new.assigned_schema_id;

  insert into notifications (client_id, coach_id, type, title, message, page_context, priority, source)
  values (
    new.id, new.trainer_id, 'workout',
    'Nieuw trainingsschema',
    coalesce('Je coach heeft "' || plan_naam || '" voor je klaargezet.',
             'Je coach heeft een nieuw trainingsschema voor je klaargezet.'),
    'workout', 'normal', 'auto'
  );
  return new;
end;
$function$;

-- 4. De sportschool waar de klant staat neemt een deload-schema niet over als
--    "zijn plan", en ook het terugzetten erna raakt de koppeling niet.
create or replace function public.trg_gym_volgt_plan() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  begin
    if new.assigned_schema_id is distinct from old.assigned_schema_id
       and new.assigned_schema_id is not null and new.actieve_gym_id is not null
       and not exists (select 1 from workout_schemas where id in (new.assigned_schema_id, old.assigned_schema_id) and deload_van is not null) then
      update client_gyms set schema_id = new.assigned_schema_id, workout_schedule = new.workout_schedule, updated_at = now()
       where id = new.actieve_gym_id and client_id = new.id and schema_id is not null;
    end if;
  exception when others then
    null;
  end;
  return new;
end $$;

-- 5. Deload starten. p_kcal: de nieuwe kcal (onderhoud) als de klant in een cut
--    zit; leeg = macro's blijven zoals ze zijn. De app rekent p_kcal uit (gemeten
--    TDEE bij betrouwbaarheid hoog, anders clients.tdee).
create or replace function public.start_deload(p_fase uuid, p_kcal int default null, p_reden text default 'gepland')
returns text language plpgsql security definer set search_path to 'public' as $$
declare f record; c record; v_extra int;
begin
  select * into f from training_fases where id = p_fase;
  if f.id is null then return 'fase niet gevonden'; end if;
  if not is_coach_van(f.client_id) then return 'geen toegang'; end if;
  if f.deload_gestart_op is not null then return 'deload loopt al'; end if;
  if f.deload_schema_id is null then return 'nog geen deload-schema'; end if;

  select assigned_schema_id, workout_schedule, target_calories, target_protein, target_carbs, target_fat
    into c from clients where id = f.client_id for update;

  update training_fases set
    schema_voor_deload = c.assigned_schema_id, rooster_voor_deload = c.workout_schedule,
    macros_voor_deload = jsonb_build_object('calories', c.target_calories, 'protein', c.target_protein, 'carbs', c.target_carbs, 'fat', c.target_fat),
    deload_gestart_op = current_date, deload_reden = p_reden, updated_at = now()
  where id = p_fase;

  -- Twee stappen: het plan wisselen zet de weekindeling op standaard, daarna
  -- zetten we de eigen indeling van de klant terug (zelfde dagnummers).
  update clients set assigned_schema_id = f.deload_schema_id, updated_at = now() where id = f.client_id;
  update clients set workout_schedule = c.workout_schedule where id = f.client_id;

  -- Cut: kcal naar onderhoud, eiwit en vet gelijk, het verschil naar koolhydraten.
  if p_kcal is not null and c.target_calories is not null and p_kcal > c.target_calories then
    v_extra := p_kcal - c.target_calories;
    update clients set target_calories = p_kcal,
           target_carbs = coalesce(target_carbs, 0) + round(v_extra / 4.0)
     where id = f.client_id;
  end if;
  return 'ok';
end $$;
revoke all on function public.start_deload(uuid, int, text) from public, anon;
grant execute on function public.start_deload(uuid, int, text) to authenticated;

-- 6. Deload beëindigen: schema, weekindeling en macro's terug, mesocyclus dicht.
create or replace function public.eind_deload(p_fase uuid)
returns text language plpgsql security definer set search_path to 'public' as $$
declare f record;
begin
  select * into f from training_fases where id = p_fase;
  if f.id is null then return 'fase niet gevonden'; end if;
  if not is_coach_van(f.client_id) then return 'geen toegang'; end if;
  if f.deload_gestart_op is null then return 'deload is niet gestart'; end if;
  if f.afgerond_op is not null then return 'al afgerond'; end if;

  -- Alleen terugzetten als de klant nog op het deload-schema staat; heeft de
  -- coach intussen zelf een nieuw plan actief gezet, dan blijft dat staan.
  if f.schema_voor_deload is not null
     and exists (select 1 from clients where id = f.client_id and assigned_schema_id = f.deload_schema_id) then
    update clients set assigned_schema_id = f.schema_voor_deload, updated_at = now() where id = f.client_id;
    if f.rooster_voor_deload is not null then
      update clients set workout_schedule = f.rooster_voor_deload where id = f.client_id;
    end if;
  end if;
  if f.macros_voor_deload is not null then
    update clients set
      target_calories = (f.macros_voor_deload->>'calories')::numeric,
      target_protein  = (f.macros_voor_deload->>'protein')::numeric,
      target_carbs    = (f.macros_voor_deload->>'carbs')::numeric,
      target_fat      = (f.macros_voor_deload->>'fat')::numeric
    where id = f.client_id;
  end if;

  update training_fases set afgerond_op = current_date, actief = false, updated_at = now() where id = p_fase;
  return 'ok';
end $$;
revoke all on function public.eind_deload(uuid) from public, anon;
grant execute on function public.eind_deload(uuid) to authenticated;

-- 7. Gemeten TDEE: één plek die de kcal per dag telt, op Nederlandse tijd.
--    (De bestaande schatting knipte de dag uit de UTC-tijd: een maaltijd net na
--    middernacht viel dan op de vorige dag.) Leest met de rechten van de
--    aanroeper, dus alleen eigen klanten.
create or replace function public.kcal_per_dag(p_client uuid, p_van date, p_tot date)
returns table (dag date, kcal numeric, eiwit numeric, logs int)
language sql stable security invoker set search_path to 'public' as $$
  select (consumed_at at time zone 'Europe/Amsterdam')::date as dag,
         sum(coalesce(calories, 0))::numeric, sum(coalesce(protein, 0))::numeric, count(*)::int
    from consumed_meals
   where client_id = p_client
     and consumed_at >= (p_van::timestamp at time zone 'Europe/Amsterdam')
     and consumed_at <  ((p_tot + 1)::timestamp at time zone 'Europe/Amsterdam')
   group by 1 order by 1
$$;
grant execute on function public.kcal_per_dag(uuid, date, date) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. OPTIONEEL, alleen als de deload vanzelf bij de cyclus hoort (zie vraag in
--    het gesprek): elke nacht om 03:10 de deload starten op de geplande dag en
--    beëindigen na het aantal deload-dagen. Alleen voor nieuwe mesocycli
--    (nummer gevuld). De macro's in een cut wisselen dan NIET vanzelf mee:
--    de nachtrun kent de gemeten TDEE niet; dat blijft de knop van de coach.
--
-- create or replace function public.mesocyclus_nachtrun() returns void ... (volgt na go)
-- select cron.schedule('mesocyclus-nachtrun', '10 3 * * *', $$select public.mesocyclus_nachtrun()$$);
-- ─────────────────────────────────────────────────────────────────────────────
