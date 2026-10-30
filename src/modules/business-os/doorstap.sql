-- src/modules/business-os/doorstap.sql
--
-- Doorstap na de week-5 evaluatie (30 okt 2026). Een mondeling ja, 'denkt na'
-- of 'nee' werd nergens bewaard; de verlenging zelf komt pas als sale binnen
-- (lead_movements 'verlenging' via TrajectModal). Nu: tabel client_doorstap,
-- elke wijziging een nieuwe rij, de laatste telt. Status null = weer leeg.
--
-- Alleen toevoegen (oude app-versies): nieuwe tabel + extra veld 'doorstap'
-- in get_business_os; alle bestaande velden ongewijzigd. Geen triggers, dus
-- geen meldingen naar klanten. clients wordt alleen gelezen.
--
-- Draaien in deze volgorde (tabel vóór de functie, anders faalt de RPC).

-- 1. Tabel + RLS: coach en team lezen/schrijven voor eigen klanten; klanten
--    en anon geen toegang.
create table if not exists public.client_doorstap (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  coach_id uuid not null,
  status text check (status in ('ja_mondeling','denkt_na','nee','betaald')),
  pakket text,
  notitie text,
  gezet_at timestamptz not null default now(),
  gezet_door uuid default auth.uid()
);
create index if not exists client_doorstap_client_idx on public.client_doorstap (client_id, gezet_at desc);
alter table public.client_doorstap enable row level security;

drop policy if exists client_doorstap_team_select on public.client_doorstap;
create policy client_doorstap_team_select on public.client_doorstap for select to authenticated
  using (exists (select 1 from clients c where c.id = client_id and c.coach_id = any(team_coach_ids(auth.uid()))));
drop policy if exists client_doorstap_team_insert on public.client_doorstap;
create policy client_doorstap_team_insert on public.client_doorstap for insert to authenticated
  with check (coach_id = any(team_coach_ids(auth.uid()))
    and exists (select 1 from clients c where c.id = client_id and c.coach_id = any(team_coach_ids(auth.uid()))));
drop policy if exists client_doorstap_team_update on public.client_doorstap;
create policy client_doorstap_team_update on public.client_doorstap for update to authenticated
  using (exists (select 1 from clients c where c.id = client_id and c.coach_id = any(team_coach_ids(auth.uid()))))
  with check (coach_id = any(team_coach_ids(auth.uid())));
revoke all on public.client_doorstap from anon;
grant select, insert, update on public.client_doorstap to authenticated;

-- 2. get_business_os: live definitie van 30 okt + veld 'doorstap'.
--    eindigend_30d = actieve klanten met trajecteinde (start + weken*7 +
--    pauzedagen) tussen vandaag-14 en vandaag+30.
--    pct = (ja_mondeling + betaald) / aantal met een status.
create or replace function public.get_business_os(p_van date, p_tot date)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
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
                         where r.jobid = j.jobid order by start_time desc limit 1) d on true), '[]'::jsonb),
    -- Doorstap na de week-5 evaluatie: laatste rij per klant (client_doorstap).
    'doorstap', (select jsonb_build_object(
        'ja_mondeling', jsonb_build_object('aantal', count(*) filter (where l.status = 'ja_mondeling'),
          'namen', coalesce(jsonb_agg(l.naam order by l.naam) filter (where l.status = 'ja_mondeling'), '[]'::jsonb)),
        'denkt_na', jsonb_build_object('aantal', count(*) filter (where l.status = 'denkt_na'),
          'namen', coalesce(jsonb_agg(l.naam order by l.naam) filter (where l.status = 'denkt_na'), '[]'::jsonb)),
        'nee', jsonb_build_object('aantal', count(*) filter (where l.status = 'nee'),
          'namen', coalesce(jsonb_agg(l.naam order by l.naam) filter (where l.status = 'nee'), '[]'::jsonb)),
        'betaald', jsonb_build_object('aantal', count(*) filter (where l.status = 'betaald'),
          'namen', coalesce(jsonb_agg(l.naam order by l.naam) filter (where l.status = 'betaald'), '[]'::jsonb)),
        'eindigend_30d', (select count(*) from clients c
          where c.coach_id = any(v_team) and c.status = 'active'
            and coalesce(c.coaching_status, 'active') <> 'ended'
            and c.coaching_start_date is not null and c.coaching_total_weeks is not null
            and (c.coaching_start_date + c.coaching_total_weeks * 7 + coalesce(c.coaching_paused_days_total, 0))
                between v_dag - 14 and v_dag + 30),
        'pct', case when count(*) filter (where l.status is not null) > 0
          then round(100.0 * count(*) filter (where l.status in ('ja_mondeling','betaald'))
                     / count(*) filter (where l.status is not null)) end)
      from (select distinct on (d.client_id) d.client_id, d.status,
              trim(concat_ws(' ', c.first_name, c.last_name)) naam
            from client_doorstap d join clients c on c.id = d.client_id
            where c.coach_id = any(v_team)
            order by d.client_id, d.gezet_at desc, d.id desc) l)
  ) into v_res;

  return v_res;
end $function$;

-- 3. Eerste statussen uit de week-5 calls (coach Kersten). Eenmalig: slaat
--    over als de klant al een rij heeft.
insert into public.client_doorstap (client_id, coach_id, status, notitie, gezet_door)
select v.id::uuid, '5a0135ac-3188-499d-8682-ed6a179e5541', v.s,
       'mondeling in week-5 call, 30 okt opgegeven', '5a0135ac-3188-499d-8682-ed6a179e5541'
from (values
  ('1410ee3e-3a09-43b6-8f4f-a75b554a1594', 'ja_mondeling'),  -- Mark Behr
  ('11792c0a-e179-4a3d-a895-6cb83c5bd4e1', 'ja_mondeling'),  -- Martijn Kroes
  ('936f7b51-1867-4ddd-8045-c289f32f0b70', 'ja_mondeling'),  -- Jacco Aalbregt
  ('a3ac491f-0893-4f19-8ce3-4081bc37d76c', 'ja_mondeling'),  -- Ronald Vervoort
  ('c3208491-9d3b-4ef2-b0bc-061d59deb34a', 'denkt_na')       -- Joris Harteel
) v(id, s)
where not exists (select 1 from public.client_doorstap d where d.client_id = v.id::uuid);
