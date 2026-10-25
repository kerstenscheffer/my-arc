-- src/modules/meal-plan/components/food-log/basisproducten.sql
--
-- Alledaagse basisproducten die in ai_ingredients ontbraken (25 okt 2026).
-- "koffie" gaf alleen ijskoffie en oploskoffie, "cappuccino" capuccinopoeder
-- (422 kcal), "wijn" wijnazijn en "thee" ijsthee: er waren 37.000 merk-
-- producten maar geen gewone kop koffie.
--
-- Waarden per 100 g/ml, afgerond naar NEVO / etiketgemiddelden. Koffie met
-- melk = koffie met een scheut halfvolle melk; cappuccino ±60 %, latte ±80 %
-- halfvolle melk. Bij alcohol klopt kcal niet met de macro's: alcohol telt
-- 7 kcal/g en heeft geen eigen veld.
--
-- source 'coach' + geen barcode = basisproduct (krijgt voorrang in
-- zoek_ingredienten en staat in de foto-beheerder). Bestaat de naam al als
-- basisproduct, dan wordt hij overgeslagen.

insert into public.ai_ingredients
  (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
   fiber_per_100g, sugar_per_100g, eenheid, gram_per_eenheid, default_portion_gram,
   min_portion_gram, max_portion_gram, unit_type, source)
