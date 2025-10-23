// src/coach/CoachHub.jsx - COMPLETE VERSION WITH WORKOUT BUILDER
import { useState, useEffect } from 'react'
import DatabaseService from '../services/DatabaseService'
import useIsMobile from '../hooks/useIsMobile'
import FunnelManagerDashboard from '../modules/funnel-manager/FunnelManagerDashboard'
import SpotsManager from '../modules/spots/SpotsManager'
import '../services/SpotsService' // Load service

// Component Imports
import CoachCommandCenter from '../modules/coach-command-center/CoachCommandCenter'
import ClientInfoTab from './tabs/ClientInfoTab'
import CoachChallengeHub from './pages/CoachChallengeHub'
import MealPlanGenerator from '../modules/ai-meal-generator/MealPlanGenerator'
import { CallPlanningTab } from '../modules/call-planning/CallPlanningComponents'
import CoachVideoTab from '../modules/videos/CoachVideoTab'
import CoachWorkoutAnalytics from './pages/CoachWorkoutAnalytics'
import ChallengeBuilder from "../modules/challenges/ChallengeBuilder"
import ClientManagementCore from '../modules/client-management/ClientManagementCore'
import ManualWorkoutBuilder from '../modules/manual-workout-builder/ManualWorkoutBuilder'
import LeadManagement from '../modules/lead-management/LeadManagement'



// Lucide Icons imports
import { 
  Home,
  Users,
UserPlus,  
 Shield,
  Share2,
  Sparkles,
  Target,
  Trophy,
  Video,
  Phone,
  Activity,
  LogOut,
  Menu,
  X,
  Bell,
  Globe,  // Added for AppUpdatePanel
  Save,   // Added for AppUpdatePanel
  Dumbbell // Added for ManualWorkoutBuilder
} from 'lucide-react'

// Theme configuration
const pageThemes = {
  overview: {
    primary: '#10b981',
    primaryDark: '#059669',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.1)',
    borderActive: 'rgba(16, 185, 129, 0.2)',
    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)',
    glow: '0 0 60px rgba(16, 185, 129, 0.1)'
  },
  command: {
    primary: '#10b981',
    primaryDark: '#059669',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.1)',
    borderActive: 'rgba(16, 185, 129, 0.2)',
    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)',
    glow: '0 0 60px rgba(16, 185, 129, 0.1)'
  },
  'client-intelligence': {
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
  'challenge-hub': {
    primary: '#dc2626',
    primaryDark: '#991b1b',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.05) 100%)',
    borderColor: 'rgba(220, 38, 38, 0.1)',
    borderActive: 'rgba(220, 38, 38, 0.2)',
    boxShadow: '0 10px 25px rgba(220, 38, 38, 0.25)',
    glow: '0 0 60px rgba(220, 38, 38, 0.1)'
  },
  'ai-meals': {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
    borderColor: 'rgba(139, 92, 246, 0.1)',
    borderActive: 'rgba(139, 92, 246, 0.2)',
    boxShadow: '0 10px 25px rgba(139, 92, 246, 0.25)',
    glow: '0 0 60px rgba(139, 92, 246, 0.1)'
  },
  funnels: {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed', 
    primaryLight: '#a78bfa',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
    borderColor: 'rgba(139, 92, 246, 0.1)',
    borderActive: 'rgba(139, 92, 246, 0.2)', 
    boxShadow: '0 10px 25px rgba(139, 92, 246, 0.25)',
    glow: '0 0 60px rgba(139, 92, 246, 0.1)'
  },
  calls: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderActive: 'rgba(59, 130, 246, 0.2)',
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
    glow: '0 0 60px rgba(59, 130, 246, 0.1)'
  },

