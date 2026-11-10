// src/modules/manual-workout-builder/components/useHerstel.js
// Herstelantwoorden van de laatste 7 dagen per spiergroep; zie HerstelSpieren.jsx.

import { useEffect, useState, useCallback } from 'react'

const DAGEN_TERUG = 7

// { [spier]: { stand: 'groen'|'oranje'|'rood', herstel: [rijen], oefeningen: [rijen] } }
export function useHerstel(db, clientId, refreshKey = 0) {
  const [perSpier, setPerSpier] = useState({})
  const laad = useCallback(async () => {
    if (!clientId || !db?.supabase) { setPerSpier({}); return }
    const van = new Date(); van.setDate(van.getDate() - DAGEN_TERUG)
    const iso = `${van.getFullYear()}-${String(van.getMonth() + 1).padStart(2, '0')}-${String(van.getDate()).padStart(2, '0')}`
    const { data } = await db.supabase.from('training_feedback')
      .select('id, datum, soort, oefening, spiergroep, score, gevoel, opmerking')
      .eq('client_id', clientId).gte('datum', iso).in('soort', ['herstel', 'oefening'])
      .order('datum', { ascending: false }).order('created_at', { ascending: false })
      .then(r => r, () => ({ data: [] }))
    const uit = {}
    for (const r of data || []) {
      if (!r.spiergroep) continue
      const s = uit[r.spiergroep] || (uit[r.spiergroep] = { herstel: [], oefeningen: [] })
      if (r.soort === 'herstel') s.herstel.push(r); else s.oefeningen.push(r)
    }
    for (const s of Object.values(uit)) {
      const laatste = s.herstel[0]?.gevoel
      const pijn = s.oefeningen.some(r => r.gevoel === 'pijn')
      s.stand = pijn || laatste === 'ja' ? 'rood' : laatste === 'beetje' ? 'oranje' : laatste === 'nee' ? 'groen' : null
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

