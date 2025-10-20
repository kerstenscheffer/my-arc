// src/modules/client-meal-builder/ClientMealBuilderService.js
// Service layer for client meal building & ingredient management

import OpenFoodFactsService from './OpenFoodFactsService'

export default class ClientMealBuilderService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
    this.offService = new OpenFoodFactsService()
  }

  // ========================================
  // EXTERNAL INGREDIENT MANAGEMENT
  // ========================================
  
  async saveExternalIngredient(ingredient) {
    try {
      console.log('💾 Saving external ingredient to database:', ingredient.name)
      
      // CRITICAL: Map category to allowed database values
      const safeCategory = this.getSafeCategory(ingredient.category)
      console.log('📦 Category mapping:', ingredient.category, '→', safeCategory)
      
      // Prepare data - ONLY columns that exist in ai_ingredients
      const ingredientData = {
        name: ingredient.name,
        name_en: ingredient.name_en || ingredient.name,
        category: safeCategory, // MAPPED CATEGORY
        calories_per_100g: ingredient.calories_per_100g || 0,
        protein_per_100g: ingredient.protein_per_100g || 0,
        carbs_per_100g: ingredient.carbs_per_100g || 0,
        fat_per_100g: ingredient.fat_per_100g || 0,
        fiber_per_100g: ingredient.fiber_per_100g || 0,
        barcode: ingredient.barcode,
        image_url: ingredient.image_url,
        default_portion_gram: ingredient.default_portion_gram || 100,
        min_portion_gram: ingredient.min_portion_gram || 10,
        max_portion_gram: ingredient.max_portion_gram || 500,
        unit_type: ingredient.unit_type || 'gram',
        scalable: true
      }
      
      const { data, error } = await this.supabase
        .from('ai_ingredients')
        .insert(ingredientData)
        .select()
        .single()
      
      if (error) {
        console.error('⚠️ Error saving ingredient:', error.message)
        // Return ingredient anyway so it can still be used
        return ingredient
      }
      
      console.log('✅ Ingredient saved to database')
      return data
      
    } catch (error) {
      console.error('❌ Failed to save ingredient:', error)
      // Return ingredient anyway so scan still works
      return ingredient
    }
  }
  
  getSafeCategory(category) {
    // Map OpenFoodFacts categories to EXACT database allowed values
    // ONLY: protein, carbs, fats, vegetables, fruits, dairy, condiments, other
    
    if (!category) return 'other'
    
    const categoryLower = category.toLowerCase()
    
    // EXACT mapping to database constraint
    const categoryMap = {
      // Protein sources
      'meat': 'protein',
      'meats': 'protein',
      'poultry': 'protein',
      'chicken': 'protein',
      'beef': 'protein',
      'pork': 'protein',
      'fish': 'protein',
      'seafood': 'protein',
      'eggs': 'protein',
      'egg': 'protein',
      'tofu': 'protein',
      'tempeh': 'protein',
      'seitan': 'protein',
      'legume': 'protein',
      'legumes': 'protein',
      'bean': 'protein',
      'beans': 'protein',
      'lentil': 'protein',
      'lentils': 'protein',
      'chickpea': 'protein',
      'chickpeas': 'protein',
      
      // Dairy
      'dairy': 'dairy',
      'dairies': 'dairy',
      'milk': 'dairy',
      'cheese': 'dairy',
      'yogurt': 'dairy',
      'yoghurt': 'dairy',
      'cream': 'dairy',
      'butter': 'dairy',
      'kefir': 'dairy',
      
      // Carbs
      'cereal': 'carbs',
      'cereals': 'carbs',
      'grain': 'carbs',
      'grains': 'carbs',
      'bread': 'carbs',
      'pasta': 'carbs',
      'rice': 'carbs',
      'noodle': 'carbs',
      'noodles': 'carbs',
      'wheat': 'carbs',
      'oat': 'carbs',
      'oats': 'carbs',
      'quinoa': 'carbs',
      'potato': 'carbs',
      'sweet potato': 'carbs',
      
      // Vegetables
      'vegetable': 'vegetables',
      'vegetables': 'vegetables',
      'veggie': 'vegetables',
      'veggies': 'vegetables',
      'salad': 'vegetables',
      'green': 'vegetables',
      'greens': 'vegetables',
      'lettuce': 'vegetables',
      'spinach': 'vegetables',
      'broccoli': 'vegetables',
      'carrot': 'vegetables',
      
      // Fruits
      'fruit': 'fruits',
      'fruits': 'fruits',
      'berry': 'fruits',
      'berries': 'fruits',
      'apple': 'fruits',
      'banana': 'fruits',
      'orange': 'fruits',
      
      // Fats
      'oil': 'fats',
      'oils': 'fats',
      'fat': 'fats',
      'fats': 'fats',
      'nut': 'fats',
      'nuts': 'fats',
      'seed': 'fats',
      'seeds': 'fats',
      'avocado': 'fats',
      'olive': 'fats',
      
      // Condiments
      'sauce': 'condiments',
      'sauces': 'condiments',
      'condiment': 'condiments',
      'condiments': 'condiments',
      'dressing': 'condiments',
      'spice': 'condiments',
      'spices': 'condiments',
      'seasoning': 'condiments',
      'herb': 'condiments',
      'herbs': 'condiments',
      'ketchup': 'condiments',
      'mustard': 'condiments',
      'mayonnaise': 'condiments',
      
      // Other (snacks, drinks, desserts, etc.)
      'snack': 'other',
      'snacks': 'other',
      'dessert': 'other',
      'desserts': 'other',
      'sweet': 'other',
      'sweets': 'other',
      'chocolate': 'other',
      'candy': 'other',
      'beverage': 'other',
      'beverages': 'other',
      'drink': 'other',
      'drinks': 'other',
      'water': 'other',
      'soda': 'other',
      'juice': 'other',
      'coffee': 'other',
      'tea': 'other',
      'alcohol': 'other'
    }
    
    // Try exact match first
    if (categoryMap[categoryLower]) {
      return categoryMap[categoryLower]
    }
    
    // Try partial match (contains)
    for (const [key, value] of Object.entries(categoryMap)) {
      if (categoryLower.includes(key) || key.includes(categoryLower)) {
        return value
      }
    }
    
    // Default fallback
    console.log('⚠️ Unknown category, using "other":', category)
    return 'other'
  }
  
  // ========================================
  // INGREDIENT SEARCH & LOOKUP
  // ========================================
  
  async searchIngredients(searchTerm, limit = 20) {
    try {
      console.log('🔍 HYBRID SEARCH:', searchTerm)
      
      const searchLower = searchTerm.toLowerCase().trim()
      
      // Search local database first
      console.log('🔍 Searching local database...')
      const { data: localData, error } = await this.supabase
        .from('ai_ingredients')
        .select('*')
        .or(`name.ilike.%${searchLower}%,name_en.ilike.%${searchLower}%`)
        .order('name', { ascending: true })
        .limit(limit)
      
      if (error) throw error
      
      const localResults = localData || []
      console.log(`✅ Found ${localResults.length} in local database`)
      
      // If less than 10 local results, also search OpenFoodFacts
      if (localResults.length < 10) {
        console.log('🌍 Searching OpenFoodFacts for more results...')
        const offResults = await this.offService.searchProducts(searchTerm, limit - localResults.length)
        
        // Mark external results
        const markedOffResults = offResults.map(item => ({
          ...item,
          source: 'openfoodfacts',
          isNew: true
        }))
        
        console.log(`✅ Found ${offResults.length} in OpenFoodFacts`)
        
        // Combine and deduplicate
        const combined = [...localResults, ...markedOffResults]
        return combined.slice(0, limit)
      }
      
      return localResults
      
    } catch (error) {
      console.error('❌ Error searching ingredients:', error)
      return []
    }
  }

  async getIngredientByBarcode(barcode) {
    try {
      console.log('📷 3-TIER BARCODE LOOKUP:', barcode)
      
      // TIER 1: Check local database first (instant)
      console.log('🔍 TIER 1: Checking local database...')
      const { data: localData, error: localError } = await this.supabase
        .from('ai_ingredients')
        .select('*')
        .eq('barcode', barcode)
        .single()
      
      if (localData && !localError) {
        console.log('✅ TIER 1: Found in local database:', localData.name)
        console.log('🔍 DEBUG - Ingredient data:', {
          id: localData.id,
          name: localData.name,
          barcode: localData.barcode,
          hasId: !!localData.id
        })
        return { 
          ...localData, 
          source: 'local',
          isNew: false
        }
      }
      
      // TIER 2: Query OpenFoodFacts (2.8M products)
      console.log('🌍 TIER 2: Querying OpenFoodFacts API...')
      const offProduct = await this.offService.getProductByBarcode(barcode)
      
      if (offProduct && this.offService.isValidProduct(offProduct)) {
        console.log('✅ TIER 2: Found in OpenFoodFacts:', offProduct.name)
        
        // Auto-save to local database for future use
        console.log('💾 Saving to local database...')
        const saved = await this.saveExternalIngredient(offProduct)
        
        return {
          ...offProduct,
          source: 'openfoodfacts',
          isNew: true,
          savedToDb: !!saved
        }
      }
      
      // TIER 3: Not found anywhere
      console.log('❌ TIER 3: Product not found in any database')
      return null
      
    } catch (error) {
      console.error('❌ Error in barcode lookup:', error)
      return null
    }
  }

  async getIngredientsByCategory(category) {
    try {
      const { data, error } = await this.supabase
        .from('ai_ingredients')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true })
        .limit(50)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error getting ingredients by category:', error)
      return []
    }
  }

  async getAllCategories() {
    try {
      const { data, error } = await this.supabase
        .from('ai_ingredients')
        .select('category')
        .not('category', 'is', null)
      
      if (error) throw error
      
      // Get unique categories
      const categories = [...new Set(data.map(item => item.category))]
      return categories.sort()
    } catch (error) {
      console.error('❌ Error getting categories:', error)
      return []
    }
  }

  // ========================================
  // MEAL COMPOSITION
  // ========================================
  
  calculateMacros(ingredients) {
    // ingredients = [{ingredient_data, amount_gram}]
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    }
    
    ingredients.forEach(item => {
      const multiplier = item.amount_gram / 100
      
      totals.calories += Math.round((item.ingredient?.calories_per_100g || 0) * multiplier)
      totals.protein += Math.round((item.ingredient?.protein_per_100g || 0) * multiplier)
      totals.carbs += Math.round((item.ingredient?.carbs_per_100g || 0) * multiplier)
      totals.fat += Math.round((item.ingredient?.fat_per_100g || 0) * multiplier)
      totals.fiber += Math.round((item.ingredient?.fiber_per_100g || 0) * multiplier)
    })
    
    return totals
  }

  async saveComposition(clientId, compositionData) {
    try {
      console.log('💾 ========== SAVING MEAL COMPOSITION ==========')
      console.log('📝 Meal name:', compositionData.meal_name)
      console.log('📦 Raw ingredients:', compositionData.ingredients)
      
      if (!compositionData.ingredients || compositionData.ingredients.length === 0) {
        throw new Error('No ingredients provided')
      }
      
      // Calculate totals from ingredients
      const macros = this.calculateMacros(compositionData.ingredients)
      console.log('🔢 Calculated macros:', macros)
      
      // CRITICAL FIX: Ultra-safe ingredient extraction
      const ingredientsForStorage = compositionData.ingredients.map((item, idx) => {
        console.log(`🔍 Raw item ${idx + 1}:`, item)
        
        // SAFE: Get ingredient from ANY possible location
        const ing = item?.ingredient || item || {}
        
        console.log(`🔍 Extracted:`, {
          hasIng: !!ing,
          hasId: !!(ing?.id),
          hasBarcode: !!(ing?.barcode),
          name: ing?.name || 'NO_NAME'
        })
        
        // ULTRA SAFE: Multiple null checks
        const ingredient_id = ing?.id || ing?.barcode || `temp_${Date.now()}_${idx}`
        const ingredient_name = ing?.name || 'Unknown'
        
        return {
          ingredient_id: ingredient_id,
          ingredient_name: ingredient_name,
          amount_gram: item?.amount_gram || 100,
          calories: Math.round(((ing?.calories_per_100g || 0) * ((item?.amount_gram || 100) / 100))),
          protein: Math.round(((ing?.protein_per_100g || 0) * ((item?.amount_gram || 100) / 100))),
          carbs: Math.round(((ing?.carbs_per_100g || 0) * ((item?.amount_gram || 100) / 100))),
          fat: Math.round(((ing?.fat_per_100g || 0) * ((item?.amount_gram || 100) / 100))),
          fiber: Math.round(((ing?.fiber_per_100g || 0) * ((item?.amount_gram || 100) / 100)))
        }
      })
      
      console.log('📦 Prepared ingredients for storage:', ingredientsForStorage)
      
      // Save to ai_custom_meals table
      const insertData = {
        client_id: clientId,
        name: compositionData.meal_name,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        fiber: macros.fiber,
        ingredients_list: ingredientsForStorage,
        meal_type: compositionData.meal_type || ['custom'],
        preparation_steps: compositionData.preparation_steps || null,
        tips: compositionData.tips || null,
        is_active: true,
        created_at: new Date().toISOString()
      }
      
      console.log('💾 Final insert data:', insertData)
      
      const { data, error } = await this.supabase
        .from('ai_custom_meals')
        .insert(insertData)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Database error:', error)
        throw error
      }
      
      console.log('✅ ========== MEAL SAVED SUCCESSFULLY ==========')
      console.log('📊 Saved meal data:', data)
      return data
    } catch (error) {
      console.error('❌ ========== SAVE FAILED ==========')
      console.error('Error message:', error.message)
      console.error('Error details:', error)
      throw error
    }
  }

  async getClientCompositions(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('ai_custom_meals')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error getting compositions:', error)
      return []
    }
  }

  async updateComposition(compositionId, updates) {
    try {
      // Recalculate macros if ingredients changed
      if (updates.ingredients) {
        const macros = this.calculateMacros(updates.ingredients)
        updates = {
          ...updates,
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
          fiber: macros.fiber
        }
      }
      
      const { data, error } = await this.supabase
        .from('ai_custom_meals')
        .update(updates)
        .eq('id', compositionId)
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Composition updated')
      return data
    } catch (error) {
      console.error('❌ Error updating composition:', error)
      throw error
    }
  }

  async deleteComposition(compositionId) {
    try {
      const { error } = await this.supabase
        .from('ai_custom_meals')
        .update({ is_active: false })
        .eq('id', compositionId)
      
      if (error) throw error
      console.log('✅ Composition deleted')
      return true
    } catch (error) {
      console.error('❌ Error deleting composition:', error)
      return false
    }
  }

  // ========================================
  // FAVORITES
  // ========================================
  
  async toggleFavorite(clientId, compositionId) {
    try {
      // Get current state
      const { data: current } = await this.supabase
        .from('ai_custom_meals')
        .select('is_favorite')
        .eq('id', compositionId)
        .single()
      
      const newState = !current?.is_favorite
      
      const { error } = await this.supabase
        .from('ai_custom_meals')
        .update({ is_favorite: newState })
        .eq('id', compositionId)
      
      if (error) throw error
      
      console.log(`${newState ? '⭐' : '☆'} Favorite toggled`)
      return newState
    } catch (error) {
      console.error('❌ Error toggling favorite:', error)
      return false
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================
  
  formatIngredientDisplay(ingredient, amount_gram) {
    return {
      name: ingredient.name,
      amount: `${amount_gram}g`,
      calories: Math.round((ingredient.calories_per_100g || 0) * (amount_gram / 100)),
      protein: Math.round((ingredient.protein_per_100g || 0) * (amount_gram / 100)),
      category: ingredient.category
    }
  }

  getDefaultPortionSize(ingredient) {
    return ingredient.default_portion_gram || 100
  }

  getSuggestedPortions(ingredient) {
    const suggestions = []
    const baseSize = ingredient.default_portion_gram || 100
    
    suggestions.push({ label: 'Standaard', grams: baseSize })
    suggestions.push({ label: 'Half', grams: Math.round(baseSize / 2) })
    suggestions.push({ label: 'Dubbel', grams: baseSize * 2 })
    
    if (ingredient.min_portion_gram) {
      suggestions.push({ label: 'Minimum', grams: ingredient.min_portion_gram })
    }
    
    if (ingredient.max_portion_gram) {
      suggestions.push({ label: 'Maximum', grams: ingredient.max_portion_gram })
    }
    
    return suggestions.sort((a, b) => a.grams - b.grams)
  }

  validateComposition(ingredients) {
    if (!ingredients || ingredients.length === 0) {
      return { valid: false, error: 'Voeg minimaal 1 ingredient toe' }
    }
    
    if (ingredients.some(item => !item.amount_gram || item.amount_gram <= 0)) {
      return { valid: false, error: 'Alle ingrediënten moeten een hoeveelheid hebben' }
    }
    
    const macros = this.calculateMacros(ingredients)
    
    if (macros.calories === 0) {
      return { valid: false, error: 'Maaltijd moet calorieën bevatten' }
    }
    
    return { valid: true }
  }
}
