import React, { useState } from 'react'
import { Clock, ChevronRight, Utensils, RefreshCw, Eye, Timer, Sparkles, Flame, TrendingUp } from 'lucide-react'

export default function NextMealCard({ nextMeal, meals, checkedMeals, onMealClick, onSwapMeal }) {
  const isMobile = window.innerWidth <= 768
  const [hoveredButton, setHoveredButton] = useState(null)
  
  if (!nextMeal) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
          borderRadius: isMobile ? '16px' : '20px',
          padding: isMobile ? '1.5rem' : '2rem',
          textAlign: 'center',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 10px 25px rgba(4, 120, 87, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated background pattern */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Sparkles size={32} color="#10b981" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ 
              color: 'white', 
              margin: 0,
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}>
              Alle maaltijden voltooid!
            </h3>
            <p style={{ 
              color: 'rgba(255,255,255,0.9)', 
              margin: '0.5rem 0 0',
              fontSize: isMobile ? '0.95rem' : '1.1rem'
            }}>
              Geweldige prestatie vandaag
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate time display
  const now = new Date()
  const currentHours = now.getHours() + now.getMinutes() / 60
  const mealHours = nextMeal.plannedTime
  
  const getTimeDisplay = () => {
    const hoursUntil = mealHours - currentHours
    
    if (nextMeal.isPast) {
      return { text: 'Gemiste maaltijd', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    }
    
    if (hoursUntil < -0.5) {
      return { text: 'Gemist', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    }
    
    if (hoursUntil < 0.5) {
      return { text: 'Nu tijd om te eten!', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', pulse: true }
    }
    
    if (hoursUntil < 1) {
      const minutes = Math.round(hoursUntil * 60)
      return { text: `Over ${minutes} minuten`, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
    }
    
    const hours = Math.floor(hoursUntil)
    const minutes = Math.round((hoursUntil - hours) * 60)
    const timeStr = minutes > 0 ? `${hours}u ${minutes}m` : `${hours} uur`
    return { text: `Over ${timeStr}`, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' }
  }

  const timeDisplay = getTimeDisplay()
  
  // Mini timeline for context
  const upcomingMeals = meals.filter((meal, idx) => 
    !checkedMeals[idx] && meal.plannedTime >= currentHours
  ).slice(0, 3)

  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: '1rem'
    }}>
      {/* Section Header - Premium Style */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingLeft: '0.25rem'
      }}>
        <Flame size={isMobile ? 18 : 20} color="#10b981" />
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: 'bold',
          color: '#fff',
          margin: 0
        }}>
          Jouw Volgende Maaltijd
        </h3>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
        borderRadius: isMobile ? '16px' : '24px',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 10px 25px rgba(4, 120, 87, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        position: 'relative',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        opacity: 0.95
      }}>
        {/* Animated Background Pattern */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-15%',
          width: isMobile ? '200px' : '350px',
          height: isMobile ? '200px' : '350px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }} />

        {/* Image Section - Groter maken voor 2/3 verhouding */}
        <div style={{
          height: isMobile ? '220px' : '260px',
          position: 'relative',
          background: nextMeal.image_url 
            ? `url(${nextMeal.image_url}) center/cover`
            : 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          {/* Premium Gradient Overlay - Subtielere gradient */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(4, 120, 87, 0.9) 0%, rgba(4, 120, 87, 0.2) 30%, transparent 70%)'
          }} />

          {/* Time Badge - Premium Style */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: timeDisplay.bg,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${timeDisplay.color}`,
            borderRadius: '12px',
            padding: '0.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: `0 4px 12px ${timeDisplay.color}20`,
            animation: timeDisplay.pulse ? 'pulse 2s ease-in-out infinite' : 'none'
          }}>
            <Clock size={16} color={timeDisplay.color} />
            <span style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              color: timeDisplay.color,
              letterSpacing: '0.2px'
            }}>
              {timeDisplay.text}
            </span>
          </div>

          {/* Meal Type Badge - Premium */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            zIndex: 2
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '10px',
              padding: '0.5rem 1rem',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'white',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              {nextMeal.timeSlot || 'Maaltijd'}
            </div>
          </div>
        </div>

        {/* Content Section - Extra compact voor 1/3 verhouding */}
        <div style={{
          padding: isMobile ? '0.75rem' : '1.5rem',
          background: 'rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Meal Name - Compacter */}
          <h3 style={{
            margin: '0 0 0.5rem',
            fontSize: isMobile ? '1.1rem' : '1.5rem',
            fontWeight: '700',
            color: 'white',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            lineHeight: 1.1
          }}>
            {nextMeal.name}
          </h3>

          {/* Macros Bar - Ultra compact single line */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '0.625rem' : '1rem',
            padding: isMobile ? '0.5rem 0.625rem' : '0.75rem',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            borderRadius: isMobile ? '8px' : '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'baseline', 
              gap: '0.25rem'
            }}>
              <span style={{
                fontSize: isMobile ? '1rem' : '1.15rem',
                fontWeight: '700',
                color: '#fbbf24'
              }}>
                {nextMeal.kcal}
              </span>
              <span style={{
                fontSize: '0.6rem',
                color: 'rgba(251,191,36,0.7)',
                fontWeight: '500'
              }}>
                KCAL
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'baseline', 
              gap: '0.25rem'
            }}>
              <span style={{
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '700',
                color: '#60a5fa'
              }}>
                {nextMeal.protein}g
              </span>
              <span style={{
                fontSize: '0.55rem',
                color: 'rgba(96,165,250,0.7)'
              }}>
                EIWIT
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'baseline', 
              gap: '0.25rem'
            }}>
              <span style={{
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '700',
                color: '#f87171'
              }}>
                {nextMeal.carbs}g
              </span>
              <span style={{
                fontSize: '0.55rem',
                color: 'rgba(248,113,113,0.7)'
              }}>
                CARBS
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'baseline', 
              gap: '0.25rem'
            }}>
              <span style={{
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '700',
                color: '#c084fc'
              }}>
                {nextMeal.fat}g
              </span>
              <span style={{
                fontSize: '0.55rem',
                color: 'rgba(192,132,252,0.7)'
              }}>
                VET
              </span>
            </div>
          </div>

          {/* Action Buttons - Extra compact */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: isMobile ? '0.375rem' : '0.5rem'
          }}>
            <button
              onClick={() => onMealClick(nextMeal)}
              onMouseEnter={() => setHoveredButton('recipe')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                background: hoveredButton === 'recipe' 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: isMobile ? '8px' : '10px',
                padding: isMobile ? '0.625rem 0.5rem' : '0.75rem',
                color: 'white',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation'
              }}
            >
              <Eye size={14} />
              Bekijk Recept
            </button>
            
            <button
              onClick={() => onSwapMeal(nextMeal)}
              onMouseEnter={() => setHoveredButton('swap')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                background: hoveredButton === 'swap'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0.2) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: isMobile ? '8px' : '10px',
                padding: isMobile ? '0.625rem 0.5rem' : '0.75rem',
                color: '#10b981',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation'
              }}
            >
              <RefreshCw size={14} />
              Alternatief
            </button>
          </div>

          {/* Mini Timeline - Alleen als er ruimte is */}
          {upcomingMeals.length > 1 && !isMobile && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              marginTop: '0.75rem',
              paddingTop: '0.625rem'
            }}>
              <div style={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Timer size={10} />
                Vandaag
              </div>
              <div style={{
                display: 'flex',
                gap: '0.375rem',
                overflowX: 'auto'
              }}>
                {upcomingMeals.slice(0, 2).map((meal, idx) => {
                  const mealTime = Math.floor(meal.plannedTime) + ':' + 
                    String(Math.round((meal.plannedTime % 1) * 60)).padStart(2, '0')
                  
                  return (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '6px',
                      padding: '0.375rem 0.5rem',
                      fontSize: '0.7rem',
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <span style={{ color: '#10b981', marginRight: '0.25rem' }}>
                        {mealTime}
                      </span>
                      {meal.timeSlot}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
        
        @keyframes iconBounce {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-2px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(2px);
          }
        }
      `}</style>
    </div>
  )
}
