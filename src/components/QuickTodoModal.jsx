// src/components/QuickTodoModal.jsx
// Snelle to-do capture-inbox, bereikbaar via de WidgetSidebar (boven Issues).
// Elke to-do is een ECHTE productivity-taak (productivity_tasks), dus 'ie
// verschijnt meteen in de kanban. Afvinken hier = afvinken in het systeem.
//
// Links een sectie-rail (Alles / Inbox / jouw kanban-secties, bv. Marketing,
// Coaching): filtert de lijst én bepaalt in welke sectie een nieuwe to-do landt.
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Check, Trash2, ArrowRight, ListTodo, Inbox, Layers } from 'lucide-react'
import ProductivityService from '../modules/productivity/ProductivityService'

const GOLD = '#FFD700'

// Prioriteiten — zelfde waarden als productivity_tasks.priority (AddTaskModal).
const PRIOS = [
  { key: 'low',    label: 'Laag', color: '#10b981' },
  { key: 'medium', label: 'Med',  color: '#f59e0b' },
  { key: 'high',   label: 'Hoog', color: '#ef4444' },
]
const PRIO_COLOR = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' }
const DUR_PRESETS = [15, 25, 30, 45, 60]
// Tijd-filter-buckets op estimated_minutes.
const DUR_FILTERS = [
  { key: 'all',  label: 'Alle' },
  { key: 'le15', label: '≤15m', test: (m) => m > 0 && m <= 15 },
  { key: 'le30', label: '≤30m', test: (m) => m > 0 && m <= 30 },
  { key: 'le60', label: '≤60m', test: (m) => m > 0 && m <= 60 },
  { key: 'gt60', label: '60m+', test: (m) => m > 60 },
]

