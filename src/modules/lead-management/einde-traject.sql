-- Einde traject: door of niet door (16 nov 2026). Gedraaid op 16 nov 2026.
-- Alleen toevoegen; oude app-versies blijven werken.
--
-- 1. client_doorstap krijgt de keuze 'call' met een datum.
-- 2. einde_traject_open(): wie loopt af (binnen 7 dagen) of liep af (tot 6 weken
--    terug) zonder 'nee', zonder 'betaald' en zonder lopende verlenging.
--    Security definer met de teamgrens erin, want traject_einde() is dicht
--    voor de rol authenticated.
-- 3. De nachtregel traject_verlopen_klanten() zet alleen nog op slot als de
--    laatste keuze 'nee' is. Zonder keuze blijft de klant staan.

alter table public.client_doorstap add column if not exists call_datum date;
alter table public.client_doorstap drop constraint if exists client_doorstap_status_check;
alter table public.client_doorstap add constraint client_doorstap_status_check
  check (status = any (array['ja_mondeling','denkt_na','nee','betaald','call']));

create or replace function public.einde_traject_open()
returns table (client_id uuid, coach_id uuid, naam text, einde date, dagen integer, status text, call_datum date,
               pakket text, gezet_at timestamptz, op_slot boolean, slot_reden text, gepauzeerd boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.coach_id,
         trim(regexp_replace(coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,''), '\s+', ' ', 'g')),
         public.traject_einde(c),
         public.traject_einde(c) - (now() at time zone 'Europe/Amsterdam')::date,
         l.status, l.call_datum, l.pakket, l.gezet_at,
         c.account_locked_at is not null, c.account_locked_reason,
         coalesce(c.coaching_status, 'active') = 'paused'
  from public.clients c
  left join lateral (select d.status, d.call_datum, d.pakket, d.gezet_at from public.client_doorstap d
                     where d.client_id = c.id order by d.gezet_at desc, d.id desc limit 1) l on true
  where c.coach_id = any (public.team_coach_ids(auth.uid()))
    and c.status = 'active'
    and not c.niet_betalend
    and not c.coaching_onbeperkt
    and c.coaching_start_date is not null and c.coaching_total_weeks is not null
    and public.traject_einde(c) <= (now() at time zone 'Europe/Amsterdam')::date + 7
    and public.traject_einde(c) >= (now() at time zone 'Europe/Amsterdam')::date - 42
    and coalesce(l.status, '') not in ('nee', 'betaald')
    and (c.account_locked_at is null or c.account_locked_reason = 'Traject verlopen')
    and not exists (
      select 1 from public.lead_movements m
      where m.client_id = c.id and m.outcome_type = 'verlenging' and m.reverted_at is null
        and (m.moved_at + make_interval(months => greatest(coalesce(m.duration_months, 1), 1)))::date
            >= (now() at time zone 'Europe/Amsterdam')::date)
  order by 4
$$;
revoke all on function public.einde_traject_open() from public, anon;
grant execute on function public.einde_traject_open() to authenticated;

create or replace function public.traject_verlopen_klanten()
returns setof public.clients language sql stable as $$
  select c.* from public.clients c
  where c.account_locked_at is null
    and not c.coaching_onbeperkt
    and c.coaching_start_date is not null and c.coaching_total_weeks is not null
    and public.traject_einde(c) < (now() at time zone 'Europe/Amsterdam')::date
    and c.account_slot_voor_einde is distinct from public.traject_einde(c)
    and not (c.coaching_status = 'paused' and c.coaching_paused_at is not null
             and c.coaching_paused_at::date < public.traject_einde(c))
    and not exists (
      select 1 from public.lead_movements m
      where m.client_id = c.id and m.outcome_type = 'verlenging' and m.reverted_at is null
        and (m.moved_at + make_interval(months => greatest(coalesce(m.duration_months, 1), 1)))::date
            >= (now() at time zone 'Europe/Amsterdam')::date)
    and (select d.status from public.client_doorstap d where d.client_id = c.id
         order by d.gezet_at desc, d.id desc limit 1) = 'nee'
$$;
revoke all on function public.traject_verlopen_klanten() from public, anon, authenticated;
