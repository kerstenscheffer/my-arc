// scripts/content-autopilot.mjs
//
// Content-autopilot (31 okt 2026): winnende magnet-reels en 'Welke 2 pak
// jij?'-reels opnieuw maken als variant en in de wachtrij zetten. Gino draait
// dit op Kerstens Mac met zijn PA-sessie (PA_ACCESS_TOKEN, dus zijn RLS). Het
// Instagram-token blijft in de database (Vault); dit script ziet het nooit.
// Publiceren en meten doet de cron content_autopilot_publiceer / _meet
// (src/modules/business-os/content-autopilot.sql).
//
//   node scripts/content-autopilot.mjs bibliotheek [max=50] [dagen=90]
//       eigen reels/magnets downloaden naar ~/Movies/MY ARC bibliotheek/<ig_id>.mp4
//       en content_bibliotheek bijwerken (views, comments, per 1.000)
//   node scripts/content-autopilot.mjs winnaars [aantal=10]
//       de winnaars van deze week (RPC content_autopilot_winnaars)
//   node scripts/content-autopilot.mjs maak '{"ig_id","hook","caption","datum":"YYYY-MM-DD","tijd":"HH:MM","woord"?}'
//       variant maken (ffmpeg), uploaden, als idea in content_items (autopilot_status wacht)
//   node scripts/content-autopilot.mjs opnieuw
//       items waar Kersten de hook aanpaste opnieuw renderen
//   node scripts/content-autopilot.mjs render <ig_id> "<hook>"
//       alleen lokaal renderen (geen sessie nodig), bv. een testvariant
//   node scripts/content-autopilot.mjs upload
//       lokaal gerenderde items (autopilot_bestand, nog geen video) naar de bucket
//
// Regels: hook over de kijker, geen 'afvallen', geen gedachtestreepjes,
// caption met 'comment WOORD', tijd 14:00-20:00, max 5 magnets per dag.

