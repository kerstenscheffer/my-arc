-- src/modules/kersten-ai/kersten-ai.sql (24 nov 2026)
--
-- Kersten AI: chat-assistent in de app voor app-gebruikers (clients.app_abonnee).
-- Alleen toevoegen; oude app-versies lezen hier niets van.
--
-- De edge function kersten-ai (service role) schrijft elke vraag en elk antwoord
-- weg. Daarmee:
--   - telt hij de limiet (20 vragen per dag per account);
--   - kan Kersten later teruglezen wat mensen vragen.
-- Een klant mag alleen zijn eigen berichten lezen; schrijven doet alleen de server.

create table if not exists public.kersten_ai_berichten (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  rol text not null check (rol in ('vraag', 'antwoord')),
  tekst text not null,
  acties jsonb,
  gebruik jsonb,
  created_at timestamptz not null default now()
);
create index if not exists kersten_ai_berichten_gebruiker_tijd on public.kersten_ai_berichten (auth_user_id, created_at desc);

alter table public.kersten_ai_berichten enable row level security;

drop policy if exists kersten_ai_eigen on public.kersten_ai_berichten;
create policy kersten_ai_eigen on public.kersten_ai_berichten
  for select to authenticated using (auth_user_id = auth.uid());

drop policy if exists kersten_ai_coach on public.kersten_ai_berichten;
create policy kersten_ai_coach on public.kersten_ai_berichten
  for select to authenticated using (rls_is_coach());

-- Nieuwe tabellen krijgen standaard ook insert/update/delete voor authenticated:
-- expliciet intrekken (alleen de service role schrijft).
revoke all on public.kersten_ai_berichten from anon;
revoke insert, update, delete, truncate, references, trigger on public.kersten_ai_berichten from authenticated;
grant select on public.kersten_ai_berichten to authenticated;

notify pgrst, 'reload schema';
