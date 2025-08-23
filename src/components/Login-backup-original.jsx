import { useState } from 'react'
import DatabaseService from '../services/DatabaseService'
const db = DatabaseService

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

const handleLogin = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError('')
  
  console.log('🔥 DEBUG: Login attempt started')
  console.log('🔥 DEBUG: Email:', email)
  console.log('🔥 DEBUG: Password length:', password.length)
  
  try {
    // STEP 1: Test database connection
    console.log('🔥 DEBUG: Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('email')
      .limit(1)
    
    if (testError) {
      console.log('❌ DEBUG: Database connection failed:', testError)
      throw new Error('Database connection failed: ' + testError.message)
    }
    console.log('✅ DEBUG: Database connection OK')
    
    // STEP 2: Check if email exists in auth
    console.log('🔥 DEBUG: Checking auth.users for email...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (!authError) {
      const emailExists = authUsers.users.find(u => u.email === email.trim())
      console.log('🔥 DEBUG: Email exists in auth.users:', !!emailExists)
      if (emailExists) {
        console.log('🔥 DEBUG: Auth user status:', emailExists.email_confirmed_at ? 'confirmed' : 'unconfirmed')
      }
    }
    
    // STEP 3: Attempt login
    console.log('🔥 DEBUG: Attempting Supabase auth login...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    })
    
    console.log('🔥 DEBUG: Auth response data:', data)
    console.log('🔥 DEBUG: Auth response error:', error)
    
    if (error) {
      console.log('❌ DEBUG: Auth login failed:', error.message)
      throw error
    }
    
    if (data.user) {
      console.log('✅ DEBUG: Auth login success, user ID:', data.user.id)
      console.log('🔥 DEBUG: Calling onLogin()...')
      onLogin()
    } else {
      throw new Error('No user returned from auth')
    }
    
  } catch (error) {
    console.error('❌ DEBUG: Final error:', error)
    setError(`DEBUG: ${error.message}`)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-2xl font-bold text-green-500 mb-6 text-center">
          🏋️ MY ARC LOGIN
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
            required
          />
          
          <input
            type="password" 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
            required
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded font-bold"
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}

{/* CLIENT LOGIN BUTTON */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Are you a client?</p>
          <button
            type="button"
            onClick={() => window.location.href = '/client-login'}
            className="text-green-500 hover:text-green-400 underline text-sm"
          >
            → Client Login
          </button>
        </div>

      </div>
    </div>
  )
}
