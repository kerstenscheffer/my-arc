// src/modules/meal-plan/MealPlanService.js
// 🍎 Service layer voor meal plan operations - FIXED VERSION WITH OVERRIDES

export default class MealPlanService {
  constructor(db) {
    this.db = db
  }

  // ===== MEAL PLAN DATA LOADING =====
  async loadMealPlanData(clientId) {
    try {
      console.log('📱 Loading meal plan data for client:', clientId)
      
      // Parallel loading voor betere performance
      const [
        plan,
        allMeals,
        customMeals,
        todayProgress,
        waterIntake,
        history,
        preferences
      ] = await Promise.all([
        this.db.getClientMealPlan(clientId),
        this.db.getAllMeals(),
        this.db.getCustomMeals(clientId),
        this.getTodayProgress(clientId),
        this.getTodayWaterIntake(clientId),
        this.db.getMealHistory(clientId, 30),
        this.db.getMealPreferences(clientId)
      ])

      // Get today's meals based on the plan
      const todayMeals = await this.getTodayMeals(clientId, plan)
      
      console.log('📊 Loaded data:', {
        hasPlan: !!plan,
        mealsCount: todayMeals.length,
        waterIntake: waterIntake,
        progressKeys: Object.keys(todayProgress || {}).length
      })

      return {
        plan,
        meals: todayMeals,
        allMeals: allMeals || [],
        customMeals: customMeals || [],
        todayProgress: todayProgress || {},
        waterIntake: waterIntake || 0.5,
        history: history || [],
        favorites: preferences?.favorite_meals || [],
        targets: plan?.targets || this.getDefaultTargets()
      }
    } catch (error) {
      console.error('❌ Error loading meal plan data:', error)
      // Return safe defaults on error
      return {
        plan: null,
        meals: [],
        allMeals: [],
        customMeals: [],
        todayProgress: {},
        waterIntake: 0.5,
        history: [],
        favorites: [],
        targets: this.getDefaultTargets()
      }
    }
  }

