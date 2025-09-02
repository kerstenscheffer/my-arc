// src/modules/ai-meal-generator/PortionCalculator.js

/**
 * Smart Portion Calculator - FIXED VERSION
 * Berekent exacte porties op ingredient niveau voor perfecte macro targeting
 */

class PortionCalculator {
  constructor() {
    this.defaultPortionSizes = {
      breakfast: { min: 250, max: 500, default: 350 },
      lunch: { min: 300, max: 700, default: 450 },
      dinner: { min: 350, max: 800, default: 550 },
      snack: { min: 50, max: 250, default: 150 }
    }
  }

  /**
   * Calculate portion size for a meal to hit target macros
   */
  calculatePortion(meal, targetMacros, mealType = 'dinner') {
    console.log(`📊 Calculating portion for ${meal.name}`)
    
    // Base validation
    if (!meal || !meal.kcal || meal.kcal === 0) {
      console.error('❌ Invalid meal data')
      return null
    }

    // Calculate scale factors for each macro
    const scaleFactors = {
      calories: targetMacros.kcal ? targetMacros.kcal / meal.kcal : 1,
      protein: (targetMacros.protein && meal.protein > 0) ? targetMacros.protein / meal.protein : 1,
      carbs: (targetMacros.carbs && meal.carbs > 0) ? targetMacros.carbs / meal.carbs : 1,
      fat: (targetMacros.fat && meal.fat > 0) ? targetMacros.fat / meal.fat : 1
    }

    // Determine optimal scale factor based on priority
    let optimalScale = 1
    
    if (targetMacros.protein && meal.protein > 0) {
      // Protein is most important - use weighted average
      optimalScale = (scaleFactors.protein * 0.4) + 
                     (scaleFactors.calories * 0.3) +
                     (scaleFactors.carbs * 0.2) +
                     (scaleFactors.fat * 0.1)
    } else {
      // Fallback to calorie-based scaling
      optimalScale = scaleFactors.calories
    }

    // Apply reasonable limits (0.5x to 3x)
    const finalScale = Math.max(0.5, Math.min(3.0, optimalScale))
    
    // Calculate scaled meal
    const scaledMeal = {
      ...meal,
      scale: finalScale,
      portionSize: Math.round((meal.portionSize || this.defaultPortionSizes[mealType].default) * finalScale),
      macros: {
        kcal: Math.round(meal.kcal * finalScale),
        protein: Math.round((meal.protein || 0) * finalScale),
        carbs: Math.round((meal.carbs || 0) * finalScale),
        fat: Math.round((meal.fat || 0) * finalScale)
      },
      displayName: this.getDisplayName(meal.name, finalScale),
      ingredients: this.scaleIngredients(meal.ingredients, finalScale)
    }

    console.log(`✅ Scaled ${meal.name}: ${finalScale.toFixed(2)}x = ${scaledMeal.macros.kcal} kcal`)
    
    return scaledMeal
  }

  /**
   * Scale ingredients list
   */
  scaleIngredients(ingredients, scale) {
    if (!ingredients || !Array.isArray(ingredients)) return []
    
    return ingredients.map(ing => {
      if (typeof ing === 'object') {
        return {
          ...ing,
          amount: Math.round((ing.amount || 100) * scale),
          scaledMacros: {
            protein: Math.round((ing.protein || 0) * scale),
            carbs: Math.round((ing.carbs || 0) * scale),
            fat: Math.round((ing.fat || 0) * scale),
            kcal: Math.round((ing.kcal || 0) * scale)
          }
        }
      }
      return ing
    })
  }

  /**
   * Get display name with portion indicator
   */
  getDisplayName(originalName, scale) {
    if (scale >= 1.8) return `${originalName} (XL portie)`
    if (scale >= 1.4) return `${originalName} (grote portie)`
    if (scale >= 1.1) return `${originalName} (normale+ portie)`
    if (scale >= 0.9) return originalName
    if (scale >= 0.7) return `${originalName} (kleine portie)`
    return `${originalName} (mini portie)`
  }

