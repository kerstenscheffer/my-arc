/**
 * MY ARC - MEAL LOGGING SERVICE
 * Service layer voor consumed_meals table operations
 * Versie: 1.0
 */

export default class MealLoggingService {
  constructor(supabase) {
    this.supabase = supabase
    console.log('✅ [MealLoggingService] Initialized')
  }

  /**
   * Log a consumed meal
   * @param {string} clientId - Client UUID
   * @param {object} mealData - Meal data (name, macros, ingredients, etc)
   * @param {Date} consumedAt - When meal was consumed
   * @returns {Promise<object>} Created meal log
   */
  async logConsumedMeal(clientId, mealData, consumedAt = new Date()) {
    try {
      console.log('🎯 [MealLoggingService] Logging meal:', {
        clientId,
        mealName: mealData.meal_name || mealData.name,
        consumedAt
      })

      // Persist portion info so re-opens show the right grams/macros split.
      // Recent re-logs and edits depend on these to scale macros correctly.
      const hasAmount = mealData.amount !== undefined && mealData.amount !== null && mealData.amount !== ''
      const amountVal = hasAmount ? parseFloat(mealData.amount) : null
      const perUnitVal = mealData.per_unit
        || (typeof mealData.per100g === 'boolean'
              ? (mealData.per100g ? 'gram' : 'portion')
              : null)

      const mealLog = {
        client_id: clientId,
        coach_id: mealData.coach_id || null,
        meal_name: mealData.meal_name || mealData.name,
        meal_id: mealData.meal_id || mealData.id || null,
        meal_type: mealData.meal_type || 'custom',

        // Ingredients (JSONB)
        ingredients: mealData.ingredients || mealData.ingredients_list || [],

        // Macros (totals for the persisted amount)
        calories: parseFloat(mealData.calories) || 0,
        protein: parseFloat(mealData.protein) || 0,
        carbs: parseFloat(mealData.carbs) || 0,
        fat: parseFloat(mealData.fat) || 0,

        // Portion (for correct re-open + edit)
        amount: Number.isFinite(amountVal) ? amountVal : null,
        per_unit: perUnitVal,

        // Metadata
        consumed_at: consumedAt.toISOString(),
        source: mealData.source || 'manual_log',
        notes: mealData.notes || null,
        image_url: mealData.image_url || null,

        // Timestamp
        created_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('consumed_meals')
        .insert(mealLog)
        .select()
        .single()

      if (error) throw error

      console.log('✅ [MealLoggingService] Meal logged successfully:', data.id)

      // Fire-and-forget: track per-ingredient portions for the smart picker.
      // Failures here must not break the meal log.
      this._trackPortionsFromIngredients(clientId, mealLog.ingredients)
        .catch(err => console.warn('⚠️ [MealLoggingService] portion tracking failed:', err))

      return data
    } catch (error) {
      console.error('❌ [MealLoggingService] Error logging meal:', error)
      throw error
    }
  }

  async _trackPortionsFromIngredients(clientId, ingredients) {
    if (!clientId || !Array.isArray(ingredients)) return
    for (const ing of ingredients) {
      if (!ing || !ing.name) continue
      const unit = (ing.unit || 'g').toLowerCase()
      if (unit !== 'g' && unit !== 'gram') continue
      const grams = Math.round(parseFloat(ing.amount))
      if (!Number.isFinite(grams) || grams <= 0) continue
      await this._upsertPortion(clientId, ing.name, grams)
    }
  }

  async _upsertPortion(clientId, ingredientName, portionGrams) {
    const key = ingredientName.trim().toLowerCase()
    if (!key) return
    try {
      const { data: existing } = await this.supabase
        .from('client_ingredient_portions')
        .select('id, use_count')
        .eq('client_id', clientId)
        .eq('ingredient_key', key)
        .eq('portion_grams', portionGrams)
        .maybeSingle()

      if (existing) {
        await this.supabase
          .from('client_ingredient_portions')
          .update({
            use_count: existing.use_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        await this.supabase
          .from('client_ingredient_portions')
          .insert({
            client_id: clientId,
            ingredient_key: key,
            ingredient_name: ingredientName.trim(),
            portion_grams: portionGrams,
            use_count: 1,
            last_used_at: new Date().toISOString()
          })
      }
    } catch (err) {
      console.warn('⚠️ [MealLoggingService] _upsertPortion failed:', ingredientName, err)
    }
  }

  async getPortionHistory(clientId, ingredientName, limit = 4) {
    if (!clientId || !ingredientName) return []
    try {
      const key = ingredientName.trim().toLowerCase()
      const { data, error } = await this.supabase
        .from('client_ingredient_portions')
        .select('portion_grams, use_count, last_used_at')
        .eq('client_id', clientId)
        .eq('ingredient_key', key)
        .order('use_count', { ascending: false })
        .order('last_used_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data || []).map(r => Number(r.portion_grams))
    } catch (err) {
      console.warn('⚠️ [MealLoggingService] getPortionHistory failed:', err)
      return []
    }
  }

  async forgetPortion(clientId, ingredientName, portionGrams) {
    if (!clientId || !ingredientName || !portionGrams) return false
    try {
      const key = ingredientName.trim().toLowerCase()
      const { error } = await this.supabase
        .from('client_ingredient_portions')
        .delete()
        .eq('client_id', clientId)
        .eq('ingredient_key', key)
        .eq('portion_grams', Math.round(portionGrams))
      if (error) throw error
      return true
    } catch (err) {
      console.warn('⚠️ [MealLoggingService] forgetPortion failed:', err)
      return false
    }
  }

  /**
   * Get meal logs for a specific date
   * @param {string} clientId - Client UUID
   * @param {Date} date - Date to query
   * @returns {Promise<Array>} Array of meal logs
   */
  async getMealLogsByDate(clientId, date) {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      console.log('🔍 [MealLoggingService] Getting meals for date:', {
        clientId,
        date: date.toISOString().split('T')[0]
      })

      const { data, error } = await this.supabase
        .from('consumed_meals')
        .select('*')
        .eq('client_id', clientId)
        .gte('consumed_at', startOfDay.toISOString())
        .lte('consumed_at', endOfDay.toISOString())
        .order('consumed_at', { ascending: true })

      if (error) throw error

      console.log(`✅ [MealLoggingService] Found ${data?.length || 0} meals`)
      return data || []
    } catch (error) {
      console.error('❌ [MealLoggingService] Error getting meals by date:', error)
      return []
    }
  }

  /**
   * Get meal logs for a date range
   * @param {string} clientId - Client UUID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of meal logs
   */
  async getMealLogsByDateRange(clientId, startDate, endDate) {
    try {
      console.log('🔍 [MealLoggingService] Getting meals for date range:', {
        clientId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      })

      const { data, error } = await this.supabase
        .from('consumed_meals')
        .select('*')
        .eq('client_id', clientId)
        .gte('consumed_at', startDate.toISOString())
        .lte('consumed_at', endDate.toISOString())
        .order('consumed_at', { ascending: true })

      if (error) throw error

      console.log(`✅ [MealLoggingService] Found ${data?.length || 0} meals`)
      return data || []
    } catch (error) {
      console.error('❌ [MealLoggingService] Error getting meals by date range:', error)
      return []
    }
  }

  /**
   * Calculate daily nutrition totals
   * @param {string} clientId - Client UUID
   * @param {Date} date - Date to calculate
   * @returns {Promise<object>} Totals object
   */
  async getDailyTotals(clientId, date) {
    try {
      const meals = await this.getMealLogsByDate(clientId, date)
      
      const totals = meals.reduce((acc, meal) => ({
        calories: acc.calories + (parseFloat(meal.calories) || 0),
        protein: acc.protein + (parseFloat(meal.protein) || 0),
        carbs: acc.carbs + (parseFloat(meal.carbs) || 0),
        fat: acc.fat + (parseFloat(meal.fat) || 0),
        mealCount: acc.mealCount + 1
      }), {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        mealCount: 0
      })

      console.log('✅ [MealLoggingService] Daily totals:', totals)
      return totals
    } catch (error) {
      console.error('❌ [MealLoggingService] Error calculating daily totals:', error)
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        mealCount: 0
      }
    }
  }

  /**
   * Get weekly nutrition totals
   * @param {string} clientId - Client UUID
   * @param {Date} startDate - Week start date (Monday)
   * @returns {Promise<object>} Weekly totals
   */
  async getWeeklyTotals(clientId, startDate) {
    try {
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6) // 7 days

      const meals = await this.getMealLogsByDateRange(clientId, startDate, endDate)
      
      const weeklyTotals = {
        total: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealCount: 0
        },
        daily: []
      }

      // Group by day
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(currentDate.getDate() + i)
        
        const dayMeals = meals.filter(meal => {
          const mealDate = new Date(meal.consumed_at)
          return mealDate.toDateString() === currentDate.toDateString()
        })

        const dayTotals = dayMeals.reduce((acc, meal) => ({
          calories: acc.calories + (parseFloat(meal.calories) || 0),
          protein: acc.protein + (parseFloat(meal.protein) || 0),
          carbs: acc.carbs + (parseFloat(meal.carbs) || 0),
          fat: acc.fat + (parseFloat(meal.fat) || 0),
          mealCount: acc.mealCount + 1
        }), {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealCount: 0
        })

        weeklyTotals.daily.push({
          date: currentDate.toISOString().split('T')[0],
          ...dayTotals
        })

        // Add to weekly total
        weeklyTotals.total.calories += dayTotals.calories
        weeklyTotals.total.protein += dayTotals.protein
        weeklyTotals.total.carbs += dayTotals.carbs
        weeklyTotals.total.fat += dayTotals.fat
        weeklyTotals.total.mealCount += dayTotals.mealCount
      }

      console.log('✅ [MealLoggingService] Weekly totals calculated')
      return weeklyTotals
    } catch (error) {
      console.error('❌ [MealLoggingService] Error calculating weekly totals:', error)
      return null
    }
  }

  /**
   * Update a consumed meal
   * @param {string} mealId - Consumed meal UUID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated meal
   */
  async updateConsumedMeal(mealId, updates) {
    try {
      console.log('🎯 [MealLoggingService] Updating meal:', mealId)

      const { data, error } = await this.supabase
        .from('consumed_meals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', mealId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ [MealLoggingService] Meal updated successfully')
      return data
    } catch (error) {
      console.error('❌ [MealLoggingService] Error updating meal:', error)
      throw error
    }
  }

  /**
   * Delete a consumed meal
   * @param {string} mealId - Consumed meal UUID
   * @returns {Promise<boolean>} Success status
   */
  async deleteConsumedMeal(mealId) {
    try {
      console.log('🎯 [MealLoggingService] Deleting meal:', mealId)

      const { error } = await this.supabase
        .from('consumed_meals')
        .delete()
        .eq('id', mealId)

      if (error) throw error

      console.log('✅ [MealLoggingService] Meal deleted successfully')
      return true
    } catch (error) {
      console.error('❌ [MealLoggingService] Error deleting meal:', error)
      return false
    }
  }

  /**
   * Get recent unique ingredients from consumed meals history
   * @param {string} clientId - Client UUID
   * @param {number} limit - Max number of ingredients
   * @returns {Promise<Array>} Array of unique ingredients
   */
  async getRecentIngredients(clientId, limit = 20) {
    try {
      console.log('🔍 [MealLoggingService] Getting recent ingredients')

      // Get last 50 consumed meals
      const { data, error } = await this.supabase
        .from('consumed_meals')
        .select('ingredients, consumed_at')
        .eq('client_id', clientId)
        .not('ingredients', 'is', null)
        .order('consumed_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Extract unique ingredients
      const ingredientMap = new Map()
      
      data.forEach(meal => {
        if (meal.ingredients && Array.isArray(meal.ingredients)) {
          meal.ingredients.forEach(ing => {
            if (ing && ing.name && !ingredientMap.has(ing.name)) {
              ingredientMap.set(ing.name, {
                ...ing,
                lastUsed: meal.consumed_at
              })
            }
          })
        }
      })

      const recentIngredients = Array.from(ingredientMap.values())
        .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
        .slice(0, limit)

      console.log(`✅ [MealLoggingService] Found ${recentIngredients.length} recent ingredients`)
      return recentIngredients
    } catch (error) {
      console.error('❌ [MealLoggingService] Error getting recent ingredients:', error)
      return []
    }
  }
}
