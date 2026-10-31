// supabase/functions/agenda-sync/index.ts
//
// Google Agenda meelezen (30 okt 2026). Alleen lezen: haalt Kerstens geheime
// iCal-link (secret GOOGLE_AGENDA_ICS of een andere agenda-naam, zie
// zoekSleutel) op, rekent herhalende afspraken uit
// (RRULE, EXDATE, gewijzigde instanties via RECURRENCE-ID) en zet alles van
// 7 dagen terug t/m 30 dagen vooruit in agenda_events (UTC). Afspraken die
// niet meer in de feed staan verdwijnen uit dat venster. Er gaat niets terug
// naar Google. pg_cron roept dit elke 15 minuten aan (agenda-sync.sql).
//
// De iCal-link is een sleutel: nooit loggen, ook niet in app_fouten.

import ICAL from 'https://esm.sh/ical.js@2.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

// ical.js-objecten (esm.sh levert geen types mee)
// deno-lint-ignore no-explicit-any
type IcalAny = any

const COACH_ID = '5a0135ac-3188-499d-8682-ed6a179e5541' // Kersten
const TZ = 'Europe/Amsterdam'
const DAGEN_TERUG = 7
const DAGEN_VOORUIT = 30

// Soort uit de titel (hoofdletterongevoelig). Eerste treffer wint.
const SOORTEN: [string, string[]][] = [
  ['paviljoen', ['paviljoen']],
  ['salescall', ['sales', 'kennismaking', 'strategie']],
  ['opstartcall', ['opstart', 'intake']],
  ['klantcall', ['evaluatie', 'check']],
]
// 'call' telt als klantcall als er ook een klantnaam in de titel staat.
const CALL_WOORD = 'call'
// Calendly/Zoom-boekingen: '<naam> en Kersten Scheffer' (ook 'and', of
// andersom). Klant van het team → klantcall, anders salescall. Een titel die
// met 'Geannuleerd:' begint is geen call.
const EIGEN_NAAM = 'kersten\\s+scheffer'
const CONTACT_PATRONEN = [
  new RegExp(`^\\s*(.+?)\\s+(?:en|and|&)\\s+${EIGEN_NAAM}\\s*$`, 'i'),
  new RegExp(`^\\s*${EIGEN_NAAM}\\s+(?:en|and|&)\\s+(.+?)\\s*$`, 'i'),
]
const GEANNULEERD = /^\s*(geannuleerd|cancell?ed|afgezegd)\b/i

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async () => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
  const { url, naam: sleutelNaam } = zoekSleutel()
  const schoon = (t: string) => (url ? t.split(url).join('[ical-link]') : t)
    .replace(/https?:\/\/\S*(calendar\.google\.com|\.ics)\S*/gi, '[ical-link]')
    .slice(0, 1000)

  // geen_sleutel max één keer per 6 uur (anders spamt de cron app_fouten vol);
  // echte fouten (feed, parse, opslaan) gaan er altijd direct in.
  const fout = async (reden: string, detail = '') => {
    const melding = `agenda-sync: ${reden}${detail ? ` · ${schoon(detail)}` : ''}`
    if (reden === 'geen_sleutel') {
      const sinds = new Date(Date.now() - 6 * 3600e3).toISOString()
      const { data } = await sb.from('app_fouten').select('id')
        .eq('pagina', 'agenda-sync').eq('melding', melding).gte('created_at', sinds).limit(1)
        .then(r => r, () => ({ data: null }))
      if (data?.length) return json({ ok: false, reden })
    }
    await sb.from('app_fouten').insert({ pagina: 'agenda-sync', melding, user_id: null })
      .then(r => r, () => null)
    return json({ ok: false, reden })
  }

  if (!url) return fout('geen_sleutel')

  try {
    let tekst: string
    try {
      const r = await fetch(url, { headers: { Accept: 'text/calendar' } })
      if (!r.ok) return fout(`feed_fout ${r.status}`)
      tekst = await r.text()
    } catch {
      // De foutmelding van fetch kan de link bevatten: niet meesturen.
      return fout('feed_fout onbereikbaar')
    }
    if (!tekst.includes('BEGIN:VCALENDAR')) return fout('feed_fout geen_ics')

    const vandaag = dagInTz(new Date())
    const van = tzNaarUtc(vandaag.y, vandaag.m, vandaag.d - DAGEN_TERUG, 0, 0, 0, TZ)
    const tot = tzNaarUtc(vandaag.y, vandaag.m, vandaag.d + DAGEN_VOORUIT + 1, 0, 0, 0, TZ)

    const { data: klanten } = await sb.from('clients').select('first_name')
      .eq('coach_id', COACH_ID)
      .then(r => r, () => ({ data: [] as { first_name: string | null }[] }))
    const namen = [...new Set((klanten || [])
      .map(k => (k.first_name || '').trim().toLowerCase())
      .filter(n => n.length >= 3))]
    const teamKlanten = await laadTeamKlanten(sb)

    let rijen: Rij[]
    try {
      rijen = leesFeed(tekst, van, tot, namen, teamKlanten)
    } catch (e) {
      return fout('parse_fout', String((e as Error)?.message || e))
    }

    // Dubbele sleutels (zou niet mogen, maar dan faalt de hele upsert).
    const uniek = new Map<string, Rij>()
    for (const r of rijen) uniek.set(`${r.uid}|${r.start_at}`, r)
    const lijst = [...uniek.values()]

    const nu = new Date().toISOString()
    for (let i = 0; i < lijst.length; i += 500) {
      const { error } = await sb.from('agenda_events')
        .upsert(lijst.slice(i, i + 500).map(r => ({ ...r, coach_id: COACH_ID, bron: 'google_ics', bijgewerkt_at: nu })),
          { onConflict: 'coach_id,uid,start_at' })
      if (error) return fout('opslaan', error.message)
    }

    // Opruimen: rijen in het venster die niet meer in de feed staan.
    const { data: bestaand, error: leesFout } = await sb.from('agenda_events')
      .select('id, uid, start_at')
      .eq('coach_id', COACH_ID).eq('bron', 'google_ics')
      .lt('start_at', tot.toISOString()).gte('end_at', van.toISOString())
    if (leesFout) return fout('opruimen', leesFout.message)
    const weg = (bestaand || [])
      .filter(b => !uniek.has(`${b.uid}|${new Date(b.start_at).toISOString()}`))
      .map(b => b.id)
    for (let i = 0; i < weg.length; i += 200) {
      await sb.from('agenda_events').delete().in('id', weg.slice(i, i + 200))
    }

    const soorten: Record<string, number> = {}
    for (const r of lijst) soorten[r.soort] = (soorten[r.soort] || 0) + 1
    return json({ ok: true, sleutel: sleutelNaam, aantal: lijst.length, verwijderd: weg.length, soorten, van: van.toISOString(), tot: tot.toISOString() })
  } catch (e) {
    return fout('onverwacht', String((e as Error)?.message || e))
  }
})