leads: {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  backgroundGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
  borderColor: 'rgba(59, 130, 246, 0.1)',
  borderActive: 'rgba(59, 130, 246, 0.2)',
  boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
  glow: '0 0 60px rgba(59, 130, 246, 0.1)'
},



  coachvids: {
    primary: '#ec4899',
    primaryDark: '#db2777',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.05) 100%)',
    borderColor: 'rgba(236, 72, 153, 0.1)',
    borderActive: 'rgba(236, 72, 153, 0.2)',
    boxShadow: '0 10px 25px rgba(236, 72, 153, 0.25)',
    glow: '0 0 60px rgba(236, 72, 153, 0.1)'
  },
  'workout-builder': {
    primary: '#f97316',
    primaryDark: '#ea580c',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
    borderColor: 'rgba(249, 115, 22, 0.1)',
    borderActive: 'rgba(249, 115, 22, 0.2)',
    boxShadow: '0 10px 25px rgba(249, 115, 22, 0.25)',
    glow: '0 0 60px rgba(249, 115, 22, 0.1)'
  },
  'workout-analytics': {
    primary: '#f97316',
    primaryDark: '#ea580c',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    backgroundGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
    borderColor: 'rgba(249, 115, 22, 0.1)',
    borderActive: 'rgba(249, 115, 22, 0.2)',
    boxShadow: '0 10px 25px rgba(249, 115, 22, 0.25)',
    glow: '0 0 60px rgba(249, 115, 22, 0.1)'
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
  }
}

// NavIcon component
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
        style={{ transition: 'all 0.3s ease' }}
      />
    </div>
  )
}

