// src/modules/business-os/schermenData.js
//
// Data voor bewaarde schermen (tabel business_os_schermen, business-os-schermen.sql).
// Knop en lijst staan in schermen.jsx.

import { supabase } from '../../lib/supabase'

const TABEL = 'business_os_schermen'

export function laadSchermen() {
  return supabase.from(TABEL).select('id, naam, omschrijving, vraag, visueel, created_at, laatst_getoond_at')
    .order('created_at', { ascending: false }).limit(100)
    .then(({ data, error }) => (error ? [] : data || []), () => [])
}

export async function bewaarScherm({ naam, vraag, visueel }) {
  let beeld = null
  try { beeld = visueel ? JSON.parse(JSON.stringify(visueel)) : null } catch { /* geen beeld */ }
  if (beeld) { delete beeld._vraag; delete beeld._vorige }
  const { error } = await supabase.from(TABEL).insert({
    naam: String(naam).slice(0, 80),
    omschrijving: typeof beeld?.titel === 'string' && beeld.titel !== naam ? beeld.titel.slice(0, 160) : null,
    vraag: vraag ? String(vraag).slice(0, 2000) : null,
    visueel: beeld,
  })
  return !error
}

export function verwijderScherm(id) {
  return supabase.from(TABEL).delete().eq('id', id).then(({ error }) => !error, () => false)
}

export function markeerGetoond(id) {
  return supabase.from(TABEL).update({ laatst_getoond_at: new Date().toISOString() }).eq('id', id).then(() => {}, () => {})
}

// Kort voor Gino's context: max 20, elk één regel.
export function schermenVoorGino(lijst) {
  const kort = (t, n) => (t && t.length > n ? t.slice(0, n - 1) + '…' : t || '')
  return lijst.slice(0, 20).map(s => [
    s.naam, s.omschrijving ? kort(s.omschrijving, 110) : null, s.vraag ? `vraag: ${kort(s.vraag, 120)}` : null,
  ].filter(Boolean).join(' — '))
}
