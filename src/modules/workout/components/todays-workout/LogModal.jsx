// src/modules/workout/components/todays-workout/LogModal.jsx
import { X, CheckCircle, Dumbbell } from 'lucide-react'
import { useState, useEffect } from 'react'
import ExerciseList from './components/ExerciseList'

export default function LogModal({ workout, todaysLogs, onClose, onLogsUpdate, client, schema, db }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  
  // Progressive reveal animation
  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
  }, [])
  
  // Count completed exercises
  useEffect(() => {
    if (todaysLogs && workout.exercises) {
      const loggedExercises = new Set(todaysLogs.map(log => log.exercise_name))
      const completed = workout.exercises.filter(ex => loggedExercises.has(ex.name)).length
      setCompletedCount(completed)
    }
  }, [todaysLogs, workout.exercises])
  
  // Handle close with animation
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }
  
  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])
  
  const totalExercises = workout.exercises?.length || 0
  const progressPercentage = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(249, 115, 22, 0.25)',
        padding: isMobile ? '0.875rem 1rem' : '1.25rem 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 60px rgba(249, 115, 22, 0.1)'
      }}>
        {/* Top glow accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          opacity: 0.6
        }} />
        
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Title section */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.4rem'
            }}>
              <div style={{
                width: isMobile ? '24px' : '28px',
                height: isMobile ? '24px' : '28px',
                borderRadius: '8px',
                background: 'rgba(249, 115, 22, 0.2)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)'
              }}>
                <Dumbbell 
                  size={isMobile ? 12 : 14} 
                  color="#f97316"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))' }}
                />
              </div>
              <span style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: '#f97316',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                LOG WORKOUT
              </span>
            </div>
            
            {/* Title */}
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              color: '#fff',
              margin: '0 0 0.625rem 0',
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {workout.name}
            </h2>
            
            {/* Progress bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem'
            }}>
              <div style={{
                flex: 1,
                height: '6px',
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid rgba(249, 115, 22, 0.1)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercentage}%`,
                  background: progressPercentage >= 90
                    ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                    : 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: progressPercentage >= 90
                    ? '0 0 15px rgba(16, 185, 129, 0.5)'
                    : progressPercentage > 0 
                      ? '0 0 10px rgba(249, 115, 22, 0.3)'
                      : 'none'
                }} />
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: progressPercentage >= 90 ? '#10b981' : '#f97316',
                fontWeight: '700',
                minWidth: 'fit-content'
              }}>
                {completedCount > 0 && (
                  <CheckCircle 
                    size={isMobile ? 13 : 14} 
                    style={{
                      filter: progressPercentage >= 90
                        ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))'
                        : 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.4))'
                    }}
                  />
                )}
                {completedCount}/{totalExercises}
              </div>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              width: '44px',
              height: '44px',
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '10px',
              color: '#f97316',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              marginLeft: isMobile ? '0.75rem' : '1rem',
              flexShrink: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.95)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <X size={isMobile ? 18 : 20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      {/* Content - Scrollable */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: isMobile ? '1rem' : '1.5rem 1rem',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <ExerciseList
            exercises={workout.exercises || []}
            todaysLogs={todaysLogs}
            onLogsUpdate={onLogsUpdate}
            client={client}
            schema={schema}
            db={db}
            workoutDayKey={workout.dayKey}
          />
        </div>
      </div>
      
      {/* Footer with completion message */}
      {completedCount === totalExercises && totalExercises > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(16, 185, 129, 0.3)',
          padding: isMobile ? '0.875rem 1rem' : '1.25rem 1.5rem',
          textAlign: 'center',
          animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
            opacity: 0.6
          }} />
          
          <div style={{
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              color: '#10b981',
              marginBottom: '0.35rem',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle 
                size={isMobile ? 20 : 24} 
                style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))' }}
              />
              WORKOUT VOLTOOID!
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600'
            }}>
              Geweldig werk vandaag! Alle {totalExercises} oefeningen gelogd.
            </div>
          </div>
        </div>
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Custom scrollbar */
        *::-webkit-scrollbar {
          width: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.3);
          borderRadius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.5);
        }
      `}</style>
    </div>
  )
}
