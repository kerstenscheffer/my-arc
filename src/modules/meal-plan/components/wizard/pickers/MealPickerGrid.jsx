// src/modules/meal-plan/components/wizard/pickers/MealPickerGrid.jsx
// PREMIUM STYLED - Meal picker with photos + 2-column grid

import { useState, useEffect } from 'react'
import { CheckCircle, Flame, Target, X } from 'lucide-react'

export default function MealPickerGrid({
  meals = [],
  selectedMealIds = [],
  maxSelection = 3,
  onSelect,
  onRemove,
  filterPresets = 'all',
  showSearch = true,
  showFilters = true,
  emptyMessage = 'Geen maaltijden gevonden'
}) {
  const isMobile = window.innerWidth <= 768
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState([])
  const [filteredMeals, setFilteredMeals] = useState([])

  // Get meal image with fallbacks
  const getMealImage = (meal) => {
    if (meal.image_url) return meal.image_url
    
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=400&h=300&fit=crop'
    }
    
    const type = meal.timing?.[0] || meal.meal_type || 'lunch'
    return fallbacks[type] || fallbacks.lunch
  }

  // Filter options
  const getFilterOptions = () => {
    if (filterPresets === 'meal_prep') {
      return [
        { id: 'meal_prep', label: 'Meal Prep', icon: '🍱' },
        { id: 'high_protein', label: 'Hoog Eiwit', icon: '💪' },
        { id: 'freezer_friendly', label: 'Vriesvriendelijk', icon: '❄️' },
        { id: 'bulk_friendly', label: 'Bulk Friendly', icon: '📦' }
      ]
    } else if (filterPresets === 'quick') {
      return [
        { id: 'quick', label: 'Snel (<20min)', icon: '⚡' },
        { id: 'breakfast', label: 'Ontbijt', icon: '🌅' },
        { id: 'snack', label: 'Snack', icon: '🍎' },
        { id: 'convenient', label: 'Makkelijk', icon: '👌' }
      ]
    } else {
      return [
        { id: 'high_protein', label: 'Hoog Eiwit', icon: '💪' },
        { id: 'quick', label: 'Snel', icon: '⚡' },
        { id: 'meal_prep', label: 'Meal Prep', icon: '🍱' },
        { id: 'breakfast', label: 'Ontbijt', icon: '🌅' },
        { id: 'lunch', label: 'Lunch', icon: '🍽️' },
        { id: 'dinner', label: 'Diner', icon: '🍖' }
      ]
    }
  }

  const filterOptions = getFilterOptions()

  // Filter meals
  useEffect(() => {
    let result = [...meals]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(meal => 
        meal.name.toLowerCase().includes(query)
      )
    }

    if (activeFilters.length > 0) {
      result = result.filter(meal => {
        const mealLabels = meal.labels || []
        const mealTiming = meal.timing || []
        const allMealTags = [...mealLabels, ...mealTiming]
        return activeFilters.some(filter => allMealTags.includes(filter))
      })
    }

    result.sort((a, b) => {
      const aSelected = selectedMealIds.includes(a.id)
      const bSelected = selectedMealIds.includes(b.id)
      
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      
      return (b.protein || 0) - (a.protein || 0)
    })

    setFilteredMeals(result)
  }, [meals, searchQuery, activeFilters, selectedMealIds])

  const toggleFilter = (filterId) => {
    setActiveFilters(prev => 
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    )
  }

  const handleMealClick = (meal) => {
    if (selectedMealIds.includes(meal.id)) {
      onRemove(meal.id)
    } else if (selectedMealIds.length < maxSelection) {
      onSelect(meal.id)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Search Bar */}
      {showSearch && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="🔍 Zoek maaltijden..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.875rem 1.125rem' : '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: isMobile ? '12px' : '14px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '500',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(23, 23, 23, 0.8) 100%)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.25)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.1)'
            }}
          />
        </div>
      )}

      {/* Filter Chips */}
      {showFilters && (
        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {filterOptions.map(filter => (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              style={{
                padding: isMobile ? '0.5rem 0.875rem' : '0.5rem 1rem',
                background: activeFilters.includes(filter.id)
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: activeFilters.includes(filter.id)
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: activeFilters.includes(filter.id)
                  ? '#10b981'
                  : 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {filter.icon} {filter.label}
            </button>
          ))}
          
          {activeFilters.length > 0 && (
            <button
              onClick={() => setActiveFilters([])}
              style={{
                padding: isMobile ? '0.5rem 0.875rem' : '0.5rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ✕ Reset
            </button>
          )}
        </div>
      )}

      {/* Selection Counter */}
      {maxSelection > 0 && (
        <div style={{
          marginBottom: '1rem',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: isMobile ? '12px' : '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{
            position: 'relative',
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            color: '#fff',
            fontWeight: '700'
          }}>
            Geselecteerd
          </div>
          <div style={{
            position: 'relative',
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '900',
            color: selectedMealIds.length === maxSelection ? '#10b981' : '#10b981',
            filter: selectedMealIds.length === maxSelection 
              ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
              : 'none'
          }}>
            {selectedMealIds.length}/{maxSelection}
          </div>
        </div>
      )}

      {/* Premium Meals Grid - 2 Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)', // Always 2 columns
        gap: isMobile ? '0.875rem' : '1rem',
        maxHeight: isMobile ? '400px' : '500px',
        overflowY: 'auto',
        paddingRight: '0.5rem'
      }}>
        {filteredMeals.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.95rem' : '1rem'
          }}>
            {emptyMessage}
          </div>
        ) : (
          filteredMeals.map(meal => {
            const isSelected = selectedMealIds.includes(meal.id)
            const canSelect = selectedMealIds.length < maxSelection || isSelected
            
            return (
              <button
                key={meal.id}
                onClick={() => canSelect && handleMealClick(meal)}
                disabled={!canSelect}
                style={{
                  position: 'relative',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: isSelected
                    ? '2px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: isMobile ? '14px' : '16px',
                  cursor: canSelect ? 'pointer' : 'not-allowed',
                  opacity: canSelect ? 1 : 0.5,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  boxShadow: isSelected
                    ? '0 12px 32px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    : '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  transform: isSelected ? 'translateY(-4px)' : 'translateZ(0)',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (canSelect && !isMobile) {
                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'
                    e.currentTarget.style.boxShadow = isSelected
                      ? '0 16px 40px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                      : '0 8px 24px rgba(16, 185, 129, 0.25)'
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
                  if (canSelect && isMobile) {
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

                {/* Photo Section */}
                <div style={{
                  height: isMobile ? '100px' : '120px',
                  background: `linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%), url(${getMealImage(meal)}) center/cover`,
                  position: 'relative'
                }}>
                  {/* Selected Check (Top Left) */}
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
                      <CheckCircle size={isMobile ? 16 : 18} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                  
                  {/* Labels (Bottom) */}
                  {meal.labels && meal.labels.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0.5rem',
                      left: '0.5rem',
                      right: '0.5rem',
                      display: 'flex',
                      gap: '0.25rem',
                      flexWrap: 'wrap',
                      zIndex: 2
                    }}>
                      {meal.labels.slice(0, 2).map((label, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '0.2rem 0.4rem',
                            background: 'rgba(16, 185, 129, 0.9)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '4px',
                            fontSize: '0.6rem',
                            color: '#fff',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                          }}
                        >
                          {label.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div style={{
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  position: 'relative',
                  zIndex: 2
                }}>
                  {/* Title */}
                  <h4 style={{
                    fontSize: isMobile ? '0.95rem' : '1.05rem',
                    fontWeight: '800',
                    color: isSelected ? '#10b981' : '#fff',
                    margin: '0 0 0.5rem 0',
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {meal.name}
                  </h4>
                  
                  {/* Compact Macros */}
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#f59e0b',
                      fontWeight: '700'
                    }}>
                      <Flame size={isMobile ? 12 : 14} />
                      {Math.round(meal.calories)}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#8b5cf6',
                      fontWeight: '700'
                    }}>
                      <Target size={isMobile ? 12 : 14} />
                      {Math.round(meal.protein)}g
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
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
    </div>
  )
}
