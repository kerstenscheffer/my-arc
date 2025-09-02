// src/modules/progress/workout/components/WorkoutSelector.jsx
const THEME = {
  primary: '#f97316',
  gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)',
  border: 'rgba(249, 115, 22, 0.2)'
}

export default function WorkoutSelector({ scheduledWorkout, onStartWorkout, onQuickWorkout, isMobile }) {
  const quickWorkouts = [
    { type: 'upper', label: 'Upper Body', emoji: '💪', exercises: 5, time: '45 min' },
    { type: 'lower', label: 'Lower Body', emoji: '🦵', exercises: 5, time: '50 min' },
    { type: 'cardio', label: 'HIIT Cardio', emoji: '🏃', exercises: 4, time: '30 min' }
  ]

  if (scheduledWorkout) {
    return (
      <div style={{
        background: THEME.gradient,
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: '1rem',
        boxShadow: `0 8px 24px ${THEME.primary}33`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255,255,255,0.9)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}>
            📅 VANDAAG'S WORKOUT
          </div>
          <h2 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '0.375rem'
          }}>
            {scheduledWorkout.workout?.name || scheduledWorkout.name}
          </h2>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span>{scheduledWorkout.workout?.exercises?.length || scheduledWorkout.exercises?.length || 0} oefeningen</span>
            <span>•</span>
            <span>~45 min</span>
          </div>
        </div>
        
        <button
          onClick={() => onStartWorkout(scheduledWorkout.workout || scheduledWorkout)}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '0.875rem',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          ⚡ Start Workout
        </button>
      </div>
    )
  }

  // No scheduled workout - show quick options
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '16px',
      padding: isMobile ? '1rem' : '1.25rem',
      border: `1px solid ${THEME.border}`,
      marginBottom: '1rem'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '1.25rem'
      }}>
        <div style={{
          fontSize: isMobile ? '32px' : '36px',
          marginBottom: '0.875rem',
          opacity: 0.8
        }}>
          🏋️
        </div>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '0.375rem'
        }}>
          Geen workout gepland
        </h3>
        <p style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          Kies een quick workout om te starten
        </p>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.5rem' : '0.625rem'
      }}>
        {quickWorkouts.map(workout => (
          <button
            key={workout.type}
            onClick={() => onQuickWorkout(workout.type)}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(249,115,22,0.05))',
              border: `1px solid ${THEME.border}`,
              borderRadius: '12px',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.borderColor = THEME.primary
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.borderColor = THEME.border
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: isMobile ? '0.625rem' : '0.75rem'
            }}>
              <span style={{ fontSize: isMobile ? '1.75rem' : '2rem' }}>{workout.emoji}</span>
              <div style={{ fontSize: isMobile ? '16px' : '18px', opacity: 0.5 }}>➡️</div>
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              marginBottom: '0.25rem'
            }}>
              {workout.label}
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              {workout.exercises} oefeningen • {workout.time}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
