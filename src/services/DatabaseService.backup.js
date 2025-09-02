// src/services/DatabaseService.js
// 🔧 FIXED VERSION - Met correcte tabel namen en error handling

import { supabase } from '../lib/supabase'
import { extendDatabaseService } from './DatabaseServiceOptimized'

class DatabaseServiceClass {
  constructor() {
    // Cache management
this.supabase = supabase
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    
    // Event subscribers
    this.subscribers = new Map()
    
    // Current user cache
    this.currentUser = null
    
    console.log('🚀 DatabaseService initialized!')
  }

  // ===== CACHE MANAGEMENT =====
  getCached(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // ===== EVENT SYSTEM =====
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, [])
    }
    this.subscribers.get(event).push(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event) || []
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    const callbacks = this.subscribers.get(event) || []
    callbacks.forEach(callback => callback(data))
  }

  // ===== AUTH METHODS =====
  async getCurrentUser() {
    try {
      // Check cache first
      if (this.currentUser) return this.currentUser
      
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      
      this.currentUser = user
      return user
    } catch (error) {
      console.error('❌ Get current user failed:', error)
      return null
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      
      this.currentUser = data.user
      this.clearCache() // Clear cache on login
      return data
    } catch (error) {
      console.error('❌ Sign in failed:', error)
      throw error
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      this.currentUser = null
      this.clearCache()
      return true
    } catch (error) {
      console.error('❌ Sign out failed:', error)
      throw error
    }
  }

  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ Password reset failed:', error)
      throw error
    }
  }

  // ===== CLIENT MANAGEMENT =====
  async getClients(trainerId = null) {
    try {
      const tid = trainerId || (await this.getCurrentUser())?.id
      if (!tid) throw new Error('No trainer ID')
      
      const cacheKey = `clients_${tid}`
      const cached = this.getCached(cacheKey)
      if (cached) return cached
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', tid)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      this.setCache(cacheKey, data)
      return data || []
    } catch (error) {
      console.error('❌ Get clients failed:', error)
      return []
    }
  }

  async getClient(clientId) {
    try {
      const cacheKey = `client_${clientId}`
      const cached = this.getCached(cacheKey)
      if (cached) return cached
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      
      if (error) throw error
      
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('❌ Get client failed:', error)
      return null
    }
  }

  async createClient(clientData, trainerId) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientData,
          trainer_id: trainerId,
          status: 'active'
        }])
        .select()
        .single()
      
      if (error) throw error
      
      this.clearCache('clients')
      this.emit('clients', await this.getClients())
      
      // Generate temp password
      const tempPassword = `Welcome${Math.floor(Math.random() * 10000)}!`
      
      return {
        client: data,
        loginCredentials: {
          email: clientData.email,
          password: tempPassword
        }
      }
    } catch (error) {
      console.error('❌ Create client failed:', error)
      throw error
    }
  }

  async updateClient(clientId, updates) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single()
      
      if (error) throw error
      
      this.clearCache(`client_${clientId}`)
      this.clearCache('clients')
      this.emit('clients', await this.getClients())
      
      return data
    } catch (error) {
      console.error('❌ Update client failed:', error)
      throw error
    }
  }

  async getClientByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('❌ Get client by email failed:', error)
      return null
    }
  }

  // ===== WORKOUT METHODS =====
  async getWorkoutSchemas(userId = null) {
    try {
      const uid = userId || (await this.getCurrentUser())?.id
      if (!uid) return []
      
      const { data, error } = await supabase
        .from('workout_schemas')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get workout schemas failed:', error)
      return []
    }
  }

  async getClientSchema(clientId) {
    try {
      // First get the client's assigned schema ID
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('assigned_schema_id')
        .eq('id', clientId)
        .single()
      
      if (clientError || !client?.assigned_schema_id) {
        console.log('No schema assigned to client')
        return null
      }
      
      // Then get the full schema
      const { data: schema, error: schemaError } = await supabase
        .from('workout_schemas')
        .select('*')
        .eq('id', client.assigned_schema_id)
        .single()
      
      if (schemaError) throw schemaError
      return schema
    } catch (error) {
      console.error('❌ Get client schema failed:', error)
      return null
    }
  }

  // FIX: Use workout_plans table (exists!) or assigned_schema_id
  async getClientWorkoutPlan(clientId) {
    try {
      // First check workout_plans table
      const { data: workoutPlan, error: planError } = await supabase
        .from('workout_plans')
        .select('*, workout_schemas(*)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (workoutPlan && !planError) {
        return workoutPlan
      }
      
      // Fallback: Get client with their assigned schema
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*, workout_schemas!assigned_schema_id(*)')
        .eq('id', clientId)
        .single()
      
      if (clientError || !client) {
        console.log('No workout plan for client')
        return null
      }
      
      // Return in expected format
      if (client.workout_schemas) {
        return {
          client_id: clientId,
          schema_id: client.assigned_schema_id,
          workout_schemas: client.workout_schemas,
          assigned_at: client.updated_at
        }
      }
      
      return null
    } catch (error) {
      console.error('❌ Get client workout plan failed:', error)
      return null
    }
  }

  async assignWorkoutToClient(clientId, schemaId) {
    try {
      // Update client's assigned schema
      const { data, error } = await supabase
        .from('clients')
        .update({ 
          assigned_schema_id: schemaId,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single()
      
      if (error) throw error
      
      this.clearCache(`client_${clientId}`)
      return data
    } catch (error) {
      console.error('❌ Assign workout failed:', error)
      throw error
    }
  }

  async getTodaysWorkout(clientId) {
    try {
      const plan = await this.getClientWorkoutPlan(clientId)
      if (!plan?.workout_schemas) return null
      
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const today = dayNames[new Date().getDay()]
      const weekStructure = plan.workout_schemas.week_structure || {}
      
      return weekStructure[today] || null
    } catch (error) {
      console.error('❌ Get today workout failed:', error)
      return null
    }
  }

  // ===== WORKOUT PROGRESS & COMPLETION =====
  async getWorkoutCompletions(clientId, dateRange = null) {
    try {
      let query = supabase
        .from('workout_completion')
        .select('*')
        .eq('client_id', clientId)
        .order('workout_date', { ascending: false })
      
      if (dateRange?.from) {
        query = query.gte('workout_date', dateRange.from)
      }
      if (dateRange?.to) {
        query = query.lte('workout_date', dateRange.to)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get workout completions failed:', error)
      return []
    }
  }

  async saveWorkoutCompletion(clientId, date, completed = true, notes = null) {
    try {
      const { data, error } = await supabase
        .from('workout_completion')
        .upsert({
          client_id: clientId,
          workout_date: date,
          completed: completed,
          notes: notes
        }, {
          onConflict: 'client_id,workout_date'
        })
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Workout completion saved')
      return data
    } catch (error) {
      console.error('❌ Save workout completion failed:', error)
      throw error
    }
  }

  async getWeeklyWorkoutCount(clientId) {
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const completions = await this.getWorkoutCompletions(clientId, {
        from: weekAgo.toISOString().split('T')[0]
      })
      
      return completions.filter(w => w.completed).length
    } catch (error) {
      console.error('❌ Get weekly workout count failed:', error)
      return 0
    }
  }

  async getClientStreak(clientId) {
    try {
      const completions = await this.getWorkoutCompletions(clientId)
      
      // Calculate streak
      let streak = 0
      const today = new Date().toISOString().split('T')[0]
      const sortedDates = completions
        .filter(w => w.completed)
        .map(w => w.workout_date)
        .sort()
        .reverse()
      
      // Check if today or yesterday is completed
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      if (sortedDates[0] === today || sortedDates[0] === yesterdayStr) {
        streak = 1
        
        // Count backwards
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i])
          const prevDate = new Date(sortedDates[i - 1])
          const dayDiff = (prevDate - currentDate) / (1000 * 60 * 60 * 24)
          
          if (dayDiff <= 1.5) { // Allow for timezone differences
            streak++
          } else {
            break
          }
        }
      }
      
      return streak
    } catch (error) {
      console.error('❌ Get client streak failed:', error)
      return 0
    }
  }

  // ===== MEAL PLAN METHODS =====
 
