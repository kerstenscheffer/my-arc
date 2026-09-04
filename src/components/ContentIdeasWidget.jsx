// Floating side-tab in CoachHub voor snelle content-ideeën. Schrijft naar
// `content_items` (status='idea') zodat ze direct opduiken in het Output-
// systeem's Ideas-sectie. Doel: een idee dat opkomt direct vangen zonder
// naar Output te navigeren.

import { useState, useEffect } from 'react'
import { Lightbulb, X, Plus, ExternalLink, Trash2, Check, RotateCcw, Pencil, Layers, FolderPlus } from 'lucide-react'

const PURPLE = '#8b5cf6'
const GREEN = '#10b981'

export default function ContentIdeasWidget({ db, coachId, open: openProp, onOpenChange, onCountChange }) {
  const controlled = typeof openProp === 'boolean' && typeof onOpenChange === 'function'
  const [openInternal, setOpenInternal] = useState(false)
  const open = controlled ? openProp : openInternal
  const setOpen = (val) => {
    const next = typeof val === 'function' ? val(open) : val
    if (controlled) onOpenChange(next); else setOpenInternal(next)
  }
  const [ideas, setIdeas] = useState([])
  const [title, setTitle] = useState('')
  const [showPosted, setShowPosted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  // Inline edit: id van het idee dat momenteel bewerkt wordt, plus de
  // tussentijdse waarde. Bewust niet een modal — een textarea in-place is
  // sneller voor één-regel ideeën.
  const [editingId, setEditingId] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  // Secties uit `content_sections` — dezelfde tabel die Output gebruikt, dus
  // wat je hier aanmaakt staat daar ook. 'all' = geen filter, 'geen' = ideeën
  // zonder sectie.
  const [sections, setSections] = useState([])
  const [filter, setFilter] = useState('all')

  // Sectie-beheer — dezelfde tabel en dezelfde regels als in Output, zodat
  // een sectie die je hier maakt daar meteen bestaat.
  const addSection = async () => {
    const title = window.prompt('Naam van de sectie?')?.trim()
    if (!title || !coachId) return
    const { data, error } = await db.supabase.from('content_sections')
      .insert({ coach_id: coachId, title, position: sections.length })
      .select().single()
    if (error) { alert(`Sectie maken mislukt — ${error.message}`); return }
    setSections(prev => [...prev, data])
    setFilter(data.id)
  }

  const renameSection = async (sec) => {
    const title = window.prompt('Nieuwe naam?', sec.title)?.trim()
    if (!title || title === sec.title) return
    const { error } = await db.supabase.from('content_sections')
      .update({ title, updated_at: new Date().toISOString() }).eq('id', sec.id)
    if (error) { alert(`Hernoemen mislukt — ${error.message}`); return }
    setSections(prev => prev.map(x => x.id === sec.id ? { ...x, title } : x))
  }

  const deleteSection = async (sec) => {
    if (!window.confirm(`Sectie "${sec.title}" verwijderen? De ideeën blijven staan onder "Geen sectie".`)) return
    // De foreign key staat op ON DELETE SET NULL, dus de ideeën zelf overleven.
    const { error } = await db.supabase.from('content_sections').delete().eq('id', sec.id)
    if (error) { alert(`Verwijderen mislukt — ${error.message}`); return }
    setSections(prev => prev.filter(x => x.id !== sec.id))
    setIdeas(prev => prev.map(i => i.section_id === sec.id ? { ...i, section_id: null } : i))
    if (filter === sec.id) setFilter('all')
  }

  // Idee naar een andere sectie schuiven.
  const moveIdea = async (idea, sectionId) => {
    const next = sectionId || null
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, section_id: next } : i))
    const { error } = await db.supabase.from('content_items')
      .update({ section_id: next, updated_at: new Date().toISOString() })
      .eq('id', idea.id)
    if (error) {
      console.error('move idea failed:', error)
      setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, section_id: idea.section_id } : i))
    }
  }

  const load = async () => {
    if (!db?.supabase || !coachId) return
    setLoading(true)
    const [{ data, error }, { data: secs }] = await Promise.all([
      db.supabase
        .from('content_items')
        .select('id, title, type, created_at, posted_at, section_id')
        .eq('coach_id', coachId)
        .eq('status', 'idea')
        .order('created_at', { ascending: false })
        .limit(200),
      db.supabase
        .from('content_sections')
        .select('id, title, position, created_at')
        .eq('coach_id', coachId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true }),
    ])
    if (error) console.error('load content_items failed:', error)
    setIdeas(data || [])
    setSections(secs || [])
    setLoading(false)
  }

  useEffect(() => { if (open || controlled) load() }, [open, coachId, controlled])
  useEffect(() => { if (typeof onCountChange === 'function') onCountChange(ideas.length) }, [ideas.length, onCountChange])

  const handleAdd = async () => {
    const t = title.trim()
    if (!t || !coachId) return
    setAdding(true)
    const { data, error } = await db.supabase
      .from('content_items')
      .insert({
        coach_id: coachId,
        title: t,
        type: 'reel',
        status: 'idea',
        // Staat er een sectie open? Dan landt het idee daar meteen in.
        section_id: (filter === 'all' || filter === 'geen') ? null : filter,
        created_at: new Date().toISOString(),
      })
      .select('id, title, type, created_at, posted_at, section_id')
      .single()
    setAdding(false)
    if (error) { console.error('insert content_item failed:', error); return }
    setIdeas(prev => [data, ...prev])
    setTitle('')
  }

  // Vink-toggle: zet posted_at op now() bij eerste klik, null bij heropenen.
  const handleTogglePosted = async (idea) => {
    const next = idea.posted_at ? null : new Date().toISOString()
    const optimistic = { ...idea, posted_at: next }
    setIdeas(prev => prev.map(i => i.id === idea.id ? optimistic : i))
    const { error } = await db.supabase
      .from('content_items')
      .update({ posted_at: next })
      .eq('id', idea.id)
    if (error) { console.error('toggle posted_at failed:', error); load() }
  }

  const handleDelete = async (idea) => {
    if (!window.confirm(`Idee "${idea.title}" verwijderen?`)) return
    setIdeas(prev => prev.filter(i => i.id !== idea.id))
    const { error } = await db.supabase.from('content_items').delete().eq('id', idea.id)
    if (error) { console.error('delete content_item failed:', error); load() }
  }

  const startEdit = (idea) => {
    setEditingId(idea.id)
    setEditingValue(idea.title || '')
  }
  const cancelEdit = () => { setEditingId(null); setEditingValue('') }
  const saveEdit = async () => {
    const next = editingValue.trim()
    if (!next || !editingId) { cancelEdit(); return }
    const id = editingId
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, title: next } : i))
    cancelEdit()
    const { error } = await db.supabase
      .from('content_items')
      .update({ title: next, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { console.error('update content_item failed:', error); load() }
  }

  const openInOutput = () => {
    // CoachHub's hash router → de output-tab. De gebruiker scrolt zelf naar
    // het idee als 'ie er één wil bewerken. We geven de hub een seintje
    // via een hash-change zodat de tab activeert.
    window.location.hash = '#output'
    setOpen(false)
  }

  return (
    <>
      {/* Side tab — alleen tonen in uncontrolled-mode (zonder sidebar). */}
      {!controlled && !open && (
        <button
          onClick={() => setOpen(true)}
          title="Content-ideeën"
          style={{
            position: 'fixed',
            right: 0,
            top: '55%',
            transform: 'translateY(-50%)',
            zIndex: 2147483500,
            width: 36, height: 56,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2,
            background: 'rgba(139,92,246,0.12)',
            borderTop: `1px solid ${PURPLE}40`,
            borderBottom: `1px solid ${PURPLE}40`,
            borderLeft: `1px solid ${PURPLE}40`,
            borderRadius: '8px 0 0 8px',
            color: '#c4b5fd',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Lightbulb size={15} />
          {ideas.length > 0 && (
            <span style={{ fontSize: '0.55rem', fontWeight: 800 }}>{ideas.length}</span>
          )}
        </button>
      )}

      {/* Backdrop — tap buiten het paneel sluit 'em (essentieel op mobiel
          waar de X-knop alleen te raken in de top-rechter hoek staat). */}
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
            width: 'min(470px, 100vw)',
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
              <Lightbulb size={16} color={PURPLE} />
              <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 800 }}>
                Content-ideeën
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 600 }}>
                {ideas.filter(i => !i.posted_at).length} open
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button
                onClick={() => setShowPosted(v => !v)}
                title={showPosted ? 'Verberg geposte' : 'Toon geposte'}
                style={iconBtn(showPosted ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.4)')}
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={openInOutput}
                title="Open Output-sectie voor volle bewerking"
                style={iconBtn('rgba(255,255,255,0.4)')}
              >
                <ExternalLink size={13} />
              </button>
              <button onClick={() => setOpen(false)} style={iconBtn('rgba(255,255,255,0.4)')}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body: sectie-rail links, invoer + lijst rechts — zelfde indeling
              als QuickTodoModal. Stond eerst als chips bovenaan; met meer dan
              een handvol secties moest je daar horizontaal scrollen. */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          <div style={{ width: 130, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '0.6rem 0.45rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 0.3rem 0.4rem' }}>
              <span style={{ flex: 1, fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Secties</span>
              <button onClick={addSection} title="Nieuwe sectie"
                style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderPlus size={11} />
              </button>
            </div>
            {[{ id: 'all', title: 'Alles' }, ...sections, ...(ideas.some(i => !i.section_id) ? [{ id: 'geen', title: 'Geen sectie' }] : [])].map(sec => {
              const aan = filter === sec.id
              const aantal = sec.id === 'all'
                ? ideas.filter(i => showPosted || !i.posted_at).length
                : ideas.filter(i => (showPosted || !i.posted_at) && (sec.id === 'geen' ? !i.section_id : i.section_id === sec.id)).length
              const echt = sec.id !== 'all' && sec.id !== 'geen'
              return (
                <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                  <button
                    onClick={() => setFilter(sec.id)}
                    onDoubleClick={() => { if (echt) renameSection(sec) }}
                    title={echt ? 'Dubbelklik om te hernoemen' : sec.title}
                    style={{
                      flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5,
                      padding: '0.4rem 0.45rem', borderRadius: 7,
                      background: aan ? 'rgba(139,92,246,0.16)' : 'transparent',
                      border: `1px solid ${aan ? PURPLE + '66' : 'transparent'}`,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}>
                    {sec.id === 'all'
                      ? <Layers size={11} color={aan ? '#c4b5fd' : 'rgba(255,255,255,0.45)'} style={{ flexShrink: 0 }} />
                      : <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: '50%', background: aan ? PURPLE : 'rgba(255,255,255,0.25)' }} />}
                    <span style={{ flex: 1, minWidth: 0, fontSize: '0.68rem', fontWeight: aan ? 800 : 600, color: aan ? '#c4b5fd' : 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.title}</span>
                    <span style={{ flexShrink: 0, fontSize: '0.56rem', fontWeight: 800, color: aan ? '#c4b5fd' : 'rgba(255,255,255,0.3)' }}>{aantal}</span>
                  </button>
                  {echt && aan && (
                    <button onClick={() => deleteSection(sec)} title="Sectie verwijderen"
                      style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 5, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Add new */}
          <div style={{
            padding: '0.75rem 0.85rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
          }}>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleAdd() }
              }}
              placeholder="Idee in één regel… (⌘+Enter)"
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
                background: title.trim() ? PURPLE : 'rgba(255,255,255,0.04)',
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
              {filter !== 'all' && filter !== 'geen'
                ? `Landt in "${sections.find(x => x.id === filter)?.title || 'sectie'}". `
                : ''}Belandt in Output → Ideeën. Bewerk details daar (script, b-rollen, format).
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {loading && ideas.length === 0 && (
              <div style={{ padding: '1rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center' }}>
                Laden…
              </div>
            )}
            {(() => {
              const opStatus = showPosted ? ideas : ideas.filter(i => !i.posted_at)
              const visible = filter === 'all'
                ? opStatus
                : opStatus.filter(i => filter === 'geen' ? !i.section_id : i.section_id === filter)
              if (!loading && visible.length === 0) {
                return (
                  <div style={{ padding: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'center' }}>
                    {filter !== 'all'
                      ? 'Nog geen ideeën in deze sectie.'
                      : (showPosted ? 'Nog geen ideeën.' : 'Geen open ideeën — strak gewerkt 🎉')}
                  </div>
                )
              }
              return visible.map(idea => {
                const posted = !!idea.posted_at
                return (
                  <div key={idea.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    background: posted ? 'rgba(16,185,129,0.04)' : 'rgba(139,92,246,0.04)',
                    border: `1px solid ${posted ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.12)'}`,
                    borderRadius: 8,
                    marginBottom: '0.375rem',
                  }}>
                    <button
                      onClick={() => handleTogglePosted(idea)}
                      title={posted ? 'Markeer als open' : 'Markeer als gepost'}
                      style={{
                        width: 20, height: 20, padding: 0, flexShrink: 0, marginTop: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: posted ? GREEN : 'transparent',
                        border: `1.5px solid ${posted ? GREEN : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: 4,
                        cursor: 'pointer', touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {posted && <Check size={12} color="#000" strokeWidth={3} />}
                    </button>
                    <div style={{
                      flex: 1,
                      fontSize: '0.78rem',
                      color: posted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)',
                      textDecoration: posted ? 'line-through' : 'none',
                      lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {editingId === idea.id ? (
                        <textarea
                          autoFocus
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                            if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                          }}
                          rows={2}
                          style={{
                            width: '100%', padding: '0.35rem 0.5rem',
                            background: 'rgba(255,255,255,0.06)',
                            border: `1px solid ${PURPLE}60`,
                            borderRadius: 6, color: '#fff',
                            fontSize: '0.78rem', outline: 'none', resize: 'vertical',
                            fontFamily: 'inherit', lineHeight: 1.4,
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => !posted && startEdit(idea)}
                          style={{ cursor: posted ? 'default' : 'text' }}
                          title={posted ? '' : 'Klik om te bewerken'}
                        >
                          {idea.title}
                        </span>
                      )}
                      <div style={{ marginTop: 4, fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                        {new Date(idea.created_at).toLocaleString('nl-NL', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                        {idea.type && idea.type !== 'reel' && ` · ${idea.type}`}
                        {posted && ` · gepost ${new Date(idea.posted_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}`}
                      </div>
                    </div>
                    {editingId !== idea.id && !posted && (
                      <button
                        onClick={() => startEdit(idea)}
                        title="Bewerken"
                        style={{
                          width: 24, height: 24, padding: 0, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'transparent', border: 'none',
                          color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                        }}
                      >
                        <Pencil size={11} />
                      </button>
                    )}
                    {/* Verplaatsen naar een andere sectie — alleen zichtbaar
                        zodra er secties bestaan. */}
                    {sections.length > 0 && (
                      <select
                        value={idea.section_id || ''}
                        onChange={(e) => moveIdea(idea, e.target.value || null)}
                        title="Verplaats naar sectie"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flexShrink: 0, maxWidth: 88, padding: '0.2rem 0.25rem', borderRadius: 6,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.55)', fontSize: '0.6rem', fontWeight: 700,
                          fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                        }}>
                        <option value="" style={{ background: '#0a0a0a' }}>Geen sectie</option>
                        {sections.map(sec => (
                          <option key={sec.id} value={sec.id} style={{ background: '#0a0a0a' }}>{sec.title}</option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => handleDelete(idea)}
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
                )
              })
            })()}
          </div>

          </div>{/* einde rechterkolom */}
          </div>{/* einde body */}
        </div>
      )}
    </>
  )
}

const iconBtn = (color) => ({
  // 40x40 voor een ruime tap-target — 28x28 was niet betrouwbaar op mobiel.
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
