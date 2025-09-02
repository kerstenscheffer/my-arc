// src/client/ClientDashboard.jsx - CHALLENGE UPDATE VERSION
import NotificationWidget from '../modules/notifications/NotificationWidget';
import { useState, useEffect, useRef } from 'react'
import DatabaseService from '../services/DatabaseService'
import ClientHome from './pages/ClientHome'
import MealPlanMain from '../modules/meal-plan/MealPlanMain'
import ClientWorkoutPlan from './pages/ClientWorkoutPlan'
import ClientProgress from './pages/ClientProgress'
import ClientProfile from './pages/ClientProfile'
import ClientRecipeLibrary from './pages/ClientRecipeLibrary'
import ClientShoppingList from './pages/ClientShoppingList'
import ClientCalls from '../modules/call-planning/ClientCalls'
import ClientChallengePage from './pages/ClientChallengePage'
import { useLanguage } from '../contexts/LanguageContext'

// Lucide Icons imports
import { 
  Home, 
  Dumbbell, 
  Utensils, 
  TrendingUp, 
  User, 
  Phone,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Trophy // Trophy icon voor challenges
} from 'lucide-react'

// Initialize database service
const db = DatabaseService

// Debug check
if (!db) {
  console.error('DatabaseService not initialized!')
}

// THEME CONFIGURATION - Added challenges theme
const pageThemes = {
  home: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryDarkest: '#1d4ed8',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.05) 100%)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderActive: 'rgba(59, 130, 246, 0.2)',
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
    glow: '0 0 60px rgba(59, 130, 246, 0.1)'
  },
  workout: {
    primary: '#f97316',
    primaryDark: '#ea580c',
    primaryLight: '#fb923c',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
    borderColor: 'rgba(249, 115, 22, 0.1)',
    borderActive: 'rgba(249, 115, 22, 0.2)',
    boxShadow: '0 10px 25px rgba(249, 115, 22, 0.25)',
    glow: '0 0 60px rgba(249, 115, 22, 0.1)'
  },
  mealplan: {
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.1)',
    borderActive: 'rgba(16, 185, 129, 0.2)',
    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)',
    glow: '0 0 60px rgba(16, 185, 129, 0.1)'
  },
  challenges: {
    primary: '#dc2626',
    primaryDark: '#991b1b',
    primaryLight: '#ef4444',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.05) 100%)',
    borderColor: 'rgba(220, 38, 38, 0.1)',
    borderActive: 'rgba(220, 38, 38, 0.2)',
    boxShadow: '0 10px 25px rgba(220, 38, 38, 0.25)',
    glow: '0 0 60px rgba(220, 38, 38, 0.1)'
  },
  calls: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryDarkest: '#1d4ed8',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.05) 100%)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderActive: 'rgba(59, 130, 246, 0.2)',
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
    glow: '0 0 60px rgba(59, 130, 246, 0.1)'
  },
  progress: {
    primary: '#a855f7',
    primaryDark: '#9333ea',
    primaryLight: '#c084fc',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
    borderColor: 'rgba(168, 85, 247, 0.1)',
    borderActive: 'rgba(168, 85, 247, 0.2)',
    boxShadow: '0 10px 25px rgba(168, 85, 247, 0.25)',
    glow: '0 0 60px rgba(168, 85, 247, 0.1)'
  },
  profile: {
    primary: '#ec4899',
    primaryDark: '#db2777',
    primaryLight: '#f9a8d4',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.05) 100%)',
    borderColor: 'rgba(236, 72, 153, 0.1)',
    borderActive: 'rgba(236, 72, 153, 0.2)',
    boxShadow: '0 10px 25px rgba(236, 72, 153, 0.25)',
    glow: '0 0 60px rgba(236, 72, 153, 0.1)'
  }
}

// Premium NavIcon component met Lucide icons
function NavIcon({ Icon, size = 24, active = false, theme }) {
  return (
    <div style={{
      width: size + 12,
      height: size + 12,
      borderRadius: '12px',
      background: active 
        ? `linear-gradient(135deg, ${theme.borderActive} 0%, ${theme.borderColor} 100%)`
        : 'rgba(255, 255, 255, 0.03)',
      backdropFilter: active ? 'blur(10px)' : 'blur(5px)',
      border: active ? `1px solid ${theme.primary}` : '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: active ? theme.boxShadow : 'none'
    }}>
      <Icon 
        size={size}
        color={active ? theme.primary : 'rgba(255, 255, 255, 0.7)'}
        style={{
          transition: 'all 0.3s ease'
        }}
      />
    </div>
  )
}

