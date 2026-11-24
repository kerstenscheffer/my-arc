-- src/modules/app-onboarding/app-onboarding.sql (20 nov 2026)
--
-- Onboarding voor mensen die de app zelf downloaden (geen coaching).
-- Alleen toevoegen; bereken_intake_macros geeft exact dezelfde uitkomst als
-- voorheen (gecontroleerd op alle klanten), maar rekent nu via de kern.

-- 1. De som zelf, los van de clients-rij. Eén bron voor coach-intake en app-onboarding.
create or replace function public.bereken_macros_kern(
  p_gewicht numeric, p_lengte numeric, p_leeftijd int, p_vrouw boolean, p_doel text,
  p_activiteit text, p_trainingen int, p_ervaring text
) returns jsonb
language plpgsql immutable
set search_path to 'public'
as $$
declare
  v_doel text; v_bmr numeric; v_lf numeric; v_tr int := p_trainingen; v_formule numeric; v_onderhoud numeric;
  v_tempo numeric := 0.6; v_surplus numeric := 0; v_ruw numeric; v_kcal numeric; v_vloer numeric; v_cardio numeric := 0;
  v_eiwit int; v_vet int; v_kh int; keuzes jsonb := '[]'::jsonb; nakijken jsonb := '[]'::jsonb;
  v_corr numeric; v_erv text;
  PER_TRAINING constant numeric := 350;
begin
  if coalesce(p_gewicht, 0) <= 0 or coalesce(p_lengte, 0) <= 0 or coalesce(p_leeftijd, 0) <= 0 then
    return jsonb_build_object('fout', 'gewicht, lengte of leeftijd ontbreekt');
  end if;
  v_doel := case lower(coalesce(p_doel, ''))
    when 'cut' then 'cut' when 'fat_loss' then 'cut' when 'afvallen' then 'cut'
    when 'bulk' then 'bulk' when 'muscle_gain' then 'bulk' when 'spieropbouw' then 'bulk'
    when 'recomp' then 'recomp' when 'recomposition' then 'recomp' else 'maintain' end;
  v_bmr := 10 * p_gewicht + 6.25 * p_lengte - 5 * p_leeftijd + case when p_vrouw then -161 else 5 end;
  v_lf := case p_activiteit when 'sedentary' then 1.2 when 'lightly_active' then 1.3 when 'light' then 1.3
    when 'moderately_active' then 1.4 when 'moderate' then 1.4 when 'active' then 1.5 when 'very_active' then 1.5 else 1.2 end;
  if p_activiteit is null then nakijken := nakijken || to_jsonb('Activiteit niet ingevuld: gerekend met zittend werk.'::text); end if;
  if coalesce(v_tr, 0) = 0 then v_tr := 3; nakijken := nakijken || to_jsonb('Aantal trainingen onbekend: gerekend met 3 per week.'::text); end if;

  v_formule := v_bmr * v_lf + v_tr * PER_TRAINING / 7.0;
  v_erv := case lower(coalesce(p_ervaring, '')) when 'beginner' then 'beginner' when 'advanced' then 'gevorderd' when 'gevorderd' then 'gevorderd' else 'gemiddeld' end;
  v_corr := case v_erv when 'beginner' then -250 when 'gevorderd' then -50 else -200 end;
  if p_ervaring is null then nakijken := nakijken || to_jsonb('Trainingservaring niet ingevuld: onderhoud gecorrigeerd als gemiddeld (200 eraf).'::text); end if;
  v_onderhoud := round(v_formule + v_corr);
  keuzes := keuzes || to_jsonb(format('Onderhoud %s kcal: formule %s (rust %s × activiteit %s, plus %s trainingen van %s kcal), daarna %s kcal omdat de formule te hoog schat (trainingservaring: %s).',
    v_onderhoud, round(v_formule), round(v_bmr), v_lf, v_tr, PER_TRAINING, v_corr, v_erv));

  if v_doel = 'cut' then
    v_surplus := -round(p_gewicht * v_tempo / 100 * 7700 / 7);
    keuzes := keuzes || to_jsonb(format('Cut: tempo %s%% van het lichaamsgewicht per week, dat is %s kg per week en een tekort van %s kcal per dag.',
      v_tempo, round(p_gewicht * v_tempo / 100, 2), -v_surplus));
  elsif v_doel = 'bulk' then
    v_surplus := 300;
    keuzes := keuzes || to_jsonb('Bulk: overschot van 300 kcal per dag.'::text);
  else
    keuzes := keuzes || to_jsonb('Geen cut of bulk: doel gelijk aan het onderhoud.'::text);
  end if;

  v_ruw := v_onderhoud + v_surplus;
  v_kcal := round(v_ruw / 100) * 100;
  v_vloer := case when p_vrouw then 1500 else 1800 end;
  if v_kcal < v_vloer then
    v_cardio := v_vloer - v_ruw;
    v_kcal := v_vloer;
    keuzes := keuzes || to_jsonb(format('De som kwam op %s kcal, onder de ondergrens van %s. Doel op %s gezet; het verschil van %s kcal per dag komt uit cardio (ongeveer %s minuten stevig wandelen per week).',
      round(v_ruw), v_vloer, v_vloer, round(v_cardio), round(v_cardio * 7 / 6 / 5) * 5));
    nakijken := nakijken || to_jsonb(format('Cardio toevoegen: %s minuten per week.', round(v_cardio * 7 / 6 / 5) * 5));
  end if;

  v_eiwit := round(p_gewicht * 2.0);
  v_vet := round(p_gewicht * case when v_doel = 'bulk' then 1.0 else 0.7 end);
  v_kh := greatest(0, round((v_kcal - v_eiwit * 4 - v_vet * 9) / 4));
  keuzes := keuzes || to_jsonb(format('Eiwit %s g (2 g per kg), vet %s g (%s g per kg), koolhydraten %s g uit de rest. Dit is het doel van een trainingsdag; een rustdag ligt lager met de pre-workout.',
    v_eiwit, v_vet, case when v_doel = 'bulk' then '1,0' else '0,7' end, v_kh));
  if v_kh < 100 then nakijken := nakijken || to_jsonb(format('Maar %s g koolhydraten: weinig ruimte voor gewone maaltijden.', v_kh)); end if;
  if p_gewicht / ((p_lengte / 100.0) ^ 2) >= 32 then nakijken := nakijken || to_jsonb('BMI 32 of hoger: eiwit en vet op huidig gewicht kunnen te hoog uitvallen.'::text); end if;

  return jsonb_build_object(
    'doel', v_doel, 'onderhoud', v_onderhoud, 'formule', round(v_formule), 'surplus', v_surplus, 'trainingen', v_tr,
    'target_calories', v_kcal, 'target_protein', v_eiwit, 'target_carbs', v_kh, 'target_fat', v_vet, 'cardio_kcal_per_dag', round(v_cardio),
    'brief', jsonb_build_object(
      'samenvatting', format('%s kcal op een trainingsdag: %s g eiwit, %s g koolhydraten, %s g vet.', v_kcal, v_eiwit, v_kh, v_vet),
      'keuzes', keuzes, 'nakijken', nakijken));
