// src/modules/progress/WorkoutHistory.jsx - COMPACT WORKOUT STYLING
import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Calendar, Search, Filter, ChevronDown, ChevronUp, 
  Dumbbell, Clock, Hash, Weight, X, ChevronLeft
} from 'lucide-react'

export default function WorkoutHistory({ db, clientId, onBack }) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState('last7')
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
  
  useEffect(() => {
    loadExerciseList()
  }, [clientId])
  
  useEffect(() => {
    setWorkouts([])
    setOffset(0)
    setHasMore(true)
    loadWorkouts(true)
  }, [clientId, filter, selectedDate, selectedExercise])
  
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
      
      if (filter === 'exercise' && selectedExercise) {
        filteredData = filteredData.filter(session => 
          session.workout_progress?.some(p => p.exercise_name === selectedExercise)
        )
        
        filteredData = filteredData.map(session => ({
          ...session,
          workout_progress: session.workout_progress.filter(p => 
            p.exercise_name === selectedExercise
          )
        }))
      }
      
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
  const workoutsByDate = workouts.reduce((acc, workout) => {
    const date = workout.workout_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(workout)
    return acc
  }, {})
  
  // Calculate stats
  const totalWorkouts = workouts.length
  const totalExercises = workouts.reduce((sum, w) => sum + (w.workout_progress?.length || 0), 0)
  const totalVolume = workouts.reduce((sum, w) => {
    return sum + (w.workout_progress?.reduce((s, p) => s + calculateVolume(p.sets), 0) || 0)
  }, 0)
  
  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: isMobile ? '40px' : '48px',
          height: isMobile ? '40px' : '48px',
          border: '3px solid rgba(249, 115, 22, 0.2)',
          borderTopColor: '#f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }
  
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
      borderRadius: isMobile ? '16px' : '20px',
      border: '1px solid rgba(249, 115, 22, 0.25)',
      backdropFilter: 'blur(12px)',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(249, 115, 22, 0.15)'
    }}>
      {/* Top accent glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
        opacity: 0.6,
        zIndex: 10
      }} />
      
      {/* HEADER - COMPACT */}
      <div style={{
        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
        borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(23, 23, 23, 0.6) 100%)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '0.75rem' : '0.875rem'
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.06) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: isMobile ? '8px' : '10px',
              color: '#f97316',
              fontSize: isMobile ? '0.775rem' : '0.825rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              backdropFilter: 'blur(8px)'
            }}
          >
            <ChevronLeft size={isMobile ? 14 : 16} />
            Terug
          </button>
          
          <h3 style={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            fontWeight: '800',
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Trainingsgeschiedenis
          </h3>
        </div>
        
        {/* FILTERS - COMPACT GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: filter === 'exercise' 
            ? (isMobile ? '1fr' : '200px 1fr') 
            : '1fr',
          gap: isMobile ? '0.5rem' : '0.625rem'
        }}>
          {/* Filter Type Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowFilterDropdown(!showFilterDropdown)
                setShowExerciseDropdown(false)
              }}
              style={{
                width: '100%',
                padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.06) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: isMobile ? '8px' : '10px',
                color: '#fff',
                fontSize: isMobile ? '0.775rem' : '0.825rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Filter size={isMobile ? 13 : 14} color="#f97316" />
                <span>
                  {filter === 'last7' && 'Laatste 7 dagen'}
                  {filter === 'date' && 'Specifieke datum'}
                  {filter === 'exercise' && 'Per oefening'}
                </span>
              </div>
              <ChevronDown 
                size={isMobile ? 13 : 14}
                color="#f97316"
                style={{ 
                  transform: showFilterDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }} 
              />
            </button>
            
            {showFilterDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.4rem',
                background: 'rgba(23, 23, 23, 0.98)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: isMobile ? '8px' : '10px',
                backdropFilter: 'blur(20px)',
                zIndex: 30,
                overflow: 'hidden',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)'
              }}>
                {['last7', 'date', 'exercise'].map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f)
                      setShowFilterDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.75rem' : '0.875rem 1rem',
                      background: filter === f ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                      border: 'none',
                      color: filter === f ? '#f97316' : 'rgba(255,255,255,0.7)',
                      fontSize: isMobile ? '0.775rem' : '0.825rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {f === 'last7' && 'Laatste 7 dagen'}
                    {f === 'date' && 'Specifieke datum'}
                    {f === 'exercise' && 'Per oefening'}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Exercise Selector (if filter = exercise) */}
          {filter === 'exercise' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowExerciseDropdown(!showExerciseDropdown)
                  setShowFilterDropdown(false)
                }}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.06) 100%)',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                  borderRadius: isMobile ? '8px' : '10px',
                  color: selectedExercise ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontSize: isMobile ? '0.775rem' : '0.825rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Dumbbell size={isMobile ? 13 : 14} color="#f97316" />
                  <span>{selectedExercise || 'Selecteer oefening'}</span>
                </div>
                <ChevronDown 
                  size={isMobile ? 13 : 14}
                  color="#f97316"
                  style={{ 
                    transform: showExerciseDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} 
                />
              </button>
              
              {showExerciseDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.4rem',
                  background: 'rgba(23, 23, 23, 0.98)',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                  borderRadius: isMobile ? '8px' : '10px',
                  backdropFilter: 'blur(20px)',
                  zIndex: 30,
                  maxHeight: isMobile ? '60vh' : '300px',
                  overflow: 'hidden',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)'
                }}>
                  {/* Search */}
                  <div style={{
                    padding: isMobile ? '0.625rem' : '0.75rem',
                    borderBottom: '1px solid rgba(249, 115, 22, 0.1)'
                  }}>
                    <div style={{ position: 'relative' }}>
                      <Search 
                        size={isMobile ? 12 : 13} 
                        style={{
                          position: 'absolute',
                          left: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'rgba(249, 115, 22, 0.5)'
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
                          padding: isMobile ? '0.5rem 0.625rem 0.5rem 2rem' : '0.5rem 0.75rem 0.5rem 2.25rem',
                          background: 'rgba(249, 115, 22, 0.06)',
                          border: '1px solid rgba(249, 115, 22, 0.15)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: isMobile ? '16px' : '0.8rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{
                    maxHeight: isMobile ? 'calc(60vh - 70px)' : '200px',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch'
                  }}>
                    {filteredExercises.map(ex => (
                      <button
                        key={ex}
                        onClick={() => {
                          setSelectedExercise(ex)
                          setShowExerciseDropdown(false)
                          setSearchQuery('')
                        }}
                        style={{
                          width: '100%',
                          padding: isMobile ? '0.75rem' : '0.875rem 1rem',
                          background: selectedExercise === ex ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                          border: 'none',
                          color: selectedExercise === ex ? '#f97316' : 'rgba(255,255,255,0.7)',
                          fontSize: isMobile ? '0.775rem' : '0.825rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          minHeight: '44px',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        {ex}
                      </button>
                    ))}
                    
                    {filteredExercises.length === 0 && (
                      <div style={{
                        padding: '1.5rem 1rem',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: isMobile ? '0.75rem' : '0.8rem'
                      }}>
                        Geen oefeningen gevonden
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Date Picker (if filter = date) */}
          {filter === 'date' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.06) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: isMobile ? '8px' : '10px',
                color: '#fff',
                fontSize: isMobile ? '0.775rem' : '0.825rem',
                fontWeight: '600',
                backdropFilter: 'blur(8px)',
                outline: 'none',
                minHeight: '44px'
              }}
            />
          )}
        </div>
      </div>
      
      {/* STATS - COMPACT */}
      {workouts.length > 0 && (
        <div style={{
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
          background: 'rgba(249, 115, 22, 0.04)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? '0.5rem' : '0.625rem'
          }}>
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)',
              borderRadius: isMobile ? '8px' : '10px',
              padding: isMobile ? '0.5rem' : '0.625rem',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              backdropFilter: 'blur(8px)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.15rem',
                fontWeight: '800',
                color: '#f97316',
                marginBottom: '0.125rem'
              }}>
                {totalWorkouts}
              </div>
              <div style={{
                fontSize: isMobile ? '0.625rem' : '0.675rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                fontWeight: '600'
              }}>
                Workouts
              </div>
            </div>
            
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)',
              borderRadius: isMobile ? '8px' : '10px',
              padding: isMobile ? '0.5rem' : '0.625rem',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              backdropFilter: 'blur(8px)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.15rem',
                fontWeight: '800',
                color: '#10b981',
                marginBottom: '0.125rem'
              }}>
                {totalExercises}
              </div>
              <div style={{
                fontSize: isMobile ? '0.625rem' : '0.675rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                fontWeight: '600'
              }}>
                Oefeningen
              </div>
            </div>
            
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)',
              borderRadius: isMobile ? '8px' : '10px',
              padding: isMobile ? '0.5rem' : '0.625rem',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              backdropFilter: 'blur(8px)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.15rem',
                fontWeight: '800',
                color: '#3b82f6',
                marginBottom: '0.125rem'
              }}>
                {Math.round(totalVolume / 1000)}k
              </div>
              <div style={{
                fontSize: isMobile ? '0.625rem' : '0.675rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                fontWeight: '600'
              }}>
                Volume
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* WORKOUT LIST */}
      <div style={{
        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
        maxHeight: '60vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {workouts.length > 0 ? (
          <>
            {Object.entries(workoutsByDate).map(([date, sessions]) => (
              <div
                key={date}
                style={{
                  background: 'rgba(23, 23, 23, 0.4)',
                  borderRadius: isMobile ? '10px' : '12px',
                  border: '1px solid rgba(249, 115, 22, 0.15)',
                  marginBottom: isMobile ? '0.625rem' : '0.75rem',
                  overflow: 'hidden',
                  backdropFilter: 'blur(8px)'
                }}
              >
                {/* Day Header */}
                <button
                  onClick={() => toggleDay(date)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '0.875rem 1rem',
                    background: expandedDays[date] 
                      ? 'rgba(249, 115, 22, 0.08)' 
                      : 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: isMobile ? '0.85rem' : '0.95rem',
                      fontWeight: '700',
                      color: '#f97316',
                      marginBottom: '0.125rem',
                      textAlign: 'left'
                    }}>
                      {formatDate(date)}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textAlign: 'left'
                    }}>
                      {sessions.reduce((total, s) => 
                        total + (s.workout_progress?.length || 0), 0
                      )} oefeningen
                    </div>
                  </div>
                  
                  {expandedDays[date] ? (
                    <ChevronUp size={isMobile ? 14 : 16} color="rgba(249, 115, 22, 0.7)" />
                  ) : (
                    <ChevronDown size={isMobile ? 14 : 16} color="rgba(249, 115, 22, 0.7)" />
                  )}
                </button>
                
                {/* Expanded Content */}
                {expandedDays[date] && (
                  <div style={{
                    padding: isMobile ? '0 0.75rem 0.75rem' : '0 1rem 1rem',
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
                              borderRadius: isMobile ? '8px' : '10px',
                              padding: isMobile ? '0.625rem' : '0.75rem',
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
                                fontSize: isMobile ? '0.8rem' : '0.875rem',
                                fontWeight: '700',
                                color: '#f97316'
                              }}>
                                {progress.exercise_name}
                              </div>
                              {progress.created_at && (
                                <div style={{
                                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                                  color: 'rgba(255, 255, 255, 0.4)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <Clock size={10} style={{ opacity: 0.5 }} />
                                  {formatTime(progress.created_at)}
                                </div>
                              )}
                            </div>
                            
                            {/* Sets Display - COMPACT */}
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
                                      gap: '0.4rem',
                                      fontSize: isMobile ? '0.725rem' : '0.775rem',
                                      color: 'rgba(255, 255, 255, 0.7)'
                                    }}
                                  >
                                    <span style={{
                                      background: 'rgba(249, 115, 22, 0.12)',
                                      borderRadius: '4px',
                                      padding: '0.125rem 0.375rem',
                                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                                      color: '#f97316',
                                      fontWeight: '700',
                                      minWidth: '24px',
                                      textAlign: 'center'
                                    }}>
                                      {setIdx + 1}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                      <Weight size={11} style={{ opacity: 0.5 }} />
                                      {set.weight || 0}kg
                                    </span>
                                    <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>×</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                      <Hash size={11} style={{ opacity: 0.5 }} />
                                      {set.reps || 0}
                                    </span>
                                    {set.completed && (
                                      <span style={{
                                        color: '#10b981',
                                        fontSize: isMobile ? '0.65rem' : '0.7rem',
                                        marginLeft: 'auto'
                                      }}>
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                ))}
                                
                                {/* Volume Total - COMPACT */}
                                <div style={{
                                  marginTop: '0.25rem',
                                  paddingTop: '0.25rem',
                                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  display: 'flex',
                                  justifyContent: 'space-between'
                                }}>
                                  <span>Volume:</span>
                                  <span style={{ color: '#3b82f6', fontWeight: '700' }}>
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
                                fontSize: isMobile ? '0.7rem' : '0.75rem',
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontStyle: 'italic',
                                lineHeight: '1.4'
                              }}>
                                💭 {progress.notes}
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
                  padding: isMobile ? '1.5rem' : '2rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                {loadingMore && (
                  <div style={{
                    width: isMobile ? '24px' : '28px',
                    height: isMobile ? '24px' : '28px',
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
            padding: isMobile ? '2.5rem 1rem' : '3rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: isMobile ? '44px' : '52px',
              height: isMobile ? '44px' : '52px',
              margin: '0 auto',
              borderRadius: '50%',
              background: 'rgba(249, 115, 22, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Dumbbell size={isMobile ? 24 : 28} color="rgba(249, 115, 22, 0.5)" />
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Geen trainingsgeschiedenis gevonden
            </p>
            <p style={{
              color: 'rgba(255, 255, 255, 0.35)',
              fontSize: isMobile ? '0.7rem' : '0.775rem'
            }}>
              Log trainingen om je geschiedenis te zien
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
