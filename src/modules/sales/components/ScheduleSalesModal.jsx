// src/modules/sales/components/ScheduleSalesModal.jsx
// Modal om sales pieces in te plannen in week planner
// Phases: prep, call, followup, aftersale

import { useState } from 'react'
import { X, Calendar, Phone, Mail, UserCheck, Sparkles } from 'lucide-react'
import { SALES_THEME } from '../SalesSection'

// Phase config
const PHASE_CONFIG = {
  prep: { 
    label: 'Prep', 
    icon: Sparkles, 
    color: '#3b82f6',
    description: 'Voorbereiding',
    defaultDuration: 30
  },
  call: { 
    label: 'Sales Call', 
    icon: Phone, 
    color: '#10b981',
    description: 'Het gesprek',
    defaultDuration: 30
  },
  followup: { 
    label: 'Follow-up', 
    icon: Mail, 
    color: '#f59e0b',
    description: 'Opvolgen',
    defaultDuration: 15
  },
  aftersale: { 
    label: 'After Sale', 
    icon: UserCheck, 
    color: '#8b5cf6',
    description: 'Nazorg',
    defaultDuration: 30
  }
}

const DAYS = [
  { id: 'monday', label: 'Maandag' },
  { id: 'tuesday', label: 'Dinsdag' },
  { id: 'wednesday', label: 'Woensdag' },
  { id: 'thursday', label: 'Donderdag' },
  { id: 'friday', label: 'Vrijdag' },
  { id: 'saturday', label: 'Zaterdag' },
  { id: 'sunday', label: 'Zondag' }
]

const TIME_OPTIONS = []
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:30`)
}

export default function ScheduleSalesModal({
  isOpen,
  onClose,
  onSave,
  salesPiece,
  weekDays = [],
  isMobile
}) {
  const [phaseSchedule, setPhaseSchedule] = useState(() => {
    const schedule = {}
    const phases = ['prep', 'call', 'followup', 'aftersale']
    
    phases.forEach((phase, idx) => {
      // Check if piece has the needs_ flag, default to true if not set
      const isNeeded = salesPiece?.[`needs_${phase}`] !== false
      
      if (isNeeded) {
        schedule[phase] = {
          enabled: true,
          dayOfWeek: weekDays[Math.min(idx, 6)]?.dayOfWeek || 'monday',
          time: ['09:00', '14:00', '16:00', '10:00'][idx],
          duration: PHASE_CONFIG[phase].defaultDuration
        }
      }
    })
    
    return schedule
  })
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  const handlePhaseChange = (phase, field, value) => {
    setPhaseSchedule(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [field]: value
      }
    }))
  }
  
  const handleSubmit = async () => {
    const enabledPhases = Object.keys(phaseSchedule).filter(p => phaseSchedule[p].enabled)
    if (enabledPhases.length === 0) {
      setError('Selecteer minimaal 1 phase')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      await onSave({ phaseSchedule })
      onClose()
    } catch (err) {
      console.error('Failed to schedule:', err)
      setError('Inplannen mislukt')
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen || !salesPiece) return null
  
  const phases = ['prep', 'call', 'followup', 'aftersale'].filter(p => 
    salesPiece?.[`needs_${p}`] !== false  // Show if not explicitly set to false
  )
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '0' : '1rem',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
          border: `1px solid ${SALES_THEME.border}`,
          borderRadius: isMobile ? '24px 24px 0 0' : '16px',
          width: isMobile ? '100%' : '100%',
          maxWidth: '700px',
          maxHeight: isMobile ? '90vh' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 20px 60px ${SALES_THEME.glow}`
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem 1rem' : '1.5rem',
          borderBottom: `1px solid ${SALES_THEME.border}`,
          background: `linear-gradient(135deg, ${SALES_THEME.background} 0%, rgba(0,0,0,0.3) 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <Calendar size={24} color={SALES_THEME.primary} />
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                Plan in Week
              </h2>
            </div>
            
            <p style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {salesPiece.title}
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              flexShrink: 0,
              marginLeft: '1rem'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content - ScrollablePhase List - Compact*/}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          <div style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}>
            💡 Kies welke phases je wilt inplannen
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {phases.map(phase => {
              const config = PHASE_CONFIG[phase]
              const schedule = phaseSchedule[phase] || { enabled: true, dayOfWeek: 'monday', time: '09:00', duration: 30 }
              const Icon = config.icon
              
              return (
                <div
                  key={phase}
                  style={{
                    padding: '0.875rem',
                    background: schedule.enabled ? `${config.color}10` : 'rgba(255, 255, 255, 0.02)',
                    border: schedule.enabled ? `1px solid ${config.color}40` : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px'
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: schedule.enabled ? '0.75rem' : '0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <Icon size={18} color={schedule.enabled ? config.color : 'rgba(255, 255, 255, 0.3)'} />
                      <div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          color: schedule.enabled ? config.color : 'rgba(255, 255, 255, 0.5)'
                        }}>
                          {config.label}
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.4)'
                        }}>
                          {config.description}
                        </div>
                      </div>
                    </div>
                    
                    {/* Toggle */}
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '44px',
                      height: '24px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={schedule.enabled}
                        onChange={(e) => handlePhaseChange(phase, 'enabled', e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: schedule.enabled ? config.color : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px',
                        transition: '0.3s'
                      }}>
                        <span style={{
                          position: 'absolute',
                          height: '18px',
                          width: '18px',
                          left: schedule.enabled ? '23px' : '3px',
                          bottom: '3px',
                          background: '#fff',
                          borderRadius: '50%',
                          transition: '0.3s'
                        }} />
                      </span>
                    </label>
                  </div>
                  
                  {/* Inputs */}
                  {schedule.enabled && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr',
                      gap: '0.5rem'
                    }}>
                      <select
                        value={schedule.dayOfWeek}
                        onChange={(e) => handlePhaseChange(phase, 'dayOfWeek', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                      >
                        {DAYS.map(day => (
                          <option key={day.id} value={day.id}>{day.label}</option>
                        ))}
                      </select>
                      
                      <select
                        value={schedule.time}
                        onChange={(e) => handlePhaseChange(phase, 'time', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      
                      <input
                        type="number"
                        value={schedule.duration}
                        onChange={(e) => handlePhaseChange(phase, 'duration', parseInt(e.target.value))}
                        min={5}
                        step={5}
                        placeholder="min"
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.8rem'
            }}>
              {error}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: `1px solid ${SALES_THEME.border}`,
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            Annuleer
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 2,
              padding: '0.875rem',
              background: saving
                ? 'rgba(255, 255, 255, 0.1)'
                : `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
              border: 'none',
              borderRadius: '10px',
              color: saving ? 'rgba(255, 255, 255, 0.3)' : '#000',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : `0 4px 20px ${SALES_THEME.glow}`
            }}
          >
            {saving ? 'Inplannen...' : 'Plan in Week'}
          </button>
        </div>
      </div>
    </div>
  )
}
