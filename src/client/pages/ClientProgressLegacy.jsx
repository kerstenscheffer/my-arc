import useIsMobile from '../../hooks/useIsMobile'

// src/client/pages/ClientProgress.jsx
// MY ARC CLIENT PROGRESS - COMPLETE IMPLEMENTATION
// All progress tracking features in one powerful component
import GoalsManager from '../../modules/goals/GoalsManager'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  TrendingUp, Target, Calendar, Activity, Award, Camera, Plus,
  Weight, Ruler, Droplets, Flame, Timer, BarChart3, CheckCircle,
  ChevronLeft, ChevronRight, Trophy, Star, Lock, Unlock, X, Save,
  Eye, EyeOff, RefreshCw, Zap, Download, TrendingDown, Share2,
  Maximize2, Minimize2, Upload, Image, Trash2, ChevronDown,
  Heart, Users, Clock, AlertCircle, Info, Edit2, Check, Dumbbell,
  Search, Flag, Rocket, Sparkles, ArrowRight
} from 'lucide-react'

// ===== ENHANCED PROGRESS CHART COMPONENT =====
const EnhancedProgressChart = ({ data, type = 'weight', color = '#10b981', height = 300, showTrend = true, title = '' }) => {
  if (!data || data.length < 2) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <BarChart3 size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
          <p>Need at least 2 data points</p>
        </div>
      </div>
    )
  }

  // Sort and prepare data
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))
  
  const values = sortedData.map(d => {
    if (type === 'weight') return parseFloat(d.weight) || 0
    if (type === 'calories') return parseFloat(d.calories) || 0
    if (type === 'protein') return parseFloat(d.protein) || 0
    if (type === 'volume') return parseFloat(d.volume) || 0
    if (type === 'strength') return parseFloat(d.max_weight) || 0
    return parseFloat(d.value) || 0
  })
  
  const dates = sortedData.map(d => new Date(d.date))
  
  // Calculate statistics
  const min = Math.min(...values)
  const max = Math.max(...values)
  const latest = values[values.length - 1]
  const previous = values[values.length - 2]
  const change = latest - previous
  const changePercent = ((change / previous) * 100).toFixed(1)
  const average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
  
  // Calculate trend line
  const n = values.length
  const sumX = values.reduce((_, __, i) => _ + i, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = values.reduce((sum, y, i) => sum + i * y, 0)
  const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Scale for SVG
  const padding = (max - min) * 0.1 || 1
  const chartMin = min - padding
  const chartMax = max + padding
  const chartRange = chartMax - chartMin
  
  // SVG dimensions
  const width = 100
  const chartHeight = 60
  
  // Create points for line
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = chartHeight - ((value - chartMin) / chartRange * chartHeight)
    return { x, y, value }
  }).map(p => `${p.x},${p.y}`).join(' ')
  
  // Create fill area
  const fillPoints = `0,${chartHeight} ` + points + ` ${width},${chartHeight}`
  
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%)',
      border: `1px solid ${color}33`,
      borderRadius: '16px',
      padding: '1.5rem',
      height
    }}>
      {/* Header with stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div>
          <h4 style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: '0.875rem',
            marginBottom: '0.25rem'
          }}>
            {title || (type === 'weight' ? 'Weight Progress' : 
             type === 'strength' ? 'Strength Progress' :
             type === 'volume' ? 'Training Volume' :
             type === 'calories' ? 'Calorie Intake' : 'Progress')}
          </h4>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff' }}>
            {latest.toFixed(1)}
            <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', marginLeft: '0.25rem' }}>
              {type === 'weight' ? 'kg' : 
               type === 'strength' ? 'kg' :
               type === 'volume' ? 'kg' :
               type === 'calories' ? 'kcal' : ''}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.75rem',
            background: change >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${change >= 0 ? '#10b981' : '#ef4444'}`,
            borderRadius: '6px',
            marginBottom: '0.5rem'
          }}>
            {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span style={{ 
              color: change >= 0 ? '#10b981' : '#ef4444',
              fontWeight: 'bold' 
            }}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)} ({changePercent}%)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            Avg: {average}
          </div>
        </div>
      </div>
      
      {/* SVG Chart */}
      <svg 
        viewBox={`0 0 ${width} ${chartHeight}`} 
        style={{ width: '100%', height: chartHeight * 3, marginBottom: '1rem' }}
      >
        {/* Grid lines */}
        {[0, 20, 40, 60, 80, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={chartHeight * (y / 100)}
            x2={width}
            y2={chartHeight * (y / 100)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Fill area */}
        <polygon
          points={fillPoints}
          fill={`url(#gradient-${type})`}
        />
        
        {/* Trend line */}
        {showTrend && values.length > 3 && (
          <line
            x1="0"
            y1={chartHeight - ((intercept - chartMin) / chartRange * chartHeight)}
            x2={width}
            y2={chartHeight - (((intercept + slope * (n - 1)) - chartMin) / chartRange * chartHeight)}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.5"
          />
        )}
        
        {/* Data line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {values.map((value, index) => {
          const x = (index / (values.length - 1)) * width
          const y = chartHeight - ((value - chartMin) / chartRange * chartHeight)
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="3"
                fill={color}
                stroke="#0a0a0a"
                strokeWidth="2"
              />
              {index >= values.length - 3 && (
                <text
                  x={x}
                  y={y - 5}
                  fill="#fff"
                  fontSize="6"
                  textAnchor="middle"
                  opacity="0.8"
                >
                  {value.toFixed(1)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      
      {/* X-axis labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <span>{dates[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
        {dates.length > 4 && (
          <span>{dates[Math.floor(dates.length / 2)].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
        )}
        <span>{dates[dates.length - 1].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}









// ===== WORKOUT LOGGER COMPONENT =====
const WorkoutLogger = ({ client, db, onClose }) => {
  const [selectedExercise, setSelectedExercise] = useState('')
  const [customExercise, setCustomExercise] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [sets, setSets] = useState([{ weight: '', reps: '', notes: '' }])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [todayExercises, setTodayExercises] = useState([])
  const [completedExercises, setCompletedExercises] = useState([])
  const [allExercises, setAllExercises] = useState([])
  
  useEffect(() => {
    loadTodaysPlan()
    loadExerciseHistory()
  }, [])
  
  const loadTodaysPlan = async () => {
    try {
      const today = new Date()
      const dayOfWeek = today.getDay() || 7
      
      const todayWorkout = await db.getTodayWorkout(client.id)
      
      if (todayWorkout && todayWorkout.exercises) {
        const exercises = typeof todayWorkout.exercises === 'string' 
          ? JSON.parse(todayWorkout.exercises) 
          : todayWorkout.exercises
        
        const exerciseNames = exercises.map(ex => ex.name || ex.exercise_name || ex)
        setTodayExercises(exerciseNames)
      }
      
      const todayStr = today.toISOString().split('T')[0]
      const completed = await db.getClientProgressByDate(client.id, todayStr)
      setCompletedExercises(completed.map(c => c.exercise_name))
      
    } catch (error) {
      console.error('Error loading today plan:', error)
    }
  }
  
  const loadExerciseHistory = async () => {
    try {
      const history = await db.getExerciseHistory(client.id)
      setAllExercises(history)
    } catch (error) {
      console.error('Error loading exercise history:', error)
    }
  }
  
  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise)
    setSearchTerm(exercise)
    setShowDropdown(false)
  }
  
  const saveWorkout = async () => {
    const exerciseName = customExercise || selectedExercise || searchTerm
    
    if (!exerciseName) {
      alert('❌ Please select or enter an exercise')
      return
    }
    
    const validSets = sets.filter(s => s.weight && s.reps)
    if (validSets.length === 0) {
      alert('❌ Please enter at least one set with weight and reps')
      return
    }
    
    setSaving(true)
    try {
      await db.saveWorkoutProgress({
        client_id: client.id,
        exercise_name: exerciseName,
        date: new Date().toISOString().split('T')[0],
        sets: validSets,
        notes: notes || ''
      })
      
      // Mark workout as completed for today
      await db.markWorkoutComplete(
        client.id,
        new Date().toISOString().split('T')[0],
        null,
        'Logged via progress tracker'
      )
      
      alert('✅ Exercise logged successfully!')
      
      // Reset and reload
      setSelectedExercise('')
      setCustomExercise('')
      setSearchTerm('')
      setSets([{ weight: '', reps: '', notes: '' }])
      setNotes('')
      loadTodaysPlan()
      
    } catch (error) {
      console.error('Save error:', error)
      alert('❌ Error saving workout')
    } finally {
      setSaving(false)
    }
  }
  
  const addSet = () => setSets([...sets, { weight: '', reps: '', notes: '' }])
  const removeSet = (i) => sets.length > 1 && setSets(sets.filter((_, idx) => idx !== i))
  const updateSet = (i, field, value) => {
    const newSets = [...sets]
    newSets[i][field] = value
    setSets(newSets)
  }
  
  // Common exercise database
  const commonExercises = [
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
    'Pull-ups', 'Dips', 'Leg Press', 'Lunges', 'Romanian Deadlift',
    'Incline Bench Press', 'Front Squat', 'Sumo Deadlift', 'Dumbbell Press',
    'Cable Row', 'Lat Pulldown', 'Bicep Curl', 'Tricep Extension',
    'Leg Curl', 'Leg Extension', 'Calf Raise', 'Face Pull', 'Lateral Raise'
  ]
  
  const searchResults = useMemo(() => {
    if (!searchTerm) return []
    const term = searchTerm.toLowerCase()
    const fromHistory = allExercises.filter(ex => ex.toLowerCase().includes(term))
    const fromCommon = commonExercises.filter(ex => 
      ex.toLowerCase().includes(term) && !fromHistory.includes(ex)
    )
    return [...fromHistory, ...fromCommon].slice(0, 10)
  }, [searchTerm, allExercises])
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, transparent)',
        borderBottom: '2px solid #10b981'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Dumbbell size={24} style={{ color: '#10b981' }} />
            Log Workout
          </h2>
          <button onClick={onClose} style={{
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <X size={20} style={{ color: '#fff' }} />
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {/* TODAY'S PLANNED EXERCISES */}
        {todayExercises.length > 0 && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid #10b981',
            borderRadius: '12px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              color: '#10b981',
              fontWeight: 'bold'
            }}>
              <Calendar size={18} />
              Today's Planned Exercises
            </label>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {todayExercises.map(exercise => (
                <button
                  key={exercise}
                  onClick={() => handleExerciseSelect(exercise)}
                  disabled={completedExercises.includes(exercise)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: completedExercises.includes(exercise)
                      ? 'rgba(16, 185, 129, 0.2)'
                      : selectedExercise === exercise
                        ? '#10b981'
                        : 'rgba(255,255,255,0.1)',
                    border: completedExercises.includes(exercise)
                      ? '1px solid #10b981'
                      : 'none',
                    borderRadius: '8px',
                    color: selectedExercise === exercise ? '#000' : '#fff',
                    fontWeight: selectedExercise === exercise ? 'bold' : 'normal',
                    cursor: completedExercises.includes(exercise) ? 'not-allowed' : 'pointer',
                    opacity: completedExercises.includes(exercise) ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {exercise}
                  {completedExercises.includes(exercise) && ' ✅'}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Exercise Search */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.8)'
          }}>
            Exercise
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search or add custom exercise..."
              style={{
                width: '100%',
                padding: '0.75rem',
                paddingLeft: '2.5rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Search size={20} style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.5)'
            }} />
          </div>
          
          {showDropdown && searchTerm && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.25rem',
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 100
            }}>
              {searchResults.map(exercise => (
                <div
                  key={exercise}
                  onClick={() => handleExerciseSelect(exercise)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: completedExercises.includes(exercise)
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'transparent'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.target.style.background = completedExercises.includes(exercise)
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'transparent'}
                >
                  {exercise} {completedExercises.includes(exercise) && '✅'}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Sets */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem'
          }}>
            <label>Sets</label>
            <button onClick={addSet} style={{
              padding: '0.5rem 1rem',
              background: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Plus size={16} /> Add Set
            </button>
          </div>
          
          {sets.map((set, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 2fr auto',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <input
                type="number"
                placeholder="Weight (kg)"
                value={set.weight}
                onChange={(e) => updateSet(i, 'weight', e.target.value)}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <input
                type="number"
                placeholder="Reps"
                value={set.reps}
                onChange={(e) => updateSet(i, 'reps', e.target.value)}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <input
                placeholder="Notes (optional)"
                value={set.notes}
                onChange={(e) => updateSet(i, 'notes', e.target.value)}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              {sets.length > 1 && (
                <button onClick={() => removeSet(i)} style={{
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  <Trash2 size={16} style={{ color: '#ef4444' }} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Notes */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.8)'
          }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any PRs?"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              minHeight: '80px',
              resize: 'vertical'
            }}
          />
        </div>
      </div>
      
      {/* Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: '1rem'
      }}>
        <button onClick={onClose} style={{
          flex: 1,
          padding: '1rem',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          color: '#fff',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Cancel
        </button>
        <button
          onClick={saveWorkout}
          disabled={saving}
          style={{
            flex: 1,
            padding: '1rem',
            background: saving
              ? 'rgba(16, 185, 129, 0.3)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '8px',
            color: saving ? 'rgba(255,255,255,0.5)' : '#000',
            fontWeight: 'bold',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Exercise'}
        </button>
      </div>
    </div>
  )
}

// ===== WORKOUT SECTION COMPONENT =====
const WorkoutSection = ({ workouts, onLogWorkout, client, db, onRefresh }) => {
  const [exerciseStats, setExerciseStats] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState('')
  
  useEffect(() => {
    if (selectedExercise && workouts.exerciseHistory) {
      const exerciseData = workouts.exerciseHistory
        .filter(w => w.exercise_name === selectedExercise)
        .map(w => ({
          date: w.date,
          max_weight: Math.max(...(w.sets?.map(s => parseFloat(s.weight)) || [0])),
          volume: w.sets?.reduce((sum, s) => sum + (parseFloat(s.weight) * parseFloat(s.reps)), 0) || 0
        }))
      setExerciseStats(exerciseData)
    }
  }, [selectedExercise, workouts])
  
  return (
    <div>
      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <Flame size={24} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{workouts.streak}</div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Day Streak</div>
        </div>
        
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <Activity size={24} style={{ color: '#8b5cf6', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{workouts.total}</div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Total Workouts</div>
        </div>
        
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <Trophy size={24} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{workouts.prs.length}</div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>PRs Set</div>
        </div>
      </div>
      
      {/* Log Workout Button */}
      <button
        onClick={onLogWorkout}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
          borderRadius: '12px',
          color: '#000',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}
      >
        <Dumbbell size={24} />
        Log Today's Workout
      </button>
      
      {/* Exercise Progress Selector */}
      {workouts.exerciseHistory && workouts.exerciseHistory.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.8)'
          }}>
            View Exercise Progress
          </label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem'
            }}
          >
            <option value="">Select an exercise to view progress...</option>
            {[...new Set(workouts.exerciseHistory.map(w => w.exercise_name))].map(exercise => (
              <option key={exercise} value={exercise}>{exercise}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Exercise Progress Charts */}
      {exerciseStats && exerciseStats.length > 1 && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <EnhancedProgressChart 
              data={exerciseStats} 
              type="strength"
              color="#f59e0b"
              title={`${selectedExercise} - Max Weight`}
              showTrend={true}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <EnhancedProgressChart 
              data={exerciseStats} 
              type="volume"
              color="#8b5cf6"
              title={`${selectedExercise} - Total Volume`}
              showTrend={false}
            />
          </div>
        </>
      )}
      
      {/* Recent Workouts */}
      {workouts.exerciseHistory && workouts.exerciseHistory.length > 0 && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Clock size={20} style={{ color: '#10b981' }} />
            Recent Exercise Logs
          </h3>
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {workouts.exerciseHistory.slice(0, 10).map((log, index) => (
              <div key={index} style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                    {log.exercise_name}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                    {new Date(log.date).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  {log.sets?.map((set, i) => (
                    <span key={i}>
                      {set.weight}kg × {set.reps}
                      {i < log.sets.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
                {log.notes && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.6)',
                    fontStyle: 'italic'
                  }}>
                    "{log.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ===== MAIN PROGRESS COMPONENT =====
export default function ClientProgress({ client, db, onNavigate }) {
  const [viewMode, setViewMode] = useState('overview')
  const [timeRange, setTimeRange] = useState(30)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showWorkoutLogger, setShowWorkoutLogger] = useState(false)
  
  const isMobile = useIsMobile()
  
  const [progressData, setProgressData] = useState({
    weight: { current: null, history: [], goal: null, bmi: null },
    measurements: { latest: null, history: [] },
    workouts: { 
      streak: 0, 
      total: 0, 
      prs: [], 
      weekProgress: {},
      todayWorkout: null,
      recentWorkouts: [],
      exerciseHistory: []
    },
    nutrition: { 
      compliance: 0, 
      macros: { protein: 0, carbs: 0, fat: 0 }, 
      waterIntake: [], 
      calories: { current: 0, target: 2000 },
      todayMeals: [],
      history: []
    },
    photos: { latest: [], all: [] },
    achievements: { unlocked: [], pending: [] },
    goals: []
  })
  







const loadProgressData = useCallback(async () => {
  if (!client?.id || !db) return
      
  try {
    setLoading(true)
    
    // Debug log
    console.log('Loading progress data for client:', client.id)
      
    // Get weight history FIRST and check it 
    const weightHistory = await db.getWeightHistory(client.id, timeRange)
    console.log('Weight history loaded:', weightHistory)
      
    // Get all other data
    const [
      measurements,
      workoutCompletions,
      mealProgress,
      photos,
      achievements,
      goalsWithProgress,     // Enhanced versie met progress
      todayWorkout,
      recentWorkouts,
      workoutProgressData,
      nutritionHistory,
      streak,
      goalTemplates,         // NEW: Voor quick setup
      goalStatistics        // NEW: Voor overview stats
    ] = await Promise.all([
      db.getMeasurementsHistory(client.id, timeRange),
      db.getWorkoutCompletions(client.id),
      db.getTodaysMealProgress(client.id),
      db.getProgressPhotos(client.id),
      db.getAchievements(client.id),
      db.getClientGoalsWithProgress(client.id),    // Enhanced versie
      db.getTodayWorkout(client.id),
      db.getRecentWorkouts(client.id, 7),   
      db.getWorkoutProgress(client.id, timeRange),
      db.getMealHistory(client.id, timeRange),
      db.getClientStreak(client.id),
      db.getGoalTemplates(),                       // NEW
      db.getGoalStatistics(client.id)              // NEW
    ])
    
    // Process weight data
    const currentWeight = weightHistory?.[0]?.weight || null
    const weightGoal = goalsWithProgress?.find(g => g.goal_type === 'weight')
    const height = client.height || 175 // Default height in cm
    const bmi = currentWeight ? (currentWeight / ((height / 100) ** 2)).toFixed(1) : null
    
    // Set all progress data
    setProgressData({
      weight: { 
        current: currentWeight, 
        history: weightHistory || [], 
        goal: weightGoal, 
        bmi: bmi 
      },
      measurements: { 
        latest: measurements?.[0] || null, 
        history: measurements || [] 
      },
      workouts: { 
        streak: streak || 0, 
        total: workoutCompletions?.length || 0, 
        prs: workoutProgressData?.exercises || [], 
        weekProgress: workoutProgressData?.weekProgress || {},
        todayWorkout: todayWorkout,
        recentWorkouts: recentWorkouts || [],
        exerciseHistory: workoutProgressData?.exercises || []
      },
      nutrition: { 
        compliance: mealProgress?.compliance || 0, 
        macros: mealProgress?.macros || { protein: 0, carbs: 0, fat: 0 }, 
        waterIntake: mealProgress?.water || [], 
        calories: mealProgress?.calories || { current: 0, target: 2000 },
        todayMeals: mealProgress?.meals || [],
        history: nutritionHistory || []
      },
      photos: { 
        latest: photos?.slice(0, 4) || [], 
        all: photos || [] 
      },
      achievements: { 
        unlocked: achievements?.filter(a => a.unlocked) || [], 
        pending: achievements?.filter(a => !a.unlocked) || [] 
      },
      goals: goalsWithProgress || [],              // Enhanced goals met progress
      goalTemplates: goalTemplates || [],          // NEW: Templates
      goalStats: goalStatistics || {               // NEW: Statistics
        total: 0,
        active: 0,
        completed: 0,
        average_progress: 0,
        streak_days: 0,
        most_consistent: null
      }
    })
    
    setLoading(false)
    console.log('Progress data loaded successfully')
    
  } catch (error) {
    console.error('Error loading progress data:', error)
    setLoading(false)
  }
}, [client, db, timeRange])













  useEffect(() => {
    loadProgressData()
  }, [loadProgressData])
  
  // Helper functions
  const calculateNutritionCompliance = (mealData) => {
    if (!mealData || !mealData.target_calories) return 0
    
    const caloriePercentage = (mealData.calories / mealData.target_calories) * 100
    if (caloriePercentage >= 90 && caloriePercentage <= 110) {
      return 100
    } else if (caloriePercentage >= 80 && caloriePercentage <= 120) {
      return 75
    } else if (caloriePercentage >= 70 && caloriePercentage <= 130) {
      return 50
    } else {
      return 25
    }
  }
  
  const processAchievements = (achievements, stats) => {
    const allAchievements = [
      { id: 'first_workout', name: 'First Workout', icon: '💪', condition: stats.totalWorkouts >= 1 },
      { id: 'week_streak', name: '7 Day Streak', icon: '🔥', condition: stats.streak >= 7 },
      { id: 'month_streak', name: '30 Day Streak', icon: '⚡', condition: stats.streak >= 30 },
      { id: 'perfect_week', name: 'Perfect Week', icon: '⭐', condition: stats.compliance >= 90 },
      { id: '10_workouts', name: '10 Workouts', icon: '🎯', condition: stats.totalWorkouts >= 10 },
      { id: '25_workouts', name: '25 Workouts', icon: '🏆', condition: stats.totalWorkouts >= 25 },
      { id: '50_workouts', name: '50 Workouts', icon: '👑', condition: stats.totalWorkouts >= 50 },
    ]
    
    const unlocked = allAchievements.filter(a => a.condition)
    const pending = allAchievements.filter(a => !a.condition)
    
    return { unlocked, pending }
  }
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0a0a'
      }}>
        <RefreshCw size={32} style={{ color: '#10b981', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      paddingBottom: isMobile ? '80px' : '2rem'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 1rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent)',
        borderBottom: '2px solid #10b981'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <TrendingUp size={28} style={{ color: '#10b981' }} />
            Progress Tracker
          </h1>
          <button
            onClick={() => {
              setRefreshing(true)
              loadProgressData()
            }}
            disabled={refreshing}
            style={{
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={20} style={{ 
              color: '#fff',
              animation: refreshing ? 'spin 1s linear infinite' : 'none'
            }} />
          </button>
        </div>
        
        {/* Time range selector */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem'
        }}>
          {[7, 30, 60, 90].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              style={{
                padding: '0.5rem 1rem',
                background: timeRange === days
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: timeRange === days
                  ? 'none'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: timeRange === days ? '#000' : '#fff',
                fontWeight: timeRange === days ? 'bold' : 'normal',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0 1rem',
        marginTop: '1rem',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
          { id: 'weight', label: 'Weight', icon: <Weight size={16} /> },
          { id: 'workouts', label: 'Workouts', icon: <Activity size={16} /> },
          { id: 'nutrition', label: 'Nutrition', icon: <Heart size={16} /> },
          { id: 'photos', label: 'Photos', icon: <Camera size={16} /> },
          { id: 'goals', label: 'Goals', icon: <Target size={16} /> },
          { id: 'achievements', label: 'Awards', icon: <Trophy size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            style={{
              padding: '0.75rem 1.25rem',
              background: viewMode === tab.id
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(255,255,255,0.05)',
              border: viewMode === tab.id
                ? 'none'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: viewMode === tab.id ? '#000' : '#fff',
              fontWeight: viewMode === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content Area */}
      <div style={{ padding: '0 1rem' }}>
       
 {/* Overview Tab */}
{viewMode === 'overview' && progressData.goals?.length > 0 && (
  <div style={{
    background: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1rem'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.75rem'
    }}>
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Target size={20} style={{ color: '#8b5cf6' }} />
        Actieve Doelen
      </h3>
      <button
        onClick={() => setViewMode('goals')}
        style={{
          padding: '0.5rem 1rem',
          background: 'rgba(139, 92, 246, 0.2)',
          border: '1px solid #8b5cf6',
          borderRadius: '8px',
          color: '#8b5cf6',
          fontSize: '0.875rem',
          cursor: 'pointer'
        }}
      >
        Bekijk Alle
      </button>
    </div>
    
    {/* Show top 3 active goals */}
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {progressData.goals
        .filter(g => g.status === 'active')
        .slice(0, 3)
        .map(goal => {
          const progress = goal.target_value > 0
            ? Math.round((goal.current_value / goal.target_value) * 100)
            : 0
          
          return (
            <div key={goal.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px'
            }}>
              <div style={{
                flex: 1,
                fontSize: '0.875rem'
              }}>
                {goal.title || goal.goal_type}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                {goal.current_value}/{goal.target_value} {goal.unit}
              </div>
              <div style={{
                width: '50px',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                color: goal.color || '#10b981',
                textAlign: 'right'
              }}>
                {progress}%
              </div>
            </div>
          )
        })}
    </div>
  </div>
)}
        
        {/* Workouts Tab */}
        {viewMode === 'workouts' && (
          <WorkoutSection 
            workouts={progressData.workouts}
            onLogWorkout={() => setShowWorkoutLogger(true)}
            client={client}
            db={db}
            onRefresh={loadProgressData}
          />
        )}
        
        {/* Weight Tab */}


{viewMode === 'weight' && (
  <div>
    {/* Gewicht Grafiek */}
    {progressData.weight.history.length > 1 ? (
      <div style={{ marginBottom: '1.5rem' }}>
        <EnhancedProgressChart 
          data={progressData.weight.history} 
          type="weight"
          color="#10b981"
          height={350}
        />
      </div>
    ) : (
      <div style={{
        marginBottom: '1.5rem',
        padding: '2rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        textAlign: 'center'
      }}>
        <BarChart3 size={48} style={{ 
          color: '#10b981', 
          opacity: 0.3,
          marginBottom: '1rem'
        }} />
        <h3 style={{ marginBottom: '0.5rem' }}>
          Meer Data Nodig
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
          Je hebt {progressData.weight.history.length || 0} meting{progressData.weight.history.length === 1 ? '' : 'en'}. 
          Voeg minimaal 2 gewichtsmetingen toe om de grafiek te zien.
        </p>
        <p style={{ color: '#10b981', fontSize: '0.875rem' }}>
          Log hieronder je huidige gewicht om te beginnen!
        </p>
      </div>
    )}
    
    {/* Huidig Gewicht Display */}
    {progressData.weight.current && (
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid #10b981',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
            Huidig Gewicht
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {progressData.weight.current} kg
          </div>
        </div>
        {progressData.weight.bmi && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
              BMI
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
              {progressData.weight.bmi}
            </div>
          </div>
        )}
      </div>
    )}
    
    {/* Gewicht Toevoegen */}
    <div style={{
      background: 'rgba(0, 0, 0, 0.6)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '12px',
      padding: '1.5rem'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Gewicht Loggen</h3>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          id="weight-input"
          type="number"
          step="0.1"
          placeholder="Voer gewicht in (kg)"
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <button
          onClick={async () => {
            const input = document.getElementById('weight-input')
            if (input.value) {
              try {
                const today = new Date().toISOString().split('T')[0]
                await db.saveWeight(client.id, input.value, today)
                input.value = ''
                await loadProgressData()
                alert('✅ Gewicht opgeslagen!')
              } catch (error) {
                console.error('Weight save error:', error)
                alert('❌ Fout bij opslaan: ' + error.message)
              }
            } else {
              alert('Voer eerst een gewicht in')
            }
          }}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Opslaan
        </button>
      </div>
      
      {/* Optioneel: Datum selector voor historische data */}
      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
        💡 Tip: Log dagelijks je gewicht voor de beste tracking resultaten
      </div>
    </div>
  </div>
)}



        {/* Goals Tab */}
{viewMode === 'goals' && (
  <div style={{
    padding: isMobile ? '1rem' : '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto'
  }}>
    {/* Goals Header met statistieken */}
    <div style={{
      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '2rem',
      color: '#fff'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Target size={24} />
        Jouw Doelen
      </h2>
      
      {/* Goal Statistics */}
      {progressData.goalStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '0.75rem'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {progressData.goalStats.active || 0}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              Actieve Doelen
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '0.75rem'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {progressData.goalStats.average_progress || 0}%
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              Gem. Progress
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '0.75rem'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {progressData.goalStats.completed || 0}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              Voltooid
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '0.75rem'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {progressData.goalStats.streak_days || 0}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              Dagen Streak
            </div>
          </div>
        </div>
      )}
    </div>
    
    {/* GoalsManager Component */}
    <GoalsManager
      client={client}
      db={db}
      goals={progressData.goals || []}
      templates={progressData.goalTemplates || []}
      onRefresh={() => loadProgressData()}
    />
  </div>
)}

        
        {/* Achievements Tab */}
        {viewMode === 'achievements' && (
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Achievements</h2>
            
            {/* Unlocked */}
            {progressData.achievements.unlocked.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#10b981' }}>
                  🏆 Unlocked
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {progressData.achievements.unlocked.map(achievement => (
                    <div key={achievement.id} style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                      border: '1px solid #10b981',
                      borderRadius: '12px',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{achievement.icon}</div>
                      <div style={{ fontWeight: 'bold', color: '#10b981' }}>{achievement.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Pending */}
            {progressData.achievements.pending.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.6)' }}>
                  🔒 Locked
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {progressData.achievements.pending.map(achievement => (
                    <div key={achievement.id} style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
borderRadius: '12px',
                      padding: '1rem',
                      textAlign: 'center',
                      opacity: 0.5
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{achievement.icon}</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)' }}>{achievement.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Floating Action Button */}
      {isMobile && (
        <button
          onClick={() => setShowWorkoutLogger(true)}
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100
          }}
        >
          <Plus size={24} style={{ color: '#000' }} />
        </button>
      )}
      
      {/* Workout Logger Modal */}
{/* Workout Logger Modal */}
      {showWorkoutLogger && (
        <WorkoutLogger
          client={client}
          db={db} 
          onClose={() => {
            setShowWorkoutLogger(false)
            loadProgressData()
          }}
        />
      )}
      
      {/* CSS for spin animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
      
    </div>
  )
}
