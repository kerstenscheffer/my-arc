// src/services/DatabaseService.js
// CENTRAAL DATABASE SERVICE VOOR MY ARC
// Alle database operaties via deze service

import { supabase } from '../lib/supabase'
import ProgressService from '../modules/progress/ProgressService'

class DatabaseService {
  // ===== SINGLETON PATTERN =====

  static instance = null
  
  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  constructor() {
    this.cache = new Map()
    this.listeners = new Map()
  }
async logWorkoutProgress(data) {
  return ProgressService.logWorkoutProgress(data)
}

async getClientProgress(clientId, dateRange) {
  return ProgressService.getClientProgressByDate(clientId, dateRange)
}

async getProgressStats(clientId) {
  return ProgressService.getProgressStats(clientId)
} 
  // ===== CACHE MANAGEMENT =====
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  getCached(key) {
    return this.cache.get(key)
  }

  setCached(key, data) {
    this.cache.set(key, data)
    this.notifyListeners(key, data)
  }

  // ===== EVENT SYSTEM =====
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key).add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback)
    }
  }

  notifyListeners(key, data) {
    this.listeners.get(key)?.forEach(callback => callback(data))
  }

  // ===== AUTH OPERATIONS =====
  async getCurrentUser() {
    const cached = this.getCached('currentUser')
    if (cached) return cached

    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      
      const userData = user ? {
        ...user,
        profile: {
          email: user.email,
          naam: user.email.split('@')[0]
        }
      } : null
      
      this.setCached('currentUser', userData)
      return userData
    } catch (error) {
      console.error('❌ getCurrentUser failed:', error)
      throw error
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      if (error) throw error
      
      // Clear cache to refresh user data
      this.clearCache()
      
      return { data, error: null }
    } catch (error) {
      console.error('❌ signIn failed:', error)
      return { data: null, error }
    }
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    this.clearCache()
    return true
  }

  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ resetPassword failed:', error)
      return { data: null, error }
    }
  }

  // ===== CLIENT OPERATIONS =====
 



 async getClients(trainerId = null) {
    try {
      const userId = trainerId || (await this.getCurrentUser())?.id
      if (!userId) throw new Error('No trainer ID')

      const cacheKey = `clients_${userId}`
      const cached = this.getCached(cacheKey)
      if (cached) return cached

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const clients = data || []
      this.setCached(cacheKey, clients)
      return clients
    } catch (error) {
      console.error('❌ getClients failed:', error)
      throw error
    }
  }

  async getClient(clientId) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ getClient failed:', error)
      throw error
    }
  }

  async createClient(clientData, trainerId) {
    try {
      // Create auth user
      const tempPassword = clientData.password || 'Welcome123!'
      const { data: authResponse, error: authError } = await supabase.auth.signUp({
        email: clientData.email,
        password: tempPassword
      })

      if (authError) throw authError

      // Create client record
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          trainer_id: trainerId,
          first_name: clientData.firstName,
          last_name: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone,
          goal: clientData.goal,
          experience: clientData.experience,
          current_weight: clientData.current_weight,
          height: clientData.height,
          days_per_week: clientData.days_per_week,
          meal_preferences: clientData.meal_preferences,
          injuries: clientData.injuries,
          medical_notes: clientData.medical_notes,
          status: 'active'
        }])
        .select()
        .single()

      if (error) throw error

      // Clear cache to force refresh
      this.clearCache(`clients_${trainerId}`)
      
      return {
        client: data,
        loginCredentials: {
          email: clientData.email,
          password: tempPassword
        }
      }
    } catch (error) {
      console.error('❌ createClient failed:', error)
      throw error
    }
  }

  async updateClient(clientId, updates) {
    try {
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined && v !== '')
      )

      const { data, error } = await supabase
        .from('clients')
        .update({
          ...cleanedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single()

      if (error) throw error

      // Clear relevant caches
      this.clearCache()
      
      return data
    } catch (error) {
      console.error('❌ updateClient failed:', error)
      throw error
    }
  }

  // ===== WORKOUT OPERATIONS =====
  async getWorkoutSchemas(userId = null) {
    try {
      const query = supabase
        .from('workout_schemas')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query.eq('created_by', userId)
      }

      const { data, error } = await query
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('❌ getWorkoutSchemas failed:', error)
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
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ getClientByEmail failed:', error)
    return null
  }
}

