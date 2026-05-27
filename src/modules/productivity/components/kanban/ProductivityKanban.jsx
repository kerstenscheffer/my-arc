// src/modules/productivity/components/kanban/ProductivityKanban.jsx
// VERSION 3.0 - DaySchedule links + ultra compact cards + this-week marking

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Settings, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, GripVertical, X, LayoutGrid, CalendarDays } from 'lucide-react'
import TaskCard from './TaskCard'
import DaySchedule from './DaySchedule'
import DayDetailView from './DayDetailView'
import AddTaskModal from './AddTaskModal'
import SectionModal from './SectionModal'
import AgendaView from '../agenda/AgendaView'
import AgendaTaskModal from '../agenda/AgendaTaskModal'

export default function ProductivityKanban({
  productivityService, coachId, db, isMobile,
  onTaskCompleted, onSectionsChange,
  onStartTask, activeTaskId
}) {
  const [sections, setSectionsRaw] = useState([])
  const [originalSections, setOriginalSections] = useState([])
  const [scheduledTasks, setScheduledTasks] = useState({}) // { monday: [...], ... }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  // When the user clicks an empty cell in the agenda we open AddTaskModal
  // pre-filled with the tapped day/time. Cleared on modal close.
  const [agendaPreset, setAgendaPreset] = useState(null)
  // When set, AddTaskModal opens in edit-mode for this task.
  const [editingTask, setEditingTask] = useState(null)

  // Observe state changes so we can see whether setShowAddTask actually
  // commits. If this never logs `true` after the cell-click, the setter
  // is being batched away or the component is unmounting.
  useEffect(() => {
    console.log('[ProductivityKanban] showAddTask state =', showAddTask, ' viewMode =', viewMode)
  }, [showAddTask])
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedSectionForTask, setSelectedSectionForTask] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})

  // Drag — secties
  const [draggedSection, setDraggedSection] = useState(null)
  const [dragOverForSection, setDragOverForSection] = useState(null)
  const [isDraggingSection, setIsDraggingSection] = useState(false)

  // Drag — tasks (cross-column)
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverSectionId, setDragOverSectionId] = useState(null)
  const [dragOverTaskId, setDragOverTaskId] = useState(null)
  const [dragOverPosition, setDragOverPosition] = useState(null)

  const MAX_VISIBLE = 8
  const [selectedDay, setSelectedDay] = useState(null) // dayId of null

  // Agenda-view toggle. Persisted in localStorage so users stay in the view
  // they last picked.
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('productivity_view_mode') || 'kanban' }
    catch { return 'kanban' }
  })
  const [agendaModalTask, setAgendaModalTask] = useState(null)

  const switchView = (mode) => {
    setViewMode(mode)
    try { localStorage.setItem('productivity_view_mode', mode) } catch { /* private mode */ }
  }

  // Flat task list spanning kanban-sections + day-scheduled buckets. Used by
  // AgendaView to render the "Niet gepland" sidebar and to resolve a task by
  // id during drag-drop.
  const allTasks = useMemo(() => {
    const fromSections = sections.flatMap(s => (s.tasks || []).map(t => ({ ...t, section_id: t.section_id || s.id })))
    const fromScheduled = Object.values(scheduledTasks || {}).flat()
    return [...fromSections, ...fromScheduled]
  }, [sections, scheduledTasks])

  // Generic update path used by the agenda view: persist + full reload to
  // keep both buckets (sections vs scheduledTasks) in sync regardless of
  // whether the change was schedule/unschedule/move.
  const handleAgendaTaskUpdate = async (taskId, updates) => {
    try {
      await productivityService.updateTask(taskId, updates)
      await loadBoard(false)
    } catch (err) {
      console.error('Agenda task update failed:', err)
    }
  }
  const handleAgendaTaskDelete = async (taskId) => {
    try {
      await productivityService.deleteTask(taskId)
      await loadBoard(false)
    } catch (err) {
      console.error('Agenda task delete failed:', err)
    }
  }

  // Forward sections to parent in an effect, NOT inside the state updater.
  // Calling a parent setter from inside `setSectionsRaw(prev => …)` triggers
  // React's "Cannot update a component while rendering a different component"
  // warning because the updater fires during the kanban's render phase.
  const setSections = setSectionsRaw

  useEffect(() => {
    if (onSectionsChange) onSectionsChange(sections)
  }, [sections, onSectionsChange])

  // ── LOAD ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (productivityService && coachId) loadBoard(true)
  }, [productivityService, coachId])

  const loadBoard = async (isInitial = false) => {
    try {
      setLoading(true)
      const board = await productivityService.getKanbanBoard(coachId)

      // Haal geplande tasks op (scheduled_day gevuld)
      const allTasks = board.flatMap(s => s.tasks || [])
      const scheduled = {}
      allTasks.forEach(t => {
        if (t.scheduled_day) {
          if (!scheduled[t.scheduled_day]) scheduled[t.scheduled_day] = []
          scheduled[t.scheduled_day].push({ ...t, _sectionColor: board.find(s => (s.tasks||[]).some(st => st.id === t.id))?.color || '#6b7280' })
        }
      })
      setScheduledTasks(scheduled)

      // Filter scheduled tasks uit kanban
      const filtered = board.map(s => ({
        ...s,
        tasks: (s.tasks || []).filter(t => !t.scheduled_day)
      }))

      if (isInitial) {
        setSections(filtered)
        setOriginalSections(filtered)
      } else {
        const curOrder = sections.filter(s => s.id !== 'unassigned').map(s => s.id)
        const unassigned = filtered.find(s => s.id === 'unassigned')
        const reordered = curOrder.map(id => filtered.find(s => s.id === id)).filter(Boolean)
        filtered.forEach(s => { if (s.id !== 'unassigned' && !curOrder.includes(s.id)) reordered.push(s) })
        if (unassigned) reordered.push(unassigned)
        setSections(reordered)
      }
    } catch (err) {
      console.error('❌ Load kanban failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── UNSAVED CHANGES ───────────────────────────────────────────────────────
  const hasUnsavedChanges = useCallback(() => {
    if (sections.length === 0 || originalSections.length === 0) return false
    const cur = sections.filter(s => s.id !== 'unassigned').map(s => s.id)
    const orig = originalSections.filter(s => s.id !== 'unassigned').map(s => s.id)
    if (cur.length !== orig.length) return true
    return cur.some((id, i) => id !== orig[i])
  }, [sections, originalSections])

  useEffect(() => {
    const handler = (e) => { if (hasUnsavedChanges()) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  // ── SECTION CRUD ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!hasUnsavedChanges()) return
    try {
      setSaving(true)
      await productivityService.reorderSections(sections.filter(s => s.id !== 'unassigned').map(s => s.id))
      setOriginalSections([...sections])
    } catch (err) { alert('Opslaan mislukt') }
    finally { setSaving(false) }
  }

  const handleReset = () => {
    if (hasUnsavedChanges() && window.confirm('Wijzigingen ongedaan maken?')) setSections([...originalSections])
  }

  const getReorderableSections = () => sections.filter(s => s.id !== 'unassigned')

  const moveSection = (sectionId, direction) => {
    const r = getReorderableSections()
    const idx = r.findIndex(s => s.id === sectionId)
    const newIdx = direction === 'left' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= r.length) return
    const n = [...r]; [n[idx], n[newIdx]] = [n[newIdx], n[idx]]
    setSections([...n, sections.find(s => s.id === 'unassigned')])
  }

  const handleCreateSection = async (data) => {
    try {
      const ns = await productivityService.createSection(coachId, { ...data, position: sections.filter(s => s.id !== 'unassigned').length })
      const update = (prev) => { const u = prev.find(s => s.id === 'unassigned'); const o = prev.filter(s => s.id !== 'unassigned'); return [...o, { ...ns, tasks: [] }, u] }
      setSections(update); setOriginalSections(update); setShowSectionModal(false)
    } catch (err) { alert('Sectie maken mislukt') }
  }

  const handleUpdateSection = async (sectionId, updates) => {
    try {
      await productivityService.updateSection(sectionId, updates)
      const update = (prev) => prev.map(s => s.id === sectionId ? { ...s, ...updates } : s)
      setSections(update); setOriginalSections(update); setShowSectionModal(false)
    } catch (err) { console.error(err) }
  }

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Sectie verwijderen?')) return
    try {
      await productivityService.deleteSection(sectionId)
      const update = (prev) => {
        const del = prev.find(s => s.id === sectionId)
        return prev.filter(s => s.id !== sectionId).map(s => s.id === 'unassigned' ? { ...s, tasks: [...(del?.tasks || []), ...(s.tasks || [])] } : s)
      }
      setSections(update); setOriginalSections(update); setShowSectionModal(false)
    } catch (err) { console.error(err) }
  }

  // ── TASK CRUD ─────────────────────────────────────────────────────────────
  const handleAddTask = async (taskData) => {
    try {
      const targetSection = sections.find(s => s.id === (selectedSectionForTask || 'unassigned'))
      const position = (targetSection?.tasks || []).length
      const newTask = await productivityService.createTask(coachId, {
        ...taskData,
        sectionId: selectedSectionForTask === 'unassigned' ? null : selectedSectionForTask,
        position
      })
      setSections(prev => {
        const targetId = selectedSectionForTask || 'unassigned'
        return prev.map(s => s.id === targetId ? { ...s, tasks: [...(s.tasks || []), newTask] } : s)
      })
      setShowAddTask(false); setSelectedSectionForTask(null)
    } catch (err) { console.error('❌ Add task failed:', err) }
  }

  // ── Autosave handlers used by AddTaskModal ──────────────────────────────
  // The modal creates a real row as soon as the user types, then debounces
  // updates. We mirror those into local state so the kanban board reflects
  // the in-progress card immediately and the work is preserved if the modal
  // is closed accidentally.
  const handleAutoCreateTask = async (taskData) => {
    console.log('[RECUR-DEBUG kanban handleAutoCreateTask] received:', {
      recurrence_active: taskData.recurrence_active,
      recurrence_days: taskData.recurrence_days,
      scheduled_day: taskData.scheduled_day,
      scheduled_start_time: taskData.scheduled_start_time,
    })
    // The modal may pass an explicit sectionId (user picked from the new
    // dropdown). Fall back to whatever the kanban had pre-selected.
    const chosenSection = taskData.sectionId !== undefined
      ? (taskData.sectionId || null)
      : (selectedSectionForTask === 'unassigned' ? null : selectedSectionForTask)
    const targetSectionKey = chosenSection || 'unassigned'
    const targetSection = sections.find(s => s.id === targetSectionKey)
    const position = (targetSection?.tasks || []).length
    const created = await productivityService.createTask(coachId, {
      ...taskData,
      sectionId: chosenSection,
      position,
    })
    console.log('[RECUR-DEBUG kanban createTask returned]', {
      id: created?.id,
      recurrence_active: created?.recurrence_active,
      recurrence_days: created?.recurrence_days,
      scheduled_day: created?.scheduled_day,
    })
    const sectionColor = targetSection?.color || '#6b7280'
    // Mirror to the right bucket — `sections` and `scheduledTasks` are
    // mutually exclusive (loadBoard filters scheduled tasks out of sections).
    // If we'd push into both, the same card shows up in the kanban AND in
    // the "Niet gepland" sidebar simultaneously.
    if (created?.scheduled_day) {
      setScheduledTasks(prev => {
        const day = created.scheduled_day
        const list = prev[day] || []
        return { ...prev, [day]: [...list, { ...created, _sectionColor: sectionColor }] }
      })
    } else {
      setSections(prev => prev.map(s =>
        s.id === targetSectionKey ? { ...s, tasks: [...(s.tasks || []), created] } : s
      ))
    }
    return created
  }

  const handleAutoUpdateTask = async (taskId, updates) => {
    console.log('[RECUR-DEBUG kanban handleAutoUpdateTask]', taskId, {
      recurrence_active: updates.recurrence_active,
      recurrence_days: updates.recurrence_days,
    })
    // Translate sectionId → section_id (DB column) before persisting so the
    // service's spread doesn't drop a bogus camelCase column. Also strip
    // `steps` which lives in a different table / shape.
    const { sectionId, steps, ...rest } = updates
    const dbUpdates = {
      ...rest,
      ...(sectionId !== undefined ? { section_id: sectionId || null } : {}),
    }
    setSections(prev => {
      // Mirror in local state: if section changes, move the task to the new column.
      if (sectionId !== undefined) {
        let moved = null
        const without = prev.map(s => {
          const remaining = (s.tasks || []).filter(t => {
            if (t.id === taskId) { moved = t; return false }
            return true
          })
          return { ...s, tasks: remaining }
        })
        if (moved) {
          const targetKey = sectionId || 'unassigned'
          return without.map(s =>
            s.id === targetKey ? { ...s, tasks: [...(s.tasks || []), { ...moved, ...rest, section_id: sectionId || null }] } : s
          )
        }
      }
      return prev.map(s => ({
        ...s,
        tasks: (s.tasks || []).map(t => t.id === taskId ? { ...t, ...rest } : t),
      }))
    })
    // Mirror in scheduledTasks too — without this, the AgendaView keeps the
    // pre-edit values (e.g. recurrence_active: false) and the recurring
    // expansion never fires until a hard refresh.
    setScheduledTasks(prev => {
      const out = {}
      Object.entries(prev).forEach(([day, tasks]) => {
        out[day] = (tasks || []).map(t => t.id === taskId ? { ...t, ...rest } : t)
      })
      return out
    })
    try {
      await productivityService.updateTask(taskId, dbUpdates)
    } catch (err) {
      console.error('❌ Autosave update failed:', err)
    }
  }

  const handleAutoDeleteTask = async (taskId) => {
    setSections(prev => prev.map(s => ({
      ...s,
      tasks: (s.tasks || []).filter(t => t.id !== taskId),
    })))
    try { await productivityService.deleteTask(taskId) }
    catch (err) { console.error('❌ Autosave delete failed:', err) }
  }

  const handleTaskEdit = async (taskId, updates) => {
    // Optimistisch updaten
    setSections(prev => prev.map(s => ({ ...s, tasks: (s.tasks || []).map(t => t.id === taskId ? { ...t, ...updates } : t) })))
    try {
      await productivityService.updateTask(taskId, updates)
    } catch (err) {
      console.error('❌ Edit task failed:', err)
      await loadBoard(false)
    }
  }

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Task verwijderen?')) return
    try {
      await productivityService.deleteTask(taskId)
      setSections(prev => prev.map(s => ({ ...s, tasks: (s.tasks || []).filter(t => t.id !== taskId) })))
    } catch (err) { console.error('❌ Delete task failed:', err) }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      const completedTask = await productivityService.completeTask(taskId)
      setSections(prev => prev.map(s => ({ ...s, tasks: (s.tasks || []).filter(t => t.id !== taskId) })))
      // Ook uit dagschema verwijderen
      setScheduledTasks(prev => {
        const updated = {}
        Object.entries(prev).forEach(([day, tasks]) => {
          updated[day] = tasks.filter(t => t.id !== taskId)
        })
        return updated
      })
      if (onTaskCompleted && completedTask?.needs_reflection) onTaskCompleted(completedTask)
    } catch (err) { console.error('❌ Complete task failed:', err) }
  }

  // ── DAG SCHEDULE ──────────────────────────────────────────────────────────
  const handleDropToDay = async (task, dayId) => {
    // Verwijder uit huidige dag als al ingepland
    const prevDay = task.scheduled_day

    // Update scheduled tasks state
    setScheduledTasks(prev => {
      const updated = {}
      Object.entries(prev).forEach(([day, tasks]) => {
        updated[day] = tasks.filter(t => t.id !== task.id)
      })
      if (!updated[dayId]) updated[dayId] = []
      updated[dayId] = [...updated[dayId], { ...task, scheduled_day: dayId }]
      return updated
    })

    // Verwijder uit kanban
    setSections(prev => prev.map(s => ({ ...s, tasks: (s.tasks || []).filter(t => t.id !== task.id) })))

    // Persist
    await productivityService.updateTask(task.id, { scheduled_day: dayId })
  }

  const handleRemoveFromDay = async (taskId) => {
    let removedTask = null

    setScheduledTasks(prev => {
      const updated = {}
      Object.entries(prev).forEach(([day, tasks]) => {
        const found = tasks.find(t => t.id === taskId)
        if (found) removedTask = found
        updated[day] = tasks.filter(t => t.id !== taskId)
      })
      return updated
    })

    // Terug naar inbox
    if (removedTask) {
      const taskBack = { ...removedTask, scheduled_day: null }
      delete taskBack._sectionColor
      setSections(prev => prev.map(s => s.id === 'unassigned' ? { ...s, tasks: [taskBack, ...(s.tasks || [])] } : s))
    }

    await productivityService.updateTask(taskId, { scheduled_day: null })
  }

  const toggleExpansion = (sectionId) => setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))

  const getSortedTasks = (section) => [...(section.tasks || [])].sort((a, b) => {
    // is_this_week eerst
    if (a.is_this_week && !b.is_this_week) return -1
    if (!a.is_this_week && b.is_this_week) return 1
    return (a.position || 0) - (b.position || 0)
  })

  const getVisibleTasks = (section) => {
    const sorted = getSortedTasks(section)
    if (expandedSections[section.id] || sorted.length <= MAX_VISIBLE) return sorted
    return sorted.slice(0, MAX_VISIBLE)
  }

  // ── SECTION DRAG ──────────────────────────────────────────────────────────
  const onGripDragStart = (e, section) => {
    e.stopPropagation()
    if (section.id === 'unassigned') { e.preventDefault(); return }
    setIsDraggingSection(true); setDraggedSection(section)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('dragType', 'section')
  }
  const onGripDragEnd = () => { setDraggedSection(null); setDragOverForSection(null); setIsDraggingSection(false) }

  // ── TASK DRAG ─────────────────────────────────────────────────────────────
  const onTaskDragStart = (e, task, sectionId) => {
    e.stopPropagation()
    setDraggedTask({ ...task, currentSectionId: sectionId })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('dragType', 'task')
    e.dataTransfer.setData('task', JSON.stringify({ ...task, _sectionColor: sections.find(s => s.id === sectionId)?.color }))
  }

  const onTaskDragOver = (e, task, sectionId) => {
    e.preventDefault(); e.stopPropagation()
    if (!draggedTask || draggedTask.id === task.id) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOverTaskId(task.id)
    setDragOverPosition(e.clientY < rect.top + rect.height / 2 ? 'above' : 'below')
    setDragOverSectionId(sectionId)
  }

  const onTaskDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) { setDragOverTaskId(null); setDragOverPosition(null) }
  }

  const onColumnDragOver = (e, section) => {
    e.preventDefault()
    if (isDraggingSection && draggedSection) {
      if (section.id !== 'unassigned' && section.id !== draggedSection.id) setDragOverForSection(section.id)
    } else if (draggedTask) {
      setDragOverSectionId(section.id)
    }
  }

  const onColumnDragLeave = () => { setDragOverForSection(null); setDragOverSectionId(null) }

  const onColumnDrop = async (e, targetSection) => {
    e.preventDefault()

    if (isDraggingSection && draggedSection) {
      setDragOverForSection(null)
      if (targetSection.id === 'unassigned' || targetSection.id === draggedSection.id) { setDraggedSection(null); setIsDraggingSection(false); return }
      const r = getReorderableSections()
      const di = r.findIndex(s => s.id === draggedSection.id)
      const ti = r.findIndex(s => s.id === targetSection.id)
      if (di !== -1 && ti !== -1) { const n = [...r]; n.splice(di, 1); n.splice(ti, 0, draggedSection); setSections([...n, sections.find(s => s.id === 'unassigned')]) }
      setDraggedSection(null); setIsDraggingSection(false)
      return
    }

    if (draggedTask && !dragOverTaskId) {
      setDragOverSectionId(null)
      if (draggedTask.currentSectionId === targetSection.id) { setDraggedTask(null); return }
      try {
        const newPos = (targetSection.tasks || []).length
        await productivityService.moveTaskToSection(draggedTask.id, targetSection.id === 'unassigned' ? null : targetSection.id, newPos)
        setSections(prev => prev.map(section => {
          if (section.id === draggedTask.currentSectionId) return { ...section, tasks: (section.tasks || []).filter(t => t.id !== draggedTask.id) }
          if (section.id === targetSection.id) { const moved = { ...draggedTask }; delete moved.currentSectionId; return { ...section, tasks: [...(section.tasks || []), moved] } }
          return section
        }))
      } catch (err) { await loadBoard(false) }
      setDraggedTask(null)
    }
  }

  const onTaskDrop = async (e, targetTask, targetSectionId) => {
    e.preventDefault(); e.stopPropagation()
    if (!draggedTask) return
    setDragOverTaskId(null); setDragOverPosition(null); setDragOverSectionId(null)

    const isSameSection = draggedTask.currentSectionId === targetSectionId
    const targetSection = sections.find(s => s.id === targetSectionId)
    const targetTasks = getSortedTasks(targetSection)
    const targetIdx = targetTasks.findIndex(t => t.id === targetTask.id)
    const insertIdx = dragOverPosition === 'above' ? targetIdx : targetIdx + 1

    let newTasks
    if (isSameSection) {
      const filtered = targetTasks.filter(t => t.id !== draggedTask.id)
      filtered.splice(Math.min(insertIdx, filtered.length), 0, { ...draggedTask })
      newTasks = filtered
    } else {
      const moved = { ...draggedTask, section_id: targetSectionId }; delete moved.currentSectionId
      const filtered = targetTasks.filter(t => t.id !== moved.id)
      filtered.splice(Math.min(insertIdx, filtered.length), 0, moved)
      newTasks = filtered
    }

    const withPositions = newTasks.map((t, i) => ({ ...t, position: i }))

    setSections(prev => prev.map(section => {
      if (!isSameSection && section.id === draggedTask.currentSectionId) return { ...section, tasks: (section.tasks || []).filter(t => t.id !== draggedTask.id) }
      if (section.id === targetSectionId) return { ...section, tasks: withPositions }
      return section
    }))

    setDraggedTask(null)

    try {
      if (!isSameSection) await productivityService.moveTaskToSection(draggedTask.id, targetSectionId === 'unassigned' ? null : targetSectionId, insertIdx)
      await productivityService.reorderTasksInSection(targetSectionId, withPositions.map(t => t.id))
    } catch (err) { await loadBoard(false) }
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'pkSpin 0.8s linear infinite' }} />
      </div>
    )
  }

  const reorderableSections = getReorderableSections()
  const showSaveBar = hasUnsavedChanges()

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: isMobile ? '0.625rem' : '0.75rem', transform: 'translateZ(0)' }}>

      {/* View toggle: Kanban ↔ Agenda */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        marginBottom: '0.625rem',
      }}>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '3px',
        }}>
          {[
            { id: 'kanban', label: 'Kanban', Icon: LayoutGrid },
            { id: 'agenda', label: 'Agenda', Icon: CalendarDays },
          ].map(({ id, label, Icon }) => {
            const active = viewMode === id
            return (
              <button
                key={id}
                onClick={() => switchView(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: active ? '#10b981' : 'rgba(255,255,255,0.5)',
                  fontSize: '0.7rem',
                  fontWeight: active ? '800' : '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '30px',
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Agenda view replaces the entire kanban body */}
      {viewMode === 'agenda' && (
        <>
          <AgendaView
            productivityService={productivityService}
            coachId={coachId}
            db={db}
            sections={sections}
            scheduledTasks={scheduledTasks}
            allTasks={allTasks}
            onTaskUpdate={handleAgendaTaskUpdate}
            onTaskClick={(task) => {
              // Re-use the new AddTaskModal for editing — same UI, more
              // functionality (steps, recurring, section dropdown) than the
              // old AgendaTaskModal.
              setEditingTask(task)
              setShowAddTask(true)
            }}
            onRequestNewTask={(preset) => {
              console.log('[ProductivityKanban] onRequestNewTask hit, will setShowAddTask(true)', { preset, sectionsCount: sections.length })
              setSelectedSectionForTask(sections[0]?.id || 'unassigned')
              setAgendaPreset(preset)
              setEditingTask(null)
              setShowAddTask(true)
            }}
            isMobile={isMobile}
          />
        </>
      )}

      {viewMode === 'kanban' && (
        <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
        <div style={{ flex: 1 }} />
        {showSaveBar && (
          <>
            <span style={{ fontSize: '0.5rem', fontWeight: '600', color: '#fbbf24' }}>Volgorde gewijzigd</span>
            <button onClick={handleReset} disabled={saving} style={{ padding: '0.2rem 0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.5rem', minHeight: '22px', touchAction: 'manipulation' }}>Reset</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '0.2rem 0.4rem', background: saving ? 'rgba(16,185,129,0.3)' : '#10b981', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.5rem', fontWeight: '700', minHeight: '22px', touchAction: 'manipulation' }}>{saving ? '...' : 'Opslaan'}</button>
          </>
        )}
        <button onClick={() => { setSelectedSection(null); setShowSectionModal(true) }}
          style={{ padding: '0 0.5rem', height: '26px', background: '#10b981', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6rem', fontWeight: '700', touchAction: 'manipulation', whiteSpace: 'nowrap' }}>
          <Plus size={10} /> Kolom
        </button>
      </div>

      {/* Main layout: DaySchedule links + Kanban rechts */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>

        {/* ═══ DAG SCHEMA / DETAIL ═══ */}
        {!isMobile && (
          selectedDay ? (
            <DayDetailView
              dayId={selectedDay}
              scheduledTasks={scheduledTasks}
              sections={sections}
              isMobile={isMobile}
              onBack={() => setSelectedDay(null)}
              onDropToDay={handleDropToDay}
              onRemoveFromDay={handleRemoveFromDay}
              onStartTask={onStartTask}
              onCompleteTask={handleCompleteTask}
              activeTaskId={activeTaskId}
            />
          ) : (
            <DaySchedule
              scheduledTasks={scheduledTasks}
              sections={sections}
              isMobile={isMobile}
              onDropToDay={handleDropToDay}
              onRemoveFromDay={handleRemoveFromDay}
              onStartTask={onStartTask}
              onCompleteTask={handleCompleteTask}
              onDayClick={setSelectedDay}
              activeTaskId={activeTaskId}
            />
          )
        )}

        {/* ═══ KANBAN KOLOMMEN ═══ */}
        <div style={{ flex: 1, display: 'flex', gap: '0.625rem', overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch', minWidth: 0 }}>
          {sections.map((section) => {
            const totalTasks = section.tasks?.length || 0
            const visibleTasks = getVisibleTasks(section)
            const hasMore = totalTasks > MAX_VISIBLE
            const isExpanded = expandedSections[section.id]
            const isUnassigned = section.id === 'unassigned'
            const reIdx = reorderableSections.findIndex(s => s.id === section.id)
            const canLeft = !isUnassigned && reIdx > 0
            const canRight = !isUnassigned && reIdx < reorderableSections.length - 1
            const isBeingDragged = draggedSection?.id === section.id
            const isSectionDrop = dragOverForSection === section.id
            const isTaskDrop = dragOverSectionId === section.id && !dragOverTaskId
            const weekCount = (section.tasks || []).filter(t => t.is_this_week).length
            const colW = isMobile ? '260px' : '240px'

            return (
              <div key={section.id}
                onDragOver={(e) => onColumnDragOver(e, section)}
                onDragLeave={onColumnDragLeave}
                onDrop={(e) => onColumnDrop(e, section)}
                style={{
                  minWidth: colW, maxWidth: colW,
                  background: '#0a0a0a',
                  border: isSectionDrop ? `2px dashed ${section.color}` : isTaskDrop ? `2px solid ${section.color}` : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  display: 'flex', flexDirection: 'column', flexShrink: 0,
                  transition: 'border-color 0.15s ease',
                  opacity: isBeingDragged ? 0.4 : 1,
                  overflow: 'hidden',
                  transform: 'translateZ(0)'
                }}
              >
                {/* Section header */}
                <div style={{ padding: '0.5rem 0.625rem', borderBottom: `2px solid ${section.color}`, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {!isUnassigned && (
                    <div draggable onDragStart={(e) => onGripDragStart(e, section)} onDragEnd={onGripDragEnd}
                      style={{ color: 'rgba(255,255,255,0.2)', cursor: 'grab', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <GripVertical size={12} />
                    </div>
                  )}
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: section.color, flexShrink: 0 }} />
                  <h3 style={{ fontSize: '0.75rem', fontWeight: '700', color: section.color, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {section.title}
                  </h3>
                  <span style={{ fontSize: '0.55rem', fontWeight: '800', color: section.color, opacity: 0.7 }}>{totalTasks}</span>
                  {weekCount > 0 && (
                    <span style={{ fontSize: '0.4rem', fontWeight: '700', color: '#FFD700', opacity: 0.8 }}>⭐{weekCount}</span>
                  )}
                  {!isUnassigned && (
                    <button onClick={() => { setSelectedSection(section); setShowSectionModal(true) }}
                      style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0, padding: 0 }}>
                      <Settings size={10} />
                    </button>
                  )}
                  <button onClick={() => { setSelectedSectionForTask(section.id); setShowAddTask(true) }}
                    style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${section.color}10`, border: `1px solid ${section.color}25`, borderRadius: '4px', color: section.color, cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0, padding: 0 }}>
                    <Plus size={10} />
                  </button>
                </div>

                {/* Reorder buttons */}
                {!isUnassigned && (
                  <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'center', padding: '0.25rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <button onClick={() => moveSection(section.id, 'left')} disabled={!canLeft}
                      style={{ padding: '0.15rem 0.35rem', background: 'transparent', border: `1px solid ${canLeft ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)'}`, borderRadius: '3px', color: canLeft ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)', cursor: canLeft ? 'pointer' : 'not-allowed', fontSize: '0.5rem', display: 'flex', alignItems: 'center', gap: '1px', minHeight: '20px', touchAction: 'manipulation' }}>
                      <ChevronLeft size={9} /> Links
                    </button>
                    <button onClick={() => moveSection(section.id, 'right')} disabled={!canRight}
                      style={{ padding: '0.15rem 0.35rem', background: 'transparent', border: `1px solid ${canRight ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)'}`, borderRadius: '3px', color: canRight ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)', cursor: canRight ? 'pointer' : 'not-allowed', fontSize: '0.5rem', display: 'flex', alignItems: 'center', gap: '1px', minHeight: '20px', touchAction: 'manipulation' }}>
                      Rechts <ChevronRight size={9} />
                    </button>
                  </div>
                )}

                {/* Tasks */}
                <div style={{ padding: '0.375rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', minHeight: '80px', maxHeight: isExpanded ? 'none' : '500px' }}>
                  {totalTasks === 0 ? (
                    <div style={{ padding: '1rem 0.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.08)', fontSize: '0.6rem' }}>Leeg</div>
                  ) : (
                    <>
                      {visibleTasks.map(task => {
                        const isDragOver = dragOverTaskId === task.id
                        return (
                          <div key={task.id}
                            onDragOver={(e) => onTaskDragOver(e, task, section.id)}
                            onDragLeave={onTaskDragLeave}
                            onDrop={(e) => onTaskDrop(e, task, section.id)}
                            style={{
                              borderTop: isDragOver && dragOverPosition === 'above' ? `2px solid ${section.color}` : '2px solid transparent',
                              borderBottom: isDragOver && dragOverPosition === 'below' ? `2px solid ${section.color}` : '2px solid transparent',
                              transition: 'border-color 0.1s ease'
                            }}
                          >
                            <TaskCard
                              task={task}
                              sectionColor={section.color}
                              isMobile={isMobile}
                              onDragStart={(e) => onTaskDragStart(e, task, section.id)}
                              onDragStartForDay={true}
                              onEdit={(updates) => handleTaskEdit(task.id, updates)}
                              onDelete={() => handleTaskDelete(task.id)}
                              onComplete={() => handleCompleteTask(task.id)}
                              onStart={onStartTask ? () => onStartTask(task) : undefined}
                              isActive={activeTaskId === task.id}
                            />
                          </div>
                        )
                      })}
                      {hasMore && (
                        <button onClick={() => toggleExpansion(section.id)}
                          style={{ padding: '0.3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '5px', color: section.color, cursor: 'pointer', fontSize: '0.6rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', minHeight: '26px', touchAction: 'manipulation' }}>
                          {isExpanded ? <><ChevronUp size={11} /> Minder</> : <><ChevronDown size={11} /> +{totalTasks - MAX_VISIBLE} meer</>}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile dag-schema / detail onderaan */}
      {isMobile && (
        <div style={{ marginTop: '0.75rem' }}>
          {selectedDay ? (
            <DayDetailView
              dayId={selectedDay}
              scheduledTasks={scheduledTasks}
              sections={sections}
              isMobile={isMobile}
              onBack={() => setSelectedDay(null)}
              onDropToDay={handleDropToDay}
              onRemoveFromDay={handleRemoveFromDay}
              onStartTask={onStartTask}
              onCompleteTask={handleCompleteTask}
              activeTaskId={activeTaskId}
            />
          ) : (
            <DaySchedule
              scheduledTasks={scheduledTasks}
              sections={sections}
              isMobile={isMobile}
              onDropToDay={handleDropToDay}
              onRemoveFromDay={handleRemoveFromDay}
              onStartTask={onStartTask}
              onCompleteTask={handleCompleteTask}
              onDayClick={setSelectedDay}
              activeTaskId={activeTaskId}
            />
          )}
        </div>
      )}
        </>
      )}

      {/* Modals MUST live OUTSIDE the viewMode==='kanban' branch — otherwise
          opening the new-task modal from the agenda-view never renders the
          UI even though showAddTask flips to true. */}
      {showAddTask && (
        <AddTaskModal
          isMobile={isMobile}
          sections={sections}
          defaultSectionId={selectedSectionForTask}
          agendaPreset={agendaPreset}
          initialTask={editingTask}
          db={db}
          coachId={coachId}
          onCompleteTask={handleCompleteTask}
          onClose={() => { setShowAddTask(false); setSelectedSectionForTask(null); setAgendaPreset(null); setEditingTask(null) }}
          onSubmit={handleAddTask}
          onAutoCreate={(taskData) => handleAutoCreateTask({
            ...taskData,
            ...(agendaPreset ? {
              scheduled_day: agendaPreset.day,
              scheduled_start_time: agendaPreset.startTime,
              scheduled_end_time: agendaPreset.endTime,
              ...(agendaPreset.date ? { scheduled_date: agendaPreset.date } : {}),
            } : {}),
          })}
          onAutoUpdate={handleAutoUpdateTask}
          onAutoDelete={handleAutoDeleteTask}
        />
      )}
      {showSectionModal && (
        <SectionModal isMobile={isMobile} section={selectedSection}
          onClose={() => { setShowSectionModal(false); setSelectedSection(null) }}
          onSubmit={selectedSection ? (u) => handleUpdateSection(selectedSection.id, u) : handleCreateSection}
          onDelete={selectedSection ? () => handleDeleteSection(selectedSection.id) : null}
        />
      )}

      <style>{`@keyframes pkSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
