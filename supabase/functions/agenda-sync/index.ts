// supabase/functions/agenda-sync/index.ts
//
// Google Agenda meelezen (30 okt 2026). Alleen lezen: haalt Kerstens geheime
// iCal-link (secret GOOGLE_AGENDA_ICS) op, rekent herhalende afspraken uit
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

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async () => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
  const url = (Deno.env.get('GOOGLE_AGENDA_ICS') || '').trim()
  const schoon = (t: string) => (url ? t.split(url).join('[ical-link]') : t)
    .replace(/https?:\/\/calendar\.google\.com\/\S*/gi, '[ical-link]')
    .slice(0, 1000)

  // Eén foutregel per melding per 6 uur, zodat de cron app_fouten niet volspamt.
  const fout = async (reden: string, detail = '') => {
    const melding = `agenda-sync: ${reden}${detail ? ` · ${schoon(detail)}` : ''}`
    const sinds = new Date(Date.now() - 6 * 3600e3).toISOString()
    const { data } = await sb.from('app_fouten').select('id')
      .eq('pagina', 'agenda-sync').eq('melding', melding).gte('created_at', sinds).limit(1)
      .then(r => r, () => ({ data: null }))
    if (!data?.length) {
      await sb.from('app_fouten').insert({ pagina: 'agenda-sync', melding, user_id: null })
        .then(r => r, () => null)
    }
    return json({ ok: false, reden })
  }

  if (!url) return fout('geen_sleutel')

  try {
    let tekst: string
    try {
      const r = await fetch(url, { headers: { Accept: 'text/calendar' } })
      if (!r.ok) return fout('feed_status', String(r.status))
      tekst = await r.text()
    } catch (e) {
      return fout('feed_onbereikbaar', String((e as Error)?.message || e))
    }
    if (!tekst.includes('BEGIN:VCALENDAR')) return fout('geen_ics')

    const vandaag = dagInTz(new Date())
    const van = tzNaarUtc(vandaag.y, vandaag.m, vandaag.d - DAGEN_TERUG, 0, 0, 0, TZ)
    const tot = tzNaarUtc(vandaag.y, vandaag.m, vandaag.d + DAGEN_VOORUIT + 1, 0, 0, 0, TZ)

    const { data: klanten } = await sb.from('clients').select('first_name')
      .eq('coach_id', COACH_ID)
      .then(r => r, () => ({ data: [] as { first_name: string | null }[] }))
    const namen = [...new Set((klanten || [])
      .map(k => (k.first_name || '').trim().toLowerCase())
      .filter(n => n.length >= 3))]

    const rijen = leesFeed(tekst, van, tot, namen)

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
    return json({ ok: true, aantal: lijst.length, verwijderd: weg.length, soorten, van: van.toISOString(), tot: tot.toISOString() })
  } catch (e) {
    return fout('onverwacht', String((e as Error)?.message || e))
  }
})

type Rij = {
  uid: string; start_at: string; end_at: string; hele_dag: boolean
  titel: string | null; locatie: string | null; beschrijving: string | null; soort: string
}

function soortVan(titel: string, namen: string[]) {
  const t = titel.toLowerCase()
  for (const [soort, woorden] of SOORTEN) if (woorden.some(w => t.includes(w))) return soort
  if (t.includes(CALL_WOORD) && namen.some(n => new RegExp(`(^|[^\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(t))) {
    return 'klantcall'
  }
  return 'overig'
}

function leesFeed(tekst: string, van: Date, tot: Date, namen: string[]): Rij[] {
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
    rijen.push({
      uid, start_at: start.toISOString(), end_at: eind.toISOString(), hele_dag: heleDag,
      titel, locatie: item.location || null,
      beschrijving: item.description ? String(item.description).slice(0, 4000) : null,
      soort: soortVan(titel || '', namen),
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
