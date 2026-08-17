// src/modules/workout/components/PlanSwitchModal.jsx
// Client-kant: bekijk alle door de coach toegewezen workout-plannen en activeer
// er één. Het actieve plan staat bovenaan; andere plannen kun je inzien
// (dagen + oefeningen) en met één tik activeren.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, ChevronDown, Dumbbell, Calendar } from 'lucide-react'

export default function PlanSwitchModal({ client, db, isMobile = false, onClose, onActivated }) {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState([])
  const [openId, setOpenId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const { plans } = await db.getClientWorkoutPlans(client.id)
        if (alive) setPlans(plans || [])
      } catch (e) { console.error('Plannen laden mislukt:', e); if (alive) setPlans([]) }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [db, client?.id])

  const activate = async (plan) => {
    if (plan.isActive || busyId) return
    setBusyId(plan.id)
    try {
      const res = await db.setActiveWorkoutPlan(client.id, plan.id)
      if (!res?.success) throw new Error(res?.error || 'Activeren mislukt')
      onActivated && onActivated(plan)
    } catch (e) { console.error(e); alert('Activeren mislukt.'); setBusyId(null) }
  }

  const dayList = (ws) => {
    if (!ws || typeof ws !== 'object') return []
    return Object.keys(ws).sort().map(k => {
      const d = ws[k] || {}
      const exs = Array.isArray(d.exercises) ? d.exercises : []
      return { key: k, name: d.name || k, focus: d.focus || '', count: exs.length, exercises: exs.map(e => e.name).filter(Boolean) }
    })
  }

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: isMobile ? '90vh' : '85vh', display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(255,215,0,0.22)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? 'calc(0.8rem + env(safe-area-inset-top)) 0.9rem 0.7rem' : '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Dumbbell size={17} color="#FFD700" />
          <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>Jouw trainingsplannen</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Laden…</div>
          ) : plans.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              Je hebt nog geen toegewezen trainingsplan.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plans.map(p => {
                const open = openId === p.id
                const days = dayList(p.week_structure)
                return (
                  <div key={p.id} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${p.isActive ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.08)'}`, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.8rem 0.85rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Trainingsplan'}</span>
                          {p.isActive && <span style={{ flexShrink: 0, fontSize: '0.55rem', fontWeight: 900, color: '#000', background: '#FFD700', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Actief</span>}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={11} /> {p.days_per_week || days.length} dagen/week{p.primary_goal ? ` · ${p.primary_goal}` : ''}
                        </div>
                      </div>
                      <button onClick={() => setOpenId(open ? null : p.id)} title="Bekijk plan"
                        style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                      </button>
                      {p.isActive ? (
                        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.4rem 0.65rem', borderRadius: 8, fontSize: '0.66rem', fontWeight: 800, color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)' }}><Check size={13} /> Actief</span>
                      ) : (
                        <button onClick={() => activate(p)} disabled={busyId === p.id}
                          style={{ flexShrink: 0, padding: '0.4rem 0.7rem', borderRadius: 8, fontSize: '0.66rem', fontWeight: 800, color: '#000', background: '#FFD700', border: 'none', cursor: busyId === p.id ? 'default' : 'pointer', opacity: busyId === p.id ? 0.6 : 1 }}>
                          {busyId === p.id ? '…' : 'Activeer'}
                        </button>
                      )}
                    </div>
                    {open && (
                      <div style={{ padding: '0 0.85rem 0.85rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {days.length === 0 ? (
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Geen dagen in dit plan.</div>
                        ) : days.map(d => (
                          <div key={d.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '0.55rem 0.7rem' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fff' }}>{d.name}{d.focus ? ` · ${d.focus}` : ''} <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>({d.count})</span></div>
                            {d.exercises.length > 0 && (
                              <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.4 }}>{d.exercises.join(' · ')}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
