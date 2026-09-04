import { preWorkoutVoorDag, PRE_WORKOUT_SLOT } from './utils/preWorkoutMeal'
// src/modules/meal-plan/AIMealPlanService.js
// Complete service layer voor AI Meal Dashboard - WATER TRACKING FIXED
export default class AIMealPlanService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
  }
  // ========================================
  // MAIN DASHBOARD DATA LOADING
  // ========================================
async loadAIDashboardData(clientId) {
  try {
    console.log('🚀 Loading AI dashboard data for client:', clientId)
    
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    const [
      activePlan,
      todayProgress,
      waterIntake,  
      todayMood,  
      favorites,
      customMeals,
      recentHistory
    ] = await Promise.all([
      this.getActiveAIPlan(clientId),
      this.getAIProgress(clientId, todayStr),
      this.getAIWaterIntake(clientId, todayStr),
      this.getAIMoodToday(clientId, todayStr),  
      this.getAIFavorites(clientId),
      this.getAICustomMeals(clientId),
      this.getAIRecentHistory(clientId, 7)
    ])
      
    // workout_schedule van de klant erbij: bepaalt of de pre-workout maaltijd
    // vandaag meedoet.
    const { data: klant } = await this.supabase
      .from('clients').select('workout_schedule').eq('id', clientId).maybeSingle()
    const todayMeals = await this.getTodayFromWeekStructure(activePlan, todayProgress, klant?.workout_schedule)
    const nextMeal = this.calculateNextMeal(todayMeals, todayProgress?.consumed_meals)
const dailyTotals = await this.calculateDailyTotals(clientId, todayMeals, todayProgress, activePlan)
    
    console.log('✅ AI Dashboard loaded:', {
      hasPlan: !!activePlan,
      mealsToday: todayMeals.length,
      waterIntake: waterIntake,
      mood: todayMood?.mood_score
    })
      
    return {
      activePlan,
      todayMeals,
      nextMeal,   
      todayProgress,
      dailyTotals,
      waterIntake,
      mood: todayMood,  // <-- HIER: 'mood' niet 'todayMood'
      favorites,
      customMeals,
      recentHistory,
      todayDate: todayStr,
      dayName: this.getDayName(today)
    } 
  } catch (error) {
    console.error('❌ Error loading AI dashboard:', error)
    return this.getEmptyDashboardData()
  }
}
  // ========================================
  // PLAN & MEALS
  // ========================================
  async getActiveAIPlan(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_meal_plans')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.log('No active plan found:', error.message)
      return null
    }
  }
  // `workoutSchedule` = clients.workout_schedule. Nodig om te bepalen of
  // vandaag een trainingsdag is, en dus of de pre-workout maaltijd meetelt.
  async getTodayFromWeekStructure(plan, todayProgress, workoutSchedule = null) {
    if (!plan?.week_structure) return []
    
    try {
      const today = new Date()
      const dayName = this.getDayName(today).toLowerCase()
      
      console.log('🔍 Extracting meals for:', dayName)
      
      const dayPlan = plan.week_structure[dayName]
      if (!dayPlan) {
        console.log('⚠️ No plan for day:', dayName)
        return []
      }
      
      // Helper function - defined inside scope
      const getMealData = async (mealRef) => {
        if (typeof mealRef === 'object' && mealRef.calories) {
          return mealRef
        }
        
        if (typeof mealRef === 'string') {
          return await this.getMealById(mealRef)
        }
        
        if (typeof mealRef === 'object' && mealRef.meal_id) {
          return await this.getMealById(mealRef.meal_id)
        }
        
        return null
      }
      
      const swaps = todayProgress?.consumed_meals || {}
      const meals = []

      // Haalt de coach-ingestelde klok-tijd en display-label op uit een slot-ref.
      // Slot-refs in week_structure kunnen een volledig meal-object zijn (met .calories)
      // of een referentie-object (met .meal_id). In beide gevallen zitten timing en
      // display_label op het slot-niveau en worden ze hier bewaard voordat getMealData
      // ze overschrijft met data uit de ai_meals tabel.
      const getSlotMeta = (slotRef) => ({
        timing: typeof slotRef === 'object' && slotRef !== null ? (slotRef.timing || null) : null,
        display_label: typeof slotRef === 'object' && slotRef !== null ? (slotRef.display_label || null) : null,
      })

      // Bouwt een meal-push-object met slot-metadata (timing + display_label) die
      // altijd wint van wat er eventueel in mealData zit.
      const buildMealEntry = (mealData, slotRef, slot, defaultTimeSlot, defaultPlannedTime, swapKey) => {
        const { timing, display_label } = getSlotMeta(slotRef)
        return {
          ...mealData,
          slot,
          display_label: display_label || mealData.display_label || null,
          timing: timing || (typeof mealData.timing === 'string' ? mealData.timing : null) || null,
          timeSlot: display_label || defaultTimeSlot,
          plannedTime: timing || defaultPlannedTime,
          isConsumed: swaps[swapKey]?.consumed || false,
          consumedAt: swaps[swapKey]?.time || null,
          meal_name: mealData.name || mealData.meal_name,
          meal_id: mealData.id || mealData.meal_id,
        }
      }

      // Process breakfast
      if (dayPlan.breakfast) {
        const swapData = swaps.breakfast
        const mealData = swapData?.was_swapped
          ? (swapData.edited_meal || await this.getMealById(swapData.meal_id))
          : await getMealData(dayPlan.breakfast)

        if (mealData) {
          meals.push(buildMealEntry(mealData, dayPlan.breakfast, 'breakfast', this.formatSlotName('breakfast'), this.getPlannedTime('breakfast'), 'breakfast'))
        }
      }

      // Process lunch
      if (dayPlan.lunch) {
        const swapData = swaps.lunch
        const mealData = swapData?.was_swapped
          ? (swapData.edited_meal || await this.getMealById(swapData.meal_id))
          : await getMealData(dayPlan.lunch)

        if (mealData) {
          meals.push(buildMealEntry(mealData, dayPlan.lunch, 'lunch', this.formatSlotName('lunch'), this.getPlannedTime('lunch'), 'lunch'))
        }
      }

      // Process dinner
      if (dayPlan.dinner) {
        const swapData = swaps.dinner
        const mealData = swapData?.was_swapped
          ? (swapData.edited_meal || await this.getMealById(swapData.meal_id))
          : await getMealData(dayPlan.dinner)

        if (mealData) {
          meals.push(buildMealEntry(mealData, dayPlan.dinner, 'dinner', this.formatSlotName('dinner'), this.getPlannedTime('dinner'), 'dinner'))
        }
      }

      // Process snacks array
      if (dayPlan.snacks && Array.isArray(dayPlan.snacks)) {
        for (let idx = 0; idx < dayPlan.snacks.length; idx++) {
          const snack = dayPlan.snacks[idx]
          const slotName = `snack${idx + 1}`
          const swapData = swaps[slotName]

          const mealData = swapData?.was_swapped
            ? (swapData.edited_meal || await this.getMealById(swapData.meal_id))
            : await getMealData(snack)

          if (mealData) {
            meals.push(buildMealEntry(mealData, snack, slotName, `Snack ${idx + 1}`, this.getPlannedTime(slotName), slotName))
          }
        }
      }

      // Check direct snack properties
      if (dayPlan.snack1) {
        const swapData = swaps.snack1
        const mealData = swapData?.was_swapped
          ? (swapData.edited_meal || await this.getMealById(swapData.meal_id))
          : await getMealData(dayPlan.snack1)

        if (mealData) {
          meals.push(buildMealEntry(mealData, dayPlan.snack1, 'snack1', this.formatSlotName('snack1'), this.getPlannedTime('snack1'), 'snack1'))
        }
      }

      if (dayPlan.snack2) {
        const swapData = swaps.snack2
        const mealData = swapData?.was_swapped
          ? (swapData.edited_meal || await this.getMealById(swapData.meal_id))
          : await getMealData(dayPlan.snack2)

        if (mealData) {
          meals.push(buildMealEntry(mealData, dayPlan.snack2, 'snack2', this.formatSlotName('snack2'), this.getPlannedTime('snack2'), 'snack2'))
        }
      }
      
      console.log('✅ Extracted meals:', meals.length, meals.map(m => ({
        slot: m.slot,
        name: m.meal_name || m.name,
        calories: m.calories,
        protein: m.protein
      })))
      
      // ── Pre-workout maaltijd ──
      // Eén maaltijd op planniveau die alleen op trainingsdagen meedoet. Hij
      // staat niet in week_structure, dus de blokken hierboven zien 'm niet.
      // Meetellen hier is belangrijk: anders zou de klant de maaltijd wél op
      // z'n scherm zien maar zouden de dagtotalen er niet bij kloppen.
      const preWorkout = preWorkoutVoorDag(plan, workoutSchedule, dayName, dayPlan)
      if (preWorkout) {
        meals.push(buildMealEntry(
          preWorkout, preWorkout, PRE_WORKOUT_SLOT,
          preWorkout.display_label || 'Pre-workout',
          preWorkout.timing || '15:30',
          PRE_WORKOUT_SLOT,
        ))
      }

      return meals
    } catch (error) {
      console.error('Error extracting today meals:', error)
      return []
    }
  }
  async getMealById(mealId) {
    try {
      // Clean all possible suffixes
      const cleanId = String(mealId)
        .replace('_small', '')
        .replace('_large', '')
        .replace('_xl', '')
        .replace('_medium', '')
      
      // Try ai_meals table
      const { data: aiMeal, error: aiError } = await this.supabase
        .from('ai_meals')
        .select('*')
        .eq('id', cleanId)
        .single()
      
      if (aiMeal && !aiError) {
        console.log('✅ Found meal:', aiMeal.name, 'Calories:', aiMeal.calories)
        return aiMeal
      }
      
      // Try custom meals table
      const { data: customMeal, error: customError } = await this.supabase
        .from('ai_custom_meals')
        .select('*')
        .eq('id', cleanId)
        .single()
      
      if (customMeal && !customError) {
        console.log('✅ Found custom meal:', customMeal.name)
        return customMeal
      }
      
      console.warn('⚠️ Meal not found:', mealId)
      return null
    } catch (error) {
      console.error('Error fetching meal:', error)
      return null
    }
  }
  // ========================================
  // PROGRESS TRACKING - FIXED INTEGER ISSUES
  // ========================================
  async getAIProgress(clientId, date) {
    try {
      const { data, error } = await this.supabase
        .from('ai_meal_progress')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', date)
        .maybeSingle()
      
      if (error) {
        console.error('Error getting AI progress:', error)
        return this.createEmptyProgress(clientId, date)
      }
      
      return data || this.createEmptyProgress(clientId, date)
    } catch (error) {
      console.error('Error getting AI progress:', error)
      return this.createEmptyProgress(clientId, date)
    }
  }
  async checkAIMeal(clientId, planId, slot, mealData) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      let progress = await this.getAIProgress(clientId, today)
      
      if (!progress.consumed_meals) progress.consumed_meals = {}
      
      // CRITICAL FIX: Round all numeric values to integers
      progress.consumed_meals[slot] = {
        consumed: true,
        meal_id: mealData.meal_id || mealData.id,
        meal_name: mealData.meal_name || mealData.name,
        time: new Date().toTimeString().split(' ')[0],
        calories: Math.round(mealData.calories || 0),  // ROUNDED
        protein: Math.round(mealData.protein || 0),    // ROUNDED
        carbs: Math.round(mealData.carbs || 0),        // ROUNDED
        fat: Math.round(mealData.fat || 0)             // ROUNDED
      }
      
      // Recalculate totals - ALL ROUNDED
      progress.total_calories = 0
      progress.total_protein = 0
      progress.total_carbs = 0
      progress.total_fat = 0
      progress.meals_consumed = 0
      
      Object.values(progress.consumed_meals).forEach(meal => {
        if (meal.consumed) {
          progress.total_calories += Math.round(meal.calories || 0)
          progress.total_protein += Math.round(meal.protein || 0)
          progress.total_carbs += Math.round(meal.carbs || 0)
          progress.total_fat += Math.round(meal.fat || 0)
          progress.meals_consumed++
        }
      })
      
      // Round final totals
      progress.total_calories = Math.round(progress.total_calories)
      progress.total_protein = Math.round(progress.total_protein)
      progress.total_carbs = Math.round(progress.total_carbs)
      progress.total_fat = Math.round(progress.total_fat)
      
      const { data, error } = await this.supabase
        .from('ai_meal_progress')
        .upsert({
          ...progress,
          client_id: clientId,
          plan_id: planId,
          date: today,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      await this.logToAIHistory(clientId, slot, mealData)
      
      console.log('✅ Meal checked successfully:', slot)
      return data
    } catch (error) {
      console.error('Error checking AI meal:', error)
      return null
    }
  }
  async uncheckAIMeal(clientId, planId, slot) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      let progress = await this.getAIProgress(clientId, today)
      
      if (!progress.consumed_meals) progress.consumed_meals = {}
      
      // Remove the meal from consumed
      if (progress.consumed_meals[slot]) {
        const removedMeal = progress.consumed_meals[slot]
        progress.consumed_meals[slot] = {
          ...removedMeal,
          consumed: false,
          time: null
        }
        
        // Recalculate totals - ALL ROUNDED
        progress.total_calories = 0
        progress.total_protein = 0
        progress.total_carbs = 0
        progress.total_fat = 0
        progress.meals_consumed = 0
        
        Object.values(progress.consumed_meals).forEach(meal => {
          if (meal.consumed) {
            progress.total_calories += Math.round(meal.calories || 0)
            progress.total_protein += Math.round(meal.protein || 0)
            progress.total_carbs += Math.round(meal.carbs || 0)
            progress.total_fat += Math.round(meal.fat || 0)
            progress.meals_consumed++
          }
        })
        
        // Round final totals
        progress.total_calories = Math.round(progress.total_calories)
        progress.total_protein = Math.round(progress.total_protein)
        progress.total_carbs = Math.round(progress.total_carbs)
        progress.total_fat = Math.round(progress.total_fat)
      }
      
      const { data, error } = await this.supabase
        .from('ai_meal_progress')
        .upsert({
          ...progress,
          client_id: clientId,
          plan_id: planId,
          date: today,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Meal unchecked successfully:', slot)
      return data
    } catch (error) {
      console.error('Error unchecking AI meal:', error)
      return null
    }
  }
  async logManualIntake(clientId, planId, intakeData) {
    try {
      const today = new Date().toISOString().split('T')[0]
      let progress = await this.getAIProgress(clientId, today)
      
      // ROUND all manual intake values
      progress.manual_intake = {
        type: intakeData.type,
        percentage: intakeData.percentage,
        calories: Math.round(intakeData.calories || 0),  // ROUNDED
        protein: Math.round(intakeData.protein || 0),    // ROUNDED
        logged_at: new Date().toTimeString().split(' ')[0]
      }
      
      // Update totals based on intake type
      if (intakeData.type === 'percentage') {
        // For percentage, override totals with percentage of targets
        progress.total_calories = Math.round(intakeData.calories || 0)
        progress.total_protein = Math.round(intakeData.protein || 0)
        progress.total_carbs = Math.round(intakeData.carbs || 0)
        progress.total_fat = Math.round(intakeData.fat || 0)
        
        // Mark meals as consumed based on percentage
        if (intakeData.percentage >= 100) {
          progress.completion_percentage = 100
          progress.meals_consumed = progress.meals_planned || 5
        } else {
          progress.completion_percentage = intakeData.percentage
          progress.meals_consumed = Math.floor((progress.meals_planned || 5) * (intakeData.percentage / 100))
        }
      } else if (intakeData.type === 'exact') {
        // For exact values, just set the totals
        progress.total_calories = Math.round(intakeData.calories || 0)
        progress.total_protein = Math.round(intakeData.protein || 0)
        progress.total_carbs = Math.round(intakeData.carbs || 0)
        progress.total_fat = Math.round(intakeData.fat || 0)
      }
      
      const { data, error } = await this.supabase
        .from('ai_meal_progress')
        .upsert({
          ...progress,
          client_id: clientId,
          plan_id: planId,
          date: today,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Manual intake logged:', intakeData.type, intakeData.percentage || 'exact')
      return data
    } catch (error) {
      console.error('Error logging manual intake:', error)
      return null
    }
  }
// ========================================
// WATER TRACKING - DEFINITIEVE WERKENDE VERSIE
// ========================================
async getAIWaterIntake(clientId, date) {
  try {
    console.log('💧 Getting water for client:', clientId, 'date:', date)
    
    // PRIMAIR: water_tracking tabel (heeft data!)
    const { data: waterData, error: waterError } = await this.supabase
      .from('water_tracking')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .maybeSingle()
    
    if (waterData && !waterError) {
      // Gebruik amount_liters (CORRECTE kolom naam!)
      const milliliters = Math.round((waterData.amount_liters || 0) * 1000)
      console.log('✅ Found water in water_tracking:', milliliters, 'ml')
      return milliliters
    }
    
    // FALLBACK: ai_water_tracking tabel
    const { data: aiData, error: aiError } = await this.supabase
      .from('ai_water_tracking')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .maybeSingle()
    
    if (aiData && !aiError) {
      console.log('✅ Found water in ai_water_tracking:', aiData.milliliters, 'ml')
      return aiData.milliliters || 0
    }
    
    console.log('📭 No water data found, returning 0')
    return 0
    
  } catch (error) {
    console.error('❌ Error getting water intake:', error)
    return 0
  }
}
async updateAIWaterIntake(clientId, milliliters) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const roundedMilliliters = Math.round(milliliters)
    const liters = roundedMilliliters / 1000
    
    console.log('💧 Updating water:', roundedMilliliters, 'ml =', liters, 'L')
    
    // STRATEGIE: UPSERT naar water_tracking (handles duplicate constraint)
    const { data, error } = await this.supabase
      .from('water_tracking')
      .upsert({
        client_id: clientId,
        date: today,
        amount_liters: liters,  // CORRECTE KOLOM NAAM!
        target_liters: 2.0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,date',  // Handle UNIQUE constraint
        ignoreDuplicates: false  // Force update bij conflict
      })
      .select()
      .single()
    
    if (data && !error) {
      console.log('✅ Water updated successfully:', liters, 'L')
      return { milliliters: roundedMilliliters }
    }
    
    if (error) {
      console.error('⚠️ Water update error:', error.message)
      
      // FALLBACK: Probeer ai_water_tracking
      const { data: aiData, error: aiError } = await this.supabase
        .from('ai_water_tracking')
        .upsert({
          client_id: clientId,
          date: today,
          milliliters: roundedMilliliters,
          glasses: Math.floor(roundedMilliliters / 200),
          target_milliliters: 2000,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,date',
          ignoreDuplicates: false
        })
        .select()
        .single()
      
      if (aiData && !aiError) {
        console.log('✅ Water saved to ai_water_tracking')
        return { milliliters: roundedMilliliters }
      }
    }
    
    // Return waarde voor UI zelfs bij error
    console.log('⚠️ Database update failed but returning value for UI')
    return { milliliters: roundedMilliliters }
    
  } catch (error) {
    console.error('❌ Fatal error updating water:', error)
    // ALTIJD een waarde returnen voor UI
    return { milliliters: Math.round(milliliters) }
  }
}
  // ========================================
  // MOOD TRACKING
  // ========================================
  async getAIMoodToday(clientId, date) {
    try {
      const { data, error } = await this.supabase
        .from('ai_mood_logs')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', date)
        .maybeSingle()
      
      if (error) {
        console.error('Error getting mood:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error getting mood:', error)
      return null
    }
  }
// Fix voor logAIMood method in AIMealPlanService.js
// Vervang de bestaande logAIMood method met deze:
// Fix voor logAIMood in AIMealPlanService.js
// Vervang de hele logAIMood method met deze:
async logAIMood(clientId, moodData) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // First check if mood exists for today
    const { data: existingMood } = await this.supabase
      .from('ai_mood_logs')
      .select('id')
      .eq('client_id', clientId)
      .eq('date', today)
      .maybeSingle()
    
    let result
    
    if (existingMood) {
      // UPDATE existing mood - GEEN updated_at kolom!
      const { data, error } = await this.supabase
        .from('ai_mood_logs')
        .update({
          mood_score: moodData.score,
          mood_reason: moodData.reason || null,
          energy_level: moodData.energy || null,
          logged_at: new Date().toTimeString().split(' ')[0]
        })
        .eq('id', existingMood.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // INSERT new mood
      const { data, error } = await this.supabase
        .from('ai_mood_logs')
        .insert({
          client_id: clientId,
          date: today,
          mood_score: moodData.score,
          mood_reason: moodData.reason || null,
          energy_level: moodData.energy || null,
          logged_at: new Date().toTimeString().split(' ')[0],
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      result = data
    }
    
    console.log('✅ Mood saved successfully:', result)
    return result
  } catch (error) {
    console.error('Error logging mood:', error)
    return null
  }
}
  // ========================================
  // ALTERNATIVES & SWAPS - COMPLETELY FIXED
  // ========================================
  async getSmartAlternatives(currentMeal, timeSlot) {
    try {
      console.log('🔍 Getting alternatives for:', currentMeal.meal_name || currentMeal.name)
      
      // Get time category
      const timeCategory = this.getTimeCategory(timeSlot || currentMeal.slot)
      
      // Get current meal details
      const mealId = currentMeal.meal_id || currentMeal.id
      const currentMealData = await this.getMealById(mealId)
      const labels = currentMealData?.labels || []
      
      // Simple query without problematic operators
      let query = this.supabase
        .from('ai_meals')
        .select('*')
        .limit(50)
      
      // Add timing filter if available
      if (timeCategory) {
        query = query.contains('timing', [timeCategory])
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Query error:', error)
        // Fallback: get any meals
        const { data: fallbackData } = await this.supabase
          .from('ai_meals')
          .select('*')
          .limit(20)
        
        return fallbackData || []
      }
      
      // Filter and score meals manually
      let alternatives = data || []
      
      // Calculate match scores if we have labels
      if (labels.length > 0) {
        alternatives = alternatives.map(meal => {
          const mealLabels = meal.labels || []
          let matchScore = 0
          
          // Count matching labels
          if (Array.isArray(mealLabels) && Array.isArray(labels)) {
            labels.forEach(label => {
              if (mealLabels.includes(label)) {
                matchScore++
              }
            })
          }
          
          return { ...meal, matchScore }
        })
        
        // Sort by match score
        alternatives.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      }
      
      // Return top 20
      return alternatives.slice(0, 20)
      
    } catch (error) {
      console.error('Error getting alternatives:', error)
      return []
    }
  }
  async swapAIMeal(clientId, planId, day, slot, newMealId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get new meal data
      const newMeal = await this.getMealById(newMealId)
      if (!newMeal) {
        throw new Error('New meal not found')
      }
      
      // Insert swap record with ROUNDED calories
      const { data: swapData, error: swapError } = await this.supabase
        .from('ai_meal_swaps')
        .insert({
          client_id: clientId,
          plan_id: planId,
          swap_date: today,
          day_name: day || this.getDayName(new Date()),
          meal_slot: slot,
          new_meal_id: newMealId,
          new_meal_name: newMeal.name || newMeal.meal_name,
          swap_reason: 'manual',
          new_calories: Math.round(newMeal.calories || 0), // CRITICAL: Round to integer!
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (swapError) {
        console.error('Swap insert error:', swapError)
        throw swapError
      }
      
      // Update progress
      let progress = await this.getAIProgress(clientId, today)
      if (!progress.consumed_meals) progress.consumed_meals = {}
      
      progress.consumed_meals[slot] = {
        ...progress.consumed_meals[slot],
        // Een swap overschrijft een eerdere "eenmalig vandaag"-bewerking op dit
        // slot. Zonder dit blijft edited_meal hangen en geeft getTodayFromWeek-
        // Structure die voorrang → de swap is dan onzichtbaar.
        edited_meal: null,
        was_swapped: true,
        meal_id: newMealId,
        meal_name: newMeal.name || newMeal.meal_name,
        calories: Math.round(newMeal.calories || 0),  // ROUNDED
        protein: Math.round(newMeal.protein || 0),    // ROUNDED
        carbs: Math.round(newMeal.carbs || 0),        // ROUNDED
        fat: Math.round(newMeal.fat || 0)             // ROUNDED
      }
      
      const { error: progressError } = await this.supabase
        .from('ai_meal_progress')
        .upsert({
          ...progress,
          client_id: clientId,
          date: today,
          updated_at: new Date().toISOString()
        })
      
      if (progressError) {
        console.error('Progress update error:', progressError)
      }
      
      // ── De wissel vastleggen in het weekplan, bij DEZE ene dag ──
      //
      // Hierboven ging de wissel alleen naar ai_meal_progress van vandaag,
      // met het slot als sleutel. Gevolg: de dag-tijdlijn (die rechtstreeks
      // uit week_structure leest) zag de wissel helemaal niet, en morgen was
      // hij weg. Bij een plan waarin elke dag dezelfde maaltijd staat — zoals
      // bij Luc, zeven keer dezelfde lunch — voelt dat als "de hele week
      // wisselt mee".
      //
      // We schrijven precies één sleutel: week_structure[dag][slot]. Andere
      // dagen worden niet aangeraakt, ook niet als daar dezelfde maaltijd
      // staat.
      await this.swapMealInWeekStructure(planId, day, slot, newMeal)

      console.log('✅ Meal swapped successfully')
      return swapData

    } catch (error) {
      console.error('Error swapping meal:', error)
      return null
    }
  }

  /**
   * Zet één maaltijd in het weekplan, op één dag.
   *
   * Leest het plan opnieuw en schrijft alleen de betreffende dag terug. Niet
   * de hele week_structure die we toevallig in het geheugen hadden: dan zou
   * een wissel een gelijktijdige aanpassing van de coach kunnen overschrijven.
   *
   * De slot-vorm blijft zoals hij was. Stond er een object met een eigen tijd
   * of een eigen titel, dan houden we die — anders zou de maaltijd na het
   * wisselen op de standaardtijd springen.
   */
  async swapMealInWeekStructure(planId, day, slot, newMeal) {
    if (!planId || !day || !slot || !newMeal?.id) return false
    try {
      const { data: plan, error: leesFout } = await this.supabase
        .from('client_meal_plans')
        .select('week_structure')
        .eq('id', planId)
        .single()
      if (leesFout) throw leesFout

      const week = plan?.week_structure
      if (!week || !week[day]) {
        console.warn('Wissel niet in weekplan gezet: dag ontbreekt', day)
        return false
      }

      const oud = week[day][slot]
      const oudObject = (oud && typeof oud === 'object') ? oud : {}

      // Een slot is geen verwijzing maar een volledige momentopname van de
      // maaltijd: foto, bereidingsstappen, ingredienten, labels, allergenen.
      // Daarom bouwen we het slot op uit de NIEUWE maaltijd. Zou je alleen
      // naam en macro's overschrijven op het oude object, dan hield de klant
      // de foto en het recept van het gerecht dat hij net had weggewisseld.
      //
      // Twee dingen komen wel van het oude slot, want die horen bij het slot
      // en niet bij de maaltijd: de kloktijd die de coach heeft gezet en de
      // eigen titel (bv. "Pre Workout Meal").
      const nieuweSlot = {
        ...newMeal,
        meal_id: newMeal.id,
        meal_name: newMeal.name || newMeal.meal_name,
        timing: oudObject.timing || null,
        display_label: oudObject.display_label || null,
      }

      // De original_*-velden en fitScore horen bij de porties van de vorige
      // maaltijd. Laten staan zou de portie-schaler op oude getallen laten
      // rekenen; ze horen bij de nieuwe maaltijd opnieuw te ontstaan.
      delete nieuweSlot.original_calories
      delete nieuweSlot.original_protein
      delete nieuweSlot.original_carbs
      delete nieuweSlot.original_fat
      delete nieuweSlot.fitScore

      const nieuweWeek = { ...week, [day]: { ...week[day], [slot]: nieuweSlot } }

      const { error: schrijfFout } = await this.supabase
        .from('client_meal_plans')
        .update({ week_structure: nieuweWeek })
        .eq('id', planId)
      if (schrijfFout) throw schrijfFout
      return true
    } catch (e) {
      console.error('Wissel in weekplan opslaan mislukt:', e)
      return false
    }
  }

  // Sla een door de client BEWERKTE maaltijd alleen voor VANDAAG op (scope
  // "eenmalig deze meal"). Het weekplan blijft ongewijzigd; de bewerkte
  // snapshot komt in ai_meal_progress.consumed_meals[slot].edited_meal en
  // wordt door getTodayFromWeekStructure boven het plan getoond.
  async overrideMealForToday(clientId, slot, editedMeal) {
    try {
      const today = new Date().toISOString().split('T')[0]
      let progress = await this.getAIProgress(clientId, today)
      if (!progress.consumed_meals) progress.consumed_meals = {}
      progress.consumed_meals[slot] = {
        ...progress.consumed_meals[slot], // bewaar consumed/time als de meal al afgevinkt was
        was_swapped: true,
        edited_meal: editedMeal,
        meal_id: editedMeal.meal_id || editedMeal.id,
        meal_name: editedMeal.name || editedMeal.meal_name,
        calories: Math.round(editedMeal.calories || 0),
        protein: Math.round(editedMeal.protein || 0),
        carbs: Math.round(editedMeal.carbs || 0),
        fat: Math.round(editedMeal.fat || 0)
      }
      const { error } = await this.supabase
        .from('ai_meal_progress')
        .upsert({ ...progress, client_id: clientId, date: today, updated_at: new Date().toISOString() })
      if (error) throw error
      console.log('✅ Meal override for today saved')
      return true
    } catch (error) {
      console.error('❌ overrideMealForToday failed:', error)
      throw error
    }
  }
  // ========================================
  // FAVORITES
  // ========================================
  async getAIFavorites(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('ai_meal_favorites')
        .select('*')
        .eq('client_id', clientId)
        .order('added_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting favorites:', error)
      return []
    }
  }
  async toggleAIFavorite(clientId, mealId, mealData) {
    try {
      const { data: existing } = await this.supabase
        .from('ai_meal_favorites')
        .select('id')
        .eq('client_id', clientId)
        .eq('meal_id', mealId)
        .single()
      
      if (existing) {
        const { error } = await this.supabase
          .from('ai_meal_favorites')
          .delete()
          .eq('id', existing.id)
        
        if (error) throw error
        return { action: 'removed' }
      } else {
        const { data, error } = await this.supabase
          .from('ai_meal_favorites')
          .insert({
            client_id: clientId,
            meal_id: mealId,
            meal_name: mealData.name,
            category: this.getTimeCategory(mealData.timing?.[0]),
            calories: Math.round(mealData.calories || 0),  // ROUNDED
            protein: Math.round(mealData.protein || 0),    // ROUNDED
            added_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) throw error
        return { action: 'added', data }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      return null
    }
  }
  // ========================================
  // CUSTOM MEALS
  // ========================================
  async getAICustomMeals(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('ai_custom_meals')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting custom meals:', error)
      return []
    }
  }
  async saveAICustomMeal(clientId, mealData) {
    try {
      const { data, error } = await this.supabase
        .from('ai_custom_meals')
        .insert({
          client_id: clientId,
          name: mealData.name,
          calories: Math.round(mealData.calories || 0),  // ROUNDED
          protein: Math.round(mealData.protein || 0),    // ROUNDED
          carbs: Math.round(mealData.carbs || 0),        // ROUNDED
          fat: Math.round(mealData.fat || 0),            // ROUNDED
          fiber: Math.round(mealData.fiber || 0),        // ROUNDED
          ingredients_list: mealData.ingredients || null,
          preparation_steps: mealData.steps || null,
          meal_type: mealData.meal_type || ['custom'],
          tips: mealData.tips || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving custom meal:', error)
      return null
    }
  }
  // ========================================
  // HISTORY
  // ========================================
  async getAIRecentHistory(clientId, days = 7) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await this.supabase
        .from('ai_meal_history')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .order('time', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting history:', error)
      return []
    }
  }
  async logToAIHistory(clientId, slot, mealData) {
    try {
      const now = new Date()
      
      const { data, error } = await this.supabase
        .from('ai_meal_history')
        .insert({
          client_id: clientId,
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0],
          meal_slot: slot,
          meal_id: mealData.meal_id || mealData.id,
          meal_name: mealData.name || mealData.meal_name,
          calories: Math.round(mealData.calories || 0),  // ROUNDED
          protein: Math.round(mealData.protein || 0),    // ROUNDED
          carbs: Math.round(mealData.carbs || 0),        // ROUNDED
          fat: Math.round(mealData.fat || 0),            // ROUNDED
          fiber: Math.round(mealData.fiber || 0),        // ROUNDED
          consumed_at: now.toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error logging to history:', error)
      return null
    }
  }
  // ========================================
  // HELPER METHODS
  // ========================================
  getDayName(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }
  getTimeCategory(timeSlot) {
    if (!timeSlot) return null
    const slot = String(timeSlot).toLowerCase()
    
    if (slot.includes('breakfast') || slot.includes('ontbijt')) return 'breakfast'
    if (slot.includes('lunch')) return 'lunch'
    if (slot.includes('dinner') || slot.includes('diner')) return 'dinner'
    if (slot.includes('snack')) return 'snack'
    
    const hour = new Date().getHours()
    if (hour < 10) return 'breakfast'
    if (hour < 14) return 'lunch'
    if (hour < 18) return 'snack'
    return 'dinner'
  }
  getPlannedTime(slot) {
    const times = {
      breakfast: 8,
      lunch: 12.5,
      dinner: 18.5,
      snack1: 10.5,
      snack2: 15.5
    }
    return times[slot] || 12
  }
  formatSlotName(slot) {
    const names = {
      breakfast: 'Ontbijt',
      lunch: 'Lunch',
      dinner: 'Diner',
      snack1: 'Snack 1',
      snack2: 'Snack 2'
    }
    return names[slot] || slot
  }
  calculateNextMeal(meals, consumedMeals) {
    if (!meals || meals.length === 0) return null
    
    const currentHour = new Date().getHours() + new Date().getMinutes() / 60
    
    // First check for upcoming non-consumed meals
    for (const meal of meals) {
      if (!consumedMeals?.[meal.slot]?.consumed) {
        if (meal.plannedTime > currentHour - 1) {
          return {
            ...meal,
            isUpcoming: meal.plannedTime > currentHour,
            timeUntil: meal.plannedTime - currentHour
          }
        }
      }
    }
    
    // Then check for any non-consumed meals (past due)
    for (const meal of meals) {
      if (!consumedMeals?.[meal.slot]?.consumed) {
        return {
          ...meal,
          isPast: true
        }
      }
    }
    
    return null
  }
  




















async calculateDailyTotals(clientId, meals, progress, activePlan) {
  const targets = {
    calories: activePlan?.daily_calories || 2200,
    protein: activePlan?.daily_protein || 165,
    carbs: activePlan?.daily_carbs || 220,
    fat: activePlan?.daily_fat || 73
  }
  
  let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 }
  let sourceType = 'none'
  
  try {
    const today = new Date().toISOString().split('T')[0]
    console.log('🔍 [calculateDailyTotals] Today:', today)
    
    let quickIntakeTime = null
    if (progress?.manual_intake?.logged_at) {
      const [hours, minutes, seconds] = progress.manual_intake.logged_at.split(':')
      quickIntakeTime = new Date()
      quickIntakeTime.setHours(hours, minutes, seconds, 0)
      console.log('🕐 Quick Intake exists')
      console.log('🕐 Quick Intake logged_at string:', progress.manual_intake.logged_at)
      console.log('🕐 Quick Intake time object:', quickIntakeTime.toISOString())
    } else {
      console.log('⚠️ No Quick Intake found')
    }
    
    const startOfToday = new Date(today)
    startOfToday.setHours(0, 0, 0, 0)
    
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)
    
    console.log('🔍 Querying consumed_meals for client:', clientId)
    console.log('🔍 Date range:', startOfToday.toISOString(), 'to', endOfToday.toISOString())
    
    const { data: loggedMeals, error } = await this.supabase
      .from('consumed_meals')
      .select('calories, protein, carbs, fat, consumed_at')
      .eq('client_id', clientId)
      .gte('consumed_at', startOfToday.toISOString())
      .lte('consumed_at', endOfToday.toISOString())
      .order('consumed_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching logged meals:', error)
      throw error
    }
    
    console.log('📊 Query result - Logged meals found:', loggedMeals?.length || 0)
    
    let latestMealTime = null
    if (loggedMeals && loggedMeals.length > 0) {
      latestMealTime = new Date(loggedMeals[0].consumed_at)
      console.log('🕐 Latest meal exists')
      console.log('🕐 Latest meal consumed_at string:', loggedMeals[0].consumed_at)
      console.log('🕐 Latest meal time object:', latestMealTime.toISOString())
      console.log('📋 All logged meals:', loggedMeals.map(m => ({
        consumed_at: m.consumed_at,
        calories: m.calories,
        protein: m.protein
      })))
    } else {
      console.log('⚠️ No logged meals found')
    }
    
    console.log('⚖️ === DECISION TIME ===')
    console.log('Quick Intake exists?', !!quickIntakeTime)
    console.log('Logged Meals exist?', !!latestMealTime)
    
    if (quickIntakeTime && latestMealTime) {
      console.log('🔍 Both exist - comparing timestamps...')
      console.log('Quick Intake:', quickIntakeTime.getTime())
      console.log('Latest Meal:', latestMealTime.getTime())
      console.log('Difference (ms):', latestMealTime.getTime() - quickIntakeTime.getTime())
      
      if (quickIntakeTime > latestMealTime) {
        consumed = {
          calories: Math.round(progress.manual_intake.calories || 0),
          protein: Math.round(progress.manual_intake.protein || 0),
          carbs: Math.round(progress.manual_intake.carbs || 0),
          fat: Math.round(progress.manual_intake.fat || 0)
        }
        sourceType = 'quick_intake'
        console.log('✅ Using Quick Intake (most recent):', consumed)
      } else {
        consumed = loggedMeals.reduce((sum, meal) => ({
          calories: sum.calories + (meal.calories || 0),
          protein: sum.protein + (meal.protein || 0),
          carbs: sum.carbs + (meal.carbs || 0),
          fat: sum.fat + (meal.fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
        
        consumed.calories = Math.round(consumed.calories)
        consumed.protein = Math.round(consumed.protein)
        consumed.carbs = Math.round(consumed.carbs)
        consumed.fat = Math.round(consumed.fat)
        
        sourceType = 'logged_meals'
        console.log(`✅ Using Logged Meals (most recent, ${loggedMeals.length} meals):`, consumed)
      }
    } else if (quickIntakeTime) {
      consumed = {
        calories: Math.round(progress.manual_intake.calories || 0),
        protein: Math.round(progress.manual_intake.protein || 0),
        carbs: Math.round(progress.manual_intake.carbs || 0),
        fat: Math.round(progress.manual_intake.fat || 0)
      }
      sourceType = 'quick_intake'
      console.log('✅ Using Quick Intake (only source):', consumed)
    } else if (latestMealTime) {
      consumed = loggedMeals.reduce((sum, meal) => ({
        calories: sum.calories + (meal.calories || 0),
        protein: sum.protein + (meal.protein || 0),
        carbs: sum.carbs + (meal.carbs || 0),
        fat: sum.fat + (meal.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
      
      consumed.calories = Math.round(consumed.calories)
      consumed.protein = Math.round(consumed.protein)
      consumed.carbs = Math.round(consumed.carbs)
      consumed.fat = Math.round(consumed.fat)
      
      sourceType = 'logged_meals'
      console.log(`✅ Using Logged Meals (only source, ${loggedMeals.length} meals):`, consumed)
    } else {
      sourceType = 'none'
      console.log('⚠️ No intake data found for today')
    }
  } catch (error) {
    console.error('❌ Error calculating daily totals:', error)
  }
  
  const percentages = {
    calories: targets.calories > 0 ? Math.round((consumed.calories / targets.calories) * 100) : 0,
    protein: targets.protein > 0 ? Math.round((consumed.protein / targets.protein) * 100) : 0,
    carbs: targets.carbs > 0 ? Math.round((consumed.carbs / targets.carbs) * 100) : 0,
    fat: targets.fat > 0 ? Math.round((consumed.fat / targets.fat) * 100) : 0
  }
  
  console.log('📊 Final result - sourceType:', sourceType, 'consumed:', consumed)
  
  return {
    targets,
    consumed,
    percentages,
    mealsConsumed: progress?.meals_consumed || 0,
    mealsPlanned: meals.length,
    sourceType
  }
}

  createEmptyProgress(clientId, date) {
    return {
      client_id: clientId,
      date: date,
      consumed_meals: {},
      manual_intake: null,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      total_fiber: 0,
      completion_percentage: 0,
      meals_consumed: 0,
      meals_planned: 0
    }
  }
  getEmptyDashboardData() {
    return {
      activePlan: null,
      todayMeals: [],
      nextMeal: null,
      todayProgress: null,
      dailyTotals: null,
      waterIntake: 0,
      todayMood: null,
      favorites: [],
      customMeals: [],
      recentHistory: [],
      todayDate: new Date().toISOString().split('T')[0],
      dayName: this.getDayName(new Date())
    }
  }
}

