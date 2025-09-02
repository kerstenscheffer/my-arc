import useIsMobile from '../../../hooks/useIsMobile'
// src/modules/meal-plan/components/QuickActions.jsx
import React, { useState } from 'react'
import { Plus, Star, History, BookOpen, ChefHat, TrendingUp, Sparkles, BarChart3 } from 'lucide-react'

export default function QuickActions({ onAddCustom, onShowHistory, onShowProgress, onNavigate }) {
  const [hoveredAction, setHoveredAction] = useState(null)
  const isMobile = useIsMobile()
  
  const actions = [
    { 
      icon: Plus, 
      label: 'Eigen Meal', 
      sublabel: 'Voeg toe',
      onClick: onAddCustom, 
      gradient: 'linear-gradient(135deg, rgba(4, 120, 87, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.25) 0%, rgba(4, 120, 87, 0.15) 100%)',
      color: '#059669',
      delay: 0
    },
    { 
      icon: Star, 
      label: 'Favorieten', 
      sublabel: 'Snel kiezen',
      onClick: () => onNavigate('favorites'), 
      gradient: 'linear-gradient(135deg, rgba(146, 64, 14, 0.9) 0%, rgba(245, 158, 11, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(146, 64, 14, 0.15) 100%)',
      color: '#f59e0b',
      delay: 50
    },
    { 
      icon: History, 
      label: 'Historie', 
      sublabel: 'Bekijk trends',
      onClick: onShowHistory, 
      gradient: 'linear-gradient(135deg, rgba(30, 64, 175, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(30, 64, 175, 0.15) 100%)',
      color: '#3b82f6',
      delay: 100
    },
    { 
      icon: BarChart3, 
      label: 'Progress', 
      sublabel: 'Stats & insights',
      onClick: onShowProgress, 
      gradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(88, 28, 135, 0.15) 100%)',
      color: '#8b5cf6',
      delay: 150
    },
    { 
      icon: BookOpen, 
      label: 'Recepten', 
      sublabel: 'Ontdek meer',
      onClick: () => onNavigate('recipes'), 
      gradient: 'linear-gradient(135deg, rgba(220, 38, 127, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(220, 38, 127, 0.15) 100%)',
      color: '#ec4899',
      delay: 200
    }
  ]
  
  return (
    <div style={{
      padding: '0 1rem 1.5rem',
      position: 'relative'
    }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ChefHat size={isMobile ? 18 : 20} style={{ color: '#059669' }} />
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            margin: 0
          }}>
            Quick Actions
          </h3>
        </div>
        
        <Sparkles 
          size={16} 
          style={{ 
            color: 'rgba(5, 150, 105, 0.4)',
            animation: 'sparkle 3s ease-in-out infinite'
          }} 
        />
      </div>
      
      {/* Actions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {actions.map((action, index) => {
          const Icon = action.icon
          const isHovered = hoveredAction === index
          
          return (
            <button
              key={index}
              onClick={action.onClick}
              onMouseEnter={() => setHoveredAction(index)}
              onMouseLeave={() => setHoveredAction(null)}
              onTouchStart={() => setHoveredAction(index)}
              onTouchEnd={() => setHoveredAction(null)}
              style={{
                background: isHovered ? action.gradient : action.lightGradient,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isHovered ? action.color + '40' : 'rgba(4, 120, 87, 0.15)'}`,
                borderRadius: '16px',
                padding: isMobile ? '1rem' : '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered 
                  ? `0 15px 40px ${action.color}25, inset 0 1px 0 rgba(255,255,255,0.1)` 
                  : `0 5px 15px rgba(0, 0, 0, 0.1)`,
                animation: `slideInUp ${300 + action.delay}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                opacity: 0,
                minHeight: isMobile ? '100px' : '120px',
                // Special styling for 5th item on mobile (span full width)
                ...(isMobile && index === 4 && {
                  gridColumn: 'span 2'
                })
              }}
            >
              {/* Decorative circle */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: action.gradient,
                opacity: 0.15,
                animation: isHovered ? 'pulse 2s ease-in-out infinite' : 'none'
              }} />
              
              {/* Shimmer effect */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                  animation: 'shimmer 0.5s ease'
                }} />
              )}
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Icon and Label */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <Icon 
                        size={16} 
                        style={{ 
                          color: isHovered ? '#fff' : action.color,
                          transition: 'all 0.3s ease'
                        }} 
                      />
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: isHovered ? 'rgba(255,255,255,0.9)' : action.color,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        transition: 'all 0.3s ease'
                      }}>
                        {action.label}
                      </span>
                    </div>
                    
                    <div style={{
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '700',
                      color: '#fff',
                      marginBottom: '0.25rem',
                      transition: 'all 0.3s ease'
                    }}>
                      {action.label}
                    </div>
                    
                    <div style={{
                      fontSize: '0.75rem',
                      color: isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                      lineHeight: 1.3,
                      transition: 'all 0.3s ease'
                    }}>
                      {action.sublabel}
                    </div>
                  </div>
                  
                  {/* Animated Icon */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${action.color}30 0%, ${action.color}10 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <Icon 
                      size={18} 
                      style={{
                        color: isHovered ? '#fff' : action.color,
                        animation: isHovered ? 'iconBounce 0.6s ease' : 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.15;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.1;
          }
        }
        
        @keyframes shimmer {
          to {
            left: 100%;
          }
        }
        
        @keyframes iconBounce {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-2px);
          }
          75% {
            transform: translateY(2px);
          }
        }
        
        @keyframes sparkle {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(1) rotate(0deg); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2) rotate(180deg); 
          }
        }
      `}</style>
    </div>
  )
}
