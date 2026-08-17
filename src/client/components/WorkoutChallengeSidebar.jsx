// src/client/components/WorkoutChallengeSidebar.jsx
import { useState, useEffect } from 'react'
import { Dumbbell, X, Trophy, TrendingUp, Calendar, CheckCircle, Target, AlertCircle, Clock, Flame, Zap } from 'lucide-react'

export default function WorkoutChallengeSidebar({ client, db }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showBadge, setShowBadge] = useState(false)
  const [challengeData, setChallengeData] = useState(null)
  const [lastInsight, setLastInsight] = useState(null)
  const [workoutProgress, setWorkoutProgress] = useState({
    completed: 0,
    required: 24,
    percentage: 0,
    thisWeek: 0,
    streak: 0
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

      // Load workout completions
      const { data: workouts } = await db.supabase
        .from('workout_completions')
        .select('*')
        .eq('client_id', client.id)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .lte('workout_date', endDate.toISOString().split('T')[0])
        .eq('completed', true)
        .order('workout_date', { ascending: false })

      // This week workouts
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
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
        streak: streak
      })

      setChallengeData({
        currentWeek,
        daysRemaining,
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        isOnTrack: (workouts?.length || 0) >= (currentWeek * 3)
      })

      setShowBadge(true)
      
      // Load smart insight
      await analyzeProgressInsight()
    } catch (error) {
      console.error('Error checking challenge:', error)
      setShowBadge(false)
    } finally {
      setLoading(false)
    }
  }

  const analyzeProgressInsight = async () => {
    if (!client?.id || !db) return

    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const { data: sessions, error: sessionsError } = await db.supabase
        .from('workout_sessions')
        .select('id, completed_at')
        .eq('client_id', client.id)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: false })

      if (sessionsError || !sessions || sessions.length === 0) {
        return
      }

      const sessionIds = sessions.map(s => s.id)

      const { data: progressData, error: progressError } = await db.supabase
        .from('workout_progress')
        .select('*')
        .in('session_id', sessionIds)

      if (progressError || !progressData || progressData.length === 0) {
        return
      }

      const insights = []

      // Check for PR
      const exerciseProgress = {}
      progressData.forEach(record => {
        const exercise = record.exercise_name
        const sets = Array.isArray(record.sets) ? record.sets : []
        const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0), 0)
        
        if (!exerciseProgress[exercise]) {
          exerciseProgress[exercise] = []
        }
        
        exerciseProgress[exercise].push({
          date: sessions.find(s => s.id === record.session_id)?.completed_at,
          maxWeight,
          sessionId: record.session_id
        })
      })

      // Find biggest improvement
      let biggestImprovement = null
      Object.entries(exerciseProgress).forEach(([exercise, records]) => {
        if (records.length < 2) return
        
        records.sort((a, b) => new Date(a.date) - new Date(b.date))
        const firstWeight = records[0].maxWeight
        const lastWeight = records[records.length - 1].maxWeight
        const increase = lastWeight - firstWeight

        if (increase > 0) {
          if (!biggestImprovement || increase > biggestImprovement.increase) {
            biggestImprovement = {
              exercise,
              increase,
              from: firstWeight,
              to: lastWeight,
              date: records[records.length - 1].date
            }
          }
        }
      })

      if (biggestImprovement && biggestImprovement.increase >= 2.5) {
        const logTime = new Date(biggestImprovement.date)
        const timeAgo = getTimeAgo(logTime)

        insights.push({
          type: 'pr',
          icon: Flame,
          title: `${biggestImprovement.exercise}`,
          subtitle: `+${biggestImprovement.increase}kg PR!`,
          message: `${biggestImprovement.from}kg → ${biggestImprovement.to}kg`,
          color: '#f97316',
          timeAgo
        })
      }

      // Check for stagnation
      Object.entries(exerciseProgress).forEach(([exercise, records]) => {
        if (records.length < 3 || insights.length > 0) return
        
        const recent = records.slice(-3)
        const weights = recent.map(r => r.maxWeight)
        const allSame = weights.every(w => w === weights[0])

        if (allSame && weights[0] > 0) {
          const logTime = new Date(recent[recent.length - 1].date)
          const timeAgo = getTimeAgo(logTime)

          insights.push({
            type: 'stagnation',
            icon: Target,
            title: exercise,
            subtitle: 'Tijd voor progressie!',
            message: `3x ${weights[0]}kg - verhoog gewicht`,
            color: '#3b82f6',
            timeAgo
          })
        }
      })

      // Check for streak
      if (insights.length === 0 && workoutProgress.streak >= 3) {
        insights.push({
          type: 'streak',
          icon: Zap,
          title: `${workoutProgress.streak} dagen streak!`,
          subtitle: 'Onverslaanbaar',
          message: 'Deze consistentie betaalt zich uit 🔥',
          color: '#10b981',
          timeAgo: 'Nu'
        })
      }

      if (insights.length > 0) {
        setLastInsight(insights[0])
      }
    } catch (error) {
      console.error('Error analyzing insights:', error)
    }
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Nu'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}u`
    return `${Math.floor(seconds / 86400)}d`
  }

  if (loading || !showBadge) return null

  const workoutsNeeded = Math.max(0, workoutProgress.required - workoutProgress.completed)
  const isOnTrack = challengeData?.isOnTrack

  return (
    <>
      {/* FLOATING BADGE - COMPACT */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            top: isMobile ? '70px' : '80px',
            right: isMobile ? '0.625rem' : '1rem',
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
            backdropFilter: 'blur(12px)',
            border: '2px solid rgba(249, 115, 22, 0.4)',
            borderRadius: '10px',
            padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.75rem',
            cursor: 'pointer',
            zIndex: 999,
            boxShadow: '0 6px 24px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minWidth: isMobile ? '48px' : '56px',
            minHeight: '44px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateX(-4px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(249, 115, 22, 0.45)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateX(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(249, 115, 22, 0.3)'
            }
          }}
          onTouchStart={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(0.95)'
          }}
          onTouchEnd={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <Trophy size={isMobile ? 16 : 18} color="#f97316" />
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '800',
            color: '#f97316',
            lineHeight: 1
          }}>
            {Math.round(workoutProgress.percentage)}%
          </div>
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.6rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.03em'
          }}>
            W{challengeData?.currentWeek}
          </div>
        </button>
      )}

      {/* BACKDROP */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 999,
            animation: 'fadeIn 0.3s ease',
            cursor: 'pointer'
          }}
        />
      )}

      {/* SIDEBAR PANEL - COMPACT SLIDER */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : isMobile ? '-85%' : '-360px',
        width: isMobile ? '85%' : '360px',
        maxWidth: isMobile ? '85vw' : '360px',
        height: '100vh',
        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.98) 0%, rgba(0, 0, 0, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(249, 115, 22, 0.2)',
        boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
        transition: 'right 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
        overflowY: 'auto',
        animation: isOpen ? 'fadeIn 0.3s ease' : 'none'
      }}>
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.875rem' : '1rem',
          minHeight: '100%'
        }}>
          {/* HEADER - COMPACT */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            paddingBottom: isMobile ? '0.875rem' : '1rem',
            borderBottom: '1px solid rgba(249, 115, 22, 0.15)'
          }}>
            <div style={{
              width: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.15) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)'
            }}>
              <Trophy size={isMobile ? 20 : 22} color="#f97316" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '800',
                color: 'white',
                margin: 0,
                marginBottom: '0.125rem',
                letterSpacing: '-0.02em'
              }}>
                8-Week Challenge
              </h3>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                Week {challengeData?.currentWeek} • {challengeData?.daysRemaining}d resterend
              </div>
            </div>
          </div>

          {/* PROGRESS BAR - COMPACT */}
          <div style={{
            background: 'rgba(23, 23, 23, 0.6)',
            borderRadius: '10px',
            padding: isMobile ? '0.875rem' : '1rem',
            border: '1px solid rgba(249, 115, 22, 0.15)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.625rem'
            }}>
              <span style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '700'
              }}>
                Voortgang
              </span>
              <span style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '800',
                color: '#f97316'
              }}>
                {workoutProgress.completed}/{workoutProgress.required}
              </span>
            </div>
            
            {/* Progress bar */}
            <div style={{
              height: '8px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid rgba(249, 115, 22, 0.1)',
              position: 'relative'
            }}>
              <div style={{
                width: `${workoutProgress.percentage}%`,
                height: '100%',
                background: workoutProgress.percentage >= 90
                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                  : workoutProgress.percentage >= 70
                  ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                  : 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)',
                borderRadius: '6px',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: workoutProgress.percentage >= 90 
                  ? '0 0 15px rgba(16, 185, 129, 0.6)'
                  : '0 0 12px rgba(249, 115, 22, 0.4)'
              }} />
            </div>
            
            <div style={{
              marginTop: '0.625rem',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: isOnTrack ? '#10b981' : '#f97316',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {isOnTrack ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
              {isOnTrack ? 'On Track! 🔥' : 'Inhalen nodig'}
            </div>
          </div>

          {/* STATS GRID - COMPACT */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: isMobile ? '0.5rem' : '0.625rem'
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
              <Zap size={isMobile ? 14 : 16} color="#fbbf24" style={{ marginBottom: '0.25rem' }} />
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '800',
                color: '#fbbf24',
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
              border: '1px solid rgba(249, 115, 22, 0.1)',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              minHeight: '44px'
            }}>
              <Flame size={isMobile ? 14 : 16} color="#10b981" style={{ marginBottom: '0.25rem' }} />
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '800',
                color: '#10b981',
                marginBottom: '0.1rem'
              }}>
                {workoutProgress.streak}
              </div>
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.65rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600'
              }}>
                Streak
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

          {/* LATEST INSIGHT - COMPACT */}
          {lastInsight && (
            <div style={{
              marginBottom: isMobile ? '0.75rem' : '1rem',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: `linear-gradient(135deg, ${lastInsight.color}20 0%, ${lastInsight.color}10 100%)`,
              borderRadius: '10px',
              border: `1px solid ${lastInsight.color}40`,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 2px 16px ${lastInsight.color}20`,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = `0 4px 20px ${lastInsight.color}30`
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = `0 2px 16px ${lastInsight.color}20`
              }
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)'
            }}
            >
              {/* Top glow */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, transparent 0%, ${lastInsight.color} 50%, transparent 100%)`,
                opacity: 0.6
              }} />

              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.625rem'
              }}>
                <div style={{
                  width: isMobile ? '32px' : '36px',
                  height: isMobile ? '32px' : '36px',
                  borderRadius: '8px',
                  background: `${lastInsight.color}25`,
                  border: `1px solid ${lastInsight.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 12px ${lastInsight.color}30`
                }}>
                  <lastInsight.icon 
                    size={isMobile ? 15 : 17} 
                    color={lastInsight.color}
                    style={{ filter: `drop-shadow(0 0 4px ${lastInsight.color}60)` }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    fontWeight: '700',
                    color: lastInsight.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {lastInsight.type === 'pr' ? 'Personal Record' : 
                     lastInsight.type === 'streak' ? 'Actieve Streak' : 
                     'Progressie Tip'}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  <Clock size={isMobile ? 10 : 11} />
                  {lastInsight.timeAgo}
                </div>
              </div>

              {/* Insight details */}
              <div style={{
                fontSize: isMobile ? '0.9rem' : '0.975rem',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '0.25rem',
                letterSpacing: '-0.02em'
              }}>
                {lastInsight.title}
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: '700',
                color: lastInsight.color,
                marginBottom: '0.25rem',
                textShadow: `0 0 12px ${lastInsight.color}40`
              }}>
                {lastInsight.subtitle}
              </div>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '600'
              }}>
                {lastInsight.message}
              </div>
            </div>
          )}

          {/* CLOSE BUTTON - COMPACT */}
          <button
            onClick={() => setIsOpen(false)}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(23, 23, 23, 0.8)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '10px',
              color: '#f97316',
              fontWeight: '700',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
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
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%)'
              e.currentTarget.style.border = '1px solid rgba(249, 115, 22, 0.3)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(23, 23, 23, 0.8)'
              e.currentTarget.style.border = '1px solid rgba(249, 115, 22, 0.2)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <X size={16} />
            Sluit Challenge Info
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
