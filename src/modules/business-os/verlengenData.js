// src/modules/business-os/verlengenData.js
//
// Data achter het overzicht Verlengen (Klanten-tabje, Youri vroeg erom, 5 nov 2026).
// Alleen lezen. Los bestand zonder imports zodat het ook buiten de app te
// controleren is met de echte data.

const DAG_MS = 86400000

// Rekenen in hele kalenderdagen (UTC), anders schuift zomertijd de uitkomst.
const dagNummer = (iso) => {
  const [j, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return Date.UTC(j, m - 1, d) / DAG_MS
}
const isoVan = (nummer) => new Date(nummer * DAG_MS).toISOString().slice(0, 10)

const isTestaccount = (email) => {
  const e = String(email || '').trim().toLowerCase()
  return e.includes('test') || e === 'ks10k@gmail.com' || e === 'review@gmail.com'
}

export const STATUS_LABEL = {
  ja_mondeling: 'Ja, mondeling',
  denkt_na: 'Denkt na',
  nee: 'Nee',
  betaald: 'Betaald',
}

export const EINDCALL_NODIG = 'Eindcall nodig'

const CALL_SOORTEN = ['klantcall', 'opstartcall', 'salescall']

const plat = (tekst) => String(tekst || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9.]+/g, ' ').trim()
const dagNL = (moment) => new Date(moment).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })

// Komende calls, vroegste eerst. Plan check-blokken zijn voorbereiding, geen call.
function komendeCalls(agenda, nu) {
  return (agenda || [])
    .filter(e => CALL_SOORTEN.includes(e.soort) && !e.hele_dag
      && new Date(e.start_at) >= nu && !plat(e.titel).startsWith('plan check'))
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
}

// Zeker: volledige naam in contact_naam of titel, of voornaam + eerste letter
// achternaam. Alleen de voornaam is zeker als er precies één klant zo heet.
function callsVanKlant(c, calls, klantenPerVoornaam) {
  const voornaam = plat(c.first_name)
  const achternaam = plat(c.last_name)
  const volledig = `${voornaam} ${achternaam}`.trim()
  const eersteWoord = voornaam.split(' ')[0]
  const zeker = [], alleenVoornaam = []
  if (!voornaam) return { zeker, alleenVoornaam }

  for (const e of calls) {
    const contact = plat(e.contact_naam)
    const titel = ` ${plat(e.titel)} `
    if (contact === volledig || titel.includes(` ${volledig} `)
      || (achternaam && contact === `${eersteWoord} ${achternaam[0]}`)) {
      zeker.push(e)
      continue
    }
    const voornaamPast = contact
      ? contact === voornaam || contact === eersteWoord
      : titel.includes(` ${voornaam} `) || titel.includes(` ${eersteWoord} `)
    if (!voornaamPast) continue
    if ((klantenPerVoornaam.get(eersteWoord)?.size || 0) > 1) alleenVoornaam.push(e)
    else zeker.push(e)
  }
  return { zeker, alleenVoornaam }
}

// Telt een zekere call als eindcall? Hij moet uiterlijk 3 dagen voor het einde
// zijn. Is die grens al voorbij, dan is elke komende call goed: anders kan het
// label nooit meer weg, ook niet als de call al staat. Een call die alleen op
// voornaam past telt niet mee: liever een keer te veel Eindcall nodig dan een
// gemiste eindcall.
export function eindcallNodig({ dagen, status, eind, zekereCalls, vandaag }) {
  if (status === 'betaald' || dagen > 14) return false
  const grens = isoVan(dagNummer(eind) - 3)
  if (grens < vandaag) return zekereCalls.length === 0
  return !zekereCalls.some(e => dagNL(e.start_at) <= grens)
}

// Volgorde telt. Betaald wint van alles: de verlenging is rond. Daarna Eindcall
// nodig en Verlopen, ook bij een open betaling (bedrag blijft in de regel staan).
export function actieVan({ dagen, status, openBetaling, eindcall }) {
  if (status === 'betaald') return 'Klaar'
  if (eindcall) return EINDCALL_NODIG
  if (dagen < 0) return 'Verlopen'
  if (status === 'ja_mondeling' && openBetaling > 0) return 'Betaling navragen'
  if (status === 'denkt_na') return 'Opnieuw bespreken'
  if (!status && dagen <= 14) return 'Verlenging aanbieden'
  return null
}

