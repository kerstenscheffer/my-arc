-- src/modules/productivity/kwadrant.sql
--
-- Eisenhower-matrix (Business OS → Prioriteiten, 11 nov 2026).
-- Kwadrant per taak: 'doen' | 'plannen' | 'gino' | 'weg' | 'uit' (uitgepland). Leeg = nog niet
-- gesleept; de matrix geeft dan een voorlopige plek zonder op te slaan.
-- Alleen toevoegen: oude app-versies sturen deze kolom niet mee en blijven werken.

alter table public.productivity_tasks
  add column if not exists kwadrant text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'productivity_tasks_kwadrant_check') then
    alter table public.productivity_tasks
      add constraint productivity_tasks_kwadrant_check
      check (kwadrant is null or kwadrant in ('doen', 'plannen', 'gino', 'weg', 'uit'));
  end if;
end $$;

-- Controle:
-- select column_name, data_type, is_nullable from information_schema.columns
-- where table_schema = 'public' and table_name = 'productivity_tasks' and column_name = 'kwadrant';

-- 11 nov 2026: 'uit' toegevoegd (live gezet met drop + add constraint).

-- 12 nov 2026: dagdeel binnen "Nu doen" (live gezet).
alter table public.productivity_tasks add column if not exists dagdeel text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'productivity_tasks_dagdeel_check') then
    alter table public.productivity_tasks
      add constraint productivity_tasks_dagdeel_check
      check (dagdeel is null or dagdeel in ('ochtend', 'middag', 'avond'));
  end if;
end $$;

-- 12 nov 2026: Gino-opdracht per taak (live gezet). Zie scripts/ginotaak.mjs.
alter table public.productivity_tasks add column if not exists gino_opdracht text;
alter table public.productivity_tasks add column if not exists gino_status text;   -- wacht | bezig | klaar | mislukt
alter table public.productivity_tasks add column if not exists gino_resultaat text;
alter table public.productivity_tasks add column if not exists gino_klaar_at timestamptz;

-- 12 nov 2026: sparren met Gino per taak (live gezet).
alter table public.productivity_tasks add column if not exists gino_gesprek jsonb;   -- [{ van: 'kersten'|'gino', tekst, at }]
alter table public.productivity_tasks drop constraint if exists productivity_tasks_gino_status_check;
alter table public.productivity_tasks add constraint productivity_tasks_gino_status_check
  check (gino_status is null or gino_status in ('wacht', 'bezig', 'klaar', 'mislukt', 'vraag'));
