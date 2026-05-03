// src/modules/workout/components/week-schedule/WeekGrid.jsx
import { useState, useRef } from 'react'
import DayCard from './DayCard'

export default function WeekGrid({
  tempSchedule, weekDays, todayIndex, completedWorkouts,
  selectedWorkout, selectedForSwap, swapMode, localSwapMode,
  getWorkoutData, onDayClick, onSwapClick, onScheduleUpdate, isMobile
}) {
  const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

  const [draggedDay, setDraggedDay] = useState(null)
  const [dragOverDay, setDragOverDay] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [touchStartPos, setTouchStartPos] = useState(null)

  const dragTimeoutRef = useRef(null)
  const dragStartTimeRef = useRef(null)
  const touchStartTimeRef = useRef(null)
  const longPressTimeoutRef = useRef(null)

  const handleDragStart = (e, day, workoutKey) => {
    if (!workoutKey) { e.preventDefault(); return }
    dragStartTimeRef.current = Date.now()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ day, workoutKey }))
    dragTimeoutRef.current = setTimeout(() => { setDraggedDay(day); setIsDragging(true) }, 150)
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current)
    e.currentTarget.style.opacity = '1'
    setTimeout(() => { setDraggedDay(null); setDragOverDay(null); setIsDragging(false) }, 100)
  }

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDragEnter = (e, day) => { e.preventDefault(); if (draggedDay !== day && isDragging) setDragOverDay(day) }
  const handleDragLeave = (e) => { if (e.currentTarget === e.target) setDragOverDay(null) }

  const handleDrop = (e, targetDay) => {
    e.preventDefault(); e.stopPropagation()
    const dragDuration = Date.now() - (dragStartTimeRef.current || 0)
    if (dragDuration < 150) { setDraggedDay(null); setDragOverDay(null); setIsDragging(false); return }
    try {
      const { day: sourceDay, workoutKey: sourceWorkout } = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (sourceDay !== targetDay) performSwap(sourceDay, targetDay, sourceWorkout, tempSchedule[targetDay])
    } catch {}
    setDraggedDay(null); setDragOverDay(null); setIsDragging(false)
  }

  const handleTouchStart = (e, day, workoutKey) => {
    if (!workoutKey) return
    const touch = e.touches[0]
    touchStartTimeRef.current = Date.now()
    setTouchStartPos({ x: touch.clientX, y: touch.clientY, day, workoutKey })
    longPressTimeoutRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50)
      setDraggedDay(day); setIsDragging(true)
      e.currentTarget.style.opacity = '0.6'
    }, 500)
  }

  const handleTouchMove = (e) => {
    if (!isDragging || !touchStartPos) return
    e.preventDefault()
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const dayCard = el?.closest('[data-day]')
    if (dayCard) { const t = dayCard.getAttribute('data-day'); if (t !== draggedDay) setDragOverDay(t) }
  }

  const handleTouchEnd = (e, day) => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current)
    const dur = Date.now() - (touchStartTimeRef.current || 0)
    e.currentTarget.style.opacity = '1'
    if (isDragging && dragOverDay && dragOverDay !== draggedDay) {
      performSwap(draggedDay, dragOverDay, tempSchedule[draggedDay], tempSchedule[dragOverDay])
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
    } else if (dur < 500) {
      handleCardClick(day, tempSchedule[day])
    }
    setTimeout(() => { setDraggedDay(null); setDragOverDay(null); setIsDragging(false); setTouchStartPos(null) }, 100)
  }

  const performSwap = (sourceDay, targetDay, sourceWorkout, targetWorkout) => {
    const s = { ...tempSchedule }
    if (sourceWorkout && targetWorkout) { s[targetDay] = sourceWorkout; s[sourceDay] = targetWorkout }
    else if (sourceWorkout) { s[targetDay] = sourceWorkout; delete s[sourceDay] }
    else if (targetWorkout) { s[sourceDay] = targetWorkout; delete s[targetDay] }
    if (onScheduleUpdate) onScheduleUpdate(s)
  }

  const handleCardClick = (day, assignedWorkout) => {
    if (isDragging || draggedDay) return
    if (localSwapMode) onSwapClick(day, assignedWorkout)
    else onDayClick(day, assignedWorkout)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? '0.25rem' : '0.375rem', marginBottom: isMobile ? '0.5rem' : '0.625rem' }}>
      {weekDays.map((day, index) => {
        const assignedWorkout = tempSchedule[day]
        const workoutData = getWorkoutData(assignedWorkout)
        const isToday = index === todayIndex
        const isCompleted = Array.isArray(completedWorkouts) && completedWorkouts.some(w => w.workout_day === day)
        const isSelected = selectedWorkout === assignedWorkout || (selectedForSwap && selectedForSwap.day === day)
        const isBeingDragged = draggedDay === day
        const isDragOver = dragOverDay === day

        return (
          <div
            key={day}
            data-day={day}
            draggable={!!assignedWorkout && !isMobile}
            onDragStart={(e) => !isMobile && handleDragStart(e, day, assignedWorkout)}
            onDragEnd={(e) => !isMobile && handleDragEnd(e)}
            onDragOver={(e) => !isMobile && handleDragOver(e)}
            onDragEnter={(e) => !isMobile && handleDragEnter(e, day)}
            onDragLeave={(e) => !isMobile && handleDragLeave(e)}
            onDrop={(e) => !isMobile && handleDrop(e, day)}
            onTouchStart={(e) => isMobile && handleTouchStart(e, day, assignedWorkout)}
            onTouchMove={(e) => isMobile && handleTouchMove(e)}
            onTouchEnd={(e) => isMobile && handleTouchEnd(e, day)}
            style={{ position: 'relative', cursor: assignedWorkout ? (isBeingDragged ? 'grabbing' : 'grab') : 'default', transition: 'all 0.2s ease', touchAction: isMobile ? 'none' : 'auto' }}
          >
            {isDragOver && isDragging && draggedDay !== day && (
              <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none', zIndex: 10 }} />
            )}
            <DayCard
              day={day} dayIndex={index} workoutKey={assignedWorkout} workoutData={workoutData}
              isToday={isToday} isCompleted={isCompleted} isSelected={isSelected}
              swapMode={swapMode || localSwapMode} isMobile={isMobile}
              weekDaysShort={weekDaysShort} weekDaysDutch={weekDaysDutch}
              isDragging={isBeingDragged} isAnyDragging={isDragging}
              onClick={() => handleCardClick(day, assignedWorkout)}
              onSwapClick={() => onSwapClick(day, assignedWorkout)}
              localSwapMode={localSwapMode}
            />
          </div>
        )
      })}
    </div>
  )
}
