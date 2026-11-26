// src/modules/business-os/contentStatusData.js
//
// Afgeleide status per content-item (1 nov 2026): draft / ingepland / gepost /
// mislukt. De regel staat in de database (view content_items_status en RPC
// content_stand_per_dag, zie content-status.sql); hier alleen laden en kleuren.
// Gebruikt door de contentkalender, het Content-paneel, het Autopilot-paneel en
// Gino's context. Legenda + label (componenten): contentStatus.jsx.
//
// Niet gepost (26 nov 2026): Kersten keurde het concept goed in Metricool, maar
// Automatisch plaatsen stond uit. Metricool stuurde dan alleen een herinnering
// (content_items.metricool_stand = 'melding') en de post ging NIET live. De view
// noemt zo'n rij draft; metStand maakt er 'niet_gepost' van zodra het geplande
// moment voorbij is. De rij moet daarvoor metricool_stand, planned_date en
// planned_time meekrijgen. De dagtelling uit de database kent deze stand niet:
// schermen halen hem zelf van draft af (standenVanDag).

import { colors } from '../../ui/tokens'

const G = colors.success
const ROOD = '#ff5c5c'

export const STANDEN = [
  { id: 'draft', label: 'Draft' },
  { id: 'ingepland', label: 'Ingepland' },
  { id: 'gepost', label: 'Gepost' },
  { id: 'mislukt', label: 'Mislukt' },
]
export const NIET_GEPOST = 'niet_gepost'
export const NIET_GEPOST_LABEL = 'Niet gepost'
export const NIET_GEPOST_KLEUR = ROOD
// Voor tellingen en uitleg; de legenda blijft bij STANDEN.
export const ALLE_STANDEN = [...STANDEN, { id: NIET_GEPOST, label: NIET_GEPOST_LABEL }]
export const STAND_KLEUR = { draft: 'rgba(255,255,255,0.55)', ingepland: G, gepost: G, mislukt: ROOD, [NIET_GEPOST]: ROOD }

