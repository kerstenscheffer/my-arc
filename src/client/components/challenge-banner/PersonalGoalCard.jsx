// src/client/components/challenge-banner/PersonalGoalCard.jsx
import { TrendingDown, TrendingUp, Target, Calendar } from 'lucide-react'

export default function PersonalGoalCard({ isMobile, goalData, theme }) {
  
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
  
  const GoalIcon = getGoalIcon(goalData.goal_type)
  
  // Calculate deadline status
  let deadlineColor = theme.primary
  let daysRemaining = 0
  
  if (goalData.deadline) {
    const deadline = new Date(goalData.deadline)
    const today = new Date()
    daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining <= 7) {
      deadlineColor = '#ef4444'
    } else if (daysRemaining <= 14) {
      deadlineColor = '#f59e0b'
    } else {
      deadlineColor = theme.primary
    }
  }
  
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.5)',
      borderRadius: isMobile ? '12px' : '14px',
      padding: isMobile ? '1rem' : '1.25rem',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${goalData.progress?.percentage >= 75 ? theme.border : 'rgba(255, 255, 255, 0.05)'}`,
      marginBottom: isMobile ? '1rem' : '1.25rem',
      boxShadow: goalData.progress?.percentage >= 75 ? `0 8px 25px ${theme.primary}15` : 'none'
    }}>
      {/* Header */}
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
          <GoalIcon size={isMobile ? 16 : 18} color={theme.primary} />
          <span style={{ 
            color: 'rgba(255, 215, 0, 0.9)', 
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '700',
            filter: `drop-shadow(0 0 8px ${theme.primary}30)`
          }}>
            {goalData.goal_name}
          </span>
        </div>
        
        {/* Deadline Badge */}
        {daysRemaining > 0 && (
          <div style={{
            padding: isMobile ? '0.35rem 0.6rem' : '0.4rem 0.75rem',
            background: `${deadlineColor}20`,
            border: `1px solid ${deadlineColor}40`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <Calendar size={isMobile ? 12 : 14} color={deadlineColor} />
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '700',
              color: deadlineColor
            }}>
              {daysRemaining}d
            </span>
          </div>
        )}
      </div>
      
      {/* Progress Percentage */}
      <div style={{
        textAlign: 'right',
        marginBottom: '0.75rem'
      }}>
        <span style={{ 
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          fontWeight: '800',
          background: theme.gradient,
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          filter: `drop-shadow(0 0 15px ${theme.primary}30)`
        }}>
          {goalData.progress?.percentage || 0}%
        </span>
      </div>
      
      {/* 4-Column Stats Grid */}
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
            color: 'rgba(255, 215, 0, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem'
          }}>
            Start
          </div>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            {formatGoalValue(goalData.starting_value, goalData.measurement_unit)}
          </div>
        </div>
        
        {/* Current */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: theme.primary,
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
            color: theme.primary,
            filter: `drop-shadow(0 0 10px ${theme.primary}30)`
          }}>
            {formatGoalValue(goalData.current_value, goalData.measurement_unit)}
          </div>
        </div>
        
        {/* To Go */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 215, 0, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem'
          }}>
            Te Gaan
          </div>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.8)'
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
            color: 'rgba(255, 215, 0, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem'
          }}>
            Doel
          </div>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            {formatGoalChange(goalData.target_value, goalData.measurement_unit)}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div style={{
        height: '6px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: goalData.motivation ? '0.75rem' : '0'
      }}>
        <div style={{
          height: '100%',
          width: `${goalData.progress?.percentage || 0}%`,
          background: theme.gradient,
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
      
      {/* Coach Motivation */}
      {goalData.motivation && (
        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          borderLeft: `3px solid ${theme.primary}`,
          borderRadius: '8px',
          padding: isMobile ? '0.75rem' : '1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start'
        }}>
          <TrendingUp size={isMobile ? 16 : 18} color={theme.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: theme.secondary,
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
      
      {/* Achievement Text */}
      {goalData.progress?.change > 0 && !goalData.motivation && (
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: theme.primary,
          marginTop: '0.5rem',
          fontWeight: '600',
          textAlign: 'center',
          filter: `drop-shadow(0 0 8px ${theme.primary}30)`
        }}>
          {formatGoalChange(goalData.progress.change, goalData.measurement_unit)} bereikt! 💪
        </div>
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}
