-- src/modules/app-onboarding/app-zelf.sql (24 nov 2026)
--
-- Dingen die een app-gebruiker (clients.app_abonnee, geen coach) zelf moet
-- kunnen. Werkt alleen op de eigen rij en alleen voor app-accounts; een
-- coachingklant kan hier niets mee (die loopt via de coach).
-- Alleen toevoegen; oude app-versies roepen dit niet aan.

-- 1. Doel en gegevens aanpassen; macro's opnieuw rekenen met dezelfde som als
--    de intake (bereken_intake_macros). Lege p = alleen opnieuw rekenen
--    (bijvoorbeeld na een nieuw trainingsschema: ander aantal trainingen).
create or replace function public.wijzig_app_doel(p jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $$
declare
  c clients%rowtype; m jsonb;
begin
  select * into c from clients where auth_user_id = auth.uid() and app_abonnee order by created_at desc limit 1;
  if not found then return jsonb_build_object('fout', 'geen app-account'); end if;

  update clients set
    primary_goal   = coalesce(nullif(p ->> 'doel', ''), primary_goal),
    current_weight = coalesce(nullif(p ->> 'gewicht', '')::numeric, current_weight),
    goal_weight    = coalesce(nullif(p ->> 'streefgewicht', '')::numeric, goal_weight),
    target_weight  = coalesce(nullif(p ->> 'streefgewicht', '')::numeric, target_weight),
    activity_level = coalesce(nullif(p ->> 'activiteit', ''), activity_level),
    updated_at = now()
  where id = c.id;

  m := bereken_intake_macros(c.id);
  if m ? 'fout' then return m; end if;
  update clients set target_calories = (m ->> 'target_calories')::int, target_protein = (m ->> 'target_protein')::int,
    target_carbs = (m ->> 'target_carbs')::int, target_fat = (m ->> 'target_fat')::int,
    macro_brief = m || jsonb_build_object('gemaakt', now(), 'door', 'app_zelf'),
    manual_macro_targets = true
  where id = c.id;
  return m - 'brief';
end $$;
revoke all on function public.wijzig_app_doel(jsonb) from public, anon;
grant execute on function public.wijzig_app_doel(jsonb) to authenticated;

-- 2. Trainingsvoorkeuren opnieuw invullen. Daarna bouwt de app een nieuw
--    schema (edge function workout-bouwer, die een verse workout_completed_at
--    nodig heeft) en zet activeer_app_plannen() het actief.
create or replace function public.vernieuw_app_training(p jsonb)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $$
declare
  c clients%rowtype;
begin
  select * into c from clients where auth_user_id = auth.uid() and app_abonnee order by created_at desc limit 1;
  if not found then return jsonb_build_object('fout', 'geen app-account'); end if;

  update clients set training_experience = coalesce(nullif(p ->> 'ervaring', ''), training_experience), updated_at = now()
  where id = c.id;

  update user_workout_preferences set
    default_days_per_week    = coalesce(nullif(p ->> 'trainingen', '')::int, default_days_per_week),
    default_time_per_session = coalesce(nullif(p ->> 'minuten', '')::int, default_time_per_session),
    training_location        = coalesce(nullif(p ->> 'locatie', ''), training_location),
    default_experience_level = coalesce(nullif(p ->> 'ervaring', ''), default_experience_level),
    split_preferences        = case when p ? 'focus' then jsonb_build_object('focus_spieren', p -> 'focus') else split_preferences end,
    workout_completed = true,
    workout_completed_at = now()
  where user_id = c.id;
  if not found then
    insert into user_workout_preferences (user_id, default_days_per_week, default_time_per_session, training_location,
      default_experience_level, split_preferences, training_willingness, workout_completed, workout_completed_at)
    values (c.id, nullif(p ->> 'trainingen', '')::int, nullif(p ->> 'minuten', '')::int, nullif(p ->> 'locatie', ''),
      nullif(p ->> 'ervaring', ''), jsonb_build_object('focus_spieren', coalesce(p -> 'focus', '[]'::jsonb)), 'yes', true, now());
  end if;
  return jsonb_build_object('client_id', c.id);
end $$;
revoke all on function public.vernieuw_app_training(jsonb) from public, anon;
grant execute on function public.vernieuw_app_training(jsonb) to authenticated;

notify pgrst, 'reload schema';

-- 3. (24 nov 2026, live gezet) Geen ingeplande coach-meldingen voor app-accounts
--    (check-in herinnering, progressiefoto, ...). In run_notification_schedules
--    en preview_notification_schedule is aan de doelgroep toegevoegd:
--      and not coalesce(cl.app_abonnee, false)
--    Gedaan met een replace op de bestaande functiedefinitie (do-blok), zodat de
--    rest van die functies ongewijzigd bleef.
