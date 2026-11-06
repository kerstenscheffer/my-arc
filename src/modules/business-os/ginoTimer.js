// src/modules/business-os/ginoTimer.js
//
// Taaktimer van Business OS (6 nov 2026). Eén timer tegelijk, met de eindtijd in
// localStorage zodat hij herladen en andere tabbladen overleeft. Afvinken en tijd
// loggen gaan via de bestaande routes: projectStappen.schrijfPlan voor bordkaarten,
// het Vandaag-afvinken + ProductivityService.logTime voor productivity_tasks
// (dezelfde tijdlog als de CoachHub-timer, FloatingTaskTimer).
//
// Stand: { taak: { soort: 'kaart' | 'taak' | 'eigen', id, projectId, titel },
//          totaal: ms gepland (incl. verlengingen), eind: ms-tijdstip of null (pauze),
//          rest: ms over tijdens pauze of null }

import { useState, useEffect, useCallback } from 'react'

const KEY = 'business_os_timer'

const leesStand = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    return s?.taak && s.totaal > 0 ? s : null
  } catch { return null }
}
const bewaarStand = (s) => {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch { /* privé-venster */ }
}

export const restVan = (s, nu = Date.now()) => (!s ? 0 : s.eind ? Math.max(0, s.eind - nu) : Math.max(0, s.rest || 0))
export const gewerktMinuten = (s) => (s ? Math.round((s.totaal - restVan(s)) / 60000) : 0)
export const klok = (ms) => {
  const t = Math.ceil(ms / 1000)
  const u = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60
  const mm = String(m).padStart(u ? 2 : 1, '0'), ss = String(s).padStart(2, '0')
  return u ? `${u}:${mm}:${ss}` : `${mm}:${ss}`
}

// ── Geluid: kort tweetonig signaal via Web Audio. Ontgrendelen bij de Start-tik
// (iOS speelt anders niets af). Faalt stil: het licht in de bol blijft.
let audio = null
export function ontgrendelGeluid() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    if (!audio) audio = new AC()
    if (audio.state === 'suspended') audio.resume()
  } catch { /* geen audio */ }
}
export function speelGeluid() {
  try {
    ontgrendelGeluid()
    if (!audio) return
    const t0 = audio.currentTime + 0.02
    ;[[880, 0], [1320, 0.18], [880, 0.5], [1320, 0.68]].forEach(([hz, na]) => {
      const osc = audio.createOscillator()
      const vol = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = hz
      vol.gain.setValueAtTime(0.0001, t0 + na)
      vol.gain.exponentialRampToValueAtTime(0.25, t0 + na + 0.02)
      vol.gain.exponentialRampToValueAtTime(0.0001, t0 + na + 0.16)
      osc.connect(vol).connect(audio.destination)
      osc.start(t0 + na)
      osc.stop(t0 + na + 0.18)
    })
  } catch { /* geen audio */ }
}

export function useGinoTimer() {
  const [stand, setStand] = useState(leesStand)
  const [nu, setNu] = useState(() => Date.now())

  const zet = useCallback((s) => { bewaarStand(s); setStand(s); setNu(Date.now()) }, [])

  // Ander tabblad startte of stopte een timer.
  useEffect(() => {
    const opOpslag = (e) => { if (e.key === KEY) { setStand(leesStand()); setNu(Date.now()) } }
    window.addEventListener('storage', opOpslag)
    return () => window.removeEventListener('storage', opOpslag)
  }, [])

  const loopt = !!stand?.eind
  const rest = restVan(stand, nu)
  const af = loopt && rest <= 0

  // Tikken zolang hij loopt; stopt vanzelf bij nul.
  useEffect(() => {
    if (!loopt || af) return undefined
    const t = setInterval(() => setNu(Date.now()), 1000)
    return () => clearInterval(t)
  }, [loopt, af])

  const start = useCallback((taak, minuten) => {
    ontgrendelGeluid()
    const ms = Math.round(minuten * 60000)
    zet({ taak, totaal: ms, eind: Date.now() + ms, rest: null })
  }, [zet])
  const pauze = useCallback(() => { if (stand?.eind) zet({ ...stand, eind: null, rest: restVan(stand) }) }, [stand, zet])
  const hervat = useCallback(() => {
    ontgrendelGeluid()
    if (stand && !stand.eind) zet({ ...stand, eind: Date.now() + (stand.rest || 0), rest: null })
  }, [stand, zet])
  const verleng = useCallback((minuten) => {
    if (!stand) return
    const ms = minuten * 60000
    zet({ ...stand, totaal: stand.totaal + ms, eind: Date.now() + restVan(stand) + ms, rest: null })
  }, [stand, zet])
  const sluit = useCallback(() => zet(null), [zet])

  return { stand, rest, af, gepauzeerd: !!stand && !stand.eind, start, pauze, hervat, verleng, sluit }
}

// Open bordkaarten van Kersten: projecten in uitvoering, stappen met wie kersten
// en klaar niet true. Vroegste dag eerst, zonder dag achteraan.
export function openKaarten(projecten) {
  const uit = []
  for (const p of projecten || []) {
    for (const fase of p.plan?.fases || []) {
      for (const s of fase.stappen || []) {
        if (s?.id && s.wie === 'kersten' && s.klaar !== true && s.titel) {
          uit.push({ soort: 'kaart', id: s.id, projectId: p.id, titel: s.titel, project: p.titel, dag: s.dag || null })
        }
      }
    }
  }
  return uit.sort((a, b) => (a.dag || '9').localeCompare(b.dag || '9'))
}
