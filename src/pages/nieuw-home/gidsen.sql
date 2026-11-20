-- Gidsen-bibliotheek op de homepage (20 nov 2026). Alleen toevoegen.
-- Bezoeker vult voornaam + e-mail in, krijgt alle gidsen; lead komt in kolom '🧲 Gidsen'.
-- Elke download zet de gids in call_leads.lead_magnets_shared (zelfde kolom als de DM-gidsen).
insert into lead_sections (id, title, color, team_id, coach_id, position)
values ('a1d1ead0-0000-4000-8000-000000000004', '🧲 Gidsen', '#FFD700',
        '1379fd75-ca62-4362-98a2-639a429f4201', '5a0135ac-3188-499d-8682-ed6a179e5541', 4)
on conflict (id) do nothing;

create or replace function public.submit_gidsen(p jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
  v_coach  uuid := '5a0135ac-3188-499d-8682-ed6a179e5541';
  v_team   uuid := '1379fd75-ca62-4362-98a2-639a429f4201';
  v_sectie uuid := 'a1d1ead0-0000-4000-8000-000000000004';
  v_naam   text := left(nullif(trim(coalesce(p->>'voornaam', '')), ''), 80);
  v_email  text := lower(trim(coalesce(p->>'email', '')));
  v_gids   text := left(nullif(trim(coalesce(p->>'gids', '')), ''), 120);
  v_lead   uuid;
begin
  if v_naam is null then raise exception 'voornaam ontbreekt'; end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(v_email) > 254 then
    raise exception 'e-mail ongeldig';
  end if;

  select id into v_lead from call_leads
  where lead_source = 'gidsen' and lower(email) = v_email
  order by created_at desc limit 1;

  if v_lead is not null then
    update call_leads set
      first_name = v_naam,
      lead_magnets_shared = case when v_gids is null or v_gids = any(coalesce(lead_magnets_shared, '{}')) then lead_magnets_shared
                                 else coalesce(lead_magnets_shared, '{}') || v_gids end,
      last_touched = now()
    where id = v_lead;
    return v_lead;
  end if;

  insert into call_leads (
    first_name, last_name, email, status, priority, lead_source, coach_id, team_id, assigned_at,
    utm_source, utm_medium, utm_campaign, utm_content, referrer_url,
    lead_temperature, lead_magnets_shared, last_touched
  ) values (
    v_naam, '', v_email, 'new', 'medium', 'gidsen', v_coach, v_team, now(),
    nullif(p->>'utm_source',''), nullif(p->>'utm_medium',''), nullif(p->>'utm_campaign',''),
    nullif(p->>'utm_content',''), left(nullif(p->>'referrer',''), 500),
    'warm', case when v_gids is null then '{}'::text[] else array[v_gids] end, now()
  ) returning id into v_lead;

  insert into lead_section_items (lead_id, section_id, position, moved_at)
  values (v_lead, v_sectie, 0, now());

  insert into lead_movements (lead_id, lead_name, from_section_id, from_section_title, to_section_id, to_section_title, coach_id, moved_at, outcome_type)
  values (v_lead, v_naam, null, 'Niet toegewezen', v_sectie, '🧲 Gidsen', v_coach, now(), 'gidsen');

  return v_lead;
end;
$$;

-- Latere downloads van dezelfde bezoeker: gids erbij op zijn lead.
create or replace function public.gids_gedownload(p_lead uuid, p_gids text)
returns void language sql security definer set search_path to 'public' as $$
  update call_leads set
    lead_magnets_shared = coalesce(lead_magnets_shared, '{}') || left(p_gids, 120),
    last_touched = now()
  where id = p_lead and lead_source = 'gidsen'
    and not (left(p_gids, 120) = any(coalesce(lead_magnets_shared, '{}')));
$$;

revoke all on function public.submit_gidsen(jsonb) from public;
revoke all on function public.gids_gedownload(uuid, text) from public;
grant execute on function public.submit_gidsen(jsonb) to anon, authenticated;
grant execute on function public.gids_gedownload(uuid, text) to anon, authenticated;
