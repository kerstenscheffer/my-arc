// src/modules/weight-tracker/components/WeightStatsGrid.jsx
// v4.0 — flush stat bar, borderBottom dividers, compact chart + plan line
// Props: { stats, client, fridayData, history, isMobile, coachingPlan }

import React, { useState, useMemo } from 'react'
import { TrendingDown, TrendingUp, Calendar, ChevronDown, ChevronUp, Activity, Info } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { weightGoalColor } from '../utils/weightGoalColor'
import {
  maakConfig, trendReeks, tempoPerWeek, weekFractie, lijnenOpWeek, ernstVan, kleurVoorErnst,
  tempoOordeel, zaterdagTempo, bereikTekst,
} from '../utils/coachingBand'

const PERIODES = [
  { id: '30d', label: '30 dagen' },
  { id: '90d', label: '3 maanden' },
  { id: '6m', label: '6 maanden' },
  { id: 'alles', label: 'Alles' },
]

// `volleBreedte` + `toonHuidig` worden alleen door het coach-inzichtpaneel
// gebruikt: daar is dit de bovenste balk van de sectie en hoort hij tegen de
// randen te staan, met het huidige gewicht als eerste cel. Op de klantpagina
// blijft het een zwevend kaartje binnen de bestaande opmaak.
// `toonGrafiek` uit: de coach-kant heeft zijn eigen band-grafiek en zet dit
// verloop achter een knop. De klant-kant laat hem gewoon staan.
export default function WeightStatsGrid({ stats = {}, client = {}, fridayData = {}, history = [], isMobile = false, coachingPlan = null, volleBreedte = false, toonHuidig = false, fase = null, toonGrafiek = true, grafiekKnop = null }) {
  const [showWeekly, setShowWeekly] = useState(false)
  const [uitlegOpen, setUitlegOpen] = useState(false)
  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))

  // Calendar-week averages (Ma-Zo) — apples-to-apples comparison between
  // weeks. weekOffset 0 = current calendar week, -1 = last week. Returns
  // { avg, count, monday, sunday } so the UI can show entry counts +
  // date ranges as context.
  const mondayOf = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const getCalendarWeekAvg = (weekOffset = 0) => {
    const monday = mondayOf(new Date())
    monday.setDate(monday.getDate() + weekOffset * 7)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    const entries = sortedHistory.filter(e => {
      const d = new Date(e.date)
      return d >= monday && d <= sunday
    })
    if (entries.length === 0) return { avg: null, count: 0, monday, sunday }
    const avg = parseFloat(
      (entries.reduce((t, e) => t + parseFloat(e.weight), 0) / entries.length).toFixed(1)
    )
    return { avg, count: entries.length, monday, sunday }
  }
  const fmtWeekRange = (mon, sun) => {
    const fmt = d => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    return `${fmt(mon)} – ${fmt(sun)}`
  }

  // Build a list of up to 12 calendar weeks going back from this week,
  // skipping weeks with zero measurements. Used for the expandable
  // "Wekelijkse historie" list further down.
  const getAllWeeks = () => {
    const weeks = []
    for (let i = 0; i < 12; i++) {
      const w = getCalendarWeekAvg(-i)
      if (w.avg !== null) {
        weeks.push({
          ...w,
          weekStart: w.monday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
          weekEnd: w.sunday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
          isCurrent: i === 0,
          startDate: w.monday.toISOString().split('T')[0],
          endDate: w.sunday.toISOString().split('T')[0],
        })
      }
    }
    return weeks.reverse()
  }

  const allWeeks = getAllWeeks()
  const lastWeekData = getCalendarWeekAvg(-1)
  // Alleen nog voor de 'vorige week'-cel bij klanten zonder fase; de balk
  // rekent verder met de trend en het tempo.
  const prev = lastWeekData.avg !== null ? lastWeekData : null

  // "Sinds start" telt vanaf het begin van de huidige fase, niet vanaf de
  // allereerste meting ooit. Na een cut van acht maanden zegt -8,5 kg niets
  // meer over de build waar je nu in zit; je wil zien wat er in déze fase is
  // gebeurd. Zonder fase valt het terug op de eerste meting, zoals eerder.
  const faseStart = fase?.started_on || null
  const faseHistory = faseStart
    ? sortedHistory.filter(e => new Date(e.date) >= new Date(faseStart))
    : sortedHistory

  // Startpunt: het startgewicht van de fase als dat er is, anders de eerste
  // meting binnen de fase. Het ingevulde startgewicht wint, want dat is wat
  // de coach als nulpunt heeft afgesproken.
  const faseStartGewicht = fase?.start_gewicht != null ? parseFloat(fase.start_gewicht) : null
  const firstEntry  = faseHistory[0]
  const latestEntry = faseHistory[faseHistory.length - 1]
  const basisGewicht = faseStartGewicht ?? (firstEntry ? parseFloat(firstEntry.weight) : null)

  const totalChange = (basisGewicht != null && latestEntry && (faseStartGewicht != null || faseHistory.length >= 2))
    ? parseFloat((parseFloat(latestEntry.weight) - basisGewicht).toFixed(1))
    : null

  // Waartegen kleuren we? De fase, als die er is. Anders de klant-rij.
  //
  // De klant-rij komt uit de lijst die bij het laden van de pagina is
  // opgehaald. Start je een fase en open je de modal opnieuw, dan staat daar
  // nog het oude doel en werd +0,2 kg in een build rood gekleurd. De fase is
  // hier de bron van waarheid: die staat in dezelfde sectie op het scherm.
  const doelBron = fase
    ? {
        primary_goal: fase.doel === 'build' ? 'muscle_gain'
          : fase.doel === 'cut' ? 'fat_loss'
          : fase.doel === 'recomp' ? 'recomp' : 'maintenance',
        weekly_weight_goal: fase.week_doel_kg,
      }
    : client

  const startDatum = faseStart || firstEntry?.date || null
  const startDateLabel = startDatum
    ? new Date(startDatum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : null

  
  // ═══ Chart data with optional plan line ═══
  // Twee modi voor de plan-lijn (rode lijn):
  //   1. Coaching plan beschikbaar  → deficit-based: gebruikt tdee, target_cal
  //      en adjustments over de tijd. Reageert dus op aanpassingen die de
  //      coach mid-traject doet.
  //   2. Geen plan maar wél start_weight + target_weight op de client     → lineaire fallback over een duur (goal_deadline als die er is,
  //      anders 12 weken vanaf de eerste gemeten datum).
  //
  // De lijn loopt door naar de toekomst tot aan client.goal_deadline:
  // we voegen lege chart-punten toe (weight=null) zodat alleen "expected"
  // wordt getekend tot de einddatum.
  const chartData = useMemo(() => {
    const data = sortedHistory.map(e => ({
      date: new Date(e.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      rawDate: e.date,
      weight: parseFloat(e.weight),
      isFriday: e.is_friday_weighin,
    }))

    // Bron-prioriteit voor de einddatum waar de rode plan-lijn op uitkomt:
    //   1. client.goal_deadline (Doelen-tab veld)
    //   2. client.target_date (oudere data)
    //   3. coaching_start_date + coaching_total_weeks (CoachingPeriodPanel)
    // Stap 3 zorgt dat de lijn ook netjes loopt voor klanten waar de
    // deadline nog niet expliciet is gezet, zolang het traject wel is
    // ingesteld bovenin coach insight.
    let goalDeadlineStr = client?.goal_deadline || client?.target_date
    if (!goalDeadlineStr && client?.coaching_start_date && client?.coaching_total_weeks) {
      const startMs = new Date(client.coaching_start_date + 'T00:00:00').getTime()
      const weeks = parseInt(client.coaching_total_weeks, 10) || 0
      const pausedDays = parseInt(client.coaching_paused_days_total, 10) || 0
      const endMs = startMs + (weeks * 7 + pausedDays) * 86400000
      goalDeadlineStr = new Date(endMs).toISOString().split('T')[0]
    }
    const goalDeadline = goalDeadlineStr ? new Date(goalDeadlineStr) : null

    // Genereer lege toekomst-punten (weekly cadence) tot goal_deadline,
    // zodat de plan-lijn doorloopt voorbij de laatste meting.
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const futureBoundary = goalDeadline && goalDeadline > today ? goalDeadline : null
    if (futureBoundary) {
      const lastDate = data.length ? new Date(data[data.length - 1].rawDate) : today
      const cursor = new Date(Math.max(lastDate.getTime(), today.getTime()))
      cursor.setDate(cursor.getDate() + 7)
      while (cursor <= futureBoundary) {
        const iso = cursor.toISOString().split('T')[0]
        data.push({
          date: cursor.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
          rawDate: iso,
          weight: null,
          isFriday: cursor.getDay() === 5,
          isFuture: true,
        })
        cursor.setDate(cursor.getDate() + 7)
      }
      // Forceer een laatste punt exact op de deadline.
      const lastIso = futureBoundary.toISOString().split('T')[0]
      if (data.length === 0 || data[data.length - 1].rawDate !== lastIso) {
        data.push({
          date: futureBoundary.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
          rawDate: lastIso,
          weight: null,
          isFuture: true,
        })
      }
    }

    // ── Modus 1: deficit-based via coaching plan ──
    if (coachingPlan?.plan && coachingPlan.startDate) {
      const plan = coachingPlan.plan
      const startWeight = parseFloat(plan.start_weight)
      const tdee = plan.tdee || 2500
      const adjustments = plan.adjustments || []
      const planStart = new Date(coachingPlan.startDate)

      if (startWeight) {
        const getTargetCalAtWeek = (w) => {
          let cal = plan.target_cal || 2000
          for (const adj of adjustments) {
            if (adj.week <= w) {
              const kcalChange = adj.changes?.find(c => c.type === 'kcal')
              if (kcalChange) cal = parseInt(kcalChange.to) || cal
              const deficitChange = adj.changes?.find(c => c.type === 'deficit')
              if (deficitChange && !kcalChange) {
                const pct = { mild: 0.125, moderate: 0.20, aggressive: 0.30 }[deficitChange.to] || 0.20
                cal = Math.round(tdee - (tdee * pct))
              }
            }
          }
          return cal
        }

        const getExpectedAtDate = (dateStr) => {
          const d = new Date(dateStr)
          const daysSince = Math.floor((d - planStart) / 86400000)
          if (daysSince < 0) return null
          const weekNum = daysSince / 7
          let weight = startWeight
          const fullWeeks = Math.floor(weekNum)
          for (let i = 1; i <= fullWeeks; i++) {
            const targetCal = getTargetCalAtWeek(i)
            const weeklyLoss = ((tdee - targetCal) * 7) / 7700
            weight -= weeklyLoss
          }
          const frac = weekNum - fullWeeks
          if (frac > 0) {
            const targetCal = getTargetCalAtWeek(fullWeeks + 1)
            const weeklyLoss = ((tdee - targetCal) * 7) / 7700
            weight -= weeklyLoss * frac
          }
          return Math.round(weight * 10) / 10
        }

        data.forEach(point => {
          point.expected = getExpectedAtDate(point.rawDate)
        })
        return data
      }
    }

    // ── Modus 2: lineaire fallback ──
    const startW  = parseFloat(client?.start_weight)
    const targetW = parseFloat(client?.target_weight)
    if (Number.isFinite(startW) && Number.isFinite(targetW) && startW !== targetW && data.length > 0) {
      const planStart = new Date(data[0].rawDate)
      const planEnd = futureBoundary || (() => {
        const d = new Date(planStart); d.setDate(d.getDate() + 7 * 12); return d
      })()
      const totalDays = Math.max(1, Math.floor((planEnd - planStart) / 86400000))
      data.forEach(point => {
        const d = new Date(point.rawDate)
        const daysSince = Math.floor((d - planStart) / 86400000)
        const t = Math.max(0, Math.min(1, daysSince / totalDays))
        const w = startW + (targetW - startW) * t
        point.expected = Math.round(w * 10) / 10
      })
    }

    return data
  }, [
    sortedHistory, coachingPlan,
    client?.start_weight, client?.target_weight,
    client?.goal_deadline, client?.target_date,
    client?.coaching_start_date, client?.coaching_total_weeks, client?.coaching_paused_days_total,
  ])

  const hasPlanLine = chartData.some(d => d.expected != null)
  // Tijdvak van de grafiek. 'alles' laat de hele historie zien; standaard 90
  // dagen, want daar zie je de trend waar je nu in zit.
  const [periode, setPeriode] = useState('90d')
  const zichtbareData = useMemo(() => {
    if (periode === 'alles') return chartData
    const dagen = { '30d': 30, '90d': 90, '6m': 182, '1j': 365 }[periode] || 90
    const grens = new Date()
    grens.setDate(grens.getDate() - dagen)
    // chartData bevat ook toekomstige plan-punten; die horen erbij te blijven.
    return chartData.filter(d => !d.rawDate || new Date(d.rawDate) >= grens)
  }, [chartData, periode])

  const targetWeightNum = Number.isFinite(parseFloat(client?.target_weight))
    ? parseFloat(client.target_weight) : null
  
  const CustomDot = (p) => p.payload.isFriday
    ? <circle cx={p.cx} cy={p.cy} r={3} fill="#8b5cf6" stroke="#000" strokeWidth={1} />
    : <circle cx={p.cx} cy={p.cy} r={1.5} fill="#FFD700" />
  
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    // Pak EXPLICIET het werkelijke-gewicht-punt — recharts geeft payload[0]
    // op basis van Line-volgorde, en dat was de plan-lijn (expected) waardoor
    // de hover-waarde "het plan-gewicht" liet zien i.p.v. wat de klant
    // gewogen heeft op die dag.
    const weightEntry = payload.find(p => p.dataKey === 'weight') || payload[0]
    const data = weightEntry.payload
    const actualKg = typeof weightEntry.value === 'number' ? weightEntry.value : data.weight
    return (
      <div style={{
        background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '4px', padding: '0.3rem 0.4rem'
      }}>
        <div style={{ color: '#FFD700', fontWeight: '700', fontSize: '0.65rem' }}>
          {actualKg != null ? `${actualKg.toFixed(1)} kg` : '— geen meting'}
        </div>
        {data.expected != null && (
          <div style={{ color: '#fca5a5', fontSize: '0.55rem' }}>Plan: {data.expected} kg</div>
        )}
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.55rem' }}>{data.date}</div>
      </div>
    )
  }
  
  // Laatste meting voor de Huidig-cel.
  const laatsteMeting = history && history.length
    ? [...history].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null
  const laatsteGewicht = laatsteMeting && Number.isFinite(parseFloat(laatsteMeting.weight))
    ? Math.round(parseFloat(laatsteMeting.weight) * 10) / 10 : null
  const laatsteDatum = laatsteMeting?.date
    ? new Date(laatsteMeting.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : null

  // ── Trend, tempo en de afstand tot het plan ──
  //
  // Dit verving 'deze week' tegen 'vorige week'. Dat was appels met peren: op
  // maandag staat er één ochtendweging tegenover het gemiddelde van zes dagen,
  // en dagruis van twee kilo maakt daar zomaar een halve kilo 'aankomst' van.
  const binnenFase = fase?.started_on
    ? (history || []).filter(e => String(e?.date || '').slice(0, 10) >= String(fase.started_on).slice(0, 10))
    : history
  const trendReeksData = trendReeks(binnenFase)
  const laatsteTrend = trendReeksData[trendReeksData.length - 1] || null
  const tempo = tempoPerWeek(binnenFase, 14)

  // Waar hoort hij nu te zitten volgens de fase, en hoeveel scheelt dat?
  const bandConfig = maakConfig(client, fase)
  const bandStart = fase?.start_gewicht ? Number(fase.start_gewicht) : null
  const bandLijnen = (laatsteTrend && bandStart)
    ? lijnenOpWeek(weekFractie(laatsteTrend.datum, fase.started_on, bandConfig.venster_dagen), bandStart, bandConfig)
    : null
  const opPlan = (laatsteTrend && bandLijnen) ? Math.round((laatsteTrend.trend - bandLijnen.doel) * 10) / 10 : null
  const bandErnst = (laatsteTrend && bandLijnen) ? ernstVan(laatsteTrend.trend, bandLijnen) : null
  const bandKleur = kleurVoorErnst(bandErnst)

  // Twee tempo's, want ze beantwoorden verschillende vragen:
  //   nu    — wat deed hij déze week? Daar stuur je op bij.
  //   fase  — wat is het gemiddelde sinds de start? Dat zegt of de afspraak
  //           over de hele rit gehaald wordt.

  const wekenSinds = (laatsteTrend && fase?.started_on)
    ? weekFractie(laatsteTrend.datum, fase.started_on, bandConfig.venster_dagen)
    : null
  const tempoFase = (laatsteTrend && bandStart && wekenSinds > 0.5)
    ? Math.round(((laatsteTrend.trend - bandStart) / wekenSinds) * 100) / 100
    : (tempo ? tempo.kgPerWeek : null)

  // ── Het weektempo waar de coach op zaterdag naar kijkt ──
  //
  // Zaterdag tegen zaterdag, allebei als gemiddelde over de zeven dagen ervoor.
  // Kleur volgt het afgesproken bereik, niet een los oordeel: binnen bereik is
  // groen, eronder of erboven is oranje.
  //
  // Onder de drie wegingen in een van beide vensters geven we geen kleur. Dan
  // is het verschil grotendeels dagruis en zou een groen vinkje meer zeggen dan
  // we weten.
  const za = useMemo(() => zaterdagTempo(binnenFase), [binnenFase])
  const zaGenoeg = za.nu.metingen >= 3 && za.vorige.metingen >= 3
  const zaOordeel = (za.verschil != null && zaGenoeg) ? tempoOordeel(za.verschil, bandConfig) : null
  const zaKleur = zaOordeel == null ? 'rgba(255,255,255,0.45)'
    : zaOordeel === 'OP_KOERS' ? '#10b981' : '#f59e0b'
  const bereik = bereikTekst(bandConfig)
  const zaDatum = new Date(`${za.zaterdag}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

  // Weeknummer voor het label bij het gemiddelde ("Gemiddeld w38").
  const weekNummer = (() => {
    if (!laatsteTrend?.datum) return null
    const d = new Date(`${laatsteTrend.datum}T00:00:00`)
    const doel = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const dag = doel.getUTCDay() || 7
    doel.setUTCDate(doel.getUTCDate() + 4 - dag)
    const jaarStart = new Date(Date.UTC(doel.getUTCFullYear(), 0, 1))
    return Math.ceil((((doel - jaarStart) / 86400000) + 1) / 7)
  })()

  return (
    <div>
      {/* ═══ HET WEEKTEMPO — het getal waar je op zaterdag naar kijkt, en het
            bereik waarbinnen het hoort te vallen. Deze twee staan groot omdat
            je hierop bijstuurt; de rest van de regel is context. ═══ */}
      {/* Alleen in het coach-paneel (volleBreedte). Op de klantpagina draait
          deze balk mee en daar heeft de klant niet om een doelbereik gevraagd;
          dat is een apart besluit. */}
      {bereik && volleBreedte && (
        <div style={{
          margin: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{
              flex: 1, minWidth: 0, padding: isMobile ? '0.7rem 0.5rem' : '0.8rem 0.75rem',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 900, color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  Tempo deze week
                </span>
                <button
                  onClick={() => setUitlegOpen(v => !v)}
                  aria-label="Wat betekent dit?"
                  style={{
                    flexShrink: 0, width: 18, height: 18, padding: 0, borderRadius: 999,
                    border: 'none', background: 'transparent',
                    color: uitlegOpen ? '#ffba09' : 'rgba(255,255,255,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Info size={14} strokeWidth={2.8} />
                </button>
              </div>
              <div style={{
                fontSize: isMobile ? '1.7rem' : '2rem', fontWeight: 900, color: zaKleur,
                lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {za.verschil != null ? `${za.verschil > 0 ? '+' : ''}${za.verschil}` : '—'}
                <span style={{ fontSize: '0.4em', fontWeight: 800, opacity: 0.55, marginLeft: 3 }}>kg/wk</span>
              </div>
              <div style={{
                fontSize: isMobile ? '0.62rem' : '0.66rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {za.verschil == null
                  ? 'nog geen twee weken'
                  : zaGenoeg
                    ? `za ${zaDatum} · vorige za`
                    : `te weinig wegingen (${za.vorige.metingen} en ${za.nu.metingen})`}
              </div>
            </div>

            <div style={{
              flex: 1, minWidth: 0, padding: isMobile ? '0.7rem 0.5rem' : '0.8rem 0.75rem',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{
                fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 900, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                Doel per week
              </div>
              <div style={{
                fontSize: isMobile ? '1.7rem' : '2rem', fontWeight: 900, color: '#fff',
                lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {bereik}
                <span style={{ fontSize: '0.4em', fontWeight: 800, opacity: 0.55, marginLeft: 3 }}>kg</span>
              </div>
              <div style={{
                fontSize: isMobile ? '0.62rem' : '0.66rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {bandConfig.handmatig ? 'zelf ingesteld' : 'afgeleid van het weekdoel'}
              </div>
            </div>
          </div>

          {uitlegOpen && (
            <div style={{
              padding: isMobile ? '0 0.5rem 0.8rem' : '0 0.75rem 0.9rem',
              fontSize: isMobile ? '0.76rem' : '0.8rem', fontWeight: 700,
              color: 'rgba(255,255,255,0.7)', lineHeight: 1.55,
            }}>
              <strong style={{ color: '#fff', fontWeight: 900 }}>Tempo deze week</strong> is het gemiddelde
              gewicht over de zeven dagen tot en met zaterdag, min datzelfde venster van vorige week.
              Elke zaterdag leg je die twee naast elkaar. Losse dagen tellen dus niet zwaar mee, en
              er hoeft niet per se óp zaterdag gewogen te worden.
              <br /><br />
              <strong style={{ color: '#fff', fontWeight: 900 }}>Doel per week</strong> is het bereik waarbinnen
              dat tempo hoort te vallen. Erbinnen is groen, erboven of eronder oranje. Staat er geen
              eigen bereik ingesteld, dan leidt de app het af van het weekdoel van de fase — je kunt
              het bij de fase zelf overschrijven.
              <br /><br />
              Onder de drie wegingen in een van beide weken krijgt het getal geen kleur: dan is het
              verschil vooral dagruis.
            </div>
          )}
        </div>
      )}

      {/* ═══ WEEKCIJFERS — één regel als tabel: verticale lijntjes ertussen,
            geen vakken. Het doel-blok dat hier stond is eruit; het doel staat
            al als lijn in de grafiek. ═══ */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        // Niet afbreken naar een tweede regel. Vijf cellen van 33% breed maakten
        // op een telefoon twee rijen waarvan de onderste half gevuld was; dat
        // leest als twee losse balken. Ze passen zich nu aan de breedte aan.
        // In het coach-paneel (volleBreedte) blijft het afbreken: die kolom is
        // smal en heeft een cel extra.
        flexWrap: volleBreedte ? 'wrap' : 'nowrap',
        margin: volleBreedte ? 0 : (isMobile ? '0 1rem' : '0 1.5rem'),
      }}>
        {[
          ...(toonHuidig ? [{
            label: 'Huidig gew.',
            sub: laatsteDatum || 'geen meting',
            val: laatsteGewicht != null ? `${laatsteGewicht}` : '—',
            color: '#fff',
          }] : []),
          {
            label: weekNummer ? `Gemiddeld w${weekNummer}` : 'Gemiddeld',
            sub: laatsteTrend ? `${laatsteTrend.metingen} van 7 dagen` : 'geen meting',
            val: laatsteTrend?.trend != null ? `${laatsteTrend.trend}` : '—',
            color: '#fff',
          },
          {
            label: fase ? 'Tempo fase' : 'Tempo',
            sub: fase?.week_doel_kg != null
              ? `doel ${Number(fase.week_doel_kg) > 0 ? '+' : ''}${Number(fase.week_doel_kg)}/wk`
              : (tempo ? `over ${tempo.metingen} metingen` : '—'),
            val: tempoFase != null ? `${tempoFase > 0 ? '+' : ''}${tempoFase}` : '—',
            eenheid: '/wk',
            color: tempoFase != null ? bandKleur : 'rgba(255,255,255,0.4)',
          },
          ...(fase ? [{
            label: opPlan != null && opPlan < 0 ? 'Onder plan' : 'Boven plan',
            sub: opPlan !== null
              ? (Math.abs(opPlan) < 0.05 ? 'precies op plan' : 'verschil met de lijn')
              : 'nog geen trend',
            val: opPlan !== null ? `${opPlan > 0 ? '+' : ''}${opPlan}` : '—',
            color: opPlan !== null ? bandKleur : 'rgba(255,255,255,0.4)',
          }] : [{
            label: 'Vorige week',
            sub: prev ? `${prev.count} meting${prev.count === 1 ? '' : 'en'}` : 'geen meting',
            val: prev ? `${prev.avg}` : '—',
            color: '#fff',
          }]),
          {
            label: fase ? 'Sinds fase' : 'Sinds start',
            sub: startDateLabel ? `vanaf ${startDateLabel}` : 'geen start',
            val: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange}` : '—',
            color: totalChange !== null ? weightGoalColor(totalChange, doelBron, '#fff') : 'rgba(255,255,255,0.4)',
          },
        ].map((s2, i, arr) => {
          // Op één regel met vier of vijf cellen is er per cel nog geen 80px
          // over; dan moeten de cijfers mee krimpen, anders duwen ze elkaar
          // eruit. Bij twee of drie cellen blijft alles op volle grootte.
          const smal = !volleBreedte && arr.length >= 4
          return (
          <div key={i} style={{
            flex: 1, minWidth: 0,
            padding: isMobile ? (smal ? '0.5rem 0.2rem' : '0.5rem 0.35rem') : '0.6rem 0.6rem',
            borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            display: 'flex', flexDirection: 'column', gap: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              fontSize: isMobile ? (smal ? '0.55rem' : '0.62rem') : '0.66rem',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {s2.label}
            </div>
            <div style={{
              fontSize: isMobile ? (smal ? '0.95rem' : '1.15rem') : (smal ? '1.2rem' : '1.35rem'),
              fontWeight: 900, color: s2.color, lineHeight: 1,
              letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {s2.val}
              <span style={{ fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 800, opacity: 0.5, marginLeft: 2 }}>
                {s2.eenheid ? `kg${s2.eenheid}` : 'kg'}
              </span>
            </div>
            <div style={{
              fontSize: isMobile ? (smal ? '0.53rem' : '0.58rem') : '0.62rem', fontWeight: 700,
              color: 'rgba(255,255,255,0.35)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {s2.sub}
            </div>
          </div>
          )
        })}
      </div>

      {/* "Wekelijkse Historie" dropdown verwijderd — die functie zit nu in de
          "Bekijk week progressie"-toggle van WeightHistory. */}

      {/* ═══ GRAFIEK — met een tijdfilter erboven ═══ */}
      {/* De knop die het verloop open- en dichtklapt hoort vlak boven het
          verloop zelf; los eronder zou hij het ding besturen dat er al staat. */}
      {grafiekKnop}
      {toonGrafiek && chartData.length > 0 && (
        <div style={{ margin: isMobile ? '3rem 0.5rem 0' : '3.5rem 0.75rem 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8, padding: isMobile ? '0 0.4rem 0.6rem' : '0 0.5rem 0.7rem',
          }}>
            <span style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              Verloop
            </span>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
              {zichtbareData.length} metingen
            </span>
          </div>

          {/* Tijdvak kiezen: bij twee jaar data zegt de hele lijn weinig over
              waar je nu staat. */}
          <div style={{
            display: 'flex', gap: 5,
            padding: isMobile ? '0 0.4rem 0.7rem' : '0 0.5rem 0.8rem',
          }}>
            {PERIODES.map(p2 => {
              const aan = periode === p2.id
              return (
                <button
                  key={p2.id}
                  onClick={() => setPeriode(p2.id)}
                  style={{
                    flex: 1, minHeight: 30,
                    background: aan ? '#fff' : 'transparent',
                    border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 999,
                    color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
                    fontSize: isMobile ? '0.68rem' : '0.72rem',
                    fontWeight: aan ? 900 : 700, fontFamily: 'inherit',
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {p2.label}
                </button>
              )
            })}
          </div>

          <ResponsiveContainer width="100%" height={isMobile ? 190 : 240}>
            <LineChart data={zichtbareData} margin={{ top: 5, right: 8, left: -12, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.12)" fontSize={isMobile ? 9 : 10}
                interval="preserveStartEnd" tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 700 }} />
              <YAxis stroke="rgba(255,255,255,0.12)" fontSize={isMobile ? 9 : 10}
                domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 700 }} width={30} />
              <Tooltip content={<CustomTooltip />} />
              {targetWeightNum != null && (
                <ReferenceLine
                  y={targetWeightNum}
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="2 4"
                  label={{
                    value: `Doel ${targetWeightNum}`,
                    position: 'insideTopRight',
                    fill: 'rgba(16,185,129,0.9)',
                    fontSize: isMobile ? 9 : 10,
                    fontWeight: 800,
                  }}
                />
              )}
              {hasPlanLine && (
                <Line type="monotone" dataKey="expected" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5}
                  strokeDasharray="4 4" dot={false} activeDot={false} connectNulls />
              )}
              {/* Gemeten gewicht — wit, want dat is de lijn waar het om gaat. */}
              <Line type="monotone" dataKey="weight" stroke="#fff" strokeWidth={2}
                dot={<CustomDot />} activeDot={{ r: 4, fill: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>

          <div style={{
            display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap',
            marginTop: '0.4rem', fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 700,
          }}>
            {fridayData?.friday_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} /> Vrijdag
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ width: 10, height: 2, background: '#fff' }} /> Gemeten
            </span>
            {hasPlanLine && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ width: 10, height: 2, background: 'rgba(255,255,255,0.35)' }} /> Plan
              </span>
            )}
            {targetWeightNum != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ width: 10, height: 2, background: '#10b981' }} /> Doel
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
