// src/modules/ai-meal-generator/SmartPortionOptimizer.js

import PortionCalculator from './PortionCalculator'

/**
 * Smart Portion Optimizer - Advanced AI Scaling
 * Bouwt voort op PortionCalculator met extra intelligentie
 */
class SmartPortionOptimizer {
  constructor() {
    this.baseCalculator = PortionCalculator
    
    // Optimization strategies
    this.strategies = {
      PROTEIN_PRIORITY: 'protein_priority',
      BALANCED: 'balanced',
      CALORIE_MATCH: 'calorie_match',
      MEAL_PREP: 'meal_prep'
    }
    
    // Meal recycling patterns
    this.recyclePatterns = {
      none: [],
      light: [1, 3, 5], // Same lunch on Mon, Wed, Fri
      medium: [0, 2, 4], // Same dinner Mon, Wed, Fri
      heavy: [0, 1, 2, 3, 4], // Same lunch all weekdays
      mealprep: { // Full meal prep mode
        lunch: [0, 1, 2, 3, 4],
        dinner: [0, 2, 4]
      }
    }
  }

  /**
   * Optimize week plan with forced meals and recycling
   */
  optimizeWeekPlan(selectedMeals, dailyTargets, options = {}) {
    const {
      mealsPerDay = 4,
      forcedMeals = [],
      recyclePattern = 'light',
      strategy = this.strategies.PROTEIN_PRIORITY,
      allowScaling = true,
      minAccuracy = 85
    } = options
    
    console.log('🚀 Starting Smart Optimization')
    console.log(`📊 Targets: ${dailyTargets.kcal}kcal, ${dailyTargets.protein}g protein`)
    console.log(`♻️ Recycle Pattern: ${recyclePattern}`)
    console.log(`⚡ Forced Meals: ${forcedMeals.length}`)
    
    // Separate meals by type and priority
    const mealPool = this.organizeMealPool(selectedMeals, forcedMeals)
    
    // Generate base week structure
    let weekPlan = []
    
    for (let day = 0; day < 7; day++) {
      let  dayPlan = this.generateSmartDayPlan(
        mealPool,
        dailyTargets,
        mealsPerDay,
        day,
        strategy,
        allowScaling
      )
      
      // Apply recycling pattern
      if (recyclePattern !== 'none' && weekPlan.length > 0) {
        dayPlan = this.applyRecycling(dayPlan, weekPlan, day, recyclePattern)
      }
      
      weekPlan.push(dayPlan)
    }
    
    // Fine-tune entire week for better accuracy
    if (allowScaling) {
      weekPlan = this.fineTuneWeek(weekPlan, dailyTargets, minAccuracy)
    }
    
    // Calculate week stats
    const weekStats = this.calculateWeekStats(weekPlan, dailyTargets)
    
    return {
      weekPlan,
      stats: weekStats,
      options: options,
      mealPool: mealPool
    }
  }

