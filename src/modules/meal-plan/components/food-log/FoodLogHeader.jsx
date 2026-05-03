// src/modules/meal-plan/components/food-log/FoodLogHeader.jsx
// 🎯 v2.0 - Tabs: Zoeken (default) | Snel | Mijn Maaltijden
// Recent is merged into SearchTab

import React from 'react'
import { Search, Plus, UtensilsCrossed } from 'lucide-react'

export default function FoodLogHeader({ 
  remaining, targets, consumedToday, activeTab, onTabChange, isMobile 
}) {
  const macros = [
    { key: 'calories', label: 'KCAL', value: remaining?.calories || 0, consumed: consumedToday?.calories || 0, target: targets?.calories || 0 },
    { key: 'protein', label: 'EIWIT', value: remaining?.protein || 0, consumed: consumedToday?.protein || 0, target: targets?.protein || 0, unit: 'g' },
    { key: 'carbs', label: 'KOOLH', value: remaining?.carbs || 0, consumed: consumedToday?.carbs || 0, target: targets?.carbs || 0, unit: 'g' },
    { key: 'fat', label: 'VET', value: remaining?.fat || 0, consumed: consumedToday?.fat || 0, target: targets?.fat || 0, unit: 'g' }
  ]

  const tabs = [
    { id: 'search', label: 'Zoeken', icon: Search },
    { id: 'quick', label: 'Snel', icon: Plus },
    { id: 'meals', label: 'Maaltijden', icon: UtensilsCrossed }
  ]

  return (
    <div style={{ flexShrink: 0 }}>
      {/* ── Title row ── */}
      <div style={{
        padding: isMobile ? '0.875rem 1rem 0.5rem' : '1rem 1.5rem 0.625rem',
        paddingRight: isMobile ? '3.5rem' : '4rem'
      }}>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.15rem',
          fontWeight: '800', color: '#fff', letterSpacing: '-0.02em'
        }}>
          Maaltijd loggen
        </div>
        <div style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          color: 'rgba(255, 255, 255, 0.25)', marginTop: '0.1rem'
        }}>
          Nog te gaan vandaag
        </div>
      </div>

      {/* ── Remaining macros — flush stat bar ── */}
      <div style={{
        display: 'flex',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {macros.map((m, i) => {
          const pct = m.target > 0 ? Math.min(100, Math.round((m.consumed / m.target) * 100)) : 0
          return (
            <div key={m.key} style={{
              flex: 1, textAlign: 'center',
              padding: isMobile ? '0.5rem 0.125rem' : '0.625rem 0.25rem',
              borderRight: i < macros.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
              position: 'relative'
            }}>
              <div style={{
                fontSize: isMobile ? '0.4rem' : '0.45rem', fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.2)', textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: '0.15rem'
              }}>
                {m.label}
              </div>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '800',
                color: m.value > 0 ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                lineHeight: 1, letterSpacing: '-0.02em'
              }}>
                {Math.round(m.value)}
                <span style={{
                  fontSize: isMobile ? '0.4rem' : '0.45rem',
                  fontWeight: '500', opacity: 0.4, marginLeft: '0.05rem'
                }}>
                  {m.unit || ''}
                </span>
              </div>
              <div style={{
                position: 'absolute', bottom: 0, left: '10%', right: '10%',
                height: '2px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '1px'
              }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: pct >= 90 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#f97316',
                  borderRadius: '1px', transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                flex: 1, padding: isMobile ? '0.5rem 0' : '0.625rem 0',
                background: 'transparent', border: 'none',
                borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent',
                color: isActive ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.25rem', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '36px', transition: 'all 0.15s ease'
              }}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