  /**
   * Calculate daily meal distribution
   */
  calculateDailyDistribution(dailyKcal, dailyMacros, mealsPerDay = 4) {
    const distributions = {
      3: { // 3 meals
        breakfast: 0.30,
        lunch: 0.35,
        dinner: 0.35,
        snack: 0
      },
      4: { // 4 meals  
        breakfast: 0.25,
        lunch: 0.30,
        dinner: 0.35,
        snack: 0.10
      },
      5: { // 5 meals
        breakfast: 0.20,
        lunch: 0.25,
        dinner: 0.30,
        snack: 0.25 // Split across 2 snacks
      },
      6: { // 6 meals
        breakfast: 0.18,
        lunch: 0.22,
        dinner: 0.28,
        snack: 0.32 // Split across 3 snacks
      }
    }

    const dist = distributions[mealsPerDay] || distributions[4]
    
    return {
      breakfast: {
        kcal: Math.round(dailyKcal * dist.breakfast),
        protein: Math.round(dailyMacros.protein * dist.breakfast),
        carbs: Math.round(dailyMacros.carbs * dist.breakfast),
        fat: Math.round(dailyMacros.fat * dist.breakfast)
      },
      lunch: {
        kcal: Math.round(dailyKcal * dist.lunch),
        protein: Math.round(dailyMacros.protein * dist.lunch),
        carbs: Math.round(dailyMacros.carbs * dist.lunch),
        fat: Math.round(dailyMacros.fat * dist.lunch)
      },
      dinner: {
        kcal: Math.round(dailyKcal * dist.dinner),
        protein: Math.round(dailyMacros.protein * dist.dinner),
        carbs: Math.round(dailyMacros.carbs * dist.dinner),
        fat: Math.round(dailyMacros.fat * dist.dinner)
      },
      snack: {
        kcal: Math.round(dailyKcal * dist.snack),
        protein: Math.round(dailyMacros.protein * dist.snack),
        carbs: Math.round(dailyMacros.carbs * dist.snack),
        fat: Math.round(dailyMacros.fat * dist.snack)
      }
    }
  }

  /**
   * Find best meal match for target macros from available meals
   */
  findBestMealMatch(availableMeals, targetMacros, mealType, dayIndex = 0) {
    if (!availableMeals || availableMeals.length === 0) return null
    
    // Filter by meal type
    const categoryMeals = availableMeals.filter(m => m.category === mealType)
    if (categoryMeals.length === 0) {
      // If no meals in category, try to use any meal
      console.log(`⚠️ No ${mealType} meals found, using any meal`)
      const anyMeal = availableMeals[dayIndex % availableMeals.length]
      if (anyMeal) {
        anyMeal.category = mealType // Force category
        return this.calculatePortion(anyMeal, targetMacros, mealType)
      }
      return null
    }
    
    // With limited meals, cycle through them based on day
    if (categoryMeals.length <= 3) {
      // Just cycle through the available meals
      const mealIndex = dayIndex % categoryMeals.length
      const selectedMeal = categoryMeals[mealIndex]
      return this.calculatePortion(selectedMeal, targetMacros, mealType)
    }
    
    // If more than 3 meals, score and pick best
    const scoredMeals = categoryMeals.map(meal => {
      const scaledMeal = this.calculatePortion(meal, targetMacros, mealType)
      
      if (!scaledMeal) return { meal, score: 999999 }
      
      // Calculate difference score (lower is better)
      const score = 
        Math.abs(scaledMeal.macros.kcal - targetMacros.kcal) * 1.0 +
        Math.abs(scaledMeal.macros.protein - targetMacros.protein) * 4.0 + // Protein weighted higher
        Math.abs(scaledMeal.macros.carbs - targetMacros.carbs) * 1.5 +
        Math.abs(scaledMeal.macros.fat - targetMacros.fat) * 1.0
      
      return { meal: scaledMeal, score }
    })
    
    // Sort by score
    scoredMeals.sort((a, b) => a.score - b.score)
    
    // Pick from top matches with some rotation based on day
    const topCount = Math.min(3, scoredMeals.length)
    const selectedIndex = dayIndex % topCount
    
    return scoredMeals[selectedIndex]?.meal || null
  }

  /**
   * Generate complete day plan with exact portions - FIXED VERSION
   */
  generateDayPlan(availableMeals, dailyTargets, mealsPerDay = 4, dayIndex = 0) {
    console.log(`🎯 Generating day ${dayIndex + 1} plan with ${availableMeals.length} meals available`)
    
    // Calculate distribution per meal
    const distribution = this.calculateDailyDistribution(
      dailyTargets.kcal,
      dailyTargets,
      mealsPerDay
    )
    
    // Initialize day plan with empty arrays
    const dayPlan = {
      breakfast: null,
      lunch: null,
      dinner: null,
      snacks: [] // Always an array
    }
    
    // Find best meals for each slot - pass dayIndex for rotation
    dayPlan.breakfast = this.findBestMealMatch(availableMeals, distribution.breakfast, 'breakfast', dayIndex)
    dayPlan.lunch = this.findBestMealMatch(availableMeals, distribution.lunch, 'lunch', dayIndex)
    dayPlan.dinner = this.findBestMealMatch(availableMeals, distribution.dinner, 'dinner', dayIndex)
    
    // Add snacks if needed
    if (mealsPerDay > 3 && distribution.snack.kcal > 0) {
      const snackCount = mealsPerDay - 3
      const snackTargets = {
        kcal: Math.round(distribution.snack.kcal / snackCount),
        protein: Math.round(distribution.snack.protein / snackCount),
        carbs: Math.round(distribution.snack.carbs / snackCount),
        fat: Math.round(distribution.snack.fat / snackCount)
      }
      
      for (let i = 0; i < snackCount; i++) {
        const snack = this.findBestMealMatch(availableMeals, snackTargets, 'snack', dayIndex + i)
        if (snack) {
          dayPlan.snacks.push(snack)
        }
      }
    }
    
    // Calculate totals safely
    const totals = this.calculateDayTotals(dayPlan)
    
    // Return complete plan
    return {
      breakfast: dayPlan.breakfast,
      lunch: dayPlan.lunch,
      dinner: dayPlan.dinner,
      snacks: dayPlan.snacks, // Always an array
      totals: totals,
      accuracy: this.calculateAccuracy(totals, dailyTargets)
    }
  }

