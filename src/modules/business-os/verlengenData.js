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
const vandaagNL = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
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

// Volgorde telt. Betaald wint van alles: de verlenging is rond. Daarna Verlopen,
// ook bij een open betaling (bedrag blijft in de regel staan).
export function actieVan({ dagen, status, openBetaling }) {
  if (status === 'betaald') return 'Klaar'
  if (dagen < 0) return 'Verlopen'
  if (status === 'ja_mondeling' && openBetaling > 0) return 'Betaling navragen'
  if (status === 'denkt_na') return 'Opnieuw bespreken'
  if (!status && dagen <= 14) return 'Verlenging aanbieden'
  return null
}

// De klant met zijn laatste doorstap en open bedrag; zonder startdatum of aantal
// weken (ook onbeperkt) is er geen einddatum en dus niets te verlengen.
export function bouwRijen(klanten, doorstappen, sales, vandaag = vandaagNL()) {
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
        actie: actieVan({ dagen, status, openBetaling }),
      }
    })
    .sort((a, b) => a.eind.localeCompare(b.eind) || a.naam.localeCompare(b.naam))
}

export async function haalVerlengen(supabase) {
  const [kl, ds, sl] = await Promise.all([
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
  ])
  const fout = kl.error || ds.error || sl.error
  if (fout) throw new Error(fout.message || 'Laden mislukt')
  return bouwRijen(kl.data, ds.data, sl.data)
}
