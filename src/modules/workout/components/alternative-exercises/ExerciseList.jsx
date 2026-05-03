// src/modules/workout/components/alternative-exercises/ExerciseList.jsx
import { Award, TrendingUp, Activity, Dumbbell } from 'lucide-react'
import ExerciseCard from './ExerciseCard'

/**
 * EXERCISE LIST
 * 
 * Displays exercises grouped by:
 * - Recommended (high similarity score)
 * - Compound movements
 * - Isolation movements
 */

export default function ExerciseList({ 
  exercises, 
  onSelectExercise,
  loading,
  isMobile 
}) {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '3rem 1rem' : '4rem 1rem',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <div style={{
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          borderRadius: '16px',
          background: 'rgba(249, 115, 22, 0.2)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          {/* Spinner */}
          <div style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            border: '3px solid rgba(249, 115, 22, 0.2)',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            boxShadow: '0 0 20px rgba(249, 115, 22, 0.4)'
          }} />
        </div>
        
        <p style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '700',
          color: '#f97316'
        }}>
          Alternatieven laden...
        </p>
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  if (!exercises || exercises.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: isMobile ? '3rem 1rem' : '4rem 1rem',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <div style={{
          width: isMobile ? '72px' : '88px',
          height: isMobile ? '72px' : '88px',
          margin: '0 auto 1.5rem',
          borderRadius: '20px',
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          <Dumbbell size={isMobile ? 32 : 40} color="rgba(249, 115, 22, 0.3)" strokeWidth={2} />
        </div>
        
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Geen oefeningen gevonden
        </h3>
        
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.5)',
          lineHeight: '1.5'
        }}>
          Probeer je filters of zoekterm aan te passen
        </p>
      </div>
    )
  }
  
  // Group exercises
  const recommended = exercises.filter(e => e.similarity && e.similarity > 0)
  const compound = exercises.filter(e => e.type === 'compound' && (!e.similarity || e.similarity === 0))
  const isolation = exercises.filter(e => e.type === 'isolation' && (!e.similarity || e.similarity === 0))
  
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      paddingRight: isMobile ? '0' : '0.5rem',
      WebkitOverflowScrolling: 'touch'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.625rem' : '0.75rem',
        paddingBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        {/* Recommended Section */}
        {recommended.length > 0 && (
          <>
            <SectionHeader
              icon={Award}
              title="Aanbevolen Alternatieven"
              count={recommended.length}
              color="#fbbf24"
              isMobile={isMobile}
            />
            {recommended.map((exercise, index) => (
              <ExerciseCard
                key={`rec-${exercise.id || exercise.name}-${index}`}
                exercise={exercise}
                onSelect={() => onSelectExercise(exercise)}
                isRecommended={true}
                isMobile={isMobile}
              />
            ))}
          </>
        )}
        
        {/* Compound Section */}
        {compound.length > 0 && (
          <>
            <SectionHeader
              icon={TrendingUp}
              title="Compound Bewegingen"
              count={compound.length}
              color="#3b82f6"
              isMobile={isMobile}
              marginTop={recommended.length > 0}
            />
            {compound.map((exercise, index) => (
              <ExerciseCard
                key={`comp-${exercise.id || exercise.name}-${index}`}
                exercise={exercise}
                onSelect={() => onSelectExercise(exercise)}
                isCompound={true}
                isMobile={isMobile}
              />
            ))}
          </>
        )}
        
        {/* Isolation Section */}
        {isolation.length > 0 && (
          <>
            <SectionHeader
              icon={Activity}
              title="Isolatie Bewegingen"
              count={isolation.length}
              color="#f97316"
              isMobile={isMobile}
              marginTop={recommended.length > 0 || compound.length > 0}
            />
            {isolation.map((exercise, index) => (
              <ExerciseCard
                key={`iso-${exercise.id || exercise.name}-${index}`}
                exercise={exercise}
                onSelect={() => onSelectExercise(exercise)}
                isCompound={false}
                isMobile={isMobile}
              />
            ))}
          </>
        )}
      </div>
      
      {/* Hide scrollbar */}
      <style>{`
        *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

// Section Header Component
function SectionHeader({ icon: Icon, title, count, color, isMobile, marginTop }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      padding: isMobile ? '0.75rem 0 0.5rem' : '1rem 0 0.625rem',
      marginTop: marginTop ? (isMobile ? '1rem' : '1.5rem') : '0.5rem'
    }}>
      {/* Icon container */}
      <div style={{
        width: isMobile ? '28px' : '32px',
        height: isMobile ? '28px' : '32px',
        borderRadius: '8px',
        background: `${color}20`,
        border: `1px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 12px ${color}30`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        <Icon 
          size={isMobile ? 14 : 16} 
          color={color} 
          strokeWidth={2.5}
          style={{
            filter: `drop-shadow(0 0 4px ${color}60)`
          }}
        />
      </div>
      
      {/* Title */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <h4 style={{
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: 0
        }}>
          {title}
        </h4>
        
        {/* Count badge */}
        <div style={{
          padding: isMobile ? '0.2rem 0.5rem' : '0.25rem 0.625rem',
          background: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: '8px',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: color,
          fontWeight: '800'
        }}>
          {count}
        </div>
      </div>
      
      {/* Divider line */}
      <div style={{
        flex: 1,
        height: '1px',
        background: `linear-gradient(90deg, ${color}20 0%, transparent 100%)`
      }} />
    </div>
  )
}
