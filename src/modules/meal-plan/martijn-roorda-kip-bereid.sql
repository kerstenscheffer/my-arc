-- Martijn Roorda (call 4 nov 2026), eenmalig, 7 nov 2026. Vervolg op
-- martijn-roorda-gekookt.sql: hij weegt bereid eten, dus ook kipfilet.
--  * Kipfilet (rauw) 11111111-…-111111111111 (109 kcal / 23,0 g eiwit)
--    -> Kipfilet bereid 6b5e6b01-… (158 / 30,9). Gekozen boven Kipfilet (gebakken)
--    (165 / 31,0): bij gelijk eiwit +8% kcal op de kip i.p.v. +12%.
--    Grammen x 23 / 30,9 (eiwit gelijk), afgerond op 5 g.
--  * Kipfilet Plakjes (AH) blijft staan (ander ingredient_id, wordt niet geraakt).
--
-- Raakt geen gedeelde ai_meals of ai_ingredients: maaltijden die al zijn eigen
-- kopie zijn (internal_name klant_martijn_roorda) worden bijgewerkt, gedeelde
-- krijgen een eigen kopie '(aangepast)'. Versie in client_plan_versies.
-- Geen meldingen; assigned_schema_id blijft staan.
-- Stopt met een fout (en verandert dan niets) als het plan intussen anders is.
do $$
declare
  c_plan constant uuid := 'be00075f-a93c-4f98-99e5-4bb3da609987';
  c_client constant uuid := 'd2bc4908-3726-488e-a43f-363c5c0950b7';
  c_kip_rauw constant text := '11111111-1111-1111-1111-111111111111';
  c_kip_bereid constant text := '6b5e6b01-05b6-405a-807a-c81864b7e2ff';
  c_intern constant text := 'klant_martijn_roorda';
  v_oud_ws jsonb; v_ws jsonb;
  v_oud jsonb := '{}'; v_nieuw jsonb := '{}';
  v_dag jsonb; v_ingr jsonb; v_meal jsonb;
  v_kopie ai_meals%rowtype;
  v_klaar jsonb := '{}';   -- oude maaltijd-id -> nieuw slot (zelfde maaltijd = zelfde kopie)
  v_kip int := 0;
  d record; s record; t record;
begin
  select week_structure into v_oud_ws from client_meal_plans
   where id = c_plan and client_id = c_client and is_active for update;
  if v_oud_ws is null then raise exception 'Plan niet gevonden of niet actief'; end if;
  v_ws := v_oud_ws;

  for d in select key, value from jsonb_each(v_oud_ws) where jsonb_typeof(value) = 'object' loop
    v_dag := d.value;

    for s in select key, value from jsonb_each(d.value)
              where jsonb_typeof(value) = 'object' and jsonb_typeof(value -> 'ingredients_list') = 'array'
                and value -> 'ingredients_list' @> jsonb_build_array(jsonb_build_object('ingredient_id', c_kip_rauw)) loop

      select jsonb_agg(case
               when e ->> 'ingredient_id' = c_kip_rauw then (e - 'display') || jsonb_build_object(
                 'ingredient_id', c_kip_bereid, 'unit', 'gram',
                 'amount', round((e ->> 'amount')::numeric * 23 / 30.9 / 5) * 5)
               else e end order by n)
        into v_ingr
        from jsonb_array_elements(s.value -> 'ingredients_list') with ordinality as x(e, n);
      v_kip := v_kip + (select count(*) from jsonb_array_elements(s.value -> 'ingredients_list') e where e ->> 'ingredient_id' = c_kip_rauw);

      if v_klaar ? (s.value ->> 'id') then
        v_meal := v_klaar -> (s.value ->> 'id');
      else
        select * into v_kopie from ai_meals where id = (s.value ->> 'id')::uuid;
        if not found then raise exception 'Maaltijd % (%) staat niet in ai_meals', s.value ->> 'name', s.value ->> 'id'; end if;

        if v_kopie.internal_name = c_intern then
          -- al zijn eigen kopie: bijwerken (trigger rekent macro's opnieuw)
          update ai_meals set ingredients_list = v_ingr, updated_at = now() where id = v_kopie.id;
        else
          -- gedeeld: eigen kopie maken
          v_kopie.id := gen_random_uuid();
          v_kopie.name := v_kopie.name || ' (aangepast)';
          v_kopie.internal_name := c_intern;
          v_kopie.ingredients_list := v_ingr;
          v_kopie.created_at := now();
          v_kopie.updated_at := now();
          insert into ai_meals select (v_kopie).*;
        end if;

        select * into v_kopie from ai_meals where id = v_kopie.id;
        v_meal := s.value || jsonb_build_object(
          'id', v_kopie.id, 'meal_id', v_kopie.id, 'ingredients_list', v_ingr,
          'calories', v_kopie.calories, 'protein', v_kopie.protein, 'carbs', v_kopie.carbs,
          'fat', v_kopie.fat, 'fiber', v_kopie.fiber);
        v_klaar := v_klaar || jsonb_build_object(s.value ->> 'id', v_meal);
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

  -- Verwacht (stand 7 nov 15:00): 4x kip rauw (lunch ma, di, zo, do)
  if v_kip <> 4 then
    raise exception 'Plan wijkt af van de controle: kip rauw %', v_kip;
  end if;

  update client_meal_plans set week_structure = v_ws where id = c_plan;
  insert into client_plan_versies (client_id, soort, plan_id, oud, nieuw)
  values (c_client, 'meal', c_plan, v_oud, v_nieuw);
end $$;

select d.key as dag, d.value -> 'totals' as totals
  from client_meal_plans p, jsonb_each(p.week_structure) d
 where p.id = 'be00075f-a93c-4f98-99e5-4bb3da609987' and jsonb_typeof(d.value) = 'object'
 order by 1;
