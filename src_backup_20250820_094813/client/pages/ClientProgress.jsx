
// src/client/pages/ClientProgress.jsx
// MY ARC Client Progress - ULTIMATE FINETUNED VERSION 🔥
import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { supabase, getClientSchema } from '../../lib/supabase'

// ===== DATABASE FUNCTIONS (INLINE - NO EXTERNAL IMPORTS!) =====
const logWorkoutProgress = async ({ clientId, date, exerciseName, sets, notes, coachSuggestion = null, rating = null }) => {
  try {
    // Build insert object conditionally
    const insertData = {
      client_id: clientId,
      date: date,
      exercise_name: exerciseName,
      sets: sets, // Array of {weight, reps, notes}
      notes: notes,
      coach_suggestion: coachSuggestion,
      created_at: new Date().toISOString()
    }
    
    // Only add rating if column exists (remove this line after adding column)
    // if (rating !== null) insertData.rating = rating
    
    const { data, error } = await supabase.from('workout_progress').insert([insertData])
    if (error) throw error
    console.log('✅ Workout progress logged:', data)
    return data
  } catch (error) {
    console.error('❌ Log progress error:', error)
    throw error
  }
}

const getClientProgressByDate = async (clientId, date) => {
  try {
    const { data, error } = await supabase
      .from('workout_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get progress by date error:', error)
    return []
  }
}

const getExerciseProgress = async (clientId, exerciseName, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('workout_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('exercise_name', exerciseName)
      .order('date', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get exercise progress error:', error)
    return []
  }
}

const getClientExercises = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('workout_progress')
      .select('exercise_name')
      .eq('client_id', clientId)
    if (error) throw error
    const uniqueExercises = [...new Set((data || []).map(d => d.exercise_name))]
    return uniqueExercises
  } catch (error) {
    console.error('❌ Get exercises error:', error)
    return []
  }
}

// ===== NEW PROGRESS GOALS DATABASE FUNCTIONS =====

// 1. VERVANG de saveWeightGoal functie met deze versie:
const saveWeightGoal = async (clientId, currentWeight, goalWeight) => {
  try {
    // First check if goal exists to preserve start_value
    const { data: existingGoal } = await supabase
      .from('client_goals')
      .select('start_value')
      .eq('client_id', clientId)
      .eq('goal_type', 'weight')
      .single()
    
    // BELANGRIJK: Als er al een start_value is, ALTIJD behouden!
    // Anders gebruik huidige gewicht als start
    const startValue = existingGoal?.start_value || currentWeight
    
    const { data, error } = await supabase
      .from('client_goals')
      .upsert({
        client_id: clientId,
        goal_type: 'weight',
        current_value: currentWeight,
        target_value: goalWeight,
        start_value: startValue, // Dit wordt NOOIT overschreven als het al bestaat
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id,goal_type' })
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('❌ Save weight goal error:', error)
    throw error
  }
}

const deleteWeightGoal = async (clientId) => {
  try {
    const { error } = await supabase
      .from('client_goals')
      .delete()
      .eq('client_id', clientId)
      .eq('goal_type', 'weight')
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('❌ Delete weight goal error:', error)
    throw error
  }
}

const deleteExerciseGoal = async (clientId, exerciseName) => {
  try {
    const { error } = await supabase
      .from('exercise_goals')
      .delete()
      .eq('client_id', clientId)
      .eq('exercise_name', exerciseName)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('❌ Delete exercise goal error:', error)
    throw error
  }
}

const logWeightUpdate = async (clientId, weight, date = new Date().toISOString().split('T')[0]) => {
  try {
    // Log the weight entry
    const { data, error } = await supabase
      .from('weight_tracking')
      .insert({
        client_id: clientId,
        weight: weight,
        date: date,
        created_at: new Date().toISOString()
      })
    if (error) throw error
    
    // Also update current_value in client_goals
    const { error: updateError } = await supabase
      .from('client_goals')
      .update({
        current_value: weight,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('goal_type', 'weight')
    
    if (updateError) console.error('Error updating goal current value:', updateError)
    
    return data
  } catch (error) {
    console.error('❌ Log weight update error:', error)
    throw error
  }
}

const getWeightHistory = async (clientId, limit = 30) => {
  try {
    const { data, error } = await supabase
      .from('weight_tracking')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get weight history error:', error)
    return []
  }
}

const saveExerciseGoal = async (clientId, exerciseName, goalType, currentValue, targetValue) => {
  try {
    const { data, error } = await supabase
      .from('exercise_goals')
      .upsert({
        client_id: clientId,
        exercise_name: exerciseName,
        goal_type: goalType, // 'weight', 'reps', '1rm'
        current_value: currentValue,
        target_value: targetValue,
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id,exercise_name' })
    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Save exercise goal error:', error)
    throw error
  }
}

const logExerciseUpdate = async (clientId, exerciseName, value, goalType) => {
  try {
    // Update the current value in exercise_goals table
    const { data: updateData, error: updateError } = await supabase
      .from('exercise_goals')
      .update({
        current_value: value,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('exercise_name', exerciseName)
    
    if (updateError) throw updateError
    
    // Also log this as a workout progress entry for tracking
    const { data, error } = await supabase
      .from('workout_progress')
      .insert({
        client_id: clientId,
        date: new Date().toISOString().split('T')[0],
        exercise_name: exerciseName,
        sets: [{
          weight: goalType === 'weight' ? value : 0,
          reps: goalType === 'reps' ? value : 1
        }],
        notes: `Goal update: ${value} ${goalType}`,
        created_at: new Date().toISOString()
      })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Log exercise update error:', error)
    throw error
  }
}

const saveWeeklyWorkoutGoal = async (clientId, targetWorkouts) => {
  try {
    const { data, error } = await supabase
      .from('client_goals')
      .upsert({
        client_id: clientId,
        goal_type: 'weekly_workouts',
        target_value: targetWorkouts,
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id,goal_type' })
    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Save weekly goal error:', error)
    throw error
  }
}

const getClientGoals = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('client_goals')
      .select('*')
      .eq('client_id', clientId)
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get client goals error:', error)
    return []
  }
}

const getExerciseGoals = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('exercise_goals')
      .select('*')
      .eq('client_id', clientId)
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get exercise goals error:', error)
    return []
  }
}

// ===== UTILITY FUNCTIONS =====
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]
}

const getWeekDates = (baseDate = new Date()) => {
  const currentDay = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - currentDay + 1)
  
  const weekDates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    weekDates.push(date.toISOString().split('T')[0])
  }
  return weekDates
}

const formatSets = (sets) => {
  if (!sets || sets.length === 0) return ''
  return sets.map(set => `${set.weight}kg × ${set.reps}`).join(', ')
}

const calculate1RM = (weight, reps) => {
  if (!weight || !reps || reps <= 0) return 0
  return weight * (1 + (reps / 30)) // Epley formula
}

const calculateWeeklyStreak = async (clientId, targetWorkouts) => {
  // Calculate how many weeks in a row the goal has been achieved
  let streak = 0
  let weekOffset = 0
  
  while (true) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1 - (weekOffset * 7))
    const weekDates = getWeekDates(weekStart)
    
    let workoutCount = 0
    for (const date of weekDates) {
      const dayProgress = await getClientProgressByDate(clientId, date)
      if (dayProgress.length > 0) workoutCount++
    }
    
    if (workoutCount >= targetWorkouts) {
      streak++
      weekOffset++
    } else {
      break
    }
    
    if (weekOffset > 52) break // Max 1 year
  }
  
  return streak
}

