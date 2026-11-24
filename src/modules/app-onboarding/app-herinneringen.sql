-- src/modules/app-onboarding/app-herinneringen.sql (24 nov 2026, live gezet)
--
-- Eigen herinneringen voor app-gebruikers (clients.app_abonnee). Ze lopen via het
-- bestaande meldingensysteem (notification_schedules + run_notification_schedules,
-- met push), in een nieuwe doelgroep 'app':
--   - schema's met audience 'app' gaan alleen naar app-accounts;
--   - alle andere schema's (Kerstens coach-meldingen) nooit naar app-accounts.
-- In run_notification_schedules en preview_notification_schedule is de doelgroep:
--   where cl.trainer_id = s.coach_id and (s.audience = 'app') = coalesce(cl.app_abonnee, false)
--     and (s.audience = 'all' or s.audience = 'app' or ...)
-- (gedaan met een replace op de bestaande functiedefinitie).

-- De check op audience is uitgebreid met 'app' (alleen erbij; oude waarden blijven geldig).
alter table public.notification_schedules drop constraint if exists notification_schedules_audience_check;
alter table public.notification_schedules add constraint notification_schedules_audience_check
  check (audience = any (array['active', 'all', 'selected', 'app']));

-- De vier herinneringen (dagen: 1 = maandag ... 6 = zaterdag, 7 = zondag).
insert into notification_schedules (coach_id, name, check_type, check_days, run_at, timezone, days_of_week, title, message, page_context, priority, audience, cooldown_hours, is_active, target) values
 ('5a0135ac-3188-499d-8682-ed6a179e5541', 'App: wegen', 'weight_not_logged', 3, '08:00', 'Europe/Amsterdam', array[1,3,5], 'Even wegen?', 'Goedemorgen {naam}! Stap even op de weegschaal. Dan zie je hoe het gaat.', 'tracking', 'normal', 'app', 40, true, 'client'),
 ('5a0135ac-3188-499d-8682-ed6a179e5541', 'App: trainen', 'workout_not_logged', 3, '17:00', 'Europe/Amsterdam', array[1,2,3,4,5,6], 'Tijd om te trainen!', 'Hé {naam}, je hebt al een paar dagen niet getraind. Je schema staat klaar. Kom op!', 'workout', 'normal', 'app', 70, true, 'client'),
 ('5a0135ac-3188-499d-8682-ed6a179e5541', 'App: eten loggen', 'meal_not_logged', 1, '19:30', 'Europe/Amsterdam', array[1,2,3,4,5,6,7], 'Vergeet je eten niet', 'Log even wat je vandaag hebt gegeten, {naam}. Het kost maar een minuut.', 'meal', 'normal', 'app', 22, true, 'client'),
 ('5a0135ac-3188-499d-8682-ed6a179e5541', 'App: progressiefoto', 'photo_not_uploaded', 14, '11:00', 'Europe/Amsterdam', array[6], 'Tijd voor een foto', 'Maak even een nieuwe foto, {naam}. Over een paar weken zie je het verschil!', 'tracking', 'normal', 'app', 312, true, 'client');