end $$;

-- 2. De bestaande coach-berekening, nu via de kern (zelfde invoer, zelfde uitkomst).
create or replace function public.bereken_intake_macros(p_client uuid)
returns jsonb
language plpgsql stable security definer
set search_path to 'public'
as $$
declare
  c clients%rowtype; v_tr int;
begin
  select * into c from clients where id = p_client;
  if not found then return jsonb_build_object('fout', 'klant niet gevonden'); end if;
  v_tr := coalesce((select count(*)::int from jsonb_object_keys(case when jsonb_typeof(c.workout_schedule) = 'object' then c.workout_schedule else '{}'::jsonb end)), 0);
  if v_tr = 0 then v_tr := coalesce(jsonb_array_length(case when jsonb_typeof(to_jsonb(c.preferred_training_days)) = 'array' then to_jsonb(c.preferred_training_days) end), 0); end if;
  if v_tr = 0 then
    v_tr := coalesce((select w.default_days_per_week from user_workout_preferences w
      where w.user_id in (c.id, c.auth_user_id) and w.default_days_per_week between 1 and 7 order by w.updated_at desc nulls last limit 1), 0);
  end if;
  return bereken_macros_kern(c.current_weight, c.height, c.age,
    lower(coalesce(c.gender, '')) like 'f%' or lower(coalesce(c.gender, '')) like 'v%',
    c.primary_goal, c.activity_level, v_tr, c.training_experience);
end $$;

