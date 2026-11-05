-- src/modules/business-os/business-os-notities.sql
--
-- Notities (5 nov 2026). Kersten zet een antwoord van Gino vast (knop Vastzetten)
-- en vindt het terug via puntjes-menu → Notities, ook op een ander apparaat.
-- Eigen tabel en niet business_os_schermen: oude app-versies zouden notities daar
-- als scherm tonen en naar Gino sturen. Alleen toevoegen: oude versies raken niets.
-- titel null = de eerste regel van de tekst. Alleen de eigen coach, geen team.
-- Gino verwijdert niets: de tabel staat niet op de lijst in business-os-wijzigingen.sql.

create table if not exists public.business_os_notities (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid(),
  titel text,
  tekst text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_os_notities_coach on public.business_os_notities (coach_id, created_at desc);

alter table public.business_os_notities enable row level security;

drop policy if exists coach_eigen_notities on public.business_os_notities;
create policy coach_eigen_notities on public.business_os_notities
  for all to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

grant select, insert, update, delete on public.business_os_notities to authenticated;
