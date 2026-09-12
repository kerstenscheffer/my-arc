-- Toegepast op 12 sep 2026. Weekplanning die vooruit loopt op de vaste
-- weekindeling in clients.workout_schedule: een klant kan een komende week
-- alvast anders indelen zonder de huidige week te raken. Zodra die week
-- begint promoveert de app de rij naar clients.workout_schedule en wist 'm
-- (WorkoutServiceNew.promoveerWeekPlanning), zodat er precies één bron blijft
-- voor "welke workout hoort bij vandaag" — de workout van vandaag en de
-- challenge-RPC lezen die ongewijzigd.
create table if not exists public.client_week_schedules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  week_start date not null,
  schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (client_id, week_start)
);

create index if not exists client_week_schedules_client_week_idx
  on public.client_week_schedules (client_id, week_start);

alter table public.client_week_schedules enable row level security;

drop policy if exists authenticated_all_access on public.client_week_schedules;
create policy authenticated_all_access on public.client_week_schedules
  for all to authenticated using (true) with check (true);
