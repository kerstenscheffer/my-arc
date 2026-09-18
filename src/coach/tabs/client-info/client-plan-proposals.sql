-- src/coach/tabs/client-info/client-plan-proposals.sql
--
-- Het planvoorstel bij een intake: wat er besproken of ingevuld is, en wat het
-- plan wordt. Gelezen en bewerkt door PlanVoorstelTab.jsx (tab "Plan" in de
-- intake-modal).
--
-- Toegepast via migratie `client_plan_proposals`; hier bewaard zodat de
-- definitie in git staat en niet alleen in Supabase.
--
-- training/macros/voeding zijn arrays van {besproken, plan}; video en checks
-- zijn arrays van losse regels.

create table if not exists public.client_plan_proposals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  coach_id uuid not null,
  training jsonb not null default '[]'::jsonb,
  macros jsonb not null default '[]'::jsonb,
  voeding jsonb not null default '[]'::jsonb,
  video jsonb not null default '[]'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  status text not null default 'concept',
  generated_by text default 'ai',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint client_plan_proposals_status_check
    check (status in ('concept', 'besproken', 'verwerkt')),
  constraint client_plan_proposals_generated_by_check
    check (generated_by is null or generated_by in ('ai', 'coach'))
);

comment on table public.client_plan_proposals is
  'Het A4-planvoorstel per klant: wat er in de intake besproken is en wat het plan wordt. Alleen voor de coach; klanten hebben geen leesrecht.';

-- Hooguit één lopend voorstel per klant. Een verwerkt voorstel blijft staan als
-- historie, dus die valt buiten de index.
create unique index if not exists client_plan_proposals_een_lopend
  on public.client_plan_proposals (client_id)
  where status <> 'verwerkt';

create index if not exists client_plan_proposals_coach_idx
  on public.client_plan_proposals (coach_id, updated_at desc);

alter table public.client_plan_proposals enable row level security;

-- Alleen de coach die de rij bezit. Bewust niet het bredere
-- `authenticated_all_access`-patroon dat op client_action_items staat: hierin
-- staat wat je met een klant gaat doen, en dat hoort niet bij een andere coach
-- of bij de klant zelf terecht te komen.
drop policy if exists coach_eigen_planvoorstellen on public.client_plan_proposals;
create policy coach_eigen_planvoorstellen
  on public.client_plan_proposals
  for all
  to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

grant select, insert, update, delete on public.client_plan_proposals to authenticated;

-- Nagerekend op 18 sep 2026, als rol `authenticated` met de uid van de coach:
--   aanmaken, lezen, bewerken (generated_by wordt 'coach') en status wisselen
--   werken; een tweede lopend voorstel wordt door de index geweigerd; naast een
--   verwerkt voorstel mag wel een nieuw concept; een onbekende status wordt
--   door de check geweigerd. Met de uid van een andere coach: 0 rijen zichtbaar,
--   0 rijen te wijzigen, en invoeren op naam van de eerste coach wordt
--   geweigerd door de with check.
