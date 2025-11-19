// src/modules/ai-meal-generator/ShoppingListFormatter.js
// SHOPPING LIST FORMATTER SERVICE
// Transforms raw ingredient data into practical, buyable quantities

/**
 * MY ARC - SHOPPING LIST FORMATTER
 * 
 * Takes raw shopping list with precise decimals and transforms to:
 * - Rounded, practical quantities
 * - Store-friendly units (packs, stuks, blikken)
 * - Bundled items (4 eieren → 1 doos van 6)
 * - Smart rounding rules per category
 */

class ShoppingListFormatter {
  constructor() {
    // Rounding rules per category
    this.roundingRules = {
      // Verse producten - rond naar 50g/100g
      'Eiwitten': { roundTo: 100, minUnit: 50 },
      'Groenten': { roundTo: 100, minUnit: 50 },
      'Fruit': { roundTo: 100, minUnit: 50 },
      
      // Droge producten - rond naar 100g/250g
      'Koolhydraten': { roundTo: 250, minUnit: 100 },
      'Overig': { roundTo: 100, minUnit: 50 },
      
      // Zuivel - rond naar 250ml/500ml
      'Zuivel': { roundTo: 250, minUnit: 100 },
      
      // Vetten - klein, rond naar 10ml/25ml
      'Vetten & Oliën': { roundTo: 25, minUnit: 10 },
      
      // Kruiden - heel klein
      'Kruiden & Specerijen': { roundTo: 10, minUnit: 5 }
    }
    
    // Store packaging patterns
    this.packagingPatterns = {
      'Eieren': { packSize: 6, unit: 'stuks', displayAs: 'doos' },
      'Yoghurt': { packSize: 500, unit: 'ml', displayAs: 'beker' },
      'Melk': { packSize: 1000, unit: 'ml', displayAs: 'pak' },
      'Rijst': { packSize: 1000, unit: 'gram', displayAs: 'pak' },
      'Pasta': { packSize: 500, unit: 'gram', displayAs: 'pak' },
      'Havermout': { packSize: 500, unit: 'gram', displayAs: 'pak' },
      'Broccoli': { packSize: 300, unit: 'gram', displayAs: 'stuk' },
      'Olijfolie': { packSize: 500, unit: 'ml', displayAs: 'fles' }
    }
  }
  
