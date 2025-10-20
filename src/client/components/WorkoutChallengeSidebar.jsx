// src/client/components/WorkoutChallengeSidebar.jsx
import { useState, useEffect } from 'react'
import { Dumbbell, X, Trophy, TrendingUp, Calendar, CheckCircle, Target, AlertCircle, Clock } from 'lucide-react'

export default function WorkoutChallengeSidebar({ client, db }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showBadge, setShowBadge] = useState(false)
  const [challengeData, setChallengeData] = useState(null)
  const [lastLog, setLastLog] = useState(null)
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
      // Get last 2 days of sessions
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const { data: sessions, error: sessionsError } = await db.supabase
        .from('workout_sessions')
        .select('id, completed_at')
        .eq('client_id', client.id)
        .gte('completed_at', twoDaysAgo.toISOString())
        .order('completed_at', { ascending: false })
        .limit(1)

      if (sessionsError || !sessions || sessions.length === 0) {
        return
      }

      // Get progress from that session
      const { data: progressData, error: progressError } = await db.supabase
        .from('workout_progress')
        .select('*')
        .eq('session_id', sessions[0].id)
        .limit(1)

      if (progressError || !progressData || progressData.length === 0) {
        return
      }

      const record = progressData[0]
      const sets = Array.isArray(record.sets) ? record.sets : []
      
      if (sets.length === 0) return

      // Get heaviest set
      const heaviestSet = sets.reduce((max, set) => {
        const weight = parseFloat(set.weight) || 0
        return weight > (parseFloat(max.weight) || 0) ? set : max
      }, sets[0])

      // Calculate time ago
      const logTime = new Date(sessions[0].completed_at)
      const now = new Date()
      const diffMs = now - logTime
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMins = Math.floor(diffMs / (1000 * 60))

      let timeAgo
      if (diffHours >= 24) {
        const days = Math.floor(diffHours / 24)
        timeAgo = `${days} dag${days > 1 ? 'en' : ''} geleden`
      } else if (diffHours > 0) {
        timeAgo = `${diffHours} uur geleden`
      } else if (diffMins > 0) {
        timeAgo = `${diffMins} min geleden`
      } else {
        timeAgo = 'Net gelogd'
      }

      setLastLog({
        exercise: record.exercise_name,
        weight: parseFloat(heaviestSet.weight) || 0,
        reps: parseInt(heaviestSet.reps) || 0,
        timeAgo
      })

    } catch (error) {
      console.error('Failed to load last log:', error)
    }
  }

  if (loading || !showBadge) return null

  const workoutsNeeded = Math.max(0, 24 - workoutProgress.completed)
  const isOnTrack = challengeData?.isOnTrack

  return (
    <>
      {/* FLOATING BADGE - Alleen tonen als sidebar DICHT is */}
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
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            boxShadow: '0 4px 20px rgba(249, 115, 22, 0.25)',
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
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(249, 115, 22, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.25)'
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
          <Dumbbell 
            size={isMobile ? 20 : 24} 
            color="#f97316"
          />
          <span style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
            color: '#f97316'
          }}>
            {workoutProgress.completed}/{workoutProgress.required}
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
          borderLeft: '1px solid rgba(249, 115, 22, 0.25)',
          boxShadow: '-4px 0 40px rgba(249, 115, 22, 0.15)',
          transition: 'right 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 89,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Dumbbell decoration */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-3%',
          opacity: 0.03,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <Dumbbell size={isMobile ? 120 : 150} color="#f97316" />
        </div>

        {/* Content wrapper */}
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
                    {workoutProgress.streak}d
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
                  Nog {workoutsNeeded} workouts in {challengeData.daysRemaining} dagen!
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

          {/* LAATSTE LOG SECTIE - NIEUW */}
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
                  <Dumbbell 
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

              {/* Exercise details */}
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '0.35rem',
                letterSpacing: '-0.02em'
              }}>
                {lastLog.exercise}
              </div>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                color: '#10b981',
                textShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
              }}>
                {lastLog.weight}kg × {lastLog.reps} reps
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
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '10px',
              color: '#f97316',
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
