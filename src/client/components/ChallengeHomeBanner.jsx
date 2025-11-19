// src/client/components/ChallengeHomeBanner.jsx
// DEBUG VERSION - Extensive logging
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
  Calendar,
  Award
} from 'lucide-react'

export default function ChallengeHomeBanner({ db, client, isCoachView = false }) {
  const isMobile = window.innerWidth <= 768
  
  console.log('🎯 BANNER RENDER - Client ID:', client?.id)
  
  // State
  const [loading, setLoading] = useState(true)
  const [challengeData, setChallengeData] = useState(null)
  const [requirements, setRequirements] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [goalData, setGoalData] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  
  // Theme - GOUD ZWART
  const isEligible = requirements?.allMet || false
  
  const THEME = {
    primary: '#FFD700',
    secondary: '#D4AF37',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #FFD700 100%)',
    background: isEligible
      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%)'
      : 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(212, 175, 55, 0.05) 100%)',
    border: isEligible ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 215, 0, 0.2)',
    shadow: isEligible
      ? '0 25px 50px rgba(255, 215, 0, 0.3), 0 0 80px rgba(255, 215, 0, 0.15)'
      : '0 15px 40px rgba(255, 215, 0, 0.15)',
    progressBar: 'linear-gradient(90deg, #FFD700 0%, #D4AF37 100%)',
    textPrimary: '#FFD700',
    textSecondary: '#D4AF37',
    textMuted: 'rgba(212, 175, 55, 0.6)'
  }
  
  useEffect(() => {
    console.log('🔄 INITIAL USEEFFECT - Client ID:', client?.id)
    const timer = setTimeout(() => setIsVisible(true), 100)
    if (client?.id) {
      console.log('✅ Client ID exists, loading challenge data...')
      loadChallengeData()
    } else {
      console.log('❌ No client ID found!')
    }
    return () => clearTimeout(timer)
  }, [client?.id])
  
  useEffect(() => {
    console.log('⏰ POLLING INTERVAL SETUP')
    const interval = setInterval(() => {
      if (client?.id && !loading) {
        console.log('🔄 POLLING REFRESH - Loading challenge data...')
        loadChallengeData()
      }
    }, 30000)
    return () => {
      console.log('🛑 POLLING INTERVAL CLEARED')
      clearInterval(interval)
    }
  }, [client?.id, loading])
  
  async function loadChallengeData() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 LOAD CHALLENGE DATA START')
    console.log('Client ID:', client.id)
    console.log('Timestamp:', new Date().toISOString())
    
    try {
      console.log('📊 Query 1: Fetching challenge_assignments...')
      const { data: challenge, error } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .single()
      
      if (error) {
        console.error('❌ Challenge assignment error:', error)
        setLoading(false)
        return
      }
      
      console.log('✅ Challenge found:', challenge)
      console.log('  - ID:', challenge?.id)
      console.log('  - Start:', challenge?.start_date)
      console.log('  - End:', challenge?.end_date)
      console.log('  - Active:', challenge?.is_active)
      
      if (challenge) {
        setChallengeData(challenge)
        
        console.log('📊 Query 2: Fetching challenge_assignment_goals...')
        const { data: goal } = await db.supabase
          .from('challenge_assignment_goals')
          .select('*')
          .eq('assignment_id', challenge.id)
          .eq('is_primary', true)
          .single()
        
        console.log('✅ Goal data:', goal)
        
        if (goal) {
          console.log('  - Type:', goal.goal_type)
          console.log('  - Auto track:', goal.auto_track)
          console.log('  - Starting:', goal.starting_value)
          console.log('  - Current:', goal.current_value)
          console.log('  - Target:', goal.target_value)
          
          // ✅ FIXED: Auto-sync weight from weight_challenge_logs
          if (goal.goal_type === 'weight' && goal.auto_track) {
            console.log('🔍 Syncing weight from weight_challenge_logs...')
            const { data: latestWeight } = await db.supabase
              .from('weight_challenge_logs')
              .select('weight, date')
              .eq('client_id', client.id)
              .order('date', { ascending: false })
              .limit(1)
              .single()
            
            console.log('📊 Latest weight entry:', latestWeight)
            
            if (latestWeight?.weight && latestWeight.weight !== goal.current_value) {
              console.log('🔄 Updating goal current_value...')
              console.log('  - Old:', goal.current_value)
              console.log('  - New:', latestWeight.weight)
              
              await db.supabase
                .from('challenge_assignment_goals')
                .update({ 
                  current_value: latestWeight.weight,
                  updated_at: new Date().toISOString()
                })
                .eq('id', goal.id)
              
              goal.current_value = latestWeight.weight
              console.log('✅ Goal updated!')
            } else {
              console.log('ℹ️ Weight unchanged or no new entry')
            }
          }
          
          const progress = db.calculateGoalProgress(
            goal.starting_value,
            goal.current_value,
            goal.target_value
          )
          
          console.log('📈 Goal progress:', progress)
          
          setGoalData({
            ...goal,
            progress: progress,
            remaining: Math.abs(goal.target_value),
            achieved: progress.percentage >= 100
          })
        }
      } else {
        console.log('❌ No active challenge found')
        setLoading(false)
        return
      }
      
      const startDate = challenge?.start_date 
        ? new Date(challenge.start_date)
        : new Date(Date.now() - (56 * 24 * 60 * 60 * 1000))
      
      const endDate = challenge?.end_date
        ? new Date(challenge.end_date)
        : new Date()
      
      console.log('📅 Date range:')
      console.log('  - Start:', startDate.toISOString().split('T')[0])
      console.log('  - End:', endDate.toISOString().split('T')[0])
      
      const currentDay = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
      
      console.log('⏱️ Timeline:')
      console.log('  - Current day:', currentDay)
      console.log('  - Days remaining:', daysRemaining)
      
      console.log('🔄 Loading all requirements in parallel...')
      const [workouts, meals, weights, photos, calls] = await Promise.all([
        loadWorkouts(client.id, startDate, endDate),
        loadMeals(client.id, startDate, endDate),
        loadWeights(client.id, startDate, endDate, challenge.id),
        loadPhotos(client.id, startDate, endDate),
        loadCalls(client.id, startDate, endDate, challenge.id)
      ])
      
      console.log('📊 ALL REQUIREMENTS LOADED:')
      console.log('  - Workouts:', workouts)
      console.log('  - Meals:', meals)
      console.log('  - Weights:', weights)
      console.log('  - Photos:', photos)
      console.log('  - Calls:', calls)
      
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
      
      console.log('✅ REQUIREMENTS SUMMARY:')
      console.log('  - All met:', requirementsData.allMet)
      console.log('  - Completed count:', requirementsData.completedCount + '/5')
      
      setRequirements(requirementsData)
      console.log('✅ State updated!')
      
    } catch (error) {
      console.error('💥 FATAL ERROR in loadChallengeData:', error)
      console.error('Error stack:', error.stack)
    } finally {
      setLoading(false)
      console.log('🏁 LOAD CHALLENGE DATA COMPLETE')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    }
  }
  
  async function loadWorkouts(clientId, startDate, endDate) {
    console.log('💪 LOAD WORKOUTS')
    console.log('  - Client:', clientId)
    console.log('  - Start:', startDate.toISOString().split('T')[0])
    console.log('  - End:', endDate.toISOString().split('T')[0])
    
    try {
      const { data, error } = await db.supabase
        .from('workout_completions')
        .select('workout_date, completed')
        .eq('client_id', clientId)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .lte('workout_date', endDate.toISOString().split('T')[0])
        .eq('completed', true)
      
      if (error) {
        console.error('❌ Workout query error:', error)
        throw error
      }
      
      const count = data?.length || 0
      console.log('  ✅ Found:', count, 'completed workouts')
      console.log('  📊 Data:', data)
      
      const result = { 
        current: count, 
        required: 24, 
        met: count >= 24, 
        percentage: Math.min(100, Math.round((count / 24) * 100)) 
      }
      console.log('  📈 Result:', result)
      return result
    } catch (error) {
      console.error('❌ Load workouts error:', error)
      return { current: 0, required: 24, met: false, percentage: 0 }
    }
  }
  
  async function loadMeals(clientId, startDate, endDate) {
    console.log('🍽️ LOAD MEALS')
    console.log('  - Client:', clientId)
    console.log('  - Start:', startDate.toISOString().split('T')[0])
    console.log('  - End:', endDate.toISOString().split('T')[0])
    
    try {
      const { data, error } = await db.supabase
        .from('ai_meal_progress')
        .select('date, meals_consumed, manual_intake, completion_percentage')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      if (error) {
        console.error('❌ Meal query error:', error)
        throw error
      }
      
      console.log('  📊 Raw data count:', data?.length || 0)
      
      const trackedDays = data?.filter(day => 
        day.meals_consumed > 0 || 
        day.manual_intake !== null || 
        day.completion_percentage > 0
      ) || []
      
      console.log('  📊 Tracked days (filtered):', trackedDays.length)
      
      const uniqueDays = [...new Set(trackedDays.map(m => m.date))]
      const count = uniqueDays.length
      
      console.log('  ✅ Unique days:', count)
      console.log('  📅 Dates:', uniqueDays)
      
      const result = { 
        current: count, 
        required: 45, 
        met: count >= 45, 
        percentage: Math.min(100, Math.round((count / 45) * 100)) 
      }
      console.log('  📈 Result:', result)
      return result
    } catch (error) {
      console.error('❌ Load meals error:', error)
      return { current: 0, required: 45, met: false, percentage: 0 }
    }
  }
  
  async function loadWeights(clientId, startDate, endDate, assignmentId) {
    console.log('⚖️ LOAD WEIGHTS')
    console.log('  - Client:', clientId)
    console.log('  - Start:', startDate.toISOString().split('T')[0])
    console.log('  - End:', endDate.toISOString().split('T')[0])
    console.log('  - Assignment:', assignmentId)
    console.log('  🎯 READING FROM: weight_challenge_logs')
    
    try {
      const { data, error } = await db.supabase
        .from('weight_challenge_logs')
        .select('date, weight')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      if (error) {
        console.error('❌ Weight query error:', error)
        throw error
      }
      
      const count = data?.length || 0
      console.log('  ✅ Found:', count, 'weight entries')
      console.log('  📊 Data:', data)
      
      const result = { 
        current: count, 
        required: 8, 
        met: count >= 8, 
        percentage: Math.min(100, Math.round((count / 8) * 100)) 
      }
      console.log('  📈 Result:', result)
      return result
    } catch (error) {
      console.error('❌ Load weights error:', error)
      return { current: 0, required: 8, met: false, percentage: 0 }
    }
  }
  
  async function loadPhotos(clientId, startDate, endDate) {
    console.log('📸 LOAD PHOTOS')
    console.log('  - Client:', clientId)
    console.log('  - Start:', startDate.toISOString().split('T')[0])
    console.log('  - End:', endDate.toISOString().split('T')[0])
    
    try {
      const { data, error } = await db.supabase
        .from('progress_photos')
        .select('date, photo_url')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      if (error) {
        console.error('❌ Photo query error:', error)
        throw error
      }
      
      const count = data?.length || 0
      console.log('  ✅ Found:', count, 'photos')
      console.log('  📊 Data:', data)
      
      const result = { 
        current: count, 
        required: 8, 
        met: count >= 8, 
        percentage: Math.min(100, Math.round((count / 8) * 100)) 
      }
      console.log('  📈 Result:', result)
      return result
    } catch (error) {
      console.error('❌ Load photos error:', error)
      return { current: 0, required: 8, met: false, percentage: 0 }
    }
  }
  
  async function loadCalls(clientId, startDate, endDate, assignmentId) {
    console.log('📞 LOAD CALLS')
    console.log('  - Client:', clientId)
    console.log('  - Start:', startDate.toISOString().split('T')[0])
    console.log('  - End:', endDate.toISOString().split('T')[0])
    console.log('  - Assignment:', assignmentId)
    console.log('  🎯 READING FROM: client_calls')
    
    try {
      const { data, error } = await db.supabase
        .from('client_calls')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'completed')
      
      if (error) {
        console.error('❌ Calls query error:', error)
        throw error
      }
      
      const count = data?.length || 0
      console.log('  ✅ Found:', count, 'completed calls')
      console.log('  📊 Data:', data)
      
      const result = { 
        current: count, 
        required: 8, 
        met: count >= 8, 
        percentage: Math.min(100, Math.round((count / 8) * 100)) 
      }
      console.log('  📈 Result:', result)
      return result
    } catch (error) {
      console.error('❌ Load calls error:', error)
      return { current: 0, required: 8, met: false, percentage: 0 }
    }
  }
  
  if (loading) {
    console.log('⏳ BANNER IS LOADING...')
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        borderRadius: isMobile ? '14px' : '20px',
        padding: isMobile ? '1.5rem' : '2rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}>
        <div style={{
          width: isMobile ? '32px' : '40px',
          height: isMobile ? '32px' : '40px',
          border: '3px solid rgba(255, 215, 0, 0.2)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }
  
  if (!challengeData || !requirements) {
    console.log('❌ No challenge data or requirements - not rendering banner')
    return null
  }
  
  console.log('✅ RENDERING BANNER with requirements:', requirements)
  
  const requirementCards = [
    { id: 'workouts', icon: Activity, data: requirements.workouts },
    { id: 'meals', icon: Utensils, data: requirements.meals },
    { id: 'weights', icon: Weight, data: requirements.weights },
    { id: 'photos', icon: Camera, data: requirements.photos },
    { id: 'calls', icon: Phone, data: requirements.calls }
  ]
  
  return (
    <div style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
      transition: 'all 0.5s ease',
      position: 'relative',
      marginBottom: isMobile ? '1rem' : '1.5rem'
    }}>
      <div style={{
        background: THEME.background,
        backdropFilter: 'blur(12px)',
        borderRadius: isMobile ? '16px' : '24px',
        padding: isMobile ? '1.25rem' : '2rem',
        border: `2px solid ${THEME.border}`,
        boxShadow: THEME.shadow,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background effect */}
        {isEligible && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
            animation: 'pulse 3s ease-in-out infinite',
            pointerEvents: 'none'
          }} />
        )}
        
        {/* Header Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem' }}>
            <Trophy 
              size={isMobile ? 24 : 32} 
              color={THEME.primary}
              style={{ 
                filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
                animation: isEligible ? 'float 3s ease-in-out infinite' : 'none'
              }}
            />
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.125rem' : '1.5rem',
                fontWeight: '700',
                color: THEME.textPrimary,
                margin: 0,
                lineHeight: 1.2,
                filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))'
              }}>
                8-Week Challenge
              </h2>
              <p style={{
                fontSize: isMobile ? '0.7rem' : '0.875rem',
                color: THEME.textMuted,
                margin: '0.2rem 0 0 0'
              }}>
                {requirements.completedCount}/5 Requirements Behaald
              </p>
            </div>
          </div>
          
          {isEligible && (
            <Award 
              size={isMobile ? 28 : 36} 
              color={THEME.primary}
              style={{ 
                filter: 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.6))',
                animation: 'spin 3s linear infinite'
              }}
            />
          )}
        </div>
        
        {/* Quick Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: isMobile ? '0.4rem' : '0.75rem',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          {requirementCards.map(req => (
            <div key={req.id} style={{
              background: req.data.met 
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%)'
                : 'rgba(0, 0, 0, 0.3)',
              borderRadius: isMobile ? '8px' : '12px',
              padding: isMobile ? '0.5rem 0.3rem' : '0.75rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? '0.25rem' : '0.4rem',
              border: req.data.met ? '1.5px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: req.data.met ? '0 2px 8px rgba(255, 215, 0, 0.15)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              <req.icon 
                size={isMobile ? 14 : 20} 
                color={req.data.met ? THEME.primary : 'rgba(255,255,255,0.4)'}
                style={{ 
                  filter: req.data.met ? 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.4))' : 'none'
                }}
              />
              <span style={{
                fontSize: isMobile ? '0.7rem' : '1rem',
                fontWeight: '700',
                color: req.data.met ? THEME.textPrimary : '#fff',
                lineHeight: 1
              }}>
                {req.data.current}/{req.data.required}
              </span>
            </div>
          ))}
        </div>
        
        {/* Main Progress Section */}
        <div style={{
          background: isEligible 
            ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(212, 175, 55, 0.08) 100%)'
            : 'rgba(0, 0, 0, 0.25)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '1rem' : '1.5rem',
          border: isEligible ? '1.5px solid rgba(255, 215, 0, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          boxShadow: isEligible ? '0 4px 20px rgba(255, 215, 0, 0.15)' : 'none',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '0.5rem' : '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={isMobile ? 14 : 18} color={THEME.textSecondary} />
              <span style={{
                fontSize: isMobile ? '0.75rem' : '0.95rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '600'
              }}>
                Dag {requirements.currentDay} van 56
              </span>
            </div>
            <span style={{
              fontSize: isMobile ? '0.75rem' : '0.95rem',
              color: THEME.textSecondary,
              fontWeight: '600'
            }}>
              {requirements.daysRemaining} dagen over
            </span>
          </div>
          
          {/* Progress Message */}
          <div style={{
            fontSize: isMobile ? '0.875rem' : '1.125rem',
            fontWeight: '600',
            color: isEligible ? THEME.textPrimary : '#fff',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {isEligible ? (
              <>
                <CheckCircle size={isMobile ? 16 : 20} color={THEME.primary} strokeWidth={2.5} />
                <span>Je hebt alle requirements behaald! 🎉</span>
              </>
            ) : (
              <>
                <Target size={isMobile ? 16 : 20} color={THEME.textSecondary} />
                <span>{5 - requirements.completedCount} requirements te gaan</span>
              </>
            )}
          </div>
          
          {/* Goal Progress (if exists) */}
          {goalData && (
            <div style={{
              marginTop: isMobile ? '0.75rem' : '1rem',
              paddingTop: isMobile ? '0.75rem' : '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.9rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600'
                }}>
                  Doel Progressie
                </span>
                <span style={{
                  fontSize: isMobile ? '0.875rem' : '1.125rem',
                  fontWeight: '700',
                  color: goalData.achieved ? THEME.textPrimary : '#fff'
                }}>
                  {goalData.progress.percentage.toFixed(0)}%
                </span>
              </div>
              <div style={{
                height: isMobile ? '6px' : '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 215, 0, 0.1)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, goalData.progress.percentage)}%`,
                  background: THEME.progressBar,
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: goalData.achieved ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
                }} />
              </div>
              {goalData.achieved && (
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.85rem',
                  color: THEME.textPrimary,
                  fontWeight: '600',
                  marginTop: '0.3rem',
                  display: 'inline-block',
                  filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.3))'
                }}>
                  ✓ Doel bereikt!
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Expand/Collapse Button */}
        <button
          onClick={() => {
            console.log('🔽 Toggle expanded:', !expanded)
            setExpanded(!expanded)
          }}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '0.875rem',
            background: expanded 
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${expanded ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: isMobile ? '9px' : '12px',
            color: expanded ? THEME.textPrimary : '#fff',
            fontSize: isMobile ? '0.8rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.3s ease',
            position: 'relative',
            zIndex: 1
          }}
        >
          {expanded ? (
            <>
              <ChevronUp size={isMobile ? 16 : 18} />
              <span>Verberg details</span>
            </>
          ) : (
            <>
              <ChevronDown size={isMobile ? 16 : 18} />
              <span>Bekijk details</span>
            </>
          )}
        </button>
        
        {/* Expanded Details */}
        {expanded && (
          <div style={{
            marginTop: isMobile ? '1rem' : '1.5rem',
            animation: 'slideDown 0.3s ease',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Detailed cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '0.5rem' : '1rem'
            }}>
              {requirementCards.map(req => {
                const labels = {
                  workouts: 'Workouts',
                  meals: 'Voeding',
                  weights: 'Weging',
                  photos: 'Foto\'s',
                  calls: 'Check-ins'
                }
                const units = {
                  workouts: 'sessies',
                  meals: 'dagen',
                  weights: 'keer',
                  photos: 'keer',
                  calls: 'calls'
                }
                
                return (
                  <div key={req.id} style={{
                    background: req.data.met
                      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(212, 175, 55, 0.04) 100%)'
                      : 'rgba(0, 0, 0, 0.35)',
                    borderRadius: isMobile ? '9px' : '14px',
                    padding: isMobile ? '0.75rem' : '1.25rem',
                    backdropFilter: 'blur(8px)',
                    border: req.data.met ? '1.5px solid rgba(255, 215, 0, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: req.data.met ? '0 3px 12px rgba(255, 215, 0, 0.1)' : 'none'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <req.icon 
                          size={isMobile ? 15 : 20} 
                          color={req.data.met ? '#FFD700' : 'rgba(255,255,255,0.5)'}
                          style={{ filter: req.data.met ? 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.5))' : 'none' }}
                        />
                        <span style={{
                          fontSize: isMobile ? '0.75rem' : '1rem',
                          fontWeight: '600',
                          color: req.data.met ? THEME.textPrimary : 'rgba(255,255,255,0.9)'
                        }}>
                          {labels[req.id]}
                        </span>
                      </div>
                      {req.data.met && (
                        <CheckCircle 
                          size={isMobile ? 13 : 16} 
                          color="#FFD700" 
                          strokeWidth={2.5}
                          style={{ filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))' }}
                        />
                      )}
                    </div>
                    
                    <div style={{
                      fontSize: isMobile ? '1.125rem' : '1.75rem',
                      fontWeight: '700',
                      color: req.data.met ? THEME.textPrimary : '#fff',
                      marginBottom: '0.2rem',
                      lineHeight: 1,
                      filter: req.data.met ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.3))' : 'none'
                    }}>
                      {req.data.current}/{req.data.required}
                      <span style={{
                        fontSize: isMobile ? '0.6rem' : '0.75rem',
                        fontWeight: '500',
                        marginLeft: '0.35rem',
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {units[req.id]}
                      </span>
                    </div>
                    
                    <div style={{
                      height: isMobile ? '4px' : '6px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 215, 0, 0.08)'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${req.data.percentage}%`,
                        background: THEME.progressBar,
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: req.data.met ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Time warning */}
            {challengeData && requirements.daysRemaining <= 14 && requirements.daysRemaining > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
                borderRadius: isMobile ? '9px' : '14px',
                padding: isMobile ? '0.75rem' : '1.25rem',
                border: '1.5px solid rgba(255, 215, 0, 0.3)',
                marginTop: isMobile ? '0.625rem' : '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.4rem' : '0.75rem',
                boxShadow: '0 3px 15px rgba(255, 215, 0, 0.15)'
              }}>
                <Clock 
                  size={isMobile ? 15 : 20} 
                  color="#FFD700"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.5))' }}
                />
                <div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '1rem',
                    fontWeight: '700',
                    color: THEME.textPrimary,
                    filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.3))'
                  }}>
                    Laatste {requirements.daysRemaining} dagen!
                  </div>
                  <div style={{ fontSize: isMobile ? '0.65rem' : '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
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
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
