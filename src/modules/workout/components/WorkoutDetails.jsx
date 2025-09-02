// COMPLETE WORKOUT DETAILS MET DATABASE INTEGRATIE
import { useState, useRef, useEffect } from 'react'
import { 
  X, Play, BookOpen, RefreshCw, Video, Clock, Target, 
  Flame, Activity, Info, ChevronLeft, Award, Zap, 
  TrendingUp, Dumbbell, Timer, CheckCircle, PauseCircle,
  History, Calendar
} from 'lucide-react'
import QuickLogModal from '../../progress/workout/components/QuickLogModal'

export default function WorkoutDetails({
  workout,
  workoutKey,
  onClose,
  onComplete,
  onShowAlternatives,
  client,
  db,
  weekSchedule,
  weekDays
}) {
  const [showWorkoutLog, setShowWorkoutLog] = useState(false)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [workoutCompleted, setWorkoutCompleted] = useState(false)
  const [todaysLogs, setTodaysLogs] = useState([])
  const [quickStats, setQuickStats] = useState(null)
  const [showTodaysLogs, setShowTodaysLogs] = useState(false)
  const modalRef = useRef(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  
  const isMobile = window.innerWidth <= 768
  
  // Load today's logged workouts FROM workout_progress table
  useEffect(() => {
    loadTodaysLogs()
  }, [])
  
  const loadTodaysLogs = async () => {
    if (!db || !client?.id) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Check eerst of we directe workout_progress kunnen ophalen via DatabaseService
      if (db.getWorkoutProgressByDate) {
        const logs = await db.getWorkoutProgressByDate(client.id, today)
        setTodaysLogs(logs || [])
        console.log('📊 Loaded workout logs via DatabaseService:', logs?.length || 0)
        return
      }
      
      // Fallback: Probeer verschillende column namen omdat table structuur onduidelijk is
      let progressData = null
      let error = null
      
      // Optie 1: Probeer met user_id (mogelijk de juiste column)
      try {
        const result = await db.supabase
          .from('workout_progress')
          .select('*')
          .eq('user_id', client.id)
          .eq('workout_date', today)
          .order('created_at', { ascending: false })
        
        if (!result.error) {
          progressData = result.data
        } else {
          error = result.error
        }
      } catch (e) {
        console.log('user_id + workout_date failed, trying other columns...')
      }
      
      // Optie 2: Als dat niet werkt, probeer met session_id uit workout_sessions
      if (!progressData) {
        try {
          // Haal eerst session op
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
            
            progressData = data
          }
        } catch (e) {
          console.log('session_id approach failed:', e)
        }
      }
      
      if (error && !progressData) {
        console.error('Error loading workout progress:', error)
        return
      }
      
      // Format the logs for display
      const logs = progressData?.map(p => ({
        id: p.id,
        exercise_name: p.exercise_name,
        exercise: p.exercise_name,
        sets: p.sets || [],
        sets_completed: Array.isArray(p.sets) ? p.sets.length : 0,
        total_weight: Array.isArray(p.sets) 
          ? p.sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0)
          : 0,
        created_at: p.created_at,
        timestamp: p.created_at
      })) || []
      
      setTodaysLogs(logs)
      console.log('📊 Loaded today\'s workout logs:', logs.length)
      
      // Update quick stats
      const totalSets = logs.reduce((sum, log) => sum + log.sets_completed, 0)
      setQuickStats({ totalSets })
      
    } catch (error) {
      console.error('Error loading today\'s logs:', error)
    }
  }
  
  // Format workout data for QuickLogModal
  const formattedWorkout = workout ? {
    id: workout.id || `workout-${Date.now()}`,
    name: workout.name || 'Workout',
    date: new Date().toISOString().split('T')[0],
    exercises: workout.exercises?.map((ex, idx) => ({
      id: ex.id || `exercise-${idx}`,
      name: ex.name || ex.exercise_name || ex.exercise || `Exercise ${idx + 1}`,
      sets: parseInt(ex.sets) || 3,
      reps: ex.reps || ex.rep_range || '10',
      rest: parseInt(ex.rust || ex.rest) || 90,
      notes: ex.notes || '',
      primairSpieren: ex.primairSpieren || ex.muscle_group || 'chest',
      equipment: ex.equipment || 'dumbbell',
      rpe: ex.rpe || 8,
      targetWeight: ex.targetWeight || null
    })) || []
  } : null
  
  // Touch handlers for swipe to close
  const handleTouchStart = (e) => {
    if (!isMobile) return
    startY.current = e.touches[0].clientY
  }
  
  const handleTouchMove = (e) => {
    if (!isMobile || !modalRef.current) return
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      setSwipeDistance(deltaY)
      modalRef.current.style.transform = `translateY(${deltaY}px)`
      modalRef.current.style.opacity = 1 - (deltaY / 400)
    }
  }
  
  const handleTouchEnd = () => {
    if (!isMobile || !modalRef.current) return
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 150) {
      onClose()
    } else {
      setSwipeDistance(0)
      modalRef.current.style.transform = 'translateY(0)'
      modalRef.current.style.opacity = 1
    }
  }
  
  // Start workout handler
  const handleStartWorkout = () => {
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
      console.error('No exercises found in workout')
      alert('Geen oefeningen gevonden in deze workout')
      return
    }
    
    console.log('📱 Opening QuickLogModal with full data:', {
      workout: formattedWorkout,
      client: client?.id,
      db: !!db,
      todaysLogs: todaysLogs.length
    })
    
    setShowWorkoutLog(true)
  }
  
  // Handle data reload after log save
  const handleDataReload = async () => {
    console.log('🔄 Reloading data after save...')
    await loadTodaysLogs()
  }
  
  // Format time for display
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  return (
    <>
      <div 
        ref={modalRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease',
          transition: 'transform 0.3s ease, opacity 0.3s ease'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Premium Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
          borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Swipe Handle (mobile only) */}
          {isMobile && (
            <div style={{
              padding: '0.5rem 0 0',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '4px',
                background: 'rgba(249, 115, 22, 0.3)',
                borderRadius: '2px',
                cursor: 'grab'
              }} />
            </div>
          )}
          
          {/* Navigation + Workout Info */}
          <div style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0
              }}
            >
              <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
            </button>
            
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.01em',
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {workout?.name || 'Workout'}
            </h2>
            
            {/* Today's logs indicator */}
            {todaysLogs.length > 0 && (
              <div 
                onClick={() => setShowTodaysLogs(!showTodaysLogs)}
                style={{
                  padding: '0.3rem 0.6rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: '#fff',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  animation: 'pulse 2s ease infinite'
                }}
              >
                <History size={12} />
                {todaysLogs.length} Logs
              </div>
            )}
            
            <div style={{
              padding: '0.3rem 0.6rem',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              borderRadius: '8px',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: '#fff',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              flexShrink: 0
            }}>
              <Flame size={12} />
              {workout?.exercises?.length || 0}
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <X size={16} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
          
          {/* Stats Pills + Action Buttons */}
          <div style={{
            padding: isMobile ? '0 1rem 0.75rem' : '0 1.5rem 1rem',
          }}>
            {/* Stats Pills */}
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              marginBottom: isMobile ? '0.75rem' : '1rem',
              flexWrap: 'wrap'
            }}>
              {workout?.focus && (
                <div style={{
                  padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.6rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Target size={11} />
                  {workout.focus}
                </div>
              )}
              
              <div style={{
                padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.6rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Clock size={11} />
                ~45m
              </div>
              
              {quickStats && (
                <div style={{
                  padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.6rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '6px',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Award size={11} />
                  {quickStats.totalSets} sets vandaag
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '0.6rem' : '0.75rem'
            }}>
              <button 
                onClick={handleStartWorkout}
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 8px 20px rgba(249, 115, 22, 0.25)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: isMobile ? '40px' : '44px'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <Play size={16} />
                Log Workout
              </button>
              
              {!isMobile && (
                <button 
                  onClick={() => setShowTodaysLogs(!showTodaysLogs)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    minHeight: '44px'
                  }}
                >
                  <Calendar size={16} />
                  Today's History
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content - Scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem',
          paddingBottom: isMobile ? '2rem' : '3rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Today's Logs Section - Show when toggled */}
          {showTodaysLogs && todaysLogs.length > 0 && (
            <div style={{
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              padding: isMobile ? '1rem' : '1.25rem',
              animation: 'slideDown 0.3s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <History size={18} color="#10b981" />
                <h3 style={{
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '700',
                  color: '#10b981',
                  margin: 0
                }}>
                  Vandaag's Logs ({todaysLogs.length})
                </h3>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {todaysLogs.map((log, idx) => (
                  <div key={idx} style={{
                    padding: isMobile ? '0.625rem' : '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px'
                  }}>
                    {/* Exercise name and time */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          background: '#10b981',
                          borderRadius: '50%',
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                        }} />
                        <div>
                          <div style={{
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            color: '#fff',
                            fontWeight: '600'
                          }}>
                            {log.exercise_name || log.exercise}
                          </div>
                          <div style={{
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            color: 'rgba(255,255,255,0.5)'
                          }}>
                            {formatTime(log.created_at || log.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sets details */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      marginLeft: '1.25rem'
                    }}>
                      {log.sets && Array.isArray(log.sets) ? (
                        log.sets.map((set, setIdx) => (
                          <div key={setIdx} style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '6px',
                            fontSize: isMobile ? '0.75rem' : '0.8rem',
                            color: '#10b981',
                            fontWeight: '600'
                          }}>
                            {set.weight}kg × {set.reps}
                          </div>
                        ))
                      ) : (
                        <span style={{
                          fontSize: isMobile ? '0.75rem' : '0.8rem',
                          color: 'rgba(16, 185, 129, 0.8)',
                          fontWeight: '600'
                        }}>
                          {log.sets_completed || 0} sets
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Exercises List */}
          {workout?.exercises && workout.exercises.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              {workout.exercises.map((exercise, index) => (
                <ExerciseCard 
                  key={index}
                  exercise={exercise}
                  index={index}
                  onShowAlternatives={onShowAlternatives}
                  isMobile={isMobile}
                  isCompleted={todaysLogs.some(log => 
                    log.exercise_name === exercise.name || 
                    log.exercise === exercise.name
                  )}
                  todaysLogs={todaysLogs}
                />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <Activity size={48} color="rgba(249, 115, 22, 0.2)" style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>
                Nog geen oefeningen geconfigureerd
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* QuickLogModal - Pass workout as todaysWorkout + callbacks */}
      {showWorkoutLog && formattedWorkout && (
        <QuickLogModal
          db={db}
          client={client}
          todaysWorkout={formattedWorkout}
          setTodaysLogs={setTodaysLogs}
          setQuickStats={setQuickStats}
          todaysLogs={todaysLogs}
          onClose={() => {
            setShowWorkoutLog(false)
            handleDataReload()
          }}
          onDataReload={handleDataReload}
          isMobile={isMobile}
        />
      )}
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        /* Custom scrollbar */
        *::-webkit-scrollbar {
          width: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.2);
          border-radius: 3px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.3);
        }
      `}</style>
    </>
  )
}

// Enhanced Exercise Card Component with Today's Logs
function ExerciseCard({ exercise, index, onShowAlternatives, isMobile, isCompleted, todaysLogs }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Filter logs for this specific exercise
  const exerciseLogs = todaysLogs?.filter(log => 
    log.exercise_name === exercise.name || 
    log.exercise === exercise.name
  ) || []
  
  const getEquipmentIcon = (equipment) => {
    switch(equipment?.toLowerCase()) {
      case 'barbell': return <Activity size={14} />
      case 'dumbbell': return <Dumbbell size={14} />
      case 'cable': return <Zap size={14} />
      case 'machine': return <TrendingUp size={14} />
      default: return <Dumbbell size={14} />
    }
  }
  
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  return (
    <div 
      style={{
        background: isCompleted 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
        borderRadius: '16px',
        border: isCompleted 
          ? '1px solid rgba(16, 185, 129, 0.2)' 
          : '1px solid rgba(249, 115, 22, 0.08)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = isCompleted 
            ? '0 10px 30px rgba(16, 185, 129, 0.15)'
            : '0 10px 30px rgba(249, 115, 22, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* Exercise Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        background: isCompleted 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)'
          : 'linear-gradient(135deg, rgba(249, 115, 22, 0.06) 0%, rgba(234, 88, 12, 0.03) 100%)',
        borderBottom: isExpanded 
          ? isCompleted 
            ? '1px solid rgba(16, 185, 129, 0.1)' 
            : '1px solid rgba(249, 115, 22, 0.08)' 
          : 'none'
      }}>
        {/* Exercise Number */}
        <div style={{
          width: isMobile ? '36px' : '42px',
          height: isMobile ? '36px' : '42px',
          background: isCompleted 
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '800',
          color: '#fff',
          fontSize: isMobile ? '1rem' : '1.1rem',
          flexShrink: 0,
          boxShadow: isCompleted 
            ? '0 4px 15px rgba(16, 185, 129, 0.3)'
            : '0 4px 15px rgba(249, 115, 22, 0.3)'
        }}>
          {isCompleted ? <CheckCircle size={18} /> : index + 1}
        </div>
        
        {/* Exercise Info */}
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            color: '#fff',
            margin: '0 0 0.25rem 0',
            fontWeight: '700',
            letterSpacing: '-0.01em'
          }}>
            {exercise.name}
          </h4>
          
          {/* Quick Stats */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Target size={12} color="#f97316" />
              {exercise.sets} sets
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Activity size={12} color="#3b82f6" />
              {exercise.reps} reps
            </span>
            {exercise.rust && (
              <span style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Clock size={12} color="#10b981" />
                {exercise.rust}
              </span>
            )}
            {exerciseLogs.length > 0 && (
              <span style={{
                fontSize: '0.7rem',
                color: '#10b981',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '0.2rem 0.4rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <CheckCircle size={10} />
                {exerciseLogs.length}x gedaan
              </span>
            )}
          </div>
        </div>
        
        {/* Expand Indicator */}
        <div style={{
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
          transition: 'transform 0.3s ease'
        }}>
          <ChevronLeft size={20} color="rgba(255,255,255,0.3)" />
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          animation: 'slideDown 0.3s ease'
        }}>
          {/* Today's Logs for this exercise */}
          {exerciseLogs.length > 0 && (
            <div style={{
              marginBottom: '1rem',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.1)',
              padding: isMobile ? '0.75rem' : '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <History size={14} color="#10b981" />
                <span style={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '700',
                  color: '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Vandaag's Logs
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {exerciseLogs.map((log, logIdx) => (
                  <div key={logIdx} style={{
                    padding: isMobile ? '0.5rem' : '0.625rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px'
                  }}>
                    {/* Time and session info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          background: '#10b981',
                          borderRadius: '50%',
                          boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                        }} />
                        <span style={{
                          fontSize: isMobile ? '0.75rem' : '0.8rem',
                          color: 'rgba(255,255,255,0.5)'
                        }}>
                          {formatTime(log.created_at || log.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Sets details */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      {log.sets && Array.isArray(log.sets) ? (
                        log.sets.map((set, setIdx) => (
                          <div key={setIdx} style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '6px',
                            fontSize: isMobile ? '0.8rem' : '0.85rem',
                            color: '#10b981',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                              #{setIdx + 1}
                            </span>
                            {set.weight}kg × {set.reps}
                          </div>
                        ))
                      ) : (
                        <span style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: 'rgba(255,255,255,0.7)'
                        }}>
                          {log.sets_completed || 0} sets voltooid
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Detailed Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <StatCard 
              label="Sets" 
              value={exercise.sets} 
              icon={Target} 
              color={isCompleted ? '#10b981' : '#f97316'}
              isMobile={isMobile}
            />
            <StatCard 
              label="Reps" 
              value={exercise.reps} 
              icon={Activity} 
              color="#3b82f6"
              isMobile={isMobile}
            />
            <StatCard 
              label="Rust" 
              value={exercise.rust || '90s'} 
              icon={Clock} 
              color="#10b981"
              isMobile={isMobile}
            />
            <StatCard 
              label="RPE" 
              value={exercise.rpe || '8'} 
              icon={Flame} 
              color="#8b5cf6"
              isMobile={isMobile}
            />
          </div>
          
          {/* Notes */}
          {exercise.notes && (
            <div style={{
              background: isCompleted 
                ? 'rgba(16, 185, 129, 0.05)' 
                : 'rgba(249, 115, 22, 0.05)',
              border: isCompleted 
                ? '1px solid rgba(16, 185, 129, 0.1)' 
                : '1px solid rgba(249, 115, 22, 0.1)',
              borderRadius: '12px',
              padding: isMobile ? '0.875rem' : '1rem',
              marginBottom: '1rem',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <Info size={16} color={isCompleted ? '#10b981' : '#f97316'} style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
                lineHeight: 1.5
              }}>
                {exercise.notes}
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '0.75rem'
          }}>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onShowAlternatives(exercise, exercise.primairSpieren || 'chest')
              }}
              style={{
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255,255,255,0.03)',
                border: isCompleted 
                  ? '1px solid rgba(16, 185, 129, 0.15)' 
                  : '1px solid rgba(249, 115, 22, 0.15)',
                borderRadius: '10px',
                color: isCompleted ? '#10b981' : '#f97316',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '40px'
              }}
            >
              <RefreshCw size={15} />
              Alternatieven
            </button>
            
            {!isMobile && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  alert(`Video voor ${exercise.name} komt binnenkort!`)
                }}
                style={{
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  minHeight: '40px'
                }}
              >
                <Video size={15} />
                Techniek Video
              </button>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color, isMobile }) {
  return (
    <div style={{
      background: 'rgba(17, 17, 17, 0.6)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: isMobile ? '0.875rem' : '1rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Icon 
        size={32} 
        color={color} 
        style={{
          position: 'absolute',
          bottom: '-8px',
          right: '-8px',
          opacity: 0.08
        }}
      />
      <div style={{
        fontSize: isMobile ? '1.5rem' : '1.75rem',
        fontWeight: '800',
        color: color,
        lineHeight: 1,
        marginBottom: '0.25rem',
        textShadow: `0 0 20px ${color}40`
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.65rem',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: '600'
      }}>
        {label}
      </div>
    </div>
  )
}
