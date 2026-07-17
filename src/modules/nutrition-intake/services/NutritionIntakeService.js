// NutritionIntakeService.js
// Database methods voor Voedingsvoorkeuren Intake Systeem
// Extends DatabaseService.js

import DatabaseService from '../../../services/DatabaseService'

// ============================================================================
// CLIENT DATA OPHALEN
// ============================================================================

/**
 * Get client calorie + macro data voor intake page
 * @param {string} clientId - UUID van client
 * @returns {object} Client data met recommended meal template
 */
DatabaseService.getClientIntakeData = async function(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('clients')
      .select(`
        id,
        first_name,
        last_name,
        tdee,
        surplus,
        target_calories,
        target_protein,
        target_carbs,
        target_fat
      `)
      .eq('id', clientId)
      .single()
    
    if (error) throw error
    
    if (!data) {
      throw new Error('Client not found')
    }
    
    // Calculate recommended meal template based on calories
    const recommendedMeals = this.calculateMealTemplate(data.target_calories)
    
    return {
      ...data,
      recommendedMeals
    }
  } catch (error) {
    console.error('❌ getClientIntakeData failed:', error)
    throw error
  }
}

/**
 * Calculate meal template based on calorie target
 * Based on 5-8KG Droog Project protocol
 * @param {number} targetCalories - Daily calorie target
 * @returns {object} Meal template with times and distribution
 */
DatabaseService.calculateMealTemplate = function(targetCalories) {
  if (!targetCalories || targetCalories < 1500) {
    targetCalories = 2500 // Default fallback
  }
  
  // 2000-2500 kcal: 4 maaltijden
  if (targetCalories < 2500) {
    return {
      numMeals: 4,
      times: ['07:00', '12:00', '16:00', '19:00'],
      labels: ['Ontbijt', 'Lunch', 'Pre-Workout', 'Diner'],
      distribution: [0.20, 0.30, 0.20, 0.30],
      caloriesPerMeal: [
        Math.round(targetCalories * 0.20),
        Math.round(targetCalories * 0.30),
        Math.round(targetCalories * 0.20),
        Math.round(targetCalories * 0.30)
      ]
    }
  }
  
  // 2500-3000 kcal: 5 maaltijden
  if (targetCalories < 3000) {
    return {
      numMeals: 5,
      times: ['07:00', '10:30', '13:00', '16:30', '19:30'],
      labels: ['Ontbijt', 'Snack', 'Lunch', 'Pre-Workout', 'Diner'],
      distribution: [0.20, 0.25, 0.15, 0.20, 0.20],
      caloriesPerMeal: [
        Math.round(targetCalories * 0.20),
        Math.round(targetCalories * 0.25),
        Math.round(targetCalories * 0.15),
        Math.round(targetCalories * 0.20),
        Math.round(targetCalories * 0.20)
      ]
    }
  }
  
  // 3000-3500 kcal: 5-6 maaltijden
  if (targetCalories < 3500) {
    return {
      numMeals: 6,
      times: ['07:00', '10:30', '13:00', '16:30', '19:30', '22:00'],
      labels: ['Ontbijt', 'Snack', 'Lunch', 'Pre-Workout', 'Diner', 'Avondsnack'],
      distribution: [0.20, 0.20, 0.15, 0.20, 0.20, 0.05],
      caloriesPerMeal: [
        Math.round(targetCalories * 0.20),
        Math.round(targetCalories * 0.20),
        Math.round(targetCalories * 0.15),
        Math.round(targetCalories * 0.20),
        Math.round(targetCalories * 0.20),
        Math.round(targetCalories * 0.05)
      ]
    }
  }
  
  // 3500+ kcal: 6 maaltijden
  return {
    numMeals: 6,
    times: ['07:00', '10:00', '13:00', '16:00', '19:00', '22:00'],
    labels: ['Ontbijt', 'Snack 1', 'Lunch', 'Pre-Workout', 'Diner', 'Avondsnack'],
    distribution: [0.20, 0.15, 0.20, 0.15, 0.20, 0.10],
    caloriesPerMeal: [
      Math.round(targetCalories * 0.20),
      Math.round(targetCalories * 0.15),
      Math.round(targetCalories * 0.20),
      Math.round(targetCalories * 0.15),
      Math.round(targetCalories * 0.20),
      Math.round(targetCalories * 0.10)
    ]
  }
}

// ============================================================================
// NUTRITION PREFERENCES CRUD
// ============================================================================

/**
 * Check if client already has nutrition preferences
 * @param {string} clientId - UUID van client
 * @returns {object|null} Existing preferences or null
 */
