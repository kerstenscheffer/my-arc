-- src/modules/lead-management/partner-uitbetaling-vast.sql
--
-- Uitbetaling aan Marcel vastzetten (3 nov 2026). Eenmalig draaien; alleen
-- aanvullend, oude app-versies blijven werken. Veilig om nog eens te draaien.
--
-- Probleem: het Marcel-deel werd elke keer herberekend uit lead_movements. Ging
-- een challenge later op 'behouden', dan schoof die omzet terug naar zijn
-- saledatum, ook als die maand al betaald was. September: 409 betaald, app 1.151,50.
--
-- 1. lead_movements.telt_mee_vanaf = eerste dag van de uitbetaalperiode waarin de
--    sale meetelt. Automatisch gezet (trigger), handmatig te overschrijven.
-- 2. partner_payout_items = waaruit een uitbetaling bestond, per betaalmoment.
-- 3. partner_uitbetaling_vastzetten = bedrag + uitsplitsing in één transactie.
-- 4. business_os_periode: marcel_deel volgt dezelfde regel.
-- 5. Terugvullen: jul/aug/sep tot op de cent herleid, de 5 doorstappers op november.
--
-- Stuurt niets naar klanten, Marcel of Meta: de trigger meta_purchase luistert op
-- order_value en die wordt hier niet aangeraakt.

begin;

-- ── 1. Kolommen ─────────────────────────────────────────────────────────────
alter table public.lead_movements add column if not exists telt_mee_vanaf date;
comment on column public.lead_movements.telt_mee_vanaf is
  'Uitbetaalperiode (eerste van de maand) waarin de sale voor de partner meetelt. Null = nog niet. Eenmalige betaling: precies deze periode. Termijnen: niet eerder dan deze periode.';

alter table public.partner_payouts add column if not exists vaste_lasten numeric;
alter table public.partner_payouts add column if not exists adspend numeric;

-- ── 2. Periode + trigger ────────────────────────────────────────────────────
-- Uitbetaalperiode loopt van de 26e t/m de 25e; zelfde knip als getPartnerPayouts.
create or replace function public.uitbetaal_periode(p_dag date)
returns date language sql immutable as $$
  select case when extract(day from p_dag) > 25
    then (date_trunc('month', p_dag) + interval '1 month')::date
    else date_trunc('month', p_dag)::date end
$$;

create or replace function public.lead_movement_telt_mee()
returns trigger language plpgsql as $$
begin
  -- Staat er al een maand (automatisch of van Kersten), dan blijft die staan.
  if new.telt_mee_vanaf is not null then
    new.telt_mee_vanaf := date_trunc('month', new.telt_mee_vanaf)::date;
    return new;
  end if;
  if coalesce(new.order_value, 0) <= 0 or new.reverted_at is not null then return new; end if;
  -- Coaching en verlenging: als de betaling binnen is.
  -- Challenge: pas als hij behouden is én betaald; open en uitgesteld tellen niet.
  if coalesce(new.payment_received, false)
     and coalesce(new.challenge_status, '') not in ('uitgesteld', 'terugbetaald')
     and (coalesce(new.sale_kind, 'coaching') <> 'challenge' or new.challenge_status = 'behouden') then
    new.telt_mee_vanaf := public.uitbetaal_periode(
      case when tg_op = 'INSERT' then (new.moved_at at time zone 'Europe/Amsterdam')::date
           else (now() at time zone 'Europe/Amsterdam')::date end);
  end if;
  return new;
end $$;

drop trigger if exists lead_movement_telt_mee on public.lead_movements;
create trigger lead_movement_telt_mee
  before insert or update of challenge_status, payment_received, order_value, sale_kind, telt_mee_vanaf
  on public.lead_movements
  for each row execute function public.lead_movement_telt_mee();

