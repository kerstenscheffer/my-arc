-- src/modules/meal-plan/components/food-log/gerechten.sql
--
-- Standaardgerechten en ketens (25 okt 2026). Wat klanten via "snel
-- invoeren" handmatig typten was bijna altijd een gerecht of uit eten
-- ("Pasta bolo", "Broodje gezond", "Kaas pannenkoek", "Mixed grill
-- restaurant"): dat zat niet in de zoeker.
--
-- Waarden per 100 g, schattingen op basis van NEVO-gerechten en de
-- voedingswaardes die de ketens zelf publiceren (NL-kaart, afgerond).
-- eenheid 'stuk' = één gangbare portie, zodat de klant "1 stuk" kiest.
-- labels ["gerecht"] / ["keten"] om ze later apart te kunnen tonen.
-- Ketennamen zonder apostrof ("McDonalds"): de zoeker haalt die ook uit
-- de zoekterm, dus "McDonald's" vindt ze.

insert into public.ai_ingredients
  (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
   fiber_per_100g, sugar_per_100g, eenheid, gram_per_eenheid, default_portion_gram,
   min_portion_gram, max_portion_gram, labels, source, bereiding)
select v.name, 'other', v.k, v.p, v.c, v.f, v.vez, 0, 'stuk', v.por, v.por,
       greatest(10, round(v.por / 4)), v.por * 3, to_jsonb(array[v.soort]), 'coach', null
from (values
  -- Brood en broodjes
  ('Broodje gezond',                 190, 10,  20, 7.5,  2.0, 200, 'gerecht'),
  ('Broodje kaas',                   280, 12,  32, 11,   2.0, 110, 'gerecht'),
  ('Broodje ham kaas',               265, 14,  28, 10.5, 2.0, 130, 'gerecht'),
  ('Broodje kroket',                 255, 8,   30, 11,   1.5, 150, 'gerecht'),
  ('Broodje frikandel',              260, 9,   28, 12,   1.5, 140, 'gerecht'),
  ('Broodje kipfilet',               210, 15,  28, 4,    2.0, 130, 'gerecht'),
  ('Broodje tonijnsalade',           250, 11,  26, 11,   1.5, 150, 'gerecht'),
  ('Broodje filet americain',        240, 11,  27, 9.5,  1.5, 140, 'gerecht'),
  ('Broodje carpaccio',              220, 13,  24, 8,    1.5, 170, 'gerecht'),
  ('Broodje shoarma',                230, 13,  22, 10,   1.5, 250, 'gerecht'),
  ('Broodje doner',                  240, 12,  23, 11,   1.5, 280, 'gerecht'),
  ('Tosti kaas',                     290, 12,  28, 14,   1.5, 110, 'gerecht'),
  ('Croissant ham kaas',             300, 12,  25, 17,   1.0, 130, 'gerecht'),
  ('Saucijzenbroodje',               330, 9,   28, 20,   1.0, 90,  'gerecht'),
  ('Worstenbroodje',                 300, 9,   30, 16,   1.0, 100, 'gerecht'),
  -- Warme maaltijden
  ('Pasta bolognese',                135, 7,   17, 4,    1.5, 450, 'gerecht'),
  ('Pasta carbonara',                190, 8,   20, 9,    1.0, 400, 'gerecht'),
  ('Pasta pesto',                    190, 6,   24, 8,    1.5, 350, 'gerecht'),
  ('Lasagne',                        140, 7.5, 12, 7,    1.0, 400, 'gerecht'),
  ('Macaroni met ham en kaas',       155, 7,   18, 6,    1.0, 400, 'gerecht'),
  ('Nasi goreng',                    160, 6,   22, 5.5,  1.5, 400, 'gerecht'),
  ('Bami goreng',                    150, 6,   20, 5,    1.5, 400, 'gerecht'),
  ('Kipcurry met rijst',             140, 8,   18, 4,    1.0, 450, 'gerecht'),
  ('Chili con carne',                105, 7,   9,  4.5,  3.0, 400, 'gerecht'),
  ('Stamppot boerenkool met rookworst', 140, 5.5, 10, 8.5, 2.5, 450, 'gerecht'),
  ('Stamppot',                       110, 4,   11, 5.5,  2.0, 450, 'gerecht'),
  ('Hutspot',                        85,  1.8, 11, 3.5,  2.0, 400, 'gerecht'),
  ('Aardappelen groente en vlees',   115, 8,   10, 4.5,  2.0, 450, 'gerecht'),
  ('Wok met kip en groente',         110, 9,   10, 3.5,  1.5, 400, 'gerecht'),
  ('Poke bowl',                      140, 7,   18, 4,    1.5, 450, 'gerecht'),
  ('Burrito',                        210, 9,   25, 8,    2.5, 300, 'gerecht'),
  ('Caesar salade',                  130, 8,   6,  8.5,  1.0, 300, 'gerecht'),
  ('Salade met kip',                 90,  9,   4,  4,    1.5, 300, 'gerecht'),
  ('Erwtensoep',                     80,  5,   8,  3,    2.5, 350, 'gerecht'),
  ('Tomatensoep',                    45,  1,   6,  2,    0.8, 300, 'gerecht'),
  ('Kippensoep',                     35,  2.5, 3,  1.5,  0.3, 300, 'gerecht'),
  ('Quiche',                         260, 9,   18, 17,   1.0, 150, 'gerecht'),
  ('Kipsate met pindasaus',          220, 18,  7,  13.5, 1.0, 200, 'gerecht'),
  ('Schnitzel',                      250, 18,  12, 14.5, 0.5, 200, 'gerecht'),
  ('Spareribs',                      290, 22,  8,  19,   0,   400, 'gerecht'),
  ('Mixed grill',                    230, 24,  2,  14.5, 0,   350, 'gerecht'),
  -- Pannenkoeken en zoet
  ('Pannenkoek met kaas',            245, 11,  22, 12.5, 1.0, 180, 'gerecht'),
  ('Pannenkoek met spek',            270, 10,  22, 16,   1.0, 170, 'gerecht'),
  ('Pannenkoek met appel',           190, 5,   30, 5.5,  1.5, 180, 'gerecht'),
  ('Poffertjes met boter en poedersuiker', 280, 6, 40, 10, 1.0, 150, 'gerecht'),
  ('Wentelteefje',                   220, 8,   28, 8,    1.0, 100, 'gerecht'),
  ('Brownie',                        430, 5,   55, 21,   2.0, 60,  'gerecht'),
  ('Taart',                          280, 4,   30, 16,   0.5, 110, 'gerecht'),
  ('Muffin',                         400, 5,   50, 20,   1.5, 90,  'gerecht'),
  ('Donut',                          420, 5,   50, 22,   1.0, 60,  'gerecht'),
  ('Kwarkbroodje',                   300, 9,   45, 9,    1.5, 80,  'gerecht'),
  -- Borrel
  ('Borrelplank',                    330, 15,  12, 25,   1.0, 200, 'gerecht'),
  ('Nachos met kaas',                330, 9,   33, 18,   3.0, 200, 'gerecht'),
  -- Ketens (één stuk = de portie zoals je hem krijgt)
  ('McDonalds Big Mac',              236, 12,  20, 11.6, 1.6, 215, 'keten'),
  ('McDonalds Cheeseburger',         254, 13.4, 26, 10.6, 1.4, 118, 'keten'),
  ('McDonalds Hamburger',            250, 12.5, 30, 8.5, 1.6, 104, 'keten'),
  ('McDonalds McChicken',            228, 10,  23, 10,   1.5, 169, 'keten'),
  ('McDonalds Quarter Pounder',      258, 15,  20, 13,   1.3, 199, 'keten'),
  ('McDonalds Big Tasty Bacon',      242, 13,  15, 14,   1.0, 330, 'keten'),
  ('McDonalds Chicken McNuggets 6 stuks', 264, 15, 16, 15.5, 1.0, 98, 'keten'),
  ('McDonalds Friet klein',          290, 3.3, 36, 14,   3.5, 80,  'keten'),
  ('McDonalds Friet middel',         290, 3.3, 36, 14,   3.5, 114, 'keten'),
  ('McDonalds Friet groot',          290, 3.3, 36, 14,   3.5, 150, 'keten'),
  ('McDonalds McFlurry Oreo',        184, 4.8, 28, 6,    0.5, 185, 'keten'),
  ('McDonalds Milkshake middel',     105, 3,   17, 2.8,  0,   360, 'keten'),
  ('KFC Original Recipe kipstuk',    250, 20,  8,  15,   0.5, 110, 'keten'),
  ('KFC Zinger burger',              225, 13,  21, 10,   1.5, 200, 'keten'),
  ('KFC Hot Wings',                  290, 22,  9,  18,   0.5, 30,  'keten'),
  ('KFC Friet',                      280, 3.5, 36, 13,   3.0, 110, 'keten'),
  ('Burger King Whopper',            233, 10.5, 18, 13.5, 1.5, 270, 'keten'),
  ('Burger King Cheeseburger',       260, 13,  26, 11.5, 1.5, 120, 'keten'),
  ('Burger King Friet middel',       293, 3.5, 37, 14,   3.5, 116, 'keten'),
  ('Subway Chicken Teriyaki 15 cm',  143, 11,  20, 2.5,  2.0, 230, 'keten'),
  ('Subway Italian BMT 15 cm',       174, 8.7, 18, 7.4,  2.0, 230, 'keten'),
  ('Subway Tuna 15 cm',              200, 8,   17, 11,   2.0, 240, 'keten'),
  ('Dominos Pizza Margherita punt',  250, 11,  31, 9,    2.0, 80,  'keten'),
  ('Dominos Pizza Pepperoni punt',   275, 12,  28, 13,   2.0, 85,  'keten'),
  ('New York Pizza Margherita punt', 245, 11,  30, 9,    2.0, 85,  'keten'),
  ('Starbucks Caffe Latte grande',   40,  2.8, 4,  1.4,  0,   473, 'keten'),
  ('Starbucks Cappuccino grande',    27,  1.9, 2.7, 1.0, 0,   473, 'keten'),
  ('Starbucks Caramel Frappuccino grande', 80, 1, 13, 3, 0,  473, 'keten'),
  ('Starbucks Chai Latte grande',    51,  1.6, 9,  1.2,  0,   473, 'keten')
) as v(name, k, p, c, f, vez, por, soort)
where not exists (
  select 1 from public.ai_ingredients i
  where i.barcode is null and i.zoek_kern = public.zoek_kern(v.name)
);

-- Rauwe kipfilet als basis (alleen "Kip - filet (vers)" bestond, 165 kcal).
insert into public.ai_ingredients
  (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
   fiber_per_100g, sugar_per_100g, eenheid, gram_per_eenheid, default_portion_gram,
   min_portion_gram, max_portion_gram, source, bereiding)
select 'Kipfilet', 'protein', 109, 23, 0, 1.8, 0, 0, 'gram', 100, 120, 50, 500, 'coach', 'rauw'
where not exists (select 1 from public.ai_ingredients i where i.barcode is null and i.zoek_kern = 'kipfilet');

insert into public.zoek_synoniemen (van, naar) values
  ('mc donalds','mcdonalds'), ('mac donalds','mcdonalds'), ('macdonalds','mcdonalds'), ('mcd','mcdonalds'),
  ('mcnuggets','mcdonalds chicken mcnuggets 6 stuks'), ('mcflurry','mcdonalds mcflurry oreo'),
  ('bk','burger king'), ('whopper','burger king whopper'), ('dominos pizza','dominos'), ('new york','new york pizza'),
  ('pasta bolo','pasta bolognese'), ('spaghetti bolognese','pasta bolognese'),
  ('spaghetti bolo','pasta bolognese'), ('spaghetti carbonara','pasta carbonara'),
  ('saté','kipsate met pindasaus'), ('sate','kipsate met pindasaus'), ('kipsaté','kipsate met pindasaus'),
  ('pannekoek','pannenkoek'), ('pannenkoeken','pannenkoek'), ('kaaspannenkoek','pannenkoek met kaas'), ('spekpannenkoek','pannenkoek met spek'),
  ('appelpannenkoek','pannenkoek met appel'), ('borrel','borrelplank'), ('ribs','spareribs')
on conflict (van) do nothing;
