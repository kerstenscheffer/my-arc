import { useState, useEffect } from 'react'
import Login from './components/Login'
import ResetPassword from './components/ResetPassword'
import AIGenerator from './components/AIGenerator'
import Goals from './components/Goals'
import ClientDashboard from './client/ClientDashboard'
import Dashboard from './components/Dashboard'
import CoachHub from './coach/CoachHub'
import CoachHubV2 from './coach/CoachHubV2'
import DatabaseService from './services/DatabaseService'
import { LanguageProvider } from './contexts/LanguageContext'
import PWAInstaller from './components/PWAInstaller'  // 🆕 PWA TOEVOEGEN

const db = DatabaseService

function App() {
  // 🔥 DIRECT CHECK - VOOR ALLES ANDERS!
  if (window.location.pathname === '/reset-password') {
    return (
      <LanguageProvider>
        <ResetPassword />
        <PWAInstaller />  {/* 🆕 PWA ook op reset page */}
      </LanguageProvider>
    )
  }

  // Check localStorage on init
  const storedMode = localStorage.getItem('isClientMode') === 'true'
  
  // 🚀 V2 TOGGLE - VERANDER DEZE OM TE TESTEN
  const useV2CoachHub = false  // true = V2, false = oude versie

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
    console.log('🔍 Checking authentication...');
    const currentUser = await db.getCurrentUser()
    
    if (currentUser) {
      console.log('✅ User found:', currentUser.email);
      setUser(currentUser)
    } else {
      console.log('❌ No user - showing login');
      setUser(null) // BELANGRIJK: Set null, niet undefined!
    }
  } catch (error) {
    console.error('Auth error:', error)
    setUser(null) // BELANGRIJK: Ook bij error null zetten!
  } finally {
    setLoading(false) // ALTIJD loading stoppen
  }
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

  // Check URL for client login - GEBRUIK GEWONE LOGIN
  if (window.location.pathname === '/client-login') {
    if (!user) {
      return (
        <LanguageProvider>
          <Login onLogin={() => {
            setIsClientMode(true)
            localStorage.setItem('isClientMode', 'true')
            checkUser()
          }} />
          <PWAInstaller />  {/* 🆕 PWA op login */}
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
        <PWAInstaller />  {/* 🆕 PWA op login */}
      </LanguageProvider>
    )
  }

  // Dashboard routing based on state
  if (isClientMode) {
    return (
      <LanguageProvider>
        <ClientDashboard onLogout={handleLogout} />
        <PWAInstaller />  {/* 🆕 PWA voor clients */}
      </LanguageProvider>
    )
  } else {
    // 🎯 HIER IS DE V2 TOGGLE
    return (
      <LanguageProvider>
        {useV2CoachHub ? (
          <>
            <CoachHubV2 onLogout={handleLogout} />
            <PWAInstaller />  {/* 🆕 PWA voor coaches V2 */}
          </>
        ) : (
          <>
            <CoachHub onLogout={handleLogout} />
            <PWAInstaller />  {/* 🆕 PWA voor coaches */}
          </>
        )}
      </LanguageProvider>
    )
  }
}

export default App
