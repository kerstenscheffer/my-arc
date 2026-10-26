-- src/modules/meal-plan/components/food-log/kipfilet_rauw.sql
--
-- Kipfilet terug naar RAUW (26 okt 2026). Draait de keuze in
-- bereiding_labels.sql terug: daar werd de naam aangepast aan de waarden
-- ("Kipfilet (gebakken)"), terwijl Kersten altijd met rauwe grammen werkt.
-- Nu zijn de waarden aangepast aan rauw wegen.
--
--   11111111-…-111  "Kipfilet (rauw)"      109 kcal · 23 g eiwit · 1,8 g vet
--   nieuwe rij      "Kipfilet (gebakken)"  165 kcal · 31 g eiwit · 3,6 g vet
--
-- Grammen in maaltijden en plannen zijn NIET aangepast (keuze Kersten): de
-- macro's zakken dus ~0,56 kcal / 0,08 g eiwit / 0,018 g vet per gram kip.
--   - ai_meals (125): via trigger ai_ingredients_propagate_macros.
--   - Kopieën in client_meal_plans (week_structure + pre_workout_meal),
--     meal_plan_templates en client_day_overrides: maaltijd-macro's,
--     original_* naar verhouding, en de dagtotalen.
--   - Dubbele rij "Kipfilet (rauw)" da764fff (25 okt) omgehangen naar 111… en
--     verwijderd.
--
-- Uitgevoerd via execute_sql in één transactie. Backups:
--   backup_kip_20261026_{ai_ingredients,ai_meals,client_meal_plans,
--                         meal_plan_templates,client_day_overrides}
-- Terugdraaien = de kolommen uit die tabellen terugzetten.

update ai_ingredients set name = 'Kipfilet (rauw)', bereiding = 'rauw',
  calories_per_100g = 109, protein_per_100g = 23, carbs_per_100g = 0, fat_per_100g = 1.8
where id = '11111111-1111-1111-1111-111111111111';

-- (plus: pg_temp.kip_maaltijd / kip_dag / kip_week voor de plan-kopieën,
--  insert van "Kipfilet (gebakken)", synoniemen 'gebakken kip(filet)' → 'kipfilet')
