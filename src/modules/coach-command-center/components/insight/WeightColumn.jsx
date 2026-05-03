// ============================================
// 📁 FILE: src/modules/coach-command-center/components/insight/WeightColumn.jsx
// Gewicht + Plan vs Werkelijkheid chart + Metingen + Foto's
// Props: { client, weightData, circumData, photos, coachingPlan, isMobile, onPhotoClick }
// ============================================
import React from 'react'
import { Scale, Target, Ruler, Camera, TrendingDown } from 'lucide-react'
import WeightStatsGrid from '../../../weight-tracker/components/WeightStatsGrid'

const formatDate = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) }

export default function WeightColumn({ client, weightData, circumData, photos, coachingPlan, isMobile, onPhotoClick }) {
  const history = weightData?.history || []
  const circumFields = [
    { key: 'waist_cm', label: 'Buik' }, { key: 'bicep_cm', label: 'Arm' },
    { key: 'chest_cm', label: 'Borst' }, { key: 'thigh_cm', label: 'Bovenbeen' }
  ]

  // ── Plan vs Werkelijkheid berekening ──
  const planChart = React.useMemo(() => {
    if (!coachingPlan?.plan) return null
    const plan = coachingPlan.plan
    const startWeight = parseFloat(plan.start_weight)
    const goalWeight = parseFloat(plan.goal_weight)
    const tdee = plan.tdee || 2500
    const adjustments = plan.adjustments || []
    const totalWeeks = plan.weeks_needed || coachingPlan.totalWeeks || 12
    const startDate = coachingPlan.startDate
    if (!startWeight || !startDate) return null

    const daysSinceStart = Math.floor((new Date() - new Date(startDate)) / 86400000)
    const currentWeek = Math.max(1, Math.ceil(daysSinceStart / 7))

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

    const getExpectedAtWeek = (w) => {
      let weight = startWeight
      for (let i = 1; i <= w; i++) {
        const targetCal = getTargetCalAtWeek(i)
        const weeklyLoss = ((tdee - targetCal) * 7) / 7700
        weight -= weeklyLoss
      }
      return Math.round(weight * 10) / 10
    }

    const getAvg = (weeksBack = 0) => {
      if (!history || history.length === 0) return null
      const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))
      const now = new Date(); now.setHours(0, 0, 0, 0)
      const end = new Date(now); end.setDate(now.getDate() - (weeksBack * 7))
      const start = new Date(end); start.setDate(end.getDate() - 7)
      const entries = sorted.filter(e => { const d = new Date(e.date); d.setHours(0, 0, 0, 0); return d >= start && d <= end })
      if (entries.length === 0) return null
      return Math.round((entries.reduce((t, e) => t + parseFloat(e.weight), 0) / entries.length) * 10) / 10
    }

    const displayWeeks = Math.min(totalWeeks, 26)
    const weeklyData = []
    for (let w = 0; w <= displayWeeks; w++) {
      weeklyData.push({ week: w, expected: getExpectedAtWeek(w), actual: w <= currentWeek ? getAvg(currentWeek - w) : null })
    }

    const currentAvg = getAvg(0)
    const expectedNow = getExpectedAtWeek(currentWeek)
    const diff = currentAvg ? Math.round((currentAvg - expectedNow) * 10) / 10 : null

    return { weeklyData, currentWeek, currentAvg, expectedNow, diff, goalWeight, displayWeeks }
  }, [coachingPlan, history])

  const renderPlanChart = () => {
    if (!planChart) return null
    const { weeklyData, currentWeek, diff, goalWeight, displayWeeks } = planChart
    const isOnTrack = diff !== null && Math.abs(diff) <= 1.0
    const isBehind = diff !== null && diff > 1.0
    const statusColor = diff === null ? 'rgba(255,255,255,0.25)' : isOnTrack ? '#10b981' : isBehind ? '#ef4444' : '#FFD700'
    const statusLabel = diff === null ? 'GEEN DATA' : isOnTrack ? 'OP SCHEMA' : isBehind ? 'ACHTER' : 'VOOR'

    const chartW = isMobile ? 260 : 300, chartH = 80
    const pad = { t: 6, r: 6, b: 14, l: 28 }
    const innerW = chartW - pad.l - pad.r, innerH = chartH - pad.t - pad.b
    const allWeights = weeklyData.flatMap(d => [d.expected, d.actual].filter(Boolean)).concat([goalWeight])
    const minWt = Math.min(...allWeights) - 0.5, maxWt = Math.max(...allWeights) + 0.5
    const xScale = (w) => pad.l + (w / Math.max(displayWeeks, 1)) * innerW
    const yScale = (v) => pad.t + ((maxWt - v) / (maxWt - minWt)) * innerH

    const expectedPath = weeklyData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.week)},${yScale(d.expected)}`).join(' ')
    const actualPoints = weeklyData.filter(d => d.actual !== null)
    const actualPath = actualPoints.length > 1 ? actualPoints.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.week)},${yScale(d.actual)}`).join(' ') : null

    return (
      <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <TrendingDown size={12} color="rgba(255,215,0,0.5)" />
            <span style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,215,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan vs Werkelijkheid</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor }} />
            <span style={{ fontSize: '0.4rem', fontWeight: '800', color: statusColor, textTransform: 'uppercase' }}>{statusLabel}</span>
            {diff !== null && <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)' }}>{diff > 0 ? '+' : ''}{diff}kg</span>}
          </div>
        </div>
        <svg width={chartW} height={chartH} style={{ display: 'block', maxWidth: '100%' }}>
          {[minWt, (minWt + maxWt) / 2, maxWt].map((v, i) => (
            <text key={i} x={pad.l - 3} y={yScale(v)} textAnchor="end" dominantBaseline="middle" style={{ fontSize: '6px', fill: 'rgba(255,255,255,0.15)' }}>{Math.round(v)}</text>
          ))}
          <line x1={pad.l} x2={chartW - pad.r} y1={yScale(goalWeight)} y2={yScale(goalWeight)} stroke="rgba(255,215,0,0.2)" strokeWidth="1" strokeDasharray="2,3" />
          <text x={chartW - pad.r + 1} y={yScale(goalWeight)} dominantBaseline="middle" style={{ fontSize: '5px', fill: '#FFD700' }}>{goalWeight}</text>
          <line x1={xScale(currentWeek)} x2={xScale(currentWeek)} y1={pad.t} y2={chartH - pad.b} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="2,2" />
          <path d={expectedPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="3,3" />
          {actualPath && <path d={actualPath} fill="none" stroke={statusColor} strokeWidth="2" />}
          {actualPoints.filter((_, i) => i === 0 || i === actualPoints.length - 1 || i % 2 === 0).map((d, i) => (
            <circle key={i} cx={xScale(d.week)} cy={yScale(d.actual)} r="2" fill={statusColor} />
          ))}
          {weeklyData.filter(d => d.week === 0 || d.week === currentWeek || d.week === displayWeeks).map(d => (
            <text key={d.week} x={xScale(d.week)} y={chartH - 2} textAnchor="middle"
              style={{ fontSize: '5px', fill: d.week === currentWeek ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)', fontWeight: d.week === currentWeek ? 700 : 400 }}>W{d.week}</text>
          ))}
        </svg>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}><div style={{ width: '8px', height: '1.5px', background: 'rgba(255,255,255,0.12)' }} /><span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.2)' }}>Plan</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}><div style={{ width: '8px', height: '2px', background: statusColor }} /><span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.2)' }}>Werkelijk</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}><div style={{ width: '8px', height: '1px', background: 'rgba(255,215,0,0.2)' }} /><span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.2)' }}>Doel</span></div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Scale size={14} color="#FFD700" />
        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gewicht & Body</span>
      </div>

      <div style={{ padding: isMobile ? '0.75rem' : '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>HUIDIG</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#FFD700', letterSpacing: '-0.03em', lineHeight: 1 }}>{weightData?.latest?.weight ? weightData.latest.weight.toFixed(1) : '—'}</span>
            <span style={{ fontSize: '0.5rem', fontWeight: '600', color: 'rgba(255,215,0,0.4)' }}>kg</span>
          </div>
        </div>
        {client.target_weight && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>DOEL</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem', justifyContent: 'flex-end' }}>
              <Target size={11} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>{parseFloat(client.target_weight).toFixed(1)}</span>
              <span style={{ fontSize: '0.45rem', fontWeight: '600', color: 'rgba(255,255,255,0.2)' }}>kg</span>
            </div>
            {client.goal_deadline && <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.15)', marginTop: '0.1rem' }}>{formatDate(client.goal_deadline)}</div>}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {renderPlanChart()}
        {history.length > 0 && <WeightStatsGrid stats={weightData?.stats || {}} client={client} fridayData={{ friday_count: weightData?.fridayCount || 0, total_fridays: 8 }} history={history} isMobile={isMobile} coachingPlan={coachingPlan} />}
        {history.length > 0 && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,215,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Gewicht</div>
            {history.slice(0, 8).map((e, idx) => (
              <div key={e.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.275rem 0', borderBottom: idx < 7 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{formatDate(e.date)}</span>
                  {e.is_friday_weighin && <span style={{ fontSize: '0.45rem', padding: '0.05rem 0.2rem', background: 'rgba(255,215,0,0.1)', borderRadius: '3px', color: '#FFD700', fontWeight: '700' }}>VR</span>}
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: idx === 0 ? '#FFD700' : '#fff' }}>{e.weight.toFixed(1)} kg</span>
              </div>
            ))}
          </div>
        )}
        {circumData?.latest && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Ruler size={12} color="rgba(255,215,0,0.5)" /><span style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,215,0,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Omtrek</span></div>
              <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>{formatDate(circumData.latest.measurement_date)}</span>
            </div>
            {circumFields.map(f => {
              const val = circumData.latest[f.key]; const prev = circumData.previous?.[f.key]
              if (!val) return null
              const d = prev ? parseFloat((val - prev).toFixed(1)) : null
              return (
                <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.275rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{f.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#FFD700' }}>{parseFloat(val).toFixed(1)}<span style={{ fontSize: '0.4rem', fontWeight: '500', opacity: 0.4 }}>cm</span></span>
                    {d !== null && d !== 0 && <span style={{ fontSize: '0.5rem', fontWeight: '700', color: d < 0 ? '#10b981' : '#ef4444' }}>{d > 0 ? '+' : ''}{d}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {photos.length > 0 && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Camera size={12} color="rgba(168,85,247,0.5)" /><span style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(168,85,247,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Foto's</span></div>
              <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>{photos.length}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.25rem' }}>
              {photos.slice(0, 6).map((p, idx) => (
                <div key={p.id} onClick={() => onPhotoClick(idx)} style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', flexShrink: 0 }}>
                  <img src={p.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              {photos.length > 6 && <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>+{photos.length - 6}</div>}
            </div>
          </div>
        )}
        {!history.length && !circumData?.latest && photos.length === 0 && !planChart && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Geen data</div>
        )}
      </div>
    </div>
  )
}
