// src/modules/workout/components/WorkoutDetailsPage.jsx
import { useState, useEffect } from 'react'
import { 
  Play, Info, RefreshCw, Clock, Target, 
  Flame, ChevronLeft, ChevronRight, Zap,
  CheckCircle, History, Dumbbell, Timer
} from 'lucide-react'
import QuickLogModal from '../../progress/workout/components/QuickLogModal'
import ExerciseVideoModal from './ExerciseVideoModal'
import ExerciseInfoModal from './ExerciseInfoModal'
import AlternativeExercises from './AlternativeExercises'

export default function WorkoutDetailsPage({
  workout,
  workoutKey,
  client,
  db,
  onDayChange,
  currentDayIndex,
  weekDays
}) {
  const isMobile = window.innerWidth <= 768
  const [showWorkoutLog, setShowWorkoutLog] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [todaysLogs, setTodaysLogs] = useState([])
  const [hoveredExercise, setHoveredExercise] = useState(null)
  const [checkedExercises, setCheckedExercises] = useState({})
  
  // Load today's logs
  useEffect(() => {
    loadTodaysLogs()
  }, [client?.id])
  
  const loadTodaysLogs = async () => {
    if (!db || !client?.id) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: sessions } = await db.supabase
        .from('workout_sessions')
        .select('id')
        .eq('client_id', client.id)
        .eq('workout_date', today)
      
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id)
        const { data } = await db.supabase
          .from('workout_progress')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false })
        
        if (data) {
          const logs = data.map(p => ({
            id: p.id,
            exercise_name: p.exercise_name,
            sets: p.sets || [],
            created_at: p.created_at
          }))
          
          setTodaysLogs(logs)
          
          const checked = {}
          logs.forEach(log => {
            const exerciseIndex = workout?.exercises?.findIndex(
              ex => ex.name === log.exercise_name
            )
            if (exerciseIndex !== -1) {
              checked[exerciseIndex] = true
            }
          })
          setCheckedExercises(checked)
        }
      }
    } catch (error) {
      console.error('Error loading today\'s logs:', error)
    }
  }
  
  // Truncate title to 20 chars
  const truncateTitle = (title, maxLength = 20) => {
    if (!title) return ''
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title
  }
  
  // Format workout for QuickLogModal
  const formattedWorkout = workout ? {
    id: workout.id || `workout-${Date.now()}`,
    name: workout.name || 'Workout',
    date: new Date().toISOString().split('T')[0],
    exercises: workout.exercises?.map((ex, idx) => ({
      id: ex.id || `exercise-${idx}`,
      name: ex.name || `Exercise ${idx + 1}`,
      sets: parseInt(ex.sets) || 3,
      reps: ex.reps || '10',
      rest: parseInt(ex.rust || ex.rest) || 90,
      notes: ex.notes || '',
      primairSpieren: ex.primairSpieren || 'chest',
      equipment: ex.equipment || 'dumbbell',
      rpe: ex.rpe || 8
    })) || []
  } : null
  
  // Handle exercise actions
  const handleVideoClick = (exercise) => {
    setSelectedExercise(exercise)
    setShowVideoModal(true)
  }
  
  const handleInfoClick = (exercise) => {
    setSelectedExercise(exercise)
    setShowInfoModal(true)
  }
  
  const handleLogClick = (exercise) => {
    setSelectedExercise(exercise)
    setShowWorkoutLog(true)
  }
  
  const handleAlternativesClick = (exercise) => {
    setSelectedExercise({
      ...exercise,
      muscleGroup: exercise.primairSpieren || 'chest'
    })
    setShowAlternatives(true)
  }
  
  const handleReplaceExercise = async (oldExercise, newExercise) => {
    // Handle exercise replacement logic here
    console.log('Replacing', oldExercise.name, 'with', newExercise.name)
    setShowAlternatives(false)
  }
  
  // Calculate totals
  const calculateTotals = () => {
    const totals = {
      exercises: workout?.exercises?.length || 0,
      sets: 0,
      reps: 0,
      time: 0
    }
    
    workout?.exercises?.forEach(ex => {
      const sets = parseInt(ex.sets) || 0
      totals.sets += sets
      
      const repsStr = ex.reps || '0'
      const repsMatch = repsStr.match(/\d+/)
      const reps = repsMatch ? parseInt(repsMatch[0]) : 0
      totals.reps += sets * reps
      
      const restSeconds = parseInt(ex.rust?.match(/\d+/)?.[0] || 90)
      totals.time += sets * (90 + restSeconds) / 60
    })
    
    totals.time = Math.round(totals.time)
    return totals
  }
  
  const totals = calculateTotals()
  
  const getExerciseThumbnail = (exercise) => {
    const muscleDefaults = {
      chest: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
      back: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=300&fit=crop',
      legs: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop',
      shoulders: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&h=300&fit=crop',
      arms: 'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=400&h=300&fit=crop',
      core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
    }
    
    const muscle = exercise.primairSpieren?.toLowerCase() || 'chest'
    return muscleDefaults[muscle] || muscleDefaults.chest
  }
  
  if (!workout) {
    return (
      <div style={{
        padding: isMobile ? '0.75rem' : '1rem',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <Dumbbell size={isMobile ? 40 : 48} color="rgba(249, 115, 22, 0.2)" style={{ marginBottom: '1rem' }} />
        <p style={{ fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
          Selecteer een dag om de workout te bekijken
        </p>
      </div>
    )
  }
  
  return (
    <div style={{
      padding: isMobile ? '0 0.75rem 1rem' : '0 1rem 1.5rem',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMobile ? '0.75rem' : '1rem',
        overflow: 'hidden'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          fontWeight: '800',
          color: '#f97316',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '60%',
          letterSpacing: '-0.02em'
        }}>
          <Dumbbell size={isMobile ? 18 : 22} color="#f97316" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {truncateTitle(workout.name)}
          </span>
        </h2>
        
        {/* Mobile day navigation */}
        {isMobile && onDayChange && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            flexShrink: 0
          }}>
            <button
              onClick={() => {
                const prev = currentDayIndex === 0 ? 6 : currentDayIndex - 1
                onDayChange(prev)
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(249, 115, 22, 0.05)',
                border: '1px solid rgba(249, 115, 22, 0.1)',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            
            <span style={{
              fontSize: '0.8rem',
              color: '#f97316',
              fontWeight: '700',
              minWidth: '80px',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {weekDays?.[currentDayIndex] || 'Vandaag'}
            </span>
            
            <button
              onClick={() => {
                const next = currentDayIndex === 6 ? 0 : currentDayIndex + 1
                onDayChange(next)
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(249, 115, 22, 0.05)',
                border: '1px solid rgba(249, 115, 22, 0.1)',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Workout totals bar */}
      <div style={{
        padding: isMobile ? '0.75rem 0' : '1rem 0',
        marginBottom: isMobile ? '0.75rem' : '1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Exercises count */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.25rem'
          }}>
            <Flame 
              size={isMobile ? 14 : 16} 
              color="#f97316" 
              style={{ opacity: 0.9 }} 
            />
            <span style={{
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: '800',
              color: '#f97316',
              lineHeight: 1,
              letterSpacing: '-0.02em'
            }}>
              {totals.exercises}
            </span>
            <span style={{
              fontSize: isMobile ? '0.55rem' : '0.65rem',
              color: 'rgba(249, 115, 22, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
              alignSelf: 'center'
            }}>
              oefeningen
            </span>
          </div>

          {/* Other stats */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '1rem' : '1.25rem',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <Target size={isMobile ? 12 : 14} color="#8b5cf6" style={{ opacity: 0.7 }} />
              <span style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {totals.sets}
              </span>
              <span style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                color: 'rgba(139, 92, 246, 0.5)',
                textTransform: 'uppercase'
              }}>
                sets
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <Clock size={isMobile ? 12 : 14} color="#10b981" style={{ opacity: 0.7 }} />
              <span style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                fontWeight: '700',
                color: '#10b981'
              }}>
                ~{totals.time}
              </span>
              <span style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                color: 'rgba(16, 185, 129, 0.5)',
                textTransform: 'uppercase'
              }}>
                min
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Today's logs indicator */}
      {todaysLogs.length > 0 && (
        <div style={{
          marginBottom: isMobile ? '0.75rem' : '1rem',
          padding: isMobile ? '0.6rem' : '0.75rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          backdropFilter: 'blur(10px)'
        }}>
          <History size={isMobile ? 14 : 16} color="#10b981" />
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: '#10b981',
            fontWeight: '600'
          }}>
            {todaysLogs.length} oefening{todaysLogs.length !== 1 ? 'en' : ''} vandaag gelogd
          </span>
        </div>
      )}
      
      {/* Exercises grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.6rem' : '0.75rem'
      }}>
        {workout.exercises?.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            index={index}
            isChecked={checkedExercises[index] || false}
            onVideoClick={() => handleVideoClick(exercise)}
            onInfoClick={() => handleInfoClick(exercise)}
            onAlternativesClick={() => handleAlternativesClick(exercise)}
            onLogClick={() => handleLogClick(exercise)}
            getThumbnail={getExerciseThumbnail}
            isMobile={isMobile}
            isHovered={hoveredExercise === index}
            onHover={() => setHoveredExercise(index)}
            onLeave={() => setHoveredExercise(null)}
            todaysLogs={todaysLogs.filter(log => 
              log.exercise_name === exercise.name
            )}
          />
        ))}
      </div>
      
      {/* Modals */}
      {showWorkoutLog && formattedWorkout && (
        <QuickLogModal
          db={db}
          client={client}
          todaysWorkout={selectedExercise ? {
            ...formattedWorkout,
            exercises: formattedWorkout.exercises.filter(ex => 
              ex.name === selectedExercise.name
            )
          } : formattedWorkout}
          setTodaysLogs={setTodaysLogs}
          todaysLogs={todaysLogs}
          onClose={() => {
            setShowWorkoutLog(false)
            loadTodaysLogs()
          }}
          onDataReload={loadTodaysLogs}
          isMobile={isMobile}
        />
      )}
      
      {showVideoModal && selectedExercise && (
        <ExerciseVideoModal
          exercise={selectedExercise}
          onClose={() => setShowVideoModal(false)}
          isMobile={isMobile}
        />
      )}
      
      {showInfoModal && selectedExercise && (
        <ExerciseInfoModal
          exercise={selectedExercise}
          onClose={() => setShowInfoModal(false)}
          db={db}
          isMobile={isMobile}
        />
      )}
      
      {showAlternatives && selectedExercise && (
        <AlternativeExercises
          exercise={selectedExercise}
          onSelect={handleReplaceExercise}
          onClose={() => setShowAlternatives(false)}
          db={db}
        />
      )}
    </div>
  )
}

