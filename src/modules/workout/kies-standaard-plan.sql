-- Migratie kies_standaard_plan (6 okt 2026), toegepast via Supabase MCP.
-- Klant kiest zelf een standaardplan (workout_schemas.is_template + is_public):
-- eigen kopie onder de klant, actief gezet (trigger vult de weekindeling),
-- melding bij de coach in coach_notifications. Het sjabloon blijft ongemoeid.
-- Aanzetten per sjabloon: knop "Standaard" in de sjablonenlijst van de
-- workout-builder (zet is_public). Klant-kant: PlanSwitchModal, blok
-- "Even een week minder tijd?".
create or replace function public.kies_standaard_plan(p_schema_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_client clients%rowtype; v_tmpl workout_schemas%rowtype; v_new_id uuid; v_naam text; v_coach uuid;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd'; end if;
  select * into v_client from clients where auth_user_id = auth.uid() limit 1;
  if v_client.id is null then
    select * into v_client from clients where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) order by created_at desc limit 1;
  end if;
  if v_client.id is null then raise exception 'Geen klant gevonden bij dit account'; end if;
  select * into v_tmpl from workout_schemas where id = p_schema_id and is_template = true and is_public = true and coalesce(is_archived, false) = false;
  if v_tmpl.id is null then raise exception 'Dit plan is niet beschikbaar als standaardplan'; end if;
  v_naam := trim(coalesce(v_client.first_name, '') || ' ' || coalesce(v_client.last_name, ''));
  insert into workout_schemas (user_id, name, description, primary_goal, specific_goal, experience_level, days_per_week, time_per_session, equipment, split_type, split_name, week_structure, volume_analysis, specific_goal_data, is_ai_generated, is_public, is_template, is_client_edited, original_schema_id, client_id, client_name, is_archived)
  values (v_tmpl.user_id, v_tmpl.name, v_tmpl.description, v_tmpl.primary_goal, v_tmpl.specific_goal, v_tmpl.experience_level, v_tmpl.days_per_week, v_tmpl.time_per_session, v_tmpl.equipment, v_tmpl.split_type, v_tmpl.split_name, v_tmpl.week_structure, v_tmpl.volume_analysis, v_tmpl.specific_goal_data, false, false, false, false, v_tmpl.id, v_client.id, nullif(v_naam, ''), false)
  returning id into v_new_id;
  update clients set assigned_schema_id = v_new_id, updated_at = now() where id = v_client.id;
  v_coach := coalesce(v_client.coach_id, v_client.trainer_id);
  if v_coach is not null then
    insert into coach_notifications (coach_id, client_id, type, priority, title, message, read_status)
    values (v_coach, v_client.id, 'workout', 'low', coalesce(nullif(v_naam, ''), 'Klant') || ' koos een standaardplan', coalesce(v_tmpl.name, 'Plan') || ' · ' || coalesce(v_tmpl.days_per_week::text, '?') || '× per week', false);
  end if;
  return v_new_id;
end; $$;
revoke all on function public.kies_standaard_plan(uuid) from public;
grant execute on function public.kies_standaard_plan(uuid) to authenticated;
