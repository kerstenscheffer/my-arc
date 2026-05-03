// src/modules/workout/constants/attachments.js

export const ATTACHMENTS = [
  {
    id: 'double_d',
    name: 'Double D Handle',
    nl: 'Double D handle',
    img: 'https://i.ibb.co/XkjK8vvs/Dubble-d-handles.jpg',
    category: 'cable'
  },
  {
    id: 'rope',
    name: 'Rope',
    nl: 'Touw',
    img: 'https://i.ibb.co/KcjYNfgw/Rope.png',
    category: 'cable'
  },
  {
    id: 'handle',
    name: 'Single Handle',
    nl: 'Enkele handel',
    img: 'https://i.ibb.co/gQr4499/Single-handle.jpg',
    category: 'cable'
  },
  {
    id: 'vbar',
    name: 'V-Bar',
    nl: 'V-Handle',
    img: 'https://i.ibb.co/5hKhYMRR/V-handle.jpg',
    category: 'cable'
  },
  {
    id: 'straight_bar',
    name: 'Straight Bar',
    nl: 'Rechte stang',
    img: 'https://i.ibb.co/WWvpG26v/Straight-bar.webp',
    category: 'cable'
  },
  {
    id: 'ez_bar',
    name: 'EZ Bar',
    nl: 'EZ Bar',
    img: 'https://i.ibb.co/8L8DxNdW/ez-bar.png',
    category: 'bar'
  },
  {
    id: 'lat_bar',
    name: 'Lat Bar',
    nl: 'Lat pulldown stang',
    img: 'https://i.ibb.co/b5YfHpY1/Lat-pulldown-bar-normaal.webp',
    category: 'cable'
  },
  {
    id: 'lat_bar_narrow',
    name: 'Lat Bar Narrow Grip',
    nl: 'Lat bar narrow grip',
    img: 'https://i.ibb.co/BHZDY9Bn/Lat-pulldown-nice-grip-bar.webp',
    category: 'cable'
  },
  {
    id: 'dumbbell',
    name: 'Dumbbell',
    nl: 'Dumbbell',
    img: 'https://i.ibb.co/DH4zmr0z/Dumbell.png',
    category: 'free'
  },
  {
    id: 'barbell',
    name: 'Barbell',
    nl: 'Barbell',
    img: 'https://i.ibb.co/9mvNbWdp/bar.webp',
    category: 'free'
  },
  {
    id: 'machine',
    name: 'Machine',
    nl: 'Machine',
    img: 'https://i.ibb.co/Xkzb4Sqf/Machine.jpg',
    category: 'machine'
  },
  {
    id: 'bodyweight',
    name: 'Bodyweight',
    nl: 'Eigen gewicht',
    img: 'https://i.ibb.co/yFTCNGvJ/Bodyweight.jpg',
    category: 'bodyweight'
  },
  {
    id: 'cable_machine',
    name: 'Cable Machine',
    nl: 'Kabelapparaat',
    img: 'https://i.ibb.co/84gXVTFH/Cable-machine.jpg',
    category: 'cable'
  },
  {
    id: 'band',
    name: 'Resistance Band',
    nl: 'Weerstandsband',
    img: 'https://i.ibb.co/Y7sy84xV/Resistan-band.webp',
    category: 'band'
  },
  {
    id: 'kettlebell',
    name: 'Kettlebell',
    nl: 'Kettlebell',
    img: 'https://i.ibb.co/x8SDQN70/Kettle-bel.jpg',
    category: 'free'
  }
]

export const getAttachment = (id) => ATTACHMENTS.find(a => a.id === id) || null

export const ATTACHMENT_CATEGORIES = [
  { id: 'cable', label: 'Kabel' },
  { id: 'free', label: 'Vrij gewicht' },
  { id: 'machine', label: 'Machine' },
  { id: 'bar', label: 'Stang' },
  { id: 'bodyweight', label: 'Eigen gewicht' },
  { id: 'band', label: 'Band' }
]

