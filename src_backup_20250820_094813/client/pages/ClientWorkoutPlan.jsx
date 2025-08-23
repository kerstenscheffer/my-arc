import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
export default function ClientWorkoutPlan({ client, schema }) {
  const { t } = useLanguage()
  const [selectedDay, setSelectedDay] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [weekSchedule, setWeekSchedule] = useState({})
  const [draggedWorkout, setDraggedWorkout] = useState(null)
  const [dragOverDay, setDragOverDay] = useState(null)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [alternativeExercises, setAlternativeExercises] = useState([])
  const [currentMuscleGroup, setCurrentMuscleGroup] = useState('')
  // Custom scrollbar styles
  const scrollStyles = `
    <style>
      /* Scrollbar styling voor groene kleur */
      div::-webkit-scrollbar {
        height: 8px;
        width: 8px;
      }
      div::-webkit-scrollbar-track {
        background: #1a1a1a;
        border-radius: 4px;
      }
      div::-webkit-scrollbar-thumb {
        background: #10b981;
        border-radius: 4px;
      }
      div::-webkit-scrollbar-thumb:hover {
        background: #0ea572;
      }
    </style>
  `
  // Days of the week
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  // Parse workout days from schema
  const workoutDays = schema?.week_structure ? Object.keys(schema.week_structure) : []
  // Get current date and week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }
  
  const currentDate = new Date()
  const weekNumber = getWeekNumber(currentDate)
  const formattedDate = currentDate.toLocaleDateString('nl-NL', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
  useEffect(() => {
    // Initialize week schedule
    if (schema?.week_structure) {
      const initialSchedule = {}
      workoutDays.forEach((dayKey, index) => {
        if (index === 0) initialSchedule['Monday'] = dayKey
        if (index === 1) initialSchedule['Wednesday'] = dayKey
        if (index === 2) initialSchedule['Friday'] = dayKey
        if (index === 3) initialSchedule['Sunday'] = dayKey
        if (index === 4) initialSchedule['Tuesday'] = dayKey
        if (index === 5) initialSchedule['Thursday'] = dayKey
      })
      setWeekSchedule(initialSchedule)
    }
  }, [schema])
  // Mobile detection
  const isMobile = window.innerWidth <= 768
  // Exercise database (from AIGenerator)
  const exerciseDatabase = {
    chest: {
      compound: [
        "Machine Chest Press", "Incline Dumbbell Press", "Barbell Bench Press", 
        "Weighted Dips", "Low-Incline Barbell Bench Press", "Flat Dumbbell Bench Press"
      ],
      isolation: [
        "Incline Cable Flies", "Machine Pec Deck", "Seated Cable Fly", 
        "Low-to-High Cable Fly", "Dumbbell Flies"
      ]
    },
    back: {
      compound: [
        "Lat Pulldown", "Weighted Pull-Ups", "T-Bar Row (Chest-Supported)",
        "Cable Row", "Barbell Bent-Over Row", "Single-Arm Dumbbell Row"
      ],
      isolation: [
        "Cable Pullovers", "Straight-Arm Pulldown (Rope)", "Face Pulls", "Single-Arm Lat Pulldown"
      ]
    },
    legs: {
      compound: [
        "Leg Press", "Romanian Deadlift", "Hip Thrust", "High-Bar Back Squat",
        "Bulgarian Split Squat", "Hack Squat"
      ],
      isolation: [
        "Leg Extension", "Leg Curl", "Calf Raises", "Single-Leg Leg Extension"
      ]
    },
    shoulders: {
      compound: [
        "Machine Shoulder Press", "Dumbbell Shoulder Press", "Overhead Press", "Seated Barbell Overhead Press"
      ],
      isolation: [
        "Cable Lateral Raises", "Lean-Away Cable Lateral Raise", "Machine Lateral Raises",
        "Dumbbell Lateral Raises", "Lying Incline Lateral Raise"
      ]
    },
    biceps: {
      isolation: [
        "Incline Dumbbell Curl", "Bayesian Cable Curl", "Cable Bicep Curls",
        "Preacher Curls", "Hammer Curls", "Barbell Curls"
      ]
    },
    triceps: {
      compound: ["Close-Grip Bench Press", "Weighted Dips"],
      isolation: [
        "Cable Overhead Triceps Extension", "Single-Arm Overhead Cable Extension",
        "Crossbody Cable Extension", "Incline Skull Crushers", "Triceps Pushdown", "Dumbbell Overhead Extension"
      ]
    }
  }
  // Load alternative exercises from database
  const loadAlternatives = (muscleGroup) => {
    const group = muscleGroup.toLowerCase()
    setCurrentMuscleGroup(group)
    
    const alternatives = []
    if (exerciseDatabase[group]) {
      if (exerciseDatabase[group].compound) {
        alternatives.push(...exerciseDatabase[group].compound)
      }
      if (exerciseDatabase[group].isolation) {
        alternatives.push(...exerciseDatabase[group].isolation)
      }
    }
    
    setAlternativeExercises(alternatives)
    setShowAlternatives(true)
  }
  // Handle drag start
  const handleDragStart = (workoutKey) => {
    setDraggedWorkout(workoutKey)
  }
  // Handle drag over
  const handleDragOver = (e, day) => {
    e.preventDefault()
    setDragOverDay(day)
  }
  // Handle drop
  const handleDrop = (e, day) => {
    e.preventDefault()
    
    if (draggedWorkout) {
      const conflict = checkConflict(day, draggedWorkout)
      if (conflict && !confirm(`${conflict}\nContinue anyway?`)) {
        setDraggedWorkout(null)
        setDragOverDay(null)
        return
      }
      
      const newSchedule = { ...weekSchedule }
      Object.keys(newSchedule).forEach(d => {
        if (newSchedule[d] === draggedWorkout) {
          delete newSchedule[d]
        }
      })
      
      newSchedule[day] = draggedWorkout
      setWeekSchedule(newSchedule)
    }
    
    setDraggedWorkout(null)
    setDragOverDay(null)
  }
  // Handle touch events for mobile
  const handleTouchWorkout = (workoutKey, day) => {
    if (!editMode) return
    
    const newSchedule = { ...weekSchedule }
    
    Object.keys(newSchedule).forEach(d => {
      if (newSchedule[d] === workoutKey) {
        delete newSchedule[d]
      }
    })
    
    if (weekSchedule[day] === workoutKey) {
      delete newSchedule[day]
    } else {
      newSchedule[day] = workoutKey
    }
    
    setWeekSchedule(newSchedule)
  }
  // Check for workout conflicts
  const checkConflict = (day, workoutKey) => {
    const dayIndex = weekDays.indexOf(day)
    const prevDay = dayIndex > 0 ? weekDays[dayIndex - 1] : null
    
    if (!schema?.week_structure[workoutKey]) return false
    
    const currentFocus = schema.week_structure[workoutKey].focus?.toLowerCase()
    
    if (prevDay && weekSchedule[prevDay]) {
      const prevFocus = schema.week_structure[weekSchedule[prevDay]]?.focus?.toLowerCase()
      if (prevFocus && currentFocus) {
        if (prevFocus.includes('chest') && currentFocus.includes('chest')) {
          return '⚠️ Same muscle group on consecutive days!'
        }
        if (prevFocus.includes('legs') && currentFocus.includes('legs')) {
          return '⚠️ Legs on consecutive days - need recovery!'
        }
      }
    }
    
    return false
  }
  if (!schema) {
    return (
      <div className="myarc-animate-in" style={{padding: isMobile ? '0.5rem' : '2rem'}}>
        <div className="myarc-card" style={{textAlign: 'center', padding: isMobile ? '2rem' : '4rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1rem'}}>📋</div>
          <h3 className="myarc-text-green" style={{fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '1rem'}}>
            {t('workout.noplan') || 'No Workout Plan Yet'}
          </h3>
          <p className="myarc-text-gray" style={{fontSize: isMobile ? '0.875rem' : '1rem'}}>
            {t('workout.waitingForTrainer') || 'Your trainer will assign a workout plan soon!'}
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="myarc-animate-in" style={{padding: isMobile ? '0' : '0'}}>
      {/* Inject custom scrollbar styles */}
      <div dangerouslySetInnerHTML={{ __html: scrollStyles }} />
      
      {/* Video Section - Volledige breedte op mobile */}
      {(!isMobile || !editMode) && (
        <div className="myarc-mb-lg" style={{paddingLeft: isMobile ? '0.5rem' : '1rem', paddingRight: isMobile ? '0.5rem' : '1rem'}}>
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #111 100%)',
            borderRadius: '8px',
            padding: isMobile ? '2rem 1rem' : '3rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{fontSize: isMobile ? '2rem' : '3rem', marginBottom: '1rem'}}>🎥</div>
            <p className="myarc-text-white" style={{fontSize: isMobile ? '1rem' : '1.2rem'}}>
              {t('workout.personalVideo') || 'Personal Training Video'}
            </p>
          </div>
        </div>
      )}
      {/* Week Calendar - Maximale breedte op mobile */}
      <div className="myarc-mb-lg" style={{paddingLeft: isMobile ? '0.5rem' : '1rem', paddingRight: isMobile ? '0.5rem' : '1rem'}}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          color: '#fff',
          marginBottom: '1rem'
        }}>
          Jouw Schema - {formattedDate} (Week {weekNumber})
        </h3>
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? 'none' : 'repeat(7, 1fr)',
          gap: isMobile ? '0.3rem' : '0.5rem',
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? '0.5rem' : '0',
          WebkitOverflowScrolling: 'touch',
          paddingLeft: isMobile ? '0' : '0',
          paddingRight: isMobile ? '0.5rem' : '0'
        }}>
          {weekDays.map((day) => {
            const assignedWorkout = weekSchedule[day]
            const workoutData = assignedWorkout ? schema.week_structure[assignedWorkout] : null
            const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' })
            
            return (
              <div 
                key={day}
                onDragOver={(e) => editMode && handleDragOver(e, day)}
                onDrop={(e) => editMode && handleDrop(e, day)}
                onClick={() => {
                  if (isMobile && editMode && draggedWorkout) {
                    handleTouchWorkout(draggedWorkout, day)
                    setDraggedWorkout(null)
                  } else if (workoutData && !editMode) {
                    setSelectedDay(assignedWorkout)
                  }
                }}
                style={{
                  padding: isMobile ? '0.9rem' : '1rem',
                  minHeight: isMobile ? '160px' : '200px',
                  height: isMobile ? '160px' : '200px',
                  minWidth: isMobile ? '108px' : 'auto',
                  width: isMobile ? '108px' : 'auto',
                  flex: isMobile ? '0 0 auto' : '1',
                  border: isToday ? '2px solid #10b981' : '1px solid #333',
                  background: workoutData 
                    ? 'linear-gradient(135deg, #064e3b 0%, #1a1a1a 100%)' 
                    : (dragOverDay === day ? '#064e3b' : '#1a1a1a'),
                  cursor: editMode ? 'pointer' : (workoutData ? 'pointer' : 'default'),
                  transition: 'all 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{flex: 1}}>
                  <div className="myarc-text-green" style={{
                    fontWeight: 'bold',
                    fontSize: isMobile ? '0.9rem' : '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    {day.substring(0, 3)}
                    {isToday && <span className="myarc-ml-sm">📍</span>}
                  </div>
                  
                  {workoutData ? (
                    <div>
                      <div className="myarc-text-white" style={{
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        marginBottom: '0.25rem',
                        lineHeight: '1.1'
                      }}>
                        {workoutData.name}
                      </div>
                      <div className="myarc-text-gray" style={{fontSize: '0.65rem'}}>
                        {workoutData.focus?.split(',').slice(0, 2).join(', ')}
                      </div>
                    </div>
                  ) : (
                    <div className="myarc-text-gray" style={{
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      marginTop: '1rem',
                      textAlign: 'center'
                    }}>
                      {editMode && draggedWorkout ? '➕' : (t('workout.restDay') || 'Rest Day')}
                    </div>
                  )}
                </div>
                {isMobile && workoutData && !editMode && (
                  <button 
                    className="myarc-btn myarc-btn-primary myarc-btn-sm"
                    style={{fontSize: '0.7rem', padding: '0.25rem 0.5rem', marginTop: '0.5rem'}}
                  >
                    View →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {/* Plan Header - Optimaal voor mobile */}
      <div className="myarc-mb-lg" style={{padding: isMobile ? '0.5rem' : '1.5rem'}}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.5rem',
              marginBottom: '0.25rem',
              color: '#fff'
            }}>
              {schema.name && schema.name.length > 30 && isMobile 
                ? schema.name.substring(0, 30) + '...' 
                : schema.name}
            </h2>
            <p style={{fontSize: isMobile ? '0.75rem' : '0.9rem', color: '#10b981'}}>
              {workoutDays.length} workouts/week • {schema.split_name || 'Custom Split'}
            </p>
          </div>
          <button 
            onClick={() => setEditMode(!editMode)}
            className={`myarc-btn ${editMode ? 'myarc-btn-secondary' : 'myarc-btn-primary'}`}
            style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            {editMode ? 'Opslaan' : 'Wissel workout dagen'}
          </button>
        </div>
      </div>
      {/* Instructions in Edit Mode */}
      {editMode && (
        <div className="myarc-mb-lg" style={{
          background: '#064e3b',
          border: '1px solid #10b981',
          padding: isMobile ? '0.75rem' : '1rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginLeft: isMobile ? '0.5rem' : '1rem',
          marginRight: isMobile ? '0.5rem' : '1rem'
        }}>
          <p className="myarc-text-white" style={{fontSize: isMobile ? '0.875rem' : '1rem'}}>
            Klik de workout aan en vervolgens de dag waarop je deze workout gaat doen
          </p>
        </div>
      )}
      {/* Workout Pool (Edit Mode) */}
      {editMode && (
        <div className="myarc-mb-lg" style={{paddingLeft: isMobile ? '0.5rem' : '1rem', paddingRight: isMobile ? '0.5rem' : '1rem'}}>
          <h3 style={{fontSize: isMobile ? '0.9rem' : '1.1rem', color: '#10b981', marginBottom: '0.75rem'}}>
            Selecteer je workouts
          </h3>
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.3rem' : '0.5rem',
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? '0.5rem' : '0',
            WebkitOverflowScrolling: 'touch',
            flexWrap: !isMobile ? 'wrap' : 'nowrap',
            paddingLeft: isMobile ? '0' : '0',
            paddingRight: isMobile ? '0.5rem' : '0'
          }}>
            {workoutDays.map((dayKey) => {
              const day = schema.week_structure[dayKey]
              const isAssigned = Object.values(weekSchedule).includes(dayKey)
              const isSelected = draggedWorkout === dayKey
              
              return (
                <div 
                  key={dayKey}
                  draggable={!isMobile}
                  onDragStart={() => handleDragStart(dayKey)}
                  onClick={() => isMobile && setDraggedWorkout(isSelected ? null : dayKey)}
                  style={{
                    padding: isMobile ? '0.7rem' : '1rem',
                    minWidth: isMobile ? '125px' : 'auto',
                    flex: isMobile ? '0 0 auto' : '1 1 calc(33% - 0.5rem)',
                    cursor: 'pointer',
                    border: `2px solid ${isSelected ? '#fbbf24' : (isAssigned ? '#666' : '#10b981')}`,
                    background: isSelected ? '#064e3b' : (isAssigned ? '#1a1a1a' : '#064e3b'),
                    opacity: isAssigned && !isSelected ? 0.5 : 1,
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderRadius: '8px'
                  }}
                >
                  <h4 className="myarc-text-green" style={{
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    marginBottom: '0.25rem'
                  }}>
                    {day.name}
                  </h4>
                  <p className="myarc-text-gray" style={{
                    fontSize: isMobile ? '0.7rem' : '0.875rem',
                    lineHeight: '1.2'
                  }}>
                    {day.focus?.split(',').slice(0, 2).join(', ')}
                  </p>
                  {isAssigned && (
                    <p className="myarc-text-yellow-400" style={{
                      fontSize: '0.7rem',
                      marginTop: '0.25rem'
                    }}>
                      ✓ Scheduled
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Day Detail Popup - HELEMAAL BOVENAAN */}
      {selectedDay && schema.week_structure[selectedDay] && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 1000,
          overflowY: 'auto'
        }}>
          <div style={{
            maxWidth: isMobile ? '100%' : '800px',
            width: '100%',
            height: 'auto',
            overflow: 'visible',
            background: '#0a0a0a',
            borderRadius: 0
          }}>
            {/* Popup Header */}
            <div style={{
              background: '#111',
              padding: isMobile ? '1rem' : '1.5rem',
              borderBottom: '1px solid #333'
            }}>
              <div className="myarc-flex myarc-items-center myarc-justify-between myarc-mb-md">
                <div style={{flex: 1}}>
                  <h3 className="myarc-card-title" style={{
                    margin: 0,
                    fontSize: isMobile ? '1.2rem' : '1.5rem'
                  }}>
                    🏋️ {schema.week_structure[selectedDay].name}
                  </h3>
                  <p className="myarc-text-gray" style={{
                    marginTop: '0.25rem',
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}>
                    {schema.week_structure[selectedDay].focus}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="myarc-btn myarc-btn-ghost"
                  style={{
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    padding: isMobile ? '0.5rem' : '0.75rem'
                  }}
                >
                  ✕
                </button>
              </div>
              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button 
                  onClick={() => alert('Exercise library coming soon!')}
                  className="myarc-btn myarc-btn-secondary"
                  style={{
                    flex: 1,
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    padding: isMobile ? '0.5rem' : '0.75rem'
                  }}
                >
                  📚 {t('workout.exerciseLibrary') || 'Exercise Library'}
                </button>
                <button 
                  onClick={() => alert('Workout tracking coming soon!')}
                  className="myarc-btn myarc-btn-primary"
                  style={{
                    flex: 1,
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    padding: isMobile ? '0.5rem' : '0.75rem'
                  }}
                >
                  ✅ {t('workout.startWorkout') || 'Start Workout'}
                </button>
              </div>
            </div>
            {/* Exercises List */}
            <div style={{padding: isMobile ? '1rem' : '1.5rem'}}>
              <div className="myarc-flex myarc-flex-col myarc-gap-md">
                {schema.week_structure[selectedDay].exercises?.map((exercise, index) => (
                  <div 
                    key={index} 
                    style={{
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
                      border: '1px solid #333',
                      padding: isMobile ? '0.75rem' : '1rem',
                      borderRadius: '8px',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <h4 className="myarc-text-green" style={{
                      fontSize: isMobile ? '1.1rem' : '1.2rem',
                      marginBottom: '0.4rem'
                    }}>
                      {index + 1}. {exercise.name}
                    </h4>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: '2px',
                      marginBottom: '2px'
                    }}>
                      {/* Sets - Full Width */}
                      <div style={{
                        background: '#111',
                        padding: isMobile ? '0.4rem' : '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderRadius: '4px'
                      }}>
                        <span className="myarc-text-gray" style={{fontSize: '0.875rem'}}>
                          {t('workout.sets') || 'Sets'}
                        </span>
                        <span className="myarc-text-white" style={{
                          fontSize: isMobile ? '1.2rem' : '1.4rem',
                          fontWeight: 'bold'
                        }}>
                          {exercise.sets}
                        </span>
                      </div>
                      {/* Reps - Full Width */}
                      <div style={{
                        background: '#111',
                        padding: isMobile ? '0.4rem' : '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderRadius: '4px'
                      }}>
                        <span className="myarc-text-gray" style={{fontSize: '0.875rem'}}>
                          {t('workout.reps') || 'Reps'}
                        </span>
                        <span className="myarc-text-white" style={{
                          fontSize: isMobile ? '1.2rem' : '1.4rem',
                          fontWeight: 'bold'
                        }}>
                          {exercise.reps}
                        </span>
                      </div>
                    </div>
                    {/* Rest and RPE */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '2px',
                      marginBottom: '0.4rem'
                    }}>
                      <div style={{
                        background: '#111',
                        padding: isMobile ? '0.3rem' : '0.4rem',
                        textAlign: 'center',
                        borderRadius: '4px'
                      }}>
                        <div className="myarc-text-white" style={{
                          fontSize: isMobile ? '1rem' : '1.2rem',
                          fontWeight: 'bold'
                        }}>
                          {exercise.rust || '90s'}
                        </div>
                        <div className="myarc-text-gray" style={{fontSize: '0.65rem'}}>
                          {t('workout.rest') || 'Rest'}
                        </div>
                      </div>
                      <div style={{
                        background: '#111',
                        padding: isMobile ? '0.3rem' : '0.4rem',
                        textAlign: 'center',
                        borderRadius: '4px'
                      }}>
                        <div className="myarc-text-white" style={{
                          fontSize: isMobile ? '1rem' : '1.2rem',
                          fontWeight: 'bold'
                        }}>
                          {exercise.rpe || '8'}
                        </div>
                        <div className="myarc-text-gray" style={{fontSize: '0.65rem'}}>RPE</div>
                      </div>
                    </div>
                    {/* Focus/Notes */}
                    {exercise.notes && (
                      <div style={{
                        background: '#064e3b',
                        padding: isMobile ? '0.4rem' : '0.5rem',
                        marginBottom: '0.4rem',
                        borderRadius: '4px'
                      }}>
                        <p className="myarc-text-white" style={{fontSize: isMobile ? '0.75rem' : '0.85rem'}}>
                          💡 {t('workout.focusOn') || 'Focus on'}: {exercise.notes}
                        </p>
                      </div>
                    )}
                    {/* Alternative Exercises Button */}
                    <button 
                      onClick={() => loadAlternatives(exercise.primairSpieren || 'chest')}
                      className="myarc-btn myarc-btn-ghost"
                      style={{
                        width: '100%',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        padding: isMobile ? '0.4rem' : '0.5rem',
                        border: '1px solid #10b981',
                        background: 'transparent'
                      }}
                    >
                      Alternative Exercises
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Alternative Exercises Modal */}
      {showAlternatives && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: isMobile ? '0.5rem' : '1rem'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            padding: isMobile ? '1.5rem' : '2rem',
            background: '#0a0a0a',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 className="myarc-card-title myarc-mb-lg">
              Alternative {currentMuscleGroup.charAt(0).toUpperCase() + currentMuscleGroup.slice(1)} Exercises
            </h3>
            <div className="myarc-flex myarc-flex-col myarc-gap-sm">
              {alternativeExercises.map((alt, i) => (
                <button 
                  key={i}
                  className="myarc-btn myarc-btn-ghost"
                  onClick={() => {
                    alert(`Selected: ${alt}`)
                    setShowAlternatives(false)
                  }}
                  style={{justifyContent: 'flex-start', padding: '0.75rem'}}
                >
                  {alt}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowAlternatives(false)}
              className="myarc-btn myarc-btn-secondary myarc-mt-lg"
              style={{width: '100%'}}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Quick Stats - Volledige breedte mobile */}
      <div className="myarc-mb-lg" style={{paddingLeft: isMobile ? '0.5rem' : '1rem', paddingRight: isMobile ? '0.5rem' : '1rem'}}>
        <h3 style={{fontSize: isMobile ? '1rem' : '1.2rem', color: '#fff', marginBottom: '1rem'}}>
          {t('workout.weekOverview') || 'Week Overview'}
        </h3>
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.3rem' : '0.75rem',
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? '0.5rem' : '0',
          WebkitOverflowScrolling: 'touch',
          paddingLeft: isMobile ? '0' : '0',
          paddingRight: isMobile ? '0.5rem' : '0'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
            borderRadius: '8px',
            textAlign: 'center',
            padding: isMobile ? '0.8rem 0.6rem' : '1rem',
            minWidth: isMobile ? '102px' : 'auto',
            flex: isMobile ? '0 0 auto' : '1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #10b98133'
          }}>
            <div className="myarc-text-green" style={{
              fontSize: isMobile ? '1.4rem' : '1.6rem',
              fontWeight: 'bold',
              color: '#10b981'
            }}>
              {Object.values(weekSchedule).length}
            </div>
            <div className="myarc-text-gray" style={{fontSize: isMobile ? '0.75rem' : '0.85rem', color: '#a0a0a0'}}>
              {t('workout.workouts') || 'Workouts'}
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
            borderRadius: '8px',
            textAlign: 'center',
            padding: isMobile ? '0.8rem 0.6rem' : '1rem',
            minWidth: isMobile ? '102px' : 'auto',
            flex: isMobile ? '0 0 auto' : '1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #10b98133'
          }}>
            <div className="myarc-text-green" style={{
              fontSize: isMobile ? '1.4rem' : '1.6rem',
              fontWeight: 'bold',
              color: '#10b981'
            }}>
              {7 - Object.values(weekSchedule).length}
            </div>
            <div className="myarc-text-gray" style={{fontSize: isMobile ? '0.75rem' : '0.85rem', color: '#a0a0a0'}}>
              {t('workout.restDays') || 'Rest Days'}
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
            borderRadius: '8px',
            textAlign: 'center',
            padding: isMobile ? '0.8rem 0.6rem' : '1rem',
            minWidth: isMobile ? '102px' : 'auto',
            flex: isMobile ? '0 0 auto' : '1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #10b98133'
          }}>
            <div className="myarc-text-green" style={{
              fontSize: isMobile ? '1.4rem' : '1.6rem',
              fontWeight: 'bold',
              color: '#10b981'
            }}>
              {Math.round(Object.values(weekSchedule).length * 75)}
            </div>
            <div className="myarc-text-gray" style={{fontSize: isMobile ? '0.75rem' : '0.85rem', color: '#a0a0a0'}}>
              {t('workout.minWeek') || 'Min/Week'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


