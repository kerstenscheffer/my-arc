// src/modules/workout/components/TodayWorkout.jsx
import { Play, Flame, Clock, Target, ChevronRight, Zap, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import useIsMobile from '../../../hooks/useIsMobile'

export default function TodayWorkout({ workout, onStart, client, db }) {
  const isMobile = useIsMobile()
  const [isStarted, setIsStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Check if today's workout is already started
  useEffect(() => {
    checkTodayWorkoutStatus()
  }, [client?.id])
  
  const checkTodayWorkoutStatus = async () => {
    if (!client?.id || !db) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Direct Supabase query
      const { data } = await db.supabase
        .from('workout_completions')
        .select('completed')
        .eq('client_id', client.id)
        .eq('workout_date', today)
        .single()
      
      if (data) {
        setIsStarted(data.completed)
      }
    } catch (error) {
      // No workout for today is normal, not an error
      console.log('No workout status for today')
    }
  }
  
  const handleStartWorkout = async (e) => {
    e.stopPropagation()
    
    if (isStarted || isLoading) return
    
    setIsLoading(true)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // UPSERT - update if exists, insert if new
      const { error } = await db.supabase
        .from('workout_completions')
        .upsert({
          client_id: client.id,
          workout_date: today,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,workout_date'
        })
      
      if (error) {
        console.error('Error starting workout:', error)
        alert('Could not start workout. Please try again.')
      } else {
        setIsStarted(true)
        console.log('✅ Workout started successfully')
      }
      
    } catch (error) {
      console.error('Error starting workout:', error)
      alert('Could not start workout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // SAFETY: Check if workout exists and has required data
  if (!workout) {
    return (
      <div style={{ 
        paddingLeft: isMobile ? '0.75rem' : '1rem',
        paddingRight: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          background: 'rgba(23, 23, 23, 0.6)',
          borderRadius: isMobile ? '14px' : '16px',
          padding: isMobile ? '1rem' : '1.25rem',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0,
            fontSize: isMobile ? '0.85rem' : '0.95rem'
          }}>
            Geen workout voor vandaag gepland
          </p>
        </div>
      </div>
    )
  }
  
  // Extract workout data safely - handle both old and new formats
  const workoutName = workout.name || 'Workout'
  const workoutFocus = workout.focus || 'general'
  const workoutExercises = workout.exercises || []
  const exerciseCount = workoutExercises.length
  const totalSets = workoutExercises.reduce((acc, ex) => {
    const sets = parseInt(ex.sets) || 0
    return acc + sets
  }, 0)
  const focusCount = workoutFocus.split(',').filter(f => f.trim()).length
  
  return (
    <>
      <div style={{ 
        paddingLeft: isMobile ? '0.75rem' : '1rem',
        paddingRight: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <div 
          onClick={isStarted ? onStart : handleStartWorkout}
          style={{
            background: isStarted 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)',
            borderRadius: isMobile ? '14px' : '16px',
            padding: isMobile ? '1rem' : '1.25rem',
            cursor: isLoading ? 'wait' : 'pointer',
            boxShadow: isStarted
              ? '0 10px 30px rgba(16, 185, 129, 0.2)'
              : '0 10px 30px rgba(249, 115, 22, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isLoading ? 0.8 : 1,
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            border: isStarted
              ? '1px solid rgba(16, 185, 129, 0.15)'
              : '1px solid rgba(249, 115, 22, 0.4)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
              e.currentTarget.style.boxShadow = isStarted
                ? '0 15px 40px rgba(16, 185, 129, 0.3)'
                : '0 15px 40px rgba(249, 115, 22, 0.35)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = isStarted
              ? '0 10px 30px rgba(16, 185, 129, 0.2)'
              : '0 10px 30px rgba(249, 115, 22, 0.25)'
          }}
          onTouchStart={(e) => {
            if (isMobile && !isLoading) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          {/* Background pattern */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '200%',
            height: '200%',
            background: isStarted
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 40%)'
              : 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 40%)',
            pointerEvents: 'none'
          }} />
          
          {/* Content */}
          <div style={{ 
            flex: 1,
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Zap size={isMobile ? 14 : 16} color={isStarted ? '#10b981' : '#f97316'} fill={isStarted ? '#10b981' : '#f97316'} />
              <p style={{
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                color: isStarted ? '#10b981' : '#f97316',
                margin: 0,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {isStarted ? 'KLAAR' : 'VANDAAG'}
              </p>
            </div>
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              color: '#fff',
              margin: '0 0 0.5rem 0',
              fontWeight: '800',
              lineHeight: 1.2,
              letterSpacing: '-0.02em'
            }}>
              {workoutName}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.75rem' : '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                <Target size={isMobile ? 12 : 14} />
                {workoutFocus}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                <Clock size={isMobile ? 12 : 14} />
                {workout.geschatteTijd || '~45 min'}
              </div>
            </div>
            
            {/* Status text */}
            <div style={{
              marginTop: '0.75rem',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: isStarted ? 'rgba(16, 185, 129, 0.8)' : 'rgba(249, 115, 22, 0.8)',
              fontWeight: '600'
            }}>
              {isLoading ? 'Workout starten...' : 
               isStarted ? 'Klik voor details' : 
               'Klik om te starten'}
            </div>
          </div>
          
          {/* Action button */}
          <div style={{
            width: isMobile ? '44px' : '48px',
            height: isMobile ? '44px' : '48px',
            background: isStarted
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: isStarted
              ? '1px solid rgba(16, 185, 129, 0.2)'
              : '1px solid rgba(249, 115, 22, 0.3)'
          }}>
            {isLoading ? (
              <div style={{
                width: isMobile ? '18px' : '20px',
                height: isMobile ? '18px' : '20px',
                border: '2px solid rgba(249, 115, 22, 0.3)',
                borderTopColor: '#f97316',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
            ) : isStarted ? (
              <Check size={isMobile ? 20 : 22} color="#10b981" strokeWidth={3} />
            ) : (
              <Play size={isMobile ? 18 : 20} color="#f97316" fill="#f97316" style={{ marginLeft: '2px' }} />
            )}
          </div>
        </div>
        
        {/* Quick stats - Only show if we have exercises */}
        {exerciseCount > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: isMobile ? '0.4rem' : '0.6rem',
            marginTop: isMobile ? '0.75rem' : '1rem'
          }}>
            <QuickStat
              label="Oefeningen"
              value={exerciseCount}
              color="#f97316"
              isMobile={isMobile}
            />
            <QuickStat
              label="Sets"
              value={totalSets}
              color="#10b981"
              isMobile={isMobile}
            />
            <QuickStat
              label="Focus"
              value={focusCount}
              suffix="spiergroepen"
              color="#3b82f6"
              isMobile={isMobile}
            />
          </div>
        )}
      </div>
      
      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

function QuickStat({ label, value, suffix, color, isMobile }) {
  return (
    <div style={{
      background: 'rgba(23, 23, 23, 0.6)',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '0.5rem' : '0.6rem',
      border: `1px solid ${color}20`,
      textAlign: 'center',
      backdropFilter: 'blur(10px)',
      minHeight: '44px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{
        fontSize: isMobile ? '0.95rem' : '1.1rem',
        fontWeight: '800',
        color: color,
        marginBottom: '0.1rem',
        letterSpacing: '-0.02em'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: isMobile ? '0.55rem' : '0.65rem',
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: '600'
      }}>
        {label}
      </div>
      {suffix && (
        <div style={{
          fontSize: isMobile ? '0.5rem' : '0.55rem',
          color: 'rgba(255,255,255,0.3)',
          marginTop: '0.05rem'
        }}>
          {suffix}
        </div>
      )}
    </div>
  )
}
