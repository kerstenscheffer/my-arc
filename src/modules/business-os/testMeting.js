// src/modules/business-os/testMeting.js
//
// Live meting voor een teststrategie op het projectscherm (fase.test in
// business_os_projecten.plan). Afspraak 5 nov 2026, zie skill Magnet-scorebord.
//   leads   → get_magnet_trechter, alleen het veld leads. Nooit stappen: die
//             bevat ook oudere leads uit de ronde.
//   geslacht→ call_leads.gender (male/female/leeg), in porties op id.
//   posts   → content_ig_media met soort magnet.
// Elk deel vangt zijn eigen fout op: mislukt er één, dan blijft de rest staan
// en krijg je "fout" bij dat getal in plaats van een verkeerd getal.

const PORTIE = 100
const POSTS_PAGINA = 1000
const CACHE_MS = 60000

const isDag = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))
const dagNr = (d) => Date.parse(`${d}T00:00:00Z`) / 86400000
export const vandaagIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })

// 00:00 Nederlandse tijd op dag d, ook als de telefoon in een andere zone staat.
function dagStartNL(d) {
  const utc = new Date(`${d}T00:00:00Z`)
  const nl = new Date(`${utc.toLocaleString('sv-SE', { timeZone: 'Europe/Amsterdam' }).replace(' ', 'T')}Z`)
  return new Date(2 * utc.getTime() - nl.getTime())
}

// Geeft null als de test niet meetbaar is (geen woorden of geen startdatum).
export function leesTest(test) {
  if (!test || typeof test !== 'object') return null
  const woorden = (Array.isArray(test.woorden) ? test.woorden : []).map(w => String(w).trim().toUpperCase()).filter(Boolean)
  if (!woorden.length || !isDag(test.van)) return null
  return {
    woorden,
    van: test.van,
    tot: isDag(test.tot) ? test.tot : null,
    igIds: (Array.isArray(test.ig_ids) ? test.ig_ids : []).map(String).filter(Boolean),
  }
}

// ── Rekenen (zonder database) ──

export function schatMannen(leads, geslacht) {
  let man = 0, vrouw = 0, leeg = 0
  for (const l of leads) {
    const g = String(geslacht.get(l.id) ?? '').trim().toLowerCase()
    if (g === 'male' || g === 'man') man++
    else if (g === 'female' || g === 'vrouw') vrouw++
    else leeg++
  }
  return { man, vrouw, leeg, mannen: man + vrouw > 0 ? man + (leeg * man) / (man + vrouw) : null }
}

// Onder 20 Test, 20-49 Indicatie, 50+ oude posts over minimaal 14 dagen Besluit.
export function oordeelVan({ posts, postsOud, spanOud, per10 }) {
  if (posts == null) return { niveau: 'Meting mislukt', uitslag: null }
  if (posts === 0) return { niveau: 'Nog geen data', uitslag: null }
  if (posts < 20) return { niveau: 'Test', uitslag: null }
  if (postsOud < 50 || spanOud < 14) return { niveau: 'Indicatie', uitslag: null }
  if (per10 == null) return { niveau: 'Besluit', uitslag: null }
  return { niveau: 'Besluit', uitslag: per10 >= 15 ? 'Werkt' : per10 >= 8 ? 'Matig' : 'Zwak' }
}

export function berekenTest({ leads, geslacht, posts, metIds = false, nulmeting = null, doel = null, vandaag = vandaagIso() }) {
  const schat = leads && geslacht ? schatMannen(leads, geslacht) : { man: null, vrouw: null, leeg: null, mannen: null }
  const oud = posts ? posts.filter(x => isDag(x.dag) && dagNr(vandaag) - dagNr(x.dag) >= 7) : null
  const oudeDagen = (oud || []).map(x => dagNr(x.dag))
  const spanOud = oudeDagen.length ? Math.max(...oudeDagen) - Math.min(...oudeDagen) : 0

  // Leads zijn alleen per woord bekend. Bij een selectie posts is mannen per 10
  // posts dus geen eerlijke deling: dan comments per 1.000 views over die posts.
  const per10 = !metIds && posts?.length && schat.mannen != null ? (schat.mannen / posts.length) * 10 : null
  let comments1000 = null
  if (metIds && posts) {
    const compleet = posts.filter(x => x.views != null && x.comments != null)
    const views = compleet.reduce((s, x) => s + Number(x.views), 0)
    if (views > 0) comments1000 = (compleet.reduce((s, x) => s + Number(x.comments), 0) / views) * 1000
  }
  const doelGetal = Number(doel)
  const nodig = per10 > 0 && doelGetal > 0 ? doelGetal / (per10 / 10) : null
  const nul = nulmeting === '' || nulmeting == null || !Number.isFinite(Number(nulmeting)) ? null : Number(nulmeting)

  return {
    leads: leads ? leads.length : null,
    ...schat,
    geslachtFout: !!leads && !geslacht,
    posts: posts ? posts.length : null,
    postsOud: oud ? oud.length : null,
    spanOud,
    per10,
    nulmeting: nul,
    comments1000,
    nodig,
    metIds,
    ...oordeelVan({ posts: posts ? posts.length : null, postsOud: oud ? oud.length : 0, spanOud, per10 }),
  }
}

