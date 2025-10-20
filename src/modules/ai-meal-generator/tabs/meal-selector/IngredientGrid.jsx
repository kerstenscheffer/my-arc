// src/modules/ai-meal-generator/tabs/meal-selector/IngredientGrid.jsx
import { Star, Check, X, Info, Leaf, DollarSign } from 'lucide-react'

export default function IngredientGrid({
  ingredients,
  onIngredientClick,
  onToggleFavorite,
  ingredientMode,
  isMobile
}) {
  // Get category colors
  const getCategoryColor = (category) => {
    const colors = {
      protein: '#ef4444',
      carbs: '#f59e0b',
      vegetables: '#10b981',
      fruit: '#ec4899',
      dairy: '#3b82f6',
      fats: '#8b5cf6',
      other: '#64748b'
    }
    return colors[category] || '#64748b'
  }
  
  // Get category emoji
  const getCategoryEmoji = (category) => {
    const emojis = {
      protein: '🥩',
      carbs: '🍞',
      vegetables: '🥦',
      fruit: '🍎',
      dairy: '🧀',
      fats: '🥑',
      other: '📦'
    }
    return emojis[category] || '📦'
  }
  
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
      gap: isMobile ? '0.5rem' : '0.75rem'
    }}>
      {ingredients.map(ingredient => (
        <IngredientCard
          key={ingredient.id}
          ingredient={ingredient}
          onClick={onIngredientClick}
          onToggleFavorite={onToggleFavorite}
          mode={ingredientMode}
          categoryColor={getCategoryColor(ingredient.category)}
          categoryEmoji={getCategoryEmoji(ingredient.category)}
          isMobile={isMobile}
        />
      ))}
      
      {/* Empty state */}
      {ingredients.length === 0 && (
        <div style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          padding: '2rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          <Leaf size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <p>Geen ingrediënten gevonden met deze filters</p>
        </div>
      )}
    </div>
  )
}

function IngredientCard({ 
  ingredient, 
  onClick, 
  onToggleFavorite, 
  mode,
  categoryColor,
  categoryEmoji,
  isMobile 
}) {
  const isSelected = ingredient.isSelected
  const isExcluded = ingredient.isExcluded
  const isFavorite = ingredient.isFavorite
  
  // Determine card state and styling
  const getCardStyle = () => {
    if (isExcluded) {
      return {
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
        border: '2px solid rgba(239, 68, 68, 0.5)',
        borderColor: '#ef4444'
      }
    }
    if (isSelected) {
      return {
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
        border: '2px solid rgba(16, 185, 129, 0.5)',
        borderColor: '#10b981'
      }
    }
    if (isFavorite) {
      return {
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderColor: null
      }
    }
    return {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderColor: null
    }
  }
  
  const cardStyle = getCardStyle()
  
  return (
    <div 
      style={{
        ...cardStyle,
        borderRadius: isMobile ? '10px' : '12px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minHeight: isMobile ? '120px' : '140px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={() => onClick(ingredient)}
      onMouseEnter={(e) => {
        if (!isExcluded && !isSelected) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
        }
      }}
      onMouseLeave={(e) => {
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
      {/* Selection Indicator */}
      {(isExcluded || isSelected) && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '8px',
          background: isExcluded 
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${isExcluded ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
        }}>
          {isExcluded ? (
            <X size={16} color="#fff" strokeWidth={3} />
          ) : (
            <Check size={16} color="#fff" strokeWidth={3} />
          )}
        </div>
      )}
      
      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(ingredient)
        }}
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          padding: '0.25rem',
          background: isFavorite
            ? 'rgba(245, 158, 11, 0.2)'
            : 'rgba(255,255,255,0.05)',
          border: 'none',
          borderRadius: '6px',
          color: isFavorite ? '#f59e0b' : 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          minHeight: '24px',
          minWidth: '24px'
        }}
      >
        <Star size={14} fill={isFavorite ? '#f59e0b' : 'none'} />
      </button>
      
      {/* Category badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        marginBottom: '0.5rem',
        paddingLeft: '32px' // Account for favorite button
      }}>
        <span style={{
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px'
        }}>
          {categoryEmoji}
        </span>
        <span style={{
          fontSize: '0.65rem',
          color: categoryColor,
          fontWeight: '600',
          textTransform: 'capitalize'
        }}>
          {ingredient.category}
        </span>
      </div>
      
      {/* Name */}
      <h5 style={{
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        fontWeight: '600',
        color: '#fff',
        marginBottom: '0.5rem',
        lineHeight: '1.3',
        flex: 1
      }}>
        {ingredient.name}
      </h5>
      
      {/* Macros per 100g */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.25rem',
        fontSize: '0.65rem',
        marginBottom: '0.5rem'
      }}>
        <div style={{
          padding: '0.25rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>kcal</div>
          <div style={{ color: '#ef4444', fontWeight: '600' }}>
            {Math.round(ingredient.displayCalories || 0)}
          </div>
        </div>
        
        <div style={{
          padding: '0.25rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>P</div>
          <div style={{ color: '#10b981', fontWeight: '600' }}>
            {Math.round(ingredient.displayProtein || 0)}g
          </div>
        </div>
      </div>
      
      {/* Additional info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: '0.65rem',
        color: 'rgba(255,255,255,0.5)'
      }}>
        {/* Cost tier */}
        {ingredient.cost_tier && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <DollarSign size={10} />
            {ingredient.cost_tier}
          </span>
        )}
        
        {/* Per 100g indicator */}
        <span style={{ fontStyle: 'italic' }}>
          per 100g
        </span>
      </div>
      
      {/* Click hint based on mode */}
      {!isExcluded && !isSelected && (
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.2rem 0.5rem',
          background: mode === 'exclude' 
            ? 'rgba(239, 68, 68, 0.1)' 
            : 'rgba(16, 185, 129, 0.1)',
          borderRadius: '4px',
          fontSize: '0.6rem',
          color: mode === 'exclude' ? '#ef4444' : '#10b981',
          whiteSpace: 'nowrap',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none'
        }}>
          Klik om te {mode === 'exclude' ? 'excluderen' : 'selecteren'}
        </div>
      )}
      
      {/* Allergen warning if applicable */}
      {ingredient.allergens && ingredient.allergens.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '20px',
          height: '20px',
          background: 'rgba(239, 68, 68, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Info size={12} style={{ color: '#ef4444' }} />
        </div>
      )}
    </div>
  )
}
