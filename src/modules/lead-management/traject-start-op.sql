-- Vervolgtraject met eigen startdatum (24 nov 2026). Alles hieronder live gedraaid.
-- Een verlenging (of sale) kan later ingaan dan het huidige einde, bv. challenge
-- loopt tot 24 nov en het vervolg van 6 maanden start 1 jan. De klant houdt
-- tussendoor toegang: clients.coaching_total_weeks loopt door tot het nieuwe einde.
-- Termijnen beginnen op payment_due_date (bestond al, get_payment_schedule rekent ermee).
-- Alleen toevoegen: oude app-versies lezen deze kolom niet.
alter table public.lead_movements add column if not exists start_op date;
comment on column public.lead_movements.start_op is 'Wanneer deze periode (sale of verlenging) ingaat. Leeg = op moved_at / direct na het vorige einde. 24 nov 2026.';

-- 2) Onbetaalde verlengingen ook in "wacht op betaling" (leadbord → calls-venster).
--    Nieuwe naam (_v2): oude app-versies houden get_awaiting_payment zonder verlengingen,
--    anders zou hun "gaat niet door" de lead van een verlenging naar Sale verloren slepen.
create or replace function public.get_awaiting_payment_v2(p_coach_id uuid default null::uuid)
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  with team as materialized (
    -- Alleen je eigen team: zonder deze check zou security definer alles tonen.
    select unnest(public.team_coach_ids(auth.uid())) id
  ),
  laatste as (
    select distinct on (m.lead_id) m.*
    from lead_movements m
    where m.reverted_at is null
      and m.coach_id in (select id from team)
      and (p_coach_id is null or p_coach_id in (select id from team))
      and coalesce(m.outcome_type, '') <> 'verlenging'
    order by m.lead_id, m.moved_at desc
  ),
  sales as (
    select l.id as movement_id, l.lead_id, l.lead_name, l.order_value, l.moved_at,
           l.to_section_id, l.to_section_title, l.sale_kind, l.payment_type,
           l.duration_months, l.partner_share_pct, l.coach_id,
           l.client_id, l.payment_due_date, l.start_op, false as verlenging
    from laatste l
    where coalesce(l.payment_received, false) = false
      and coalesce(l.is_reservation, false) = false
      and (
        l.to_section_title ilike '%sale%' or l.to_section_title ilike '%verkocht%'
        or l.to_section_title ilike '%klant%' or l.to_section_title ilike '%client%'
        or l.to_section_title ilike '%gewonnen%' or l.to_section_title ilike '%won%'
        or l.to_section_title ilike '%deal%'
      )
      and l.to_section_title not ilike '%verloren%'
      and l.to_section_title not ilike '%lost%'
      and l.to_section_title not ilike '%no show%'
      and l.to_section_title not ilike '%no-show%'
      and l.to_section_title not ilike '%noshow%'
      and l.to_section_title not ilike '%afgehaakt%'
      and l.to_section_title not ilike '%geannuleerd%'
      and l.to_section_title not ilike '%refund%'
      and l.to_section_title not ilike '%afgewezen%'
      and l.to_section_title not ilike '%geweigerd%'
      and l.to_section_title not ilike '%call%'
  ),
  verlengingen as (
    select m.id as movement_id, m.lead_id, m.lead_name, m.order_value, m.moved_at,
           m.to_section_id, m.to_section_title, m.sale_kind, m.payment_type,
           m.duration_months, m.partner_share_pct, m.coach_id,
           m.client_id, m.payment_due_date, m.start_op, true as verlenging
    from lead_movements m
    where m.reverted_at is null
      and m.outcome_type = 'verlenging'
      and coalesce(m.payment_received, false) = false
      and m.order_value > 0
      and m.coach_id in (select id from team)
      and (p_coach_id is null or p_coach_id in (select id from team))
  )
  select coalesce(jsonb_agg(x order by x.moved_at desc), '[]'::jsonb)
  from (select * from sales union all select * from verlengingen) x;
$function$;

-- 3) Verlenging op betaald (waar dan ook afgevinkt) → doorstap-stand op betaald.
--    Zo lopen leadbord, Coach Inzicht en Business OS → Klanten nooit uiteen.
create or replace function public.verlenging_betaald_doorstap()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_laatste record;
begin
  if new.outcome_type = 'verlenging' and new.client_id is not null and new.payment_received is true
     and new.reverted_at is null and (old.payment_received is distinct from true) then
    select status, pakket into v_laatste from client_doorstap
     where client_id = new.client_id order by gezet_at desc limit 1;
    if v_laatste.status is distinct from 'betaald' then
      insert into client_doorstap (client_id, coach_id, status, pakket, gezet_door)
      select new.client_id, coalesce(c.coach_id, new.coach_id), 'betaald',
             nullif(regexp_replace(coalesce(v_laatste.pakket, ''), ', nog niet betaald.*$', ''), ''), auth.uid()
        from clients c where c.id = new.client_id and coalesce(c.coach_id, new.coach_id) is not null;
    end if;
  end if;
  return null;
end $function$;

drop trigger if exists verlenging_betaald_doorstap on public.lead_movements;
create trigger verlenging_betaald_doorstap after update of payment_received on public.lead_movements
  for each row execute function public.verlenging_betaald_doorstap();

revoke all on function public.get_awaiting_payment_v2(uuid) from public, anon;
grant execute on function public.get_awaiting_payment_v2(uuid) to authenticated;
revoke all on function public.verlenging_betaald_doorstap() from public, anon, authenticated;

-- 4) Aanbod kiezen bij verlengen (24 nov 2026). Live gedraaid.
--    business_os_aanbod.gegevens.producten = lijst van wat nu verkocht wordt (Aanbod-tab, info-icoon).
--    lead_movements.aanbod = de gekozen naam, zodat je later ziet wat iemand nam.
alter table public.lead_movements add column if not exists aanbod text;
comment on column public.lead_movements.aanbod is 'Gekozen aanbod bij verlengen (Business OS → Aanbod), bv. App 1 jaar. 24 nov 2026.';
-- Kerstens rij gevuld met 12 weken €450, 6 maanden €125/mnd, App 1 jaar €300 of €30/mnd.
