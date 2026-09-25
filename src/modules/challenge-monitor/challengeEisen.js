// src/modules/challenge-monitor/challengeEisen.js
//
// De spelregels van de challenge op één plek, plus het ophalen van de stand.
//
// Waarom gedeeld: het coach-overzicht, de klant-banner en straks een filter in
// CoachCommand zeggen alle drie iets over hetzelfde geld. Rekende elk scherm
// zelf, dan kreeg de klant een ander getal te zien dan de coach — en bij een
// challenge waar de inleg van afhangt is dat geen schoonheidsfoutje.
//
// Het tellen zelf zit in de RPC get_challenge_stand (zie challenge-stand.sql).
// Hier staan alleen de drempels: die horen bij déze challenge, niet bij de
// query. Een volgende challenge krijgt andere getallen zonder dat er een
// migratie aan te pas komt.

// 6-weken 80/20-challenge: haal je alle zes, dan krijg je je inleg terug.
//
// `uitleg` is de korte regel (tooltips, onderschriften). `info` is de tekst
// achter het ⓘ-knopje: die legt uit hóé er geteld wordt, want dat is precies
// wat mensen vragen zodra een getal lager uitvalt dan ze verwachtten.
export const EISEN = [
  {
    key: 'workouts', label: 'Workouts', nodig: 14, van: 18,
    uitleg: '14 van de 18 geplande workouts',
    info: 'Een workout telt mee zodra je 70% van de geplande sets hebt afgevinkt. Alleen starten is dus niet genoeg, maar de laatste set laten liggen kost je hem niet. Je hebt er 14 nodig van de 18 die in je schema staan.',
  },
  {
    key: 'wegingen', label: 'Wegingen', nodig: 18, van: 24,
    uitleg: '18 van de 24 weegmomenten',
    info: 'Elke dag dat je je gewicht invult telt als één weging. Twee keer op dezelfde dag wegen telt één keer. Je hebt er 18 nodig van de 24 weegmomenten in de challenge.',
  },
  {
    key: 'voeding', label: 'Voeding', nodig: 5, van: 6,
    uitleg: '5 van de 6 weken minstens 5 goede voedingsdagen',
    info: 'Een dag telt mee als je 70% van de maaltijden uit je plan hebt afgevinkt. Vijf van zulke dagen maken een geldige week. Je hebt 5 geldige weken nodig van de 6 — één slechte week mag dus.',
  },
  {
    key: 'checkins', label: 'Check-ins', nodig: 6, van: 6,
    uitleg: 'elke week een check-in',
    info: 'De wekelijkse check-in die je in de app invult. Eén per week, zes in totaal. Deze mag je niet missen.',
  },
  {
    key: 'fotos', label: "Foto's", nodig: 3, van: 3,
    uitleg: 'begin-, tussen- en eindfoto',
    info: "Voortgangsfoto's: één aan het begin, één halverwege en één aan het eind. Alle drie zijn nodig — daarmee laten we het resultaat zien.",
  },
  {
    key: 'calls', label: 'Calls', nodig: 3, van: 4,
    uitleg: '3 van de 4 coachgesprekken',
    info: 'Coachgesprekken die daadwerkelijk gevoerd zijn. Een afgezegde of gemiste call telt niet. Je hebt er 3 nodig van de 4 die gepland staan.',
  },
]

// De regel achter de hele challenge, voor het ⓘ-knopje bovenaan.
export const ALGEMENE_UITLEG =
  'Haal je alle zes de eisen binnen de looptijd, dan krijg je je inleg terug. ' +
  'Een eis die je binnen hebt kleurt groen. De tellers lopen automatisch mee met ' +
  'wat je in de app afvinkt, dus je hoeft niets door te geven — wat hier staat is ' +
  'wat er geteld is.'

// Hoeveel dagen na de einddatum een deelname nog in de overzichten hoort. De
// uitbetaling gebeurt ná afloop, dus meteen verbergen is te vroeg.
export const NALOOP_DAGEN = 14

