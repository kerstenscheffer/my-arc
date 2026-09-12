-- Toegepast op 12 sep 2026. Cardio staat los van het krachtschema: de coach
-- zet per klant vast wat er aan cardio moet gebeuren (soort, hoe vaak per
-- week, duur/afstand/stappen), de klant logt daartegen in cardio_logs.
-- Zat eerder als item ín een trainingsdag, waardoor cardio alleen bestond op
-- dagen dat er ook getraind werd.
--
-- Koppeling log ↔ plan gaat op soort (lower+trim), niet op een verwijzing:
-- een klant kan ook los loggen en dan telt die sessie gewoon mee.
create table if not exists public.client_cardio_plan (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  cardio_type text not null,
  times_per_week integer not null default 1,
  duration_minutes integer,
  distance_km numeric,
  steps integer,
  intensity text,
  notes text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists client_cardio_plan_client_idx
  on public.client_cardio_plan (client_id, active, sort_order);

alter table public.client_cardio_plan enable row level security;

drop policy if exists authenticated_all_access on public.client_cardio_plan;
create policy authenticated_all_access on public.client_cardio_plan
  for all to authenticated using (true) with check (true);