-- ── 3. Uitsplitsing per uitbetaling ─────────────────────────────────────────
create table if not exists public.partner_payout_items (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.partner_payouts(id) on delete cascade,
  -- set null: een sale verwijderen mag niet blokkeren, de regel blijft bewaard.
  movement_id uuid references public.lead_movements(id) on delete set null,
  lead_name text,
  soort text,
  -- Welk betaalmoment van de sale: reservering, rest of termijn-2.
  portie text not null,
  datum date,
  bedrag numeric not null,
  partner_deel numeric not null,
  gereconstrueerd boolean not null default false,
  created_at timestamptz not null default now(),
  unique (payout_id, movement_id, portie)
);
create index if not exists partner_payout_items_movement on public.partner_payout_items(movement_id);

alter table public.partner_payout_items enable row level security;
drop policy if exists partner_payout_items_select on public.partner_payout_items;
create policy partner_payout_items_select on public.partner_payout_items for select to authenticated
  using (exists (select 1 from public.partner_payouts p where p.id = payout_id));
-- Schrijven kan alleen via de RPC hieronder.

-- ── 4. Afvinken = vastzetten ────────────────────────────────────────────────
create or replace function public.partner_uitbetaling_vastzetten(
  p_period date, p_bedrag numeric, p_vaste_lasten numeric, p_adspend numeric, p_items jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_betaald timestamptz;
begin
  if auth.uid() is null then raise exception 'niet ingelogd'; end if;
  if my_team_role() is not null and my_team_role() <> 'owner' then raise exception 'alleen de eigenaar'; end if;

  select id, paid_at into v_id, v_betaald from partner_payouts
   where coach_id = auth.uid() and period = p_period for update;
  if v_betaald is not null then raise exception 'deze maand staat al vast'; end if;

  if v_id is null then
    insert into partner_payouts (coach_id, period, amount_paid, paid_at, vaste_lasten, adspend)
    values (auth.uid(), p_period, p_bedrag, now(), p_vaste_lasten, p_adspend)
    returning id into v_id;
  else
    update partner_payouts
       set amount_paid = p_bedrag, paid_at = now(), vaste_lasten = p_vaste_lasten, adspend = p_adspend
     where id = v_id;
  end if;

  insert into partner_payout_items (payout_id, movement_id, lead_name, soort, portie, datum, bedrag, partner_deel)
  select v_id, (i->>'movement_id')::uuid, i->>'lead_name', i->>'soort', i->>'portie',
         (i->>'datum')::date, (i->>'bedrag')::numeric, (i->>'partner_deel')::numeric
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) i;
  return v_id;
end $$;
revoke all on function public.partner_uitbetaling_vastzetten(date, numeric, numeric, numeric, jsonb) from public, anon;
grant execute on function public.partner_uitbetaling_vastzetten(date, numeric, numeric, numeric, jsonb) to authenticated;

