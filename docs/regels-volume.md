# Regels volume per spiergroep (MY ARC, 10 nov 2026)

Bron: Kerstens onderzoek "Tien tot twintig harde sets winnen bijna alles" (Pelland 2025, Schoenfeld 2017,
Baz-Valle 2022, Remmert 2025, ACSM 2026, Roth 2022/23, Bickel 2011, Spiering 2021, RP/Helms/Nuckols).
Code: `src/modules/manual-workout-builder/volumeRegels.js` (getallen) en `volumeSuggesties.js` (logica).
Zichtbaar in de Workout Builder → Alle dagen: pijltje achter de spiergroep, klik = advies + knop.

## Tellen
- Been-compounds tellen voor beide groepen volledig (Kersten, 10 nov): squat/hack/leg press/lunge → quads 1 + billen 1,
  deadlift/RDL → hamstrings 1 + billen 1. Bovenlichaam-synergisten blijven 0,5.
- Fractionele harde sets per spier per week: prime mover 1, synergist in een compound 0,5
  (bibliotheek `secundair_spieren`, anders op naam: press → triceps/schouders, row/pulldown → biceps, squat/deadlift → billen).
- Alleen werksets (0-3 RIR, 6-20 reps). Warm-ups tellen niet. Weekreps en volume load zijn geen valuta.
- Spiergroepen fijn (10 nov 2026): front/side/rear delts en quads/hamstrings apart. Staat er alleen 'shoulders'/'legs'
  bij een oefening, dan bepaalt de naam het (lateral → side, rear/reverse/face pull → rear, rest → front; curl/RDL/deadlift → hamstrings, rest → quads).
  Synergisten: rows/pulldowns → biceps + rear delts, presses → triceps + front delts, overhead press → triceps + side delts.
- Billen en front delts: alleen plafond (compounds dekken het). Buik/traps: geen doel.
- Oude herstelantwoorden 'legs'/'shoulders' gelden voor alle fijne groepen eronder.

## Range (sets/week)
| Status | Build | Onderhoud | Cut | Max per sessie |
|---|---|---|---|---|
| Beginner | 8-10 (start 6) | 6-8 | 6-8 | 5 |
| Intermediair | 12-16 (start 10) | 10-12 | 8-12 | 8 |
| Gevorderd | 14-20 | 10-14 | 10-14 | 10 |
40+: max 7 per sessie, zelfde weekvolume, altijd ≥2 sessies. Elke spier minimaal 2x per week.
Status = clients.training_experience, anders intake; onbekend = intermediair (getoond met '?').
Fase = lopende client_phases (build → build, cut → cut, geen → onderhoud).

## Beslisregel per spier (in deze volgorde)
0. 2 trainingen achter elkaar pijn bij een oefening → die oefening wisselen (knop opent het wisselvenster), sets blijven gelijk.
   Ligt meestal aan de oefening (vooral borst), niet aan het volume. 1x pijn = oranje, in de gaten houden.
1. Niet hersteld (herstelvraag 'Niet') of kracht daalt 2 weken (niet in cut) → 1/3 minder sets.
2. Cut + kracht daalt → eerst kcal/eiwit/slaap; alleen terug als boven de range.
3. Onder de vloer (startwaarde) → erbij, max +2 per week.
4. Boven de bovengrens → eraf, max −2 per week.
5. Cut binnen range → houden; volume niet verhogen, gewichten vasthouden.
6. Herstel schoon (groen) + kracht 2 weken stil → +1 set (tot de bovengrens; daar: deload of extra sessie).
7. Kracht stijgt → zo laten.
Altijd gemeld: <2x per week, of meer dan het max per sessie.

## Waar de set landt
+: oefening van die spier met de minste sets, op een dag met tijd over (intake-sessieduur, bovenkant; leeg = 90 min)
en onder het per-sessie plafond. −: oefening met de meeste sets, nooit onder 1.
Niets gaat automatisch; de coach drukt op de knop en slaat het plan op.

## Nog niet in de code
Deload na 4-6 weken (sets −30-50%), krachtdoelen (2-4 zware sets eerst), vrouwen kortere rust,
extra sport/cardio, vakantie-onderhoud (4-6 sets in 1 sessie).

## Koppen / delen (Kerstens indeling, geen onderzoek)
Code: `src/modules/manual-workout-builder/koppen.js`. Alleen dekking (directe sets per kop, oranje bij 0), geen setdoel of advies.
Borst: bovenborst / midden · Rug: lats / bovenrug · Triceps: lange / laterale kop · Biceps: lange / korte kop / brachialis
(gewone curl = beide koppen) · Quads: rectus femoris / vasti · Hamstrings: knie-buigers / heup-strekkers · Billen: max / medius.
Kop komt uit de naam; per oefening vast te zetten in het bewerkvenster (veld `kop` in het plan).

## Max per training (Kerstens regel, niet uit het onderzoek)
Output zakt na een aantal harde sets. Max per training, alle spieren: beginner 12 · intermediair 16 · gevorderd 20 · 40+ 14
(`MAX_SETS_PER_TRAINING`). Dagkop rood erboven; "+1 set" zet nooit een set op een volle dag en kiest bij gelijk aantal
sets de oefening vooraan. Melding als een zware compound (squat, deadlift, press, hack…) pas vanaf de 4e plek na lichter werk komt.

## Cyclus (10 nov 2026)
`workout_schemas.cyclus` = {lengte, volgorde: ['dag1', null, …]} (null = rust), alleen de builder leest het (`cyclus.js`).
7 dagen = de week: volgorde uit het weekrooster van de klant. Langer (8-14): volgorde in de builder (pijltjes per kolom).
Volume en frequentie per week = per cyclus × 7 / lengte. "Geen rustdag" als dezelfde spier twee dagen achter elkaar direct getraind wordt.
De klantapp volgt nog steeds het weekrooster; een cyclus > 7 is nu planning in de builder.
