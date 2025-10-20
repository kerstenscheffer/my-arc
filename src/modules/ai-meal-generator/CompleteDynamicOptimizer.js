// src/modules/ai-meal-generator/CompleteDynamicOptimizer.js
// COMPLETE VERSION - Dynamic Slots + Frequency Control + All Optimization
// FIXED: Scale values are now applied to actual meal macros, not just metadata

export class CompleteDynamicOptimizer {
  constructor(db, aiService) {
    this.db = db
    this.aiService = aiService
    this.optimizationLog = []
  }

  /**
   * FREQUENCY CONTROL DISTRIBUTION - With Auto-Scaling for Over-Target Situations
   */
  async distributeWithFrequencyControl(weekPlan, mealPool, options = {}) {
    const {
      mealsPerDay = 4,
      respectTiming = true,
      balanceDistribution = true,
      dailyTargets = null, // NEW: Pass daily targets for auto-scaling
      onProgress = () => {}
    } = options
    
    console.log(`📊 Starting frequency-based distribution: ${mealPool.length} meals into ${mealsPerDay * 7} slots`)
    
    // CRITICAL FIX: Calculate if we need to scale down
    let globalScaleFactor = 1.0
    if (dailyTargets) {
      // Calculate total calories from meal pool per day
      const uniqueMeals = {}
      const mealFrequencies = {}
      
      mealPool.forEach(meal => {
        if (!uniqueMeals[meal.id]) {
          uniqueMeals[meal.id] = meal
          mealFrequencies[meal.id] = 0
        }
        mealFrequencies[meal.id]++
      })
      
      // Calculate daily average based on frequency
      let totalDailyCalories = 0
      Object.keys(uniqueMeals).forEach(mealId => {
        const meal = uniqueMeals[mealId]
        const dailyFrequency = mealFrequencies[mealId] / 7
        totalDailyCalories += (meal.calories || 0) * dailyFrequency
      })
      
      console.log(`📊 Calculated daily calories from pool: ${Math.round(totalDailyCalories)} vs target: ${dailyTargets.calories}`)
      
      // If over target, calculate scale factor
      if (totalDailyCalories > dailyTargets.calories * 1.05) { // 5% tolerance
        globalScaleFactor = dailyTargets.calories / totalDailyCalories
        console.log(`⚠️ OVER TARGET! Applying global scale: ${(globalScaleFactor * 100).toFixed(1)}%`)
      } else if (totalDailyCalories < dailyTargets.calories * 0.95) { // Under target
        globalScaleFactor = Math.min(1.5, dailyTargets.calories / totalDailyCalories) // Max 150% scale up
        console.log(`⬆️ UNDER TARGET! Applying scale up: ${(globalScaleFactor * 100).toFixed(1)}%`)
      }
    }
    
    // Define slot structure
    const slotStructure = this.createSlotStructure(mealsPerDay)
    const slotNames = slotStructure.map(s => s.name)
    
    let placedCount = 0
    
    // Shuffle pool for variety while maintaining frequency
    const shuffledPool = [...mealPool].sort(() => Math.random() - 0.5)
    
    // Track usage per meal ID for balanced distribution
    const mealUsageCount = {}
    const mealUsageByDay = {}
    
    // Initialize tracking
    for (let day = 0; day < 7; day++) {
      mealUsageByDay[`day${day}`] = new Set()
    }
    
    // First pass: Place meals with timing restrictions and APPLY SCALING
    for (let poolIndex = 0; poolIndex < shuffledPool.length && placedCount < mealsPerDay * 7; poolIndex++) {
      const meal = shuffledPool[poolIndex]
      const allowedTimings = meal.allowedTimings || slotNames
      
      // Try to place in allowed slots
      let placed = false
      for (let day = 0; day < 7 && !placed; day++) {
        for (const slotInfo of slotStructure) {
          const slot = slotInfo.name
          
          // Check timing compatibility
          const timingMatch = allowedTimings.includes(slot) || 
                             allowedTimings.includes(slotInfo.timing) ||
                             (slotInfo.timing === 'snack' && allowedTimings.includes('snack'))
          
          if (!timingMatch && respectTiming) {
            continue
          }
          
          if (!weekPlan[day][slot]) {
            // Check if this meal was already used today (avoid same meal multiple times per day)
            const dayKey = `day${day}`
            
            if (balanceDistribution && mealUsageByDay[dayKey].has(meal.id)) {
              continue // Skip if meal already used today
            }
            
            // Place the meal WITH CALCULATED SCALE FACTOR
            // FIXED: Apply scale to actual values, not just metadata
            weekPlan[day][slot] = {
              ...meal,
              // CRITICAL: Apply scale to actual values
              calories: Math.round(meal.calories * globalScaleFactor),
              protein: Math.round(meal.protein * globalScaleFactor),
              carbs: Math.round(meal.carbs * globalScaleFactor),
              fat: Math.round(meal.fat * globalScaleFactor),
              fiber: meal.fiber ? Math.round(meal.fiber * globalScaleFactor) : undefined,
              // Keep original values for reference
              originalCalories: meal.calories,
              originalProtein: meal.protein,
              originalCarbs: meal.carbs,
              originalFat: meal.fat,
              originalFiber: meal.fiber,
              // Metadata
              forced: true,
              fromFrequency: true,
              placedByOptimizer: true,
              scale_factor: globalScaleFactor,
              scaleFactor: globalScaleFactor // Both formats for compatibility
            }
            
            // Track usage
            mealUsageCount[meal.id] = (mealUsageCount[meal.id] || 0) + 1
            mealUsageByDay[dayKey].add(meal.id)
            
            placedCount++
            placed = true
            
            // Remove this instance from pool
            shuffledPool.splice(poolIndex, 1)
            poolIndex-- // Adjust index after removal
            
            console.log(`Day ${day + 1} ${slot}: ${meal.name} @ ${(globalScaleFactor * 100).toFixed(0)}% = ${Math.round(meal.calories * globalScaleFactor)} kcal`)
            
            break
          }
        }
      }
      
      // If couldn't place with timing restrictions, mark for later
      if (!placed && respectTiming) {
        meal.needsForcePlacement = true
      }
    }
    
    // Second pass: Fill remaining slots with smart repetition (also scaled)
    const remainingSlots = mealsPerDay * 7 - placedCount
    if (remainingSlots > 0) {
      console.log(`⚡ Smart repeat to fill ${remainingSlots} remaining slots`)
      
      const remainingPositions = []
      for (let day = 0; day < 7; day++) {
        for (const slotInfo of slotStructure) {
          if (!weekPlan[day][slotInfo.name]) {
            remainingPositions.push({ day, slot: slotInfo.name, timing: slotInfo.timing })
          }
        }
      }
      
      // Create repeat pool from original meals (unique instances)
      const uniqueMeals = {}
      mealPool.forEach(meal => {
        if (!uniqueMeals[meal.id]) {
          uniqueMeals[meal.id] = meal
        }
      })
      
      const mealIds = Object.keys(uniqueMeals)
      
      // Fill remaining slots
      for (let i = 0; i < remainingPositions.length && mealIds.length > 0; i++) {
        const { day, slot, timing } = remainingPositions[i]
        
        // Find compatible meal for this slot
        let selectedMeal = null
        
        for (const mealId of mealIds) {
          const meal = uniqueMeals[mealId]
          const allowedTimings = meal.allowedTimings || slotStructure.map(s => s.name)
          
          if (!respectTiming || allowedTimings.includes(slot) || allowedTimings.includes(timing)) {
            selectedMeal = meal
            break
          }
        }
        
        // If no compatible meal found, use first available
        if (!selectedMeal && mealIds.length > 0) {
          selectedMeal = uniqueMeals[mealIds[0]]
        }
        
        if (selectedMeal) {
          // FIXED: Also apply scale to repeats
          weekPlan[day][slot] = {
            ...selectedMeal,
            // Apply scale to actual values
            calories: Math.round(selectedMeal.calories * globalScaleFactor),
            protein: Math.round(selectedMeal.protein * globalScaleFactor),
            carbs: Math.round(selectedMeal.carbs * globalScaleFactor),
            fat: Math.round(selectedMeal.fat * globalScaleFactor),
            fiber: selectedMeal.fiber ? Math.round(selectedMeal.fiber * globalScaleFactor) : undefined,
            // Keep original values
            originalCalories: selectedMeal.calories,
            originalProtein: selectedMeal.protein,
            originalCarbs: selectedMeal.carbs,
            originalFat: selectedMeal.fat,
            originalFiber: selectedMeal.fiber,
            // Metadata
            forced: true,
            smartRepeat: true,
            placedByOptimizer: true,
            scale_factor: globalScaleFactor,
            scaleFactor: globalScaleFactor
          }
          placedCount++
          
          console.log(`Repeat - Day ${day + 1} ${slot}: ${selectedMeal.name} @ ${(globalScaleFactor * 100).toFixed(0)}%`)
        }
      }
    }
    
    // Update day totals with scaled values
    this.updateAllDayTotals(weekPlan)
    
    // Final report
    if (dailyTargets) {
      weekPlan.forEach((day, index) => {
        const dayCalories = day.totals?.kcal || 0
        const accuracy = Math.round((dayCalories / dailyTargets.calories) * 100)
        console.log(`Day ${index + 1}: ${Math.round(dayCalories)} kcal (${accuracy}% of target)`)
      })
    }
    
    onProgress({
      step: `Placed ${placedCount}/${mealsPerDay * 7} slots via frequency control @ ${(globalScaleFactor * 100).toFixed(0)}% scale`,
      progress: 1.0
    })
    
    this.log(`Frequency distribution complete: ${placedCount}/${mealsPerDay * 7} slots filled with ${(globalScaleFactor * 100).toFixed(0)}% scaling`)
    
    // NEW: Balance daily targets after distribution
    if (dailyTargets) {
      console.log('\n🎯 Balancing daily targets with enhanced method...')
      await this.balanceDailyTargets(weekPlan, dailyTargets, {
        tolerance: 0.02, // Strict 2% tolerance
        macroAwareness: true, // Consider carbs in scaling
        onProgress: onProgress
      })
      
      // ADDITIONAL: Carb boost pass if needed
      const weekTotals = this.calculateWeekTotals(weekPlan)
      const avgDailyCarbs = weekTotals.carbs / 7
      
      if (avgDailyCarbs < dailyTargets.carbs * 0.8) { // If carbs < 80% of target
        console.log('\n🍞 Running carb optimization pass...')
        this.optimizeCarbIntake(weekPlan, dailyTargets)
      }
    }
    
    return weekPlan
  }

