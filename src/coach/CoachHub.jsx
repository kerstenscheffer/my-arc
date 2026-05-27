// src/coach/CoachHub.jsx - REFACTOR v3.0
// Gold Theme | Top Tabs | Hash Routing | Categorized Dropdown | Compact

import { useState, useEffect, useRef } from 'react'
import DatabaseService from '../services/DatabaseService'
import useIsMobile from '../hooks/useIsMobile'

// Component Imports (ALL PRESERVED)
import CoachCommandCenter from '../modules/coach-command-center/CoachCommandCenter'
import ClientInfoTab from './tabs/ClientInfoTab'
import CoachChallengeHub from './pages/CoachChallengeHub'
import MealPlanGenerator from '../modules/ai-meal-generator/MealPlanGenerator'
import { CallPlanningTab } from '../modules/call-planning/CallPlanningComponents'
import CoachVideoTab from '../modules/videos/CoachVideoTab'
import CoachWorkoutAnalytics from './pages/CoachWorkoutAnalytics'
import ManualWorkoutBuilder from '../modules/manual-workout-builder/ManualWorkoutBuilder'
import LeadManagement from '../modules/lead-management/LeadManagement'
import PlanWizard from '../modules/plan-wizard/PlanWizard'
import CoachCheckinDashboard from '../modules/client-checkin/CoachCheckinDashboard'
import CoachOutputDashboard from '../modules/output-planning/CoachOutputDashboard'
import ProductivityHub from '../modules/productivity/ProductivityHub'
import { FunnelDashboard } from '../modules/qualification-funnel'
import SpotsManager from '../modules/spots/SpotsManager'
import TemplateManager from '../modules/meal-templates/TemplateManager'
import SalesSection from '../modules/sales/SalesSection'
import '../modules/supplements/SupplementPlanService'
import SupplementsTab from '../modules/supplements/SupplementsTab'
import CoachNotificationBell from '../modules/notifications/CoachNotificationBell'
import '../services/SpotsService'
import FloatingTaskTimer from '../modules/productivity/components/kanban/FloatingTaskTimer'
import WeekGoalsBar from './components/WeekGoalsBar'
import StartTaskModal from '../modules/productivity/components/kanban/StartTaskModal'
import ProductivityService from '../modules/productivity/ProductivityService'
import CoachFAQManager from '../modules/faq/CoachFAQManager'
import ResultsHub from '../modules/results/ResultsHub'
import ClientContextPanel from '../modules/ai-meal-generator/tabs/plan-analyzer/ClientContextPanel'
import WorkoutContextPanel from '../modules/coach-command-center/components/WorkoutContextPanel'

import { 
  Home, Wand2, Send, Users, ClipboardCheck, UserPlus, Shield,
  Sparkles, Trophy, Video, Phone, Activity, BarChart3, LogOut,
  Menu, X, ChevronDown, ChevronRight, Dumbbell, Target, Crown, FileText,
  Flame, Globe, Save, Zap, DollarSign, Pill, MoreHorizontal, Settings
} from 'lucide-react'

// ============================================
// GOLD THEME
// ============================================
const G = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  dark: '#B8962E',
  bg: 'rgba(255, 215, 0, 0.08)',
  bgStrong: 'rgba(255, 215, 0, 0.14)',
  border: 'rgba(255, 215, 0, 0.15)',
  borderActive: 'rgba(255, 215, 0, 0.4)',
  text: 'rgba(255, 215, 0, 0.6)',
  glow: '0 0 20px rgba(255, 215, 0, 0.1)'
}

// ============================================
// PRIMARY TABS (Always visible)
// ============================================
const PRIMARY_TABS = [
  { id: 'command', label: 'Command', icon: Shield },
  { id: 'leads', label: 'Leads', icon: UserPlus },
  { id: 'output', label: 'Output', icon: Send }
]