select v.name, v.cat, v.k, v.p, v.c, v.f, v.vez, v.sui, v.eh, v.gpe, v.por, v.mn, v.mx, v.ut, 'coach'
from (values
  -- Koffie en thee (porties: kop 150 ml, mok 250 ml via portionPresets)
  ('Koffie',                     'other',      2,   0.1, 0.3,  0,    0,   0,    'gram', 100, 150,  20, 500, 'liter'),
  ('Koffie met melk',            'other',      6,   0.4, 0.6,  0.2,  0,   0.6,  'gram', 100, 150,  20, 500, 'liter'),
  ('Koffie met melk en suiker',  'other',      17,  0.4, 3.3,  0.2,  0,   3.3,  'gram', 100, 150,  20, 500, 'liter'),
  ('Koffie met suiker',          'other',      13,  0.1, 3.0,  0,    0,   2.7,  'gram', 100, 150,  20, 500, 'liter'),
  ('Espresso',                   'other',      2,   0.1, 0,    0.2,  0,   0,    'gram', 100, 30,   20, 120, 'liter'),
  ('Americano',                  'other',      1,   0.1, 0,    0,    0,   0,    'gram', 100, 200,  50, 500, 'liter'),
  ('Cappuccino',                 'other',      28,  2.0, 2.9,  0.9,  0,   2.9,  'gram', 100, 150,  50, 500, 'liter'),
  ('Koffie verkeerd',            'other',      24,  1.7, 2.4,  0.8,  0,   2.4,  'gram', 100, 200,  50, 500, 'liter'),
  ('Latte',                      'other',      37,  2.7, 3.8,  1.2,  0,   3.8,  'gram', 100, 250,  50, 500, 'liter'),
  ('Cappuccino met havermelk',   'other',      28,  0.5, 4.1,  1.0,  0.5, 2.4,  'gram', 100, 150,  50, 500, 'liter'),
  ('Thee',                       'other',      1,   0,   0.2,  0,    0,   0,    'gram', 100, 200,  50, 500, 'liter'),
  ('Thee met suiker',            'other',      9,   0,   2.2,  0,    0,   2.0,  'gram', 100, 200,  50, 500, 'liter'),
  ('Groene thee',                'other',      1,   0,   0.2,  0,    0,   0,    'gram', 100, 200,  50, 500, 'liter'),
  ('Muntthee',                   'other',      1,   0,   0.2,  0,    0,   0,    'gram', 100, 250,  50, 500, 'liter'),
  -- Frisdrank en sap
  ('Cola',                       'other',      42,  0,   10.6, 0,    0,   10.6, 'gram', 100, 250,  50, 1000, 'liter'),
  ('Cola zero',                  'other',      0.3, 0,   0,    0,    0,   0,    'gram', 100, 250,  50, 1000, 'liter'),
  ('Sinas',                      'other',      38,  0,   9.4,  0,    0,   9.4,  'gram', 100, 250,  50, 1000, 'liter'),
  ('Limonade (aangelengd)',      'other',      18,  0,   4.5,  0,    0,   4.5,  'gram', 100, 250,  50, 1000, 'liter'),
  ('Energiedrank',               'other',      45,  0,   11,   0,    0,   11,   'gram', 100, 250,  50, 500, 'liter'),
  ('Energiedrank suikervrij',    'other',      3,   0,   0.4,  0,    0,   0,    'gram', 100, 250,  50, 500, 'liter'),
  ('Appelsap',                   'other',      44,  0.1, 10.4, 0.1,  0.1, 10,   'gram', 100, 200,  50, 500, 'liter'),
  -- Zuivel en melkvervangers
  ('Magere melk',                'dairy',      34,  3.5, 4.7,  0.1,  0,   4.7,  'gram', 100, 250,  50, 500, 'liter'),
  ('Sojamelk',                   'dairy',      39,  3.0, 2.5,  1.8,  0.6, 2.5,  'gram', 100, 250,  50, 500, 'liter'),
  ('Vla',                        'dairy',      96,  3.1, 15,   2.5,  0,   13,   'gram', 100, 150,  50, 400, null),
  ('Slagroom',                   'dairy',      300, 2.0, 10,   28,   0,   10,   'eetlepel', 10, 30, 10, 200, null),
  ('IJs',                        'dairy',      200, 3.5, 23,   10,   0,   21,   'schep', 50, 100,  50, 300, null),
  -- Alcohol (kcal inclusief alcohol)
  ('Bier',                       'other',      42,  0.4, 3.0,  0,    0,   0,    'gram', 100, 250,  100, 1000, 'liter'),
  ('Alcoholvrij bier',           'other',      20,  0.3, 4.6,  0,    0,   2.5,  'gram', 100, 300,  100, 1000, 'liter'),
  ('Speciaalbier',               'other',      60,  0.5, 4.5,  0,    0,   0,    'gram', 100, 300,  100, 1000, 'liter'),
  ('Rode wijn',                  'other',      70,  0.1, 2.5,  0,    0,   0.6,  'gram', 100, 150,  50, 750, 'liter'),
  ('Witte wijn',                 'other',      70,  0.1, 1.5,  0,    0,   1.0,  'gram', 100, 150,  50, 750, 'liter'),
  ('Rosé',                       'other',      70,  0.1, 2.5,  0,    0,   1.5,  'gram', 100, 150,  50, 750, 'liter'),
  ('Prosecco',                   'other',      75,  0.1, 1.5,  0,    0,   1.5,  'gram', 100, 120,  50, 750, 'liter'),
  -- Suiker en smeersels
  ('Suiker',                     'condiments', 400, 0,   100,  0,    0,   100,  'theelepel', 5, 5,  1, 100, null),
  ('Ketchup',                    'condiments', 105, 1.2, 24,   0.2,  0.5, 22,   'eetlepel', 15, 15, 5, 100, null),
  ('Jam',                        'condiments', 245, 0.4, 60,   0.1,  1,   55,   'theelepel', 10, 15, 5, 60, null),
  ('Zonnebloemolie',             'fats',       884, 0,   0,    100,  0,   0,    'eetlepel', 10, 10, 5, 50, null),
  -- Eieren
  ('Gekookt ei',                 'protein',    140, 12.5, 0.3, 9.6,  0,   0.3,  'stuk', 55, 55,   30, 250, null),
  ('Spiegelei',                  'protein',    180, 13,  0.4,  14,   0,   0.4,  'stuk', 50, 50,   30, 250, null),
  ('Roerei',                     'protein',    160, 11,  1.5,  12,   0,   1.2,  'gram', 100, 120, 50, 300, null),
  ('Omelet',                     'protein',    155, 11,  1.0,  12,   0,   0.8,  'gram', 100, 120, 50, 300, null),
  -- Vlees
  ('Kipdij',                     'protein',    145, 19,  0,    7.5,  0,   0,    'gram', 100, 150, 50, 400, null),
  ('Rundvlees (mager)',          'protein',    120, 22,  0,    3.5,  0,   0,    'gram', 100, 150, 50, 400, null),
  -- Brood, deeg, gekookte koolhydraten
  ('Pita',                       'carbs',      270, 9,   55,   1.2,  2.2, 2,    'stuk', 65, 65,   30, 250, null),
  ('Krentenbol',                 'carbs',      270, 7.5, 50,   4,    3,   15,   'stuk', 60, 60,   30, 240, null),
  ('Pannenkoek',                 'carbs',      195, 6.5, 26,   7,    1,   4,    'stuk', 100, 100, 50, 400, null),
  ('Gekookte rijst',             'carbs',      130, 2.7, 28,   0.3,  0.4, 0,    'gram', 100, 150, 50, 400, null),
  ('Gekookte pasta',             'carbs',      150, 5.5, 29,   0.9,  1.8, 0.5,  'gram', 100, 200, 50, 400, null),
  ('Friet',                      'carbs',      300, 3.8, 36,   15,   3.5, 0.5,  'gram', 100, 150, 50, 400, null),
  -- Snacks en fastfood
  ('Bitterbal',                  'other',      260, 7,   19,   17,   1,   1,    'stuk', 25, 100,  25, 300, null),
  ('Pizza',                      'other',      260, 11,  30,   10,   2,   3,    'stuk', 350, 350, 100, 700, null),
  ('Pizza margherita',           'other',      245, 10,  31,   8.5,  2,   3,    'stuk', 350, 350, 100, 700, null),
  ('Tosti ham kaas',             'other',      260, 14,  25,   11,   1.5, 2.5,  'stuk', 120, 120, 60, 360, null),
  ('Big Mac',                    'other',      236, 12,  20,   11.6, 1.6, 4,    'stuk', 215, 215, 100, 430, null),
  ('Cheeseburger',               'other',      254, 13.4, 26,  10.6, 1.4, 5.5,  'stuk', 118, 118, 60, 360, null),
  ('Pinda',                      'fats',       614, 25,  9,    52,   7,   4,    'hand', 30, 30,   10, 150, null),
  -- Zoet
  ('Mars',                       'other',      449, 4,   70,   17,   1,   60,   'stuk', 51, 51,   20, 150, null),
  ('Drop',                       'other',      340, 3,   78,   0.5,  0.5, 50,   'hand', 25, 25,   10, 150, null),
  ('Winegums',                   'other',      330, 4.5, 77,   0.2,  0,   50,   'hand', 25, 25,   10, 150, null),
  ('Appeltaart',                 'other',      250, 3,   33,   12,   1.5, 18,   'stuk', 120, 120, 60, 360, null),
  ('Tompouce',                   'other',      285, 3,   37,   14,   0.5, 22,   'stuk', 95, 95,   45, 300, null),
  -- Fruit
  ('Mandarijn',                  'fruits',     46,  0.8, 10,   0.3,  1.8, 9,    'stuk', 70, 70,   35, 350, null),
  -- Sport
  ('Whey eiwitpoeder',           'protein',    380, 78,  7,    5,    0,   5,    'schep', 30, 30,  15, 90, null),
  ('Eiwitshake',                 'protein',    35,  7,   0.7,  0.5,  0,   0.5,  'gram', 100, 330, 100, 700, 'liter'),
  ('Eiwitreep',                  'protein',    360, 30,  35,   12,   5,   5,    'stuk', 55, 55,   25, 165, null),
  ('Proteïnereep',               'protein',    360, 30,  35,   12,   5,   5,    'stuk', 55, 55,   25, 165, null)
) as v(name, cat, k, p, c, f, vez, sui, eh, gpe, por, mn, mx, ut)
where not exists (
  select 1 from public.ai_ingredients i
  where i.barcode is null and i.zoek_kern = public.zoek_kern(v.name)
);
