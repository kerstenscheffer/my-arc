-- src/modules/business-os/keten-weergaven.sql (5 nov 2026)
--
-- Opgeslagen weergaven van de Keten-tabel in Gino: welke stats, in welke volgorde.
-- Alleen toevoegen. Los van stat_presets, want die lijst staat ook in het stats-scherm
-- van Leads en heeft andere stat-namen. Per coach; teamleden hebben hun eigen weergaven.

create table if not exists public.business_os_keten_weergaven (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  naam text not null check (length(trim(naam)) between 1 and 60),
  keys jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, naam)
);

alter table public.business_os_keten_weergaven enable row level security;

drop policy if exists keten_weergaven_eigen on public.business_os_keten_weergaven;
create policy keten_weergaven_eigen on public.business_os_keten_weergaven
  for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

revoke all on public.business_os_keten_weergaven from anon;
grant select, insert, update, delete on public.business_os_keten_weergaven to authenticated;
