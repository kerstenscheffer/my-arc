// src/modules/workout/components/alternative-exercises/ExerciseCard.jsx
import { Dumbbell, Zap, TrendingUp } from 'lucide-react'

/**
 * SIMPLE CLEAN EXERCISE CARD
 * - No glow effects (performance!)
 * - Minimal animations
 * - Clean readable design
 * - Compact spacing
 */

export default function ExerciseCard({ exercise, onSelect, isMobile }) {
  const similarity = exercise.similarity || 0
  const isHighMatch = similarity >= 70
  
  return (
    <button
      onClick={() => onSelect(exercise)}
      style={{
        width: '100%',
        padding: isMobile ? '0.75rem' : '0.875rem',
        background: isHighMatch 
          ? 'rgba(249, 115, 22, 0.1)' 
          : 'rgba(23, 23, 23, 0.6)',
        border: `1px solid ${isHighMatch ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
        borderRadius: '10px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isHighMatch 
          ? 'rgba(249, 115, 22, 0.15)' 
          : 'rgba(255, 255, 255, 0.05)'
        e.currentTarget.style.borderColor = isHighMatch 
          ? 'rgba(249, 115, 22, 0.4)' 
          : 'rgba(255, 255, 255, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isHighMatch 
          ? 'rgba(249, 115, 22, 0.1)' 
          : 'rgba(23, 23, 23, 0.6)'
        e.currentTarget.style.borderColor = isHighMatch 
          ? 'rgba(249, 115, 22, 0.3)' 
          : 'rgba(255, 255, 255, 0.08)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.625rem' : '0.75rem'
      }}>
        {/* Icon - simple */}
        <div style={{
          width: isMobile ? '32px' : '36px',
          height: isMobile ? '32px' : '36px',
          borderRadius: '8px',
          background: isHighMatch 
            ? 'rgba(249, 115, 22, 0.2)' 
            : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isHighMatch ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Dumbbell 
            size={isMobile ? 16 : 18} 
            color={isHighMatch ? '#f97316' : 'rgba(255, 255, 255, 0.5)'}
            strokeWidth={2}
          />
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {exercise.name}
          </div>
          
          {/* Meta info - single line */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '600'
          }}>
            {exercise.muscle && (
              <span style={{ 
                textTransform: 'capitalize',
                color: isHighMatch ? '#f97316' : 'rgba(255, 255, 255, 0.5)'
              }}>
                {exercise.muscle}
              </span>
            )}
            
            {exercise.equipment && (
              <>
                <span>•</span>
                <span style={{ textTransform: 'capitalize' }}>
                  {exercise.equipment}
                </span>
              </>
            )}
            
            {similarity > 0 && (
              <>
                <span>•</span>
                <span style={{ 
                  color: isHighMatch ? '#f97316' : 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '700'
                }}>
                  {similarity}% match
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Badge for compound exercises */}
        {exercise.compound && (
          <div style={{
            padding: '0.25rem 0.5rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: '#10b981',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            flexShrink: 0
          }}>
            Compound
          </div>
        )}
      </div>
    </button>
  )
}
