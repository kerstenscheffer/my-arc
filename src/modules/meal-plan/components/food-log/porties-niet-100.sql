-- src/modules/meal-plan/components/food-log/porties-niet-100.sql
--
-- "100 porties" bij bewerken (27 okt 2026). FoodLogModal schreef amount 100
-- als een log geen aantal meegaf (eigen maaltijd, snel invoeren); met
-- per_unit 'portion' betekent dat 100 porties. Macro's waren wel goed (het
-- bewerkscherm schaalt lineair: kcal horen bij het opgeslagen aantal).
--
-- 1. Code: amount ?? (per100g ? 100 : 1).
-- 2. Data: 385 rijen van 100 naar 1. Backup: backup_porties100_20261027.
-- 3. Trigger voor oude app-versies die nog 100 sturen.

update consumed_meals c set amount = 1 from public.backup_porties100_20261027 b
where b.id = c.id and c.per_unit = 'portion' and c.amount = 100;

create or replace function public.porties_niet_100() returns trigger language plpgsql as $$
begin
  if new.per_unit = 'portion' and new.amount = 100 then new.amount := 1; end if;
  return new;
end $$;
create trigger consumed_meals_porties_niet_100 before insert or update of amount, per_unit on public.consumed_meals
for each row execute function public.porties_niet_100();
