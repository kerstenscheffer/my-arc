// Past-weeks stats viewer for weekly goals. Lets the coach scroll back
// through previous weeks and see, per goal, what the target was and what
// got achieved. Manual goals use the stored `manual_progress` snapshot;
// lead-kanban goals are recomputed for the selected week's date range.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Target, ChevronLeft, ChevronRight, Calendar, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react'
import WeekGoalsService from '../WeekGoalsService'
import LeadManagementService from '../../lead-management/LeadManagementService'

const GOLD = '#FFD700'
const GREEN = '#10b981'
const RED = '#ef4444'
const AMBER = '#f59e0b'

// Pull progress numbers for one specific week-range. Manual goals use the
// stored snapshot; lead-kanban goals re-query the lead service scoped to
// the week.
const fetchProgressForWeek = async ({ coachId, goals, leadService, weekStartDate }) => {
  const result = {}
  const weekStart = new Date(weekStartDate); weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7)

  const needsWeek = goals.some(g => g.source === 'leadkanban' && g.period === 'weekly')
  // Daily-period goals can't be evaluated retroactively across a full
  // week — they'd need per-day snapshots we don't keep. We render them
  // with a hint instead.

  let weekActivity = null, weekFunnel = null
  try {
    if (needsWeek) {
      const [a, f] = await Promise.all([
        leadService.getRangeActivity(coachId, weekStart.toISOString(), weekEnd.toISOString()),
        leadService.getRangeFunnelStats(coachId, weekStart.toISOString(), weekEnd.toISOString()),
      ])
      weekActivity = a; weekFunnel = f
    }
  } catch (e) {
    console.error('WeekGoalsStatsModal: fetchProgress failed:', e)
  }

  goals.forEach(g => {
    let value = 0
    let unsupported = false
    if (g.source === 'manual') {
      value = Number(g.manual_progress) || 0
    } else if (g.source === 'leadkanban') {
      if (g.period === 'daily') { unsupported = true }
      else {
        const a = weekActivity, f = weekFunnel
        switch (g.source_key) {
          case 'newOutreach':    value = a?.newOutreach ?? 0; break
          case 'callProposed':   value = f?.callProposed?.count ?? 0; break
          case 'callScheduled':  value = f?.callScheduled?.count ?? 0; break
          case 'sale':           value = f?.sale?.count ?? 0; break
          case 'noShow':         value = f?.noShow?.count ?? 0; break
          default: value = 0
        }
      }
    }
    result[g.id] = { value, unsupported }
  })
  return result
}

const weekLabel = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const end = new Date(d); end.setDate(end.getDate() + 6)
  const fmt = (x) => x.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })
  return `${fmt(d)} – ${fmt(end)}`
}

const shiftWeek = (iso, deltaWeeks) => {
  const d = new Date(iso)
  d.setDate(d.getDate() + deltaWeeks * 7)
  return WeekGoalsService.weekISO(d)
}

