// Personal Goal Progress Section for ChallengeHomeBanner
// This replaces the existing goal section (lines ~392-525)

import { Target, TrendingUp, TrendingDown, Calendar } from 'lucide-react'

// Helper function - add to component if not exists
const getGoalIcon = (goalType) => {
  switch (goalType) {
    case 'weight': return TrendingDown
    case 'waist': return Target
    case 'body_fat': return TrendingDown
    default: return Target
  }
}

const formatGoalValue = (value, unit) => {
  if (!value && value !== 0) return '-'
  return `${value}${unit || ''}`
}

const formatGoalChange = (change, unit) => {
  if (!change && change !== 0) return '0'
  const sign = change > 0 ? '-' : '+'
  return `${sign}${Math.abs(change).toFixed(1)}${unit || ''}`
}

// JSX Section - Replace lines ~392-525 in ChallengeHomeBanner.jsx
{goalData && (
  <div style={{
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: isMobile ? '12px' : '14px',
    padding: isMobile ? '1rem' : '1.25rem',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${goalData.progress?.percentage >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)'}`,
    marginBottom: isMobile ? '1rem' : '1.25rem'
  }}>
    {/* Header with icon and deadline */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.75rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {(() => {
          const GoalIcon = getGoalIcon(goalData.goal_type)
          return <GoalIcon size={isMobile ? 16 : 18} color="#10b981" />
        })()}
        <span style={{ 
          color: 'rgba(255,255,255,0.9)', 
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600'
        }}>
          {goalData.goal_name}
        </span>
      </div>
      
      {/* Deadline countdown badge */}
      {goalData.deadline && (() => {
        const deadline = new Date(goalData.deadline)
        const today = new Date()
        const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
        
        if (daysRemaining > 0) {
          return (
            <div style={{
              padding: isMobile ? '0.35rem 0.6rem' : '0.4rem 0.75rem',
              background: daysRemaining > 14 
                ? 'rgba(16, 185, 129, 0.15)' 
                : daysRemaining > 7 
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${
                daysRemaining > 14 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : daysRemaining > 7 
                    ? 'rgba(245, 158, 11, 0.3)' 
                    : 'rgba(239, 68, 68, 0.3)'
              }`,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <Calendar size={isMobile ? 12 : 14} color={
                daysRemaining > 14 ? '#10b981' : daysRemaining > 7 ? '#f59e0b' : '#ef4444'
              } />
              <span style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '700',
                color: daysRemaining > 14 ? '#10b981' : daysRemaining > 7 ? '#f59e0b' : '#ef4444'
              }}>
                {daysRemaining}d
              </span>
            </div>
          )
        }
        return null
      })()}
    </div>
    
    {/* Progress percentage */}
    <div style={{
      textAlign: 'right',
      marginBottom: '0.75rem'
    }}>
      <span style={{ 
        fontSize: isMobile ? '1.5rem' : '1.75rem',
        fontWeight: '800',
        color: '#10b981',
        lineHeight: 1
      }}>
        {goalData.progress?.percentage || 0}%
      </span>
    </div>
    
    {/* Goal stats grid - 4 columns now */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: isMobile ? '0.5rem' : '0.75rem',
      marginBottom: '0.75rem'
    }}>
      {/* Start */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.25rem'
        }}>
          Start
        </div>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: '700',
          color: 'rgba(255,255,255,0.8)'
        }}>
          {formatGoalValue(goalData.starting_value, goalData.measurement_unit)}
        </div>
      </div>
      
      {/* Current */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          color: '#10b981',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.25rem',
          fontWeight: '600'
        }}>
          Nu
        </div>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.15rem',
          fontWeight: '800',
          color: '#10b981'
        }}>
          {formatGoalValue(goalData.current_value, goalData.measurement_unit)}
        </div>
      </div>
      
      {/* To Go */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.25rem'
        }}>
          Te Gaan
        </div>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: '700',
          color: 'rgba(255,255,255,0.8)'
        }}>
          {formatGoalValue(
            Math.abs(goalData.target_value - (goalData.progress?.change || 0)),
            goalData.measurement_unit
          )}
        </div>
      </div>
      
      {/* Target */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.25rem'
        }}>
          Doel
        </div>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: '700',
          color: 'rgba(255,255,255,0.8)'
        }}>
          {formatGoalChange(goalData.target_value, goalData.measurement_unit)}
        </div>
      </div>
    </div>
    
    {/* Progress bar */}
    <div style={{
      height: '6px',
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
      marginBottom: goalData.motivation ? '0.75rem' : '0'
    }}>
      <div style={{
        height: '100%',
        width: `${goalData.progress?.percentage || 0}%`,
        background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%)',
        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
          animation: 'shine 2s infinite'
        }} />
      </div>
    </div>
    
    {/* Coach Motivation Message */}
    {goalData.motivation && (
      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        borderLeft: '3px solid #10b981',
        borderRadius: '8px',
        padding: isMobile ? '0.75rem' : '1rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
      }}>
        <TrendingUp size={isMobile ? 16 : 18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'rgba(16, 185, 129, 0.8)',
            marginBottom: '0.25rem',
            fontWeight: '600'
          }}>
            Van je coach
          </div>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0,
            lineHeight: 1.4,
            fontStyle: 'italic'
          }}>
            "{goalData.motivation}"
          </p>
        </div>
      </div>
    )}
    
    {/* Progress achievement text */}
    {goalData.progress?.change > 0 && !goalData.motivation && (
      <div style={{
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        color: '#10b981',
        marginTop: '0.5rem',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {formatGoalChange(goalData.progress.change, goalData.measurement_unit)} bereikt! 💪
      </div>
    )}
  </div>
)}
