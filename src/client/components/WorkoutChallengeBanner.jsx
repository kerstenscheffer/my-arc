// src/client/components/WorkoutChallengeBanner.jsx
import React, { useState, useEffect } from 'react'
import { Dumbbell, Trophy, TrendingUp, Calendar, CheckCircle, Target, AlertCircle } from 'lucide-react'

export default function WorkoutChallengeBanner({ client, db }) {
  const isMobile = window.innerWidth <= 768
  const [showBanner, setShowBanner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [challengeData, setChallengeData] = useState(null)
  const [workoutProgress, setWorkoutProgress] = useState({
    completed: 0,
    required: 24,
    percentage: 0,
    thisWeek: 0,
    streak: 0,
    lastWorkout: null
  })

  useEffect(() => {
    checkChallengeAndProgress()
    const interval = setInterval(checkChallengeAndProgress, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [client?.id])

  const checkChallengeAndProgress = async () => {
    if (!client?.id || !db) return

    try {
      // STEP 1: Check for active challenge assignment
      const { data: challenge, error } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .eq('challenge_type', '8week')
        .single()

      if (error || !challenge) {
        setShowBanner(false)
        setLoading(false)
        return
      }

      // STEP 2: Calculate week and dates
      const startDate = new Date(challenge.start_date)
      const endDate = new Date(challenge.end_date)
      const today = new Date()
      const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
      const currentWeek = Math.min(8, Math.floor(daysSinceStart / 7) + 1)
      const daysRemaining = Math.max(0, Math.floor((endDate - today) / (1000 * 60 * 60 * 24)))

      // STEP 3: Load workout completions
      const { data: workouts } = await db.supabase
        .from('workout_completions')
        .select('*')
        .eq('client_id', client.id)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .lte('workout_date', endDate.toISOString().split('T')[0])
        .eq('completed', true)
        .order('workout_date', { ascending: false })

      // Calculate this week's workouts
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay()) // Start of week
      const thisWeekWorkouts = workouts?.filter(w => 
        new Date(w.workout_date) >= weekStart
      ).length || 0

      // Calculate streak
      let streak = 0
      const sortedWorkouts = workouts?.sort((a, b) => 
        new Date(b.workout_date) - new Date(a.workout_date)
      ) || []
      
      for (let i = 0; i < sortedWorkouts.length; i++) {
        const workoutDate = new Date(sortedWorkouts[i].workout_date)
        const expectedDate = new Date(today)
        expectedDate.setDate(today.getDate() - i)
        
        if (workoutDate.toDateString() === expectedDate.toDateString()) {
          streak++
        } else {
          break
        }
      }

      setWorkoutProgress({
        completed: workouts?.length || 0,
        required: 24,
        percentage: Math.min(100, ((workouts?.length || 0) / 24) * 100),
        thisWeek: thisWeekWorkouts,
        streak: streak,
        lastWorkout: workouts?.[0]?.workout_date || null
      })

      setChallengeData({
        currentWeek,
        daysRemaining,
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        isOnTrack: (workouts?.length || 0) >= (currentWeek * 3) // 3 per week minimum
      })

      setShowBanner(true)
    } catch (error) {
      console.error('Error checking challenge:', error)
      setShowBanner(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null
  if (!showBanner) return null

  const isOnTrack = workoutProgress.completed >= (challengeData.currentWeek * 3)
  const workoutsNeeded = Math.max(0, 24 - workoutProgress.completed)

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
      borderRadius: isMobile ? '14px' : '16px',
      padding: isMobile ? '1rem' : '1.25rem',
      marginBottom: isMobile ? '1rem' : '1.5rem',
      border: '1px solid rgba(249, 115, 22, 0.25)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 20px rgba(249, 115, 22, 0.15)',
      backdropFilter: 'blur(10px)',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}>
      {/* Background pattern - Subtle */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(249, 115, 22, 0.1) 10px,
          rgba(249, 115, 22, 0.1) 20px
        )`,
        pointerEvents: 'none'
      }} />

      {/* Dumbbell decoration - Smaller */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-3%',
        opacity: 0.05
      }}>
        <Dumbbell size={isMobile ? 120 : 150} color="#f97316" />
      </div>

      {/* Header */}
      <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem', position: 'relative' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.5rem'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              color: '#f97316',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              letterSpacing: '-0.02em'
            }}>
              <Trophy size={isMobile ? 18 : 22} />
              Workout Challenge
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Week {challengeData.currentWeek} van 8
              </span>
              <span style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                padding: '0.15rem 0.4rem',
                background: isOnTrack 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
                borderRadius: '6px',
                color: isOnTrack ? '#10b981' : '#f97316',
                border: `1px solid ${isOnTrack ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)'}`,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {isOnTrack ? 'OP SCHEMA' : 'INHALEN'}
              </span>
            </div>
          </div>
          
          {/* Streak badge */}
          {workoutProgress.streak > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
              borderRadius: '8px',
              padding: isMobile ? '0.3rem 0.5rem' : '0.4rem 0.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              border: '1px solid rgba(249, 115, 22, 0.15)',
              minHeight: '44px'
            }}>
              <TrendingUp size={isMobile ? 14 : 16} color="#f97316" />
              <span style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '700',
                color: '#f97316'
              }}>
                {workoutProgress.streak} dagen
              </span>
            </div>
          )}
        </div>

        {/* Urgency message */}
        {workoutsNeeded > 0 && challengeData.daysRemaining < 14 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
            borderRadius: '8px',
            border: '1px solid rgba(249, 115, 22, 0.15)',
            marginTop: '0.75rem'
          }}>
            <AlertCircle size={isMobile ? 14 : 16} color="#f97316" />
            <span style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: '600'
            }}>
              Nog {workoutsNeeded} workouts nodig in {challengeData.daysRemaining} dagen!
            </span>
          </div>
        )}
      </div>

      {/* Main Progress */}
      <div style={{
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0.6rem' : '0.75rem',
        background: 'rgba(23, 23, 23, 0.6)',
        borderRadius: '10px',
        border: '1px solid rgba(249, 115, 22, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            Voortgang Challenge
          </span>
          <span style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '700',
            color: '#f97316'
          }}>
            {workoutProgress.completed}/24 Workouts
          </span>
        </div>
        
        {/* Progress bar */}
        <div style={{
          height: '6px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '0.4rem',
          border: '1px solid rgba(249, 115, 22, 0.1)'
        }}>
          <div style={{
            height: '100%',
            width: `${workoutProgress.percentage}%`,
            background: workoutProgress.percentage >= 90 
              ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
              : workoutProgress.percentage >= 70
                ? 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)'
                : 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: workoutProgress.percentage >= 90 
              ? '0 0 15px rgba(16, 185, 129, 0.5)'
              : '0 0 10px rgba(249, 115, 22, 0.3)'
          }} />
        </div>
        
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center'
        }}>
          {workoutProgress.percentage.toFixed(0)}% Voltooid
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: isMobile ? '0.4rem' : '0.6rem'
      }}>
        <div style={{
          background: 'rgba(23, 23, 23, 0.6)',
          borderRadius: '10px',
          padding: isMobile ? '0.6rem 0.4rem' : '0.75rem',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          minHeight: '44px'
        }}>
          <Calendar size={isMobile ? 14 : 16} color="#f97316" style={{ marginBottom: '0.25rem' }} />
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '800',
            color: '#f97316',
            marginBottom: '0.1rem'
          }}>
            {workoutProgress.thisWeek}
          </div>
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            Deze Week
          </div>
        </div>

        <div style={{
          background: 'rgba(23, 23, 23, 0.6)',
          borderRadius: '10px',
          padding: isMobile ? '0.6rem 0.4rem' : '0.75rem',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          minHeight: '44px'
        }}>
          <CheckCircle size={isMobile ? 14 : 16} color="#10b981" style={{ marginBottom: '0.25rem' }} />
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '800',
            color: '#10b981',
            marginBottom: '0.1rem'
          }}>
            {workoutProgress.completed}
          </div>
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            Totaal
          </div>
        </div>

        <div style={{
          background: 'rgba(23, 23, 23, 0.6)',
          borderRadius: '10px',
          padding: isMobile ? '0.6rem 0.4rem' : '0.75rem',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          minHeight: '44px'
        }}>
          <Target size={isMobile ? 14 : 16} color="#f97316" style={{ marginBottom: '0.25rem' }} />
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '800',
            color: '#f97316',
            marginBottom: '0.1rem'
          }}>
            {workoutsNeeded}
          </div>
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            Te Gaan
          </div>
        </div>
      </div>
    </div>
  )
}
