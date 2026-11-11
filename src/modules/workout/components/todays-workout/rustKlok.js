// src/modules/workout/components/todays-workout/rustKlok.js
//
// De lopende rustklok, los van het scherm van één oefening. Hij start als je
// een set logt en loopt door als je naar een andere oefening gaat, het
// log-scherm sluit, een video bekijkt of de app herstart.
//
// Een eindtijd en geen teller: zet de telefoon zijn scherm uit, dan lopen
// intervallen achter en klopt de resterende tijd niet meer bij terugkomst.

import { useEffect, useState, useSyncExternalStore } from 'react'

const SLEUTEL = 'myarc.rust.klok'
// Hoe lang hij na nul doortelt: zo zie je de echte tijd tussen twee sets, maar
// blijft de balk niet de rest van de dag staan.
const NAIJLEN_SEC = 5 * 60
const MAX_LEEFTIJD_MS = 2 * 60 * 60 * 1000

export const secondenOver = (k) =>
  k.pauzeOver != null ? k.pauzeOver : Math.round((k.eind - Date.now()) / 1000)

const lees = () => {
  try {
    const k = JSON.parse(localStorage.getItem(SLEUTEL))
    if (!k || !k.oefening) return null
    if (Date.now() - k.gestart > MAX_LEEFTIJD_MS || secondenOver(k) < -NAIJLEN_SEC) return null
    return k
  } catch {
    return null
  }
}

let stand = lees()
const luisteraars = new Set()

const zet = (nieuw) => {
  stand = nieuw
  try {
    if (nieuw) localStorage.setItem(SLEUTEL, JSON.stringify(nieuw))
    else localStorage.removeItem(SLEUTEL)
  } catch { /* privémodus: dan alleen in het geheugen */ }
  luisteraars.forEach(l => l())
}

// Geluid als de rust om is (10 nov 2026, vraag van een klant). Web Audio, geen
// bestand: niets te laden en het werkt ook via een live-update. Telefoons laten
// alleen geluid toe na een tik, dus de klank wordt ontgrendeld bij het starten
// van de klok (dat is altijd een tik: set loggen, herstarten, tijd verzetten).
// Beperking: alleen met de app open. Scherm uit of app op de achtergrond = stil.
// Aan/uit-voorkeur in localStorage (10 nov 2026, belofte Wesley).
const GELUID_SLEUTEL = 'myarc:rusttimer_geluid_aan'
export const isTimerGeluidAan = () => { try { return localStorage.getItem(GELUID_SLEUTEL) !== '0' } catch { return true } }
export const zetTimerGeluid = (aan) => { try { localStorage.setItem(GELUID_SLEUTEL, aan ? '1' : '0') } catch {} }

let audio = null
const ontgrendelGeluid = () => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    if (!audio) audio = new AC()
    if (audio.state === 'suspended') audio.resume()
  } catch { /* geen geluid mogelijk */ }
}
const piep = () => {
  try {
    if (!audio) return
    if (audio.state === 'suspended') audio.resume()
    const t0 = audio.currentTime
    // Drie korte tonen, de laatste hoger: duidelijk, niet schel.
    ;[[0, 880], [0.22, 880], [0.44, 1320]].forEach(([na, hz]) => {
      const osc = audio.createOscillator()
      const vol = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = hz
      vol.gain.setValueAtTime(0.0001, t0 + na)
      vol.gain.exponentialRampToValueAtTime(0.5, t0 + na + 0.02)
      vol.gain.exponentialRampToValueAtTime(0.0001, t0 + na + 0.18)
      osc.connect(vol).connect(audio.destination)
      osc.start(t0 + na)
      osc.stop(t0 + na + 0.2)
    })
  } catch { /* stil falen: trillen gebeurt toch */ }
}

const abonneer = (l) => {
  luisteraars.add(l)
  return () => luisteraars.delete(l)
}

export const startRustKlok = ({ oefening, sec, bron = 'standaard' }) => { ontgrendelGeluid(); zet({
  oefening, bron, totaal: sec, eind: Date.now() + sec * 1000,
  pauzeOver: null, aangepast: false, klaar: false, gestart: Date.now(),
}) }

export const stopRustKlok = () => zet(null)

// Nieuwe rusttijd en nieuwe resterende tijd. Werkt ook tijdens een pauze.
export const verzetRustKlok = (totaal, over) => {
  if (!stand) return
  ontgrendelGeluid()
  zet({
    ...stand, totaal, aangepast: true, klaar: over <= 0 && stand.klaar,
    ...(stand.pauzeOver != null ? { pauzeOver: over } : { eind: Date.now() + over * 1000 }),
  })
}

export const herstartRustKlok = () => {
  if (!stand) return
  ontgrendelGeluid()
  zet({ ...stand, eind: Date.now() + stand.totaal * 1000, pauzeOver: null, klaar: false })
}

export const wisselPauzeRustKlok = () => {
  if (!stand) return
  if (stand.pauzeOver != null) {
    zet({ ...stand, eind: Date.now() + stand.pauzeOver * 1000, pauzeOver: null })
  } else {
    zet({ ...stand, pauzeOver: secondenOver(stand) })
  }
}

const controleer = () => {
  if (!stand || stand.pauzeOver != null) return
  const over = secondenOver(stand)
  if (over < -NAIJLEN_SEC) { zet(null); return }
  // De vlag staat op de gedeelde stand, dus één keer trillen ook als de balk
  // en het log-scherm allebei meekijken.
  if (over <= 0 && !stand.klaar) {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30])
    // Alleen piepen als het nu gebeurt, niet bij terugkomen in de app ruim na nul.
    if (over > -3 && isTimerGeluidAan()) piep()
    zet({ ...stand, klaar: true })
  }
}

// Alleen of er een klok loopt, zonder te tikken. Voor het log-scherm: dat is te
// groot om vier keer per seconde opnieuw te tekenen.
const haalLoopt = () => !!stand
export const useRustKlokLoopt = () => useSyncExternalStore(abonneer, haalLoopt)

// De klok zelf, met de resterende seconden. Vier keer per seconde vers.
const haalStand = () => stand
export function useRustKlok() {
  const klok = useSyncExternalStore(abonneer, haalStand)
  const [, tik] = useState(0)
  useEffect(() => {
    if (!klok || klok.pauzeOver != null) return undefined
    const id = setInterval(() => { controleer(); tik(n => n + 1) }, 250)
    return () => clearInterval(id)
  }, [klok])
  return { klok, over: klok ? secondenOver(klok) : 0 }
}

// Na nul telt de klok op: "+0:23" is hoe lang je al langer rust dan gepland.
export const klokTekst = (over) => {
  const s = Math.abs(over)
  return `${over < 0 ? '+' : ''}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
