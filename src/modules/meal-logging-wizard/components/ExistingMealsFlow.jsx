import { useState, useEffect } from 'react'
import ExistingMealsSelector from './ExistingMealsSelector'

export default function ExistingMealsFlow({ db, client, onMealAdded, onBack }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (client?.id && db) {
      loadCustomMeals()
    }
  }, [client?.id, db])

  const loadCustomMeals = async () => {
    if (!db || !client?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [ExistingMealsFlow] Loading custom meals for client:', client.id)
      
      let allMeals = []
      
      // Try custom_meals table
      try {
        const { data: customData, error: customError } = await db.supabase
          .from('custom_meals')
          .select('*')
          .eq('client_id', client.id)
        
        if (!customError && customData) {
          console.log('✅ [ExistingMealsFlow] Loaded from custom_meals:', customData.length)
          allMeals = [...allMeals, ...customData]
        }
      } catch (e) {
        console.log('⚠️ [ExistingMealsFlow] custom_meals query failed:', e.message)
      }
      
      // Try ai_custom_meals table
      try {
        const { data: aiCustomData, error: aiCustomError } = await db.supabase
          .from('ai_custom_meals')
          .select('*')
          .eq('client_id', client.id)
        
        if (!aiCustomError && aiCustomData) {
          console.log('✅ [ExistingMealsFlow] Loaded from ai_custom_meals:', aiCustomData.length)
          allMeals = [...allMeals, ...aiCustomData]
        }
      } catch (e) {
        console.log('⚠️ [ExistingMealsFlow] ai_custom_meals query failed:', e.message)
      }
      
      console.log('✅ [ExistingMealsFlow] Total custom meals loaded:', allMeals.length)
      setMeals(allMeals)
      setLoading(false)
      
    } catch (err) {
      console.error('❌ [ExistingMealsFlow] Error loading meals:', err)
      setError('Kon gerechten niet laden')
      setLoading(false)
    }
  }

  const handleMealSelect = (meal) => {
    console.log('✅ [ExistingMealsFlow] Meal selected:', meal.name)
    console.log('🔍 [ExistingMealsFlow] Meal data:', {
      hasIngredientsList: !!meal.ingredients_list,
      hasIngredients: !!meal.ingredients,
      ingredientsListType: typeof meal.ingredients_list,
      ingredientsListLength: Array.isArray(meal.ingredients_list) ? meal.ingredients_list.length : 'not array'
    })
    
    // Convert to cart format
    // CRITICAL: Use ingredients_list (database field name), not ingredients
    const cartItem = {
      id: `meal-${meal.id}-${Date.now()}`,  // Tracking ID for React keys
      meal_id: meal.id,  // FIXED: Add actual meal UUID for database
      type: 'meal',
      name: meal.name,
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      ingredients_list: meal.ingredients_list || meal.ingredients || [],
      portion: 1
    }
    
    console.log('✅ [ExistingMealsFlow] Cart item created:', {
      trackingId: cartItem.id,
      mealId: cartItem.meal_id,
      ingredientsCount: cartItem.ingredients_list?.length || 0
    })
    
    onMealAdded(cartItem)
  }

  const isMobile = window.innerWidth <= 768

  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center',
        color: '#10b981'
      }}>
        <div style={{
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          marginBottom: '1rem'
        }}>
          Laden...
        </div>
        <div style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: '#666'
        }}>
          Jouw gerechten ophalen
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          color: '#ef4444',
          marginBottom: '1rem'
        }}>
          ⚠️ Fout
        </div>
        <div style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: '#999',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
        <button
          onClick={onBack}
          style={{
            padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
            background: '#10b981',
            color: '#000',
            border: 'none',
            borderRadius: isMobile ? '12px' : '16px',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          Terug
        </button>
      </div>
    )
  }

  return (
    <ExistingMealsSelector
      db={db}
      client={client}
      customMeals={meals}
      onMealSelect={handleMealSelect}
      onBack={onBack}
    />
  )
}
