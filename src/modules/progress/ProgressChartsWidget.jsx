// src/modules/progress/ProgressChartsWidget.jsx v3 - REORGANIZED LAYOUT
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { BarChart3, ChevronDown, Dumbbell, Search, Clock, Calendar } from 'lucide-react'

// Import components
import ChartMetricSelector from './components/ChartMetricSelector'
import ChartContextHeader from './components/ChartContextHeader'
import EnhancedChart from './components/EnhancedChart'
import WorkoutHistory from './WorkoutHistory'

const ProgressChartsWidget = forwardRef(({ db, clientId, onOpenFullView }, ref) => {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('all')
  const [selectedMetric, setSelectedMetric] = useState('1rm')
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [period, setPeriod] = useState('month')
  const [viewMode, setViewMode] = useState('chart')
  
  // Chart data
  const [chartData, setChartData] = useState([])
  const [contextData, setContextData] = useState({
    exerciseName: 'Alle Oefeningen',
    metricName: 'One Rep Max',
    currentValue: null,
    previousValue: null,
    unit: 'kg'
  })

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openExercise: (exercise, metric = '1rm') => {
      setSelectedExercise(exercise)
      setSelectedMetric(metric)
      setShowExerciseDropdown(false)
    }
  }))

  useEffect(() => {
    if (viewMode === 'chart') {
      loadExercises()
    }
  }, [clientId, viewMode])

  useEffect(() => {
    if (viewMode === 'chart') {
      loadChartData()
    }
  }, [clientId, selectedExercise, selectedMetric, period, viewMode])

  const loadExercises = async () => {
    try {
      const { data: sessions } = await db.supabase
        .from('workout_sessions')
        .select('id')
        .eq('client_id', clientId)
        .limit(50)
      
      if (!sessions || sessions.length === 0) {
        setExercises([])
        return
      }
      
      const sessionIds = sessions.map(s => s.id)
      
      const { data } = await db.supabase
        .from('workout_progress')
        .select('exercise_name')
        .in('session_id', sessionIds)
      
      const uniqueExercises = {}
      data?.forEach(record => {
        const name = record.exercise_name
        if (!uniqueExercises[name]) {
          uniqueExercises[name] = { name, count: 0 }
        }
        uniqueExercises[name].count++
      })
      
      const exerciseList = Object.values(uniqueExercises)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
      
      setExercises(exerciseList)
    } catch (error) {
      console.error('Failed to load exercises:', error)
      setExercises([])
    }
  }

  const loadChartData = async () => {
    try {
      setLoading(true)
      
      const endDate = new Date()
      const startDate = new Date()
      
      switch(period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setDate(startDate.getDate() - 30)
          break
        case 'year':
          startDate.setDate(startDate.getDate() - 365)
          break
      }

      // Get sessions
      const { data: sessions } = await db.supabase
        .from('workout_sessions')
        .select('id, completed_at, workout_date')
        .eq('client_id', clientId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: true })
      
      if (!sessions || sessions.length === 0) {
        setChartData([])
        setContextData(prev => ({ ...prev, currentValue: null, previousValue: null }))
        setLoading(false)
        return
      }

      const sessionIds = sessions.map(s => s.id)

      // Get progress data
      const { data: progressData } = await db.supabase
        .from('workout_progress')
        .select('*')
        .in('session_id', sessionIds)
        .eq('exercise_name', selectedExercise === 'all' ? undefined : selectedExercise)

      if (!progressData || progressData.length === 0) {
        setChartData([])
        setContextData(prev => ({ ...prev, currentValue: null, previousValue: null }))
        setLoading(false)
        return
      }

      // Process data based on metric
      const processedData = processDataByMetric(progressData, sessions, selectedMetric)
      
      setChartData(processedData.chartData)
      setContextData({
        exerciseName: selectedExercise === 'all' ? 'Alle Oefeningen' : selectedExercise,
        metricName: getMetricLabel(selectedMetric),
        currentValue: processedData.current,
        previousValue: processedData.previous,
        unit: getMetricUnit(selectedMetric)
      })

    } catch (error) {
      console.error('Failed to load chart data:', error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const processDataByMetric = (progressData, sessions, metric) => {
    const sessionMap = {}
    sessions.forEach(s => {
      sessionMap[s.id] = s.completed_at || s.workout_date
    })

    // Group by date
    const dateGroups = {}
    progressData.forEach(record => {
      const date = new Date(sessionMap[record.session_id]).toLocaleDateString('nl-NL', { 
        day: 'numeric', 
        month: 'short'
      })
      
      if (!dateGroups[date]) {
        dateGroups[date] = []
      }
      dateGroups[date].push(record)
    })

    // Calculate metric for each date
    const chartData = Object.entries(dateGroups).map(([date, records]) => {
      let value = 0

      switch(metric) {
        case '1rm':
          value = Math.max(...records.flatMap(r => 
            (Array.isArray(r.sets) ? r.sets : []).map(set => {
              const weight = parseFloat(set.weight) || 0
              const reps = parseInt(set.reps) || 1
              return reps === 1 ? weight : weight * (36 / (37 - reps))
            })
          ), 0)
          break

        case 'volume':
          value = records.reduce((sum, r) => {
            const sets = Array.isArray(r.sets) ? r.sets : []
            return sum + sets.reduce((s, set) => 
              s + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0
            )
          }, 0)
          break

        case 'maxWeight':
          value = Math.max(...records.flatMap(r => 
            (Array.isArray(r.sets) ? r.sets : []).map(set => parseFloat(set.weight) || 0)
          ), 0)
          break

        case 'totalSets':
          value = records.reduce((sum, r) => 
            sum + (Array.isArray(r.sets) ? r.sets.length : 0), 0
          )
          break

        case 'totalReps':
          value = records.reduce((sum, r) => {
            const sets = Array.isArray(r.sets) ? r.sets : []
            return sum + sets.reduce((s, set) => s + (parseInt(set.reps) || 0), 0)
          }, 0)
          break

        case 'frequency':
          value = records.length
          break

        default:
          value = 0
      }

      return { date, value: Math.round(value * 10) / 10 }
    })

    // Calculate current and previous values
    const values = chartData.map(d => d.value)
    const current = values.length > 0 ? values[values.length - 1] : null
    const previous = values.length > 1 ? values[values.length - 2] : null

    return { chartData, current, previous }
  }

  const getMetricLabel = (metric) => {
    const labels = {
      '1rm': 'One Rep Max',
      'volume': 'Totaal Volume',
      'maxWeight': 'Max Gewicht',
      'totalSets': 'Totaal Sets',
      'totalReps': 'Totaal Reps',
      'frequency': 'Trainingsfrequentie'
    }
    return labels[metric] || metric
  }

  const getMetricUnit = (metric) => {
    const units = {
      '1rm': 'kg',
      'volume': 'kg',
      'maxWeight': 'kg',
      'totalSets': 'sets',
      'totalReps': 'reps',
      'frequency': 'sessies'
    }
    return units[metric] || ''
  }

  const getMetricColor = (metric) => {
    const colors = {
      '1rm': '#f97316',
      'volume': '#10b981',
      'maxWeight': '#ef4444',
      'totalSets': '#3b82f6',
      'totalReps': '#a855f7',
      'frequency': '#f97316'
    }
    return colors[metric] || '#f97316'
  }

  const getPeriodLabel = () => {
    const labels = {
      'week': 'Deze Week',
      'month': 'Deze Maand',
      'year': 'Dit Jaar'
    }
    return labels[period] || 'Periode'
  }

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (viewMode === 'history') {
    return (
      <WorkoutHistory
        db={db}
        clientId={clientId}
        onBack={() => setViewMode('chart')}
      />
    )
  }

  return (
    <div 
      id="workout-charts-section"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '1px solid rgba(249, 115, 22, 0.25)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(249, 115, 22, 0.15)',
        overflow: 'hidden',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}
    >
      {/* Top accent glow line */}
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

      {/* HEADER with Exercise + Period Selectors */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(23, 23, 23, 0.6) 100%)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <BarChart3 
              size={isMobile ? 20 : 24} 
              color="#f97316"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))'
              }}
            />
            <h3 style={{
              fontSize: isMobile ? '1.05rem' : '1.25rem',
              fontWeight: '800',
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Workout Analytics
            </h3>
          </div>

          {/* History Button */}
          <button
            onClick={() => setViewMode('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.3rem' : '0.375rem',
              padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.06) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: isMobile ? '8px' : '10px',
              color: '#f97316',
              fontSize: isMobile ? '0.725rem' : '0.775rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              backdropFilter: 'blur(8px)',
              minHeight: '36px'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.18) 0%, rgba(249, 115, 22, 0.1) 100%)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.06) 100%)'
                e.currentTarget.style.transform = 'translateY(0)'
              }
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.97)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <Clock size={isMobile ? 13 : 14} />
            {!isMobile && <span>Geschiedenis</span>}
          </button>
        </div>

        {/* Selectors Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 200px',
          gap: isMobile ? '0.625rem' : '0.75rem'
        }}>
          {/* Exercise Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowExerciseDropdown(!showExerciseDropdown)
                setShowPeriodDropdown(false)
              }}
              style={{
                width: '100%',
                padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.06) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: isMobile ? '10px' : '12px',
                color: selectedExercise === 'all' ? 'rgba(255, 255, 255, 0.7)' : '#fff',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Dumbbell size={isMobile ? 14 : 16} color="#f97316" />
                <span>{selectedExercise === 'all' ? 'Alle Workouts' : selectedExercise}</span>
              </div>
              <ChevronDown 
                size={isMobile ? 14 : 16}
                color="#f97316"
                style={{ 
                  transform: showExerciseDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                background: 'rgba(23, 23, 23, 0.98)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: isMobile ? '10px' : '12px',
                backdropFilter: 'blur(20px)',
                zIndex: 30,
                maxHeight: isMobile ? '60vh' : '320px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
              }}>
                {/* Search */}
                <div style={{
                  padding: isMobile ? '0.625rem' : '0.75rem',
                  borderBottom: '1px solid rgba(249, 115, 22, 0.1)'
                }}>
                  <div style={{ position: 'relative' }}>
                    <Search 
                      size={isMobile ? 12 : 14} 
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
                        fontSize: isMobile ? '16px' : '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
                
                {/* Options */}
                <div style={{
                  maxHeight: isMobile ? 'calc(60vh - 70px)' : '220px',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch'
                }}>
                  <button
                    onClick={() => {
                      setSelectedExercise('all')
                      setShowExerciseDropdown(false)
                      setSearchQuery('')
                    }}
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.75rem' : '0.875rem 1rem',
                      background: selectedExercise === 'all' 
                        ? 'rgba(249, 115, 22, 0.15)' 
                        : 'transparent',
                      border: 'none',
                      color: selectedExercise === 'all' ? '#f97316' : 'rgba(255,255,255,0.7)',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <span>Alle Workouts</span>
                    <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', opacity: 0.5 }}>
                      Overzicht
                    </span>
                  </button>
                  
                  {filteredExercises.map(exercise => (
                    <button
                      key={exercise.name}
                      onClick={() => {
                        setSelectedExercise(exercise.name)
                        setShowExerciseDropdown(false)
                        setSearchQuery('')
                      }}
                      style={{
                        width: '100%',
                        padding: isMobile ? '0.75rem' : '0.875rem 1rem',
                        background: selectedExercise === exercise.name 
                          ? 'rgba(249, 115, 22, 0.15)' 
                          : 'transparent',
                        border: 'none',
                        color: selectedExercise === exercise.name ? '#f97316' : 'rgba(255,255,255,0.7)',
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <span>{exercise.name}</span>
                      <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', opacity: 0.5 }}>
                        {exercise.count}x
                      </span>
                    </button>
                  ))}
                  
                  {filteredExercises.length === 0 && (
                    <div style={{
                      padding: '1.5rem 1rem',
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: isMobile ? '0.75rem' : '0.85rem'
                    }}>
                      Geen oefeningen gevonden
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Period Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowPeriodDropdown(!showPeriodDropdown)
                setShowExerciseDropdown(false)
              }}
              style={{
                width: '100%',
                padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.06) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: isMobile ? '10px' : '12px',
                color: '#fff',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={isMobile ? 14 : 16} color="#f97316" />
                <span>{getPeriodLabel()}</span>
              </div>
              <ChevronDown 
                size={isMobile ? 14 : 16}
                color="#f97316"
                style={{ 
                  transform: showPeriodDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }} 
              />
            </button>

            {/* Period Dropdown */}
            {showPeriodDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                background: 'rgba(23, 23, 23, 0.98)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: isMobile ? '10px' : '12px',
                backdropFilter: 'blur(20px)',
                zIndex: 30,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
              }}>
                {['week', 'month', 'year'].map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p)
                      setShowPeriodDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.75rem' : '0.875rem 1rem',
                      background: period === p 
                        ? 'rgba(249, 115, 22, 0.15)' 
                        : 'transparent',
                      border: 'none',
                      color: period === p ? '#f97316' : 'rgba(255,255,255,0.7)',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {p === 'week' && 'Deze Week'}
                    {p === 'month' && 'Deze Maand'}
                    {p === 'year' && 'Dit Jaar'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem'
      }}>
        {/* Context Header - COMPACT */}
        {selectedExercise !== 'all' && (
          <ChartContextHeader
            exerciseName={contextData.exerciseName}
            metricName={contextData.metricName}
            currentValue={contextData.currentValue}
            previousValue={contextData.previousValue}
            unit={contextData.unit}
            loading={loading}
          />
        )}

        {/* Chart */}
        <EnhancedChart
          data={chartData}
          dataKey="value"
          color={getMetricColor(selectedMetric)}
          unit={contextData.unit}
          loading={loading}
          showPRMarkers={selectedMetric === '1rm' || selectedMetric === 'maxWeight'}
        />

        {/* Metric Selector - UNDER CHART - 2x3 GRID */}
        <ChartMetricSelector
          activeMetric={selectedMetric}
          onSelectMetric={setSelectedMetric}
          disabled={selectedExercise === 'all'}
        />

        {/* Info message for "all" selection */}
        {selectedExercise === 'all' && (
          <div style={{
            marginTop: isMobile ? '0.875rem' : '1rem',
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: isMobile ? '10px' : '12px',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            fontWeight: '500',
            backdropFilter: 'blur(8px)'
          }}>
            💡 Selecteer een specifieke oefening om metrics te bekijken
          </div>
        )}
      </div>
    </div>
  )
})

export default ProgressChartsWidget
