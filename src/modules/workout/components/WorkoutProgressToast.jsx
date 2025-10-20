// src/modules/workout/components/WorkoutProgressToast.jsx
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
          color: '#f97316',
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
            color: '#3b82f6',
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
          color: '#10b981',
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
        minWidth: isMobile ? 'auto' : '380px',
        maxWidth: isMobile ? '100%' : '420px',
        background: `linear-gradient(135deg, ${insight.color}25 0%, ${insight.color}15 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${insight.color}40`,
        borderRadius: '14px',
        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
        boxShadow: `0 8px 30px ${insight.color}30, 0 0 0 1px ${insight.color}20`,
        cursor: 'pointer',
        zIndex: 95,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        animation: visible ? 'slideDown 0.5s ease-out' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px) scale(1.02)'
          e.currentTarget.style.boxShadow = `0 12px 40px ${insight.color}40, 0 0 0 1px ${insight.color}30`
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateX(-50%) translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = `0 8px 30px ${insight.color}30, 0 0 0 1px ${insight.color}20`
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
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, transparent 0%, ${insight.color} 50%, transparent 100%)`,
        borderRadius: '14px 14px 0 0',
        filter: `blur(1px)`,
        opacity: 0.6
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {/* Icon */}
        <div style={{
          width: isMobile ? '42px' : '48px',
          height: isMobile ? '42px' : '48px',
          borderRadius: '12px',
          background: `${insight.color}20`,
          border: `1px solid ${insight.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 20px ${insight.color}30`
        }}>
          <Icon 
            size={isMobile ? 22 : 26} 
            color={insight.color}
            style={{
              filter: `drop-shadow(0 0 8px ${insight.color}60)`
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '800',
            color: insight.color,
            marginBottom: '0.15rem',
            letterSpacing: '-0.02em',
            textShadow: `0 0 20px ${insight.color}40`
          }}>
            {insight.title}
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '500'
          }}>
            {insight.message}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexShrink: 0
        }}>
          {/* View Chart Arrow */}
          {insight.exercise && (
            <div style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: '10px',
              background: `${insight.color}15`,
              border: `1px solid ${insight.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <ChevronRight size={isMobile ? 16 : 18} color={insight.color} />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDismiss()
            }}
            style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: '10px',
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
            <X size={isMobile ? 16 : 18} color="rgba(255, 255, 255, 0.7)" />
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
