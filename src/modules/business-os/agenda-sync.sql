-- src/modules/business-os/agenda-sync.sql
--
-- Google Agenda meelezen (30 okt 2026). Alleen lezen: de edge function
-- agenda-sync haalt Kerstens geheime iCal-link (secret GOOGLE_AGENDA_ICS) op
-- en zet de afspraken van 7 dagen terug t/m 30 dagen vooruit in agenda_events.
-- Er gaat niets terug naar Google. pg_cron roept de functie elke 15 minuten
-- aan. Business OS leest 'm via get_business_os (agendaVandaag) en Gino via
-- business_os_lees / get_agenda (RLS: coach + team).
--
-- Los van agenda_blocks (eigen weekrooster); die tabel blijft ongemoeid.

create table if not exists public.agenda_events (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  uid text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  hele_dag boolean not null default false,
  titel text,
  locatie text,
  beschrijving text,
  soort text not null default 'overig',
  bron text not null default 'google_ics',
  bijgewerkt_at timestamptz not null default now(),
  unique (coach_id, uid, start_at)
);
comment on table public.agenda_events is
  'Kerstens Google Agenda (alleen lezen, via iCal-feed, elke 15 min). soort: paviljoen, salescall, opstartcall, klantcall, overig. contact_naam: naam uit "<naam> en Kersten Scheffer". Tijden in UTC; toon in Europe/Amsterdam.';
create index if not exists agenda_events_coach_start on public.agenda_events (coach_id, start_at);

-- 30 okt 2026: naam uit Calendly/Zoom-titels ('<naam> en Kersten Scheffer').
-- Alleen toegevoegd (nullable); get_agenda geeft 'm via select * mee.
alter table public.agenda_events add column if not exists contact_naam text;

alter table public.agenda_events enable row level security;
drop policy if exists agenda_events_team_lezen on public.agenda_events;
create policy agenda_events_team_lezen on public.agenda_events
  for select to authenticated
  using (coach_id = any(public.team_coach_ids(auth.uid())));
-- Schrijven: geen policies, dus alleen de service role (edge function).
revoke all on public.agenda_events from anon;
revoke insert, update, delete, truncate on public.agenda_events from authenticated;
grant select on public.agenda_events to authenticated;

create or replace function public.get_agenda(van date, tot date)
returns setof public.agenda_events
language sql stable security invoker
set search_path = public
as $$
  select * from agenda_events
  where coach_id = any(team_coach_ids(auth.uid()))
    and start_at < ((tot + 1)::timestamp at time zone 'Europe/Amsterdam')
    and coalesce(end_at, start_at) >= (van::timestamp at time zone 'Europe/Amsterdam')
  order by start_at
$$;
revoke all on function public.get_agenda(date, date) from public, anon;
grant execute on function public.get_agenda(date, date) to authenticated;

-- Cron: elke 15 minuten de edge function aanroepen (anon-sleutel is publiek;
-- de functie leest de iCal-link zelf uit haar secrets). Staat live sinds
-- 30 okt 2026 (jobname agenda-sync); hieronder ter documentatie.
-- select cron.schedule('agenda-sync', '*/15 * * * *', $c$
--   select net.http_post(
--     url := 'https://xlaycpwpnhjmulfsnynh.supabase.co/functions/v1/agenda-sync',
--     headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <anon-key>'),
--     body := '{}'::jsonb, timeout_milliseconds := 30000)
-- $c$);

-- get_business_os: zelfde als live (zie business-os.sql + sale-uitgesteld.sql)
-- plus het veld agendaVandaag. Bestaande velden ongewijzigd.
create or replace function public.get_business_os(p_van date, p_tot date)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_team uuid[];
  v_res jsonb;
  v_dag date := (now() at time zone 'Europe/Amsterdam')::date;
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
      on m.moved_at >= per.van and m.moved_at < per.tot and m.reverted_at is null and m.coach_id = any(v_team) and coalesce(m.challenge_status, '') <> 'uitgesteld'
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
        where m.reverted_at is null and m.order_value is not null and m.coach_id = any(v_team) and coalesce(m.challenge_status, '') <> 'uitgesteld'
        order by m.moved_at desc limit 6) q), '[]'::jsonb),
    'uitgesteld', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'lead_id', m.lead_id, 'naam', m.lead_name, 'bedrag', m.order_value, 'sinds', (m.moved_at at time zone 'Europe/Amsterdam')::date, 'soort', m.sale_kind) order by m.moved_at)
        from lead_movements m
        where m.reverted_at is null and m.order_value > 0 and m.coach_id = any(v_team)
          and m.challenge_status = 'uitgesteld'), '[]'::jsonb),
    -- Afspraken van vandaag uit Google Agenda (agenda_events), NL-tijd.
    'agendaVandaag', coalesce((select jsonb_agg(jsonb_build_object(
        'titel', e.titel, 'start', e.start_at, 'eind', e.end_at,
        'soort', e.soort, 'heleDag', e.hele_dag, 'contactNaam', e.contact_naam) order by e.hele_dag desc, e.start_at)
      from agenda_events e
      where e.coach_id = any(v_team)
        and e.start_at < ((v_dag + 1)::timestamp at time zone 'Europe/Amsterdam')
        and coalesce(e.end_at, e.start_at) > (v_dag::timestamp at time zone 'Europe/Amsterdam')), '[]'::jsonb),
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
