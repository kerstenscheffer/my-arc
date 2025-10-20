// src/modules/workout/components/todays-workout/components/ExerciseCard.jsx
import { useState, useEffect } from 'react'
import { Play, Info, RefreshCw, CheckCircle, Dumbbell } from 'lucide-react'
import ExerciseHistory from './ExerciseHistory'
import ExerciseActions from './ExerciseActions'
import InfoModal from './InfoModal'
import SwapModal from './SwapModal'
import ExerciseLogModal from './ExerciseLogModal'

export default function ExerciseCard({ 
  exercise, 
  index, 
  totalExercises,
  isLogged,
  onLogsUpdate, 
  client, 
  schema,
  db,
  workoutDayKey,
  visible,
  delay 
}) {
  const isMobile = window.innerWidth <= 768
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [previousLog, setPreviousLog] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Load previous log history
  useEffect(() => {
    if (exercise.name && client?.id) {
      loadPreviousLog()
    }
  }, [exercise.name, client?.id])
  
  const loadPreviousLog = async () => {
    if (!client?.id || !db) return
    
    setLoadingHistory(true)
    try {
      const log = await db.getPreviousExerciseLog(client.id, exercise.name)
      setPreviousLog(log)
    } catch (error) {
      console.error('Error loading previous log:', error)
      setPreviousLog(null)
    } finally {
      setLoadingHistory(false)
    }
  }
  
  // Handle swap complete
  const handleSwapComplete = async () => {
    setShowSwapModal(false)
    
    console.log('🔄 Swap complete, triggering refresh...')
    
    if (onLogsUpdate) {
      onLogsUpdate({ reloadSchema: true })
    }
  }
  
  // Handle log complete
  const handleLogComplete = () => {
    setShowLogModal(false)
    loadPreviousLog() // Reload history
    if (onLogsUpdate) onLogsUpdate()
  }
  
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
        marginBottom: index === totalExercises - 1 ? 0 : isMobile ? '0.875rem' : '1rem'
      }}
    >
      <div
        style={{
          background: isLogged 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)'
            : 'rgba(23, 23, 23, 0.6)',
          border: isLogged
            ? '1px solid rgba(16, 185, 129, 0.3)'
            : '1px solid rgba(249, 115, 22, 0.1)',
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '1rem' : '1.25rem',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          boxShadow: isLogged 
            ? '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
            : '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }}
      >
        {/* Top glow accent */}
        {isLogged && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
            opacity: 0.6
          }} />
        )}
        
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-15%',
          opacity: 0.02,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <Dumbbell size={isMobile ? 100 : 120} color={isLogged ? '#10b981' : '#f97316'} />
        </div>
        
        {/* Completed badge */}
        {isLogged && (
          <div style={{
            position: 'absolute',
            top: isMobile ? '0.75rem' : '1rem',
            right: isMobile ? '0.75rem' : '1rem',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.3rem 0.6rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
            zIndex: 2
          }}>
            <CheckCircle 
              size={isMobile ? 12 : 13} 
              color="#10b981"
              style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
            />
            <span style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              fontWeight: '700',
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              GELOGD
            </span>
          </div>
        )}
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header with exercise name and number */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: isMobile ? '0.625rem' : '0.75rem',
            marginBottom: isMobile ? '0.875rem' : '1rem'
          }}>
            {/* Exercise number badge */}
            <div style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: '8px',
              background: isLogged
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(249, 115, 22, 0.2)',
              border: isLogged
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(249, 115, 22, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: isLogged
                ? '0 0 15px rgba(16, 185, 129, 0.3)'
                : '0 0 15px rgba(249, 115, 22, 0.3)'
            }}>
              <span style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '800',
                color: isLogged ? '#10b981' : '#f97316',
                letterSpacing: '-0.02em'
              }}>
                {index + 1}
              </span>
            </div>
            
            {/* Exercise name and muscle group */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '800',
                color: '#fff',
                margin: '0 0 0.35rem 0',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                {exercise.name}
              </h3>
              
              {exercise.primairSpieren && (
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: isLogged ? '#10b981' : '#f97316',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <Dumbbell size={isMobile ? 11 : 12} />
                  {exercise.primairSpieren}
                </div>
              )}
            </div>
          </div>
          
          {/* Exercise details grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: isMobile ? '0.4rem' : '0.5rem',
            marginBottom: isMobile ? '0.875rem' : '1rem'
          }}>
            {/* Sets */}
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.1)',
              borderRadius: '8px',
              padding: isMobile ? '0.5rem' : '0.625rem',
              textAlign: 'center',
              minHeight: '44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '800',
                color: '#f97316',
                marginBottom: '0.1rem',
                letterSpacing: '-0.02em'
              }}>
                {exercise.sets}
              </div>
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Sets
              </div>
            </div>
            
            {/* Reps */}
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.1)',
              borderRadius: '8px',
              padding: isMobile ? '0.5rem' : '0.625rem',
              textAlign: 'center',
              minHeight: '44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '800',
                color: '#f97316',
                marginBottom: '0.1rem',
                letterSpacing: '-0.02em'
              }}>
                {exercise.reps}
              </div>
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Reps
              </div>
            </div>
            
            {/* Rest */}
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.1)',
              borderRadius: '8px',
              padding: isMobile ? '0.5rem' : '0.625rem',
              textAlign: 'center',
              minHeight: '44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '800',
                color: '#f97316',
                marginBottom: '0.1rem',
                letterSpacing: '-0.02em'
              }}>
                {exercise.rust}
              </div>
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Rust
              </div>
            </div>
            
            {/* RIR/RPE */}
            <div style={{
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.1)',
              borderRadius: '8px',
              padding: isMobile ? '0.5rem' : '0.625rem',
              textAlign: 'center',
              minHeight: '44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '800',
                color: '#f97316',
                marginBottom: '0.1rem',
                letterSpacing: '-0.02em'
              }}>
                {exercise.rpe || exercise.rir || '-'}
              </div>
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                RIR
              </div>
            </div>
          </div>
          
          {/* Previous log history - COMPACT */}
          <ExerciseHistory 
            previousLog={previousLog}
            loading={loadingHistory}
          />
          
          {/* Action buttons */}
          <ExerciseActions
            onInfo={() => setShowInfoModal(true)}
            onSwap={() => setShowSwapModal(true)}
            onLog={() => setShowLogModal(true)}
            isLogged={isLogged}
          />
        </div>
      </div>
      
      {/* Info Modal */}
      {showInfoModal && (
        <InfoModal
          exercise={exercise}
          onClose={() => setShowInfoModal(false)}
          db={db}
        />
      )}
      
      {/* Swap Modal */}
      {showSwapModal && (
        <SwapModal
          exercise={exercise}
          exerciseIndex={index}
          workoutDayKey={workoutDayKey}
          schema={schema}
          onClose={() => setShowSwapModal(false)}
          onSwapComplete={handleSwapComplete}
          db={db}
        />
      )}
      
      {/* Exercise Log Modal - NIEUWE VERSIE */}
      {showLogModal && (
        <ExerciseLogModal
          db={db}
          client={client}
          exercise={exercise}
          onClose={handleLogComplete}
        />
      )}
    </div>
  )
}
