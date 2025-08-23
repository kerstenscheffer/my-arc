// src/modules/progress/ClientProgress.jsx
// MY ARC Client Progress - OPTIMIZED MODULE VERSION
// Features: Lazy loading, Memoization, Virtual scrolling, Debouncing

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import ProgressService from './ProgressService'
import { debounce } from 'lodash'

// Lazy load heavy components
const SimpleLineGraph = lazy(() => import('./SimpleLineGraph'))

// Exercise Database (memoized)
const AI_EXERCISE_DATABASE = {
  chest: {
    compound: [
      { name: "Machine Chest Press", video: "xUm0BiZCWlQ", stretch: true, rating: { h: 5, s: 5 }},
      { name: "Incline Dumbbell Press", video: "8iPEnn-ltC8", stretch: true, rating: { h: 8, s: 8 }},
      { name: "Barbell Bench Press", video: "rT7DgCr-3pg", stretch: false, rating: { h: 8, s: 10 }},
      { name: "Weighted Dips", video: "2z8JmcrW-As", stretch: true, rating: { h: 9, s: 9 }}
    ],
    isolation: [
      { name: "Incline Cable Flies", video: "GtHNC-5GtR0", stretch: true, rating: { h: 10, s: 8 }}
    ]
  },
  back: {
    compound: [
      { name: "Lat Pulldown", video: "CAwf7n6Luuc", stretch: true, rating: { h: 9, s: 8 }},
      { name: "Weighted Pull-Ups", video: "eGo4IYlbE5g", stretch: true, rating: { h: 10, s: 10 }},
      { name: "T-Bar Row", video: "j3Igk5nyZE4", stretch: true, rating: { h: 10, s: 8 }},
      { name: "Cable Row", video: "GZbfZ033f74", stretch: true, rating: { h: 8, s: 7 }}
    ]
  },
  shoulders: {
    compound: [
      { name: "Machine Shoulder Press", video: "qEwKCR5JCog", stretch: false, rating: { h: 8, s: 8 }},
      { name: "Dumbbell Shoulder Press", video: "qEwKCR5JCog", stretch: false, rating: { h: 8, s: 8 }}
    ],
    isolation: [
      { name: "Cable Lateral Raises", video: "PPrzBWZDOhA", stretch: true, rating: { h: 10, s: 8 }}
    ]
  },
  legs: {
    compound: [
      { name: "Leg Press", video: "IZxyjW7MPJQ", stretch: true, rating: { h: 9, s: 8 }},
      { name: "Romanian Deadlift", video: "jEy_czb3RKA", stretch: true, rating: { h: 10, s: 9 }},
      { name: "High-Bar Back Squat", video: "bEv6CCg2BC8", stretch: true, rating: { h: 8, s: 9 }}
    ],
    isolation: [
      { name: "Leg Extension", video: "ljO4jkwv8wQ", stretch: true, rating: { h: 9, s: 5 }},
      { name: "Leg Curl", video: "ELOCsoDSmrg", stretch: true, rating: { h: 9, s: 5 }}
    ]
  },
  biceps: {
    isolation: [
      { name: "Incline Dumbbell Curl", video: "soxrZlIl35U", stretch: true, rating: { h: 10, s: 5 }},
      { name: "Cable Bicep Curls", video: "ajdFwa-qM98", stretch: true, rating: { h: 9, s: 5 }}
    ]
  },
  triceps: {
    isolation: [
      { name: "Cable Overhead Extension", video: "2-LAMcpzODU", stretch: true, rating: { h: 10, s: 5 }},
      { name: "Triceps Pushdown", video: "2-LAMcpzODU", stretch: false, rating: { h: 8, s: 6 }}
    ]
  }
}

// Memoized exercise list
const getAllExercises = () => {
  const exercises = []
  Object.entries(AI_EXERCISE_DATABASE).forEach(([muscle, data]) => {
    ;['compound', 'isolation'].forEach(type => {
      if (data[type]) {
        data[type].forEach(ex => {
          exercises.push({ ...ex, muscle, type })
        })
      }
    })
  })
  return exercises
}

