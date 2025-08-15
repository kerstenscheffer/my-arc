import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xlaycpwpnhjmulfsnynh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYXljcHdwbmhqbXVsZnNueW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTEzNDUsImV4cCI6MjA3MDU4NzM0NX0.19WRJrOO4Yll95w9j8qa8ZgoXFiwPK39farBuNSyd6c'

console.log('Testing Supabase connection...')

const supabase = createClient(supabaseUrl, supabaseKey)

// Simple test
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1)
    if (error) {
      console.error('❌ Database error:', error.message)
    } else {
      console.log('✅ Connection successful!')
      console.log('Found users:', data?.length || 0)
    }
  } catch (err) {
    console.error('❌ Network error:', err.message)
  }
}

testConnection()
