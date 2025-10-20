// src/modules/meal-plan/components/AINextMeal.jsx
import React, { useState } from 'react'
import { 
  Clock, ChevronRight, Info, RefreshCw, 
  Check, Flame, Target, Zap, Droplets,
  Calendar, AlertCircle
} from 'lucide-react'

export default function AINextMeal({ 
  nextMeal,
  todayMeals,
  onOpenInfo,
  onOpenAlternatives,
  onFinishMeal,
  onOpenDaySchedule,
  db
}) {
  const isMobile = window.innerWidth <= 768
  const [hoveredButton, setHoveredButton] = useState(null)
  
  // Get time display
  const getTimeDisplay = () => {
    if (!nextMeal) return null
    
    const now = new Date()
    const currentHour = now.getHours() + now.getMinutes() / 60
    const hoursUntil = (nextMeal.plannedTime || 12) - currentHour
    
    if (nextMeal.isPast) {
      return { 
        text: 'Gemiste maaltijd', 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.1)',
        urgency: 'past'
      }
    }
    
    if (Math.abs(hoursUntil) < 0.5) {
      return { 
        text: 'Nu tijd om te eten!', 
        color: '#fbbf24', 
        bg: 'rgba(251, 191, 36, 0.1)',
        pulse: true,
        urgency: 'now'
      }
    }
    
    if (hoursUntil < 0) {
      return { 
        text: 'Te laat', 
        color: '#f97316', 
        bg: 'rgba(249, 115, 22, 0.1)',
        urgency: 'late'
      }
    }
    
    if (hoursUntil < 1) {
      const minutes = Math.round(hoursUntil * 60)
      return { 
        text: `Over ${minutes} min`, 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.1)',
        urgency: 'soon'
      }
    }
    
    const hours = Math.floor(hoursUntil)
    const minutes = Math.round((hoursUntil - hours) * 60)
    const timeStr = minutes > 0 ? `${hours}u ${minutes}m` : `${hours} uur`
    return { 
      text: `Over ${timeStr}`, 
      color: '#3b82f6', 
      bg: 'rgba(59, 130, 246, 0.1)',
      urgency: 'later'
    }
  }
  
  const timeDisplay = getTimeDisplay()
  
  // Get meal image
  const getMealImage = (meal) => {
    if (meal?.image_url) return meal.image_url
    
    // Fallback based on meal type
    const mealType = meal?.slot || meal?.timeSlot || 'meal'
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=600&fit=crop',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=800&h=600&fit=crop'
    }
    
    return fallbacks[mealType] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'
  }
  
  // Get last meal for completed state
  const getLastMeal = () => {
    if (!todayMeals || todayMeals.length === 0) return null
    return todayMeals[todayMeals.length - 1]
  }

  // Empty state when all meals completed - OVERLAY VERSION
  if (!nextMeal) {
    const lastMeal = getLastMeal()
    
    return (
      <div style={{
        padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingLeft: '0.25rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: 'white',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Check size={isMobile ? 20 : 24} color="#10b981" />
            Vandaag Voltooid
          </h2>
        </div>

        {/* Card with overlay */}
        <div style={{
          position: 'relative',
          borderRadius: isMobile ? '20px' : '28px',
          overflow: 'hidden'
        }}>
          {/* Background - Last Meal Card (faded) */}
          {lastMeal && (
            <div style={{
              opacity: 0.3,
              filter: 'blur(1px)',
              transform: 'scale(1.01)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #171717 100%)',
                borderRadius: isMobile ? '20px' : '28px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: isMobile ? '200px' : '280px',
                  background: `url(${getMealImage(lastMeal)}) center/cover`
                }} />
                <div style={{
                  padding: isMobile ? '1rem' : '1.25rem',
                  height: '120px'
                }} />
              </div>
            </div>
          )}
          
          {/* Overlay Content */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(4, 120, 87, 0.85) 100%)',
            backdropFilter: 'blur(10px)',
            padding: '2rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}>
              <Check size={40} color="white" strokeWidth={3} />
            </div>
            
            <h3 style={{
              fontSize: isMobile ? '1.5rem' : '1.875rem',
              fontWeight: '800',
              color: 'white',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
              textAlign: 'center'
            }}>
              Alle maaltijden voltooid!
            </h3>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              textAlign: 'center'
            }}>
              Geweldige prestatie vandaag
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
    }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        paddingLeft: '0.25rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: 'white',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Flame size={isMobile ? 20 : 24} color="#f59e0b" />
          Volgende Maaltijd
        </h2>
        
        <button
          onClick={onOpenDaySchedule}
          onMouseEnter={() => setHoveredButton('schedule')}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
            background: hoveredButton === 'schedule'
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(30, 58, 138, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            color: '#3b82f6',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: hoveredButton === 'schedule' ? 'translateY(-2px)' : 'translateY(0)',
            boxShadow: hoveredButton === 'schedule'
              ? '0 8px 20px rgba(59, 130, 246, 0.2)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Calendar size={16} />
          Dag Schema
        </button>
      </div>

      {/* Main Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #171717 100%)',
        borderRadius: isMobile ? '20px' : '28px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
        position: 'relative'
      }}>
        {/* Image Section - 2/3 height - KEEPING THIS */}
        <div style={{
          height: isMobile ? '200px' : '280px',
          position: 'relative',
          background: `url(${getMealImage(nextMeal)}) center/cover`,
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          {/* Gradient Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to top, 
              rgba(10, 10, 10, 0.95) 0%, 
              rgba(10, 10, 10, 0.4) 30%, 
              rgba(10, 10, 10, 0.2) 50%,
              transparent 100%)`
          }} />

          {/* Time Badge - Premium Style */}
          {timeDisplay && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: timeDisplay.bg,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${timeDisplay.color}40`,
              borderRadius: '14px',
              padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: `0 8px 24px ${timeDisplay.color}20`,
              animation: timeDisplay.pulse ? 'pulse 2s ease-in-out infinite' : 'none'
            }}>
              <Clock size={18} color={timeDisplay.color} />
              <span style={{
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontWeight: '700',
                color: timeDisplay.color,
                letterSpacing: '0.02em'
              }}>
                {timeDisplay.text}
              </span>
            </div>
          )}

          {/* Meal Type Badge */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            zIndex: 2
          }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.125rem'
              }}>
                {nextMeal.timeSlot || nextMeal.slot || 'Maaltijd'}
              </div>
             

<div style={{
                fontSize: isMobile ? '1.125rem' : '1.375rem',
                fontWeight: '800',
                color: 'white',
                letterSpacing: '-0.02em'
              }}>
                {(() => {
                  const mealName = nextMeal.name || nextMeal.meal_name || 'Maaltijd'
                  return mealName.length > 19 ? mealName.substring(0, 19) + '...' : mealName
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section - REDESIGNED */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'rgba(17, 17, 17, 0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Macro Bar - MOBILE OPTIMIZED */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '0.75rem' : '1rem',
            padding: '0'
          }}>
            {/* Calories - Hero */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.25rem'
            }}>
              <Flame 
                size={isMobile ? 16 : 18} 
                color="#f59e0b" 
                style={{ 
                  opacity: 0.9,
                  marginBottom: '0.125rem'
                }} 
              />


<span style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
                letterSpacing: '-0.02em'
              }}>
                {Math.round(nextMeal.calories || 0)}
              </span>
              <span style={{
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                color: 'rgba(245, 158, 11, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600',
                alignSelf: 'center',
                marginRight: '0.5rem'
              }}>
                kcal
              </span>
            </div>
            {/* Other Macros - Compact */}
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.625rem' : '0.875rem',
              alignItems: 'center'
            }}>
              {/* Protein */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                <Target size={isMobile ? 13 : 15} color="#8b5cf6" style={{ opacity: 0.7 }} />
                <span style={{
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '700',
                  color: '#8b5cf6'
                }}>
                  {Math.round(nextMeal.protein || 0)}g
                </span>
              </div>

              {/* Carbs */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                <Zap size={isMobile ? 13 : 15} color="#ef4444" style={{ opacity: 0.7 }} />
                <span style={{
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '700',
                  color: '#ef4444'
                }}>
                  {Math.round(nextMeal.carbs || 0)}g
                </span>
              </div>

              {/* Fat */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                <Droplets size={isMobile ? 13 : 15} color="#3b82f6" style={{ opacity: 0.7 }} />
                <span style={{
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '700',
                  color: '#3b82f6'
                }}>
                  {Math.round(nextMeal.fat || 0)}g
                </span>
              </div>
            </div>
          </div>
          {/* Action Buttons - CLEAN MINIMALIST */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 2fr',
            gap: isMobile ? '0.5rem' : '0.625rem'
          }}>
            {/* Info Button */}
            <button
              onClick={() => onOpenInfo(nextMeal)}
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '10px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                color: '#3b82f6',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Info size={18} />
              {!isMobile && <span>Info</span>}
            </button>

            {/* Swap Button */}
            <button
              onClick={() => onOpenAlternatives(nextMeal)}
              style={{
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.15)',
                borderRadius: '10px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                color: '#fbbf24',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <RefreshCw size={18} />
              {!isMobile && <span>Wissel</span>}
            </button>

            {/* Finish Button - Primary CTA */}
            <button
              onClick={() => onFinishMeal(nextMeal)}
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                color: '#10b981',
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '48px',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              <Check size={20} strokeWidth={2.5} />
              <span>Maaltijd Afronden</span>
            </button>
          </div>

          {/* Urgency Message - CLEANER */}
          {timeDisplay?.urgency === 'now' && (
            <div style={{
              marginTop: '0.75rem',
              padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
              background: 'rgba(251, 191, 36, 0.05)',
              border: '1px solid rgba(251, 191, 36, 0.15)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(251, 191, 36, 0.9)',
                fontWeight: '500',
                lineHeight: 1.3
              }}>
                Het is tijd voor je {nextMeal.timeSlot || 'maaltijd'}!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
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
      `}</style>
    </div>
  )
}
