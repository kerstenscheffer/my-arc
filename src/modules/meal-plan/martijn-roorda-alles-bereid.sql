-- Martijn Roorda, eenmalig, 7 nov 2026. Vervolg op martijn-roorda-gekookt.sql en
-- martijn-roorda-kip-bereid.sql: zijn vrouw kookt, hij weegt zijn eigen bord af,
-- dus het hele plan in BEREIDE gewichten. Bewuste uitzondering op "altijd rauw",
-- alleen voor deze klant.
--
-- Nieuwe coach-ingrediënten (waarden per 100 g = rauw / opbrengstfactor),
-- gekopieerd van het rauwe ingrediënt (categorie, labels, foto):
--   Rundergehakt mager 5% (gebakken)        van 07d1d7d7 (131/21,4)  factor 0,75
--   Krieltjes (ovengebakken, zonder olie)   van 7810fc8c (77/2,0)    factor 0,85
--   Spinazie (gestoofd)                     van 28875a9b (23/2,9)    factor 0,30
--   Ui (gebakken, zonder olie)              van d9950315 (36/1,2)    factor 0,70
--   Courgette (gebakken, zonder olie)       van e2ac80ec (17/1,2)    factor 0,80
--   Paprika (gebakken, zonder olie)         van 2e40749f (27/1,0)    factor 0,80
-- Bestaat er al een coach-ingrediënt met precies die naam, dan wordt dat gebruikt.
--
-- Omzetten in het plan (grammen x factor, afgerond op 5 g):
--   Rundergehakt rauw -> gebakken (hutspot, bolognese), Krieltjes -> ovengebakken
--   en Spinazie -> gestoofd (Kip met Krieltjes uit de Oven), Ui/Courgette/Paprika
--   -> gebakken (bolognese), Aardappelen -> Aardappels Gekookt 398098db (x 1,0, hutspot).
-- Blijft: wortel en ui in de hutspot (meegekookt, factor 1,0), broccoli, en alles
-- wat koud/rauw of al bereid is.
--
-- Raakt geen gedeelde ai_meals of bestaande ai_ingredients: eigen kopieën
-- (internal_name klant_martijn_roorda) worden bijgewerkt, gedeelde krijgen een
-- kopie '(aangepast)'. Versie in client_plan_versies. Geen meldingen;
-- assigned_schema_id blijft staan. Stopt met een fout (en verandert dan niets)
-- als het plan anders is dan verwacht of een maaltijd >2% kcal/eiwit verschuift.
do $$
declare
  c_plan constant uuid := 'be00075f-a93c-4f98-99e5-4bb3da609987';
  c_client constant uuid := 'd2bc4908-3726-488e-a43f-363c5c0950b7';
  c_intern constant text := 'klant_martijn_roorda';
  v_map jsonb := '{}';     -- oud ingredient_id -> {"id": nieuw, "f": factor}
  v_id uuid;
  v_oud_ws jsonb; v_ws jsonb;
  v_oud jsonb := '{}'; v_nieuw jsonb := '{}';
  v_dag jsonb; v_ingr jsonb; v_meal jsonb;
  v_kopie ai_meals%rowtype;
  v_klaar jsonb := '{}';
  v_vervangen int := 0;
  r record; d record; s record; t record;
