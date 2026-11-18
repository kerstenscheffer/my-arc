// scripts/merkfotos.mjs
//
// Merkfoto's (18 nov 2026, Kersten: "bij Haribo Haribo, bij Oreo Oreo").
// Een product zonder eigen foto krijgt de foto van een product van HETZELFDE
// merk dat er zo veel mogelijk op lijkt. image_source = 'merk_voorbeeld' en
// image_voorbeeld_van = het bronproduct, zodat een echte foto (OFF, of een
// goedgekeurde klantfoto) hem later altijd mag overschrijven.
//
// Het rekenwerk gebeurt hier op de Mac, niet in de database (Micro-compute:
// de OFF-taak legde in oktober de app plat). Alleen het schrijven gaat naar
// de database, in kleine porties via RPC merkfotos_zet.
//
// Regels (getest op steekproeven, zie de contactplaat die --droog maakt):
//  A. Laatste woord van de naam (het eigenlijke product: appelSAP, tonijnSTEAK)
//     komt als heel woord terug in de bron, en de namen lijken ≥ 0,4 op elkaar.
//     Algemene slotwoorden (naturel, original, zero, light…) tellen niet als
//     product: dan het woord ervoor ("Jus naturel" kreeg anders granola naturel).
//  B. Klein merk (≤ 40 producten, geen supermarkt-huismerk), dezelfde
//     categorie en de namen lijken ≥ 0,2 op elkaar. Daaronder ging het vaak
//     mis (Goudse kaas → magere melk van hetzelfde merk).
//  Bronfoto's die een dun strookje zijn (verkeerd bijgesneden tekst bij OFF,
//  breder dan 2,2 : 1) vallen af; daarvoor leest het script van elke bronfoto
//  alleen de eerste kilobytes (JPEG-kop met de afmetingen).
//
// Gebruik:
//   node scripts/merkfotos.mjs --droog <uitmap>     koppelingen + contactplaat, schrijft niets
//   node scripts/merkfotos.mjs --schrijf <uitmap>   schrijft de koppelingen uit <uitmap>/koppelingen.json
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const DROOG = args.includes('--droog')
const SCHRIJF = args.includes('--schrijf')
const uitmap = args.find(a => !a.startsWith('--'))
if ((!DROOG && !SCHRIJF) || !uitmap) {
  console.error('Gebruik: node scripts/merkfotos.mjs --droog|--schrijf <uitmap>')
  process.exit(1)
}

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

// Supermarkt-huismerken: honderden soorten producten onder één naam, dus daar
// nooit regel B (anders krijgt AH-appelsap de foto van AH-kipfilet).
const HUISMERKEN = new Set(['albert heijn', 'ah', 'ah terra', 'ah excellent', 'excellent', 'jumbo', 'lidl', 'aldi', 'plus',
  'coop', 'spar', 'picnic', 'hoogvliet', 'dirk', 'vomar', 'dekamarkt', 'nettorama', 'poiesz', 'jan linders',
  "g'woon", 'gwoon', '1 de beste', 'bio+', 'milbona', 'ekoplaza', 'odin', 'boni', 'emté', 'emte', 'deen',
  'super unie', 'perfekt', 'k-classic', 'kaufland', 'rewe', 'edeka', 'carrefour', 'delhaize', 'colruyt',
  'everyday', 'smaakt', 'gourmet', 'cêlavita', 'celavita', 'trader joe\'s', 'tesco', 'sainsbury\'s', 'hema'])

const ALGEMEEN = new Set(['naturel', 'natural', 'original', 'originál', 'classic', 'klassiek', 'light', 'zero', 'bio', 'biologisch',
  'vers', 'verse', 'mini', 'groot', 'klein', 'puur', 'plus', 'extra', 'g', 'gr', 'kg', 'ml', 'l', 'cl', 'x', 'pack', 'stuks',
  'nl', 'new', 'nieuw', 'family', 'xl', 'xxl', 'lekker', 'vegan', 'vega', 'halfvol', 'volvol', 'mager', 'magere'])
const productWoord = (w) => { for (let i = w.length - 1; i >= 0; i--) if (!ALGEMEEN.has(w[i]) && !/^\d+$/.test(w[i])) return w[i]; return null }

// JPEG-afmetingen uit de eerste bytes (SOF-blok). null = onbekend.
const jpegMaat = (buf) => {
  let i = 2
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue }
    const m = buf[i + 1]
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  return null
}
async function maten(urls) {
  const uit = new Map()
  const lijst = [...urls]
  let p = 0
  const werker = async () => {
    while (p < lijst.length) {
      const u = lijst[p++]
      try {
        const r = await fetch(u, { headers: { Range: 'bytes=0-24575', 'User-Agent': 'MyArcFotoCheck/1.0' } })
        uit.set(u, jpegMaat(Buffer.from(await r.arrayBuffer())))
      } catch { uit.set(u, null) }
    }
  }
  await Promise.all(Array.from({ length: 8 }, werker))
  return uit
}

