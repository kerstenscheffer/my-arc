// src/modules/weight-tracker/components/WeightStatsGrid.jsx
// v4.0 — flush stat bar, borderBottom dividers, compact chart + plan line
// Props: { stats, client, fridayData, history, isMobile, coachingPlan }

import React, { useState, useMemo } from 'react'
import { TrendingDown, TrendingUp, Calendar, ChevronDown, ChevronUp, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { weightGoalColor } from '../utils/weightGoalColor'

export default function WeightStatsGrid({ stats = {}, client = {}, fridayData = {}, history = [], isMobile = false, coachingPlan = null }) {
  const [showWeekly, setShowWeekly] = useState(false)
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
  const thisWeekData = getCalendarWeekAvg(0)
  const lastWeekData = getCalendarWeekAvg(-1)
  const cur  = thisWeekData.avg !== null ? thisWeekData : null
  const prev = lastWeekData.avg !== null ? lastWeekData : null

  // Real first-vs-latest entry change for "Sinds start" — no sampling.
  const firstEntry  = sortedHistory[0]
  const latestEntry = sortedHistory[sortedHistory.length - 1]
  const totalChange = (firstEntry && latestEntry && sortedHistory.length >= 2)
    ? parseFloat((parseFloat(latestEntry.weight) - parseFloat(firstEntry.weight)).toFixed(1))
    : null
  const startDateLabel = firstEntry
    ? new Date(firstEntry.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : null

  const weekChange = (cur && prev) ? parseFloat((cur.avg - prev.avg).toFixed(1)) : null
  
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
  
  return (
    <div>
      {/* ═══ 4-COLUMN STAT BAR — Deze week | Vorige week | Verschil | Sinds start
            Zwevende card: los van de zijkanten, rounded, met margin. Tekst
            bold wit en groter. ═══ */}
      <div style={{
        margin: isMobile ? '0 1rem' : '0 1.5rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        overflow: 'hidden',
      }}>
        {[
          {
            label: 'Deze week',
            sub: cur
              ? `${cur.count} meting${cur.count === 1 ? '' : 'en'}`
              : 'geen meting',
            val: cur ? `${cur.avg}` : '—',
            color: '#FFD700',
            isPrimary: true,
          },
          {
            label: 'Vorige week',
            sub: prev
              ? `${prev.count} meting${prev.count === 1 ? '' : 'en'}`
              : 'geen meting',
            val: prev ? `${prev.avg}` : '—',
            color: '#fff',
          },
          {
            label: 'Verschil',
            sub: weekChange !== null ? 'week tov week' : '—',
            val: weekChange !== null ? `${weekChange > 0 ? '+' : ''}${weekChange}` : '—',
            color: weekChange !== null
              ? weightGoalColor(weekChange, client.weekly_weight_goal, '#fff')
              : 'rgba(255,255,255,0.4)',
            icon: weekChange !== null && weekChange !== 0
              ? (weekChange < 0 ? TrendingDown : TrendingUp) : null,
          },
          {
            label: 'Sinds start',
            sub: startDateLabel ? `vanaf ${startDateLabel}` : 'geen startmeting',
            val: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange}` : '—',
            color: totalChange !== null
              ? weightGoalColor(totalChange, client.weekly_weight_goal, '#fff')
              : 'rgba(255,255,255,0.4)',
            icon: totalChange !== null && totalChange !== 0
              ? (totalChange < 0 ? TrendingDown : TrendingUp) : null,
          },
        ].map((s, i) => (
          <div key={i} style={{
            padding: isMobile ? '0.8rem 0.55rem' : '1rem 0.85rem',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
            minWidth: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: isMobile ? '0.7rem' : '0.78rem',
              fontWeight: 900,
              color: s.isPrimary ? '#FFD700' : '#fff',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}>
              {s.icon && React.createElement(s.icon, { size: isMobile ? 12 : 13, strokeWidth: 2.6 })}
              {s.label}
            </div>
            <div style={{
              fontSize: isMobile ? '1.35rem' : '1.55rem',
              fontWeight: 900, color: s.color, lineHeight: 1,
              letterSpacing: '-0.025em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {s.val}
              <span style={{
                fontSize: isMobile ? '0.62rem' : '0.68rem',
                fontWeight: 700, opacity: 0.55, marginLeft: 4,
              }}>
                kg
              </span>
            </div>
            <div style={{
              fontSize: isMobile ? '0.66rem' : '0.72rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.55)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* "Wekelijkse Historie" dropdown verwijderd — die functie zit nu in de
          "Bekijk week progressie"-toggle van WeightHistory. */}

      {/* ═══ CHART — with optional plan line ═══ */}
      {chartData.length > 0 && (
        <div style={{
          padding: isMobile ? '0.625rem 0.5rem 0.5rem' : '0.875rem 0.75rem 0.625rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0 0.5rem 0.375rem' : '0 0.75rem 0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Activity size={isMobile ? 12 : 13} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>
                Gewicht Verloop
              </span>
            </div>
            <span style={{ fontSize: isMobile ? '0.45rem' : '0.5rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {chartData.length} entries
            </span>
          </div>

          <ResponsiveContainer width="100%" height={isMobile ? 120 : 150}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={isMobile ? 7 : 8}
                interval="preserveStartEnd" tick={{ fill: 'rgba(255,255,255,0.25)' }} />
              <YAxis stroke="rgba(255,255,255,0.1)" fontSize={isMobile ? 7 : 8}
                domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: 'rgba(255,255,255,0.25)' }} width={25} />
              <Tooltip content={<CustomTooltip />} />
              {/* Doel-referentielijn — horizontaal, groen, label rechts */}
              {targetWeightNum != null && (
                <ReferenceLine
                  y={targetWeightNum}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  label={{
                    value: `Doel ${targetWeightNum}`,
                    position: 'insideTopRight',
                    fill: 'rgba(16,185,129,0.85)',
                    fontSize: isMobile ? 8 : 9,
                    fontWeight: 700,
                  }}
                />
              )}
              {/* Plan-lijn — rood, doorgetrokken. Loopt door tot
                  client.goal_deadline. */}
              {hasPlanLine && (
                <Line type="monotone" dataKey="expected" stroke="#ef4444" strokeWidth={1.8}
                  dot={false} activeDot={false} connectNulls />
              )}
              {/* Actual weight line — solid gold */}
              <Line type="monotone" dataKey="weight" stroke="#FFD700" strokeWidth={1.5}
                dot={<CustomDot />} activeDot={{ r: 4, fill: '#FFA500' }} />
            </LineChart>
          </ResponsiveContainer>

          <div style={{
            display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap',
            marginTop: '0.25rem', fontSize: isMobile ? '0.45rem' : '0.5rem'
          }}>
            {fridayData?.friday_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: 'rgba(255,255,255,0.25)' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#8b5cf6' }} /> Vrijdag
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: 'rgba(255,255,255,0.25)' }}>
              <div style={{ width: '8px', height: '1.5px', background: '#FFD700' }} /> Werkelijk
            </span>
            {hasPlanLine && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: 'rgba(255,255,255,0.25)' }}>
                <div style={{ width: '8px', height: '1.5px', background: '#ef4444', borderRadius: '1px' }} /> Plan
              </span>
            )}
            {targetWeightNum != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: 'rgba(255,255,255,0.25)' }}>
                <div style={{ width: '8px', height: '1.5px', background: '#10b981', borderRadius: '1px' }} /> Doel
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
