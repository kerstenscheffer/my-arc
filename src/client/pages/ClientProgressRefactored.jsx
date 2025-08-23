// src/client/pages/ClientProgressRefactored.jsx
// MY ARC PROGRESS TRACKER - WERKENDE GEOPTIMALISEERDE VERSIE
// Zonder externe hooks dependencies

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { 
  TrendingUp, Target, Calendar, Activity, Award,
  Plus, Weight, Flame, Trophy, RefreshCw,
  ChevronLeft, ChevronRight, BarChart3, CheckCircle
} from 'lucide-react'

// ===== SIMPLE HOOKS (geen externe dependencies) =====
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// ===== MAIN COMPONENT =====
// Renamed to avoid conflict with import name
function ClientProgressRefactored({ client, db }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  
  // Data states
  const [weightData, setWeightData] = useState({
    current: null,
    history: [],
    goal: null
  })
  
  const [exerciseGoals, setExerciseGoals] = useState([])
  const [workoutData, setWorkoutData] = useState({
    streak: 0,
    weekProgress: {},
    currentWeekWorkouts: 0
  })
  
  // Load all data
  const loadData = useCallback(async () => {
    if (!client?.id || !db) return
    
    try {
      setLoading(true)
      
      // Load weight data
      const [goals, weightHistory] = await Promise.all([
        db.getClientGoals(client.id),
        db.getWeightHistory ? db.getWeightHistory(client.id, 30) : Promise.resolve([])
      ])
      
      const weightGoal = goals?.find(g => g.goal_type === 'weight')
      
      setWeightData({
        current: weightHistory?.[0]?.weight || null,
        history: weightHistory || [],
        goal: weightGoal || null
      })
      
      // Load exercise goals
      const exerciseGoalsData = await db.getExerciseGoals?.(client.id) || []
      setExerciseGoals(exerciseGoalsData)
      
      // Load workout data for current week
      const weekDates = getWeekDates()
      const progressData = {}
      let workoutCount = 0
      
      for (const date of weekDates) {
        const dayProgress = await db.getClientProgressByDate?.(client.id, date) || []
        progressData[date] = dayProgress
        if (dayProgress.length > 0) workoutCount++
      }
      
      setWorkoutData({
        streak: await calculateStreak(client.id),
        weekProgress: progressData,
        currentWeekWorkouts: workoutCount
      })
      
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [client?.id, db])
  
  useEffect(() => {
    loadData()
  }, [loadData])
  
  // Helper functions
  const getWeekDates = (baseDate = new Date()) => {
    const dates = []
    const startOfWeek = new Date(baseDate)
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + 1)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }
  
  const calculateStreak = async (clientId) => {
    // Simple streak calculation
    try {
      const dates = getWeekDates()
      let streak = 0
      
      for (let i = dates.length - 1; i >= 0; i--) {
        const progress = await db.getClientProgressByDate?.(clientId, dates[i]) || []
        if (progress.length > 0) {
          streak++
        } else if (i < dates.length - 1) {
          break
        }
      }
      
      return streak
    } catch {
      return 0
    }
  }
  
  const calculateProgress = (current, start, target) => {
    if (!start || !target || start === target) return 0
    const totalChange = Math.abs(target - start)
    const currentChange = Math.abs(current - start)
    return Math.min(100, Math.round((currentChange / totalChange) * 100))
  }
  
  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }
  
  const handleAddWeight = async () => {
    const weight = prompt('Voer je huidige gewicht in (kg):')
    if (!weight || !db) return
    
    try {
      await db.saveWeight?.(
        client.id,
        parseFloat(weight),
        new Date().toISOString().split('T')[0]
      )
      await loadData()
    } catch (error) {
      console.error('Error saving weight:', error)
      alert('Fout bij opslaan gewicht')
    }
  }
  
  const handleSetGoal = async () => {
    const current = prompt('Huidig gewicht (kg):')
    const target = prompt('Doel gewicht (kg):')
    if (!current || !target || !db) return
    
    try {
      await db.saveWeightGoal?.(
        client.id,
        parseFloat(current),
        parseFloat(target)
      )
      await loadData()
    } catch (error) {
      console.error('Error saving goal:', error)
      alert('Fout bij opslaan doel')
    }
  }
  
  // Render components
  const StatCard = ({ icon, value, label, color = '#10b981', onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        border: `1px solid ${color}33`,
        borderRadius: '12px',
        padding: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.borderColor = color
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = `${color}33`
        }
      }}
    >
      <div style={{ color, marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
        {label}
      </div>
    </div>
  )
  
  const WeightChart = ({ history }) => {
    if (!history || history.length < 2) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          Nog geen data voor grafiek
        </div>
      )
    }
    
    const values = history.map(h => h.weight)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        height: '200px',
        position: 'relative'
      }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={history.slice().reverse().map((h, i) => {
              const x = (i / (history.length - 1)) * 100
              const y = 100 - ((h.weight - min) / range) * 90
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    )
  }
  
  const WeekCalendar = ({ weekProgress }) => {
    const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
    const dates = getWeekDates()
    const today = new Date().toISOString().split('T')[0]
    
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem'
      }}>
        {dates.map((date, index) => {
          const hasWorkout = weekProgress[date]?.length > 0
          const isToday = date === today
          
          return (
            <div
              key={date}
              style={{
                background: hasWorkout
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(0, 0, 0, 0.6)',
                border: isToday
                  ? '2px solid #10b981'
                  : '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '0.25rem'
              }}>
                {days[index]}
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: hasWorkout ? '#10b981' : '#fff'
              }}>
                {new Date(date).getDate()}
              </div>
              {hasWorkout && (
                <CheckCircle size={16} style={{
                  color: '#10b981',
                  marginTop: '0.25rem'
                }} />
              )}
            </div>
          )
        })}
      </div>
    )
  }
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#fff'
      }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  const weightProgress = weightData.goal
    ? calculateProgress(
        weightData.current,
        weightData.goal.start_value,
        weightData.goal.target_value
      )
    : 0
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#fff',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        padding: '1.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #10b981'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <TrendingUp size={28} style={{ color: '#10b981' }} />
          Mijn Vooruitgang
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>
          Track je progress en bereik je doelen
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0 1rem',
        marginBottom: '1.5rem',
        overflowX: 'auto'
      }}>
        {['overview', 'weight', 'workouts'].map(tab => (
          <button
            key={tab}
            onClick={() => setViewMode(tab)}
            style={{
              padding: '0.75rem 1.25rem',
              background: viewMode === tab
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(255,255,255,0.05)',
              border: viewMode === tab
                ? 'none'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: viewMode === tab ? '#000' : '#fff',
              fontWeight: viewMode === tab ? 'bold' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease'
            }}
          >
            {tab === 'overview' ? 'Overzicht' :
             tab === 'weight' ? 'Gewicht' : 'Workouts'}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div style={{ padding: '0 1rem' }}>
        {/* Overview Tab */}
        {viewMode === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <StatCard
                icon={<Weight size={24} />}
                value={weightData.current ? `${weightData.current} kg` : '--'}
                label="Huidig gewicht"
                color="#10b981"
                onClick={handleAddWeight}
              />
              
              <StatCard
                icon={<Target size={24} />}
                value={`${weightProgress}%`}
                label="Doel bereikt"
                color="#3b82f6"
                onClick={handleSetGoal}
              />
              
              <StatCard
                icon={<Flame size={24} />}
                value={workoutData.streak}
                label="Dagen streak"
                color="#f59e0b"
              />
              
              <StatCard
                icon={<Trophy size={24} />}
                value={exerciseGoals.length}
                label="Actieve doelen"
                color="#8b5cf6"
              />
            </div>
            
            {/* Week Calendar */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={20} style={{ color: '#10b981' }} />
                Deze Week
              </h3>
              <WeekCalendar weekProgress={workoutData.weekProgress} />
            </div>
            
            {/* Quick Actions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <button
                onClick={handleAddWeight}
                style={{
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus size={20} />
                Gewicht toevoegen
              </button>
              
              <button
                onClick={handleRefresh}
                style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <RefreshCw size={20} />
                Vernieuwen
              </button>
            </div>
          </div>
        )}
        
        {/* Weight Tab */}
        {viewMode === 'weight' && (
          <div>
            {/* Current Weight Card */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <Weight size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {weightData.current || '--'} kg
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>
                Huidig gewicht
              </div>
              {weightData.goal && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#10b981' }}>
                    Doel: {weightData.goal.target_value} kg
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                    Nog {Math.abs(weightData.current - weightData.goal.target_value).toFixed(1)} kg te gaan
                  </div>
                </div>
              )}
            </div>
            
            {/* Weight Chart */}
            <WeightChart history={weightData.history} />
            
            {/* Actions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginTop: '1.5rem'
            }}>
              <button
                onClick={handleAddWeight}
                style={{
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <Plus size={20} style={{ marginRight: '0.5rem', display: 'inline' }} />
                Nieuw gewicht
              </button>
              
              <button
                onClick={handleSetGoal}
                style={{
                  padding: '1rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  color: '#3b82f6',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <Target size={20} style={{ marginRight: '0.5rem', display: 'inline' }} />
                Doel instellen
              </button>
            </div>
          </div>
        )}
        
        {/* Workouts Tab */}
        {viewMode === 'workouts' && (
          <div>
            {/* Week Progress */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Activity size={20} style={{ color: '#10b981' }} />
                Workout Overzicht
              </h3>
              
              <WeekCalendar weekProgress={workoutData.weekProgress} />
              
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-around'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                    {workoutData.currentWeekWorkouts}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                    Workouts deze week
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                    {workoutData.streak}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                    Dagen streak
                  </div>
                </div>
              </div>
            </div>
            
            {/* Exercise Goals */}
            {exerciseGoals.length > 0 && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Target size={20} style={{ color: '#3b82f6' }} />
                  Oefening Doelen
                </h3>
                
                {exerciseGoals.map((goal, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>
                        {goal.exercise_name}
                      </span>
                      <span style={{ color: '#10b981' }}>
                        {goal.current_value} / {goal.target_value} {goal.goal_type}
                      </span>
                    </div>
                    <div style={{
                      marginTop: '0.5rem',
                      height: '4px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        background: '#10b981',
                        width: `${Math.min(100, (goal.current_value / goal.target_value) * 100)}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Export the component
export default ClientProgressRefactored