// Exercise Card Component
function ExerciseCard({ 
  exercise, 
  index,
  isChecked,
  onVideoClick,
  onInfoClick,
  onAlternativesClick,
  onLogClick,
  getThumbnail,
  isMobile,
  isHovered,
  onHover,
  onLeave,
  todaysLogs
}) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        background: 'rgba(23, 23, 23, 0.6)',
        borderRadius: isMobile ? '12px' : '14px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.1)'}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        backdropFilter: 'blur(10px)',
        boxShadow: isChecked 
          ? '0 6px 20px rgba(16, 185, 129, 0.15)'
          : '0 4px 16px rgba(249, 115, 22, 0.08)',
        transform: isHovered && !isMobile ? 'translateY(-2px) scale(1.01)' : 'translateY(0)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {isChecked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
          borderRadius: 'inherit',
          pointerEvents: 'none'
        }} />
      )}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.6rem' : '0.75rem',
        position: 'relative'
      }}>
        {/* Thumbnail */}
        <div 
          onClick={onVideoClick}
          style={{
            width: isMobile ? '72px' : '90px',
            height: isMobile ? '54px' : '68px',
            borderRadius: '10px',
            background: `url(${getThumbnail(exercise)}) center/cover`,
            border: `2px solid ${isChecked ? '#10b981' : 'rgba(249, 115, 22, 0.2)'}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            minHeight: '44px'
          }}
        >
          {isChecked && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={isMobile ? 20 : 24} color="white" strokeWidth={3} />
            </div>
          )}
          
          {!isChecked && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isHovered ? 1 : 0.8,
              transition: 'opacity 0.3s ease'
            }}>
              <div style={{
                width: isMobile ? '28px' : '32px',
                height: isMobile ? '28px' : '32px',
                borderRadius: '50%',
                background: 'rgba(249, 115, 22, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Play size={isMobile ? 14 : 16} color="white" fill="white" style={{ marginLeft: '2px' }} />
              </div>
            </div>
          )}
        </div>
        
        {/* Exercise content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.4rem'
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.65rem',
                color: 'rgba(249, 115, 22, 0.5)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.2rem'
              }}>
                Oefening {index + 1}
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                color: isChecked ? '#10b981' : 'white',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {exercise.name}
              </div>
            </div>
            
            {todaysLogs.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.2rem 0.4rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '6px',
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: '#10b981',
                fontWeight: '700',
                flexShrink: 0
              }}>
                <CheckCircle size={10} />
                {todaysLogs.length}x
              </div>
            )}
          </div>
          
          {/* Exercise stats */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.6rem' : '0.75rem',
            marginBottom: '0.5rem',
            flexWrap: 'nowrap',
            overflowX: 'auto'
          }}>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem',
              flexShrink: 0
            }}>
              <span style={{ fontWeight: '700', color: '#f97316' }}>
                {exercise.sets || 3}
              </span>
              <span style={{ fontSize: isMobile ? '0.55rem' : '0.65rem', color: 'rgba(249, 115, 22, 0.5)' }}>
                sets
              </span>
            </div>
            
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem',
              flexShrink: 0
            }}>
              <span style={{ fontWeight: '700', color: '#8b5cf6' }}>
                {exercise.reps || '10'}
              </span>
              <span style={{ fontSize: isMobile ? '0.55rem' : '0.65rem', color: 'rgba(139, 92, 246, 0.5)' }}>
                reps
              </span>
            </div>
            
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem',
              flexShrink: 0
            }}>
              <span style={{ fontWeight: '700', color: '#10b981' }}>
                2-3m
              </span>
              <span style={{ fontSize: isMobile ? '0.55rem' : '0.65rem', color: 'rgba(16, 185, 129, 0.5)' }}>
                rust
              </span>
            </div>
            
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem',
              flexShrink: 0
            }}>
              <span style={{ fontWeight: '700', color: '#ef4444' }}>
                {exercise.rpe || '8'}
              </span>
              <span style={{ fontSize: isMobile ? '0.55rem' : '0.65rem', color: 'rgba(239, 68, 68, 0.5)' }}>
                RPE
              </span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'nowrap',
            overflowX: 'auto'
          }}>
            <button
              onClick={onInfoClick}
              style={{
                padding: isMobile ? '0.4rem 0.7rem' : '0.45rem 0.8rem',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '8px',
                color: '#3b82f6',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
                minHeight: '32px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'
              }}
            >
              <Info size={isMobile ? 12 : 14} />
              Info
            </button>
            
            <button
              onClick={onAlternativesClick}
              style={{
                padding: isMobile ? '0.4rem 0.7rem' : '0.45rem 0.8rem',
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.15)',
                borderRadius: '8px',
                color: '#fbbf24',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
                minHeight: '32px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.08)'
              }}
            >
              <RefreshCw size={isMobile ? 12 : 14} />
              Wissel
            </button>
            
            <button
              onClick={onLogClick}
              style={{
                padding: isMobile ? '0.4rem 0.6rem' : '0.45rem 0.7rem',
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '8px',
                color: '#f97316',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
                minHeight: '32px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'
              }}
            >
              <Play size={isMobile ? 12 : 14} />
              Log
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
