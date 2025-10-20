// src/modules/ai-meal-generator/tabs/MealSelector.jsx
// MAIN ORCHESTRATOR - Refactored with Frequency Control System

import { useState, useEffect } from 'react'
import { Utensils, Leaf, Star, Info, Settings2 } from 'lucide-react'

// Import all sub-components
import SearchBar from './meal-selector/SearchBar'
import FilterControls from './meal-selector/FilterControls'
import MealGrid from './meal-selector/MealGrid'
import IngredientGrid from './meal-selector/IngredientGrid'
import ForcedMealsSection from './meal-selector/ForcedMealsSection'
import IngredientSummary from './meal-selector/IngredientSummary'

export default function MealSelector({
  db,
  selectedClient,
  clientProfile,
  forcedMealsConfig,        // Changed from forcedMeals
  setForcedMealsConfig,      // Changed from setForcedMeals
  excludedIngredients,
  setExcludedIngredients,
  selectedIngredients,
  setSelectedIngredients,
  mealPreferences,
  setMealPreferences,
  mealsPerDay,              // NEW: Dynamic meals per day
  isMobile
}) {
  // Main states
  const [activeTab, setActiveTab] = useState('meals')
  const [allMeals, setAllMeals] = useState([])
  const [allIngredients, setAllIngredients] = useState([])
  const [filteredMeals, setFilteredMeals] = useState([])
  const [filteredIngredients, setFilteredIngredients] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTiming, setSelectedTiming] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLabels, setSelectedLabels] = useState([])
  const [selectedCostTier, setSelectedCostTier] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [ingredientMode, setIngredientMode] = useState('exclude')
  
  // Macro filters
  const [macroFilters, setMacroFilters] = useState({
    minProtein: 0,
    maxCalories: 9999,
    minFiber: 0
  })
  
  // Favorites from localStorage
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('aiMealFavorites')
    return saved ? JSON.parse(saved) : []
  })
  
  // Load data on mount
  useEffect(() => {
    if (selectedClient) {
      loadAllData()
    }
  }, [selectedClient])
  
  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [
    searchTerm, 
    selectedTiming, 
    selectedCategory, 
    selectedLabels, 
    selectedCostTier,
    macroFilters, 
    allMeals, 
    allIngredients, 
    activeTab, 
    excludedIngredients, 
    selectedIngredients,
    favorites
  ])
  
  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('aiMealFavorites', JSON.stringify(favorites))
  }, [favorites])
  
  // Load all data from database
  const loadAllData = async () => {
    setLoading(true)
    try {
      // Load AI meals
      console.log('📚 Loading AI meals from database...')
      const meals = await db.getAIMeals()
      
      // Process and score meals
      const scoredMeals = (meals || []).map(meal => ({
        ...meal,
        type: 'meal',
        aiScore: calculateAIScore(meal),
        isFavorite: favorites.includes(`meal-${meal.id}`)
      }))
      
      setAllMeals(scoredMeals)
      console.log(`✅ Loaded ${scoredMeals.length} meals`)
      
      // Load AI ingredients
      console.log('🥦 Loading AI ingredients from database...')
      const ingredients = await db.getAIIngredients()
      
      // Process ingredients
      const processedIngredients = (ingredients || []).map(ing => ({
        ...ing,
        type: 'ingredient',
        isFavorite: favorites.includes(`ingredient-${ing.id}`),
        isExcluded: excludedIngredients.some(exc => exc.id === ing.id),
        isSelected: selectedIngredients.some(sel => sel.id === ing.id),
        displayCalories: ing.calories_per_100g || 0,
        displayProtein: ing.protein_per_100g || 0,
        displayCarbs: ing.carbs_per_100g || 0,
        displayFat: ing.fat_per_100g || 0
      }))
      
      setAllIngredients(processedIngredients)
      console.log(`✅ Loaded ${processedIngredients.length} ingredients`)
      
      // Auto-exclude allergies from profile
      if (clientProfile?.allergies) {
        const allergyList = Array.isArray(clientProfile.allergies) 
          ? clientProfile.allergies 
          : clientProfile.allergies.split(',').map(a => a.trim()).filter(a => a)
        
        if (allergyList.length > 0) {
          const autoExcluded = allergyList.map(allergy => ({
            id: allergy.toLowerCase(),
            name: allergy,
            label: allergy,
            reason: 'allergie'
          }))
          
          setExcludedIngredients(prev => {
            const existing = prev.map(e => e.id)
            const newExclusions = autoExcluded.filter(a => !existing.includes(a.id))
            return [...prev, ...newExclusions]
          })
          
          console.log(`⚠️ Auto-excluded ${allergyList.length} allergens from profile`)
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate AI score for meals
  const calculateAIScore = (meal) => {
    if (!clientProfile) return 0
    
    let score = 0
    
    // Goal alignment (0-30 points)
    if (clientProfile.primary_goal === 'muscle_gain') {
      if (meal.protein > 30) score += 15
      if (meal.protein > 40) score += 10
      if (meal.calories > 500) score += 5
    } else if (clientProfile.primary_goal === 'fat_loss') {
      if (meal.calories < 400) score += 15
      if (meal.protein > 25) score += 10
      if (meal.fiber > 5) score += 5
    }
    
    // Label matching (0-20 points)
    const labels = meal.labels || []
    if (clientProfile.primary_goal === 'muscle_gain' && labels.includes('bulk_friendly')) score += 10
    if (clientProfile.primary_goal === 'fat_loss' && labels.includes('cut_friendly')) score += 10
    if (labels.includes('high_protein')) score += 5
    if (labels.includes('meal_prep')) score += 5
    
    // Dietary matching (0-20 points)
    if (clientProfile.dietary_type === 'vegetarian' && labels.includes('vegetarian')) score += 20
    if (clientProfile.dietary_type === 'vegan' && labels.includes('vegan')) score += 20
    
    // Selected ingredients bonus (0-30 points)
    if (selectedIngredients.length > 0 && meal.ingredients_list) {
      const mealIngredientIds = Array.isArray(meal.ingredients_list)
        ? meal.ingredients_list.map(item => item.ingredient_id)
        : []
      
      const matchCount = selectedIngredients.filter(sel => 
        mealIngredientIds.includes(sel.id)
      ).length
      
      score += Math.min(30, matchCount * 10)
    }
    
    return score
  }
  
  // Apply all filters
  const applyFilters = () => {
    let mealItems = [...allMeals]
    let ingredientItems = [...allIngredients]
    
    if (activeTab === 'meals' || activeTab === 'favorites') {
      // Filter out excluded ingredients
      if (excludedIngredients.length > 0) {
        mealItems = mealItems.filter(meal => {
          if (!meal.ingredients_list) return true
          
          const mealIngredientIds = Array.isArray(meal.ingredients_list)
            ? meal.ingredients_list.map(item => item.ingredient_id)
            : []
          
          const hasExcluded = excludedIngredients.some(exc => 
            mealIngredientIds.includes(exc.id)
          )
          
          return !hasExcluded
        })
      }
      
      // Re-score meals if selected ingredients changed
      if (selectedIngredients.length > 0) {
        mealItems = mealItems.map(meal => ({
          ...meal,
          aiScore: calculateAIScore(meal)
        }))
      }
      
      // Apply timing filter
      if (selectedTiming !== 'all') {
        mealItems = mealItems.filter(meal => 
          meal.timing && meal.timing.includes(selectedTiming)
        )
      }
      
      // Apply label filters
      if (selectedLabels.length > 0) {
        mealItems = mealItems.filter(meal => {
          const mealLabels = meal.labels || []
          return selectedLabels.every(label => mealLabels.includes(label))
        })
      }
      
      // Apply cost tier filter
      if (selectedCostTier !== 'all') {
        mealItems = mealItems.filter(meal => meal.cost_tier === selectedCostTier)
      }
      
      // Apply macro filters
      mealItems = mealItems.filter(meal => {
        return meal.protein >= macroFilters.minProtein &&
               meal.calories <= macroFilters.maxCalories &&
               (meal.fiber || 0) >= macroFilters.minFiber
      })
      
      // Apply search
      if (searchTerm) {
        mealItems = mealItems.filter(meal =>
          meal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meal.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      // Filter favorites tab
      if (activeTab === 'favorites') {
        mealItems = mealItems.filter(meal => meal.isFavorite)
      }
      
      // Sort by AI score, then favorites, then name
      mealItems.sort((a, b) => {
        if (a.aiScore !== b.aiScore) return b.aiScore - a.aiScore
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      
      setFilteredMeals(mealItems)
    }
    
    if (activeTab === 'ingredients' || activeTab === 'favorites') {
      // Update ingredient states
      ingredientItems = ingredientItems.map(ing => ({
        ...ing,
        isExcluded: excludedIngredients.some(exc => exc.id === ing.id),
        isSelected: selectedIngredients.some(sel => sel.id === ing.id)
      }))
      
      // Apply category filter
      if (selectedCategory !== 'all') {
        ingredientItems = ingredientItems.filter(ing => ing.category === selectedCategory)
      }
      
      // Apply search
      if (searchTerm) {
        ingredientItems = ingredientItems.filter(ing =>
          ing.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ing.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      // Filter favorites tab
      if (activeTab === 'favorites') {
        ingredientItems = ingredientItems.filter(ing => ing.isFavorite)
      }
      
      // Sort favorites first, then by name
      ingredientItems.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      
      setFilteredIngredients(ingredientItems)
    }
  }
  
  // Toggle favorite status
  const toggleFavorite = (item) => {
    const itemKey = `${item.type}-${item.id}`
    setFavorites(prev => {
      if (prev.includes(itemKey)) {
        return prev.filter(fav => fav !== itemKey)
      } else {
        return [...prev, itemKey]
      }
    })
    
    // Update item state
    if (item.type === 'meal') {
      setAllMeals(prev => prev.map(meal => 
        meal.id === item.id ? {...meal, isFavorite: !meal.isFavorite} : meal
      ))
    } else {
      setAllIngredients(prev => prev.map(ing => 
        ing.id === item.id ? {...ing, isFavorite: !ing.isFavorite} : ing
      ))
    }
  }
  
  // Add meal to forced meals with frequency config
  const addToForcedMeals = (meal) => {
    // Check if already in forced meals
    if (forcedMealsConfig.some(config => config.meal.id === meal.id)) {
      return
    }
    
    // Create new config with smart defaults
    const newConfig = {
      meal: meal,
      frequency: 7,  // Default to 1x per day
      allowedTimings: meal.timing && meal.timing.length > 0 
        ? meal.timing 
        : ['breakfast', 'lunch', 'dinner', 'snack'],
      locked: false
    }
    
    setForcedMealsConfig([...forcedMealsConfig, newConfig])
    console.log(`➕ Added ${meal.name} to forced meals with frequency 7`)
  }
  
  // Toggle label selection
  const toggleLabel = (labelId) => {
    setSelectedLabels(prev => {
      if (prev.includes(labelId)) {
        return prev.filter(l => l !== labelId)
      } else {
        return [...prev, labelId]
      }
    })
  }
  
  // Handle ingredient click
  const handleIngredientClick = (ingredient) => {
    if (ingredientMode === 'exclude') {
      if (excludedIngredients.some(exc => exc.id === ingredient.id)) {
        // Remove from excluded
        setExcludedIngredients(prev => prev.filter(exc => exc.id !== ingredient.id))
      } else {
        // Add to excluded (remove from selected if present)
        setSelectedIngredients(prev => prev.filter(sel => sel.id !== ingredient.id))
        setExcludedIngredients(prev => [...prev, {
          id: ingredient.id,
          name: ingredient.name,
          label: ingredient.name,
          category: ingredient.category
        }])
      }
    } else {
      if (selectedIngredients.some(sel => sel.id === ingredient.id)) {
        // Remove from selected
        setSelectedIngredients(prev => prev.filter(sel => sel.id !== ingredient.id))
      } else {
        // Add to selected (remove from excluded if present)
        setExcludedIngredients(prev => prev.filter(exc => exc.id !== ingredient.id))
        setSelectedIngredients(prev => [...prev, {
          id: ingredient.id,
          name: ingredient.name,
          label: ingredient.name,
          category: ingredient.category
        }])
      }
    }
  }
  
  // Check if client is selected
  if (!selectedClient) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <Utensils size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <p>Selecteer eerst een client in Tab 1</p>
      </div>
    )
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Header */}
      <div>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Settings2 size={24} style={{ color: '#10b981' }} />
          AI Meal & Ingredient Selection
        </h2>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255,255,255,0.6)'
        }}>
          Configureer maaltijden met frequency control • {mealsPerDay} maaltijden/dag • {7 * mealsPerDay} totale slots
        </p>
      </div>
      
      {/* Main Tabs */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
        borderRadius: isMobile ? '12px' : '14px',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden'
      }}>
        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <button
            onClick={() => setActiveTab('meals')}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '1rem',
              background: activeTab === 'meals' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
                : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'meals' 
                ? '2px solid #10b981' 
                : '2px solid transparent',
              color: activeTab === 'meals' ? '#10b981' : 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: activeTab === 'meals' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Utensils size={18} />
            Maaltijden
            <span style={{
              fontSize: '0.75rem',
              opacity: 0.7
            }}>
              ({allMeals.length})
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('ingredients')}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '1rem',
              background: activeTab === 'ingredients' 
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)'
                : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'ingredients' 
                ? '2px solid #8b5cf6' 
                : '2px solid transparent',
              color: activeTab === 'ingredients' ? '#8b5cf6' : 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: activeTab === 'ingredients' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Leaf size={18} />
            Ingrediënten
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {selectedIngredients.length > 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  background: '#10b981',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: '600'
                }}>
                  {selectedIngredients.length}
                </span>
              )}
              {excludedIngredients.length > 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  background: '#ef4444',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: '600'
                }}>
                  -{excludedIngredients.length}
                </span>
              )}
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            style={{
              flex: 1,
              padding: isMobile ? '0.75rem' : '1rem',
              background: activeTab === 'favorites' 
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)'
                : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'favorites' 
                ? '2px solid #f59e0b' 
                : '2px solid transparent',
              color: activeTab === 'favorites' ? '#f59e0b' : 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: activeTab === 'favorites' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Star size={18} />
            Favorieten
            <span style={{
              fontSize: '0.75rem',
              opacity: 0.7
            }}>
              ({favorites.length})
            </span>
          </button>
        </div>
        
        {/* Tab Content */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          {/* Search Bar */}
          <div style={{ marginBottom: '1rem' }}>
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder={
                activeTab === 'meals' ? "Zoek maaltijden..." :
                activeTab === 'ingredients' ? "Zoek ingrediënten..." :
                "Zoek in favorieten..."
              }
              activeColor={
                activeTab === 'meals' ? '#10b981' :
                activeTab === 'ingredients' ? '#8b5cf6' :
                '#f59e0b'
              }
              isMobile={isMobile}
            />
          </div>
          
          {/* Filters */}
          {(activeTab === 'meals' || activeTab === 'ingredients') && (
            <FilterControls
              activeTab={activeTab}
              selectedTiming={selectedTiming}
              setSelectedTiming={setSelectedTiming}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedLabels={selectedLabels}
              toggleLabel={toggleLabel}
              selectedCostTier={selectedCostTier}
              setSelectedCostTier={setSelectedCostTier}
              ingredientMode={ingredientMode}
              setIngredientMode={setIngredientMode}
              showAdvancedFilters={showAdvancedFilters}
              setShowAdvancedFilters={setShowAdvancedFilters}
              macroFilters={macroFilters}
              setMacroFilters={setMacroFilters}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
      
      {/* Results Grid */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
        borderRadius: isMobile ? '12px' : '14px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: isMobile ? '1rem' : '1.25rem',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#10b981',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.6)' }}>
              Loading {activeTab}...
            </p>
          </div>
        ) : (
          <>
            {(activeTab === 'meals' || activeTab === 'favorites') && (
              <MealGrid
                meals={activeTab === 'favorites' 
                  ? filteredMeals.filter(m => m.isFavorite)
                  : filteredMeals
                }
                onAddToForced={addToForcedMeals}
                onToggleFavorite={toggleFavorite}
                forcedMealsConfig={forcedMealsConfig}
                isMobile={isMobile}
              />
            )}
            
            {activeTab === 'ingredients' && (
              <IngredientGrid
                ingredients={filteredIngredients}
                onIngredientClick={handleIngredientClick}
                onToggleFavorite={toggleFavorite}
                ingredientMode={ingredientMode}
                isMobile={isMobile}
              />
            )}
            
            {activeTab === 'favorites' && filteredIngredients.filter(i => i.isFavorite).length > 0 && (
              <>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#8b5cf6',
                  marginTop: '1.5rem',
                  marginBottom: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                  Favoriete Ingrediënten
                </h4>
                <IngredientGrid
                  ingredients={filteredIngredients.filter(i => i.isFavorite)}
                  onIngredientClick={handleIngredientClick}
                  onToggleFavorite={toggleFavorite}
                  ingredientMode={ingredientMode}
                  isMobile={isMobile}
                />
              </>
            )}
          </>
        )}
      </div>
      
      {/* Forced Meals Section with Frequency Control */}
      <ForcedMealsSection
        forcedMealsConfig={forcedMealsConfig}
        setForcedMealsConfig={setForcedMealsConfig}
        mealsPerDay={mealsPerDay}
        isMobile={isMobile}
      />
      
      {/* Selected/Excluded Ingredients Summary */}
      <IngredientSummary
        selectedIngredients={selectedIngredients}
        excludedIngredients={excludedIngredients}
        onRemoveSelected={(id) => setSelectedIngredients(prev => prev.filter(i => i.id !== id))}
        onRemoveExcluded={(id) => setExcludedIngredients(prev => prev.filter(i => i.id !== id && i.name !== id))}
        isMobile={isMobile}
      />
      
      {/* Info Box */}
      <div style={{
        padding: isMobile ? '0.75rem' : '1rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
        borderRadius: '10px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        color: 'rgba(255,255,255,0.7)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem'
      }}>
        <Info size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <strong>Frequency Control System:</strong> Stel per forced meal exact in hoe vaak deze voorkomt.
          Met {mealsPerDay} maaltijden per dag heb je {7 * mealsPerDay} totale slots te verdelen.
          AI vult de overgebleven slots intelligent op basis van je voorkeuren en macro targets.
        </div>
      </div>
      
      {/* CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Custom scrollbar for grids */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.15);
        }
      `}</style>
    </div>
  )
}
