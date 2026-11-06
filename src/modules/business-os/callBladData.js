// src/modules/business-os/callBladData.js
// Blokken van Gino's call-voorbereiding (skill Call-voorbereiding), in de
// volgorde van de call. Los van CallBlad.jsx omdat een componentbestand alleen
// componenten mag exporteren.
//
// vast: regels die er altijd staan, ook zonder data van Gino (de vragen die
// Kersten elke call stelt). Alleen blokken met vast of met data worden getoond.

export const BLOKKEN = [
  { id: 'doel', titel: 'Doel' },
  { id: 'hoe', titel: 'Hoe gaat het', vast: ['Vraag: Hoe gaat het, hoe zit je erin?'] },
  { id: 'gewicht', titel: 'Gewicht' },
  { id: 'voeding', titel: 'Voeding' },
  { id: 'training', titel: 'Training' },
  { id: 'goed', titel: 'Goed bezig' },
  { id: 'sinds', titel: 'Sinds de vorige call' },
  { id: 'struggles', titel: 'Struggles en oude issues' },
  { id: 'open', titel: 'Open punten' },
  { id: 'randzaken', titel: 'Randzaken' },
  { id: 'vragen', titel: 'Bespreken' },
  { id: 'komende_week', titel: 'Komende week', vast: ['Vraag: Wat ga je komende week concreet doen? Is het helder?'] },
  { id: 'afsluiten', titel: 'Afsluiten', vast: ['Vraag: Nog vragen of iets onduidelijk?'] },
]

export const heeft = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '')

const DATA_BLOKKEN = BLOKKEN.map(b => b.id).concat('volgende_call')
export const callHeeftInhoud = (call) => !!call && DATA_BLOKKEN.some(id => heeft(call[id]))
