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
import { X, Calendar, Flag, Tag, Clock, Plus, Trash2, Timer, Layers, Repeat, CheckCircle2, CalendarMinus, ChevronDown, MessageSquare, Palette, History } from 'lucide-react'
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
  // Welk paneel onder de pillen openstaat: 'notitie' | 'herhalen' | 'kleur' |
  // 'logboek' | null. Eén tegelijk, zodat de modal kort blijft. Bij een
  // terugkerende task in bewerk-modus staat het logboek meteen open, want
  // daarvoor open je hem.
  const [paneel, setPaneel] = useState(
    initialTask?.id && initialTask?.recurrence_active ? 'logboek' : null
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

          {/* Kop: de titel is het onderwerp, net als de oefening in de
              log-modal. Daaronder één regel met de stand van zaken. */}
          <div style={{ padding: isMobile ? '0.9rem 1rem 0.75rem' : '1rem 1.15rem 0.85rem' }}>
            <input
              autoFocus
              type="text"
              value={formData.title}
              onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setTitleError(false) }}
              placeholder="Wat moet je doen?"
              style={{
                width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900,
                letterSpacing: '-0.025em',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <Stat waarde={steps.length} eenheid={steps.length === 1 ? 'stap' : 'stappen'} />
              <Punt />
              <Stat waarde={formData.estimated_minutes || '—'} eenheid="min" />
              <Punt />
              <Stat waarde={{ low: 'Laag', medium: 'Medium', high: 'Hoog' }[formData.priority]} eenheid="prio" />
              {recurrenceActive && <><Punt /><Stat waarde="Elke week" eenheid={recurrenceDays.length ? `${recurrenceDays.length}d` : 'geen dag'} /></>}
            </div>
            {titleError && <p style={{ margin: '0.4rem 0 0', color: '#ef4444', fontSize: '0.65rem', fontWeight: 700 }}>Titel is verplicht</p>}
          </div>

          {/* Twee keuzevakken naast elkaar, zoals materiaal en instellingen in
              de log-modal: label klein erboven, waarde eronder. */}
          <div style={{ display: 'flex', gap: isMobile ? '0.6rem' : '0.8rem', padding: isMobile ? '0 1rem 0.75rem' : '0 1.15rem 0.85rem' }}>
            <Keuzevak Icon={Layers} label="Sectie" isMobile={isMobile}>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                style={keuzeSelect}
              >
                <option value="">Niet toegewezen</option>
                {sections.filter(s2 => s2.id !== 'unassigned').map(s2 => (
                  <option key={s2.id} value={s2.id}>{s2.title}</option>
                ))}
              </select>
            </Keuzevak>
            <Keuzevak Icon={Flag} label="Prioriteit" isMobile={isMobile}>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                style={keuzeSelect}
              >
                <option value="low">Laag</option>
                <option value="medium">Medium</option>
                <option value="high">Hoog</option>
              </select>
            </Keuzevak>
          </div>

          <div style={{ display: 'flex', gap: isMobile ? '0.6rem' : '0.8rem', padding: isMobile ? '0 1rem 0.85rem' : '0 1.15rem 1rem' }}>
            <Keuzevak Icon={Tag} label="Categorie" isMobile={isMobile}>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={keuzeSelect}
              >
                <option value="">Geen</option>
                <option value="werk">Werk</option>
                <option value="prive">Privé</option>
                <option value="myarc">MY ARC</option>
                <option value="gezondheid">Gezondheid</option>
              </select>
            </Keuzevak>
            <Keuzevak Icon={Calendar} label="Deadline" isMobile={isMobile}>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                style={{ ...keuzeSelect, color: formData.deadline ? '#fff' : 'rgba(255,255,255,0.35)' }}
              />
            </Keuzevak>
          </div>

          {/* Gepland-melding uit de agenda. */}
          {agendaPreset && (
            <div style={{
              margin: isMobile ? '0 1rem 0.85rem' : '0 1.15rem 1rem',
              padding: '0.5rem 0.7rem', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)',
              color: '#86efac', fontSize: '0.7rem', fontWeight: 800,
            }}>
              <Calendar size={12} />
              Gepland op {agendaPreset.day} {agendaPreset.startTime}–{agendaPreset.endTime}
            </div>
          )}

          {/* Duur — losse chips, zelfde ritme als de rest. */}
          <div style={{ padding: isMobile ? '0 1rem 0.85rem' : '0 1.15rem 1rem' }}>
            <Kopje Icon={Timer} tekst="Geschatte tijd" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {[15, 25, 30, 45, 60].map(m => {
                const aan = Number(formData.estimated_minutes) === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData({ ...formData, estimated_minutes: aan ? '' : m })}
                    style={{
                      minHeight: 30, padding: '0 0.7rem', borderRadius: 999,
                      background: aan ? '#fff' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                      color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                      fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
                      fontFamily: 'inherit', touchAction: 'manipulation',
                    }}
                  >
                    {m}m
                  </button>
                )
              })}
              <input
                type="number" min="1" max="480" placeholder="eigen"
                value={[15, 25, 30, 45, 60].includes(Number(formData.estimated_minutes)) ? '' : (formData.estimated_minutes || '')}
                onChange={(e) => setFormData({ ...formData, estimated_minutes: e.target.value ? parseInt(e.target.value) : '' })}
                style={{
                  width: 62, minHeight: 30, padding: '0 0.6rem', borderRadius: 999,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 800, outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Stappen — als lijst, zoals de sets. */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {steps.map((step, i) => (
              <div key={step.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: isMobile ? '0.55rem 1rem' : '0.6rem 1.15rem',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', minWidth: 18 }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>{step.text}</span>
                <button
                  onClick={() => handleDeleteStep(step.id)}
                  style={{ padding: 4, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', touchAction: 'manipulation' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: isMobile ? '0.55rem 1rem' : '0.6rem 1.15rem',
            }}>
              <Plus size={13} color="rgba(255,255,255,0.3)" />
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep() } }}
                placeholder="Stap toevoegen"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit' }}
              />
              {newStepText.trim() && (
                <button
                  onClick={handleAddStep}
                  style={{ minHeight: 26, padding: '0 0.7rem', borderRadius: 999, background: '#fff', border: 'none', color: '#0a0a0a', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Erbij
                </button>
              )}
            </div>
          </div>

          {/* Pillen: alles wat je zelden nodig hebt zit hierachter, net als
              Notitie en Historie onder de log-knop. */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap',
            padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.15rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <Pil Icon={MessageSquare} label="Notitie" aan={paneel === 'notitie'} stip={!!formData.description}
              onClick={() => setPaneel(p2 => p2 === 'notitie' ? null : 'notitie')} />
            <Pil Icon={Repeat} label="Herhalen" aan={paneel === 'herhalen'} stip={recurrenceActive}
              onClick={() => setPaneel(p2 => p2 === 'herhalen' ? null : 'herhalen')} />
            <Pil Icon={Palette} label="Kleur" aan={paneel === 'kleur'} stip={!!formData.color} stipKleur={formData.color}
              onClick={() => setPaneel(p2 => p2 === 'kleur' ? null : 'kleur')} />
            <Pil Icon={Clock} label="Reflectie" aan={formData.needs_reflection} stip={false}
              onClick={() => setFormData({ ...formData, needs_reflection: !formData.needs_reflection })} />
            {isEditMode && recurrenceActive && db && coachId && draftId && (
              <Pil Icon={History} label="Logboek" aan={paneel === 'logboek'} stip={false}
                onClick={() => setPaneel(p2 => p2 === 'logboek' ? null : 'logboek')} />
            )}
          </div>

          {paneel === 'notitie' && (
            <div style={{ padding: isMobile ? '0 1rem 0.9rem' : '0 1.15rem 1rem' }}>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Extra details"
                rows={3}
                style={{
                  width: '100%', padding: '0.6rem 0.7rem', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', outline: 'none',
                  resize: 'none', lineHeight: 1.5, fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {paneel === 'herhalen' && (
            <div style={{ padding: isMobile ? '0 1rem 0.9rem' : '0 1.15rem 1rem' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '0.5rem 0.7rem', borderRadius: 8, marginBottom: recurrenceActive ? 8 : 0,
                background: recurrenceActive ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${recurrenceActive ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)'}`,
              }}>
                <input type="checkbox" checked={recurrenceActive} onChange={(e) => setRecurrenceActive(e.target.checked)} style={{ accentColor: '#FFD700' }} />
                <span style={{ color: recurrenceActive ? '#FFD700' : 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontWeight: 800 }}>
                  Elke week herhalen
                </span>
              </label>
              {recurrenceActive && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                    {WEEK_DAYS.map(d => {
                      const aan = recurrenceDays.includes(d.id)
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleRecurrenceDay(d.id)}
                          style={{
                            minHeight: 32, padding: 0, borderRadius: 7,
                            background: aan ? '#FFD700' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${aan ? '#FFD700' : 'rgba(255,255,255,0.08)'}`,
                            color: aan ? '#000' : 'rgba(255,255,255,0.55)',
                            fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer',
                            fontFamily: 'inherit', touchAction: 'manipulation',
                          }}
                        >
                          {d.short}
                        </button>
                      )
                    })}
                  </div>
                  {recurrenceDays.length === 0 && (
                    <div style={{ marginTop: 6, fontSize: '0.62rem', fontWeight: 700, color: 'rgba(245,158,11,0.85)' }}>
                      Kies minimaal één dag, anders herhaalt hij niet.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {paneel === 'kleur' && (
            <div style={{ padding: isMobile ? '0 1rem 0.9rem' : '0 1.15rem 1rem', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {['#10b981', '#3b82f6', '#8b5cf6', '#FFD700', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6b7280'].map(c => {
                const aan = formData.color === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: aan ? '' : c })}
                    title={c}
                    style={{
                      width: 26, height: 26, padding: 0, background: c, borderRadius: 7,
                      border: aan ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
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
                    minHeight: 26, padding: '0 0.6rem', borderRadius: 999,
                    background: 'transparent', border: '1px dashed rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.45)', fontSize: '0.6rem', fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Geen kleur
                </button>
              )}
            </div>
          )}

          {paneel === 'logboek' && isEditMode && recurrenceActive && db && coachId && draftId && (
            <TaskLogSection taskId={draftId} coachId={coachId} db={db} isMobile={isMobile} />
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
                width: 44, padding: 0, minHeight: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10, color: '#fca5a5',
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
                width: 44, padding: 0, minHeight: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 10, color: '#fbbf24',
                cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              <CalendarMinus size={14} />
            </button>
          )}
          <button onClick={handleAttemptClose}
            style={{ flex: 1, padding: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', minHeight: 44, touchAction: 'manipulation', fontFamily: 'inherit' }}>
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
                background: 'rgba(16,185,129,0.14)',
                border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: 10,
                color: '#10b981', fontSize: '0.78rem', fontWeight: 800,
                cursor: 'pointer', minHeight: 44, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <CheckCircle2 size={13} />
              Voltooi
            </button>
          )}
          <button onClick={handleSubmit}
            style={{ flex: 2, padding: '0.6rem', background: '#fff', border: 'none', borderRadius: 10, color: '#0a0a0a', fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer', minHeight: 44, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', letterSpacing: '-0.01em' }}>
            <Plus size={14} strokeWidth={3} />
            {isEditMode ? 'Opslaan' : 'Toevoegen'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Kleine bouwstenen, in de taal van de oefening-log-modal ─────────────────

const keuzeSelect = {
  width: '100%', background: 'transparent', border: 'none', outline: 'none',
  color: '#fff', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
  fontFamily: 'inherit', padding: 0, appearance: 'none', WebkitAppearance: 'none',
}

// Een keuzevak: icoon links, label klein erboven, de waarde eronder, chevron rechts.
function Keuzevak({ label, isMobile, children, ...rest }) {
  // Als losse variabele (en niet uit de props gedestructureerd) zodat de
  // linter 'm als component herkent in plaats van als ongebruikt argument.
  const Icon = rest.Icon
  return (
    <div style={{
      flex: 1, minWidth: 0,
      display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10,
      padding: isMobile ? '0.5rem 0.6rem' : '0.55rem 0.7rem',
      borderRadius: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.75)',
      }}>
        <Icon size={14} strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.09em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 2,
        }}>
          {label}
        </div>
        {children}
      </div>
      <ChevronDown size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
    </div>
  )
}

function Kopje({ tekst, ...rest }) {
  const Icon = rest.Icon
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7,
      fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.09em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
    }}>
      <Icon size={10} strokeWidth={2.6} />
      {tekst}
    </div>
  )
}

// Regel onder de titel: groot getal, klein woord erachter.
function Stat({ waarde, eenheid }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{waarde}</span>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>{eenheid}</span>
    </span>
  )
}

const Punt = () => <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>·</span>

function Pil({ label, aan, stip, stipKleur, onClick, ...rest }) {
  const Icon = rest.Icon
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        minHeight: 30, padding: '0 0.75rem', borderRadius: 999,
        background: aan ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${aan ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
        color: aan ? '#fff' : 'rgba(255,255,255,0.6)',
        fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer',
        fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {label}
      {stip && <span style={{ width: 6, height: 6, borderRadius: '50%', background: stipKleur || '#10b981' }} />}
    </button>
  )
}
