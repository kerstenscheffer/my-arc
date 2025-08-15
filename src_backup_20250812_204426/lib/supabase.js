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

// Simplified getCurrentUser - just basic auth info
export async function getCurrentUser() {
  console.log('Getting current user...')
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('Current user response:', { user, error })
  
  if (error) throw error
  if (!user) return null
  
  // Return just the basic auth user for now - no database lookup
  return { ...user, profile: { email: user.email, naam: user.email.split('@')[0], role: 'trainer' } }
}
