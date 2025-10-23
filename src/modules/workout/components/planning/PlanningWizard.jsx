// src/modules/workout/components/planning/PlanningWizard.jsx
// 5-STAP WIZARD: Hoeveel → Welke → Assign → Review → Save 🔥

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Check, ChevronRight, ChevronLeft, Zap, Shuffle, Trash2, Plus, AlertCircle } from 'lucide-react'

// Custom workout emoji mapping
const getCustomWorkoutEmoji = (type) => {
  const emojis = {
    cardio: '❤️',
    cycling: '🚴',
    running: '🏃',
    swimming: '🏊',
    hiking: '🥾',
    yoga: '🧘',
    sports: '⚽',
    custom: '💪'
  }
  return emojis[type] || '💪'
}

export default function PlanningWizard({ 
  schema,
  clientId,
  db,
  workoutService,
  onClose,
  onComplete
}) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(1) // 1-5
  const [selectedDays, setSelectedDays] = useState([])
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(null)
  const [workoutAssignments, setWorkoutAssignments] = useState({}) // { Monday: 'dag1', Tuesday: 'custom_xyz' }
  const [availableWorkouts, setAvailableWorkouts] = useState([]) // Schema + custom workouts
  const [customWorkouts, setCustomWorkouts] = useState([])
  const [saving, setSaving] = useState(false)
  
  const weekDays = [
    { key: 'Monday', label: 'Maandag', short: 'Ma' },
    { key: 'Tuesday', label: 'Dinsdag', short: 'Di' },
    { key: 'Wednesday', label: 'Woensdag', short: 'Wo' },
    { key: 'Thursday', label: 'Donderdag', short: 'Do' },
    { key: 'Friday', label: 'Vrijdag', short: 'Vr' },
    { key: 'Saturday', label: 'Zaterdag', short: 'Za' },
    { key: 'Sunday', label: 'Zondag', short: 'Zo' }
  ]
  
  const schemaDays = schema?.days_per_week || 3
  
  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    loadWorkouts()
  }, [])
  
  // Load schema + custom workouts
  const loadWorkouts = async () => {
    const workouts = []
    
    // Schema workouts
    if (schema?.week_structure) {
      Object.entries(schema.week_structure).forEach(([key, workout]) => {
        workouts.push({
          id: key,
          name: workout.name,
          focus: workout.focus,
          type: 'schema',
          data: workout
        })
      })
    }
    
    // Custom workouts
    if (workoutService && clientId) {
      try {
        const customs = await workoutService.getCustomWorkouts(clientId)
        setCustomWorkouts(customs)
        customs.forEach(workout => {
          workouts.push({
            id: `custom_${workout.id}`,
            name: workout.name,
            focus: `${workout.type} - ${workout.duration}min`,
            type: 'custom',
            emoji: getCustomWorkoutEmoji(workout.type),
            data: workout
          })
        })
      } catch (error) {
        console.error('❌ Load custom workouts failed:', error)
      }
    }
    
    setAvailableWorkouts(workouts)
  }
  
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }
  
  const toggleDay = (dayKey) => {
    if (selectedDays.includes(dayKey)) {
      setSelectedDays(selectedDays.filter(d => d !== dayKey))
      // Remove assignment
      const newAssignments = { ...workoutAssignments }
      delete newAssignments[dayKey]
      setWorkoutAssignments(newAssignments)
    } else {
      if (targetDaysPerWeek && selectedDays.length >= targetDaysPerWeek) {
        return
      }
      setSelectedDays([...selectedDays, dayKey])
    }
  }
  
  const handleNext = () => {
    if (step === 1 && targetDaysPerWeek) {
      setStep(2)
    } else if (step === 2 && selectedDays.length === targetDaysPerWeek) {
      setStep(3)
    } else if (step === 3) {
      // Check if all days have workouts assigned
      const allAssigned = selectedDays.every(day => workoutAssignments[day])
      if (allAssigned) {
        setStep(4)
      }
    } else if (step === 4) {
      setStep(5)
    }
  }
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }
  
  // Auto-assign workouts
  const handleAutoAssign = () => {
    const assignments = {}
    const workoutKeys = availableWorkouts.filter(w => w.type === 'schema').map(w => w.id)
    
    selectedDays.forEach((day, index) => {
      assignments[day] = workoutKeys[index % workoutKeys.length]
    })
    
    setWorkoutAssignments(assignments)
  }
  
  // Assign workout to day
  const assignWorkout = (day, workoutId) => {
    setWorkoutAssignments({
      ...workoutAssignments,
      [day]: workoutId
    })
  }
  
  // Remove workout from day
  const removeWorkout = (day) => {
    const newAssignments = { ...workoutAssignments }
    delete newAssignments[day]
    setWorkoutAssignments(newAssignments)
  }
  
  // Swap workouts between days
  const swapWorkouts = (day1, day2) => {
    const newAssignments = { ...workoutAssignments }
    const temp = newAssignments[day1]
    newAssignments[day1] = newAssignments[day2]
    newAssignments[day2] = temp
    setWorkoutAssignments(newAssignments)
  }
  
  const handleSave = async () => {
    if (!workoutService || !clientId) return
    
    setSaving(true)
    
    try {
      await workoutService.updateWeekSchedule(clientId, workoutAssignments)
      
      console.log('✅ Wizard schedule saved:', workoutAssignments)
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
      if (onComplete) onComplete(workoutAssignments)
      
      handleClose()
    } catch (error) {
      console.error('❌ Wizard save failed:', error)
      alert('Er ging iets mis. Probeer opnieuw.')
      setSaving(false)
    }
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
        padding: isMobile ? '1rem' : '1.5rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: isMobile ? '16px' : '20px',
          width: isMobile ? '95vw' : step === 4 ? '800px' : '600px',
          maxHeight: isMobile ? '90vh' : '85vh',
          boxShadow: '0 20px 60px rgba(249, 115, 22, 0.35)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          opacity: 0.8
        }} />
        
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
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
              boxShadow: '0 0 20px rgba(249, 115, 22, 0.4)'
            }}>
              <Calendar size={isMobile ? 18 : 20} color="#f97316" />
            </div>
            <div>
              <h2 style={{
                fontSize: isMobile ? '1rem' : '1.15rem',
                fontWeight: '800',
                color: '#fff',
                margin: 0,
                marginBottom: '0.1rem'
              }}>
                Quick Start Wizard
              </h2>
              <p style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                fontWeight: '600'
              }}>
                Stap {step} van 5
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(23, 23, 23, 0.6)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: '#f97316',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Progress bar */}
        <div style={{
          height: '4px',
          background: 'rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${(step / 5) * 100}%`,
            background: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1.5rem' : '2rem'
        }}>
          {/* STAP 1: Hoeveel dagen */}
          {step === 1 && (
            <Step1Content
              isMobile={isMobile}
              schemaDays={schemaDays}
              targetDaysPerWeek={targetDaysPerWeek}
              setTargetDaysPerWeek={setTargetDaysPerWeek}
            />
          )}
          
          {/* STAP 2: Welke dagen */}
          {step === 2 && (
            <Step2Content
              isMobile={isMobile}
              weekDays={weekDays}
              selectedDays={selectedDays}
              targetDaysPerWeek={targetDaysPerWeek}
              toggleDay={toggleDay}
            />
          )}
          
          {/* STAP 3: Workout toewijzing */}
          {step === 3 && (
            <Step3Content
              isMobile={isMobile}
              selectedDays={selectedDays}
              weekDays={weekDays}
              availableWorkouts={availableWorkouts}
              workoutAssignments={workoutAssignments}
              assignWorkout={assignWorkout}
              handleAutoAssign={handleAutoAssign}
            />
          )}
          
          {/* STAP 4: Interactief overzicht */}
          {step === 4 && (
            <Step4Content
              isMobile={isMobile}
              weekDays={weekDays}
              selectedDays={selectedDays}
              workoutAssignments={workoutAssignments}
              availableWorkouts={availableWorkouts}
              assignWorkout={assignWorkout}
              removeWorkout={removeWorkout}
              swapWorkouts={swapWorkouts}
            />
          )}
          
          {/* STAP 5: Bevestigen */}
          {step === 5 && (
            <Step5Content
              isMobile={isMobile}
              weekDays={weekDays}
              selectedDays={selectedDays}
              workoutAssignments={workoutAssignments}
              availableWorkouts={availableWorkouts}
            />
          )}
        </div>
        
        {/* Footer buttons */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderTop: '1px solid rgba(249, 115, 22, 0.15)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          {step > 1 && (
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <ChevronLeft size={16} />
              Terug
            </button>
          )}
          
          <button
            onClick={step === 5 ? handleSave : handleNext}
            disabled={(step === 1 && !targetDaysPerWeek) || 
                     (step === 2 && selectedDays.length !== targetDaysPerWeek) ||
                     (step === 3 && !selectedDays.every(day => workoutAssignments[day])) ||
                     (step === 5 && saving)}
            style={{
              flex: 2,
              padding: isMobile ? '0.875rem' : '1rem',
              background: ((step === 1 && !targetDaysPerWeek) || 
                          (step === 2 && selectedDays.length !== targetDaysPerWeek) ||
                          (step === 3 && !selectedDays.every(day => workoutAssignments[day])) ||
                          saving)
                ? 'rgba(107, 114, 128, 0.3)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: saving ? 'rgba(255, 255, 255, 0.5)' : '#000',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              cursor: ((step === 1 && !targetDaysPerWeek) || 
                      (step === 2 && selectedDays.length !== targetDaysPerWeek) ||
                      (step === 3 && !selectedDays.every(day => workoutAssignments[day])) ||
                      saving) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: saving ? 'none' : '0 4px 20px rgba(16, 185, 129, 0.35)',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              opacity: ((step === 1 && !targetDaysPerWeek) || 
                       (step === 2 && selectedDays.length !== targetDaysPerWeek) ||
                       (step === 3 && !selectedDays.every(day => workoutAssignments[day])) ||
                       saving) ? 0.5 : 1
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(0, 0, 0, 0.3)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Opslaan...
              </>
            ) : step === 5 ? (
              <>
                <Check size={18} />
                Planning Opslaan
              </>
            ) : (
              <>
                Volgende
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
  
  return createPortal(modalContent, document.body)
}

