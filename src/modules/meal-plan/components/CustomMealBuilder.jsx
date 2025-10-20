// src/modules/meal-plan/components/CustomMealBuilder.jsx
import React, { useState, useEffect } from 'react'
import { 
  Search, Plus, Minus, Save, X, Camera,
  Flame, Target, Zap, Droplets, Euro,
  ChefHat, Clock, AlertCircle, Check, 
  Apple, Fish, Wheat, Milk
} from 'lucide-react'

export default function CustomMealBuilder({ 
  isOpen, 
  onClose, 
  onSave,
  db,
  service, // AIMealPlanService instance
  client // Client object met id
}) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [mealName, setMealName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [instructions, setInstructions] = useState('')
  const [mealType, setMealType] = useState('lunch')
  const [savedMessage, setSavedMessage] = useState('')
  const [allIngredients, setAllIngredients] = useState([])
  
  // Categories met icons
  const categories = [
    { id: 'all', label: 'Alles', color: '#10b981', icon: null },
    { id: 'protein', label: 'Eiwit', color: '#8b5cf6', icon: Fish },
    { id: 'carbs', label: 'Koolhydraten', color: '#f59e0b', icon: Wheat },
    { id: 'fats', label: 'Vetten', color: '#3b82f6', icon: Droplets },
    { id: 'vegetables', label: 'Groenten', color: '#10b981', icon: Apple },
    { id: 'fruit', label: 'Fruit', color: '#fbbf24', icon: Apple },
    { id: 'dairy', label: 'Zuivel', color: '#ec4899', icon: Milk }
  ]
  
  // Meal types
  const mealTypes = [
    { id: 'breakfast', label: 'Ontbijt', color: '#f59e0b' },
    { id: 'lunch', label: 'Lunch', color: '#3b82f6' },
    { id: 'dinner', label: 'Diner', color: '#8b5cf6' },
    { id: 'snack', label: 'Snack', color: '#10b981' }
  ]
  
  // Load all ingredients on mount
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        // Use service method if available, otherwise fallback to db
        if (service?.getAIIngredients) {
          const ingredients = await service.getAIIngredients()
          setAllIngredients(ingredients)
        } else {
          const { data } = await db.supabase
            .from('ai_ingredients')
            .select('*')
            .order('name', { ascending: true })
          
          setAllIngredients(data || [])
        }
      } catch (error) {
        console.error('Failed to load ingredients:', error)
      }
    }
    
    if (isOpen) {
      loadIngredients()
    }
  }, [isOpen, service, db])
  
  // Filter ingredients based on search and category
  useEffect(() => {
    const filterIngredients = () => {
      let filtered = allIngredients
      
      // Category filter
      if (activeCategory !== 'all') {
        filtered = filtered.filter(ing => ing.category === activeCategory)
      }
      
      // Search filter
      if (searchTerm.length >= 2) {
        filtered = filtered.filter(ing => 
          ing.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ing.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      setSearchResults(filtered.slice(0, 30)) // Limit to 30 results
    }
    
    filterIngredients()
  }, [searchTerm, activeCategory, allIngredients])
  
  // Add ingredient
  const addIngredient = (ingredient) => {
    const existing = selectedIngredients.find(i => i.id === ingredient.id)
    if (existing) {
      // Update amount by 50g
      updateIngredientAmount(ingredient.id, existing.amount + 50)
    } else {
      // Add new with default portion
      setSelectedIngredients([...selectedIngredients, {
        ...ingredient,
        amount: ingredient.default_portion_gram || 100
      }])
    }
    setSearchTerm('')
  }
  
  // Update ingredient amount
  const updateIngredientAmount = (id, amount) => {
    if (amount <= 0) {
      removeIngredient(id)
      return
    }
    
    setSelectedIngredients(selectedIngredients.map(ing => 
      ing.id === id ? { ...ing, amount: Math.min(1000, amount) } : ing
    ))
  }
  
  // Remove ingredient
  const removeIngredient = (id) => {
    setSelectedIngredients(selectedIngredients.filter(ing => ing.id !== id))
  }
  
  // Calculate totals
  const calculateTotals = () => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      cost: 0
    }
    
    selectedIngredients.forEach(ing => {
      const factor = ing.amount / 100
      totals.calories += (ing.calories_per_100g || 0) * factor
      totals.protein += (ing.protein_per_100g || 0) * factor
      totals.carbs += (ing.carbs_per_100g || 0) * factor
      totals.fat += (ing.fat_per_100g || 0) * factor
      totals.fiber += (ing.fiber_per_100g || 0) * factor
      totals.cost += (ing.price_per_unit || 0) * (ing.amount / 1000)
    })
    
    return {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      fiber: Math.round(totals.fiber),
      cost: totals.cost.toFixed(2)
    }
  }
  
  const totals = calculateTotals()
  
  // Save meal using service
  const saveMeal = async () => {
    if (!mealName || selectedIngredients.length === 0) {
      alert('Geef je maaltijd een naam en voeg ingrediënten toe')
      return
    }
    
    if (!client?.id) {
      alert('Client ID niet gevonden')
      return
    }
    
    setSaving(true)
    try {
      // Format ingredients for storage
      const ingredientsList = selectedIngredients.map(ing => ({
        ingredient_id: ing.id,
        amount: ing.amount,
        unit: 'gram'
      }))
      
      // Create meal data matching ai_custom_meals table structure
      const mealData = {
        name: mealName,
        ingredients: ingredientsList,
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fiber: totals.fiber,
        total_cost: parseFloat(totals.cost),
        meal_type: [mealType], // Array format
        tips: instructions || null,
        preparation_steps: instructions ? [instructions] : null
      }
      
      // Use service method if available
      let savedMeal
      if (service?.saveAICustomMeal) {
        savedMeal = await service.saveAICustomMeal(client.id, mealData)
      } else {
        // Fallback to direct database
        const { data, error } = await db.supabase
          .from('ai_custom_meals')
          .insert({
            client_id: client.id,
            ...mealData,
            ingredients_list: ingredientsList, // Different column name
            is_active: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) throw error
        savedMeal = data
      }
      
      // Success feedback
      setSavedMessage('Maaltijd opgeslagen! 🎉')
      
      // Also add to favorites automatically
      if (service?.toggleAIFavorite && savedMeal) {
        await service.toggleAIFavorite(client.id, savedMeal.id, savedMeal)
      }
      
      setTimeout(() => {
        if (onSave) onSave(savedMeal)
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Save error:', error)
      alert('Fout bij opslaan: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
      padding: isMobile ? '1rem' : '2rem',
      animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        borderRadius: isMobile ? '20px' : '28px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '800px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(139, 92, 246, 0.05)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(139, 92, 246, 0.08)',
          background: 'rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ChefHat size={24} />
              Eigen Maaltijd Maken
            </h2>
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={20} color="rgba(255, 255, 255, 0.6)" />
            </button>
          </div>
          
          {/* Meal name input */}
          <input
            type="text"
            placeholder="Naam van je maaltijd..."
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '10px',
              color: 'white',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '500',
              outline: 'none',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'
              e.target.style.background = 'rgba(139, 92, 246, 0.05)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          />
          
          {/* Meal type selector */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.75rem'
          }}>
            {mealTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setMealType(type.id)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.5rem' : '0.625rem',
                  background: mealType === type.id
                    ? `linear-gradient(135deg, ${type.color}20 0%, ${type.color}10 100%)`
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${mealType === type.id ? type.color + '40' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '8px',
                  color: mealType === type.id ? type.color : 'rgba(255, 255, 255, 0.5)',
                  fontSize: isMobile ? '0.75rem' : '0.825rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '36px'
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          {/* Search section */}
          <div style={{
            marginBottom: '1.5rem'
          }}>
            {/* Categories */}
            <div style={{
              display: 'flex',
              gap: '0.375rem',
              marginBottom: '1rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              WebkitOverflowScrolling: 'touch'
            }}>
              {categories.map(cat => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                      background: activeCategory === cat.id
                        ? `linear-gradient(135deg, ${cat.color}20 0%, ${cat.color}10 100%)`
                        : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${activeCategory === cat.id ? cat.color + '40' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '8px',
                      color: activeCategory === cat.id ? cat.color : 'rgba(255, 255, 255, 0.6)',
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '36px'
                    }}
                  >
                    {Icon && <Icon size={14} />}
                    {cat.label}
                  </button>
                )
              })}
            </div>
            
            {/* Search input */}
            <div style={{
              position: 'relative'
            }}>
              <Search 
                size={18} 
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}
              />
              <input
                type="text"
                placeholder="Zoek ingrediënt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem 1rem 0.75rem 3rem' : '0.875rem 1rem 0.875rem 3rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  outline: 'none',
                  minHeight: '44px'
                }}
              />
            </div>
            
            {/* Search results */}
            {(searchTerm.length >= 2 || activeCategory !== 'all') && searchResults.length > 0 && (
              <div style={{
                marginTop: '0.5rem',
                maxHeight: '200px',
                overflowY: 'auto',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {searchResults.map(ing => (
                  <button
                    key={ing.id}
                    onClick={() => addIngredient(ing)}
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.75rem' : '0.875rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '44px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span style={{ fontSize: isMobile ? '0.875rem' : '0.9rem' }}>
                      {ing.name}
                    </span>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      <span>{Math.round(ing.calories_per_100g)} kcal</span>
                      <Plus size={16} color="#8b5cf6" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Selected ingredients */}
          <div style={{
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.75rem'
            }}>
              Geselecteerde Ingrediënten ({selectedIngredients.length})
            </h3>
            
            {selectedIngredients.length === 0 ? (
              <div style={{
                padding: '2rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: isMobile ? '0.875rem' : '0.95rem'
              }}>
                Zoek en voeg ingrediënten toe
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {selectedIngredients.map(ing => {
                  const macros = {
                    calories: Math.round((ing.calories_per_100g || 0) * ing.amount / 100),
                    protein: Math.round((ing.protein_per_100g || 0) * ing.amount / 100),
                    carbs: Math.round((ing.carbs_per_100g || 0) * ing.amount / 100),
                    fat: Math.round((ing.fat_per_100g || 0) * ing.amount / 100)
                  }
                  
                  return (
                    <div
                      key={ing.id}
                      style={{
                        padding: isMobile ? '0.75rem' : '0.875rem',
                        background: 'rgba(139, 92, 246, 0.05)',
                        borderRadius: '10px',
                        border: '1px solid rgba(139, 92, 246, 0.1)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontWeight: '500',
                          color: 'white',
                          fontSize: isMobile ? '0.9rem' : '0.95rem'
                        }}>
                          {ing.name}
                        </span>
                        <button
                          onClick={() => removeIngredient(ing.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '6px',
                            padding: '0.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent'
                          }}
                        >
                          <X size={16} color="#ef4444" />
                        </button>
                      </div>
                      
                      {/* Amount controls */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem'
                      }}>
                        <button
                          onClick={() => updateIngredientAmount(ing.id, ing.amount - 10)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent'
                          }}
                        >
                          <Minus size={16} />
                        </button>
                        
                        <input
                          type="number"
                          value={ing.amount}
                          onChange={(e) => updateIngredientAmount(ing.id, parseInt(e.target.value) || 0)}
                          style={{
                            width: '80px',
                            padding: '0.375rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: 'white',
                            textAlign: 'center',
                            fontSize: isMobile ? '0.875rem' : '0.9rem'
                          }}
                        />
                        
                        <span style={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: isMobile ? '0.8rem' : '0.875rem'
                        }}>
                          gram
                        </span>
                        
                        <button
                          onClick={() => updateIngredientAmount(ing.id, ing.amount + 10)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent'
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      {/* Macros */}
                      <div style={{
                        display: 'flex',
                        gap: isMobile ? '0.75rem' : '1rem',
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}>
                        <span style={{ color: '#f59e0b' }}>{macros.calories} kcal</span>
                        <span style={{ color: '#8b5cf6' }}>{macros.protein}g eiwit</span>
                        <span style={{ color: '#ef4444' }}>{macros.carbs}g carbs</span>
                        <span style={{ color: '#3b82f6' }}>{macros.fat}g vet</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Instructions (optional) */}
          <div style={{
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.75rem'
            }}>
              Bereidingswijze (optioneel)
            </h3>
            <textarea
              placeholder="Hoe maak je deze maaltijd..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: isMobile ? '0.875rem' : '0.9rem',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
        
        {/* Footer with totals */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderTop: '1px solid rgba(139, 92, 246, 0.08)',
          background: 'rgba(0, 0, 0, 0.4)'
        }}>
          {/* Macro totals */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? '0.5rem' : '0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.25rem'
            }}>
              <Flame size={isMobile ? 16 : 18} color="#f59e0b" />
              <span style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '800',
                color: '#f59e0b'
              }}>
                {totals.calories}
              </span>
              <span style={{
                fontSize: '0.65rem',
                color: 'rgba(245, 158, 11, 0.5)',
                textTransform: 'uppercase'
              }}>
                kcal
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.75rem' : '1.25rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Target size={isMobile ? 14 : 16} color="#8b5cf6" />
                <span style={{ 
                  fontWeight: '700', 
                  color: '#8b5cf6',
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}>
                  {totals.protein}g
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Zap size={isMobile ? 14 : 16} color="#ef4444" />
                <span style={{ 
                  fontWeight: '700', 
                  color: '#ef4444',
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}>
                  {totals.carbs}g
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Droplets size={isMobile ? 14 : 16} color="#3b82f6" />
                <span style={{ 
                  fontWeight: '700', 
                  color: '#3b82f6',
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}>
                  {totals.fat}g
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Euro size={isMobile ? 14 : 16} color="#10b981" />
                <span style={{ 
                  fontWeight: '700', 
                  color: '#10b981',
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}>
                  €{totals.cost}
                </span>
              </div>
            </div>
          </div>
          
          {/* Save button */}
          <button
            onClick={saveMeal}
            disabled={!mealName || selectedIngredients.length === 0 || saving}
            style={{
              width: '100%',
              padding: isMobile ? '0.875rem' : '1rem',
              background: savedMessage 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              cursor: !mealName || selectedIngredients.length === 0 || saving ? 'not-allowed' : 'pointer',
              opacity: !mealName || selectedIngredients.length === 0 || saving ? 0.5 : 1,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            {savedMessage ? (
              <>
                <Check size={20} />
                {savedMessage}
              </>
            ) : saving ? (
              'Opslaan...'
            ) : (
              <>
                <Save size={20} />
                Maaltijd Opslaan
              </>
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