// ===== COMPREHENSIVE AI EXERCISE DATABASE =====
const AI_EXERCISE_DATABASE = {
  chest: {
    compound: [
      { name: "Machine Chest Press", equipment: "machine", stretch: true, priority: 1, ratings: { strength: 5, hypertrophy: 5, personal: 5 } },
      { name: "Incline Dumbbell Press", equipment: "dumbbells", stretch: true, priority: 2, ratings: { strength: 8, hypertrophy: 8, personal: 8 } },
      { name: "Barbell Bench Press", equipment: "barbell", stretch: false, priority: 3, ratings: { strength: 10, hypertrophy: 8, personal: 10 } },
      { name: "Weighted Dips", equipment: "bodyweight", stretch: true, priority: 4, ratings: { strength: 9, hypertrophy: 9, personal: 7 } }
    ],
    isolation: [
      { name: "Incline Cable Flies", equipment: "cables", stretch: true, priority: 1, ratings: { strength: 8, hypertrophy: 10, personal: 8 } },
      { name: "Machine Pec Deck", equipment: "machine", stretch: true, priority: 2, ratings: { strength: 8, hypertrophy: 10, personal: 8 } }
    ]
  },
  back: {
    compound: [
      { name: "Lat Pulldown", equipment: "cables", stretch: true, priority: 1, ratings: { strength: 8, hypertrophy: 9, personal: 9 } },
      { name: "Weighted Pull-Ups", equipment: "bodyweight", stretch: true, priority: 1, ratings: { strength: 10, hypertrophy: 10, personal: 10 } },
      { name: "T-Bar Row", equipment: "machine", stretch: true, priority: 2, ratings: { strength: 8, hypertrophy: 10, personal: 9 } },
      { name: "Cable Row", equipment: "cables", stretch: true, priority: 3, ratings: { strength: 7, hypertrophy: 8, personal: 8 } }
    ]
  },
  shoulders: {
    compound: [
      { name: "Machine Shoulder Press", equipment: "machine", stretch: false, priority: 1, ratings: { strength: 8, hypertrophy: 8, personal: 8 } },
      { name: "Dumbbell Shoulder Press", equipment: "dumbbells", stretch: false, priority: 2, ratings: { strength: 8, hypertrophy: 8, personal: 8 } }
    ],
    isolation: [
      { name: "Cable Lateral Raises", equipment: "cables", stretch: true, priority: 1, ratings: { strength: 8, hypertrophy: 10, personal: 10 } }
    ]
  },
  legs: {
    compound: [
      { name: "Leg Press", equipment: "machine", stretch: true, priority: 1, ratings: { strength: 8, hypertrophy: 9, personal: 9 } },
      { name: "Romanian Deadlift", equipment: "barbell", stretch: true, priority: 2, ratings: { strength: 9, hypertrophy: 10, personal: 10 } },
      { name: "High-Bar Back Squat", equipment: "barbell", stretch: true, priority: 2, ratings: { strength: 9, hypertrophy: 8, personal: 7 } }
    ],
    isolation: [
      { name: "Leg Extension", equipment: "machine", stretch: true, priority: 1, ratings: { strength: 5, hypertrophy: 9, personal: 9 } },
      { name: "Leg Curl", equipment: "machine", stretch: true, priority: 2, ratings: { strength: 5, hypertrophy: 9, personal: 9 } }
    ]
  },
  biceps: {
    isolation: [
      { name: "Incline Dumbbell Curl", equipment: "dumbbells", stretch: true, priority: 1, ratings: { strength: 5, hypertrophy: 10, personal: 10 } },
      { name: "Cable Bicep Curls", equipment: "cables", stretch: true, priority: 1, ratings: { strength: 5, hypertrophy: 9, personal: 9 } }
    ]
  },
  triceps: {
    isolation: [
      { name: "Cable Overhead Triceps Extension", equipment: "cables", stretch: true, priority: 1, ratings: { strength: 5, hypertrophy: 10, personal: 10 } },
      { name: "Triceps Pushdown", equipment: "cables", stretch: false, priority: 2, ratings: { strength: 6, hypertrophy: 8, personal: 8 } }
    ]
  }
}

// Get all exercises from AI database
function getAllAIExercises() {
  const allExercises = []
  
  Object.keys(AI_EXERCISE_DATABASE).forEach(muscleGroup => {
    if (AI_EXERCISE_DATABASE[muscleGroup].compound) {
      AI_EXERCISE_DATABASE[muscleGroup].compound.forEach(exercise => {
        allExercises.push({
          ...exercise,
          muscleGroup: muscleGroup,
          type: 'compound'
        })
      })
    }
    
    if (AI_EXERCISE_DATABASE[muscleGroup].isolation) {
      AI_EXERCISE_DATABASE[muscleGroup].isolation.forEach(exercise => {
        allExercises.push({
          ...exercise,
          muscleGroup: muscleGroup,
          type: 'isolation'
        })
      })
    }
  })
  
  return allExercises
}

// Generate smart suggestion based on history
const generateSmartSuggestion = async (clientId, exerciseName) => {
  try {
    const allAIExercises = getAllAIExercises()
    const exerciseData = allAIExercises.find(ex => ex.name === exerciseName)
    
    const history = await getExerciseProgress(clientId, exerciseName, 3)
    
    if (history.length === 0) {
      let message = '🆕 Eerste keer deze oefening! Start met een comfortabel gewicht.'
      
      if (exerciseData) {
        if (exerciseData.stretch) {
          message += ' Deze oefening heeft stretch-tension voordelen. Focus op de stretch positie!'
        }
        if (exerciseData.ratings?.hypertrophy >= 9) {
          message += ' 🔥 Dit is een TOP hypertrophy oefening!'
        }
      }
      
      return {
        type: 'first_time',
        message: message,
        recommendedReps: '8-12'
      }
    }
    
    const lastWorkout = history[0]
    const lastSets = lastWorkout.sets || []
    
    if (lastSets.length === 0) {
      return {
        type: 'no_data',
        message: '📝 Geen data van vorige workout. Begin opnieuw!',
        recommendedReps: '8-12'
      }
    }
    
    const avgReps = lastSets.reduce((sum, set) => sum + (set.reps || 0), 0) / lastSets.length
    const maxWeight = Math.max(...lastSets.map(set => set.weight || 0))
    const minReps = Math.min(...lastSets.map(set => set.reps || 0))
    
    let progression = null
    if (history.length >= 2) {
      const current1RM = Math.max(...lastSets.map(set => calculate1RM(set.weight || 0, set.reps || 0)))
      const previous1RM = Math.max(...history[1].sets.map(set => calculate1RM(set.weight || 0, set.reps || 0)))
      progression = ((current1RM - previous1RM) / previous1RM) * 100
    }
    
    let suggestion = null
    
    if (avgReps >= 12 && minReps >= 12) {
      let message = `💪 Geweldig! Je haalde gemiddeld ${Math.round(avgReps)} reps. Tijd voor zwaarder! Probeer ${maxWeight + 2.5}kg.`
      
      if (progression && progression > 5) {
        message += ` 📈 Je 1RM steeg met ${progression.toFixed(1)}%!`
      }
      
      suggestion = {
        type: 'increase_weight',
        message: message,
        recommendedWeight: maxWeight + 2.5,
        recommendedReps: '8-10',
        progression: progression
      }
    } else if (avgReps < 6) {
      suggestion = {
        type: 'decrease_weight',
        message: `⚠️ Je haalde gemiddeld ${Math.round(avgReps)} reps. Lichter gewicht voor betere vorm. Probeer ${Math.max(maxWeight - 2.5, 0)}kg.`,
        recommendedWeight: Math.max(maxWeight - 2.5, 0),
        recommendedReps: '8-12'
      }
    } else if (avgReps >= 6 && avgReps < 8) {
      suggestion = {
        type: 'more_reps',
        message: `📊 Focus op meer reps! Je zit op ${Math.round(avgReps)} reps. Probeer 8-12 reps met ${maxWeight}kg.`,
        recommendedWeight: maxWeight,
        recommendedReps: '8-12'
      }
    } else {
      let message = `✅ Perfect! Je zit in de ideale range (${Math.round(avgReps)} reps). Hou ${maxWeight}kg vast en focus op vorm.`
      
      if (progression && progression > 0) {
        message += ` 📈 Je 1RM verbeterde met ${progression.toFixed(1)}%!`
      }
      
      suggestion = {
        type: 'maintain',
        message: message,
        recommendedWeight: maxWeight,
        recommendedReps: '8-12',
        progression: progression
      }
    }
    
    return suggestion
    
  } catch (error) {
    console.error('Error generating smart suggestion:', error)
    return {
      type: 'error',
      message: '💭 Kon geen suggestie genereren. Ga op gevoel!',
      recommendedReps: '8-12'
    }
  }
}

