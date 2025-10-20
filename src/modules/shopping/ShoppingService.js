// src/modules/shopping/ShoppingService.js
export default class ShoppingService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
  }
  
  // Get active meal plan with shopping list
  async getActiveMealPlan(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_meal_plans')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      console.log('✅ Active meal plan loaded:', data?.template_name)
      return data
    } catch (error) {
      console.error('❌ Failed to get active meal plan:', error)
      return null
    }
  }
  
  // Generate shopping list from week structure
  async generateShoppingList(weekStructure) {
    try {
      const ingredientMap = {}
      
      // Loop through all days and meals
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      
      for (const day of days) {
        const dayMeals = weekStructure[day]
        if (!dayMeals) continue
        
        console.log(`🔍 Processing ${day}`)
        
        // Process each meal slot
        const slots = ['breakfast', 'lunch', 'dinner', 'snacks']
        
        for (const slot of slots) {
          const mealData = dayMeals[slot]
          if (!mealData) continue
          
          // Handle snacks array or single meal
          const meals = Array.isArray(mealData) ? mealData : [mealData]
          
          for (const mealItem of meals) {
            // Get meal ID - week_structure stores IDs as strings directly
            let mealId = null
            
            if (typeof mealItem === 'string') {
              // Direct ID string - clean it from any suffixes
              mealId = mealItem.split('_')[0] // Remove _xl, _large, etc.
            } else if (typeof mealItem === 'object') {
              // Object with meal_id or id property
              mealId = mealItem?.meal_id || mealItem?.id
              if (mealId) {
                mealId = mealId.split('_')[0] // Clean this too
              }
            }
            
            if (!mealId) {
              console.log('⚠️ No meal ID found for:', mealItem)
              continue
            }
            
            console.log(`📦 Loading meal with ID: ${mealId}`)
            
            // Get full meal data with ingredients
            const fullMealData = await this.getMealWithIngredients(mealId)
            if (!fullMealData) {
              console.log('❌ Could not load meal data for ID:', mealId)
              continue
            }
            
            console.log(`✅ Loaded meal: ${fullMealData.name}, Ingredients:`, fullMealData.ingredients_list?.length || 0)
            
            // Process each ingredient
            if (fullMealData.ingredients_list && Array.isArray(fullMealData.ingredients_list)) {
              for (const ing of fullMealData.ingredients_list) {
                const key = ing.ingredient_id
                
                if (!ingredientMap[key]) {
                  // Get ingredient details
                  const ingredient = await this.getIngredientDetails(ing.ingredient_id)
                  
                  if (!ingredient) {
                    console.log('⚠️ Could not load ingredient:', ing.ingredient_id)
                    continue
                  }
                  
                  ingredientMap[key] = {
                    id: ing.ingredient_id,
                    name: ingredient.name || 'Unknown',
                    category: ingredient.category || 'other',
                    totalAmount: 0,
                    unit: ing.unit || 'gram',
                    instances: [],
                    pricePerUnit: ingredient.price_per_unit || 0,
                    unitType: ingredient.unit_type || 'kg'
                  }
                }
                
                // Add this instance
                const amount = ing.amount || 0
                ingredientMap[key].totalAmount += amount
                ingredientMap[key].instances.push({
                  day,
                  meal: slot,
                  mealName: fullMealData.name,
                  amount: amount
                })
              }
            }
          }
        }
      }
      
      // Convert to array and calculate realistic purchase amounts
      const shoppingList = Object.values(ingredientMap).map(item => {
        // Calculate realistic purchase amount
        const purchaseAmount = this.calculateRealisticPurchase(item)
        
        return {
          ...item,
          displayAmount: purchaseAmount,
          estimatedCost: this.calculateCost(purchaseAmount, item.pricePerUnit, item.unit, item.unitType)
        }
      })
      
      // Sort by category
      shoppingList.sort((a, b) => {
        const categoryOrder = ['protein', 'carbs', 'vegetables', 'fats', 'dairy', 'fruit', 'other']
        const aIndex = categoryOrder.indexOf(a.category) !== -1 ? categoryOrder.indexOf(a.category) : 999
        const bIndex = categoryOrder.indexOf(b.category) !== -1 ? categoryOrder.indexOf(b.category) : 999
        
        if (aIndex !== bIndex) return aIndex - bIndex
        return a.name.localeCompare(b.name)
      })
      
      console.log(`✅ Generated shopping list with ${shoppingList.length} items`)
      
      return {
        items: shoppingList,
        totalCost: shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0),
        itemCount: shoppingList.length,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Failed to generate shopping list:', error)
      return {
        items: [],
        totalCost: 0,
        itemCount: 0,
        generatedAt: new Date().toISOString()
      }
    }
  }
  
  // Calculate realistic purchase amount based on typical packages
  calculateRealisticPurchase(item) {
    const amount = item.totalAmount
    
    // Special handling for common items
    const specialCases = {
      'Eieren': () => Math.ceil(amount / 6) * 6,  // 6-pack
      'Avocado': () => Math.ceil(amount),         // Per stuk
      'Banaan': () => Math.ceil(amount),          // Per stuk
      'Appel': () => Math.ceil(amount),           // Per stuk
    }
    
    // Check special cases first
    if (specialCases[item.name]) {
      return specialCases[item.name]()
    }
    
    // For proteins (usually sold in 200-500g packages)
    if (item.category === 'protein') {
      if (amount <= 200) return 200
      if (amount <= 400) return 400
      if (amount <= 500) return 500
      if (amount <= 750) return 750
      if (amount <= 1000) return 1000
      return Math.ceil(amount / 500) * 500
    }
    
    // For vegetables (often ~500g per piece/package)
    if (item.category === 'vegetables') {
      if (amount <= 250) return 250
      if (amount <= 500) return 500
      if (amount <= 750) return 750
      return Math.ceil(amount / 500) * 500
    }
    
    // For grains/pasta (usually 500g or 1kg packages)
    if (item.category === 'carbs') {
      if (amount <= 500) return 500
      if (amount <= 1000) return 1000
      return Math.ceil(amount / 1000) * 1000
    }
    
    // Default: round to sensible amounts
    if (amount <= 100) return 100
    if (amount <= 250) return 250
    if (amount <= 500) return 500
    if (amount <= 750) return 750
    if (amount <= 1000) return 1000
    
    return Math.ceil(amount / 500) * 500
  }
  
  // Calculate cost based on amount and price
  calculateCost(amount, pricePerUnit, unit, unitType) {
    if (!pricePerUnit) return 0
    
    let cost = 0
    
    // Convert units if needed
    if (unit === 'gram' && unitType === 'kg') {
      cost = (amount / 1000) * pricePerUnit
    } else if (unit === 'ml' && unitType === 'liter') {
      cost = (amount / 1000) * pricePerUnit
    } else if (unitType === 'piece' || unitType === 'stuks') {
      cost = Math.ceil(amount) * pricePerUnit
    } else {
      cost = amount * pricePerUnit
    }
    
    return Math.round(cost * 100) / 100
  }
  
  // Get meal with ingredients
  async getMealWithIngredients(mealId) {
    try {
      // Ensure clean ID
      const cleanId = mealId.trim()
      
      const { data, error } = await this.supabase
        .from('ai_meals')
        .select('*')
        .eq('id', cleanId)
        .single()
      
      if (error) {
        console.error(`❌ Error fetching meal ${cleanId}:`, error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('❌ Failed to get meal:', error)
      return null
    }
  }
  
  // Get ingredient details
  async getIngredientDetails(ingredientId) {
    try {
      const { data, error } = await this.supabase
        .from('ai_ingredients')
        .select('*')
        .eq('id', ingredientId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Failed to get ingredient:', error)
      return null
    }
  }
  
  // Save/update shopping progress
  async saveShoppingProgress(clientId, planId, progress) {
    try {
      const { data: existing } = await this.supabase
        .from('ai_shopping_progress')
        .select('id')
        .eq('client_id', clientId)
        .eq('plan_id', planId)
        .single()
      
      if (existing) {
        const { error } = await this.supabase
          .from('ai_shopping_progress')
          .update({
            purchased_items: progress.checkedItems,
            purchased_count: Object.values(progress.checkedItems || {}).filter(Boolean).length,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        const { error } = await this.supabase
          .from('ai_shopping_progress')
          .insert({
            client_id: clientId,
            plan_id: planId,
            purchased_items: progress.checkedItems,
            purchased_count: Object.values(progress.checkedItems || {}).filter(Boolean).length,
            week_start: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
        
        if (error) throw error
      }
      
      console.log('✅ Shopping progress saved')
      return true
    } catch (error) {
      console.error('❌ Failed to save shopping progress:', error)
      return false
    }
  }
  
  // Get shopping progress
  async getShoppingProgress(clientId, planId) {
    if (!planId) return null
    
    try {
      const { data, error } = await this.supabase
        .from('ai_shopping_progress')
        .select('*')
        .eq('client_id', clientId)
        .eq('plan_id', planId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      return data
    } catch (error) {
      console.error('❌ Failed to get shopping progress:', error)
      return null
    }
  }
  
  // Format amount for display
  formatAmount(amount, unit) {
    if (unit === 'gram') {
      if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}kg`
      }
      return `${Math.round(amount)}g`
    }
    
    if (unit === 'ml') {
      if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}L`
      }
      return `${Math.round(amount)}ml`
    }
    
    if (unit === 'stuks' || unit === 'pieces') {
      return `${Math.round(amount)} stuks`
    }
    
    return `${Math.round(amount)} ${unit}`
  }
  
  // Export shopping list as text
  generateExportText(shoppingList) {
    if (!shoppingList?.items) return ''
    
    let text = '🛒 MY ARC BOODSCHAPPENLIJST\n'
    text += '━━━━━━━━━━━━━━━━━━━\n\n'
    
    // Category names in Dutch
    const categoryNames = {
      'protein': '🥩 EIWITTEN',
      'carbs': '🌾 KOOLHYDRATEN', 
      'vegetables': '🥬 GROENTEN',
      'fats': '🥑 VETTEN',
      'dairy': '🥛 ZUIVEL',
      'fruit': '🍎 FRUIT',
      'other': '📦 OVERIG'
    }
    
    // Group by category
    const categories = {}
    shoppingList.items.forEach(item => {
      const cat = item.category || 'other'
      if (!categories[cat]) {
        categories[cat] = []
      }
      categories[cat].push(item)
    })
    
    // Generate text per category
    Object.keys(categoryNames).forEach(catKey => {
      if (categories[catKey]) {
        text += `${categoryNames[catKey]}\n`
        categories[catKey].forEach(item => {
          const amount = this.formatAmount(item.displayAmount || item.totalAmount, item.unit)
          const price = item.estimatedCost ? ` (€${item.estimatedCost.toFixed(2)})` : ''
          text += `□ ${item.name} - ${amount}${price}\n`
        })
        text += '\n'
      }
    })
    
    text += '━━━━━━━━━━━━━━━━━━━\n'
    text += `💰 Geschat totaal: €${shoppingList.totalCost?.toFixed(2) || '0.00'}\n`
    text += `📊 Totaal items: ${shoppingList.itemCount || 0}\n`
    text += `📅 Gegenereerd: ${new Date().toLocaleDateString('nl-NL')}`
    
    return text
  }
  
  // Share via WhatsApp
  shareViaWhatsApp(text) {
    const encoded = encodeURIComponent(text)
    const url = `https://wa.me/?text=${encoded}`
    window.open(url, '_blank')
  }
  
  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Failed to copy:', error)
      return false
    }
  }
}