-- 3. Voorbeeld tijdens de onboarding, nog zonder account. Rekent alleen, leest en schrijft niets.
create or replace function public.app_macro_voorbeeld(p jsonb)
returns jsonb
language sql immutable
set search_path to 'public'
as $$
  select bereken_macros_kern(
    nullif(p ->> 'gewicht', '')::numeric, nullif(p ->> 'lengte', '')::numeric, nullif(p ->> 'leeftijd', '')::int,
    coalesce(p ->> 'geslacht', '') = 'female', p ->> 'doel', p ->> 'activiteit',
    nullif(p ->> 'trainingen', '')::int, p ->> 'ervaring')
$$;
grant execute on function public.app_macro_voorbeeld(jsonb) to anon, authenticated;

-- 4. Account afmaken na het aanmelden: klantrij + voorkeuren + macro's.
--    Raakt een bestaande (coaching)klant nooit aan.
create or replace function public.start_app_account(p jsonb)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_bestaand clients%rowtype;
  v_id uuid;
  v_coach constant uuid := '5a0135ac-3188-499d-8682-ed6a179e5541';
  v_leeftijd int := nullif(p ->> 'leeftijd', '')::int;
  m jsonb;
begin
  if v_uid is null then return jsonb_build_object('fout', 'niet ingelogd'); end if;
  select * into v_bestaand from clients where auth_user_id = v_uid order by created_at desc limit 1;
  if found then
    -- Coachingklant: niets aanpassen. Eerder begonnen app-account: gewoon terug.
    return jsonb_build_object('client_id', v_bestaand.id, 'bestond_al', true, 'app_abonnee', coalesce(v_bestaand.app_abonnee, false));
  end if;
  select email into v_email from auth.users where id = v_uid;

  insert into clients (
    email, first_name, auth_user_id, coach_id, trainer_id, status, coaching_status,
    app_abonnee, niet_betalend, gender, age, date_of_birth, height,
    current_weight, start_weight, goal_weight, target_weight,
    primary_goal, activity_level, training_experience, intake_completed
  ) values (
    lower(v_email), nullif(trim(p ->> 'voornaam'), ''), v_uid, v_coach, v_coach, 'active', 'app',
    true, true, nullif(p ->> 'geslacht', ''), v_leeftijd,
    case when v_leeftijd is not null then make_date(extract(year from now())::int - v_leeftijd, 7, 1) end,
    nullif(p ->> 'lengte', '')::int,
    nullif(p ->> 'gewicht', '')::numeric, nullif(p ->> 'gewicht', '')::numeric,
    nullif(p ->> 'streefgewicht', '')::numeric, nullif(p ->> 'streefgewicht', '')::numeric,
    nullif(p ->> 'doel', ''), nullif(p ->> 'activiteit', ''), nullif(p ->> 'ervaring', ''), true
  ) returning id into v_id;

  insert into user_workout_preferences (
    user_id, default_experience_level, default_days_per_week, default_time_per_session,
    default_primary_goal, split_preferences, training_location, injuries,
    training_willingness, workout_completed, workout_completed_at
  ) values (
    v_id, nullif(p ->> 'ervaring', ''), nullif(p ->> 'trainingen', '')::int, nullif(p ->> 'minuten', '')::int,
    nullif(p ->> 'doel', ''), jsonb_build_object('focus_spieren', coalesce(p -> 'focus', '[]'::jsonb)),
    nullif(p ->> 'locatie', ''), nullif(trim(p ->> 'blessures'), ''),
    case when coalesce(nullif(p ->> 'trainingen', '')::int, 0) = 0 then 'no' else 'yes' end, true, now()
  );

  insert into nutrition_preferences (client_id, completed, meal_schedule, allergens, practical_info, life_context)
  values (
    v_id, true,
    jsonb_build_object('num_meals', nullif(p ->> 'maaltijden', '')::int),
    coalesce(p -> 'allergieen', '[]'::jsonb),
    jsonb_build_object('variatie_per_maaltijd', jsonb_build_object('ontbijt', coalesce(p ->> 'variatie', 'vast'), 'lunch', coalesce(p ->> 'variatie', 'vast'), 'diner', coalesce(p ->> 'variatie', 'vast')),
                       'eetstijl', p ->> 'eetstijl', 'bron', 'app_onboarding'),
    jsonb_build_object('bron', 'app_onboarding')
  );

  -- App-gebruikers hebben geen coach die goedkeurt: macro's direct actief.
  m := bereken_intake_macros(v_id);
  if not (m ? 'fout') then
    update clients set target_calories = (m ->> 'target_calories')::int, target_protein = (m ->> 'target_protein')::int,
      target_carbs = (m ->> 'target_carbs')::int, target_fat = (m ->> 'target_fat')::int,
      macro_brief = m || jsonb_build_object('gemaakt', now()),
      manual_macro_targets = true   -- anders herberekent de oude trigger update_client_macros ze
    where id = v_id;
  end if;
  return jsonb_build_object('client_id', v_id, 'macros', m);
