-- Toegepast op 12 sep 2026. Drie eigen maaltijden stonden opgeslagen als kale
-- verwijzingen ({ingredient_id, amount, unit}) omdat ze met de ster uit het
-- wisselvenster waren overgenomen uit ai_meals. Het maaltijd-scherm rekent
-- zijn totalen uít de ingrediënten, dus die maaltijden toonden 0 kcal en
-- logden 0 macro's.
--
-- Hier uitgeschreven naar naam + macro's per hoeveelheid, en de macro's van
-- de maaltijd zelf meteen kloppend gezet. Alleen rijen waarvan élk ingrediënt
-- in ai_ingredients gevonden werd (uit.n = uit.gevonden).
--
-- Resultaat: Proteïne Smoothie met Banaan 0 → 373 kcal, Griekse Yoghurt 0%
-- met Fruit 285 (ongewijzigd, wel leesbaar), Kip rijst aardappel 764 → 768.
with uit as (
  select m.id,
         jsonb_agg(jsonb_build_object(
           'name', i.name,
           'amount', (e->>'amount')::numeric,
           'unit', coalesce(e->>'unit','gram'),
           'calories', round(i.calories_per_100g * (e->>'amount')::numeric / 100),
           'protein', round(i.protein_per_100g * (e->>'amount')::numeric / 100, 1),
           'carbs', round(i.carbs_per_100g * (e->>'amount')::numeric / 100, 1),
           'fat', round(i.fat_per_100g * (e->>'amount')::numeric / 100, 1)
         ) order by (e->>'amount')::numeric desc) as lijst,
         round(sum(i.calories_per_100g * (e->>'amount')::numeric / 100)) as kcal,
         round(sum(i.protein_per_100g * (e->>'amount')::numeric / 100), 1) as eiwit,
         round(sum(i.carbs_per_100g * (e->>'amount')::numeric / 100), 1) as koolh,
         round(sum(i.fat_per_100g * (e->>'amount')::numeric / 100), 1) as vet,
         count(*) as n, count(i.id) as gevonden
  from ai_custom_meals m
  cross join lateral jsonb_array_elements(m.ingredients_list) e
  left join ai_ingredients i on i.id = (e->>'ingredient_id')::uuid
  where m.is_active
    and m.ingredients_list is not null
    and jsonb_array_length(m.ingredients_list) > 0
    and not ((m.ingredients_list->0) ? 'calories')
  group by m.id
)
update ai_custom_meals m
set ingredients_list = uit.lijst,
    calories = uit.kcal, protein = uit.eiwit, carbs = uit.koolh, fat = uit.vet,
    updated_at = now()
from uit
where m.id = uit.id and uit.n = uit.gevonden;
