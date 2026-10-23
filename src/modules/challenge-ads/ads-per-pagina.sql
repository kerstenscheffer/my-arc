-- src/modules/challenge-ads/ads-per-pagina.sql
--
-- Ads-scherm per pagina (23 okt 2026). get_challenge_ads_overzicht en
-- get_prequal_stappen kregen een derde parameter p_pagina (standaard
-- '/challenge', dus het scherm zonder keuze werkt als voorheen):
--   - pagina-events alleen van die pagina (challenge_events.pad)
--   - leads alleen met de lead_source van die pagina
--   - spend: bij /challenge alles zoals voorheen; bij een andere pagina
--     alleen campagnes die in de periode bezoek op die pagina hadden
--   - nieuw veld per hook: pdf (event pdf_download, /mijn-split)
--
-- De functies zijn niet met de hand overgetypt: dit blok neemt de bestaande
-- tekst en vervangt gericht stukjes; elk stukje moet precies gevonden worden.

create or replace function public._ads_paden(p_pagina text) returns text[]
language sql immutable as $$
  select case coalesce(p_pagina, '/challenge')
    when '/challenge' then array['/challenge', '/challenge/start']
    when '/mijn-split' then array['/mijn-split', '/mijnsplit']
    else array[p_pagina] end
$$;

create or replace function public._ads_lead_bron(p_pagina text) returns text
language sql immutable as $$
  select case coalesce(p_pagina, '/challenge')
    when '/challenge' then 'challenge_prequal'
    when '/mijn-split' then 'mijn_split'
    else '__geen' end
$$;

do $blok$
declare
  src text;
  nieuw text;
begin
  -- ── get_challenge_ads_overzicht ──
  select prosrc into src from pg_proc
   where proname = 'get_challenge_ads_overzicht' and pronamespace = 'public'::regnamespace and pronargs = 2;
  if src is null then raise exception 'get_challenge_ads_overzicht (2 args) niet gevonden'; end if;

  nieuw := replace(src,
    'from challenge_events ev where ev.created_at >= p_van and ev.created_at < p_tot',
    'from challenge_events ev where ev.created_at >= p_van and ev.created_at < p_tot and ev.pad = any(_ads_paden(p_pagina))');
  if nieuw = src then raise exception 'stuk 1 (events) niet gevonden'; end if; src := nieuw;

  nieuw := replace(src,
    'bool_or(event=''geschikt_video_klaar'') gv100',
    'bool_or(event=''geschikt_video_klaar'') gv100, bool_or(event=''pdf_download'') pdf');
  if nieuw = src then raise exception 'stuk 2 (s0 pdf) niet gevonden'; end if; src := nieuw;

  nieuw := replace(src,
    'count(*) filter (where gv100) geschikt_video_klaar',
    'count(*) filter (where gv100) geschikt_video_klaar, count(*) filter (where pdf) pdf');
  if nieuw = src then raise exception 'stuk 3 (hooks pdf) niet gevonden'; end if; src := nieuw;

  nieuw := replace(src,
    'cl.lead_source = ''challenge_prequal''',
    'cl.lead_source = _ads_lead_bron(p_pagina)');
  if nieuw = src then raise exception 'stuk 4 (leads) niet gevonden'; end if; src := nieuw;

  nieuw := replace(src,
    E'    from meta_ad_insights\n    where dag >=',
    E'    from meta_ad_insights\n    where (coalesce(p_pagina, ''/challenge'') = ''/challenge'' or coalesce(campaign_name,''(geen)'') in (select camp from e)) and dag >=');
  if nieuw = src then raise exception 'stuk 5 (spend) niet gevonden'; end if; src := nieuw;

  nieuw := replace(src,
    E'        from meta_ad_insights mi\n        where mi.dag >=',
    E'        from meta_ad_insights mi\n        where (coalesce(p_pagina, ''/challenge'') = ''/challenge'' or coalesce(mi.campaign_name,''(geen)'') in (select camp from e)) and mi.dag >=');
  if nieuw = src then raise exception 'stuk 6 (spend per dag) niet gevonden'; end if; src := nieuw;

  drop function public.get_challenge_ads_overzicht(timestamptz, timestamptz);
  execute format($f$create function public.get_challenge_ads_overzicht(p_van timestamptz, p_tot timestamptz, p_pagina text default '/challenge')
    returns jsonb language sql stable security definer set search_path = public as %L$f$, src);
  revoke all on function public.get_challenge_ads_overzicht(timestamptz, timestamptz, text) from public, anon;
  grant execute on function public.get_challenge_ads_overzicht(timestamptz, timestamptz, text) to authenticated, service_role;

  -- ── get_prequal_stappen ──
  select prosrc into src from pg_proc
   where proname = 'get_prequal_stappen' and pronamespace = 'public'::regnamespace and pronargs = 2;
  if src is null then raise exception 'get_prequal_stappen (2 args) niet gevonden'; end if;

  nieuw := replace(src,
    E'where ev.created_at >= p_van and ev.created_at < p_tot\n      and ev.event in',
    E'where ev.created_at >= p_van and ev.created_at < p_tot\n      and ev.pad = any(_ads_paden(p_pagina))\n      and ev.event in');
  if nieuw = src then raise exception 'stuk 7 (stappen) niet gevonden'; end if; src := nieuw;

  drop function public.get_prequal_stappen(timestamptz, timestamptz);
  execute format($f$create function public.get_prequal_stappen(p_van timestamptz, p_tot timestamptz, p_pagina text default '/challenge')
    returns table(camp text, hook text, ad boolean, vraag text, stap numeric, gezien bigint, beantwoord bigint, afgewezen bigint)
    language sql stable security definer set search_path = public as %L$f$, src);
  revoke all on function public.get_prequal_stappen(timestamptz, timestamptz, text) from public, anon;
  grant execute on function public.get_prequal_stappen(timestamptz, timestamptz, text) to authenticated, service_role;
end
$blok$;
