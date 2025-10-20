// src/modules/workout/components/planning/ActivitySelectorModal.jsx
// FULLSCREEN MOBILE MODAL - Met Custom Workouts & Templates 🔥

import { X, Dumbbell, Moon, Heart, Waves, Search, Plus, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function ActivitySelectorModal({
  selectedValue,
  workoutOptions,
  activityTypes,
  onChange,
  onClose,
  workoutService,
  clientId,
  onOpenCustomModal
}) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredWorkouts, setFilteredWorkouts] = useState(workoutOptions)
  const [customWorkouts, setCustomWorkouts] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    loadCustomWorkouts()
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])
  
  useEffect(() => {
    document.body.style.overflow = 'hidden'
  }, [])
  
  const loadCustomWorkouts = async () => {
    if (!workoutService || !clientId) return
    
    setLoading(true)
    try {
      const [allWorkouts, templateWorkouts] = await Promise.all([
        workoutService.getCustomWorkouts(clientId),
        workoutService.getCustomWorkoutTemplates(clientId)
      ])
      
      setCustomWorkouts(allWorkouts)
      setTemplates(templateWorkouts)
    } catch (error) {
      console.error('❌ Load custom workouts failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Filter workouts based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredWorkouts(workoutOptions)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = workoutOptions.filter(workout =>
      workout.label.toLowerCase().includes(query) ||
      workout.focus.toLowerCase().includes(query)
    )
    setFilteredWorkouts(filtered)
  }, [searchQuery, workoutOptions])
  
  const handleSelect = (value) => {
    onChange(value)
    handleClose()
  }
  
  const handleSelectCustom = (customWorkout) => {
    // Pass custom workout ID with prefix
    onChange(`custom_${customWorkout.id}`)
    handleClose()
  }
  
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }
  
  const getActivityIcon = (value) => {
    switch(value) {
      case 'rest': return Moon
      case 'cardio': return Heart
      case 'swimming': return Waves
      default: return Dumbbell
    }
  }
  
  const getActivityColor = (value) => {
    switch(value) {
      case 'rest': return '#6b7280'
      case 'cardio': return '#ef4444'
      case 'swimming': return '#3b82f6'
      default: return '#f97316'
    }
  }
  
  const getCustomWorkoutIcon = (type) => {
    const icons = {
      cardio: '❤️',
      cycling: '🚴',
      running: '🏃',
      swimming: '🏊',
      hiking: '🥾',
      yoga: '🧘',
      sports: '⚽',
      custom: '💪'
    }
    return icons[type] || '💪'
  }
  
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '2rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        style={{
          width: '100%',
          height: isMobile ? '100vh' : 'auto',
          maxWidth: isMobile ? '100%' : '600px',
          maxHeight: isMobile ? '100vh' : '85vh',
          background: '#000',
          border: isMobile ? 'none' : '2px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '900',
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.02em',
              textShadow: '0 0 20px rgba(249, 115, 22, 0.3)',
              flex: 1
            }}>
              Kies Activiteit
            </h2>
            
            <button
              onClick={handleClose}
              style={{
                width: '44px',
                height: '44px',
                background: 'transparent',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '0',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginLeft: '1rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={isMobile ? 20 : 24} strokeWidth={2.5} />
            </button>
          </div>
          
          {/* Search */}
          <div style={{
            position: 'relative',
            marginBottom: '1rem'
          }}>
            <Search 
              size={18} 
              color="rgba(249, 115, 22, 0.5)"
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Zoek workout..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem 1rem 0.75rem 3rem' : '0.875rem 1.25rem 0.875rem 3.5rem',
                background: 'rgba(249, 115, 22, 0.05)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '0',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                fontWeight: '500',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
          
          {searchQuery && (
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600'
            }}>
              {filteredWorkouts.length} resultaten gevonden
            </div>
          )}
        </div>
        
        {/* Scrollable content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.5rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Activities Section */}
          <div style={{
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: '800',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(249, 115, 22, 0.15)'
            }}>
              Activiteiten
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '0.75rem'
            }}>
              {/* Rest */}
              <ActivityButton
                onClick={() => handleSelect('rest')}
                isSelected={selectedValue === 'rest' || !selectedValue}
                icon={Moon}
                color="#6b7280"
                label="Rust"
                description="Hersteldag"
                isMobile={isMobile}
              />
              
              {/* Other activities */}
              {activityTypes.filter(a => a.value !== 'rest').map(activity => {
                const IconComponent = getActivityIcon(activity.value)
                return (
                  <ActivityButton
                    key={activity.value}
                    onClick={() => handleSelect(activity.value)}
                    isSelected={selectedValue === activity.value}
                    icon={IconComponent}
                    color={activity.color}
                    label={activity.label}
                    description="Cardio training"
                    isMobile={isMobile}
                  />
                )
              })}
            </div>
          </div>
          
          {/* Custom Workouts Templates Section */}
          {templates.length > 0 && (
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '800',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Star size={14} color="rgba(249, 115, 22, 0.7)" />
                Mijn Templates
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '0.75rem'
              }}>
                {templates.map(workout => (
                  <CustomWorkoutButton
                    key={workout.id}
                    workout={workout}
                    isSelected={selectedValue === `custom_${workout.id}`}
                    onClick={() => handleSelectCustom(workout)}
                    emoji={getCustomWorkoutIcon(workout.type)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Add Custom Workout Button */}
          <button
            onClick={() => {
              handleClose()
              if (onOpenCustomModal) onOpenCustomModal()
            }}
            style={{
              width: '100%',
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '2px dashed rgba(249, 115, 22, 0.3)',
              borderRadius: '0',
              color: '#f97316',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              minHeight: '44px',
              marginBottom: '1.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Plus size={isMobile ? 18 : 20} />
            Eigen Training Toevoegen
          </button>
          
          {/* Workouts Section */}
          {workoutOptions.length > 0 && (
            <div>
              <h3 style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '800',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid rgba(249, 115, 22, 0.15)'
              }}>
                🏋️ Schema Workouts
              </h3>
              
              {filteredWorkouts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}>
                  Geen workouts gevonden voor "{searchQuery}"
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '0.75rem'
                }}>
                  {filteredWorkouts.map(workout => (
                    <button
                      key={workout.value}
                      onClick={() => handleSelect(workout.value)}
                      style={{
                        padding: isMobile ? '1rem' : '1.25rem',
                        background: selectedValue === workout.value
                          ? 'rgba(249, 115, 22, 0.15)'
                          : 'rgba(10, 10, 10, 0.8)',
                        border: selectedValue === workout.value
                          ? '1px solid rgba(249, 115, 22, 0.4)'
                          : '1px solid rgba(249, 115, 22, 0.2)',
                        borderRadius: '0',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: 'rgba(249, 115, 22, 0.2)',
                        border: '1px solid rgba(249, 115, 22, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.3))'
                      }}>
                        <Dumbbell size={20} color="#f97316" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: isMobile ? '0.95rem' : '1rem',
                          fontWeight: '800',
                          color: '#fff',
                          marginBottom: '0.3rem'
                        }}>
                          {workout.label}
                        </div>
                        <div style={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontWeight: '600'
                        }}>
                          {workout.focus} • {workout.exercises} oefeningen
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Helper Components
function ActivityButton({ onClick, isSelected, icon: Icon, color, label, description, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: isSelected ? `${color}20` : 'rgba(10, 10, 10, 0.8)',
        border: isSelected ? `1px solid ${color}60` : '1px solid rgba(249, 115, 22, 0.2)',
        borderRadius: '0',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minHeight: '44px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: `${color}20`,
        border: `1px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: isMobile ? '0.95rem' : '1rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '0.2rem'
        }}>
          {label}
        </div>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '600'
        }}>
          {description}
        </div>
      </div>
    </button>
  )
}

function CustomWorkoutButton({ workout, isSelected, onClick, emoji, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: isSelected ? 'rgba(249, 115, 22, 0.15)' : 'rgba(10, 10, 10, 0.8)',
        border: isSelected
          ? '1px solid rgba(249, 115, 22, 0.4)'
          : '1px solid rgba(249, 115, 22, 0.2)',
        borderRadius: '0',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minHeight: '44px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: 'rgba(249, 115, 22, 0.15)',
        border: '1px solid rgba(249, 115, 22, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '1.5rem'
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: isMobile ? '0.95rem' : '1rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '0.3rem'
        }}>
          {workout.name}
        </div>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '600'
        }}>
          {workout.duration} min {workout.description && `• ${workout.description.substring(0, 30)}...`}
        </div>
      </div>
    </button>
  )
}
