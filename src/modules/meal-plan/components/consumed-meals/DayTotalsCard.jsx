// src/modules/meal-plan/components/consumed-meals/DayTotalsCard.jsx
// ✅ PREMIUM v1.0 - Day Totals Display
// 🎯 Shows total macros consumed for the day with progress vs targets
import React from 'react'
import { Flame, Target, Zap, Droplets } from 'lucide-react'

export default function DayTotalsCard({ dayTotals, targets, isMobile }) {
  const macros = [
    { 
      icon: Flame, 
      label: 'Calorieën', 
      value: dayTotals.calories, 
      target: targets?.calories,
      unit: 'kcal',
      color: '#10b981'
    },
    { 
      icon: Target, 
      label: 'Eiwit', 
      value: dayTotals.protein, 
      target: targets?.protein,
      unit: 'g',
      color: '#8b5cf6'
    },
    { 
      icon: Zap, 
      label: 'Koolhydraten', 
      value: dayTotals.carbs, 
      target: targets?.carbs,
      unit: 'g',
      color: '#ef4444'
    },
    { 
      icon: Droplets, 
      label: 'Vetten', 
      value: dayTotals.fat, 
      target: targets?.fat,
      unit: 'g',
      color: '#3b82f6'
    }
  ]

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '14px',
      padding: isMobile ? '1rem' : '1.25rem',
      marginBottom: isMobile ? '1rem' : '1.25rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top glow line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
        opacity: 0.6
      }} />

      {/* Header */}
      <div style={{
        fontSize: isMobile ? '0.8rem' : '0.875rem',
        fontWeight: '700',
        color: '#10b981',
        marginBottom: isMobile ? '0.875rem' : '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Totaal vandaag
      </div>

      {/* Macro Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '0.75rem' : '0.875rem'
      }}>
        {macros.map((macro) => {
          const percentage = macro.target 
            ? Math.min(100, (macro.value / macro.target) * 100)
            : 0
          
          return (
            <div
              key={macro.label}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(8px)',
                borderRadius: '10px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                border: `1px solid ${macro.color}33`
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  <macro.icon size={isMobile ? 14 : 16} color={macro.color} />
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '600'
                  }}>
                    {macro.label}
                  </span>
                </div>
                
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontWeight: '600'
                }}>
                  {macro.target ? `${Math.round(percentage)}%` : ''}
                </div>
              </div>

              {/* Values */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.25rem',
                marginBottom: macro.target ? '0.5rem' : 0
              }}>
                <span style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  color: macro.color
                }}>
                  {Math.round(macro.value)}
                </span>
                {macro.target && (
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontWeight: '600'
                  }}>
                    / {Math.round(macro.target)} {macro.unit}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {macro.target && (
                <div style={{
                  height: '6px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  border: '1px solid rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${macro.color} 0%, ${macro.color}dd 100%)`,
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 10px ${macro.color}66`
                  }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
