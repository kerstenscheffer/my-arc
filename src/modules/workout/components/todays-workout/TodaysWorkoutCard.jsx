// src/modules/workout/components/todays-workout/TodaysWorkoutCard.jsx
import { Dumbbell, Zap, Clock, Target, CheckCircle, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function TodaysWorkoutCard({ workout, onLogClick, logsCount, client, db }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isCompleted, setIsCompleted] = useState(false)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  useEffect(() => {
    checkWorkoutStatus()
  }, [client?.id, logsCount])
  
  const checkWorkoutStatus = async () => {
    if (!client?.id || !db) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await db.supabase
        .from('workout_completions')
        .select('completed')
        .eq('client_id', client.id)
        .eq('workout_date', today)
        .single()
      
      setIsCompleted(data?.completed || false)
    } catch (error) {
      setIsCompleted(false)
    }
  }
  
  const exerciseCount = workout.exercises?.length || 0
  const totalSets = workout.exercises?.reduce((sum, ex) => sum + (parseInt(ex.sets) || 0), 0) || 0
  
  // Workout photo
  const workoutImage = 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=1600&h=500&fit=crop&q=85'

  return (
    <div style={{ padding: isMobile ? '0.5rem' : '0.625rem', marginBottom: isMobile ? '1rem' : '1.5rem' }}>
      <div style={{
        position: 'relative',
        height: isMobile ? '240px' : '300px',
        borderRadius: isMobile ? '16px' : '20px',
        overflow: 'hidden',
        border: '2px solid rgba(249, 115, 22, 0.3)',
        boxShadow: '0 8px 32px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        background: '#000',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onClick={onLogClick}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(249, 115, 22, 0.35)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(249, 115, 22, 0.2)'
        }
      }}
      onTouchStart={(e) => {
        if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
      }}
      onTouchEnd={(e) => {
        if (isMobile) e.currentTarget.style.transform = 'scale(1)'
      }}
      >
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${workoutImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
        
        {/* Top vignette */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
          pointerEvents: 'none'
        }} />
        
        {/* Bottom gradient - DARKER OVERLAY */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        {/* Status Badge - Top Left - SMALLER */}
        <div style={{
          position: 'absolute',
          top: isMobile ? '0.75rem' : '1rem',
          left: isMobile ? '0.75rem' : '1rem',
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(23, 23, 23, 0.8) 100%)',
          backdropFilter: 'blur(12px)',
          border: isCompleted
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : '1px solid rgba(249, 115, 22, 0.4)',
          borderRadius: '8px',
          padding: isMobile ? '0.375rem 0.5rem' : '0.4rem 0.625rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          boxShadow: isCompleted
            ? '0 4px 16px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(0,0,0,0.5)'
            : '0 4px 16px rgba(249, 115, 22, 0.3), 0 0 0 1px rgba(0,0,0,0.5)',
          zIndex: 10
        }}>
          {isCompleted ? (
            <CheckCircle size={isMobile ? 11 : 12} color="#10b981" />
          ) : (
            <Zap size={isMobile ? 11 : 12} color="#f97316" fill="#f97316" />
          )}
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '700',
            color: isCompleted ? '#10b981' : '#f97316'
          }}>
            {isCompleted ? 'Voltooid' : 'Vandaag'}
          </span>
        </div>
        
        {/* Logs Count Badge - Top Right - SMALLER */}
        {logsCount > 0 && (
          <div style={{
            position: 'absolute',
            top: isMobile ? '0.75rem' : '1rem',
            right: isMobile ? '0.75rem' : '1rem',
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(23, 23, 23, 0.8) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '8px',
            padding: isMobile ? '0.375rem 0.5rem' : '0.4rem 0.625rem',
            boxShadow: '0 4px 16px rgba(249, 115, 22, 0.2), 0 0 0 1px rgba(0,0,0,0.5)',
            zIndex: 10
          }}>
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '700',
              color: '#f97316'
            }}>
              {logsCount} gelogd
            </span>
          </div>
        )}
        
        {/* Content Layer - Bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: isMobile ? '1rem' : '1.25rem',
          zIndex: 3
        }}>
          {/* Workout Info Container - BLACK/ORANGE */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '0.875rem' : '1rem',
            boxShadow: '0 4px 16px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(249, 115, 22, 0.05)',
            marginBottom: isMobile ? '0.75rem' : '0.875rem'
          }}>
            {/* Top row: Workout name + Focus */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.625rem'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  marginBottom: '0.15rem'
                }}>
                  Workout
                </div>
                <div style={{
                  fontSize: isMobile ? '1.15rem' : '1.375rem',
                  fontWeight: '800',
                  color: 'white',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {workout.name?.length > 20 ? workout.name.substring(0, 20) + '...' : workout.name}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                marginLeft: '0.75rem',
                flexShrink: 0
              }}>
                <Target size={isMobile ? 12 : 13} color="#f97316" style={{ opacity: 0.8 }} />
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '700',
                  color: '#f97316'
                }}>
                  {workout.focus}
                </span>
              </div>
            </div>
            
            {/* Stats Row - Compact inline */}
            <div style={{
              display: 'flex',
              gap: isMobile ? '1rem' : '1.25rem',
              alignItems: 'center',
              paddingTop: '0.625rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Dumbbell size={isMobile ? 12 : 13} color="#a78bfa" style={{ opacity: 0.8 }} />
                <span style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: '700',
                  color: '#a78bfa'
                }}>
                  {exerciseCount} oef.
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingUp size={isMobile ? 12 : 13} color="#60a5fa" style={{ opacity: 0.8 }} />
                <span style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: '700',
                  color: '#60a5fa'
                }}>
                  {totalSets} sets
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={isMobile ? 12 : 13} color="#fbbf24" style={{ opacity: 0.8 }} />
                <span style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: '700',
                  color: '#fbbf24'
                }}>
                  {workout.geschatteTijd || '~90 min'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLogClick()
            }}
            style={{
              width: '100%',
              background: isCompleted
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '10px',
              padding: isMobile ? '0.875rem' : '1rem',
              color: '#10b981',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '48px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0.25) 100%)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Dumbbell size={19} strokeWidth={2.5} />
            <span>{isCompleted ? 'Bekijk Workout' : 'Log Nu'}</span>
          </button>
        </div>
        
        {/* Top accent glow - ORANGE */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 4
        }} />
      </div>
    </div>
  )
}