export default function WeekGoalsStatsModal({ db, coachId, isMobile, onClose }) {
  const [service] = useState(() => new WeekGoalsService(db))
  const [leadService] = useState(() => new LeadManagementService())

  // Default to LAST week — that's the primary use-case ("hoe ging het vorige week").
  const [weekStart, setWeekStart] = useState(() => shiftWeek(WeekGoalsService.weekISO(new Date()), -1))
  const [goals, setGoals] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)

  const thisWeekISO = useMemo(() => WeekGoalsService.weekISO(new Date()), [])
  const isFuture = weekStart > thisWeekISO

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!coachId) return
      setLoading(true)
      try {
        const data = await service.getGoalsForWeek(coachId, weekStart)
        if (cancelled) return
        setGoals(data)
        const prog = await fetchProgressForWeek({
          coachId, goals: data, leadService, weekStartDate: weekStart,
        })
        if (!cancelled) setProgress(prog)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [coachId, weekStart, service, leadService])

  const summary = useMemo(() => {
    let hit = 0, missed = 0, partial = 0
    goals.forEach(g => {
      const v = progress[g.id]?.value ?? 0
      const target = Number(g.target || 1)
      const pct = target > 0 ? v / target : 0
      if (pct >= 1) hit++
      else if (pct > 0) partial++
      else missed++
    })
    return { hit, partial, missed, total: goals.length }
  }, [goals, progress])

  const goPrev = () => setWeekStart(prev => shiftWeek(prev, -1))
  const goNext = () => { if (!isFuture) setWeekStart(prev => shiftWeek(prev, 1)) }

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        zIndex: 2147483630, padding: isMobile ? 0 : '1.5rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: isMobile ? '100%' : 520,
        maxHeight: isMobile ? '92vh' : '85vh',
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '14px 14px 0 0' : 14,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '0.875rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={15} color={GOLD} />
            <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 800 }}>
              Doelen-stats
            </span>
          </div>
          <button onClick={onClose} style={iconClose}>
            <X size={14} />
          </button>
        </div>

        {/* Week navigator */}
        <div style={{
          padding: '0.625rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <button onClick={goPrev} style={navBtn}>
            <ChevronLeft size={14} />
          </button>
          <div style={{
            flex: 1, textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              color: '#fff', fontSize: '0.85rem', fontWeight: 800,
            }}>
              <Calendar size={11} color="rgba(255,255,255,0.4)" />
              Week van {weekLabel(weekStart)}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.04em' }}>
              {weekStart === thisWeekISO ? 'DEZE WEEK' : weekStart === shiftWeek(thisWeekISO, -1) ? 'VORIGE WEEK' : 'EERDER'}
            </div>
          </div>
          <button onClick={goNext} disabled={isFuture || weekStart === thisWeekISO} style={{
            ...navBtn,
            opacity: (isFuture || weekStart === thisWeekISO) ? 0.3 : 1,
            cursor: (isFuture || weekStart === thisWeekISO) ? 'default' : 'pointer',
          }}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Summary */}
        {!loading && goals.length > 0 && (
          <div style={{
            padding: '0.6rem 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            fontSize: '0.7rem', fontWeight: 700,
          }}>
            <Stat color={GREEN} label="Gehaald" value={summary.hit} />
            <Stat color={AMBER} label="Gedeeltelijk" value={summary.partial} />
            <Stat color={RED} label="Gemist" value={summary.missed} />
            <Stat color="rgba(255,255,255,0.4)" label="Totaal" value={summary.total} />
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {loading ? (
            <div style={{
              padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem',
            }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Laden…
            </div>
          ) : goals.length === 0 ? (
            <div style={{
              padding: '2rem 1rem', textAlign: 'center',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem',
            }}>
              Geen doelen ingesteld voor deze week.
            </div>
          ) : (
            goals.map(g => {
              const v = progress[g.id]?.value ?? 0
              const unsupported = progress[g.id]?.unsupported
              const target = Number(g.target || 1)
              const pct = target > 0 ? Math.min(1, v / target) : 0
              const isHit = !unsupported && v >= target
              const isPartial = !unsupported && !isHit && v > 0
              const color = unsupported ? 'rgba(255,255,255,0.3)' : isHit ? GREEN : isPartial ? AMBER : RED
              return (
                <div key={g.id} style={{
                  padding: '0.7rem 0.85rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${unsupported ? 'rgba(255,255,255,0.06)' : `${color}30`}`,
                  borderRadius: 8, marginBottom: '0.4rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.82rem', marginBottom: 2 }}>
                        {g.label}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                        Target {target} · {g.period === 'daily' ? 'per dag' : 'per week'} · {g.source === 'leadkanban' ? `auto (${g.source_key})` : 'handmatig'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {unsupported ? (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', fontWeight: 700,
                        }}>
                          <AlertCircle size={10} />
                          Geen historie
                        </div>
                      ) : (
                        <>
                          <div style={{ color, fontWeight: 800, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {isHit && <CheckCircle2 size={14} />}
                            {v} / {target}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                            {Math.round(pct * 100)}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  {!unsupported && (
                    <div style={{
                      marginTop: '0.5rem',
                      height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct * 100}%`,
                        height: '100%',
                        background: color,
                        transition: 'width 0.2s ease',
                      }} />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  )
}

const Stat = ({ color, label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <span style={{ color, fontSize: '1rem', fontWeight: 800 }}>{value}</span>
    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
  </div>
)

const iconClose = {
  width: 28, height: 28,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: 'rgba(255,255,255,0.4)',
  cursor: 'pointer',
}
const navBtn = {
  width: 30, height: 30,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: '#fff',
  cursor: 'pointer',
  touchAction: 'manipulation',
}
