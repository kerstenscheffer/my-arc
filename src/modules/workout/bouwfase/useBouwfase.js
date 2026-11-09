// src/modules/workout/bouwfase/useBouwfase.js
// Staat bouwfase-tracking aan voor deze klant? Bij elke mount vers, want de
// klantpagina's blijven staan en de coach kan hem intussen aanzetten.
import { useEffect, useState } from 'react'
import { leesActieveFase, faseStand } from './bouwfaseData'

export default function useBouwfase(client, db) {
  const [fase, setFase] = useState(null)
  const id = client?.id
  useEffect(() => {
    if (!id || !db?.supabase) { setFase(null); return undefined }
    let weg = false
    leesActieveFase(db.supabase, id).then(f => { if (!weg) setFase(f) }, () => {})
    return () => { weg = true }
  }, [id, db])
  return { fase, setFase, aan: !!fase, stand: faseStand(fase) }
}