// STEP 1: Hoeveel dagen
function Step1Content({ isMobile, schemaDays, targetDaysPerWeek, setTargetDaysPerWeek }) {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <h3 style={{
        fontSize: isMobile ? '1.15rem' : '1.3rem',
        fontWeight: '800',
        color: '#fff',
        marginBottom: '0.5rem'
      }}>
        Hoeveel dagen wil je trainen?
      </h3>
      <p style={{
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '1.5rem',
        lineHeight: 1.5
      }}>
        Je schema heeft {schemaDays} trainingsdagen. Kies hoeveel dagen jij deze week naar de gym gaat.
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: '0.75rem'
      }}>
        {[3, 4, 5, 6].map(days => (
          <button
            key={days}
            onClick={() => setTargetDaysPerWeek(days)}
            style={{
              padding: isMobile ? '1.25rem' : '1.5rem',
              background: targetDaysPerWeek === days
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0.15) 100%)'
                : 'rgba(23, 23, 23, 0.6)',
              border: targetDaysPerWeek === days
                ? '2px solid #f97316'
                : '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <div style={{
              fontSize: isMobile ? '1.75rem' : '2rem',
              fontWeight: '800',
              color: targetDaysPerWeek === days ? '#f97316' : '#fff',
              marginBottom: '0.25rem'
            }}>
              {days}
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Dagen
            </div>
          </button>
        ))}
      </div>
      
      <div style={{
        marginTop: '1.5rem',
        padding: isMobile ? '0.875rem' : '1rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '10px'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start'
        }}>
          <Zap size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#10b981' }}>Tip:</strong> Beginners starten vaak met 3-4 dagen. Gevorderden trainen 5-6 dagen per week.
          </p>
        </div>
      </div>
    </div>
  )
}