  /**
   * IMPROVED DAILY BALANCE FIX - Stricter tolerance and better macro awareness
   * Run this AFTER frequency distribution to fix daily variations
   */
  async balanceDailyTargets(weekPlan, dailyTargets, options = {}) {
    const {
      tolerance = 0.02, // STRICTER: 2% tolerance (was 5%)
      preserveForcedMeals = true,
      macroAwareness = true, // NEW: Consider macros in scaling
      onProgress = () => {}
    } = options
    
    console.log(`🎯 Starting enhanced daily balance. Target: ${dailyTargets.calories} kcal/day`)
    
    // Process each day independently
    weekPlan.forEach((day, dayIndex) => {
      // Calculate current day totals FROM ORIGINAL VALUES
      let dayCalories = 0
      let dayProtein = 0
      let dayCarbs = 0
      let dayFat = 0
      
      const slots = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3']
      const activeMeals = []
      
      // Count current totals using ORIGINAL values + current scale
      slots.forEach(slot => {
        if (day[slot]) {
          const meal = day[slot]
          const currentScale = meal.scale_factor || 1
          
          // Always calculate from originals if available
          const baseCalories = meal.originalCalories || meal.calories
          const baseProtein = meal.originalProtein || meal.protein
          const baseCarbs = meal.originalCarbs || meal.carbs
          const baseFat = meal.originalFat || meal.fat
          
          dayCalories += baseCalories * currentScale
          dayProtein += baseProtein * currentScale
          dayCarbs += baseCarbs * currentScale
          dayFat += baseFat * currentScale
          
          activeMeals.push({ 
            slot, 
            meal,
            baseValues: { 
              calories: baseCalories, 
              protein: baseProtein, 
              carbs: baseCarbs, 
              fat: baseFat 
            }
          })
        }
      })
      
      // Calculate needed adjustments
      const currentTotal = dayCalories
      const targetTotal = dailyTargets.calories
      const calorieAccuracy = currentTotal / targetTotal
      const carbsAccuracy = dayCarbs / dailyTargets.carbs
      
      console.log(`Day ${dayIndex + 1}: ${Math.round(currentTotal)} kcal (${Math.round(calorieAccuracy*100)}%), ${Math.round(dayCarbs)}g carbs (${Math.round(carbsAccuracy*100)}%)`)
      
      // Determine if adjustment needed
      const needsAdjustment = Math.abs(1 - calorieAccuracy) > tolerance
      
      if (needsAdjustment) {
        // Calculate scale factor with macro awareness
        let dayScaleFactor = targetTotal / currentTotal
        
        // If carbs are way off, adjust scale factor slightly
        if (macroAwareness && carbsAccuracy < 0.7) {
          // Boost scale factor a bit if carbs are very low
          dayScaleFactor *= 1.05
          console.log(`  → Carbs very low, boosting scale to ${(dayScaleFactor * 100).toFixed(1)}%`)
        }
        
        // Cap scale factor to reasonable range
        dayScaleFactor = Math.min(Math.max(dayScaleFactor, 0.7), 1.3)
        
        console.log(`  → Applying enhanced day scale: ${(dayScaleFactor * 100).toFixed(1)}%`)
        
        // Apply uniform scale to all meals in this day
        activeMeals.forEach(({ slot, meal, baseValues }) => {
          const currentScale = meal.scale_factor || 1
          const newScale = currentScale * dayScaleFactor
          
          // Update the meal with properly scaled values
          day[slot] = {
            ...meal,
            // Scale from base values
            calories: Math.round(baseValues.calories * newScale),
            protein: Math.round(baseValues.protein * newScale),
            carbs: Math.round(baseValues.carbs * newScale),
            fat: Math.round(baseValues.fat * newScale),
            // Keep originals
            originalCalories: baseValues.calories,
            originalProtein: baseValues.protein,
            originalCarbs: baseValues.carbs,
            originalFat: baseValues.fat,
            // Update scale tracking
            scale_factor: newScale,
            scaleFactor: newScale,
            dayBalanced: true,
            dayScaleApplied: dayScaleFactor,
            previousScale: currentScale
          }
          
          console.log(`    ${slot}: ${meal.name} @ ${(newScale * 100).toFixed(0)}% = ${Math.round(baseValues.calories * newScale)} kcal`)
        })
      }
    })
    
    // Recalculate all day totals with new values
    this.updateAllDayTotals(weekPlan)
    
    // Enhanced final report with macro info
    console.log('\n📊 Enhanced Daily Balance Results:')
    let totalWeekCarbs = 0
    weekPlan.forEach((day, index) => {
      const calAccuracy = Math.round((day.totals.kcal / dailyTargets.calories) * 100)
      const carbAccuracy = Math.round((day.totals.carbs / dailyTargets.carbs) * 100)
      const status = Math.abs(100 - calAccuracy) <= 2 ? '✅' : '⚠️'
      
      totalWeekCarbs += day.totals.carbs
      
      console.log(`Day ${index + 1}: ${Math.round(day.totals.kcal)} kcal (${calAccuracy}%), ${Math.round(day.totals.carbs)}g carbs (${carbAccuracy}%) ${status}`)
    })
    
    const avgDailyCarbs = Math.round(totalWeekCarbs / 7)
    console.log(`\nAverage daily carbs: ${avgDailyCarbs}g (${Math.round(avgDailyCarbs/dailyTargets.carbs*100)}% of target)`)
    
    onProgress({
      step: 'Enhanced daily balance complete',
      progress: 1.0
    })
    
    return weekPlan
  }

