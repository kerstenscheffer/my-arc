// src/coach/pages/challenge-monitor/WorkoutProgressView.jsx
import { useState, useEffect } from 'react'
import { Dumbbell, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react'

export default function WorkoutProgressView({ client, db, challengeData }) {
  const isMobile = window.innerWidth <= 768
  const [workoutData, setWorkoutData] = useState({
    total: 0,
    completed: [],
    byWeek: {},
    streak: 0,
    compliance: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkoutData()
  }, [client?.id, challengeData])

  async function loadWorkoutData() {
    if (!client?.id || !challengeData) return

    try {
      const startDate = new Date(challengeData.start_date)
      const endDate = new Date(challengeData.end_date)
      
      // Load all workout completions
      const { data: workouts } = await db.supabase
        .from('workout_completions')
        .select('*')
        .eq('client_id', client.id)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .lte('workout_date', endDate.toISOString().split('T')[0])
        .order('workout_date', { ascending: true })

      // Process by week
      const byWeek = {}
      for (let week = 1; week <= 8; week++) {
        byWeek[week] = []
      }

      workouts?.forEach(workout => {
        const workoutDate = new Date(workout.workout_date)
        const daysSinceStart = Math.floor((workoutDate - startDate) / (1000 * 60 * 60 * 24))
        const weekNum = Math.min(8, Math.floor(daysSinceStart / 7) + 1)
        
        if (workout.completed) {
          byWeek[weekNum].push({
            date: workout.workout_date,
            dayOfWeek: workoutDate.toLocaleDateString('nl-NL', { weekday: 'short' })
          })
        }
      })

      // Calculate streak
      let streak = 0
      const today = new Date()
      const completedDates = workouts
        ?.filter(w => w.completed)
        .map(w => w.workout_date)
        .sort((a, b) => new Date(b) - new Date(a)) || []

      for (let i = 0; i < completedDates.length; i++) {
        const expectedDate = new Date(today)
        expectedDate.setDate(today.getDate() - i)
        
        if (completedDates[i] === expectedDate.toISOString().split('T')[0]) {
          streak++
        } else {
          break
        }
      }

      const totalCompleted = workouts?.filter(w => w.completed).length || 0
      const compliance = Math.round((totalCompleted / 24) * 100)

      setWorkoutData({
        total: totalCompleted,
        completed: workouts?.filter(w => w.completed) || [],
        byWeek,
        streak,
        compliance
      })
    } catch (error) {
      console.error('Error loading workout data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Loading workout data...
      </div>
    )
  }

  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      border: '1px solid rgba(249, 115, 22, 0.2)'
    }}>
      {/* Header Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Dumbbell size={20} color="#f97316" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {workoutData.total}/24
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Workouts
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <CheckCircle size={20} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {workoutData.compliance}%
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Compliance
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <TrendingUp size={20} color="#fbbf24" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {workoutData.streak}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Day Streak
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Calendar size={20} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {Math.round(workoutData.total / challengeData.currentWeek * 10) / 10}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Per Week
          </div>
        </div>
      </div>

      {/* Week by Week Breakdown */}
      <div>
        <h3 style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar size={18} />
          Week by Week Progress
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(week => {
            const weekWorkouts = workoutData.byWeek[week] || []
            const isCurrentWeek = week === challengeData.currentWeek
            const isPastWeek = week < challengeData.currentWeek
            const expectedWorkouts = 3 // 3 per week minimum
            const isCompliant = weekWorkouts.length >= expectedWorkouts

            return (
              <div
                key={week}
                style={{
                  background: isCurrentWeek 
                    ? 'rgba(249, 115, 22, 0.1)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: isMobile ? '0.875rem' : '1rem',
                  border: `1px solid ${isCurrentWeek 
                    ? 'rgba(249, 115, 22, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: weekWorkouts.length > 0 ? '0.75rem' : 0
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: '600',
                      color: isCurrentWeek ? '#f97316' : '#fff'
                    }}>
                      Week {week}
                    </span>
                    {isCurrentWeek && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.4rem',
                        background: 'rgba(249, 115, 22, 0.2)',
                        borderRadius: '4px',
                        color: '#fb923c',
                        fontWeight: '600'
                      }}>
                        CURRENT
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      fontWeight: '600',
                      color: weekWorkouts.length >= expectedWorkouts ? '#10b981' : '#fff'
                    }}>
                      {weekWorkouts.length}/3
                    </span>
                    {isPastWeek && (
                      isCompliant ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <XCircle size={16} color="#ef4444" />
                      )
                    )}
                  </div>
                </div>

                {/* Workout days */}
                {weekWorkouts.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {weekWorkouts.map((workout, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(16, 185, 129, 0.2)',
                          borderRadius: '6px',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontSize: '0.75rem',
                          color: '#34d399',
                          fontWeight: '500'
                        }}
                      >
                        {workout.dayOfWeek}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
