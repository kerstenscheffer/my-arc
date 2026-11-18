# Regels canonieke workoutplannen (Kersten, 18 nov 2026)

Canoniek = `workout_schemas.is_canoniek`, zichtbaar in Workout Builder → Plannen → Canoniek.
Volume- en tijdsregels: `docs/regels-volume.md` en `trainingsTijd.js`.

## Sets, reps, rust
- Elke oefening start op 2 sets. Opbouwen gebeurt per klant (sweet spot), niet in het basisplan.
- Side delts, rear delts en buik starten op 3 sets en mogen vaker per week terugkomen, ook op opeenvolgende dagen: ze herstellen sneller.
- Reps 8-12; side en rear delts 10-15.
- Rust 2 min; grote beenoefeningen (hack squat, RDL, hip thrust, leg press) 3 min.

## Dag
- Maximaal 60 minuten (9 min per oefening met 2 sets, +3 per extra set) en maximaal 16 sets.
- Minimaal 45 minuten: een plan van 30 minuten maken we niet. Geeft de klant minder op, dan wordt het 45.
- Zwaarste compound eerst, isolatie daarna, buik als laatste.
- Oefeningen van dezelfde spiergroep staan achter elkaar: eerst alles voor borst, dan alles voor rug. Niet om en om
  (18 nov 2026: de upper-dagen stonden borst, rug, borst, rug; in alle canonieke plannen rechtgezet).
- Past niet alles: kuiten vallen als eerste af. Elke andere oefening heeft voorrang op kuiten.

## Oefeningen
- Vaste kern, machines en kabels eerst. Per spier één compound en één isolatie.
- Een oefening die vaker per week terugkomt is dezelfde oefening (progressie meetbaar).
- Geen conventionele deadlift, back squat of zware overhead press.
- Incline bench is altijd op de Smith machine (`Incline Smith Machine Bench Press`), nooit met losse barbell.
- Namen: Hack Squat (voeten midden/laag), Romanian Deadlift, Hip Thrust, Leg Extension, Seated Leg Curl, Calf Raises,
  Incline Smith Machine Bench Press, Machine Chest Press, Machine Pec Deck, Lat Pulldown, T-Bar Row (Chest-Supported),
  Cable Overhead Triceps Extension, Single Arm Cable Tricep Extension, Triceps Pushdown, Incline Dumbbell Curl,
  EZ-Bar Preacher Curls, Cable Bicep Curls, Machine Lateral Raise, Cable Lateral Raises, Cable Rear Delt Flies,
  Machine Crunches, Hanging Leg Raises.

## Man
- Focus: bovenlichaam, side delts, buik. Benen: quads voorop (hack squat + leg extension), hamstrings alleen via RDL.

## Vrouw
- Focus: benen en billen (hip thrust erbij), rear delts, buik. Eén borstoefening per dag (Machine Chest Press).

## Vorm
- Naam `5X | PPL-UL`. Cyclus 7 dagen met vaste rustdagen, niveau intermediair, 60 minuten.
- Eerst gym, daarna thuis. Beginnersversie: nog niet besloten.

## Concept na de intake (workout-bouwer, 18 nov 2026)
Code: `supabase/functions/workout-bouwer/kern.ts`. Uit feedback van Kersten op de brief:
- Tijd: de intake vraagt een bereik en bewaart de ondergrens ("45 tot 60 min" staat als 45). Het plan mag tot de bovengrens duren (60).
- Zes oefeningen passen altijd: voor tijd wordt een dag nooit onder de zes oefeningen ingekort. Wie krap zit doet oefeningen om en om.
- Beendag: een beenoefening gaat niet weg om plaats te maken voor het bovenlichaam, ook niet als dat een focusspier is.
  Kuiten blijven wel als eerste afvallen.
