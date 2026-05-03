// src/client/ClientDashboard.jsx - CLEAN VERSION v2.0
// ✅ ONLY STYLING CHANGED - All logic, state, routing, auth IDENTICAL
import { useState, useEffect } from 'react'
import DatabaseService from '../services/DatabaseService'
import { useLanguage } from '../contexts/LanguageContext'

// Component Imports - ALLEEN ESSENTIEEL
import ClientHome from './pages/ClientHome'
import MealPlanMain from '../modules/meal-plan/MealPlanMain'
import ClientWorkoutPlan from './pages/ClientWorkoutPlan'
import ClientCalls from '../modules/call-planning/ClientCalls'
import ProgressMain from '../modules/progress/ProgressMain'
import ClientProfile from './pages/ClientProfile'
import ShoppingHub from '../modules/shopping/ShoppingHub'
import NotificationWidget from '../modules/notifications/NotificationWidget'
import PWAUpdateBanner from '../components/PWAUpdateBanner'
import ClientFAQModal from '../modules/faq/ClientFAQModal'

// Lucide Icons
import { 
  Home,
  Dumbbell,
  Utensils,
  Camera,
  Phone,
  User,
  ShoppingCart,
  Menu,
  X,
  LogOut
} from 'lucide-react'

// Initialize database
const db = DatabaseService

// Theme Configuration
const pageThemes = {
  home:         { primary: '#FFD700' },
  workout:      { primary: '#FFD700' },
  meal:         { primary: '#FFD700' },
  boodschappen: { primary: '#FFD700' },
  tracking:     { primary: '#FFD700' },
  calls:        { primary: '#FFD700' },
  profile:      { primary: '#FFD700' }
}

