-- src/modules/app-onboarding/app-coaching-lead.sql (24 nov 2026)
--
-- "Vraag coaching aan" vanuit de app (pagina Mijn plan) maakt een lead in het
-- lead-systeem, in een eigen kolom "📱 App → coaching", en zet een melding in
-- de bel van de coach. Alleen voor app-accounts; dubbel aanvragen werkt de
-- bestaande lead bij. Alleen toevoegen.

insert into public.lead_sections (id, coach_id, team_id, title, color, position)
values ('a1d1ead0-0000-4000-8000-000000000010', '5a0135ac-3188-499d-8682-ed6a179e5541', '1379fd75-ca62-4362-98a2-639a429f4201',
        '📱 App → coaching', '#FFD700', 18)
on conflict (id) do nothing;

create or replace function public.app_coaching_aanvraag()
returns uuid
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_coach  uuid := '5a0135ac-3188-499d-8682-ed6a179e5541';
  v_team   uuid := '1379fd75-ca62-4362-98a2-639a429f4201';
  v_sectie uuid := 'a1d1ead0-0000-4000-8000-000000000010';
  c clients%rowtype; v_lead uuid; v_naam text; v_noot text;
begin
  select * into c from clients where auth_user_id = auth.uid() and app_abonnee order by created_at desc limit 1;
  if not found then raise exception 'geen app-account'; end if;
  v_naam := coalesce(nullif(trim(c.first_name), ''), split_part(c.email, '@', 1));
  v_noot := format('Via de app (%s). Doel: %s, gewicht %s kg, streef %s kg, %s kcal.',
    to_char(now() at time zone 'Europe/Amsterdam', 'DD-MM-YYYY'), coalesce(c.primary_goal, '?'),
    coalesce(c.current_weight::text, '?'), coalesce(c.goal_weight::text, '?'), coalesce(c.target_calories::text, '?'));

  select id into v_lead from call_leads where lead_source = 'app' and lower(email) = lower(c.email) order by created_at desc limit 1;
  if v_lead is not null then
    update call_leads set last_touched = now(), notes = coalesce(notes || E'\n', '') || 'Opnieuw aangevraagd: ' || v_noot where id = v_lead;
  else
    insert into call_leads (first_name, last_name, email, phone, status, priority, lead_source, coach_id, team_id, assigned_at, lead_temperature, notes, last_touched)
    values (v_naam, coalesce(c.last_name, ''), lower(c.email), c.phone, 'new', 'high', 'app', v_coach, v_team, now(), 'hot', v_noot, now())
    returning id into v_lead;
    insert into lead_section_items (lead_id, section_id, position, moved_at) values (v_lead, v_sectie, 0, now());
    insert into lead_movements (lead_id, lead_name, from_section_id, from_section_title, to_section_id, to_section_title, coach_id, moved_at, outcome_type)
    values (v_lead, v_naam, null, 'Niet toegewezen', v_sectie, '📱 App → coaching', v_coach, now(), 'app');
  end if;

  insert into coach_notifications (coach_id, client_id, type, priority, title, message, read_status, created_at)
  values (v_coach, c.id, 'new_ad_lead', 'high', format('%s wil coaching', v_naam),
          'Een app-gebruiker vraagt persoonlijke coaching aan. Hij staat in de kolom 📱 App → coaching. ' || v_noot, false, now());
  return v_lead;
end $$;
revoke all on function public.app_coaching_aanvraag() from public, anon;
grant execute on function public.app_coaching_aanvraag() to authenticated;

notify pgrst, 'reload schema';
