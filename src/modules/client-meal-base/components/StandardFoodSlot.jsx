// src/modules/client-meal-base/components/StandardFoodSlot.jsx
import { Plus, X } from 'lucide-react'
import { useEffect } from 'react'

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
  console.log('🔍 [StandardFoodSlot] Rendering:', { category, slotNumber, hasMeal: !!meal })
  
  // Check if component is actually interactive
  useEffect(() => {
    console.log('✅ [StandardFoodSlot] Mounted:', { category, slotNumber, hasOnSet: !!onSet })
  }, [])
  
  // Empty slot
  if (!meal) {
    return (
      <button
        onClick={(e) => {
          console.log('🖱️ [StandardFoodSlot] EMPTY SLOT CLICKED:', { category, slotNumber, e })
          e.stopPropagation()
          if (onSet) {
            console.log('✅ [StandardFoodSlot] Calling onSet handler')
            onSet()
          } else {
            console.error('❌ [StandardFoodSlot] onSet handler is undefined!')
          }
        }}
        onMouseMove={() => {
          console.log('🐭 [StandardFoodSlot] Mouse moving over empty slot:', { category, slotNumber })
        }}
        style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: 'rgba(0, 0, 0, 0.4)',
          border: `2px dashed ${color}40`,
          borderRadius: isMobile ? '12px' : '14px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: isMobile ? '100px' : '110px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '0.625rem' : '0.75rem',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${color}15`
          e.currentTarget.style.borderColor = `${color}60`
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = `0 4px 12px ${color}15, inset 0 2px 4px rgba(0, 0, 0, 0.1)`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
          e.currentTarget.style.borderColor = `${color}40`
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
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
        {/* Animated gradient overlay on hover */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%)',
          pointerEvents: 'none',  // CRITICAL: Don't block clicks
          opacity: 0,
          transition: 'opacity 0.3s ease'
        }} />
        
        {/* Plus icon with glow */}
        <div style={{
          width: isMobile ? '44px' : '52px',
          height: isMobile ? '44px' : '52px',
          borderRadius: '50%',
          background: `${color}10`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Plus 
            size={isMobile ? 24 : 28} 
            color={color}
            style={{ 
              filter: `drop-shadow(0 0 6px ${color}60)`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>
        
        <span style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '600',
          letterSpacing: '0.01em'
        }}>
          Stel in
        </span>
      </button>
    )
  }
  
  // Filled slot - Premium card
  return (
    <div style={{
      position: 'relative',
      padding: isMobile ? '1rem' : '1.25rem',
      background: category === 'protein'
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)'
        : category === 'carbs'
        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)'
        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
      border: category === 'protein'
        ? '1px solid rgba(239, 68, 68, 0.3)'
        : category === 'carbs'
        ? '1px solid rgba(245, 158, 11, 0.3)'
        : '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: isMobile ? '12px' : '14px',
      minHeight: isMobile ? '100px' : '110px',
      backdropFilter: 'blur(10px)',
      boxShadow: category === 'protein'
        ? '0 2px 8px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : category === 'carbs'
        ? '0 2px 8px rgba(245, 158, 11, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : '0 2px 8px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Top gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
        pointerEvents: 'none'  // CRITICAL: Don't block clicks
      }} />
      
      {/* Premium Remove button */}
      <button
        onClick={(e) => {
          console.log('🖱️ [StandardFoodSlot] REMOVE CLICKED:', { category, slotNumber, meal: meal.name, e })
          e.stopPropagation()
          if (onRemove) {
            console.log('✅ [StandardFoodSlot] Calling onRemove handler')
            onRemove()
          } else {
            console.error('❌ [StandardFoodSlot] onRemove handler is undefined!')
          }
        }}
        style={{
          position: 'absolute',
          top: isMobile ? '0.625rem' : '0.75rem',
          right: isMobile ? '0.625rem' : '0.75rem',
          width: isMobile ? '32px' : '36px',
          height: isMobile ? '32px' : '36px',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          backdropFilter: 'blur(10px)',
          zIndex: 2
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(220, 38, 38, 0.3) 100%)'
          e.currentTarget.style.borderColor = '#ef4444'
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.95)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <X 
          size={isMobile ? 16 : 18} 
          color="#fff"
          style={{ filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.5))' }}
        />
      </button>
      
      {/* Meal name */}
      <div style={{
        fontSize: isMobile ? '0.95rem' : '1.05rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: isMobile ? '0.625rem' : '0.75rem',
        paddingRight: isMobile ? '2.5rem' : '3rem',
        letterSpacing: '-0.01em',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        zIndex: 1
      }}>
        {meal.name}
      </div>
      
      {/* Premium Macro Badges */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.5rem' : '0.625rem',
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Calories badge */}
        <div style={{
          padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.625rem',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '6px',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '600',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          letterSpacing: '0.02em'
        }}>
          {meal.calories} kcal
        </div>
        
        {/* Protein badge - color-coded */}
        <div style={{
          padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.625rem',
          background: `${color}20`,
          border: `1px solid ${color}40`,
          borderRadius: '6px',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: color,
          fontWeight: '700',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 1px 3px ${color}15`,
          letterSpacing: '0.02em',
          textShadow: `0 0 8px ${color}30`
        }}>
          {meal.protein}g P
        </div>
        
        {/* Carbs badge */}
        {meal.carbs > 0 && (
          <div style={{
            padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.625rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            letterSpacing: '0.02em'
          }}>
            {meal.carbs}g C
          </div>
        )}
        
        {/* Fat badge */}
        {meal.fat > 0 && (
          <div style={{
            padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.625rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            letterSpacing: '0.02em'
          }}>
            {meal.fat}g F
          </div>
        )}
      </div>
    </div>
  )
}
