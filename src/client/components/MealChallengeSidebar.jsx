// src/client/components/MealChallengeSidebar.jsx
// ✅ PREMIUM v5.0 - Clean Black + Green Accents
// 🎯 LESS GREEN, MORE BLACK, STRATEGIC ACCENTS
import { useState, useEffect } from 'react'
import { Utensils, X, Trophy, TrendingUp, Calendar, CheckCircle, Target, AlertCircle, Clock, Apple } from 'lucide-react'

export default function MealChallengeSidebar({ client, db }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showBadge, setShowBadge] = useState(false)
  const [challengeData, setChallengeData] = useState(null)
  const [lastLog, setLastLog] = useState(null)
  const [mealProgress, setMealProgress] = useState({
    completed: 0,
    required: 45,
    percentage: 0,
    thisWeek: 0,
    streak: 0,
    todayComplete: false
  })

  useEffect(() => {
    checkChallengeAndProgress()
    const interval = setInterval(checkChallengeAndProgress, 30000)
    return () => clearInterval(interval)
  }, [client?.id])

  const checkChallengeAndProgress = async () => {
    if (!client?.id || !db) return

    try {
      // Check active challenge
      const { data: challenge, error } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .eq('challenge_type', '8week')
        .maybeSingle()

      if (error || !challenge) {
        setShowBadge(false)
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

      // Load meal progress
      const { data: mealDays } = await db.supabase
        .from('ai_meal_progress')
        .select('date, meals_consumed, manual_intake, completion_percentage')
        .eq('client_id', client.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      // Count tracked days
      const trackedDays = mealDays?.filter(day => 
        day.meals_consumed > 0 ||
        day.manual_intake !== null ||
        day.completion_percentage > 0
      ) || []

      const uniqueDays = [...new Set(trackedDays.map(m => m.date))]
      const completedCount = uniqueDays.length

      // This week meals
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const thisWeekMeals = trackedDays.filter(m => 
        new Date(m.date) >= weekStart
      ).length

      // Check today
      const todayStr = today.toISOString().split('T')[0]
      const todayMeal = trackedDays.find(m => m.date === todayStr)
      const todayComplete = !!todayMeal

      // Calculate streak
      let streak = 0
      let checkDate = new Date(today)
      
      if (todayComplete) {
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

      setMealProgress({
        completed: completedCount,
        required: 45,
        percentage: Math.min(100, (completedCount / 45) * 100),
        thisWeek: thisWeekMeals,
        streak: streak,
        todayComplete: todayComplete
      })

      setChallengeData({
        currentWeek,
        daysRemaining,
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        isOnTrack: completedCount >= (currentWeek * 5)
      })

      setShowBadge(true)
      
      // Load last log
      await loadLastLog()
    } catch (error) {
      console.error('Error checking challenge:', error)
      setShowBadge(false)
    } finally {
      setLoading(false)
    }
  }

  const loadLastLog = async () => {
    try {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const { data: logs, error } = await db.supabase
        .from('ai_meal_progress')
        .select('*')
        .eq('client_id', client.id)
        .gte('date', twoDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(1)

      if (error || !logs || logs.length === 0) return

      const log = logs[0]
      
      // Calculate time ago
      const logDate = new Date(log.date)
      const now = new Date()
      const diffMs = now - logDate
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

      let timeAgo
      if (diffHours >= 24) {
        const days = Math.floor(diffHours / 24)
        timeAgo = `${days} dag${days > 1 ? 'en' : ''} geleden`
      } else if (diffHours > 0) {
        timeAgo = `${diffHours} uur geleden`
      } else {
        timeAgo = 'Vandaag'
      }

      setLastLog({
        calories: Math.round(log.consumed_calories || 0),
        protein: Math.round(log.consumed_protein || 0),
        mealsLogged: log.meals_consumed || 0,
        timeAgo
      })

    } catch (error) {
      console.error('Failed to load last log:', error)
    }
  }

  if (loading || !showBadge) return null

  const daysNeeded = Math.max(0, 45 - mealProgress.completed)
  const isOnTrack = challengeData?.isOnTrack
  const isEligible = mealProgress.completed >= 45

  return (
    <>
      {/* FLOATING BADGE - CLEAN GLASSMORPHIC */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            top: isMobile ? '90px' : '110px',
            right: isMobile ? '15px' : '20px',
            width: isMobile ? '56px' : '64px',
            height: isMobile ? '56px' : '64px',
            borderRadius: isMobile ? '12px' : '14px',
            background: isEligible
              ? 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: isEligible
              ? '1px solid rgba(254, 240, 138, 0.4)'
              : '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: isEligible
              ? '0 4px 20px rgba(254, 240, 138, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              : '0 4px 20px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.2rem',
            cursor: 'pointer',
            zIndex: 90,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            minWidth: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
            e.currentTarget.style.boxShadow = isEligible
              ? '0 8px 30px rgba(254, 240, 138, 0.4)'
              : '0 8px 30px rgba(16, 185, 129, 0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = isEligible
              ? '0 4px 20px rgba(254, 240, 138, 0.3)'
              : '0 4px 20px rgba(16, 185, 129, 0.25)'
          }}
        >
          {isEligible ? (
            <Trophy size={isMobile ? 22 : 26} color="#fef08a" style={{ filter: 'drop-shadow(0 0 8px rgba(254, 240, 138, 0.6))' }} />
          ) : (
            <Utensils size={isMobile ? 22 : 26} color="#10b981" style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' }} />
          )}
          <span style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            fontWeight: '800',
            color: isEligible ? '#fef08a' : '#10b981',
            textShadow: isEligible ? '0 0 10px rgba(254, 240, 138, 0.4)' : '0 0 10px rgba(16, 185, 129, 0.4)'
          }}>
            {mealProgress.completed}/45
          </span>
        </div>
      )}

      {/* SIDEBAR PANEL - CLEAN BLACK */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: isOpen ? 'flex' : 'none',
          justifyContent: 'flex-end',
          zIndex: 100,
          animation: 'fadeIn 0.3s ease'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: isMobile ? '85%' : '380px',
            maxWidth: '100vw',
            background: '#0a0a0a',
            borderLeft: `1px solid ${isEligible ? 'rgba(254, 240, 138, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isEligible
              ? '-10px 0 40px rgba(254, 240, 138, 0.2)'
              : '-10px 0 40px rgba(16, 185, 129, 0.2)'
          }}
        >
          {/* HEADER - CLEAN BLACK WITH GREEN BORDER */}
          <div style={{
            padding: isMobile ? '1.25rem' : '1.5rem',
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${isEligible ? 'rgba(254, 240, 138, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem'
              }}>
                <div style={{
                  width: isMobile ? '40px' : '44px',
                  height: isMobile ? '40px' : '44px',
                  borderRadius: '10px',
                  background: isEligible
                    ? 'rgba(254, 240, 138, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                  border: isEligible
                    ? '1px solid rgba(254, 240, 138, 0.3)'
                    : '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isEligible
                    ? '0 0 15px rgba(254, 240, 138, 0.3)'
                    : '0 0 15px rgba(16, 185, 129, 0.3)'
                }}>
                  {isEligible ? (
                    <Trophy size={isMobile ? 20 : 22} color="#fef08a" style={{ filter: 'drop-shadow(0 0 6px rgba(254, 240, 138, 0.6))' }} />
                  ) : (
                    <Target size={isMobile ? 20 : 22} color="#10b981" style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }} />
                  )}
                </div>
                <div>
                  <div style={{
                    fontSize: isMobile ? '1.15rem' : '1.25rem',
                    fontWeight: '800',
                    color: isEligible ? '#fef08a' : '#10b981',
                    letterSpacing: '-0.01em',
                    textShadow: isEligible
                      ? '0 0 15px rgba(254, 240, 138, 0.4)'
                      : '0 0 15px rgba(16, 185, 129, 0.4)'
                  }}>
                    8-Week Challenge
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontWeight: '600',
                    letterSpacing: '0.03em'
                  }}>
                    Week {challengeData?.currentWeek || 1} • {challengeData?.daysRemaining || 0} dagen over
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{
            padding: isMobile ? '1rem' : '1.25rem',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '1rem' : '1.25rem'
          }}>
            {/* MAIN PROGRESS - CLEAN BLACK CARD */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
              backdropFilter: 'blur(12px)',
              borderRadius: '14px',
              padding: isMobile ? '1rem' : '1.25rem',
              border: isEligible
                ? '1px solid rgba(254, 240, 138, 0.3)'
                : '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: isEligible
                ? '0 4px 20px rgba(254, 240, 138, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                : '0 4px 20px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Apple decoration - groot decoratief icoon rechtsboven */}
              <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-3%',
                opacity: 0.05
              }}>
                <Apple size={isMobile ? 120 : 150} color="#10b981" />
              </div>

              {/* Top glow line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: isEligible
                  ? 'linear-gradient(90deg, transparent 0%, #fef08a 50%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
                opacity: 0.6
              }} />

              <div style={{
                fontSize: isMobile ? '2.5rem' : '3rem',
                fontWeight: '800',
                color: isEligible ? '#fef08a' : '#10b981',
                textAlign: 'center',
                marginBottom: '0.5rem',
                textShadow: isEligible
                  ? '0 0 20px rgba(254, 240, 138, 0.4)'
                  : '0 0 20px rgba(16, 185, 129, 0.4)'
              }}>
                {mealProgress.completed}/45
              </div>
              
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                marginBottom: '1rem',
                fontWeight: '600'
              }}>
                Dagen gelogd
              </div>

              {/* Progress bar - ONLY GREEN ELEMENT */}
              <div style={{
                height: '10px',
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '0.75rem',
                border: '1px solid rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${mealProgress.percentage}%`,
                  background: isEligible
                    ? 'linear-gradient(90deg, #fef08a 0%, #fcd34d 100%)'
                    : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isEligible
                    ? '0 0 15px rgba(254, 240, 138, 0.6)'
                    : '0 0 15px rgba(16, 185, 129, 0.6)'
                }} />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '600'
                }}>
                  {Math.round(mealProgress.percentage)}% compleet
                </span>
                {!isEligible && (
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: '#10b981',
                    fontWeight: '700'
                  }}>
                    {daysNeeded} dagen te gaan
                  </span>
                )}
              </div>
            </div>

            {/* STATS GRID - CLEAN BLACK CARDS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: isMobile ? '0.625rem' : '0.75rem'
            }}>
              {/* This Week */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              }}>
                <Calendar size={isMobile ? 16 : 18} color="#10b981" style={{ marginBottom: '0.375rem', filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }} />
                <div style={{
                  fontSize: isMobile ? '1.25rem' : '1.4rem',
                  fontWeight: '800',
                  color: '#10b981',
                  marginBottom: '0.125rem'
                }}>
                  {mealProgress.thisWeek}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  fontWeight: '600'
                }}>
                  Deze Week
                </div>
              </div>

              {/* Streak */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              }}>
                <TrendingUp size={isMobile ? 16 : 18} color="#10b981" style={{ marginBottom: '0.375rem', filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }} />
                <div style={{
                  fontSize: isMobile ? '1.25rem' : '1.4rem',
                  fontWeight: '800',
                  color: '#10b981',
                  marginBottom: '0.125rem'
                }}>
                  {mealProgress.streak}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  fontWeight: '600'
                }}>
                  Dag Streak
                </div>
              </div>

              {/* On Track */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                border: `1px solid ${isOnTrack ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              }}>
                {isOnTrack ? (
                  <CheckCircle size={isMobile ? 16 : 18} color="#10b981" style={{ marginBottom: '0.375rem', filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }} />
                ) : (
                  <AlertCircle size={isMobile ? 16 : 18} color="#ef4444" style={{ marginBottom: '0.375rem', filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))' }} />
                )}
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '800',
                  color: isOnTrack ? '#10b981' : '#ef4444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em'
                }}>
                  {isOnTrack ? 'On Track' : 'Behind'}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  fontWeight: '600'
                }}>
                  Status
                </div>
              </div>
            </div>

            {/* TODAY COMPLETE BADGE */}
            {mealProgress.todayComplete && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.12) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={isMobile ? 18 : 20} color="#10b981" style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' }} />
                <span style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '800',
                  color: '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em'
                }}>
                  Vandaag Voltooid! 🎉
                </span>
              </div>
            )}

            {/* LAATSTE LOG - CLEAN BLACK CARD */}
            {lastLog && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Top glow */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
                  opacity: 0.6
                }} />

                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    width: isMobile ? '32px' : '36px',
                    height: isMobile ? '32px' : '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
                  }}>
                    <Apple 
                      size={isMobile ? 16 : 18} 
                      color="#10b981"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      fontWeight: '700',
                      color: '#10b981',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Laatste Log
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    <Clock size={isMobile ? 11 : 12} />
                    {lastLog.timeAgo}
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: isMobile ? '1.1rem' : '1.2rem',
                      fontWeight: '800',
                      color: '#10b981'
                    }}>
                      {lastLog.calories}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      kcal
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: isMobile ? '1.1rem' : '1.2rem',
                      fontWeight: '800',
                      color: '#10b981'
                    }}>
                      {lastLog.protein}g
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      Eiwit
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: isMobile ? '1.1rem' : '1.2rem',
                      fontWeight: '800',
                      color: '#10b981'
                    }}>
                      {lastLog.mealsLogged}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      Meals
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MONEY BACK UNLOCKED */}
            {isEligible && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                border: '1px solid rgba(254, 240, 138, 0.3)',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(254, 240, 138, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  marginBottom: '0.5rem'
                }}>
                  🏆
                </div>
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '800',
                  color: '#fef08a',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  textShadow: '0 0 15px rgba(254, 240, 138, 0.4)'
                }}>
                  Money Back Unlocked!
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginTop: '0.25rem'
                }}>
                  Je hebt het doel bereikt! 💪
                </div>
              </div>
            )}

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${isEligible ? 'rgba(254, 240, 138, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                borderRadius: '10px',
                color: isEligible ? '#fef08a' : '#10b981',
                fontWeight: '700',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                marginTop: 'auto',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isEligible
                  ? 'linear-gradient(135deg, rgba(254, 240, 138, 0.15) 0%, rgba(252, 211, 77, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)'
                e.currentTarget.style.border = isEligible
                  ? '1px solid rgba(254, 240, 138, 0.3)'
                  : '1px solid rgba(16, 185, 129, 0.3)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
                e.currentTarget.style.border = isEligible
                  ? '1px solid rgba(254, 240, 138, 0.2)'
                  : '1px solid rgba(16, 185, 129, 0.2)'
                e.currentTarget.style.transform = 'translateY(0)'
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
              <X size={18} />
              Sluit Challenge Info
            </button>
          </div>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
