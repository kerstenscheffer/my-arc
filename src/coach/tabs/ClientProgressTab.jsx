// src/coach/tabs/ClientProgressTab.jsx
// Enhanced Progress Tracking met ALLE DatabaseService methods
// MY ARC - Kersten 2025

import { useState, useEffect, useCallback } from 'react'

export default function ClientProgressTab({ client, db }) {
  // ===== STATE MANAGEMENT =====
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('overview')
  const [timeRange, setTimeRange] = useState(30) // days
  
  // Progress Data States
  const [progressData, setProgressData] = useState({
    weight: { history: [], current: null, goal: null, trend: null },
    measurements: { history: [], latest: {} },
    workouts: { 
      completions: [], 
      progress: [], 
      prs: [], 
      weekProgress: {},
      streak: 0,
      weeklyCount: 0
    },
    nutrition: {
      history: [],
      todayProgress: {},
      compliance: {},
      waterIntake: []
    },
    photos: { all: [], latest: null },
    goals: { active: [], completed: [], progress: {} },
    achievements: { unlocked: [], pending: [] },
    analytics: { score: 0, categoryProgress: [] }
  })

  // Quick Add States
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddType, setQuickAddType] = useState('weight')
  const [quickAddData, setQuickAddData] = useState({})

  // ===== LOAD ALL PROGRESS DATA =====
  useEffect(() => {
    if (client?.id) {
      loadCompleteProgressData()
    }
  }, [client, timeRange])

  const loadCompleteProgressData = useCallback(async () => {
    if (!client?.id || !db) return
    
    try {
      setLoading(true)
      
      // Load ALL progress data in parallel for performance
      const [
        // Weight & Body
        weightHistory,
        measurements,
        
        // Workouts
        workoutCompletions,
        workoutProgress,
        todayWorkout,
        recentWorkouts,
        streak,
        weeklyCount,
        
        // Nutrition
        mealHistory,
        todayMeals,
        mealCompliance,
        waterHistory,
        
        // Photos
        photos,
        
        // Goals & Achievements
        goals,
        goalsWithProgress,
        categoryProgress,
        achievements,
        
        // Overall
        myArcScore
      ] = await Promise.all([
        // Weight & Measurements
        db.getWeightHistory(client.id, timeRange),
        db.getMeasurementsHistory(client.id, timeRange),
        
        // Workouts
        db.getWorkoutCompletions(client.id),
        db.getWorkoutProgress(client.id, timeRange),
        db.getTodayWorkout(client.id),
        db.getRecentWorkouts(client.id, 7),
        db.getClientStreak(client.id),
        db.getWeeklyWorkoutCount(client.id),
        
        // Nutrition
        db.getMealHistory(client.id, timeRange),
        db.getTodaysMealProgress(client.id),
        db.getMealCompliance(client.id, timeRange),
        db.getWaterIntakeRange(
          client.id,
          new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ),
        
        // Photos
        db.getProgressPhotos(client.id),
        
        // Goals & Achievements
        db.getClientGoals(client.id),
        db.getClientGoalsWithProgress(client.id),
        db.getAllCategoriesProgress(client.id),
        db.getAchievements(client.id),
        
        // Overall Score
        db.getMyArcScore(client.id)
      ])

      // Process and structure all data
      setProgressData({
        weight: {
          history: weightHistory || [],
          current: weightHistory?.[0]?.weight || client.current_weight,
          goal: client.goal_weight,
          trend: calculateTrend(weightHistory)
        },
        measurements: {
          history: measurements || [],
          latest: measurements?.[0] || {}
        },
        workouts: {
          completions: workoutCompletions || [],
          progress: workoutProgress?.exercises || [],
          prs: workoutProgress?.prs || [],
          weekProgress: workoutProgress?.weekProgress || {},
          todayWorkout,
          recentWorkouts: recentWorkouts || [],
          streak: streak || 0,
          weeklyCount: weeklyCount || 0
        },
        nutrition: {
          history: mealHistory || [],
          todayProgress: todayMeals || {},
          compliance: mealCompliance || {},
          waterIntake: waterHistory || []
        },
        photos: {
          all: photos || [],
          latest: photos?.[0] || null
        },
        goals: {
          active: goals?.filter(g => g.status === 'active') || [],
          completed: goals?.filter(g => g.status === 'completed') || [],
          withProgress: goalsWithProgress || [],
          categoryProgress: categoryProgress || []
        },
        achievements: {
          unlocked: achievements || [],
          pending: [] // Calculate based on conditions
        },
        analytics: {
          score: myArcScore || 0,
          categoryProgress: categoryProgress || []
        }
      })
      
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setLoading(false)
    }
  }, [client, timeRange, db])

  // ===== HELPER FUNCTIONS =====
  const calculateTrend = (history) => {
    if (!history || history.length < 2) return 'stable'
    const recent = history[0]?.weight
    const previous = history[Math.min(7, history.length - 1)]?.weight
    if (recent < previous) return 'down'
    if (recent > previous) return 'up'
    return 'stable'
  }

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈'
    if (trend === 'down') return '📉'
    return '➡️'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short'
    })
  }

  // ===== QUICK ADD HANDLERS =====
  const handleQuickAdd = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      switch (quickAddType) {
        case 'weight':
          await db.saveWeight(client.id, quickAddData.weight, today)
          break
        
        case 'measurements':
          await db.saveMeasurements(client.id, quickAddData, today)
          break
        
        case 'workout':
          await db.markWorkoutComplete(
            client.id,
            today,
            quickAddData.duration,
            quickAddData.notes
          )
          break
        
        case 'photo':
          // Handle photo upload
          alert('Photo upload coming soon!')
          break
      }
      
      // Reload data
      await loadCompleteProgressData()
      setShowQuickAdd(false)
      setQuickAddData({})
      
    } catch (error) {
      console.error('Error adding progress:', error)
      alert('Failed to save progress')
    }
  }

  // ===== RENDER HELPERS =====
  const renderWeightChart = () => {
    const maxWeight = Math.max(...progressData.weight.history.map(w => w.weight))
    const minWeight = Math.min(...progressData.weight.history.map(w => w.weight))
    const range = maxWeight - minWeight || 1
    
    return (
      <div style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h4 style={{ color: '#10b981', marginBottom: '16px' }}>Weight Progress</h4>
        
        {/* Current Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>Current</div>
            <div style={{ color: '#f3f4f6', fontSize: '24px', fontWeight: 'bold' }}>
              {progressData.weight.current || '-'} kg
            </div>
          </div>
          <div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>Goal</div>
            <div style={{ color: '#f3f4f6', fontSize: '24px', fontWeight: 'bold' }}>
              {progressData.weight.goal || '-'} kg
            </div>
          </div>
          <div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>Trend</div>
            <div style={{ fontSize: '24px' }}>
              {getTrendIcon(progressData.weight.trend)}
            </div>
          </div>
        </div>
        
        {/* Simple Chart */}
        <div style={{
          height: '200px',
          position: 'relative',
          borderLeft: '2px solid #374151',
          borderBottom: '2px solid #374151',
          padding: '10px'
        }}>
          {progressData.weight.history.slice(0, 10).reverse().map((entry, index) => {
            const height = ((entry.weight - minWeight) / range) * 180
            return (
              <div
                key={entry.date}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: `${index * 10}%`,
                  width: '8%',
                  height: `${height}px`,
                  background: '#10b981',
                  borderRadius: '4px 4px 0 0',
                  cursor: 'pointer'
                }}
                title={`${entry.weight}kg - ${formatDate(entry.date)}`}
              />
            )
          })}
        </div>
      </div>
    )
  }

  const renderMeasurements = () => {
    const latest = progressData.measurements.latest || {}
    
    return (
      <div style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h4 style={{ color: '#10b981', marginBottom: '16px' }}>Body Measurements</h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px'
        }}>
          {[
            { label: 'Chest', value: latest.chest, unit: 'cm' },
            { label: 'Arms', value: latest.arms, unit: 'cm' },
            { label: 'Waist', value: latest.waist, unit: 'cm' },
            { label: 'Hips', value: latest.hips, unit: 'cm' },
            { label: 'Thighs', value: latest.thighs, unit: 'cm' }
          ].map(item => (
            <div key={item.label} style={{
              background: '#0f172a',
              padding: '12px',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ color: '#f3f4f6', fontSize: '20px', fontWeight: 'bold' }}>
                {item.value || '-'} {item.value && item.unit}
              </div>
            </div>
          ))}
        </div>
        
        {latest.date && (
          <div style={{ marginTop: '12px', color: '#6b7280', fontSize: '12px' }}>
            Last updated: {formatDate(latest.date)}
          </div>
        )}
      </div>
    )
  }

  const renderWorkoutProgress = () => {
    return (
      <div style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h4 style={{ color: '#10b981', marginBottom: '16px' }}>Workout Performance</h4>
        
        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            padding: '16px',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>🔥</div>
            <div style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 'bold' }}>
              {progressData.workouts.streak}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>Day Streak</div>
          </div>
          
          <div style={{
            background: '#0f172a',
            padding: '16px',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>💪</div>
            <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>
              {progressData.workouts.weeklyCount}/3
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>This Week</div>
          </div>
          
          <div style={{
            background: '#0f172a',
            padding: '16px',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>🏆</div>
            <div style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}>
              {progressData.workouts.prs.length}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>PRs</div>
          </div>
        </div>
        
        {/* Week Progress */}
        <div>
          <h5 style={{ color: '#d1d5db', marginBottom: '12px' }}>This Week</h5>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const date = new Date()
              date.setDate(date.getDate() - date.getDay() + index + 1)
              const dateStr = date.toISOString().split('T')[0]
              const completed = progressData.workouts.weekProgress[dateStr]
              
              return (
                <div
                  key={day}
                  style={{
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: completed ? '#10b981' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 4px',
                    color: 'white'
                  }}>
                    {completed ? '✓' : ''}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{day}</div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Recent PRs */}
        {progressData.workouts.prs.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h5 style={{ color: '#d1d5db', marginBottom: '12px' }}>Recent PRs 🏆</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {progressData.workouts.prs.slice(0, 3).map((pr, index) => (
                <div
                  key={index}
                  style={{
                    background: '#0f172a',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ color: '#d1d5db' }}>{pr.name}</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                    {pr.weight} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderNutritionCompliance = () => {
    const compliance = progressData.nutrition.compliance
    const todayProgress = progressData.nutrition.todayProgress
    
    return (
      <div style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h4 style={{ color: '#10b981', marginBottom: '16px' }}>Nutrition Tracking</h4>
        
        {/* Today's Progress */}
        <div style={{ marginBottom: '20px' }}>
          <h5 style={{ color: '#d1d5db', marginBottom: '12px' }}>Today</h5>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            <div style={{
              background: '#0f172a',
              padding: '12px',
              borderRadius: '6px'
            }}>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
                Calories
              </div>
              <div style={{ color: '#f3f4f6', fontSize: '18px', fontWeight: 'bold' }}>
                {todayProgress.calories || 0} / {todayProgress.target_calories || 2000}
              </div>
              <div style={{
                height: '4px',
                background: '#374151',
                borderRadius: '2px',
                marginTop: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (todayProgress.calories / todayProgress.target_calories) * 100)}%`,
                  background: '#10b981'
                }} />
              </div>
            </div>
            
            <div style={{
              background: '#0f172a',
              padding: '12px',
              borderRadius: '6px'
            }}>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
                Protein
              </div>
              <div style={{ color: '#f3f4f6', fontSize: '18px', fontWeight: 'bold' }}>
                {todayProgress.protein || 0}g / {todayProgress.target_protein || 150}g
              </div>
              <div style={{
                height: '4px',
                background: '#374151',
                borderRadius: '2px',
                marginTop: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (todayProgress.protein / todayProgress.target_protein) * 100)}%`,
                  background: '#3b82f6'
                }} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Compliance Score */}
        <div style={{
          background: '#0f172a',
          padding: '16px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#9ca3af', marginBottom: '8px' }}>
            {timeRange} Day Average Compliance
          </div>
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: compliance.average >= 80 ? '#10b981' : 
                   compliance.average >= 60 ? '#f59e0b' : '#ef4444'
          }}>
            {compliance.average || 0}%
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginTop: '16px'
          }}>
            <div>
              <div style={{ color: '#6b7280', fontSize: '11px' }}>Calories</div>
              <div style={{ color: '#d1d5db', fontWeight: 'bold' }}>
                {compliance.kcal_compliance || 0}%
              </div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: '11px' }}>Protein</div>
              <div style={{ color: '#d1d5db', fontWeight: 'bold' }}>
                {compliance.protein_compliance || 0}%
              </div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: '11px' }}>Streak</div>
              <div style={{ color: '#d1d5db', fontWeight: 'bold' }}>
                {compliance.current_streak || 0} days
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderGoalsProgress = () => {
    const activeGoals = progressData.goals.active || []
    const categoryProgress = progressData.goals.categoryProgress || []
    
    return (
      <div style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h4 style={{ color: '#10b981', marginBottom: '16px' }}>Goals Progress</h4>
        
        {/* Category Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {categoryProgress.map(cat => (
            <div
              key={cat.category}
              style={{
                background: '#0f172a',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                {cat.category === 'herstel' ? '🧘' :
                 cat.category === 'mindset' ? '🧠' :
                 cat.category === 'workout' ? '💪' :
                 cat.category === 'voeding' ? '🥗' : '📋'}
              </div>
              <div style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
                {cat.averageProgress}%
              </div>
              <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                {cat.totalGoals} goals
              </div>
            </div>
          ))}
        </div>
        
        {/* Active Goals List */}
        <div>
          <h5 style={{ color: '#d1d5db', marginBottom: '12px' }}>
            Active Goals ({activeGoals.length})
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeGoals.slice(0, 5).map(goal => {
              const progress = goal.target_value > 0 
                ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                : 0
                
              return (
                <div
                  key={goal.id}
                  style={{
                    background: '#0f172a',
                    padding: '12px',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ color: '#f3f4f6' }}>{goal.title}</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: '#374151',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: progress >= 80 ? '#10b981' : 
                                  progress >= 50 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderProgressPhotos = () => {
    const photos = progressData.photos.all || []
    
    return (
      <div style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h4 style={{ color: '#10b981' }}>Progress Photos</h4>
          <button
            onClick={() => {
              setQuickAddType('photo')
              setShowQuickAdd(true)
            }}
            style={{
              padding: '6px 12px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            + Add Photo
          </button>
        </div>
        
        {photos.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            No progress photos yet
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '12px'
          }}>
            {photos.slice(0, 8).map(photo => (
              <div
                key={photo.id}
                style={{
                  aspectRatio: '1',
                  background: '#0f172a',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {photo.photo_url ? (
                  <img
                    src={photo.photo_url}
                    alt="Progress"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px'
                  }}>
                    📸
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0, 0, 0, 0.7)',
                  padding: '4px',
                  fontSize: '11px',
                  color: '#d1d5db',
                  textAlign: 'center'
                }}>
                  {formatDate(photo.date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ===== RENDER LOADING =====
  if (loading) {
    return (
      <div className="myarc-loading-container">
        <div className="myarc-spinner"></div>
        <p>Loading progress data...</p>
      </div>
    )
  }

  // ===== MAIN RENDER =====
  return (
    <div className="myarc-progress-container" style={{ padding: '20px' }}>
      {/* Header with Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#f3f4f6' }}>
          Progress Tracking - {client.first_name} {client.last_name}
        </h2>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px'
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          
          {/* Quick Add Button */}
          <button
            onClick={() => setShowQuickAdd(true)}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            + Quick Add
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={loadCompleteProgressData}
            style={{
              padding: '8px 16px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '2px solid #1e293b',
        paddingBottom: '12px'
      }}>
        {['overview', 'body', 'workouts', 'nutrition', 'goals', 'photos'].map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            style={{
              padding: '8px 16px',
              background: activeView === view ? '#10b981' : 'transparent',
              color: activeView === view ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Content Based on View */}
      {activeView === 'overview' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {renderWeightChart()}
          {renderWorkoutProgress()}
          {renderNutritionCompliance()}
          {renderGoalsProgress()}
        </div>
      )}

      {activeView === 'body' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {renderWeightChart()}
          {renderMeasurements()}
        </div>
      )}

      {activeView === 'workouts' && renderWorkoutProgress()}
      {activeView === 'nutrition' && renderNutritionCompliance()}
      {activeView === 'goals' && renderGoalsProgress()}
      {activeView === 'photos' && renderProgressPhotos()}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0f172a',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ color: '#f3f4f6', marginBottom: '20px' }}>Quick Add Progress</h3>
            
            {/* Type Selector */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px'
            }}>
              {['weight', 'measurements', 'workout', 'photo'].map(type => (
                <button
                  key={type}
                  onClick={() => setQuickAddType(type)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: quickAddType === type ? '#10b981' : '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {/* Input Fields */}
            {quickAddType === 'weight' && (
              <div>
                <label style={{ color: '#d1d5db', display: 'block', marginBottom: '8px' }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={quickAddData.weight || ''}
                  onChange={(e) => setQuickAddData({ weight: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#1e293b',
                    color: 'white',
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
              </div>
            )}
            
            {quickAddType === 'measurements' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['chest', 'arms', 'waist', 'hips', 'thighs'].map(part => (
                  <div key={part}>
                    <label style={{ color: '#d1d5db', display: 'block', marginBottom: '4px', textTransform: 'capitalize' }}>
                      {part} (cm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={quickAddData[part] || ''}
                      onChange={(e) => setQuickAddData({
                        ...quickAddData,
                        [part]: e.target.value
                      })}
                      style={{
                        width: '100%',
                        padding: '6px',
                        background: '#1e293b',
                        color: 'white',
                        border: '1px solid #374151',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {quickAddType === 'workout' && (
              <div>
                <label style={{ color: '#d1d5db', display: 'block', marginBottom: '8px' }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={quickAddData.duration || ''}
                  onChange={(e) => setQuickAddData({
                    ...quickAddData,
                    duration: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#1e293b',
                    color: 'white',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    marginBottom: '12px'
                  }}
                />
                <label style={{ color: '#d1d5db', display: 'block', marginBottom: '8px' }}>
                  Notes
                </label>
                <textarea
                  value={quickAddData.notes || ''}
                  onChange={(e) => setQuickAddData({
                    ...quickAddData,
                    notes: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#1e293b',
                    color: 'white',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    minHeight: '80px'
                  }}
                />
              </div>
            )}
            
            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '20px'
            }}>
              <button
                onClick={handleQuickAdd}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false)
                  setQuickAddData({})
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
