// src/modules/week-review/WeekReviewService.js
//
// De zaterdagronde: per klant één week op een rij.
//
// Dit bestand haalt niets nieuws uit de lucht. Het gewichtsoordeel komt uit de
// coaching-band (weight-tracker/utils/coachingBand.js), het krachtoordeel uit
// est8Rep van de insight-grafiek, en wie er meedoet bepaalt trajectLoopt(). Zo
// staat er in de review hetzelfde als in het insight-scherm van die klant —
// twee schermen die iets anders beweren over dezelfde week is erger dan geen
// tweede scherm.
//
// Alles in één ronde: acht queries voor de hele lijst, niet acht per klant.
//
// Datums zijn lokale kalenderdatums. toISOString() zou in de zomer een dag
// terugschuiven en dan mist er een training op de rand van de week.

import { est8Rep } from '../coach-command-center/components/insight/workoutChartUtils'
import { trajectLoopt } from '../client-checkin/trajectStatus'
import {
  maakConfig, trendReeks, weekBeoordelingen, weergaveStatus, advies,
  STATUS_TEKST,
} from '../weight-tracker/utils/coachingBand'

export const DAGEN_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

// ── Kalender ──────────────────────────────────────────────────────────────

export const lokaleDatum = (d = new Date()) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

const plusDagen = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return lokaleDatum(d)
}

// De maandag van de week waar deze datum in valt. Zondag telt als het einde
// van de week ervoor, niet als het begin van een nieuwe.
export function maandagVan(datum = new Date()) {
  const d = new Date(datum)
  const dag = d.getDay() === 0 ? 7 : d.getDay()   // 1=ma .. 7=zo
  d.setDate(d.getDate() - (dag - 1))
  return lokaleDatum(d)
}

export function weekVenster(maandagIso) {
  const maandag = maandagIso || maandagVan()
  return {
    maandag,
    zondag: plusDagen(maandag, 6),
    vorigeMaandag: plusDagen(maandag, -7),
    vorigeZondag: plusDagen(maandag, -1),
  }
}

export const verschuifWeek = (maandagIso, weken) => plusDagen(maandagIso, weken * 7)

export function weekLabel(maandagIso) {
  const m = new Date(`${maandagIso}T00:00:00`)
  const z = new Date(`${plusDagen(maandagIso, 6)}T00:00:00`)
  const maand = (d) => d.toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '')
  return m.getMonth() === z.getMonth()
    ? `${m.getDate()} – ${z.getDate()} ${maand(z)}`
    : `${m.getDate()} ${maand(m)} – ${z.getDate()} ${maand(z)}`
}

// ── Hulpjes ───────────────────────────────────────────────────────────────

const inBrokken = (lijst, grootte = 200) => {
  const uit = []
  for (let i = 0; i < lijst.length; i += grootte) uit.push(lijst.slice(i, i + grootte))
  return uit
}

// Het zwaarste geschatte 8RM van deze oefening in deze sessie. Eén getal per
// oefening per dag, zodat 100×5 en 80×12 vergelijkbaar worden.
const besteVanSets = (sets) => {
  if (!Array.isArray(sets)) return null
  let best = null
  for (const s of sets) {
    const v = est8Rep(s?.weight, s?.reps)
    if (v !== null && (best === null || v > best)) best = v
  }
  return best
}

const dagKort = (iso) => {
  const d = new Date(`${iso}T00:00:00`)
  return DAGEN_KORT[(d.getDay() === 0 ? 7 : d.getDay()) - 1]
}

// ── De ronde ophalen ──────────────────────────────────────────────────────

