// src/modules/output-planning/components/OutputHub.jsx
// Single-page content hub. Three stacked sections — no tabs:
//   1. Inbox       — loose ideas in `content_items` (status='idea')
//   2. Batches     — `content_batches` + `batch_items` (real batches)
//   3. Klaar       — `content_items` with status='ready' (no planned_date)
//
// Top action row has two primary buttons: "+ Idee" (quick) and "+ Batch".
// Every idea row has a Teleprompter button so you go from input → recording
// in one screen.

import { useEffect, useState } from 'react'
import {
  Plus, Inbox, Package, CheckCircle, Video, Edit3, Trash2,
  ChevronDown, ChevronRight, CalendarPlus, X, Clock, GripVertical,
} from 'lucide-react'

import BatchService from '../../content-batches/BatchService'
import BatchModal from '../../content-batches/components/BatchModal'
import EditBatchItemModal from '../../content-batches/components/EditBatchItemModal'
import PlanBatchItemModal from '../../content-batches/components/PlanBatchItemModal'
import BatchItemViewModal from '../../content-batches/components/BatchItemViewModal'
import BatchItemEditModal from '../../content-batches/components/BatchItemEditModal'
import PlanBatchModal from '../../content-batches/components/PlanBatchModal'
import ContentPlanningService from '../ContentPlanningService'

import BatchesListView from './content-library/BatchesListView'
import QuickIdeaModal from './QuickIdeaModal'
import TeleprompterModal from './TeleprompterModal'

const GOLD = '#FFD700'

// Engelse dag-namen zoals output_day_items ze opslaat (agenda-grid).
const DOW_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const localDateStr = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

