// scripts/business-os-pa.mjs
//
// Lokale PA voor de Business OS-chat (30 okt 2026).
//   npm run pa
//
// Twee soorten rijen in business_os_opdrachten (status 'wacht'):
//   → code: Kersten klikte "Uitvoeren op mijn Mac". Claude Code past de code
//     in deze map aan; Vite laat het direct zien, de auto-sync commit later.
//   → chat: een chatvraag uit Business OS terwijl deze PA draait. Claude Code
//     beantwoordt hem op Kerstens abonnement (geen API-kosten) en mag alleen
//     lezen + scripts/pa-db.mjs. Antwoord = { tekst, acties } in `antwoord`.
// Chat en code lopen naast elkaar, zodat een chatvraag niet wacht op een
// lange code-opdracht. Elke 15 s een hartslag in business_os_pa_status: zo
// weet de chat of hij via de Mac of via de API moet.
//
// Inloggen: met Kerstens eigen account (anon-sleutel + sessie), nooit de
// service key. RLS zorgt dat alleen zijn eigen opdrachten opgehaald worden.
// De sessie staat in ~/.config/myarc-pa/sessie.json (alleen voor jou leesbaar).
// Eén PA tegelijk (pa.pid): twee processen met dezelfde sessie verversen
// elkaars login kapot. Automatisch starten: launchd-agent nl.myarc.pa
// (~/Library/LaunchAgents), log in ~/Library/Logs/myarc-pa.log. Eerste keer
// inloggen moet in een terminal (npm run pa); op de achtergrond kan hij niet
// om een wachtwoord vragen. Login kwijt (bv. ergens 'uitloggen overal')? Dan
// blijft de PA draaien en wacht hij op een nieuwe login: in Business OS
// ("Mac uit" → PA inloggen) of met npm run pa -- --login.
//
// Inloggen vanuit Business OS: lokaal loket op 127.0.0.1:47615 (alleen deze
// Mac). GET /status → { ingelogd }; POST /login { refresh_token } van een
// verse login in de browser. De PA neemt hem alleen aan als het een geldige
// sessie van een coach-account is; zonder geldige sessie kan niemand iets.
//
// Claude Code mag hier: bestanden lezen/bewerken, build, lint, git diff/status.
// Niet: committen, pushen, stashen, iets anders in de shell, of MCP-tools
// (dus ook geen databasewijzigingen; die lopen via de Toestaan-knop in de chat).

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline/promises'
import { createClient } from '@supabase/supabase-js'
import { chatPrompt, ANTWOORD_SCHEMA } from './business-os-pa-prompt.mjs'

const MAP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
process.chdir(MAP)

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .map(r => r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^['"]|['"]$/g, '')])
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: true },
})

const SESSIE_MAP = path.join(os.homedir(), '.config', 'myarc-pa')
const SESSIE = path.join(SESSIE_MAP, 'sessie.json')
const bewaarSessie = (s) => {
  if (!s?.refresh_token) return
  fs.mkdirSync(SESSIE_MAP, { recursive: true, mode: 0o700 })
  fs.writeFileSync(SESSIE, JSON.stringify({ refresh_token: s.refresh_token }), { mode: 0o600 })
}
const LOGIN = process.argv.includes('--login')
let gebruiker = null

// Login kwijt (refresh-token ingetrokken): niet stoppen, wachten op een nieuwe
// login via Business OS of npm run pa -- --login.
const loginKwijt = () => {
  if (!gebruiker) return
  gebruiker = null
  console.error(tijd(), 'Login kwijt. Log opnieuw in via Business OS (Mac uit → PA inloggen) of npm run pa -- --login')
}
sb.auth.onAuthStateChange((e, s) => {
  if (e === 'SIGNED_OUT' && gebruiker) return loginKwijt()
  bewaarSessie(s)
})

