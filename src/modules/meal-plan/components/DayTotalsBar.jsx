// src/modules/meal-plan/components/DayTotalsBar.jsx
// 📊 DAY TOTALS BAR v5.0 - Ultra Compact Progress Display
import React from 'react'
import { Flame, Target, Zap, Droplets } from 'lucide-react'

export default function DayTotalsBar({ totals, targets, isMobile }) {
  const calculatePercentage = (current, target) => {
    if (!target) return 0
    return Math.min((current / target) * 100, 100)
  }

  const macros = [
    { 
      icon: Flame, 
      label: 'Calorieën', 
      current: totals.calories, 
      target: targets?.calories || 0, 
      color: '#f59e0b',
      unit: 'kcal'
    },
    { 
      icon: Target, 
      label: 'Eiwit', 
      current: totals.protein, 
      target: targets?.protein || 0, 
      color: '#8b5cf6',
      unit: 'g'
    },
    { 
      icon: Zap, 
      label: 'Koolhydraten', 
      current: totals.carbs, 
      target: targets?.carbs || 0, 
      color: '#ef4444',
      unit: 'g'
    },
    { 
      icon: Droplets, 
      label: 'Vetten', 
      current: totals.fat, 
      target: targets?.fat || 0, 
      color: '#3b82f6',
      unit: 'g'
    }
  ]

  return (
    <div style={{
      padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%)',
      borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
      backdropFilter: 'blur(20px)'
    }}>
      {/* Header */}
      <div style={{
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        fontWeight: '700',
        color: 'rgba(245, 158, 11, 0.7)',
        marginBottom: '0.625rem',
        letterSpacing: '0.025em',
        textTransform: 'uppercase'
      }}>
        Dag Totalen
      </div>

      {/* Compact Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.625rem' : '0.75rem'
      }}>
        {macros.map((macro) => {
          const percentage = calculatePercentage(macro.current, macro.target)
          const isComplete = percentage >= 100

          return (
            <div 
              key={macro.label}
              style={{
                background: `linear-gradient(135deg, ${macro.color}15 0%, ${macro.color}08 100%)`,
                border: `1px solid ${macro.color}33`,
                borderRadius: '8px',
                padding: isMobile ? '0.625rem' : '0.75rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Progress background */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: `${percentage}%`,
                height: '3px',
                background: macro.color,
                opacity: 0.4,
                transition: 'width 0.5s ease'
              }} />

              {/* Icon + Label Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: '0.375rem'
              }}>
                <macro.icon 
                  size={isMobile ? 12 : 14} 
                  color={macro.color}
                  style={{
                    filter: `drop-shadow(0 0 4px ${macro.color}66)`
                  }}
                />
                <div style={{
                  fontSize: isMobile ? '0.625rem' : '0.675rem',
                  fontWeight: '700',
                  color: macro.color,
                  opacity: 0.8,
                  letterSpacing: '0.02em'
                }}>
                  {macro.label}
                </div>
              </div>

              {/* Values Row */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.25rem'
              }}>
                <span style={{
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '800',
                  color: 'white'
                }}>
                  {Math.round(macro.current)}
                </span>
                <span style={{
                  fontSize: isMobile ? '0.625rem' : '0.675rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontWeight: '600'
                }}>
                  / {Math.round(macro.target)} {macro.unit}
                </span>
              </div>

              {/* Percentage Badge */}
              {macro.target > 0 && (
                <div style={{
                  position: 'absolute',
                  top: isMobile ? '0.5rem' : '0.625rem',
                  right: isMobile ? '0.5rem' : '0.625rem',
                  padding: '0.125rem 0.375rem',
                  background: isComplete 
                    ? 'rgba(16, 185, 129, 0.2)'
                    : `${macro.color}20`,
                  border: isComplete
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : `1px solid ${macro.color}33`,
                  borderRadius: '4px',
                  fontSize: '0.625rem',
                  fontWeight: '800',
                  color: isComplete ? '#10b981' : macro.color
                }}>
                  {Math.round(percentage)}%
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