  /**
   * Calculate day totals - SAFE VERSION
   */
  calculateDayTotals(dayPlan) {
    let totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    
    // Add main meals safely
    if (dayPlan.breakfast && dayPlan.breakfast.macros) {
      totals.kcal += dayPlan.breakfast.macros.kcal || 0
      totals.protein += dayPlan.breakfast.macros.protein || 0
      totals.carbs += dayPlan.breakfast.macros.carbs || 0
      totals.fat += dayPlan.breakfast.macros.fat || 0
    }
    
    if (dayPlan.lunch && dayPlan.lunch.macros) {
      totals.kcal += dayPlan.lunch.macros.kcal || 0
      totals.protein += dayPlan.lunch.macros.protein || 0
      totals.carbs += dayPlan.lunch.macros.carbs || 0
      totals.fat += dayPlan.lunch.macros.fat || 0
    }
    
    if (dayPlan.dinner && dayPlan.dinner.macros) {
      totals.kcal += dayPlan.dinner.macros.kcal || 0
      totals.protein += dayPlan.dinner.macros.protein || 0
      totals.carbs += dayPlan.dinner.macros.carbs || 0
      totals.fat += dayPlan.dinner.macros.fat || 0
    }
    
    // Add snacks safely
    if (dayPlan.snacks && Array.isArray(dayPlan.snacks)) {
      dayPlan.snacks.forEach(snack => {
        if (snack && snack.macros) {
          totals.kcal += snack.macros.kcal || 0
          totals.protein += snack.macros.protein || 0
          totals.carbs += snack.macros.carbs || 0
          totals.fat += snack.macros.fat || 0
        }
      })
    }
    
    return totals
  }

  /**
   * Calculate accuracy percentage
   */
  calculateAccuracy(achieved, target) {
    const kcalAccuracy = 100 - Math.abs((achieved.kcal - target.kcal) / target.kcal * 100)
    const proteinAccuracy = 100 - Math.abs((achieved.protein - target.protein) / target.protein * 100)
    const carbsAccuracy = 100 - Math.abs((achieved.carbs - target.carbs) / target.carbs * 100)
    const fatAccuracy = 100 - Math.abs((achieved.fat - target.fat) / target.fat * 100)
    
    // Weighted average (protein most important)
    const totalAccuracy = (
      proteinAccuracy * 0.4 +
      kcalAccuracy * 0.3 +
      carbsAccuracy * 0.2 +
      fatAccuracy * 0.1
    )
    
    return {
      total: Math.max(0, Math.round(totalAccuracy)),
      kcal: Math.max(0, Math.round(kcalAccuracy)),
      protein: Math.max(0, Math.round(proteinAccuracy)),
      carbs: Math.max(0, Math.round(carbsAccuracy)),
      fat: Math.max(0, Math.round(fatAccuracy))
    }
  }

  /**
   * Adjust plan to perfectly hit targets (fine-tuning)
   */
  fineTunePlan(dayPlan, targets) {
    const currentTotals = this.calculateDayTotals(dayPlan)
    
    // If protein is too low, find highest protein meal and scale up
    if (currentTotals.protein < targets.protein * 0.95) {
      const meals = [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner].filter(m => m)
      const highestProteinMeal = meals.reduce((max, meal) => 
        meal.protein > max.protein ? meal : max
      )
      
      if (highestProteinMeal) {
        const proteinNeeded = targets.protein - currentTotals.protein
        const extraScale = 1 + (proteinNeeded / highestProteinMeal.protein)
        
        // Re-scale this meal
        Object.assign(highestProteinMeal, 
          this.calculatePortion(highestProteinMeal, {
            ...highestProteinMeal.macros,
            protein: highestProteinMeal.macros.protein * extraScale
          }, highestProteinMeal.category)
        )
      }
    }
    
    return dayPlan
  }
}

// Export singleton instance
export default new PortionCalculator()
