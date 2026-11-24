// Klantenbord op Command: eigen secties + wie in welke sectie staat.
// Opslag in command_bord_secties / command_bord_plek (klant-bord.sql).
// Lukt de database niet, dan valt alles terug op localStorage, zodat het bord
// altijd werkt (alleen dan niet op een ander apparaat).

const LOKAAL = 'myarc:klantbord'

export const KLEUREN = {
  rood: '#ef4444',
  oranje: '#f59e0b',
  groen: '#22c55e',
  wit: '#ffffff',
}
export const KLEUR_VOLGORDE = ['rood', 'oranje', 'groen', 'wit']

const STANDAARD = [
  { naam: 'Aandacht nodig', kleur: 'rood' },
  { naam: 'Opvolgen', kleur: 'oranje' },
  { naam: 'Loopt goed', kleur: 'groen' },
]

const lokaalLezen = () => {
  try {
    const r = JSON.parse(localStorage.getItem(LOKAAL) || 'null')
    if (r?.secties?.length) return r
  } catch { /* leeg of geblokkeerd */ }
  return {
    secties: STANDAARD.map((s, i) => ({ id: `lokaal-${i}`, ...s, volgorde: i })),
    plek: {},
  }
}
const lokaalSchrijven = (bord) => {
  try { localStorage.setItem(LOKAAL, JSON.stringify({ secties: bord.secties, plek: bord.plek })) } catch { /* vol of geblokkeerd */ }
}

export async function laadBord(supabase) {
  const [s, p] = await Promise.all([
    supabase.from('command_bord_secties').select('id, naam, kleur, volgorde').order('volgorde').then(r => r, e => ({ error: e })),
    supabase.from('command_bord_plek').select('client_id, sectie_id').then(r => r, e => ({ error: e })),
  ])
  if (s.error || p.error) return { bron: 'lokaal', ...lokaalLezen() }
  let secties = s.data || []
  if (!secties.length) {
    const ins = await supabase.from('command_bord_secties')
      .insert(STANDAARD.map((x, i) => ({ ...x, volgorde: i })))
      .select('id, naam, kleur, volgorde')
      .then(r => r, e => ({ error: e }))
    if (ins.error) return { bron: 'lokaal', ...lokaalLezen() }
    secties = ins.data || []
  }
  const plek = {}
  for (const r of p.data || []) plek[r.client_id] = r.sectie_id
  return { bron: 'db', secties, plek }
}

// Alle schrijfacties krijgen het nieuwe bord mee (al optimistisch bijgewerkt)
// en schrijven alleen het verschil weg.
export async function bewaarPlek(supabase, bord, clientId, sectieId) {
  if (bord.bron !== 'db') return lokaalSchrijven(bord)
  const q = sectieId
    ? supabase.from('command_bord_plek').upsert({ client_id: clientId, sectie_id: sectieId, updated_at: new Date().toISOString() }, { onConflict: 'coach_id,client_id' })
    : supabase.from('command_bord_plek').delete().eq('client_id', clientId)
  const r = await q.then(x => x, e => ({ error: e }))
  if (r.error) console.warn('[klantbord] plek niet bewaard', r.error)
}

export async function nieuweSectie(supabase, bord, naam) {
  const volgorde = bord.secties.length ? Math.max(...bord.secties.map(s => s.volgorde)) + 1 : 0
  if (bord.bron !== 'db') return { id: `lokaal-${Date.now()}`, naam, kleur: 'wit', volgorde }
  const r = await supabase.from('command_bord_secties').insert({ naam, kleur: 'wit', volgorde })
    .select('id, naam, kleur, volgorde').single().then(x => x, e => ({ error: e }))
  if (r.error) { console.warn('[klantbord] sectie niet gemaakt', r.error); return null }
  return r.data
}

export async function wijzigSectie(supabase, bord, id, velden) {
  if (bord.bron !== 'db') return lokaalSchrijven(bord)
  const r = await supabase.from('command_bord_secties').update(velden).eq('id', id).then(x => x, e => ({ error: e }))
  if (r.error) console.warn('[klantbord] sectie niet gewijzigd', r.error)
}

export async function verwijderSectie(supabase, bord, id) {
  if (bord.bron !== 'db') return lokaalSchrijven(bord)
  const r = await supabase.from('command_bord_secties').delete().eq('id', id).then(x => x, e => ({ error: e }))
  if (r.error) console.warn('[klantbord] sectie niet verwijderd', r.error)
}

export async function bewaarVolgorde(supabase, bord) {
  if (bord.bron !== 'db') return lokaalSchrijven(bord)
  await Promise.all(bord.secties.map(s =>
    supabase.from('command_bord_secties').update({ volgorde: s.volgorde }).eq('id', s.id).then(x => x, e => ({ error: e }))))
}
