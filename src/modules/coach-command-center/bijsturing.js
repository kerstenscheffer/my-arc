// Bijsturing per klant (24 nov 2026, Kersten): het laatste punt en wat er
// deze week is aangepast. Een uitbreiding van het logboek, geen eigen tabel:
// client_coaching_logs met category 'bijsturing'.
//   status  = hoe het gaat (crushing_it / on_track / needs_attention / off_track)
//   note    = "punt → bijsturing" (leesbaar in het logboek, ook in oude apps)
//   data    = { punt, bijsturing, details?, bron: 'coach' | 'gino' }
// Gino schrijft na een call-transcript precies zo'n rij (bron 'gino').
// De nieuwste rij per klant staat als label rechtsboven de klantkaart.

export const BIJSTURING = 'bijsturing'

export const STATUS_KLEUR = {
  crushing_it: '#22c55e',
  on_track: '#22c55e',
  needs_attention: '#f59e0b',
  off_track: '#ef4444',
}
export const STATUS_NAAM = {
  crushing_it: 'On fire',
  on_track: 'Op schema',
  needs_attention: 'Aandacht nodig',
  off_track: 'Off track',
}

export const EVENT_BIJSTURING = 'myarc:bijsturing'

const uitRij = (r) => ({
  id: r.id,
  clientId: r.client_id,
  status: r.status || 'on_track',
  punt: r.data?.punt || r.note || '',
  bijsturing: r.data?.bijsturing || '',
  details: r.data?.details || '',
  bron: r.data?.bron || 'coach',
  datum: r.created_at,
})

// Map client_id → nieuwste bijsturing (laatste 60 dagen).
export async function laadBijsturingen(supabase) {
  const van = new Date(); van.setDate(van.getDate() - 60)
  const r = await supabase.from('client_coaching_logs')
    .select('id, client_id, status, note, data, created_at')
    .eq('category', BIJSTURING).gte('created_at', van.toISOString())
    .order('created_at', { ascending: false }).limit(1000)
    .then(x => x, e => ({ error: e }))
  const map = new Map()
  if (r.error) return map
  for (const rij of r.data || []) if (!map.has(rij.client_id)) map.set(rij.client_id, uitRij(rij))
  return map
}

export async function schrijfBijsturing(supabase, { clientId, coachId, status, punt, bijsturing }) {
  const p = (punt || '').trim(), b = (bijsturing || '').trim()
  const { data, error } = await supabase.from('client_coaching_logs').insert({
    client_id: clientId, coach_id: coachId || null, status, category: BIJSTURING,
    note: b ? `${p} → ${b}` : p,
    data: { punt: p, bijsturing: b, bron: 'coach' },
  }).select('id, client_id, status, note, data, created_at').single()
  if (error) throw error
  window.dispatchEvent(new CustomEvent(EVENT_BIJSTURING, { detail: uitRij(data) }))
  return data
}
