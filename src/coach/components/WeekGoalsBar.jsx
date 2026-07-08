// src/coach/components/WeekGoalsBar.jsx
// Fixed-top overlay bar that pins to the CoachHub header. Collapsed state:
// a thin strip with "X / Y doelen op schema". Expanded: a sheet that lists
// every goal with a live progress bar.
//
// Lead-kanban goals (source='leadkanban') pull their progress from
// LeadManagementService. Manual goals show +/− buttons so the coach can
// tap progress as he works.
//
// The bar does NOT push page content — it floats over CoachHub via `fixed`.

import { useCallback, useEffect, useState } from 'react'
import {
  Target, ChevronDown, ChevronUp, Plus, Minus, CheckCircle2, Loader2, Calendar,
} from 'lucide-react'
import WeekGoalsService from '../../modules/productivity/WeekGoalsService'
import LeadManagementService from '../../modules/lead-management/LeadManagementService'

const GOLD = '#FFD700'
const GREEN = '#10b981'

// Pull all the progress numbers in one shot. Lead-kanban goals share the
// same two service calls (one for activity, one for funnel) regardless of
// how many goals point at them.
const fetchProgress = async ({ coachId, goals, leadService }) => {
  const result = {}
  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const needsWeek = goals.some(g => g.source === 'leadkanban' && g.period === 'weekly')
  const needsDay  = goals.some(g => g.source === 'leadkanban' && g.period === 'daily')

  let weekActivity = null, weekFunnel = null, dayActivity = null, dayFunnel = null
  try {
    if (needsWeek) {
      const [a, f] = await Promise.all([
        leadService.getRangeActivity(coachId, weekStart.toISOString(), weekEnd.toISOString()),
        leadService.getRangeFunnelStats(coachId, weekStart.toISOString(), weekEnd.toISOString()),
      ])
      weekActivity = a; weekFunnel = f
    }
    if (needsDay) {
      const [a, f] = await Promise.all([
        leadService.getRangeActivity(coachId, today.toISOString(), tomorrow.toISOString()),
        leadService.getRangeFunnelStats(coachId, today.toISOString(), tomorrow.toISOString()),
      ])
      dayActivity = a; dayFunnel = f
    }
  } catch (e) {
    console.error('WeekGoalsBar: fetchProgress failed:', e)
  }

  goals.forEach(g => {
    let value = 0
    if (g.source === 'manual') {
      value = Number(g.manual_progress) || 0
    } else if (g.source === 'leadkanban') {
      const a = g.period === 'daily' ? dayActivity : weekActivity
      const f = g.period === 'daily' ? dayFunnel : weekFunnel
      switch (g.source_key) {
        case 'newOutreach':    value = a?.newOutreach ?? 0; break
        case 'callProposed':   value = f?.callProposed?.count ?? 0; break
        case 'callScheduled':  value = f?.callScheduled?.count ?? 0; break
        case 'sale':           value = f?.sale?.count ?? 0; break
        case 'noShow':         value = f?.noShow?.count ?? 0; break
        default: value = 0
      }
    }
    result[g.id] = value
  })
  return result
}

