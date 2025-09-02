// src/modules/progress/workout/components/WorkoutHistory.jsx
// WORKOUT HISTORY - Mobile optimized workout sessions overview

import { useState, useEffect } from 'react'
import { 
  Calendar, Clock, Dumbbell, TrendingUp, Award, 
  ChevronDown, ChevronRight, Filter, MoreVertical,
  Flame, Zap, Heart, Activity, Target
} from 'lucide-react'
import WorkoutService from '../services/WorkoutService'

const THEME = {
  primary: '#f97316',
  gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
  border: 'rgba(249, 115, 22, 0.2)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
}

const FEELING_COLORS = {
  great: { color: '#10b981', emoji: '🔥', label: 'Top' },
  good: { color: '#3b82f6', emoji: '💪', label: 'Goed' },
  normal: { color: '#6b7280', emoji: '👍', label: 'Normaal' },
  tired: { color: '#f59e0b', emoji: '😴', label: 'Moe' },
  bad: { color: '#ef4444', emoji: '😤', label: 'Zwaar' }
}

const WORKOUT_TYPES = {
  upper: { label: 'Upper Body', emoji: '💪', color: '#dc2626' },
  lower: { label: 'Lower Body', emoji: '🦵', color: '#7c3aed' },
  hiit: { label: 'HIIT Cardio', emoji: '🔥', color: '#059669' },
  cardio: { label: 'Cardio', emoji: '🏃', color: '#0ea5e9' },
  null: { label: 'Custom', emoji: '🎯', color: THEME.primary }
}

