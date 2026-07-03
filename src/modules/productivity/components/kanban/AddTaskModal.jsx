// src/modules/productivity/components/kanban/AddTaskModal.jsx
// VERSION 3.0 — Autosave to DB + confirm on close
//
// Behaviour changes vs v2.0:
//   1. As soon as the user types anything meaningful (title or a step), the
//      modal creates a draft task in the DB via `onAutoCreate`. Every
//      subsequent edit is debounced-saved via `onAutoUpdate` so nothing is
//      ever lost when the modal closes accidentally.
//   2. The X / backdrop / Annuleer buttons now ask the user what to do with
//      the in-progress draft (Bewaren / Verwijderen / Terug) so a fat-finger
//      doesn't nuke the work.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Flag, Tag, Clock, Plus, Circle, Trash2, Timer, Layers, Repeat, CheckCircle2, CalendarMinus } from 'lucide-react'
import TaskLogSection from './TaskLogSection'

const WEEK_DAYS = [
  { id: 'monday',    short: 'Ma' },
  { id: 'tuesday',   short: 'Di' },
  { id: 'wednesday', short: 'Wo' },
  { id: 'thursday',  short: 'Do' },
  { id: 'friday',    short: 'Vr' },
  { id: 'saturday',  short: 'Za' },
  { id: 'sunday',    short: 'Zo' },
]

const genId = () => Math.random().toString(36).slice(2, 9)
const AUTOSAVE_DELAY_MS = 700

