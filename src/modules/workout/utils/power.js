// src/modules/workout/utils/power.js
//
// Power-oefeningen (13 nov 2026, Kersten): explosief werk dat bovenop de
// gewone training komt. In het plan is het een gewone oefening met
// `power: true`; oudere app-versies kennen het veld niet en tonen hem als
// gewone oefening. Loggen blijft gewicht x herhalingen, plus per set hoe snel
// het ging (`snelheid` in workout_progress.sets). Geen partials, geen
// dropsets, geen "je kan omhoog" en geen bouwfase-vragen: power gaat om
// snelheid, niet om uitputting.

export const isPower = (ex) => !!ex?.power

export const POWER_UITLEG = [
  'Elke herhaling zo snel en explosief als je kan.',
  'Stop de set zodra je trager wordt. Nooit tot falen.',
  'Neem de volle rust. Je moet fris aan de volgende set beginnen.',
]

// Volgorde = van goed naar slecht. `id` gaat de database in.
export const SNELHEDEN = [
  { id: 'explosief', label: 'Explosief', kleur: '#10b981' },
  { id: 'oke', label: 'Oké', kleur: 'rgba(255,255,255,0.75)' },
  { id: 'traag', label: 'Traag', kleur: '#f59e0b' },
]
export const snelheidVan = (id) => SNELHEDEN.find(s => s.id === id) || null
