// src/modules/ai-meal-generator/tabs/plan-analyzer/DayMacroBar.jsx
// v2.0 — Compacte header bar, past in nieuwe sidebar layout

import React from 'react'

export default function DayMacroBar({ dayTotals, targets, isMobile }) {
  const m = isMobile
  if (!dayTotals || !targets) return null

  const cal   = dayTotals.kcal || dayTotals.calories || 0
  const prot  = dayTotals.protein || 0
  const carbs = dayTotals.carbs || 0
  const fat   = dayTotals.fat || 0

  const stats = [
    { label: 'KCAL',  value: Math.round(cal),   target: targets.calories, unit: '',  color: '#FFD700' },
    { label: 'EIWIT', value: Math.round(prot),  target: targets.protein,  unit: 'g', color: '#10b981' },
    { label: 'CARBS', value: Math.round(carbs), target: targets.carbs,    unit: 'g', color: '#3b82f6' },
    { label: 'VET',   value: Math.round(fat),   target: targets.fat,      unit: 'g', color: '#f59e0b' }
  ]

  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,215,0,0.015)'
    }}>
      {stats.map((s, i) => {
        const pct      = s.target ? (s.value / s.target) * 100 : 0
        const pctColor = pct < 85 ? '#ef4444' : pct > 115 ? '#f59e0b' : '#10b981'
        const diff     = s.value - (s.target || 0)
        const diffStr  = diff >= 0 ? `+${diff}` : `${diff}`

        return (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center',
            padding: m ? '0.4rem 0.1rem' : '0.5rem 0.25rem',
            borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            position: 'relative'
          }}>
            <div style={{ fontSize: m ? '0.38rem' : '0.42rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>
              {s.label}
            </div>
            <div style={{ fontSize: m ? '1rem' : '1.1rem', fontWeight: 800, color: pctColor, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {s.value}<span style={{ fontSize: '0.4rem', fontWeight: 500, opacity: 0.4, marginLeft: '0.05rem' }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: '0.38rem', fontWeight: 600, color: 'rgba(255,255,255,0.12)', marginTop: '0.08rem' }}>
              {s.target || 0}<span style={{ marginLeft: '0.15rem', fontWeight: 700, color: pctColor, opacity: 0.6 }}>{diffStr}</span>
            </div>
            {/* Progress bar */}
            <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pctColor, borderRadius: '1px', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
