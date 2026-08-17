// src/modules/manual-workout-builder/components/ClientPlanManagerModal.jsx
// Coach-side plan-manager: kies een klant → zie z'n actieve plan + reserve-
// plannen → activeer/verwijder, of wijs een extra plan toe vanuit je templates.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, ChevronLeft, ChevronRight, Plus, Trash2, Dumbbell, Star, Pencil } from 'lucide-react'

const GOLD = '#FFD700'

export default function ClientPlanManagerModal({ clients = [], templates = [], db, isMobile = false, onClose, onEditInBuilder }) {
  const [sel, setSel] = useState(null)          // gekozen klant
  const [query, setQuery] = useState('')
  const [data, setData] = useState(null)        // { plans, activeId }
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(null)        // schema/template id in behandeling
  const [picking, setPicking] = useState(false) // template-picker open

  const load = async (clientId) => {
    setLoading(true)
    try { setData(await db.getClientWorkoutPlans(clientId)) }
    catch (e) { console.error(e); setData({ plans: [], activeId: null }) }
    finally { setLoading(false) }
  }
  useEffect(() => { if (sel?.id) load(sel.id) }, [sel?.id])

  const openClient = (c) => { setSel(c); setPicking(false); setData(null) }
  const back = () => { setSel(null); setData(null); setPicking(false) }

  const activate = async (schemaId) => {
    setBusy(schemaId)
    try { const r = await db.setActiveWorkoutPlan(sel.id, schemaId); if (!r?.success) throw new Error(r?.error); await load(sel.id) }
    catch (e) { console.error(e); alert('Activeren mislukt.') } finally { setBusy(null) }
  }
  const remove = async (schemaId) => {
    if (!confirm('Dit plan verwijderen bij deze klant?')) return
    setBusy(schemaId)
    try { await db.removeClientPlan(sel.id, schemaId); await load(sel.id) }
    catch (e) { console.error(e); alert('Verwijderen mislukt.') } finally { setBusy(null) }
  }
  const assignTemplate = async (tpl) => {
    setBusy(tpl.id)
    try {
      const r = await db.assignTemplateToClient(tpl.id, sel.id, false)
      if (!r?.success) throw new Error(r?.error)
      setPicking(false); await load(sel.id)
    } catch (e) { console.error(e); alert('Toewijzen mislukt.') } finally { setBusy(null) }
  }

  const filtered = clients
    .filter(c => `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => `${a.first_name}`.localeCompare(`${b.first_name}`))

  const plans = data?.plans || []
  const active = plans.find(p => p.isActive)
  const reserve = plans.filter(p => !p.isActive)

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, height: isMobile ? '92vh' : '82vh', display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(255,215,0,0.22)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? 'calc(0.8rem + env(safe-area-inset-top)) 0.9rem 0.7rem' : '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {sel && <button onClick={back} style={iconBtn}><ChevronLeft size={17} /></button>}
          <Dumbbell size={16} color={GOLD} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, color: '#fff', fontWeight: 800, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sel ? `${sel.first_name || ''} ${sel.last_name || ''}`.trim() : 'Plannen toewijzen'}
          </div>
          <button onClick={onClose} style={iconBtn}><X size={16} /></button>
        </div>

        {/* ── KLANTLIJST ── */}
        {!sel ? (
          <>
            <div style={{ flexShrink: 0, padding: '0.75rem 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '0.5rem 0.7rem' }}>
                <Search size={15} color="rgba(255,255,255,0.4)" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Zoek klant…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.85rem' }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map(c => (
                <button key={c.id} onClick={() => openClient(c)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 0.95rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize: '0.62rem', color: c.assigned_schema_id ? 'rgba(34,197,94,0.8)' : 'rgba(255,255,255,0.35)', marginTop: 1 }}>{c.assigned_schema_id ? 'Heeft een actief plan' : 'Nog geen plan'}</div>
                  </div>
                  <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
                </button>
              ))}
              {filtered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>Geen klanten gevonden.</div>}
            </div>
          </>
        ) : picking ? (
          /* ── TEMPLATE-PICKER ── */
          <>
            <div style={{ flexShrink: 0, padding: '0.7rem 0.95rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setPicking(false)} style={iconBtn}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>Kies een template</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.7rem' }}>
              {templates.filter(t => !t.is_archived).length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', lineHeight: 1.5 }}>Nog geen templates. Sla in de builder eerst een plan op als template.</div>
              ) : templates.filter(t => !t.is_archived).map(t => (
                <button key={t.id} onClick={() => assignTemplate(t)} disabled={busy === t.id}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.7rem 0.8rem', marginBottom: 6, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'left', opacity: busy === t.id ? 0.5 : 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#fff' }}>{t.name || 'Template'}</div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{t.days_per_week || Object.keys(t.week_structure || {}).length} dagen{t.primary_goal ? ` · ${t.primary_goal}` : ''}</div>
                  </div>
                  <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.32rem 0.6rem', borderRadius: 8, fontSize: '0.64rem', fontWeight: 800, color: '#000', background: GOLD }}><Plus size={12} /> Toewijzen</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* ── KLANT-DETAIL ── */
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Laden…</div>
            ) : (
              <>
                <SectionLabel>Actief plan</SectionLabel>
                {active ? (
                  <PlanRow p={active} isActive busy={busy} onRemove={() => remove(active.id)} onEdit={onEditInBuilder ? () => onEditInBuilder(active) : null} isMobile={isMobile} />
                ) : (
                  <div style={{ padding: '0.85rem', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginBottom: '1rem' }}>Nog geen actief plan.</div>
                )}

                <SectionLabel>Reserve-plannen ({reserve.length})</SectionLabel>
                {reserve.length === 0 ? (
                  <div style={{ padding: '0.7rem 0', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>Geen reserve-plannen.</div>
                ) : reserve.map(p => (
                  <PlanRow key={p.id} p={p} busy={busy} onActivate={() => activate(p.id)} onRemove={() => remove(p.id)} onEdit={onEditInBuilder ? () => onEditInBuilder(p) : null} isMobile={isMobile} />
                ))}

                <button onClick={() => setPicking(true)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: '1rem', padding: '0.8rem', borderRadius: 11, background: 'rgba(255,215,0,0.12)', border: '1px dashed rgba(255,215,0,0.45)', color: GOLD, fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}>
                  <Plus size={15} /> Wijs extra plan toe
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0.4rem 0 0.5rem' }}>{children}</div>
}

function PlanRow({ p, isActive, busy, onActivate, onRemove, onEdit, isMobile }) {
  const days = p.days_per_week || Object.keys(p.week_structure || {}).length
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.7rem 0.8rem', marginBottom: 8, borderRadius: 11, background: 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.08)'}` }}>
      {isActive && <Star size={15} color={GOLD} fill={GOLD} style={{ flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Plan'}</div>
        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{days} dagen/week{p.primary_goal ? ` · ${p.primary_goal}` : ''}</div>
      </div>
      {!isActive && (
        <button onClick={onActivate} disabled={busy === p.id}
          style={{ flexShrink: 0, padding: '0.4rem 0.7rem', borderRadius: 8, fontSize: '0.66rem', fontWeight: 800, color: '#000', background: GOLD, border: 'none', cursor: busy === p.id ? 'default' : 'pointer', opacity: busy === p.id ? 0.6 : 1 }}>
          {busy === p.id ? '…' : 'Activeer'}
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} title="Bekijk/bewerk in builder"
          style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.35)', color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Pencil size={13} />
        </button>
      )}
      <button onClick={onRemove} disabled={busy === p.id} title="Verwijder plan"
        style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Trash2 size={14} />
      </button>
    </div>
  )
}

const iconBtn = { width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
