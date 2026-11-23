-- supabase/pauze-sluiten-trigger.sql  (23 nov 2026)
--
-- Gaat een klant van pauze af (clients.coaching_paused_at wordt leeg), dan
-- sluiten we hier de open rij in coaching_pauses. Alleen hervatTraject deed dat
-- zelf; "Nieuw traject", periode aanpassen, beëindigen en het nachtslot zetten
-- de klant op actief zonder de rij te sluiten. Gevolg: Coach Inzicht bleef
-- dagen als "Persoonlijk"/pauze kleuren en de betaaltermijnen bleven schuiven.
-- Als trigger, zodat het ook voor oude app-versies en SQL-routes geldt.

create or replace function public.sluit_open_pauze()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.coaching_paused_at is not null and new.coaching_paused_at is null then
    update public.coaching_pauses
       set resumed_at = now()
     where client_id = new.id
       and resumed_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sluit_open_pauze on public.clients;
create trigger trg_sluit_open_pauze
  after update of coaching_paused_at on public.clients
  for each row execute function public.sluit_open_pauze();

-- Eenmalig: Andjenie, pauze sinds 28 okt, nieuw traject vanaf 20 nov.
-- resumed_at op 19 nov 23:59 NL, zodat 20 nov zelf geen pauzedag is.
update public.coaching_pauses
   set resumed_at = '2026-11-19T22:59:00Z'
 where id = '4fca5e78-b04d-44f0-94c4-91393d70535d'
   and resumed_at is null;