export default function CoachHub() {
  // State Management
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
  
  const db = DatabaseService
  const isMobile = useIsMobile()
  const currentTheme = pageThemes[activeTab] || pageThemes.overview

  // Navigation Items - UPDATED WITH WORKOUT BUILDER
  const allNavItems = [
    { id: 'overview', label: 'Dashboard', Icon: Home },
    { id: 'command', label: 'Command Center', Icon: Shield },
    { id: 'client-intelligence', label: 'Client Intelligence', Icon: Users },
    { id: 'management', label: 'Client Beheer', Icon: Target },
 { id: 'leads', label: 'Lead Management', Icon: UserPlus },   
 { id: 'challenge-hub', label: 'Challenge Hub', Icon: Trophy },
    { id: 'ai-meals', label: 'AI Meals', Icon: Sparkles },
    { id: 'funnels', label: 'Funnel Manager', Icon: Share2 },
    { id: 'workout-builder', label: 'Workout Builder', Icon: Dumbbell },
    { id: 'calls', label: 'Call Planning', Icon: Phone },
    { id: 'coachvids', label: 'Videos', Icon: Video },
    { id: 'workout-analytics', label: 'Workout Analytics', Icon: Activity },
    { id: 'challenges', label: 'Challenges', Icon: Trophy }
  ]

  // Mobile Bottom Nav - First 6
  const bottomNavItems = allNavItems.slice(0, 6)

  // Lifecycle
  useEffect(() => {
    initializeHub()
    loadUser()
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
      
      setClients(clientsData || [])
      setWorkoutSchemas(schemasData || [])
      setMealTemplates(mealsData || [])
    } catch (error) {
      console.error('Failed to initialize hub:', error)
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

  const handleLogout = async () => {
    try {
      await db.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // AppUpdatePanel Component
  function AppUpdatePanel({ db }) {
    const [currentConfig, setCurrentConfig] = useState(null)
    const [newUrl, setNewUrl] = useState('')
    const [version, setVersion] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const isMobile = window.innerWidth <= 768

    useEffect(() => {
      loadCurrentConfig()
    }, [])

    const loadCurrentConfig = async () => {
      const config = await db.getAppConfig()
      if (config) {
        setCurrentConfig(config)
        setNewUrl(config.current_url)
        setVersion(config.version)
        setMessage(config.message)
      }
    }

    const handleUpdate = async () => {
      if (!newUrl || !version) {
        alert('Vul URL en versie in')
        return
      }

      setLoading(true)
      try {
        await db.updateAppConfig(newUrl, version, message)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        await loadCurrentConfig()
      } catch (error) {
        alert('Update failed: ' + error.message)
      }
      setLoading(false)
    }

    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        padding: isMobile ? '1.5rem' : '2rem',
        marginTop: '2rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Globe size={22} color="white" />
          </div>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '700',
              color: '#10b981',
              margin: 0
            }}>
              PWA Update Manager
            </h3>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '0.25rem 0 0 0'
            }}>
              Update de app URL voor alle gebruikers
            </p>
          </div>
        </div>

        {/* Current Status */}
        {currentConfig && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <p style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '0 0 0.5rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Huidige Configuratie
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>URL: </span>
                <span style={{ color: '#10b981', fontSize: '0.9rem' }}>{currentConfig.current_url}</span>
              </div>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>Versie: </span>
                <span style={{ color: '#10b981', fontSize: '0.9rem' }}>{currentConfig.version}</span>
              </div>
            </div>
          </div>
        )}

        {/* Update Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* URL Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Nieuwe URL
            </label>
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://workapp-nieuwe-versie.vercel.app"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(16, 185, 129, 0.5)'
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                e.target.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
            />
          </div>

          {/* Version Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Versie Nummer
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.1"
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(16, 185, 129, 0.5)'
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                e.target.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
            />
          </div>

          {/* Message Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Update Bericht (optioneel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nieuwe features en verbeteringen..."
              rows={3}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(16, 185, 129, 0.5)'
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                e.target.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
            />
          </div>

          {/* Update Button */}
          <button
            onClick={handleUpdate}
            disabled={loading}
            style={{
              background: saved 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : loading 
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: isMobile ? '0.875rem' : '1rem',
              color: 'white',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              opacity: loading ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
            onTouchStart={(e) => {
              if (isMobile && !loading) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <Save size={18} />
            {loading ? 'Updaten...' : saved ? 'Opgeslagen!' : 'Update App URL'}
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
      {/* Header */}
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
          
          {/* Logo */}
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
          zIndex: 101,
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

      {/* Overlay */}
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
            zIndex: 100,
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

            {/* Tab Content */}
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

                {/* Client Spots Panel */}
                <SpotsManager db={db} compact={true} />
                
                {/* PWA Update Panel */}
                <AppUpdatePanel db={db} />
              </div>
            )}

            {activeTab === 'command' && !loading && (
              <CoachCommandCenter 
                db={db} 
                clients={clients || []}
              />
            )}

            {activeTab === 'client-intelligence' && !loading && (
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
                  Client Intelligence System
                </h2>
                <ClientInfoTab
                  client={null}
                  onUpdate={handleUpdateClient}
                  db={db}
                  isMobile={isMobile}
                />
              </div>
            )}



{activeTab === 'leads' && !loading && (
  <div style={{
    background: 'rgba(17, 17, 17, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: isMobile ? '1rem' : '2rem',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
  }}>
    <LeadManagement
      db={db}
      isMobile={isMobile}
      coachId={user?.id}
      user={user}
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

            {activeTab === 'challenge-hub' && !loading && (
              <div style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: isMobile ? '1rem' : '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <CoachChallengeHub
                  db={db}
                  clients={clients || []}
                />
              </div>
            )}

            {activeTab === 'ai-meals' && !loading && (
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
                  marginBottom: '1.5rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  AI Meal Plan Generator
                </h2>
                <MealPlanGenerator 
                  db={db}
                  clients={clients || []}
                  selectedClient={selectedClient}
                  onClientSelect={setSelectedClient}
                />
              </div>
            )}

            {activeTab === 'funnels' && !loading && (
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
                  Funnel Manager & Analytics
                </h2>
                <FunnelManagerDashboard db={db} isMobile={isMobile} />
              </div>
            )}

            {/* NIEUWE WORKOUT BUILDER TAB */}
            {activeTab === 'workout-builder' && !loading && (
              <div style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                padding: 0,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <ManualWorkoutBuilder 
                  db={db}
                  clients={clients || []}
                />
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
                  currentUser={user || null}
                />
              </div>
            )}

            {activeTab === 'coachvids' && (
              <CoachVideoTab clients={clients} db={db} />
            )}

            {activeTab === 'workout-analytics' && !loading && (
              <div style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}>
                <CoachWorkoutAnalytics 
                  db={db}
                  coachId={user?.id}
                />
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
