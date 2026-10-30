-- src/modules/business-os/business-os-editor.sql
--
-- Tabje 'Editor' in de Business OS-chat (30 okt 2026): praat via de edge
-- function editor-chat met ChatGPT (OpenAI API) als video-editor-assistent
-- (knipplannen, titels, ondertitels, instructies). Alleen tekst: ChatGPT kan
-- niet in de editor klikken of bestanden op de Mac aanpassen.
--
-- 1. editor_opdrachten: elke gestuurde opdracht is een rij. editor-chat zet hem
--    op 'bezig', daarna 'klaar' (antwoord) of 'mislukt' (fout). 'open' is voor
--    later (klaargezet maar nog niet verstuurd).
-- 2. De vaste systeemprompt ("Editor-basis") is een rij in business_os_skills
--    met naam 'Editor-basis' (al ingevuld op 30 okt). Aanpassen = die rij wijzigen,
--    of het Gino vragen (bewaar_skill). Model wisselen: secret OPENAI_MODEL of
--    STANDAARD_MODEL in editor-chat.
--
-- Zonder deze tabel werkt het tabje gewoon (alleen zonder lijst). Alleen
-- toevoegen, niets weghalen (oude app-versies).

create table if not exists public.editor_opdrachten (
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

create index if not exists editor_opdrachten_coach_idx
  on public.editor_opdrachten (coach_id, created_at desc);

alter table public.editor_opdrachten enable row level security;

drop policy if exists coach_eigen_editor_opdrachten on public.editor_opdrachten;
create policy coach_eigen_editor_opdrachten on public.editor_opdrachten
  for all to authenticated
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());