async getClientSchema(clientId) {
  try {
    const { data, error } = await supabase
      .from('client_workout_plans')
      .select(`
        *,
        workout_schemas (*)
      `)
      .eq('client_id', clientId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.workout_schemas || null
  } catch (error) {
    console.error('❌ getClientSchema failed:', error)
    return null
  }
}
  async assignWorkoutToClient(clientId, schemaId) {
    try {
      // First check if assignment exists
      const { data: existing } = await supabase
        .from('client_workout_plans')
        .select('id')
        .eq('client_id', clientId)
        .single()

      let result
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('client_workout_plans')
          .update({
            schema_id: schemaId,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        // Create new
        const { data, error } = await supabase
          .from('client_workout_plans')
          .insert([{
            client_id: clientId,
            schema_id: schemaId,
            start_date: new Date().toISOString()
          }])
          .select()
          .single()
        
        if (error) throw error
        result = data
      }

      this.clearCache()
      return result
    } catch (error) {
      console.error('❌ assignWorkoutToClient failed:', error)
      throw error
    }
  }

  // ===== MEAL PLAN OPERATIONS =====
  async getMealPlanTemplates() {
    try {
      const { data, error } = await supabase
        .from('meal_plan_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ getMealPlanTemplates failed:', error)
      throw error
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
      console.error('❌ getClientMealPlan failed:', error)
      return null
    }
  }

  async saveMealPlan(clientId, planData) {
    try {
      // Check if plan exists
      const existing = await this.getClientMealPlan(clientId)

      let result
      if (existing) {
        // Update
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
        // Create
        const { data, error } = await supabase
          .from('client_meal_plans')
          .insert([{
            client_id: clientId,
            ...planData,
            created_at: new Date().toISOString()
          }])
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

  // ===== PROGRESS OPERATIONS =====
  async getClientProgress(clientId, dateRange = null) {
    try {
      let query = supabase
        .from('workout_progress')
        .select('*')
        .eq('client_id', clientId)
        .order('workout_date', { ascending: false })

      if (dateRange) {
        query = query
          .gte('workout_date', dateRange.from)
          .lte('workout_date', dateRange.to)
      }

      const { data, error } = await query
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('❌ getClientProgress failed:', error)
      return []
    }
  }

  async saveProgress(progressData) {
    try {
      const { data, error } = await supabase
        .from('workout_progress')
        .insert([{
          ...progressData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      this.clearCache()
      return data
    } catch (error) {
      console.error('❌ saveProgress failed:', error)
      throw error
    }
  }

  // ===== NOTIFICATION OPERATIONS =====
  async getNotifications(clientId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', clientId)
        .eq('read', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ getNotifications failed:', error)
      return []
    }
  }

  async sendNotification(clientId, type, message) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          client_id: clientId,
          type,
          message,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ sendNotification failed:', error)
      throw error
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ markNotificationRead failed:', error)
      throw error
    }
  }

  // ===== BONUS CONTENT OPERATIONS =====
  async getClientBonuses(clientId) {
    try {
      const { data, error } = await supabase
        .from('client_bonuses')
        .select(`
          *,
          bonuses (*)
        `)
        .eq('client_id', clientId)
        .order('assigned_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ getClientBonuses failed:', error)
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
          assigned_date: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      this.clearCache()
      return data
    } catch (error) {
      console.error('❌ assignBonus failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export default DatabaseService.getInstance()
export { ProgressService }
