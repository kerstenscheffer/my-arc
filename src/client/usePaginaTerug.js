// src/client/usePaginaTerug.js
//
// Klantpagina's blijven staan als je wisselt (ClientDashboard verbergt ze in
// plaats van ze weg te halen), dus hun data wordt niet meer vanzelf opnieuw
// opgehaald. Kom je terug op een pagina die al eerder open was, dan stuurt het
// dashboard 'myarc:pagina-terug'; met deze hook ververst een pagina dan stil
// wat er elders veranderd kan zijn (afgevinkt op Home, gelogd op Voeding).
// Laat staan wat er al is tot het nieuwe binnen is: geen skelet bij terugkomen.
import { useEffect, useRef } from 'react'

export const PAGINA_TERUG = 'myarc:pagina-terug'
// Bij elke wissel van pagina, ook de eerste keer (zie useVensterOpen).
export const PAGINA_GEWISSELD = 'myarc:pagina-gewisseld'

export default function usePaginaTerug(pagina, ververs) {
  const laatste = useRef(ververs)
  laatste.current = ververs
  useEffect(() => {
    const op = (e) => { if (e.detail?.pagina === pagina) laatste.current?.() }
    window.addEventListener(PAGINA_TERUG, op)
    return () => window.removeEventListener(PAGINA_TERUG, op)
  }, [pagina])
}