// Sleutel: eerst GOOGLE_AGENDA_ICS, anders de eerste env-variabele met
// CALENDAR/CALANDER/AGENDA/ICAL/ICS in de naam (hoofdletters, spaties en
// streepjes genegeerd) waarvan de waarde een https-iCal-link is.
const SLEUTEL_WOORDEN = ['CALENDAR', 'CALANDER', 'AGENDA', 'ICAL', 'ICS']
function geldigeLink(v: string) {
  const s = v.trim()
  return /^https:\/\//i.test(s) && /calendar\.google\.com|\.ics/i.test(s)
}
// Geeft ook de naam terug (nooit de waarde) voor de respons.
function zoekSleutel(): { url: string; naam: string | null } {
  const vast = (Deno.env.get('GOOGLE_AGENDA_ICS') || '').trim()
  if (vast && geldigeLink(vast)) return { url: vast, naam: 'GOOGLE_AGENDA_ICS' }
  const alles = Deno.env.toObject()
  for (const naam of Object.keys(alles).sort()) {
    const n = naam.toUpperCase().replace(/[\s_-]/g, '')
    if (!SLEUTEL_WOORDEN.some(w => n.includes(w))) continue
    if (geldigeLink(alles[naam] || '')) return { url: alles[naam].trim(), naam }
  }
  return { url: '', naam: null }
}

type Rij = {
  uid: string; start_at: string; end_at: string; hele_dag: boolean
  titel: string | null; locatie: string | null; beschrijving: string | null; soort: string
  contact_naam: string | null
}

// Naam van een klant van het team, genormaliseerd voor de fuzzy match.
type KlantNaam = { voor: string; achterLetter: string; plat: string }
// Actieve/gepauzeerde klant op voornaam (spaties/streepjes weg) → volledige naam.
type Voornaam = { plat: string; naam: string }
type TeamKlanten = { namen: KlantNaam[]; voornamen: Voornaam[] }

