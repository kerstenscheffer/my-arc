-- src/modules/business-os/business-os.sql
--
-- Business OS (30 okt 2026): één scherm waar alles samenkomt. Eén RPC levert
-- de keten content → leads → reactie → call → sale → € voor een periode, de
-- gemiddelden van de 3 maanden ervoor (om de zwakste schakel te vinden), de
-- calls van vandaag/morgen, de laatste sales en de status van de "agents"
-- (pg_cron-jobs). Team-breed via team_coach_ids(auth.uid()).
--
-- Tellingen (bewust simpel, zelfde bronnen als de rest van de app):
--   reels/magnets/views/comments → content_ig_media (stories en foto's eruit)
--   nieuwe leads   → call_leads.created_at
--   reacties       → unieke leads in lead_reaction_events (delta > 0)
--   calls          → unieke leads verplaatst naar een 'sales call'-sectie
--   sales/omzet    → lead_movements met order_value (orderwaarde, niet ontvangen)

create or replace function public.get_business_os(p_van date, p_tot date)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_team uuid[];
  v_res jsonb;
begin
  if auth.uid() is null then raise exception 'niet ingelogd'; end if;
  v_team := team_coach_ids(auth.uid());

  with
  per as (
    select 'nu' p, p_van van, p_tot tot
    union all
    select 'voor', (p_van - interval '3 months')::date, p_van
  ),
  content as (
    select per.p,
      count(*) filter (where m.soort = 'reel') reels,
      count(*) filter (where m.soort = 'magnet') magnets,
      coalesce(sum(m.views) filter (where m.soort in ('reel','magnet')), 0) views,
      coalesce(sum(m.comments) filter (where m.soort in ('reel','magnet')), 0) comments
    from per left join content_ig_media m
      on m.dag >= per.van and m.dag < per.tot and m.eigenaar = any(v_team)
    group by per.p
  ),
  leads as (
    select per.p, count(l.id) leads
    from per left join call_leads l
      on l.created_at >= per.van and l.created_at < per.tot and l.coach_id = any(v_team)
    group by per.p
  ),
  reacties as (
    select per.p, count(distinct r.lead_id) reacties
    from per left join lead_reaction_events r
      on r.created_at >= per.van and r.created_at < per.tot and r.delta > 0 and r.coach_id = any(v_team)
    group by per.p
  ),
  mov as (
    select per.p,
      count(distinct m.lead_id) filter (where lower(m.to_section_title) like '%sales call%') calls,
      count(distinct m.lead_id) filter (where m.order_value is not null) sales,
      coalesce(sum(m.order_value), 0) omzet
    from per left join lead_movements m
      on m.moved_at >= per.van and m.moved_at < per.tot and m.reverted_at is null and m.coach_id = any(v_team)
    group by per.p
  ),
  keten as (
    select c.p, jsonb_build_object(
      'reels', c.reels, 'magnets', c.magnets, 'views', c.views, 'comments', c.comments,
      'leads', l.leads, 'reacties', r.reacties, 'calls', mv.calls, 'sales', mv.sales, 'omzet', mv.omzet) j
    from content c join leads l using (p) join reacties r using (p) join mov mv using (p)
  )
  select jsonb_build_object(
    'nu',   (select j from keten where p = 'nu'),
    -- totaal over 3 maanden; de UI deelt door 3
    'voor', (select j from keten where p = 'voor'),
    'klanten', (select jsonb_build_object(
        'actief', count(*) filter (where status = 'active'),
        'totaal', count(*))
      from clients where coach_id = any(v_team)),
    'calls', coalesce((select jsonb_agg(x order by x->>'datum', x->>'tijd') from (
        select distinct on (m.lead_id) jsonb_build_object('naam', m.lead_name, 'datum', m.call_date, 'tijd', m.call_time) x
        from lead_movements m
        where m.reverted_at is null and m.coach_id = any(v_team)
          and m.call_date >= current_date and m.call_date < current_date + 3
          and lower(m.to_section_title) like '%sales call%'
        order by m.lead_id, m.moved_at desc) q), '[]'::jsonb),
    'sales', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('naam', m.lead_name, 'bedrag', m.order_value, 'at', m.moved_at) x
        from lead_movements m
        where m.reverted_at is null and m.order_value is not null and m.coach_id = any(v_team)
        order by m.moved_at desc limit 6) q), '[]'::jsonb),
    'agents', coalesce((select jsonb_agg(jsonb_build_object(
        'naam', j.jobname, 'schema', j.schedule, 'actief', j.active,
        'laatst', d.start_time, 'status', d.status) order by j.jobname)
      from cron.job j
      left join lateral (select start_time, status from cron.job_run_details r
                         where r.jobid = j.jobid order by start_time desc limit 1) d on true), '[]'::jsonb)
  ) into v_res;

  return v_res;
end $$;

revoke all on function public.get_business_os(date, date) from public, anon;
grant execute on function public.get_business_os(date, date) to authenticated;
