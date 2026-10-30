-- src/modules/business-os/business-os-schermen.sql
--
-- Bewaarde schermen (30 okt 2026). Kersten bewaart een goed visueel van Gino
-- (knop 'Bewaar') en haalt het later terug via puntjes-menu → Mijn schermen.
-- Terughalen = 'Laat <naam> zien' naar Gino (verse data); visueel is alleen de
-- laatste versie als snelle preview. Gino krijgt naam/omschrijving/vraag mee in
-- de context. Alleen toevoegen: oude app-versies raken niets.

create table if not exists public.business_os_schermen (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid(),
  naam text not null,
  omschrijving text,
  vraag text,
  visueel jsonb,
  created_at timestamptz not null default now(),
  laatst_getoond_at timestamptz
);

create index if not exists business_os_schermen_coach on public.business_os_schermen (coach_id, created_at desc);

alter table public.business_os_schermen enable row level security;

create policy coach_eigen_schermen on public.business_os_schermen
  for all to authenticated
  using (coach_id = auth.uid() or coach_id = any (public.team_coach_ids(auth.uid())))
  with check (coach_id = auth.uid() or coach_id = any (public.team_coach_ids(auth.uid())));

grant select, insert, update, delete on public.business_os_schermen to authenticated;

-- Eerste scherm voor Kersten.
insert into public.business_os_schermen (coach_id, naam, omschrijving, vraag, visueel)
select u.id, 'Challenge-overzicht',
  'Alle challenge-klanten met 6 weekbalken, gevuld tot hun huidige week, met doorstap-status',
  'laat een overzicht zien van alle challenge klanten met 6 week balken en geladen tot elke week ze zitten',
  null
from auth.users u
where u.email = 'kerstenscheffer@gmail.com'
  and not exists (select 1 from public.business_os_schermen s where s.coach_id = u.id and s.naam = 'Challenge-overzicht');