import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const MAP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const env = Object.fromEntries(
  fs.readFileSync(path.join(MAP, '.env.local'), 'utf8').split('\n')
    .map(r => r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^['"]|['"]$/g, '')])
)
// Database alleen met Kerstens PA-sessie; 'render' werkt ook zonder (alleen ffmpeg).
const token = process.env.PA_ACCESS_TOKEN
const sb = token ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${token}` } },
}) : null

const BIEB = path.join(os.homedir(), 'Movies', 'MY ARC bibliotheek')
const VARIANTEN = path.join(BIEB, 'varianten')
const BUCKET = 'content-autopilot'
const MAX_PER_DAG = 5

const uit = (x) => console.log(JSON.stringify(x, null, 2))
const stop = (fout) => { uit({ fout }); process.exit(1) }
const PAK2 = /^\s*welke 2 pak jij/i

// Weekdag van een kalenderdatum zoals in Nederland (Europe/Amsterdam). Met
// 12:00 UTC valt de datum nooit door een tijdzone of zomertijd een dag op.
const weekdag = (datum) => new Date(`${datum}T12:00:00Z`).toLocaleDateString('nl-NL', { weekday: 'long', timeZone: 'Europe/Amsterdam' })
const per1000 = (c, v) => (v ? Math.round((c * 1000 / v) * 100) / 100 : null)

async function eigenaar() {
  const { data, error } = await sb.rpc('content_eigenaar')
  if (error) stop(error.message)
  return data
}

// ---------- bibliotheek ----------
async function bibliotheek(max = 50, dagen = 90) {
  fs.mkdirSync(BIEB, { recursive: true })
  const eig = await eigenaar()
  const sinds = new Date(Date.now() - dagen * 864e5).toISOString()
  const { data: media, error } = await sb.from('content_ig_media')
    .select('id, soort, woord, tijd, views, comments').in('soort', ['reel', 'magnet']).gte('tijd', sinds)
    .order('views', { ascending: false, nullsFirst: false }).limit(2000)
  if (error) stop(error.message)
  const { data: bekend } = await sb.from('content_bibliotheek').select('ig_id, lokaal_pad, is_variant').limit(5000)
  const pad = new Map((bekend || []).map(b => [b.ig_id, b]))

  // Cijfers voor alles bijwerken (variant-rijen laat de meet-cron met rust).
  const rijen = media.filter(m => !pad.get(m.id)?.is_variant).map(m => ({
    ig_id: m.id, eigenaar: eig, soort: m.soort, woord: m.woord, tijd: m.tijd,
    views: m.views, comments: m.comments, comments_per_1000: per1000(m.comments, m.views),
    updated_at: new Date().toISOString(),
  }))
  for (let i = 0; i < rijen.length; i += 500) {
    const { error: e } = await sb.from('content_bibliotheek').upsert(rijen.slice(i, i + 500), { onConflict: 'ig_id' })
    if (e) stop(e.message)
  }

  // Downloaden: best bekeken eerst, alleen wat nog niet lokaal staat.
  const nodig = media.filter(m => !(pad.get(m.id)?.lokaal_pad && fs.existsSync(pad.get(m.id).lokaal_pad))).slice(0, max)
  let gedownload = 0
  const mislukt = []
  for (let i = 0; i < nodig.length; i += 30) {
    const ids = nodig.slice(i, i + 30).map(m => m.id)
    const { data: urls, error: e } = await sb.rpc('content_ig_media_urls', { p_ids: ids })
    if (e) stop(e.message)
    for (const u of urls || []) {
      if (!u.media_url) { mislukt.push(u.id); continue }
      const doel = path.join(BIEB, `${u.id}.mp4`)
      try {
        const res = await fetch(u.media_url)
        if (!res.ok) throw new Error(String(res.status))
        fs.writeFileSync(doel, Buffer.from(await res.arrayBuffer()))
        await sb.from('content_bibliotheek').update({ lokaal_pad: doel, gedownload_at: new Date().toISOString() }).eq('ig_id', u.id)
        gedownload++
      } catch { mislukt.push(u.id) }
    }
  }
  const { count } = await sb.from('content_bibliotheek').select('ig_id', { count: 'exact', head: true }).not('lokaal_pad', 'is', null)
  uit({ bijgewerkt: rijen.length, gedownload, mislukt: mislukt.length, lokaal_in_bibliotheek: count, map: BIEB })
}

// ---------- winnaars ----------
async function winnaars(aantal = 10) {
  const { data, error } = await sb.rpc('content_autopilot_winnaars', { p_dagen: 90, p_aantal: aantal })
  if (error) stop(error.message)
  uit(data)
}

// ---------- maakstraat ----------
function controleerTekst(hook, caption, woord) {
  const fouten = []
  for (const [naam, t] of [['hook', hook], ['caption', caption]]) {
    if (/afval/i.test(t)) fouten.push(`${naam}: geen 'afvallen'`)
    if (/[—–]|\s-\s/.test(t)) fouten.push(`${naam}: geen gedachtestreepjes`)
  }
  if (woord && !new RegExp(`comment\\s+["“]?${woord}`, 'i').test(caption)) fouten.push(`caption: mist 'comment ${woord}'`)
  if (hook.length > 70) fouten.push('hook: max 70 tekens')
  return fouten
}

function ffprobe(bestand) {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', bestand]).toString())
  return { b: j.streams[0].width, h: j.streams[0].height, duur: Number(j.format.duration) }
}

// Hooktekst als transparante PNG op videoformaat (headless Chrome). Zo werkt
// het met elke ffmpeg-build; de Homebrew-versie heeft geen drawtext.
async function hookPng(hook, b, h, doel) {
  const { default: puppeteer } = await import('puppeteer')
  const browser = await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: b, height: h })
    const veilig = hook.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
    await page.setContent(`<html><body style="margin:0;background:transparent;width:${b}px;height:${h}px">
      <div style="position:absolute;top:${Math.round(h * 0.07)}px;left:0;right:0;display:flex;justify-content:center">
        <div style="max-width:${Math.round(b * 0.84)}px;padding:${Math.round(h / 60)}px ${Math.round(h / 40)}px;background:rgba(0,0,0,.6);border-radius:${Math.round(h / 80)}px;
          color:#fff;font:800 ${Math.round(h / 24)}px/1.15 'Arial Black',Arial,Helvetica,sans-serif;text-align:center">${veilig}</div>
      </div></body></html>`)
    await page.screenshot({ path: doel, omitBackground: true })
  } finally { await browser.close() }
}

