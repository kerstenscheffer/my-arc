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
import PageVideoWidget from '../modules/videos/PageVideoWidget'
import WidgetSidebar from '../components/WidgetSidebar'
import CheckinReminderPopup from './components/CheckinReminderPopup'
import CheckinModal from './components/CheckinModal'
import ClientAgendaView from '../modules/client-agenda/ClientAgendaView'

// Lucide Icons
import {
  Home,
  Dumbbell,
  Utensils,
  Camera,
  Phone,
  User,
  ShoppingCart,
  LogOut,
  Bell,
  HelpCircle,
  PlayCircle
} from 'lucide-react'

// Initialize database
const db = DatabaseService

// Theme Configuration
const pageThemes = {
  home:         { primary: '#FFD700' },
  workout:      { primary: '#FFD700' },
  meal:         { primary: '#FFD700' },
  agenda:       { primary: '#FFD700' },
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
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  // Versie-counter die we bumpen zodra een check-in binnenkomt. De
  // CheckinReminderPopup luistert hierop om direct te re-evalueren en
  // de pill weg te halen — geen pageload meer nodig.
  const [checkinVersion, setCheckinVersion] = useState(0)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // WidgetSidebar — één widget tegelijk geopend, plus live badge-counts.
  const [widgetOpen, setWidgetOpen] = useState(null)
  const [widgetCounts, setWidgetCounts] = useState({ notifications: 0, vragen: 0, video: 0 })
  const setCount = (key) => (n) => setWidgetCounts(prev => prev[key] === n ? prev : { ...prev, [key]: n })

  // Focus-mode: actieve pagina (zoals workout) kan via callback signalen
  // dat de bottom-nav en widgetbar verborgen moet worden voor maximale focus.
  const [focusMode, setFocusMode] = useState(false)
  
  const { t, language, toggleLanguage } = useLanguage()
  const currentTheme = pageThemes[currentView] || pageThemes.home
  
  // Eén navigatie nu — header en side-nav zijn weggehaald, dus de
  // floating bottom-bar is de enige route tussen views. Alle 7 views
  // zitten erin.
  const navItems = [
    { id: 'home',         label: 'Home',     Icon: Home },
    { id: 'workout',      label: 'Workout',  Icon: Dumbbell },
    { id: 'meal',         label: 'Meal',     Icon: Utensils },
    { id: 'boodschappen', label: 'Shop',     Icon: ShoppingCart },
    { id: 'tracking',     label: 'Tracking', Icon: Camera },
    { id: 'calls',        label: 'Calls',    Icon: Phone },
    { id: 'profile',      label: 'Profile',  Icon: User }
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

      const previewClientId = localStorage.getItem('coachPreviewClientId')
      let clientData
      if (previewClientId) {
        localStorage.removeItem('coachPreviewClientId')
        clientData = await db.getClient(previewClientId)
      } else {
        clientData = await db.getClientByEmail(authUser.email)
      }

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

      {/* Weekly check-in nag — center popup on Friday + missed-Friday window */}
      <CheckinReminderPopup
        client={client}
        db={db}
        isMobile={isMobile}
        onOpen={() => setShowCheckinModal(true)}
        version={checkinVersion}
      />

      {/* ── Main Content ── */}
      {/* Geen header en geen side-nav meer: enige navigatie is de floating
          bottom-bar verderop. paddingBottom is groot genoeg om content
          niet te verstoppen onder de zwevende balk (ca. 100-120px). */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '0' : '1.25rem 1.5rem 0',
        paddingBottom: '120px',
      }}>
        <div>
          <div style={{ flex: 1 }}>
            {currentView === 'home' && (
              <ClientHome client={client} db={db} setCurrentView={setCurrentView} />
            )}
            {currentView === 'workout' && (
              <ClientWorkoutPlan client={client} schema={schema} db={db} onFocusChange={setFocusMode} />
            )}
            {currentView === 'meal' && (
              <MealPlanMain client={client} db={db} onNavigate={setCurrentView} />
            )}
            {currentView === 'agenda' && (
              <ClientAgendaView client={client} db={db} viewerRole="client" />
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

      {/* ── Floating Bottom Nav — verbergen in focus-mode (bv. workout-dropdown open) ── */}
      {!focusMode && <nav style={{
        position: 'fixed',
        bottom: 30,
        left: isMobile ? 10 : '50%',
        right: isMobile ? 10 : 'auto',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        width: isMobile ? 'auto' : 'min(680px, calc(100vw - 32px))',
        background: 'rgba(10, 10, 10, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 22,
        boxShadow: '0 18px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,215,0,0.04)',
        padding: isMobile ? '0.5rem 0.3rem' : '0.6rem 0.5rem',
        zIndex: 100,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: 2,
        }}>
          {navItems.map(item => {
            const isActive = currentView === item.id
            const theme = pageThemes[item.id]
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: isMobile ? '0.35rem 0.05rem' : '0.45rem 0.15rem',
                  background: isActive ? `${theme.primary}14` : 'transparent',
                  border: 'none',
                  borderRadius: 14,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: 44,
                  minWidth: 36,
                  transition: 'background 0.15s ease',
                }}
              >
                <item.Icon
                  size={isMobile ? 20 : 22}
                  color={isActive ? theme.primary : 'rgba(255, 255, 255, 0.42)'}
                  strokeWidth={isActive ? 2.5 : 1.9}
                />
                <span style={{
                  fontSize: isMobile ? '0.52rem' : '0.58rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? theme.primary : 'rgba(255, 255, 255, 0.35)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>}

      {/* currentPage="all" — de widget is het meldingen-centrum en toont ALLES.
          Stond hier `currentView`, waardoor een melding alleen zichtbaar was als
          de klant toevallig op de bijbehorende pagina stond; meldingen met een
          context die geen enkele view heeft (bv. 'progress', 'quick_message')
          waren zelfs nooit te zien. page_context blijft als metadata bestaan. */}
      <NotificationWidget
        db={db} clientId={client?.id} currentPage="all"
        open={widgetOpen === 'notifications'}
        onOpenChange={(o) => setWidgetOpen(o ? 'notifications' : null)}
        onCountChange={setCount('notifications')}
      />

      <ClientFAQModal
        db={db}
        onNavigate={(view) => setCurrentView(view)}
        coachWhatsApp="31631388756"
        open={widgetOpen === 'vragen'}
        onOpenChange={(o) => setWidgetOpen(o ? 'vragen' : null)}
      />

      {/* Centrale video-widget — pageContext volgt huidige view, vervangt
          de per-pagina varianten (die wel blijven bestaan voor backward
          compat, maar in deze controlled mode tonen ze geen floating tab). */}
      {client && (
        <PageVideoWidget
          client={client} db={db} pageContext={currentView}
          open={widgetOpen === 'video'}
          onOpenChange={(o) => setWidgetOpen(o ? 'video' : null)}
          onCountChange={setCount('video')}
        />
      )}

      <WidgetSidebar
        isMobile={isMobile}
        buttons={[
          {
            id: 'notifications', label: 'Meldingen', Icon: Bell, color: '#FFD700',
            active: widgetOpen === 'notifications', badge: widgetCounts.notifications,
            onClick: () => setWidgetOpen(o => o === 'notifications' ? null : 'notifications'),
          },
          {
            id: 'vragen', label: 'Vragen', Icon: HelpCircle, color: '#FFD700',
            active: widgetOpen === 'vragen',
            onClick: () => setWidgetOpen(o => o === 'vragen' ? null : 'vragen'),
          },
          {
            id: 'video', label: 'Video', Icon: PlayCircle, color: '#FFD700',
            active: widgetOpen === 'video', badge: widgetCounts.video,
            onClick: () => setWidgetOpen(o => o === 'video' ? null : 'video'),
          },
        ]}
      />

      <CheckinModal
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        onSubmitted={() => setCheckinVersion(v => v + 1)}
        client={client}
        db={db}
        isMobile={isMobile}
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
