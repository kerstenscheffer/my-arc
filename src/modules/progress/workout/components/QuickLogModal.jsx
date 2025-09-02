// COMPLETE QUICK LOG MODAL - Met Workout Sessions & Progress Integration
import { useState, useRef, useEffect } from 'react'
import { X, Plus, Dumbbell, Search, Target, Activity, Star, CheckCircle } from 'lucide-react'
import ExerciseDatabase from '../../../../utils/ExerciseDatabase'

const THEME = {
  primary: '#f97316',
  gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  success: '#10b981'
}

// QuickSetInputRow Component
function QuickSetInputRow({ 
  setNumber, 
  weight, 
  reps, 
  completed, 
  onWeightChange, 
  onRepsChange, 
  onComplete,
  isMobile 
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.5rem' : '0.75rem',
      padding: isMobile ? '0.75rem' : '0.875rem',
      background: completed 
        ? 'rgba(16, 185, 129, 0.15)' 
        : 'rgba(15, 23, 42, 0.6)',
      border: `2px solid ${completed ? THEME.success : 'rgba(249, 115, 22, 0.25)'}`,
      borderRadius: '12px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        width: isMobile ? '28px' : '32px',
        height: isMobile ? '28px' : '32px',
        borderRadius: '8px',
        background: completed ? THEME.success : THEME.primary,
        color: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '0.8rem' : '0.875rem',
        fontWeight: '700'
      }}>
        {setNumber}
      </div>
      
      <div style={{ flex: '1' }}>
        <input
          type="number"
          value={weight}
          onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
          placeholder="kg"
          style={{
            width: '100%',
            padding: isMobile ? '0.5rem' : '0.625rem',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            textAlign: 'center',
            outline: 'none'
          }}
        />
      </div>
      
      <div style={{ flex: '1' }}>
        <input
          type="number"
          value={reps}
          onChange={(e) => onRepsChange(parseInt(e.target.value) || 0)}
          placeholder="reps"
          style={{
            width: '100%',
            padding: isMobile ? '0.5rem' : '0.625rem',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            textAlign: 'center',
            outline: 'none'
          }}
        />
      </div>
      
      <button
        onClick={onComplete}
        style={{
          width: isMobile ? '36px' : '40px',
          height: isMobile ? '36px' : '40px',
          borderRadius: '10px',
          background: completed ? THEME.success : 'rgba(249, 115, 22, 0.2)',
          border: `2px solid ${completed ? THEME.success : THEME.primary}`,
          color: completed ? '#000' : THEME.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: isMobile ? '1.2rem' : '1.4rem',
          fontWeight: '700',
          transition: 'all 0.2s ease'
        }}
      >
        ✓
      </button>
    </div>
  )
}

