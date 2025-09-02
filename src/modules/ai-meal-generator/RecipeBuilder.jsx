// src/modules/ai-meal-generator/RecipeBuilder.jsx
import { useState, useEffect } from 'react'
import IngredientsService from './IngredientsService'
import { Search, Plus, Trash2, Save, ChevronDown, ChevronUp, Calculator, X } from 'lucide-react'

export default function RecipeBuilder({ db, onRecipeCreated }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [recipeName, setRecipeName] = useState('')
  const [recipeCategory, setRecipeCategory] = useState('dinner')
  const [recipeInstructions, setRecipeInstructions] = useState('')
  const [prepTime, setPrepTime] = useState(15)
  const [cookTime, setCookTime] = useState(30)
  
  // Ingredients
  const [allIngredients, setAllIngredients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  
  // UI State
  const [loading, setLoading] = useState(false)
  const [showNutrition, setShowNutrition] = useState(true)
  
  // Load ingredients on mount
  useEffect(() => {
    loadIngredients()
  }, [])
  
  const loadIngredients = async () => {
    try {
      // Check of getAllIngredients bestaat
      if (db.getAllIngredients) {
        const ingredients = await db.getAllIngredients()
        setAllIngredients(ingredients)
        console.log(`✅ Loaded ${ingredients.length} ingredients from database`)
      } else if (IngredientsService.getAllIngredients) {
        const ingredients = await IngredientsService.getAllIngredients()
        setAllIngredients(ingredients)
        console.log(`✅ Loaded ${ingredients.length} ingredients via service`)
      } else {
        console.error('❌ No method to load ingredients found')
      }
    } catch (error) {
      console.error('❌ Error loading ingredients:', error)
    }
  }
  
  // Add ingredient to recipe
  const addIngredient = (ingredient) => {
    const newIngredient = {
      ...ingredient,
      amount: 100, // Default 100g
      unit: ingredient.default_unit || 'gram'
    }
    setSelectedIngredients([...selectedIngredients, newIngredient])
    setSearchTerm('')
    setShowSearch(false)
  }
  
  // Update ingredient amount
  const updateIngredientAmount = (index, amount) => {
    const updated = [...selectedIngredients]
    updated[index].amount = parseFloat(amount) || 0
    setSelectedIngredients(updated)
  }
  
  // Remove ingredient
  const removeIngredient = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index))
  }
  
  // Calculate total nutrition
  const calculateTotalNutrition = () => {
    let totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, weight: 0 }
    
    selectedIngredients.forEach(ing => {
      const factor = ing.amount / 100
      totals.kcal += Math.round(ing.per_100g_kcal * factor)
      totals.protein += Math.round(ing.per_100g_protein * factor * 10) / 10
      totals.carbs += Math.round(ing.per_100g_carbs * factor * 10) / 10
      totals.fat += Math.round(ing.per_100g_fat * factor * 10) / 10
      totals.fiber += Math.round((ing.per_100g_fiber || 0) * factor * 10) / 10
      totals.weight += ing.amount
    })
    
    return totals
  }
  
  // Save recipe
  const saveRecipe = async () => {
    if (!recipeName.trim()) {
      alert('Geef het recept een naam!')
      return
    }
    
    if (selectedIngredients.length === 0) {
      alert('Voeg minimaal 1 ingrediënt toe!')
      return
    }
    
    setLoading(true)
    try {
      const totals = calculateTotalNutrition()
      
      const recipeData = {
        name: recipeName,
        category: recipeCategory,
        base_portion_grams: Math.round(totals.weight),
        servings: 1,
        prep_time_minutes: prepTime,
        cook_time_minutes: cookTime,
        instructions: recipeInstructions,
        ingredients: selectedIngredients.map(ing => ({
          ingredient_id: ing.id,
          amount: ing.amount,
          unit: ing.unit
        }))
      }
      
      const recipe = await IngredientsService.createRecipe(recipeData)
      
      if (recipe) {
        // Create meal from recipe
        const meal = await IngredientsService.createMealFromRecipe(recipe.id, {
          name: recipeName
        })
        
        alert(`✅ Recept "${recipeName}" succesvol opgeslagen!`)
        
        // Reset form
        setRecipeName('')
        setSelectedIngredients([])
        setRecipeInstructions('')
        
        if (onRecipeCreated) {
          onRecipeCreated(recipe, meal)
        }
      }
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('Fout bij opslaan van recept')
    } finally {
      setLoading(false)
    }
  }
  
  // Filter ingredients for search
  const filteredIngredients = allIngredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || ing.category === filterCategory
    const notSelected = !selectedIngredients.find(si => si.id === ing.id)
    return matchesSearch && matchesCategory && notSelected
  })
  
  const totals = calculateTotalNutrition()
  
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
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          fontWeight: 'bold',
          color: '#fff',
          margin: 0
        }}>
          🍳 Recipe Builder
        </h3>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255,255,255,0.9)',
          marginTop: '0.5rem'
        }}>
          Maak recepten met exacte nutritionele waarden
        </p>
      </div>
      
      {/* Recipe Details */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderBottom: '1px solid #333'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem'
        }}>
          {/* Recipe Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Recept Naam
            </label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="bijv. Kip Salade Bowl"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '1rem',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: isMobile ? '8px' : '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            />
          </div>
          
          {/* Category */}
          <div>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Categorie
            </label>
            <select
              value={recipeCategory}
              onChange={(e) => setRecipeCategory(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '1rem',
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
              <option value="breakfast">Ontbijt</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Diner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          
          {/* Prep Time */}
          <div>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Voorbereidingstijd (min)
            </label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '1rem',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: isMobile ? '8px' : '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            />
          </div>
          
          {/* Cook Time */}
          <div>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Kooktijd (min)
            </label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '1rem',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: isMobile ? '8px' : '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Ingredients Section */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderBottom: '1px solid #333'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h4 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#8b5cf6',
            margin: 0
          }}>
            Ingrediënten ({selectedIngredients.length})
          </h4>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: isMobile ? '8px' : '10px',
              color: '#fff',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              minHeight: '44px'
            }}
          >
            <Plus size={16} />
            Toevoegen
          </button>
        </div>
        
        {/* Ingredient Search */}
        {showSearch && (
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: '#1a1a1a',
            borderRadius: isMobile ? '8px' : '12px',
            border: '1px solid #333'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={isMobile ? 16 : 18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8b5cf6'
                }} />
                <input
                  type="text"
                  placeholder="Zoek ingrediënt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem 1rem 0.75rem 2.5rem' : '1rem 1rem 1rem 3rem',
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: isMobile ? '8px' : '10px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    touchAction: 'manipulation',
                    minHeight: '44px'
                  }}
                />
              </div>
              <button
                onClick={() => setShowSearch(false)}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: isMobile ? '8px' : '10px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Search Results */}
            <div style={{
              maxHeight: '200px',
              overflow: 'auto',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '0.5rem'
            }}>
              {filteredIngredients.slice(0, 20).map(ing => (
                <div
                  key={ing.id}
                  onClick={() => addIngredient(ing)}
                  style={{
                    padding: isMobile ? '0.5rem' : '0.75rem',
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)'
                    e.currentTarget.style.borderColor = '#8b5cf6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#111'
                    e.currentTarget.style.borderColor = '#333'
                  }}
                >
                  <div style={{
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    fontWeight: '500',
                    color: '#fff'
                  }}>
                    {ing.name}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '0.25rem'
                  }}>
                    {ing.per_100g_kcal} kcal | P: {ing.per_100g_protein}g
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Selected Ingredients List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {selectedIngredients.map((ing, index) => (
            <div key={index} style={{
              padding: isMobile ? '0.75rem' : '1rem',
              background: '#1a1a1a',
              borderRadius: '8px',
              border: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '500',
                  color: '#fff'
                }}>
                  {ing.name}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '0.25rem'
                }}>
                  Per 100g: {ing.per_100g_kcal} kcal | P: {ing.per_100g_protein}g | C: {ing.per_100g_carbs}g | F: {ing.per_100g_fat}g
                </div>
              </div>
              
              {/* Amount Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <input
                  type="number"
                  value={ing.amount}
                  onChange={(e) => updateIngredientAmount(index, e.target.value)}
                  style={{
                    width: isMobile ? '80px' : '100px',
                    padding: '0.5rem',
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    textAlign: 'right',
                    touchAction: 'manipulation'
                  }}
                />
                <span style={{
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  {ing.unit}
                </span>
              </div>
              
              {/* Remove Button */}
              <button
                onClick={() => removeIngredient(index)}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Nutrition Summary */}
      <div 
        style={{
          borderBottom: '1px solid #333',
          overflow: 'hidden'
        }}
      >
        <div
          onClick={() => setShowNutrition(!showNutrition)}
          style={{
            padding: isMobile ? '1rem' : '1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Calculator size={isMobile ? 20 : 24} style={{ color: '#10b981' }} />
            <div>
              <h4 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '600',
                color: '#fff',
                margin: 0
              }}>
                Totale Voedingswaarde
              </h4>
              {!showNutrition && (
                <p style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255,255,255,0.5)',
                  margin: '0.25rem 0 0 0'
                }}>
                  {Math.round(totals.weight)}g | {totals.kcal} kcal | P: {totals.protein}g | C: {totals.carbs}g | F: {totals.fat}g
                </p>
              )}
            </div>
          </div>
          {showNutrition ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {showNutrition && (
          <div style={{
            padding: isMobile ? '1rem' : '1.5rem',
            background: '#111'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              <div style={{
                padding: '1rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: 'bold',
                  color: '#10b981'
                }}>
                  {Math.round(totals.weight)}g
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '0.25rem'
                }}>
                  Totaal Gewicht
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: 'bold',
                  color: '#8b5cf6'
                }}>
                  {totals.kcal}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '0.25rem'
                }}>
                  Calorieën
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: 'bold',
                  color: '#3b82f6'
                }}>
                  {totals.protein}g
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '0.25rem'
                }}>
                  Eiwit
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: 'bold',
                  color: '#f97316'
                }}>
                  {totals.carbs}g
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '0.25rem'
                }}>
                  Koolhydraten
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: 'bold',
                  color: '#eab308'
                }}>
                  {totals.fat}g
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '0.25rem'
                }}>
                  Vet
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: 'bold',
                  color: '#84cc16'
                }}>
                  {totals.fiber}g
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '0.25rem'
                }}>
                  Vezels
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderBottom: '1px solid #333'
      }}>
        <label style={{
          display: 'block',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '0.5rem',
          fontWeight: '500'
        }}>
          Bereidingswijze (optioneel)
        </label>
        <textarea
          value={recipeInstructions}
          onChange={(e) => setRecipeInstructions(e.target.value)}
          placeholder="1. Snijd de groenten\n2. Bak de kip\n3. Meng alles samen"
          rows={4}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '1rem',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: isMobile ? '8px' : '10px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            resize: 'vertical',
            touchAction: 'manipulation'
          }}
        />
      </div>
      
      {/* Save Button */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={saveRecipe}
          disabled={loading || !recipeName.trim() || selectedIngredients.length === 0}
          style={{
            padding: isMobile ? '0.75rem 2rem' : '1rem 3rem',
            background: loading || !recipeName.trim() || selectedIngredients.length === 0
              ? 'rgba(139, 92, 246, 0.3)'
              : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none',
            borderRadius: isMobile ? '10px' : '12px',
            color: '#fff',
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            cursor: loading || !recipeName.trim() || selectedIngredients.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            minHeight: '44px',
            opacity: loading || !recipeName.trim() || selectedIngredients.length === 0 ? 0.5 : 1
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #fff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Opslaan...
            </>
          ) : (
            <>
              <Save size={20} />
              Recept Opslaan
            </>
          )}
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
