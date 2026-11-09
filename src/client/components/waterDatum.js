// src/client/components/waterDatum.js
//
// Welke dag de maaltijdpagina toont, voor de waterfles. De fles hangt in
// ClientDashboard, buiten de maaltijdpagina, dus hij wist niet welke dag je
// bekeek: blader je naar gisteren, dan telde hij toch bij vandaag op
// (klantfeedback 9 nov 2026). De maaltijdpagina zet hier de dag neer, de
// fles luistert mee.

import { useEffect, useState } from 'react'

// Lokale datum als YYYY-MM-DD. toISOString geeft UTC, en dat is tussen
// middernacht en 01:00/02:00 nog gisteren.
export const datumSleutel = (d = new Date()) => {
  const j = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${j}-${m}-${dag}`
}

let huidig = null // null = vandaag
const luisteraars = new Set()

export const zetWaterDatum = (d) => {
  const sleutel = d ? datumSleutel(d) : null
  const nieuw = sleutel === datumSleutel() ? null : sleutel
  if (nieuw === huidig) return
  huidig = nieuw
  luisteraars.forEach(f => f(huidig))
}

// Geeft de gekozen dag als YYYY-MM-DD (vandaag als er niets gekozen is).
export const useWaterDatum = () => {
  const [d, setD] = useState(huidig)
  useEffect(() => {
    luisteraars.add(setD)
    setD(huidig)
    return () => { luisteraars.delete(setD) }
  }, [])
  return d || datumSleutel()
}
