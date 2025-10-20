// src/modules/workout/components/todays-workout/components/CustomExerciseModal.jsx
import { X, Plus, Dumbbell } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CustomExerciseModal({ onClose, onSave, client, db }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: 'chest',
    sets: 3,
    reps: '10',
    rest: '90s',
    rpe: 8,
    notes: ''
  })
  
  // Progressive reveal
  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
  }, [])
  
  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])
  
  // Handle close
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }
  
  // Handle save
  const handleSave = async () => {
    // Validate
    if (!formData.name.trim()) {
      alert('Voer een oefening naam in')
      return
    }
    
    setSaving(true)
    
    try {
      // Save to database if client exists
      if (client?.id && db) {
        await db.saveCustomExercise(client.id, {
          name: formData.name.trim(),
          muscleGroup: formData.muscleGroup,
          sets: parseInt(formData.sets) || 3,
          reps: formData.reps || '10',
          rest: formData.rest || '90s',
          rpe: parseInt(formData.rpe) || 8,
          notes: formData.notes || ''
        })
        console.log('✅ Custom exercise saved to database')
      }
      
      // Return exercise data for immediate use
      const exercise = {
        name: formData.name.trim(),
        primairSpieren: formData.muscleGroup,
        sets: parseInt(formData.sets) || 3,
        reps: formData.reps || '10',
        rust: formData.rest || '90s',
        rpe: parseInt(formData.rpe) || 8,
        notes: formData.notes || '',
        equipment: 'custom',
        type: 'custom'
      }
      
      // Success feedback
      if (navigator.vibrate) navigator.vibrate(50)
      
      // Call parent callback
      onSave(exercise)
      
    } catch (error) {
      console.error('❌ Save custom exercise failed:', error)
      alert('Kon oefening niet opslaan. Probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }
  
  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const muscleGroups = [
    { value: 'chest', label: 'Borst' },
    { value: 'back', label: 'Rug' },
    { value: 'legs', label: 'Benen' },
    { value: 'shoulders', label: 'Schouders' },
    { value: 'arms', label: 'Armen' },
    { value: 'core', label: 'Core' }
  ]
  
  const restOptions = [
    { value: '60s', label: '60 sec' },
    { value: '90s', label: '90 sec' },
    { value: '2m', label: '2 min' },
    { value: '3m', label: '3 min' }
  ]
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        style={{
          maxWidth: isMobile ? '100%' : '600px',
          width: '100%',
          maxHeight: isMobile ? '90vh' : '85vh',
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: isMobile ? '12px' : '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 60px rgba(249, 115, 22, 0.1)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
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
          padding: isMobile ? '0.875rem 1rem' : '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: '8px',
              background: 'rgba(249, 115, 22, 0.2)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)'
            }}>
              <Dumbbell 
                size={isMobile ? 16 : 18} 
                color="#f97316"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))'
                }}
              />
            </div>
            <h2 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '800',
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Eigen Oefening
            </h2>
          </div>
          
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
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'
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
        
        {/* Form Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '0.875rem' : '1.25rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '0.875rem' : '1rem'
          }}>
            {/* Exercise Name */}
            <FormField label="Oefening Naam" required>
              <input
                type="text"
                placeholder="Bijv. Barbell Bench Press"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={inputStyle(isMobile)}
              />
            </FormField>
            
            {/* Muscle Group */}
            <FormField label="Spiergroep" required>
              <select
                value={formData.muscleGroup}
                onChange={(e) => handleChange('muscleGroup', e.target.value)}
                style={inputStyle(isMobile)}
              >
                {muscleGroups.map(group => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </FormField>
            
            {/* Sets & Reps Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: isMobile ? '0.625rem' : '0.75rem'
            }}>
              <FormField label="Sets">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.sets}
                  onChange={(e) => handleChange('sets', e.target.value)}
                  style={inputStyle(isMobile)}
                />
              </FormField>
              
              <FormField label="Reps">
                <input
                  type="text"
                  placeholder="10 of 8-12"
                  value={formData.reps}
                  onChange={(e) => handleChange('reps', e.target.value)}
                  style={inputStyle(isMobile)}
                />
              </FormField>
            </div>
            
            {/* Rest & RPE Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: isMobile ? '0.625rem' : '0.75rem'
            }}>
              <FormField label="Rust">
                <select
                  value={formData.rest}
                  onChange={(e) => handleChange('rest', e.target.value)}
                  style={inputStyle(isMobile)}
                >
                  {restOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
              
              <FormField label="RPE (1-10)">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.rpe}
                  onChange={(e) => handleChange('rpe', e.target.value)}
                  style={inputStyle(isMobile)}
                />
              </FormField>
            </div>
            
            {/* Notes */}
            <FormField label="Notities (optioneel)">
              <textarea
                placeholder="Techniektips, cues, etc..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                style={{
                  ...inputStyle(isMobile),
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </FormField>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div style={{
          padding: isMobile ? '0.875rem 1rem' : '1.25rem 1.5rem',
          borderTop: '1px solid rgba(249, 115, 22, 0.2)',
          display: 'flex',
          gap: isMobile ? '0.5rem' : '0.75rem'
        }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '8px',
              color: '#f97316',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'
              }
            }}
          >
            Annuleren
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: saving || !formData.name.trim()
                ? 'rgba(249, 115, 22, 0.3)'
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: saving || !formData.name.trim() ? 'not-allowed' : 'pointer',
              boxShadow: saving || !formData.name.trim()
                ? 'none'
                : '0 4px 20px rgba(249, 115, 22, 0.35)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              opacity: saving || !formData.name.trim() ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!isMobile && !saving && formData.name.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(249, 115, 22, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.35)'
              }
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(0, 0, 0, 0.3)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Opslaan...
              </>
            ) : (
              <>
                <Plus size={isMobile ? 16 : 18} />
                Toevoegen
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
}

// Form Field Component
function FormField({ label, required, children }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: '#f97316',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.4rem'
      }}>
        {label}
        {required && (
          <span style={{ color: '#f97316', marginLeft: '0.25rem' }}>*</span>
        )}
      </label>
      {children}
    </div>
  )
}

// Input Style Helper
function inputStyle(isMobile) {
  return {
    width: '100%',
    padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
    background: 'rgba(23, 23, 23, 0.6)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(249, 115, 22, 0.15)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: isMobile ? '0.8rem' : '0.85rem',
    fontWeight: '600',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    minHeight: '44px'
  }
}
