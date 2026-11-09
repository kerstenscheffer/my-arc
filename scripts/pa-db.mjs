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
//   node scripts/pa-db.mjs project-leeg '{"titel","doel","plan"?,"kpis"?}'   project met status uitvoering, ZONDER onderzoeksronde
//     (project-nieuw start er wel een, en die overschrijft het plan). Stappen krijgen een id zoals bij project-bij.
//   node scripts/pa-db.mjs project-fase-weg '{"project_id","fases":["naam"]}'   leest het plan vlak ervoor opnieuw en haalt alleen
//     die fases eruit. Staat een naam er niet in, dan verandert er niets.
//   node scripts/pa-db.mjs project-bij '{"id","status"?,"onderzoek"?,"plan"?,"kpis"?,"doel"? (max 1000 tekens)}'
//     plan.fases[].test (optioneel, maakt van de rij een test met live cijfers):
//       { woorden: ["LIDL"], van: "YYYY-MM-DD", tot?: "YYYY-MM-DD", ig_ids?: ["…"], nulmeting_per_10?: getal,
//         waarom?, hoe?, hoeveel?, verwachting?, meetdatum? }  lege tekstvelden tonen als open
//     plan.fases[].bord: true maakt van de fase een test met kanban (TestBord.jsx, regels in testBord.js).
//       stappen[].kolom: onderzoek | plan | maken | posten | meten | besluit (geen kolom = onderzoek)
//       stappen[].wie (optioneel): kersten | gino. stappen[].notitie (optioneel): tekst, mag meerdere regels.
//         Alleen zichtbaar op het bord. Tellen nergens mee (bordStand, klaar-regels, meting).
//       stappen[].vast (optioneel): true = de takenronde kreeg de kaart niet af, reden staat in notitie. Oranje label Vast op het bord.
//         Veld weghalen (kaart met "vast":null) en de kaart doet weer mee.
//       stappen[].voorstel (optioneel): true = Gino bedacht de kaart, Kersten bevestigde nog niet. Stippelrand + label Voorstel
//         op het bord; nooit de witte rand; in de timerkeuze gedimd onderaan. Kersten tikt het label weg = bevestigd (veld weg).
//       test erbij: wat, controlegroep, posts_doel (getal), besluit (meer|aanpassen|stoppen), les
//       test mag leeg {} zijn; zonder test.van is de test niet gestart (Posten en Meten: Nog geen data)
//       test.suggesties (optioneel): { wat?, nulmeting_per_10? (getal), controlegroep?, posts_doel? (getal), verwachting?,
//         meetdatum? (YYYY-MM-DD), besluit? (meer|aanpassen|stoppen), les? }
//         Grijs met knop Overnemen, alleen bij een leeg echt veld. Telt nergens mee (bordStand, x van 6, klaar-regels, meting):
//         pas na Overnemen of zelf invullen staat de waarde in het echte veld.
//   node scripts/pa-db.mjs projecten                 alle projecten (kort)
//   node scripts/pa-db.mjs project "<id>"            één project volledig
//   node scripts/pa-db.mjs stap '{"project_id","stap_id","klaar":true}'
//   node scripts/pa-db.mjs kaart '{"project_id","stap_id","klaar"?,"vast"? (true|null),"notitie"? (komt onder de bestaande)}'
//     leest het plan vlak ervoor opnieuw en wijzigt alleen die kaart
//   node scripts/pa-db.mjs taken-droog [YYYY-MM-DD]  welke kaarten de takenronde zou pakken en waarom andere niet; voert niets uit
//     Takenronde (business-os-pa.mjs, planTaken): elke 30 min een rij soort groei met invoer.ronde = taken en invoer.kaarten,
//     alleen als er geen loopt en er kaarten zijn. Regels: scripts/takenronde.mjs. Open kaart van wie gino, dag vandaag of eerder,
//     zonder vast, geen open kaart van wie kersten met een eerdere dag in dezelfde fase; max 3 per ronde.
//   node scripts/pa-db.mjs statscheck-droog [YYYY-MM-DD]  uitkomst van de vaste query's van de wekelijkse statscheck (statscheck.mjs); leest alleen
//   node scripts/pa-db.mjs tijd [van] [tot]          Kerstens gemeten tijd per dag/categorie/uur + grootste bronnen (standaard laatste 7 dagen)
//   node scripts/pa-db.mjs tijd-regel '{"patroon","categorie"}'   indeling bijsturen (app, domein, #tab of titel bevat patroon); werkt terug in de tijd
//   node scripts/pa-db.mjs tijd-regel-weg "patroon"
//   node scripts/pa-db.mjs bijlage <storage-pad>      chatbijlage → ~/Downloads/Business OS bijlagen/, print lokaal pad
//
//   node scripts/pa-db.mjs wijziging-test            test van de bewaakte lijst + Ongedaan maken (eigen testrij, ruimt zichzelf op)
//
// Datawijzigingen kunnen hier niet: die gaan als actie terug naar de PA, die ze
// via business_os_wijziging_uitvoeren laat lopen (controleert de bewaakte lijst).

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { createClient } from '@supabase/supabase-js'
import { kiesTaken, leesLopendeProjecten, vandaagNL, wijzigKaart } from './takenronde.mjs'
import { statscheckQueries, statscheckWeek } from './statscheck.mjs'
import { maandagVan } from '../src/modules/business-os/nieuweMannenData.js'
import { schrijfPlan } from '../src/modules/business-os/projectStappen.js'

