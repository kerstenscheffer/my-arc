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
      const { data, error } = await this.db.supabase
        .from('ai_client_standard_foods')
        .select(`
          *,
          meal:custom_meal_id (
            id,
            name,
            calories,
            protein,
            carbs,
            fat,
            fiber,
            ingredients_list,
            meal_type
          ),
          ingredient:ingredient_id (
            id,
            name,
            calories_per_100g,
            protein_per_100g,
            carbs_per_100g,
            fat_per_100g,
            category
          )
        `)
        .eq('client_id', clientId)
        .order('category')
        .order('slot_number')
      
      if (error) throw error
      
      // Group by category with 3 slots each
      const grouped = {
        protein: Array(3).fill(null),
        carbs: Array(3).fill(null),
        meal_prep: Array(3).fill(null),
        snacks: Array(3).fill(null)
      }
      
      data?.forEach(item => {
        const idx = item.slot_number - 1
        if (grouped[item.category] && idx >= 0 && idx < 3) {
          // Use ingredient OR meal (whichever exists)
          let displayItem = null
          
          if (item.ingredient) {
            // Transform ingredient to meal-like format
            displayItem = {
              id: item.ingredient.id,
              name: item.ingredient.name,
              calories: Math.round(item.ingredient.calories_per_100g),
              protein: Math.round(item.ingredient.protein_per_100g),
              carbs: Math.round(item.ingredient.carbs_per_100g),
              fat: Math.round(item.ingredient.fat_per_100g),
              isIngredient: true,
              category: item.ingredient.category
            }
          } else if (item.meal) {
            displayItem = {
              ...item.meal,
              isIngredient: false
            }
          }
          
          grouped[item.category][idx] = {
            id: item.id,
            slot_number: item.slot_number,
            meal: displayItem
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
