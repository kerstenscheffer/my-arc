-- GEDRAAID op 19 nov 2026 via de Supabase-koppeling (execute_sql): het plan
-- staat op 3150 / 170 / 430 / 85. Niet opnieuw nodig.
--
-- Eenmalig, 19 nov 2026. Alleen het testaccount ks10k (Kersten Scheffer,
-- clients.id 7e176d2d-a85b-4132-a1e3-59b1ddd9816d).
--
-- Zijn actieve plan kwam op 18 nov uit template 'Man | 2200 | Vast' via Laden
-- in de Plan Analyzer. Dat pad stuurde geen macro's mee, dus vulde de database
-- de kolom-defaults in (2000 / 150 / 200 / 67). Hier terug naar zijn doelen.
-- De code is hersteld in plan-analyzer/kopieMacros.js.
--
-- Raakt alleen de vier macro-kolommen: de maaltijden (week_structure) blijven
-- staan en de trigger trg_klant_planwijziging (alleen op week_structure en
-- pre_workout_meal) gaat niet af. De voorwaarde op de oude waarden maakt het
-- veilig om twee keer te draaien.
update public.client_meal_plans
   set daily_calories = 3150, daily_protein = 170, daily_carbs = 430, daily_fat = 85
 where id = '8b760e9c-690a-47d2-8a5e-a3c9fe697939'
   and client_id = '7e176d2d-a85b-4132-a1e3-59b1ddd9816d'
   and daily_calories = 2000 and daily_protein = 150 and daily_carbs = 200 and daily_fat = 67
returning id, template_name, is_active, daily_calories, daily_protein, daily_carbs, daily_fat;