async function login() {
  if (!LOGIN) try {
    const { refresh_token } = JSON.parse(fs.readFileSync(SESSIE, 'utf8'))
    const { data, error } = await sb.auth.refreshSession({ refresh_token })
    if (!error && data.session) return data.session.user
  } catch { /* nog geen sessie */ }
  if (!process.stdin.isTTY) {
    console.error(tijd(), 'Niet ingelogd. Log in via Business OS (Mac uit → PA inloggen) of npm run pa -- --login')
    return null
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const email = (await rl.question('E-mail coach-account: ')).trim()
  const wachtwoord = (await rl.question('Wachtwoord: ')).trim()
  rl.close()
  const { data, error } = await sb.auth.signInWithPassword({ email, password: wachtwoord })
  if (error) { console.error('Inloggen mislukt:', error.message); process.exit(1) }
  bewaarSessie(data.session)
  console.clear()
  return data.user
}

const TOEGESTAAN = [
  'Read', 'Glob', 'Grep', 'Edit', 'Write',
  'Bash(npm run build)', 'Bash(npm run lint)', 'Bash(npx eslint *)',
  'Bash(git status*)', 'Bash(git diff*)', 'Bash(git log*)', 'Bash(git show*)',
]
const VERBODEN = ['Bash(git commit*)', 'Bash(git push*)', 'Bash(git stash*)', 'Bash(git reset*)', 'Bash(git checkout*)']

const INSTRUCTIE = `Je krijgt een opdracht van Kersten uit zijn Business OS-chat. Voer hem uit in deze repo.
- Volg CLAUDE.md (lees het eerst) en zijn memory.
- Niet committen, pushen of stashen: de auto-sync doet dat.
- Log nooit uit op Kerstens account en maak geen sessies op zijn account (ook niet met de service key om iets te testen): signOut trekt al zijn logins in, ook die van deze PA en zijn browser.
- Schemawijzigingen in de database kun je hier niet doen; heb je er een nodig, zeg dat in je samenvatting.
- Klaar = npm run build en eslint op de gewijzigde bestanden zijn groen.
- Eindig met een korte Nederlandse samenvatting voor Kersten (3-6 regels, pijltjes): wat je veranderd hebt en waar hij het ziet. Wat niet lukte, zeg je eerlijk.`

const CHAT_TOEGESTAAN = ['Read', 'Glob', 'Grep', 'Bash(node scripts/pa-db.mjs *)']

function claude(args, extraEnv = {}) {
  return new Promise((klaar) => {
    const p = spawn('claude', args, { cwd: MAP, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...extraEnv } })
    let uit = '', fout = ''
    p.stdout.on('data', d => { uit += d })
    p.stderr.on('data', d => { fout += d })
    const stop = setTimeout(() => p.kill('SIGTERM'), 30 * 60 * 1000)
    p.on('close', (code) => {
      clearTimeout(stop)
      let json = null
      try { json = JSON.parse(uit) } catch { /* geen JSON */ }
      klaar({ code, json, ruw: uit.trim(), fout: fout.trim() })
    })
  })
}

async function voerCodeUit(opdracht) {
  const r = await claude([
    '-p', `${INSTRUCTIE}\n\nOpdracht:\n${opdracht}`,
    '--output-format', 'json',
    '--permission-mode', 'acceptEdits',
    '--allowedTools', TOEGESTAAN.join(','),
    '--disallowedTools', VERBODEN.join(','),
    '--max-budget-usd', '10',
  ])
  const tekst = r.json?.result || r.ruw || r.fout || `Gestopt (code ${r.code})`
  return { ok: r.code === 0 && !r.json?.is_error && !!r.json?.result, tekst: tekst.slice(0, 8000) }
}

