-- Geplande maaltijden (13 nov 2026, Kersten). Uitgevoerd op die dag.
--
-- In de stand vrij loggen alvast maaltijden klaarzetten voor vandaag of de
-- komende dagen, en zien wat dat optelt. Los van consumed_meals: gepland is nog
-- niet gegeten en mag niet meetellen in logs, weekreview of de gemeten TDEE.
-- "Gegeten" (GeplandBlok.jsx) zet de rij over naar consumed_meals en vult
-- gelogd_id. Het logvenster schrijft hierheen als SmartLoggingService.planDatum
-- gevuld is.
create table if not exists public.geplande_maaltijden (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  datum date not null,
  meal_type text not null default 'snack',
  meal_name text not null,
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  amount numeric,
  per_unit text,
  image_url text,
  payload jsonb not null,            -- de rij zoals hij straks in consumed_meals gaat
  gelogd_id uuid,                    -- consumed_meals.id zodra hij gegeten is
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gm_client_datum on public.geplande_maaltijden (client_id, datum);

alter table public.geplande_maaltijden enable row level security;
drop policy if exists gm_klant on public.geplande_maaltijden;
create policy gm_klant on public.geplande_maaltijden for all to authenticated
  using (client_id in (select id from clients where auth_user_id = auth.uid()))
  with check (client_id in (select id from clients where auth_user_id = auth.uid()));
-- is_coach_van staat in workout/bouwfase/mesocyclus.sql.
drop policy if exists gm_coach on public.geplande_maaltijden;
create policy gm_coach on public.geplande_maaltijden for all to authenticated
  using (is_coach_van(client_id)) with check (is_coach_van(client_id));
