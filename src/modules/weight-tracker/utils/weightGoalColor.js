// src/modules/weight-tracker/utils/weightGoalColor.js
// Doel-bewuste kleuring van gewicht-veranderingen.
//
// Een verandering is GROEN als die de kant op gaat die de klant wil, ROOD als
// die de verkeerde kant op gaat, en NEUTRAAL als er geen richting te bepalen
// valt (of als de richting er niet toe doet, zoals bij recomp/onderhoud).
//
// De richting komt uit twee velden op `clients`:
//
//   1. `primary_goal`        — leidend. cut/fat_loss → omlaag, bulk/muscle_gain
//                              → omhoog, recomp/maintain → geen oordeel.
//   2. `weekly_weight_goal`  — alleen als terugval wanneer primary_goal niets
//                              zegt. Het teken van dit veld is in de praktijk
//                              onbetrouwbaar: coaches vullen er een grootte in
//                              ("1 kg per week") ook bij een cut, waardoor een
//                              afvaller +1,00 kan hebben staan. Daarom mag dit
//                              veld primary_goal nooit overrulen.
//
// Zonder allebei vallen we terug op het klassieke gedrag "afvallen = groen".

import { normalizeGoal } from '../../macros/macroRules'

export const WEIGHT_GREEN = '#10b981'
export const WEIGHT_RED = '#ef4444'
export const WEIGHT_NEUTRAL = 'rgba(255,255,255,0.4)'

// Welke kant het gewicht op moet: -1 omlaag, +1 omhoog, 0 maakt niet uit,
// null = onbekend.
const RICHTING_PER_DOEL = { cut: -1, bulk: 1, recomp: 0, maintain: 0 }

export function goalDirection(primaryGoal, weeklyGoal) {
  const ruw = String(primaryGoal || '').trim()
  const uitDoel = ruw ? RICHTING_PER_DOEL[normalizeGoal(ruw)] : null

  // Een expliciete cut of bulk is doorslaggevend.
  if (uitDoel === -1 || uitDoel === 1) return uitDoel

  // Recomp/onderhoud: pas als er een wekelijks doel staat is er alsnog een
  // richting bedoeld (bijv. recomp met +0,3 kg/week).
  const wk = Number(weeklyGoal)
  if (Number.isFinite(wk) && wk !== 0) return Math.sign(wk)

  if (uitDoel === 0) return 0
  return null
}

// `doel` mag een getal zijn (het wekelijkse doel in kg/week) óf een client-rij;
// bij een client-rij worden primary_goal en weekly_weight_goal allebei gelezen.
function leesDoel(doel) {
  if (doel && typeof doel === 'object') {
    return { primaryGoal: doel.primary_goal, weeklyGoal: doel.weekly_weight_goal }
  }
  return { primaryGoal: null, weeklyGoal: doel }
}

// 'green' | 'red' | 'neutral'
export function weightGoalStatus(delta, doel) {
  if (delta == null || !Number.isFinite(Number(delta)) || Number(delta) === 0) return 'neutral'
  const d = Number(delta)
  const { primaryGoal, weeklyGoal } = leesDoel(doel)
  const richting = goalDirection(primaryGoal, weeklyGoal)

  // Geen richting bekend → klassiek: afvallen goed, aankomen slecht.
  if (richting === null) return d < 0 ? 'green' : 'red'

  // Richting bewust neutraal (recomp/onderhoud zonder weekdoel): elke kant op
  // bewegen is geen fout, dus geen rood.
  if (richting === 0) return 'neutral'

  return Math.sign(d) === richting ? 'green' : 'red'
}

export function weightGoalColor(delta, doel, neutral = WEIGHT_NEUTRAL) {
  const status = weightGoalStatus(delta, doel)
  return status === 'green' ? WEIGHT_GREEN : status === 'red' ? WEIGHT_RED : neutral
}