const merkSleutel = (b) => {
  const s = String(b || '').split(',')[0].toLowerCase().replace(/\s+/g, ' ').trim()
  return s === 'ah' ? 'albert heijn' : s
}
const woorden = (s) => String(s || '').toLowerCase().split(/[^a-z0-9à-ÿ]+/).filter(Boolean)
// Zoals pg_trgm: elk woord met twee spaties ervoor en één erna.
const trigrammen = (s) => {
  const t = new Set()
  for (const w of woorden(s)) {
    const p = `  ${w} `
    for (let i = 0; i < p.length - 2; i++) t.add(p.slice(i, i + 3))
  }
  return t
}
const gelijk = (a, b) => {
  if (!a.size || !b.size) return 0
  let n = 0
  for (const x of a) if (b.has(x)) n++
  return n / (a.size + b.size - n)
}

async function haalAlles() {
  const rijen = []
  for (let van = 0; ; van += 1000) {
    const { data, error } = await supabase.from('ai_ingredients')
      .select('id,name,brand,zoek_kern,category,image_url,image_source')
      .order('id').range(van, van + 999)
    if (error) throw new Error(error.message)
    rijen.push(...data)
    if (data.length < 1000) break
    await slaap(150)
  }
  return rijen
}

async function droog() {
  fs.mkdirSync(uitmap, { recursive: true })
  const alles = await haalAlles()
  console.log('producten:', alles.length)
  const perMerk = new Map()
  for (const r of alles) {
    const m = merkSleutel(r.brand)
    if (!m) continue
    r._tri = trigrammen(r.zoek_kern || r.name)
    r._w = new Set(woorden(r.zoek_kern || r.name))
    if (!perMerk.has(m)) perMerk.set(m, [])
    perMerk.get(m).push(r)
  }
  // Bronfoto's die een strookje zijn eruit.
  const bronUrls = new Set(alles.filter(r => r.image_url && r.image_source !== 'merk_voorbeeld' && merkSleutel(r.brand)).map(r => r.image_url))
  console.log('bronfoto\'s nameten:', bronUrls.size)
  const maat = await maten(bronUrls)
  const strook = (u) => { const m = maat.get(u); return m && (m.w / m.h > 2.2) }
  console.log('strookjes:', [...bronUrls].filter(strook).length, '· onbekend:', [...bronUrls].filter(u => !maat.get(u)).length)
  const koppelingen = []
  const stat = { A: 0, B: 0, geen: 0 }
  for (const [merk, lijst] of perMerk) {
    const bronnen = lijst.filter(r => r.image_url && r.image_source !== 'merk_voorbeeld' && !strook(r.image_url))
    if (!bronnen.length) { stat.geen += lijst.filter(r => !r.image_url).length; continue }
    const klein = lijst.length <= 40 && !HUISMERKEN.has(merk)
    for (const d of lijst) {
      if (d.image_url) continue
      const laatste = productWoord(woorden(d.zoek_kern || d.name))
      let best = null
      for (const b of bronnen) {
        const s = gelijk(d._tri, b._tri)
        const regelA = s >= 0.4 && laatste && b._w.has(laatste)
        const regelB = klein && d.category && d.category === b.category && s >= 0.2
        const regel = regelA ? 'A' : regelB ? 'B' : null
        if (!regel) continue
        // Regel A gaat altijd voor B; daarbinnen de meest gelijkende naam.
        const score = (regel === 'A' ? 10 : 0) + s
        if (!best || score > best.score) best = { b, s, regel, score }
      }
      if (!best) { stat.geen++; continue }
      stat[best.regel]++
      koppelingen.push({ id: d.id, url: best.b.image_url, van: best.b.id, regel: best.regel, s: +best.s.toFixed(2),
        doel: d.name, bron: best.b.name })
    }
  }
  fs.writeFileSync(path.join(uitmap, 'koppelingen.json'), JSON.stringify(koppelingen))
  console.log(stat)
  // Contactplaten: steekproef per regel, om met het oog te keuren.
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  for (const regel of ['A', 'B']) {
    const steek = koppelingen.filter(k => k.regel === regel).sort((a, b) => (a.id < b.id ? -1 : 1)).filter((_, i, l) => i % Math.max(1, Math.floor(l.length / 64)) === 0).slice(0, 64)
    const cellen = steek.map(k => `<div class=c><img src="${esc(k.url)}"><b>${esc(k.doel)}</b><br><i>${esc(k.bron)} · ${k.s}</i></div>`).join('')
    fs.writeFileSync(path.join(uitmap, `steekproef-${regel}.html`), `<html><body style="margin:0;font:11px sans-serif"><style>.c{width:240px;height:236px;display:inline-block;vertical-align:top;margin:2px;overflow:hidden}img{width:240px;height:170px;object-fit:contain;background:#eee;display:block}i{color:#777}</style>${cellen}</body></html>`)
  }
}

async function schrijf() {
  const koppelingen = JSON.parse(fs.readFileSync(path.join(uitmap, 'koppelingen.json'), 'utf8'))
  let gezet = 0
  for (let i = 0; i < koppelingen.length; i += 300) {
    const batch = koppelingen.slice(i, i + 300).map(k => ({ id: k.id, url: k.url, van: k.van }))
    const { data, error } = await supabase.rpc('merkfotos_zet', { p_rijen: batch })
    if (error) throw new Error(error.message)
    gezet += data || 0
    console.log(`${Math.min(i + 300, koppelingen.length)}/${koppelingen.length} — gezet ${gezet}`)
    await slaap(1500) // rustig aan: Micro-database
  }
}

await (DROOG ? droog() : schrijf())
