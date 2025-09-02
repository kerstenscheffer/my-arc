import CoachWorkoutAnalytics from './pages/CoachWorkoutAnalytics'
import AIMealGenerator from '../modules/ai-meal-generator/AIMealGenerator'
import useIsMobile from '../hooks/useIsMobile'
import WorkoutLogModule from '../modules/progress/workout/WorkoutLogModule'
import ChallengeBuilder from "../modules/challenges/ChallengeBuilder"
import CoachVideoTab from '../modules/videos/CoachVideoTab'
import { useState, useEffect } from 'react'
import DatabaseService from '../services/DatabaseService'
import AIGenerator from '../components/AIGenerator'
import CoachMealPlannerDashboard from "./pages/CoachMealPlannerDashboard"
import CoachProgressTab from '../modules/progress/CoachProgressTab'
import ClientManagementCore from '../modules/client-management/ClientManagementCore'
import { CallPlanningTab } from '../modules/call-planning/CallPlanningComponents'

// Lucide Icons imports
import { 
  Home,
  Users,
Sparkles,
  Target,
  TrendingUp,
Activity,
  Trophy,
  Video,
  Bot,
  Phone,
  Utensils,
  ClipboardList,
  BarChart3,
  Menu,
  X,
  LogOut,
  Plus,
  CheckSquare,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Dumbbell,
  MessageSquare,
  Gift
} from 'lucide-react'

// Theme configuration - Coach specific colors
const pageThemes = {
  overview: {
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
  clients: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderActive: 'rgba(59, 130, 246, 0.2)',
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
    glow: '0 0 60px rgba(59, 130, 246, 0.1)'
  },
  management: {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
    borderColor: 'rgba(139, 92, 246, 0.1)',
    borderActive: 'rgba(139, 92, 246, 0.2)',
    boxShadow: '0 10px 25px rgba(139, 92, 246, 0.25)',
    glow: '0 0 60px rgba(139, 92, 246, 0.1)'
  },
  challenges: {
    primary: '#f59e0b',
    primaryDark: '#d97706',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.1)',
    borderActive: 'rgba(245, 158, 11, 0.2)',
    boxShadow: '0 10px 25px rgba(245, 158, 11, 0.25)',
    glow: '0 0 60px rgba(245, 158, 11, 0.1)'
  },


'ai-meals': {
  primary: '#8b5cf6',
  primaryDark: '#7c3aed',
  primaryLight: '#a78bfa',
  gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  backgroundGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
  borderColor: 'rgba(139, 92, 246, 0.1)',
  borderActive: 'rgba(139, 92, 246, 0.2)',
  boxShadow: '0 10px 25px rgba(139, 92, 246, 0.25)',
  glow: '0 0 60px rgba(139, 92, 246, 0.1)'
}



}

// Premium NavIcon component
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

export default function CoachHub() {
  // ===== STATE MANAGEMENT =====
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedClient, setSelectedClient] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Data states
  const [clients, setClients] = useState([])
  const [workoutSchemas, setWorkoutSchemas] = useState([])
  const [mealTemplates, setMealTemplates] = useState([])
  const [notifications, setNotifications] = useState([])
  const [user, setUser] = useState(null)
  
  // Sub-tabs for client detail
  const [clientDetailTab, setClientDetailTab] = useState('info')
  
  // Forms
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [selectedClients, setSelectedClients] = useState([])
  
  // Quick Actions
  const [quickAction, setQuickAction] = useState(null)
  
  const db = DatabaseService
  const isMobile = useIsMobile()

  // Get current theme
  const currentTheme = pageThemes[activeTab] || pageThemes.overview

const bottomNavItems = [
  { id: 'overview', label: 'Dashboard', Icon: Home }, 
  { id: 'clients', label: 'Cliënten', Icon: Users },
  { id: 'management', label: 'Beheer', Icon: Target },
  { id: 'challenges', label: 'Challenges', Icon: Trophy },
  { id: 'ai-meals', label: 'AI Meals', Icon: Sparkles }, // <-- UPDATED
  { id: 'calls', label: 'Calls', Icon: Phone }
]

