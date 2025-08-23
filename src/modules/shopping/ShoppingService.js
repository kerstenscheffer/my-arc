// ====================================
// 🛒 SHOPPING MODULE FOR MY ARC
// ====================================

// /src/modules/shopping/ShoppingService.js
class ShoppingService extends DatabaseService {
  constructor() {
    super()
    this.priceCache = new Map()
    this.lastCacheUpdate = null
  }

  // ===== CORE SHOPPING LIST GENERATION =====
  
  async generateShoppingList(clientId, weekDate = null) {
    try {
      console.log('🛒 Generating shopping list for client:', clientId)
      
      // 1. Get client's active meal plan
      const mealPlan = await this.getClientMealPlan(clientId)
      if (!mealPlan) throw new Error('No meal plan found for client')
      
      // 2. Get week structure (with overrides if exists)
      const weekStructure = await this.getWeekStructureWithOverrides(clientId, mealPlan.id)
      
      // 3. Determine which week to generate for
      const targetWeek = weekDate ? this.getWeekIndex(mealPlan.start_date, weekDate) : 0
      const weekDays = weekStructure.slice(targetWeek * 7, (targetWeek + 1) * 7)
      
      // 4. Collect all meal IDs for the week
      const mealIds = weekDays.flatMap(day => 
        (day.meals || []).map(m => m.meal_id).filter(Boolean)
      )
      
      if (mealIds.length === 0) {
        throw new Error('No meals found for this week')
      }
      
      // 5. Get ingredient mappings for all meals
      const ingredients = await this.getIngredientsForMeals(mealIds)
      
      // 6. Aggregate ingredients by product
      const aggregatedProducts = this.aggregateIngredients(ingredients)
      
      // 7. Find best package combinations
      const optimizedList = await this.optimizePackageSizes(aggregatedProducts)
      
      // 8. Get prices from all supermarkets
      const priceComparisons = await this.comparePricesAcrossSupermarkets(optimizedList)
      
      // 9. Create shopping list record
      const shoppingList = await this.createShoppingList({
        client_id: clientId,
        week_date: weekDate || new Date(),
        items: optimizedList,
        price_comparisons: priceComparisons,
        meal_plan_id: mealPlan.id,
        status: 'draft'
      })
      
      return {
        list: shoppingList,
        comparisons: priceComparisons,
        stats: {
          totalMeals: mealIds.length,
          uniqueProducts: optimizedList.length,
          bestSupermarket: priceComparisons[0]?.supermarket_id
        }
      }
      
    } catch (error) {
      console.error('❌ Shopping list generation failed:', error)
      throw error
    }
  }
  
  // ===== INGREDIENT PROCESSING =====
  
  async getIngredientsForMeals(mealIds) {
    const { data, error } = await this.supabase
      .from('ingredient_mappings')
      .select(`
        *,
        product:products(*)
      `)
      .in('meal_id', mealIds)
    
    if (error) throw error
    return data || []
  }
  
  aggregateIngredients(ingredients) {
    const productMap = new Map()
    
    ingredients.forEach(ing => {
      const key = ing.product_id
      if (!key) return
      
      if (productMap.has(key)) {
        const existing = productMap.get(key)
        existing.totalQuantity += ing.quantity
        existing.occurrences += 1
      } else {
        productMap.set(key, {
          product_id: ing.product_id,
          product: ing.product,
          totalQuantity: ing.quantity,
          unit: ing.unit || ing.product?.unit,
          occurrences: 1
        })
      }
    })
    
    return Array.from(productMap.values())
  }
  
  // ===== PACKAGE SIZE OPTIMIZATION =====
  
  async optimizePackageSizes(aggregatedProducts) {
    const optimized = []
    
    for (const item of aggregatedProducts) {
      // Get all available package sizes for this product
      const variants = await this.getProductVariants(item.product_id)
      
      // Calculate optimal combination of packages
      const packages = this.calculateOptimalPackages(
        item.totalQuantity,
        variants
      )
      
      optimized.push({
        ...item,
        packages,
        minimumWaste: packages.reduce((acc, p) => acc + p.waste, 0)
      })
    }
    
    return optimized
  }
  