-- ── 5. Bruto Marcel-deel voor Business OS ───────────────────────────────────
-- get_payment_schedule blijft de cashflow: challenge-geld dat op de rekening
-- staat hoort daar wel in. Dit is de versie voor de partner: open borgen eruit,
-- betaalmomenten op hun telt-mee-maand, wat al is afgerekend eruit.
create or replace function public.get_partner_deel_schema(p_van date, p_tot date)
returns table (datum date, partner_deel numeric)
language sql stable as $$
  with pz as materialized (select * from public.sale_pauzes_team()),
  sale as (
    select m.id, m.order_value::numeric as totaal,
           coalesce(m.payment_type, 'prepaid') as soort,
           greatest(1, coalesce(m.duration_months, 1)) as maanden,
           coalesce(m.partner_share_pct, case when m.outcome_type = 'verlenging' then 50 else 0 end)::numeric as pct,
           m.moved_at::date as sale_datum,
           coalesce(m.is_reservation, false) as reservering,
           coalesce(m.reservation_amount, 0)::numeric as aanbetaling,
           m.payment_due_date, m.telt_mee_vanaf,
           coalesce(m.payment_received, false) as binnen,
           pz.pauzes
    from lead_movements m left join pz on pz.movement_id = m.id
    where coalesce(m.order_value, 0) > 0 and m.reverted_at is null
      and coalesce(m.challenge_status, '') not in ('uitgesteld', 'terugbetaald')
      and (coalesce(m.sale_kind, 'coaching') <> 'challenge' or m.challenge_status = 'behouden')
      and (coalesce(m.payment_received, false) or coalesce(m.is_reservation, false))
  ),
  porties as (
    select s.id, 'reservering' as portie, s.sale_datum as dag, s.aanbetaling as bedrag, s.pct
    from sale s where s.reservering and s.aanbetaling > 0
    union all
    select s.id,
           case when s.soort = 'monthly' and s.maanden > 1 then 'termijn-' || (i + 1) else 'rest' end,
           case
             when s.soort = 'monthly' and s.maanden > 1 then greatest(d.dag, s.telt_mee_vanaf)
             else coalesce(s.telt_mee_vanaf, d.dag)
           end,
           round((s.totaal - case when s.reservering then s.aanbetaling else 0 end)
                 / (case when s.soort = 'monthly' then s.maanden else 1 end), 2),
           s.pct
    from sale s
    cross join lateral generate_series(0, case when s.soort = 'monthly' then s.maanden - 1 else 0 end) as i
    cross join lateral (
      select public.pauze_schuif((coalesce(s.payment_due_date, s.sale_datum) + make_interval(months => i))::date, s.pauzes) as dag
    ) d
    where d.dag is not null and (s.binnen or s.telt_mee_vanaf is not null)
  )
  select p.dag, round(p.bedrag * p.pct / 100, 2)
  from porties p
  where p.dag >= p_van and p.dag < p_tot
    and not exists (select 1 from partner_payout_items it where it.movement_id = p.id and it.portie = p.portie)
$$;
revoke all on function public.get_partner_deel_schema(date, date) from public, anon;
grant execute on function public.get_partner_deel_schema(date, date) to authenticated;

