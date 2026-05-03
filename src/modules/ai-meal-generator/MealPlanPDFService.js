// src/modules/ai-meal-generator/MealPlanPDFService.js
// v4.0 — Fix: snack1/snack2/snack3 keys, correct is_training_day, brutalist style

import DatabaseService from '../../services/DatabaseService'

const SLOT_KEYS = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3']

class MealPlanPDFService {
  constructor(db) {
    this.db = db || DatabaseService
  }

  async enrichMealPlanData(mealPlan) {
    if (!mealPlan || !mealPlan.week_structure) throw new Error('Invalid meal plan data')

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    // Verzamel alle unieke meal IDs uit ALLE slots (snack1/snack2/snack3 inclusief)
    const mealIds = new Set()
    days.forEach(day => {
      const dayData = mealPlan.week_structure[day]
      if (!dayData) return
      SLOT_KEYS.forEach(slot => {
        const meal = dayData[slot]
        if (meal?.meal_id) mealIds.add(meal.meal_id)
        if (meal?.id) mealIds.add(meal.id)
      })
    })

    console.log(`📊 Found ${mealIds.size} unique meals to enrich`)
    const meals = await this.getMealDetails(Array.from(mealIds))

    const enrichedWeekStructure = {}

    for (const day of days) {
      const dayData = mealPlan.week_structure[day]
      if (!dayData) continue

      enrichedWeekStructure[day] = {
        // ✅ is_training_day correct preserveren — GEEN fallback op index
        is_training_day: dayData.is_training_day === true,
        totals: dayData.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      }

      // Enrich alle slots individueel
      for (const slot of SLOT_KEYS) {
        const slotData = dayData[slot]
        if (!slotData) {
          enrichedWeekStructure[day][slot] = null
          continue
        }
        enrichedWeekStructure[day][slot] = await this.enrichMealSlot(slotData, meals)
      }

      console.log(`✅ ${day}: training=${enrichedWeekStructure[day].is_training_day}, slots=${SLOT_KEYS.filter(s => enrichedWeekStructure[day][s]).join(',')}`)
    }

    return {
      ...mealPlan,
      week_structure_enriched: enrichedWeekStructure,
      generated_at: new Date().toISOString()
    }
  }

  async getMealDetails(mealIds) {
    if (!mealIds || mealIds.length === 0) return {}
    try {
      const validIds = mealIds.filter(id => /^[0-9a-f-]{36}$/i.test(id))
      if (validIds.length === 0) return {}

      const { data: meals, error } = await this.db.supabase
        .from('ai_meals')
        .select('*')
        .in('id', validIds)

      if (error) { console.error('Error fetching meals:', error); return {} }

      const mealMap = {}
      for (const meal of meals || []) {
        // Haal ingredient details op
        const ingredientIds = []
        const ingList = typeof meal.ingredients_list === 'string'
          ? JSON.parse(meal.ingredients_list || '[]')
          : (meal.ingredients_list || [])
        ingList.forEach(item => { if (item.ingredient_id) ingredientIds.push(item.ingredient_id) })

        let ingredients = []
        if (ingredientIds.length > 0) {
          const validIngIds = ingredientIds.filter(id => /^[0-9a-f-]{36}$/i.test(id))
          if (validIngIds.length > 0) {
            const { data: ingData } = await this.db.supabase
              .from('ai_ingredients')
              .select('*')
              .in('id', validIngIds)
            ingredients = ingData || []
          }
        }
        mealMap[meal.id] = { ...meal, ingredients_detailed: ingredients }
      }
      return mealMap
    } catch (error) {
      console.error('Error in getMealDetails:', error)
      return {}
    }
  }

