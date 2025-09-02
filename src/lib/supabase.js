// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials missing!')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
    storageKey: 'my-arc-auth',
    flowType: 'pkce'  // Voeg deze toe
  }
})

// ===== AUTH FUNCTIONS =====

export async function signIn(email, password) {
  console.log('SignIn attempt with:', email)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  console.log('Auth response:', { data, error })
  if (error) throw error
  return data
}

export async function getCurrentUser() {
  console.log('Getting current user...')
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) throw error
  if (!user) return null
  
  return { 
    ...user, 
    profile: { 
      email: user.email, 
      naam: user.email.split('@')[0]
    } 
  }
}

export async function signOut() {
  console.log('Signing out...')
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return true
}

// ===== CLIENT MANAGEMENT FUNCTIONS =====

export async function createClientAccount(clientData, trainerId) {
  try {
    console.log('🔥 Creating client with auth:', clientData)

    // STAP 1: Maak Supabase auth user
    const tempPassword = `Welcome123!`
    const { data: authResponse, error: signUpError } = await supabase.auth.signUp({
      email: clientData.email,
      password: tempPassword
    })

    if (signUpError) {
      console.error('❌ Auth creation failed:', signUpError)
      throw signUpError
    }

    console.log('✅ Auth user created')

    // STAP 2: Maak client database record
    const { data: clientRecord, error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          trainer_id: trainerId,
          first_name: clientData.firstName,
          last_name: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone || null,
          goal: clientData.goal,
          experience: clientData.experience,
          status: 'active'
        }
      ])
      .select()

    if (clientError) {
      console.error('❌ Client record failed:', clientError)
      throw clientError
    }

    console.log('✅ Client created with login:', clientData.email, 'password:', tempPassword)
    
    return {
      client: clientRecord[0],
      loginCredentials: { email: clientData.email, password: tempPassword }
    }

  } catch (error) {
    console.error('❌ Create client error:', error)
    throw error
  }
}

export async function getTrainerClients(trainerId) {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return clients || []
  } catch (error) {
    console.error('❌ Get clients error:', error)
    throw error
  }
}

export async function removeClient(clientId) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ status: 'inactive' })
      .eq('id', clientId)
      .select()

    if (error) throw error
    console.log('✅ Client removed:', data)
    return data
  } catch (error) {
    console.error('❌ Remove client error:', error)
    throw error
  }
}

// ===== CLIENT UPDATE FUNCTION =====

export async function updateClient(clientId, updates) {
  try {
    console.log('🔄 Updating client:', clientId)
    console.log('📝 Updates:', updates)
    
    // Clean the updates - remove undefined values
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

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }

    console.log('✅ Client updated successfully:', data)
    return data
    
  } catch (error) {
    console.error('❌ Error updating client:', error)
    throw error
  }
}


// ===== SCHEMA FUNCTIONS =====

export async function getAllSchemas() {
  try {
    const { data: schemas, error } = await supabase
      .from('workout_schemas')
      .select('id, name, description, primary_goal, days_per_week, split_name')
      .order('name')

    if (error) throw error
    console.log('✅ Loaded schemas:', schemas?.length || 0)
    return schemas || []
  } catch (error) {
    console.error('❌ Get schemas error:', error)
    throw error
  }
}

export async function assignSchemaToClient(clientId, schemaId) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ 
        assigned_schema_id: schemaId,
        schema_assigned_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()

    if (error) throw error
    console.log('✅ Schema assigned:', data)
    return data
  } catch (error) {
    console.error('❌ Error assigning schema:', error)
    throw error
  }
}

