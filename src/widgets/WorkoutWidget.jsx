import React, { useState } from 'react'
import { Activity, Flame, Play, CheckCircle, ChevronRight } from 'lucide-react'

export default function WorkoutWidget({ client, db, onNavigate }) {
  const [workoutData, setWorkoutData] = useState({
    todayCompleted: false,
    todayWorkout: null,
    streak: 0,
    weekProgress: 0
  })
  const [loading, setLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isMobile = window.innerWidth <= 768

  const widgetConfig = {
    key: 'workouts',
    gradient: 'linear-gradient(135deg, rgba(146, 64, 14, 0.9) 0%, rgba(249, 115, 22, 0.9) 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(146, 64, 14, 0.15) 100%)',
    color: '#f97316',
    label: 'Training'
  }

  React.useEffect(() => {
    loadWorkoutData()
  }, [client?.id, db])

  const loadWorkoutData = async () => {
    if (!client?.id || !db) return

    try {
      setLoading(true)
      
      const [todayWorkout, recentWorkouts, weeklyCount] = await Promise.allSettled([
        db.getTodayWorkout?.(client.id),
        db.getRecentWorkouts?.(client.id, 14),
        db.getWeeklyWorkoutCount?.(client.id)
      ])

      const today = todayWorkout.status === 'fulfilled' ? todayWorkout.value : null
      const recent = recentWorkouts.status === 'fulfilled' ? (recentWorkouts.value || []) : []
      const weekCount = weeklyCount.status === 'fulfilled' ? (weeklyCount.value || 0) : 0

      // Check if today's workout is completed
      const todayCompleted = recent.some(w => {
        const workoutDate = new Date(w.date || w.workout_date)
        const today = new Date()
        return workoutDate.toDateString() === today.toDateString() && w.completed
      })

      // Calculate streak (simplified)
      let streak = 0
      const sortedWorkouts = recent
        .filter(w => w.completed)
        .sort((a, b) => new Date(b.date || b.workout_date) - new Date(a.date || a.workout_date))

      for (let i = 0; i < sortedWorkouts.length; i++) {
        const workoutDate = new Date(sortedWorkouts[i].date || sortedWorkouts[i].workout_date)
        const expectedDate = new Date()
        expectedDate.setDate(expectedDate.getDate() - i)
        
        const dayDiff = Math.abs((expectedDate - workoutDate) / (1000 * 60 * 60 * 24))
        if (dayDiff <= 1.5) { // Allow some flexibility
          streak++
        } else {
          break
        }
      }

      setWorkoutData({
        todayCompleted,
        todayWorkout: today,
        streak,
        weekProgress: Math.min(100, (weekCount / 3) * 100) // Assume 3 workouts per week target
      })

    } catch (error) {
      console.error('Error loading workout data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartWorkout = () => {
    // Navigate to workout page or start workout flow
    onNavigate?.('workouts')
  }

  const getWorkoutTitle = () => {
    if (workoutData.todayCompleted) return "Workout Voltooid!"
    if (workoutData.todayWorkout) return workoutData.todayWorkout.name || "Vandaag's Workout"
    return "Geen workout ingepland"
  }

  const getWorkoutSubtext = () => {
    if (workoutData.todayCompleted) return "Goed gedaan! Zie voortgang"
    if (workoutData.todayWorkout) return "Tijd om te trainen"
    return "Plan een workout in"
  }

  const getActionButton = () => {
    if (workoutData.todayCompleted) {
      return {
        label: "Bekijk",
        icon: <CheckCircle size={16} />,
        color: '#10b981'
      }
    }
    if (workoutData.todayWorkout) {
      return {
        label: "Start",
        icon: <Play size={16} />,
        color: '#f97316'
      }
    }
    return {
      label: "Plan",
      icon: <Activity size={16} />,
      color: '#6b7280'
    }
  }

  const action = getActionButton()

  return (
    <button
      onClick={() => onNavigate?.('workouts')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? widgetConfig.gradient : widgetConfig.lightGradient,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isHovered ? widgetConfig.color + '40' : 'rgba(249, 115, 22, 0.15)'}`,
        borderRadius: '16px',
        padding: isMobile ? '1.25rem' : '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? `0 15px 40px ${widgetConfig.color}25` 
          : `0 10px 30px rgba(0, 0, 0, 0.1)`,
        minHeight: '140px',
        width: '100%',
        display: 'block'
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)'
          e.currentTarget.style.background = widgetConfig.gradient
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.background = widgetConfig.lightGradient
        }
      }}
    >
      {/* Decorative circle background */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: widgetConfig.gradient,
        opacity: 0.1
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Category-style label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <Activity size={16} color={widgetConfig.color} />
          <span style={{ 
            fontSize: '0.75rem', 
            color: widgetConfig.color,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {widgetConfig.label}
          </span>
        </div>

        {/* Main content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.35rem',
              lineHeight: 1.2
            }}>
              {getWorkoutTitle()}
            </div>
            
            <div style={{
              fontSize: '0.75rem',
              color: isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)',
              marginBottom: '0.5rem'
            }}>
              {getWorkoutSubtext()}
            </div>

            {/* Week Progress Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.5)',
                minWidth: '35px'
              }}>
                Week:
              </div>
              <div style={{
                flex: 1,
                height: '4px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
                maxWidth: '80px'
              }}>
                <div style={{
                  height: '100%',
                  background: widgetConfig.color,
                  width: `${workoutData.weekProgress}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: widgetConfig.color,
                fontWeight: '500',
                minWidth: '30px'
              }}>
                {Math.round(workoutData.weekProgress)}%
              </div>
            </div>
          </div>

          {/* Action Icon Box */}
          <div style={{
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${action.color}30 0%, ${action.color}10 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {React.cloneElement(action.icon, {
              size: isMobile ? 20 : 22,
              color: action.color,
              style: {
                animation: isHovered ? 'iconBounce 0.6s ease' : 'none'
              }
            })}
          </div>
        </div>

        {/* Streak Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          background: `rgba(249, 115, 22, ${isHovered ? '0.2' : '0.1'})`,
          borderRadius: '8px',
          marginBottom: '0.5rem',
          transition: 'background 0.3s ease'
        }}>
          <Flame 
            size={14} 
            style={{ 
              color: workoutData.streak > 0 ? widgetConfig.color : 'rgba(255,255,255,0.3)',
              animation: workoutData.streak > 0 && isHovered ? 'flameDance 0.8s ease infinite' : 'none'
            }} 
          />
          <div style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: workoutData.streak > 0 ? widgetConfig.color : 'rgba(255,255,255,0.5)'
          }}>
            {workoutData.streak > 0 ? (
              `${workoutData.streak} dag${workoutData.streak > 1 ? 'en' : ''} streak!`
            ) : (
              'Start je streak vandaag'
            )}
          </div>
        </div>

        {/* Bottom action hint */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.6)'
          }}>
            {workoutData.todayCompleted 
              ? 'Bekijk workout details' 
              : 'Open workout schema'
            }
          </div>
          <ChevronRight 
            size={16} 
            color={isHovered ? '#fff' : widgetConfig.color}
            style={{ 
              opacity: isHovered ? 0.9 : 0.7,
              transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
              transition: 'all 0.3s ease'
            }} 
          />
        </div>
      </div>

      <style>{`
        @keyframes iconBounce {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        
        @keyframes flameDance {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          25% { transform: scale(1.1) rotate(2deg); }
          75% { transform: scale(0.9) rotate(-1deg); }
        }
      `}</style>
    </button>
  )
}