export async function haalWeek(db, coachId, maandagIso) {
  const sb = db?.supabase
  if (!sb || !coachId) return { klanten: [], week: weekVenster(maandagIso) }
  const week = weekVenster(maandagIso)

  // 1. Wie doet mee. Dezelfde bron als het command center, zodat de lijst niet
  //    stiekem afwijkt van wat je daar ziet.
  const alle = await db.getAllClients()
  const klanten = (alle || [])
    .filter(c => c.email !== 'demo@myarcfitness.internal')
    .filter(trajectLoopt)
  if (klanten.length === 0) return { klanten: [], week }

  const ids = klanten.map(c => c.id)
  const schemaIds = [...new Set(klanten.map(c => c.assigned_schema_id).filter(Boolean))]

  // 2. Alles wat we nodig hebben, in één ronde. Twee weken sessies (deze week
  //    en de vorige, om kracht te kunnen vergelijken) en tien weken gewicht
  //    (de band rekent met een 7-daags gemiddelde en wil aanloop).
  const [sessiesRes, gewichtRes, fasesRes, checkinsRes, schemasRes, reviewsRes] = await Promise.all([
    sb.from('workout_sessions')
      .select('id, client_id, workout_date, is_completed, completion_percentage, duration_minutes, feeling, day_display_name, day_name, notes')
      .in('client_id', ids)
      .gte('workout_date', week.vorigeMaandag)
      .lte('workout_date', week.zondag)
      .then(r => r, e => ({ data: [], error: e })),
    sb.from('weight_challenge_logs')
      .select('client_id, date, weight')
      .in('client_id', ids)
      .gte('date', plusDagen(week.maandag, -70))
      .lte('date', week.zondag)
      .order('date', { ascending: true })
      .then(r => r, e => ({ data: [], error: e })),
    sb.from('client_phases')
      .select('client_id, started_on, ended_on, doel, start_gewicht, week_doel_kg, doel_gewicht')
      .in('client_id', ids)
      .is('ended_on', null)
      .then(r => r, e => ({ data: [], error: e })),
    sb.from('client_checkins')
      .select('client_id, checkin_date, status, training_gedaan, training_gepland, vastgelopen, hoe_gaat_het, struggles, wins, energie_score, motivatie_score, slaap_uren_gem')
      .in('client_id', ids)
      .gte('checkin_date', week.maandag)
      .lte('checkin_date', plusDagen(week.zondag, 2))
      .then(r => r, e => ({ data: [], error: e })),
    schemaIds.length
      ? sb.from('workout_schemas').select('id, name, days_per_week').in('id', schemaIds)
          .then(r => r, e => ({ data: [], error: e }))
      : Promise.resolve({ data: [] }),
    sb.from('week_reviews')
      .select('client_id, notitie, gehad_op')
      .eq('coach_id', coachId)
      .eq('week_start', week.maandag)
      .then(r => r, e => ({ data: [], error: e })),
  ])

  const sessies = sessiesRes?.data || []

  // 3. De sets horen bij een sessie, niet bij een klant — workout_progress
  //    heeft geen client_id. Dus via de sessie-id's erbij halen.
  const sessieIds = sessies.map(s => s.id)
  let oefeningen = []
  if (sessieIds.length) {
    const brokken = await Promise.all(
      inBrokken(sessieIds).map(brok =>
        sb.from('workout_progress')
          .select('session_id, exercise_name, sets, notes')
          .in('session_id', brok)
          .then(r => r, e => ({ data: [], error: e }))
      )
    )
    oefeningen = brokken.flatMap(b => b?.data || [])
  }

  // ── Indexeren ──
  const perSessie = new Map(sessies.map(s => [s.id, s]))
  const schemas = new Map((schemasRes?.data || []).map(s => [s.id, s]))
  const fases = new Map((fasesRes?.data || []).map(f => [f.client_id, f]))
  const reviews = new Map((reviewsRes?.data || []).map(r => [r.client_id, r]))

  const gewichtPer = new Map()
  for (const g of (gewichtRes?.data || [])) {
    if (!gewichtPer.has(g.client_id)) gewichtPer.set(g.client_id, [])
    gewichtPer.get(g.client_id).push(g)
  }
  const checkinPer = new Map()
  for (const c of (checkinsRes?.data || [])) {
    if (!checkinPer.has(c.client_id)) checkinPer.set(c.client_id, c)
  }
  const sessiesPer = new Map()
  for (const s of sessies) {
    if (!sessiesPer.has(s.client_id)) sessiesPer.set(s.client_id, [])
    sessiesPer.get(s.client_id).push(s)
  }
  // Oefeningen per klant, met de datum van hun sessie erbij geplakt.
  const oefeningenPer = new Map()
  for (const o of oefeningen) {
    const s = perSessie.get(o.session_id)
    if (!s) continue
    if (!oefeningenPer.has(s.client_id)) oefeningenPer.set(s.client_id, [])
    oefeningenPer.get(s.client_id).push({ ...o, datum: s.workout_date })
  }

  const uit = klanten.map(c => bouwKlant({
    client: c,
    week,
    sessies: sessiesPer.get(c.id) || [],
    oefeningen: oefeningenPer.get(c.id) || [],
    gewicht: gewichtPer.get(c.id) || [],
    fase: fases.get(c.id) || null,
    checkin: checkinPer.get(c.id) || null,
    schema: schemas.get(c.assigned_schema_id) || null,
    review: reviews.get(c.id) || null,
  }))

  // Wie aandacht vraagt bovenaan; wie je al gehad hebt onderaan.
  uit.sort((a, b) => {
    if (a.gehad !== b.gehad) return a.gehad ? 1 : -1
    if (b.ernst !== a.ernst) return b.ernst - a.ernst
    return a.naam.localeCompare(b.naam)
  })

  return { klanten: uit, week }
}