begin
  -- 1. Coach-ingrediënten
  for r in select * from (values
      ('07d1d7d7-4437-479c-a23e-dc5410f288a1'::uuid, 'Rundergehakt mager 5% (gebakken)', 'Lean Ground Beef 5% (cooked)', 0.75, 'gebakken',
       'Gebakken gewicht (rauw x 0,75). Weeg na het bakken.'),
      ('7810fc8c-60b3-45bd-b450-ebf95977c6b1'::uuid, 'Krieltjes (ovengebakken, zonder olie)', 'Baby Potatoes (oven-baked, no oil)', 0.85, 'gebakken',
       'Gewicht uit de oven (rauw x 0,85). Olie apart rekenen.'),
      ('28875a9b-bf47-4196-a5b6-d9b993a69932'::uuid, 'Spinazie (gestoofd)', 'Spinach (cooked)', 0.30, 'gekookt',
       'Gestoofd gewicht (rauw x 0,30). Weeg na het slinken.'),
      ('d9950315-c773-4067-b1a5-31f54b8ee7d2'::uuid, 'Ui (gebakken, zonder olie)', 'Onion (fried, no oil)', 0.70, 'gebakken',
       'Gebakken gewicht (rauw x 0,70). Olie apart rekenen.'),
      ('e2ac80ec-cfa8-4a35-8e3d-197c6e309285'::uuid, 'Courgette (gebakken, zonder olie)', 'Zucchini (fried, no oil)', 0.80, 'gebakken',
       'Gebakken gewicht (rauw x 0,80). Olie apart rekenen.'),
      ('2e40749f-9eb8-45b9-95e2-a39bae6b4cd0'::uuid, 'Paprika (gebakken, zonder olie)', 'Bell Pepper (fried, no oil)', 0.80, 'gebakken',
       'Gebakken gewicht (rauw x 0,80). Olie apart rekenen.')
    ) as x(rauw, naam, naam_en, f, bereiding, prep)
  loop
    v_id := null;
    select id into v_id from ai_ingredients where name = r.naam and source = 'coach' limit 1;
    if v_id is null then
      insert into ai_ingredients (
        name, name_en, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
        fiber_per_100g, sugar_per_100g, saturated_fat_per_100g, sodium_per_100g,
        labels, combinability, cost_tier, unit_type, scalable, min_portion_gram, max_portion_gram,
        default_portion_gram, storage_type, shelf_life_days, freezable, prep_instructions, allergens,
        season, image_url, image_source, image_author, image_author_url, image_photo_id,
        source, bereiding, eenheid, gram_per_eenheid)
      select r.naam, r.naam_en, i.category,
        round(i.calories_per_100g / r.f, 1), round(i.protein_per_100g / r.f, 2),
        round(i.carbs_per_100g / r.f, 2), round(i.fat_per_100g / r.f, 2),
        round(coalesce(i.fiber_per_100g, 0) / r.f, 2), round(coalesce(i.sugar_per_100g, 0) / r.f, 2),
        round(coalesce(i.saturated_fat_per_100g, 0) / r.f, 2), round(coalesce(i.sodium_per_100g, 0) / r.f, 3),
        i.labels, i.combinability, i.cost_tier, i.unit_type, i.scalable,
        round(coalesce(i.min_portion_gram, 25) * r.f), round(coalesce(i.max_portion_gram, 500) * r.f),
        round(coalesce(i.default_portion_gram, 100) * r.f), 'fridge', 3, i.freezable, r.prep, i.allergens,
        i.season, i.image_url, i.image_source, i.image_author, i.image_author_url, i.image_photo_id,
        'coach', r.bereiding, 'gram', 100
      from ai_ingredients i where i.id = r.rauw
      returning id into v_id;
      if v_id is null then raise exception 'Rauw ingrediënt % niet gevonden', r.rauw; end if;
    end if;
    v_map := v_map || jsonb_build_object(r.rauw::text, jsonb_build_object('id', v_id, 'f', r.f));
  end loop;
  -- Aardappelen -> Aardappels Gekookt (bestaand, zelfde waarden)
  v_map := v_map || jsonb_build_object('bf3e8276-e8d6-418e-9925-af736b9a3491',
    jsonb_build_object('id', '398098db-a3e2-4cf2-ab8c-a6c1a74fbb0d', 'f', 1.0));

  -- 2. Plan omzetten
  select week_structure into v_oud_ws from client_meal_plans
   where id = c_plan and client_id = c_client and is_active for update;
  if v_oud_ws is null then raise exception 'Plan niet gevonden of niet actief'; end if;
  v_ws := v_oud_ws;

  for d in select key, value from jsonb_each(v_oud_ws) where jsonb_typeof(value) = 'object' loop
    v_dag := d.value;

    for s in select key, value from jsonb_each(d.value)
              where jsonb_typeof(value) = 'object' and jsonb_typeof(value -> 'ingredients_list') = 'array'
                and exists (select 1 from jsonb_array_elements(value -> 'ingredients_list') e
                             where v_map ? (e ->> 'ingredient_id')) loop

      select jsonb_agg(case
               when v_map ? (e ->> 'ingredient_id') then (e - 'display') || jsonb_build_object(
                 'ingredient_id', v_map -> (e ->> 'ingredient_id') ->> 'id', 'unit', 'gram',
                 'amount', round((e ->> 'amount')::numeric * (v_map -> (e ->> 'ingredient_id') ->> 'f')::numeric / 5) * 5)
               else e end order by n)
        into v_ingr
        from jsonb_array_elements(s.value -> 'ingredients_list') with ordinality as x(e, n);
      v_vervangen := v_vervangen + (select count(*) from jsonb_array_elements(s.value -> 'ingredients_list') e
                                     where v_map ? (e ->> 'ingredient_id'));

      if v_klaar ? (s.value ->> 'id') then
        v_meal := s.value || (v_klaar -> (s.value ->> 'id'));
      else
        select * into v_kopie from ai_meals where id = (s.value ->> 'id')::uuid;
        if not found then raise exception 'Maaltijd % (%) staat niet in ai_meals', s.value ->> 'name', s.value ->> 'id'; end if;

        if v_kopie.internal_name = c_intern then
          update ai_meals set ingredients_list = v_ingr, updated_at = now() where id = v_kopie.id;
        else
          v_kopie.id := gen_random_uuid();
          v_kopie.name := v_kopie.name || ' (aangepast)';
          v_kopie.internal_name := c_intern;
          v_kopie.ingredients_list := v_ingr;
          v_kopie.created_at := now();
          v_kopie.updated_at := now();
          insert into ai_meals select (v_kopie).*;          -- trigger rekent macro's uit ingredients_list
        end if;

        select * into v_kopie from ai_meals where id = v_kopie.id;
        if abs(v_kopie.calories - (s.value ->> 'calories')::numeric) > 0.02 * (s.value ->> 'calories')::numeric
           or abs(v_kopie.protein - (s.value ->> 'protein')::numeric) > 0.02 * (s.value ->> 'protein')::numeric then
          raise exception '% verschuift te veel: % kcal / % g eiwit -> % / %', s.value ->> 'name',
            s.value ->> 'calories', s.value ->> 'protein', v_kopie.calories, v_kopie.protein;
        end if;
        v_klaar := v_klaar || jsonb_build_object(s.value ->> 'id', jsonb_build_object(
          'id', v_kopie.id, 'meal_id', v_kopie.id, 'ingredients_list', v_ingr,
          'calories', v_kopie.calories, 'protein', v_kopie.protein, 'carbs', v_kopie.carbs,
          'fat', v_kopie.fat, 'fiber', v_kopie.fiber));
        v_meal := s.value || (v_klaar -> (s.value ->> 'id'));
      end if;

      v_dag := jsonb_set(v_dag, array[s.key], v_meal);
    end loop;

    if v_dag is distinct from d.value then
      if v_dag ? 'totals' then
        select coalesce(sum((value ->> 'calories')::numeric), 0) kcal,
               coalesce(sum((value ->> 'protein')::numeric), 0) protein,
               coalesce(sum((value ->> 'carbs')::numeric), 0) carbs,
               coalesce(sum((value ->> 'fat')::numeric), 0) fat
          into t
          from jsonb_each(v_dag)
         where key <> 'totals' and jsonb_typeof(value) = 'object' and value ? 'calories';
        v_dag := v_dag || jsonb_build_object('totals', jsonb_build_object(
          'kcal', round(t.kcal), 'protein', round(t.protein, 1), 'carbs', round(t.carbs, 1), 'fat', round(t.fat, 1)));
      end if;
      v_ws := jsonb_set(v_ws, array[d.key], v_dag);
      v_oud := v_oud || jsonb_build_object(d.key, d.value);
      v_nieuw := v_nieuw || jsonb_build_object(d.key, v_dag);
    end if;
  end loop;

  -- Verwacht (stand 7 nov 15:30): hutspot vr+za (aardappel, gehakt) = 4,
  -- oven-kip ma+di (krieltjes, spinazie) = 4, bolognese wo (gehakt, ui, courgette, paprika) = 4
  if v_vervangen <> 12 then
    raise exception 'Plan wijkt af van de controle: % ingrediënten te vervangen, verwacht 12', v_vervangen;
  end if;

  update client_meal_plans set week_structure = v_ws where id = c_plan;
  insert into client_plan_versies (client_id, soort, plan_id, oud, nieuw)
  values (c_client, 'meal', c_plan, v_oud, v_nieuw);
end $$;

select d.key as dag, d.value -> 'totals' as totals
  from client_meal_plans p, jsonb_each(p.week_structure) d
 where p.id = 'be00075f-a93c-4f98-99e5-4bb3da609987' and jsonb_typeof(d.value) = 'object'
 order by 1;