// ===== ENHANCED PROGRESS CHART COMPONENT WITH DATES =====
function ProgressChart({ data, type = 'weight', color = '#10b981' }) {
  if (!data || data.length < 2) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        color: '#8ea39b',
        fontSize: '0.9rem'
      }}>
        Nog geen grafiek - minimaal 2 datapunten nodig!
      </div>
    )
  }

  // Calculate scales
  const values = data.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue || 1
  
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((point.value - minValue) / range) * 80
    return { x, y, ...point }
  })
  
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ')
  
  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return `${date.getDate()}/${date.getMonth() + 1}`
  }
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        style={{
          width: '100%',
          height: '100%'
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        
        {/* Progress line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              stroke="#fff"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
      
      {/* Y-axis labels (values) */}
      <div style={{
        position: 'absolute',
        left: '-45px',
        top: '10%',
        fontSize: '0.75rem',
        color: color,
        fontWeight: '600'
      }}>
        {Math.round(maxValue)}{type === 'weight' ? 'kg' : ''}
      </div>
      <div style={{
        position: 'absolute',
        left: '-45px',
        bottom: '10%',
        fontSize: '0.75rem',
        color: color,
        fontWeight: '600'
      }}>
        {Math.round(minValue)}{type === 'weight' ? 'kg' : ''}
      </div>
      
      {/* X-axis labels with dates */}
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 5px'
      }}>
        {points.map((point, index) => {
          // Show dates for first, last, and middle points
          if (index === 0 || index === points.length - 1 || 
              (points.length > 4 && index === Math.floor(points.length / 2))) {
            return (
              <div key={index} style={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.7)',
                position: 'absolute',
                left: `${point.x}%`,
                transform: 'translateX(-50%)'
              }}>
                {formatDate(point.date)}
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

// ===== MAIN COMPONENT =====
export default function ClientProgress({ client, schema }) {
  const { t, language } = useLanguage()
  const isMobile = window.innerWidth <= 768
  
  // State management
  const [currentWeek, setCurrentWeek] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null)
  const [weekDates, setWeekDates] = useState([])
  const [weekProgress, setWeekProgress] = useState({})
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [exerciseHistory, setExerciseHistory] = useState([])
  const [clientExercises, setClientExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false) // Force re-render trigger
  
  // Goal & Progress States
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)
  const [modalMode, setModalMode] = useState('goal') // 'goal' or 'update'
  
  const [weightGoal, setWeightGoal] = useState({ current: '', target: '', startWeight: '' })
  const [weightUpdate, setWeightUpdate] = useState('')
  const [exerciseGoal, setExerciseGoal] = useState({ exercise: '', type: 'weight', current: '', target: '' })
  const [exerciseUpdate, setExerciseUpdate] = useState('')
  const [weeklyGoal, setWeeklyGoal] = useState(4)
  const [weeklyStreak, setWeeklyStreak] = useState(0)
  
  const [clientGoals, setClientGoals] = useState([])
  const [exerciseGoals, setExerciseGoals] = useState([])
  const [weightHistory, setWeightHistory] = useState([])
  const [currentWeekWorkouts, setCurrentWeekWorkouts] = useState(0)
  
  // Graph states
  const [graphType, setGraphType] = useState('weight') // 'weight', 'exercise'
  const [graphExercise, setGraphExercise] = useState('')
  const [graphMetric, setGraphMetric] = useState('kg') // 'kg', 'reps', 'sets', 'performance'
  const [graphData, setGraphData] = useState([])
  
  // Workout form state
  const [workoutForm, setWorkoutForm] = useState({
    exerciseName: '',
    sets: [{ reps: '', weight: '' }],
    notes: '',
    rating: 5
  })
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('')
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
  const [smartSuggestion, setSmartSuggestion] = useState(null)

  // Week navigation - only load when week changes, not on initial mount
  useEffect(() => {
    if (dataLoaded && client?.id) {
      const today = new Date()
      today.setDate(today.getDate() + (currentWeek * 7))
      const dates = getWeekDates(today)
      setWeekDates(dates)
      loadWeekProgress(dates)
      calculateCurrentWeekWorkouts(dates)
    }
  }, [currentWeek, dataLoaded])

  // Load client data on mount
  useEffect(() => {
    if (client?.id) {
      // Load all data in parallel but wait for completion
      const loadAllData = async () => {
        try {
          setLoading(true)
          setDataLoaded(false)
          
          // First load exercises and basic data
          await loadClientExercises()
          
          // Load weight history with duplicate filtering
          const history = await getWeightHistory(client.id)
          
          // Filter duplicates - keep only the latest entry per day
          const uniqueByDate = {}
          history.forEach(entry => {
            const date = entry.date
            if (!uniqueByDate[date] || new Date(entry.created_at) > new Date(uniqueByDate[date].created_at)) {
              uniqueByDate[date] = entry
            }
          })
          
          // Convert back to array and sort by date descending (newest first)
          const weightData = Object.values(uniqueByDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
          
          setWeightHistory(weightData)
          
          // Then load goals with weight data available
          const goals = await getClientGoals(client.id)
          setClientGoals(goals)
          
// Process weight goal - ALTIJD start_value uit database gebruiken!
const weightGoalData = goals.find(g => g.goal_type === 'weight')
if (weightGoalData) {
  let currentWeight = weightGoalData.current_value
  
  // Use most recent weight history for current weight
  if (weightData && weightData.length > 0) {
    currentWeight = weightData[0].weight
  }
  
  setWeightGoal({
    current: currentWeight || 76,
    target: weightGoalData.target_value || 70,
    startWeight: weightGoalData.start_value || currentWeight || 80 // ALTIJD uit DB!
  })
}
          
          // Set weekly workout goal
          const weeklyGoalData = goals.find(g => g.goal_type === 'weekly_workouts')
          if (weeklyGoalData) {
            setWeeklyGoal(weeklyGoalData.target_value || 4)
          }
          
          // Load exercise goals
          const exerciseGoalsData = await getExerciseGoals(client.id)
          setExerciseGoals(exerciseGoalsData)
          
          // Load week data for exercise progress calculation
          const dates = getWeekDates()
          setWeekDates(dates)
          await loadWeekProgress(dates)
          
          // Load other data
          await calculateCurrentWeekWorkouts(dates)
          await loadWeeklyStreak()
          
          // Mark data as loaded - this triggers re-render
          setDataLoaded(true)
          setLoading(false)
        } catch (error) {
          console.error('Error loading data:', error)
          setLoading(false)
        }
      }
      
      loadAllData()
    }
  }, [client])

  // Force re-render when data changes
  useEffect(() => {
    // Trigger graph update when data changes
    updateGraphData()
  }, [graphType, graphExercise, graphMetric, weightHistory, exerciseHistory, weekProgress, exerciseGoals])

  const loadClientExercises = async () => {
    try {
      const dbExercises = await getClientExercises(client.id)
      const aiExercises = getAllAIExercises()
      
      const allExercises = [
        ...dbExercises,
        ...aiExercises
          .filter(ex => !dbExercises.includes(ex.name))
          .map(ex => ex.name)
      ]
      
      setClientExercises(allExercises)
      if (allExercises.length > 0 && !graphExercise) {
        setGraphExercise(allExercises[0])
      }
    } catch (error) {
      console.error('Error loading exercises:', error)
    }
  }

const loadClientGoals = async () => {
  try {
    const goals = await getClientGoals(client.id)
    setClientGoals(goals)

    // Set weight goal - GEBRUIK ALTIJD start_value uit database!
    const weightGoalData = goals.find(g => g.goal_type === 'weight')
    if (weightGoalData) {
      setWeightGoal({   
        current: weightGoalData.current_value || weightGoalData.target_value,
        target: weightGoalData.target_value,
        startWeight: weightGoalData.start_value || weightGoalData.current_value || 80
      })
    }
      
    // Set weekly workout goal
    const weeklyGoalData = goals.find(g => g.goal_type === 'weekly_workouts')
    if (weeklyGoalData) {
      setWeeklyGoal(weeklyGoalData.target_value || 4)
    }
  } catch (error) {
    console.error('Error loading goals:', error)
  }
}
      
const loadExerciseGoalsData = async () => {
  try {
    const goals = await getExerciseGoals(client.id)
    setExerciseGoals(goals)
  } catch (error) {
    console.error('Error loading exercise goals:', error)
  }
}
    
const loadWeightHistory = async () => {
  try {
    const history = await getWeightHistory(client.id)

    // Filter duplicates - keep only the latest entry per day
    const uniqueByDate = {}
    history.forEach(entry => {
      const date = entry.date
      if (!uniqueByDate[date] || new Date(entry.created_at) > new Date(uniqueByDate[date].created_at)) {
        uniqueByDate[date] = entry
      }
    })      
      // Convert back to array and sort by date descending (newest first)
      const filteredHistory = Object.values(uniqueByDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      
      setWeightHistory(filteredHistory)
      return filteredHistory
    } catch (error) {
      console.error('Error loading weight history:', error)
      return []
    }
  }

  const loadWeeklyStreak = async () => {
    try {
      const streak = await calculateWeeklyStreak(client.id, weeklyGoal)
      setWeeklyStreak(streak)
    } catch (error) {
      console.error('Error calculating streak:', error)
    }
  }

  const loadWeekProgress = async (dates) => {
    try {
      const progressData = {}
      
      for (const date of dates) {
        const dayProgress = await getClientProgressByDate(client.id, date)
        progressData[date] = dayProgress
      }
      
      setWeekProgress(progressData)
      return progressData // Return data for immediate use
    } catch (error) {
      console.error('Error loading week progress:', error)
      return {}
    }
  }

  const calculateCurrentWeekWorkouts = async (dates) => {
    let count = 0
    for (const date of dates) {
      const dayProgress = await getClientProgressByDate(client.id, date)
      if (dayProgress.length > 0) count++
    }
    setCurrentWeekWorkouts(count)
  }

  const loadExerciseHistory = async (exerciseName) => {
    try {
      const history = await getExerciseProgress(client.id, exerciseName, 10)
      setExerciseHistory(history)
    } catch (error) {
      console.error('Error loading exercise history:', error)
    }
  }

  const updateGraphData = async () => {
    if (graphType === 'weight' && weightHistory.length > 0) {
      // Filter duplicates again to be safe - keep only latest per day
      const uniqueByDate = {}
      weightHistory.forEach(entry => {
        const date = entry.date
        if (!uniqueByDate[date] || new Date(entry.created_at) > new Date(uniqueByDate[date].created_at)) {
          uniqueByDate[date] = entry
        }
      })
      
      // Convert to array and sort by date ascending (oldest first) for correct graph display
      const filteredHistory = Object.values(uniqueByDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      
      const data = filteredHistory
        .slice(-30) // Last 30 unique dates
        .map(entry => ({
          date: entry.date,
          value: parseFloat(entry.weight),
          label: `${entry.weight}kg`
        }))
      
      setGraphData(data)
    } else if (graphType === 'exercise' && graphExercise) {
      const history = await getExerciseProgress(client.id, graphExercise, 20)
      
      // Sort by date ascending (oldest first)
      const sortedHistory = [...history].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      )
      
      let data = []
      if (graphMetric === 'kg') {
        data = sortedHistory.map(entry => ({
          date: entry.date,
          value: Math.max(...(entry.sets || []).map(s => s.weight || 0)),
          label: `${Math.max(...(entry.sets || []).map(s => s.weight || 0))}kg`
        }))
      } else if (graphMetric === 'reps') {
        data = sortedHistory.map(entry => ({
          date: entry.date,
          value: (entry.sets || []).reduce((sum, s) => sum + (s.reps || 0), 0),
          label: `${(entry.sets || []).reduce((sum, s) => sum + (s.reps || 0), 0)} reps`
        }))
      } else if (graphMetric === 'sets') {
        data = sortedHistory.map(entry => ({
          date: entry.date,
          value: (entry.sets || []).length,
          label: `${(entry.sets || []).length} sets`
        }))
      } else if (graphMetric === 'performance') {
        data = sortedHistory.map(entry => {
          const max1RM = Math.max(...(entry.sets || []).map(s => calculate1RM(s.weight || 0, s.reps || 0)))
          return {
            date: entry.date,
            value: max1RM,
            label: `${Math.round(max1RM)}kg 1RM`
          }
        })
      }
      
      setGraphData(data.filter(d => d.value > 0))
    }
  }

  // Modal handlers
  const openWorkoutModal = async (date) => {
    setSelectedDate(date)
    setShowWorkoutModal(true)
    
    if (selectedExercise) {
      await loadExerciseHistory(selectedExercise)
      const suggestion = await generateSmartSuggestion(client.id, selectedExercise)
      setSmartSuggestion(suggestion)
    }
  }

  const closeWorkoutModal = () => {
    setShowWorkoutModal(false)
    setSelectedDate(null)
    setWorkoutForm({
      exerciseName: '',
      sets: [{ reps: '', weight: '' }],
      notes: '',
      rating: 5
    })
    setExerciseHistory([])
    setExerciseSearchTerm('')
    setShowExerciseDropdown(false)
    setSmartSuggestion(null)
  }

  const openWeightModal = (mode = 'goal') => {
    setModalMode(mode)
    
    // Reset form if creating new goal
    if (mode === 'goal' && !weightGoal.target) {
      setWeightGoal({ current: '', target: '', startWeight: '' })
    }
    
    setShowWeightModal(true)
  }


// ===== GECORRIGEERDE MODAL HANDLER =====
const openExerciseModal = (mode = 'goal', existingGoal = null) => {
  setModalMode(mode)
  
  // Set existing goal data if updating
  if (existingGoal) {
    setExerciseGoal({
      exercise: existingGoal.exercise_name,
      type: existingGoal.goal_type,
      current: existingGoal.current_value || '',
      target: existingGoal.target_value || ''
    })
    // BELANGRIJK: Initialiseer exerciseUpdate met de huidige waarde!
    setExerciseUpdate(existingGoal.current_value || '')
  } else if (mode === 'goal') {
    // Reset for new goal
    setExerciseGoal({ exercise: '', type: 'weight', current: '', target: '' })
    setExerciseUpdate('')
  }
  
  setShowExerciseModal(true)
}

// VERVANG de saveWeightHandler functie met deze versie:
const saveWeightHandler = async () => {
  try {
    if (modalMode === 'goal') {
      // Bij eerste keer goal instellen
      await saveWeightGoal(client.id, parseFloat(weightGoal.current), parseFloat(weightGoal.target))
      if (weightGoal.current) {
        await logWeightUpdate(client.id, parseFloat(weightGoal.current))
      }
      alert('✅ Gewicht doel succesvol ingesteld!')
      
      // Reload alles voor nieuwe goal
      await loadClientGoals()
      await loadWeightHistory()
      
    } else {
      // Update mode
      const newWeight = parseFloat(weightUpdate)
      
      // 1. Eerst weight update loggen
      await logWeightUpdate(client.id, newWeight)
      
      // 2. Ook update in client_goals table
      await supabase
        .from('client_goals')
        .update({
          current_value: newWeight,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', client.id)
        .eq('goal_type', 'weight')
      
      // 3. Direct de state updaten ZONDER te reloaden
      setWeightGoal(prev => ({ 
        ...prev, 
        current: newWeight
      }))
      
      // 4. Alleen weight history reloaden (niet goals!)
      const history = await getWeightHistory(client.id)
      
      // Filter duplicates
      const uniqueByDate = {}
      history.forEach(entry => {
        const date = entry.date
        if (!uniqueByDate[date] || new Date(entry.created_at) > new Date(uniqueByDate[date].created_at)) {
          uniqueByDate[date] = entry
        }
      })
      
      const weightData = Object.values(uniqueByDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      
      setWeightHistory(weightData)
      
      setWeightUpdate('')
      alert('✅ Gewicht succesvol geüpdatet!')
    }
    
    setShowWeightModal(false)
    
  } catch (error) {
    console.error('Error saving weight:', error)
    alert('❌ Fout bij opslaan gewicht')
  }
}


// ===== GECORRIGEERDE SAVE HANDLER =====

const saveExerciseHandler = async () => {
  try {
    if (modalMode === 'goal') {
      // Save new exercise goal
      await saveExerciseGoal(
        client.id, 
        exerciseGoal.exercise, 
        exerciseGoal.type,
        parseFloat(exerciseGoal.current) || 0,
        parseFloat(exerciseGoal.target) || 0
      )
      
      if (exerciseGoal.current) {
        await logWorkoutProgress({
          clientId: client.id,
          date: getTodayDate(),
          exerciseName: exerciseGoal.exercise,
          sets: [{
            weight: exerciseGoal.type === 'weight' ? parseFloat(exerciseGoal.current) : 0,
            reps: exerciseGoal.type === 'reps' ? parseFloat(exerciseGoal.current) : 1
          }],
          notes: 'Start meting voor doel'
        })
      }
      
      alert(`✅ Doel voor ${exerciseGoal.exercise} succesvol ingesteld!`)
      
    } else {
      // Update mode
      if (!exerciseUpdate || exerciseUpdate === '') {
        alert('❌ Vul een nieuwe waarde in!')
        return
      }
      
      // Update in database
      await logExerciseUpdate(
        client.id,
        exerciseGoal.exercise,
        parseFloat(exerciseUpdate),
        exerciseGoal.type
      )
      
      // Direct de state updaten voor snelle UI feedback
      setExerciseGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.exercise_name === exerciseGoal.exercise
            ? { 
                ...goal, 
                current_value: parseFloat(exerciseUpdate) 
              }
            : goal
))
      
      alert('✅ Oefening progress succesvol geüpdatet!')
    }
    
    // Sluit modal en reset
    setShowExerciseModal(false)
    setExerciseGoal({ exercise: '', type: 'weight', current: '', target: '' })
    setExerciseUpdate('')
    
    // Herlaad goals van database voor zekerheid
    const freshGoals = await getExerciseGoals(client.id)
    setExerciseGoals(freshGoals)
    
  } catch (error) {
    console.error('Error saving exercise goal:', error)
    alert('❌ Fout bij opslaan oefening doel')
  }
}







  const saveWeeklyGoalHandler = async () => {
    try {
      await saveWeeklyWorkoutGoal(client.id, weeklyGoal)
      await loadWeeklyStreak()
      alert(`✅ Wekelijks doel ingesteld op ${weeklyGoal} workouts per week!`)
      setShowWeeklyModal(false)
      
    } catch (error) {
      console.error('Error saving weekly goal:', error)
      alert('❌ Fout bij opslaan week doel')
    }
  }

  const addSet = () => {
    setWorkoutForm(prev => ({
      ...prev,
      sets: [...prev.sets, { reps: '', weight: '' }]
    }))
  }

  const updateSet = (index, field, value) => {
    setWorkoutForm(prev => ({
      ...prev,
      sets: prev.sets.map((set, i) => 
        i === index ? { ...set, [field]: value } : set
      )
    }))
  }

  const removeSet = (index) => {
    if (workoutForm.sets.length > 1) {
      setWorkoutForm(prev => ({
        ...prev,
        sets: prev.sets.filter((_, i) => i !== index)
      }))
    }
  }

  const saveWorkout = async () => {
    try {
      if (!workoutForm.exerciseName || workoutForm.sets.some(set => !set.reps || !set.weight)) {
        alert('Vul alle velden in!')
        return
      }

      await logWorkoutProgress({
        clientId: client.id,
        date: selectedDate,
        exerciseName: workoutForm.exerciseName,
        sets: workoutForm.sets.map(set => ({
          reps: parseInt(set.reps),
          weight: parseFloat(set.weight)
        })),
        notes: workoutForm.notes
        // rating: workoutForm.rating // Uncomment after adding rating column to database
      })
      
      await loadWeekProgress(weekDates)
      await calculateCurrentWeekWorkouts(weekDates)
      closeWorkoutModal()
      
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Fout bij opslaan workout')
    }
  }

  const selectExercise = async (exerciseName) => {
    setWorkoutForm(prev => ({ ...prev, exerciseName }))
    setSelectedExercise(exerciseName)
    setExerciseSearchTerm(exerciseName)
    setShowExerciseDropdown(false)
    
    if (exerciseName) {
      await loadExerciseHistory(exerciseName)
      const suggestion = await generateSmartSuggestion(client.id, exerciseName)
      setSmartSuggestion(suggestion)
    }
  }

  const getFilteredExercises = () => {
    const searchTerm = exerciseSearchTerm.toLowerCase()
    const allAIExercises = getAllAIExercises()
    
    if (!searchTerm) {
      return allAIExercises.slice(0, 10)
    }
    
    return allAIExercises
      .filter(ex => ex.name.toLowerCase().includes(searchTerm))
      .slice(0, 10)
  }

  // Helper functions
  const getDayName = (date) => {
    const days = language === 'nl' 
      ? ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[new Date(date).getDay()]
  }

  const getDayNumber = (date) => {
    return new Date(date).getDate()
  }

  const isToday = (date) => {
    return date === getTodayDate()
  }

  const getDayProgressCount = (date) => {
    return weekProgress[date]?.length || 0
  }
const getWeightProgress = () => {
  // HIER DE NIEUWE VERSIE VAN getWeightProgress
  const startWeight = parseFloat(weightGoal.startWeight) || 80
  let currentWeight = parseFloat(weightGoal.current) || 76
  const targetWeight = parseFloat(weightGoal.target) || 70
  
  if (weightHistory && weightHistory.length > 0) {
    currentWeight = parseFloat(weightHistory[0].weight)
  }
  
  if (!targetWeight) return null
  
  const totalToLose = startWeight - targetWeight
  const alreadyLost = startWeight - currentWeight
  const percentage = totalToLose > 0 ? (alreadyLost / totalToLose) * 100 : 0
  
  return {
    lost: alreadyLost.toFixed(1),
    toGo: (currentWeight - targetWeight).toFixed(1),
    percentage: Math.min(100, Math.max(0, percentage)).toFixed(0),
    current: currentWeight,
    start: startWeight
  }
}

const getExerciseGoalProgress = () => {
  // HIER DE BESTAANDE getExerciseGoalProgress FUNCTIE
  if (!exerciseGoals.length) return null
  
  const activeGoal = exerciseGoals.find(g => 
    (g.current_value || 0) < (g.target_value || 100)
  ) || exerciseGoals[0]
  
  if (!activeGoal) return null
  
  const current = activeGoal.current_value || 0
  const target = activeGoal.target_value || 100
  const toGo = target - current
  
  return {
    exercise: activeGoal.exercise_name,
    current: current,
    target: target,
    toGo: toGo > 0 ? toGo.toFixed(1) : 'DOEL BEHAALD! 🎉',
    type: activeGoal.goal_type,
    achieved: toGo <= 0
  }
}


  if (loading) {
    return (
      <div className="myarc-animate-in" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(16,185,129,0.3)',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ color: '#8ea39b' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="myarc-animate-in">
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {/* Header */}
      <div style={{
        padding: isMobile ? '0.5rem' : '1rem',
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1rem',
        border: '1px solid #10b98133'
      }}>
        <h2 style={{
          color: '#fff',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.25rem'
        }}>
          💪 {t('nav.progress')} Dashboard
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '0.875rem'
        }}>
          Track je doelen, log workouts & bekijk je vooruitgang
        </p>
      </div>

      {/* COMBINED PROGRESS POINTS & DISPLAY CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }} key={`progress-cards-${dataLoaded}-${weightHistory.length}-${exerciseGoals.length}`}>
        {/* Weight Goal Card - Combined Input & Display */}
        <div
          onClick={() => openWeightModal(weightGoal.target ? 'update' : 'goal')}
          style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid #8b5cf6',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⚖️</span>
            <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: '600' }}>
              Gewicht Goal
            </h3>
          </div>
          
          {getWeightProgress() ? (
            <>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>
                -{getWeightProgress().lost}kg
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                afgevallen ({getWeightProgress().percentage}%)
              </div>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.7)'
              }}>
                Nog {getWeightProgress().toGo}kg te gaan! • Klik voor update
              </div>
            </>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                Stel je gewicht doel in
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                Klik om te beginnen →
              </div>
            </>
          )}
        </div>

        {/* Exercise Goal Card - Combined Input & Display */}
        <div
