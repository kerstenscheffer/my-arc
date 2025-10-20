// src/client/components/ChallengeGoalBanner.jsx
import { useState, useEffect } from 'react'
import { Target, TrendingDown, TrendingUp, Calendar, Zap } from 'lucide-react'

export default function ChallengeGoalBanner({ db, client }) {
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(true)
  const [goalData, setGoalData] = useState(null)
  
  useEffect(() => {
    if (client?.id) {
      loadGoalData()
    }
  }, [client?.id])
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (client?.id && !loading) {
        loadGoalData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [client?.id, loading])
  
  async function loadGoalData() {
    try {
      // 1. Get active challenge
      const { data: challenge } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .single()
      
      if (!challenge) {
        setLoading(false)
        return
      }
      
      // 2. Get primary goal
      const { data: goal } = await db.supabase
        .from('challenge_assignment_goals')
        .select('*')
        .eq('assignment_id', challenge.id)
        .eq('is_primary', true)
        .single()
      
      if (!goal) {
        setLoading(false)
        return
      }
      
      // 3. Auto-sync current value if auto_track enabled
      if (goal.auto_track && goal.goal_type === 'weight') {
        const { data: latestWeight } = await db.supabase
          .from('weight_challenge_logs')
          .select('weight, date')
          .eq('client_id', client.id)
          .order('date', { ascending: false })
          .limit(1)
          .single()
        
        if (latestWeight?.weight && latestWeight.weight !== goal.current_value) {
          // Update goal with latest weight
          await db.supabase
            .from('challenge_assignment_goals')
            .update({ 
              current_value: latestWeight.weight,
              updated_at: new Date().toISOString()
            })
            .eq('id', goal.id)
          
          goal.current_value = latestWeight.weight
        }
      }
      
      // 4. Calculate progress
      const progress = db.calculateGoalProgress(
        goal.starting_value,
        goal.current_value,
        goal.target_value
      )
      
      setGoalData({
        ...goal,
        progress: progress,
        remaining: Math.abs(goal.target_value - progress.change),
        achieved: progress.percentage >= 100
      })
      
    } catch (error) {
      console.error('Error loading goal data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Helper functions
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
  
  // Don't render if loading or no goal
  if (loading || !goalData) {
    return null
  }
  
  const GoalIcon = getGoalIcon(goalData.goal_type)
  const progressColor = goalData.progress?.percentage >= 75 ? '#10b981' : '#f59e0b'
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      padding: isMobile ? '1.25rem' : '1.5rem',
      borderRadius: isMobile ? '16px' : '20px',
      marginBottom: isMobile ? '1.25rem' : '1.5rem',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      boxShadow: '0 20px 40px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      position: 'relative',
      overflow: 'hidden',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}>
      
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50%',
        height: '100%',
        background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem'
          }}>
            <div style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <GoalIcon size={isMobile ? 18 : 20} color="#10b981" />
            </div>
            
            <div>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.15rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0,
                lineHeight: 1
              }}>
                {goalData.goal_name}
              </h3>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
                marginTop: '0.25rem'
              }}>
                Challenge Goal
              </p>
            </div>
          </div>
          
          {/* Deadline badge */}
          {goalData.deadline && (() => {
            const deadline = new Date(goalData.deadline)
            const today = new Date()
            const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
            
            if (daysRemaining > 0) {
              return (
                <div style={{
                  padding: isMobile ? '0.4rem 0.7rem' : '0.5rem 0.875rem',
                  background: daysRemaining > 14 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : daysRemaining > 7 
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${
                    daysRemaining > 14 
                      ? 'rgba(16, 185, 129, 0.4)' 
                      : daysRemaining > 7 
                        ? 'rgba(245, 158, 11, 0.4)' 
                        : 'rgba(239, 68, 68, 0.4)'
                  }`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Calendar size={isMobile ? 14 : 16} color={
                    daysRemaining > 14 ? '#10b981' : daysRemaining > 7 ? '#f59e0b' : '#ef4444'
                  } />
                  <span style={{
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
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
        
        {/* Progress percentage - Big & Bold */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{
            fontSize: isMobile ? '2.5rem' : '3rem',
            fontWeight: '900',
            color: progressColor,
            lineHeight: 1,
            letterSpacing: '-0.02em'
          }}>
            {goalData.progress?.percentage || 0}%
          </div>
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '0.375rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            Behaald
          </div>
        </div>
        
        {/* Stats Grid - 4 columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: isMobile ? '0.625rem' : '0.875rem',
          marginBottom: '1rem'
        }}>
          {/* Start */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: isMobile ? '0.75rem' : '0.875rem',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.375rem'
            }}>
              Start
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.9)'
            }}>
              {formatGoalValue(goalData.starting_value, goalData.measurement_unit)}
            </div>
          </div>
          
          {/* Current */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            borderRadius: '10px',
            padding: isMobile ? '0.75rem' : '0.875rem',
            textAlign: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.375rem',
              fontWeight: '700'
            }}>
              Nu
            </div>
            <div style={{
              fontSize: isMobile ? '1.15rem' : '1.25rem',
              fontWeight: '900',
              color: '#10b981'
            }}>
              {formatGoalValue(goalData.current_value, goalData.measurement_unit)}
            </div>
          </div>
          
          {/* To Go */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: isMobile ? '0.75rem' : '0.875rem',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.375rem'
            }}>
              Te Gaan
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.9)'
            }}>
              {formatGoalValue(goalData.remaining, goalData.measurement_unit)}
            </div>
          </div>
          
          {/* Target */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: isMobile ? '0.75rem' : '0.875rem',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.375rem'
            }}>
              Doel
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.9)'
            }}>
              {formatGoalChange(goalData.target_value, goalData.measurement_unit)}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div style={{
          height: '8px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: goalData.motivation ? '1rem' : '0'
        }}>
          <div style={{
            height: '100%',
            width: `${goalData.progress?.percentage || 0}%`,
            background: `linear-gradient(90deg, ${progressColor} 0%, ${progressColor}dd 50%, ${progressColor} 100%)`,
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
            background: 'rgba(16, 185, 129, 0.1)',
            borderLeft: '3px solid #10b981',
            borderRadius: '10px',
            padding: isMobile ? '0.875rem' : '1rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start'
          }}>
            <TrendingUp size={isMobile ? 18 : 20} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'rgba(16, 185, 129, 0.8)',
                marginBottom: '0.375rem',
                fontWeight: '600'
              }}>
                Van je coach
              </div>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: 'rgba(255, 255, 255, 0.95)',
                margin: 0,
                lineHeight: 1.5,
                fontStyle: 'italic'
              }}>
                "{goalData.motivation}"
              </p>
            </div>
          </div>
        )}
        
        {/* Achievement celebration */}
        {goalData.progress?.change > 0 && !goalData.motivation && (
          <div style={{
            textAlign: 'center',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: '#10b981',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <Zap size={isMobile ? 16 : 18} />
            {formatGoalChange(goalData.progress.change, goalData.measurement_unit)} bereikt!
          </div>
        )}
      </div>
      
      {/* CSS */}
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}
