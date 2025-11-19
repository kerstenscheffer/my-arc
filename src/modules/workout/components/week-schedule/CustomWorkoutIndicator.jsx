// src/modules/workout/components/week-schedule/CustomWorkoutIndicator.jsx
const getCustomWorkoutEmoji = (type) => {
  const emojis = {
    cardio: '❤️',
    cycling: '🚴',
    running: '🏃',
    swimming: '🏊',
    hiking: '🥾',
    yoga: '🧘',
    sports: '⚽',
    custom: '💪'
  }
  return emojis[type] || '💪'
}

export default function CustomWorkoutIndicator({ workout, isMobile }) {
  const emoji = getCustomWorkoutEmoji(workout.type)
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isMobile ? '0.25rem' : '0.3rem'
    }}>
      <div style={{
        width: isMobile ? '28px' : '32px',
        height: isMobile ? '28px' : '32px',
        borderRadius: '8px',
        background: 'rgba(168, 85, 247, 0.15)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)'
      }}>
        {emoji}
      </div>
      <div style={{
        fontSize: isMobile ? '0.55rem' : '0.6rem',
        color: 'rgba(168, 85, 247, 0.9)',
        lineHeight: 1.2,
        maxWidth: isMobile ? '45px' : '55px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontWeight: '600'
      }}>
        {workout.duration}min
      </div>
    </div>
  )
}