// Standaard attachment + beschikbare opties per oefening (op naam keywords)
export const EXERCISE_ATTACHMENT_DEFAULTS = [
  // Tricep
  { keywords: ['tricep pushdown', 'pushdown', 'tricep press'], default: 'rope', available: ['rope', 'straight_bar', 'vbar', 'double_d', 'handle'] },
  { keywords: ['tricep extension', 'overhead tricep'], default: 'rope', available: ['rope', 'double_d', 'handle'] },
  { keywords: ['skull crusher'], default: 'ez_bar', available: ['ez_bar', 'barbell', 'dumbbell'] },

  // Bicep
  { keywords: ['curl', 'bicep curl'], default: 'ez_bar', available: ['ez_bar', 'barbell', 'dumbbell', 'handle', 'rope', 'straight_bar'] },
  { keywords: ['hammer curl'], default: 'dumbbell', available: ['dumbbell', 'rope'] },

  // Rug / back
  { keywords: ['lat pulldown', 'pulldown'], default: 'lat_bar', available: ['lat_bar', 'lat_bar_narrow', 'double_d', 'straight_bar', 'handle'] },
  { keywords: ['seated row', 'cable row', 'roeien'], default: 'double_d', available: ['double_d', 'handle', 'straight_bar', 'vbar', 'lat_bar'] },
  { keywords: ['pull up', 'chin up', 'pull-up'], default: 'bodyweight', available: ['bodyweight'] },
  { keywords: ['deadlift', 'deadlift'], default: 'barbell', available: ['barbell', 'dumbbell', 'kettlebell'] },

  // Borst / chest
  { keywords: ['bench press', 'chest press', 'borst press'], default: 'barbell', available: ['barbell', 'dumbbell', 'machine'] },
  { keywords: ['fly', 'chest fly', 'cable fly', 'vlinder'], default: 'handle', available: ['handle', 'cable_machine'] },
  { keywords: ['push up', 'pushup'], default: 'bodyweight', available: ['bodyweight', 'band'] },

  // Schouder / shoulder
  { keywords: ['shoulder press', 'overhead press', 'military press'], default: 'barbell', available: ['barbell', 'dumbbell', 'machine'] },
  { keywords: ['lateral raise', 'zijwaarts'], default: 'dumbbell', available: ['dumbbell', 'handle', 'cable_machine', 'band'] },
  { keywords: ['face pull'], default: 'rope', available: ['rope', 'double_d'] },
  { keywords: ['front raise'], default: 'dumbbell', available: ['dumbbell', 'barbell', 'handle', 'band'] },

  // Benen / legs
  { keywords: ['squat'], default: 'barbell', available: ['barbell', 'dumbbell', 'machine', 'bodyweight', 'kettlebell'] },
  { keywords: ['leg press'], default: 'machine', available: ['machine'] },
  { keywords: ['leg curl', 'hamstring curl', 'lying curl'], default: 'machine', available: ['machine', 'band'] },
  { keywords: ['leg extension'], default: 'machine', available: ['machine'] },
  { keywords: ['calf raise', 'kuit'], default: 'machine', available: ['machine', 'dumbbell', 'barbell', 'bodyweight'] },
  { keywords: ['lunge', 'uitval'], default: 'dumbbell', available: ['dumbbell', 'barbell', 'bodyweight', 'kettlebell'] },
  { keywords: ['hip thrust', 'glute bridge'], default: 'barbell', available: ['barbell', 'dumbbell', 'machine', 'band'] },
  { keywords: ['adductor', 'hip adductor'], default: 'machine', available: ['machine', 'band', 'cable_machine'] },
  { keywords: ['abductor', 'hip abductor'], default: 'machine', available: ['machine', 'band', 'cable_machine'] },

  // Core
  { keywords: ['crunch', 'sit up', 'ab'], default: 'bodyweight', available: ['bodyweight', 'machine', 'cable_machine', 'band'] },
  { keywords: ['plank'], default: 'bodyweight', available: ['bodyweight', 'band'] },
  { keywords: ['cable crunch'], default: 'rope', available: ['rope', 'straight_bar'] },
]

// Zoek standaard attachment voor een oefening op naam
export const getExerciseAttachmentDefaults = (exerciseName) => {
  if (!exerciseName) return null
  const name = exerciseName.toLowerCase()
  const match = EXERCISE_ATTACHMENT_DEFAULTS.find(rule =>
    rule.keywords.some(keyword => name.includes(keyword))
  )
  return match || null
}
