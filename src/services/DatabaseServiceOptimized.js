// src/services/DatabaseServiceOptimized.js
// Uitbreidingen voor DatabaseService met caching en batch operations

class OptimizedDatabaseService {
  constructor() {
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

  // ===== OPTIMIZED WEIGHT METHODS =====
  async getWeightHistory(clientId, days = 30, useCache = true) {
    const cacheKey = this.getCacheKey('getWeightHistory', clientId, days)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await supabase
        .from('weight_tracking')
        .select('weight, date, created_at')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
      
      if (error) throw error
      
      // Remove duplicates (keep latest per day)
      const uniqueByDate = {}
      data?.forEach(entry => {
        if (!uniqueByDate[entry.date] || 
            new Date(entry.created_at) > new Date(uniqueByDate[entry.date].created_at)) {
          uniqueByDate[entry.date] = entry
        }
      })
      
      const result = Object.values(uniqueByDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      
      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('Get weight history error:', error)
      return []
    }
  }

  async saveWeight(clientId, weight, date) {
    // Clear relevant cache
    this.clearCache(`getWeightHistory_${clientId}`)
    this.clearCache(`getLatestWeight_${clientId}`)
    
    try {
      const { data, error } = await supabase
        .from('weight_tracking')
        .upsert({
          client_id: clientId,
          weight: parseFloat(weight),
          date: date
        }, {
          onConflict: 'client_id,date'
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Also update client_goals if exists
      this.addToBatch(async () => {
        await supabase
          .from('client_goals')
          .update({
            current_value: weight,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId)
          .eq('goal_type', 'weight')
      })
      
      return data
    } catch (error) {
      console.error('Save weight error:', error)
      throw error
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
      
      const { data, error } = await supabase
        .from('workout_progress')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(100) // Limit for performance
      
      if (error) throw error
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('Get workout progress error:', error)
      return []
    }
  }

  async getClientProgressByDate(clientId, date, useCache = true) {
    const cacheKey = this.getCacheKey('getClientProgressByDate', clientId, date)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const { data, error } = await supabase
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

  // ===== OPTIMIZED GOALS METHODS =====
  async getClientGoals(clientId, useCache = true) {
    const cacheKey = this.getCacheKey('getClientGoals', clientId)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('exercise_goals')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('Get exercise goals error:', error)
      return []
    }
  }

  // ===== BATCH SAVE OPERATIONS =====
  async saveWeightGoal(clientId, currentWeight, targetWeight) {
    // Clear cache
    this.clearCache(`getClientGoals_${clientId}`)
    
    try {
      // Check if goal exists to preserve start_value
      const { data: existingGoal } = await supabase
        .from('client_goals')
        .select('start_value')
        .eq('client_id', clientId)
        .eq('goal_type', 'weight')
        .single()
      
      const startValue = existingGoal?.start_value || currentWeight
      
      const { data, error } = await supabase
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

  // ===== LAZY LOADING METHODS =====
  async getExerciseProgress(clientId, exerciseName, limit = 10) {
    try {
      const { data, error } = await supabase
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

  // ===== NEW METHODS FOR MISSING FEATURES =====
  
  // Body Measurements
  async saveMeasurements(clientId, measurements, date) {
    this.clearCache(`getMeasurementsHistory_${clientId}`)
    
    try {
      const { data, error } = await supabase
        .from('body_measurements')
        .upsert({
          client_id: clientId,
          date: date,
          ...measurements,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,date'
        })
        .select()
        .single()
      
      if (error) throw error
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
      
      const { data, error } = await supabase
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

  // Achievements
  async getAchievements(clientId, useCache = true) {
    const cacheKey = this.getCacheKey('getAchievements', clientId)
    
    if (useCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }
    
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('client_id', clientId)
        .order('achieved_at', { ascending: false })
      
      if (error) throw error
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('Get achievements error:', error)
      return []
    }
  }
}

// Export singleton instance
const OptimizedDB = new OptimizedDatabaseService()

// Extend existing DatabaseService
export function extendDatabaseService(DatabaseService) {
  // Add optimized methods to existing service
  Object.getOwnPropertyNames(OptimizedDatabaseService.prototype).forEach(name => {
    if (name !== 'constructor') {
      DatabaseService.prototype[name] = OptimizedDatabaseService.prototype[name]
    }
  })
  
  // Initialize cache and batch queue
  DatabaseService.prototype.cache = new Map()
  DatabaseService.prototype.batchQueue = []
  DatabaseService.prototype.cacheTimeout = 5 * 60 * 1000
  DatabaseService.prototype.batchDelay = 100
  
  return DatabaseService
}

export default OptimizedDB
