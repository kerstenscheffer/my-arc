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
// Browser-URL via AppleScript: de eerste keer vraagt macOS of node Chrome mag
// besturen. Zonder toestemming telt de minuut met alleen de app.

import { execFile } from 'node:child_process'

const sh = (cmd, args) => new Promise((ok) => {
  execFile(cmd, args, { timeout: 4000 }, (e, out) => ok(e ? '' : String(out).trim()))
})

const BROWSER_SCRIPT = {
  'Google Chrome': 'tell application "Google Chrome" to get {URL, title} of active tab of front window',
  Arc: 'tell application "Arc" to get {URL, title} of active tab of front window',
  Safari: 'tell application "Safari" to get {URL, name} of current tab of front window',
}

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
  const uit = await sh('lsappinfo', ['info', '-only', 'name', asn])
  return uit.match(/"LSDisplayName"="([^"]*)"/)?.[1] || null
}

export function knipUrl(url) {
  try {
    const u = new URL(url)
    const domein = u.hostname.replace(/^www\./, '') + (u.port && /localhost|127\./.test(u.hostname) ? `:${u.port}` : '')
    // MY ARC: de #tab zegt waar hij mee bezig is; elders het eerste padstuk.
    // Van de hash nooit ids of parameters bewaren (#client-view:<id> → #client-view).
    const hash = u.hash.split(/[?=]/)[0].replace(/:[0-9a-f-]{8,}$/i, '')
    const pad = hash ? hash.slice(0, 40) : (u.pathname.split('/').filter(Boolean)[0] ? `/${u.pathname.split('/').filter(Boolean)[0]}`.slice(0, 40) : '')
    return { domein, pad }
  } catch { return { domein: null, pad: null } }
}

// Eén meting; geeft de rij terug (of null als er niets te meten is).
export async function meetMinuut() {
  if (await stilSeconden() > STIL_SEC) return null
  const app = await voorsteApp()
  if (!app || NIET_MEETBAAR.test(app)) return null
  const rij = { app, domein: null, pad: null, titel: null }
  if (BROWSER_SCRIPT[app]) {
    const uit = await sh('osascript', ['-e', BROWSER_SCRIPT[app]])
    const komma = uit.indexOf(', ')
    if (komma > 0) {
      Object.assign(rij, knipUrl(uit.slice(0, komma)))
      rij.titel = uit.slice(komma + 2).slice(0, 100) || null
    }
  }
  rij.categorie = standaardCategorie(rij)
  return rij
}

// Start de meter: elke minuut, op de hele minuut afgerond (upsert = dubbel tellen kan niet).
export function startTijdmeter(sb, wieIsHet, log = console.error) {
  let laatsteFout = 0
  const tik = async () => {
    const g = wieIsHet()
    if (!g) return
    const rij = await meetMinuut().catch(() => null)
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
