import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  TrendingUp, Target, Calendar, Activity, Award, Camera, Plus,
  Weight, Ruler, Droplets, Flame, Timer, BarChart3, CheckCircle,
  ChevronLeft, ChevronRight, Trophy, Star, Lock, Unlock, X, Save,
  Eye, EyeOff, RefreshCw, Zap, Download, TrendingDown, Share2,
  Maximize2, Minimize2, Upload, Image, Trash2, ChevronDown,
  Heart, Users, Clock, AlertCircle, Info, Edit2, Check
} from 'lucide-react'

// ===== MAIN PROGRESS COMPONENT =====
export default function ClientProgress({ client, db, onNavigate }) {
  // Core states
  const [viewMode, setViewMode] = useState('overview')
  const [timeRange, setTimeRange] = useState(30)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddType, setQuickAddType] = useState('weight')
  const [fullscreenChart, setFullscreenChart] = useState(false)
  
  const isMobile = window.innerWidth <= 768
  const swipeStartX = useRef(null)
  const pullStartY = useRef(null)
  
  // Data states
  const [progressData, setProgressData] = useState({
    weight: { current: null, history: [], goal: null, bmi: null },
    measurements: { latest: null, history: [] },
    workouts: { streak: 0, total: 0, prs: [], weekProgress: {} },
    nutrition: { compliance: 0, macros: {}, waterIntake: [], calories: {} },
    photos: { latest: [], all: [] },
    achievements: { unlocked: [], pending: [] }
  })
  
  // View modes for navigation
  const viewModes = ['overview', 'weight', 'measurements', 'workouts', 'nutrition', 'photos', 'achievements']
  
  // Load all progress data
  const loadProgressData = useCallback(async () => {
    if (!client?.id || !db) return
    
    try {
      setLoading(true)
      
      // Parallel data loading for performance
      const [
        weightHistory,
        measurements,
        workoutData,
        nutritionData,
        photos,
        achievements,
        goals
      ] = await Promise.all([
        db.getWeightHistory?.(client.id, timeRange) || [],
        db.getMeasurementsHistory?.(client.id, timeRange) || [],
        db.getWorkoutProgress?.(client.id, timeRange) || {},
        db.getNutritionCompliance?.(client.id, timeRange) || {},
        db.getProgressPhotos?.(client.id) || [],
        db.getAchievements?.(client.id) || [],
        db.getClientGoals?.(client.id) || []
      ])
      
      // Process weight data
      const currentWeight = weightHistory[0]?.weight || null
      const weightGoal = goals?.find(g => g.goal_type === 'weight')
      const height = client.height || 175 // Default height in cm
      const bmi = currentWeight ? (currentWeight / ((height/100) ** 2)).toFixed(1) : null
      
      // Calculate workout streak
      const streak = await calculateStreak(client.id)
      
      // Calculate total workouts
      const totalWorkouts = workoutData.completions?.length || 0
      
      // Get PRs from workout data
      const prs = extractPRs(workoutData.exercises || [])
      
      // Calculate nutrition compliance
      const nutritionCompliance = calculateNutritionCompliance(nutritionData)
      
      // Process achievements
      const { unlocked, pending } = processAchievements(achievements, {
        weight: currentWeight,
        streak,
        totalWorkouts,
        compliance: nutritionCompliance
      })
      
      setProgressData({
        weight: {
          current: currentWeight,
          history: weightHistory,
          goal: weightGoal,
          bmi: bmi
        },
        measurements: {
          latest: measurements[0] || null,
          history: measurements
        },
        workouts: {
          streak,
          total: totalWorkouts,
          prs,
          weekProgress: workoutData.weekProgress || {}
        },
        nutrition: {
          compliance: nutritionCompliance,
          macros: nutritionData.macros || {},
          waterIntake: nutritionData.water || [],
          calories: nutritionData.calories || {}
        },
        photos: {
          latest: photos.slice(0, 3),
          all: photos
        },
        achievements: {
          unlocked,
          pending
        }
      })
      
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [client?.id, db, timeRange])
  
  useEffect(() => {
    loadProgressData()
  }, [loadProgressData])
  
  // Helper functions
  const calculateStreak = async (clientId) => {
    try {
      const completions = await db.getWorkoutCompletions?.(clientId) || []
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const sortedDates = completions
        .filter(w => w.completed)
        .map(w => w.workout_date)
        .sort((a, b) => new Date(b) - new Date(a))
      
      const todayStr = today.toISOString().split('T')[0]
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
        streak = 1
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i])
          const prevDate = new Date(sortedDates[i - 1])
          const dayDiff = (prevDate - currentDate) / (1000 * 60 * 60 * 24)
          
          if (dayDiff <= 1.5) {
            streak++
          } else {
            break
          }
        }
      }
      
      return streak
    } catch {
      return 0
    }
  }
  
  const extractPRs = (exercises) => {
    const prs = []
    exercises.forEach(exercise => {
      const maxWeight = Math.max(...(exercise.sets?.map(s => s.weight) || [0]))
      if (maxWeight > 0) {
        prs.push({
          name: exercise.name,
          weight: maxWeight,
          date: exercise.date
        })
      }
    })
    return prs.slice(0, 5) // Top 5 PRs
  }
  
  const calculateNutritionCompliance = (data) => {
    if (!data.days || data.days.length === 0) return 0
    const compliantDays = data.days.filter(d => d.compliant).length
    return Math.round((compliantDays / data.days.length) * 100)
  }
  
  const processAchievements = (achievements, stats) => {
    const allAchievements = [
      { id: 'first_workout', name: 'First Workout', icon: '💪', condition: stats.totalWorkouts >= 1 },
      { id: 'week_streak', name: '7 Day Streak', icon: '🔥', condition: stats.streak >= 7 },
      { id: 'month_streak', name: '30 Day Streak', icon: '⚡', condition: stats.streak >= 30 },
      { id: 'weight_loss_5', name: '5kg Lost', icon: '⚖️', condition: false }, // Need historical data
      { id: 'perfect_week', name: 'Perfect Week', icon: '⭐', condition: stats.compliance >= 90 },
      { id: '10_workouts', name: '10 Workouts', icon: '🎯', condition: stats.totalWorkouts >= 10 },
      { id: '25_workouts', name: '25 Workouts', icon: '🏆', condition: stats.totalWorkouts >= 25 },
      { id: '50_workouts', name: '50 Workouts', icon: '👑', condition: stats.totalWorkouts >= 50 },
    ]
    
    const unlocked = allAchievements.filter(a => a.condition)
    const pending = allAchievements.filter(a => !a.condition)
    
    return { unlocked, pending }
  }
  
  const calculateProgress = (current, start, target) => {
    if (!start || !target || start === target) return 0
    const totalChange = Math.abs(target - start)
    const currentChange = Math.abs(current - start)
    return Math.min(100, Math.round((currentChange / totalChange) * 100))
  }
  
  const getWeekDates = (baseDate = new Date()) => {
    const dates = []
    const startOfWeek = new Date(baseDate)
    startOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + 1)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }
  
  const getBMIStatus = (bmi) => {
    if (!bmi) return { status: 'Unknown', color: '#666' }
    if (bmi < 18.5) return { status: 'Underweight', color: '#3b82f6' }
    if (bmi < 25) return { status: 'Healthy', color: '#10b981' }
    if (bmi < 30) return { status: 'Overweight', color: '#f59e0b' }
    return { status: 'Obese', color: '#ef4444' }
  }
  
  // Swipe handling
  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX
    pullStartY.current = e.touches[0].clientY
  }
  
  const handleTouchEnd = (e) => {
    if (!swipeStartX.current) return
    
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const diffX = swipeStartX.current - endX
    const diffY = pullStartY.current - endY
    
    // Horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      const currentIndex = viewModes.indexOf(viewMode)
      if (diffX > 0 && currentIndex < viewModes.length - 1) {
        // Swipe left - next tab
        setViewMode(viewModes[currentIndex + 1])
      } else if (diffX < 0 && currentIndex > 0) {
        // Swipe right - previous tab
        setViewMode(viewModes[currentIndex - 1])
      }
    }
    
    // Pull to refresh
    if (diffY < -100 && pullStartY.current < 100) {
      handleRefresh()
    }
    
    swipeStartX.current = null
    pullStartY.current = null
  }
  
  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadProgressData()
  }
  
  const handleQuickAdd = async (type, data) => {
    try {
      switch(type) {
        case 'weight':
          await db.saveWeight?.(client.id, data.weight, new Date().toISOString().split('T')[0])
          break
        case 'measurements':
          await db.saveMeasurements?.(client.id, data, new Date().toISOString().split('T')[0])
          break
        case 'water':
          await db.saveWaterIntake?.(client.id, new Date().toISOString().split('T')[0], data.amount)
          break
        case 'photo':
          await db.uploadProgressPhoto?.(client.id, data.file, data.type)
          break
      }
      
      setShowQuickAdd(false)
      await loadProgressData()
    } catch (error) {
      console.error('Error saving data:', error)
      alert('Error saving data')
    }
  }
  
  const handleShareAchievement = (achievement) => {
    if (navigator.share) {
      navigator.share({
        title: 'MY ARC Achievement',
        text: `I just unlocked "${achievement.name}" in MY ARC! ${achievement.icon}`,
        url: window.location.href
      })
    }
  }
  
  const exportProgressPDF = async () => {
    // Simple export to JSON for now (PDF would need external library)
    const dataStr = JSON.stringify(progressData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `progress_${client.first_name}_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }
  
  // Components
  const StatCard = ({ icon, value, label, color = '#10b981', onClick, trend }) => (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        border: `1px solid ${color}33`,
        borderRadius: '12px',
        padding: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.borderColor = color
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = `${color}33`
        }
      }}
    >
      <div style={{ color, marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
        {label}
      </div>
      {trend && (
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          fontSize: '0.75rem',
          color: trend > 0 ? '#10b981' : '#ef4444'
        }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
  
  const ProgressChart = ({ data, type = 'weight', fullscreen = false }) => {
    if (!data || data.length < 2) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          Not enough data for chart
        </div>
      )
    }
    
    const values = data.map(d => d[type] || d.weight || d.value || 0).filter(v => v)
    if (values.length === 0) return null
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: fullscreen ? '2rem' : '1rem',
        height: fullscreen ? '60vh' : '200px',
        position: 'relative'
      }}>
        {!fullscreen && (
          <button
            onClick={() => setFullscreenChart(true)}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <Maximize2 size={16} style={{ color: '#fff' }} />
          </button>
        )}
        
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          
          {/* Data line */}
          <polyline
            points={data.slice().reverse().map((d, i) => {
              const value = d[type] || d.weight || d.value || 0
              if (!value) return null
              const x = (i / (data.length - 1)) * 100
              const y = 100 - ((value - min) / range) * 90
              return `${x},${y}`
            }).filter(p => p).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Data points */}
          {data.slice().reverse().map((d, i) => {
            const value = d[type] || d.weight || d.value || 0
            if (!value) return null
            const x = (i / (data.length - 1)) * 100
            const y = 100 - ((value - min) / range) * 90
            
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill="#10b981"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '0.5rem',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          {max.toFixed(1)}
        </div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '0.5rem',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          {min.toFixed(1)}
        </div>
      </div>
    )
  }
  
  const QuickAddModal = ({ type, onSave, onClose }) => {
    const [formData, setFormData] = useState({})
    
    const handleSubmit = () => {
      onSave(type, formData)
    }
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: '#1a1a1a',
          borderRadius: '16px',
          padding: '2rem',
          width: '90%',
          maxWidth: '400px'
        }}>
          <h3 style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {type === 'weight' && <><Weight size={20} /> Add Weight</>}
            {type === 'measurements' && <><Ruler size={20} /> Add Measurements</>}
            {type === 'water' && <><Droplets size={20} /> Add Water Intake</>}
          </h3>
          
          {type === 'weight' && (
            <input
              type="number"
              step="0.1"
              placeholder="Weight (kg)"
              value={formData.weight || ''}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                marginBottom: '1rem',
                fontSize: '1.2rem'
              }}
              autoFocus
            />
          )}
          
          {type === 'measurements' && (
            <>
              {['chest', 'arms', 'waist', 'hips', 'thighs'].map(part => (
                <input
                  key={part}
                  type="number"
                  step="0.1"
                  placeholder={`${part.charAt(0).toUpperCase() + part.slice(1)} (cm)`}
                  value={formData[part] || ''}
                  onChange={(e) => setFormData({ ...formData, [part]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    marginBottom: '0.5rem'
                  }}
                />
              ))}
            </>
          )}
          
          {type === 'water' && (
            <input
              type="number"
              step="0.1"
              placeholder="Liters"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                marginBottom: '1rem',
                fontSize: '1.2rem'
              }}
              autoFocus
            />
          )}
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  const PhotoCompare = ({ photos }) => {
    const [compareMode, setCompareMode] = useState(false)
    const [selectedPhotos, setSelectedPhotos] = useState([])
    
    if (!photos || photos.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <Camera size={48} style={{ color: '#666', marginBottom: '1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>No progress photos yet</p>
          <button
            onClick={() => {
              setQuickAddType('photo')
              setShowQuickAdd(true)
            }}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <Camera size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
            Add First Photo
          </button>
        </div>
      )
    }
    
    return (
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} style={{ color: '#10b981' }} />
            Progress Photos
          </h3>
          <button
            onClick={() => setCompareMode(!compareMode)}
            style={{
              padding: '0.5rem 1rem',
              background: compareMode ? '#10b981' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              color: compareMode ? '#000' : '#fff',
              cursor: 'pointer'
            }}
          >
            {compareMode ? 'Exit Compare' : 'Compare'}
          </button>
        </div>
        
        {compareMode ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            {selectedPhotos.length === 2 ? (
              <>
                <div>
                  <img
                    src={selectedPhotos[0].photo_url}
                    alt="Before"
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <p style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                    {new Date(selectedPhotos[0].date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <img
                    src={selectedPhotos[1].photo_url}
                    alt="After"
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <p style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                    {new Date(selectedPhotos[1].date).toLocaleDateString()}
                  </p>
                </div>
              </>
            ) : (
              <p style={{ gridColumn: '1/3', textAlign: 'center', padding: '2rem' }}>
                Select 2 photos to compare
              </p>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            {photos.slice(0, 6).map((photo, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (compareMode) {
                    if (selectedPhotos.length < 2) {
                      setSelectedPhotos([...selectedPhotos, photo])
                    }
                  }
                }}
              >
                <img
                  src={photo.photo_url || `/api/placeholder/200/200`}
                  alt={`Progress ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  padding: '0.5rem',
                  color: '#fff',
                  fontSize: '0.75rem'
                }}>
                  {new Date(photo.date).toLocaleDateString()}
                </div>
                {photo.is_private && (
                  <Lock size={16} style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    color: '#fff'
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  const AchievementCard = ({ achievement, unlocked = false, progress = 0 }) => (
    <div style={{
      background: unlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.6)',
      border: `1px solid ${unlocked ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: '12px',
      padding: '1rem',
      textAlign: 'center',
      position: 'relative',
      transition: 'all 0.3s ease'
    }}>
      {unlocked && (
        <div style={{
          position: 'absolute',
          top: '-0.5rem',
          right: '-0.5rem',
          background: '#10b981',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Check size={14} style={{ color: '#000' }} />
        </div>
      )}
      
      <div style={{
        fontSize: '2rem',
        marginBottom: '0.5rem',
        filter: unlocked ? 'none' : 'grayscale(100%)',
        opacity: unlocked ? 1 : 0.5
      }}>
        {achievement.icon}
      </div>
      
      <div style={{
        fontSize: '0.9rem',
        fontWeight: 'bold',
        color: unlocked ? '#10b981' : 'rgba(255,255,255,0.7)',
        marginBottom: '0.25rem'
      }}>
        {achievement.name}
      </div>
      
      {!unlocked && progress > 0 && (
        <div style={{
          marginTop: '0.5rem',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: '#10b981',
            width: `${progress}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}
      
      {unlocked && (
        <button
          onClick={() => handleShareAchievement(achievement)}
          style={{
            marginTop: '0.5rem',
            padding: '0.25rem 0.5rem',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            margin: '0.5rem auto 0'
          }}
        >
          <Share2 size={12} />
          Share
        </button>
      )}
    </div>
  )
  
  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#fff'
      }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        color: '#fff',
        paddingBottom: '80px'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {refreshing && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#10b981',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Refreshing...
        </div>
      )}
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        padding: '1.5rem',
        marginBottom: '2rem',
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
            onClick={exportProgressPDF}
            style={{
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Download size={20} style={{ color: '#fff' }} />
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
        marginBottom: '1.5rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
          { id: 'weight', label: 'Weight', icon: <Weight size={16} /> },
          { id: 'measurements', label: 'Body', icon: <Ruler size={16} /> },
          { id: 'workouts', label: 'Workouts', icon: <Activity size={16} /> },
          { id: 'nutrition', label: 'Nutrition', icon: <Heart size={16} /> },
          { id: 'photos', label: 'Photos', icon: <Camera size={16} /> },
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
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div style={{ padding: '0 1rem' }}>
        {/* Overview Tab */}
        {viewMode === 'overview' && (
          <div>
            {/* Quick Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <StatCard
                icon={<Weight size={24} />}
                value={progressData.weight.current ? `${progressData.weight.current} kg` : '--'}
                label="Current Weight"
                color="#10b981"
                onClick={() => setViewMode('weight')}
                trend={progressData.weight.history.length > 1 
                  ? ((progressData.weight.current - progressData.weight.history[1].weight) / progressData.weight.history[1].weight * 100).toFixed(1)
                  : null}
              />
              
              <StatCard
                icon={<Flame size={24} />}
                value={progressData.workouts.streak}
                label="Day Streak"
                color="#f59e0b"
                onClick={() => setViewMode('workouts')}
              />
              
              <StatCard
                icon={<Heart size={24} />}
                value={`${progressData.nutrition.compliance}%`}
                label="Nutrition"
                color="#ec4899"
                onClick={() => setViewMode('nutrition')}
              />
              
              <StatCard
                icon={<Trophy size={24} />}
                value={progressData.achievements.unlocked.length}
                label="Achievements"
                color="#8b5cf6"
                onClick={() => setViewMode('achievements')}
              />
            </div>
            
            {/* BMI Card */}
            {progressData.weight.bmi && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Activity size={20} style={{ color: '#10b981' }} />
                  BMI Analysis
                </h3>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {progressData.weight.bmi}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: getBMIStatus(progressData.weight.bmi).color
                    }}>
                      {getBMIStatus(progressData.weight.bmi).status}
                    </div>
                  </div>
                  <div style={{
                    width: '150px',
                    height: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (progressData.weight.bmi / 40) * 100)}%`,
                      background: `linear-gradient(90deg, #3b82f6, #10b981, #f59e0b, #ef4444)`
                    }} />
                  </div>
                </div>
              </div>
            )}
            
            {/* Weight Progress Chart */}
            {progressData.weight.history.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <TrendingUp size={20} style={{ color: '#10b981' }} />
                  Weight Trend
                </h3>
                <ProgressChart data={progressData.weight.history} type="weight" />
              </div>
            )}
            
            {/* Recent PRs */}
            {progressData.workouts.prs.length > 0 && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Star size={20} style={{ color: '#f59e0b' }} />
                  Recent PRs
                </h3>
                {progressData.workouts.prs.slice(0, 3).map((pr, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0',
                      borderBottom: index < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                    }}
                  >
                    <span>{pr.name}</span>
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                      {pr.weight}kg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Weight Tab */}
        {viewMode === 'weight' && (
          <div>
            {/* Current Weight Card */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <Weight size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                {progressData.weight.current || '--'} kg
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>
                Current Weight
              </div>
              
              {progressData.weight.goal && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Goal</span>
                    <span style={{ fontWeight: 'bold' }}>{progressData.weight.goal.target_value} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>To Go</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                      {Math.abs(progressData.weight.current - progressData.weight.goal.target_value).toFixed(1)} kg
                    </span>
                  </div>
                  <div style={{
                    marginTop: '0.5rem',
                    height: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      background: '#10b981',
                      width: `${calculateProgress(
                        progressData.weight.current,
                        progressData.weight.goal.start_value,
                        progressData.weight.goal.target_value
                      )}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}
            </div>
            
            {/* Weight Chart */}
            <ProgressChart
              data={progressData.weight.history}
              type="weight"
              fullscreen={fullscreenChart}
            />
            
            {/* Weight History List */}
            <div style={{
              marginTop: '1.5rem',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Clock size={20} style={{ color: '#10b981' }} />
                History
              </h3>
              {progressData.weight.history.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>
                    {entry.weight} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Measurements Tab */}
        {viewMode === 'measurements' && (
          <div>
            {/* Latest Measurements */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Ruler size={20} style={{ color: '#10b981' }} />
                Current Measurements
              </h3>
              
              {progressData.measurements.latest ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem'
                }}>
                  {['chest', 'arms', 'waist', 'hips', 'thighs'].map(part => (
                    <div key={part} style={{
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {progressData.measurements.latest[part] || '--'} cm
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        {part.charAt(0).toUpperCase() + part.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                  No measurements recorded yet
                </p>
              )}
            </div>
            
            {/* Measurements Progress */}
            {progressData.measurements.history.length > 1 && (
              <div>
                {['chest', 'arms', 'waist', 'hips', 'thighs'].map(part => {
                  const partHistory = progressData.measurements.history
                    .filter(m => m[part])
                    .map(m => ({ date: m.date, value: m[part] }))
                  
                  if (partHistory.length < 2) return null
                  
                  return (
                    <div key={part} style={{ marginBottom: '1rem' }}>
                      <h4 style={{
                        fontSize: '0.9rem',
                        marginBottom: '0.5rem',
                        textTransform: 'capitalize'
                      }}>
                        {part}
                      </h4>
                      <ProgressChart data={partHistory} type="value" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Workouts Tab */}
        {viewMode === 'workouts' && (
          <div>
            {/* Workout Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <Flame size={24} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {progressData.workouts.streak}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  Day Streak
                </div>
              </div>
              
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <Activity size={24} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {progressData.workouts.total}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  Total
                </div>
              </div>
              
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <Star size={24} style={{ color: '#8b5cf6', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {progressData.workouts.prs.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  PRs
                </div>
              </div>
            </div>
            
            {/* Week Calendar */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={20} style={{ color: '#10b981' }} />
                This Week
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem'
              }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                  const date = getWeekDates()[index]
                  const hasWorkout = progressData.workouts.weekProgress[date]?.length > 0
                  const isToday = date === new Date().toISOString().split('T')[0]
                  
                  return (
                    <div
                      key={index}
                      style={{
                        background: hasWorkout
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(0, 0, 0, 0.6)',
                        border: isToday
                          ? '2px solid #10b981'
                          : '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: '0.25rem'
                      }}>
                        {day}
                      </div>
                      {hasWorkout ? (
                        <CheckCircle size={20} style={{ color: '#10b981' }} />
                      ) : (
                        <Circle size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Personal Records */}
            {progressData.workouts.prs.length > 0 && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Trophy size={20} style={{ color: '#f59e0b' }} />
                  Personal Records
                </h3>
                {progressData.workouts.prs.map((pr, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{pr.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(pr.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#f59e0b'
                    }}>
                      {pr.weight}kg
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Nutrition Tab */}
        {viewMode === 'nutrition' && (
          <div>
            {/* Compliance Score */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <Heart size={32} style={{ color: '#ec4899', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                {progressData.nutrition.compliance}%
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)' }}>
                Meal Plan Compliance
              </div>
              <div style={{
                marginTop: '1rem',
                height: '8px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #ec4899, #10b981)',
                  width: `${progressData.nutrition.compliance}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
            
            {/* Macros Achievement */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <BarChart3 size={20} style={{ color: '#10b981' }} />
                Macro Targets
              </h3>
              
              {['protein', 'carbs', 'fat'].map(macro => (
                <div key={macro} style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{macro}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {progressData.nutrition.macros[macro]?.current || 0}g / 
                      {progressData.nutrition.macros[macro]?.target || 0}g
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      background: macro === 'protein' ? '#3b82f6' : 
                                 macro === 'carbs' ? '#f59e0b' : '#ec4899',
                      width: `${Math.min(100, 
                        ((progressData.nutrition.macros[macro]?.current || 0) / 
                         (progressData.nutrition.macros[macro]?.target || 1)) * 100)}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Water Intake */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Droplets size={20} style={{ color: '#3b82f6' }} />
                Water Intake
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '0.5rem'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(glass => (
                  <div
                    key={glass}
                    style={{
                      aspectRatio: '1',
                      background: glass <= (progressData.nutrition.waterIntake[0]?.glasses || 0)
                        ? 'rgba(59, 130, 246, 0.3)'
                        : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Droplets size={16} style={{
                      color: glass <= (progressData.nutrition.waterIntake[0]?.glasses || 0)
                        ? '#3b82f6'
                        : 'rgba(255,255,255,0.2)'
                    }} />
                  </div>
                ))}
              </div>
              
              <p style={{
                textAlign: 'center',
                marginTop: '0.5rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                {progressData.nutrition.waterIntake[0]?.glasses || 0} / 8 glasses today
              </p>
            </div>
          </div>
        )}
        
        {/* Photos Tab */}
        {viewMode === 'photos' && (
          <PhotoCompare photos={progressData.photos.all} />
        )}
        
        {/* Achievements Tab */}
        {viewMode === 'achievements' && (
          <div>
            {/* Unlocked Achievements */}
            {progressData.achievements.unlocked.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Trophy size={20} style={{ color: '#10b981' }} />
                  Unlocked ({progressData.achievements.unlocked.length})
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: '1rem'
                }}>
                  {progressData.achievements.unlocked.map((achievement, index) => (
                    <AchievementCard
                      key={index}
                      achievement={achievement}
                      unlocked={true}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Pending Achievements */}
            {progressData.achievements.pending.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '1.1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Lock size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  In Progress ({progressData.achievements.pending.length})
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: '1rem'
                }}>
                  {progressData.achievements.pending.map((achievement, index) => (
                    <AchievementCard
                      key={index}
                      achievement={achievement}
                      unlocked={false}
                      progress={Math.random() * 80} // Mock progress
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Floating Action Button (Mobile) */}
      {isMobile && (
        <button
          onClick={() => setShowQuickAdd(true)}
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
      
      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModal
          type={quickAddType}
          onSave={handleQuickAdd}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
      
      {/* Fullscreen Chart Modal */}
      {fullscreenChart && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000
        }}>
          <div style={{
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ color: '#fff' }}>Weight Progress</h3>
            <button
              onClick={() => setFullscreenChart(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <X size={20} style={{ color: '#fff' }} />
            </button>
          </div>
          <div style={{ flex: 1, padding: '1rem' }}>
            <ProgressChart
              data={progressData.weight.history}
              type="weight"
              fullscreen={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
