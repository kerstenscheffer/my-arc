-- supabase/traject-verlopen-slot.sql (4 nov 2026)
--
-- LET OP: traject_verlopen_klanten() is op 5 nov vervangen door
-- src/modules/business-os/traject-slot-eindcall.sql. Dit bestand niet opnieuw draaien.
--
-- Regel van Kersten: traject voorbij = app op slot, automatisch. Elke nacht.
-- Zelfde velden als de slotknop (CoachingPeriodPanel.wisselSlot).
--
-- Niet op slot:
--   onbeperkt         coaching_onbeperkt
--   pauze             gepauzeerd vóór het einde: de teller staat stil
--   verlenging        een geboekte verlenging loopt nog, ook als de weken niet zijn
--                     opgehoogd (30 okt in bulk geboekt zonder de weken aan te passen)
--   zelf ontgrendeld  account_slot_voor_einde = dit einde: de coach heeft hem bewust
--                     opengezet. Een nieuwe einddatum telt weer gewoon mee.
--
-- Verlengen haalt het automatische slot er weer af (trigger, werkt ook met oude
-- coachversies). Een slot dat de coach zelf zette blijft staan.

alter table public.clients add column if not exists account_slot_voor_einde date;

create or replace function public.traject_einde(c public.clients)
returns date language sql stable as $$
  select c.coaching_start_date + c.coaching_total_weeks * 7 + coalesce(c.coaching_paused_days_total, 0)
$$;

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
$$;

create or replace function public.traject_verlopen_op_slot()
returns integer language plpgsql as $$
declare n integer;
begin
  update public.clients c set
    account_locked_at = now(),
    account_locked_reason = 'Traject verlopen',
    account_slot_voor_einde = public.traject_einde(c),
    coaching_status = 'ended',
    coaching_paused_at = null,
    coaching_pause_reason = null
  where c.id in (select v.id from public.traject_verlopen_klanten() v);
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.traject_slot_los_bij_verlengen()
returns trigger language plpgsql as $$
begin
  if new.account_locked_at is not null and new.account_locked_reason = 'Traject verlopen'
     and (new.coaching_onbeperkt
          or (new.coaching_start_date is not null and new.coaching_total_weeks is not null
              and public.traject_einde(new) >= (now() at time zone 'Europe/Amsterdam')::date)) then
    new.account_locked_at := null;
    new.account_locked_reason := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_traject_slot_los on public.clients;
create trigger trg_traject_slot_los before update of coaching_start_date, coaching_total_weeks, coaching_paused_days_total, coaching_onbeperkt
  on public.clients for each row execute function public.traject_slot_los_bij_verlengen();

revoke all on function public.traject_verlopen_klanten() from public, anon, authenticated;
revoke all on function public.traject_verlopen_op_slot() from public, anon, authenticated;
revoke all on function public.traject_einde(public.clients) from public, anon, authenticated;

select cron.schedule('traject-verlopen-slot', '15 2 * * *', 'select public.traject_verlopen_op_slot()');
