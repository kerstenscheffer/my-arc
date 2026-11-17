// scripts/gino-tijd.mjs
//
// Gino's tijdmeter (2 nov 2026). Draait in de PA (business-os-pa.mjs) op
// Kerstens Mac: elke minuut kijken welke app voorop staat en, bij een browser,
// welke site. Eén rij per minuut in business_os_tijd (alleen als hij echt
// achter de Mac zit: geen invoer > 3 min of scherm op slot = niets).
//
// Bewaard wordt alleen app, domein, het eerste stukje pad (of de #tab van de
// MY ARC-app) en een ingekorte venstertitel; nooit querystrings.
// De categorie hieronder is de standaard; Gino's eigen regels
// (business_os_tijd_regels, `pa-db.mjs tijd-regel`) winnen in
// business_os_tijd_overzicht, ook met terugwerkende kracht.
//
// Browser-URL via osascript: de eerste keer vraagt macOS of node Chrome mag
// besturen. Zonder toestemming telt de minuut met alleen de app.
//
// Het tabblad wordt opgevraagd bij het PROCES dat voorop staat (pid), niet bij
// de naam "Google Chrome". Van 11 t/m 17 nov 2026 kwam alles leeg terug: er
// draaiden onzichtbare Chrome-kopieën (puppeteer, --headless) met hetzelfde
// programma, en op naam praat macOS dan met zo'n kopie (about:blank, geen titel).
// Lukt het uitlezen niet, dan gaat er hoogstens één regel per uur naar
// app_fouten (pagina tijdmeter) in plaats van stil null.

import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const sh = (cmd, args) => new Promise((ok) => {
  execFile(cmd, args, { timeout: 4000 }, (e, out) => ok(e ? '' : String(out).trim()))
})
// Zelfde, maar de fout komt mee terug in plaats van stil te verdwijnen.
const shMetFout = (cmd, args) => new Promise((ok) => {
  execFile(cmd, args, { timeout: 4000 }, (e, out, err) => ok({
    uit: String(out || '').trim(),
    fout: e ? (String(err || '').trim() || e.message || 'onbekende fout') : null,
  }))
})

const BROWSERS = new Set(['Google Chrome', 'Arc', 'Safari'])
// JXA: argv[0] = pid van de voorste app (of de naam als de pid ontbreekt),
// argv[1] = naam. Geen venster open = geen fout, gewoon niets te lezen.
const TAB_SCRIPT = `function run(argv) {
  const app = Application(/^[0-9]+$/.test(argv[0]) ? Number(argv[0]) : argv[0])
  if (!app.windows.length) return JSON.stringify({ leeg: true })
  const w = app.windows[0]
  const safari = argv[1] === 'Safari'
  const t = safari ? w.currentTab : w.activeTab
  return JSON.stringify({ url: t.url() || '', titel: (safari ? t.name() : t.title()) || '' })
}`

const NIET_MEETBAAR = /^(loginwindow|ScreenSaverEngine)$/
const STIL_SEC = 180

