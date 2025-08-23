import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials missing!')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Sign in function
export async function signIn(email, password) {
  console.log('SignIn attempt with:', email)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  console.log('Auth response:', { data, error })
  if (error) throw error
  return data
}

// Get current user with role detection


// Enhanced getCurrentUser - alleen users table voor roles
// Simple getCurrentUser - geen role lookup
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



// Sign out function
export async function signOut() {
  console.log('Signing out...')
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return true
}

// Create client with AUTH ACCOUNT + DATABASE RECORD

// Create client with AUTH ACCOUNT + DATABASE RECORD
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

// Get all clients for a trainer
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

// ===== SCHEMA ASSIGNMENT FUNCTIONS =====

// Get all available schemas
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

// Get client's assigned schema
export async function getClientSchema(clientId) {
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        assigned_schema_id,
        workout_schemas (
          id, name, description, week_structure, split_name
        )
      `)
      .eq('id', clientId)
      .single()

    if (error) throw error
    return client?.workout_schemas || null
  } catch (error) {
    console.error('❌ Get client schema error:', error)
    return null
  }
}

// Schema Assignment Functions
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

// Get client with assigned schema
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