  /**
   * Main formatting function
   * @param {Object} rawShoppingList - Raw shopping list from generator
   * @returns {Object} Formatted shopping list with practical quantities
   */
  formatShoppingList(rawShoppingList) {
    console.log('🛒 === SHOPPING LIST FORMATTING START ===')
    console.log(`📊 Input: ${rawShoppingList.ingredients?.length || 0} ingredients`)
    
    if (!rawShoppingList.ingredients || rawShoppingList.ingredients.length === 0) {
      return this.emptyList()
    }
    
    const formattedIngredients = []
    let estimatedCost = 0
    
    rawShoppingList.ingredients.forEach(ingredient => {
      const formatted = this.formatIngredient(ingredient)
      formattedIngredients.push(formatted)
      estimatedCost += formatted.estimatedCost || 0
    })
    
    // Sort by category, then alphabetically
    formattedIngredients.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.name.localeCompare(b.name)
    })
    
    console.log('✅ === FORMATTING COMPLETE ===')
    console.log(`📊 Output: ${formattedIngredients.length} items`)
    console.log(`💰 Estimated cost: €${estimatedCost.toFixed(2)}`)
    
    return {
      ingredients: formattedIngredients,
      totalCost: estimatedCost.toFixed(2),
      itemCount: formattedIngredients.length,
      weekDays: rawShoppingList.weekDays || 7,
      formattedAt: new Date().toISOString(),
      practicalFormat: true
    }
  }
  
  /**
   * Format single ingredient with smart rounding and package calculation
   */
  formatIngredient(ingredient) {
    const category = ingredient.category || 'Overig'
    const originalAmount = ingredient.totalAmount || 0
    const unit = ingredient.unit || 'g'
    
    // ⚠️ CHECK FOR UNRESOLVED INGREDIENT (UUID as name)
    const isUnresolvedUUID = ingredient.name && (
      ingredient.name.includes('9999999') || 
      ingredient.name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    )
    
    if (isUnresolvedUUID) {
      console.warn(`⚠️ UNRESOLVED INGREDIENT: ${ingredient.name} - Using fallback "Onbekend Ingredient"`)
      return {
        id: ingredient.id,
        name: '⚠️ Onbekend Ingredient',
        originalAmount: originalAmount,
        originalUnit: unit,
        amount: Math.round(originalAmount),
        unit: unit,
        displayAmount: `${Math.round(originalAmount)}${unit}`,
        category: 'Overig',
        usedIn: ingredient.usedIn || [],
        estimatedCost: 0,
        shoppingTip: '⚠️ Dit ingredient ontbreekt in database - controleer je meal plan'
      }
    }
    
    console.log(`\n📦 Formatting: ${ingredient.name}`)
    console.log(`   Original: ${originalAmount}${unit}`)
    
    // ✅ DYNAMIC PACKAGE CALCULATION FROM DATABASE
    if (ingredient.purchase_unit && ingredient.purchase_price) {
      console.log(`   ✅ Using database purchase info: ${ingredient.purchase_unit}`)
      
      // Parse purchase_unit to extract size and unit
      // Examples: "6 stuks", "500g", "1kg zak", "400ml blik"
      const parsed = this.parsePurchaseUnit(ingredient.purchase_unit)
      
      if (parsed) {
        // Calculate how many packages needed
        const packagesNeeded = Math.ceil(originalAmount / parsed.size)
        const totalAmount = packagesNeeded * parsed.size
        const totalCost = packagesNeeded * ingredient.purchase_price
        
        console.log(`   📊 Calculation:`)
        console.log(`      Need: ${originalAmount}${unit}`)
        console.log(`      Package size: ${parsed.size}${parsed.unit}`)
        console.log(`      Packages: ${packagesNeeded}`)
        console.log(`      Total: ${totalAmount}${parsed.unit}`)
        console.log(`      Cost: €${totalCost.toFixed(2)}`)
        
        return {
          id: ingredient.id,
          name: ingredient.name,
          originalAmount: originalAmount,
          originalUnit: unit,
          
          // Package info
          packagesNeeded: packagesNeeded,
          packageSize: parsed.size,
          packageUnit: parsed.unit,
          packageDescription: ingredient.purchase_unit,
          
          // Totals
          amount: totalAmount,
          unit: parsed.unit,
          displayAmount: `${packagesNeeded}x ${ingredient.purchase_unit} (${totalAmount} ${parsed.unit} totaal)`,
          
          // Cost
          pricePerPackage: ingredient.purchase_price,
          estimatedCost: totalCost,
          
          category: category,
          usedIn: ingredient.usedIn || [],
          shoppingTip: packagesNeeded > 5 ? `Let op: ${packagesNeeded} ${parsed.packageType || 'pakken'} nodig - overweeg bulk` : null
        }
      }
    }
    
    // FALLBACK: No purchase info in database - use smart rounding
    console.log(`   ⚠️ No purchase info - using smart rounding`)
    const rounded = this.smartRound(originalAmount, category, unit)
    
    console.log(`   Rounded: ${rounded.amount}${rounded.unit}`)
    console.log(`   Display: ${rounded.displayAmount}`)
    
    return {
      id: ingredient.id,
      name: ingredient.name,
      originalAmount: originalAmount,
      originalUnit: unit,
      amount: rounded.amount,
      unit: rounded.unit,
      displayAmount: rounded.displayAmount,
      category: category,
      usedIn: ingredient.usedIn || [],
      estimatedCost: this.estimateCost(rounded.amount, rounded.unit, ingredient.name),
      shoppingTip: rounded.shoppingTip
    }
  }
  
  /**
   * Parse purchase_unit string to extract size and unit
   * Examples:
   * "6 stuks" → {size: 6, unit: "stuks", packageType: "doos"}
   * "500g" → {size: 500, unit: "g", packageType: "pak"}
   * "1kg zak" → {size: 1000, unit: "g", packageType: "zak"}
   * "400ml blik" → {size: 400, unit: "ml", packageType: "blik"}
   */
  parsePurchaseUnit(purchaseUnit) {
    if (!purchaseUnit) return null
    
    const str = purchaseUnit.toLowerCase().trim()
    
    // Pattern: "NUMBER UNIT [TYPE]"
    // Examples: "6 stuks", "500g pak", "1kg zak", "400ml blik"
    
    // Try to extract number
    const numberMatch = str.match(/(\d+(?:\.\d+)?)\s*/)
    if (!numberMatch) return null
    
    const size = parseFloat(numberMatch[1])
    
    // Detect unit
    let unit = 'g' // default
    let packageType = 'pak'
    
    if (str.includes('stuks') || str.includes('stuk')) {
      unit = 'stuks'
      packageType = 'doos'
    } else if (str.includes('kg')) {
      unit = 'g'
      // Convert kg to grams
      return { size: size * 1000, unit: 'g', packageType: str.includes('zak') ? 'zak' : 'pak' }
    } else if (str.includes('liter') || str.includes('l')) {
      unit = 'ml'
      // Convert liters to ml
      return { size: size * 1000, unit: 'ml', packageType: str.includes('fles') ? 'fles' : 'pak' }
    } else if (str.includes('ml')) {
      unit = 'ml'
      packageType = str.includes('blik') ? 'blik' : str.includes('fles') ? 'fles' : 'pak'
    } else if (str.includes('gram') || str.includes('g')) {
      unit = 'g'
      packageType = str.includes('zak') ? 'zak' : str.includes('pak') ? 'pak' : str.includes('pot') ? 'pot' : 'pak'
    }
    
    // Detect package type from string
    if (str.includes('doos')) packageType = 'doos'
    if (str.includes('zak')) packageType = 'zak'
    if (str.includes('pak')) packageType = 'pak'
    if (str.includes('blik')) packageType = 'blik'
    if (str.includes('fles')) packageType = 'fles'
    if (str.includes('pot')) packageType = 'pot'
    if (str.includes('beker')) packageType = 'beker'
    
    console.log(`   🔍 Parsed "${purchaseUnit}" → size:${size} unit:${unit} type:${packageType}`)
    
    return { size, unit, packageType }
  }
  
  /**
   * Format with store packaging (eieren → dozen, melk → pakken)
   */
  formatWithPackaging(ingredient, packagingKey, originalAmount, unit) {
    const packaging = this.packagingPatterns[packagingKey]
    const packs = Math.ceil(originalAmount / packaging.packSize)
    
    console.log(`   Packaging: ${packs} ${packaging.displayAs}`)
    
    return {
      id: ingredient.id,
      name: ingredient.name,
      originalAmount: originalAmount,
      originalUnit: unit,
      amount: packs,
      unit: packaging.displayAs,
      displayAmount: `${packs} ${packaging.displayAs}`,
      packDetails: `${packs} × ${packaging.packSize}${packaging.unit}`,
      category: ingredient.category || 'Overig',
      usedIn: ingredient.usedIn || [],
      estimatedCost: this.estimateCost(packs, packaging.displayAs, ingredient.name),
      shoppingTip: packs > 3 ? `${packs} ${packaging.displayAs} - overweeg voordeelverpakking` : null
    }
  }
  
  /**
   * Smart rounding based on category and amount
   */
  smartRound(amount, category, unit) {
    const rules = this.roundingRules[category] || this.roundingRules['Overig']
    
    // Convert ml to gram equivalent for rounding
    const normalizedAmount = unit === 'ml' ? amount : amount
    
    // Very small amounts (< 50) - round to 5g/ml
    if (normalizedAmount < 50) {
      const rounded = Math.ceil(normalizedAmount / 5) * 5
      return {
        amount: rounded,
        unit: unit,
        displayAmount: `${rounded}${unit}`,
        shoppingTip: rounded < 25 ? 'Heel kleine hoeveelheid - mogelijk niet los verkrijgbaar' : null
      }
    }
    
    // Small amounts (50-200) - round to minUnit
    if (normalizedAmount < 200) {
      const rounded = Math.ceil(normalizedAmount / rules.minUnit) * rules.minUnit
      return {
        amount: rounded,
        unit: unit,
        displayAmount: `${rounded}${unit}`
      }
    }
    
    // Medium amounts (200-1000) - round to roundTo value
    if (normalizedAmount < 1000) {
      const rounded = Math.ceil(normalizedAmount / rules.roundTo) * rules.roundTo
      return {
        amount: rounded,
        unit: unit,
        displayAmount: `${rounded}${unit}`
      }
    }
    
    // Large amounts (>1000) - convert to kg/liter
    const largeUnit = unit === 'ml' ? 'liter' : 'kg'
    const converted = normalizedAmount / 1000
    const rounded = Math.ceil(converted * 4) / 4 // Round to nearest 0.25
    
    return {
      amount: rounded,
      unit: largeUnit,
      displayAmount: rounded === Math.floor(rounded) 
        ? `${Math.floor(rounded)} ${largeUnit}`
        : `${rounded.toFixed(2).replace('.', ',')} ${largeUnit}`,
      shoppingTip: rounded > 2 ? 'Grote hoeveelheid - overweeg voordeelverpakking' : null
    }
  }
  
  /**
   * Find packaging pattern key for ingredient
   */
  findPackagingKey(ingredientName) {
    const nameLower = ingredientName.toLowerCase()
    
    for (const [key, pattern] of Object.entries(this.packagingPatterns)) {
      if (nameLower.includes(key.toLowerCase())) {
        return key
      }
    }
    
    return null
  }
  
  /**
   * Estimate cost based on typical supermarket prices
   */
  estimateCost(amount, unit, ingredientName) {
    // Simplified cost estimation (€ per 100g/ml as baseline)
    const pricesPer100 = {
      'kip': 1.5,
      'zalm': 3.0,
      'eieren': 0.4,
      'rijst': 0.2,
      'pasta': 0.15,
      'broccoli': 0.8,
      'olijfolie': 1.2,
      'melk': 0.12
    }
    
    const nameLower = ingredientName.toLowerCase()
    let basePricePer100 = 0.5 // Default
    
    for (const [key, price] of Object.entries(pricesPer100)) {
      if (nameLower.includes(key)) {
        basePricePer100 = price
        break
      }
    }
    
    // Convert amount to 100g/ml units
    let units = 0
    if (unit === 'kg' || unit === 'liter') {
      units = amount * 10
    } else if (unit === 'gram' || unit === 'ml') {
      units = amount / 100
    } else if (unit === 'stuks' || unit === 'doos' || unit === 'pak') {
      units = amount * 3 // Rough estimate
    }
    
    return units * basePricePer100
  }
  
  /**
   * Empty list fallback
   */
  emptyList() {
    return {
      ingredients: [],
      totalCost: '0.00',
      itemCount: 0,
      weekDays: 0,
      formattedAt: new Date().toISOString(),
      practicalFormat: true
    }
  }
  
  /**
   * Generate shopping tips based on list analysis
   */
  generateShoppingTips(formattedList) {
    const tips = []
    
    // Check for large quantities
    const largeItems = formattedList.ingredients.filter(i => 
      (i.unit === 'kg' && i.amount > 2) || 
      (i.unit === 'liter' && i.amount > 2)
    )
    
    if (largeItems.length > 0) {
      tips.push({
        type: 'bulk',
        message: `Je hebt ${largeItems.length} grote hoeveelheden. Overweeg bulkverpakkingen voor: ${largeItems.map(i => i.name).join(', ')}`
      })
    }
    
    // Check for expensive items
    const expensiveItems = formattedList.ingredients.filter(i => i.estimatedCost > 10)
    if (expensiveItems.length > 0) {
      tips.push({
        type: 'budget',
        message: `Let op je budget bij: ${expensiveItems.map(i => i.name).join(', ')}`
      })
    }
    
    // Category shopping tips
    const categories = [...new Set(formattedList.ingredients.map(i => i.category))]
    tips.push({
      type: 'route',
      message: `Shop per categorie: ${categories.join(' → ')}`
    })
    
    return tips
  }
}

// Export singleton
let formatterInstance = null

export function getShoppingListFormatter() {
  if (!formatterInstance) {
    formatterInstance = new ShoppingListFormatter()
  }
  return formatterInstance
}

export default ShoppingListFormatter
