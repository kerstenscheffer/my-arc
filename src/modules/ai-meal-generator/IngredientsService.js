// src/modules/ai-meal-generator/IngredientsService.js
// VERVANG HELE BESTAND MET DIT

import DatabaseService from '../../services/DatabaseService'

class IngredientsService {
  constructor() {
    this.db = DatabaseService
    console.log('🔧 IngredientsService initialized with DatabaseService')
  }

  // Alle ingredients ophalen
  async getAllIngredients() {
    try {
      console.log('📋 Getting all ingredients via DatabaseService...')
      const ingredients = await this.db.getAllIngredients()
      console.log(`✅ Retrieved ${ingredients.length} ingredients`)
      return ingredients
    } catch (error) {
      console.error('❌ Error in getAllIngredients:', error)
      return []
    }
  }

  // Zoek ingredients
  async searchIngredients(searchTerm) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        console.log('⚠️ Search term too short')
        return []
      }
      
      console.log('🔍 Searching for:', searchTerm)
      const results = await this.db.searchIngredients(searchTerm)
      console.log(`✅ Found ${results.length} results`)
      return results
    } catch (error) {
      console.error('❌ Error searching ingredients:', error)
      return []
    }
  }

  // Get ingredients per categorie
  async getIngredientsByCategory(category) {
    try {
      console.log('📂 Getting ingredients for category:', category)
      const ingredients = await this.db.getIngredientsByCategory(category)
      console.log(`✅ Found ${ingredients.length} ingredients in ${category}`)
      return ingredients
    } catch (error) {
      console.error('❌ Error getting category ingredients:', error)
      return []
    }
  }

  // Get specifiek ingredient
  async getIngredientById(id) {
    try {
      const ingredient = await this.db.getIngredientById(id)
      return ingredient
    } catch (error) {
      console.error('❌ Error getting ingredient by ID:', error)
      return null
    }
  }

  // Bereken macros voor portie
  calculateMacros(ingredient, portionGrams) {
    if (!ingredient) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    }
    
    return this.db.calculateIngredientMacros(ingredient, portionGrams)
  }

  // Save custom recipe
  async saveRecipe(recipeData) {
    try {
      console.log('💾 Saving recipe via service:', recipeData.name)
      const recipe = await this.db.saveRecipe(recipeData)
      console.log('✅ Recipe saved successfully')
      return recipe
    } catch (error) {
      console.error('❌ Error saving recipe:', error)
      throw error
    }
  }

  // Get alle recipes
  async getRecipes(category = null) {
    try {
      console.log('📖 Getting recipes, category:', category || 'all')
      const recipes = await this.db.getRecipes(category)
      console.log(`✅ Found ${recipes.length} recipes`)
      return recipes
    } catch (error) {
      console.error('❌ Error getting recipes:', error)
      return []
    }
  }

  // Get product variants (merken)
  async getProductVariants(ingredientId) {
    try {
      const variants = await this.db.getProductVariants(ingredientId)
      return variants
    } catch (error) {
      console.error('❌ Error getting product variants:', error)
      return []
    }
  }

  // Save product variant
  async saveProductVariant(variantData) {
    try {
      const variant = await this.db.saveProductVariant(variantData)
      return variant
    } catch (error) {
      console.error('❌ Error saving product variant:', error)
      throw error
    }
  }

  // Helper: Format ingredient voor display
  formatIngredient(ingredient) {
    if (!ingredient) return null
    
    return {
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit || 'gram',
      gramsPerUnit: ingredient.grams_per_unit || 100,
      macros: {
        calories: ingredient.calories_per_100g || 0,
        protein: ingredient.protein_per_100g || 0,
        carbs: ingredient.carbs_per_100g || 0,
        fat: ingredient.fat_per_100g || 0,
        fiber: ingredient.fiber_per_100g || 0
      }
    }
  }

  // Helper: Groepeer ingredients per categorie
  groupByCategory(ingredients) {
    const grouped = {}
    
    ingredients.forEach(ing => {
      const category = ing.category || 'overig'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(this.formatIngredient(ing))
    })
    
    return grouped
  }

  // Categories voor UI
  getCategories() {
    return [
      { value: 'groente', label: '🥬 Groente', color: '#10b981' },
      { value: 'fruit', label: '🍎 Fruit', color: '#f59e0b' },
      { value: 'vlees', label: '🥩 Vlees', color: '#ef4444' },
      { value: 'vis', label: '🐟 Vis', color: '#3b82f6' },
      { value: 'zuivel', label: '🥛 Zuivel', color: '#8b5cf6' },
      { value: 'granen', label: '🌾 Granen', color: '#a78bfa' },
      { value: 'peulvruchten', label: '🫘 Peulvruchten', color: '#84cc16' },
      { value: 'noten', label: '🥜 Noten & Zaden', color: '#d97706' },
      { value: 'olie', label: '🫒 Oliën & Vetten', color: '#fbbf24' },
      { value: 'kruiden', label: '🌿 Kruiden', color: '#22c55e' },
      { value: 'overig', label: '📦 Overig', color: '#6b7280' }
    ]
  }
}

// Export singleton instance
export default new IngredientsService()
