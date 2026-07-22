// src/components/QuickTodoModal.jsx
// Snelle to-do capture-inbox, bereikbaar via de WidgetSidebar (boven Issues).
// Elke to-do is een ECHTE productivity-taak (productivity_tasks), dus 'ie
// verschijnt meteen in de kanban. Afvinken hier = afvinken in het systeem.
//
// Links een sectie-rail (Alles / Inbox / jouw kanban-secties, bv. Marketing,
// Coaching): filtert de lijst én bepaalt in welke sectie een nieuwe to-do landt.
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Check, Trash2, ArrowRight, ListTodo, Inbox, Layers, Pencil, GripVertical, Play } from 'lucide-react'
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

export default function QuickTodoModal({ db, coachId, onClose, onOpenProductivity, isMobile, onStartTask, activeTaskId }) {
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
  const [openFilter, setOpenFilter] = useState(null)    // 'prio' | 'dur' | null (uitgeklapte pill)
  // Toevoeg-modal: vraagt prioriteit + duur bij een nieuwe to-do.
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addSection, setAddSection] = useState('')
  // Slepen om to-do's te herordenen (persisteert `position`).
  const [dragId, setDragId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  // Inline bewerken van een bestaande to-do.
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [editMinutes, setEditMinutes] = useState('')
  const [editSection, setEditSection] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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

  // Stap 1: open de toevoeg-modal (vraagt prio + duur). Titel is al getypt.
  const openAddModal = () => {
    if (!input.trim()) return
    setNewPriority('medium')
    setNewMinutes('')
    setAddSection(targetSectionId || '')
    setAddModalOpen(true)
  }

  // Stap 2: daadwerkelijk aanmaken met de gekozen prio/duur/sectie.
  const confirmAdd = async () => {
    const title = input.trim()
    if (!title || busy) return
    setBusy(true)
    try {
      await svc.createTask(coachId, {
        title,
        sectionId: addSection || null,
        needs_reflection: false,
        priority: newPriority,
        estimated_minutes: newMinutes ? Number(newMinutes) : undefined,
      })
      setInput('')
      setAddModalOpen(false)
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

  // Verplaats bron-task naar de plek van doel-task en herschrijf de posities.
  const reorder = async (sourceId, targetId) => {
    if (!sourceId || sourceId === targetId) return
    const arr = [...tasks]
    const from = arr.findIndex(t => t.id === sourceId)
    const to = arr.findIndex(t => t.id === targetId)
    if (from === -1 || to === -1) return
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    const withPos = arr.map((t, i) => ({ ...t, position: i }))
    setTasks(withPos)  // optimistisch
    const changed = withPos.filter(t => (tasks.find(o => o.id === t.id)?.position ?? -1) !== t.position)
    try {
      await Promise.all(changed.map(t => svc.updateTask(t.id, { position: t.position })))
    } catch (e) { console.error('QuickTodo reorder:', e); load() }
  }

  const startEdit = (t) => {
    setEditingId(t.id)
    setEditTitle(t.title || '')
    setEditPriority(t.priority || 'medium')
    setEditMinutes(t.estimated_minutes || '')
    setEditSection(t.section_id || '')
  }
  const cancelEdit = () => { setEditingId(null); setSavingEdit(false) }
  const saveEdit = async (t) => {
    const title = editTitle.trim()
    if (!title) return
    setSavingEdit(true)
    const updates = {
      title,
      priority: editPriority,
      estimated_minutes: editMinutes ? Number(editMinutes) : null,
      section_id: editSection || null,
    }
    // Optimistisch bijwerken.
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, ...updates } : x))
    try {
      await svc.updateTask(t.id, updates)
    } catch (e) { console.error('QuickTodo edit:', e); load() }
    setSavingEdit(false)
    setEditingId(null)
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

  const fieldLabel = { fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)', marginBottom: '0.4rem' }

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
                  onKeyDown={(e) => { if (e.key === 'Enter') openAddModal() }}
                  placeholder="Nieuwe to-do… (Enter)"
                  style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.05)', border: `1px solid ${justAdded ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 9, padding: '0.55rem 0.7rem', color: '#fff', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s ease' }}
                />
                <button onClick={openAddModal} disabled={!input.trim() || busy} style={{
                  flexShrink: 0, width: 42, borderRadius: 9, border: 'none',
                  background: input.trim() ? `linear-gradient(135deg, ${GOLD}, #e8a800)` : 'rgba(255,255,255,0.06)',
                  color: input.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  <Plus size={19} />
                </button>
              </div>

              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.4rem', paddingLeft: '0.15rem' }}>
                {targetSectionId
                  ? `Landt in "${sections.find(s => s.id === targetSectionId)?.title || 'sectie'}"`
                  : 'Landt in Niet gepland (inbox).'}
              </div>
            </div>

            {/* Filter-pillen: twee naast elkaar (Prioriteit / Tijd) die uitklappen */}
            {(() => {
              const prioVal = prioFilter === 'all' ? null : (PRIOS.find(p => p.key === prioFilter)?.label)
              const durVal = durFilter === 'all' ? null : (DUR_FILTERS.find(d => d.key === durFilter)?.label)
              const pills = [
                { key: 'prio', label: 'Prioriteit', active: prioFilter !== 'all', val: prioVal, color: prioFilter === 'all' ? GOLD : PRIO_COLOR[prioFilter] },
                { key: 'dur', label: 'Tijd', active: durFilter !== 'all', val: durVal, color: '#10b981' },
              ]
              return (
                <div style={{ padding: '0 0.85rem 0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {pills.map(pill => {
                      const isOpen = openFilter === pill.key
                      return (
                        <button key={pill.key} type="button" onClick={() => setOpenFilter(o => o === pill.key ? null : pill.key)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.32rem 0.65rem', borderRadius: 20, background: pill.active ? `${pill.color}1f` : 'rgba(255,255,255,0.04)', border: `1px solid ${pill.active ? pill.color + '55' : 'rgba(255,255,255,0.1)'}`, color: pill.active ? pill.color : 'rgba(255,255,255,0.6)', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                          {pill.label}{pill.val ? `: ${pill.val}` : ''}
                          <span style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', fontSize: '0.55rem' }}>▾</span>
                        </button>
                      )
                    })}
                    {filtersActive && (
                      <button type="button" onClick={() => { setPrioFilter('all'); setDurFilter('all'); setOpenFilter(null) }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '0.32rem 0.5rem', borderRadius: 20, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>
                        <X size={11} /> wis
                      </button>
                    )}
                  </div>

                  {/* Uitgeklapte opties */}
                  {openFilter === 'prio' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.45rem' }}>
                      <button type="button" onClick={() => { setPrioFilter('all'); setOpenFilter(null) }} style={chipStyle(prioFilter === 'all', GOLD)}>Alle</button>
                      {PRIOS.map(p => (
                        <button key={p.key} type="button" onClick={() => { setPrioFilter(p.key); setOpenFilter(null) }} style={chipStyle(prioFilter === p.key, p.color)}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, marginRight: 3 }} />{p.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {openFilter === 'dur' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.45rem' }}>
                      {DUR_FILTERS.map(d => (
                        <button key={d.key} type="button" onClick={() => { setDurFilter(d.key); setOpenFilter(null) }} style={chipStyle(durFilter === d.key, '#10b981')}>{d.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Lijst */}
            <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, padding: '0.2rem 0.5rem 0.6rem' }}>
              {loading && <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Laden…</div>}
              {!loading && visible.length === 0 && (
                <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                  {filtersActive ? 'Geen to-do\'s met dit filter.' : 'Geen open to-do\'s hier. Typ hierboven je eerste. ✨'}
                </div>
              )}
              {visible.map((t) => (
                editingId === t.id ? (
                  /* ── Inline edit-form ── */
                  <div key={t.id} style={{ padding: '0.55rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '0.45rem', background: 'rgba(255,215,0,0.03)' }}>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(t); if (e.key === 'Escape') cancelEdit() }}
                      autoFocus
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.45rem 0.6rem', color: '#fff', fontSize: '0.84rem', outline: 'none' }}
                    />
                    {/* Prioriteit + duur */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem' }}>
                      {PRIOS.map(p => {
                        const active = editPriority === p.key
                        return (
                          <button key={p.key} type="button" onClick={() => setEditPriority(p.key)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.25rem 0.5rem', borderRadius: 6, background: active ? `${p.color}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? p.color + '66' : 'rgba(255,255,255,0.08)'}`, color: active ? p.color : 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />{p.label}
                          </button>
                        )
                      })}
                      <span style={{ width: 1, height: 15, background: 'rgba(255,255,255,0.08)', margin: '0 0.1rem' }} />
                      {DUR_PRESETS.map(mn => {
                        const active = Number(editMinutes) === mn
                        return (
                          <button key={mn} type="button" onClick={() => setEditMinutes(active ? '' : mn)}
                            style={{ padding: '0.25rem 0.45rem', borderRadius: 6, background: active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#10b981' : 'rgba(255,255,255,0.4)', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>{mn}m</button>
                        )
                      })}
                      <input type="number" min="1" max="480" placeholder="…m" value={editMinutes}
                        onChange={(e) => setEditMinutes(e.target.value ? parseInt(e.target.value) : '')}
                        style={{ width: 42, padding: '0.25rem 0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#fff', fontSize: '0.6rem', outline: 'none' }} />
                    </div>
                    {/* Sectie + acties */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <select value={editSection} onChange={(e) => setEditSection(e.target.value)}
                        style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '0.35rem 0.45rem', color: '#fff', fontSize: '0.7rem', outline: 'none', cursor: 'pointer' }}>
                        <option value="">Niet gepland (inbox)</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                      <button onClick={cancelEdit} style={{ padding: '0.35rem 0.6rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>Annuleer</button>
                      <button onClick={() => saveEdit(t)} disabled={savingEdit || !editTitle.trim()}
                        style={{ padding: '0.35rem 0.7rem', background: editTitle.trim() ? '#10b981' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, color: editTitle.trim() ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 800, cursor: (savingEdit || !editTitle.trim()) ? 'not-allowed' : 'pointer', touchAction: 'manipulation' }}>
                        {savingEdit ? 'Opslaan…' : 'Opslaan'}
                      </button>
                    </div>
                  </div>
                ) : (
                <div key={t.id}
                  draggable
                  onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', t.id) } catch { /* noop */ } }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverId !== t.id) setDragOverId(t.id) }}
                  onDrop={(e) => { e.preventDefault(); reorder(dragId, t.id); setDragId(null); setDragOverId(null) }}
                  onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.04)', borderTop: (dragOverId === t.id && dragId !== t.id) ? '2px solid rgba(255,215,0,0.6)' : '2px solid transparent', opacity: dragId === t.id ? 0.4 : 1, background: dragId === t.id ? 'rgba(255,215,0,0.04)' : 'transparent' }}>
                  <span title="Sleep om te herordenen" style={{ flexShrink: 0, cursor: 'grab', color: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center' }}>
                    <GripVertical size={14} />
                  </span>
                  <button onClick={() => complete(t)} title="Afvinken" style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.25)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.12)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent' }}>
                    <Check size={13} color="#10b981" style={{ opacity: 0.85 }} />
                  </button>
                  {/* Prioriteit-stip */}
                  <span title={`Prioriteit: ${(PRIOS.find(p => p.key === (t.priority || 'medium'))?.label) || 'Med'}`}
                    style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: PRIO_COLOR[t.priority || 'medium'] }} />
                  <span onClick={() => startEdit(t)} style={{ flex: 1, minWidth: 0, fontSize: '0.84rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
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
                  {/* Mee bezig — start de task-timer (en sluit deze modal zodat de start-modal schoon verschijnt) */}
                  {onStartTask && (
                    activeTaskId === t.id ? (
                      <span title="Bezig" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, padding: '0.15rem 0.4rem', borderRadius: 6, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', fontSize: '0.52rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        <Play size={9} fill="#10b981" /> Bezig
                      </span>
                    ) : (
                      <button onClick={() => { onStartTask(t); onClose && onClose() }} title="Mee bezig — start deze task" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, background: 'transparent', border: 'none', color: 'rgba(16,185,129,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
                        <Play size={13} />
                      </button>
                    )
                  )}
                  <button onClick={() => startEdit(t)} title="Bewerken" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => remove(t)} title="Verwijderen" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                )
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

  // Toevoeg-modal: vraagt prioriteit + duur (+ sectie) bij een nieuwe to-do.
  const addModal = addModalOpen && (
    <div
      onClick={() => { if (!busy) setAddModalOpen(false) }}
      style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1rem' }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? '16px 16px 0 0' : 16, width: '100%', maxWidth: isMobile ? '100%' : 380, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <ListTodo size={16} color={GOLD} />
          <span style={{ flex: 1, fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>Nieuwe to-do</span>
          <button onClick={() => setAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', minHeight: 32, minWidth: 32, alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Titel-preview */}
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.55rem 0.7rem', lineHeight: 1.4 }}>
            {input.trim()}
          </div>

          {/* Prioriteit */}
          <div>
            <div style={fieldLabel}>Prioriteit</div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {PRIOS.map(p => {
                const active = newPriority === p.key
                return (
                  <button key={p.key} type="button" onClick={() => setNewPriority(p.key)}
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem', borderRadius: 8, background: active ? `${p.color}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? p.color + '66' : 'rgba(255,255,255,0.08)'}`, color: active ? p.color : 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />{p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Duur */}
          <div>
            <div style={fieldLabel}>Hoe lang duurt het?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
              {DUR_PRESETS.map(mn => {
                const active = Number(newMinutes) === mn
                return (
                  <button key={mn} type="button" onClick={() => setNewMinutes(active ? '' : mn)}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: 8, background: active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, color: active ? '#10b981' : 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>{mn}m</button>
                )
              })}
              <input type="number" min="1" max="480" placeholder="…m" value={newMinutes}
                onChange={(e) => setNewMinutes(e.target.value ? parseInt(e.target.value) : '')}
                style={{ width: 56, padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: '0.72rem', outline: 'none' }} />
            </div>
          </div>

          {/* Sectie */}
          <div>
            <div style={fieldLabel}>Sectie</div>
            <select value={addSection} onChange={(e) => setAddSection(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.5rem 0.6rem', color: '#fff', fontSize: '0.78rem', outline: 'none', cursor: 'pointer' }}>
              <option value="">Niet gepland (inbox)</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setAddModalOpen(false)} disabled={busy}
            style={{ flex: 1, padding: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>Annuleer</button>
          <button onClick={confirmAdd} disabled={busy}
            style={{ flex: 2, padding: '0.6rem', background: `linear-gradient(135deg, ${GOLD}, #e8a800)`, border: 'none', borderRadius: 9, color: '#000', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', opacity: busy ? 0.6 : 1, touchAction: 'manipulation' }}>
            <Plus size={15} /> {busy ? 'Toevoegen…' : 'Toevoegen'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(<>{modal}{addModal}</>, document.body)
}
