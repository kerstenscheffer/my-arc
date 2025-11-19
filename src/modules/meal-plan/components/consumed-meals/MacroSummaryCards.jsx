// src/modules/meal-plan/components/consumed-meals/MacroSummaryCards.jsx
// 🎯 MACRO SUMMARY CARDS - Daily totals with progress tracking
// Props: dayTotals, targets, isMobile

import React from 'react'
import { Flame, Target, Zap, Droplets } from 'lucide-react'
import MacroBadge from './MacroBadge'

export default function MacroSummaryCards({
  dayTotals,
  targets,
  isMobile
}) {
  
  // Calculate percentages
  const caloriesPercent = targets?.calories 
    ? Math.round((dayTotals.calories / targets.calories) * 100)
    : 0
    
  const proteinPercent = targets?.protein
    ? Math.round((dayTotals.protein / targets.protein) * 100)
    : 0
    
  const carbsPercent = targets?.carbs
    ? Math.round((dayTotals.carbs / targets.carbs) * 100)
    : 0
    
  const fatPercent = targets?.fat
    ? Math.round((dayTotals.fat / targets.fat) * 100)
    : 0
  
  // Get color based on percentage
  const getProgressColor = (percent, baseColor) => {
    if (percent >= 95) return '#10b981' // Green - perfect
    if (percent >= 80) return baseColor // Base color - good
    if (percent >= 50) return '#f59e0b' // Orange - okay
    return '#ef4444' // Red - low
  }
  
  const macros = [
    {
      icon: Flame,
      label: 'Calorieën',
      value: dayTotals.calories,
      target: targets?.calories || 0,
      percent: caloriesPercent,
      color: '#f59e0b',
      unit: 'kcal'
    },
    {
      icon: Target,
      label: 'Eiwit',
      value: dayTotals.protein,
      target: targets?.protein || 0,
      percent: proteinPercent,
      color: '#8b5cf6',
      unit: 'g'
    },
    {
      icon: Zap,
      label: 'Koolhydraten',
      value: dayTotals.carbs,
      target: targets?.carbs || 0,
      percent: carbsPercent,
      color: '#ef4444',
      unit: 'g'
    },
    {
      icon: Droplets,
      label: 'Vetten',
      value: dayTotals.fat,
      target: targets?.fat || 0,
      percent: fatPercent,
      color: '#3b82f6',
      unit: 'g'
    }
  ]
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: isMobile ? '0.625rem' : '0.75rem',
      marginBottom: '1rem'
    }}>
      {macros.map((macro) => {
        const progressColor = getProgressColor(macro.percent, macro.color)
        
        return (
          <div
            key={macro.label}
            style={{
              background: `${macro.color}08`,
              border: `1px solid ${macro.color}20`,
              borderRadius: '10px',
              padding: isMobile ? '0.75rem 0.625rem' : '0.875rem 0.75rem',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Background gradient */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${macro.color}05 0%, transparent 100%)`,
              opacity: 0.5
            }} />
            
            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Icon + Label */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: '0.5rem'
              }}>
                <macro.icon 
                  size={isMobile ? 14 : 16} 
                  color={macro.color}
                  style={{
                    filter: `drop-shadow(0 0 4px ${macro.color}40)`
                  }}
                />
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '700',
                  color: `${macro.color}cc`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}>
                  {macro.label}
                </div>
              </div>
              
              {/* Values */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.25rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  color: progressColor,
                  lineHeight: 1
                }}>
                  {Math.round(macro.value)}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontWeight: '600'
                }}>
                  / {macro.target} {macro.unit}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '3px',
                overflow: 'hidden',
                marginBottom: '0.375rem',
                border: `1px solid ${macro.color}15`
              }}>
                <div style={{
                  width: `${Math.min(macro.percent, 100)}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${progressColor} 0%, ${progressColor}cc 100%)`,
                  borderRadius: '3px',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: macro.percent >= 80 ? `0 0 8px ${progressColor}60` : 'none'
                }} />
              </div>
              
              {/* Percentage */}
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '700',
                color: progressColor,
                textAlign: 'right'
              }}>
                {macro.percent}%
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