export async function getClientSchema(clientId) {
  try {
    console.log('📋 Getting schema for client ID:', clientId)
    
    // Validate input
    if (!clientId) {
      console.warn('⚠️ No client ID provided to getClientSchema')
      return null
    }
    
    // First get the client to find schema ID - without .single() to avoid error if not found
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, assigned_schema_id, first_name, last_name')
      .eq('id', clientId)
    
    if (clientError) {
      console.error('❌ Database error getting client:', {
        error: clientError,
        clientId: clientId
      })
      return null
    }
    
    // Check if client exists
    if (!clients || clients.length === 0) {
      console.warn('⚠️ Client not found with ID:', clientId)
      return null
    }
    
    const client = clients[0]
    console.log('✅ Found client:', {
      name: `${client.first_name} ${client.last_name}`,
      assigned_schema_id: client.assigned_schema_id
    })
    
    // Check if client has an assigned schema
    if (!client.assigned_schema_id) {
      console.log('⚠️ Client has no assigned schema')
      return null
    }
    
    console.log('🔍 Loading schema with ID:', client.assigned_schema_id)
    
    // Get the schema - without .single() first to check if exists
    const { data: schemas, error: schemaError } = await supabase
      .from('workout_schemas')
      .select('*')
      .eq('id', client.assigned_schema_id)
    
    if (schemaError) {
      console.error('❌ Database error getting schema:', {
        error: schemaError,
        schemaId: client.assigned_schema_id
      })
      return null
    }
    
    if (!schemas || schemas.length === 0) {
      console.warn('⚠️ Schema not found with ID:', client.assigned_schema_id)
      return null
    }
    
    const schema = schemas[0]
    console.log('✅ Schema loaded successfully:', schema?.name)
    return schema
    
  } catch (error) {
    console.error('❌ Unexpected error in getClientSchema:', error)
    return null
  }
}

