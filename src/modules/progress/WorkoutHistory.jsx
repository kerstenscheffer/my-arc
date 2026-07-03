// src/modules/progress/WorkoutHistory.jsx
// V4: 30 dagen default, alles gold, zoek oefening, partials+dropsets+notes
import { useState, useEffect, useRef } from 'react'
import {
  Search, Filter, ChevronDown, ChevronUp,
  Dumbbell, Clock,
} from 'lucide-react'

export default function WorkoutHistory({ db, clientId, onBack }) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState('last7') // Default 7 days
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
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, offset])
  
  const loadExerciseList = async () => {
    try {
      const { data: sessions } = await db.supabase
        .from('workout_sessions')
        .select('id')
        .eq('client_id', clientId)
        .order('workout_date', { ascending: false })
        .limit(100)
      
      if (sessions?.length > 0) {
        const sessionIds = sessions.map(s => s.id)
        const { data: progress } = await db.supabase
          .from('workout_progress')
          .select('exercise_name')
          .in('session_id', sessionIds)
        
        const uniqueExercises = [...new Set(progress?.map(p => p.exercise_name) || [])]
        setExercises(uniqueExercises.sort())
      }
    } catch (error) {
      console.error('Failed to load exercises:', error)
    }
  }
  
  const loadWorkouts = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      else setLoadingMore(true)
      
      let query = db.supabase
        .from('workout_sessions')
        .select(`
          id, workout_date, completed_at, day_name, day_display_name, is_completed, notes,
          workout_progress ( id, exercise_name, sets, notes, created_at )
        `)
        .eq('client_id', clientId)
        .order('workout_date', { ascending: false })
        .range(isInitial ? 0 : offset, isInitial ? ITEMS_PER_PAGE - 1 : offset + ITEMS_PER_PAGE - 1)
      
      // Filter by date range
      if (filter === 'last7') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('workout_date', weekAgo.toISOString().split('T')[0])
      } else if (filter === 'last30') {
        const monthAgo = new Date()
        monthAgo.setDate(monthAgo.getDate() - 30)
        query = query.gte('workout_date', monthAgo.toISOString().split('T')[0])
      } else if (filter === 'date') {
        query = query.eq('workout_date', selectedDate)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      let filteredData = data || []
      
      if (filter === 'exercise' && selectedExercise) {
        filteredData = filteredData
          .filter(s => s.workout_progress?.some(p => p.exercise_name === selectedExercise))
          .map(s => ({
            ...s,
            workout_progress: s.workout_progress.filter(p => p.exercise_name === selectedExercise)
          }))
      }
      
      filteredData = filteredData.filter(s => s.workout_progress?.length > 0)
      
      if (isInitial) setWorkouts(filteredData)
      else setWorkouts(prev => [...prev, ...filteredData])
      
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
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) return 'Vandaag'
    if (date.toDateString() === yesterday.toDateString()) return 'Gisteren'
    return date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  }
  
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  }
  
  const calculateVolume = (sets) => {
    if (!sets || !Array.isArray(sets)) return 0
    return sets.reduce((total, set) => {
      let volume = (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)
      // Include dropset volume
      if (set.dropsets && Array.isArray(set.dropsets)) {
        set.dropsets.forEach(ds => {
          volume += (parseFloat(ds.weight) || 0) * (parseInt(ds.reps) || 0)
        })
      }
      return total + volume
    }, 0)
  }
  
  // Format a single set with partials and dropsets
  const formatSet = (set, setIdx) => {
    const weight = set.weight || 0
    const reps = set.reps || 0
    const partials = set.partials || 0
    const dropsets = set.dropsets || []
    
    let parts = []
    
    // Main set
    parts.push(
      <span key="main" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ color: '#FFD700', fontWeight: '700', fontSize: isMobile ? '0.6rem' : '0.65rem' }}>
          {setIdx + 1}
        </span>
        <span>{weight}kg</span>
        <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>×</span>
        <span>{reps}</span>
      </span>
    )
    
    // Partials
    if (partials > 0) {
      parts.push(
        <span key="partials" style={{ color: '#a855f7', fontWeight: '600' }}>
          +{partials}p
        </span>
      )
    }
    
    // Dropsets
    if (dropsets.length > 0) {
      dropsets.forEach((ds, dsIdx) => {
        parts.push(
          <span key={`ds-${dsIdx}`} style={{ color: '#f59e0b', fontWeight: '600' }}>
            ↓{ds.weight}×{ds.reps}
          </span>
        )
      })
    }
    
    return parts
  }
  
  const filteredExercises = exercises.filter(ex => 
    ex.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const workoutsByDate = workouts.reduce((acc, workout) => {
    const date = workout.workout_date
    if (!acc[date]) acc[date] = []
    acc[date].push(workout)
    return acc
  }, {})
  
  const totalWorkouts = workouts.length
  const totalExercises = workouts.reduce((sum, w) => sum + (w.workout_progress?.length || 0), 0)
  const totalVolume = workouts.reduce((sum, w) => {
    return sum + (w.workout_progress?.reduce((s, p) => s + calculateVolume(p.sets), 0) || 0)
  }, 0)
  
  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '3rem 1rem' : '4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(255, 215, 0, 0.2)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }
  
  return (
    <div style={{ padding: isMobile ? '0.5rem 0.85rem 0.85rem' : '0.65rem 1.05rem 1rem' }}>
      {/* Filter-pill — interne header weggehaald, dropdown-bar erbuiten heeft
          al de titel "GESCHIEDENIS". */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        paddingBottom: isMobile ? '0.6rem' : '0.7rem',
      }}>
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          aria-expanded={showFilterDropdown}
          style={{
            background: 'rgba(255,215,0,0.06)',
            border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: 999,
            padding: isMobile ? '0.4rem 0.75rem' : '0.45rem 0.875rem',
            color: '#FFD700',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Filter size={isMobile ? 12 : 13} strokeWidth={2.4} />
          {filter === 'last7' && '7 dagen'}
          {filter === 'last30' && '30 dagen'}
          {filter === 'date' && 'Datum'}
          {filter === 'exercise' && 'Oefening'}
          <ChevronDown
            size={12}
            strokeWidth={2.4}
            style={{
              transform: showFilterDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>
      
      {/* Filter Dropdown */}
      {showFilterDropdown && (
        <div style={{
          padding: isMobile ? '0.75rem 0' : '1rem 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { key: 'last7', label: 'Laatste 7 dagen' },
              { key: 'last30', label: 'Laatste 30 dagen' },
              { key: 'date', label: 'Specifieke datum' },
              { key: 'exercise', label: 'Zoek oefening' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  background: filter === f.key ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                  border: filter === f.key 
                    ? '1px solid rgba(255, 215, 0, 0.25)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: isMobile ? '0.4rem 0.65rem' : '0.45rem 0.75rem',
                  color: filter === f.key ? '#FFD700' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          {/* Exercise Selector */}
          {filter === 'exercise' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowExerciseDropdown(!showExerciseDropdown)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
                  color: selectedExercise ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Dumbbell size={13} color="#FFD700" />
                  {selectedExercise || 'Zoek oefening'}
                </span>
                <ChevronDown size={14} color="rgba(255, 255, 255, 0.3)" />
              </button>
              
              {showExerciseDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.35rem',
                  background: 'rgba(15, 15, 15, 0.98)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  zIndex: 30,
                  maxHeight: '250px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
                }}>
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={12} style={{
                        position: 'absolute',
                        left: '0.625rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255, 255, 255, 0.3)'
                      }} />
                      <input
                        type="text"
                        placeholder="Zoek oefening..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.5rem 0.4rem 1.75rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: isMobile ? '16px' : '0.75rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{
                    maxHeight: '180px',
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
                          padding: isMobile ? '0.625rem 0.75rem' : '0.5rem 0.75rem',
                          background: selectedExercise === ex ? 'rgba(255, 215, 0, 0.08)' : 'transparent',
                          border: 'none',
                          color: selectedExercise === ex ? '#FFD700' : 'rgba(255, 255, 255, 0.6)',
                          fontSize: isMobile ? '0.75rem' : '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'left',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {filter === 'date' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: '600',
                outline: 'none'
              }}
            />
          )}
        </div>
      )}
      
      {/* STATS - All GOLD */}
      {workouts.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '0.75rem 0' : '1rem 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <StatItem label="Workouts" value={totalWorkouts} isMobile={isMobile} />
          <StatDivider />
          <StatItem label="Oefeningen" value={totalExercises} isMobile={isMobile} />
          <StatDivider />
          <StatItem label="Volume" value={`${Math.round(totalVolume / 1000)}k`} isMobile={isMobile} />
        </div>
      )}
      
      {/* WORKOUT LIST */}
      <div style={{ paddingTop: isMobile ? '0.5rem' : '0.75rem' }}>
        {workouts.length > 0 ? (
          <>
            {Object.entries(workoutsByDate).map(([date, sessions]) => (
              <div key={date}>
                {/* Day Header */}
                <div
                  onClick={() => toggleDay(date)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '0.75rem 0' : '0.875rem 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: isMobile ? '0.85rem' : '0.95rem',
                      fontWeight: '700',
                      color: '#FFD700',
                      letterSpacing: '-0.01em'
                    }}>
                      {formatDate(date)}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.6rem' : '0.65rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontWeight: '600',
                      marginTop: '0.15rem'
                    }}>
                      {sessions.reduce((t, s) => t + (s.workout_progress?.length || 0), 0)} oefeningen
                    </div>
                  </div>
                  
                  {expandedDays[date] ? (
                    <ChevronUp size={16} color="rgba(255, 255, 255, 0.25)" />
                  ) : (
                    <ChevronDown size={16} color="rgba(255, 255, 255, 0.25)" />
                  )}
                </div>
                
                {/* Expanded Exercises */}
                <div style={{
                  maxHeight: expandedDays[date] ? '2000px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: expandedDays[date] ? 1 : 0
                }}>
                  {sessions.map(session => (
                    <div key={session.id}>
                      {/* Session notes (mood etc) */}
                      {session.notes && (
                        <div style={{
                          padding: isMobile ? '0.5rem 0' : '0.625rem 0',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          fontSize: isMobile ? '0.65rem' : '0.7rem',
                          color: 'rgba(255, 215, 0, 0.5)',
                          fontStyle: 'italic'
                        }}>
                          🏋️ {session.notes}
                        </div>
                      )}
                      
                      {session.workout_progress?.map((progress) => (
                        <div
                          key={progress.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            padding: isMobile ? '0.75rem 0' : '0.875rem 0'
                          }}
                        >
                          {/* Exercise name + time */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '0.5rem'
                          }}>
                            <div style={{
                              fontSize: isMobile ? '0.8rem' : '0.875rem',
                              fontWeight: '700',
                              color: '#fff'
                            }}>
                              {progress.exercise_name}
                            </div>
                            {progress.created_at && (
                              <div style={{
                                fontSize: isMobile ? '0.6rem' : '0.65rem',
                                color: 'rgba(255, 255, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}>
                                <Clock size={10} />
                                {formatTime(progress.created_at)}
                              </div>
                            )}
                          </div>
                          
                          {/* Sets with partials + dropsets */}
                          {progress.sets && Array.isArray(progress.sets) && (
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: isMobile ? '0.35rem' : '0.4rem'
                            }}>
                              {progress.sets.map((set, setIdx) => (
                                <div
                                  key={setIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: isMobile ? '0.68rem' : '0.73rem',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px'
                                  }}
                                >
                                  {formatSet(set, setIdx)}
                                  {set.completed && (
                                    <span style={{ color: '#10b981', fontSize: '0.6rem' }}>✓</span>
                                  )}
                                </div>
                              ))}
                              
                              {/* Volume */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: isMobile ? '0.6rem' : '0.65rem',
                                color: 'rgba(255, 215, 0, 0.4)',
                                marginLeft: 'auto'
                              }}>
                                <span>Vol:</span>
                                <span style={{ color: '#FFD700', fontWeight: '700' }}>
                                  {calculateVolume(progress.sets)}kg
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Exercise notes */}
                          {progress.notes && (
                            <div style={{
                              marginTop: '0.5rem',
                              fontSize: isMobile ? '0.65rem' : '0.7rem',
                              color: 'rgba(255, 215, 0, 0.4)',
                              fontStyle: 'italic'
                            }}>
                              📝 {progress.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Load More */}
            {hasMore && (
              <div ref={observerTarget} style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                {loadingMore && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid rgba(255, 215, 0, 0.2)',
                    borderTopColor: '#FFD700',
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
            <Dumbbell size={32} color="rgba(255, 255, 255, 0.15)" style={{ marginBottom: '0.75rem' }} />
            <p style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              margin: 0
            }}>
              Geen trainingsgeschiedenis gevonden
            </p>
            <p style={{
              color: 'rgba(255, 255, 255, 0.25)',
              fontSize: isMobile ? '0.68rem' : '0.73rem',
              marginTop: '0.35rem'
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
      `}</style>
    </div>
  )
}

// All stats are now GOLD
function StatItem({ label, value, isMobile }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{
        fontSize: isMobile ? '1.15rem' : '1.3rem',
        fontWeight: 900,
        color: '#FFD700',
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginTop: '0.2rem'
      }}>
        {label}
      </div>
    </div>
  )
}

function StatDivider() {
  return (
    <div style={{
      width: '1px',
      height: '28px',
      background: 'rgba(255, 255, 255, 0.06)',
      flexShrink: 0
    }} />
  )
}
