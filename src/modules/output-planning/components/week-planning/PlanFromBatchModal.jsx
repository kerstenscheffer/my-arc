// src/modules/output-planning/components/week-planning/PlanFromBatchModal.jsx
// Modal to plan a content piece with all its phases
// FIXED: Safe data access to prevent crashes with content_items data

import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Calendar,
  FileText,
  Video,
  Scissors,
  Send,
  Check,
  Clock,
  Palette,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { 
  GOLD, 
  CONTENT_COLORS, 
  PHASES, 
  DAYS_FULL, 
  TIME_OPTIONS,
  DURATION_OPTIONS,
  CONTENT_TYPES
} from './constants'

// Phase icon mapping
const PhaseIcons = {
  script: FileText,
  shoot: Video,
  edit: Scissors,
  post: Send
}

// Helper to get Monday of current week
function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

// Format week range for display
function formatWeekRange(monday) {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  
  const monthNames = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const startMonth = monthNames[monday.getMonth()]
  const endMonth = monthNames[sunday.getMonth()]
  
  if (startMonth === endMonth) {
    return `${monday.getDate()} - ${sunday.getDate()} ${endMonth}`
  }
  return `${monday.getDate()} ${startMonth} - ${sunday.getDate()} ${endMonth}`
}

export default function PlanFromBatchModal({
  isOpen,
  onClose,
  onSave,
  contentItem, // From batch/content_items
  isMobile = false
}) {
  // Base monday (start of current week) - all offsets are relative to this
  const baseMonday = useMemo(() => getMonday(new Date()), [])
  
  // State
  const [color, setColor] = useState('blue')
  const [phases, setPhases] = useState({
    script: { enabled: true, weekOffset: 0, dayIndex: 0, time: '09:00', duration: 30 },
    shoot: { enabled: true, weekOffset: 0, dayIndex: 0, time: '14:00', duration: 60 },
    edit: { enabled: true, weekOffset: 0, dayIndex: 1, time: '10:00', duration: 90 },
    post: { enabled: true, weekOffset: 1, dayIndex: 0, time: '18:00', duration: 15 }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Helper to get week days for a specific offset
  const getWeekDaysForOffset = (offset) => {
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const monday = new Date(baseMonday)
    monday.setDate(monday.getDate() + (offset * 7))
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(date.getDate() + i)
      days.push({
        dayIndex: i,
        dayOfWeek: dayNames[i],
        date: date.toISOString().split('T')[0],
        dateObj: date
      })
    }
    return days
  }
  
  // Format week label
  const getWeekLabel = (offset) => {
    if (offset === 0) return 'Deze week'
    if (offset === 1) return 'Volgende week'
    if (offset === 2) return 'Over 2 weken'
    return `+${offset} weken`
  }
  
  // Determine which phases are needed based on content type
  useEffect(() => {
    if (contentItem) {
      const contentType = CONTENT_TYPES[contentItem.type] || {}
      
      // SAFE check for blueprint/script data - prevent crashes
      const hasBlueprint = contentItem.blueprint_steps && 
                          (Array.isArray(contentItem.blueprint_steps) ? contentItem.blueprint_steps.length > 0 : true)
      const hasScript = !!(contentItem.script || contentItem.hook)
      const scriptCompleted = hasBlueprint || hasScript
      
      console.log('📋 ContentItem data:', {
        type: contentItem.type,
        hasBlueprint,
        hasScript,
        scriptCompleted,
        contentType
      })
      
      // Script is always an option
      // Shoot depends on content type
      // Edit depends on content type
      // Post is always needed
      
      setPhases(prev => ({
        script: { 
          ...prev.script, 
          enabled: true,
          // If blueprint or script exists, mark as completed
          completed: scriptCompleted
        },
        shoot: { 
          ...prev.shoot, 
          enabled: contentType.needsShoot !== false 
        },
        edit: { 
          ...prev.edit, 
          enabled: contentType.needsEdit !== false 
        },
        post: { 
          ...prev.post, 
          enabled: true 
        }
      }))
    }
  }, [contentItem])
  
  // Toggle phase enabled
  const togglePhase = (phaseKey) => {
    // Post is always required
    if (phaseKey === 'post') return
    
    setPhases(prev => ({
      ...prev,
      [phaseKey]: { ...prev[phaseKey], enabled: !prev[phaseKey].enabled }
    }))
  }
  
  // Update phase setting
  const updatePhase = (phaseKey, field, value) => {
    setPhases(prev => ({
      ...prev,
      [phaseKey]: { ...prev[phaseKey], [field]: value }
    }))
  }
  
  // Handle save
  const handleSave = async () => {
    setError('')
    
    // Check enabled phases have valid settings
    const enabledPhases = Object.entries(phases).filter(([_, p]) => p.enabled)
    
    if (enabledPhases.length === 0) {
      setError('Selecteer minimaal één fase')
      return
    }
    
    setSaving(true)
    
    try {
      // Build save data - group phases by their week
      const phasesByWeek = {}
      
      enabledPhases.forEach(([key, phase]) => {
        const weekDays = getWeekDaysForOffset(phase.weekOffset)
        const dayData = weekDays[phase.dayIndex]
        
        // Calculate week start for this phase
        const weekMonday = new Date(baseMonday)
        weekMonday.setDate(weekMonday.getDate() + (phase.weekOffset * 7))
        const weekStart = weekMonday.toISOString().split('T')[0]
        
        if (!phasesByWeek[weekStart]) {
          phasesByWeek[weekStart] = []
        }
        
        phasesByWeek[weekStart].push({
          phase: key,
          day_of_week: dayData.dayOfWeek,
          scheduled_time: phase.time,
          duration_minutes: phase.duration,
          title: `${contentItem?.title || 'Content'} - ${PHASES[key].label}`,
          description: contentItem?.description || '',
          completed: phase.completed || false
        })
      })
      
      const saveData = {
        phasesByWeek, // Object with weekStart keys
        contentPiece: {
          title: contentItem?.title || 'Untitled',
          description: contentItem?.description || '',
          content_type: contentItem?.type || 'reel',
          color: color,
          source_content_id: contentItem?.id,
          hook: contentItem?.hook || '',
          blueprint_steps: contentItem?.blueprint_steps || null,
          location: contentItem?.location || '',
          target_duration: contentItem?.target_duration || null,
          edit_notes: contentItem?.edit_notes || '',
          needs_script: phases.script.enabled,
          needs_shoot: phases.shoot.enabled,
          needs_edit: phases.edit.enabled,
          needs_post: true,
          script_completed: phases.script.completed || false
        }
      }
      
      console.log('💾 Saving content piece with phases:', saveData)
      
      await onSave(saveData)
      onClose()
    } catch (err) {
      console.error('❌ Save failed:', err)
      setError('Opslaan mislukt. Probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen) return null
  
  // Safety check - if no contentItem, show error
  if (!contentItem) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          padding: '2rem',
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center'
        }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <div style={{ fontSize: '1rem', color: '#ef4444', marginBottom: '1rem' }}>
            Geen content item geselecteerd
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Sluiten
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: isMobile ? '100vh' : '90vh',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: isMobile ? '0' : '16px',
        border: isMobile ? 'none' : `1px solid ${GOLD.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Gold accent line */}
        <div style={{
          height: '3px',
          background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
        }} />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '1rem' : '1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: GOLD.background,
              border: `1px solid ${GOLD.border}`
            }}>
              <Calendar size={20} color={GOLD.primary} />
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '700',
                color: '#fff'
              }}>
                Plan in Week
              </h2>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                {contentItem?.title || 'Content plannen'}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          {/* Color Picker */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase'
            }}>
              <Palette size={14} />
              Kleur (voor visuele tracking)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '0.5rem'
            }}>
              {Object.entries(CONTENT_COLORS).map(([key, colorData]) => (
                <button
                  key={key}
                  onClick={() => setColor(key)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    minHeight: '36px',
                    borderRadius: '8px',
                    background: colorData.primary,
                    border: color === key 
                      ? '3px solid #fff' 
                      : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    transform: color === key ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: color === key 
                      ? `0 0 12px ${colorData.primary}` 
                      : 'none',
                    touchAction: 'manipulation'
                  }}
                  title={colorData.label}
                />
              ))}
            </div>
          </div>
          
          {/* Phase Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '0.75rem',
              textTransform: 'uppercase'
            }}>
              <Clock size={14} />
              Fases & Planning
            </label>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {/* ONLY map over content phases (script, shoot, edit, post) */}
              {['script', 'shoot', 'edit', 'post'].map((key) => {
                const phase = PHASES[key]
                const PhaseIcon = PhaseIcons[key]
                const phaseData = phases[key]
                const isEnabled = phaseData?.enabled || false
                const isCompleted = phaseData?.completed || false
                const isRequired = key === 'post'
                
                return (
                  <div
                    key={key}
                    style={{
                      background: isCompleted
                        ? 'rgba(16, 185, 129, 0.1)'
                        : isEnabled 
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'rgba(255, 255, 255, 0.01)',
                      border: isCompleted
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : isEnabled
                          ? `1px solid ${phase.color}30`
                          : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '0.875rem',
                      opacity: isEnabled ? 1 : 0.5,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Phase Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: isEnabled ? '0.75rem' : 0
                    }}>
                      {/* Toggle Checkbox */}
                      <button
                        onClick={() => togglePhase(key)}
                        disabled={isRequired}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: isCompleted
                            ? '#10b981'
                            : isEnabled 
                              ? `${phase.color}30` 
                              : 'transparent',
                          border: isCompleted
                            ? 'none'
                            : isEnabled
                              ? `2px solid ${phase.color}`
                              : '2px solid rgba(255, 255, 255, 0.2)',
                          color: isEnabled ? '#fff' : 'transparent',
                          cursor: isRequired ? 'default' : 'pointer',
                          flexShrink: 0,
                          touchAction: 'manipulation'
                        }}
                      >
                        {(isEnabled || isCompleted) && <Check size={14} strokeWidth={3} />}
                      </button>
                      
                      {/* Phase Icon */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: `${phase.color}20`,
                        border: `1px solid ${phase.color}40`
                      }}>
                        <PhaseIcon size={16} color={phase.color} />
                      </div>
                      
                      {/* Phase Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          color: isCompleted ? '#10b981' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {phase.label}
                          {isCompleted && (
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '0.125rem 0.375rem',
                              background: 'rgba(16, 185, 129, 0.2)',
                              borderRadius: '4px',
                              color: '#10b981'
                            }}>
                              DONE
                            </span>
                          )}
                          {isRequired && (
                            <span style={{
                              fontSize: '0.6rem',
                              color: 'rgba(255, 255, 255, 0.4)'
                            }}>
                              (verplicht)
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.4)'
                        }}>
                          {phase.description}
                        </div>
                      </div>
                    </div>
                    
                    {/* Phase Settings (when enabled) */}
                    {isEnabled && !isCompleted && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
                        gap: '0.5rem',
                        paddingLeft: '2.5rem'
                      }}>
                        {/* Week Select */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.6rem',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.4)',
                            marginBottom: '0.25rem',
                            textTransform: 'uppercase'
                          }}>
                            Week
                          </label>
                          <select
                            value={phaseData.weekOffset}
                            onChange={(e) => updatePhase(key, 'weekOffset', parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '0.7rem',
                              outline: 'none',
                              cursor: 'pointer',
                              minHeight: '36px'
                            }}
                          >
                            <option value={0}>Deze week</option>
                            <option value={1}>+1 week</option>
                            <option value={2}>+2 weken</option>
                            <option value={3}>+3 weken</option>
                            <option value={4}>+4 weken</option>
                          </select>
                        </div>
                        
                        {/* Day Select */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.6rem',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.4)',
                            marginBottom: '0.25rem',
                            textTransform: 'uppercase'
                          }}>
                            Dag
                          </label>
                          <select
                            value={phaseData.dayIndex}
                            onChange={(e) => updatePhase(key, 'dayIndex', parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '0.7rem',
                              outline: 'none',
                              cursor: 'pointer',
                              minHeight: '36px'
                            }}
                          >
                            {getWeekDaysForOffset(phaseData.weekOffset).map((day, idx) => {
                              const dayName = DAYS_FULL[idx] || `Dag ${idx + 1}`
                              const dateStr = new Date(day.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                              return (
                                <option key={idx} value={idx}>
                                  {dayName.substring(0, 2)} {dateStr}
                                </option>
                              )
                            })}
                          </select>
                        </div>
                        
                        {/* Time Select */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.6rem',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.4)',
                            marginBottom: '0.25rem',
                            textTransform: 'uppercase'
                          }}>
                            Tijd
                          </label>
                          <select
                            value={phaseData.time}
                            onChange={(e) => updatePhase(key, 'time', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '0.7rem',
                              outline: 'none',
                              cursor: 'pointer',
                              minHeight: '36px'
                            }}
                          >
                            {TIME_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Duration Select */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.6rem',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.4)',
                            marginBottom: '0.25rem',
                            textTransform: 'uppercase'
                          }}>
                            Duur
                          </label>
                          <select
                            value={phaseData.duration}
                            onChange={(e) => updatePhase(key, 'duration', parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              color: '#fff',
                              fontSize: '0.7rem',
                              outline: 'none',
                              cursor: 'pointer',
                              minHeight: '36px'
                            }}
                          >
                            {DURATION_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Info Note */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            padding: '0.75rem',
            background: GOLD.background,
            border: `1px solid ${GOLD.border}`,
            borderRadius: '10px',
            marginTop: '1rem'
          }}>
            <Sparkles size={16} color={GOLD.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.5'
            }}>
              Alle fases krijgen dezelfde <strong style={{ color: CONTENT_COLORS[color].primary }}>kleur</strong> zodat 
              je in de weekplanning direct ziet welke items bij elkaar horen.
            </div>
          </div>
          
          {/* Error */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              marginTop: '1rem',
              color: '#ef4444',
              fontSize: '0.8rem'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              minHeight: '48px'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.875rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              touchAction: 'manipulation',
              minHeight: '48px'
            }}
          >
            <Calendar size={18} />
            {saving ? 'Plannen...' : 'Plannen'}
          </button>
        </div>
      </div>
    </div>
  )
}
