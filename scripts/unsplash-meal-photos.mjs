// scripts/unsplash-meal-photos.mjs
// Zoekt voor maaltijden zonder foto (ai_meals.image_url leeg) een passende foto
// op Unsplash en zet die in de DB. Nederlandse maaltijdnamen worden eerst naar
// Engelse zoektermen vertaald; kan de naam niet vertaald worden of past geen
// enkele foto, dan wordt de maaltijd OVERGESLAGEN (nooit een gok-foto).
//
// Gebruik:
//   node scripts/unsplash-meal-photos.mjs --plan            # alleen naam -> zoekterm, geen netwerk, geen DB
//   node scripts/unsplash-meal-photos.mjs --all --dry       # zoekt wel op Unsplash, schrijft niets
//   node scripts/unsplash-meal-photos.mjs --all             # schrijft image_url naar ai_meals
//   extra: --limit 25  --delay 75  --overwrite  --only "kwark"
//
// Env (uit .env.local of via environment):
//   VITE_SUPABASE_URL / SUPABASE_URL, SUPABASE_SERVICE_KEY, UNSPLASH_ACCESS_KEY
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d }

const PLAN = has('--plan')
const DRY = has('--dry') || PLAN
const OVERWRITE = has('--overwrite')
const LIMIT = parseInt(val('--limit', '0'), 10) || 0
const DELAY = parseInt(val('--delay', '0'), 10) || 0
const ONLY = val('--only', '')
const LOG_PATH = val('--log', 'photo-log.csv')