// STEP 2: Welke dagen
function Step2Content({ isMobile, weekDays, selectedDays, targetDaysPerWeek, toggleDay }) {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <h3 style={{
        fontSize: isMobile ? '1.15rem' : '1.3rem',
        fontWeight: '800',
        color: '#fff',
        marginBottom: '0.5rem'
      }}>
        Welke dagen past jou het beste?
      </h3>
      <p style={{
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '1.5rem',
        lineHeight: 1.5
      }}>
        Selecteer {targetDaysPerWeek} dagen waarop je wilt trainen. Kies vaste dagen voor meer consistentie.
      </p>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem'
      }}>
        {weekDays.map(day => {
          const isSelected = selectedDays.includes(day.key)
          const isDisabled = !isSelected && selectedDays.length >= targetDaysPerWeek
          
          return (
            <button
              key={day.key}
              onClick={() => !isDisabled && toggleDay(day.key)}
              disabled={isDisabled}
              style={{
                padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0.15) 100%)'
                  : 'rgba(23, 23, 23, 0.6)',
                border: isSelected
                  ? '2px solid #f97316'
                  : '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '10px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: isDisabled ? 0.4 : 1,
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: isMobile ? '32px' : '36px',
                  height: isMobile ? '32px' : '36px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '700',
                  color: isSelected ? '#f97316' : 'rgba(255, 255, 255, 0.5)'
                }}>
                  {day.short}
                </div>
                <span style={{
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '700',
                  color: isSelected ? '#f97316' : '#fff'
                }}>
                  {day.label}
                </span>
              </div>
              
              {isSelected && (
                <div style={{
                  width: isMobile ? '20px' : '22px',
                  height: isMobile ? '20px' : '22px',
                  borderRadius: '50%',
                  background: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Check size={isMobile ? 12 : 14} color="#000" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      <div style={{
        marginTop: '1.25rem',
        textAlign: 'center',
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        color: selectedDays.length === targetDaysPerWeek ? '#10b981' : '#f97316',
        fontWeight: '700'
      }}>
        {selectedDays.length} / {targetDaysPerWeek} dagen geselecteerd
      </div>
      
      <div style={{
        marginTop: '1.5rem',
        padding: isMobile ? '0.875rem' : '1rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '10px'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start'
        }}>
          <Zap size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#10b981' }}>Tip:</strong> Spreiding werkt beter dan 3 dagen achter elkaar. Gun dezelfde spiergroepen minimaal 48 uur rust.
          </p>
        </div>
      </div>
    </div>
  )
}

// STEP 3: Workout toewijzing
function Step3Content({ isMobile, selectedDays, weekDays, availableWorkouts, workoutAssignments, assignWorkout, handleAutoAssign }) {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div>
          <h3 style={{
            fontSize: isMobile ? '1.15rem' : '1.3rem',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '0.25rem',
            margin: 0
          }}>
            Kies je workouts
          </h3>
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0
          }}>
            Wijs een workout toe aan elke dag
          </p>
        </div>
        
        <button
          onClick={handleAutoAssign}
          style={{
            padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            color: '#a855f7',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.3s ease',
            minHeight: '36px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          <Shuffle size={isMobile ? 12 : 14} />
          {isMobile ? 'Auto' : 'Auto Verdelen'}
        </button>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {selectedDays.map(dayKey => {
          const day = weekDays.find(d => d.key === dayKey)
          const assignedWorkout = workoutAssignments[dayKey]
          
          return (
            <div
              key={dayKey}
              style={{
                padding: isMobile ? '1rem' : '1.25rem',
                background: assignedWorkout
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                  : 'rgba(23, 23, 23, 0.6)',
                border: assignedWorkout
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '12px'
              }}
            >
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: assignedWorkout ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}>
                {day.label}
              </div>
              
              <select
                value={assignedWorkout || ''}
                onChange={(e) => assignWorkout(dayKey, e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                <option value="">Kies een workout...</option>
                <optgroup label="Schema Workouts">
                  {availableWorkouts.filter(w => w.type === 'schema').map(workout => (
                    <option key={workout.id} value={workout.id}>
                      {workout.name} - {workout.focus}
                    </option>
                  ))}
                </optgroup>
                {availableWorkouts.some(w => w.type === 'custom') && (
                  <optgroup label="Custom Workouts">
                    {availableWorkouts.filter(w => w.type === 'custom').map(workout => (
                      <option key={workout.id} value={workout.id}>
                        {workout.emoji} {workout.name} - {workout.focus}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )
        })}
      </div>
      
      {!selectedDays.every(day => workoutAssignments[day]) && (
        <div style={{
          marginTop: '1rem',
          padding: isMobile ? '0.75rem' : '0.875rem',
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: '10px',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={16} color="#f97316" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: '#f97316',
            margin: 0,
            lineHeight: 1.5,
            fontWeight: '600'
          }}>
            Kies een workout voor elke dag om door te gaan
          </p>
        </div>
      )}
    </div>
  )
}

// STEP 4: Interactief overzicht
function Step4Content({ isMobile, weekDays, selectedDays, workoutAssignments, availableWorkouts, assignWorkout, removeWorkout, swapWorkouts }) {
  const [swapMode, setSwapMode] = useState(false)
  const [swapDay, setSwapDay] = useState(null)
  
  const handleSwap = (day) => {
    if (!swapMode) {
      setSwapMode(true)
      setSwapDay(day)
    } else {
      if (swapDay && swapDay !== day) {
        swapWorkouts(swapDay, day)
      }
      setSwapMode(false)
      setSwapDay(null)
    }
  }
  
  const getWorkout = (workoutId) => {
    return availableWorkouts.find(w => w.id === workoutId)
  }
  
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <h3 style={{
        fontSize: isMobile ? '1.15rem' : '1.3rem',
        fontWeight: '800',
        color: '#fff',
        marginBottom: '0.5rem'
      }}>
        Review & Aanpassen
      </h3>
      <p style={{
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '1.5rem',
        lineHeight: 1.5
      }}>
        Dit is je week. Je kunt workouts nog aanpassen, verwijderen of verplaatsen.
      </p>
      
      {swapMode && (
        <div style={{
          marginBottom: '1rem',
          padding: isMobile ? '0.75rem' : '0.875rem',
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: '#a855f7',
            margin: 0,
            fontWeight: '600'
          }}>
            Klik op een andere dag om te wisselen
          </p>
          <button
            onClick={() => {
              setSwapMode(false)
              setSwapDay(null)
            }}
            style={{
              padding: '0.4rem 0.75rem',
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '6px',
              color: '#a855f7',
              fontSize: '0.7rem',
              fontWeight: '700',
              cursor: 'pointer',
              minHeight: '32px'
            }}
          >
            Annuleer
          </button>
        </div>
      )}
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(7, 1fr)',
        gap: isMobile ? '0.75rem' : '0.5rem'
      }}>
        {weekDays.map(day => {
          const hasWorkout = workoutAssignments[day.key]
          const workout = hasWorkout ? getWorkout(workoutAssignments[day.key]) : null
          const isSelected = swapDay === day.key
          
          return (
            <div
              key={day.key}
              onClick={() => hasWorkout && handleSwap(day.key)}
              style={{
                padding: isMobile ? '1rem' : '0.75rem',
                background: hasWorkout
                  ? isSelected
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                  : 'rgba(23, 23, 23, 0.6)',
                border: hasWorkout
                  ? isSelected
                    ? '2px solid #a855f7'
                    : '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                cursor: hasWorkout ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                minHeight: isMobile ? '60px' : '100px',
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'center' : 'center',
                justifyContent: isMobile ? 'space-between' : 'center',
                gap: isMobile ? '0.75rem' : '0.5rem',
                position: 'relative'
              }}
            >
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.65rem',
                color: hasWorkout ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: isMobile ? 'left' : 'center'
              }}>
                {isMobile ? day.label : day.short}
              </div>
              
              {hasWorkout && workout ? (
                <>
                  {isMobile ? (
                    <div style={{
                      flex: 1,
                      fontSize: '0.8rem',
                      color: '#fff',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}>
                      {workout.type === 'custom' ? workout.emoji + ' ' : ''}{workout.name}
                    </div>
                  ) : (
                    <div style={{
                      fontSize: '1.2rem',
                      textAlign: 'center'
                    }}>
                      {workout.type === 'custom' ? workout.emoji : '💪'}
                    </div>
                  )}
                  
                  {!swapMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeWorkout(day.key)
                      }}
                      style={{
                        padding: isMobile ? '0.5rem' : '0.4rem',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        minHeight: '32px',
                        minWidth: '32px'
                      }}
                    >
                      <Trash2 size={isMobile ? 14 : 12} color="#ef4444" />
                    </button>
                  )}
                </>
              ) : (
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.6rem',
                  color: 'rgba(255, 255, 255, 0.3)',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  Rust
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div style={{
        marginTop: '1.5rem',
        padding: isMobile ? '0.875rem' : '1rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '10px'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start'
        }}>
          <Check size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#10b981' }}>Perfect!</strong> Je hebt {selectedDays.length} workouts gepland. Klik op "Volgende" om op te slaan.
          </p>
        </div>
      </div>
    </div>
  )
}

// STEP 5: Bevestigen
function Step5Content({ isMobile, weekDays, selectedDays, workoutAssignments, availableWorkouts }) {
  const getWorkout = (workoutId) => {
    return availableWorkouts.find(w => w.id === workoutId)
  }
  
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <h3 style={{
        fontSize: isMobile ? '1.15rem' : '1.3rem',
        fontWeight: '800',
        color: '#fff',
        marginBottom: '0.5rem'
      }}>
        Klaar om te starten! 🎉
      </h3>
      <p style={{
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '1.5rem',
        lineHeight: 1.5
      }}>
        Dit is je complete workout week. Klik op "Planning Opslaan" om te beginnen.
      </p>
      
      <div style={{
        background: 'rgba(23, 23, 23, 0.6)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: '1.5rem'
      }}>
        {selectedDays.map((dayKey, index) => {
          const day = weekDays.find(d => d.key === dayKey)
          const workout = getWorkout(workoutAssignments[dayKey])
          
          return (
            <div
              key={dayKey}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0',
                borderBottom: index < selectedDays.length - 1 
                  ? '1px solid rgba(249, 115, 22, 0.1)' 
                  : 'none'
              }}
            >
              <span style={{
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontWeight: '700',
                color: '#fff'
              }}>
                {day.label}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: '#10b981',
                fontWeight: '600'
              }}>
                {workout?.type === 'custom' && (
                  <span style={{ fontSize: '1rem' }}>{workout.emoji}</span>
                )}
                {workout?.name || 'Unknown'}
              </div>
            </div>
          )
        })}
      </div>
      
      <div style={{
        padding: isMobile ? '0.875rem' : '1rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '10px'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start'
        }}>
          <Zap size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#10b981' }}>Success tip:</strong> Mensen die hun week plannen blijven 3x vaker consistent. Zet je workouts in je agenda!
          </p>
        </div>
      </div>
    </div>
  )
}