async function beantwoordChat(invoer) {
  const { data: skills } = await sb.from('business_os_skills')
    .select('naam, wanneer, instructies').eq('actief', true).order('naam')
  const berichten = (invoer?.berichten || []).slice(-20)
  const gesprek = berichten.map(b => `${b.role === 'user' ? 'Kersten' : 'Jij'}: ${b.content}`).join('\n\n')
  const { data: { session } } = await sb.auth.getSession()
  const r = await claude([
    '-p', `Gesprek tot nu toe:\n\n${gesprek}\n\nBeantwoord het laatste bericht van Kersten.`,
    '--system-prompt', chatPrompt({ skills: skills || [], context: invoer?.context }),
    '--output-format', 'json',
    '--json-schema', JSON.stringify(ANTWOORD_SCHEMA),
    '--permission-mode', 'dontAsk',
    '--allowedTools', CHAT_TOEGESTAAN.join(','),
    '--no-session-persistence',
    '--max-budget-usd', '3',
  ], { PA_ACCESS_TOKEN: session?.access_token || '' })
  const a = r.json?.structured_output
  if (r.code !== 0 || !a?.tekst) return { ok: false, antwoord: { tekst: r.json?.result || r.fout || 'Geen antwoord van Claude Code.', acties: [] } }
  return { ok: true, antwoord: { tekst: String(a.tekst), acties: Array.isArray(a.acties) ? a.acties : [] } }
}

const tijd = () => new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
const bezig = { code: false, chat: false }

async function pak(soort) {
  if (bezig[soort] || !gebruiker) return null
  const { data: rij, error } = await sb.from('business_os_opdrachten')
    .select('id, opdracht, invoer').eq('status', 'wacht').eq('soort', soort)
    .order('created_at').limit(1).maybeSingle()
  if (error) { console.error(tijd(), 'Ophalen mislukt:', error.message); return null }
  if (!rij) return null
  // Alleen oppakken als hij nog op 'wacht' stond (geen dubbele uitvoering).
  const { data: gepakt } = await sb.from('business_os_opdrachten')
    .update({ status: 'bezig', gestart_at: new Date().toISOString() })
    .eq('id', rij.id).eq('status', 'wacht').select('id')
  return gepakt?.length ? rij : null
}

async function rondeCode() {
  const rij = await pak('code')
  if (!rij) return
  bezig.code = true
  try {
    console.log(`${tijd()} ▶ code: ${rij.opdracht.split('\n')[0].slice(0, 100)}`)
    const r = await voerCodeUit(rij.opdracht)
    await sb.from('business_os_opdrachten')
      .update({ status: r.ok ? 'klaar' : 'mislukt', resultaat: r.tekst, klaar_at: new Date().toISOString() })
      .eq('id', rij.id)
    console.log(`${tijd()} ${r.ok ? '✓ klaar' : '✗ mislukt'}\n${r.tekst}\n`)
  } finally { bezig.code = false }
}

async function rondeChat() {
  const rij = await pak('chat')
  if (!rij) return
  bezig.chat = true
  try {
    console.log(`${tijd()} 💬 ${rij.opdracht.slice(0, 100)}`)
    const r = await beantwoordChat(rij.invoer)
    await sb.from('business_os_opdrachten')
      .update({ status: r.ok ? 'klaar' : 'mislukt', antwoord: r.antwoord, klaar_at: new Date().toISOString() })
      .eq('id', rij.id)
  } finally { bezig.chat = false }
}

const hartslag = () => gebruiker && sb.from('business_os_pa_status')
  .upsert({ coach_id: gebruiker.id, laatst_gezien: new Date().toISOString() })
  .then(({ error }) => {
    if (!error) return
    // RLS-weigering = we praten als anon: de login is kwijt.
    if (/row-level security|JWT/i.test(error.message)) return loginKwijt()
    console.error(tijd(), 'Hartslag mislukt:', error.message)
  }, () => {})

// Alleen opnieuw inloggen: sessie bewaren en de achtergrond-PA herstarten.
if (LOGIN) {
  const g = await login()
  console.log(`Ingelogd als ${g.email}. Achtergrond-PA wordt herstart…`)
  spawn('launchctl', ['kickstart', '-k', `gui/${process.getuid()}/nl.myarc.pa`], { stdio: 'inherit' })
    .on('close', () => { console.log('Klaar. Log: ~/Library/Logs/myarc-pa.log'); process.exit(0) })
  await new Promise(() => {})
}

