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
import { chatPrompt, chatVraag, leesAntwoord, zichtbareTekst } from './business-os-pa-prompt.mjs'

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
  if (warm && !warm.dood) warm.p.kill()
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
// De chat past nooit zelf iets aan (dat loopt via Toestaan / Uitvoeren op mijn
// Mac). Hard verboden, ook als een instellingenbestand het ooit toestaat.
const CHAT_VERBODEN = ['Edit', 'Write', 'NotebookEdit']
// Chat licht houden (sneller antwoord): ander model, lage effort, geen
// MCP-servers, geen user- of local-instellingen (settings.local.json staat
// Edit/Write/sed toe voor jouw eigen sessies) en geen skills. Inloggen blijft
// via het abonnement (dus geen --bare: die wil een ANTHROPIC_API_KEY).
// CHAT_ENV: geen CLAUDE.md en geen auto-memory meeladen (~14k tokens en ~1 s
// per bericht, gemeten 30 okt). De cwd blijft, dus Read/Grep en pa-db werken;
// CLAUDE.md lezen kan de chat nog zelf met Read.
const CHAT_MODEL = process.env.PA_CHAT_MODEL || 'sonnet'
const CHAT_ENV = { CLAUDE_CODE_DISABLE_CLAUDE_MDS: '1', CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' }
const CHAT_LICHT = [
  '--model', CHAT_MODEL,
  '--effort', 'low',
  '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
  '--setting-sources', 'project',
  '--disable-slash-commands',
]

// Slim (knop in Business OS): zoals Claude Code in de terminal. Opus, lang
// nadenken, CLAUDE.md + memory, de volledige Claude Code-systeemprompt (de
// Business OS-regels komen erachter) en per gesprek een sessie die hervat
// wordt, zodat hij onthoudt wat hij al opzocht. Wel dezelfde rechten als Snel
// plus internet: alleen lezen, wijzigen via voorstellen.
const SLIM_MODEL = process.env.PA_SLIM_MODEL || 'opus'
const SLIM_TOEGESTAAN = [...CHAT_TOEGESTAAN, 'WebSearch', 'WebFetch']
const SLIM_ARGS = [
  '--model', SLIM_MODEL,
  '--effort', 'high',
  '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
  '--setting-sources', 'project',
  '--disable-slash-commands',
]
const GESPREK_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLIM_SESSIES = path.join(os.homedir(), '.config', 'myarc-pa', 'slim-sessies.json')
const slimSessies = new Set((() => { try { return JSON.parse(fs.readFileSync(SLIM_SESSIES, 'utf8')) } catch { return [] } })())
const bewaarSlimSessie = (id) => {
  slimSessies.add(id)
  try { fs.writeFileSync(SLIM_SESSIES, JSON.stringify([...slimSessies].slice(-200)), { mode: 0o600 }) } catch { /* niet erg */ }
}

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

// Snelle chat: er staat altijd één Claude-proces klaar (opgestart, ingelogd,
// systeemprompt geladen) dat op de volgende vraag wacht. Dat scheelt ~1,5 s
// opstart per vraag. Eén vraag per proces: in hetzelfde proces doorpraten
// werd juist trager. Na elke vraag, of na 20 min (sessietoken + skills
// vers), komt er een nieuw klaar te staan.
const WARM_MAX_MS = 20 * 60 * 1000
let warm = null

// slim = { id, hervat } → Slim-proces voor dat gesprek; anders een Snel-proces.
async function maakWarm(slim = null) {
  const { data: skills } = await sb.from('business_os_skills')
    .select('naam, wanneer, instructies').eq('actief', true).order('naam')
  // Het token gaat mee bij het opstarten: zorg dat het nog ruim een half uur geldig is.
  let { data: { session } } = await sb.auth.getSession()
  if (session && session.expires_at * 1000 - Date.now() < 30 * 60 * 1000) {
    session = (await sb.auth.refreshSession()).data.session || session
  }
  const basis = ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--include-partial-messages',
    '--permission-mode', 'dontAsk', '--disallowedTools', CHAT_VERBODEN.join(',')]
  const args = slim ? [
    ...basis,
    '--append-system-prompt', chatPrompt({ skills: skills || [] }),
    '--allowedTools', SLIM_TOEGESTAAN.join(','),
    ...(slim.hervat ? ['--resume', slim.id] : ['--session-id', slim.id]),
    '--max-budget-usd', '10',
    ...SLIM_ARGS,
  ] : [
    ...basis,
    '--system-prompt', chatPrompt({ skills: skills || [] }),
    '--allowedTools', CHAT_TOEGESTAAN.join(','),
    '--no-session-persistence',
    '--max-budget-usd', '3',
    ...CHAT_LICHT,
  ]
  const p = spawn('claude', args, { cwd: MAP, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...(slim ? {} : CHAT_ENV), PA_ACCESS_TOKEN: session?.access_token || '' } })
  const w = { p, sinds: Date.now(), dood: false, regels: [] }
  let buf = ''
  p.stdout.on('data', d => {
    buf += d
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const r = buf.slice(0, i); buf = buf.slice(i + 1)
      if (!r.trim()) continue
      let m
      try { m = JSON.parse(r) } catch { continue }
      w.opBericht?.(m)
    }
  })
  p.stderr.on('data', d => { w.fout = (w.fout || '') + d })
  p.on('close', () => { w.dood = true; w.opEinde?.() })
  p.stdin.on('error', () => {})
  return w
}

