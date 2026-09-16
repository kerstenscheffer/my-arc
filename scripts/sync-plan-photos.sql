-- scripts/sync-plan-photos.sql
-- Zet de foto's uit ai_meals / ai_custom_meals door naar de maaltijd-snapshots
-- in client_meal_plans.week_structure en meal_plan_templates.week_structure.
-- Zonder deze stap zien klanten in hun opgeslagen plan nog het lege vak, ook
-- als de maaltijd zelf inmiddels een image_url heeft.
--
-- Draaien in de Supabase SQL-editor, ná scripts/unsplash-meal-photos.mjs.
-- Blok 1 t/m 5 in één keer uitvoeren; blok 0 laat eerst zien wat er te doen is.

-- ---------------------------------------------------------------- 0. tellen
-- (informatief — verandert niets)
with meals as (
  select mm.value as meal
  from client_meal_plans p,
       lateral jsonb_each(p.week_structure) d,
       lateral jsonb_each(case when jsonb_typeof(d.value)='object' then d.value else '{}'::jsonb end) slot,
       lateral (
         select slot.value as value where jsonb_typeof(slot.value)='object'
         union all
         select a.value from jsonb_array_elements(case when jsonb_typeof(slot.value)='array' then slot.value else '[]'::jsonb end) a
       ) mm
)
select count(*) filter (where meal ? 'meal_id')                                as maaltijden_in_plannen,
       count(*) filter (where coalesce(meal->>'image_url','') <> '')           as heeft_al_foto,
       count(*) filter (where coalesce(meal->>'image_url','') =  '')           as zonder_foto
from meals;

-- ------------------------------------------------------------- 1. back-ups
-- Herbruikbaar: de back-up bevat altijd de stand van vlak vóór deze run.
create table if not exists client_meal_plans_backup_photos as
  select * from client_meal_plans where false;
truncate client_meal_plans_backup_photos;
insert into client_meal_plans_backup_photos select * from client_meal_plans;

create table if not exists meal_plan_templates_backup_photos as
  select * from meal_plan_templates where false;
truncate meal_plan_templates_backup_photos;
insert into meal_plan_templates_backup_photos select * from meal_plan_templates;

-- ------------------------------------------------------------- 2. functie
-- Loopt recursief door de jsonb en vult image_url op elk maaltijd-object dat
-- er nog geen heeft. Eerst op meal_id/id, anders op naam. Overschrijft nooit
-- een bestaande foto.
create or replace function public.fill_meal_images(node jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  result jsonb := node;
  k      text;
  idx    int;
  arr    jsonb;
  mid    uuid;
  img    text;
  nm     text;
begin
  if node is null then
    return node;
  end if;

  if jsonb_typeof(node) = 'array' then
    arr := '[]'::jsonb;
    for idx in 0 .. jsonb_array_length(node) - 1 loop
      arr := arr || jsonb_build_array(public.fill_meal_images(node -> idx));
    end loop;
    return arr;
  end if;

  if jsonb_typeof(node) <> 'object' then
    return node;
  end if;

  -- is dit een maaltijd-snapshot zonder foto?
  if (node ? 'meal_id' or (node ? 'name' and node ? 'calories'))
     and coalesce(node->>'image_url','') = '' then
    begin
      mid := nullif(coalesce(node->>'meal_id', node->>'id'), '')::uuid;
    exception when others then
      mid := null;
    end;

    img := null;
    if mid is not null then
      select m.image_url into img from ai_meals m where m.id = mid and coalesce(m.image_url,'') <> '';
      if img is null then
        select c.image_url into img from ai_custom_meals c where c.id = mid and coalesce(c.image_url,'') <> '';
      end if;
    end if;

    if img is null then
      nm := lower(btrim(coalesce(node->>'name', node->>'meal_name', '')));
      if nm <> '' then
        select m.image_url into img
        from ai_meals m
        where lower(btrim(m.name)) = nm and coalesce(m.image_url,'') <> ''
        limit 1;
      end if;
    end if;

    if img is not null then
      result := jsonb_set(result, '{image_url}', to_jsonb(img), true);
    end if;
  end if;

  -- en dan de kinderen
  for k in select jsonb_object_keys(node) loop
    if jsonb_typeof(node -> k) in ('object','array') then
      result := jsonb_set(result, array[k], public.fill_meal_images(node -> k), true);
    end if;
  end loop;

  return result;
end;
$$;

-- --------------------------------------------------------- 3. klantplannen
update client_meal_plans
   set week_structure = public.fill_meal_images(week_structure),
       updated_at     = now()
 where week_structure is not null;

-- ----------------------------------------------------------- 4. templates
update meal_plan_templates
   set week_structure = public.fill_meal_images(week_structure),
       updated_at     = now()
 where week_structure is not null;

-- ------------------------------------------------------------ 5. controle
with meals as (
  select mm.value as meal
  from client_meal_plans p,
       lateral jsonb_each(p.week_structure) d,
       lateral jsonb_each(case when jsonb_typeof(d.value)='object' then d.value else '{}'::jsonb end) slot,
       lateral (
         select slot.value as value where jsonb_typeof(slot.value)='object'
         union all
         select a.value from jsonb_array_elements(case when jsonb_typeof(slot.value)='array' then slot.value else '[]'::jsonb end) a
       ) mm
)
select count(*) filter (where meal ? 'meal_id')                      as maaltijden_in_plannen,
       count(*) filter (where coalesce(meal->>'image_url','') <> '') as heeft_nu_foto
from meals;

-- Terugdraaien kan met de back-uptabellen:
--   update client_meal_plans p set week_structure = b.week_structure
--     from client_meal_plans_backup_photos b where b.id = p.id;
