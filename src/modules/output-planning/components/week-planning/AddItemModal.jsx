// src/modules/output-planning/components/week-planning/AddItemModal.jsx
// Quick add modal for standalone items (gym, tasks, etc.)
// FIXED: TIME_OPTIONS are objects with {value, label}

import { useState } from 'react'
import { X, Calendar, Clock, Type } from 'lucide-react'
import { GOLD, DAYS_FULL, TIME_OPTIONS, DURATION_OPTIONS } from './constants'

export default function AddItemModal({
  isOpen,
  onClose,
  onSave,
  weekDays,
  initialDayOfWeek,
  initialTime,
  editItem,
  isMobile
}) {
  const [formData, setFormData] = useState({
    title: editItem?.title || editItem?.label || '',
    description: editItem?.description || '',
    dayOfWeek: initialDayOfWeek || editItem?.day_of_week || 'monday',
    time: initialTime || editItem?.scheduled_time || '09:00',
    duration: editItem?.duration_minutes || 30,
    phase: editItem?.phase || 'post',
    itemType: editItem?.item_type || 'task'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e) => {
    e?.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Titel is verplicht')
      return
    }
    
    setSaving(true)
    setError('')
    
    try {
      await onSave(formData)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen) return null
  
  // Safe arrays
  const safeWeekDays = Array.isArray(weekDays) ? weekDays : []
  const safeTimeOptions = Array.isArray(TIME_OPTIONS) ? TIME_OPTIONS : []
  const safeDurationOptions = Array.isArray(DURATION_OPTIONS) ? DURATION_OPTIONS : []
  
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
        maxWidth: '450px',
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
          <h3 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            {editItem ? 'Item bewerken' : 'Nieuw item'}
          </h3>
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
        
        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Title */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.375rem'
            }}>
              <Type size={12} />
              Titel
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Bijv: Gym, Community post..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#111',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Day + Time */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem'
          }}>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.375rem'
              }}>
                <Calendar size={12} />
                Dag
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem'
                }}
              >
                {safeWeekDays.map((d, idx) => (
                  <option key={d?.dayOfWeek || idx} value={d?.dayOfWeek || ''}>
                    {DAYS_FULL[idx] || `Dag ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.375rem'
              }}>
                <Clock size={12} />
                Tijd
              </label>
              <select
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem'
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
          
          {/* Duration */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.375rem'
            }}>
              <Clock size={12} />
              Duur
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#111',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            >
              {safeDurationOptions.map(d => (
                <option key={d?.value} value={d?.value}>
                  {d?.label || `${d?.value} min`}
                </option>
              ))}
            </select>
          </div>
          
          {error && (
            <div style={{
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
        </form>
        
        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            type="button"
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
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: '700',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? 'Bezig...' : editItem ? 'Opslaan' : 'Toevoegen'}
          </button>
        </div>
      </div>
    </div>
  )
}