// Draait er al een PA (bv. de automatische op de achtergrond)? Dan niet nog een.
const PID = path.join(SESSIE_MAP, 'pa.pid')
try {
  const ander = Number(fs.readFileSync(PID, 'utf8'))
  if (ander && ander !== process.pid) {
    process.kill(ander, 0)
    console.log(`De PA draait al (proces ${ander}). Log: ~/Library/Logs/myarc-pa.log`)
    process.exit(0)
  }
} catch { /* geen of verlopen pid-bestand */ }
fs.mkdirSync(SESSIE_MAP, { recursive: true, mode: 0o700 })
fs.writeFileSync(PID, String(process.pid))
const ruimOp = () => { try { if (Number(fs.readFileSync(PID, 'utf8')) === process.pid) fs.unlinkSync(PID) } catch { /* al weg */ } }
process.on('exit', ruimOp)
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(0))

async function start(g) {
  gebruiker = g
  console.log(`${tijd()} MY ARC PA draait in ${MAP} als ${g.email}. Wacht op opdrachten en chatvragen uit Business OS… (Ctrl+C = stoppen)\n`)
  // Bleef er bij een vorige keer iets op 'bezig' hangen (script gestopt)? Code
  // terug in de wachtrij; een oude chatvraag heeft de chat al via de API gedaan.
  // Niet als er nu zelf iets loopt (opnieuw ingelogd tijdens een opdracht).
  if (!bezig.code) await sb.from('business_os_opdrachten').update({ status: 'wacht', gestart_at: null }).eq('status', 'bezig').eq('soort', 'code')
  if (!bezig.chat) await sb.from('business_os_opdrachten').update({ status: 'mislukt' }).eq('status', 'bezig').eq('soort', 'chat')
  await hartslag()
}

// Lokaal loket voor inloggen vanuit Business OS.
const POORT = 47615
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  res.setHeader('Content-Type', 'application/json')
  const stuur = (code, x) => { res.statusCode = code; res.end(JSON.stringify(x)) }
  if (req.method === 'OPTIONS') return stuur(204, {})
  if (req.method === 'GET' && req.url === '/status') return stuur(200, { ingelogd: !!gebruiker })
  if (req.method !== 'POST' || req.url !== '/login') return stuur(404, { fout: 'onbekend' })
  // Al ingelogd: niets aanraken (een ongeldige sessie zou de huidige wissen).
  if (gebruiker) return stuur(200, { ok: true })
  let body = ''
  for await (const d of req) { body += d; if (body.length > 10000) return stuur(413, { fout: 'te groot' }) }
  try {
    const { refresh_token } = JSON.parse(body)
    if (!refresh_token) return stuur(400, { fout: 'geen sessie' })
    const { data, error } = await sb.auth.refreshSession({ refresh_token })
    if (error || !data.session) return stuur(401, { fout: 'sessie ongeldig' })
    const { data: rol } = await sb.rpc('get_my_portal_role')
    if (!['coach', 'both'].includes(rol)) {
      await sb.auth.signOut({ scope: 'local' })
      return stuur(403, { fout: 'alleen coach-accounts' })
    }
    bewaarSessie(data.session)
    await start(data.session.user)
    stuur(200, { ok: true })
  } catch (e) { stuur(500, { fout: e.message }) }
}).listen(POORT, '127.0.0.1').on('error', e => console.error(tijd(), 'Lokaal loket niet gestart:', e.message))

const g = await login()
if (g) await start(g)
setInterval(hartslag, 15000)
const fout = (e) => console.error(tijd(), e.message)
setInterval(() => rondeChat().catch(fout), 1500)
setInterval(() => rondeCode().catch(fout), 5000)
