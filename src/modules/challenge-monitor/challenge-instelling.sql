-- src/modules/challenge-monitor/challenge-instelling.sql (5 nov 2026)
--
-- Handmatige keuzes per challenge-klant. Alleen toevoegen, alleen voor coach en team.
--   telt_niet_mee   niet meetellen in de doorstap (bv. begonnen zonder te betalen)
--   borg_geschikt   null = volgt de eisen, true/false = handmatig vastgezet
-- Bewust een eigen tabel: challenge_assignments zet bij de klant de trofee aan.

create table if not exists public.client_challenge_instelling (
  client_id uuid primary key references public.clients(id) on delete cascade,
  telt_niet_mee boolean not null default false,
  borg_geschikt boolean,
  reden text,
  gezet_door uuid default auth.uid(),
  updated_at timestamptz not null default now()
);
alter table public.client_challenge_instelling enable row level security;

drop policy if exists client_challenge_instelling_team on public.client_challenge_instelling;
create policy client_challenge_instelling_team on public.client_challenge_instelling
  for all to authenticated
  using (exists (select 1 from clients c where c.id = client_id and c.coach_id = any(team_coach_ids(auth.uid()))))
  with check (exists (select 1 from clients c where c.id = client_id and c.coach_id = any(team_coach_ids(auth.uid()))));

revoke all on public.client_challenge_instelling from anon;
grant select, insert, update, delete on public.client_challenge_instelling to authenticated;

-- 5 nov 2026: welke challenge-sale bij deze klant hoort. Sales staan op Instagram-naam en hebben
-- geen client_id. Die vullen we bewust niet: client_id laat betaaltermijnen meeschuiven met pauzes.
alter table public.client_challenge_instelling add column if not exists sale_id uuid references public.lead_movements(id) on delete set null;
create unique index if not exists client_challenge_instelling_sale on public.client_challenge_instelling (sale_id) where sale_id is not null;
notify pgrst, 'reload schema';
