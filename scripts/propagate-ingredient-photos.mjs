// scripts/propagate-ingredient-photos.mjs
// Zorgt dat identieke ingrediënten (zelfde product, andere schrijfwijze) dezelfde
// foto krijgen. Groepeert canonieke ingrediënten op een genormaliseerde sleutel
// (woordset + lichte NL-stemming) en zet de béste foto van de groep op alle leden.
// Prioriteit foto: eigen upload (ingredient-photos) > andere image_url.
// Schrijft NOOIT over een bestaande eigen-foto heen. Dry-run standaard; --commit voert door.
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const COMMIT = process.argv.includes('--commit')
const envRaw = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const env = {}
for (const line of envRaw.split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

// Lichte NL-stemming voor veelvoorkomende bijvoeglijke varianten zodat
// "Magere Kwark" == "Kwark (Mager)" == "Kwark Mager".
const STEM = {
  magere: 'mager', vetarme: 'vetarm', volle: 'vol', halfvolle: 'halfvol',
  gekookte: 'gekookt', gebakken: 'gebakken', verse: 'vers', gerookte: 'gerookt',
  gemengde: 'gemengd', gedroogde: 'gedroogd', rauwe: 'rauw', gele: 'geel',
  rode: 'rood', groene: 'groen', witte: 'wit', bruine: 'bruin', blauwe: 'blauw',
  plakjes: 'plak', blokjes: 'blok',
}
const STOP = new Set(['de', 'het', 'een', 'met', 'van', 'en'])
const isEigen = (u) => typeof u === 'string' && u.includes('ingredient-photos')
const hasUrl = (u) => typeof u === 'string' && u.trim() !== ''

const key = (name) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
  .map(w => STEM[w] || w).filter(w => w && !STOP.has(w)).sort().join(' ')

async function main() {
  const { data: rows, error } = await supabase
    .from('ai_ingredients').select('id, name, image_url').eq('source', 'coach')
  if (error) { console.error('DB error:', error.message); process.exit(1) }

  const groups = new Map()
  for (const r of rows) { const k = key(r.name); if (!k) continue; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r) }

  const updates = [] // { id, name, from, to, src }
  for (const [, members] of groups) {
    if (members.length < 2) continue
    // beste bron in de groep: eigen-foto eerst, anders enige andere url
    const eigen = members.find(m => isEigen(m.image_url))
    const anyUrl = members.find(m => hasUrl(m.image_url))
    const best = eigen || anyUrl
    if (!best) continue
    for (const m of members) {
      if (m.id === best.id) continue
      if (isEigen(m.image_url)) continue // nooit een eigen-foto overschrijven
      // vul lege foto's altijd; vervang unsplash alleen als de bron een eigen-foto is
      const shouldSet = !hasUrl(m.image_url) || (isEigen(best.image_url) && !isEigen(m.image_url))
      if (shouldSet && m.image_url !== best.image_url) {
        updates.push({ id: m.id, name: m.name, from: m.image_url ? (isEigen(m.image_url) ? 'eigen' : 'unsplash') : 'GEEN', to: isEigen(best.image_url) ? 'eigen' : 'unsplash', via: best.name, url: best.image_url })
      }
    }
  }

  console.log(`\n=== FOTO-PROPAGATIE (${COMMIT ? 'COMMIT' : 'DRY-RUN'}) ===`)
  console.log(`Ingrediënten: ${rows.length} | groepen met varianten: ${[...groups.values()].filter(g => g.length > 1).length} | voorgestelde wijzigingen: ${updates.length}\n`)
  for (const u of updates) console.log(`  ${u.name}  [${u.from} → ${u.to}]  via "${u.via}"`)

  if (!COMMIT) { console.log('\nDry-run — niets gewijzigd. Draai met --commit om door te voeren.'); return }
  let done = 0, failed = 0
  for (const u of updates) {
    const { error: e } = await supabase.from('ai_ingredients').update({ image_url: u.url }).eq('id', u.id)
    if (e) { failed++; console.error(`  ✗ ${u.name}: ${e.message}`) } else done++
  }
  console.log(`\n=== KLAAR === bijgewerkt: ${done} | mislukt: ${failed}`)
}
main().catch(e => { console.error(e); process.exit(1) })
