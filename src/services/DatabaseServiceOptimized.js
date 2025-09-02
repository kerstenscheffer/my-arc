// src/services/DatabaseServiceOptimized.js
// FIXED VERSION - Alle supabase references gefixed + import toegevoegd

import { supabase } from '../lib/supabase'

class DatabaseServiceOptimized {
  constructor() {
    // Store supabase reference
    this.supabase = supabase
    
    // In-memory cache
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    
    // Batch operation queue
    this.batchQueue = []
    this.batchTimeout = null
    this.batchDelay = 100 // ms
  }

  // ===== CACHE MANAGEMENT =====
  getCacheKey(method, ...args) {
    return `${method}_${JSON.stringify(args)}`
  }

  getFromCache(key) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    const age = Date.now() - cached.timestamp
    if (age > this.cacheTimeout) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear()
      return
    }
    
    // Clear specific cache entries
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  // ===== BATCH OPERATIONS =====
  addToBatch(operation) {
    this.batchQueue.push(operation)
    
    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }
    
    // Set new timeout for batch execution
    this.batchTimeout = setTimeout(() => {
      this.executeBatch()
    }, this.batchDelay)
  }

  async executeBatch() {
    if (this.batchQueue.length === 0) return
    
    const operations = [...this.batchQueue]
    this.batchQueue = []
    
    try {
      // Execute all operations in parallel
      await Promise.all(operations.map(op => op()))
    } catch (error) {
      console.error('Batch execution error:', error)
    }
  }

// ========================================
// FIX voor DatabaseServiceOptimized.js
// Voeg deze methods toe of vervang bestaande
// ========================================

// ===== WEIGHT TRACKING (FIXED VERSION) =====
async saveWeight(clientId, weight, date) {
  try {
    // Clear cache first
    this.clearClientCache(clientId)
    
    // First check if entry exists
    const { data: existing } = await this.supabase
      .from('weight_history')
      .select('id')
      .eq('client_id', clientId)
      .eq('date', date)
      .single()
    
    if (existing) {
      // UPDATE existing entry
      console.log('Updating existing weight for date:', date)
      const { data, error } = await this.supabase
        .from('weight_history')
        .update({ 
          weight: parseFloat(weight),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Weight updated successfully')
      return data
    } else {
      // INSERT new entry
      console.log('Creating new weight entry for date:', date)
      const { data, error } = await this.supabase
        .from('weight_history')
        .insert({
          client_id: clientId,
          date: date,
          weight: parseFloat(weight)
        })
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Weight created successfully')
      return data
    }
  } catch (error) {
    console.error('Save weight error:', error)
    throw error
  }
}

// Alternative versie die ALTIJD werkt:
async saveWeightSafe(clientId, weight, date) {
  try {
    // Eerst checken of record bestaat
    const { data: existing } = await this.supabase
      .from('weight_history')
      .select('id')
      .eq('client_id', clientId)
      .eq('date', date)
      .single()
    
    if (existing) {
      // Update existing
      const { data, error } = await this.supabase
        .from('weight_history')
        .update({ weight: parseFloat(weight) })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } else {
      // Insert new
      const { data, error } = await this.supabase
        .from('weight_history')
        .insert({
          client_id: clientId,
          date: date,
          weight: parseFloat(weight)
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('Save weight safe error:', error)
    throw error
  }
}

// ===== WORKOUT COMPLETIONS (FIXED) =====
async markWorkoutComplete(clientId, date, duration, notes) {
  try {
    // Check if duration_minutes column exists by trying insert
    const { data, error } = await this.supabase
      .from('workout_completions')
      .upsert({
        client_id: clientId,
        workout_date: date,
        completed: true,
        duration_minutes: duration || null,  // Safe: gebruik null als niet gegeven
        notes: notes || null
      })
      .select()
      .single()
    
    if (error) {
      // Als duration_minutes niet bestaat, probeer zonder
      console.warn('Duration column issue, trying without:', error)
      const { data: fallbackData, error: fallbackError } = await this.supabase
        .from('workout_completions')
        .upsert({
          client_id: clientId,
          workout_date: date,
          completed: true,
          notes: notes || null
        })
        .select()
        .single()
      
      if (fallbackError) throw fallbackError
      return fallbackData
    }
    
    return data
  } catch (error) {
    console.error('Mark workout complete error:', error)
    throw error
  }
}

// ===== ADD DEZE HELPER METHODS ALS ZE MISSEN =====

async getWeightHistory(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('weight_history')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get weight history error:', error)
    return []
  }
}

async getMeasurementsHistory(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('measurements')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get measurements error:', error)
    return []
  }
}

async getWorkoutCompletions(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('workout_completions')
      .select('*')
      .eq('client_id', clientId)
      .order('workout_date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get workout completions error:', error)
    return []
  }
}

async getClientGoals(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('client_goals')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Ensure all goals have a status
    return (data || []).map(goal => ({
      ...goal,
      status: goal.status || 'active'
    }))
  } catch (error) {
    console.error('Get client goals error:', error)
    return []
  }
}

async saveGoal(goalData) {
  try {
    const { data, error } = await this.supabase
      .from('client_goals')
      .upsert(goalData)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Save goal error:', error)
    throw error
  }
}

async getWorkoutProgress(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('workout_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false })
    
    if (error) throw error
    
    // Process data
    const exercises = data || []
    const prs = []
    const exerciseHistory = []
    const weekProgress = {}
    
    exercises.forEach(ex => {
      exerciseHistory.push(ex)
      
      const weekDay = new Date(ex.date).toISOString().split('T')[0]
      if (!weekProgress[weekDay]) weekProgress[weekDay] = []
      weekProgress[weekDay].push(ex)
      
      if (ex.sets && Array.isArray(ex.sets)) {
        const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0))
        if (maxWeight > 0) {
          prs.push({
            name: ex.exercise_name,
            weight: maxWeight,
            date: ex.date
          })
        }
      }
    })
    
    prs.sort((a, b) => b.weight - a.weight)
    
    return {
      exercises: exerciseHistory,
      prs: prs.slice(0, 5),
      weekProgress
    }
  } catch (error) {
    console.error('Get workout progress error:', error)
    return { exercises: [], prs: [], weekProgress: {} }
  }
}

