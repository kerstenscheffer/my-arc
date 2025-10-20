// src/modules/client-meal-base/components/StandardFoodsSection.jsx
import StandardFoodSlot from './StandardFoodSlot'

const categoryConfig = {
  protein: {
    emoji: '🥩',
    title: 'Standaard Proteins',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  },
  carbs: {
    emoji: '🍚',
    title: 'Standaard Carbs',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  meal_prep: {
    emoji: '🍱',
    title: 'Standaard Meal Preps',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  }
}

export default function StandardFoodsSection({ 
  standardFoods, 
  onSetFood, 
  onRemoveFood,
  isMobile 
}) {
  return (
    <div style={{
      padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
    }}>
      {/* Section Title */}
      <h2 style={{
        fontSize: isMobile ? '1.125rem' : '1.25rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        ⭐ Standaard Foods
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          (Quick Access)
        </span>
      </h2>
      
      {/* Categories */}
      {Object.entries(categoryConfig).map(([category, config]) => (
        <div key={category} style={{ marginBottom: '1.5rem' }}>
          {/* Category Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <span style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
              {config.emoji}
            </span>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '600',
              color: config.color,
              margin: 0
            }}>
              {config.title}
            </h3>
          </div>
          
          {/* Slots Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            {[1, 2, 3].map(slotNumber => (
              <StandardFoodSlot
                key={slotNumber}
                category={category}
                slotNumber={slotNumber}
                meal={standardFoods[category]?.[slotNumber - 1]?.meal}
                color={config.color}
                gradient={config.gradient}
                onSet={() => onSetFood(category, slotNumber)}
                onRemove={() => onRemoveFood(category, slotNumber)}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