export default function WeekGoalsBar({ db, coachId, isMobile: propMobile }) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)

  const [service] = useState(() => new WeekGoalsService(db))
  const [leadService] = useState(() => new LeadManagementService())
  const [goals, setGoals] = useState([])
  const [progress, setProgress] = useState({})
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const weekStart = WeekGoalsService.weekISO(new Date())

  const reloadGoals = useCallback(async () => {
    if (!coachId) {
      console.log('[WeekGoalsBar] skip — no coachId yet')
      return
    }
    setLoading(true)
    try {
      const data = await service.getGoalsForWeek(coachId, weekStart)
      console.log('[WeekGoalsBar] loaded goals:', data.length, 'for week', weekStart, data)
      setGoals(data)
      const prog = await fetchProgress({ coachId, goals: data, leadService })
      console.log('[WeekGoalsBar] progress:', prog)
      setProgress(prog)
    } catch (e) {
      console.error('[WeekGoalsBar] reload failed:', e)
    } finally {
      setLoading(false)
    }
  }, [coachId, weekStart, service, leadService])

  useEffect(() => { reloadGoals() }, [reloadGoals])

  // Listen for goal-CRUD events fired by WeekGoalsManager so the bar
  // reflects new/edited/deleted goals immediately — no hard refresh.
  useEffect(() => {
    const handler = () => reloadGoals()
    window.addEventListener('myarc:weekly-goals-updated', handler)
    return () => window.removeEventListener('myarc:weekly-goals-updated', handler)
  }, [reloadGoals])

  // Refresh progress (not the goals list) every 90s so lead-kanban counts
  // stay live without thrashing the DB.
  useEffect(() => {
    if (!coachId || goals.length === 0) return
    const t = setInterval(async () => {
      const prog = await fetchProgress({ coachId, goals, leadService })
      setProgress(prog)
    }, 90 * 1000)
    return () => clearInterval(t)
  }, [coachId, goals, leadService])

  const handleManual = async (goal, delta) => {
    if (busy) return
    setBusy(true)
    // Optimistic update so the tap feels instant.
    setProgress(prev => ({ ...prev, [goal.id]: Math.max(0, (prev[goal.id] || 0) + delta) }))
    try { await service.incrementManualProgress(goal.id, delta) }
    catch (e) { console.error('Manual progress update failed:', e); reloadGoals() }
    finally { setBusy(false) }
  }

  const totalDone = goals.filter(g => (progress[g.id] || 0) >= Number(g.target || 1)).length
  const hasGoals = goals.length > 0

  // Collapsed strip — always rendered. Height kept small so it doesn't
  // dominate the screen but the gold accent + counter pull the eye.
  return (
    <div data-goalsbar="1" style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 950,
      paddingTop: 'env(safe-area-inset-top)',
      pointerEvents: 'none', // children opt in
    }}>
      {/* Collapsed strip */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          pointerEvents: 'auto',
          width: '100%',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          minHeight: 32,
          background: hasGoals
            ? 'linear-gradient(180deg, rgba(255,215,0,0.18) 0%, rgba(0,0,0,0.85) 100%)'
            : 'rgba(0,0,0,0.85)',
          border: 'none',
          borderBottom: '1px solid rgba(255,215,0,0.25)',
          color: '#fff',
          cursor: 'pointer',
          touchAction: 'manipulation',
        }}
      >
        <Target size={13} color={GOLD} />
        <span style={{
          fontSize: '0.7rem', fontWeight: 800, color: GOLD,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Doelen week
        </span>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700,
          color: hasGoals ? '#fff' : 'rgba(255,255,255,0.35)',
        }}>
          {hasGoals ? `${totalDone} / ${goals.length}` : 'Nog geen doelen — open ProductivityHub'}
        </span>
        <span style={{ flex: 1 }} />
        {hasGoals && (
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </button>

      {/* Expanded sheet */}
      {open && hasGoals && (
        <>
          {/* Invisible click-catcher so tapping outside collapses the sheet.
              Previously this had a 55% black wash which made the sheet's
              own dark background look even darker — now transparent. */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'transparent',
              pointerEvents: 'auto',
              top: 'calc(32px + env(safe-area-inset-top))',
              zIndex: 1,
            }}
          />
          <div style={{
            position: 'relative', zIndex: 2,
            pointerEvents: 'auto',
            background: '#0a0a0a',
            borderBottom: '1px solid rgba(255,215,0,0.25)',
            maxHeight: '70vh', overflowY: 'auto',
            animation: 'wgbSlide 0.22s ease',
            padding: '0.55rem 0.7rem 0.85rem',
          }}>
            {loading ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.4rem', padding: '1rem',
                color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem',
              }}>
                <Loader2 size={14} className="wgb-spin" /> Laden…
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.2rem 0.25rem 0.55rem',
                }}>
                  <Calendar size={11} color={GOLD} />
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800,
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    Week start {weekStart}
                  </span>
                </div>

                {goals.map(g => {
                  const value = Math.round(Number(progress[g.id] || 0))
                  const target = Number(g.target || 1)
                  const pct = Math.min(100, Math.round((value / target) * 100))
                  const done = value >= target
                  return (
                    <div key={g.id} style={{
                      padding: '0.55rem 0.6rem',
                      borderRadius: 8,
                      background: done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.025)',
                      border: done ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.05)',
                      marginBottom: '0.4rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {done
                          ? <CheckCircle2 size={14} color={GREEN} strokeWidth={2.6} />
                          : <Target size={13} color={GOLD} />}
                        <span style={{
                          flex: 1, color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {g.label}
                        </span>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 800,
                          color: done ? GREEN : GOLD, fontFamily: 'monospace',
                        }}>
                          {value} / {target}
                        </span>
                        <span style={{
                          fontSize: '0.5rem', fontWeight: 700,
                          padding: '1px 5px', borderRadius: 4,
                          background: 'rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.5)',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          {g.period === 'daily' ? 'Dag' : 'Week'}
                        </span>
                      </div>

                      <div style={{
                        marginTop: '0.4rem',
                        height: 5, borderRadius: 3, overflow: 'hidden',
                        background: 'rgba(255,255,255,0.06)',
                      }}>
                        <div style={{
                          width: `${pct}%`, height: '100%',
                          background: done
                            ? GREEN
                            : `linear-gradient(90deg, ${GOLD} 0%, #D4AF37 100%)`,
                          transition: 'width 0.3s ease',
                        }} />
                      </div>

                      {g.source === 'manual' && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          marginTop: '0.5rem',
                        }}>
                          <button
                            onClick={() => handleManual(g, -1)}
                            disabled={busy}
                            style={mPlusBtn(false)}
                            title="−1"
                          ><Minus size={13} /></button>
                          <button
                            onClick={() => handleManual(g, 1)}
                            disabled={busy}
                            style={mPlusBtn(true)}
                            title="+1"
                          ><Plus size={13} /></button>
                          <span style={{ flex: 1 }} />
                          <span style={{
                            fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)',
                            fontWeight: 700, letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}>handmatig</span>
                        </div>
                      )}
                      {g.source === 'leadkanban' && (
                        <div style={{
                          marginTop: '0.4rem',
                          fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)',
                          fontWeight: 700, letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}>
                          auto · lead kanban · {g.source_key}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes wgbFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes wgbSlide {
          from { transform: translateY(-10px); opacity: 0 }
          to   { transform: translateY(0); opacity: 1 }
        }
        @keyframes wgbSpin { to { transform: rotate(360deg) } }
        .wgb-spin { animation: wgbSpin 1s linear infinite; }
      `}</style>
    </div>
  )
}

const mPlusBtn = (primary) => ({
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: primary ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.06)',
  border: primary ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: primary ? GOLD : 'rgba(255,255,255,0.75)',
  cursor: 'pointer', touchAction: 'manipulation',
})
