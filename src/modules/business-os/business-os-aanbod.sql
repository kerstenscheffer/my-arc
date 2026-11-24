-- src/modules/business-os/business-os-aanbod.sql
--
-- Aanbod-rekenaar (23 nov 2026). Puntjes-menu → Aanbod (Aanbod.jsx, aanbodData.js).
-- Kersten denkt zijn vervolgaanbod uit in drie tiers (Premium, Midden, Basis) en
-- laat het in de eindcall op zijn scherm zien. Eén rij per coach met alles wat hij
-- invult, zodat Mac en telefoon gelijk lopen. Er gaat niets naar klanten of leads.
-- Alleen de eigen coach: geen team, geen klanten (rls_is_coach).
-- Alleen toevoegen: oude app-versies kennen deze tabel niet en raken niets.
-- Vorm van gegevens (beginwaarden staan in aanbodData.js, BEGIN):
--   { partnerPct, vooruitPct, borgAan, borgBedrag,
--     tiers: { premium|midden|basis: { prijs: { "4","6","12" },
--     kostenMaand, kostenEenmalig, urenMaand, urenEenmalig, onderdelen: [tekst] } } }
-- Gedraaid via de Supabase-koppeling op 23 nov 2026.
-- Later op 23 nov: vooruitPct (korting bij vooruitbetalen), borgAan en borgBedrag
-- erbij in gegevens. Geen schemawijziging; een rij zonder die velden leest als
-- 20 procent, borg uit, 300. Kerstens rij is toen gevuld met zijn drie tiers.
-- 24 nov: producten, vergelijking en tiers.<tier>.zin (het aanbod in één zin) erbij
-- in gegevens. Geen schemawijziging; een rij zonder leest als leeg. De vorm staat
-- in aanbodData.js. Nieuw veld = ook in normaliseer en aanbodVoorGino zetten: de
-- pagina schrijft het hele object terug, wat daar niet in zit is na één opslag weg.
-- 24 nov (later): gratisMaanden { "3","6","12" } erbij (gratis maanden bij vooruitbetalen,
-- vervangt de korting; vooruitPct blijft bestaan en staat op 0) en prijs krijgt sleutel "3".
-- Het scherm toont 3, 6 en 12; prijs "4" blijft staan voor oudere app-versies. Geen
-- schemawijziging; een rij zonder gratisMaanden leest als 1, 3 en 6.

create table if not exists public.business_os_aanbod (
  coach_id uuid primary key default auth.uid(),
  gegevens jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.business_os_aanbod enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'business_os_aanbod' and policyname = 'coach_eigen_aanbod') then
    create policy coach_eigen_aanbod on public.business_os_aanbod
      for all to authenticated
      using (coach_id = auth.uid() and public.rls_is_coach())
      with check (coach_id = auth.uid() and public.rls_is_coach());
  end if;
end $$;

-- Supabase geeft nieuwe tabellen standaard alle rechten; de app heeft alleen
-- lezen en schrijven van de eigen rij nodig.
revoke all on public.business_os_aanbod from anon;
revoke delete, truncate, references, trigger on public.business_os_aanbod from authenticated;
grant select, insert, update on public.business_os_aanbod to authenticated;
