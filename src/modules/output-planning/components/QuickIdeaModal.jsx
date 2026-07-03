// src/modules/output-planning/components/QuickIdeaModal.jsx
// Bottom-sheet for adding/editing an idea in `content_items`. Captures:
// titel, format (type), hook, script, b-rollen / ondersteunend beeld,
// notities. New ideas land in `content_items` with status='idea'.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Video, Plus, Trash2, Check } from 'lucide-react'

const GOLD = '#FFD700'

// `content_items.type` is NOT NULL — must default to one of these slugs.
// Labels are user-facing; slugs are what we store.
const TYPE_OPTIONS = [
  { value: 'reel',     label: 'Reel' },
  { value: 'carousel', label: 'Carrousel' },
  { value: 'story',    label: 'Story' },
  { value: 'post',     label: 'Foto-post' },
  { value: 'video',    label: 'Video' },
]

// Unique id helper for b-roll rows (so React can key them stably while
// editing). Saved to DB along with the description.
const newId = () => `br_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

export default function QuickIdeaModal({
  isOpen,
  onClose,
  onSaved,
  onSaveAndRecord,
  initial,
  db,
  sections = [],          // [{id, title}] — user inbox sections
  defaultSectionId = null, // pre-selected section when adding new
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('reel')
  const [hook, setHook] = useState('')
  const [script, setScript] = useState('')
  const [notes, setNotes] = useState('')
  const [bRolls, setBRolls] = useState([]) // [{id, description}]
  const [sectionId, setSectionId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Autosave-als-concept: id van de (concept-)rij + laatst-opgeslagen snapshot,
  // zodat we niet dubbel inserten en niet onnodig opnieuw opslaan.
  const [savedTick, setSavedTick] = useState(false)
  const draftIdRef = useRef(null)   // synchroon → geen dubbele inserts
  const baselineRef = useRef('')
  const saveChainRef = useRef(Promise.resolve())

  // Lock body scroll while the sheet is open — otherwise iOS Safari treats
  // a swipe inside the sheet as a swipe on the page behind it and the user
  // can't reach the bottom buttons.
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setTitle(initial?.title || '')
    setType(initial?.type || 'reel')
    setHook(initial?.hook || '')
    setScript(initial?.script || '')
    setNotes(initial?.notes || '')
    // For edits we honor the saved section_id; for new ideas the parent can
    // pre-select via defaultSectionId (e.g. when adding from inside a section).
    setSectionId(initial?.section_id || defaultSectionId || '')
    // b_roll_list can come back as either array-of-strings or array-of-objects
    // depending on origin (VideoBlueprint uses objects, older entries strings).
    const incoming = initial?.b_roll_list
    if (Array.isArray(incoming) && incoming.length > 0) {
      setBRolls(incoming.map(b =>
        typeof b === 'string'
          ? { id: newId(), description: b }
          : { id: b.id || newId(), description: b.description || '' }
      ))
    } else {
      setBRolls([])
    }
    setError('')
    draftIdRef.current = initial?.id || null
    setSavedTick(false)
    // Baseline = wat er bij openen al stond, zodat autosave niks doet tot je
    // daadwerkelijk iets wijzigt (voorkomt ongewenst opslaan bij enkel openen).
    const baseBRolls = Array.isArray(initial?.b_roll_list)
      ? initial.b_roll_list.map(b => (typeof b === 'string' ? b : (b?.description || '')).trim()).filter(Boolean)
      : []
    baselineRef.current = JSON.stringify({
      title: (initial?.title || '').trim(),
      type: initial?.type || 'reel',
      hook: (initial?.hook || '').trim(),
      script: (initial?.script || '').trim(),
      notes: (initial?.notes || '').trim(),
      sectionId: initial?.section_id || defaultSectionId || '',
      bRolls: baseBRolls,
    })
  }, [isOpen, initial, defaultSectionId])

  // Huidige inhoud als vergelijkbare snapshot (zelfde vorm als baseline).
  const serialize = () => JSON.stringify({
    title: title.trim(), type, hook: hook.trim(), script: script.trim(),
    notes: notes.trim(), sectionId: sectionId || '',
    bRolls: bRolls.map(b => (b.description || '').trim()).filter(Boolean),
  })
  const hasContent = !!(
    title.trim() || hook.trim() || script.trim() || notes.trim() ||
    bRolls.some(b => (b.description || '').trim())
  )

  // ── Autosave als concept (debounced) ──
  // Slaat tijdens het uitwerken automatisch op, zodat een dichtklappende modal
  // nooit je werk weggooit. Pas actief zodra je echt iets wijzigt.
  useEffect(() => {
    if (!isOpen) return
    if (!hasContent) return
    if (serialize() === baselineRef.current) return
    setSavedTick(false) // er zijn onopgeslagen wijzigingen
    const t = setTimeout(() => { enqueueSave(true) }, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, title, type, hook, script, notes, bRolls, sectionId])

  if (!isOpen) return null

  const canSave = title.trim().length > 0 && !saving

  const addBRoll = () => setBRolls(prev => [...prev, { id: newId(), description: '' }])
  const updateBRoll = (id, val) =>
    setBRolls(prev => prev.map(b => (b.id === id ? { ...b, description: val } : b)))
  const removeBRoll = (id) => setBRolls(prev => prev.filter(b => b.id !== id))

  const doPersist = async ({ silent = false } = {}) => {
    if (!hasContent) return null
    if (!silent) setSaving(true)
    setError('')
    try {
      const user = await db.getCurrentUser()
      if (!user) throw new Error('Niet ingelogd')

      // Strip empty rows, keep stable ids so a re-open shows the same list.
      const cleanedBRolls = bRolls
        .filter(b => (b.description || '').trim())
        .map(b => ({ id: b.id, description: b.description.trim() }))

      const payload = {
        coach_id: user.id,
        // Titel is verplicht in de DB — val terug op "(concept)" zodat een
        // half-uitgewerkt idee zonder titel tóch veilig wordt bewaard.
        title: title.trim() || '(concept)',
        type,
        hook: hook.trim() || null,
        script: script.trim() || null,
        notes: notes.trim() || null,
        b_roll_list: cleanedBRolls,
        section_id: sectionId || null,
        status: 'idea',
        updated_at: new Date().toISOString(),
      }

      // Hergebruik de bestaande rij (bij bewerken) of de concept-rij die de
      // autosave al aanmaakte — zo ontstaan er geen duplicaten.
      const effectiveId = draftIdRef.current || initial?.id
      let data
      if (effectiveId) {
        const { data: d, error: err } = await db.supabase
          .from('content_items').update(payload).eq('id', effectiveId)
          .select().single()
        if (err) throw err
        data = d
      } else {
        const { data: d, error: err } = await db.supabase
          .from('content_items').insert({ ...payload, created_at: new Date().toISOString() })
          .select().single()
        if (err) throw err
        data = d
        draftIdRef.current = d.id
      }
      baselineRef.current = serialize()
      setSavedTick(true)
      return data
    } catch (e) {
      console.error('QuickIdeaModal save failed:', e)
      if (!silent) setError(e?.message || 'Opslaan mislukt')
      return null
    } finally {
      if (!silent) setSaving(false)
    }
  }

  // Serialiseer alle opslag-acties (autosave + handmatig) zodat ze elkaar niet
  // overlappen — voorkomt dubbele inserts.
  const enqueueSave = (silent) => {
    const next = saveChainRef.current.then(() => doPersist({ silent })).catch(() => null)
    saveChainRef.current = next.then(() => {}, () => {})
    return next
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Geef je idee eerst een titel.'); return }
    const item = await enqueueSave(false)
    if (item) { onSaved?.(item); onClose?.() }
  }
  const handleSaveRecord = async () => {
    if (!title.trim()) { setError('Geef je idee eerst een titel.'); return }
    const item = await enqueueSave(false)
    if (item) { onSaveAndRecord?.(item); onClose?.() }
  }

  // Sluiten = eerst als concept flushen, dán pas sluiten. Zo verlies je nooit
  // wat je net hebt getypt, ook niet bij een per ongeluk dichtgeklapte modal.
  const closeWithSave = async () => {
    if (hasContent && serialize() !== baselineRef.current) {
      const item = await enqueueSave(true)
      if (item) onSaved?.(item)
    }
    onClose?.()
  }

  const labelStyle = {
    display: 'block', fontSize: '0.7rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.55)', marginBottom: 4,
    letterSpacing: '0.04em', textTransform: 'uppercase',
  }
  const inputBase = {
    width: '100%', boxSizing: 'border-box',
    padding: '0.75rem 0.85rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    color: '#fff', fontSize: '0.95rem', fontWeight: 600,
    outline: 'none', fontFamily: 'inherit',
  }

  const sheet = (
    <div
      onClick={closeWithSave}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 2147483500, display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640,
          background: '#0a0a0a', borderRadius: '16px 16px 0 0',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '1rem 1rem calc(1rem + env(safe-area-inset-bottom)) 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.85rem',
          maxHeight: '92vh', overflow: 'auto',
          // Keep swipe-scroll inside the sheet — without this iOS chains
          // the touch up to the body once the sheet has nothing left to
          // scroll, and the bottom Save button stays out of reach.
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 800 }}>
              {initial?.id ? 'Idee bewerken' : 'Nieuw idee'}
            </div>
            {/* Concept-status zodat je ziet dat je werk veilig is */}
            {savedTick && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: '0.62rem', fontWeight: 700, color: '#10b981',
                background: 'rgba(16,185,129,0.12)', padding: '0.15rem 0.45rem', borderRadius: 999,
              }}>
                <Check size={11} strokeWidth={3} /> Concept opgeslagen
              </span>
            )}
          </div>
          <button
            onClick={closeWithSave}
            style={{
              minWidth: 40, minHeight: 40, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              borderRadius: 8, color: '#fff', cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Sectie-kiezer — alleen tonen als coach ten minste 1 sectie heeft */}
        {sections.length > 0 && (
          <div>
            <label style={labelStyle}>Sectie</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              style={{ ...inputBase, minHeight: 48 }}
            >
              <option value="">Geen sectie</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Titel + format in één rij — bespaart verticale ruimte. */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: '2 1 200px', minWidth: 0 }}>
            <label style={labelStyle}>Titel</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bv. Skinny fat mythe ontkracht"
              autoFocus
              style={{ ...inputBase, minHeight: 48 }}
            />
          </div>
          <div style={{ flex: '1 1 120px', minWidth: 120 }}>
            <label style={labelStyle}>Format</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ ...inputBase, minHeight: 48, paddingRight: '0.4rem' }}
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Hook (opening-zin)</label>
          <textarea
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            placeholder="De openingszin die scrollers stopt…"
            rows={2}
            style={{ ...inputBase, resize: 'vertical', lineHeight: 1.4 }}
          />
        </div>

        <div>
          <label style={labelStyle}>Script</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="De tekst die je wil oplezen in de teleprompter…"
            rows={7}
            style={{ ...inputBase, fontSize: '0.9rem', lineHeight: 1.5, resize: 'vertical' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>B-rollen / ondersteunend beeld</label>
            <button
              type="button"
              onClick={addBRoll}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.35rem 0.6rem', minHeight: 32,
                background: 'rgba(255,215,0,0.12)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 6, color: GOLD,
                fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                touchAction: 'manipulation',
              }}
            >
              <Plus size={13} /> Toevoegen
            </button>
          </div>
          {bRolls.length === 0 ? (
            <div style={{
              padding: '0.6rem 0.75rem', borderRadius: 8,
              background: 'rgba(255,255,255,0.025)',
              border: '1px dashed rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem',
            }}>
              Nog geen b-rollen. Bv. <em>"closeup biceps"</em>, <em>"workout flow"</em>, <em>"voor & na foto"</em>.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {bRolls.map((b, i) => (
                <div key={b.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <div style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: 4,
                    background: 'rgba(255,215,0,0.1)', color: GOLD,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <input
                    value={b.description}
                    onChange={(e) => updateBRoll(b.id, e.target.value)}
                    placeholder="Wat je in beeld brengt…"
                    style={{ ...inputBase, minHeight: 42, fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeBRoll(b.id)}
                    title="Verwijder"
                    style={{
                      flexShrink: 0, width: 36, height: 42,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, color: 'rgba(255,255,255,0.45)',
                      cursor: 'pointer', touchAction: 'manipulation',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Notities</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Productie-tips, locatie, edit-instructies…"
            rows={3}
            style={{ ...inputBase, fontSize: '0.85rem', lineHeight: 1.4, resize: 'vertical' }}
          />
        </div>

        {error && (
          <div style={{
            padding: '0.55rem 0.7rem', borderRadius: 6,
            background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
            fontSize: '0.8rem', fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: '1 1 140px', minHeight: 48, padding: '0 0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: 'none', borderRadius: 8,
              fontSize: '0.85rem', fontWeight: 700,
              cursor: canSave ? 'pointer' : 'not-allowed',
              opacity: canSave ? 1 : 0.4,
            }}
          >
            <Save size={16} /> Opslaan
          </button>
          <button
            onClick={handleSaveRecord}
            disabled={!canSave}
            style={{
              flex: '1 1 180px', minHeight: 48, padding: '0 0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              background: canSave ? GOLD : 'rgba(255,255,255,0.05)',
              color: canSave ? '#000' : 'rgba(255,255,255,0.3)',
              border: 'none', borderRadius: 8,
              fontSize: '0.85rem', fontWeight: 800,
              cursor: canSave ? 'pointer' : 'not-allowed',
            }}
          >
            <Video size={16} /> Opslaan + Teleprompter
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(sheet, document.body)
}
