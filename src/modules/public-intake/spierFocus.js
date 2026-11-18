// src/modules/public-intake/spierFocus.js
//
// Focusspieren in de intake (18 nov 2026). Volgorde en voorselectie komen uit
// wat mannen en vrouwen gemiddeld willen (RP, "How your clients want to look"):
// vrouwen billen > achterkant benen > bovenbenen > kuiten > buik > rug > schouders,
// armen en borst onderaan; mannen armen > borst > schouders > rug > traps > buik,
// benen daarna, kuiten en billen onderaan. De klant kan alles wegtikken.
// Sleutels zijn vast: het plansysteem stuurt hierop. Opslag:
// user_workout_preferences.split_preferences.focus_spieren / niet_groter.

export const MAX_FOCUS = 3

export const SPIER_LABEL = {
  arms: 'Armen', chest: 'Borst', shoulders: 'Schouders', back: 'Rug', traps: 'Nek en traps',
  abs: 'Buik', quads: 'Bovenbenen', hamstrings: 'Achterkant benen', glutes: 'Billen', calves: 'Kuiten',
}

const MAN = {
  volgorde: ['arms', 'chest', 'shoulders', 'back', 'abs', 'quads', 'traps', 'hamstrings', 'calves', 'glutes'],
  voorkeur: ['shoulders', 'arms', 'chest'],
  sub: {
    arms: 'Biceps en triceps die je mouw vullen',
    chest: 'Volle borst, ook in een shirt zichtbaar',
    shoulders: 'Breder van voren en van opzij',
    back: 'Brede rug, de V-vorm',
    abs: 'Buikspieren die zichtbaar worden als je droger bent',
    quads: 'Sterke bovenbenen',
    traps: 'Stevige nek en bovenrug',
    hamstrings: 'Achterkant van je bovenbenen',
    calves: 'Onderbenen',
    glutes: 'Groeien al mee met je beentraining',
  },
  nietGroter: ['quads', 'glutes', 'traps', 'calves'],
}

const VROUW = {
  volgorde: ['glutes', 'hamstrings', 'quads', 'abs', 'back', 'shoulders', 'calves', 'arms', 'chest'],
  voorkeur: ['glutes', 'hamstrings', 'abs'],
  sub: {
    glutes: 'Ronder en steviger',
    hamstrings: 'Tilt je billen op en maakt je benen strakker',
    quads: 'Strakke, sterke bovenbenen',
    abs: 'Strakke buik met een lijntje',
    back: 'Maakt je taille smaller, mooi in een open rug',
    shoulders: 'Ronde schouders, mooie lijn naar je armen',
    calves: 'Mooie vorm in je onderbeen',
    arms: 'Strakke armen',
    chest: 'Borstspieren',
  },
  nietGroter: ['shoulders', 'arms', 'chest', 'quads', 'calves'],
}

// Geslacht onbekend: alles tonen, niets voorgeselecteerd.
const NEUTRAAL = {
  volgorde: ['glutes', 'quads', 'hamstrings', 'abs', 'back', 'shoulders', 'chest', 'arms', 'calves'],
  voorkeur: [],
  sub: {},
  nietGroter: ['shoulders', 'arms', 'chest', 'quads', 'calves', 'glutes'],
}

export function spierFocusVoor(gender) {
  const g = String(gender || '').toLowerCase()
  if (['male', 'man', 'm'].includes(g)) return MAN
  if (['female', 'vrouw', 'v', 'f'].includes(g)) return VROUW
  return NEUTRAAL
}

export const spierNamen = (lijst) =>
  (Array.isArray(lijst) ? lijst : []).map(k => SPIER_LABEL[k] || k).join(', ')
