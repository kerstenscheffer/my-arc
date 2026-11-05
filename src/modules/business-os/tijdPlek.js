// src/modules/business-os/tijdPlek.js
//
// Voor de tijdmeter (scripts/gino-tijd.mjs): die ziet alleen de URL, en binnen
// Business OS blijft de hash #business-os. Staat de contentkalender of het
// Content-paneel open, dan wordt de hash #business-os:<plek>, zodat die minuten
// onder content vallen. CoachHub leest alleen het stuk vóór de ':'.
//
// replaceState: geen hashchange en geen extra stap in de terug-knop. Alleen op
// een kale #business-os, dus niet als Business OS in het split-paneel naast een
// ander tabje staat, en niet over een deeplink (#business-os:content=<id>) heen.

import { useEffect } from 'react'

const KAAL = '#business-os'
const zetHash = (hash) => window.history.replaceState(window.history.state, '', hash)

// Na herladen staat er misschien nog een oude plek in de hash.
if (typeof window !== 'undefined' && /^#business-os:(contentkalender|contentpaneel)$/.test(window.location.hash)) zetHash(KAAL)

export function useTijdPlek(plek) {
  useEffect(() => {
    if (!plek) return
    const zet = () => { if (window.location.hash === KAAL) zetHash(`${KAAL}:${plek}`) }
    zet()
    // Terug van een ander tabje terwijl dit scherm open bleef staan.
    window.addEventListener('hashchange', zet)
    return () => {
      window.removeEventListener('hashchange', zet)
      if (window.location.hash === `${KAAL}:${plek}`) zetHash(KAAL)
    }
  }, [plek])
}
