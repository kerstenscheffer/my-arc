// ========================================
// 📁 src/modules/workout/components/week-schedule/CustomWorkoutIndicator.jsx
// ========================================
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
      gap: '0.25rem'
    }}>
      <div style={{
        width: isMobile ? '32px' : '36px',
        height: isMobile ? '32px' : '36px',
        borderRadius: '10px',
        background: 'rgba(168, 85, 247, 0.2)',
        border: '2px solid rgba(168, 85, 247, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '1.2rem' : '1.4rem'
      }}>
        {emoji}
      </div>
      <div style={{
        fontSize: isMobile ? '0.55rem' : '0.65rem',
        color: 'rgba(168, 85, 247, 0.9)',
        lineHeight: 1.2,
        maxWidth: isMobile ? '45px' : '60px',
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
