-- src/modules/business-os/traject-slot-eindcall.sql (5 nov 2026)
--
-- Besluit Kersten, vervangt alleen de selectie uit supabase/traject-verlopen-slot.sql.
-- De cron traject-verlopen-slot, traject_verlopen_op_slot() en de trigger blijven.
--
--   Laatste doorstap nee        op slot bij de eerstvolgende nachtronde, ook vóór het einde
--   Eindcall geweest            op slot zodra het traject voorbij is (einde + 1)
--   Geen eindcall geweest       pas 3 dagen na het einde (einde + 3)
--
-- Eindcall = afspraak in agenda_events, soort klantcall of opstartcall, geen Plan check,
-- geen hele dag, op of na 14 dagen voor het einde, op naam van de klant. Dezelfde
-- naamregels als verlengenData.js: alleen een voornaam met meerdere lopende klanten telt niet.
--
-- Uitzonderingen ongewijzigd: onbeperkt, pauze vóór het einde, lopende verlenging,
-- al ontgrendeld (account_slot_voor_einde), al op slot (ook handmatig).
--
-- Signaal: elke dag 09:00 NL één rij in business_os_herinneringen (bron gino), alleen als
-- er iets te doen is. Niets in coach_notifications, niets richting klanten.
--
-- Bij deploy verandert er niets aan bestaande accounts. Alleen toevoegen + functie vervangen.

create or replace function public.traject_plat(t text)
returns text language sql immutable as $$
  select trim(regexp_replace(
    translate(lower(coalesce(t, '')), 'áàäâãåéèëêíìïîóòöôõúùüûýÿñç', 'aaaaaaeeeeiiiiooooouuuuyync'),
    '[^a-z0-9.]+', ' ', 'g'))
$$;

-- Eén bron voor de nachtronde en de prognose: wie valt onder de regel, plus wat ervoor telt.
create or replace function public.traject_slot_stand()
returns table (client_id uuid, naam text, email text, coach_id uuid, einde date,
               nee boolean, verlenging_tot date, eindcall_start timestamptz)
language sql stable as $$
  with namen as (
    select split_part(public.traject_plat(k.first_name), ' ', 1) as woord,
           count(distinct public.traject_plat(k.first_name) || ' ' || public.traject_plat(k.last_name)) as aantal
    from public.clients k
    where k.coaching_status in ('active', 'paused')
      and lower(coalesce(k.email, '')) not like '%test%'
      and lower(coalesce(k.email, '')) not in ('ks10k@gmail.com', 'review@gmail.com')
    group by 1
  ), kandidaten as (
    select c.id, c.first_name, c.last_name, c.email, c.coach_id,
           public.traject_einde(c) as einde,
           public.traject_plat(c.first_name) as voornaam,
           public.traject_plat(c.last_name) as achternaam,
           split_part(public.traject_plat(c.first_name), ' ', 1) as woord
    from public.clients c
    where c.account_locked_at is null
      and not c.coaching_onbeperkt
      and c.coaching_start_date is not null and c.coaching_total_weeks is not null
      and c.account_slot_voor_einde is distinct from public.traject_einde(c)
      and not (c.coaching_status = 'paused' and c.coaching_paused_at is not null
               and c.coaching_paused_at::date < public.traject_einde(c))
  ), calls as (
    select e.start_at, public.traject_plat(e.contact_naam) as contact,
           ' ' || public.traject_plat(e.titel) || ' ' as titel
    from public.agenda_events e
    where e.soort in ('klantcall', 'opstartcall')
      and not coalesce(e.hele_dag, false)
      and public.traject_plat(e.titel) not like 'plan check%'
  )
  select k.id,
         trim(regexp_replace(k.first_name || case when coalesce(k.last_name, '') like '%@%' then ''
                                                  else ' ' || coalesce(k.last_name, '') end, '\s+', ' ', 'g')),
         k.email, k.coach_id, k.einde,
         coalesce((select d.status from public.client_doorstap d where d.client_id = k.id
                   order by d.gezet_at desc, d.id desc limit 1), '') = 'nee',
         (select max((m.moved_at + make_interval(months => greatest(coalesce(m.duration_months, 1), 1)))::date)
          from public.lead_movements m
          where m.client_id = k.id and m.outcome_type = 'verlenging' and m.reverted_at is null),
         (select min(e.start_at) from calls e
          where (e.start_at at time zone 'Europe/Amsterdam')::date >= k.einde - 14
            and k.voornaam <> ''
            and (e.contact = trim(k.voornaam || ' ' || k.achternaam)
                 or e.titel like '% ' || trim(k.voornaam || ' ' || k.achternaam) || ' %'
                 or (k.achternaam <> '' and e.contact = k.woord || ' ' || left(k.achternaam, 1))
                 or ((case when e.contact <> '' then e.contact in (k.voornaam, k.woord)
                           else e.titel like '% ' || k.voornaam || ' %' or e.titel like '% ' || k.woord || ' %' end)
                     and coalesce((select n.aantal from namen n where n.woord = k.woord), 0) <= 1)))
  from kandidaten k
$$;

-- De nachtronde (via traject_verlopen_op_slot) leest deze selectie.
create or replace function public.traject_verlopen_klanten()
returns setof public.clients language sql stable as $$
  select c.* from public.clients c
  join public.traject_slot_stand() s on s.client_id = c.id
  cross join (select (now() at time zone 'Europe/Amsterdam')::date as dag) v
  where (s.verlenging_tot is null or s.verlenging_tot < v.dag)
    and (s.nee
         or (s.einde < v.dag and (s.eindcall_start < now() or s.einde + 3 <= v.dag)))
