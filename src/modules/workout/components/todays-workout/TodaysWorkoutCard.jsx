// src/modules/workout/components/todays-workout/TodaysWorkoutCard.jsx
import React, { useState, useEffect } from 'react'
import { Dumbbell, Play, Check, Clock, ChevronRight } from 'lucide-react'

export default function TodaysWorkoutCard({ workout, onLogClick, logsCount, client, db }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const getWorkoutImage = () => {
    if (!workout) return null
    const focus = workout.focus?.toLowerCase() || workout.name?.toLowerCase() || ''
    
    if (focus.includes('chest') || focus.includes('push') || focus.includes('borst')) {
      return 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=600&h=600&fit=crop&q=80&crop=center'
    }
    if (focus.includes('back') || focus.includes('pull') || focus.includes('rug')) {
      return 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=600&h=600&fit=crop&q=80&crop=center'
    }
    if (focus.includes('leg') || focus.includes('squat') || focus.includes('been')) {
      return 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=600&h=600&fit=crop&q=80&crop=center'
    }
    if (focus.includes('shoulder') || focus.includes('delt') || focus.includes('schouder')) {
      return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&h=600&fit=crop&q=80&crop=center'
    }
    if (focus.includes('arm') || focus.includes('bicep') || focus.includes('tricep') || focus.includes('curl')) {
      return 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=600&fit=crop&q=80&crop=center'
    }
    if (focus.includes('cardio') || focus.includes('run') || focus.includes('fiets')) {
      return 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&h=600&fit=crop&q=80&crop=center'
    }
    if (focus.includes('full body') || focus.includes('total')) {
      return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop&q=80&crop=center'
    }
    return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop&q=80&crop=center'
  }

  const isCompleted = logsCount > 0
  const imageSize = isMobile ? '100px' : '120px'

  return (
    <div style={{
      marginBottom: isMobile ? '0.5rem' : '0.75rem'
    }}>
      {/* Main card — full width, no border-radius, no side padding */}
      <div
        onClick={onLogClick}
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: isCompleted
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(5, 150, 105, 0.02) 100%)'
            : 'transparent',
          borderTop: isCompleted
            ? '1px solid rgba(16, 185, 129, 0.15)'
            : '1px solid rgba(255, 215, 0, 0.1)',
          borderBottom: isCompleted
            ? '1px solid rgba(16, 185, 129, 0.15)'
            : '1px solid rgba(255, 215, 0, 0.1)',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: 0,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: imageSize
        }}
      >
        {/* Workout Image — left side, full height */}
        <div style={{
          width: imageSize,
          minHeight: imageSize,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${getWorkoutImage()})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isCompleted ? 0.45 : 0.9
          }} />
          
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 100%)'
          }} />
          
          {/* Badge overlay — top left */}
          <div style={{
            position: 'absolute',
            top: isMobile ? '6px' : '8px',
            left: isMobile ? '6px' : '8px',
            width: isMobile ? '26px' : '30px',
            height: isMobile ? '26px' : '30px',
            borderRadius: '7px',
            background: isCompleted ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            border: isCompleted
              ? '1px solid rgba(16, 185, 129, 0.4)'
              : '1px solid rgba(255, 215, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
            zIndex: 2
          }}>
            {isCompleted ? (
              <Check size={isMobile ? 13 : 15} color="#10b981" strokeWidth={2.5} />
            ) : (
              <Dumbbell size={isMobile ? 13 : 15} color="#FFD700" strokeWidth={2} />
            )}
          </div>
          
          {/* Green overlay when completed */}
          {isCompleted && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(16, 185, 129, 0.12)',
              zIndex: 1
            }} />
          )}
        </div>
        
        {/* Content — right side */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
          gap: isMobile ? '0.35rem' : '0.4rem'
        }}>
          {/* Label */}
          <div style={{
            fontSize: isMobile ? '0.58rem' : '0.63rem',
            fontWeight: '700',
            color: isCompleted ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 215, 0, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1
          }}>
            {isCompleted ? 'VOLTOOID' : "VANDAAG'S WORKOUT"}
          </div>
          
          {/* Workout name */}
          <h2 style={{
            fontSize: isMobile ? '1rem' : '1.15rem',
            fontWeight: '800',
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {workout.name || workout.focus || 'Workout'}
          </h2>
          
          {/* Info row — inline, no boxes */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.5rem' : '0.625rem',
            flexWrap: 'wrap'
          }}>
            {workout.exercises && workout.exercises.length > 0 && (
              <InfoPill 
                icon={Dumbbell} 
                text={`${workout.exercises.length} oefeningen`} 
                isMobile={isMobile} 
              />
            )}
            
            {workout.geschatteTijd && (
              <InfoPill 
                icon={Clock} 
                text={workout.geschatteTijd} 
                isMobile={isMobile} 
              />
            )}
            
            {logsCount > 0 && (
              <span style={{
                fontSize: isMobile ? '0.62rem' : '0.68rem',
                fontWeight: '700',
                color: 'rgba(16, 185, 129, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                <Check size={isMobile ? 10 : 11} strokeWidth={2.5} />
                {logsCount} gelogd
              </span>
            )}
          </div>
        </div>
        
        {/* Action area — right side */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0 0.75rem 0 0' : '0 1rem 0 0',
          flexShrink: 0
        }}>
          <div style={{
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            borderRadius: '10px',
            background: isCompleted
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(255, 215, 0, 0.1)',
            border: isCompleted
              ? '1px solid rgba(16, 185, 129, 0.25)'
              : '1px solid rgba(255, 215, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isCompleted ? (
              <ChevronRight size={isMobile ? 18 : 20} color="#10b981" strokeWidth={2} />
            ) : (
              <Play size={isMobile ? 16 : 18} color="#FFD700" strokeWidth={2.5} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Small info pill — no box, just icon + text
function InfoPill({ icon: Icon, text, isMobile }) {
  return (
    <span style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.2rem',
      fontSize: isMobile ? '0.62rem' : '0.68rem',
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.4)'
    }}>
      <Icon size={isMobile ? 10 : 11} strokeWidth={2} />
      {text}
    </span>
  )
}
