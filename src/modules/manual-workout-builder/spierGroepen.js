// src/modules/manual-workout-builder/spierGroepen.js
//
// Eén spiergroep per oefening (primairSpieren uit het plan), met Nederlandse
// labels. Gedeeld door Planinfo (week) en de dagstats boven de oefeningen.

export const LABEL = {
  chest: 'Borst', back: 'Rug', shoulders: 'Schouders', biceps: 'Biceps', triceps: 'Triceps',
  legs: 'Benen', glutes: 'Billen', calves: 'Kuiten', abs: 'Buik', traps: 'Traps', onbekend: 'Geen spiergroep',
}
// Nederlandse en afwijkende spelling naar één sleutel.
const GELIJK = {
  borst: 'chest', rug: 'back', schouders: 'shoulders', schouder: 'shoulders', tricep: 'triceps', bicep: 'biceps',
  benen: 'legs', billen: 'glutes', kuiten: 'calves', calf: 'calves', buik: 'abs', core: 'abs', trap: 'traps',
}

export function spierVan(ex) {
  const ruw = String(ex.primairSpieren || '').split(/[,/]/)[0].trim().toLowerCase()
  if (ruw) return GELIJK[ruw] || ruw
  // Geen spier ingevuld: een paar namen herkennen we zelf.
  const n = String(ex.name || '').toLowerCase()
  if (/cr?h?un?s?ch|sit.?up|zit.?up|plank|leg raise/.test(n)) return 'abs'
  return 'onbekend'
}

export const spierLabel = (k) => LABEL[k] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : '')

// [[spier, sets], ...] van veel naar weinig. Cardio en 0 sets tellen niet.
export function setsPerSpierDag(exercises = []) {
  const t = {}
  for (const ex of exercises) {
    if (ex.type === 'cardio') continue
    const s = Number(ex.sets) || 0
    if (!s) continue
    const k = spierVan(ex)
    t[k] = (t[k] || 0) + s
  }
  return Object.entries(t).sort((a, b) => b[1] - a[1])
}
