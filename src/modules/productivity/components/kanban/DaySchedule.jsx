// src/modules/productivity/components/kanban/DaySchedule.jsx
// Dag-planning kolom — sleep tasks van kanban naar een dag

import { useState } from 'react'
import { ChevronDown, ChevronUp, Play, CheckCircle, Star, X } from 'lucide-react'

const DAYS = [
  { id: 'monday',    label: 'Ma' },
  { id: 'tuesday',   label: 'Di' },
  { id: 'wednesday', label: 'Wo' },
  { id: 'thursday',  label: 'Do' },
  { id: 'friday',    label: 'Vr' },
  { id: 'saturday',  label: 'Za' },
  { id: 'sunday',    label: 'Zo' },
]

const getToday = () => {
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  return days[new Date().getDay()]
}

export default function DaySchedule({
  scheduledTasks,    // { monday: [task,...], tuesday: [...], ... }
  sections,          // voor sectie kleur lookup
  isMobile,
  onDropToDay,       // (task, dayId) => void
  onRemoveFromDay,   // (taskId) => void
  onStartTask,       // (task) => void
  onCompleteTask,    // (taskId) => void
  onDayClick,        // (dayId) => void — opent dag detail
  activeTaskId
}) {
  const [dragOverDay, setDragOverDay] = useState(null)
  const [collapsedDays, setCollapsedDays] = useState({})
  const today = getToday()

  const getSectionColor = (task) => {
    if (!sections) return '#6b7280'
    for (const section of sections) {
      if ((section.tasks || []).some(t => t.id === task.id)) return section.color
    }
    // task heeft section_color direct?
    return task._sectionColor || '#6b7280'
  }

  const handleDragOver = (e, dayId) => {
    e.preventDefault()
    setDragOverDay(dayId)
  }

  const handleDragLeave = () => setDragOverDay(null)

  const handleDrop = (e, dayId) => {
    e.preventDefault()
    setDragOverDay(null)
    try {
      const data = JSON.parse(e.dataTransfer.getData('task'))
      if (data) onDropToDay(data, dayId)
    } catch {}
  }

  const toggleDay = (dayId) => {
    setCollapsedDays(prev => ({ ...prev, [dayId]: !prev[dayId] }))
  }

  const width = isMobile ? '100%' : '200px'

  return (
    <div style={{
      width,
      minWidth: isMobile ? 'auto' : '200px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: isMobile ? '10px' : '12px',
      overflow: 'hidden',
      transform: 'translateZ(0)',
      alignSelf: 'flex-start',
      position: isMobile ? 'relative' : 'sticky',
      top: isMobile ? 'auto' : '0'
    }}>
      {/* Header */}
      <div style={{ padding: '0.5rem 0.625rem', borderBottom: '2px solid #FFD700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FFD700', flexShrink: 0 }} />
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#FFD700' }}>Deze week</span>
      </div>

      {/* Days */}
      {DAYS.map((day) => {
        const tasks = scheduledTasks[day.id] || []
        const isToday = day.id === today
        const isDrop = dragOverDay === day.id
        const isCollapsed = collapsedDays[day.id]

        return (
          <div
            key={day.id}
            onDragOver={(e) => handleDragOver(e, day.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, day.id)}
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: isDrop ? 'rgba(255,215,0,0.05)' : 'transparent',
              borderLeft: isToday ? '3px solid #FFD700' : '3px solid transparent',
              transition: 'background 0.15s ease',
              minHeight: '36px'
            }}
          >
            {/* Day header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.35rem 0.5rem',
              }}
            >
              <button
                onClick={() => onDayClick && onDayClick(day.id)}
                style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', touchAction: 'manipulation' }}
                title={`${day.label} detail openen`}
              >
                <span style={{
                  fontSize: '0.55rem', fontWeight: '800',
                  color: isToday ? '#FFD700' : 'rgba(255,255,255,0.35)',
                  minWidth: '16px',
                  textDecoration: 'underline',
                  textDecorationColor: isToday ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)',
                  textUnderlineOffset: '2px'
                }}>{day.label}</span>
              </button>

              {tasks.length > 0 && (
                <span style={{
                  fontSize: '0.45rem', fontWeight: '700',
                  color: isToday ? '#FFD700' : 'rgba(255,255,255,0.2)',
                  opacity: 0.7
                }}>{tasks.length}</span>
              )}

              <div style={{ flex: 1 }} />

              {tasks.length > 0 && (
                <button onClick={() => toggleDay(day.id)} style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer', touchAction: 'manipulation', display: 'flex', alignItems: 'center' }}>
                  {isCollapsed
                    ? <ChevronDown size={9} color="rgba(255,255,255,0.2)" />
                    : <ChevronUp size={9} color="rgba(255,255,255,0.2)" />}
                </button>
              )}

              {/* Drop indicator */}
              {isDrop && tasks.length === 0 && (
                <span style={{ fontSize: '0.4rem', color: '#FFD700', fontWeight: '700' }}>LOSLATEN</span>
              )}
            </div>

            {/* Tasks in deze dag */}
            {!isCollapsed && tasks.map(task => {
              const color = task._sectionColor || '#6b7280'
              const isActive = activeTaskId === task.id

              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.25rem 0.5rem 0.25rem 0.625rem',
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: `2px solid ${color}`,
                  marginLeft: '0.5rem',
                  background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent'
                }}>
                  {/* Kleurblok */}
                  <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: color, flexShrink: 0, opacity: 0.6 }} />

                  {/* Titel */}
                  <span style={{
                    flex: 1,
                    fontSize: '0.6rem', fontWeight: '700',
                    color: task.is_this_week ? '#fff' : 'rgba(255,255,255,0.6)',
                    lineHeight: 1.25,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {task.title}
                  </span>

                  {/* Week badge */}
                  {task.is_this_week && (
                    <Star size={8} color="#FFD700" fill="#FFD700" style={{ flexShrink: 0 }} />
                  )}

                  {/* Acties */}
                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    {onStartTask && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onStartTask(task) }}
                        style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '3px', color: isActive ? '#10b981' : 'rgba(255,255,255,0.2)', cursor: 'pointer', touchAction: 'manipulation', padding: 0 }}>
                        <Play size={8} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onCompleteTask(task.id) }}
                      style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.06)', border: 'none', borderRadius: '3px', color: '#10b981', cursor: 'pointer', touchAction: 'manipulation', padding: 0 }}>
                      <CheckCircle size={8} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveFromDay(task.id) }}
                      style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.1)', cursor: 'pointer', touchAction: 'manipulation', padding: 0 }}>
                      <X size={8} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Drop zone leeg */}
            {tasks.length === 0 && (
              <div style={{
                height: isDrop ? '32px' : '4px',
                margin: '0 0.5rem 0.25rem',
                borderRadius: '3px',
                border: isDrop ? '1px dashed rgba(255,215,0,0.3)' : 'none',
                background: isDrop ? 'rgba(255,215,0,0.04)' : 'transparent',
                transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {isDrop && <span style={{ fontSize: '0.45rem', color: '#FFD700', fontWeight: '700' }}>HIER NEERZETTEN</span>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
