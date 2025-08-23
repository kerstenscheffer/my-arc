// src/modules/progress/ProgressService.js
// MY ARC Progress Module - Database Service Layer (FIXED VERSION)
// No circular dependencies - direct Supabase access

import { createClient } from '@supabase/supabase-js'

class ProgressService {
  constructor() {
    // Direct Supabase initialization to avoid circular dependency
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.eventListeners = new Map()
  }

  // Event system
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(data))
    }
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  // ===== WORKOUT PROGRESS =====
  
  async logWorkoutProgress(progressData) {
    try {
      const { data, error } = await this.supabase
        .from('workout_progress')
        .insert([{
          client_id: progressData.clientId,
          date: progressData.date,
          exercise_name: progressData.exerciseName,
          sets: progressData.sets,
          notes: progressData.notes,
          coach_suggestion: progressData.coachSuggestion || null,
          rating: progressData.rating || null,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      // Clear cache for this client
      this.clearClientCache(progressData.clientId)
      
      // Emit event for real-time updates
      this.emit('workout_logged', { clientId: progressData.clientId, data })
      
      console.log('✅ Workout progress logged:', data)
      return data
    } catch (error) {
      console.error('❌ Log progress error:', error)
      throw error
    }
  }

  async getClientProgressByDate(clientId, date) {
    const cacheKey = `progress_${clientId}_${date}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }
    
    try {
      const { data, error } = await this.supabase
        .from('workout_progress')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', date)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: data || [],
        timestamp: Date.now()
      })
      
      return data || []
    } catch (error) {
      console.error('❌ Get progress by date error:', error)
      return []
    }
  }

  async getExerciseProgress(clientId, exerciseName, limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('workout_progress')
        .select('*')
        .eq('client_id', clientId)
        .eq('exercise_name', exerciseName)
        .order('date', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get exercise progress error:', error)
      return []
    }
  }

  async getClientExercises(clientId) {
    const cacheKey = `exercises_${clientId}`
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }
    
    try {
      const { data, error } = await this.supabase
        .from('workout_progress')
        .select('exercise_name')
        .eq('client_id', clientId)
      
      if (error) throw error
      
      const uniqueExercises = [...new Set((data || []).map(d => d.exercise_name))]
      
      this.cache.set(cacheKey, {
        data: uniqueExercises,
        timestamp: Date.now()
      })
      
      return uniqueExercises
    } catch (error) {
      console.error('❌ Get exercises error:', error)
      return []
    }
  }

  async getCoachFeedback(clientId, exerciseName = null) {
    try {
      let query = this.supabase
        .from('workout_progress')
        .select('exercise_name, coach_suggestion, date, rating')
        .eq('client_id', clientId)
        .not('coach_suggestion', 'is', null)
        .order('date', { ascending: false })
        .limit(10)
      
      if (exerciseName) {
        query = query.eq('exercise_name', exerciseName)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get coach feedback error:', error)
      return []
    }
  }

  async addCoachFeedback(progressId, feedback) {
    try {
      const { data, error } = await this.supabase
        .from('workout_progress')
        .update({
          coach_suggestion: feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId)
        .select()
        .single()
      
      if (error) throw error
      
      // Emit event for real-time updates
      this.emit('coach_feedback_added', { progressId, feedback })
      
      return data
    } catch (error) {
      console.error('❌ Add coach feedback error:', error)
      throw error
    }
  }

  // ===== WEIGHT TRACKING =====

  async logWeightUpdate(clientId, weight, date = null) {
    try {
      const trackingDate = date || new Date().toISOString().split('T')[0]
      
      // Insert weight tracking record
      const { data: weightData, error: weightError } = await this.supabase
        .from('weight_tracking')
        .insert({
          client_id: clientId,
          weight: weight,
          date: trackingDate,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (weightError) throw weightError
      
      // Update current value in client_goals
      await this.supabase
        .from('client_goals')
        .update({
          current_value: weight,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('goal_type', 'weight')
      
      // Clear cache
      this.clearClientCache(clientId)
      
      // Emit event
      this.emit('weight_updated', { clientId, weight })
      
      return weightData
    } catch (error) {
      console.error('❌ Log weight update error:', error)
      throw error
    }
  }

  async getWeightHistory(clientId, limit = 30) {
    const cacheKey = `weight_${clientId}`
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }
    
    try {
      const { data, error } = await this.supabase
        .from('weight_tracking')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      this.cache.set(cacheKey, {
        data: data || [],
        timestamp: Date.now()
      })
      
      return data || []
    } catch (error) {
      console.error('❌ Get weight history error:', error)
      return []
    }
  }

  // ===== GOALS MANAGEMENT =====

  async getClientGoals(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_goals')
        .select('*')
        .eq('client_id', clientId)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get client goals error:', error)
      return []
    }
  }

  async saveClientGoal(clientId, goalType, targetValue, currentValue = null) {
    try {
      const { data, error } = await this.supabase
        .from('client_goals')
        .upsert({
          client_id: clientId,
          goal_type: goalType,
          target_value: targetValue,
          current_value: currentValue,
          start_value: currentValue,
          updated_at: new Date().toISOString()
        }, { onConflict: 'client_id,goal_type' })
        .select()
        .single()
      
      if (error) throw error
      
      // Emit event
      this.emit('goal_updated', { clientId, goalType, targetValue })
      
      return data
    } catch (error) {
      console.error('❌ Save client goal error:', error)
      throw error
    }
  }

  async getExerciseGoals(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('exercise_goals')
        .select('*')
        .eq('client_id', clientId)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get exercise goals error:', error)
      return []
    }
  }

  async saveExerciseGoal(clientId, exerciseName, goalType, currentValue, targetValue) {
    try {
      const { data, error } = await this.supabase
        .from('exercise_goals')
        .upsert({
          client_id: clientId,
          exercise_name: exerciseName,
          goal_type: goalType,
          current_value: currentValue,
          target_value: targetValue,
          updated_at: new Date().toISOString()
        }, { onConflict: 'client_id,exercise_name' })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Save exercise goal error:', error)
      throw error
    }
  }

  // ===== ACCOUNTABILITY =====

  async markWorkoutComplete(clientId, date) {
    try {
      const { data, error } = await this.supabase
        .from('workout_completion')
        .insert({
          client_id: clientId,
          workout_date: date,
          completed: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Emit event for accountability system
      this.emit('workout_completed', { clientId, date })
      
      console.log('✅ Workout marked as complete')
      return data
    } catch (error) {
      console.error('❌ Mark workout complete error:', error)
      throw error
    }
  }

  async getWorkoutCompletions(clientId, dateRange = null) {
    try {
      let query = this.supabase
        .from('workout_completion')
        .select('*')
        .eq('client_id', clientId)
        .order('workout_date', { ascending: false })
      
      if (dateRange) {
        if (dateRange.from) query = query.gte('workout_date', dateRange.from)
        if (dateRange.to) query = query.lte('workout_date', dateRange.to)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get workout completions error:', error)
      return []
    }
  }

  // ===== ANALYTICS & CALCULATIONS =====

  async calculateWeeklyStreak(clientId, targetWorkouts = 4) {
    try {
      let streak = 0
      let weekOffset = 0
      const maxWeeks = 52
      
      while (weekOffset < maxWeeks) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1 - (weekOffset * 7))
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        const completions = await this.getWorkoutCompletions(clientId, {
          from: weekStart.toISOString().split('T')[0],
          to: weekEnd.toISOString().split('T')[0]
        })
        
        if (completions.length >= targetWorkouts) {
          streak++
          weekOffset++
        } else {
          break
        }
      }
      
      return streak
    } catch (error) {
      console.error('❌ Calculate streak error:', error)
      return 0
    }
  }

  async getProgressStats(clientId, dateRange = null) {
    try {
      const [workouts, weight, goals] = await Promise.all([
        this.getWorkoutCompletions(clientId, dateRange),
        this.getWeightHistory(clientId, 1),
        this.getClientGoals(clientId)
      ])
      
      const weightGoal = goals.find(g => g.goal_type === 'weight')
      const weeklyGoal = goals.find(g => g.goal_type === 'weekly_workouts')
      
      return {
        totalWorkouts: workouts.length,
        currentWeight: weight[0]?.weight || null,
        weightTarget: weightGoal?.target_value || null,
        weeklyTarget: weeklyGoal?.target_value || 4,
        lastWorkout: workouts[0]?.workout_date || null
      }
    } catch (error) {
      console.error('❌ Get progress stats error:', error)
      return null
    }
  }

  // ===== COACH FUNCTIONS =====

  async getClients(coachId) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', coachId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get clients error:', error)
      return []
    }
  }

  async getClientsProgress(coachId, dateRange = null) {
    try {
      // First get all clients for this coach
      const clients = await this.getClients(coachId)
      
      // Then get progress for each client
      const progressData = await Promise.all(
        clients.map(async (client) => {
          const stats = await this.getProgressStats(client.id, dateRange)
          return {
            ...client,
            progress: stats
          }
        })
      )
      
      return progressData
    } catch (error) {
      console.error('❌ Get clients progress error:', error)
      return []
    }
  }

  async bulkAddCoachFeedback(feedbackArray) {
    try {
      const updates = await Promise.all(
        feedbackArray.map(({ progressId, feedback }) => 
          this.addCoachFeedback(progressId, feedback)
        )
      )
      
      return updates
    } catch (error) {
      console.error('❌ Bulk add feedback error:', error)
      throw error
    }
  }

  // ===== UTILITY FUNCTIONS =====

  clearClientCache(clientId) {
    // Clear all cache entries for this client
    for (const [key] of this.cache) {
      if (key.includes(clientId)) {
        this.cache.delete(key)
      }
    }
  }

  clearAllCache() {
    this.cache.clear()
  }

  // Helper functions for data processing
  
  calculate1RM(weight, reps) {
    if (!weight || !reps || reps <= 0) return 0
    return Math.round(weight * (1 + (reps / 30))) // Epley formula
  }

  calculateVolumeLoad(sets) {
    if (!sets || !Array.isArray(sets)) return 0
    return sets.reduce((total, set) => {
      return total + ((set.weight || 0) * (set.reps || 0))
    }, 0)
  }

  getWeekDates(weekStart = new Date()) {
    const dates = []
    const monday = new Date(weekStart)
    monday.setDate(monday.getDate() - (monday.getDay() || 7) + 1)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    return dates
  }

  formatSets(sets) {
    if (!sets || sets.length === 0) return ''
    return sets.map(set => `${set.weight}kg × ${set.reps}`).join(', ')
  }

  // Get current user (for coach functions)
  async getCurrentUser() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('❌ Get current user error:', error)
      return null
    }
  }
}

// Export singleton instance
const progressService = new ProgressService()

// Also export the class for testing
export { ProgressService }

// Default export is the singleton
export default progressService
