// src/modules/workout/components/todays-workout/TodaysWorkoutCard.jsx
import { Dumbbell, Zap, Clock, Target, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function TodaysWorkoutCard({ workout, onLogClick, logsCount, client, db }) {
  const isMobile = window.innerWidth <= 768
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Check if workout is started/completed
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
  
  // Calculate totals
  const exerciseCount = workout.exercises?.length || 0
  const totalSets = workout.exercises?.reduce((sum, ex) => sum + (parseInt(ex.sets) || 0), 0) || 0
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: isMobile ? '1rem' : '1.25rem'
    }}>
      <div
        onClick={onLogClick}
        style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%)',
          backdropFilter: 'blur(20px)',
          border: isCompleted 
            ? '1px solid rgba(16, 185, 129, 0.3)'
            : '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '1.25rem' : '1.5rem',
          cursor: 'pointer',
          boxShadow: isCompleted
            ? '0 8px 32px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
            : '0 8px 32px rgba(249, 115, 22, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '44px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = isCompleted
              ? '0 12px 40px rgba(16, 185, 129, 0.35)'
              : '0 12px 40px rgba(249, 115, 22, 0.35)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = isCompleted
              ? '0 8px 32px rgba(16, 185, 129, 0.25)'
              : '0 8px 32px rgba(249, 115, 22, 0.25)'
          }
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        {/* Top glow accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: isCompleted
            ? 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          opacity: 0.6
        }} />
        
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          opacity: 0.03,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <Dumbbell size={isMobile ? 140 : 180} color="#f97316" />
        </div>
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: isMobile ? '0.875rem' : '1rem'
          }}>
            <div style={{ flex: 1 }}>
              {/* Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: isMobile ? '0.5rem' : '0.625rem'
              }}>
                <div style={{
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  borderRadius: '8px',
                  background: isCompleted
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(249, 115, 22, 0.2)',
                  border: isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(249, 115, 22, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCompleted
                    ? '0 0 15px rgba(16, 185, 129, 0.3)'
                    : '0 0 15px rgba(249, 115, 22, 0.3)'
                }}>
                  {isCompleted ? (
                    <CheckCircle 
                      size={isMobile ? 14 : 16} 
                      color="#10b981"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
                    />
                  ) : (
                    <Zap 
                      size={isMobile ? 14 : 16} 
                      color="#f97316"
                      fill="#f97316"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))' }}
                    />
                  )}
                </div>
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: isCompleted ? '#10b981' : '#f97316',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {isCompleted ? 'VOLTOOID' : 'VANDAAG'}
                </span>
                {logsCount > 0 && (
                  <span style={{
                    fontSize: isMobile ? '0.6rem' : '0.65rem',
                    color: isCompleted ? '#10b981' : '#f97316',
                    fontWeight: '700',
                    background: isCompleted
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(249, 115, 22, 0.1)',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '6px',
                    border: isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.15)'
                      : '1px solid rgba(249, 115, 22, 0.15)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {logsCount} GELOGD
                  </span>
                )}
              </div>
              
              {/* Title */}
              <h2 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '800',
                color: '#fff',
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.02em'
              }}>
                {workout.name}
              </h2>
              
              {/* Stats */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.75rem' : '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600'
                }}>
                  <Target size={isMobile ? 13 : 14} style={{ opacity: 0.7 }} />
                  {workout.focus}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600'
                }}>
                  <Clock size={isMobile ? 13 : 14} style={{ opacity: 0.7 }} />
                  {workout.geschatteTijd || '~90 min'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: isMobile ? '0.5rem' : '0.625rem',
            marginBottom: isMobile ? '1rem' : '1.25rem'
          }}>
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.1)',
              borderRadius: '10px',
              padding: isMobile ? '0.6rem' : '0.75rem',
              textAlign: 'center',
              minHeight: '44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '800',
                color: '#f97316',
                marginBottom: '0.1rem',
                letterSpacing: '-0.02em'
              }}>
                {exerciseCount}
              </div>
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.65rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Oefeningen
              </div>
            </div>
            
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.1)',
              borderRadius: '10px',
              padding: isMobile ? '0.6rem' : '0.75rem',
              textAlign: 'center',
              minHeight: '44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '800',
                color: '#f97316',
                marginBottom: '0.1rem',
                letterSpacing: '-0.02em'
              }}>
                {totalSets}
              </div>
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.65rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Totaal Sets
              </div>
            </div>
          </div>
          
          {/* LOG NU Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLogClick()
            }}
            style={{
              width: '100%',
              background: isCompleted
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: isMobile ? '0.75rem' : '0.875rem',
              color: '#000',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              boxShadow: isCompleted
                ? '0 4px 20px rgba(16, 185, 129, 0.35)'
                : '0 4px 20px rgba(249, 115, 22, 0.35)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = isCompleted
                  ? '0 8px 30px rgba(16, 185, 129, 0.5)'
                  : '0 8px 30px rgba(249, 115, 22, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = isCompleted
                  ? '0 4px 20px rgba(16, 185, 129, 0.35)'
                  : '0 4px 20px rgba(249, 115, 22, 0.35)'
              }
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <Dumbbell size={isMobile ? 16 : 18} />
            {isCompleted ? 'BEKIJK WORKOUT' : 'LOG NU'}
          </button>
        </div>
      </div>
    </div>
  )
}
