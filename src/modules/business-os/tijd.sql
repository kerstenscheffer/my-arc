-- Gino's tijdmeter (2 nov 2026). Live gezet via execute_sql.
-- business_os_tijd: één rij per minuut achter de Mac (scripts/gino-tijd.mjs).
-- business_os_tijd_regels: Gino's/Kerstens eigen indeling (pa-db.mjs tijd-regel).
-- business_os_tijd_overzicht(van, tot): per dag/uur/bron, eigen regel wint (ook terug in de tijd).
--
-- 5 nov 2026: agenda-calls tellen mee, en MY ARC-minuten staan per tabje in 'bronnen'.
-- Zelfde naam en vorm van het antwoord, dus oude app-versies lezen dit gewoon.
-- - Afgelopen agenda_events met soort salescall, klantcall of opstartcall: elke
--   minuut tussen start en eind is 'calls'.
-- - Eén minuut telt één keer: viel de meter in dat stuk op iets anders, dan wint
--   de call. Zoom-minuten erbinnen blijven Zoom; Zoom erbuiten blijft ook calls.
-- - Hele dagen en blokken langer dan 2 uur tellen niet: "Diepgaande check-in" op
--   zaterdag (7 u) krijgt soort klantcall door het woord check, maar is geen call.
-- - Blokken waarvan de titel begint met 'Plan check' tellen niet: die hebben soort
--   klantcall maar zijn voorbereiding. De soort zelf blijft staan; alleen deze telling
--   slaat ze over. Wat de meter in dat stuk zag, telt gewoon in zijn eigen categorie.
-- - Alleen de soort komt in 'bronnen', nooit de titel of de contactnaam.

create or replace function public.business_os_tijd_overzicht(van date, tot date)
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
  with grens as (
    select (van::timestamp at time zone 'Europe/Amsterdam') as v,
           ((tot + 1)::timestamp at time zone 'Europe/Amsterdam') as t
  ),
  meter as (
    select t.minuut,
      case when t.pad like '#%' and coalesce(t.domein, '') ~ '(myarcfitness|localhost|127\.0\.0\.1)'
        then 'MY ARC ' || split_part(split_part(substr(t.pad, 2), ':', 1), '?', 1)
        else coalesce(t.domein, t.app) end as bron,
      coalesce((select r.categorie from business_os_tijd_regels r
        where r.coach_id = t.coach_id and (
          lower(coalesce(t.app,'')) like '%' || lower(r.patroon) || '%'
          or lower(coalesce(t.domein,'') || coalesce(t.pad,'')) like '%' || lower(r.patroon) || '%'
          or lower(coalesce(t.titel,'')) like '%' || lower(r.patroon) || '%')
        order by length(r.patroon) desc limit 1), t.categorie) as categorie
    from business_os_tijd t, grens g
    where t.coach_id = auth.uid()
      and t.minuut >= g.v
      and t.minuut < g.t
  ),
  agenda as (
    select distinct on (s.minuut) s.minuut, 'Agenda ' || a.soort as bron
    from agenda_events a
    cross join grens g
    cross join lateral generate_series(
      date_trunc('minute', a.start_at), a.end_at - interval '1 second', interval '1 minute') as s(minuut)
    where a.coach_id = auth.uid()
      and a.soort in ('salescall', 'klantcall', 'opstartcall')
      and a.hele_dag is not true
      and coalesce(a.titel, '') not ilike 'plan check%'
      and a.end_at <= now()
      and a.end_at - a.start_at <= interval '2 hours'
      and a.end_at > g.v
      and a.start_at < g.t
      and s.minuut >= g.v
      and s.minuut < g.t
    order by s.minuut, a.start_at
  ),
  m as (
    select x.minuut,
      (x.minuut at time zone 'Europe/Amsterdam')::date as dag,
      extract(hour from x.minuut at time zone 'Europe/Amsterdam')::int as uur,
      x.bron, x.categorie
    from (
      select coalesce(me.minuut, ag.minuut) as minuut,
        case when ag.minuut is not null and me.categorie is distinct from 'calls' then ag.bron else me.bron end as bron,
        case when ag.minuut is not null then 'calls' else me.categorie end as categorie
      from meter me
      full join agenda ag on ag.minuut = me.minuut
    ) x
  )
  select jsonb_build_object(
    'dagen', coalesce((select jsonb_agg(x order by x->>'dag') from (
      select jsonb_build_object('dag', dag, 'categorie', categorie, 'minuten', count(*)) x from m group by dag, categorie) d), '[]'),
    'uren', coalesce((select jsonb_agg(x) from (
      select jsonb_build_object('uur', uur, 'categorie', categorie, 'minuten', count(*)) x from m group by uur, categorie) u), '[]'),
    'bronnen', coalesce((select jsonb_agg(x order by (x->>'minuten')::int desc) from (
      select jsonb_build_object('bron', bron, 'categorie', categorie, 'minuten', count(*)) x
      from m group by bron, categorie order by count(*) desc limit 25) b), '[]'),
    'totaal', (select count(*) from m)
  )
$function$;
