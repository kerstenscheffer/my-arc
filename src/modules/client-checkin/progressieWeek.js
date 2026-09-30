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
import { gewichtOordeel } from './weekCijfers'
import { zaterdagTempo, laatsteZaterdag, vensterGemiddelde } from '../weight-tracker/utils/coachingBand'
import { lokaleDatum } from '../../utils/tijd'

const dagInMs = 86400000

const minDagen = (iso, n) =>
  lokaleDatum(new Date(new Date(`${iso}T00:00:00`).getTime() - n * dagInMs))

const plusDag = (iso) =>
  lokaleDatum(new Date(new Date(`${iso}T00:00:00`).getTime() + dagInMs))

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
// 'build'. Naar de klant toe zeggen we waar het over gaat in plaats van het
// jargon: niemand hoeft te weten wat een cut is om te snappen dat hij aan het
// afvallen is.
const FASE_NAAM = {
  cut: 'vetverlies',
  build: 'spieropbouw',
  recomp: 'recomp',
  maintain: 'onderhouds',
}

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

  const [stand, gewichtRes, sessiesRes, faseRes, maaltijdRes, fasesRes, maaltijdenRes] = await Promise.all([
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
      .select('started_on, start_gewicht, week_doel_kg, doel')
      .eq('client_id', client.id)
      .order('started_on', { ascending: false })
      .limit(1)),
    // De macrodoelen staan op het actieve maaltijdplan, niet op de klantrij.
    vang(sb.from('client_meal_plans')
      .select('daily_calories, daily_protein')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)),
    // Alle fases: de band-grafiek tekent per fase een eigen doellijn.
    vang(sb.from('client_phases')
      .select('*')
      .eq('client_id', client.id)
      .order('started_on', { ascending: true })),
    // Wat er echt gegeten is. De teller uit get_challenge_stand zegt alleen
    // hoeveel dagen er afgevinkt zijn; deze rijen zeggen hoeveel er in zat.
    vang(sb.from('consumed_meals')
      .select('consumed_at, calories, protein')
      .eq('client_id', client.id)
      .gte('consumed_at', `${weekStart}T00:00:00`)
      .lt('consumed_at', `${plusDag(zaterdag)}T00:00:00`)),
  ])

  const s = stand.data || {}
  const wegingen = gewichtRes.data || []
  const sessies = sessiesRes.data || []
  const fase = (faseRes.data || [])[0] || null
  const plan = (maaltijdRes.data || [])[0] || null

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
    voeding: bouwVoeding(s, maaltijdenRes.data || [], plan),
    wegingen: {
      dezeWeek: s.wegingen ?? null,
      van: 7,
      // De losse wegingen van deze week, voor het uitlegvenster achter het
      // gewicht. Zo kan de klant zien welke getallen het gemiddelde vormen.
      dagen: (s.weeg_dagen || []).slice(),
    },
    // Voor de band-grafiek onder het getal: dezelfde invoer als coach insight.
    grafiek: {
      history: wegingen,
      fase,
      fases: fasesRes.data || [],
    },
  }
}

// ── Voeding ───────────────────────────────────────────────────────────────
//
// De teller uit get_challenge_stand telt dagen waarop minstens 70% van de
// geplande maaltijden is afgevinkt. Dat is geen maat voor "op plan gegeten"
// maar voor "bijgehouden in de app" — wie perfect eet zonder af te vinken
// scoort nul. Daarom noemen we het hier ook zo, en zetten we er de cijfers
// naast die wél iets zeggen.
//
// Het gemiddelde loopt alleen over de complete dagen. Een dag met één
// afgevinkte maaltijd van 248 kcal hoort niet mee te wegen in "wat eet je op
// een dag"; die trekt het gemiddelde omlaag zonder dat er minder gegeten is.
function bouwVoeding(stand, maaltijden, plan) {
  const perDag = new Map()
  for (const m of maaltijden) {
    const dag = String(m.consumed_at).slice(0, 10)
    const r = perDag.get(dag) || { kcal: 0, eiwit: 0, n: 0 }
    r.kcal += Number(m.calories) || 0
    r.eiwit += Number(m.protein) || 0
    r.n += 1
    perDag.set(dag, r)
  }

  // Welke dagen golden als compleet? Die lijst komt uit dezelfde bron als de
  // teller, zodat de twee niet uit elkaar kunnen lopen.
  const compleet = new Set(
    (stand?.voeding?.dagen || []).filter(d => d.telt).map(d => String(d.dag).slice(0, 10))
  )
  const volledig = [...perDag.entries()].filter(([dag]) => compleet.has(dag))

  const gem = (kies) => {
    if (!volledig.length) return null
    const som = volledig.reduce((t, [, r]) => t + kies(r), 0)
    return Math.round(som / volledig.length)
  }

  return {
    bijgehouden: perDag.size,
    compleet: compleet.size,
    van: 7,
    gemKcal: gem(r => r.kcal),
    gemEiwit: gem(r => r.eiwit),
    doelKcal: Number(plan?.daily_calories) || null,
    doelEiwit: Number(plan?.daily_protein) || null,
  }
}

// ── Gewicht ───────────────────────────────────────────────────────────────
//
// Eerst zaterdag tegen vorige zaterdag. Lukt dat niet — te weinig weken, of
// vorige zaterdag niets gemeten — dan tegen de start van de fase. Lukt dat ook
// niet, dan geven we null terug en verdwijnt de regel.
// Welke kant hoort het op? Zonder fase weten we het niet, en dan kleuren we
// het verschil ook niet: 0,4 kg eraf is goed in een cut en fout in een bulk.
function richtingVan(fase) {
  if (fase?.doel === 'cut') return 'afvallen'
  if (fase?.doel === 'build') return 'aankomen'
  return 'stabiel'
}

function bouwGewicht(wegingen, fase, client) {
  if (!wegingen.length) return null
  const doel = fase?.week_doel_kg != null ? Number(fase.week_doel_kg) : null

  // De losse wegingen binnen een venster, voor het uitlegvenster: welke
  // getallen zitten er in dit gemiddelde?
  const inVenster = (eindIso, dagen = 7) => {
    const eind = new Date(`${eindIso}T00:00:00`).getTime()
    const begin = eind - (dagen - 1) * dagInMs
    return wegingen
      .filter(w => {
        const t = new Date(`${String(w.date).slice(0, 10)}T00:00:00`).getTime()
        return t >= begin && t <= eind
      })
      .map(w => ({ datum: String(w.date).slice(0, 10), kg: Number(w.weight) }))
  }

  const tempo = zaterdagTempo(wegingen)
  if (tempo.verschil !== null) {
    return {
      soort: 'week',
      nu: Math.round(tempo.nu.gemiddelde * 10) / 10,
      eerder: Math.round(tempo.vorige.gemiddelde * 10) / 10,
      verschil: tempo.verschil,
      metingen: tempo.nu.metingen,
      zaterdag: tempo.zaterdag,
      vorigeZaterdag: tempo.vorigeZaterdag,
      wegingenNu: inVenster(tempo.zaterdag),
      wegingenEerder: inVenster(tempo.vorigeZaterdag),
      // Het afgesproken tempo, zodat de klant ziet of dit verschil goed is.
      doelPerWeek: doel,
      // Hetzelfde oordeel als de coach-kant gebruikt, zodat de kleur die de
      // klant ziet niet af kan wijken van wat in coach insight staat.
      oordeel: gewichtOordeel(tempo.verschil, doel, richtingVan(fase)),
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
