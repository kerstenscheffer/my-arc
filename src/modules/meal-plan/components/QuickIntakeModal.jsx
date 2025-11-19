// src/modules/meal-plan/components/QuickIntakeModal.jsx
// ⚡ QUICK INTAKE MODAL v5.0 - Ultra Compact Premium Design
import React, { useState } from 'react'
import { X, Percent, Hash } from 'lucide-react'

export default function QuickIntakeModal({ onClose, onSave, targets, isMobile }) {
  const [inputType, setInputType] = useState('percentage')
  const [percentage, setPercentage] = useState(100)
  const [manualValues, setManualValues] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })

  const percentageOptions = [
    { value: 100, label: '100%', color: '#10b981' },
    { value: 80, label: '80%', color: '#f59e0b' },
    { value: 60, label: '60%', color: '#ef4444' },
    { value: 40, label: '40%', color: '#8b5cf6' }
  ]

  const handleSave = () => {
    let intakeData

    if (inputType === 'percentage') {
      const factor = percentage / 100
      intakeData = {
        calories: Math.round((targets?.calories || 0) * factor),
        protein: Math.round((targets?.protein || 0) * factor),
        carbs: Math.round((targets?.carbs || 0) * factor),
        fat: Math.round((targets?.fat || 0) * factor)
      }
    } else {
      intakeData = {
        calories: parseInt(manualValues.calories) || 0,
        protein: parseInt(manualValues.protein) || 0,
        carbs: parseInt(manualValues.carbs) || 0,
        fat: parseInt(manualValues.fat) || 0
      }
    }

    onSave(intakeData)
  }

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '440px',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #0a0a0a 100%)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: isMobile ? '16px' : '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(245, 158, 11, 0.1)',
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Compact Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
          position: 'relative'
        }}>
          <div style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            Quick Add Intake
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(245, 158, 11, 0.6)',
            fontWeight: '600',
            marginTop: '0.25rem'
          }}>
            Snel macros toevoegen aan vandaag
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: isMobile ? '1rem' : '1.25rem',
              right: isMobile ? '1rem' : '1.25rem',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          {/* Input Type Toggle - Compact */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.625rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => setInputType('percentage')}
              style={{
                padding: '0.75rem',
                background: inputType === 'percentage'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'rgba(245, 158, 11, 0.08)',
                border: inputType === 'percentage'
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid rgba(245, 158, 11, 0.15)',
                borderRadius: '10px',
                color: inputType === 'percentage' ? '#000' : '#f59e0b',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: inputType === 'percentage' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              <Percent size={14} />
              Percentage
            </button>

            <button
              onClick={() => setInputType('exact')}
              style={{
                padding: '0.75rem',
                background: inputType === 'exact'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'rgba(245, 158, 11, 0.08)',
                border: inputType === 'exact'
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid rgba(245, 158, 11, 0.15)',
                borderRadius: '10px',
                color: inputType === 'exact' ? '#000' : '#f59e0b',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: inputType === 'exact' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              <Hash size={14} />
              Exact
            </button>
          </div>

          {/* Percentage Mode - Ultra Compact */}
          {inputType === 'percentage' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.625rem',
                marginBottom: '1rem'
              }}>
                {percentageOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPercentage(option.value)}
                    style={{
                      padding: '0.875rem',
                      background: percentage === option.value
                        ? `linear-gradient(135deg, ${option.color}25 0%, ${option.color}15 100%)`
                        : 'rgba(245, 158, 11, 0.05)',
                      border: percentage === option.value
                        ? `2px solid ${option.color}`
                        : '1px solid rgba(245, 158, 11, 0.15)',
                      borderRadius: '10px',
                      color: percentage === option.value ? option.color : 'rgba(245, 158, 11, 0.6)',
                      fontWeight: '800',
                      fontSize: '1.125rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      boxShadow: percentage === option.value ? `0 4px 16px ${option.color}40` : 'none'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Preview - Compact */}
              {targets && (
                <div style={{
                  padding: '0.875rem',
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: '10px'
                }}>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(245, 158, 11, 0.6)',
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em'
                  }}>
                    Dit wordt toegevoegd
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem'
                  }}>
                    <CompactPreviewItem 
                      label="Calorieën" 
                      value={Math.round((targets.calories || 0) * percentage / 100)} 
                      unit="kcal"
                      color="#f59e0b"
                    />
                    <CompactPreviewItem 
                      label="Eiwit" 
                      value={Math.round((targets.protein || 0) * percentage / 100)} 
                      unit="g"
                      color="#8b5cf6"
                    />
                    <CompactPreviewItem 
                      label="Koolhydraten" 
                      value={Math.round((targets.carbs || 0) * percentage / 100)} 
                      unit="g"
                      color="#ef4444"
                    />
                    <CompactPreviewItem 
                      label="Vetten" 
                      value={Math.round((targets.fat || 0) * percentage / 100)} 
                      unit="g"
                      color="#3b82f6"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Exact Mode - Compact Inputs */}
          {inputType === 'exact' && (
            <div style={{
              display: 'grid',
              gap: '0.75rem'
            }}>
              <CompactInput
                label="Calorieën (kcal)"
                value={manualValues.calories}
                onChange={(value) => setManualValues({ ...manualValues, calories: value })}
                color="#f59e0b"
              />
              <CompactInput
                label="Eiwit (g)"
                value={manualValues.protein}
                onChange={(value) => setManualValues({ ...manualValues, protein: value })}
                color="#8b5cf6"
              />
              <CompactInput
                label="Koolhydraten (g)"
                value={manualValues.carbs}
                onChange={(value) => setManualValues({ ...manualValues, carbs: value })}
                color="#ef4444"
              />
              <CompactInput
                label="Vetten (g)"
                value={manualValues.fat}
                onChange={(value) => setManualValues({ ...manualValues, fat: value })}
                color="#3b82f6"
              />
            </div>
          )}

          {/* Action Buttons - Compact */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginTop: '1.25rem'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '0.875rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                color: '#000',
                fontWeight: '800',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
              }}
            >
              Opslaan
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}

// Compact Preview Item
const CompactPreviewItem = ({ label, value, unit, color }) => (
  <div style={{
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.3)',
    border: `1px solid ${color}33`,
    borderRadius: '6px'
  }}>
    <div style={{
      fontSize: '0.625rem',
      color: `${color}99`,
      fontWeight: '600',
      marginBottom: '0.25rem'
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '0.95rem',
      fontWeight: '800',
      color: color
    }}>
      {value} {unit}
    </div>
  </div>
)

// Compact Input Field
const CompactInput = ({ label, value, onChange, color }) => (
  <div>
    <label style={{
      display: 'block',
      fontSize: '0.7rem',
      fontWeight: '700',
      color: `${color}99`,
      marginBottom: '0.375rem',
      textTransform: 'uppercase',
      letterSpacing: '0.025em'
    }}>
      {label}
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
      style={{
        width: '100%',
        padding: '0.75rem',
        background: 'rgba(0, 0, 0, 0.4)',
        border: `1px solid ${color}33`,
        borderRadius: '8px',
        color: 'white',
        fontSize: '0.95rem',
        fontWeight: '700',
        outline: 'none',
        transition: 'all 0.2s ease'
      }}
      onFocus={(e) => {
        e.target.style.border = `1px solid ${color}`
        e.target.style.boxShadow = `0 0 0 3px ${color}20`
      }}
      onBlur={(e) => {
        e.target.style.border = `1px solid ${color}33`
        e.target.style.boxShadow = 'none'
      }}
    />
  </div>
)
