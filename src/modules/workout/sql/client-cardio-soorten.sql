-- src/modules/workout/sql/client-cardio-soorten.sql
--
-- Eigen cardio-soorten van een klant (27 okt 2026). "+ Training → Cardio →
-- Eigen sport" bewaart de naam hier; daarna staat hij tussen de vaste sporten
-- (cardioSoorten.js). De rest van het systeem werkt al op de naam
-- ("Cardio · Boksen"), dus verder hoeft er niets te veranderen.

create table if not exists public.client_cardio_soorten (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  naam text not null check (length(trim(naam)) between 1 and 40),
  duur_minuten integer,
  created_at timestamptz not null default now()
);
create unique index if not exists client_cardio_soorten_uniek on public.client_cardio_soorten (client_id, lower(trim(naam)));
alter table public.client_cardio_soorten enable row level security;
create policy eigen_cardio_klant on public.client_cardio_soorten for all to authenticated
  using (client_id in (select id from public.clients where auth_user_id = auth.uid()))
  with check (client_id in (select id from public.clients where auth_user_id = auth.uid()));
create policy eigen_cardio_coach on public.client_cardio_soorten for select to authenticated
  using (client_id in (select id from public.clients where trainer_id = auth.uid()));
