import React, { useState } from 'react'
import { Target, Droplets, TrendingUp, Flame } from 'lucide-react'

export default function MealGoalCard({ progress, targets, plan, waterIntake = 0, onAddWater }) {
  const isMobile = window.innerWidth <= 768
  const [hoveredCard, setHoveredCard] = useState(null)
  
  const calculatePercentage = (current, target) => {
    if (!target || target === 0) return 0
    return Math.min(100, Math.round((current / target) * 100))
  }
  
  const macroCards = [
    {
      id: 'calories',
      label: 'Calorieën',
      current: progress?.kcal || 0,
      target: targets?.kcal || 2000,
      unit: 'kcal',
      color: '#fbbf24',
      bgGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.08) 100%)',
      hoverGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(251, 191, 36, 0.15) 100%)',
      icon: Flame
    },
    {
      id: 'protein',
      label: 'Eiwitten',
      current: progress?.protein || 0,
      target: targets?.protein || 150,
      unit: 'g',
      color: '#60a5fa',
      bgGradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.08) 100%)',
      hoverGradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.25) 0%, rgba(96, 165, 250, 0.15) 100%)',
      icon: Target
    },
    {
      id: 'carbs',
      label: 'Koolhydraten',
      current: progress?.carbs || 0,
      target: targets?.carbs || 200,
      unit: 'g',
      color: '#f87171',
      bgGradient: 'linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(248, 113, 113, 0.08) 100%)',
      hoverGradient: 'linear-gradient(135deg, rgba(248, 113, 113, 0.25) 0%, rgba(248, 113, 113, 0.15) 100%)',
      icon: TrendingUp
    },
    {
      id: 'fat',
      label: 'Vetten',
      current: progress?.fat || 0,
      target: targets?.fat || 70,
      unit: 'g',
      color: '#c084fc',
      bgGradient: 'linear-gradient(135deg, rgba(192, 132, 252, 0.15) 0%, rgba(192, 132, 252, 0.08) 100%)',
      hoverGradient: 'linear-gradient(135deg, rgba(192, 132, 252, 0.25) 0%, rgba(192, 132, 252, 0.15) 100%)',
      icon: Target
    }
  ]
  
  const handleWaterClick = () => {
    const newAmount = waterIntake >= 3 ? 0 : waterIntake + 0.5
    onAddWater(newAmount)
  }
  
  const waterPercentage = Math.min(100, (waterIntake / (targets?.water || 2)) * 100)
  
  return (
    <div style={{ 
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: '1rem'
    }}>
      {/* Premium Card Container */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(4, 120, 87, 0.08) 0%, rgba(6, 95, 70, 0.05) 100%)',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Subtle animated background */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}>
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '700',
                color: 'white',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Target size={isMobile ? 18 : 20} style={{ color: '#10b981' }} />
                Dagelijkse Doelen
              </h3>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255,255,255,0.5)',
                margin: '0.25rem 0 0',
                fontWeight: '500'
              }}>
                {progress?.checked || 0} van {progress?.total || 0} maaltijden voltooid
              </p>
            </div>
            
            {/* Overall Progress */}
            <div style={{
              textAlign: 'center',
              padding: '0.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              borderRadius: '12px',
              minWidth: '60px'
            }}>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#10b981',
                textShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
              }}>
                {Math.round((progress?.kcal || 0) / (targets?.kcal || 2000) * 100)}%
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: 'rgba(16, 185, 129, 0.7)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Totaal
              </div>
            </div>
          </div>
          
          {/* Macro Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: isMobile ? '0.75rem' : '1rem',
            marginBottom: '1.25rem'
          }}>
            {macroCards.map((macro) => {
              const percentage = calculatePercentage(macro.current, macro.target)
              const Icon = macro.icon
              const isHovered = hoveredCard === macro.id
              
              return (
                <div
                  key={macro.id}
                  onMouseEnter={() => setHoveredCard(macro.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: isHovered ? macro.hoverGradient : macro.bgGradient,
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: isMobile ? '0.875rem' : '1rem',
                    border: `1px solid ${isHovered ? macro.color + '30' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isHovered 
                      ? `0 8px 25px ${macro.color}15, inset 0 1px 0 rgba(255,255,255,0.05)` 
                      : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                    cursor: 'default',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Subtle glow effect */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: `linear-gradient(90deg, transparent, ${macro.color}40, transparent)`,
                      animation: 'shimmer 1s ease'
                    }} />
                  )}
                  
                  {/* Top Row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.625rem'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '0.65rem',
                        color: macro.color,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.25rem',
                        opacity: 0.9
                      }}>
                        {macro.label}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '1.1rem' : '1.25rem',
                        fontWeight: '700',
                        color: 'white',
                        lineHeight: 1
                      }}>
                        {macro.current}
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.5)',
                          fontWeight: '500',
                          marginLeft: '0.25rem'
                        }}>
                          / {macro.target} {macro.unit}
                        </span>
                      </div>
                    </div>
                    
                    <Icon 
                      size={isMobile ? 16 : 18} 
                      style={{ 
                        color: macro.color,
                        opacity: 0.6
                      }} 
                    />
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{
                    height: '4px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${macro.color}CC, ${macro.color})`,
                      borderRadius: '2px',
                      transition: 'width 0.5s ease',
                      boxShadow: `0 0 8px ${macro.color}60`
                    }} />
                  </div>
                  
                  {/* Percentage */}
                  <div style={{
                    marginTop: '0.375rem',
                    fontSize: '0.7rem',
                    color: macro.color,
                    fontWeight: '600',
                    opacity: 0.8
                  }}>
                    {percentage}%
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Water Tracker - Premium Style */}
          <div
            onClick={handleWaterClick}
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: isMobile ? '0.875rem' : '1rem',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Droplets size={isMobile ? 20 : 24} style={{ color: '#3b82f6' }} />
              <div>
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '0.125rem'
                }}>
                  Water Intake
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  Tik om bij te werken
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#3b82f6',
                textShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
              }}>
                {waterIntake}L
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(59, 130, 246, 0.7)',
                fontWeight: '600'
              }}>
                {waterPercentage}% van {targets?.water || 2}L
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
