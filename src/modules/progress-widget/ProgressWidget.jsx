// src/modules/progress-widget/ProgressWidget.jsx
import React, { useState, useEffect } from 'react'
import { Activity, TrendingUp, ChevronRight, Target, Clock, X, Plus, Dumbbell } from 'lucide-react'

const THEME = {
  primary: '#f97316',
  gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)',
  success: '#10b981'
}

export default function ProgressWidget({ client, schema, weekSchedule, db }) {
  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [quickStats, setQuickStats] = useState({
    exercisesLogged: 0,
    totalExercises: 0,
    lastExercise: null
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [todaysLogs, setTodaysLogs] = useState([])
  const [allExercises, setAllExercises] = useState([])
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('')
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
  
  // Quick log state
  const [selectedExercise, setSelectedExercise] = useState('')
  const [customExercise, setCustomExercise] = useState('')
  const [sets, setSets] = useState([{ weight: 20, reps: 10, completed: false }])
  const [saving, setSaving] = useState(false)

  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (client?.id && schema && weekSchedule) {
      loadTodaysData()
      loadAllExercises()
    }
  }, [client, schema, weekSchedule])

  // Filter exercises for search dropdown
  const getFilteredExercises = () => {
    if (!exerciseSearchTerm) {
      // Show today's workout exercises first, then all exercises
      const todayExercises = todaysWorkout?.exercises?.map(ex => 
        ex.name || ex.exercise_name || ex
      ) || []
      
      const otherExercises = allExercises.filter(ex => 
        !todayExercises.includes(ex)
      )
      
      return [...todayExercises, ...otherExercises].slice(0, 8)
    }
    
    return allExercises
      .filter(ex => ex.toLowerCase().includes(exerciseSearchTerm.toLowerCase()))
      .slice(0, 8)
  }

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise)
    setExerciseSearchTerm(exercise)
    setCustomExercise('')
    setShowExerciseDropdown(false)
  }

  const loadAllExercises = async () => {
    try {
      // Get unique exercise names from workout_progress table
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
    try {
      setLoading(true)
      
      // Get current day name
      const today = new Date()
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const currentDay = dayNames[today.getDay()]
      
      // Multiple date formats to handle timezone issues
      const todayStr = today.toISOString().split('T')[0]
      const todayLocal = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0]
      
      console.log('🔍 Loading ALL today\'s workout data:', { todayStr, todayLocal, currentDay, clientId: client.id })
      
      // Find today's workout from schedule
      const todayWorkoutKey = weekSchedule[currentDay]
      
      if (todayWorkoutKey && schema.week_structure && schema.week_structure[todayWorkoutKey]) {
        const workout = schema.week_structure[todayWorkoutKey]
        setTodaysWorkout({
          key: todayWorkoutKey,
          ...workout
        })
        
        // Set first exercise as default
        if (workout.exercises && workout.exercises.length > 0) {
          const firstExercise = workout.exercises[0]
          setSelectedExercise(firstExercise.name || firstExercise.exercise_name || firstExercise)
        }
        
        // NEW APPROACH: GET ALL SESSIONS FROM TODAY
        let allSessionsData = []
        
        // Step 1: Get all sessions by user_id for today
        console.log('🔍 Step 1: Getting ALL sessions via user_id for date:', todayStr)
        const { data: userSessions, error: userError } = await db.supabase
          .from('workout_sessions')
          .select('id, workout_date, user_id, client_id, created_at')
          .eq('user_id', client.id)
          .eq('workout_date', todayStr)
          .order('created_at', { ascending: false })
        
        if (!userError && userSessions && userSessions.length > 0) {
          allSessionsData.push(...userSessions)
          console.log(`✅ Step 1 SUCCESS: Found ${userSessions.length} sessions with user_id`)
        } else {
          console.log('⚠️ Step 1: No sessions found with user_id approach')
        }
        
        // Step 2: Get additional sessions by client_id (for sessions with user_id = null)
        console.log('🔍 Step 2: Getting additional sessions via client_id')
        const { data: clientSessions, error: clientError } = await db.supabase
          .from('workout_sessions')
          .select('id, workout_date, user_id, client_id, created_at')
          .eq('client_id', client.id)
          .eq('workout_date', todayStr)
          .is('user_id', null)
          .order('created_at', { ascending: false })
        
        if (!clientError && clientSessions && clientSessions.length > 0) {
          allSessionsData.push(...clientSessions)
          console.log(`✅ Step 2 SUCCESS: Found ${clientSessions.length} additional sessions with client_id`)
        } else {
          console.log('⚠️ Step 2: No additional sessions found with client_id approach')
        }
        
        // Step 3: Remove duplicates and prepare session IDs
        const uniqueSessions = allSessionsData.filter((session, index, self) => 
          index === self.findIndex(s => s.id === session.id)
        )
        
        console.log(`📊 Step 3: Total unique sessions found: ${uniqueSessions.length}`)
        console.log('📋 Session IDs:', uniqueSessions.map(s => s.id))
        
        if (uniqueSessions.length > 0) {
          // Step 4: Get ALL progress for ALL sessions from today
          const sessionIds = uniqueSessions.map(s => s.id)
          
          console.log('🔍 Step 4: Getting progress for ALL session IDs:', sessionIds)
          
          const { data: allTodayProgress, error: progressError } = await db.supabase
            .from('workout_progress')
            .select('*')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })
          
          console.log(`📊 Step 4 RESULT: Found ${allTodayProgress?.length || 0} total progress entries`)
          
          if (!progressError && allTodayProgress && allTodayProgress.length > 0) {
            // Step 5: Calculate comprehensive stats
            const uniqueExercises = [...new Set(allTodayProgress.map(p => p.exercise_name))]
            const mostRecentExercise = allTodayProgress[0]
            
            setQuickStats({
              exercisesLogged: uniqueExercises.length,
              totalExercises: workout.exercises?.length || 0,
              lastExercise: mostRecentExercise
            })
            
            // Step 6: Display ALL today's logs
            setTodaysLogs(allTodayProgress)
            
            console.log(`🎉 FINAL SUCCESS: Loaded ${allTodayProgress.length} progress entries from ${uniqueSessions.length} sessions`)
            console.log(`📊 Unique exercises today: [${uniqueExercises.join(', ')}]`)
            console.log(`⏰ Most recent: ${mostRecentExercise?.exercise_name} at ${new Date(mostRecentExercise?.created_at).toLocaleTimeString()}`)
            
          } else {
            console.warn('❌ Step 4 ERROR: Failed to load progress:', progressError)
            setQuickStats({
              exercisesLogged: 0,
              totalExercises: workout.exercises?.length || 0,
              lastExercise: null
            })
            setTodaysLogs([])
          }
        } else {
          console.log('ℹ️ No workout sessions found for today - resetting stats')
          setQuickStats({
            exercisesLogged: 0,
            totalExercises: workout.exercises?.length || 0,
            lastExercise: null
          })
          setTodaysLogs([])
        }
      } else {
        setTodaysWorkout(null)
        setQuickStats({
          exercisesLogged: 0,
          totalExercises: 0,
          lastExercise: null
        })
        setTodaysLogs([])
        console.log('ℹ️ No workout scheduled for', currentDay)
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR loading today\'s data:', error)
      setQuickStats({
        exercisesLogged: 0,
        totalExercises: 0,
        lastExercise: null
      })
      setTodaysLogs([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setShowModal(true)
    // Prevent background scroll
    document.body.style.overflow = 'hidden'
  }

  const handleCloseModal = () => {
    setShowModal(false)
    document.body.style.overflow = 'unset'
    // Reset form
    setSets([{ weight: 20, reps: 10, completed: false }])
    setCustomExercise('')
    setExerciseSearchTerm('')
    setShowExerciseDropdown(false)
    setSaving(false)
  }

  const addSet = () => {
    setSets([...sets, { weight: sets[sets.length - 1]?.weight || 20, reps: 10, completed: false }])
  }

  const updateSet = (index, field, value) => {
    const newSets = [...sets]
    newSets[index][field] = value
    setSets(newSets)
  }

  const completeSet = (index) => {
    const newSets = [...sets]
    newSets[index].completed = !newSets[index].completed
    setSets(newSets)
  }

  const saveQuickLog = async () => {
    const exerciseName = customExercise || selectedExercise
    
    if (!exerciseName) {
      alert('Selecteer een oefening')
      return
    }
    
    const completedSets = sets.filter(s => s.completed)
    if (completedSets.length === 0) {
      alert('Voltooi minimaal 1 set')
      return
    }
    
    setSaving(true)
    try {
      // Step 1: Get or create today's workout session
      const today = new Date().toISOString().split('T')[0]
      
      // Check for existing session today
      let { data: sessions, error: sessionError } = await db.supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', client.id)
        .eq('workout_date', today)
        .maybeSingle()
      
      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError
      }
      
      let sessionId
      if (sessions) {
        sessionId = sessions.id
      } else {
        // Create new session
        const { data: newSession, error: createError } = await db.supabase
          .from('workout_sessions')
          .insert({
            user_id: client.id, // For RLS policy: auth.uid() = user_id
            client_id: client.id,
            workout_date: today,
            day_name: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            day_display_name: new Date().toLocaleDateString('nl-NL', { weekday: 'long' }),
            workout_id: todaysWorkout?.key || 'quick_log',
            is_completed: false,
            exercises_completed: [],
            completion_percentage: 0
          })
          .select('id')
          .single()
        
        if (createError) throw createError
        sessionId = newSession.id
      }
      
      // Step 2: Save workout progress with session_id and get the created record
      const { data: newProgress, error: progressError } = await db.supabase
        .from('workout_progress')
        .insert({
          session_id: sessionId,
          exercise_name: exerciseName,
          sets: completedSets.map(s => ({
            weight: parseFloat(s.weight),
            reps: parseInt(s.reps),
            completed: true
          })),
          notes: 'Quick log from Progress Widget'
        })
        .select('*')
        .single()
      
      if (progressError) throw progressError
      
      // Step 3: Immediately add the new log to today's logs (optimistic update)
      setTodaysLogs(prevLogs => [newProgress, ...prevLogs])
      
      // Step 4: Update quick stats
      const uniqueExercises = [...new Set([...todaysLogs.map(log => log.exercise_name), exerciseName])]
      setQuickStats(prev => ({
        ...prev,
        exercisesLogged: uniqueExercises.length,
        lastExercise: newProgress
      }))
      
      // Step 5: Update exercise list if it's a new exercise
      if (!allExercises.includes(exerciseName)) {
        setAllExercises(prev => [exerciseName, ...prev].sort())
      }
      
      // Close modal and reset
      handleCloseModal()
      
      // Show success feedback
      const successToast = document.createElement('div')
      successToast.innerHTML = `✅ ${exerciseName} gelogd!`
      successToast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%);
        color: white; padding: 12px 24px; border-radius: 12px; z-index: 10000;
        font-weight: 600; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        animation: slideDown 0.4s ease;
      `
      document.body.appendChild(successToast)
      setTimeout(() => successToast.remove(), 3000)
      
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
    } catch (error) {
      console.error('Save error:', error)
      alert('Fout bij opslaan: ' + error.message)
      
      // Reload data as fallback if optimistic update failed
      await loadTodaysData()
      await loadAllExercises()
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(249, 115, 22, 0.1)',
        backdropFilter: 'blur(10px)',
        height: isMobile ? '80px' : '90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid rgba(249, 115, 22, 0.15)',
          borderTopColor: 'rgba(249, 115, 22, 0.6)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  // No workout today state
  if (!todaysWorkout) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.08) 0%, rgba(51, 65, 85, 0.04) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onClick={handleOpenModal}
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.4) 0%, rgba(100, 116, 139, 0.6) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={isMobile ? 16 : 18} color="rgba(255, 255, 255, 0.8)" />
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              marginBottom: '0.25rem'
            }}>
              Rustdag Vandaag
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'rgba(148, 163, 184, 0.8)',
              fontWeight: '600',
              fontSize: isMobile ? '0.75rem' : '0.8rem'
            }}>
              <span>Log vrije training</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Workout Log Indicator - only show when no exercises logged today */}
      {todaysLogs.length === 0 && (
        <div style={{
          position: 'relative',
          marginBottom: '0.5rem',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          animation: 'pulseGlow 2s infinite'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%)',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 8px 25px rgba(249, 115, 22, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle shimmer effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.1), transparent)',
              animation: 'shimmer 3s infinite'
            }} />
            
            <span style={{
              color: 'rgba(249, 115, 22, 0.9)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              zIndex: 1
            }}>
              Klik hier om je workout te loggen
            </span>
            
            {/* Animated arrow */}
            <div style={{
              color: 'rgba(249, 115, 22, 0.8)',
              fontSize: '1.2rem',
              animation: 'bounce 1.5s infinite',
              zIndex: 1
            }}>
              ↓
            </div>
          </div>
        </div>
      )}

      {/* Main Widget */}
      <div style={{
        background: quickStats.exercisesLogged > 0
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.08) 50%, rgba(194, 65, 12, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: quickStats.exercisesLogged > 0
          ? '1px solid rgba(249, 115, 22, 0.2)'
          : '1px solid rgba(249, 115, 22, 0.08)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: quickStats.exercisesLogged > 0
          ? '0 10px 25px rgba(249, 115, 22, 0.15)'
          : '0 8px 20px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onClick={handleOpenModal}
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{
            color: 'rgba(148, 163, 184, 0.8)',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {quickStats.exercisesLogged > 0 ? 'IN PROGRESS' : 'READY TO START'}
          </div>

          {/* Progress indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            {Array.from({ length: Math.max(5, quickStats.totalExercises) }, (_, i) => (
              <div
                key={i}
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: i < quickStats.exercisesLogged
                    ? 'rgba(249, 115, 22, 0.8)'
                    : 'rgba(148, 163, 184, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {/* Icon */}
          <div style={{
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            borderRadius: '12px',
            background: quickStats.exercisesLogged > 0
              ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(71, 85, 105, 0.4) 0%, rgba(51, 65, 85, 0.6) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            flexShrink: 0
          }}>
            <Activity size={isMobile ? 18 : 20} color="#fff" />
            {quickStats.exercisesLogged > 0 && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                background: 'rgba(16, 185, 129, 0.9)',
                borderRadius: '50%',
                border: '2px solid rgba(15, 23, 42, 0.9)'
              }} />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginBottom: isMobile ? '0.35rem' : '0.5rem'
            }}>
              <Target size={isMobile ? 14 : 15} color="rgba(148, 163, 184, 0.8)" />
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.95)',
                margin: 0,
                lineHeight: 1,
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {todaysWorkout.name}
              </h3>
            </div>

            {quickStats.exercisesLogged > 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.5rem' : '0.75rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'rgba(148, 163, 184, 0.9)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem'
                }}>
                  <TrendingUp size={12} />
                  <span>
                    {quickStats.exercisesLogged}/{quickStats.totalExercises} gelogd
                  </span>
                </div>

                {quickStats.lastExercise && (
                  <span style={{
                    padding: isMobile ? '0.1rem 0.35rem' : '0.15rem 0.5rem',
                    background: 'rgba(249, 115, 22, 0.15)',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    color: 'rgba(251, 191, 36, 0.95)',
                    fontWeight: '600',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {quickStats.lastExercise.exercise_name}
                  </span>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'rgba(251, 191, 36, 0.9)',
                fontWeight: '600',
                fontSize: isMobile ? '0.8rem' : '0.85rem'
              }}>
                <span>Klik om te beginnen</span>
                <ChevronRight size={12} style={{ 
                  animation: quickStats.exercisesLogged === 0 ? 'slideRight 1s infinite' : 'none' 
                }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(20px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.3s ease'
        }}
        onClick={handleCloseModal}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
              borderRadius: '24px',
              padding: isMobile ? '1.5rem' : '2rem',
              maxWidth: isMobile ? '95vw' : '600px',
              width: '100%',
              maxHeight: isMobile ? '90vh' : '80vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(249, 115, 22, 0.15), 0 0 0 1px rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              position: 'relative',
              animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Orange accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: THEME.gradient,
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 0 20px rgba(249, 115, 22, 0.4)'
            }} />
            
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              paddingTop: '0.5rem'
            }}>
              <div>
                <h2 style={{
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  background: THEME.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '800',
                  margin: 0,
                  marginBottom: '0.5rem'
                }}>
                  Quick Log
                </h2>
                <p style={{
                  color: 'rgba(148, 163, 184, 0.8)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  margin: 0
                }}>
                  {todaysWorkout?.name || 'Vrije Training'}
                </p>
              </div>
              
              <button
                onClick={handleCloseModal}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)'
                  e.target.style.color = '#ef4444'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.target.style.color = 'rgba(255, 255, 255, 0.6)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Exercise Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: 'rgba(148, 163, 184, 0.8)',
                fontSize: '0.8rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem'
              }}>
                Oefening
              </label>
              
              <div style={{ position: 'relative' }}>
                {/* Search input */}
                <input
                  type="text"
                  placeholder="Zoek oefening of voer nieuwe in..."
                  value={exerciseSearchTerm}
                  onChange={(e) => {
                    setExerciseSearchTerm(e.target.value)
                    setShowExerciseDropdown(true)
                    if (!e.target.value) {
                      setSelectedExercise('')
                      setCustomExercise('')
                    }
                  }}
                  onFocus={() => setShowExerciseDropdown(true)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                />
                
                {/* Dropdown */}
                {showExerciseDropdown && exerciseSearchTerm.length >= 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '12px',
                    marginTop: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10,
                    backdropFilter: 'blur(10px)'
                  }}>
                    {getFilteredExercises().map((exercise, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleExerciseSelect(exercise)}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          borderBottom: idx < getFilteredExercises().length - 1 ? '1px solid rgba(249, 115, 22, 0.1)' : 'none',
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(249, 115, 22, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent'
                        }}
                      >
                        {exercise}
                      </div>
                    ))}
                    
                    {/* Add new exercise option */}
                    {exerciseSearchTerm && !getFilteredExercises().includes(exerciseSearchTerm) && (
                      <div
                        onClick={() => {
                          setCustomExercise(exerciseSearchTerm)
                          setSelectedExercise('')
                          setShowExerciseDropdown(false)
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          color: 'rgba(249, 115, 22, 0.8)',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          borderTop: '1px solid rgba(249, 115, 22, 0.2)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(249, 115, 22, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent'
                        }}
                      >
                        + Nieuwe oefening: "{exerciseSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sets */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <label style={{
                  color: 'rgba(148, 163, 184, 0.8)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Sets
                </label>
                
                <button
                  onClick={addSet}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '10px',
                    color: THEME.primary,
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Plus size={16} />
                  Add Set
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sets.map((set, index) => (
                  <SetInputRow
                    key={index}
                    setNumber={index + 1}
                    weight={set.weight}
                    reps={set.reps}
                    completed={set.completed}
                    onWeightChange={(value) => updateSet(index, 'weight', value)}
                    onRepsChange={(value) => updateSet(index, 'reps', value)}
                    onComplete={() => completeSet(index)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveQuickLog}
              disabled={saving || (!customExercise && !selectedExercise && !exerciseSearchTerm)}
              style={{
                width: '100%',
                padding: '1.25rem',
                background: saving || (!customExercise && !selectedExercise && !exerciseSearchTerm)
                  ? 'rgba(107, 114, 128, 0.3)'
                  : THEME.gradient,
                border: 'none',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: saving || (!customExercise && !selectedExercise && !exerciseSearchTerm) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s ease',
                boxShadow: saving || (!customExercise && !selectedExercise && !exerciseSearchTerm)
                  ? 'none'
                  : '0 10px 30px rgba(249, 115, 22, 0.3)',
                transform: saving ? 'scale(0.98)' : 'scale(1)'
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Saving...
                </>
              ) : (
                <>
                  <Dumbbell size={20} />
                  Save Workout
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Today's Logged Exercises */}
      {todaysLogs.length > 0 && (
        <div style={{
          marginTop: '1rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
          borderRadius: '16px',
          padding: isMobile ? '1rem' : '1.25rem',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h4 style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(249, 115, 22, 0.9)',
              fontWeight: '700',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Vandaag Gelogd
            </h4>
            <div style={{
              color: 'rgba(148, 163, 184, 0.6)',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '600'
            }}>
              {todaysLogs.length} exercise{todaysLogs.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {todaysLogs.map((log, idx) => (
              <div
                key={log.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '12px',
                  padding: isMobile ? '0.75rem' : '1rem',
                  border: '1px solid rgba(249, 115, 22, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <h5 style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {log.exercise_name}
                  </h5>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(148, 163, 184, 0.6)',
                    fontWeight: '500'
                  }}>
                    {new Date(log.created_at).toLocaleTimeString('nl-NL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                
                {/* Sets display */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {(Array.isArray(log.sets) ? log.sets : JSON.parse(log.sets || '[]')).map((set, setIdx) => (
                    <div
                      key={setIdx}
                      style={{
                        background: 'rgba(249, 115, 22, 0.1)',
                        border: '1px solid rgba(249, 115, 22, 0.2)',
                        borderRadius: '8px',
                        padding: '0.25rem 0.5rem',
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        color: 'rgba(251, 191, 36, 0.9)',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <span>{set.weight}kg</span>
                      <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>×</span>
                      <span>{set.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(30px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        @keyframes pulseGlow {
          0%, 100% { 
            transform: scale(1);
            filter: brightness(1);
          }
          50% { 
            transform: scale(1.02);
            filter: brightness(1.1);
          }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
          60% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  )
}

// Set Input Component (premium styled)
function SetInputRow({
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
      padding: '1rem',
      backgroundColor: completed ? 'rgba(16,185,129,0.1)' : 'rgba(15, 23, 42, 0.6)',
      borderRadius: '16px',
      border: completed 
        ? `2px solid ${THEME.success}` 
        : '1px solid rgba(249, 115, 22, 0.1)',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Set Number */}
      <div style={{
        width: isMobile ? '36px' : '40px',
        height: isMobile ? '36px' : '40px',
        borderRadius: '12px',
        background: completed ? THEME.success : THEME.gradient,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: isMobile ? '0.9rem' : '1rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
      }}>
        {setNumber}
      </div>

      {/* Weight Input */}
      <div style={{ flex: 1 }}>
        <div style={{
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: '0.65rem',
          marginBottom: '0.25rem',
          textTransform: 'uppercase',
          fontWeight: '600'
        }}>
          kg
        </div>
        <input
          type="number"
          value={weight}
          onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
          disabled={completed}
          style={{
            width: '100%',
            padding: '0.5rem',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: '600',
            opacity: completed ? 0.6 : 1
          }}
        />
      </div>

      {/* Reps Input */}
      <div style={{ flex: 1 }}>
        <div style={{
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: '0.65rem',
          marginBottom: '0.25rem',
          textTransform: 'uppercase',
          fontWeight: '600'
        }}>
          reps
        </div>
        <input
          type="number"
          value={reps}
          onChange={(e) => onRepsChange(parseInt(e.target.value) || 1)}
          disabled={completed}
          style={{
            width: '100%',
            padding: '0.5rem',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: '600',
            opacity: completed ? 0.6 : 1
          }}
        />
      </div>

      {/* Complete Button */}
      <button
        onClick={onComplete}
        style={{
          width: isMobile ? '44px' : '48px',
          height: isMobile ? '44px' : '48px',
          borderRadius: '12px',
          background: completed ? THEME.success : THEME.gradient,
          border: 'none',
          color: 'white',
          fontSize: '1.25rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          transform: completed ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        {completed ? '✓' : '○'}
      </button>
    </div>
  )
}
