import { useState } from 'react'
import DatabaseService from '../services/DatabaseService'
const db = DatabaseService

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('trainer@test.com')
  const [password, setPassword] = useState('test123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      console.log('Attempting login with:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      console.log('Login response:', { data, error })
      
      if (error) {
        setError(error.message)
        console.error('Login error:', error)
      } else {
        console.log('Login successful!')
        onLogin()
      }
    } catch (err) {
      console.error('Catch error:', err)
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">🏋️ WORKAPP</h1>
        
        {error && (
          <div className="bg-red-900 text-red-300 p-3 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-green-600 hover:bg-green-700 rounded text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>Test: trainer@test.com / test123</p>
        </div>
      </div>
    </div>
  )
}