async saveWorkoutProgress(progressData) {
  try {
    const { data, error } = await this.supabase
      .from('workout_progress')
      .upsert(progressData)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Save workout progress error:', error)
    throw error
  }
}

async getClientProgressByDate(clientId, date) {
  try {
    const { data, error } = await this.supabase
      .from('workout_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get progress by date error:', error)
    return []
  }
}

async getExerciseHistory(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('workout_progress')
      .select('exercise_name')
      .eq('client_id', clientId)
    
    if (error) throw error
    if (!data) return []
    
    // Get unique exercise names
    return [...new Set(data.map(d => d.exercise_name))]
  } catch (error) {
    console.error('Get exercise history error:', error)
    return []
  }
}

async getTodayWorkout(clientId) {
  try {
    const today = new Date()
    const dayOfWeek = today.getDay() || 7 // Sunday = 7
    
    const { data, error } = await this.supabase
      .from('client_workouts')
      .select('*')
      .eq('client_id', clientId)
      .eq('day_of_week', dayOfWeek)
    
    if (error) throw error
    return data?.[0] || null
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
      .from('workout_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false })
      .limit(10)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get recent workouts error:', error)
    return []
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

async getAchievements(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('client_id', clientId)
      .order('achieved_date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get achievements error:', error)
    return []
  }
}

async getTodaysMealProgress(clientId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await this.supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', today)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // Ignore "no rows" error
    
    return data || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      water_glasses: 0,
      target_calories: 2000,
      target_protein: 150,
      target_carbs: 250,
      target_fat: 70,
      meals: []
    }
  } catch (error) {
    console.error('Get todays meal progress error:', error)
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      target_calories: 2000,
      meals: []
    }
  }
}

async getMealHistory(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get meal history error:', error)
    return []
  }
}

