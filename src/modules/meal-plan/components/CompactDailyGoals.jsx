import React from 'react'
import { Target, Flame, Zap } from 'lucide-react'

export default function CompactDailyGoals({ 
  targets = {},
  current = {},
  onGoalClick 
}) {
  const isMobile = window.innerWidth <= 768
  
  const goals = [
    {
      id: 'calories',
      label: 'Calorieën',
      icon: Flame,
      current: current.calories || 0,
      target: targets.calories || 2000,
      color: '#10b981',
      unit: 'kcal'
    },
    {
      id: 'protein', 
      label: 'Eiwit',
      icon: Target,
      current: current.protein || 0,
      target: targets.protein || 150,
      color: '#3b82f6',
      unit: 'g'
    },
    {
      id: 'carbs',
      label: 'Koolhydraten',
      icon: Zap,
      current: current.carbs || 0,
      target: targets.carbs || 250,
      color: '#f59e0b',
      unit: 'g'
    }
  ]

  return (
    <div style={{
      background: '#0a0a0a',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '1rem' : '1.25rem',
      border: '1px solid #1a1a1a',
      marginBottom: isMobile ? '1rem' : '1.5rem'
    }}>
      <h3 style={{
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        color: '#666',
        marginBottom: isMobile ? '0.75rem' : '1rem',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Dagelijkse Doelen
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {goals.map(goal => {
          const percentage = Math.min(100, (goal.current / goal.target) * 100)
          const Icon = goal.icon
          
          return (
            <button
              key={goal.id}
              onClick={() => onGoalClick && onGoalClick(goal.id)}
              style={{
                background: '#111',
                border: '1px solid #222',
                borderRadius: isMobile ? '12px' : '14px',
                padding: isMobile ? '0.75rem' : '1rem',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateZ(0)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.borderColor = goal.color
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.borderColor = '#222'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                  e.currentTarget.style.borderColor = goal.color
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  setTimeout(() => {
                    e.currentTarget.style.borderColor = '#222'
                  }, 150)
                }
              }}
            >
              {/* Progress Bar Background */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: '#1a1a1a',
                borderRadius: '0 0 12px 12px'
              }}>
                <div style={{
                  height: '100%',
                  width: `${percentage}%`,
                  background: `linear-gradient(90deg, ${goal.color}aa, ${goal.color})`,
                  borderRadius: '0 0 12px 12px',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>

              {/* Icon */}
              <Icon 
                size={isMobile ? 16 : 18} 
                style={{ 
                  color: goal.color,
                  marginBottom: '0.5rem'
                }} 
              />

              {/* Values */}
              <div style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: 'bold',
                color: percentage >= 90 ? goal.color : '#fff',
                marginBottom: '0.25rem'
              }}>
                {goal.current}
              </div>

              <div style={{
                fontSize: isMobile ? '0.625rem' : '0.7rem',
                color: '#666'
              }}>
                / {goal.target} {goal.unit}
              </div>

              {/* Label */}
              <div style={{
                fontSize: isMobile ? '0.625rem' : '0.7rem',
                color: '#888',
                marginTop: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.3px'
              }}>
                {goal.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
