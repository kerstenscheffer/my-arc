// src/modules/productivity/components/agenda/AgendaView.jsx
// Week agenda — Ma–Vr columns × hour rows. Tasks live at scheduled_day +
// scheduled_start_time and are draggable to other day/time. Unscheduled
// tasks sit in the right sidebar.

import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar, Coffee, Users, Inbox, Plus, Repeat, Pencil, X } from 'lucide-react'
import AgendaBlockModal from './AgendaBlockModal'
import FloatingPanel from '../FloatingPanel'
import {
  DAYS, START_HOUR, END_HOUR, HOUR_PX, GRID_HEIGHT,
  timeToMinutes, minutesToTime, snapTo15, SNAP_MINUTES,
  COACHING_COLOR,
  findNextFreeSlot,
  getISOWeek, getMondayOfWeek, getTodayDayId,
  dateForDayInWeek, toISODate,
} from './agendaConstants'

const DEFAULT_DURATION = 60 // mins, used when a task has no estimated_minutes

export default function AgendaView({
  sections, scheduledTasks, allTasks,
  onTaskUpdate, onTaskClick,
  // New: emit a request to open the AddTaskModal with these defaults.
  // ProductivityKanban hooks this up so the existing modal is reused.
  onRequestNewTask,
  // New: db + coachId so we can read/write agenda_blocks.
  db, coachId,
  isMobile,
  // Set of recurring-task ids the coach checked off today — used to dim
  // their agenda blocks so it's obvious at a glance what's already done.
  completedTodayIds = new Set(),
  // Resize commit hook — parent decides between "alleen deze datum" and
  // "hele reeks". Receives ({ taskId, updates, dateISO, task }) and returns
  // a Promise<boolean>. If absent, falls back to the generic onTaskUpdate.
  onRecurringResize = null,
  // Delete-hook — parent toont de "alleen deze / hele reeks" popup voor
  // recurring taken. Ontvangt (taskId, dateISO).
  onTaskDelete = null,
  productivityService = null,
  // Parent bumps this when a recurring skip/override is written so we
  // re-fetch the per-date overrides.
  overridesVersion = 0,
}) {
  // Week navigation — anchored to Monday of selected week.
  const [weekAnchor, setWeekAnchor] = useState(() => getMondayOfWeek(new Date()))
  const weekNumber = getISOWeek(weekAnchor)
  const isCurrentWeek = +weekAnchor === +getMondayOfWeek(new Date())
  const todayDayId = getTodayDayId()

  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverDay, setDragOverDay] = useState(null)
  // Tap-to-place: een ongeplande taak "armen" door erop te tikken, daarna op
  // een dag/tijd-cel tikken om ''m in te plannen. Alternatief voor slepen, dat
  // op mobiel niet werkt (de modal dekt het scherm).
  const [armedTask, setArmedTask] = useState(null)
  const [conflictHint, setConflictHint] = useState(null) // string for tiny inline warning
  // Live drop preview during a drag — { dayId, startMin, endMin }. Shown as
  // a ghost block so the coach sees exactly where the task will land.
  const [dropPreview, setDropPreview] = useState(null)
  // Pixel offset of the cursor inside the dragged block at the moment of
  // dragstart. We subtract this from the drop Y so the BLOCK TOP lands
  // where the cursor is, not the cursor itself — otherwise a 60-min task
  // dragged from its middle can never start at 09:00.
  const dragOffsetYRef = useRef(0)
  // Suppress the click event that fires right after a resize-pointerup so
  // the detail modal doesn't pop open as soon as the user releases.
  const justResizedRef = useRef(false)
  // Resize state — while the user drags the bottom-handle of a task block,
  // we render the block at `currentEnd` (live preview) and commit on pointer-up.
  const [resize, setResize] = useState(null) // { taskId, startY, startEndMin, currentEnd, topMin, task }

  // Per-(task_id, date) skip + duration override map for recurring tasks.
  // Loaded for the visible week and re-fetched whenever the week changes or
  // the parent bumps `overridesVersion` (after a skip/override write).
  const [dateOverrides, setDateOverrides] = useState(() => new Map())

  // Reserved blocks (lunch + coaching) live in DB now — `agenda_blocks`.
  const [blocks, setBlocks] = useState([])
  const [editingBlock, setEditingBlock] = useState(null) // null | { id?, day?, start_time?, ... }
  const blockClickedRef = useRef(false)

  useEffect(() => {
    if (!coachId || !db?.supabase) return
    let cancelled = false
    const load = async () => {
      const { data, error } = await db.supabase
        .from('agenda_blocks').select('*').eq('coach_id', coachId)
        .order('start_time', { ascending: true })
      if (cancelled) return
      if (error) { console.error('load agenda_blocks failed:', error); return }
      setBlocks(data || [])
    }
    load()
    return () => { cancelled = true }
  }, [coachId, db])

  // Load per-date overrides for the currently visible week. Re-fires on
  // week navigation and whenever the parent bumps overridesVersion.
  useEffect(() => {
    if (!productivityService || !coachId) return
    let cancelled = false
    const load = async () => {
      const monday = getMondayOfWeek(weekAnchor)
      const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6)
      const fromISO = toISODate(monday)
      const toISO = toISODate(sunday)
      try {
        const map = await productivityService.getRecurringDateOverrides(coachId, fromISO, toISO)
        if (!cancelled) setDateOverrides(map)
      } catch (e) {
        console.error('load recurring date overrides failed:', e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [productivityService, coachId, weekAnchor, overridesVersion])

  const reloadBlocks = async () => {
    if (!coachId || !db?.supabase) return
    const { data } = await db.supabase
      .from('agenda_blocks').select('*').eq('coach_id', coachId)
      .order('start_time', { ascending: true })
    setBlocks(data || [])
  }

  // Local replacement for the old agendaConstants.overlapsReserved — uses
  // the DB-driven block list and only blocks PAUZE-type entries (coaching
  // is now informational only; tasks may overlap it).
  const overlapsReservedDB = (dayId, startMin, endMin) => {
    return blocks
      .filter(b => b.day === dayId && b.type === 'pauze')
      .some(b => {
        const bs = timeToMinutes(b.start_time?.slice(0,5))
        const be = timeToMinutes(b.end_time?.slice(0,5))
        if (bs == null || be == null) return false
        return startMin < be && endMin > bs
      })
  }

  // Save block via service (handles both create + update).
  const handleSaveBlock = async (payload) => {
    if (!coachId || !db?.supabase) return
    if (payload.id) {
      const { id, ...rest } = payload
      const { error } = await db.supabase
        .from('agenda_blocks')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    } else {
      const { error } = await db.supabase
        .from('agenda_blocks')
        .insert({ coach_id: coachId, position: blocks.length, ...payload })
      if (error) throw error
    }
    await reloadBlocks()
  }
  const handleDeleteBlock = async (id) => {
    if (!db?.supabase) return
    const { error } = await db.supabase.from('agenda_blocks').delete().eq('id', id)
    if (error) throw error
    await reloadBlocks()
  }

  // Global pointermove/pointerup listeners while resizing.
  useEffect(() => {
    if (!resize) return
    const onMove = (e) => {
      const dy = (e.clientY ?? 0) - resize.startY
      // 1 px = 1 minute (HOUR_PX = 60). Snap to SNAP_MINUTES.
      const raw = resize.startEndMin + dy
      const minEnd = resize.topMin + SNAP_MINUTES
      const maxEnd = (END_HOUR - START_HOUR) * 60
      const snapped = Math.max(minEnd, Math.min(maxEnd, snapTo15(raw)))
      setResize(prev => prev ? { ...prev, currentEnd: snapped } : prev)
    }
    const onUp = async () => {
      const r = resize
      setResize(null)
      // Swallow the click that the browser fires right after pointerup so
      // releasing the resize-handle doesn't open the task detail modal.
      justResizedRef.current = true
      setTimeout(() => { justResizedRef.current = false }, 300)
      if (!r || r.currentEnd === r.startEndMin) return
      try {
        // Persist BOTH the new end-time and a matching estimated_minutes
        // so the detail modal pre-fills with the resized duration. Without
        // this the modal would still show the old "Geschatte tijd" and
        // saving from there would silently undo the resize.
        const newDurMin = Math.max(SNAP_MINUTES, r.currentEnd - r.topMin)
        const updates = {
          scheduled_end_time: minutesToTime(r.currentEnd),
          estimated_minutes: newDurMin,
        }
        // Recurring → let the parent prompt "alleen deze datum of hele reeks".
        if (r.task?.recurrence_active && onRecurringResize) {
          await onRecurringResize({
            taskId: r.task.id,
            updates,
            dateISO: r.task._dateISO || null,
            task: r.task,
          })
        } else {
          await onTaskUpdate(r.task.id, updates)
        }
      } catch (err) { console.error('Resize persist failed:', err) }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [resize, onTaskUpdate])

  // Mobile day-picker — pick one day at a time. Defaults to today (or Monday
  // if today is Sat/Sun).
  const [mobileDay, setMobileDay] = useState(() => {
    const tid = getTodayDayId()
    return DAYS.find(d => d.id === tid)?.id || 'monday'
  })

  const handleMobilePrevDay = () => {
    const idx = DAYS.findIndex(d => d.id === mobileDay)
    if (idx > 0) {
      setMobileDay(DAYS[idx - 1].id)
    } else {
      setWeekAnchor(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d })
      setMobileDay(DAYS[DAYS.length - 1].id)
    }
  }
  const handleMobileNextDay = () => {
    const idx = DAYS.findIndex(d => d.id === mobileDay)
    if (idx < DAYS.length - 1) {
      setMobileDay(DAYS[idx + 1].id)
    } else {
      setWeekAnchor(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d })
      setMobileDay(DAYS[0].id)
    }
  }

  // Section color lookup — only used when section.color is missing on a task.
  const sectionColorById = useMemo(() => {
    const map = {}
    ;(sections || []).forEach(s => { map[s.id] = s.color })
    return map
  }, [sections])

  // Group scheduled tasks per day, filtering to ones with a start_time set.
  // Map day-id -> Date for the currently shown week. Recomputed when the
  // user navigates between weeks. Used both to render date pills in the
  // header and to filter scheduled_date-bound tasks to this week only.
  const weekDates = useMemo(() => {
    const m = {}
    DAYS.forEach(d => { m[d.id] = dateForDayInWeek(weekAnchor, d.id) })
    return m
  }, [weekAnchor])

  const weekDateStrings = useMemo(() => {
    const m = {}
    Object.entries(weekDates).forEach(([day, dt]) => { m[day] = toISODate(dt) })
    return m
  }, [weekDates])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Note: `dateOverrides` Map identity must change when content changes so
  // this memo invalidates — the parent passes a fresh Map after a skip/
  // override write, so this works in practice.
  const tasksByDay = useMemo(() => {
    const out = {}
    DAYS.forEach(d => { out[d.id] = [] })
    const seen = new Set()
    const pushOnce = (day, task) => {
      const key = `${task.id}__${day}`
      if (seen.has(key)) return
      seen.add(key)
      out[day].push(task)
    }
    // Today's real date — legacy tasks that don't have scheduled_date set
    // are pinned to the actual current week so they don't repeat every week
    // visually until the user touches them again.
    const thisWeekMonday = +getMondayOfWeek(new Date())
    const shownWeekMonday = +weekAnchor
    const isShownWeekTheRealWeek = thisWeekMonday === shownWeekMonday

    Object.entries(scheduledTasks || {}).forEach(([day, tasks]) => {
      if (!out[day]) return
      tasks.forEach(t => {
        if (!t.scheduled_start_time) return
        // Recurring → expand to every weekday in the list, every week. The
        // recurring case is week-agnostic on purpose so the coach can plan
        // ahead and the daily logbook still works per actual date.
        if (t.recurrence_active && Array.isArray(t.recurrence_days) && t.recurrence_days.length > 0) {
          t.recurrence_days.forEach(rday => {
            if (!out[rday]) return
            const dateISO = weekDateStrings[rday]
            const ov = dateOverrides.get(`${t.id}__${dateISO}`)
            if (ov?.skipped) return
            const instance = { ...t, _isRecurring: true, _dateISO: dateISO }
            if (ov?.override_start_time) instance.scheduled_start_time = ov.override_start_time
            if (ov?.override_end_time) instance.scheduled_end_time = ov.override_end_time
            if (ov?.override_minutes) instance.estimated_minutes = ov.override_minutes
            pushOnce(rday, instance)
          })
          return
        }
        // Non-recurring path. Two cases:
        //   (a) Task has scheduled_date -> show only when that date falls
        //       inside the displayed week (matched per day-id).
        //   (b) Task has no scheduled_date (legacy / pre-feature) -> show
        //       only in the user's real current week, otherwise the same
        //       card would haunt every week.
        if (t.scheduled_date) {
          if (t.scheduled_date === weekDateStrings[day]) {
            pushOnce(day, t)
          }
        } else if (isShownWeekTheRealWeek) {
          pushOnce(day, t)
        }
      })
    })
    Object.values(out).forEach(arr => {
      arr.sort((a, b) => (a.scheduled_start_time || '').localeCompare(b.scheduled_start_time || ''))
    })
    return out
  }, [scheduledTasks, weekAnchor, weekDateStrings, dateOverrides])

  // Niet-gepland: tasks without scheduled_day. Pulled from allTasks since
  // ProductivityKanban filters unscheduled into sections.
  const unscheduledTasks = useMemo(() => {
    // Alleen ongeplande én NIET-afgeronde tasks. Afgeronde tasks moeten uit de
    // "niet ingepland"-lijst verdwijnen.
    return (allTasks || []).filter(t =>
      !t.scheduled_day && t.status !== 'completed' && !t.completed_at
    )
  }, [allTasks])

  // Ongeplande taken gegroepeerd per sectie — zelfde indeling als de
  // todo-modal (DayDetailView): secties onder elkaar, elk inklapbaar met een
  // gekleurde kop en de taken eronder. Vervangt de horizontale tabs; die
  // dwongen je steeds één sectie tegelijk te bekijken.
  const [dichtgeklapt, setDichtgeklapt] = useState({})

  const ongeplandPerSectie = useMemo(() => {
    const groepen = (sections || [])
      .filter(sec => sec.id !== 'unassigned')
      .map(sec => ({
        id: sec.id,
        title: sec.title,
        color: sec.color || '#10b981',
        tasks: unscheduledTasks.filter(t => t.section_id === sec.id),
      }))
      .filter(g => g.tasks.length > 0)

    // Taken zonder sectie onderaan, zodat ze niet tussen je echte kolommen
    // verdwijnen.
    const losse = unscheduledTasks.filter(t => !t.section_id)
    if (losse.length > 0) groepen.push({ id: 'geen', title: 'Overig', color: '#10b981', tasks: losse })
    return groepen
  }, [unscheduledTasks, sections])

  // Gedeelde lijst voor beide "Niet gepland"-panelen, zodat ze niet uit elkaar
  // kunnen lopen. `sleepbaar` staat alleen aan in het paneel dat drag-and-drop
  // ondersteunt; het andere werkt via aantikken (armedTask).
  const OngeplandeLijst = ({ sleepbaar = false, legeTekst }) => (
    <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {ongeplandPerSectie.length === 0 && (
        <div style={{ padding: '1.2rem 0.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', fontWeight: 500, lineHeight: 1.4 }}>
          {legeTekst}
        </div>
      )}
      {ongeplandPerSectie.map(sec => {
        const open = !dichtgeklapt[sec.id]
        return (
          <div key={sec.id} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setDichtgeklapt(prev => ({ ...prev, [sec.id]: open }))}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.6rem', background: 'transparent', border: 'none', borderBottom: open ? `1px solid ${sec.color}20` : 'none', cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sec.color, flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: sec.color }}>{sec.title}</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: sec.color, opacity: 0.6 }}>{sec.tasks.length}</span>
              {open ? <ChevronUp size={11} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={11} color="rgba(255,255,255,0.3)" />}
            </button>

            {open && (
              <div style={{ padding: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {sec.tasks.map(task => {
                  const color = task.color || sec.color
                  const isArmed = armedTask?.id === task.id
                  return (
                    <div
                      key={task.id}
                      draggable={sleepbaar}
                      onDragStart={sleepbaar ? (e) => onTaskDragStart(e, task, 'sidebar') : undefined}
                      onDragEnd={sleepbaar ? onTaskDragEnd : undefined}
                      onClick={() => setArmedTask(prev => prev?.id === task.id ? null : task)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.45rem 0.55rem',
                        background: isArmed ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.03)',
                        border: isArmed ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.05)',
                        borderLeft: `3px solid ${color}`,
                        borderRadius: 6,
                        cursor: sleepbaar ? 'grab' : 'pointer',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', lineHeight: 1.25, wordBreak: 'break-word' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.55rem', color: isArmed ? '#FFD700' : 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 2 }}>
                          {isArmed ? 'Tik op een dag/tijd →' : (task.estimated_minutes ? `${task.estimated_minutes} min` : 'Tik om in te plannen')}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onTaskClick && onTaskClick(task) }}
                        title="Bewerk taak"
                        style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
                        <Pencil size={11} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const onTaskDragStart = (e, task, source) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, source }))
    // Capture where in the block the cursor grabbed so the drop math can
    // align the block's TOP with the visual cursor position, not the
    // cursor itself. Without this, dragging a 60-min block from the
    // middle could never land at 09:00 — the top would always end up
    // half-an-hour earlier than the grid allows and get clamped to 09:30.
    const rect = e.currentTarget?.getBoundingClientRect?.()
    dragOffsetYRef.current = rect ? (e.clientY - rect.top) : 0
    setDraggedTask({ ...task, _source: source })
  }
  const onTaskDragEnd = () => {
    setDraggedTask(null)
    setDragOverDay(null)
    setConflictHint(null)
    setDropPreview(null)
    dragOffsetYRef.current = 0
  }

  const computeDropMinutes = (e, dayEl) => {
    const rect = dayEl.getBoundingClientRect()
    // Subtract drag-offset so the block TOP lands where the cursor visually
    // sits, then snap to the SNAP_MINUTES grid.
    const y = e.clientY - rect.top - (dragOffsetYRef.current || 0)
    const raw = (y / HOUR_PX) * 60
    return Math.max(0, snapTo15(Math.round(raw)))
  }

  const duration = (task) => {
    if (task.scheduled_start_time && task.scheduled_end_time) {
      return timeToMinutes(task.scheduled_end_time) - timeToMinutes(task.scheduled_start_time)
    }
    return parseInt(task.estimated_minutes, 10) || DEFAULT_DURATION
  }

  // Compute side-by-side column positions for overlapping tasks in one day.
  // Each entry gets .col (0-based) and .maxCols (total columns in its overlap group).
  const computeTaskLayout = (tasks) => {
    if (!tasks.length) return []
    const events = tasks.map(t => ({
      task: t,
      start: timeToMinutes(t.scheduled_start_time) ?? 0,
      end: (timeToMinutes(t.scheduled_start_time) ?? 0) + Math.max(duration(t), 22),
      col: 0,
      maxCols: 1,
    }))
    for (let i = 0; i < events.length; i++) {
      const used = new Set()
      for (let j = 0; j < i; j++) {
        if (events[j].end > events[i].start) used.add(events[j].col)
      }
      let c = 0; while (used.has(c)) c++
      events[i].col = c
    }
    for (let i = 0; i < events.length; i++) {
      let max = events[i].col
      for (let j = 0; j < events.length; j++) {
        if (j !== i && events[j].end > events[i].start && events[j].start < events[i].end) {
          max = Math.max(max, events[j].col)
        }
      }
      events[i].maxCols = max + 1
    }
    return events
  }

  const onDayDragOver = (e, dayId, dayEl) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDay(dayId)
    // Update the live drop-preview so the coach sees the target slot.
    if (dayEl && draggedTask) {
      const dur = duration(draggedTask)
      let startMin = computeDropMinutes(e, dayEl)
      const maxStart = (END_HOUR - START_HOUR) * 60 - dur
      if (startMin > maxStart) startMin = Math.max(0, maxStart)
      setDropPreview({ dayId, startMin, endMin: startMin + dur })
    }
  }

  // Verplaats/plan een taak. Recurring taken lopen via onRecurringResize zodat
  // de "alleen deze datum / hele reeks" popup verschijnt — "alleen deze" schrijft
  // een tijd-override (start + eind), "hele reeks" verplaatst de reeks.
  const commitMove = async (task, dayId, startMin, endMin) => {
    // Duur clampen: minimaal 1 snap, maximaal de grid-hoogte. Voorkomt dat een
    // foute/onbegrensde waarde het blok "de hele dag" laat vullen.
    const gridMax = (END_HOUR - START_HOUR) * 60
    let mins = endMin - startMin
    if (!Number.isFinite(mins) || mins <= 0) mins = SNAP_MINUTES
    mins = Math.min(Math.max(SNAP_MINUTES, mins), gridMax)
    const updates = {
      scheduled_day: dayId,
      scheduled_start_time: minutesToTime(startMin),
      scheduled_end_time: minutesToTime(startMin + mins),
      estimated_minutes: mins,
      ...(task.recurrence_active ? {} : { scheduled_date: weekDateStrings[dayId] }),
    }
    if (task.recurrence_active && onRecurringResize) {
      await onRecurringResize({
        taskId: task.id,
        updates,
        // Bron-datum van de gesleepte instance (waar de occurrence nu staat)…
        dateISO: task._dateISO || weekDateStrings[dayId],
        // …en de kolom-datum waar'ie naartoe gesleept is. Verschillen ze, dan is
        // het een verplaatsing naar een andere dag i.p.v. een tijd-aanpassing.
        targetDate: weekDateStrings[dayId],
        task,
      })
    } else {
      await onTaskUpdate(task.id, updates)
    }
  }

  const onDayDrop = async (e, dayId, dayEl) => {
    e.preventDefault()
    let payload
    try { payload = JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return }
    if (!payload?.taskId) return

    // Resolve task object. Gebruik de gesleepte INSTANCE (met de per-datum
    // override, bv. een ingekorte duur) i.p.v. de basis-taak — anders gaat de
    // ingekorte duur verloren bij het verplaatsen.
    const base = (allTasks || []).find(t => t.id === payload.taskId)
    if (!base) return
    const task = (draggedTask && draggedTask.id === payload.taskId) ? draggedTask : base

    const dur = duration(task)
    let startMin = computeDropMinutes(e, dayEl)
    let endMin = startMin + dur

    // Clamp inside grid bounds.
    const maxStart = (END_HOUR - START_HOUR) * 60 - dur
    if (startMin > maxStart) startMin = Math.max(0, maxStart)
    endMin = startMin + dur

    // Pauzes blijven onaanraakbaar — alleen daarop checken we hard. Taken
    // mogen elkaar overlappen en aansluiten (back-to-back) zoals de coach
    // dat vroeg.
    if (overlapsReservedDB(dayId, startMin, endMin)) {
      setConflictHint('Pauze-slot — kies een ander uur')
      setTimeout(() => setConflictHint(null), 2000)
      setDragOverDay(null)
      return
    }

    const start = minutesToTime(startMin)
    const end   = minutesToTime(endMin)

    setDragOverDay(null)
    // Recurring → popup (alleen deze datum / hele reeks); anders directe move
    // met scheduled_date gepind op de kolom-datum.
    await commitMove(task, dayId, startMin, endMin)
  }

  // Drop on a day's HEADER (no specific hour) → append at end of day.
  const onDayHeaderDrop = async (e, dayId) => {
    e.preventDefault()
    let payload
    try { payload = JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return }
    if (!payload?.taskId) return
    const base = (allTasks || []).find(t => t.id === payload.taskId)
    if (!base) return
    const task = (draggedTask && draggedTask.id === payload.taskId) ? draggedTask : base

    const dur = duration(task)
    const startMin = findNextFreeSlot(dayId, tasksByDay[dayId] || [], dur)
    if (startMin == null) {
      setConflictHint('Geen vrij slot op deze dag')
      setTimeout(() => setConflictHint(null), 2000)
      return
    }
    await commitMove(task, dayId, startMin, startMin + dur)
  }

  // Drop into sidebar = unschedule (clear day + times + date).
  const onSidebarDrop = async (e) => {
    e.preventDefault()
    let payload
    try { payload = JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return }
    if (!payload?.taskId) return
    await onTaskUpdate(payload.taskId, {
      scheduled_day: null,
      scheduled_date: null,
      scheduled_start_time: null,
      scheduled_end_time:   null,
    })
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderHourGutter = () => {
    const hours = []
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      hours.push(
        <div key={h} style={{
          position: 'absolute',
          top: `${(h - START_HOUR) * HOUR_PX}px`,
          left: 0, right: 0,
          height: '0px',
          borderTop: '1px dashed rgba(255,255,255,0.05)',
        }}>
          <span style={{
            position: 'absolute',
            top: '-7px', left: '-44px',
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: '600',
            width: '38px',
            textAlign: 'right',
          }}>
            {String(h).padStart(2, '0')}:00
          </span>
        </div>
      )
    }
    return hours
  }

  // Click handler on a reserved block — opens AgendaBlockModal for edit.
  // We mark `blockClickedRef` so the surrounding day-cell's onClick (which
  // would open a NEW task modal) skips this tap.
  const openBlockEditor = (e, block) => {
    e.stopPropagation()
    blockClickedRef.current = true
    setTimeout(() => { blockClickedRef.current = false }, 250)
    setEditingBlock(block)
  }

  const renderReservedBlocks = (dayId) => {
    const out = []
    blocks.filter(b => b.day === dayId).forEach((b) => {
      const top = timeToMinutes(b.start_time?.slice(0, 5))
      const end = timeToMinutes(b.end_time?.slice(0, 5))
      if (top == null || end == null) return
      const height = end - top
      const color = b.color || (b.type === 'coaching' ? COACHING_COLOR : '#64748b')
      const isCoaching = b.type === 'coaching'
      out.push(
        <button
          key={b.id}
          type="button"
          onClick={(e) => openBlockEditor(e, b)}
          style={{
            position: 'absolute', top: `${top}px`, left: '2px', right: '2px',
            height: `${height}px`,
            background: isCoaching
              ? `${color}26`
              : 'repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 6px, rgba(255,255,255,0.05) 6px 12px)',
            border: isCoaching ? `1px solid ${color}55` : '1px solid rgba(255,255,255,0.06)',
            borderLeft: isCoaching ? `3px solid ${color}` : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '4px',
            padding: height >= 26 ? '0.2rem 0.4rem' : '0.1rem',
            color: isCoaching ? '#cbd5e1' : 'rgba(255,255,255,0.45)',
            fontSize: '0.65rem', fontWeight: '700',
            display: 'flex', alignItems: 'flex-start', gap: '0.25rem',
            cursor: 'pointer', touchAction: 'manipulation',
            textAlign: 'left',
            zIndex: 1,
          }}
          title={`${b.label} · ${b.start_time?.slice(0,5)}–${b.end_time?.slice(0,5)} — klik om te bewerken`}
        >
          {isCoaching ? <Users size={11} style={{ flexShrink: 0, marginTop: '1px', color }} /> : <Coffee size={11} style={{ flexShrink: 0, marginTop: '1px' }} />}
          {height >= 26 && <span>{b.label}</span>}
        </button>
      )
    })
    return out
  }

  // Ghost preview of where the task will land. Renders the snapped start
  // and end time so the coach can see "09:00 → 10:00" in real-time.
  const renderDropPreview = ({ startMin, endMin }) => {
    const h = Math.max(20, endMin - startMin)
    return (
      <div
        key="__drop-preview"
        style={{
          position: 'absolute',
          top: `${startMin}px`, left: '3px', right: '3px',
          height: `${h}px`,
          background: 'rgba(16,185,129,0.18)',
          border: '1.5px dashed rgba(16,185,129,0.7)',
          borderRadius: 6,
          pointerEvents: 'none',
          zIndex: 4,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: '0.2rem',
        }}
      >
        <span style={{
          background: 'rgba(16,185,129,0.95)',
          color: '#fff',
          fontSize: '0.65rem', fontWeight: 800,
          padding: '2px 6px', borderRadius: 4,
          fontFamily: 'monospace',
          letterSpacing: '0.02em',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}>
          {minutesToTime(startMin).slice(0, 5)} → {minutesToTime(endMin).slice(0, 5)}
        </span>
      </div>
    )
  }

  const renderTaskBlock = (task, col = 0, maxCols = 1) => {
    const top = timeToMinutes(task.scheduled_start_time)
    if (top == null) return null
    const persistedDur = duration(task)
    // Per-task color overrides the section color when set — lets the coach
    // visually flag a specific block (e.g. red for hard-deadline) without
    // changing the whole section's theme.
    const color = task.color || task._sectionColor || sectionColorById[task.section_id] || '#10b981'
    const isDragging = draggedTask?.id === task.id
    const isResizingThis = resize?.taskId === task.id
    // A block is "done" when:
    //   - non-recurring task with status=completed / completed_at set, OR
    //   - recurring task whose id is in completedTodayIds AND this block is
    //     the TODAY-instance (we attach _dateISO when expanding a recurring
    //     task per weekday — without the date-match, every day's render of
    //     the same recurring task would turn green when "vandaag voltooid").
    const todayISO_block = new Date().toISOString().slice(0, 10)
    const isTodayInstance = task._isRecurring
      ? task._dateISO === todayISO_block
      : true
    const isCompletedBlock = task.status === 'completed'
      || !!task.completed_at
      || (completedTodayIds.has(task.id) && isTodayInstance)

    // Live duration during resize, otherwise persisted duration.
    const effectiveDur = isResizingThis ? (resize.currentEnd - top) : persistedDur

    const startResize = (e) => {
      e.stopPropagation()
      e.preventDefault()
      const endMin = timeToMinutes(task.scheduled_end_time) ?? (top + persistedDur)
      setResize({
        taskId: task.id,
        startY: e.clientY,
        startEndMin: endMin,
        currentEnd: endMin,
        topMin: top,
        task,
      })
    }

    return (
      <div
        key={task.id}
        // Disable native drag while resizing so the bottom-handle pointer
        // doesn't kick off an HTML5 drag operation.
        draggable={!isResizingThis}
        onDragStart={(e) => {
          if (e.target?.dataset?.resizeHandle === 'true' || isResizingThis) {
            e.preventDefault(); return
          }
          onTaskDragStart(e, task, 'grid')
        }}
        onDragEnd={onTaskDragEnd}
        onClick={(e) => {
          // Stop bubbling so the day-cell click (which opens the new-task
          // modal for empty slots) doesn't also fire on top of this tap.
          e.stopPropagation()
          if (isDragging || isResizingThis) { e.preventDefault(); return }
          if (justResizedRef.current) { e.preventDefault(); return }
          if (onTaskClick) onTaskClick(task)
        }}
        style={{
          position: 'absolute',
          top: `${top}px`,
          left: maxCols > 1 ? `calc(${col * (100 / maxCols)}% + 2px)` : '3px',
          right: maxCols > 1 ? `calc(${(maxCols - 1 - col) * (100 / maxCols)}% + 2px)` : '3px',
          height: `${Math.max(effectiveDur, 22)}px`,
          background: isCompletedBlock
            ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.08) 100%)'
            : `linear-gradient(135deg, ${color}cc 0%, ${color}aa 100%)`,
          border: isCompletedBlock ? '1px solid rgba(16,185,129,0.55)' : `1px solid ${color}bb`,
          borderLeft: `3px solid ${isCompletedBlock ? '#10b981' : color}`,
          borderRadius: '6px',
          padding: effectiveDur < 30 ? '0.15rem 0.4rem' : '0.3rem 0.5rem',
          color: '#fff',
          fontSize: effectiveDur < 30 ? '0.6rem' : '0.7rem',
          fontWeight: '600',
          lineHeight: 1.2,
          cursor: isDragging ? 'grabbing' : (isResizingThis ? 'ns-resize' : 'grab'),
          opacity: isDragging ? 0.4 : (isCompletedBlock ? 0.55 : 1),
          textDecoration: isCompletedBlock ? 'line-through' : 'none',
          overflow: 'hidden',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          zIndex: isResizingThis ? 3 : 2,
          boxShadow: isResizingThis
            ? `0 0 0 1px ${color}, 0 4px 12px ${color}55`
            : '0 1px 2px rgba(0,0,0,0.3)',
          transition: isResizingThis ? 'none' : 'opacity 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', paddingRight: onTaskDelete ? '16px' : 0 }}>
          <span style={{ fontSize: '0.55rem', color: `${color}cc`, fontWeight: '700', flexShrink: 0 }}>
            {task.scheduled_start_time?.slice(0, 5)}
            {isResizingThis && (
              <> – {minutesToTime(resize.currentEnd).slice(0, 5)}</>
            )}
          </span>
          <span style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: '#fff', fontWeight: '700',
          }}>
            {task.title}
          </span>
          {(task._isRecurring || task.recurrence_active) && (
            <Repeat size={9} color={`${color}cc`} style={{ flexShrink: 0, marginLeft: 'auto' }} title="Herhaalt elke week" />
          )}
        </div>
        {effectiveDur >= 40 && (
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>
            {effectiveDur} min
          </div>
        )}

        {/* Verwijder-knop — recurring taken tonen de "alleen deze / hele reeks"
            popup via de parent (onTaskDelete). */}
        {onTaskDelete && effectiveDur >= 26 && (
          <button
            onClick={(e) => { e.stopPropagation(); onTaskDelete(task.id, task._dateISO || task.scheduled_date || null) }}
            onPointerDown={(e) => e.stopPropagation()}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            title="Verwijderen"
            style={{
              position: 'absolute', top: 2, right: 2, width: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: 5,
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, zIndex: 4,
              touchAction: 'manipulation',
            }}
          >
            <X size={11} />
          </button>
        )}

        {/* Bottom resize-handle — drag down/up to change duration */}
        <div
          data-resize-handle="true"
          draggable={false}
          onPointerDown={startResize}
          onDragStart={(e) => e.preventDefault()}
          style={{
            position: 'absolute',
            left: 0, right: 0, bottom: 0,
            height: isMobile ? '18px' : '10px',
            cursor: 'ns-resize',
            background: 'transparent',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: '3px',
            touchAction: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `linear-gradient(to bottom, transparent, ${color}40)` }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{
            width: isMobile ? '28px' : '20px', height: '3px',
            background: isResizingThis ? color : `${color}80`,
            borderRadius: '2px',
            opacity: isMobile ? 0.8 : (isResizingThis ? 1 : 0.5),
          }} />
        </div>
      </div>
    )
  }

  // Today-marker line — only renders on current-week and only on today's column.
  const renderTodayLine = (dayId) => {
    if (!isCurrentWeek || dayId !== todayDayId) return null
    const now = new Date()
    const minsFromStart = (now.getHours() - START_HOUR) * 60 + now.getMinutes()
    if (minsFromStart < 0 || minsFromStart > (END_HOUR - START_HOUR) * 60) return null
    return (
      <div style={{
        position: 'absolute',
        top: `${minsFromStart}px`,
        left: 0, right: 0,
        height: '0px',
        borderTop: '1.5px solid #ef4444',
        zIndex: 3,
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          left: '-4px', top: '-4px',
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#ef4444',
        }} />
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const visibleDays = isMobile ? DAYS.filter(d => d.id === mobileDay) : DAYS

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: '#0a0a0a',
      minHeight: '600px',
    }}>
      {/* ── Mobile compact day header (replaces separate week-nav + day tabs) ── */}
      {isMobile && (
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: '0.4rem',
        }}>
          <button onClick={handleMobilePrevDay} style={navBtnStyle} aria-label="Vorige dag">
            <ChevronLeft size={16} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: mobileDay === todayDayId && isCurrentWeek ? '#10b981' : '#fff', lineHeight: 1.2 }}>
              {DAYS.find(d => d.id === mobileDay)?.label}
              {mobileDay === todayDayId && isCurrentWeek && (
                <span style={{ fontSize: '0.6rem', color: '#10b981', marginLeft: '0.4rem', fontWeight: '700' }}>· vandaag</span>
              )}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: '1px' }}>
              {weekDates[mobileDay] ? weekDates[mobileDay].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}
              {' · '}Week {weekNumber}
              {!isCurrentWeek && (
                <button onClick={() => { setWeekAnchor(getMondayOfWeek(new Date())); setMobileDay(getTodayDayId()) }}
                  style={{ marginLeft: '0.35rem', background: 'none', border: 'none', color: '#10b981', fontSize: '0.62rem', fontWeight: '700', cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}>
                  → Vandaag
                </button>
              )}
            </div>
          </div>
          <button onClick={handleMobileNextDay} style={navBtnStyle} aria-label="Volgende dag">
            <ChevronRight size={16} />
          </button>
          <div
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDrop={onSidebarDrop}
          >
            <FloatingPanel
              icon={Inbox}
              label="Niet gepland"
              badge={unscheduledTasks.length}
              accent="#10b981"
              iconColor="rgba(255,255,255,0.6)"
              isMobile={isMobile}
              align="right"
              panelWidth={isMobile ? 260 : 380}
            >
              <OngeplandeLijst legeTekst="Geen losse taken. Tik een taak aan om in te plannen." />
            </FloatingPanel>
          </div>
          <button onClick={() => setEditingBlock({})}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 6, color: '#FFD700', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}
            title="Nieuw vast blok">
            <Plus size={12} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* ── Header: week-nav + week-number (desktop only) ──────────────────── */}
      {!isMobile && <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.625rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => setWeekAnchor(getMondayOfWeek(new Date()))}
            disabled={isCurrentWeek}
            style={{
              ...navBtnStyle,
              padding: '0.3rem 0.6rem',
              opacity: isCurrentWeek ? 0.4 : 1,
              fontSize: '0.65rem',
              fontWeight: '700',
              color: isCurrentWeek ? 'rgba(255,255,255,0.3)' : '#10b981',
              borderColor: isCurrentWeek ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.3)',
            }}
          >
            Vandaag
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.55)' }}>
          <button
            onClick={() => setWeekAnchor(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d })}
            aria-label="Vorige week"
            style={navBtnStyle}
          >
            <ChevronLeft size={14} />
          </button>
          <Calendar size={13} />
          <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>Week {weekNumber}</span>
          <button
            onClick={() => setWeekAnchor(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d })}
            aria-label="Volgende week"
            style={navBtnStyle}
          >
            <ChevronRight size={14} />
          </button>

          {/* Floating "Niet gepland" chip — same drop-target as the old
              sidebar but takes near-zero space when collapsed. */}
          <div
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDrop={onSidebarDrop}
            style={{ marginLeft: 4 }}
          >
            <FloatingPanel
              icon={Inbox}
              label="Niet gepland"
              badge={unscheduledTasks.length}
              accent="#10b981"
              iconColor="rgba(255,255,255,0.6)"
              isMobile={isMobile}
              align="right"
              panelWidth={isMobile ? 260 : 380}
            >
              <div
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDrop={onSidebarDrop}
              >
                <OngeplandeLijst sleepbaar legeTekst="Geen losse taken. Sleep een blok hierheen om uit te plannen." />
              </div>
            </FloatingPanel>
          </div>
          <button
            onClick={() => setEditingBlock({})} // empty = new
            style={{
              marginLeft: '0.5rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.3rem 0.55rem',
              background: 'rgba(255,215,0,0.12)',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: 6,
              color: '#FFD700',
              fontSize: '0.65rem', fontWeight: 800,
              cursor: 'pointer', touchAction: 'manipulation',
            }}
            title="Nieuw vast blok (lunch / coaching / focus)"
          >
            <Plus size={11} strokeWidth={3} /> Blok
          </button>
        </div>
      </div>}

      {/* Conflict toast */}
      {conflictHint && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          padding: '0.4rem 0.75rem',
          background: 'rgba(239,68,68,0.12)',
          borderBottom: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', fontSize: '0.7rem', fontWeight: '700',
          textAlign: 'center',
        }}>
          {conflictHint}
        </div>
      )}

      {/* Tap-to-place banner — zichtbaar zodra een taak geselecteerd is */}
      {armedTask && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 11,
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(255,215,0,0.14)',
          borderBottom: '1px solid rgba(255,215,0,0.35)',
        }}>
          <Calendar size={14} color="#FFD700" />
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Tik op een dag/tijd om <span style={{ color: '#FFD700' }}>{armedTask.title}</span> in te plannen
          </span>
          <button onClick={() => setArmedTask(null)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>
            <X size={11} /> Annuleer
          </button>
        </div>
      )}


      {/* ── Body: grid + sidebar ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* GRID — op mobiel een vaste viewport-hoogte + touch hints zodat
            de scroll niet hangt door cell tap-handlers. Op desktop NIET
            (anders trapt overscroll-contain de scroll en kun je niet meer
            terug omhoog scrollen vanaf de bodem). */}
        <div style={{
          flex: 1, overflowX: 'auto', overflowY: 'auto',
          padding: isMobile ? '0.5rem 0.5rem 0.5rem 3rem' : '0.75rem 0.5rem 0.75rem 3.5rem',
          position: 'relative',
          ...(isMobile && {
            height: 'calc(100vh - 160px)',
            maxHeight: 'calc(100vh - 160px)',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y pan-x',
          }),
        }}>
          {/* Day headers (drop = append to end) — desktop only; mobile compact header shows day */}
          {!isMobile && <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)`,
            gap: '4px',
            marginBottom: '0.5rem',
            minWidth: `${visibleDays.length * 90}px`,
          }}>
            {visibleDays.map(day => {
              const isToday = day.id === todayDayId && isCurrentWeek
              const dayDate = weekDates[day.id]
              const dateNum = dayDate ? dayDate.getDate() : ''
              return (
                <div
                  key={day.id}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                  onDrop={(e) => onDayHeaderDrop(e, day.id)}
                  style={{
                    textAlign: 'center',
                    padding: '0.4rem 0.25rem',
                    borderRadius: '6px',
                    background: isToday ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isToday ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    color: isToday ? '#10b981' : '#fff',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    letterSpacing: '0.02em',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  }}
                >
                  <span>{isMobile ? day.label : day.short}</span>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 600,
                    color: isToday ? '#10b981' : 'rgba(255,255,255,0.45)',
                  }}>
                    {dateNum}
                  </span>
                </div>
              )
            })}
          </div>}

          {/* Time-grid cells */}
          <div style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)`,
            gap: '4px',
            minWidth: isMobile ? 'auto' : `${visibleDays.length * 90}px`,
            height: `${GRID_HEIGHT}px`,
          }}>
            {/* Hour gutter (drawn once, spans full width via the first cell) */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {renderHourGutter()}
            </div>

            {visibleDays.map(day => {
              const isOverDay = dragOverDay === day.id
              const dayTasks = tasksByDay[day.id] || []
              return (
                <div
                  key={day.id}
                  ref={(el) => { if (el) el._dayId = day.id }}
                  onDragOver={(e) => onDayDragOver(e, day.id, e.currentTarget)}
                  onDragLeave={() => {
                    setDragOverDay(prev => prev === day.id ? null : prev)
                    setDropPreview(prev => prev?.dayId === day.id ? null : prev)
                  }}
                  onDrop={(e) => onDayDrop(e, day.id, e.currentTarget)}
                  onClick={(e) => {
                    if (blockClickedRef.current) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const y = e.clientY - rect.top
                    if (y < 0 || y > rect.height) return
                    const startMin = Math.max(0, snapTo15(Math.round((y / HOUR_PX) * 60)))
                    // Tap-to-place: is er een taak geselecteerd, plan die hier in.
                    if (armedTask) {
                      const dur = armedTask.estimated_minutes || DEFAULT_DURATION
                      let s = startMin
                      const maxStart = (END_HOUR - START_HOUR) * 60 - dur
                      if (s > maxStart) s = Math.max(0, maxStart)
                      if (overlapsReservedDB(day.id, s, s + dur)) {
                        setConflictHint('Pauze-slot — kies een ander uur')
                        setTimeout(() => setConflictHint(null), 2000)
                        return
                      }
                      onTaskUpdate(armedTask.id, {
                        scheduled_day: day.id,
                        scheduled_start_time: minutesToTime(s),
                        scheduled_end_time: minutesToTime(s + dur),
                        ...(armedTask.recurrence_active ? {} : { scheduled_date: weekDateStrings[day.id] }),
                      })
                      setArmedTask(null)
                      return
                    }
                    if (!onRequestNewTask) return
                    const preset = {
                      day: day.id,
                      date: weekDateStrings[day.id], // YYYY-MM-DD of the cell's actual date
                      startTime: minutesToTime(startMin),
                      endTime: minutesToTime(startMin + 30),
                    }
                    onRequestNewTask(preset)
                  }}
                  style={{
                    position: 'relative',
                    background: isOverDay
                      ? 'rgba(16,185,129,0.04)'
                      : 'rgba(255,255,255,0.015)',
                    border: `1px solid ${isOverDay ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: '6px',
                    overflow: 'hidden',
                    cursor: 'crosshair',
                    backgroundImage: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent ${HOUR_PX / 6}px)`,
                    // Sta verticaal pannen expliciet toe — zonder dit
                    // claimt de tap-handler de gesture op iOS en blijft
                    // de scroll plakken.
                    touchAction: 'pan-y',
                  }}
                >
                  {renderReservedBlocks(day.id)}
                  {computeTaskLayout(dayTasks).map(({ task, col, maxCols }) => renderTaskBlock(task, col, maxCols))}
                  {dropPreview?.dayId === day.id && renderDropPreview(dropPreview)}
                  {renderTodayLine(day.id)}
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {editingBlock && (
        <AgendaBlockModal
          block={editingBlock?.id ? editingBlock : null}
          isMobile={isMobile}
          defaultDay={editingBlock?.day}
          defaultStartTime={editingBlock?.start_time?.slice(0,5)}
          defaultEndTime={editingBlock?.end_time?.slice(0,5)}
          onClose={() => setEditingBlock(null)}
          onSave={handleSaveBlock}
          onDelete={handleDeleteBlock}
        />
      )}
    </div>
  )
}

const navBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '28px', height: '28px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}
