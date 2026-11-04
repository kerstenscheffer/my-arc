-- supabase/rls-klant-coach-scheiding.sql (3 nov 2026)
--
-- Elke ingelogde klant mocht 128 tabellen lezen en wijzigen, en iedereen zonder
-- login mocht de klantenlijst lezen en wijzigen. Dit zet het om naar:
--   coach  (rls_is_coach): alles, net als nu
--   klant  alleen eigen rijen, plus gedeelde catalogi lezen
-- De klant-app blijft alles doen wat hij deed: geclassificeerd op de code die
-- bereikbaar is vanaf ClientDashboard en 24 uur edge-logs (3 nov 2026).
--
-- Terugdraaien: supabase/rls-klant-coach-terugdraai.sql (leest rls_backup_20261103).

create table if not exists public.rls_backup_20261103 as
  select now() as bewaard_op, * from pg_policies where schemaname = 'public';
alter table public.rls_backup_20261103 enable row level security;

create or replace function public.rls_is_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
       exists (select 1 from coach_team_members where coach_id = auth.uid())
    or exists (select 1 from clients where trainer_id = auth.uid())
    or exists (select 1 from call_leads where coach_id = auth.uid()))
$$;

-- Eigen klantrij(en). Ook een rij die nog niet aan de login hangt maar wel dat e-mailadres
-- heeft (eerste login), en auth.uid() zelf: oudere rijen hebben dat als client_id.
create or replace function public.rls_mijn_client_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from clients where auth_user_id = auth.uid()
     or (auth_user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  union all select auth.uid() where auth.uid() is not null
$$;

revoke all on function public.rls_is_coach() from public;
revoke all on function public.rls_mijn_client_ids() from public;
grant execute on function public.rls_is_coach() to anon, authenticated, service_role;
grant execute on function public.rls_mijn_client_ids() to anon, authenticated, service_role;

do $$
declare
  t text; p record;
  alleen_coach text[] := array[
    'agenda_blocks','call_flow_templates','challenge_actions','challenge_weeks','challenges',
    'claude_run_summaries','client_notes','coach_action_snoozes','coach_actions_dismissed',
    'coach_daily_checks','coach_meal_favorites','content_sections','dm_conversation_history',
    'dm_conversations','dm_messages','dm_section_transitions','intake_drafts','intake_submissions',
    'journey_actions','journey_notes','journey_templates','lead_campaign_tags','lead_reaction_events',
    'note_history','note_tags','note_templates','nutrition_verifications','photo_comments','plan_library',
    'productivity_reflections','productivity_sections','productivity_tasks','productivity_time_logs',
    'productivity_week_goals','productivity_week_reports','productivity_weekly_wins','quick_notes',
    'stat_presets','style_prompts','task_logs','users','weekly_goals','workout_day_templates'];
  eigen text[] := array[
    'ai_custom_meals','ai_meal_favorites','ai_meal_history','ai_meal_progress','ai_meal_swaps',
    'ai_mood_logs','ai_shopping_progress','ai_water_tracking','app_review_prompts','call_requests',
    'cardio_logs','ch8_progress_photos','checkin_drafts','circumference_tracking','client_agenda_blocks',
    'client_agenda_overrides','client_baselines','client_call_plans','client_calls','client_cardio_plan',
    'client_challenges','client_checkins','client_coaching_logs','client_exercise_overrides',
    'client_exercise_submissions','client_feedback','client_food_favorites','client_goals',
    'client_ingredient_portions','client_journeys','client_meal_plans','client_phases','client_questions',
    'client_shopping_custom_items','client_week_schedules','coach_messages','consumed_meals',
    'custom_exercises','custom_meals','custom_workouts','exercise_goals','exercise_progress_updates',
    'exercise_prs','notification_rule_history','notifications','nutrition_preferences','payments',
    'photo_comment_notifications','photo_likes','photo_reactions','progress_milestones','sleep_logs',
    'supplement_logs','supplement_plans','video_analytics','video_assignments','video_gezien',
    'water_tracking','week_templates','weekly_photo_stats','weight_tracking','workout_completion'];
  gedeeld text[] := array[
    'ai_meals','challenge_assignment_goals','challenge_goals','coach_files','coach_videos',
    'exercise_videos','exercises','faq_nodes','funnels','goal_action_logs','goal_actions','goal_milestones',
    'goals','meal_plan_templates','notification_rules','product_variants','supplement_templates',
    'video_course_items','video_courses','workout_plans'];
  coach_lezen text[] := array['challenge_events','challenge_prequal_emails','ingredient_feedback','support_messages'];
begin
  -- 1. Alles-open-regels weg op de tabellen die hieronder een eigen regel krijgen.
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename = any (alleen_coach || eigen || gedeeld || array['workout_progress','workout_sessions','workout_schemas'])
      and cmd = 'ALL' and qual = 'true'
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;

  -- 2. Alleen coach.
  foreach t in array alleen_coach loop
    execute format('create policy rls_coach on public.%I for all to authenticated using ((select rls_is_coach())) with check ((select rls_is_coach()))', t);
  end loop;

  -- 3. Coach, of de klant zelf. Rijen zonder client_id zijn gedeeld: wel lezen, niet wijzigen.
  foreach t in array eigen loop
    execute format('create policy rls_eigen on public.%I for all to authenticated
      using ((select rls_is_coach()) or client_id in (select rls_mijn_client_ids()))
      with check ((select rls_is_coach()) or client_id in (select rls_mijn_client_ids()))', t);
    execute format('create policy rls_gedeeld_lezen on public.%I for select to authenticated using (client_id is null)', t);
  end loop;

  -- 4. Catalogus: iedereen met login leest, coach wijzigt.
  foreach t in array gedeeld loop
    execute format('create policy rls_lezen on public.%I for select to authenticated using (true)', t);
    execute format('create policy rls_coach on public.%I for all to authenticated using ((select rls_is_coach())) with check ((select rls_is_coach()))', t);
  end loop;

  -- 5. Formulieren die klanten mogen versturen, maar waarvan alleen de coach de inhoud leest.
  foreach t in array coach_lezen loop
    execute format('create policy rls_coach on public.%I for all to authenticated using ((select rls_is_coach())) with check ((select rls_is_coach()))', t);
  end loop;
end $$;

drop policy if exists "challenge_events_coach_select" on public.challenge_events;
drop policy if exists "coach_leest" on public.challenge_prequal_emails;
drop policy if exists "Authed users can read feedback" on public.ingredient_feedback;
drop policy if exists "coach can read support" on public.support_messages;
drop policy if exists "coach can update support" on public.support_messages;
drop policy if exists "lead_movements_authenticated_update" on public.lead_movements;
create policy rls_coach_update on public.lead_movements for update to authenticated
  using ((select rls_is_coach())) with check ((select rls_is_coach()));

-- Betalingen en intake zonder client_id zijn geen gedeelde rijen: alleen de coach ziet die.
drop policy rls_gedeeld_lezen on public.payments;
drop policy rls_gedeeld_lezen on public.nutrition_preferences;

-- client_calls: dit stond ook voor iedereen zonder login open.
drop policy if exists "Anyone can view calls" on public.client_calls;
drop policy if exists "Anyone can insert calls" on public.client_calls;
drop policy if exists "Anyone can update calls" on public.client_calls;

-- consumed_meals: gedeelde maaltijden (foto's) blijven leesbaar.
drop policy if exists "Users can delete consumed meals" on public.consumed_meals;
drop policy if exists "Users can insert consumed meals" on public.consumed_meals;
drop policy if exists "Users can update consumed meals" on public.consumed_meals;
drop policy if exists "Users can view all consumed meals" on public.consumed_meals;
create policy rls_gedeelde_maaltijd on public.consumed_meals for select to authenticated using (is_shared = true);

-- nutrition_preferences: de openbare voedingsintake (/nutritionintake) werkt zonder login.
drop policy if exists "public_intake_all" on public.nutrition_preferences;
create policy rls_intake_anon on public.nutrition_preferences for all to anon using (true) with check (true);

-- Trainingen: progress hangt aan de sessie.
create policy rls_eigen on public.workout_sessions for all to authenticated
  using ((select rls_is_coach()) or user_id = auth.uid() or client_id in (select rls_mijn_client_ids()))
  with check ((select rls_is_coach()) or user_id = auth.uid() or client_id in (select rls_mijn_client_ids()));
create policy rls_eigen on public.workout_progress for all to authenticated
  using ((select rls_is_coach()) or session_id in (select id from public.workout_sessions))
  with check ((select rls_is_coach()) or session_id in (select id from public.workout_sessions));

-- Schema's: klanten lezen ook het sjabloon dat aan hen hangt. Wijzigen alleen het eigen schema.
drop policy if exists "Allow read access to workout schemas" on public.workout_schemas;
create policy rls_eigen on public.workout_schemas for all to authenticated
  using ((select rls_is_coach()) or user_id = auth.uid() or client_id in (select rls_mijn_client_ids())
         or id in (select assigned_schema_id from public.clients where id in (select rls_mijn_client_ids())))
  with check ((select rls_is_coach()) or user_id = auth.uid() or client_id in (select rls_mijn_client_ids())
         or id in (select assigned_schema_id from public.clients where id in (select rls_mijn_client_ids())));

-- clients: de kern. Inschrijven en intake lopen via de service key in /api, niet via anon.
drop policy if exists "read_all" on public.clients;
drop policy if exists "update_all" on public.clients;
drop policy if exists "insert_all" on public.clients;
create policy rls_coach on public.clients for all to authenticated
  using ((select rls_is_coach())) with check ((select rls_is_coach()));
create policy rls_eigen_lezen on public.clients for select to authenticated
  using (id in (select rls_mijn_client_ids()));
create policy rls_eigen_wijzigen on public.clients for update to authenticated
  using (id in (select rls_mijn_client_ids())) with check (id in (select rls_mijn_client_ids()));
create policy rls_eigen_toevoegen on public.clients for insert to authenticated
  with check (auth_user_id = auth.uid());

-- Zonder login: geen enkele rij. De kolomrechten blijven staan zodat oudere code die de
-- naam meejoint (nutrition_preferences -> clients) een lege koppeling krijgt in plaats van
-- een fout. /nutritionintake haalt de klant via /api/public-intake (service key).
revoke select, insert, update, delete on public.clients from anon;
grant select (id, first_name, last_name, tdee, surplus, target_calories, target_protein, target_carbs, target_fat)
  on public.clients to anon;