  /**
   * CARB OPTIMIZATION PASS - Boost carb-heavy meals if weekly average is too low
   */
  optimizeCarbIntake(weekPlan, dailyTargets) {
    const targetDailyCarbs = dailyTargets.carbs
    
    weekPlan.forEach((day, dayIndex) => {
      const slots = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3']
      let dayCarbs = day.totals.carbs || 0
      
      if (dayCarbs < targetDailyCarbs * 0.85) { // If day is low on carbs
        console.log(`Day ${dayIndex + 1}: Boosting carb-heavy meals...`)
        
        // Find meals with good carb ratio
        slots.forEach(slot => {
          if (day[slot]) {
            const meal = day[slot]
            const carbRatio = (meal.originalCarbs || meal.carbs) / (meal.originalCalories || meal.calories)
            
            // If meal is carb-heavy (>50% calories from carbs) and not already maxed
            if (carbRatio > 0.5 && meal.scale_factor < 1.3) {
              const oldScale = meal.scale_factor || 1
              const newScale = Math.min(oldScale * 1.1, 1.3) // Boost by 10%, max 130%
              
              // Recalculate with boost
              day[slot] = {
                ...meal,
                calories: Math.round((meal.originalCalories || meal.calories) * newScale),
                protein: Math.round((meal.originalProtein || meal.protein) * newScale),
                carbs: Math.round((meal.originalCarbs || meal.carbs) * newScale),
                fat: Math.round((meal.originalFat || meal.fat) * newScale),
                scale_factor: newScale,
                carbBoosted: true
              }
              
              console.log(`  ${slot}: ${meal.name} boosted to ${Math.round(newScale * 100)}% (carb-rich)`)
            }
          }
        })
      }
    })
    
    // Recalculate totals
    this.updateAllDayTotals(weekPlan)
  }