let warmStart = false
function zetWarmKlaar() {
  if (!gebruiker || warmStart) return
  if (warm && !warm.dood && Date.now() - warm.sinds < WARM_MAX_MS) return
  if (warm && !warm.dood) warm.p.kill()
  warm = null
  warmStart = true
  maakWarm().then(w => { warm = w }, e => console.error(tijd(), 'Warm proces mislukt:', e.message))
    .finally(() => { warmStart = false })
}
process.on('exit', () => { if (warm && !warm.dood) warm.p.kill() })
setInterval(zetWarmKlaar, 60 * 1000)

// opDeel(tekst): halve tekst tijdens het typen.
async function beantwoordChat(invoer, opDeel) {
  const slimId = invoer?.modus === 'slim' && GESPREK_ID.test(invoer?.gesprek_id || '') ? invoer.gesprek_id : null
  const hervat = !!slimId && slimSessies.has(slimId)
  let w
  if (slimId) w = await maakWarm({ id: slimId, hervat })
  else {
    if (!warm || warm.dood || Date.now() - warm.sinds > WARM_MAX_MS) { warm?.p.kill(); warm = await maakWarm() }
    w = warm
    warm = null
  }
  const berichten = (invoer?.berichten || []).slice(-20)
  // Hervat Slim-gesprek: de sessie kent de rest al, alleen de nieuwe vraag.
  const gesprek = (hervat ? berichten.slice(-1) : berichten)
    .map(b => `${b.role === 'user' ? 'Kersten' : 'Jij'}: ${b.content}`).join('\n\n')
  const r = await new Promise((klaar) => {
    let deel = ''
    const stop = setTimeout(() => w.p.kill('SIGTERM'), (slimId ? 10 : 5) * 60 * 1000)
    w.opBericht = (m) => {
      if (m.type === 'stream_event') {
        const e = m.event
        if (e?.type === 'message_start') deel = ''
        else if (e?.type === 'content_block_delta' && e.delta?.type === 'text_delta') { deel += e.delta.text; opDeel(zichtbareTekst(deel)) }
      } else if (m.type === 'result') {
        clearTimeout(stop)
        klaar({ ok: m.subtype === 'success' && !m.is_error, tekst: m.result || '' })
        w.p.stdin.end()
      }
    }
    w.opEinde = () => { clearTimeout(stop); klaar({ ok: false, tekst: w.fout?.trim() || 'Claude Code stopte zonder antwoord.' }) }
    if (w.dood) return w.opEinde()
    w.p.stdin.write(JSON.stringify({ type: 'user', message: { role: 'user', content: chatVraag({ gesprek, context: invoer?.context }) } }) + '\n')
  })
  if (slimId && r.ok) bewaarSlimSessie(slimId)
  if (!slimId) setTimeout(zetWarmKlaar, 500)
  if (!r.ok || !r.tekst) return { ok: false, antwoord: { tekst: r.tekst || 'Geen antwoord van Claude Code.', acties: [] } }
  return { ok: true, antwoord: leesAntwoord(r.tekst) }
}

const tijd = () => new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
const bezig = { code: false, chat: false }

// Zet bezig[soort] meteen, zodat Realtime en het pollen niet tegelijk pakken;
// de ronde zet hem terug. Geen rij = meteen terug.
async function pak(soort) {
  if (bezig[soort] || !gebruiker) return null
  bezig[soort] = true
  const rij = await pakRij(soort).catch(() => null)
  if (!rij) bezig[soort] = false
  return rij
}

