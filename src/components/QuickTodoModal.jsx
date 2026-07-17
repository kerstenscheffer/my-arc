// src/components/QuickTodoModal.jsx
// Snelle to-do capture-inbox, bereikbaar via de WidgetSidebar (boven Issues).
// Elke to-do is een ECHTE productivity-taak (productivity_tasks, section_id null
// = "Niet gepland"), dus 'ie verschijnt meteen in de kanban. Afvinken hier =
// afvinken in het systeem. Één bron van waarheid.
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Check, Trash2, ArrowRight, ListTodo } from 'lucide-react'
import ProductivityService from '../modules/productivity/ProductivityService'

const GOLD = '#FFD700'

export default function QuickTodoModal({ db, coachId, onClose, onOpenProductivity, isMobile }) {
  const [svc] = useState(() => new ProductivityService(db.supabase))
  const [tasks, setTasks] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const inputRef = useRef(null)

  const load = async () => {
    try {
      const data = await svc.getTasks(coachId, { status: 'active' })
      setTasks((data || []).slice(0, 30))
    } catch (e) { console.error('QuickTodo load:', e) }
    setLoading(false)
  }

  useEffect(() => {
    if (coachId) load()
    setTimeout(() => inputRef.current?.focus(), 60)
  }, [coachId])

  const addTodo = async () => {
    const title = input.trim()
    if (!title || busy) return
    setBusy(true)
    try {
      // needs_reflection:false → een quick to-do afvinken vraagt geen reflectie.
      await svc.createTask(coachId, { title, needs_reflection: false })
      setInput('')
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1200)
      await load()
      inputRef.current?.focus()
    } catch (e) { console.error('QuickTodo add:', e) }
    setBusy(false)
  }

  const complete = async (t) => {
    setTasks(prev => prev.filter(x => x.id !== t.id)) // optimistisch
    try { await svc.completeTask(t.id) } catch (e) { console.error(e); load() }
  }

  const remove = async (t) => {
    setTasks(prev => prev.filter(x => x.id !== t.id))
    try { await svc.deleteTask(t.id) } catch (e) { console.error(e); load() }
  }

  const modal = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1rem',
      }}
    >
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        width: isMobile ? '100%' : '440px', maxHeight: isMobile ? '85vh' : '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <ListTodo size={18} color={GOLD} />
          <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: '#fff', flex: 1 }}>To-do's</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', minHeight: 32, minWidth: 32, alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Quick-add */}
        <div style={{ padding: '0.85rem 1rem 0.6rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTodo() }}
              placeholder="Nieuwe to-do… (Enter)"
              style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.05)', border: `1px solid ${justAdded ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 9, padding: '0.6rem 0.75rem', color: '#fff', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s ease' }}
            />
            <button onClick={addTodo} disabled={!input.trim() || busy} style={{
              flexShrink: 0, width: 44, borderRadius: 9, border: 'none',
              background: input.trim() ? `linear-gradient(135deg, ${GOLD}, #e8a800)` : 'rgba(255,255,255,0.06)',
              color: input.trim() ? '#000' : 'rgba(255,255,255,0.3)',
              cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <Plus size={20} />
            </button>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.4rem', paddingLeft: '0.15rem' }}>
            Verschijnt meteen in je Productiviteit-kanban (Niet gepland).
          </div>
        </div>

        {/* Lijst met open to-do's */}
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, padding: '0.3rem 0.6rem 0.6rem' }}>
          {loading && <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Laden…</div>}
          {!loading && tasks.length === 0 && (
            <div style={{ padding: '1.75rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              Geen open to-do's. Typ hierboven je eerste. ✨
            </div>
          )}
          {tasks.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Afvink-cirkel */}
              <button onClick={() => complete(t)} title="Afvinken" style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.25)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.12)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent' }}>
                <Check size={13} color="#10b981" style={{ opacity: 0.85 }} />
              </button>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.title}
                {t.section_id == null && <span style={{ marginLeft: 6, fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>inbox</span>}
              </span>
              <button onClick={() => remove(t)} title="Verwijderen" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 7, background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer — naar de volledige productiviteit */}
        <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={() => { onOpenProductivity && onOpenProductivity(); onClose() }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>
            Open in Productiviteit <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
