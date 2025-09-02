// src/coach/CoachHubV2.jsx
// HOOFDROUTER VOOR COACH SYSTEEM V2
// Clean architecture met 3 hoofdpagina's

import { useState, useEffect } from 'react'
import DatabaseService from '../services/DatabaseService'
import useIsMobile from '../hooks/useIsMobile'

// Hoofdpagina imports
import ClientManagementV2 from './v2/1-client-management/ClientManagementV2'
import PlanBuildingV2 from './v2/2-plan-building/PlanBuildingV2'
import TrackingV2 from './v2/3-tracking/TrackingV2'

// Layout componenten
import HeaderV2 from './v2/layouts/HeaderV2'
import NavigationV2 from './v2/layouts/NavigationV2'
import MobileNavV2 from './v2/layouts/MobileNavV2'

// Lucide Icons
import { 
  Users,
  ClipboardList,
  BarChart3,
  Menu,
  X,
  LogOut
} from 'lucide-react'

// Theme configuratie
const pageThemes = {
  management: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderActive: 'rgba(59, 130, 246, 0.2)',
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
    glow: '0 0 60px rgba(59, 130, 246, 0.1)'
  },
  building: {
    primary: '#10b981',
    primaryDark: '#059669',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderColor: 'rgba(16, 185, 129, 0.1)',
    borderActive: 'rgba(16, 185, 129, 0.2)',
    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)',
    glow: '0 0 60px rgba(16, 185, 129, 0.1)'
  },
  tracking: {
    primary: '#a855f7',
    primaryDark: '#9333ea',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    borderColor: 'rgba(168, 85, 247, 0.1)',
    borderActive: 'rgba(168, 85, 247, 0.2)',
    boxShadow: '0 10px 25px rgba(168, 85, 247, 0.25)',
    glow: '0 0 60px rgba(168, 85, 247, 0.1)'
  }
}

