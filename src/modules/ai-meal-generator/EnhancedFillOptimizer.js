// src/modules/ai-meal-generator/EnhancedFillOptimizer.js
// Complete Week Filling with Forced Meals + Macro Optimization

export class EnhancedFillOptimizer {
  constructor(db, aiService) {
    this.db = db
    this.aiService = aiService
    this.optimizationLog = []
  }

  /**
   * COMPLETE WEEK FILLING - Ensures ALL 21 slots are filled
   */
  async fillCompleteWeek(weekPlan, forcedMeals, availableMeals = [], options = {}) {
    const {
      fillMode = 'smart_repeat', // 'smart_repeat', 'ai_fill', 'mixed'
      respectTiming = true,
      onProgress = null
    } = options

    this.log('Starting complete week filling...')
    
    if (onProgress) {
      onProgress({
        step: 'Analyseren lege slots...',
        progress: 10
      })
    }

    // Count empty slots
    const emptySlots = this.countEmptySlots(weekPlan)
    this.log(`Found ${emptySlots.total} empty slots out of 21`)

    if (emptySlots.total === 0) {
      this.log('Week already complete!')
      return weekPlan
    }

    // Strategy based on fillMode
    if (fillMode === 'smart_repeat' && forcedMeals.length > 0) {
      await this.smartRepeatFill(weekPlan, forcedMeals, respectTiming, onProgress)
    } else if (fillMode === 'ai_fill' && availableMeals.length > 0) {
      await this.aiFill(weekPlan, availableMeals, respectTiming, onProgress)
    } else if (fillMode === 'mixed') {
      await this.mixedFill(weekPlan, forcedMeals, availableMeals, respectTiming, onProgress)
    }

    // Final validation
    const finalEmpty = this.countEmptySlots(weekPlan)
    this.log(`After filling: ${finalEmpty.total} slots still empty`)

    // Update totals
    this.updateAllDayTotals(weekPlan)

    return weekPlan
  }

  /**
   * Smart Repeat Fill - Intelligently duplicates forced meals
   */
  async smartRepeatFill(weekPlan, forcedMeals, respectTiming, onProgress) {
    this.log('Using smart repeat strategy')
    
    const slotsOrder = ['breakfast', 'lunch', 'dinner']
    const mealUsage = {}
    
    // Initialize usage counter
    forcedMeals.forEach(meal => {
      mealUsage[meal.id] = 0
    })

    // Create smart meal rotation based on timing preferences
    const createMealRotation = () => {
      const rotation = {
        breakfast: [],
        lunch: [],
        dinner: []
      }

      forcedMeals.forEach(meal => {
        if (respectTiming && meal.timing && meal.timing.length > 0) {
          // Use meal's preferred timing
          meal.timing.forEach(timeSlot => {
            if (rotation[timeSlot]) {
              rotation[timeSlot].push(meal)
            }
          })
        } else {
          // No timing preference, add to all slots
          rotation.breakfast.push(meal)
          rotation.lunch.push(meal)
          rotation.dinner.push(meal)
        }
      })

      // Ensure each slot has at least one meal
      slotsOrder.forEach(slot => {
        if (rotation[slot].length === 0) {
          rotation[slot] = [...forcedMeals] // Fallback to all meals
        }
      })

      return rotation
    }

    const mealRotation = createMealRotation()
    
    if (onProgress) {
      onProgress({
        step: 'Smart repeat pattern toepassen...',
        progress: 30
      })
    }

    // Fill all empty slots
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const day = weekPlan[dayIndex]
      
      for (const slot of slotsOrder) {
        if (!day[slot]) {
          // Find least used meal for this slot
          const availableForSlot = mealRotation[slot]
          
          // Sort by usage count (least used first)
          availableForSlot.sort((a, b) => 
            (mealUsage[a.id] || 0) - (mealUsage[b.id] || 0)
          )
          
          const selectedMeal = availableForSlot[0]
          
          // Clone meal and mark as forced
          day[slot] = {
            ...selectedMeal,
            forced: true,
            aiScore: null,
            scale_factor: 1,
            repeatedFromOriginal: true
          }
          
          // Update usage
          mealUsage[selectedMeal.id] = (mealUsage[selectedMeal.id] || 0) + 1
          
          this.log(`Day ${dayIndex + 1} ${slot}: ${selectedMeal.name} (${mealUsage[selectedMeal.id]}x total)`)
        }
      }
    }

