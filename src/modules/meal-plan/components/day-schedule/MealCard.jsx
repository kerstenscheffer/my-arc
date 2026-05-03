// src/modules/meal-plan/components/day-schedule/MealCard.jsx
// 🎯 v2.2 - "Tap om te loggen" indicator on unchecked meals
import React, { useState } from 'react'
import { Check, Info, RefreshCw, MoreHorizontal, X } from 'lucide-react'

const getMealImage = (meal) => {
  if (meal?.image_url) return meal.image_url
  const mealType = meal?.slot || 'meal'
  const fallbacks = {
    breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop&q=80',
    lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop&q=80',
    dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop&q=80',
    snack1: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=200&h=200&fit=crop&q=80',
    snack2: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=200&h=200&fit=crop&q=80'
  }
  return fallbacks[mealType] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop&q=80'
}

const getSlotLabel = (slot) => {
  const labels = {
    breakfast: 'Ontbijt',
    lunch: 'Lunch',
    dinner: 'Diner',
    snack1: 'Snack 1',
    snack2: 'Snack 2'
  }
  return labels[slot] || slot || 'Maaltijd'
}

export default function MealCard({ 
  meal, 
  isChecked, 
  isMobile, 
  onCheck, 
  onInfo, 
  onAlternatives,
  isLast = false,
  compact = false
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div style={{
      borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
      opacity: isChecked ? 0.6 : 1,
      transition: 'opacity 0.2s ease'
    }}>
      {/* Main content row: photo | info | more button */}
      <div style={{
        display: 'flex',
        overflow: 'hidden',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Photo — tap to check */}
        <div
          onClick={onCheck}
          style={{
            width: isMobile ? '72px' : '84px',
            height: isMobile ? '72px' : '84px',
            flexShrink: 0,
            background: `url(${getMealImage(meal)}) center/cover`,
            position: 'relative',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          {isChecked ? (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(16, 185, 129, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Check size={isMobile ? 22 : 26} color="white" strokeWidth={3} />
            </div>
          ) : (
            /* Not checked — dark overlay + "log" indicator */
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '0.3rem'
            }}>
              <div style={{
                fontSize: '0.5rem',
                fontWeight: '800',
                color: 'rgba(255, 255, 255, 0.85)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)'
              }}>
                Tap → log
              </div>
            </div>
          )}
        </div>

        {/* Info section */}
        <div style={{
          flex: 1,
          minWidth: 0,
          width: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
          overflow: 'hidden'
        }}>
          {/* Slot label */}
          <div style={{
            fontSize: isMobile ? '0.5rem' : '0.55rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.25)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1,
            marginBottom: '0.2rem'
          }}>
            {getSlotLabel(meal.slot)}
          </div>

          {/* Meal name */}
          <div style={{
            fontSize: isMobile ? '0.82rem' : '0.9rem',
            fontWeight: '800',
            color: isChecked ? 'rgba(255, 255, 255, 0.5)' : '#fff',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: isChecked ? 'line-through' : 'none',
            letterSpacing: '-0.01em'
          }}>
            {meal.meal_name || meal.name || 'Maaltijd'}
          </div>

          {/* Macro row */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.625rem',
            marginTop: '0.3rem',
            overflow: 'hidden'
          }}>
            {[
              { val: meal.calories, label: 'kcal' },
              { val: meal.protein, label: 'E' },
              { val: meal.carbs, label: 'K' },
              { val: meal.fat, label: 'V' }
            ].filter(m => m.val > 0).map(macro => (
              <div key={macro.label} style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.1rem'
              }}>
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '800',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {Math.round(macro.val)}
                </span>
                <span style={{
                  fontSize: isMobile ? '0.5rem' : '0.55rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.2)',
                  textTransform: 'uppercase'
                }}>
                  {macro.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* More button — toggles action row */}
        <button
          onClick={() => setShowActions(!showActions)}
          style={{
            width: isMobile ? '40px' : '44px',
            flexShrink: 0,
            background: showActions ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
            border: 'none',
            borderLeft: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: 0,
            color: showActions ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease',
            padding: 0
          }}
        >
          {showActions 
            ? <X size={isMobile ? 14 : 16} /> 
            : <MoreHorizontal size={isMobile ? 16 : 18} />
          }
        </button>
      </div>

      {/* Expandable action row */}
      {showActions && (
        <div style={{
          display: 'flex',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          animation: 'mealCardSlideDown 0.15s ease'
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onInfo(); setShowActions(false) }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderRight: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: 0,
              padding: isMobile ? '0.45rem 0' : '0.5rem 0',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '36px',
              fontSize: isMobile ? '0.62rem' : '0.68rem',
              fontWeight: '700',
              transition: 'background 0.15s ease'
            }}
            onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)' }}
            onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'transparent' }}
          >
            <Info size={12} />
            <span>Info</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onAlternatives(); setShowActions(false) }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderRight: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: 0,
              padding: isMobile ? '0.45rem 0' : '0.5rem 0',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '36px',
              fontSize: isMobile ? '0.62rem' : '0.68rem',
              fontWeight: '700',
              transition: 'background 0.15s ease'
            }}
            onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)' }}
            onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'transparent' }}
          >
            <RefreshCw size={12} />
            <span>Wissel</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onCheck(); setShowActions(false) }}
            style={{
              flex: 1,
              background: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
              border: 'none',
              borderRadius: 0,
              padding: isMobile ? '0.45rem 0' : '0.5rem 0',
              color: isChecked ? '#10b981' : 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '36px',
              fontSize: isMobile ? '0.62rem' : '0.68rem',
              fontWeight: isChecked ? '800' : '700',
              transition: 'all 0.15s ease'
            }}
            onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = isChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)' }}
            onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = isChecked ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}
          >
            <Check size={12} strokeWidth={2.5} />
            <span>{isChecked ? 'Gelogd' : 'Afronden'}</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes mealCardSlideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 50px; }
        }
      `}</style>
    </div>
  )
}
