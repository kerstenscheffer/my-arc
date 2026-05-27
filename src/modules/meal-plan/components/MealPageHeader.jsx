// src/modules/meal-plan/components/MealPageHeader.jsx
// Top of the meal page: title + Free/Plan toggle + history + Meer.
// Gold theme. Mode toggle is purely visual + persists via onModeChange callback.

import React from 'react'
import { History, MoreHorizontal } from 'lucide-react'
import { MEAL_VIEW_MODES } from '../mealViewMode'

const G = {
  primary:    '#FFD700',
  bg:         'rgba(255, 215, 0, 0.06)',
  bgStrong:   'rgba(255, 215, 0, 0.12)',
  border:     'rgba(255, 215, 0, 0.18)',
  textDim:    'rgba(255, 255, 255, 0.45)',
}

const ModeToggle = ({ mode, onChange, disabled }) => {
  const options = [
    { id: MEAL_VIEW_MODES.PLAN, label: 'Plan' },
    { id: MEAL_VIEW_MODES.FREE, label: 'Free' },
  ]
  return (
    <div style={{
      display: 'inline-flex',
      background: G.bg,
      border: `1px solid ${G.border}`,
      borderRadius: '8px',
      padding: '2px',
      opacity: disabled ? 0.5 : 1,
    }}>
      {options.map(opt => {
        const active = mode === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => !disabled && opt.id !== mode && onChange(opt.id)}
            disabled={disabled}
            style={{
              padding: '0.35rem 0.75rem',
              background: active ? G.bgStrong : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: active ? G.primary : G.textDim,
              fontSize: '0.65rem',
              fontWeight: active ? 800 : 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: disabled ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease',
              minHeight: '28px',
              minWidth: '52px',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

const iconBtnStyle = {
  width: '34px',
  height: '34px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: G.bg,
  border: `1px solid ${G.border}`,
  borderRadius: '8px',
  color: G.primary,
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  transition: 'all 0.15s ease',
  flexShrink: 0,
}

export default function MealPageHeader({
  mode, onModeChange, onOpenHistory, onOpenMore,
  modeLoading = false, isMobile: propMobile,
}) {
  const isMobile = propMobile ?? window.innerWidth <= 768
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(10, 10, 10, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${G.border}`,
      paddingTop: 'env(safe-area-inset-top, 0)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '0.5rem 1rem' : '0.625rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
      }}>
        {/* Title */}
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: 800,
          color: G.primary,
          letterSpacing: '-0.02em',
          flexShrink: 0,
        }}>
          Voeding
        </div>

        {/* Mode toggle (center) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ModeToggle mode={mode} onChange={onModeChange} disabled={modeLoading} />
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          {onOpenHistory && (
            <button onClick={onOpenHistory} title="Geschiedenis" aria-label="Geschiedenis" style={iconBtnStyle}>
              <History size={isMobile ? 14 : 15} />
            </button>
          )}
          {onOpenMore && (
            <button onClick={onOpenMore} title="Meer" aria-label="Meer" style={iconBtnStyle}>
              <MoreHorizontal size={isMobile ? 14 : 15} />
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
