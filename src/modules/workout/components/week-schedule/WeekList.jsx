// src/modules/workout/components/week-schedule/WeekList.jsx
import { useState, useRef } from 'react'
import { Check, GripVertical, Dumbbell, Clock } from 'lucide-react'

const getWorkoutImage = (workoutData) => {
  if (workoutData?.image_url) return workoutData.image_url
  const name = (workoutData?.name || workoutData?.focus || '').toLowerCase()
  if (name.includes('push') || name.includes('chest') || name.includes('borst')) return 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=200&h=200&fit=crop&q=70'
  if (name.includes('pull') || name.includes('back') || name.includes('rug')) return 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=200&h=200&fit=crop&q=70'
  if (name.includes('leg') || name.includes('squat') || name.includes('been')) return 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=200&h=200&fit=crop&q=70'
  if (name.includes('shoulder') || name.includes('schouder')) return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=200&h=200&fit=crop&q=70'
  if (name.includes('arm') || name.includes('bicep') || name.includes('curl')) return 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&h=200&fit=crop&q=70'
  if (name.includes('cardio') || name.includes('run')) return 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=200&h=200&fit=crop&q=70'
  if (name.includes('swim') || name.includes('zwem')) return 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=200&h=200&fit=crop&q=70'
  if (name.includes('fiets') || name.includes('cycl')) return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200&h=200&fit=crop&q=70'
  return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop&q=70'
}

const DAY_NL = { Monday: 'Maandag', Tuesday: 'Dinsdag', Wednesday: 'Woensdag', Thursday: 'Donderdag', Friday: 'Vrijdag', Saturday: 'Zaterdag', Sunday: 'Zondag' }
const DAY_SHORT = { Monday: 'Ma', Tuesday: 'Di', Wednesday: 'Wo', Thursday: 'Do', Friday: 'Vr', Saturday: 'Za', Sunday: 'Zo' }