// De challenges die een coach kan toewijzen. `dagen` is de looptijd; de
// einddatum wordt daaruit berekend zodat niemand hem met de hand hoeft te
// tellen. De sleutel gaat als challenge_type de database in.
export const SOORTEN = [
  { key: '6week8020', naam: '6-weken 80/20-challenge', dagen: 42 },
  { key: '8week',     naam: '8-weken challenge',       dagen: 56 },
]

export const challengeNaam = (type) =>
  SOORTEN.find(s => s.key === type)?.naam || 'Challenge'

// De zes waarden uit de RPC-uitkomst, in dezelfde sleutels als EISEN.
export const waardenUit = (stand) => ({
  workouts: stand?.workouts?.geldig ?? 0,
  wegingen: stand?.wegingen ?? 0,
  voeding: stand?.voeding?.geldige_weken ?? 0,
  checkins: stand?.checkins ?? 0,
  fotos: stand?.fotos ?? 0,
  calls: stand?.calls ?? 0,
})

export const allesGehaald = (stand) => {
  const w = waardenUit(stand)
  return EISEN.every(e => w[e.key] >= e.nodig)
}

// ---------------------------------------------------------------------------
// De weekkant
//
// De zes eisen hierboven gaan over de hele looptijd, en dat is precies wat je
// er niet naar laat handelen: "14 van de 18" zegt niets over wat je vandaag
// moet doen. Daarom dezelfde regels nog een keer, maar dan per week.
//
// De aantallen zijn de weekversie van EISEN: 18 workouts en 24 weegmomenten in
// zes weken is 3 en 4 per week, een geldige voedingsweek is 5 goede dagen, en
// de check-in is er sowieso één per week. Foto's en calls hebben geen
// weekritme — die staan apart onder WEEK_LOOPT_DOOR.
// Let op: de weekeisen staan bewust lager dan de totalen. Twee workouts per
// week maal zes weken is twaalf, terwijl het totaal er veertien vraagt — wie
// alleen de weekeisen haalt, haalt de challenge dus niet. Dat is met opzet: de
// week is de ondergrens die je elke week moet halen, het totaal is waar je aan
// het eind op wordt afgerekend.
export const WEEK_EISEN = [
  {
    key: 'workouts', label: 'Workouts', nodig: 2,
    info: 'Twee workouts per week uit je schema. Een workout telt zodra 70% van de sets is afgevinkt.',
  },
  {
    key: 'wegingen', label: 'Wegingen', nodig: 3,
    info: 'Drie keer je gewicht invullen deze week. Twee keer op dezelfde dag telt één keer.',
  },
  {
    key: 'voeding', label: 'Voedingsdagen', nodig: 5,
    info: 'Vijf dagen deze week waarop je 70% van je maaltijden hebt afgevinkt. Dat maakt de week geldig.',
  },
  {
    key: 'checkins', label: 'Check-in', nodig: 1,
    info: 'De wekelijkse check-in in de app. Eén per week, deze mag je niet missen.',
  },
]

// Eisen die niet per week lopen, maar wel zichtbaar moeten blijven.
export const WEEK_LOOPT_DOOR = ['fotos', 'calls']

const isoDag = (v) => String(v ?? '').slice(0, 10)

