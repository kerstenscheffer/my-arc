-- ─────────────────────────────────────────────────────────────────────────────
-- Mesocyclus + deload + gemeten TDEE, bovenop de bestaande bouwfase
-- (training_fases). Uitgevoerd op 13 nov 2026 na akkoord van Kersten.
--
-- Alleen toevoegen: bestaande rijen en oude app-versies blijven werken. Een rij
-- zonder `nummer` is een oude bouwfase en gedraagt zich zoals altijd (deload
-- op datum, zonder schema- of macrowissel).
--
-- Wat een deload bij een NIEUWE mesocyclus doet:
--   * het deload-schema (kopie met halve sets en reps) wordt het actieve plan;
--   * de weekindeling blijft staan (zelfde dagen, zelfde dagnummers);
--   * in een cut gaan de kcal naar onderhoud, het verschil komt bij koolhydraten
--     (alleen via de knop van de coach: de nachtrun kent de gemeten TDEE niet);
--   * de klant krijgt GEEN melding "nieuw trainingsschema": de app toont overal
--     "Deload week";
--   * de sportschoolkoppeling (gym-plan.sql) neemt het deload-schema niet over;
--   * einde deload zet schema, weekindeling en macro's terug.
-- De deload start vanzelf op de geplande dag en eindigt na deload_dagen
-- (mesocyclus_nachtrun, elke nacht). Eerder starten kan met de knop.
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

-- 5. Het deload-schema: een kopie van het plan met halve sets en halve reps.
--    Reps: "8-12" → "4-6", "10" → "5"; iets als "tot falen" blijft staan.
create or replace function public.deload_reps(p text) returns text
language plpgsql immutable as $$
declare m text[];
begin
  if p ~ '^\s*\d+\s*$' then return ceil(trim(p)::numeric / 2)::int::text; end if;
  m := regexp_match(p, '^\s*(\d+)\s*-\s*(\d+)\s*$');
  if m is not null then return ceil(m[1]::numeric / 2)::int::text || '-' || ceil(m[2]::numeric / 2)::int::text; end if;
  return p;
end $$;

-- p_week = week_structure van het plan; p_oud = het vorige deload-schema: de
-- oefeningen die de coach daar als "proberen" klaarzette blijven staan.
create or replace function public.deload_structuur(p_week jsonb, p_oud jsonb default null) returns jsonb
language plpgsql stable as $$
declare uit jsonb := '{}'::jsonb; k text; dag jsonb; oef jsonb; e jsonb; proberen jsonb;
begin
  for k in select jsonb_object_keys(p_week) loop
    dag := p_week -> k;
    if jsonb_typeof(dag) <> 'object' or jsonb_typeof(dag -> 'exercises') <> 'array' then
      uit := uit || jsonb_build_object(k, dag); continue;
    end if;
    oef := '[]'::jsonb;
    for e in select * from jsonb_array_elements(dag -> 'exercises') loop
      if e ->> 'type' = 'cardio' then oef := oef || jsonb_build_array(e); continue; end if;
      oef := oef || jsonb_build_array(e || jsonb_build_object(
        'sets', greatest(1, ceil(coalesce(nullif(e ->> 'sets', '')::numeric, 2) / 2)::int),
        'reps', deload_reps(coalesce(e ->> 'reps', '')),
        'notes', 'Helft van je normale gewicht. Moet makkelijk voelen.',
        'deload', true));
    end loop;
    -- Wat de coach klaarzette om te proberen, achteraan.
    select coalesce(jsonb_agg(x), '[]'::jsonb) into proberen
      from jsonb_array_elements(coalesce(p_oud -> k -> 'exercises', '[]'::jsonb)) x where (x ->> 'probeer')::boolean is true;
    uit := uit || jsonb_build_object(k, dag || jsonb_build_object('exercises', oef || proberen));
  end loop;
  return uit;
end $$;

