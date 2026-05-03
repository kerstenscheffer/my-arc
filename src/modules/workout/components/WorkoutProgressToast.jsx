// src/modules/workout/components/WorkoutProgressToast.jsx
// 🏆 GOLD THEME - Compact progress insights toast
import { useState, useEffect } from 'react'
import { TrendingUp, X, Flame, Target, Zap, ChevronRight } from 'lucide-react'

export default function WorkoutProgressToast({ client, db, onViewChart }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [insight, setInsight] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if dismissed today
    const dismissedDate = localStorage.getItem('workout_toast_dismissed')
    const today = new Date().toDateString()
    
    if (dismissedDate === today) {
      return
    }

    // Load and analyze workout data
    analyzeProgress()
  }, [client?.id])

  const analyzeProgress = async () => {
    if (!client?.id || !db) return

    try {
      // Get last 30 days of workout data
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const { data: sessions, error: sessionsError } = await db.supabase
        .from('workout_sessions')
        .select('id, completed_at')
        .eq('client_id', client.id)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: false })

      if (sessionsError || !sessions || sessions.length === 0) {
        return
      }

      const sessionIds = sessions.map(s => s.id)

      // Get all progress records
      const { data: progressData, error: progressError } = await db.supabase
        .from('workout_progress')
        .select('*')
        .in('session_id', sessionIds)

      if (progressError || !progressData || progressData.length === 0) {
        return
      }

      // Analyze for insights
      const insights = []

      // 1. Check for PR (Personal Record) - biggest weight increase
      const exerciseProgress = {}
      progressData.forEach(record => {
        const exercise = record.exercise_name
        const sets = Array.isArray(record.sets) ? record.sets : []
        const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0), 0)
        
        if (!exerciseProgress[exercise]) {
          exerciseProgress[exercise] = []
        }
        
        exerciseProgress[exercise].push({
          date: sessions.find(s => s.id === record.session_id)?.completed_at,
          maxWeight
        })
      })

      // Find biggest improvement
      let biggestImprovement = null
      Object.entries(exerciseProgress).forEach(([exercise, records]) => {
        if (records.length < 2) return
        
        records.sort((a, b) => new Date(a.date) - new Date(b.date))
        const firstWeight = records[0].maxWeight
        const lastWeight = records[records.length - 1].maxWeight
        const increase = lastWeight - firstWeight

        if (increase > 0) {
          if (!biggestImprovement || increase > biggestImprovement.increase) {
            biggestImprovement = {
              exercise,
              increase,
              from: firstWeight,
              to: lastWeight
            }
          }
        }
      })

      if (biggestImprovement && biggestImprovement.increase >= 2.5) {
        insights.push({
          type: 'pr',
          icon: Flame,
          title: `${biggestImprovement.exercise} +${biggestImprovement.increase}kg!`,
          message: 'Sterke progressie deze maand',
          color: '#FFD700', // GOLD
          exercise: biggestImprovement.exercise
        })
      }

      // 2. Check for stagnation (3+ sessions with same weight)
      Object.entries(exerciseProgress).forEach(([exercise, records]) => {
        if (records.length < 3) return
        
        const recent = records.slice(-3)
        const weights = recent.map(r => r.maxWeight)
        const allSame = weights.every(w => w === weights[0])

        if (allSame && weights[0] > 0) {
          insights.push({
            type: 'stagnation',
            icon: Target,
            title: `${exercise} op ${weights[0]}kg`,
            message: 'Tijd voor progressie overload!',
            color: '#FFD700', // GOLD
            exercise
          })
        }
      })

      // 3. Check weekly workout count
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const thisWeekSessions = sessions.filter(s => 
        new Date(s.completed_at) >= weekAgo
      ).length

      if (thisWeekSessions >= 4) {
        insights.push({
          type: 'streak',
          icon: Zap,
          title: `${thisWeekSessions} workouts deze week!`,
          message: 'Je bent op 🔥',
          color: '#FFD700', // GOLD
          exercise: null
        })
      }

      // Pick best insight (priority: PR > Streak > Stagnation)
      const priorityOrder = ['pr', 'streak', 'stagnation']
      const bestInsight = insights.sort((a, b) => 
        priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
      )[0]

      if (bestInsight) {
        setInsight(bestInsight)
        setTimeout(() => setVisible(true), 500)
        
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          handleDismiss()
        }, 8000)
      }

    } catch (error) {
      console.error('Failed to analyze progress:', error)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => {
      setDismissed(true)
      localStorage.setItem('workout_toast_dismissed', new Date().toDateString())
    }, 300)
  }

  const handleClick = () => {
    if (onViewChart && insight?.exercise) {
      onViewChart(insight.exercise)
    }
    handleDismiss()
  }

  if (dismissed || !insight) return null

  const Icon = insight.icon

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: visible ? (isMobile ? '85px' : '105px') : '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? 'calc(100% - 2rem)' : 'auto',
        minWidth: isMobile ? 'auto' : '360px',
        maxWidth: isMobile ? '100%' : '400px',
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)', // Dark glassmorphic
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 215, 0, 0.3)', // GOLD border
        borderRadius: isMobile ? '12px' : '14px',
        padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1rem',
        boxShadow: '0 8px 32px rgba(255, 215, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)', // GOLD glow
        cursor: 'pointer',
        zIndex: 95,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        animation: visible ? 'slideDown 0.5s ease-out' : 'none',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px) scale(1.02)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 215, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateX(-50%) translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 215, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'translateX(-50%) scale(0.98)'
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)'
        }
      }}
    >
      {/* Top GOLD accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
        opacity: 0.6
      }} />

      {/* Shine overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.625rem' : '0.75rem',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Icon - GOLD container */}
        <div style={{
          width: isMobile ? '36px' : '40px',
          height: isMobile ? '36px' : '40px',
          borderRadius: '10px',
          background: 'rgba(255, 215, 0, 0.15)', // GOLD
          border: '1px solid rgba(255, 215, 0, 0.3)', // GOLD
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 16px rgba(255, 215, 0, 0.25)' // GOLD glow
        }}>
          <Icon 
            size={isMobile ? 18 : 20} 
            color="#FFD700" // GOLD
            strokeWidth={2.5}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.5))' // GOLD glow
            }}
          />
        </div>

        {/* Content - COMPACT */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '800',
            color: '#FFD700', // GOLD
            marginBottom: '0.125rem',
            letterSpacing: '-0.01em',
            textShadow: '0 0 12px rgba(255, 215, 0, 0.3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {insight.title}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '600'
          }}>
            {insight.message}
          </div>
        </div>

        {/* Action buttons - COMPACT */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          flexShrink: 0
        }}>
          {/* View Chart Arrow */}
          {insight.exercise && (
            <div style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '8px',
              background: 'rgba(255, 215, 0, 0.12)', // GOLD
              border: '1px solid rgba(255, 215, 0, 0.25)', // GOLD
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <ChevronRight size={isMobile ? 14 : 16} color="#FFD700" strokeWidth={2.5} />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDismiss()
            }}
            style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              padding: 0
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <X size={isMobile ? 14 : 16} color="rgba(255, 255, 255, 0.6)" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
