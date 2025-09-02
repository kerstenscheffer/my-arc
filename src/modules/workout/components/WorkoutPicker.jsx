import useIsMobile from '../../../hooks/useIsMobile'
// src/modules/workout/components/WorkoutPicker.jsx
import { X, ChevronRight, Calendar, Moon, Activity, AlertCircle } from 'lucide-react'

export default function WorkoutPicker({ 
  schema, 
  weekSchedule, 
  selectedDay, 
  onSelect, 
  onClose, 
  onClearDay 
}) {
  const workoutDays = Object.keys(schema.week_structure)
  const isMobile = useIsMobile()
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease',
      backdropFilter: 'blur(10px)'
    }}
    onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          background: 'linear-gradient(180deg, #171717 0%, #0a0a0a 100%)',
          borderRadius: '24px 24px 0 0',
          padding: '1.5rem 1rem 2rem',
          maxHeight: isMobile ? '85vh' : '75vh',
          overflowY: 'auto',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 -10px 40px rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          borderBottom: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div style={{
          width: '48px',
          height: '5px',
          background: 'rgba(249, 115, 22, 0.3)',
          borderRadius: '3px',
          margin: '0 auto 1.5rem',
          cursor: 'grab'
        }} />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.2rem' : '1.3rem',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.25rem',
              fontWeight: '800'
            }}>
              Workout Toewijzen
            </h3>
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.5)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Calendar size={14} />
              Voor {selectedDay}
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        
        {/* Info message */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.15)',
          borderRadius: '12px',
          padding: '0.875rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={16} color="#f97316" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <p style={{
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.7)',
              margin: 0,
              lineHeight: 1.4
            }}>
              Selecteer een workout uit je schema of maak deze dag een rustdag.
            </p>
          </div>
        </div>
        
        {/* Workouts list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          {workoutDays.map((workoutKey) => {
            const workout = schema.week_structure[workoutKey]
            const isAssigned = Object.values(weekSchedule).includes(workoutKey)
            const assignedDay = Object.keys(weekSchedule).find(day => weekSchedule[day] === workoutKey)
            
            return (
              <button
                key={workoutKey}
                onClick={() => onSelect(workoutKey)}
                disabled={isAssigned}
                style={{
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: isAssigned 
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
                  border: `1px solid ${isAssigned 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(249, 115, 22, 0.1)'}`,
                  borderRadius: '14px',
                  cursor: isAssigned ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: isAssigned ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'left'
                }}
              >
                {/* Orange accent line when not assigned */}
                {!isAssigned && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)'
                  }} />
                )}
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  paddingLeft: !isAssigned ? '0.5rem' : 0
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: isAssigned 
                      ? 'rgba(255,255,255,0.05)'
                      : 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Activity size={18} color={isAssigned ? 'rgba(255,255,255,0.3)' : '#f97316'} />
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      color: '#fff',
                      fontWeight: '700',
                      marginBottom: '0.25rem'
                    }}>
                      {workout.name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {workout.focus}
                      {isAssigned && (
                        <>
                          <span>•</span>
                          <span style={{ color: 'rgba(249, 115, 22, 0.5)' }}>
                            Al ingepland op {assignedDay}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {!isAssigned && (
                  <ChevronRight size={18} color="rgba(249, 115, 22, 0.5)" />
                )}
              </button>
            )
          })}
        </div>
        
        {/* Clear Day Option */}
        <button
          onClick={onClearDay}
          style={{
            width: '100%',
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
          }}
        >
          <Moon size={18} color="#ef4444" />
          <span style={{ 
            color: '#ef4444', 
            fontWeight: '700',
            fontSize: '0.9rem'
          }}>
            Maak rustdag
          </span>
        </button>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
