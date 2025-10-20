// src/modules/workout/components/TodaysLogToast.jsx
import { useState, useEffect } from 'react'
import { Zap, X, Trophy, Dumbbell } from 'lucide-react'

export default function TodaysLogToast({ client, db }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [logData, setLogData] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if dismissed today
    const dismissedDate = localStorage.getItem('today_log_toast_dismissed')
    const today = new Date().toDateString()
    
    if (dismissedDate === today) {
      return
    }

    // Check for today's logs
    checkTodaysLogs()
  }, [client?.id])

  const checkTodaysLogs = async () => {
    if (!client?.id || !db) return

    try {
      // Get today's date range
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0))
      const endOfDay = new Date(today.setHours(23, 59, 59, 999))

      // Get today's workout sessions
      const { data: sessions, error: sessionsError } = await db.supabase
        .from('workout_sessions')
        .select('id, completed_at')
        .eq('client_id', client.id)
        .gte('completed_at', startOfDay.toISOString())
        .lte('completed_at', endOfDay.toISOString())
        .order('completed_at', { ascending: false })

      if (sessionsError || !sessions || sessions.length === 0) {
        return
      }

      const sessionIds = sessions.map(s => s.id)

      // Get all progress records from today
      const { data: progressData, error: progressError } = await db.supabase
        .from('workout_progress')
        .select('*')
        .in('session_id', sessionIds)

      if (progressError || !progressData || progressData.length === 0) {
        return
      }

      // Find the heaviest lift today
      let heaviestLift = null
      let totalVolume = 0

      progressData.forEach(record => {
        const exercise = record.exercise_name
        const sets = Array.isArray(record.sets) ? record.sets : []
        
        sets.forEach(set => {
          const weight = parseFloat(set.weight) || 0
          const reps = parseInt(set.reps) || 0
          const volume = weight * reps
          
          totalVolume += volume

          if (!heaviestLift || weight > heaviestLift.weight) {
            heaviestLift = {
              exercise,
              weight,
              reps,
              sets: sets.length
            }
          }
        })
      })

      // Only show if there's meaningful data
      if (heaviestLift && heaviestLift.weight > 0) {
        setLogData({
          exercise: heaviestLift.exercise,
          weight: heaviestLift.weight,
          reps: heaviestLift.reps,
          totalSets: heaviestLift.sets,
          totalExercises: progressData.length,
          totalVolume: Math.round(totalVolume)
        })

        setTimeout(() => setVisible(true), 1000) // Slight delay after page load
        
        // Auto-dismiss after 6 seconds
        setTimeout(() => {
          handleDismiss()
        }, 6000)
      }

    } catch (error) {
      console.error('Failed to check today\'s logs:', error)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => {
      setDismissed(true)
      localStorage.setItem('today_log_toast_dismissed', new Date().toDateString())
    }, 300)
  }

  if (dismissed || !logData) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: visible ? (isMobile ? '85px' : '105px') : '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? 'calc(100% - 2rem)' : 'auto',
        minWidth: isMobile ? 'auto' : '380px',
        maxWidth: isMobile ? '100%' : '420px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '14px',
        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
        boxShadow: '0 8px 30px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.2)',
        zIndex: 94,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: visible ? 'slideDown 0.5s ease-out' : 'none'
      }}
    >
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
        borderRadius: '14px 14px 0 0',
        filter: 'blur(1px)',
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
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
        }}>
          <Dumbbell 
            size={isMobile ? 22 : 26} 
            color="#10b981"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '800',
            color: '#10b981',
            marginBottom: '0.15rem',
            letterSpacing: '-0.02em',
            textShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            Vandaag {logData.weight}kg {logData.exercise}!
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '500'
          }}>
            Lekker bezig! 🔥
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
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
            padding: 0,
            flexShrink: 0
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

      {/* Extra stats - subtle */}
      {logData.totalExercises > 1 && (
        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.15)',
          display: 'flex',
          gap: '1rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Trophy size={12} color="rgba(16, 185, 129, 0.6)" />
            <span>{logData.totalExercises} oefeningen</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Zap size={12} color="rgba(16, 185, 129, 0.6)" />
            <span>{(logData.totalVolume / 1000).toFixed(1)}k volume</span>
          </div>
        </div>
      )}

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
