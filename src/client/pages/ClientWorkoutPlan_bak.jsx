import useIsMobile from '../../hooks/useIsMobile'
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

  // Days of the week
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  // Parse workout days from schema
  const workoutDays = schema?.week_structure ? Object.keys(schema.week_structure) : []

  useEffect(() => {
    // Initialize week schedule
    if (schema?.week_structure) {
      const initialSchedule = {}
      // Auto-assign workouts to days (Mon, Wed, Fri pattern)
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
  const isMobile = useIsMobile()

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
      // Check for conflicts
      const conflict = checkConflict(day, draggedWorkout)
      if (conflict && !confirm(`${conflict}\nContinue anyway?`)) {
        setDraggedWorkout(null)
        setDragOverDay(null)
        return
      }
      
      // Remove workout from old day if exists
      const newSchedule = { ...weekSchedule }
      Object.keys(newSchedule).forEach(d => {
        if (newSchedule[d] === draggedWorkout) {
          delete newSchedule[d]
        }
      })
      
      // Add to new day
      newSchedule[day] = draggedWorkout
      setWeekSchedule(newSchedule)
    }
    
    setDraggedWorkout(null)
    setDragOverDay(null)
  }

  // Handle touch events for mobile
  const handleTouchWorkout = (workoutKey, day) => {
    if (!editMode) return
    
    // Simple assignment on touch
    const newSchedule = { ...weekSchedule }
    
    // Remove from other days
    Object.keys(newSchedule).forEach(d => {
      if (newSchedule[d] === workoutKey) {
        delete newSchedule[d]
      }
    })
    
    // Toggle - if already on this day, remove it, otherwise add
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

  // Load alternative exercises
  const loadAlternatives = (muscleGroup) => {
    // Mock data - replace with actual database call
    const alternatives = {
      chest: ['Dumbbell Press', 'Cable Fly', 'Push-ups', 'Machine Press'],
      back: ['Pull-ups', 'Cable Row', 'T-Bar Row', 'Lat Pulldown'],
      legs: ['Squats', 'Leg Press', 'Lunges', 'Leg Curls'],
      shoulders: ['Military Press', 'Lateral Raises', 'Front Raises', 'Arnold Press'],
      biceps: ['Barbell Curl', 'Hammer Curl', 'Cable Curl', 'Preacher Curl'],
      triceps: ['Overhead Extension', 'Dips', 'Cable Pushdown', 'Close-grip Press']
    }
    
    setAlternativeExercises(alternatives[muscleGroup.toLowerCase()] || [])
    setShowAlternatives(true)
  }

  if (!schema) {
    return (
      <div className="myarc-animate-in" style={{padding: isMobile ? '1rem' : '2rem'}}>
        <div className="myarc-card" style={{textAlign: 'center', padding: isMobile ? '2rem' : '4rem'}}>
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
    <div className="myarc-animate-in" style={{padding: isMobile ? '0.5rem' : '0'}}>
      {/* Video Section - Hidden on mobile in edit mode */}
      {(!isMobile || !editMode) && (
        <div className="myarc-card myarc-mb-lg">
          <h3 className="myarc-card-title" style={{fontSize: isMobile ? '1.2rem' : '1.5rem'}}>
            📹 {t('workout.explanation') || 'Workout Explanation'}
          </h3>
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #111 100%)',
            borderRadius: '8px',
            padding: isMobile ? '2rem 1rem' : '3rem',
            textAlign: 'center',
            border: '2px solid #10b981'
          }}>
            <div style={{fontSize: isMobile ? '2rem' : '3rem', marginBottom: '1rem'}}>🎥</div>
            <p className="myarc-text-white" style={{fontSize: isMobile ? '1rem' : '1.2rem'}}>
              {t('workout.personalVideo') || 'Personal Training Video'}
            </p>
          </div>
        </div>
      )}

      {/* Plan Header - Mobile Responsive */}
      <div className="myarc-card myarc-mb-lg" style={{padding: isMobile ? '1rem' : '1.5rem'}}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <h2 className="myarc-card-title" style={{
              fontSize: isMobile ? '1.2rem' : '2rem',
              marginBottom: '0.25rem'
            }}>
              {schema.name && schema.name.length > 30 && isMobile 
                ? schema.name.substring(0, 30) + '...' 
                : schema.name}
            </h2>
            <p className="myarc-text-gray" style={{fontSize: isMobile ? '0.875rem' : '1rem'}}>
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
            {editMode ? `✓ ${t('workout.save') || 'Save'}` : `📅 ${t('workout.planWeek') || 'Plan Week'}`}
          </button>
        </div>
      </div>

      {/* Instructions in Edit Mode */}
      {editMode && (
        <div className="myarc-card myarc-mb-lg" style={{
          background: '#064e3b',
          border: '1px solid #10b981',
          padding: isMobile ? '0.75rem' : '1rem'
        }}>
          <p className="myarc-text-white" style={{fontSize: isMobile ? '0.875rem' : '1rem'}}>
            {isMobile 
              ? `📱 ${t('workout.tapInstruction') || 'Tap workouts below, then tap a day to assign'}`
              : `🖱️ ${t('workout.dragInstruction') || 'Drag workouts to your preferred training days'}`
            }
          </p>
        </div>
      )}

      {/* Workout Pool (Edit Mode) - Mobile Optimized */}
      {editMode && (
        <div className="myarc-card myarc-mb-lg">
          <h3 className="myarc-card-title" style={{fontSize: isMobile ? '1rem' : '1.2rem'}}>
            {isMobile ? `👆 ${t('workout.tapSelect') || 'Tap to Select'}` : `🔄 ${t('workout.dragSchedule') || 'Drag to Schedule'}`}
          </h3>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? '0.5rem' : '0',
            WebkitOverflowScrolling: 'touch',
            flexWrap: !isMobile ? 'wrap' : 'nowrap'
          }}>
            {workoutDays.map((dayKey) => {
              const day = schema.week_structure[dayKey]
              const isAssigned = Object.values(weekSchedule).includes(dayKey)
              const isSelected = draggedWorkout === dayKey
              
              return (
                <div 
                  key={dayKey}
                  className="myarc-card"
                  draggable={!isMobile}
                  onDragStart={() => handleDragStart(dayKey)}
                  onClick={() => isMobile && setDraggedWorkout(isSelected ? null : dayKey)}
                  style={{
                    padding: isMobile ? '0.75rem' : '1rem',
                    minWidth: isMobile ? '140px' : 'auto',
                    flex: isMobile ? '0 0 auto' : '1 1 calc(33% - 0.5rem)',
                    cursor: 'pointer',
                    border: `2px solid ${isSelected ? '#fbbf24' : (isAssigned ? '#666' : '#10b981')}`,
                    background: isSelected ? '#064e3b' : (isAssigned ? '#1a1a1a' : '#064e3b'),
                    opacity: isAssigned && !isSelected ? 0.5 : 1,
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s'
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
                  {isSelected && isMobile && (
                    <p className="myarc-text-white" style={{
                      fontSize: '0.7rem',
                      marginTop: '0.25rem',
                      fontWeight: 'bold'
                    }}>
                      👆 Tap a day below
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week Calendar - Mobile Optimized with FIXED dimensions */}
      <div className="myarc-card myarc-mb-lg">
        <h3 className="myarc-card-title myarc-mb-lg" style={{fontSize: isMobile ? '1.2rem' : '1.5rem'}}>
          📅 {t('workout.yourWeek') || 'Your Week'}
        </h3>
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? 'none' : 'repeat(7, 1fr)',
          gap: '0.5rem',
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? '0.5rem' : '0',
          WebkitOverflowScrolling: 'touch'
        }}>
          {weekDays.map((day) => {
            const assignedWorkout = weekSchedule[day]
            const workoutData = assignedWorkout ? schema.week_structure[assignedWorkout] : null
            const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' })
            
            return (
              <div 
                key={day}
                className="myarc-card"
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
                  padding: isMobile ? '1rem' : '1rem',
                  minHeight: isMobile ? '140px' : '180px',
                  height: isMobile ? '140px' : '180px',
                  minWidth: isMobile ? '100px' : 'auto',
                  width: isMobile ? '100px' : 'auto',
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
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
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
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
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

                {/* Mobile: Show button to view */}
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

      {/* Day Detail Popup - Mobile Optimized */}
      {selectedDay && schema.week_structure[selectedDay] && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '0' : '1rem',
          overflowY: 'auto'
        }}>
          <div className="myarc-card" style={{
            maxWidth: isMobile ? '100%' : '800px',
            width: '100%',
            maxHeight: isMobile ? '100vh' : '90vh',
            height: isMobile ? '100vh' : 'auto',
            overflow: 'auto',
            border: isMobile ? 'none' : '2px solid #10b981',
            borderRadius: isMobile ? '0' : '8px',
            margin: 0
          }}>
            {/* Popup Header with Buttons */}
            <div style={{
              position: 'sticky',
              top: 0,
              background: '#111',
              padding: isMobile ? '1rem' : '1.5rem',
              borderBottom: '1px solid #333',
              zIndex: 10
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

              {/* Action Buttons TOP */}
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

            {/* Exercises List - NEW LAYOUT */}
            <div style={{padding: isMobile ? '1rem' : '1.5rem'}}>
              <div className="myarc-flex myarc-flex-col myarc-gap-md">
                {schema.week_structure[selectedDay].exercises?.map((exercise, index) => (
                  <div 
                    key={index} 
                    className="myarc-card" 
                    style={{
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
                      border: '1px solid #333',
                      padding: isMobile ? '1rem' : '1.5rem'
                    }}
                  >
                    {/* Exercise Name */}
                    <h4 className="myarc-text-green" style={{
                      fontSize: isMobile ? '1.1rem' : '1.2rem',
                      marginBottom: '0.75rem'
                    }}>
                      {index + 1}. {exercise.name}
                    </h4>
                    
                    {/* NEW LAYOUT: Full width Sets and Reps */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      {/* Sets - Full Width */}
                      <div className="myarc-card" style={{
                        background: '#111',
                        padding: isMobile ? '0.75rem' : '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span className="myarc-text-gray" style={{fontSize: '0.875rem'}}>
                          {t('workout.sets') || 'Sets'}
                        </span>
                        <span className="myarc-text-white" style={{
                          fontSize: isMobile ? '1.5rem' : '1.8rem',
                          fontWeight: 'bold'
                        }}>
                          {exercise.sets}
                        </span>
                      </div>

                      {/* Reps - Full Width */}
                      <div className="myarc-card" style={{
                        background: '#111',
                        padding: isMobile ? '0.75rem' : '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span className="myarc-text-gray" style={{fontSize: '0.875rem'}}>
                          {t('workout.reps') || 'Reps'}
                        </span>
                        <span className="myarc-text-white" style={{
                          fontSize: isMobile ? '1.5rem' : '1.8rem',
                          fontWeight: 'bold'
                        }}>
                          {exercise.reps}
                        </span>
                      </div>
                    </div>

                    {/* Rest and RPE - Half Width */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div className="myarc-card" style={{
                        background: '#111',
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        textAlign: 'center'
                      }}>
                        <div className="myarc-text-white" style={{
                          fontSize: isMobile ? '1.2rem' : '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          {exercise.rust || '90s'}
                        </div>
                        <div className="myarc-text-gray" style={{fontSize: '0.75rem'}}>
                          {t('workout.rest') || 'Rest'}
                        </div>
                      </div>
                      <div className="myarc-card" style={{
                        background: '#111',
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        textAlign: 'center'
                      }}>
                        <div className="myarc-text-white" style={{
                          fontSize: isMobile ? '1.2rem' : '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          {exercise.rpe || '8'}
                        </div>
                        <div className="myarc-text-gray" style={{fontSize: '0.75rem'}}>RPE</div>
                      </div>
                    </div>

                    {/* Focus/Notes - Full Width */}
                    {exercise.notes && (
                      <div className="myarc-card" style={{
                        background: '#064e3b',
                        padding: isMobile ? '0.75rem' : '1rem',
                        marginBottom: '0.5rem'
                      }}>
                        <p className="myarc-text-white" style={{fontSize: isMobile ? '0.875rem' : '1rem'}}>
                          💡 {t('workout.focusOn') || 'Focus on'}: {exercise.notes}
                        </p>
                      </div>
                    )}

                    {/* NEW: Alternative Exercises Button */}
                    <button 
                      onClick={() => loadAlternatives(exercise.primairSpieren || 'chest')}
                      className="myarc-btn myarc-btn-ghost"
                      style={{
                        width: '100%',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        padding: isMobile ? '0.75rem' : '1rem'
                      }}
                    >
                      🔄 {t('workout.alternatives') || 'Alternative Exercises'}
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
          padding: '1rem'
        }}>
          <div className="myarc-card" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '2rem'
          }}>
            <h3 className="myarc-card-title myarc-mb-lg">
              🔄 {t('workout.alternatives') || 'Alternative Exercises'}
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
                  style={{justifyContent: 'flex-start'}}
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
              ✕ {t('common.close') || 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats - Mobile Optimized */}
      <div className="myarc-card">
        <h3 className="myarc-card-title" style={{fontSize: isMobile ? '1.2rem' : '1.5rem'}}>
          📊 {t('workout.weekOverview') || 'Week Overview'}
        </h3>
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? '0.5rem' : '0',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div className="myarc-card" style={{
            background: '#1a1a1a',
            textAlign: 'center',
            padding: isMobile ? '1rem' : '1.5rem',
            minWidth: isMobile ? '120px' : 'auto',
            flex: isMobile ? '0 0 auto' : '1'
          }}>
            <div className="myarc-text-green" style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 'bold'
            }}>
              {Object.values(weekSchedule).length}
            </div>
            <div className="myarc-text-gray" style={{fontSize: isMobile ? '0.8rem' : '1rem'}}>
              {t('workout.workouts') || 'Workouts'}
            </div>
          </div>
          <div className="myarc-card" style={{
            background: '#1a1a1a',
            textAlign: 'center',
            padding: isMobile ? '1rem' : '1.5rem',
            minWidth: isMobile ? '120px' : 'auto',
            flex: isMobile ? '0 0 auto' : '1'
          }}>
            <div className="myarc-text-green" style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 'bold'
            }}>
              {7 - Object.values(weekSchedule).length}
            </div>
            <div className="myarc-text-gray" style={{fontSize: isMobile ? '0.8rem' : '1rem'}}>
              {t('workout.restDays') || 'Rest Days'}
            </div>
          </div>
          <div className="myarc-card" style={{
            background: '#1a1a1a',
            textAlign: 'center',
            padding: isMobile ? '1rem' : '1.5rem',
            minWidth: isMobile ? '120px' : 'auto',
            flex: isMobile ? '0 0 auto' : '1'
          }}>
            <div className="myarc-text-green" style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 'bold'
            }}>
              {Math.round(Object.values(weekSchedule).length * 75)}
            </div>
            <div className="myarc-text-gray" style={{fontSize: isMobile ? '0.8rem' : '1rem'}}>
              {t('workout.minWeek') || 'Min/Week'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
