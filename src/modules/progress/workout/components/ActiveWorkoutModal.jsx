// src/modules/progress/workout/components/ActiveWorkoutModal.jsx
// PREMIUM DARK THEME VERSION - Matching AlternativeExercises style

import { useState, useRef, useEffect } from 'react'
import { 
  X, Play, Check, ChevronRight, Plus, 
  Target, Activity, Timer, Award, Flame,
  TrendingUp, Zap, ChevronLeft, Pause
} from 'lucide-react'

const THEME = {
  primary: '#f97316',
  primaryDark: '#ea580c',
  gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
  cardGradient: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
  border: 'rgba(249, 115, 22, 0.15)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
}

export default function ActiveWorkoutModal({ 
  activeWorkout, 
  currentExercise = 0, 
  exerciseData = {}, 
  restTimer = null, 
  isMobile,
  onClose, 
  onAddSet, 
  onNextExercise, 
  onFinishWorkout
}) {
  const [swipeDistance, setSwipeDistance] = useState(0)
  const modalRef = useRef(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  
  const mobile = isMobile !== undefined ? isMobile : window.innerWidth <= 768
  
  // Touch handlers for swipe to close
  const handleTouchStart = (e) => {
    if (!mobile) return
    startY.current = e.touches[0].clientY
  }
  
  const handleTouchMove = (e) => {
    if (!mobile || !modalRef.current) return
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      setSwipeDistance(deltaY)
      modalRef.current.style.transform = `translateY(${deltaY}px)`
      modalRef.current.style.opacity = 1 - (deltaY / 400)
    }
  }
  
  const handleTouchEnd = () => {
    if (!mobile || !modalRef.current) return
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 150) {
      onClose()
    } else {
      setSwipeDistance(0)
      modalRef.current.style.transform = 'translateY(0)'
      modalRef.current.style.opacity = 1
    }
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const exercise = activeWorkout?.exercises?.[currentExercise]
  const exerciseState = exerciseData[currentExercise] || { sets: [] }
  
  if (!activeWorkout || !exercise) {
    return null
  }
  
  return (
    <div 
      ref={modalRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 3000, // Higher than alternatives (2000)
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease',
        transition: 'transform 0.3s ease, opacity 0.3s ease'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Premium Header - Dark Theme */}
      <div style={{
        background: 'linear-gradient(180deg, #171717 0%, #0a0a0a 100%)',
        borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Swipe Handle */}
        {mobile && (
          <div style={{
            padding: '0.5rem 0 0',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '4px',
              background: 'rgba(249, 115, 22, 0.3)',
              borderRadius: '2px',
              cursor: 'grab'
            }} />
          </div>
        )}
        
        {/* Navigation Bar */}
        <div style={{
          padding: mobile ? '0.75rem 1rem' : '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: mobile ? '0.75rem' : '1rem'
        }}>
          {/* Back Button */}
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              width: mobile ? '36px' : '40px',
              height: mobile ? '36px' : '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0
            }}
          >
            <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
          </button>
          
          {/* Workout Name */}
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: mobile ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.01em'
            }}>
              {activeWorkout.name}
            </h2>
            <p style={{
              fontSize: mobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255,255,255,0.5)',
              margin: '0.1rem 0 0 0'
            }}>
              Oefening {currentExercise + 1} van {activeWorkout.exercises.length}
            </p>
          </div>
          
          {/* Timer Badge */}
          {restTimer && (
            <div style={{
              padding: '0.3rem 0.6rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '8px',
              fontSize: mobile ? '0.8rem' : '0.85rem',
              color: '#fff',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              flexShrink: 0,
              animation: 'pulse 2s infinite'
            }}>
              <Timer size={14} />
              {formatTime(restTimer)}
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              width: mobile ? '36px' : '40px',
              height: mobile ? '36px' : '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <X size={16} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div style={{
          padding: '0 1rem 0.75rem',
          display: 'flex',
          gap: '0.25rem'
        }}>
          {activeWorkout.exercises.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '2px',
                background: i <= currentExercise 
                  ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' 
                  : 'rgba(255,255,255,0.1)',
                boxShadow: i <= currentExercise 
                  ? '0 0 10px rgba(249, 115, 22, 0.4)' 
                  : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* Exercise Content - Scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: mobile ? '1rem' : '1.5rem',
        paddingBottom: mobile ? '2rem' : '3rem',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Current Exercise Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.06) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: '16px',
          padding: mobile ? '1rem' : '1.25rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: mobile ? '40px' : '44px',
              height: mobile ? '40px' : '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
            }}>
              <Activity size={mobile ? 18 : 20} color="#fff" />
            </div>
            <div>
              <p style={{
                fontSize: '0.65rem',
                color: '#f97316',
                margin: '0 0 0.1rem 0',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Huidige oefening
              </p>
              <h3 style={{
                fontSize: mobile ? '1.2rem' : '1.4rem',
                fontWeight: '800',
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                {exercise.name}
              </h3>
            </div>
          </div>
          
          {/* Exercise Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: mobile ? '0.5rem' : '0.75rem'
          }}>
            <StatCard 
              label="Sets" 
              value={exercise.sets || 3} 
              icon={Target} 
              color="#f97316"
              mobile={mobile}
            />
            <StatCard 
              label="Reps" 
              value={exercise.reps || '10'} 
              icon={Activity} 
              color="#3b82f6"
              mobile={mobile}
            />
            <StatCard 
              label="Rust" 
              value={exercise.rest || '90s'} 
              icon={Timer} 
              color="#10b981"
              mobile={mobile}
            />
          </div>
        </div>

        {/* Completed Sets */}
        {exerciseState.sets.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontSize: mobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255,255,255,0.4)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Award size={14} color="#10b981" />
              Voltooide Sets
            </h4>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: mobile ? '0.5rem' : '0.75rem'
            }}>
              {exerciseState.sets.map((set, index) => (
                <CompletedSetCard 
                  key={index}
                  set={set}
                  index={index}
                  mobile={mobile}
                />
              ))}
            </div>
          </div>
        )}

        {/* Set Input Section */}
        <QuickSetInput 
          onAddSet={onAddSet}
          lastSet={exerciseState.sets[exerciseState.sets.length - 1]}
          targetReps={exercise.reps}
          mobile={mobile}
        />
      </div>

      {/* Bottom Action Bar */}
      <div style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(17, 17, 17, 0.98) 50%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(249, 115, 22, 0.08)',
        padding: mobile ? '1rem' : '1.25rem 1.5rem',
        position: 'sticky',
        bottom: 0
      }}>
        {currentExercise < activeWorkout.exercises.length - 1 ? (
          <button
            onClick={onNextExercise}
            style={{
              width: '100%',
              padding: mobile ? '0.875rem' : '1rem',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: mobile ? '0.9rem' : '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 10px 25px rgba(249, 115, 22, 0.25)',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onTouchStart={(e) => {
              if (mobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (mobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            Volgende Oefening
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={onFinishWorkout}
            style={{
              width: '100%',
              padding: mobile ? '0.875rem' : '1rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: mobile ? '0.9rem' : '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <Check size={18} />
            Workout Voltooien
          </button>
        )}
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        /* Hide scrollbar but keep functionality */
        *::-webkit-scrollbar {
          width: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.2);
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color, mobile }) {
  return (
    <div style={{
      background: 'rgba(17, 17, 17, 0.6)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: mobile ? '0.75rem' : '0.875rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Icon 
        size={28} 
        color={color} 
        style={{
          position: 'absolute',
          bottom: '-6px',
          right: '-6px',
          opacity: 0.08
        }}
      />
      <div style={{
        fontSize: mobile ? '1.25rem' : '1.5rem',
        fontWeight: '800',
        color: color,
        lineHeight: 1,
        marginBottom: '0.2rem',
        textShadow: `0 0 20px ${color}40`
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.65rem',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: '600'
      }}>
        {label}
      </div>
    </div>
  )
}

// Completed Set Card Component
function CompletedSetCard({ set, index, mobile }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
      border: '1px solid rgba(16, 185, 129, 0.15)',
      borderRadius: '12px',
      padding: mobile ? '0.75rem' : '0.875rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
      }} />
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        paddingLeft: '0.5rem'
      }}>
        <span style={{
          fontSize: mobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255,255,255,0.4)',
          fontWeight: '600'
        }}>
          Set {index + 1}
        </span>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <span style={{
          fontSize: mobile ? '1rem' : '1.1rem',
          fontWeight: '700',
          color: '#fff'
        }}>
          {set.weight}kg × {set.reps}
        </span>
        <Check size={mobile ? 16 : 18} color="#10b981" />
      </div>
    </div>
  )
}

// Quick Set Input Component
function QuickSetInput({ onAddSet, lastSet, targetReps, mobile }) {
  const [weight, setWeight] = useState(lastSet?.weight || '')
  // Handle targetReps that might be a range like "6-8"
  const defaultReps = targetReps ? 
    (typeof targetReps === 'string' && targetReps.includes('-') ? 
      targetReps.split('-')[1] : // Take the higher number from range
      targetReps) : ''
  const [reps, setReps] = useState(lastSet?.reps || defaultReps)
  
  const handleAddSet = () => {
    if (weight && reps) {
      onAddSet(weight, reps)
      setReps(targetReps || '')
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(249, 115, 22, 0.08)',
      padding: mobile ? '1rem' : '1.25rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #f97316 0%, #ea580c 50%, #f97316 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 3s ease-in-out infinite'
      }} />
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        justifyContent: 'center'
      }}>
        <Plus size={mobile ? 16 : 18} color="#f97316" />
        <span style={{
          fontSize: mobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: '700'
        }}>
          Voeg Set Toe
        </span>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: mobile ? '0.75rem' : '1rem',
        marginBottom: '1rem'
      }}>
        <div>
          <label style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.4)',
            display: 'block',
            marginBottom: '0.4rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            Gewicht (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={{
              width: '100%',
              padding: mobile ? '0.75rem' : '0.875rem',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(249,115,22,0.15)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: mobile ? '1rem' : '1.1rem',
              textAlign: 'center',
              outline: 'none',
              transition: 'all 0.2s ease',
              WebkitAppearance: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
              e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.15)'
              e.currentTarget.style.background = 'rgba(0,0,0,0.4)'
            }}
            placeholder="0"
          />
        </div>
        
        <div>
          <label style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.4)',
            display: 'block',
            marginBottom: '0.4rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            Reps
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            style={{
              width: '100%',
              padding: mobile ? '0.75rem' : '0.875rem',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(249,115,22,0.15)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: mobile ? '1rem' : '1.1rem',
              textAlign: 'center',
              outline: 'none',
              transition: 'all 0.2s ease',
              WebkitAppearance: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
              e.currentTarget.style.background = 'rgba(0,0,0,0.6)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.15)'
              e.currentTarget.style.background = 'rgba(0,0,0,0.4)'
            }}
            placeholder="0"
          />
        </div>
      </div>
      
      <button
        type="button"
        onClick={handleAddSet}
        disabled={!weight || !reps}
        style={{
          width: '100%',
          padding: mobile ? '0.75rem' : '0.875rem',
          background: weight && reps 
            ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' 
            : 'rgba(255,255,255,0.05)',
          border: weight && reps
            ? 'none'
            : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          color: weight && reps ? '#fff' : 'rgba(255,255,255,0.3)',
          fontSize: mobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          cursor: weight && reps ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          boxShadow: weight && reps ? '0 8px 20px rgba(249, 115, 22, 0.25)' : 'none',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '40px'
        }}
      >
        <Plus size={16} />
        Set Toevoegen
      </button>
      
      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 100% 0; }
        }
      `}</style>
    </div>
  )
}