  /**
   * VALIDATE FREQUENCY COMPLIANCE - Check if frequency targets are met
   */
  validateFrequencyCompliance(weekPlan, forcedMealsConfig) {
    if (!forcedMealsConfig || forcedMealsConfig.length === 0) {
      return { compliant: true, details: {}, message: 'No frequency configuration to validate' }
    }
    
    const mealCounts = {}
    const slotNames = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3', 'snacks']
    
    // Count occurrences of each meal
    weekPlan.forEach(day => {
      slotNames.forEach(slot => {
        if (day[slot]) {
          if (Array.isArray(day[slot])) {
            // Handle snacks array
            day[slot].forEach(meal => {
              if (meal && meal.id) {
                mealCounts[meal.id] = (mealCounts[meal.id] || 0) + 1
              }
            })
          } else if (day[slot].id) {
            const meal = day[slot]
            mealCounts[meal.id] = (mealCounts[meal.id] || 0) + 1
          }
        }
      })
    })
    
    // Check compliance for each configured meal
    let compliant = true
    const details = {}
    let totalDifference = 0
    
    forcedMealsConfig.forEach(config => {
      const actual = mealCounts[config.meal.id] || 0
      const target = config.frequency
      const difference = actual - target
      
      details[config.meal.name] = {
        target,
        actual,
        difference,
        compliant: actual === target,
        percentage: target > 0 ? Math.round((actual / target) * 100) : 100
      }
      
      if (actual !== target) {
        compliant = false
        totalDifference += Math.abs(difference)
      }
    })
    
    const message = compliant 
      ? 'All frequency targets met perfectly!' 
      : `Frequency variance: ${totalDifference} slots off target`
    
    return { 
      compliant, 
      details, 
      message,
      totalDifference,
      mealCounts
    }
  }

