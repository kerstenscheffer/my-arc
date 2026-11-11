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
