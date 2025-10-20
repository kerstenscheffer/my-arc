// src/modules/progress/ProgressChartsWidget.jsx v2 - WITH IMPERATIVE METHODS
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { BarChart3, ChevronDown, Dumbbell, Search, Clock } from 'lucide-react'

// Import new components
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
          // Estimate 1RM using Brzycki formula: weight × (36 / (37 - reps))
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
      }

      return {
        date,
        value: Math.round(value * 10) / 10
      }
    })

    // Sort by date
    chartData.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA - dateB
    })

    // Get current and previous values
    const current = chartData.length > 0 ? chartData[chartData.length - 1].value : null
    const previous = chartData.length > 1 ? chartData[chartData.length - 2].value : null

    return { chartData, current, previous }
  }

  const getMetricLabel = (metric) => {
    const labels = {
      '1rm': 'One Rep Max',
      'volume': 'Totaal Volume',
      'maxWeight': 'Max Gewicht',
      'totalSets': 'Totaal Sets',
      'totalReps': 'Totaal Reps',
      'frequency': 'Training Frequentie'
    }
    return labels[metric] || metric
  }

  const getMetricUnit = (metric) => {
    const units = {
      '1rm': 'kg',
      'volume': 'kg',
      'maxWeight': 'kg',
      'totalSets': '',
      'totalReps': '',
      'frequency': 'x'
    }
    return units[metric] || ''
  }

  const getMetricColor = (metric) => {
    const colors = {
      '1rm': '#f97316',
      'volume': '#3b82f6',
      'maxWeight': '#10b981',
      'totalSets': '#8b5cf6',
      'totalReps': '#ec4899',
      'frequency': '#f59e0b'
    }
    return colors[metric] || '#f97316'
  }

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // History view
  if (viewMode === 'history') {
    return <WorkoutHistory 
      db={db} 
      clientId={clientId} 
      onBack={() => setViewMode('chart')} 
    />
  }

  return (
    <div style={{
      background: 'rgba(23, 23, 23, 0.6)',
      borderRadius: isMobile ? '14px' : '16px',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      overflow: 'hidden',
      position: 'relative',
      backdropFilter: 'blur(10px)'
    }}>
      {/* HEADER */}
      <div style={{
        padding: isMobile ? '0.875rem' : '1rem',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
        borderBottom: '1px solid rgba(249, 115, 22, 0.15)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile ? '0.6rem' : '0.75rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            fontWeight: '800',
            color: '#f97316',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            letterSpacing: '-0.02em'
          }}>
            <BarChart3 size={isMobile ? 16 : 20} color="#f97316" />
            Workout Grafieken
          </h3>
          
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setViewMode('history')}
              style={{
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '8px',
                padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.6rem',
                color: '#f97316',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '32px'
              }}
            >
              <Clock size={isMobile ? 12 : 14} />
              Historie
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          marginBottom: '0.6rem'
        }}>
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                flex: 1,
                padding: isMobile ? '0.4rem' : '0.5rem',
                background: period === p 
                  ? 'rgba(249, 115, 22, 0.15)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: period === p
                  ? '1px solid rgba(249, 115, 22, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                color: period === p ? '#f97316' : 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'capitalize',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '32px'
              }}
            >
              {p === 'week' ? 'Week' : p === 'month' ? 'Maand' : 'Jaar'}
            </button>
          ))}
        </div>
        
        {/* Exercise Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExerciseDropdown(!showExerciseDropdown)}
            style={{
              width: '100%',
              padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 0.875rem',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '10px',
              color: selectedExercise === 'all' ? '#f97316' : '#fff',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Dumbbell size={isMobile ? 14 : 16} />
              <span>{selectedExercise === 'all' ? 'Alle Workouts' : selectedExercise}</span>
            </div>
            <ChevronDown 
              size={isMobile ? 14 : 16} 
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
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              zIndex: 20,
              maxHeight: isMobile ? '60vh' : '300px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{
                padding: isMobile ? '0.6rem' : '0.75rem',
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
                      padding: isMobile ? '0.4rem 0.6rem 0.4rem 1.8rem' : '0.5rem 0.75rem 0.5rem 2rem',
                      background: 'rgba(249, 115, 22, 0.05)',
                      border: '1px solid rgba(249, 115, 22, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: isMobile ? '16px' : '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              
              <div style={{
                maxHeight: isMobile ? 'calc(60vh - 60px)' : '200px',
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
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: selectedExercise === 'all' 
                      ? 'rgba(249, 115, 22, 0.15)' 
                      : 'transparent',
                    border: 'none',
                    color: selectedExercise === 'all' ? '#f97316' : 'rgba(255,255,255,0.7)',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                      padding: isMobile ? '0.75rem' : '0.875rem',
                      background: selectedExercise === exercise.name 
                        ? 'rgba(249, 115, 22, 0.15)' 
                        : 'transparent',
                      border: 'none',
                      color: selectedExercise === exercise.name ? '#f97316' : 'rgba(255,255,255,0.7)',
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                    padding: '1rem',
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
      </div>

      {/* CONTENT */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem'
      }}>
        {/* Metric Selector */}
        <ChartMetricSelector
          activeMetric={selectedMetric}
          onSelectMetric={setSelectedMetric}
          disabled={selectedExercise === 'all'}
        />

        {/* Context Header */}
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

        {/* Info message for "all" selection */}
        {selectedExercise === 'all' && (
          <div style={{
            marginTop: '1rem',
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '10px',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            💡 Selecteer een specifieke oefening om metrics te bekijken
          </div>
        )}
      </div>
    </div>
  )
})

export default ProgressChartsWidget
