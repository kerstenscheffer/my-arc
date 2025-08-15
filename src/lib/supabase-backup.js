import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials missing!')
}

export const supabase = createClient(supabaseUrl, supabaseKey)



// Simplified signIn - just auth, no profile lookup yet
export async function signIn(email, password) {
  console.log('SignIn attempt with:', email)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  console.log('Auth response:', { data, error })
  if (error) throw error
  return data
}

// Enhanced getCurrentUser - checks both users and clients tables
export async function getCurrentUser() {
  console.log('Getting current user...')
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('Current user response:', { user, error })
  
  if (error) throw error
  if (!user) return null
  
  // Check if email exists in users table (coach)
  const { data: trainerData, error: trainerError } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single()

  if (trainerData && !trainerError) {
    console.log('✅ User is a coach/trainer')
    return { 
      ...user, 
      profile: { 
        email: user.email, 
        naam: trainerData.naam || user.email.split('@')[0], 
        role: 'coach',
        id: trainerData.id
      } 
    }
  }

  // Check if email exists in clients table (client)
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('email', user.email)
    .single()

  if (clientData && !clientError) {
    console.log('✅ User is a client')
    return { 
      ...user, 
      profile: { 
        email: user.email, 
        naam: `${clientData.first_name} ${clientData.last_name}`, 
        role: 'client',
        id: clientData.id,
        trainer_id: clientData.trainer_id
      } 
    }
  }

  // Fallback - unknown user
  console.log('⚠️ User not found in users or clients table')
  return { 
    ...user, 
    profile: { 
      email: user.email, 
      naam: user.email.split('@')[0], 
      role: 'unknown' 
    } 
  }
}

// Sign out function
export async function signOut() {
  console.log('Signing out...')
  const { error } = await supabase.auth.signOut()
  console.log('Sign out response:', { error })
  if (error) throw error
  return true
}
// Voeg deze functies toe aan je src/lib/supabase.js

// ===== CLIENT MANAGEMENT FUNCTIONS =====

// ===== CLIENT MANAGEMENT FUNCTIONS =====

// Create new client (SIMPLIFIED - alleen client record)

// Create new client (SIMPLIFIED - auto-increment ID)
// Create new client with AUTH ACCOUNT + DATABASE RECORD

// Create new client with AUTH ACCOUNT + DATABASE RECORD  
export async function createClientAccount(clientData, trainerId) {
  try {
    console.log('🔥 Creating client:', clientData)

    // SIMPELE AANPAK: Maak alleen database record, auth doen we handmatig
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
      console.error('❌ Client record creation error:', clientError)
      throw clientError
    }

    console.log('✅ Client record created. Manually add auth account in Supabase dashboard.')
    return { client: clientRecord[0] }

  } catch (error) {
    console.error('❌ Create client error:', error)
    throw error
  }
}







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
      console.error('❌ Client record creation error:', clientError)
      throw clientError
    }

    console.log('✅ Client record created:', clientRecord)
    
    return { 
      client: clientRecord[0], 
      authUser: authData.user,
      temporaryPassword: temporaryPassword 
    }

  } catch (error) {
    console.error('❌ Create client error:', error)
    throw error
  }
}

// Get all clients for a trainer
export async function getTrainerClients(trainerId) {
  try {
    console.log('📋 Getting clients for trainer:', trainerId)
    
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Get clients error:', error)
      throw error
    }

    console.log('✅ Clients loaded:', clients?.length || 0)
    return clients || []

  } catch (error) {
    console.error('❌ Get clients error:', error)
    throw error
  }
}