function woorden(s: string) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean)
}
function klantNaam(voornaam: string | null, achternaam: string | null): KlantNaam | null {
  const w = woorden(`${voornaam || ''} ${achternaam || ''}`)
  if (!w.length) return null
  return { voor: w[0], achterLetter: w.length > 1 ? w[w.length - 1][0] : '', plat: w.join('').replace(/\d/g, '') }
}

// Klanten van het team (clients met coaching_status active/paused) plus leads
// met een sale (order_value > 0) of koppeling aan een client (Instagram-namen
// staan vaak alleen in call_leads). Op voornaam alleen de actieve klanten.
// deno-lint-ignore no-explicit-any
async function laadTeamKlanten(sb: any): Promise<TeamKlanten> {
  const leeg = () => ({ data: null })
  const { data: team } = await sb.rpc('team_coach_ids', { p_coach_id: COACH_ID }).then((r: IcalAny) => r, leeg)
  const coaches: string[] = Array.isArray(team) && team.length ? team : [COACH_ID]
  const { data: cl } = await sb.from('clients').select('first_name, last_name')
    .in('coach_id', coaches).in('coaching_status', ['active', 'paused']).then((r: IcalAny) => r, leeg)
  const actief = (cl || []) as { first_name: string | null; last_name: string | null }[]
  const voornamen = actief
    .map(k => ({
      plat: woorden(k.first_name || '').join('').replace(/\d/g, ''),
      naam: `${(k.first_name || '').trim()} ${(k.last_name || '').trim()}`.replace(/\s+/g, ' ').trim(),
    }))
    .filter(v => v.plat.length >= 2)
  const { data: mv } = await sb.from('lead_movements').select('lead_id')
    .in('coach_id', coaches).is('reverted_at', null).not('lead_id', 'is', null)
    .or('order_value.gt.0,client_id.not.is.null')
    .then((r: IcalAny) => r, leeg)
  const leadIds = [...new Set(((mv || []) as { lead_id: string }[]).map(m => m.lead_id))]
  const leads: { first_name: string | null; last_name: string | null }[] = []
  for (let i = 0; i < leadIds.length; i += 100) {
    const { data } = await sb.from('call_leads').select('first_name, last_name')
      .in('id', leadIds.slice(i, i + 100)).then((r: IcalAny) => r, leeg)
    leads.push(...(data || []))
  }
  const namen = [...actief, ...leads]
    .map(k => klantNaam(k.first_name, k.last_name))
    .filter((k): k is KlantNaam => !!k)
  return { namen, voornamen }
}

function contactUitTitel(titel: string) {
  if (GEANNULEERD.test(titel)) return null
  for (const p of CONTACT_PATRONEN) {
    const m = titel.match(p)
    if (m) return m[1].replace(/\s+/g, ' ').trim() || null
  }
  return null
}

// Eerst volledige naam of handle zonder cijfers gelijk, of voornaam + eerste
// letter achternaam; dan alleen de voornaam tegen de actieve klanten. Geeft de
// contactnaam terug (null = geen klant): één klant met die voornaam → diens
// volledige naam, meerdere → alleen de voornaam (niet gokken wie).
function klantContact(naam: string, klanten: TeamKlanten): string | null {
  const w = woorden(naam)
  if (!w.length) return null
  const plat = w.join('').replace(/\d/g, '')
  if (plat.length >= 3 && klanten.namen.some(k => k.plat === plat)) return naam
  if (w.length >= 2) {
    const letter = w[w.length - 1][0]
    if (klanten.namen.some(k => k.achterLetter && k.voor === w[0] && k.achterLetter === letter)) return naam
  }
  const treffers = [...new Set(klanten.voornamen.filter(v => v.plat === plat).map(v => v.naam))]
  if (treffers.length === 1) return treffers[0]
  if (treffers.length > 1) return naam
  return null
}

