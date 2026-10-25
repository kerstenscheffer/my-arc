-- src/modules/meal-plan/components/food-log/bereiding_labels.sql
--
-- Rauw of gekookt in de NAAM van basisproducten (25 okt 2026). De naam
-- ziet de klant overal (plan, recept, zoeker, boodschappen); plannen
-- verwijzen via ingredient_id, dus een nieuwe naam staat meteen in elk plan.
-- Macro's blijven gelijk.
--
-- Aanleiding: "Kip - filet (vers)" (125 maaltijden, 36 actieve plannen,
-- gemiddeld 148 g) had de waarden van GEBAKKEN kip (165 kcal, 31 g eiwit),
-- maar heette "vers". Wie 148 g rauw afwoog at ~85 kcal en ~12 g eiwit
-- minder dan het plan zei. Nu: "Kipfilet (gebakken)", gebakken wegen.
-- (Uitgevoerd via execute_sql; apply_migration gaf een sessiefout.)

-- Dubbele rij die ik eerder vandaag maakte (ongebruikt): de bestaande kip
-- is nu de gebakken variant.
delete from public.ai_ingredients
where id = '259bc3f6-d8e6-4252-8176-771276377b9c' and name = 'Kipfilet gebakken';

update public.ai_ingredients set name = 'Kipfilet (gebakken)', bereiding = 'gebakken'
where id = '11111111-1111-1111-1111-111111111111';

-- Nog geen label, wel duidelijk rauw (waarden = rauw) of gekookt.
update public.ai_ingredients set bereiding = 'rauw'
where id in ('3ab7866c-195b-40da-a18f-b78de20619ef',  -- Zalmfilet 208
             'aacbb6ce-00fd-4c67-a696-2f1e0fd61db0',  -- Magere runderreepjes 127
             '43fc0a9c-fad7-49ef-b688-8deaff9c2aec'); -- Mager rundergehakt (5% vet) 134
update public.ai_ingredients set bereiding = 'gekookt'
where id in ('143ab789-5117-4e0a-9fc5-60ac404df9af',  -- Garnalen 99 / 24 g eiwit
             'ef1ef208-a3f8-463a-b7ab-927f895693b8'); -- Garnalen (gepeld)

-- Label in de naam waar het er nog niet staat:
--   "Basmati Rijst"          -> "Basmati Rijst (ongekookt)"
--   "Rundergehakt (5% vet)"  -> "Rundergehakt (5% vet, rauw)"
update public.ai_ingredients
set name = case
  when name ~ '\)\s*$' then regexp_replace(name, '\)\s*$', ', ' || bereiding || ')')
  else name || ' (' || bereiding || ')' end
where barcode is null
  and bereiding is not null
  and name !~* '(ongekookt|gekookt|gebakken|rauw|droog)';
