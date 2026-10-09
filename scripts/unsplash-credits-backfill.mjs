// scripts/unsplash-credits-backfill.mjs
//
// Fotocredits achteraf: maaltijden (ai_meals) en ingrediënten (ai_ingredients)
// met een Unsplash-foto maar zonder fotograaf. Per rij zoeken we op de naam;
// staat dezelfde foto in de resultaten (zelfde photo-pad), dan bewaren we de
// fotograaf en blijft de foto staan. Anders nemen we de best passende foto
// uit de resultaten en vervangen we de foto. Beide gevallen melden we als
// download bij Unsplash (API-voorwaarde).
//
// Demo-sleutel: 50 verzoeken per uur. Standaard wachten we 80 s per verzoek
// (45/uur), dus dit draait uren; start hem op de achtergrond:
//   nohup node scripts/unsplash-credits-backfill.mjs > credits-backfill.log 2>&1 &
// Opties: --dry  --limit 20  --delay 80  --only "kip"  --tabel meals|ingredients
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import { buildQuery } from './unsplash-meal-photos.mjs'

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d }
const DRY = has('--dry')
const LIMIT = parseInt(val('--limit', '0'), 10) || 0
const DELAY_S = parseInt(val('--delay', '80'), 10)
const ONLY = val('--only', '')
const TABEL = val('--tabel', 'beide')

const env = { ...process.env }
try {
  const raw = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* alles via environment */ }
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY
const UNSPLASH_KEY = env.UNSPLASH_ACCESS_KEY
if (!SUPABASE_URL || !SERVICE_KEY || !UNSPLASH_KEY) { console.error('Ontbreekt: SUPABASE_URL / SUPABASE_SERVICE_KEY / UNSPLASH_ACCESS_KEY'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const UTM = 'utm_source=my_arc&utm_medium=referral'
const metUtm = (u) => u ? `${u}${u.includes('?') ? '&' : '?'}${UTM}` : null
const basis = (u) => String(u || '').split('?')[0]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stamp = () => new Date().toISOString().slice(11, 19)

let verzoeken = 0
async function api(url, init = {}) {
  verzoeken++
  const res = await fetch(url, { ...init, headers: { Authorization: `Client-ID ${UNSPLASH_KEY}`, 'Accept-Version': 'v1', ...(init.headers || {}) } })
  if (res.status === 403) {
    // Limiet: een uur wachten en opnieuw.
    console.log(`${stamp()} limiet bereikt, 61 minuten wachten…`)
    await sleep(61 * 60 * 1000)
    return api(url, init)
  }
  if (!res.ok) throw new Error(`Unsplash ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}
const zoek = async (q) => (await api(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=30&orientation=landscape&content_filter=high`)).results || []

function score(photo, woorden) {
  const tekst = [photo.description, photo.alt_description, ...(photo.tags || []).map(t => t.title)].filter(Boolean).join(' ').toLowerCase()
  return woorden.reduce((n, w) => n + (tekst.includes(w) ? 1 : 0), 0)
}

async function verwerk(tabel, rij, query, woorden) {
  const huidig = basis(rij.image_url)
  const resultaten = await zoek(query)
  let foto = resultaten.find(p => basis(p.urls?.raw) === huidig)
  let zelfde = !!foto
  if (!foto) {
    const kandidaten = resultaten.map(p => ({ p, s: score(p, woorden) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s || (b.p.likes || 0) - (a.p.likes || 0))
    foto = kandidaten[0]?.p || null
  }
  if (!foto) return { status: 'geen_match' }
  const update = {
    image_source: 'unsplash',
    image_author: foto.user?.name || 'Onbekend',
    image_author_url: metUtm(foto.user?.links?.html),
    image_photo_id: foto.id,
    ...(zelfde ? {} : { image_url: `${basis(foto.urls.raw)}?w=800&h=600&fit=crop` }),
  }
  if (!DRY) {
    const { error } = await supabase.from(tabel).update(update).eq('id', rij.id)
    if (error) throw new Error(error.message)
    await sleep(DELAY_S * 1000)
    if (foto.links?.download_location) await api(foto.links.download_location).catch(() => {})
  }
  return { status: zelfde ? 'zelfde_foto' : 'vervangen', auteur: update.image_author }
}

async function main() {
  const lijst = []
  if (TABEL !== 'ingredients') {
    const { data } = await supabase.from('ai_meals').select('id, name, image_url').ilike('image_url', '%images.unsplash.com%').is('image_author', null).order('name')
    for (const r of data || []) lijst.push({ tabel: 'ai_meals', rij: r })
  }
  if (TABEL !== 'meals') {
    const { data } = await supabase.from('ai_ingredients').select('id, name, image_url').ilike('image_url', '%images.unsplash.com%').is('image_author', null).order('name')
    for (const r of data || []) lijst.push({ tabel: 'ai_ingredients', rij: r })
  }
  let todo = ONLY ? lijst.filter(x => (x.rij.name || '').toLowerCase().includes(ONLY.toLowerCase())) : lijst
  if (LIMIT) todo = todo.slice(0, LIMIT)
  console.log(`${stamp()} ${todo.length} rijen${DRY ? ' (dry-run)' : ''}, ${DELAY_S} s tussen verzoeken`)

  const telling = {}
  for (const { tabel, rij } of todo) {
    const plan = tabel === 'ai_meals' ? buildQuery(rij.name) : null
    const query = plan?.query || `${String(rij.name || '').replace(/\(.*?\)/g, '').trim()} food`
    const woorden = (plan?.terms || [String(rij.name || '')]).join(' ').toLowerCase().split(/\s+/).filter(w => w.length > 2)
    try {
      const r = await verwerk(tabel, rij, query, woorden)
      telling[r.status] = (telling[r.status] || 0) + 1
      console.log(`${stamp()} ${r.status.padEnd(12)} ${tabel === 'ai_meals' ? 'M' : 'I'} ${rij.name}${r.auteur ? ` → ${r.auteur}` : ''}`)
    } catch (e) {
      telling.fout = (telling.fout || 0) + 1
      console.error(`${stamp()} fout         ${rij.name}: ${e.message}`)
    }
    await sleep(DELAY_S * 1000)
  }
  console.log(`${stamp()} klaar: ${JSON.stringify(telling)} · ${verzoeken} verzoeken`)
}
main()
