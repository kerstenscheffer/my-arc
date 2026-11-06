// src/modules/business-os/callBladData.js
// Blokken van Gino's call-voorbereiding (skill Call-voorbereiding). Los van
// CallBlad.jsx omdat een componentbestand alleen componenten mag exporteren.

export const BLOKKEN = [
  ['doel', 'Doel'],
  ['gewicht', 'Gewicht'],
  ['training', 'Training'],
  ['voeding', 'Voeding'],
  ['sinds', 'Sinds de vorige call'],
  ['struggles', 'Struggles en oude issues'],
  ['open', 'Open punten'],
  ['randzaken', 'Randzaken'],
  ['vragen', 'Bespreken'],
]

export const heeft = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '')

export const callHeeftInhoud = (call) => !!call && BLOKKEN.some(([id]) => heeft(call[id]))
