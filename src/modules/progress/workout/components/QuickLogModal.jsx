// src/modules/progress/workout/components/QuickLogModal.jsx - ULTRA COMPACT UPGRADE
import { useState, useRef, useEffect } from 'react'
import { X, Plus, Dumbbell, Search, Target, Activity, Star, CheckCircle } from 'lucide-react'
import ExerciseDatabase from '../../../../utils/ExerciseDatabase'

const THEME = {
  primary: '#f97316',
  gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(234, 88, 12, 0.2) 100%)',
  success: '#10b981'
}

// QuickSetInputRow Component - UPGRADED
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
      display: 'grid',
      gridTemplateColumns: '32px 1fr 1fr 36px',
      gap: isMobile ? '0.4rem' : '0.5rem',
      alignItems: 'center',
      padding: isMobile ? '0.5rem' : '0.625rem',
      background: completed 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)' 
        : 'rgba(23, 23, 23, 0.6)',
      border: `1px solid ${completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.1)'}`,
      borderRadius: '8px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(10px)',
      minHeight: '44px',
      boxShadow: completed ? '0 0 15px rgba(16, 185, 129, 0.15)' : 'none'
    }}>
      {/* Set number badge */}
      <div style={{
        width: isMobile ? '28px' : '32px',
        height: isMobile ? '28px' : '32px',
        borderRadius: '6px',
        background: completed 
          ? 'rgba(16, 185, 129, 0.2)'
          : 'rgba(249, 115, 22, 0.2)',
        border: `1px solid ${completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`,
        color: completed ? '#10b981' : '#f97316',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        fontWeight: '800',
        boxShadow: completed 
          ? '0 0 12px rgba(16, 185, 129, 0.3)'
          : '0 0 12px rgba(249, 115, 22, 0.3)'
      }}>
        {setNumber}
      </div>
      
      {/* Weight input */}
      <div style={{
        background: 'rgba(23, 23, 23, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(249, 115, 22, 0.1)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '44px',
        overflow: 'hidden'
      }}>
        <input
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => {
            const val = e.target.value
            if (val === '') {
              onWeightChange('')
            } else {
              const num = parseFloat(val)
              if (!isNaN(num)) {
                onWeightChange(num)
              }
            }
          }}
          onFocus={(e) => {
            if (e.target.value === '0') {
              e.target.select()
            }
          }}
          placeholder="kg"
          style={{
            width: '100%',
            padding: isMobile ? '0.35rem' : '0.4rem',
            background: 'transparent',
            border: 'none',
            color: '#f97316',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '800',
            textAlign: 'center',
            outline: 'none',
            letterSpacing: '-0.02em'
          }}
        />
        <div style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '0 0.2rem 0.2rem'
        }}>
          KG
        </div>
      </div>
      
      {/* Reps input */}
      <div style={{
        background: 'rgba(23, 23, 23, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(249, 115, 22, 0.1)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '44px',
        overflow: 'hidden'
      }}>
        <input
          type="text"
          inputMode="numeric"
          value={reps}
          onChange={(e) => {
            const val = e.target.value
            if (val === '') {
              onRepsChange('')
            } else {
              const num = parseInt(val)
              if (!isNaN(num)) {
                onRepsChange(num)
              }
            }
          }}
          onFocus={(e) => {
            if (e.target.value === '0') {
              e.target.select()
            }
          }}
          placeholder="reps"
          style={{
            width: '100%',
            padding: isMobile ? '0.35rem' : '0.4rem',
            background: 'transparent',
            border: 'none',
            color: '#f97316',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '800',
            textAlign: 'center',
            outline: 'none',
            letterSpacing: '-0.02em'
          }}
        />
        <div style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '0 0.2rem 0.2rem'
        }}>
          REPS
        </div>
      </div>
      
      {/* Check button */}
      <button
        onClick={onComplete}
        style={{
          width: isMobile ? '32px' : '36px',
          height: isMobile ? '32px' : '36px',
          minHeight: isMobile ? '32px' : '36px',
          borderRadius: '8px',
          background: completed 
            ? 'rgba(16, 185, 129, 0.2)'
            : 'rgba(249, 115, 22, 0.1)',
          border: `1px solid ${completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.2)'}`,
          color: completed ? '#10b981' : '#f97316',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: completed ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'scale(1.1)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <CheckCircle 
          size={isMobile ? 14 : 16} 
          style={{
            filter: completed 
              ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))'
              : 'none'
          }}
        />
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

  const loadExerciseDatabase = async () => {
    try {
      const exercises = await ExerciseDatabase.loadExercisesFromDatabase(db, client?.id)
      setDatabaseExercises(exercises)
    } catch (error) {
      console.error('Error loading exercise database:', error)
      const fallbackExercises = ExerciseDatabase.getAllExercises()
      setDatabaseExercises(fallbackExercises)
    }
  }

  useEffect(() => {
    loadExerciseDatabase()
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [todaysLogs])

  const getScheduledExercises = () => {
    if (!todaysWorkout) {
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
      
      return scheduled
    } catch (error) {
      console.error('❌ Error getting scheduled exercises:', error)
      return []
    }
  }

  const getOrderedExercises = () => {
    const scheduledExercises = getScheduledExercises()
    const searchLower = exerciseSearchTerm.toLowerCase()
    
    const completedExerciseNames = todaysLogs?.map(log => log.exercise_name || log.exercise) || []
    const availableScheduled = scheduledExercises.filter(exercise => 
      !completedExerciseNames.includes(exercise)
    )
    
    if (!searchLower) {
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
    setSelectedExercise(exercise)
    setExerciseSearchTerm(exercise)
    setCustomExercise('')
    setShowExerciseDropdown(false)

    if (todaysWorkout) {
      let exerciseData = null
      
      if (todaysWorkout.exercises && Array.isArray(todaysWorkout.exercises)) {
        exerciseData = todaysWorkout.exercises.find(ex => {
          const name = typeof ex === 'string' ? ex : (ex.name || ex.exercise_name || ex.exercise)
          return name === exercise
        })
      }
      
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
      const setsData = completedSets.map(set => ({
        weight: set.weight,
        reps: set.reps
      }))
      
      if (db.saveQuickWorkoutLog) {
        await db.saveQuickWorkoutLog(
          client?.id || client,
          exerciseName,
          setsData,
          `Quick log - ${new Date().toLocaleDateString()}`
        )
      } else if (db.saveWorkoutProgress) {
        await db.saveWorkoutProgress({
          client_id: client?.id || client,
          exercise_name: exerciseName,
          sets: setsData,
          date: new Date().toISOString().split('T')[0],
          notes: `Quick log - ${new Date().toLocaleDateString()}`
        })
      }
      
      setSaveSuccess(true)
      
      if (onDataReload) {
        await onDataReload()
      }
      
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
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
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
      padding: isMobile ? '0.75rem' : '1.5rem',
      animation: 'fadeIn 0.3s ease'
    }}
    onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          borderRadius: isMobile ? '14px' : '18px',
          padding: 0,
          width: isMobile ? '95vw' : '600px',
          maxHeight: isMobile ? '85vh' : '80vh',
          boxShadow: '0 20px 60px rgba(249, 115, 22, 0.25)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top glow accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          opacity: 0.6
        }} />
        
        {/* Header - ULTRA COMPACT */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              color: '#fff',
              fontWeight: '800',
              margin: 0,
              marginBottom: '0.2rem',
              letterSpacing: '-0.02em'
            }}>
              Quick Log
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              margin: 0,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {todaysWorkout?.name || 'VRIJE TRAINING'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: '44px',
              height: '44px',
              minHeight: '44px',
              borderRadius: '10px',
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: '#f97316',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'
              }
            }}
          >
            <X size={isMobile ? 18 : 20} strokeWidth={2.5} />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          
          <div style={{
            flex: 1,
            padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '1rem' : '1.25rem'
          }}>

            {/* Exercise Selection - COMPACT */}
            <div style={{ flexShrink: 0 }}>
              <label style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}>
                OEFENING
              </label>
              
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={isMobile ? 14 : 16} 
                    style={{
                      position: 'absolute',
                      left: isMobile ? '0.75rem' : '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(249, 115, 22, 0.4)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Zoek oefening..."
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
                      padding: isMobile ? '0.625rem 0.75rem 0.625rem 2.25rem' : '0.75rem 0.875rem 0.75rem 2.5rem',
                      background: 'rgba(23, 23, 23, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${showExerciseDropdown ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.15)'}`,
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: '600',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '44px'
                    }}
                  />
                </div>
                
                {/* Dropdown - COMPACT */}
                {showExerciseDropdown && (
                  <div 
                    ref={dropdownRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'rgba(17, 17, 17, 0.98)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(249, 115, 22, 0.2)',
                      borderRadius: '12px',
                      marginTop: '0.4rem',
                      maxHeight: isMobile ? '220px' : '260px',
                      zIndex: 20,
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
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
                            padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
                            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)',
                            borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
                            fontSize: isMobile ? '0.55rem' : '0.6rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Star size={isMobile ? 11 : 12} fill="#f97316" color="#f97316" />
                              <span>VANDAAG</span>
                            </div>
                            <div style={{
                              background: 'rgba(249, 115, 22, 0.2)',
                              color: '#f97316',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '6px',
                              fontSize: isMobile ? '0.55rem' : '0.6rem',
                              fontWeight: '800',
                              border: '1px solid rgba(249, 115, 22, 0.3)'
                            }}>
                              {orderedExercises.scheduled.length}
                            </div>
                          </div>
                          
                          {orderedExercises.scheduled.map((exercise, idx) => {
                            const isCompleted = orderedExercises.completedToday?.includes(exercise)
                            return (
                              <div
                                key={`scheduled-${idx}`}
                                onClick={() => !isCompleted && handleExerciseSelect(exercise)}
                                style={{
                                  padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
                                  cursor: isCompleted ? 'not-allowed' : 'pointer',
                                  borderBottom: '1px solid rgba(249, 115, 22, 0.05)',
                                  color: isCompleted ? 'rgba(255,255,255,0.3)' : '#fff',
                                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                                  fontWeight: '600',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  touchAction: 'manipulation',
                                  WebkitTapHighlightColor: 'transparent',
                                  background: isCompleted 
                                    ? 'rgba(16, 185, 129, 0.05)' 
                                    : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  opacity: isCompleted ? 0.5 : 1,
                                  minHeight: '44px'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isCompleted && !isMobile) {
                                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)'
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = isCompleted 
                                    ? 'rgba(16, 185, 129, 0.05)' 
                                    : 'transparent'
                                }}
                              >
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: isCompleted ? '#10b981' : '#f97316',
                                  flexShrink: 0,
                                  boxShadow: isCompleted 
                                    ? '0 0 8px rgba(16, 185, 129, 0.5)'
                                    : '0 0 8px rgba(249, 115, 22, 0.5)'
                                }} />
                                
                                <span style={{ 
                                  flex: 1,
                                  textDecoration: isCompleted ? 'line-through' : 'none'
                                }}>{exercise}</span>
                                
                                {isCompleted && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    color: '#10b981',
                                    fontSize: isMobile ? '0.55rem' : '0.6rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                  }}>
                                    <CheckCircle size={isMobile ? 10 : 11} />
                                    KLAAR
                                  </div>
                                )}
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
                              height: '1px',
                              background: 'rgba(249, 115, 22, 0.1)',
                              margin: '0.25rem 0'
                            }} />
                          )}
                          
                          <div style={{
                            padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
                            background: 'rgba(249, 115, 22, 0.03)',
                            borderBottom: '1px solid rgba(249, 115, 22, 0.08)',
                            fontSize: isMobile ? '0.55rem' : '0.6rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            flexShrink: 0
                          }}>
                            <Activity size={isMobile ? 11 : 12} />
                            ALLE OEFENINGEN
                          </div>
                          
                          {orderedExercises.database.map((exercise, idx) => (
                            <div
                              key={`db-${idx}`}
                              onClick={() => handleExerciseSelect(exercise.name)}
                              style={{
                                padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
                                cursor: 'pointer',
                                borderBottom: idx < orderedExercises.database.length - 1 ? '1px solid rgba(249, 115, 22, 0.05)' : 'none',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: isMobile ? '0.75rem' : '0.8rem',
                                fontWeight: '500',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                background: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                minHeight: '44px'
                              }}
                              onMouseEnter={(e) => {
                                if (!isMobile) {
                                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                              }}
                            >
                              <span>{exercise.name}</span>
                              {exercise.muscle_group && (
                                <span style={{
                                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                                  color: 'rgba(249, 115, 22, 0.4)',
                                  textTransform: 'capitalize',
                                  fontWeight: '600'
                                }}>
                                  {exercise.muscle_group}
                                </span>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Add new exercise */}
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
                            padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
                            cursor: 'pointer',
                            color: '#f97316',
                            fontSize: isMobile ? '0.75rem' : '0.8rem',
                            fontWeight: '600',
                            borderTop: '1px solid rgba(249, 115, 22, 0.15)',
                            background: 'rgba(249, 115, 22, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            minHeight: '44px'
                          }}
                        >
                          <Plus size={isMobile ? 13 : 14} />
                          Voeg toe: "{exerciseSearchTerm}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sets Section - COMPACT */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <label style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: isMobile ? '0.55rem' : '0.6rem',
                  fontWeight: '700',
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
                    gap: '0.3rem',
                    padding: isMobile ? '0.4rem 0.625rem' : '0.5rem 0.75rem',
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '8px',
                    color: '#f97316',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'
                      e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'
                    }
                  }}
                >
                  <Plus size={isMobile ? 13 : 14} />
                  SET
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.5rem' : '0.625rem' }}>
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

          {/* SAVE BUTTON - COMPACT */}
          <div style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
            borderTop: '1px solid rgba(249, 115, 22, 0.1)',
            flexShrink: 0
          }}>
            <button
              onClick={saveQuickLog}
              disabled={savingQuick || (!customExercise && !selectedExercise && !exerciseSearchTerm)}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: saveSuccess 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : savingQuick || (!customExercise && !selectedExercise && !exerciseSearchTerm)
                    ? 'rgba(107, 114, 128, 0.3)'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                border: 'none',
                borderRadius: '10px',
                color: savingQuick || (!customExercise && !selectedExercise && !exerciseSearchTerm) ? 'rgba(255, 255, 255, 0.5)' : '#000',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                cursor: savingQuick || (!customExercise && !selectedExercise && !exerciseSearchTerm) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: saveSuccess 
                  ? '0 10px 25px rgba(16, 185, 129, 0.3)'
                  : savingQuick || (!customExercise && !selectedExercise && !exerciseSearchTerm)
                    ? 'none'
                    : '0 8px 20px rgba(249, 115, 22, 0.35)',
                transform: savingQuick ? 'scale(0.98)' : 'scale(1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                minHeight: '44px'
              }}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle size={isMobile ? 16 : 18} />
                  Opgeslagen!
                </>
              ) : savingQuick ? (
                <>
                  <div style={{
                    width: isMobile ? '16px' : '18px',
                    height: isMobile ? '16px' : '18px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Opslaan...
                </>
              ) : (
                <>
                  <Dumbbell size={isMobile ? 16 : 18} />
                  Opslaan
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
      `}</style>
    </div>
  )
}
