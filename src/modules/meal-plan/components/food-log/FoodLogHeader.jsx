// src/modules/meal-plan/components/food-log/FoodLogHeader.jsx
// Compacte kop: titel in bold wit + de drie tabbladen. Actief tabblad is wit
// in plaats van goud, net als de rest van de voedingsschermen.
// Macros stat-bar removed — that info already lives in RemainingPill on
// the meal page (the screen the user just came from).

import React from 'react'

export default function FoodLogHeader({ activeTab, onTabChange, isMobile }) {
  const tabs = [
    { id: 'search', label: 'Zoeken' },
    { id: 'quick',  label: 'Snel' },
    { id: 'meals',  label: 'Maaltijden' }
  ]

  return (
    <div style={{ flexShrink: 0 }}>
      {/* ── Compact centered title ── */}
      <div style={{
        padding: isMobile ? '0.625rem 3rem 0.4rem' : '0.75rem 4rem 0.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: isMobile ? '1.15rem' : '1.3rem',
          fontWeight: 900, color: '#fff', letterSpacing: '-0.025em'
        }}>
          Voeding loggen
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                flex: 1, padding: isMobile ? '0.5rem 0' : '0.625rem 0',
                background: 'transparent', border: 'none',
                borderBottom: isActive ? '2px solid #fff' : '2px solid transparent',
                color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                fontSize: isMobile ? '0.82rem' : '0.88rem',
                fontWeight: isActive ? 900 : 700,
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '38px', transition: 'all 0.15s ease',
                letterSpacing: '-0.005em',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
