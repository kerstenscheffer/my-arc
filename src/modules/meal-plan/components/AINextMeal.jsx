// src/modules/meal-plan/components/AINextMeal.jsx
// ✅ v7.1 - CLEAN: Green only on key elements, rest neutral
// Props IDENTIEK: { nextMeal, todayMeals, onOpenInfo, onOpenAlternatives, onFinishMeal, onOpenDaySchedule, db }
import React, { useState, useEffect } from 'react'
import { Info, RefreshCw, Check, Apple } from 'lucide-react'

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

  const getSlotLabel = (slot) => {
    const labels = {
      breakfast: 'Ontbijt',
      lunch: 'Lunch',
      dinner: 'Diner',
      snack: 'Snack',
      snack1: 'Snack 1',
      snack2: 'Snack 2'
    }
    return labels[slot] || slot || 'Maaltijd'
  }

  // ── COMPLETED STATE ──
  if (!nextMeal) {
    const lastMeal = getLastMeal()
    
    return (
      <div style={{
        position: 'relative',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        overflow: 'hidden'
      }}>
        {lastMeal && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${getMealImage(lastMeal)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            filter: 'blur(2px)'
          }} />
        )}
        
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(5, 150, 105, 0.4) 100%)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem',
          padding: isMobile ? '1.25rem 1rem' : '1.5rem 1.5rem'
        }}>
          <div style={{
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Check size={isMobile ? 20 : 24} color="white" strokeWidth={2.5} />
          </div>
          
          <div>
            <div style={{
              fontSize: isMobile ? '1rem' : '1.15rem',
              fontWeight: '800',
              color: 'white',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Alle maaltijden voltooid!
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: '0.2rem'
            }}>
              Goed gedaan vandaag
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ACTIVE MEAL STATE ──
  return (
    <div style={{
      position: 'relative',
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      overflow: 'hidden'
    }}>
      {/* ── Title bar — neutral, subtle ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.5rem' : '0.625rem',
        padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        overflow: 'hidden',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Icon — neutral */}
        <div style={{
          width: isMobile ? '24px' : '28px',
          height: isMobile ? '24px' : '28px',
          borderRadius: '7px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Apple 
            size={isMobile ? 12 : 14} 
            color="rgba(255, 255, 255, 0.4)"
          />
        </div>
        
        {/* Label + Name */}
        <div style={{ flex: 1, minWidth: 0, width: 0, overflow: 'hidden' }}>
          <div style={{
            fontSize: isMobile ? '0.5rem' : '0.55rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1,
            marginBottom: '0.15rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Volgende — {getSlotLabel(nextMeal.slot)}
          </div>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {nextMeal.name || nextMeal.meal_name || 'Maaltijd'}
          </div>
        </div>

        {/* Kcal badge — neutral */}
        {nextMeal.calories > 0 && (
          <div style={{
            padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.625rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            flexShrink: 0
          }}>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: '900',
              color: '#fff',
              lineHeight: 1,
              letterSpacing: '-0.02em'
            }}>
              {Math.round(nextMeal.calories)}
            </div>
            <div style={{
              fontSize: isMobile ? '0.45rem' : '0.5rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              lineHeight: 1,
              marginTop: '0.1rem'
            }}>
              KCAL
            </div>
          </div>
        )}
      </div>

      {/* ── Image section ── */}
      <div style={{
        position: 'relative',
        height: isMobile ? '130px' : '170px'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${getMealImage(nextMeal)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }} />

        {/* Macro pills — white on dark, no green */}
        {(nextMeal.protein > 0 || nextMeal.carbs > 0 || nextMeal.fat > 0) && (
          <div style={{
            position: 'absolute',
            bottom: isMobile ? '0.5rem' : '0.75rem',
            left: isMobile ? '0.75rem' : '1rem',
            display: 'flex',
            gap: '0.375rem',
            zIndex: 3
          }}>
            {[
              { label: 'E', value: nextMeal.protein },
              { label: 'K', value: nextMeal.carbs },
              { label: 'V', value: nextMeal.fat }
            ].filter(m => m.value > 0).map(macro => (
              <div key={macro.label} style={{
                padding: isMobile ? '0.2rem 0.4rem' : '0.25rem 0.5rem',
                background: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(8px)',
                borderRadius: '5px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.15rem'
              }}>
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  fontWeight: '800',
                  color: 'white'
                }}>
                  {Math.round(macro.value)}
                </span>
                <span style={{
                  fontSize: isMobile ? '0.45rem' : '0.5rem',
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase'
                }}>
                  {macro.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* ── Action buttons — flush, no gaps, fill full width ── */}
      <div style={{
        display: 'flex',
        background: 'rgba(10, 10, 10, 0.95)'
      }}>
        {/* Info */}
        <button
          onClick={() => onOpenInfo(nextMeal)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 0,
            padding: isMobile ? '0.55rem 0' : '0.65rem 0',
            color: 'rgba(255, 255, 255, 0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '40px',
            fontSize: isMobile ? '0.68rem' : '0.75rem',
            fontWeight: '700'
          }}
          onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)' }}
          onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'transparent' }}
        >
          <Info size={isMobile ? 13 : 15} />
          <span>Info</span>
        </button>

        {/* Wissel */}
        <button
          onClick={() => onOpenAlternatives(nextMeal)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 0,
            padding: isMobile ? '0.55rem 0' : '0.65rem 0',
            color: 'rgba(255, 255, 255, 0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '40px',
            fontSize: isMobile ? '0.68rem' : '0.75rem',
            fontWeight: '700'
          }}
          onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)' }}
          onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'transparent' }}
        >
          <RefreshCw size={isMobile ? 13 : 15} />
          <span>Wissel</span>
        </button>

        {/* Afronden — groen */}
        <button
          onClick={() => onFinishMeal(nextMeal)}
          style={{
            flex: 1,
            background: 'rgba(16, 185, 129, 0.1)',
            border: 'none',
            borderRadius: 0,
            padding: isMobile ? '0.55rem 0' : '0.65rem 0',
            color: '#10b981',
            fontSize: isMobile ? '0.68rem' : '0.75rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '40px'
          }}
          onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.18)' }}
          onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)' }}
        >
          <Check size={isMobile ? 13 : 15} strokeWidth={2.5} />
          <span>Afronden</span>
        </button>
      </div>
    </div>
  )
}
