// src/modules/workout/components/week-schedule/DayCard.jsx
import { Check, Moon, Plus } from 'lucide-react'
import WorkoutIndicator from './WorkoutIndicator'
import CustomWorkoutIndicator from './CustomWorkoutIndicator'

export default function DayCard({
  day, dayIndex, workoutKey, workoutData,
  isToday, isCompleted, isSelected, swapMode,
  isMobile, weekDaysShort, weekDaysDutch,
  isDragging, isAnyDragging, onClick, onSwapClick, localSwapMode
}) {
  const isCustom = workoutKey?.startsWith('custom_')
  const isActivity = ['cardio', 'swimming', 'hiking', 'cycling', 'running'].includes(workoutKey)
  const hasContent = !!workoutData || isActivity

  const handleClick = (e) => {
    if (isAnyDragging) { e.preventDefault(); e.stopPropagation(); return }
    if (onClick) onClick()
  }

  return (
    <div
      onClick={handleClick}
      style={{
        padding: isMobile ? '0.375rem 0.15rem 0.4rem' : '0.5rem 0.2rem 0.5rem',
        minHeight: isMobile ? '86px' : '100px',
        background: isCompleted ? 'rgba(16,185,129,0.03)' : isToday ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: `1px solid ${isToday ? 'rgba(255,255,255,0.12)' : isCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: isMobile ? '4px' : '6px',
        cursor: hasContent ? (isDragging ? 'grabbing' : 'grab') : (swapMode ? 'pointer' : 'default'),
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'center',
        position: 'relative',
        transform: isDragging ? 'scale(0.97)' : 'scale(1)',
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: isAnyDragging && !isDragging ? 'none' : 'auto',
        overflow: 'hidden'
      }}
    >
      {/* Vandaag — witte top streep */}
      {isToday && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.5)' }} />
      )}

      {/* Dag label */}
      <div style={{
        fontSize: isMobile ? '0.52rem' : '0.57rem',
        fontWeight: isToday ? '800' : '600',
        color: isToday ? '#fff' : isCompleted ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        lineHeight: 1,
        marginBottom: isMobile ? '0.3rem' : '0.375rem',
        marginTop: isMobile ? '0.1rem' : '0.15rem'
      }}>
        {isMobile ? weekDaysDutch[dayIndex] : weekDaysDutch[dayIndex]}
      </div>

      {/* Content */}
      {workoutData ? (
        isCustom ? (
          <CustomWorkoutIndicator workout={workoutData} isMobile={isMobile} />
        ) : (
          <WorkoutIndicator workoutData={workoutData} isMobile={isMobile} />
        )
      ) : isActivity ? (
        <div style={{ width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: isMobile ? '7px' : '8px', height: isMobile ? '7px' : '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
        </div>
      ) : swapMode ? (
        <Plus size={isMobile ? 13 : 15} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
      ) : (
        <Moon size={isMobile ? 12 : 13} color="rgba(255,255,255,0.1)" strokeWidth={1.5} />
      )}

      {/* Voltooid check — rechtsonder */}
      {isCompleted && (
        <div style={{ position: 'absolute', bottom: isMobile ? '3px' : '4px', right: isMobile ? '3px' : '4px' }}>
          <Check size={isMobile ? 8 : 9} color="#10b981" strokeWidth={2.5} />
        </div>
      )}
    </div>
  )
}