-- Maakt het deload-schema voor een fase, of ververst het uit het plan dat nu loopt.
create or replace function public._maak_deload_schema(p_fase uuid) returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare f record; bron record; v_bron uuid; v_id uuid; v_oud jsonb;
begin
  select * into f from training_fases where id = p_fase;
  if f.id is null then return null; end if;
  -- Het plan dat de klant nu volgt; staat hij al op het deload-schema, dan het plan van ervoor.
  select assigned_schema_id into v_bron from clients where id = f.client_id;
  if v_bron is null or v_bron = f.deload_schema_id then v_bron := coalesce(f.schema_voor_deload, f.schema_id); end if;
  select * into bron from workout_schemas where id = v_bron;
  if bron.id is null or bron.week_structure is null then return f.deload_schema_id; end if;

  if f.deload_schema_id is not null then
    select week_structure into v_oud from workout_schemas where id = f.deload_schema_id;
  end if;
  if v_oud is not null then
    update workout_schemas set week_structure = deload_structuur(bron.week_structure, v_oud),
           name = coalesce(bron.name, 'Plan') || ' | DELOAD', deload_van = bron.id, cyclus = bron.cyclus, updated_at = now()
     where id = f.deload_schema_id;
    return f.deload_schema_id;
  end if;

  insert into workout_schemas (user_id, name, description, client_name, primary_goal, specific_goal, experience_level,
      days_per_week, time_per_session, equipment, split_type, split_name, week_structure, is_ai_generated, is_public,
      is_template, client_id, cyclus, deload_van)
  values (bron.user_id, coalesce(bron.name, 'Plan') || ' | DELOAD', bron.description, bron.client_name, bron.primary_goal, bron.specific_goal,
      bron.experience_level, bron.days_per_week, bron.time_per_session, bron.equipment, bron.split_type, bron.split_name,
      deload_structuur(bron.week_structure, null), false, false, false, f.client_id, bron.cyclus, bron.id)
  returning id into v_id;
  update training_fases set deload_schema_id = v_id, updated_at = now() where id = p_fase;
  return v_id;
end $$;
revoke all on function public._maak_deload_schema(uuid) from public, anon, authenticated;

create or replace function public.maak_deload_schema(p_fase uuid) returns uuid
language plpgsql security definer set search_path to 'public' as $$
begin
  if not is_coach_van((select client_id from training_fases where id = p_fase)) then return null; end if;
  return _maak_deload_schema(p_fase);
end $$;
revoke all on function public.maak_deload_schema(uuid) from public, anon;
grant execute on function public.maak_deload_schema(uuid) to authenticated;

-- 6. Deload starten. p_kcal: de nieuwe kcal (onderhoud) als de klant in een cut
--    zit; leeg = macro's blijven zoals ze zijn. De app rekent p_kcal uit (gemeten
--    TDEE bij betrouwbaarheid hoog, anders clients.tdee).
create or replace function public._start_deload(p_fase uuid, p_kcal int default null, p_reden text default 'gepland')
returns text language plpgsql security definer set search_path to 'public' as $$
declare f record; c record; v_extra int; v_deload uuid;
begin
  select * into f from training_fases where id = p_fase;
  if f.id is null then return 'fase niet gevonden'; end if;
  if f.deload_gestart_op is not null then return 'deload loopt al'; end if;
  -- Vers uit het plan zoals het nu is: sets die er in de bouwweken bij kwamen tellen mee.
  v_deload := _maak_deload_schema(p_fase);
  if v_deload is null then return 'geen plan om een deload van te maken'; end if;

  select assigned_schema_id, workout_schedule, target_calories, target_protein, target_carbs, target_fat
    into c from clients where id = f.client_id for update;

  update training_fases set
    schema_voor_deload = c.assigned_schema_id, rooster_voor_deload = c.workout_schedule,
    macros_voor_deload = jsonb_build_object('calories', c.target_calories, 'protein', c.target_protein, 'carbs', c.target_carbs, 'fat', c.target_fat),
    deload_gestart_op = (now() at time zone 'Europe/Amsterdam')::date, deload_reden = p_reden, updated_at = now()
  where id = p_fase;

  -- Twee stappen: het plan wisselen zet de weekindeling op standaard, daarna
  -- zetten we de eigen indeling van de klant terug (zelfde dagnummers).
  update clients set assigned_schema_id = v_deload, updated_at = now() where id = f.client_id;
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
revoke all on function public._start_deload(uuid, int, text) from public, anon, authenticated;

create or replace function public.start_deload(p_fase uuid, p_kcal int default null, p_reden text default 'gepland')
returns text language plpgsql security definer set search_path to 'public' as $$
begin
  if not is_coach_van((select client_id from training_fases where id = p_fase)) then return 'geen toegang'; end if;
  return _start_deload(p_fase, p_kcal, p_reden);
end $$;
revoke all on function public.start_deload(uuid, int, text) from public, anon;
grant execute on function public.start_deload(uuid, int, text) to authenticated;