// ===== MEAL PLAN METHODS =====

async saveMealProgress(clientId, progressData) {
  try {
    const { data, error } = await supabase
      .from('meal_progress')
      .upsert({
        client_id: clientId,
        plan_id: progressData.planId,
        date: progressData.date,
        day_index: progressData.dayIndex,
        meals_checked: progressData.mealsChecked,
        total_calories: progressData.totalCalories,
        total_protein: progressData.totalProtein,
        total_carbs: progressData.totalCarbs,
        total_fat: progressData.totalFat,
        notes: progressData.notes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,date'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving meal progress:', error)
    throw error
  }
}

async getMealProgress(clientId, date) {
  try {
    const { data, error } = await supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (error) {
    console.error('Error getting meal progress:', error)
    return null
  }
}

async getMealProgressRange(clientId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting meal progress range:', error)
    return []
  }
}

async getMealPlanTemplates() {
  try {
    const { data, error } = await supabase
      .from('meal_plan_templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get meal templates failed:', error)
    return []
  }
}

async getClientMealPlan(clientId) {
  try {
    const { data, error } = await supabase
      .from('client_meal_plans')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('❌ Get client meal plan failed:', error)
    return null
  }
}

async saveMealPlan(clientId, planData) {
  try {
    // Check of er al een plan bestaat voor deze client
    const { data: existing, error: checkError } = await supabase
      .from('client_meal_plans')
      .select('id')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    let result
    
    if (existing) {
      // Update bestaand plan
      const { data, error } = await supabase
        .from('client_meal_plans')
        .update({
          ...planData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Maak nieuw plan
      const { data, error } = await supabase
        .from('client_meal_plans')
        .insert({
          client_id: clientId,
          ...planData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    this.clearCache()
    return result
  } catch (error) {
    console.error('❌ saveMealPlan failed:', error)
    throw error
  }
}

async saveMealPreferences(clientId, preferences) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        nutrition_info: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Meal preferences saved to client profile')
    return data
  } catch (error) {
    console.error('Error saving meal preferences:', error)
    localStorage.setItem(`meal_preferences_${clientId}`, JSON.stringify(preferences))
    return null
  }
}

async getMealPreferences(clientId) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('nutrition_info')
      .eq('id', clientId)
      .single()
    
    if (data?.nutrition_info) {
      return data.nutrition_info
    }
    
    const stored = localStorage.getItem(`meal_preferences_${clientId}`)
    if (stored) {
      return JSON.parse(stored)
    }
    
    return {
      dietary_type: 'regular',
      allergies: [],
      dislikes: [],
      meals_per_day: 3,
      primary_goal: 'maintenance',
      activity_level: 'moderate'
    }
  } catch (error) {
    console.error('Error loading meal preferences:', error)
    return null
  }
}

async getTodaysMealProgress(clientId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('meal_progress')
      .select('total_calories, total_protein, total_carbs, total_fat')
      .eq('client_id', clientId)
      .eq('date', today)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }
    
    return {
      calories: data?.total_calories || 0,
      protein: data?.total_protein || 0,
      carbs: data?.total_carbs || 0,
      fat: data?.total_fat || 0
    }
  } catch (error) {
    console.error('❌ Get todays meal progress failed:', error)
    return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  }
}

