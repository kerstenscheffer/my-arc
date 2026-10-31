// src/modules/business-os/contentStand.js
//
// Wat er per dag aan content gedaan is, voor Gino's contentkalender. Zelfde
// bronnen en regel als de content-checklist in de leadbalk
// (lead-management/components/ContentChecklist.jsx): per vakje het hoogste van
// zelf ingevuld (content_checklist) en Metricool (content_metricool +
// _posts), outreach uit het leadbord (content_lead_stats). Wijzigt daar de
// telling, pas het hier ook aan.

export const CONTENT_SOORTEN = [
  { id: 'reel', label: 'Reels', doel: 1 },
  { id: 'foto', label: "Foto's", doel: 1 },
  { id: 'story', label: 'Stories', doel: 3 },
  { id: 'magnet', label: 'Magnets', doel: 8 },
  { id: 'youtube', label: 'YouTube', doel: 1, week: true },
  { id: 'outreach', label: 'Outreach', doel: 100, auto: true },
]

const MC_KOLOM = { reel: 'reels', foto: 'fotos', story: 'stories' }
export const sleutel = (dag, soort) => `${dag}|${soort}`
const leeg = () => ({ data: null })

// Geplande content (content_items.type) → rij in de kalender.
export const soortVanType = (t) => (t === 'story' ? 'story' : t === 'post' || t === 'carousel' ? 'foto' : 'reel')

export async function laadContentStand(supabase, van, tot) {
  const [c, d, m, p, l] = await Promise.all([
    supabase.from('content_checklist').select('dag, soort, aantal').gte('dag', van).lte('dag', tot).then(r => r, leeg),
    supabase.from('content_doelen').select('soort, doel').then(r => r, leeg),
    supabase.from('content_metricool').select('dag, reels, fotos, stories, bereik, nieuwe_volgers').gte('dag', van).lte('dag', tot).then(r => r, leeg),
    supabase.from('content_metricool_posts').select('dag, soort').gte('dag', van).lte('dag', tot).then(r => r, leeg),
    supabase.rpc('content_lead_stats', { van, tot }).then(r => r, leeg),
  ])
  const zelf = {}
  for (const r of c.data || []) zelf[sleutel(r.dag, r.soort)] = r.aantal
  for (const r of l.data || []) if (r.outreach) zelf[sleutel(r.dag, 'outreach')] = r.outreach
  const mc = {}
  const mcTelling = {}
  for (const r of m.data || []) {
    mc[r.dag] = { bereik: r.bereik, volgers: r.nieuwe_volgers }
    for (const [soort, kol] of Object.entries(MC_KOLOM)) if (r[kol]) mcTelling[sleutel(r.dag, soort)] = r[kol]
  }
  const posts = {}
  for (const r of p.data || []) (posts[r.dag] ||= []).push(r.soort)
  for (const [dag, lijst] of Object.entries(posts)) {
    mcTelling[sleutel(dag, 'reel')] = lijst.filter(x => x === 'reel').length
    mcTelling[sleutel(dag, 'magnet')] = lijst.filter(x => x === 'magnet').length
  }
  const samen = { ...mcTelling }
  for (const [k, v] of Object.entries(zelf)) samen[k] = Math.max(v, samen[k] || 0)
  const doelen = {}
  for (const r of d.data || []) doelen[r.soort] = r.doel
  return { samen, doelen, mc }
}

// Hoeveel van de dagdoelen gehaald is (teveel telt niet mee; weekdoelen niet).
export function dagScore(dag, samen, doelen) {
  let klaar = 0, totaal = 0
  for (const s of CONTENT_SOORTEN) {
    const doel = doelen[s.id] ?? s.doel
    if (!doel || s.week) continue
    totaal += doel
    klaar += Math.min(samen[sleutel(dag, s.id)] || 0, doel)
  }
  return totaal ? klaar / totaal : 0
}
