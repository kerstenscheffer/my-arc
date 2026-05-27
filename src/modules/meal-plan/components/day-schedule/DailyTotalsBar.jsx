// src/modules/meal-plan/components/day-schedule/DailyTotalsBar.jsx
// 🎯 v3.0 - MFP style: Gegeten | van Doel | Nog over | progress bar
import React from 'react'

export default function DailyTotalsBar({ dailyTotals, targets, isMobile }) {
  const eaten = dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const goal = targets || { calories: 0, protein: 0, carbs: 0, fat: 0 }

  const macros = [
    { label: 'KCAL', eaten: Math.round(eaten.calories), goal: Math.round(goal.calories) },
    { label: 'EIWIT', eaten: Math.round(eaten.protein), goal: Math.round(goal.protein), unit: 'g' },
    { label: 'KOOLH', eaten: Math.round(eaten.carbs), goal: Math.round(goal.carbs), unit: 'g' },
    { label: 'VET', eaten: Math.round(eaten.fat), goal: Math.round(goal.fat), unit: 'g' }
  ]

  return (
    <div style={{
      display: 'flex',
      borderTop: '1px solid rgba(255, 255, 255, 0.04)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
    }}>
      {macros.map((macro, i) => {
        const percent = macro.goal > 0 ? Math.min(100, (macro.eaten / macro.goal) * 100) : 0
        const remaining = Math.max(0, macro.goal - macro.eaten)
        const isOver = macro.eaten > macro.goal && macro.goal > 0

        // Auto-scale eaten font when values get long so 4 columns stay equal width.
        const eatenStr = String(macro.eaten)
        const eatenLen = eatenStr.length
        const baseEaten = isMobile ? 0.95 : 1.05
        const eatenSize =
          eatenLen >= 7 ? baseEaten * 0.55 :
          eatenLen >= 6 ? baseEaten * 0.65 :
          eatenLen >= 5 ? baseEaten * 0.78 :
          baseEaten

        return (
          <div
            key={macro.label}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              overflow: 'hidden',
              padding: isMobile ? '0.5rem 0.25rem' : '0.625rem 0.375rem',
              textAlign: 'center',
              position: 'relative',
              borderRight: i < macros.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
            }}
          >
            {/* Label */}
            <div style={{
              fontSize: isMobile ? '0.4rem' : '0.45rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.2rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {macro.label}
            </div>

            {/* Eaten value — big, auto-scaled */}
            <div style={{
              fontSize: `${eatenSize}rem`,
              fontWeight: '900',
              color: isOver ? '#f59e0b' : '#FFD700',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {eatenStr}
            </div>

            {/* "van [goal]" */}
            <div style={{
              fontSize: isMobile ? '0.45rem' : '0.5rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.2)',
              marginTop: '0.1rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              van {macro.goal}{macro.unit || ''}
            </div>

            {/* "nog [remaining]" or "over" */}
            <div style={{
              fontSize: isMobile ? '0.4rem' : '0.45rem',
              fontWeight: '700',
              color: isOver ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 215, 0, 0.4)',
              marginTop: '0.05rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {isOver
                ? `${macro.eaten - macro.goal} over`
                : `nog ${remaining}`
              }
            </div>

            {/* Progress bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '8%',
              right: '8%',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '1.5px'
            }}>
              <div style={{
                height: '100%',
                width: `${percent}%`,
                background: isOver
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                  : '#FFD700',
                borderRadius: '1.5px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
