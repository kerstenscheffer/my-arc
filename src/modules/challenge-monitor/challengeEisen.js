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
export const EISEN = [
  { key: 'workouts',  label: 'Workouts',   nodig: 14, van: 18, uitleg: '14 van de 18 geplande workouts' },
  { key: 'wegingen',  label: 'Wegingen',   nodig: 18, van: 24, uitleg: '18 van de 24 weegmomenten' },
  { key: 'voeding',   label: 'Voeding',    nodig: 5,  van: 6,  uitleg: '5 van de 6 weken minstens 5 goede voedingsdagen' },
  { key: 'checkins',  label: 'Check-ins',  nodig: 6,  van: 6,  uitleg: 'elke week een check-in' },
  { key: 'fotos',     label: "Foto's",     nodig: 3,  van: 3,  uitleg: 'begin-, tussen- en eindfoto' },
  { key: 'calls',     label: 'Calls',      nodig: 3,  van: 4,  uitleg: '3 van de 4 coachgesprekken' },
]

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
