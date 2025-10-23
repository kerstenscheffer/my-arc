// src/modules/meal-plan/components/wizard/pickers/IngredientCard.jsx
// Single ingredient card met selectie + coach pick badge

import { Check, Star } from 'lucide-react'

export default function IngredientCard({ 
  ingredient,
  isSelected = false,
  isCoachPick = false,
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
    category
  } = ingredient || {}
  
  // Category colors
  const categoryColors = {
    protein: {
      primary: '#f97316',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      glow: '0 8px 20px rgba(249, 115, 22, 0.3)'
    },
    carbs: {
      primary: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      glow: '0 8px 20px rgba(59, 130, 246, 0.3)'
    }
  }
  
  const color = categoryColors[category] || categoryColors.protein
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        width: '100%',
        padding: isMobile ? '1rem' : '1.25rem',
        background: isSelected
          ? `linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)`
          : 'rgba(17, 17, 17, 0.6)',
        backdropFilter: 'blur(20px)',
        border: isSelected
          ? '2px solid #10b981'
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: isMobile ? '14px' : '16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'left',
        boxShadow: isSelected
          ? '0 8px 25px rgba(16, 185, 129, 0.3)'
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
        
        // Touch optimization
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px',
        
        // Hardware acceleration
        transform: isSelected ? 'translateY(-2px) scale(1.02)' : 'translateZ(0)',
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isMobile) {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'
          e.currentTarget.style.boxShadow = isSelected
            ? '0 12px 30px rgba(16, 185, 129, 0.4)'
            : '0 8px 20px rgba(0, 0, 0, 0.4)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = isSelected 
            ? 'translateY(-2px) scale(1.02)' 
            : 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = isSelected
            ? '0 8px 25px rgba(16, 185, 129, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.3)'
        }
      }}
      onTouchStart={(e) => {
        if (!disabled && isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)'
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = isSelected 
            ? 'translateY(-2px) scale(1.02)' 
            : 'scale(1)'
        }
      }}
    >
      {/* Coach's Pick Badge */}
      {isCoachPick && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '8px' : '10px',
          right: isMobile ? '8px' : '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '6px',
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          fontWeight: '700',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
          zIndex: 2
        }}>
          <Star size={isMobile ? 10 : 11} fill="#fff" />
          <span>Coach</span>
        </div>
      )}
      
      {/* Selected Checkmark */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '8px' : '10px',
          left: isMobile ? '8px' : '10px',
          width: isMobile ? '24px' : '28px',
          height: isMobile ? '24px' : '28px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.5)',
          zIndex: 2,
          animation: 'check-bounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }}>
          <Check size={isMobile ? 14 : 16} color="#fff" strokeWidth={3} />
        </div>
      )}
      
      {/* Ingredient Name */}
      <div style={{
        marginTop: isSelected || isCoachPick ? '1.5rem' : '0',
        marginBottom: '0.75rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '700',
          color: isSelected ? '#10b981' : '#fff',
          margin: '0 0 0.25rem 0',
          transition: 'color 0.3s ease'
        }}>
          {name}
        </h3>
        {name_en && name_en !== name && (
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0,
            fontWeight: '500'
          }}>
            {name_en}
          </p>
        )}
      </div>
      
      {/* Nutrition Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: isMobile ? '0.5rem' : '0.625rem'
      }}>
        {/* Calories */}
        <div>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            marginBottom: '0.25rem',
            fontWeight: '600'
          }}>
            Kcal
          </div>
          <div style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '700',
            color: color.primary
          }}>
            {Math.round(calories_per_100g)}
          </div>
        </div>
        
        {/* Protein (voor protein category) */}
        {category === 'protein' && (
          <div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              marginBottom: '0.25rem',
              fontWeight: '600'
            }}>
              Eiwit
            </div>
            <div style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '700',
              color: '#fff'
            }}>
              {Math.round(protein_per_100g)}g
            </div>
          </div>
        )}
        
        {/* Carbs (voor carbs category) */}
        {category === 'carbs' && (
          <div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              marginBottom: '0.25rem',
              fontWeight: '600'
            }}>
              Carbs
            </div>
            <div style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '700',
              color: '#fff'
            }}>
              {Math.round(carbs_per_100g)}g
            </div>
          </div>
        )}
        
        {/* Per 100g label */}
        <div>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            marginBottom: '0.25rem',
            fontWeight: '600'
          }}>
            Per
          </div>
          <div style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            100g
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes check-bounce {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </button>
  )
}
