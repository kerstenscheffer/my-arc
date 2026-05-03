// src/modules/meal-plan/components/food-log/LoggedMealCard.jsx
// 🎯 Timeline card for logged (consumed) meals
// Visual: amber borderLeft + "GELOGD" badge
// Same height/layout as MealCard but distinct color

import React, { useState } from 'react'
import { Trash2, MoreHorizontal, X, Flame } from 'lucide-react'

export default function LoggedMealCard({ 
  meal,         // consumed_meals row
  onDelete,     // (mealId) => void
  isMobile,
  isLast = false 
}) {
  const [showActions, setShowActions] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const formatTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete(meal.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div style={{
      borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
      borderLeft: '3px solid #f59e0b',
      opacity: deleting ? 0.4 : 1,
      transition: 'opacity 0.2s ease'
    }}>
      {/* Main content row */}
      <div style={{
        display: 'flex', overflow: 'hidden',
        maxWidth: '100%', boxSizing: 'border-box'
      }}>
        {/* Badge column — GELOGD */}
        <div style={{
          width: isMobile ? '72px' : '84px',
          flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(245, 158, 11, 0.04)',
          gap: '0.15rem'
        }}>
          <div style={{
            fontSize: '0.4rem', fontWeight: '700',
            color: '#f59e0b', textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            Gelogd
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            fontWeight: '600', color: 'rgba(255, 255, 255, 0.2)'
          }}>
            {formatTime(meal.consumed_at)}
          </div>
        </div>

        {/* Info section */}
        <div style={{
          flex: 1, minWidth: 0, width: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
          overflow: 'hidden'
        }}>
          {/* Meal name */}
          <div style={{
            fontSize: isMobile ? '0.82rem' : '0.9rem',
            fontWeight: '700', color: '#fff',
            lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis', letterSpacing: '-0.01em'
          }}>
            {meal.meal_name || 'Onbekend'}
          </div>

          {/* Macro row */}
          <div style={{
            display: 'flex', gap: isMobile ? '0.5rem' : '0.625rem',
            marginTop: '0.25rem', overflow: 'hidden'
          }}>
            {[
              { val: meal.calories, label: 'kcal' },
              { val: meal.protein, label: 'E' },
              { val: meal.carbs, label: 'K' },
              { val: meal.fat, label: 'V' }
            ].filter(m => m.val > 0).map(macro => (
              <div key={macro.label} style={{
                display: 'flex', alignItems: 'baseline', gap: '0.1rem'
              }}>
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '800', color: 'rgba(245, 158, 11, 0.7)'
                }}>
                  {Math.round(macro.val)}
                </span>
                <span style={{
                  fontSize: isMobile ? '0.5rem' : '0.55rem',
                  fontWeight: '600', color: 'rgba(255, 255, 255, 0.2)',
                  textTransform: 'uppercase'
                }}>
                  {macro.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* More button */}
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
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease', padding: 0
          }}
        >
          {showActions ? <X size={14} /> : <MoreHorizontal size={16} />}
        </button>
      </div>

      {/* Action row */}
      {showActions && (
        <div style={{
          display: 'flex',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          animation: 'lcSlideDown 0.15s ease'
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); setShowActions(false) }}
            style={{
              flex: 1,
              background: 'transparent', border: 'none', borderRadius: 0,
              padding: isMobile ? '0.45rem 0' : '0.5rem 0',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.25rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '36px',
              fontSize: isMobile ? '0.62rem' : '0.68rem',
              fontWeight: '700'
            }}
          >
            <Trash2 size={12} />
            <span>Verwijderen</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes lcSlideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 50px; }
        }
      `}</style>
    </div>
  )
}
