// src/modules/client-agenda/standaardWeekindeling.js
//
// Welke workout op welke dag, zolang niemand dat zelf heeft ingedeeld.
//
// Het probleem dat dit oplost: een coach wijst een schema toe (clients.
// assigned_schema_id) en ziet in de agenda... niets. De trainingsdagen komen
// namelijk uit clients.workout_schedule, en dat veld wordt pas gevuld zodra de
// klant zelf in zijn weekschema heeft zitten schuiven. Tot die tijd staat er
// een plan klaar dat nergens te zien is.
//
// Dus: zodra er een schema hangt en er nog geen indeling is, delen we de dagen
// zelf in. De klant kan ze daarna gewoon verslepen; vanaf dat moment is zijn
// eigen indeling leidend en komt dit bestand er niet meer aan te pas.
//
// De volgorde waarin we een dag kiezen:
//   1. De dagen waarop de klant volgens zijn intake traint. Dan klopt de tijd
//      meteen, want de agenda leest die tijd uit hetzelfde intakeformulier.
//   2. De voorkeursdagen op de klantrij (preferred_training_days).
//   3. Een nette spreiding: rustdagen tussen de trainingen in plaats van vier
//      dagen achter elkaar en dan drie dagen niets.

export const DAGEN = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

// Standaardspreiding per aantal trainingen. Geen willekeur: bij drie keer per
// week wil je ma/wo/vr en niet ma/di/wo, want herstel hoort tussen de sessies.
const SPREIDING = {
  1: ['Wednesday'],
  2: ['Monday', 'Thursday'],
  3: ['Monday', 'Wednesday', 'Friday'],
  4: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
  5: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  7: DAGEN,
}

// De dag-sleutels van een schema, in de volgorde waarin ze in het schema
// staan. Dat is de volgorde waarin de coach ze bedoeld heeft (dag1, dag2, …),
// en bij een push/pull/legs-split is die volgorde het hele punt.
export function schemaDagen(weekStructure) {
  if (!weekStructure || typeof weekStructure !== 'object') return []
  return Object.keys(weekStructure).filter(k => {
    const v = weekStructure[k]
    if (!v) return false
    // Een dag zonder oefeningen is een rustdag in het schema en hoeft geen
    // plek in de week.
    const oef = v.exercises || v.oefeningen
    return !Array.isArray(oef) || oef.length > 0
  })
}

/**
 * Deel de workouts van een schema in over de week.
 *
 * @param {object}   weekStructure        schema.week_structure
 * @param {string[]} voorkeurDagen        Engelse dagnamen uit preferred_training_days
 * @param {string[]} intakeTrainingDagen  Engelse dagnamen waarop de intake een training noemt
 * @returns {object|null}  { Monday: 'dag1', … } of null als er niets in te delen valt
 */
export function standaardWeekindeling(weekStructure, voorkeurDagen = [], intakeTrainingDagen = []) {
  const sleutels = schemaDagen(weekStructure)
  if (sleutels.length === 0) return null

  const geldig = (lijst) => (lijst || []).filter(d => DAGEN.includes(d))
  const uitIntake = geldig(intakeTrainingDagen)
  const uitVoorkeur = geldig(voorkeurDagen)

  // Kandidaten op volgorde van betrouwbaarheid, zonder dubbele dagen.
  const kandidaten = []
  for (const d of [...uitIntake, ...uitVoorkeur, ...(SPREIDING[sleutels.length] || DAGEN), ...DAGEN]) {
    if (!kandidaten.includes(d)) kandidaten.push(d)
  }

  const indeling = {}
  sleutels.forEach((sleutel, i) => {
    const dag = kandidaten[i]
    if (dag) indeling[dag] = sleutel
  })
  return Object.keys(indeling).length ? indeling : null
}

// De dagen waarop de intake een training noemt, als Engelse dagnamen.
// work_schedule is opgeslagen met Nederlandse afkortingen als sleutel.
const NL_NAAR_EN = {
  ma: 'Monday', di: 'Tuesday', wo: 'Wednesday', do: 'Thursday',
  vr: 'Friday', za: 'Saturday', zo: 'Sunday',
}

export function trainingsdagenUitIntake(workSchedule) {
  if (!workSchedule || typeof workSchedule !== 'object') return []
  const uit = []
  for (const [nlDag, items] of Object.entries(workSchedule)) {
    const dag = NL_NAAR_EN[String(nlDag).toLowerCase()]
    if (!dag || !Array.isArray(items)) continue
    if (items.some(b => ['training', 'sport', 'gym'].includes(String(b?.type).toLowerCase()))) {
      uit.push(dag)
    }
  }
  // In weekvolgorde, niet in de volgorde waarin het formulier ze opsloeg.
  return DAGEN.filter(d => uit.includes(d))
}
