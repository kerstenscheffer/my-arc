// src/modules/ai-meal-generator/tabs/plan-analyzer/portie.js
//
// Porties in plaats van losse grammen. Een ingrediënt in ai_ingredients kan
// een `eenheid` hebben (plakje, stuk, eetlepel, snee, schep, hand, theelepel,
// blik) met `gram_per_eenheid`. Heeft het die, dan stappen de +/- knoppen per
// hele portie en niet per 5 of 25 gram — anders krijg je 21 gram kaas terwijl
// een plak 13 gram is. Typen in grammen blijft altijd vrij.

const MEERVOUD = {
  stuk: 'stuks', plakje: 'plakjes', plak: 'plakken', snee: 'sneeën',
  eetlepel: 'eetlepels', theelepel: 'theelepels', schep: 'scheppen',
  hand: 'handen', blik: 'blikken', bol: 'bollen', blokje: 'blokjes',
  beker: 'bekers', glas: 'glazen', zakje: 'zakjes', reep: 'repen',
}

// null als er geen bruikbare eenheid is (geen eenheid, of 'gram').
export function portieInfo(row) {
  if (!row) return null
  const eenheid = (row.eenheid || '').trim().toLowerCase()
  const gram = parseFloat(row.gram_per_eenheid)
  if (!eenheid || eenheid === 'gram' || eenheid === 'g' || eenheid === 'ml') return null
  if (!Number.isFinite(gram) || gram <= 0) return null
  return { eenheid, gram }
}

// Volgende hele portie omhoog of omlaag. Vanaf 21g met 13g per plak:
// omhoog -> 26 (2 plakken), omlaag -> 13 (1 plak). Nooit onder 1 portie
// via de knop; 0 kun je nog altijd typen.
export function stapPortie(huidig, info, dir) {
  const n = (parseFloat(huidig) || 0) / info.gram
  const eps = 1e-6
  const volgende = dir > 0 ? Math.floor(n + eps) + 1 : Math.ceil(n - eps) - 1
  return Math.round(Math.max(1, volgende) * info.gram)
}

function formatAantal(n) {
  const afger = Math.round(n * 10) / 10
  if (Number.isInteger(afger)) return String(afger)
  const heel = Math.floor(afger)
  if (Math.abs(afger - heel - 0.5) < 0.001) return heel ? `${heel}½` : '½'
  return afger.toFixed(1).replace('.', ',')
}

// "2 plakjes", "1 stuk", "1½ eetlepel", "1,6 plakje"
export function portieLabel(gram, info) {
  const n = (parseFloat(gram) || 0) / info.gram
  const tekst = formatAantal(n)
  // Meervoud alleen bij hele aantallen boven 1: "2 plakjes", maar "1½ plakje".
  const afger = Math.round(n * 10) / 10
  const meervoud = Number.isInteger(afger) && afger !== 1
  const naam = meervoud ? (MEERVOUD[info.eenheid] || info.eenheid) : info.eenheid
  return `${tekst} ${naam}`
}

// Staat de hoeveelheid op een hele portie? Wordt gebruikt om af te wijken
// van de maat zichtbaar te maken, zonder het te blokkeren.
export function isHelePortie(gram, info) {
  const n = (parseFloat(gram) || 0) / info.gram
  return Math.abs(n - Math.round(n)) < 0.05
}

// "1 plakje = 15 g"
export function portieUitleg(info) {
  return `1 ${info.eenheid} = ${Math.round(info.gram)} g`
}