async getClientStreak(clientId) {
  try {
    const { data: completions } = await this.supabase
      .from('workout_completions')
      .select('workout_date')
      .eq('client_id', clientId)
      .eq('completed', true)
      .order('workout_date', { ascending: false })
      .limit(100)
    
    if (!completions || completions.length === 0) return 0
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sortedDates = completions
      .map(w => new Date(w.workout_date))
      .sort((a, b) => b - a)
    
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const firstDateStr = sortedDates[0].toISOString().split('T')[0]
    
    if (firstDateStr === todayStr || firstDateStr === yesterdayStr) {
      streak = 1
      let lastDate = sortedDates[0]
      
      for (let i = 1; i < sortedDates.length; i++) {
        const dayDiff = (lastDate - sortedDates[i]) / (1000 * 60 * 60 * 24)
        
        if (dayDiff <= 1.5) {
          streak++
          lastDate = sortedDates[i]
        } else {
          break
        }
      }
    }
    
    return streak
  } catch (error) {
    console.error('Get client streak error:', error)
    return 0
  }
}
  // ===== OPTIMIZED WORKOUT METHODS =====
  async getWorkoutProgress(clientId, dateRange = 30, useCache = true) {
    const cacheKey = this.getCacheKey('getWorkoutProgress', clientId, dateRange)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - dateRange)
      
      // Get workout progress records
      const { data: progressData, error: progressError } = await this.supabase  // ⭐ FIXED
        .from('workout_progress')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(100)
      
      if (progressError) throw progressError
      
      // Get completions
      const { data: completions, error: completionsError } = await this.supabase  // ⭐ FIXED
        .from('workout_completions')
        .select('*')
        .eq('client_id', clientId)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .order('workout_date', { ascending: false })
      
      if (completionsError) console.warn('Completions query failed:', completionsError)
      
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
          r.sets?.map(s => parseFloat(s.weight) || 0) || [0]
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
      
      const result = {
        exercises: progressData || [],
        completions: completions || [],
        prs: prs.slice(0, 10),
        weekProgress
      }
      
      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('Get workout progress error:', error)
      return { exercises: [], completions: [], prs: [], weekProgress: {} }
    }
  }

  async saveWorkoutProgress(data) {
    // Clear cache
    this.clearCache(`getWorkoutProgress_${data.client_id}`)
    this.clearCache(`getClientProgressByDate_${data.client_id}`)
    
    try {
      const { data: result, error } = await this.supabase  // ⭐ FIXED
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
      console.log('✅ Workout progress saved')
      return result
    } catch (error) {
      console.error('Save workout progress error:', error)
      throw error
    }
  }

  async getClientProgressByDate(clientId, date, useCache = true) {
    const cacheKey = this.getCacheKey('getClientProgressByDate', clientId, date)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('workout_progress')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', date)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('Get progress by date error:', error)
      return []
    }
  }

  // ===== GOALS METHODS =====
  async getClientGoals(clientId, useCache = true) {
    const cacheKey = this.getCacheKey('getClientGoals', clientId)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('client_goals')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('Get client goals error:', error)
      return []
    }
  }

  async getExerciseGoals(clientId, useCache = true) {
    const cacheKey = this.getCacheKey('getExerciseGoals', clientId)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('exercise_goals')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false })
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Exercise goals table might not exist:', error)
      }
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('Get exercise goals error:', error)
      return []
    }
  }

  async saveWeightGoal(clientId, currentWeight, targetWeight) {
    // Clear cache
    this.clearCache(`getClientGoals_${clientId}`)
    
    try {
      // Check if goal exists to preserve start_value
      const { data: existingGoal } = await this.supabase  // ⭐ FIXED
        .from('client_goals')
        .select('start_value')
        .eq('client_id', clientId)
        .eq('goal_type', 'weight')
        .single()
      
      const startValue = existingGoal?.start_value || currentWeight
      
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('client_goals')
        .upsert({
          client_id: clientId,
          goal_type: 'weight',
          current_value: currentWeight,
          target_value: targetWeight,
          start_value: startValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,goal_type'
        })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Save weight goal error:', error)
      throw error
    }
  }

  // ===== BODY MEASUREMENTS =====
  async saveMeasurements(clientId, measurements, date) {
    this.clearCache(`getMeasurementsHistory_${clientId}`)
    
    try {
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('body_measurements')
        .upsert({
          client_id: clientId,
          date: date,
          chest: measurements.chest ? parseFloat(measurements.chest) : null,
          arms: measurements.arms ? parseFloat(measurements.arms) : null,
          waist: measurements.waist ? parseFloat(measurements.waist) : null,
          hips: measurements.hips ? parseFloat(measurements.hips) : null,
          thighs: measurements.thighs ? parseFloat(measurements.thighs) : null,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,date'
        })
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Measurements saved')
      return data
    } catch (error) {
      console.error('Save measurements error:', error)
      throw error
    }
  }

  async getMeasurementsHistory(clientId, days = 30, useCache = true) {
    const cacheKey = this.getCacheKey('getMeasurementsHistory', clientId, days)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('body_measurements')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
      
      if (error) throw error
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('Get measurements history error:', error)
      return []
    }
  }

  // ===== ACHIEVEMENTS =====
  async getAchievements(clientId, useCache = true) {
    const cacheKey = this.getCacheKey('getAchievements', clientId)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('achievements')
        .select('*')
        .eq('client_id', clientId)
        .order('achieved_at', { ascending: false })
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Achievements table might not exist:', error)
      }
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('Get achievements error:', error)
      return []
    }
  }

  // ===== NUTRITION METHODS =====
  async getTodaysMealProgress(clientId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's meal progress
      const { data: mealProgress, error } = await this.supabase  // ⭐ FIXED
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
      const { data: waterData } = await this.supabase  // ⭐ FIXED
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

  async getMealHistory(clientId, days = 30, useCache = true) {
    const cacheKey = this.getCacheKey('getMealHistory', clientId, days)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('meal_progress')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
      
      if (error) throw error
      
      const result = (data || []).map(day => ({
        date: day.date,
        calories: day.calories || 0,
        protein: day.protein || 0,
        carbs: day.carbs || 0,
        fat: day.fat || 0,
        target_calories: day.target_calories || 2000
      }))
      
      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('Get meal history error:', error)
      return []
    }
  }

  async logWaterIntake(clientId, glasses) {
    this.clearCache(`getTodaysMealProgress_${clientId}`)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase  // ⭐ FIXED
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

  // ===== ADDITIONAL MISSING METHODS =====
  async getTodayWorkout(clientId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's planned workout
      const { data: completion, error: completionError } = await this.supabase  // ⭐ FIXED
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
      const { data: workout, error: workoutError } = await this.supabase  // ⭐ FIXED
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
      
      const { data, error } = await this.supabase  // ⭐ FIXED
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

  async getWorkoutCompletions(clientId) {
    try {
      const { data, error } = await this.supabase  // ⭐ FIXED
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

  async getProgressPhotos(clientId) {
    try {
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('progress_photos')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
      
      if (error && error.code !== 'PGRST116') {
        console.warn('Progress photos table might not exist:', error)
      }
      
      return data || []
    } catch (error) {
      console.error('Get progress photos error:', error)
      return []
    }
  }

  async getExerciseHistory(clientId) {
    try {
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('workout_progress')
        .select('exercise_name')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      
      // Get unique exercise names
      const uniqueExercises = [...new Set(data?.map(d => d.exercise_name) || [])]
      return uniqueExercises
    } catch (error) {
      console.error('Get exercise history error:', error)
      return []
    }
  }

  async getExerciseProgress(clientId, exerciseName, limit = 10) {
    try {
      const { data, error } = await this.supabase  // ⭐ FIXED
        .from('workout_progress')
        .select('*')
        .eq('client_id', clientId)
        .eq('exercise_name', exerciseName)
        .order('date', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get exercise progress error:', error)
      return []
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

  // ===== PERFORMANCE MONITORING =====
  async measurePerformance(operation, name) {
    const start = performance.now()
    
    try {
      const result = await operation()
      const duration = performance.now() - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DB Performance] ${name}: ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`[DB Error] ${name} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }

  // ===== PREFETCH METHODS =====
  async prefetchProgressData(clientId) {
    // Prefetch all common data in parallel
    const operations = [
      this.getWeightHistory(clientId, 30, false),
      this.getClientGoals(clientId, false),
      this.getExerciseGoals(clientId, false),
      this.getWorkoutProgress(clientId, 7, false)
    ]
    
    await Promise.all(operations)
    console.log('Progress data prefetched and cached')
  }
}




// Helemaal onderaan DatabaseServiceOptimized.js, NA de class:

// Export function voor extending
export function extendDatabaseService(DatabaseServiceClass) {
  const optimized = new DatabaseServiceOptimized()
  
  // Copy all methods to the target class
  Object.getOwnPropertyNames(Object.getPrototypeOf(optimized)).forEach(name => {
    if (name !== 'constructor') {
      DatabaseServiceClass.prototype[name] = function(...args) {
        return optimized[name].apply(optimized, args)
      }
    }
  })
  
  // Add cache properties
  DatabaseServiceClass.prototype.cache = optimized.cache
  DatabaseServiceClass.prototype.batchQueue = optimized.batchQueue
  DatabaseServiceClass.prototype.cacheTimeout = optimized.cacheTimeout
  DatabaseServiceClass.prototype.batchDelay = optimized.batchDelay
  
  return DatabaseServiceClass
}

// Export singleton instance
export default new DatabaseServiceOptimized()