  calculateOptimalPackages(needed, variants) {
    // Smart algorithm to minimize waste and cost
    // Example: need 450g chicken, available: 300g, 500g, 1kg
    // Result: 1x 500g (50g waste) better than 2x 300g (150g waste but more expensive)
    
    if (!variants || variants.length === 0) {
      return [{ quantity: 1, size: needed, waste: 0 }]
    }
    
    // Sort by package size
    const sorted = [...variants].sort((a, b) => a.package_size - b.package_size)
    
    // Find best single package
    const singlePackage = sorted.find(v => v.package_size >= needed)
    if (singlePackage) {
      return [{
        product_id: singlePackage.id,
        quantity: 1,
        size: singlePackage.package_size,
        waste: singlePackage.package_size - needed
      }]
    }
    
    // Need multiple packages
    const largest = sorted[sorted.length - 1]
    const fullPackages = Math.floor(needed / largest.package_size)
    const remainder = needed % largest.package_size
    
    const result = []
    if (fullPackages > 0) {
      result.push({
        product_id: largest.id,
        quantity: fullPackages,
        size: largest.package_size,
        waste: 0
      })
    }
    
    if (remainder > 0) {
      const remainderPackage = sorted.find(v => v.package_size >= remainder)
      if (remainderPackage) {
        result.push({
          product_id: remainderPackage.id,
          quantity: 1,
          size: remainderPackage.package_size,
          waste: remainderPackage.package_size - remainder
        })
      }
    }
    
    return result
  }
  
  // ===== PRICE COMPARISON ENGINE =====
  
  async comparePricesAcrossSupermarkets(shoppingList) {
    const supermarkets = await this.getSupermarkets()
    const comparisons = []
    
    for (const supermarket of supermarkets) {
      const comparison = await this.calculateSupermarketTotal(
        shoppingList,
        supermarket.id
      )
      comparisons.push({
        ...comparison,
        supermarket
      })
    }
    
    // Sort by total price
    comparisons.sort((a, b) => a.totalPrice - b.totalPrice)
    
    // Add savings info
    if (comparisons.length > 1) {
      const cheapest = comparisons[0].totalPrice
      comparisons.forEach(c => {
        c.savings = c.totalPrice - cheapest
        c.savingsPercentage = ((c.savings / c.totalPrice) * 100).toFixed(1)
      })
    }
    
    return comparisons
  }
  
  async calculateSupermarketTotal(items, supermarketId) {
    let totalPrice = 0
    let totalPromotionSavings = 0
    const missingItems = []
    const itemPrices = []
    
    for (const item of items) {
      const prices = await this.getProductPrices(
        item.packages.map(p => p.product_id),
        supermarketId
      )
      
      if (prices.length === 0) {
        missingItems.push(item)
        continue
      }
      
      let itemTotal = 0
      prices.forEach(price => {
        const pkg = item.packages.find(p => p.product_id === price.product_id)
        if (pkg) {
          const effectivePrice = price.promotion_price || price.price
          itemTotal += effectivePrice * pkg.quantity
          
          if (price.promotion_price) {
            totalPromotionSavings += (price.price - price.promotion_price) * pkg.quantity
          }
        }
      })
      
      totalPrice += itemTotal
      itemPrices.push({
        ...item,
        price: itemTotal,
        hasPromotion: prices.some(p => p.promotion_price)
      })
    }
    
    return {
      supermarket_id: supermarketId,
      totalPrice,
      totalPromotionSavings,
      missingItems,
      itemPrices,
      availability: ((items.length - missingItems.length) / items.length * 100).toFixed(0)
    }
  }
  
  // ===== SMART FEATURES =====
  
  async suggestAlternatives(productId, supermarketId) {
    // Find similar products that are cheaper
    const product = await this.getProduct(productId)
    if (!product) return []
    
    const { data: alternatives } = await this.supabase
      .from('products')
      .select(`
        *,
        prices:product_prices!inner(
          price,
          promotion_price
        )
      `)
      .eq('category', product.category)
      .eq('prices.supermarket_id', supermarketId)
      .neq('id', productId)
      .order('prices.price', { ascending: true })
      .limit(5)
    
    return alternatives || []
  }
  
  async findBulkDeals(shoppingList) {
    const deals = []
    
    for (const item of shoppingList) {
      if (item.occurrences >= 2) {
        // Product needed multiple times this week
        const bulkOptions = await this.getBulkOptions(item.product_id)
        
        if (bulkOptions.length > 0) {
          const regularCost = item.packages.reduce((sum, p) => sum + p.price, 0)
          const bulkCost = bulkOptions[0].price
          
          if (bulkCost < regularCost * 0.85) {
            deals.push({
              product: item.product,
              regularCost,
              bulkCost,
              savings: regularCost - bulkCost,
              suggestion: `Koop bulk verpakking en bespaar €${(regularCost - bulkCost).toFixed(2)}`
            })
          }
        }
      }
    }
    
    return deals
  }
  
