// scripts/pa-sql.mjs
//
// Gino mag de database uitbreiden, niet afbreken (3 nov 2026). Voert één
// .sql-bestand uit de repo uit via de Supabase Management API.
//
//   node scripts/pa-sql.mjs <pad.sql>          controleren en uitvoeren
//   node scripts/pa-sql.mjs --check <pad.sql>  alleen controleren
//
// Sleutel: SUPABASE_ACCESS_TOKEN uit .env.local (wordt nooit geprint).
// De controle hieronder is de afspraak uit CLAUDE.md (oude app-versies blijven
// werken) plus: niets dat een klant een melding kan sturen. Wat geweigerd wordt
// gaat langs Kersten. Elke uitvoering komt in ~/Gino/sql-log.txt.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const MAP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const args = process.argv.slice(2)
const alleenCheck = args[0] === '--check'
const pad = path.resolve(MAP, alleenCheck ? args[1] || '' : args[0] || '')

const stop = (uit, code = 1) => { console.log(JSON.stringify(uit)); process.exit(code) }

if (!pad.endsWith('.sql') || !pad.startsWith(path.join(MAP, 'src') + path.sep) || !fs.existsSync(pad)) {
  stop({ gelukt: false, reden: 'Geef een bestaand .sql-bestand onder src/ op.' })
}

const VERBODEN = [
  [/\bdrop\s+(table|column|schema|function|procedure|view|materialized|type|index|extension|sequence|role|database|domain|publication)\b/i, 'drop van iets dat een oude app-versie kan gebruiken'],
  [/\balter\s+table\b[^;]*\bdrop\b/i, 'kolom of constraint weghalen'],
  [/\brename\b/i, 'hernoemen'],
  [/\balter\s+column\b[^;]*\btype\b/i, 'kolomtype wijzigen'],
  [/\btruncate\b/i, 'tabel leegmaken'],
  [/\bdelete\s+from\b/i, 'rijen verwijderen'],
  [/\bdisable\s+row\s+level\s+security\b/i, 'RLS uitzetten'],
  [/\bgrant\b[^;]*\bto\b[^;]*\b(anon|public)\b/i, 'recht geven aan anon of public'],
  [/\b(alter|create)\s+role\b/i, 'rollen wijzigen'],
  [/\bcron\.unschedule\b/i, 'cronjob weghalen'],
  [/\b(insert\s+into|update|alter\s+table)\s+(auth|vault|storage)\./i, 'auth, vault of storage wijzigen'],
  [/\b(insert\s+into|update)\s+(public\.)?(notifications|notification_schedules)\b/i, 'meldingen naar klanten'],
]

function controleer(sql) {
  const kaal = sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ')
  const fouten = VERBODEN.filter(([re]) => re.test(kaal)).map(([, reden]) => reden)
  // Policy of trigger vervangen mag, alleen als hij in hetzelfde bestand terugkomt.
  for (const m of kaal.matchAll(/\bdrop\s+(policy|trigger)\s+(?:if\s+exists\s+)?("?\w+"?)/gi)) {
    const terug = new RegExp(`\\bcreate\\s+(?:or\\s+replace\\s+)?(?:constraint\\s+)?${m[1]}\\s+${m[2]}\\b`, 'i')
    if (!terug.test(kaal)) fouten.push(`${m[1]} ${m[2]} wordt weggehaald en niet teruggezet`)
  }
  for (const s of kaal.split(';')) {
    if (/^\s*update\b/i.test(s) && !/\bwhere\b/i.test(s)) fouten.push('update zonder where')
  }
  return [...new Set(fouten)]
}

const naam = path.relative(MAP, pad)
const sql = fs.readFileSync(pad, 'utf8')
const fouten = controleer(sql)
if (fouten.length) stop({ gelukt: false, bestand: naam, geweigerd: fouten, reden: 'Dit mag alleen met Kersten erbij. Noem het in je samenvatting (UITKOMST: wacht_op_jou).' }, 2)
if (alleenCheck) stop({ gelukt: true, bestand: naam, controle: 'in orde' }, 0)

const env = Object.fromEntries(
  fs.readFileSync(path.join(MAP, '.env.local'), 'utf8').split('\n')
    .map(r => r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^['"]|['"]$/g, '')])
)
const ref = (env.VITE_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
if (!env.SUPABASE_ACCESS_TOKEN || !ref) {
  stop({ gelukt: false, bestand: naam, reden: 'SUPABASE_ACCESS_TOKEN ontbreekt in .env.local: Kersten moet deze SQL laten draaien (UITKOMST: wacht_op_jou).' })
}

const antwoord = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
}).catch(e => ({ ok: false, status: 0, text: async () => e.message }))
const tekst = await antwoord.text()

try {
  const log = path.join(os.homedir(), 'Gino', 'sql-log.txt')
  fs.mkdirSync(path.dirname(log), { recursive: true })
  fs.appendFileSync(log, `${new Date().toISOString()} ${antwoord.ok ? 'gelukt' : `fout ${antwoord.status}`} ${naam}\n`)
} catch { /* log is geen reden om te falen */ }

stop(antwoord.ok
  ? { gelukt: true, bestand: naam, uitkomst: tekst.slice(0, 2000) }
  : { gelukt: false, bestand: naam, status: antwoord.status, reden: tekst.slice(0, 2000) }, antwoord.ok ? 0 : 1)
