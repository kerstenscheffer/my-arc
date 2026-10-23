-- src/pages/mijn-menu/mijn-menu.sql
--
-- Lead magnet /mijn-menu (23 okt 2026): weekmenu op calorieën uit de
-- dagmenu- en wisselgerechten van Kersten.
--   - bordkolom "🧲 Mijn menu" (zelfde opzet als "🧲 Mijn split")
--   - submit_mijn_menu: lead op het bord, zelfde adres = geen tweede kaart
--   - get_mijn_menu_maaltijden: de gerechten met hun ingrediënten per gram,
--     voor anoniem (ai_meals en ai_ingredients zelf zijn dicht voor anon)
--   - Ads-scherm: /mijn-menu als pagina, leads met lead_source mijn_menu

insert into lead_sections (id, coach_id, title, color, position, team_id)
values ('a1d1ead0-0000-4000-8000-000000000003', '5a0135ac-3188-499d-8682-ed6a179e5541', '🧲 Mijn menu', '#FFD700', 4, '1379fd75-ca62-4362-98a2-639a429f4201')
on conflict (id) do nothing;

create or replace function public.submit_mijn_menu(p jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare
  v_coach  uuid := '5a0135ac-3188-499d-8682-ed6a179e5541';
  v_team   uuid := '1379fd75-ca62-4362-98a2-639a429f4201';
  v_sectie uuid := 'a1d1ead0-0000-4000-8000-000000000003';
  v_naam   text := left(nullif(trim(coalesce(p->>'voornaam', '')), ''), 80);
  v_email  text := lower(trim(coalesce(p->>'email', '')));
  v_notitie text := left(nullif(p->>'samenvatting', ''), 1000);
  v_antw   jsonb := case when jsonb_typeof(p->'antwoorden') = 'array' then p->'antwoorden' else null end;
  v_lead   uuid;
begin
  if v_naam is null then raise exception 'voornaam ontbreekt'; end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(v_email) > 254 then
    raise exception 'e-mail ongeldig';
  end if;

  -- Zelfde adres nog een keer: geen tweede kaart, wel de nieuwste antwoorden.
  select id into v_lead from call_leads
  where lead_source = 'mijn_menu' and lower(email) = v_email
  order by created_at desc limit 1;

  if v_lead is not null then
    update call_leads set
      first_name = v_naam, notes = coalesce(v_notitie, notes),
      prequal_answers = coalesce(v_antw, prequal_answers),
      lead_goal = coalesce(nullif(p->>'doel', ''), lead_goal),
      last_touched = now()
    where id = v_lead;
    return v_lead;
  end if;

  insert into call_leads (
    first_name, last_name, email, status, priority, lead_source, coach_id, team_id, assigned_at,
    utm_source, utm_medium, utm_campaign, utm_content, referrer_url,
    lead_goal, lead_temperature, notes, prequal_answers, last_touched
  ) values (
    v_naam, '', v_email, 'new', 'medium', 'mijn_menu', v_coach, v_team, now(),
    nullif(p->>'utm_source',''), nullif(p->>'utm_medium',''), nullif(p->>'utm_campaign',''),
    nullif(p->>'utm_content',''), left(nullif(p->>'referrer',''), 500),
    nullif(p->>'doel',''), 'warm', v_notitie, v_antw, now()
  ) returning id into v_lead;

  insert into lead_section_items (lead_id, section_id, position, moved_at)
  values (v_lead, v_sectie, 0, now());

  insert into lead_movements (lead_id, lead_name, from_section_id, from_section_title, to_section_id, to_section_title, coach_id, moved_at, outcome_type)
  values (v_lead, v_naam, null, 'Niet toegewezen', v_sectie, '🧲 Mijn menu', v_coach, now(), 'mijn_menu');

  return v_lead;
end;
$function$;

-- Elk gerecht één keer per niveau: id, moment (eerste timing), niveau (uit
-- het label dagmenu_2000 / wissel_2250 …), macro's, foto, bereiding en de
-- ingrediënten met gram, categorie, allergenen en voedingswaarde per 100 g.
create or replace function public.get_mijn_menu_maaltijden()
returns jsonb language sql stable security definer set search_path to 'public' as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'naam', m.name, 'moment', m.timing[1],
    'niveau', (select max(substring(l from '_(\d+)$')::int) from jsonb_array_elements_text(m.labels) l where l ~ '^(dagmenu|wissel)_\d+$'),
    'set', (select min(split_part(l, '_', 1)) from jsonb_array_elements_text(m.labels) l where l ~ '^(dagmenu|wissel)_\d+$'),
    'kcal', m.calories, 'eiwit', m.protein, 'kh', m.carbs, 'vet', m.fat,
    'foto', nullif(m.image_url, ''),
    'stappen', coalesce(to_jsonb(m.preparation_steps), '[]'::jsonb),
    'minuten', coalesce(m.prep_time_min, 0) + coalesce(m.cook_time_min, 0),
    'ingredienten', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id, 'naam', i.name, 'gram', (e->>'amount')::numeric, 'categorie', i.category,
        'allergenen', coalesce(to_jsonb(i.allergens), '[]'::jsonb),
        'kcal100', i.calories_per_100g, 'eiwit100', i.protein_per_100g, 'kh100', i.carbs_per_100g, 'vet100', i.fat_per_100g,
        'eenheid', i.eenheid, 'gram_per_eenheid', i.gram_per_eenheid
      ) order by x.n), '[]'::jsonb)
      from jsonb_array_elements(m.ingredients_list) with ordinality x(e, n)
      join ai_ingredients i on i.id::text = e->>'ingredient_id'
    )
  ) order by m.name), '[]'::jsonb)
  from ai_meals m
  where m.partner is null and m.timing[1] in ('breakfast', 'lunch', 'dinner', 'snack')
    and jsonb_typeof(m.labels) = 'array'
    and exists (select 1 from jsonb_array_elements_text(m.labels) l where l ~ '^(dagmenu|wissel)_\d+$');
$function$;

revoke all on function public.submit_mijn_menu(jsonb) from public;
grant execute on function public.submit_mijn_menu(jsonb) to anon, authenticated, service_role;
revoke all on function public.get_mijn_menu_maaltijden() from public;
grant execute on function public.get_mijn_menu_maaltijden() to anon, authenticated, service_role;

-- Ads-scherm per pagina (zie src/modules/challenge-ads/ads-per-pagina.sql).
create or replace function public._ads_paden(p_pagina text) returns text[]
language sql immutable as $$
  select case coalesce(p_pagina, '/challenge')
    when '/challenge' then array['/challenge', '/challenge/start']
    when '/mijn-split' then array['/mijn-split', '/mijnsplit']
    when '/mijn-menu' then array['/mijn-menu', '/mijnmenu']
    else array[p_pagina] end
$$;

create or replace function public._ads_lead_bron(p_pagina text) returns text
language sql immutable as $$
  select case coalesce(p_pagina, '/challenge')
    when '/challenge' then 'challenge_prequal'
    when '/mijn-split' then 'mijn_split'
    when '/mijn-menu' then 'mijn_menu'
    else '__geen' end
$$;
