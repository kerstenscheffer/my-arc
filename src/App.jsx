// src/App.jsx
import InfoPage from './pages/InfoPage'
import ClientOnboarding from './client/pages/ClientOnboarding'
import FunnelPage from './funnel/FunnelPage'
import TillTheGoalPage from './till-the-goal/TillTheGoalPage'

import YourArcFunnel from './modules/funnel-pages/your-arc/YourArcFunnel'
import MyArcFunnel from './modules/funnel-pages/my-arc/MyArcFunnelMain'
import CheckoutPage from './pages/CheckoutPage'
import EightWeekCheckout from './pages/EightWeekCheckout'
import Homepage from './pages/Homepage'
import LeadPicGenerator from './modules/lead-pic-generator/LeadPicGenerator'
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
  const currentPath = window.location.pathname
  const isFunnelRoute = currentPath.startsWith('/funnel/')

  // ==============================================
  // STATE INITIALIZATION (Must be before any returns)
  // ==============================================
  const storedMode = localStorage.getItem('isClientMode') === 'true'
  const useV2CoachHub = false // Toggle between CoachHub versions

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isClientMode, setIsClientMode] = useState(storedMode)

  useEffect(() => {
    checkUser()
  }, [])

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

  // ==============================================
  // PUBLIC ROUTES (No Authentication Required)
  // ==============================================

  // Main page - InfoPage (link-in-bio)
  if (currentPath === '/' || currentPath === '/home' || currentPath === '/info') {
    return <InfoPage />
  }

  // Call booking funnel (moved to /fitworden)
  if (currentPath === '/fitworden') {
    return <Homepage />
  }

  // Checkout pages (public)
  if (currentPath === '/checkout') {
    return <CheckoutPage />
  }

  if (currentPath === '/8-week-checkout') {
    return <EightWeekCheckout />
  }

  // Success page after payment
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
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            Naar Homepage
          </button>
        </div>
      </div>
    )
  }

  // Meal preferences form
  if (currentPath === '/meal-preferences') {
    window.location.href = '/meal-preferences.html'
    return null
  }

  // Post maker / Lead generator
  if (currentPath === '/postmaker') {
    return <LeadPicGenerator />
  }

  // Client onboarding (public for new clients)
  if (currentPath === '/onboarding') {
    return (
      <LanguageProvider>
        <ClientOnboarding db={db} user={null} />
        <PWAInstaller />
      </LanguageProvider>
    )
  }

  // Funnel pages
  if (currentPath === '/funnel') {
    return <FunnelPage />
  }

  if (currentPath === '/your-arc') {
    return <YourArcFunnel />
  }


// My Arc funnel - NIEUW
if (currentPath === '/my-arc') {
  return <MyArcFunnel />
}

// Till The Goal funnel - NIEUW
if (currentPath === '/till-the-goal') {
  return <TillTheGoalPage />
}


  if (isFunnelRoute) {
    const slug = currentPath.replace('/funnel/', '')
    return (
      <LanguageProvider>
        <FunnelViewer slug={slug} />
      </LanguageProvider>
    )
  }

  // Password reset
  if (currentPath === '/reset-password') {
    return (
      <LanguageProvider>
        <ResetPassword />
        <PWAInstaller />
      </LanguageProvider>
    )
  }

  // ==============================================
  // AUTHENTICATED ROUTES (Login Required)
  // ==============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Client login route
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

  // Dashboard routing based on mode
  if (isClientMode) {
    return (
      <LanguageProvider>
        <ClientDashboard onLogout={handleLogout} />
        <PWAInstaller />
        <UpdateModal db={db} />
      </LanguageProvider>
    )
  } else {
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
