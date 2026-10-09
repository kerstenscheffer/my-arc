// src/modules/workout/utils/trainingFilters.js
//
// Filters voor "Training toevoegen": thuis of gym, en spiergroep. Afgeleid
// uit wat er al in een trainingsdag staat (equipment en primairSpieren per
// oefening, plus de naam van de dag of het plan), dus zonder extra velden.

const THUIS_MATERIAAL = new Set(['bodyweight', 'dumbbells', 'dumbbell', 'kettlebell', 'band', 'bands', 'resistance band', 'mat', 'none', '', 'pull-up bar', 'bench'])

const spierVan = (e) => String(e?.primairSpieren || e?.primair_spieren || e?.muscle_group || '').toLowerCase()

// 'thuis' als alle oefeningen zonder gymapparatuur kunnen, of als de naam het
// zegt; anders 'gym'. Zonder oefeningen beslist de naam, anders 'gym'.
export function locatieVan(w, plan = '') {
  const naam = `${w?.name || ''} ${w?.focus || ''} ${plan || ''}`.toLowerCase()
  if (/thuis|home/.test(naam)) return 'thuis'
  const oef = Array.isArray(w?.exercises) ? w.exercises : []
  if (oef.length === 0) return 'gym'
  return oef.every(e => THUIS_MATERIAAL.has(String(e?.equipment || '').toLowerCase().trim())) ? 'thuis' : 'gym'
}

export const SPIERGROEPEN = [
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'benen', label: 'Benen' },
  { id: 'core', label: 'Core' },
  { id: 'full', label: 'Full body' },
]

const GROEP_VAN_SPIER = (s) => {
  if (/chest|borst|shoulder|schouder|tricep/.test(s)) return 'push'
  if (/back|rug|lat|bicep|trap|rear/.test(s)) return 'pull'
  if (/leg|been|quad|ham|glute|bil|calf|calves|kuit/.test(s)) return 'benen'
  if (/abs|core|buik/.test(s)) return 'core'
  return null
}

// De groepen waar een dag bij hoort. Naam eerst (Push, Pull, Legs, Full
// body), anders de oefeningen: komen er drie of meer groepen in voor, dan
// is het een full body; anders elke groep met minstens twee oefeningen.
export function spiergroepenVan(w) {
  const naam = `${w?.name || ''} ${w?.focus || ''}`.toLowerCase()
  const uitNaam = new Set()
  if (/full|hele lichaam|total/.test(naam)) uitNaam.add('full')
  if (/push|borst|chest|schouder|shoulder/.test(naam)) uitNaam.add('push')
  if (/pull|rug|back/.test(naam)) uitNaam.add('pull')
  if (/leg|benen|been|lower|onder/.test(naam)) uitNaam.add('benen')
  if (/core|abs|buik/.test(naam)) uitNaam.add('core')
  if (/upper|boven/.test(naam)) { uitNaam.add('push'); uitNaam.add('pull') }
  if (uitNaam.size) return uitNaam

  const telling = {}
  for (const e of (Array.isArray(w?.exercises) ? w.exercises : [])) {
    const g = GROEP_VAN_SPIER(spierVan(e))
    if (g) telling[g] = (telling[g] || 0) + 1
  }
  const groepen = Object.keys(telling)
  const uit = new Set(groepen.filter(g => telling[g] >= 2))
  if (groepen.filter(g => g !== 'core').length >= 3) uit.add('full')
  return uit
}