export default function WorkoutHistory({ db, currentUser }) {
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30)
  const [expandedSessions, setExpandedSessions] = useState(new Set())
  const [groupBy, setGroupBy] = useState('week') // 'week' or 'month'
  const [showFilters, setShowFilters] = useState(false)
  
  const workoutService = new WorkoutService(db)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (currentUser?.id) {
      loadWorkoutHistory()
    }
  }, [currentUser, timeRange])

  const loadWorkoutHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await db.supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', currentUser.id)
        .eq('is_completed', true)
        .gte('workout_date', getStartDate().toISOString().split('T')[0])
        .order('workout_date', { ascending: false })

      if (error) {
        console.error('Error loading workout history:', error)
        setWorkoutHistory([])
        return
      }

      setWorkoutHistory(data || [])
    } catch (error) {
      console.error('Error loading workout history:', error)
      setWorkoutHistory([])
    } finally {
      setLoading(false)
    }
  }

  const getStartDate = () => {
    const date = new Date()
    date.setDate(date.getDate() - timeRange)
    return date
  }

  const groupWorkouts = () => {
    if (!workoutHistory.length) return []

    const grouped = {}
    
    workoutHistory.forEach(workout => {
      const date = new Date(workout.workout_date)
      let key
      
      if (groupBy === 'week') {
        const startOfWeek = new Date(date)
        startOfWeek.setDate(date.getDate() - date.getDay())
        key = startOfWeek.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          key,
          date: groupBy === 'week' ? getWeekLabel(key) : getMonthLabel(key),
          workouts: []
        }
      }
      
      grouped[key].workouts.push(workout)
    })

    return Object.values(grouped).sort((a, b) => b.key.localeCompare(a.key))
  }

  const getWeekLabel = (weekStart) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    const isCurrentWeek = 
      new Date().getTime() >= start.getTime() && 
      new Date().getTime() <= end.getTime()
    
    if (isCurrentWeek) {
      return 'Deze Week'
    }
    
    return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('nl-NL', { month: 'short' })}`
  }

  const getMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(year, month - 1)
    
    const isCurrentMonth = 
      new Date().getFullYear() === parseInt(year) && 
      new Date().getMonth() === parseInt(month) - 1
    
    if (isCurrentMonth) {
      return 'Deze Maand'
    }
    
    return date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
  }

  const toggleExpanded = (sessionId) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const getWorkoutTypeInfo = (workoutId) => {
    return WORKOUT_TYPES[workoutId] || WORKOUT_TYPES.null
  }

  const calculateGroupStats = (workouts) => {
    const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
    const totalVolume = workouts.reduce((sum, w) => {
      if (!w.exercises_completed) return sum
      return sum + w.exercises_completed.reduce((exerciseSum, exercise) => {
        if (!exercise.sets) return exerciseSum
        return exerciseSum + exercise.sets.reduce((setSum, set) => {
          return setSum + ((set.weight || 0) * (set.reps || 0))
        }, 0)
      }, 0)
    }, 0)
    
    return {
      totalWorkouts: workouts.length,
      totalMinutes: Math.round(totalMinutes),
      totalVolume: Math.round(totalVolume),
      avgDuration: workouts.length ? Math.round(totalMinutes / workouts.length) : 0
    }
  }

  const timeRanges = [
    { value: 7, label: '1W' },
    { value: 30, label: '1M' },
    { value: 90, label: '3M' },
    { value: 365, label: '1J' }
  ]

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${THEME.border}`,
          borderTopColor: THEME.primary,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  if (!workoutHistory.length) {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '20px',
        padding: '3rem 2rem',
        border: `1px solid ${THEME.border}`,
        textAlign: 'center'
      }}>
        <Dumbbell size={48} color={THEME.border} style={{ 
          marginBottom: '1.5rem',
          opacity: 0.5 
        }} />
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Nog geen workout geschiedenis
        </h3>
        <p style={{
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '1.5rem'
        }}>
          Log je eerste workout om je progressie te zien
        </p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      width: '100%'
    }}>
      
      {/* Filter Bar */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        padding: '1rem',
        border: `1px solid ${THEME.border}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: showFilters ? '1rem' : '0'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            {timeRanges.map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: timeRange === range.value ? THEME.primary : 'transparent',
                  border: timeRange === range.value ? 'none' : `1px solid ${THEME.border}`,
                  borderRadius: '8px',
                  color: timeRange === range.value ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '0.5rem',
              background: showFilters ? THEME.primary : 'transparent',
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Filter size={16} color={showFilters ? '#fff' : 'rgba(255,255,255,0.6)'} />
          </button>
        </div>
        
        {showFilters && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: `1px solid ${THEME.border}`
          }}>
            <button
              onClick={() => setGroupBy('week')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: groupBy === 'week' ? THEME.primary : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: groupBy === 'week' ? '#fff' : 'rgba(255,255,255,0.6)',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Per Week
            </button>
            <button
              onClick={() => setGroupBy('month')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: groupBy === 'month' ? THEME.primary : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: groupBy === 'month' ? '#fff' : 'rgba(255,255,255,0.6)',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Per Maand
            </button>
          </div>
        )}
      </div>

      {/* Workout Groups */}
      {groupWorkouts().map(group => {
        const stats = calculateGroupStats(group.workouts)
        
        return (
          <div key={group.key} style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
            border: `1px solid ${THEME.border}`,
            overflow: 'hidden'
          }}>
            {/* Group Header */}
            <div style={{
              background: THEME.lightGradient,
              padding: '1rem',
              borderBottom: `1px solid ${THEME.border}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {group.date}
                </h3>
                <div style={{
                  fontSize: '0.8rem',
                  color: THEME.primary,
                  fontWeight: '600'
                }}>
                  {stats.totalWorkouts} workouts
                </div>
              </div>
              
              {/* Group Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem'
              }}>
                <div style={{
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: THEME.primary,
                    marginBottom: '0.125rem'
                  }}>
                    {stats.totalMinutes}min
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Totaal
                  </div>
                </div>
                
                <div style={{
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#8b5cf6',
                    marginBottom: '0.125rem'
                  }}>
                    {Math.round(stats.totalVolume / 1000)}k
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Volume
                  </div>
                </div>
                
                <div style={{
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#10b981',
                    marginBottom: '0.125rem'
                  }}>
                    {stats.avgDuration}min
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Gemiddeld
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Workout Sessions */}
            <div style={{ padding: '0.5rem' }}>
              {group.workouts.map(session => {
                const isExpanded = expandedSessions.has(session.id)
                const workoutType = getWorkoutTypeInfo(session.workout_id)
                const feeling = FEELING_COLORS[session.feeling] || FEELING_COLORS.normal
                const exerciseCount = session.exercises_completed?.length || 0
                
                return (
                  <div key={session.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    marginBottom: '0.5rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden'
                  }}>
                    {/* Session Header */}
                    <button
                      onClick={() => toggleExpanded(session.id)}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      {/* Workout Type Icon */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `linear-gradient(135deg, ${workoutType.color}22, ${workoutType.color}11)`,
                        border: `1px solid ${workoutType.color}44`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        flexShrink: 0
                      }}>
                        {workoutType.emoji}
                      </div>
                      
                      <div style={{
                        flex: 1,
                        textAlign: 'left'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.25rem'
                        }}>
                          <span style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#fff'
                          }}>
                            {workoutType.label}
                          </span>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <span style={{ fontSize: '0.9rem' }}>{feeling.emoji}</span>
                            <span style={{
                              fontSize: '0.7rem',
                              color: feeling.color,
                              fontWeight: '500'
                            }}>
                              {feeling.label}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.5)'
                        }}>
                          <span>
                            📅 {new Date(session.workout_date).toLocaleDateString('nl-NL', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </span>
                          <span>⏱️ {session.duration_minutes || 0}min</span>
                          <span>🎯 {exerciseCount} oefeningen</span>
                        </div>
                      </div>
                      
                      <ChevronDown 
                        size={18} 
                        color="rgba(255,255,255,0.4)"
                        style={{ 
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          flexShrink: 0
                        }} 
                      />
                    </button>

                    {/* Expanded Exercise Details */}
                    {isExpanded && session.exercises_completed && (
                      <div style={{
                        padding: '0 1rem 1rem 1rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          marginTop: '0.75rem'
                        }}>
                          {session.exercises_completed.map((exercise, index) => (
                            <div key={index} style={{
                              background: 'rgba(0,0,0,0.2)',
                              borderRadius: '8px',
                              padding: '0.75rem'
                            }}>
                              <div style={{
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                color: '#fff',
                                marginBottom: '0.5rem'
                              }}>
                                {exercise.name}
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                gap: '0.375rem',
                                flexWrap: 'wrap'
                              }}>
                                {exercise.sets?.map((set, setIndex) => (
                                  <div key={setIndex} style={{
                                    background: 'rgba(249,115,22,0.1)',
                                    border: `1px solid ${THEME.border}`,
                                    borderRadius: '6px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.7rem',
                                    color: THEME.primary,
                                    fontWeight: '600'
                                  }}>
                                    {set.weight}kg × {set.reps}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {session.notes && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.7)',
                            fontStyle: 'italic'
                          }}>
                            💭 {session.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
