// src/modules/progress/workout/components/WorkoutStats.jsx
const THEME = {
  primary: '#f97316',
  gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)'
}

export default function WorkoutStats({ stats, isMobile }) {
  if (!stats) return null

  const statCards = [
    {
      label: 'Streak',
      value: `${stats.streak || 0}`,
      unit: 'd',
      icon: '🔥',
      gradient: THEME.gradient
    },
    {
      label: 'Maand',
      value: stats.totalWorkouts || 0,
      unit: '',
      icon: '💪',
      gradient: 'linear-gradient(135deg, #10b981, #059669)'
    },
    {
      label: 'Volume',
      value: Math.round((stats.weeklyVolume || 0) / 1000),
      unit: 'k',
      icon: '📊',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    {
      label: 'Score',
      value: `${stats.consistency || 0}`,
      unit: '%',
      icon: '📈',
      gradient: 'linear-gradient(135deg, #ec4899, #db2777)'
    }
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: isMobile ? '0.5rem' : '0.75rem',
      marginBottom: '1rem'
    }}>
      {statCards.map((stat, index) => (
        <div
          key={index}
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '0.875rem' : '1rem',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
              e.currentTarget.style.borderColor = THEME.primary + '33'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
            }
          }}
        >
          {/* Top gradient line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: stat.gradient
          }} />
          
          {/* Icon */}
          <div style={{
            fontSize: isMobile ? '20px' : '22px',
            marginBottom: isMobile ? '0.5rem' : '0.625rem',
            opacity: 0.9
          }}>
            {stat.icon}
          </div>
          
          {/* Value */}
          <div style={{
            fontSize: isMobile ? '1.375rem' : '1.5rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '0.25rem',
            lineHeight: 1
          }}>
            {stat.value}{stat.unit}
          </div>
          
          {/* Label */}
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}