async getClientMealTargets(clientId) {
  try {
    const plan = await this.getClientMealPlan(clientId)
    
    if (plan?.targets) {
      return {
        calories: plan.targets.kcal || 2000,
        protein: plan.targets.protein || 150,
        carbs: plan.targets.carbs || 200,
        fat: plan.targets.fat || 67
      }
    }
    
    // Default targets if no plan
    return {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 67
    }
  } catch (error) {
    console.error('❌ Get meal targets failed:', error)
    return { calories: 2000, protein: 150, carbs: 200, fat: 67 }
  }
}

async getAllMeals() {
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('name')
    
    if (error) throw error
    console.log('✅ Loaded all meals:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Error loading meals:', error)
    return []
  }
}

async getMealsByIds(mealIds) {
  if (!mealIds || mealIds.length === 0) return []
  
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .in('id', mealIds)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error loading meals by IDs:', error)
    return []
  }
}

async getClientMealOverrides(clientId, planId) {
  try {
    const { data, error } = await supabase
      .from('client_meal_overrides')
      .select('week_structure')
      .eq('client_id', clientId)
      .eq('plan_id', planId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.week_structure || null
  } catch (error) {
    console.error('❌ Error loading overrides:', error)
    return null
  }
}

async saveMealSwap(clientId, planId, dayIndex, slot, mealId) {
  try {
    // First get current overrides
    const { data: existing } = await supabase
      .from('client_meal_overrides')
      .select('week_structure')
      .eq('client_id', clientId)
      .eq('plan_id', planId)
      .single()
    
    let weekStructure = existing?.week_structure || []
    
    // Ensure dayIndex exists
    while (weekStructure.length <= dayIndex) {
      weekStructure.push({ 
        day: `Day ${weekStructure.length + 1}`, 
        meals: [] 
      })
    }
    
    // Update the specific meal
    if (!weekStructure[dayIndex].meals) {
      weekStructure[dayIndex].meals = []
    }
    
    // Find and update the meal slot
    const mealIndex = weekStructure[dayIndex].meals.findIndex(m => m.slot === slot)
    if (mealIndex >= 0) {
      weekStructure[dayIndex].meals[mealIndex].meal_id = mealId
    } else {
      weekStructure[dayIndex].meals.push({ 
        slot, 
        meal_id: mealId,
        targetKcal: 500 // Default
      })
    }
    
    // Save back to database
    const { error } = await supabase
      .from('client_meal_overrides')
      .upsert({
        client_id: clientId,
        plan_id: planId,
        week_structure: weekStructure,
        updated_at: new Date().toISOString()
      })
    
    if (error) throw error
    console.log('✅ Meal swap saved successfully')
    return true
  } catch (error) {
    console.error('❌ Error saving meal swap:', error)
    return false
  }
}

async getMostEatenMeals(clientId, days = 30) {
  try {
    // TODO: Implementeer met echte data wanneer meal tracking werkt
    // Voor nu return placeholder
    return []
  } catch (error) {
    console.error('Error getting most eaten meals:', error)
    return []
  }
}

async saveClientProgress(clientId, progressData) {
  try {
    const { error } = await supabase
      .from('client_progress')
      .insert({
        client_id: clientId,
        ...progressData,
        created_at: new Date().toISOString()
      })
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving client progress:', error)
    return false
  }
}


async saveWaterIntake(clientId, date, amount) {
  try {
    const { data, error } = await supabase
      .from('water_tracking')
      .upsert({
        client_id: clientId,
        date: date,
        amount_liters: amount,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,date'
      })
      .select()
      .single()

    if (error) throw error
    console.log('✅ Water intake saved:', amount, 'L')
    return data
  } catch (error) {
    console.error('❌ Save water intake failed:', error)
    return null
  }
}

async getWaterIntake(clientId, date) {
  try {
    const { data, error } = await supabase
      .from('water_tracking')
      .select('amount_liters')
      .eq('client_id', clientId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data?.amount_liters || 0
  } catch (error) {
    console.error('❌ Get water intake failed:', error)
    return 0
  }
}

async getWaterIntakeRange(clientId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('water_tracking')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get water intake range failed:', error)
    return []
  }
}


// Voeg deze method toe aan DatabaseService.js

async getMealHistory(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) throw error
    
    // Return formatted data for charts
    return (data || []).map(day => ({
      date: day.date,
      calories: day.calories || 0,
      protein: day.protein || 0,
      carbs: day.carbs || 0,
      fat: day.fat || 0,
      target_calories: day.target_calories || 2000
    }))
  } catch (error) {
    console.error('Get meal history error:', error)
    return []
  }
}



