// src/modules/progress/workout/WorkoutLogModule.jsx
// MAIN CONTAINER - Orchestreert alle workout componenten

import { useState, useEffect } from 'react'
import { Activity, Clock, TrendingUp } from 'lucide-react'
import WorkoutService from './services/WorkoutService'
import WorkoutHistory from './components/WorkoutHistory'
import ProgressCharts from './components/ProgressCharts'
import ProgressWidgetSection from './components/ProgressWidgetSection'
import QuickLogModal from './components/QuickLogModal'
import ActiveWorkoutModal from './components/ActiveWorkoutModal'
import WorkoutStatsSection from './components/WorkoutStatsSection'
import WorkoutTemplatesSection from './components/WorkoutTemplatesSection'

export const THEME = {
  primary: '#f97316',
  gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
  cardGradient: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
  border: 'rgba(249, 115, 22, 0.2)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
}

export default function WorkoutLogModule({ client, db, schema, weekSchedule }) {
  const [activeView, setActiveView] = useState('log')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Progress widget state
  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [quickStats, setQuickStats] = useState({
    exercisesLogged: 0,
    totalExercises: 0,
    lastExercise: null
  })
  const [todaysLogs, setTodaysLogs] = useState([])
  const [allExercises, setAllExercises] = useState([])
  const [showQuickModal, setShowQuickModal] = useState(false)
  
  // Workout state
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [workoutStartTime, setWorkoutStartTime] = useState(null)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [exerciseData, setExerciseData] = useState({})
  const [restTimer, setRestTimer] = useState(null)
  const [restStartTime, setRestStartTime] = useState(null)
  
  const workoutService = new WorkoutService(db)
  const isMobile = window.innerWidth <= 768

  const views = [
    { id: 'log', label: 'Log', icon: Activity },
    { id: 'history', label: 'Historie', icon: Clock },
    { id: 'charts', label: 'Stats', icon: TrendingUp },
  ]

  // ===== LIFECYCLE =====
  useEffect(() => {
    if (client?.id) {
      loadData()
      loadTodaysData()
      loadAllExercises()
    }
  }, [client?.id])

  // Rest timer effect
  useEffect(() => {
    if (restTimer > 0) {
      const interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 200])
            }
            return null
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [restTimer])

  // ===== DATA LOADING =====
  const loadAllExercises = async () => {
    try {
      const { data: exercises, error } = await db.supabase
        .from('workout_progress')
        .select('exercise_name')
        .order('exercise_name')
      
      if (!error && exercises) {
        const uniqueExercises = [...new Set(exercises.map(e => e.exercise_name))].filter(Boolean)
        setAllExercises(uniqueExercises)
      }
    } catch (error) {
      console.error('Error loading exercises:', error)
    }
  }

  const loadTodaysData = async () => {
    if (!client?.id) return
    
    try {
      const today = new Date()
      // 🔥 FIX: Gebruik CONSISTENCY met WorkoutWidget - Capitalize eerste letter!
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const currentDay = dayNames[today.getDay()]
      const todayStr = today.toISOString().split('T')[0]
      
      console.log('🔥 TODAY DEBUG:', {
        currentDay,
        weekSchedule,
        todayWorkoutKey: weekSchedule?.[currentDay],
        schema: schema?.week_structure
      })
      
      // 🔥 FIX: Zoek workout via weekSchedule (zoals WorkoutWidget doet)
      let foundWorkout = null
      if (weekSchedule && weekSchedule[currentDay]) {
        const todayWorkoutKey = weekSchedule[currentDay]
        if (schema?.week_structure?.[todayWorkoutKey]) {
          foundWorkout = {
            key: todayWorkoutKey,
            ...schema.week_structure[todayWorkoutKey]
          }
          console.log('🔥 FOUND TODAY WORKOUT:', foundWorkout)
        }
      }
      
      setTodaysWorkout(foundWorkout)
      
      // Get all sessions from today
      let allSessionsData = []
      
      const { data: userSessions, error: userError } = await db.supabase
        .from('workout_sessions')
        .select('id, workout_date, user_id, client_id, created_at')
        .eq('user_id', client.id)
        .eq('workout_date', todayStr)
        .order('created_at', { ascending: false })
      
      if (!userError && userSessions) {
        allSessionsData.push(...userSessions)
      }
      
      const { data: clientSessions, error: clientError } = await db.supabase
        .from('workout_sessions')
        .select('id, workout_date, user_id, client_id, created_at')
        .eq('client_id', client.id)
        .eq('workout_date', todayStr)
        .is('user_id', null)
        .order('created_at', { ascending: false })
      
      if (!clientError && clientSessions) {
        allSessionsData.push(...clientSessions)
      }
      
      const uniqueSessions = allSessionsData.filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      )
      
      if (uniqueSessions.length > 0) {
        const sessionIds = uniqueSessions.map(s => s.id)
        
        const { data: allTodayProgress, error: progressError } = await db.supabase
          .from('workout_progress')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false })
        
        if (!progressError && allTodayProgress) {
          const uniqueExercises = [...new Set(allTodayProgress.map(p => p.exercise_name))]
          const mostRecentExercise = allTodayProgress[0]
          
          setQuickStats({
            exercisesLogged: uniqueExercises.length,
            totalExercises: foundWorkout?.exercises?.length || 0,
            lastExercise: mostRecentExercise
          })
          
          setTodaysLogs(allTodayProgress)
        } else {
          setQuickStats({
            exercisesLogged: 0,
            totalExercises: foundWorkout?.exercises?.length || 0,
            lastExercise: null
          })
          setTodaysLogs([])
        }
      } else {
        setQuickStats({
          exercisesLogged: 0,
          totalExercises: foundWorkout?.exercises?.length || 0,
          lastExercise: null
        })
        setTodaysLogs([])
      }
      
    } catch (error) {
      console.error('Error loading today\'s data:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const statistics = await workoutService.getWorkoutStats(client.id, 30)
      setStats(statistics)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // ===== WORKOUT FUNCTIONS =====
  const startWorkout = (workoutTemplate) => {
    // 🔥 FIX: Start workout met today's workout indien beschikbaar
    const workoutToStart = workoutTemplate || todaysWorkout
    if (!workoutToStart) {
      alert('Geen workout beschikbaar om te starten')
      return
    }

    setActiveWorkout(workoutToStart)
    setWorkoutStartTime(new Date())
    setCurrentExercise(0)
    setExerciseData({})
    
    const initialData = {}
    workoutToStart.exercises?.forEach((exercise, index) => {
      initialData[index] = {
        name: exercise.name,
        targetSets: exercise.sets || 3,
        targetReps: exercise.reps || 10,
        restTime: exercise.rest || 60,
        sets: []
      }
    })
    setExerciseData(initialData)
    
    if (navigator.vibrate) {
      navigator.vibrate(100)
    }
  }

  const addSet = (weight, reps) => {
    if (!weight || !reps) return

    const exerciseIndex = currentExercise
    const newSet = {
      weight: parseFloat(weight),
      reps: parseInt(reps),
      completed: true,
      timestamp: new Date()
    }

    setExerciseData(prev => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        sets: [...(prev[exerciseIndex]?.sets || []), newSet]
      }
    }))

    const currentSets = exerciseData[exerciseIndex]?.sets?.length || 0
    const targetSets = exerciseData[exerciseIndex]?.targetSets || 3
    
    if (currentSets < targetSets - 1) {
      const restTime = exerciseData[exerciseIndex]?.restTime || 60
      setRestTimer(restTime)
      setRestStartTime(new Date())
    }

    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  const nextExercise = () => {
    if (currentExercise < activeWorkout.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1)
      setRestTimer(null)
      setRestStartTime(null)
    }
  }

  const finishWorkout = async () => {
    if (!activeWorkout || !client?.id) return

    const duration = workoutStartTime 
      ? Math.floor((new Date() - workoutStartTime) / 1000 / 60)
      : 0

    try {
      const completedExercises = Object.values(exerciseData)
        .filter(exercise => exercise.sets.length > 0)
        .map(exercise => ({
          name: exercise.name,
          sets: exercise.sets
        }))

      await workoutService.logWorkout(client.id, {
        workoutId: activeWorkout.key || activeWorkout.id,
        exercises: completedExercises,
        duration,
        feeling: 'good',
        notes: ''
      })

      setActiveWorkout(null)
      setWorkoutStartTime(null)
      setCurrentExercise(0)
      setExerciseData({})
      setRestTimer(null)

      await loadData()
      await loadTodaysData()

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100])
      }

    } catch (error) {
      console.error('Error finishing workout:', error)
      alert('Fout bij opslaan workout')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem'
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

  return (
    <div style={{
      animation: 'fadeIn 0.5s ease',
      position: 'relative'
    }}>

      {/* Premium Tab Navigation */}
      <div style={{
        marginBottom: '0.5rem'
      }}>
        <div style={{
          background: THEME.cardGradient,
          borderRadius: '20px',
          padding: '0.5rem',
          border: `1px solid ${THEME.border}`,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-30%',
            width: '150%',
            height: '150%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.03) 0%, transparent 60%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            position: 'relative',
            zIndex: 1
          }}>
            {views.map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: isMobile ? '0.875rem 0.5rem' : '1rem 0.75rem',
                  background: activeView === view.id ? THEME.gradient : 'transparent',
                  border: 'none',
                  borderRadius: '14px',
                  color: activeView === view.id ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: activeView === view.id ? '0 8px 20px rgba(249, 115, 22, 0.25)' : 'none',
                  transform: activeView === view.id ? 'translateY(-2px)' : 'translateY(0)',
                  position: 'relative',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {activeView === view.id && (
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '24px',
                    height: '3px',
                    background: '#fff',
                    borderRadius: '2px',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)'
                  }} />
                )}
                
                <view.icon size={isMobile ? 18 : 20} />
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {view.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeView === 'log' && (
        <div>
          
          {/* Modals */}
          {activeWorkout && (
            <ActiveWorkoutModal 
              activeWorkout={activeWorkout}
              currentExercise={currentExercise}
              exerciseData={exerciseData}
              restTimer={restTimer}
              isMobile={isMobile}
              onClose={() => setActiveWorkout(null)}
              onAddSet={addSet}
              onNextExercise={nextExercise}
              onFinishWorkout={finishWorkout}
            />
          )}

          {showQuickModal && (
            <QuickLogModal 
              db={db}
              client={client}
              todaysWorkout={todaysWorkout}
              setTodaysLogs={setTodaysLogs}
              setQuickStats={setQuickStats}
              todaysLogs={todaysLogs}
              onClose={() => setShowQuickModal(false)}
              onDataReload={loadData}
              isMobile={isMobile}
            />
          )}

          {/* Main Log Interface */}
          {!activeWorkout && (
            <div>
              <WorkoutStatsSection stats={stats} isMobile={isMobile} />
              
              <ProgressWidgetSection 
                todaysWorkout={todaysWorkout}
                quickStats={quickStats}
                todaysLogs={todaysLogs}
                onOpenQuickModal={() => setShowQuickModal(true)}
                onStartTodaysWorkout={() => startWorkout(todaysWorkout)}
                isMobile={isMobile}
              />

              <WorkoutTemplatesSection 
                onStartWorkout={startWorkout}
                todaysWorkout={todaysWorkout}
                isMobile={isMobile}
              />
            </div>
          )}
        </div>
      )}

      {activeView === 'history' && <WorkoutHistory db={db} currentUser={client} />}
      {activeView === 'charts' && <ProgressCharts db={db} currentUser={client} />}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
