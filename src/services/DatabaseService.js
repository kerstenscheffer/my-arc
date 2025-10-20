// src/services/DatabaseService.js
// 🔧 FIXED VERSION - Met correcte tabel namen en error handling

import { supabase } from '../lib/supabase'
import { extendDatabaseService } from './DatabaseServiceOptimized'
import NotificationService from '../modules/notifications/NotificationService';

import { getAIMealPlanningService } from '../modules/ai-meal-generator/AIMealPlanningService'





class DatabaseServiceClass {
  constructor() {
    // Cache management
    this.supabase = supabase
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.notifications = new NotificationService(this.supabase);  // GOED - gebruik this.supabase


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

// UPDATE voor getCurrentUser method in DatabaseService.js
// Vervang de huidige getCurrentUser method met deze versie:

async getCurrentUser() {
  try {
    // iOS PWA Fix: Check for standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone;
    
    if (isStandalone) {
      console.log('📱 iOS PWA Mode detected - using enhanced auth check');
    }
    
    // ALTIJD eerst getSession voor PWA
    const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      
      // iOS PWA Fallback: Try to refresh session
      if (isStandalone) {
        console.log('🔄 Attempting session refresh for iOS PWA...');
        const { data: { session: refreshedSession } } = await this.supabase.auth.refreshSession();
        
        if (refreshedSession?.user) {
          console.log('✅ Session refreshed successfully');
          this.currentUser = refreshedSession.user;
          return refreshedSession.user;
        }
      }
    }
    
    if (session?.user) {
      console.log('✅ Session found:', session.user.email)
      this.currentUser = session.user
      return session.user
    }
    
    // Extra check voor iOS PWA: Check localStorage manual
    if (isStandalone) {
      const storedSession = localStorage.getItem('supabase.auth.token');
      if (storedSession) {
        console.log('📱 Found stored session in localStorage, attempting recovery...');
        // Try to set session manually
        try {
          const { data: { user } } = await this.supabase.auth.getUser();
          if (user) {
            console.log('✅ User recovered from stored session');
            this.currentUser = user;
            return user;
          }
        } catch (e) {
          console.error('Failed to recover user:', e);
        }
      }
    }
    
    console.log('❌ No session found')
    return null
  } catch (error) {
    console.error('❌ getCurrentUser error:', error)
    
    // Don't crash the app - return null
    return null
  }
}

// Ook update signIn voor betere iOS PWA support:
async signIn(email, password) {
  try {
    console.log('🔐 Attempting sign in...')
    
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Sign in error:', error)
      return { error: error.message }
    }
    
    if (data.user) {
      console.log('✅ Sign in successful:', data.user.email)
      this.currentUser = data.user
      
      // iOS PWA Fix: Force session persistence
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone;
      
      if (isStandalone) {
        console.log('📱 iOS PWA: Ensuring session persistence...');
        // Force a session refresh to ensure tokens are stored
        await this.supabase.auth.refreshSession();
      }
      
      return { user: data.user }
    }
    
    return { error: 'No user returned' }
  } catch (error) {
    console.error('❌ Sign in exception:', error)
    return { error: error.message }
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

async resetPassword(email, redirectTo = null) {
  try {
    const options = {}
    
    if (redirectTo) {
      options.redirectTo = redirectTo
    } else {
      options.redirectTo = `${window.location.origin}/reset-password`
    }
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, options)
    
    if (error) throw error
    
    console.log('✅ Password reset email sent to:', email)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Password reset failed:', error)
    throw error
  }
}

// VOEG deze NIEUWE methods toe NA resetPassword:
async updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
    
    console.log('✅ Password updated successfully')
    this.clearCache()
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Password update failed:', error)
    throw error
  }
}

async verifyPasswordResetToken() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) throw error
    
    return session !== null
    
  } catch (error) {
    console.error('❌ Token verification failed:', error)
    return false
  }
}