// Andere startsnede (eerste 0,6-1,2 s eraf), 4% inzoomen, hook 0-2 s in beeld,
// nieuwe cover. Nooit hetzelfde bestand: bitstream, kader en begin verschillen.
async function render(bron, hook, id) {
  fs.mkdirSync(VARIANTEN, { recursive: true })
  const { b, h, duur } = ffprobe(bron)
  if (duur < 5) stop('Bronreel te kort voor een variant')
  const start = (0.6 + (parseInt(crypto.createHash('md5').update(id).digest('hex').slice(0, 2), 16) / 255) * 0.6).toFixed(2)
  const png = path.join(VARIANTEN, `${id}.hook.png`)
  await hookPng(hook, b, h, png)
  const video = path.join(VARIANTEN, `${id}.mp4`)
  const cover = path.join(VARIANTEN, `${id}.jpg`)
  const filter = `[0:v]crop=trunc(iw*0.96/2)*2:trunc(ih*0.96/2)*2,scale=${b}:${h},setsar=1[v];[v][1:v]overlay=0:0:enable='lt(t,2)'[uit]`
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', start, '-i', bron, '-loop', '1', '-i', png,
    '-filter_complex', filter, '-map', '[uit]', '-map', '0:a?', '-shortest',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', video])
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', '1.0', '-i', video, '-frames:v', '1', '-q:v', '3', cover])
  fs.unlinkSync(png)
  return { video, cover, start }
}

async function upload(id, video, cover) {
  const vPad = `${id}/variant.mp4`, cPad = `${id}/cover.jpg`
  for (const [pad, bestand, type] of [[vPad, video, 'video/mp4'], [cPad, cover, 'image/jpeg']]) {
    const { error } = await sb.storage.from(BUCKET).upload(pad, fs.readFileSync(bestand), { contentType: type, upsert: true })
    if (error) stop(`upload ${pad}: ${error.message}`)
  }
  return { vPad, cPad }
}

async function bronPad(igId) {
  const { data } = await sb.from('content_bibliotheek').select('lokaal_pad, is_variant').eq('ig_id', igId).maybeSingle()
  if (data?.is_variant) stop('Dit is zelf een variant; kies een originele reel')
  if (!data?.lokaal_pad || !fs.existsSync(data.lokaal_pad)) stop('Bronreel staat niet lokaal; draai eerst bibliotheek')
  return data.lokaal_pad
}

async function maak(json) {
  let o
  try { o = JSON.parse(json) } catch { stop('Geen geldige JSON') }
  const { ig_id, hook, caption, datum, tijd } = o
  if (!ig_id || !hook || !caption || !datum || !tijd) stop('ig_id, hook, caption, datum en tijd zijn verplicht')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || !/^\d{2}:\d{2}$/.test(tijd)) stop('datum YYYY-MM-DD, tijd HH:MM')
  if (tijd < '14:00' || tijd > '20:00') stop('Posttijd tussen 14:00 en 20:00')
  if (Number.isNaN(new Date(`${datum}T12:00:00Z`).getTime())) stop('Ongeldige datum')
  if (o.weekdag && o.weekdag.toLowerCase() !== weekdag(datum)) stop(`${datum} is een ${weekdag(datum)}, geen ${o.weekdag}`)

  const { data: m } = await sb.from('content_ig_media').select('id, woord, soort, tekst').eq('id', ig_id).maybeSingle()
  if (!m) stop('Onbekende reel (alleen eigen content uit content_ig_media)')
  // 'Welke 2 pak jij?' gaat altijd met LIDL (Kersten 31 okt).
  const pak2 = PAK2.test(m.tekst || '') || PAK2.test(hook)
  const woord = pak2 ? 'LIDL' : ((o.woord || m.woord || '').toUpperCase() || null)
  if (woord) {
    const { count } = await sb.from('lead_magnets').select('id', { count: 'exact', head: true }).ilike('woord', woord)
    if (!count) stop(`Geen lead_magnets-rij voor ${woord}`)
  }
  const fouten = controleerTekst(hook, caption, woord)
  if (fouten.length) stop(fouten.join('; '))

  const { count: opDag } = await sb.from('content_items').select('id', { count: 'exact', head: true })
    .eq('planned_date', datum).not('autopilot_status', 'is', null).not('autopilot_status', 'in', '(overgeslagen,concept)')
  if ((opDag || 0) >= MAX_PER_DAG) stop(`Al ${MAX_PER_DAG} autopilot-magnets op ${datum}`)

  const bron = await bronPad(ig_id)
  const eig = await eigenaar()
  const id = crypto.randomUUID()
  const { video, cover, start } = await render(bron, hook, id)
  const { vPad, cPad } = await upload(id, video, cover)
  const { error } = await sb.from('content_items').insert({
    id, coach_id: eig, type: 'reel', status: 'idea', title: `Autopilot ${woord || 'reel'}: ${hook}`.slice(0, 120), hook,
    planned_date: datum, planned_time: tijd,
    notes: `Variant van reel ${ig_id} (start ${start}s, nieuwe hook en cover). Lokaal: ${video}`,
    autopilot_bron: ig_id, autopilot_status: 'wacht', autopilot_woord: woord, autopilot_bestand: video,
    autopilot_video: vPad, autopilot_cover: cPad, autopilot_caption: caption,
  })
  if (error) stop(error.message)
  uit({ item: id, woord, datum, weekdag: weekdag(datum), tijd, hook, video })
}

