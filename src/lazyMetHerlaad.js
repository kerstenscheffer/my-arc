// src/lazyMetHerlaad.js
//
// React.lazy met een vangnet: na een deploy bestaan de oude chunk-bestanden
// niet meer, en een tabblad dat nog openstond krijgt dan een 404 zodra het
// een nieuw stuk wil laden. In dat geval één keer de pagina verversen (vlag
// in sessionStorage, zodat het niet blijft rondgaan).
import { lazy } from 'react'

export default function lazyMetHerlaad(importeer) {
  return lazy(() => importeer().catch((e) => {
    const sleutel = 'myarc:chunk-herlaad'
    let al = false
    try { al = sessionStorage.getItem(sleutel) === '1' } catch { /* geen storage */ }
    if (!al) {
      try { sessionStorage.setItem(sleutel, '1') } catch { /* geen storage */ }
      window.location.reload()
      return new Promise(() => {})   // de pagina ververst; niets meer renderen
    }
    throw e
  }))
}
