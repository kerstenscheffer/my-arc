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
  // Standaardplannen van de coach (is_template + is_public): voor een week
  // met minder tijd. Kiezen maakt een eigen kopie via de RPC.
  const [standaard, setStandaard] = useState([])
  const [openId, setOpenId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const [eigen, std] = await Promise.all([
          db.getClientWorkoutPlans(client.id),
          db.supabase.from('workout_schemas')
            .select('id, name, description, primary_goal, days_per_week, week_structure, equipment')
            .eq('is_template', true).eq('is_public', true)
            .or('is_archived.is.null,is_archived.eq.false')
            .order('days_per_week', { ascending: true }).order('name', { ascending: true })
            .then(r => r, () => ({ data: [] })),
        ])
        if (!alive) return
        setPlans(eigen?.plans || [])
        setStandaard(std?.data || [])
      } catch (e) { console.error('Plannen laden mislukt:', e); if (alive) { setPlans([]); setStandaard([]) } }
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

  const kiesStandaard = async (plan) => {
    if (busyId) return
    setBusyId(plan.id)
    try {
      const { error } = await db.supabase.rpc('kies_standaard_plan', { p_schema_id: plan.id })
      if (error) throw error
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
      onActivated && onActivated(plan)
    } catch (e) { console.error(e); alert('Kon dit plan niet kiezen: ' + (e?.message || 'probeer het nog eens')); setBusyId(null) }
  }

  // Zelfde dagenlijst voor eigen en standaardplannen.
  const PlanKaart = ({ p, actief, knop }) => {
    const open = openId === p.id
    const days = dayList(p.week_structure)
    return (
      <div style={{ borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${actief ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.08)'}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.8rem 0.85rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.015em' }}>{p.name || 'Trainingsplan'}</span>
              {actief && <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 900, color: '#000', background: '#fff', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Actief</span>}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={11} /> {p.days_per_week || days.length} dagen per week{p.primary_goal ? ` · ${p.primary_goal}` : ''}
            </div>
          </div>
          <button onClick={() => setOpenId(open ? null : p.id)} title="Bekijk plan" aria-label="Bekijk plan"
            style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          {knop}
        </div>
        {open && (
          <div style={{ padding: '0 0.85rem 0.85rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {days.length === 0 ? (
              <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)' }}>Geen dagen in dit plan.</div>
            ) : days.map(d => (
              <div key={d.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '0.55rem 0.7rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>{d.name}{d.focus ? ` · ${d.focus}` : ''} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>({d.count})</span></div>
                {d.exercises.length > 0 && (
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.4 }}>{d.exercises.join(' · ')}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const knopStijl = (bezig) => ({
    flexShrink: 0, minHeight: 40, padding: '0 0.8rem', borderRadius: 10,
    fontSize: '0.74rem', fontWeight: 900, color: '#000', background: '#fff', border: 'none',
    fontFamily: 'inherit', cursor: bezig ? 'default' : 'pointer', opacity: bezig ? 0.6 : 1,
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  const dayList = (ws) => {
    if (!ws || typeof ws !== 'object') return []
    return Object.keys(ws).sort().map(k => {
      const d = ws[k] || {}
      const exs = Array.isArray(d.exercises) ? d.exercises : []
      return { key: k, name: d.name || k, focus: d.focus || '', count: exs.length, exercises: exs.map(e => e.name).filter(Boolean) }
    })
  }

  // Standaardplannen gegroepeerd per aantal dagen; de klant kiest op tijd.
  const perDagen = standaard.reduce((acc, p) => {
    const k = p.days_per_week || dayList(p.week_structure).length || 0
    ;(acc[k] = acc[k] || []).push(p)
    return acc
  }, {})

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: isMobile ? '90vh' : '85vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? 'calc(0.8rem + env(safe-area-inset-top)) 0.9rem 0.7rem' : '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Dumbbell size={17} color="#fff" />
          <div style={{ flex: 1, color: '#fff', fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.02em' }}>Jouw trainingsplannen</div>
          <button onClick={onClose} aria-label="Sluit" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700 }}>Laden…</div>
          ) : (
            <>
              {plans.length === 0 ? (
                <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontWeight: 700 }}>
                  Je hebt nog geen toegewezen trainingsplan.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plans.map(p => (
                    <PlanKaart key={p.id} p={p} actief={p.isActive} knop={
                      p.isActive ? (
                        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 40, padding: '0 0.7rem', borderRadius: 10, fontSize: '0.74rem', fontWeight: 900, color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }}><Check size={13} strokeWidth={3} /> Actief</span>
                      ) : (
                        <button onClick={() => activate(p)} disabled={busyId === p.id} style={knopStijl(busyId === p.id)}>
                          {busyId === p.id ? '…' : 'Activeer'}
                        </button>
                      )
                    } />
                  ))}
                </div>
              )}

              {standaard.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Even een week minder tijd?</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2, marginBottom: 10, lineHeight: 1.4 }}>
                    Kies een lichter standaardplan. Je eigen plan blijft hierboven staan, dus je kunt altijd terug.
                  </div>
                  {Object.keys(perDagen).sort((a, b) => Number(a) - Number(b)).map(k => (
                    <div key={k} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px 2px' }}>
                        {k}× per week
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {perDagen[k].map(p => (
                          <PlanKaart key={p.id} p={p} actief={false} knop={
                            <button onClick={() => kiesStandaard(p)} disabled={!!busyId} style={knopStijl(busyId === p.id)}>
                              {busyId === p.id ? '…' : 'Kies dit plan'}
                            </button>
                          } />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
