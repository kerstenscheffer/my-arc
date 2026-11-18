# Regels canonieke voedingsplannen (Kersten, 18 nov 2026)

Canoniek = `meal_plan_templates.is_canoniek`, zichtbaar in Plan Analyzer → Templates → Canoniek.
Voeding rond de training: `docs/regels-voeding-rond-training.md`.

## Basis
- Altijd rauw wegen: vlees, vis, rijst en pasta in rauwe grammen.
- De doelen van de klant zijn het doel van een rustdag. De maaltijden zonder pre-workout komen samen op dat doel uit.
- Trainingsdag = rustdag plus de pre-workout. Het dagdoel gaat die dag omhoog met precies die maaltijd
  (`doelenMetPreWorkout` in `src/modules/meal-plan/utils/preWorkoutMeal.js`). Geen aparte set doelen.
- Pre-workout: 1 tot 2 uur voor de training, vooral koolhydraten, weinig vet. Standaard een banaan.
- Na de training de grootste koolhydraatmaaltijd van de dag.
- 4 tot 5 eiwitmaaltijden per dag, elke 3 tot 6 uur.
- Supplementen: creatine, D3+K2, omega-3.

## Macro's
- Eiwit: 2 g per kg. Een template kent geen gewicht, dus per trede een vast getal (voorstel, nog niet bevestigd).
- Vet: minimaal 0,7 g per kg. Cut zit dicht bij dat minimum, bulk hoger.
- Koolhydraten: de rest. Naar een hogere trede gaan = vooral koolhydraten erbij.

## Treden
- Man cut: 2000, 2200, 2400. Man bulk: 2600, 2800, 3000.
- Vrouw: 1600, 1800, 2000, 2200.

## Vertakkingen
Eén perfect plan als stam (geïnspireerd op Kerstens eigen plan), daarvan takken:
- Kcal-trede: zelfde gerechten, meer of minder koolhydraten.
- Variatie: geen vaste regel, maar een keuze per plan. Van "7 dagen hetzelfde" tot afwisselen per dag.
- Aantal maaltijden: 3 hoofdmaaltijden, of met 1 tot 2 tussendoortjes. Tak maken door een maaltijd weg te halen
  en de rest groter te maken.

## Gerechten
- Vaste kern: Kwark met bosvruchten, Appel, Cottage cheese met cracker, Volkoren wrap met ei en kipfilet,
  Kip rijst spinazie zoete aardappel, Koude pastasalade met kip, Kip met krieltjes, Kip teriyaki.
- Cut: veel volume, weinig kcal, veel eiwit, grote porties. Weinig ei, olijfolie en kaas.
- Bulk: meer ei, olijfolie en kaas.

## Stam: Kerstens eigen plan (bulk, 3 maaltijden)
- Ontbijt: 500 g magere kwark, 60 g havermout, 100 g bosvruchten.
- Lunch: 2 volkoren wraps met ei, kaas en kipfilet.
- Diner: 200 g kipfilet, 400 g zoete aardappel, 200 g broccoli, olijfolie, avocado.
- Pre-workout: wrap met jam.
