// scripts/import-ingredient-photos.mjs
// Matcht lokale productfoto's aan canonieke ai_ingredients (source='coach'),
// uploadt ze naar de Supabase storage-bucket `ingredient-photos` en zet image_url.
// Dry-run standaard; geef --commit om echt te uploaden + de DB te updaten.
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const COMMIT = process.argv.includes('--commit')
const PHOTO_DIR = '/Users/kerstenscheffer/Downloads/Voeding 12:06'
const BUCKET = 'ingredient-photos'

// --- env uit .env.local ---
const envRaw = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const env = {}
for (const line of envRaw.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing SUPABASE_URL or SERVICE_KEY in .env.local'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif'])
// Handmatige aliassen voor duidelijke typo's/varianten (genormaliseerde bestandsnaam -> correcte productnaam)
const ALIASES = {
  'aarbeien': 'aardbeien',
  'aarbeienjam': 'aardbeienjam',
  'avovado': 'avocado',
  'kabeljouw': 'kabeljauw',
  'sardintjes': 'sardines',
  'rookvlees mager': 'rookvlees (mager)',
  'volkoren wraps': 'volkoren wrap',
  'whey poeder': 'whey protein poeder',
  'magere huttekase': 'huttekase',
  'plakjes kipfilet': 'Kip - filet plakjes (beleg)',
  'tonijninblik': 'Tonijn (blik)',
  'pistolet': 'Pistolets',
}
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[-_]+/g, ' ').replace(/\s+2$/, '').replace(/\s+/g, ' ').trim()

async function main() {
  // 1. producten ophalen
  const { data: products, error } = await supabase
    .from('ai_ingredients').select('id, name, image_url').eq('source', 'coach')
  if (error) { console.error('DB error:', error.message); process.exit(1) }
  // normalized name -> [products]
  const byNorm = new Map()
  // compacte sleutel (haakjes + niet-alfanumeriek weg) voor bijna-treffers
  const compact = (s) => norm(s).replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '')
  const byCompact = new Map()
  for (const p of products) {
    const k = norm(p.name)
    if (!byNorm.has(k)) byNorm.set(k, [])
    byNorm.get(k).push(p)
    const c = compact(p.name)
    if (c) { if (!byCompact.has(c)) byCompact.set(c, []); byCompact.get(c).push(p) }
  }

  // 2. bestanden lezen
  const files = fs.readdirSync(PHOTO_DIR)
  const matched = []   // { file, key, products }
  const unmatched = [] // file
  const skipped = []   // file (junk)

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (!IMG_EXT.has(ext)) { skipped.push(file); continue }
    const base = file.slice(0, -ext.length)
    // junk: camera-namen, barcodes
    if (/^IMG[_-]/i.test(base) || /^\d{8,}/.test(base)) { skipped.push(file); continue }
    const key = norm(base)
    const lookup = ALIASES[key] || base
    let hit = byNorm.get(norm(lookup))
    // fallback: compacte match (kipfilet -> "Kip - filet (vers)", couscous -> "Couscous (droog)")
    if (!hit) hit = byCompact.get(compact(lookup))
    if (hit) matched.push({ file, key, products: hit })
    else unmatched.push(file)
  }

  // 3. rapport
  console.log(`\n=== MATCH-RAPPORT (${COMMIT ? 'COMMIT' : 'DRY-RUN'}) ===`)
  console.log(`Bestanden: ${files.length} | afbeeldingen gematcht: ${matched.length} | niet gematcht: ${unmatched.length} | overgeslagen (geen afbeelding/ruis): ${skipped.length}\n`)
  console.log('--- GEMATCHT (bestand -> product(en)) ---')
  for (const m of matched) {
    const overwrite = m.products.some(p => p.image_url)
    console.log(`  ${m.file}  ->  ${m.products.map(p => p.name).join(', ')}${overwrite ? '  [overschrijft bestaande]' : ''}`)
  }
  console.log('\n--- NIET GEMATCHT (handmatig: hernoem naar productnaam) ---')
  console.log('  ' + (unmatched.join('\n  ') || '(geen)'))
  console.log('\n--- OVERGESLAGEN (pdf/IMG/barcode/etc) ---')
  console.log('  ' + (skipped.join('\n  ') || '(geen)'))

  if (!COMMIT) { console.log('\nDry-run — niets geüpload. Draai met --commit om door te voeren.'); return }

  // 4. bucket + upload + update
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})
  let uploaded = 0, updatedRows = 0, failed = 0
  for (const m of matched) {
    try {
      const ext = path.extname(m.file).toLowerCase()
      const buf = fs.readFileSync(path.join(PHOTO_DIR, m.file))
      const objectPath = `${m.key.replace(/\s+/g, '-')}${ext}`
      const ct = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.avif' ? 'image/avif' : 'image/jpeg'
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, buf, { contentType: ct, upsert: true })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
      const url = pub.publicUrl
      const ids = m.products.map(p => p.id)
      const { error: updErr } = await supabase.from('ai_ingredients').update({ image_url: url }).in('id', ids)
      if (updErr) throw updErr
      uploaded++; updatedRows += ids.length
    } catch (e) { failed++; console.error(`  ✗ ${m.file}: ${e.message}`) }
  }
  console.log(`\n=== KLAAR === geüpload: ${uploaded} | productrijen bijgewerkt: ${updatedRows} | mislukt: ${failed}`)
}

main().catch(e => { console.error(e); process.exit(1) })
