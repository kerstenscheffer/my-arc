// src/modules/progress/components/TopExercisesStrip.jsx
import { Trophy } from 'lucide-react'

export default function TopExercisesStrip({ exercises, onExerciseClick, isMobile }) {
  if (!exercises || exercises.length === 0) return null

  const medals = ['🥇', '🥈', '🥉']
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32']

  return (
    <div style={{
      background: 'rgba(23, 23, 23, 0.4)',
      borderRadius: isMobile ? '12px' : '14px',
      border: '1px solid rgba(16, 185, 129, 0.15)',
      padding: isMobile ? '0.75rem' : '0.875rem',
      backdropFilter: 'blur(8px)'
    }}>
      {/* Header */}
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.4)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '0.625rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem'
      }}>
        <Trophy size={isMobile ? 11 : 12} />
        Top 3 Deze Maand
      </div>

      {/* Exercise Badges */}
      <div style={{
        display: isMobile ? 'flex' : 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '0.5rem' : '0.625rem',
        overflowX: isMobile ? 'visible' : 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {exercises.map((exercise, idx) => {
          const medal = medals[idx]
          const color = colors[idx]

          return (
            <button
              key={idx}
              onClick={() => onExerciseClick(exercise.name, '1rm')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.5rem' : '0.625rem',
                padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
                background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                border: `1px solid ${color}30`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                width: isMobile ? '100%' : 'auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: `0 2px 12px ${color}15`
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                  e.currentTarget.style.boxShadow = `0 4px 20px ${color}25`
                  e.currentTarget.style.border = `1px solid ${color}40`
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = `0 2px 12px ${color}15`
                  e.currentTarget.style.border = `1px solid ${color}30`
                }
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.96)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              {/* Medal */}
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.4rem',
                lineHeight: 1
              }}>
                {medal}
              </div>

              {/* Exercise Info */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.1rem'
              }}>
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '800',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em'
                }}>
                  {exercise.name}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {exercise.count} sessies
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <style>{`
        /* Hide scrollbar but keep functionality */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
