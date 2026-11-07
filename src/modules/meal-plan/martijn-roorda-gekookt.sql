-- Martijn Roorda (call 4 nov 2026), eenmalig, 7 nov 2026.
--  * Zilvervliesrijst en volkoren pasta GEKOOKT gewogen in plaats van ongekookt
--    (grammen x 370/123 en x 348/140, afgerond op 5 g). Bewuste uitzondering op
--    "altijd rauw", alleen voor deze klant.
--  * 'Cottage cheese met cracker' (avond) -> eiwitshake met zijn eigen Whey vanille.
--  * Stappendoel 8000 (clients.step_goal, dat leest StappenService.haalDoel).
--
-- Raakt geen gedeelde ai_meals of ai_ingredients: per gewijzigde maaltijd een
-- eigen kopie in ai_meals, zoals de Kopie-knop in MealEditModal, met een eigen
-- internal_name zodat de kopie niet in een wissel-/dagmenugroep valt.
-- De wijziging komt als versie in client_plan_versies (terugzetten via
-- KlantPlanTerugzetten). Geen meldingen; assigned_schema_id blijft staan.
-- Stopt met een fout (en verandert dan niets) als het plan intussen anders is.
do $$
declare
  c_plan constant uuid := 'be00075f-a93c-4f98-99e5-4bb3da609987';
  c_client constant uuid := 'd2bc4908-3726-488e-a43f-363c5c0950b7';
  c_rijst_rauw constant text := 'cb041c9c-dd96-452d-bf56-bf17fb00c6c1';
  c_rijst_gekookt constant text := '50abb260-c534-4043-89bd-f4f64d2c8e3f';
  c_pasta_rauw constant text := '6e6242de-3bf7-4c6b-a329-e2075c52ee08';
  c_pasta_gekookt constant text := '5363e501-e732-49f2-9b6a-e9d8a2ed522c';
  c_cottage constant text := '35172aeb-7e2d-483a-a430-27c42330ac8e';
  c_shake_basis constant uuid := '4e965635-02aa-40ea-b80a-bcdfc530d451';
  c_intern constant text := 'klant_martijn_roorda';
  v_oud_ws jsonb; v_ws jsonb;
  v_oud jsonb := '{}'; v_nieuw jsonb := '{}';
  v_dag jsonb; v_ingr jsonb; v_meal jsonb;
  v_kopie ai_meals%rowtype;
  v_kopieen jsonb := '{}';   -- oude maaltijd-id -> nieuw slot (zelfde maaltijd = zelfde kopie)
  v_rijst int := 0; v_pasta int := 0; v_shake int := 0;
  d record; s record; t record;
