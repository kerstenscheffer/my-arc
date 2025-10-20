// src/modules/custom-meals/CustomMealBuilder.jsx
import React, { useState, useEffect } from 'react'
import { 
  Search, Plus, Minus, Save, X, ChefHat,
  Flame, Target, Zap, Droplets, Euro,
  Clock, AlertCircle, Check, Trash2,
  Coffee, Sun, Moon, Cookie, Sparkles
} from 'lucide-react'

export default function CustomMealBuilder({ 
  isOpen, 
  onClose, 
  onSave,
  db,
  client
}) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [mealName, setMealName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [allIngredients, setAllIngredients] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [instructions, setInstructions] = useState('')
  const [mealType, setMealType] = useState(['lunch'])
  const [savedMessage, setSavedMessage] = useState('')
  const [prepTime, setPrepTime] = useState(15)
  const [cookTime, setCookTime] = useState(15)
  const [tips, setTips] = useState('')
  
  // Categories with colors matching AIAlternativesModal style
  const categories = [
    { id: 'all', label: 'Alles', color: '#10b981' },
    { id: 'protein', label: 'Eiwit', color: '#8b5cf6' },
    { id: 'carbs', label: 'Koolhydraten', color: '#ef4444' },
    { id: 'fats', label: 'Vetten', color: '#3b82f6' },
    { id: 'vegetables', label: 'Groenten', color: '#10b981' },
    { id: 'fruit', label: 'Fruit', color: '#fbbf24' },
    { id: 'dairy', label: 'Zuivel', color: '#ec4899' },
    { id: 'other', label: 'Overig', color: '#6b7280' }
  ]
  
  // Meal type options with icons
  const mealTypes = [
    { id: 'breakfast', label: 'Ontbijt', icon: Coffee, color: '#f59e0b' },
    { id: 'lunch', label: 'Lunch', icon: Sun, color: '#3b82f6' },
    { id: 'dinner', label: 'Diner', icon: Moon, color: '#8b5cf6' },
    { id: 'snack', label: 'Snack', icon: Cookie, color: '#ec4899' }
  ]
  
  // Load all ingredients on mount
  useEffect(() => {
    if (isOpen) {
      loadAllIngredients()
    }
  }, [isOpen])
  
  // Load all ingredients from database
  const loadAllIngredients = async () => {
    try {
      console.log('Loading all ingredients...')
      const { data, error } = await db.supabase
        .from('ai_ingredients')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) {
        console.error('Database error:', error)
        return
      }
      
      console.log(`Loaded ${data?.length || 0} ingredients`)
      setAllIngredients(data || [])
      
      // Show first 10 ingredients by default
      if (!searchTerm) {
        setSearchResults((data || []).slice(0, 10))
      }
    } catch (error) {
      console.error('Failed to load ingredients:', error)
    }
  }
  
  // Search/filter ingredients
  useEffect(() => {
    filterIngredients()
  }, [searchTerm, activeCategory, allIngredients])
  
  const filterIngredients = () => {
    let filtered = [...allIngredients]
    
    // Search filter
    if (searchTerm && searchTerm.length >= 2) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(ing => {
        const nameMatch = ing.name?.toLowerCase().includes(search)
        const nameEnMatch = ing.name_en?.toLowerCase().includes(search)
        return nameMatch || nameEnMatch
      })
    } else if (!searchTerm) {
      // Show top 10 if no search
      filtered = filtered.slice(0, 10)
    }
    
    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(ing => ing.category === activeCategory)
    }
    
    // Remove already selected
    filtered = filtered.filter(
      ing => !selectedIngredients.find(s => s.id === ing.id)
    )
    
    // Limit results
    setSearchResults(filtered.slice(0, 30))
  }
  
  // Add ingredient
  const addIngredient = (ingredient) => {
    setSelectedIngredients([...selectedIngredients, {
      ...ingredient,
      amount: ingredient.default_portion_gram || 100
    }])
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
      
      if (ing.price_per_unit) {
        if (ing.unit_type === 'kg' || ing.unit_type === '1000g') {
          totals.cost += (ing.price_per_unit * ing.amount / 1000)
        } else if (ing.unit_type === '100g') {
          totals.cost += (ing.price_per_unit * ing.amount / 100)
        } else {
          totals.cost += (ing.price_per_unit * ing.amount / 1000)
        }
      }
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
  
  // Save meal
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
      const ingredientsList = selectedIngredients.map(ing => ({
        ingredient_id: ing.id,
        amount: ing.amount,
        unit: 'gram'
      }))
      
      const prepSteps = instructions ? instructions.split('\n').filter(s => s.trim()) : []
      
      const mealData = {
        client_id: client.id,
        name: mealName,
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fiber: totals.fiber,
        ingredients_list: ingredientsList,
        preparation_steps: prepSteps.length > 0 ? prepSteps : null,
        prep_time_min: prepTime,
        cook_time_min: cookTime,
        meal_type: mealType,
        serving_size: 1,
        total_cost: parseFloat(totals.cost),
        tips: tips || null,
        is_active: true,
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await db.supabase
        .from('ai_custom_meals')
        .insert(mealData)
        .select()
        .single()
      
      if (error) throw error
      
      setSavedMessage('Maaltijd opgeslagen! 🎉')
      setTimeout(() => {
        if (onSave) onSave(data)
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
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '0.75rem' : '2rem',
      animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        borderRadius: isMobile ? '20px' : '28px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '1000px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(139, 92, 246, 0.08)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(139, 92, 246, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Premium Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(139, 92, 246, 0.08)',
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%)'
        }}>
          {/* Title Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              <Sparkles size={24} color="#8b5cf6" />
              Eigen Maaltijd Maken
            </h2>
            <button
              onClick={onClose}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(139, 92, 246, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <X size={20} color="#8b5cf6" />
            </button>
          </div>
          
          {/* Meal Name Input */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '14px',
            padding: isMobile ? '0.875rem' : '1rem',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            marginBottom: '1rem'
          }}>
            <input
              type="text"
              placeholder="Naam van je maaltijd..."
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '600',
                outline: 'none',
                letterSpacing: '-0.01em'
              }}
            />
          </div>
          
          {/* Meal Type Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            {mealTypes.map(type => {
              const Icon = type.icon
              const isActive = mealType.includes(type.id)
              
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    if (isActive) {
                      setMealType(mealType.filter(t => t !== type.id))
                    } else {
                      setMealType([...mealType, type.id])
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: isActive
                      ? `linear-gradient(135deg, ${type.color}15 0%, ${type.color}08 100%)`
                      : 'rgba(17, 17, 17, 0.5)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${isActive ? type.color + '25' : 'rgba(139, 92, 246, 0.08)'}`,
                    borderRadius: '12px',
                    color: isActive ? type.color : 'rgba(255, 255, 255, 0.6)',
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px'
                  }}
                >
                  <Icon size={18} />
                  <span>{type.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '0.75rem' : '1.5rem'
        }}>
          {/* Category Filters */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            WebkitOverflowScrolling: 'touch'
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
                  background: activeCategory === cat.id
                    ? `linear-gradient(135deg, ${cat.color}20 0%, ${cat.color}10 100%)`
                    : 'rgba(17, 17, 17, 0.5)',
                  border: `1px solid ${activeCategory === cat.id ? cat.color + '30' : 'rgba(139, 92, 246, 0.08)'}`,
                  borderRadius: '10px',
                  color: activeCategory === cat.id ? cat.color : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.825rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  minHeight: '38px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          {/* Search Bar */}
          <div style={{
            position: 'relative',
            marginBottom: '1rem'
          }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(139, 92, 246, 0.4)'
              }}
            />
            <input
              type="text"
              placeholder="Zoek ingrediënt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem 1rem 0.875rem 3rem' : '1rem 1rem 1rem 3rem',
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(139, 92, 246, 0.08)',
                borderRadius: '12px',
                color: 'white',
                fontSize: isMobile ? '0.95rem' : '1rem',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.25)'
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.08)'
                e.currentTarget.style.background = 'rgba(17, 17, 17, 0.5)'
              }}
            />
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{
              marginBottom: '1.5rem',
              maxHeight: '250px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '14px',
              border: '1px solid rgba(139, 92, 246, 0.08)',
              padding: '0.5rem'
            }}>
              {searchResults.map(ing => (
                <button
                  key={ing.id}
                  onClick={() => addIngredient(ing)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem' : '1rem',
                    background: 'rgba(17, 17, 17, 0.3)',
                    borderRadius: '10px',
                    marginBottom: '0.5rem',
                    border: '1px solid transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                    e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(17, 17, 17, 0.3)'
                    e.currentTarget.style.border = '1px solid transparent'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      {ing.name}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {Math.round(ing.calories_per_100g)} kcal • {Math.round(ing.protein_per_100g)}g eiwit per 100g
                    </div>
                  </div>
                  <Plus size={20} color="#8b5cf6" />
                </button>
              ))}
            </div>
          )}
          
          {/* Selected Ingredients */}
          <div>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '700',
              color: 'white',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ChefHat size={20} color="#8b5cf6" />
              Ingrediënten ({selectedIngredients.length})
            </h3>
            
            {selectedIngredients.length === 0 ? (
              <div style={{
                padding: '3rem 2rem',
                background: 'rgba(139, 92, 246, 0.05)',
                borderRadius: '14px',
                border: '1px solid rgba(139, 92, 246, 0.1)',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                <ChefHat size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>Zoek en voeg ingrediënten toe</p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
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
                        padding: isMobile ? '1rem' : '1.25rem',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)',
                        borderRadius: '14px',
                        border: '1px solid rgba(139, 92, 246, 0.15)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                      }}>
                        <span style={{
                          fontWeight: '700',
                          color: 'white',
                          fontSize: isMobile ? '0.95rem' : '1rem'
                        }}>
                          {ing.name}
                        </span>
                        <button
                          onClick={() => removeIngredient(ing.id)}
                          style={{
                            width: '32px',
                            height: '32px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                          }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                      
                      {/* Amount Controls */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.75rem'
                      }}>
                        <button
                          onClick={() => updateIngredientAmount(ing.id, ing.amount - 10)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
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
                            padding: '0.5rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            textAlign: 'center',
                            fontSize: '0.95rem'
                          }}
                        />
                        
                        <span style={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: '0.9rem'
                        }}>
                          gram
                        </span>
                        
                        <button
                          onClick={() => updateIngredientAmount(ing.id, ing.amount + 10)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      {/* Macros */}
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        fontSize: isMobile ? '0.75rem' : '0.8rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Flame size={14} color="#f59e0b" />
                          <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                            {macros.calories} kcal
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Target size={14} color="#8b5cf6" />
                          <span style={{ color: '#8b5cf6', fontWeight: '600' }}>
                            {macros.protein}g
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Zap size={14} color="#ef4444" />
                          <span style={{ color: '#ef4444', fontWeight: '600' }}>
                            {macros.carbs}g
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Droplets size={14} color="#3b82f6" />
                          <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                            {macros.fat}g
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Prep & Cook Time */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            <div>
              <label style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                Bereidingstijd
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(17, 17, 17, 0.5)',
                borderRadius: '10px',
                border: '1px solid rgba(139, 92, 246, 0.08)'
              }}>
                <Clock size={16} color="#8b5cf6" />
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '0.95rem',
                    width: '50px',
                    outline: 'none'
                  }}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
                  min
                </span>
              </div>
            </div>
            
            <div>
              <label style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                Kooktijd
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(17, 17, 17, 0.5)',
                borderRadius: '10px',
                border: '1px solid rgba(139, 92, 246, 0.08)'
              }}>
                <Clock size={16} color="#8b5cf6" />
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '0.95rem',
                    width: '50px',
                    outline: 'none'
                  }}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
                  min
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Premium Footer */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderTop: '1px solid rgba(139, 92, 246, 0.08)',
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%)',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Totals Display */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.375rem'
            }}>
              <Flame size={20} color="#f59e0b" />
              <span style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: '800',
                color: '#f59e0b'
              }}>
                {totals.calories}
              </span>
              <span style={{
                fontSize: '0.7rem',
                color: 'rgba(245, 158, 11, 0.5)',
                textTransform: 'uppercase',
                fontWeight: '600'
              }}>
                kcal
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Target size={16} color="#8b5cf6" />
                <span style={{ fontWeight: '700', color: '#8b5cf6' }}>
                  {totals.protein}g
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Zap size={16} color="#ef4444" />
                <span style={{ fontWeight: '700', color: '#ef4444' }}>
                  {totals.carbs}g
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Droplets size={16} color="#3b82f6" />
                <span style={{ fontWeight: '700', color: '#3b82f6' }}>
                  {totals.fat}g
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Euro size={16} color="#10b981" />
                <span style={{ fontWeight: '700', color: '#10b981' }}>
                  €{totals.cost}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(139, 92, 246, 0.08)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Annuleren
            </button>
            <button
              onClick={saveMeal}
              disabled={!mealName || selectedIngredients.length === 0 || saving}
              style={{
                flex: 2,
                padding: isMobile ? '0.875rem' : '1rem',
                background: savedMessage 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : !mealName || selectedIngredients.length === 0
                    ? 'linear-gradient(135deg, #4b5563 0%, #374151 100%)'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '12px',
                color: 'white',
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '700',
                cursor: !mealName || selectedIngredients.length === 0 || saving ? 'not-allowed' : 'pointer',
                opacity: !mealName || selectedIngredients.length === 0 || saving ? 0.5 : 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: !mealName || selectedIngredients.length === 0 ? 'none' : '0 8px 32px rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                if (mealName && selectedIngredients.length > 0 && !saving) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.3)'
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
      </div>
      
      {/* Premium Animations */}
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
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