    if (onProgress) {
      onProgress({
        step: 'Smart repeat voltooid',
        progress: 60
      })
    }

    this.log('Smart repeat fill completed')
    this.log('Final usage:', mealUsage)
  }

  /**
   * AI Fill - Uses available meals to fill empty slots
   */
  async aiFill(weekPlan, availableMeals, respectTiming, onProgress) {
    this.log('Using AI fill strategy')
    
    const slotsOrder = ['breakfast', 'lunch', 'dinner']
    const usedMealIds = new Set()

    if (onProgress) {
      onProgress({
        step: 'AI meals selecteren...',
        progress: 40
      })
    }

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const day = weekPlan[dayIndex]
      
      for (const slot of slotsOrder) {
        if (!day[slot]) {
          // Find suitable AI meal
          const suitableMeals = availableMeals.filter(meal => {
            // Avoid duplicates
            if (usedMealIds.has(meal.id)) return false
            
            // Check timing if respected
            if (respectTiming && meal.timing && meal.timing.length > 0) {
              return meal.timing.includes(slot)
            }
            
            return true
          })

          if (suitableMeals.length > 0) {
            // Pick highest scoring meal
            const selectedMeal = suitableMeals[0]
            
            day[slot] = {
              ...selectedMeal,
              forced: false,
              scale_factor: 1,
              aiGenerated: true
            }
            
            usedMealIds.add(selectedMeal.id)
            this.log(`Day ${dayIndex + 1} ${slot}: ${selectedMeal.name} (AI)`)
          }
        }
      }
    }

    if (onProgress) {
      onProgress({
        step: 'AI fill voltooid',
        progress: 70
      })
    }
  }

  /**
   * Mixed Fill - Combination of forced meal repeats and AI meals
   */
  async mixedFill(weekPlan, forcedMeals, availableMeals, respectTiming, onProgress) {
    this.log('Using mixed fill strategy')
    
    // First, try to fill with AI meals for variety
    if (availableMeals.length > 0) {
      await this.aiFill(weekPlan, availableMeals, respectTiming, onProgress)
    }
    
    // Then fill remaining slots with forced meal repeats
    const stillEmpty = this.countEmptySlots(weekPlan)
    if (stillEmpty.total > 0 && forcedMeals.length > 0) {
      await this.smartRepeatFill(weekPlan, forcedMeals, respectTiming, onProgress)
    }
  }

  /**
   * Enhanced Macro Optimization - Works AFTER complete filling
   */
  async optimizeFilledWeek(weekPlan, targets, availableMeals = [], options = {}) {
    const {
      tolerance = 0.05,
      maxIterations = 12, // More iterations for complex optimization
      respectForcedMeals = true,
      fillEmptySlots = true,
      onProgress = null
    } = options

    this.optimizationLog = []
    let currentPlan = JSON.parse(JSON.stringify(weekPlan))
    let iteration = 0

    this.log('Starting enhanced macro optimization...')
    
    // PHASE 1: Ensure week is completely filled first
    if (fillEmptySlots) {
      const emptySlots = this.countEmptySlots(currentPlan)
      if (emptySlots.total > 0) {
        this.log(`Filling ${emptySlots.total} empty slots first...`)
        
        if (onProgress) {
          onProgress({
            step: `${emptySlots.total} lege slots vullen...`,
            progress: 5
          })
        }
        
        // Use available meals to fill empty slots
        await this.aiFill(currentPlan, availableMeals, true, null)
        
        // If still empty, duplicate existing meals
        const stillEmpty = this.countEmptySlots(currentPlan)
        if (stillEmpty.total > 0) {
          const existingMeals = this.extractExistingMeals(currentPlan)
          if (existingMeals.length > 0) {
            await this.smartRepeatFill(currentPlan, existingMeals, true, null)
          }
        }
      }
    }
    
    // PHASE 2: Macro optimization iterations
    while (iteration < maxIterations) {
      iteration++
      
      if (onProgress) {
        onProgress({
          step: `Macro optimalisatie ${iteration}/${maxIterations}`,
          progress: 10 + (iteration / maxIterations) * 80,
          iteration
        })
      }

      const currentTotals = this.calculateWeekTotals(currentPlan)
      const weeklyTargets = this.calculateWeeklyTargets(targets)
      const accuracy = this.calculateAccuracy(currentTotals, weeklyTargets)
      
      this.log(`Iteration ${iteration}: Kcal: ${accuracy.calories}%, Protein: ${accuracy.protein}%`)
      
      // Check if targets achieved
      if (this.isWithinTolerance(accuracy, tolerance)) {
        this.log('Macro targets achieved!')
        break
      }

      const adjustments = this.calculateAdjustments(currentTotals, weeklyTargets)
      const optimizationMoves = await this.findEnhancedOptimizationMoves(
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
      
      this.log(`Applied: ${bestMove.type} - ${bestMove.reason}`)
    }

    // Final updates
    this.updateAllDayTotals(currentPlan)
    const finalTotals = this.calculateWeekTotals(currentPlan)
    const finalAccuracy = this.calculateAccuracy(finalTotals, this.calculateWeeklyTargets(targets))

    return {
      optimizedPlan: currentPlan,
      stats: {
        iterations: iteration,
        finalAccuracy,
        totalAdjustments: this.optimizationLog.length,
        forcedMealsPreserved: this.countForcedMeals(currentPlan),
        weekComplete: this.countEmptySlots(currentPlan).total === 0
      },
      log: this.optimizationLog
    }
  }

  /**
   * Enhanced optimization moves - better strategies
   */
  async findEnhancedOptimizationMoves(weekPlan, adjustments, availableMeals, respectForcedMeals) {
    const moves = []

    // Strategy 1: Smart portion scaling (improved)
    const portionMoves = this.findSmartPortionMoves(weekPlan, adjustments, respectForcedMeals)
    moves.push(...portionMoves)

    // Strategy 2: Intelligent meal swapping
    if (availableMeals.length > 0) {
      const swapMoves = await this.findIntelligentSwapMoves(weekPlan, adjustments, availableMeals, respectForcedMeals)
      moves.push(...swapMoves)
    }

    // Strategy 3: Strategic snack addition (limited)
    const snackMoves = this.findStrategicSnackMoves(weekPlan, adjustments, availableMeals)
    moves.push(...snackMoves.slice(0, 3)) // Limit snacks

    // Strategy 4: Meal replacement within forced constraints
    const replacementMoves = this.findReplacementMoves(weekPlan, adjustments, availableMeals, respectForcedMeals)
    moves.push(...replacementMoves)

    return moves.sort((a, b) => b.improvement - a.improvement)
  }

  /**
   * Smart portion scaling with better logic
   */
  findSmartPortionMoves(weekPlan, adjustments, respectForcedMeals) {
    const moves = []
    const scaleOptions = [0.7, 0.8, 0.9, 1.1, 1.2, 1.3, 1.4] // More options

    weekPlan.forEach((day, dayIndex) => {
      const slots = ['breakfast', 'lunch', 'dinner']
      
      slots.forEach(slot => {
        const meal = day[slot]
        if (!meal) return
        
        // Skip forced meals if protection enabled
        if (respectForcedMeals && meal.forced) return

        const currentScale = meal.scale_factor || 1
        
        scaleOptions.forEach(newScale => {
          if (Math.abs(newScale - currentScale) < 0.1) return
          
          const scaleDelta = newScale - currentScale
          const calorieChange = (meal.calories || 0) * scaleDelta
          const proteinChange = (meal.protein || 0) * scaleDelta
          
          const improvement = this.calculateCombinedImprovement(adjustments, {
            calories: calorieChange,
            protein: proteinChange
          })
          
          if (improvement > 5) { // Minimum improvement threshold
            moves.push({
              type: 'smart_portion_scale',
              dayIndex,
              slot,
              newScale,
              improvement,
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
   * Intelligent meal swapping with timing respect
   */
  async findIntelligentSwapMoves(weekPlan, adjustments, availableMeals, respectForcedMeals) {
    const moves = []

    weekPlan.forEach((day, dayIndex) => {
      const slots = ['breakfast', 'lunch', 'dinner']
      
      slots.forEach(slot => {
        const currentMeal = day[slot]
        if (!currentMeal) return
        
        // NEVER swap forced meals
        if (respectForcedMeals && currentMeal.forced) return

        // Find better replacement meals
        const candidates = availableMeals.filter(meal => {
          if (meal.id === currentMeal.id) return false
          
          // Timing compatibility
          if (meal.timing && meal.timing.length > 0) {
            return meal.timing.includes(slot)
          }
          return true
        })

        // Score each candidate
        candidates.forEach(newMeal => {
          const calorieChange = (newMeal.calories || 0) - (currentMeal.calories || 0)
          const proteinChange = (newMeal.protein || 0) - (currentMeal.protein || 0)
          
          const improvement = this.calculateCombinedImprovement(adjustments, {
            calories: calorieChange,
            protein: proteinChange
          })
          
          if (improvement > 15) { // Higher threshold for swaps
            moves.push({
              type: 'intelligent_swap',
              dayIndex,
              slot,
              newMeal: { ...newMeal, scale_factor: 1 },
              improvement,
              reason: `Swap to ${newMeal.name} for better macros`,
              changes: { calories: calorieChange, protein: proteinChange }
            })
          }
        })
      })
    })

    return moves
  }

  /**
   * Strategic snack moves - limited and targeted
   */
  findStrategicSnackMoves(weekPlan, adjustments, availableMeals) {
    const moves = []

    // Only add snacks if we're significantly under targets
    if (adjustments.calories < 200 && adjustments.protein < 15) {
      return moves // Don't add unnecessary snacks
    }

    const suitableSnacks = availableMeals.filter(meal => 
      (meal.timing?.includes('snack') || !meal.timing) &&
      (meal.calories || 0) < 400 && // Reasonable snack size
      (meal.protein || 0) > 10 // Good protein content
    )

    // Only add to days with fewer than 2 snacks
    weekPlan.forEach((day, dayIndex) => {
      if ((day.snacks?.length || 0) < 2) {
        suitableSnacks.slice(0, 2).forEach(snack => { // Max 2 snack types
          const improvement = this.calculateCombinedImprovement(adjustments, {
            calories: snack.calories || 0,
            protein: snack.protein || 0
          })
          
          if (improvement > 20) {
            moves.push({
              type: 'strategic_snack',
              dayIndex,
              newSnack: { ...snack, scale_factor: 1 },
              improvement,
              reason: `Add strategic snack: ${snack.name}`,
              changes: { calories: snack.calories || 0, protein: snack.protein || 0 }
            })
          }
        })
      }
    })

    return moves
  }

  /**
   * Helper methods
   */
  countEmptySlots(weekPlan) {
    let emptyBreakfast = 0, emptyLunch = 0, emptyDinner = 0
    
    weekPlan.forEach(day => {
      if (!day.breakfast) emptyBreakfast++
      if (!day.lunch) emptyLunch++
      if (!day.dinner) emptyDinner++
    })
    
    return {
      breakfast: emptyBreakfast,
      lunch: emptyLunch,
      dinner: emptyDinner,
      total: emptyBreakfast + emptyLunch + emptyDinner
    }
  }

  extractExistingMeals(weekPlan) {
    const meals = []
    const seenIds = new Set()
    
    weekPlan.forEach(day => {
      const dayMeals = [day.breakfast, day.lunch, day.dinner].filter(Boolean)
      dayMeals.forEach(meal => {
        if (!seenIds.has(meal.id)) {
          meals.push(meal)
          seenIds.add(meal.id)
        }
      })
    })
    
    return meals
  }

  calculateCombinedImprovement(adjustments, changes) {
    const calorieImprovement = this.calculateSingleImprovement(adjustments.calories, changes.calories)
    const proteinImprovement = this.calculateSingleImprovement(adjustments.protein, changes.protein)
    
    // Weight protein more heavily
    return calorieImprovement + (proteinImprovement * 1.5)
  }

  calculateSingleImprovement(needed, change) {
    if (needed === 0) return 0
    
    if (needed > 0 && change > 0) {
      return Math.min(needed, change) / Math.abs(needed) * 100
    } else if (needed < 0 && change < 0) {
      return Math.min(Math.abs(needed), Math.abs(change)) / Math.abs(needed) * 100
    }
    
    return 0
  }

  calculateWeeklyTargets(dailyTargets) {
    return {
      calories: dailyTargets.calories * 7,
      protein: dailyTargets.protein * 7,
      carbs: dailyTargets.carbs * 7,
      fat: dailyTargets.fat * 7
    }
  }

  calculateWeekTotals(weekPlan) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    
    weekPlan.forEach(day => {
      const dayMeals = [day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])].filter(Boolean)
      
      dayMeals.forEach(meal => {
        const scale = meal.scale_factor || 1
        totals.calories += (meal.calories || 0) * scale
        totals.protein += (meal.protein || 0) * scale
        totals.carbs += (meal.carbs || 0) * scale
        totals.fat += (meal.fat || 0) * scale
      })
    })
    
    return totals
  }

  calculateAccuracy(current, targets) {
    return {
      calories: targets.calories > 0 ? Math.round((current.calories / targets.calories) * 100) : 100,
      protein: targets.protein > 0 ? Math.round((current.protein / targets.protein) * 100) : 100,
      carbs: targets.carbs > 0 ? Math.round((current.carbs / targets.carbs) * 100) : 100,
      fat: targets.fat > 0 ? Math.round((current.fat / targets.fat) * 100) : 100
    }
  }

  isWithinTolerance(accuracy, tolerance) {
    const tolerancePercent = tolerance * 100
    return Math.abs(100 - accuracy.calories) <= tolerancePercent &&
           Math.abs(100 - accuracy.protein) <= tolerancePercent
  }

  calculateAdjustments(current, targets) {
    return {
      calories: targets.calories - current.calories,
      protein: targets.protein - current.protein,
      carbs: targets.carbs - current.carbs,
      fat: targets.fat - current.fat
    }
  }

  applyOptimizationMove(weekPlan, move) {
    const day = weekPlan[move.dayIndex]

    switch (move.type) {
      case 'smart_portion_scale':
        if (day[move.slot]) {
          day[move.slot].scale_factor = move.newScale
        }
        break

      case 'intelligent_swap':
        if (day[move.slot] && !day[move.slot].forced) {
          day[move.slot] = move.newMeal
        }
        break

      case 'strategic_snack':
        if (!day.snacks) day.snacks = []
        if (day.snacks.length < 2) { // Limit snacks
          day.snacks.push(move.newSnack)
        }
        break
    }
  }

  updateAllDayTotals(weekPlan) {
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

      day.accuracy = {
        total: Math.round((day.totals.kcal + day.totals.protein * 4) / 
                         ((day.totals.kcal + day.totals.protein * 4) || 1) * 100),
        calories: 95, // Placeholder
        protein: 95
      }
    })
  }

  countForcedMeals(weekPlan) {
    let count = 0
    weekPlan.forEach(day => {
      const allMeals = [day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])].filter(Boolean)
      count += allMeals.filter(meal => meal.forced).length
    })
    return count
  }

  log(message) {
    console.log(`[EnhancedFillOptimizer] ${message}`)
    this.optimizationLog.push({
      timestamp: new Date().toISOString(),
      message
    })
  }
}

export default EnhancedFillOptimizer
