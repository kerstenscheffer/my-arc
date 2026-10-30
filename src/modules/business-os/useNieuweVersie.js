// src/modules/business-os/useNieuweVersie.js
//
// Business OS haalt zichzelf op na een deploy (30 okt 2026: Kersten hoorde nog
// de Mac-stem omdat zijn open tabblad oude code draaide). De build zet
// /versie.json neer met dezelfde bouwtijd als __BUILD_TIJD__ (vite.config.js).
// Bij terugkeren naar het tabblad, bij focus en elke 5 minuten kijken we of
// die anders is. Zo ja: herladen, maar alleen als het kan (magNu: geen
// lopend antwoord, niet aan het praten/luisteren, niets getypt). Kan het nog
// niet, dan wacht hij tot magNu true wordt.
// Niet in de dev-server (daar doet Vite het) en niet in de native app (daar
// doen de live updates het, liveUpdate.js).

import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'

const EIGEN = typeof __BUILD_TIJD__ === 'string' ? __BUILD_TIJD__ : null
const ELKE_MS = 5 * 60 * 1000

export function useNieuweVersie(magNu) {
  const [nieuw, setNieuw] = useState(false)
  const actief = !import.meta.env.DEV && !Capacitor.isNativePlatform() && !!EIGEN

  useEffect(() => {
    if (!actief || nieuw) return
    let weg = false
    const kijk = () => {
      if (document.hidden) return
      fetch(`/versie.json?t=${Date.now()}`, { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(j => { if (!weg && j?.build && j.build !== EIGEN && !alGeprobeerd(j.build)) setNieuw(j.build) })
        .catch(() => { /* offline: volgende keer */ })
    }
    const zicht = () => { if (!document.hidden) kijk() }
    kijk()
    const t = setInterval(kijk, ELKE_MS)
    document.addEventListener('visibilitychange', zicht)
    window.addEventListener('focus', kijk)
    return () => {
      weg = true
      clearInterval(t)
      document.removeEventListener('visibilitychange', zicht)
      window.removeEventListener('focus', kijk)
    }
  }, [actief, nieuw])

  // Eén keer herladen per nieuwe versie: komt na het herladen nog de oude code
  // binnen (cache), dan geen lus.
  const herladen = useRef(false)
  useEffect(() => {
    if (!nieuw || !magNu || herladen.current) return
    herladen.current = true
    try { sessionStorage.setItem(SLEUTEL, nieuw) } catch { /* privé-venster */ }
    window.location.reload()
  }, [nieuw, magNu])
}

const SLEUTEL = 'bos_herladen_voor'
const alGeprobeerd = (build) => { try { return sessionStorage.getItem(SLEUTEL) === build } catch { return false } }
