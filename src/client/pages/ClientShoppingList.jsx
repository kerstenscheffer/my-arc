// src/client/pages/ClientShoppingList.jsx
// MY ARC CLIENT SHOPPING LIST - Slimme boodschappenlijst generator

import { useState, useEffect } from 'react'
import DatabaseService from '../../services/DatabaseService'
const db = DatabaseService
import { useLanguage } from '../../contexts/LanguageContext'

// Icon URLs
const iconUrls = {
  shopping: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/db878-b47a-d2dc-d6a8-c383a825e2b_1.png",
  check: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/b3c326-4f5-e7ca-42ff-e70f80ceffe5_8.png",
  share: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/01e28db-8cd3-0be1-e3dc-4103b1cd6f06_10.png"
}

// Food categories for organization
const foodCategories = {
  groenten: 'Groenten & Fruit',
  zuivel: 'Zuivel',
  vlees: 'Vlees & Vis',
  brood: 'Brood & Granen',
  conserven: 'Conserven & Droogwaren',
  kruiden: 'Kruiden & Specerijen',
  overig: 'Overig'
}

// Helper to categorize ingredients
function categorizeIngredient(ingredient) {
  const lower = ingredient.toLowerCase()
  
  if (lower.includes('melk') || lower.includes('kaas') || lower.includes('yoghurt') || lower.includes('kwark') || lower.includes('ei')) {
    return 'zuivel'
  }
  if (lower.includes('kip') || lower.includes('rund') || lower.includes('varken') || lower.includes('vis') || lower.includes('zalm') || lower.includes('tonijn')) {
    return 'vlees'
  }
  if (lower.includes('brood') || lower.includes('rijst') || lower.includes('pasta') || lower.includes('haver') || lower.includes('meel')) {
    return 'brood'
  }
  if (lower.includes('tomaat') || lower.includes('sla') || lower.includes('paprika') || lower.includes('ui') || lower.includes('knoflook') || 
      lower.includes('broccoli') || lower.includes('spinazie') || lower.includes('appel') || lower.includes('banaan') || lower.includes('fruit')) {
    return 'groenten'
  }
  if (lower.includes('peper') || lower.includes('zout') || lower.includes('paprikapoeder') || lower.includes('kaneel') || lower.includes('kruiden')) {
    return 'kruiden'
  }
  if (lower.includes('blik') || lower.includes('pot') || lower.includes('olie') || lower.includes('azijn')) {
    return 'conserven'
  }
  
  return 'overig'
}

