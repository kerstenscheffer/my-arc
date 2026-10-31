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
//   node scripts/pa-db.mjs agenda [van] [tot]        Google Agenda (YYYY-MM-DD, standaard vandaag t/m +7)
//   node scripts/pa-db.mjs skill-bewaar '{"naam":…,"wanneer":…,"instructies":…}'
//   node scripts/pa-db.mjs skill-uit "naam"
//   node scripts/pa-db.mjs app-lijst "opdracht"      rij in app_issues
//   node scripts/pa-db.mjs herinner '{"tekst":…,"moment":"2026-10-31 09:00","bron":"kersten|gino"}'  (NL-tijd)
//   node scripts/pa-db.mjs herinneringen             open herinneringen
//   node scripts/pa-db.mjs onthoud '{"soort":"feit|voorkeur|besluit|correctie","tekst":…,"vervangt":"<id>"?}'
//   node scripts/pa-db.mjs vergeet "<id>"            geheugenregel uitzetten
//   node scripts/pa-db.mjs geheugen                  alles wat actief is, met id
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
} else if (cmd === 'agenda') {
  // Google Agenda (agenda_events, RLS: coach + team). Standaard vandaag t/m +7.
  const dag = (d) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
  const van = arg || dag(Date.now())
  const tot = process.argv[4] || dag(new Date(van).getTime() + 7 * 864e5)
  const { data, error } = await sb.rpc('get_agenda', { van, tot })
  uit(error ? { fout: error.message } : (data || []).map(e => ({
    titel: e.titel, soort: e.soort, contactNaam: e.contact_naam || null, heleDag: e.hele_dag, locatie: e.locatie,
    start: new Date(e.start_at).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }),
    eind: e.end_at ? new Date(e.end_at).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }) : null,
  })))
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
} else if (cmd === 'herinner') {
  // Moment in NL-tijd ("2026-10-31 09:00"); omrekenen via de offset van die dag.
  let h
  try { h = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const m = String(h.moment || '').trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/)
  const tekst = String(h.tekst || '').trim().slice(0, 500)
  if (!m || !tekst) { uit({ fout: 'tekst en moment ("YYYY-MM-DD HH:MM", NL-tijd) zijn verplicht' }); process.exit(1) }
  const alsUtc = Date.parse(`${m[1]}T${m[2].padStart(2, '0')}:${m[3]}:00Z`)
  const nl = new Date(alsUtc).toLocaleString('sv-SE', { timeZone: 'Europe/Amsterdam' }).replace(' ', 'T') + 'Z'
  const moment = new Date(alsUtc - (Date.parse(nl) - alsUtc))
  const { error } = await sb.from('business_os_herinneringen').insert({
    tekst, moment: moment.toISOString(), bron: h.bron === 'gino' ? 'gino' : 'kersten',
  })
  uit(error ? { fout: error.message } : { ok: true, moment: moment.toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }) })
} else if (cmd === 'herinneringen') {
  const { data, error } = await sb.from('business_os_herinneringen').select('tekst, moment, bron')
    .is('klaar_at', null).order('moment').limit(50)
  uit(error ? { fout: error.message } : (data || []).map(r => ({ ...r, moment: new Date(r.moment).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }) })))
} else if (cmd === 'onthoud') {
  // Geheugen: losse feiten, voorkeuren, besluiten en correcties die bij elke
  // vraag in Gino's systeemprompt staan. "vervangt" zet de oude regel uit.
  let g
  try { g = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const soort = ['feit', 'voorkeur', 'besluit', 'correctie'].includes(g.soort) ? g.soort : null
  const tekst = String(g.tekst || '').trim().slice(0, 500)
  if (!soort || tekst.length < 3) { uit({ fout: 'soort (feit|voorkeur|besluit|correctie) en tekst zijn verplicht' }); process.exit(1) }
  const bron = ['kersten', 'nacht'].includes(g.bron) ? g.bron : 'gino'
  const { data, error } = await sb.from('business_os_geheugen').insert({ soort, tekst, bron }).select('id').single()
  if (!error && g.vervangt) {
    await sb.from('business_os_geheugen').update({ actief: false, updated_at: new Date().toISOString() }).eq('id', g.vervangt)
  }
  uit(error ? { fout: error.message } : { ok: true, id: data.id })
} else if (cmd === 'vergeet') {
  const { data, error } = await sb.from('business_os_geheugen')
    .update({ actief: false, updated_at: new Date().toISOString() }).eq('id', arg).select('id')
  uit(error ? { fout: error.message } : { ok: !!data?.length })
} else if (cmd === 'geheugen') {
  const { data, error } = await sb.from('business_os_geheugen').select('id, soort, tekst, bron, created_at')
    .eq('actief', true).order('soort').order('created_at')
  uit(error ? { fout: error.message } : data)
} else {
  uit({ fout: `Onbekend commando: ${cmd}` })
}
