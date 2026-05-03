// src/modules/meal-plan/components/food-log/FatSecretService.js
// 🎯 FatSecret via Supabase Edge Function proxy
// All calls go through: browser → Edge Function → FatSecret
// No CORS issues, token managed server-side

export default class FatSecretService {
  constructor(supabase) {
    this.supabase = supabase
    this.baseUrl = supabase.supabaseUrl || 'https://xlaycpwpnhjmulfsnynh.supabase.co'
    this.apiKey = supabase.supabaseKey || ''
    console.log('✅ [FatSecret] Initialized (OAuth 1.0)')
  }

  // ═══════════════════════════════════════════
  // CALL EDGE FUNCTION (direct fetch, no supabase.functions.invoke)
  // ═══════════════════════════════════════════

  async callProxy(body) {
    const resp = await fetch(`${this.baseUrl}/functions/v1/fatsecret-oauth1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    })
    if (!resp.ok) throw new Error(`FatSecret proxy: ${resp.status}`)
    return await resp.json()
  }

  // ═══════════════════════════════════════════
  // FOOD SEARCH
  // ═══════════════════════════════════════════

  async searchFood(query, maxResults = 15) {
    try {
      console.log('🔍 [FatSecret] Searching:', query)

      const data = await this.callProxy({
        action: 'search',
        query: query
      })

      // New OAuth1 endpoint returns { foods: [...normalized...], total, page }
      const foods = data?.foods
      if (!foods || foods.length === 0) {
        console.log('🔍 [FatSecret] No results')
        return []
      }

      console.log(`✅ [FatSecret] Found ${foods.length} results`)

      return foods.map(f => ({
        id: f.food_id,
        name: f.name,
        brand: f.brand || null,
        calories: f.calories || 0,
        protein: f.protein || 0,
        carbs: f.carbs || 0,
        fat: f.fat || 0,
        type: f.type === 'Brand' ? 'product' : 'ingredient',
        source: 'fatsecret',
        sourceLabel: f.brand ? 'Product' : 'Voeding',
        per100g: (f.serving || '').includes('100'),
        externalId: f.food_id
      }))
    } catch (err) {
      console.error('❌ [FatSecret] Search failed:', err)
      return []
    }
  }

  // ═══════════════════════════════════════════
  // BARCODE LOOKUP
  // ═══════════════════════════════════════════

  async findByBarcode(barcode) {
    try {
      console.log('🔍 [FatSecret] Barcode lookup:', barcode)

      const data = await this.callProxy({
        action: 'barcode',
        barcode: barcode
      })

      if (!data?.food) {
        console.log('❌ [FatSecret] Barcode not found')
        return null
      }

      const f = data.food
      return {
        id: f.food_id,
        name: f.name,
        brand: f.brand || null,
        calories: f.calories_per_100g || 0,
        protein: f.protein_per_100g || 0,
        carbs: f.carbs_per_100g || 0,
        fat: f.fat_per_100g || 0,
        fiber: f.fiber_per_100g || 0,
        sugar_per_100g: f.sugar_per_100g || 0,
        saturated_fat_per_100g: f.saturated_fat_per_100g || 0,
        sodium_per_100g: f.sodium_per_100g || 0,
        serving_description: f.serving_description,
        barcode: barcode,
        type: 'product',
        source: 'fatsecret',
        per100g: true,
        externalId: f.food_id
      }
    } catch (err) {
      console.error('❌ [FatSecret] Barcode lookup failed:', err)
      return null
    }
  }

  // ═══════════════════════════════════════════
  // GET FOOD BY ID
  // ═══════════════════════════════════════════

  async getFoodById(foodId) {
    try {
      const data = await this.callProxy({
        action: 'get',
        food_id: foodId.toString()
      })

      if (!data?.food) return null
      return this.normalizeFoodDetail(data.food)
    } catch (err) {
      console.error('❌ [FatSecret] getFoodById failed:', err)
      return null
    }
  }

  // ═══════════════════════════════════════════
  // NORMALIZE search result
  // ═══════════════════════════════════════════

  normalizeFood(food) {
    const desc = food.food_description || ''
    const macros = this.parseMacrosFromDescription(desc)

    return {
      id: food.food_id,
      name: food.food_name,
      brand: food.brand_name || null,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      type: food.food_type === 'Brand' ? 'product' : 'ingredient',
      source: 'fatsecret',
      sourceLabel: food.food_type === 'Brand' ? 'Product' : 'Voeding',
      per100g: desc.toLowerCase().includes('per 100'),
      description: desc,
      externalId: food.food_id
    }
  }

  // ═══════════════════════════════════════════
  // NORMALIZE full food detail
  // ═══════════════════════════════════════════

  normalizeFoodDetail(food) {
    let servings = food.servings?.serving
    if (!servings) return null
    if (!Array.isArray(servings)) servings = [servings]

    const per100g = servings.find(s =>
      s.serving_description?.includes('100') ||
      s.metric_serving_amount === '100.000'
    ) || servings[0]

    return {
      id: food.food_id,
      name: food.food_name,
      brand: food.brand_name || null,
      calories: Math.round(parseFloat(per100g.calories) || 0),
      protein: Math.round(parseFloat(per100g.protein) || 0),
      carbs: Math.round(parseFloat(per100g.carbohydrate) || 0),
      fat: Math.round(parseFloat(per100g.fat) || 0),
      sugar_per_100g: Math.round(parseFloat(per100g.sugar) || 0),
      saturated_fat_per_100g: Math.round(parseFloat(per100g.saturated_fat) || 0),
      sodium_per_100g: Math.round(parseFloat(per100g.sodium) || 0),
      fiber: Math.round(parseFloat(per100g.fiber) || 0),
      serving_description: per100g.serving_description,
      type: food.food_type === 'Brand' ? 'product' : 'ingredient',
      source: 'fatsecret',
      sourceLabel: food.food_type === 'Brand' ? 'Product' : 'Voeding',
      per100g: true,
      externalId: food.food_id
    }
  }

  // ═══════════════════════════════════════════
  // PARSE macros from description string
  // ═══════════════════════════════════════════

  parseMacrosFromDescription(desc) {
    const macros = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const calMatch = desc.match(/Calories:\s*([\d.]+)/)
    const fatMatch = desc.match(/Fat:\s*([\d.]+)/)
    const carbMatch = desc.match(/Carbs:\s*([\d.]+)/)
    const protMatch = desc.match(/Protein:\s*([\d.]+)/)
    if (calMatch) macros.calories = Math.round(parseFloat(calMatch[1]))
    if (fatMatch) macros.fat = Math.round(parseFloat(fatMatch[1]))
    if (carbMatch) macros.carbs = Math.round(parseFloat(carbMatch[1]))
    if (protMatch) macros.protein = Math.round(parseFloat(protMatch[1]))
    return macros
  }
}
