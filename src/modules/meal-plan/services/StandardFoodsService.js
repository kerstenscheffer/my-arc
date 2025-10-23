// src/modules/meal-plan/services/StandardFoodsService.js

export default class StandardFoodsService {
  constructor(db) {
    this.db = db
  }

  /**
   * Load all standard foods for a client
   * Returns grouped by category with 3 slots each
   */
  async loadStandardFoods(clientId) {
    try {
      // Get all standard foods records
      const { data: standardFoods, error: sfError } = await this.db.supabase
        .from('ai_client_standard_foods')
        .select('*')
        .eq('client_id', clientId)
        .order('category')
        .order('slot_number')
      
      if (sfError) throw sfError
      
      // Get unique meal IDs and ingredient IDs
      const mealIds = standardFoods
        .filter(sf => sf.custom_meal_id)
        .map(sf => sf.custom_meal_id)
      
      const ingredientIds = standardFoods
        .filter(sf => sf.ingredient_id)
        .map(sf => sf.ingredient_id)
      
      // Batch fetch meals if any
      let mealsMap = {}
      if (mealIds.length > 0) {
        const { data: meals, error: mealsError } = await this.db.supabase
          .from('ai_custom_meals')
          .select('*')
          .in('id', mealIds)
        
        if (mealsError) throw mealsError
        
        meals?.forEach(meal => {
          mealsMap[meal.id] = meal
        })
      }
      
      // Batch fetch ingredients if any
      let ingredientsMap = {}
      if (ingredientIds.length > 0) {
        const { data: ingredients, error: ingredientsError } = await this.db.supabase
          .from('ai_ingredients')
          .select('*')
          .in('id', ingredientIds)
        
        if (ingredientsError) throw ingredientsError
        
        ingredients?.forEach(ing => {
          ingredientsMap[ing.id] = ing
        })
      }
      
      // Group by category with 3 slots each
      const grouped = {
        protein: Array(3).fill(null),
        carbs: Array(3).fill(null),
        meal_prep: Array(3).fill(null),
        snacks: Array(3).fill(null)
      }
      
      standardFoods?.forEach(item => {
        const idx = item.slot_number - 1
        if (grouped[item.category] && idx >= 0 && idx < 3) {
          let displayItem = null
          
          // Check if it's an ingredient
          if (item.ingredient_id && ingredientsMap[item.ingredient_id]) {
            const ingredient = ingredientsMap[item.ingredient_id]
            displayItem = {
              id: ingredient.id,
              name: ingredient.name,
              calories: Math.round(ingredient.calories_per_100g),
              protein: Math.round(ingredient.protein_per_100g),
              carbs: Math.round(ingredient.carbs_per_100g),
              fat: Math.round(ingredient.fat_per_100g),
              isIngredient: true,
              category: ingredient.category
            }
          } 
          // Check if it's a meal
          else if (item.custom_meal_id && mealsMap[item.custom_meal_id]) {
            const meal = mealsMap[item.custom_meal_id]
            displayItem = {
              ...meal,
              isIngredient: false
            }
          }
          
          if (displayItem) {
            grouped[item.category][idx] = {
              id: item.id,
              slot_number: item.slot_number,
              meal: displayItem
            }
          }
        }
      })
      
      console.log('✅ [StandardFoodsService] Loaded standard foods:', {
        protein: grouped.protein.filter(Boolean).length,
        carbs: grouped.carbs.filter(Boolean).length,
        meal_prep: grouped.meal_prep.filter(Boolean).length,
        snacks: grouped.snacks.filter(Boolean).length
      })
      
      return grouped
      
    } catch (error) {
      console.error('❌ [StandardFoodsService] Failed to load:', error)
      throw error
    }
  }

  /**
   * Save a standard food (ingredient or meal)
   */
  async saveStandardFood(clientId, category, slotNumber, item) {
    try {
      console.log('💾 [StandardFoodsService] Saving:', {
        clientId,
        category,
        slotNumber,
        itemId: item.id,
        itemName: item.name,
        isIngredient: item.isIngredient
      })

      const saveData = {
        client_id: clientId,
        category,
        slot_number: slotNumber
      }
      
      // Determine if ingredient or meal
      if (item.isIngredient) {
        saveData.ingredient_id = item.id
        saveData.custom_meal_id = null
      } else {
        saveData.custom_meal_id = item.id
        saveData.ingredient_id = null
      }
      
      const { data, error } = await this.db.supabase
        .from('ai_client_standard_foods')
        .upsert(saveData, {
          onConflict: 'client_id,category,slot_number'
        })
        .select()
      
      if (error) throw error
      
      console.log('✅ [StandardFoodsService] Saved successfully')
      return data
      
    } catch (error) {
      console.error('❌ [StandardFoodsService] Save failed:', error)
      throw error
    }
  }

  /**
   * Remove a standard food
   */
  async removeStandardFood(clientId, category, slotNumber) {
    try {
      console.log('🗑️ [StandardFoodsService] Removing:', {
        clientId,
        category,
        slotNumber
      })

      const { error } = await this.db.supabase
        .from('ai_client_standard_foods')
        .delete()
        .eq('client_id', clientId)
        .eq('category', category)
        .eq('slot_number', slotNumber)
      
      if (error) throw error
      
      console.log('✅ [StandardFoodsService] Removed successfully')
      
    } catch (error) {
      console.error('❌ [StandardFoodsService] Remove failed:', error)
      throw error
    }
  }

  /**
   * Validate if client has minimum required standard foods
   */
  validateMinimumFoods(standardFoods) {
    const proteins = standardFoods?.protein?.filter(p => p?.meal).length || 0
    const carbs = standardFoods?.carbs?.filter(c => c?.meal).length || 0
    const mealPreps = standardFoods?.meal_prep?.filter(m => m?.meal).length || 0
    const snacks = standardFoods?.snacks?.filter(s => s?.meal).length || 0
    
    return {
      proteins,
      carbs,
      mealPreps,
      snacks,
      total: proteins + carbs + mealPreps + snacks,
      isValid: proteins >= 2 && carbs >= 2 // Minimum requirement
    }
  }

  /**
   * Get standard foods by category
   */
  getFoodsByCategory(standardFoods, category) {
    return standardFoods?.[category]?.filter(item => item?.meal) || []
  }
}