// Alleen renderen, zonder database (geen sessie nodig). Voor een testvariant
// die Kersten eerst lokaal bekijkt; uploaden doet 'upload' daarna.
async function renderLos(igId, hook) {
  if (!igId || !hook) stop('gebruik: render <ig_id> "<hook>"')
  const bron = path.join(BIEB, `${igId}.mp4`)
  if (!fs.existsSync(bron)) stop('Bronreel staat niet lokaal')
  const id = crypto.randomUUID()
  uit({ id, ...(await render(bron, hook, id)) })
}

// Items die lokaal gerenderd zijn maar nog niet in de bucket staan uploaden.
async function uploadLokaal() {
  const { data, error } = await sb.from('content_items').select('id, autopilot_bestand')
    .not('autopilot_bestand', 'is', null).is('autopilot_video', null).neq('autopilot_status', 'overgeslagen')
  if (error) stop(error.message)
  const klaar = []
  for (const it of data || []) {
    if (!fs.existsSync(it.autopilot_bestand)) continue
    const cover = it.autopilot_bestand.replace(/\.mp4$/, '.jpg')
    const id = path.basename(it.autopilot_bestand, '.mp4')
    const { vPad, cPad } = await upload(id, it.autopilot_bestand, cover)
    await sb.from('content_items').update({ autopilot_video: vPad, autopilot_cover: cPad, updated_at: new Date().toISOString() }).eq('id', it.id)
    klaar.push(it.id)
  }
  uit({ geupload: klaar.length })
}

async function opnieuw() {
  const { data, error } = await sb.from('content_items').select('id, hook, autopilot_bron').eq('autopilot_status', 'hook_aanpassen')
  if (error) stop(error.message)
  const klaar = []
  for (const it of data || []) {
    const bron = await bronPad(it.autopilot_bron)
    const { video, cover } = await render(bron, it.hook, it.id)
    const { vPad, cPad } = await upload(it.id, video, cover)
    await sb.from('content_items').update({ autopilot_status: 'wacht', autopilot_video: vPad, autopilot_cover: cPad, autopilot_bestand: video, updated_at: new Date().toISOString() }).eq('id', it.id)
    klaar.push(it.id)
  }
  uit({ opnieuw_gemaakt: klaar.length })
}

const [cmd, a, b] = process.argv.slice(2)
if (!sb && cmd !== 'render') stop('Geen PA-sessie (alleen te gebruiken vanuit npm run pa).')
if (cmd === 'render') await renderLos(a, b)
else if (cmd === 'upload') await uploadLokaal()
else if (cmd === 'bibliotheek') await bibliotheek(Number(a) || 50, Number(b) || 90)
else if (cmd === 'winnaars') await winnaars(Number(a) || 10)
else if (cmd === 'maak') await maak(a)
else if (cmd === 'opnieuw') await opnieuw()
else stop('gebruik: bibliotheek | winnaars | maak \'{…}\' | opnieuw | render <ig_id> "<hook>" | upload')
