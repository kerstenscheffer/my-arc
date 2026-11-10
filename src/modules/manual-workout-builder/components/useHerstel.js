// src/modules/manual-workout-builder/components/useHerstel.js
// Herstelantwoorden van de laatste 7 dagen per spiergroep; zie HerstelSpieren.jsx.

import { useEffect, useState, useCallback } from 'react'
import { ONDER, verfijn } from '../spierGroepen'

const DAGEN_TERUG = 7
// Voor "2 trainingen achter elkaar pijn" verder terugkijken: een oefening komt
// vaak maar 1x per week langs.
const PIJN_DAGEN_TERUG = 35
const isoVan = (dagen) => {
  const d = new Date(); d.setDate(d.getDate() - dagen)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// { [spier]: { stand, herstel: [rijen 7 d], oefeningen: [rijen 7 d], pijnReeks: [oefeningnamen] } }
// pijnReeks = oefeningen waarbij de laatste 2 keer dat ze gedaan zijn allebei 'pijn' gaven.
export function useHerstel(db, clientId, refreshKey = 0) {
  const [perSpier, setPerSpier] = useState({})
  const laad = useCallback(async () => {
    if (!clientId || !db?.supabase) { setPerSpier({}); return }
    const iso = isoVan(DAGEN_TERUG)
    const { data } = await db.supabase.from('training_feedback')
      .select('id, datum, soort, oefening, spiergroep, score, gevoel, opmerking')
      .eq('client_id', clientId).gte('datum', isoVan(PIJN_DAGEN_TERUG)).in('soort', ['herstel', 'oefening'])
      .order('datum', { ascending: false }).order('created_at', { ascending: false })
      .then(r => r, () => ({ data: [] }))
    const uit = {}
    const perOef = {} // spier → oefening → rijen (nieuwste eerst), hele periode
    // Oude app-versies vragen naar 'legs'/'shoulders': geldt voor alle fijne groepen
    // eronder; bij een oefening bepaalt de naam welke (verfijn).
    const rijen = []
    for (const r of data || []) {
      if (!r.spiergroep) continue
      if (!ONDER[r.spiergroep]) { rijen.push(r); continue }
      if (r.soort === 'oefening' && r.oefening) rijen.push({ ...r, spiergroep: verfijn(r.spiergroep, r.oefening) })
      else for (const fijn of ONDER[r.spiergroep]) rijen.push({ ...r, spiergroep: fijn })
    }
    for (const r of rijen) {
      const s = uit[r.spiergroep] || (uit[r.spiergroep] = { herstel: [], oefeningen: [], pijnReeks: [] })
      if (r.soort === 'oefening' && r.oefening) {
        const k = r.oefening.trim().toLowerCase()
        ;((perOef[r.spiergroep] = perOef[r.spiergroep] || {})[k] = perOef[r.spiergroep][k] || []).push(r)
      }
      if (r.datum < iso) continue
      if (r.soort === 'herstel') s.herstel.push(r); else s.oefeningen.push(r)
    }
    for (const [spier, oefs] of Object.entries(perOef)) {
      for (const rijen of Object.values(oefs)) {
        if (rijen.length >= 2 && rijen[0].gevoel === 'pijn' && rijen[1].gevoel === 'pijn') uit[spier].pijnReeks.push(rijen[0].oefening)
      }
    }
    for (const s of Object.values(uit)) {
      const laatste = s.herstel[0]?.gevoel
      // Pijn 2x achter elkaar = rood; één keer pijn = oranje (in de gaten houden).
      const pijnEens = s.oefeningen.some(r => r.gevoel === 'pijn')
      s.stand = s.pijnReeks.length || laatste === 'ja' ? 'rood' : pijnEens || laatste === 'beetje' ? 'oranje' : laatste === 'nee' ? 'groen' : null
    }
    setPerSpier(uit)
  }, [clientId, db])
  useEffect(() => { laad() }, [laad, refreshKey])
  useEffect(() => {
    window.addEventListener('myarc:training-feedback', laad)
    return () => window.removeEventListener('myarc:training-feedback', laad)
  }, [laad])
  return perSpier
}

