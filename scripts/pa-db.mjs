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
//   node scripts/pa-db.mjs experiment '{"titel","hypothese","actie","meetpunt","nulmeting"?,"eind_dag"?}'  nieuw experiment
//   node scripts/pa-db.mjs experiment-bij '{"id","status"?,"uitkomst"?,"eind_dag"?}'  bijwerken/afsluiten
//   node scripts/pa-db.mjs experimenten              lopende + laatste 10 afgeronde
//   node scripts/pa-db.mjs project-nieuw '{"titel","doel"}'   project + onderzoeksronde op de Mac
//   node scripts/pa-db.mjs project-bij '{"id","status"?,"onderzoek"?,"plan"?,"kpis"?}'
//   node scripts/pa-db.mjs projecten                 alle projecten (kort)
//   node scripts/pa-db.mjs project "<id>"            één project volledig
//   node scripts/pa-db.mjs stap '{"project_id","stap_id","klaar":true}'
//   node scripts/pa-db.mjs bijlage <storage-pad>      chatbijlage → ~/Downloads/Business OS bijlagen/, print lokaal pad
//
// Datawijzigingen kunnen hier niet: die gaan als voorstel terug naar de chat
// en pas Kerstens klik op Toestaan voert ze uit.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
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

// Minimale .xlsx → csv (zip lezen met zlib, sharedStrings + werkbladen).
// Geeft [[bladnummer, csvTekst], …]. Formules: de opgeslagen waarde.
function xlsxNaarCsv(buf) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  if (eocd < 0) throw new Error('geen geldig xlsx-bestand')
  const bestanden = {}
  let p = buf.readUInt32LE(eocd + 16)
  for (let i = 0; i < buf.readUInt16LE(eocd + 10); i++) {
    const methode = buf.readUInt16LE(p + 10), grootte = buf.readUInt32LE(p + 20)
    const nLen = buf.readUInt16LE(p + 28), xLen = buf.readUInt16LE(p + 30), cLen = buf.readUInt16LE(p + 32)
    const naam = buf.toString('utf8', p + 46, p + 46 + nLen)
    const lh = buf.readUInt32LE(p + 42)
    const start = lh + 30 + buf.readUInt16LE(lh + 26) + buf.readUInt16LE(lh + 28)
    const ruw = buf.subarray(start, start + grootte)
    if (/^xl\/(sharedStrings|worksheets\/sheet\d+)\.xml$/.test(naam)) {
      bestanden[naam] = (methode === 8 ? zlib.inflateRawSync(ruw) : ruw).toString('utf8')
    }
    p += 46 + nLen + xLen + cLen
  }
  const ent = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
  const teksten = [...(bestanden['xl/sharedStrings.xml'] || '').matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map(m => ent([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]).join('')))
  const kolom = (ref) => [...ref.replace(/\d+/g, '')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1
  const cel = (v) => /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
  return Object.keys(bestanden).filter(n => n.includes('worksheets/'))
    .map(n => [Number(n.match(/sheet(\d+)/)[1]), bestanden[n]]).sort((a, b) => a[0] - b[0])
    .map(([nr, xml]) => [nr, [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map(r => {
      const rij = []
      for (const c of r[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = c[1].match(/r="([A-Z]+\d+)"/)?.[1], type = c[1].match(/t="(\w+)"/)?.[1]
        const v = c[2]?.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? c[2]?.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? ''
        rij[ref ? kolom(ref) : rij.length] = cel(type === 's' ? (teksten[Number(v)] ?? '') : ent(v))
      }
      return Array.from(rij, x => x ?? '').join(',')
    }).join('\n')])
}

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
} else if (cmd === 'bijlage') {
  // Bijlage uit de chat ([bijlage]-regel) met Kerstens rechten ophalen naar
  // ~/Downloads/Business OS bijlagen/ (originele naam, nooit overschrijven) en
  // het lokale pad teruggeven. Kopieën ouder dan 7 dagen gaan eerst weg (de
  // bucket ruimt zichzelf op via pg_cron). Geen inhoud in de uitvoer.
  const BUCKET = 'business-os-bijlagen'
  const doel = path.join(os.homedir(), 'Downloads', 'Business OS bijlagen')
  fs.mkdirSync(doel, { recursive: true })
  for (const f of fs.readdirSync(doel)) {
    const p = path.join(doel, f)
    try { if (fs.statSync(p).isFile() && Date.now() - fs.statSync(p).mtimeMs > 7 * 864e5) fs.unlinkSync(p) } catch { /* laat staan */ }
  }
  const pad = arg.trim().replace(new RegExp(`^${BUCKET}/`), '')
  if (!pad || pad.includes('..')) { uit({ fout: 'Gebruik: bijlage <business-os-bijlagen/<uid>/<bestand>>' }); process.exit(1) }
  const { data, error } = await sb.storage.from(BUCKET).download(pad)
  if (error) { uit({ fout: `Downloaden mislukt: ${error.message || 'onbekend'}` }); process.exit(1) }
  // <uuid>-<naam> → <naam>; bestaat hij al, dan "naam (2).ext".
  const naam = path.basename(pad).replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, '') || 'bijlage'
  const ext = path.extname(naam)
  let lokaal = path.join(doel, naam)
  for (let i = 2; fs.existsSync(lokaal); i++) lokaal = path.join(doel, `${path.basename(naam, ext)} (${i})${ext}`)
  const buf = Buffer.from(await data.arrayBuffer())
  fs.writeFileSync(lokaal, buf, { flag: 'wx' })
  // Excel (.xlsx) kan Read niet openen: elk werkblad ook als csv ernaast.
  const leesbaar = []
  if (ext.toLowerCase() === '.xlsx') {
    try {
      for (const [blad, tekst] of xlsxNaarCsv(buf)) {
        const p = lokaal.replace(/\.xlsx$/i, `${blad > 1 ? ` blad${blad}` : ''}.csv`)
        if (!fs.existsSync(p)) fs.writeFileSync(p, tekst, { flag: 'wx' })
        leesbaar.push(p)
      }
    } catch (e) { leesbaar.push(`(omzetten mislukt: ${e.message})`) }
  }
  // iPhone-foto (.heic): Read toont alleen jpg/png, dus via macOS sips een jpg ernaast.
  if (/^\.hei[cf]$/i.test(ext)) {
    const jpg = lokaal.replace(/\.hei[cf]$/i, '.jpg')
    try {
      if (!fs.existsSync(jpg)) execFileSync('sips', ['-s', 'format', 'jpeg', lokaal, '--out', jpg], { stdio: 'ignore' })
      leesbaar.push(jpg)
    } catch { /* dan alleen het origineel */ }
  }
  uit({ ok: true, pad: lokaal, bytes: data.size, ...(leesbaar.length ? { leesbaar } : {}) })
} else if (cmd === 'project-nieuw') {
  // Project: eerst onderzoek (aparte Slim-ronde op de Mac), dan een plan.
  let pr
  try { pr = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const titel = String(pr.titel || '').trim().slice(0, 160), doel = String(pr.doel || '').trim().slice(0, 1000)
  if (!titel || !doel) { uit({ fout: 'titel en doel zijn verplicht' }); process.exit(1) }
  const { data: { user } } = await sb.auth.getUser(token)
  const { data, error } = await sb.from('business_os_projecten').insert({ titel, doel }).select('id').single()
  if (error) { uit({ fout: error.message }); process.exit(1) }
  const { error: e2 } = await sb.from('business_os_opdrachten').insert({
    coach_id: user.id, soort: 'groei', opdracht: `Strategie · project: ${titel}`.slice(0, 200), invoer: { ronde: 'project', project_id: data.id },
  })
  uit(e2 ? { fout: e2.message, id: data.id } : { ok: true, id: data.id, onderzoek: 'gestart' })
} else if (cmd === 'project-bij') {
  let pr
  try { pr = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const velden = { updated_at: new Date().toISOString() }
  if (['onderzoek', 'plan', 'uitvoering', 'klaar', 'gestopt'].includes(pr.status)) velden.status = pr.status
  if (typeof pr.onderzoek === 'string') velden.onderzoek = pr.onderzoek.slice(0, 30000)
  if (pr.plan && typeof pr.plan === 'object') {
    // Elke stap een vaste id, zodat afvinken en inplannen hem terugvinden.
    let n = 0
    for (const f of pr.plan.fases || []) for (const st of f.stappen || []) { st.id ||= `s${Date.now().toString(36)}${n++}`; st.klaar = !!st.klaar }
    velden.plan = pr.plan
  }
  if (Array.isArray(pr.kpis)) velden.kpis = pr.kpis
  const { data, error } = await sb.from('business_os_projecten').update(velden).eq('id', pr.id).select('id')
  uit(error ? { fout: error.message } : { ok: !!data?.length })
} else if (cmd === 'projecten') {
  const { data, error } = await sb.from('business_os_projecten').select('id, titel, doel, status, plan, kpis, updated_at').order('updated_at', { ascending: false }).limit(20)
  uit(error ? { fout: error.message } : (data || []).map(p => {
    const stappen = (p.plan?.fases || []).flatMap(f => f.stappen || [])
    const vandaag = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
    return { id: p.id, titel: p.titel, status: p.status, klaar: stappen.filter(s => s.klaar).length, totaal: stappen.length,
      vandaag: stappen.filter(s => s.dag === vandaag), achter: stappen.filter(s => !s.klaar && s.dag && s.dag < vandaag).length, kpis: p.kpis }
  }))
} else if (cmd === 'project') {
  const { data, error } = await sb.from('business_os_projecten').select('*').eq('id', arg).maybeSingle()
  uit(error ? { fout: error.message } : data)
} else if (cmd === 'stap') {
  let st
  try { st = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const { data: p } = await sb.from('business_os_projecten').select('plan').eq('id', st.project_id).maybeSingle()
  if (!p) { uit({ fout: 'project niet gevonden' }); process.exit(1) }
  let gevonden = false
  for (const f of p.plan?.fases || []) for (const s of f.stappen || []) if (s.id === st.stap_id) { s.klaar = !!st.klaar; gevonden = true }
  const { error } = await sb.from('business_os_projecten').update({ plan: p.plan, updated_at: new Date().toISOString() }).eq('id', st.project_id)
  uit(error ? { fout: error.message } : { ok: gevonden })
} else if (cmd === 'experiment') {
  // Strategie zet zelf proeven op: wat doen we, wat verwachten we, hoe meten we.
  let e
  try { e = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const rij = {
    titel: String(e.titel || '').trim().slice(0, 160), hypothese: String(e.hypothese || '').trim().slice(0, 600),
    actie: String(e.actie || '').trim().slice(0, 600), meetpunt: String(e.meetpunt || '').trim().slice(0, 600),
    nulmeting: e.nulmeting ? String(e.nulmeting).slice(0, 600) : null,
    eind_dag: /^\d{4}-\d{2}-\d{2}$/.test(e.eind_dag || '') ? e.eind_dag : null,
  }
  if (!rij.titel || !rij.hypothese || !rij.actie || !rij.meetpunt) { uit({ fout: 'titel, hypothese, actie en meetpunt zijn verplicht' }); process.exit(1) }
  const { data, error } = await sb.from('business_os_experimenten').insert(rij).select('id').single()
  uit(error ? { fout: error.message } : { ok: true, id: data.id })
} else if (cmd === 'experiment-bij') {
  let e
  try { e = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const velden = { updated_at: new Date().toISOString() }
  if (['loopt', 'geslaagd', 'mislukt', 'gestopt'].includes(e.status)) velden.status = e.status
  if (e.uitkomst) velden.uitkomst = String(e.uitkomst).slice(0, 1200)
  if (/^\d{4}-\d{2}-\d{2}$/.test(e.eind_dag || '')) velden.eind_dag = e.eind_dag
  const { data, error } = await sb.from('business_os_experimenten').update(velden).eq('id', e.id).select('id')
  uit(error ? { fout: error.message } : { ok: !!data?.length })
} else if (cmd === 'experimenten') {
  const [l, a] = await Promise.all([
    sb.from('business_os_experimenten').select('*').eq('status', 'loopt').order('start_dag'),
    sb.from('business_os_experimenten').select('id, titel, status, uitkomst, start_dag, eind_dag').neq('status', 'loopt').order('updated_at', { ascending: false }).limit(10),
  ])
  uit(l.error || a.error ? { fout: (l.error || a.error).message } : { lopend: l.data, afgerond: a.data })
} else {
  uit({ fout: `Onbekend commando: ${cmd}` })
}