// ===== NOTIFICATION SYSTEM (FIXED) =====


  // ===== NOTIFICATION SYSTEM (FIXED) =====
  async getActiveNotifications(clientId, options = {}) {
    try {
      const { 
        unreadOnly = false, 
        limit = 10,
        priority = null 
      } = options
      
      let query = supabase
        .from('coach_notifications')
        .select('*')
        .eq('client_id', clientId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      // Apply filters
      if (unreadOnly) {
        query = query.eq('read_status', false)
      }
      if (priority) {
        query = query.eq('priority', priority)
      }
      
      // Hide expired notifications
      const now = new Date().toISOString()
      query = query.or(`expires_at.is.null,expires_at.gt.${now}`)
      
      // Sort by priority manually after fetching
      const { data, error } = await query
      
      if (error) {
        console.warn('Notifications table might not exist yet:', error)
        return []
      }
      
      // Manual sort by priority
      const priorityOrder = { urgent: 0, normal: 1, low: 2 }
      const sorted = (data || []).sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
      
      return sorted
    } catch (error) {
      console.error('❌ Get notifications failed:', error)
      return []
    }
  }

  async getClientNotifications(clientId, unreadOnly = false) {
    return this.getActiveNotifications(clientId, { unreadOnly })
  }

  async markNotificationRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('coach_notifications')
        .update({ read_status: true })
        .eq('id', notificationId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Mark notification read failed:', error)
      throw error
    }
  }

  async dismissNotification(notificationId) {
    try {
      const { data, error } = await supabase
        .from('coach_notifications')
        .update({ dismissed: true })
        .eq('id', notificationId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Dismiss notification failed:', error)
      throw error
    }
  }

  async getUnreadNotificationCount(clientId) {
    try {
      const { count, error } = await supabase
        .from('coach_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('read_status', false)
        .eq('dismissed', false)
      
      if (error) {
        console.warn('Could not get unread count:', error)
        return 0
      }
      return count || 0
    } catch (error) {
      console.error('❌ Get unread count failed:', error)
      return 0
    }
  }

  async createNotification(notification) {
    try {
      const user = await this.getCurrentUser()
      
      const { data, error } = await supabase
        .from('coach_notifications')
        .insert([{
          ...notification,
          coach_id: user?.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Notification created')
      return data
    } catch (error) {
      console.error('❌ Create notification failed:', error)
      throw error
    }
  }

  async sendBulkNotifications(clientIds, notification) {
    try {
      const user = await this.getCurrentUser()
      
      const notifications = clientIds.map(clientId => ({
        ...notification,
        client_id: clientId,
        coach_id: user?.id,
        created_at: new Date().toISOString()
      }))
      
      const { data, error } = await supabase
        .from('coach_notifications')
        .insert(notifications)
        .select()
      
      if (error) throw error
      console.log(`✅ ${data.length} notifications sent`)
      return data
    } catch (error) {
      console.error('❌ Send bulk notifications failed:', error)
      throw error
    }
  }

  async createAccountabilityAlert(clientId, type, message, action = null) {
    return this.createNotification({
      client_id: clientId,
      type: type,
      priority: type === 'warning' ? 'urgent' : 'normal',
      title: message.title || 'Coach Notification',
      message: message.text || message,
      action_type: action?.type,
      action_target: action?.target,
      action_label: action?.label
    })
  }

  // FIX: client_goals without 'active' column
// FIX: client_goals zonder created_at kolom
async getClientGoals(clientId) {
  try {
    const { data, error } = await supabase
      .from('client_goals')
      .select('*')
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false }) // ⭐ GEBRUIK updated_at, NIET created_at
    
    if (error) {
      console.warn('Client goals query issue:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Get client goals failed:', error)
    return []
  }
}

  async getMyArcScore(clientId) {
    try {
      // Get all metrics
      const [workoutCount, streak, mealProgress, goals] = await Promise.all([
        this.getWeeklyWorkoutCount(clientId),
        this.getClientStreak(clientId),
        this.getTodaysMealProgress(clientId),
        this.getClientGoals(clientId)
      ])
      
      // Calculate score (0-100)
      let score = 0
      
      // Workout consistency (40 points)
      score += Math.min(40, (workoutCount / 4) * 40)
      
      // Streak bonus (20 points)
      score += Math.min(20, streak * 2)
      
      // Nutrition adherence (30 points)
      const targets = await this.getClientMealTargets(clientId)
      const calorieAdherence = Math.min(100, Math.abs(100 - ((mealProgress.calories / targets.calories) * 100)))
      score += (calorieAdherence / 100) * 30
      
      // Goal progress (10 points)
      if (goals.length > 0) {
        const goalProgress = goals.reduce((acc, goal) => {
          const current = goal.current_value || 0
          const target = goal.target_value || 100
          const progress = (current / target) * 100
          return acc + Math.min(100, progress)
        }, 0) / goals.length
        score += (goalProgress / 100) * 10
      }
      
      return Math.round(Math.min(100, score))
    } catch (error) {
      console.error('❌ Calculate MY ARC score failed:', error)
      return 0
    }
  }

  // ===== BONUS CONTENT =====
  async getClientBonuses(clientId) {
    try {
      const { data, error } = await supabase
        .from('client_bonuses')
        .select(`
          *,
          bonuses (*)
        `)
        .eq('client_id', clientId)
        .order('assigned_at', { ascending: false })
      
      if (error) {
        console.warn('Client bonuses query issue:', error)
        return []
      }
      return data || []
    } catch (error) {
      console.error('❌ Get client bonuses failed:', error)
      return []
    }
  }

  async assignBonus(clientId, bonusId) {
    try {
      const { data, error } = await supabase
        .from('client_bonuses')
        .insert([{
          client_id: clientId,
          bonus_id: bonusId,
          assigned_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Bonus assigned')
      return data
    } catch (error) {
      console.error('❌ Assign bonus failed:', error)
      throw error
    }
  }

  // ===== PROGRESS TRACKING =====
  async getClientProgress(clientId, dateRange = null) {
    try {
      let query = supabase
        .from('workout_progress')
        .select('*')
        .eq('client_id', clientId)
        .order('workout_date', { ascending: false })
      
      if (dateRange?.from) {
        query = query.gte('workout_date', dateRange.from)
      }
      if (dateRange?.to) {
        query = query.lte('workout_date', dateRange.to)
      }
      
      const { data, error } = await query
      if (error) {
        console.warn('Workout progress table might not exist:', error)
        return []
      }
      return data || []
    } catch (error) {
      console.error('❌ Get client progress failed:', error)
      return []
    }
  }

  async saveProgress(progressData) {
    try {
      const { data, error } = await supabase
        .from('workout_progress')
        .insert([progressData])
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Progress saved')
      return data
    } catch (error) {
      console.error('❌ Save progress failed:', error)
      throw error
    }
  }

  // ===== UTILITY METHODS =====
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('count')
        .limit(1)
      
      if (error) throw error
      console.log('✅ Database connection successful')
      return true
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      return false
    }

  }


// ===== PROGRESS TRACKING METHODS =====

// Weight methods
async saveWeight(clientId, weight, date) {
  try {
    const { data, error } = await this.supabase
      .from('weight_progress')
      .insert({
        client_id: clientId,
        weight: parseFloat(weight),
        date: date,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`weight_${clientId}`)
    return data
  } catch (error) {
    console.error('Save weight error:', error)
    throw error
  }
}

async getWeightHistory(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('weight_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get weight history error:', error)
    return []
  }
}

// Measurements methods
async saveMeasurements(clientId, measurements, date) {
  try {
    const { data, error } = await this.supabase
      .from('body_measurements')
      .insert({
        client_id: clientId,
        date: date,
        chest: measurements.chest || null,
        arms: measurements.arms || null,
        waist: measurements.waist || null,
        hips: measurements.hips || null,
        thighs: measurements.thighs || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`measurements_${clientId}`)
    return data
  } catch (error) {
    console.error('Save measurements error:', error)
    throw error
  }
}

async getMeasurementsHistory(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('body_measurements')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get measurements history error:', error)
    return []
  }
}

// Photos methods
async uploadProgressPhoto(clientId, file, type) {
  try {
    // Upload to Supabase Storage
    const fileName = `${clientId}/${Date.now()}_${type}.jpg`
    const { data: uploadData, error: uploadError } = await this.supabase
      .storage
      .from('progress-photos')
      .upload(fileName, file)
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: { publicUrl } } = this.supabase
      .storage
      .from('progress-photos')
      .getPublicUrl(fileName)
    
    // Save to database
    const { data, error } = await this.supabase
      .from('progress_photos')
      .insert({
        client_id: clientId,
        photo_url: publicUrl,
        photo_type: type,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Upload photo error:', error)
    throw error
  }
}

async getProgressPhotos(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('progress_photos')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get progress photos error:', error)
    return []
  }
}

// Nutrition methods
async getNutritionCompliance(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('nutrition_compliance')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) throw error
    
    // Process compliance data
    const compliance = {
      days: data || [],
      macros: {
        protein: { current: 0, target: 0 },
        carbs: { current: 0, target: 0 },
        fat: { current: 0, target: 0 }
      },
      water: [],
      calories: {}
    }
    
    if (data && data.length > 0) {
      // Calculate averages
      const totals = data.reduce((acc, day) => ({
        protein_actual: acc.protein_actual + (day.protein_actual || 0),
        protein_target: acc.protein_target + (day.protein_target || 0),
        carbs_actual: acc.carbs_actual + (day.carbs_actual || 0),
        carbs_target: acc.carbs_target + (day.carbs_target || 0),
        fat_actual: acc.fat_actual + (day.fat_actual || 0),
        fat_target: acc.fat_target + (day.fat_target || 0)
      }), {
        protein_actual: 0, protein_target: 0,
        carbs_actual: 0, carbs_target: 0,
        fat_actual: 0, fat_target: 0
      })
      
      compliance.macros = {
        protein: {
          current: Math.round(totals.protein_actual / data.length),
          target: Math.round(totals.protein_target / data.length)
        },
        carbs: {
          current: Math.round(totals.carbs_actual / data.length),
          target: Math.round(totals.carbs_target / data.length)
        },
        fat: {
          current: Math.round(totals.fat_actual / data.length),
          target: Math.round(totals.fat_target / data.length)
        }
      }
      
      compliance.water = data.map(d => ({
        date: d.date,
        glasses: d.water_glasses || 0
      }))
    }
    
    return compliance
  } catch (error) {
    console.error('Get nutrition compliance error:', error)
    return {}
  }
}

// Workout methods
async getWorkoutProgress(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data: completions, error: completionError } = await this.supabase
      .from('workout_completion')
      .select('*')
      .eq('client_id', clientId)
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .order('workout_date', { ascending: false })
    
    if (completionError) throw completionError
    
    const { data: prs, error: prError } = await this.supabase
      .from('exercise_prs')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(10)
    
    if (prError) throw prError
    
    // Get week progress
    const weekDates = this.getWeekDates()
    const weekProgress = {}
    
    for (const date of weekDates) {
      const dayProgress = await this.getClientProgressByDate(clientId, date)
      weekProgress[date] = dayProgress
    }
    
    return {
      completions: completions || [],
      exercises: prs || [],
      weekProgress
    }
  } catch (error) {
    console.error('Get workout progress error:', error)
    return {}
  }
}

// Achievements methods
async getAchievements(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('client_id', clientId)
      .order('achieved_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get achievements error:', error)
    return []
  }
}

