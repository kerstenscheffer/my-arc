// src/modules/manual-workout-builder/spierGroepen.js
//
// Eén spiergroep per oefening (primairSpieren uit het plan), met Nederlandse
// labels. Gedeeld door Planinfo (week) en de dagstats boven de oefeningen.

export const LABEL = {
  chest: 'Borst', back: 'Rug', biceps: 'Biceps', triceps: 'Triceps',
  front_delts: 'Front delts', side_delts: 'Side delts', rear_delts: 'Rear delts',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Billen', calves: 'Kuiten',
  abs: 'Buik', traps: 'Traps', onbekend: 'Geen spiergroep',
  // Oude, grove groepen: blijven leesbaar (oude feedback, oude app-versies).
  shoulders: 'Schouders', legs: 'Benen',
}
// Keuzelijst in de builder: alleen de fijne groepen.
export const KEUZE = ['chest', 'back', 'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'traps']
// Grove groep → de fijne groepen eronder (voor oude herstelantwoorden 'legs'/'shoulders').
export const ONDER = { shoulders: ['front_delts', 'side_delts', 'rear_delts'], legs: ['quads', 'hamstrings'] }

// Nederlandse en afwijkende spelling naar één sleutel.
const GELIJK = {
  borst: 'chest', rug: 'back', schouders: 'shoulders', schouder: 'shoulders', delts: 'shoulders', tricep: 'triceps', bicep: 'biceps',
  benen: 'legs', billen: 'glutes', kuiten: 'calves', calf: 'calves', buik: 'abs', core: 'abs', trap: 'traps',
  quad: 'quads', quadriceps: 'quads', hamstring: 'hamstrings', hams: 'hamstrings',
  'front delts': 'front_delts', 'front delt': 'front_delts', 'side delts': 'side_delts', 'side delt': 'side_delts', 'lateral delts': 'side_delts',
  'rear delts': 'rear_delts', 'rear delt': 'rear_delts', 'achterkant schouder': 'rear_delts', 'zijkant schouder': 'side_delts',
}

// Schouders en benen zijn te grof (10 nov 2026, Kersten): side en rear delts zijn
// totaal verschillend, quads en hamstrings ook. Staat er alleen 'shoulders' of
// 'legs', dan bepaalt de naam van de oefening welke.
const REAR = /rear|reverse (pec|fly)|face.?pull|achter|band pull.?apart|y.?raise|w.?raise/i
const SIDE = /lateral|side|zij|upright|lu.?raise|cable y|egyptian/i
const HAM = /curl|rdl|romanian|stiff|good.?morning|nordic|hamstring|deadlift|glute.?ham|hip hinge/i
export function verfijn(groep, naam = '') {
  if (groep === 'shoulders') return REAR.test(naam) ? 'rear_delts' : SIDE.test(naam) ? 'side_delts' : 'front_delts'
  if (groep === 'legs') return HAM.test(naam) ? 'hamstrings' : 'quads'
  return groep
}

export function spierVan(ex) {
  const ruw = String(ex.primairSpieren || '').split(/[,/]/)[0].trim().toLowerCase()
  if (ruw) return verfijn(GELIJK[ruw] || ruw, ex.name)
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
