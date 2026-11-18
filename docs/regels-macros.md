# Regels macro's na de intake (Kersten, 18 nov 2026)

Rekenwerk: `bereken_intake_macros(client_id)` in de database (schrijft niets, geeft doel + brief terug).
In de app: `src/modules/macros/macroRules.js` (knop "Bereken" in Coach Inzicht).

## Onderhoud
- Formule: Mifflin-St Jeor × activiteit, plus 350 kcal per training (gedeeld door 7).
- Activiteit uit de intake: zittend 1,2 · licht 1,3 · matig 1,4 · actief 1,5. Niet ingevuld = zittend, met een opmerking in de brief.
- Correctie op trainingservaring, omdat de formule te hoog schat: beginner 350 eraf, gemiddeld 200 eraf, gevorderd 50 eraf
  (meer spiermassa = hoger onderhoud). Niet ingevuld = gemiddeld, met een opmerking in de brief.

## Doel
- Cut: tempo 0,6% van het lichaamsgewicht per week (band 0,6 tot 1,0). Tekort per dag = gewicht × tempo × 7700 / 7.
- Bulk: +300 kcal.
- Anders: gelijk aan onderhoud.
- Afronden op 100 kcal, zodat het doel op een canoniek plan valt.
- Ondergrens: vrouw 1500, man 1800. Komt de som lager uit, dan blijft het doel op de ondergrens en komt de rest uit cardio.
- Het doel is de trainingsdag, met pre-workout. Een rustdag ligt lager (`docs/regels-canonieke-voedingsplannen.md`).

## Macro's
- Eiwit 2,0 g per kg huidig gewicht.
- Vet 0,7 g per kg, bij bulk 1,0.
- Koolhydraten: de rest.

## Alleen nieuwe intakes
Bestaande klanten en handmatig ingestelde macro's worden nooit automatisch overschreven.

## Proefdraai (18 nov 2026, 30 betalende klanten, niets opgeslagen)
Gemiddeld 100 kcal lager dan wat er nu staat (onderhoud 2461 tegen 2640), 5 van de 30 op de ondergrens.
Bij 15 van de 30 is de trainingservaring niet ingevuld.
- Tempo is gelezen als procent van het lichaamsgewicht per week (0,6% past bij de huidige tekorten: man −600, vrouw −440).
