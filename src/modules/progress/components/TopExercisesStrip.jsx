// src/modules/progress/components/TopExercisesStrip.jsx
import { Dumbbell } from 'lucide-react'

export default function TopExercisesStrip({ exercises, onExerciseClick, isMobile }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(249, 115, 22, 0.25)',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '0.75rem' : '0.875rem',
      boxShadow: '0 2px 12px rgba(249, 115, 22, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
        opacity: 0.4
      }} />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        marginBottom: '0.625rem'
      }}>
        <div style={{
          width: isMobile ? '28px' : '30px',
          height: isMobile ? '28px' : '30px',
          borderRadius: '6px',
          background: 'rgba(249, 115, 22, 0.15)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Dumbbell size={isMobile ? 13 : 14} color="#f97316" style={{ opacity: 0.9 }} />
        </div>
        
        <span style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em'
        }}>
          Top 3 Oefeningen
        </span>
      </div>
      
      {/* Exercises Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.5rem' : '0.625rem'
      }}>
        {exercises.map((exercise, idx) => (
          <button
            key={idx}
            onClick={() => onExerciseClick(exercise.name, '1rm')}
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '8px',
              padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.1) 100%)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.35)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'
              }
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                color: 'white',
                marginBottom: '0.125rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {exercise.name}
              </div>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                {exercise.count}x getraind
              </div>
            </div>
            
            <div style={{
              width: isMobile ? '24px' : '26px',
              height: isMobile ? '24px' : '26px',
              borderRadius: '6px',
              background: 'rgba(249, 115, 22, 0.2)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: '800',
                color: '#f97316'
              }}>
                {idx + 1}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
