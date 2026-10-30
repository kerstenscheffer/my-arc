-- src/modules/business-os/business-os-gesprekken.sql
--
-- Gesprekken (tabjes) in de Business OS-chat, 30 okt 2026. Eén rij per tabje
-- (Code, Strategie, extra's) met de berichten als jsonb (laatste 40, zonder
-- volle afbeeldingen, wel thumbnails). BusinessChat.jsx leest/schrijft deze
-- tabel; zolang hij niet bestaat blijft alles in localStorage werken.
-- Alleen toevoegen, niets weghalen (oude app-versies blijven werken).

create table if not exists public.business_os_gesprekken (
  id          uuid primary key,
  coach_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  naam        text not null,
  volgorde    int  not null default 0,
  sessie      uuid,                          -- gesprek_id voor Slim (--session-id / --resume)
  berichten   jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

create index if not exists business_os_gesprekken_coach_idx
  on public.business_os_gesprekken (coach_id, volgorde);

alter table public.business_os_gesprekken enable row level security;

drop policy if exists business_os_gesprekken_eigen on public.business_os_gesprekken;
create policy business_os_gesprekken_eigen on public.business_os_gesprekken
  for all to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());
