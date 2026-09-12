// src/modules/workout/utils/rustWaarschuwing.js
//
// Waarschuwing als dezelfde training te dicht op elkaar staat. Twee keer push
// op maandag en dinsdag geeft die spieren geen 48 uur om te herstellen; dat
// hoort de weekplanner te laten zien op het moment dat je hem verschuift, niet
// achteraf.
//
// De week herhaalt zich, dus zondag en de maandag erna liggen ook naast
// elkaar. Daarom rekenen we rond: het gat tussen de laatste en de eerste dag
// telt mee.
//
//   1 dag ertussen (24 uur)  → rood
//   2 dagen ertussen (48 uur) → oranje
//   meer                      → niets

export const ROOD = 'rood'
export const ORANJE = 'oranje'

// Kleinste afstand in dagen tussen twee keer dezelfde workout in een week die
// zich herhaalt. Eén voorkomen → null (niets om te vergelijken).
export function kleinsteGat(indexen) {
  const lijst = [...new Set(indexen)].sort((a, b) => a - b)
  if (lijst.length < 2) return null
  let kleinste = Infinity
  for (let i = 1; i < lijst.length; i++) {
    kleinste = Math.min(kleinste, lijst[i] - lijst[i - 1])
  }
  // Rond de week heen: van de laatste dag naar de eerste van de week erna.
  kleinste = Math.min(kleinste, (lijst[0] + 7) - lijst[lijst.length - 1])
  return kleinste
}

// schedule: { Monday: 'dag1', Tuesday: 'dag1', ... }
// weekDays: ['Monday', ... 'Sunday'] — bepaalt de volgorde van de indexen.
// naamVan: (workoutKey) => zichtbare naam, voor de tekst onder de week.
//
// Terug: { perDag: {0:'rood'}, meldingen: [{ niveau, naam, gat }] }
export function rustWaarschuwingen(schedule, weekDays, naamVan = (k) => k) {
  const perKey = {}
  weekDays.forEach((dag, i) => {
    const key = schedule?.[dag]
    if (!key) return
    if (!perKey[key]) perKey[key] = []
    perKey[key].push(i)
  })

  const perDag = {}
  const meldingen = []

  Object.entries(perKey).forEach(([key, indexen]) => {
    const gat = kleinsteGat(indexen)
    if (gat === null || gat > 2) return
    const niveau = gat === 1 ? ROOD : ORANJE
    indexen.forEach(i => {
      // Rood wint van oranje: staat een workout drie keer, dan telt het
      // krapste gat voor alle dagen van die workout.
      if (perDag[i] !== ROOD) perDag[i] = niveau
    })
    meldingen.push({ niveau, naam: naamVan(key) || key, gat, key })
  })

  // Rood eerst, dat is het dringendst.
  meldingen.sort((a, b) => (a.niveau === b.niveau ? 0 : a.niveau === ROOD ? -1 : 1))
  return { perDag, meldingen }
}

export function waarschuwingTekst(melding) {
  if (!melding) return ''
  return melding.gat === 1
    ? `${melding.naam} staat twee dagen achter elkaar — die spieren krijgen geen 24 uur rust.`
    : `${melding.naam} staat met één dag ertussen — dat is 48 uur rust, aan de krappe kant.`
}

export default rustWaarschuwingen
