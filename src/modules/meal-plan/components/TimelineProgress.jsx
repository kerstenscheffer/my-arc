import React from 'react'
import { Clock, Check, Circle } from 'lucide-react'

export default function TimelineProgress({ meals, checkedMeals, onToggleMeal }) {
  const isMobile = window.innerWidth <= 768
  
  if (!meals || meals.length === 0) return null
  
  const currentTime = new Date().getHours() + new Date().getMinutes() / 60
  
  // Sort meals by plannedTime
  const sortedMeals = [...meals].sort((a, b) => a.plannedTime - b.plannedTime)
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: '1rem'
    }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingLeft: '0.25rem'
      }}>
        <Clock size={16} style={{ color: '#888' }} />
        <h3 style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600',
          color: '#888',
          margin: 0,
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          Dagschema
        </h3>
      </div>

      {/* Timeline Container */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative'
      }}>
        {/* Timeline Line */}
        <div style={{
          position: 'absolute',
          left: isMobile ? '2rem' : '2.5rem',
          top: '2rem',
          bottom: '2rem',
          width: '2px',
          background: 'linear-gradient(180deg, #047857 0%, rgba(4, 120, 87, 0.1) 100%)',
          opacity: 0.3
        }} />

        {/* Timeline Items */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          position: 'relative'
        }}>
          {sortedMeals.map((meal, idx) => {
            const isChecked = checkedMeals[idx]
            const isPast = meal.plannedTime < currentTime
            const isCurrent = Math.abs(meal.plannedTime - currentTime) < 1
            const isNext = !isChecked && !isCurrent && meal.plannedTime > currentTime
            
            const getTimeString = () => {
              const hours = Math.floor(meal.plannedTime)
              const minutes = Math.round((meal.plannedTime - hours) * 60)
              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
            }
            
            return (
              <div 
                key={idx}
                onClick={() => onToggleMeal(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  transition: 'background 0.2s ease',
                  background: isCurrent ? 'rgba(251, 191, 36, 0.05)' : 
                            isNext ? 'rgba(16, 185, 129, 0.05)' :
                            'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isCurrent ? 'rgba(251, 191, 36, 0.05)' :
                                                      isNext ? 'rgba(16, 185, 129, 0.05)' :
                                                      'transparent'
                }}
              >
                {/* Time Dot */}
                <div style={{
                  width: isMobile ? '24px' : '28px',
                  height: isMobile ? '24px' : '28px',
                  borderRadius: '50%',
                  background: isChecked ? '#047857' :
                            isCurrent ? '#fbbf24' :
                            isNext ? '#10b981' :
                            'rgba(255,255,255,0.1)',
                  border: isChecked ? 'none' : '2px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {isChecked ? (
                    <Check size={14} color="white" strokeWidth={3} />
                  ) : isCurrent ? (
                    <Circle size={8} color="white" fill="white" />
                  ) : null}
                  
                  {/* Current time pulse */}
                  {isCurrent && !isChecked && (
                    <div style={{
                      position: 'absolute',
                      inset: '-4px',
                      borderRadius: '50%',
                      border: '2px solid #fbbf24',
                      animation: 'pulse 2s ease-in-out infinite',
                      opacity: 0.5
                    }} />
                  )}
                </div>

                {/* Time & Meal Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      color: isChecked ? '#047857' :
                            isCurrent ? '#fbbf24' :
                            isNext ? '#10b981' :
                            '#666',
                      fontWeight: '600'
                    }}>
                      {getTimeString()}
                    </span>
                    <span style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      color: '#666'
                    }}>
                      • {meal.timeSlot}
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontSize: '0.7rem',
                        color: '#fbbf24',
                        background: 'rgba(251, 191, 36, 0.1)',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}>
                        NU
                      </span>
                    )}
                    {isNext && (
                      <span style={{
                        fontSize: '0.7rem',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '6px',
                        fontWeight: '600'
                      }}>
                        VOLGENDE
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    color: isChecked ? '#666' : 'white',
                    fontWeight: '500',
                    textDecoration: isChecked ? 'line-through' : 'none',
                    opacity: isChecked ? 0.6 : 1
                  }}>
                    {meal.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: '0.25rem',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: '#666'
                  }}>
                    <span style={{ color: '#fbbf24' }}>{meal.kcal} kcal</span>
                    <span style={{ color: '#60a5fa' }}>{meal.protein}g eiwit</span>
                    <span style={{ color: '#f87171' }}>{meal.carbs}g carbs</span>
                    <span style={{ color: '#c084fc' }}>{meal.fat}g vet</span>
                  </div>
                </div>

                {/* Check indicator */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: isChecked ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  background: isChecked ? '#047857' : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isChecked && <Check size={12} color="white" strokeWidth={3} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  )
}
