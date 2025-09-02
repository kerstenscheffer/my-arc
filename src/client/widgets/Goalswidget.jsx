import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react'
import { 
  Target, ChevronRight, Plus, TrendingUp, Trophy,
  Moon, Brain, Dumbbell, Apple, Calendar,
  Sparkles, ArrowRight, Zap, CheckCircle, BarChart3
} from 'lucide-react'

// Category configuration with subtle styling
const categoryConfig = {
  herstel: { 
    name: 'Herstel',
    color: '#60a5fa', 
    icon: Moon,
    gradient: 'linear-gradient(135deg, rgba(30, 64, 175, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(30, 64, 175, 0.15) 100%)'
  },
  mindset: { 
    name: 'Mindset',
    color: '#ef4444', 
    icon: Brain,
    gradient: 'linear-gradient(135deg, rgba(153, 27, 27, 0.9) 0%, rgba(239, 68, 68, 0.9) 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(153, 27, 27, 0.15) 100%)'
  },
  workout: { 
    name: 'Workout',
    color: '#f59e0b', 
    icon: Dumbbell,
    gradient: 'linear-gradient(135deg, rgba(146, 64, 14, 0.9) 0%, rgba(245, 158, 11, 0.9) 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(146, 64, 14, 0.15) 100%)'
  },
  voeding: { 
    name: 'Voeding',
    color: '#10b981', 
    icon: Apple,
    gradient: 'linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0.15) 100%)'
  },
  structuur: { 
    name: 'Structuur',
    color: '#8b5cf6', 
    icon: Calendar,
    gradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(88, 28, 135, 0.15) 100%)'
  }
}

// Helper to get Dutch date info
const getDutchDateInfo = () => {
  const today = new Date()
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december']
  
  const dayName = days[today.getDay()]
  const date = today.getDate()
  const monthName = months[today.getMonth()]
  const weekNumber = Math.ceil((today.getDate() + new Date(today.getFullYear(), today.getMonth(), 1).getDay()) / 7)
  
  return {
    full: `${dayName}, ${date} ${monthName}`,
    week: `Week ${weekNumber}`,
    day: dayName,
    date: date,
    month: monthName
  }
}

