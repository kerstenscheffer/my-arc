// src/modules/meal-plan/components/ConsumedMealCard.jsx
// 🎴 MEAL CARD v5.0 - Ultra Compact Premium Design
import React from 'react'
import { Clock, Trash2, Flame, Target, Zap, Droplets } from 'lucide-react'
import { foodImageFallback } from '../foodImageFallback'

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

const getMealImage = (meal) => {
  if (meal?.image_url) return meal.image_url
  // Titel-gebaseerde fallback (kwark -> zuivel, kip -> kip, enz.).
  return foodImageFallback(meal?.name || meal?.title || meal?.product_name, meal?.meal_type, 100)
}

const getMealTypeLabel = (type) => {
  const labels = {
    breakfast: 'Ontbijt',
    lunch: 'Lunch',
    dinner: 'Diner',
    snack: 'Snack',
    custom: 'Custom',
    custom_assembled: 'Samengesteld',
    quick_add: 'Quick Add',
    existing_meal_flow: 'Bestaande Maaltijd',
    new_meal_flow: 'Nieuwe Maaltijd'
  }
  return labels[type] || 'Maaltijd'
}

export default function ConsumedMealCard({ meal, onDelete, isMobile }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      borderRadius: '10px',
      padding: isMobile ? '0.75rem' : '0.875rem',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle glow overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        display: 'flex',
        gap: isMobile ? '0.625rem' : '0.75rem',
        alignItems: 'flex-start',
        position: 'relative'
      }}>
        {/* Compact Image */}
        <div style={{
          width: isMobile ? '44px' : '52px',
          height: isMobile ? '44px' : '52px',
          borderRadius: '8px',
          background: `url(${getMealImage(meal)}) center/cover`,
          border: '2px solid rgba(245, 158, 11, 0.3)',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
        }} />
        
        <div style={{ 
          flex: 1, 
          minWidth: 0
        }}>
          {/* Header Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.375rem',
            gap: '0.5rem'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Type Badge */}
              <div style={{
                fontSize: '0.625rem',
                color: 'rgba(245, 158, 11, 0.7)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.125rem'
              }}>
                {getMealTypeLabel(meal.meal_type || meal.source)}
              </div>
              
              {/* Meal Name */}
              <div style={{
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontWeight: '800',
                color: 'white',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {truncateMealName(meal.meal_name, isMobile ? 20 : 30)}
              </div>
            </div>
            
            {/* Time Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.375rem',
              background: 'rgba(245, 158, 11, 0.15)',
              borderRadius: '6px',
              fontSize: '0.625rem',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              flexShrink: 0,
              fontWeight: '700',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)'
            }}>
              <Clock size={10} />
              {formatTime(meal.consumed_at)}
            </div>
          </div>
          
          {/* Compact Macro Badges */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.625rem',
            marginBottom: onDelete ? '0.5rem' : 0,
            flexWrap: 'wrap'
          }}>
            <MacroBadge icon={Flame} value={meal.calories} label="kcal" color="#f59e0b" isMobile={isMobile} />
            <MacroBadge icon={Target} value={meal.protein} label="P" color="#8b5cf6" isMobile={isMobile} />
            <MacroBadge icon={Zap} value={meal.carbs} label="C" color="#ef4444" isMobile={isMobile} />
            <MacroBadge icon={Droplets} value={meal.fat} label="F" color="#3b82f6" isMobile={isMobile} />
          </div>
          
          {/* Compact Delete Button */}
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                marginTop: '0.5rem',
                padding: '0.375rem 0.625rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '0.7rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <Trash2 size={11} />
              Verwijder
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Ultra Compact Macro Badge
const MacroBadge = ({ icon: Icon, value, label, color, isMobile }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: isMobile ? '0.25rem 0.375rem' : '0.25rem 0.5rem',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '6px',
    border: `1px solid ${color}33`,
    fontSize: isMobile ? '0.675rem' : '0.725rem',
    backdropFilter: 'blur(10px)'
  }}>
    <Icon size={isMobile ? 10 : 11} color={color} />
    <span style={{
      fontWeight: '800',
      color: color
    }}>
      {Math.round(value || 0)}
    </span>
    <span style={{
      color: `${color}99`,
      fontSize: '0.625rem',
      fontWeight: '600'
    }}>
      {label}
    </span>
  </div>
)