-- 7. Deload beëindigen: schema, weekindeling en macro's terug, mesocyclus dicht.
create or replace function public._eind_deload(p_fase uuid)
returns text language plpgsql security definer set search_path to 'public' as $$
declare f record;
begin
  select * into f from training_fases where id = p_fase;
  if f.id is null then return 'fase niet gevonden'; end if;
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
  if f.macros_voor_deload is not null and (f.macros_voor_deload ->> 'calories') is not null then
    update clients set
      target_calories = (f.macros_voor_deload->>'calories')::numeric,
      target_protein  = (f.macros_voor_deload->>'protein')::numeric,
      target_carbs    = (f.macros_voor_deload->>'carbs')::numeric,
      target_fat      = (f.macros_voor_deload->>'fat')::numeric
    where id = f.client_id;
  end if;

  update training_fases set afgerond_op = (now() at time zone 'Europe/Amsterdam')::date, actief = false, updated_at = now() where id = p_fase;
  return 'ok';
end $$;
revoke all on function public._eind_deload(uuid) from public, anon, authenticated;

create or replace function public.eind_deload(p_fase uuid)
returns text language plpgsql security definer set search_path to 'public' as $$
begin
  if not is_coach_van((select client_id from training_fases where id = p_fase)) then return 'geen toegang'; end if;
  return _eind_deload(p_fase);
end $$;
revoke all on function public.eind_deload(uuid) from public, anon;
grant execute on function public.eind_deload(uuid) to authenticated;

-- 8. Nieuwe mesocyclus: sluit de vorige af, maakt de nieuwe (nummer + 1) en zet
--    het deload-schema alvast klaar, zodat de coach er oefeningen om te proberen
--    in kan zetten.
create or replace function public.start_mesocyclus(p_client uuid, p_schema uuid, p_start date, p_bouw int default 4, p_deload int default 7)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_nr int; v_id uuid; oud record;
begin
  if not is_coach_van(p_client) then raise exception 'geen toegang'; end if;
  for oud in select id, deload_gestart_op, afgerond_op from training_fases where client_id = p_client and actief loop
    if oud.deload_gestart_op is not null and oud.afgerond_op is null then perform _eind_deload(oud.id); end if;
    update training_fases set actief = false, afgerond_op = coalesce(afgerond_op, (now() at time zone 'Europe/Amsterdam')::date), updated_at = now() where id = oud.id;
  end loop;
  select greatest(coalesce(max(nummer), 0), count(*)) + 1 into v_nr from training_fases where client_id = p_client;
  insert into training_fases (client_id, coach_id, schema_id, start_datum, bouw_weken, deload_dagen, actief, nummer, client_phase_id)
  values (p_client, auth.uid(), p_schema, p_start, p_bouw, p_deload, true, v_nr,
          (select id from client_phases where client_id = p_client and ended_on is null order by started_on desc limit 1))
  returning id into v_id;
  perform _maak_deload_schema(v_id);
  return v_id;
end $$;
revoke all on function public.start_mesocyclus(uuid, uuid, date, int, int) from public, anon;
grant execute on function public.start_mesocyclus(uuid, uuid, date, int, int) to authenticated;

-- 9. Gemeten TDEE: één plek die de kcal per dag telt, op Nederlandse tijd.
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

-- 10. Nachtrun: de deload start op de geplande dag en eindigt na deload_dagen.
--     Alleen nieuwe mesocycli (nummer gevuld). Macro's wisselen hier niet mee.
create or replace function public.mesocyclus_nachtrun() returns void
language plpgsql security definer set search_path to 'public' as $$
declare f record; v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
begin
  for f in select * from training_fases where actief and nummer is not null and afgerond_op is null loop
    begin
      if f.deload_gestart_op is null and v_vandaag >= f.start_datum + f.bouw_weken * 7 then
        perform _start_deload(f.id, null, 'gepland');
      elsif f.deload_gestart_op is not null and v_vandaag >= f.deload_gestart_op + f.deload_dagen then
        perform _eind_deload(f.id);
      end if;
    exception when others then
      null; -- één klant mag de rest niet tegenhouden
    end;
  end loop;
end $$;
revoke all on function public.mesocyclus_nachtrun() from public, anon, authenticated;

select cron.unschedule('mesocyclus-nachtrun') where exists (select 1 from cron.job where jobname = 'mesocyclus-nachtrun');
select cron.schedule('mesocyclus-nachtrun', '10 2 * * *', $cron$select public.mesocyclus_nachtrun()$cron$);

