// src/modules/client-checkin/weekCijfers.js
//
// Wat er de afgelopen zeven dagen daadwerkelijk is gebeurd, naast wat er was
// afgesproken.
//
// Waarom dit bestaat: de check-in vroeg de klant hoeveel hij had getraind,
// hoe vaak hij zich had gewogen en hoeveel dagen hij zijn plan had gevolgd.
// Dat staat allemaal al in de app. Je vraagt dus om een herinnering aan iets
// wat je zelf preciezer weet — en die herinnering is systematisch te positief.
// Nu toont het formulier de cijfers en gaan de vragen over wat de klant ermee
// gaat doen.
//
// De tellingen komen uit get_challenge_stand, dezelfde RPC als het
// coach-overzicht en de challenge-stand. Dat is met opzet: klant en coach
// horen niet twee verschillende antwoorden te krijgen over dezelfde week.

import { trendReeks, maakConfig } from '../weight-tracker/utils/coachingBand'

const isoDag = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Hoeveel trainingen staan er voor deze klant in de week? Eerst het toegewezen
// schema, anders wat er in de intake staat. Zelfde volgorde als het formulier
// zelf aanhield toen het dit nog vroeg.
const geplandPerWeek = (client) => {
  const ws = client?.workout_schedule
  if (ws && typeof ws === 'object') {
    const n = Object.values(ws).filter(Boolean).length
    if (n > 0) return n
  }
  const uitIntake = Number(client?.training_days_per_week ?? client?.workout_days)
  return Number.isFinite(uitIntake) && uitIntake > 0 ? uitIntake : null
}

export async function laadWeekCijfers(db, client) {
  if (!db?.supabase || !client?.id) return null

  const eind = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)          // zeven dagen, vandaag meegeteld

  // Let op: een query-builder heeft geen .catch(). Het tweede argument van
  // .then() vangt de afwijzing; anders sloopt één mislukte query de Promise.all
  // en krijgt de klant een leeg formulier.
  const [stand, wegingen, fases] = await Promise.all([
    db.supabase.rpc('get_challenge_stand', {
      p_client_id: client.id,
      p_start: isoDag(start),
      p_eind: isoDag(eind),
    }).then(r => r, () => ({ data: null })),

    db.supabase.from('weight_challenge_logs')
      .select('date, weight')
      .eq('client_id', client.id)
      .gte('date', isoDag(new Date(Date.now() - 28 * 86400000)))
      .order('date', { ascending: true })
      .then(r => r, () => ({ data: [] })),

    db.supabase.from('client_phases')
      .select('*')
      .eq('client_id', client.id)
      .order('started_on', { ascending: false })
      .limit(1)
      .then(r => r, () => ({ data: [] })),
  ])

  const s = stand.data || {}
  const fase = (fases.data || [])[0] || null

  // ── Gewicht: het 7-daags gemiddelde van nu tegen dat van een week geleden ──
  // Niet de losse weging van vandaag tegen die van vorige week: twee kilo
  // verschil tussen twee ochtenden is normaal en maakt van een goede week een
  // slechte.
  const reeks = trendReeks(wegingen.data || [])
  const laatste = reeks[reeks.length - 1] || null
  const weekTerug = (() => {
    if (!laatste) return null
    const grens = new Date(`${laatste.datum}T00:00:00`)
    grens.setDate(grens.getDate() - 7)
    const doel = isoDag(grens)
    // Dichtstbijzijnde meting op of vóór die dag.
    const kandidaten = reeks.filter(r => r.datum <= doel)
    return kandidaten[kandidaten.length - 1] || null
  })()

  const verschil = (laatste?.trend != null && weekTerug?.trend != null)
    ? Math.round((laatste.trend - weekTerug.trend) * 10) / 10
    : null

  // Wat was het afgesproken tempo? Uit de fase als die er is, anders uit de
  // doelen op de klant-rij.
  const config = maakConfig(client, fase)
  const tempoDoel = fase?.week_doel_kg != null
    ? Math.round(Number(fase.week_doel_kg) * 100) / 100
    : (Number.isFinite(config?.tempoKg) ? Math.round(config.tempoKg * 100) / 100 : null)

  return {
    periode: { start: isoDag(start), eind: isoDag(eind) },
    trainingen: {
      gedaan: s.workouts?.geldig ?? null,
      gestart: s.workouts?.sessies ?? null,
      gepland: geplandPerWeek(client),
    },
    wegingen: { gedaan: s.wegingen ?? null, van: 7 },
    voeding: { dagen: s.voeding?.geldige_dagen ?? null, van: 7 },
    gewicht: {
      nu: laatste?.trend ?? null,
      weekTerug: weekTerug?.trend ?? null,
      verschil,
      tempoDoel,
      richting: config?.richting || null,
    },
  }
}

// Haalde hij wat er was afgesproken? Per regel één van: 'goed' | 'bijna' |
// 'niet' | null (niets over te zeggen). De kleur in het formulier hangt
// hieraan, en de coach ziet dezelfde beoordeling terug.
export function oordeel(gedaan, doel) {
  if (gedaan == null || doel == null || doel === 0) return null
  const deel = gedaan / doel
  if (deel >= 1) return 'goed'
  if (deel >= 0.7) return 'bijna'
  return 'niet'
}

// Het gewicht beoordelen kan alleen tegen een richting: 0,3 kg eraf is goed in
// een cut en slecht in een build.
export function gewichtOordeel(verschil, tempoDoel, richting) {
  if (verschil == null || tempoDoel == null) return null
  if (richting === 'stabiel') return Math.abs(verschil) <= 0.5 ? 'goed' : 'bijna'
  const zelfdeKant = (verschil < 0) === (tempoDoel < 0)
  if (!zelfdeKant) return 'niet'
  return Math.abs(verschil) >= Math.abs(tempoDoel) * 0.7 ? 'goed' : 'bijna'
}