  /**
   * Organize meals into priority pools
   */
  organizeMealPool(selectedMeals, forcedMeals) {
    console.log(`📦 Organizing meal pool: ${selectedMeals.length} meals, ${forcedMeals.length} forced`)
    
    const pool = {
      forced: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
      },
      regular: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
      },
      any: [] // Meals without specific category
    }
    
    // First add forced meals
    forcedMeals.forEach(meal => {
      const category = this.determineMealCategory(meal)
      if (pool.forced[category]) {
        pool.forced[category].push(meal)
      } else {
        pool.forced.snack.push(meal)
      }
    })
    
    // Then add regular meals
    selectedMeals.forEach(meal => {
      // Skip if already in forced
      if (forcedMeals.find(f => f.id === meal.id)) return
      
      const category = this.determineMealCategory(meal)
      if (pool.regular[category]) {
        pool.regular[category].push(meal)
      } else {
        pool.any.push(meal)
      }
    })
    
    return pool
  }

  /**
   * Determine meal category intelligently
   */
  determineMealCategory(meal) {
    // Check explicit category
    if (meal.category) {
      if (['breakfast', 'lunch', 'dinner', 'snack'].includes(meal.category)) {
        return meal.category
      }
    }
    
    // Check meal_type field
    if (meal.meal_type) {
      if (['breakfast', 'lunch', 'dinner', 'snack'].includes(meal.meal_type)) {
        return meal.meal_type
      }
    }
    
    // Smart detection based on name
    const name = meal.name.toLowerCase()
    
    if (name.includes('ontbijt') || name.includes('oatmeal') || name.includes('yoghurt')) {
      return 'breakfast'
    }
    if (name.includes('lunch') || name.includes('salade') || name.includes('sandwich')) {
      return 'lunch'
    }
    if (name.includes('diner') || name.includes('pasta') || name.includes('rijst')) {
      return 'dinner'
    }
    if (name.includes('snack') || name.includes('bar') || meal.kcal < 200) {
      return 'snack'
    }
    
    // Default based on calories
    if (meal.kcal < 300) return 'snack'
    if (meal.kcal < 500) return 'breakfast'
    if (meal.kcal < 700) return 'lunch'
    return 'dinner'
  }

  /**
   * Generate smart day plan with strategy
   */
  generateSmartDayPlan(mealPool, dailyTargets, mealsPerDay, dayIndex, strategy, allowScaling) {
    // Calculate distribution
    const distribution = this.baseCalculator.calculateDailyDistribution(
      dailyTargets.kcal,
      dailyTargets,
      mealsPerDay
    )
    
    const dayPlan = {
      breakfast: null,
      lunch: null,
      dinner: null,
      snacks: []
    }
    
    // Prioritize forced meals
    dayPlan.breakfast = this.selectMeal(
      mealPool,
      'breakfast',
      distribution.breakfast,
      dayIndex,
      strategy,
      allowScaling
    )
    
    dayPlan.lunch = this.selectMeal(
      mealPool,
      'lunch',
      distribution.lunch,
      dayIndex,
      strategy,
      allowScaling
    )
    
    dayPlan.dinner = this.selectMeal(
      mealPool,
      'dinner',
      distribution.dinner,
      dayIndex,
      strategy,
      allowScaling
    )
    
    // Add snacks
    if (mealsPerDay > 3) {
      const snackCount = mealsPerDay - 3
      const snackTargets = {
        kcal: Math.round(distribution.snack.kcal / snackCount),
        protein: Math.round(distribution.snack.protein / snackCount),
        carbs: Math.round(distribution.snack.carbs / snackCount),
        fat: Math.round(distribution.snack.fat / snackCount)
      }
      
      for (let i = 0; i < snackCount; i++) {
        const snack = this.selectMeal(
          mealPool,
          'snack',
          snackTargets,
          dayIndex + i,
          strategy,
          allowScaling
        )
        if (snack) {
          dayPlan.snacks.push(snack)
        }
      }
    }
    
    // Calculate totals and accuracy
    const totals = this.baseCalculator.calculateDayTotals(dayPlan)
    const accuracy = this.baseCalculator.calculateAccuracy(totals, dailyTargets)
    
    return {
      ...dayPlan,
      totals,
      accuracy,
      dayIndex
    }
  }

  /**
   * Select best meal from pool with strategy
   */
  selectMeal(mealPool, mealType, targets, dayIndex, strategy, allowScaling) {
    // First check forced meals
    if (mealPool.forced[mealType] && mealPool.forced[mealType].length > 0) {
      const forcedMeal = mealPool.forced[mealType][dayIndex % mealPool.forced[mealType].length]
      if (allowScaling) {
        return this.scaleMealSmart(forcedMeal, targets, mealType, strategy)
      }
      return forcedMeal
    }
    
    // Then check regular pool
    let availableMeals = [...mealPool.regular[mealType]]
    
    // BELANGRIJKE FIX: Als geen meals voor dit type, gebruik ALLE meals
    if (availableMeals.length === 0) {
      console.warn(`⚠️ No ${mealType} meals found, using all available meals`)
      availableMeals = [
        ...mealPool.regular.breakfast,
        ...mealPool.regular.lunch,
        ...mealPool.regular.dinner,
        ...mealPool.regular.snack,
        ...mealPool.any
      ].filter(m => m) // Filter out undefined
    }
    
    if (availableMeals.length === 0) {
      console.error(`❌ No meals available at all for ${mealType}`)
      return null
    }
    
    // Voor te weinig meals: gebruik ze gewoon rond-robin
    if (availableMeals.length <= 3) {
      const selectedMeal = availableMeals[dayIndex % availableMeals.length]
      if (allowScaling) {
        return this.scaleMealSmart(selectedMeal, targets, mealType, strategy)
      }
      return selectedMeal
    }
    
    // Score meals based on strategy
    const scoredMeals = availableMeals.map(meal => {
      const score = this.scoreMeal(meal, targets, strategy)
      return { meal, score }
    })
    
    // Sort by score (lower is better)
    scoredMeals.sort((a, b) => a.score - b.score)
    
    // Pick with some variety (not always the best)
    const topCount = Math.min(5, scoredMeals.length)
    const selectedIndex = dayIndex % topCount
    const selectedMeal = scoredMeals[selectedIndex].meal
    
    if (allowScaling) {
      return this.scaleMealSmart(selectedMeal, targets, mealType, strategy)
    }
    
    return selectedMeal
  }

  /**
   * Score meal based on strategy
   */
  scoreMeal(meal, targets, strategy) {
    let score = 0
    
    switch(strategy) {
      case this.strategies.PROTEIN_PRIORITY:
        // Heavily weight protein matching
        score = Math.abs(meal.protein - targets.protein) * 5.0 +
                Math.abs(meal.kcal - targets.kcal) * 1.0 +
                Math.abs(meal.carbs - targets.carbs) * 0.5 +
                Math.abs(meal.fat - targets.fat) * 0.5
        break
        
      case this.strategies.BALANCED:
        // Equal weight to all macros
        score = Math.abs(meal.protein - targets.protein) * 2.0 +
                Math.abs(meal.kcal - targets.kcal) * 2.0 +
                Math.abs(meal.carbs - targets.carbs) * 2.0 +
                Math.abs(meal.fat - targets.fat) * 2.0
        break
        
      case this.strategies.CALORIE_MATCH:
        // Focus on calories
        score = Math.abs(meal.kcal - targets.kcal) * 5.0 +
                Math.abs(meal.protein - targets.protein) * 1.0 +
                Math.abs(meal.carbs - targets.carbs) * 0.5 +
                Math.abs(meal.fat - targets.fat) * 0.5
        break
        
      default:
        score = Math.abs(meal.kcal - targets.kcal)
    }
    
    return score
  }

  /**
   * Smart scaling with limits
   */
  scaleMealSmart(meal, targets, mealType, strategy) {
    if (!meal) return null
    
    // Use base calculator for scaling
    const scaledMeal = this.baseCalculator.calculatePortion(meal, targets, mealType)
    
    if (!scaledMeal) return meal
    
    // Apply smart limits based on meal type
    const limits = {
      breakfast: { min: 0.6, max: 1.8 },
      lunch: { min: 0.7, max: 2.0 },
      dinner: { min: 0.8, max: 2.2 },
      snack: { min: 0.5, max: 1.5 }
    }
    
    const limit = limits[mealType] || { min: 0.5, max: 2.5 }
    
    // Constrain scale factor
    if (scaledMeal.scale < limit.min) {
      scaledMeal.scale = limit.min
    } else if (scaledMeal.scale > limit.max) {
      scaledMeal.scale = limit.max
    }
    
    // Add portion info
    scaledMeal.portionGrams = Math.round((meal.base_portion_grams || 100) * scaledMeal.scale)
    scaledMeal.portionDescription = this.getPortionDescription(scaledMeal.scale)
    
    return scaledMeal
  }

  /**
   * Get friendly portion description
   */
  getPortionDescription(scale) {
    if (scale >= 2.0) return 'XXL portie'
    if (scale >= 1.6) return 'XL portie'
    if (scale >= 1.3) return 'Grote portie'
    if (scale >= 1.1) return 'Normale+ portie'
    if (scale >= 0.9) return 'Normale portie'
    if (scale >= 0.7) return 'Kleine portie'
    if (scale >= 0.5) return 'Mini portie'
    return 'Tiny portie'
  }

  /**
   * Apply meal recycling pattern
   */
  applyRecycling(dayPlan, weekPlan, dayIndex, pattern) {
    if (pattern === 'none' || weekPlan.length === 0) return dayPlan
    
    // Check if this day should recycle
    if (pattern === 'mealprep') {
      // Complex meal prep pattern
      if (this.recyclePatterns.mealprep.lunch.includes(dayIndex) && weekPlan[0].lunch) {
        dayPlan.lunch = { ...weekPlan[0].lunch }
      }
      if (this.recyclePatterns.mealprep.dinner.includes(dayIndex) && weekPlan[0].dinner) {
        dayPlan.dinner = { ...weekPlan[0].dinner }
      }
    } else if (this.recyclePatterns[pattern]) {
      // Simple patterns
      if (this.recyclePatterns[pattern].includes(dayIndex)) {
        const sourceDay = this.recyclePatterns[pattern][0]
        if (weekPlan[sourceDay]) {
          if (pattern === 'light' && weekPlan[sourceDay].lunch) {
            dayPlan.lunch = { ...weekPlan[sourceDay].lunch }
          }
          if (pattern === 'medium' && weekPlan[sourceDay].dinner) {
            dayPlan.dinner = { ...weekPlan[sourceDay].dinner }
          }
          if (pattern === 'heavy' && weekPlan[sourceDay].lunch) {
            dayPlan.lunch = { ...weekPlan[sourceDay].lunch }
          }
        }
      }
    }
    
    return dayPlan
  }

  /**
   * Fine-tune entire week for better accuracy
   */
  fineTuneWeek(weekPlan, dailyTargets, minAccuracy) {
    weekPlan.forEach((day, index) => {
      if (day.accuracy.total < minAccuracy) {
        console.log(`📈 Fine-tuning day ${index + 1} (accuracy: ${day.accuracy.total}%)`)
        
        // Find which macro needs most adjustment
        const gaps = {
          protein: dailyTargets.protein - day.totals.protein,
          carbs: dailyTargets.carbs - day.totals.carbs,
          fat: dailyTargets.fat - day.totals.fat
        }
        
        // Adjust portions of existing meals
        if (Math.abs(gaps.protein) > 10) {
          // Find highest protein meal and adjust
          const meals = [day.breakfast, day.lunch, day.dinner].filter(m => m)
          const bestMeal = meals.reduce((best, meal) => 
            meal.protein > best.protein ? meal : best
          )
          
          if (bestMeal) {
            const newScale = bestMeal.scale * (1 + (gaps.protein / bestMeal.protein) * 0.5)
            bestMeal.scale = Math.max(0.5, Math.min(2.5, newScale))
            bestMeal.macros = {
              kcal: Math.round(bestMeal.kcal * bestMeal.scale),
              protein: Math.round(bestMeal.protein * bestMeal.scale),
              carbs: Math.round(bestMeal.carbs * bestMeal.scale),
              fat: Math.round(bestMeal.fat * bestMeal.scale)
            }
          }
        }
        
        // Recalculate totals
        day.totals = this.baseCalculator.calculateDayTotals(day)
        day.accuracy = this.baseCalculator.calculateAccuracy(day.totals, dailyTargets)
      }
    })
    
    return weekPlan
  }

  /**
   * Calculate week statistics
   */
  calculateWeekStats(weekPlan, dailyTargets) {
    let weekTotals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    let accuracySum = 0
    let mealVariety = new Set()
    let recycledMeals = 0
    
    weekPlan.forEach(day => {
      // Add to totals
      weekTotals.kcal += day.totals.kcal
      weekTotals.protein += day.totals.protein
      weekTotals.carbs += day.totals.carbs
      weekTotals.fat += day.totals.fat
      accuracySum += day.accuracy.total
      
      // Track variety
      if (day.breakfast) mealVariety.add(day.breakfast.id)
      if (day.lunch) mealVariety.add(day.lunch.id)
      if (day.dinner) mealVariety.add(day.dinner.id)
    })
    
    // Check for recycled meals
    const lunchIds = weekPlan.map(d => d.lunch?.id).filter(id => id)
    const dinnerIds = weekPlan.map(d => d.dinner?.id).filter(id => id)
    
    const uniqueLunches = new Set(lunchIds).size
    const uniqueDinners = new Set(dinnerIds).size
    
    recycledMeals = (7 - uniqueLunches) + (7 - uniqueDinners)
    
    return {
      weekAverages: {
        kcal: Math.round(weekTotals.kcal / 7),
        protein: Math.round(weekTotals.protein / 7),
        carbs: Math.round(weekTotals.carbs / 7),
        fat: Math.round(weekTotals.fat / 7)
      },
      averageAccuracy: Math.round(accuracySum / 7),
      mealVariety: mealVariety.size,
      recycledMeals: recycledMeals,
      complianceScore: this.calculateComplianceScore(weekPlan, dailyTargets)
    }
  }

  /**
   * Calculate compliance score (how well the plan meets targets)
   */
  calculateComplianceScore(weekPlan, targets) {
    let score = 100
    
    weekPlan.forEach(day => {
      // Deduct points for poor accuracy
      if (day.accuracy.protein < 90) score -= 5
      if (day.accuracy.protein < 80) score -= 10
      if (day.accuracy.kcal < 90) score -= 3
      if (day.accuracy.kcal < 80) score -= 7
    })
    
    return Math.max(0, score)
  }

  /**
   * Generate shopping list from week plan
   */
  generateShoppingList(weekPlan) {
    const shoppingList = new Map()
    
    weekPlan.forEach(day => {
      // Process each meal
      [day.breakfast, day.lunch, day.dinner, ...day.snacks].forEach(meal => {
        if (!meal || !meal.ingredients) return
        
        meal.ingredients.forEach(ing => {
          const key = ing.name || ing.ingredient_name
          if (!key) return
          
          if (shoppingList.has(key)) {
            const existing = shoppingList.get(key)
            existing.amount += ing.amount || 100
            existing.days.add(day.dayIndex)
          } else {
            shoppingList.set(key, {
              name: key,
              amount: ing.amount || 100,
              unit: ing.unit || 'gram',
              category: ing.category || 'other',
              days: new Set([day.dayIndex])
            })
          }
        })
      })
    })
    
    // Convert to array and sort by category
    const list = Array.from(shoppingList.values())
    list.sort((a, b) => a.category.localeCompare(b.category))
    
    return list
  }
}

export default new SmartPortionOptimizer()
