// src/modules/ai-meal-generator/tabs/meal-selector/IngredientSummary.jsx
import { Heart, Ban, X, Info } from 'lucide-react'

export default function IngredientSummary({
  selectedIngredients,
  excludedIngredients,
  onRemoveSelected,
  onRemoveExcluded,
  isMobile
}) {
  // Don't render if nothing to show
  if (selectedIngredients.length === 0 && excludedIngredients.length === 0) {
    return null
  }
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
      borderRadius: isMobile ? '12px' : '14px',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: isMobile ? '1rem' : '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* Selected Ingredients */}
      {selectedIngredients.length > 0 && (
        <div>
          <h3 style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '600',
            color: '#10b981',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Heart size={18} />
            Gewenste Ingrediënten
            <span style={{
              marginLeft: 'auto',
              padding: '0.2rem 0.6rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {selectedIngredients.length}
            </span>
          </h3>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            {selectedIngredients.map(ing => (
              <IngredientChip
                key={ing.id}
                ingredient={ing}
                onRemove={() => onRemoveSelected(ing.id)}
                color="#10b981"
                isMobile={isMobile}
              />
            ))}
          </div>
          
          {/* Info message */}
          <div style={{
            marginTop: '0.75rem',
            padding: '0.5rem',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.6)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.4rem'
          }}>
            <Info size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: '0.1rem' }} />
            <span>
              AI zal maaltijden met deze ingrediënten prioriteren en hoger scoren.
            </span>
          </div>
        </div>
      )}
      
      {/* Excluded Ingredients */}
      {excludedIngredients.length > 0 && (
        <div>
          <h3 style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '600',
            color: '#ef4444',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Ban size={18} />
            Uitgesloten Ingrediënten
            <span style={{
              marginLeft: 'auto',
              padding: '0.2rem 0.6rem',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {excludedIngredients.length}
            </span>
          </h3>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            {excludedIngredients.map(ing => (
              <IngredientChip
                key={ing.id || ing.name}
                ingredient={ing}
                onRemove={() => onRemoveExcluded(ing.id || ing.name)}
                color="#ef4444"
                isExcluded={true}
                isMobile={isMobile}
              />
            ))}
          </div>
          
          {/* Warning for allergies */}
          {excludedIngredients.some(ing => ing.reason === 'allergie') && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem'
            }}>
              <Info size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '0.1rem' }} />
              <span>
                Items gemarkeerd met "allergie" zijn automatisch toegevoegd vanuit je profiel.
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Summary stats */}
      <div style={{
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-around',
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.6)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>Impact Score</div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#8b5cf6' }}>
            {Math.min(100, (selectedIngredients.length * 10) + (excludedIngredients.length * 5))}%
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>Filters Active</div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#f59e0b' }}>
            {selectedIngredients.length + excludedIngredients.length}
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', marginBottom: '0.25rem' }}>Mode</div>
          <div style={{ 
            fontSize: '0.9rem',
            fontWeight: '600',
            color: selectedIngredients.length > excludedIngredients.length ? '#10b981' : '#ef4444'
          }}>
            {selectedIngredients.length > excludedIngredients.length ? 'Inclusive' : 'Exclusive'}
          </div>
        </div>
      </div>
    </div>
  )
}

// Individual ingredient chip component
function IngredientChip({ ingredient, onRemove, color, isExcluded, isMobile }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
      border: `1px solid ${color}40`,
      borderRadius: '8px',
      fontSize: isMobile ? '0.8rem' : '0.85rem',
      color: '#fff',
      position: 'relative',
      paddingRight: isMobile ? '2rem' : '2.25rem',
      maxWidth: '200px'
    }}>
      {/* Name */}
      <span style={{
        fontWeight: '500',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {ingredient.label || ingredient.name}
      </span>
      
      {/* Reason badge if applicable */}
      {ingredient.reason && (
        <span style={{
          padding: '0.1rem 0.3rem',
          background: `${color}30`,
          borderRadius: '4px',
          fontSize: '0.65rem',
          fontWeight: '600',
          color: color,
          textTransform: 'capitalize'
        }}>
          {ingredient.reason}
        </span>
      )}
      
      {/* Remove button */}
      <button
        onClick={onRemove}
        style={{
          position: 'absolute',
          right: '0.25rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: `${color}20`,
          border: `1px solid ${color}40`,
          borderRadius: '6px',
          color: color,
          cursor: 'pointer',
          padding: '0.25rem',
          minHeight: '24px',
          minWidth: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${color}30`
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${color}20`
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
          }
        }}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}