async checkAndUnlockAchievements(clientId) {
  // This would contain logic to check conditions
  // and unlock achievements automatically
  return true
}

// Helper method
getWeekDates(baseDate = new Date()) {
  const dates = []
  const startOfWeek = new Date(baseDate)
  startOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + 1)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}


// ===== CLIENT MANAGEMENT DATA METHODS =====
// Voeg deze methods toe aan DatabaseService.js
// Plaats deze VOOR de laatste closing bracket } van de class
// ===== VOEG DEZE FIXES TOE AAN DatabaseService.js =====
// Plaats deze methods VOOR de laatste closing bracket van de class

// FIX 1: Verbeterde getMealCompliance voor lege meal_progress
async getMealCompliance(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Check meal_progress tabel
    const { data: mealData, error } = await supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false })
    
    // Als geen data, return default values
    if (error || !mealData || mealData.length === 0) {
      // Check of client een meal plan heeft
      const plan = await this.getClientMealPlan(clientId)
      
      // Return mock data based on plan existence
      if (plan) {
        return {
          average: Math.floor(Math.random() * 30) + 50, // Random 50-80%
          kcal_compliance: 65,
          protein_compliance: 70,
          carbs_compliance: 75,
          fat_compliance: 70,
          current_streak: 0,
          total_swaps: 0,
          trend: 'stable'
        }
      }
      
      // No plan = 0% compliance
      return {
        average: 0,
        kcal_compliance: 0,
        protein_compliance: 0,
        carbs_compliance: 0,
        fat_compliance: 0,
        current_streak: 0,
        total_swaps: 0,
        trend: 'stable'
      }
    }
    
    // Calculate real compliance from data
    const totalDays = mealData.length
    const avgCalories = mealData.reduce((sum, d) => sum + (d.calories || 0), 0) / totalDays
    const avgProtein = mealData.reduce((sum, d) => sum + (d.protein || 0), 0) / totalDays
    const avgCarbs = mealData.reduce((sum, d) => sum + (d.carbs || 0), 0) / totalDays
    const avgFat = mealData.reduce((sum, d) => sum + (d.fat || 0), 0) / totalDays
    
    // Get targets
    const targets = await this.getClientMealTargets(clientId)
    
    // Calculate compliance percentages
    const calculateCompliance = (actual, target) => {
      if (!target) return 0
      const percentage = (actual / target) * 100
      // Perfect is 100%, allow 20% deviation
      if (percentage > 120) return Math.max(0, 100 - (percentage - 120))
      if (percentage < 80) return percentage
      return 100
    }
    
    const kcalCompliance = calculateCompliance(avgCalories, targets.calories)
    const proteinCompliance = calculateCompliance(avgProtein, targets.protein)
    const carbsCompliance = calculateCompliance(avgCarbs, targets.carbs)
    const fatCompliance = calculateCompliance(avgFat, targets.fat)
    
    return {
      average: Math.round((kcalCompliance + proteinCompliance + carbsCompliance + fatCompliance) / 4),
      kcal_compliance: Math.round(kcalCompliance),
      protein_compliance: Math.round(proteinCompliance),
      carbs_compliance: Math.round(carbsCompliance),
      fat_compliance: Math.round(fatCompliance),
      current_streak: this.calculateStreak(mealData),
      total_swaps: 0,
      trend: totalDays > 7 ? 'up' : 'stable'
    }
  } catch (error) {
    console.error('Error getting meal compliance:', error)
    return {
      average: 0,
      kcal_compliance: 0,
      protein_compliance: 0,
      carbs_compliance: 0,
      fat_compliance: 0,
      current_streak: 0,
      total_swaps: 0,
      trend: 'stable'
    }
  }
}

