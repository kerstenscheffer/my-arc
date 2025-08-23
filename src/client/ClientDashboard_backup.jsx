import { useState, useEffect } from 'react'
import DatabaseService from '../services/DatabaseService'
const db = DatabaseService
import ClientHome from './pages/ClientHome'
import ClientMealPlan from './pages/ClientMealPlan'
import ClientWorkoutPlan from './pages/ClientWorkoutPlan'
import ClientProgress from './pages/ClientProgress'
import ClientProfile from './pages/ClientProfile'
import { useLanguage, iconUrls } from '../contexts/LanguageContext'
import ClientRecipeLibrary from './pages/ClientRecipeLibrary'
import ClientShoppingList from './pages/ClientShoppingList'

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
      const authUser = await db.getCurrentUser()
      console.log('📧 Auth user:', authUser)
      
      if (!authUser) {
        console.log('❌ No auth user found')
        setError('Not authenticated')
        setLoading(false)
        return
      }
      
      console.log('🔍 Step 2: Getting client by email:', authUser.email)
      const clientData = await getClientByEmail(authUser.email)
      console.log('👤 Client data:', clientData)
      
      if (clientData) {
        setClient(clientData)
        
        console.log('🔍 Step 3: Check schema ID:', clientData.assigned_schema_id)
        if (clientData.assigned_schema_id) {
          console.log('🔍 Step 4: Loading schema for client ID:', clientData.id)
          const schemaData = await getClientSchema(clientData.id)
          console.log('📋 Schema data:', schemaData)
          setSchema(schemaData)
        } else {
          console.log('⚠️ No schema assigned')
        }
      } else {
        console.log('❌ No client data found for email:', authUser.email)
        setError(`No client account found for ${authUser.email}`)
      }
      
      setUser(authUser)
    } catch (error) {
      console.error('💥 Error in loadClientData:', error)
      setError('Failed to load client data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await db.signOut()
    localStorage.removeItem('isClientMode')
    window.location.href = '/'
  }

  const switchToCoachLogin = () => {
    localStorage.removeItem('isClientMode')
    window.location.href = '/'
  }

  // Icon component - Cleaner design
  const NavIcon = ({ iconUrl, size = 24, active = false }) => (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: active ? '#10b981' : 'transparent',
      border: active ? 'none' : '1px solid #10b98133',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px',
      transition: 'all 0.3s'
    }}>
      <img 
        src={iconUrl}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          filter: active ? 'brightness(0) invert(1)' : 'brightness(0.7)',
          objectFit: 'contain',
          opacity: active ? 1 : 0.7
        }}
        onError={(e) => e.target.style.display = 'none'}
      />
    </div>
  )

  // Loading state
  if (loading) {
    return (
      <div className="myarc-app" style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div className="myarc-loading">
          <div className="myarc-spinner"></div>
          <div className="myarc-text-green">{t('common.loading')}...</div>
        </div>
      </div>
    )
  }

  // Error state - No client found
  if (!client || error) {
    return (
      <div className="myarc-app" style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{
          maxWidth: '500px', 
          textAlign: 'center',
          padding: '2rem',
          background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #10b98133'
        }}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⚠️</div>
          <h2 style={{fontSize: '1.5rem', marginBottom: '1rem', color: '#fff'}}>
            {t('errors.noClientAccount')}
          </h2>
          <p style={{marginBottom: '1.5rem', color: '#a0a0a0'}}>
            {user ? `"${user.email}" ${t('errors.notRegistered')}` : t('errors.failedToLoad')}
          </p>
          <p style={{fontSize: '0.875rem', marginBottom: '2rem', color: '#a0a0a0'}}>
            {t('errors.areYouCoach')}
          </p>
          
          <div className="myarc-flex myarc-flex-col myarc-gap-md">
            <button 
              onClick={switchToCoachLogin}
              className="myarc-btn myarc-btn-primary"
              style={{width: '100%'}}
            >
              🏋️ {t('errors.goToCoach')}
            </button>
            <button 
              onClick={handleLogout}
              className="myarc-btn myarc-btn-secondary"
              style={{width: '100%'}}
            >
              🚪 {t('errors.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Normal render - Client found
  return (
    <div className="myarc-app" style={{minHeight: '100vh', background: '#0a0a0a'}}>
      {/* Header - Cleaner design */}
      <header style={{
        background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
        borderBottom: '1px solid #10b98133',
        padding: isMobile ? '0.75rem' : '1rem'
      }}>
        <div className="myarc-container">
          <div className="myarc-flex myarc-items-center myarc-justify-between">
            {/* Mobile Menu Toggle */}
            <button 
              className="myarc-hamburger mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              style={{background: 'transparent'}}
            >
              <span style={{background: '#10b981'}}></span>
              <span style={{background: '#10b981'}}></span>
              <span style={{background: '#10b981'}}></span>
            </button>

            {/* Logo */}
            <div>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                color: '#fff',
                fontWeight: 'bold',
                letterSpacing: '0.1em'
              }}>
                MY ARC
              </h1>
              <p className="desktop-only" style={{
                fontSize: '0.75rem',
                color: '#10b981'
              }}>
                {t('common.welcome')}, {client?.first_name || 'Client'}
              </p>
            </div>

            {/* Desktop Current View */}
            <div className="desktop-only myarc-flex myarc-items-center myarc-gap-sm">
              <NavIcon 
                iconUrl={navigationItems.find(item => item.id === currentView)?.iconUrl} 
                active={true}
              />
              <span style={{
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: '#fff'
              }}>
                {navigationItems.find(item => item.id === currentView)?.label}
              </span>
            </div>

            {/* Language Toggle & User Info */}
            <div className="myarc-flex myarc-items-center myarc-gap-md">
              {/* Language Toggle Button */}
              <button 
                onClick={toggleLanguage}
                style={{
                  padding: '0.5rem', 
                  minWidth: '40px',
                  background: 'transparent',
                  border: '1px solid #10b98133',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {language === 'en' ? '🇳🇱' : '🇬🇧'}
              </button>
              
              <div className="desktop-only" style={{textAlign: 'right'}}>
                <div style={{fontSize: '0.85rem', color: '#fff'}}>
                  {client?.email}
                </div>
                <div style={{fontSize: '0.7rem', color: '#10b981'}}>
                  Client
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="myarc-btn myarc-btn-secondary myarc-btn-sm"
                style={{
                  background: 'transparent',
                  border: '1px solid #10b98133'
                }}
              >
                <span className="desktop-only">🚪 {t('common.logout')}</span>
                <span className="mobile-only">🚪</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown - Cleaner */}
          {mobileMenuOpen && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#0a0a0a',
              borderRadius: '8px',
              border: '1px solid #10b98133'
            }}>
              <div className="myarc-flex myarc-flex-col myarc-gap-sm">
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
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: currentView === item.id ? '#064e3b' : 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    <NavIcon 
                      iconUrl={item.iconUrl} 
                      size={20} 
                      active={currentView === item.id}
                    />
                    <span style={{
                      color: currentView === item.id ? '#10b981' : '#a0a0a0',
                      fontSize: '0.9rem'
                    }}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="myarc-main">
        <div className="myarc-container">
          {/* Desktop Navigation - Cleaner */}
          <nav className="desktop-only" style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '2rem',
            padding: '0.5rem',
            background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: currentView === item.id ? '#10b981' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  flex: 1,
                  justifyContent: 'center'
                }}
              >
                <NavIcon 
                  iconUrl={item.iconUrl} 
                  size={20} 
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

          {/* View Content */}
          <div className="myarc-animate-in">
            {currentView === 'home' && <ClientHome client={client} setCurrentView={setCurrentView} />}
{currentView === 'mealplan' && <ClientMealPlan client={client} onNavigate={setCurrentView} />}
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
            {currentView === 'workout' && <ClientWorkoutPlan client={client} schema={schema} />}
            {currentView === 'progress' && <ClientProgress client={client} schema={schema} />}
            {currentView === 'profile' && <ClientProfile client={client} user={user} />}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation - Cleaner */}
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
                color: currentView === item.id ? '#10b981' : '#a0a0a0'
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
