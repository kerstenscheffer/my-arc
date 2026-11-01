-- src/modules/business-os/geldplan.sql
--
-- Geldplan (1 nov 2026): 6 maanden cashflow (nov 2026 t/m apr 2027) + break-even.
-- Eén rekenkern voor het scherm (Geldplan.jsx) én Gino (context 'geldplan'),
-- zodat scherm en chat nooit verschillen. Model afgestemd met Kersten 1 nov:
--   - nieuwe challengers per week N betalen borg B bij start (per dag N/7);
--   - na 42 dagen: D% stapt door (borg wordt omzet + 3 termijnen van 50, één
--     per 30 dagen na week 6), de rest krijgt borg_terug_pct van de borg terug;
--   - lopende challengers (lead_movements sale_kind challenge, open/behouden)
--     tellen echt mee; client_doorstap ja/nee wint van D%;
--   - overige coaching = komende termijnen uit get_payment_schedule;
--   - Marcel = marcel_pct van (definitief binnen − adspend − gedeelde lasten);
--   - jij houdt = definitief − adspend − Marcel − belastingreservering;
--   - saldo = startsaldo + binnen + Paviljoen + zorgtoeslag − borg terug
--     − Marcel − zakelijk − privé − adspend − belasting.
-- Instellingen: geldplan_standaard() (echte data) ← business_os_geldplan ←
-- p_instellingen. Alleen toevoegen: oude app-versies raken niets.

create table if not exists public.business_os_geldplan (
  coach_id uuid primary key default auth.uid(),
  instellingen jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.business_os_geldplan enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'business_os_geldplan' and policyname = 'coach_eigen_geldplan') then
    create policy coach_eigen_geldplan on public.business_os_geldplan
      for all to authenticated using (coach_id = auth.uid()) with check (coach_id = auth.uid());
  end if;
end $$;

grant select, insert, update on public.business_os_geldplan to authenticated;

-- Standaardwaarden, met echte data waar die er is.
create or replace function public.geldplan_standaard()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with team as (
    select auth.uid() as id
    union select unnest(public.team_coach_ids(auth.uid()))
  ),
  sales as (
    select count(*)::numeric as n
    from lead_movements m
    where m.coach_id in (select id from team)
      and m.reverted_at is null
      and m.sale_kind = 'challenge'
      and coalesce(m.challenge_status, 'open') <> 'uitgesteld'
      and m.moved_at >= now() - interval '56 days'
  ),
  doorstap as (
    select count(*) filter (where status like 'ja%')::numeric as ja,
           count(*) filter (where status like 'nee%')::numeric as nee
    from (
      select distinct on (d.client_id) d.status
      from client_doorstap d
      where d.coach_id in (select id from team)
      order by d.client_id, d.gezet_at desc
    ) x
  ),
  ad as (
    -- laatste 2 afgesloten maanden met spend (zonder campagne = 0 telt niet mee)
    select avg(bedrag) as gem from (
      select a.bedrag from ad_spend a
      where a.coach_id in (select id from team)
        and a.period < date_trunc('month', now())::date
        and a.bedrag > 0
      order by a.period desc limit 2
    ) y
  )
  select jsonb_build_object(
    'klanten_per_week', round(greatest(1, (select n from sales) / 8), 1),
    -- pas vanaf 8 besliste klanten de echte doorstap, anders 50%
    'doorstap_pct', (select case when ja + nee >= 8 then round(ja / (ja + nee) * 100) else 50 end from doorstap),
    'borg', 297,
    'borg_terug_pct', 100,
    'termijn', 50,
    'termijnen', 3,
    'marcel_pct', 50,
    -- 0 = Kerstens eigen som (1 nov: ca. 1.360 bij N=3). 250 = Marcel betaalt mee aan vaste lasten.
    'gedeelde_lasten', 0,
    'adspend', round(coalesce((select gem from ad), 0)),
    'zakelijk', 649,
    'zakelijk_extra_nov', 500,
    'zakelijk_extra_dec', 250,
    'prive', 700,
    'paviljoen', 'stop',
    'paviljoen_nov', 1000,
    'paviljoen_dec', 1700,
    'paviljoen_aan', 1700,
    'paviljoen_zondag', 880,
    'zorgtoeslag', 130,
    'startsaldo', 3271,
    'belasting_aan', false,
    'belasting_pct', 0,
    'noodgrens', 1000
  );
$$;

