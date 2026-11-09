// src/modules/business-os/nieuweMannenData.js
//
// Nieuwe mannen per week (5 nov 2026): Kerstens hoofdcijfer voor acquisitie.
// Bron: call_leads van het team, op created_at, zonder verwijderde leads.
// Week = maandag t/m zondag in NL-tijd, ook als de browser ergens anders staat.
//
// Bekend  = gender male.
// Geschat = bekend + leeg * male / (male + female) van die week, afgerond.
//
// Tellen met head-queries: de week van 21 sep alleen al heeft ruim 2000 rijen,
// een gewone select loopt dan tegen de rijgrens van PostgREST aan.
// De client komt als argument binnen, zodat dit ook buiten de browser te testen is.

export const DOEL_NIEUWE_MANNEN = 700
export const WEKEN_NIEUWE_MANNEN = 8

const NL = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Amsterdam', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
})
const delen = (ms) => Object.fromEntries(NL.formatToParts(new Date(ms)).map(p => [p.type, Number(p.value)]))

const nlDag = (ms) => {
  const d = delen(ms)
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}
export const plusDagen = (dag, n) => {
  const d = new Date(`${dag}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const maandagVan = (dag) => plusDagen(dag, -((new Date(`${dag}T12:00:00Z`).getUTCDay() + 6) % 7))

// 00:00 NL-tijd als UTC-tijdstip. De klok verzet op zondagnacht, dus op maandag is
// de afwijking om middernacht gelijk aan die om 00:00 UTC.
export const nlMiddernacht = (dag) => {
  const utc = Date.parse(`${dag}T00:00:00Z`)
  const d = delen(utc)
  const afwijking = Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute) - utc
  return new Date(utc - afwijking).toISOString()
}

export const schatMannen = (man, vrouw, leeg) => (
  man + vrouw > 0 ? Math.round(man + leeg * (man / (man + vrouw))) : man
)

// Volle weken veranderen vrijwel niet meer; de lopende week halen we elke keer vers op.
const cache = new Map()

async function haalWeek(sb, ids, maandag, loopt) {
  const sleutel = `${ids.join(',')}|${maandag}`
  if (!loopt && cache.has(sleutel)) return cache.get(sleutel)
  const van = nlMiddernacht(maandag), tot = nlMiddernacht(plusDagen(maandag, 7))
  const tel = (filter) => filter(
    sb.from('call_leads').select('id', { count: 'exact', head: true })
      .in('coach_id', ids).is('deleted_at', null).gte('created_at', van).lt('created_at', tot),
  ).then((r) => {
    if (r.error) throw new Error(r.error.message)
    return r.count || 0
  })
  const [totaal, man, vrouw] = await Promise.all([
    tel(q => q),
    tel(q => q.eq('gender', 'male')),
    tel(q => q.eq('gender', 'female')),
  ])
  const leeg = totaal - man - vrouw
  const week = { maandag, loopt, man, vrouw, leeg, bekend: man, geschat: schatMannen(man, vrouw, leeg) }
  if (!loopt) cache.set(sleutel, week)
  return week
}

// Geeft de weken terug van oud naar nieuw; de laatste is de lopende week.
export async function laadNieuweMannen(sb, coachId, nu = Date.now()) {
  const team = await sb.rpc('team_coach_ids', { p_coach_id: coachId }).then(r => r, () => ({ data: null }))
  const ids = Array.isArray(team.data) && team.data.length ? team.data : [coachId]
  const dezeWeek = maandagVan(nlDag(nu))
  return Promise.all(Array.from({ length: WEKEN_NIEUWE_MANNEN }, (_, i) => {
    const terug = WEKEN_NIEUWE_MANNEN - 1 - i
    return haalWeek(sb, ids, plusDagen(dezeWeek, -7 * terug), terug === 0)
  }))
}

// Compact voor de context van Gino (die wordt na 4000 tekens afgekapt).
export const nieuweMannenVoorGino = (weken) => {
  if (!weken?.length) return null
  const kort = ({ maandag, man, vrouw, leeg, geschat }) => ({ weekVan: maandag, bekend: man, geschat, vrouw, leeg })
  const nu = weken[weken.length - 1]
  return {
    uitleg: 'Hoofdcijfer acquisitie. Bekend = gender male; geschat = bekend + leeg * man/(man+vrouw). De lopende week is nog niet af.',
    doelPerWeek: DOEL_NIEUWE_MANNEN,
    lopendeWeek: kort(nu),
    vorigeWeek: kort(weken[weken.length - 2]),
    eerdereWeken: weken.slice(0, -2).reverse().map(kort),
  }
}
