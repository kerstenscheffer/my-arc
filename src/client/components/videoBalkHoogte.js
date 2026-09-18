// src/client/components/videoBalkHoogte.js
//
// Hoeveel ruimte de video-balk onderin nu inneemt, zodat de knoppen die daar
// zweven (waterfles, log-knop) meebewegen in plaats van altijd op de hoogste
// stand te blijven staan.
//
// Waarom een klein winkeltje en geen prop: de log-knop wordt diep in de
// maaltijdmodule gerenderd en de balk staat in het dashboard. Die twee via vier
// lagen aan elkaar knopen is meer schade dan dit.

import { useEffect, useState } from 'react'

// Wat de balk in elke stand van de onderrand afsnoept.
export const VIDEO_BALK = { weg: 0, knop: 28, open: 56 }

let hoogte = 0
const luisteraars = new Set()

export function zetVideoBalkHoogte(nieuw) {
  if (nieuw === hoogte) return
  hoogte = nieuw
  luisteraars.forEach(fn => fn(nieuw))
}

// Geeft de basisafstand plus wat de balk op dit moment inneemt.
export function useOnderMarge(basis) {
  const [h, setH] = useState(hoogte)
  useEffect(() => {
    luisteraars.add(setH)
    setH(hoogte)
    return () => { luisteraars.delete(setH) }
  }, [])
  return basis + h
}
