// src/modules/productivity/components/time/TimeInsightsHub.jsx
// Tijdsoverzicht per categorie, per dag, recente sessies

import { useState, useEffect } from 'react'
import { Timer, TrendingUp, BarChart2, Clock, Tag } from 'lucide-react'

const GOAL_CATEGORIES = [
  { id: 'building',    label: 'Building',    color: '#3b82f6' },
  { id: 'coaching',    label: 'Coaching',    color: '#10b981' },
  { id: 'advertising', label: 'Advertising', color: '#f59e0b' },
  { id: 'overig',      label: 'Overig',      color: '#6b7280' }
]

const RANGES = [
  { label: '7d',  days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 }
]

const fmtMins = (mins) => {
  if (!mins) return '0m'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}u ${m}m` : `${h}u`
}

const fmtDay = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

const fmtTime = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

export default function TimeInsightsHub({ productivityService, coachId, isMobile }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(7)

  useEffect(() => { loadStats() }, [range])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await productivityService.getTimeStats(coachId, range)
      setStats(data)
    } catch (err) {
      console.error('❌ Load time stats failed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'tiSpin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!stats || stats.sessionCount === 0) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>
        <Timer size={28} style={{ marginBottom: '0.5rem', opacity: 0.2 }} />
        <div>Nog geen tijdssessies gelogd.</div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.6rem' }}>Start een task via de ▶ knop om tijd bij te houden.</div>
      </div>
    )
  }

  const maxCatMins = Math.max(...Object.values(stats.byCategory), 1)
  const dayEntries = Object.entries(stats.byDay).sort(([a], [b]) => a.localeCompare(b))
  const maxDayMins = Math.max(...dayEntries.map(([, v]) => v), 1)

  return (
    <div style={{ transform: 'translateZ(0)' }}>

      {/* ═══ RANGE FILTER + TOTAAL ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.625rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
          <span style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: '800', color: '#fff' }}>{fmtMins(stats.totalMinutes)}</span>
          <span style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>TOTAAL · {stats.sessionCount} SESSIES</span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {RANGES.map(r => (
            <button key={r.days} onClick={() => setRange(r.days)}
              style={{ padding: '0.2rem 0.4rem', background: range === r.days ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${range === r.days ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '4px', color: range === r.days ? '#3b82f6' : 'rgba(255,255,255,0.3)', fontSize: '0.55rem', fontWeight: '700', cursor: 'pointer', minHeight: '24px', touchAction: 'manipulation' }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ PER CATEGORIE ═══ */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Tag size={10} color="rgba(255,255,255,0.2)" />
          <span style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PER CATEGORIE</span>
        </div>

        {GOAL_CATEGORIES.map(cat => {
          const mins = stats.byCategory[cat.id] || 0
          if (mins === 0) return null
          const pct = Math.round((mins / maxCatMins) * 100)
          const totalPct = stats.totalMinutes > 0 ? Math.round((mins / stats.totalMinutes) * 100) : 0

          return (
            <div key={cat.id} style={{ padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>{cat.label}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: '800', color: cat.color }}>{fmtMins(mins)}</span>
                <span style={{ fontSize: '0.45rem', fontWeight: '600', color: 'rgba(255,255,255,0.2)', minWidth: '28px', textAlign: 'right' }}>{totalPct}%</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: '2px', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )
        })}

        {/* Onbekende categorieën */}
        {Object.entries(stats.byCategory)
          .filter(([id]) => !GOAL_CATEGORIES.find(c => c.id === id))
          .map(([id, mins]) => {
            const pct = Math.round((mins / maxCatMins) * 100)
            const totalPct = stats.totalMinutes > 0 ? Math.round((mins / stats.totalMinutes) * 100) : 0
            return (
              <div key={id} style={{ padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6b7280', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>{id}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '800', color: '#6b7280' }}>{fmtMins(mins)}</span>
                  <span style={{ fontSize: '0.45rem', fontWeight: '600', color: 'rgba(255,255,255,0.2)', minWidth: '28px', textAlign: 'right' }}>{totalPct}%</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#6b7280', borderRadius: '2px' }} />
                </div>
              </div>
            )
          })}
      </div>

      {/* ═══ PER DAG (laatste 7 dagen) ═══ */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <BarChart2 size={10} color="rgba(255,255,255,0.2)" />
          <span style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PER DAG</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem', padding: isMobile ? '0.375rem 0.75rem 0.625rem' : '0.375rem 1rem 0.625rem', height: '80px' }}>
          {dayEntries.map(([date, dayMins]) => {
            const barPct = maxDayMins > 0 ? (dayMins / maxDayMins) : 0
            const isToday = date === new Date().toISOString().split('T')[0]
            const dayLabel = new Date(date).toLocaleDateString('nl-NL', { weekday: 'short' })

            return (
              <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.4rem', fontWeight: '700', color: dayMins > 0 ? '#fff' : 'transparent' }}>{dayMins > 0 ? fmtMins(dayMins) : ''}</span>
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: '3px 3px 0 0', height: '52px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: `${Math.max(barPct * 100, dayMins > 0 ? 8 : 0)}%`, background: isToday ? '#3b82f6' : 'rgba(59,130,246,0.4)', borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease' }} />
                </div>
                <span style={{ fontSize: '0.4rem', fontWeight: '600', color: isToday ? '#3b82f6' : 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{dayLabel}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ RECENTE SESSIES ═══ */}
      <div>
        <div style={{ padding: isMobile ? '0.4rem 0.75rem' : '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <Clock size={10} color="rgba(255,255,255,0.2)" />
          <span style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>RECENTE SESSIES</span>
        </div>

        {stats.logs.slice(0, 15).map(log => {
          const cat = GOAL_CATEGORIES.find(c => c.id === log.category)
          const catColor = cat?.color || '#6b7280'
          return (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: isMobile ? '0.35rem 0.75rem' : '0.35rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.025)', borderLeft: `3px solid ${catColor}30` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.task_title}</div>
                <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)', marginTop: '1px' }}>{fmtDay(log.logged_at)} · {fmtTime(log.logged_at)}</div>
              </div>
              <span style={{ padding: '1px 5px', background: `${catColor}12`, border: `1px solid ${catColor}20`, borderRadius: '3px', fontSize: '0.45rem', fontWeight: '600', color: catColor, flexShrink: 0 }}>
                {cat?.label || log.category}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#fff', flexShrink: 0, minWidth: '30px', textAlign: 'right' }}>
                {fmtMins(log.minutes_spent)}
              </span>
            </div>
          )
        })}
      </div>

      <style>{`@keyframes tiSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