  async analyzeSeasonalPricing(productId) {
    // Get price history for seasonal analysis
    const { data: history } = await this.supabase
      .from('product_price_history')
      .select('price, date')
      .eq('product_id', productId)
      .gte('date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .order('date', { ascending: true })
    
    if (!history || history.length < 30) return null
    
    // Calculate seasonal trends
    const months = Array(12).fill(0).map(() => ({ total: 0, count: 0 }))
    
    history.forEach(record => {
      const month = new Date(record.date).getMonth()
      months[month].total += record.price
      months[month].count++
    })
    
    const averages = months.map(m => 
      m.count > 0 ? m.total / m.count : null
    )
    
    const currentMonth = new Date().getMonth()
    const currentAvg = averages[currentMonth]
    const yearAvg = averages.filter(a => a !== null).reduce((sum, a) => sum + a, 0) / averages.filter(a => a !== null).length
    
    return {
      currentTrend: currentAvg > yearAvg ? 'high' : 'low',
      bestMonths: averages
        .map((avg, idx) => ({ month: idx, price: avg }))
        .filter(m => m.price !== null)
        .sort((a, b) => a.price - b.price)
        .slice(0, 3)
        .map(m => new Date(2024, m.month, 1).toLocaleString('nl-NL', { month: 'long' })),
      priceVariation: ((Math.max(...averages.filter(a => a)) - Math.min(...averages.filter(a => a))) / yearAvg * 100).toFixed(0)
    }
  }
  
  // ===== ROUTE OPTIMIZATION =====
  
  async optimizeShoppingRoute(shoppingList, userLocation) {
    // If savings > €10, consider multiple supermarkets
    const comparisons = await this.comparePricesAcrossSupermarkets(shoppingList)
    
    if (comparisons.length < 2) return null
    
    const cheapest = comparisons[0]
    const potentialSavings = comparisons[1].totalPrice - cheapest.totalPrice
    
    if (potentialSavings < 10) {
      return {
        recommendation: 'single',
        supermarket: cheapest.supermarket,
        reason: 'Besparing te klein voor meerdere winkels'
      }
    }
    
    // Check if we can split effectively
    const splitAnalysis = await this.analyzeSplitShopping(shoppingList, comparisons)
    
    if (splitAnalysis.worthIt) {
      return {
        recommendation: 'split',
        route: splitAnalysis.route,
        savings: splitAnalysis.savings,
        extraTime: splitAnalysis.extraTime,
        reason: `Bespaar €${splitAnalysis.savings.toFixed(2)} met ${splitAnalysis.extraTime} minuten extra reistijd`
      }
    }
    
    return {
      recommendation: 'single',
      supermarket: cheapest.supermarket,
      reason: 'Enkele winkel is efficiënter'
    }
  }
  
  // ===== DATABASE OPERATIONS =====
  
  async createShoppingList(data) {
    const { data: list, error } = await this.supabase
      .from('shopping_lists')
      .insert({
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single()
    
    if (error) throw error
    return list
  }
  
  async updateShoppingList(id, updates) {
    const { data, error } = await this.supabase
      .from('shopping_lists')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  async getShoppingHistory(clientId, limit = 10) {
    const { data, error } = await this.supabase
      .from('shopping_lists')
      .select(`
        *,
        supermarket:supermarkets(name, logo_url)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }
  
  // ===== CROWD SOURCING =====
  
  async reportPrice(userId, productId, supermarketId, price, receiptImage = null) {
    const { data, error } = await this.supabase
      .from('price_reports')
      .insert({
        reporter_id: userId,
        product_id: productId,
        supermarket_id: supermarketId,
        reported_price: price,
        receipt_image_url: receiptImage,
        points_awarded: 10, // Gamification
        created_at: new Date()
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Update product price if confidence is high
    await this.updatePriceIfConfident(productId, supermarketId, price)
    
    return data
  }
  
  async updatePriceIfConfident(productId, supermarketId, newPrice) {
    // Get recent reports
    const { data: reports } = await this.supabase
      .from('price_reports')
      .select('reported_price')
      .eq('product_id', productId)
      .eq('supermarket_id', supermarketId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .limit(5)
    
    if (!reports || reports.length < 3) return
    
    // Calculate average
    const avg = reports.reduce((sum, r) => sum + r.reported_price, 0) / reports.length
    const variance = reports.reduce((sum, r) => sum + Math.pow(r.reported_price - avg, 2), 0) / reports.length
    
    // Update if low variance (consistent reports)
    if (variance < 0.5) {
      await this.supabase
        .from('product_prices')
        .update({
          price: avg,
          last_updated: new Date(),
          data_source: 'crowdsourced'
        })
        .eq('product_id', productId)
        .eq('supermarket_id', supermarketId)
    }
  }
  
  // ===== HELPER METHODS =====
  
  getWeekIndex(startDate, targetDate) {
    const start = new Date(startDate)
    const target = new Date(targetDate)
    const diffTime = Math.abs(target - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / 7)
  }
  
  async getSupermarkets() {
    const { data, error } = await this.supabase
      .from('supermarkets')
      .select('*')
      .order('price_level', { ascending: true })
    
    if (error) throw error
    return data || []
  }
  
  async getProduct(productId) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()
    
    if (error) throw error
    return data
  }
  
  async getProductVariants(baseProductId) {
    // Get all size variants of the same product
    const product = await this.getProduct(baseProductId)
    if (!product) return []
    
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('name', product.name)
      .eq('brand', product.brand)
      .order('package_size', { ascending: true })
    
    if (error) throw error
    return data || []
  }
  
  async getProductPrices(productIds, supermarketId) {
    const { data, error } = await this.supabase
      .from('product_prices')
      .select('*')
      .in('product_id', productIds)
      .eq('supermarket_id', supermarketId)
    
    if (error) throw error
    return data || []
  }
  
  async getWeekStructureWithOverrides(clientId, planId) {
    // First get base plan
    const { data: plan } = await this.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', planId)
      .single()
    
    // Check for overrides
    const { data: overrides } = await this.supabase
      .from('client_meal_overrides')
      .select('week_structure')
      .eq('client_id', clientId)
      .eq('plan_id', planId)
      .single()
    
    return overrides?.week_structure || plan?.week_structure || []
  }
  
  async getBulkOptions(productId) {
    const product = await this.getProduct(productId)
    if (!product) return []
    
    // Find larger packages of same product
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        prices:product_prices(
          price,
          promotion_price,
          supermarket_id
        )
      `)
      .eq('name', product.name)
      .eq('brand', product.brand)
      .gt('package_size', product.package_size * 2)
      .order('package_size', { ascending: true })
      .limit(3)
    
    if (error) throw error
    return data || []
  }
  
  async analyzeSplitShopping(shoppingList, comparisons) {
    // Complex algorithm to determine if splitting shopping is worth it
    // Factors: savings, distance, time, product categories
    
    const categoryPrices = new Map()
    
    // Analyze which supermarket is best for each category
    for (const item of shoppingList) {
      const category = item.product.category
      
      if (!categoryPrices.has(category)) {
        categoryPrices.set(category, [])
      }
      
      for (const comp of comparisons.slice(0, 3)) {
        const itemPrice = comp.itemPrices.find(p => p.product_id === item.product_id)
        if (itemPrice) {
          categoryPrices.get(category).push({
            supermarket: comp.supermarket_id,
            price: itemPrice.price,
            category
          })
        }
      }
    }
    
    // Determine optimal split
    const optimalSplit = new Map()
    
    for (const [category, prices] of categoryPrices) {
      const sorted = prices.sort((a, b) => a.price - b.price)
      if (sorted.length > 0) {
        optimalSplit.set(category, sorted[0].supermarket)
      }
    }
    
    // Calculate if split is worth it
    const uniqueStores = new Set(optimalSplit.values()).size
    
    if (uniqueStores === 1) {
      return { worthIt: false }
    }
    
    // Calculate potential savings
    let splitTotal = 0
    let singleTotal = comparisons[0].totalPrice
    
    for (const item of shoppingList) {
      const bestStore = optimalSplit.get(item.product.category)
      const comp = comparisons.find(c => c.supermarket_id === bestStore)
      if (comp) {
        const itemPrice = comp.itemPrices.find(p => p.product_id === item.product_id)
        if (itemPrice) {
          splitTotal += itemPrice.price
        }
      }
    }
    
    const savings = singleTotal - splitTotal
    const extraTime = (uniqueStores - 1) * 15 // 15 min per extra store
    
    return {
      worthIt: savings > 15 && savings / extraTime > 0.5, // €0.50 per minute
      savings,
      extraTime,
      route: Array.from(optimalSplit.entries()).map(([cat, store]) => ({
        category: cat,
        supermarket: comparisons.find(c => c.supermarket_id === store)?.supermarket
      }))
    }
  }
}

export default ShoppingService
