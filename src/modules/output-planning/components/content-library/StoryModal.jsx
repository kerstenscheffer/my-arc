// src/modules/output-planning/components/content-library/StoryModal.jsx
// Story Planning Modal - UPDATED with Google Calendar-style recurring
// Renders INSIDE PlanningModal when type='story' is selected

import { useState, useEffect } from 'react'
import { 
  X, 
  ChevronLeft, 
  Plus, 
  Repeat, 
  Check,
  Calendar,
  ChevronDown
} from 'lucide-react'
import { 
  GOLD, 
  STORY_FORMATS, 
  STORY_GOALS, 
  STORY_TOPICS,
  DAILY_STORY_TEMPLATES,
  WEEKDAYS,
  formatDateString
} from './constants'

// NEW: Recurring presets (Google Calendar style)
const RECURRING_PRESETS = [
  { id: 'once', label: 'Eenmalig', description: 'Alleen deze week', days: [] },
  { id: 'daily', label: 'Dagelijks', description: 'Elke dag van de week', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
  { id: 'weekdays', label: 'Weekdagen', description: 'Maandag t/m vrijdag', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
  { id: 'custom', label: 'Aangepast', description: 'Kies zelf dagen', days: null }
]

export default function StoryModal({ 
  onClose, 
  onSave, 
  currentWeekMonday,
  isMobile 
}) {
  // Form state
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState(null)
  const [goal, setGoal] = useState(null)
  const [topic, setTopic] = useState(null)
  const [recurringPreset, setRecurringPreset] = useState('once') // NEW
  const [recurringDays, setRecurringDays] = useState([])
  const [useTemplate, setUseTemplate] = useState(null)
  const [showPresetDropdown, setShowPresetDropdown] = useState(false)

  // Auto-set days based on preset
  useEffect(() => {
    const preset = RECURRING_PRESETS.find(p => p.id === recurringPreset)
    if (preset && preset.days !== null) {
      setRecurringDays(preset.days)
    }
    // For 'custom', keep user-selected days
  }, [recurringPreset])

  // Toggle day selection (only for custom)
  const toggleDay = (dayId) => {
    setRecurringDays(prev => {
      const newDays = prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
      
      // If manually changing days, switch to custom
      if (recurringPreset !== 'custom') {
        setRecurringPreset('custom')
      }
      
      return newDays
    })
  }

  // Select all days
  const selectAllDays = () => {
    setRecurringDays(WEEKDAYS.map(d => d.id))
    setRecurringPreset('daily')
  }

  // Apply template
  const applyTemplate = (template) => {
    setUseTemplate(template.id)
    setTitle(template.title)
    setFormat(template.format)
    setGoal(template.goal)
    setTopic(template.topic)
    
    if (template.isRecurring) {
      setRecurringPreset('daily')
      setRecurringDays(WEEKDAYS.map(d => d.id))
    }
  }

  // Handle preset selection
  const handlePresetSelect = (presetId) => {
    setRecurringPreset(presetId)
    setShowPresetDropdown(false)
  }

  // Handle save
  const handleSave = () => {
    if (!title.trim()) {
      alert('Titel is verplicht')
      return
    }

    const isRecurring = recurringPreset !== 'once'

    const storyData = {
      title: title.trim(),
      type: 'story',
      story_format: format,
      story_goal: goal,
      story_topic: topic,
      is_recurring: isRecurring,
      recurring_days: isRecurring ? recurringDays : null,
      status: 'planned'
    }

    // Return as array for handleSavePlanningItem
    onSave([storyData], { isMultiple: true })
  }

  const selectedPreset = RECURRING_PRESETS.find(p => p.id === recurringPreset)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem',
      zIndex: 1100
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '600px',
        maxHeight: isMobile ? '95vh' : '90vh',
        overflow: 'auto',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: isMobile ? '20px 20px 0 0' : '16px',
        border: '1px solid rgba(236, 72, 153, 0.3)',
        position: 'relative',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Top accent - Pink for stories */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)'
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '1rem' : '1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'sticky',
          top: 0,
          background: '#1a1a1a',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                touchAction: 'manipulation',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '700',
              color: '#fff',
              margin: 0
            }}>
              📱 Story Plannen
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              touchAction: 'manipulation',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
          
          {/* Quick Templates */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#ec4899',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              ⚡ Snel starten
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem'
            }}>
              {DAILY_STORY_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  style={{
                    padding: '0.75rem',
                    background: useTemplate === template.id 
                      ? 'rgba(236, 72, 153, 0.2)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: useTemplate === template.id
                      ? '2px solid #ec4899'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    touchAction: 'manipulation',
                    minHeight: '44px'
                  }}
                >
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: useTemplate === template.id ? '#ec4899' : '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {template.title}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {template.description}
                  </div>
                  {template.isRecurring && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.375rem',
                      padding: '0.2rem 0.4rem',
                      background: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '4px',
                      fontSize: '0.6rem',
                      color: '#10b981'
                    }}>
                      <Repeat size={10} />
                      Dagelijks
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'rgba(255, 255, 255, 0.1)',
            margin: '1.5rem 0'
          }} />

          {/* Title */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv: Workout check-in"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                touchAction: 'manipulation',
                minHeight: '48px'
              }}
            />
          </div>

          {/* Format Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Format
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem'
            }}>
              {Object.entries(STORY_FORMATS).map(([key, val]) => {
                const Icon = val.icon
                const isSelected = format === key
                return (
                  <button
                    key={key}
                    onClick={() => setFormat(isSelected ? null : key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem',
                      background: isSelected ? `${val.color}20` : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? `2px solid ${val.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      minHeight: '44px'
                    }}
                  >
                    <Icon size={16} color={val.color} />
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: isSelected ? val.color : 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {val.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Goal Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Doel
            </label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.375rem'
            }}>
              {Object.entries(STORY_GOALS).map(([key, val]) => {
                const Icon = val.icon
                const isSelected = goal === key
                return (
                  <button
                    key={key}
                    onClick={() => setGoal(isSelected ? null : key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      background: isSelected ? `${val.color}20` : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? `2px solid ${val.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      minHeight: '44px'
                    }}
                  >
                    <Icon size={14} color={val.color} />
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: isSelected ? val.color : 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {val.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Topic Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Topic
            </label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.375rem'
            }}>
              {Object.entries(STORY_TOPICS).map(([key, val]) => {
                const Icon = val.icon
                const isSelected = topic === key
                return (
                  <button
                    key={key}
                    onClick={() => setTopic(isSelected ? null : key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      background: isSelected ? `${val.color}20` : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? `2px solid ${val.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      minHeight: '44px'
                    }}
                  >
                    <Icon size={14} color={val.color} />
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: isSelected ? val.color : 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {val.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* NEW: Recurring Preset Dropdown */}
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              <Repeat size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Herhaling
            </label>
            <button
              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.875rem',
                background: recurringPreset !== 'once' 
                  ? 'rgba(16, 185, 129, 0.1)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: recurringPreset !== 'once'
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                cursor: 'pointer',
                touchAction: 'manipulation',
                minHeight: '52px'
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: recurringPreset !== 'once' ? '#10b981' : '#fff'
                }}>
                  {selectedPreset?.label}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {selectedPreset?.description}
                </div>
              </div>
              <ChevronDown 
                size={18} 
                color={recurringPreset !== 'once' ? '#10b981' : 'rgba(255, 255, 255, 0.5)'}
                style={{
                  transform: showPresetDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              />
            </button>

            {/* Dropdown */}
            {showPresetDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                background: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                overflow: 'hidden',
                zIndex: 20,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
              }}>
                {RECURRING_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.875rem',
                      background: recurringPreset === preset.id 
                        ? 'rgba(16, 185, 129, 0.15)' 
                        : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      minHeight: '52px'
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: recurringPreset === preset.id ? '#10b981' : '#fff'
                      }}>
                        {preset.label}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}>
                        {preset.description}
                      </div>
                    </div>
                    {recurringPreset === preset.id && (
                      <Check size={18} color="#10b981" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Day Selection (always visible) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <label style={{
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                {recurringPreset === 'custom' ? 'Selecteer dagen' : 'Geselecteerde dagen'}
              </label>
              {recurringPreset === 'custom' && (
                <button
                  onClick={selectAllDays}
                  style={{
                    fontSize: '0.7rem',
                    color: '#ec4899',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    touchAction: 'manipulation'
                  }}
                >
                  Alle dagen
                </button>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.375rem'
            }}>
              {WEEKDAYS.map(day => {
                const isSelected = recurringDays.includes(day.id)
                const isDisabled = recurringPreset !== 'custom' && recurringPreset !== 'once'
                
                return (
                  <button
                    key={day.id}
                    onClick={() => recurringPreset === 'custom' && toggleDay(day.id)}
                    disabled={isDisabled}
                    style={{
                      padding: '0.625rem 0.25rem',
                      background: isSelected 
                        ? 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected 
                        ? 'none' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      cursor: recurringPreset === 'custom' ? 'pointer' : 'default',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.125rem',
                      opacity: isDisabled ? 0.6 : 1,
                      touchAction: 'manipulation',
                      minHeight: '48px'
                    }}
                  >
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {day.label}
                    </span>
                    {isSelected && (
                      <Check size={12} color="#fff" strokeWidth={3} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          {(title || format || goal || recurringDays.length > 0) && (
            <div style={{
              padding: '0.875rem',
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              borderRadius: '10px',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#ec4899',
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}>
                Samenvatting
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: '#fff',
                lineHeight: '1.5'
              }}>
                {title && <span style={{ fontWeight: '600' }}>{title}</span>}
                {format && <span> • {STORY_FORMATS[format]?.label}</span>}
                {goal && <span> • {STORY_GOALS[goal]?.label}</span>}
                {topic && <span> • {STORY_TOPICS[topic]?.label}</span>}
                {recurringDays.length > 0 && (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {recurringPreset !== 'once' ? '♾️ Herhaalt op: ' : '📅 Gepland voor: '}
                    {recurringDays.map(d => WEEKDAYS.find(w => w.id === d)?.label).join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: title.trim() 
                  ? 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '10px',
                color: title.trim() ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                touchAction: 'manipulation',
                minHeight: '52px'
              }}
            >
              {recurringPreset !== 'once' ? '♾️ Recurring Story Opslaan' : '📱 Story Opslaan'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                touchAction: 'manipulation',
                minHeight: '52px'
              }}
            >
              Annuleren
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
