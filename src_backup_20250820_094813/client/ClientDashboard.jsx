// src/client/ClientDashboard.jsx - FIXED VERSION met Recipe & Shopping navigatie
import { useState, useEffect } from 'react'
import { getCurrentUser, getClientByEmail, getClientSchema, signOut } from '../lib/supabase'
import ClientHome from './pages/ClientHome'
import ClientMealPlan from './pages/ClientMealPlan'
import ClientWorkoutPlan from './pages/ClientWorkoutPlan'
import ClientProgress from './pages/ClientProgress'
import ClientProfile from './pages/ClientProfile'
import ClientRecipeLibrary from './pages/ClientRecipeLibrary'
import ClientShoppingList from './pages/ClientShoppingList'
import { useLanguage, iconUrls } from '../contexts/LanguageContext'

// NavIcon component voor de iconen
function NavIcon({ iconUrl, size = 32, active = false }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '8px',
      background: active ? 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)' : 'transparent',
      padding: active ? '4px' : '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s'
    }}>
      <img 
        src={iconUrl} 
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: active ? 'brightness(1.2)' : 'brightness(0.8)',
          opacity: active ? 1 : 0.7
        }}
      />
    </div>
  )
}

export default function ClientDashboard() {
  const [currentView, setCurrentView] = useState('home')
  const [user, setUser] = useState(null)
  const [client, setClient] = useState(null)
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [error, setError] = useState(null)
  
  // Use language context
  const { t, language, toggleLanguage } = useLanguage()
  const isMobile = window.innerWidth <= 768

  // Navigation items with translations
  const navigationItems = [
    { id: 'home', label: t('nav.home'), iconUrl: iconUrls.home },
    { id: 'workout', label: t('nav.workout'), iconUrl: iconUrls.workout },
    { id: 'mealplan', label: t('nav.mealplan'), iconUrl: iconUrls.mealplan },
    { id: 'progress', label: t('nav.progress'), iconUrl: iconUrls.progress },
    { id: 'profile', label: t('nav.profile'), iconUrl: iconUrls.profile }
  ]

  useEffect(() => {
    loadClientData()
  }, [])

  const loadClientData = async () => {
    try {
      console.log('🔍 Step 1: Getting auth user...')
      const authUser = await getCurrentUser()
      console.log('Auth user:', authUser)
      
      if (!authUser?.email) {
        console.error('No auth user found')
        setError('Geen gebruiker gevonden')
        setLoading(false)
        return
      }
      
      setUser(authUser)
      
      console.log('🔍 Step 2: Getting client data for email:', authUser.email)
      const clientData = await getClientByEmail(authUser.email)
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
const schemaData = await getClientSchema(clientData.id)
        console.log('Schema data:', schemaData)
        setSchema(schemaData)
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
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="myarc-app myarc-flex myarc-items-center myarc-justify-center" style={{ minHeight: '100vh' }}>
        <div className="myarc-loading">
          <div className="myarc-spinner"></div>
          <div style={{ marginTop: '1rem', color: '#fff', textAlign: 'center' }}>
            {t('common.loading')}...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="myarc-app myarc-flex myarc-items-center myarc-justify-center" style={{ minHeight: '100vh' }}>
        <div className="myarc-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h2 className="myarc-card-title">⚠️ {t('common.error')}</h2>
          <p className="myarc-text-gray" style={{ marginBottom: '1rem' }}>{error}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()} 
              className="myarc-btn myarc-btn-primary"
            >
              {t('common.refresh')}
            </button>
            <button 
              onClick={handleLogout}
              className="myarc-btn myarc-btn-secondary"
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
      <div className="myarc-app myarc-flex myarc-items-center myarc-justify-center" style={{ minHeight: '100vh' }}>
        <div className="myarc-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h2 className="myarc-card-title">📋 Geen client account</h2>
          <p className="myarc-text-gray" style={{ marginBottom: '1rem' }}>
            Email: {user?.email}
          </p>
          <p className="myarc-text-gray" style={{ marginBottom: '1rem' }}>
            Je email is nog niet gekoppeld aan een client account. 
            Neem contact op met je trainer.
          </p>
          <button 
            onClick={handleLogout}
            className="myarc-btn myarc-btn-primary"
          >
            {t('common.logout')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="myarc-app">
      {/* Header - Simplified without coach/client toggle */}
      <header className="myarc-header" style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderBottom: '1px solid #10b98133'
      }}>
        <div className="myarc-container">
          <div className="myarc-flex myarc-items-center myarc-justify-between">
            {/* Logo & Welcome */}
            <div className="myarc-flex myarc-items-center myarc-gap-md">
              <h1 className="myarc-logo">MY ARC</h1>
              <div className="desktop-only">
                <p className="myarc-text-white" style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                  {t('common.welcome')}, {client.first_name}! 💪
                </p>
                <p className="myarc-text-gray" style={{ fontSize: '0.875rem' }}>
                  {t('client.welcomeMessage')}
                </p>
              </div>
            </div>

            {/* Right side controls */}
            <div className="myarc-flex myarc-items-center myarc-gap-sm">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="myarc-btn-icon"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {language === 'nl' ? '🇳🇱' : '🇬🇧'}
              </button>
              
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="myarc-btn myarc-btn-secondary desktop-only"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff'
                }}
              >
                {t('common.logout')}
              </button>

              {/* Mobile Menu Toggle */}
              <button 
                className="myarc-hamburger mobile-only"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-only"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div style={{
            background: '#1a1a1a',
            width: '80%',
            maxWidth: '300px',
            height: '100%',
            padding: '2rem 1rem',
            overflowY: 'auto'
          }}>
            <h2 style={{ color: '#10b981', marginBottom: '2rem' }}>Menu</h2>
            {navigationItems.map(item => (
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
                  padding: '1rem',
                  background: currentView === item.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  border: 'none',
                  borderLeft: currentView === item.id ? '3px solid #10b981' : '3px solid transparent',
                  color: currentView === item.id ? '#10b981' : '#fff',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <NavIcon 
                  iconUrl={item.iconUrl} 
                  size={24} 
                  active={currentView === item.id}
                />
                {item.label}
              </button>
            ))}
            
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '1rem',
                marginTop: '2rem',
                background: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              {t('common.logout')}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="myarc-main">
        <div className="myarc-container">
          {/* Desktop Side Navigation */}
          <nav className="desktop-only" style={{
            position: 'sticky',
            top: '1rem',
            width: '200px',
            float: 'left',
            marginRight: '2rem'
          }}>
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  background: currentView === item.id 
                    ? 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)'
                    : 'transparent',
                  border: currentView === item.id 
                    ? '1px solid #10b981' 
                    : '1px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <NavIcon 
                  iconUrl={item.iconUrl} 
                  size={28} 
                  active={currentView === item.id}
                />
                <span style={{
                  color: currentView === item.id ? '#fff' : '#a0a0a0',
                  fontSize: '0.9rem',
                  fontWeight: currentView === item.id ? 'bold' : 'normal'
                }}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>

          {/* View Content - MET ALLE VIEWS EN NAVIGATIE */}
          <div className="myarc-animate-in">
            {currentView === 'home' && (
              <ClientHome 
                client={client} 
                setCurrentView={setCurrentView} 
              />
            )}
            {currentView === 'mealplan' && (
              <ClientMealPlan 
                client={client} 
                onNavigate={setCurrentView}  // BELANGRIJK: Dit miste!
              />
            )}
            {currentView === 'workout' && (
              <ClientWorkoutPlan 
                client={client} 
                schema={schema} 
              />
            )}
            {currentView === 'progress' && (
              <ClientProgress 
                client={client} 
                schema={schema} 
              />
            )}
            {currentView === 'profile' && (
              <ClientProfile 
                client={client} 
                user={user} 
              />
            )}
            {currentView === 'recipe-library' && (
              <ClientRecipeLibrary 
                client={client} 
                onNavigate={setCurrentView}
              />
            )}
            {currentView === 'shopping-list' && (
              <ClientShoppingList 
                client={client}
                onNavigate={setCurrentView}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-only" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
        borderTop: '1px solid #10b98133',
        padding: '0.5rem',
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <NavIcon 
                iconUrl={item.iconUrl} 
                size={24} 
                active={currentView === item.id}
              />
              <span style={{
                fontSize: '0.65rem',
                color: currentView === item.id ? '#10b981' : '#a0a0a0',
                fontWeight: currentView === item.id ? 'bold' : 'normal'
              }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