  /**
   * DYNAMIC COMPLETE WEEK FILLING - Supports 3-6 meals per day
   */
  async fillCompleteWeek(weekPlan, forcedMeals, availableMeals = [], options = {}) {
    const {
      mealsPerDay = 4,
      fillMode = 'smart_repeat',
      respectTiming = true,
      onProgress = null
    } = options

    this.log(`Starting dynamic week filling for ${mealsPerDay} meals/day...`)
    
    if (onProgress) {
      onProgress({
        step: `Analyseren lege slots (${mealsPerDay} maaltijden/dag)...`,
        progress: 10
      })
    }

    // Calculate total slots based on meals per day
    const totalSlots = 7 * mealsPerDay // Dynamic: 21, 28, 35, or 42 slots
    const emptySlots = this.countEmptySlotsDynamic(weekPlan, mealsPerDay)
    
    this.log(`Target: ${totalSlots} total slots, Found ${emptySlots.total} empty slots`)

    if (emptySlots.total === 0) {
      this.log('Week already complete!')
      return weekPlan
    }

    // Strategy based on fillMode
    if (fillMode === 'smart_repeat' && forcedMeals.length > 0) {
      await this.smartRepeatFillDynamic(weekPlan, forcedMeals, mealsPerDay, respectTiming, onProgress)
    } else if (fillMode === 'ai_fill' && availableMeals.length > 0) {
      await this.aiFillDynamic(weekPlan, availableMeals, mealsPerDay, respectTiming, onProgress)
    } else if (fillMode === 'mixed') {
      await this.mixedFillDynamic(weekPlan, forcedMeals, availableMeals, mealsPerDay, respectTiming, onProgress)
    }

    // Final validation
    const finalEmpty = this.countEmptySlotsDynamic(weekPlan, mealsPerDay)
    this.log(`After filling: ${finalEmpty.total} slots still empty out of ${totalSlots}`)

    // Update totals
    this.updateAllDayTotals(weekPlan)

    return weekPlan
  }