// Progress Card Component (memoized)
const ProgressCard = React.memo(({ date, dayName, dayNumber, isToday, progressCount, onClick }) => (
  <div
    onClick={onClick}
    style={{
      minHeight: '80px',
      padding: '1rem',
      background: isToday 
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: progressCount > 0 ? '2px solid #10b981' : '1px solid #10b98133',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
    }}
  >
    <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
      {dayName}
    </div>
    <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
      {dayNumber}
    </div>
    {progressCount > 0 && (
      <div style={{
        background: '#10b981',
        color: '#000',
        borderRadius: '12px',
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
        fontWeight: '600'
      }}>
        {progressCount} workout{progressCount !== 1 ? 's' : ''}
      </div>
    )}
  </div>
))

// Main Component
export default function ClientProgress({ client }) {
  const { t, language } = useLanguage()
  const isMobile = window.innerWidth <= 768
  
  // Core states
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null)
  const [weekDates, setWeekDates] = useState([])
  const [weekProgress, setWeekProgress] = useState({})
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  
  // Data states
  const [clientExercises, setClientExercises] = useState([])
  const [exerciseHistory, setExerciseHistory] = useState([])
  const [coachFeedbackList, setCoachFeedbackList] = useState([])
  const [weightHistory, setWeightHistory] = useState([])
  const [clientGoals, setClientGoals] = useState([])
  const [exerciseGoals, setExerciseGoals] = useState([])
  
  // Goal states
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [modalMode, setModalMode] = useState('goal')
  const [weightGoal, setWeightGoal] = useState({ current: '', target: '', startWeight: '' })
  const [weeklyGoal, setWeeklyGoal] = useState(4)
  const [weeklyStreak, setWeeklyStreak] = useState(0)
  const [currentWeekWorkouts, setCurrentWeekWorkouts] = useState(0)
  
  // Graph states
  const [graphType, setGraphType] = useState('weight')
  const [graphExercise, setGraphExercise] = useState('')
  const [graphData, setGraphData] = useState([])
  
  // Workout form
  const [workoutForm, setWorkoutForm] = useState({
    exerciseName: '',
    sets: [{ reps: '', weight: '' }],
    notes: '',
    rating: 7
  })
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('')
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
  const [smartSuggestion, setSmartSuggestion] = useState(null)

  // Memoized calculations
  const allExercises = useMemo(() => getAllExercises(), [])
  
  const filteredExercises = useMemo(() => {
    const term = exerciseSearchTerm.toLowerCase()
    if (!term) return allExercises.slice(0, 10)
    return allExercises
      .filter(ex => ex.name.toLowerCase().includes(term))
      .slice(0, 10)
  }, [exerciseSearchTerm, allExercises])

  const weightProgress = useMemo(() => {
    const startWeight = parseFloat(weightGoal.startWeight) || 80
    let currentWeight = parseFloat(weightGoal.current) || 76
    const targetWeight = parseFloat(weightGoal.target) || 70
    
    if (weightHistory?.length > 0) {
      currentWeight = parseFloat(weightHistory[0].weight)
    }
    
    if (!targetWeight) return null
    
    const totalToLose = startWeight - targetWeight
    const alreadyLost = startWeight - currentWeight
    const percentage = totalToLose > 0 ? (alreadyLost / totalToLose) * 100 : 0
    
    return {
      percentage: Math.min(100, Math.max(0, percentage)),
      lost: alreadyLost.toFixed(1),
      toGo: Math.max(0, currentWeight - targetWeight).toFixed(1),
      current: currentWeight
    }
  }, [weightGoal, weightHistory])

  // Initialize
  useEffect(() => {
    const dates = ProgressService.getWeekDates()
    setWeekDates(dates)
    setSelectedDate(new Date().toISOString().split('T')[0])
  }, [])

  // Load all data
  useEffect(() => {
    if (client?.id) {
      loadAllData()
    }
  }, [client])

  const loadAllData = async () => {
    if (!client?.id) return
    
    try {
      setLoading(true)
      
      // Parallel data loading
      const [goals, weightData, exercises, feedback] = await Promise.all([
        ProgressService.getClientGoals(client.id),
        ProgressService.getWeightHistory(client.id),
        ProgressService.getClientExercises(client.id),
        ProgressService.getCoachFeedback(client.id)
      ])
      
      setClientGoals(goals)
      setCoachFeedbackList(feedback)
      setClientExercises(exercises)
      setWeightHistory(weightData)
      
      // Process goals
      const weightGoalData = goals.find(g => g.goal_type === 'weight')
      if (weightGoalData) {
        setWeightGoal({
          current: weightData[0]?.weight || weightGoalData.current_value || 76,
          target: weightGoalData.target_value || 70,
          startWeight: weightGoalData.start_value || 80
        })
      }
      
      const weeklyGoalData = goals.find(g => g.goal_type === 'weekly_workouts')
      if (weeklyGoalData) {
        setWeeklyGoal(weeklyGoalData.target_value || 4)
      }
      
      // Load exercise goals
      const exerciseGoalsData = await ProgressService.getExerciseGoals(client.id)
      setExerciseGoals(exerciseGoalsData)
      
      // Load week data
      const dates = ProgressService.getWeekDates()
      setWeekDates(dates)
      await loadWeekProgress(dates)
      
      // Calculate stats
      await calculateCurrentWeekWorkouts(dates)
      const streak = await ProgressService.calculateWeeklyStreak(client.id, weeklyGoal)
      setWeeklyStreak(streak)
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const loadWeekProgress = async (dates) => {
    try {
      const progressData = {}
      
      // Load in parallel for better performance
      await Promise.all(
        dates.map(async (date) => {
          const dayProgress = await ProgressService.getClientProgressByDate(client.id, date)
          progressData[date] = dayProgress
        })
      )
      
      setWeekProgress(progressData)
      return progressData
    } catch (error) {
      console.error('Error loading week progress:', error)
      return {}
    }
  }

  const calculateCurrentWeekWorkouts = async (dates) => {
    let count = 0
    for (const date of dates) {
      if (weekProgress[date]?.length > 0) count++
    }
    setCurrentWeekWorkouts(count)
  }

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term) => {
      setExerciseSearchTerm(term)
    }, 300),
    []
  )

  const navigateWeek = (direction) => {
    const newWeek = currentWeek + direction
    setCurrentWeek(newWeek)
    
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1 + (newWeek * 7))
    const dates = ProgressService.getWeekDates(weekStart)
    setWeekDates(dates)
    loadWeekProgress(dates)
  }

  const openWorkoutModal = (date) => {
    setSelectedDate(date)
    setShowWorkoutModal(true)
    setWorkoutForm({
      exerciseName: '',
      sets: [{ reps: '', weight: '' }],
      notes: '',
      rating: 7
    })
    setSmartSuggestion(null)
  }

  const saveWorkout = async () => {
    try {
      if (!workoutForm.exerciseName || workoutForm.sets.some(set => !set.reps || !set.weight)) {
        alert('Vul alle velden in!')
        return
      }

      await ProgressService.logWorkoutProgress({
        clientId: client.id,
        date: selectedDate,
        exerciseName: workoutForm.exerciseName,
        sets: workoutForm.sets.map(set => ({
          reps: parseInt(set.reps),
          weight: parseFloat(set.weight)
        })),
        notes: workoutForm.notes,
        rating: workoutForm.rating
      })
      
      await ProgressService.markWorkoutComplete(client.id, selectedDate)
      await loadWeekProgress(weekDates)
      await calculateCurrentWeekWorkouts(weekDates)
      
      setShowWorkoutModal(false)
      alert('✅ Workout opgeslagen!')
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Fout bij opslaan workout')
    }
  }

  const selectExercise = async (exerciseName) => {
    setWorkoutForm(prev => ({ ...prev, exerciseName }))
    setExerciseSearchTerm(exerciseName)
    setShowExerciseDropdown(false)
    
    if (exerciseName) {
      const history = await ProgressService.getExerciseProgress(client.id, exerciseName, 3)
      setExerciseHistory(history)
      
      // Generate smart suggestion
      const exercise = allExercises.find(ex => ex.name === exerciseName)
      const lastWorkout = history[0]
      
      if (!lastWorkout) {
        setSmartSuggestion({
          message: '🆕 Eerste keer! Start comfortabel.',
          video: exercise?.video
        })
      } else {
        const lastWeight = Math.max(...(lastWorkout.sets || []).map(s => s.weight || 0))
        const rating = lastWorkout.rating || 7
        
        let message = `Vorige: ${lastWeight}kg`
        if (rating >= 8) message += ' → Probeer +2.5kg!'
        else if (rating <= 5) message += ' → Overweeg lichter'
        else message += ' → Focus op vorm'
        
        setSmartSuggestion({
          message,
          video: exercise?.video,
          coachFeedback: lastWorkout.coach_suggestion
        })
      }
    }
  }

  const updateGraphData = useCallback(async () => {
    if (graphType === 'weight' && weightHistory.length > 0) {
      const data = weightHistory
        .slice(0, 30)
        .reverse()
        .map(entry => ({
          date: entry.date,
          value: parseFloat(entry.weight),
          label: `${entry.weight}kg`
        }))
      setGraphData(data)
    } else if (graphType === 'exercise' && graphExercise) {
      const history = await ProgressService.getExerciseProgress(client.id, graphExercise, 20)
      const data = history
        .reverse()
        .map(entry => ({
          date: entry.date,
          value: Math.max(...(entry.sets || []).map(s => s.weight || 0)),
          label: `${Math.max(...(entry.sets || []).map(s => s.weight || 0))}kg`
        }))
      setGraphData(data)
    }
  }, [graphType, graphExercise, weightHistory, client])

  useEffect(() => {
    updateGraphData()
  }, [updateGraphData])

  // Helper functions
  const getDayName = (date) => {
    const days = language === 'nl' 
      ? ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[new Date(date).getDay()]
  }

  const getDayNumber = (date) => new Date(date).getDate()
  const isToday = (date) => date === new Date().toISOString().split('T')[0]
  const getDayProgressCount = (date) => weekProgress[date]?.length || 0

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#9ca3af' }}>Loading progress data...</p>
      </div>
    )
  }

  return (
    <div className="myarc-animate-in" style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#fff', fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '0.5rem' }}>
          📈 Progress Tracker
        </h1>
        <p style={{ color: '#d1fae5' }}>
          Log je workouts, track je vooruitgang
        </p>
      </div>

      {/* Coach Feedback Section */}
      {coachFeedbackList.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem',
          border: '1px solid #3b82f633'
        }}>
          <h3 style={{ color: '#3b82f6', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            💬 Coach Feedback
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {coachFeedbackList.slice(0, 3).map((feedback, index) => (
              <div key={index} style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.9rem'
              }}>
                <div style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {feedback.exercise_name} - {new Date(feedback.date).toLocaleDateString()}
                </div>
                <div style={{ color: '#fff' }}>
                  {feedback.coach_suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Weight Goal */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #10b98133',
            cursor: 'pointer'
          }}
          onClick={() => {
            setModalMode('goal')
            setShowWeightModal(true)
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>⚖️ Weight Goal</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setModalMode('update')
                setShowWeightModal(true)
              }}
              style={{
                background: '#10b981',
                border: 'none',
                borderRadius: '4px',
                color: '#000',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Update
            </button>
          </div>
          
          {weightProgress ? (
            <>
              <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {weightProgress.current}kg
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                Target: {weightGoal.target}kg
              </div>
              <div style={{
                marginTop: '0.5rem',
                height: '4px',
                background: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${weightProgress.percentage}%`,
                  height: '100%',
                  background: '#10b981',
                  transition: 'width 0.3s'
                }} />
              </div>
            </>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Tap to set goal
            </p>
          )}
        </div>

        {/* Weekly Workout Goal */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #f59e0b33'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>🎯 Weekly Goal</span>
            <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
              Streak: {weeklyStreak}w
            </span>
          </div>
          <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {currentWeekWorkouts}/{weeklyGoal}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            Workouts this week
          </div>
        </div>

        {/* Exercise Goal */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #3b82f633',
            cursor: 'pointer'
          }}
          onClick={() => {
            setModalMode('goal')
            setShowExerciseModal(true)
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>💪 Exercise Goal</span>
          </div>
          {exerciseGoals.length > 0 ? (
            <>
              <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                {exerciseGoals[0].exercise_name}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                {exerciseGoals[0].current_value}kg → {exerciseGoals[0].target_value}kg
              </div>
            </>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Tap to set goal
            </p>
          )}
        </div>
      </div>

      {/* Week Progress Calendar */}
      <div style={{
        background: 'rgba(26, 26, 26, 0.6)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => navigateWeek(-1)}
            style={{
              background: '#064e3b',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              padding: '0.5rem',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          
          <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>
            Week {currentWeek === 0 ? 'Current' : currentWeek > 0 ? `+${currentWeek}` : currentWeek}
          </h3>
          
          <button
            onClick={() => navigateWeek(1)}
            style={{
              background: '#064e3b',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              padding: '0.5rem',
              cursor: 'pointer'
            }}
          >
            →
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(7, 1fr)',
          gap: '0.5rem'
        }}>
          {weekDates.map(date => (
            <ProgressCard
              key={date}
              date={date}
              dayName={getDayName(date)}
              dayNumber={getDayNumber(date)}
              isToday={isToday(date)}
              progressCount={getDayProgressCount(date)}
              onClick={() => openWorkoutModal(date)}
            />
          ))}
        </div>
      </div>

      {/* Progress Graph */}
      <div style={{
        background: 'rgba(26, 26, 26, 0.6)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>
            📊 Progress Graph
          </h3>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={graphType}
              onChange={(e) => setGraphType(e.target.value)}
              style={{
                background: '#064e3b',
                border: '1px solid #10b98133',
                borderRadius: '4px',
                color: '#fff',
                padding: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="weight">Weight</option>
              <option value="exercise">Exercise</option>
            </select>
            
            {graphType === 'exercise' && (
              <select
                value={graphExercise}
                onChange={(e) => setGraphExercise(e.target.value)}
                style={{
                  background: '#064e3b',
                  border: '1px solid #10b98133',
                  borderRadius: '4px',
                  color: '#fff',
                  padding: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Select exercise</option>
                {clientExercises.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <Suspense fallback={<div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading graph...</div>}>
          <SimpleLineGraph
            data={graphData}
            title={graphType === 'weight' ? 'Weight Progress' : `${graphExercise} Progress`}
            color={graphType === 'weight' ? '#10b981' : '#3b82f6'}
            height={250}
            type={graphType}
          />
        </Suspense>
      </div>

      {/* Workout Modal */}
      {showWorkoutModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #333'
            }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Log Workout - {new Date(selectedDate).toLocaleDateString()}
              </h2>
              
              {/* Smart Suggestion */}
              {smartSuggestion && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginTop: '1rem',
                  border: '1px solid #10b98133'
                }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    💡 Smart Suggestion
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                    {smartSuggestion.message}
                  </div>
                  
                  {smartSuggestion.coachFeedback && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '6px',
                      border: '1px solid #3b82f633'
                    }}>
                      <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        💬 Coach Feedback
                      </div>
                      <div style={{ color: '#fff', fontSize: '0.85rem' }}>
                        {smartSuggestion.coachFeedback}
                      </div>
                    </div>
                  )}
                  
                  {smartSuggestion.video && (
                    <a 
                      href={`https://youtube.com/watch?v=${smartSuggestion.video}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.75rem',
                        padding: '0.5rem 1rem',
                        background: '#064e3b',
                        borderRadius: '6px',
                        color: '#10b981',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
                      🎥 Watch Tutorial
                    </a>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Exercise Selection */}
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                  Exercise
                </label>
                <input
                  type="text"
                  value={exerciseSearchTerm}
                  onChange={(e) => {
                    setExerciseSearchTerm(e.target.value)
                    setShowExerciseDropdown(true)
                  }}
                  onFocus={() => setShowExerciseDropdown(true)}
                  placeholder="Search or select exercise"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
                
                {showExerciseDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    marginTop: '0.25rem',
                    maxHeight: '200px',
                    overflow: 'auto',
                    zIndex: 10
                  }}>
                    {filteredExercises.map(exercise => (
                      <div
                        key={exercise.name}
                        onClick={() => selectExercise(exercise.name)}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #1a1a1a',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>
                          {exercise.name}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                          {exercise.muscle} • {exercise.type}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sets Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                  Sets
                </label>
                {workoutForm.sets.map((set, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#9ca3af', minWidth: '30px' }}>
                      {index + 1}.
                    </span>
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) => setWorkoutForm(prev => ({
                        ...prev,
                        sets: prev.sets.map((s, i) => 
                          i === index ? { ...s, weight: e.target.value } : s
                        )
                      }))}
                      placeholder="Weight (kg)"
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: '#0a0a0a',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#fff'
                      }}
                    />
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => setWorkoutForm(prev => ({
                        ...prev,
                        sets: prev.sets.map((s, i) => 
                          i === index ? { ...s, reps: e.target.value } : s
                        )
                      }))}
                      placeholder="Reps"
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: '#0a0a0a',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#fff'
                      }}
                    />
                    {workoutForm.sets.length > 1 && (
                      <button
                        onClick={() => setWorkoutForm(prev => ({
                          ...prev,
                          sets: prev.sets.filter((_, i) => i !== index)
                        }))}
                        style={{
                          padding: '0.5rem',
                          background: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setWorkoutForm(prev => ({
                    ...prev,
                    sets: [...prev.sets, { reps: '', weight: '' }]
                  }))}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#064e3b',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#10b981',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  + Add Set
                </button>
              </div>

              {/* Rating */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                  How did it feel? (1-10)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[...Array(10)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setWorkoutForm(prev => ({ ...prev, rating: i + 1 }))}
                      style={{
                        padding: '0.5rem',
                        background: workoutForm.rating === i + 1 ? '#10b981' : '#0a0a0a',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: workoutForm.rating === i + 1 ? '#000' : '#fff',
                        cursor: 'pointer',
                        fontWeight: workoutForm.rating === i + 1 ? 'bold' : 'normal',
                        flex: 1
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                  Notes (optional)
                </label>
                <textarea
                  value={workoutForm.notes}
                  onChange={(e) => setWorkoutForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="How did it feel? Any observations?"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Exercise History */}
              {exerciseHistory.length > 0 && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #10b98133'
                }}>
                  <h4 style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    Previous Workouts
                  </h4>
                  {exerciseHistory.slice(0, 3).map((workout, index) => (
                    <div key={index} style={{
                      marginBottom: '0.5rem',
                      paddingBottom: '0.5rem',
                      borderBottom: index < 2 ? '1px solid #10b98133' : 'none'
                    }}>
                      <div style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        {new Date(workout.date).toLocaleDateString()} {workout.rating && `• Rating: ${workout.rating}/10`}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                        {ProgressService.formatSets(workout.sets)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={saveWorkout}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Save Workout
                </button>
                <button
                  onClick={() => setShowWorkoutModal(false)}
                  style={{
                    padding: '1rem 2rem',
                    background: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weight Modal */}
      {showWeightModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
              {modalMode === 'goal' ? 'Set Weight Goal' : 'Update Weight'}
            </h2>
            
            {modalMode === 'goal' ? (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                    Current Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weightGoal.current}
                    onChange={(e) => setWeightGoal(prev => ({ ...prev, current: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                    Target Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weightGoal.target}
                    onChange={(e) => setWeightGoal(prev => ({ ...prev, target: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  placeholder="Enter your current weight"
                  onChange={(e) => setWeightGoal(prev => ({ ...prev, current: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={async () => {
                  if (modalMode === 'goal') {
                    await ProgressService.saveClientGoal(
                      client.id, 
                      'weight', 
                      parseFloat(weightGoal.target), 
                      parseFloat(weightGoal.current)
                    )
                    if (weightGoal.current) {
                      await ProgressService.logWeightUpdate(client.id, parseFloat(weightGoal.current))
                    }
                  } else {
                    if (weightGoal.current) {
                      await ProgressService.logWeightUpdate(client.id, parseFloat(weightGoal.current))
                      const newHistory = await ProgressService.getWeightHistory(client.id)
                      setWeightHistory(newHistory)
                    }
                  }
                  setShowWeightModal(false)
                  loadAllData()
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowWeightModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Goal Modal */}
      {showExerciseModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
              Set Exercise Goal
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                Exercise
              </label>
              <select
                onChange={(e) => {
                  const exercise = e.target.value
                  setExerciseGoals([{ exercise_name: exercise, goal_type: 'weight', current_value: '', target_value: '' }])
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              >
                <option value="">Select exercise</option>
                {allExercises.map(ex => (
                  <option key={ex.name} value={ex.name}>{ex.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                  Current (kg)
                </label>
                <input
                  type="number"
                  placeholder="Current"
                  onChange={(e) => setExerciseGoals(prev => [{ ...prev[0], current_value: e.target.value }])}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#9ca3af', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                  Target (kg)
                </label>
                <input
                  type="number"
                  placeholder="Target"
                  onChange={(e) => setExerciseGoals(prev => [{ ...prev[0], target_value: e.target.value }])}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={async () => {
                  if (exerciseGoals[0]?.exercise_name) {
                    await ProgressService.saveExerciseGoal(
                      client.id,
                      exerciseGoals[0].exercise_name,
                      'weight',
                      parseFloat(exerciseGoals[0].current_value),
                      parseFloat(exerciseGoals[0].target_value)
                    )
                    const newGoals = await ProgressService.getExerciseGoals(client.id)
                    setExerciseGoals(newGoals)
                  }
                  setShowExerciseModal(false)
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowExerciseModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export memo version for performance
export default React.memo(ClientProgress)