// ============================================
// DROPDOWN CATEGORIES (inside "Meer")
// ============================================
const MORE_CATEGORIES = [
  {
    label: 'Gameplan',
    items: [
      { id: 'productivity', label: 'Productivity', icon: Target },
      { id: 'sales', label: 'Sales', icon: DollarSign }
    ]
  },
  {
    label: 'Acquisition',
    items: [
      { id: 'funnel', label: 'Funnel Analytics', icon: BarChart3 }
    ]
  },
  {
    label: 'Clients',
    items: [
      { id: 'client-intelligence', label: 'Client Intelligence', icon: Users },
      { id: 'checkins', label: 'Check-ins', icon: ClipboardCheck },
      { id: 'challenge-hub', label: 'Challenge Hub', icon: Trophy },
      { id: 'faq', label: 'FAQ Manager', icon: FileText },
      { id: 'results', label: 'Resultaten', icon: Trophy }
    ]
  },
  {
    label: 'Plan Making',
    items: [
      { id: 'plan-wizard', label: 'Plan Wizard', icon: Wand2 },
      { id: 'ai-meals', label: 'AI Meals', icon: Sparkles },
      { id: 'meal-templates', label: 'Meal Templates', icon: FileText },
      { id: 'supplements', label: 'Supplementen', icon: Pill },
      { id: 'workout-builder', label: 'Workout Builder', icon: Dumbbell },
      { id: 'calls', label: 'Call Planning', icon: Phone },
      { id: 'coachvids', label: 'Videos', icon: Video },
      { id: 'workout-analytics', label: 'Workout Analytics', icon: Activity }
    ]
  },
  {
    label: 'Systeem',
    items: [
      { id: 'spots', label: 'Spots Manager', icon: Settings }
    ]
  }
]

// All valid tab IDs for hash routing
const ALL_TAB_IDS = [
  ...PRIMARY_TABS.map(t => t.id),
  ...MORE_CATEGORIES.flatMap(c => c.items.map(i => i.id))
]

// Find label for any tab id
const getTabLabel = (id) => {
  const primary = PRIMARY_TABS.find(t => t.id === id)
  if (primary) return primary.label
  for (const cat of MORE_CATEGORIES) {
    const item = cat.items.find(i => i.id === id)
    if (item) return item.label
  }
  return 'Dashboard'
}

// ============================================
// HASH ROUTING HELPERS
// ============================================
const getHashTab = () => {
  const hash = window.location.hash.replace('#', '')
  const base = hash.split(':')[0]
  return ALL_TAB_IDS.includes(base) ? base : 'command'
}