end $$;
revoke all on function public.start_app_account(jsonb) from public, anon;
grant execute on function public.start_app_account(jsonb) to authenticated;

-- 5. De concepten van een app-gebruiker direct actief zetten (geen coach die goedkeurt).
--    Alleen voor de eigen rij en alleen als app_abonnee; coachingklanten blijven via de coach lopen.
create or replace function public.activeer_app_plannen()
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $$
declare
  c clients%rowtype; v_schema uuid; v_maal uuid;
begin
  select * into c from clients where auth_user_id = auth.uid() and app_abonnee order by created_at desc limit 1;
  if not found then return jsonb_build_object('fout', 'geen app-account'); end if;

  select id into v_schema from workout_schemas
   where client_id is null and generation_options ->> 'concept_voor' = c.id::text and generation_options ->> 'status' = 'concept'
   order by created_at desc limit 1;
  if v_schema is not null then
    update workout_schemas set client_id = c.id,
      name = regexp_replace(coalesce(name, ''), '^Concept\s*·\s*', '', 'i'),
      generation_options = generation_options || jsonb_build_object('status', 'goedgekeurd', 'goedgekeurd_op', now(), 'door', 'app_onboarding'),
      updated_at = now()
    where id = v_schema;
    -- workout_schedule leeg: de trigger vul_workout_schedule_bij_toewijzing vult de standaardweek.
    update clients set assigned_schema_id = v_schema, workout_schedule = null, updated_at = now() where id = c.id;
  end if;

  select id into v_maal from client_meal_plans
   where client_id = c.id and generation_settings ->> 'status' = 'concept'
   order by created_at desc limit 1;
  if v_maal is not null then
    update client_meal_plans set is_active = false where client_id = c.id and id <> v_maal and is_active;
    update client_meal_plans set is_active = true,
      template_name = regexp_replace(coalesce(template_name, ''), '^Concept\s*·\s*', '', 'i'),
      generation_settings = generation_settings || jsonb_build_object('status', 'goedgekeurd', 'goedgekeurd_op', now(), 'door', 'app_onboarding')
    where id = v_maal;
  end if;
  return jsonb_build_object('workout', v_schema, 'voeding', v_maal);
end $$;
revoke all on function public.activeer_app_plannen() from public, anon;
grant execute on function public.activeer_app_plannen() to authenticated;

notify pgrst, 'reload schema';

-- 6. (24 nov 2026) Geen meldingen voor app-accounts.
--    App-gebruikers hebben geen coach die concepten nakijkt, dus:
--    a) geen "Concept-plan klaar" in de bel van de coach (workout-bouwer en
--       maak_intake_voedingsconcept lopen allebei via create_intake_notification);
--    b) geen "Je coach heeft ... voor je klaargezet" bij de klant.
--    Zelfde handtekening als voorheen; voor coachingklanten verandert niets.
create or replace function public.create_intake_notification(p_client_id uuid, p_type text, p_priority text, p_title text, p_message text, p_action_type text DEFAULT NULL::text, p_action_data jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_coach uuid; v_id uuid; v_app boolean;
BEGIN
  SELECT COALESCE(trainer_id, coach_id), coalesce(app_abonnee, false) INTO v_coach, v_app FROM clients WHERE id = p_client_id;
  IF v_coach IS NULL THEN RETURN NULL; END IF;  -- onbekende klant of geen coach → niks doen
  IF v_app THEN RETURN NULL; END IF;            -- app-account: geen coach die nakijkt
  INSERT INTO coach_notifications
    (coach_id, client_id, type, priority, title, message, action_type, action_data, read_status, created_at)
  VALUES
    (v_coach, p_client_id, COALESCE(p_type,'info'), COALESCE(p_priority,'normal'),
     p_title, p_message, p_action_type, p_action_data, false, now())
  RETURNING id INTO v_id;
  RETURN v_id;
END $function$;

CREATE OR REPLACE FUNCTION public.notify_client_new_workout_plan()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  plan_naam text;
begin
  if new.assigned_schema_id is null
     or new.assigned_schema_id is not distinct from old.assigned_schema_id then
    return new;
  end if;
  -- App-account: er is geen coach die iets klaarzet.
  if coalesce(new.app_abonnee, false) then
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
