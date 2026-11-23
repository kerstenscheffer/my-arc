// src/modules/business-os/aanbodOpslag.js
//
// Laden en bewaren van de aanbod-rekenaar (Aanbod.jsx). Eén rij per coach in
// business_os_aanbod (business-os-aanbod.sql), zodat Mac en telefoon gelijk
// lopen. Nog geen rij = de beginwaarden uit aanbodData.js.

import { supabase } from '../../lib/supabase'
import { normaliseer } from './aanbodData'

async function eigenId() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id || null
}

// → { gegevens } of { fout: true }. Bij een fout nooit de beginwaarden tonen:
// de eerste wijziging zou dan over de echte rij heen schrijven.
export async function laadAanbod() {
  try {
    const id = await eigenId()
    if (!id) return { fout: true }
    const { data, error } = await supabase.from('business_os_aanbod').select('gegevens').eq('coach_id', id).maybeSingle()
    if (error) return { fout: true }
    return { gegevens: normaliseer(data?.gegevens) }
  } catch {
    return { fout: true }
  }
}

// → true als het in de database staat.
export async function bewaarAanbod(gegevens) {
  try {
    const id = await eigenId()
    if (!id) return false
    const { error } = await supabase.from('business_os_aanbod')
      .upsert({ coach_id: id, gegevens, updated_at: new Date().toISOString() }, { onConflict: 'coach_id' })
    return !error
  } catch {
    return false
  }
}