const MAP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const env = Object.fromEntries(
  fs.readFileSync(path.join(MAP, '.env.local'), 'utf8').split('\n')
    .map(r => r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^['"]|['"]$/g, '')])
)
const TIJD_CATEGORIEEN = ['sales', 'calls', 'coaching', 'content', 'bouwen', 'admin', 'social', 'afleiding', 'overig']
// Elke stap een vaste id, zodat afvinken en inplannen hem terugvinden.
function stappenMetId(plan) {
  let n = 0
  for (const f of plan.fases || []) for (const st of f.stappen || []) { st.id ||= `s${Date.now().toString(36)}${n++}`; st.klaar = !!st.klaar }
}
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
} else if (cmd === 'project-leeg') {
  // Project zonder onderzoeksronde: het plan staat er al en blijft staan.
  let pr
  try { pr = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const titel = String(pr.titel || '').trim().slice(0, 160), doel = String(pr.doel || '').trim().slice(0, 1000)
  if (!titel || !doel) { uit({ fout: 'titel en doel zijn verplicht' }); process.exit(1) }
  const plan = pr.plan ?? { fases: [] }, kpis = pr.kpis ?? []
  if (typeof plan !== 'object' || Array.isArray(plan) || !Array.isArray(kpis)) { uit({ fout: 'plan moet een object zijn en kpis een lijst' }); process.exit(1) }
  stappenMetId(plan)
  const { data, error } = await sb.from('business_os_projecten').insert({ titel, doel, status: 'uitvoering', plan, kpis }).select('id').single()
  uit(error ? { fout: error.message } : { ok: true, id: data.id })
} else if (cmd === 'project-fase-weg') {
  let w
  try { w = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const namen = Array.isArray(w.fases) ? w.fases : []
  if (!w.project_id || !namen.length) { uit({ fout: 'project_id en fases zijn verplicht' }); process.exit(1) }
  const { ok, plan } = await schrijfPlan(sb, w.project_id, (p) => {
    const fases = p.fases || []
    if (!namen.every(n => fases.some(f => f.naam === n))) return false
    p.fases = fases.filter(f => !namen.includes(f.naam))
    return true
  })
  uit(ok ? { ok: true, fases: plan.fases.map(f => f.naam) } : { fout: 'Niets gewijzigd: fase niet gevonden of opslaan mislukt' })
} else if (cmd === 'project-bij') {
  let pr
  try { pr = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const velden = { updated_at: new Date().toISOString() }
  if (['onderzoek', 'plan', 'uitvoering', 'klaar', 'gestopt'].includes(pr.status)) velden.status = pr.status
  if (typeof pr.onderzoek === 'string') velden.onderzoek = pr.onderzoek.slice(0, 30000)
  if (pr.plan && typeof pr.plan === 'object') {
    stappenMetId(pr.plan)
    velden.plan = pr.plan
  }
  if (Array.isArray(pr.kpis)) velden.kpis = pr.kpis
  if (typeof pr.doel === 'string' && pr.doel.trim()) velden.doel = pr.doel.trim().slice(0, 1000)
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
} else if (cmd === 'kaart') {
  let k
  try { k = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  if (!k.project_id || !k.stap_id) { uit({ fout: 'project_id en stap_id zijn verplicht' }); process.exit(1) }
  const { ok, gevonden } = await wijzigKaart(sb, k.project_id, k.stap_id, k)
  uit(ok ? { ok: true } : { fout: gevonden ? 'Opslaan mislukt, plan veranderde steeds' : 'Kaart niet gevonden' })
} else if (cmd === 'taken-droog') {
  const vandaag = arg || vandaagNL()
  const { data, error } = await leesLopendeProjecten(sb)
  if (error) { uit({ fout: error.message }); process.exit(1) }
  uit({ vandaag, ...kiesTaken(data, vandaag) })
} else if (cmd === 'statscheck-droog') {
  // Dezelfde vaste query's als de wekelijkse ronde (statscheck.mjs); leest alleen, zet geen herinnering.
  const maandag = maandagVan(/^\d{4}-\d{2}-\d{2}$/.test(arg) ? arg : vandaagNL())
  // Wanneer de ronde start: maandag 07:00 NL of later, winter- en zomertijd.
  const planning = Object.fromEntries(['2026-11-09T05:59:00Z', '2026-11-09T06:00:00Z', '2026-11-09T22:59:00Z', '2026-11-09T23:00:00Z', '2026-11-08T12:00:00Z', '2026-06-01T04:59:00Z', '2026-06-01T05:00:00Z'].map(t => [t, statscheckWeek(Date.parse(t))]))
  const res = { maandag, ronde_nu: statscheckWeek(), planning }
  for (const [naam, p_sql] of Object.entries(statscheckQueries(maandag))) {
    const { data, error } = await sb.rpc('business_os_lees', { p_sql })
    res[naam] = error ? { fout: error.message } : data
  }
  uit(res)
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
} else if (cmd === 'tijd') {
  // Tijdmeter (scripts/gino-tijd.mjs): minuten achter de Mac, ingedeeld.
  const dag = (d) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
  const van = /^\d{4}-\d{2}-\d{2}$/.test(arg || '') ? arg : dag(new Date(Date.now() - 6 * 864e5))
  const tot = /^\d{4}-\d{2}-\d{2}$/.test(process.argv[4] || '') ? process.argv[4] : dag(new Date())
  const [o, r] = await Promise.all([
    sb.rpc('business_os_tijd_overzicht', { van, tot }),
    sb.from('business_os_tijd_regels').select('patroon, categorie, bron').order('categorie'),
  ])
  uit(o.error ? { fout: o.error.message } : { van, tot, categorieen: TIJD_CATEGORIEEN, ...o.data, regels: r.data || [] })
} else if (cmd === 'tijd-regel') {
  let t
  try { t = JSON.parse(arg) } catch { uit({ fout: 'Geen geldige JSON' }); process.exit(1) }
  const patroon = String(t.patroon || '').trim().toLowerCase().slice(0, 80)
  if (patroon.length < 3 || !TIJD_CATEGORIEEN.includes(t.categorie)) { uit({ fout: `patroon (min. 3 tekens) en categorie (${TIJD_CATEGORIEEN.join('|')}) verplicht` }); process.exit(1) }
  const { error } = await sb.from('business_os_tijd_regels')
    .upsert({ patroon, categorie: t.categorie, bron: t.bron === 'kersten' ? 'kersten' : 'gino' }, { onConflict: 'coach_id,patroon' })
  uit(error ? { fout: error.message } : { ok: true })
} else if (cmd === 'tijd-regel-weg') {
  const { data, error } = await sb.from('business_os_tijd_regels').delete().eq('patroon', String(arg || '').toLowerCase()).select('id')
  uit(error ? { fout: error.message } : { ok: !!data?.length })
} else if (cmd === 'wijziging-test') {
  // Alles zonder bevestigd: dit is de route van de PA, dus zonder klik. Bewaakte
  // proeven gebruiken een onmogelijk id en een rij die de database toch weigert,
  // zodat er ook bij een fout in de poort geen klant iets krijgt.
  const { data: { user } } = await sb.auth.getUser(token)
  const NIEMAND = '00000000-0000-0000-0000-000000000000'
  const voer = (p_voorstel) => sb.rpc('business_os_wijziging_uitvoeren', { p_voorstel }).then(r => r.error ? { status: 'rpc-fout', fout: r.error.message } : r.data)
  const op_id = [{ kolom: 'id', op: 'eq', waarde: NIEMAND }]
  const telMeldingen = async () => (await sb.from('notifications').select('id', { count: 'exact', head: true })).count
  const meldingenVoor = await telMeldingen()
  const uitslag = {}
  const proef = (naam, ok, r) => { uitslag[naam] = { ok, ...r } }
  // 1. Gewone wijziging: direct, in het log, Ongedaan maken.
  const titel = 'TEST Gino wijziging (mag weg)'
  const nieuw = await voer({ actie: 'insert', tabel: 'productivity_tasks', uitleg: 'TEST', rijen: [{ coach_id: user.id, title: titel, status: 'active' }] })
  proef('insert gaat direct', nieuw.status === 'uitgevoerd', nieuw)
  const id = nieuw.status === 'uitgevoerd'
    ? (await sb.from('business_os_wijzigingen').select('ingevoegde_ids').eq('id', nieuw.wijziging_id).single()).data?.ingevoegde_ids?.[0] : null
  proef('insert zegt dat terugdraaien niet netjes kan', !!nieuw.ongedaan_kan, { ongedaan_kan: nieuw.ongedaan_kan })
  if (id) {
    const upd = await voer({ actie: 'update', tabel: 'productivity_tasks', uitleg: 'TEST', filters: [{ kolom: 'id', op: 'eq', waarde: id }], velden: { title: `${titel} 2` } })
    proef('update gaat direct', upd.status === 'uitgevoerd' && upd.aantal === 1, upd)
    const { data: log } = await sb.from('business_os_wijzigingen').select('oude_waarden, nieuwe_waarden').eq('id', upd.wijziging_id).single()
    proef('log bevat oud en nieuw', log?.oude_waarden?.[0]?.waarden?.title === titel && log?.nieuwe_waarden?.[0]?.waarden?.title === `${titel} 2`, {})
    const terug = await sb.rpc('business_os_wijziging_ongedaan', { p_id: upd.wijziging_id })
    const { data: rij } = await sb.from('productivity_tasks').select('title').eq('id', id).single()
    proef('ongedaan zet oude waarde terug', terug.data?.status === 'ongedaan' && rij?.title === titel, { uitkomst: terug.data || terug.error?.message })
    const nogEens = await sb.rpc('business_os_wijziging_ongedaan', { p_id: upd.wijziging_id })
    proef('twee keer ongedaan doet niets', nogEens.data?.status === 'al_ongedaan', { uitkomst: nogEens.data })
    const { error: wegFout } = await sb.from('productivity_tasks').delete().eq('id', id)
    proef('testrij opgeruimd', !wegFout, { fout: wegFout?.message })
  }
  // 2. Bewaakt: nooit zonder klik.
  const bewaakt = {
    'clients.assigned_schema_id': { actie: 'update', tabel: 'clients', filters: op_id, velden: { assigned_schema_id: NIEMAND } },
    'clients.workout_schedule': { actie: 'update', tabel: 'clients', filters: op_id, velden: { workout_schedule: {} } },
    workout_schemas: { actie: 'update', tabel: 'workout_schemas', filters: op_id, velden: { name: 'TEST' } },
    client_meal_plans: { actie: 'update', tabel: 'client_meal_plans', filters: op_id, velden: { is_active: false } },
    client_day_overrides: { actie: 'update', tabel: 'client_day_overrides', filters: op_id, velden: { note: 'TEST' } },
    client_plan_proposals: { actie: 'update', tabel: 'client_plan_proposals', filters: op_id, velden: { status: 'TEST' } },
    notifications: { actie: 'insert', tabel: 'notifications', rijen: [{ client_id: NIEMAND, title: 'TEST' }] },
    notification_schedules: { actie: 'insert', tabel: 'notification_schedules', rijen: [{ coach_id: NIEMAND }] },
    business_os_opdrachten: { actie: 'insert', tabel: 'business_os_opdrachten', rijen: [{ opdracht: 'TEST' }] },
    'content_items.autopilot_status': { actie: 'update', tabel: 'content_items', filters: op_id, velden: { autopilot_status: 'goedgekeurd' } },
    'lead_movements sale': { actie: 'insert', tabel: 'lead_movements', rijen: [{ lead_id: NIEMAND, to_section_title: 'Sale' }] },
    'onbekende tabel': { actie: 'update', tabel: 'bestaat_niet', filters: op_id, velden: { a: 1 } },
    'gewone tabel, Gino vraagt zelf': { actie: 'update', tabel: 'productivity_tasks', toestemming: true, filters: op_id, velden: { title: 'TEST' } },
  }
  for (const [naam, v] of Object.entries(bewaakt)) {
    const r = await voer(v)
    proef(`bewaakt: ${naam}`, r.status === 'toestemming_nodig', r)
  }
  const meldingenNa = await telMeldingen()
  proef('geen melding erbij', meldingenVoor === meldingenNa, { voor: meldingenVoor, na: meldingenNa })
  // 3. Grenzen.
  const zonderFilter = await voer({ actie: 'update', tabel: 'productivity_tasks', velden: { title: 'TEST' } })
  proef('update zonder filter geweigerd', zonderFilter.status === 'fout', zonderFilter)
  const verwijder = await voer({ actie: 'delete', tabel: 'productivity_tasks', filters: op_id })
  proef('delete geweigerd', verwijder.status === 'fout', verwijder)
  // 4. Code-opdrachten: alleen de beoordeling, zodat de proef niets start.
  for (const [tekst, moet] of [
    ['Stuur alle klanten een push over de actie', true], ['Pas het schema van klant Jan aan', true], ['Zet live met npm run release', true],
    ['Publiceer deze reel live op Instagram', true], ['Doe een echte Stripe afschrijving', true], ['Maak de Business OS grafiek groen', false],
    // Ontkende zinnen (business-os-ontkenning.sql): geen knop.
    ['Geen meldingen naar klanten of leads.', false], ['geen meldingen naar klanten', false], ['nooit een bericht naar klanten', false], ['niets sturen naar leads', false],
    ['Geen melding, push, mail of bericht naar klanten.', false], ['Maak de grafiek groen. Geen meldingen naar klanten of leads. Alleen toevoegen in de database.', false],
    // Echte acties, ook naast of binnen een ontkenning: wel een knop.
    ['stuur alle klanten een pushmelding', true], ['Stuur alle leads een mail', true], ['Stuur alle klanten de nieuwe prijs', true],
    ['Geen meldingen naar klanten. Stuur daarna alle leads een mail.', true], ['Stuur alle klanten een push, geen mail', true], ['Geen melding maar een push naar alle klanten', true],
    ['Geen mail, push naar alle klanten', true], ['Geen meldingen naar klanten, behalve Jan', true], ['Geen meldingen naar klanten tenzij ze betaald hebben', true],
    ['Als een klant geen mail heeft gehad, stuur hem er een', true], ['Zorg dat klanten nooit een melding missen', true], ['Er gaan geen meldingen naar klanten. Repareer dat.', true],
  ]) {
    const { data } = await sb.rpc('business_os_opdracht_bewaakt', { p_tekst: tekst })
    proef(`code: ${tekst}`, !!data === moet, { reden: data })
  }
  const mis = Object.entries(uitslag).filter(([, r]) => !r.ok).map(([n]) => n)
  uit({ geslaagd: Object.keys(uitslag).length - mis.length, mislukt: mis, uitslag })
} else {
  uit({ fout: `Onbekend commando: ${cmd}` })
}
