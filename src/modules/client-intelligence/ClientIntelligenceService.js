// src/modules/client-intelligence/ClientIntelligenceService.js
export default class ClientIntelligenceService {
  constructor(db) {
    this.db = db
  }

  async getCompleteProfile(clientId) {
    try {
      console.log('📋 Getting profile for client:', clientId)
      
      // Use the view instead of clients table directly for calculated fields
      const { data: profileData, error: profileError } = await this.db.supabase
        .from('client_profiles_complete')
        .select('*')
        .eq('id', clientId)
        .single()
      
      if (profileError) {
        console.error('Error fetching from view:', profileError)
        // Fallback to regular clients table
        const client = await this.db.getClient(clientId)
        if (!client) {
          throw new Error('Client not found')
        }
        return this.transformClientToProfile(client)
      }

      return this.transformClientToProfile(profileData)
    } catch (error) {
      console.error('Error getting profile:', error)
      throw error
    }
  }

  transformClientToProfile(client) {
    if (!client) return null
    
    return {
      id: client.id,
      clientId: client.id,
      
      // Basic info
      firstName: client.first_name || '',
      lastName: client.last_name || '',
      email: client.email || '',
      phone: client.phone || '',
      dateOfBirth: client.date_of_birth || '',
      gender: client.gender || '',
      
      // Physical stats
      height: client.height || null,
      currentWeight: client.current_weight || null,
      targetWeight: client.target_weight || null,
      bodyFat: client.body_fat_percentage || null,
      muscleMass: client.muscle_mass || null,
      
      // Goals
      primaryGoal: client.primary_goal || '',
      goalUrgency: client.goal_urgency || '',
      goalDeadline: client.goal_deadline || null,
      weeklyWeightGoal: client.weekly_weight_goal || null,
      
      // Activity & Lifestyle
      activityLevel: client.activity_level || '',
      workoutDaysPerWeek: client.workout_days_per_week || client.days_per_week || null,
      workoutType: client.workout_type || '',
      jobType: client.job_type || '',
      sleepHours: client.sleep_hours || null,
      stressLevel: client.stress_level || '',
      
      // Nutrition
      dietaryType: client.dietary_type || '',
      allergies: client.allergies || '',
      intolerances: client.intolerances || '',
      lovedFoods: client.loved_foods || '',
      hatedFoods: client.hated_foods || '',
      favoriteCuisines: client.favorite_cuisines || '',
      
      // Practical
      budgetPerWeek: client.budget_per_week || null,
      cookingSkill: client.cooking_skill || '',
      cookingTime: client.cooking_time || null,
      mealPrepPreference: client.meal_prep_preference || '',
      
      // Health
      medicalConditions: client.medical_notes || client.medical_conditions || '',
      medications: client.medications || '',
      injuries: client.injuries || '',
      pregnant: client.pregnant || false,
      breastfeeding: client.breastfeeding || false,
      supplements: client.supplements || '',
      
      // Tracking
      trackingMethod: client.tracking_method || '',
      weighInFrequency: client.weigh_in_frequency || '',
      alcoholFrequency: client.alcohol_frequency || '',
      
      // Macros
      targetCalories: client.target_calories || null,
      targetProtein: client.target_protein || null,
      targetCarbs: client.target_carbs || null,
      targetFat: client.target_fat || null,
      
      // Emergency contact
      emergencyContactName: client.emergency_contact_name || '',
      emergencyContactPhone: client.emergency_contact_phone || '',
      
      // Notes
      coachNotes: client.coach_notes || client.notes || '',
      aiNotes: client.ai_notes || '',
      
      // Calculated fields from view
      age: client.age || null,
      bmi: client.bmi || null,
      tdee: client.tdee || null,
      profileCompletion: client.profile_completion || 0,
      missingFields: this.getMissingFields(client)
    }
  }

