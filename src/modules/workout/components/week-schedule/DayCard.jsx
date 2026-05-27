// src/modules/workout/components/week-schedule/DayCard.jsx
// Calendar-strip layout: static day-header on top, separate workout card
// below. The card looks visibly "pickup-able" (gap, rounded corners,
// drag-grip dots) so users intuit drag-to-swap without instructions.
import { Check, GripVertical } from 'lucide-react'
import WorkoutIndicator from './WorkoutIndicator'
import CustomWorkoutIndicator from './CustomWorkoutIndicator'

export default function DayCard({
  dayIndex, workoutKey, workoutData,
  isToday, isCompleted, isSelected, swapMode,
  isMobile, weekDaysDutch,
  isDragging, isAnyDragging, onClick
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
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'stretch',
        gap: isMobile ? '4px' : '5px',
        position: 'relative',
        pointerEvents: isAnyDragging && !isDragging ? 'none' : 'auto',
      }}
    >
      {/* ── Static day-header (not draggable) ── */}
      <div style={{
        textAlign: 'center',
        paddingTop: isMobile ? '0.1rem' : '0.15rem',
        paddingBottom: isMobile ? '0.2rem' : '0.25rem',
        borderBottom: isToday
          ? '2px solid rgba(255,255,255,0.5)'
          : '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          fontWeight: isToday ? '800' : '700',
          color: isToday ? '#fff' : isCompleted ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}>
          {weekDaysDutch[dayIndex]}
        </div>
      </div>

      {/* ── Workout card (or empty slot) ── */}
      {hasContent ? (
        <div
          onClick={handleClick}
          style={{
            position: 'relative',
            padding: isMobile ? '0.4rem 0.15rem 0.45rem' : '0.5rem 0.2rem 0.55rem',
            minHeight: isMobile ? '76px' : '88px',
            background: isCompleted
              ? 'rgba(16,185,129,0.06)'
              : isSelected
                ? 'rgba(255,215,0,0.08)'
                : 'rgba(255,255,255,0.045)',
            border: `1px solid ${
              isCompleted
                ? 'rgba(16,185,129,0.22)'
                : isSelected
                  ? 'rgba(255,215,0,0.35)'
                  : 'rgba(255,255,255,0.09)'
            }`,
            borderRadius: isMobile ? '8px' : '10px',
            boxShadow: isDragging
              ? '0 6px 18px rgba(0,0,0,0.45)'
              : '0 1px 0 rgba(255,255,255,0.02), 0 2px 4px rgba(0,0,0,0.18)',
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
            transform: isDragging ? 'scale(1.04)' : 'scale(1)',
            opacity: isDragging ? 0.9 : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textAlign: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            overflow: 'hidden',
          }}
        >
          {/* Drag-grip dots — top-right corner. Universal "pick me up" cue. */}
          <div style={{
            position: 'absolute',
            top: isMobile ? '2px' : '3px',
            right: isMobile ? '1px' : '2px',
            color: 'rgba(255,255,255,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <GripVertical size={isMobile ? 9 : 10} strokeWidth={2.2} />
          </div>

          {isCustom ? (
            <CustomWorkoutIndicator workout={workoutData} isMobile={isMobile} />
          ) : workoutData ? (
            <WorkoutIndicator workoutData={workoutData} isMobile={isMobile} />
          ) : (
            // Activity placeholder (cardio / swim / etc)
            <div style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: '0.25rem',
            }}>
              <div style={{
                width: isMobile ? '7px' : '8px', height: isMobile ? '7px' : '8px',
                borderRadius: '50%', background: 'rgba(255,255,255,0.3)'
              }} />
            </div>
          )}

          {/* Voltooid check — bottom-right */}
          {isCompleted && (
            <div style={{ position: 'absolute', bottom: isMobile ? '3px' : '4px', right: isMobile ? '3px' : '4px' }}>
              <Check size={isMobile ? 9 : 10} color="#10b981" strokeWidth={2.5} />
            </div>
          )}
        </div>
      ) : (
        // Empty rest-day slot — dashed placeholder, drop-target ready
        <div
          onClick={swapMode ? handleClick : undefined}
          style={{
            minHeight: isMobile ? '76px' : '88px',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: isMobile ? '8px' : '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: swapMode ? 'pointer' : 'default',
            color: 'rgba(255,255,255,0.18)',
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '300',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          —
        </div>
      )}
    </div>
  )
}
