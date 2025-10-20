// src/modules/workout/components/todays-workout/components/ExerciseHistory.jsx
import { History, TrendingUp } from 'lucide-react'

export default function ExerciseHistory({ exerciseName, previousLog, loading }) {
  const isMobile = window.innerWidth <= 768
  
  // Format date to relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Vandaag'
    if (diffDays === 1) return 'Gisteren'
    if (diffDays < 7) return `${diffDays} dagen geleden`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`
    return `${Math.floor(diffDays / 30)} maanden geleden`
  }
  
  // Format sets data
  const formatSets = (sets) => {
    if (!sets || !Array.isArray(sets)) return 'Geen data'
    
    // Take first 3 sets only
    const displaySets = sets.slice(0, 3)
    
    return displaySets
      .map(set => {
        const weight = set.weight || set.gewicht || 0
        const reps = set.reps || set.herhalingen || 0
        return `${weight}kg × ${reps}`
      })
      .join(', ')
  }
  
  // Check if there's improvement (simple check: more weight or reps)
  const hasImprovement = (sets) => {
    if (!sets || sets.length < 2) return false
    
    const lastSet = sets[sets.length - 1]
    const firstSet = sets[0]
    
    const lastWeight = lastSet.weight || lastSet.gewicht || 0
    const firstWeight = firstSet.weight || firstSet.gewicht || 0
    
    return lastWeight > firstWeight
  }
  
  if (loading) {
    return (
      <div style={{
        background: 'rgba(249, 115, 22, 0.05)',
        border: '1px solid rgba(249, 115, 22, 0.15)',
        borderRadius: '0',
        padding: isMobile ? '0.75rem' : '0.875rem',
        marginBottom: '0.75rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(249, 115, 22, 0.2)',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(249, 115, 22, 0.6)',
            fontWeight: '600'
          }}>
            Vorige log laden...
          </span>
        </div>
      </div>
    )
  }
  
  if (!previousLog) {
    return (
      <div style={{
        background: 'rgba(249, 115, 22, 0.03)',
        border: '1px solid rgba(249, 115, 22, 0.1)',
        borderRadius: '0',
        padding: isMobile ? '0.6rem' : '0.75rem',
        marginBottom: '0.75rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <History 
            size={isMobile ? 14 : 16} 
            color="rgba(249, 115, 22, 0.4)"
          />
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontWeight: '600',
            fontStyle: 'italic'
          }}>
            Nog geen eerdere logs
          </span>
        </div>
      </div>
    )
  }
  
  const improved = hasImprovement(previousLog.sets)
  
  return (
    <div style={{
      background: 'rgba(249, 115, 22, 0.05)',
      border: '1px solid rgba(249, 115, 22, 0.15)',
      borderRadius: '0',
      padding: isMobile ? '0.75rem' : '0.875rem',
      marginBottom: '0.75rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Improvement indicator */}
      {improved && (
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem'
        }}>
          <TrendingUp 
            size={isMobile ? 14 : 16} 
            color="#f97316"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.4))'
            }}
          />
        </div>
      )}
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        marginBottom: '0.4rem'
      }}>
        <History 
          size={isMobile ? 14 : 16} 
          color="#f97316"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.3))'
          }}
        />
        <span style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(249, 115, 22, 0.8)',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          VORIGE LOG
        </span>
      </div>
      
      {/* Sets data */}
      <div style={{
        fontSize: isMobile ? '0.85rem' : '0.95rem',
        color: '#fff',
        fontWeight: '700',
        fontFamily: 'monospace',
        marginBottom: '0.3rem',
        lineHeight: 1.4
      }}>
        {formatSets(previousLog.sets)}
      </div>
      
      {/* Date */}
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600'
      }}>
        {getRelativeTime(previousLog.created_at)}
      </div>
      
      {/* Improvement badge */}
      {improved && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: '#f97316',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          <div style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#f97316',
            boxShadow: '0 0 6px rgba(249, 115, 22, 0.6)'
          }} />
          Progressie gemaakt!
        </div>
      )}
      
      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
