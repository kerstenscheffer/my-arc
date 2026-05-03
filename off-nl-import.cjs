#!/usr/bin/env node
const fetch = require('node-fetch')
globalThis.fetch = fetch
globalThis.Headers = fetch.Headers
globalThis.Request = fetch.Request
globalThis.Response = fetch.Response

const { createClient } = require('@supabase/supabase-js')
const { spawn } = require('child_process')
const zlib = require('zlib')
const readline = require('readline')

const SUPABASE_URL = 'https://xlaycpwpnhjmulfsnynh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYXljcHdwbmhqbXVsZnNueW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTEzNDUsImV4cCI6MjA3MDU4NzM0NX0.19WRJrOO4Yll95w9j8qa8ZgoXFiwPK39farBuNSyd6c'
const BATCH_SIZE = 200
const MAX_PRODUCTS = 50000
const DUMP_URL = 'https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function mapCategory(tags) {
  if (!tags || !Array.isArray(tags)) return 'other'
  const t = tags.map(x => x.toLowerCase())
  if (t.some(x => x.includes('meat') || x.includes('poultry') || x.includes('chicken') || x.includes('beef') || x.includes('pork') || x.includes('fish') || x.includes('seafood') || x.includes('salmon') || x.includes('tuna') || x.includes('turkey') || x.includes('vlees') || x.includes('kip') || x.includes('vis') || x.includes('egg') || x.includes('eier'))) return 'protein'
  if (t.some(x => x.includes('dairy') || x.includes('milk') || x.includes('cheese') || x.includes('yogurt') || x.includes('yoghurt') || x.includes('quark') || x.includes('kwark') || x.includes('zuivel') || x.includes('kaas') || x.includes('melk') || x.includes('butter') || x.includes('cream'))) return 'dairy'
  if (t.some(x => x.includes('fruit') || x.includes('apple') || x.includes('banana') || x.includes('berry') || x.includes('orange') || x.includes('appel') || x.includes('banaan'))) return 'fruits'
  if (t.some(x => x.includes('vegetable') || x.includes('salad') || x.includes('groente') || x.includes('tomato') || x.includes('broccoli') || x.includes('spinach') || x.includes('carrot') || x.includes('sla'))) return 'vegetables'
  if (t.some(x => x.includes('bread') || x.includes('pasta') || x.includes('rice') || x.includes('cereal') || x.includes('grain') || x.includes('brood') || x.includes('rijst') || x.includes('potato') || x.includes('aardappel') || x.includes('noodle') || x.includes('oat'))) return 'carbs'
  if (t.some(x => x.includes('oil') || x.includes('olie') || x.includes('nut') || x.includes('noten') || x.includes('seed') || x.includes('avocado') || x.includes('pindakaas'))) return 'fats'
  if (t.some(x => x.includes('sauce') || x.includes('saus') || x.includes('spice') || x.includes('condiment') || x.includes('ketchup') || x.includes('mustard') || x.includes('mayonnaise') || x.includes('dressing'))) return 'condiments'
  return 'other'
}

function mapStorageType(tags) {
  if (!tags || !Array.isArray(tags)) return 'pantry'
  const t = tags.map(x => x.toLowerCase())
  if (t.some(x => x.includes('frozen') || x.includes('ice') || x.includes('diepvries'))) return 'freezer'
  if (t.some(x => x.includes('fresh') || x.includes('meat') || x.includes('dairy') || x.includes('milk') || x.includes('cheese') || x.includes('yogurt') || x.includes('fish') || x.includes('vlees') || x.includes('zuivel') || x.includes('vis') || x.includes('salad'))) return 'fridge'
  if (t.some(x => x.includes('fruit') || x.includes('vegetable') || x.includes('groente'))) return 'fresh'
  return 'pantry'
}

function extractName(p) {
  const c = [p.product_name_nl, p.generic_name_nl, p.product_name, p.product_name_en, p.generic_name, p.generic_name_en].filter(Boolean).map(n => n.trim()).filter(n => n.length > 1)
  if (c.length === 0) return null
  let name = c[0]
  if (name.length > 120) name = name.substring(0, 120)
  if (name === name.toUpperCase() && name.length > 3) name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  return name
}

