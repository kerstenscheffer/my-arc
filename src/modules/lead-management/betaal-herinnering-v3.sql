-- Betaalherinnering v3 (24 nov 2026, Kersten): geen push.
--   - De herinnering is de vaste melding "Je betaling staat nog open" in de app
--     (NotificationWidget via mijn_open_betaling). Die staat er vanaf het boeken
--     tot de betaling binnen is en is niet weg te tikken.
--   - betaal_herinnering_klant zet dus geen rij meer in notifications (een rij
--     daar = push via trg_push_on_client_notification). Op slot na de termijn blijft.
--   - Het slot van v2 alsnog: herinnering voor iedereen aan + Martijn.
--   - Slot-scherm: mijn_borg() en mijn_slot_keuze() voor de keuzes van klanten
--     zonder openstaande betaling (borg naar app, coaching, contact).

create or replace function public.betaal_herinnering_klant(p_client uuid, p_nu boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare b jsonb; d int; c record;
begin
  select id, account_locked_at into c from public.clients where id = p_client;
  if c.id is null or c.account_locked_at is not null then return 'overslaan'; end if;
  b := public.open_betaling_van(p_client);
  if b is null then return 'niets open'; end if;
  d := (b->>'dagen')::int;
  if d < 0 and not p_nu then
    update public.clients set account_locked_at = now(), account_locked_reason = 'Betaling open'
     where id = p_client and account_locked_at is null;
    return 'op slot';
  end if;
  return 'melding in app';
end $$;
revoke all on function public.betaal_herinnering_klant(uuid, boolean) from public, anon, authenticated;

alter table public.clients alter column betaal_herinnering set default true;
update public.clients set betaal_herinnering = true where not betaal_herinnering;

-- Martijn: €150 in één keer, uiterlijk 29 nov (v2: vandaag + 5).
-- payment_due_date mee, anders telt de omzet op 30 okt (al uitbetaalde maand).
update public.lead_movements set payment_type = 'prepaid', duration_months = 1,
  payment_due_date = date '2026-11-29', betaal_uiterlijk = date '2026-11-29'
 where id = '04fd3794-9e5d-43dd-91af-42c3e9855173' and betaal_uiterlijk is null;

-- Borg van de ingelogde klant (challenge-sale, betaald, niet teruggegeven).
create or replace function public.mijn_borg()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('bedrag', lm.order_value)
  from public.clients c
  join public.lead_movements lm on lm.client_id = c.id
  where c.auth_user_id = auth.uid()
    and lm.sale_kind = 'challenge' and lm.reverted_at is null
    and coalesce(lm.payment_received, false)
    and coalesce(lm.challenge_status, 'open') in ('open', 'uitgesteld')
  order by lm.moved_at desc
  limit 1
$$;
revoke all on function public.mijn_borg() from public, anon;
grant execute on function public.mijn_borg() to authenticated;

-- Keuze op het slot-scherm: melding voor de coach (geen push naar de klant).
create or replace function public.mijn_slot_keuze(p_keuze text)
returns boolean language plpgsql security definer set search_path = public as $$
declare c record; t text;
begin
  if p_keuze not in ('borg_app', 'coaching', 'contact') then return false; end if;
  select id, coach_id, trainer_id, first_name, last_name into c
    from public.clients where auth_user_id = auth.uid() limit 1;
  if c.id is null then return false; end if;
  -- Eén keer per dag per keuze, anders kan iemand blijven tikken.
  if exists (select 1 from public.coach_notifications n where n.client_id = c.id
             and n.metadata->>'slot_keuze' = p_keuze
             and n.created_at > now() - interval '1 day') then return true; end if;
  t := case p_keuze when 'borg_app' then 'wil zijn borg omzetten naar de app'
                    when 'coaching' then 'wil verder met coaching'
                    else 'wil contact' end;
  insert into public.coach_notifications (coach_id, client_id, type, priority, title, message, metadata)
  values (coalesce(c.coach_id, c.trainer_id), c.id, 'action_required', 'high',
          trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')) || ' ' || t,
          'Gekozen op het slot-scherm van de app.', jsonb_build_object('slot_keuze', p_keuze));
  return true;
end $$;
revoke all on function public.mijn_slot_keuze(text) from public, anon;
grant execute on function public.mijn_slot_keuze(text) to authenticated;
