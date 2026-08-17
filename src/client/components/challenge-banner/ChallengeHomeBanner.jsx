// src/client/components/challenge-banner/ChallengeHomeBanner.jsx
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

export default function ChallengeHomeBanner({ db, client }) {
  console.log('🏠 ChallengeHomeBanner rendered with client:', client?.id)
  
  const isMobile = window.innerWidth <= 768
  
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
    console.log('⚡ Initial useEffect - Setting visible and loading data')
    const timer = setTimeout(() => setIsVisible(true), 100)
    if (client?.id) {
      console.log('✅ Client ID found, loading challenge data for:', client.id)
      loadChallengeData()
    } else {
      console.warn('⚠️ No client ID found')
    }
    return () => clearTimeout(timer)
  }, [client?.id])
  
  useEffect(() => {
    console.log('🔄 Poll interval setup - will refresh every 30s')
    const interval = setInterval(() => {
      if (client?.id && !loading) {
        console.log('🔄 Auto-refresh triggered')
        loadChallengeData()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [client?.id, loading])
  
  async function loadChallengeData() {
    console.log('📊 === LOADING CHALLENGE DATA START ===')
    console.log('📊 Client ID:', client.id)
    
    try {
      console.log('🔍 Step 1: Fetching active challenge assignment...')
      const { data: challenge, error } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .maybeSingle()
      
      console.log('📦 Challenge query result:', { challenge, error })
      
      if (error) {
        console.error('❌ Challenge fetch error:', error)
        setLoading(false)
        return
      }
      
      if (challenge) {
        console.log('✅ Challenge found:', challenge)
        setChallengeData(challenge)
        
        console.log('🔍 Step 2: Fetching primary goal...')
        const { data: goal } = await db.supabase
          .from('challenge_assignment_goals')
          .select('*')
          .eq('assignment_id', challenge.id)
          .eq('is_primary', true)
          .maybeSingle()
        
        console.log('📦 Goal query result:', goal)
        
        if (goal) {
          console.log('🎯 Goal found:', goal)
          
          if (goal.goal_type === 'weight' && goal.auto_track) {
            console.log('⚖️ Auto-tracking weight goal, fetching latest weight...')
            const { data: latestWeight } = await db.supabase
              .from('weight_challenge_logs')
              .select('weight, date')
              .eq('client_id', client.id)
              .order('date', { ascending: false })
              .limit(1)
              .maybeSingle()
            
            console.log('📦 Latest weight:', latestWeight)
            
            if (latestWeight?.weight && latestWeight.weight !== goal.current_value) {
              console.log('🔄 Updating goal current value from', goal.current_value, 'to', latestWeight.weight)
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
          
          const progress = db.calculateGoalProgress(
            goal.starting_value,
            goal.current_value,
            goal.target_value
          )
          
          console.log('📈 Goal progress calculated:', progress)
          
          setGoalData({
            ...goal,
            progress: progress,
            remaining: Math.abs(goal.target_value),
            achieved: progress.percentage >= 100
          })
        } else {
          console.warn('⚠️ No primary goal found')
        }
      } else {
        console.warn('⚠️ No active challenge found')
        setLoading(false)
        return
      }
      
      const startDate = challenge?.start_date 
        ? new Date(challenge.start_date)
        : new Date(Date.now() - (56 * 24 * 60 * 60 * 1000))
      
      const endDate = challenge?.end_date
        ? new Date(challenge.end_date)
        : new Date()
      
      console.log('📅 Challenge period:', { startDate, endDate })
      
      const currentDay = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
      
      console.log('📅 Days:', { currentDay, daysRemaining })
      
      console.log('🔍 Step 3: Loading all requirements...')
      const [workouts, meals, weights, photos, calls] = await Promise.all([
        loadWorkouts(client.id, startDate, endDate),
        loadMeals(client.id, startDate, endDate),
        loadWeights(client.id, startDate, endDate),
        loadPhotos(client.id, startDate, endDate),
        loadCalls(client.id, startDate, endDate)
      ])
      
      console.log('📊 === REQUIREMENTS RESULTS ===')
      console.log('💪 Workouts:', workouts)
      console.log('🍽️ Meals:', meals)
      console.log('⚖️ Weights:', weights)
      console.log('📸 Photos:', photos)
      console.log('📞 Calls:', calls)
      
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
      
      console.log('✅ Final requirements data:', requirementsData)
      console.log('🏆 Eligible for refund:', requirementsData.allMet)
      
      setRequirements(requirementsData)
      
    } catch (error) {
      console.error('❌ Error loading challenge data:', error)
    } finally {
      console.log('📊 === LOADING CHALLENGE DATA END ===')
      setLoading(false)
    }
  }
  
  async function loadWorkouts(clientId, startDate, endDate) {
    console.log('💪 Loading workouts for client:', clientId)
    console.log('💪 Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0])
    
    try {
      const { data, error } = await db.supabase
        .from('workout_completions')
        .select('workout_date, completed')
        .eq('client_id', clientId)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .lte('workout_date', endDate.toISOString().split('T')[0])
        .eq('completed', true)
      
      console.log('💪 Workout query result:', { data, error })
      
      const count = data?.length || 0
      const result = { current: count, required: 24, met: count >= 24, percentage: Math.min(100, Math.round((count / 24) * 100)) }
      
      console.log('💪 Workouts result:', result)
      return result
    } catch (error) {
      console.error('❌ Error loading workouts:', error)
      return { current: 0, required: 24, met: false, percentage: 0 }
    }
  }
  
  async function loadMeals(clientId, startDate, endDate) {
    console.log('🍽️ Loading meals for client:', clientId)
    console.log('🍽️ Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0])
    
    try {
      const { data, error } = await db.supabase
        .from('ai_meal_progress')
        .select('date, meals_consumed, manual_intake, completion_percentage')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      console.log('🍽️ Meal query result:', { data, error })
      
      const trackedDays = data?.filter(day => 
        day.meals_consumed > 0 || 
        day.manual_intake !== null || 
        day.completion_percentage > 0
      ) || []
      
      console.log('🍽️ Tracked days:', trackedDays.length)
      
      const uniqueDays = [...new Set(trackedDays.map(m => m.date))]
      const count = uniqueDays.length
      
      const result = { current: count, required: 45, met: count >= 45, percentage: Math.min(100, Math.round((count / 45) * 100)) }
      
      console.log('🍽️ Meals result:', result)
      return result
    } catch (error) {
      console.error('❌ Error loading meals:', error)
      return { current: 0, required: 45, met: false, percentage: 0 }
    }
  }
  
  async function loadWeights(clientId, startDate, endDate) {
    console.log('⚖️ Loading weights for client:', clientId)
    console.log('⚖️ Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0])
    
    try {
      const { data, error } = await db.supabase
        .from('weight_challenge_logs')
        .select('date, weight')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      
      console.log('⚖️ Weight query result:', { data, error })
      console.log('⚖️ Weight entries found:', data?.length || 0)
      
      const count = data?.length || 0
      const result = { current: count, required: 8, met: count >= 8, percentage: Math.min(100, Math.round((count / 8) * 100)) }
      
      console.log('⚖️ Weights result:', result)
      return result
    } catch (error) {
      console.error('❌ Error loading weights:', error)
      return { current: 0, required: 8, met: false, percentage: 0 }
    }
  }
  
  async function loadPhotos(clientId, startDate, endDate) {
    console.log('📸 Loading photos for client:', clientId)
    console.log('📸 Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0])
    
    try {
      // Use created_at (standard Supabase timestamp column)
      const { data, error } = await db.supabase
        .from('progress_photos')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      console.log('📸 Photo query (created_at) result:', { data, error })
      
      if (error) {
        console.error('📸 ERROR DETAILS:', JSON.stringify(error, null, 2))
        console.warn('⚠️ Using fallback: count all photos without date filter')
        
        // Fallback: get all photos for this client
        const { data: allData, error: allError } = await db.supabase
          .from('progress_photos')
          .select('*')
          .eq('client_id', clientId)
        
        console.log('📸 Photo query (all) result:', { data: allData, error: allError })
        console.log('📸 Sample photo data:', allData?.[0])
        
        const count = allData?.length || 0
        const result = { current: count, required: 8, met: count >= 8, percentage: Math.min(100, Math.round((count / 8) * 100)) }
        console.log('📸 Photos result (no date filter):', result)
        return result
      }
      
      console.log('📸 Photo entries found:', data?.length || 0)
      const count = data?.length || 0
      const result = { current: count, required: 8, met: count >= 8, percentage: Math.min(100, Math.round((count / 8) * 100)) }
      
      console.log('📸 Photos result:', result)
      return result
    } catch (error) {
      console.error('❌ Exception loading photos:', error)
      return { current: 0, required: 8, met: false, percentage: 0 }
    }
  }
  
  async function loadCalls(clientId, startDate, endDate) {
    console.log('📞 Loading calls for client:', clientId)
    console.log('📞 Date range:', startDate.toISOString(), 'to', endDate.toISOString())
    
    try {
      // Get ALL calls and log sample to see structure
      const { data: allCalls, error } = await db.supabase
        .from('client_calls')
        .select('*')
        .eq('client_id', clientId)
      
      console.log('📞 Calls query result:', { data: allCalls, error })
      
      if (error) {
        console.error('📞 ERROR DETAILS:', JSON.stringify(error, null, 2))
        return { current: 0, required: 8, met: false, percentage: 0 }
      }
      
      console.log('📞 Total calls found:', allCalls?.length || 0)
      console.log('📞 Sample call data (first 3):', allCalls?.slice(0, 3))
      
      if (!allCalls || allCalls.length === 0) {
        return { current: 0, required: 8, met: false, percentage: 0 }
      }
      
      // Determine which date column exists and filter in JavaScript
      const sampleCall = allCalls[0]
      console.log('📞 Available columns:', Object.keys(sampleCall))
      
      // Check for various date column names
      let dateColumn = null
      if ('scheduled_at' in sampleCall) dateColumn = 'scheduled_at'
      else if ('call_date' in sampleCall) dateColumn = 'call_date'
      else if ('created_at' in sampleCall) dateColumn = 'created_at'
      else if ('date' in sampleCall) dateColumn = 'date'
      
      // Check for status/completion column
      let isCompletedFunc = null
      if ('status' in sampleCall) {
        isCompletedFunc = (call) => call.status === 'completed'
      } else if ('completed' in sampleCall) {
        isCompletedFunc = (call) => call.completed === true
      } else if ('unlocked' in sampleCall) {
        isCompletedFunc = (call) => call.unlocked === false  // unlocked=false means completed
      } else {
        // No completion filter available - count all within date range
        isCompletedFunc = () => true
      }
      
      console.log('📞 Using date column:', dateColumn || 'NONE')
      console.log('📞 Using completion filter:', isCompletedFunc ? 'YES' : 'NO')
      
      // Filter calls in JavaScript
      let filteredCalls = allCalls
      
      // Filter by date if we have a date column
      if (dateColumn) {
        filteredCalls = filteredCalls.filter(call => {
          if (!call[dateColumn]) return false
          const callDate = new Date(call[dateColumn])
          return callDate >= startDate && callDate <= endDate
        })
        console.log('📞 Calls within date range:', filteredCalls.length)
      } else {
        console.warn('⚠️ No date column found! Using all calls')
      }
      
      // Filter by completion status
      filteredCalls = filteredCalls.filter(isCompletedFunc)
      console.log('📞 Completed calls:', filteredCalls.length)
      
      const count = filteredCalls.length
      const result = { current: count, required: 8, met: count >= 8, percentage: Math.min(100, Math.round((count / 8) * 100)) }
      
      console.log('📞 Calls result:', result)
      return result
    } catch (error) {
      console.error('❌ Exception loading calls:', error)
      return { current: 0, required: 8, met: false, percentage: 0 }
    }
  }
  
  if (loading) {
    console.log('⏳ Banner is loading...')
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
        borderRadius: isMobile ? '14px' : '20px',
        padding: isMobile ? '1.25rem 1rem' : '2.5rem 2rem',
        border: '2px solid rgba(255, 215, 0, 0.15)',
        marginBottom: isMobile ? '1rem' : '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '80px' }}>
          <div style={{
            width: isMobile ? '35px' : '50px',
            height: isMobile ? '35px' : '50px',
            border: '3px solid rgba(255, 215, 0, 0.2)',
            borderTop: '3px solid #FFD700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ color: THEME.textSecondary, fontSize: isMobile ? '0.85rem' : '1.125rem', fontWeight: '600' }}>
            Challenge data laden...
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    )
  }
  
  if (!challengeData || !requirements) {
    console.warn('⚠️ No challenge data or requirements, not rendering banner')
    return null
  }
  
  console.log('🎨 Rendering banner with:', { challengeData, requirements, isEligible })
  
  const requirementCards = [
    { id: 'workouts', icon: Activity, data: requirements.workouts },
    { id: 'meals', icon: Utensils, data: requirements.meals },
    { id: 'weights', icon: Weight, data: requirements.weights },
    { id: 'photos', icon: Camera, data: requirements.photos },
    { id: 'calls', icon: Phone, data: requirements.calls }
  ]
  
  return (
    <div style={{
      position: 'relative',
      marginBottom: isMobile ? '1rem' : '2rem',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Golden orbs */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-20%',
        width: isMobile ? '140px' : '350px',
        height: isMobile ? '140px' : '350px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        animation: 'float 25s ease-in-out infinite'
      }} />
      
      {/* Main card - COMPACT */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.92) 100%)',
        borderRadius: isMobile ? '14px' : '20px',
        padding: isMobile ? '1.125rem 0.875rem' : '2.5rem 2rem',
        border: `2px solid ${THEME.border}`,
        boxShadow: THEME.shadow,
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: THEME.background,
          pointerEvents: 'none',
          opacity: isEligible ? 1 : 0.6
        }} />
        
        {/* Top badge */}
        {isEligible && (
          <div style={{
            position: 'absolute',
            top: '-9px',
            right: isMobile ? '0.625rem' : '2rem',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            padding: isMobile ? '0.25rem 0.625rem' : '0.4rem 1rem',
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.5)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <Award size={isMobile ? 10 : 14} color="#000" strokeWidth={2.5} />
            <span style={{ fontSize: isMobile ? '0.55rem' : '0.7rem', fontWeight: '800', color: '#000', letterSpacing: '0.05em' }}>
              UNLOCKED
            </span>
          </div>
        )}
        
        {/* Header - COMPACT */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: isMobile ? '0.75rem' : '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isMobile ? '0.625rem' : '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem' }}>
              <div style={{
                width: isMobile ? '38px' : '60px',
                height: isMobile ? '38px' : '60px',
                borderRadius: isMobile ? '9px' : '14px',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(212, 175, 55, 0.08) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 215, 0, 0.25)',
                boxShadow: '0 6px 20px rgba(255, 215, 0, 0.15)'
              }}>
                <Trophy 
                  size={isMobile ? 19 : 32} 
                  color="#FFD700"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))' }}
                />
              </div>
              
              <div>
                <h2 style={{
                  fontSize: isMobile ? '1.05rem' : '1.75rem',
                  fontWeight: '800',
                  background: THEME.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.1rem',
                  letterSpacing: '-0.01em',
                  filter: 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.3))',
                  lineHeight: 1.05
                }}>
                  Challenge Money Back
                </h2>
                <p style={{
                  fontSize: isMobile ? '0.65rem' : '0.95rem',
                  color: THEME.textMuted,
                  fontWeight: '500',
                  margin: 0
                }}>
                  {isEligible ? '✓ Gekwalificeerd' : 'Voldoe aan eisen'}
                </p>
              </div>
            </div>
            
            {/* Days badge - COMPACT */}
            <div style={{
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: isMobile ? '9px' : '12px',
              padding: isMobile ? '0.35rem 0.5rem' : '0.625rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.25rem' : '0.5rem'
            }}>
              <Calendar size={isMobile ? 11 : 16} color={THEME.textSecondary} />
              <div>
                <div style={{ fontSize: isMobile ? '0.95rem' : '1.375rem', fontWeight: '800', color: THEME.textPrimary, lineHeight: 1 }}>
                  {requirements.daysRemaining}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.55rem' : '0.7rem',
                  color: THEME.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600'
                }}>
                  Dagen
                </div>
              </div>
            </div>
          </div>
          
          {/* Goal - COMPACT */}
          {goalData && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: isMobile ? '9px' : '14px',
              padding: isMobile ? '0.625rem' : '1.25rem',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 215, 0, 0.15)',
              marginBottom: isMobile ? '0.625rem' : '1.25rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMobile ? '0.4rem' : '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Target size={isMobile ? 12 : 18} color={THEME.textSecondary} />
                  <span style={{ color: THEME.textMuted, fontSize: isMobile ? '0.7rem' : '0.9rem', fontWeight: '600' }}>
                    Jouw Doel
                  </span>
                </div>
                {goalData.achieved && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                    padding: isMobile ? '0.15rem 0.4rem' : '0.25rem 0.75rem',
                    borderRadius: '100px',
                    boxShadow: '0 2px 10px rgba(255, 215, 0, 0.4)'
                  }}>
                    <CheckCircle size={isMobile ? 9 : 12} color="#000" strokeWidth={3} />
                    <span style={{
                      fontSize: isMobile ? '0.55rem' : '0.7rem',
                      fontWeight: '800',
                      color: '#000',
                      letterSpacing: '0.05em'
                    }}>
                      BEREIKT
                    </span>
                  </div>
                )}
              </div>
              
              <div style={{
                fontSize: isMobile ? '1.25rem' : '2rem',
                fontWeight: '800',
                background: THEME.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: isMobile ? '0.3rem' : '0.5rem',
                filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.2))',
                lineHeight: 1
              }}>
                {goalData.goal_type === 'weight' && `${goalData.current_value?.toFixed(1) || 0} kg`}
                {goalData.goal_type === 'body_fat' && `${goalData.current_value?.toFixed(1) || 0}%`}
                {goalData.goal_type === 'muscle' && `${goalData.current_value?.toFixed(1) || 0} kg`}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: isMobile ? '0.65rem' : '0.85rem', color: THEME.textMuted }}>
                {goalData.progress.isImproving ? (
                  <TrendingDown size={isMobile ? 10 : 14} color="#FFD700" />
                ) : (
                  <TrendingUp size={isMobile ? 10 : 14} color="#D4AF37" />
                )}
                <span>
                  {Math.abs(goalData.remaining).toFixed(1)} {goalData.goal_type === 'body_fat' ? '%' : 'kg'} {goalData.progress.isImproving ? 'verloren' : 'nog'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* ⭐ 5 VAKJES HORIZONTAAL MET PROGRESS BARS */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: isMobile ? '0.375rem' : '0.75rem',
          marginBottom: isMobile ? '0.75rem' : '1.5rem'
        }}>
          {requirementCards.map(req => (
            <div key={req.id} style={{
              background: req.data.met 
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)'
                : 'rgba(0, 0, 0, 0.35)',
              borderRadius: isMobile ? '9px' : '14px',
              padding: isMobile ? '0.5rem 0.3rem' : '1rem 0.75rem',
              textAlign: 'center',
              border: req.data.met ? '1.5px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: req.data.met ? '0 3px 12px rgba(255, 215, 0, 0.15)' : 'none'
            }}>
              <req.icon 
                size={isMobile ? 13 : 22} 
                color={req.data.met ? '#FFD700' : 'rgba(255,255,255,0.4)'}
                style={{
                  marginBottom: isMobile ? '0.25rem' : '0.5rem',
                  filter: req.data.met ? 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.5))' : 'none'
                }}
              />
              
              <div style={{
                fontSize: isMobile ? '0.85rem' : '1.375rem',
                fontWeight: '800',
                color: req.data.met ? THEME.textPrimary : '#fff',
                marginBottom: isMobile ? '0.05rem' : '0.125rem',
                lineHeight: 1,
                filter: req.data.met ? 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.3))' : 'none'
              }}>
                {req.data.current}
              </div>
              
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.7rem',
                color: req.data.met ? THEME.textMuted : 'rgba(255,255,255,0.4)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: isMobile ? '0.3rem' : '0.5rem'
              }}>
                /{req.data.required}
              </div>
              
              {/* Progress bar */}
              <div style={{
                height: isMobile ? '3px' : '4px',
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 215, 0, 0.08)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${req.data.percentage}%`,
                  background: THEME.progressBar,
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: req.data.met ? '0 0 6px rgba(255, 215, 0, 0.4)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {req.data.percentage > 0 && (
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
              </div>
            </div>
          ))}
        </div>
        
        {/* Expand button - COMPACT */}
        <button
          onClick={() => {
            console.log('🔽 Expand button clicked, current state:', expanded)
            setExpanded(!expanded)
          }}
          onTouchStart={(e) => isMobile && (e.currentTarget.style.transform = 'scale(0.98)')}
          onTouchEnd={(e) => isMobile && (e.currentTarget.style.transform = 'scale(1)')}
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(212, 175, 55, 0.04) 100%)',
            border: '1.5px solid rgba(255, 215, 0, 0.2)',
            borderRadius: isMobile ? '9px' : '14px',
            padding: isMobile ? '0.65rem 0.75rem' : '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: isMobile ? '0.75rem' : '0.95rem',
            fontWeight: '700',
            color: THEME.textPrimary,
            letterSpacing: '0.02em',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            backdropFilter: 'blur(8px)'
          }}
        >
          <span>{expanded ? 'Verberg' : 'Bekijk'} Details</span>
          {expanded ? <ChevronUp size={isMobile ? 13 : 18} /> : <ChevronDown size={isMobile ? 13 : 18} />}
        </button>
        
        {/* Expanded details */}
        {expanded && (
          <div style={{
            position: 'relative',
            zIndex: 1,
            marginTop: isMobile ? '0.75rem' : '1.5rem',
            animation: 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Money back progress */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: isMobile ? '9px' : '14px',
              padding: isMobile ? '0.75rem' : '1.25rem',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 215, 0, 0.15)',
              marginBottom: isMobile ? '0.625rem' : '1.25rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Trophy size={isMobile ? 12 : 16} color={THEME.textSecondary} />
                  <span style={{ color: THEME.textMuted, fontSize: isMobile ? '0.7rem' : '0.9rem', fontWeight: '600' }}>
                    Money Back Voortgang
                  </span>
                </div>
                <span style={{ 
                  fontSize: isMobile ? '0.9rem' : '1.1rem',
                  fontWeight: '700',
                  color: THEME.textPrimary,
                  filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.3))'
                }}>
                  {requirements.completedCount}/5
                </span>
              </div>
              
              <div style={{
                height: isMobile ? '5px' : '8px',
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '0.5rem',
                position: 'relative',
                border: '1px solid rgba(255, 215, 0, 0.1)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(requirements.completedCount / 5) * 100}%`,
                  background: THEME.progressBar,
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 0 12px rgba(255, 215, 0, 0.4)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                    animation: 'shine 2s infinite'
                  }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? '0.65rem' : '0.8rem' }}>
                  {requirements.daysRemaining} dagen resterend
                </span>
                {isEligible && (
                  <span style={{ 
                    color: THEME.textPrimary, 
                    fontSize: isMobile ? '0.7rem' : '0.9rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.4))'
                  }}>
                    <CheckCircle size={isMobile ? 11 : 14} strokeWidth={2.5} />
                    Unlocked!
                  </span>
                )}
              </div>
            </div>
            
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
