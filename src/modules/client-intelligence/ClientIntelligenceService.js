// src/modules/client-intelligence/ClientIntelligenceService.js
// FIXED VERSION - Macro targets now correctly map to database

class ClientIntelligenceService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
  }

  async getCompleteProfile(clientId) {
    console.log('📋 Getting profile for client:', clientId)
    
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) throw error
      
      console.log('📊 RAW DATABASE DATA:', {
        target_calories: data?.target_calories,
        target_protein: data?.target_protein,
        target_carbs: data?.target_carbs,
        target_fat: data?.target_fat
      })
      
      const transformed = this.transformClientToProfile(data)
      
      console.log('📊 TRANSFORMED DATA:', {
        targetCalories: transformed?.targetCalories,
        targetProtein: transformed?.targetProtein,
        targetCarbs: transformed?.targetCarbs,
        targetFat: transformed?.targetFat
      })
      
      return transformed
    } catch (error) {
      console.error('❌ Error getting profile:', error)
      return {}
    }
  }

  transformClientToProfile(data) {
    if (!data) return {}
    
    // Transform snake_case database fields to camelCase for UI
    return {
      // Basic Info
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.date_of_birth,
      gender: data.gender,
      emergencyContact: data.emergency_contact,
      emergencyPhone: data.emergency_phone,
      
      // Physical Info
      height: data.height,
      currentWeight: data.current_weight,
      targetWeight: data.target_weight,
      startWeight: data.start_weight,
      bodyFatPercentage: data.body_fat_percentage,
      muscleMass: data.muscle_mass,
      
      // Goals (FIXED - these were missing!)
      primaryGoal: data.primary_goal,
      goalUrgency: data.goal_urgency,
      goalDeadline: data.goal_deadline,
      weeklyWeightGoal: data.weekly_weight_goal,
      
      // 🔥 MACRO TARGETS - CORRECTLY MAPPED
      targetCalories: data.target_calories,
      targetProtein: data.target_protein,
      targetCarbs: data.target_carbs,
      targetFat: data.target_fat,
      
      // Lifestyle
      activityLevel: data.activity_level,
      workoutDaysPerWeek: data.workout_days_per_week,
      workoutType: data.workout_type,
      sleepHours: data.sleep_hours,
      stressLevel: data.stress_level,
      jobType: data.job_type,
      
      // Health
      medicalConditions: data.medical_conditions,
      medications: data.medications,
      injuries: data.injuries,
      supplements: data.supplements,
      
      // Nutrition
      dietaryType: data.dietary_type,
      allergies: data.allergies,
      intolerances: data.intolerances,
      lovedFoods: data.loved_foods,
      hatedFoods: data.hated_foods,
      favoriteCuisines: data.favorite_cuisines,
      budgetPerWeek: data.budget_per_week,
      cookingSkill: data.cooking_skill,
      cookingTime: data.cooking_time
    }
  }

  async updateProfile(clientId, updates) {
    console.log('📝 Updating profile for client:', clientId, updates)
    
    try {
      // 🔥 CRITICAL FIX: Map camelCase UI fields to snake_case database columns
      const dbUpdates = {}
      
      // Basic Info Mapping
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName
      if (updates.email !== undefined) dbUpdates.email = updates.email
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone
      if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender
      if (updates.emergencyContact !== undefined) dbUpdates.emergency_contact = updates.emergencyContact
      if (updates.emergencyPhone !== undefined) dbUpdates.emergency_phone = updates.emergencyPhone
      
      // Physical Info Mapping
      if (updates.height !== undefined) dbUpdates.height = this.toNumber(updates.height)
      if (updates.currentWeight !== undefined) dbUpdates.current_weight = this.toNumber(updates.currentWeight)
      if (updates.targetWeight !== undefined) dbUpdates.target_weight = this.toNumber(updates.targetWeight)
      if (updates.startWeight !== undefined) dbUpdates.start_weight = this.toNumber(updates.startWeight)
      if (updates.bodyFatPercentage !== undefined) dbUpdates.body_fat_percentage = this.toNumber(updates.bodyFatPercentage)
      if (updates.muscleMass !== undefined) dbUpdates.muscle_mass = this.toNumber(updates.muscleMass)
      
      // Goals Mapping
      if (updates.primaryGoal !== undefined) dbUpdates.primary_goal = updates.primaryGoal
      if (updates.goalUrgency !== undefined) dbUpdates.goal_urgency = updates.goalUrgency
      if (updates.goalDeadline !== undefined) dbUpdates.goal_deadline = updates.goalDeadline
      if (updates.weeklyWeightGoal !== undefined) dbUpdates.weekly_weight_goal = this.toNumber(updates.weeklyWeightGoal)
      if (updates.strengthGoals !== undefined) dbUpdates.strength_goals = updates.strengthGoals
      if (updates.visualGoals !== undefined) dbUpdates.visual_goals = updates.visualGoals
      
      // 🔥 MACRO TARGETS MAPPING - THIS IS THE FIX!
      // 🚨 CRITICAL: If any macro is manually set, flag as manual_macro_targets = true
      const macroFieldsUpdated = updates.targetCalories !== undefined || 
                                 updates.targetProtein !== undefined ||
                                 updates.targetCarbs !== undefined ||
                                 updates.targetFat !== undefined
      
      if (macroFieldsUpdated) {
        dbUpdates.manual_macro_targets = true  // 🔥 PREVENT AUTO-CALCULATION!
        console.log('🚨 MANUAL MACRO MODE ENABLED - Automatic TDEE calculations DISABLED')
      }
      
      if (updates.targetCalories !== undefined) {
        dbUpdates.target_calories = this.toNumber(updates.targetCalories)
        console.log('✅ Mapping targetCalories:', updates.targetCalories, '→ target_calories:', dbUpdates.target_calories)
      }
      if (updates.targetProtein !== undefined) {
        dbUpdates.target_protein = this.toNumber(updates.targetProtein)
        console.log('✅ Mapping targetProtein:', updates.targetProtein, '→ target_protein:', dbUpdates.target_protein)
      }
      if (updates.targetCarbs !== undefined) {
        dbUpdates.target_carbs = this.toNumber(updates.targetCarbs)
        console.log('✅ Mapping targetCarbs:', updates.targetCarbs, '→ target_carbs:', dbUpdates.target_carbs)
      }
      if (updates.targetFat !== undefined) {
        dbUpdates.target_fat = this.toNumber(updates.targetFat)
        console.log('✅ Mapping targetFat:', updates.targetFat, '→ target_fat:', dbUpdates.target_fat)
      }
      
      // Lifestyle Mapping
      if (updates.activityLevel !== undefined) dbUpdates.activity_level = updates.activityLevel
      if (updates.workoutDaysPerWeek !== undefined) dbUpdates.workout_days_per_week = this.toNumber(updates.workoutDaysPerWeek)
      if (updates.workoutType !== undefined) dbUpdates.workout_type = updates.workoutType
      if (updates.sleepHours !== undefined) dbUpdates.sleep_hours = this.toNumber(updates.sleepHours)
      if (updates.stressLevel !== undefined) dbUpdates.stress_level = updates.stressLevel
      if (updates.jobType !== undefined) dbUpdates.job_type = updates.jobType
      
      // Health Mapping
      if (updates.medicalConditions !== undefined) dbUpdates.medical_conditions = updates.medicalConditions
      if (updates.medications !== undefined) dbUpdates.medications = updates.medications
      if (updates.injuries !== undefined) dbUpdates.injuries = updates.injuries
      if (updates.supplements !== undefined) dbUpdates.supplements = updates.supplements
      if (updates.pregnant !== undefined) dbUpdates.pregnant = updates.pregnant
      if (updates.breastfeeding !== undefined) dbUpdates.breastfeeding = updates.breastfeeding
      
      // Nutrition Mapping
      if (updates.dietaryType !== undefined) dbUpdates.dietary_type = updates.dietaryType
      if (updates.allergies !== undefined) dbUpdates.allergies = updates.allergies
      if (updates.intolerances !== undefined) dbUpdates.intolerances = updates.intolerances
      if (updates.lovedFoods !== undefined) dbUpdates.loved_foods = updates.lovedFoods
      if (updates.hatedFoods !== undefined) dbUpdates.hated_foods = updates.hatedFoods
      if (updates.favoriteCuisines !== undefined) dbUpdates.favorite_cuisines = updates.favoriteCuisines
      if (updates.budgetPerWeek !== undefined) dbUpdates.budget_per_week = this.toNumber(updates.budgetPerWeek)
      if (updates.cookingSkill !== undefined) dbUpdates.cooking_skill = updates.cookingSkill
      if (updates.cookingTime !== undefined) dbUpdates.cooking_time = this.toNumber(updates.cookingTime)
      
      console.log('🔥 Database updates being sent:', dbUpdates)
      
      // Update in database
      const { data, error } = await this.supabase
        .from('clients')
        .update(dbUpdates)
        .eq('id', clientId)
        .select()
        .single()

      if (error) {
        console.error('❌ DATABASE ERROR:', error)
        throw error
      }
      
      console.log('✅ Profile updated successfully!')
      console.log('📊 RETURNED DATA from database:', {
        target_calories: data?.target_calories,
        target_protein: data?.target_protein,
        target_carbs: data?.target_carbs,
        target_fat: data?.target_fat
      })
      return data
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      throw error
    }
  }

  // Helper to convert empty strings to null and parse numbers
  toNumber(value) {
    if (value === '' || value === null || value === undefined) return null
    const num = parseFloat(value)
    return isNaN(num) ? null : num
  }

  async saveBodyMeasurements(clientId, measurements, date = new Date()) {
    try {
      const { data, error } = await this.supabase
        .from('body_measurements')
        .insert({
          client_id: clientId,
          measurement_date: date.toISOString().split('T')[0],
          ...measurements
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error saving measurements:', error)
      throw error
    }
  }

  getMissingFields(profile) {
    const required = {
      basic: ['firstName', 'lastName', 'email'],
      physical: ['height', 'currentWeight', 'targetWeight'],
      goals: ['primaryGoal', 'targetCalories'],
      lifestyle: ['activityLevel', 'workoutDaysPerWeek'],
      nutrition: ['dietaryType']
    }
    
    const missing = {}
    
    for (const [category, fields] of Object.entries(required)) {
      missing[category] = fields.filter(field => !profile[field])
    }
    
    return missing
  }
}

export default ClientIntelligenceService