async function pakRij(soort) {
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

// Auto-herstart na een code-opdracht: de opdracht kan dit script zelf hebben
// aangepast, en zo is de nieuwe code live zonder Terminal. Pas als het
// resultaat in de database staat en er geen chatantwoord loopt; dan ~3 s
// later via een losgekoppeld proces (overleeft het stoppen van de PA).
// Eén keer per opdracht: het id gaat vóór de herstart naar laatste-herstart,
// en na de herstart staat de rij op klaar/mislukt, dus hij komt niet terug.
const HERSTART_ID = path.join(SESSIE_MAP, 'laatste-herstart')
let herstartGepland = false
async function herstartNa(id) {
  try { if (fs.readFileSync(HERSTART_ID, 'utf8') === String(id)) return } catch { /* nog nooit */ }
  herstartGepland = true
  for (let i = 0; bezig.chat && i < 600; i++) await new Promise(r => setTimeout(r, 1000))
  fs.writeFileSync(HERSTART_ID, String(id), { mode: 0o600 })
  console.log(`${tijd()} ↻ PA herstart over 3 s (nieuwe code live)`)
  spawn('sh', ['-c', `sleep 3; launchctl kickstart -k gui/${process.getuid()}/nl.myarc.pa`], { detached: true, stdio: 'ignore' }).unref()
}

async function rondeCode() {
  if (herstartGepland) return
  const rij = await pak('code')
  if (!rij) return
  bezig.code = true
  try {
    console.log(`${tijd()} ▶ code: ${rij.opdracht.split('\n')[0].slice(0, 100)}`)
    const r = await voerCodeUit(rij.opdracht)
    const { error } = await sb.from('business_os_opdrachten')
      .update({ status: r.ok ? 'klaar' : 'mislukt', resultaat: r.tekst, klaar_at: new Date().toISOString() })
      .eq('id', rij.id)
    console.log(`${tijd()} ${r.ok ? '✓ klaar' : '✗ mislukt'}\n${r.tekst}\n`)
    if (error) console.error(tijd(), 'Resultaat opslaan mislukt, geen herstart:', error.message)
    else herstartNa(rij.id).catch(e => console.error(tijd(), 'Herstart mislukt:', e.message))
  } finally { bezig.code = false }
}

async function rondeChat() {
  const rij = await pak('chat')
  if (!rij) return
  bezig.chat = true
  try {
    console.log(`${tijd()} 💬 ${rij.opdracht.slice(0, 100)}`)
    const t0 = Date.now()
    // Halve tekst max. ~3x per seconde naar de rij; Business OS luistert mee.
    let laatst = 0, wachtend = null, klaar = false
    const schrijf = (tekst) => sb.from('business_os_opdrachten').update({ antwoord: { tekst, bezig: true } })
      .eq('id', rij.id).eq('status', 'bezig').then(() => {}, () => {})
    const opDeel = (tekst) => {
      if (!tekst || klaar) return
      clearTimeout(wachtend)
      const nu = Date.now()
      if (nu - laatst > 300) { laatst = nu; schrijf(tekst) } else wachtend = setTimeout(() => { laatst = Date.now(); if (!klaar) schrijf(tekst) }, 300)
    }
    const r = await beantwoordChat(rij.invoer, opDeel)
    klaar = true
    clearTimeout(wachtend)
    const model = rij.invoer?.modus === 'slim' ? `${SLIM_MODEL}, slim` : CHAT_MODEL
    console.log(`${tijd()} ${r.ok ? '✓' : '✗'} chat-antwoord in ${((Date.now() - t0) / 1000).toFixed(1)} s (${model})`)
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
  zetWarmKlaar()
  // Nieuwe opdracht? Realtime meldt hem meteen (RLS: alleen eigen rijen); het
  // pollen blijft als vangnet. Eén keer aanmelden, ook na opnieuw inloggen.
  if (!kanaal) kanaal = sb.channel('pa-opdrachten')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'business_os_opdrachten' }, (m) => {
      if (m.new?.status !== 'wacht') return
      const f = m.new.soort === 'chat' ? rondeChat : rondeCode
      f().catch(e => console.error(tijd(), e.message))
    })
    .subscribe()
}
let kanaal = null

// Herstart-knop in Business OS: POST /herstart { access_token }. Alleen met
// een geldige login van hetzelfde account (een willekeurige website kan de PA
// zo niet herstarten). Loopt er een code-opdracht, dan niet: die herstart na
// afloop al vanzelf. Daarna hetzelfde losgekoppelde kickstart als herstartNa.
async function herstartVerzoek(req, stuur) {
  let body = ''
  for await (const d of req) { body += d; if (body.length > 10000) return stuur(413, { fout: 'te groot' }) }
  try {
    const { access_token } = JSON.parse(body || '{}')
    if (!access_token) return stuur(400, { fout: 'geen login' })
    const { data, error } = await sb.auth.getUser(access_token)
    if (error || !data?.user) return stuur(401, { fout: 'login ongeldig' })
    if (gebruiker && data.user.id !== gebruiker.id) return stuur(403, { fout: 'ander account' })
    if (bezig.code || herstartGepland) return stuur(409, { fout: 'Er loopt een code-opdracht, daarna herstart de PA vanzelf' })
    herstartGepland = true
    console.log(`${tijd()} ↻ PA herstart op verzoek uit Business OS`)
    spawn('sh', ['-c', `sleep 1; launchctl kickstart -k gui/${process.getuid()}/nl.myarc.pa`], { detached: true, stdio: 'ignore' }).unref()
    stuur(200, { ok: true })
  } catch (e) { stuur(500, { fout: e.message }) }
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
  if (req.method === 'POST' && req.url === '/herstart') return herstartVerzoek(req, stuur)
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
setInterval(() => rondeChat().catch(fout), 3000)
setInterval(() => rondeCode().catch(fout), 5000)
