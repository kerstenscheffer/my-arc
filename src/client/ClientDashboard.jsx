import { useState, useEffect } from 'react'
import { getCurrentUser, getClientByEmail, getClientSchema, signOut } from '../lib/supabase'
import ClientHome from './pages/ClientHome'
import ClientMealPlan from './pages/ClientMealPlan'
import ClientWorkoutPlan from './pages/ClientWorkoutPlan'
import ClientProgress from './pages/ClientProgress'
import ClientProfile from './pages/ClientProfile'
import { useLanguage, iconUrls } from '../contexts/LanguageContext'

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
    await signOut()
    localStorage.removeItem('isClientMode')
    window.location.href = '/'
  }

  const switchToCoachLogin = () => {
    localStorage.removeItem('isClientMode')
    window.location.href = '/'
  }

  // Icon component
  const NavIcon = ({ iconUrl, size = 24 }) => (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: '#10b981',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px'
    }}>
      <img 
        src={iconUrl}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          filter: 'brightness(0) invert(1)',
          objectFit: 'contain'
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
        <div className="myarc-card" style={{maxWidth: '500px', textAlign: 'center'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⚠️</div>
          <h2 className="myarc-text-white" style={{fontSize: '1.5rem', marginBottom: '1rem'}}>
            {t('errors.noClientAccount')}
          </h2>
          <p className="myarc-text-gray" style={{marginBottom: '1.5rem'}}>
            {user ? `"${user.email}" ${t('errors.notRegistered')}` : t('errors.failedToLoad')}
          </p>
          <p className="myarc-text-gray" style={{fontSize: '0.875rem', marginBottom: '2rem'}}>
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
      {/* Header */}
      <header className="myarc-header">
        <div className="myarc-container">
          <div className="myarc-flex myarc-items-center myarc-justify-between">
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

            {/* Logo */}
            <div>
              <h1 className="myarc-logo">MY ARC</h1>
              <p className="myarc-text-gray desktop-only" style={{fontSize: '0.875rem'}}>
                {t('common.welcome')}, {client?.first_name || 'Client'}
              </p>
            </div>

            {/* Desktop Current View with Icon */}
            <div className="desktop-only myarc-flex myarc-items-center myarc-gap-sm">
              <NavIcon iconUrl={navigationItems.find(item => item.id === currentView)?.iconUrl} />
              <span className="myarc-text-green" style={{fontSize: '1.2rem', fontWeight: 'bold'}}>
                {navigationItems.find(item => item.id === currentView)?.label}
              </span>
            </div>

            {/* Language Toggle & User Info */}
            <div className="myarc-flex myarc-items-center myarc-gap-md">
              {/* Language Toggle Button */}
              <button 
                onClick={toggleLanguage}
                className="myarc-btn myarc-btn-ghost myarc-btn-sm"
                style={{padding: '0.5rem', minWidth: '40px'}}
              >
                {language === 'en' ? '🇳🇱' : '🇬🇧'}
              </button>
              
              <div className="myarc-user-info desktop-only">
                <div className="myarc-user-email">{client?.email}</div>
                <div className="myarc-user-role">Client</div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="myarc-btn myarc-btn-secondary myarc-btn-sm"
              >
                <span className="desktop-only">🚪 {t('common.logout')}</span>
                <span className="mobile-only">🚪</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="myarc-mobile-menu">
              <div className="myarc-flex myarc-flex-col myarc-gap-sm">
                {navigationItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`myarc-nav-item ${currentView === item.id ? 'active' : ''}`}
                    style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}
                  >
                    <NavIcon iconUrl={item.iconUrl} size={20} />
                    {item.label}
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
          {/* Desktop Navigation */}
          <nav className="myarc-nav desktop-only">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`myarc-nav-item ${currentView === item.id ? 'active' : ''}`}
                style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}
              >
                <NavIcon iconUrl={item.iconUrl} size={20} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* View Content */}
          <div className="myarc-animate-in">
            {currentView === 'home' && <ClientHome client={client} setCurrentView={setCurrentView} />}
            {currentView === 'mealplan' && <ClientMealPlan client={client} />}
            {currentView === 'workout' && <ClientWorkoutPlan client={client} schema={schema} />}
            {currentView === 'progress' && <ClientProgress client={client} schema={schema} />}
            {currentView === 'profile' && <ClientProfile client={client} user={user} />}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="myarc-mobile-nav mobile-only">
        <div className="myarc-mobile-nav-items">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`myarc-mobile-nav-item ${currentView === item.id ? 'active' : ''}`}
            >
              <NavIcon iconUrl={item.iconUrl} size={24} />
              <span style={{fontSize: '0.65rem'}}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
