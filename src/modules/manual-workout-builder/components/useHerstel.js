// src/modules/manual-workout-builder/components/useHerstel.js
// Herstelantwoorden van de laatste 7 dagen per spiergroep; zie HerstelSpieren.jsx.

import { useEffect, useState, useCallback } from 'react'
import { laadHerstel } from '../volumeData'

export function useHerstel(db, clientId, refreshKey = 0) {
  const [perSpier, setPerSpier] = useState({})
  const laad = useCallback(async () => {
    if (!clientId || !db?.supabase) { setPerSpier({}); return }
    setPerSpier(await laadHerstel(db.supabase, clientId))
  }, [clientId, db])
  useEffect(() => { laad() }, [laad, refreshKey])
  useEffect(() => {
    window.addEventListener('myarc:training-feedback', laad)
    return () => window.removeEventListener('myarc:training-feedback', laad)
  }, [laad])
  return perSpier
}
