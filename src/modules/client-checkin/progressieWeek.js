// src/modules/client-checkin/progressieWeek.js
//
// "Dit was je progressie van afgelopen week" — het tweede scherm van de
// check-in.
//
// Verschil met weekCijfers.js: dat scherm toont wat er is gebeurd (vier
// trainingen, vijf keer gewogen). Dit scherm toont waar het naartoe beweegt.
// Niet "je hebt getraind" maar "je bent sterker geworden op bankdrukken".
//
// Drie regels die we bewust volgen:
//
//   Geen data is geen regel. Wie zich niet woog krijgt geen gewichtsregel met
//   een streepje erin, maar helemaal geen gewichtsregel. Een leeg vakje voelt
//   als een verwijt en zegt niets.
//
//   In de eerste weken vergelijken we met de start. Zaterdag-op-zaterdag heeft
//   pas zin als er twee zaterdagen zijn geweest.
//
//   Zaterdag als ankerpunt, net als in de coach-weergave. Klant en coach horen
//   hetzelfde getal te zien; daarom komt het uit dezelfde zaterdagTempo() als
//   de gewicht-header in coach insight.

import { est8Rep } from '../coach-command-center/components/insight/workoutChartUtils'
import { zaterdagTempo, laatsteZaterdag, vensterGemiddelde } from '../weight-tracker/utils/coachingBand'
import { lokaleDatum } from '../../utils/tijd'

const dagInMs = 86400000

const minDagen = (iso, n) =>
  lokaleDatum(new Date(new Date(`${iso}T00:00:00`).getTime() - n * dagInMs))

// Hoeveelste week van het traject loopt nu? Eén-gebaseerd: de eerste zeven
// dagen zijn week 1, niet week 0.
//
// Afgekapt op de trajectlengte, net als de balk op de home-pagina
// (ClientHome). Loopt iemands periode door na de einddatum — en dat komt
// vaak voor, de coach sluit hem lang niet altijd af — dan zou je anders
// "week 21 van 12" krijgen. Twee schermen die een ander weeknummer noemen is
// erger dan een teller die blijft staan.
export function wekenBezig(client, nu = new Date()) {
  const start = client?.coaching_start_date
  if (!start) return null
  const begin = new Date(`${start}T00:00:00`)
  if (Number.isNaN(begin.getTime())) return null
  const dagen = Math.floor((nu.getTime() - begin.getTime()) / dagInMs)
  if (dagen < 0) return null
  const totaal = Number(client?.coaching_total_weeks) || null
  const verstreken = Math.floor(dagen / 7) + 1
  return {
    week: totaal ? Math.min(totaal, verstreken) : verstreken,
    totaal,
  }
}

// Hoe de klant zijn fase genoemd hoort te zien. In de database staat 'cut' en
// 'build'; dat laatste heet in de app overal 'bulk'.
const FASE_NAAM = { cut: 'cut', build: 'bulk', recomp: 'recomp', maintain: 'onderhoud' }

/**
 * De lopende fase van deze klant, met hoelang hij er al in zit.
 * Aparte query omdat het eerste scherm van de check-in er meteen op wacht en
 * niet op de hele terugblik hoeft te blijven hangen.
 *
 * @returns {Promise<{naam: string, weken: number}|null>}
 */
export async function haalFase(db, clientId, nu = new Date()) {
  if (!db?.supabase || !clientId) return null
  const { data } = await db.supabase
    .from('client_phases')
    .select('doel, started_on')
    .eq('client_id', clientId)
    .is('ended_on', null)
    .order('started_on', { ascending: false })
    .limit(1)
    .then(r => r, () => ({ data: null }))

  const fase = (data || [])[0]
  if (!fase?.doel || !fase?.started_on) return null

  const begin = new Date(`${fase.started_on}T00:00:00`)
  if (Number.isNaN(begin.getTime())) return null
  const dagen = Math.floor((nu.getTime() - begin.getTime()) / dagInMs)
  if (dagen < 0) return null

  return {
    naam: FASE_NAAM[fase.doel] || fase.doel,
    weken: Math.floor(dagen / 7) + 1,
  }
}

// Het zwaarste geschatte 8RM binnen één oefening-log.
const besteVanSets = (sets) => {
  if (!Array.isArray(sets)) return null
  let best = null
  for (const s of sets) {
    const v = est8Rep(s?.weight, s?.reps)
    if (v !== null && (best === null || v > best)) best = v
  }
  return best
}

/**
 * Alles voor het progressie-scherm van één klant.
 *
 * @returns {Promise<object|null>}
 */