create or replace function public.business_os_periode(p_van date, p_tot date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_team uuid[];
  v_keten jsonb;
  v_ontv numeric := 0;
  v_marcel numeric := 0;
  v_c record;
begin
  if auth.uid() is null then raise exception 'niet ingelogd'; end if;
  if public.get_my_portal_role() not in ('coach', 'both') then raise exception 'alleen voor coaches'; end if;
  v_team := team_coach_ids(auth.uid());
  v_keten := coalesce(get_business_os(p_van, p_tot)->'nu', '{}'::jsonb);
  select coalesce(sum((e->>'bedrag')::numeric), 0)
    into v_ontv
    from jsonb_array_elements(coalesce(get_payment_schedule(null, p_van, p_tot), '[]'::jsonb)) e
   where (e->>'datum')::date >= p_van and (e->>'datum')::date < p_tot;
  -- Bevroren maanden tellen met het uitbetaalde bedrag, de rest bruto volgens de
  -- partner-regel (vóór vaste lasten en adspend).
  select coalesce(sum(s.partner_deel), 0) into v_marcel from get_partner_deel_schema(p_van, p_tot) s;
  select v_marcel + coalesce(sum(p.amount_paid), 0) into v_marcel
    from partner_payouts p
   where p.paid_at is not null and p.period >= p_van and p.period < p_tot and p.coach_id = any(v_team);
  select
    count(distinct lead_id) filter (where lower(to_section_title) like '%sales call%' and call_date >= p_van and call_date < p_tot) as op_datum,
    count(distinct lead_id) filter (where lower(to_section_title) like '%sales call%' and call_date >= p_van and call_date < p_tot and call_happened) as gehouden,
    count(*) filter (where to_section_title = 'No Show' and moved_at >= p_van and moved_at < p_tot) as no_show,
    count(*) filter (where to_section_title ilike 'Call voorgesteld%' and moved_at >= p_van and moved_at < p_tot) as voorgesteld,
    count(*) filter (where to_section_title = 'Call afgewezen' and moved_at >= p_van and moved_at < p_tot) as afgewezen
    into v_c
    from lead_movements
   where reverted_at is null and coach_id = any(v_team)
     and (call_date >= p_van - 31 or moved_at >= p_van - 31);
  return v_keten || jsonb_build_object(
    'van', p_van, 'tot', p_tot,
    'ontvangen', round(v_ontv), 'marcel_deel', round(v_marcel),
    'calls_op_datum', v_c.op_datum, 'calls_gehouden', v_c.gehouden, 'no_show', v_c.no_show,
    'call_voorgesteld', v_c.voorgesteld, 'call_afgewezen', v_c.afgewezen,
    'close_rate_pct', case when v_c.gehouden > 0 then round(100.0 * (v_keten->>'sales')::numeric / v_c.gehouden) end,
    'gem_orderwaarde', case when (v_keten->>'sales')::numeric > 0 then round((v_keten->>'omzet')::numeric / (v_keten->>'sales')::numeric) end,
    'content_gepland', (select count(*) from content_items where coach_id = any(v_team) and planned_date >= p_van and planned_date < p_tot and coalesce(is_template, false) = false and title not like '\_\_test%')
  );
end $$;

-- ── 6. Terugvullen ──────────────────────────────────────────────────────────
-- De 5 doorstappers stonden in september maar zaten niet in de 409. Hun deadlines
-- en verlengingen vallen op of na 26 okt, dus: periode november. Liever oktober?
-- Dat kan per sale in het omzetscherm (dropdown onder de naam in de verdeling).
update public.lead_movements set telt_mee_vanaf = '2026-11-01'
 where telt_mee_vanaf is null and id in (
   '446637e9-d58c-4633-8cec-31bb89b5a215',  -- ronald_vervoort
   'acddda20-eacc-4491-a676-5333c560fa41',  -- jacco_aalbregt
   'e5645a14-8b27-4a82-9d8a-47523c61fd49',  -- ditgeeftmijenergie
   'bf2f2356-571b-4741-b53f-5dcfea7f43a7',  -- markbehr95
   '9ad19d6f-3229-4e67-ab0e-b4e4097a8c81'   -- kroes.martijn
 );

-- Ferry en Mark Aaldenberg zaten in de 409: die blijven op september. Ferry's
-- payment_received staat uit, dus zonder deze regel vielen zijn termijnen weg.
update public.lead_movements set telt_mee_vanaf = '2026-09-01'
 where telt_mee_vanaf is null and id in (
   '4ebc5018-6863-4c1d-acae-dc5fe1cb8e7b',  -- ferryvm030
   'ea4dd27c-83e3-4fa9-b127-e66edeab603c'   -- markaaldenberg
 );

-- Alle andere coaching-sales die binnen zijn: de periode van de sale. Termijnen
-- lopen van daaruit gewoon door. Open challenges en onbetaalde sales blijven leeg.
update public.lead_movements
   set telt_mee_vanaf = public.uitbetaal_periode((moved_at at time zone 'Europe/Amsterdam')::date)
 where telt_mee_vanaf is null and coalesce(order_value, 0) > 0 and reverted_at is null
   and coalesce(sale_kind, 'coaching') = 'coaching' and payment_received is true;

-- Jul, aug en sep exact herleid: deze posten min € 250 vaste lasten, gedeeld door
-- twee, geven precies 0, 370 en 409. De rijen in partner_payouts blijven ongemoeid.
insert into public.partner_payout_items
  (payout_id, movement_id, lead_name, soort, portie, datum, bedrag, partner_deel, gereconstrueerd)
values
  -- Juli: € 0
  ('efaed119-8fb5-49a6-9e9d-6f13422ef595', '9a8b32bb-e817-4335-99e2-9eac882e2b72', 'juliette2788', 'Termijn 1 van 3', 'termijn-1', '2026-07-14', 99, 0, true),
  -- Augustus: € 370
  ('89e035d7-c216-4c7e-8120-6ff74546071c', '515fb700-fb79-4ff7-8aed-a36dbb14461a', 'happymindhealthylifestyle', 'Termijn 1 van 2', 'termijn-1', '2026-08-07', 99, 0, true),
  ('89e035d7-c216-4c7e-8120-6ff74546071c', '4493bc00-a745-4118-bedc-30cd73c702ac', 'Elijah', 'Termijn 1 van 3', 'termijn-1', '2026-08-13', 99, 0, true),
  ('89e035d7-c216-4c7e-8120-6ff74546071c', '9a8b32bb-e817-4335-99e2-9eac882e2b72', 'juliette2788', 'Termijn 2 van 3', 'termijn-2', '2026-08-14', 99, 23.5, true),
  ('89e035d7-c216-4c7e-8120-6ff74546071c', 'b7267bca-eef2-4d29-9dc3-89da2513f973', 'spijkersbennie spijkersbennie', 'Termijn 1 van 3', 'termijn-1', '2026-08-18', 99, 49.5, true),
  ('89e035d7-c216-4c7e-8120-6ff74546071c', '9919f2ba-2ea4-4add-ae93-ed4f17aff09e', 'Duukdezwart', 'Vooruitbetaald', 'rest', '2026-08-20', 297, 148.5, true),
  ('89e035d7-c216-4c7e-8120-6ff74546071c', 'acb38186-f841-4032-9883-c61e14defec6', 'luchamers86', 'Vooruitbetaald', 'rest', '2026-08-23', 297, 148.5, true),
  -- September: € 409
  ('1a3ae1d2-3409-40c0-82e4-8b020073f9e7', '4ebc5018-6863-4c1d-acae-dc5fe1cb8e7b', 'ferryvm030', 'Reservering', 'reservering', '2026-08-25', 50, 0, true),
  ('1a3ae1d2-3409-40c0-82e4-8b020073f9e7', 'ea4dd27c-83e3-4fa9-b127-e66edeab603c', 'markaaldenberg markaaldenberg', 'Vooruitbetaald', 'rest', '2026-09-02', 497, 148.5, true),
  ('1a3ae1d2-3409-40c0-82e4-8b020073f9e7', '515fb700-fb79-4ff7-8aed-a36dbb14461a', 'happymindhealthylifestyle', 'Termijn 2 van 2', 'termijn-2', '2026-09-07', 99, 49.5, true),
  ('1a3ae1d2-3409-40c0-82e4-8b020073f9e7', '4ebc5018-6863-4c1d-acae-dc5fe1cb8e7b', 'ferryvm030', 'Termijn 1 van 4', 'termijn-1', '2026-09-10', 125, 62.5, true),
  ('1a3ae1d2-3409-40c0-82e4-8b020073f9e7', '4493bc00-a745-4118-bedc-30cd73c702ac', 'Elijah', 'Termijn 2 van 3', 'termijn-2', '2026-09-13', 99, 49.5, true),
  ('1a3ae1d2-3409-40c0-82e4-8b020073f9e7', '9a8b32bb-e817-4335-99e2-9eac882e2b72', 'juliette2788', 'Termijn 3 van 3', 'termijn-3', '2026-09-14', 99, 49.5, true),
  ('1a3ae1d2-3409-40c0-82e4-8b020073f9e7', 'b7267bca-eef2-4d29-9dc3-89da2513f973', 'spijkersbennie spijkersbennie', 'Termijn 2 van 3', 'termijn-2', '2026-09-18', 99, 49.5, true)
on conflict (payout_id, movement_id, portie) do nothing;

-- Klopt de uitsplitsing niet met wat er is betaald, dan gaat alles terug.
do $$
declare r record;
begin
  for r in
    select p.period, p.amount_paid, coalesce(sum(i.partner_deel), 0) som
    from public.partner_payouts p left join public.partner_payout_items i on i.payout_id = p.id
    where p.period in ('2026-07-01', '2026-08-01', '2026-09-01')
    group by p.period, p.amount_paid
  loop
    if r.som <> r.amount_paid then
      raise exception 'Uitsplitsing % telt op tot %, betaald is %', r.period, r.som, r.amount_paid;
    end if;
  end loop;
end $$;

commit;
