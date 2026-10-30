-- src/modules/business-os/business-os-skills.sql
--
-- Skills voor de Business OS-chat (30 okt 2026). Een skill = een vaste werkwijze
-- voor een soort taak (reel-script, lookalike-content, app-wijziging…). De edge
-- function business-os-chat leest de actieve skills van de coach bij elke vraag
-- in de systeemprompt; Kersten maakt en wijzigt ze door erover te praten in de
-- chat (tools bewaar_skill / verwijder_skill). Geen beheerscherm.

create table if not exists public.business_os_skills (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid(),
  naam text not null,
  wanneer text not null,
  instructies text not null,
  actief boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, naam)
);

alter table public.business_os_skills enable row level security;

create policy coach_eigen_skills on public.business_os_skills
  for all to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());
