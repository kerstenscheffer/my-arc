// Statusregel per klant (24 nov 2026, Kersten): één korte regel met de stand
// of de laatste wijziging, die hij na de maandag check-in bijwerkt.
// Geen eigen tabel: client_coaching_logs met category 'status'.
//   note   = de regel (max 120 tekens)
//   status = hoe het gaat, overgenomen van het logboek (verandert hier niet)
// De nieuwste rij is de geldende stand; de oudere zijn de historie en staan
// gewoon in de tijdlijn van het logboek.
//
// Alleen de coach leest en schrijft deze rijen: de policy status_alleen_coach
// (status-regel.sql) sluit ze uit voor klanten. Er hangt geen trigger of
// melding aan de tabel, er gaat dus niets naar de klant.

export const STATUS_REGEL = 'status'
export const MAX_STATUS = 120
export const EVENT_STATUSREGEL = 'myarc:statusregel'

const schoon = (t) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, MAX_STATUS)

const uitRij = (r) => ({ id: r.id, clientId: r.client_id, tekst: schoon(r.note), datum: r.created_at })

// Gino zet in de voorbereiding een voorstel: de regel die met 'Stand: ' begint
// (laatste regel van randzaken). Geeft de tekst zonder 'Stand: ', of ''.
const STAND = /^\s*Stand:\s+(.+)$/i
export function standVoorstel(call) {
  if (!call || typeof call !== 'object') return ''
  const regels = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? [v] : [])
  const treffers = (lijst) => lijst.map(r => String(r).match(STAND)).filter(Boolean)
  // Laatste treffer in randzaken wint; anders de eerste in een ander blok.
  const inRand = treffers(regels(call.randzaken))
  const elders = treffers(Object.entries(call).filter(([k]) => k !== 'randzaken').flatMap(([, v]) => regels(v)))
  const kies = inRand.length ? inRand[inRand.length - 1] : elders[0]
  return kies ? schoon(kies[1]) : ''
}

// Geldende statusregel van één klant, of null.
export async function laadStatusRegel(supabase, clientId) {
  const r = await supabase.from('client_coaching_logs')
    .select('id, client_id, note, created_at')
    .eq('client_id', clientId).eq('category', STATUS_REGEL)
    .order('created_at', { ascending: false }).limit(1)
    .then(x => x, e => ({ error: e }))
  if (r.error || !r.data?.length) return null
  return uitRij(r.data[0])
}

// Map client_id → geldende statusregel, voor de kaarten op het Klantenbord.
// Nieuwste 1000 rijen: bij één regel per klant per week is dat ruim een half
// jaar voor alle klanten samen.
export async function laadStatusRegels(supabase) {
  const r = await supabase.from('client_coaching_logs')
    .select('id, client_id, note, created_at')
    .eq('category', STATUS_REGEL)
    .order('created_at', { ascending: false }).limit(1000)
    .then(x => x, e => ({ error: e }))
  const map = new Map()
  if (r.error) return map
  for (const rij of r.data || []) if (!map.has(rij.client_id)) map.set(rij.client_id, uitRij(rij))
  return map
}

// Bewaart een nieuwe regel (een nieuwe rij, de oude blijft als historie).
// Geeft de volledige logboekrij terug.
export async function schrijfStatusRegel(supabase, { clientId, coachId, status, tekst }) {
  const note = schoon(tekst)
  if (!note) throw new Error('lege statusregel')
  const coach = coachId || (await supabase.auth.getSession()).data.session?.user?.id || null
  const { data, error } = await supabase.from('client_coaching_logs').insert({
    client_id: clientId, coach_id: coach, status: status || 'on_track', category: STATUS_REGEL, note,
  }).select().single()
  if (error) throw error
  window.dispatchEvent(new CustomEvent(EVENT_STATUSREGEL, { detail: uitRij(data) }))
  return data
}
