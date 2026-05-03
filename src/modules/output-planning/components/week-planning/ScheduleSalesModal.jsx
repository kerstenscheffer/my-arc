// src/modules/output-planning/components/week-planning/ScheduleSalesModal.jsx
// Modal to schedule sales phases into a week
// Pattern based on SchedulePieceModal.jsx

import { useState } from 'react'
import { X, ClipboardList, MessageSquare, Phone, Star } from 'lucide-react'
import { GOLD, PHASES, DAYS_FULL, TIME_OPTIONS } from './constants'

const SalesPhaseIcons = {
  prep: ClipboardList,
  followup: MessageSquare,
  call: Phone,
  aftersale: Star
}

export default function ScheduleSalesModal({
  isOpen,
  onClose,
  onSave,
  salesPiece,
  weekDays,
  isMobile
}) {
  const phases = ['prep', 'followup', 'call', 'aftersale']
  const requiredPhases = phases.filter(p => salesPiece?.[`needs_${p}`])
  
  // Safe arrays
  const safeWeekDays = Array.isArray(weekDays) ? weekDays : []
  const safeTimeOptions = Array.isArray(TIME_OPTIONS) ? TIME_OPTIONS : []
  
  // Initialize schedule with smart defaults
  const [phaseSchedule, setPhaseSchedule] = useState(() => {
    const initial = {}
    
    // Find call date in week (if provided)
    let callDayIndex = 1 // Default Tuesday
    if (salesPiece?.call_date && safeWeekDays.length > 0) {
      const callDate = new Date(salesPiece.call_date)
      const callDayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][callDate.getDay()]
      const foundIndex = safeWeekDays.findIndex(d => d.dayOfWeek === callDayOfWeek)
      if (foundIndex !== -1) callDayIndex = foundIndex
    }
    
    // Smart defaults based on call timing
    requiredPhases.forEach((phase) => {
      if (phase === 'prep') {
        // Day before call
        const dayIndex = Math.max(0, callDayIndex - 1)
        initial[phase] = {
          dayOfWeek: safeWeekDays[dayIndex]?.dayOfWeek || 'monday',
          time: '09:00',
          duration: 30
        }
      } else if (phase === 'followup') {
        // Day before call
        const dayIndex = Math.max(0, callDayIndex - 1)
        initial[phase] = {
          dayOfWeek: safeWeekDays[dayIndex]?.dayOfWeek || 'monday',
          time: '10:00',
          duration: 15
        }
      } else if (phase === 'call') {
        // On call day at call time
        initial[phase] = {
          dayOfWeek: safeWeekDays[callDayIndex]?.dayOfWeek || 'tuesday',
          time: salesPiece?.call_time || '14:00',
          duration: salesPiece?.call_duration_minutes || 30
        }
      } else if (phase === 'aftersale') {
        // Day after call
        const dayIndex = Math.min(safeWeekDays.length - 1, callDayIndex + 1)
        initial[phase] = {
          dayOfWeek: safeWeekDays[dayIndex]?.dayOfWeek || 'wednesday',
          time: '16:00',
          duration: 30
        }
      }
    })
    
    return initial
  })
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const handleSave = async () => {
    setSaving(true)
    setError('')
    
    try {
      await onSave({ phaseSchedule })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen || !salesPiece) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        border: `1px solid ${GOLD.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: `1px solid ${GOLD.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: '700',
              color: GOLD.primary
            }}>
              Inplannen Sales Call
            </h3>
            <p style={{
              margin: '0.25rem 0 0',
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {salesPiece.title || salesPiece.prospect_name}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem'
        }}>
          {requiredPhases.length === 0 ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
              Geen phases geselecteerd om in te plannen.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {requiredPhases.map(phase => {
                const PhaseIcon = SalesPhaseIcons[phase]
                const phaseInfo = PHASES[phase]
                
                return (
                  <div key={phase} style={{
                    padding: '1rem',
                    background: 'rgba(255, 215, 0, 0.05)',
                    border: `1px solid ${phaseInfo.color}30`,
                    borderRadius: '10px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem'
                    }}>
                      <PhaseIcon size={16} color={phaseInfo.color} />
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: phaseInfo.color
                      }}>
                        {phaseInfo.label}
                      </span>
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.4)'
                      }}>
                        {phaseInfo.description}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: '0.75rem'
                    }}>
                      {/* Day Select */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          marginBottom: '0.25rem'
                        }}>
                          Dag
                        </label>
                        <select
                          value={phaseSchedule[phase]?.dayOfWeek || 'monday'}
                          onChange={(e) => setPhaseSchedule(prev => ({
                            ...prev,
                            [phase]: { ...prev[phase], dayOfWeek: e.target.value }
                          }))}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: '#111',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.85rem'
                          }}
                        >
                          {safeWeekDays.map((d, idx) => (
                            <option key={d?.dayOfWeek || idx} value={d?.dayOfWeek || ''}>
                              {DAYS_FULL[idx] || `Dag ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Time Select */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          marginBottom: '0.25rem'
                        }}>
                          Tijd
                        </label>
                        <select
                          value={phaseSchedule[phase]?.time || '09:00'}
                          onChange={(e) => setPhaseSchedule(prev => ({
                            ...prev,
                            [phase]: { ...prev[phase], time: e.target.value }
                          }))}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: '#111',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.85rem'
                          }}
                        >
                          {safeTimeOptions.map(t => (
                            <option key={t?.value || t} value={t?.value || t}>
                              {t?.label || t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving || requiredPhases.length === 0}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: '700',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving || requiredPhases.length === 0 ? 0.5 : 1
            }}
          >
            {saving ? 'Bezig...' : 'Inplannen'}
          </button>
        </div>
      </div>
    </div>
  )
}
