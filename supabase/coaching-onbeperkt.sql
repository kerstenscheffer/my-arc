-- supabase/coaching-onbeperkt.sql (4 nov 2026)
--
-- Traject zonder einddatum, voor mensen zoals Kersten zelf en familie.
-- coaching_total_weeks blijft dan leeg: oude app-versies en de RPC's behandelen
-- dat al als "geen periode", dus geen 5200-weken-grafiek en geen eindmeldingen.
-- Staan er toch weken ingevuld (oude coachversie), dan winnen de weken.
alter table public.clients add column if not exists coaching_onbeperkt boolean not null default false;
