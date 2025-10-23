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
  
  // Check eligibility (for display text only)
  const isEligible = requirements?.allMet || false
  
  // ✅ GOUD/ZWART LUXURY THEME - ALTIJD
  const THEME = {
    primary: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
    border: 'rgba(245, 158, 11, 0.2)',
    shadow: '0 25px 50px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
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
    console.log('🚀 LOADING CHALLENGE DATA for client:', client.id)
    
    try {
      // Check for active challenge
      const { data: challenge, error } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .maybeSingle()
      
      if (error || !challenge) {
        console.log('❌ No challenge access:', error)
        setLoading(false)
        return
      }
      
      console.log('✅ Challenge found:', {
        id: challenge.id,
        type: challenge.challenge_type,
        start: challenge.start_date,
        end: challenge.end_date
      })
      
      setChallengeData(challenge)
      
      // Load personal goal from challenge_assignment_goals
      console.log('🎯 Loading personal goal...')
      const { data: goal, error: goalError } = await db.supabase
        .from('challenge_assignment_goals')
        .select('*')
        .eq('assignment_id', challenge.id)
        .eq('is_primary', true)
        .maybeSingle()
      
      if (goalError) {
        console.error('❌ Goal loading error:', goalError)
      }
      
      if (goal) {
        console.log('🎯 GOAL DATA LOADED:', {
          id: goal.id,
          title: goal.title,
          type: goal.goal_type,
          starting: goal.starting_value,
          current: goal.current_value,
          target: goal.target_value,
          auto_track: goal.auto_track
        })
        
        // Sync latest weight if weight goal
        if (goal.goal_type === 'weight' && goal.auto_track) {
          console.log('⚖️ Checking for latest weight...')
          
          const { data: latestWeight } = await db.supabase
            .from('weight_challenge_logs')
            .select('weight, date')
            .eq('client_id', client.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          console.log('⚖️ Latest weight found:', latestWeight)
          
          if (latestWeight?.weight && latestWeight.weight !== goal.current_value) {
            console.log('⚖️ Updating goal with new weight:', {
              old: goal.current_value,
              new: latestWeight.weight,
              difference: latestWeight.weight - goal.current_value
            })
            
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
        
        const progress = calculateGoalProgress(
          goal.starting_value,
          goal.current_value,
          goal.target_value
        )
        
        console.log('📊 PROGRESS CALCULATED:', {
          start: goal.starting_value,
          current: goal.current_value,
          target: goal.target_value,
          change: progress.change,
          percentage: progress.percentage,
          isPositive: progress.isPositive
        })
        
        const remaining = Math.abs(goal.target_value - goal.current_value)
        const achieved = progress.percentage >= 100
        
        console.log('🎯 FINAL GOAL STATE:', {
          remaining: remaining,
          achieved: achieved,
          remainingFormatted: remaining.toFixed(1),
          targetFormatted: goal.target_value.toFixed(1),
          currentFormatted: goal.current_value.toFixed(1)
        })
        
        setGoalData({
          ...goal,
          progress: progress,
          remaining: remaining,
          achieved: achieved
        })
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
      console.error('❌ Error loading challenge data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  function calculateGoalProgress(startValue, currentValue, targetValue) {
    const change = startValue - currentValue
    const targetChange = Math.abs(targetValue)
    const percentage = Math.min(100, Math.max(0, (Math.abs(change) / targetChange) * 100))
    
    console.log('📐 CALCULATE GOAL PROGRESS:', {
      inputs: { startValue, currentValue, targetValue },
      change: change,
      targetChange: targetChange,
      percentage: percentage,
      formula: `(${Math.abs(change)} / ${targetChange}) * 100 = ${percentage}`
    })
    
    return {
      change: change,
      percentage: Math.round(percentage),
      isPositive: change > 0
    }
  }
  
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
        .from('challenge_progress_photos')
        .select('date, is_week_5_or_8_photo, verified')
        .eq('client_id', clientId)
        .eq('is_week_5_or_8_photo', true)
        .eq('verified', true)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      const count = data?.length || 0
      return {
        current: count,
        required: 2,
        met: count >= 2,
        percentage: Math.min(100, Math.round((count / 2) * 100))
      }
    } catch (error) {
      return { current: 0, required: 2, met: false, percentage: 0 }
    }
  }
  
  async function loadCalls(clientId, startDate, endDate) {
    try {
      const { data } = await db.supabase
        .from('challenge_call_completions')
        .select('call_date, completed, is_biweekly_call')
        .eq('client_id', clientId)
        .eq('completed', true)
        .eq('is_biweekly_call', true)
        .gte('call_date', startDate.toISOString().split('T')[0])
        .lte('call_date', endDate.toISOString().split('T')[0])
      
      const count = data?.length || 0
      return {
        current: count,
        required: 4,
        met: count >= 4,
        percentage: Math.min(100, Math.round((count / 4) * 100))
      }
    } catch (error) {
      return { current: 0, required: 4, met: false, percentage: 0 }
    }
  }
  
  // Requirements cards
  const requirementCards = requirements ? [
    {
      id: 'workouts',
      icon: Activity,
      label: 'Workouts',
      data: requirements.workouts,
      unit: 'workouts'
    },
    {
      id: 'meals',
      icon: Utensils,
      label: 'Meal Tracking',
      data: requirements.meals,
      unit: 'dagen'
    },
    {
      id: 'weights',
      icon: Weight,
      label: 'Weegmomenten',
      data: requirements.weights,
      unit: 'vrijdagen'
    },
    {
      id: 'photos',
      icon: Camera,
      label: 'Progress Fotos',
      data: requirements.photos,
      unit: 'fotos'
    },
    {
      id: 'calls',
      icon: Phone,
      label: 'Coach Calls',
      data: requirements.calls,
      unit: 'calls'
    }
  ] : []
  
  if (loading || !challengeData) {
    return null
  }
  
  return (
    <div style={{
      marginBottom: isMobile ? '0.875rem' : '1.5rem',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}>
      {/* Main Card - GOUD GRADIENT */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          background: THEME.background,
          borderRadius: isMobile ? '18px' : '20px',
          padding: isMobile ? '1.25rem' : '1.75rem',
          border: `1px solid ${THEME.border}`,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: expanded ? THEME.shadow : '0 15px 30px rgba(245, 158, 11, 0.1)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
          transform: 'translateZ(0)',
          minHeight: isMobile ? '60px' : '80px'
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        {/* Top gradient fade */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: goalData ? '1rem' : 0
        }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              background: THEME.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.125rem',
              letterSpacing: '-0.02em'
            }}>
              Money Back Challenge
            </h3>
            {challengeData?.challenge_type && (
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {challengeData.challenge_type === '8_week_transformation' && '8 Week Transformation'}
                {challengeData.challenge_type === '12_week_shred' && '12 Week Shred'}
                {challengeData.challenge_type === '6_week_kickstart' && '6 Week Kickstart'}
              </p>
            )}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {requirements && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                background: isEligible 
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%)'
                  : 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                border: `1px solid ${isEligible ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`
              }}>
                <Trophy size={isMobile ? 14 : 16} color={isEligible ? '#f59e0b' : 'rgba(255,255,255,0.5)'} strokeWidth={2.5} />
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '700',
                  color: isEligible ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {requirements.completedCount}/5
                </span>
              </div>
            )}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}>
              <ChevronDown size={isMobile ? 14 : 16} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        
        {/* Personal Goal Display */}
        {goalData && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '1rem' : '1.25rem',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.875rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Target size={isMobile ? 14 : 16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
                <span style={{ 
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  {goalData.title || 'Persoonlijk Doel'}
                </span>
              </div>
              {goalData.achieved && (
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '700',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <CheckCircle size={12} strokeWidth={3} />
                  BEREIKT!
                </span>
              )}
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              {/* Start */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  color: '#fff',
                  lineHeight: 1
                }}>
                  {goalData.starting_value.toFixed(1)}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Start
                </div>
              </div>
              
              {/* Progress Arrow */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {goalData.progress.isPositive ? (
                  <TrendingDown size={isMobile ? 24 : 28} color="#10b981" strokeWidth={2.5} />
                ) : (
                  <TrendingUp size={isMobile ? 24 : 28} color="#ef4444" strokeWidth={2.5} />
                )}
                <span style={{
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  fontWeight: '700',
                  color: goalData.progress.isPositive ? '#10b981' : '#ef4444'
                }}>
                  {Math.abs(goalData.progress.change).toFixed(1)} kg
                </span>
              </div>
              
              {/* Current/Target */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  color: goalData.achieved ? '#10b981' : '#f59e0b',
                  lineHeight: 1
                }}>
                  {goalData.current_value.toFixed(1)}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {goalData.achieved ? 'Bereikt' : 'Huidig'}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              marginTop: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  {goalData.progress.percentage}% voltooid
                </span>
                {!goalData.achieved && (
                  <span style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255,255,255,0.5)'
                  }}>
                    Nog {goalData.remaining.toFixed(1)} kg te gaan
                  </span>
                )}
              </div>
              
              <div style={{
                height: '8px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${goalData.progress.percentage}%`,
                  background: goalData.achieved
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {!goalData.achieved && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                      animation: 'shine 2s infinite'
                    }} />
                  )}
                </div>
                
                {/* Target marker */}
                <div style={{
                  position: 'absolute',
                  right: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '2px',
                  height: '12px',
                  background: 'rgba(255,255,255,0.3)'
                }} />
              </div>
            </div>
          </div>
        )}
        
        {/* Requirements Grid - Compact */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: isMobile ? '0.5rem' : '0.75rem'
        }}>
          {requirementCards.map(req => (
            <div key={req.id} style={{
              textAlign: 'center',
              padding: isMobile ? '0.75rem 0.5rem' : '1rem 0.625rem',
              background: req.data.met 
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
                : 'rgba(0, 0, 0, 0.3)',
              borderRadius: isMobile ? '10px' : '12px',
              border: `1px solid ${req.data.met ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <req.icon 
                size={isMobile ? 16 : 18} 
                color={req.data.met ? '#f59e0b' : 'rgba(255,255,255,0.5)'} 
                style={{ 
                  marginBottom: '0.375rem',
                  strokeWidth: 2 
                }} 
              />
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                fontWeight: '700',
                color: req.data.met ? '#f59e0b' : '#fff',
                lineHeight: 1
              }}>
                {req.data.current}
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: '500'
                }}>
                  /{req.data.required}
                </span>
              </div>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${req.data.percentage}%`,
                  background: req.data.met 
                    ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
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
                  background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)',
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
                    color: '#f59e0b', 
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
                    ? '1px solid rgba(245, 158, 11, 0.2)'
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
                      <req.icon size={isMobile ? 18 : 20} color={req.data.met ? '#f59e0b' : 'rgba(255,255,255,0.5)'} />
                      <span style={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '600',
                        color: 'rgba(255,255,255,0.9)'
                      }}>
                        {req.label}
                      </span>
                    </div>
                    {req.data.met && (
                      <CheckCircle size={16} color="#f59e0b" strokeWidth={2.5} />
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '1.75rem',
                    fontWeight: '700',
                    color: req.data.met ? '#f59e0b' : '#fff',
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
                        ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
            
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
