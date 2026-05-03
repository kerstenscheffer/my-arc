// src/modules/meal-plan/components/ViewConsumedMealsButton.jsx
// 🎯 v2.0 - Clean neutral trigger + full screen modal
import React, { useState } from 'react'
import { Eye, ChevronRight } from 'lucide-react'
import ConsumedMealsView from './ConsumedMealsView'

export default function ViewConsumedMealsButton({ 
  client, db, onMealLogged, onQuickIntake, targets
}) {
  const isMobile = window.innerWidth <= 768
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {/* Trigger — flush row like other sections */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          width: '100%',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem',
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 0,
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px',
          textAlign: 'left'
        }}
      >
        <div style={{
          width: '24px', height: '24px',
          borderRadius: '7px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Eye size={12} color="rgba(255, 255, 255, 0.4)" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '0.5rem' : '0.55rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.25)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1,
            marginBottom: '0.15rem'
          }}>
            Voeding log
          </div>
          <div style={{
            fontSize: isMobile ? '0.82rem' : '0.9rem',
            fontWeight: '700',
            color: '#fff',
            letterSpacing: '-0.01em'
          }}>
            Gegeten maaltijden bekijken
          </div>
        </div>

        <ChevronRight size={16} color="rgba(255, 255, 255, 0.2)" style={{ flexShrink: 0 }} />
      </button>

      {/* Full screen modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#0a0a0a',
          zIndex: 9999,
          animation: 'cvFadeIn 0.2s ease',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          <button
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              top: isMobile ? '0.75rem' : '1rem',
              right: isMobile ? '0.75rem' : '1rem',
              width: '36px', height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '1.25rem',
              fontWeight: '300',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10001,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ×
          </button>

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
        @keyframes cvFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  )
}
