// src/modules/workout/bouwfase/rir.js
//
// RIR-progressie (16 nov 2026, Kersten; model van Israetel). Elke bouwweek een
// doel "herhalingen over" (reps in reserve), aflopend naar bijna-falen. De
// klant ziet het doel per oefening en een voorstel om het te halen; na de
// oefening geeft hij aan hoeveel hij echt over had. Staat per fase aan
// (training_fases.rir_aan); zie rir.sql.
//
// Alles hier is puur rekenwerk, zonder database.

export const RIR_START = 3
export const RIR_KEUZES = [0, 1, 2, 3, 4] // 4 = 4 of meer
export const rirLabel = (n) => (n >= 4 ? '4+' : String(n))

// Weekdoelen voor een fase van `weken` bouwweken: van 3 naar 0, nooit omhoog.
// Een eigen schema van de coach wint als het even lang is.
export function rirSchema(weken, eigen = null) {
  const n = Math.max(1, Number(weken) || 1)
  if (Array.isArray(eigen) && eigen.length === n && eigen.every(x => Number.isInteger(x) && x >= 0 && x <= 4)) return eigen
  if (n === 1) return [1]
  return Array.from({ length: n }, (_, i) => Math.round(RIR_START - (RIR_START * i) / (n - 1)))
}

// Doel van deze week, of null als de progressie uit staat of er geen bouwweek loopt.
export function rirDoel(fase, stand) {
  if (!fase?.rir_aan || stand?.soort !== 'bouw' || !stand.week) return null
  const schema = rirSchema(stand.weken, fase.rir_schema)
  return schema[Math.min(schema.length, stand.week) - 1] ?? null
}

export const rirTekst = (doel) => (doel === 0 ? 'Ga door tot er geen nette herhaling meer bij kan' : `Stop met ${rirLabel(doel)} over`)

// "8-12" → [8, 12]; "10" → [8, 12]; onleesbaar → null.
export function repBereik(reps) {
  const g = String(reps ?? '').match(/\d+/g)
  if (!g) return null
  const a = Number(g[0]), b = Number(g[1] ?? g[0])
  return a === b ? [Math.max(1, a - 2), a + 2] : [Math.min(a, b), Math.max(a, b)]
}

// Beste set van een training (geschatte 1RM).
const kracht = (s) => (Number(s?.weight) || 0) * (1 + (Number(s?.reps) || 0) / 30)
export const besteSet = (sets) => (Array.isArray(sets) ? sets : []).reduce((b, s) => (!b || kracht(s) > kracht(b) || (!kracht(b) && (Number(s?.reps) || 0) > (Number(b?.reps) || 0)) ? s : b), null)

// Voorstel om het doel van deze week te halen, vanuit de vorige keer.
//   vorige     { weight (kg), reps } beste set van de vorige keer
//   rirVorige  hoeveel hij toen over had; onbekend = geen voorstel
//   doel       RIR van deze week
//   bereik     [min, max] herhalingen van de oefening
//   stap       kleinste gewichtsstap in kg
// Regel: gewicht erbij als de stap klein genoeg is om dezelfde herhalingen te
// houden; anders een herhaling erbij. Boven het bereik gaat het gewicht omhoog.
export function rirVoorstel({ vorige, rirVorige, doel, bereik = null, stap = 2.5 }) {
  const w = Number(vorige?.weight) || 0
  const r = Number(vorige?.reps) || 0
  if (!r || doel == null || rirVorige == null) return null
  const totFalen = r + Number(rirVorige)
  // Voorzichtig: hooguit één herhaling erbij per week (twee als het vorige keer
  // echt makkelijk was). Te vroeg te zwaar kost meer dan het oplevert.
  const metReps = Math.max(1, Math.min(totFalen - doel, r + (Number(rirVorige) >= 4 ? 2 : 1)))
  const [min, max] = bereik || [Math.max(1, r - 2), r + 2]
  if (!w) return { soort: metReps > r ? 'reps' : 'gelijk', gewicht: 0, reps: metReps }
  // De gewichtsstap groeit mee met het gewicht (ongeveer 2,5%): een leg press
  // van 200 kg gaat met 5 kg omhoog, een curl van 12 kg met de kleinste stap.
  const sprong = Math.max(stap, Math.round((w * 0.025) / stap) * stap)
  const w2 = w + sprong
  const totFalen2 = 30 * ((w * (1 + totFalen / 30)) / w2 - 1)
  const metGewicht = Math.floor(totFalen2 + 0.3) - doel
  const kleineStap = sprong / w <= 0.07
  // Boven het bereik: gewicht erbij, tenzij de stap zo groot is dat je onder het bereik uitkomt.
  if (metReps > max && metGewicht >= min) return { soort: 'gewicht', gewicht: w2, reps: Math.min(max, metGewicht) }
  if (kleineStap && metGewicht >= r && metGewicht >= min) return { soort: 'gewicht', gewicht: w2, reps: r }
  return { soort: metReps > r ? 'reps' : 'gelijk', gewicht: w, reps: metReps }
}

// Hoe ging het ten opzichte van het doel? Voor de coach.
//   'zwaarder' = doel gehaald maar met minder over dan bedoeld
export function rirOordeel(rir, doel) {
  if (rir == null || doel == null) return null
  if (rir < doel) return 'zwaarder'
  return rir > doel ? 'lichter' : 'op doel'
}
