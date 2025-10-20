// src/client/components/challenge-banner/ChallengeHomeBanner.jsx
import { useState, useEffect } from 'react'
import ChallengeHeader from './ChallengeHeader'
import PersonalGoalCard from './PersonalGoalCard'
import RequirementQuickStats from './RequirementQuickStats'
import MoneyBackProgress from './MoneyBackProgress'
import RequirementDetailCards from './RequirementDetailCards'

export default function ChallengeHomeBanner({ db, client }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [loading, setLoading] = useState(true)
  const [challengeData, setChallengeData] = useState(null)
  const [requirements, setRequirements] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [goalData, setGoalData] = useState(null)
  
  // Theme - Premium Gold
  const isEligible = requirements?.allMet || false
  
  const THEME = {
    primary: '#FFD700',
    secondary: '#D4AF37',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%)',
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(0, 0, 0, 0.95) 100%)',
    border: 'rgba(255, 215, 0, 0.25)',
    shadow: '0 25px 50px rgba(255, 215, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    glow: '0 0 30px rgba(255, 215, 0, 0.2)'
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
  
  return (
    <div style={{
      background: THEME.background,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
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
      
      {/* Golden gradient orb */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50%',
        height: '100%',
        background: 'radial-gradient(circle at top right, rgba(255, 215, 0, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      {/* Shimmer effect */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-20%',
        width: '40%',
        height: '200%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.08), transparent)',
        transform: 'rotate(35deg)',
        animation: 'glide 6s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <ChallengeHeader
          isMobile={isMobile}
          isEligible={isEligible}
          requirements={requirements}
          challengeData={challengeData}
          expanded={expanded}
          onToggleExpand={() => setExpanded(!expanded)}
          theme={THEME}
        />
        
        {/* Personal Goal */}
        {goalData && (
          <PersonalGoalCard
            isMobile={isMobile}
            goalData={goalData}
            theme={THEME}
          />
        )}
        
        {/* Quick Stats */}
        <RequirementQuickStats
          isMobile={isMobile}
          requirements={requirements}
          expanded={expanded}
          theme={THEME}
        />
        
        {/* Expanded Details */}
        {expanded && (
          <div style={{
            animation: 'slideDown 0.3s ease'
          }}>
            {/* Money Back Progress */}
            <MoneyBackProgress
              isMobile={isMobile}
              requirements={requirements}
              isEligible={isEligible}
              theme={THEME}
            />
            
            {/* Requirement Detail Cards */}
            <RequirementDetailCards
              isMobile={isMobile}
              requirements={requirements}
              challengeData={challengeData}
              theme={THEME}
            />
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
        
        @keyframes glide {
          0% { left: -20%; }
          100% { left: 120%; }
        }
        
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