export async function laadProgressie(db, client) {
  if (!db?.supabase || !client?.id) return null
  const sb = db.supabase

  const zaterdag = laatsteZaterdag()
  const weekStart = minDagen(zaterdag, 6)      // de week die op die zaterdag eindigt
  const vorigeWeekStart = minDagen(weekStart, 7)

  // Let op: een Supabase query-builder heeft geen .catch(). Het tweede
  // argument van .then() vangt de afwijzing, anders sloopt één mislukte query
  // de hele Promise.all en krijgt de klant een leeg scherm.
  const vang = (q) => q.then(r => r, () => ({ data: null }))

  const [stand, gewichtRes, sessiesRes, faseRes] = await Promise.all([
    vang(sb.rpc('get_challenge_stand', {
      p_client_id: client.id,
      p_start: weekStart,
      p_eind: zaterdag,
    })),
    vang(sb.from('weight_challenge_logs')
      .select('date, weight')
      .eq('client_id', client.id)
      .order('date', { ascending: true })),
    vang(sb.from('workout_sessions')
      .select('id, workout_date, is_completed')
      .eq('client_id', client.id)
      .gte('workout_date', vorigeWeekStart)
      .lte('workout_date', zaterdag)),
    vang(sb.from('client_phases')
      .select('started_on, start_gewicht')
      .eq('client_id', client.id)
      .order('started_on', { ascending: false })
      .limit(1)),
  ])

  const s = stand.data || {}
  const wegingen = gewichtRes.data || []
  const sessies = sessiesRes.data || []
  const fase = (faseRes.data || [])[0] || null

  // ── Oefeningen van beide weken, voor de kracht-vergelijking ──
  const sessieIds = sessies.map(x => x.id)
  let oefeningen = []
  if (sessieIds.length) {
    const res = await vang(sb.from('workout_progress')
      .select('session_id, exercise_name, sets')
      .in('session_id', sessieIds))
    const datumVan = new Map(sessies.map(x => [x.id, x.workout_date]))
    oefeningen = (res.data || []).map(o => ({ ...o, datum: datumVan.get(o.session_id) }))
  }

  return {
    periode: { van: weekStart, tot: zaterdag },
    weken: wekenBezig(client),
    gewicht: bouwGewicht(wegingen, fase, client),
    training: bouwTraining(sessies, oefeningen, weekStart, s),
    voeding: {
      dagen: s.voeding?.geldige_dagen ?? null,
      van: 7,
    },
    wegingen: {
      dezeWeek: s.wegingen ?? null,
      van: 7,
    },
  }
}

// ── Gewicht ───────────────────────────────────────────────────────────────
//
// Eerst zaterdag tegen vorige zaterdag. Lukt dat niet — te weinig weken, of
// vorige zaterdag niets gemeten — dan tegen de start van de fase. Lukt dat ook
// niet, dan geven we null terug en verdwijnt de regel.
function bouwGewicht(wegingen, fase, client) {
  if (!wegingen.length) return null

  const tempo = zaterdagTempo(wegingen)
  if (tempo.verschil !== null) {
    return {
      soort: 'week',
      nu: Math.round(tempo.nu.gemiddelde * 10) / 10,
      eerder: Math.round(tempo.vorige.gemiddelde * 10) / 10,
      verschil: tempo.verschil,
      metingen: tempo.nu.metingen,
    }
  }

  // Terugval: tegen het startgewicht van de fase, anders de eerste meting.
  const nu = vensterGemiddelde(wegingen, tempo.zaterdag)
  if (nu.gemiddelde == null) return null

  const startUitFase = Number(fase?.start_gewicht)
  const startUitClient = Number(client?.start_weight)
  const eerste = Number(wegingen[0]?.weight)
  const start = [startUitFase, startUitClient, eerste].find(n => Number.isFinite(n) && n > 0)
  if (!Number.isFinite(start)) return null

  return {
    soort: 'start',
    nu: Math.round(nu.gemiddelde * 10) / 10,
    eerder: Math.round(start * 10) / 10,
    verschil: Math.round((nu.gemiddelde - start) * 10) / 10,
    metingen: nu.metingen,
  }
}

// ── Training ──────────────────────────────────────────────────────────────
function bouwTraining(sessies, oefeningen, weekStart, stand) {
  const dezeWeek = sessies.filter(x => x.workout_date >= weekStart)
  const oefDezeWeek = oefeningen.filter(o => o.datum >= weekStart)

  // Beste 8RM per oefening, deze week tegen de week ervoor. Eén getal per
  // oefening maakt 100×5 en 80×12 vergelijkbaar.
  const besteNu = new Map()
  const besteVorig = new Map()
  for (const o of oefeningen) {
    const waarde = besteVanSets(o.sets)
    if (waarde === null) continue
    const doel = o.datum >= weekStart ? besteNu : besteVorig
    const huidig = doel.get(o.exercise_name)
    if (huidig === undefined || waarde > huidig) doel.set(o.exercise_name, waarde)
  }

  const vooruit = []
  for (const [oefening, nu] of besteNu) {
    const vorig = besteVorig.get(oefening)
    if (!vorig) continue
    const pct = Math.round((nu / vorig - 1) * 100)
    // Onder de 3% is het ruis: andere dag, ander humeur, andere warming-up.
    if (pct >= 3) {
      vooruit.push({ oefening, pct, nu: Math.round(nu * 10) / 10, vorig: Math.round(vorig * 10) / 10 })
    }
  }
  vooruit.sort((a, b) => b.pct - a.pct)

  const sets = oefDezeWeek.reduce((n, o) => n + (Array.isArray(o.sets) ? o.sets.length : 0), 0)

  return {
    sessies: stand?.workouts?.geldig ?? dezeWeek.filter(x => x.is_completed).length,
    oefeningen: new Set(oefDezeWeek.map(o => o.exercise_name)).size,
    sets,
    // Hooguit drie: een lijst van tien "sterker geworden op" leest niemand,
    // en dan valt de grootste sprong niet meer op.
    sterker: vooruit.slice(0, 3),
    meerOefeningen: Math.max(0, vooruit.length - 3),
  }
}