export default function QuickTodoModal({ db, coachId, onClose, onOpenProductivity, isMobile }) {
  const [svc] = useState(() => new ProductivityService(db.supabase))
  const [tasks, setTasks] = useState([])
  const [sections, setSections] = useState([])
  const [filter, setFilter] = useState('all') // 'all' | 'inbox' | <sectionId>
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const inputRef = useRef(null)
  // Nieuwe-to-do metadata (prioriteit + geschatte duur).
  const [newPriority, setNewPriority] = useState('medium')
  const [newMinutes, setNewMinutes] = useState('')
  // Filters binnen de gekozen sectie.
  const [prioFilter, setPrioFilter] = useState('all')  // 'all' | 'low' | 'medium' | 'high'
  const [durFilter, setDurFilter] = useState('all')     // key uit DUR_FILTERS

  const load = async () => {
    try {
      const [taskData, secData] = await Promise.all([
        svc.getTasks(coachId, { status: 'active' }),
        svc.getSections(coachId),
      ])
      setTasks(taskData || [])
      setSections(secData || [])
    } catch (e) { console.error('QuickTodo load:', e) }
    setLoading(false)
  }

  useEffect(() => {
    if (coachId) load()
    setTimeout(() => inputRef.current?.focus(), 60)
  }, [coachId])

  // Nieuwe to-do landt in de gekozen sectie (of Inbox bij Alles/Inbox).
  const targetSectionId = (filter === 'all' || filter === 'inbox') ? null : filter

  const addTodo = async () => {
    const title = input.trim()
    if (!title || busy) return
    setBusy(true)
    try {
      await svc.createTask(coachId, {
        title,
        sectionId: targetSectionId,
        needs_reflection: false,
        priority: newPriority,
        estimated_minutes: newMinutes ? Number(newMinutes) : undefined,
      })
      setInput('')
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1200)
      await load()
      inputRef.current?.focus()
    } catch (e) { console.error('QuickTodo add:', e) }
    setBusy(false)
  }

  const complete = async (t) => {
    setTasks(prev => prev.filter(x => x.id !== t.id))
    try { await svc.completeTask(t.id) } catch (e) { console.error(e); load() }
  }

  const remove = async (t) => {
    setTasks(prev => prev.filter(x => x.id !== t.id))
    try { await svc.deleteTask(t.id) } catch (e) { console.error(e); load() }
  }

  // Zichtbare to-do's: eerst sectie-filter, dan prio- en tijd-filter.
  const durTest = DUR_FILTERS.find(d => d.key === durFilter)?.test
  const visible = tasks.filter(t => {
    // Sectie
    if (filter === 'inbox') { if (t.section_id != null) return false }
    else if (filter !== 'all') { if (t.section_id !== filter) return false }
    // Prioriteit
    if (prioFilter !== 'all' && (t.priority || 'medium') !== prioFilter) return false
    // Tijd/duur
    if (durTest && !durTest(Number(t.estimated_minutes) || 0)) return false
    return true
  })
  const filtersActive = prioFilter !== 'all' || durFilter !== 'all'

  const countFor = (f) => tasks.filter(t => {
    if (f === 'all') return true
    if (f === 'inbox') return t.section_id == null
    return t.section_id === f
  }).length

  const railItems = [
    { id: 'all', title: 'Alles', Icon: Layers, color: GOLD },
    { id: 'inbox', title: 'Niet gepland', Icon: Inbox, color: 'rgba(255,255,255,0.6)' },
    ...sections.map(s => ({ id: s.id, title: s.title, color: s.color || 'rgba(255,255,255,0.6)' })),
  ]

  const railBtn = (item) => {
    const active = filter === item.id
    return (
      <button key={item.id} onClick={() => setFilter(item.id)} title={item.title}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%',
          padding: '0.5rem 0.55rem', borderRadius: 8, marginBottom: 3,
          background: active ? 'rgba(255,215,0,0.12)' : 'transparent',
          border: `1px solid ${active ? 'rgba(255,215,0,0.35)' : 'transparent'}`,
          cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
        {item.Icon
          ? <item.Icon size={13} color={active ? GOLD : 'rgba(255,255,255,0.5)'} style={{ flexShrink: 0 }} />
          : <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: item.color }} />}
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: active ? 800 : 600, color: active ? GOLD : 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
        {countFor(item.id) > 0 && (
          <span style={{ flexShrink: 0, fontSize: '0.58rem', fontWeight: 800, color: active ? GOLD : 'rgba(255,255,255,0.35)' }}>{countFor(item.id)}</span>
        )}
      </button>
    )
  }

  const chipStyle = (active, color) => ({
    display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.45rem', borderRadius: 5,
    background: active ? `${color}22` : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? color + '66' : 'rgba(255,255,255,0.07)'}`,
    color: active ? color : 'rgba(255,255,255,0.45)', fontSize: '0.56rem', fontWeight: 800,
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

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
        width: isMobile ? '100%' : '560px', maxHeight: isMobile ? '85vh' : '80vh',
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

        {/* Body: sectie-rail links + add/lijst rechts */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* Sectie-rail */}
          <div style={{ width: isMobile ? 118 : 150, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '0.6rem 0.5rem', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '0 0.35rem 0.4rem' }}>Secties</div>
            {railItems.map(railBtn)}
          </div>

          {/* Add + lijst */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Quick-add */}
            <div style={{ padding: '0.75rem 0.85rem 0.55rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTodo() }}
                  placeholder="Nieuwe to-do… (Enter)"
                  style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.05)', border: `1px solid ${justAdded ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 9, padding: '0.55rem 0.7rem', color: '#fff', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s ease' }}
                />
                <button onClick={addTodo} disabled={!input.trim() || busy} style={{
                  flexShrink: 0, width: 42, borderRadius: 9, border: 'none',
                  background: input.trim() ? `linear-gradient(135deg, ${GOLD}, #e8a800)` : 'rgba(255,255,255,0.06)',
                  color: input.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  <Plus size={19} />
                </button>
              </div>

              {/* Prioriteit + geschatte duur voor de nieuwe to-do */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                {PRIOS.map(p => {
                  const active = newPriority === p.key
                  return (
                    <button key={p.key} onClick={() => setNewPriority(p.key)} type="button"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.25rem 0.5rem', borderRadius: 6, background: active ? `${p.color}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? p.color + '66' : 'rgba(255,255,255,0.08)'}`, color: active ? p.color : 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />{p.label}
                    </button>
                  )
                })}
                <span style={{ width: 1, height: 15, background: 'rgba(255,255,255,0.08)', margin: '0 0.1rem' }} />
                {DUR_PRESETS.map(mn => {
                  const active = Number(newMinutes) === mn
                  return (
                    <button key={mn} onClick={() => setNewMinutes(active ? '' : mn)} type="button"
                      style={{ padding: '0.25rem 0.45rem', borderRadius: 6, background: active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#10b981' : 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>{mn}m</button>
                  )
                })}
                <input type="number" min="1" max="480" placeholder="…m" value={newMinutes}
                  onChange={(e) => setNewMinutes(e.target.value ? parseInt(e.target.value) : '')}
                  style={{ width: 42, padding: '0.25rem 0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#fff', fontSize: '0.6rem', outline: 'none' }} />
              </div>

              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.35rem', paddingLeft: '0.15rem' }}>
                {targetSectionId
                  ? `Landt in "${sections.find(s => s.id === targetSectionId)?.title || 'sectie'}"`
                  : 'Landt in Niet gepland (inbox).'}
              </div>
            </div>

            {/* Filterbalk: prioriteit + tijd, binnen de gekozen sectie */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem', padding: '0 0.85rem 0.45rem' }}>
              <span style={{ fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.25)', marginRight: 2 }}>Filter</span>
              <button type="button" onClick={() => setPrioFilter('all')} style={chipStyle(prioFilter === 'all', GOLD)}>Alle</button>
              {PRIOS.map(p => (
                <button key={p.key} type="button" onClick={() => setPrioFilter(prioFilter === p.key ? 'all' : p.key)} style={chipStyle(prioFilter === p.key, p.color)}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, marginRight: 3 }} />{p.label}
                </button>
              ))}
              <span style={{ width: 1, height: 13, background: 'rgba(255,255,255,0.08)', margin: '0 0.15rem' }} />
              {DUR_FILTERS.map(d => (
                <button key={d.key} type="button" onClick={() => setDurFilter(d.key)} style={chipStyle(durFilter === d.key, '#10b981')}>{d.label}</button>
              ))}
              {filtersActive && (
                <button type="button" onClick={() => { setPrioFilter('all'); setDurFilter('all') }} style={{ ...chipStyle(false, '#fff'), color: 'rgba(255,255,255,0.4)' }}>✕ wis</button>
              )}
            </div>

            {/* Lijst */}
            <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, padding: '0.2rem 0.5rem 0.6rem' }}>
              {loading && <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Laden…</div>}
              {!loading && visible.length === 0 && (
                <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                  {filtersActive ? 'Geen to-do\'s met dit filter.' : 'Geen open to-do\'s hier. Typ hierboven je eerste. ✨'}
                </div>
              )}
              {visible.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <button onClick={() => complete(t)} title="Afvinken" style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.25)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.12)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent' }}>
                    <Check size={13} color="#10b981" style={{ opacity: 0.85 }} />
                  </button>
                  {/* Prioriteit-stip */}
                  <span title={`Prioriteit: ${(PRIOS.find(p => p.key === (t.priority || 'medium'))?.label) || 'Med'}`}
                    style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: PRIO_COLOR[t.priority || 'medium'] }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.84rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                    {/* Toon sectie-label alleen in de "Alles"-weergave */}
                    {filter === 'all' && t.section_id && (
                      <span style={{ marginLeft: 6, fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {sections.find(s => s.id === t.section_id)?.title || ''}
                      </span>
                    )}
                  </span>
                  {/* Geschatte duur */}
                  {t.estimated_minutes ? (
                    <span style={{ flexShrink: 0, fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '0.1rem 0.3rem' }}>{t.estimated_minutes}m</span>
                  ) : null}
                  <button onClick={() => remove(t)} title="Verwijderen" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
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
