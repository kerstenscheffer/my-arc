-- Blokken uit de week halen — kolom `hidden` op client_agenda_blocks.
-- Toegepast als migratie `client_agenda_blocks_hidden` (18 sep 2026).
--
-- Waarom: slaap, werk en training komen voor veel klanten uit het
-- intake-formulier en hebben dus geen eigen rij. Er valt niets te verwijderen
-- als zo'n blok niet meer klopt. Een rij met hidden = true ís die
-- verwijdering: de service telt hem mee voor "er is al een rij" (waardoor de
-- placeholder uit de intake niet terugkomt) maar toont hem niet.
--
-- Zie ClientAgendaService.verbergBlok() en de vier `if (row.hidden) return`
-- plekken in loadWeek.

alter table public.client_agenda_blocks
  add column if not exists hidden boolean not null default false;

comment on column public.client_agenda_blocks.hidden is
  'true = dit blok staat niet in de week; onderdrukt ook de intake-placeholder van die dag en dat type';