const setHashTab = (id) => {
  window.location.hash = id
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function CoachHub() {
  const [activeTab, setActiveTab] = useState(getHashTab)
  const [moreOpen, setMoreOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [reviewPlanId, setReviewPlanId] = useState(null)
  
  // Data
  const [clients, setClients] = useState([])
  const [workoutSchemas, setWorkoutSchemas] = useState([])
  const [mealTemplates, setMealTemplates] = useState([])
  const [user, setUser] = useState(null)
  
  // Timer state
  const [timerTask, setTimerTask] = useState(null)
  const [timerStartModal, setTimerStartModal] = useState(null)
  const [timerService, setTimerService] = useState(null)
  const [timerCoachId, setTimerCoachId] = useState(null)
  
  // Client context panel (floating)
  const [mealPanelClientId, setMealPanelClientId] = useState(null)
  const [workoutPanelClientId, setWorkoutPanelClientId] = useState(null)
  
  const db = DatabaseService
  const isMobile = useIsMobile()
  const moreRef = useRef(null)
  
  // ============================================
  // HASH ROUTING — persist tab on refresh
  // ============================================
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace('#', '')
      const parts = hash.split(':')
      const tab = ALL_TAB_IDS.includes(parts[0]) ? parts[0] : 'command'
      setActiveTab(tab)
      if (parts[0] === 'ai-meals' && parts[1]) {
        setReviewPlanId(parts[1])
      }
    }
    
    window.addEventListener('hashchange', parseHash)
    
    // Parse on mount too
    const hash = window.location.hash.replace('#', '')
    const parts = hash.split(':')
    if (parts[0] === 'ai-meals' && parts[1]) {
      setReviewPlanId(parts[1])
    }
    
    if (!window.location.hash) {
      setHashTab('command')
    }
    
    return () => window.removeEventListener('hashchange', parseHash)
  }, [])

  // ============================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // ============================================
  useEffect(() => {
    if (!moreOpen) return
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [moreOpen])

  // ============================================
  // LIFECYCLE
  // ============================================
  useEffect(() => {
    initializeHub()
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const currentUser = await db.getCurrentUser()
      setUser(currentUser)
      const svc = new ProductivityService(db.supabase)
      setTimerService(svc)
      setTimerCoachId(currentUser.id)
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

  const handleLogout = async () => {
    try {
      await db.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleUpdateClient = async (clientId, updates) => {
    try {
      setLoading(true)
      await db.updateClient(clientId, updates)
      await initializeHub()
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // TIMER HANDLERS
  // ============================================
  const handleStartTask = (task) => setTimerStartModal(task)

  const handleConfirmStart = (minutes) => {
    setTimerTask({ task: timerStartModal, sessionMinutes: minutes })
    setTimerStartModal(null)
  }

  const handleTimerStop = async (minutesSpent) => {
    if (minutesSpent >= 1 && timerService && timerCoachId && timerTask) {
      await timerService.logTime(timerCoachId, timerTask.task.id, timerTask.task.title, timerTask.task.category, minutesSpent)
    }
    setTimerTask(null)
  }

  const handleTimerComplete = async (minutesSpent) => {
    if (minutesSpent >= 1 && timerService && timerCoachId && timerTask) {
      await timerService.logTime(timerCoachId, timerTask.task.id, timerTask.task.title, timerTask.task.category, minutesSpent)
    }
    if (timerService && timerTask) {
      await timerService.completeTask(timerTask.task.id)
    }
    setTimerTask(null)
  }

  // ============================================
  // NAVIGATION
  // ============================================
  const navigateTo = (id) => {
    setHashTab(id)
    setActiveTab(id)
    setMoreOpen(false)
  }

  const isPrimaryTab = PRIMARY_TABS.some(t => t.id === activeTab)
  const isMoreTab = !isPrimaryTab

  // ============================================
  // RENDER TAB CONTENT
  // ============================================
  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem',
          minHeight: '50vh'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `2px solid ${G.border}`,
            borderTopColor: G.primary,
            borderRadius: '50%',
            animation: 'chSpin 0.8s linear infinite'
          }} />
        </div>
      )
    }

    switch (activeTab) {
      case 'command':
        return (
          <CoachCommandCenter 
            db={db} 
            clients={clients || []}
            onSelectClient={setSelectedClient}
            setActiveTab={navigateTo}
            onNavigatePlan={(clientId, planId) => {
              const client = clients.find(c => c.id === clientId)
              if (client) setSelectedClient(client)
              setReviewPlanId(planId)
              setTimeout(() => navigateTo('ai-meals'), 50)
            }}
            onNavigateWorkout={(clientId) => {
              const client = clients.find(c => c.id === clientId)
              if (client) setSelectedClient(client)
              setTimeout(() => navigateTo('workout-builder'), 50)
            }}
            onOpenMealPanel={(id) => setMealPanelClientId(id)}
            onOpenWorkoutPanel={(id) => setWorkoutPanelClientId(id)}
          />
        )
      case 'leads':
        return (
          <LeadManagement
            db={db}
            isMobile={isMobile}
            coachId={user?.id}
            user={user}
          />
        )
      case 'output':
        return <CoachOutputDashboard db={db} />
      case 'productivity':
        return <ProductivityHub db={db} isMobile={isMobile} onStartTask={handleStartTask} activeTaskId={timerTask?.task?.id} />
      case 'sales':
        return <SalesSection db={db} />
      case 'funnel':
        return <FunnelDashboard isMobile={isMobile} />
      case 'client-intelligence':
        return (
          <ClientInfoTab
            client={null}
            onUpdate={handleUpdateClient}
            db={db}
            isMobile={isMobile}
          />
        )
      case 'checkins':
        return <CoachCheckinDashboard db={db} clients={clients || []} />
      case 'challenge-hub':
        return <CoachChallengeHub db={db} clients={clients || []} />
      case 'plan-wizard':
        return <PlanWizard db={db} clients={clients || []} />
      case 'ai-meals':
        return (
          <MealPlanGenerator 
            db={db}
            clients={clients || []}
            selectedClient={selectedClient}
            onClientSelect={setSelectedClient}
            conceptPlanId={reviewPlanId}
          />
        )
      case 'meal-templates':
        return <TemplateManager db={db} isMobile={isMobile} />
      case 'supplements':
        return (
          <SupplementsTab
            coach={user}
            clients={clients || []}
            db={db}
          />
        )
      case 'workout-builder':
        return <ManualWorkoutBuilder db={db} clients={clients || []} selectedClient={selectedClient} />
      case 'calls':
        return (
          <CallPlanningTab
            db={db}
            clients={clients || []}
            currentUser={user || null}
          />
        )
      case 'coachvids':
        return <CoachVideoTab clients={clients} db={db} />
      case 'workout-analytics':
        return <CoachWorkoutAnalytics db={db} coachId={user?.id} />
      case 'results':
        return <ResultsHub db={db} clients={clients || []} />
      case 'faq':
        return <CoachFAQManager db={db} />
      case 'spots':
        return <SpotsManager db={db} compact={false} />
      default:
        return (
          <CoachCommandCenter 
            db={db} 
            clients={clients || []}
            onSelectClient={setSelectedClient}
            setActiveTab={navigateTo}
            onNavigatePlan={(clientId, planId) => {
              const client = clients.find(c => c.id === clientId)
              if (client) setSelectedClient(client)
              setReviewPlanId(planId)
              setTimeout(() => navigateTo('ai-meals'), 50)
            }}
            onNavigateWorkout={(clientId) => {
              const client = clients.find(c => c.id === clientId)
              if (client) setSelectedClient(client)
              setTimeout(() => navigateTo('workout-builder'), 50)
            }}
            onOpenMealPanel={(id) => setMealPanelClientId(id)}
            onOpenWorkoutPanel={(id) => setWorkoutPanelClientId(id)}
          />
        )
    }
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#0a0a0a'
    }}>
      {/* ═══ HEADER ═══ */}
      <header style={{
        background: 'rgba(10, 10, 10, 0.97)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${G.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : '0'
      }}>
        {/* Top bar: Logo + Notifications + Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
          borderBottom: `1px solid rgba(255, 255, 255, 0.03)`
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Crown size={isMobile ? 20 : 24} color={G.primary} style={{
              filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.4))'
            }} />
            <span style={{
              fontSize: isMobile ? '1rem' : '1.2rem',
              fontWeight: '800',
              color: G.primary,
              letterSpacing: '-0.03em'
            }}>
              MY ARC
            </span>
          </div>

          {/* Right: Notifications + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CoachNotificationBell db={db} isMobile={isMobile} onNavigate={(planId) => {
              setReviewPlanId(planId)
              navigateTo('ai-meals')
            }} />
            
            <button
              onClick={handleLogout}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                color: 'rgba(239, 68, 68, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* ═══ TAB BAR ═══ */}
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          position: 'relative'
        }}>
          {/* Primary tabs */}
          {PRIMARY_TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => navigateTo(tab.id)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.625rem 0' : '0.75rem 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive 
                    ? `2px solid ${G.primary}` 
                    : '2px solid transparent',
                  color: isActive ? G.primary : 'rgba(255, 255, 255, 0.35)',
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease',
                  letterSpacing: '-0.01em'
                }}
              >
                <Icon size={isMobile ? 14 : 16} />
                {tab.label}
              </button>
            )
          })}

          {/* "Meer" button with dropdown */}
          <div ref={moreRef} style={{ flex: 1, position: 'relative' }}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              style={{
                width: '100%',
                height: '100%',
                padding: isMobile ? '0.625rem 0' : '0.75rem 0',
                background: 'transparent',
                border: 'none',
                borderBottom: isMoreTab 
                  ? `2px solid ${G.primary}` 
                  : '2px solid transparent',
                color: isMoreTab ? G.primary : 'rgba(255, 255, 255, 0.35)',
                fontSize: isMobile ? '0.7rem' : '0.8rem',
                fontWeight: isMoreTab ? '700' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <MoreHorizontal size={isMobile ? 14 : 16} />
              {isMoreTab ? getTabLabel(activeTab) : 'Meer'}
              <ChevronDown 
                size={12} 
                style={{
                  transform: moreOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </button>

            {/* ═══ DROPDOWN MENU ═══ */}
            {moreOpen && (
              <>
                {/* Backdrop */}
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 199
                }} />
                
                {/* Menu */}
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: isMobile ? '-1rem' : 0,
                  width: isMobile ? 'calc(100vw - 1rem)' : '280px',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  background: 'rgba(14, 14, 14, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${G.border}`,
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
                  zIndex: 200,
                  animation: 'chDropIn 0.15s ease'
                }}>
                  {MORE_CATEGORIES.map((cat, catIdx) => (
                    <div key={cat.label}>
                      {/* Category label */}
                      <div style={{
                        padding: '0.5rem 1rem 0.25rem',
                        fontSize: '0.55rem',
                        fontWeight: '700',
                        color: G.text,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        borderTop: catIdx > 0 ? `1px solid rgba(255, 255, 255, 0.04)` : 'none'
                      }}>
                        {cat.label}
                      </div>
                      
                      {/* Items */}
                      {cat.items.map(item => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigateTo(item.id)}
                            style={{
                              width: '100%',
                              padding: '0.625rem 1rem',
                              background: isActive ? G.bgStrong : 'transparent',
                              border: 'none',
                              color: isActive ? G.primary : 'rgba(255, 255, 255, 0.6)',
                              fontSize: '0.825rem',
                              fontWeight: isActive ? '600' : '400',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.625rem',
                              textAlign: 'left',
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Icon size={15} style={{ opacity: isActive ? 1 : 0.5 }} />
                            {item.label}
                            {isActive && (
                              <div style={{
                                marginLeft: 'auto',
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                background: G.primary,
                                boxShadow: `0 0 8px ${G.primary}`
                              }} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                  
                  {/* Logout in dropdown */}
                  <div style={{
                    padding: '0.5rem 0.75rem 0.75rem',
                    borderTop: `1px solid rgba(255, 255, 255, 0.04)`
                  }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        touchAction: 'manipulation'
                      }}
                    >
                      <LogOut size={14} />
                      Uitloggen
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{
        minHeight: 'calc(100vh - 100px)'
      }}>
        {renderTabContent()}
      </main>

      {/* ═══ FLOATING TASK TIMER ═══ */}
      {timerStartModal && (
        <StartTaskModal
          task={timerStartModal}
          isMobile={isMobile}
          onStart={handleConfirmStart}
          onClose={() => setTimerStartModal(null)}
        />
      )}

      {timerTask && (
        <FloatingTaskTimer
          task={timerTask.task}
          sessionMinutes={timerTask.sessionMinutes}
          isMobile={isMobile}
          onComplete={handleTimerComplete}
          onStop={handleTimerStop}
        />
      )}

      {/* Always-on goals overlay — fixed-top strip + tap to expand */}
      <WeekGoalsBar db={db} coachId={user?.id} isMobile={isMobile} />

      {mealPanelClientId && (
        <ClientContextPanel
          db={db}
          isMobile={isMobile}
          clientId={mealPanelClientId}
          isFloating={true}
          onClose={() => setMealPanelClientId(null)}
        />
      )}

      {workoutPanelClientId && (
        <WorkoutContextPanel
          db={db}
          isMobile={isMobile}
          clientId={workoutPanelClientId}
          isFloating={true}
          onClose={() => setWorkoutPanelClientId(null)}
        />
      )}

      {/* ═══ CSS ═══ */}
      <style>{`
        @keyframes chSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes chDropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        body { overflow-x: hidden; }
        input, select, textarea { font-size: 16px !important; }
        button { font-family: inherit; }
      `}</style>
    </div>
  )
}
