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
//
// Claude Code mag hier: bestanden lezen/bewerken, build, lint, git diff/status.
// Niet: committen, pushen, stashen, iets anders in de shell, of MCP-tools
// (dus ook geen databasewijzigingen; die lopen via de Toestaan-knop in de chat).

import { spawn } from 'node:child_process'
import fs from 'node:fs'
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
sb.auth.onAuthStateChange((_e, s) => bewaarSessie(s))

async function login() {
  try {
    const { refresh_token } = JSON.parse(fs.readFileSync(SESSIE, 'utf8'))
    const { data, error } = await sb.auth.refreshSession({ refresh_token })
    if (!error && data.session) return data.session.user
  } catch { /* nog geen sessie */ }
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
  if (bezig[soort]) return null
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

const hartslag = () => sb.from('business_os_pa_status')
  .upsert({ coach_id: gebruiker.id, laatst_gezien: new Date().toISOString() })
  .then(({ error }) => { if (error) console.error(tijd(), 'Hartslag mislukt:', error.message) }, () => {})

const gebruiker = await login()
console.log(`MY ARC PA draait in ${MAP} als ${gebruiker.email}. Wacht op opdrachten en chatvragen uit Business OS… (Ctrl+C = stoppen)\n`)
// Bleef er bij een vorige keer iets op 'bezig' hangen (script gestopt)? Code
// terug in de wachtrij; een oude chatvraag heeft de chat al via de API gedaan.
await sb.from('business_os_opdrachten').update({ status: 'wacht', gestart_at: null }).eq('status', 'bezig').eq('soort', 'code')
await sb.from('business_os_opdrachten').update({ status: 'mislukt' }).eq('status', 'bezig').eq('soort', 'chat')
await hartslag()
setInterval(hartslag, 15000)
const fout = (e) => console.error(tijd(), e.message)
setInterval(() => rondeChat().catch(fout), 1500)
setInterval(() => rondeCode().catch(fout), 5000)
