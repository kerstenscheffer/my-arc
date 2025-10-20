// src/client/components/floating-modals/WorkoutModal.jsx
import { useState, useEffect } from 'react'
import { X, Check, CheckCircle, Zap, Target } from 'lucide-react'

export default function WorkoutModal({ db, client, onClose, onRefresh }) {
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(false)
  const [workoutData, setWorkoutData] = useState({
    completed: false,
    streak: 0,
    weekCount: 0,
    weekTarget: 3
  })
  
  useEffect(() => {
    loadWorkoutData()
  }, [client?.id])
  
  async function loadWorkoutData() {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { data: completions } = await db.supabase
        .from('workout_completions')
        .select('completed')
        .eq('client_id', client.id)
        .eq('workout_date', today)
        .single()
      
      const { data: recentWorkouts } = await db.supabase
        .from('workout_completions')
        .select('workout_date')
        .eq('client_id', client.id)
        .eq('completed', true)
        .gte('workout_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('workout_date', { ascending: false })
      
      let streak = 0
      if (recentWorkouts && recentWorkouts.length > 0) {
        const dates = recentWorkouts.map(w => new Date(w.workout_date))
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        for (let i = 0; i < dates.length; i++) {
          const expectedDate = new Date(today)
          expectedDate.setDate(expectedDate.getDate() - i)
          
          if (dates.find(d => d.toDateString() === expectedDate.toDateString())) {
            streak++
          } else if (i > 0) {
            break
          }
        }
      }
      
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      
      const { data: weekWorkouts } = await db.supabase
        .from('workout_completions')
        .select('workout_date')
        .eq('client_id', client.id)
        .eq('completed', true)
        .gte('workout_date', weekStart.toISOString().split('T')[0])
      
      setWorkoutData({
        completed: completions?.completed || false,
        streak,
        weekCount: weekWorkouts?.length || 0,
        weekTarget: 3
      })
    } catch (error) {
      console.error('Workout data error:', error)
    }
  }
  
  async function handleWorkoutComplete() {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      await db.supabase
        .from('workout_completions')
        .upsert({
          client_id: client.id,
          workout_date: today,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,workout_date'
        })
      
      await loadWorkoutData()
      onRefresh()
      
      setTimeout(() => onClose(), 1500)
    } catch (error) {
      console.error('Workout log failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: isMobile ? '85vw' : '320px',
      maxWidth: '320px',
      maxHeight: '80vh',
      background: 'rgba(17, 17, 17, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderLeft: '0.5px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px 0 0 16px',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
      zIndex: 999,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        borderBottom: '0.5px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '0.25rem'
          }}>
            Workout Tracker
          </h3>
          <p style={{
            margin: 0,
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            Quick log je training
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} color="rgba(255, 255, 255, 0.4)" />
        </button>
      </div>
      
      {/* Content */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        overflowY: 'auto',
        maxHeight: 'calc(80vh - 100px)'
      }}>
        {workoutData.completed ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
            borderRadius: '12px',
            padding: isMobile ? '1.25rem' : '1.5rem',
            textAlign: 'center',
            marginBottom: '1.25rem',
            border: '0.5px solid rgba(16, 185, 129, 0.2)'
          }}>
            <CheckCircle size={36} color="#10b981" style={{ marginBottom: '0.75rem' }} />
            <div style={{ 
              fontSize: isMobile ? '0.95rem' : '1rem', 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontWeight: '600'
            }}>
              Workout Completed!
            </div>
          </div>
        ) : (
          <button
            onClick={handleWorkoutComplete}
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)',
              border: '0.5px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '12px',
              padding: isMobile ? '1.25rem' : '1.5rem',
              color: '#f97316',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              cursor: loading ? 'wait' : 'pointer',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '56px',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Check size={18} />
            {loading ? 'Saving...' : 'WORKOUT GEDAAN'}
          </button>
        )}
        
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '1rem',
            border: '0.5px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center'
          }}>
            <Zap size={14} color="rgba(255,255,255,0.4)" style={{ marginBottom: '0.5rem' }} />
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '0.25rem'
            }}>
              {workoutData.streak}
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              margin: 0
            }}>
              Days Streak
            </p>
          </div>
          
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '1rem',
            border: '0.5px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center'
          }}>
            <Target size={14} color="rgba(255,255,255,0.4)" style={{ marginBottom: '0.5rem' }} />
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '0.25rem'
            }}>
              {workoutData.weekCount}/{workoutData.weekTarget}
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              margin: 0
            }}>
              This Week
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
