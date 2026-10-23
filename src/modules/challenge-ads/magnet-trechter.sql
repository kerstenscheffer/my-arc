-- Comment-magnet-trechter (23 okt 2026).
--
-- De route: reel met "comment WOORD" → comments → commenters op het bord
-- (elke ochtend via screenshot + Claude, met de magnet in
-- call_leads.lead_magnets_shared) → reactie → call → sale.
-- Getoond in het Ads-paneel op het leadbord, pagina "Comment-magnets",
-- in dezelfde vijf-fasen-rij als de advertenties.

-- 1. Comments per post meenemen in de Instagram-sync.
--    Let op: comments_count telt ook je eigen antwoorden onder de reel mee.
alter table public.content_ig_media add column if not exists comments int;

-- 2. Het trigger-woord per lead magnet. lead_magnets_shared bevat een mix
--    van magnet-id's, magnet-namen ('Lidl magnet') en losse woorden ('PREP').
alter table public.lead_magnets add column if not exists woord text;
update public.lead_magnets set woord = case
    when upper(name) in ('MEAL PREPPING', 'PREP') then 'PREP'
    when upper(name) in ('LIDL MAGNET', 'LIDL') then 'LIDL'
    when upper(name) = 'HONGER' then 'HONGER'
    when upper(name) in ('JUMBO PRODUCTEN', 'JUBMO') then 'JUMBO'
    when upper(name) in ('AH MAGNET', 'AH') then 'AH'
  end
where woord is null and upper(name) in ('MEAL PREPPING', 'PREP', 'LIDL MAGNET', 'LIDL', 'HONGER', 'JUMBO PRODUCTEN', 'JUBMO', 'AH MAGNET', 'AH');

-- Eén element uit lead_magnets_shared → het trigger-woord.
-- Security definer: sommige magnets staan op naam van een andere coach en
-- zijn door RLS onzichtbaar; dit geeft alleen het woord terug.
create or replace function public.magnet_woord(e text) returns text
language sql stable security definer set search_path to 'public' as $$
  select coalesce(
    (select upper(coalesce(m.woord, m.name)) from lead_magnets m
      where m.id::text = e or upper(m.name) = upper(e) order by (m.woord is null) limit 1),
    (select upper(m.woord) from lead_magnets m where upper(m.woord) = upper(e) limit 1),
    upper(trim(e)))
$$;