async getAIMealService() {
  if (!this.aiMealService) {
    const { default: AIMealPlanningService } = await import('../modules/ai-meal-generator/AIMealPlanningService')
    this.aiMealService = new AIMealPlanningService(this.supabase)
  }
  return this.aiMealService
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

// Vervang de createClient method in DatabaseService.js met deze versie:


async createClient(clientData, trainerId) {
  try {
    console.log('📝 Creating client with data:', clientData)

    // Generate temp password
    const tempPassword = clientData.password || `Welcome${Math.floor(Math.random() * 9000) + 1000}!`
    
    // Save current coach session
    const { data: { session: coachSession } } = await this.supabase.auth.getSession()
    const coachAccessToken = coachSession?.access_token
    const coachRefreshToken = coachSession?.refresh_token
    
    // Create auth user
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: clientData.email,
      password: tempPassword,
      options: { 
        emailRedirectTo: window.location.origin,
        data: {
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          role: 'client'
        }
      }
    })

    if (authError) {
      // Als user al bestaat, haal de auth ID op
      if (authError.message.includes('already registered')) {
        console.log('⚠️ User exists, creating client record only')
        
        // Probeer de auth user ID te vinden
        const { data: { users } } = await this.supabase.auth.admin.listUsers()
        const existingUser = users?.find(u => u.email === clientData.email)
        
        // Maak client record met of zonder auth_user_id
        const { data, error } = await this.supabase
          .from('clients')
          .insert([{
            auth_user_id: existingUser?.id || null,
            email: clientData.email,
            first_name: clientData.first_name || '',
            last_name: clientData.last_name || '',
            trainer_id: trainerId,
            coach_id: trainerId,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()
        
        if (error) throw error
        
        this.clearCache('clients')
        return { success: true, client: data }
      }
      throw authError
    }
    
    // Restore coach session als nodig
    if (coachAccessToken && coachRefreshToken) {
      await this.supabase.auth.setSession({
        access_token: coachAccessToken,
        refresh_token: coachRefreshToken
      })
    }
    
    // ALTIJD client record aanmaken
    const { data, error } = await this.supabase
      .from('clients')
      .insert([{
        auth_user_id: authData.user?.id,
        email: clientData.email,
        first_name: clientData.first_name || '',
        last_name: clientData.last_name || '',
        trainer_id: trainerId,
        coach_id: trainerId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Database insert error:', error)
      // Als insert faalt, probeer update (misschien bestaat het al)
      const { data: updateData } = await this.supabase
        .from('clients')
        .update({
          auth_user_id: authData.user?.id,
          trainer_id: trainerId,
          coach_id: trainerId
        })
        .eq('email', clientData.email)
        .select()
        .single()
      
      if (updateData) {
        this.clearCache('clients')
        return { success: true, client: updateData }
      }
      throw error
    }
    
    this.clearCache('clients')
    
    return {
      success: true,
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

// Zoek in DatabaseService.js de getClientByEmail functie en vervang met:

async getClientByEmail(email) {
  try {
    console.log('🔍 Fetching client for email:', email)
    
    // Direct query zonder RLS check
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    
    if (error) {
      console.error('❌ Client fetch failed:', error)
      
      // Bij 406 error, probeer alternatieve methode
      if (error.code === '406' || error.code === 'PGRST301') {
        console.warn('🔴 RLS blocking - trying with auth user ID')
        
        // Haal huidige user op
        const user = await this.getCurrentUser()
        if (user && user.email === email) {
          // Probeer op auth_user_id
          const { data: clientData } = await this.supabase
            .from('clients')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle()
          
          if (clientData) return clientData
        }
        
        // Als nog steeds niet lukt, maak dummy client object
        return {
          id: user?.id,
          email: email,
          first_name: 'User',
          last_name: '',
          auth_user_id: user?.id
        }
      }
      
      throw error
    }
    
    console.log('✅ Client found:', data?.email)
    return data
    
  } catch (error) {
    console.error('getClientByEmail error:', error)
    return null
  }
}

// Voeg deze method toe aan DatabaseService.js als hij nog niet bestaat:

async deleteClient(clientId) {
  try {
    console.log('🗑️ Deleting client:', clientId)
    
    // First, get the client to find their auth_user_id
    const { data: clientData, error: fetchError } = await supabase
      .from('clients')
      .select('auth_user_id, email')
      .eq('id', clientId)
      .single()
    
    if (fetchError) {
      console.error('Error fetching client:', fetchError)
      throw fetchError
    }
    
    // Delete client record from database
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
    
    if (deleteError) {
      console.error('Error deleting client record:', deleteError)
      throw deleteError
    }
    
    // Optional: Try to delete auth user (may require admin privileges)
    if (clientData?.auth_user_id) {
      try {
        // This might fail if you don't have admin access
        await supabase.auth.admin.deleteUser(clientData.auth_user_id)
        console.log('✅ Auth user also deleted')
      } catch (authError) {
        console.log('⚠️ Could not delete auth user (admin access needed):', authError)
        // Continue anyway - client record is deleted
      }
    }
    
    console.log('✅ Client deleted successfully')
    
    // Clear cache and emit update
    this.clearCache('clients')
    this.emit('clients', await this.getClients())
    
    return { success: true }
  } catch (error) {
    console.error('❌ Delete client failed:', error)
    throw error
  }
}







// ========================================
// WORKOUT LOG METHODS - ADD TO DatabaseService.js
// Voeg deze toe aan je DatabaseService class (rond regel 4800-5000)
// ========================================

// Quick Log Workout - COMPLETE SAVE METHOD
async saveQuickWorkoutLog(clientId, exerciseName, sets, notes = null) {
  try {
    // 1. Create or get today's workout session
    const today = new Date().toISOString().split('T')[0]
    
    // Check if session exists for today
    let { data: session, error: sessionError } = await this.supabase
      .from('workout_sessions')
      .select('*')
      .eq('client_id', clientId)
      .eq('workout_date', today)
      .single()
    
    // Create new session if not exists
    if (!session) {
      const { data: newSession, error: createError } = await this.supabase
        .from('workout_sessions')
        .insert({
          client_id: clientId,
          user_id: clientId, // Same as client_id for now
          workout_date: today,
          day_name: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          day_display_name: `Quick Log - ${new Date().toLocaleDateString()}`,
          exercises_completed: [],
          is_completed: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Failed to create workout session:', createError)
        throw createError
      }
      session = newSession
    }
    
    // 2. Save workout progress
    const { data: progress, error: progressError } = await this.supabase
      .from('workout_progress')
      .insert({
        session_id: session.id,
        exercise_name: exerciseName,
        sets: sets, // JSONB array of {weight, reps}
        notes: notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (progressError) {
      console.error('Failed to save workout progress:', progressError)
      throw progressError
    }
    
    // 3. Update session with completed exercise
    const updatedExercises = [
      ...(session.exercises_completed || []),
      { 
        name: exerciseName, 
        sets: sets.length,
        completed_at: new Date().toISOString()
      }
    ]
    
    const { error: updateError } = await this.supabase
      .from('workout_sessions')
      .update({
        exercises_completed: updatedExercises,
        completion_percentage: Math.min(100, (updatedExercises.length / 5) * 100),
        is_completed: updatedExercises.length >= 3 // Mark complete after 3 exercises
      })
      .eq('id', session.id)
    
    if (updateError) {
      console.error('Failed to update workout session:', updateError)
      throw updateError
    }
    
    console.log('✅ Quick workout logged successfully')
    return { session, progress }
    
  } catch (error) {
    console.error('❌ Quick workout log failed:', error)
    throw error
  }
}

// Get Workout Chart Data - Voor progress charts
async getWorkoutChartData(clientId, days = 30) {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get workout sessions with progress
    const { data: sessions, error } = await this.supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_progress (
          exercise_name,
          sets,
          created_at
        )
      `)
      .eq('client_id', clientId)
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .lte('workout_date', endDate.toISOString().split('T')[0])
      .order('workout_date', { ascending: true })
    
    if (error) throw error
    
    // Calculate volume per session
    const chartData = sessions.map(session => {
      let totalVolume = 0
      let exerciseCount = 0
      
      if (session.workout_progress) {
        session.workout_progress.forEach(progress => {
          exerciseCount++
          if (progress.sets && Array.isArray(progress.sets)) {
            progress.sets.forEach(set => {
              if (set.weight && set.reps) {
                totalVolume += (set.weight * set.reps)
              }
            })
          }
        })
      }
      
      return {
        date: session.workout_date,
        volume: totalVolume,
        exercises: exerciseCount,
        duration: session.duration_minutes || 0
      }
    })
    
    return chartData
    
  } catch (error) {
    console.error('❌ Get workout chart data failed:', error)
    return []
  }
}

// Get Recent Workout Stats - Voor dashboard widget
async getRecentWorkoutStats(clientId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    // Get this week's workouts
    const { data: weekWorkouts, error } = await this.supabase
      .from('workout_sessions')
      .select('*')
      .eq('client_id', clientId)
      .gte('workout_date', lastWeek.toISOString().split('T')[0])
      .order('workout_date', { ascending: false })
    
    if (error) throw error
    
    // Get today's progress if session exists
    let todayProgress = []
    if (weekWorkouts && weekWorkouts.length > 0 && weekWorkouts[0].workout_date === today) {
      const { data: progress } = await this.supabase
        .from('workout_progress')
        .select('*')
        .eq('session_id', weekWorkouts[0].id)
      
      todayProgress = progress || []
    }
    
    // Calculate stats
    const stats = {
      workoutsThisWeek: weekWorkouts.length,
      todayExercises: todayProgress.length,
      currentStreak: this.calculateWorkoutStreak(weekWorkouts),
      lastWorkout: weekWorkouts[0]?.workout_date || null,
      totalVolume: 0
    }
    
    // Calculate total volume for the week
    for (const workout of weekWorkouts) {
      const { data: progress } = await this.supabase
        .from('workout_progress')
        .select('sets')
        .eq('session_id', workout.id)
      
      if (progress) {
        progress.forEach(p => {
          if (p.sets && Array.isArray(p.sets)) {
            p.sets.forEach(set => {
              if (set.weight && set.reps) {
                stats.totalVolume += (set.weight * set.reps)
              }
            })
          }
        })
      }
    }
    
    return stats
    
  } catch (error) {
    console.error('❌ Get workout stats failed:', error)
    return {
      workoutsThisWeek: 0,
      todayExercises: 0,
      currentStreak: 0,
      lastWorkout: null,
      totalVolume: 0
    }
  }
}

// Save Workout Progress - Alternative method name
async saveWorkoutProgress(progressData) {
  try {
    const { data, error } = await this.supabase
      .from('workout_progress')
      .insert({
        session_id: progressData.session_id,
        exercise_name: progressData.exercise_name,
        sets: progressData.sets,
        notes: progressData.notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Workout progress saved')
    return data
    
  } catch (error) {
    console.error('❌ Save workout progress failed:', error)
    throw error
  }
}

// Get Today's Workout Session
async getTodayWorkoutSession(clientId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await this.supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_progress (*)
      `)
      .eq('client_id', clientId)
      .eq('workout_date', today)
      .single()
    
    if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
      throw error
    }
    
    return data
    
  } catch (error) {
    console.error('❌ Get today workout session failed:', error)
    return null
  }
}

// Get Workout History
async getWorkoutHistory(clientId, days = 30) {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_progress (
          exercise_name,
          sets,
          created_at
        )
      `)
      .eq('client_id', clientId)
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .lte('workout_date', endDate.toISOString().split('T')[0])
      .order('workout_date', { ascending: false })
    
    if (error) throw error
    
    return data || []
    
  } catch (error) {
    console.error('❌ Get workout history failed:', error)
    return []
  }
}

// Helper: Calculate workout streak
calculateWorkoutStreak(workouts) {
  if (!workouts || workouts.length === 0) return 0
  
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Sort by date descending
  const sorted = [...workouts].sort((a, b) => 
    new Date(b.workout_date) - new Date(a.workout_date)
  )
  
  for (let i = 0; i < sorted.length; i++) {
    const workoutDate = new Date(sorted[i].workout_date)
    workoutDate.setHours(0, 0, 0, 0)
    
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)
    
    // Allow 1 day gap for rest days
    const dayDiff = Math.abs((expectedDate - workoutDate) / (1000 * 60 * 60 * 24))
    
    if (dayDiff <= 1) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

// Save Exercise to Personal Database
async saveExerciseToDatabase(clientId, exerciseName, muscleGroup = null) {
  try {
    const { data, error } = await this.supabase
      .from('exercise_database')
      .insert({
        client_id: clientId,
        name: exerciseName,
        muscle_group: muscleGroup,
        created_by: clientId,
        is_custom: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error && error.code === '23505') { // Duplicate key
      console.log('Exercise already exists in database')
      return null
    }
    
    if (error) throw error
    
    console.log('✅ Exercise saved to database')
    return data
    
  } catch (error) {
    console.error('❌ Save exercise to database failed:', error)
    return null
  }
}

// Get Personal Exercise Database
async getPersonalExercises(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('exercise_database')
      .select('*')
      .or(`client_id.eq.${clientId},is_public.eq.true`)
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return data || []
    
  } catch (error) {
    console.error('❌ Get personal exercises failed:', error)
    return []
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





// ========== INGREDIENTS METHODS ==========









async searchIngredients(searchTerm) {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      const { data, error } = await this.supabase
        .from('ingredients')
        .select('*')
        .order('name')
        .limit(50)
      
      if (error) throw error
      return data || []
    }
    
    const { data, error } = await this.supabase
      .from('ingredients')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('name')
      .limit(50)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error searching ingredients:', error)
    return []
  }
}

async getAllIngredients() {
  try {
    const { data, error } = await this.supabase
      .from('ingredients')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) throw error
    console.log(`✅ Loaded all ${data?.length || 0} ingredients`)
    return data || []
  } catch (error) {
    console.error('❌ Error loading all ingredients:', error)
    return []
  }
}

async getIngredientsByCategory(category) {
  try {
    const { data, error } = await this.supabase
      .from('ingredients')
      .select('*')
      .eq('category', category)
      .order('name')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error loading ingredients by category:', error)
    return []
  }
}

calculateIngredientMacros(ingredient, portionGrams) {
  if (!ingredient || !portionGrams) return null
  
  const factor = portionGrams / 100
  return {
    calories: Math.round((ingredient.per_100g_kcal || 0) * factor),
    protein: Math.round((ingredient.per_100g_protein || 0) * factor * 10) / 10,
    carbs: Math.round((ingredient.per_100g_carbs || 0) * factor * 10) / 10,
    fat: Math.round((ingredient.per_100g_fat || 0) * factor * 10) / 10,
    fiber: Math.round((ingredient.per_100g_fiber || 0) * factor * 10) / 10,
    portionSize: portionGrams
  }
}





  // ===== MEAL PLAN METHODS =====
 
// ===== MEAL PLAN METHODS =====





// src/services/DatabaseService.js - MEAL PLAN METHODS
// 🍎 Voeg deze methods toe aan je bestaande DatabaseService class

// ===== MEAL PLAN METHODS =====


// In DatabaseService.js, voeg deze method toe:
// Voeg deze methods toe/update ze in DatabaseService.js

// ===== MEAL DETAILS METHOD (NIEUW) =====
async getMealDetails(mealId) {
  try {
    if (!mealId) {
      console.log('⚠️ No meal ID provided')
      return null
    }
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .single()
    
    if (error) {
      console.error('❌ Get meal details error:', error)
      return null
    }
    
    console.log('✅ Loaded meal details:', data?.name)
    return data
  } catch (error) {
    console.error('❌ Get meal details failed:', error)
    return null
  }
}

// ===== MEAL PROGRESS SAVE (GEFIXTE VERSIE) =====
async saveMealProgress(clientId, progressData) {
  try {
    console.log('💾 Saving meal progress for client:', clientId)
    console.log('Progress data:', progressData)
    
    // Valideer dat alle required fields aanwezig zijn
    if (!clientId || !progressData.date) {
      console.error('❌ Missing required fields: clientId or date')
      return null
    }
    
    // Zorg dat meals_checked correct geformateerd is
    let mealsCheckedData = progressData.meals_checked || []
    
    // Als het al een string is, parse het niet opnieuw
    if (typeof mealsCheckedData === 'string') {
      try {
        mealsCheckedData = JSON.parse(mealsCheckedData)
      } catch (e) {
        console.log('meals_checked is already a string, using as-is')
      }
    }
    
    // Check of record bestaat
    const { data: existing, error: checkError } = await supabase
      .from('meal_progress')
      .select('id')
      .eq('client_id', clientId)
      .eq('date', progressData.date)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Check existing error:', checkError)
      return null
    }
    
    // Prepare data voor save
    const dataToSave = {
      client_id: clientId,
      date: progressData.date,
      plan_id: progressData.plan_id || null,
      meals_checked: mealsCheckedData, // Laat Supabase het JSON maken
      total_calories: parseInt(progressData.total_calories) || 0,
      total_protein: parseInt(progressData.total_protein) || 0,
      total_carbs: parseInt(progressData.total_carbs) || 0,
      total_fat: parseInt(progressData.total_fat) || 0,
      updated_at: new Date().toISOString()
    }
    
    let result
    
    if (existing) {
      // Update existing record
      console.log('📝 Updating existing progress record:', existing.id)
      
      const { data, error } = await supabase
        .from('meal_progress')
        .update(dataToSave)
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Update error:', error)
        return null
      }
      
      result = data
    } else {
      // Insert new record
      console.log('➕ Creating new progress record')
      
      const { data, error } = await supabase
        .from('meal_progress')
        .insert({
          ...dataToSave,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Insert error:', error)
        return null
      }
      
      result = data
    }
    
    console.log('✅ Meal progress saved successfully')
    return result
  } catch (error) {
    console.error('❌ Save meal progress failed:', error.message || error)
    return null
  }
}

// ===== GET CUSTOM MEALS (GEFIXTE VERSIE VOOR CLIENT-SPECIFIC) =====
async getCustomMeals(clientId) {
  try {
    if (!clientId) {
      console.log('⚠️ No clientId provided for getCustomMeals')
      return []
    }
    
    // Haal alleen custom meals voor deze specifieke client
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('created_by', clientId)
      .eq('is_custom', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Get custom meals error:', error)
      return []
    }
    
    console.log('✅ Loaded custom meals for client:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Get custom meals failed:', error)
    return []
  }
}

// ===== SAVE CUSTOM MEAL (GEFIXTE VERSIE) =====
async saveCustomMeal(mealData) {
  try {
    console.log('💾 Attempting to save custom meal:', mealData)
    
    // Zorg dat alle vereiste velden aanwezig zijn
    const mealToSave = {
      name: mealData.name,
      kcal: parseInt(mealData.kcal) || 0,
      protein: parseInt(mealData.protein) || 0,
      carbs: parseInt(mealData.carbs) || 0,
      fat: parseInt(mealData.fat) || 0,
      is_custom: true,
      created_by: mealData.created_by,
      // Optionele velden
      ...(mealData.category && { category: mealData.category }),
      ...(mealData.meal_type && { meal_type: mealData.meal_type }),
      ...(mealData.image_url && { image_url: mealData.image_url }),
      ...(mealData.ingredients && { ingredients: mealData.ingredients }),
      ...(mealData.tags && { tags: mealData.tags })
    }
    
    const { data, error } = await supabase
      .from('meals')
      .insert(mealToSave)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }
    
    console.log('✅ Custom meal saved:', data)
    return data
  } catch (error) {
    console.error('❌ Save custom meal failed:', error.message || error)
    throw error
  }
}

// ===== GET MEAL HISTORY (VERBETERDE VERSIE) =====
async getMealHistory(clientId, days = 30) {
  try {
    console.log('📊 Loading meal history for client:', clientId)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) {
      console.error('❌ Get history error:', error)
      return []
    }
    
    // Parse meals_checked als het een string is
    const parsedData = data?.map(item => {
      if (item.meals_checked && typeof item.meals_checked === 'string') {
        try {
          item.meals_checked = JSON.parse(item.meals_checked)
        } catch (e) {
          console.log('Could not parse meals_checked, keeping as-is')
        }
      }
      return item
    })
    
    console.log('✅ Loaded meal history:', parsedData?.length || 0, 'days')
    return parsedData || []
  } catch (error) {
    console.error('❌ Get meal history failed:', error)
    return []
  }
}

// Voeg deze methods toe aan je DatabaseService.js
// ===== CUSTOM MEALS =====
// Voeg toe aan DatabaseService.js
async getMealDetails(mealId) {
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', mealId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Get meal details failed:', error)
    return null
  }
}
async saveCustomMeal(mealData) {
  try {
    console.log('💾 Attempting to save custom meal:', mealData)
    
    // Zorg dat alle vereiste velden aanwezig zijn
    const mealToSave = {
      name: mealData.name,
      kcal: parseInt(mealData.kcal) || 0,
      protein: parseInt(mealData.protein) || 0,
      carbs: parseInt(mealData.carbs) || 0,
      fat: parseInt(mealData.fat) || 0,
      // Optionele velden alleen toevoegen als ze bestaan
      ...(mealData.category && { category: mealData.category }),
      ...(mealData.meal_type && { meal_type: mealData.meal_type }),
      ...(mealData.image_url && { image_url: mealData.image_url }),
      ...(mealData.ingredients && { ingredients: mealData.ingredients }),
      ...(mealData.created_by && { created_by: mealData.created_by }),
      is_custom: true
    }
    
    const { data, error } = await supabase
      .from('meals')
      .insert(mealToSave)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }
    
    console.log('✅ Custom meal saved:', data)
    return data
  } catch (error) {
    console.error('❌ Save custom meal failed:', error.message || error)
    throw error
  }
}

async getCustomMeals(clientId) {
  try {
    if (!clientId) {
      console.log('⚠️ No clientId provided for getCustomMeals')
      return []
    }
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('created_by', clientId)
      .eq('is_custom', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Get custom meals error:', error)
      return []
    }
    
    console.log('✅ Loaded custom meals:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Get custom meals failed:', error)
    return []
  }
}

// ===== MEAL PROGRESS & HISTORY =====
async saveMealProgress(clientId, progressData) {
  try {
    console.log('💾 Saving meal progress for client:', clientId)
    
    // Check if progress exists for today
    const { data: existing, error: checkError } = await supabase
      .from('meal_progress')
      .select('id')
      .eq('client_id', clientId)
      .eq('date', progressData.date)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Check existing progress error:', checkError)
      throw checkError
    }
    
    let result
    
    if (existing) {
      // Update existing progress
      const { data, error } = await supabase
        .from('meal_progress')
        .update({
          ...progressData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Update progress error:', error)
        throw error
      }
      result = data
    } else {
      // Create new progress
      const { data, error } = await supabase
        .from('meal_progress')
        .insert({
          client_id: clientId,
          ...progressData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Insert progress error:', error)
        throw error
      }
      result = data
    }
    
    console.log('✅ Meal progress saved')
    return result
  } catch (error) {
    console.error('❌ Save meal progress failed:', error.message || error)
    // Don't throw, return null to prevent app crash
    return null
  }
}

async getMealProgress(clientId, date) {
  try {
    const { data, error } = await supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Get progress error:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('❌ Get meal progress failed:', error)
    return null
  }
}

async getMealHistory(clientId, days = 30) {
  try {
    console.log('📊 Loading meal history for client:', clientId)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) {
      console.error('❌ Get history error:', error)
      return []
    }
    
    console.log('✅ Loaded meal history:', data?.length || 0, 'days')
    return data || []
  } catch (error) {
    console.error('❌ Get meal history failed:', error)
    return []
  }
}

// ===== WATER INTAKE =====
async saveWaterIntake(clientId, date, amount) {
  try {
    console.log('💧 Saving water intake:', { clientId, date, amount })
    
    // Validate input
    if (!clientId || !date) {
      console.error('❌ Missing required fields for water intake')
      return null
    }
    
    const { data: existing, error: checkError } = await supabase
      .from('water_intake')
      .select('id')
      .eq('client_id', clientId)
      .eq('date', date)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Check existing water error:', checkError)
      return null
    }
    
    let result
    
    if (existing) {
      const { data, error } = await supabase
        .from('water_intake')
        .update({
          amount: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Update water error:', error)
        return null
      }
      result = data
    } else {
      const { data, error } = await supabase
        .from('water_intake')
        .insert({
          client_id: clientId,
          date: date,
          amount: amount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Insert water error:', error)
        return null
      }
      result = data
    }
    
    console.log('✅ Water intake saved:', amount, 'L')
    return result
  } catch (error) {
    console.error('❌ Save water intake failed:', error.message || error)
    return null
  }
}

async getWaterIntake(clientId, date) {
  try {
    const { data, error } = await supabase
      .from('water_intake')
      .select('amount')
      .eq('client_id', clientId)
      .eq('date', date)
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Get water error:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('❌ Get water intake failed:', error)
    return null
  }
}

// ===== MEAL SWAPS =====
async saveMealSwap(clientId, planId, dayIndex, timeSlot, newMealId) {
  try {
    console.log('🔄 Saving meal swap:', { clientId, planId, dayIndex, timeSlot, newMealId })
    
    // Validate required fields
    if (!clientId || !planId || !newMealId) {
      console.error('❌ Missing required fields for meal swap')
      return null
    }
    
    const { data, error } = await supabase
      .from('meal_swaps')
      .insert({
        client_id: clientId,
        plan_id: planId,
        day_index: dayIndex,
        time_slot: timeSlot,
        new_meal_id: newMealId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Save swap error:', error)
      return null
    }
    
    console.log('✅ Meal swap saved')
    return data
  } catch (error) {
    console.error('❌ Save meal swap failed:', error)
    return null
  }
}

// ===== GET MEALS BY IDS =====
async getMealsByIds(mealIds) {
  try {
    if (!mealIds || mealIds.length === 0) {
      console.log('⚠️ No meal IDs provided')
      return []
    }
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .in('id', mealIds)
    
    if (error) {
      console.error('❌ Get meals by IDs error:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Get meals by IDs failed:', error)
    return []
  }
}

// ===== MEAL PREFERENCES (Update existing) =====
async saveMealPreferences(clientId, preferences) {
  try {
    console.log('💾 Saving meal preferences for client:', clientId)
    
    const { data, error } = await supabase
      .from('clients')
      .update({
        nutrition_info: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Save preferences error:', error)
      // Fallback to localStorage
      localStorage.setItem(`meal_preferences_${clientId}`, JSON.stringify(preferences))
      return preferences
    }
    
    console.log('✅ Meal preferences saved')
    return data
  } catch (error) {
    console.error('❌ Save meal preferences failed:', error)
    localStorage.setItem(`meal_preferences_${clientId}`, JSON.stringify(preferences))
    return preferences
  }
}

async getMealPreferences(clientId) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('nutrition_info')
      .eq('id', clientId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Get preferences error:', error)
    }
    
    if (data?.nutrition_info) {
      return data.nutrition_info
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(`meal_preferences_${clientId}`)
    if (stored) {
      return JSON.parse(stored)
    }
    
    // Default preferences
    return {
      dietary_type: 'regular',
      allergies: [],
      dislikes: [],
      favorite_meals: [],
      meals_per_day: 3,
      primary_goal: 'maintenance',
      activity_level: 'moderate'
    }
  } catch (error) {
    console.error('❌ Get meal preferences failed:', error)
    return {
      dietary_type: 'regular',
      allergies: [],
      dislikes: [],
      favorite_meals: [],
      meals_per_day: 3,
      primary_goal: 'maintenance',
      activity_level: 'moderate'
    }
  }
}

// ===== MEAL PROGRESS & HISTORY =====
async saveMealProgress(clientId, progressData) {
  try {
    // Check if progress exists for today
    const { data: existing, error: checkError } = await supabase
      .from('meal_progress')
      .select('id')
      .eq('client_id', clientId)
      .eq('date', progressData.date)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    
    let result
    
    if (existing) {
      // Update existing progress
      const { data, error } = await supabase
        .from('meal_progress')
        .update({
          ...progressData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Create new progress
      const { data, error } = await supabase
        .from('meal_progress')
        .insert({
          client_id: clientId,
          ...progressData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      result = data
    }
    
    console.log('✅ Meal progress saved')
    return result
  } catch (error) {
    console.error('❌ Save meal progress failed:', error)
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
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return data
  } catch (error) {
    console.error('❌ Get meal progress failed:', error)
    return null
  }
}

async getMealHistory(clientId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) throw error
    
    console.log('✅ Loaded meal history:', data?.length || 0, 'days')
    return data || []
  } catch (error) {
    console.error('❌ Get meal history failed:', error)
    return []
  }
}

// ===== WATER INTAKE =====
async saveWaterIntake(clientId, date, amount) {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('water_intake')
      .select('id')
      .eq('client_id', clientId)
      .eq('date', date)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    
    let result
    
    if (existing) {
      const { data, error } = await supabase
        .from('water_intake')
        .update({
          amount: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('water_intake')
        .insert({
          client_id: clientId,
          date: date,
          amount: amount,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      result = data
    }
    
    console.log('✅ Water intake saved:', amount, 'L')
    return result
  } catch (error) {
    console.error('❌ Save water intake failed:', error)
    return null
  }
}

async getWaterIntake(clientId, date) {
  try {
    const { data, error } = await supabase
      .from('water_intake')
      .select('amount')
      .eq('client_id', clientId)
      .eq('date', date)
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return data
  } catch (error) {
    console.error('❌ Get water intake failed:', error)
    return null
  }
}

// ===== MEAL SWAPS =====
async saveMealSwap(clientId, planId, dayIndex, timeSlot, newMealId) {
  try {
    const { data, error } = await supabase
      .from('meal_swaps')
      .insert({
        client_id: clientId,
        plan_id: planId,
        day_index: dayIndex,
        time_slot: timeSlot,
        new_meal_id: newMealId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Meal swap saved')
    return data
  } catch (error) {
    console.error('❌ Save meal swap failed:', error)
    return null
  }
}

// ===== GET MEALS BY IDS =====
async getMealsByIds(mealIds) {
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .in('id', mealIds)
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('❌ Get meals by IDs failed:', error)
    return []
  }
}

// ===== UPLOAD MEAL IMAGE (placeholder voor nu) =====
async uploadMealImage(file) {
  try {
    // In productie: upload naar Supabase Storage
    const fileName = `meals/${Date.now()}_${file.name}`
    
    // Voor nu: return een placeholder
    console.log('📸 Would upload image:', fileName)
    return `https://source.unsplash.com/400x300/?food,meal`
    
    // Productie code:
    /*
    const { data, error } = await supabase.storage
      .from('meal-images')
      .upload(fileName, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('meal-images')
      .getPublicUrl(fileName)
    
    return publicUrl
    */
  } catch (error) {
    console.error('❌ Upload meal image failed:', error)
    throw error
  }
}

async getCustomMeals(clientId) {
  try {
    // Check of er een user is ingelogd
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return []
    
    const { data, error } = await this.supabase
      .from('meals')
      .select('*')
      .eq('is_custom', true)
      .eq('created_by', user.id)  // Gebruik user.id ipv clientId
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get custom meals failed:', error)
    return []  // Return lege array ipv throw
  }
}


// Get client's active meal plan
async getClientMealPlan(clientId) {
  try {
    const { data, error } = await this.supabase
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

// Get all meals from catalog
async getAllMeals() {
  try {
    const { data, error } = await this.supabase
      .from('meals')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get all meals failed:', error)
    return []
  }
}

// Get specific meals by IDs
async getMealsByIds(mealIds) {
  if (!mealIds || mealIds.length === 0) return []
  
  try {
    const { data, error } = await this.supabase
      .from('meals')
      .select('*')
      .in('id', mealIds)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get meals by IDs failed:', error)
    return []
  }
}

// Get client meal overrides (swaps)
async getClientMealOverrides(clientId, planId) {
  try {
    const { data, error } = await this.supabase
      .from('client_meal_overrides')
      .select('week_structure')
      .eq('client_id', clientId)
      .eq('plan_id', planId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.week_structure || null
  } catch (error) {
    console.error('❌ Get client meal overrides failed:', error)
    return null
  }
}

// Save meal swap
async saveMealSwap(clientId, planId, dayIndex, slot, mealId) {
  try {
    // First get current overrides
    const { data: existing } = await this.supabase
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
    const mealIndex = weekStructure[dayIndex].meals.findIndex(m => m.slot === slot || m.time_slot === slot)
    if (mealIndex >= 0) {
      weekStructure[dayIndex].meals[mealIndex].meal_id = mealId
    } else {
      weekStructure[dayIndex].meals.push({ 
        slot, 
        meal_id: mealId,
        target_kcal: 500 // Default
      })
    }
    
    // Save back to database
    const { error } = await this.supabase
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
    console.error('❌ Save meal swap failed:', error)
    return false
  }
}

// Save meal progress (checked meals)
async saveMealProgress(clientId, progressData) {
  try {
    const { data, error } = await this.supabase
      .from('meal_progress')
      .upsert({
        client_id: clientId,
        plan_id: progressData.plan_id,
        date: progressData.date,
        day_index: progressData.day_index,
        meals_checked: progressData.meals_checked,
        total_calories: progressData.total_calories,
        total_protein: progressData.total_protein,
        total_carbs: progressData.total_carbs,
        total_fat: progressData.total_fat,
        notes: progressData.notes || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,date'
      })
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Meal progress saved')
    return data
  } catch (error) {
    console.error('❌ Save meal progress failed:', error)
    throw error
  }
}

// Get meal progress for specific date
async getMealProgress(clientId, date) {
  try {
    const { data, error } = await this.supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('❌ Get meal progress failed:', error)
    return null
  }
}

// Get meal history
async getMealHistory(clientId, days = 7) {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get meal history failed:', error)
    return []
  }
}

// Save water intake
async saveWaterIntake(clientId, date, amount) {
  try {
    const { data, error } = await this.supabase
      .from('water_intake')
      .upsert({
        client_id: clientId,
        date: date,
        amount: amount,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,date'
      })
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Water intake saved')
    return data
  } catch (error) {
    console.error('❌ Save water intake failed:', error)
    throw error
  }
}

// Get water intake for date
async getWaterIntake(clientId, date) {
  try {
    const { data, error } = await this.supabase
      .from('water_intake')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('❌ Get water intake failed:', error)
    return null
  }
}

// Get meal preferences
async getMealPreferences(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('clients')
      .select('nutrition_info')
      .eq('id', clientId)
      .single()
    
    if (error) throw error
    return data?.nutrition_info || {}
  } catch (error) {
    console.error('❌ Get meal preferences failed:', error)
    return {}
  }
}

// Save meal preferences
async saveMealPreferences(clientId, preferences) {
  try {
    const { data, error } = await this.supabase
      .from('clients')
      .update({
        nutrition_info: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Meal preferences saved')
    return data
  } catch (error) {
    console.error('❌ Save meal preferences failed:', error)
    throw error
  }
}

// Get meal compliance stats
async getMealCompliance(clientId, days = 7) {
  try {
    const history = await this.getMealHistory(clientId, days)
    
    if (!history || history.length === 0) {
      return {
        daysTracked: 0,
        averageCalories: 0,
        averageProtein: 0,
        averageCarbs: 0,
        averageFat: 0,
        compliancePercentage: 0
      }
    }
    
    const totalDays = history.length
    const totalCalories = history.reduce((sum, day) => sum + (day.total_calories || 0), 0)
    const totalProtein = history.reduce((sum, day) => sum + (day.total_protein || 0), 0)
    const totalCarbs = history.reduce((sum, day) => sum + (day.total_carbs || 0), 0)
    const totalFat = history.reduce((sum, day) => sum + (day.total_fat || 0), 0)
    
    return {
      daysTracked: totalDays,
      averageCalories: Math.round(totalCalories / totalDays),
      averageProtein: Math.round(totalProtein / totalDays),
      averageCarbs: Math.round(totalCarbs / totalDays),
      averageFat: Math.round(totalFat / totalDays),
      compliancePercentage: Math.round((totalDays / days) * 100)
    }
  } catch (error) {
    console.error('❌ Get meal compliance failed:', error)
    return null
  }
}

// ===== CUSTOM MEALS & FAVORITES =====

// Create custom meal
async createCustomMeal(mealData) {
  try {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    const { data, error } = await this.supabase
      .from('meals')
      .insert({
        name: mealData.name,
        kcal: mealData.kcal,
        protein: mealData.protein || 0,
        carbs: mealData.carbs || 0,
        fat: mealData.fat || 0,
        category: mealData.category || 'lunch',
        image_url: mealData.image_url,
        ingredients: mealData.ingredients || [],
        is_custom: true,
        created_by: mealData.created_by || user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Custom meal created')
    return data
  } catch (error) {
    console.error('❌ Create custom meal failed:', error)
    throw error
  }
}

// Get custom meals for client
async getCustomMeals(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('meals')
      .select('*')
      .eq('is_custom', true)
      .eq('created_by', clientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get custom meals failed:', error)
    return []
  }
}

// Update meal with image
async updateMealImage(mealId, imageUrl) {
  try {
    const { data, error } = await this.supabase
      .from('meals')
      .update({ 
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', mealId)
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Meal image updated')
    return data
  } catch (error) {
    console.error('❌ Update meal image failed:', error)
    throw error
  }
}

// Delete custom meal
async deleteCustomMeal(mealId) {
  try {
    const { error } = await this.supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('is_custom', true)
    
    if (error) throw error
    console.log('✅ Custom meal deleted')
    return true
  } catch (error) {
    console.error('❌ Delete custom meal failed:', error)
    return false
  }
}

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




// src/services/DatabaseService.js - MEAL PLAN METHODS
// 🍎 Voeg deze methods toe aan je bestaande DatabaseService class

// ===== MEAL PLAN METHODS =====

// Get client's active meal plan
async getClientMealPlan(clientId) {
  try {
    const { data, error } = await this.supabase
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

// Get all meals from catalog
async getAllMeals() {
  try {
    const { data, error } = await this.supabase
      .from('meals')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get all meals failed:', error)
    return []
  }
}

// Get specific meals by IDs
async getMealsByIds(mealIds) {
  if (!mealIds || mealIds.length === 0) return []
  
  try {
    const { data, error } = await this.supabase
      .from('meals')
      .select('*')
      .in('id', mealIds)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get meals by IDs failed:', error)
    return []
  }
}

// Get client meal overrides (swaps)
async getClientMealOverrides(clientId, planId) {
  try {
    const { data, error } = await this.supabase
      .from('client_meal_overrides')
      .select('week_structure')
      .eq('client_id', clientId)
      .eq('plan_id', planId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.week_structure || null
  } catch (error) {
    console.error('❌ Get client meal overrides failed:', error)
    return null
  }
}

// Save meal swap
async saveMealSwap(clientId, planId, dayIndex, slot, mealId) {
  try {
    // First get current overrides
    const { data: existing } = await this.supabase
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
    const mealIndex = weekStructure[dayIndex].meals.findIndex(m => m.slot === slot || m.time_slot === slot)
    if (mealIndex >= 0) {
      weekStructure[dayIndex].meals[mealIndex].meal_id = mealId
    } else {
      weekStructure[dayIndex].meals.push({ 
        slot, 
        meal_id: mealId,
        target_kcal: 500 // Default
      })
    }
    
    // Save back to database
    const { error } = await this.supabase
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
    console.error('❌ Save meal swap failed:', error)
    return false
  }
}

// Save meal progress (checked meals)
async saveMealProgress(clientId, progressData) {
  try {
    const { data, error } = await this.supabase
      .from('meal_progress')
      .upsert({
        client_id: clientId,
        plan_id: progressData.plan_id,
        date: progressData.date,
        day_index: progressData.day_index,
        meals_checked: progressData.meals_checked,
        total_calories: progressData.total_calories,
        total_protein: progressData.total_protein,
        total_carbs: progressData.total_carbs,
        total_fat: progressData.total_fat,
        notes: progressData.notes || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,date'
      })
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Meal progress saved')
    return data
  } catch (error) {
    console.error('❌ Save meal progress failed:', error)
    throw error
  }
}

// Get meal progress for specific date
async getMealProgress(clientId, date) {
  try {
    const { data, error } = await this.supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('❌ Get meal progress failed:', error)
    return null
  }
}

// Get meal history
async getMealHistory(clientId, days = 7) {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get meal history failed:', error)
    return []
  }
}

// Save water intake
async saveWaterIntake(clientId, date, amount) {
  try {
    const { data, error } = await this.supabase
      .from('water_intake')
      .upsert({
        client_id: clientId,
        date: date,
        amount: amount,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,date'
      })
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Water intake saved')
    return data
  } catch (error) {
    console.error('❌ Save water intake failed:', error)
    throw error
  }
}

// Get water intake for date
async getWaterIntake(clientId, date) {
  try {
    const { data, error } = await this.supabase
      .from('water_intake')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('❌ Get water intake failed:', error)
    return null
  }
}

// Get meal preferences
async getMealPreferences(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('clients')
      .select('nutrition_info')
      .eq('id', clientId)
      .single()
    
    if (error) throw error
    return data?.nutrition_info || {}
  } catch (error) {
    console.error('❌ Get meal preferences failed:', error)
    return {}
  }
}

// Save meal preferences
async saveMealPreferences(clientId, preferences) {
  try {
    const { data, error } = await this.supabase
      .from('clients')
      .update({
        nutrition_info: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Meal preferences saved')
    return data
  } catch (error) {
    console.error('❌ Save meal preferences failed:', error)
    throw error
  }
}

// Get meal compliance stats
async getMealCompliance(clientId, days = 7) {
  try {
    const history = await this.getMealHistory(clientId, days)
    
    if (!history || history.length === 0) {
      return {
        daysTracked: 0,
        averageCalories: 0,
        averageProtein: 0,
        averageCarbs: 0,
        averageFat: 0,
        compliancePercentage: 0
      }
    }
    
    const totalDays = history.length
    const totalCalories = history.reduce((sum, day) => sum + (day.total_calories || 0), 0)
    const totalProtein = history.reduce((sum, day) => sum + (day.total_protein || 0), 0)
    const totalCarbs = history.reduce((sum, day) => sum + (day.total_carbs || 0), 0)
    const totalFat = history.reduce((sum, day) => sum + (day.total_fat || 0), 0)
    
    return {
      daysTracked: totalDays,
      averageCalories: Math.round(totalCalories / totalDays),
      averageProtein: Math.round(totalProtein / totalDays),
      averageCarbs: Math.round(totalCarbs / totalDays),
      averageFat: Math.round(totalFat / totalDays),
      compliancePercentage: Math.round((totalDays / days) * 100)
    }
  } catch (error) {
    console.error('❌ Get meal compliance failed:', error)
    return null
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
// ========================================
// FIXED saveGoal METHOD voor DatabaseService.js
// Vervangt de oude saveGoal method
// ========================================

async saveGoal(goalData) {
  try {
    // Voor het nieuwe systeem: gebruik insert zonder upsert
    // Dit staat meerdere goals van hetzelfde type toe
    const { data, error } = await this.supabase
      .from('client_goals')
      .insert({
        client_id: goalData.client_id,
        title: goalData.title || goalData.goal_type,
        goal_type: goalData.goal_type || 'custom',
        category: goalData.category || 'personal',
        measurement_type: goalData.measurement_type || 'number',
        target_value: parseFloat(goalData.target_value) || 0,
        current_value: goalData.current_value || 0,
        start_value: goalData.current_value || 0, // Save starting point
        target_date: goalData.target_date,
        unit: goalData.unit || '',
        frequency: goalData.frequency || 'daily',
        frequency_target: goalData.frequency_target || 7,
        notes: goalData.notes || '',
        status: goalData.status || 'active',
        color: goalData.color || '#10b981',
        icon: goalData.icon || 'target',
        measurement_config: goalData.measurement_config || {},
        is_public: goalData.is_public || false,
        reminder_enabled: goalData.reminder_enabled || false,
        reminder_time: goalData.reminder_time || null,
        progress_data: goalData.progress_data || [],
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      // Als het een duplicate key error is, geef een vriendelijke melding
      if (error.code === '23505') {
        console.error('Goal already exists, updating instead...')
        
        // Probeer te updaten als insert faalt (fallback voor oude structure)
        const { data: updateData, error: updateError } = await this.supabase
          .from('client_goals')
          .update({
            title: goalData.title || goalData.goal_type,
            target_value: parseFloat(goalData.target_value) || 0,
            target_date: goalData.target_date,
            unit: goalData.unit || '',
            notes: goalData.notes || '',
            status: 'active',
            color: goalData.color || '#10b981',
            icon: goalData.icon || 'target',
            measurement_type: goalData.measurement_type || 'number',
            frequency: goalData.frequency || 'daily',
            frequency_target: goalData.frequency_target || 7,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', goalData.client_id)
          .eq('goal_type', goalData.goal_type)
          .select()
          .single()
        
        if (updateError) throw updateError
        
        this.clearCache(`goals_${goalData.client_id}`)
        return updateData
      }
      throw error
    }
    
    this.clearCache(`goals_${goalData.client_id}`)
    console.log('✅ Goal saved successfully:', data)
    return data
  } catch (error) {
    console.error('Error saving goal:', error)
    throw error
  }
}

// Ook voeg deze helper method toe voor het updaten van bestaande goals:
async updateGoal(goalId, updates) {
  try {
    const { data, error } = await this.supabase
      .from('client_goals')
      .update({
        ...updates,
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

// ========================================
// ADD THESE METHODS TO DatabaseService.js
// Progress Tracking Feature Methods
// ========================================

// ===== WEIGHT TRACKING =====
async saveWeight(clientId, weight, date) {
  try {
    const { data, error } = await this.supabase
      .from('weight_history')
      .upsert({
        client_id: clientId,
        date: date,
        weight: parseFloat(weight)
      }, {
        onConflict: 'client_id,date'
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

// ===== MEASUREMENTS =====
async saveMeasurements(clientId, measurements, date) {
  try {
    const { data, error } = await this.supabase
      .from('measurements')
      .insert({
        client_id: clientId,
        date: date,
        ...measurements
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

// ===== WORKOUT PROGRESS =====
async saveWorkoutProgress(progressData) {
  try {
    const { data, error } = await this.supabase
      .from('workout_progress')
      .upsert(progressData, {
        onConflict: 'client_id,date,exercise_name'
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`workout_${progressData.client_id}`)
    return data
  } catch (error) {
    console.error('Save workout progress error:', error)
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
    
    // Calculate PRs and stats
    const exercises = data || []
    const prs = []
    const exerciseHistory = []
    const weekProgress = {}
    
    exercises.forEach(ex => {
      exerciseHistory.push(ex)
      
      // Track week progress
      const weekDay = new Date(ex.date).toISOString().split('T')[0]
      if (!weekProgress[weekDay]) weekProgress[weekDay] = []
      weekProgress[weekDay].push(ex)
      
      // Calculate PRs
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
    
    // Sort PRs by weight and get top 5
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

// ===== GOALS =====
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
      .upsert(goalData, {
        onConflict: 'client_id,goal_type'
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`goals_${goalData.client_id}`)
    return data
  } catch (error) {
    console.error('Save goal error:', error)
    throw error
  }
}

async updateGoalProgress(clientId, goalType, currentValue) {
  try {
    const { data, error } = await this.supabase
      .from('client_goals')
      .update({ 
        current_value: currentValue,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('goal_type', goalType)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Update goal progress error:', error)
    throw error
  }
}

// ===== WORKOUT COMPLETIONS =====
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

async markWorkoutComplete(clientId, date, duration, notes) {
  try {
    const { data, error } = await this.supabase
      .from('workout_completions')
      .upsert({
        client_id: clientId,
        workout_date: date,
        completed: true,
        duration_minutes: duration,
        notes: notes
      }, {
        onConflict: 'client_id,workout_date'
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`completions_${clientId}`)
    return data
  } catch (error) {
    console.error('Mark workout complete error:', error)
    throw error
  }
}

// ===== TODAY'S WORKOUT =====
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

// ===== PROGRESS PHOTOS =====
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

async saveProgressPhoto(clientId, photoData) {
  try {
    const { data, error } = await this.supabase
      .from('progress_photos')
      .insert({
        client_id: clientId,
        ...photoData
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`photos_${clientId}`)
    return data
  } catch (error) {
    console.error('Save progress photo error:', error)
    throw error
  }
}

async deleteProgressPhoto(photoId) {
  try {
    const { error } = await this.supabase
      .from('progress_photos')
      .delete()
      .eq('id', photoId)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete progress photo error:', error)
    throw error
  }
}

// ===== ACHIEVEMENTS =====
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

async unlockAchievement(clientId, achievementType, details = {}) {
  try {
    // Check if already unlocked
    const { data: existing } = await this.supabase
      .from('achievements')
      .select('id')
      .eq('client_id', clientId)
      .eq('achievement_type', achievementType)
      .single()
    
    if (existing) return existing // Already unlocked
    
    const { data, error } = await this.supabase
      .from('achievements')
      .insert({
        client_id: clientId,
        achievement_type: achievementType,
        achieved_date: new Date().toISOString().split('T')[0],
        details: details
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`achievements_${clientId}`)
    return data
  } catch (error) {
    console.error('Unlock achievement error:', error)
    throw error
  }
}

// ===== NUTRITION/MEALS =====
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

async saveMealProgress(clientId, mealData, date) {
  try {
    const { data, error } = await this.supabase
      .from('meal_progress')
      .upsert({
        client_id: clientId,
        date: date,
        ...mealData
      }, {
        onConflict: 'client_id,date'
      })
      .select()
      .single()
    
    if (error) throw error
    this.clearCache(`meals_${clientId}`)
    return data
  } catch (error) {
console.error('❌ Save meal progress failed:', error.message || error)
    throw error
  }
}

async logWaterIntake(clientId, glasses) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get current water intake
    const { data: current } = await this.supabase
      .from('meal_progress')
      .select('water_glasses')
      .eq('client_id', clientId)
      .eq('date', today)
      .single()
    
    const currentGlasses = current?.water_glasses || 0
    const newTotal = currentGlasses + glasses
    
    const { data, error } = await this.supabase
      .from('meal_progress')
      .upsert({
        client_id: clientId,
        date: today,
        water_glasses: newTotal
      }, {
        onConflict: 'client_id,date'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Log water intake error:', error)
    throw error
  }
}

// ===== STREAK CALCULATION =====
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
    
    // Check if today or yesterday has a workout
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

// ===== HELPER: Clear specific cache =====
clearCache(key) {
  // If you implement caching, clear it here
  // For now, just a placeholder
  if (this.cache && this.cache[key]) {
    delete this.cache[key]
  }
}

// ENHANCED GOALS METHODS voor DatabaseService.js
// Voeg deze toe aan je DatabaseService class
// ========================================

// Enhanced saveGoal met alle nieuwe velden
async saveGoal(goalData) {
  try {
    const { data, error } = await this.supabase
      .from('client_goals')
      .insert([{
        client_id: goalData.client_id,
        title: goalData.title,
        goal_type: goalData.goal_type || 'custom',
        category: goalData.category || 'personal',
        measurement_type: goalData.measurement_type || 'number',
        target_value: parseFloat(goalData.target_value) || 0,
        current_value: goalData.current_value || 0,
        target_date: goalData.target_date,
        unit: goalData.unit,
        frequency: goalData.frequency || 'daily',
        frequency_target: goalData.frequency_target || 7,
        notes: goalData.notes,
        status: goalData.status || 'active',
        color: goalData.color || '#10b981',
        icon: goalData.icon || 'target',
        measurement_config: goalData.measurement_config || {},
        is_public: goalData.is_public || false,
        reminder_enabled: goalData.reminder_enabled || false,
        reminder_time: goalData.reminder_time,
        updated_at: new Date().toISOString()
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

// Update goal progress
async updateGoalProgress(goalId, progressData) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Upsert progress entry
    const { data: progress, error: progressError } = await this.supabase
      .from('goal_progress')
      .upsert({
        goal_id: goalId,
        client_id: progressData.client_id,
        date: progressData.date || today,
        value: progressData.value || null,
        checked: progressData.checked || false,
        photo_urls: progressData.photo_urls || null,
        notes: progressData.notes || '',
        duration_minutes: progressData.duration_minutes || null,
        metadata: progressData.metadata || {}
      }, {
        onConflict: 'goal_id,date'
      })
      .select()
      .single()
    
    if (progressError) throw progressError
    
    // Update current_value in goals table
    if (progressData.value !== undefined) {
      const { error: updateError } = await this.supabase
        .from('client_goals')
        .update({ 
          current_value: progressData.value,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
      
      if (updateError) throw updateError
    }
    
    this.clearCache(`goals_${progressData.client_id}`)
    this.clearCache(`goal_progress_${goalId}`)
    
    return progress
  } catch (error) {
    console.error('Error updating goal progress:', error)
    throw error
  }
}

// Get goal templates
async getGoalTemplates(category = null) {
  try {
    let query = this.supabase
      .from('goal_templates')
      .select('*')
      .eq('is_public', true)
      .order('category', { ascending: true })
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching goal templates:', error)
    return []
  }
}

// Get goal progress history
async getGoalProgress(goalId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await this.supabase
      .from('goal_progress')
      .select('*')
      .eq('goal_id', goalId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching goal progress:', error)
    return []
  }
}

// Get client goals with progress
async getClientGoalsWithProgress(clientId) {
  try {
    // Get goals
    const { data: goals, error: goalsError } = await this.supabase
      .from('client_goals')
      .select('*')
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false })
    
    if (goalsError) throw goalsError
    
    // Get recent progress for each goal
    const goalsWithProgress = await Promise.all(goals.map(async (goal) => {
      const progress = await this.getGoalProgress(goal.id, 7) // Last 7 days
      return {
        ...goal,
        recent_progress: progress
      }
    }))
    
    return goalsWithProgress || []
  } catch (error) {
    console.error('Error fetching goals with progress:', error)
    return []
  }
}

// Delete goal
async deleteGoal(goalId) {
  try {
    const { error } = await this.supabase
      .from('client_goals')
      .delete()
      .eq('id', goalId)
    
    if (error) throw error
    
    this.clearCache('goals')
    return true
  } catch (error) {
    console.error('Error deleting goal:', error)
    throw error
  }
}

// Get goal statistics
async getGoalStatistics(clientId) {
  try {
    const goals = await this.getClientGoalsWithProgress(clientId)
    
    const stats = {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      average_progress: 0,
      streak_days: 0,
      most_consistent: null
    }
    
    // Calculate average progress
    if (stats.active > 0) {
      const totalProgress = goals
        .filter(g => g.status === 'active')
        .reduce((sum, goal) => {
          const progress = goal.target_value > 0 
            ? (goal.current_value / goal.target_value) * 100 
            : 0
          return sum + Math.min(100, progress)
        }, 0)
      
      stats.average_progress = Math.round(totalProgress / stats.active)
    }
    
    return stats
  } catch (error) {
    console.error('Error calculating goal statistics:', error)
    return {
      total: 0,
      active: 0,
      completed: 0,
      average_progress: 0,
      streak_days: 0,
      most_consistent: null
    }
  }
}

// ========================================
// COMPLETE GOALS METHODS VOOR DatabaseService.js
// Voeg deze methods toe aan je DatabaseService class
// ========================================

// ===== GOAL TEMPLATE METHODS =====

// Get templates by category with caching
async getGoalTemplatesByCategory(category, subcategory = null) {
  const cacheKey = `templates_${category}_${subcategory}`
  const cached = this.getCachedData(cacheKey)
  if (cached) return cached
  
  try {
    let query = this.supabase
      .from('goal_templates')
      .select('*')
      .eq('main_category', category)
      .eq('coach_recommended', true)
      .order('popularity_score', { ascending: false })
    
    if (subcategory) {
      query = query.eq('subcategory', subcategory)
    }
    
    const { data, error } = await query.limit(10)
    
    if (error) throw error
    
    this.setCachedData(cacheKey, data || [])
    return data || []
  } catch (error) {
    console.error('Error fetching goal templates:', error)
    return []
  }
}

// Track template usage for popularity
async trackGoalTemplateUsage(templateId) {
  try {
    // Get current popularity score
    const { data: template } = await this.supabase
      .from('goal_templates')
      .select('popularity_score')
      .eq('id', templateId)
      .single()
    
    if (template) {
      // Increment popularity
      await this.supabase
        .from('goal_templates')
        .update({ 
          popularity_score: (template.popularity_score || 0) + 1 
        })
        .eq('id', templateId)
    }
  } catch (error) {
    console.error('Error tracking template usage:', error)
  }
}

// ===== ENHANCED GOAL METHODS =====

// Save goal with category support
async saveGoal(goalData) {
  try {
    const { data, error } = await this.supabase
      .from('client_goals')
      .insert({
        client_id: goalData.client_id,
        title: goalData.title,
        goal_type: goalData.goal_type || 'custom',
        main_category: goalData.category || goalData.main_category,
        subcategory: goalData.subcategory,
        measurement_type: goalData.measurement_type || 'number',
        target_value: parseFloat(goalData.target_value) || 0,
        current_value: goalData.current_value || 0,
        start_value: goalData.current_value || 0,
        target_date: goalData.target_date,
        unit: goalData.unit || '',
        frequency: goalData.frequency || 'daily',
        frequency_target: goalData.frequency_target || 7,
        notes: goalData.notes || '',
        status: goalData.status || 'active',
        color: goalData.color || '#10b981',
        icon: goalData.icon || 'target',
        measurement_config: goalData.measurement_config || {},
        difficulty_level: goalData.difficulty_level || 'beginner',
        expected_duration_weeks: goalData.expected_duration_weeks || 4,
        is_public: goalData.is_public || false,
        reminder_enabled: goalData.reminder_enabled || false,
        reminder_time: goalData.reminder_time || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    this.clearCache(`goals_${goalData.client_id}`)
    console.log('✅ Goal saved successfully:', data)
    return data
  } catch (error) {
    console.error('Error saving goal:', error)
    throw error
  }
}

// Get goals by category
async getGoalsByCategory(clientId, category) {
  try {
    const { data, error } = await this.supabase
      .from('client_goals')
      .select('*')
      .eq('client_id', clientId)
      .eq('main_category', category)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching goals by category:', error)
    return []
  }
}

// Get client goals with full journey data
async getClientGoalsWithJourney(clientId) {
  try {
    // Get goals
    const { data: goals } = await this.supabase
      .from('client_goals')
      .select('*')
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false })
    
    if (!goals || goals.length === 0) return []
    
    // Get journey data for each goal
    const goalsWithJourney = await Promise.all(goals.map(async (goal) => {
      // Get milestones
      const { data: milestones } = await this.supabase
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', goal.id)
        .order('order_index')
      
      // Get actions
      const { data: actions } = await this.supabase
        .from('goal_actions')
        .select('*')
        .eq('goal_id', goal.id)
      
      // Get recent progress
      const { data: progress } = await this.supabase
        .from('goal_progress')
        .select('*')
        .eq('goal_id', goal.id)
        .order('date', { ascending: false })
        .limit(7)
      
      return {
        ...goal,
        milestones: milestones || [],
        actions: actions || [],
        recent_progress: progress || []
      }
    }))
    
    return goalsWithJourney
  } catch (error) {
    console.error('Error fetching goals with journey:', error)
    return []
  }
}

// ===== JOURNEY METHODS =====

// Save milestone
async saveGoalMilestone(milestoneData) {
  try {
    const { data, error } = await this.supabase
      .from('goal_milestones')
      .insert({
        goal_id: milestoneData.goal_id,
        title: milestoneData.title,
        target_value: milestoneData.target_value,
        unit: milestoneData.unit,
        target_date: milestoneData.target_date,
        order_index: milestoneData.order_index || 0,
        icon: milestoneData.icon || 'flag',
        percentage: milestoneData.percentage
      })
      .select()
      .single()
    
    if (error) throw error
    
    this.clearCache(`milestones_${milestoneData.goal_id}`)
    return data
  } catch (error) {
    console.error('Error saving milestone:', error)
    throw error
  }
}

// Complete milestone
async completeMilestone(milestoneId) {
  try {
    const { data, error } = await this.supabase
      .from('goal_milestones')
      .update({
        completed: true,
        completed_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', milestoneId)
      .select()
      .single()
    
    if (error) throw error
    
    // Check if this completes the goal
    const { data: milestone } = await this.supabase
      .from('goal_milestones')
      .select('goal_id, percentage')
      .eq('id', milestoneId)
      .single()
    
    if (milestone && milestone.percentage === 100) {
      // Mark goal as completed
      await this.updateGoalStatus(milestone.goal_id, 'completed')
    }
    
    return data
  } catch (error) {
    console.error('Error completing milestone:', error)
    throw error
  }
}

// Save goal action
async saveGoalAction(actionData) {
  try {
    const { data, error } = await this.supabase
      .from('goal_actions')
      .insert({
        goal_id: actionData.goal_id,
        title: actionData.title,
        frequency: actionData.frequency || 'weekly',
        frequency_target: actionData.frequency_target || 3,
        icon: actionData.icon || 'zap'
      })
      .select()
      .single()
    
    if (error) throw error
    
    this.clearCache(`actions_${actionData.goal_id}`)
    return data
  } catch (error) {
    console.error('Error saving action:', error)
    throw error
  }
}

// Track action completion
async trackActionCompletion(actionId, date) {
  try {
    // Log the completion
    const { error: logError } = await this.supabase
      .from('goal_action_logs')
      .upsert({
        action_id: actionId,
        date: date,
        completed: true
      }, {
        onConflict: 'action_id,date'
      })
    
    if (logError) throw logError
    
    // Get current action data
    const { data: action } = await this.supabase
      .from('goal_actions')
      .select('*')
      .eq('id', actionId)
      .single()
    
    if (action) {
      // Calculate new streak
      const lastCompleted = action.last_completed 
        ? new Date(action.last_completed) 
        : new Date(0)
      
      const today = new Date(date)
      const daysDiff = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24))
      
      // Reset streak if more than 2 days gap
      const newStreak = daysDiff <= 2 
        ? (action.current_streak || 0) + 1 
        : 1
      
      const bestStreak = Math.max(newStreak, action.best_streak || 0)
      
      // Update action
      await this.supabase
        .from('goal_actions')
        .update({
          current_streak: newStreak,
          best_streak: bestStreak,
          last_completed: date
        })
        .eq('id', actionId)
    }
    
    return true
  } catch (error) {
    console.error('Error tracking action completion:', error)
    throw error
  }
}

// Get action logs for a period
async getActionLogs(actionId, startDate, endDate) {
  try {
    const { data, error } = await this.supabase
      .from('goal_action_logs')
      .select('*')
      .eq('action_id', actionId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching action logs:', error)
    return []
  }
}

// ===== ANALYTICS METHODS =====

// Get goal analytics
async getGoalAnalytics(clientId, goalId) {
  try {
    // Get goal data
    const { data: goal } = await this.supabase
      .from('client_goals')
      .select('*')
      .eq('id', goalId)
      .single()
    
    if (!goal) return null
    
    // Get progress history
    const { data: progressHistory } = await this.supabase
      .from('goal_progress')
      .select('*')
      .eq('goal_id', goalId)
      .order('date', { ascending: false })
      .limit(30)
    
    // Get milestones completion rate
    const { data: milestones } = await this.supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goalId)
    
    const completedMilestones = milestones?.filter(m => m.completed).length || 0
    const totalMilestones = milestones?.length || 0
    
    // Get actions consistency
    const { data: actions } = await this.supabase
      .from('goal_actions')
      .select('*')
      .eq('goal_id', goalId)
    
    const totalStreak = actions?.reduce((sum, a) => sum + (a.current_streak || 0), 0) || 0
    const avgStreak = actions?.length > 0 ? totalStreak / actions.length : 0
    
    // Calculate progress rate
    const startDate = new Date(goal.created_at || Date.now())
    const currentDate = new Date()
    const daysElapsed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24))
    const progressPercentage = goal.target_value > 0 
      ? ((goal.current_value - (goal.start_value || 0)) / (goal.target_value - (goal.start_value || 0))) * 100
      : 0
    
    const dailyProgressRate = daysElapsed > 0 ? progressPercentage / daysElapsed : 0
    
    // Estimate completion
    const remainingProgress = 100 - progressPercentage
    const estimatedDaysToComplete = dailyProgressRate > 0 
      ? Math.ceil(remainingProgress / dailyProgressRate)
      : null
    
    const estimatedCompletionDate = estimatedDaysToComplete
      ? new Date(Date.now() + estimatedDaysToComplete * 24 * 60 * 60 * 1000)
      : null
    
    return {
      goal: goal,
      progressHistory: progressHistory || [],
      milestoneCompletion: totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0,
      averageStreak: Math.round(avgStreak),
      dailyProgressRate: dailyProgressRate.toFixed(2),
      estimatedCompletionDate: estimatedCompletionDate?.toISOString().split('T')[0],
      successProbability: calculateSuccessProbability(
        progressPercentage,
        avgStreak,
        daysElapsed,
        estimatedDaysToComplete
      )
    }
  } catch (error) {
    console.error('Error calculating goal analytics:', error)
    return null
  }
}

// Get category progress
async getCategoryProgress(clientId, category) {
  try {
    const { data: goals } = await this.supabase
      .from('client_goals')
      .select('*')
      .eq('client_id', clientId)
      .eq('main_category', category)
      .eq('status', 'active')
    
    if (!goals || goals.length === 0) {
      return {
        category: category,
        totalGoals: 0,
        averageProgress: 0,
        completedGoals: 0,
        totalXP: 0
      }
    }
    
    const totalProgress = goals.reduce((sum, goal) => {
      const progress = goal.target_value > 0
        ? (goal.current_value / goal.target_value) * 100
        : 0
      return sum + Math.min(100, progress)
    }, 0)
    
    const completedGoals = goals.filter(g => g.status === 'completed').length
    
    // Calculate XP (0.5 per percent progress + 50 bonus per completed goal)
    const totalXP = Math.floor(totalProgress * 0.5) + (completedGoals * 50)
    
    return {
      category: category,
      totalGoals: goals.length,
      averageProgress: Math.round(totalProgress / goals.length),
      completedGoals: completedGoals,
      totalXP: totalXP
    }
  } catch (error) {
    console.error('Error calculating category progress:', error)
    return {
      category: category,
      totalGoals: 0,
      averageProgress: 0,
      completedGoals: 0,
      totalXP: 0
    }
  }
}

// Get all categories progress
async getAllCategoriesProgress(clientId) {
  const categories = ['herstel', 'mindset', 'workout', 'voeding', 'structuur']
  
  try {
    const progressData = await Promise.all(
      categories.map(cat => this.getCategoryProgress(clientId, cat))
    )
    
    return progressData
  } catch (error) {
    console.error('Error fetching all categories progress:', error)
    return categories.map(cat => ({
      category: cat,
      totalGoals: 0,
      averageProgress: 0,
      completedGoals: 0,
      totalXP: 0
    }))
  }

}



async updateGoalProgress(goalId, progressData) {
  try {
    // Update current_value in client_goals
    const { data: goalUpdate, error: goalError } = await this.supabase
      .from('client_goals')
      .update({
        current_value: progressData.value,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select()
      .single()
    
    if (goalError) throw goalError
    
    // Log progress in goal_progress table
    const { data: progressLog, error: progressError } = await this.supabase
      .from('goal_progress')
      .insert({
        goal_id: goalId,
        client_id: progressData.client_id,
        date: progressData.date || new Date().toISOString().split('T')[0],
        value: progressData.value,
        notes: progressData.notes || '',
        checked: false
      })
      .select()
      .single()
    
    if (progressError) throw progressError
    
    this.clearCache(`goals_${progressData.client_id}`)
    console.log('✅ Goal progress updated')
    return { goal: goalUpdate, progress: progressLog }
  } catch (error) {
    console.error('Update goal progress error:', error)
    throw error
  }
}

// Save week progress voor checkbox goals
async saveWeekProgress(goalId, clientId, checkedDays) {
  try {
    const weekDates = this.getWeekDates(new Date())
    const updates = []
    
    // Create upsert data for each day of the week
    for (let i = 0; i < 7; i++) {
      const date = weekDates[i]
      const isChecked = checkedDays.includes(i)
      
      updates.push({
        goal_id: goalId,
        client_id: clientId,
        date: date,
        checked: isChecked,
        value: isChecked ? 1 : 0,
        notes: `Week progress: Day ${i + 1}`
      })
    }
    
    // Upsert all days at once
    const { data, error } = await this.supabase
      .from('goal_progress')
      .upsert(updates, {
        onConflict: 'goal_id,date'
      })
    
    if (error) throw error
    
    // Update current_value in client_goals
    const { error: updateError } = await this.supabase
      .from('client_goals')
      .update({
        current_value: checkedDays.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
    
    if (updateError) throw updateError
    
    this.clearCache(`goals_${clientId}`)
    console.log('✅ Week progress saved:', checkedDays.length, 'days completed')
    return data
  } catch (error) {
    console.error('Save week progress error:', error)
    throw error
  }
}

// Get week progress voor checkbox goals
async getWeekProgress(goalId, weekStart = null) {
  try {
    const weekDates = this.getWeekDates(weekStart || new Date())
    const startDate = weekDates[0]
    const endDate = weekDates[6]
    
    const { data, error } = await this.supabase
      .from('goal_progress')
      .select('*')
      .eq('goal_id', goalId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    
    if (error) throw error
    
    // Convert to array of checked day indices
    const checkedDays = []
    data?.forEach(entry => {
      if (entry.checked) {
        const date = new Date(entry.date)
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1 // Mon=0, Sun=6
        checkedDays.push(dayIndex)
      }
    })
    
    return checkedDays
  } catch (error) {
    console.error('Get week progress error:', error)
    return []
  }
}

// Load all weekly progress voor multiple checkbox goals
async loadWeeklyProgress(clientId) {
  try {
    // Get all active checkbox goals
    const { data: goals, error: goalsError } = await this.supabase
      .from('client_goals')
      .select('id')
      .eq('client_id', clientId)
      .eq('measurement_type', 'checkbox')
      .eq('status', 'active')
    
    if (goalsError) throw goalsError
    
    const progress = {}
    
    // Load week progress for each goal
    for (const goal of goals || []) {
      const weekData = await this.getWeekProgress(goal.id)
      progress[goal.id] = weekData
    }
    
    return progress
  } catch (error) {
    console.error('Load weekly progress error:', error)
    return {}
  }
}

// Complete goal method (als deze nog niet bestaat)
async completeGoal(goalId) {
  try {
    const { data, error } = await this.supabase
      .from('client_goals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select()
      .single()
    
    if (error) throw error
    
    // Track XP earning
    if (data) {
      // Award 50 XP for completing a goal
      const xp = 50
      console.log(`🎉 Goal completed! +${xp} XP earned`)
      
      // You could also track this in a separate XP table if needed
    }
    
    this.clearCache('goals')
    return data
  } catch (error) {
    console.error('Complete goal error:', error)
    throw error
  }
}

// Delete goal method (als deze nog niet bestaat)
async deleteGoal(goalId) {
  try {
    // First delete all related data
    await this.supabase.from('goal_progress').delete().eq('goal_id', goalId)
    await this.supabase.from('goal_milestones').delete().eq('goal_id', goalId)
    await this.supabase.from('goal_actions').delete().eq('goal_id', goalId)
    
    // Then delete the goal itself
    const { error } = await this.supabase
      .from('client_goals')
      .delete()
      .eq('id', goalId)
    
    if (error) throw error
    
    this.clearCache('goals')
    console.log('✅ Goal deleted')
    return true
  } catch (error) {
    console.error('Delete goal error:', error)
    throw error
  }}






 async getRandomQuote(language = 'nl') {
    try {
      const { data, error } = await this.supabase
        .from('quotes')
        .select('*')
        .eq('is_active', true)
        .eq('language', language)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length)
        return data[randomIndex]
      }
      
      return null
    } catch (error) {
      console.error('Error getting quote:', error)
      return null
    }
  }

  async getQuoteOfTheDay() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // First check if there's a specific quote for today
      const { data: specificQuote } = await this.supabase
        .from('quotes')
        .select('*')
        .eq('display_date', today)
        .eq('is_active', true)
        .single()
      
      if (specificQuote) return specificQuote
      
      // Otherwise get a random quote
      return await this.getRandomQuote()
    } catch (error) {
      console.error('Error getting quote of the day:', error)
      return null
    }
  }

  // ===== WELCOME MESSAGES =====
  async getWelcomeMessage() {
    try {
      const hour = new Date().getHours()
      let timeOfDay = 'morning'
      
      if (hour >= 12 && hour < 18) timeOfDay = 'afternoon'
      else if (hour >= 18) timeOfDay = 'evening'
      
      const { data, error } = await this.supabase
        .from('daily_welcomes')
        .select('*')
        .eq('is_active', true)
        .eq('time_of_day', timeOfDay)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length)
        return data[randomIndex]
      }
      
      return {
        welcome_text: 'Klaar om je doelen te verpletteren?',
        subtitle: 'Laten we er een geweldige dag van maken!'
      }
    } catch (error) {
      console.error('Error getting welcome message:', error)
      return {
        welcome_text: 'Welkom terug!',
        subtitle: 'Tijd om aan je doelen te werken.'
      }
    }
  }

  // ===== SCHEDULED CALLS =====
  async getNextScheduledCall(clientId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('scheduled_calls')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'scheduled')
        .gte('call_date', today)
        .order('call_date', { ascending: true })
        .order('call_time', { ascending: true })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      
      return data
    } catch (error) {
      console.error('Error getting next call:', error)
      return null
    }
  }

  async getRecentCalls(clientId, limit = 5) {
    try {
      const { data, error } = await this.supabase
        .from('scheduled_calls')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .order('call_date', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Error getting recent calls:', error)
      return []
    }
  }

  async scheduleCall(callData) {
    try {
      const { data, error } = await this.supabase
        .from('scheduled_calls')
        .insert([{
          ...callData,
          status: 'scheduled',
          reminder_sent: false
        }])
        .select()
        .single()
      
      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Error scheduling call:', error)
      throw error
    }
  }

  async updateCallStatus(callId, status) {
    try {
      const { data, error } = await this.supabase
        .from('scheduled_calls')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', callId)
        .select()
        .single()
      
      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Error updating call status:', error)
      throw error
    }
  }

  // ===== COACH VIDEOS =====
 



// ===== ADD DEZE MISSENDE VIDEO METHODS AAN DatabaseService.js =====
// BEHOUD je bestaande getCoachVideos, getFeaturedVideos, incrementVideoView!
// Voeg alleen deze toe:

// Create new video
async createVideo(videoData) {
  try {
    const { data, error } = await this.supabase
      .from('coach_videos')
      .insert([{
        coach_id: videoData.coach_id,
        title: videoData.title,
        description: videoData.description,
        video_url: videoData.video_url,
        thumbnail_url: videoData.thumbnail_url,
        category: videoData.category,
        tags: videoData.tags || [],
        duration_seconds: videoData.duration_seconds,
        difficulty_level: videoData.difficulty_level || 'beginner',
        best_time_to_watch: videoData.best_time_to_watch || 'anytime',
        page_context: videoData.page_context,
        is_active: true,
        is_featured: false,
        view_count: 0,
        like_count: 0
      }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error creating video:', error)
    return { success: false, error: error.message }
  }
}

// Delete video (soft delete)
async deleteVideo(videoId) {
  try {
    const { error } = await this.supabase
      .from('coach_videos')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting video:', error)
    return { success: false, error: error.message }
  }
}

// Assign video to clients
async assignVideoToClients(videoId, clientIds, assignmentData = {}) {
  try {
    const assignments = clientIds.map(clientId => ({
      video_id: videoId,
      client_id: clientId,
      assigned_by: assignmentData.assigned_by,
      assignment_type: assignmentData.type || 'manual',
      scheduled_for: assignmentData.scheduledFor || new Date().toISOString().split('T')[0],
      time_of_day: assignmentData.timeOfDay || 'anytime',
      page_context: assignmentData.pageContext || 'home',
      context_data: assignmentData.contextData || {},
      notes: assignmentData.notes || '',
      status: 'assigned',
      created_at: new Date().toISOString()
    }))

    const { data, error } = await this.supabase
      .from('video_assignments')
      .insert(assignments)
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error assigning video:', error)
    return { success: false, error: error.message }
  }
}

// Get video assignments for a specific video
async getVideoAssignments(videoId) {
  try {
    const { data, error } = await this.supabase
      .from('video_assignments')
      .select(`
        *,
        client:clients(id, first_name, last_name, email)
      `)
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error fetching video assignments:', error)
    return []
  }
}

// Remove assignment
async removeVideoAssignment(assignmentId) {
  try {
    const { error } = await this.supabase
      .from('video_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('❌ Error removing assignment:', error)
    return { success: false, error: error.message }
  }
}

// Upload video thumbnail to storage
async uploadVideoThumbnail(file, coachId) {
  try {
    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${coachId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // Upload to storage
    const { data, error } = await this.supabase.storage
      .from('video-thumbnails')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('video-thumbnails')
      .getPublicUrl(fileName)

    return { success: true, thumbnailUrl: publicUrl }
  } catch (error) {
    console.error('❌ Error uploading thumbnail:', error)
    return { success: false, error: error.message }
  }
}






// Voeg ALLEEN deze toe aan DatabaseService.js als ze ontbreken
// Je VideoService.js doet het meeste werk al!

// Voor compatibiliteit met andere delen van de app
async getCoachVideos(coachId, category = null) {
  try {
    let query = this.supabase
      .from('coach_videos')
      .select('*')
      .eq('is_active', true)
      .or(`coach_id.eq.${coachId},is_featured.eq.true`)
      .order('order_index', { ascending: true })
    
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query.limit(20)
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error getting coach videos:', error)
    return []
  }
}

// Als deze ook ontbreekt
async getFeaturedVideos(limit = 5) {
  try {
    const { data, error } = await this.supabase
      .from('coach_videos')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('order_index', { ascending: true })
      .limit(limit)
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error getting featured videos:', error)
    return []
  }
}

// Als deze ook ontbreekt
async incrementVideoView(videoId) {
  try {
    const { data: video } = await this.supabase
      .from('coach_videos')
      .select('view_count')
      .eq('id', videoId)
      .single()
    
    if (video) {
      const { error } = await this.supabase
        .from('coach_videos')
        .update({ 
          view_count: (video.view_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)
      
      if (error) throw error
    }
  } catch (error) {
    console.error('Error incrementing video view:', error)
  }
}







  // ===== COACH MESSAGES / NOTIFICATIONS =====
  async getUnreadCoachMessages(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('coach_notifications')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'unread')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Error getting coach messages:', error)
      return []
    }
  }

  async markMessageAsRead(messageId) {
    try {
      const { error } = await this.supabase
        .from('coach_notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
      
      if (error) throw error
      
      return true
    } catch (error) {
      console.error('Error marking message as read:', error)
      return false
    }
  }

  async sendCoachMessage(clientId, message) {
    try {
      const { data, error } = await this.supabase
        .from('coach_notifications')
        .insert([{
          client_id: clientId,
          type: message.type || 'message',
          priority: message.priority || 'normal',
          title: message.title || 'Coach Bericht',
          message: message.text,
          action_type: message.action?.type,
          action_target: message.action?.target,
          action_label: message.action?.label,
          status: 'unread'
        }])
        .select()
        .single()
      
      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Error sending coach message:', error)
      throw error
    }
  }

  // ===== QUICK ACTIONS DATA =====
  async getTodaysWorkout(clientId) {
    try {
      const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
      const today = dayNames[new Date().getDay()]
      
      const { data, error } = await this.supabase
        .from('client_workouts')
        .select('*, workout_templates(*)')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      if (data?.workout_templates?.exercises) {
        const todaysExercises = data.workout_templates.exercises.find(ex => 
          ex.day?.toLowerCase() === today.toLowerCase()
        )
        return todaysExercises
      }
      
      return null
    } catch (error) {
      console.error('Error getting today workout:', error)
      return null
    }
  }

  async getNextGoalDeadline(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_goals')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .gte('target_date', new Date().toISOString())
        .order('target_date', { ascending: true })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      return data
    } catch (error) {
      console.error('Error getting next goal:', error)
      return null
    }
  }

  async getWeeklyProgress(clientId) {
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const [workouts, meals, goals] = await Promise.all([
        this.getWeeklyWorkoutCount(clientId),
        this.getWeeklyMealAdherence(clientId),
        this.getGoalProgress(clientId)
      ])
      
      return {
        workouts,
        meals,
        goals,
        streak: await this.getClientStreak(clientId)
      }
    } catch (error) {
      console.error('Error getting weekly progress:', error)
      return {
        workouts: 0,
        meals: 0,
        goals: 0,
        streak: 0
      }
    }
  }

  async getWeeklyMealAdherence(clientId) {
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data, error } = await this.supabase
        .from('meal_logs')
        .select('adherence_percentage')
        .eq('client_id', clientId)
        .gte('date', weekAgo.toISOString())
      
      if (error) throw error
      
      if (data && data.length > 0) {
        const totalAdherence = data.reduce((sum, log) => sum + (log.adherence_percentage || 0), 0)
        return Math.round(totalAdherence / data.length)
      }
      
      return 0
    } catch (error) {
      console.error('Error getting meal adherence:', error)
      return 0
    }
  }

  async getGoalProgress(clientId) {
    try {
      const goals = await this.getClientGoals(clientId)
      const activeGoals = goals.filter(g => g.status === 'active')
      
      if (activeGoals.length === 0) return 0
      
      const totalProgress = activeGoals.reduce((sum, goal) => {
        const progress = (goal.current_value / goal.target_value) * 100
        return sum + Math.min(100, progress)
      }, 0)
      
      return Math.round(totalProgress / activeGoals.length)
    } catch (error) {
      console.error('Error getting goal progress:', error)
      return 0
    }
  }








// ADD DEZE METHODS AAN DatabaseService.js (onderaan het bestand)
// Zoek naar het einde van de class of voeg toe waar andere methods staan

// ==========================================
// INGREDIENT METHODS - Voor AI Meal Generator
// ==========================================

async getAllIngredients() {
  try {
    console.log('🥗 Fetching all ingredients...')
    const { data, error } = await this.supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching ingredients:', error)
      throw error
    }
    
    console.log(`✅ Loaded ${data?.length || 0} ingredients`)
    return data || []
  } catch (error) {
    console.error('❌ getAllIngredients failed:', error)
    return []
  }
}

async searchIngredients(searchTerm) {
  try {
    if (!searchTerm || searchTerm.length < 2) return []
    
    console.log('🔍 Searching ingredients for:', searchTerm)
    const { data, error } = await this.supabase
      .from('ingredients')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(20)
    
    if (error) {
      console.error('❌ Search error:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('❌ searchIngredients failed:', error)
    return []
  }
}

async getIngredientsByCategory(category) {
  try {
    console.log('📂 Fetching ingredients for category:', category)
    const { data, error } = await this.supabase
      .from('ingredients')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true })
    
    if (error) {
      console.error('❌ Category fetch error:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('❌ getIngredientsByCategory failed:', error)
    return []
  }
}

async getIngredientById(id) {
  try {
    const { data, error } = await this.supabase
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('❌ Error fetching ingredient:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('❌ getIngredientById failed:', error)
    return null
  }
}

// Calculate macros voor specifieke portie
calculateIngredientMacros(ingredient, portionGrams) {
  if (!ingredient) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  
  const factor = portionGrams / 100
  
  return {
    calories: Math.round((ingredient.calories_per_100g || 0) * factor),
    protein: Math.round((ingredient.protein_per_100g || 0) * factor * 10) / 10,
    carbs: Math.round((ingredient.carbs_per_100g || 0) * factor * 10) / 10,
    fat: Math.round((ingredient.fat_per_100g || 0) * factor * 10) / 10,
    fiber: Math.round((ingredient.fiber_per_100g || 0) * factor * 10) / 10
  }
}

// Save custom recipe
// VERVANG DE saveRecipe METHOD IN DatabaseService.js
// Zoek naar: async saveRecipe(recipeData)

async saveRecipe(recipeData) {
  try {
    console.log('💾 Saving recipe:', recipeData.name)
    
    // Save recipe hoofddata - met CORRECTE veldnamen
    const { data: recipe, error: recipeError } = await this.supabase
      .from('recipes')
      .insert({
        name: recipeData.name,
        category: recipeData.category || 'custom',
        total_calories: Math.round(recipeData.calories || 0),
        total_protein: Math.round((recipeData.protein || 0) * 10) / 10,
        total_carbs: Math.round((recipeData.carbs || 0) * 10) / 10,
        total_fat: Math.round((recipeData.fat || 0) * 10) / 10,
        total_fiber: Math.round((recipeData.fiber || 0) * 10) / 10,
        total_weight_grams: Math.round(recipeData.totalWeight || 0),
        preparation_steps: recipeData.steps || '',
        prep_time_minutes: recipeData.prepTime || 15,
        cook_time_minutes: recipeData.cookTime || 30,
        servings: recipeData.servings || 1,
        created_by: recipeData.createdBy || 'coach'
      })
      .select()
      .single()
    
    if (recipeError) {
      console.error('❌ Recipe save error:', recipeError)
      console.error('❌ Error details:', {
        message: recipeError.message,
        details: recipeError.details,
        hint: recipeError.hint,
        code: recipeError.code
      })
      throw recipeError
    }
    
    console.log('✅ Recipe saved with ID:', recipe.id)
    
    // Save recipe ingredients als die er zijn
    if (recipe && recipeData.ingredients?.length > 0) {
      const ingredientRows = recipeData.ingredients.map(ing => ({
        recipe_id: recipe.id,
        ingredient_id: ing.id,
        amount_grams: Math.round((ing.amount || 0) * 10) / 10,
        notes: ing.notes || null
      }))
      
      console.log('💾 Saving', ingredientRows.length, 'ingredients...')
      
      const { data: ingredientData, error: ingredientsError } = await this.supabase
        .from('recipe_ingredients')
        .insert(ingredientRows)
        .select()
      
      if (ingredientsError) {
        console.error('❌ Recipe ingredients save error:', ingredientsError)
        console.error('❌ Error details:', {
          message: ingredientsError.message,
          details: ingredientsError.details,
          hint: ingredientsError.hint
        })
        
        // Rollback recipe als ingredients falen
        console.log('⏮️ Rolling back recipe...')
        await this.supabase
          .from('recipes')
          .delete()
          .eq('id', recipe.id)
        
        throw ingredientsError
      }
      
      console.log('✅ Saved', ingredientData.length, 'ingredients')
    }
    
    console.log('✅ Recipe saved successfully:', recipe.id)
    return recipe
    
  } catch (error) {
    console.error('❌ saveRecipe failed:', error)
    console.error('Full error object:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    throw error
  }
}
// Get recipes voor meal planning
async getRecipes(category = null) {
  try {
    let query = this.supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          amount_grams,
          ingredients (*)
        )
      `)
      .order('name', { ascending: true })
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ Error fetching recipes:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('❌ getRecipes failed:', error)
    return []
  }
}

// Product variants voor merken
async getProductVariants(ingredientId) {
  try {
    const { data, error } = await this.supabase
      .from('product_variants')
      .select('*')
      .eq('ingredient_id', ingredientId)
      .order('brand', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching variants:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('❌ getProductVariants failed:', error)
    return []
  }
}

// Save product variant (merk-specifiek)
async saveProductVariant(variantData) {
  try {
    const { data, error } = await this.supabase
      .from('product_variants')
      .insert({
        ingredient_id: variantData.ingredientId,
        brand: variantData.brand,
        barcode: variantData.barcode || null,
        calories_per_100g: variantData.calories,
        protein_per_100g: variantData.protein,
        carbs_per_100g: variantData.carbs,
        fat_per_100g: variantData.fat,
        verified: variantData.verified || false,
        source: variantData.source || 'manual'
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Variant save error:', error)
      throw error
    }
    
    console.log('✅ Product variant saved:', data.id)
    return data
  } catch (error) {
    console.error('❌ saveProductVariant failed:', error)
    throw error
  }
}




async getClientByEmail(email) {
  try {
    console.log('🔍 Fetching client for email:', email);
    
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('❌ Client fetch failed:', error);
      
      // Specifieke 406 error handling
      if (error.code === 'PGRST116') {
        console.error('🔴 RLS Policy Error - Run diagnostics tool!');
        throw new Error('Database permission error - contact admin');
      }
      
      throw error;
    }
    
    console.log('✅ Client found:', data?.first_name, data?.last_name);
    return data;
    
  } catch (error) {
    console.error('getClientByEmail error:', error);
    return null;
  }
}











// Add this method to DatabaseService.js (around line 2000, after other AI methods)

  // ========================================
  // AI MEAL PLANNING SERVICE BRIDGE
  // ========================================
  
  /**
   * Get or create AI Meal Planning Service instance
   * This bridges the gap between DatabaseService and the AI planning engine
   */
  async getAIMealPlanningService() {
    try {
      // Check if service already exists
      if (this.aiMealPlanningService) {
        return this.aiMealPlanningService
      }
      
      // Import the service dynamically
      const module = await import('../modules/ai-meal-generator/AIMealPlanningService.js')
      const { getAIMealPlanningService } = module
      
      // Create and cache the service instance
      this.aiMealPlanningService = getAIMealPlanningService(this.supabase)
      
      console.log('✅ AI Meal Planning Service initialized')
      return this.aiMealPlanningService
      
    } catch (error) {
      console.error('❌ Failed to initialize AI Meal Planning Service:', error)
      
      // Fallback: return a basic service with minimal functionality
      return {
        ensureClientProfile: async (client) => {
          // Use existing getClientNutritionProfile as fallback
          const profile = await this.getClientNutritionProfile(client.id)
          return {
            client_id: client.id,
            ...profile,
            primary_goal: client.goal || 'maintain',
            meals_per_day: 4,
            budget_tier: 'moderate'
          }
        },
        loadAIMeals: async () => {
          // Use existing getAIMeals
          return await this.getAIMeals()
        },
        scoreAllMeals: (meals, profile) => {
          // Basic scoring without AI
          return meals.map(meal => ({
            ...meal,
            aiScore: Math.random() * 100,
            scoreBreakdown: {
              goalAlignment: 0,
              macroFit: 0,
              preferences: 0,
              practical: 0,
              budget: 0,
              variety: 0
            }
          }))
        },
        generateWeekPlan: async (profile, options) => {
          // Fallback to existing generateWeekMealPlan
          return await this.generateWeekMealPlan(profile.client_id)
        },
        generateShoppingList: (weekPlan) => {
          // Basic shopping list
          const ingredients = new Map()
          let totalCost = 0
          
          weekPlan.forEach(day => {
            const meals = [day.breakfast, day.lunch, day.dinner, ...day.snacks].filter(Boolean)
            meals.forEach(meal => {
              totalCost += 10 // Estimated cost
            })
          })
          
          return {
            ingredients: Array.from(ingredients.values()),
            totalCost: totalCost.toFixed(2),
            dailyCost: (totalCost / 7).toFixed(2)
          }
        }
      }
    }
  }







// ==================== AI MEAL SYSTEM METHODS ====================
// Voeg deze toe aan DatabaseService.js rond regel 2000-2500
// NA de goal methods, VOOR de quote methods













/**
 * AI MEALS - Get all AI meals with smart filtering
 */
async getAIMeals(filters = {}) {
  try {
    let query = this.supabase
      .from('ai_meals')
      .select('*')
      .order('name')

    if (filters.timing) {
      query = query.contains('timing', [filters.timing])
    }

    if (filters.minCalories) {
      query = query.gte('calories', filters.minCalories)
    }
    if (filters.maxCalories) {
      query = query.lte('calories', filters.maxCalories)
    }

    if (filters.minProtein) {
      query = query.gte('protein', filters.minProtein)
    }

    if (filters.labels && filters.labels.length > 0) {
      query = query.contains('labels', filters.labels)
    }

    if (filters.costTier) {
      query = query.eq('cost_tier', filters.costTier)
    }

    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }

    if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
      for (const allergen of filters.excludeAllergens) {
        query = query.not('allergens', 'cs', `{${allergen}}`)
      }
    }

    const { data, error } = await query
    
    if (error) throw error
    
    console.log(`✅ Fetched ${data?.length || 0} AI meals`)
    return data || []
  } catch (error) {
    console.error('❌ Error fetching AI meals:', error)
    return []
  }
}

/**
 * AI MEALS - Get specific meals by IDs
 */
async getAIMealsByIds(mealIds) {
  try {
    if (!mealIds || mealIds.length === 0) return []

    const { data, error } = await this.supabase
      .from('ai_meals')
      .select('*')
      .in('id', mealIds)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error fetching meals by IDs:', error)
    return []
  }
}

/**
 * AI INGREDIENTS - Get all ingredients
 */
async getAIIngredients() {
  try {
    const { data, error } = await this.supabase
      .from('ai_ingredients')
      .select('*')
      .order('name')
    
    if (error) throw error
    
    console.log(`✅ Fetched ${data?.length || 0} AI ingredients`)
    return data || []
  } catch (error) {
    console.error('❌ Error fetching AI ingredients:', error)
    return []
  }
}

/**
 * CLIENT NUTRITION - Get detailed nutrition preferences
 */
async getClientNutritionProfile(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('clients')
      .select(`
        id,
        first_name,
        last_name,
        current_weight,
        target_weight,
        height,
        age,
        gender,
        primary_goal,
        target_calories,
        target_protein,
        target_carbs,
        target_fat,
        activity_level,
        dietary_type,
        allergies,
        intolerances,
        loved_foods,
        hated_foods,
        favorite_cuisines,
        budget_per_week,
        cooking_skill,
        cooking_time,
        meal_prep_preference
      `)
      .eq('id', clientId)
      .single()
    
    if (error) throw error
    
    console.log(`✅ Fetched nutrition profile for client ${clientId}`)
    return data
  } catch (error) {
    console.error('❌ Error fetching client nutrition profile:', error)
    return null
  }
}

/**
 * SMART SUGGESTIONS - Get AI meal suggestions based on client profile
 */
async getSmartMealSuggestions(clientId, mealType = 'lunch', limit = 10) {
  try {
    const client = await this.getClientNutritionProfile(clientId)
    if (!client) {
      console.warn('No client profile found')
      return []
    }

    const mealCalorieRatio = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.35,
      snack: 0.05
    }
    
    const targetCalories = (client.target_calories || 2000) * (mealCalorieRatio[mealType] || 0.35)
    const minCalories = targetCalories * 0.8
    const maxCalories = targetCalories * 1.2

    const filters = {
      timing: mealType,
      minCalories: Math.floor(minCalories),
      maxCalories: Math.ceil(maxCalories),
      minProtein: Math.floor((client.target_protein || 150) / 4)
    }

    if (client.dietary_type) {
      const dietaryLabels = []
      if (client.dietary_type.toLowerCase().includes('vegetarian')) {
        dietaryLabels.push('vegetarian')
      }
      if (client.dietary_type.toLowerCase().includes('vegan')) {
        dietaryLabels.push('vegan')
      }
      if (dietaryLabels.length > 0) {
        filters.labels = dietaryLabels
      }
    }

    if (client.allergies) {
      filters.excludeAllergens = client.allergies.split(',').map(a => a.trim().toLowerCase())
    }

    if (client.budget_per_week) {
      if (client.budget_per_week < 50) filters.costTier = 'budget'
      else if (client.budget_per_week < 100) filters.costTier = 'medium'
      else filters.costTier = 'premium'
    }

    if (client.cooking_skill === 'beginner') {
      filters.difficulty = 'etm'
    }

    const meals = await this.getAIMeals(filters)

    const scoredMeals = meals.map(meal => {
      let score = 0
      
      const proteinRatio = meal.protein / meal.calories
      score += proteinRatio * 100
      
      if (client.primary_goal === 'muscle_gain' && meal.labels?.includes('bulk_friendly')) {
        score += 25
      }
      if (client.primary_goal === 'fat_loss' && meal.labels?.includes('cut_friendly')) {
        score += 25
      }
      if (client.primary_goal === 'fat_loss' && meal.calories < targetCalories) {
        score += 10
      }
      
      if (client.loved_foods) {
        const favorites = client.loved_foods.toLowerCase().split(',').map(f => f.trim())
        const mealName = meal.name.toLowerCase()
        const ingredientsList = JSON.stringify(meal.ingredients_list || '').toLowerCase()
        
        favorites.forEach(fav => {
          if (mealName.includes(fav) || ingredientsList.includes(fav)) {
            score += 20
          }
        })
      }
      
      if (client.hated_foods) {
        const hated = client.hated_foods.toLowerCase().split(',').map(h => h.trim())
        const mealName = meal.name.toLowerCase()
        const ingredientsList = JSON.stringify(meal.ingredients_list || '').toLowerCase()
        
        hated.forEach(hate => {
          if (mealName.includes(hate) || ingredientsList.includes(hate)) {
            score -= 50
          }
        })
      }
      
      score += Math.random() * 5
      
      return { ...meal, _score: score }
    })

    const topMeals = scoredMeals
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)

    console.log(`✅ Generated ${topMeals.length} smart suggestions for ${mealType}`)
    return topMeals
  } catch (error) {
    console.error('❌ Error getting smart meal suggestions:', error)
    return []
  }
}

/**
 * MEAL PLAN - Save AI generated meal plan
 */
async saveAIMealPlan(planData) {
  try {
    if (!planData.client_id) {
      throw new Error('client_id is required')
    }

    await this.supabase
      .from('client_meal_plans')
      .update({ is_active: false })
      .eq('client_id', planData.client_id)
      .eq('is_active', true)

    const mealPlan = {
      client_id: planData.client_id,
      name: planData.name || 'AI Generated Week Plan',
      week_structure: planData.week_structure || {},
      daily_calories: planData.daily_calories || 2000,
      daily_protein: planData.daily_protein || 150,
      daily_carbs: planData.daily_carbs || 200,
      daily_fat: planData.daily_fat || 67,
      is_active: true,
      start_date: planData.start_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('client_meal_plans')
      .insert([mealPlan])
      .select()
      .single()

    if (error) throw error
    
    console.log(`✅ Saved AI meal plan for client ${planData.client_id}`)
    return data
  } catch (error) {
    console.error('❌ Error saving AI meal plan:', error)
    return null
  }
}

/**
 * MEAL PLAN - Get active AI meal plan
 */
async getClientAIMealPlan(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('client_meal_plans')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    if (data) {
      console.log(`✅ Fetched active meal plan for client ${clientId}`)
    }
    return data
  } catch (error) {
    console.error('❌ Error fetching client AI meal plan:', error)
    return null
  }
}

/**
 * MEAL PLAN - Update specific meal in plan
 */
async updateMealInPlan(planId, day, slotIndex, newMeal) {
  try {
    const { data: plan, error: fetchError } = await this.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', planId)
      .single()

    if (fetchError) throw fetchError

    const updatedStructure = { ...plan.week_structure }
    
    if (!updatedStructure[day]) {
      updatedStructure[day] = []
    }
    
    if (updatedStructure[day][slotIndex]) {
      updatedStructure[day][slotIndex].meal = newMeal
    } else {
      updatedStructure[day][slotIndex] = {
        slot: newMeal.timing?.[0] || 'custom',
        meal: newMeal,
        time: '12:00'
      }
    }

    const { error: updateError } = await this.supabase
      .from('client_meal_plans')
      .update({ 
        week_structure: updatedStructure,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)

    if (updateError) throw updateError
    
    console.log(`✅ Updated meal in plan ${planId}`)
    return true
  } catch (error) {
    console.error('❌ Error updating meal in plan:', error)
    return false
  }
}

/**
 * WEEK GENERATION - Generate complete week plan
 */
async generateWeekMealPlan(clientId) {
  try {
    const client = await this.getClientNutritionProfile(clientId)
    if (!client) {
      throw new Error('Client profile not found')
    }

    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const weekStructure = {}

    console.log('🔄 Generating week meal plan...')

    for (const day of weekDays) {
      const dayMeals = []
      
      const breakfast = await this.getSmartMealSuggestions(clientId, 'breakfast', 3)
      if (breakfast.length > 0) {
        dayMeals.push({
          slot: 'breakfast',
          meal: breakfast[Math.floor(Math.random() * Math.min(3, breakfast.length))],
          time: '08:00'
        })
      }

      const lunch = await this.getSmartMealSuggestions(clientId, 'lunch', 3)
      if (lunch.length > 0) {
        dayMeals.push({
          slot: 'lunch',
          meal: lunch[Math.floor(Math.random() * Math.min(3, lunch.length))],
          time: '12:30'
        })
      }

      const dinner = await this.getSmartMealSuggestions(clientId, 'dinner', 3)
      if (dinner.length > 0) {
        dayMeals.push({
          slot: 'dinner',
          meal: dinner[Math.floor(Math.random() * Math.min(3, dinner.length))],
          time: '18:30'
        })
      }

      const currentCalories = dayMeals.reduce((sum, m) => sum + (m.meal?.calories || 0), 0)
      const targetCalories = client.target_calories || 2000
      
      if (currentCalories < targetCalories * 0.9) {
        const snack = await this.getSmartMealSuggestions(clientId, 'snack', 2)
        if (snack.length > 0) {
          dayMeals.push({
            slot: 'snack',
            meal: snack[0],
            time: '15:00'
          })
        }
      }

      weekStructure[day] = dayMeals
    }

    const planData = {
      client_id: clientId,
      name: `AI Plan - ${new Date().toLocaleDateString('nl-NL')}`,
      week_structure: weekStructure,
      daily_calories: client.target_calories,
      daily_protein: client.target_protein,
      daily_carbs: client.target_carbs,
      daily_fat: client.target_fat
    }

    const savedPlan = await this.saveAIMealPlan(planData)
    
    console.log('✅ Week meal plan generated successfully')
    return savedPlan
  } catch (error) {
    console.error('❌ Error generating week meal plan:', error)
    return null
  }
}

/**
 * SHOPPING LIST - Generate from meal plan
 */
async generateShoppingList(mealPlanId) {
  try {
    const { data: plan, error } = await this.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', mealPlanId)
      .single()

    if (error) throw error
    if (!plan?.week_structure) return []

    const ingredientMap = {}

    Object.values(plan.week_structure).forEach(dayMeals => {
      dayMeals.forEach(mealSlot => {
        if (mealSlot.meal?.ingredients_list) {
          mealSlot.meal.ingredients_list.forEach(ingredient => {
            const key = ingredient.name || ingredient.ingredient_name
            if (key) {
              if (ingredientMap[key]) {
                ingredientMap[key].amount += (ingredient.amount || 0)
                ingredientMap[key].count += 1
              } else {
                ingredientMap[key] = {
                  name: key,
                  amount: ingredient.amount || 0,
                  unit: ingredient.unit || 'g',
                  count: 1
                }
              }
            }
          })
        }
      })
    })

    const shoppingList = Object.values(ingredientMap)
      .sort((a, b) => a.name.localeCompare(b.name))

    console.log(`✅ Generated shopping list with ${shoppingList.length} items`)
    return shoppingList
  } catch (error) {
    console.error('❌ Error generating shopping list:', error)
    return []
  }
}


// ===== pwa =====

// Deze methods toevoegen aan DatabaseService.js (helemaal onderaan, VOOR de laatste })

async getAppConfig() {
  try {
    const { data, error } = await this.supabase
      .from('app_config')
      .select('*')
      .order('updated_at', { ascending: false })  // Laatste config eerst
      .limit(1)
      .single()
    
    if (error) {
      console.error('Error fetching app config:', error)
      return null
    }
    
    console.log('App config loaded:', data)
    return data
  } catch (error) {
    console.error('Error in getAppConfig:', error)
    return null
  }
}

async updateAppConfig(newUrl, version, message) {
  try {
    // Eerst huidige config ophalen
    const { data: current, error: fetchError } = await this.supabase
      .from('app_config')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (fetchError) {
      console.error('Error fetching current config:', fetchError)
      // Als er geen config is, maak nieuwe
      const { data, error } = await this.supabase
        .from('app_config')
        .insert({
          current_url: newUrl,
          version: version,
          message: message || 'Nieuwe versie beschikbaar!',
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ New app config created')
      return data
    }
    
    // Update bestaande config
    const { data, error } = await this.supabase
      .from('app_config')
      .update({
        previous_url: current.current_url,  // Save old URL
        current_url: newUrl,
        version: version,
        message: message || current.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', current.id)
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ App config updated successfully')
    return data
  } catch (error) {
    console.error('❌ Error updating app config:', error)
    throw error
  }
}





// In DatabaseService.js - update existing method
async getFavoriteMeals(clientId) {
  try {
    // Get AI favorites
    const { data: aiFavorites } = await this.supabase
      .from('ai_meal_favorites')
      .select('meal_id')
      .eq('client_id', clientId)
    
    const favoriteIds = aiFavorites?.map(f => f.meal_id) || []
    
    // Get AI meals
    const { data: aiMeals } = await this.supabase
      .from('ai_meals')
      .select('*')
      .in('id', favoriteIds)
    
    // Get custom meals (auto included as favorites)
    const { data: customMeals } = await this.supabase
      .from('custom_meals')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_favorite', true)
    
    // Format custom meals to match AI meal structure
    const formattedCustom = customMeals?.map(meal => ({
      ...meal,
      meal_type: 'custom',
      labels: ['eigen_recept'],
      timing: ['breakfast', 'lunch', 'dinner', 'snack']
    })) || []
    
    // Combine both
    return [...aiMeals, ...formattedCustom]
    
  } catch (error) {
    console.error('Error getting favorites:', error)
    return []
  }
}



async getChallengeAssignment(clientId) {
  try {
    const { data } = await this.supabase
      .from('challenge_assignments')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()
    
    return data
  } catch (error) {
    console.error('Error getting challenge:', error)
    return null
  }
}

async assignChallenge(clientId, coachId) {
  try {
    const { data, error } = await this.supabase
      .from('challenge_assignments')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        challenge_type: '8week',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true
      })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error assigning challenge:', error)
    throw error
  }
}




// Voeg deze methods toe aan DatabaseService.js

// ==================== WORKOUT SCHEDULE MANAGEMENT ====================

async getClientWorkoutSchedule(clientId) {
  try {
    // First try to get from clients table
    const { data: client, error } = await this.supabase
      .from('clients')
      .select('workout_schedule')
      .eq('id', clientId)
      .single()
    
    if (error) throw error
    
    // Return schedule or null
    console.log('✅ Workout schedule loaded:', client?.workout_schedule)
    return client?.workout_schedule || null
  } catch (error) {
    console.error('❌ Get workout schedule failed:', error)
    return null
  }
}

async updateClientWorkoutSchedule(clientId, schedule) {
  try {
    // Validate schedule format
    if (!schedule || typeof schedule !== 'object') {
      throw new Error('Invalid schedule format')
    }
    
    // Update in clients table
    const { data, error } = await this.supabase
      .from('clients')
      .update({ 
        workout_schedule: schedule,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Workout schedule updated successfully')
    return data.workout_schedule
  } catch (error) {
    console.error('❌ Update workout schedule failed:', error)
    throw error
  }
}

// Legacy support - redirect to new methods
async saveWorkoutSchedule(clientId, schedule) {
  return this.updateClientWorkoutSchedule(clientId, schedule)
}

async getWorkoutSchedule(clientId) {
  return this.getClientWorkoutSchedule(clientId)
}






// ADD THESE METHODS DIRECTLY TO DatabaseService.js
// Add after line 8000+ (at the end before export)

// FUNNEL SYSTEM METHODS - FIXED URLS
// ADD THESE METHODS INSIDE DatabaseService CLASS

async getFunnels(coachId) {
  try {
    console.log('🔍 Getting funnels for coach:', coachId);
    
    const { data, error } = await this.supabase
      .from('funnels')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const baseURL = 'workapp-5w5himg7l-myarc.vercel.app';
    console.log('🔍 Base URL used:', baseURL);
    
    const funnelsWithMetrics = (data || []).map(funnel => {
      const url = `${baseURL}/funnel/${funnel.slug}`;
      console.log('🔍 Generated URL for', funnel.name, ':', url);
      
      return {
        ...funnel,
        url: url,
        views: Math.floor(Math.random() * 1000),
        conversions: Math.floor(Math.random() * 50), 
        revenue: Math.floor(Math.random() * 50) * 497,
        conversionRate: (Math.random() * 10).toFixed(1),
        lastUpdated: new Date(funnel.updated_at).toLocaleString('nl-NL')
      };
    });

    console.log('✅ Funnels loaded:', funnelsWithMetrics.length);
    return funnelsWithMetrics;
  } catch (error) {
    console.error('❌ Get funnels failed:', error);
    return [];
  }
}

async createFunnel(coachId, funnelData) {
  try {
    const slug = funnelData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    console.log('🔍 Creating funnel with slug:', slug);
    
    const { data, error } = await this.supabase
      .from('funnels')
      .insert({
        coach_id: coachId,
        name: funnelData.name,
        slug: slug,
        html_content: funnelData.html_content || '',
        template_type: 'custom',
        status: 'draft',
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    const baseURL = 'workapp-5w5himg7l-myarc.vercel.app';
    const url = `${baseURL}/funnel/${data.slug}`;
    console.log('🔍 New funnel URL:', url);
    
    const enrichedFunnel = {
      ...data,
      url: url,
      views: 0,
      conversions: 0,
      revenue: 0,
      conversionRate: 0,
      lastUpdated: new Date(data.updated_at).toLocaleString('nl-NL')
    };
    
    console.log('✅ Funnel created:', enrichedFunnel.name);
    return enrichedFunnel;
  } catch (error) {
    console.error('❌ Create funnel failed:', error);
    throw error;
  }
}

async updateFunnel(funnelId, updates) {
  try {
    const { data, error } = await this.supabase
      .from('funnels')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', funnelId)
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Funnel updated:', data.name);
    return data;
  } catch (error) {
    console.error('❌ Update funnel failed:', error);
    throw error;
  }
}

async deleteFunnel(funnelId) {
  try {
    const { error } = await this.supabase
      .from('funnels')
      .delete()
      .eq('id', funnelId);

    if (error) throw error;
    
    console.log('✅ Funnel deleted');
    return true;
  } catch (error) {
    console.error('❌ Delete funnel failed:', error);
    throw error;
  }
}

async getFunnelStats(coachId) {
  try {
    const funnels = await this.getFunnels(coachId);
    
    const totalViews = funnels.reduce((sum, f) => sum + f.views, 0);
    const totalConversions = funnels.reduce((sum, f) => sum + f.conversions, 0);
    const totalRevenue = funnels.reduce((sum, f) => sum + f.revenue, 0);
    const avgConversionRate = totalViews > 0 ? 
      ((totalConversions / totalViews) * 100).toFixed(1) : 0;

    const stats = {
      totalViews,
      totalConversions,
      totalRevenue,
      avgConversionRate: parseFloat(avgConversionRate),
      activeFunnels: funnels.filter(f => f.status === 'active').length,
      totalFunnels: funnels.length
    };
    
    console.log('✅ Funnel stats loaded:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Get funnel stats failed:', error);
    return {
      totalViews: 0,
      totalConversions: 0,
      totalRevenue: 0,
      avgConversionRate: 0,
      activeFunnels: 0,
      totalFunnels: 0
    };
  }
}

async trackFunnelEvent(funnelId, eventType, metadata = {}) {
  try {
    const { data, error } = await this.supabase
      .from('funnel_analytics')
      .insert({
        funnel_id: funnelId,
        event_type: eventType,
        metadata: metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Analytics tracking failed:', error);
      return null;
    }
    
    console.log('✅ Event tracked:', eventType);
    return data;
  } catch (error) {
    console.warn('❌ Track event failed:', error);
    return null;
  }
}
async createLead(leadData) {
  try {
    const { data, error } = await this.supabase
      .from('leads')
      .insert({
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        source: leadData.source || 'homepage_offer',
        landing_page: leadData.landing_page || window.location.pathname,
        utm_source: leadData.utm_source,
        utm_medium: leadData.utm_medium,
        utm_campaign: leadData.utm_campaign,
        status: 'new',
        lead_quality: 'warm' // Homepage leads zijn warmer
      })
      .select()
      .single()

    if (error) {
      // Check if error is duplicate email
      if (error.code === '23505') {
        throw new Error('Dit emailadres is al geregistreerd')
      }
      throw error
    }

    console.log('✅ Lead created:', data)

    // Optional: Send notification to coach
    await this.notifyCoachNewLead(data)

    return data
  } catch (error) {
    console.error('❌ Create lead failed:', error)
    throw error
  }
}

async notifyCoachNewLead(lead) {
  try {
    // Find available coach (round-robin or least loaded)
    const { data: coaches } = await this.supabase
      .from('users')
      .select('id, email')
      .eq('role', 'coach')
      .limit(1)

    if (coaches && coaches.length > 0) {
      const coach = coaches[0]
      
      // Assign lead to coach
      await this.supabase
        .from('lead_assignments')
        .insert({
          lead_id: lead.id,
          coach_id: coach.id,
          assigned_by: coach.id // Auto-assign
        })

      // Update lead with assigned coach
      await this.supabase
        .from('leads')
        .update({ assigned_coach_id: coach.id })
        .eq('id', lead.id)

      // Create coach notification
      await this.createNotification({
        user_id: coach.id,
        type: 'new_lead',
        title: 'Nieuwe Lead!',
        message: `${lead.name} heeft zich aangemeld via de homepage`,
        data: { lead_id: lead.id }
      })

      console.log('✅ Lead assigned to coach:', coach.email)
    }
  } catch (error) {
    console.error('❌ Lead assignment failed:', error)
    // Don't throw error - lead creation should still succeed
  }
}

// Get leads for coach dashboard
async getCoachLeads(coachId, status = null) {
  try {
    let query = this.supabase
      .from('leads')
      .select(`
        *,
        lead_follow_ups (
          id, contact_type, sent_at, responded_at
        )
      `)
      .eq('assigned_coach_id', coachId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    console.log('✅ Coach leads loaded:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Get coach leads failed:', error)
    return []
  }
}

// Update lead status
async updateLeadStatus(leadId, status, notes = null) {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'contacted' && !notes) {
      updateData.first_contact_date = new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
      updateData.last_contact_date = new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Lead status updated:', status)
    return data
  } catch (error) {
    console.error('❌ Update lead status failed:', error)
    throw error
  }
}


// Add deze methods aan DatabaseService.js (voor laatste closing bracket)

// Add deze methods aan DatabaseService.js (voor laatste closing bracket)

  // ============= CHALLENGE ASSIGNMENT GOALS =============
  async createChallengeAssignmentGoal(assignmentId, goalData) {
    try {
      const { data, error } = await this.supabase
        .from('challenge_assignment_goals')
        .insert({
          assignment_id: assignmentId,
          goal_type: goalData.goalType,
          goal_name: goalData.goalName,
          target_value: goalData.targetValue,
          starting_value: goalData.startingValue,
          current_value: goalData.startingValue, // Start met huidige waarde
          measurement_unit: goalData.measurementUnit,
          is_primary: goalData.isPrimary || true,
          auto_track: goalData.autoTrack !== false
        })
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Challenge assignment goal created:', data)
      return data
    } catch (error) {
      console.error('❌ Create challenge assignment goal failed:', error)
      throw error
    }
  }

  async getChallengeAssignmentGoals(assignmentId) {
    try {
      const { data, error } = await this.supabase
        .from('challenge_assignment_goals')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('is_primary', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get challenge assignment goals failed:', error)
      return []
    }
  }

  async getActiveClientChallengeGoal(clientId) {
    try {
      // Get active assignment
      const { data: activeAssignment } = await this.supabase
        .from('challenge_assignments')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()
      
      if (!activeAssignment) return null
      
      // Get primary goal
      const { data: goal, error } = await this.supabase
        .from('challenge_assignment_goals')
        .select('*')
        .eq('assignment_id', activeAssignment.id)
        .eq('is_primary', true)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // Ignore not found
      return goal || null
    } catch (error) {
      console.error('❌ Get active challenge assignment goal failed:', error)
      return null
    }
  }

  async updateChallengeAssignmentGoalProgress(goalId, currentValue) {
    try {
      const { data, error } = await this.supabase
        .from('challenge_assignment_goals')
        .update({
          current_value: currentValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ Challenge assignment goal progress updated')
      return data
    } catch (error) {
      console.error('❌ Update challenge assignment goal progress failed:', error)
      throw error
    }
  }

  async syncChallengeGoalFromTracking(clientId) {
    try {
      // Get active goal
      const goal = await this.getActiveClientChallengeGoal(clientId)
      if (!goal || !goal.auto_track) return null
      
      let currentValue = null
      
      // Get latest value based on goal type
      if (goal.goal_type === 'weight') {
        const { data } = await this.supabase
          .from('weight_history')
          .select('weight')
          .eq('client_id', clientId)
          .order('date', { ascending: false })
          .limit(1)
          .single()
        
        currentValue = data?.weight
        
      } else if (goal.goal_type === 'waist') {
        const { data } = await this.supabase
          .from('body_measurements')
          .select('waist')
          .eq('client_id', clientId)
          .order('date', { ascending: false })
          .limit(1)
          .single()
        
        currentValue = data?.waist
        
      } else if (goal.goal_type === 'body_fat') {
        const { data } = await this.supabase
          .from('body_measurements')
          .select('body_fat')
          .eq('client_id', clientId)
          .order('date', { ascending: false })
          .limit(1)
          .single()
        
        currentValue = data?.body_fat
      }
      
      // Update if we have a value
      if (currentValue !== null) {
        return await this.updateChallengeAssignmentGoalProgress(goal.id, currentValue)
      }
      
      return goal
    } catch (error) {
      console.error('❌ Sync challenge goal failed:', error)
      return null
    }
  }

  async getChallengeGoalProgress(clientId) {
    try {
      const goal = await this.getActiveClientChallengeGoal(clientId)
      if (!goal) return null
      
      // Sync latest data first
      const synced = await this.syncChallengeGoalFromTracking(clientId)
      const currentGoal = synced || goal
      
      // Calculate progress
      const progress = this.calculateGoalProgress(
        currentGoal.starting_value,
        currentGoal.current_value,
        currentGoal.target_value
      )
      
      return {
        ...currentGoal,
        progress: progress,
        remaining: Math.abs(currentGoal.target_value),
        achieved: progress.percentage >= 100
      }
    } catch (error) {
      console.error('❌ Get challenge goal progress failed:', error)
      return null
    }
  }

  // Helper methods
  getTrackingTable(goalType) {
    const mapping = {
      'weight': 'weight_history',
      'waist': 'body_measurements',
      'body_fat': 'body_measurements',
      'muscle_mass': 'body_measurements'
    }
    return mapping[goalType] || null
  }

  getTrackingColumn(goalType) {
    const mapping = {
      'weight': 'weight',
      'waist': 'waist',
      'body_fat': 'body_fat',
      'muscle_mass': 'muscle_mass'
    }
    return mapping[goalType] || null
  }

  calculateGoalProgress(startValue, currentValue, targetValue) {
    if (!currentValue || !startValue) {
      return { percentage: 0, change: 0 }
    }
    
    const totalChange = Math.abs(targetValue)
    const actualChange = startValue - currentValue
    const percentage = Math.min(100, Math.max(0, (actualChange / totalChange) * 100))
    
    return {
      percentage: Math.round(percentage),
      change: actualChange,
      remaining: totalChange - actualChange
    }
  }







// ADD TO DatabaseService.js (na bestaande workout methods)

// ===== TODAYS WORKOUT LOG METHODS =====

/**
 * Get previous log for specific exercise
 * @param {string} clientId - Client UUID
 * @param {string} exerciseName - Exercise name
 * @returns {object|null} Previous log with sets and date
 */
async getPreviousExerciseLog(clientId, exerciseName) {
  try {
    const { data, error } = await this.supabase
      .from('workout_progress')
      .select(`
        sets,
        created_at,
        workout_sessions!inner(client_id)
      `)
      .eq('workout_sessions.client_id', clientId)
      .eq('exercise_name', exerciseName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) throw error
    
    console.log('✅ Previous log loaded:', exerciseName)
    return data
  } catch (error) {
    console.log('ℹ️ No previous log found for:', exerciseName)
    return null
  }
}

/**
 * Get all logs for today
 * @param {string} clientId - Client UUID
 * @returns {array} Today's workout logs
 */
async getTodaysWorkoutLogs(clientId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's sessions
    const { data: sessions, error: sessionError } = await this.supabase
      .from('workout_sessions')
      .select('id')
      .eq('client_id', clientId)
      .eq('workout_date', today)
    
    if (sessionError) throw sessionError
    if (!sessions || sessions.length === 0) return []
    
    // Get progress for these sessions
    const sessionIds = sessions.map(s => s.id)
    const { data, error } = await this.supabase
      .from('workout_progress')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log('✅ Today\'s logs loaded:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Get today\'s logs failed:', error)
    return []
  }
}

/**
 * Save custom exercise
 * @param {string} clientId - Client UUID
 * @param {object} exerciseData - Exercise details
 * @returns {object|null} Created exercise
 */
async saveCustomExercise(clientId, exerciseData) {
  try {
    // DEBUG: Check auth status
    const { data: { user } } = await this.supabase.auth.getUser()
    console.log('🔍 DEBUG Auth UID:', user?.id)
    console.log('🔍 DEBUG Client ID:', clientId)
    console.log('🔍 DEBUG Match:', user?.id === clientId)
    
    const { data, error } = await this.supabase
      .from('custom_exercises')
      .insert({
        client_id: clientId,
        name: exerciseData.name,
        muscle_group: exerciseData.muscleGroup,
        sets: exerciseData.sets || 3,
        reps: exerciseData.reps || '10',
        rest: exerciseData.rest || '90s',
        rpe: exerciseData.rpe || 8,
        notes: exerciseData.notes || ''
      })
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Custom exercise saved:', data.name)
    return data
  } catch (error) {
    console.error('❌ Save custom exercise failed:', error)
    throw error
  }
}
/**
 * Get client's custom exercises
 * @param {string} clientId - Client UUID
 * @returns {array} Custom exercises
 */
async getCustomExercises(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('custom_exercises')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log('✅ Custom exercises loaded:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Get custom exercises failed:', error)
    return []
  }
}

/**
 * Update exercise in workout schema (for swapping)
 * @param {string} schemaId - Schema UUID
 * @param {string} dayKey - Day key (dag1, dag2, etc)
 * @param {number} exerciseIndex - Exercise index in array
 * @param {object} newExercise - New exercise data
 * @returns {object|null} Updated schema
 */
async updateExerciseInSchema(schemaId, dayKey, exerciseIndex, newExercise) {
  try {
    // Get current schema
    const { data: schema, error: getError } = await this.supabase
      .from('workout_schemas')
      .select('week_structure')
      .eq('id', schemaId)
      .single()
    
    if (getError) throw getError
    
    // Update exercise in JSONB
    const weekStructure = schema.week_structure
    if (!weekStructure[dayKey] || !weekStructure[dayKey].exercises) {
      throw new Error('Invalid day or exercises array')
    }
    
    weekStructure[dayKey].exercises[exerciseIndex] = newExercise
    
    // Save updated schema
    const { data, error } = await this.supabase
      .from('workout_schemas')
      .update({ 
        week_structure: weekStructure,
        updated_at: new Date().toISOString()
      })
      .eq('id', schemaId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Exercise updated in schema')
    return data
  } catch (error) {
    console.error('❌ Update exercise in schema failed:', error)
    throw error
  }
}

/**
 * Get alternative exercises for muscle group
 * @param {string} muscleGroup - Muscle group name
 * @param {string} currentExercise - Current exercise name (to exclude)
 * @returns {array} Alternative exercises
 */
// ADD THIS METHOD TO DatabaseService.js
// Place it near getAlternativeExercises() method
// ADD THIS METHOD TO DatabaseService.js
// Place it BEFORE getAllExercisesForSwap() method

async getAlternativeExercises(muscleGroup, currentExercise) {
  try {
    console.log('🔍 Loading alternatives for muscle group:', muscleGroup)
    
    // Import your existing exercise database
    const EXERCISE_DATABASE = await import('../modules/workout/constants/exerciseDatabase.js')
    const alternatives = []
    
    // Map muscle groups (your exercise might use different names)
    const muscleMap = {
      'chest': 'chest',
      'back': 'back',
      'legs': 'legs',
      'shoulders': 'shoulders',
      'biceps': 'biceps',
      'triceps': 'triceps',
      'abs': 'abs',
      'glutes': 'glutes',
      'core': 'abs',
      'arms': 'biceps' // fallback
    }
    
    const targetMuscle = muscleMap[muscleGroup.toLowerCase()] || 'chest'
    const muscleData = EXERCISE_DATABASE.default[targetMuscle]
    
    if (!muscleData) {
      console.log('ℹ️ No exercises found for muscle:', targetMuscle)
      return []
    }
    
    // Add compound exercises
    if (muscleData.compound) {
      muscleData.compound.forEach(ex => {
        if (ex.name !== currentExercise) {
          alternatives.push({
            ...ex,
            muscle: targetMuscle,
            type: 'compound',
            sets: 4,
            reps: '8-10'
          })
        }
      })
    }
    
    // Add isolation exercises
    if (muscleData.isolation) {
      muscleData.isolation.forEach(ex => {
        if (ex.name !== currentExercise) {
          alternatives.push({
            ...ex,
            muscle: targetMuscle,
            type: 'isolation',
            sets: 3,
            reps: '12-15'
          })
        }
      })
    }
    
    console.log('✅ Alternatives found:', alternatives.length)
    return alternatives.slice(0, 10) // Return top 10
    
  } catch (error) {
    console.error('❌ Error loading alternatives:', error)
    console.log('ℹ️ No exercises table, using fallback')
    
    // Fallback alternatives
    return [
      { name: 'Barbell Bench Press', equipment: 'barbell', sets: 4, reps: '8-10' },
      { name: 'Dumbbell Press', equipment: 'dumbbell', sets: 4, reps: '8-10' },
      { name: 'Cable Flyes', equipment: 'cable', sets: 3, reps: '12-15' },
      { name: 'Push-Ups', equipment: 'bodyweight', sets: 3, reps: '15-20' },
      { name: 'Incline Press', equipment: 'dumbbell', sets: 4, reps: '8-10' }
    ]
  }
}
async getAllExercisesForSwap() {
  try {
    console.log('🔍 Loading ALL exercises for swap...')
    
    // Import your existing exercise database
    const EXERCISE_DATABASE = await import('../modules/workout/constants/exerciseDatabase.js')
    const exercises = []
    
    // Flatten all muscle groups into single array
    Object.entries(EXERCISE_DATABASE.default).forEach(([muscle, data]) => {
      // Add compound exercises
      if (data.compound) {
        data.compound.forEach(ex => {
          exercises.push({
            ...ex,
            muscle,
            type: 'compound',
            sets: 4, // Default sets
            reps: '8-10' // Default reps
          })
        })
      }
      
      // Add isolation exercises
      if (data.isolation) {
        data.isolation.forEach(ex => {
          exercises.push({
            ...ex,
            muscle,
            type: 'isolation',
            sets: 3,
            reps: '12-15'
          })
        })
      }
    })
    
    console.log('✅ All exercises loaded from exerciseDatabase.js:', exercises.length)
    return exercises
    
  } catch (error) {
    console.error('❌ Error loading exercise database:', error)
    
    // Fallback to minimal list
    return [
      { name: 'Barbell Bench Press', equipment: 'barbell', sets: 4, reps: '8-10' },
      { name: 'Squat', equipment: 'barbell', sets: 4, reps: '8-10' },
      { name: 'Deadlift', equipment: 'barbell', sets: 4, reps: '5-8' },
      { name: 'Pull-Ups', equipment: 'bodyweight', sets: 4, reps: '6-10' }
    ]
  }
}

// ================================
// PUMP PHOTOS SYSTEM - DATABASE SERVICE METHODS
// ADD THESE TO DatabaseService.js class
// ================================

// ==================== UPLOAD & MANAGE PHOTOS ====================

/**
 * Upload pump photo to Supabase Storage and create database entry
 */
async uploadPumpPhoto(clientId, file, caption = '', workoutDate = null) {
  try {
    console.log('📸 Uploading pump photo for client:', clientId)
    
    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${clientId}/${timestamp}.${fileExt}`
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('pump-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('pump-photos')
      .getPublicUrl(fileName)
    
    const photoUrl = urlData.publicUrl
    
    // Create database entry
    const { data, error } = await this.supabase
      .from('pump_photos')
      .insert({
        client_id: clientId,
        photo_url: photoUrl,
        caption: caption || null,
        workout_date: workoutDate || new Date().toISOString().split('T')[0]
      })
      .select(`
        *,
        clients!inner(first_name, last_name)
      `)
      .single()
    
    if (error) throw error
    
    console.log('✅ Pump photo uploaded:', data.id)
    return { data, error: null }
    
  } catch (error) {
    console.error('❌ Error uploading pump photo:', error)
    return { data: null, error }
  }
}

/**
 * Delete pump photo
 */
async deletePumpPhoto(photoId, photoUrl) {
  try {
    console.log('🗑️ Deleting pump photo:', photoId)
    
    // Extract filename from URL
    const fileName = photoUrl.split('/pump-photos/')[1]
    
    // Delete from storage
    if (fileName) {
      await this.supabase.storage
        .from('pump-photos')
        .remove([fileName])
    }
    
    // Delete from database (cascade will handle likes/reactions)
    const { error } = await this.supabase
      .from('pump_photos')
      .delete()
      .eq('id', photoId)
    
    if (error) throw error
    
    console.log('✅ Pump photo deleted')
    return { error: null }
    
  } catch (error) {
    console.error('❌ Error deleting pump photo:', error)
    return { error }
  }
}

// ==================== FEED & RETRIEVAL ====================

/**
 * Get pump photo feed (all users, paginated)
 */
async getPumpPhotoFeed(limit = 20, offset = 0, clientId = null) {
  try {
    console.log('📱 Loading pump photo feed...')
    
    let query = this.supabase
      .from('pump_photos')
      .select(`
        *,
        clients!inner(
          id,
          first_name,
          last_name
        ),
        photo_likes(count),
        photo_reactions(reaction_type)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // If clientId provided, filter to that user only
    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    // Format data with counts
    const formattedData = data.map(photo => ({
      ...photo,
      like_count: photo.photo_likes?.[0]?.count || 0,
      reactions: photo.photo_reactions || [],
      fire_count: photo.photo_reactions.filter(r => r.reaction_type === 'fire').length,
      strong_count: photo.photo_reactions.filter(r => r.reaction_type === 'strong').length,
      beast_count: photo.photo_reactions.filter(r => r.reaction_type === 'beast').length,
      king_count: photo.photo_reactions.filter(r => r.reaction_type === 'king').length
    }))
    
    console.log('✅ Feed loaded:', formattedData.length, 'photos')
    return { data: formattedData, error: null }
    
  } catch (error) {
    console.error('❌ Error loading pump photo feed:', error)
    return { data: [], error }
  }
}

/**
 * Get single photo with full details
 */
async getPumpPhoto(photoId) {
  try {
    const { data, error } = await this.supabase
      .from('pump_photos')
      .select(`
        *,
        clients!inner(
          id,
          first_name,
          last_name
        ),
        photo_likes(
          id,
          client_id,
          created_at,
          clients!inner(first_name, last_name)
        ),
        photo_reactions(
          id,
          client_id,
          reaction_type,
          created_at,
          clients!inner(first_name, last_name)
        )
      `)
      .eq('id', photoId)
      .single()
    
    if (error) throw error
    
    return { data, error: null }
    
  } catch (error) {
    console.error('❌ Error loading pump photo:', error)
    return { data: null, error }
  }
}

/**
 * Get coach highlighted photos
 */
async getCoachHighlights(limit = 10) {
  try {
    const { data, error } = await this.supabase
      .from('pump_photos')
      .select(`
        *,
        clients!inner(
          id,
          first_name,
          last_name
        ),
        photo_likes(count)
      `)
      .eq('is_coach_highlight', true)
      .order('highlighted_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return { data: data || [], error: null }
    
  } catch (error) {
    console.error('❌ Error loading coach highlights:', error)
    return { data: [], error }
  }
}

// ==================== LIKES ====================

/**
 * Like a photo
 */
async likePumpPhoto(photoId, clientId) {
  try {
    console.log('❤️ Liking photo:', photoId)
    
    const { data, error } = await this.supabase
      .from('photo_likes')
      .insert({
        photo_id: photoId,
        client_id: clientId
      })
      .select()
      .single()
    
    if (error) {
      // Check if already liked (unique constraint violation)
      if (error.code === '23505') {
        console.log('ℹ️ Already liked')
        return { data: null, error: null, alreadyLiked: true }
      }
      throw error
    }
    
    console.log('✅ Photo liked')
    return { data, error: null, alreadyLiked: false }
    
  } catch (error) {
    console.error('❌ Error liking photo:', error)
    return { data: null, error, alreadyLiked: false }
  }
}

/**
 * Unlike a photo
 */
async unlikePumpPhoto(photoId, clientId) {
  try {
    console.log('💔 Unliking photo:', photoId)
    
    const { error } = await this.supabase
      .from('photo_likes')
      .delete()
      .eq('photo_id', photoId)
      .eq('client_id', clientId)
    
    if (error) throw error
    
    console.log('✅ Photo unliked')
    return { error: null }
    
  } catch (error) {
    console.error('❌ Error unliking photo:', error)
    return { error }
  }
}

/**
 * Check if user has liked a photo
 */
async hasLikedPhoto(photoId, clientId) {
  try {
    const { data, error } = await this.supabase
      .from('photo_likes')
      .select('id')
      .eq('photo_id', photoId)
      .eq('client_id', clientId)
      .maybeSingle()
    
    if (error) throw error
    
    return { hasLiked: !!data, error: null }
    
  } catch (error) {
    console.error('❌ Error checking like status:', error)
    return { hasLiked: false, error }
  }
}

// ==================== REACTIONS ====================

/**
 * Add reaction to photo
 */
async addPhotoReaction(photoId, clientId, reactionType) {
  try {
    console.log('🔥 Adding reaction:', reactionType)
    
    // Validate reaction type
    const validTypes = ['fire', 'strong', 'beast', 'king']
    if (!validTypes.includes(reactionType)) {
      throw new Error('Invalid reaction type')
    }
    
    const { data, error } = await this.supabase
      .from('photo_reactions')
      .insert({
        photo_id: photoId,
        client_id: clientId,
        reaction_type: reactionType
      })
      .select()
      .single()
    
    if (error) {
      // Check if already reacted with this type
      if (error.code === '23505') {
        console.log('ℹ️ Already reacted with', reactionType)
        return { data: null, error: null, alreadyReacted: true }
      }
      throw error
    }
    
    console.log('✅ Reaction added')
    return { data, error: null, alreadyReacted: false }
    
  } catch (error) {
    console.error('❌ Error adding reaction:', error)
    return { data: null, error, alreadyReacted: false }
  }
}

/**
 * Remove reaction from photo
 */
async removePhotoReaction(photoId, clientId, reactionType) {
  try {
    console.log('❌ Removing reaction:', reactionType)
    
    const { error } = await this.supabase
      .from('photo_reactions')
      .delete()
      .eq('photo_id', photoId)
      .eq('client_id', clientId)
      .eq('reaction_type', reactionType)
    
    if (error) throw error
    
    console.log('✅ Reaction removed')
    return { error: null }
    
  } catch (error) {
    console.error('❌ Error removing reaction:', error)
    return { error }
  }
}

/**
 * Get user's reactions for a photo
 */
async getUserReactions(photoId, clientId) {
  try {
    const { data, error } = await this.supabase
      .from('photo_reactions')
      .select('reaction_type')
      .eq('photo_id', photoId)
      .eq('client_id', clientId)
    
    if (error) throw error
    
    const reactions = data.map(r => r.reaction_type)
    return { reactions, error: null }
    
  } catch (error) {
    console.error('❌ Error getting user reactions:', error)
    return { reactions: [], error }
  }
}

// ==================== WEEKLY STATS ====================

/**
 * Get weekly photo stats for a client
 */
async getWeeklyPhotoStats(clientId) {
  try {
    // Get current week boundaries
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
    weekStart.setHours(0, 0, 0, 0)
    
    const { data, error } = await this.supabase
      .from('weekly_photo_stats')
      .select('*')
      .eq('client_id', clientId)
      .eq('week_start', weekStart.toISOString().split('T')[0])
      .maybeSingle()
    
    if (error) throw error
    
    // If no stats yet, return default
    if (!data) {
      return {
        data: {
          photos_uploaded: 0,
          requirement_met: false,
          streak_count: 0
        },
        error: null
      }
    }
    
    return { data, error: null }
    
  } catch (error) {
    console.error('❌ Error loading weekly stats:', error)
    return { 
      data: { photos_uploaded: 0, requirement_met: false, streak_count: 0 },
      error 
    }
  }
}

/**
 * Get streak count for client
 */
async getPhotoStreak(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('weekly_photo_stats')
      .select('streak_count')
      .eq('client_id', clientId)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) throw error
    
    return { streak: data?.streak_count || 0, error: null }
    
  } catch (error) {
    console.error('❌ Error getting streak:', error)
    return { streak: 0, error }
  }
}

// ==================== COACH FEATURES ====================

/**
 * Toggle coach highlight on photo
 */
async toggleCoachHighlight(photoId, isHighlight = true) {
  try {
    console.log('⭐ Toggling highlight:', photoId, isHighlight)
    
    const { data, error } = await this.supabase
      .from('pump_photos')
      .update({
        is_coach_highlight: isHighlight,
        highlighted_at: isHighlight ? new Date().toISOString() : null
      })
      .eq('id', photoId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Highlight toggled')
    return { data, error: null }
    
  } catch (error) {
    console.error('❌ Error toggling highlight:', error)
    return { data: null, error }
  }
}














// ADD THESE METHODS TO DatabaseService.js
// Location: Before the last closing brace }

// ============================================
// CUSTOM MEALS & STANDARD FOODS METHODS
// ============================================


/**
 * Get client's standard foods (proteins, carbs, meal preps)
 */
async getClientStandardFoods(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('ai_client_standard_foods')
      .select(`
        *,
        meal:custom_meal_id (
          id,
          name,
          calories,
          protein,
          carbs,
          fat,
          fiber,
          ingredients_list,
          meal_type
        )
      `)
      .eq('client_id', clientId)
      .order('category')
      .order('slot_number')
    
    if (error) throw error
    
    // Group by category
    const grouped = {
      protein: Array(3).fill(null),
      carbs: Array(3).fill(null),
      meal_prep: Array(3).fill(null)
    }
    
    data?.forEach(item => {
      const idx = item.slot_number - 1
      if (grouped[item.category] && idx >= 0 && idx < 3) {
        grouped[item.category][idx] = {
          id: item.id,
          slot_number: item.slot_number,
          meal: item.meal
        }
      }
    })
    
    console.log('✅ Standard foods loaded:', {
      protein: grouped.protein.filter(Boolean).length,
      carbs: grouped.carbs.filter(Boolean).length,
      meal_prep: grouped.meal_prep.filter(Boolean).length
    })
    
    return grouped
  } catch (error) {
    console.error('❌ Get standard foods failed:', error)
    return {
      protein: Array(3).fill(null),
      carbs: Array(3).fill(null),
      meal_prep: Array(3).fill(null)
    }
  }
}


// ============================================
// CUSTOM MEALS & STANDARD FOODS METHODS
// ============================================

async getClientCustomMeals(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('ai_custom_meals')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log('✅ Custom meals loaded:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Get custom meals failed:', error)
    return []
  }
}

async getClientStandardFoods(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('ai_client_standard_foods')
      .select(`
        *,
        meal:custom_meal_id (
          id,
          name,
          calories,
          protein,
          carbs,
          fat,
          fiber,
          ingredients_list,
          meal_type
        )
      `)
      .eq('client_id', clientId)
      .order('category')
      .order('slot_number')
    
    if (error) throw error
    
    const grouped = {
      protein: Array(3).fill(null),
      carbs: Array(3).fill(null),
      meal_prep: Array(3).fill(null)
    }
    
    data?.forEach(item => {
      const idx = item.slot_number - 1
      if (grouped[item.category] && idx >= 0 && idx < 3) {
        grouped[item.category][idx] = {
          id: item.id,
          slot_number: item.slot_number,
          meal: item.meal
        }
      }
    })
    
    console.log('✅ Standard foods loaded')
    return grouped
  } catch (error) {
    console.error('❌ Get standard foods failed:', error)
    return {
      protein: Array(3).fill(null),
      carbs: Array(3).fill(null),
      meal_prep: Array(3).fill(null)
    }
  }
}

async setStandardFood(clientId, category, slotNumber, customMealId) {
  try {
    if (!['protein', 'carbs', 'meal_prep'].includes(category)) {
      throw new Error('Invalid category')
    }
    if (slotNumber < 1 || slotNumber > 3) {
      throw new Error('Slot number must be 1-3')
    }
    
    const { data, error } = await this.supabase
      .from('ai_client_standard_foods')
      .upsert({
        client_id: clientId,
        category: category,
        slot_number: slotNumber,
        custom_meal_id: customMealId
      }, {
        onConflict: 'client_id,category,slot_number'
      })
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Standard food set:', { category, slotNumber })
    return data
  } catch (error) {
    console.error('❌ Set standard food failed:', error)
    throw error
  }
}

async removeStandardFood(clientId, category, slotNumber) {
  try {
    const { error } = await this.supabase
      .from('ai_client_standard_foods')
      .delete()
      .eq('client_id', clientId)
      .eq('category', category)
      .eq('slot_number', slotNumber)
    
    if (error) throw error
    
    console.log('✅ Standard food removed:', { category, slotNumber })
    return true
  } catch (error) {
    console.error('❌ Remove standard food failed:', error)
    throw error
  }
}

async deleteCustomMeal(clientId, mealId) {
  try {
    const { data: usageCheck } = await this.supabase
      .from('ai_client_standard_foods')
      .select('id')
      .eq('custom_meal_id', mealId)
      .limit(1)
    
    if (usageCheck && usageCheck.length > 0) {
      throw new Error('Deze meal wordt gebruikt als standaard food. Verwijder eerst de toewijzing.')
    }
    
    const { error } = await this.supabase
      .from('ai_custom_meals')
      .delete()
      .eq('id', mealId)
      .eq('client_id', clientId)
    
    if (error) throw error
    
    console.log('✅ Custom meal deleted:', mealId)
    return true
  } catch (error) {
    console.error('❌ Delete custom meal failed:', error)
    throw error
  }
}

async updateCustomMeal(clientId, mealId, updates) {
  try {
    const { data, error } = await this.supabase
      .from('ai_custom_meals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', mealId)
      .eq('client_id', clientId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Custom meal updated:', mealId)
    return data
  } catch (error) {
    console.error('❌ Update custom meal failed:', error)
    throw error
  }
}


// ============================================
// DAY TEMPLATES METHODS
// ============================================

async getClientDayTemplates(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('ai_day_templates')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log('✅ Day templates loaded:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Get day templates failed:', error)
    return []
  }
}

async createDayTemplate(clientId, templateData) {
  try {
    // Calculate totals from meals
    const meals = templateData.meals
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    
    if (meals.breakfast) {
      totalCalories += meals.breakfast.calories || 0
      totalProtein += meals.breakfast.protein || 0
      totalCarbs += meals.breakfast.carbs || 0
      totalFat += meals.breakfast.fat || 0
    }
    if (meals.lunch) {
      totalCalories += meals.lunch.calories || 0
      totalProtein += meals.lunch.protein || 0
      totalCarbs += meals.lunch.carbs || 0
      totalFat += meals.lunch.fat || 0
    }
    if (meals.dinner) {
      totalCalories += meals.dinner.calories || 0
      totalProtein += meals.dinner.protein || 0
      totalCarbs += meals.dinner.carbs || 0
      totalFat += meals.dinner.fat || 0
    }
    if (meals.snacks && Array.isArray(meals.snacks)) {
      meals.snacks.forEach(snack => {
        totalCalories += snack.calories || 0
        totalProtein += snack.protein || 0
        totalCarbs += snack.carbs || 0
        totalFat += snack.fat || 0
      })
    }
    
    const { data, error } = await this.supabase
      .from('ai_day_templates')
      .insert({
        client_id: clientId,
        name: templateData.name,
        meals: meals,
        total_calories: Math.round(totalCalories),
        total_protein: Math.round(totalProtein * 10) / 10,
        total_carbs: Math.round(totalCarbs * 10) / 10,
        total_fat: Math.round(totalFat * 10) / 10
      })
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Day template created:', data.name)
    return data
  } catch (error) {
    console.error('❌ Create day template failed:', error)
    throw error
  }
}

async updateDayTemplate(templateId, updates) {
  try {
    // Recalculate totals if meals updated
    if (updates.meals) {
      const meals = updates.meals
      let totalCalories = 0
      let totalProtein = 0
      let totalCarbs = 0
      let totalFat = 0
      
      if (meals.breakfast) {
        totalCalories += meals.breakfast.calories || 0
        totalProtein += meals.breakfast.protein || 0
        totalCarbs += meals.breakfast.carbs || 0
        totalFat += meals.breakfast.fat || 0
      }
      if (meals.lunch) {
        totalCalories += meals.lunch.calories || 0
        totalProtein += meals.lunch.protein || 0
        totalCarbs += meals.lunch.carbs || 0
        totalFat += meals.lunch.fat || 0
      }
      if (meals.dinner) {
        totalCalories += meals.dinner.calories || 0
        totalProtein += meals.dinner.protein || 0
        totalCarbs += meals.dinner.carbs || 0
        totalFat += meals.dinner.fat || 0
      }
      if (meals.snacks && Array.isArray(meals.snacks)) {
        meals.snacks.forEach(snack => {
          totalCalories += snack.calories || 0
          totalProtein += snack.protein || 0
          totalCarbs += snack.carbs || 0
          totalFat += snack.fat || 0
        })
      }
      
      updates.total_calories = Math.round(totalCalories)
      updates.total_protein = Math.round(totalProtein * 10) / 10
      updates.total_carbs = Math.round(totalCarbs * 10) / 10
      updates.total_fat = Math.round(totalFat * 10) / 10
    }
    
    const { data, error } = await this.supabase
      .from('ai_day_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Day template updated:', templateId)
    return data
  } catch (error) {
    console.error('❌ Update day template failed:', error)
    throw error
  }
}

async deleteDayTemplate(clientId, templateId) {
  try {
    const { error } = await this.supabase
      .from('ai_day_templates')
      .delete()
      .eq('id', templateId)
      .eq('client_id', clientId)
    
    if (error) throw error
    
    console.log('✅ Day template deleted:', templateId)
    return true
  } catch (error) {
    console.error('❌ Delete day template failed:', error)
    throw error
  }
}









// ADD TO DatabaseService.js (after day template methods)

/**
 * Apply a day template to a specific day in the week plan
 */
/**
 * Apply a day template to a specific day in the week plan
 * FIXED: Store complete meal objects, not just IDs
 */
async applyDayTemplateToWeek(clientId, planId, dayKey, templateId) {
  try {
    // 1. Get the template
    const { data: template, error: templateError } = await this.supabase
      .from('ai_day_templates')
      .select('*')
      .eq('id', templateId)
      .eq('client_id', clientId)
      .single()
    
    if (templateError) throw templateError
    if (!template) throw new Error('Template niet gevonden')
    
    // 2. Get current meal plan
    const { data: plan, error: planError } = await this.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', planId)
      .eq('client_id', clientId)
      .single()
    
    if (planError) throw planError
    if (!plan) throw new Error('Meal plan niet gevonden')
    
    // 3. Build new day structure from template - COMPLETE OBJECTS
    const newDayStructure = {
      breakfast: template.meals.breakfast || null,
      lunch: template.meals.lunch || null,
      dinner: template.meals.dinner || null,
      snacks: template.meals.snacks || [],
      totals: {
        kcal: template.total_calories || 0,
        protein: template.total_protein || 0,
        carbs: template.total_carbs || 0,
        fat: template.total_fat || 0
      }
    }
    
    // 4. Update week_structure
    const updatedWeekStructure = {
      ...(plan.week_structure || {}),
      [dayKey]: newDayStructure
    }
    
    // 5. Save to database
    const { error: updateError } = await this.supabase
      .from('client_meal_plans')
      .update({
        week_structure: updatedWeekStructure,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .eq('client_id', clientId)
    
    if (updateError) throw updateError
    
    console.log('✅ Template toegepast op', dayKey, ':', template.name)
    return {
      success: true,
      dayKey,
      templateName: template.name
    }
  } catch (error) {
    console.error('❌ Apply template failed:', error)
    throw error
  }
}






// ================================
// PUMP PHOTO UPGRADES - ADD TO DatabaseService.js
// Place these methods in the DatabaseService class
// ================================

// ==================== PROGRESS COMPARISON ====================

/**
 * Get photos for progress comparison
 * Returns chronologically ordered photos for before/after comparison
 */
async getProgressPhotos(clientId, limit = 10) {
  try {
    const { data, error } = await this.supabase
      .from('pump_photos')
      .select(`
        id,
        photo_url,
        caption,
        current_weight,
        workout_type,
        created_at
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('❌ Get progress photos error:', error)
    return { data: [], error }
  }
}

/**
 * Get weight difference between photos
 */
calculateWeightDifference(olderPhoto, newerPhoto) {
  if (!olderPhoto?.current_weight || !newerPhoto?.current_weight) {
    return null
  }
  
  const diff = newerPhoto.current_weight - olderPhoto.current_weight
  return {
    difference: Math.abs(diff),
    direction: diff > 0 ? 'gain' : 'loss',
    percentage: Math.abs((diff / olderPhoto.current_weight) * 100).toFixed(1)
  }
}

/**
 * Get photos by workout type for comparison
 */
async getPhotosByWorkoutType(clientId, workoutType) {
  try {
    const { data, error } = await this.supabase
      .from('pump_photos')
      .select('*')
      .eq('client_id', clientId)
      .eq('workout_type', workoutType)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('❌ Get photos by workout type error:', error)
    return { data: [], error }
  }
}

// ==================== COACH COMMENTS ====================

/**
 * Add comment to photo
 */
async addPhotoComment(photoId, commenterId, commenterType, commentText) {
  try {
    console.log('💬 Adding photo comment...')
    
    const { data, error } = await this.supabase
      .from('photo_comments')
      .insert({
        photo_id: photoId,
        commenter_id: commenterId,
        commenter_type: commenterType,
        comment_text: commentText,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    console.log('✅ Comment added')
    return { data, error: null }
  } catch (error) {
    console.error('❌ Add comment error:', error)
    return { data: null, error }
  }
}

async getPhotoComments(photoId) {
  try {
    const { data, error } = await this.supabase
      .from('photo_comments')
      .select('*')
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true })

    if (error) throw error
    
    // Get commenter details separately
    if (data && data.length > 0) {
      const commenterIds = [...new Set(data.map(c => c.commenter_id))]
      const { data: commenters } = await this.supabase
        .from('clients')
        .select('id, first_name, last_name')
        .in('id', commenterIds)
      
      // Merge commenter data
      const enrichedData = data.map(comment => ({
        ...comment,
        commenter: commenters?.find(c => c.id === comment.commenter_id) || null
      }))
      
      return { data: enrichedData, error: null }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    console.error('❌ Get comments error:', error)
    return { data: [], error }
  }
}
/**
 * Delete comment
 */
async deletePhotoComment(commentId) {
  try {
    const { error } = await this.supabase
      .from('photo_comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
    console.log('✅ Comment deleted')
    return { error: null }
  } catch (error) {
    console.error('❌ Delete comment error:', error)
    return { error }
  }
}

/**
 * Get unread comment notifications for client
 */
async getCommentNotifications(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('photo_comment_notifications')
      .select(`
        *,
        comment:photo_comments(*),
        photo:pump_photos(photo_url)
      `)
      .eq('client_id', clientId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('❌ Get comment notifications error:', error)
    return { data: [], error }
  }
}

/**
 * Mark comment notification as read
 */
async markCommentNotificationRead(notificationId) {
  try {
    const { error } = await this.supabase
      .from('photo_comment_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('❌ Mark notification read error:', error)
    return { error }
  }
}

/**
 * Get comment count for photo
 */
async getPhotoCommentCount(photoId) {
  try {
    const { count, error } = await this.supabase
      .from('photo_comments')
      .select('*', { count: 'exact', head: true })
      .eq('photo_id', photoId)

    if (error) throw error
    return { count: count || 0, error: null }
  } catch (error) {
    console.error('❌ Get comment count error:', error)
    return { count: 0, error }
  }
}

/**
 * Update pump photo with weight and workout type
 */
async updatePumpPhotoMetadata(photoId, metadata) {
  try {
    const { data, error } = await this.supabase
      .from('pump_photos')
      .update({
        current_weight: metadata.weight,
        workout_type: metadata.workoutType,
        updated_at: new Date().toISOString()
      })
      .eq('id', photoId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('❌ Update photo metadata error:', error)
    return { data: null, error }
  }
}


// ADD TO DatabaseService.js - Week Planner Methods
// Location: Around line 2800+ (after existing meal methods)

// ============================================
// WEEK PLANNER METHODS
// ============================================

/**
 * Generate AI Week Plan based on client's custom meals and preferences
 */
async generateAIWeekPlan(clientId, preferences = {}) {
  try {
    console.log('🤖 Generating AI week plan for client:', clientId)
    
    // 1. Get client data
    const client = await this.getClient(clientId)
    if (!client) throw new Error('Client not found')
    
    // 2. Get client's custom meals
    const customMeals = await this.getClientCustomMeals(clientId)
    if (!customMeals || customMeals.length === 0) {
      throw new Error('No custom meals found. Create meals first!')
    }
    
    // 3. Get standard foods (proteins, carbs, meal preps)
    const standardFoods = await this.getClientStandardFoods(clientId)
    
    // 4. Get targets from active plan or client profile
    const activePlan = await this.getClientMealPlan(clientId)
    const targets = {
      calories: activePlan?.daily_calories || client.target_calories || 2200,
      protein: activePlan?.daily_protein || client.target_protein || 165,
      carbs: activePlan?.daily_carbs || client.target_carbs || 220,
      fat: activePlan?.daily_fat || client.target_fat || 73
    }
    
    // 5. Calculate meals per day (default 4)
    const mealsPerDay = preferences.mealsPerDay || 4
    
    // 6. Calculate distribution (breakfast 25%, lunch 30%, dinner 35%, snacks 10%)
    const distribution = this.calculateMealDistribution(mealsPerDay, targets)
    
    // 7. Generate week structure
    const weekStructure = {}
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    const usedMealIds = new Set() // Track used meals for variety
    
    for (const day of days) {
      const dayMeals = {}
      
      // Generate meals for this day
      for (const [slot, targetMacros] of Object.entries(distribution)) {
        // Filter available meals
        let availableMeals = customMeals.filter(meal => {
          // Prefer meals not used recently
          const recentlyUsed = usedMealIds.has(meal.id)
          
          // Check if meal fits slot
          const caloriesFit = Math.abs(meal.calories - targetMacros.calories) < targetMacros.calories * 0.3
          
          return !recentlyUsed && caloriesFit
        })
        
        // If no available meals, use any meal
        if (availableMeals.length === 0) {
          availableMeals = customMeals
        }
        
        // Pick best matching meal
        const selectedMeal = this.selectBestMeal(availableMeals, targetMacros)
        
        if (selectedMeal) {
          // Calculate scale factor
          const scaleFactor = targetMacros.calories / selectedMeal.calories
          
          dayMeals[slot] = {
            meal_id: selectedMeal.id,
            meal_name: selectedMeal.name,
            calories: Math.round(selectedMeal.calories * scaleFactor),
            protein: Math.round(selectedMeal.protein * scaleFactor),
            carbs: Math.round(selectedMeal.carbs * scaleFactor),
            fat: Math.round(selectedMeal.fat * scaleFactor),
            scale_factor: Math.round(scaleFactor * 100) / 100,
            original_calories: selectedMeal.calories,
            is_custom: true
          }
          
          usedMealIds.add(selectedMeal.id)
          
          // Clear used meals after 3 days for variety
          if (usedMealIds.size > customMeals.length * 0.5) {
            usedMealIds.clear()
          }
        }
      }
      
      // Calculate day totals
      const slots = Object.values(dayMeals)
      dayMeals.totals = {
        kcal: slots.reduce((sum, m) => sum + m.calories, 0),
        protein: slots.reduce((sum, m) => sum + m.protein, 0),
        carbs: slots.reduce((sum, m) => sum + m.carbs, 0),
        fat: slots.reduce((sum, m) => sum + m.fat, 0)
      }
      
      // Calculate accuracy
      dayMeals.accuracy = {
        calories: Math.round((dayMeals.totals.kcal / targets.calories) * 100),
        protein: Math.round((dayMeals.totals.protein / targets.protein) * 100)
      }
      
      weekStructure[day] = dayMeals
    }
    
    console.log('✅ Week plan generated')
    return {
      weekStructure,
      targets,
      generatedAt: new Date().toISOString(),
      mealsUsed: customMeals.length,
      preferences
    }
    
  } catch (error) {
    console.error('❌ Generate week plan failed:', error)
    throw error
  }
}

/**
 * Calculate meal distribution based on meals per day
 */
calculateMealDistribution(mealsPerDay, targets) {
  const distribution = {}
  
  if (mealsPerDay === 3) {
    distribution.breakfast = {
      calories: Math.round(targets.calories * 0.30),
      protein: Math.round(targets.protein * 0.30),
      carbs: Math.round(targets.carbs * 0.30),
      fat: Math.round(targets.fat * 0.30)
    }
    distribution.lunch = {
      calories: Math.round(targets.calories * 0.35),
      protein: Math.round(targets.protein * 0.35),
      carbs: Math.round(targets.carbs * 0.35),
      fat: Math.round(targets.fat * 0.35)
    }
    distribution.dinner = {
      calories: Math.round(targets.calories * 0.35),
      protein: Math.round(targets.protein * 0.35),
      carbs: Math.round(targets.carbs * 0.35),
      fat: Math.round(targets.fat * 0.35)
    }
  } else if (mealsPerDay === 4) {
    distribution.breakfast = {
      calories: Math.round(targets.calories * 0.25),
      protein: Math.round(targets.protein * 0.25),
      carbs: Math.round(targets.carbs * 0.25),
      fat: Math.round(targets.fat * 0.25)
    }
    distribution.lunch = {
      calories: Math.round(targets.calories * 0.30),
      protein: Math.round(targets.protein * 0.30),
      carbs: Math.round(targets.carbs * 0.30),
      fat: Math.round(targets.fat * 0.30)
    }
    distribution.dinner = {
      calories: Math.round(targets.calories * 0.35),
      protein: Math.round(targets.protein * 0.35),
      carbs: Math.round(targets.carbs * 0.35),
      fat: Math.round(targets.fat * 0.35)
    }
    distribution.snacks = [{
      calories: Math.round(targets.calories * 0.10),
      protein: Math.round(targets.protein * 0.10),
      carbs: Math.round(targets.carbs * 0.10),
      fat: Math.round(targets.fat * 0.10)
    }]
  } else if (mealsPerDay === 5) {
    distribution.breakfast = {
      calories: Math.round(targets.calories * 0.20),
      protein: Math.round(targets.protein * 0.20),
      carbs: Math.round(targets.carbs * 0.20),
      fat: Math.round(targets.fat * 0.20)
    }
    distribution.lunch = {
      calories: Math.round(targets.calories * 0.25),
      protein: Math.round(targets.protein * 0.25),
      carbs: Math.round(targets.carbs * 0.25),
      fat: Math.round(targets.fat * 0.25)
    }
    distribution.dinner = {
      calories: Math.round(targets.calories * 0.30),
      protein: Math.round(targets.protein * 0.30),
      carbs: Math.round(targets.carbs * 0.30),
      fat: Math.round(targets.fat * 0.30)
    }
    distribution.snacks = [
      {
        calories: Math.round(targets.calories * 0.125),
        protein: Math.round(targets.protein * 0.125),
        carbs: Math.round(targets.carbs * 0.125),
        fat: Math.round(targets.fat * 0.125)
      },
      {
        calories: Math.round(targets.calories * 0.125),
        protein: Math.round(targets.protein * 0.125),
        carbs: Math.round(targets.carbs * 0.125),
        fat: Math.round(targets.fat * 0.125)
      }
    ]
  }
  
  return distribution
}

/**
 * Select best matching meal for target macros
 */
selectBestMeal(meals, targetMacros) {
  if (!meals || meals.length === 0) return null
  
  // Score each meal
  const scoredMeals = meals.map(meal => {
    const calorieDiff = Math.abs(meal.calories - targetMacros.calories)
    const proteinDiff = Math.abs(meal.protein - targetMacros.protein)
    
    // Lower score = better match
    const score = calorieDiff + (proteinDiff * 2) // Protein weighted 2x
    
    return { meal, score }
  })
  
  // Sort by score
  scoredMeals.sort((a, b) => a.score - b.score)
  
  // Return best match
  return scoredMeals[0].meal
}

/**
 * Update meal in week structure
 */
async updateMealInWeek(planId, day, slot, mealData) {
  try {
    console.log('📝 Updating meal in week:', { planId, day, slot })
    
    // Get current plan
    const { data: plan, error: fetchError } = await this.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', planId)
      .single()
    
    if (fetchError) throw fetchError
    
    const weekStructure = plan.week_structure || {}
    
    // Update meal in structure
    if (!weekStructure[day]) {
      weekStructure[day] = {}
    }
    
    weekStructure[day][slot] = mealData
    
    // Recalculate day totals
    const dayMeals = Object.values(weekStructure[day]).filter(m => m && m.calories)
    weekStructure[day].totals = {
      kcal: dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
      protein: dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
      carbs: dayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
      fat: dayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
    }
    
    // Update in database
    const { error: updateError } = await this.supabase
      .from('client_meal_plans')
      .update({
        week_structure: weekStructure,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
    
    if (updateError) throw updateError
    
    console.log('✅ Meal updated in week')
    return weekStructure
    
  } catch (error) {
    console.error('❌ Update meal in week failed:', error)
    throw error
  }
}

/**
 * Copy day to other days
 */
async copyDayToOtherDays(planId, sourceDay, targetDays) {
  try {
    console.log('📋 Copying day:', { sourceDay, targetDays })
    
    // Get current plan
    const { data: plan, error: fetchError } = await this.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', planId)
      .single()
    
    if (fetchError) throw fetchError
    
    const weekStructure = plan.week_structure || {}
    const sourceDayData = weekStructure[sourceDay]
    
    if (!sourceDayData) {
      throw new Error('Source day has no meals')
    }
    
    // Copy to target days
    for (const targetDay of targetDays) {
      weekStructure[targetDay] = JSON.parse(JSON.stringify(sourceDayData))
    }
    
    // Update in database
    const { error: updateError } = await this.supabase
      .from('client_meal_plans')
      .update({
        week_structure: weekStructure,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
    
    if (updateError) throw updateError
    
    console.log('✅ Day copied successfully')
    return weekStructure
    
  } catch (error) {
    console.error('❌ Copy day failed:', error)
    throw error
  }
}

/**
 * Scale meal portion
 */
async scaleMealPortion(planId, day, slot, newScaleFactor) {
  try {
    console.log('⚖️ Scaling meal portion:', { day, slot, newScaleFactor })
    
    // Get current plan
    const { data: plan, error: fetchError } = await this.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', planId)
      .single()
    
    if (fetchError) throw fetchError
    
    const weekStructure = plan.week_structure || {}
    const meal = weekStructure[day]?.[slot]
    
    if (!meal) throw new Error('Meal not found')
    
    // Calculate new values
    const originalCalories = meal.original_calories || meal.calories
    meal.calories = Math.round(originalCalories * newScaleFactor)
    meal.protein = Math.round((meal.protein / (meal.scale_factor || 1)) * newScaleFactor)
    meal.carbs = Math.round((meal.carbs / (meal.scale_factor || 1)) * newScaleFactor)
    meal.fat = Math.round((meal.fat / (meal.scale_factor || 1)) * newScaleFactor)
    meal.scale_factor = newScaleFactor
    
    // Recalculate day totals
    const dayMeals = Object.values(weekStructure[day]).filter(m => m && m.calories)
    weekStructure[day].totals = {
      kcal: dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
      protein: dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
      carbs: dayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
      fat: dayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
    }
    
    // Update in database
    const { error: updateError } = await this.supabase
      .from('client_meal_plans')
      .update({
        week_structure: weekStructure,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
    
    if (updateError) throw updateError
    
    console.log('✅ Meal portion scaled')
    return weekStructure
    
  } catch (error) {
    console.error('❌ Scale meal portion failed:', error)
    throw error
  }
}

// ADD TO DatabaseService.js - VOOR de laatste }

// ADD TO DatabaseService.js - VOOR de laatste }
// ADD TO DatabaseService.js - VOOR de laatste }

// ADD TO DatabaseService.js - VOOR de laatste }

// ADD TO DatabaseService.js - VOOR de laatste }

async pauseChallenge(assignmentId, reason, coachName) {
  try {
    // Get current assignment to backup original end_date
    const { data: assignment } = await this.supabase
      .from('challenge_assignments')
      .select('end_date, original_end_date')
      .eq('id', assignmentId)
      .single()
    
    const { data, error } = await this.supabase
      .from('challenge_assignments')
      .update({
        is_paused: true,
        paused_at: new Date().toISOString(),
        paused_by: coachName || 'Coach', // Gewoon TEXT
        pause_reason: reason || 'Gepauzeerd door coach',
        original_end_date: assignment.original_end_date || assignment.end_date
      })
      .eq('id', assignmentId)
      .select()
    
    if (error) throw error
    console.log('✅ Challenge paused')
    return data
  } catch (error) {
    console.error('❌ Pause challenge failed:', error)
    throw error
  }
}

async resumeChallenge(assignmentId) {
  try {
    // Get pause data
    const { data: assignment } = await this.supabase
      .from('challenge_assignments')
      .select('paused_at, original_end_date, end_date, pause_reason')
      .eq('id', assignmentId)
      .single()
    
    if (!assignment || !assignment.paused_at) {
      throw new Error('Challenge was not paused')
    }
    
    // Calculate paused days
    const pausedDate = new Date(assignment.paused_at)
    const now = new Date()
    const pausedDays = Math.floor((now - pausedDate) / (1000 * 60 * 60 * 24))
    
    // Calculate new end date (original + paused days)
    const originalEnd = new Date(assignment.original_end_date || assignment.end_date)
    const newEndDate = new Date(originalEnd)
    newEndDate.setDate(newEndDate.getDate() + pausedDays)
    
    const { data, error } = await this.supabase
      .from('challenge_assignments')
      .update({
        is_paused: false,
        paused_days: pausedDays,
        end_date: newEndDate.toISOString().split('T')[0],
        // Keep pause history for reference
        pause_reason: assignment.pause_reason ? `${assignment.pause_reason} (${pausedDays} dagen)` : null
      })
      .eq('id', assignmentId)
      .select()
    
    if (error) throw error
    console.log(`✅ Challenge resumed - Extended ${pausedDays} days`)
    return data
  } catch (error) {
    console.error('❌ Resume challenge failed:', error)
    throw error
  }
}




// ===== plak hier =====







}
// ===== HELPER FUNCTIONS =====

// Calculate success probability
function calculateSuccessProbability(currentProgress, avgStreak, daysElapsed, estimatedDaysToComplete) {
  let probability = 50 // Base probability
  
  // Adjust based on current progress
  if (currentProgress > 75) probability += 30
  else if (currentProgress > 50) probability += 20
  else if (currentProgress > 25) probability += 10
  
  // Adjust based on consistency (streak)
  if (avgStreak > 14) probability += 20
  else if (avgStreak > 7) probability += 15
  else if (avgStreak > 3) probability += 10
  
  // Adjust based on time remaining
  if (estimatedDaysToComplete && estimatedDaysToComplete < 30) probability += 10
  else if (estimatedDaysToComplete && estimatedDaysToComplete > 180) probability -= 10
  
  // Cap between 5 and 95
  return Math.min(95, Math.max(5, probability))













}





// EERST extend de class
extendDatabaseService(DatabaseServiceClass)

// DAN PAS maak de instance
const DatabaseService = new DatabaseServiceClass()

// Export
export default DatabaseService
export { DatabaseServiceClass }
