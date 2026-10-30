-- src/modules/business-os/business-os-editor.sql
--
-- Tabje 'Editor' in de Business OS-chat (30 okt 2026): praat via de edge
-- function editor-chat met ChatGPT (OpenAI API) als video-editor-assistent
-- (knipplannen, titels, ondertitels, instructies). Alleen tekst: ChatGPT kan
-- niet in de editor klikken of bestanden op de Mac aanpassen.
--
-- 1. business_os_editor_opdrachten: elke gestuurde opdracht is een rij.
--    editor-chat zet hem op 'bezig', daarna 'klaar' (antwoord) of 'mislukt'
--    (fout). 'open' is voor later (klaargezet maar nog niet verstuurd).
-- 2. business_os_editor_instellingen: één rij per coach met de vaste
--    systeemprompt ("de editor-basis") en eventueel een ander model. Geen rij
--    of leeg veld → de placeholder/het standaardmodel uit editor-chat.
--
-- Zonder deze tabellen werkt het tabje gewoon (alleen zonder lijst en met de
-- placeholder-prompt). Alleen toevoegen, niets weghalen (oude app-versies).

create table if not exists public.business_os_editor_opdrachten (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  opdracht    text not null,
  antwoord    text,
  status      text not null default 'open' check (status in ('open', 'bezig', 'klaar', 'mislukt')),
  model       text,
  fout        text,
  klaar_at    timestamptz
);

create index if not exists business_os_editor_opdrachten_coach_idx
  on public.business_os_editor_opdrachten (coach_id, created_at desc);

alter table public.business_os_editor_opdrachten enable row level security;

drop policy if exists coach_eigen_editor_opdrachten on public.business_os_editor_opdrachten;
create policy coach_eigen_editor_opdrachten on public.business_os_editor_opdrachten
  for all to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create table if not exists public.business_os_editor_instellingen (
  coach_id      uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  systeemprompt text,
  model         text,          -- leeg = standaard in editor-chat (OPENAI_MODEL of gpt-5-mini)
  updated_at    timestamptz not null default now()
);

alter table public.business_os_editor_instellingen enable row level security;

drop policy if exists coach_eigen_editor_instellingen on public.business_os_editor_instellingen;
create policy coach_eigen_editor_instellingen on public.business_os_editor_instellingen
  for all to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- Editor-basis invullen (of later aanpassen), als Kersten ingelogd / via Gino:
--   insert into business_os_editor_instellingen (coach_id, systeemprompt)
--   values (auth.uid(), 'Jij bent mijn video-editor-assistent. ...')
--   on conflict (coach_id) do update set systeemprompt = excluded.systeemprompt, updated_at = now();
