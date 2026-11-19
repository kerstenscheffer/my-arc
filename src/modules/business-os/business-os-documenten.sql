-- src/modules/business-os/business-os-documenten.sql
--
-- Documenten in het Gino-scherm (19 nov 2026). Eerste document: de avatar
-- (slug 'avatar'), bewerkbaar boven de bol. Eén rij per coach per slug, zodat er
-- later meer documenten bij kunnen zonder nieuwe tabel.
-- Gino mag hem zelf aanpassen: de tabel staat op de veilige lijst van
-- business_os_wijziging_bewaakt (zie onderaan). Alleen toevoegen: oude app-versies raken niets.

create table if not exists public.business_os_documenten (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid(),
  slug text not null,
  titel text not null,
  inhoud text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, slug)
);

alter table public.business_os_documenten enable row level security;

drop policy if exists coach_eigen_documenten on public.business_os_documenten;
create policy coach_eigen_documenten on public.business_os_documenten
  for all to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

grant select, insert, update on public.business_os_documenten to authenticated;

-- updated_at ook als Gino schrijft (die zet hem niet zelf).
create or replace function public.business_os_documenten_bijgewerkt()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists business_os_documenten_bijgewerkt on public.business_os_documenten;
create trigger business_os_documenten_bijgewerkt before update on public.business_os_documenten
  for each row execute function public.business_os_documenten_bijgewerkt();

-- Op de veilige lijst: in de live definitie van business_os_wijziging_bewaakt
-- staat 'business_os_documenten' achter 'business_os_geldplan' in v_veilig
-- (toegevoegd met replace() op pg_get_functiondef, 19 nov 2026).
