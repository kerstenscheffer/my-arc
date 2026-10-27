// scripts/off-productfotos.mjs
// Haalt verpakkingsfoto's van merkproducten op bij Open Food Facts, vanaf deze
// computer in plaats van vanuit de database. De oude pg_cron-taak
// (productfotos-ophalen) hield per verzoek een DB-verbinding open en legde op
// 14 okt de app plat. Hier raakt de database alleen:
//   - een paar lees-pagina's van 1000 rijen aan het begin
//   - elke 100 producten één update-aanroep (productfotos_zet)
//
// Gebruik:
//   node scripts/off-productfotos.mjs            # alles wat nog niet gecontroleerd is
//   node scripts/off-productfotos.mjs --limit 50 --dry
//
// Env (uit .env.local): VITE_SUPABASE_URL / SUPABASE_URL, SUPABASE_SERVICE_KEY
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const args = process.argv.slice(2)
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d }
const DRY = args.includes('--dry')
const LIMIT = parseInt(val('--limit', '0'), 10) || 0
const PAUZE_MS = parseInt(val('--pauze', '750'), 10) // ~80 verzoeken/min, OFF staat 100/min toe
const BATCH = 100

const env = { ...process.env }
try {
  const raw = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* alles kan ook uit de environment komen */ }

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Ontbreekt: SUPABASE_URL / SUPABASE_SERVICE_KEY'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const slaap = (ms) => new Promise(r => setTimeout(r, ms))
const tijd = () => new Date().toLocaleTimeString('nl-NL')

async function teDoen() {
  const rijen = []
  let vanaf = '00000000-0000-0000-0000-000000000000'
  for (;;) {
    const { data, error } = await supabase
      .from('ai_ingredients')
      .select('id, barcode')
      .not('barcode', 'is', null)
      .is('image_url', null)
      .is('image_url_checked_at', null)
      .gt('id', vanaf)
      .order('id')
      .limit(1000)
    if (error) throw error
    rijen.push(...data.filter(r => /^[0-9]{6,14}$/.test(r.barcode)))
    if (data.length < 1000 || (LIMIT && rijen.length >= LIMIT)) break
    vanaf = data[data.length - 1].id
    await slaap(500)
  }
  return LIMIT ? rijen.slice(0, LIMIT) : rijen
}

async function haalFoto(barcode) {
  for (let poging = 0; poging < 5; poging++) {
    let res
    try {
      res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=image_front_url,image_url`, {
        headers: { 'User-Agent': 'MyArc - Nutrition App - 1.0' },
        signal: AbortSignal.timeout(10000),
      })
    } catch { await slaap(5000); continue }
    if (res.status === 429 || res.status >= 500) {
      console.log(`${tijd()}  OFF ${res.status}, 60 s wachten`)
      await slaap(60000)
      continue
    }
    if (res.status === 404) return { url: null }
    if (!res.ok) return null // onbekend: niet markeren, volgende keer opnieuw
    try {
      const j = await res.json()
      const url = j?.product?.image_front_url || j?.product?.image_url || null
      return { url: url && url.startsWith('https://') ? url : null }
    } catch { return null }
  }
  return null
}

async function schrijf(buffer) {
  if (!buffer.length) return 0
  if (DRY) return buffer.length
  const { data, error } = await supabase.rpc('productfotos_zet', { p_rijen: buffer })
  if (error) { console.error(`${tijd()}  schrijffout:`, error.message); return 0 }
  return data
}

const lijst = await teDoen()
console.log(`${tijd()}  ${lijst.length} producten te controleren${DRY ? ' (dry)' : ''}`)

let buffer = [], gevonden = 0, leeg = 0, overgeslagen = 0, geschreven = 0
for (let i = 0; i < lijst.length; i++) {
  const r = await haalFoto(lijst[i].barcode)
  if (r === null) overgeslagen++
  else {
    buffer.push({ id: lijst[i].id, url: r.url })
    if (r.url) gevonden++; else leeg++
  }
  if (buffer.length >= BATCH) {
    geschreven += await schrijf(buffer)
    buffer = []
    console.log(`${tijd()}  ${i + 1}/${lijst.length}  foto ${gevonden} · geen ${leeg} · overgeslagen ${overgeslagen}`)
  }
  await slaap(PAUZE_MS)
}
geschreven += await schrijf(buffer)
console.log(`${tijd()}  klaar: foto ${gevonden} · geen ${leeg} · overgeslagen ${overgeslagen} · geschreven ${geschreven}`)
