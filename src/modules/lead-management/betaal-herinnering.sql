-- Betaalherinnering in de app (24 nov 2026, Kersten).
-- Wie doorzet maar nog niet betaald heeft, krijgt in de app een melding met de
-- betaallink en de datum waarop zijn account op slot gaat.
--
-- Eerst testen op ks10k: alleen klanten met clients.betaal_herinnering = true
-- doen mee. Voor iedereen aan = die kolom op true zetten (of default true).
--
-- Bron: de open verlenging in lead_movements (to_section_title 'Verlenging 🔁',
-- payment_received false, niet teruggedraaid). Slotdatum = payment_due_date,
-- anders start_op, anders moved_at + 7 dagen.
-- Alles is nieuw: oude app-versies merken niets.

alter table public.lead_movements add column if not exists betaal_link text;
comment on column public.lead_movements.betaal_link is 'Betaallink die de klant in de app ziet zolang deze regel niet betaald is (24 nov 2026).';
alter table public.clients add column if not exists betaal_herinnering boolean not null default false;
comment on column public.clients.betaal_herinnering is 'Doet mee met de betaalherinnering in de app (24 nov 2026, eerst alleen ks10k).';

-- Open betaling van één klant (de oudste open verlenging).
create or replace function public.open_betaling_van(p_client uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', lm.id,
    'voornaam', c.first_name,
    'aanbod', coalesce(nullif(trim(lm.aanbod), ''), 'je vervolgtraject'),
    'bedrag', lm.order_value,
    'per_maand', lm.payment_type = 'monthly',
    'betaal_link', nullif(trim(lm.betaal_link), ''),
    'slot_op', s.slot_op,
    'dagen', s.slot_op - (now() at time zone 'Europe/Amsterdam')::date
  )
  from public.clients c
  join public.lead_movements lm on lm.client_id = c.id
  cross join lateral (select coalesce(lm.payment_due_date, lm.start_op, (lm.moved_at at time zone 'Europe/Amsterdam')::date + 7) as slot_op) s
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

-- Voor de klant-app: mijn open betaling (of null).
create or replace function public.mijn_open_betaling()
returns jsonb language sql stable security definer set search_path = public as $$
  select public.open_betaling_van(c.id)
  from public.clients c where c.auth_user_id = auth.uid()
  limit 1
$$;
revoke all on function public.mijn_open_betaling() from public, anon;
grant execute on function public.mijn_open_betaling() to authenticated;

-- Dagelijkse ronde: push-melding (de push-trigger op notifications stuurt hem)
-- en op slot zodra de slotdatum voorbij is.
-- Melding: vanaf 14 dagen voor de slotdatum, elke 3 dagen; de laatste 3 dagen elke dag.
create or replace function public.betaal_herinnering_ronde()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r record; b jsonb; d int; n_melding int := 0; n_slot int := 0;
  vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
begin
  for r in select c.id, c.coach_id from public.clients c
           where c.betaal_herinnering and c.account_locked_at is null loop
    b := public.open_betaling_van(r.id);
    continue when b is null;
    d := (b->>'dagen')::int;

    if d < 0 then
      update public.clients set account_locked_at = now(), account_locked_reason = 'Betaling open'
       where id = r.id and account_locked_at is null;
      n_slot := n_slot + 1;
      continue;
    end if;

    continue when d > 14;
    continue when exists (
      select 1 from public.notifications n
       where n.client_id = r.id and n.source = 'betaling'
         and n.created_at > (now() at time zone 'UTC') - make_interval(days => case when d <= 3 then 1 else 3 end) + interval '2 hours'
    );

    insert into public.notifications (client_id, coach_id, type, title, message, status, priority, source, trigger_data, created_at)
    values (
      r.id, r.coach_id, 'betaling',
      'Je betaling staat nog open',
      format('Heyy %s, je betaling voor %s staat nog open. Rond hem af zodat je account niet %s op slot gaat.',
        coalesce(b->>'voornaam', 'daar'), b->>'aanbod',
        case when d = 0 then 'vanavond' when d = 1 then 'morgen' else format('over %s dagen', d) end),
      'active', case when d <= 3 then 'urgent' else 'high' end, 'betaling',
      jsonb_strip_nulls(jsonb_build_object('betaling', b->>'id', 'betaal_link', b->>'betaal_link')),
      now() at time zone 'UTC'
    );
    n_melding := n_melding + 1;
  end loop;
  return jsonb_build_object('meldingen', n_melding, 'op_slot', n_slot);
end $$;
revoke all on function public.betaal_herinnering_ronde() from public, anon, authenticated;

-- Betaald afgevinkt: het betaal-slot gaat er vanzelf af.
create or replace function public.betaal_slot_los()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.payment_received and not coalesce(old.payment_received, false) and new.client_id is not null then
    update public.clients set account_locked_at = null, account_locked_reason = null
     where id = new.client_id and account_locked_reason = 'Betaling open'
       and public.open_betaling_van(id) is null;
  end if;
  return new;
end $$;
drop trigger if exists trg_betaal_slot_los on public.lead_movements;
create trigger trg_betaal_slot_los after update of payment_received on public.lead_movements
  for each row execute function public.betaal_slot_los();

-- 09:00 Nederlandse tijd (08:00 UTC in de winter).
select cron.schedule('betaal-herinnering', '0 8 * * *', $$select public.betaal_herinnering_ronde()$$);

-- Test op ks10k:
update public.clients set betaal_herinnering = true where email = 'ks10k@gmail.com';
