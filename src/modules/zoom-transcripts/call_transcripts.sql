-- Zoom-transcripts: letterlijk bewaard, per Zoom My Note één rij (3 nov 2026).
-- Geschreven door scripts/zoom-sync.mjs op de Mac (PA-sessie van de coach).
-- Alleen toevoegen: oude app-versies gebruiken deze tabel niet.

create table if not exists public.call_transcripts (
  id                  uuid primary key default gen_random_uuid(),
  coach_id            uuid not null references auth.users(id) on delete cascade,
  zoom_note_id        text not null unique,
  titel               text,
  gestart_at          timestamptz,
  duur_seconden       integer,
  -- { "speakers": [{speaker_id, display_name, zoom_user_id}], "items": [{speaker_id, start_time, end_time, text}] }
  transcript          jsonb not null default '{"speakers":[],"items":[]}'::jsonb,
  aantal_items        integer not null default 0,
  notitie_samenvatting text,
  notitie_handmatig   text,
  zoom_link           text,
  zoom_meeting_uuid   text,
  zoom_aangemaakt_at  timestamptz,
  zoom_gewijzigd_at   timestamptz,
  call_insight_id     uuid references public.call_insights(id) on delete set null,
  client_id           uuid references public.clients(id) on delete set null,
  status              text not null default 'ok' check (status in ('ok', 'leeg')),
  opgehaald_at        timestamptz not null default now()
);

create index if not exists call_transcripts_coach_gestart_idx on public.call_transcripts (coach_id, gestart_at desc);
create index if not exists call_transcripts_client_idx on public.call_transcripts (client_id) where client_id is not null;
create index if not exists call_transcripts_insight_idx on public.call_transcripts (call_insight_id) where call_insight_id is not null;

alter table public.call_transcripts enable row level security;

-- Klanten en anon nooit: anon heeft geen rechten, en de policy eist een coach-rol binnen het team.
revoke all on table public.call_transcripts from anon;
revoke all on table public.call_transcripts from public;
grant select, insert, update on table public.call_transcripts to authenticated;

drop policy if exists call_transcripts_team on public.call_transcripts;
create policy call_transcripts_team on public.call_transcripts
  for all to authenticated
  using (get_my_portal_role() = any (array['coach'::text, 'both'::text]) and coach_id = any (team_coach_ids(auth.uid())))
  with check (get_my_portal_role() = any (array['coach'::text, 'both'::text]) and coach_id = any (team_coach_ids(auth.uid())));
