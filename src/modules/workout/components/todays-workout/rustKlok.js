// src/modules/workout/components/todays-workout/rustKlok.js
//
// De lopende rustklok, los van het scherm van één oefening. Hij start als je
// een set logt en loopt door als je naar een andere oefening gaat, het
// log-scherm sluit, een video bekijkt of de app herstart.
//
// Een eindtijd en geen teller: zet de telefoon zijn scherm uit, dan lopen
// intervallen achter en klopt de resterende tijd niet meer bij terugkomst.

import { useEffect, useState, useSyncExternalStore } from 'react'
import belUrl from './boksbel.wav'

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
export const zetTimerGeluid = (aan) => { try { localStorage.setItem(GELUID_SLEUTEL, aan ? '1' : '0') } catch { /* privémodus */ } }

let audio = null
// De bel zelf: een echte opname (CC0, opengameart.org/content/boxing-ring-0,
// boxing_matchbell.wav; mono en luider gemaakt). Kersten koos deze op 12 nov
// 2026, een paar keer achter elkaar. Laadt bij de eerste tik; lukt dat niet,
// dan klinkt de nagemaakte bel in piep().
const BEL_KEER = 3
const BEL_TUSSEN = 0.4 // seconden tussen twee slagen; de opname duurt 0,55 s
let belKlank = null
let belLaadt = false
const laadBel = () => {
  if (belKlank || belLaadt || !audio) return
  belLaadt = true
  fetch(belUrl).then(r => r.arrayBuffer())
    .then(b => new Promise((ok, fout) => audio.decodeAudioData(b, ok, fout)))
    .then(klank => { belKlank = klank }, () => {})
    .then(() => { belLaadt = false })
}
const ontgrendelGeluid = () => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const nieuw = !audio || audio.state === 'closed'
    if (nieuw) audio = new AC()
    laadBel()
    if (!nieuw && audio.state === 'running') return
    // iOS kent naast 'suspended' ook 'interrupted' (na een telefoontje of even
    // uit de app): alles wat niet loopt opnieuw aanzetten.
    audio.resume()?.catch?.(() => {})
    // Eén stil monster afspelen binnen de tik: oudere iPhones geven de klank
    // pas vrij als er in de tik zelf echt iets is afgespeeld.
    const stil = audio.createBufferSource()
    stil.buffer = audio.createBuffer(1, 1, 22050)
    stil.connect(audio.destination)
    stil.start(0)
  } catch { /* geen geluid mogelijk */ }
}
// Elke tik terwijl er een klok loopt houdt de klank vrij (12 nov 2026). Zonder
// dit bleef het stil als de klok uit localStorage kwam (app herstart: er is dan
// nooit een start-tik geweest) of als iOS de klank tijdens het rusten had
// stilgezet. Buiten een tik om mag een telefoon de klank niet zelf aanzetten.
if (typeof window !== 'undefined') {
  const houdVrij = () => { if (stand && isTimerGeluidAan()) ontgrendelGeluid() }
  for (const soort of ['pointerup', 'touchend', 'click']) {
    window.addEventListener(soort, houdVrij, { capture: true, passive: true })
  }
}
const piep = () => {
  try {
    if (!audio) return
    if (audio.state !== 'running') audio.resume()?.catch?.(() => {})
    const t0 = audio.currentTime
    // Boksbel (12 nov 2026, Kersten: de drie piepjes waren veel te mild). Drie
    // harde slagen, de laatste galmt uit. Een bel is een grondtoon met
    // boventonen die er net naast liggen; de blokgolf eronder geeft de klap.
    // De compressor houdt het hard zonder te kraken op een telefoonspeaker.
    const uit = audio.createDynamicsCompressor()
    uit.connect(audio.destination)
    if (belKlank) {
      const harder = audio.createGain()
      harder.gain.value = 1.6
      harder.connect(uit)
      for (let i = 0; i < BEL_KEER; i++) {
        const slag = audio.createBufferSource()
        slag.buffer = belKlank
        slag.connect(harder)
        slag.start(t0 + i * BEL_TUSSEN)
      }
      return
    }
    // Terugval als de opname niet geladen is: nagemaakte bel.
    const GROND = 620
    const TONEN = [[1, 0.55, 'triangle'], [2.76, 0.3, 'sine'], [5.4, 0.16, 'sine'], [0.5, 0.14, 'square']]
    ;[[0, 0.32], [0.3, 0.32], [0.6, 1.4]].forEach(([na, duur]) => {
      TONEN.forEach(([maal, sterkte, vorm]) => {
        const osc = audio.createOscillator()
        const vol = audio.createGain()
        osc.type = vorm
        osc.frequency.value = GROND * maal
        vol.gain.setValueAtTime(0.0001, t0 + na)
        vol.gain.exponentialRampToValueAtTime(sterkte, t0 + na + 0.005)
        vol.gain.exponentialRampToValueAtTime(0.0001, t0 + na + duur)
        osc.connect(vol).connect(uit)
        osc.start(t0 + na)
        osc.stop(t0 + na + duur + 0.05)
      })
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