export default function ClientShoppingList({ client, onNavigate }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [shoppingList, setShoppingList] = useState({})
  const [checkedItems, setCheckedItems] = useState({})
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [plan, setPlan] = useState(null)
  const [weekStructure, setWeekStructure] = useState([])
  const [mealsMap, setMealsMap] = useState({})
  const [customItems, setCustomItems] = useState([])
  const [newItem, setNewItem] = useState('')
  
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    loadMealPlan()
    loadCustomItems()
  }, [client])

  useEffect(() => {
    if (weekStructure.length > 0 && Object.keys(mealsMap).length > 0) {
      generateShoppingList()
    }
  }, [selectedWeek, weekStructure, mealsMap, customItems])

  const loadCustomItems = () => {
    const saved = localStorage.getItem(`customShoppingItems_${client?.id || 'default'}`)
    if (saved) {
      setCustomItems(JSON.parse(saved))
    }
  }

  const saveCustomItems = (items) => {
    setCustomItems(items)
    localStorage.setItem(`customShoppingItems_${client?.id || 'default'}`, JSON.stringify(items))
  }

  const loadMealPlan = async () => {
    if (!client) return
    
    try {
      // Get client's meal plan
      const { data: planData, error: planError } = await supabase
        .from('client_meal_plans')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (planError || !planData) {
        setLoading(false)
        return
      }
      
      setPlan(planData)
      
      // Get overrides if they exist
      const { data: overrideData } = await supabase
        .from('client_meal_overrides')
        .select('week_structure')
        .eq('client_id', client.id)
        .eq('plan_id', planData.id)
        .single()
      
      let weekStructureToUse = []
      
      if (overrideData?.week_structure) {
        weekStructureToUse = overrideData.week_structure
      } else if (planData.week_structure) {
        weekStructureToUse = planData.week_structure
      } else if (planData.template_id) {
        // Get template structure
        const { data: templateData } = await supabase
          .from('meal_plan_templates')
          .select('week_structure')
          .eq('id', planData.template_id)
          .single()
        
        if (templateData?.week_structure) {
          weekStructureToUse = templateData.week_structure
        }
      }
      
      // Pad to 28 days
      const padded = [...(weekStructureToUse || [])]
      while (padded.length < 28) {
        padded.push({ day: `Day ${padded.length + 1}`, meals: [] })
      }
      setWeekStructure(padded)
      
      // Load all referenced meals
      const mealIds = padded.flatMap(d => 
        (d?.meals || []).map(m => m.meal_id).filter(Boolean)
      )
      const uniqueIds = [...new Set(mealIds)]
      
      if (uniqueIds.length > 0) {
        const meals = []
        const batchSize = 100
        
        for (let i = 0; i < uniqueIds.length; i += batchSize) {
          const batch = uniqueIds.slice(i, i + batchSize)
          const { data: batchMeals } = await supabase
            .from('meals')
            .select('*')
            .in('id', batch)
          
          if (batchMeals) meals.push(...batchMeals)
        }
        
        const map = Object.fromEntries(meals.map(m => [m.id, m]))
        setMealsMap(map)
      }
      
    } catch (error) {
      console.error('Error loading meal plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateShoppingList = () => {
    const startDay = selectedWeek * 7
    const endDay = Math.min(startDay + 7, weekStructure.length)
    const weekDays = weekStructure.slice(startDay, endDay)
    
    const ingredients = {}
    
    // Process each day's meals
    weekDays.forEach(day => {
      (day.meals || []).forEach(mealSlot => {
        const meal = mealsMap[mealSlot.meal_id]
        if (!meal || !meal.ingredients) return
        
        // Parse ingredients (assuming comma or newline separated)
        const mealIngredients = meal.ingredients
          .split(/[,\n]/)
          .map(i => i.trim())
          .filter(i => i.length > 0)
        
        mealIngredients.forEach(ingredient => {
          const category = categorizeIngredient(ingredient)
          if (!ingredients[category]) {
            ingredients[category] = []
          }
          
          // Check if similar ingredient already exists
          const existing = ingredients[category].find(i => 
            i.toLowerCase().includes(ingredient.toLowerCase()) ||
            ingredient.toLowerCase().includes(i.toLowerCase())
          )
          
          if (!existing) {
            ingredients[category].push(ingredient)
          }
        })
      })
    })
    
    // Add custom items
    customItems.forEach(item => {
      const category = categorizeIngredient(item)
      if (!ingredients[category]) {
        ingredients[category] = []
      }
      ingredients[category].push(`${item} (toegevoegd)`)
    })
    
    setShoppingList(ingredients)
  }

  const toggleItem = (category, item) => {
    const key = `${category}_${item}`
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const addCustomItem = () => {
    if (newItem.trim()) {
      const updated = [...customItems, newItem.trim()]
      saveCustomItems(updated)
      setNewItem('')
      generateShoppingList()
    }
  }

  const removeCustomItem = (index) => {
    const updated = customItems.filter((_, i) => i !== index)
    saveCustomItems(updated)
    generateShoppingList()
  }

  const shareList = () => {
    let text = 'MY ARC Boodschappenlijst - Week ' + (selectedWeek + 1) + '\n\n'
    
    Object.entries(shoppingList).forEach(([category, items]) => {
      text += `${foodCategories[category]}:\n`
      items.forEach(item => {
        const key = `${category}_${item}`
        const checked = checkedItems[key] ? '✓ ' : '○ '
        text += `${checked}${item}\n`
      })
      text += '\n'
    })
    
    // Copy to clipboard
    navigator.clipboard.writeText(text)
    alert('Boodschappenlijst gekopieerd naar klembord!')
  }

  const getProgress = () => {
    const total = Object.values(shoppingList).flat().length
    const checked = Object.keys(checkedItems).filter(key => checkedItems[key]).length
    return total > 0 ? Math.round((checked / total) * 100) : 0
  }

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '12px',
        margin: '1rem'
      }}>
        <h3 style={{ color: '#fff', fontSize: '1.5rem' }}>
          Boodschappenlijst laden...
        </h3>
      </div>
    )
  }

  if (!plan) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        background: '#1a1a1a',
        borderRadius: '12px',
        margin: '1rem'
      }}>
        <img 
          src={iconUrls.shopping} 
          alt="Shopping" 
          style={{ width: '80px', height: '80px', marginBottom: '1rem', opacity: 0.5 }}
        />
        <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>
          Geen meal plan gevonden
        </h3>
        <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
          Je hebt een meal plan nodig om een boodschappenlijst te genereren.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('mealplan')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Naar Meal Plan
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <img src={iconUrls.shopping} alt="" style={{ width: '40px', height: '40px' }} />
            <div>
              <h1 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '0.25rem' }}>
                Boodschappenlijst
              </h1>
              <p style={{ color: '#fef3c7', fontSize: '0.9rem' }}>
                Week {selectedWeek + 1} • {getProgress()}% afgevinkt
              </p>
            </div>
          </div>
          
          <button
            onClick={shareList}
            style={{
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <img src={iconUrls.share} alt="" style={{ width: '20px', height: '20px' }} />
            Delen
          </button>
        </div>

        {/* Week selector */}
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          {[0, 1, 2, 3].map(week => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: selectedWeek === week ? '#fff' : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '6px',
                color: selectedWeek === week ? '#d97706' : '#fff',
                cursor: 'pointer',
                fontWeight: selectedWeek === week ? 'bold' : 'normal'
              }}
            >
              Week {week + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1.5rem',
        border: '1px solid #10b98133'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>Voortgang</span>
          <span style={{ color: '#10b981' }}>{getProgress()}%</span>
        </div>
        <div style={{
          height: '8px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${getProgress()}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>

      {/* Custom item adder */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1.5rem',
        border: '1px solid #10b98133'
      }}>
        <h3 style={{ color: '#10b981', fontSize: '1rem', marginBottom: '0.75rem' }}>
          Extra items toevoegen
        </h3>
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          <input
            type="text"
            placeholder="Voeg item toe..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: '#0b1510',
              border: '1px solid #10b98133',
              borderRadius: '6px',
              color: '#fff'
            }}
          />
          <button
            onClick={addCustomItem}
            style={{
              padding: '0.5rem 1rem',
              background: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            +
          </button>
        </div>
        
        {customItems.length > 0 && (
          <div style={{
            marginTop: '0.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            {customItems.map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10b981',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.875rem',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {item}
                <button
                  onClick={() => removeCustomItem(i)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '1rem'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shopping list by category */}
      {Object.keys(shoppingList).length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #10b98133'
        }}>
          <p style={{ color: '#9ca3af' }}>
            Geen items voor deze week
          </p>
        </div>
      ) : (
        Object.entries(shoppingList).map(([category, items]) => (
          <div
            key={category}
            style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              marginBottom: '1rem',
              overflow: 'hidden',
              border: '1px solid #10b98133'
            }}
          >
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
              color: '#fff',
              fontWeight: 'bold'
            }}>
              {foodCategories[category]} ({items.length})
            </div>
            
            <div style={{ padding: '0.5rem' }}>
              {items.map((item, i) => {
                const key = `${category}_${item}`
                const checked = checkedItems[key]
                
                return (
                  <div
                    key={i}
                    onClick={() => toggleItem(category, item)}
                    style={{
                      padding: '0.75rem',
                      background: checked ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      borderRadius: '6px',
                      marginBottom: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: `2px solid ${checked ? '#10b981' : '#10b98133'}`,
                      borderRadius: '6px',
                      background: checked ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {checked && <img src={iconUrls.check} alt="" style={{ width: '16px', height: '16px' }} />}
                    </div>
                    <span style={{
                      color: checked ? '#9ca3af' : '#fff',
                      textDecoration: checked ? 'line-through' : 'none'
                    }}>
                      {item}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Back to meal plan button */}
      <button
        onClick={() => onNavigate && onNavigate('mealplan')}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
          borderRadius: '12px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          marginTop: '2rem'
        }}
      >
        Terug naar Meal Plan
      </button>
    </div>
  )
}