// De klant met zijn laatste doorstap en open bedrag; zonder startdatum of aantal
// weken (ook onbeperkt) is er geen einddatum en dus niets te verlengen.
export function bouwRijen(klanten, doorstappen, sales, agenda, nu = new Date()) {
  const vandaag = dagNL(nu)
  const calls = komendeCalls(agenda, nu)
  // Over alle lopende klanten, ook zonder einddatum: die kunnen de call net zo goed hebben.
  const klantenPerVoornaam = new Map()
  for (const c of klanten || []) {
    if (isTestaccount(c.email)) continue
    const woord = plat(c.first_name).split(' ')[0]
    if (!woord) continue
    if (!klantenPerVoornaam.has(woord)) klantenPerVoornaam.set(woord, new Set())
    klantenPerVoornaam.get(woord).add(`${plat(c.first_name)} ${plat(c.last_name)}`)
  }

  const laatste = new Map()
  for (const d of doorstappen || []) if (!laatste.has(d.client_id)) laatste.set(d.client_id, d.status)
  const open = new Map()
  for (const s of sales || []) open.set(s.client_id, (open.get(s.client_id) || 0) + (Number(s.order_value) || 0))

  return (klanten || [])
    .filter(c => !isTestaccount(c.email) && c.coaching_start_date && c.coaching_total_weeks)
    .map(c => {
      const weken = Number(c.coaching_total_weeks)
      const eind = dagNummer(c.coaching_start_date) + weken * 7 + (Number(c.coaching_paused_days_total) || 0)
      const dagen = eind - dagNummer(vandaag)
      const status = laatste.get(c.id) || null
      const openBetaling = open.get(c.id) || 0
      const { zeker, alleenVoornaam } = callsVanKlant(c, calls, klantenPerVoornaam)
      const volgende = zeker[0] || alleenVoornaam[0] || null
      const eindcall = eindcallNodig({ dagen, status, eind: isoVan(eind), zekereCalls: zeker, vandaag })
      return {
        id: c.id,
        naam: `${c.first_name || ''} ${c.last_name || ''}`.replace(/\s+/g, ' ').trim() || 'Onbekend',
        // Geen aparte vlag op de klant: de challenge is het traject van 6 weken.
        soort: weken === 6 ? 'challenge' : 'coaching',
        gepauzeerd: c.coaching_status === 'paused',
        start: String(c.coaching_start_date).slice(0, 10),
        eind: isoVan(eind),
        dagen,
        status,
        openBetaling,
        volgendeCall: volgende ? { start: volgende.start_at, titel: volgende.titel } : null,
        naamChecken: !zeker.length && alleenVoornaam.length > 0,
        actie: actieVan({ dagen, status, openBetaling, eindcall }),
      }
    })
    .sort((a, b) => a.eind.localeCompare(b.eind) || a.naam.localeCompare(b.naam))
}

export async function haalVerlengen(supabase) {
  const [kl, ds, sl, ag] = await Promise.all([
    supabase.from('clients')
      .select('id, first_name, last_name, email, coaching_status, coaching_start_date, coaching_total_weeks, coaching_paused_days_total')
      .in('coaching_status', ['active', 'paused'])
      .then(r => r, e => ({ error: e })),
    supabase.from('client_doorstap').select('client_id, status')
      .order('gezet_at', { ascending: false }).order('id', { ascending: false })
      .then(r => r, e => ({ error: e })),
    supabase.from('lead_movements').select('client_id, order_value')
      .not('client_id', 'is', null).not('order_value', 'is', null)
      .eq('payment_received', false).is('reverted_at', null)
      .then(r => r, e => ({ error: e })),
    supabase.from('agenda_events').select('titel, start_at, hele_dag, soort, contact_naam')
      .in('soort', CALL_SOORTEN).gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .then(r => r, e => ({ error: e })),
  ])
  // Agenda niet geladen = geen melding: anders staat iedereen onterecht op Eindcall nodig.
  const fout = kl.error || ds.error || sl.error || ag.error
  if (fout) throw new Error(fout.message || 'Laden mislukt')
  return bouwRijen(kl.data, ds.data, sl.data, ag.data)
}
