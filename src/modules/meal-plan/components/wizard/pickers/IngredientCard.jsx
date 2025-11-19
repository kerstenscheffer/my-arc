// src/modules/meal-plan/components/wizard/pickers/IngredientCard.jsx
// PREMIUM STYLED - Ingredient card with product photos + glassmorphic design

import { Check, Star, Flame, Target } from 'lucide-react'

export default function IngredientCard({ 
  ingredient,
  isSelected = false,
  isPopular = false, // Changed from isCoachPick to isPopular
  onClick,
  disabled = false
}) {
  const isMobile = window.innerWidth <= 768
  
  // Destructure ingredient data
  const {
    name,
    name_en,
    protein_per_100g,
    carbs_per_100g,
    calories_per_100g,
    fat_per_100g,
    category,
    image_url
  } = ingredient || {}
  
  // Get ingredient image with fallbacks
  const getIngredientImage = () => {
    if (image_url) return image_url
    
    // Category-based fallback images (high quality food photos)
    const fallbacks = {
      protein: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop', // Chicken
      dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=300&fit=crop', // Dairy
      carbs: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop', // Rice
      vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // Vegetables
      fruits: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop', // Fruits
      fats: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop', // Oils
      other: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=300&fit=crop' // Generic food
    }
    
    return fallbacks[category] || fallbacks.other
  }
  
  // Category colors for theme
  const categoryColors = {
    protein: { primary: '#8b5cf6', rgb: '139, 92, 246' },
    dairy: { primary: '#06b6d4', rgb: '6, 182, 212' },
    carbs: { primary: '#f59e0b', rgb: '245, 158, 11' },
    vegetables: { primary: '#22c55e', rgb: '34, 197, 94' },
    fruits: { primary: '#ec4899', rgb: '236, 72, 153' },
    fats: { primary: '#eab308', rgb: '234, 179, 8' },
    other: { primary: '#10b981', rgb: '16, 185, 129' }
  }
  
  const color = categoryColors[category] || categoryColors.other
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        width: '100%',
        background: isSelected
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
          : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
        backdropFilter: 'blur(12px)',
        border: isSelected
          ? '2px solid rgba(16, 185, 129, 0.4)'
          : `1px solid rgba(${color.rgb}, 0.15)`,
        borderRadius: isMobile ? '14px' : '16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        boxShadow: isSelected
          ? '0 12px 32px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
        
        // Touch optimization
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px',
        
        // Hardware acceleration
        transform: isSelected ? 'translateY(-4px)' : 'translateZ(0)',
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isMobile) {
          e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'
          e.currentTarget.style.boxShadow = isSelected
            ? '0 16px 40px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : `0 8px 24px rgba(${color.rgb}, 0.25)`
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = isSelected ? 'translateY(-4px)' : 'translateY(0)'
          e.currentTarget.style.boxShadow = isSelected
            ? '0 12px 32px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)'
        }
      }}
      onTouchStart={(e) => {
        if (!disabled && isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)'
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = isSelected ? 'translateY(-4px)' : 'scale(1)'
        }
      }}
    >
      {/* Top accent line */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          opacity: 0.8,
          zIndex: 3
        }} />
      )}
      
      {/* Shine overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      {/* Product Image Section */}
      <div style={{
        height: isMobile ? '100px' : '120px',
        background: `linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%), url(${getIngredientImage()}) center/cover`,
        position: 'relative'
      }}>
        {/* Popular Badge (Top Right) */}
        {isPopular && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.3rem 0.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '6px',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '800',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.5)',
            zIndex: 2
          }}>
            <Star size={isMobile ? 10 : 11} fill="#fff" />
            <span>Top</span>
          </div>
        )}
        
        {/* Selected Checkmark (Top Left) */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            left: '0.5rem',
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.6)',
            zIndex: 2,
            animation: 'check-bounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          }}>
            <Check size={isMobile ? 16 : 18} color="#fff" strokeWidth={3} />
          </div>
        )}
        
        {/* Category Badge (Bottom Left on Image) */}
        <div style={{
          position: 'absolute',
          bottom: '0.5rem',
          left: '0.5rem',
          padding: '0.25rem 0.5rem',
          background: `rgba(${color.rgb}, 0.9)`,
          backdropFilter: 'blur(10px)',
          borderRadius: '6px',
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          fontWeight: '700',
          color: '#fff',
          textTransform: 'capitalize',
          letterSpacing: '0.03em',
          boxShadow: `0 4px 12px rgba(${color.rgb}, 0.4)`,
          zIndex: 2
        }}>
          {category}
        </div>
      </div>
      
      {/* Content Section */}
      <div style={{
        padding: isMobile ? '0.75rem' : '0.875rem',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Ingredient Name */}
        <div style={{
          marginBottom: '0.625rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '800',
            color: isSelected ? '#10b981' : '#fff',
            margin: '0 0 0.2rem 0',
            transition: 'color 0.3s ease',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {name}
          </h3>
          {name_en && name_en !== name && (
            <p style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0,
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {name_en}
            </p>
          )}
        </div>
        
        {/* Compact Nutrition Info - 2 rows */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          {/* Calories */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Flame size={isMobile ? 12 : 14} color="#f59e0b" />
            <span style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: '700',
              color: '#f59e0b'
            }}>
              {Math.round(calories_per_100g)}
            </span>
          </div>
          
          {/* Main Macro - Show highest value (Protein OR Carbs) */}
          {protein_per_100g >= (carbs_per_100g || 0) ? (
            // Show Protein (purple)
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Target size={isMobile ? 12 : 14} color="#8b5cf6" />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {Math.round(protein_per_100g)}g
              </span>
            </div>
          ) : (
            // Show Carbs (orange)
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Target size={isMobile ? 12 : 14} color="#f59e0b" />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '700',
                color: '#f59e0b'
              }}>
                {Math.round(carbs_per_100g)}g
              </span>
            </div>
          )}
        </div>
        
        {/* Per 100g Label */}
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(255, 255, 255, 0.4)',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Per 100g
        </div>
      </div>
      
      <style>{`
        @keyframes check-bounce {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </button>
  )
}
