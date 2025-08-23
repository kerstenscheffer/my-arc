
import ClientLogin from './components/ClientLogin'
import AIGenerator from './components/AIGenerator'
import Goals from './components/Goals'
import { useState, useEffect } from 'react'
import Login from './components/Login'
import ClientDashboard from './client/ClientDashboard'
import Dashboard from './components/Dashboard'
import { getCurrentUser } from './lib/supabase'
import { LanguageProvider } from './contexts/LanguageContext'
import ResetPassword from './auth/ResetPassword'

function App() {
  // 🔥 DIRECT CHECK - VOOR ALLES ANDERS!
  if (window.location.pathname === '/reset-password') {
    return (
      <LanguageProvider>
        <ResetPassword />
      </LanguageProvider>
    )
  }

  // Check localStorage on init
  const storedMode = localStorage.getItem('isClientMode') === 'true'

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isClientMode, setIsClientMode] = useState(storedMode)

  useEffect(() => {
    checkUser()
  }, [])

  // Save to localStorage when mode changes
  useEffect(() => {
    localStorage.setItem('isClientMode', isClientMode)
  }, [isClientMode])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.log('Not authenticated')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('isClientMode')
    setIsClientMode(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }


  // Check URL for client login
  if (window.location.pathname === '/client-login') {
    if (!user) {
      return (
        <LanguageProvider>
          <ClientLogin onClientLogin={() => {
            setIsClientMode(true)
            localStorage.setItem('isClientMode', 'true')
            checkUser()
          }} />
        </LanguageProvider>
      )
    }
  }

  // Show regular login if no user
  if (!user) {
    return (
      <LanguageProvider>
        <Login onLogin={() => {
          setIsClientMode(false)
          localStorage.setItem('isClientMode', 'false')
          checkUser()
        }} />
      </LanguageProvider>
    )
  }

  // Dashboard routing based on state
  if (isClientMode) {
    return (
      <LanguageProvider>
        <ClientDashboard onLogout={handleLogout} />
      </LanguageProvider>
    )
  } else {
    return (
      <LanguageProvider>
        <Dashboard onLogout={handleLogout} />
      </LanguageProvider>
    )
  }
}

export default App

