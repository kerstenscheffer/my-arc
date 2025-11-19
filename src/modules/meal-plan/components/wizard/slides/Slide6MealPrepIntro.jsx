// src/modules/meal-plan/components/wizard/slides/Slide6MealPrepIntro.jsx
// ULTRA COMPACT - No video, compact benefits, ChefHat icon, clear purpose

import { ChefHat } from 'lucide-react'
import CoachBubble from '../shared/CoachBubble'

export default function Slide6MealPrepIntro() {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      width: '100%',
      padding: '0'
    }}>
      {/* Header - COMPACT */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0 0.75rem' : '0 1rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: '0.75rem',
          boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)'
        }}>
          <ChefHat 
            size={isMobile ? 24 : 28} 
            color="#10b981"
            strokeWidth={2.5}
            style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
          />
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.375rem' : '1.75rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.2',
          letterSpacing: '-0.02em'
        }}>
          Redenen om te meal preppen
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          fontWeight: '500'
        }}>
          Kook 1x, eet de hele week
        </p>
      </div>

      {/* Coach Bubble - COMPACT */}
      <div style={{
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        <CoachBubble 
          message="Meal prep bespaart tijd, geld en zorgt dat je altijd gezond eet. Hier zijn de voordelen!"
          variant="default"
        />
      </div>
      
      {/* Benefits Grid - COMPACT */}
      <div style={{
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '0.75rem' : '0.875rem'
        }}>
          {[
            {
              emoji: '⏰',
              title: 'Tijdsbesparing',
              description: '1x koken, 7 dagen klaar',
              color: '#3b82f6'
            },
            {
              emoji: '💰',
              title: 'Goedkoper',
              description: 'Bulk kopen, minder verspillen',
              color: '#10b981'
            },
            {
              emoji: '🎯',
              title: 'Macro Controle',
              description: 'Weet exact wat je eet',
              color: '#8b5cf6'
            },
            {
              emoji: '🧠',
              title: 'Geen Gedoe',
              description: 'Eten is altijd klaar',
              color: '#f59e0b'
            },
            {
              emoji: '💪',
              title: 'Consistentie',
              description: 'Elke dag je doelen halen',
              color: '#ef4444'
            },
            {
              emoji: '😌',
              title: 'Minder Stress',
              description: 'Geen paniek meer',
              color: '#06b6d4'
            }
          ].map((benefit, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                padding: isMobile ? '0.875rem 1rem' : '1rem 1.125rem',
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: `1px solid rgba(${
                  benefit.color === '#3b82f6' ? '59, 130, 246' : 
                  benefit.color === '#10b981' ? '16, 185, 129' : 
                  benefit.color === '#8b5cf6' ? '139, 92, 246' : 
                  benefit.color === '#f59e0b' ? '245, 158, 11' : 
                  benefit.color === '#ef4444' ? '239, 68, 68' : 
                  '6, 182, 212'
                }, 0.2)`,
                borderRadius: isMobile ? '10px' : '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateZ(0)',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = `rgba(${
                    benefit.color === '#3b82f6' ? '59, 130, 246' : 
                    benefit.color === '#10b981' ? '16, 185, 129' : 
                    benefit.color === '#8b5cf6' ? '139, 92, 246' : 
                    benefit.color === '#f59e0b' ? '245, 158, 11' : 
                    benefit.color === '#ef4444' ? '239, 68, 68' : 
                    '6, 182, 212'
                  }, 0.4)`
                  e.currentTarget.style.boxShadow = `0 6px 20px rgba(${
                    benefit.color === '#3b82f6' ? '59, 130, 246' : 
                    benefit.color === '#10b981' ? '16, 185, 129' : 
                    benefit.color === '#8b5cf6' ? '139, 92, 246' : 
                    benefit.color === '#f59e0b' ? '245, 158, 11' : 
                    benefit.color === '#ef4444' ? '239, 68, 68' : 
                    '6, 182, 212'
                  }, 0.2)`
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = `rgba(${
                    benefit.color === '#3b82f6' ? '59, 130, 246' : 
                    benefit.color === '#10b981' ? '16, 185, 129' : 
                    benefit.color === '#8b5cf6' ? '139, 92, 246' : 
                    benefit.color === '#f59e0b' ? '245, 158, 11' : 
                    benefit.color === '#ef4444' ? '239, 68, 68' : 
                    '6, 182, 212'
                  }, 0.2)`
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              {/* Top accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: benefit.color,
                opacity: 0.5
              }} />
              
              {/* Shine overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '0.625rem' : '0.75rem',
                  marginBottom: isMobile ? '0.5rem' : '0.625rem'
                }}>
                  <div style={{
                    fontSize: isMobile ? '1.5rem' : '1.75rem',
                    flexShrink: 0,
                    filter: `drop-shadow(0 0 6px ${benefit.color}60)`
                  }}>
                    {benefit.emoji}
                  </div>
                  <h3 style={{
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    fontWeight: '800',
                    color: benefit.color,
                    margin: 0,
                    letterSpacing: '-0.01em'
                  }}>
                    {benefit.title}
                  </h3>
                </div>
                <p style={{
                  fontSize: isMobile ? '0.75rem' : '0.825rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0,
                  lineHeight: '1.5',
                  paddingLeft: isMobile ? '2.125rem' : '2.5rem',
                  fontWeight: '500'
                }}>
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Success Message - COMPACT */}
      <div style={{
        position: 'relative',
        marginTop: isMobile ? '1.25rem' : '1.5rem',
        padding: isMobile ? '1rem 1.125rem' : '1.25rem 1.375rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: isMobile ? '10px' : '12px',
        boxShadow: '0 6px 24px rgba(16, 185, 129, 0.2)',
        textAlign: 'center',
        overflow: 'hidden',
        margin: isMobile ? '1.25rem 0.5rem 0' : '1.5rem 0 0'
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          opacity: 0.6
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            marginBottom: isMobile ? '0.625rem' : '0.75rem',
            filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
          }}>
            🎉
          </div>
          <h3 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '800',
            color: '#10b981',
            margin: '0 0 0.375rem 0',
            letterSpacing: '-0.02em'
          }}>
            Setup compleet!
          </h3>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            fontWeight: '500',
            lineHeight: '1.5'
          }}>
            Klik "Volgende" om je weekplan te maken
          </p>
        </div>
      </div>
    </div>
  )
}
