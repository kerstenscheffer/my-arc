// src/modules/meal-plan/components/food-log/SmartLoggingService.js
// 🎯 v2.0 — Slaat amount + per_unit op zodat Picker later met juiste portie opent
// Diagnostic logs blijven (prefix [SERVICE]) — kunnen later weg

export default class SmartLoggingService {
  constructor(supabase) {
    this.supabase = supabase
    console.log('✅ [SmartLogging] Initialized')
  }

  // ═══════════════════════════════════════════
  // MAIN: Log a meal + enrich database
  // ═══════════════════════════════════════════

  async logMeal(clientId, mealData) {
    try {
      console.log('🔍 [SERVICE] logMeal called with:', {
        name: mealData.name,
        sourceId: mealData.sourceId,
        type: mealData.type,
        source: mealData.source,
        meal_type: mealData.meal_type,
        per100g: mealData.per100g,
        amount: mealData.amount,
        per_unit: mealData.per_unit,
        macros: {
          calories: mealData.calories,
          protein: mealData.protein,
          carbs: mealData.carbs,
          fat: mealData.fat
        }
      })

      console.log('🎯 [SmartLogging] Logging:', mealData.name)

      const existingLog = await this.findExistingLog(clientId, mealData.name)

      console.log('🔍 [SERVICE] findExistingLog result:', existingLog ? {
        id: existingLog.id,
        meal_name: existingLog.meal_name,
        log_count: existingLog.log_count
      } : 'null (no existing log found)')

      let result
      if (existingLog) {
        const newLogCount = existingLog.log_count + 1
        console.log('🔍 [SERVICE] Existing log found — inserting new row with log_count:', newLogCount)
        result = await this.insertConsumedMeal(clientId, mealData, newLogCount)
      } else {
        console.log('🔍 [SERVICE] No existing log — inserting new row with log_count: 1')
        result = await this.insertConsumedMeal(clientId, mealData, 1)
      }

      console.log('🔍 [SERVICE] insertConsumedMeal returned row:', result ? {
        id: result.id,
        meal_name: result.meal_name,
        log_count: result.log_count,
        calories: result.calories,
        amount: result.amount,
        per_unit: result.per_unit,
        consumed_at: result.consumed_at
      } : 'null')

      if (mealData.source === 'openfoodfacts' || mealData.source === 'fatsecret') {
        await this.saveExternalIngredient(mealData)
      }

      if (mealData.sourceId && mealData.type === 'ingredient') {
        await this.bumpIngredientLogCount(mealData.sourceId, clientId)
      }

      if (mealData.sourceId && mealData.type === 'meal') {
        await this.bumpIngredientUsage(mealData.sourceId, clientId)
      }

      console.log('✅ [SmartLogging] Complete:', result?.id)
      return result
    } catch (error) {
      console.error('❌ [SmartLogging] Failed:', error)
      throw error
    }
  }

  // ═══════════════════════════════════════════
  // INSERT consumed_meals row — NU MET amount + per_unit
  // ═══════════════════════════════════════════

  async insertConsumedMeal(clientId, mealData, logCount = 1) {
    // Bepaal amount en per_unit
    // - per100g items (ingrediënten) → per_unit = 'gram', amount = totale gram
    // - meal/portion items → per_unit = 'portion', amount = aantal porties
    let amount = null
    let per_unit = null

    if (mealData.amount !== undefined && mealData.amount !== null) {
      amount = parseFloat(mealData.amount) || null
    }

    if (mealData.per_unit) {
      per_unit = mealData.per_unit
    } else if (mealData.per100g === true) {
      per_unit = 'gram'
    } else if (mealData.per100g === false) {
      per_unit = 'portion'
    }

    const payload = {
      client_id: clientId,
      meal_name: mealData.name,
      meal_id: mealData.sourceId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mealData.sourceId) ? mealData.sourceId : null,
      meal_type: mealData.meal_type || mealData.type || 'custom',
      ingredients: mealData.ingredients || [],
      calories: Math.round(mealData.calories || 0),
      protein: Math.round(mealData.protein || 0),
      carbs: Math.round(mealData.carbs || 0),
      fat: Math.round(mealData.fat || 0),
      amount: amount,
      per_unit: per_unit,
      consumed_at: new Date().toISOString(),
      source: mealData.source || 'manual_log',
      notes: mealData.notes || null,
      image_url: mealData.image_url || null,
      is_shared: true,
      is_favorite: false,
      log_count: logCount,
      created_at: new Date().toISOString()
    }

    console.log('🔍 [SERVICE] insertConsumedMeal payload (going to DB):', {
      meal_name: payload.meal_name,
      meal_type: payload.meal_type,
      log_count: payload.log_count,
      source: payload.source,
      amount: payload.amount,
      per_unit: payload.per_unit,
      macros: {
        calories: payload.calories,
        protein: payload.protein,
        carbs: payload.carbs,
        fat: payload.fat
      }
    })