export default function CoachHubV2() {
  // State management
  const [currentView, setCurrentView] = useState('management')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Data states - shared tussen views
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [workoutSchemas, setWorkoutSchemas] = useState([])
  const [mealTemplates, setMealTemplates] = useState([])
  const [challenges, setChallenges] = useState([])
  
  const db = DatabaseService
  const isMobile = useIsMobile()
  
  // Get current theme
  const currentTheme = pageThemes[currentView] || pageThemes.management
  
  // Navigation items
  const navigationItems = [
    { 
      id: 'management', 
      label: 'Client Management', 
      icon: Users,
      description: 'Beheer clients en wijs plannen toe'
    },
    { 
      id: 'building', 
      label: 'Plan Building', 
      icon: ClipboardList,
      description: 'Maak workout, meal en andere plannen'
    },
    { 
      id: 'tracking', 
      label: 'Tracking & Analytics', 
      icon: BarChart3,
      description: 'Monitor progress en resultaten'
    }
  ]
  
  // Initialize data
  useEffect(() => {
    initializeCoach()
  }, [])
  




const initializeCoach = async () => {
  try {
    setLoading(true)
    
    // Load user
    const currentUser = await db.getCurrentUser()
    setUser(currentUser)
    
    // Load ALL clients from database (niet gefilterd op trainer)
    const { data: clientsData, error: clientsError } = await db.supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Load andere data
    const [schemasData, mealsData, challengesData] = await Promise.all([
      db.getWorkoutSchemas(),
      db.getMealPlanTemplates(),
      db.getChallenges()
    ])
    
    setClients(clientsData || [])
    setWorkoutSchemas(schemasData || [])
    setMealTemplates(mealsData || [])
    setChallenges(challengesData || [])
    
    console.log('✅ CoachHubV2 initialized with:', {
      clients: clientsData?.length || 0,
      schemas: schemasData?.length || 0,
      meals: mealsData?.length || 0,
      challenges: challengesData?.length || 0
    })
    
    if (clientsError) {
      console.error('Error loading clients:', clientsError)
    }
  } catch (error) {
    console.error('❌ Failed to initialize CoachHubV2:', error)
  } finally {
    setLoading(false)
  }
}





  const handleLogout = async () => {
    try {
      await db.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  // Shared props voor alle views
  const sharedProps = {
    db,
    clients,
    selectedClient,
    setSelectedClient,
    workoutSchemas,
    mealTemplates,
    challenges,
    isMobile,
    refreshData: initializeCoach
  }
  
  // Loading state
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
          <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '500' }}>
            Loading CoachHub V2...
          </div>
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
      {/* Header */}
      <HeaderV2 
        user={user}
        currentView={currentView}
        currentTheme={currentTheme}
        isMobile={isMobile}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLogout={handleLogout}
      />
      
      {/* Mobile Sliding Menu */}
      {isMobile && mobileMenuOpen && (
        <>
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
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '280px',
            height: '100vh',
            background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
            backdropFilter: 'blur(20px)',
            borderRight: `1px solid ${currentTheme.borderActive}`,
            zIndex: 99,
            padding: '5rem 1.5rem 1.5rem',
            overflowY: 'auto',
            boxShadow: '10px 0 40px rgba(0, 0, 0, 0.5)'
          }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id)
                    setMobileMenuOpen(false)
                  }}
                  style={{
                    padding: '1rem',
                    background: currentView === item.id
                      ? `linear-gradient(135deg, ${pageThemes[item.id].borderActive} 0%, ${pageThemes[item.id].borderColor} 100%)`
                      : 'transparent',
                    border: 'none',
                    borderLeft: currentView === item.id 
                      ? `3px solid ${pageThemes[item.id].primary}` 
                      : '3px solid transparent',
                    borderRadius: '8px',
                    color: currentView === item.id 
                      ? pageThemes[item.id].primary 
                      : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.95rem',
                    fontWeight: currentView === item.id ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <item.icon size={20} />
                    <div>
                      <div>{item.label}</div>
                      <div style={{
                        fontSize: '0.75rem',
                        opacity: 0.7,
                        marginTop: '0.25rem'
                      }}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              <button
                onClick={handleLogout}
                style={{
                  marginTop: '2rem',
                  padding: '0.875rem 1rem',
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
                Uitloggen
              </button>
            </nav>
          </div>
        </>
      )}
      
      {/* Main Content Area */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '2rem',
        paddingBottom: isMobile ? '100px' : '2rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Desktop Side Navigation */}
          {!isMobile && (
            <NavigationV2
              navigationItems={navigationItems}
              currentView={currentView}
              setCurrentView={setCurrentView}
              pageThemes={pageThemes}
            />
          )}
          
          {/* Content Area */}
          <div style={{ flex: 1, animation: 'fadeIn 0.5s ease' }}>
            {/* View Title */}
            <div style={{
              marginBottom: '2rem',
              padding: isMobile ? '1rem' : '1.5rem',
              background: `linear-gradient(135deg, ${currentTheme.borderActive} 0%, ${currentTheme.borderColor} 100%)`,
              borderRadius: '16px',
              border: `1px solid ${currentTheme.borderActive}`
            }}>
              <h1 style={{
                color: '#fff',
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                marginBottom: '0.5rem'
              }}>
                {navigationItems.find(item => item.id === currentView)?.label}
              </h1>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                {navigationItems.find(item => item.id === currentView)?.description}
              </p>
            </div>
            
            {/* Render Current View */}
            {currentView === 'management' && (
              <ClientManagementV2 {...sharedProps} />
            )}
            
            {currentView === 'building' && (
              <PlanBuildingV2 {...sharedProps} />
            )}
            
            {currentView === 'tracking' && (
              <TrackingV2 {...sharedProps} />
            )}
          </div>
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileNavV2
          navigationItems={navigationItems}
          currentView={currentView}
          setCurrentView={setCurrentView}
          currentTheme={currentTheme}
          pageThemes={pageThemes}
        />
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
