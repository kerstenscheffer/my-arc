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
    { label: 'Totaal', value: `€${totalCost.toFixed(0)}`, color: '#10b981' },
    { label: 'Items', value: totalItems, color: '#fff' },
    { label: 'Klaar', value: `${checkedPercentage}%`, color: checkedPercentage >= 80 ? '#10b981' : checkedPercentage >= 40 ? '#f59e0b' : '#fff' },
    { label: 'Categ.', value: categoriesCount, color: '#fff' }
  ]

  return (
    <div style={{
      display: 'flex',
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      background: 'rgba(16, 185, 129, 0.02)'
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          flex: 1,
          textAlign: 'center',
          padding: isMobile ? '0.375rem 0.125rem' : '0.5rem 0.25rem',
          borderRight: i < stats.length - 1 
            ? '1px solid rgba(255, 255, 255, 0.04)' 
            : 'none'
        }}>
          <div style={{
            fontSize: '0.4rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.2)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.1rem'
          }}>
            {s.label}
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            fontWeight: '800',
            color: s.color,
            lineHeight: 1
          }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}