export default function ClientDashboard() {
  const [currentView, setCurrentView] = useState('home')
  const [user, setUser] = useState(null)
  const [client, setClient] = useState(null)
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  const { t, language, toggleLanguage } = useLanguage()
  const currentTheme = pageThemes[currentView] || pageThemes.home
  
  const bottomNavItems = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'workout', label: 'Workout', Icon: Dumbbell },
    { id: 'meal', label: 'Meal', Icon: Utensils },
    { id: 'tracking', label: 'Tracking', Icon: Camera },
    { id: 'calls', label: 'Calls', Icon: Phone },
    { id: 'profile', label: 'Profile', Icon: User }
  ]

  const sideMenuItems = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'workout', label: 'Workout', Icon: Dumbbell },
    { id: 'meal', label: 'Meal', Icon: Utensils },
    { id: 'boodschappen', label: 'Boodschappen', Icon: ShoppingCart },
    { id: 'tracking', label: 'Tracking', Icon: Camera },
    { id: 'calls', label: 'Calls', Icon: Phone },
    { id: 'profile', label: 'Profile', Icon: User }
  ]
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  useEffect(() => {
    let metaViewport = document.querySelector('meta[name="viewport"]')
    if (!metaViewport) {
      metaViewport = document.createElement('meta')
      metaViewport.name = 'viewport'
      document.head.appendChild(metaViewport)
    }
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
  }, [])
  
  useEffect(() => { loadClientData() }, [])

  const loadClientData = async () => {
    try {
      const authUser = await db.getCurrentUser()
      if (!authUser?.email) { setError('Geen gebruiker gevonden'); setLoading(false); return }
      setUser(authUser)
      const clientData = await db.getClientByEmail(authUser.email)
      if (!clientData) { setError('Client account niet gevonden voor: ' + authUser.email); setLoading(false); return }
      setClient(clientData)
      if (clientData.assigned_schema_id) {
        try { const schemaData = await db.getClientSchema(clientData.id); setSchema(schemaData) }
        catch (schemaError) { console.warn('Could not load schema:', schemaError); setSchema(null) }
      }
    } catch (error) {
      console.error('Error loading client data:', error)
      setError('Fout bij laden van gegevens: ' + error.message)
    } finally { setLoading(false) }
  }

  const handleLogout = async () => {
    try { await db.signOut(); window.location.href = '/' }
    catch (error) { console.error('Error logging out:', error) }
  }

  const handleClientUpdate = (updatedClient) => {
    setClient(prev => ({ ...prev, ...updatedClient }))
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '2px solid rgba(255, 255, 255, 0.06)',
            borderTopColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '50%', margin: '0 auto 1rem',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.85rem', fontWeight: '500' }}>
            Loading...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}>
        <div style={{
          maxWidth: '400px', width: '100%', background: '#111',
          borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '2rem', textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', marginBottom: '0.75rem' }}>
            Er ging iets mis
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '1.5rem', lineHeight: '1.5', fontSize: '0.85rem' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => window.location.reload()} style={{
              flex: 1, padding: '0.7rem', background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px',
              color: '#fff', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
            }}>Refresh</button>
            <button onClick={handleLogout} style={{
              flex: 1, padding: '0.7rem', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px',
              color: '#ef4444', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
            }}>Logout</button>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div style={{ 
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}>
        <div style={{
          maxWidth: '400px', width: '100%', background: '#111',
          borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '2rem', textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', marginBottom: '0.75rem' }}>
            Geen client account
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
            Email: {user?.email}
          </p>
          <p style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
            Neem contact op met je coach.
          </p>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '0.7rem', background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px',
            color: '#ef4444', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
          }}>Logout</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#0a0a0a',
      position: 'relative'
    }}>
      <PWAUpdateBanner />

      {/* ── Header ── */}
      <header style={{
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 2rem',
          display: 'flex',
          justifyContent: isMobile ? 'center' : 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                position: 'absolute',
                left: '1rem',
                width: '36px', height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255, 255, 255, 0.5)',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
          
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.15rem' : '1.5rem',
              fontWeight: '900',
              color: currentTheme.primary,
              margin: 0,
              letterSpacing: '-0.03em',
              textAlign: isMobile ? 'center' : 'left'
            }}>
              MY ARC
            </h1>
            <p style={{
              fontSize: isMobile ? '0.65rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.3)',
              margin: 0,
              fontWeight: '500',
              textAlign: isMobile ? 'center' : 'left'
            }}>
              Welkom, {client?.first_name}
            </p>
          </div>
          
          {!isMobile && (
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: '600',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut size={15} />
              Logout
            </button>
          )}
        </div>
      </header>

      {/* ── Mobile Sliding Menu ── */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: mobileMenuOpen ? 0 : '-100%',
          width: '260px',
          height: '100vh',
          background: '#0a0a0a',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 99,
          padding: '1.25rem',
          paddingTop: '4.5rem'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {sideMenuItems.map(item => {
              const isActive = currentView === item.id
              const theme = pageThemes[item.id]
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    width: '100%', padding: '0.7rem 0.75rem',
                    background: isActive ? `${theme.primary}10` : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? `2px solid ${theme.primary}` : '2px solid transparent',
                    color: isActive ? theme.primary : 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    borderRadius: '0 8px 8px 0',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <item.Icon size={18} />
                  {item.label}
                </button>
              )
            })}
            
            <button onClick={handleLogout} style={{
              width: '100%', padding: '0.7rem 0.75rem',
              marginTop: '1.5rem',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.12)',
              borderRadius: '8px',
              color: '#ef4444', fontSize: '0.85rem', fontWeight: '600',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 98
          }}
        />
      )}

      {/* ── Main Content ── */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginTop: 0,
        padding: isMobile ? '0' : '2rem',
        paddingBottom: isMobile ? '80px' : '2rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {!isMobile && (
            <nav style={{ position: 'sticky', top: '80px', width: '200px', height: 'fit-content' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {sideMenuItems.map(item => {
                  const isActive = currentView === item.id
                  const theme = pageThemes[item.id]
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        width: '100%', padding: '0.625rem 0.75rem',
                        background: isActive ? `${theme.primary}10` : 'transparent',
                        border: 'none',
                        borderLeft: isActive ? `2px solid ${theme.primary}` : '2px solid transparent',
                        borderRadius: '0 8px 8px 0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        color: isActive ? theme.primary : 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? '700' : '500',
                        textAlign: 'left'
                      }}
                    >
                      <item.Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>
          )}

          <div style={{ flex: 1 }}>
            {currentView === 'home' && (
              <ClientHome client={client} db={db} setCurrentView={setCurrentView} />
            )}
            {currentView === 'workout' && (
              <ClientWorkoutPlan client={client} schema={schema} db={db} />
            )}
            {currentView === 'meal' && (
              <MealPlanMain client={client} db={db} onNavigate={setCurrentView} />
            )}
            {currentView === 'boodschappen' && (
              <ShoppingHub client={client} db={db} onNavigate={setCurrentView} />
            )}
            {currentView === 'tracking' && (
              <ProgressMain db={db} client={client} />
            )}
            {currentView === 'calls' && (
              <ClientCalls db={db} clientInfo={client} />
            )}
            {currentView === 'profile' && (
              <ClientProfile client={client} user={user} db={db} onClientUpdate={handleClientUpdate} />
            )}
          </div>
        </div>
      </main>

      {/* ── Bottom Nav ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '0.5rem 0 0.625rem',
          paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))',
          zIndex: 100
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}>
            {bottomNavItems.map(item => {
              const isActive = currentView === item.id
              const theme = pageThemes[item.id]
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                    padding: '0.35rem 0.5rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px',
                    minWidth: '44px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <item.Icon
                    size={22}
                    color={isActive ? theme.primary : 'rgba(255, 255, 255, 0.35)'}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span style={{
                    fontSize: '0.55rem',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? theme.primary : 'rgba(255, 255, 255, 0.25)',
                    letterSpacing: '-0.01em'
                  }}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      <NotificationWidget db={db} clientId={user?.id} currentPage={currentView} />

      <ClientFAQModal
        db={db}
        onNavigate={(view) => setCurrentView(view)}
        coachWhatsApp="31631388756"
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          body { overflow-x: hidden; }
          input, select, textarea { font-size: 16px !important; }
        }
      `}</style>
    </div>
  )
}
