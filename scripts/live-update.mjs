// scripts/live-update.mjs
//
// Zet de huidige code als live update klaar voor de native app.
//   npm run live-update -- "korte notitie"            (min. native 1.6)
//   npm run live-update -- "notitie" --min 1.8        (alleen voor 1.8+)
//
// Draait cap:sync met BUILD_TIJD (bouwen + marketingbestanden uit de
// app-kopie halen), zipt de app-kopie (ios/App/App/public), uploadt naar storage-bucket
// app-bundles en zet een rij in app_live_bundle. De app pakt hem bij de
// volgende keer openen op en schakelt over als de klant de app wegklikt.
//
// Sleutel: SUPABASE_SERVICE_KEY uit .env.local (wordt nooit geprint).
// Let op: alleen webcode. Nieuwe native plugins of rechten vragen nog
// steeds een App Store/Play-release; zet dan --min op die nieuwe versie.

import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .map(r => r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^['"]|['"]$/g, '')])
)
const URL_ = env.VITE_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_KEY
if (!URL_ || !KEY) { console.error('VITE_SUPABASE_URL of SUPABASE_SERVICE_KEY ontbreekt in .env.local'); process.exit(1) }

const args = process.argv.slice(2)
const minIdx = args.indexOf('--min')
// De App Store-versie is 1.6 (live 16 okt, itunes lookup) en heeft de updater
// al; zonder plugin vraagt de app nooit om een bundel (notifyAppReady faalt
// eerst). Native plugins zijn sinds 15 okt niet veranderd. Komt er een nieuwe
// plugin bij: --min op de winkelversie die hem heeft.
const minNative = minIdx >= 0 ? args[minIdx + 1] : '1.6'
const notitie = args.filter((a, i) => i !== minIdx && i !== minIdx + 1).join(' ') || null

const versie = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
console.log(`Bouwen ${versie} …`)
execSync('npm run cap:sync', { stdio: 'inherit', env: { ...process.env, BUILD_TIJD: versie } })

// De opgeschoonde app-kopie, niet dist: daar staat 60+ MB marketing in die de
// app nooit toont (zie app-assets-opschonen.mjs).
const bron = 'ios/App/App/public'
if (!fs.existsSync(path.join(bron, 'index.html'))) { console.error(`Geen index.html in ${bron}`); process.exit(1) }
const zip = path.join(os.tmpdir(), `myarc-bundle-${versie}.zip`)
execSync(`cd "${bron}" && zip -qr "${zip}" .`)
const grootte = (fs.statSync(zip).size / 1e6).toFixed(1)
// De updater-plugin (v8) weigert elke download zonder SHA-256 van de zip
// ("Checksum required"). Tot 31 okt 2026 ontbrak die: geen enkele live-update
// kwam ooit aan. De app geeft hem mee vanaf liveUpdate.js met checksum.
const checksum = crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex')
console.log(`Uploaden ${grootte} MB …`)

const pad = `bundles/${versie}.zip`
// Een upload van ~15 MB brak soms halverwege af (EPIPE, 31 okt 2026): dan
// opnieuw proberen in plaats van de hele release te laten vallen.
let up = null
for (let poging = 1; poging <= 4; poging++) {
  try {
    up = await fetch(`${URL_}/storage/v1/object/app-bundles/${pad}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, 'Content-Type': 'application/zip', 'x-upsert': 'true' },
      body: fs.readFileSync(zip),
    })
    if (up.ok) break
    console.error(`Upload poging ${poging}: ${up.status}`)
  } catch (e) {
    up = null
    console.error(`Upload poging ${poging} afgebroken (${e.cause?.code || e.message}), opnieuw…`)
  }
  await new Promise(r => setTimeout(r, 4000 * poging))
}
if (!up?.ok) { console.error('Upload mislukt:', up?.status ?? 'verbinding', up ? await up.text() : ''); process.exit(1) }

const publiek = `${URL_}/storage/v1/object/public/app-bundles/${pad}`
const rij = await fetch(`${URL_}/rest/v1/app_live_bundle`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({ version: versie, url: publiek, min_native: minNative, notitie, checksum }),
})
if (!rij.ok) { console.error('Registreren mislukt:', rij.status, await rij.text()); process.exit(1) }
fs.unlinkSync(zip)
console.log(`Live update ${versie} staat klaar (native ${minNative}+).`)