    const { data, error } = await this.supabase
      .from('consumed_meals')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('🔍 [SERVICE] insertConsumedMeal DB error:', error)
      throw error
    }
    return data
  }

  // ═══════════════════════════════════════════
  // FIND existing log (for frequency tracking)
  // ═══════════════════════════════════════════

  async findExistingLog(clientId, mealName) {
    if (!mealName) return null
    try {
      const { data } = await this.supabase
        .from('consumed_meals')
        .select('id, log_count, meal_name')
        .eq('client_id', clientId)
        .ilike('meal_name', mealName)
        .order('consumed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    } catch {
      return null
    }
  }

  // ═══════════════════════════════════════════
  // SAVE external product to ai_ingredients
  // ═══════════════════════════════════════════

  async saveExternalIngredient(mealData) {
    try {
      if (mealData.barcode) {
        const { data: existing } = await this.supabase
          .from('ai_ingredients')
          .select('id')
          .eq('barcode', mealData.barcode)
          .limit(1)
          .maybeSingle()

        if (existing) {
          await this.bumpIngredientLogCount(existing.id, null)
          console.log('✅ [SmartLogging] External product already in DB, bumped count')
          return existing
        }
      }

      const { data: byName } = await this.supabase
        .from('ai_ingredients')
        .select('id')
        .ilike('name', mealData.name)
        .limit(1)
        .maybeSingle()

      if (byName) {
        await this.bumpIngredientLogCount(byName.id, null)
        return byName
      }

      const { data: saved, error } = await this.supabase
        .from('ai_ingredients')
        .insert({
          name: mealData.name,
          name_en: mealData.name_en || mealData.name,
          category: this.guessCategory(mealData),
          calories_per_100g: mealData.per100g ? mealData.calories : Math.round((mealData.calories / (mealData.amount || 100)) * 100),
          protein_per_100g: mealData.per100g ? mealData.protein : Math.round((mealData.protein / (mealData.amount || 100)) * 100),
          carbs_per_100g: mealData.per100g ? mealData.carbs : Math.round((mealData.carbs / (mealData.amount || 100)) * 100),
          fat_per_100g: mealData.per100g ? mealData.fat : Math.round((mealData.fat / (mealData.amount || 100)) * 100),
          sugar_per_100g: mealData.sugar_per_100g || 0,
          saturated_fat_per_100g: mealData.saturated_fat_per_100g || 0,
          sodium_per_100g: mealData.sodium_per_100g || 0,
          brand: mealData.brand || null,
          serving_description: mealData.serving_description || null,
          store_name: mealData.store_name || null,
          barcode: mealData.barcode || null,
          image_url: mealData.image_url || null,
          default_portion_gram: mealData.defaultPortion || 100,
          min_portion_gram: 10,
          max_portion_gram: 500,
          unit_type: 'gram',
          scalable: true,
          source: mealData.source || 'external',
          log_count: 1,
          last_logged_at: new Date().toISOString(),
          logged_by_clients: '[]'
        })
        .select()
        .single()

      if (error) {
        console.warn('⚠️ [SmartLogging] Could not save ingredient (continuing):', error.message)
        return null
      }

      console.log('✅ [SmartLogging] New ingredient saved to DB:', saved.name)
      return saved
    } catch (err) {
      console.warn('⚠️ [SmartLogging] saveExternalIngredient failed:', err)
      return null
    }
  }

  // ═══════════════════════════════════════════
  // BUMP log_count on ai_ingredients
  // ═══════════════════════════════════════════

  async bumpIngredientLogCount(ingredientId, clientId) {
    try {
      const { data: current } = await this.supabase
        .from('ai_ingredients')
        .select('log_count, logged_by_clients')
        .eq('id', ingredientId)
        .single()

      if (!current) return

      let clients = current.logged_by_clients || []
      if (clientId && !clients.includes(clientId)) {
        clients = [...clients, clientId]
      }

      await this.supabase
        .from('ai_ingredients')
        .update({
          log_count: (current.log_count || 0) + 1,
          last_logged_at: new Date().toISOString(),
          logged_by_clients: clients
        })
        .eq('id', ingredientId)

      console.log('✅ [SmartLogging] Bumped log_count for ingredient:', ingredientId)
    } catch (err) {
      console.warn('⚠️ [SmartLogging] bumpIngredientLogCount failed:', err)
    }
  }

  async bumpIngredientUsage(mealId, clientId) {
    console.log('📊 [SmartLogging] Meal usage tracked via consumed_meals:', mealId)
  }

  // ═══════════════════════════════════════════
  // GET recent meals (frequency ranked)
  // ═══════════════════════════════════════════

  async getRecentMeals(clientId, limit = 30) {
    try {
      const { data, error } = await this.supabase
        .from('consumed_meals')
        .select('*')
        .eq('client_id', clientId)
        .order('consumed_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const freqMap = new Map()
      ;(data || []).forEach(meal => {
        const key = (meal.meal_name || '').toLowerCase().trim()
        if (!key) return
        if (freqMap.has(key)) {
          const existing = freqMap.get(key)
          existing.count++
          if (new Date(meal.consumed_at) > new Date(existing.consumed_at)) {
            Object.assign(existing, meal, { count: existing.count })
          }
        } else {
          freqMap.set(key, { ...meal, count: 1 })
        }
      })

      return Array.from(freqMap.values())
        .sort((a, b) => b.count !== a.count ? b.count - a.count : new Date(b.consumed_at) - new Date(a.consumed_at))
        .slice(0, limit)
    } catch (err) {
      console.error('❌ [SmartLogging] getRecentMeals failed:', err)
      return []
    }
  }

  // ═══════════════════════════════════════════
  // GET shared meals (from all clients)
  // ═══════════════════════════════════════════

  async getSharedMeals(searchTerm, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('consumed_meals')
        .select('meal_name, calories, protein, carbs, fat, image_url, meal_type, source')
        .eq('is_shared', true)
        .ilike('meal_name', `%${searchTerm}%`)
        .order('log_count', { ascending: false })
        .limit(limit)

      if (error) throw error

      const seen = new Set()
      return (data || []).filter(m => {
        const key = m.meal_name?.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    } catch (err) {
      console.warn('⚠️ [SmartLogging] getSharedMeals failed:', err)
      return []
    }
  }

  // ═══════════════════════════════════════════
  // GET popular ingredients (sorted by log_count)
  // ═══════════════════════════════════════════

  async getPopularIngredients(limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('ai_ingredients')
        .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, default_portion_gram, image_url, category, brand, log_count')
        .gt('log_count', 0)
        .order('log_count', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (err) {
      console.warn('⚠️ [SmartLogging] getPopularIngredients failed:', err)
      return []
    }
  }

  // ═══════════════════════════════════════════
  // TOGGLE favorite
  // ═══════════════════════════════════════════

  async toggleFavorite(mealId) {
    try {
      const { data: current } = await this.supabase
        .from('consumed_meals')
        .select('is_favorite')
        .eq('id', mealId)
        .single()

      if (!current) return false

      const { error } = await this.supabase
        .from('consumed_meals')
        .update({ is_favorite: !current.is_favorite })
        .eq('id', mealId)

      if (error) throw error
      return !current.is_favorite
    } catch (err) {
      console.error('❌ [SmartLogging] toggleFavorite failed:', err)
      return false
    }
  }

  // ═══════════════════════════════════════════
  // DELETE consumed meal
  // ═══════════════════════════════════════════

  async deleteConsumedMeal(mealId) {
    try {
      const { error } = await this.supabase
        .from('consumed_meals')
        .delete()
        .eq('id', mealId)

      if (error) throw error
      console.log('✅ [SmartLogging] Deleted:', mealId)
      return true
    } catch (err) {
      console.error('❌ [SmartLogging] Delete failed:', err)
      return false
    }
  }

  // ═══════════════════════════════════════════
  // GET daily totals from consumed_meals
  // ═══════════════════════════════════════════

  async getDailyConsumedTotals(clientId, date) {
    try {
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date

      const { data, error } = await this.supabase
        .from('consumed_meals')
        .select('calories, protein, carbs, fat')
        .eq('client_id', clientId)
        .gte('consumed_at', `${dateStr}T00:00:00`)
        .lt('consumed_at', `${dateStr}T23:59:59`)

      if (error) throw error

      return (data || []).reduce((t, m) => ({
        calories: t.calories + (m.calories || 0),
        protein: t.protein + (parseFloat(m.protein) || 0),
        carbs: t.carbs + (parseFloat(m.carbs) || 0),
        fat: t.fat + (parseFloat(m.fat) || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    } catch (err) {
      console.error('❌ [SmartLogging] getDailyConsumedTotals failed:', err)
      return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  guessCategory(mealData) {
    const name = (mealData.name || '').toLowerCase()

    const map = [
      { keywords: ['kip', 'chicken', 'vlees', 'meat', 'beef', 'rund', 'varken', 'pork', 'vis', 'fish', 'zalm', 'tonijn', 'ei', 'egg', 'tofu', 'tempeh', 'garnaal', 'shrimp'], cat: 'protein' },
      { keywords: ['rijst', 'rice', 'pasta', 'brood', 'bread', 'haver', 'oat', 'aardappel', 'potato', 'quinoa', 'couscous', 'noodle', 'wrap', 'tortilla'], cat: 'carbs' },
      { keywords: ['olie', 'oil', 'boter', 'butter', 'noten', 'nuts', 'avocado', 'pinda', 'peanut', 'kaas', 'cheese'], cat: 'fats' },
      { keywords: ['melk', 'milk', 'yoghurt', 'yogurt', 'kwark', 'quark', 'room', 'cream'], cat: 'dairy' },
      { keywords: ['appel', 'apple', 'banaan', 'banana', 'aardbei', 'berry', 'fruit', 'sinaasappel', 'orange', 'druif', 'grape'], cat: 'fruits' },
      { keywords: ['broccoli', 'spinazie', 'spinach', 'tomaat', 'tomato', 'wortel', 'carrot', 'ui', 'onion', 'sla', 'lettuce', 'paprika', 'pepper', 'courgette', 'komkommer', 'groente'], cat: 'vegetables' }
    ]

    for (const { keywords, cat } of map) {
      if (keywords.some(k => name.includes(k))) return cat
    }
    return 'other'
  }
}
