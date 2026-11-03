-- business-os-toestemmingen.sql (3 nov 2026)
--
-- Toestemmingsvragen van Gino in de Business OS-chat. Een chat- of code-opdracht
-- die een tool buiten de lijst nodig heeft, pauzeert; de PA zet hier een rij en
-- Kersten beslist met de knoppen op de kaart. De harde blokkades zitten in
-- scripts/gino-blokkade.mjs, niet hier: zo'n poging komt alleen als rij met
-- status 'geblokkeerd' binnen, om te tonen. Daar kan niets meer aan veranderen.
--
-- Alleen aanvullend: twee nieuwe tabellen, geen bestaande regel aangeraakt.
-- Staat deze SQL er niet, dan werkt de PA gewoon als voorheen (weigert stil).

create table if not exists public.business_os_toestemmingen (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid(),
  opdracht_id uuid references public.business_os_opdrachten (id) on delete set null,
  tool text not null,
  invoer text,                       -- exact commando of parameters, geheimen gemaskeerd
  reden text,                        -- wat Gino wil doen in gewone taal
  patroon text,                      -- regel voor Altijd toestaan; null = kan niet
  status text not null default 'wacht'
    check (status in ('wacht', 'toegestaan', 'altijd', 'afgewezen', 'verlopen', 'geblokkeerd')),
  gevraagd_at timestamptz not null default now(),
  beslist_at timestamptz,
  gezien_at timestamptz              -- Geblokkeerd-kaart weggeklikt
);

create index if not exists business_os_toestemmingen_open
  on public.business_os_toestemmingen (coach_id, status, gevraagd_at desc);

alter table public.business_os_toestemmingen enable row level security;

-- Alleen de eigenaar zelf: geen team, geen klant.
drop policy if exists eigenaar_toestemmingen on public.business_os_toestemmingen;
create policy eigenaar_toestemmingen on public.business_os_toestemmingen
  for all to authenticated
  using (coach_id = auth.uid() and public.get_my_portal_role() in ('coach', 'both'))
  with check (coach_id = auth.uid() and public.get_my_portal_role() in ('coach', 'both'));

-- Supabase geeft nieuwe tabellen standaard alle rechten: eerst weg, dan alleen wat hoort.
revoke all on public.business_os_toestemmingen from anon, authenticated;
grant select, insert on public.business_os_toestemmingen to authenticated;
grant update (status, beslist_at, gezien_at) on public.business_os_toestemmingen to authenticated;

-- Een beslissing staat vast: alleen vanuit 'wacht' kan de status nog veranderen.
-- Zo wordt 'geblokkeerd' nooit 'toegestaan', ook niet met een losse update.
create or replace function public.business_os_toestemming_bewaak()
returns trigger language plpgsql as $$
begin
  if old.status <> 'wacht' and new.status <> old.status then
    raise exception 'Deze toestemmingsvraag is al afgesloten (%)', old.status;
  end if;
  return new;
end
$$;

drop trigger if exists business_os_toestemming_bewaak on public.business_os_toestemmingen;
create trigger business_os_toestemming_bewaak
  before update on public.business_os_toestemmingen
  for each row execute function public.business_os_toestemming_bewaak();

-- Eigen lijst voor Altijd toestaan. Intrekken = actief op false (log blijft staan).
create table if not exists public.business_os_toestemming_regels (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid(),
  patroon text not null check (
    length(patroon) > 0
    and patroon !~ '^\*'
    and patroon !~ '^Bash(\(\s*\*?\s*\))?$'
    and patroon !~ '^Bash\(\s*\*'
  ),
  tool text not null,
  reden text,
  toestemming_id uuid references public.business_os_toestemmingen (id) on delete set null,
  actief boolean not null default true,
  created_at timestamptz not null default now(),
  ingetrokken_at timestamptz,
  laatst_gebruikt_at timestamptz
);

create unique index if not exists business_os_toestemming_regels_uniek
  on public.business_os_toestemming_regels (coach_id, patroon) where actief;

alter table public.business_os_toestemming_regels enable row level security;

drop policy if exists eigenaar_toestemming_regels on public.business_os_toestemming_regels;
create policy eigenaar_toestemming_regels on public.business_os_toestemming_regels
  for all to authenticated
  using (coach_id = auth.uid() and public.get_my_portal_role() in ('coach', 'both'))
  with check (coach_id = auth.uid() and public.get_my_portal_role() in ('coach', 'both'));

revoke all on public.business_os_toestemming_regels from anon, authenticated;
grant select, insert on public.business_os_toestemming_regels to authenticated;
grant update (actief, ingetrokken_at, laatst_gebruikt_at) on public.business_os_toestemming_regels to authenticated;

-- Realtime aan, net als business_os_opdrachten. Twee keer draaien mag.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'business_os_toestemmingen') then
    alter publication supabase_realtime add table public.business_os_toestemmingen;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'business_os_toestemming_regels') then
    alter publication supabase_realtime add table public.business_os_toestemming_regels;
  end if;
end
$$;
