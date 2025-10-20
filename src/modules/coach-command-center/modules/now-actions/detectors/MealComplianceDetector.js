// src/modules/coach-command-center/modules/now-actions/detectors/MealComplianceDetector.js

export default class MealComplianceDetector {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
  }

  async detect(client) {
    const actions = []
    const today = new Date().toISOString().split('T')[0]
    const currentHour = new Date().getHours()
    const isMobile = window.innerWidth <= 768
    
    try {
      // Get today's meal progress
      const { data: mealProgress } = await this.supabase
        .from('ai_meal_progress')
        .select('*')
        .eq('client_id', client.id)
        .eq('date', today)
        .maybeSingle()
      
      // Get active meal plan
      const { data: mealPlan } = await this.supabase
        .from('client_meal_plans')
        .select('daily_calories, daily_protein, is_active')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .maybeSingle()
      
      // Get water intake
      const { data: waterData } = await this.supabase
        .from('water_tracking')
        .select('amount_liters, target_liters')
        .eq('client_id', client.id)
        .eq('date', today)
        .maybeSingle()
      
      // 1. CHECK: No meals tracked at all today
      if (!mealProgress || !mealProgress.consumed_meals || Object.keys(mealProgress.consumed_meals).length === 0) {
        if (currentHour >= 14) { // After 2 PM
          actions.push({
            id: `no_meals_tracked_${client.id}_${today}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'meal_tracking',
            priority: currentHour >= 20 ? 'urgent' : 'today',
            urgencyScore: currentHour >= 20 ? 85 : 65,
            icon: '🍽️',
            message: `${client.first_name} heeft vandaag nog geen meals gelogd`,
            detail: currentHour >= 20 
              ? `Het is al ${currentHour}:00 - check of alles ok is` 
              : `${currentHour - 8} uur sinds ontbijt tijd`,
            buttonText: 'Check In',
            data: { 
              type: 'no_meals',
              lastTracked: 'Never today'
            }
          })
        }
      }
      
      // 2. CHECK: Low meal compliance (less than expected by time of day)
      if (mealProgress && mealPlan) {
        const mealsConsumed = mealProgress.meals_consumed || 0
        const expectedMealsByNow = this.getExpectedMealsByTime(currentHour)
        
        if (mealsConsumed < expectedMealsByNow - 1) {
          actions.push({
            id: `low_meal_compliance_${client.id}_${today}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'meal_compliance',
            priority: 'today',
            urgencyScore: 60,
            icon: '⚠️',
            message: `${client.first_name}: ${mealsConsumed}/${expectedMealsByNow} meals vandaag`,
            detail: `Loopt achter op schema (${expectedMealsByNow - mealsConsumed} meals gemist)`,
            buttonText: 'Stuur Reminder',
            data: { 
              consumed: mealsConsumed,
              expected: expectedMealsByNow,
              missed: expectedMealsByNow - mealsConsumed
            }
          })
        }
        
        // 3. CHECK: Calorie intake too low
        const caloriePercentage = mealPlan.daily_calories 
          ? Math.round((mealProgress.total_calories || 0) / mealPlan.daily_calories * 100)
          : 0
        
        const expectedCaloriePercentage = this.getExpectedCaloriePercentage(currentHour)
        
        if (caloriePercentage < expectedCaloriePercentage - 20 && currentHour >= 12) {
          actions.push({
            id: `low_calorie_intake_${client.id}_${today}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'calorie_compliance',
            priority: currentHour >= 20 ? 'urgent' : 'today',
            urgencyScore: currentHour >= 20 ? 75 : 55,
            icon: '📉',
            message: `${client.first_name}: ${caloriePercentage}% calories (${mealProgress.total_calories}/${mealPlan.daily_calories})`,
            detail: `Verwacht ${expectedCaloriePercentage}% op dit tijdstip`,
            buttonText: 'Check Meal Plan',
            data: { 
              current: mealProgress.total_calories,
              target: mealPlan.daily_calories,
              percentage: caloriePercentage
            }
          })
        }
        
        // 4. CHECK: Protein intake too low
        const proteinPercentage = mealPlan.daily_protein 
          ? Math.round((mealProgress.total_protein || 0) / mealPlan.daily_protein * 100)
          : 0
        
        if (proteinPercentage < expectedCaloriePercentage - 30 && currentHour >= 14) {
          actions.push({
            id: `low_protein_intake_${client.id}_${today}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'protein_compliance',
            priority: 'today',
            urgencyScore: 50,
            icon: '🥩',
            message: `${client.first_name}: ${Math.round(mealProgress.total_protein || 0)}g/${mealPlan.daily_protein}g protein`,
            detail: `Slechts ${proteinPercentage}% protein binnen`,
            buttonText: 'Suggest High Protein',
            data: { 
              current: Math.round(mealProgress.total_protein || 0),
              target: mealPlan.daily_protein,
              percentage: proteinPercentage
            }
          })
        }
      }
      
      // 5. CHECK: Water intake
      const waterLiters = waterData?.amount_liters || 0
      const waterTarget = waterData?.target_liters || 2.0
      const waterPercentage = Math.round((waterLiters / waterTarget) * 100)
      
      if (waterLiters < 0.5 && currentHour >= 12) {
        actions.push({
          id: `low_water_intake_${client.id}_${today}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'water_intake',
          priority: currentHour >= 18 ? 'urgent' : 'today',
          urgencyScore: currentHour >= 18 ? 70 : 45,
          icon: '💧',
          message: `${client.first_name}: ${waterLiters}L/${waterTarget}L water`,
          detail: waterLiters === 0 ? 'Nog geen water gelogd vandaag!' : `Slechts ${waterPercentage}% van dagelijks doel`,
          buttonText: 'Water Reminder',
          data: { 
            current: waterLiters,
            target: waterTarget,
            percentage: waterPercentage
          }
        })
      } else if (waterLiters < 1.0 && currentHour >= 16) {
        actions.push({
          id: `moderate_water_intake_${client.id}_${today}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'water_intake',
          priority: 'today',
          urgencyScore: 40,
          icon: '💧',
          message: `${client.first_name}: ${waterLiters}L water (${waterPercentage}%)`,
          detail: `Nog ${(waterTarget - waterLiters).toFixed(1)}L te gaan`,
          buttonText: 'Hydration Check',
          data: { 
            current: waterLiters,
            target: waterTarget,
            remaining: waterTarget - waterLiters
          }
        })
      }
      
      // 6. CHECK: Perfect compliance (celebrate!)
      if (mealProgress && mealPlan) {
        const calorieCompliance = Math.round((mealProgress.total_calories || 0) / mealPlan.daily_calories * 100)
        const mealsConsumed = mealProgress.meals_consumed || 0
        
        if (calorieCompliance >= 90 && calorieCompliance <= 110 && mealsConsumed >= 3 && currentHour >= 20) {
          actions.push({
            id: `perfect_compliance_${client.id}_${today}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'celebration',
            priority: 'upcoming',
            urgencyScore: 10,
            icon: '🎯',
            message: `${client.first_name} perfect on track! ${calorieCompliance}%`,
            detail: `${mealsConsumed} meals, ${Math.round(mealProgress.total_protein || 0)}g protein, ${waterLiters}L water`,
            buttonText: 'Send Kudos',
            data: { 
              type: 'perfect',
              metrics: {
                calories: calorieCompliance,
                meals: mealsConsumed,
                water: waterLiters
              }
            }
          })
        }
      }
      
      // 7. CHECK: Manual intake logged (needs follow-up)
      if (mealProgress?.manual_intake) {
        actions.push({
          id: `manual_intake_${client.id}_${today}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'manual_log',
          priority: 'today',
          urgencyScore: 35,
          icon: '📝',
          message: `${client.first_name} gebruikt manual logging`,
          detail: mealProgress.manual_intake.type === 'percentage' 
            ? `${mealProgress.manual_intake.percentage}% intake gelogd`
            : `Exacte waardes ingevoerd`,
          buttonText: 'Review Log',
          data: { 
            manual: mealProgress.manual_intake
          }
        })
      }
      
    } catch (error) {
      console.error('MealComplianceDetector error:', error)
    }
    
    return actions.length > 0 ? actions : null
  }
  
  // Helper: Expected meals by time of day
  getExpectedMealsByTime(hour) {
    if (hour < 10) return 0  // Before breakfast
    if (hour < 13) return 1  // After breakfast
    if (hour < 16) return 2  // After lunch
    if (hour < 19) return 3  // After snack
    if (hour < 22) return 4  // After dinner
    return 5  // All meals
  }
  
  // Helper: Expected calorie percentage by time
  getExpectedCaloriePercentage(hour) {
    if (hour < 10) return 0
    if (hour < 13) return 25   // After breakfast
    if (hour < 16) return 50   // After lunch
    if (hour < 19) return 70   // After snack
    if (hour < 22) return 90   // After dinner
    return 100
  }
}
