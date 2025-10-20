// src/client/components/ChallengeHomeBanner.jsx
import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Activity, 
  Utensils, 
  Weight, 
  Camera, 
  Phone,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react'

export default function ChallengeHomeBanner({ db, client }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [loading, setLoading] = useState(true)
  const [challengeData, setChallengeData] = useState(null)
  const [requirements, setRequirements] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [goalData, setGoalData] = useState(null)
  
  // Theme based on eligibility
  const isEligible = requirements?.allMet || false
  
  const THEME = {
    primary: isEligible ? '#10b981' : '#dc2626',
    gradient: isEligible 
      ? 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)'
      : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
    background: isEligible
      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.9) 100%)'
      : 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.85) 100%)',
    border: isEligible
      ? 'rgba(16, 185, 129, 0.3)'
      : 'rgba(220, 38, 38, 0.3)',
    shadow: isEligible
      ? '0 25px 50px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      : '0 25px 50px rgba(220, 38, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
  }
  
  // Load data on mount
  useEffect(() => {
    if (client?.id) {
      loadChallengeData()
    }
  }, [client?.id])
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (client?.id && !loading) {
        loadChallengeData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [client?.id, loading])
  
  async function loadChallengeData() {
    try {
      // Check for active challenge
      const { data: challenge, error } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .single()
      
      if (error) {
        console.log('No challenge access:', error)
        setLoading(false)
        return
      }
      
      if (challenge) {
        setChallengeData(challenge)
        
        // Load personal goal from challenge_assignment_goals
        const { data: goal } = await db.supabase
          .from('challenge_assignment_goals')
          .select('*')
          .eq('assignment_id', challenge.id)
          .eq('is_primary', true)
          .single()
        
        if (goal) {
          // Sync latest weight if weight goal
          if (goal.goal_type === 'weight' && goal.auto_track) {
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
          
          // Calculate progress
          const progress = db.calculateGoalProgress(
            goal.starting_value,
            goal.current_value,
            goal.target_value
          )
          
          setGoalData({
            ...goal,
            progress: progress,
            remaining: Math.abs(goal.target_value),
            achieved: progress.percentage >= 100
          })
        }
      } else {
        setLoading(false)
        return
      }
      
      // Calculate dates
      const startDate = challenge?.start_date 
        ? new Date(challenge.start_date)
        : new Date(Date.now() - (56 * 24 * 60 * 60 * 1000))
      
      const endDate = challenge?.end_date
        ? new Date(challenge.end_date)
        : new Date()
      
      const currentDay = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
      
      // Load all requirements
      const [workouts, meals, weights, photos, calls] = await Promise.all([
        loadWorkouts(client.id, startDate, endDate),
        loadMeals(client.id, startDate, endDate),
        loadWeights(client.id, startDate, endDate),
        loadPhotos(client.id, startDate, endDate),
        loadCalls(client.id, startDate, endDate)
      ])
      
      const requirementsData = {
        workouts,
        meals,
        weights,
        photos,
        calls,
        currentDay: Math.min(currentDay, 56),
        daysRemaining: Math.max(0, daysRemaining),
        allMet: workouts.met && meals.met && weights.met && photos.met && calls.met,
        completedCount: [workouts.met, meals.met, weights.met, photos.met, calls.met].filter(Boolean).length
      }
      
      setRequirements(requirementsData)
      
    } catch (error) {
      console.error('Error loading challenge data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Data loading functions
  async function loadWorkouts(clientId, startDate, endDate) {
    try {
      const { data } = await db.supabase
        .from('workout_completions')
        .select('workout_date, completed')
        .eq('client_id', clientId)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .lte('workout_date', endDate.toISOString().split('T')[0])
        .eq('completed', true)
      
      const count = data?.length || 0
      return {
        current: count,
        required: 24,
        met: count >= 24,
        percentage: Math.min(100, Math.round((count / 24) * 100))
      }
    } catch (error) {
      return { current: 0, required: 24, met: false, percentage: 0 }
    }
  }
  
  async function loadMeals(clientId, startDate, endDate) {
    try {
      const { data } = await db.supabase
        .from('ai_meal_progress')
        .select('date, meals_consumed, manual_intake, completion_percentage')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      const trackedDays = data?.filter(day => 
        day.meals_consumed > 0 || 
        day.manual_intake !== null || 
        day.completion_percentage > 0
      ) || []
      
      const uniqueDays = [...new Set(trackedDays.map(m => m.date))]
      const count = uniqueDays.length
      
      return {
        current: count,
        required: 45,
        met: count >= 45,
        percentage: Math.min(100, Math.round((count / 45) * 100))
      }
    } catch (error) {
      return { current: 0, required: 45, met: false, percentage: 0 }
    }
  }
  
  async function loadWeights(clientId, startDate, endDate) {
    try {
      const { data } = await db.supabase
        .from('weight_challenge_logs')
        .select('date, weight, is_friday_weighin')
        .eq('client_id', clientId)
        .eq('is_friday_weighin', true)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      const count = data?.length || 0
      
      return {
        current: count,
        required: 8,
        met: count >= 8,
        percentage: Math.min(100, Math.round((count / 8) * 100))
      }
    } catch (error) {
      return { current: 0, required: 8, met: false, percentage: 0 }
    }
  }
  
  async function loadPhotos(clientId, startDate, endDate) {
    try {
      const { data } = await db.supabase
        .from('progress_photos')
        .select('date, photo_type')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      const fridayPhotos = {}
      
      data?.forEach(photo => {
        const day = new Date(photo.date).getDay()
        if (day === 5) {
          if (!fridayPhotos[photo.date]) {
            fridayPhotos[photo.date] = new Set()
          }
          fridayPhotos[photo.date].add(photo.photo_type)
        }
      })
      
      const completeSets = Object.entries(fridayPhotos).filter(([date, types]) => 
        types.has('front') && types.has('side')
      )
      
      const count = completeSets.length
      
      return {
        current: count,
        required: 8,
        met: count >= 8,
        percentage: Math.min(100, Math.round((count / 8) * 100))
      }
    } catch (error) {
      return { current: 0, required: 8, met: false, percentage: 0 }
    }
  }
  
  async function loadCalls(clientId, startDate, endDate) {
    try {
      const { data } = await db.supabase
        .from('client_calls')
        .select('call_number, status, scheduled_date')
        .eq('client_id', clientId)
        .gte('scheduled_date', startDate.toISOString())
        .lte('scheduled_date', endDate.toISOString())
        .eq('status', 'completed')
      
      const count = data?.length || 0
      
      return {
        current: count,
        required: 8,
        met: count >= 8,
        percentage: Math.min(100, Math.round((count / 8) * 100))
      }
    } catch (error) {
      return { current: 0, required: 8, met: false, percentage: 0 }
    }
  }
  
  // Helper functions for goal display
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
  
  // Don't render while loading or if no data
  if (loading || !requirements) {
    return null
  }
  
  const hasAnyData = 
    requirements.workouts.current > 0 ||
    requirements.meals.current > 0 ||
    requirements.weights.current > 0 ||
    requirements.photos.current > 0 ||
    requirements.calls.current > 0
  
  if (!challengeData && !hasAnyData) {
    return null
  }
  
  // Requirement configurations
  const requirementCards = [
    { id: 'workouts', icon: Activity, label: 'Workouts', data: requirements.workouts, unit: 'sessions' },
    { id: 'meals', icon: Utensils, label: 'Meal Days', data: requirements.meals, unit: 'dagen' },
    { id: 'weights', icon: Weight, label: 'Weigh-ins', data: requirements.weights, unit: 'vrijdagen' },
    { id: 'photos', icon: Camera, label: 'Photos', data: requirements.photos, unit: 'vrijdag sets' },
    { id: 'calls', icon: Phone, label: 'Calls', data: requirements.calls, unit: 'calls' }
  ]
  
  return (
    <div style={{
      background: THEME.background,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      padding: isMobile ? '1.5rem' : '2rem',
      borderRadius: isMobile ? '16px' : '20px',
      marginBottom: isMobile ? '1.25rem' : '1.5rem',
      border: `1px solid ${THEME.border}`,
      boxShadow: THEME.shadow,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
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
        background: `radial-gradient(circle at top right, ${isEligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.15)'} 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: isMobile ? '1.25rem' : '1.5rem'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
              color: '#fff',
              lineHeight: 1
            }}>
              8-Week Challenge
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '500',
              letterSpacing: '0.01em'
            }}>
              {isEligible 
                ? '✨ Money Back Eligible!'
                : `${requirements.completedCount}/5 requirements voltooid`}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.5rem' : '0.75rem'
          }}>
            {challengeData && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  marginBottom: '0.25rem'
                }}>
                  Dag
                </div>
                <div style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '700',
                  color: '#fff',
                  lineHeight: 1
                }}>
                  {requirements.currentDay}/56
                </div>
              </div>
            )}
            
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                width: isMobile ? '44px' : '48px',
                height: isMobile ? '44px' : '48px',
                background: 'rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: isMobile ? '10px' : '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.95)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              {expanded ? (
                <ChevronUp size={isMobile ? 20 : 22} color="rgba(255,255,255,0.7)" />
              ) : (
                <ChevronDown size={isMobile ? 20 : 22} color="rgba(255,255,255,0.7)" />
              )}
            </button>
          </div>
        </div>
        
        {/* Personal Goal Progress */}
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
            
            {/* Goal stats grid - 4 columns */}
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
        
        {/* Quick Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: isMobile ? '0.5rem' : '0.75rem',
          marginBottom: expanded ? (isMobile ? '1.25rem' : '1.5rem') : 0
        }}>
          {requirementCards.map(req => (
            <div 
              key={req.id}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '0.75rem 0.5rem' : '1rem 0.75rem',
                backdropFilter: 'blur(8px)',
                border: req.data.met 
                  ? '1px solid rgba(16, 185, 129, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default',
                minHeight: '44px',
                touchAction: 'manipulation'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                  e.currentTarget.style.borderColor = req.data.met 
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.borderColor = req.data.met 
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              {req.data.met ? (
                <CheckCircle size={isMobile ? 16 : 18} color="#10b981" style={{ marginBottom: '0.375rem' }} />
              ) : (
                <req.icon size={isMobile ? 16 : 18} color="rgba(255,255,255,0.5)" style={{ marginBottom: '0.375rem' }} />
              )}
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '700',
                color: req.data.met ? '#10b981' : '#fff',
                marginBottom: '0.25rem',
                lineHeight: 1
              }}>
                {req.data.current}/{req.data.required}
              </div>
              <div style={{
                height: '3px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${req.data.percentage}%`,
                  background: req.data.met 
                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                    : 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
            </div>
          ))}
        </div>
        
        {/* Expanded Details */}
        {expanded && (
          <div style={{
            animation: 'slideDown 0.3s ease'
          }}>
            {/* Money Back Progress */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: isMobile ? '12px' : '14px',
              padding: isMobile ? '1rem' : '1.25rem',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              marginBottom: isMobile ? '1rem' : '1.25rem'
            }}>
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
                  <Trophy size={isMobile ? 14 : 16} color="rgba(255,255,255,0.5)" />
                  <span style={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '600'
                  }}>
                    Money Back Voortgang
                  </span>
                </div>
                <span style={{ 
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '700',
                  color: '#fff'
                }}>
                  {requirements.completedCount}/5
                </span>
              </div>
              
              <div style={{
                height: '8px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '0.75rem',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(requirements.completedCount / 5) * 100}%`,
                  background: isEligible 
                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #10b981 100%)'
                    : 'linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
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
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  fontSize: isMobile ? '0.75rem' : '0.8rem'
                }}>
                  {requirements.daysRemaining} dagen resterend
                </span>
                {isEligible && (
                  <span style={{ 
                    color: '#10b981', 
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}>
                    <CheckCircle size={14} strokeWidth={2.5} />
                    Unlocked!
                  </span>
                )}
              </div>
            </div>
            
            {/* Detailed Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              {requirementCards.map(req => (
                <div key={req.id} style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: isMobile ? '12px' : '14px',
                  padding: isMobile ? '1rem' : '1.25rem',
                  backdropFilter: 'blur(8px)',
                  border: req.data.met 
                    ? '1px solid rgba(16, 185, 129, 0.15)'
                    : '1px solid rgba(255, 255, 255, 0.05)'
                }}>
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
                      <req.icon size={isMobile ? 18 : 20} color={req.data.met ? '#10b981' : 'rgba(255,255,255,0.5)'} />
                      <span style={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '600',
                        color: 'rgba(255,255,255,0.9)'
                      }}>
                        {req.label}
                      </span>
                    </div>
                    {req.data.met && (
                      <CheckCircle size={16} color="#10b981" strokeWidth={2.5} />
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '1.75rem',
                    fontWeight: '700',
                    color: req.data.met ? '#10b981' : '#fff',
                    marginBottom: '0.25rem',
                    lineHeight: 1
                  }}>
                    {req.data.current}/{req.data.required}
                    <span style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      fontWeight: '500',
                      marginLeft: '0.5rem',
                      color: 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {req.unit}
                    </span>
                  </div>
                  
                  <div style={{
                    height: '6px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${req.data.percentage}%`,
                      background: req.data.met 
                        ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                        : 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Time warning */}
            {challengeData && requirements.daysRemaining <= 14 && requirements.daysRemaining > 0 && (
              <div style={{
                background: 'rgba(249, 115, 22, 0.15)',
                borderRadius: isMobile ? '12px' : '14px',
                padding: isMobile ? '1rem' : '1.25rem',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                marginTop: isMobile ? '1rem' : '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Clock size={isMobile ? 18 : 20} color="#f97316" />
                <div>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    color: '#f97316'
                  }}>
                    Laatste {requirements.daysRemaining} dagen!
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    Focus op de requirements die nog niet voltooid zijn
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}
