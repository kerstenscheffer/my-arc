// src/modules/workout/components/PlanningModal.jsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Save, Dumbbell, Moon, Waves, Heart } from 'lucide-react'

export default function PlanningModal({ 
  schema, 
  currentSchedule, 
  clientId, 
  db, 
  onClose, 
  onSave 
}) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [schedule, setSchedule] = useState({})
  const [saving, setSaving] = useState(false)
  
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const weekDaysDutch = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
  
  // Get workout options from schema
  const workoutOptions = schema?.week_structure 
    ? Object.entries(schema.week_structure).map(([key, workout]) => ({
        value: key,
        label: workout.name,
        focus: workout.focus,
        exercises: workout.exercises?.length || 0
      }))
    : []
  
  // Activity types
  const activityTypes = [
    { value: 'rest', label: 'Rust', icon: Moon, color: '#6b7280' },
    { value: 'cardio', label: 'Cardio', icon: Heart, color: '#ef4444' },
    { value: 'swimming', label: 'Zwemmen', icon: Waves, color: '#3b82f6' }
  ]
  
  // Initialize with current schedule
  useEffect(() => {
    setSchedule(currentSchedule || {})
    setTimeout(() => setVisible(true), 50)
  }, [currentSchedule])
  
  // Handle day change
  const handleDayChange = (day, value) => {
    const newSchedule = { ...schedule }
    
    if (value === 'rest' || !value) {
      delete newSchedule[day]
    } else {
      newSchedule[day] = value
    }
    
    setSchedule(newSchedule)
  }
  
  // Handle save
  const handleSave = async () => {
    if (!clientId || !db) return
    
    setSaving(true)
    
    try {
      await db.updateClientWorkoutSchedule(clientId, schedule)
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
      if (onSave) onSave(schedule)
      
      handleClose()
    } catch (error) {
      console.error('❌ Error saving schedule:', error)
      alert('Er ging iets mis bij het opslaan. Probeer opnieuw.')
      setSaving(false)
    }
  }
  
  // Handle close
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }
  
  // Get selected workout/activity data
  const getSelectedData = (day) => {
    const value = schedule[day]
    if (!value) return null
    
    // Check if it's a workout
    const workout = workoutOptions.find(w => w.value === value)
    if (workout) return { type: 'workout', ...workout }
    
    // Check if it's an activity
    const activity = activityTypes.find(a => a.value === value)
    if (activity) return { type: 'activity', ...activity }
    
    return null
  }
  
  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0.75rem' : '1.5rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          borderRadius: isMobile ? '14px' : '18px',
          width: isMobile ? '95vw' : '700px',
          maxHeight: isMobile ? '90vh' : '85vh',
          boxShadow: '0 20px 60px rgba(249, 115, 22, 0.25)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
        
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                borderRadius: '10px',
                background: 'rgba(249, 115, 22, 0.2)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)'
              }}>
                <Calendar 
                  size={isMobile ? 18 : 20} 
                  color="#f97316"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))' }}
                />
              </div>
              
              <div>
                <h2 style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: '800',
                  color: '#fff',
                  margin: 0,
                  marginBottom: '0.1rem',
                  letterSpacing: '-0.02em'
                }}>
                  Plan je Workout Week
                </h2>
                <p style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  Kies je workouts en activiteiten per dag
                </p>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              style={{
                width: '44px',
                height: '44px',
                minHeight: '44px',
                flexShrink: 0,
                borderRadius: '10px',
                background: 'rgba(23, 23, 23, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: '#f97316',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={isMobile ? 18 : 20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        
        {/* Scrollable days */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            {weekDays.map((day, index) => (
              <DayRow
                key={day}
                day={day}
                dayDutch={weekDaysDutch[index]}
                selectedValue={schedule[day]}
                selectedData={getSelectedData(day)}
                workoutOptions={workoutOptions}
                activityTypes={activityTypes}
                onChange={(value) => handleDayChange(day, value)}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
        
        {/* Footer buttons */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderTop: '1px solid rgba(249, 115, 22, 0.1)',
          flexShrink: 0,
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Annuleren
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: saving
                ? 'rgba(107, 114, 128, 0.3)'
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '10px',
              color: saving ? 'rgba(255, 255, 255, 0.5)' : '#000',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: saving
                ? 'none'
                : '0 4px 20px rgba(249, 115, 22, 0.35)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: isMobile ? '16px' : '18px',
                  height: isMobile ? '16px' : '18px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Opslaan...
              </>
            ) : (
              <>
                <Save size={isMobile ? 16 : 18} />
                Planning Opslaan
              </>
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
  
  return createPortal(modalContent, document.body)
}

// Day Row Component
function DayRow({ 
  day, 
  dayDutch, 
  selectedValue, 
  selectedData,
  workoutOptions, 
  activityTypes, 
  onChange, 
  isMobile 
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div style={{
      background: 'rgba(23, 23, 23, 0.6)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(249, 115, 22, 0.1)',
      borderRadius: '10px',
      padding: isMobile ? '0.875rem' : '1rem',
      transition: 'all 0.3s ease'
    }}>
      {/* Day header with selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: selectedData ? '0.75rem' : 0
      }}>
        {/* Day label */}
        <div style={{
          width: isMobile ? '80px' : '100px',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.15rem'
          }}>
            {dayDutch}
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            {day}
          </div>
        </div>
        
        {/* Dropdown */}
        <div style={{ flex: 1, position: 'relative' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: '100%',
              padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {selectedData 
                ? selectedData.label || selectedData.value
                : 'Kies activiteit...'}
            </span>
            <span style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)'
            }}>
              ▼
            </span>
          </button>
          
          {/* Dropdown menu */}
          {isOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.25rem',
              background: 'rgba(17, 17, 17, 0.98)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '8px',
              zIndex: 1000,
              maxHeight: '300px',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Rest option */}
              <button
                onClick={() => {
                  onChange('rest')
                  setIsOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: selectedValue === 'rest' || !selectedValue
                    ? 'rgba(249, 115, 22, 0.1)'
                    : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Moon size={14} color="#6b7280" />
                Rust
              </button>
              
              {/* Activity types */}
              {activityTypes.filter(a => a.value !== 'rest').map(activity => (
                <button
                  key={activity.value}
                  onClick={() => {
                    onChange(activity.value)
                    setIsOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: selectedValue === activity.value
                      ? 'rgba(249, 115, 22, 0.1)'
                      : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
                    color: '#fff',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <activity.icon size={14} color={activity.color} />
                  {activity.label}
                </button>
              ))}
              
              {/* Workout options */}
              {workoutOptions.length > 0 && (
                <div style={{
                  padding: '0.5rem',
                  fontSize: '0.65rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '700',
                  borderBottom: '1px solid rgba(249, 115, 22, 0.1)'
                }}>
                  Workouts
                </div>
              )}
              
              {workoutOptions.map(workout => (
                <button
                  key={workout.value}
                  onClick={() => {
                    onChange(workout.value)
                    setIsOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: selectedValue === workout.value
                      ? 'rgba(249, 115, 22, 0.1)'
                      : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
                    color: '#fff',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Dumbbell size={14} color="#f97316" />
                  <div style={{ flex: 1 }}>
                    <div>{workout.label}</div>
                    <div style={{
                      fontSize: '0.65rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      marginTop: '0.1rem'
                    }}>
                      {workout.focus} • {workout.exercises} oefeningen
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Selected workout preview */}
      {selectedData && selectedData.type === 'workout' && (
        <div style={{
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
          background: 'rgba(249, 115, 22, 0.05)',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          borderRadius: '8px',
          marginTop: '0.75rem'
        }}>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '600'
          }}>
            {selectedData.focus} • {selectedData.exercises} oefeningen
          </div>
        </div>
      )}
    </div>
  )
}
