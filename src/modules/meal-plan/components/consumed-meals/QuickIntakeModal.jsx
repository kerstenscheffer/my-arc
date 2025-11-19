// src/modules/meal-plan/components/consumed-meals/QuickIntakeModal.jsx
// ✅ PREMIUM v1.0 - Quick Intake Modal
// 🎯 Fast way to log macros without full meal details
import React, { useState } from 'react'
import { Zap, X } from 'lucide-react'

export default function QuickIntakeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isMobile 
}) {
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  if (!isOpen) return null

  const handleSave = () => {
    if (!calories && !protein && !carbs && !fat) {
      alert('Vul minimaal één macro waarde in')
      return
    }

    onSave({
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0
    })

    // Reset form
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '500px',
          background: '#0a0a0a',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: isMobile ? '16px' : '20px',
          padding: isMobile ? '1.25rem' : '1.5rem',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Top glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          borderRadius: '20px 20px 0 0'
        }} />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: isMobile ? '0.875rem' : '1rem',
            right: isMobile ? '0.875rem' : '1rem',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
          }}>
            <Zap 
              size={isMobile ? 20 : 22} 
              color="#10b981"
              style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
            />
          </div>
          <div>
            <div style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '800',
              color: '#10b981',
              letterSpacing: '-0.01em'
            }}>
              Quick Intake
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600'
            }}>
              Voeg snel macro's toe
            </div>
          </div>
        </div>

        {/* Input Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '0.875rem' : '1rem',
          marginBottom: '1.25rem'
        }}>
          {/* Calories Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              marginBottom: '0.375rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Calorieën
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                color: '#10b981',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.4)'
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.2)'
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)'
              }}
            />
          </div>

          {/* Protein Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              marginBottom: '0.375rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Eiwit (g)
            </label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '10px',
                color: '#8b5cf6',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.4)'
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.2)'
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.06)'
              }}
            />
          </div>

          {/* Carbs Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              marginBottom: '0.375rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Koolhydraten (g)
            </label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.4)'
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'
              }}
            />
          </div>

          {/* Fat Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              marginBottom: '0.375rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Vetten (g)
            </label>
            <input
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '10px',
                color: '#3b82f6',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.4)'
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.2)'
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.06)'
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.875rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '700',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '700',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.4)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Opslaan
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
