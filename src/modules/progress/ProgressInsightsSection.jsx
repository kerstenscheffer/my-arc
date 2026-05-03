// src/modules/progress/ProgressInsightsSection.jsx
// V2: Clean stats per oefening - Gem 8 Rep, 1RM, Max Volume
import { useState, useEffect } from 'react'
import { TrendingUp, Search, ChevronDown, Dumbbell } from 'lucide-react'

export default function ProgressInsightsSection({ db, clientId, onSelectExercise }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    avg8Rep: null,
    oneRepMax: null,
    maxVolume: null
  })

  useEffect(() => {
    if (clientId && db) {
      loadExercises()
    }
  }, [clientId, db])

  useEffect(() => {
    if (selectedExercise && clientId && db) {
      calculateStats()
    }
  }, [selectedExercise, clientId, db])

  const loadExercises = async () => {
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
        
        // Auto-select first exercise
        if (uniqueExercises.length > 0 && !selectedExercise) {
          setSelectedExercise(uniqueExercises[0])
        }
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load exercises:', error)
      setLoading(false)
    }
  }

  const calculateStats = async () => {
    try {
      // Get all progress for this exercise
      const { data: sessions } = await db.supabase
        .from('workout_sessions')
        .select('id')
        .eq('client_id', clientId)

      if (!sessions?.length) return

      const sessionIds = sessions.map(s => s.id)

      const { data: progressData } = await db.supabase
        .from('workout_progress')
        .select('sets')
        .in('session_id', sessionIds)
        .eq('exercise_name', selectedExercise)

      if (!progressData?.length) {
        setStats({ avg8Rep: null, oneRepMax: null, maxVolume: null })
        return
      }

      // Collect all sets
      const allSets = []
      progressData.forEach(record => {
        if (Array.isArray(record.sets)) {
          record.sets.forEach(set => {
            const weight = parseFloat(set.weight) || 0
            const reps = parseInt(set.reps) || 0
            if (weight > 0 && reps > 0) {
              allSets.push({ weight, reps })
            }
          })
        }
      })

      if (allSets.length === 0) {
        setStats({ avg8Rep: null, oneRepMax: null, maxVolume: null })
        return
      }

      // Calculate 1RM for each set using Epley formula: weight × (1 + reps/30)
      const oneRepMaxes = allSets.map(set => set.weight * (1 + set.reps / 30))
      const maxOneRepMax = Math.max(...oneRepMaxes)

      // Calculate estimated 8 rep weight from 1RM: 1RM / (1 + 8/30) = 1RM / 1.267
      // Then average all estimated 8 rep weights
      const estimated8Reps = oneRepMaxes.map(orm => orm / (1 + 8 / 30))
      const avg8Rep = estimated8Reps.reduce((a, b) => a + b, 0) / estimated8Reps.length

      // Max volume per set
      const volumes = allSets.map(set => set.weight * set.reps)
      const maxVolume = Math.max(...volumes)

      setStats({
        avg8Rep: Math.round(avg8Rep * 10) / 10,
        oneRepMax: Math.round(maxOneRepMax * 10) / 10,
        maxVolume: Math.round(maxVolume)
      })

    } catch (error) {
      console.error('Failed to calculate stats:', error)
    }
  }

  const filteredExercises = exercises.filter(ex =>
    ex.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255, 215, 0, 0.2)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  if (exercises.length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: isMobile ? '1rem' : '1.25rem' }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 0 0.75rem 0' : '0 0 1rem 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={isMobile ? 16 : 18} color="#FFD700" />
          <h3 style={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            fontWeight: '800',
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Oefening Stats
          </h3>
        </div>

        {/* Exercise Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: isMobile ? '0.45rem 0.7rem' : '0.5rem 0.875rem',
              color: selectedExercise ? '#fff' : 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              maxWidth: isMobile ? '140px' : '200px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Dumbbell size={isMobile ? 12 : 13} color="#FFD700" />
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {selectedExercise || 'Kies oefening'}
            </span>
            <ChevronDown
              size={12}
              style={{
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                flexShrink: 0
              }}
            />
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.35rem',
              background: 'rgba(15, 15, 15, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              zIndex: 30,
              minWidth: isMobile ? '200px' : '250px',
              maxHeight: '280px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
            }}>
              {/* Search */}
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
                maxHeight: '200px',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                {filteredExercises.map(ex => (
                  <button
                    key={ex}
                    onClick={() => {
                      setSelectedExercise(ex)
                      setShowDropdown(false)
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
                {filteredExercises.length === 0 && (
                  <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.75rem'
                  }}>
                    Geen oefeningen gevonden
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STATS - 3 columns, all GOLD */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '0.75rem 0' : '1rem 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <StatItem
          label="Gem. 8 Rep"
          value={stats.avg8Rep !== null ? `${stats.avg8Rep}kg` : '-'}
          sublabel="geschat"
          isMobile={isMobile}
        />
        <StatDivider />
        <StatItem
          label="1RM"
          value={stats.oneRepMax !== null ? `${stats.oneRepMax}kg` : '-'}
          sublabel="max"
          isMobile={isMobile}
        />
        <StatDivider />
        <StatItem
          label="Max Volume"
          value={stats.maxVolume !== null ? `${stats.maxVolume}kg` : '-'}
          sublabel="per set"
          isMobile={isMobile}
        />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function StatItem({ label, value, sublabel, isMobile }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        fontWeight: '800',
        color: '#FFD700',
        letterSpacing: '-0.02em',
        lineHeight: 1.2
      }}>
        {value}
      </div>
      <div style={{
        fontSize: isMobile ? '0.5rem' : '0.55rem',
        color: 'rgba(255, 255, 255, 0.35)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginTop: '0.1rem'
      }}>
        {label}
      </div>
      {sublabel && (
        <div style={{
          fontSize: isMobile ? '0.45rem' : '0.5rem',
          color: 'rgba(255, 255, 255, 0.2)',
          marginTop: '0.05rem'
        }}>
          {sublabel}
        </div>
      )}
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