// Vlak in de huisstijl: draft grijs gestippeld, ingepland groene rand,
// gepost vol groen, mislukt en niet gepost rood.
export function standVak(stand) {
  if (stand === 'gepost') return { background: G, color: '#000', border: `1.5px solid ${G}` }
  if (stand === 'ingepland') return { background: `${G}12`, color: G, border: `1.5px solid ${G}` }
  if (stand === 'mislukt' || stand === NIET_GEPOST) return { background: `${ROOD}22`, color: ROOD, border: `1.5px solid ${ROOD}` }
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
// Bekijk-knoppen: zelfde venster zonder de hash te wijzigen (anders springt de
// hoofdtab om als Business OS in het split-paneel staat).
export const CONTENT_OPEN = 'bos-content-open'
export const openContent = (id) => window.dispatchEvent(new CustomEvent(CONTENT_OPEN, { detail: id }))
// Kalender-item openen: de post in Metricool als die er is, anders het preview-venster.
export const openItem = (it) => {
  if (it?.metricoolLink) window.open(it.metricoolLink, '_blank', 'noopener,noreferrer')
  else if (it?.contentId) openContent(it.contentId)
}
// Leest het id uit #business-os:content=<id> (ook #business-os?content=<id>).
export const contentUitHash = (hash = window.location.hash) => {
  const m = String(hash).match(/^#?business-os[:?]content=([0-9a-f-]{36})/i)
  return m ? m[1] : null
}
// Na Goedkeuren/Aanpassen/Overslaan in het venster laden de lijsten opnieuw.
export const CONTENT_GEWIJZIGD = 'bos-content-gewijzigd'

// Zelfde regel als de view, voor als die (nog) niet bereikbaar is.
const terugval = (it) => (it.posted_at || it.ig_media_id || it.status === 'created' ? 'gepost' : it.autopilot_status === 'fout' ? 'mislukt' : 'draft')

// Nu in Nederlandse tijd als 'YYYY-MM-DD HH:MM', zelfde vorm als het geplande moment.
const nuNL = () => new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Amsterdam' }).slice(0, 16)
// Gepland moment; zonder geldige tijd 14:00, net als de view.
const momentVan = (it) => {
  const m = String(it.planned_time || '').match(/^(\d{1,2}):(\d{2})$/)
  return `${it.planned_date} ${m ? `${m[1].padStart(2, '0')}:${m[2]}` : '14:00'}`
}
// Alleen een draft kan niet gepost zijn: gepost, mislukt en ingepland (autopilot) gaan voor.
export const isNietGepost = (it, stand, nu = nuNL()) =>
  stand === 'draft' && it?.metricool_stand === 'melding' && !!it.planned_date && momentVan(it) <= nu

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
  // Instagram-permalink (instagram-publiceer.sql) apart: bestaat de kolom nog
  // niet, dan faalt alleen dit en blijft de stand gewoon staan.
  const gepost = items.filter(i => i.ig_media_id).map(i => i.id)
  const links = {}
  for (let i = 0; i < gepost.length; i += 200) {
    const { data } = await supabase.from('content_items_status').select('id, ig_permalink').in('id', gepost.slice(i, i + 200))
      .then(r => r, () => ({ data: null }))
    for (const r of data || []) links[r.id] = r.ig_permalink
  }
  const nu = nuNL()
  return items.map(it => {
    const stand = kaart[it.id]?.stand || terugval(it)
    return { ...it, stand: isNietGepost(it, stand, nu) ? NIET_GEPOST : stand, views: kaart[it.id]?.views ?? null, comments: kaart[it.id]?.comments ?? null, permalink: links[it.id] || null }
  })
}

// Instagram-test zonder plaatsen: container maken en status volgen
// (edge function instagram-publiceer, dry_run). Rij blijft ongemoeid.
export async function testInstagram(supabase, id) {
  const { data, error } = await supabase.functions.invoke('instagram-publiceer', { body: { dry_run: true, id } })
    .then(r => r, e => ({ error: e }))
  if (error) return 'Test lukte niet: de Instagram-koppeling staat nog niet live.'
  if (data?.fout) return `Test: ${data.fout}`
  return `Test geslaagd: ${data.account}, container ${data.status === 'FINISHED' ? 'klaar' : data.status}. Niets geplaatst.`
}

// Per dag { draft, ingepland, gepost, mislukt, los_gepost, views }. Gepost telt
// ook Instagram-posts zonder gepland item mee.
export async function laadStandPerDag(supabase, van, tot) {
  // v2 laat testrijen weg (content-test-uitsluiten.sql). Bestaat hij nog niet,
  // dan v1 en de testrijen hier aftrekken.
  const v2 = await supabase.rpc('content_stand_per_dag_v2', { p_van: van, p_tot: tot }).then(r => r, e => ({ error: e }))
  if (!v2.error && v2.data) {
    const m = {}
    for (const r of v2.data) m[r.dag] = r
    return m
  }
  const [{ data }, test] = await Promise.all([
    supabase.rpc('content_stand_per_dag', { p_van: van, p_tot: tot }).then(r => r, () => ({ data: null })),
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

// Aantallen van één dag als lijst [{ id, label, n }], alleen wat er is. r = rij uit
// laadStandPerDag; nietGepost = aantal niet-geposte items die dag (de database
// telt die als draft, dus ze gaan daar vanaf).
export function standenVanDag(r, nietGepost = 0) {
  return ALLE_STANDEN.map(s => ({
    ...s,
    n: s.id === NIET_GEPOST ? nietGepost : s.id === 'draft' ? Math.max(0, (r?.draft || 0) - nietGepost) : (r?.[s.id] || 0),
  })).filter(s => s.n > 0)
}

// Aantal niet-geposte items per dag; dagVan haalt de dag uit een item.
export function nietGepostPerDag(items, dagVan = (it) => it.planned_date) {
  const m = {}
  for (const it of items || []) if (it.stand === NIET_GEPOST) m[dagVan(it)] = (m[dagVan(it)] || 0) + 1
  return m
}

// Compacte telling voor Gino: alleen dagen met iets erin. items = de
// content-items met stand (metStand), voor niet_gepost.
export function standVoorGino(perDag, items = []) {
  const ng = nietGepostPerDag(items)
  return Object.values(perDag || {})
    .map(r => ({ r, n: Object.fromEntries(standenVanDag(r, ng[r.dag] || 0).map(s => [s.id, s.n])) }))
    .filter(({ n }) => Object.keys(n).length)
    .map(({ r, n }) => ({ datum: r.dag, draft: n.draft || 0, ingepland: n.ingepland || 0, gepost: n.gepost || 0, ...(n.mislukt ? { mislukt: n.mislukt } : {}), ...(n[NIET_GEPOST] ? { [NIET_GEPOST]: n[NIET_GEPOST] } : {}) }))
}