export default function AddTaskModal({
  isMobile,
  onClose,
  onSubmit,
  // New optional handlers for the DB-backed draft flow. When provided the
  // modal auto-saves; when omitted it falls back to the original single-shot
  // submit so legacy call-sites keep working.
  onAutoCreate,   // async (taskData) => task
  onAutoUpdate,   // async (taskId, updates) => void
  onAutoDelete,   // async (taskId) => void
  // Sections list + default-pick so the user can move a task between
  // columns at creation time instead of always defaulting to "Niet
  // toegewezen" (or whatever section the caller pre-picked).
  sections = [],
  defaultSectionId = null,
  // Pre-fill from the agenda when the modal was opened by tapping an
  // empty cell. Shape: { day, startTime, endTime }
  agendaPreset = null,
  // Edit mode — when provided, all autosaves go via onAutoUpdate against
  // this task's id instead of creating a new draft. Lets one modal serve
  // both "new" and "edit" flows.
  initialTask = null,
  // Needed for the optional Logboek section (only renders for recurring
  // tasks in edit-mode).
  db = null,
  coachId = null,
  // Mark this task as done. Same handler the kanban card uses, so the
  // reflection-modal still fires for needs_reflection tasks.
  onCompleteTask = null,
  // Strip scheduling fields and push the task back to "Niet gepland".
  // Same write-shape the agenda-sidebar drop handler uses.
  onUnscheduleTask = null,
}) {
  // Default estimated_minutes from the preset (when opened on a 30-min
  // empty slot we want the picker to already say 30).
  const presetDur = (() => {
    if (!agendaPreset?.startTime || !agendaPreset?.endTime) return ''
    const [sh, sm] = agendaPreset.startTime.split(':').map(Number)
    const [eh, em] = agendaPreset.endTime.split(':').map(Number)
    const min = (eh * 60 + em) - (sh * 60 + sm)
    return min > 0 ? min : ''
  })()
  const isEditMode = !!initialTask?.id
  const [formData, setFormData] = useState(() => ({
    title:             initialTask?.title || '',
    description:       initialTask?.description || '',
    priority:          initialTask?.priority || 'medium',
    category:          initialTask?.category || '',
    deadline:          initialTask?.deadline || '',
    needs_reflection:  initialTask?.needs_reflection !== false,
    estimated_minutes: initialTask?.estimated_minutes ?? presetDur,
    color:             initialTask?.color || '',
  }))
  const [sectionId, setSectionId] = useState(() => {
    if (initialTask?.section_id) return initialTask.section_id
    return defaultSectionId && defaultSectionId !== 'unassigned' ? defaultSectionId : ''
  })
  // Recurring state — when active, the task repeats every week on the
  // selected weekdays. Pre-fill from the existing task (edit mode) or from
  // the agenda preset day.
  const [recurrenceActive, setRecurrenceActive] = useState(!!initialTask?.recurrence_active)
  const [recurrenceDays, setRecurrenceDays] = useState(
    (Array.isArray(initialTask?.recurrence_days) && initialTask.recurrence_days.length > 0)
      ? initialTask.recurrence_days
      : (agendaPreset?.day ? [agendaPreset.day] : [])
  )
  const toggleRecurrenceDay = (d) => {
    setRecurrenceDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  const [steps, setSteps] = useState(() =>
    Array.isArray(initialTask?.steps) ? initialTask.steps : []
  )
  const [newStepText, setNewStepText] = useState('')
  const [titleError, setTitleError] = useState(false)
  // For recurring tasks in edit-mode the focus is the daily logbook —
  // collapse all edit-fields by default so the coach lands straight on
  // "log vandaag" instead of scrolling past description/prio/recurring
  // pickers etc. Create-mode (or non-recurring edit) stays expanded.
  const [detailsOpen, setDetailsOpen] = useState(
    !(initialTask?.id && initialTask?.recurrence_active)
  )

  // Draft autosave bookkeeping
  // In edit mode the existing task IS the draft — every autosave is an
  // update against this id, no create needed.
  const [draftId, setDraftId] = useState(initialTask?.id || null)
  const [savingState, setSavingState] = useState('idle') // 'idle' | 'saving' | 'saved'
  const debounceRef = useRef(null)
  const inFlightRef = useRef(false)
  const submittedRef = useRef(false)
  // Onthoudt of er een wijziging is overgeslagen terwijl een save liep, +
  // altijd-actuele waarden zodat de retry/flush nooit een stale payload pakt.
  const pendingRef = useRef(false)
  const draftIdRef = useRef(initialTask?.id || null)
  const latestRef = useRef(null)

  const autosaveEnabled = !!(onAutoCreate && onAutoUpdate && onAutoDelete)

  // True when the form has meaningful content the user shouldn't lose.
  const hasContent =
    formData.title.trim().length > 0 ||
    formData.description.trim().length > 0 ||
    formData.category !== '' ||
    formData.deadline !== '' ||
    formData.estimated_minutes !== '' ||
    steps.length > 0

  // Altijd-actuele payload-bouwstenen, zodat doSave (na een debounce/await)
  // nooit een verouderde formData pakt.
  latestRef.current = { formData, steps, sectionId, recurrenceActive, recurrenceDays }
  draftIdRef.current = draftId || draftIdRef.current

  // Eén opslag-poging met de NIEUWSTE waarden. Komt er een wijziging binnen
  // terwijl deze nog loopt (inFlightRef), dan markeren we 'pending' en draaien
  // we 'm direct na afloop nog een keer — zo gaat geen enkele wijziging
  // (bv. je net getypte notitie) verloren.
  const doSave = async () => {
    if (inFlightRef.current) { pendingRef.current = true; return }
    inFlightRef.current = true
    setSavingState('saving')
    try {
      const { formData: fd, steps: st, sectionId: sid, recurrenceActive: ra, recurrenceDays: rd } = latestRef.current
      const payload = {
        ...fd, steps: st,
        sectionId: sid || null,
        recurrence_active: ra,
        recurrence_days: ra && rd.length > 0 ? rd : null,
      }
      console.log('[task-autosave] opslaan', { id: draftIdRef.current, isUpdate: !!draftIdRef.current, description: payload.description })
      if (!draftIdRef.current) {
        const created = await onAutoCreate(payload)
        if (created?.id) { draftIdRef.current = created.id; setDraftId(created.id) }
      } else {
        await onAutoUpdate(draftIdRef.current, payload)
      }
      setSavingState('saved')
    } catch (e) {
      console.error('Autosave failed:', e)
      setSavingState('idle')
    } finally {
      inFlightRef.current = false
      // Tijdens deze save kwam er nog een wijziging binnen → nu alsnog opslaan.
      if (pendingRef.current) { pendingRef.current = false; doSave() }
    }
  }

  // ── Autosave loop ────────────────────────────────────────────────────────
  // Bij elke wijziging debouncen we een doSave().
  useEffect(() => {
    if (!autosaveEnabled) return
    if (!hasContent) return
    if (!formData.title.trim() && !draftId) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { doSave() }, AUTOSAVE_DELAY_MS)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, steps, autosaveEnabled, draftId])

  const handleAddStep = () => {
    const text = newStepText.trim()
    if (!text) return
    setSteps(prev => [...prev, { id: genId(), text, done: false }])
    setNewStepText('')
  }

  const handleDeleteStep = (id) => setSteps(prev => prev.filter(s => s.id !== id))

  const handleSubmit = async () => {
    if (!formData.title.trim()) { setTitleError(true); return }
    submittedRef.current = true
    // Flush any pending debounce so the final state is on disk.
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const payload = {
      ...formData, steps,
      sectionId: sectionId || null,
      recurrence_active: recurrenceActive,
      recurrence_days: recurrenceActive && recurrenceDays.length > 0 ? recurrenceDays : null,
    }
    if (autosaveEnabled && draftId) {
      try { await onAutoUpdate(draftId, payload) } catch (e) { console.error(e) }
      onClose()
    } else {
      onSubmit(payload)
    }
  }

  // Flush de actuele formulier-staat naar de DB vóór sluiten. Nodig omdat de
  // autosave-debounce of de in-flight-guard de laatste wijziging (bv. je net
  // getypte notes/description) kan hebben overgeslagen — dan was die anders weg.
  const flushPending = async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!autosaveEnabled || !draftId) return
    const payload = {
      ...formData, steps,
      sectionId: sectionId || null,
      recurrence_active: recurrenceActive,
      recurrence_days: recurrenceActive && recurrenceDays.length > 0 ? recurrenceDays : null,
    }
    try { await onAutoUpdate(draftId, payload) } catch (e) { console.error('Flush bij sluiten mislukt:', e) }
  }

  // Attempted close (X, backdrop, or Annuleer button).
  const handleAttemptClose = async () => {
    submittedRef.current = false
    // In edit mode: eerst de laatste staat flushen (autosave kan ''m gemist
    // hebben), dan sluiten.
    if (isEditMode) { await flushPending(); onClose(); return }
    if (!hasContent) {
      if (autosaveEnabled && draftId) {
        try { await onAutoDelete(draftId) } catch (e) { console.error(e) }
      }
      onClose()
      return
    }
    const userChoice = window.confirm(
      'Je hebt al iets ingevuld.\n\n' +
      'OK = Taak bewaren als concept\n' +
      'Annuleren = Terug naar het formulier'
    )
    if (userChoice) { await flushPending(); onClose() }
  }

  console.log('[AddTaskModal] mounting, portal target body present:', !!document?.body)
  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleAttemptClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 2147483600, padding: isMobile ? '0' : '1.5rem' }}
    >
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '12px 12px 0 0' : '12px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '480px',
        maxHeight: isMobile ? '92vh' : '85vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.75rem 1rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>{isEditMode ? 'Task bewerken' : 'Nieuwe Task'}</span>
            {autosaveEnabled && hasContent && (
              <span style={{
                marginLeft: '0.5rem',
                fontSize: '0.55rem', fontWeight: 700,
                color: savingState === 'saving' ? 'rgba(255,215,0,0.7)' : 'rgba(16,185,129,0.7)',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {savingState === 'saving' ? 'Opslaan…' : savingState === 'saved' ? 'Bewaard' : ''}
              </span>
            )}
          </div>
          <button onClick={handleAttemptClose} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', touchAction: 'manipulation' }}>
            <X size={13} />
          </button>
        </div>

        {/* ═══ FORM ═══ */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Titel */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>TITEL *</div>
            <input
              autoFocus
              type="text"
              value={formData.title}
              onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setTitleError(false) }}
              placeholder="Wat moet je doen?"
              style={{ width: '100%', padding: '0.4rem 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${titleError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, outline: 'none', color: '#fff', fontSize: '0.9rem', fontWeight: '700' }}
            />
            {titleError && <p style={{ margin: '0.3rem 0 0 0', color: '#ef4444', fontSize: '0.6rem' }}>Titel is verplicht</p>}
          </div>

          {/* Sectie (kolom) — verschijnt zodra de kanban secties heeft */}
          {sections.length > 0 && (
            <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Layers size={8} /> SECTIE
              </div>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
              >
                <option value="">Niet toegewezen</option>
                {sections
                  .filter(s => s.id !== 'unassigned')
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Agenda preset — geeft kort weer wanneer de task gepland is */}
          {agendaPreset && (
            <div style={{
              padding: '0.55rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(16,185,129,0.06)',
              color: '#86efac', fontSize: '0.7rem', fontWeight: 700,
              letterSpacing: '0.02em',
            }}>
              <Calendar size={11} />
              Gepland op {agendaPreset.day} {agendaPreset.startTime}–{agendaPreset.endTime}
            </div>
          )}

          {/* Logboek FIRST when this is a recurring task in edit-mode —
              dat is de hele reden waarom de modal nu open staat. */}
          {isEditMode && recurrenceActive && db && coachId && draftId && (
            <TaskLogSection
              taskId={draftId}
              coachId={coachId}
              db={db}
              isMobile={isMobile}
            />
          )}

          {/* Collapse-toggle voor alle edit-velden. Default-state hangt af
              van of we in recurring-edit zitten (dichtgeklapt) of niet. */}
          <button
            type="button"
            onClick={() => setDetailsOpen(v => !v)}
            style={{
              width: '100%', padding: '0.5rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: detailsOpen ? 'rgba(255,255,255,0.02)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.65rem', fontWeight: 800,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            <span style={{
              fontSize: '0.7rem',
              transform: detailsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s', display: 'inline-block', width: 12,
            }}>▸</span>
            {detailsOpen ? 'Verberg task-instellingen' : 'Bewerk task-instellingen'}
          </button>

          {detailsOpen && (
          <>
          {/* Beschrijving */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>BESCHRIJVING</div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Extra details (optioneel)"
              rows={2}
              style={{ width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          {/* Prioriteit + Categorie */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ flex: 1, padding: '0.625rem 1rem', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Flag size={8} /> PRIORITEIT</div>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                <option value="low">🟢 Laag</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 Hoog</option>
              </select>
            </div>
            <div style={{ flex: 1, padding: '0.625rem 1rem' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Tag size={8} /> CATEGORIE</div>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                <option value="">Geen</option>
                <option value="werk">💼 Werk</option>
                <option value="prive">🏠 Privé</option>
                <option value="myarc">💪 MY ARC</option>
                <option value="gezondheid">❤️ Gezondheid</option>
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={8} /> DEADLINE</div>
            <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: formData.deadline ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }} />
          </div>

          {/* ═══ STAPPEN ═══ */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Stappen header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 1rem', borderBottom: steps.length > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Circle size={8} /> STAPPEN
                {steps.length > 0 && <span style={{ color: '#10b981', marginLeft: '4px' }}>{steps.length}</span>}
              </div>
            </div>

            {/* Stappen lijst */}
            {steps.map((step, i) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ width: '16px', height: '16px', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '3px', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', minWidth: '20px' }}>#{i + 1}</span>
                <span style={{ flex: 10, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>{step.text}</span>
                <button onClick={() => handleDeleteStep(step.id)}
                  style={{ padding: '2px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}>
                  <Trash2 size={10} />
                </button>
              </div>
            ))}

            {/* Geschatte tijd */}
          <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Timer size={8} /> GESCHATTE TIJD</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {[15, 25, 30, 45, 60].map(p => (
                <button key={p} onClick={() => setFormData({ ...formData, estimated_minutes: p })}
                  style={{ padding: '0.2rem 0.4rem', background: formData.estimated_minutes === p ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${formData.estimated_minutes === p ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '4px', color: formData.estimated_minutes === p ? '#10b981' : 'rgba(255,255,255,0.3)', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', minHeight: '26px' }}>
                  {p}m
                </button>
              ))}
              <input type="number" min="1" max="480" placeholder="Eigen" value={formData.estimated_minutes || ''}
                onChange={(e) => setFormData({ ...formData, estimated_minutes: e.target.value ? parseInt(e.target.value) : '' })}
                style={{ width: '52px', padding: '0.2rem 0.375rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', fontSize: '0.7rem', outline: 'none', minHeight: '26px' }}
              />
            </div>
          </div>

          {/* Stap invoer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem' }}>
              <div style={{ width: '16px', height: '16px', border: '1.5px dashed rgba(255,255,255,0.1)', borderRadius: '3px', flexShrink: 0 }} />
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep() } }}
                placeholder="Stap toevoegen... (Enter)"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0' }}
              />
              {newStepText.trim() && (
                <button onClick={handleAddStep}
                  style={{ padding: '2px 6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '3px', color: '#10b981', fontSize: '0.5rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', minHeight: '20px' }}>
                  <Plus size={9} />
                </button>
              )}
            </div>
          </div>

          {/* Recurring toggle + dag-picker */}
          <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
              padding: '0.4rem 0.5rem',
              background: recurrenceActive ? 'rgba(255,215,0,0.08)' : 'transparent',
              border: `1px solid ${recurrenceActive ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '6px',
            }}>
              <input
                type="checkbox"
                checked={recurrenceActive}
                onChange={(e) => setRecurrenceActive(e.target.checked)}
                style={{ accentColor: '#FFD700' }}
              />
              <Repeat size={10} color={recurrenceActive ? '#FFD700' : 'rgba(255,255,255,0.3)'} />
              <span style={{ color: recurrenceActive ? '#FFD700' : 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: '700' }}>
                Herhalen elke week
              </span>
            </label>
            {recurrenceActive && (
              <div style={{
                marginTop: '0.5rem',
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem',
              }}>
                {WEEK_DAYS.map(d => {
                  const active = recurrenceDays.includes(d.id)
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleRecurrenceDay(d.id)}
                      style={{
                        padding: '0.4rem 0', minHeight: 32,
                        background: active ? '#FFD700' : 'rgba(255,255,255,0.04)',
                        border: active ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 5,
                        color: active ? '#000' : 'rgba(255,255,255,0.55)',
                        fontSize: '0.65rem', fontWeight: 800,
                        cursor: 'pointer', touchAction: 'manipulation',
                      }}
                    >
                      {d.short}
                    </button>
                  )
                })}
              </div>
            )}
            {recurrenceActive && recurrenceDays.length === 0 && (
              <div style={{
                marginTop: '0.4rem', fontSize: '0.6rem', color: 'rgba(245,158,11,0.85)', fontWeight: 700,
              }}>
                Kies minimaal één dag — anders herhaalt 't doel niet.
              </div>
            )}
          </div>

          {/* Kleur — overschrijft sectiekleur op de card. Klik nogmaals = leeg. */}
          <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
              KLEUR
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                '#10b981', // groen
                '#3b82f6', // blauw
                '#8b5cf6', // paars
                '#FFD700', // goud
                '#f59e0b', // amber
                '#ef4444', // rood
                '#ec4899', // roze
                '#06b6d4', // cyan
                '#6b7280', // grijs
              ].map(c => {
                const active = formData.color === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: active ? '' : c })}
                    title={c}
                    style={{
                      width: 24, height: 24, padding: 0,
                      background: c, borderRadius: 6,
                      border: active ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: active ? `0 0 0 2px ${c}55` : 'none',
                      cursor: 'pointer', touchAction: 'manipulation',
                    }}
                  />
                )
              })}
              {formData.color && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, color: '' })}
                  style={{
                    minHeight: 24, padding: '2px 7px', marginLeft: 4,
                    background: 'transparent',
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: 5,
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.55rem', fontWeight: 700,
                    cursor: 'pointer', touchAction: 'manipulation',
                  }}
                >
                  Geen kleur
                </button>
              )}
            </div>
          </div>

          {/* Reflectie toggle */}
          <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.4rem 0.5rem', background: formData.needs_reflection ? 'rgba(139,92,246,0.08)' : 'transparent', border: `1px solid ${formData.needs_reflection ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '6px' }}>
              <input type="checkbox" checked={formData.needs_reflection} onChange={(e) => setFormData({ ...formData, needs_reflection: e.target.checked })} style={{ accentColor: '#8b5cf6' }} />
              <Clock size={10} color={formData.needs_reflection ? '#8b5cf6' : 'rgba(255,255,255,0.3)'} />
              <span style={{ color: formData.needs_reflection ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: '600' }}>
                Reflectie na voltooien
              </span>
            </label>
          </div>

          {/* Logboek — alleen voor recurring tasks in edit-mode, en alleen
              wanneer we de db + coachId hebben (passed-through prop). */}
          {isEditMode && recurrenceActive && db && coachId && draftId && (
            <TaskLogSection
              taskId={draftId}
              coachId={coachId}
              db={db}
              isMobile={isMobile}
            />
          )}
          </>
          )}
        </div>

        {/* ═══ FOOTER ACTIONS ═══ */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {isEditMode && onAutoDelete && (
            <button
              onClick={async () => {
                if (!window.confirm('Task verwijderen?')) return
                try { await onAutoDelete(draftId) } catch (e) { console.error(e) }
                onClose()
              }}
              title="Task verwijderen"
              style={{
                width: 40, padding: 0, minHeight: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '6px', color: '#fca5a5',
                cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Uitplannen — alleen als de task daadwerkelijk gepland staat.
              Strip scheduled_day/date/start/end zodat 'ie terug naar
              Niet gepland gaat. Recurring blijft recurring (toggle apart). */}
          {isEditMode && onUnscheduleTask && initialTask?.scheduled_day && (
            <button
              onClick={async () => {
                if (debounceRef.current) clearTimeout(debounceRef.current)
                submittedRef.current = true
                try { await onUnscheduleTask(draftId) } catch (e) { console.error('Unschedule failed:', e) }
                onClose()
              }}
              title="Uitplannen — terug naar Niet gepland"
              style={{
                width: 40, padding: 0, minHeight: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: '6px', color: '#fbbf24',
                cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              <CalendarMinus size={14} />
            </button>
          )}
          <button onClick={handleAttemptClose}
            style={{ flex: 1, padding: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', minHeight: '40px', touchAction: 'manipulation' }}>
            {isEditMode ? 'Sluiten' : 'Annuleer'}
          </button>
          {isEditMode && onCompleteTask && (
            <button
              onClick={async () => {
                // Flush pending autosave first so any unsaved edits land
                // before completion fires.
                if (debounceRef.current) clearTimeout(debounceRef.current)
                submittedRef.current = true
                try {
                  await onCompleteTask(draftId)
                } catch (e) { console.error('Complete failed:', e) }
                onClose()
              }}
              title={recurrenceActive ? 'Voltooi vandaag' : 'Voltooi taak'}
              style={{
                flex: 1, padding: '0.6rem',
                background: '#10b981',
                border: '1px solid #10b981',
                borderRadius: '6px',
                color: '#fff', fontSize: '0.75rem', fontWeight: 800,
                cursor: 'pointer', minHeight: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <CheckCircle2 size={13} />
              Voltooi
            </button>
          )}
          <button onClick={handleSubmit}
            style={{ flex: 2, padding: '0.6rem', background: isEditMode ? 'rgba(255,255,255,0.06)' : '#10b981', border: isEditMode ? '1px solid rgba(255,255,255,0.12)' : 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', minHeight: '40px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <Plus size={13} />
            {isEditMode ? 'Opslaan' : `Task Toevoegen${steps.length > 0 ? ` + ${steps.length} stap${steps.length > 1 ? 'pen' : ''}` : ''}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