export default function GoalsWidget({ client, db, onNavigateToGoals }) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [weeklyProgress, setWeeklyProgress] = useState({})
  const [completedCount, setCompletedCount] = useState(0)
  const [totalGoals, setTotalGoals] = useState(0)
  const dateInfo = getDutchDateInfo()
  const isMobile = useIsMobile()
  
  useEffect(() => {
    if (client?.id && db) {
      loadGoals()
    }
  }, [client?.id])
  
  const loadGoals = async () => {
    setLoading(true)
    try {
      // Load all goals to get counts
      const allGoals = await db.getClientGoals(client.id)
      const activeGoals = allGoals.filter(g => g.status === 'active')
      const completed = allGoals.filter(g => g.status === 'completed').length
      
      setTotalGoals(allGoals.length)
      setGoals(activeGoals.slice(0, 2)) // Only show first 2
      setCompletedCount(completed)
      
      // Load weekly progress for checkbox goals
      if (db.loadWeeklyProgress) {
        const progress = await db.loadWeeklyProgress(client.id)
        setWeeklyProgress(progress)
      }
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const calculateProgress = (goal) => {
    if (!goal.target_value) return 0
    const progress = (goal.current_value / goal.target_value) * 100
    return Math.min(100, Math.round(progress))
  }
  
  const getDaysRemaining = (targetDate) => {
    const target = new Date(targetDate)
    const today = new Date()
    const diff = target - today
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }
  
  const renderProgressRing = (progress, color, size = 52) => {
    const strokeWidth = 4
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference
    
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease'
            }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          color: color
        }}>
          {progress}%
        </div>
      </div>
    )
  }
  
  // Loading state - ZONDER WRAPPER
  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
        borderRadius: '20px',
        padding: '1.5rem',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }
  
  // No goals state - DIRECT DE CARD
  if (goals.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
        borderRadius: '20px',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
      }}
      onClick={onNavigateToGoals}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 15px 40px rgba(59, 130, 246, 0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)'
      }}
      >
        {/* Title */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
            margin: 0
          }}>
            MIJN DOELEN
          </h3>
        </div>

        {/* Content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: isMobile ? '44px' : '48px',
            height: isMobile ? '44px' : '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)'
          }}>
            <Sparkles size={isMobile ? 20 : 24} color="#fff" />
          </div>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              Start je transformatie!
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              margin: 0
            }}>
              Stel doelen in 5 categorieën
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#3b82f6',
          fontWeight: '600',
          fontSize: isMobile ? '0.85rem' : '0.9rem'
        }}>
          <span>Klik om te beginnen</span>
          <ArrowRight size={isMobile ? 14 : 16} />
        </div>
      </div>
    )
  }
  
  // Main widget with goals - ZONDER CONTAINER, DIRECT DE CONTENT
  return (
    <>
      {/* Title met stats bar GECOMBINEERD */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: '600',
          margin: 0,
          marginBottom: '0.75rem'
        }}>
          MIJN DOELEN
        </h3>
        
        {/* Stats bar - DONKERDER BLAUW */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0.65rem' : '0.75rem',
          paddingRight: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #1e3a8a 100%)',
          borderRadius: '14px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 4px 15px rgba(37, 99, 235, 0.25)'
        }}
        onClick={onNavigateToGoals}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(37, 99, 235, 0.2)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.25)'
          }
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.25)'
          }
        }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '1.2rem' : '1.5rem'
          }}>
            <div>
              <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 'bold', color: '#fff' }}>
                {goals.length}
              </div>
              <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255,255,255,0.8)' }}>
                Actief
              </div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 'bold', color: '#fff' }}>
                {completedCount}
              </div>
              <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255,255,255,0.8)' }}>
                Voltooid
              </div>
            </div>
            <div style={{
              padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.6rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: '#fff',
              fontWeight: '600'
            }}>
              {dateInfo.week}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600'
          }}>
            <span>Alle doelen</span>
            <ArrowRight size={isMobile ? 12 : 14} />
          </div>
        </div>
      </div>
      
      {/* Goal cards - VOLLEDIGE BREEDTE */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : (goals.length === 1 ? '1fr' : 'repeat(2, 1fr)'),
        gap: '1rem'
      }}>
        {goals.map((goal) => {
          const category = categoryConfig[goal.category || goal.main_category] || categoryConfig.structuur
          const Icon = category.icon
          const progress = calculateProgress(goal)
          const daysLeft = getDaysRemaining(goal.target_date)
          const checkedDays = weeklyProgress[goal.id] || []
          
          return (
            <div key={goal.id} style={{
              background: category.lightGradient,
              borderRadius: '16px',
              padding: isMobile ? '1rem' : '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '140px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onClick={onNavigateToGoals}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
                e.currentTarget.style.background = category.gradient
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.background = category.lightGradient
              }
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.background = category.gradient
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.background = category.lightGradient
              }
            }}
            >
              {/* Subtle background decoration */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: category.gradient,
                opacity: 0.1
              }} />
              
              {/* Category label */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <Icon size={isMobile ? 14 : 16} color={category.color} />
                <span style={{ 
                  fontSize: isMobile ? '0.7rem' : '0.75rem', 
                  color: category.color,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {category.name}
                </span>
              </div>
              
              {/* Goal content */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{ flex: 1, marginRight: '0.75rem' }}>
                  <div style={{ 
                    fontSize: isMobile ? '0.95rem' : '1rem', 
                    fontWeight: '700',
                    marginBottom: '0.35rem',
                    color: '#fff'
                  }}>
                    {goal.title}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem', 
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    {goal.measurement_type === 'checkbox' 
                      ? `${checkedDays.length} / ${goal.frequency_target} dagen`
                      : `${goal.current_value || 0} / ${goal.target_value} ${goal.unit}`
                    }
                  </div>
                </div>
                
                {/* Progress ring */}
                {renderProgressRing(progress, '#fff', isMobile ? 48 : 52)}
              </div>
              
              {/* Footer with days remaining */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  padding: isMobile ? '0.3rem 0.6rem' : '0.35rem 0.7rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: '#fff',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Calendar size={isMobile ? 10 : 12} />
                  {daysLeft > 0 
                    ? `${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagen'} te gaan`
                    : daysLeft === 0 
                    ? 'Vandaag deadline!'
                    : 'Voltooid'}
                </div>
                <ChevronRight size={isMobile ? 14 : 16} color="#fff" style={{ opacity: 0.7 }} />
              </div>
            </div>
          )
        })}
        
        {/* Add goal card if only 1 goal */}
        {goals.length === 1 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(88, 28, 135, 0.1) 100%)',
            borderRadius: '16px',
            padding: isMobile ? '1rem' : '1.25rem',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            minHeight: '140px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onClick={onNavigateToGoals}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(88, 28, 135, 0.15) 100%)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(88, 28, 135, 0.1) 100%)'
            }
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(88, 28, 135, 0.15) 100%)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(88, 28, 135, 0.1) 100%)'
            }
          }}
          >
            <div style={{
              width: isMobile ? '44px' : '48px',
              height: isMobile ? '44px' : '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(88, 28, 135, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={isMobile ? 20 : 24} color="#8b5cf6" />
            </div>
            <div style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              Voeg doel toe
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Style for animations
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`
if (typeof document !== 'undefined' && !document.querySelector('#goals-widget-styles')) {
  style.id = 'goals-widget-styles'
  document.head.appendChild(style)
}
