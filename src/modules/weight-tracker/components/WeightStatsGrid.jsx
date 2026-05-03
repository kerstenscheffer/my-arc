// src/modules/weight-tracker/components/WeightStatsGrid.jsx
// v4.0 — flush stat bar, borderBottom dividers, compact chart + plan line
// Props: { stats, client, fridayData, history, isMobile, coachingPlan }

import React, { useState, useMemo } from 'react'
import { TrendingDown, TrendingUp, Calendar, ChevronDown, ChevronUp, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function WeightStatsGrid({ stats = {}, client = {}, fridayData = {}, history = [], isMobile = false, coachingPlan = null }) {
  const [showWeekly, setShowWeekly] = useState(false)
  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))
  
  const getRolling = (offset = 0) => {
    if (sortedHistory.length === 0) return null
    const today = new Date(); today.setHours(0,0,0,0)
    const end = new Date(today); end.setDate(today.getDate() - offset)
    const start = new Date(end); start.setDate(end.getDate() - 7)
    const entries = sortedHistory.filter(e => {
      const d = new Date(e.date); d.setHours(0,0,0,0)
      return d >= start && d <= end
    })
    if (entries.length === 0) return null
    const sum = entries.reduce((t, e) => t + parseFloat(e.weight), 0)
    return { avg: parseFloat((sum / entries.length).toFixed(1)), count: entries.length,
      startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
  }
  
  const getAllWeeks = () => {
    const weeks = []
    for (let i = 0; i < 12; i++) {
      const d = getRolling(i * 7)
      if (d) weeks.push({
        ...d,
        weekStart: new Date(d.startDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
        weekEnd: new Date(d.endDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
        isCurrent: i === 0
      })
    }
    return weeks.reverse()
  }
  
  const allWeeks = getAllWeeks()
  const cur = allWeeks[allWeeks.length - 1] || null
  const prev = allWeeks.length > 1 ? allWeeks[allWeeks.length - 2] : null
  const first = allWeeks[0] || null
  const weekChange = (cur && prev) ? parseFloat((cur.avg - prev.avg).toFixed(1)) : null
  const totalChange = (cur && first) ? parseFloat((cur.avg - first.avg).toFixed(1)) : null
  
  // ═══ Chart data with optional plan line ═══
  const chartData = useMemo(() => {
    const data = sortedHistory.slice(-30).map(e => ({
      date: new Date(e.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      rawDate: e.date,
      weight: parseFloat(e.weight),
      isFriday: e.is_friday_weighin
    }))

    // Add expected weight from coaching plan if available
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

          // Calculate cumulative weight loss up to this fractional week
          let weight = startWeight
          const fullWeeks = Math.floor(weekNum)
          for (let i = 1; i <= fullWeeks; i++) {
            const targetCal = getTargetCalAtWeek(i)
            const weeklyLoss = ((tdee - targetCal) * 7) / 7700
            weight -= weeklyLoss
          }
          // Fractional week
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
      }
    }

    return data
  }, [sortedHistory, coachingPlan])

  const hasPlanLine = chartData.some(d => d.expected != null)
  
  const CustomDot = (p) => p.payload.isFriday
    ? <circle cx={p.cx} cy={p.cy} r={3} fill="#8b5cf6" stroke="#000" strokeWidth={1} />
    : <circle cx={p.cx} cy={p.cy} r={1.5} fill="#FFD700" />
  
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null
    const data = payload[0].payload
    return (
      <div style={{
        background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '4px', padding: '0.3rem 0.4rem'
      }}>
        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.65rem' }}>{payload[0].value.toFixed(1)} kg</div>
        {data.expected != null && (
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.55rem' }}>Plan: {data.expected} kg</div>
        )}
        <div style={{ color: '#FFD700', fontSize: '0.55rem' }}>{data.date}</div>
      </div>
    )
  }
  
  return (
    <div>
      {/* ═══ 4-COLUMN STAT BAR ═══ */}
      <div style={{
        display: 'flex',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(10, 10, 10, 0.5)'
      }}>
        {[
          { label: 'DEZE WEEK', val: cur ? `${cur.avg}` : '--', sub: cur ? `${cur.count}x` : '-', gold: true },
          { label: 'VORIGE', val: prev ? `${prev.avg}` : '--', sub: prev ? `${prev.count}x` : '-', gold: false },
          { label: 'VERSCHIL', val: weekChange !== null ? `${weekChange > 0?'+':''}${weekChange}` : '--', sub: 'w/w', gold: false, icon: weekChange ? (weekChange < 0 ? TrendingDown : TrendingUp) : null },
          { label: 'TOTAAL', val: totalChange !== null ? `${totalChange > 0?'+':''}${totalChange}` : '--', sub: 'start', gold: false, icon: totalChange ? (totalChange < 0 ? TrendingDown : TrendingUp) : null }
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1,
            padding: isMobile ? '0.5rem 0.25rem' : '0.625rem 0.5rem',
            borderRight: i < 3 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            {s.icon && React.createElement(s.icon, { size: isMobile ? 10 : 12, color: s.gold ? '#FFD700' : 'rgba(255,255,255,0.3)', style: { marginBottom: '0.15rem' } })}
            <div style={{
              fontSize: isMobile ? '0.45rem' : '0.5rem',
              fontWeight: '700', color: s.gold ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem'
            }}>{s.label}</div>
            <div style={{
              fontSize: isMobile ? '0.9rem' : '1.05rem',
              fontWeight: '800', color: s.gold ? '#FFD700' : '#fff', lineHeight: 1
            }}>
              {s.val}<span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', fontWeight: '500', opacity: 0.4, marginLeft: '0.1rem' }}>kg</span>
            </div>
            <div style={{
              fontSize: isMobile ? '0.45rem' : '0.5rem',
              color: 'rgba(255,255,255,0.2)', marginTop: '0.1rem'
            }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ═══ WEEKLY HISTORY — collapsible ═══ */}
      {allWeeks.length > 0 && (
        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <button onClick={() => setShowWeekly(!showWeekly)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.5rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={isMobile ? 12 : 13} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>
                Wekelijkse Historie
              </span>
            </div>
            {showWeekly ? <ChevronUp size={14} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.3)" />}
          </button>

          {showWeekly && (
            <div style={{
              maxHeight: isMobile ? '200px' : '240px', overflowY: 'auto',
              padding: isMobile ? '0 1rem 0.5rem' : '0 1.5rem 0.625rem'
            }}>
              {allWeeks.map((w, idx) => {
                const p = idx > 0 ? allWeeks[idx-1] : null
                const ch = p ? parseFloat((w.avg - p.avg).toFixed(1)) : null
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: isMobile ? '0.35rem 0' : '0.4rem 0',
                    borderBottom: idx < allWeeks.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.6rem' : '0.65rem',
                      color: w.isCurrent ? '#FFD700' : 'rgba(255,255,255,0.5)',
                      fontWeight: w.isCurrent ? '700' : '500', minWidth: isMobile ? '90px' : '110px'
                    }}>{w.weekStart} — {w.weekEnd}</span>
                    <span style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      color: w.isCurrent ? '#FFD700' : '#fff', fontWeight: '700'
                    }}>{w.avg} kg</span>
                    <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.25)', minWidth: '20px', textAlign: 'right' }}>{w.count}x</span>
                    {ch !== null ? (
                      <span style={{
                        fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: '700',
                        color: ch < 0 ? '#10b981' : ch > 0 ? '#dc2626' : 'rgba(255,255,255,0.2)',
                        minWidth: '35px', textAlign: 'right'
                      }}>{ch > 0 ? '+' : ''}{ch}</span>
                    ) : <span style={{ minWidth: '35px' }} />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
              {/* Plan line — dashed, subtle */}
              {hasPlanLine && (
                <Line type="monotone" dataKey="expected" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}
                  strokeDasharray="4 3" dot={false} activeDot={false} connectNulls />
              )}
              {/* Actual weight line — solid gold */}
              <Line type="monotone" dataKey="weight" stroke="#FFD700" strokeWidth={1.5}
                dot={<CustomDot />} activeDot={{ r: 4, fill: '#FFA500' }} />
            </LineChart>
          </ResponsiveContainer>

          <div style={{
            display: 'flex', gap: '0.75rem', justifyContent: 'center',
            marginTop: '0.25rem', fontSize: isMobile ? '0.45rem' : '0.5rem'
          }}>
            {fridayData?.friday_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: 'rgba(255,255,255,0.25)' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#8b5cf6' }} /> Vrijdag
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: 'rgba(255,255,255,0.25)' }}>
              <div style={{ width: '8px', height: '1.5px', background: '#FFD700' }} /> Trend
            </span>
            {hasPlanLine && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', color: 'rgba(255,255,255,0.25)' }}>
                <div style={{ width: '8px', height: '1.5px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }} /> Plan
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