// Update allNavItems - voeg 'ai-meals' toe NA 'meal-builder':
const allNavItems = [
  { id: 'overview', label: 'Dashboard', Icon: Home },
  { id: 'clients', label: 'Cliënten', Icon: Users },
  { id: 'management', label: 'Client Beheer', Icon: Target }, 
  { id: 'progress', label: 'Progress', Icon: TrendingUp },
  { id: 'workout-analytics', label: 'Workout Analytics', Icon: Activity }, // <-- NIEUW
  { id: 'challenges', label: 'Challenges', Icon: Trophy },
  { id: 'coachvids', label: 'Videos', Icon: Video },
  { id: 'ai-generator', label: 'AI Generator', Icon: Bot },     
  { id: 'calls', label: 'Call Planning', Icon: Phone },   
  { id: 'meal-builder', label: 'Meal Planner', Icon: Utensils },
  { id: 'ai-meals', label: 'AI Meals', Icon: Sparkles },
  { id: 'programs', label: 'Programma\'s', Icon: ClipboardList },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 }
]



  // ===== LIFECYCLE =====
  useEffect(() => {
    initializeHub()
    loadUser()
    
    // Subscribe to updates
    const unsubClients = db.subscribe('clients', (data) => {
      setClients(data)
    })
    
    return () => {
      unsubClients()
    }
  }, [])

  const loadUser = async () => {
    try {
      const currentUser = await db.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }

  const initializeHub = async () => {
    setLoading(true)
    try {
      const [clientsData, schemasData, mealsData] = await Promise.all([
        db.getClients(),
        db.getWorkoutSchemas(),
        db.getMealPlanTemplates()
      ])

      console.log('🔍 Client data structure:', clientsData)
      console.log('🔍 First client:', clientsData?.[0])
      
      setClients(clientsData)
      setWorkoutSchemas(schemasData)
      setMealTemplates(mealsData)
    } catch (error) {
      console.error('Failed to initialize hub:', error)
    } finally {
      setLoading(false)   
    }
  }

  // ===== CLIENT OPERATIONS =====
  const handleCreateClient = async (formData) => {
    try {
      setLoading(true)
      const user = await db.getCurrentUser()
      const result = await db.createClient(formData, user.id)
      
      alert(`✅ Client aangemaakt!\nEmail: ${result.loginCredentials.email}\nWachtwoord: ${result.loginCredentials.password}`)
      
      setShowNewClientForm(false)
      await initializeHub()
    } catch (error) {
      alert(`❌ Fout: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClient = async (clientId, updates) => {
    try {
      setLoading(true)
      await db.updateClient(clientId, updates)
      await initializeHub()
      alert('✅ Client bijgewerkt!')
    } catch (error) {
      alert(`❌ Fout: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ===== BULK OPERATIONS =====
  const handleBulkAssign = async (type, itemId) => {
    try {
      setLoading(true)
      
      for (const clientId of selectedClients) {
        if (type === 'workout') {
          await db.assignWorkoutToClient(clientId, itemId)
        } else if (type === 'meal') {
          await db.saveMealPlan(clientId, { template_id: itemId })
        }
      }
      
      alert(`✅ ${type} toegewezen aan ${selectedClients.length} clients!`)
      setSelectedClients([])
      setShowBulkActions(false)
      await initializeHub()
    } catch (error) {
      alert(`❌ Fout: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ===== NOTIFICATIONS =====
  const sendNotification = async (clientId, message) => {
    try {
      await db.sendNotification(clientId, 'coach_message', message)
      alert('✅ Melding verzonden!')
    } catch (error) {
      alert(`❌ Fout: ${error.message}`)
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

  // ===== RENDER HELPERS =====
  const renderClientCard = (client) => {
    const isSelected = selectedClients.includes(client.id)
    
    return (
      <div 
        key={client.id}
        style={{
          background: isSelected 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)' 
            : 'rgba(17, 17, 17, 0.5)',
          backdropFilter: 'blur(10px)',
          border: isSelected ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: isMobile ? '1rem' : '1.5rem',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}
        onClick={() => setSelectedClient(client)}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.4)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h4 style={{
              color: '#fff',
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '600',
              marginBottom: '0.25rem'
            }}>
              {client.first_name} {client.last_name}
            </h4>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: isMobile ? '0.85rem' : '0.9rem'
            }}>
              {client.email}
            </p>
          </div>
          
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              if (isSelected) {
                setSelectedClients(prev => prev.filter(id => id !== client.id))
              } else {
                setSelectedClients(prev => [...prev, client.id])
              }
            }}
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer'
            }}
          />
        </div>
        
        {/* Quick Actions */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <button
            style={{
              flex: 1,
              padding: '0.5rem',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              transition: 'all 0.3s ease'
            }}
            onClick={(e) => {
              e.stopPropagation()
              setQuickAction({ type: 'workout', client })
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Dumbbell size={16} />
            Workout
          </button>
          
          <button
            style={{
              flex: 1,
              padding: '0.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              transition: 'all 0.3s ease'
            }}
            onClick={(e) => {
              e.stopPropagation()
              setQuickAction({ type: 'meal', client })
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Utensils size={16} />
            Meal
          </button>
        </div>
        
        {/* Client Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <span style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              display: 'block',
              marginBottom: '0.25rem'
            }}>
              Doel
            </span>
            <p style={{
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '500'
            }}>
              {client.goal || 'Niet ingesteld'}
            </p>
          </div>
          <div>
            <span style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              display: 'block',
              marginBottom: '0.25rem'
            }}>
              Ervaring
            </span>
            <p style={{
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '500'
            }}>
              {client.experience || 'Onbekend'}
            </p>
          </div>
          <div>
            <span style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              display: 'block',
              marginBottom: '0.25rem'
            }}>
              Dagen/week
            </span>
            <p style={{
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '500'
            }}>
              {client.days_per_week || '?'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderClientDetail = () => {
    if (!selectedClient) return null
    
    return (
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '2rem',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            color: '#fff',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            {selectedClient.first_name} {selectedClient.last_name} - Management
          </h3>
          
          {/* Sub-tabs */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '1rem',
            flexWrap: 'wrap'
          }}>
            {['info', 'workout', 'meals', 'workouts', 'progress', 'accountability', 'bonuses'].map(tab => (
              <button
                key={tab}
                style={{
                  padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                  background: clientDetailTab === tab 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: clientDetailTab === tab 
                    ? '1px solid #10b981'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: clientDetailTab === tab ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: clientDetailTab === tab ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setClientDetailTab(tab)}
                onMouseEnter={(e) => {
                  if (clientDetailTab !== tab) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (clientDetailTab !== tab) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{padding: isMobile ? '1rem' : '1.5rem'}}>
          {clientDetailTab === 'info' && <ClientInfoTab client={selectedClient} onUpdate={handleUpdateClient} isMobile={isMobile} />}
          {clientDetailTab === 'workout' && <ClientWorkoutTab client={selectedClient} schemas={workoutSchemas} db={db} isMobile={isMobile} />}
          {clientDetailTab === 'meals' && <ClientMealsTab client={selectedClient} templates={mealTemplates} db={db} isMobile={isMobile} />}
          {clientDetailTab === 'progress' && <ClientProgressTab client={selectedClient} db={db} />}
          {clientDetailTab === 'workouts' && <WorkoutLogModule client={selectedClient} db={db} />}
          {clientDetailTab === 'accountability' && <ClientAccountabilityTab client={selectedClient} db={db} isMobile={isMobile} />}
          {clientDetailTab === 'bonuses' && <ClientBonusesTab client={selectedClient} db={db} isMobile={isMobile} />}
        </div>
      </div>
    )
  }

  // ===== MAIN RENDER =====
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
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          
          {/* Logo Section */}
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
                margin: 0,
                letterSpacing: '-0.02em',
                display: 'inline-block',
                animation: 'gradientShift 8s ease-in-out infinite'
              }}>
                MY ARC COACH
              </h1>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                fontWeight: '500',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Centraal Management Systeem
              </p>
            </div>
          </div>
          
          {/* Desktop Actions */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {/* Notification Icon */}
              <button style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: 'rgba(255, 255, 255, 0.7)',
                position: 'relative'
              }}>
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    background: '#ef4444',
                    borderRadius: '50%'
                  }} />
                )}
              </button>
              
              {/* User Info */}
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  margin: 0
                }}>
                  Coach: {user?.email}
                </p>
              </div>
              
              {/* Logout Button */}
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
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sliding Menu */}
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
          boxShadow: mobileMenuOpen ? '10px 0 40px rgba(0, 0, 0, 0.5)' : 'none',
          overflowY: 'auto'
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {allNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setMobileMenuOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: activeTab === item.id 
                    ? `linear-gradient(135deg, ${pageThemes[item.id]?.borderActive || 'rgba(16, 185, 129, 0.2)'} 0%, ${pageThemes[item.id]?.borderColor || 'rgba(16, 185, 129, 0.1)'} 100%)`
                    : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === item.id ? `3px solid ${pageThemes[item.id]?.primary || '#10b981'}` : '3px solid transparent',
                  color: activeTab === item.id ? (pageThemes[item.id]?.primary || '#10b981') : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.95rem',
                  fontWeight: activeTab === item.id ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: '8px'
                }}
              >
                <NavIcon 
                  Icon={item.Icon} 
                  size={20} 
                  active={activeTab === item.id}
                  theme={pageThemes[item.id] || pageThemes.overview}
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
              Uitloggen
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
          {/* Desktop Side Navigation */}
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
                {allNavItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      width: '100%',
                      padding: '0.875rem 1rem',
                      marginBottom: '0.25rem',
                      background: activeTab === item.id 
                        ? `linear-gradient(135deg, ${pageThemes[item.id]?.borderActive || 'rgba(16, 185, 129, 0.2)'} 0%, ${pageThemes[item.id]?.borderColor || 'rgba(16, 185, 129, 0.1)'} 100%)`
                        : 'transparent',
                      border: activeTab === item.id 
                        ? `1px solid ${pageThemes[item.id]?.primary || '#10b981'}` 
                        : '1px solid transparent',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      color: activeTab === item.id ? (pageThemes[item.id]?.primary || '#10b981') : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.95rem',
                      fontWeight: activeTab === item.id ? '600' : '500'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== item.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== item.id) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }
                    }}
                  >
                    <NavIcon 
                      Icon={item.Icon} 
                      size={22} 
                      active={activeTab === item.id}
                      theme={pageThemes[item.id] || pageThemes.overview}
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          )}

          {/* Content Area */}
          <div style={{ 
            flex: 1,
            animation: 'fadeIn 0.5s ease'
          }}>
            {/* Loading State */}
            {loading && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  border: '3px solid rgba(16, 185, 129, 0.2)',
                  borderTopColor: '#10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginTop: '1rem',
                  fontSize: '1.1rem'
                }}>
                  Laden...
                </p>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && !loading && (
              <div>
                <h2 style={{
                  color: '#fff',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  marginBottom: '2rem'
                }}>
                  Dashboard Overzicht
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    padding: isMobile ? '1.5rem' : '2rem',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                  }}>
                    <h3 style={{
                      color: '#3b82f6',
                      fontSize: isMobile ? '2rem' : '2.5rem',
                      fontWeight: '700',
                      marginBottom: '0.5rem'
                    }}>
                      {clients.length}
                    </h3>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: isMobile ? '0.9rem' : '1rem'
                    }}>
                      Actieve Cliënten
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    padding: isMobile ? '1.5rem' : '2rem',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                  }}>
                    <h3 style={{
                      color: '#f97316',
                      fontSize: isMobile ? '2rem' : '2.5rem',
                      fontWeight: '700',
                      marginBottom: '0.5rem'
                    }}>
                      {workoutSchemas.length}
                    </h3>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: isMobile ? '0.9rem' : '1rem'
                    }}>
                      Workout Schema's
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: isMobile ? '1.5rem' : '2rem',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                  }}>
                    <h3 style={{
                      color: '#10b981',
                      fontSize: isMobile ? '2rem' : '2.5rem',
                      fontWeight: '700',
                      marginBottom: '0.5rem'
                    }}>
                      {mealTemplates.length}
                    </h3>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: isMobile ? '0.9rem' : '1rem'
                    }}>
                      Meal Templates
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Clients Tab */}
            {activeTab === 'clients' && !loading && (
              <>
                {/* Action Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => setShowNewClientForm(true)}
                      style={{
                        padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
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
                      <Plus size={20} />
                      Nieuwe Client
                    </button>
                    
                    {selectedClients.length > 0 && (
                      <button
                        onClick={() => setShowBulkActions(true)}
                        style={{
                          padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: isMobile ? '0.9rem' : '1rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <CheckSquare size={20} />
                        Bulk Acties ({selectedClients.length})
                      </button>
                    )}
                  </div>
                  
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}>
                    {clients.length} clients totaal
                  </div>
                </div>

                {/* Client Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {clients.map(renderClientCard)}
                </div>

                {/* Client Detail */}
                {renderClientDetail()}
              </>
            )}

            {/* Programs Tab */}
            {activeTab === 'programs' && !loading && (
              <div>
                <h2 style={{
                  color: '#fff',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  marginBottom: '2rem'
                }}>
                  Programma Beheer
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: '1.5rem'
                }}>
                  {/* Workout Schemas */}
                  <div style={{
                    background: 'rgba(17, 17, 17, 0.5)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: isMobile ? '1rem' : '1.5rem',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                  }}>
                    <h3 style={{
                      color: '#fff',
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      Workout Schema's
                    </h3>
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
                      {workoutSchemas.map(schema => (
                        <div key={schema.id} style={{
                          padding: '1rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}>
                          <h4 style={{
                            color: '#fff',
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            marginBottom: '0.25rem'
                          }}>
                            {schema.name}
                          </h4>
                          <p style={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: isMobile ? '0.85rem' : '0.9rem'
                          }}>
                            {schema.primary_goal} - {schema.days_per_week} dagen
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meal Templates */}
                  <div style={{
                    background: 'rgba(17, 17, 17, 0.5)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: isMobile ? '1rem' : '1.5rem',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                  }}>
                    <h3 style={{
                      color: '#fff',
                      fontSize: isMobile ? '1.25rem' : '1.5rem',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      Meal Templates
                    </h3>
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
                      {mealTemplates.map(template => (
                        <div key={template.id} style={{
                          padding: '1rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}>
                          <h4 style={{
                            color: '#fff',
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            marginBottom: '0.25rem'
                          }}>
                            {template.title}
                          </h4>
                          <p style={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: isMobile ? '0.85rem' : '0.9rem'
                          }}>
                            {template.targets?.kcal}kcal - {template.targets?.protein}g eiwit
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs remain the same but wrapped in proper containers */}
            {activeTab === 'coachvids' && (
              <CoachVideoTab clients={clients} db={db} />
            )}

            {activeTab === 'ai-generator' && !loading && (
              <div style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: isMobile ? '1rem' : '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  color: '#fff',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem'
                }}>
                  AI Workout Generator
                </h2>
                <AIGenerator />
              </div>
            )}

            {activeTab === 'calls' && !loading && (
              <div style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: isMobile ? '1rem' : '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  color: '#fff',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem'
                }}>
                  Call Planning & Management
                </h2>
                <CallPlanningTab
                  db={db}
                  clients={clients || []}
                  currentUser={db.currentUser || null}
                />
              </div>
            )}

            {activeTab === 'meal-builder' && !loading && (
              <div style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: isMobile ? '1rem' : '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  color: '#fff',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem'
                }}>
                  Meal Plan Builder
                </h2>
                <CoachMealPlannerDashboard />
              </div>
            )}




{activeTab === 'workout-analytics' && !loading && (
  <div style={{
    background: 'rgba(17, 17, 17, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: isMobile ? '0' : '0', // Component heeft eigen padding
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
  }}>
    <CoachWorkoutAnalytics 
      db={db}
      coachId={user?.id || coachData?.id}
    />
  </div>
)}




{activeTab === 'ai-meals' && !loading && (
  <div style={{
    animation: 'fadeIn 0.5s ease'
  }}>
    <div style={{
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: isMobile ? '16px' : '20px',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      padding: isMobile ? '1.5rem' : '2rem',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <Sparkles size={32} style={{ color: '#8b5cf6' }} />
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            backgroundImage: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0
          }}>
            AI Meal Generator
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '0.875rem' : '1rem',
            marginTop: '0.25rem'
          }}>
            Smart meal planning met exacte porties en macro targeting
          </p>
        </div>
      </div>
      
      <AIMealGenerator 
        db={db}
        clients={clients}
        selectedClient={selectedClient}
        onClientSelect={setSelectedClient}
      />
    </div>
  </div>
)}



            {activeTab === 'progress' && !loading && (
              <div style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: isMobile ? '1rem' : '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  color: '#fff',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem'
                }}>
                  Client Progress Tracking
                </h2>
                <CoachProgressTab />
              </div>
            )}

            {activeTab === 'challenges' && !loading && (
              <div style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: isMobile ? '1rem' : '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  color: '#fff',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem'
                }}>
                  Challenge Builder
                </h2>
                <ChallengeBuilder
                  client={selectedClient}
                  db={db}
                  onSave={(challenge) => {
                    console.log('Challenge created:', challenge)
                  }}
                />
              </div>
            )}

            {activeTab === 'management' && !loading && (
              <div style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: isMobile ? '1rem' : '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <h2 style={{
                  color: '#fff',
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem'
                }}>
                  Client Management
                </h2>
                <ClientManagementCore db={db} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
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
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: activeTab === item.id ? 'translateY(-3px)' : 'translateY(0)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  minWidth: '44px'
                }}
                onTouchStart={(e) => {
                  if (isMobile && activeTab !== item.id) {
                    e.currentTarget.style.transform = 'scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = activeTab === item.id ? 'translateY(-3px)' : 'translateY(0)'
                  }
                }}
              >
                <NavIcon 
                  Icon={item.Icon} 
                  size={26} 
                  active={activeTab === item.id}
                  theme={pageThemes[item.id] || pageThemes.overview}
                />
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Modals */}
      {showNewClientForm && (
        <NewClientModal 
          onClose={() => setShowNewClientForm(false)}
          onSubmit={handleCreateClient}
          isMobile={isMobile}
        />
      )}

      {showBulkActions && (
        <BulkActionsModal
          selectedCount={selectedClients.length}
          schemas={workoutSchemas}
          templates={mealTemplates}
          onAssign={handleBulkAssign}
          onClose={() => setShowBulkActions(false)}
          isMobile={isMobile}
        />
      )}

      {quickAction && (
        <QuickActionModal
          action={quickAction}
          schemas={workoutSchemas}
          templates={mealTemplates}
          db={db}
          onClose={() => setQuickAction(null)}
          isMobile={isMobile}
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
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* Mobile Fixes */
        @media (max-width: 768px) {
          body {
            overflow-x: hidden;
          }
          
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
