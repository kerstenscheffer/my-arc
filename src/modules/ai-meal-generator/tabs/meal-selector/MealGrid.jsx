// src/modules/ai-meal-generator/tabs/meal-selector/MealGrid.jsx
import { Star, Zap, Info, Clock, DollarSign, Award } from 'lucide-react'

export default function MealGrid({
  meals,
  onAddToForced,
  onToggleFavorite,
  forcedMealsConfig,
  isMobile
}) {
  // Check if meal is already forced
  const isMealForced = (mealId) => {
    return forcedMealsConfig.some(config => config.meal.id === mealId)
  }
  
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: isMobile ? '0.75rem' : '1rem'
    }}>
      {meals.map(meal => (
        <MealCard
          key={meal.id}
          meal={meal}
          onAddToForced={onAddToForced}
          onToggleFavorite={onToggleFavorite}
          isForced={isMealForced(meal.id)}
          isMobile={isMobile}
        />
      ))}
      
      {/* Empty state */}
      {meals.length === 0 && (
        <div style={{
          gridColumn: isMobile ? '1' : '1 / -1',
          textAlign: 'center',
          padding: '2rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          <p>Geen maaltijden gevonden met deze filters</p>
        </div>
      )}
    </div>
  )
}

function MealCard({ meal, onAddToForced, onToggleFavorite, isForced, isMobile }) {
  // Format labels for display
  const formatLabel = (label) => {
    const labelMap = {
      'high_protein': '💪 High Protein',
      'low_cal': '🥗 Low Cal',
      'meal_prep': '📦 Meal Prep',
      'vegetarian': '🌱 Vegetarian',
      'vegan': '🌿 Vegan',
      'bulk_friendly': '💪 Bulk',
      'cut_friendly': '✂️ Cut',
      'quick': '⚡ Quick'
    }
    return labelMap[label] || label
  }
  
  // Calculate calories per euro if cost available
  const caloriesPerEuro = meal.total_cost 
    ? Math.round(meal.calories / meal.total_cost) 
    : null
  
  return (
    <div style={{
      background: meal.isFavorite 
        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)' 
        : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
      borderRadius: isMobile ? '10px' : '12px',
      border: meal.isFavorite 
        ? '1px solid rgba(245, 158, 11, 0.3)'
        : isForced 
          ? '1px solid rgba(245, 158, 11, 0.5)'
          : '1px solid rgba(255,255,255,0.1)',
      padding: isMobile ? '0.875rem' : '1rem',
      position: 'relative',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    {/* AI Score Badge */}
    {meal.aiScore > 0 && (
      <div style={{
        position: 'absolute',
        top: '-8px',
        left: '10px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '6px',
        padding: '2px 8px',
        fontSize: '0.65rem',
        fontWeight: '700',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
      }}>
        <Award size={12} />
        AI: {meal.aiScore}
      </div>
    )}
    
    {/* Forced indicator */}
    {isForced && (
      <div style={{
        position: 'absolute',
        top: '-8px',
        right: '10px',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        borderRadius: '6px',
        padding: '2px 8px',
        fontSize: '0.65rem',
        fontWeight: '700',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
      }}>
        <Zap size={12} />
        FORCED
      </div>
    )}
    
    {/* Header with title and actions */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '0.75rem'
    }}>
      <div style={{ flex: 1, paddingRight: '0.5rem' }}>
        <h4 style={{
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '0.25rem',
          lineHeight: '1.3'
        }}>
          {meal.name}
        </h4>
        
        {/* Timing & cost tier */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          {meal.timing && meal.timing.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={10} />
              {meal.timing.join(', ')}
            </span>
          )}
          {meal.cost_tier && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <DollarSign size={10} />
              {meal.cost_tier}
            </span>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button
          onClick={() => onToggleFavorite(meal)}
          style={{
            padding: '0.4rem',
            background: meal.isFavorite
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.15) 100%)'
              : 'rgba(255,255,255,0.05)',
            border: meal.isFavorite
              ? '1px solid rgba(245, 158, 11, 0.4)'
              : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: meal.isFavorite ? '#f59e0b' : 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            minHeight: '32px',
            minWidth: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation'
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
          <Star size={16} fill={meal.isFavorite ? '#f59e0b' : 'none'} />
        </button>
        
        <button
          onClick={() => onAddToForced(meal)}
          disabled={isForced}
          style={{
            padding: '0.4rem',
            background: isForced
              ? 'rgba(245, 158, 11, 0.2)'
              : 'rgba(255,255,255,0.05)',
            border: isForced
              ? '1px solid rgba(245, 158, 11, 0.5)'
              : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: isForced ? '#f59e0b' : 'rgba(255,255,255,0.6)',
            cursor: isForced ? 'not-allowed' : 'pointer',
            minHeight: '32px',
            minWidth: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            opacity: isForced ? 0.5 : 1
          }}
          onTouchStart={(e) => {
            if (isMobile && !isForced) {
              e.currentTarget.style.transform = 'scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile && !isForced) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <Zap size={16} />
        </button>
      </div>
    </div>
    
    {/* Labels */}
    {meal.labels && meal.labels.length > 0 && (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.25rem',
        marginBottom: '0.75rem'
      }}>
        {meal.labels.slice(0, 4).map(label => (
          <span 
            key={label}
            style={{
              padding: '0.15rem 0.4rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '4px',
              fontSize: '0.65rem',
              color: '#10b981',
              fontWeight: '500'
            }}
          >
            {formatLabel(label)}
          </span>
        ))}
        {meal.labels.length > 4 && (
          <span style={{
            padding: '0.15rem 0.4rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.5)'
          }}>
            +{meal.labels.length - 4}
          </span>
        )}
      </div>
    )}
    
    {/* Macros Grid */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '0.5rem',
      marginBottom: '0.75rem'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '0.5rem 0.25rem',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '6px',
        border: '1px solid rgba(239, 68, 68, 0.15)'
      }}>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.1rem' }}>
          kcal
        </div>
        <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '700', color: '#ef4444' }}>
          {Math.round(meal.calories)}
        </div>
      </div>
      
      <div style={{
        textAlign: 'center',
        padding: '0.5rem 0.25rem',
        background: 'rgba(16, 185, 129, 0.1)',
        borderRadius: '6px',
        border: '1px solid rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.1rem' }}>
          P
        </div>
        <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '700', color: '#10b981' }}>
          {Math.round(meal.protein)}g
        </div>
      </div>
      
      <div style={{
        textAlign: 'center',
        padding: '0.5rem 0.25rem',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '6px',
        border: '1px solid rgba(59, 130, 246, 0.15)'
      }}>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.1rem' }}>
          C
        </div>
        <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '700', color: '#3b82f6' }}>
          {Math.round(meal.carbs)}g
        </div>
      </div>
      
      <div style={{
        textAlign: 'center',
        padding: '0.5rem 0.25rem',
        background: 'rgba(245, 158, 11, 0.1)',
        borderRadius: '6px',
        border: '1px solid rgba(245, 158, 11, 0.15)'
      }}>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.1rem' }}>
          F
        </div>
        <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '700', color: '#f59e0b' }}>
          {Math.round(meal.fat)}g
        </div>
      </div>
    </div>
    
    {/* Additional info */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      paddingTop: '0.5rem',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      fontSize: '0.7rem',
      color: 'rgba(255,255,255,0.5)'
    }}>
      {meal.prep_time_min && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={11} />
          {meal.prep_time_min + (meal.cook_time_min || 0)} min
        </span>
      )}
      
      {meal.total_cost && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <DollarSign size={11} />
          €{meal.total_cost.toFixed(2)}
        </span>
      )}
      
      {caloriesPerEuro && (
        <span style={{ 
          color: caloriesPerEuro > 200 ? '#10b981' : 'rgba(255,255,255,0.5)',
          fontWeight: caloriesPerEuro > 200 ? '600' : '400'
        }}>
          {caloriesPerEuro} kcal/€
        </span>
      )}
      
      {meal.difficulty && (
        <span style={{ textTransform: 'capitalize' }}>
          {meal.difficulty === 'etm' ? 'Easy' : meal.difficulty}
        </span>
      )}
    </div>
  </div>
  )
}