DatabaseService.getClientNutritionPreferences = async function(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('nutrition_preferences')
      .select(`
        *,
        clients:client_id (
          first_name,
          last_name,
          target_calories
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() // Returns null if not found instead of error
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('❌ getClientNutritionPreferences failed:', error)
    return null
  }
}

/**
 * Save nutrition preferences (insert or update)
 * @param {string} clientId - UUID van client
 * @param {object} preferences - Preference data
 * @returns {object} Saved preferences
 */
DatabaseService.saveNutritionPreferences = async function(clientId, preferences, { completed = true } = {}) {
  try {
    // Check if preferences already exist
    const existing = await this.getClientNutritionPreferences(clientId)

    if (existing) {
      // Update existing
      const { data, error } = await this.supabase
        .from('nutrition_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
          completed
        })
        .eq('client_id', clientId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Nutrition preferences updated:', data.id)
      return data
    } else {
      // Insert new
      const { data, error } = await this.supabase
        .from('nutrition_preferences')
        .insert({
          client_id: clientId,
          ...preferences,
          completed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Nutrition preferences created:', data.id)
      return data
    }
  } catch (error) {
    console.error('❌ saveNutritionPreferences failed:', error)
    throw error
  }
}

/**
 * Get formatted preferences for coach dashboard
 * @param {string} clientId - UUID van client
 * @returns {object} Formatted preferences with client info
 */
DatabaseService.getFormattedNutritionPreferences = async function(clientId) {
  try {
    const preferences = await this.getClientNutritionPreferences(clientId)
    
    if (!preferences) {
      return {
        hasPreferences: false,
        message: 'Cliënt heeft nog geen voedingsvoorkeuren ingevuld'
      }
    }
    
    // Parse JSONB fields and format for display
    const formatted = {
      hasPreferences: true,
      clientInfo: preferences.clients,
      calorie_target: preferences.calorie_target,
      tdee: preferences.tdee,
      surplus: preferences.surplus,
      completedAt: preferences.updated_at,
      
      mealSchedule: preferences.meal_schedule || {},
      
      protein: {
        removals: preferences.protein_preferences?.removals || [],
        additions: preferences.protein_preferences?.additions || [],
        notes: preferences.protein_preferences?.notes
      },
      
      carbs: {
        removals: preferences.carb_preferences?.removals || [],
        additions: preferences.carb_preferences?.additions || [],
        notes: preferences.carb_preferences?.notes
      },
      
      fats: {
        removals: preferences.fat_preferences?.removals || [],
        additions: preferences.fat_preferences?.additions || [],
        notes: preferences.fat_preferences?.notes
      },
      
      vegetables: preferences.vegetable_preferences || {},
      
      supplements: {
        removals: preferences.supplement_preferences?.removals || [],
        notes: preferences.supplement_preferences?.notes
      },
      
      practical: preferences.practical_info || {}
    }
    
    return formatted
  } catch (error) {
    console.error('❌ getFormattedNutritionPreferences failed:', error)
    throw error
  }
}

// ============================================================================
// HELPER METHODS
// ============================================================================

/**
 * Validate meal schedule data
 * @param {object} schedule - Meal schedule object
 * @returns {boolean} Is valid
 */
DatabaseService.validateMealSchedule = function(schedule) {
  if (!schedule || typeof schedule !== 'object') return false
  if (!schedule.times || !Array.isArray(schedule.times)) return false
  if (schedule.times.length < 3 || schedule.times.length > 6) return false
  
  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return schedule.times.every(time => timeRegex.test(time))
}

/**
 * Generate intake summary for notifications
 * @param {object} preferences - Saved preferences
 * @returns {string} Summary text
 */
DatabaseService.generateIntakeSummary = function(preferences) {
  const summary = []
  
  if (preferences.meal_schedule?.accepted_template) {
    summary.push(`${preferences.meal_schedule.num_meals} maaltijden per dag`)
  } else {
    summary.push('Aangepast maaltijd schema')
  }
  
  const totalRemovals = 
    (preferences.protein_preferences?.removals?.length || 0) +
    (preferences.carb_preferences?.removals?.length || 0) +
    (preferences.fat_preferences?.removals?.length || 0)
  
  if (totalRemovals > 0) {
    summary.push(`${totalRemovals} voedingsmiddelen uitgesloten`)
  }
  
  const totalAdditions = 
    (preferences.protein_preferences?.additions?.length || 0) +
    (preferences.carb_preferences?.additions?.length || 0) +
    (preferences.fat_preferences?.additions?.length || 0)
  
  if (totalAdditions > 0) {
    summary.push(`${totalAdditions} voedingsmiddelen toegevoegd`)
  }
  
  return summary.join(' • ')
}

console.log('✅ NutritionIntakeService loaded - Extended DatabaseService with intake methods')

export default DatabaseService
