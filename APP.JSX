// src/App.jsx
import ClientOnboarding from './client/pages/ClientOnboarding'
import FunnelPage from './funnel/FunnelPage'
import YourArcFunnel from './modules/funnel-pages/your-arc/YourArcFunnel'
import CheckoutPage from './pages/CheckoutPage'
import { useState, useEffect } from 'react'
import Login from './components/Login'
import ResetPassword from './components/ResetPassword'
import ClientDashboard from './client/ClientDashboard'
import CoachHub from './coach/CoachHub'
import CoachHubV2 from './coach/CoachHubV2'
import FunnelViewer from './pages/FunnelViewer'
import DatabaseService from './services/DatabaseService'
import { LanguageProvider } from './contexts/LanguageContext'
import PWAInstaller from './components/PWAInstaller'
import UpdateModal from './components/UpdateModal'

const db = DatabaseService

function App() {
  // Check for funnel routes FIRST
  const currentPath = window.location.pathname
  const isFunnelRoute = currentPath.startsWith('/funnel/')

  // Check voor checkout page (public, geen auth nodig)
  if (currentPath === '/checkout') {
    return <CheckoutPage />

  }

  // Check voor success page (public)
  if (currentPath === '/success') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          background: 'rgba(17, 17, 17, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '3rem',
          border: '2px solid #10b981'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>
            🎉
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#10b981',
            marginBottom: '1rem'
          }}>
            Betaling Succesvol!
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            Welkom bij MY ARC! Je ontvangt binnen enkele minuten een email met je login gegevens.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Naar Homepage
          </button>
        </div>
      </div>
    )
  }
  
  // Check voor exact /funnel path
  if (currentPath === '/funnel') {
    return <FunnelPage />
  }

  // Check voor YOUR ARC funnel
  if (currentPath === '/your-arc') {
    return <YourArcFunnel />
  }

  // If it's a funnel route, show FunnelViewer
  if (isFunnelRoute) {
    const slug = currentPath.replace('/funnel/', '')
    return (
      <LanguageProvider>
        <FunnelViewer slug={slug} />
      </LanguageProvider>
    )
  }

  // Direct check for reset password route
  if (currentPath === '/reset-password') {
    return (
      <LanguageProvider>
        <ResetPassword />
        <PWAInstaller />
      </LanguageProvider>
    )
  }










  // Check localStorage on init
  const storedMode = localStorage.getItem('isClientMode') === 'true'
  
  // V2 toggle for testing
  const useV2CoachHub = false  // true = V2, false = old version

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
      const currentUser = await db.getCurrentUser()
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
  if (currentPath === '/client-login') {
    if (!user) {
      return (
        <LanguageProvider>
          <Login onLogin={() => {
            setIsClientMode(true)
            localStorage.setItem('isClientMode', 'true')
            checkUser()
          }} />
          <PWAInstaller />
          <UpdateModal db={db} />
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
        <PWAInstaller />
        <UpdateModal db={db} />
      </LanguageProvider>
    )
  }

  // Dashboard routing based on state
  if (isClientMode) {
    return (
      <LanguageProvider>
        <ClientDashboard onLogout={handleLogout} />
        <PWAInstaller />
        <UpdateModal db={db} />
      </LanguageProvider>
    )
  } else {
    // Coach hub selection
    return (
      <LanguageProvider>
        {useV2CoachHub ? (
          <>
            <CoachHubV2 onLogout={handleLogout} />
            <PWAInstaller />
            <UpdateModal db={db} />
          </>
        ) : (
          <>
            <CoachHub onLogout={handleLogout} />
            <PWAInstaller />
            <UpdateModal db={db} />
          </>
        )}
      </LanguageProvider>
    )
  }
}

export default App
