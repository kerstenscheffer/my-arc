import { useState, useEffect } from 'react'
import { 
  TrendingUp, Activity, Zap, Calendar, ChevronRight, BarChart3,
  ChevronDown, Dumbbell, Search, Clock, History
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import WorkoutHistory from './WorkoutHistory' // Import the new component

export default function ProgressChartsWidget({ db, clientId, onOpenFullView }) {
  // Existing state
  const [chartData, setChartData] = useState([])
  const [stats, setStats] = useState(null)
  const [activeChart, setActiveChart] = useState('volume')
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('all')
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [period, setPeriod] = useState('month')
  const [touchStart, setTouchStart] = useState(null)
  
  // New state for view toggle
  const [viewMode, setViewMode] = useState('chart') // 'chart' or 'history'
  
  const isMobile = window.innerWidth <= 768
  
  // Only load chart data when in chart mode
  useEffect(() => {
    if (viewMode === 'chart') {
      loadExercises()
    }
  }, [clientId, viewMode])
  
  useEffect(() => {
    if (viewMode === 'chart') {
      loadChartData()
    }
  }, [clientId, selectedExercise, period, viewMode])
  
  const loadExercises = async () => {
    try {
      // Get unique exercises from workout_progress with proper join
      const { data: sessions, error: sessionsError } = await db.supabase
        .from('workout_sessions')
        .select('id')
        .eq('client_id', clientId)
        .limit(50)
      
      if (sessionsError) throw sessionsError
      
      if (!sessions || sessions.length === 0) {
        setExercises([])
        return
      }
      
      const sessionIds = sessions.map(s => s.id)
      
      const { data, error } = await db.supabase
        .from('workout_progress')
        .select('exercise_name')
        .in('session_id', sessionIds)
      
      if (error) throw error
      
      const uniqueExercises = {}
      data?.forEach(record => {
        const name = record.exercise_name
        if (!uniqueExercises[name]) {
          uniqueExercises[name] = {
            name: name,
            count: 0
          }
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
      
      if (selectedExercise === 'all') {
        const days = period === 'week' ? 7 : period === 'month' ? 30 : 365
        const data = await db.getWorkoutChartData(clientId, days)
        const recentStats = await db.getRecentWorkoutStats(clientId)
        
        const formattedData = data.map(d => ({
          date: new Date(d.date).toLocaleDateString('nl-NL', { 
            day: 'numeric', 
            month: period === 'year' ? 'short' : 'short' 
          }),
          volume: Math.round(d.volume),
          exercises: d.exercises,
          duration: d.duration
        }))
        
        setChartData(formattedData)
        setStats(recentStats)
      } else {
        const { data: sessions, error: sessionsError } = await db.supabase
          .from('workout_sessions')
          .select('id, completed_at, workout_date')
          .eq('client_id', clientId)
          .gte('completed_at', startDate.toISOString())
          .lte('completed_at', endDate.toISOString())
          .order('completed_at', { ascending: true })
        
        if (sessionsError) throw sessionsError
        
        if (!sessions || sessions.length === 0) {
          setChartData([])
          setStats(null)
          return
        }
        
        const sessionIds = sessions.map(s => s.id)
        
        const { data: progressData, error: progressError } = await db.supabase
          .from('workout_progress')
          .select('*')
          .eq('exercise_name', selectedExercise)
          .in('session_id', sessionIds)
        
        if (progressError) throw progressError
        
        if (progressData && progressData.length > 0) {
          const sessionMap = {}
          sessions.forEach(s => {
            sessionMap[s.id] = s.completed_at || s.workout_date
          })
          
          const processedData = progressData.map(record => {
            const sets = Array.isArray(record.sets) ? record.sets : []
            const weights = sets.map(s => parseFloat(s.weight) || 0)
            const maxWeight = Math.max(...weights, 0)
            const totalReps = sets.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0)
            const volume = sets.reduce((sum, set) => 
              sum + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0
            )
            
            return {
              date: new Date(sessionMap[record.session_id]).toLocaleDateString('nl-NL', { 
                day: 'numeric', 
                month: period === 'year' ? 'short' : 'short'
              }),
              weight: maxWeight,
              volume: Math.round(volume),
              reps: totalReps,
              rawDate: sessionMap[record.session_id]
            }
          })
          
          processedData.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
          setChartData(processedData)
          
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          
          const exerciseStats = {
            workoutsThisWeek: processedData.filter(d => {
              return new Date(d.rawDate) >= weekAgo
            }).length,
            totalVolume: processedData.reduce((sum, d) => sum + d.volume, 0),
            maxWeight: Math.max(...processedData.map(d => d.weight), 0),
            totalReps: processedData.reduce((sum, d) => sum + d.reps, 0)
          }
          
          setStats(exerciseStats)
        } else {
          setChartData([])
          setStats(null)
        }
      }
    } catch (error) {
      console.error('Failed to load chart data:', error)
      setChartData([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }
  
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }
  
  const handleTouchEnd = (e) => {
    if (!touchStart) return
    
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        if (period === 'week') setPeriod('month')
        else if (period === 'month') setPeriod('year')
      } else {
        if (period === 'year') setPeriod('month')
        else if (period === 'month') setPeriod('week')
      }
    }
    
    setTouchStart(null)
  }
  
  const chartConfig = selectedExercise === 'all' ? {
    volume: {
      color: '#f97316',
      label: 'Volume (kg)',
      icon: Zap,
      gradient: 'volumeGradient'
    },
    exercises: {
      color: '#3b82f6',
      label: 'Oefeningen',
      icon: Activity,
      gradient: 'exerciseGradient'
    },
    duration: {
      color: '#10b981',
      label: 'Duur',
      icon: Calendar,
      gradient: 'durationGradient'
    }
  } : {
    weight: {
      color: '#f97316',
      label: 'Max Gewicht',
      icon: Zap,
      gradient: 'volumeGradient'
    },
    volume: {
      color: '#3b82f6',
      label: 'Volume',
      icon: Activity,
      gradient: 'exerciseGradient'
    },
    reps: {
      color: '#10b981',
      label: 'Totaal Reps',
      icon: Calendar,
      gradient: 'durationGradient'
    }
  }
  
  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // If in history mode, render WorkoutHistory component
  if (viewMode === 'history') {
    return <WorkoutHistory 
      db={db} 
      clientId={clientId} 
      onBack={() => setViewMode('chart')} 
    />
  }
  
  // Original chart view
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
      borderRadius: isMobile ? '16px' : '20px',
      border: '1px solid rgba(249, 115, 22, 0.15)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Header with View Toggle */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
        borderBottom: '1px solid rgba(249, 115, 22, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile ? '0.75rem' : '1rem'
        }}>
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
            <BarChart3 size={isMobile ? 18 : 22} color="#f97316" />
            Progress Grafieken
          </h3>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* History Button */}
            <button
              onClick={() => setViewMode('history')}
              style={{
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '8px',
                padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.8rem',
                color: '#f97316',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '32px'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.95)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              <Clock size={14} />
              Geschiedenis
            </button>
            
            {/* Full View Button */}
            {onOpenFullView && (
              <button
                onClick={onOpenFullView}
                style={{
                  background: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '8px',
                  padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.8rem',
                  color: '#f97316',
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '32px'
                }}
              >
                Volledige Weergave
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
        
        {/* Rest of the original component code continues here... */}
        {/* Period Selector */}
        <div 
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            position: 'relative'
          }}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                flex: 1,
                padding: isMobile ? '0.5rem' : '0.625rem',
                background: period === p 
                  ? 'rgba(249, 115, 22, 0.15)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: period === p
                  ? '1px solid rgba(249, 115, 22, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                color: period === p ? '#f97316' : 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '36px'
              }}
            >
              {p === 'week' ? 'Week' : p === 'month' ? 'Maand' : 'Jaar'}
            </button>
          ))}
        </div>
        
        {/* Exercise Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExerciseDropdown(!showExerciseDropdown)}
            style={{
              width: '100%',
              padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '10px',
              color: selectedExercise === 'all' ? '#f97316' : '#fff',
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
              <Dumbbell size={16} />
              <span>{selectedExercise === 'all' ? 'Alle Trainingen' : selectedExercise}</span>
            </div>
            <ChevronDown 
              size={16} 
              style={{ 
                transform: showExerciseDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
          </button>
          
          {/* Dropdown Menu */}
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
              zIndex: 20,
              maxHeight: isMobile ? '60vh' : '300px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              
              {/* Search Input */}
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
                      fontSize: isMobile ? '16px' : '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              
              {/* Exercise Options */}
              <div style={{
                maxHeight: isMobile ? 'calc(60vh - 80px)' : '200px',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                {/* All Workouts Option */}
                <button
                  onClick={() => {
                    setSelectedExercise('all')
                    setShowExerciseDropdown(false)
                    setSearchQuery('')
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem 1rem' : '0.75rem 1rem',
                    background: selectedExercise === 'all' 
                      ? 'rgba(249, 115, 22, 0.2)' 
                      : 'transparent',
                    border: 'none',
                    color: selectedExercise === 'all' ? '#f97316' : 'rgba(255,255,255,0.8)',
                    fontSize: isMobile ? '0.9rem' : '0.85rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <span>Alle Trainingen</span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    opacity: 0.6 
                  }}>
                    Overzicht
                  </span>
                </button>
                
                {/* Individual Exercises */}
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
                      padding: isMobile ? '0.875rem 1rem' : '0.75rem 1rem',
                      background: selectedExercise === exercise.name 
                        ? 'rgba(249, 115, 22, 0.2)' 
                        : 'transparent',
                      border: 'none',
                      color: selectedExercise === exercise.name ? '#f97316' : 'rgba(255,255,255,0.8)',
                      fontSize: isMobile ? '0.9rem' : '0.85rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <span>{exercise.name}</span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      opacity: 0.6 
                    }}>
                      {exercise.count}x
                    </span>
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
        
        {/* Quick Stats */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: isMobile ? '0.5rem' : '0.75rem',
            marginTop: '0.75rem'
          }}>
            <StatCard
              value={selectedExercise === 'all' ? stats.workoutsThisWeek : stats.workoutsThisWeek || 0}
              label={selectedExercise === 'all' ? "Deze Week" : "Sessies"}
              color="#f97316"
              isMobile={isMobile}
            />
            <StatCard
              value={selectedExercise === 'all' 
                ? `${Math.round(stats.totalVolume / 1000)}k`
                : stats.maxWeight ? `${stats.maxWeight}kg` : '0'
              }
              label={selectedExercise === 'all' ? "Volume (kg)" : "Max Gewicht"}
              color="#3b82f6"
              isMobile={isMobile}
            />
            <StatCard
              value={selectedExercise === 'all' 
                ? stats.currentStreak || 0
                : stats.totalReps || 0
              }
              label={selectedExercise === 'all' ? "Reeks" : "Totaal Reps"}
              color="#10b981"
              isMobile={isMobile}
            />
          </div>
        )}
      </div>
      
      {/* Chart Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {Object.entries(chartConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveChart(key)}
            style={{
              flex: 1,
              padding: isMobile ? '0.5rem' : '0.625rem',
              background: activeChart === key 
                ? `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`
                : 'rgba(255, 255, 255, 0.02)',
              border: activeChart === key
                ? `1px solid ${config.color}40`
                : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              color: activeChart === key ? config.color : 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '36px'
            }}
          >
            <config.icon size={isMobile ? 14 : 16} />
            {!isMobile && config.label}
          </button>
        ))}
      </div>
      
      {/* Chart Area */}
      <div style={{
        padding: isMobile ? '1rem 0.5rem 1rem 0' : '1.5rem 1rem 1.5rem 0.5rem',
        height: isMobile ? '200px' : '250px'
      }}>
        {loading ? (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="exerciseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="durationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.3)"
                fontSize={isMobile ? 10 : 12}
                tick={{ fill: 'rgba(255,255,255,0.5)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)"
                fontSize={isMobile ? 10 : 12}
                tick={{ fill: 'rgba(255,255,255,0.5)' }}
              />
              <Tooltip 
                contentStyle={{
                  background: 'rgba(17, 17, 17, 0.95)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.75rem' : '0.85rem'
                }}
              />
              <Area 
                type="monotone" 
                dataKey={activeChart}
                stroke={chartConfig[activeChart]?.color || '#f97316'}
                strokeWidth={2}
                fill={`url(#${chartConfig[activeChart]?.gradient || 'volumeGradient'})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <Activity size={32} color="rgba(249, 115, 22, 0.2)" />
            <p style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              margin: 0
            }}>
              {selectedExercise === 'all' 
                ? 'Nog geen trainingsdata'
                : `Geen data voor ${selectedExercise}`
              }
            </p>
            <p style={{
              color: 'rgba(255, 255, 255, 0.3)',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              margin: 0
            }}>
              Start met het loggen van trainingen om grafieken te zien
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

// Mini Stat Card Component
function StatCard({ value, label, color, isMobile }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '10px',
      padding: isMobile ? '0.75rem' : '1rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
        opacity: 0.6
      }} />
      
      <div style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '800',
        color: color,
        lineHeight: 1,
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        color: 'rgba(255, 255, 255, 0.4)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: '600'
      }}>
        {label}
      </div>
    </div>
  )
}