// Een Date terug naar YYYY-MM-DD in de lokale tijdzone. Niet toISOString():
// die rekent naar UTC om en schuift in de zomertijd een dag terug, waardoor de
// week een dag te vroeg begon.
const alsDatum = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// De challenge-week waar `nu` in valt: blokken van zeven dagen vanaf de
// startdatum. Bewust niet de ISO-week (maandag t/m zondag): begint de
// challenge op een donderdag, dan zou week 1 vier dagen duren en niemand die
// eisen halen.
export function challengeWeek(deelname, nu = new Date()) {
  if (!deelname) return null
  const dag0 = new Date(`${deelname.start_date}T00:00:00`)
  const eind = new Date(`${deelname.end_date}T00:00:00`)
  const vandaag = new Date(nu); vandaag.setHours(0, 0, 0, 0)
  const dagen = (a, b) => Math.round((a - b) / 86400000)
  const totaal = Math.max(1, Math.ceil((dagen(eind, dag0) + 1) / 7))
  // Vóór de start staat week 1 klaar, na afloop blijft de laatste week staan.
  const nummer = Math.min(totaal, Math.max(1, Math.floor(dagen(vandaag, dag0) / 7) + 1))
  const start = new Date(dag0); start.setDate(start.getDate() + (nummer - 1) * 7)
  const laatste = new Date(start); laatste.setDate(laatste.getDate() + 6)
  const weekEind = laatste > eind ? eind : laatste
  return {
    nummer, totaal,
    start: alsDatum(start),
    eind: alsDatum(weekEind),
    resterend: Math.max(0, dagen(weekEind, vandaag)),
  }
}

// Wat er deze week binnen is, in dezelfde sleutels als WEEK_EISEN. Telt niet
// opnieuw wat meetelt: het leest de `telt`-vlaggen en de datums die de RPC al
// heeft bepaald, zodat klant en coach dezelfde grens hanteren.
export function weekWaardenUit(stand, venster) {
  if (!stand || !venster) return { workouts: 0, wegingen: 0, voeding: 0, checkins: 0 }
  const erin = (v) => { const d = isoDag(v); return d >= venster.start && d <= venster.eind }
  const tel = (lijst, datumveld) =>
    (lijst || []).filter(r => (datumveld ? r.telt && erin(r[datumveld]) : erin(r))).length
  return {
    workouts: tel(stand.workouts?.dagen, 'datum'),
    voeding: tel(stand.voeding?.dagen, 'dag'),
    wegingen: tel(stand.weeg_dagen),
    checkins: tel(stand.checkin_dagen),
  }
}

// De grensdatum voor "hoort nog in het overzicht", als YYYY-MM-DD.
export const naloopGrens = () => {
  const d = new Date()
  d.setDate(d.getDate() - NALOOP_DAGEN)
  return d.toISOString().slice(0, 10)
}

// De lopende deelname van één klant, of null. Geen .single(): dat gooit een
// fout zodra er geen rij is, en "doet niet mee aan een challenge" is een
// normale toestand, geen storing.
export async function haalDeelname(db, clientId) {
  if (!clientId) return null
  const { data, error } = await db.supabase
    .from('challenge_assignments')
    .select('id, client_id, challenge_type, start_date, end_date, is_paused')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .gte('end_date', naloopGrens())
    .order('start_date', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0] || null
}

export async function haalStand(db, deelname) {
  if (!deelname) return null
  const { data, error } = await db.supabase.rpc('get_challenge_stand', {
    p_client_id: deelname.client_id,
    p_start: deelname.start_date,
    p_eind: deelname.end_date,
  })
  if (error) throw error
  return data || null
}

// Dag x van y, en hoeveel dagen er nog te gaan zijn. Op middernacht lokaal
// rekenen: met een tijdstip erin verspringt de dagteller halverwege de dag.
export function tijdlijn(deelname) {
  if (!deelname) return { dag: 0, totaal: 0, resterend: 0 }
  const dag0 = new Date(`${deelname.start_date}T00:00:00`)
  const eind = new Date(`${deelname.end_date}T00:00:00`)
  const nu = new Date(); nu.setHours(0, 0, 0, 0)
  const dagen = (a, b) => Math.round((a - b) / 86400000)
  const totaal = dagen(eind, dag0) + 1
  return {
    dag: Math.min(totaal, Math.max(1, dagen(nu, dag0) + 1)),
    totaal,
    resterend: Math.max(0, dagen(eind, nu)),
  }
}
