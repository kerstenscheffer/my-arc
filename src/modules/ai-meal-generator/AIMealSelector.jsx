// src/modules/ai-meal-generator/AIMealSelector.jsx
import { useState, useEffect } from 'react'
import { Search, Filter, Check, X, ChevronDown, ChevronUp } from 'lucide-react'

export default function AIMealSelector({ db, onSelectionChange }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [allMeals, setAllMeals] = useState([])
  const [selectedMeals, setSelectedMeals] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [expandedCategories, setExpandedCategories] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: true
  })
  const [loading, setLoading] = useState(true)
  
  // Load all meals on mount
  useEffect(() => {
    loadMeals()
  }, [])
  
  const loadMeals = async () => {
    try {
      setLoading(true)
      const meals = await db.getAllMeals()
      
      // Categorize meals properly
      const categorizedMeals = meals.map(meal => {
        if (!meal.category) {
          const name = meal.name.toLowerCase()
          if (/ontbijt|oats|yoghurt|granola|muesli|ei|eggs/i.test(name)) {
            meal.category = 'breakfast'
          } else if (/lunch|salade|salad|bowl|wrap|sandwich|brood/i.test(name)) {
            meal.category = 'lunch'
          } else if (/diner|dinner|curry|pasta|rijst|rice|stamppot|kip|chicken|beef|vis|fish/i.test(name)) {
            meal.category = 'dinner'
          } else {
            meal.category = 'snack'
          }
        }
        
        // Ensure ingredients field exists
        if (!meal.ingredients) {
          meal.ingredients = []
        }
        
        return meal
      })
      
      setAllMeals(categorizedMeals)
      console.log(`✅ Loaded ${meals.length} meals`)
    } catch (error) {
      console.error('❌ Error loading meals:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Toggle meal selection
  const toggleMeal = (mealId) => {
    const newSelection = new Set(selectedMeals)
    if (newSelection.has(mealId)) {
      newSelection.delete(mealId)
    } else {
      newSelection.add(mealId)
    }
    setSelectedMeals(newSelection)
    
    // Notify parent
    const selectedMealObjects = allMeals.filter(m => newSelection.has(m.id))
    onSelectionChange(selectedMealObjects)
  }
  
  // Select all in category
  const selectAllInCategory = (category) => {
    const categoryMeals = filteredMeals.filter(m => m.category === category)
    const newSelection = new Set(selectedMeals)
    categoryMeals.forEach(meal => newSelection.add(meal.id))
    setSelectedMeals(newSelection)
    
    const selectedMealObjects = allMeals.filter(m => newSelection.has(m.id))
    onSelectionChange(selectedMealObjects)
  }
  
  // Clear category
  const clearCategory = (category) => {
    const categoryMeals = allMeals.filter(m => m.category === category)
    const newSelection = new Set(selectedMeals)
    categoryMeals.forEach(meal => newSelection.delete(meal.id))
    setSelectedMeals(newSelection)
    
    const selectedMealObjects = allMeals.filter(m => newSelection.has(m.id))
    onSelectionChange(selectedMealObjects)
  }
  
  // Filter meals
  const filteredMeals = allMeals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || meal.category === filterCategory
    return matchesSearch && matchesCategory
  })
  
  // Group by category
  const mealsByCategory = {
    breakfast: filteredMeals.filter(m => m.category === 'breakfast'),
    lunch: filteredMeals.filter(m => m.category === 'lunch'),
    dinner: filteredMeals.filter(m => m.category === 'dinner'),
    snack: filteredMeals.filter(m => m.category === 'snack')
  }
  
  const categoryIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎'
  }
  
  const categoryNames = {
    breakfast: 'Ontbijt',
    lunch: 'Lunch',
    dinner: 'Diner',
    snack: 'Snacks'
  }
  
  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '2rem',
        textAlign: 'center',
        color: '#10b981'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #10b981',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '1rem' }}>Loading meals...</p>
      </div>
    )
  }
  
  return (
    <div style={{
      background: '#111',
      borderRadius: isMobile ? '12px' : '16px',
      border: '1px solid #333',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderBottom: '1px solid #333',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          fontWeight: 'bold',
          color: '#fff',
          margin: 0
        }}>
          🍽️ Meal Selector
        </h3>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255,255,255,0.9)',
          marginTop: '0.5rem'
        }}>
          Selecteer welke maaltijden in het plan mogen ({selectedMeals.size} geselecteerd)
        </p>
      </div>
      
      {/* Search & Filter Bar */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderBottom: '1px solid #333',
        display: 'flex',
        gap: isMobile ? '0.5rem' : '1rem',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {/* Search */}
        <div style={{
          flex: 1,
          position: 'relative'
        }}>
          <Search size={isMobile ? 16 : 18} style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#10b981'
          }} />
          <input
            type="text"
            placeholder="Zoek maaltijd..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem 1rem 0.75rem 2.5rem' : '1rem 1rem 1rem 3rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: isMobile ? '8px' : '10px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          />
        </div>
        
        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: isMobile ? '8px' : '10px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            cursor: 'pointer',
            touchAction: 'manipulation',
            minHeight: '44px'
          }}
        >
          <option value="all">Alle categorieën</option>
          <option value="breakfast">Ontbijt</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Diner</option>
          <option value="snack">Snacks</option>
        </select>
      </div>
      
      {/* Meals List by Category */}
      <div style={{
        maxHeight: isMobile ? '400px' : '500px',
        overflow: 'auto',
        padding: isMobile ? '0.5rem' : '1rem'
      }}>
        {Object.entries(mealsByCategory).map(([category, meals]) => {
          if (meals.length === 0) return null
          
          const isExpanded = expandedCategories[category]
          const selectedInCategory = meals.filter(m => selectedMeals.has(m.id)).length
          
          return (
            <div key={category} style={{
              marginBottom: '1rem',
              background: '#1a1a1a',
              borderRadius: isMobile ? '8px' : '12px',
              border: '1px solid #333',
              overflow: 'hidden'
            }}>
              {/* Category Header */}
              <div style={{
                padding: isMobile ? '0.75rem' : '1rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                borderBottom: isExpanded ? '1px solid #333' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
              onClick={() => setExpandedCategories(prev => ({
                ...prev,
                [category]: !prev[category]
              }))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }}>
                    {categoryIcons[category]}
                  </span>
                  <span style={{
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '600',
                    color: '#10b981'
                  }}>
                    {categoryNames[category]}
                  </span>
                  <span style={{
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    color: 'rgba(255,255,255,0.5)'
                  }}>
                    ({selectedInCategory}/{meals.length})
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {selectedInCategory > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearCategory(category)
                      }}
                      style={{
                        padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.75rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        cursor: 'pointer',
                        touchAction: 'manipulation'
                      }}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      selectAllInCategory(category)
                    }}
                    style={{
                      padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.75rem',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      color: '#10b981',
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      cursor: 'pointer',
                      touchAction: 'manipulation'
                    }}
                  >
                    Select All
                  </button>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              
              {/* Meals in Category */}
              {isExpanded && (
                <div style={{
                  padding: isMobile ? '0.5rem' : '1rem',
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: isMobile ? '0.5rem' : '0.75rem'
                }}>
                  {meals.map(meal => {
                    const isSelected = selectedMeals.has(meal.id)
                    
                    return (
                      <div
                        key={meal.id}
                        onClick={() => toggleMeal(meal.id)}
                        style={{
                          padding: isMobile ? '0.75rem' : '1rem',
                          background: isSelected 
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                            : '#111',
                          border: isSelected 
                            ? '1px solid #10b981'
                            : '1px solid #333',
                          borderRadius: isMobile ? '8px' : '10px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: 'translateZ(0)',
                          touchAction: 'manipulation',
                          minHeight: '44px'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              fontWeight: '500',
                              color: isSelected ? '#10b981' : '#fff',
                              marginBottom: '0.25rem'
                            }}>
                              {meal.name}
                            </div>
                            <div style={{
                              fontSize: isMobile ? '0.75rem' : '0.875rem',
                              color: 'rgba(255,255,255,0.5)',
                              display: 'flex',
                              gap: '0.5rem'
                            }}>
                              <span>{meal.kcal || 0} kcal</span>
                              <span>P: {meal.protein || 0}g</span>
                              <span>C: {meal.carbs || 0}g</span>
                              <span>F: {meal.fat || 0}g</span>
                            </div>
                            {meal.ingredients && meal.ingredients.length > 0 && (
                              <div style={{
                                fontSize: isMobile ? '0.7rem' : '0.8rem',
                                color: 'rgba(16, 185, 129, 0.7)',
                                marginTop: '0.25rem'
                              }}>
                                📦 {meal.ingredients.length} ingrediënten
                              </div>
                            )}
                          </div>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #10b981' : '2px solid #666',
                            background: isSelected ? '#10b981' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isSelected && <Check size={14} color="#fff" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Summary Footer */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderTop: '1px solid #333',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: '#10b981',
          fontWeight: '600'
        }}>
          {selectedMeals.size} maaltijden geselecteerd
        </div>
        <button
          onClick={() => {
            setSelectedMeals(new Set())
            onSelectionChange([])
          }}
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: isMobile ? '8px' : '10px',
            color: '#ef4444',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '44px'
          }}
        >
          Clear All
        </button>
      </div>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
