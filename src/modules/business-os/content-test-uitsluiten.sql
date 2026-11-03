-- src/modules/business-os/content-test-uitsluiten.sql
--
-- 1 nov 2026: testrijen (titel begint met '__test') tellen nergens mee.
-- Nieuwe RPC content_stand_per_dag_v2 (zelfde uitvoer, zonder testrijen); de
-- oude blijft staan voor oudere app-versies. De frontend (contentStatusData.js
-- laadStandPerDag) probeert v2 en valt anders terug op v1 + zelf aftrekken.
-- Gedraaid op 3 nov 2026.

create or replace function public.content_stand_per_dag_v2(p_van date, p_tot date)
returns table (dag date, draft int, ingepland int, gepost int, mislukt int, los_gepost int, views bigint)
language sql stable security invoker set search_path = public as $$
  with d as (select generate_series(p_van, p_tot, interval '1 day')::date dag),
  i as (
    select ci.planned_date dag, s.stand, s.views from content_items ci join content_items_status s on s.id = ci.id
    where ci.coach_id = auth.uid() and ci.planned_date between p_van and p_tot
      and coalesce(ci.is_template, false) = false and coalesce(ci.autopilot_status, '') not in ('overgeslagen')
      and coalesce(ci.title, '') not like '\_\_test%'
  ),
  l as (
    select m.dag, count(*)::int n, sum(m.views) v from content_ig_media m
    where m.eigenaar = content_eigenaar() and m.dag between p_van and p_tot and m.soort <> 'story'
      and not exists (select 1 from content_items x where x.ig_media_id = m.id)
    group by m.dag
  )
  select d.dag,
    (select count(*) from i where i.dag = d.dag and stand = 'draft')::int,
    (select count(*) from i where i.dag = d.dag and stand = 'ingepland')::int,
    (select count(*) from i where i.dag = d.dag and stand = 'gepost')::int + coalesce(l.n, 0),
    (select count(*) from i where i.dag = d.dag and stand = 'mislukt')::int,
    coalesce(l.n, 0),
    coalesce((select sum(views) from i where i.dag = d.dag and stand = 'gepost'), 0) + coalesce(l.v, 0)
  from d left join l on l.dag = d.dag
  order by d.dag;
$$;
revoke all on function public.content_stand_per_dag_v2(date, date) from public, anon;
grant execute on function public.content_stand_per_dag_v2(date, date) to authenticated;
