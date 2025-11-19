// src/modules/meal-plan/components/ViewConsumedMealsButton.jsx
// ✅ PREMIUM v6.0 - ORANGE THEME 🔥
// 🎯 WorkoutPhotoSlider Norm Applied - Full Glassmorphic
import React, { useState } from 'react'
import { Eye } from 'lucide-react'
import ConsumedMealsView from './ConsumedMealsView'

export default function ViewConsumedMealsButton({ 
  client, 
  db,
  onMealLogged,
  onQuickIntake,
  targets
}) {
  const isMobile = window.innerWidth <= 768
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          // Layout
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.625rem' : '0.75rem',
          padding: isMobile ? '0.875rem' : '1rem',
          width: '100%',
          
          // Background & Border - ORANGE THEME 🔥
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: isMobile ? '12px' : '14px',
          
          // Effects
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 16px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          
          // Interaction
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px',
          
          // Position for overlay
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)'
          e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)'
          e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        {/* Top shine overlay - PREMIUM */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Top accent line - ORANGE */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
          opacity: 0.6,
          zIndex: 2
        }} />

        {/* Icon container - ORANGE GLOW 🔥 */}
        <div style={{
          width: isMobile ? '40px' : '44px',
          height: isMobile ? '40px' : '44px',
          borderRadius: isMobile ? '10px' : '12px',
          background: 'rgba(249, 115, 22, 0.2)',
          border: '1px solid rgba(249, 115, 22, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 16px rgba(249, 115, 22, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 2
        }}>
          <Eye 
            size={isMobile ? 18 : 20} 
            color="#f97316"
            strokeWidth={2.5}
            style={{ 
              filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.8))'
            }}
          />
        </div>

        {/* Text content - ORANGE ACCENT */}
        <div style={{ 
          flex: 1, 
          textAlign: 'left',
          position: 'relative',
          zIndex: 2,
          minWidth: 0
        }}>
          <div style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '800',
            color: '#f97316',
            marginBottom: '0.1rem',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 0 12px rgba(249, 115, 22, 0.4)'
          }}>
            Gegeten maaltijden
          </div>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '600',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            Deze week bekijken
          </div>
        </div>

        {/* Arrow - ORANGE */}
        <div style={{
          color: '#f97316',
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          position: 'relative',
          zIndex: 2,
          transition: 'transform 0.3s ease',
          flexShrink: 0,
          textShadow: '0 0 8px rgba(249, 115, 22, 0.6)'
        }}>
          →
        </div>
      </button>

      {/* MODAL - TRUE FULL SCREEN WITH SCROLL */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {/* Close button - Floating & Sticky - ORANGE */}
          <button
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              top: isMobile ? '1rem' : '1.5rem',
              right: isMobile ? '1rem' : '1.5rem',
              width: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.4)',
              color: '#f97316',
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              zIndex: 10001,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              minHeight: '44px',
              minWidth: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.15) 100%)'
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
            }}
          >
            ×
          </button>

          {/* Content - Full Screen No Padding */}
          <ConsumedMealsView
            client={client}
            db={db}
            isCoachView={false}
            onMealLogged={onMealLogged}
            onQuickIntake={onQuickIntake}
            targets={targets}
          />
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  )
}

