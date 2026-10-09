// src/modules/workout/utils/extraTrainingen.js
//
// Twee (of meer) trainingen op één dag. Het rooster is {Dag: sleutel}; een
// tweede training staat onder een gereserveerde sleutel 'Dag#2', 'Dag#3'.
// Alles wat per dag kijkt (schedule['Thursday']) ziet alleen de eerste;
// alles wat over de waarden loopt (custom-workouts laden, tellen) ziet ze
// allemaal. Zo hoefden de 23 plekken die het rooster lezen niet om.

export const isExtraSleutel = (k) => /#\d+$/.test(String(k || ''))
export const dagVanSleutel = (k) => String(k || '').replace(/#\d+$/, '')

// Sleutels van de extra trainingen van een dag, in volgorde.
export function extraSleutels(schedule, day) {
  if (!schedule) return []
  return Object.keys(schedule)
    .filter(k => k.startsWith(`${day}#`) && schedule[k])
    .sort((a, b) => Number(a.split('#')[1]) - Number(b.split('#')[1]))
}

// Alle trainingen van een dag: eerst de hoofdtraining, dan de extra's.
export function trainingenVanDag(schedule, day) {
  if (!schedule) return []
  return [schedule[day], ...extraSleutels(schedule, day).map(k => schedule[k])].filter(Boolean)
}

// Training erbij op een dag: is de dag nog leeg, dan wordt het de
// hoofdtraining; anders de volgende vrije extra-sleutel.
export function voegTrainingToe(schedule, day, workoutKey) {
  const next = { ...(schedule || {}) }
  if (!next[day]) { next[day] = workoutKey; return next }
  if (trainingenVanDag(next, day).includes(workoutKey)) return next
  let n = 2
  while (next[`${day}#${n}`]) n++
  next[`${day}#${n}`] = workoutKey
  return next
}

// Eén training van een dag weg. Zonder sleutel: de hoofdtraining; schuift
// de eerste extra dan door naar hoofdtraining.
export function verwijderTrainingVanDag(schedule, day, rosterKey = null) {
  const next = { ...(schedule || {}) }
  const sleutel = rosterKey || day
  delete next[sleutel]
  if (sleutel === day) {
    const [eerste, ...rest] = extraSleutels(next, day)
    if (eerste) { next[day] = next[eerste]; delete next[eerste] }
    rest.forEach(k => { /* laten staan; nummering hoeft niet aaneengesloten */ void k })
  }
  return next
}