function extractVitamins(n) {
  if (!n) return {}
  const vm = {}
  const fields = { 'vitamin-a_100g': 'vitamin_a_ug', 'vitamin-c_100g': 'vitamin_c_mg', 'vitamin-d_100g': 'vitamin_d_ug', 'vitamin-e_100g': 'vitamin_e_mg', 'vitamin-b1_100g': 'vitamin_b1_mg', 'vitamin-b2_100g': 'vitamin_b2_mg', 'vitamin-b6_100g': 'vitamin_b6_mg', 'vitamin-b9_100g': 'vitamin_b9_ug', 'vitamin-b12_100g': 'vitamin_b12_ug', 'calcium_100g': 'calcium_mg', 'iron_100g': 'iron_mg', 'magnesium_100g': 'magnesium_mg', 'zinc_100g': 'zinc_mg', 'potassium_100g': 'potassium_mg', 'phosphorus_100g': 'phosphorus_mg', 'iodine_100g': 'iodine_ug', 'selenium_100g': 'selenium_ug' }
  for (const [k, v] of Object.entries(fields)) { const val = parseFloat(n[k]); if (!isNaN(val) && val > 0) vm[v] = Math.round(val * 1000) / 1000 }
  return Object.keys(vm).length > 0 ? vm : {}
}

function extractAllergens(p) {
  const a = []
  const tags = p.allergens_tags || []
  const m = { 'en:gluten': 'gluten', 'en:milk': 'lactose', 'en:eggs': 'ei', 'en:nuts': 'noten', 'en:peanuts': 'pinda', 'en:soybeans': 'soja', 'en:fish': 'vis', 'en:crustaceans': 'schaaldieren', 'en:celery': 'selderij', 'en:mustard': 'mosterd', 'en:sesame-seeds': 'sesam', 'en:sulphur-dioxide-and-sulphites': 'sulfiet', 'en:lupin': 'lupine', 'en:molluscs': 'weekdieren' }
  for (const tag of tags) { const mapped = m[tag.toLowerCase()]; if (mapped) a.push(mapped) }
  return a
}

function r2(num) { return Math.round(num * 100) / 100 }

function isValid(p) {
  if (!p.code || p.code.length < 4) return false
  const countries = p.countries_tags || []
  if (!countries.some(c => c === 'en:netherlands' || c === 'en:nederland')) return false
  if (!extractName(p)) return false
  const n = p.nutriments || {}
  const cal = parseFloat(n['energy-kcal_100g']) || parseFloat(n['energy_100g'] || 0) / 4.184
  if (!cal || cal <= 0 || cal > 1000) return false
  const protein = parseFloat(n.proteins_100g) || 0
  const carbs = parseFloat(n.carbohydrates_100g) || 0
  const fat = parseFloat(n.fat_100g) || 0
  if (protein + carbs + fat <= 0) return false
  return true
}

function transform(p) {
  const n = p.nutriments || {}
  const name = extractName(p)
  const brand = (p.brands || '').split(',')[0].trim() || null
  let displayName = name
  if (brand && !name.toLowerCase().includes(brand.toLowerCase())) displayName = name + ' (' + brand + ')'
  const calories = Math.round(parseFloat(n['energy-kcal_100g']) || (parseFloat(n['energy_100g'] || 0) / 4.184))
  return {
    name: displayName, name_en: (p.product_name_en || '').trim() || null, barcode: p.code, brand: brand,
    category: mapCategory(p.categories_tags), calories_per_100g: calories,
    protein_per_100g: r2(parseFloat(n.proteins_100g) || 0), carbs_per_100g: r2(parseFloat(n.carbohydrates_100g) || 0),
    fat_per_100g: r2(parseFloat(n.fat_100g) || 0), fiber_per_100g: r2(parseFloat(n.fiber_100g) || 0),
    sugar_per_100g: r2(parseFloat(n.sugars_100g) || 0), saturated_fat_per_100g: r2(parseFloat(n['saturated-fat_100g']) || 0),
    sodium_per_100g: r2(parseFloat(n.sodium_100g) || 0),
    image_url: p.image_front_url || p.image_front_small_url || p.image_url || null,
    allergens: extractAllergens(p), store_name: p.stores ? p.stores.split(',')[0].trim() : null,
    storage_type: mapStorageType(p.categories_tags), nutriscore: p.nutriscore_grade || p.nutrition_grades || null,
    quantity: p.quantity || null, vitamins_minerals: extractVitamins(n), serving_description: p.serving_size || null,
    source: 'openfoodfacts', scalable: true, unit_type: 'gram', cost_tier: 'budget',
    default_portion_gram: 100, min_portion_gram: 10, max_portion_gram: 500, log_count: 0, labels: '[]', season: ['all_year']
  }
}

async function upsertBatch(products) {
  if (products.length === 0) return { inserted: 0, errors: 0 }
  const { error } = await supabase.from('ai_ingredients').upsert(products, { onConflict: 'barcode', ignoreDuplicates: false })
  if (error) {
    let inserted = 0, errors = 0
    for (const p of products) {
      const { error: e } = await supabase.from('ai_ingredients').upsert([p], { onConflict: 'barcode', ignoreDuplicates: true })
      if (e) { errors++; if (errors <= 5) console.error('  ❌ ' + p.name + ' — ' + e.message) } else inserted++
    }
    return { inserted, errors }
  }
  return { inserted: products.length, errors: 0 }
}

