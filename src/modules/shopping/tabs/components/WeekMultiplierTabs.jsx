// src/modules/shopping/tabs/components/WeekMultiplierTabs.jsx - V3 COMPACT INLINE
import React from 'react'

export default function WeekMultiplierTabs({ selectedWeeks, onSelect, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.25rem'
    }}>
      {[1, 2, 3].map(weeks => {
        const isActive = selectedWeeks === weeks
        return (
          <button
            key={weeks}
            onClick={() => onSelect(weeks)}
            style={{
              padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.625rem',
              background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              border: isActive
                ? '1px solid rgba(16, 185, 129, 0.25)'
                : '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '6px',
              color: isActive ? '#10b981' : 'rgba(255, 255, 255, 0.35)',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: '700',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease',
              outline: 'none',
              minHeight: '28px',
              whiteSpace: 'nowrap'
            }}
          >
            {weeks}w
          </button>
        )
      })}
    </div>
  )
}
