-- src/modules/business-os/gino-stem-verbruik.sql
--
-- Verbruik van Gino's stem per maand (UTC) en per provider (8 nov 2026).
-- Azure geeft zelf geen tegoed terug, dus gino-stem telt de tekens na elke
-- geslaagde Azure-aanroep. Alleen toevoegen; niets dat er al was verandert.
--
--   → lezen: alleen de teameigenaar (Kersten), via RLS;
--   → schrijven: alleen de edge function (service_role) via gino_stem_tel,
--     die in één statement ophoogt, dus gelijktijdige stukken tellen allebei mee.

create table if not exists public.gino_stem_verbruik (
  maand date not null,
  provider text not null,
  tekens bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (maand, provider)
);

alter table public.gino_stem_verbruik enable row level security;

drop policy if exists teameigenaar_leest_stem_verbruik on public.gino_stem_verbruik;
create policy teameigenaar_leest_stem_verbruik on public.gino_stem_verbruik
  for select to authenticated
  using (exists (select 1 from public.coach_teams t where t.owner_id = (select auth.uid())));

revoke all on table public.gino_stem_verbruik from anon, authenticated;
grant select on table public.gino_stem_verbruik to authenticated;
grant select, insert, update on table public.gino_stem_verbruik to service_role;

create or replace function public.gino_stem_tel(p_provider text, p_tekens bigint)
returns bigint
language sql
set search_path = public
as $$
  insert into public.gino_stem_verbruik as v (maand, provider, tekens)
  select (date_trunc('month', now() at time zone 'utc'))::date, p_provider, p_tekens
  where coalesce(p_tekens, 0) > 0
  on conflict (maand, provider) do update
    set tekens = v.tekens + excluded.tekens, updated_at = now()
  returning v.tekens;
$$;

revoke all on function public.gino_stem_tel(text, bigint) from public, anon, authenticated;
grant execute on function public.gino_stem_tel(text, bigint) to service_role;