create or replace function public.get_geldplan(p_instellingen jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_coach uuid := auth.uid();
  s jsonb;
  n numeric; b numeric; d numeric; r numeric; t numeric; tn int; m numeric; g numeric;
  ad numeric; zak numeric; prive numeric; zorg numeric; tax numeric; pav text; pav_ss numeric;
  start date := date '2026-11-01';
  eind date := date '2027-05-01';
  vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  maanden jsonb;
  k numeric; doel numeric; def_nodig numeric; be numeric; jij_ss numeric;
begin
  if v_coach is null then raise exception 'niet ingelogd'; end if;

  s := public.geldplan_standaard()
    || coalesce((select instellingen from business_os_geldplan where coach_id = v_coach), '{}'::jsonb)
    || coalesce(p_instellingen, '{}'::jsonb);

  n := greatest(0, coalesce((s->>'klanten_per_week')::numeric, 0));
  b := coalesce((s->>'borg')::numeric, 297);
  d := least(1, greatest(0, coalesce((s->>'doorstap_pct')::numeric, 50) / 100));
  r := least(1, greatest(0, coalesce((s->>'borg_terug_pct')::numeric, 100) / 100));
  t := coalesce((s->>'termijn')::numeric, 50);
  tn := coalesce((s->>'termijnen')::int, 3);
  m := coalesce((s->>'marcel_pct')::numeric, 50) / 100;
  g := coalesce((s->>'gedeelde_lasten')::numeric, 0);
  ad := coalesce((s->>'adspend')::numeric, 0);
  zak := coalesce((s->>'zakelijk')::numeric, 0);
  prive := coalesce((s->>'prive')::numeric, 0);
  zorg := coalesce((s->>'zorgtoeslag')::numeric, 0);
  tax := case when coalesce((s->>'belasting_aan')::boolean, false)
              then coalesce((s->>'belasting_pct')::numeric, 0) / 100 else 0 end;
  pav := coalesce(s->>'paviljoen', 'stop');
  pav_ss := case pav when 'aan' then coalesce((s->>'paviljoen_aan')::numeric, 0)
                     when 'zondag' then coalesce((s->>'paviljoen_zondag')::numeric, 0)
                     else 0 end;

  with team as (
    select v_coach as id union select unnest(public.team_coach_ids(v_coach))
  ),
  -- Lopende challengers (echt) en nieuwe (model, per dag N/7).
  cohort as (
    select mv.moved_at::date as dag, 1::numeric as aantal, coalesce(mv.order_value, b) as borg,
           -- open: beslissing op week 6, of meteen in november als die al voorbij is
           case when mv.challenge_status = 'behouden' then mv.moved_at::date + 42
                else greatest(mv.moved_at::date + 42, start) end as besluit,
           case when mv.challenge_status = 'behouden' then 1::numeric
                when ds.status like 'ja%' then 1::numeric
                when ds.status like 'nee%' then 0::numeric
                else d end as door,
           false as nieuw,
           -- behouden = borg al omzet geweest; telt alleen nog voor termijnen
           mv.challenge_status = 'behouden' as al_behouden
    from lead_movements mv
    left join lateral (
      select x.status from client_doorstap x
      where mv.client_id is not null and x.client_id = mv.client_id
      order by x.gezet_at desc limit 1
    ) ds on true
    where mv.coach_id in (select id from team)
      and mv.reverted_at is null
      and mv.sale_kind = 'challenge'
      and coalesce(mv.challenge_status, 'open') in ('open', 'behouden')
      and mv.moved_at >= start - interval '200 days'
    union all
    select dg::date, n / 7, b, dg::date + 42, d, true, false
    from generate_series(greatest(start, vandaag), eind - 1, interval '1 day') dg
  ),
  gebeurtenis as (
    select dag as datum, 'borg_in' as soort, aantal * borg as bedrag from cohort where nieuw
    union all
    select besluit, 'behouden', aantal * borg * (door + (1 - door) * (1 - r)) from cohort where besluit >= start and not al_behouden
    union all
    select besluit, 'borg_terug', aantal * borg * (1 - door) * r from cohort where besluit >= start and not al_behouden
    union all
    select c.besluit + 30 * i, 'termijn', c.aantal * c.door * t
    from cohort c cross join generate_series(1, tn) i
    union all
    select greatest((e->>'datum')::date, start), 'overig', (e->>'bedrag')::numeric
    from jsonb_array_elements(coalesce(public.get_payment_schedule(v_coach, start - 120, eind), '[]'::jsonb)) e
    where coalesce((e->>'komt_nog')::boolean, true)
      and (e->>'datum')::date >= vandaag - 60
  ),
  per_maand as (
    select mnd::date as maand,
      coalesce(sum(bedrag) filter (where soort = 'borg_in'), 0) as borg_in,
      coalesce(sum(bedrag) filter (where soort = 'behouden'), 0) as behouden,
      coalesce(sum(bedrag) filter (where soort = 'borg_terug'), 0) as borg_terug,
      coalesce(sum(bedrag) filter (where soort = 'termijn'), 0) as termijnen,
      coalesce(sum(bedrag) filter (where soort = 'overig'), 0) as overig
    from generate_series(start, eind - 1, interval '1 month') mnd
    left join gebeurtenis ev on ev.datum >= mnd::date and ev.datum < (mnd + interval '1 month')::date
    group by mnd
  ),
  reken as (
    select p.*,
      p.borg_in + p.termijnen + p.overig as binnen,
      p.behouden + p.termijnen + p.overig as definitief,
      zak + case when p.maand = date '2026-11-01' then coalesce((s->>'zakelijk_extra_nov')::numeric, 0)
                 when p.maand = date '2026-12-01' then coalesce((s->>'zakelijk_extra_dec')::numeric, 0)
                 else 0 end as zakelijk,
      case when p.maand = date '2026-11-01' then coalesce((s->>'paviljoen_nov')::numeric, 0)
           when p.maand = date '2026-12-01' then coalesce((s->>'paviljoen_dec')::numeric, 0)
           else pav_ss end as paviljoen,
      (select coalesce(sum(c.aantal * c.borg), 0) from cohort c
        where not c.al_behouden and c.dag < (p.maand + interval '1 month')::date
          and c.besluit >= (p.maand + interval '1 month')::date) as openstaande_borg
    from per_maand p
  ),
  marcel as (
    select x.*, m * greatest(0, x.definitief - ad - g) as marcel from reken x
  ),
  jij as (
    select y.*, tax * greatest(0, y.definitief - ad - y.marcel) as belasting,
      (y.definitief - ad - y.marcel) * (1 - tax) as jij_houdt
    from marcel y
  ),
  saldo as (
    select z.*,
      z.binnen + z.paviljoen + zorg - z.borg_terug - z.marcel - z.zakelijk - prive - ad - z.belasting as mutatie
    from jij z
  ),
  cum as (
    select w.*, coalesce((s->>'startsaldo')::numeric, 0) + sum(w.mutatie) over (order by w.maand) as saldo_eind
    from saldo w
  )
  select jsonb_agg(jsonb_build_object(
      'maand', maand,
      'binnen', round(binnen),
      'borg_in', round(borg_in),
      'termijnen', round(termijnen),
      'overig', round(overig),
      'definitief', round(definitief),
      'borg_terug', round(borg_terug),
      'marcel', round(marcel),
      'adspend', round(ad),
      'zakelijk', round(zakelijk),
      'prive', round(prive),
      'belasting', round(belasting),
      'kosten', round(zakelijk + prive + ad + belasting),
      'paviljoen', round(paviljoen),
      'zorgtoeslag', round(zorg),
      'inkomen_prive', round(paviljoen + zorg),
      'uit', round(borg_terug + marcel + zakelijk + prive + ad + belasting),
      'jij_houdt', round(jij_houdt),
      'nodig', round(zakelijk + prive),
      'saldo_eind', round(saldo_eind),
      'openstaande_borg', round(openstaande_borg)
    ) order by maand)
  into maanden
  from cum;

  -- Break-even (stabiele maand, zonder lopende termijnen): saldo vlak als
  -- jij_houdt + zorgtoeslag + Paviljoen = zakelijk + privé.
  k := 4.33 * (b * (d + (1 - d) * (1 - r)) + d * tn * t);
  doel := zak + prive - zorg - pav_ss;
  if doel <= 0 then
    be := 0;
  else
    def_nodig := (doel / greatest(1 - tax, 0.01) - m * g) / greatest(1 - m, 0.01) + ad;
    if def_nodig - ad - g < 0 then def_nodig := doel / greatest(1 - tax, 0.01) + ad; end if;
    be := case when k > 0 then def_nodig / k else null end;
  end if;
  jij_ss := ((n * k) - ad - m * greatest(0, n * k - ad - g)) * (1 - tax);

  return jsonb_build_object(
    'instellingen', s,
    'maanden', maanden,
    'jij_houdt_gem', (select round(avg((x->>'jij_houdt')::numeric)) from jsonb_array_elements(maanden) x where (x->>'maand')::date >= date '2027-01-01'),
    'jij_houdt_stabiel', round(jij_ss),
    'nodig_per_maand', round(zak + prive),
    'saldo_eind_april', (maanden->-1->>'saldo_eind')::numeric,
    'laagste_saldo', (select min((x->>'saldo_eind')::numeric) from jsonb_array_elements(maanden) x),
    'break_even_klanten_per_week', round(be, 1),
    'klanten_per_week', n,
    'per_extra_klant_per_week', round(4.33 * (b * (d + (1 - d) * (1 - r))) * (1 - m) * (1 - tax)),
    'per_extra_klant_stabiel', round(k * (1 - m) * (1 - tax))
  );
end;
$$;

revoke all on function public.get_geldplan(jsonb) from public, anon;
revoke all on function public.geldplan_standaard() from public, anon;
grant execute on function public.get_geldplan(jsonb) to authenticated;
grant execute on function public.geldplan_standaard() to authenticated;

-- Opgeslagen scherm voor Kersten (Mijn schermen + Gino's context).
insert into public.business_os_schermen (coach_id, naam, omschrijving, vraag, visueel)
select u.id, 'Geldplan',
  '6 maanden cashflow + break-even: saldo per maand, jij houdt vs nodig, klanten per week voor quitte',
  'laat mijn geldplan zien: saldo per maand tot eind april, jij houdt vs nodig en hoeveel klanten per week ik nodig heb (getallen uit context geldplan)',
  null
from auth.users u
where u.email = 'kerstenscheffer@gmail.com'
  and not exists (select 1 from public.business_os_schermen s where s.coach_id = u.id and s.naam = 'Geldplan');
