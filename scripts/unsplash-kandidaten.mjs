// scripts/unsplash-kandidaten.mjs
// Verzamelt per zoekterm 12 Unsplash-kandidaten voor maaltijden zonder foto,
// zodat ze daarna met de hand gekeurd worden (nooit blind een foto zetten).
// Raakt de database niet: alleen Unsplash, resultaat in een JSON-bestand.
//
// Invoer: tekstbestand met regels "engelse zoekterm|naam;naam;naam"
// Gebruik: node scripts/unsplash-kandidaten.mjs <zoektermen.txt> <uit.json>
//
// Unsplash (demo-sleutel) staat 50 verzoeken per uur toe: 75 s per verzoek.
// Het script hervat: termen die al in uit.json staan worden overgeslagen.
import fs from 'node:fs'

const [invoer, uit] = process.argv.slice(2)
if (!invoer || !uit) { console.error('Gebruik: node scripts/unsplash-kandidaten.mjs <zoektermen.txt> <uit.json>'); process.exit(1) }

const env = { ...process.env }
try {
  const raw = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* alles kan ook uit de environment komen */ }
const KEY = env.UNSPLASH_ACCESS_KEY
if (!KEY) { console.error('Ontbreekt: UNSPLASH_ACCESS_KEY'); process.exit(1) }

const slaap = (ms) => new Promise(r => setTimeout(r, ms))
const tijd = () => new Date().toLocaleTimeString('nl-NL')

const regels = fs.readFileSync(invoer, 'utf8').split('\n').filter(Boolean).map(l => {
  const [term, namen] = l.split('|')
  return { term: term.trim(), namen: namen.split(';').map(n => n.trim()).filter(Boolean) }
})
const resultaat = fs.existsSync(uit) ? JSON.parse(fs.readFileSync(uit, 'utf8')) : {}

for (const { term, namen } of regels) {
  if (resultaat[term]) continue
  const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=12&orientation=landscape&content_filter=high`, {
    headers: { Authorization: `Client-ID ${KEY}`, 'Accept-Version': 'v1' },
  })
  const over = Number(res.headers.get('x-ratelimit-remaining') ?? 1)
  if (res.status === 403 || res.status === 429) {
    console.log(`${tijd()}  limiet bereikt, 10 min wachten`)
    await slaap(600000)
    continue
  }
  if (!res.ok) { console.log(`${tijd()}  ${term}: ${res.status}`); await slaap(75000); continue }
  const data = await res.json()
  resultaat[term] = {
    namen,
    fotos: (data.results || []).map(p => ({
      id: p.id,
      thumb: `${p.urls.raw.split('?')[0]}?w=240&h=180&fit=crop`,
      url: `${p.urls.raw.split('?')[0]}?w=800&h=600&fit=crop`,
      alt: p.alt_description || '',
      auteur: p.user?.name || null,
      auteur_url: p.user?.links?.html || null,
      download: p.links?.download_location || null,
    })),
  }
  fs.writeFileSync(uit, JSON.stringify(resultaat, null, 1))
  console.log(`${tijd()}  ${Object.keys(resultaat).length}/${regels.length}  ${term}  (${resultaat[term].fotos.length} foto's, nog ${over} dit uur)`)
  await slaap(over > 0 ? 75000 : 600000)
}
console.log(`${tijd()}  klaar`)
