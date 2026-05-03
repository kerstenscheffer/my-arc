// src/modules/shopping/ShoppingService.js - V3 UNIT CONVERSION SYSTEM
export default class ShoppingService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
    
    // ── UNIT CONVERSION TABLE ──
    // Ingredients stored in grams but sold per piece
    // gram_per_piece = average weight of 1 unit
    this.PIECE_CONVERSIONS = {
      'eieren':    { gramPerPiece: 60,  displayUnit: 'stuks', packSizes: [6, 10, 12, 20, 30] },
      'ei':        { gramPerPiece: 60,  displayUnit: 'stuks', packSizes: [6, 10, 12, 20, 30] },
      'banaan':    { gramPerPiece: 120, displayUnit: 'stuks', packSizes: null },
      'bananen':   { gramPerPiece: 120, displayUnit: 'stuks', packSizes: null },
      'appel':     { gramPerPiece: 180, displayUnit: 'stuks', packSizes: null },
      'appels':    { gramPerPiece: 180, displayUnit: 'stuks', packSizes: null },
      'avocado':   { gramPerPiece: 150, displayUnit: 'stuks', packSizes: null },
      'peer':      { gramPerPiece: 170, displayUnit: 'stuks', packSizes: null },
      'kiwi':      { gramPerPiece: 80,  displayUnit: 'stuks', packSizes: null },
      'citroen':   { gramPerPiece: 80,  displayUnit: 'stuks', packSizes: null },
      'limoen':    { gramPerPiece: 60,  displayUnit: 'stuks', packSizes: null },
      'mango':     { gramPerPiece: 300, displayUnit: 'stuks', packSizes: null },
      'sinaasappel': { gramPerPiece: 200, displayUnit: 'stuks', packSizes: null },
      'rijstwafels': { gramPerPiece: 8, displayUnit: 'stuks', packSizes: null },
    }
  }
  
  // ── CHECK IF INGREDIENT NEEDS PIECE CONVERSION ──
  getConversionInfo(ingredientName, dbUnitType) {
    if (!ingredientName) return null
    const nameLower = ingredientName.toLowerCase().trim()
    
    // Check exact match first, then partial match
    if (this.PIECE_CONVERSIONS[nameLower]) {
      return this.PIECE_CONVERSIONS[nameLower]
    }
    
    // Partial match
    for (const [key, conv] of Object.entries(this.PIECE_CONVERSIONS)) {
      if (nameLower.includes(key)) return conv
    }
    
    // If DB says piece but we don't have a conversion, flag it
    if (dbUnitType === 'piece' || dbUnitType === 'stuks') {
      console.warn(`⚠️ Ingredient "${ingredientName}" is sold per piece but has no conversion entry`)
      return null
    }
    
    return null
  }
  
  // ── CONVERT GRAMS TO PIECES ──
  convertToPieces(totalGrams, conversionInfo) {
    if (!conversionInfo) return null
    
    const rawCount = totalGrams / conversionInfo.gramPerPiece
    const roundedCount = Math.ceil(rawCount)
    
    // Round to nearest pack size if available
    if (conversionInfo.packSizes && conversionInfo.packSizes.length > 0) {
      const pack = conversionInfo.packSizes.find(size => size >= roundedCount)
      return pack || Math.ceil(roundedCount / conversionInfo.packSizes[conversionInfo.packSizes.length - 1]) * conversionInfo.packSizes[conversionInfo.packSizes.length - 1]
    }
    
    return roundedCount
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
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      
      for (const day of days) {
        const dayMeals = weekStructure[day]
        if (!dayMeals) continue
        
        console.log(`🔍 Processing ${day}`)
        const slots = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3', 'snacks']
        
        for (const slot of slots) {
          const mealData = dayMeals[slot]
          if (!mealData) continue
          
          const meals = Array.isArray(mealData) ? mealData : [mealData]
          
          for (const mealItem of meals) {
            let mealId = null
            if (typeof mealItem === 'string') {
              mealId = mealItem.split('_')[0]
            } else if (typeof mealItem === 'object') {
              mealId = mealItem?.meal_id || mealItem?.id
              if (mealId) mealId = mealId.split('_')[0]
            }
            
            if (!mealId) continue
            
            console.log(`📦 Loading meal with ID: ${mealId}`)
            
            const inlineIngredients = (typeof mealItem === 'object' && mealItem?.ingredients_list) 
              ? mealItem.ingredients_list : null
            
            let fullMealData
            if (inlineIngredients && Array.isArray(inlineIngredients) && inlineIngredients.length > 0) {
              const dbMeal = await this.getMealWithIngredients(mealId)
              fullMealData = {
                name: dbMeal?.name || mealItem?.meal_name || mealItem?.name || 'Unknown',
                ingredients_list: inlineIngredients
              }
              console.log(`✅ Using scaled ingredients from plan: ${fullMealData.name}, Ingredients:`, inlineIngredients.length)
            } else {
              fullMealData = await this.getMealWithIngredients(mealId)
              if (!fullMealData) continue
              console.log(`✅ Loaded from DB: ${fullMealData.name}, Ingredients:`, fullMealData.ingredients_list?.length || 0)
            }
            
            if (fullMealData.ingredients_list && Array.isArray(fullMealData.ingredients_list)) {
              for (const ing of fullMealData.ingredients_list) {
                const key = ing.ingredient_id
                
                if (!ingredientMap[key]) {
                  const ingredient = await this.getIngredientDetails(ing.ingredient_id)
                  
                  if (!ingredient) {
                    ingredientMap[key] = {
                      id: ing.ingredient_id,
                      name: ing.ingredient_name || ing.name || 'Unknown Ingredient',
                      category: 'other',
                      totalGrams: 0,
                      originalUnit: ing.unit || 'gram',
                      unit: ing.unit || 'gram',
                      instances: [],
                      pricePerUnit: 0,
                      unitType: 'kg',
                      conversionInfo: null
                    }
                  } else {
                    // Check if this ingredient needs piece conversion
                    const convInfo = this.getConversionInfo(ingredient.name, ingredient.unit_type)
                    
                    ingredientMap[key] = {
                      id: ing.ingredient_id,
                      name: ingredient.name || 'Unknown',
                      category: ingredient.category || 'other',
                      totalGrams: 0,
                      originalUnit: ing.unit || 'gram',
                      unit: convInfo ? convInfo.displayUnit : (ing.unit || 'gram'),
                      instances: [],
                      pricePerUnit: ingredient.price_per_unit || 0,
                      unitType: ingredient.unit_type || 'kg',
                      conversionInfo: convInfo
                    }
                  }
                }
                
                const amount = ing.amount || 0
                ingredientMap[key].totalGrams += amount
                ingredientMap[key].instances.push({
                  day, meal: slot, mealName: fullMealData.name, amount
                })
              }
            }
          }
        }
      }
      
      // ── BUILD FINAL LIST WITH CONVERSIONS ──
      const shoppingList = Object.values(ingredientMap).map(item => {
        let displayAmount, totalAmount, unit, estimatedCost
        
        if (item.conversionInfo) {
          // PIECE CONVERSION: grams → stuks
          const pieces = this.convertToPieces(item.totalGrams, item.conversionInfo)
          displayAmount = pieces
          totalAmount = pieces
          unit = item.conversionInfo.displayUnit
          
          // Price: price_per_unit is per piece
          if (item.unitType === 'piece' || item.unitType === 'stuks') {
            estimatedCost = pieces * parseFloat(item.pricePerUnit || 0)
          } else {
            // Fallback: estimate from gram cost
            estimatedCost = this.calculateCost(item.totalGrams, item.pricePerUnit, item.originalUnit, item.unitType)
          }
          
          console.log(`🔄 Converted: ${item.name} ${item.totalGrams}g → ${pieces} ${unit} (€${estimatedCost.toFixed(2)})`)
        } else {
          // NORMAL: keep in grams/ml, apply realistic purchase rounding
          const purchaseAmount = this.calculateRealisticPurchase(item)
          displayAmount = purchaseAmount
          totalAmount = item.totalGrams
          unit = item.originalUnit
          estimatedCost = this.calculateCost(purchaseAmount, item.pricePerUnit, item.originalUnit, item.unitType)
        }
        
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          totalAmount,
          displayAmount,
          unit,
          estimatedCost: Math.round(estimatedCost * 100) / 100,
          instances: item.instances,
          totalGrams: item.totalGrams
        }
      })
      
      // Sort by category
      shoppingList.sort((a, b) => {
        const categoryOrder = ['protein', 'carbs', 'vegetables', 'fats', 'dairy', 'fruit', 'other']
        const aIdx = categoryOrder.indexOf(a.category) !== -1 ? categoryOrder.indexOf(a.category) : 999
        const bIdx = categoryOrder.indexOf(b.category) !== -1 ? categoryOrder.indexOf(b.category) : 999
        if (aIdx !== bIdx) return aIdx - bIdx
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
      return { items: [], totalCost: 0, itemCount: 0, generatedAt: new Date().toISOString() }
    }
  }
  
  // Realistic purchase amounts (only for NON-piece items now)
  calculateRealisticPurchase(item) {
    const amount = item.totalGrams || item.totalAmount || 0
    
    if (item.category === 'protein') {
      if (amount <= 200) return 200
      if (amount <= 400) return 400
      if (amount <= 500) return 500
      if (amount <= 750) return 750
      if (amount <= 1000) return 1000
      return Math.ceil(amount / 500) * 500
    }
    
    if (item.category === 'vegetables') {
      if (amount <= 250) return 250
      if (amount <= 500) return 500
      if (amount <= 750) return 750
      return Math.ceil(amount / 500) * 500
    }
    
    if (item.category === 'carbs') {
      if (amount <= 500) return 500
      if (amount <= 1000) return 1000
      return Math.ceil(amount / 1000) * 1000
    }
    
    if (amount <= 100) return 100
    if (amount <= 250) return 250
    if (amount <= 500) return 500
    if (amount <= 750) return 750
    if (amount <= 1000) return 1000
    return Math.ceil(amount / 500) * 500
  }
  
  // Calculate cost for gram/ml based items
  calculateCost(amount, pricePerUnit, unit, unitType) {
    if (!pricePerUnit) return 0
    const price = parseFloat(pricePerUnit)
    
    if (unit === 'gram' && unitType === 'kg') {
      return (amount / 1000) * price
    }
    if (unit === 'ml' && unitType === 'liter') {
      return (amount / 1000) * price
    }
    if (unitType === 'piece' || unitType === 'stuks') {
      return Math.ceil(amount) * price
    }
    return amount * price
  }
  
  // Get meal with ingredients
  async getMealWithIngredients(mealId) {
    try {
      const { data, error } = await this.supabase
        .from('ai_meals')
        .select('*')
        .eq('id', mealId.trim())
        .single()
      if (error) return null
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
      if (error) return null
      return data
    } catch (error) {
      return null
    }
  }
  
  // Save shopping progress (week_end fix included)
  async saveShoppingProgress(clientId, planId, progress) {
    try {
      const { data: existing } = await this.supabase
        .from('ai_shopping_progress')
        .select('id')
        .eq('client_id', clientId)
        .eq('plan_id', planId)
        .single()
      
      const now = new Date()
      const purchasedCount = Object.values(progress.checkedItems || {}).filter(Boolean).length
      
      if (existing) {
        const { error } = await this.supabase
          .from('ai_shopping_progress')
          .update({
            purchased_items: progress.checkedItems,
            purchased_count: purchasedCount,
            updated_at: now.toISOString()
          })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const weekStart = new Date(now)
        const dayOfWeek = weekStart.getDay()
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        weekStart.setDate(weekStart.getDate() + diffToMonday)
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        
        const { error } = await this.supabase
          .from('ai_shopping_progress')
          .insert({
            client_id: clientId,
            plan_id: planId,
            purchased_items: progress.checkedItems,
            purchased_count: purchasedCount,
            week_start: weekStart.toISOString(),
            week_end: weekEnd.toISOString(),
            created_at: now.toISOString()
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
      return null
    }
  }
  
  // Format amount for display
  formatAmount(amount, unit) {
    if (unit === 'stuks' || unit === 'pieces') return `${Math.round(amount)} stuks`
    if (unit === 'gram' || unit === 'g') {
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}kg`
      return `${Math.round(amount)}g`
    }
    if (unit === 'ml') {
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)}L`
      return `${Math.round(amount)}ml`
    }
    return `${Math.round(amount)} ${unit}`
  }
  
  // Export shopping list as text
  generateExportText(shoppingList) {
    if (!shoppingList?.items) return ''
    
    let text = 'MY ARC BOODSCHAPPENLIJST\n\n'
    const categoryNames = {
      'protein': '🥩 EIWITTEN', 'carbs': '🌾 KOOLHYDRATEN',
      'vegetables': '🥬 GROENTEN', 'fats': '🥑 VETTEN',
      'dairy': '🥛 ZUIVEL', 'fruit': '🍎 FRUIT',
      'sauces': '🧂 SAUZEN & KRUIDEN', 'other': '📦 OVERIG'
    }
    
    const categories = {}
    shoppingList.items.forEach(item => {
      const cat = item.category || 'other'
      if (!categories[cat]) categories[cat] = []
      categories[cat].push(item)
    })
    
    Object.keys(categoryNames).forEach(catKey => {
      if (categories[catKey]) {
        text += `${categoryNames[catKey]}\n`
        categories[catKey].forEach(item => {
          const amount = this.formatAmount(item.displayAmount || item.totalAmount, item.unit)
          text += `- ${item.name} ${amount}\n`
        })
        text += '\n'
      }
    })
    
    text += `Totaal: €${shoppingList.totalCost?.toFixed(2) || '0.00'} · ${shoppingList.itemCount || 0} items\n`
    text += `${new Date().toLocaleDateString('nl-NL')}`
    return text
  }
  
  shareViaWhatsApp(text) {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }
  
  async copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); return true }
    catch { return false }
  }
}
