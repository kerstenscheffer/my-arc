// scripts/business-os-pa.mjs
//
// Lokale PA voor de Business OS-chat (30 okt 2026).
//   npm run pa
//
// Klikt Kersten in de chat op "Uitvoeren op mijn Mac", dan komt er een rij in
// business_os_opdrachten (status 'wacht'). Dit script kijkt elke 5 s, zet hem
// op 'bezig' en start Claude Code in deze map. De wijziging staat meteen in
// de lokale bestanden (Vite laat hem direct zien); de auto-sync commit later.
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

function voerUit(opdracht) {
  return new Promise((klaar) => {
    const args = [
      '-p', `${INSTRUCTIE}\n\nOpdracht:\n${opdracht}`,
      '--output-format', 'json',
      '--permission-mode', 'acceptEdits',
      '--allowedTools', TOEGESTAAN.join(','),
      '--disallowedTools', VERBODEN.join(','),
      '--max-budget-usd', '10',
    ]
    const p = spawn('claude', args, { cwd: MAP, stdio: ['ignore', 'pipe', 'pipe'] })
    let uit = '', fout = ''
    p.stdout.on('data', d => { uit += d })
    p.stderr.on('data', d => { fout += d })
    const stop = setTimeout(() => p.kill('SIGTERM'), 30 * 60 * 1000)
    p.on('close', (code) => {
      clearTimeout(stop)
      let tekst = ''
      try { tekst = JSON.parse(uit).result || '' } catch { tekst = uit.trim() }
      klaar({ ok: code === 0 && !!tekst, tekst: (tekst || fout.trim() || `Gestopt (code ${code})`).slice(0, 8000) })
    })
  })
}

const tijd = () => new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
let bezig = false

async function ronde() {
  if (bezig) return
  const { data: rij, error } = await sb.from('business_os_opdrachten')
    .select('id, opdracht').eq('status', 'wacht').order('created_at').limit(1).maybeSingle()
  if (error) { console.error(tijd(), 'Ophalen mislukt:', error.message); return }
  if (!rij) return
  // Alleen oppakken als hij nog op 'wacht' stond (geen dubbele uitvoering).
  const { data: gepakt } = await sb.from('business_os_opdrachten')
    .update({ status: 'bezig', gestart_at: new Date().toISOString() })
    .eq('id', rij.id).eq('status', 'wacht').select('id')
  if (!gepakt?.length) return
  bezig = true
  console.log(`${tijd()} ▶ ${rij.opdracht.split('\n')[0].slice(0, 100)}`)
  const r = await voerUit(rij.opdracht)
  await sb.from('business_os_opdrachten')
    .update({ status: r.ok ? 'klaar' : 'mislukt', resultaat: r.tekst, klaar_at: new Date().toISOString() })
    .eq('id', rij.id)
  console.log(`${tijd()} ${r.ok ? '✓ klaar' : '✗ mislukt'}\n${r.tekst}\n`)
  bezig = false
}

const gebruiker = await login()
console.log(`MY ARC PA draait in ${MAP} als ${gebruiker.email}. Wacht op opdrachten uit Business OS… (Ctrl+C = stoppen)\n`)
// Bleef er bij een vorige keer iets op 'bezig' hangen (script gestopt)? Terug in de wachtrij.
await sb.from('business_os_opdrachten').update({ status: 'wacht', gestart_at: null }).eq('status', 'bezig')
await ronde()
setInterval(() => ronde().catch(e => { bezig = false; console.error(tijd(), e.message) }), 5000)