-- 3. De trechter in één keer: magnet-reels (views, comments) en de leads met
--    een magnet, met dezelfde stap-vlaggen als get_challenge_ads_overzicht.
--    Security invoker: RLS op content_ig_media en de leadtabellen bepaalt
--    wat je ziet.
create or replace function public.get_magnet_trechter(p_van timestamptz, p_tot timestamptz)
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
  with start as (
    -- Tellen vanaf de eerste Instagram-data (sync sinds 8 okt 2026): anders
    -- staan leads van maanden tegenover comments van twee weken.
    select greatest(p_van, coalesce((select date_trunc('day', min(tijd) at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam'
      from content_ig_media where soort in ('magnet', 'reel')), p_van)) v
  ),
  reels as (
    select upper(woord) woord, count(*) reels, sum(views) views,
      sum(comments) comments, count(comments) met_comments, count(views) met_views
    from content_ig_media
    where soort = 'magnet' and tijd >= (select v from start) and tijd < p_tot
    group by 1
  ),
  basis as (
    select cl.*, magnet_woord(cl.lead_magnets_shared[1]) woord
    from call_leads cl
    where cl.deleted_at is null and cl.created_at >= (select v from start) and cl.created_at < p_tot
      and cardinality(cl.lead_magnets_shared) > 0
  ),
  mv as (
    select m.lead_id,
      bool_or(m.outcome_type = 'dm_gestuurd') dm_gestuurd,
      bool_or(lower(m.to_section_title) ~ '(gesprek|reactie|gereageerd|antwoord)') gesprek,
      bool_or(lower(m.to_section_title) ~ '(voorgesteld|voorstel)') voorgesteld,
      bool_or(m.call_date is not null or lower(m.to_section_title) ~ '(sales call|ingepland|scheduled|booking|afspraak|meeting)') ingepland,
      bool_or(coalesce(m.call_happened, false)) gehouden,
      bool_or(lower(m.to_section_title) ~ '(afgewezen|geweigerd|rejected)') afgewezen,
      bool_or(lower(m.to_section_title) ~ '(verloren|lost)') verloren,
      max(m.order_value) filter (where _meta_is_sale_titel(m.to_section_title) and coalesce(m.order_value, 0) > 0) omzet
    from lead_movements m where m.reverted_at is null and m.lead_id in (select id from basis) group by 1
  ),
  lc as (
    select distinct on (m.lead_id) m.lead_id, m.call_date, m.call_happened, m.outcome_type
    from lead_movements m
    where m.reverted_at is null and m.call_date is not null and coalesce(m.outcome_type, '') <> 'rescheduled'
      and m.lead_id in (select id from basis)
    order by m.lead_id, m.call_date desc, m.moved_at desc
  ),
  l0 as (
    select b.id, b.woord, b.created_at,
      trim(coalesce(b.first_name, '') || ' ' || coalesce(b.last_name, '')) naam,
      coalesce(mv.dm_gestuurd, false) or b.first_dm_sent_at is not null or b.last_followup_sent_at is not null
        or coalesce(b.followup_count, 0) > 0 or b.last_contacted_at is not null
        or exists (select 1 from lead_followup_events f where f.lead_id = b.id) bericht_los,
      b.first_reply_at is not null or coalesce(b.reply_count, 0) > 0 or coalesce(mv.gesprek, false)
        or exists (select 1 from lead_reaction_events r where r.lead_id = b.id and r.delta > 0) reactie,
      coalesce(mv.voorgesteld, false) voorgesteld_los,
      coalesce(b.calendly_scheduled, false) or coalesce(mv.ingepland, false) ingepland,
      coalesce(mv.gehouden, false) gehouden_los,
      coalesce(mv.afgewezen, false) afgewezen,
      coalesce(mv.verloren, false) verloren,
      mv.omzet, lc.call_happened, lc.outcome_type call_uitkomst,
      (select sec.title from lead_section_items i join lead_sections sec on sec.id = i.section_id where i.lead_id = b.id limit 1) sectie
    from basis b left join mv on mv.lead_id = b.id left join lc on lc.lead_id = b.id
  ),
  l as (
    select id, woord, created_at, naam, sectie, omzet, verloren, afgewezen,
      -- Elke latere stap betekent dat de eerdere ook gebeurd is.
      (gehouden_los or coalesce(omzet, 0) > 0 or verloren) gehouden,
      (voorgesteld_los or ingepland or afgewezen) voorgesteld,
      (reactie or voorgesteld_los or ingepland or afgewezen) contact,
      (bericht_los or reactie or voorgesteld_los or ingepland or afgewezen) bericht,
      ingepland call,
      coalesce(call_happened = false and coalesce(call_uitkomst, '') <> 'cancelled'
        and not (gehouden_los or coalesce(omzet, 0) > 0 or verloren), false) noshow
    from l0
  ),
  -- Calls en sales IN de periode, van alle magnet-leads (ook van vóór de
  -- periode): een sale komt vaak weken na de comment. Net als de stats-balk.
  mleads as (
    select cl.id, magnet_woord(cl.lead_magnets_shared[1]) woord, cl.first_reply_at
    from call_leads cl where cl.deleted_at is null and cardinality(cl.lead_magnets_shared) > 0
  ),
  ev as (
    select m.lead_id,
      bool_or(m.moved_at >= p_van and m.moved_at < p_tot and lower(m.to_section_title) ~ '(voorgesteld|voorstel)') voorgesteld,
      bool_or(m.moved_at >= p_van and m.moved_at < p_tot and (m.call_date is not null or lower(m.to_section_title) ~ '(sales call|ingepland|scheduled|booking|afspraak|meeting)')) ingepland,
      bool_or(coalesce(m.call_happened, false) and coalesce(m.call_date::timestamptz, m.moved_at) >= p_van and coalesce(m.call_date::timestamptz, m.moved_at) < p_tot) gehouden,
      bool_or(m.call_happened = false and coalesce(m.outcome_type, '') <> 'cancelled' and m.call_date::timestamptz >= p_van and m.call_date::timestamptz < p_tot) noshow,
      max(m.order_value) filter (where m.moved_at >= p_van and m.moved_at < p_tot and _meta_is_sale_titel(m.to_section_title) and coalesce(m.order_value, 0) > 0) omzet
    from lead_movements m join mleads ml on ml.id = m.lead_id
    where m.reverted_at is null and (m.moved_at >= p_van - interval '60 days')
    group by 1
  ),
  st as (
    select ml.id, ml.woord,
      coalesce(ml.first_reply_at >= p_van and ml.first_reply_at < p_tot, false)
        or exists (select 1 from lead_reaction_events r where r.lead_id = ml.id and r.delta > 0 and r.created_at >= p_van and r.created_at < p_tot) reactie,
      coalesce(ev.voorgesteld, false) voorgesteld, coalesce(ev.ingepland, false) call,
      coalesce(ev.gehouden, false) or ev.omzet is not null gehouden,
      coalesce(ev.noshow, false) and not (coalesce(ev.gehouden, false) or ev.omzet is not null) noshow,
      ev.omzet
    from mleads ml left join ev on ev.lead_id = ml.id
  )
  select jsonb_build_object(
    'stappen', coalesce((select jsonb_agg(to_jsonb(x)) from st x where x.reactie or x.voorgesteld or x.call or x.gehouden or x.noshow or x.omzet is not null), '[]'::jsonb),
    'reels', coalesce((select jsonb_agg(to_jsonb(r) order by r.views desc nulls last) from reels r), '[]'::jsonb),
    'leads', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from l x), '[]'::jsonb),
    'vanaf', (select v from start),
    'comments_bijgewerkt', (select max(updated_at) from content_ig_media where comments is not null)
  );
$function$;

revoke execute on function public.magnet_woord(text) from public, anon;
grant execute on function public.magnet_woord(text) to authenticated;
revoke execute on function public.get_magnet_trechter(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_magnet_trechter(timestamptz, timestamptz) to authenticated;
