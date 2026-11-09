// src/modules/workout/bouwfase/useBouwfase.js
// Staat bouwfase-tracking aan voor deze klant? Eén keer ophalen per klant.
import { useEffect, useState } from 'react'
import { leesActieveFase, faseStand } from './bouwfaseData'

const cache = new Map() // clientId -> Promise<fase|null>

export default function useBouwfase(client, db) {
  const [fase, setFase] = useState(null)
  const id = client?.id
  useEffect(() => {
    if (!id || !db?.supabase) { setFase(null); return }
    let weg = false
    if (!cache.has(id)) cache.set(id, leesActieveFase(db.supabase, id))
    cache.get(id).then(f => { if (!weg) setFase(f) }, () => {})
    return () => { weg = true }
  }, [id, db])
  return { fase, aan: !!fase, stand: faseStand(fase) }
}
