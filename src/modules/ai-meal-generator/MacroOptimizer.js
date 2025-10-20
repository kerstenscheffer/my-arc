// src/modules/ai-meal-generator/MacroOptimizer.js
// Intelligent Macro Target Optimization - FORCED MEALS PROTECTED

export class MacroOptimizer {
  constructor(db, aiService) {
    this.db = db
    this.aiService = aiService
    this.optimizationLog = []
  }

  /**
   * Main optimization function - FORCED MEALS NEVER CHANGED
   */
  async optimizePlan(weekPlan, targets, availableMeals = [], options = {}) {
    const {
      tolerance = 0.05, // 5% tolerance
      maxIterations = 10,
      respectForcedMeals = true,
      onProgress = null
    } = options

    this.optimizationLog = []
    let currentPlan = JSON.parse(JSON.stringify(weekPlan)) // Deep clone
    let iteration = 0

    this.log('Starting macro optimization...')
    
    while (iteration < maxIterations) {
      iteration++
      
      if (onProgress) {
        onProgress({
          step: `Optimalisatie iteratie ${iteration}/${maxIterations}`,
          progress: (iteration / maxIterations) * 100,
          iteration
        })
      }

      // Calculate current totals
      const currentTotals = this.calculateWeekTotals(currentPlan)
      const weeklyTargets = this.calculateWeeklyTargets(targets)
      
      // Check if targets are met
      const accuracy = this.calculateAccuracy(currentTotals, weeklyTargets)
      
      this.log(`Iteration ${iteration}: Accuracy - Kcal: ${accuracy.calories}%, Protein: ${accuracy.protein}%`)
      
      // If within tolerance, we're done
      if (this.isWithinTolerance(accuracy, tolerance)) {
        this.log('Targets achieved! Optimization complete.')
        break
      }

      // Calculate what we need to adjust
      const adjustments = this.calculateAdjustments(currentTotals, weeklyTargets)
      
      // Find best optimization moves (NEVER touch forced meals)
      const optimizationMoves = await this.findOptimizationMoves(
        currentPlan, 
        adjustments, 
        availableMeals,
        respectForcedMeals
      )

      if (optimizationMoves.length === 0) {
        this.log('No more optimization moves available')
        break
      }

      // Apply best move
      const bestMove = optimizationMoves[0]
      this.applyOptimizationMove(currentPlan, bestMove)
      
      this.log(`Applied: ${bestMove.type} for ${bestMove.reason}`)
    }

    // Final calculations
    const finalTotals = this.calculateWeekTotals(currentPlan)
    const finalAccuracy = this.calculateAccuracy(finalTotals, this.calculateWeeklyTargets(targets))

    // Update day totals
    this.updateDayTotals(currentPlan)

    return {
      optimizedPlan: currentPlan,
      stats: {
        iterations: iteration,
        finalAccuracy,
        totalAdjustments: this.optimizationLog.length,
        forcedMealsPreserved: this.countForcedMeals(currentPlan)
      },
      log: this.optimizationLog
    }
  }

  /**
   * Calculate weekly targets from daily targets
   */
  calculateWeeklyTargets(dailyTargets) {
    return {
      calories: dailyTargets.calories * 7,
      protein: dailyTargets.protein * 7,
      carbs: dailyTargets.carbs * 7,
      fat: dailyTargets.fat * 7
    }
  }

  /**
   * Calculate current week totals
   */
  calculateWeekTotals(weekPlan) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    
    weekPlan.forEach(day => {
      const dayMeals = [day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])].filter(Boolean)
      
