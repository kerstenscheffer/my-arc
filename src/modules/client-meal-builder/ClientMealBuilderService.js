// src/modules/client-meal-builder/ClientMealBuilderService.js
// ✅ FIXED: Proper supabase initialization

import OpenFoodFactsService from './OpenFoodFactsService'

export default class ClientMealBuilderService {
  constructor(db) {
    this.db = db
    // ✅ FIX: Get supabase from db's internal client
    this.supabase = db.supabase || db._supabase || db.client
    
    // ⚠️ Safety check
    if (!this.supabase) {
      console.error('❌ CRITICAL: No supabase client found in db!')
      console.log('DB object:', Object.keys(db))
      throw new Error('DatabaseService must have supabase client')
    }
    
    this.offService = new OpenFoodFactsService()
    console.log('✅ ClientMealBuilderService initialized with supabase')
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
      console.log('🔍 Looking up barcode in database:', barcode)
      
      // Check local database first
      const { data: localData, error } = await this.supabase
        .from('ai_ingredients')
        .select('*')
        .eq('barcode', barcode)
        .single()
      
      if (!error && localData) {
        console.log('✅ Found in local database')
        return localData
      }
      
      // If not found locally, search OpenFoodFacts
      console.log('🌍 Searching OpenFoodFacts...')
      const offResult = await this.offService.getProductByBarcode(barcode)
      
      if (offResult) {
        console.log('✅ Found in OpenFoodFacts')
        return {
          ...offResult,
          source: 'openfoodfacts',
          isNew: true
        }
      }
      
      console.log('❌ Barcode not found anywhere')
      return null
      
    } catch (error) {
      console.error('❌ Error looking up barcode:', error)
      return null
    }
  }

  // ========================================
  // CUSTOM MEAL MANAGEMENT
  // ========================================
  
  async saveCustomMeal(clientId, mealData) {
    try {
      console.log('💾 Saving custom meal:', mealData.name)
      
      // Calculate totals
      const totals = this.calculateMacros(mealData.ingredients)
      
      const mealRecord = {
        client_id: clientId,
        name: mealData.name,
        meal_type: mealData.meal_type || 'custom',
        ingredients: mealData.ingredients,
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fiber: totals.fiber,
        prep_time_minutes: mealData.prep_time || 0,
        instructions: mealData.instructions || null,
        tags: mealData.tags || [],
        is_favorite: false,
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await this.supabase
        .from('client_custom_meals')
        .insert(mealRecord)
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Custom meal saved successfully')
      return data
      
    } catch (error) {
      console.error('❌ Error saving custom meal:', error)
      throw error
    }
  }

  async getCustomMeals(clientId, filters = {}) {
    try {
      let query = this.supabase
        .from('client_custom_meals')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      
      if (filters.is_favorite) {
        query = query.eq('is_favorite', true)
      }
      
      if (filters.meal_type) {
        query = query.eq('meal_type', filters.meal_type)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return data || []
      
    } catch (error) {
      console.error('❌ Error loading custom meals:', error)
      return []
    }
  }

  async deleteCustomMeal(mealId) {
    try {
      const { error } = await this.supabase
        .from('client_custom_meals')
        .delete()
        .eq('id', mealId)
      
      if (error) throw error
      
      console.log('✅ Custom meal deleted')
      return true
      
    } catch (error) {
      console.error('❌ Error deleting custom meal:', error)
      return false
    }
  }

  // ========================================
  // MACRO CALCULATIONS
  // ========================================
  
  calculateMacros(ingredients) {
    if (!ingredients || ingredients.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    }
    
    const totals = ingredients.reduce((acc, item) => {
      const ingredient = item.ingredient || item
      const amount = item.amount_gram || 0
      const factor = amount / 100
      
      return {
        calories: acc.calories + ((ingredient.calories_per_100g || 0) * factor),
        protein: acc.protein + ((ingredient.protein_per_100g || 0) * factor),
        carbs: acc.carbs + ((ingredient.carbs_per_100g || 0) * factor),
        fat: acc.fat + ((ingredient.fat_per_100g || 0) * factor),
        fiber: acc.fiber + ((ingredient.fiber_per_100g || 0) * factor)
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
    
    return {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10
    }
  }

  // ========================================
  // FAVORITES MANAGEMENT
  // ========================================
  
  async toggleFavorite(clientId, mealId) {
    try {
      // Get current state
      const { data: currentMeal } = await this.supabase
        .from('client_custom_meals')
        .select('is_favorite')
        .eq('id', mealId)
        .eq('client_id', clientId)
        .single()
      
      const newState = !currentMeal?.is_favorite
      
      // Update
      const { error } = await this.supabase
        .from('client_custom_meals')
        .update({ is_favorite: newState })
        .eq('id', mealId)
        .eq('client_id', clientId)
      
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