function soortVan(titel: string, namen: string[]) {
  const t = titel.toLowerCase()
  for (const [soort, woorden] of SOORTEN) if (woorden.some(w => t.includes(w))) return soort
  if (t.includes(CALL_WOORD) && namen.some(n => new RegExp(`(^|[^\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(t))) {
    return 'klantcall'
  }
  return 'overig'
}

function leesFeed(tekst: string, van: Date, tot: Date, namen: string[], klanten: TeamKlanten): Rij[] {
  const cal = new ICAL.Component(ICAL.parse(tekst))
  for (const tz of cal.getAllSubcomponents('vtimezone')) {
    try { ICAL.TimezoneService.register(tz) } catch { /* dubbele of kapotte zone */ }
  }
  const vevents = cal.getAllSubcomponents('vevent')
  const meesters = new Map<string, IcalAny>()
  const uitzonderingen: IcalAny[] = []
  for (const ve of vevents) {
    if (ve.hasProperty('recurrence-id')) uitzonderingen.push(ve)
    else {
      const ev = new ICAL.Event(ve)
      if (ev.uid) meesters.set(ev.uid, ev)
    }
  }
  for (const ve of uitzonderingen) {
    const ex = new ICAL.Event(ve)
    const m = meesters.get(ex.uid)
    if (m) m.relateException(ex)
  }

  const rijen: Rij[] = []
  const voeg = (uid: string, item: IcalAny, s: IcalAny, e: IcalAny | null) => {
    if (String(item.component.getFirstPropertyValue('status') || '').toUpperCase() === 'CANCELLED') return
    const heleDag = s.isDate
    const start = naarUtc(s)
    let eind = e ? naarUtc(e) : null
    if (!eind || eind < start) eind = heleDag ? new Date(start.getTime() + 864e5) : start
    if (start >= tot || eind <= van) return
    const titel = item.summary || null
    let contact = contactUitTitel(titel || '')
    let soort = soortVan(titel || '', namen)
    if (contact && soort === 'overig') {
      const klant = klantContact(contact, klanten)
      soort = klant ? 'klantcall' : 'salescall'
      if (klant) contact = klant
    }
    rijen.push({
      uid, start_at: start.toISOString(), end_at: eind.toISOString(), hele_dag: heleDag,
      titel, locatie: item.location || null,
      beschrijving: item.description ? String(item.description).slice(0, 4000) : null,
      soort, contact_naam: contact,
    })
  }

  // Ruime marge: een verplaatste instantie kan ver van haar oorspronkelijke dag staan.
  const grens = new Date(tot.getTime() + 60 * 864e5)
  for (const [uid, ev] of meesters) {
    if (!ev.startDate) continue
    if (!ev.isRecurring()) {
      voeg(uid, ev, ev.startDate, ev.endDate)
      continue
    }
    const it = ev.iterator()
    let n = 0
    for (let t = it.next(); t && n < 20000; t = it.next(), n++) {
      if (naarUtc(t) > grens) break
      const d = ev.getOccurrenceDetails(t)
      voeg(uid, d.item, d.startDate, d.endDate)
    }
  }
  // Losse uitzonderingen zonder meester in de feed.
  for (const ve of uitzonderingen) {
    const ex = new ICAL.Event(ve)
    if (!meesters.has(ex.uid)) voeg(ex.uid, ex, ex.startDate, ex.endDate)
  }
  return rijen
}

// ICAL.Time → UTC. Hele dagen en zwevende tijden gelden in Europe/Amsterdam;
// tijden met een IANA-zone rekenen we zelf om (werkt ook als de feed geen
// VTIMEZONE voor die zone meestuurt).
function naarUtc(t: IcalAny): Date {
  if (t.isDate) return tzNaarUtc(t.year, t.month, t.day, 0, 0, 0, TZ)
  const zone = t.zone?.tzid || t.timezone || ''
  if (zone === 'UTC' || zone === 'Z') return new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second))
  const iana = geldigeZone(zone) ? zone : (zone && zone !== 'floating' ? null : TZ)
  if (iana) return tzNaarUtc(t.year, t.month, t.day, t.hour, t.minute, t.second, iana)
  return t.toJSDate()
}

function geldigeZone(z: string) {
  if (!z || z === 'floating') return false
  try { new Intl.DateTimeFormat('en', { timeZone: z }); return true } catch { return false }
}

function delen(d: Date, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(d).map(x => [x.type, Number(x.value)]))
  return { y: p.year, m: p.month, d: p.day, h: p.hour, mi: p.minute, s: p.second }
}

function dagInTz(d: Date) {
  const p = delen(d, TZ)
  return { y: p.y, m: p.m, d: p.d }
}

// Wandkloktijd in zone tz → UTC (twee rondes voor de zomertijdovergang).
function tzNaarUtc(y: number, m: number, d: number, h: number, mi: number, s: number, tz: string): Date {
  const doel = Date.UTC(y, m - 1, d, h, mi, s)
  let gok = doel
  for (let i = 0; i < 2; i++) {
    const p = delen(new Date(gok), tz)
    const gezien = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s)
    gok += doel - gezien
  }
  return new Date(gok)
}