$$;

-- Wanneer iemand op slot gaat als de agenda blijft zoals hij nu is, oud en nieuw naast elkaar.
create or replace function public.traject_slot_prognose(
  p_vandaag date default (now() at time zone 'Europe/Amsterdam')::date)
returns table (client_id uuid, naam text, email text, coach_id uuid, einde date, nee boolean,
               verlenging_tot date, eindcall_start timestamptz, slot_oud date, slot_nieuw date)
language sql stable as $$
  select s.client_id, s.naam, s.email, s.coach_id, s.einde, s.nee, s.verlenging_tot, s.eindcall_start,
         greatest(s.einde + 1, s.verlenging_tot + 1),
         greatest(case
                    when s.nee then p_vandaag
                    when s.eindcall_start is null then s.einde + 3
                    else least(s.einde + 3,
                               greatest(s.einde + 1, (s.eindcall_start at time zone 'Europe/Amsterdam')::date + 1))
                  end,
                  s.verlenging_tot + 1)
  from public.traject_slot_stand() s
$$;

create or replace function public.traject_dag_kort(d date)
returns text language sql immutable as $$
  select extract(day from d)::int || ' ' ||
         (array['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'])[extract(month from d)::int]
$$;

-- Tekst van de dag, null als er niets te doen is. Staat iemand op beide lijsten, dan alleen
-- bij slot (dat is het dringendst). Slot eerst: de kolom tekst is maximaal 500 tekens.
create or replace function public.traject_signaal_tekst(
  p_vandaag date default (now() at time zone 'Europe/Amsterdam')::date)
returns text language sql stable as $$
  with p as (
    select x.*, greatest(x.slot_nieuw, p_vandaag + 1) as slot   -- de nachtronde van vandaag is al geweest
    from public.traject_slot_prognose(p_vandaag) x
    where coalesce(x.coach_id, '5a0135ac-3188-499d-8682-ed6a179e5541') = '5a0135ac-3188-499d-8682-ed6a179e5541'
      and lower(coalesce(x.email, '')) not like '%test%'
      and lower(coalesce(x.email, '')) not in ('ks10k@gmail.com', 'review@gmail.com')
  ), lijsten as (
    select
      (select string_agg(a.naam || ' (' || public.traject_dag_kort(a.slot)
                         || case when a.nee then ', zei nee'
                                 when a.eindcall_start is null then ', geen eindcall' else '' end || ')',
                         ', ' order by a.slot, a.naam)
       from p a where a.slot <= p_vandaag + 3) as op_slot,
      (select string_agg(b.naam || ' (' || public.traject_dag_kort(b.einde) || ')', ', ' order by b.einde, b.naam)
       from p b
       where b.slot > p_vandaag + 3
         and b.einde between p_vandaag and p_vandaag + 7
         and b.eindcall_start is null
         and (b.verlenging_tot is null or b.verlenging_tot < b.einde)) as geen_call
  ), t as (
    select 'Einde traject.'
           || coalesce(' Binnen 3 dagen op slot: ' || l.op_slot || '.', '')
           || coalesce(' Geen eindcall gepland, einde binnen 7 dagen: ' || l.geen_call || '.', '') as tekst
    from lijsten l
    where l.op_slot is not null or l.geen_call is not null
  )
  select case when length(t.tekst) > 500 then left(t.tekst, 499) || '…' else t.tekst end from t
$$;

-- Maakt de herinnering van vandaag, hooguit één per dag. Een open signaal van een eerdere dag
-- wordt gesloten: de nieuwe stand vervangt hem, anders stapelen ze op in de bol.
create or replace function public.traject_signaal_maak(
  p_vandaag date default (now() at time zone 'Europe/Amsterdam')::date)
returns integer language plpgsql as $$
declare
  kersten constant uuid := '5a0135ac-3188-499d-8682-ed6a179e5541';
  t text;
begin
  if exists (select 1 from public.business_os_herinneringen h
             where h.coach_id = kersten and h.bron = 'gino' and h.tekst like 'Einde traject.%'
               and (h.created_at at time zone 'Europe/Amsterdam')::date = p_vandaag) then
    return 0;
  end if;
  update public.business_os_herinneringen h set klaar_at = now()
    where h.coach_id = kersten and h.bron = 'gino' and h.klaar_at is null and h.tekst like 'Einde traject.%';
  t := public.traject_signaal_tekst(p_vandaag);
  if t is null then return 0; end if;
  insert into public.business_os_herinneringen (coach_id, tekst, moment, bron)
    values (kersten, t, (p_vandaag + time '09:00') at time zone 'Europe/Amsterdam', 'gino');
  return 1;
end $$;

revoke all on function public.traject_plat(text) from public, anon, authenticated;
revoke all on function public.traject_slot_stand() from public, anon, authenticated;
revoke all on function public.traject_slot_prognose(date) from public, anon, authenticated;
revoke all on function public.traject_dag_kort(date) from public, anon, authenticated;
revoke all on function public.traject_signaal_tekst(date) from public, anon, authenticated;
revoke all on function public.traject_signaal_maak(date) from public, anon, authenticated;
revoke all on function public.traject_verlopen_klanten() from public, anon, authenticated;

-- pg_cron draait in UTC: 07:00 UTC is 09:00 NL in de zomer, 08:00 UTC in de winter. De where
-- laat alleen de run door die echt 09:00 NL is.
select cron.schedule('traject-signaal-9u', '0 7,8 * * *',
  $job$select public.traject_signaal_maak() where extract(hour from now() at time zone 'Europe/Amsterdam') = 9$job$);
