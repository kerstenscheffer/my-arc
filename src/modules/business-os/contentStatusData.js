// src/modules/business-os/contentStatusData.js
//
// Afgeleide status per content-item (1 nov 2026): draft / ingepland / gepost /
// mislukt. De regel staat in de database (view content_items_status en RPC
// content_stand_per_dag, zie content-status.sql); hier alleen laden en kleuren.
// Gebruikt door de contentkalender, het Content-paneel, het Autopilot-paneel en
// Gino's context. Legenda + label (componenten): contentStatus.jsx.

import { colors } from '../../ui/tokens'

const G = colors.success
const ROOD = '#ff5c5c'

export const STANDEN = [
  { id: 'draft', label: 'Draft' },
  { id: 'ingepland', label: 'Ingepland' },
  { id: 'gepost', label: 'Gepost' },
  { id: 'mislukt', label: 'Mislukt' },
]
export const STAND_KLEUR = { draft: 'rgba(255,255,255,0.55)', ingepland: G, gepost: G, mislukt: ROOD }

// Vlak in de huisstijl: draft grijs gestippeld, ingepland groene rand,
// gepost vol groen, mislukt rood.
export function standVak(stand) {
  if (stand === 'gepost') return { background: G, color: '#000', border: `1.5px solid ${G}` }
  if (stand === 'ingepland') return { background: `${G}12`, color: G, border: `1.5px solid ${G}` }
  if (stand === 'mislukt') return { background: `${ROOD}22`, color: ROOD, border: `1.5px solid ${ROOD}` }
  return { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1.5px dashed rgba(255,255,255,0.35)' }
}

// Testrijen ('__test…' in de titel) tellen nergens mee: niet in de kalender,
// niet in tellingen, niet in Gino's context (business_os_periode doet hetzelfde).
export const isTestItem = (it) => String(it?.title || '').startsWith('__test')
export const zonderTest = (lijst) => (lijst || []).filter(it => !isTestItem(it))

// Deeplink naar het preview-venster van één item. Past op de hash-routing van
// CoachHub (tab:extra, zoals #ai-meals:<id>); BusinessOS.jsx opent het venster.
export const CONTENT_HASH = 'business-os:content='
export const contentLink = (id) => `https://www.myarcfitness.com/#${CONTENT_HASH}${id}`
export const openContent = (id) => { window.location.hash = `${CONTENT_HASH}${id}` }
// Leest het id uit #business-os:content=<id> (ook #business-os?content=<id>).
export const contentUitHash = (hash = window.location.hash) => {
  const m = String(hash).match(/^#?business-os[:?]content=([0-9a-f-]{36})/i)
  return m ? m[1] : null
}
// Na Goedkeuren/Aanpassen/Overslaan in het venster laden de lijsten opnieuw.
export const CONTENT_GEWIJZIGD = 'bos-content-gewijzigd'

// Zelfde regel als de view, voor als die (nog) niet bereikbaar is.
const terugval = (it) => (it.posted_at || it.ig_media_id || it.status === 'created' ? 'gepost' : it.autopilot_status === 'fout' ? 'mislukt' : 'draft')

// Voegt stand, views en comments toe aan content_items-rijen (op id).
export async function metStand(supabase, items) {
  const ids = (items || []).map(i => i.id).filter(Boolean)
  if (!ids.length) return items || []
  const kaart = {}
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase.from('content_items_status').select('id, stand, views, comments').in('id', ids.slice(i, i + 200))
      .then(r => r, () => ({ data: null }))
    for (const r of data || []) kaart[r.id] = r
  }
  return items.map(it => ({ ...it, stand: kaart[it.id]?.stand || terugval(it), views: kaart[it.id]?.views ?? null, comments: kaart[it.id]?.comments ?? null }))
}

// Per dag { draft, ingepland, gepost, mislukt, los_gepost, views }. Gepost telt
// ook Instagram-posts zonder gepland item mee.
export async function laadStandPerDag(supabase, van, tot) {
  const [{ data }, test] = await Promise.all([
    supabase.rpc('content_stand_per_dag', { p_van: van, p_tot: tot }).then(r => r, () => ({ data: null })),
    // De RPC telt testrijen nog mee: hier weer aftrekken.
    supabase.from('content_items').select('id, title, planned_date, status, posted_at, ig_media_id, autopilot_status')
      .like('title', '\\_\\_test%').gte('planned_date', van).lte('planned_date', tot)
      .then(r => r, () => ({ data: null })),
  ])
  const m = {}
  for (const r of data || []) m[r.dag] = { ...r }
  for (const t of await metStand(supabase, (test.data || []).filter(t => t.autopilot_status !== 'overgeslagen'))) {
    const r = m[t.planned_date]
    if (r && r[t.stand] > 0) r[t.stand]--
    if (r && t.stand === 'gepost' && t.views) r.views = Math.max(0, (r.views || 0) - t.views)
  }
  return m
}

export const kortGetal = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',')}k` : String(n ?? 0))

// Compacte telling voor Gino: alleen dagen met iets erin.
export function standVoorGino(perDag) {
  return Object.values(perDag || {})
    .filter(r => r.draft || r.ingepland || r.gepost || r.mislukt)
    .map(r => ({ datum: r.dag, draft: r.draft, ingepland: r.ingepland, gepost: r.gepost, ...(r.mislukt ? { mislukt: r.mislukt } : {}) }))
}
