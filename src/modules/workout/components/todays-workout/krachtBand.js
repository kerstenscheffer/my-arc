// src/modules/workout/components/todays-workout/krachtBand.js
//
// Wat is een goed tempo voor kracht? Bij gewicht staat dat in de fase — daar
// spreek je kilo's per week af. Voor een oefening bestaat die afspraak niet,
// dus staat hier de norm waartegen we meten.
//
// De norm is een percentage van je startgewicht per week, niet een vast aantal
// kilo. Vijf kilo erbij op een bankdrukken van 40 is een ander verhaal dan vijf
// kilo op een deadlift van 180, en een vaste stap zou de ene klant belonen en
// de andere afserveren.
//
// Anders dan bij lichaamsgewicht is er hier geen bovengrens: harder vooruit dan
// afgesproken is puur goed nieuws. De band loopt dus van "dit is het minste wat
// we willen zien" tot het streeftempo, en alles daarboven is beter.
//
// De getallen: 0,75% per week is ongeveer waar een klant die serieus traint op
// uitkomt — op 70 kg bankdrukken is dat een halve kilo per week, dus ruim vijf
// kilo in drie maanden. De ondergrens van 0,25% zegt: er moet beweging in
// zitten. Blijf je daaronder, dan sta je stil en is er iets te bespreken.

export const KRACHT_NORM = {
  streef_pct_week: 0.75,   // % van het startgewicht per week — hier mikken we op
  minimaal_pct_week: 0.25, // daaronder sta je stil
  // Onder deze absolute stap is een verschil ruis: de meeste stangen gaan met
  // 2,5 kg omhoog en veel machines met 5. Zonder deze bodem zou een band van
  // 0,1 kg breed elke normale week als "buiten de band" bestempelen.
  marge_kg: 1.25,
}

const dagInMs = 24 * 60 * 60 * 1000

// Hoeveel weken zit er tussen twee logdatums? Als kommagetal, want je traint
// niet op vaste dagen.
export function wekenTussen(vanIso, totIso) {
  const van = new Date(`${String(vanIso).slice(0, 10)}T00:00:00`).getTime()
  const tot = new Date(`${String(totIso).slice(0, 10)}T00:00:00`).getTime()
  if (!Number.isFinite(van) || !Number.isFinite(tot)) return 0
  return Math.max(0, (tot - van) / (dagInMs * 7))
}

// De twee lijnen op een gegeven moment: waar je minimaal hoort te zitten en
// waar we op mikken.
export function lijnenOpWeek(weken, startGewicht, norm = KRACHT_NORM) {
  const streef = startGewicht * (1 + (norm.streef_pct_week / 100) * weken)
  const minimaal = startGewicht * (1 + (norm.minimaal_pct_week / 100) * weken)
  return {
    doel: Math.round(streef * 10) / 10,
    minimaal: Math.round(Math.max(startGewicht, minimaal) * 10) / 10,
  }
}

// Hoe staat dit punt ervoor? Eén van 'goed' | 'traag' | 'stil'.
//
//   goed  — op of boven het streeftempo
//   traag — vooruit, maar minder dan afgesproken
//   stil  — onder de ondergrens: niet vooruit, of achteruit
//
// De marge in kilo's vangt de stapgrootte van het materiaal op: net onder de
// lijn met dezelfde stang is geen ander verhaal dan net erboven.
export function beoordeel(gewicht, lijnen, norm = KRACHT_NORM) {
  if (!Number.isFinite(gewicht) || !lijnen) return null
  if (gewicht >= lijnen.doel - norm.marge_kg) return 'goed'
  if (gewicht >= lijnen.minimaal - norm.marge_kg) return 'traag'
  return 'stil'
}

export const KLEUR_VOOR = {
  goed: '#10b981',
  traag: '#f59e0b',
  stil: '#ef4444',
}

// De hele reeks doorrekenen: elk punt krijgt zijn band, zijn doel en zijn
// oordeel. Het startpunt is de eerste log — dat is waar deze klant met deze
// oefening begon.
export function metBand(punten, norm = KRACHT_NORM) {
  if (!punten?.length) return []
  const start = punten[0]
  return punten.map(p => {
    const weken = wekenTussen(start.datum, p.datum)
    const l = lijnenOpWeek(weken, start.gewicht, norm)
    return {
      ...p,
      doel: l.doel,
      band: [l.minimaal, l.doel],
      oordeel: beoordeel(p.gewicht, l, norm),
    }
  })
}