begin
  select week_structure into v_oud_ws from client_meal_plans
   where id = c_plan and client_id = c_client and is_active for update;
  if v_oud_ws is null then raise exception 'Plan niet gevonden of niet actief'; end if;
  v_ws := v_oud_ws;

  for d in select key, value from jsonb_each(v_oud_ws) where jsonb_typeof(value) = 'object' loop
    v_dag := d.value;

    for s in select key, value from jsonb_each(d.value)
              where jsonb_typeof(value) = 'object' and jsonb_typeof(value -> 'ingredients_list') = 'array' loop
      v_meal := null;

      -- Rijst / pasta: ongekookt -> gekookt
      if s.value -> 'ingredients_list' @> jsonb_build_array(jsonb_build_object('ingredient_id', c_rijst_rauw))
         or s.value -> 'ingredients_list' @> jsonb_build_array(jsonb_build_object('ingredient_id', c_pasta_rauw)) then
        select jsonb_agg(case
                 when e ->> 'ingredient_id' = c_rijst_rauw then (e - 'display') || jsonb_build_object(
                   'ingredient_id', c_rijst_gekookt, 'unit', 'gram',
                   'amount', round((e ->> 'amount')::numeric * 370 / 123 / 5) * 5)
                 when e ->> 'ingredient_id' = c_pasta_rauw then (e - 'display') || jsonb_build_object(
                   'ingredient_id', c_pasta_gekookt, 'unit', 'gram',
                   'amount', round((e ->> 'amount')::numeric * 348 / 140 / 5) * 5)
                 else e end order by n)
          into v_ingr
          from jsonb_array_elements(s.value -> 'ingredients_list') with ordinality as x(e, n);
        v_rijst := v_rijst + (select count(*) from jsonb_array_elements(s.value -> 'ingredients_list') e where e ->> 'ingredient_id' = c_rijst_rauw);
        v_pasta := v_pasta + (select count(*) from jsonb_array_elements(s.value -> 'ingredients_list') e where e ->> 'ingredient_id' = c_pasta_rauw);

        if v_kopieen ? (s.value ->> 'id') then
          v_meal := v_kopieen -> (s.value ->> 'id');
        else
          select * into v_kopie from ai_meals where id = (s.value ->> 'id')::uuid;
          if not found then raise exception 'Maaltijd % (%) staat niet in ai_meals', s.value ->> 'name', s.value ->> 'id'; end if;
          v_kopie.id := gen_random_uuid();
          v_kopie.name := v_kopie.name || ' (aangepast)';
          v_kopie.internal_name := c_intern;
          v_kopie.ingredients_list := v_ingr;
          v_kopie.created_at := now();
          v_kopie.updated_at := now();
          insert into ai_meals select (v_kopie).*;          -- trigger rekent macro's uit ingredients_list
          select * into v_kopie from ai_meals where id = v_kopie.id;
          v_meal := s.value || jsonb_build_object(
            'id', v_kopie.id, 'meal_id', v_kopie.id, 'ingredients_list', v_ingr,
            'calories', v_kopie.calories, 'protein', v_kopie.protein, 'carbs', v_kopie.carbs,
            'fat', v_kopie.fat, 'fiber', v_kopie.fiber);
          v_kopieen := v_kopieen || jsonb_build_object(s.value ->> 'id', v_meal);
        end if;

      -- Cottage cheese met cracker -> eiwitshake (avond)
      elsif coalesce(s.value ->> 'meal_id', s.value ->> 'id') = c_cottage or s.value ->> 'id' = c_cottage then
        if not (v_kopieen ? 'shake') then
          select * into v_kopie from ai_meals where id = c_shake_basis;
          if not found then raise exception 'Shake-basis % niet gevonden', c_shake_basis; end if;
          v_kopie.id := gen_random_uuid();
          v_kopie.name := 'Eiwitshake met banaan (aangepast)';
          v_kopie.internal_name := c_intern;
          v_kopie.ingredients_list := '[
            {"unit": "gram", "amount": 20,  "display": "Whey vanille",   "ingredient_id": "07c40aa5-7d12-4c40-966a-9fab6cbf887f"},
            {"unit": "gram", "amount": 250, "display": "Halfvolle melk", "ingredient_id": "a814c2f6-cc49-4653-b278-5aa1a4c331d5"},
            {"unit": "gram", "amount": 120, "display": "Banaan",         "ingredient_id": "11111111-1111-1111-1111-111111111124"}
          ]'::jsonb;
          v_kopie.created_at := now();
          v_kopie.updated_at := now();
          insert into ai_meals select (v_kopie).*;
          select * into v_kopie from ai_meals where id = v_kopie.id;
          v_kopieen := v_kopieen || jsonb_build_object('shake', to_jsonb(v_kopie) || jsonb_build_object(
            'name', 'Eiwitshake met banaan', 'meal_name', 'Eiwitshake met banaan', 'meal_id', v_kopie.id,
            'original_calories', v_kopie.calories, 'original_protein', v_kopie.protein,
            'original_carbs', v_kopie.carbs, 'original_fat', v_kopie.fat));
        end if;
        v_meal := (v_kopieen -> 'shake') || jsonb_build_object(
          'timing', coalesce(s.value ->> 'timing', '20:00'),
          'display_label', coalesce(s.value ->> 'display_label', 'Avondsnack'));
        v_shake := v_shake + 1;
      end if;

      if v_meal is not null then
        v_dag := jsonb_set(v_dag, array[s.key], v_meal);
      end if;
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

  -- Verwacht (stand 7 nov): 1x rijst (zondag), 2x pasta (woensdag, donderdag), 1x cottage cheese (zondag)
  if v_rijst <> 1 or v_pasta <> 2 or v_shake <> 1 then
    raise exception 'Plan wijkt af van de controle: rijst %, pasta %, cottage %', v_rijst, v_pasta, v_shake;
  end if;

  update client_meal_plans set week_structure = v_ws where id = c_plan;
  insert into client_plan_versies (client_id, soort, plan_id, oud, nieuw)
  values (c_client, 'meal', c_plan, v_oud, v_nieuw);
end $$;

update public.clients set step_goal = 8000
 where id = 'd2bc4908-3726-488e-a43f-363c5c0950b7';

select d.key as dag, d.value -> 'totals' as totals
  from client_meal_plans p, jsonb_each(p.week_structure) d
 where p.id = 'be00075f-a93c-4f98-99e5-4bb3da609987' and jsonb_typeof(d.value) = 'object'
 order by 1;
