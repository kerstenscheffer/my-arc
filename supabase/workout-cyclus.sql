-- Trainingscyclus per plan (10 nov 2026). Additief: oude app-versies lezen dit niet.
-- {lengte: aantal dagen, volgorde: ['dag1', null, 'dag2', ...]} (null = rustdag).
-- Leeg = 7 dagen, volgorde uit het weekrooster van de klant (clients.workout_schedule).
alter table public.workout_schemas add column if not exists cyclus jsonb;
