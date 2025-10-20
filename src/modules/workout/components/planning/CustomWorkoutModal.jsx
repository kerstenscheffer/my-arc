// src/modules/workout/components/planning/CustomWorkoutModal.jsx
// CUSTOM WORKOUT MODAL - Create & Edit 🎯

import { X, Save, Dumbbell, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function CustomWorkoutModal({
  workoutService,
  clientId,
  existingWorkout = null,
  onClose,
  onSave
}) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('cardio')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [isTemplate, setIsTemplate] = useState(true)
  const [errors, setErrors] = useState({})
  
  const workoutTypes = [
    { value: 'cardio', label: 'Cardio', emoji: '❤️' },
    { value: 'cycling', label: 'Fietsen', emoji: '🚴' },
    { value: 'running', label: 'Hardlopen', emoji: '🏃' },
    { value: 'swimming', label: 'Zwemmen', emoji: '🏊' },
    { value: 'hiking', label: 'Wandelen/Hiking', emoji: '🥾' },
    { value: 'yoga', label: 'Yoga/Stretching', emoji: '🧘' },
    { value: 'sports', label: 'Sport (voetbal, tennis)', emoji: '⚽' },
    { value: 'custom', label: 'Anders', emoji: '💪' }
  ]
  
  useEffect(() => {
    // Load existing workout data if editing
    if (existingWorkout) {
      setName(existingWorkout.name || '')
      setType(existingWorkout.type || 'cardio')
      setDuration(existingWorkout.duration?.toString() || '')
      setDescription(existingWorkout.description || '')
      setIsTemplate(existingWorkout.is_template || false)
    }
    
    setTimeout(() => setVisible(true), 50)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [existingWorkout])
  
  const validate = () => {
    const newErrors = {}
    
    if (!name.trim()) {
      newErrors.name = 'Naam is verplicht'
    }
    
    if (!duration || parseInt(duration) <= 0) {
      newErrors.duration = 'Duur moet groter zijn dan 0'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSave = async () => {
    if (!validate()) return
    
    setSaving(true)
    
    try {
      const workoutData = {
        name: name.trim(),
        type,
        duration: parseInt(duration),
        description: description.trim(),
        is_template: isTemplate
      }
      
      let savedWorkout
      
      if (existingWorkout) {
        // Update existing
        savedWorkout = await workoutService.updateCustomWorkout(
          existingWorkout.id,
          workoutData
        )
      } else {
        // Create new
        savedWorkout = await workoutService.createCustomWorkout(
          clientId,
          workoutData
        )
      }
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
      handleClose()
      
      if (onSave) onSave(savedWorkout)
      
    } catch (error) {
      console.error('❌ Save custom workout failed:', error)
      alert('Kon workout niet opslaan. Probeer opnieuw.')
      setSaving(false)
    }
  }
  
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }
  
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 10001,
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
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                borderRadius: '8px',
                background: 'rgba(249, 115, 22, 0.2)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.3))'
              }}>
                <Dumbbell size={isMobile ? 18 : 20} color="#f97316" />
              </div>
              
              <h2 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '900',
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.02em',
                textShadow: '0 0 20px rgba(249, 115, 22, 0.3)'
              }}>
                {existingWorkout ? 'Bewerk Training' : 'Eigen Training'}
              </h2>
            </div>
            
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
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={isMobile ? 20 : 24} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        
        {/* Form Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.5rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Naam */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              Training Naam *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. MTB Intervals"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.125rem',
                background: 'rgba(249, 115, 22, 0.05)',
                border: errors.name 
                  ? '1px solid rgba(239, 68, 68, 0.5)'
                  : '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '0',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
            />
            {errors.name && (
              <p style={{
                fontSize: '0.75rem',
                color: '#ef4444',
                marginTop: '0.25rem',
                fontWeight: '600'
              }}>
                {errors.name}
              </p>
            )}
          </div>
          
          {/* Type */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              Type Training
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '0.625rem'
            }}>
              {workoutTypes.map(wType => (
                <button
                  key={wType.value}
                  onClick={() => setType(wType.value)}
                  style={{
                    padding: isMobile ? '0.75rem 0.625rem' : '0.875rem 0.75rem',
                    background: type === wType.value
                      ? 'rgba(249, 115, 22, 0.15)'
                      : 'rgba(10, 10, 10, 0.8)',
                    border: type === wType.value
                      ? '1px solid rgba(249, 115, 22, 0.4)'
                      : '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '0',
                    color: type === wType.value ? '#f97316' : 'rgba(255, 255, 255, 0.7)',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    minHeight: '44px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <span style={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                    {wType.emoji}
                  </span>
                  <span>{wType.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Duur */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              Duur (minuten) *
            </label>
            <div style={{ position: 'relative' }}>
              <Clock
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
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="40"
                min="1"
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem 1rem 0.75rem 3rem' : '0.875rem 1.125rem 0.875rem 3.5rem',
                  background: 'rgba(249, 115, 22, 0.05)',
                  border: errors.duration
                    ? '1px solid rgba(239, 68, 68, 0.5)'
                    : '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '0',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '600',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            {errors.duration && (
              <p style={{
                fontSize: '0.75rem',
                color: '#ef4444',
                marginTop: '0.25rem',
                fontWeight: '600'
              }}>
                {errors.duration}
              </p>
            )}
          </div>
          
          {/* Beschrijving */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              Notities / Beschrijving
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bijv. Hoge intensiteit intervals, bergop climbs..."
              rows={4}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.125rem',
                background: 'rgba(249, 115, 22, 0.05)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '0',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '500',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          
          {/* Template Toggle */}
          <div style={{
            padding: isMobile ? '1rem' : '1.125rem',
            background: 'rgba(249, 115, 22, 0.05)',
            border: '1px solid rgba(249, 115, 22, 0.15)',
            borderRadius: '0'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#f97316'
                }}
              />
              <div>
                <div style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: '#fff',
                  fontWeight: '700',
                  marginBottom: '0.15rem'
                }}>
                  Opslaan als herbruikbare template
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '600'
                }}>
                  Je kunt deze training later snel hergebruiken
                </div>
              </div>
            </label>
          </div>
        </div>
        
        {/* Footer Buttons */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: '1px solid rgba(249, 115, 22, 0.2)',
          flexShrink: 0,
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0',
              color: '#ef4444',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
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
              padding: isMobile ? '0.875rem' : '1rem',
              background: saving
                ? 'rgba(107, 114, 128, 0.3)'
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '0',
              color: saving ? 'rgba(255, 255, 255, 0.5)' : '#000',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: saving ? 'none' : '0 4px 20px rgba(249, 115, 22, 0.35)',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: isMobile ? '16px' : '18px',
                  height: isMobile ? '16px' : '18px',
                  border: '2px solid rgba(0, 0, 0, 0.3)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Opslaan...
              </>
            ) : (
              <>
                <Save size={isMobile ? 16 : 18} />
                {existingWorkout ? 'Wijzigingen Opslaan' : 'Training Opslaan'}
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
    </div>,
    document.body
  )
}
