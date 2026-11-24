-- Betaalherinnering, regels van Kersten (24 nov 2026, tweede ronde):
--   1. Verlenging geboekt, nog niet betaald → meteen melding in de app + push.
--   2. Slot = einde huidig traject (start_op van het vervolg) + 3 dagen.
--      Eén uitzondering per regel: lead_movements.betaal_uiterlijk (Martijn: +5 dagen).
--   3. Pushes daarna: binnen 14 dagen voor het slot om de 3 dagen, laatste 3 dagen elke dag.
--   4. Voor iedereen aan (default true); er stonden alleen Patrick en Martijn open.
-- Opvolger van betaal-herinnering.sql (die blijft de basis: kolommen, RPC, trigger slot-los).

alter table public.lead_movements add column if not exists betaal_uiterlijk date;
comment on column public.lead_movements.betaal_uiterlijk is 'Uitzondering op de slotdatum van de betaalherinnering (normaal start_op + 3 dagen). 24 nov 2026.';

create or replace function public.open_betaling_van(p_client uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', lm.id,
    'voornaam', c.first_name,
    'aanbod', coalesce(nullif(trim(lm.aanbod), ''), 'je vervolgtraject'),
    'bedrag', lm.order_value,
    'per_maand', lm.payment_type = 'monthly' and coalesce(lm.duration_months, 1) > 1,
    'betaal_link', coalesce(nullif(trim(lm.betaal_link), ''), 'https://www.myarcfitness.com/betaal/' || lm.id),
    'slot_op', s.slot_op,
    'dagen', s.slot_op - s.vandaag,
    'te_laat', s.normaal < s.vandaag
  )
  from public.clients c
  join public.lead_movements lm on lm.client_id = c.id
  cross join lateral (
    select (now() at time zone 'Europe/Amsterdam')::date as vandaag,
           coalesce(lm.start_op, (lm.moved_at at time zone 'Europe/Amsterdam')::date) + 3 as normaal
  ) n
  cross join lateral (select n.vandaag, n.normaal, coalesce(lm.betaal_uiterlijk, n.normaal) as slot_op) s
  where c.id = p_client
    and c.betaal_herinnering
    and lm.to_section_title = 'Verlenging 🔁'
    and coalesce(lm.payment_received, false) = false
    and lm.reverted_at is null
    and coalesce(lm.order_value, 0) > 0
  order by s.slot_op, lm.moved_at
  limit 1
$$;
revoke all on function public.open_betaling_van(uuid) from public, anon, authenticated;

-- Eén klant: melding sturen (p_nu = meteen, zonder 14-dagen-venster) en/of op slot.
create or replace function public.betaal_herinnering_klant(p_client uuid, p_nu boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare b jsonb; d int; c record;
begin
  select id, coach_id, account_locked_at into c from public.clients where id = p_client;
  if c.id is null or c.account_locked_at is not null then return 'overslaan'; end if;
  b := public.open_betaling_van(p_client);
  if b is null then return 'niets open'; end if;
  d := (b->>'dagen')::int;

  if d < 0 and not p_nu then
    update public.clients set account_locked_at = now(), account_locked_reason = 'Betaling open'
     where id = p_client and account_locked_at is null;
    return 'op slot';
  end if;

  if not p_nu then
    if d > 14 then return 'nog ver'; end if;
    if exists (select 1 from public.notifications n
               where n.client_id = p_client and n.source = 'betaling'
                 and n.created_at > (now() at time zone 'UTC') - make_interval(days => case when d <= 3 then 1 else 3 end) + interval '2 hours')
    then return 'al gestuurd'; end if;
  end if;

  insert into public.notifications (client_id, coach_id, type, title, message, status, priority, source, trigger_data, created_at)
  values (
    p_client, c.coach_id, 'betaling', 'Je betaling staat nog open',
    format('Heyy %s, je betaling voor %s staat nog open.%s Rond hem af zodat je account niet %s op slot gaat.',
      coalesce(nullif(trim(b->>'voornaam'), ''), 'daar'), b->>'aanbod',
      case when (b->>'te_laat')::boolean then ' Eigenlijk zit je al over je termijn heen.' else '' end,
      case when d <= 0 then 'vanavond' when d = 1 then 'morgen' else format('over %s dagen', d) end),
    'active', case when d <= 3 then 'urgent' else 'high' end, 'betaling',
    jsonb_build_object('betaling', b->>'id', 'betaal_link', b->>'betaal_link'),
    now() at time zone 'UTC'
  );
  return 'gestuurd';
end $$;
revoke all on function public.betaal_herinnering_klant(uuid, boolean) from public, anon, authenticated;

create or replace function public.betaal_herinnering_ronde()
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; uit text; n_melding int := 0; n_slot int := 0;
begin
  for r in select id from public.clients where betaal_herinnering and account_locked_at is null loop
    uit := public.betaal_herinnering_klant(r.id, false);
    if uit = 'gestuurd' then n_melding := n_melding + 1; elsif uit = 'op slot' then n_slot := n_slot + 1; end if;
  end loop;
  return jsonb_build_object('meldingen', n_melding, 'op_slot', n_slot);
end $$;
revoke all on function public.betaal_herinnering_ronde() from public, anon, authenticated;

-- Regel 1: bij het boeken van een onbetaalde verlenging meteen de melding.
create or replace function public.betaal_melding_bij_boeken()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.client_id is not null and new.to_section_title = 'Verlenging 🔁'
     and not coalesce(new.payment_received, false) and new.reverted_at is null
     and coalesce(new.order_value, 0) > 0 then
    perform public.betaal_herinnering_klant(new.client_id, true);
  end if;
  return new;
end $$;
drop trigger if exists trg_betaal_melding_bij_boeken on public.lead_movements;
create trigger trg_betaal_melding_bij_boeken after insert on public.lead_movements
  for each row execute function public.betaal_melding_bij_boeken();

-- Regel 4: voor iedereen aan.
alter table public.clients alter column betaal_herinnering set default true;
update public.clients set betaal_herinnering = true where not betaal_herinnering;

-- Martijn: €150 in één keer, nog 5 dagen.
-- payment_due_date mee, anders telt de omzet op 30 okt (al uitbetaalde maand).
update public.lead_movements set payment_type = 'prepaid', duration_months = 1,
  payment_due_date = (now() at time zone 'Europe/Amsterdam')::date + 5,
  betaal_uiterlijk = (now() at time zone 'Europe/Amsterdam')::date + 5
 where id = '04fd3794-9e5d-43dd-91af-42c3e9855173';