function processStream() {
  return new Promise((resolve, reject) => {
    console.log('📥 Live streaming via curl...')
    const startTime = Date.now()
    let totalLines = 0, totalInserted = 0, totalErrors = 0, totalSkipped = 0
    let batchQueue = [], processing = false
    let bytesReceived = 0
    let firstLineReceived = false

    const processBatch = async () => {
      if (processing || batchQueue.length === 0) return
      processing = true
      const batch = batchQueue.splice(0, BATCH_SIZE)
      const result = await upsertBatch(batch)
      totalInserted += result.inserted
      totalErrors += result.errors
      processing = false
      if (batchQueue.length >= BATCH_SIZE) processBatch()
    }

    console.log('🔄 curl starten...')
    const curl = spawn('curl', ['-sL', DUMP_URL])
    console.log('🔄 curl gestart, PID: ' + curl.pid)

    curl.on('error', (err) => {
      console.error('❌ curl error:', err.message)
      reject(err)
    })

    curl.on('close', (code) => {
      console.log('🔄 curl afgesloten met code: ' + code)
    })

    const gunzip = zlib.createGunzip()

    gunzip.on('error', (err) => {
      console.error('❌ gunzip error:', err.message)
      reject(err)
    })

    curl.stdout.on('data', (chunk) => {
      bytesReceived += chunk.length
      if (!firstLineReceived && bytesReceived > 0) {
        console.log('🔄 Eerste data ontvangen: ' + bytesReceived + ' bytes')
        firstLineReceived = true
      }
      if (bytesReceived % 50000000 < 100000) {
        console.log('📡 ' + Math.round(bytesReceived / 1024 / 1024) + 'MB ontvangen...')
      }
    })

    const rl = readline.createInterface({ input: curl.stdout.pipe(gunzip), crlfDelay: Infinity })

    rl.on('line', (line) => {
      totalLines++
      if (totalLines === 1) console.log('✅ Eerste regel ontvangen!')
      if (totalLines <= 3) console.log('📝 Regel ' + totalLines + ' lengte: ' + line.length)
      if (totalLines % 100000 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000)
        console.log('📊 ' + totalLines.toLocaleString() + ' lines | ' + (batchQueue.length + totalInserted) + ' NL | ' + totalInserted + ' inserted | ' + elapsed + 's')
      }
      if (totalInserted + batchQueue.length >= MAX_PRODUCTS) return
      try {
        const p = JSON.parse(line)
        if (!isValid(p)) { totalSkipped++; return }
        batchQueue.push(transform(p))
        if (batchQueue.length >= BATCH_SIZE) processBatch()
      } catch (e) {}
    })

    rl.on('close', async () => {
      console.log('\n📦 Laatste batches...')
      while (batchQueue.length > 0) {
        const batch = batchQueue.splice(0, BATCH_SIZE)
        const result = await upsertBatch(batch)
        totalInserted += result.inserted
        totalErrors += result.errors
      }
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      console.log('\n' + '='.repeat(50))
      console.log('IMPORT COMPLETE')
      console.log('='.repeat(50))
      console.log('Lines gescand:  ' + totalLines.toLocaleString())
      console.log('Geinserteerd:   ' + totalInserted)
      console.log('Errors:         ' + totalErrors)
      console.log('Overgeslagen:   ' + totalSkipped.toLocaleString())
      console.log('Tijd:           ' + Math.floor(elapsed / 60) + 'm ' + (elapsed % 60) + 's')
      console.log('='.repeat(50))
      resolve({ totalInserted, totalErrors })
    })

    rl.on('error', reject)

    // Timeout check na 30 sec
    setTimeout(() => {
      if (totalLines === 0) {
        console.log('⚠️  30s en nog geen regels. Bytes ontvangen: ' + bytesReceived)
        console.log('⚠️  curl PID: ' + curl.pid + ', killed: ' + curl.killed)
      }
    }, 30000)
  })
}

async function main() {
  console.log('='.repeat(50))
  console.log('MY ARC — OFF NL Bulk Import v3 (debug)')
  console.log('='.repeat(50))
  const { count, error } = await supabase.from('ai_ingredients').select('*', { count: 'exact', head: true })
  if (error) { console.error('Supabase fout:', error.message); process.exit(1) }
  console.log('Huidige ai_ingredients: ' + count + '\n')
  try { await processStream() } catch (err) { console.error('Import mislukt:', err.message); process.exit(1) }
  const { count: finalCount } = await supabase.from('ai_ingredients').select('*', { count: 'exact', head: true })
  console.log('\nTotaal ai_ingredients nu: ' + finalCount)
  console.log('Klaar!')
}

main()
