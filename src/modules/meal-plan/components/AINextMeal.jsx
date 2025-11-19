// src/modules/meal-plan/components/AINextMeal.jsx
// ✅ PREMIUM v5.0 - WorkoutPhotoSlider Styling Norm Applied
// 🎯 CLEAN, COMPACT, GLASSMORPHIC, UNIFORM
import React, { useState, useEffect } from 'react'
import { Clock, Info, RefreshCw, Check, AlertCircle, Apple } from 'lucide-react'

export default function AINextMeal({ 
  nextMeal,
  todayMeals,
  onOpenInfo,
  onOpenAlternatives,
  onFinishMeal,
  onOpenDaySchedule,
  db
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const getTimeDisplay = () => {
    if (!nextMeal) return null
    
    const now = new Date()
    const currentHour = now.getHours() + now.getMinutes() / 60
    const hoursUntil = (nextMeal.plannedTime || 12) - currentHour
    
    if (nextMeal.isPast) {
      return { text: 'Gemist', color: '#ef4444', urgency: 'past' }
    }
    
    if (Math.abs(hoursUntil) < 0.5) {
      return { text: 'Nu!', color: '#fbbf24', pulse: true, urgency: 'now' }
    }
    
    if (hoursUntil < 0) {
      return { text: 'Te laat', color: '#f97316', urgency: 'late' }
    }
    
    if (hoursUntil < 1) {
      const minutes = Math.round(hoursUntil * 60)
      return { text: `${minutes}m`, color: '#10b981', urgency: 'soon' }
    }
    
    const hours = Math.floor(hoursUntil)
    const minutes = Math.round((hoursUntil - hours) * 60)
    const timeStr = minutes > 0 ? `${hours}u ${minutes}m` : `${hours}u`
    return { text: timeStr, color: '#10b981', urgency: 'later' }
  }
  
  const timeDisplay = getTimeDisplay()
  
  const getMealImage = (meal) => {
    if (meal?.image_url) return meal.image_url
    
    const mealType = meal?.slot || meal?.timeSlot || 'meal'
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&h=600&fit=crop&q=85',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&h=600&fit=crop&q=85',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=600&fit=crop&q=85',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=1200&h=600&fit=crop&q=85'
    }
    
    return fallbacks[mealType] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=600&fit=crop&q=85'
  }
  
  const getLastMeal = () => {
    if (!todayMeals || todayMeals.length === 0) return null
    return todayMeals[todayMeals.length - 1]
  }

  // COMPLETED STATE - PREMIUM GLASSMORPHIC
  if (!nextMeal) {
    const lastMeal = getLastMeal()
    
    return (
      <div style={{ 
        padding: isMobile ? '0.5rem' : '0.625rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          position: 'relative',
          height: isMobile ? '200px' : '260px',
          borderRadius: isMobile ? '16px' : '20px',
          overflow: 'hidden',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          background: '#000'
        }}>
          {/* Background image - faded */}
          {lastMeal && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${getMealImage(lastMeal)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.25,
              filter: 'blur(2px)'
            }} />
          )}
          
          {/* Glassmorphic overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(5, 150, 105, 0.75) 100%)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '1.5rem' : '2rem'
          }}>
            {/* Check icon container - glassmorphic */}
            <div style={{
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
              backdropFilter: 'blur(12px)',
              borderRadius: isMobile ? '12px' : '14px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: isMobile ? '0.75rem' : '1rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}>
              <Check 
                size={isMobile ? 24 : 28} 
                color="white" 
                strokeWidth={3}
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }}
              />
            </div>
            
            {/* Title - ultra-tight typography */}
            <h3 style={{
              fontSize: isMobile ? '1.15rem' : '1.35rem',
              fontWeight: '800',
              color: 'white',
              margin: 0,
              textAlign: 'center',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              lineHeight: 1.2
            }}>
              Voltooid!
            </h3>
          </div>
          
          {/* Top glow line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
            opacity: 0.8,
            pointerEvents: 'none'
          }} />
        </div>
      </div>
    )
  }

  // ACTIVE MEAL STATE - PREMIUM COMPACT
  return (
    <div style={{ 
      padding: isMobile ? '0.5rem' : '0.625rem',
      marginBottom: isMobile ? '1rem' : '1.5rem'
    }}>
      <div style={{
        position: 'relative',
        height: isMobile ? '200px' : '260px',
        borderRadius: isMobile ? '16px' : '20px',
        overflow: 'hidden',
        border: '2px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        background: '#000',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${getMealImage(nextMeal)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'opacity 0.5s ease',
          zIndex: 1
        }} />
        
        {/* Top vignette */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
          pointerEvents: 'none',
          zIndex: 2
        }} />
        
        {/* Bottom gradient */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }} />
        
        {/* Content layer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: isMobile ? '1rem' : '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.625rem' : '0.75rem',
          zIndex: 3
        }}>
          {/* Top row - Meal name + Time badge */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {/* Meal name container - glassmorphic */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: isMobile ? '12px' : '14px',
              padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.5rem' : '0.625rem',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              flex: 1,
              minWidth: 0
            }}>
              {/* Green apple icon container */}
              <div style={{
                width: isMobile ? '28px' : '32px',
                height: isMobile ? '28px' : '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
              }}>
                <Apple 
                  size={isMobile ? 14 : 16} 
                  color="#10b981"
                  fill="#10b981"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' }}
                />
              </div>
              
              {/* Meal name text */}
              <span style={{
                color: 'white',
                fontSize: isMobile ? '0.95rem' : '1.15rem',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {nextMeal.name || nextMeal.slot || 'Maaltijd'}
              </span>
            </div>
            
            {/* Time badge - glassmorphic */}
            {timeDisplay && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${timeDisplay.color}40`,
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                boxShadow: `0 4px 16px ${timeDisplay.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
                flexShrink: 0,
                animation: timeDisplay.pulse ? 'pulse 2s ease-in-out infinite' : 'none'
              }}>
                <Clock 
                  size={isMobile ? 12 : 14} 
                  color={timeDisplay.color}
                  style={{ 
                    flexShrink: 0,
                    filter: `drop-shadow(0 0 6px ${timeDisplay.color})`
                  }}
                />
                <span style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  color: timeDisplay.color,
                  fontWeight: '800',
                  letterSpacing: '-0.01em',
                  textShadow: `0 0 8px ${timeDisplay.color}60`
                }}>
                  {timeDisplay.text}
                </span>
              </div>
            )}
          </div>
          
          {/* Bottom row - Action buttons */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.625rem',
            alignItems: 'stretch'
          }}>
            {/* Info button - glassmorphic */}
            <button
              onClick={() => onOpenInfo(nextMeal)}
              style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                color: '#10b981',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                minWidth: isMobile ? '44px' : 'auto',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                flex: isMobile ? '0 0 auto' : '1'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <Info 
                size={isMobile ? 16 : 17}
                style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
              />
              {!isMobile && <span>Info</span>}
            </button>

            {/* Swap button - glassmorphic */}
            <button
              onClick={() => onOpenAlternatives(nextMeal)}
              style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                color: '#10b981',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                minWidth: isMobile ? '44px' : 'auto',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                flex: isMobile ? '0 0 auto' : '1'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <RefreshCw 
                size={isMobile ? 16 : 17}
                style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
              />
              {!isMobile && <span>Wissel</span>}
            </button>

            {/* Complete button - PRIMARY glassmorphic with green emphasis */}
            <button
              onClick={() => onFinishMeal(nextMeal)}
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
                color: '#10b981',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                flex: '2',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.25) 100%)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
              onTouchStart={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
              }}
              onTouchEnd={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <Check 
                size={isMobile ? 16 : 18} 
                strokeWidth={2.5}
                style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))' }}
              />
              <span>Afronden</span>
            </button>
          </div>
          
          {/* Urgency alert - only when time is NOW */}
          {timeDisplay?.urgency === 'now' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.12) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              borderRadius: isMobile ? '10px' : '12px',
              padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 16px rgba(251, 191, 36, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <AlertCircle 
                size={isMobile ? 14 : 15} 
                color="#fbbf24" 
                style={{ 
                  flexShrink: 0,
                  filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.6))'
                }}
              />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: '#fbbf24',
                fontWeight: '800',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                textShadow: '0 0 8px rgba(251, 191, 36, 0.3)'
              }}>
                Tijd om te eten!
              </span>
            </div>
          )}
        </div>
        
        {/* Top green accent glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 4
        }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.02); 
            opacity: 0.9; 
          }
        }
      `}</style>
    </div>
  )
}
