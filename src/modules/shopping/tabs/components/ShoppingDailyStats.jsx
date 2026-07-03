// src/modules/shopping/tabs/components/ShoppingDailyStats.jsx - V3 FLUSH STAT BAR
import React from 'react'

export default function ShoppingDailyStats({ 
  totalCost, 
  totalItems, 
  checkedPercentage,
  categoriesCount,
  isMobile 
}) {
  const stats = [
    { label: 'Totaal', value: `€${totalCost.toFixed(0)}`, color: '#FFD700' },
    { label: 'Items', value: totalItems, color: '#fff' },
    { label: 'Klaar', value: `${checkedPercentage}%`, color: checkedPercentage >= 80 ? '#FFD700' : checkedPercentage >= 40 ? '#f59e0b' : '#fff' },
    { label: 'Categ.', value: categoriesCount, color: '#fff' }
  ]

  return (
    <div style={{
      display: 'flex',
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      background: 'rgba(255, 215, 0, 0.02)'
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          flex: 1,
          textAlign: 'center',
          padding: isMobile ? '0.6rem 0.25rem' : '0.7rem 0.4rem',
          borderRight: i < stats.length - 1
            ? '1px solid rgba(255, 255, 255, 0.06)'
            : 'none'
        }}>
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: 900,
            color: s.color,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 4,
          }}>
            {s.value}
          </div>
          <div style={{
            fontSize: isMobile ? '0.62rem' : '0.66rem',
            fontWeight: 800,
            color: 'rgba(255, 255, 255, 0.55)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            lineHeight: 1,
          }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}
