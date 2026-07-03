// Floating side-tab in CoachHub voor klant-pijnpunten: dingen waar
// (potentiele) klanten tegenaan lopen die de coach in z'n content/
// coaching moet verwerken. Schrijft naar `output_problems` zodat ze
// automatisch terugkomen in Output → Problemen Database voor diepe
// uitwerking (solution approach + content angle).

import { useState, useEffect } from 'react'
import { AlertCircle, X, Plus, ExternalLink, Trash2, Pencil, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'

const RED = '#ef4444'

// Categorieën matchen 1-op-1 met die in ProblemsDatabase.jsx zodat de
// rijen die hier worden ingevoerd zonder mapping in de Output-tab landen.
const CATEGORIES = [
  { id: 'voeding',    label: 'Voeding',    color: '#10b981' },
  { id: 'gym',        label: 'Gym',        color: '#f97316' },
  { id: 'motivatie',  label: 'Motivatie',  color: '#ef4444' },
  { id: 'mindset',    label: 'Mindset',    color: '#8b5cf6' },
  { id: 'community',  label: 'Community',  color: '#3b82f6' },
]

export default function ClientProblemsWidget({ db, coachId, open: openProp, onOpenChange, onCountChange }) {
  const controlled = typeof openProp === 'boolean' && typeof onOpenChange === 'function'
  const [openInternal, setOpenInternal] = useState(false)
  const open = controlled ? openProp : openInternal
  const setOpen = (val) => {
    const next = typeof val === 'function' ? val(open) : val
    if (controlled) onOpenChange(next); else setOpenInternal(next)
  }
  const [problems, setProblems] = useState([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('voeding')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  // Inline edit van de titel (klik op tekst, save op blur/Enter).
  const [editingId, setEditingId] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  // Expand-state per probleem zodat het oplossing-veld pas verschijnt
  // wanneer de coach er actief mee bezig wil — houdt de lijst compact.
  const [expandedId, setExpandedId] = useState(null)
  // Pending oplossing-tekst per id zodat we niet bij elke keystroke een
  // DB-write doen. Wordt opgeslagen bij blur / Save-klik.
  const [solutionDraft, setSolutionDraft] = useState({})

  const load = async () => {
    if (!db?.supabase || !coachId) return
    setLoading(true)
    const { data, error } = await db.supabase
      .from('output_problems')
      .select('id, problem_title, category, solution_approach, created_at')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) console.error('load output_problems failed:', error)
    setProblems(data || [])
    setLoading(false)
  }

  useEffect(() => { if (open || controlled) load() }, [open, coachId, controlled])
  useEffect(() => { if (typeof onCountChange === 'function') onCountChange(problems.length) }, [problems.length, onCountChange])

  const handleAdd = async () => {
    const t = title.trim()
    if (!t || !coachId) return
    setAdding(true)
    const { data, error } = await db.supabase
      .from('output_problems')
      .insert({
        coach_id: coachId,
        category,
        problem_title: t,
      })
      .select('id, problem_title, category, created_at')
      .single()
    setAdding(false)
    if (error) { console.error('insert output_problem failed:', error); return }
    setProblems(prev => [data, ...prev])
    setTitle('')
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`Probleem "${p.problem_title}" verwijderen?`)) return
    setProblems(prev => prev.filter(x => x.id !== p.id))
    const { error } = await db.supabase.from('output_problems').delete().eq('id', p.id)
    if (error) { console.error('delete output_problem failed:', error); load() }
  }

  // Titel-bewerking
  const startEdit = (p) => { setEditingId(p.id); setEditingValue(p.problem_title || '') }
  const cancelEdit = () => { setEditingId(null); setEditingValue('') }
  const saveTitle = async () => {
    const next = editingValue.trim()
    if (!next || !editingId) { cancelEdit(); return }
    const id = editingId
    setProblems(prev => prev.map(p => p.id === id ? { ...p, problem_title: next } : p))
    cancelEdit()
    const { error } = await db.supabase
      .from('output_problems')
      .update({ problem_title: next, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { console.error('update problem_title failed:', error); load() }
  }

  // Oplossing-veld
  const toggleExpand = (id) => {
    setExpandedId(prev => {
      const next = prev === id ? null : id
      // Bij openen: pre-fill draft met huidige solution_approach.
      if (next === id) {
        const p = problems.find(x => x.id === id)
        setSolutionDraft(d => ({ ...d, [id]: p?.solution_approach || '' }))
      }
      return next
    })
  }
  const saveSolution = async (id) => {
    const next = (solutionDraft[id] || '').trim()
    setProblems(prev => prev.map(p => p.id === id ? { ...p, solution_approach: next || null } : p))
    const { error } = await db.supabase
      .from('output_problems')
      .update({ solution_approach: next || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { console.error('update solution_approach failed:', error); load() }
  }

  const openInOutput = () => {
    // Output-tab in CoachHub. De gebruiker scrolt zelf naar de Problemen
    // Database tab in Output voor diepe bewerking (solution, content angle).
    window.location.hash = '#output'
    setOpen(false)
  }

  const catConfig = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0]

  return (
    <>
      {/* Side tab — alleen tonen in uncontrolled-mode (zonder sidebar). */}
      {!controlled && !open && (
        <button
          onClick={() => setOpen(true)}
          title="Klant-pijnpunten"
          style={{
            position: 'fixed',
            right: 0,
            top: '70%',
            transform: 'translateY(-50%)',
            zIndex: 2147483500,
            width: 36, height: 56,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2,
            background: 'rgba(239,68,68,0.12)',
            border: `1px solid ${RED}40`,
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            color: '#fca5a5',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <AlertCircle size={15} />
          {problems.length > 0 && (
            <span style={{ fontSize: '0.55rem', fontWeight: 800 }}>{problems.length}</span>
          )}
        </button>
      )}

      {/* Backdrop click-to-close */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 2147483545,
          }}
        />
      )}

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0, right: 0, bottom: 0,
            width: 'min(380px, 100vw)',
            background: '#0a0a0a',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            zIndex: 2147483550,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 24px rgba(0,0,0,0.6)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} color={RED} />
              <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 800 }}>
                Klant-pijnpunten
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 600 }}>
                {problems.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button
                onClick={openInOutput}
                title="Open Output → Problemen Database voor uitwerking"
                style={iconBtn('rgba(255,255,255,0.4)')}
              >
                <ExternalLink size={13} />
              </button>
              <button onClick={() => setOpen(false)} style={iconBtn('rgba(255,255,255,0.4)')}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Add new */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
          }}>
            {/* Categorie-chips */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => {
                const active = c.id === category
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    style={{
                      padding: '0.3rem 0.55rem',
                      background: active ? `${c.color}25` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? `${c.color}60` : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 999,
                      color: active ? c.color : 'rgba(255,255,255,0.55)',
                      fontSize: '0.65rem', fontWeight: 700,
                      cursor: 'pointer', touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleAdd() }
              }}
              placeholder="Wat loopt een klant tegenaan? (⌘+Enter)"
              rows={2}
              style={{
                width: '100%', padding: '0.55rem 0.7rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#fff',
                fontSize: '0.85rem', outline: 'none', resize: 'vertical',
                fontFamily: 'inherit', lineHeight: 1.4,
              }}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !title.trim()}
              style={{
                padding: '0.55rem',
                background: title.trim() ? RED : 'rgba(255,255,255,0.04)',
                border: 'none',
                borderRadius: 8,
                color: title.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: '0.8rem', fontWeight: 700,
                cursor: title.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                opacity: adding ? 0.5 : 1,
              }}
            >
              <Plus size={14} />
              {adding ? 'Toevoegen…' : 'Toevoegen'}
            </button>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              Belandt in Output → Problemen Database. Werk daar de solution + content angle uit.
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {loading && problems.length === 0 && (
              <div style={{ padding: '1rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center' }}>
                Laden…
              </div>
            )}
            {!loading && problems.length === 0 && (
              <div style={{ padding: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center' }}>
                Nog geen pijnpunten genoteerd.
              </div>
            )}
            {problems.map(p => {
              const cat = catConfig(p.category)
              const isEditing = editingId === p.id
              const isExpanded = expandedId === p.id
              const hasSolution = !!p.solution_approach
              return (
                <div key={p.id} style={{
                  background: 'rgba(239,68,68,0.04)',
                  border: '1px solid rgba(239,68,68,0.12)',
                  borderRadius: 8,
                  marginBottom: '0.375rem',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    padding: '0.625rem 0.75rem',
                  }}>
                    <div style={{
                      flexShrink: 0,
                      padding: '2px 6px',
                      background: `${cat.color}1a`,
                      border: `1px solid ${cat.color}40`,
                      borderRadius: 4,
                      color: cat.color,
                      fontSize: '0.55rem', fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      marginTop: 1,
                    }}>
                      {cat.label}
                    </div>
                    <div style={{
                      flex: 1,
                      fontSize: '0.78rem',
                      color: 'rgba(255,255,255,0.85)',
                      lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {isEditing ? (
                        <textarea
                          autoFocus
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveTitle}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTitle() }
                            if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                          }}
                          rows={2}
                          style={{
                            width: '100%', padding: '0.35rem 0.5rem',
                            background: 'rgba(255,255,255,0.06)',
                            border: `1px solid ${RED}60`,
                            borderRadius: 6, color: '#fff',
                            fontSize: '0.78rem', outline: 'none', resize: 'vertical',
                            fontFamily: 'inherit', lineHeight: 1.4,
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => startEdit(p)}
                          style={{ cursor: 'text' }}
                          title="Klik om te bewerken"
                        >
                          {p.problem_title}
                        </span>
                      )}
                      <div style={{ marginTop: 4, fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                        {new Date(p.created_at).toLocaleString('nl-NL', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                        {hasSolution && (
                          <span style={{ marginLeft: 6, color: 'rgba(16,185,129,0.7)', fontWeight: 700 }}>
                            · ✓ Oplossing
                          </span>
                        )}
                      </div>
                    </div>
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => toggleExpand(p.id)}
                          title={isExpanded ? 'Sluit oplossing' : 'Voeg oplossing toe / bekijk'}
                          style={{
                            width: 24, height: 24, padding: 0, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: hasSolution ? 'rgba(16,185,129,0.1)' : 'transparent',
                            border: hasSolution ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
                            borderRadius: 5,
                            color: hasSolution ? 'rgba(16,185,129,0.8)' : 'rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                          }}
                        >
                          {isExpanded ? <ChevronUp size={11} /> : <Lightbulb size={11} />}
                        </button>
                        <button
                          onClick={() => startEdit(p)}
                          title="Bewerk titel"
                          style={{
                            width: 24, height: 24, padding: 0, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 'none',
                            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                          }}
                        >
                          <Pencil size={11} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(p)}
                      title="Verwijderen"
                      style={{
                        width: 24, height: 24, padding: 0, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none',
                        color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Oplossing-paneel — pas zichtbaar na klik op de lightbulb. */}
                  {isExpanded && (
                    <div style={{
                      padding: '0.5rem 0.75rem 0.7rem',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      background: 'rgba(16,185,129,0.03)',
                    }}>
                      <div style={{
                        fontSize: '0.55rem', fontWeight: 800,
                        color: 'rgba(16,185,129,0.7)',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        marginBottom: '0.3rem',
                      }}>
                        Oplossing / Aanpak
                      </div>
                      <textarea
                        value={solutionDraft[p.id] ?? ''}
                        onChange={(e) => setSolutionDraft(d => ({ ...d, [p.id]: e.target.value }))}
                        onBlur={() => saveSolution(p.id)}
                        placeholder="Hoe pak je dit aan in coaching of content?"
                        rows={3}
                        style={{
                          width: '100%', padding: '0.45rem 0.6rem',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(16,185,129,0.2)',
                          borderRadius: 6, color: '#fff',
                          fontSize: '0.78rem', outline: 'none', resize: 'vertical',
                          fontFamily: 'inherit', lineHeight: 1.4,
                        }}
                      />
                      <div style={{ marginTop: 4, fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
                        Wordt opgeslagen bij verlaten van het tekstveld.
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

const iconBtn = (color) => ({
  width: 40, height: 40,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color,
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
})
