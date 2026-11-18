// src/modules/workout/cardioKcal.js
//
// De kcal-schatting van een cardiotraining, op één plek: het logblad
// (CardioLogBlad) en het loggen vanuit "+ training" (TrainingToevoegen) rekenen
// hiermee. MET × factor × 3,5 × kg / 200 per minuut.

// Zelfde MET-tabel als het weekbudget van de coach (Compendium 2011).
const MET = { wandelen: 4.3, fietsen: 6.8, zwemmen: 6.0, hardlopen: 8.3, roeien: 7.0, crosstrainer: 5.0, stairmaster: 9.0, hiit: 8.0, padel: 6.0, hyrox: 9.0, crossfit: 8.0 }
export const metVan = (soort) => {
  const n = String(soort || '').toLowerCase()
  const k = Object.keys(MET).find(k => n.includes(k)) || (n.includes('run') ? 'hardlopen' : n.includes('cycl') || n.includes('bike') ? 'fietsen' : null)
  return k ? MET[k] : 6.0
}
// Hoe zwaar: factor op de MET. Rustig praten = rustig; hijgen = pittig.
export const INTENSITEIT = [
  { id: 'rustig',    label: 'Rustig',    uitleg: 'je kunt praten',          factor: 0.85 },
  { id: 'gemiddeld', label: 'Gemiddeld', uitleg: 'korte zinnen',            factor: 1.0 },
  { id: 'pittig',    label: 'Pittig',    uitleg: 'hijgen, paar woorden',    factor: 1.2 },
  { id: 'vol_gas',   label: 'Vol gas',   uitleg: 'niet praten, alles geven', factor: 1.4 },
]

// Geschatte kcal voor `minuten` van deze soort, bij dit gewicht en deze zwaarte.
export function schatKcal(soort, intensiteitId, gewicht, minuten) {
  const f = INTENSITEIT.find(i => i.id === intensiteitId) || INTENSITEIT[1]
  return Math.round(metVan(soort) * f.factor * 3.5 * (Number(gewicht) || 80) / 200 * (Number(minuten) || 0))
}
