// src/modules/weight-tracker/utils/weightGoalColor.js
// Doel-bewuste kleuring van gewicht-veranderingen.
//
// De coach zet een wekelijks gewichtsdoel per client op `clients.weekly_weight_goal`
// (numeric, kg/week). Positief = aankomen (bulk), negatief = afvallen (cut).
//
// Een gewicht-verandering is GROEN wanneer die de goede kant op beweegt t.o.v. het
// doel (zelfde teken als het doel), ROOD wanneer de verkeerde kant op, en NEUTRAAL
// bij geen verandering of geen data.
//
// Zonder ingesteld doel vallen we terug op het klassieke gedrag "afvallen = groen".

export const WEIGHT_GREEN = '#10b981'
export const WEIGHT_RED = '#ef4444'
export const WEIGHT_NEUTRAL = 'rgba(255,255,255,0.4)'

// 'green' | 'red' | 'neutral'
export function weightGoalStatus(delta, weeklyGoal) {
  if (delta == null || !Number.isFinite(Number(delta)) || Number(delta) === 0) return 'neutral'
  const d = Number(delta)
  const goal = Number(weeklyGoal)
  if (!goal || !Number.isFinite(goal)) {
    // Geen doel gezet → klassiek: afvallen goed, aankomen slecht.
    return d < 0 ? 'green' : 'red'
  }
  return Math.sign(d) === Math.sign(goal) ? 'green' : 'red'
}

export function weightGoalColor(delta, weeklyGoal, neutral = WEIGHT_NEUTRAL) {
  const status = weightGoalStatus(delta, weeklyGoal)
  return status === 'green' ? WEIGHT_GREEN : status === 'red' ? WEIGHT_RED : neutral
}
