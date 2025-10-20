// src/modules/ai-meal-generator/tabs/meal-selector/FilterControls.jsx
import { 
  Utensils, Coffee, Apple, Cookie, 
  Leaf, Heart, Ban, Filter,
  DollarSign, ChevronDown, ChevronUp
} from 'lucide-react'

export default function FilterControls({
  activeTab,
  selectedTiming,
  setSelectedTiming,
  selectedCategory,
  setSelectedCategory,
  selectedLabels,
  toggleLabel,
  selectedCostTier,
  setSelectedCostTier,
  ingredientMode,
  setIngredientMode,
  showAdvancedFilters,
  setShowAdvancedFilters,
  macroFilters,
  setMacroFilters,
  isMobile
}) {
  // Filter configurations
  const mealTimings = [
    { id: 'all', label: 'Alle', icon: Utensils, color: '#10b981' },
    { id: 'breakfast', label: 'Ontbijt', icon: Coffee, color: '#f59e0b' },
    { id: 'lunch', label: 'Lunch', icon: Apple, color: '#3b82f6' },
    { id: 'dinner', label: 'Diner', icon: Utensils, color: '#ef4444' },
    { id: 'snack', label: 'Snack', icon: Cookie, color: '#8b5cf6' }
  ]
  
  const mealLabels = [
    { id: 'high_protein', label: '💪 High Protein', color: '#10b981' },
    { id: 'low_cal', label: '🥗 Low Cal', color: '#3b82f6' },
    { id: 'meal_prep', label: '📦 Meal Prep', color: '#f59e0b' },
    { id: 'vegetarian', label: '🌱 Vegetarian', color: '#10b981' },
    { id: 'vegan', label: '🌿 Vegan', color: '#059669' },
    { id: 'bulk_friendly', label: '💪 Bulk', color: '#8b5cf6' },
    { id: 'cut_friendly', label: '✂️ Cut', color: '#ef4444' },
    { id: 'quick', label: '⚡ Quick', color: '#ec4899' }
  ]
  
  const ingredientCategories = [
    { id: 'all', label: 'Alle', icon: Leaf, color: '#10b981' },
    { id: 'protein', label: 'Eiwit', icon: null, emoji: '🥩', color: '#ef4444' },
    { id: 'carbs', label: 'Koolhydraten', icon: null, emoji: '🍞', color: '#f59e0b' },
    { id: 'vegetables', label: 'Groente', icon: Leaf, color: '#10b981' },
    { id: 'fruit', label: 'Fruit', icon: Apple, color: '#ec4899' },
    { id: 'dairy', label: 'Zuivel', icon: null, emoji: '🧀', color: '#3b82f6' },
    { id: 'fats', label: 'Vetten', icon: null, emoji: '🥑', color: '#8b5cf6' }
  ]
  
  const costTiers = [
    { id: 'all', label: 'Alle Prijzen', color: '#10b981' },
    { id: 'budget', label: '💰 Budget', color: '#10b981' },
    { id: 'moderate', label: '💳 Moderate', color: '#f59e0b' },
    { id: 'premium', label: '💎 Premium', color: '#ec4899' }
  ]
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '0.75rem' : '1rem'
    }}>
      {/* MEALS TAB FILTERS */}
      {activeTab === 'meals' && (
        <>
          {/* Timing Filter */}
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              Maaltijd Type
            </label>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {mealTimings.map(timing => {
                const Icon = timing.icon
                return (
                  <button
                    key={timing.id}
                    onClick={() => setSelectedTiming(timing.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
                      background: selectedTiming === timing.id
                        ? `linear-gradient(135deg, ${timing.color}20 0%, ${timing.color}10 100%)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedTiming === timing.id ? timing.color : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      color: selectedTiming === timing.id ? timing.color : 'rgba(255,255,255,0.6)',
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      fontWeight: selectedTiming === timing.id ? '600' : '400',
                      cursor: 'pointer',
                      minHeight: isMobile ? '36px' : '40px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTiming !== timing.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.borderColor = `${timing.color}60`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTiming !== timing.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    {Icon && <Icon size={16} />}
                    {timing.label}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Label Filters */}
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              Labels (Multi-select)
            </label>
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              flexWrap: 'wrap'
            }}>
              {mealLabels.map(label => (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  style={{
                    padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
                    background: selectedLabels.includes(label.id)
                      ? `linear-gradient(135deg, ${label.color}25 0%, ${label.color}15 100%)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedLabels.includes(label.id) 
                      ? label.color 
                      : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '6px',
                    color: selectedLabels.includes(label.id) ? label.color : 'rgba(255,255,255,0.6)',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: selectedLabels.includes(label.id) ? '600' : '400',
                    cursor: 'pointer',
                    minHeight: '32px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
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
                  {selectedLabels.includes(label.id) && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, ${label.color}10 0%, transparent 100%)`,
                      pointerEvents: 'none'
                    }} />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {label.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              background: showAdvancedFilters 
                ? 'rgba(139, 92, 246, 0.1)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showAdvancedFilters 
                ? 'rgba(139, 92, 246, 0.3)'
                : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              color: showAdvancedFilters ? '#8b5cf6' : 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%',
              minHeight: '40px',
              touchAction: 'manipulation',
              transition: 'all 0.2s ease'
            }}
          >
            <Filter size={16} />
            Advanced Filters
            {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div style={{
              padding: isMobile ? '0.75rem' : '1rem',
              background: 'rgba(139, 92, 246, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {/* Cost Tier */}
              <div>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#8b5cf6',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}>
                  Prijs Niveau
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {costTiers.map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedCostTier(tier.id)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: selectedCostTier === tier.id
                          ? `${tier.color}20`
                          : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${selectedCostTier === tier.id 
                          ? tier.color 
                          : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '6px',
                        color: selectedCostTier === tier.id ? tier.color : 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                        fontWeight: selectedCostTier === tier.id ? '600' : '400',
                        cursor: 'pointer',
                        minHeight: '32px'
                      }}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Macro Filters */}
              <div>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#8b5cf6',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}>
                  Macro Filters
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '0.5rem'
                }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                      Min Protein (g)
                    </label>
                    <input
                      type="number"
                      value={macroFilters.minProtein}
                      onChange={(e) => setMacroFilters({...macroFilters, minProtein: parseInt(e.target.value) || 0})}
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        minHeight: '32px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                      Max Calories
                    </label>
                    <input
                      type="number"
                      value={macroFilters.maxCalories}
                      onChange={(e) => setMacroFilters({...macroFilters, maxCalories: parseInt(e.target.value) || 9999})}
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        minHeight: '32px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                      Min Fiber (g)
                    </label>
                    <input
                      type="number"
                      value={macroFilters.minFiber}
                      onChange={(e) => setMacroFilters({...macroFilters, minFiber: parseInt(e.target.value) || 0})}
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        minHeight: '32px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* INGREDIENTS TAB FILTERS */}
      {activeTab === 'ingredients' && (
        <>
          {/* Mode Toggle */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.25rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              onClick={() => setIngredientMode('select')}
              style={{
                flex: 1,
                padding: isMobile ? '0.5rem' : '0.6rem',
                background: ingredientMode === 'select'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                  : 'transparent',
                border: ingredientMode === 'select'
                  ? '1px solid #10b981'
                  : '1px solid transparent',
                borderRadius: '8px',
                color: ingredientMode === 'select' ? '#10b981' : 'rgba(255,255,255,0.6)',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: ingredientMode === 'select' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                transition: 'all 0.2s ease'
              }}
            >
              <Heart size={16} />
              Gewenst
            </button>
            
            <button
              onClick={() => setIngredientMode('exclude')}
              style={{
                flex: 1,
                padding: isMobile ? '0.5rem' : '0.6rem',
                background: ingredientMode === 'exclude'
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)'
                  : 'transparent',
                border: ingredientMode === 'exclude'
                  ? '1px solid #ef4444'
                  : '1px solid transparent',
                borderRadius: '8px',
                color: ingredientMode === 'exclude' ? '#ef4444' : 'rgba(255,255,255,0.6)',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: ingredientMode === 'exclude' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                transition: 'all 0.2s ease'
              }}
            >
              <Ban size={16} />
              Uitsluiten
            </button>
          </div>
          
          {/* Category Filter */}
          <div>
            <label style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              Categorie
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
              gap: '0.4rem'
            }}>
              {ingredientCategories.map(cat => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      padding: isMobile ? '0.5rem' : '0.6rem',
                      background: selectedCategory === cat.id
                        ? `linear-gradient(135deg, ${cat.color}20 0%, ${cat.color}10 100%)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedCategory === cat.id 
                        ? cat.color 
                        : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      color: selectedCategory === cat.id ? cat.color : 'rgba(255,255,255,0.6)',
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      fontWeight: selectedCategory === cat.id ? '600' : '400',
                      cursor: 'pointer',
                      minHeight: isMobile ? '50px' : '60px',
                      touchAction: 'manipulation',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {Icon ? <Icon size={18} /> : <span style={{ fontSize: '18px' }}>{cat.emoji}</span>}
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
