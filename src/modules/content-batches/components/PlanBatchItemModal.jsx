// src/modules/content-batches/components/PlanBatchItemModal.jsx
// Modal to plan a batch item with date + time selection

import { useState } from 'react'
import { X, Calendar, Clock, Check } from 'lucide-react'
import { POST_FORMATS } from '../constants'

const GOLD = {
  primary: '#FFD700',
  secondary: '#FFA500',
  border: 'rgba(255, 215, 0, 0.3)',
  background: 'rgba(255, 215, 0, 0.1)',
  glow: 'rgba(255, 215, 0, 0.2)'
}

export default function PlanBatchItemModal({
  isOpen,
  onClose,
  onSave,
  batchItem,
  isMobile
}) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('12:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  if (!isOpen || !batchItem) return null
  
  // Get format details
  const format = POST_FORMATS[batchItem.post_format]
  const color = batchItem.content_type === 'story' ? format?.storyColor : format?.postColor
  
  // Generate next 30 days for date picker
  const dateOptions = []
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    dateOptions.push({
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('nl-NL', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      })
    })
  }
  
  // Time options (every hour from 06:00 to 23:00)
  const timeOptions = []
  for (let h = 6; h <= 23; h++) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:00`)
    timeOptions.push(`${h.toString().padStart(2, '0')}:30`)
  }
  
  const handleSave = async () => {
    if (!selectedDate) {
      setError('Kies een datum')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      await onSave(batchItem.id, selectedDate, selectedTime)
      onClose()
    } catch (err) {
      setError('Kon niet opslaan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }
  
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
      zIndex: 2000,
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        width: isMobile ? '100%' : '500px',
        maxWidth: '100%',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        border: `1px solid ${GOLD.border}`,
        borderRadius: isMobile ? '12px' : '16px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: `1px solid ${GOLD.border}`,
          background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '800',
              color: GOLD.primary
            }}>
              📅 Plan In
            </h3>
            <p style={{
              margin: '0.25rem 0 0',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              Kies wanneer je dit wilt plaatsen
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
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          maxHeight: isMobile ? 'calc(100vh - 200px)' : '500px',
          overflowY: 'auto'
        }}>
          {/* Item Preview */}
          <div style={{
            padding: '1rem',
            background: `${color}15`,
            border: `2px solid ${color}40`,
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              {format?.icon && <format.icon size={20} color={color} />}
              <span style={{
                fontSize: '0.8rem',
                fontWeight: '700',
                color: color,
                textTransform: 'uppercase'
              }}>
                {format?.label}
                {batchItem.content_type === 'story' && ' 📱'}
              </span>
            </div>
            
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {batchItem.title}
            </div>
            
            {batchItem.location && (
              <div style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                📍 {batchItem.location}
              </div>
            )}
          </div>
          
          {/* Date Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <Calendar size={16} />
              Datum *
            </label>
            
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              <option value="">Kies een datum...</option>
              {dateOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Time Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <Clock size={16} />
              Tijd
            </label>
            
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              {timeOptions.map(time => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          
          {/* Error */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: `1px solid ${GOLD.border}`,
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
              touchAction: 'manipulation'
            }}
          >
            Annuleren
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !selectedDate}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: !selectedDate 
                ? 'rgba(255, 255, 255, 0.1)'
                : `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '8px',
              color: !selectedDate ? 'rgba(255, 255, 255, 0.3)' : '#000',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: (!selectedDate || saving) ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              touchAction: 'manipulation'
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
                  animation: 'spin 0.8s linear infinite'
                }} />
                Opslaan...
              </>
            ) : (
              <>
                <Check size={18} />
                Plan In
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