onClick={() => {
  const progress = getExerciseGoalProgress()
  if (progress) {
    // Open modal met de data van het actieve doel
    setExerciseGoal({
      exercise: progress.exercise,
      type: progress.type,
      current: progress.current,
      target: progress.target
    })
    setExerciseUpdate(progress.current.toString())
    setModalMode('update')
    setShowExerciseModal(true)
  } else {
    openExerciseModal('goal')
  }
}}
          style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid #ef4444',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🎯</span>
            <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: '600' }}>
              Oefening Goal
            </h3>
            {/* Add new goal button */}
            {getExerciseGoalProgress() && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExerciseGoal({ exercise: '', type: 'weight', current: '', target: '' })
                  setModalMode('goal')
                  setShowExerciseModal(true)
                }}
                style={{
                  marginLeft: 'auto',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                }}
              >
                +
              </button>
            )}
          </div>
          
          {getExerciseGoalProgress() ? (
            <>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
                {getExerciseGoalProgress().exercise}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                {Math.round(getExerciseGoalProgress().current)}{getExerciseGoalProgress().type === 'weight' ? 'kg' : getExerciseGoalProgress().type === '1rm' ? 'kg' : ''}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                huidige {getExerciseGoalProgress().type}
              </div>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: getExerciseGoalProgress().achieved ? '#10b981' : 'rgba(255,255,255,0.7)',
                fontWeight: getExerciseGoalProgress().achieved ? '600' : 'normal'
              }}>
                {getExerciseGoalProgress().achieved 
                  ? '🎉 DOEL BEHAALD!' 
                  : `Nog ${getExerciseGoalProgress().toGo} naar ${getExerciseGoalProgress().target} goal!`
                }
              </div>
            </>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                Stel doelen voor oefeningen
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                Klik om te beginnen →
              </div>
            </>
          )}
        </div>

        {/* Weekly Workout Goal Card - Combined Input & Display */}
        <div
          onClick={() => setShowWeeklyModal(true)}
          style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid #10b981',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📅</span>
            <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: '600' }}>
              Deze Week
            </h3>
          </div>
          
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>
            {currentWeekWorkouts}/{weeklyGoal}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
            workouts gedaan
          </div>
          {weeklyStreak > 0 && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#fff',
              fontWeight: '600'
            }}>
              🔥 {weeklyStreak} weken op rij gehaald!
            </div>
          )}
        </div>
      </div>

      {/* All Exercise Goals Overview */}
      {exerciseGoals.length > 1 && (
        <div style={{
          padding: '1rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '1px solid rgba(239,68,68,0.2)'
        }}>
          <h4 style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            🎯 Alle Oefening Doelen
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.5rem'
          }}>
            {exerciseGoals.map((goal, index) => {
              const current = goal.current_value || 0
              const target = goal.target_value || 100
              const achieved = current >= target
              
              return (
                <div
                  key={`${goal.exercise_name}-${index}`}
                  onClick={() => {
                    setExerciseGoal({
                      exercise: goal.exercise_name,
                      type: goal.goal_type,
                      current: current,
                      target: target
                    })
                    setModalMode('update')
                    setShowExerciseModal(true)
                  }}
                  style={{
                    padding: '0.75rem',
                    background: achieved 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    border: '1px solid rgba(239,68,68,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: achieved ? '#fff' : '#ef4444',
                    marginBottom: '0.25rem'
                  }}>
                    {goal.exercise_name}
                  </div>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    color: '#fff' 
                  }}>
                    {Math.round(current)}/{target}
                    <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                      {goal.goal_type === 'weight' ? 'kg' : goal.goal_type === '1rm' ? 'kg' : ''}
                    </span>
                  </div>
                  {achieved && (
                    <div style={{ fontSize: '0.65rem', color: '#fff', marginTop: '0.25rem' }}>
                      ✅ Behaald!
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* Add new exercise goal button */}
            <div
              onClick={() => {
                setExerciseGoal({ exercise: '', type: 'weight', current: '', target: '' })
                setModalMode('goal')
                setShowExerciseModal(true)
              }}
              style={{
                padding: '0.75rem',
                background: 'transparent',
                borderRadius: '6px',
                border: '2px dashed rgba(239,68,68,0.3)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ef4444'
                e.currentTarget.style.background = 'rgba(239,68,68,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>+</span>
              <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                Nieuw Doel
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Week Navigation WITH EXPLANATION */}
      <div style={{
        padding: '1rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid rgba(16,185,129,0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <button
            onClick={() => setCurrentWeek(prev => prev - 1)}
            style={{
              background: 'transparent',
              border: '1px solid #10b981',
              color: '#10b981',
              padding: '0.5rem',
              borderRadius: '6px',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ‹
          </button>
          
          <h3 style={{
            color: '#fff',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            {currentWeek === 0 ? 'Deze Week' : 
             currentWeek > 0 ? `${currentWeek} ${currentWeek === 1 ? 'week' : 'weken'} vooruit` :
             `${Math.abs(currentWeek)} ${Math.abs(currentWeek) === 1 ? 'week' : 'weken'} terug`}
          </h3>
          
          <button
            onClick={() => setCurrentWeek(prev => prev + 1)}
            style={{
              background: 'transparent',
              border: '1px solid #10b981',
              color: '#10b981',
              padding: '0.5rem',
              borderRadius: '6px',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ›
          </button>
        </div>

        {/* Explanation text */}
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.75rem',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          💡 Klik op een dag om je workout te loggen. Groene rand = workout gedaan!
        </p>

        {/* Week Grid */}
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? 'none' : 'repeat(7, 1fr)',
          gap: isMobile ? '0.3rem' : '0.5rem',
          overflowX: isMobile ? 'auto' : 'visible'
        }}>
          {weekDates.map((date, index) => {
            const progressCount = getDayProgressCount(date)
            const dayIsToday = isToday(date)
            
            return (
              <div
                key={date}
                onClick={() => openWorkoutModal(date)}
                style={{
                  minWidth: isMobile ? '120px' : 'auto',
                  padding: '1rem',
                  background: dayIsToday 
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
                <div style={{
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  marginBottom: '0.25rem'
                }}>
                  {getDayName(date)}
                </div>
                <div style={{
                  color: '#fff',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}>
                  {getDayNumber(date)}
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
                {progressCount === 0 && (
                  <div style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.75rem'
                  }}>
                    + Log workout
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ENHANCED GRAPH SECTION WITH DATES */}
      <div style={{
        padding: '1rem',
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
        border: '1px solid #10b98133'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <h3 style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            📈 Progress Grafiek
          </h3>
          
          {/* Graph Controls */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {/* Graph Type Selector */}
            <select
              value={graphType}
              onChange={(e) => setGraphType(e.target.value)}
              style={{
                padding: '0.5rem',
                background: '#0b1510',
                border: '1px solid #10b98133',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem'
              }}
            >
              <option value="weight">Lichaamsgewicht</option>
              <option value="exercise">Oefening Progress</option>
            </select>

            {graphType === 'exercise' && (
              <>
                <select
                  value={graphExercise}
                  onChange={(e) => setGraphExercise(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    background: '#0b1510',
                    border: '1px solid #10b98133',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem'
                  }}
                >
                  {clientExercises.map(ex => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>

                <select
                  value={graphMetric}
                  onChange={(e) => setGraphMetric(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    background: '#0b1510',
                    border: '1px solid #10b98133',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="kg">Gewicht (kg)</option>
                  <option value="reps">Totale Reps</option>
                  <option value="sets">Aantal Sets</option>
                  <option value="performance">1RM Performance</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* Graph Display */}
        <div style={{
          position: 'relative',
          height: '250px',
          background: '#010802',
          borderRadius: '6px',
          padding: '1rem',
          paddingBottom: '2.5rem',
          overflow: 'visible'
        }}>
          <ProgressChart 
            data={graphData} 
            type={graphType}
            color={graphType === 'weight' ? '#8b5cf6' : '#10b981'}
          />
        </div>

        {/* Graph Stats */}
        {graphData.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.7)'
          }}>
            <span>📊 {graphData.length} datapunten</span>
            <span>Start: {graphData[0]?.label}</span>
            <span>Huidig: {graphData[graphData.length - 1]?.label}</span>
          </div>
        )}
      </div>

      {/* MODALS */}
      
      {/* Weight Goal/Update Modal */}
      {showWeightModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#010802',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid #8b5cf6'
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              ⚖️ {modalMode === 'goal' ? 'Gewicht Goal Instellen' : 'Gewicht Update'}
            </h3>

            {modalMode === 'goal' ? (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    color: '#fff',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    Huidig Gewicht (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightGoal.current}
                    onChange={(e) => setWeightGoal(prev => ({ ...prev, current: e.target.value }))}
                    placeholder="bijv. 80"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0b1510',
                      border: '1px solid #8b5cf6',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    color: '#fff',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    Doel Gewicht (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightGoal.target}
                    onChange={(e) => setWeightGoal(prev => ({ ...prev, target: e.target.value }))}
                    placeholder="bijv. 70"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0b1510',
                      border: '1px solid #8b5cf6',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                </div>
                
                {/* Info box */}
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(139,92,246,0.1)',
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}>
                  <p style={{ color: '#8b5cf6', fontSize: '0.875rem' }}>
                    💡 Tip: Stel een realistisch doel. Je kunt dit later altijd aanpassen!
                  </p>
                </div>
              </>
            ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    color: '#fff',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    Nieuw Gewicht (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightUpdate}
                    onChange={(e) => setWeightUpdate(e.target.value)}
                    placeholder="bijv. 78.5"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0b1510',
                      border: '1px solid #8b5cf6',
                      borderRadius: '6px',
                      color: '#fff'
                    }}
                  />
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    Huidig: {weightGoal.current || '?'}kg → Doel: {weightGoal.target || '?'}kg
                  </div>
                </div>
            )}

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'space-between'
            }}>
              {/* Delete button (only in update mode) */}
              {modalMode === 'update' && (
                <button
                  onClick={async () => {
                    if (confirm('Weet je zeker dat je dit doel wilt verwijderen?')) {
                      try {
                        await deleteWeightGoal(client.id)
                        setWeightGoal({ current: '', target: '', startWeight: '' })
                        await loadClientGoals()
                        setShowWeightModal(false)
                      } catch (error) {
                        alert('Fout bij verwijderen doel')
                      }
                    }
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Verwijder
                </button>
              )}
              
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginLeft: modalMode === 'update' ? '0' : 'auto'
              }}>
                <button
                  onClick={() => setShowWeightModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #6b7280',
                    color: '#6b7280',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Annuleren
                </button>
                <button
                  onClick={saveWeightHandler}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {modalMode === 'goal' ? 'Doel Instellen' : 'Update Opslaan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{showExerciseModal && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem'
  }}>
    <div style={{
      background: '#010802',
      borderRadius: '12px',
      padding: '1.5rem',
      maxWidth: '400px',
      width: '100%',
      border: '1px solid #ef4444'
    }}>
      <h3 style={{
        color: '#fff',
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '1rem'
      }}>
        🎯 {modalMode === 'goal' ? 'Oefening Goal Instellen' : 'Oefening Update'}
      </h3>

      {modalMode === 'goal' ? (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              fontSize: '0.875rem',
              marginBottom: '0.5rem'
            }}>
              Selecteer Oefening
            </label>
            <select
              value={exerciseGoal.exercise}
              onChange={(e) => setExerciseGoal(prev => ({ ...prev, exercise: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0b1510',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                color: '#fff'
              }}
            >
              <option value="">Kies een oefening...</option>
              {clientExercises.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              fontSize: '0.875rem',
              marginBottom: '0.5rem'
            }}>
              Goal Type
            </label>
            <select
              value={exerciseGoal.type}
              onChange={(e) => setExerciseGoal(prev => ({ ...prev, type: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0b1510',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                color: '#fff'
              }}
            >
              <option value="weight">Gewicht (kg)</option>
              <option value="reps">Reps</option>
              <option value="1rm">1RM</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }}>
                Huidige Waarde
              </label>
              <input
                type="number"
                step="0.5"
                value={exerciseGoal.current}
                onChange={(e) => setExerciseGoal(prev => ({ ...prev, current: e.target.value }))}
                placeholder="bijv. 85"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0b1510',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }}>
                Target Waarde
              </label>
              <input
                type="number"
                step="0.5"
                value={exerciseGoal.target}
                onChange={(e) => setExerciseGoal(prev => ({ ...prev, target: e.target.value }))}
                placeholder="bijv. 100"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0b1510',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              />
            </div>
          </div>
          
          {/* Info box */}
          <div style={{
            padding: '0.75rem',
            background: 'rgba(239,68,68,0.1)',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>
              💡 Tip: {exerciseGoal.type === 'weight' ? 'Stel een gewicht doel voor deze oefening' : 
                       exerciseGoal.type === 'reps' ? 'Hoeveel reps wil je kunnen halen?' :
                       'Wat is je 1RM doel voor deze oefening?'}
            </p>
          </div>
        </>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            color: '#fff',
            fontSize: '0.875rem',
            marginBottom: '0.5rem'
          }}>
            Nieuwe {exerciseGoal.type === 'weight' ? 'Gewicht (kg)' : 
                    exerciseGoal.type === 'reps' ? 'Reps' :
                    exerciseGoal.type === '1rm' ? '1RM (kg)' : 'Waarde'}
          </label>
          <input
            type="number"
            step="0.5"
            value={exerciseUpdate}
            onChange={(e) => setExerciseUpdate(e.target.value)}
            placeholder={exerciseGoal.type === 'weight' ? 'bijv. 87.5' : 
                        exerciseGoal.type === '1rm' ? 'bijv. 150' : 'bijv. 12'}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#0b1510',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              color: '#fff'
            }}
          />
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.6)'
          }}>
            <strong>{exerciseGoal.exercise}</strong><br/>
            Huidige: {exerciseGoal.current || '?'} → Target: {exerciseGoal.target || '?'} 
            ({exerciseGoal.type === 'weight' ? 'kg' : 
              exerciseGoal.type === '1rm' ? 'kg 1RM' : 
              exerciseGoal.type === 'reps' ? 'reps' : ''})
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'space-between'
      }}>
        {/* Delete button (only in update mode) */}
        {modalMode === 'update' && (
          <button
            onClick={async () => {
              if (confirm('Weet je zeker dat je dit doel wilt verwijderen?')) {
                try {
                  await deleteExerciseGoal(client.id, exerciseGoal.exercise)
                  await loadExerciseGoalsData()
                  setShowExerciseModal(false)
                  setExerciseGoal({ exercise: '', type: 'weight', current: '', target: '' })
                  setExerciseUpdate('')
                } catch (error) {
                  alert('Fout bij verwijderen doel')
                }
              }
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: '1px solid #ef4444',
              color: '#ef4444',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Verwijder
          </button>
        )}
        
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginLeft: modalMode === 'update' ? '0' : 'auto'
        }}>
          <button
            onClick={() => {
              setShowExerciseModal(false)
              setExerciseUpdate('')
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: '1px solid #6b7280',
              color: '#6b7280',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={saveExerciseHandler}
            disabled={modalMode === 'goal' ? 
              (!exerciseGoal.exercise || !exerciseGoal.target) :
              (!exerciseUpdate || exerciseUpdate === '')}
            style={{
              padding: '0.75rem 1.5rem',
              background: (modalMode === 'goal' ? 
                (exerciseGoal.exercise && exerciseGoal.target) :
                (exerciseUpdate && exerciseUpdate !== ''))
                ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
                : '#6b7280',
              border: 'none',
              color: '#fff',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: (modalMode === 'goal' ? 
                (exerciseGoal.exercise && exerciseGoal.target) :
                (exerciseUpdate && exerciseUpdate !== ''))
                ? 'pointer' : 'not-allowed'
            }}
          >
            {modalMode === 'goal' ? 'Doel Instellen' : 'Update Opslaan'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Weekly Goal Modal */}
      {showWeeklyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#010802',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid #10b981'
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              📅 Wekelijks Workout Doel
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }}>
                Aantal workouts per week
              </label>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <button
                    key={num}
                    onClick={() => setWeeklyGoal(num)}
                    style={{
                      width: '50px',
                      height: '50px',
                      background: weeklyGoal === num 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : '#0b1510',
                      border: weeklyGoal === num 
                        ? '2px solid #10b981'
                        : '1px solid #10b98133',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              background: 'rgba(16,185,129,0.1)',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <p style={{ color: '#10b981', fontSize: '0.875rem' }}>
                💡 Tip: Begin realistisch! Je kunt dit altijd later verhogen.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowWeeklyModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid #6b7280',
                  color: '#6b7280',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Annuleren
              </button>
              <button
                onClick={saveWeeklyGoalHandler}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Logging Modal WITH COACH SUGGESTIONS & RATING */}
      {showWorkoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#010802',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #10b98133'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                color: '#fff',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>
                Workout Loggen
              </h3>
              <button
                onClick={closeWorkoutModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              color: '#10b981',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {getDayName(selectedDate)} {getDayNumber(selectedDate)} - {new Date(selectedDate).toLocaleDateString('nl-NL')}
            </div>

            {/* Exercise Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Selecteer Oefening * 
                <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '0.5rem' }}>
                  (AI Database)
                </span>
              </label>
              
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Type om te zoeken..."
                  value={exerciseSearchTerm}
                  onChange={(e) => setExerciseSearchTerm(e.target.value)}
                  onFocus={() => setShowExerciseDropdown(true)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0b1510',
                    border: '1px solid #10b98133',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem'
                  }}
                />
                
                {showExerciseDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#0b1510',
                    border: '1px solid #10b98133',
                    borderRadius: '6px',
                    marginTop: '0.25rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000
                  }}>
                    {getFilteredExercises().map(exercise => (
                      <div
                        key={exercise.name}
                        onClick={() => selectExercise(exercise.name)}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          fontSize: '0.875rem'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(16,185,129,0.1)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>
                            {exercise.name}
                            {exercise.stretch && <span style={{ marginLeft: '0.25rem' }}>🔥</span>}
                          </span>
                          {exercise.ratings && (
                            <span style={{ fontSize: '0.65rem', color: '#10b981' }}>
                              ⭐{exercise.ratings.personal}/10
                            </span>
                          )}
                        </div>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          color: 'rgba(255,255,255,0.6)'
                        }}>
                          {exercise.muscleGroup} • {exercise.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coach Suggestion (from AI) */}
            {smartSuggestion && workoutForm.exerciseName && (
              <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid #8b5cf6'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>🤖</span>
                  <span style={{
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    AI Coach Suggestie
                  </span>
                </div>
                <div style={{
                  color: '#fff',
                  fontSize: '0.875rem',
                  lineHeight: '1.4'
                }}>
                  {smartSuggestion.message}
                </div>
                {smartSuggestion.recommendedWeight && (
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.9)'
                  }}>
                    <span>🎯 Aanbevolen: {smartSuggestion.recommendedWeight}kg</span>
                    <span>📊 Reps: {smartSuggestion.recommendedReps}</span>
                  </div>
                )}
              </div>
            )}

            {/* Sets Input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Sets & Gewicht *
              </label>
              
              {workoutForm.sets.map((set, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    background: '#10b981', 
                    color: '#000', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  
                  <input
                    type="number"
                    placeholder="Reps"
                    value={set.reps}
                    onChange={(e) => updateSet(index, 'reps', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#0b1510',
                      border: '1px solid #10b98133',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}
                  />
                  
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Kg"
                    value={set.weight}
                    onChange={(e) => updateSet(index, 'weight', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#0b1510',
                      border: '1px solid #10b98133',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}
                  />
                  
                  {workoutForm.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(index)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      −
                    </button>
                  )}
                </div>
              ))}
              
              <button
                onClick={addSet}
                style={{
                  background: 'transparent',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                + Set Toevoegen
              </button>
            </div>

            {/* Exercise Rating */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Beoordeel deze oefening
              </label>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setWorkoutForm(prev => ({ ...prev, rating: star }))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: star <= workoutForm.rating ? '#f59e0b' : '#374151'
                    }}
                  >
                    ★
                  </button>
                ))}
                <span style={{
                  marginLeft: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  {workoutForm.rating}/5
                </span>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Notitie (optioneel)
              </label>
              <textarea
                placeholder="Hoe voelde de workout?"
                value={workoutForm.notes}
                onChange={(e) => setWorkoutForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0b1510',
                  border: '1px solid #10b98133',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeWorkoutModal}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid #6b7280',
                  color: '#6b7280',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Annuleren
              </button>
              <button
                onClick={saveWorkout}
                disabled={!workoutForm.exerciseName || workoutForm.sets.some(set => !set.reps || !set.weight)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: workoutForm.exerciseName && !workoutForm.sets.some(set => !set.reps || !set.weight)
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : '#6b7280',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: workoutForm.exerciseName && !workoutForm.sets.some(set => !set.reps || !set.weight)
                    ? 'pointer' : 'not-allowed'
                }}
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
