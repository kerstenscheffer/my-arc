// Enhanced Progress Charts - Met Verbeterde Selectie & Quick Filters
import { useState, useEffect } from 'react'
import { 
  TrendingUp, Weight, Activity, Target, BarChart3, 
  Search, Star, Dumbbell, ChevronRight, X, ChevronDown,
  Filter, Clock, Award, Zap
} from 'lucide-react'
import WorkoutService from '../services/WorkoutService'

const THEME = {
  primary: '#f97316',
  gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
  border: 'rgba(249, 115, 22, 0.2)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
}

const MUSCLE_GROUPS = {
  all: { name: 'Alle Oefeningen', color: THEME.primary, icon: Dumbbell },
  chest: { name: 'Borst', color: '#dc2626', icon: Target },
  back: { name: 'Rug', color: '#7c3aed', icon: Activity },
  shoulders: { name: 'Schouders', color: '#2563eb', icon: Zap },
  arms: { name: 'Armen', color: '#059669', icon: Weight },
  legs: { name: 'Benen', color: '#db2777', icon: Activity },
  core: { name: 'Core', color: '#d97706', icon: Target }
}

// Quick exercise presets voor snelle toegang
const QUICK_EXERCISES = [
  { name: 'Bench Press', icon: '🏋️', muscle: 'chest' },
  { name: 'Squat', icon: '🦵', muscle: 'legs' },
  { name: 'Deadlift', icon: '💪', muscle: 'back' },
  { name: 'Shoulder Press', icon: '🎯', muscle: 'shoulders' }
]

