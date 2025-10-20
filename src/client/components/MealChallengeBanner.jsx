// src/client/components/MealChallengeBanner.jsx
import React, { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Calendar, CheckCircle, Target, Zap, Lock, Unlock, Apple, Utensils } from 'lucide-react'

export default function MealChallengeBanner({ client, db }) {
  const isMobile = window.innerWidth <= 768
  const [showBanner, setShowBanner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [challengeData, setChallengeData] = useState(null)
  const [mealProgress, setMealProgress] = useState({
    completed: 0,
    required: 45,
    percentage: 0,
    streak: 0,
    todayComplete: false,
    isEligible: false
  })

  useEffect(() => {
    if (client?.id) {
      checkChallengeAndProgress()
    }
  }, [client?.id])

  const checkChallengeAndProgress = async () => {
    if (!client?.id || !db) return

    try {
      // Check for active 8-week challenge
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

      // Calculate dates
      const startDate = new Date(challenge.start_date)
      const endDate = new Date(challenge.end_date)
      const today = new Date()
      const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
      const currentWeek = Math.min(8, Math.floor(daysSinceStart / 7) + 1)
      const daysRemaining = Math.max(0, Math.floor((endDate - today) / (1000 * 60 * 60 * 24)))

      // FIXED: Load meal progress with correct logic
      const { data: mealDays } = await db.supabase
        .from('ai_meal_progress')
        .select('date, meals_consumed, manual_intake, completion_percentage')
        .eq('client_id', client.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      // FIXED: Count ANY day with tracking (matches ChallengeHomeBanner logic)
      const trackedDays = mealDays?.filter(day => 
        day.meals_consumed > 0 ||           // Has checked meals
        day.manual_intake !== null ||       // Has manual input
        day.completion_percentage > 0       // Has any completion
      ) || []

      // Get unique days
      const uniqueDays = [...new Set(trackedDays.map(m => m.date))]
      const completedCount = uniqueDays.length

      // Check today's status
      const todayStr = today.toISOString().split('T')[0]
      const todayMeal = trackedDays.find(m => m.date === todayStr)
      const todayComplete = !!todayMeal

      // Calculate streak (consecutive days from today backwards)
      let streak = 0
      let checkDate = new Date(today)
      
      if (todayComplete) {
        // Start from today if complete
        while (streak < 56) {
          const dateStr = checkDate.toISOString().split('T')[0]
          const hasDay = uniqueDays.includes(dateStr)
          
          if (hasDay) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
      } else {
        // Start from yesterday if today incomplete
        checkDate.setDate(checkDate.getDate() - 1)
        while (streak < 56) {
          const dateStr = checkDate.toISOString().split('T')[0]
          const hasDay = uniqueDays.includes(dateStr)
          
          if (hasDay) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
      }

      // Check eligibility for money back
      const isEligible = completedCount >= 45

      setMealProgress({
        completed: completedCount,
        required: 45,
        percentage: Math.min(100, (completedCount / 45) * 100),
        streak: streak,
        todayComplete: todayComplete,
        isEligible: isEligible
      })

      setChallengeData({
        currentWeek,
        daysRemaining,
        startDate: challenge.start_date,
        endDate: challenge.end_date
      })

      setShowBanner(true)
    } catch (error) {
      console.error('Error checking challenge:', error)
      setShowBanner(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !showBanner) return null

  const daysNeeded = Math.max(0, 45 - mealProgress.completed)
  const isEligible = mealProgress.isEligible

  return (
    <div style={{
      background: 'rgba(17, 17, 17, 0.6)',
      borderRadius: isMobile ? '14px' : '16px',
      padding: isMobile ? '1rem' : '1.25rem',
      marginBottom: '1rem',
      border: isEligible 
        ? '1px solid rgba(254, 240, 138, 0.25)'
        : '1px solid rgba(16, 185, 129, 0.15)',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}>
      {/* Subtle green overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isEligible
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.02) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Header - Compact */}
      <div style={{ 
        marginBottom: isMobile ? '0.75rem' : '1rem', 
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '700',
            color: isEligible ? '#fef08a' : '#10b981',
            marginBottom: '0.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Utensils size={isMobile ? 18 : 20} />
            Nutrition Challenge
          </h3>
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '500'
          }}>
            Week {challengeData.currentWeek}/8 • {daysNeeded > 0 ? `${daysNeeded} dagen nodig` : 'Doel bereikt!'}
          </p>
        </div>
        
        {/* Today indicator */}
        {mealProgress.todayComplete && (
          <div style={{
            padding: '0.3rem 0.6rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <CheckCircle size={12} color="#10b981" />
            <span style={{
              fontSize: '0.65rem',
              color: '#10b981',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Vandaag
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar - Direct, no container */}
      <div style={{ marginBottom: isMobile ? '0.875rem' : '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.4rem'
        }}>
          <span style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            Voortgang
          </span>
          <span style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '700',
            color: isEligible ? '#fef08a' : '#10b981'
          }}>
            {mealProgress.completed}/45
          </span>
        </div>
        
        {/* Progress bar */}
        <div style={{
          height: '6px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '3px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(16, 185, 129, 0.1)'
        }}>
          <div style={{
            height: '100%',
            width: `${mealProgress.percentage}%`,
            background: isEligible
              ? 'linear-gradient(90deg, #fef08a 0%, #facc15 100%)'
              : mealProgress.percentage >= 70
                ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isEligible 
              ? '0 0 10px rgba(254, 240, 138, 0.4)'
              : '0 0 10px rgba(16, 185, 129, 0.3)'
          }} />
        </div>
        
        {/* Percentage */}
        <div style={{
          marginTop: '0.3rem',
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(255, 255, 255, 0.4)',
          textAlign: 'right'
        }}>
          {mealProgress.percentage.toFixed(0)}% compleet
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {/* Streak */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          padding: isMobile ? '0.5rem' : '0.625rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center',
          backdropFilter: 'blur(5px)',
          minHeight: '44px'
        }}>
          <Zap size={isMobile ? 14 : 16} color="#fef08a" style={{ marginBottom: '0.2rem', opacity: 0.8 }} />
          <div style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: 'white',
            lineHeight: 1
          }}>
            {mealProgress.streak}
          </div>
          <div style={{
            fontSize: '0.55rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
            marginTop: '0.1rem'
          }}>
            Streak
          </div>
        </div>

        {/* Complete */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          padding: isMobile ? '0.5rem' : '0.625rem',
          border: '1px solid rgba(16, 185, 129, 0.1)',
          textAlign: 'center',
          backdropFilter: 'blur(5px)',
          minHeight: '44px'
        }}>
          <CheckCircle size={isMobile ? 14 : 16} color="#10b981" style={{ marginBottom: '0.2rem', opacity: 0.8 }} />
          <div style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: '#10b981',
            lineHeight: 1
          }}>
            {mealProgress.completed}
          </div>
          <div style={{
            fontSize: '0.55rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
            marginTop: '0.1rem'
          }}>
            Dagen
          </div>
        </div>

        {/* Target */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          padding: isMobile ? '0.5rem' : '0.625rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center',
          backdropFilter: 'blur(5px)',
          minHeight: '44px'
        }}>
          <Target size={isMobile ? 14 : 16} color="rgba(255, 255, 255, 0.5)" style={{ marginBottom: '0.2rem', opacity: 0.8 }} />
          <div style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1
          }}>
            {daysNeeded}
          </div>
          <div style={{
            fontSize: '0.55rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
            marginTop: '0.1rem'
          }}>
            Te Gaan
          </div>
        </div>

        {/* Days remaining */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          padding: isMobile ? '0.5rem' : '0.625rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center',
          backdropFilter: 'blur(5px)',
          minHeight: '44px'
        }}>
          <Calendar size={isMobile ? 14 : 16} color="rgba(255, 255, 255, 0.5)" style={{ marginBottom: '0.2rem', opacity: 0.8 }} />
          <div style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1
          }}>
            {challengeData.daysRemaining}
          </div>
          <div style={{
            fontSize: '0.55rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
            marginTop: '0.1rem'
          }}>
            Dagen
          </div>
        </div>
      </div>

      {/* Eligible message - Only when unlocked */}
      {isEligible && (
        <div style={{
          marginTop: isMobile ? '0.75rem' : '1rem',
          padding: '0.5rem',
          background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.15) 0%, rgba(254, 240, 138, 0.05) 100%)',
          borderRadius: '8px',
          border: '1px solid rgba(254, 240, 138, 0.2)',
          textAlign: 'center'
        }}>
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: '#fef08a',
            fontWeight: '600',
            letterSpacing: '0.05em'
          }}>
            🏆 MONEY BACK UNLOCKED
          </span>
        </div>
      )}
    </div>
  )
}
