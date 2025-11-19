// src/modules/client-meal-base/components/StandardFoodsSection.jsx
import StandardFoodSlot from './StandardFoodSlot'

const categoryConfig = {
  protein: {
    emoji: '🥩',
    title: 'Standaard Proteins',
    color: '#ef4444',
    colorRgba: 'rgba(239, 68, 68, X)',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  },
  carbs: {
    emoji: '🍚',
    title: 'Standaard Carbs',
    color: '#f59e0b',
    colorRgba: 'rgba(245, 158, 11, X)',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  meal_prep: {
    emoji: '🍱',
    title: 'Standaard Meal Preps',
    color: '#8b5cf6',
    colorRgba: 'rgba(139, 92, 246, X)',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  }
}

export default function StandardFoodsSection({ 
  standardFoods, 
  onSetFood, 
  onRemoveFood,
  isMobile 
}) {
  console.log('🏗️ [StandardFoodsSection] Component rendered/updated')
  console.log('🔍 [StandardFoodsSection] Props received:', { 
    hasOnSetFood: !!onSetFood, 
    hasOnRemoveFood: !!onRemoveFood,
    onSetFoodType: typeof onSetFood,
    onRemoveFoodType: typeof onRemoveFood,
    standardFoods,
    isMobile
  })
  
  // Test the handlers
  console.log('🧪 [StandardFoodsSection] Testing onSetFood handler:')
  if (typeof onSetFood === 'function') {
    console.log('✅ onSetFood is a function')
  } else {
    console.error('❌ onSetFood is NOT a function!', onSetFood)
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1.5rem' : '2rem',
      paddingTop: isMobile ? '0.5rem' : '0.75rem',
      position: 'relative',
      zIndex: 'auto'
    }}>
      {/* Categories */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '1.5rem' : '2rem'
      }}>
        {Object.entries(categoryConfig).map(([category, config]) => {
          console.log(`📦 [StandardFoodsSection] Rendering category: ${category}`)
          
          return (
            <div key={category} style={{
              position: 'relative',
              zIndex: 'auto'
            }}>
              {/* Premium Category Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.75rem' : '1rem',
                marginBottom: isMobile ? '0.875rem' : '1rem',
                padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
                background: category === 'protein' 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
                  : category === 'carbs'
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
                border: category === 'protein'
                  ? '1px solid rgba(239, 68, 68, 0.2)'
                  : category === 'carbs'
                  ? '1px solid rgba(245, 158, 11, 0.2)'
                  : '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '10px',
                backdropFilter: 'blur(10px)',
                boxShadow: category === 'protein'
                  ? '0 2px 8px rgba(239, 68, 68, 0.08)'
                  : category === 'carbs'
                  ? '0 2px 8px rgba(245, 158, 11, 0.08)'
                  : '0 2px 8px rgba(139, 92, 246, 0.08)',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1
              }}>
                {/* Top overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
                  pointerEvents: 'none',
                  zIndex: 1
                }} />
                
                {/* Icon Container */}
                <div style={{
                  width: isMobile ? '36px' : '42px',
                  height: isMobile ? '36px' : '42px',
                  borderRadius: '10px',
                  background: category === 'protein'
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)'
                    : category === 'carbs'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                  border: category === 'protein'
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : category === 'carbs'
                    ? '1px solid rgba(245, 158, 11, 0.3)'
                    : '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '1.125rem' : '1.375rem',
                  flexShrink: 0,
                  boxShadow: category === 'protein'
                    ? '0 2px 8px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : category === 'carbs'
                    ? '0 2px 8px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 2px 8px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  {config.emoji}
                </div>
                
                {/* Title */}
                <h3 style={{
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '700',
                  color: config.color,
                  margin: 0,
                  letterSpacing: '-0.01em',
                  position: 'relative',
                  zIndex: 2,
                  textShadow: `0 2px 8px ${config.color}20`
                }}>
                  {config.title}
                </h3>
              </div>
              
              {/* Slots Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: isMobile ? '0.75rem' : '1rem',
                position: 'relative',
                zIndex: 10
              }}>
                {[1, 2, 3].map(slotNumber => {
                  console.log(`🎰 [StandardFoodsSection] Creating slot: ${category}-${slotNumber}`)
                  
                  const wrappedOnSet = () => {
                    console.log(`🎯 [StandardFoodsSection] Slot ${slotNumber} onSet wrapper CALLED for category: ${category}`)
                    console.log(`🧪 [StandardFoodsSection] Checking onSetFood before calling:`, {
                      exists: !!onSetFood,
                      type: typeof onSetFood
                    })
                    
                    if (onSetFood) {
                      console.log(`✅ [StandardFoodsSection] Calling parent onSetFood(${category}, ${slotNumber})`)
                      onSetFood(category, slotNumber)
                      console.log(`✅ [StandardFoodsSection] Parent onSetFood called successfully`)
                    } else {
                      console.error(`❌ [StandardFoodsSection] onSetFood is undefined! Cannot call.`)
                    }
                  }
                  
                  const wrappedOnRemove = () => {
                    console.log(`🗑️ [StandardFoodsSection] Slot ${slotNumber} onRemove wrapper CALLED for category: ${category}`)
                    
                    if (onRemoveFood) {
                      console.log(`✅ [StandardFoodsSection] Calling parent onRemoveFood(${category}, ${slotNumber})`)
                      onRemoveFood(category, slotNumber)
                      console.log(`✅ [StandardFoodsSection] Parent onRemoveFood called successfully`)
                    } else {
                      console.error(`❌ [StandardFoodsSection] onRemoveFood is undefined! Cannot call.`)
                    }
                  }
                  
                  console.log(`🎁 [StandardFoodsSection] Passing handlers to slot ${category}-${slotNumber}:`, {
                    hasOnSet: !!wrappedOnSet,
                    hasOnRemove: !!wrappedOnRemove
                  })
                  
                  return (
                    <StandardFoodSlot
                      key={slotNumber}
                      category={category}
                      slotNumber={slotNumber}
                      meal={standardFoods[category]?.[slotNumber - 1]?.meal}
                      color={config.color}
                      gradient={config.gradient}
                      onSet={wrappedOnSet}
                      onRemove={wrappedOnRemove}
                      isMobile={isMobile}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
