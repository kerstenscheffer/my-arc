// src/modules/workout/components/planning/PlanningWizard.jsx
// SIMPELE WIZARD VOOR WEEK PLANNING

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Check, ChevronRight, ChevronLeft, Zap } from 'lucide-react'

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
  const [step, setStep] = useState(1) // 1, 2, 3
  const [selectedDays, setSelectedDays] = useState([])
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(null)
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
  
  // Get schema days
  const schemaDays = schema?.days_per_week || 3
  
  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
  }, [])
  
  // Handle close
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }
  
  // Handle day selection
  const toggleDay = (dayKey) => {
    if (selectedDays.includes(dayKey)) {
      setSelectedDays(selectedDays.filter(d => d !== dayKey))
    } else {
      // Limit to target days
      if (targetDaysPerWeek && selectedDays.length >= targetDaysPerWeek) {
        return // Max bereikt
      }
      setSelectedDays([...selectedDays, dayKey])
    }
  }
  
  // Handle next step
  const handleNext = () => {
    if (step === 1 && targetDaysPerWeek) {
      setStep(2)
    } else if (step === 2 && selectedDays.length === targetDaysPerWeek) {
      setStep(3)
    }
  }
  
  // Handle back
  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }
  
  // Handle save
  const handleSave = async () => {
    if (!workoutService || !clientId) return
    
    setSaving(true)
    
    try {
      // Create schedule met eerste workout uit schema voor elke dag
      const schedule = {}
      const workoutKeys = Object.keys(schema.week_structure)
      
      selectedDays.forEach((day, index) => {
        // Roteer door beschikbare workouts
        const workoutKey = workoutKeys[index % workoutKeys.length]
        schedule[day] = workoutKey
      })
      
      // Save to database
      await workoutService.updateWeekSchedule(clientId, schedule)
      
      console.log('✅ Wizard schedule saved:', schedule)
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
      if (onComplete) onComplete(schedule)
      
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
          width: isMobile ? '95vw' : '600px',
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
                Plan je Week
              </h2>
              <p style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                fontWeight: '600'
              }}>
                Stap {step} van 3
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
            width: `${(step / 3) * 100}%`,
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
              
              {/* Day options */}
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
              
              {/* Tip */}
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
          )}
          
          {/* STAP 2: Welke dagen */}
          {step === 2 && (
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
              
              {/* Day selector */}
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
              
              {/* Progress indicator */}
              <div style={{
                marginTop: '1.25rem',
                textAlign: 'center',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: selectedDays.length === targetDaysPerWeek ? '#10b981' : '#f97316',
                fontWeight: '700'
              }}>
                {selectedDays.length} / {targetDaysPerWeek} dagen geselecteerd
              </div>
              
              {/* Tip */}
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
          )}
          
          {/* STAP 3: Bevestigen */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <h3 style={{
                fontSize: isMobile ? '1.15rem' : '1.3rem',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Bevestig je planning
              </h3>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '1.5rem',
                lineHeight: 1.5
              }}>
                Dit is je workout week. Je kunt dit later altijd aanpassen.
              </p>
              
              {/* Selected days overview */}
              <div style={{
                background: 'rgba(23, 23, 23, 0.6)',
                borderRadius: '12px',
                padding: isMobile ? '1rem' : '1.25rem',
                marginBottom: '1.5rem'
              }}>
                {selectedDays.map((dayKey, index) => {
                  const day = weekDays.find(d => d.key === dayKey)
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
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: '#10b981',
                        fontWeight: '700',
                        background: 'rgba(16, 185, 129, 0.15)',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '6px'
                      }}>
                        WORKOUT
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Success tip */}
              <div style={{
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
                    <strong style={{ color: '#10b981' }}>Success tip:</strong> Mensen die hun week plannen blijven 3x vaker consistent. Zet je workouts in je agenda!
                  </p>
                </div>
              </div>
            </div>
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
            onClick={step === 3 ? handleSave : handleNext}
            disabled={(step === 1 && !targetDaysPerWeek) || 
                     (step === 2 && selectedDays.length !== targetDaysPerWeek) ||
                     (step === 3 && saving)}
            style={{
              flex: 2,
              padding: isMobile ? '0.875rem' : '1rem',
              background: ((step === 1 && !targetDaysPerWeek) || 
                          (step === 2 && selectedDays.length !== targetDaysPerWeek) || 
                          saving)
                ? 'rgba(107, 114, 128, 0.3)'
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '10px',
              color: saving ? 'rgba(255, 255, 255, 0.5)' : '#000',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              cursor: ((step === 1 && !targetDaysPerWeek) || 
                      (step === 2 && selectedDays.length !== targetDaysPerWeek) || 
                      saving) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: saving ? 'none' : '0 4px 20px rgba(249, 115, 22, 0.35)',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              opacity: ((step === 1 && !targetDaysPerWeek) || 
                       (step === 2 && selectedDays.length !== targetDaysPerWeek) || 
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
            ) : step === 3 ? (
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