export default function EnhancedProgressCharts({ db, currentUser }) {
  const [chartData, setChartData] = useState([])
  const [selectedMetric, setSelectedMetric] = useState('weight')
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showMuscleDropdown, setShowMuscleDropdown] = useState(false)
  const [favoriteExercises, setFavoriteExercises] = useState([])
  const [recentExercises, setRecentExercises] = useState([])
  const [showQuickSelect, setShowQuickSelect] = useState(true)
  
  const workoutService = new WorkoutService(db)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (currentUser?.id) {
      loadExercises()
      loadFavorites()
    }
  }, [currentUser])

  useEffect(() => {
    if (selectedExercise) {
      loadChartData()
      addToRecent(selectedExercise)
    }
  }, [selectedExercise, selectedPeriod])

  const loadExercises = async () => {
    try {
      const { data, error } = await db.supabase
        .from('workout_progress')
        .select(`
          exercise_name,
          created_at,
          workout_sessions!inner(client_id)
        `)
        .eq('workout_sessions.client_id', currentUser.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error loading exercises:', error)
        return
      }
      
      // Process unique exercises with more data
      const uniqueExercises = {}
      const recentList = []
      
      data?.forEach(record => {
        const name = record.exercise_name
        
        // Track recent (last 5 unique)
        if (recentList.length < 5 && !recentList.includes(name)) {
          recentList.push(name)
        }
        
        if (!uniqueExercises[name]) {
          uniqueExercises[name] = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name: name,
            muscle_group: getMuscleGroup(name),
            count: 0,
            lastUsed: record.created_at,
            isFavorite: false
          }
        }
        uniqueExercises[name].count++
        
        // Update last used date
        if (new Date(record.created_at) > new Date(uniqueExercises[name].lastUsed)) {
          uniqueExercises[name].lastUsed = record.created_at
        }
      })
      
      const exerciseList = Object.values(uniqueExercises)
        .sort((a, b) => b.count - a.count)
      
      setExercises(exerciseList)
      setRecentExercises(recentList)
      
      // Auto-select most used exercise
      if (exerciseList.length > 0 && !selectedExercise) {
        setSelectedExercise(exerciseList[0].name)
      }
    } catch (error) {
      console.error('Error loading exercises:', error)
    }
  }

  const loadFavorites = async () => {
    // In real app, load from user preferences
    // For now, use top 3 most used
    const favs = exercises.slice(0, 3).map(ex => ex.name)
    setFavoriteExercises(favs)
  }

  const addToRecent = (exerciseName) => {
    setRecentExercises(prev => {
      const updated = [exerciseName, ...prev.filter(e => e !== exerciseName)].slice(0, 5)
      return updated
    })
  }

  const getMuscleGroup = (exerciseName) => {
    const name = exerciseName.toLowerCase()
    if (name.includes('press') || name.includes('chest') || name.includes('bench')) return 'chest'
    if (name.includes('row') || name.includes('pull') || name.includes('lat')) return 'back'
    if (name.includes('shoulder') || name.includes('lateral') || name.includes('raise')) return 'shoulders'
    if (name.includes('curl') || name.includes('tricep') || name.includes('bicep')) return 'arms'
    if (name.includes('squat') || name.includes('leg') || name.includes('deadlift')) return 'legs'
    if (name.includes('core') || name.includes('abs') || name.includes('plank')) return 'core'
    return 'all'
  }

  const loadChartData = async () => {
    if (!selectedExercise || !currentUser?.id) return
    
    setLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - selectedPeriod)
      
      const { data, error } = await db.supabase
        .from('workout_progress')
        .select(`
          *,
          workout_sessions!inner (
            client_id,
            workout_date,
            completed_at
          )
        `)
        .eq('exercise_name', selectedExercise)
        .eq('workout_sessions.client_id', currentUser.id)
        .gte('workout_sessions.completed_at', startDate.toISOString())
        .order('workout_sessions.completed_at', { ascending: true })
      
      if (error) {
        console.error('Chart data error:', error)
        setChartData([])
        return
      }
      
      if (data && data.length > 0) {
        const processedData = data.map(record => {
          const sets = Array.isArray(record.sets) ? record.sets : []
          const weights = sets.map(s => parseFloat(s.weight) || 0)
          const reps = sets.map(s => parseInt(s.reps) || 0)
          
          const maxWeight = Math.max(...weights, 0)
          const totalReps = reps.reduce((sum, r) => sum + r, 0)
          const volume = sets.reduce((sum, set) => 
            sum + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0
          )
          
          return {
            date: new Date(record.workout_sessions.completed_at).toLocaleDateString('nl-NL', { 
              day: 'numeric', 
              month: 'short' 
            }),
            weight: maxWeight,
            volume: Math.round(volume),
            reps: totalReps,
            sets: sets.length
          }
        })
        
        setChartData(processedData)
      } else {
        setChartData([])
      }
    } catch (error) {
      console.error('Error loading chart data:', error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const getFilteredExercises = () => {
    let filtered = exercises
    
    if (selectedMuscleGroup !== 'all') {
      filtered = filtered.filter(ex => ex.muscle_group === selectedMuscleGroup)
    }
    
    if (searchQuery) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  }

  const getMaxValue = () => {
    if (chartData.length === 0) return 100
    const values = chartData.map(d => d[selectedMetric] || 0)
    return Math.max(...values) * 1.1
  }

  const getMinValue = () => {
    if (chartData.length === 0) return 0
    const values = chartData.map(d => d[selectedMetric] || 0).filter(v => v > 0)
    return values.length > 0 ? Math.min(...values) * 0.9 : 0
  }

  const metrics = [
    { id: 'weight', label: 'Gewicht', icon: Weight, unit: 'kg', color: THEME.primary },
    { id: 'volume', label: 'Volume', icon: Activity, unit: 'kg', color: '#8b5cf6' },
    { id: 'reps', label: 'Reps', icon: Target, unit: '', color: '#10b981' },
    { id: 'sets', label: 'Sets', icon: BarChart3, unit: '', color: '#3b82f6' }
  ]

  const periods = [
    { value: 7, label: '1W' },
    { value: 30, label: '1M' },
    { value: 90, label: '3M' },
    { value: 365, label: '1J' }
  ]

  const currentMetric = metrics.find(m => m.id === selectedMetric)
  const selectedExerciseData = exercises.find(ex => ex.name === selectedExercise)

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem',
      width: '100%'
    }}>
      
      {/* Quick Select Pills - Voor favoriete/recente oefeningen */}
      {showQuickSelect && (recentExercises.length > 0 || QUICK_EXERCISES.length > 0) && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {/* Recent exercises */}
          {recentExercises.slice(0, 3).map(exercise => (
            <button
              key={exercise}
              onClick={() => setSelectedExercise(exercise)}
              style={{
                flexShrink: 0,
                padding: '0.5rem 0.875rem',
                background: selectedExercise === exercise 
                  ? THEME.gradient 
                  : 'rgba(249, 115, 22, 0.1)',
                border: `1px solid ${selectedExercise === exercise ? THEME.primary : THEME.border}`,
                borderRadius: '20px',
                color: selectedExercise === exercise ? '#fff' : THEME.primary,
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Clock size={12} />
              {exercise}
            </button>
          ))}
          
          {/* Quick presets */}
          {QUICK_EXERCISES.filter(qe => 
            !recentExercises.includes(qe.name) && 
            exercises.some(e => e.name === qe.name)
          ).slice(0, 2).map(quick => (
            <button
              key={quick.name}
              onClick={() => setSelectedExercise(quick.name)}
              style={{
                flexShrink: 0,
                padding: '0.5rem 0.875rem',
                background: selectedExercise === quick.name 
                  ? THEME.gradient 
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${selectedExercise === quick.name ? THEME.primary : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '20px',
                color: selectedExercise === quick.name ? '#fff' : 'rgba(255,255,255,0.7)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{quick.icon}</span>
              {quick.name}
            </button>
          ))}
        </div>
      )}

      {/* Combined Filter & Exercise Selection Bar */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        padding: '1rem',
        border: `1px solid ${THEME.border}`
      }}>
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'stretch'
        }}>
          {/* Muscle Group Filter Button */}
          <button
            onClick={() => setShowMuscleDropdown(!showMuscleDropdown)}
            style={{
              padding: '0.75rem',
              background: selectedMuscleGroup !== 'all' 
                ? `linear-gradient(135deg, ${MUSCLE_GROUPS[selectedMuscleGroup].color}20, ${MUSCLE_GROUPS[selectedMuscleGroup].color}10)`
                : 'rgba(249, 115, 22, 0.1)',
              border: `1px solid ${selectedMuscleGroup !== 'all' ? MUSCLE_GROUPS[selectedMuscleGroup].color : THEME.border}`,
              borderRadius: '12px',
              color: selectedMuscleGroup !== 'all' ? MUSCLE_GROUPS[selectedMuscleGroup].color : THEME.primary,
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <Filter size={16} />
            <span style={{ display: isMobile ? 'none' : 'inline' }}>
              {MUSCLE_GROUPS[selectedMuscleGroup].name}
            </span>
            <ChevronDown size={14} />
            
            {/* Muscle Dropdown */}
            {showMuscleDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.5rem',
                background: 'rgba(0, 0, 0, 0.95)',
                borderRadius: '12px',
                border: `1px solid ${THEME.border}`,
                backdropFilter: 'blur(20px)',
                zIndex: 10,
                minWidth: '180px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                {Object.entries(MUSCLE_GROUPS).map(([key, group]) => (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedMuscleGroup(key)
                      setShowMuscleDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: selectedMuscleGroup === key 
                        ? `linear-gradient(135deg, ${group.color}20, ${group.color}10)`
                        : 'transparent',
                      border: 'none',
                      color: selectedMuscleGroup === key ? group.color : 'rgba(255,255,255,0.8)',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedMuscleGroup !== key) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedMuscleGroup !== key) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <group.icon size={14} />
                    {group.name}
                  </button>
                ))}
              </div>
            )}
          </button>

          {/* Selected Exercise Display */}
          <button
            onClick={() => setShowExerciseModal(true)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: selectedExerciseData 
                ? `linear-gradient(135deg, ${THEME.primary}15, rgba(0,0,0,0.3))`
                : 'rgba(249, 115, 22, 0.1)',
              border: `1px solid ${THEME.border}`,
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              flex: 1
            }}>
              <Dumbbell size={18} color={THEME.primary} />
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: selectedExerciseData ? '#fff' : THEME.primary
                }}>
                  {selectedExerciseData ? selectedExerciseData.name : 'Selecteer Oefening'}
                </div>
                {selectedExerciseData && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.5)'
                  }}>
                    {selectedExerciseData.count}x • {MUSCLE_GROUPS[selectedExerciseData.muscle_group]?.name}
                  </div>
                )}
              </div>
            </div>
            <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
      </div>

      {/* Exercise Selection Modal - Verbeterd */}
      {showExerciseModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            background: THEME.gradient,
            padding: '1rem',
            paddingTop: isMobile ? '2.5rem' : '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#fff'
              }}>
                Selecteer Oefening
              </h3>
              <button
                onClick={() => {
                  setShowExerciseModal(false)
                  setSearchQuery('')
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <X size={20} color="#fff" />
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Zoek oefening..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem'
          }}>
            {/* Favorites Section */}
            {favoriteExercises.length > 0 && !searchQuery && (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  color: THEME.warning
                }}>
                  <Star size={16} fill={THEME.warning} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                    Favorieten
                  </span>
                </div>
                {favoriteExercises.map(exerciseName => {
                  const exercise = exercises.find(e => e.name === exerciseName)
                  if (!exercise) return null
                  
                  return (
                    <ExerciseOption
                      key={exercise.id}
                      exercise={exercise}
                      isSelected={selectedExercise === exercise.name}
                      isFavorite={true}
                      onClick={() => {
                        setSelectedExercise(exercise.name)
                        setShowExerciseModal(false)
                        setSearchQuery('')
                      }}
                    />
                  )
                })}
                <div style={{ 
                  height: '1px', 
                  background: 'rgba(255,255,255,0.1)', 
                  margin: '1rem 0' 
                }} />
              </>
            )}
            
            {/* All Exercises */}
            {getFilteredExercises().map(exercise => (
              <ExerciseOption
                key={exercise.id}
                exercise={exercise}
                isSelected={selectedExercise === exercise.name}
                isFavorite={favoriteExercises.includes(exercise.name)}
                onClick={() => {
                  setSelectedExercise(exercise.name)
                  setShowExerciseModal(false)
                  setSearchQuery('')
                }}
              />
            ))}
            
            {getFilteredExercises().length === 0 && (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)'
              }}>
                <Dumbbell size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <div>Geen oefeningen gevonden</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metric & Period Selectors - Compacter */}
      {selectedExercise && (
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          {/* Metrics */}
          <div style={{
            flex: 1,
            display: 'flex',
            gap: '0.25rem',
            padding: '0.25rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px'
          }}>
            {metrics.map(metric => (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                style={{
                  flex: 1,
                  background: selectedMetric === metric.id ? metric.color : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: isMobile ? '0.5rem' : '0.625rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <metric.icon size={14} color={selectedMetric === metric.id ? '#fff' : metric.color} />
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  color: selectedMetric === metric.id ? '#fff' : 'rgba(255,255,255,0.7)'
                }}>
                  {metric.label}
                </span>
              </button>
            ))}
          </div>
          
          {/* Periods */}
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            padding: '0.25rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px'
          }}>
            {periods.map(period => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: selectedPeriod === period.value ? THEME.primary : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: selectedPeriod === period.value ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart - Zelfde als voorheen */}
      {selectedExercise && (
        loading ? (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '20px',
            padding: '3rem',
            border: `1px solid ${THEME.border}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: `3px solid ${THEME.border}`,
              borderTopColor: THEME.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : chartData.length > 0 ? (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '20px',
            padding: '1.5rem',
            border: `1px solid ${THEME.border}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '0.25rem'
                }}>
                  {currentMetric.label} Progressie
                </h3>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  {chartData.length} metingen • {selectedPeriod === 7 ? 'Week' : selectedPeriod === 30 ? 'Maand' : selectedPeriod === 90 ? '3 Maanden' : 'Jaar'}
                </p>
              </div>
              <TrendingUp size={20} color={THEME.primary} />
            </div>

            {/* Simple Chart */}
            <div style={{ 
              position: 'relative', 
              height: '200px', 
              marginBottom: '1.5rem'
            }}>
              <svg style={{ width: '100%', height: '100%' }}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(y => (
                  <line
                    key={y}
                    x1="10%"
                    y1={`${y * 100}%`}
                    x2="90%"
                    y2={`${y * 100}%`}
                    stroke="rgba(249, 115, 22, 0.1)"
                    strokeDasharray="2 4"
                  />
                ))}
                
                {/* Data line */}
                <polyline
                  fill="none"
                  stroke={currentMetric.color}
                  strokeWidth="3"
                  points={chartData.map((d, i) => {
                    const x = 10 + (i / (chartData.length - 1)) * 80
                    const y = 100 - ((d[selectedMetric] - getMinValue()) / (getMaxValue() - getMinValue())) * 100
                    return `${x}%,${y}%`
                  }).join(' ')}
                />
                
                {/* Data points */}
                {chartData.map((d, i) => {
                  const x = 10 + (i / (chartData.length - 1)) * 80
                  const y = 100 - ((d[selectedMetric] - getMinValue()) / (getMaxValue() - getMinValue())) * 100
                  return (
                    <circle
                      key={i}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill={currentMetric.color}
                      stroke="#000"
                      strokeWidth="2"
                    />
                  )
                })}
              </svg>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: `1px solid ${THEME.border}`
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.25rem'
                }}>
                  START
                </p>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {chartData[0]?.[selectedMetric]}{currentMetric.unit}
                </p>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.25rem'
                }}>
                  HUIDIG
                </p>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {chartData[chartData.length - 1]?.[selectedMetric]}{currentMetric.unit}
                </p>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.25rem'
                }}>
                  GROEI
                </p>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: THEME.success
                }}>
                  {chartData.length >= 2 ? 
                    Math.round(((chartData[chartData.length - 1][selectedMetric] - chartData[0][selectedMetric]) / chartData[0][selectedMetric]) * 100) 
                    : 0
                  }%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '20px',
            padding: '2rem',
            border: `1px solid ${THEME.border}`,
            textAlign: 'center'
          }}>
            <BarChart3 size={48} color={THEME.border} style={{ 
              marginBottom: '1rem',
              opacity: 0.5 
            }} />
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.5rem'
            }}>
              Geen data beschikbaar
            </h3>
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              Log meer workouts om progressie te zien
            </p>
          </div>
        )
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Exercise Option Component
function ExerciseOption({ exercise, isSelected, isFavorite, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '1rem',
        background: isSelected 
          ? `linear-gradient(135deg, ${THEME.primary}22, ${THEME.primary}11)` 
          : 'rgba(255,255,255,0.03)',
        border: isSelected 
          ? `1px solid ${THEME.primary}` 
          : `1px solid rgba(255,255,255,0.08)`,
        borderRadius: '12px',
        color: isSelected ? THEME.primary : 'rgba(255,255,255,0.8)',
        fontSize: '0.9rem',
        fontWeight: '500',
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isFavorite && <Star size={14} fill={THEME.warning} color={THEME.warning} />}
        <div>
          <div>{exercise.name}</div>
          <div style={{
            fontSize: '0.7rem',
            opacity: 0.6,
            marginTop: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>{exercise.count}x gelogd</span>
            <span>•</span>
            <span>{MUSCLE_GROUPS[exercise.muscle_group]?.name}</span>
          </div>
        </div>
      </div>
      <ChevronRight size={16} opacity={0.5} />
    </button>
  )
}