  async enrichMealSlot(slot, meals) {
    const mealId = slot.meal_id || slot.id
    const meal = mealId ? meals[mealId] : null

    if (!meal) {
      // Geen DB data — gebruik wat er al in de slot zit
      return {
        ...slot,
        ingredients: [],
        name: slot.name || slot.meal_name || 'Maaltijd',
      }
    }

    const ingList = typeof meal.ingredients_list === 'string'
      ? JSON.parse(meal.ingredients_list || '[]')
      : (meal.ingredients_list || [])

    const scaleFactor = slot.scale_factor || 1

    const enrichedIngredients = ingList.map(item => {
      const ingredient = meal.ingredients_detailed?.find(i => i.id === item.ingredient_id)
      if (!ingredient) return { name: item.name || 'Onbekend', amount: item.amount || 0, unit: item.unit || 'gram', amount_scaled: (item.amount || 0) * scaleFactor }
      const scaledAmount = (item.amount || 100) * scaleFactor
      const factor = scaledAmount / 100
      return {
        ingredient_id: ingredient.id,
        name: ingredient.name,
        amount: item.amount || 100,
        amount_scaled: scaledAmount,
        unit: item.unit || 'gram',
        calories: Math.round((ingredient.calories_per_100g || 0) * factor),
        protein:  Math.round((ingredient.protein_per_100g  || 0) * factor * 10) / 10,
        carbs:    Math.round((ingredient.carbs_per_100g    || 0) * factor * 10) / 10,
        fat:      Math.round((ingredient.fat_per_100g      || 0) * factor * 10) / 10,
        category: ingredient.category || 'other',
        allergens: ingredient.allergens || []
      }
    })

    return {
      ...slot,          // ✅ slot eerst — preserved timing/function/icon
      meal_details: meal,
      ingredients: enrichedIngredients,
      name: slot.name || slot.meal_name || meal.name,
      image_url: slot.image_url || meal.image_url,
      prep_time: meal.prep_time_min || 0,
      cook_time: meal.cook_time_min || 0,
      total_cost: (meal.total_cost || 0) * scaleFactor,
      tips: meal.tips,
      preparation_steps: meal.preparation_steps || [],
      allergens: meal.allergens || []
    }
  }

  generateShoppingSummary(enrichedPlan) {
    const ingredientTotals = new Map()
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    days.forEach(day => {
      const dayData = enrichedPlan.week_structure_enriched?.[day]
      if (!dayData) return
      SLOT_KEYS.forEach(slot => {
        const meal = dayData[slot]
        if (!meal?.ingredients?.length) return
        meal.ingredients.forEach(ing => {
          const key = ing.ingredient_id || ing.name
          if (!key) return
          if (!ingredientTotals.has(key)) {
            ingredientTotals.set(key, { name: ing.name || 'Onbekend', category: ing.category || 'other', totalAmount: 0, unit: ing.unit || 'gram' })
          }
          ingredientTotals.get(key).totalAmount += ing.amount_scaled || ing.amount || 0
        })
      })
    })
    return Array.from(ingredientTotals.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  calculateWeeklyStats(enrichedPlan) {
    const stats = { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, uniqueIngredients: new Set() }
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    let dayCount = 0
    days.forEach(day => {
      const dayData = enrichedPlan.week_structure_enriched?.[day]
      if (!dayData) return
      dayCount++
      stats.avgCalories += dayData.totals?.kcal || 0
      stats.avgProtein  += dayData.totals?.protein || 0
      stats.avgCarbs    += dayData.totals?.carbs || 0
      stats.avgFat      += dayData.totals?.fat || 0
      SLOT_KEYS.forEach(slot => {
        dayData[slot]?.ingredients?.forEach(ing => { if (ing.name) stats.uniqueIngredients.add(ing.name) })
      })
    })
    if (dayCount > 0) {
      stats.avgCalories = Math.round(stats.avgCalories / dayCount)
      stats.avgProtein  = Math.round(stats.avgProtein  / dayCount)
      stats.avgCarbs    = Math.round(stats.avgCarbs    / dayCount)
      stats.avgFat      = Math.round(stats.avgFat      / dayCount)
    }
    stats.uniqueIngredients = stats.uniqueIngredients.size
    return stats
  }
}

export default MealPlanPDFService