// ── Ophalen ──

// De trechter is zwaar en meestal delen rijen dezelfde periode: één keer per minuut.
const trechterCache = new Map()
function haalTrechterLeads(supabase, van, tot) {
  const sleutel = `${van}|${tot || ''}`
  const nog = trechterCache.get(sleutel)
  if (nog && Date.now() - nog.t < CACHE_MS) return nog.belofte
  const belofte = (async () => {
    const nu = new Date()
    const dagErna = tot ? new Date(Date.parse(`${tot}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : null
    const eind = dagErna ? new Date(Math.min(nu.getTime(), dagStartNL(dagErna).getTime())) : nu
    const { data, error } = await supabase.rpc('get_magnet_trechter', { p_van: dagStartNL(van).toISOString(), p_tot: eind.toISOString() })
      .then(r => r, e => ({ error: e }))
    if (error || !Array.isArray(data?.leads)) throw error || new Error('Geen leads in de trechter')
    return data.leads
  })()
  trechterCache.set(sleutel, { t: Date.now(), belofte })
  belofte.then(null, () => trechterCache.delete(sleutel))
  return belofte
}

async function haalGeslacht(supabase, ids) {
  const porties = []
  for (let i = 0; i < ids.length; i += PORTIE) porties.push(ids.slice(i, i + PORTIE))
  const uitkomst = await Promise.all(porties.map(deel =>
    supabase.from('call_leads').select('id, gender').in('id', deel).then(r => r, e => ({ error: e }))
  ))
  const geslacht = new Map()
  for (const { data, error } of uitkomst) {
    // Een mislukte portie als "leeg" tellen zou de schatting stil verschuiven.
    if (error) throw error
    for (const r of data || []) geslacht.set(r.id, r.gender)
  }
  return geslacht
}

async function haalPosts(supabase, m) {
  const rijen = []
  for (let start = 0; ; start += POSTS_PAGINA) {
    let q = supabase.from('content_ig_media').select('id, dag, woord, views, comments').eq('soort', 'magnet').gte('dag', m.van)
    if (m.tot) q = q.lte('dag', m.tot)
    if (m.igIds.length) q = q.in('id', m.igIds)
    const { data, error } = await q.order('id').range(start, start + POSTS_PAGINA - 1).then(r => r, e => ({ error: e }))
    if (error) throw error
    rijen.push(...(data || []))
    if ((data || []).length < POSTS_PAGINA) break
  }
  return rijen.filter(r => m.woorden.includes(String(r.woord || '').trim().toUpperCase()))
}

// Gooit nooit: één fout in een meting mag het scherm niet breken.
export async function meetTest(supabase, test, doel) {
  const m = leesTest(test)
  if (!m) return null
  const [alleLeads, posts] = await Promise.all([
    haalTrechterLeads(supabase, m.van, m.tot).then(r => r, () => null),
    haalPosts(supabase, m).then(r => r, () => null),
  ])
  const leads = alleLeads ? alleLeads.filter(l => m.woorden.includes(String(l.woord || '').trim().toUpperCase())) : null
  const geslacht = leads ? await haalGeslacht(supabase, leads.map(l => l.id)).then(r => r, () => null) : null
  return berekenTest({ leads, geslacht, posts, metIds: m.igIds.length > 0, nulmeting: test.nulmeting_per_10, doel })
}
