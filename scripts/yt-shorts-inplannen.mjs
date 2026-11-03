// scripts/yt-shorts-inplannen.mjs
//
// Kant-en-klare shorts van Kerstens YouTube inplannen op Instagram via de
// bestaande route: privé bucket content-varianten + content_items (cron
// content_autopilot_publiceer → edge function instagram-publiceer). Eigen
// PA-sessie (PA_ACCESS_TOKEN, zijn RLS); token komt nooit in de uitvoer.
//
//   node scripts/yt-shorts-inplannen.mjs check
//       account + publiceerlimiet (plaatst niets)
//   node scripts/yt-shorts-inplannen.mjs dry <item-id>
//       container maken en status volgen, NIET publiceren
//   node scripts/yt-shorts-inplannen.mjs plan <plan.json>
//       uploaden + rijen aanmaken met autopilot_status 'wacht'. Dubbele bron-URL's
//       worden overgeslagen. Plan: [{ url, bestand, title, hook, caption, datum }]
//   node scripts/yt-shorts-inplannen.mjs goedkeuren <plan.json>
//       rijen van dit plan op 'goedgekeurd' zetten

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
const token = process.env.PA_ACCESS_TOKEN
const uit = (x) => console.log(JSON.stringify(x, null, 2))
const stop = (fout) => { uit({ fout }); process.exit(1) }
if (!token) stop('Geen PA-sessie')

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${token}` } },
})

const EIGENAAR = '5a0135ac-3188-499d-8682-ed6a179e5541'
const BUCKET = 'content-varianten'
const WOORD = 'SPLIT'
const TIJD = '18:00'

async function edge(body) {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/instagram-publiceer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: env.VITE_SUPABASE_ANON_KEY },
    body: JSON.stringify(body),
  })
  return { http: res.status, ...(await res.json().catch(() => ({}))) }
}

// Cover: eerste frame, los bestand naast de video (edge verwacht cover.jpg).
function maakCover(video) {
  const cover = path.join(os.tmpdir(), `cover-${crypto.randomUUID()}.jpg`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-frames:v', '1', '-q:v', '3', cover])
  return cover
}

async function bestaandeBronnen(urls) {
  const { data, error } = await sb.from('content_items').select('id, notes').eq('coach_id', EIGENAAR).not('notes', 'is', null).ilike('notes', '%youtu%')
  if (error) stop(error.message)
  const m = new Map()
  for (const u of urls) {
    const rij = (data || []).find((r) => r.notes.includes(u))
    if (rij) m.set(u, rij.id)
  }
  return m
}

async function plan(bestand) {
  const items = JSON.parse(fs.readFileSync(bestand, 'utf8'))
  const bekend = await bestaandeBronnen(items.map((i) => i.url))
  const resultaat = []
  for (const it of items) {
    if (bekend.has(it.url)) { resultaat.push({ url: it.url, id: bekend.get(it.url), dubbel: true }); continue }
    if (!it.caption?.includes(WOORD)) stop(`Caption zonder '${WOORD}': ${it.url}`)
    if (!fs.existsSync(it.bestand)) stop(`Bestand ontbreekt: ${it.bestand}`)
    const id = crypto.randomUUID()
    const dir = `${EIGENAAR}/${id}`
    const cover = maakCover(it.bestand)
    for (const [pad, lokaal, type] of [[`${dir}/variant.mp4`, it.bestand, 'video/mp4'], [`${dir}/cover.jpg`, cover, 'image/jpeg']]) {
      const { error } = await sb.storage.from(BUCKET).upload(pad, fs.readFileSync(lokaal), { contentType: type, upsert: false })
      if (error) stop(`upload ${it.url}: ${error.message}`)
    }
    try { fs.unlinkSync(cover) } catch { /* blijft dan in de tijdelijke map staan */ }
    const nu = new Date().toISOString()
    const { error } = await sb.from('content_items').insert({
      // hook en woord leeg: de edge function plakt anders de hook ervoor en 'Comment SPLIT' erachter.
      id, coach_id: EIGENAAR, type: 'reel', title: it.title, hook: null, notes: `Bron: ${it.url}`,
      planned_date: it.datum, planned_time: TIJD, status: 'idea',
      autopilot_status: 'wacht', autopilot_woord: null, autopilot_caption: it.caption,
      autopilot_preview: `${dir}/variant.mp4`, autopilot_bestand: it.bestand, created_at: nu, updated_at: nu,
    })
    if (error) stop(`insert ${it.url}: ${error.message}`)
    resultaat.push({ url: it.url, id, datum: it.datum })
    console.error(`klaar ${it.datum} ${id}`)
  }
  uit(resultaat)
}

async function goedkeuren(bestand) {
  const items = JSON.parse(fs.readFileSync(bestand, 'utf8'))
  const bekend = await bestaandeBronnen(items.map((i) => i.url))
  const ids = items.map((i) => bekend.get(i.url)).filter(Boolean)
  const { data, error } = await sb.from('content_items')
    .update({ autopilot_status: 'goedgekeurd', updated_at: new Date().toISOString() })
    .in('id', ids).eq('autopilot_status', 'wacht').select('id, planned_date, planned_time, autopilot_status')
  if (error) stop(error.message)
  uit(data)
}

const [cmd, arg] = process.argv.slice(2)
if (cmd === 'check') uit(await edge({ check: true }))
else if (cmd === 'dry') uit(await edge({ dry_run: true, id: arg }))
else if (cmd === 'plan') await plan(arg)
else if (cmd === 'goedkeuren') await goedkeuren(arg)
else stop('gebruik: check | dry <id> | plan <plan.json> | goedkeuren <plan.json>')
