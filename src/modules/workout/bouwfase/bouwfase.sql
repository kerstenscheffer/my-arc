-- src/modules/workout/bouwfase/bouwfase.sql  (9 nov 2026)
-- Bouwfase-tracking: alleen erbij, niets weg (oude app-versies blijven werken).
-- training_fases: per klant een bouwfase (start + weken) en deload; aan = actief.
-- training_feedback: na elke oefening (score 1-10, gevoel, opmerking), herstel
-- per spiergroep ("Voel je je borst nog van vorige workout?") en na de workout.

create table if not exists public.training_fases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  coach_id uuid,
  start_datum date not null default current_date,
  bouw_weken int not null default 7 check (bouw_weken between 1 and 16),
  deload_dagen int not null default 3 check (deload_dagen between 0 and 14),
  actief boolean not null default true,
  notitie text,
  reflectie jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists training_fases_client_idx on public.training_fases (client_id, actief);

create table if not exists public.training_feedback (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  datum date not null default current_date,
  soort text not null check (soort in ('oefening', 'herstel', 'workout')),
  oefening text,
  spiergroep text,
  score smallint check (score between 1 and 10),
  gevoel text,
  opmerking text,
  fase_id uuid references public.training_fases(id) on delete set null,
  sleutel text generated always as (soort || '|' || coalesce(lower(oefening), '') || '|' || coalesce(spiergroep, '')) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, datum, sleutel)
);
create index if not exists training_feedback_client_idx on public.training_feedback (client_id, datum desc);

alter table public.training_fases enable row level security;
alter table public.training_feedback enable row level security;

-- Fase: de coach zet hem aan en uit; de klant leest alleen.
drop policy if exists rls_coach on public.training_fases;
create policy rls_coach on public.training_fases for all to authenticated
  using ((select rls_is_coach())) with check ((select rls_is_coach()));
drop policy if exists rls_klant_lezen on public.training_fases;
create policy rls_klant_lezen on public.training_fases for select to authenticated
  using (client_id in (select rls_mijn_client_ids()));

drop policy if exists rls_eigen on public.training_feedback;
create policy rls_eigen on public.training_feedback for all to authenticated
  using ((select rls_is_coach()) or client_id in (select rls_mijn_client_ids()))
  with check ((select rls_is_coach()) or client_id in (select rls_mijn_client_ids()));

-- Reflectie aan het einde van de fase: de klant mag training_fases niet zelf
-- wijzigen, dus alleen dit ene veld via een RPC (9 nov 2026).
create or replace function public.bewaar_fase_reflectie(p_fase_id uuid, p_reflectie jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- De klant zelf, of zijn coach (die kijkt mee in de klantweergave; 13 nov 2026:
  -- als coach ingelogd gaf opslaan "fase niet gevonden"). is_coach_van staat in mesocyclus.sql.
  update training_fases set reflectie = p_reflectie, updated_at = now()
  where id = p_fase_id and (client_id in (select rls_mijn_client_ids()) or is_coach_van(client_id));
  if not found then raise exception 'fase niet gevonden'; end if;
end $$;
revoke all on function public.bewaar_fase_reflectie(uuid, jsonb) from public, anon;
grant execute on function public.bewaar_fase_reflectie(uuid, jsonb) to authenticated;

-- De fase hoort bij het plan waarop hij gestart is (Workout Builder, 9 nov 2026).
alter table public.training_fases add column if not exists schema_id uuid references public.workout_schemas(id) on delete set null;