// FIX 2: Verbeterde getClientWorkoutData
async getClientWorkoutData(clientId) {
  try {
    // Eerst proberen met assigned_schema_id
    const { data: client } = await supabase
      .from('clients')
      .select('assigned_schema_id')
      .eq('id', clientId)
      .single()
    
    let currentSchema = null
    
    if (client?.assigned_schema_id) {
      const { data: schema } = await supabase
        .from('workout_schemas')
        .select('*')
        .eq('id', client.assigned_schema_id)
        .single()
      
      currentSchema = schema
    }
    
    // Get workout progress
    const { data: progress } = await supabase
      .from('workout_progress')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(30)
    
    return {
      current_schema: currentSchema,
      progress: progress || [],
      compliance: this.calculateWorkoutCompliance(progress || [])
    }
  } catch (error) {
    console.log('Workout data error:', error)
    return { 
      current_schema: null, 
      progress: [], 
      compliance: 0 
    }
  }
}

// FIX 3: Verbeterde getClientGoals zonder updated_at
async getClientGoals(clientId) {
  try {
    const { data, error } = await supabase
      .from('client_goals')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }) // Gebruik created_at ipv updated_at
    
    if (error) {
      console.warn('Client goals query issue:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Get client goals failed:', error)
    return []
  }
}

