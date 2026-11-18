// src/modules/workout/bouwfase/useBouwfase.js
// Staat bouwfase-tracking aan voor deze klant? Bij elke mount vers, want de
// klantpagina's blijven staan en de coach kan hem intussen aanzetten.
import { useEffect, useState } from 'react'
import { leesActieveFase, faseStand } from './bouwfaseData'

// Laatst bekende fase per klant, en een lopende vraag gedeeld (18 nov 2026).
// De kop en het weekschema van de workoutpagina vragen hem allebei; zonder
// dit kwam de regel "Bouwfase W1/W6" in het weekschema later binnen en
// duwde hij de tegels 16 px omlaag.
const bekend = new Map()   // clientId -> fase
const onderweg = new Map() // clientId -> Promise

export default function useBouwfase(client, db) {
  const id = client?.id
  const [fase, setFase] = useState(() => (id && bekend.has(id) ? bekend.get(id) : null))
  useEffect(() => {
    if (!id || !db?.supabase) { setFase(null); return undefined }
    let weg = false
    if (bekend.has(id)) setFase(bekend.get(id))
    let vraag = onderweg.get(id)
    if (!vraag) {
      vraag = leesActieveFase(db.supabase, id).then(f => { bekend.set(id, f); return f })
      vraag.then(() => onderweg.delete(id), () => onderweg.delete(id))
      onderweg.set(id, vraag)
    }
    vraag.then(f => { if (!weg) setFase(f) }, () => {})
    return () => { weg = true }
  }, [id, db])
  // Lokaal bijwerken (bv. na een reflectie) houdt de onthouden fase gelijk.
  const zetFase = (v) => setFase(prev => { const n = typeof v === 'function' ? v(prev) : v; if (id) bekend.set(id, n); return n })
  return { fase, setFase: zetFase, aan: !!fase, stand: faseStand(fase) }
}
