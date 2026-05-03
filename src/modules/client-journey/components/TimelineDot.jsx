// ============================================
// 📁 FILE: src/modules/client-journey/components/TimelineDot.jsx
// Reusable dot for week view AND day view
// ============================================
import React from 'react'
import { CheckCircle } from 'lucide-react'
import { G, ACTION_TYPES } from '../journeyConfig'

export default function TimelineDot({ id, label, date, isCurrent, isSelected, isPast, phase, hasActions, actionsComplete, isMobile, actionTypes = [], onClick, onDoubleClick }) {
  const size = isSelected ? (isMobile ? 38 : 42) : isCurrent ? (isMobile ? 30 : 34) : (isMobile ? 24 : 28)
  const phaseColor = phase?.color || G.gold

  return (
    <div
      id={id}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
        flexShrink: 0, cursor: 'pointer', scrollSnapAlign: 'center',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        padding: '0 3px', minWidth: isMobile ? '36px' : '44px'
      }}
    >
      {/* Date label (day view only) */}
      {date && (
        <span style={{
          fontSize: '0.5rem', color: isSelected ? phaseColor : G.textDim,
          fontWeight: isSelected ? '700' : '500', marginBottom: '0.1rem'
        }}>
          {date.getDate()}/{date.getMonth() + 1}
        </span>
      )}

      {/* Dot */}
      <div style={{
        width: `${size}px`, height: `${size}px`, borderRadius: '50%',
        border: isSelected ? `3px solid ${phaseColor}`
          : isCurrent ? `2px solid ${phaseColor}`
          : isPast && actionsComplete ? `2px solid ${G.green}60`
          : isPast ? `2px solid ${phaseColor}40`
          : `2px solid rgba(255,255,255,0.08)`,
        background: isSelected ? `${phaseColor}20`
          : isPast && actionsComplete ? `${G.green}10`
          : isCurrent ? `${phaseColor}10`
          : 'rgba(255,255,255,0.02)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isSelected ? (isMobile ? '0.72rem' : '0.78rem') : (isMobile ? '0.55rem' : '0.6rem'),
        fontWeight: isSelected || isCurrent ? '700' : '500',
        color: isSelected ? G.text
          : isCurrent ? phaseColor
          : isPast && actionsComplete ? G.green
          : isPast ? 'rgba(255,255,255,0.5)'
          : 'rgba(255,255,255,0.2)',
        boxShadow: isSelected ? `0 0 18px ${phaseColor}30` : isCurrent ? `0 0 12px ${phaseColor}15` : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {isPast && actionsComplete ? <CheckCircle size={isSelected ? 16 : 12} /> : label}
      </div>

      {/* Mini action type icons below dot */}
      {actionTypes.length > 0 && (
        <div style={{
          display: 'flex', gap: '1px', alignItems: 'center',
          height: '12px', marginTop: '0.05rem'
        }}>
          {actionTypes.slice(0, 3).map((type, i) => (
            <span key={i} style={{ fontSize: '0.5rem', lineHeight: 1 }}>
              {ACTION_TYPES[type]?.mini || '•'}
            </span>
          ))}
          {actionTypes.length > 3 && (
            <span style={{ fontSize: '0.45rem', color: G.textDim }}>+{actionTypes.length - 3}</span>
          )}
        </div>
      )}

      {/* Tick for actions (no mini icons) */}
      {hasActions && actionTypes.length === 0 && !isSelected && (
        <div style={{
          width: '4px', height: '4px', borderRadius: '50%',
          background: actionsComplete ? G.green : isPast ? `${phaseColor}60` : 'rgba(255,255,255,0.12)'
        }} />
      )}
    </div>
  )
}

// Simple line between dots
export function TimelineLine({ isPast, color, isMobile, width }) {
  return (
    <div style={{
      width: `${width || (isMobile ? 10 : 14)}px`, height: '2px', flexShrink: 0,
      background: isPast ? `${color || G.gold}35` : 'rgba(255,255,255,0.05)',
      borderRadius: '1px'
    }} />
  )
}
