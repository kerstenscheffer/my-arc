import React, { useState, useEffect } from 'react'
import { X, Calendar, Zap, Check, ChevronRight, ChevronLeft, Sparkles, Edit2, Trash2 } from 'lucide-react'

export default function PlanningWizard({ 
  workoutService, 
  clientId, 
  schema, 
  onComplete, 
  onClose 
}) {
  const isMobile = window.innerWidth <= 768

  // State management
  const [step, setStep] = useState(1)
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(null)
  const [selectedDays, setSelectedDays] = useState([])
  const [workoutAssignments, setWorkoutAssignments] = useState({})
  const [customWorkouts, setCustomWorkouts] = useState([])
  const [editingDay, setEditingDay] = useState(null)
  const [loading, setLoading] = useState(false)

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayLabels = {
    Monday: 'Ma',
    Tuesday: 'Di',
    Wednesday: 'Wo',
    Thursday: 'Do',
    Friday: 'Vr',
    Saturday: 'Za',
    Sunday: 'Zo'
  }

  // Load custom workouts on mount
  useEffect(() => {
    loadCustomWorkouts()
  }, [])

  const loadCustomWorkouts = async () => {
    if (!workoutService || !clientId) return
    try {
      const customs = await workoutService.getCustomWorkouts(clientId)
      setCustomWorkouts(customs || [])
    } catch (error) {
      console.error('❌ Failed to load custom workouts:', error)
    }
  }

  // Get all available workouts (schema + custom)
  const getAllWorkouts = () => {
    const schemaWorkouts = schema?.week_structure 
      ? Object.entries(schema.week_structure).map(([key, workout]) => ({
          value: key,
          label: workout.name || key,
          type: 'schema',
          focus: workout.focus,
          data: workout
        }))
      : []

    const customWorkoutOptions = customWorkouts.map(w => ({
      value: `custom_${w.id}`,
      label: w.name,
      type: 'custom',
      emoji: getCustomWorkoutEmoji(w.type),
      duration: w.duration,
      data: w
    }))

    return [...schemaWorkouts, ...customWorkoutOptions]
  }

  const getCustomWorkoutEmoji = (type) => {
    const emojis = {
      running: '🏃',
      cycling: '🚴',
      swimming: '🏊',
      walking: '🚶',
      yoga: '🧘',
      hiking: '🥾',
      boxing: '🥊',
      dancing: '💃',
      other: '⚡'
    }
    return emojis[type] || emojis.other
  }

  // Auto-assign workouts to selected days
  const autoAssignWorkouts = () => {
    const allWorkouts = getAllWorkouts()
    if (allWorkouts.length === 0) return

    const assignments = {}
    selectedDays.forEach((day, index) => {
      const workoutIndex = index % allWorkouts.length
      assignments[day] = allWorkouts[workoutIndex].value
    })

    setWorkoutAssignments(assignments)
  }

  // Handle workout assignment for specific day
  const assignWorkoutToDay = (day, workoutKey) => {
    setWorkoutAssignments(prev => ({
      ...prev,
      [day]: workoutKey
    }))
    setEditingDay(null)
  }

  // Remove workout from day
  const removeWorkoutFromDay = (day) => {
    setWorkoutAssignments(prev => {
      const updated = { ...prev }
      delete updated[day]
      return updated
    })
  }

  // Get workout display data
  const getWorkoutDisplay = (workoutKey) => {
    const allWorkouts = getAllWorkouts()
    const workout = allWorkouts.find(w => w.value === workoutKey)
    return workout || null
  }

  // Save schedule to database
  const handleSaveSchedule = async () => {
    setLoading(true)
    try {
      // Convert assignments to proper format
      const schedule = {}
      Object.entries(workoutAssignments).forEach(([day, workoutKey]) => {
        schedule[day] = workoutKey
      })

      // Save via workoutService
      await workoutService.updateWeekSchedule(clientId, schedule)

      // Success callback
      if (onComplete) {
        onComplete(schedule)
      }
    } catch (error) {
      console.error('❌ Failed to save schedule:', error)
      alert('Er ging iets mis bij het opslaan. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  // Navigation
  const goNext = () => {
    if (step === 1 && !targetDaysPerWeek) return
    if (step === 2 && selectedDays.length === 0) return
    if (step === 3 && Object.keys(workoutAssignments).length === 0) return
    setStep(prev => Math.min(prev + 1, 5))
  }

  const goBack = () => setStep(prev => Math.max(prev - 1, 1))

  const canProceed = () => {
    if (step === 1) return targetDaysPerWeek !== null
    if (step === 2) return selectedDays.length > 0
    if (step === 3) return Object.keys(workoutAssignments).length > 0
    if (step === 4) return Object.keys(workoutAssignments).length > 0
    return true
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: isMobile ? '1rem' : '2rem',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}>
      <div style={{
        background: '#000',
        border: '1px solid rgba(249, 115, 22, 0.3)',
        borderRadius: isMobile ? '16px' : '24px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '800px',
        maxHeight: isMobile ? '90vh' : '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transform: 'translateZ(0)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 8px 32px rgba(249, 115, 22, 0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.95) 0%, rgba(234, 88, 12, 0.9) 100%)',
          backdropFilter: 'blur(12px)',
          color: '#fff',
          boxShadow: '0 4px 16px rgba(249, 115, 22, 0.2)',
          position: 'relative'
        }}>
          {/* Top accent glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
            opacity: 0.6,
            pointerEvents: 'none'
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={isMobile ? 20 : 24} fill="#fff" color="#fff" />
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.125rem' : '1.5rem',
                fontWeight: '800',
                margin: 0,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
Plan Je Workout Week
              </h2>
              <p style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                margin: 0,
                opacity: 0.9,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Stap {step} van 5
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              minHeight: '44px',
              minWidth: '44px',
              touchAction: 'manipulation',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: '4px',
          background: '#0a0a0a',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${(step / 5) * 100}%`,
            background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
            transition: 'width 0.3s ease',
            transform: 'translateZ(0)',
            boxShadow: '0 0 8px rgba(249, 115, 22, 0.4)'
          }} />
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '2rem'
        }}>
          {/* STEP 1: How many days? */}
          {step === 1 && (
            <div>
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '1.5rem' : '2rem'
              }}>
                <Calendar 
                  size={isMobile ? 40 : 48} 
                  style={{ color: '#f97316', marginBottom: '1rem' }} 
                />
                <h3 style={{
                  fontSize: isMobile ? '1.25rem' : '1.75rem',
                  fontWeight: '800',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                }}>
                  Hoeveel dagen per week wil je trainen?
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0
                }}>
                  Kies het aantal trainingen dat bij jouw doelen past
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? '0.75rem' : '1rem'
              }}>
                {[3, 4, 5, 6].map(days => (
                  <button
                    key={days}
                    onClick={() => setTargetDaysPerWeek(days)}
                    style={{
                      background: targetDaysPerWeek === days 
                        ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                      backdropFilter: 'blur(12px)',
                      border: targetDaysPerWeek === days 
                        ? '2px solid rgba(249, 115, 22, 0.6)' 
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: isMobile ? '12px' : '16px',
                      padding: isMobile ? '1.5rem 1rem' : '2rem 1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'center',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      transform: 'translateZ(0)',
                      boxShadow: targetDaysPerWeek === days
                        ? '0 4px 16px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(249, 115, 22, 0.05)'
                        : '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                        e.currentTarget.style.boxShadow = targetDaysPerWeek === days
                          ? '0 8px 24px rgba(249, 115, 22, 0.4)'
                          : '0 4px 12px rgba(0, 0, 0, 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                        e.currentTarget.style.boxShadow = targetDaysPerWeek === days
                          ? '0 4px 16px rgba(249, 115, 22, 0.3)'
                          : '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                    onTouchStart={(e) => {
                      if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
                    }}
                    onTouchEnd={(e) => {
                      if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <div style={{
                      fontSize: isMobile ? '2rem' : '3rem',
                      fontWeight: '800',
                      color: targetDaysPerWeek === days ? '#f97316' : 'rgba(249, 115, 22, 0.6)',
                      marginBottom: '0.5rem',
                      textShadow: targetDaysPerWeek === days ? '0 2px 8px rgba(249, 115, 22, 0.4)' : 'none'
                    }}>
                      {days}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      fontWeight: '600',
                      color: targetDaysPerWeek === days ? '#f97316' : 'rgba(255, 255, 255, 0.5)'
                    }}>
                      dagen
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Which days? */}
          {step === 2 && (
            <div>
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '1.5rem' : '2rem'
              }}>
                <Calendar 
                  size={isMobile ? 40 : 48} 
                  style={{ color: '#f97316', marginBottom: '1rem' }} 
                />
                <h3 style={{
                  fontSize: isMobile ? '1.25rem' : '1.75rem',
                  fontWeight: '800',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                }}>
                  Welke dagen wil je trainen?
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0
                }}>
                  Selecteer {targetDaysPerWeek} dagen uit de week
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: isMobile ? '0.75rem' : '1rem'
              }}>
                {weekDays.map(day => {
                  const isSelected = selectedDays.includes(day)
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDays(prev => prev.filter(d => d !== day))
                        } else {
                          setSelectedDays(prev => [...prev, day])
                        }
                      }}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)'
                          : 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                        backdropFilter: 'blur(12px)',
                        border: isSelected 
                          ? '2px solid rgba(249, 115, 22, 0.6)' 
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: isMobile ? '12px' : '16px',
                        padding: isMobile ? '1rem' : '1.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        transform: 'translateZ(0)',
                        boxShadow: isSelected
                          ? '0 4px 16px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(249, 115, 22, 0.05)'
                          : '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = isSelected
                            ? '0 8px 24px rgba(249, 115, 22, 0.4)'
                            : '0 4px 12px rgba(0, 0, 0, 0.3)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = isSelected
                            ? '0 4px 16px rgba(249, 115, 22, 0.3)'
                            : '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }
                      }}
                      onTouchStart={(e) => {
                        if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
                      }}
                      onTouchEnd={(e) => {
                        if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      <span style={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '700',
                        color: isSelected ? '#f97316' : 'rgba(255, 255, 255, 0.6)'
                      }}>
                        {day}
                      </span>
                      {isSelected && (
                        <Check size={isMobile ? 18 : 20} color="#f97316" strokeWidth={2.5} />
                      )}
                    </button>
                  )
                })}
              </div>

              <div style={{
                marginTop: isMobile ? '1rem' : '1.5rem',
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                backdropFilter: 'blur(12px)',
                border: selectedDays.length === targetDaysPerWeek 
                  ? '1px solid rgba(249, 115, 22, 0.4)' 
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '700',
                color: selectedDays.length === targetDaysPerWeek ? '#f97316' : 'rgba(255, 255, 255, 0.6)',
                boxShadow: selectedDays.length === targetDaysPerWeek 
                  ? '0 4px 12px rgba(249, 115, 22, 0.2)' 
                  : 'none'
              }}>
                {selectedDays.length} / {targetDaysPerWeek} dagen geselecteerd
              </div>
            </div>
          )}

          {/* STEP 3: Workout Assignment */}
          {step === 3 && (
            <div>
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '1.5rem' : '2rem'
              }}>
                <Sparkles 
                  size={isMobile ? 40 : 48} 
                  style={{ color: '#f97316', marginBottom: '1rem' }} 
                />
                <h3 style={{
                  fontSize: isMobile ? '1.25rem' : '1.75rem',
                  fontWeight: '800',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                }}>
                  Kies workouts per dag
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: isMobile ? '1rem' : '1.5rem'
                }}>
                  Wijs een workout toe aan elke trainingsdag
                </p>

                {/* Auto-assign button */}
                <button
                  onClick={autoAssignWorkouts}
                  style={{
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)',
                    backdropFilter: 'blur(12px)',
                    border: '2px solid rgba(249, 115, 22, 0.6)',
                    borderRadius: '12px',
                    padding: isMobile ? '0.875rem 1.25rem' : '1rem 1.5rem',
                    color: '#f97316',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    transform: 'translateZ(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(249, 115, 22, 0.05)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.35) 0%, rgba(234, 88, 12, 0.25) 100%)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(249, 115, 22, 0.3)'
                    }
                  }}
                  onTouchStart={(e) => {
                    if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
                  }}
                  onTouchEnd={(e) => {
                    if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <Zap size={16} fill="#f97316" color="#f97316" />
                  Auto-toewijzen
                </button>
              </div>

              {/* Day assignments */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '0.75rem' : '1rem'
              }}>
                {selectedDays.map(day => {
                  const assignedWorkout = workoutAssignments[day]
                  const workoutDisplay = assignedWorkout ? getWorkoutDisplay(assignedWorkout) : null

                  return (
                    <div
                      key={day}
                      style={{
                        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                        backdropFilter: 'blur(12px)',
                        border: assignedWorkout 
                          ? '2px solid rgba(249, 115, 22, 0.6)' 
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: isMobile ? '12px' : '16px',
                        padding: isMobile ? '1rem' : '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        boxShadow: assignedWorkout
                          ? '0 4px 16px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(249, 115, 22, 0.05)'
                          : '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: isMobile ? '0.9rem' : '1rem',
                          fontWeight: '700',
                          color: '#fff',
                          marginBottom: '0.25rem'
                        }}>
                          {day}
                        </div>
                        {workoutDisplay ? (
                          <div style={{
                            fontSize: isMobile ? '0.875rem' : '0.95rem',
                            color: workoutDisplay.type === 'custom' ? '#a855f7' : '#f97316',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: '600'
                          }}>
                            {workoutDisplay.type === 'custom' && (
                              <span>{workoutDisplay.emoji}</span>
                            )}
                            {workoutDisplay.label}
                          </div>
                        ) : (
                          <div style={{
                            fontSize: isMobile ? '0.875rem' : '0.95rem',
                            color: 'rgba(255, 255, 255, 0.4)'
                          }}>
                            Geen workout geselecteerd
                          </div>
                        )}
                      </div>

                      {/* Dropdown selector */}
                      <select
                        value={assignedWorkout || ''}
                        onChange={(e) => assignWorkoutToDay(day, e.target.value)}
                        style={{
                          background: '#000',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: isMobile ? '0.5rem' : '0.625rem',
                          color: '#fff',
                          fontSize: isMobile ? '0.875rem' : '0.95rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          minHeight: '44px',
                          minWidth: '120px',
                          touchAction: 'manipulation',
                          backdropFilter: 'blur(8px)'
                        }}
                      >
                        <option value="">Kies workout</option>
                        {getAllWorkouts().map(workout => (
                          <option key={workout.value} value={workout.value}>
                            {workout.type === 'custom' && `${workout.emoji} `}
                            {workout.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Interactive Overview */}
          {step === 4 && (
            <div>
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '1.5rem' : '2rem'
              }}>
                <Calendar 
                  size={isMobile ? 40 : 48} 
                  style={{ color: '#f97316', marginBottom: '1rem' }} 
                />
                <h3 style={{
                  fontSize: isMobile ? '1.25rem' : '1.75rem',
                  fontWeight: '800',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                }}>
                  Weekoverzicht
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0
                }}>
                  Bewerk je planning indien nodig
                </p>
              </div>

              {/* Stats */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                marginBottom: isMobile ? '1rem' : '1.5rem',
                display: 'flex',
                justifyContent: 'space-around',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(249, 115, 22, 0.05)'
              }}>
                <div>
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: '800',
                    color: '#f97316',
                    textShadow: '0 2px 8px rgba(249, 115, 22, 0.4)'
                  }}>
                    {Object.keys(workoutAssignments).length}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>
                    Gepland
                  </div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                <div>
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: '800',
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}>
                    {7 - Object.keys(workoutAssignments).length}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>
                    Rustdagen
                  </div>
                </div>
              </div>

              {/* 7-day grid (mobile = vertical list) */}
              <div style={{
                display: isMobile ? 'flex' : 'grid',
                flexDirection: isMobile ? 'column' : undefined,
                gridTemplateColumns: isMobile ? undefined : 'repeat(7, 1fr)',
                gap: isMobile ? '0.75rem' : '0.5rem'
              }}>
                {weekDays.map(day => {
                  const workout = workoutAssignments[day]
                  const workoutDisplay = workout ? getWorkoutDisplay(workout) : null
                  const hasWorkout = !!workout

                  return (
                    <div
                      key={day}
                      style={{
                        background: hasWorkout 
                          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)'
                          : 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                        backdropFilter: 'blur(12px)',
                        border: hasWorkout 
                          ? '2px solid rgba(249, 115, 22, 0.4)' 
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: isMobile ? '12px' : '8px',
                        padding: isMobile ? '1rem' : '0.75rem',
                        display: 'flex',
                        flexDirection: isMobile ? 'row' : 'column',
                        alignItems: isMobile ? 'center' : 'flex-start',
                        justifyContent: isMobile ? 'space-between' : 'flex-start',
                        gap: isMobile ? '0.75rem' : '0.5rem',
                        minHeight: isMobile ? '44px' : '100px',
                        boxShadow: hasWorkout
                          ? '0 2px 8px rgba(249, 115, 22, 0.2)'
                          : '0 1px 4px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      {/* Day label */}
                      <div style={{
                        fontSize: isMobile ? '0.9rem' : '0.7rem',
                        fontWeight: '700',
                        color: hasWorkout ? '#f97316' : 'rgba(255, 255, 255, 0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {isMobile ? day : dayLabels[day]}
                      </div>

                      {/* Workout info or empty state */}
                      {hasWorkout && workoutDisplay ? (
                        <div style={{
                          flex: isMobile ? 1 : undefined,
                          fontSize: isMobile ? '0.875rem' : '0.7rem',
                          color: workoutDisplay.type === 'custom' ? '#a855f7' : '#f97316',
                          textAlign: isMobile ? 'left' : 'center',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontWeight: '600'
                        }}>
                          {workoutDisplay.type === 'custom' && (
                            <span>{workoutDisplay.emoji}</span>
                          )}
                          {isMobile ? workoutDisplay.label : workoutDisplay.label.substring(0, 8)}
                        </div>
                      ) : (
                        <div style={{
                          flex: isMobile ? 1 : undefined,
                          fontSize: isMobile ? '0.875rem' : '0.65rem',
                          color: 'rgba(255, 255, 255, 0.3)',
                          textAlign: isMobile ? 'left' : 'center'
                        }}>
                          {isMobile ? 'Rustdag' : 'Rust'}
                        </div>
                      )}

                      {/* Action buttons (mobile only for assigned days) */}
                      {isMobile && hasWorkout && (
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem'
                        }}>
                          <button
                            onClick={() => setEditingDay(day)}
                            style={{
                              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(249, 115, 22, 0.3)',
                              borderRadius: '6px',
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#f97316',
                              minHeight: '44px',
                              minWidth: '44px',
                              touchAction: 'manipulation'
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => removeWorkoutFromDay(day)}
                            style={{
                              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '6px',
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#ef4444',
                              minHeight: '44px',
                              minWidth: '44px',
                              touchAction: 'manipulation'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Edit modal for mobile */}
              {isMobile && editingDay && (
                <div style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.98) 0%, rgba(10, 10, 10, 0.95) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '24px 24px 0 0',
                  padding: '1.5rem',
                  zIndex: 10000,
                  transform: 'translateZ(0)',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 -4px 20px rgba(249, 115, 22, 0.2)'
                }}>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: '800',
                    color: '#f97316',
                    marginBottom: '1rem',
                    letterSpacing: '-0.02em'
                  }}>
                    Bewerk {editingDay}
                  </div>
                  <select
                    value={workoutAssignments[editingDay] || ''}
                    onChange={(e) => assignWorkoutToDay(editingDay, e.target.value)}
                    style={{
                      width: '100%',
                      background: '#000',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      padding: '1rem',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '1rem',
                      minHeight: '44px',
                      touchAction: 'manipulation'
                    }}
                  >
                    <option value="">Kies workout</option>
                    {getAllWorkouts().map(workout => (
                      <option key={workout.value} value={workout.value}>
                        {workout.type === 'custom' && `${workout.emoji} `}
                        {workout.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditingDay(null)}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)',
                      backdropFilter: 'blur(12px)',
                      border: '2px solid rgba(249, 115, 22, 0.6)',
                      borderRadius: '12px',
                      padding: '1rem',
                      color: '#f97316',
                      fontSize: '1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Klaar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Confirmation */}
          {step === 5 && (
            <div>
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '1.5rem' : '2rem'
              }}>
                <Check 
                  size={isMobile ? 40 : 48} 
                  style={{ color: '#10b981', marginBottom: '1rem' }} 
                />
                <h3 style={{
                  fontSize: isMobile ? '1.25rem' : '1.75rem',
                  fontWeight: '800',
                  color: '#fff',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                }}>
                  Bevestig je planning
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0
                }}>
                  Je nieuwe weekschema wordt direct actief
                </p>
              </div>

              {/* Summary */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                backdropFilter: 'blur(12px)',
                border: '2px solid rgba(249, 115, 22, 0.6)',
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '1rem' : '1.5rem',
                marginBottom: isMobile ? '1rem' : '1.5rem',
                boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(249, 115, 22, 0.05)'
              }}>
                <div style={{
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '800',
                  color: '#f97316',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 8px rgba(249, 115, 22, 0.4)'
                }}>
                  <Calendar size={isMobile ? 18 : 20} />
                  Jouw Weekschema
                </div>
                
                {weekDays.map(day => {
                  const workout = workoutAssignments[day]
                  const workoutDisplay = workout ? getWorkoutDisplay(workout) : null

                  return (
                    <div
                      key={day}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: isMobile ? '0.75rem 0' : '0.875rem 0',
                        borderBottom: day !== 'Sunday' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
                      }}
                    >
                      <div style={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '700',
                        color: workout ? '#fff' : 'rgba(255, 255, 255, 0.4)'
                      }}>
                        {day}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.875rem' : '0.95rem',
                        color: workout 
                          ? workoutDisplay?.type === 'custom' ? '#a855f7' : '#f97316'
                          : 'rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: '600'
                      }}>
                        {workout ? (
                          <>
                            {workoutDisplay?.type === 'custom' && (
                              <span>{workoutDisplay.emoji}</span>
                            )}
                            {workoutDisplay?.label || 'Workout'}
                          </>
                        ) : (
                          'Rustdag'
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Final stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: isMobile ? '0.75rem' : '1rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: '2px solid rgba(249, 115, 22, 0.6)',
                  borderRadius: '12px',
                  padding: isMobile ? '1rem' : '1.25rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(249, 115, 22, 0.05)'
                }}>
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: '800',
                    color: '#f97316',
                    marginBottom: '0.25rem',
                    textShadow: '0 2px 8px rgba(249, 115, 22, 0.4)'
                  }}>
                    {Object.keys(workoutAssignments).length}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: '#f97316',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>
                    Trainingsdagen
                  </div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: isMobile ? '1rem' : '1.25rem',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: '800',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginBottom: '0.25rem'
                  }}>
                    {7 - Object.keys(workoutAssignments).length}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>
                    Rustdagen
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: '1px solid rgba(249, 115, 22, 0.2)',
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)'
        }}>
          {step > 1 && (
            <button
              onClick={goBack}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                transform: 'translateZ(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
              }}
              onTouchEnd={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
              Terug
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              style={{
                flex: 1,
                background: canProceed()
                  ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(10, 10, 10, 0.7) 100%)',
                backdropFilter: 'blur(12px)',
                border: canProceed()
                  ? '2px solid rgba(249, 115, 22, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                color: canProceed() ? '#f97316' : 'rgba(255, 255, 255, 0.3)',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                transform: 'translateZ(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: canProceed() ? 1 : 0.5,
                boxShadow: canProceed()
                  ? '0 4px 16px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(249, 115, 22, 0.05)'
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={(e) => {
                if (!isMobile && canProceed()) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.35) 0%, rgba(234, 88, 12, 0.25) 100%)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile && canProceed()) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(249, 115, 22, 0.3)'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile && canProceed()) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Volgende
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={handleSaveSchedule}
              disabled={loading}
              style={{
                flex: 1,
                background: loading
                  ? 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(10, 10, 10, 0.7) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
                backdropFilter: 'blur(12px)',
                border: loading
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '2px solid rgba(16, 185, 129, 0.6)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                color: loading ? 'rgba(255, 255, 255, 0.3)' : '#10b981',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                transform: 'translateZ(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: loading
                  ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                  : '0 4px 16px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(16, 185, 129, 0.05)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={(e) => {
                if (!isMobile && !loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.25) 100%)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile && !loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile && !loading) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <Check size={18} strokeWidth={2.5} />
              {loading ? 'Opslaan...' : 'Planning Opslaan'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