// --- env ---
const env = { ...process.env }
try {
  const raw = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* .env.local hoeft niet te bestaan als alles in de environment staat */ }

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_KEY
const UNSPLASH_KEY = env.UNSPLASH_ACCESS_KEY
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Ontbreekt: SUPABASE_URL / SUPABASE_SERVICE_KEY'); process.exit(1) }
if (!UNSPLASH_KEY && !PLAN) { console.error('Ontbreekt: UNSPLASH_ACCESS_KEY (of draai met --plan)'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// --- NL -> EN woordenboek -------------------------------------------------
// [zoekterm in de naam, engelse term, gewicht]. Hoger gewicht = belangrijker in
// de zoekopdracht. Meerwoordige termen staan boven de losse woorden en winnen.
const DICT = [
  // gerechten (hoogste gewicht: die beschrijven het bord in één woord)
  ['pho bo', 'pho noodle soup', 10], ['pad thai', 'pad thai', 10], ['bibimbap', 'bibimbap', 10],
  ['chili con carne', 'chili con carne', 10], ['nasi goreng', 'nasi goreng fried rice', 10],
  ['bami goreng', 'fried noodles', 10], ['butter chicken', 'butter chicken', 10],
  ['shakshuka', 'shakshuka', 10], ['eggs benedict', 'eggs benedict', 10],
  ['english breakfast', 'english breakfast', 10], ['kapsalon', 'kebab fries', 10],
  ['gyros', 'gyros', 10], ['shoarma', 'shawarma', 10], ['shawarma', 'shawarma', 10],
  ['köfte', 'kofta kebab', 10], ['kofte', 'kofta kebab', 10], ['adana', 'adana kebab', 10],
  ['paella', 'paella', 10], ['burrito', 'burrito', 10], ['quesadilla', 'quesadilla', 10],
  ['nacho', 'nachos', 10], ['hamburger', 'hamburger', 10], ['pizza', 'pizza', 10],
  ['caprese', 'caprese salad', 10], ['griekse salade', 'greek salad', 10],
  ['poké', 'poke bowl', 10], ['poke', 'poke bowl', 10], ['buddha', 'buddha bowl', 10],
  ['stamppot', 'mashed potato stew', 10], ['kroket', 'croquette', 10],
  ['frikandelbroodje', 'sausage roll', 10], ['bolognese', 'spaghetti bolognese', 10],
  ['tosti', 'grilled cheese sandwich', 10], ['wentelteefjes', 'french toast', 10],
  ['franse toast', 'french toast', 10], ['french toast', 'french toast', 10],
  ['pannenkoek', 'pancakes', 10], ['pancakes', 'pancakes', 10], ['wafels', 'waffles', 10],
  ['energy balls', 'energy balls', 10], ['trail mix', 'trail mix', 10],
  ['protein bar', 'protein bar', 10], ['proteïnereep', 'protein bar', 10],
  ['proteinereep', 'protein bar', 10], ['mueslireep', 'granola bar', 10],
  ['liga', 'biscuit', 9], ['overnight oats', 'overnight oats', 10],
  ['meal prep', 'meal prep container', 6], ['rijstepap', 'rice pudding', 10],
  ['rijstschotel', 'rice casserole', 10], ['loaded fries', 'loaded fries', 10],
  ['instant noodles', 'instant noodles', 10], ['macaroni', 'macaroni cheese', 10],
  ['tzatziki', 'tzatziki', 8], ['satésaus', 'satay sauce', 8], ['satesaus', 'satay sauce', 8],
  ['teriyaki', 'teriyaki', 7], ['curry', 'curry', 7], ['soep', 'soup', 7],
  ['smoothie', 'smoothie', 8], ['shake', 'protein shake', 8], ['parfait', 'yogurt parfait', 9],

  // eiwitbron
  ['kipfilet', 'chicken breast', 9], ['kip', 'chicken', 9], ['chicken', 'chicken', 9],
  ['kalkoen', 'turkey', 9], ['gehakt', 'ground beef', 9], ['minced', 'ground beef', 9],
  ['runderreepjes', 'beef strips', 9], ['rundvlees', 'beef', 9], ['biefstuk', 'steak', 9],
  ['varkenshaas', 'pork tenderloin', 9], ['slavink', 'meat roll', 9],
  ['rookworst', 'smoked sausage', 9], ['worst', 'sausage', 8], ['rookvlees', 'cured beef', 8],
  ['ham', 'ham', 8], ['zalm', 'salmon', 9], ['salmon', 'salmon', 9], ['tonijn', 'tuna', 9],
  ['tuna', 'tuna', 9], ['kabeljauw', 'cod fish', 9], ['garnalen', 'shrimp', 9],
  ['vissticks', 'fish sticks', 9], ['hollandse nieuwe', 'herring', 9], ['haring', 'herring', 9],
  ['tofu', 'tofu', 9], ['tempeh', 'tempeh', 9], ['paneer', 'paneer', 9],
  ['eiwitomelet', 'egg white omelette', 10], ['egg white', 'egg white omelette', 10],
  ['roerei', 'scrambled eggs', 10], ['scrambled egg', 'scrambled eggs', 10],
  ['spiegelei', 'fried egg', 10], ['gebakken ei', 'fried egg', 10], ['omelet', 'omelette', 10],
  ['eieren', 'eggs', 8], ['eiwitten', 'egg whites', 8], ['ei', 'eggs', 8],
  ['whey', 'protein shake', 8], ['caseine', 'protein shake', 8], ['proteïne', 'protein', 5],
  ['proteine', 'protein', 5], ['protein', 'protein', 5], ['mass gainer', 'protein shake', 9],

  // zuivel
  ['griekse yoghurt', 'greek yogurt', 9], ['greek yog', 'greek yogurt', 9],
  ['frozen yogurt', 'frozen yogurt', 10], ['yoghurt', 'yogurt', 8], ['yogurt', 'yogurt', 8],
  ['skyr', 'skyr yogurt', 9], ['kwark', 'quark yogurt', 9],
  ['cottage cheese', 'cottage cheese', 9], ['huttenkäse', 'cottage cheese', 9],
  ['hüttenkäse', 'cottage cheese', 9], ['huttekase', 'cottage cheese', 9],
  ['huttenkase', 'cottage cheese', 9], ['cream cheese', 'cream cheese', 9],
  ['mozzarella', 'mozzarella', 8], ['parmezaan', 'parmesan', 8], ['ricotta', 'ricotta', 9],
  ['brie', 'brie cheese', 9], ['feta', 'feta', 8], ['kaassaus', 'cheese sauce', 8],
  ['kazen', 'cheese', 7], ['kaas', 'cheese', 7], ['melk', 'milk', 6], ['boter', 'butter', 5],

  // koolhydraten
  ['zoete aardappel', 'sweet potato', 8], ['aardappelpuree', 'mashed potatoes', 8],
  ['krieltjes', 'baby potatoes', 8], ['aardappel', 'potatoes', 8], ['patat', 'fries', 8],
  ['friet', 'fries', 8], ['fries', 'fries', 8],
  ['zilvervliesrijst', 'brown rice', 8], ['bruine rijst', 'brown rice', 8],
  ['basmati', 'basmati rice', 8], ['bloemkoolrijst', 'cauliflower rice', 8],
  ['rijstwafel', 'rice cakes', 9], ['rijst', 'rice', 8],
  ['spaghetti', 'spaghetti', 8], ['pasta', 'pasta', 8], ['noodles', 'noodles', 8],
  ['noedel', 'noodles', 8], ['couscous', 'couscous', 8], ['bulgur', 'bulgur', 8],
  ['quinoa', 'quinoa', 8], ['boekweit', 'buckwheat', 8], ['havermout', 'oatmeal', 9],
  ['oats', 'oatmeal', 9], ['haver', 'oats', 8], ['cream of rice', 'rice porridge', 9],
  ['brinta', 'porridge', 9], ['cruesli', 'granola', 8], ['granola', 'granola', 8],
  ['muesli', 'muesli', 8], ['bagel', 'bagel', 9], ['pistolet', 'bread roll', 8],
  ['boterham', 'sandwich', 8], ['broodje', 'sandwich', 8], ['brood', 'bread', 8],
  ['toast', 'toast', 8], ['wrap', 'wrap', 8], ['cracker', 'crackers', 7],
  ['tijgerbrood', 'tiger bread', 8], ['hagelslag', 'chocolate sprinkles', 7],

  // groente / peulvrucht
  ['broccoli', 'broccoli', 7], ['sperziebonen', 'green beans', 7], ['spinazie', 'spinach', 7],
  ['boerenkool', 'kale', 7], ['champignon', 'mushrooms', 7], ['paprika', 'bell pepper', 6],
  ['komkommer', 'cucumber', 6], ['tomatensaus', 'tomato sauce', 7], ['tomaat', 'tomato', 6],
  ['tomaten', 'tomato', 6], ['kikkererwten', 'chickpeas', 7], ['linzen', 'lentils', 7],
  ['kidneybonen', 'kidney beans', 7], ['bonen', 'beans', 6], ['hummus', 'hummus', 8],
  ['avocado', 'avocado', 8], ['salade', 'salad', 6], ['sla', 'salad', 5],
  ['groente', 'vegetables', 5], ['roerbak', 'stir fry', 7], ['wok', 'stir fry', 7],
  ['traybake', 'traybake', 7], ['ui', 'onion', 4],

  // fruit / noten / zoet
  ['banaan', 'banana', 7], ['bananen', 'banana', 7], ['aardbeien', 'strawberries', 7],
  ['blauwe bessen', 'blueberries', 7], ['bosvruchten', 'mixed berries', 7],
  ['rood fruit', 'red berries', 7], ['bessen', 'berries', 7], ['appel', 'apple', 6],
  ['peer', 'pear', 6], ['kiwi', 'kiwi', 6], ['fruit', 'fruit', 5],
  ['pindakaas', 'peanut butter', 8], ['peanut butter', 'peanut butter', 8],
  ['walnoten', 'walnuts', 7], ['amandelen', 'almonds', 7], ['cashewnoten', 'cashews', 7],
  ['noten', 'nuts', 6], ['pompoenpitten', 'pumpkin seeds', 7], ['chiazaad', 'chia seeds', 8],
  ['honing', 'honey', 6], ['kaneel', 'cinnamon', 5], ['stroop', 'syrup', 5],
  ['jam', 'jam', 6], ['chocolade', 'chocolate', 6], ['vanille', 'vanilla', 5],
  ['açaí', 'acai bowl', 10], ['acai', 'acai bowl', 10], ['pudding', 'pudding', 7],
  ['bbq saus', 'bbq sauce', 7], ['bbq', 'bbq', 6], ['pesto', 'pesto', 8],
  ['aglio', 'aglio e olio', 9], ['muffin', 'muffin', 8],
]

// Woorden die niets over het gerecht zeggen.
const NOISE = /\b(aangepast|met|en|de|het|een|op|uit|in|van|voor|zonder|per|stuks?|groot|klein|kleine|snelle|dubbele|enkele|mini|warme|koude|homemade|special|speciaal|upgraded|original|naturel|light|mager|magere|vetarm|volle|halfvolle|hartige|vezelrijk|extra|high|lean|zero|carb|double|triple|pre-?workout|post-?workout|ptf|snack|ontbijt|lunch|diner|avondeten|portie|bowl|cup|cups|mix|handful|smaak|toetje|bank|marathon|goody|foody|vegan|filet)\b/gi

const normalize = (s) => (s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9äëïöüéèêáàçñ\s-]/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()

// Bouwt de Engelse zoekterm. Geeft null terug als niets herkend wordt.
// Langste term eerst, en een gevonden term wordt uit de naam geknipt, zodat
// "zoete aardappel" niet óók nog als "aardappel" meetelt.
const SORTED = [...DICT].sort((a, b) => b[0].length - a[0].length)

function buildQuery(rawName) {
  const name = (rawName || '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim()
  const plain = normalize(rawName).replace(NOISE, ' ').replace(/\s+/g, ' ').trim()
  let hay = ` ${name} `
  let hayPlain = ` ${plain} `

  const hits = []
  const seen = new Set()
  for (const [nl, en, weight] of SORTED) {
    const needle = nl.toLowerCase()
    const short = needle.length <= 3
    const re = new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'g')
    const found = short
      ? re.test(hayPlain) || re.test(hay)
      : hay.includes(needle) || hayPlain.includes(needle)
    if (!found) continue
    // knip de term weg zodat losse woorden erin niet opnieuw matchen
    if (short) {
      hay = hay.replace(new RegExp(re.source, 'g'), ' ')
      hayPlain = hayPlain.replace(new RegExp(re.source, 'g'), ' ')
    } else {
      hay = hay.split(needle).join(' ')
      hayPlain = hayPlain.split(needle).join(' ')
    }
    if (seen.has(en)) continue
    hits.push({ en, weight })
    seen.add(en)
  }
  if (!hits.length) return null
  hits.sort((a, b) => b.weight - a.weight)
  const terms = hits.slice(0, 3).map((h) => h.en)
  return { terms, query: `${terms.join(' ')} food`, primary: terms[0] }
}

// --- Unsplash -------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const usedPhotoIds = new Set()

async function unsplashSearch(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape&content_filter=high`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}`, 'Accept-Version': 'v1' } })
  if (res.status === 403) throw new Error('Unsplash rate limit bereikt (403) — stop en probeer later of verhoog --delay')
  if (!res.ok) throw new Error(`Unsplash ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.results || []
}

// Scoort een foto op hoe goed hij bij de zoektermen past.
function scorePhoto(photo, terms) {
  const text = [photo.description, photo.alt_description, ...(photo.tags || []).map((t) => t.title)]
    .filter(Boolean).join(' ').toLowerCase()
  let score = 0
  const words = terms.join(' ').split(/\s+/).filter((w) => w.length > 2)
  for (const w of words) if (text.includes(w)) score += 1
  const primaryWords = terms[0].split(/\s+/).filter((w) => w.length > 2)
  const primaryHit = primaryWords.some((w) => text.includes(w))
  return { score, primaryHit }
}

async function findPhoto(plan) {
  const attempts = [plan.query, `${plan.primary} food`]
  for (const q of attempts) {
    const results = await unsplashSearch(q)
    const ranked = results
      .filter((p) => !usedPhotoIds.has(p.id))
      .map((p) => ({ p, ...scorePhoto(p, plan.terms) }))
      .filter((r) => r.primaryHit)
      .sort((a, b) => b.score - a.score)
    if (ranked.length) return { photo: ranked[0].p, query: q, score: ranked[0].score }
    if (DELAY) await sleep(DELAY)
  }
  return null
}

const buildUrl = (photo) => `${photo.urls.raw.split('?')[0]}?w=800&h=600&fit=crop`

// Unsplash-voorwaarde: registreer een 'download' als je de foto gebruikt.
async function triggerDownload(photo) {
  try {
    await fetch(`${photo.links.download_location}`, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } })
  } catch { /* niet fataal */ }
}

// --- main -----------------------------------------------------------------
const csv = [['id', 'naam', 'status', 'zoekterm', 'score', 'url', 'reden'].join(',')]
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

async function main() {
  let q = supabase.from('ai_meals').select('id, name, image_url').order('name')
  if (!OVERWRITE) q = q.or('image_url.is.null,image_url.eq.')
  const { data: meals, error } = await q
  if (error) { console.error('DB-fout:', error.message); process.exit(1) }

  let list = meals || []
  if (ONLY) list = list.filter((m) => (m.name || '').toLowerCase().includes(ONLY.toLowerCase()))
  if (LIMIT) list = list.slice(0, LIMIT)

  const stats = { ok: 0, no_match_skipped: 0, no_terms_skipped: 0, error: 0 }
  console.log(`${list.length} maaltijden${PLAN ? ' (plan-modus: geen netwerk, geen DB)' : DRY ? ' (dry-run: geen DB-writes)' : ''}\n`)

  for (const meal of list) {
    const plan = buildQuery(meal.name)
    if (!plan) {
      stats.no_terms_skipped++
      csv.push([meal.id, meal.name, 'no_terms_skipped', '', '', '', 'geen herkenbare term in de naam'].map(esc).join(','))
      console.log(`- ${meal.name}  →  (geen term herkend)`)
      continue
    }
    if (PLAN) {
      csv.push([meal.id, meal.name, 'plan', plan.query, '', '', ''].map(esc).join(','))
      console.log(`- ${meal.name}  →  "${plan.query}"`)
      continue
    }
    try {
      const found = await findPhoto(plan)
      if (!found) {
        stats.no_match_skipped++
        csv.push([meal.id, meal.name, 'no_match_skipped', plan.query, '', '', 'geen foto die bij de hoofdterm past'].map(esc).join(','))
        console.log(`- ${meal.name}  →  geen passende foto ("${plan.query}")`)
      } else {
        const url = buildUrl(found.photo)
        usedPhotoIds.add(found.photo.id)
        if (!DRY) {
          const { error: upErr } = await supabase.from('ai_meals').update({ image_url: url }).eq('id', meal.id)
          if (upErr) throw new Error(upErr.message)
          await triggerDownload(found.photo)
        }
        stats.ok++
        csv.push([meal.id, meal.name, 'ok', found.query, found.score, url, ''].map(esc).join(','))
        console.log(`✓ ${meal.name}  →  "${found.query}" (score ${found.score})`)
      }
    } catch (e) {
      stats.error++
      csv.push([meal.id, meal.name, 'error', plan.query, '', '', e.message].map(esc).join(','))
      console.error(`! ${meal.name}: ${e.message}`)
      if (/rate limit/i.test(e.message)) break
    }
    if (DELAY) await sleep(DELAY)
  }

  fs.writeFileSync(LOG_PATH, csv.join('\n'))
  console.log(`\nok: ${stats.ok} | geen foto: ${stats.no_match_skipped} | geen term: ${stats.no_terms_skipped} | fout: ${stats.error}`)
  console.log(`log: ${LOG_PATH}${DRY ? '  (er is niets naar de database geschreven)' : ''}`)
}

main()
