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

// Richtlijn van Kersten (13 nov 2026): 30 tot 50% van je 1RM, 2 tot 4
// herhalingen, zo snel mogelijk.
export const POWER_PCT = [0.3, 0.5]
export const POWER_REPS = '2-4'

export const POWER_UITLEG = [
  '2 tot 4 herhalingen, elk zo snel en explosief als je kan.',
  'Stop de set zodra je trager wordt. Nooit tot falen.',
  'Neem de volle rust. Je moet fris aan de volgende set beginnen.',
]

// Volgorde = van goed naar slecht. `id` gaat de database in.
export const SNELHEDEN = [
  { id: 'explosief', label: 'Explosief', kleur: '#10b981' },
  { id: 'oke', label: 'Oké', kleur: 'rgba(255,255,255,0.75)' },
  { id: 'traag', label: 'Traag', kleur: '#f59e0b' },
]
// Geschatte 1RM uit gewone sets (Epley). Power-sets tellen niet mee: die zijn
// expres licht en zouden de schatting omlaag trekken. Boven de 12 herhalingen
// wordt de formule te onbetrouwbaar.
export const schat1RM = (rijen = []) => {
  let beste = 0
  for (const rij of rijen) for (const s of rij?.sets || []) {
    const kg = Number(s?.weight) || 0, reps = Number(s?.reps) || 0
    if (s?.snelheid || kg <= 0 || reps < 1 || reps > 12) continue
    beste = Math.max(beste, reps === 1 ? kg : kg * (1 + reps / 30))
  }
  return beste || null
}

// "Bench Press (power)" hoort bij de 1RM van "Bench Press".
export const basisNaam = (naam) => String(naam || '').replace(/[\s\-–(]*\bpower\b\)?\s*$/i, '').trim()

export const snelheidVan = (id) => SNELHEDEN.find(s => s.id === id) || null
