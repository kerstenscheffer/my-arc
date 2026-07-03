-- =============================================================
-- NOODROLLBACK voor RLS Phase 1 + 1b (migraties van 2026-06-10:
-- enable_rls_phase1_baseline + rls_phase1b_close_anon_leaks)
--
-- Gebruik alleen als een app-flow breekt en je het snel terug
-- wilt zetten. Draai bij voorkeur ALLEEN de regel van de tabel
-- die problemen geeft, niet het hele script.
--
-- Let op: "disable row level security" zet die tabel weer
-- volledig open voor de anon key (de oude, onveilige situatie).
-- =============================================================

-- ---- Groep 1: stonden vóór 2026-06-10 zonder RLS ------------
alter table public.ai_custom_meals disable row level security;
alter table public.ai_ingredients disable row level security;
alter table public.ai_ingredients_backup_20260608 disable row level security;
alter table public.ai_ingredients_backup_porties_20260608 disable row level security;
alter table public.ai_meal_favorites disable row level security;
alter table public.ai_meal_history disable row level security;
alter table public.ai_meal_swaps disable row level security;
alter table public.ai_meals_backup_20260608 disable row level security;
alter table public.ai_meals_backup_remap_20260608 disable row level security;
alter table public.ai_shopping_progress disable row level security;
alter table public.brands disable row level security;
alter table public.ch8_progress_photos disable row level security;
alter table public.challenge_action_tracking disable row level security;
alter table public.challenge_actions disable row level security;
alter table public.challenge_daily_logs disable row level security;
alter table public.challenge_goals disable row level security;
alter table public.challenge_leaderboard disable row level security;
alter table public.challenge_milestones disable row level security;
alter table public.challenge_progress disable row level security;
alter table public.challenge_progress_logs disable row level security;
alter table public.challenge_proof disable row level security;
alter table public.challenge_rewards disable row level security;
alter table public.challenge_verifications disable row level security;
alter table public.challenge_weeks disable row level security;
alter table public.challenges disable row level security;
alter table public.circumference_tracking disable row level security;
alter table public.claude_run_summaries disable row level security;
alter table public.client_action_items disable row level security;
alter table public.client_agenda_blocks disable row level security;
alter table public.client_agenda_overrides disable row level security;
alter table public.client_challenges disable row level security;
alter table public.client_meal_plans disable row level security;
alter table public.client_measurements_history disable row level security;
alter table public.client_profiles_extended disable row level security;
alter table public.client_shopping_custom_items disable row level security;
alter table public.coach_action_snoozes disable row level security;
alter table public.coach_actions_dismissed disable row level security;
alter table public.coach_files disable row level security;
alter table public.coach_meal_favorites disable row level security;
alter table public.coach_videos disable row level security;
alter table public.custom_exercises disable row level security;
alter table public.custom_meals disable row level security;
alter table public.custom_workouts disable row level security;
alter table public.dm_conversation_history disable row level security;
alter table public.dm_conversations disable row level security;
alter table public.dm_messages disable row level security;
alter table public.dm_section_transitions disable row level security;
alter table public.exercise_progress_updates disable row level security;
alter table public.exercise_prs disable row level security;
alter table public.exercises disable row level security;
alter table public.funnels disable row level security;
alter table public.goal_action_logs disable row level security;
alter table public.goal_actions disable row level security;
alter table public.goal_milestones disable row level security;
alter table public.goals disable row level security;
alter table public.meal_plan_communications disable row level security;
alter table public.meal_plan_exports disable row level security;
alter table public.meal_plan_shopping_lists disable row level security;
alter table public.meal_plan_templates disable row level security;
alter table public.notification_rule_history disable row level security;
alter table public.notification_rules disable row level security;
alter table public.notifications disable row level security;
alter table public.nutrition_plans disable row level security;
alter table public.nutrition_preferences disable row level security;
alter table public.nutrition_verifications disable row level security;
alter table public.photo_comment_notifications disable row level security;
alter table public.photo_comments disable row level security;
alter table public.plan_library disable row level security;
alter table public.product_prices disable row level security;
alter table public.product_variants disable row level security;
alter table public.productivity_time_logs disable row level security;
alter table public.productivity_week_goals disable row level security;
alter table public.profiles disable row level security;
alter table public.subscriptions disable row level security;
alter table public.supermarket_products disable row level security;
alter table public.supplement_plans disable row level security;
alter table public.supplement_products disable row level security;
alter table public.supplement_templates disable row level security;
alter table public.user_legacy_map disable row level security;
alter table public.user_workout_preferences disable row level security;
alter table public.users disable row level security;
alter table public.video_analytics disable row level security;
alter table public.video_assignments disable row level security;
alter table public.water_tracking disable row level security;
alter table public.week_templates disable row level security;
alter table public.workout_plans disable row level security;
alter table public.workout_progress disable row level security;
alter table public.workout_schemas disable row level security;
alter table public.workout_sessions disable row level security;

-- ---- Groep 2: hadden al RLS, maar phase 1b verving hun ------
-- "allow all (testing)" policies door authenticated-only.
-- Disable hier geeft hetzelfde effect als de oude allow-all:
alter table public.ai_meal_progress disable row level security;
alter table public.ai_meals disable row level security;
alter table public.ai_mood_logs disable row level security;
alter table public.ai_water_tracking disable row level security;
alter table public.call_flow_templates disable row level security;
alter table public.call_requests disable row level security;
alter table public.challenge_assignment_goals disable row level security;
alter table public.client_calls disable row level security;
alter table public.client_call_plans disable row level security;
alter table public.client_checkins disable row level security;
alter table public.client_coaching_logs disable row level security;
alter table public.client_exercise_overrides disable row level security;
alter table public.client_exercise_submissions disable row level security;
alter table public.client_feedback disable row level security;
alter table public.client_goals disable row level security;
alter table public.client_ingredient_portions disable row level security;
alter table public.client_journeys disable row level security;
alter table public.client_notes disable row level security;
alter table public.client_questions disable row level security;
alter table public.coach_messages disable row level security;
alter table public.exercise_goals disable row level security;
alter table public.exercise_videos disable row level security;
alter table public.faq_nodes disable row level security;
alter table public.intake_submissions disable row level security;
alter table public.journey_actions disable row level security;
alter table public.journey_notes disable row level security;
alter table public.journey_templates disable row level security;
alter table public.note_history disable row level security;
alter table public.note_tags disable row level security;
alter table public.note_templates disable row level security;
alter table public.payments disable row level security;
alter table public.productivity_reflections disable row level security;
alter table public.productivity_sections disable row level security;
alter table public.productivity_tasks disable row level security;
alter table public.productivity_week_reports disable row level security;
alter table public.productivity_weekly_wins disable row level security;
alter table public.progress_milestones disable row level security;
alter table public.quick_notes disable row level security;
alter table public.weight_tracking disable row level security;
alter table public.workout_completion disable row level security;