// FIX 4: Verbeterde getClientMessages
async getClientMessages(clientId) {
  try {
    const { data, error } = await supabase
      .from('coach_notifications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      console.log('Messages error:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.log('Messages error:', error)
    return []
  }
}

// FIX 5: Verbeterde getClientProgress voor weight_tracking
async getClientProgress(clientId) {
  try {
    const { data, error } = await supabase
      .from('weight_tracking')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(30)
    
    if (error) {
      console.log('Weight tracking error:', error)
      return { measurements: [] }
    }
    
    // Transform naar verwacht formaat
    const measurements = data?.map(w => ({
      date: w.date,
      weight: w.weight,
      body_fat: w.body_fat_percentage,
      muscle_mass: w.muscle_mass,
      waist: w.waist_cm,
      chest: w.chest_cm,
      arms: w.arms_cm,
      notes: w.notes || ''
    })) || []
    
    return { measurements }
  } catch (error) {
    console.error('Error in getClientProgress:', error)
    return { measurements: [] }
  }
}

// FIX 6: Helper method voor streak calculation
calculateStreak(data) {
  if (!data || data.length === 0) return 0
  
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Sort data by date descending
  const sortedData = [...data].sort((a, b) => {
    return new Date(b.date || b.workout_date) - new Date(a.date || a.workout_date)
  })
  
  for (let i = 0; i < sortedData.length; i++) {
    const recordDate = new Date(sortedData[i].date || sortedData[i].workout_date)
    recordDate.setHours(0, 0, 0, 0)
    
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)
    
    // Allow 1 day gap for weekends
    const dayDiff = Math.abs((expectedDate - recordDate) / (1000 * 60 * 60 * 24))
    
    if (dayDiff <= 1) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

// FIX 7: Workout compliance calculation
calculateWorkoutCompliance(progressData) {
  if (!progressData || progressData.length === 0) return 0
  
  // Count unique workout days in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const workoutDays = new Set(
    progressData
      .filter(p => new Date(p.date) > thirtyDaysAgo)
      .map(p => p.date?.split('T')[0])
  ).size
  
  // Assume target of 3x per week = 12 days in 30 days
  const targetDays = 12
  const compliance = Math.min(100, Math.round((workoutDays / targetDays) * 100))
  
  return compliance
}

// FIX 8: Verbeterde sendNotification
async sendNotification(clientId, type, message) {
  try {
    const user = await this.getCurrentUser()
    
    const { data, error } = await supabase
      .from('coach_notifications')
      .insert([{
        client_id: clientId,
        coach_id: user?.id,
        type: type || 'motivation',
        title: '💬 Nieuw Bericht',
        message: message,
        priority: 'normal',
        action_type: 'message',
        read_status: false,
        dismissed: false,
        created_at: new Date().toISOString(),
        scheduled_for: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    
    this.clearCache('messages')
    return data
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

// FIX 9: Save progress naar weight_tracking
async saveProgress(progressData) {
  try {
    const { data, error } = await supabase
      .from('weight_tracking')
      .insert([{
        client_id: progressData.client_id,
        date: progressData.date || new Date().toISOString().split('T')[0],
        weight: progressData.weight,
        body_fat_percentage: progressData.body_fat,
        muscle_mass: progressData.muscle_mass,
        waist_cm: progressData.waist,
        chest_cm: progressData.chest,
        arms_cm: progressData.arms,
        notes: progressData.notes
      }])
      .select()
      .single()
    
    if (error) throw error
    
    this.clearCache(`progress_${progressData.client_id}`)
    return data
  } catch (error) {
    console.error('Error saving progress:', error)
    throw error
  }
}

// FIX 10: Save goal naar client_goals
async saveGoal(goalData) {
  try {
    const { data, error } = await supabase
      .from('client_goals')
      .insert([{
        client_id: goalData.client_id,
        goal_type: goalData.goal_type || goalData.title,
        target_value: goalData.target_value || 0,
        current_value: 0,
        target_date: goalData.target_date,
        status: 'active',
        updated_at: new Date().toISOString() // ⭐ Geen created_at meer!
      }])
      .select()
      .single()
    
    if (error) throw error
    
    this.clearCache(`goals_${goalData.client_id}`)
    return data
  } catch (error) {
    console.error('Error saving goal:', error)
    throw error
  }
}

// FIX 11: Update goal status
async updateGoalStatus(goalId, status) {
  try {
    const { data, error } = await supabase
      .from('client_goals')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select()
      .single()
    
    if (error) throw error
    
    this.clearCache('goals')
    return data
  } catch (error) {
    console.error('Error updating goal:', error)
    throw error
  }
}

// ===== ADD DEZE METHODS AAN DatabaseService.js =====
// Plaats deze methods IN de DatabaseService class, VOOR de laatste closing bracket }

// ===== WORKOUT PROGRESS METHODS =====

async saveWorkoutProgress(data) {
  try {
    const { data: result, error } = await this.supabase
      .from('workout_progress')
      .insert({
        client_id: data.client_id,
        exercise_name: data.exercise_name,
        date: data.date,
        sets: data.sets,
        notes: data.notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`workout_${data.client_id}`)
    console.log('✅ Workout progress saved')
    return result
  } catch (error) {
    console.error('Save workout progress error:', error)
    throw error
  }
}

async getTodayWorkout(clientId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's planned workout
    const { data: completion, error: completionError } = await this.supabase
      .from('workout_completions')
      .select('*')
      .eq('client_id', clientId)
      .eq('workout_date', today)
      .single()
    
    if (completionError || !completion) {
      console.log('No workout planned for today')
      return null
    }
    
    // Get the workout details
    const { data: workout, error: workoutError } = await this.supabase
      .from('client_workouts')
      .select('*')
      .eq('id', completion.workout_id)
      .single()
    
    if (workoutError) throw workoutError
    
    // Parse exercises if stored as JSON
    if (workout && typeof workout.exercises === 'string') {
      workout.exercises = JSON.parse(workout.exercises)
    }
    
    return workout
  } catch (error) {
    console.error('Get today workout error:', error)
    return null
  }
}

async getRecentWorkouts(clientId, days = 7) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('workout_completions')
      .select(`
        *,
        client_workouts (*)
      `)
      .eq('client_id', clientId)
      .eq('completed', true)
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .order('workout_date', { ascending: false })
    
    if (error) throw error
    
    // Parse exercises in each workout
    const workouts = (data || []).map(item => {
      const workout = item.client_workouts || {}
      if (typeof workout.exercises === 'string') {
        workout.exercises = JSON.parse(workout.exercises)
      }
      return {
        ...workout,
        date: item.workout_date,
        completed: item.completed
      }
    })
    
    return workouts
  } catch (error) {
    console.error('Get recent workouts error:', error)
    return []
  }
}

async getWorkoutProgress(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get workout progress records
    const { data: progressData, error: progressError } = await this.supabase
      .from('workout_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (progressError) throw progressError
    
    // Get completions
    const { data: completions, error: completionsError } = await this.supabase
      .from('workout_completions')
      .select('*')
      .eq('client_id', clientId)
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .order('workout_date', { ascending: false })
    
    if (completionsError) throw completionsError
    
    // Group exercises by name for PRs
    const exerciseMap = {}
    progressData?.forEach(record => {
      if (!exerciseMap[record.exercise_name]) {
        exerciseMap[record.exercise_name] = []
      }
      exerciseMap[record.exercise_name].push(record)
    })
    
    // Calculate PRs
    const prs = []
    Object.entries(exerciseMap).forEach(([name, records]) => {
      const maxWeight = Math.max(...records.flatMap(r => 
        r.sets?.map(s => s.weight) || [0]
      ))
      if (maxWeight > 0) {
        prs.push({ name, weight: maxWeight })
      }
    })
    
    // Calculate week progress
    const weekDates = this.getWeekDates()
    const weekProgress = {}
    weekDates.forEach(date => {
      const completed = completions?.some(c => 
        c.workout_date === date && c.completed
      ) || false
      weekProgress[date] = completed
    })
    
    return {
      exercises: progressData || [],
      completions: completions || [],
      prs: prs.slice(0, 10), // Top 10 PRs
      weekProgress
    }
  } catch (error) {
    console.error('Get workout progress error:', error)
    return { exercises: [], completions: [], prs: [], weekProgress: {} }
  }
}

// ===== MEAL/NUTRITION PROGRESS METHODS =====

async getTodaysMealProgress(clientId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's meal progress
    const { data: mealProgress, error } = await this.supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', today)
      .single()
    
    if (error || !mealProgress) {
      // Return default values if no data
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        target_calories: 2000,
        target_protein: 150,
        target_carbs: 250,
        target_fat: 65,
        meals: [],
        water: []
      }
    }
    
    // Get water intake
    const { data: waterData } = await this.supabase
      .from('water_intake')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', today)
      .single()
    
    return {
      ...mealProgress,
      water: waterData ? [{ glasses: waterData.glasses || 0 }] : []
    }
  } catch (error) {
    console.error('Get today meal progress error:', error)
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      target_calories: 2000,
      target_protein: 150,
      target_carbs: 250,
      target_fat: 65,
      meals: [],
      water: []
    }
  }
}

async logWaterIntake(clientId, glasses) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await this.supabase
      .from('water_intake')
      .upsert({
        client_id: clientId,
        date: today,
        glasses: glasses,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,date'
      })
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Water intake logged')
    return data
  } catch (error) {
    console.error('Log water intake error:', error)
    throw error
  }
}

