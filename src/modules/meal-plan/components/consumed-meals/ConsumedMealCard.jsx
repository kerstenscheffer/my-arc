// src/modules/meal-plan/components/consumed-meals/ConsumedMealCard.jsx
// ✅ PREMIUM v1.0 - Individual Consumed Meal Card
// 🎯 Displays meal with image, macros, time, and delete option
import React, { useState } from 'react'
import { Clock, Trash2, Flame, Target, Zap, Droplets } from 'lucide-react'
import MacroBadge from './MacroBadge'

const truncateMealName = (name, maxLength) => {
  if (!name) return ''
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength) + '...'
}

const formatTime = (timestamp) => {
  if (!timestamp) return '--:--'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

const getMealTypeLabel = (type) => {
  const labels = {
    breakfast: 'Ontbijt',
    lunch: 'Lunch',
    dinner: 'Diner',
    snack: 'Snack',
    custom: 'Custom Maaltijd',
    custom_assembled: 'Samengesteld',
    quick_add: 'Quick Add',
    existing_meal_flow: 'Bestaande Maaltijd',
    new_meal_flow: 'Nieuwe Maaltijd'
  }
  return labels[type] || 'Maaltijd'
}

export default function ConsumedMealCard({ 
  meal, 
  onDelete, 
  isMobile, 
  getMealImage
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '10px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        transition: 'all 0.3s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: isHovered 
          ? '0 4px 12px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}
    >
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.75rem' : '0.875rem',
        alignItems: 'flex-start'
      }}>
        {/* Meal Image */}
        <div style={{
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '8px',
          background: `url(${getMealImage(meal)}) center/cover`,
          border: '2px solid rgba(16, 185, 129, 0.3)',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }} />
        
        <div style={{ 
          flex: 1, 
          minWidth: 0,
          overflow: 'hidden'
        }}>
          {/* Meal Name + Time */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.375rem',
            minWidth: 0
          }}>
            <div style={{ 
              flex: 1, 
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '0.65rem',
                color: 'rgba(16, 185, 129, 0.7)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.125rem'
              }}>
                {getMealTypeLabel(meal.meal_type || meal.source)}
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                color: 'white',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {truncateMealName(meal.meal_name, isMobile ? 18 : 28)}
              </div>
            </div>
            
            {/* Time Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.375rem',
              background: 'rgba(16, 185, 129, 0.15)',
              borderRadius: '6px',
              fontSize: '0.65rem',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              flexShrink: 0,
              marginLeft: '0.5rem',
              fontWeight: '600',
              backdropFilter: 'blur(8px)'
            }}>
              <Clock size={10} />
              {formatTime(meal.consumed_at)}
            </div>
          </div>
          
          {/* Macro Badges */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.625rem' : '0.75rem',
            marginBottom: onDelete ? '0.5rem' : 0,
            flexWrap: 'wrap'
          }}>
            <MacroBadge icon={Flame} value={meal.calories} label="kcal" color="#10b981" isMobile={isMobile} />
            <MacroBadge icon={Target} value={meal.protein} label="P" color="#8b5cf6" isMobile={isMobile} />
            <MacroBadge icon={Zap} value={meal.carbs} label="C" color="#ef4444" isMobile={isMobile} />
            <MacroBadge icon={Droplets} value={meal.fat} label="F" color="#3b82f6" isMobile={isMobile} />
          </div>
          
          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                marginTop: '0.5rem',
                padding: '0.375rem 0.75rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                backdropFilter: 'blur(8px)',
                minHeight: '32px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <Trash2 size={12} />
              Verwijder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