// Standaardindeling. Volgorde telt: eerste treffer wint.
// MY ARC op het CoachHub-tabje. Business OS laat met tijdPlek.js in de hash zien
// of de contentkalender of het Content-paneel openstaat; die gaan dus voor.
const MYARC_TAB = [
  [/^#(business-os[:?]content|output|content)/, 'content'],
  [/^#(leads|sales|funnel|ads|dm)\b/, 'sales'],
  [/^#(command|week-review|checkin|client|klant|challenge|plan-wizard|ai-meals|meal|workout|supplement|calls|results|faq|coachvids)/, 'coaching'],
  [/^#(business-os|productivity|notifications-hub|app-versies|spots)/, 'admin'],
]
const DOMEIN = [
  [/instagram\.com\/direct/, 'sales'],
  [/calendly\.com|zoom\.us\/j|meet\.google/, 'calls'],
  [/metricool|canva\.com|capcut|studio\.youtube|later\.com|business\.facebook|adsmanager/, 'content'],
  [/instagram\.com|youtube\.com|tiktok\.com|facebook\.com|x\.com|twitter\.com|reddit\.com|linkedin\.com/, 'social'],
  [/supabase\.com|vercel\.com|github\.com|claude\.ai|chatgpt\.com|stackoverflow|npmjs|developer\.apple|play\.google\.com\/console|appstoreconnect|localhost|127\.0\.0\.1/, 'bouwen'],
  [/mail\.google|notion\.|docs\.google|drive\.google|calendar\.google|stripe\.com|moneybird|bunq|ing\.nl|rabobank|abnamro|belastingdienst/, 'admin'],
  [/whatsapp/, 'coaching'],
  [/netflix|nu\.nl|nos\.nl|voetbal|espn|twitch|bol\.com|amazon\./, 'afleiding'],
]
const APP = [
  [/^(Terminal|iTerm2|Code|Cursor|Xcode|Android Studio|Claude|Warp|Ghostty|Simulator)$/, 'bouwen'],
  [/^(zoom\.us|FaceTime|Microsoft Teams)$/, 'calls'],
  [/^(WhatsApp)$/, 'coaching'],
  [/^(CapCut|Final Cut Pro|Adobe Premiere Pro|Photos|Foto's|Canva|Lightroom|Adobe Lightroom)$/, 'content'],
  [/^(Mail|Notes|Notities|Calendar|Agenda|Finder|Notion|Numbers|Pages|Keynote|Excel|Word|Preview|Voorvertoning|System Settings|Systeeminstellingen)$/, 'admin'],
  [/^(Spotify|Music|Muziek|TV|Netflix|Steam)$/, 'afleiding'],
]

export function standaardCategorie({ app, domein, pad }) {
  if (domein) {
    const plek = `${domein}${pad || ''}`
    if (/myarcfitness|localhost|127\.0\.0\.1/.test(domein) && pad?.startsWith('#')) {
      for (const [re, cat] of MYARC_TAB) if (re.test(pad)) return cat
    }
    for (const [re, cat] of DOMEIN) if (re.test(plek)) return cat
    return 'overig'
  }
  for (const [re, cat] of APP) if (re.test(app || '')) return cat
  return 'overig'
}

async function stilSeconden() {
  const uit = await sh('ioreg', ['-c', 'IOHIDSystem', '-d', '4'])
  const m = uit.match(/"HIDIdleTime"\s*=\s*(\d+)/)
  return m ? Math.floor(Number(m[1]) / 1e9) : 0
}

async function voorsteApp() {
  const asn = await sh('lsappinfo', ['front'])
  if (!asn) return null
  const uit = await sh('lsappinfo', ['info', '-only', 'name', '-only', 'pid', asn])
  const app = uit.match(/"LSDisplayName"="([^"]*)"/)?.[1] || null
  return app ? { app, pid: uit.match(/"pid"\s*=\s*(\d+)/)?.[1] || null } : null
}

// Actief tabblad van de voorste browser: { url, titel }, { leeg: true } of { fout }.
async function leesTab(app, pid) {
  const { uit, fout } = await shMetFout('osascript', ['-l', 'JavaScript', '-e', TAB_SCRIPT, pid || app, app])
  if (fout) {
    const geenRecht = /-1743|not authori[sz]ed|geen toestemming/i.test(fout)
    return { fout: geenRecht
      ? `macOS-toestemming ontbreekt (Systeeminstellingen → Privacy en beveiliging → Automatisering → node → ${app} aanzetten): ${fout}`
      : fout }
  }
  try {
    const tab = JSON.parse(uit)
    if (tab.leeg) return tab
    if (!tab.url) return { fout: 'leeg adres terug van het actieve tabblad' }
    return tab
  } catch { return { fout: `onleesbaar antwoord van osascript (${uit.length} tekens)` } }
}

export function knipUrl(url) {
  try {
    const u = new URL(url)
    const domein = u.hostname.replace(/^www\./, '') + (u.port && /localhost|127\./.test(u.hostname) ? `:${u.port}` : '')
    // MY ARC: de #tab zegt waar hij mee bezig is; elders het eerste padstuk.
    // Van de hash nooit ids of parameters bewaren (#client-view:<id> → #client-view).
    const hash = u.hash.split(/[?=]/)[0].replace(/:[0-9a-f-]{8,}$/i, '')
    const pad = hash ? hash.slice(0, 40) : (u.pathname.split('/').filter(Boolean)[0] ? `/${u.pathname.split('/').filter(Boolean)[0]}`.slice(0, 40) : '')
    // about:blank en lege tabbladen hebben geen domein: dan null, geen lege tekst.
    return { domein: domein || null, pad: domein ? pad : null }
  } catch { return { domein: null, pad: null } }
}

// Eén meting; geeft de rij terug (of null als er niets te meten is).
// opTabFout(app, fout) wordt aangeroepen als het tabblad van een browser niet te lezen was.
export async function meetMinuut(opTabFout) {
  if (await stilSeconden() > STIL_SEC) return null
  const voor = await voorsteApp()
  if (!voor || NIET_MEETBAAR.test(voor.app)) return null
  const { app, pid } = voor
  const rij = { app, domein: null, pad: null, titel: null }
  if (BROWSERS.has(app)) {
    const tab = await leesTab(app, pid)
    if (tab.fout) opTabFout?.(app, tab.fout)
    else if (!tab.leeg) {
      Object.assign(rij, knipUrl(tab.url))
      rij.titel = tab.titel.slice(0, 100) || null
    }
  }
  rij.categorie = standaardCategorie(rij)
  return rij
}

// Hoogstens één tabfout per uur naar app_fouten. De stempel staat in een bestand,
// want de PA herstart na elke code-opdracht en vergeet dan zijn geheugen.
const TABFOUT_STEMPEL = path.join(os.tmpdir(), 'myarc-tijdmeter-tabfout')
const TABFOUT_PAUZE = 60 * 60 * 1000
function tabFoutMagNu() {
  try { if (Date.now() - fs.statSync(TABFOUT_STEMPEL).mtimeMs < TABFOUT_PAUZE) return false } catch { /* nog geen stempel */ }
  try { fs.writeFileSync(TABFOUT_STEMPEL, new Date().toISOString()) } catch { /* dan telt alleen het geheugen */ }
  return true
}

// Start de meter: elke minuut, op de hele minuut afgerond (upsert = dubbel tellen kan niet).
export function startTijdmeter(sb, wieIsHet, log = console.error) {
  let laatsteFout = 0
  let laatsteTabFout = 0
  const tik = async () => {
    const g = wieIsHet()
    if (!g) return
    const meldTabFout = (app, fout) => {
      if (Date.now() - laatsteTabFout < TABFOUT_PAUZE) return
      laatsteTabFout = Date.now()
      if (!tabFoutMagNu()) return
      const melding = `Tabblad van ${app} niet gelezen, minuut telt zonder site: ${fout}`.slice(0, 500)
      log('Tijdmeter:', melding)
      sb.from('app_fouten').insert({ user_id: g.id, pagina: 'tijdmeter', melding })
        .then(r => { if (r.error) log('Tijdmeter: app_fouten mislukt:', r.error.message) }, e => log('Tijdmeter: app_fouten mislukt:', e.message))
    }
    const rij = await meetMinuut(meldTabFout).catch(() => null)
    if (!rij) return
    const minuut = new Date(); minuut.setSeconds(0, 0)
    const { error } = await sb.from('business_os_tijd')
      .upsert({ coach_id: g.id, minuut: minuut.toISOString(), ...rij }, { onConflict: 'coach_id,minuut' })
      .then(r => r, e => ({ error: e }))
    if (error && Date.now() - laatsteFout > 30 * 60 * 1000) { laatsteFout = Date.now(); log('Tijdmeter:', error.message) }
  }
  setInterval(tik, 60 * 1000)
  setTimeout(tik, 5000)
}
