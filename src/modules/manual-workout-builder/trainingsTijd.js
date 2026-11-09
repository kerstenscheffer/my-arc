// src/modules/manual-workout-builder/trainingsTijd.js
//
// Tijdsregel van Kersten (9 nov 2026), ruim genomen: een oefening met 2 sets kost
// 9 minuten inclusief warming-up, rust en wisselen. Elke set erboven kost 3
// minuten (45 s werk + 2 min rust, afgerond). Getoetst aan 107 echte trainingen:
// mediaan 47 min voor 6 oefeningen / 12 sets.

export const MIN_PER_OEFENING = 9   // 2 sets, alles erbij
export const MIN_PER_EXTRA_SET = 3

export function minutenVoorOefening(ex) {
  if (ex?.type === 'cardio') return parseInt(ex.duration, 10) || 0
  const sets = Number(ex?.sets) || 2
  return MIN_PER_OEFENING + Math.max(-1, sets - 2) * MIN_PER_EXTRA_SET
}

export function minutenVoorOefeningen(exercises = []) {
  return Math.round(exercises.reduce((n, ex) => n + minutenVoorOefening(ex), 0))
}
