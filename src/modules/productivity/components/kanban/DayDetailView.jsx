// src/modules/productivity/components/kanban/DayDetailView.jsx
// Dag-detail view — links dagplanning, rechts kanban om van te slepen

import { useState } from 'react'
import { ArrowLeft, Star, Play, CheckCircle, X, ChevronDown, ChevronUp, Plus } from 'lucide-react'

const DAYS_NL = {
  monday: 'Maandag', tuesday: 'Dinsdag', wednesday: 'Woensdag',
  thursday: 'Donderdag', friday: 'Vrijdag', saturday: 'Zaterdag', sunday: 'Zondag'
}

const getToday = () => {
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  return days[new Date().getDay()]
}

export default function DayDetailView({
  dayId,
  scheduledTasks,     // { monday: [...], ... }
  sections,           // kanban secties met tasks
  isMobile,
  onBack,
  onDropToDay,        // (task, dayId) => void
  onRemoveFromDay,    // (taskId) => void
  onStartTask,
  onCompleteTask,
  activeTaskId
}) {
  const [dragOverPanel, setDragOverPanel] = useState(false)
  const [dragOverTaskId, setDragOverTaskId] = useState(null)
  const [dragOverPosition, setDragOverPosition] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const dayTasks = scheduledTasks[dayId] || []
  const isToday = dayId === getToday()

  // Alle kanban tasks (niet ingepland op deze dag)
  const allKanbanTasks = sections.flatMap(section =>
    (section.tasks || [])
      .filter(t => !t.scheduled_day) // niet al ingepland
      .map(t => ({ ...t, _sectionColor: section.color, _sectionTitle: section.title }))
  )

  const filteredKanbanTasks = searchQuery.trim()
    ? allKanbanTasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t._sectionTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allKanbanTasks

  // Groepeer kanban tasks per sectie
  const kanbanBySectie = sections
    .filter(s => (s.tasks || []).some(t => !t.scheduled_day))
    .map(s => ({
      ...s,
      tasks: (s.tasks || [])
        .filter(t => !t.scheduled_day)
        .filter(t => !searchQuery.trim() || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }))
    .filter(s => s.tasks.length > 0)

  // ── DRAG — vanuit dagplanning (reorder) ──────────────────────────────────
  const [draggingDayTask, setDraggingDayTask] = useState(null)

  const handleDayTaskDragStart = (e, task) => {
    setDraggingDayTask(task)
    e.dataTransfer.setData('task', JSON.stringify(task))
    e.dataTransfer.setData('source', 'day')
  }

  const handleDayTaskDragOver = (e, task) => {
    e.preventDefault(); e.stopPropagation()
    if (!draggingDayTask || draggingDayTask.id === task.id) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOverTaskId(task.id)
    setDragOverPosition(e.clientY < rect.top + rect.height / 2 ? 'above' : 'below')
  }

  const handleDayTaskDrop = (e, targetTask) => {
    e.preventDefault(); e.stopPropagation()
    setDragOverTaskId(null); setDragOverPosition(null)

    // Herorden binnen de dag
    if (draggingDayTask && draggingDayTask.id !== targetTask.id) {
      // Simpele reorder — optimistisch via scheduledTasks update
      // Dag reorder wordt niet gepersisteerd (positie in dag is niet kritisch)
    }
    setDraggingDayTask(null)
  }

  // ── DRAG — vanuit kanban naar dag ────────────────────────────────────────
  const handlePanelDragOver = (e) => {
    e.preventDefault()
    setDragOverPanel(true)
  }

  const handlePanelDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverPanel(false)
  }

  const handlePanelDrop = (e) => {
    e.preventDefault()
    setDragOverPanel(false)
    try {
      const source = e.dataTransfer.getData('source')
      if (source === 'day') return // reorder binnen dag — skip
      const task = JSON.parse(e.dataTransfer.getData('task'))
      if (task && task.id) onDropToDay(task, dayId)
    } catch {}
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      gap: '0.75rem',
      height: isMobile ? 'auto' : 'calc(100vh - 180px)',
      minHeight: '400px'
    }}>

      {/* ═══ LINKS: DAG DETAIL ═══ */}
      <div style={{
        width: isMobile ? '100%' : '340px',
        minWidth: isMobile ? 'auto' : '340px',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0a',
        border: `1px solid ${isToday ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderTop: `2px solid ${isToday ? '#FFD700' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '10px',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={onBack}
            style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0, padding: 0 }}>
            <ArrowLeft size={12} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: isToday ? '#FFD700' : '#fff' }}>
              {DAYS_NL[dayId]}
            </div>
            {isToday && (
              <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>VANDAAG</div>
            )}
          </div>
          <span style={{ fontSize: '0.55rem', fontWeight: '800', color: 'rgba(255,255,255,0.25)' }}>{dayTasks.length} taken</span>
        </div>

        {/* Drop zone + taken */}
        <div
          onDragOver={handlePanelDragOver}
          onDragLeave={handlePanelDragLeave}
          onDrop={handlePanelDrop}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            background: dragOverPanel ? 'rgba(255,215,0,0.03)' : 'transparent',
            transition: 'background 0.15s ease',
            WebkitOverflowScrolling: 'touch',
            minHeight: '120px'
          }}
        >
          {dayTasks.length === 0 && !dragOverPanel && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem', color: 'rgba(255,255,255,0.1)', fontSize: '0.65rem', textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1.5rem', opacity: 0.3 }}>📋</div>
              Sleep taken hierheen
            </div>
          )}

          {dragOverPanel && dayTasks.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,215,0,0.3)', borderRadius: '8px', color: '#FFD700', fontSize: '0.65rem', fontWeight: '700', minHeight: '80px' }}>
              NEERZETTEN
            </div>
          )}

          {dayTasks.map((task, idx) => {
            const color = task._sectionColor || '#6b7280'
            const isActive = activeTaskId === task.id
            const isDragOver = dragOverTaskId === task.id

            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDayTaskDragStart(e, task)}
                onDragOver={(e) => handleDayTaskDragOver(e, task)}
                onDrop={(e) => handleDayTaskDrop(e, task)}
                style={{
                  borderTop: isDragOver && dragOverPosition === 'above' ? `2px solid ${color}` : '2px solid transparent',
                  borderBottom: isDragOver && dragOverPosition === 'below' ? `2px solid ${color}` : '2px solid transparent',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.625rem',
                  background: isActive ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${task.is_this_week ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  borderLeft: `3px solid ${task.is_this_week ? '#FFD700' : color}`,
                  borderRadius: '8px',
                  cursor: 'grab',
                  transition: 'background 0.1s ease'
                }}>
                  {/* Positie nummer */}
                  <span style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.15)', minWidth: '14px', flexShrink: 0 }}>
                    {idx + 1}
                  </span>

                  {/* Sectie kleurbol */}
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0, opacity: 0.7 }} />

                  {/* Titel */}
                  <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: '700', color: '#fff', lineHeight: 1.3, wordBreak: 'break-word' }}>
                    {task.title}
                  </span>

                  {/* Week badge */}
                  {task.is_this_week && <Star size={10} color="#FFD700" fill="#FFD700" style={{ flexShrink: 0 }} />}

                  {/* Acties */}
                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    {onStartTask && (
                      <button onClick={() => onStartTask(task)}
                        style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '4px', color: isActive ? '#10b981' : 'rgba(255,255,255,0.25)', cursor: 'pointer', touchAction: 'manipulation', padding: 0 }}>
                        <Play size={10} />
                      </button>
                    )}
                    <button onClick={() => onCompleteTask(task.id)}
                      style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.08)', border: 'none', borderRadius: '4px', color: '#10b981', cursor: 'pointer', touchAction: 'manipulation', padding: 0 }}>
                      <CheckCircle size={10} />
                    </button>
                    <button onClick={() => onRemoveFromDay(task.id)}
                      style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', touchAction: 'manipulation', padding: 0 }}
                      title="Terug naar kanban">
                      <X size={10} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Drop indicator onderaan als er al taken zijn */}
          {dragOverPanel && dayTasks.length > 0 && (
            <div style={{ height: '32px', border: '2px dashed rgba(255,215,0,0.3)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700', fontSize: '0.5rem', fontWeight: '700' }}>
              HIER TOEVOEGEN
            </div>
          )}
        </div>
      </div>

      {/* ═══ RECHTS: KANBAN BRONNEN ═══ */}
      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Zoekbalk */}
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              placeholder="Zoek taken..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem 0.625rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.75rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Secties met tasks */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
            {kanbanBySectie.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '0.65rem' }}>
                {searchQuery ? 'Geen taken gevonden' : 'Alle taken zijn ingepland'}
              </div>
            ) : (
              kanbanBySectie.map(section => {
                const isExpanded = expandedSections[section.id] !== false // standaard open
                return (
                  <div key={section.id} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
                    {/* Sectie header */}
                    <button
                      onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !isExpanded }))}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.625rem', background: 'transparent', border: 'none', borderBottom: isExpanded ? `1px solid ${section.color}20` : 'none', cursor: 'pointer', touchAction: 'manipulation' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: section.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: '700', color: section.color, flex: 1, textAlign: 'left' }}>{section.title}</span>
                      <span style={{ fontSize: '0.5rem', fontWeight: '700', color: section.color, opacity: 0.6 }}>{section.tasks.length}</span>
                      {isExpanded ? <ChevronUp size={10} color="rgba(255,255,255,0.2)" /> : <ChevronDown size={10} color="rgba(255,255,255,0.2)" />}
                    </button>

                    {/* Tasks draggable */}
                    {isExpanded && (
                      <div style={{ padding: '0.375rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {section.tasks.map(task => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('task', JSON.stringify({ ...task, _sectionColor: section.color }))
                              e.dataTransfer.setData('source', 'kanban')
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.375rem',
                              padding: '0.375rem 0.5rem',
                              background: 'rgba(255,255,255,0.02)',
                              border: `1px solid rgba(255,255,255,0.04)`,
                              borderLeft: `3px solid ${task.is_this_week ? '#FFD700' : section.color}`,
                              borderRadius: '6px',
                              cursor: 'grab',
                              transition: 'background 0.1s ease',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          >
                            <span style={{ flex: 1, fontSize: '0.72rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                              {task.title}
                            </span>
                            {task.is_this_week && <Star size={9} color="#FFD700" fill="#FFD700" style={{ flexShrink: 0 }} />}
                            {task.estimated_minutes && (
                              <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{task.estimated_minutes}m</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Mobile: kanban onderaan als scrollbare lijst */}
      {isMobile && allKanbanTasks.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
            SLEEP NAAR BOVEN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {allKanbanTasks.slice(0, 10).map(task => (
              <div key={task.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('task', JSON.stringify(task))
                  e.dataTransfer.setData('source', 'kanban')
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderLeft: `3px solid ${task._sectionColor}`, borderRadius: '6px', cursor: 'grab' }}>
                <span style={{ flex: 1, fontSize: '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{task.title}</span>
                <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)' }}>{task._sectionTitle}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
