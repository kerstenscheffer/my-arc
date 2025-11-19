import { useState } from 'react'
import { X } from 'lucide-react'

const PRESET_COLORS = [
  '#10b981', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#84cc16'  // Lime
]

export default function AddMetricModal({ isMobile, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    metricName: '',
    metricColor: '#10b981'
  })
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.metricName.trim()) {
      setError('Metric naam is verplicht')
      return
    }

    onSubmit(formData.metricName.trim(), formData.metricColor)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '1rem' : '2rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div style={{
        background: '#111',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '450px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '600',
            color: '#fff',
            margin: 0
          }}>
            Nieuwe Metric
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          padding: isMobile ? '1rem' : '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* Metric Name */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Metric Naam <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.metricName}
              onChange={(e) => {
                setFormData({ ...formData, metricName: e.target.value })
                setError('')
              }}
              placeholder="bijv. Reacties, Call ingepland, Community joined..."
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
              autoFocus
            />
            {error && (
              <p style={{
                margin: '0.5rem 0 0 0',
                color: '#ef4444',
                fontSize: '0.8rem'
              }}>
                {error}
              </p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Kleur
            </label>

            {/* Color Preview */}
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: `${formData.metricColor}15`,
              border: `2px solid ${formData.metricColor}`,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: formData.metricColor,
                boxShadow: `0 0 15px ${formData.metricColor}80`
              }} />
              <span style={{
                color: formData.metricColor,
                fontSize: '0.9rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {formData.metricColor}
              </span>
            </div>

            {/* Preset Colors */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.75rem'
            }}>
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, metricColor: color })}
                  style={{
                    aspectRatio: '1',
                    background: color,
                    border: formData.metricColor === color 
                      ? '3px solid #fff'
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: formData.metricColor === color 
                      ? `0 0 20px ${color}80`
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.metricColor !== color) {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.metricColor !== color) {
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                />
              ))}
            </div>

            {/* Custom Color Input */}
            <div style={{
              marginTop: '1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center'
            }}>
              <input
                type="color"
                value={formData.metricColor}
                onChange={(e) => setFormData({ ...formData, metricColor: e.target.value })}
                style={{
                  width: '50px',
                  height: '50px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: 'transparent'
                }}
              />
              <span style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem'
              }}>
                Of kies eigen kleur
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Annuleer
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: `linear-gradient(135deg, ${formData.metricColor} 0%, ${formData.metricColor}dd 100%)`,
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Toevoegen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
