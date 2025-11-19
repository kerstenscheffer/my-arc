// src/modules/meal-plan/components/LogMealModal.jsx
// ✅ PREMIUM v4.0 - Extracted Quick Intake Modal with enhanced styling
import React, { useState } from 'react'

export default function LogMealModal({ 
  isOpen, 
  onClose, 
  onSave, 
  targets, 
  isMobile 
}) {
  const [selectedType, setSelectedType] = useState('percentage')
  const [percentage, setPercentage] = useState(100)
  const [exactValues, setExactValues] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })
  
  const percentageOptions = [
    { label: '100%', value: 100, color: '#10b981', emoji: '💪' },
    { label: '80%', value: 80, color: '#fbbf24', emoji: '👍' },
    { label: '60%', value: 60, color: '#f59e0b', emoji: '🤙' },
    { label: '40%', value: 40, color: '#f97316', emoji: '✌️' }
  ]
  
  const handleSave = () => {
    if (selectedType === 'percentage') {
      const intakeData = {
        calories: Math.round((targets?.calories || 0) * (percentage / 100)),
        protein: Math.round((targets?.protein || 0) * (percentage / 100)),
        carbs: Math.round((targets?.carbs || 0) * (percentage / 100)),
        fat: Math.round((targets?.fat || 0) * (percentage / 100))
      }
      onSave(intakeData)
    } else {
      onSave({
        calories: parseInt(exactValues.calories) || 0,
        protein: parseInt(exactValues.protein) || 0,
        carbs: parseInt(exactValues.carbs) || 0,
        fat: parseInt(exactValues.fat) || 0
      })
    }
  }

  if (!isOpen) return null

  return (
    <div 
      onClick={onClose} 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: isMobile ? '1rem' : '1.5rem',
        animation: 'fadeIn 0.3s ease',
        overflowY: 'auto'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: isMobile ? '20px' : '24px',
          padding: isMobile ? '1.5rem' : '2rem',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 30px 80px rgba(245, 158, 11, 0.3), 0 0 0 1px rgba(245, 158, 11, 0.1)',
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Floating gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-20%',
          width: '140%',
          height: '140%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'float 8s ease-in-out infinite'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-30%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'float 10s ease-in-out infinite reverse'
        }} />
        
        {/* Top glow bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.6)'
        }} />
        
        {/* Content - relative to float above gradients */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <h3 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
            textShadow: '0 0 30px rgba(245, 158, 11, 0.3)'
          }}>
            Quick Intake Log
          </h3>
          
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '1.75rem',
            fontWeight: '500'
          }}>
            Voeg snel je maaltijd toe aan je dagelijkse tracking
          </p>
          
          {/* Type Toggle */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '1.75rem',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '0.5rem',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <button
              onClick={() => setSelectedType('percentage')}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: selectedType === 'percentage' 
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)' 
                  : 'transparent',
                border: selectedType === 'percentage'
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid transparent',
                borderRadius: '10px',
                color: selectedType === 'percentage' ? '#f59e0b' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: '800',
                fontSize: isMobile ? '0.9rem' : '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: selectedType === 'percentage' 
                  ? '0 4px 16px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : 'none',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                if (selectedType !== 'percentage') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType !== 'percentage') {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              📊 Percentage
            </button>
            <button
              onClick={() => setSelectedType('exact')}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: selectedType === 'exact' 
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)' 
                  : 'transparent',
                border: selectedType === 'exact'
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid transparent',
                borderRadius: '10px',
                color: selectedType === 'exact' ? '#f59e0b' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: '800',
                fontSize: isMobile ? '0.9rem' : '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: selectedType === 'exact' 
                  ? '0 4px 16px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : 'none',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                if (selectedType !== 'exact') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType !== 'exact') {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              ⚡ Exacte Waarden
            </button>
          </div>
          
          {/* Content Area */}
          {selectedType === 'percentage' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: isMobile ? '0.875rem' : '1rem'
            }}>
              {percentageOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPercentage(option.value)}
                  style={{
                    padding: isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem',
                    background: percentage === option.value 
                      ? `linear-gradient(135deg, ${option.color}25 0%, ${option.color}10 100%)`
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    border: percentage === option.value 
                      ? `2px solid ${option.color}70`
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: isMobile ? '14px' : '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: percentage === option.value 
                      ? `0 8px 24px ${option.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                      : '0 2px 8px rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                    if (percentage !== option.value) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    if (percentage !== option.value) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)'
                    }
                  }}
                  onTouchStart={(e) => {
                    if (isMobile) e.currentTarget.style.transform = 'scale(0.96)'
                  }}
                  onTouchEnd={(e) => {
                    if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {/* Top shine */}
                  {percentage === option.value && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '40%',
                      background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
                      pointerEvents: 'none'
                    }} />
                  )}
                  
                  <div style={{
                    fontSize: isMobile ? '2rem' : '2.5rem'
                  }}>
                    {option.emoji}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '1.75rem',
                    fontWeight: '900',
                    color: percentage === option.value ? option.color : 'rgba(255, 255, 255, 0.6)',
                    textShadow: percentage === option.value ? `0 0 20px ${option.color}60` : 'none',
                    transition: 'all 0.3s ease',
                    letterSpacing: '-0.02em'
                  }}>
                    {option.label}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontWeight: '700'
                  }}>
                    {Math.round((targets?.calories || 0) * (option.value / 100))} kcal
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: isMobile ? '0.875rem' : '1rem'
            }}>
              {['calories', 'protein', 'carbs', 'fat'].map((field) => (
                <div key={field} style={{ position: 'relative' }}>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(245, 158, 11, 0.8)',
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {field === 'calories' ? '🔥 Calorieën' : 
                     field === 'protein' ? '💪 Eiwitten (g)' : 
                     field === 'carbs' ? '⚡ Koolhydraten (g)' : 
                     '💧 Vetten (g)'}
                  </label>
                  <input
                    type="number"
                    value={exactValues[field]}
                    onChange={(e) => setExactValues(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: isMobile ? '1rem' : '1.125rem',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: isMobile ? '1rem' : '1.125rem',
                      fontWeight: '700',
                      outline: 'none',
                      minHeight: '44px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)'
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.875rem' : '1rem',
            marginTop: isMobile ? '1.75rem' : '2rem'
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: isMobile ? '1rem' : '1.125rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '800',
                fontSize: isMobile ? '0.9rem' : '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: isMobile ? '1rem' : '1.125rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '800',
                fontSize: isMobile ? '0.9rem' : '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
              onTouchStart={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(0.96)'
              }}
              onTouchEnd={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              💾 Opslaan
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
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(10px, -10px) rotate(2deg); }
          66% { transform: translate(-10px, 10px) rotate(-2deg); }
        }
      `}</style>
    </div>
  )
}
