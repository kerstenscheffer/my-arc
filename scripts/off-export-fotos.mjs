// scripts/off-export-fotos.mjs
// Productfoto's uit de complete Open Food Facts-export in plaats van één
// API-verzoek per barcode (OFF remt dat af tot ~12 per minuut). De export
// (~1 GB gz) wordt gestreamd en niet opgeslagen; alleen barcodes die wij
// hebben worden onthouden.
//
// Database: een paar lees-pagina's aan het begin, daarna per 100 producten
// één aanroep van productfotos_zet met een seconde pauze. Bestaande foto's
// blijven staan (de functie schrijft alleen waar image_url leeg is).
//
// Gebruik: node scripts/off-export-fotos.mjs [--dry]
import { createClient } from '@supabase/supabase-js'
import { spawn } from 'node:child_process'
import readline from 'node:readline'
import fs from 'node:fs'

const DRY = process.argv.includes('--dry')
const EXPORT = 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz'

const env = { ...process.env }
try {
  const raw = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* alles kan ook uit de environment komen */ }
const supabase = createClient(env.VITE_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

const slaap = (ms) => new Promise(r => setTimeout(r, ms))
const tijd = () => new Date().toLocaleTimeString('nl-NL')
const kern = (b) => String(b).replace(/^0+/, '') // OFF en wij verschillen soms in voorloopnullen

// 1. Onze barcodes zonder foto (ook al gecontroleerde: de export weet soms meer)
const perCode = new Map()
let vanaf = '00000000-0000-0000-0000-000000000000'
for (;;) {
  const { data, error } = await supabase.from('ai_ingredients')
    .select('id, barcode').not('barcode', 'is', null).is('image_url', null)
    .gt('id', vanaf).order('id').limit(1000)
  if (error) throw error
  for (const r of data) {
    if (!/^[0-9]{6,14}$/.test(r.barcode)) continue
    const k = kern(r.barcode)
    if (!perCode.has(k)) perCode.set(k, [])
    perCode.get(k).push(r.id)
  }
  if (data.length < 1000) break
  vanaf = data[data.length - 1].id
  await slaap(500)
}
console.log(`${tijd()}  ${perCode.size} barcodes zonder foto`)

// 2. Export streamen
const curl = spawn('sh', ['-c', `curl -sL ${EXPORT} | gunzip`])
const rl = readline.createInterface({ input: curl.stdout, crlfDelay: Infinity })
let kop = null, iCode, iFront, iImg, regels = 0
const gevonden = []
for await (const line of rl) {
  if (!kop) {
    kop = line.split('\t')
    iCode = kop.indexOf('code'); iFront = kop.indexOf('image_front_url'); iImg = kop.indexOf('image_url')
    if (iCode < 0 || (iFront < 0 && iImg < 0)) throw new Error('Onverwachte kolommen: ' + kop.slice(0, 20).join(','))
    continue
  }
  if (++regels % 500000 === 0) console.log(`${tijd()}  ${regels} regels gelezen, ${gevonden.length} treffers`)
  const v = line.split('\t')
  const k = kern(v[iCode] || '')
  const ids = perCode.get(k)
  if (!ids) continue
  const url = (iFront >= 0 && v[iFront]) || (iImg >= 0 && v[iImg]) || ''
  if (!url.startsWith('https://')) continue
  for (const id of ids) gevonden.push({ id, url })
  perCode.delete(k)
}
console.log(`${tijd()}  export klaar: ${regels} regels, ${gevonden.length} producten met foto`)

// 3. Rustig wegschrijven
let geschreven = 0
for (let i = 0; i < gevonden.length; i += 100) {
  const batch = gevonden.slice(i, i + 100)
  if (!DRY) {
    const { data, error } = await supabase.rpc('productfotos_zet', { p_rijen: batch })
    if (error) { console.error(`${tijd()}  schrijffout:`, error.message); await slaap(5000); continue }
    geschreven += data
  }
  if ((i / 100) % 20 === 0) console.log(`${tijd()}  ${i + batch.length}/${gevonden.length} geschreven`)
  await slaap(1000)
}
console.log(`${tijd()}  klaar: ${geschreven} foto's gezet${DRY ? ' (dry)' : ''}`)