// ── Eén klant samenvatten ─────────────────────────────────────────────────

function bouwKlant({ client, week, sessies, oefeningen, gewicht, fase, checkin, schema, review }) {
  const naam = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Naamloos'
  const vlaggen = []

  // ── Training ──
  const dezeWeek = sessies.filter(s => s.workout_date >= week.maandag)
  const dagen = [...new Set(dezeWeek.map(s => s.workout_date))].sort()
  const gepland = Number(schema?.days_per_week) || Number(checkin?.training_gepland) || null
  const onafgerond = dezeWeek.filter(s => !s.is_completed && Number(s.completion_percentage) > 0)

  if (dagen.length === 0) {
    vlaggen.push({ soort: 'rood', tekst: 'Niet getraind deze week' })
  } else if (gepland && dagen.length < gepland) {
    vlaggen.push({ soort: 'geel', tekst: `${dagen.length} van ${gepland} trainingen` })
  }
  if (onafgerond.length) {
    vlaggen.push({ soort: 'geel', tekst: `${onafgerond.length}× training niet afgemaakt` })
  }

  // ── Kracht: beste 8RM per oefening, deze week tegen vorige week ──
  const besteNu = new Map()
  const besteVorig = new Map()
  for (const o of oefeningen) {
    const waarde = besteVanSets(o.sets)
    if (waarde === null) continue
    const doel = o.datum >= week.maandag ? besteNu : besteVorig
    const huidig = doel.get(o.exercise_name)
    if (huidig === undefined || waarde > huidig) doel.set(o.exercise_name, waarde)
  }
  const krachtDetails = []
  for (const [oefening, nu] of besteNu) {
    const vorig = besteVorig.get(oefening)
    if (vorig === undefined || !vorig) continue
    const ratio = nu / vorig
    const richting = ratio >= 1.03 ? 'omhoog' : ratio <= 0.97 ? 'omlaag' : 'gelijk'
    krachtDetails.push({
      oefening,
      nu: Math.round(nu * 10) / 10,
      vorig: Math.round(vorig * 10) / 10,
      richting,
      pct: Math.round((ratio - 1) * 100),
    })
  }
  krachtDetails.sort((a, b) => a.pct - b.pct)
  const omlaag = krachtDetails.filter(d => d.richting === 'omlaag')
  const omhoog = krachtDetails.filter(d => d.richting === 'omhoog')
  if (omlaag.length >= 3 && omlaag.length > omhoog.length) {
    vlaggen.push({ soort: 'geel', tekst: `Kracht omlaag op ${omlaag.length} oefeningen` })
  }

  // ── Gewicht via de coaching-band ──
  const gewichtDezeWeek = gewicht.filter(g => g.date >= week.maandag && g.date <= week.zondag)
  const dagenGewogen = new Set(gewichtDezeWeek.map(g => g.date)).size
  const laatsteMeting = gewicht.length ? gewicht[gewicht.length - 1] : null

  let status = 'GEEN_DATA'
  let adviesTekst = null
  if (gewicht.length >= 2) {
    const reeks = trendReeks(gewicht)
    const config = maakConfig(client, fase)
    const startGewicht = fase?.start_gewicht ? Number(fase.start_gewicht) : null
    const startDatum = fase?.started_on || reeks[0]?.datum
    const weken = (startGewicht && startDatum)
      ? weekBeoordelingen(reeks, startGewicht, startDatum, config)
      : []
    const laatste = weken.length ? weken[weken.length - 1] : null
    if (laatste) {
      status = weergaveStatus(laatste) || laatste.status
      adviesTekst = advies(laatste, config)?.tekst || null
    } else {
      status = 'ONVOLDOENDE_DATA'
    }
  }
  if (!fase) vlaggen.push({ soort: 'grijs', tekst: 'Geen fase ingesteld' })
  if (dagenGewogen === 0) {
    vlaggen.push({ soort: 'rood', tekst: 'Niet gewogen deze week' })
  } else if (dagenGewogen < 3) {
    vlaggen.push({ soort: 'geel', tekst: `${dagenGewogen} van 7 dagen gewogen` })
  }
  if (status === 'TE_SNEL' || status === 'TE_LANGZAAM' || status === 'ACHTER_OP_PLAN') {
    vlaggen.push({ soort: 'geel', tekst: STATUS_TEKST[status] || status })
  }

  // Het verschil binnen de week: eerste tegen laatste meting.
  const verschil = gewichtDezeWeek.length >= 2
    ? Math.round((Number(gewichtDezeWeek[gewichtDezeWeek.length - 1].weight) - Number(gewichtDezeWeek[0].weight)) * 10) / 10
    : null

  // ── Wat de klant zelf zei tijdens het trainen ──
  const notities = oefeningen
    .filter(o => o.datum >= week.maandag && o.notes && String(o.notes).trim())
    .map(o => ({ datum: o.datum, oefening: o.exercise_name, tekst: String(o.notes).trim() }))
    .sort((a, b) => b.datum.localeCompare(a.datum))
  if (notities.length) {
    vlaggen.push({ soort: 'blauw', tekst: notities.length === 1 ? 'Opmerking bij training' : `${notities.length} opmerkingen bij trainingen` })
  }

  // ── Check-in ──
  const checkinBinnen = !!checkin && ['submitted', 'reviewed'].includes(checkin.status)
  if (!checkinBinnen) vlaggen.push({ soort: 'geel', tekst: 'Geen check-in' })
  if (checkin?.vastgelopen) vlaggen.push({ soort: 'rood', tekst: 'Zegt vastgelopen te zijn' })

  const ernst = vlaggen.reduce((s, v) => s + (v.soort === 'rood' ? 3 : v.soort === 'geel' ? 1 : 0), 0)

  return {
    id: client.id,
    naam,
    ernst,
    gehad: !!review,
    notitie: review?.notitie || '',
    vlaggen,
    training: {
      dagen: dagen.map(d => {
        const s = dezeWeek.find(x => x.workout_date === d)
        return {
          datum: d, dag: dagKort(d),
          naam: s?.day_display_name || s?.day_name || null,
          afgerond: !!s?.is_completed,
          pct: Number(s?.completion_percentage) || null,
          duur: s?.duration_minutes || null,
          feeling: s?.feeling || null,
        }
      }),
      gedaan: dagen.length,
      gepland,
      schemaNaam: schema?.name || null,
    },
    kracht: { omhoog: omhoog.length, omlaag: omlaag.length, details: krachtDetails },
    gewicht: {
      status,
      statusTekst: STATUS_TEKST[status] || status,
      advies: adviesTekst,
      dagenGewogen,
      laatste: laatsteMeting ? Number(laatsteMeting.weight) : null,
      laatsteDatum: laatsteMeting?.date || null,
      verschil,
      doel: fase?.doel || null,
      weekDoelKg: fase?.week_doel_kg != null ? Number(fase.week_doel_kg) : null,
    },
    notities,
    checkin: checkinBinnen ? {
      datum: checkin.checkin_date,
      hoeGaatHet: checkin.hoe_gaat_het || null,
      struggles: checkin.struggles || null,
      wins: checkin.wins || null,
      energie: checkin.energie_score ?? null,
      motivatie: checkin.motivatie_score ?? null,
      slaap: checkin.slaap_uren_gem ?? null,
      trainingGedaan: checkin.training_gedaan ?? null,
      trainingGepland: checkin.training_gepland ?? null,
    } : null,
  }
}

// ── Afvinken ──────────────────────────────────────────────────────────────

export async function zetGehad(db, { coachId, clientId, weekStart, notitie = '' }) {
  const { error } = await db.supabase
    .from('week_reviews')
    .upsert({
      coach_id: coachId, client_id: clientId, week_start: weekStart,
      notitie: notitie || null, gehad_op: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'coach_id,client_id,week_start' })
  return { error: error?.message || null }
}

export async function haalGehadWeg(db, { coachId, clientId, weekStart }) {
  const { error } = await db.supabase
    .from('week_reviews')
    .delete()
    .eq('coach_id', coachId).eq('client_id', clientId).eq('week_start', weekStart)
  return { error: error?.message || null }
}
