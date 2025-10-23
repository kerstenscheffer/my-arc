// src/client/components/MealChallengeSidebar.jsx
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
        .single()

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
      {/* FLOATING BADGE */}
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
              ? 'linear-gradient(135deg, rgba(254, 240, 138, 0.25) 0%, rgba(252, 211, 77, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            border: isEligible
              ? '1px solid rgba(254, 240, 138, 0.4)'
              : '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: isEligible
              ? '0 4px 20px rgba(254, 240, 138, 0.3)'
              : '0 4px 20px rgba(16, 185, 129, 0.25)',
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
              ? '0 8px 30px rgba(254, 240, 138, 0.5)'
              : '0 8px 30px rgba(16, 185, 129, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = isEligible
              ? '0 4px 20px rgba(254, 240, 138, 0.3)'
              : '0 4px 20px rgba(16, 185, 129, 0.25)'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <Utensils 
            size={isMobile ? 20 : 24} 
            color={isEligible ? '#fef08a' : '#10b981'}
          />
          <span style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
            color: isEligible ? '#fef08a' : '#10b981'
          }}>
            {mealProgress.completed}/{mealProgress.required}
          </span>
        </div>
      )}

      {/* MOBILE OVERLAY */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 88,
            animation: 'fadeIn 0.3s ease',
            touchAction: 'manipulation'
          }}
        />
      )}

      {/* SIDEBAR */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? '0' : '-100%',
          width: isMobile ? '85%' : '360px',
          maxWidth: '360px',
          height: '100vh',
          background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderLeft: isEligible
            ? '1px solid rgba(254, 240, 138, 0.3)'
            : '1px solid rgba(16, 185, 129, 0.25)',
          boxShadow: isEligible
            ? '-4px 0 40px rgba(254, 240, 138, 0.2)'
            : '-4px 0 40px rgba(16, 185, 129, 0.15)',
          transition: 'right 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex:889,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Decoration */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-3%',
          opacity: 0.03,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <Apple size={isMobile ? 120 : 150} color={isEligible ? '#fef08a' : '#10b981'} />
        </div>

        {/* Content */}
        <div style={{ 
          position: 'relative', 
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          {/* HEADER */}
          <div style={{
            marginBottom: isMobile ? '1rem' : '1.25rem'
          }}>
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
                  color: isEligible ? '#fef08a' : '#10b981',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  letterSpacing: '-0.02em'
                }}>
                  <Trophy size={isMobile ? 18 : 22} />
                  Nutrition Challenge
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
                    Week {challengeData?.currentWeek} van 8
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
              {mealProgress.streak > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                  borderRadius: '8px',
                  padding: isMobile ? '0.3rem 0.5rem' : '0.4rem 0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  minHeight: '44px'
                }}>
                  <TrendingUp size={isMobile ? 14 : 16} color="#10b981" />
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    {mealProgress.streak}d
                  </span>
                </div>
              )}
            </div>

            {/* Urgency message */}
            {daysNeeded > 0 && challengeData.daysRemaining < 14 && (
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
                  Nog {daysNeeded} dagen in {challengeData.daysRemaining} dagen!
                </span>
              </div>
            )}
          </div>

          {/* PROGRESS SECTION */}
          <div style={{
            marginBottom: isMobile ? '1rem' : '1.25rem',
            padding: isMobile ? '0.6rem' : '0.75rem',
            background: 'rgba(23, 23, 23, 0.6)',
            borderRadius: '10px',
            border: `1px solid ${isEligible ? 'rgba(254, 240, 138, 0.15)' : 'rgba(16, 185, 129, 0.1)'}`,
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
                color: isEligible ? '#fef08a' : '#10b981'
              }}>
                {mealProgress.completed}/45 Dagen
              </span>
            </div>
            
            {/* Progress bar */}
            <div style={{
              height: '6px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '0.4rem',
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
                  ? '0 0 15px rgba(254, 240, 138, 0.5)'
                  : '0 0 10px rgba(16, 185, 129, 0.3)'
              }} />
            </div>
            
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.5)',
              textAlign: 'center'
            }}>
              {mealProgress.percentage.toFixed(0)}% Voltooid
            </div>
          </div>

          {/* STATS GRID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: isMobile ? '0.4rem' : '0.6rem',
            marginBottom: isMobile ? '1rem' : '1.25rem'
          }}>
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)',
              borderRadius: '10px',
              padding: isMobile ? '0.6rem 0.4rem' : '0.75rem',
              border: '1px solid rgba(16, 185, 129, 0.1)',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              minHeight: '44px'
            }}>
              <Calendar size={isMobile ? 14 : 16} color="#10b981" style={{ marginBottom: '0.25rem' }} />
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '800',
                color: '#10b981',
                marginBottom: '0.1rem'
              }}>
                {mealProgress.thisWeek}
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
                {mealProgress.completed}
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
              border: '1px solid rgba(16, 185, 129, 0.1)',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              minHeight: '44px'
            }}>
              <Target size={isMobile ? 14 : 16} color={isEligible ? '#fef08a' : '#10b981'} style={{ marginBottom: '0.25rem' }} />
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '800',
                color: isEligible ? '#fef08a' : '#10b981',
                marginBottom: '0.1rem'
              }}>
                {daysNeeded}
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

          {/* TODAY STATUS */}
          {mealProgress.todayComplete && (
            <div style={{
              marginBottom: isMobile ? '1rem' : '1.25rem',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%)',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backdropFilter: 'blur(10px)'
            }}>
              <CheckCircle size={isMobile ? 18 : 20} color="#10b981" />
              <span style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: '#10b981',
                fontWeight: '700'
              }}>
                Vandaag Voltooid! 🎉
              </span>
            </div>
          )}

          {/* LAATSTE LOG */}
          {lastLog && (
            <div style={{
              marginBottom: isMobile ? '1rem' : '1.25rem',
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
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
                  background: 'rgba(16, 185, 129, 0.2)',
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
              marginBottom: isMobile ? '1rem' : '1.25rem',
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.2) 0%, rgba(252, 211, 77, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(254, 240, 138, 0.3)',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(254, 240, 138, 0.2)'
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
                textTransform: 'uppercase'
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
              background: 'rgba(23, 23, 23, 0.8)',
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
              marginTop: 'auto'
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
              e.currentTarget.style.background = 'rgba(23, 23, 23, 0.8)'
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