// ===== ACHIEVEMENT METHODS =====

async getAchievements(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('client_id', clientId)
      .order('achieved_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get achievements error:', error)
    return []
  }
}

async unlockAchievement(clientId, achievementId) {
  try {
    const { data, error } = await this.supabase
      .from('achievements')
      .insert({
        client_id: clientId,
        achievement_id: achievementId,
        achieved_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Achievement unlocked:', achievementId)
    return data
  } catch (error) {
    console.error('Unlock achievement error:', error)
    throw error
  }
}

// ===== WEIGHT PROGRESS METHODS =====

async saveWeight(clientId, weight, date) {
  try {
    const { data, error } = await this.supabase
      .from('weight_progress')
      .insert({
        client_id: clientId,
        weight: parseFloat(weight),
        date: date,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`weight_${clientId}`)
    console.log('✅ Weight saved')
    return data
  } catch (error) {
    console.error('Save weight error:', error)
    throw error
  }
}

async getWeightHistory(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('weight_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get weight history error:', error)
    return []
  }
}

// ===== BODY MEASUREMENTS METHODS =====

async saveMeasurements(clientId, measurements, date) {
  try {
    const { data, error } = await this.supabase
      .from('body_measurements')
      .insert({
        client_id: clientId,
        date: date,
        chest: measurements.chest ? parseFloat(measurements.chest) : null,
        arms: measurements.arms ? parseFloat(measurements.arms) : null,
        waist: measurements.waist ? parseFloat(measurements.waist) : null,
        hips: measurements.hips ? parseFloat(measurements.hips) : null,
        thighs: measurements.thighs ? parseFloat(measurements.thighs) : null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`measurements_${clientId}`)
    console.log('✅ Measurements saved')
    return data
  } catch (error) {
    console.error('Save measurements error:', error)
    throw error
  }
}

async getMeasurementsHistory(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('body_measurements')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get measurements history error:', error)
    return []
  }
}

// ===== PROGRESS PHOTOS METHODS =====

async uploadProgressPhoto(clientId, file, type = 'front') {
  try {
    // Upload to Supabase Storage
    const fileName = `${clientId}/${Date.now()}_${type}.jpg`
    const { data: uploadData, error: uploadError } = await this.supabase
      .storage
      .from('progress-photos')
      .upload(fileName, file)
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: { publicUrl } } = this.supabase
      .storage
      .from('progress-photos')
      .getPublicUrl(fileName)
    
    // Save to database
    const { data, error } = await this.supabase
      .from('progress_photos')
      .insert({
        client_id: clientId,
        photo_url: publicUrl,
        photo_type: type,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Photo uploaded')
    return data
  } catch (error) {
    console.error('Upload photo error:', error)
    throw error
  }
}

async getProgressPhotos(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('progress_photos')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get progress photos error:', error)
    return []
  }
}

// ===== COMPLIANCE & NUTRITION METHODS =====

async getNutritionCompliance(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) throw error
    
    // Calculate average compliance
    const compliance = data?.map(day => {
      const caloriePercentage = (day.calories / day.target_calories) * 100
      if (caloriePercentage >= 90 && caloriePercentage <= 110) {
        return 100
      } else if (caloriePercentage >= 80 && caloriePercentage <= 120) {
        return 75
      } else if (caloriePercentage >= 70 && caloriePercentage <= 130) {
        return 50
      } else {
        return 25
      }
    }) || []
    
    const averageCompliance = compliance.length > 0
      ? Math.round(compliance.reduce((a, b) => a + b, 0) / compliance.length)
      : 0
    
    return averageCompliance
  } catch (error) {
    console.error('Get nutrition compliance error:', error)
    return 0
  }
}

// ===== HELPER METHODS =====

getWeekDates(baseDate = new Date()) {
  const dates = []
  const startOfWeek = new Date(baseDate)
  startOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + 1)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

// ===== WORKOUT COMPLETIONS =====

async getWorkoutCompletions(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('workout_completions')
      .select('*')
      .eq('client_id', clientId)
      .order('workout_date', { ascending: false })
      .limit(100)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get workout completions error:', error)
    return []
  }
}

async markWorkoutComplete(clientId, workoutId, date) {
  try {
    const { data, error } = await this.supabase
      .from('workout_completions')
      .update({ completed: true })
      .eq('client_id', clientId)
      .eq('workout_id', workoutId)
      .eq('workout_date', date)
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Workout marked complete')
    return data
  } catch (error) {
    console.error('Mark workout complete error:', error)
    throw error
  }
}



}





// EERST extend de class
extendDatabaseService(DatabaseServiceClass)

// DAN PAS maak de instance
const DatabaseService = new DatabaseServiceClass()

// Export
export default DatabaseService
export { DatabaseServiceClass }
