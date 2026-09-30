// src/modules/workout/components/todays-workout/opwarmen.js
//
// De opwarmsets uitrekenen uit het werkgewicht.
//
// De methode komt uit de uitlegvideo van de coach en is bewust een percentage
// van je werkgewicht, niet een vast schema: 20 kg opwarmen betekent iets heel
// anders als je werkset 40 kg is dan wanneer die 140 kg is.
//
//   50% van je werkgewicht  →  8 tot 12 herhalingen
//   75% van je werkgewicht  →  ongeveer 4 herhalingen
//   net onder je werkgewicht →  1 tot 2 herhalingen, om het aan te voelen
//
// Die laatste is optioneel: sommigen springen na 75% meteen naar hun werkset.
// Dat staat er ook zo bij, want een stap die je niet nodig hebt kost energie
// die je in je werkset wilde stoppen — precies wat de video zegt te vermijden.

// Schijven komen in stappen van 2,5 kg (of 5 lb). Een opwarmset van 23,7 kg
// bestaat niet, en een getal dat je niet op de stang kunt leggen maakt het
// advies ongeloofwaardig.
const STAP = { kg: 2.5, lb: 5 }

export function rondAf(gewicht, eenheid = 'kg') {
  const stap = STAP[eenheid] || 2.5
  const n = Number(gewicht)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n / stap) * stap
}

// Hoeveel je onder je werkgewicht gaat zitten voor die laatste voelset.
// "Een paar kilo" uit de video; bij zware oefeningen is een paar kilo relatief
// niets, dus het schaalt mee maar blijft minstens één schijf.
const netEronder = (werkgewicht, eenheid) => {
  const stap = STAP[eenheid] || 2.5
  const af = Math.max(stap * 2, rondAf(werkgewicht * 0.1, eenheid))
  return Math.max(stap, rondAf(werkgewicht - af, eenheid))
}

/**
 * De opwarmsets voor een werkgewicht.
 *
 * @param {number} werkgewicht  wat je vandaag in je werkset gaat doen
 * @param {string} eenheid      'kg' of 'lb'
 * @returns {Array<{ id, gewicht, reps, label, optioneel }>}
 */
export function opwarmSets(werkgewicht, eenheid = 'kg') {
  const w = Number(werkgewicht)
  if (!Number.isFinite(w) || w <= 0) return []

  const sets = [
    { id: 'p50', gewicht: rondAf(w * 0.5, eenheid), reps: '8-12', label: '50% van je werkgewicht', optioneel: false },
    { id: 'p75', gewicht: rondAf(w * 0.75, eenheid), reps: '4', label: '75% van je werkgewicht', optioneel: false },
    { id: 'voel', gewicht: netEronder(w, eenheid), reps: '1-2', label: 'Net onder je werkgewicht', optioneel: true },
  ]

  // Bij een licht werkgewicht vallen de stappen op elkaar na afronden. Twee
  // keer dezelfde kilo's opwarmen is onzin, dus die gooien we eruit.
  const gezien = new Set()
  return sets.filter(s => {
    if (s.gewicht <= 0 || s.gewicht >= w) return false
    if (gezien.has(s.gewicht)) return false
    gezien.add(s.gewicht)
    return true
  })
}

// Onthouden dat iemand voor déze oefening vandaag al door de opwarmvraag is
// geweest, zodat hij bij set 2 en 3 niet opnieuw wordt gevraagd. Per dag, want
// morgen train je koud opnieuw.
//
// In localStorage en niet in de database: dit is een gemak voor deze telefoon,
// geen gegeven waar de coach iets aan heeft. Kan dus ook gerust leeg terugkomen.
const sleutel = (oefening) => {
  const dag = new Date().toISOString().slice(0, 10)
  return `myarc:opgewarmd:${dag}:${String(oefening || '').toLowerCase().trim()}`
}

export function isOpgewarmd(oefening) {
  try { return localStorage.getItem(sleutel(oefening)) === '1' }
  catch { return false }
}

export function zetOpgewarmd(oefening) {
  try { localStorage.setItem(sleutel(oefening), '1') }
  catch { /* privémodus of geblokkeerde opslag: dan vraagt hij nog eens. */ }
}
