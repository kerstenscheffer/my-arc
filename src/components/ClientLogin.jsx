import { useState } from 'react'
import DatabaseService from '../services/DatabaseService'
const db = DatabaseService

export default function ClientLogin({ onClientLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      console.log('🔥 CLIENT LOGIN:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })
      
      if (error) throw error
if (data.user) {
        console.log('✅ Client login success')
        window.history.pushState({}, '', '/client-dashboard')
        onClientLogin()
      }      
    } catch (error) {
      console.error('❌ Client login failed:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-2xl font-bold text-green-500 mb-2 text-center">
          👤 CLIENT LOGIN
        </h1>
        <p className="text-gray-400 text-center mb-6 text-sm">
          Access your personal fitness dashboard
        </p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white"
            required
          />
          
          <input
            type="password" 
            placeholder="Your password"
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
            {loading ? 'Logging in...' : 'ACCESS MY DASHBOARD'}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => window.location.href = '/'}
            className="text-gray-400 hover:text-gray-300 underline text-sm"
          >
            ← Back to Coach Login
          </button>
        </div>
      </div>
    </div>
  )
}