-- 11. Gemeten TDEE in de database, zelfde regels als berekenGemetenTdee in de
--     app: 21 dagen, trendlijn door de wegingen, alleen volledig gelogde dagen
--     (>= 60% van het kcal-doel), deload-dagen tellen niet mee, minimaal 8
--     wegingen en 10 logdagen. Voor de nachtrun.
create or replace function public._gemeten_tdee(p_client uuid, p_dagen int default 21)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_tot date := (now() at time zone 'Europe/Amsterdam')::date;
  v_van date := v_tot - (p_dagen - 1);
  v_doel numeric; v_formule numeric; v_drempel numeric;
  v_weg int; v_helling numeric; v_log int; v_inname numeric; v_tdee numeric;
begin
  select target_calories, tdee into v_doel, v_formule from clients where id = p_client;
  v_drempel := case when coalesce(v_doel, 0) > 0 then v_doel * 0.6 else 1000 end;

  with deload as (
    select (coalesce(f.deload_gestart_op, case when f.nummer is null then f.start_datum + f.bouw_weken * 7 end) + i)::date dag
      from training_fases f, generate_series(0, greatest(f.deload_dagen, 1) - 1) i
     where f.client_id = p_client
       and coalesce(f.deload_gestart_op, case when f.nummer is null then f.start_datum + f.bouw_weken * 7 end) is not null
  )
  select count(*), regr_slope(w.weight, (w.date - v_van)::numeric) into v_weg, v_helling
    from weight_challenge_logs w
   where w.client_id = p_client and w.date between v_van and v_tot and w.weight > 0
     and w.date not in (select dag from deload);

  with deload as (
    select (coalesce(f.deload_gestart_op, case when f.nummer is null then f.start_datum + f.bouw_weken * 7 end) + i)::date dag
      from training_fases f, generate_series(0, greatest(f.deload_dagen, 1) - 1) i
     where f.client_id = p_client
       and coalesce(f.deload_gestart_op, case when f.nummer is null then f.start_datum + f.bouw_weken * 7 end) is not null
  ), d as (
    select (m.consumed_at at time zone 'Europe/Amsterdam')::date dag, sum(coalesce(m.calories, 0)) kcal
      from consumed_meals m
     where m.client_id = p_client
       and m.consumed_at >= (v_van::timestamp at time zone 'Europe/Amsterdam')
       and m.consumed_at <  ((v_tot + 1)::timestamp at time zone 'Europe/Amsterdam')
     group by 1
  )
  select count(*), avg(kcal) into v_log, v_inname from d where kcal >= v_drempel and dag not in (select dag from deload);

  if coalesce(v_weg, 0) < 8 or coalesce(v_log, 0) < 10 then
    return jsonb_build_object('tdee_gemeten', null, 'tdee_formule', v_formule, 'betrouwbaarheid', 'te weinig data', 'weegdagen', coalesce(v_weg, 0), 'logdagen', coalesce(v_log, 0));
  end if;
  v_tdee := round((v_inname - coalesce(v_helling, 0) * 7700) / 10) * 10;
  return jsonb_build_object('tdee_gemeten', v_tdee, 'tdee_formule', v_formule,
    'betrouwbaarheid', case when v_log >= 14 and v_weg >= 12 then 'hoog' else 'middel' end, 'weegdagen', v_weg, 'logdagen', v_log);
end $$;
revoke all on function public._gemeten_tdee(uuid, int) from public, anon, authenticated;

-- 12. Nachtrun, definitieve versie (vervangt die van punt 10): in een cut gaan
--     de kcal bij de deload naar onderhoud, net als bij de knop van de coach:
--     gemeten TDEE bij betrouwbaarheid hoog, anders clients.tdee.
create or replace function public.mesocyclus_nachtrun() returns void
language plpgsql security definer set search_path to 'public' as $$
declare f record; v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date; t jsonb; v_kcal int;
begin
  for f in select * from training_fases where actief and nummer is not null and afgerond_op is null loop
    begin
      if f.deload_gestart_op is null and v_vandaag >= f.start_datum + f.bouw_weken * 7 then
        v_kcal := null;
        if exists (select 1 from client_phases p where p.client_id = f.client_id and p.ended_on is null and lower(p.doel) = 'cut') then
          t := _gemeten_tdee(f.client_id);
          v_kcal := case when t ->> 'betrouwbaarheid' = 'hoog' then (t ->> 'tdee_gemeten')::numeric::int else (t ->> 'tdee_formule')::numeric::int end;
        end if;
        perform _start_deload(f.id, v_kcal, 'gepland');
      elsif f.deload_gestart_op is not null and v_vandaag >= f.deload_gestart_op + f.deload_dagen then
        perform _eind_deload(f.id);
      end if;
    exception when others then
      null; -- één klant mag de rest niet tegenhouden
    end;
  end loop;
end $$;
revoke all on function public.mesocyclus_nachtrun() from public, anon, authenticated;
