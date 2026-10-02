// src/modules/manual-workout-builder/dagTitel.js
//
// Titel en spiergroep-regel voor een dag afleiden uit de oefeningen erin, in
// dezelfde vorm als de standaardplannen: "Push", "Pull", "Legs", "Upper borst",
// "Upper rug", "Full body". De coach hoeft dan alleen nog bij te schaven.
//
// De regels zijn simpel en bewust: welke spiergroepen zitten erin, en in
// welke verhouding. Geen slimmigheden die soms raak en soms mis zijn —
// een voorstel dat je begrijpt, kun je ook vertrouwen.

const NL = {
  chest: 'Borst', back: 'Rug', shoulders: 'Schouders', biceps: 'Biceps',
  triceps: 'Triceps', legs: 'Benen', glutes: 'Billen', calves: 'Kuiten',
  core: 'Core', abs: 'Buik', traps: 'Traps', hamstrings: 'Hamstrings', quads: 'Quads',
}

const PUSH = new Set(['chest', 'shoulders', 'triceps'])
const PULL = new Set(['back', 'biceps', 'traps'])
const BENEN = new Set(['legs', 'glutes', 'calves', 'hamstrings', 'quads'])
const ROMP = new Set(['core', 'abs'])

const groep = (ex) => String(ex?.primairSpieren || ex?.muscleGroup || ex?.muscle || '').toLowerCase().trim()

/**
 * @param {Array} exercises  de oefeningen van een dag
 * @returns {{ name: string, focus: string } | null}  null als er niets af te leiden valt
 */
export function voorstelDag(exercises) {
  const lijst = Array.isArray(exercises) ? exercises : []
  if (lijst.length === 0) return null

  const cardio = lijst.filter(ex => ex?.type === 'cardio').length
  if (cardio === lijst.length) return { name: 'Cardio', focus: 'Cardio' }

  const tel = {}
  for (const ex of lijst) {
    const g = groep(ex)
    if (!g || ex?.type === 'cardio') continue
    tel[g] = (tel[g] || 0) + 1
  }
  const groepen = Object.keys(tel)
  if (groepen.length === 0) return null

  const som = (set) => groepen.filter(g => set.has(g)).reduce((s, g) => s + tel[g], 0)
  const push = som(PUSH), pull = som(PULL), benen = som(BENEN)
  const boven = push + pull
  // Buik telt niet mee voor de naam: Leg Raises aan het eind maakt van een
  // push-dag geen full body.
  const totaal = push + pull + benen

  let name
  if (benen > 0 && boven > 0 && benen >= totaal * 0.25) name = 'Full body'
  else if (benen > 0 && boven === 0) name = 'Legs'
  else if (push > 0 && pull === 0) name = 'Push'
  else if (pull > 0 && push === 0) name = 'Pull'
  else if (push > pull) name = 'Upper borst'
  else if (pull > push) name = 'Upper rug'
  else name = 'Upper'

  // Spiergroep-regel: op volgorde van hoe vaak ze voorkomen, in het Nederlands.
  const focus = groepen
    .sort((a, b) => tel[b] - tel[a])
    .filter(g => !ROMP.has(g) || groepen.length <= 2)
    .map(g => NL[g] || g.charAt(0).toUpperCase() + g.slice(1))
    .join(', ')

  return { name, focus }
}

// Plannaam in de vorm van de standaardplannen: "MY ARC · 3× PPL (gym)",
// "MY ARC · 4× Upper / Lower (thuis)". Het patroon komt uit de dagnamen, de
// locatie uit het materiaal: staat er nergens een barbell, kabel, machine of
// schijf in, dan is het een thuisplan.
const GYM_MATERIAAL = /barbell|cable|kabel|machine|plates|smith|leg press|hack/i

export function voorstelPlan(days) {
  const lijst = Array.isArray(days) ? days : []
  const n = lijst.length
  if (n === 0) return ''
  const oefeningen = lijst.flatMap(d => Array.isArray(d?.exercises) ? d.exercises : [])
  const locatie = oefeningen.some(ex => GYM_MATERIAAL.test(String(ex?.equipment || ''))) ? 'gym' : 'thuis'
  const namen = lijst.map(d => String(d?.name || '').toLowerCase())
  const heeft = (w) => namen.some(x => x.startsWith(w))
  const alle = (f) => namen.every(f)

  let label
  if (alle(x => x.startsWith('full body'))) label = 'Full body'
  else if (heeft('push') && heeft('pull') && heeft('legs') && alle(x => /^(push|pull|legs)/.test(x))) label = n === 3 ? 'PPL' : 'PPL-' + namen.slice(3).map(x => x[0].toUpperCase()).join('')
  else if (alle(x => /^(upper|legs|lower)/.test(x))) label = 'Upper / Lower'
  else label = 'training'

  return `MY ARC · ${n}× ${label} (${locatie})`
}
