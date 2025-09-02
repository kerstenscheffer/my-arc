import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Calendar, Search, Filter, ChevronDown, ChevronUp, 
  Dumbbell, Clock, Hash, Weight, X, ChevronLeft
} from 'lucide-react'

export default function WorkoutHistory({ db, clientId, onBack }) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState('last7') // last7, date, exercise
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [exercises, setExercises] = useState([])
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
  const [expandedDays, setExpandedDays] = useState({})
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  
  const isMobile = window.innerWidth <= 768
  const ITEMS_PER_PAGE = 20
  const observerTarget = useRef(null)
  
  // Load exercises for filter
  useEffect(() => {
    loadExerciseList()
  }, [clientId])
  
  // Load workouts when filter changes
  useEffect(() => {
    setWorkouts([])
    setOffset(0)
    setHasMore(true)
    loadWorkouts(true)
  }, [clientId, filter, selectedDate, selectedExercise])
  
  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadWorkouts(false)
        }
      },
      { threshold: 0.1 }
    )
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }
    
    return () => observer.disconnect()
  }, [hasMore, loadingMore, offset])
  
  const loadExerciseList = async () => {
    try {
      // Get unique exercises from recent workouts
      const { data: sessions, error: sessionsError } = await db.supabase
        .from('workout_sessions')
        .select('id')
        .eq('client_id', clientId)
        .order('workout_date', { ascending: false })
        .limit(100)
      
      if (sessionsError) throw sessionsError
      
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id)
        
        const { data: progress, error: progressError } = await db.supabase
          .from('workout_progress')
          .select('exercise_name')
          .in('session_id', sessionIds)
        
        if (progressError) throw progressError
        
        // Get unique exercises
        const uniqueExercises = [...new Set(progress?.map(p => p.exercise_name) || [])]
        setExercises(uniqueExercises.sort())
      }
    } catch (error) {
      console.error('Failed to load exercises:', error)
    }
  }
  
  const loadWorkouts = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      let query = db.supabase
        .from('workout_sessions')
        .select(`
          id,
          workout_date,
          completed_at,
          day_name,
          day_display_name,
          is_completed,
          workout_progress (
            id,
            exercise_name,
            sets,
            notes,
            created_at
          )
        `)
        .eq('client_id', clientId)
        .order('workout_date', { ascending: false })
        .range(isInitial ? 0 : offset, isInitial ? ITEMS_PER_PAGE - 1 : offset + ITEMS_PER_PAGE - 1)
      
      // Apply filters
      if (filter === 'last7') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('workout_date', weekAgo.toISOString().split('T')[0])
      } else if (filter === 'date') {
        query = query.eq('workout_date', selectedDate)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      let filteredData = data || []
      
      // Filter by exercise if selected
      if (filter === 'exercise' && selectedExercise) {
        filteredData = filteredData.filter(session => 
          session.workout_progress?.some(p => p.exercise_name === selectedExercise)
        )
        
        // Keep only the selected exercise in progress
        filteredData = filteredData.map(session => ({
          ...session,
          workout_progress: session.workout_progress.filter(p => 
            p.exercise_name === selectedExercise
          )
        }))
      }
      
      // Remove empty sessions
      filteredData = filteredData.filter(session => 
        session.workout_progress && session.workout_progress.length > 0
      )
      
      if (isInitial) {
        setWorkouts(filteredData)
      } else {
        setWorkouts(prev => [...prev, ...filteredData])
      }
      
      setHasMore(filteredData.length === ITEMS_PER_PAGE)
      setOffset(prev => prev + ITEMS_PER_PAGE)
      
    } catch (error) {
      console.error('Failed to load workouts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }
  
  const toggleDay = (date) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }))
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Vandaag'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Gisteren'
    } else {
      return date.toLocaleDateString('nl-NL', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      })
    }
  }
  
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const calculateVolume = (sets) => {
    if (!sets || !Array.isArray(sets)) return 0
    return sets.reduce((total, set) => {
      const weight = parseFloat(set.weight) || 0
      const reps = parseInt(set.reps) || 0
      return total + (weight * reps)
    }, 0)
  }
  
  const filteredExercises = exercises.filter(ex => 
    ex.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Group workouts by date
  const groupedWorkouts = workouts.reduce((groups, session) => {
    const date = session.workout_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(session)
    return groups
  }, {})
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
      borderRadius: isMobile ? '16px' : '20px',
      border: '1px solid rgba(249, 115, 22, 0.15)',
      overflow: 'hidden',
      minHeight: isMobile ? '500px' : '600px'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
        borderBottom: '1px solid rgba(249, 115, 22, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <ChevronLeft size={18} color="#f97316" />
              </button>
            )}
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Clock size={isMobile ? 18 : 22} color="#f97316" />
              Trainingsgeschiedenis
            </h3>
          </div>
          
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '600'
          }}>
            {workouts.length} trainingen
          </div>
        </div>
        
        {/* Filter Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              width: '100%',
              padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '10px',
              color: '#f97316',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} />
              <span>
                {filter === 'last7' ? 'Laatste 7 Dagen' : 
                 filter === 'date' ? `Datum: ${formatDate(selectedDate)}` :
                 filter === 'exercise' ? `Oefening: ${selectedExercise || 'Selecteer'}` : 'Filter'}
              </span>
            </div>
            <ChevronDown 
              size={16} 
              style={{ 
                transform: showFilterDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
          </button>
          
          {/* Filter Dropdown */}
          {showFilterDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.5rem',
              background: 'rgba(15, 23, 42, 0.98)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              zIndex: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              padding: '0.5rem'
            }}>
              <button
                onClick={() => {
                  setFilter('last7')
                  setShowFilterDropdown(false)
                }}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.625rem 0.75rem',
                  background: filter === 'last7' ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: filter === 'last7' ? '#f97316' : 'rgba(255, 255, 255, 0.8)',
                  fontSize: isMobile ? '0.9rem' : '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  minHeight: '44px'
                }}
              >
                Laatste 7 Dagen
              </button>
              
              <button
                onClick={() => {
                  setFilter('date')
                  setShowFilterDropdown(false)
                }}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.625rem 0.75rem',
                  background: filter === 'date' ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: filter === 'date' ? '#f97316' : 'rgba(255, 255, 255, 0.8)',
                  fontSize: isMobile ? '0.9rem' : '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  minHeight: '44px'
                }}
              >
                Selecteer Datum
              </button>
              
              <button
                onClick={() => {
                  setFilter('exercise')
                  setShowFilterDropdown(false)
                  setShowExerciseDropdown(true)
                }}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.625rem 0.75rem',
                  background: filter === 'exercise' ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: filter === 'exercise' ? '#f97316' : 'rgba(255, 255, 255, 0.8)',
                  fontSize: isMobile ? '0.9rem' : '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  minHeight: '44px'
                }}
              >
                Filter op Oefening
              </button>
            </div>
          )}
        </div>
        
        {/* Date Picker (when date filter is selected) */}
        {filter === 'date' && (
          <div style={{ marginTop: '0.75rem' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '16px' : '0.9rem', // 16px prevents zoom on iOS
                outline: 'none'
              }}
            />
          </div>
        )}
        
        {/* Exercise Selector (when exercise filter is selected) */}
        {filter === 'exercise' && (
          <div style={{ marginTop: '0.75rem', position: 'relative' }}>
            <button
              onClick={() => setShowExerciseDropdown(!showExerciseDropdown)}
              style={{
                width: '100%',
                padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: selectedExercise ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Dumbbell size={16} />
                <span>{selectedExercise || 'Selecteer Oefening'}</span>
              </div>
              <ChevronDown 
                size={16} 
                style={{ 
                  transform: showExerciseDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </button>
            
            {/* Exercise Dropdown */}
            {showExerciseDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                background: 'rgba(15, 23, 42, 0.98)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '12px',
                backdropFilter: 'blur(20px)',
                zIndex: 30,
                maxHeight: isMobile ? '50vh' : '300px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                {/* Search */}
                <div style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid rgba(249, 115, 22, 0.1)'
                }}>
                  <div style={{ position: 'relative' }}>
                    <Search 
                      size={14} 
                      style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(148, 163, 184, 0.5)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Zoek oefening..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem 0.5rem 2rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '16px', // Prevents zoom on iOS
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
                
                {/* Exercise List */}
                <div style={{
                  maxHeight: isMobile ? 'calc(50vh - 80px)' : '200px',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch'
                }}>
                  {filteredExercises.map(exercise => (
                    <button
                      key={exercise}
                      onClick={() => {
                        setSelectedExercise(exercise)
                        setShowExerciseDropdown(false)
                        setSearchQuery('')
                      }}
                      style={{
                        width: '100%',
                        padding: isMobile ? '0.875rem 1rem' : '0.75rem 1rem',
                        background: selectedExercise === exercise 
                          ? 'rgba(249, 115, 22, 0.2)' 
                          : 'transparent',
                        border: 'none',
                        color: selectedExercise === exercise ? '#f97316' : 'rgba(255,255,255,0.8)',
                        fontSize: isMobile ? '0.9rem' : '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      {exercise}
                    </button>
                  ))}
                  
                  {filteredExercises.length === 0 && (
                    <div style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.85rem'
                    }}>
                      Geen oefeningen gevonden
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Workout List */}
      <div style={{
        maxHeight: isMobile ? '400px' : '500px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(249, 115, 22, 0.2)',
              borderTopColor: '#f97316',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : Object.keys(groupedWorkouts).length > 0 ? (
          <>
            {Object.entries(groupedWorkouts).map(([date, sessions]) => (
              <div key={date} style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {/* Date Header */}
                <button
                  onClick={() => toggleDay(date)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                    background: expandedDays[date] 
                      ? 'rgba(249, 115, 22, 0.05)' 
                      : 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <Calendar size={isMobile ? 16 : 18} color="#f97316" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '0.125rem'
                      }}>
                        {formatDate(date)}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}>
                        {sessions.reduce((total, s) => 
                          total + (s.workout_progress?.length || 0), 0
                        )} oefeningen gelogd
                      </div>
                    </div>
                  </div>
                  
                  {expandedDays[date] ? (
                    <ChevronUp size={16} color="rgba(255, 255, 255, 0.5)" />
                  ) : (
                    <ChevronDown size={16} color="rgba(255, 255, 255, 0.5)" />
                  )}
                </button>
                
                {/* Expanded Content */}
                {expandedDays[date] && (
                  <div style={{
                    padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem',
                    animation: 'slideDown 0.2s ease'
                  }}>
                    {sessions.map(session => (
                      <div key={session.id}>
                        {session.workout_progress?.map((progress, idx) => (
                          <div
                            key={progress.id}
                            style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '10px',
                              padding: isMobile ? '0.75rem' : '1rem',
                              marginBottom: idx < session.workout_progress.length - 1 ? '0.5rem' : 0
                            }}
                          >
                            {/* Exercise Name & Time */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '0.5rem'
                            }}>
                              <div style={{
                                fontSize: isMobile ? '0.9rem' : '0.95rem',
                                fontWeight: '600',
                                color: '#f97316'
                              }}>
                                {progress.exercise_name}
                              </div>
                              {progress.created_at && (
                                <div style={{
                                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                                  color: 'rgba(255, 255, 255, 0.4)'
                                }}>
                                  {formatTime(progress.created_at)}
                                </div>
                              )}
                            </div>
                            
                            {/* Sets Display */}
                            {progress.sets && Array.isArray(progress.sets) && (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                              }}>
                                {progress.sets.map((set, setIdx) => (
                                  <div
                                    key={setIdx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                                      color: 'rgba(255, 255, 255, 0.7)'
                                    }}
                                  >
                                    <span style={{
                                      background: 'rgba(249, 115, 22, 0.1)',
                                      borderRadius: '4px',
                                      padding: '0.125rem 0.375rem',
                                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                                      color: '#f97316',
                                      fontWeight: '600',
                                      minWidth: '28px',
                                      textAlign: 'center'
                                    }}>
                                      {setIdx + 1}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <Weight size={12} style={{ opacity: 0.5 }} />
                                      {set.weight || 0}kg
                                    </span>
                                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>×</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <Hash size={12} style={{ opacity: 0.5 }} />
                                      {set.reps || 0} reps
                                    </span>
                                    {set.completed && (
                                      <span style={{
                                        color: '#10b981',
                                        fontSize: isMobile ? '0.7rem' : '0.75rem'
                                      }}>
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                ))}
                                
                                {/* Volume Total */}
                                <div style={{
                                  marginTop: '0.25rem',
                                  paddingTop: '0.25rem',
                                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  display: 'flex',
                                  justifyContent: 'space-between'
                                }}>
                                  <span>Totaal Volume:</span>
                                  <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                                    {calculateVolume(progress.sets)}kg
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Notes */}
                            {progress.notes && (
                              <div style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '6px',
                                fontSize: isMobile ? '0.75rem' : '0.8rem',
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontStyle: 'italic'
                              }}>
                                {progress.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Load More Indicator */}
            {hasMore && (
              <div 
                ref={observerTarget}
                style={{
                  padding: '2rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                {loadingMore && (
                  <div style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid rgba(249, 115, 22, 0.2)',
                    borderTopColor: '#f97316',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: '3rem',
            textAlign: 'center'
          }}>
            <Dumbbell size={48} color="rgba(249, 115, 22, 0.2)" />
            <p style={{
              marginTop: '1rem',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: isMobile ? '0.85rem' : '0.95rem'
            }}>
              Geen trainingsgeschiedenis gevonden
            </p>
            <p style={{
              marginTop: '0.5rem',
              color: 'rgba(255, 255, 255, 0.3)',
              fontSize: isMobile ? '0.75rem' : '0.85rem'
            }}>
              Start met het loggen van trainingen om je geschiedenis te zien
            </p>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
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
      `}</style>
    </div>
  )
}
