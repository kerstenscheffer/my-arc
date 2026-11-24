-- Klantenbord op Command (24 nov 2026, Kersten): klanten in eigen secties
-- slepen (kanban), naast de gewone lijst. Per coach eigen secties.
-- Puur toevoegen: oude app-versies merken hier niets van.

create table if not exists public.command_bord_secties (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  naam text not null,
  kleur text not null default 'wit',
  volgorde integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists command_bord_secties_coach on public.command_bord_secties (coach_id, volgorde);

create table if not exists public.command_bord_plek (
  coach_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  sectie_id uuid not null references public.command_bord_secties(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (coach_id, client_id)
);

alter table public.command_bord_secties enable row level security;
alter table public.command_bord_plek enable row level security;

drop policy if exists eigen_secties on public.command_bord_secties;
create policy eigen_secties on public.command_bord_secties for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

drop policy if exists eigen_plek on public.command_bord_plek;
create policy eigen_plek on public.command_bord_plek for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

revoke all on public.command_bord_secties, public.command_bord_plek from anon;
revoke truncate, references, trigger on public.command_bord_secties, public.command_bord_plek from authenticated;
