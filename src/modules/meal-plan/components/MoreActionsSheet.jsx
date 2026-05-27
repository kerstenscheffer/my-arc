// src/modules/meal-plan/components/MoreActionsSheet.jsx
// Bottom sheet opened from the meal page header "Meer" icon.
// Contains: supplements, documents, and plan-mode-only items
// (plan bewerken via week planner, coach strategy wizard).

import React, { useEffect } from 'react'
import { Pill, FileText, Calendar, Wand2, ChevronRight, X } from 'lucide-react'

const G = {
  primary:    '#FFD700',
  bg:         'rgba(255, 215, 0, 0.06)',
  border:     'rgba(255, 215, 0, 0.18)',
  textDim:    'rgba(255, 255, 255, 0.5)',
  textFaint:  'rgba(255, 255, 255, 0.3)',
}

const Row = ({ children, title, subtitle, onClick, accent = G.primary }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '0.875rem',
      padding: '0.875rem 1rem',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      textAlign: 'left',
      minHeight: '60px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}
  >
    <div style={{
      width: '36px', height: '36px',
      borderRadius: '10px',
      background: 'rgba(255, 215, 0, 0.08)',
      border: `1px solid ${G.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      color: accent,
    }}>
      {children}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: '0.95rem',
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1.2,
        marginBottom: '2px',
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '0.7rem',
          color: G.textFaint,
          lineHeight: 1.2,
        }}>
          {subtitle}
        </div>
      )}
    </div>
    <ChevronRight size={16} color={G.textFaint} />
  </button>
)

export default function MoreActionsSheet({
  isOpen, onClose, isPlanMode,
  onOpenSupplements, onOpenDocuments,
  onOpenPlanEdit, onOpenCoachWizard,
  isMobile: propMobile,
}) {
  const isMobile = propMobile ?? window.innerWidth <= 768

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'mr-fade 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#0f0f0f',
          borderTop: `1px solid ${G.border}`,
          borderTopLeftRadius: isMobile ? '20px' : '20px',
          borderTopRightRadius: isMobile ? '20px' : '20px',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
          maxHeight: '80vh',
          overflowY: 'auto',
          animation: 'mr-slide 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Grab handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '0.625rem 0 0.5rem',
        }}>
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(255, 255, 255, 0.15)',
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.25rem 1rem 0.875rem',
          borderBottom: `1px solid ${G.border}`,
        }}>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            color: G.primary,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Meer
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              width: '30px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: G.textDim,
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Items — universal */}
        <Row
          title="Supplement plan"
          subtitle="Bekijk supplement advies"
          onClick={onOpenSupplements}
        >
          <Pill size={16} />
        </Row>
        <Row
          title="Documenten"
          subtitle="PDFs van je coach"
          onClick={onOpenDocuments}
        >
          <FileText size={16} />
        </Row>

        {/* Plan-mode-only section */}
        {isPlanMode && (
          <>
            <div style={{
              padding: '0.75rem 1rem 0.4rem',
              fontSize: '0.55rem',
              fontWeight: 800,
              color: G.textFaint,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Plan beheer
            </div>
            <Row
              title="Week planner"
              subtitle="Bekijk en bewerk je weekplan"
              onClick={onOpenPlanEdit}
            >
              <Calendar size={16} />
            </Row>
            <Row
              title="Coach strategy"
              subtitle="Plan setup wizard"
              onClick={onOpenCoachWizard}
            >
              <Wand2 size={16} />
            </Row>
          </>
        )}

        {/* Bottom spacing for safe area */}
        <div style={{ height: '0.5rem' }} />

        <style>{`
          @keyframes mr-fade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes mr-slide {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  )
}