  // ===== TODAY'S MEALS WITH OVERRIDE SUPPORT =====
  async getTodayMeals(clientId, plan) {
    if (!plan?.week_structure) {
      console.log('No plan or week structure found')
      return []
    }
    
    try {
      const today = new Date()
      const startDate = plan.start_date ? new Date(plan.start_date) : new Date()
      const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) % 7
      
      console.log(`📅 Getting meals for day ${dayIndex}`)
      
      const todayStructure = plan.week_structure[dayIndex]
      if (!todayStructure?.meals) {
        console.log('No meals found for today')
        return []
      }
      
      // BELANGRIJKE FIX: Check voor meal overrides/swaps
      const overrides = await this.db.getClientMealOverrides(clientId, plan.id)
      console.log('🔍 Checking for meal overrides:', overrides ? 'Found' : 'None')
      
      // Process meals met overrides
      let mealsToLoad = [...todayStructure.meals]
      
      if (overrides && overrides[dayIndex] && overrides[dayIndex].meals) {
        console.log(`✅ Applying ${overrides[dayIndex].meals.length} meal swaps for day ${dayIndex}`)
        
        // Apply overrides
        mealsToLoad = todayStructure.meals.map((originalMeal) => {
          const override = overrides[dayIndex].meals.find(
            o => (o.slot === originalMeal.time_slot) || 
                 (o.time_slot === originalMeal.time_slot) ||
                 (o.slot === originalMeal.slot)
          )
          
          if (override && override.meal_id) {
            console.log(`🔄 Swapping meal: ${originalMeal.meal_id} → ${override.meal_id}`)
            return {
              ...originalMeal,
              meal_id: override.meal_id,
              is_swapped: true
            }
          }
          
          return originalMeal
        })
      }
      
      // Extract meal IDs
      const mealIds = mealsToLoad
        .map(m => m.meal_id)
        .filter(Boolean)
      
      if (mealIds.length === 0) {
        console.log('No meal IDs found')
        return []
      }
      
      // Fetch meal details
      const mealDetails = await this.db.getMealsByIds(mealIds)
      
      // Map and enrich meal data
      const enrichedMeals = mealsToLoad.map((slot, idx) => {
        const meal = mealDetails.find(m => m.id === slot.meal_id)
        if (!meal) return null
        
        return {
          ...meal,
          timeSlot: slot.time_slot || slot.slot || `Meal ${idx + 1}`,
          plannedTime: this.extractTimeFromSlot(slot.time_slot || slot.slot),
          targetKcal: slot.target_kcal || slot.targetKcal || meal.kcal,
          is_swapped: slot.is_swapped || false
        }
      }).filter(Boolean)
      
      console.log(`✅ Found ${enrichedMeals.length} meals for today (${enrichedMeals.filter(m => m.is_swapped).length} swapped)`)
      return enrichedMeals
    } catch (error) {
      console.error('❌ Error getting today meals:', error)
      return []
    }
  }

  // ===== TODAY'S PROGRESS =====
  async getTodayProgress(clientId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const progress = await this.db.getMealProgress(clientId, today)
      
      if (!progress) {
        console.log('No progress found for today')
        return {}
      }
      
      // Try to extract checked meals from notes (new format)
      if (progress.notes) {
        try {
          const notesData = typeof progress.notes === 'string' 
            ? JSON.parse(progress.notes) 
            : progress.notes
          
          if (notesData.checked_meals) {
            console.log('✅ Found checked meals in notes:', notesData.checked_meals)
            return notesData.checked_meals
          }
        } catch (e) {
          console.log('Could not parse notes data:', e)
        }
      }
      
      // Legacy support: check meals_checked field
      if (progress.meals_checked) {
        console.log('Using legacy meals_checked field')
        const checkedMeals = {}
        let mealsCheckedData = progress.meals_checked
        
        if (typeof mealsCheckedData === 'string') {
          try {
            mealsCheckedData = JSON.parse(mealsCheckedData)
          } catch (e) {
            console.error('Could not parse meals_checked:', e)
            return {}
          }
        }
        
        if (Array.isArray(mealsCheckedData)) {
          mealsCheckedData.forEach(check => {
            if (check.meal_index !== undefined) {
              checkedMeals[check.meal_index] = true
            }
          })
        }
        
        return checkedMeals
      }
      
      return {}
    } catch (error) {
      console.error('Error getting today progress:', error)
      return {}
    }
  }

  // ===== WATER INTAKE - MET UNIEKE NAMEN 2025 =====
  async getTodayWaterIntake(clientId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      console.log('📍 MealPlanService.getTodayWaterIntake calling getWaterTracking2025')
      
      // Check of de 2025 functie bestaat
      if (this.db.getWaterTracking2025) {
        const liters = await this.db.getWaterTracking2025(clientId, today)
        console.log('💧 MealPlanService got water:', liters, 'L')
        return liters
      } else {
        // Fallback naar oude functie
        console.log('⚠️ Using fallback getWaterIntake')
        const result = await this.db.getWaterIntake(clientId, today)
        
        if (typeof result === 'number') {
          return result
        }
        if (result && typeof result === 'object') {
          return result.amount_liters || result.amount || 0
        }
        return 0.5
      }
    } catch (error) {
      console.error('❌ MealPlanService.getTodayWaterIntake error:', error)
      return 0.5
    }
  }

  async updateWaterIntake(clientId, amount) {
    try {
      const today = new Date().toISOString().split('T')[0]
      console.log('📍 MealPlanService.updateWaterIntake calling saveWaterTracking2025')
      console.log(`💧 Saving ${amount}L for ${today}`)
      
      // Check of de 2025 functie bestaat
      if (this.db.saveWaterTracking2025) {
        const result = await this.db.saveWaterTracking2025(clientId, today, amount)
        
        if (result) {
          console.log('✅ MealPlanService.updateWaterIntake success')
          return result
        }
      } else {
        // Fallback naar oude functie
        console.log('⚠️ Using fallback saveWaterIntake')
        const result = await this.db.saveWaterIntake(clientId, today, amount)
        
        if (result) {
          console.log('✅ Water saved with fallback method')
          return result
        }
      }
      
      console.warn('⚠️ MealPlanService.updateWaterIntake returned null')
      return null
    } catch (error) {
      console.error('❌ MealPlanService.updateWaterIntake error:', error)
      return null
    }
  }

  // ===== SAVE MEAL PROGRESS =====
  async saveMealProgress(clientId, plan, meals, checkedMeals) {
    try {
      // Validation
      if (!clientId) {
        console.error('No client ID provided')
        return null
      }
      
      if (!meals || meals.length === 0) {
        console.log('No meals to save progress for')
        return null
      }
      
      const today = new Date().toISOString().split('T')[0]
      
      // Calculate totals only for checked meals
      let totalCalories = 0
      let totalProtein = 0
      let totalCarbs = 0
      let totalFat = 0
      let checkedCount = 0
      
      meals.forEach((meal, idx) => {
        if (checkedMeals[idx] && meal) {
          totalCalories += meal.kcal || 0
          totalProtein += meal.protein || 0
          totalCarbs += meal.carbs || 0
          totalFat += meal.fat || 0
          checkedCount++
        }
      })
      
      console.log(`📊 Saving progress: ${checkedCount} meals checked, ${totalCalories} kcal`)
      
      // Progress data with CORRECT column names for database
      const progressData = {
        date: today,
        meal_type: 'daily_summary',
        calories: Math.round(totalCalories),      // Column: calories (NOT total_calories)
        protein: Math.round(totalProtein),        // Column: protein (NOT total_protein)
        carbs: Math.round(totalCarbs),           // Column: carbs (NOT total_carbs)
        fat: Math.round(totalFat),               // Column: fat (NOT total_fat)
        notes: JSON.stringify({                  // Store metadata in notes as JSON
          checked_meals: checkedMeals,
          meal_count: checkedCount,
          total_meals: meals.length,
          plan_id: plan?.id || null,
          timestamp: new Date().toISOString()
        })
      }
      
      const result = await this.db.saveMealProgress(clientId, progressData)
      
      if (result) {
        console.log('✅ Meal progress saved successfully')
        return result
      } else {
        console.warn('Meal progress save returned null')
        return null
      }
    } catch (error) {
      console.error('❌ Error saving meal progress:', error.message || error)
      return null
    }
  }

  // ===== MEAL SWAP =====
  async swapMeal(clientId, plan, dayIndex, timeSlot, newMealId) {
    try {
      console.log(`🔄 Swapping meal for day ${dayIndex}, slot ${timeSlot} to meal ${newMealId}`)
      
      const result = await this.db.saveMealSwap(
        clientId, 
        plan.id, 
        dayIndex, 
        timeSlot, 
        newMealId
      )
      
      if (result) {
        console.log('✅ Meal swap saved')
      }
      
      return result
    } catch (error) {
      console.error('❌ Error swapping meal:', error)
      return false
    }
  }

  // ===== CUSTOM MEALS =====
  async saveCustomMeal(clientId, mealData) {
    try {
      const mealToSave = {
        ...mealData,
        created_by: clientId,
        client_specific: true,
        is_custom: true,
        created_at: new Date().toISOString()
      }
      
      console.log('💾 Saving custom meal:', mealToSave.name)
      const result = await this.db.saveCustomMeal(mealToSave)
      
      if (result) {
        console.log('✅ Custom meal saved')
        return result
      }
      
      return null
    } catch (error) {
      console.error('❌ Error saving custom meal:', error)
      throw error
    }
  }

  // ===== FAVORITES =====
  async toggleFavorite(clientId, mealId, currentFavorites = []) {
    try {
      const newFavorites = currentFavorites.includes(mealId)
        ? currentFavorites.filter(id => id !== mealId)
        : [...currentFavorites, mealId]
      
      console.log(`${newFavorites.includes(mealId) ? '⭐' : '☆'} Toggling favorite for meal ${mealId}`)
      
      const preferences = await this.db.getMealPreferences(clientId) || {}
      const result = await this.db.saveMealPreferences(clientId, {
        ...preferences,
        favorite_meals: newFavorites,
        updated_at: new Date().toISOString()
      })
      
      return result
    } catch (error) {
      console.error('❌ Error toggling favorite:', error)
      return null
    }
  }

  // ===== HELPER METHODS =====
  extractTimeFromSlot(slot) {
    if (!slot) return 12
    
    // Try to extract HH:MM format
    const match = slot.match(/(\d{1,2}):(\d{2})/)
    if (match) {
      return parseInt(match[1]) + parseInt(match[2]) / 60
    }
    
    // Fallback to meal type detection
    const slotLower = slot.toLowerCase()
    if (slotLower.includes('ontbijt') || slotLower.includes('breakfast')) return 8
    if (slotLower.includes('lunch')) return 13
    if (slotLower.includes('diner') || slotLower.includes('dinner')) return 19
    if (slotLower.includes('snack')) {
      if (slot.includes('1') || slotLower.includes('morning')) return 10.5
      if (slot.includes('2') || slotLower.includes('afternoon')) return 16
      return 15
    }
    
    return 12 // Default to noon
  }

  getDefaultTargets() {
    return {
      kcal: 2200,
      protein: 165,
      carbs: 220,
      fat: 73,
      water: 2.0 // 2 liters per day
    }
  }

  calculateProgress(meals, checkedMeals) {
    const totals = { 
      kcal: 0, 
      protein: 0, 
      carbs: 0, 
      fat: 0,
      checked: 0,
      total: meals.length
    }
    
    meals.forEach((meal, idx) => {
      if (checkedMeals[idx] && meal) {
        totals.kcal += meal.kcal || 0
        totals.protein += meal.protein || 0
        totals.carbs += meal.carbs || 0
        totals.fat += meal.fat || 0
        totals.checked++
      }
    })
    
    // Round values for display
    totals.kcal = Math.round(totals.kcal)
    totals.protein = Math.round(totals.protein)
    totals.carbs = Math.round(totals.carbs)
    totals.fat = Math.round(totals.fat)
    
    return totals
  }

  getNextMeal(meals, checkedMeals) {
    const currentHour = new Date().getHours() + new Date().getMinutes() / 60
    
    // First, find unchecked meals that are upcoming or current
    for (let i = 0; i < meals.length; i++) {
      if (!checkedMeals[i] && meals[i]) {
        // Give 1 hour grace period for "current" meal
        if (meals[i].plannedTime > currentHour - 1) {
          return { 
            ...meals[i], 
            index: i,
            isUpcoming: meals[i].plannedTime > currentHour
          }
        }
      }
    }
    
    // If no upcoming meals, find first unchecked meal
    for (let i = 0; i < meals.length; i++) {
      if (!checkedMeals[i] && meals[i]) {
        return { 
          ...meals[i], 
          index: i,
          isPast: true
        }
      }
    }
    
    // All meals checked
    return null
  }

  // ===== STATISTICS METHODS =====
  async getWeeklyStats(clientId) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      
      const history = await this.db.getMealProgressRange(
        clientId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      
      // Calculate averages
      const stats = {
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        daysTracked: history.length,
        completionRate: 0
      }
      
      if (history.length > 0) {
        const totals = history.reduce((acc, day) => ({
          calories: acc.calories + (day.calories || 0),
          protein: acc.protein + (day.protein || 0),
          carbs: acc.carbs + (day.carbs || 0),
          fat: acc.fat + (day.fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
        
        stats.avgCalories = Math.round(totals.calories / history.length)
        stats.avgProtein = Math.round(totals.protein / history.length)
        stats.avgCarbs = Math.round(totals.carbs / history.length)
        stats.avgFat = Math.round(totals.fat / history.length)
      }
      
      return stats
    } catch (error) {
      console.error('Error getting weekly stats:', error)
      return null
    }
  }
}
