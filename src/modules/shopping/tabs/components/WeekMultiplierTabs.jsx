// src/modules/shopping/tabs/components/WeekMultiplierTabs.jsx
//
// Multi-week multiplier: maakt duidelijk dat je voor 1, 2 of 3 weken
// vooruit boodschappen kunt doen (= bedragen + hoeveelheden × N). Was
// voorheen mini 1w/2w/3w tabs die niemand zag — nu een prominente rij
// met label en grotere knoppen.

import React from 'react'
import { ShoppingBag } from 'lucide-react'

export default function WeekMultiplierTabs({ selectedWeeks, onSelect, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '0.85rem 1rem' : '1rem 1.5rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        fontWeight: 800, color: 'rgba(255,255,255,0.55)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: '0.55rem',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <ShoppingBag size={isMobile ? 12 : 13} strokeWidth={2.4} />
        Boodschappen voor
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { weeks: 1, label: '1 week',  sub: 'standaard' },
          { weeks: 2, label: '2 weken', sub: 'in één keer' },
          { weeks: 3, label: '3 weken', sub: 'grote ronde' },
        ].map(({ weeks, label, sub }) => {
          const active = selectedWeeks === weeks
          return (
            <button
              key={weeks}
              onClick={() => onSelect(weeks)}
              style={{
                flex: 1,
                padding: isMobile ? '0.7rem 0.5rem' : '0.85rem 0.7rem',
                background: active
                  ? 'linear-gradient(135deg, rgba(255,215,0,0.18) 0%, rgba(255,215,0,0.06) 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${active ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12,
                color: active ? '#FFD700' : '#fff',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.15s ease, border-color 0.15s ease',
                minHeight: 60,
                boxShadow: active ? '0 4px 12px rgba(255,215,0,0.15)' : 'none',
              }}
            >
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: 900,
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}>
                {label}
              </div>
              <div style={{
                fontSize: isMobile ? '0.62rem' : '0.66rem',
                fontWeight: 700,
                color: active ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                {sub}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