  async updateProfile(clientId, updates) {
    try {
      console.log('📝 Updating profile for client:', clientId, updates)
      
      // Transform profile fields back to database columns
      const dbUpdates = {}
      
      // Map profile fields to database columns
      const fieldMap = {
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email',
        phone: 'phone',
        dateOfBirth: 'date_of_birth',
        gender: 'gender',
        height: 'height',
        currentWeight: 'current_weight',
        targetWeight: 'target_weight',
        bodyFat: 'body_fat_percentage',
        muscleMass: 'muscle_mass',
        primaryGoal: 'primary_goal',
        goalUrgency: 'goal_urgency',
        goalDeadline: 'goal_deadline',
        weeklyWeightGoal: 'weekly_weight_goal',
        activityLevel: 'activity_level',
        workoutDaysPerWeek: 'workout_days_per_week',
        workoutType: 'workout_type',
        jobType: 'job_type',
        sleepHours: 'sleep_hours',
        stressLevel: 'stress_level',
        dietaryType: 'dietary_type',
        allergies: 'allergies',
        intolerances: 'intolerances',
        lovedFoods: 'loved_foods',
        hatedFoods: 'hated_foods',
        favoriteCuisines: 'favorite_cuisines',
        budgetPerWeek: 'budget_per_week',
        cookingSkill: 'cooking_skill',
        cookingTime: 'cooking_time',
        mealPrepPreference: 'meal_prep_preference',
        medicalConditions: 'medical_conditions',
        medications: 'medications',
        injuries: 'injuries',
        pregnant: 'pregnant',
        breastfeeding: 'breastfeeding',
        supplements: 'supplements',
        trackingMethod: 'tracking_method',
        weighInFrequency: 'weigh_in_frequency',
        alcoholFrequency: 'alcohol_frequency',
        targetCalories: 'target_calories',
        targetProtein: 'target_protein',
        targetCarbs: 'target_carbs',
        targetFat: 'target_fat',
        emergencyContactName: 'emergency_contact_name',
        emergencyContactPhone: 'emergency_contact_phone',
        coachNotes: 'coach_notes',
        aiNotes: 'ai_notes'
      }
      
      // Convert profile fields to database columns
      for (const [profileField, dbColumn] of Object.entries(fieldMap)) {
        if (updates.hasOwnProperty(profileField)) {
          dbUpdates[dbColumn] = updates[profileField]
        }
      }
      
      // Convert numeric fields
    
// Convert numeric fields - handle empty strings properly
if (dbUpdates.hasOwnProperty('height')) {
  dbUpdates.height = dbUpdates.height === '' ? null : parseInt(dbUpdates.height) || null
}
if (dbUpdates.hasOwnProperty('current_weight')) {
  dbUpdates.current_weight = dbUpdates.current_weight === '' ? null : parseFloat(dbUpdates.current_weight) || null
}
if (dbUpdates.hasOwnProperty('target_weight')) {
  dbUpdates.target_weight = dbUpdates.target_weight === '' ? null : parseFloat(dbUpdates.target_weight) || null
}
if (dbUpdates.hasOwnProperty('body_fat_percentage')) {
  dbUpdates.body_fat_percentage = dbUpdates.body_fat_percentage === '' ? null : parseFloat(dbUpdates.body_fat_percentage) || null
}
if (dbUpdates.hasOwnProperty('muscle_mass')) {
  dbUpdates.muscle_mass = dbUpdates.muscle_mass === '' ? null : parseFloat(dbUpdates.muscle_mass) || null
}
if (dbUpdates.hasOwnProperty('weekly_weight_goal')) {
  dbUpdates.weekly_weight_goal = dbUpdates.weekly_weight_goal === '' ? null : parseFloat(dbUpdates.weekly_weight_goal) || null
}
if (dbUpdates.hasOwnProperty('workout_days_per_week')) {
  dbUpdates.workout_days_per_week = dbUpdates.workout_days_per_week === '' ? null : parseInt(dbUpdates.workout_days_per_week) || null
}
if (dbUpdates.hasOwnProperty('sleep_hours')) {
  dbUpdates.sleep_hours = dbUpdates.sleep_hours === '' ? null : parseFloat(dbUpdates.sleep_hours) || null
}
if (dbUpdates.hasOwnProperty('budget_per_week')) {
  dbUpdates.budget_per_week = dbUpdates.budget_per_week === '' ? null : parseFloat(dbUpdates.budget_per_week) || null
}
if (dbUpdates.hasOwnProperty('cooking_time')) {
  dbUpdates.cooking_time = dbUpdates.cooking_time === '' ? null : parseInt(dbUpdates.cooking_time) || null
}
if (dbUpdates.hasOwnProperty('target_calories')) {
  dbUpdates.target_calories = dbUpdates.target_calories === '' ? null : parseInt(dbUpdates.target_calories) || null
}
if (dbUpdates.hasOwnProperty('target_protein')) {
  dbUpdates.target_protein = dbUpdates.target_protein === '' ? null : parseInt(dbUpdates.target_protein) || null
}
if (dbUpdates.hasOwnProperty('target_carbs')) {
  dbUpdates.target_carbs = dbUpdates.target_carbs === '' ? null : parseInt(dbUpdates.target_carbs) || null
}
if (dbUpdates.hasOwnProperty('target_fat')) {
  dbUpdates.target_fat = dbUpdates.target_fat === '' ? null : parseInt(dbUpdates.target_fat) || null
}
if (dbUpdates.hasOwnProperty('water_intake_target')) {
  dbUpdates.water_intake_target = dbUpdates.water_intake_target === '' ? null : parseFloat(dbUpdates.water_intake_target) || null
}      
      // Use the existing updateClient method from DatabaseService
      await this.db.updateClient(clientId, dbUpdates)
      
      return { success: true }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  async saveBodyMeasurements(clientId, measurements) {
    try {
      const { data, error } = await this.db.supabase
        .from('body_measurements')
        .upsert({
          client_id: clientId,
          date: new Date().toISOString().split('T')[0],
          chest: measurements.chest ? parseFloat(measurements.chest) : null,
          waist: measurements.waist ? parseFloat(measurements.waist) : null,
          hips: measurements.hips ? parseFloat(measurements.hips) : null,
          arm: measurements.arm ? parseFloat(measurements.arm) : null,
          thigh: measurements.thigh ? parseFloat(measurements.thigh) : null,
          calf: measurements.calf ? parseFloat(measurements.calf) : null,
          weight: measurements.weight ? parseFloat(measurements.weight) : null,
          body_fat: measurements.bodyFat ? parseFloat(measurements.bodyFat) : null,
          muscle_mass: measurements.muscleMass ? parseFloat(measurements.muscleMass) : null
        }, {
          onConflict: 'client_id,date'
        })
        
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error saving measurements:', error)
      throw error
    }
  }

  async getBodyMeasurements(clientId, limit = 10) {
    try {
      const { data, error } = await this.db.supabase
        .from('body_measurements')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(limit)
        
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting measurements:', error)
      return []
    }
  }

  getMissingFields(client) {
    const missing = []
    
    const requiredFields = {
      'first_name': 'First Name',
      'last_name': 'Last Name',
      'phone': 'Phone',
      'date_of_birth': 'Date of Birth',
      'gender': 'Gender',
      'height': 'Height',
      'current_weight': 'Current Weight',
      'target_weight': 'Target Weight',
      'primary_goal': 'Primary Goal',
      'activity_level': 'Activity Level'
    }

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!client[field] || client[field] === '') {
        missing.push(label)
      }
    }

    return missing
  }
}
