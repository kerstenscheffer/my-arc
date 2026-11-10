-- src/modules/steps/gezondheid.sql
--
-- Slaap, rusthartslag en HRV uit Apple Health / Health Connect (10 nov 2026).
-- Daar komt ook een Garmin, Apple Watch of Oura binnen als de klant die app
-- naar Apple Health / Health Connect laat schrijven. Gelezen door
-- src/modules/steps/gezondheid.js. Alleen toevoegingen: oude app-versies raken
-- niets kwijt.

create table if not exists public.client_gezondheid_dagen (
  client_id uuid not null references public.clients(id) on delete cascade,
  datum date not null,                 -- de dag waarop je wakker werd
  slaap_minuten integer,               -- echt geslapen (zonder wakker / in bed)
  slaap_diep integer,
  slaap_rem integer,
  slaap_licht integer,
  slaap_wakker integer,
  bedtijd timestamptz,                 -- eerste slaapmoment van de nacht
  opstaan timestamptz,                 -- laatste slaapmoment
  rust_hartslag numeric,               -- bpm, gemiddelde van de dag
  hrv numeric,                         -- ms, gemiddelde van de dag
  bron text,                           -- app die de slaap leverde (bijv. com.garmin.android.apps.connectmobile)
  bronnen jsonb,                       -- alle apps met hun slaapminuten, voor uitleg bij afwijkingen
  platform text,
  updated_at timestamptz not null default now(),
  primary key (client_id, datum)
);

alter table public.client_gezondheid_dagen enable row level security;

drop policy if exists client_eigen_gezondheid on public.client_gezondheid_dagen;
create policy client_eigen_gezondheid on public.client_gezondheid_dagen for all
  using (client_id in (select id from public.clients where auth_user_id = auth.uid()))
  with check (client_id in (select id from public.clients where auth_user_id = auth.uid()));

drop policy if exists coach_gezondheid_van_klanten on public.client_gezondheid_dagen;
create policy coach_gezondheid_van_klanten on public.client_gezondheid_dagen for all
  using ((select rls_is_coach()) or client_id in (select id from public.clients where trainer_id = auth.uid()))
  with check ((select rls_is_coach()) or client_id in (select id from public.clients where trainer_id = auth.uid()));

-- Slaap uit het horloge komt ook in sleep_logs, zodat alles wat daar al op
-- leest (Coach Inzicht, dag-agenda, slaapknop) het meteen toont. null = zelf
-- gelogd; 'telefoon' = uit Apple Health / Health Connect. Een rij die de
-- klant zelf invulde overschrijven we nooit.
alter table public.sleep_logs add column if not exists bron text;
