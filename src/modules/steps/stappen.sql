-- Stappenteller — tabel + dagdoel.
-- Toegepast als migratie `client_step_logs` (18 sep 2026).
--
-- Waarom een eigen tabel naast cardio_logs: daar staat een sessie in
-- ("30 min wandelen op dinsdag"). Stappen zijn een dagtotaal dat de hele dag
-- wordt bijgewerkt; als losse sessie-rijen tel je dat nooit meer goed op.
--
-- `source` staat erbij voor de telefoonkoppeling later (zie telefoonStappen.js):
-- een stand uit Apple Health hoort een handmatig getal niet stil te
-- overschrijven, en je wilt kunnen zien waar een getal vandaan komt.

create table if not exists public.client_step_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  steps integer not null default 0 check (steps >= 0 and steps <= 200000),
  source text not null default 'handmatig',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, date)
);

create index if not exists idx_client_step_logs_client_date
  on public.client_step_logs (client_id, date desc);

alter table public.client_step_logs enable row level security;

create policy client_eigen_stappen on public.client_step_logs
  for all to authenticated
  using (client_id in (select id from public.clients where auth_user_id = auth.uid()))
  with check (client_id in (select id from public.clients where auth_user_id = auth.uid()));

create policy coach_stappen_van_klanten on public.client_step_logs
  for all to authenticated
  using (client_id in (select id from public.clients where trainer_id = auth.uid()))
  with check (client_id in (select id from public.clients where trainer_id = auth.uid()));

-- clients.daily_steps is de band uit de intake ('5000_7500') en geen doel.
alter table public.clients
  add column if not exists step_goal integer;