export default function QuickLogModal({ 
  db,
  client,
  todaysWorkout,
  setTodaysLogs,
  setQuickStats,
  todaysLogs,
  onClose, 
  onDataReload,
  isMobile = window.innerWidth <= 768
}) {
  const [selectedExercise, setSelectedExercise] = useState('')
  const [customExercise, setCustomExercise] = useState('')
  const [quickSets, setQuickSets] = useState([{ weight: 20, reps: 10, completed: false }])
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('')
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
  const [savingQuick, setSavingQuick] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [databaseExercises, setDatabaseExercises] = useState([])

  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Load exercises from database
  const loadExerciseDatabase = async () => {
    try {
      const exercises = await ExerciseDatabase.loadExercisesFromDatabase(db, client?.id)
      console.log('📊 Loaded exercises from ExerciseDatabase:', exercises.length)
      setDatabaseExercises(exercises)
    } catch (error) {
      console.error('Error loading exercise database:', error)
      const fallbackExercises = ExerciseDatabase.getAllExercises()
      console.log('📊 Using fallback exercises:', fallbackExercises.length)
      setDatabaseExercises(fallbackExercises)
    }
  }

  useEffect(() => {
    loadExerciseDatabase()
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
    
    console.log('🚀 QUICKLOG MODAL MOUNTED')
    console.log('📋 todaysWorkout prop:', todaysWorkout)
    console.log('🏋️ client prop:', client?.name || client?.id)
    console.log('📊 todaysLogs received:', todaysLogs?.length || 0)
    
    const scheduled = getScheduledExercises()
    console.log('📅 Scheduled exercises on mount:', scheduled)
  }, [todaysLogs])

  // Get scheduled exercises from today's workout
  const getScheduledExercises = () => {
    console.log('🔍 Checking todaysWorkout:', todaysWorkout)
    
    if (!todaysWorkout) {
      console.log('❌ No todaysWorkout found')
      return []
    }
    
    try {
      let exercises = []
      
      if (todaysWorkout.exercises && Array.isArray(todaysWorkout.exercises)) {
        exercises = todaysWorkout.exercises
      } else if (todaysWorkout.workout_data && todaysWorkout.workout_data.exercises) {
        exercises = todaysWorkout.workout_data.exercises
      } else if (todaysWorkout.schema && todaysWorkout.schema.exercises) {
        exercises = todaysWorkout.schema.exercises
      } else if (Array.isArray(todaysWorkout)) {
        exercises = todaysWorkout
      }
      
      const scheduled = exercises.map(ex => {
        if (typeof ex === 'string') return ex
        return ex.name || ex.exercise_name || ex.exercise || ''
      }).filter(Boolean)
      
      console.log('📅 TODAY\'S SCHEDULED EXERCISES LOADED:', scheduled)
      console.log('📊 Total scheduled exercises:', scheduled.length)
      
      return scheduled
    } catch (error) {
      console.error('❌ Error getting scheduled exercises:', error)
      return []
    }
  }

  // Get ordered exercises for display
  const getOrderedExercises = () => {
    const scheduledExercises = getScheduledExercises()
    const searchLower = exerciseSearchTerm.toLowerCase()
    
    // Filter out already completed exercises
    const completedExerciseNames = todaysLogs?.map(log => log.exercise_name || log.exercise) || []
    const availableScheduled = scheduledExercises.filter(exercise => 
      !completedExerciseNames.includes(exercise)
    )
    
    if (!searchLower) {
      console.log('📝 No search term - limiting results to 10')
      const limitedDatabase = databaseExercises
        .filter(ex => !scheduledExercises.includes(ex.name))
        .slice(0, 10)
      
      return {
        scheduled: availableScheduled,
        database: limitedDatabase,
        hasScheduled: availableScheduled.length > 0,
        showManualSearch: databaseExercises.length > 10,
        completedToday: completedExerciseNames
      }
    }
    
    const filteredScheduled = availableScheduled.filter(exercise => 
      exercise.toLowerCase().includes(searchLower)
    )
    
    const availableDatabase = databaseExercises
      .filter(ex => !scheduledExercises.includes(ex.name))
      .filter(ex => ex.name.toLowerCase().includes(searchLower))
      .slice(0, 20)
    
    return {
      scheduled: filteredScheduled,
      database: availableDatabase,
      hasScheduled: scheduledExercises.length > 0,
      showManualSearch: false,
      completedToday: completedExerciseNames
    }
  }

  const handleExerciseSelect = (exercise) => {
    console.log('🎯 Exercise selected:', exercise)
    setSelectedExercise(exercise)
    setExerciseSearchTerm(exercise)
    setCustomExercise('')
    setShowExerciseDropdown(false)

    // Smart pre-fill sets from today's workout schema
    if (todaysWorkout) {
      console.log('🔍 Looking for exercise data in todaysWorkout:', exercise)
      
      let exerciseData = null
      
      if (todaysWorkout.exercises && Array.isArray(todaysWorkout.exercises)) {
        exerciseData = todaysWorkout.exercises.find(ex => {
          const name = typeof ex === 'string' ? ex : (ex.name || ex.exercise_name || ex.exercise)
          return name === exercise
        })
      }
      
      console.log('🔍 Found exercise data:', exerciseData)
      
      if (exerciseData && typeof exerciseData === 'object') {
        const targetSets = parseInt(exerciseData.sets) || 3
        const repsData = exerciseData.reps || exerciseData.rep_range || '10'
        const targetReps = typeof repsData === 'string' ? repsData.split('-')[0] : '10'
        
        const newSets = Array(targetSets).fill(null).map(() => ({
          weight: 20,
          reps: parseInt(targetReps) || 10,
          completed: false
        }))
        
        setQuickSets(newSets)
        console.log(`🎯 PRE-FILLED: ${targetSets} sets of ${targetReps} reps for ${exercise}`)
      }
    }
  }

  const addQuickSet = () => {
    setQuickSets([...quickSets, { 
      weight: quickSets[quickSets.length - 1]?.weight || 20, 
      reps: 10, 
      completed: false 
    }])
  }

  const updateQuickSet = (index, field, value) => {
    const newSets = [...quickSets]
    newSets[index][field] = value
    setQuickSets(newSets)
  }

  const completeQuickSet = (index) => {
    const newSets = [...quickSets]
    newSets[index].completed = !newSets[index].completed
    setQuickSets(newSets)
  }

  // COMPLETE SAVE FUNCTION WITH DATABASE INTEGRATION
  const saveQuickLog = async () => {
    const exerciseName = customExercise || selectedExercise || exerciseSearchTerm
    
    if (!exerciseName) {
      alert('Selecteer een oefening')
      return
    }
    
    const completedSets = quickSets.filter(s => s.completed)
    if (completedSets.length === 0) {
      alert('Voltooi minimaal 1 set')
      return
    }
    
    setSavingQuick(true)
    
    try {
      // ECHTE DATABASE SAVE
      const setsData = completedSets.map(set => ({
        weight: set.weight,
        reps: set.reps
      }))
      
      // Check if saveQuickWorkoutLog exists, otherwise use alternative
      if (db.saveQuickWorkoutLog) {
        await db.saveQuickWorkoutLog(
          client?.id || client,
          exerciseName,
          setsData,
          `Quick log - ${new Date().toLocaleDateString()}`
        )
      } else if (db.saveWorkoutProgress) {
        // Fallback to existing method
        await db.saveWorkoutProgress({
          client_id: client?.id || client,
          exercise_name: exerciseName,
          sets: setsData,
          date: new Date().toISOString().split('T')[0],
          notes: `Quick log - ${new Date().toLocaleDateString()}`
        })
      } else {
        console.warn('No workout save method available in DatabaseService')
        throw new Error('Workout save method not implemented')
      }
      
      console.log('✅ Workout saved to database!')
      
      // Show success state
      setSaveSuccess(true)
      
      // Update parent if callback exists
      if (onDataReload) {
        await onDataReload()
      }
      
      // Update local state if setters exist
      if (setTodaysLogs) {
        setTodaysLogs(prev => [...prev, {
          exercise_name: exerciseName,
          sets: setsData,
          timestamp: new Date().toISOString()
        }])
      }
      
      if (setQuickStats) {
        setQuickStats(prev => ({
          ...prev,
          exercisesLogged: prev.exercisesLogged + 1,
          lastExercise: exerciseName
        }))
      }
      
      // Success feedback
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
      // Close after short delay to show success
      setTimeout(() => {
        onClose()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Save failed:', error)
      alert('Opslaan mislukt: ' + error.message)
      setSaveSuccess(false)
    } finally {
      setSavingQuick(false)
    }
  }

  const orderedExercises = getOrderedExercises()

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      animation: 'fadeIn 0.3s ease'
    }}
    onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
          borderRadius: isMobile ? '20px' : '24px',
          padding: 0,
          width: isMobile ? '95vw' : '600px',
          height: isMobile ? '90vh' : '80vh',
          maxHeight: '800px',
          boxShadow: '0 25px 50px rgba(249, 115, 22, 0.3), 0 0 0 1px rgba(249, 115, 22, 0.2)',
          border: '2px solid rgba(249, 115, 22, 0.3)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: THEME.gradient,
          borderRadius: isMobile ? '20px 20px 0 0' : '24px 24px 0 0',
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.6)'
        }} />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '1.5rem 1.25rem 1rem 1.25rem' : '2rem 1.75rem 1.25rem 1.75rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              background: THEME.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '800',
              margin: 0,
              marginBottom: '0.25rem'
            }}>
              Quick Log
            </h2>
            <p style={{
              color: 'rgba(148, 163, 184, 0.8)',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              margin: 0
            }}>
              {todaysWorkout?.name || 'Vrije Training'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: isMobile ? '44px' : '48px',
              height: isMobile ? '44px' : '48px',
              minHeight: isMobile ? '44px' : '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: 'rgba(255, 255, 255, 0.6)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={isMobile ? 20 : 22} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          
          {/* Content with internal scroll */}
          <div style={{
            flex: 1,
            padding: isMobile ? '1.25rem' : '1.75rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>

            {/* Exercise Selection */}
            <div style={{ flexShrink: 0 }}>
              <label style={{
                display: 'block',
                color: 'rgba(148, 163, 184, 0.9)',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem'
              }}>
                SELECTEER OEFENING
              </label>
              
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={isMobile ? 18 : 20} 
                    style={{
                      position: 'absolute',
                      left: '1.25rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(148, 163, 184, 0.5)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Zoek oefening of voer nieuwe in..."
                    value={exerciseSearchTerm}
                    onChange={(e) => {
                      setExerciseSearchTerm(e.target.value)
                      setShowExerciseDropdown(true)
                      if (!e.target.value) {
                        setCustomExercise('')
                        setSelectedExercise('')
                      }
                    }}
                    onFocus={() => setShowExerciseDropdown(true)}
                    style={{
                      width: '100%',
                      padding: isMobile ? '1rem 1.25rem 1rem 3.25rem' : '1.125rem 1.5rem 1.125rem 3.5rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: `2px solid ${showExerciseDropdown ? THEME.primary : 'rgba(249, 115, 22, 0.3)'}`,
                      borderRadius: '14px',
                      color: 'white',
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: '500',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  />
                </div>
                
                {/* Dropdown */}
                {showExerciseDropdown && (
                  <div 
                    ref={dropdownRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'rgba(15, 23, 42, 0.98)',
                      border: '2px solid rgba(249, 115, 22, 0.3)',
                      borderRadius: '16px',
                      marginTop: '0.75rem',
                      height: isMobile ? '280px' : '320px',
                      zIndex: 20,
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(249, 115, 22, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}
                  >
                    
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden'
                    }}>
                      
                      {/* TODAY'S WORKOUT */}
                      {orderedExercises.hasScheduled && orderedExercises.scheduled.length > 0 && (
                        <>
                          <div style={{
                            padding: isMobile ? '1rem 1.25rem' : '1.125rem 1.5rem',
                            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0.15) 50%, rgba(16, 185, 129, 0.1) 100%)',
                            borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
                            fontSize: isMobile ? '0.8rem' : '0.875rem',
                            color: THEME.primary,
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <Star size={isMobile ? 16 : 18} fill={THEME.primary} />
                              <span>VANDAAG'S WORKOUT</span>
                            </div>
                            <div style={{
                              background: 'rgba(249, 115, 22, 0.2)',
                              color: THEME.primary,
                              padding: '0.375rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: isMobile ? '0.7rem' : '0.75rem',
                              fontWeight: '700',
                              border: '1px solid rgba(249, 115, 22, 0.4)'
                            }}>
                              {orderedExercises.scheduled.length} OEFENINGEN
                            </div>
                          </div>
                          
                          {orderedExercises.scheduled.map((exercise, idx) => {
                            const isCompleted = orderedExercises.completedToday?.includes(exercise)
                            return (
                              <div
                                key={`scheduled-${idx}`}
                                onClick={() => !isCompleted && handleExerciseSelect(exercise)}
                                style={{
                                  padding: isMobile ? '1rem 1.25rem' : '1.125rem 1.5rem',
                                  cursor: isCompleted ? 'not-allowed' : 'pointer',
                                  borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
                                  color: isCompleted ? 'rgba(255,255,255,0.3)' : '#fff',
                                  fontSize: isMobile ? '1rem' : '1.1rem',
                                  fontWeight: '600',
                                  transition: 'all 0.25s ease',
                                  touchAction: 'manipulation',
                                  WebkitTapHighlightColor: 'transparent',
                                  background: isCompleted 
                                    ? 'rgba(16, 185, 129, 0.05)' 
                                    : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '1rem',
                                  opacity: isCompleted ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                  if (!isCompleted) {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.1) 100%)'
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = isCompleted 
                                    ? 'rgba(16, 185, 129, 0.05)' 
                                    : 'transparent'
                                }}
                              >
                                <div style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  background: isCompleted 
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : THEME.gradient,
                                  boxShadow: isCompleted 
                                    ? '0 0 15px rgba(16, 185, 129, 0.5)'
                                    : `0 0 15px ${THEME.primary}60`,
                                  animation: isCompleted ? 'none' : 'pulse 2s infinite',
                                  flexShrink: 0
                                }} />
                                
                                <span style={{ 
                                  flex: 1,
                                  textDecoration: isCompleted ? 'line-through' : 'none'
                                }}>{exercise}</span>
                                
                                <div style={{
                                  background: isCompleted 
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : 'rgba(16, 185, 129, 0.15)',
                                  color: '#10b981',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '8px',
                                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  border: isCompleted 
                                    ? '1px solid rgba(16, 185, 129, 0.4)'
                                    : '1px solid rgba(16, 185, 129, 0.3)',
                                  letterSpacing: '0.05em',
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  {isCompleted ? (
                                    <>
                                      <CheckCircle size={10} />
                                      GEDAAN
                                    </>
                                  ) : (
                                    'GEPLAND'
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </>
                      )}
                      
                      {/* DATABASE EXERCISES */}
                      {orderedExercises.database.length > 0 && (
                        <>
                          {orderedExercises.hasScheduled && orderedExercises.scheduled.length > 0 && (
                            <div style={{
                              height: '8px',
                              background: 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.1) 50%, transparent 100%)',
                              margin: '0.5rem 0'
                            }} />
                          )}
                          
                          <div style={{
                            padding: isMobile ? '0.875rem 1.25rem' : '1rem 1.5rem',
                            background: 'rgba(148, 163, 184, 0.05)',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                            fontSize: isMobile ? '0.75rem' : '0.8rem',
                            color: 'rgba(148, 163, 184, 0.7)',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexShrink: 0
                          }}>
                            <Activity size={14} />
                            ALLE OEFENINGEN ({orderedExercises.database.length})
                          </div>
                          
                          {orderedExercises.database.map((exercise, idx) => (
                            <div
                              key={`db-${idx}`}
                              onClick={() => handleExerciseSelect(exercise.name)}
                              style={{
                                padding: isMobile ? '0.875rem 1.25rem' : '1rem 1.5rem',
                                cursor: 'pointer',
                                borderBottom: idx < orderedExercises.database.length - 1 ? '1px solid rgba(148, 163, 184, 0.08)' : 'none',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: isMobile ? '0.9rem' : '1rem',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                background: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                              }}
                            >
                              <span>{exercise.name}</span>
                              {exercise.muscle_group && (
                                <span style={{
                                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                                  color: 'rgba(148, 163, 184, 0.6)',
                                  textTransform: 'capitalize',
                                  fontWeight: '500'
                                }}>
                                  {exercise.muscle_group}
                                </span>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Add new exercise option */}
                      {exerciseSearchTerm && 
                       !orderedExercises.scheduled.includes(exerciseSearchTerm) && 
                       !orderedExercises.database.some(ex => ex.name === exerciseSearchTerm) && (
                        <div
                          onClick={() => {
                            setCustomExercise(exerciseSearchTerm)
                            setSelectedExercise(exerciseSearchTerm)
                            setShowExerciseDropdown(false)
                          }}
                          style={{
                            padding: isMobile ? '1rem 1.25rem' : '1.125rem 1.5rem',
                            cursor: 'pointer',
                            color: THEME.primary,
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            fontWeight: '600',
                            borderTop: '2px solid rgba(249, 115, 22, 0.25)',
                            background: 'rgba(249, 115, 22, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.25s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)'
                          }}
                        >
                          <Plus size={16} />
                          Voeg nieuwe toe: "{exerciseSearchTerm}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sets Section */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <label style={{
                  color: 'rgba(148, 163, 184, 0.9)',
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  SETS
                </label>
                
                <button
                  onClick={addQuickSet}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.125rem',
                    background: 'rgba(249, 115, 22, 0.12)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '12px',
                    color: THEME.primary,
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.12)'
                  }}
                >
                  <Plus size={isMobile ? 16 : 18} />
                  Add Set
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {quickSets.map((set, index) => (
                  <QuickSetInputRow
                    key={index}
                    setNumber={index + 1}
                    weight={set.weight}
                    reps={set.reps}
                    completed={set.completed}
                    onWeightChange={(value) => updateQuickSet(index, 'weight', value)}
                    onRepsChange={(value) => updateQuickSet(index, 'reps', value)}
                    onComplete={() => completeQuickSet(index)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div style={{
            padding: isMobile ? '1.25rem' : '1.75rem',
            borderTop: '1px solid rgba(249, 115, 22, 0.15)',
            flexShrink: 0
          }}>
            <button
              onClick={saveQuickLog}
              disabled={savingQuick || (!customExercise && !selectedExercise && !exerciseSearchTerm)}
              style={{
                width: '100%',
                padding: isMobile ? '1.125rem 1.25rem' : '1.25rem 1.5rem',
                background: saveSuccess 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : savingQuick || (!customExercise && !selectedExercise && !exerciseSearchTerm)
                    ? 'rgba(107, 114, 128, 0.3)'
                    : THEME.gradient,
                border: 'none',
                borderRadius: '16px',
                color: '#fff',
                fontSize: isMobile ? '1.1rem' : '1.2rem',
                fontWeight: '700',
                cursor: savingQuick || (!customExercise && !selectedExercise && !exerciseSearchTerm) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s ease',
                boxShadow: saveSuccess 
                  ? '0 15px 35px rgba(16, 185, 129, 0.4)'
                  : savingQuick || (!customExercise && !selectedExercise && !exerciseSearchTerm)
                    ? 'none'
                    : '0 15px 35px rgba(249, 115, 22, 0.4)',
                transform: savingQuick ? 'scale(0.98)' : 'scale(1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle size={isMobile ? 20 : 22} />
                  Opgeslagen!
                </>
              ) : savingQuick ? (
                <>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Opslaan...
                </>
              ) : (
                <>
                  <Dumbbell size={isMobile ? 20 : 22} />
                  Save Workout
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
