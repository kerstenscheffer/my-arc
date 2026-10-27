-- src/modules/meal-plan/components/food-log/eigen-maaltijden-sectie.sql
--
-- Eigen maaltijden een moment geven (27 okt 2026). 81 van ~106 hadden geen
-- section en stonden in het wisselscherm onder elk moment.
--
-- Waarden: ontbijt / lunch / diner / snack / pre_workout. Bewust 'snack'
-- (enkelvoud): de app t/m 15 okt kent in het wisselscherm alleen 'snack', en
-- MyMealsTab (oud en nieuw) leest zowel 'snack' als 'snacks'.
-- Backup: backup_custom_sectie_20261027 (id, section).

with zonder as (select id, client_id, name from ai_custom_meals where is_active and section is null),
logs as (
  select z.id, case lower(c.meal_type) when 'breakfast' then 'ontbijt' when 'lunch' then 'lunch' when 'dinner' then 'diner'
    when 'pre_workout' then 'pre_workout' when 'snack' then 'snack' when 'post_workout' then 'snack' when 'avondsnack' then 'snack' end sectie,
    count(*) n
  from zonder z join consumed_meals c on c.client_id = z.client_id
    and (c.meal_id = z.id or lower(trim(c.meal_name)) = lower(trim(z.name)))
  group by 1, 2),
keuze as (select distinct on (id) id, sectie from logs where sectie is not null order by id, n desc, sectie)
update ai_custom_meals a set section = k.sectie from keuze k where a.id = k.id and a.section is null;

update ai_custom_meals set section = 'snack' where section = 'snacks';