// Main ClientDashboard Component
export default function ClientDashboard() {
  const [currentView, setCurrentView] = useState('home')
  const [user, setUser] = useState(null)
  const [client, setClient] = useState(null)
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  // Use language context
  const { t, language, toggleLanguage } = useLanguage()
  
  // Get current theme
  const currentTheme = pageThemes[currentView] || pageThemes.home
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      
      // Fix viewport height for mobile browsers
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    
    handleResize() // Initial call
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  // Navigation items - BOTTOM NAV (zonder Profile)
  const bottomNavItems = [
    { id: 'home', label: t('nav.home'), Icon: Home },
    { id: 'workout', label: t('nav.workout'), Icon: Dumbbell },
    { id: 'mealplan', label: t('nav.mealplan'), Icon: Utensils },
    { id: 'challenges', label: 'Challenges', Icon: Trophy },
    { id: 'calls', label: 'Calls', Icon: Phone },
    { id: 'progress', label: t('nav.progress'), Icon: TrendingUp }
  ]

  // Navigation items - SIDE MENU (met Profile)
  const sideMenuItems = [
    { id: 'home', label: t('nav.home'), Icon: Home },
    { id: 'workout', label: t('nav.workout'), Icon: Dumbbell },
    { id: 'mealplan', label: t('nav.mealplan'), Icon: Utensils },
    { id: 'challenges', label: 'Challenges', Icon: Trophy },
    { id: 'calls', label: 'Calls', Icon: Phone },
    { id: 'progress', label: t('nav.progress'), Icon: TrendingUp },
    { id: 'profile', label: t('nav.profile'), Icon: User }
  ]

  // Add viewport meta tag for mobile
  useEffect(() => {
    let metaViewport = document.querySelector('meta[name="viewport"]')
    if (!metaViewport) {
      metaViewport = document.createElement('meta')
      metaViewport.name = 'viewport'
      document.head.appendChild(metaViewport)
    }
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    
    return () => {
      // Cleanup if needed
    }
  }, [])
  
  useEffect(() => {
    loadClientData()
  }, [])

  const loadClientData = async () => {
    try {
      console.log('🔍 Step 1: Getting auth user...')
      const authUser = await db.getCurrentUser()
      console.log('Auth user:', authUser)
      
      if (!authUser?.email) {
        console.error('No auth user found')
        setError('Geen gebruiker gevonden')
        setLoading(false)
        return
      }
      
      setUser(authUser)
      
      console.log('🔍 Step 2: Getting client data for email:', authUser.email)
      const clientData = await db.getClientByEmail(authUser.email)
      console.log('Client data:', clientData)
      
      if (!clientData) {
        console.error('No client found for email:', authUser.email)
        setError('Client account niet gevonden voor: ' + authUser.email)
        setLoading(false)
        return
      }
      
      setClient(clientData)
      
      console.log('🔍 Step 3: Getting assigned schema...')
      if (clientData.assigned_schema_id) {
        try {
          const schemaData = await db.getClientSchema(clientData.id)
          console.log('Schema data:', schemaData)
          setSchema(schemaData)
        } catch (schemaError) {
          console.warn('Could not load schema:', schemaError)
          // Don't fail completely if schema fails
          setSchema(null)
        }
      } else {
        console.log('No schema assigned to client')
      }
    } catch (error) {
      console.error('Error loading client data:', error)
      setError('Fout bij laden van gegevens: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await db.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ 
            color: '#fff', 
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>
            {t('common.loading')}...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          background: 'rgba(17, 17, 17, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '1rem'
          }}>
            ⚠️ {t('common.error')}
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}>
            {error}
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center' 
          }}>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
            >
              {t('common.refresh')}
            </button>
            <button 
              onClick={handleLogout}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              {t('common.logout')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          background: 'rgba(17, 17, 17, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '1rem'
          }}>
            📋 Geen client account
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.5rem'
          }}>
            Email: {user?.email}
          </p>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            Je email is nog niet gekoppeld aan een client account.
            Neem contact op met je coach.
          </p>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)'
            }}
          >
            {t('common.logout')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      position: 'relative'
    }}>
      {/* Premium Header */}
      <header style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${currentTheme.borderActive}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.5), ${currentTheme.glow}`
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? '1rem' : '1.25rem 2rem',
          display: 'flex',
          justifyContent: isMobile ? 'center' : 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                position: 'absolute',
                left: '1rem',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: '#fff'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <>
                    <path d="M3 12h18" />
                    <path d="M3 6h18" />
                    <path d="M3 18h18" />
                  </>
                )}
              </svg>
            </button>
          )}
          
          {/* Logo Section - Centered on mobile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? '1.3rem' : '1.75rem',
                fontWeight: '900',
                backgroundImage: currentTheme.gradient,
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: currentTheme.primary, // Fallback voor browsers zonder support
                margin: 0,
                letterSpacing: '-0.02em',
                display: 'inline-block',
                animation: 'gradientShift 8s ease-in-out infinite'
              }}>
                MY ARC
              </h1>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                fontWeight: '500',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Welkom, {client?.first_name}
              </p>
            </div>
          </div>
          
          {/* Desktop Logout Button */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <LogOut size={18} />
                {t('common.logout')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sliding Menu - MET Profile */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: mobileMenuOpen ? 0 : '-100%',
          width: '280px',
          height: '100vh',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${currentTheme.borderActive}`,
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 99,
          padding: '1.5rem',
          paddingTop: '5rem',
          boxShadow: mobileMenuOpen ? '10px 0 40px rgba(0, 0, 0, 0.5)' : 'none'
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {sideMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id)
                  setMobileMenuOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: currentView === item.id 
                    ? `linear-gradient(135deg, ${pageThemes[item.id].borderActive} 0%, ${pageThemes[item.id].borderColor} 100%)`
                    : 'transparent',
                  border: 'none',
                  borderLeft: currentView === item.id ? `3px solid ${pageThemes[item.id].primary}` : '3px solid transparent',
                  color: currentView === item.id ? pageThemes[item.id].primary : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.95rem',
                  fontWeight: currentView === item.id ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: '8px'
                }}
              >
                <NavIcon 
                  Icon={item.Icon} 
                  size={20} 
                  active={currentView === item.id}
                  theme={pageThemes[item.id]}
                />
                {item.label}
              </button>
            ))}
            
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                marginTop: '2rem',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
            >
              <LogOut size={18} />
              {t('common.logout')}
            </button>
          </nav>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 98,
            backdropFilter: 'blur(5px)'
          }}
        />
      )}

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '2rem',
        paddingBottom: isMobile ? '100px' : '2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '2rem'
        }}>
          {/* Desktop Side Navigation - MET Profile */}
          {!isMobile && (
            <nav style={{
              position: 'sticky',
              top: '100px',
              width: '240px',
              height: 'fit-content'
            }}>
              <div style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: `1px solid ${currentTheme.borderColor}`,
                padding: '0.5rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                {sideMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      width: '100%',
                      padding: '0.875rem 1rem',
                      marginBottom: '0.25rem',
                      background: currentView === item.id 
                        ? `linear-gradient(135deg, ${pageThemes[item.id].borderActive} 0%, ${pageThemes[item.id].borderColor} 100%)`
                        : 'transparent',
                      border: currentView === item.id 
                        ? `1px solid ${pageThemes[item.id].primary}` 
                        : '1px solid transparent',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      color: currentView === item.id ? pageThemes[item.id].primary : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.95rem',
                      fontWeight: currentView === item.id ? '600' : '500'
                    }}
                    onMouseEnter={(e) => {
                      if (currentView !== item.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentView !== item.id) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }
                    }}
                  >
                    <NavIcon 
                      Icon={item.Icon} 
                      size={22} 
                      active={currentView === item.id}
                      theme={pageThemes[item.id]}
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          )}

          {/* View Content */}
          <div style={{ 
            flex: 1,
            animation: 'fadeIn 0.5s ease'
          }}>
            {currentView === 'home' && (
              <ClientHome 
                client={client} 
                db={db}
                setCurrentView={setCurrentView} 
              />
            )}
            {currentView === 'mealplan' && (
              <MealPlanMain
                client={client}
                db={db}
                onNavigate={setCurrentView}
              />
            )}
            {currentView === 'workout' && (
              <ClientWorkoutPlan 
                client={client} 
                schema={schema}
                db={db}
              />
            )}
            {currentView === 'challenges' && (
              <ClientChallengePage 
                db={db}
                client={client}
              />
            )}
            {currentView === 'calls' && (
              <ClientCalls 
                db={db}
                clientInfo={client} 
              />
            )}
            {currentView === 'progress' && (
              <ClientProgress 
                client={client} 
                schema={schema}
                db={db}
              />
            )}
            {currentView === 'profile' && (
              <ClientProfile 
                client={client} 
                user={user}
                db={db}
              />
            )}
            {currentView === 'recipe-library' && (
              <ClientRecipeLibrary 
                client={client} 
                db={db}
                onNavigate={setCurrentView}
              />
            )}
            {currentView === 'shopping-list' && (
              <ClientShoppingList 
                client={client}
                db={db}
                onNavigate={setCurrentView}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation - ZONDER Profile */}
      {isMobile && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          padding: '0.75rem 0.5rem',
          zIndex: 100,
          boxShadow: `0 -4px 20px rgba(0, 0, 0, 0.5), ${currentTheme.glow}`
        }}>
          {/* Gradient fade effect at top */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: 0,
            right: 0,
            height: '20px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(17, 17, 17, 0.98) 100%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}>
            {bottomNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: currentView === item.id ? 'translateY(-3px)' : 'translateY(0)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  minWidth: '44px'
                }}
                onTouchStart={(e) => {
                  if (isMobile && currentView !== item.id) {
                    e.currentTarget.style.transform = 'scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = currentView === item.id ? 'translateY(-3px)' : 'translateY(0)'
                  }
                }}
              >
                <NavIcon 
                  Icon={item.Icon} 
                  size={26} 
                  active={currentView === item.id}
                  theme={pageThemes[item.id]}
                />
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Notification Widget */}
      <NotificationWidget 
        db={db}
        clientId={user?.id}
        currentPage={currentView}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-10px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* Basic Mobile Fixes */
        @media (max-width: 768px) {
          /* Prevent horizontal scroll */
          body {
            overflow-x: hidden;
          }
          
          /* Fix input zoom on iOS */
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