  /**
   * Dynamic Smart Repeat Fill - Works with any meals per day
   */
  async smartRepeatFillDynamic(weekPlan, forcedMeals, mealsPerDay, respectTiming, onProgress) {
    this.log(`Using smart repeat for ${mealsPerDay} meals/day`)
    
    // Dynamic slot structure based on meals per day
    const slotStructure = this.createSlotStructure(mealsPerDay)
    const mealUsage = {}
    
    // Initialize usage counter
    forcedMeals.forEach(meal => {
      mealUsage[meal.id] = 0
    })

    // Create meal rotation for all possible slots
    const mealRotation = this.createDynamicMealRotation(forcedMeals, slotStructure, respectTiming)
    
    if (onProgress) {
      onProgress({
        step: `Smart repeat pattern voor ${mealsPerDay} maaltijden...`,
        progress: 30
      })
    }

    // Fill all empty slots dynamically
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const day = weekPlan[dayIndex]
      
      // Process each slot type for this meals per day configuration
      for (const slotInfo of slotStructure) {
        const slot = slotInfo.name
        
        if (!day[slot]) {
          // Find least used meal for this slot
          const availableForSlot = mealRotation[slot] || mealRotation['any']
          
          if (availableForSlot && availableForSlot.length > 0) {
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
              repeatedFromOriginal: true,
              dynamicSlot: true
            }
            
            // Update usage
            mealUsage[selectedMeal.id] = (mealUsage[selectedMeal.id] || 0) + 1
            
            this.log(`Day ${dayIndex + 1} ${slot}: ${selectedMeal.name} (${mealUsage[selectedMeal.id]}x total)`)
          }
        }
      }
    }

    if (onProgress) {
      onProgress({
        step: `Smart repeat voltooid voor ${mealsPerDay} maaltijden/dag`,
        progress: 60
      })
    }

    this.log('Dynamic smart repeat fill completed')
    this.log('Final usage:', mealUsage)
  }

  /**
   * Create slot structure based on meals per day
   */
  createSlotStructure(mealsPerDay) {
    const baseSlots = [
      { name: 'breakfast', timing: 'breakfast', priority: 1 },
      { name: 'lunch', timing: 'lunch', priority: 2 },
      { name: 'dinner', timing: 'dinner', priority: 3 }
    ]

    if (mealsPerDay === 3) {
      return baseSlots
    }

    // Add snacks based on meals per day
    const snackCount = mealsPerDay - 3
    for (let i = 0; i < snackCount; i++) {
      baseSlots.push({
        name: `snack${i + 1}`,
        timing: 'snack',
        priority: 4 + i
      })
    }

    return baseSlots
  }

  /**
   * Create dynamic meal rotation
   */
  createDynamicMealRotation(forcedMeals, slotStructure, respectTiming) {
    const rotation = {}
    
    // Initialize all slot types
    slotStructure.forEach(slot => {
      rotation[slot.name] = []
    })
    rotation['any'] = [...forcedMeals] // Fallback

    forcedMeals.forEach(meal => {
      if (respectTiming && meal.timing && meal.timing.length > 0) {
        // Use meal's preferred timing
        meal.timing.forEach(timeSlot => {
          // Match to our slot structure
          slotStructure.forEach(slot => {
            if (slot.timing === timeSlot || slot.name === timeSlot) {
              rotation[slot.name].push(meal)
            }
          })
          
          // Handle snacks specially
          if (timeSlot === 'snack') {
            slotStructure.forEach(slot => {
              if (slot.name.startsWith('snack')) {
                rotation[slot.name].push(meal)
              }
            })
          }
        })
      } else {
        // No timing preference, add to all slots
        slotStructure.forEach(slot => {
          rotation[slot.name].push(meal)
        })
      }
    })

    // Ensure each slot has at least one meal
    slotStructure.forEach(slot => {
      if (rotation[slot.name].length === 0) {
        rotation[slot.name] = [...forcedMeals] // Fallback to all meals
      }
    })

    return rotation
  }

  /**
   * AI Fill Dynamic - Works with any meal count
   */
  async aiFillDynamic(weekPlan, availableMeals, mealsPerDay, respectTiming, onProgress) {
    this.log(`Using AI fill for ${mealsPerDay} meals/day`)
    
    const slotStructure = this.createSlotStructure(mealsPerDay)
    const usedMealIds = new Set()

    if (onProgress) {
      onProgress({
        step: `AI meals selecteren voor ${mealsPerDay} maaltijden...`,
        progress: 40
      })
    }

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const day = weekPlan[dayIndex]
      
      for (const slotInfo of slotStructure) {
        const slot = slotInfo.name
        
        if (!day[slot]) {
          // Find suitable AI meal
          const suitableMeals = availableMeals.filter(meal => {
            // Avoid duplicates across the week (optional)
            // if (usedMealIds.has(meal.id)) return false
            
            // Check timing if respected
            if (respectTiming && meal.timing && meal.timing.length > 0) {
              return meal.timing.includes(slotInfo.timing) || 
                     meal.timing.includes(slot)
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
              aiGenerated: true,
              dynamicSlot: true
            }
            
            usedMealIds.add(selectedMeal.id)
            this.log(`Day ${dayIndex + 1} ${slot}: ${selectedMeal.name} (AI)`)
          }
        }
      }
    }

    if (onProgress) {
      onProgress({
        step: `AI fill voltooid voor ${mealsPerDay} maaltijden`,
        progress: 70
      })
    }
  }

  /**
   * Mixed Fill Dynamic
   */
  async mixedFillDynamic(weekPlan, forcedMeals, availableMeals, mealsPerDay, respectTiming, onProgress) {
    this.log(`Using mixed fill for ${mealsPerDay} meals/day`)
    
    // First, try to fill with AI meals for variety
    if (availableMeals.length > 0) {
      await this.aiFillDynamic(weekPlan, availableMeals, mealsPerDay, respectTiming, onProgress)
    }
    
    // Then fill remaining slots with forced meal repeats
    const stillEmpty = this.countEmptySlotsDynamic(weekPlan, mealsPerDay)
    if (stillEmpty.total > 0 && forcedMeals.length > 0) {
      await this.smartRepeatFillDynamic(weekPlan, forcedMeals, mealsPerDay, respectTiming, onProgress)
    }
  }

  /**
   * Enhanced Macro Optimization with Frequency Respect
   */
  async optimizeFilledWeek(weekPlan, targets, availableMeals = [], options = {}) {
    const {
      tolerance = 0.05,
      maxIterations = 12,
      respectForcedMeals = true,
      respectFrequency = null, // NEW: frequency config
      fillEmptySlots = true,
      mealsPerDay = 4,
      onProgress = null
    } = options

    this.optimizationLog = []
    let currentPlan = JSON.parse(JSON.stringify(weekPlan))
    let iteration = 0

    this.log(`Starting dynamic macro optimization for ${mealsPerDay} meals/day...`)
    
    // PHASE 1: Ensure week is completely filled
    if (fillEmptySlots) {
      const emptySlots = this.countEmptySlotsDynamic(currentPlan, mealsPerDay)
      if (emptySlots.total > 0) {
        this.log(`Filling ${emptySlots.total} empty slots first...`)
        
        if (onProgress) {
          onProgress({
            step: `${emptySlots.total} lege slots vullen...`,
            progress: 5
          })
        }
        
        // Use available meals to fill empty slots
        await this.aiFillDynamic(currentPlan, availableMeals, mealsPerDay, true, null)
        
        // If still empty, duplicate existing meals
        const stillEmpty = this.countEmptySlotsDynamic(currentPlan, mealsPerDay)
        if (stillEmpty.total > 0) {
          const existingMeals = this.extractExistingMeals(currentPlan)
          if (existingMeals.length > 0) {
            await this.smartRepeatFillDynamic(currentPlan, existingMeals, mealsPerDay, true, null)
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
      const optimizationMoves = await this.findDynamicOptimizationMoves(
        currentPlan, 
        adjustments, 
        availableMeals,
        respectForcedMeals,
        respectFrequency, // Pass frequency config
        mealsPerDay
      )

      if (optimizationMoves.length === 0) {
        this.log('No more optimization moves available')
        break
      }

      // Apply best move
      const bestMove = optimizationMoves[0]
      this.applyOptimizationMove(currentPlan, bestMove, mealsPerDay)
      
      this.log(`Applied: ${bestMove.type} - ${bestMove.reason}`)
    }

    // Final updates
    this.updateAllDayTotals(currentPlan)
    const finalTotals = this.calculateWeekTotals(currentPlan)
    const finalAccuracy = this.calculateAccuracy(finalTotals, this.calculateWeeklyTargets(targets))

    // Validate frequency compliance if configured
    let frequencyCompliance = null
    if (respectFrequency) {
      frequencyCompliance = this.validateFrequencyCompliance(currentPlan, respectFrequency)
    }

    return {
      optimizedPlan: currentPlan,
      stats: {
        iterations: iteration,
        finalAccuracy,
        totalAdjustments: this.optimizationLog.length,
        forcedMealsPreserved: this.countForcedMeals(currentPlan),
        weekComplete: this.countEmptySlotsDynamic(currentPlan, mealsPerDay).total === 0,
        totalSlots: 7 * mealsPerDay,
        filledSlots: (7 * mealsPerDay) - this.countEmptySlotsDynamic(currentPlan, mealsPerDay).total,
        frequencyCompliance: frequencyCompliance
      },
      log: this.optimizationLog
    }
  }

  /**
   * Dynamic optimization moves - supports frequency respect
   */
  async findDynamicOptimizationMoves(weekPlan, adjustments, availableMeals, respectForcedMeals, respectFrequency, mealsPerDay) {
    const moves = []

    // Strategy 1: Smart portion scaling
    const portionMoves = this.findSmartPortionMoves(weekPlan, adjustments, respectForcedMeals, respectFrequency, mealsPerDay)
    moves.push(...portionMoves)

    // Strategy 2: Intelligent meal swapping
    if (availableMeals.length > 0) {
      const swapMoves = await this.findIntelligentSwapMoves(weekPlan, adjustments, availableMeals, respectForcedMeals, respectFrequency, mealsPerDay)
      moves.push(...swapMoves)
    }

    // Strategy 3: Strategic additions (limited)
    const additionMoves = this.findStrategicAdditionMoves(weekPlan, adjustments, availableMeals, mealsPerDay)
    moves.push(...additionMoves.slice(0, 3)) // Limit additions

    return moves.sort((a, b) => b.improvement - a.improvement)
  }

  /**
   * Smart portion scaling with frequency respect
   */
  findSmartPortionMoves(weekPlan, adjustments, respectForcedMeals, respectFrequency, mealsPerDay) {
    const moves = []
    const scaleOptions = [0.7, 0.8, 0.9, 1.1, 1.2, 1.3, 1.4]
    const slotStructure = this.createSlotStructure(mealsPerDay)

    weekPlan.forEach((day, dayIndex) => {
      slotStructure.forEach(slotInfo => {
        const slot = slotInfo.name
        const meal = day[slot]
        if (!meal) return
        
        // Skip forced meals if protection enabled
        if (respectForcedMeals && meal.forced) return
        
        // Skip locked meals from frequency config
        if (respectFrequency) {
          const config = respectFrequency.find(c => c.meal.id === meal.id)
          if (config?.locked) return
        }

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
          
          if (improvement > 5) {
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
   * Intelligent meal swapping with frequency respect
   */
  async findIntelligentSwapMoves(weekPlan, adjustments, availableMeals, respectForcedMeals, respectFrequency, mealsPerDay) {
    const moves = []
    const slotStructure = this.createSlotStructure(mealsPerDay)

    weekPlan.forEach((day, dayIndex) => {
      slotStructure.forEach(slotInfo => {
        const slot = slotInfo.name
        const currentMeal = day[slot]
        if (!currentMeal) return
        
        // NEVER swap forced meals
        if (respectForcedMeals && currentMeal.forced) return
        
        // NEVER swap locked meals from frequency config
        if (respectFrequency) {
          const config = respectFrequency.find(c => c.meal.id === currentMeal.id)
          if (config?.locked) return
        }

        // Find better replacement meals
        const candidates = availableMeals.filter(meal => {
          if (meal.id === currentMeal.id) return false
          
          // Timing compatibility
          if (meal.timing && meal.timing.length > 0) {
            return meal.timing.includes(slotInfo.timing) || meal.timing.includes(slot)
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
          
          if (improvement > 15) {
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
   * Strategic addition moves - only if significantly under targets
   */
  findStrategicAdditionMoves(weekPlan, adjustments, availableMeals, mealsPerDay) {
    const moves = []

    // Only add if significantly under targets and we have room
    if (adjustments.calories < 200 && adjustments.protein < 15) {
      return moves
    }

    // Don't add beyond meals per day limit
    const maxMealsReached = weekPlan.every(day => {
      const mealCount = Object.keys(day).filter(key => 
        key !== 'totals' && key !== 'accuracy' && day[key]
      ).length
      return mealCount >= mealsPerDay
    })

    if (maxMealsReached) {
      return moves // Already at meal limit
    }

    const suitableAdditions = availableMeals.filter(meal => 
      (meal.timing?.includes('snack') || !meal.timing) &&
      (meal.calories || 0) < 400 &&
      (meal.protein || 0) > 10
    )

    // Add strategically where we have room
    weekPlan.forEach((day, dayIndex) => {
      const currentMealCount = Object.keys(day).filter(key => 
        key !== 'totals' && key !== 'accuracy' && day[key]
      ).length

      if (currentMealCount < mealsPerDay) {
        suitableAdditions.slice(0, 2).forEach(addition => {
          const improvement = this.calculateCombinedImprovement(adjustments, {
            calories: addition.calories || 0,
            protein: addition.protein || 0
          })
          
          if (improvement > 20) {
            moves.push({
              type: 'strategic_addition',
              dayIndex,
              newMeal: { ...addition, scale_factor: 1 },
              improvement,
              reason: `Add strategic meal: ${addition.name}`,
              changes: { calories: addition.calories || 0, protein: addition.protein || 0 }
            })
          }
        })
      }
    })

    return moves
  }

  /**
   * Helper: Count empty slots dynamically
   */
  countEmptySlotsDynamic(weekPlan, mealsPerDay) {
    const slotStructure = this.createSlotStructure(mealsPerDay)
    let totalEmpty = 0
    const emptyBySlot = {}

    slotStructure.forEach(slotInfo => {
      emptyBySlot[slotInfo.name] = 0
    })

    weekPlan.forEach(day => {
      slotStructure.forEach(slotInfo => {
        if (!day[slotInfo.name]) {
          emptyBySlot[slotInfo.name]++
          totalEmpty++
        }
      })
    })
    
    return {
      total: totalEmpty,
      bySlot: emptyBySlot,
      targetTotal: 7 * mealsPerDay,
      weekComplete: totalEmpty === 0
    }
  }

  /**
   * Extract existing meals from plan
   */
  extractExistingMeals(weekPlan) {
    const meals = []
    const seenIds = new Set()
    
    weekPlan.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'totals' && key !== 'accuracy' && day[key]) {
          const meal = day[key]
          if (meal.id && !seenIds.has(meal.id)) {
            meals.push(meal)
            seenIds.add(meal.id)
          }
        }
      })
    })
    
    return meals
  }

  /**
   * Apply optimization move with dynamic slot support
   */
  applyOptimizationMove(weekPlan, move, mealsPerDay) {
    const day = weekPlan[move.dayIndex]

    switch (move.type) {
      case 'smart_portion_scale':
        if (day[move.slot]) {
          day[move.slot].scale_factor = move.newScale
          day[move.slot].scaled = true
        }
        break

      case 'intelligent_swap':
        if (day[move.slot] && !day[move.slot].forced) {
          day[move.slot] = move.newMeal
        }
        break

      case 'strategic_addition':
        // Find next available slot
        const slotStructure = this.createSlotStructure(mealsPerDay)
        for (const slotInfo of slotStructure) {
          if (!day[slotInfo.name]) {
            day[slotInfo.name] = move.newMeal
            break
          }
        }
        break
    }

    this.optimizationLog.push({
      move: move.type,
      day: move.dayIndex + 1,
      slot: move.slot,
      reason: move.reason
    })
  }

  /**
   * Helper calculation methods
   */
  calculateCombinedImprovement(adjustments, changes) {
    const calorieImprovement = this.calculateSingleImprovement(adjustments.calories, changes.calories)
    const proteinImprovement = this.calculateSingleImprovement(adjustments.protein, changes.protein)
    
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
      Object.keys(day).forEach(key => {
        if (key !== 'totals' && key !== 'accuracy' && day[key]) {
          const meal = day[key]
          const scale = meal.scale_factor || 1
          totals.calories += (meal.calories || 0) * scale
          totals.protein += (meal.protein || 0) * scale
          totals.carbs += (meal.carbs || 0) * scale
          totals.fat += (meal.fat || 0) * scale
        }
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

  updateAllDayTotals(weekPlan) {
    weekPlan.forEach(day => {
      day.totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      
      Object.keys(day).forEach(key => {
        if (key !== 'totals' && key !== 'accuracy' && day[key]) {
          const meal = day[key]
          // FIXED: Use the already scaled values directly, not scale_factor
          day.totals.kcal += meal.calories || 0
          day.totals.protein += meal.protein || 0
          day.totals.carbs += meal.carbs || 0
          day.totals.fat += meal.fat || 0
        }
      })

      // Recalculate accuracy
      day.accuracy = {
        total: 100, // Placeholder
        calories: day.totals.kcal > 0 ? Math.round((day.totals.kcal / 2800) * 100) : 0,
        protein: day.totals.protein > 0 ? Math.round((day.totals.protein / 150) * 100) : 0,
        carbs: day.totals.carbs > 0 ? Math.round((day.totals.carbs / 455) * 100) : 0,
        fat: day.totals.fat > 0 ? Math.round((day.totals.fat / 92) * 100) : 0
      }
    })
  }

  /**
   * CRITICAL: Normalize snacks structure for compatibility with existing components
   */
  normalizeSnacksStructure(weekPlan, mealsPerDay) {
    weekPlan.forEach(day => {
      const snacks = []
      
      // Collect all snack slots (snack1, snack2, etc.) into snacks array
      for (let i = 1; i <= (mealsPerDay - 3); i++) {
        const snackKey = `snack${i}`
        if (day[snackKey]) {
          snacks.push(day[snackKey])
          // Keep the original slot for dynamic optimization
          // delete day[snackKey] // Don't delete - keep both for compatibility
        }
      }
      
      // Always ensure snacks is an array (even if empty)
      day.snacks = snacks
      
      this.log(`Day normalized: ${snacks.length} snacks in array`)
    })
  }

  countForcedMeals(weekPlan) {
    let count = 0
    weekPlan.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'totals' && key !== 'accuracy' && day[key]?.forced) {
          count++
        }
      })
    })
    return count
  }

  log(message) {
    console.log(`[CompleteDynamicOptimizer] ${message}`)
    this.optimizationLog.push({
      timestamp: new Date().toISOString(),
      message
    })
  }
}

export default CompleteDynamicOptimizer