// One-line preview of a long script: first ~110 chars, single line.
const snippet = (txt, max = 110) => {
  if (!txt) return ''
  const s = txt.replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

export default function OutputHub({ db, onPlanned }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  const [batchService] = useState(() => new BatchService(db.supabase))
  const [planningService] = useState(() => new ContentPlanningService(db.supabase))

  // Data
  const [ideas, setIdeas] = useState([])
  const [readyItems, setReadyItems] = useState([])
  const [batches, setBatches] = useState([])
  // User-defined inbox sections from `content_sections`. Ideas are grouped
  // under these via content_items.section_id. Items without a section land
  // under a virtual "Geen sectie" group.
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  // Top-level group toggles. Inbox starts collapsed per request — coach
  // expands the sections he cares about. Batches + Klaar stay open.
  const [openInbox, setOpenInbox] = useState(false)
  const [openBatches, setOpenBatches] = useState(true)
  const [openReady, setOpenReady] = useState(true)

  // Per-section expanded state (keyed by section id; '__none__' for the
  // unsectioned virtual group). All collapsed by default.
  const [openSectionIds, setOpenSectionIds] = useState({})
  const toggleSection = (id) =>
    setOpenSectionIds(prev => ({ ...prev, [id]: !prev[id] }))

  // Modals
  const [showIdeaModal, setShowIdeaModal] = useState(false)
  const [ideaToEdit, setIdeaToEdit] = useState(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [teleScript, setTeleScript] = useState(null) // { script, title }
  const [ideaToPlan, setIdeaToPlan] = useState(null) // idee dat in de agenda gepland wordt
  const [showEditBatchItem, setShowEditBatchItem] = useState(false)
  const [batchItemToEdit, setBatchItemToEdit] = useState(null)
  const [batchItemToPlan, setBatchItemToPlan] = useState(null)   // item dat in de agenda gepland wordt
  const [itemView, setItemView] = useState(null)                 // { item, format } voor Inzien
  const [itemEdit, setItemEdit] = useState(null)                 // { item, format } voor dynamisch Bewerken
  const [batchToPlan, setBatchToPlan] = useState(null)           // hele batch als opnamemoment inplannen

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      // Pull the full set of editable fields so re-opening an idea in the
      // QuickIdeaModal shows everything (type, hook, b_roll_list, notes) and
      // not just title + script.
      const idea_cols = 'id, title, type, hook, script, notes, b_roll_list, section_id, status, created_at, updated_at'
      const [{ data: ideasData }, { data: readyData }, batchData, { data: sectionsData }] = await Promise.all([
        db.supabase.from('content_items')
          .select(idea_cols)
          .eq('coach_id', user.id).eq('status', 'idea')
          .order('updated_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false }),
        db.supabase.from('content_items')
          .select(idea_cols)
          .eq('coach_id', user.id).eq('status', 'ready').is('planned_date', null)
          .order('updated_at', { ascending: false, nullsFirst: false }),
        batchService.getBatchesWithItems(user.id),
        db.supabase.from('content_sections')
          .select('id, title, position, created_at')
          .eq('coach_id', user.id)
          .order('position', { ascending: true })
          .order('created_at', { ascending: true }),
      ])
      setIdeas(ideasData || [])
      setReadyItems(readyData || [])
      setBatches(batchData || [])
      setSections(sectionsData || [])
    } catch (e) {
      console.error('OutputHub load failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh after the create-batch modal closes (it might have saved a new
  // batch). The BatchModal does its own save via `onSave`, but to keep this
  // hub simple we just refetch.
  useEffect(() => {
    if (!showBatchModal) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBatchModal])

  // ── Inbox-section actions ────────────────────────────────────────────────
  const createSection = async () => {
    const title = window.prompt('Naam voor nieuwe sectie?')?.trim()
    if (!title) return
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      const { data, error } = await db.supabase.from('content_sections')
        .insert({ coach_id: user.id, title, position: sections.length })
        .select().single()
      if (error) throw error
      setSections(prev => [...prev, data])
      setOpenSectionIds(prev => ({ ...prev, [data.id]: true }))
    } catch (e) {
      alert(`Sectie maken mislukt — ${e?.message || e}`)
    }
  }

  const renameSection = async (section) => {
    const title = window.prompt('Nieuwe naam?', section.title)?.trim()
    if (!title || title === section.title) return
    try {
      const { error } = await db.supabase.from('content_sections')
        .update({ title, updated_at: new Date().toISOString() }).eq('id', section.id)
      if (error) throw error
      setSections(prev => prev.map(s => s.id === section.id ? { ...s, title } : s))
    } catch (e) {
      alert(`Hernoemen mislukt — ${e?.message || e}`)
    }
  }

  const deleteSection = async (section) => {
    if (!window.confirm(`Sectie "${section.title}" verwijderen? Ideeën blijven, ze komen terug onder "Geen sectie".`)) return
    try {
      // FK has ON DELETE SET NULL, so items keep their data.
      const { error } = await db.supabase.from('content_sections').delete().eq('id', section.id)
      if (error) throw error
      setSections(prev => prev.filter(s => s.id !== section.id))
      setIdeas(prev => prev.map(i => i.section_id === section.id ? { ...i, section_id: null } : i))
    } catch (e) {
      alert(`Verwijderen mislukt — ${e?.message || e}`)
    }
  }

  // ── Idea actions ─────────────────────────────────────────────────────────
  const openNewIdea = () => { setIdeaToEdit(null); setShowIdeaModal(true) }
  const openEditIdea = (idea) => { setIdeaToEdit(idea); setShowIdeaModal(true) }
  const handleIdeaSaved = () => loadAll()
  const handleIdeaSaveAndRecord = (item) => {
    loadAll()
    setTeleScript({ script: item.script || '', title: item.title || 'Idee' })
  }

  const deleteIdea = async (idea) => {
    if (!window.confirm(`Idee "${idea.title}" verwijderen?`)) return
    try {
      await db.supabase.from('content_items').delete().eq('id', idea.id)
      setIdeas(prev => prev.filter(i => i.id !== idea.id))
      setReadyItems(prev => prev.filter(i => i.id !== idea.id))
    } catch (e) {
      alert(`Verwijderen mislukt — ${e?.message || e}`)
    }
  }

  const markIdeaReady = async (idea) => {
    try {
      await db.supabase.from('content_items')
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', idea.id)
      setIdeas(prev => prev.filter(i => i.id !== idea.id))
      setReadyItems(prev => [{ ...idea, status: 'ready' }, ...prev])
    } catch (e) {
      alert(`Verplaatsen mislukt — ${e?.message || e}`)
    }
  }

  const markReadyBackToIdea = async (item) => {
    try {
      await db.supabase.from('content_items')
        .update({ status: 'idea', updated_at: new Date().toISOString() })
        .eq('id', item.id)
      setReadyItems(prev => prev.filter(i => i.id !== item.id))
      setIdeas(prev => [{ ...item, status: 'idea' }, ...prev])
    } catch (e) {
      alert(`Terugzetten mislukt — ${e?.message || e}`)
    }
  }

  // ── Idee in de agenda plannen ──────────────────────────────────────────────
  // Maakt een item in het week-plan (output_day_items) op de gekozen datum/tijd,
  // met de titel + script van het idee. Verschijnt rechts in de Weekplanning.
  const planIdeaToAgenda = async (idea, dateStr, time) => {
    const user = await db.getCurrentUser()
    if (!user) throw new Error('Niet ingelogd')
    const d = new Date(`${dateStr}T00:00:00`)
    const monday = planningService.getMonday(d)
    const dayOfWeek = DOW_NAMES[d.getDay()]
    await planningService.createQuickItem(user.id, localDateStr(monday), {
      dayOfWeek,
      time: time || null,
      duration: 30,
      title: idea.title || 'Idee',
      description: idea.script ? snippet(idea.script, 200) : (idea.hook || null),
      phase: 'post',
      itemType: 'content',
      sourceContentId: idea.id || null,  // koppel aan het idee → script opvraagbaar
    })
  }

  // ── Slepen om te plannen (touch + muis) ─────────────────────────────────────
  // HTML5 drag werkt niet op touch; daarom een eigen pointer-drag vanaf de
  // sleep-greep. Een "ghost" volgt je vinger/cursor; bij loslaten zoeken we de
  // agenda-cel onder de pointer (data-plan-day/hour) en sturen een event waar de
  // Weekplanning op luistert.
  const beginIdeaDrag = (e, idea) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const ghost = document.createElement('div')
    ghost.textContent = idea.title || 'Idee'
    Object.assign(ghost.style, {
      position: 'fixed', zIndex: '2147483600', pointerEvents: 'none',
      left: `${e.clientX}px`, top: `${e.clientY}px`, transform: 'translate(-50%, -140%)',
      background: GOLD, color: '#0a0a0a', fontWeight: '800', fontSize: '0.78rem',
      padding: '0.4rem 0.7rem', borderRadius: '8px', maxWidth: '220px',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      boxShadow: '0 10px 28px rgba(0,0,0,0.55)',
    })
    document.body.appendChild(ghost)
    document.body.style.userSelect = 'none'

    let lastCell = null
    const highlight = (cell) => {
      if (lastCell === cell) return
      if (lastCell) lastCell.style.background = lastCell.__prevBg || ''
      lastCell = cell
      if (cell) { cell.__prevBg = cell.style.background; cell.style.background = 'rgba(255,215,0,0.28)' }
    }
    const cellAt = (x, y) => {
      const el = document.elementFromPoint(x, y)
      return el ? el.closest('[data-plan-day]') : null
    }
    const move = (ev) => {
      ev.preventDefault()
      ghost.style.left = `${ev.clientX}px`
      ghost.style.top = `${ev.clientY}px`
      highlight(cellAt(ev.clientX, ev.clientY))
    }
    const up = (ev) => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      document.removeEventListener('pointercancel', up)
      document.body.style.userSelect = ''
      const cell = cellAt(ev.clientX, ev.clientY)
      highlight(null)
      ghost.remove()
      if (cell) {
        const dayOfWeek = cell.getAttribute('data-plan-day')
        const hour = parseInt(cell.getAttribute('data-plan-hour'), 10)
        const time = `${String(Number.isFinite(hour) ? hour : 9).padStart(2, '0')}:00`
        window.dispatchEvent(new CustomEvent('myarc:plan-idea', { detail: { idea, dayOfWeek, time } }))
      }
    }
    document.addEventListener('pointermove', move, { passive: false })
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', up)
  }

  // ── Batch actions ────────────────────────────────────────────────────────
  const handleEditBatchItem = (item, batch) => {
    // Heeft de batch een custom format? Bewerk dan de dynamische velden.
    // Anders (oude batches) de klassieke edit-modal.
    if (batch?.format) setItemEdit({ item, format: batch.format })
    else { setBatchItemToEdit(item); setShowEditBatchItem(true) }
  }
  const handleSaveDynamicEdit = async (itemId, updates) => {
    await batchService.updateBatchItem(itemId, updates)
    await loadAll()
  }
  // Hele batch als opnamemoment in de agenda → herlaad lijst + agenda.
  const handlePlanBatchShoot = async (batchId, date, time) => {
    await batchService.planBatchShoot(batchId, date, time)
    await loadAll()
    onPlanned?.()
  }
  const handleSaveBatchItemEdit = async (itemId, updates) => {
    try {
      await batchService.updateBatchItem(itemId, updates)
      await loadAll()
    } catch (e) {
      console.error('Update batch item failed:', e)
    } finally {
      setShowEditBatchItem(false); setBatchItemToEdit(null)
    }
  }
  // Plan één batch-item in de agenda (datum + tijd) → herlaad lijst + agenda.
  const handlePlanBatchItem = async (itemId, date, time) => {
    await batchService.planBatchItem(itemId, date, time)
    await loadAll()
    onPlanned?.()   // agenda direct verversen
  }
  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Batch "${batch.batch_name || 'Naamloos'}" + alle items verwijderen?`)) return
    try {
      await batchService.deleteBatch(batch.id)
      setBatches(prev => prev.filter(b => b.id !== batch.id))
    } catch (e) {
      alert(`Verwijderen mislukt — ${e?.message || e}`)
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const sectionHeader = (icon, label, count, open, setOpen, trailing = null) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%',
      padding: isMobile ? '0.6rem 0.25rem' : '0.7rem 0.25rem',
      marginBottom: '0.3rem',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '0.55rem',
          background: 'transparent', border: 'none',
          color: '#fff', cursor: 'pointer', touchAction: 'manipulation',
          textAlign: 'left', padding: 0,
        }}
      >
        {open ? <ChevronDown size={18} color="rgba(255,255,255,0.5)" /> : <ChevronRight size={18} color="rgba(255,255,255,0.5)" />}
        {icon}
        <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800 }}>{label}</span>
        <span style={{
          background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
          padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700,
        }}>
          {count}
        </span>
      </button>
      {trailing}
    </div>
  )

  // Compacte idee-card in de stijl van de meal-/workout-cards: korte inhoud
  // bovenin (klikbaar = bewerken) + een strakke actie-rij onderaan met
  // scheidingslijnen i.p.v. een kolom losse knoppen.
  const DIVIDER = 'rgba(255,255,255,0.06)'
  const ideaAction = ({ icon, label, color, onClick, disabled, bg }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        padding: isMobile ? '0.42rem 0.3rem' : '0.48rem 0.4rem',
        background: bg || 'transparent', border: 'none',
        color: disabled ? 'rgba(255,255,255,0.2)' : color,
        fontSize: isMobile ? '0.62rem' : '0.66rem', fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 34,
      }}
    >
      {icon}{label}
    </button>
  )

  const ideaCard = (idea, inReady = false) => {
    const hasScript = !!idea.script?.trim()
    return (
      <div
        key={idea.id}
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${DIVIDER}`,
          borderRadius: 12, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Sleep-greep + inhoud (klik = bewerken) */}
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <button
            onPointerDown={(e) => beginIdeaDrag(e, idea)}
            title="Sleep naar een dag in de agenda om in te plannen"
            aria-label="Sleep om in te plannen"
            style={{
              flexShrink: 0, touchAction: 'none', cursor: 'grab',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 0.25rem 0 0.5rem', background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.3)', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <GripVertical size={16} />
          </button>
          <div
            onClick={() => openEditIdea(idea)}
            style={{ flex: 1, minWidth: 0, cursor: 'pointer', padding: isMobile ? '0.6rem 0.7rem 0.6rem 0' : '0.65rem 0.8rem 0.65rem 0' }}
          >
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0,
          }}>
            <div style={{
              flex: 1, minWidth: 0,
              fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 700, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {idea.title || '(geen titel)'}
            </div>
            {!hasScript && (
              <span style={{
                flexShrink: 0, fontSize: '0.55rem', fontWeight: 800, color: 'rgba(245,158,11,0.9)',
                background: 'rgba(245,158,11,0.12)', padding: '0.1rem 0.35rem', borderRadius: 5,
                textTransform: 'uppercase', letterSpacing: '0.03em',
              }}>
                geen script
              </span>
            )}
          </div>
          {hasScript && (
            <div style={{
              marginTop: 3, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.35,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {snippet(idea.script)}
            </div>
          )}
          {idea.created_at && (
            <div style={{ marginTop: 4, fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              {formatDate(idea.created_at)}
            </div>
          )}
          </div>
        </div>

        {/* Actie-rij onderaan met verticale scheidingslijnen */}
        <div style={{ display: 'flex', borderTop: `1px solid ${DIVIDER}` }}>
          {ideaAction({
            icon: <Video size={13} />, label: 'Tele',
            color: hasScript ? GOLD : 'rgba(255,255,255,0.2)', disabled: !hasScript,
            onClick: () => setTeleScript({ script: idea.script || '', title: idea.title || 'Idee' }),
          })}
          <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
          {ideaAction({
            icon: <CalendarPlus size={12} />, label: 'Plan', color: GOLD,
            onClick: () => setIdeaToPlan(idea),
          })}
          <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
          {ideaAction({
            icon: <Edit3 size={12} />, label: 'Bewerk', color: 'rgba(255,255,255,0.7)',
            onClick: () => openEditIdea(idea),
          })}
          <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
          {inReady
            ? ideaAction({
                icon: <Inbox size={12} />, label: 'Inbox', color: 'rgba(255,255,255,0.6)',
                onClick: () => markReadyBackToIdea(idea),
              })
            : ideaAction({
                icon: <CheckCircle size={12} />, label: 'Klaar',
                color: hasScript ? '#10b981' : 'rgba(255,255,255,0.2)', disabled: !hasScript,
                onClick: () => markIdeaReady(idea),
              })}
          <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
          {ideaAction({
            icon: <Trash2 size={12} />, label: 'Wis', color: 'rgba(239,68,68,0.7)',
            onClick: () => deleteIdea(idea),
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: isMobile ? '0.75rem' : '1.25rem',
      maxWidth: 1000, margin: '0 auto', width: '100%',
    }}>
      {/* Top action bar */}
      <div style={{
        display: 'flex', gap: '0.5rem',
        marginBottom: isMobile ? '0.85rem' : '1.1rem',
      }}>
        <button
          onClick={openNewIdea}
          style={{
            flex: '1 1 0', minHeight: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            background: GOLD, color: '#000', border: 'none', borderRadius: 10,
            fontWeight: 800, fontSize: isMobile ? '0.9rem' : '0.95rem',
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        >
          <Plus size={18} strokeWidth={3} /> Idee
        </button>
        <button
          onClick={() => setShowBatchModal(true)}
          style={{
            flex: '1 1 0', minHeight: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            background: 'rgba(255,255,255,0.06)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
            fontWeight: 700, fontSize: isMobile ? '0.9rem' : '0.95rem',
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        >
          <Package size={18} /> Nieuwe batch
        </button>
      </div>

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Laden…
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* ── INBOX ─────────────────────────────────────────────────────── */}
          <section>
            {sectionHeader(
              <Inbox size={isMobile ? 16 : 18} color={GOLD} />,
              'Inbox',
              ideas.length,
              openInbox, setOpenInbox,
              <button
                onClick={(e) => { e.stopPropagation(); createSection() }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.35rem 0.65rem', minHeight: 34,
                  background: 'rgba(255,215,0,0.12)',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: 6, color: GOLD,
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
                title="Nieuwe sectie"
              >
                <Plus size={13} /> Sectie
              </button>,
            )}
            {openInbox && (() => {
              // Build groups: user sections (in order) + virtual "Geen sectie".
              const groupOf = (sec) => ideas.filter(i => (i.section_id || null) === (sec?.id || null))
              const unassigned = groupOf(null)
              const groups = [
                ...sections.map(sec => ({ key: sec.id, section: sec, items: groupOf(sec) })),
                ...(unassigned.length > 0 || sections.length === 0
                  ? [{ key: '__none__', section: null, items: unassigned }]
                  : []),
              ]

              if (ideas.length === 0 && sections.length === 0) {
                return (
                  <div style={{
                    padding: isMobile ? '1rem' : '1.5rem', textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10,
                    color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem',
                  }}>
                    Klik op <strong>+ Idee</strong> om je eerste idee toe te voegen,
                    of maak een <strong>sectie</strong> om te groeperen.
                  </div>
                )
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {groups.map(g => {
                    const isOpenSection = !!openSectionIds[g.key]
                    const isVirtual = g.section === null
                    return (
                      <div
                        key={g.key}
                        style={{
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.02)',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: isMobile ? '0.5rem 0.65rem' : '0.6rem 0.8rem',
                        }}>
                          <button
                            onClick={() => toggleSection(g.key)}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem',
                              background: 'transparent', border: 'none', color: '#fff',
                              cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation',
                              padding: 0,
                            }}
                          >
                            {isOpenSection
                              ? <ChevronDown size={16} color="rgba(255,255,255,0.5)" />
                              : <ChevronRight size={16} color="rgba(255,255,255,0.5)" />}
                            <span style={{
                              fontSize: isMobile ? '0.88rem' : '0.95rem',
                              fontWeight: 700,
                              color: isVirtual ? 'rgba(255,255,255,0.55)' : '#fff',
                              fontStyle: isVirtual ? 'italic' : 'normal',
                            }}>
                              {isVirtual ? 'Geen sectie' : g.section.title}
                            </span>
                            <span style={{
                              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                              padding: '1px 7px', borderRadius: 12, fontSize: '0.65rem', fontWeight: 700,
                            }}>
                              {g.items.length}
                            </span>
                          </button>
                          {!isVirtual && (
                            <>
                              <button
                                onClick={() => renameSection(g.section)}
                                title="Hernoem sectie"
                                style={{
                                  width: 32, height: 32, display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  background: 'transparent',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: 6, color: 'rgba(255,255,255,0.55)',
                                  cursor: 'pointer', touchAction: 'manipulation',
                                }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => deleteSection(g.section)}
                                title="Verwijder sectie"
                                style={{
                                  width: 32, height: 32, display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  background: 'transparent',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: 6, color: 'rgba(255,255,255,0.45)',
                                  cursor: 'pointer', touchAction: 'manipulation',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>

                        {isOpenSection && (
                          <div style={{
                            padding: isMobile ? '0 0.5rem 0.55rem' : '0 0.6rem 0.6rem',
                            display: 'flex', flexDirection: 'column', gap: '0.4rem',
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                          }}>
                            {g.items.length === 0 ? (
                              <div style={{
                                padding: '0.6rem', textAlign: 'center',
                                color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem',
                              }}>
                                Nog geen ideeën in deze sectie.
                              </div>
                            ) : (
                              g.items.map(idea => ideaCard(idea, false))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </section>

          {/* ── BATCHES ───────────────────────────────────────────────────── */}
          <section>
            {sectionHeader(
              <Package size={isMobile ? 16 : 18} color={GOLD} />,
              'Batches',
              batches.length,
              openBatches, setOpenBatches,
            )}
            {openBatches && (
              <BatchesListView
                batches={batches}
                loading={false}
                onCreateBatch={null}   /* button lives in the top bar */
                onEditItem={handleEditBatchItem}
                onViewItem={(item, batch) => setItemView({ item, format: batch?.format || null })}
                onPlanItem={(item) => setBatchItemToPlan(item)}
                onPlanBatch={(batch) => setBatchToPlan(batch)}
                onDeleteBatch={handleDeleteBatch}
                isMobile={isMobile}
              />
            )}
          </section>

          {/* ── KLAAR OM TE PLANNEN ───────────────────────────────────────── */}
          <section>
            {sectionHeader(
              <CheckCircle size={isMobile ? 16 : 18} color="#10b981" />,
              'Klaar om te plannen',
              readyItems.length,
              openReady, setOpenReady,
            )}
            {openReady && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {readyItems.length === 0 ? (
                  <div style={{
                    padding: isMobile ? '1rem' : '1.5rem', textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10,
                    color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem',
                  }}>
                    Markeer een idee als ✓ klaar om 'm hier te krijgen.
                  </div>
                ) : (
                  readyItems.map(item => ideaCard(item, true))
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modals */}
      <QuickIdeaModal
        isOpen={showIdeaModal}
        onClose={() => setShowIdeaModal(false)}
        onSaved={handleIdeaSaved}
        onSaveAndRecord={handleIdeaSaveAndRecord}
        initial={ideaToEdit}
        sections={sections}
        db={db}
      />

      <BatchModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSave={async (batchData) => {
          // Sla de batch + items ECHT op (voorheen deed onSave niets → batch
          // verdween). onPlanned() laat óók de AGENDA direct herladen, zodat een
          // zojuist ingepland item meteen zichtbaar is (voorheen bleef de agenda
          // op de oude data staan).
          const user = await db.getCurrentUser()
          await batchService.createBatch(user.id, batchData)
          setShowBatchModal(false)
          onPlanned?.()
        }}
        db={db}
        isMobile={isMobile}
      />

      <EditBatchItemModal
        isOpen={showEditBatchItem}
        onClose={() => { setShowEditBatchItem(false); setBatchItemToEdit(null) }}
        onSave={handleSaveBatchItemEdit}
        batchItem={batchItemToEdit}
        isMobile={isMobile}
      />

      {/* Inzien — toont de ingevulde format-velden */}
      <BatchItemViewModal
        isOpen={!!itemView}
        onClose={() => setItemView(null)}
        item={itemView?.item}
        format={itemView?.format}
        onPlan={(item) => setBatchItemToPlan(item)}
        isMobile={isMobile}
      />

      {/* Inplannen — datum + tijd kiezen voor één item */}
      <PlanBatchItemModal
        isOpen={!!batchItemToPlan}
        onClose={() => setBatchItemToPlan(null)}
        batchItem={batchItemToPlan}
        onSave={handlePlanBatchItem}
        isMobile={isMobile}
      />

      {/* Bewerken — dynamische custom velden */}
      <BatchItemEditModal
        isOpen={!!itemEdit}
        onClose={() => setItemEdit(null)}
        item={itemEdit?.item}
        format={itemEdit?.format}
        onSave={handleSaveDynamicEdit}
        isMobile={isMobile}
      />

      {/* Hele batch als opnamemoment inplannen */}
      <PlanBatchModal
        isOpen={!!batchToPlan}
        onClose={() => setBatchToPlan(null)}
        batch={batchToPlan}
        onSave={handlePlanBatchShoot}
        isMobile={isMobile}
      />

      <TeleprompterModal
        isOpen={!!teleScript}
        onClose={() => setTeleScript(null)}
        script={teleScript?.script}
        title={teleScript?.title}
      />

      {ideaToPlan && (
        <PlanIdeaModal
          idea={ideaToPlan}
          isMobile={isMobile}
          onClose={() => setIdeaToPlan(null)}
          onConfirm={async (dateStr, time) => {
            await planIdeaToAgenda(ideaToPlan, dateStr, time)
            setIdeaToPlan(null)
            onPlanned?.()  // laat de agenda direct herladen
          }}
        />
      )}
    </div>
  )
}

// ── Plan-modal: kies dag + tijd, idee gaat naar de Weekplanning (agenda) ──────
function PlanIdeaModal({ idea, onClose, onConfirm, isMobile }) {
  const today = new Date()
  const [date, setDate] = useState(localDateStr(today))
  const [time, setTime] = useState('09:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!date) { setError('Kies een datum.'); return }
    setSaving(true); setError('')
    try {
      await onConfirm(date, time)
    } catch (e) {
      setError(e?.message || 'Plannen mislukt'); setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.7rem 0.75rem', background: '#000',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff',
    fontSize: '0.95rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark',
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
      zIndex: 10050, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      padding: isMobile ? 0 : '1.5rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, background: '#0a0a0a',
        border: '1px solid rgba(255,215,0,0.25)', borderRadius: isMobile ? '16px 16px 0 0' : 16,
        padding: isMobile ? '1.1rem 1rem 1.5rem' : '1.3rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarPlus size={18} color={GOLD} /> Inplannen
          </h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {idea.title || 'Idee'}
        </div>

        <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Datum</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, marginBottom: '0.85rem' }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}><Clock size={11} /> Tijd</label>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, marginBottom: error ? '0.6rem' : '1.1rem' }} />

        {error && <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.8rem' }}>{error}</div>}

        <button onClick={submit} disabled={saving} style={{
          width: '100%', padding: '0.85rem', borderRadius: 10, border: 'none',
          background: saving ? 'rgba(255,215,0,0.35)' : 'linear-gradient(135deg,#FFD700,#D4AF37)',
          color: '#0a0a0a', fontSize: '0.95rem', fontWeight: 900, cursor: saving ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <CalendarPlus size={16} /> {saving ? 'Plannen…' : 'Zet in agenda'}
        </button>
      </div>
    </div>
  )
}
