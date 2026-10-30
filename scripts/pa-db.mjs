// scripts/pa-db.mjs
//
// Database-hulpje voor de Business OS-chat als die via de lokale PA draait
// (scripts/business-os-pa.mjs). Claude Code mag in chat-modus alleen dit
// script aanroepen; het doet hetzelfde als de tools van de edge function
// business-os-chat, met Kerstens eigen sessie (PA_ACCESS_TOKEN, gezet door de
// PA) en dus zijn RLS.
//
//   node scripts/pa-db.mjs lees "select ..."         alleen SELECT (business_os_lees)
//   node scripts/pa-db.mjs schema [tabel]            tabellen / kolommen
//   node scripts/pa-db.mjs skill-bewaar '{"naam":…,"wanneer":…,"instructies":…}'
//   node scripts/pa-db.mjs skill-uit "naam"
//   node scripts/pa-db.mjs app-lijst "opdracht"      rij in app_issues
//
// Datawijzigingen kunnen hier niet: die gaan als voorstel terug naar de chat
// en pas Kerstens klik op Toestaan voert ze uit.

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const MAP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const env = Object.fromEntries(
  fs.readFileSync(path.join(MAP, '.env.local'), 'utf8').split('\n')
    .map(r => r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^['"]|['"]$/g, '')])
)
const token = process.env.PA_ACCESS_TOKEN
if (!token) { console.log(JSON.stringify({ fout: 'Geen PA-sessie (alleen te gebruiken vanuit npm run pa).' })); process.exit(1) }

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${token}` } },
})

const [cmd, arg = ''] = process.argv.slice(2)
const uit = (x) => console.log(JSON.stringify(x).slice(0, 30000))

if (cmd === 'lees') {
  const { data, error } = await sb.rpc('business_os_lees', { p_sql: arg })
  uit(error ? { fout: error.message } : data)
} else if (cmd === 'schema') {
  const { data, error } = await sb.rpc('business_os_schema', { p_tabel: arg || null })
  uit(error ? { fout: error.message } : data)
} else if (cmd === 'skill-bewaar') {
  let s
  try { s = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const { data: { user } } = await sb.auth.getUser(token)
  const rij = {
    coach_id: user.id,
    naam: String(s.naam || '').trim().slice(0, 80),
    wanneer: String(s.wanneer || '').trim().slice(0, 500),
    instructies: String(s.instructies || '').trim().slice(0, 12000),
    actief: true, updated_at: new Date().toISOString(),
  }
  if (!rij.naam || !rij.wanneer || !rij.instructies) { uit({ fout: 'naam, wanneer en instructies zijn verplicht' }); process.exit(1) }
  const { error } = await sb.from('business_os_skills').upsert(rij, { onConflict: 'coach_id,naam' })
  uit(error ? { fout: error.message } : { ok: true, naam: rij.naam })
} else if (cmd === 'skill-uit') {
  const { data, error } = await sb.from('business_os_skills')
    .update({ actief: false, updated_at: new Date().toISOString() }).eq('naam', arg).select('id')
  uit(error ? { fout: error.message } : { ok: !!data?.length })
} else if (cmd === 'app-lijst') {
  const { data: { user } } = await sb.auth.getUser(token)
  const { error } = await sb.from('app_issues').insert({ coach_id: user.id, text: `[Business OS] ${arg.slice(0, 4000)}` })
  uit(error ? { fout: error.message } : { ok: true })
} else {
  uit({ fout: `Onbekend commando: ${cmd}` })
}