export default function WeekList({
  tempSchedule, weekDays, todayIndex, completedWorkouts,
  selectedWorkout, selectedForSwap, localSwapMode,
  getWorkoutData, onDayClick, onSwapClick, onScheduleUpdate, isMobile
}) {
  const [draggedDay, setDraggedDay] = useState(null)
  const [dragOverDay, setDragOverDay] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [touchStartPos, setTouchStartPos] = useState(null)
  const dragStartTimeRef = useRef(null)
  const longPressTimeoutRef = useRef(null)

  const scheduledDays = weekDays.filter(day => tempSchedule[day])
  if (scheduledDays.length === 0) return null

  const handleDragStart = (e, day) => { dragStartTimeRef.current = Date.now(); setDraggedDay(day); setIsDragging(true) }
  const handleDragEnd = () => { setTimeout(() => { setDraggedDay(null); setDragOverDay(null); setIsDragging(false) }, 100) }
  const handleDragOver = (e, targetDay) => { e.preventDefault(); if (draggedDay && draggedDay !== targetDay) setDragOverDay(targetDay) }
  const handleDrop = (e, targetDay) => {
    e.preventDefault()
    if (Date.now() - dragStartTimeRef.current < 150 || !draggedDay || draggedDay === targetDay) { setDragOverDay(null); return }
    performSwap(draggedDay, targetDay)
  }

  const handleTouchStart = (e, day) => {
    const touch = e.touches[0]
    dragStartTimeRef.current = Date.now()
    setTouchStartPos({ x: touch.clientX, y: touch.clientY, day })
    longPressTimeoutRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50)
      setDraggedDay(day); setIsDragging(true)
    }, 500)
  }
  const handleTouchMove = (e) => {
    if (!isDragging || !touchStartPos) return
    e.preventDefault()
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const dayEl = el?.closest('[data-day]')
    if (dayEl) { const t = dayEl.getAttribute('data-day'); if (t !== draggedDay) setDragOverDay(t) }
  }
  const handleTouchEnd = (e, day) => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current)
    const dur = Date.now() - dragStartTimeRef.current
    if (isDragging && dragOverDay && dragOverDay !== draggedDay) {
      performSwap(draggedDay, dragOverDay)
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
    } else if (dur < 500) { handleCardClick(day) }
    setTimeout(() => { setDraggedDay(null); setDragOverDay(null); setIsDragging(false); setTouchStartPos(null) }, 100)
  }

  const performSwap = (sourceDay, targetDay) => {
    const s = { ...tempSchedule }
    const tmp = s[sourceDay]; s[sourceDay] = s[targetDay]; s[targetDay] = tmp
    if (onScheduleUpdate) onScheduleUpdate(s)
  }

  const handleCardClick = (day) => {
    if (isDragging || draggedDay) return
    const w = tempSchedule[day]
    if (localSwapMode) onSwapClick(day, w)
    else onDayClick(day, w)
  }

  const imgSize = isMobile ? '60px' : '68px'

  return (
    <div style={{ marginTop: isMobile ? '0.875rem' : '1rem' }}>

      {/* Header — compact, lowercase feel */}
      <div style={{ padding: isMobile ? '0 1rem 0.4rem' : '0 1.25rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Schema
        </span>
      </div>

      {scheduledDays.map((day, idx) => {
        const assignedWorkout = tempSchedule[day]
        const workoutData = getWorkoutData(assignedWorkout)
        const isToday = weekDays.indexOf(day) === todayIndex
        const isCompleted = Array.isArray(completedWorkouts) && completedWorkouts.some(w => w.workout_day === day)
        const isBeingDragged = draggedDay === day
        const isDragOver = dragOverDay === day

        return (
          <div
            key={day}
            data-day={day}
            draggable={!!assignedWorkout && !isMobile}
            onDragStart={(e) => !isMobile && handleDragStart(e, day)}
            onDragEnd={() => !isMobile && handleDragEnd()}
            onDragOver={(e) => !isMobile && handleDragOver(e, day)}
            onDragLeave={() => !isMobile && setDragOverDay(null)}
            onDrop={(e) => !isMobile && handleDrop(e, day)}
            onTouchStart={(e) => isMobile && handleTouchStart(e, day)}
            onTouchMove={(e) => isMobile && handleTouchMove(e)}
            onTouchEnd={(e) => isMobile && handleTouchEnd(e, day)}
            onClick={() => handleCardClick(day)}
            style={{
              display: 'flex', alignItems: 'stretch',
              minHeight: imgSize,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: isDragOver && isDragging ? 'rgba(255,255,255,0.03)' : isCompleted ? 'rgba(16,185,129,0.02)' : isToday ? 'rgba(255,255,255,0.02)' : 'transparent',
              cursor: 'pointer',
              touchAction: isMobile ? 'none' : 'auto',
              transition: 'background 0.15s ease',
              transform: isBeingDragged ? 'scale(0.99)' : 'scale(1)',
              opacity: isBeingDragged ? 0.5 : 1,
              position: 'relative'
            }}
          >
            {/* Drop indicator */}
            {isDragOver && isDragging && draggedDay !== day && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '1px', background: 'rgba(255,255,255,0.25)', zIndex: 10 }} />
            )}

            {/* Vandaag streep links */}
            {isToday && (
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.25)' }} />
            )}

            {/* Foto */}
            <div style={{ width: imgSize, minHeight: imgSize, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${getWorkoutImage(workoutData)})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: isCompleted ? 0.3 : 0.7 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 100%)' }} />

              {/* Dag badge */}
              <div style={{ position: 'absolute', top: isMobile ? '4px' : '5px', left: isMobile ? '4px' : '5px', height: isMobile ? '18px' : '20px', minWidth: isMobile ? '18px' : '20px', borderRadius: '3px', background: 'rgba(0,0,0,0.6)', border: isToday ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.2rem', zIndex: 2 }}>
                {isCompleted
                  ? <Check size={isMobile ? 9 : 10} color="#10b981" strokeWidth={2.5} />
                  : <span style={{ fontSize: isMobile ? '0.48rem' : '0.52rem', fontWeight: '800', color: isToday ? '#fff' : 'rgba(255,255,255,0.45)', letterSpacing: '0.01em' }}>{DAY_SHORT[day]}</span>
                }
              </div>
            </div>

            {/* Tekst */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.875rem', gap: '0.175rem' }}>
              <div style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', fontWeight: '700', color: isToday ? 'rgba(255,255,255,0.4)' : isCompleted ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                {isToday ? 'Vandaag' : DAY_NL[day]}{isCompleted && ' · Voltooid'}
              </div>
              <div style={{ fontSize: isMobile ? '0.875rem' : '0.95rem', fontWeight: '800', color: isCompleted ? '#10b981' : '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {workoutData?.name || assignedWorkout}
              </div>
              {workoutData && (
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.375rem' : '0.5rem', marginTop: '0.05rem' }}>
                  {workoutData.focus && (
                    <span style={{ fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: '600', color: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                      <Dumbbell size={isMobile ? 8 : 9} strokeWidth={2} />{workoutData.focus}
                    </span>
                  )}
                  {workoutData.geschatteTijd && (
                    <span style={{ fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: '600', color: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                      <Clock size={isMobile ? 8 : 9} strokeWidth={2} />{workoutData.geschatteTijd}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Grip */}
            <div style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0 0.5rem 0 0' : '0 0.625rem 0 0', flexShrink: 0 }}>
              <GripVertical size={isMobile ? 12 : 14} color="rgba(255,255,255,0.08)" strokeWidth={2} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