      dayMeals.forEach(meal => {
        totals.calories += (meal.calories || 0) * (meal.scale_factor || 1)
        totals.protein += (meal.protein || 0) * (meal.scale_factor || 1)
        totals.carbs += (meal.carbs || 0) * (meal.scale_factor || 1)
        totals.fat += (meal.fat || 0) * (meal.scale_factor || 1)
      })
    })
    
    return totals
  }

  /**
   * Calculate accuracy percentages
   */
  calculateAccuracy(current, targets) {
    return {
      calories: targets.calories > 0 ? Math.round((current.calories / targets.calories) * 100) : 100,
      protein: targets.protein > 0 ? Math.round((current.protein / targets.protein) * 100) : 100,
      carbs: targets.carbs > 0 ? Math.round((current.carbs / targets.carbs) * 100) : 100,
      fat: targets.fat > 0 ? Math.round((current.fat / targets.fat) * 100) : 100
    }
  }

  /**
   * Check if within tolerance
   */
  isWithinTolerance(accuracy, tolerance) {
    const tolerancePercent = tolerance * 100
    
    return Math.abs(100 - accuracy.calories) <= tolerancePercent &&
           Math.abs(100 - accuracy.protein) <= tolerancePercent
  }

  /**
   * Calculate what adjustments are needed
   */
  calculateAdjustments(current, targets) {
    return {
      calories: targets.calories - current.calories,
      protein: targets.protein - current.protein,
      carbs: targets.carbs - current.carbs,
      fat: targets.fat - current.fat
    }
  }

  /**
   * Find best optimization moves - NEVER TOUCH FORCED MEALS
   */
  async findOptimizationMoves(weekPlan, adjustments, availableMeals, respectForcedMeals) {
    const moves = []

    // Strategy 1: Portion scaling for non-forced meals
    if (Math.abs(adjustments.calories) < 500) { // Small adjustments
      const portionMoves = this.findPortionScalingMoves(weekPlan, adjustments, respectForcedMeals)
      moves.push(...portionMoves)
    }

    // Strategy 2: Meal swapping for non-forced meals
    if (availableMeals.length > 0) {
      const swapMoves = await this.findMealSwapMoves(weekPlan, adjustments, availableMeals, respectForcedMeals)
      moves.push(...swapMoves)
    }

    // Strategy 3: Add snacks if severely under targets
    if (adjustments.calories > 300 || adjustments.protein > 20) {
      const snackMoves = this.findSnackAdditionMoves(weekPlan, adjustments, availableMeals)
      moves.push(...snackMoves)
    }

    // Sort by effectiveness (best improvement first)
    return moves.sort((a, b) => b.improvement - a.improvement)
  }

  /**
   * Find portion scaling moves (0.8x to 1.3x range)
   */
  findPortionScalingMoves(weekPlan, adjustments, respectForcedMeals) {
    const moves = []

    weekPlan.forEach((day, dayIndex) => {
      const slots = ['breakfast', 'lunch', 'dinner']
      
      slots.forEach(slot => {
        const meal = day[slot]
        if (!meal) return
        
        // SKIP FORCED MEALS
        if (respectForcedMeals && meal.forced) return

        const currentScale = meal.scale_factor || 1
        
        // Try different scaling factors
        const scaleOptions = [0.8, 0.9, 1.1, 1.2, 1.3]
        
        scaleOptions.forEach(newScale => {
          if (Math.abs(newScale - currentScale) < 0.05) return // Skip tiny changes
          
          const scaleDelta = newScale - currentScale
          const calorieChange = (meal.calories || 0) * scaleDelta
          const proteinChange = (meal.protein || 0) * scaleDelta
          
          // Calculate how much this helps our adjustments
          const calorieImprovement = this.calculateImprovement(adjustments.calories, calorieChange)
          const proteinImprovement = this.calculateImprovement(adjustments.protein, proteinChange)
          const totalImprovement = calorieImprovement + proteinImprovement
          
          if (totalImprovement > 0) {
            moves.push({
              type: 'portion_scale',
              dayIndex,
              slot,
              newScale,
              improvement: totalImprovement,
              reason: `Scale ${meal.name} to ${Math.round(newScale * 100)}%`,
              changes: { calories: calorieChange, protein: proteinChange }
            })
          }
        })
      })
    })

    return moves
  }

  /**
   * Find meal swap moves - ONLY for non-forced meals
   */
  async findMealSwapMoves(weekPlan, adjustments, availableMeals, respectForcedMeals) {
    const moves = []

    weekPlan.forEach((day, dayIndex) => {
      const slots = ['breakfast', 'lunch', 'dinner']
      
      slots.forEach(slot => {
        const currentMeal = day[slot]
        if (!currentMeal) return
        
        // SKIP FORCED MEALS - NEVER SWAP
        if (respectForcedMeals && currentMeal.forced) return

        // Find suitable replacement meals
        const suitableMeals = availableMeals.filter(meal => {
          // Must be suitable for this slot
          if (meal.timing && meal.timing.length > 0) {
            return meal.timing.includes(slot)
          }
          return true
        })

        suitableMeals.forEach(newMeal => {
          if (newMeal.id === currentMeal.id) return // Same meal

          const calorieChange = (newMeal.calories || 0) - (currentMeal.calories || 0)
          const proteinChange = (newMeal.protein || 0) - (currentMeal.protein || 0)
          
          const calorieImprovement = this.calculateImprovement(adjustments.calories, calorieChange)
          const proteinImprovement = this.calculateImprovement(adjustments.protein, proteinChange)
          const totalImprovement = calorieImprovement + proteinImprovement
          
          if (totalImprovement > 10) { // Only significant improvements
            moves.push({
              type: 'meal_swap',
              dayIndex,
              slot,
              newMeal: { ...newMeal, scale_factor: 1 },
              improvement: totalImprovement,
              reason: `Swap to ${newMeal.name}`,
              changes: { calories: calorieChange, protein: proteinChange }
            })
          }
        })
      })
    })

    return moves
  }

  /**
   * Find snack addition moves
   */
  findSnackAdditionMoves(weekPlan, adjustments, availableMeals) {
    const moves = []

    // Find high-protein snacks if we need protein
    if (adjustments.protein > 10) {
      const proteinSnacks = availableMeals.filter(meal => 
        (meal.timing?.includes('snack') || !meal.timing) &&
        (meal.protein || 0) > 15 && // High protein
        (meal.calories || 0) < 300   // Not too many calories
      )

      proteinSnacks.slice(0, 3).forEach(snack => { // Max 3 options
        weekPlan.forEach((day, dayIndex) => {
          if (day.snacks?.length < 2) { // Max 2 snacks per day
            const proteinImprovement = this.calculateImprovement(adjustments.protein, snack.protein || 0)
            const calorieImprovement = this.calculateImprovement(adjustments.calories, snack.calories || 0)
            
            moves.push({
              type: 'add_snack',
              dayIndex,
              newSnack: { ...snack, scale_factor: 1 },
              improvement: proteinImprovement + calorieImprovement,
              reason: `Add protein snack: ${snack.name}`,
              changes: { calories: snack.calories || 0, protein: snack.protein || 0 }
            })
          }
        })
      })
    }

    return moves
  }

  /**
   * Calculate how much a change improves our target
   */
  calculateImprovement(needed, change) {
    if (needed === 0) return 0
    
    if (needed > 0 && change > 0) {
      // We need more, change gives more
      return Math.min(needed, change) / Math.abs(needed) * 100
    } else if (needed < 0 && change < 0) {
      // We need less, change gives less
      return Math.min(Math.abs(needed), Math.abs(change)) / Math.abs(needed) * 100
    }
    
    return 0 // Change doesn't help
  }

  /**
   * Apply optimization move to plan
   */
  applyOptimizationMove(weekPlan, move) {
    const day = weekPlan[move.dayIndex]

    switch (move.type) {
      case 'portion_scale':
        if (day[move.slot]) {
          day[move.slot].scale_factor = move.newScale
        }
        break

      case 'meal_swap':
        if (day[move.slot] && !day[move.slot].forced) { // Double check forced
          day[move.slot] = move.newMeal
        }
        break

      case 'add_snack':
        if (!day.snacks) day.snacks = []
        day.snacks.push(move.newSnack)
        break
    }
  }

  /**
   * Update day totals after optimization
   */
  updateDayTotals(weekPlan) {
    weekPlan.forEach(day => {
      const dayMeals = [day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])].filter(Boolean)
      
      day.totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      
      dayMeals.forEach(meal => {
        const scale = meal.scale_factor || 1
        day.totals.kcal += (meal.calories || 0) * scale
        day.totals.protein += (meal.protein || 0) * scale
        day.totals.carbs += (meal.carbs || 0) * scale
        day.totals.fat += (meal.fat || 0) * scale
      })

      // Calculate accuracy vs daily targets  
      day.accuracy = {
        total: Math.round((day.totals.kcal + day.totals.protein * 4) / 
                         (day.totals.kcal + day.totals.protein * 4) * 100) || 100,
        calories: Math.round(day.totals.kcal / (2500/7) * 100) || 100, // Rough estimate
        protein: Math.round(day.totals.protein / (175/7) * 100) || 100
      }
    })
  }

  /**
   * Count forced meals in plan
   */
  countForcedMeals(weekPlan) {
    let count = 0
    weekPlan.forEach(day => {
      const allMeals = [day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])].filter(Boolean)
      count += allMeals.filter(meal => meal.forced).length
    })
    return count
  }

  /**
   * Log optimization step
   */
  log(message) {
    console.log(`[MacroOptimizer] ${message}`)
    this.optimizationLog.push({
      timestamp: new Date().toISOString(),
      message
    })
  }
}

export default MacroOptimizer
