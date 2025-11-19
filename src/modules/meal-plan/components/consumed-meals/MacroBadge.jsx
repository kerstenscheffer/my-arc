// src/modules/meal-plan/components/consumed-meals/MacroBadge.jsx
// 🎯 SHARED MACRO BADGE - Reusable macro display component
// Used in: ConsumedMealCard, MacroSummaryCards

import React from 'react'

export default function MacroBadge({ 
  icon: Icon, 
  value, 
  label, 
  color, 
  isMobile,
  size = 'default' // 'small' | 'default' | 'large'
}) {
  
  const sizeConfig = {
    small: {
      padding: isMobile ? '0.2rem 0.3rem' : '0.25rem 0.375rem',
      iconSize: isMobile ? 9 : 10,
      fontSize: isMobile ? '0.65rem' : '0.7rem',
      labelSize: '0.6rem'
    },
    default: {
      padding: isMobile ? '0.25rem 0.375rem' : '0.25rem 0.5rem',
      iconSize: isMobile ? 10 : 11,
      fontSize: isMobile ? '0.7rem' : '0.75rem',
      labelSize: '0.65rem'
    },
    large: {
      padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 0.625rem',
      iconSize: isMobile ? 12 : 14,
      fontSize: isMobile ? '0.85rem' : '0.9rem',
      labelSize: '0.75rem'
    }
  }
  
  const config = sizeConfig[size]
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: config.padding,
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '6px',
      border: `1px solid ${color}33`,
      fontSize: config.fontSize,
      transition: 'all 0.2s ease'
    }}>
      <Icon size={config.iconSize} color={color} />
      <span style={{
        fontWeight: '700',
        color: color
      }}>
        {Math.round(value || 0)}
      </span>
      <span style={{
        color: `${color}99`,
        fontSize: config.labelSize,
        fontWeight: '600'
      }}>
        {label}
      </span>
    </div>
  )
}
