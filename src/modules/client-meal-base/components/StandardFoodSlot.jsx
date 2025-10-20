// src/modules/client-meal-base/components/StandardFoodSlot.jsx
import { Plus, X } from 'lucide-react'

export default function StandardFoodSlot({ 
  category, 
  slotNumber, 
  meal, 
  color,
  gradient,
  onSet, 
  onRemove,
  isMobile 
}) {
  // Empty slot
  if (!meal) {
    return (
      <button
        onClick={onSet}
        style={{
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'rgba(0, 0, 0, 0.3)',
          border: `2px dashed ${color}30`,
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          minHeight: '100px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${color}10`
          e.currentTarget.style.borderColor = `${color}50`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
          e.currentTarget.style.borderColor = `${color}30`
        }}
      >
        <Plus size={isMobile ? 24 : 28} color={color} />
        <span style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '500'
        }}>
          Stel in
        </span>
      </button>
    )
  }
  
  // Filled slot
  return (
    <div style={{
      position: 'relative',
      padding: isMobile ? '1rem' : '1.25rem',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}30`,
      borderRadius: '12px',
      minHeight: '100px'
    }}>
      {/* Remove button */}
      <button
        onClick={onRemove}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
          e.currentTarget.style.borderColor = '#ef4444'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <X size={16} color="#fff" />
      </button>
      
      {/* Meal name */}
      <div style={{
        fontSize: isMobile ? '0.95rem' : '1rem',
        fontWeight: '600',
        color: '#fff',
        marginBottom: '0.5rem',
        paddingRight: '2rem'
      }}>
        {meal.name}
      </div>
      
      {/* Macros */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '500'
        }}>
          {meal.calories} kcal
        </span>
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: color,
          fontWeight: '600'
        }}>
          {meal.protein}g P
        </span>
        {meal.carbs > 0 && (
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            {meal.carbs}g C
          </span>
        )}
        {meal.fat > 0 && (
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            {meal.fat}g F
          </span>
        )}
      </div>
    </div>
  )
}
