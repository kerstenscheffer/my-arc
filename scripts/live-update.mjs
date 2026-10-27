// scripts/live-update.mjs
//
// Zet de huidige code als live update klaar voor de native app.
//   npm run live-update -- "korte notitie"            (min. native 1.7)
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
// 1.7 build 9 (15 okt) heeft dezelfde plugins als 1.8, incl. de updater; oudere
// builds bevatten de update-code niet en vragen dus nooit. Daarom 1.7.
const minNative = minIdx >= 0 ? args[minIdx + 1] : '1.7'
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
console.log(`Uploaden ${grootte} MB …`)

const pad = `bundles/${versie}.zip`
const up = await fetch(`${URL_}/storage/v1/object/app-bundles/${pad}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, 'Content-Type': 'application/zip', 'x-upsert': 'true' },
  body: fs.readFileSync(zip),
})
if (!up.ok) { console.error('Upload mislukt:', up.status, await up.text()); process.exit(1) }

const publiek = `${URL_}/storage/v1/object/public/app-bundles/${pad}`
const rij = await fetch(`${URL_}/rest/v1/app_live_bundle`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({ version: versie, url: publiek, min_native: minNative, notitie }),
})
if (!rij.ok) { console.error('Registreren mislukt:', rij.status, await rij.text()); process.exit(1) }
fs.unlinkSync(zip)
console.log(`Live update ${versie} staat klaar (native ${minNative}+).`)