export async function getClientWithSchema(clientId) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        workout_schemas!assigned_schema_id (*)
      `)
      .eq('id', clientId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Error fetching client schema:', error)
    throw error
  }
}

// ===== CLIENT LOGIN FUNCTIONS =====

export async function getClientByEmail(email) {
  try {
    console.log('🔍 Searching for client with email:', email)
    
    // Get ALL matching clients first (without .single())
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
    
    console.log('📊 Query result:', { count: clients?.length, clients, error })
    
    if (error) {
      console.error('❌ Database error:', error)
      return null
    }
    
    // Handle no results
    if (!clients || clients.length === 0) {
      console.log('⚠️ No client found with email:', email)
      return null
    }
    
    // Handle multiple results (shouldn't happen, but defensive)
    if (clients.length > 1) {
      console.warn('⚠️ Multiple clients found with same email:', email)
      // Return the most recent one
      return clients.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )[0]
    }
    
    // Single result - perfect!
    console.log('✅ Client found:', clients[0])
    return clients[0]
    
  } catch (error) {
    console.error('❌ Unexpected error in getClientByEmail:', error)
    return null
  }
}

// ===== PROGRESS TRACKING FUNCTIONS =====

export async function saveWorkoutProgress(progressData) {
  try {
    const { data, error } = await supabase
      .from('workout_progress')
      .upsert(progressData, {
        onConflict: 'client_id,date,exercise_name'
      })
      .select()

    if (error) throw error
    console.log('✅ Progress saved:', data)
    return data
  } catch (error) {
    console.error('❌ Error saving progress:', error)
    throw error
  }
}

export async function getWorkoutProgress(clientId, exerciseName = null, dateRange = null) {
  try {
    let query = supabase
      .from('workout_progress')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })

    if (exerciseName) {
      query = query.eq('exercise_name', exerciseName)
    }

    if (dateRange) {
      if (dateRange.from) query = query.gte('date', dateRange.from)
      if (dateRange.to) query = query.lte('date', dateRange.to)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error getting progress:', error)
    throw error
  }
}

export async function getClientExercises(clientId) {
  try {
    const { data, error } = await supabase
      .from('workout_progress')
      .select('exercise_name')
      .eq('client_id', clientId)
      .order('exercise_name')

    if (error) throw error

    // Get unique exercise names
    const uniqueExercises = [...new Set(data.map(row => row.exercise_name))]
    return uniqueExercises
  } catch (error) {
    console.error('❌ Error getting exercises:', error)
    return []
  }
}

// ===== ACCOUNTABILITY FUNCTIONS =====

export async function saveNotification(notification) {
  try {
    const { data, error } = await supabase
      .from('accountability_notifications')
      .insert([notification])
      .select()
      .single()

    if (error) throw error
    console.log('✅ Notification saved:', data)
    return data
  } catch (error) {
    console.error('❌ Error saving notification:', error)
    throw error
  }
}

export async function getClientNotifications(clientId, unreadOnly = false) {
  try {
    let query = supabase
      .from('accountability_notifications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('read_status', false)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error getting notifications:', error)
    throw error
  }
}

export async function markNotificationRead(notificationId) {
  try {
    const { data, error } = await supabase
      .from('accountability_notifications')
      .update({ read_status: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Error marking notification read:', error)
    throw error
  }
}

export async function saveWorkoutCompletion(clientId, date, completed = true, notes = null) {
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
    console.error('❌ Error saving workout completion:', error)
    throw error
  }
}

export async function getWorkoutCompletions(clientId, dateRange = null) {
  try {
    let query = supabase
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
    console.error('❌ Error getting workout completions:', error)
    throw error
  }
}

export async function saveMealCompletion(mealData) {
  try {
    const { data, error } = await supabase
      .from('meal_completion')
      .upsert(mealData, {
        onConflict: 'client_id,meal_date,meal_type'
      })
      .select()

    if (error) throw error
    console.log('✅ Meal completion saved')
    return data
  } catch (error) {
    console.error('❌ Error saving meal completion:', error)
    throw error
  }
}

export async function getMealCompletions(clientId, dateRange = null) {
  try {
    let query = supabase
      .from('meal_completion')
      .select('*')
      .eq('client_id', clientId)
      .order('meal_date', { ascending: false })

    if (dateRange) {
      if (dateRange.from) query = query.gte('meal_date', dateRange.from)
      if (dateRange.to) query = query.lte('meal_date', dateRange.to)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error getting meal completions:', error)
    throw error
  }
}

// ===== BONUS SYSTEM FUNCTIONS =====

export async function createBonus(bonusData) {
  try {
    const { data, error } = await supabase
      .from('bonuses')
      .insert([bonusData])
      .select()
      .single()

    if (error) throw error
    console.log('✅ Bonus created:', data)
    return data
  } catch (error) {
    console.error('❌ Error creating bonus:', error)
    throw error
  }
}

export async function getAllBonuses(coachId) {
  try {
    const { data, error } = await supabase
      .from('bonuses')
      .select('*')
      .eq('created_by', coachId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error getting bonuses:', error)
    throw error
  }
}

export async function assignBonusToClient(clientId, bonusId) {
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
    console.log('✅ Bonus assigned to client')
    return data
  } catch (error) {
    console.error('❌ Error assigning bonus:', error)
    throw error
  }
}

export async function getClientBonuses(clientId) {
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
    console.error('❌ Error getting client bonuses:', error)
    throw error
  }
}

export async function removeBonusFromClient(clientId, bonusId) {
  try {
    const { error } = await supabase
      .from('client_bonuses')
      .delete()
      .eq('client_id', clientId)
      .eq('bonus_id', bonusId)

    if (error) throw error
    console.log('✅ Bonus removed from client')
    return true
  } catch (error) {
    console.error('❌ Error removing bonus:', error)
    throw error
  }
}

// ===== PASSWORD RESET FUNCTIONS =====

export async function activateClientAfterReset(email, newPassword) {
  try {
    console.log('🔑 Activating client after password reset:', email)
    
    // Update the password using Supabase Auth Admin API
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) {
      console.error('❌ Error updating password:', error)
      throw error
    }
    
    // Also update the client record to mark as activated
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single()
    
    if (clientError) {
      console.error('❌ Error updating client status:', clientError)
      // Don't throw here, password was updated successfully
    }
    
    console.log('✅ Client activated successfully')
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Error in activateClientAfterReset:', error)
    throw error
  }
}

export async function requestPasswordReset(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) throw error
    console.log('✅ Password reset email sent')
    return data
  } catch (error) {
    console.error('❌ Error sending reset email:', error)
    throw error
  }
}

// ===== UTILITY FUNCTIONS =====

export async function updateClientPreferences(clientId, preferences) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ 
        preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()

    if (error) throw error
    console.log('✅ Client preferences updated')
    return data
  } catch (error) {
    console.error('❌ Error updating preferences:', error)
    throw error
  }
}

export async function getClientById(clientId) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Error getting client:', error)
    throw error
  }
}

// Test database connection
export async function testConnection() {
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
