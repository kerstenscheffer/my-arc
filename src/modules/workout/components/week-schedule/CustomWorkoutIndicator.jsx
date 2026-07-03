// src/modules/workout/components/week-schedule/CustomWorkoutIndicator.jsx
//
// Custom-workouts (cardio/cycling/etc. uit eigen pool) — edge-to-edge paarse
// banner met emoji + workout-naam dik wit eronder. Visueel consistent met
// WorkoutIndicator zodat alle week-tiles dezelfde verticale layout hebben.

const getCustomWorkoutEmoji = (type) => {
  const emojis = {
    cardio: '❤️',
    cycling: '🚴',
    running: '🏃',
    swimming: '🏊',
    hiking: '🥾',
    yoga: '🧘',
    sports: '⚽',
    custom: '💪',
  }
  return emojis[type] || '💪'
}

const MAX_LABEL_CHARS = 8

export default function CustomWorkoutIndicator({ workout, isMobile }) {
  const emoji = getCustomWorkoutEmoji(workout.type)
  const rawName = (workout?.name || '').trim()
  const label = rawName.length > MAX_LABEL_CHARS ? `${rawName.slice(0, MAX_LABEL_CHARS)}…` : rawName

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Edge-to-edge paarse banner met emoji */}
      <div style={{
        width: '100%',
        height: isMobile ? 30 : 36,
        background: 'linear-gradient(135deg, rgba(168,85,247,0.28) 0%, rgba(168,85,247,0.12) 100%)',
        borderBottom: '1px solid rgba(168,85,247,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? '1.05rem' : '1.2rem',
        position: 'relative',
        flexShrink: 0,
      }}>
        {emoji}
      </div>

      {/* Workout-naam — dik gedrukt vel wit */}
      <div style={{
        padding: isMobile ? '6px 4px 0' : '7px 6px 0',
        fontSize: isMobile ? '0.66rem' : '0.72rem',
        fontWeight: 900,
        color: '#fff',
        letterSpacing: '0.02em',
        lineHeight: 1.15,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        maxWidth: '100%',
      }}>
        {label || `${workout?.duration || ''}min`}
      </div>
    </div>
  )
}
