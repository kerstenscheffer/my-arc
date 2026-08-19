// src/coach/CoachHub.jsx - REFACTOR v3.0
// Gold Theme | Top Tabs | Hash Routing | Categorized Dropdown | Compact

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
import PlanWizardHub from '../modules/plan-wizard/PlanWizardHub'
import CoachCheckinDashboard from '../modules/client-checkin/CoachCheckinDashboard'
import CoachOutputDashboard from '../modules/output-planning/CoachOutputDashboard'
import ProductivityHub from '../modules/productivity/ProductivityHub'
import { FunnelDashboard } from '../modules/qualification-funnel'
import SpotsManager from '../modules/spots/SpotsManager'
import TemplateManager from '../modules/meal-templates/TemplateManager'
import IngredientPhotoManager from '../modules/ingredient-photos/IngredientPhotoManager'
import MealGuideManager from '../modules/meal-plan/MealGuideManager'
import SalesSection from '../modules/sales/SalesSection'
import '../modules/supplements/SupplementPlanService'
import SupplementsTab from '../modules/supplements/SupplementsTab'
import CoachNotificationBell from '../modules/notifications/CoachNotificationBell'
import PortalSwitchButton from '../components/PortalSwitchButton'
import IssueNotesWidget from '../components/IssueNotesWidget'
import QuickTodoModal from '../components/QuickTodoModal'
import ContentIdeasWidget from '../components/ContentIdeasWidget'
import ClientProblemsWidget from '../components/ClientProblemsWidget'
import WidgetSidebar from '../components/WidgetSidebar'
import '../services/SpotsService'
import FloatingTaskTimer from '../modules/productivity/components/kanban/FloatingTaskTimer'
import WeekGoalsBar from './components/WeekGoalsBar'
import StartTaskModal from '../modules/productivity/components/kanban/StartTaskModal'
import ProductivityService from '../modules/productivity/ProductivityService'
import CoachFAQManager from '../modules/faq/CoachFAQManager'
import ResultsHub from '../modules/results/ResultsHub'
import ClientContextPanel from '../modules/ai-meal-generator/tabs/plan-analyzer/ClientContextPanel'
import WorkoutContextPanel from '../modules/coach-command-center/components/WorkoutContextPanel'
import CoachAgendaTab from '../modules/client-agenda/CoachAgendaTab'
import LabHub from '../modules/lab/LabHub'

import {
  Home, Wand2, Send, Users, ClipboardCheck, UserPlus, Shield,
  Sparkles, Trophy, Video, Phone, Activity, BarChart3, LogOut,
  Menu, X, ChevronDown, ChevronRight, Dumbbell, Target, Crown, FileText,
  Flame, Globe, Save, Zap, DollarSign, Pill, MoreHorizontal, Settings, Calendar,
  Bell, Bug, Lightbulb, AlertCircle, Image as ImageIcon, FlaskConical,
  Eye, EyeOff, ListTodo, ArrowLeft
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
// De oude inline Meer-dropdown is vervangen door de geportaalde bottom-sheet.
// Vlag op false i.p.v. een kale `false &&` (dat laatste triggert een lint-error).
const SHOW_LEGACY_INLINE_DROPDOWN = false

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
      { id: 'client-agenda', label: 'Client Agenda', icon: Calendar },
      { id: 'plan-wizard', label: 'Plan Wizard', icon: Wand2 },
      { id: 'ai-meals', label: 'AI Meals', icon: Sparkles },
      { id: 'meal-templates', label: 'Meal Templates', icon: FileText },
      { id: 'ingredient-photos', label: "Ingredient Foto's", icon: ImageIcon },
      { id: 'meal-guide', label: 'Voedingsgids', icon: ImageIcon },
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
      { id: 'spots', label: 'Spots Manager', icon: Settings },
      { id: 'lab', label: 'Lab', icon: FlaskConical }
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
  const [navStack, setNavStack] = useState([]) // tab-geschiedenis voor de terug-knop
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

  // WeekGoalsBar reports whether it renders (it hides itself on a week
  // without goals) so we only reserve top padding when it's actually there.
  const [goalsBarVisible, setGoalsBarVisible] = useState(false)

  // Widget sidebar — één van { 'notifications' | 'issues' | 'ideas' | 'problems' | null }
  // tegelijk geopend, plus live counts voor de badge per knop.
  const [widgetOpen, setWidgetOpen] = useState(null)
  const [showTodoModal, setShowTodoModal] = useState(false)
  // Klantmodus: verbergt de coach-only balken (quick-link sidebar + goals-balk)
  // zodat een klant die meekijkt niet alles ziet. Onthouden in localStorage.
  const [clientMode, setClientMode] = useState(() => {
    try { return localStorage.getItem('coachClientMode') === '1' } catch { return false }
  })
  const toggleClientMode = () => setClientMode(v => {
    const next = !v
    try { localStorage.setItem('coachClientMode', next ? '1' : '0') } catch {}
    if (next) setWidgetOpen(null) // sluit open panelen bij verbergen
    return next
  })
  const [widgetCounts, setWidgetCounts] = useState({ notifications: 0, issues: 0, ideas: 0, problems: 0 })
  // Aantal app_issues waar Claude een open vraag/reactie heeft staan — gouden
  // badge op de Issues-knop in de WidgetSidebar.
  const [issuesClaudePending, setIssuesClaudePending] = useState(0)
  const setCount = (key) => (n) => setWidgetCounts(prev => prev[key] === n ? prev : { ...prev, [key]: n })
  
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
  // CLOSE DROPDOWN ON OUTSIDE CLICK — VERWIJDERD
  // ============================================
  // De Meer-dropdown is nu een geportaalde bottom-sheet (createPortal naar
  // document.body) MET een eigen backdrop die op klik sluit. Een document-brede
  // mousedown/touchstart-handler die checkte op `moreRef` werkte averechts: de
  // portal valt buiten moreRef, dus elke tik op een menu-item gold als "buiten"
  // en sloot het menu op touchstart — vóórdat de button-click kon navigeren.
  // Daarom weg; de backdrop regelt het sluiten-bij-klik-buiten.

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
    // Onthoud waar we vandaan kwamen zodat de terug-knop netjes terugkeert
    // (blijft binnen CoachHub, verlaat de app niet).
    if (id !== activeTab) setNavStack(s => [...s, activeTab])
    setHashTab(id)
    setActiveTab(id)
    setMoreOpen(false)
  }

  const goBack = () => {
    if (navStack.length === 0) return
    const prev = navStack[navStack.length - 1]
    setNavStack(s => s.slice(0, -1))
    setHashTab(prev)
    setActiveTab(prev)
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
      case 'client-agenda':
        return (
          <CoachAgendaTab
            db={db}
            clients={clients || []}
            selectedClient={selectedClient}
            onClientSelect={setSelectedClient}
            isMobile={isMobile}
          />
        )
      case 'plan-wizard':
        return <PlanWizardHub db={db} clients={clients || []} />
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
      case 'ingredient-photos':
        return <IngredientPhotoManager db={db} isMobile={isMobile} />
      case 'meal-guide':
        return <MealGuideManager db={db} isMobile={isMobile} />
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
      case 'lab':
        return <LabHub isMobile={isMobile} />
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
      background: '#0a0a0a',
      // Reserve space for the WeekGoalsBar (fixed, top:0, ~32px + safe-area).
      // Without this the bar floats over the header and covers the
      // logout/switch/notification buttons. The bar hides itself when there
      // are no goals this week, so the reservation follows its visibility.
      paddingTop: (!clientMode && goalsBarVisible)
        ? 'calc(32px + env(safe-area-inset-top, 0px))'
        : 'env(safe-area-inset-top, 0px)'
    }}>
      {/* ═══ NOTIFICATIE BEL — bestuurd door WidgetSidebar (geen eigen tab meer) ═══ */}
      <CoachNotificationBell
        db={db}
        isMobile={isMobile}
        onNavigate={(planId) => { setReviewPlanId(planId); navigateTo('ai-meals') }}
        open={widgetOpen === 'notifications'}
        onOpenChange={(o) => setWidgetOpen(o ? 'notifications' : null)}
        onCountChange={setCount('notifications')}
      />

      {/* ═══ HEADER (verborgen — content verplaatst naar floating bel + bottom-nav) ═══ */}
      <header style={{ display: 'none' }}>

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

          {/* Right: alleen notifications — Wissel + Uitlog zitten in de
              bottom-nav. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!clientMode && <CoachNotificationBell db={db} isMobile={isMobile} onNavigate={(planId) => {
              setReviewPlanId(planId)
              navigateTo('ai-meals')
            }} />}
          </div>
        </div>

        {/* ═══ MEER DROPDOWN ═══
            Alleen de "Meer"-trigger blijft over in de top — primary tabs
            zitten in de bottom-nav. De dropdown geeft toegang tot alle
            secundaire tabs (sales, funnel, plan-wizard, ai-meals, etc.). */}
        {!clientMode && (
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          position: 'relative'
        }}>
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

            {/* ═══ OUDE INLINE DROPDOWN — UITGEZET ═══
                De actieve Meer-dropdown is de geportaalde bottom-sheet verderop
                (createPortal → document.body). Deze inline absolute-versie zat
                gevangen in de stacking-context van de header; de portal-backdrop
                (z 2147483646) ving daardoor de kliks op de zichtbare menu-items
                op → "links niet aanklikbaar". Daarom niet renderen. */}
            {SHOW_LEGACY_INLINE_DROPDOWN && (
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
                  // Boven de floating side-widgets (z ~2.1 mld) — anders vangen
                  // die de klikken op dropdown-items rechts in beeld op.
                  zIndex: 2147483647,
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
        )}
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      {/* ═══ TERUG-KNOP ═══ */}
      {/* Zweeft linksboven; keert terug naar de vorige tab. Alleen zichtbaar als
          er iets is om naar terug te gaan (en niet in klantmodus). */}
      {!clientMode && navStack.length > 0 && (
        <button
          onClick={goBack}
          title="Terug"
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            left: 12,
            zIndex: 120,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: isMobile ? '0.5rem 0.7rem' : '0.55rem 0.85rem',
            height: 40,
            background: 'rgba(10,10,10,0.88)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${G.primary}44`,
            borderRadius: 999,
            color: G.primary,
            fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 800,
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.6} />
          Terug
        </button>
      )}

      <main style={{
        minHeight: 'calc(100vh - 100px)',
        // Ruimte onderaan voor de floating bottom-nav (zelfde pattern als
        // ClientDashboard) — anders verdwijnt content onder de balk.
        paddingBottom: '120px',
      }}>
        {renderTabContent()}
      </main>

      {/* ═══ FLOATING BOTTOM NAV ═══ */}
      {/* 7 quick-access knoppen: Command / Leads / Output / Productivity /
          Agenda + acties Wissel / Uitlog. Verborgen in klantmodus (terug via
          de oog-toggle linksonder). */}
      {!clientMode && (<nav style={{
        position: 'fixed',
        bottom: 30,
        left: isMobile ? 10 : '50%',
        right: isMobile ? 10 : 'auto',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        width: isMobile ? 'auto' : 'min(720px, calc(100vw - 32px))',
        background: 'rgba(10, 10, 10, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 22,
        boxShadow: '0 18px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,215,0,0.04)',
        padding: isMobile ? '0.5rem 0.3rem' : '0.6rem 0.5rem',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 2 }}>
          {[
            { id: 'command',        label: 'Command',  Icon: Shield },
            { id: 'leads',          label: 'Leads',    Icon: UserPlus },
            { id: 'output',         label: 'Output',   Icon: Send },
            { id: 'productivity',   label: 'Produc',   Icon: Target },
            { id: 'client-agenda',  label: 'Agenda',   Icon: Calendar },
          ].map(item => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 3,
                  padding: isMobile ? '0.35rem 0.2rem' : '0.45rem 0.3rem',
                  background: isActive ? 'rgba(255,215,0,0.1)' : 'transparent',
                  border: 'none', borderRadius: 14,
                  cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  minHeight: 44, minWidth: 44,
                  transition: 'background 0.15s ease',
                }}
              >
                <item.Icon
                  size={isMobile ? 20 : 22}
                  color={isActive ? G.primary : 'rgba(255,255,255,0.42)'}
                  strokeWidth={isActive ? 2.5 : 1.9}
                />
                <span style={{
                  fontSize: isMobile ? '0.52rem' : '0.58rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? G.primary : 'rgba(255,255,255,0.35)',
                  letterSpacing: '-0.01em', lineHeight: 1,
                }}>
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* Meer — opent een bottom-sheet met alle secundaire tabs */}
          <button
            onClick={() => setMoreOpen(o => !o)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              padding: isMobile ? '0.35rem 0.2rem' : '0.45rem 0.3rem',
              background: (moreOpen || isMoreTab) ? 'rgba(255,215,0,0.1)' : 'transparent',
              border: 'none', borderRadius: 14,
              cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              minHeight: 44, minWidth: 44,
            }}
          >
            <MoreHorizontal
              size={isMobile ? 20 : 22}
              color={(moreOpen || isMoreTab) ? G.primary : 'rgba(255,255,255,0.42)'}
              strokeWidth={(moreOpen || isMoreTab) ? 2.5 : 1.9}
            />
            <span style={{
              fontSize: isMobile ? '0.52rem' : '0.58rem',
              fontWeight: (moreOpen || isMoreTab) ? 800 : 600,
              color: (moreOpen || isMoreTab) ? G.primary : 'rgba(255,255,255,0.35)',
              letterSpacing: '-0.01em', lineHeight: 1,
            }}>
              Meer
            </span>
          </button>

          {/* Wissel (naar client portal) — custom render PortalSwitchButton */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <PortalSwitchButton target="client" db={db} iconOnly />
          </div>

          {/* Uitlog */}
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              padding: isMobile ? '0.35rem 0.2rem' : '0.45rem 0.3rem',
              background: 'transparent',
              border: 'none', borderRadius: 14,
              cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              minHeight: 44, minWidth: 44,
            }}
          >
            <LogOut
              size={isMobile ? 20 : 22}
              color="rgba(239,68,68,0.7)"
              strokeWidth={2}
            />
            <span style={{
              fontSize: isMobile ? '0.52rem' : '0.58rem',
              fontWeight: 700,
              color: 'rgba(239,68,68,0.7)',
              letterSpacing: '-0.01em', lineHeight: 1,
            }}>
              Uitlog
            </span>
          </button>
        </div>
      </nav>)}

      {/* ═══ MEER BOTTOM-SHEET ═══ */}
      {/* Opent boven de bottom-nav als de coach op "Meer" tikt. Bevat
          alle secundaire tabs (sales, funnel, plan-wizard, ai-meals,
          meal-templates, supplements, workout-builder, calls, coachvids,
          workout-analytics, spots, client-intel, checkins, etc.). */}
      {moreOpen && createPortal((
        <>
          <div
            onClick={() => setMoreOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              // Boven de floating side-widgets (z ~2.1 mld) zodat klikken in het
              // Meer-menu niet 'doorvallen' naar die widgets/pagina eronder.
              zIndex: 2147483646,
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: isMobile ? 102 : 110,
            left: isMobile ? 10 : '50%',
            right: isMobile ? 10 : 'auto',
            transform: isMobile ? 'none' : 'translateX(-50%)',
            width: isMobile ? 'auto' : 'min(720px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            background: 'rgba(10, 10, 10, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 22,
            boxShadow: '0 -18px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.04)',
            zIndex: 2147483647,
          }}>
            {MORE_CATEGORIES.map((cat, catIdx) => (
              <div key={cat.label}>
                <div style={{
                  padding: '0.55rem 1.1rem 0.35rem',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  color: G.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  borderTop: catIdx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  {cat.label}
                </div>
                {cat.items.map(item => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => { navigateTo(item.id); setMoreOpen(false) }}
                      style={{
                        width: '100%',
                        padding: '0.7rem 1.1rem',
                        background: isActive ? G.bgStrong : 'transparent',
                        border: 'none',
                        color: isActive ? G.primary : 'rgba(255,255,255,0.7)',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.7rem',
                        textAlign: 'left',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Icon size={16} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }} />
                      {item.label}
                      {isActive && (
                        <div style={{
                          marginLeft: 'auto',
                          width: 6, height: 6, borderRadius: '50%',
                          background: G.primary,
                          boxShadow: `0 0 8px ${G.primary}`,
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      ), document.body)}

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

      {/* Goals overlay — fixed-top strip + tap to expand. Verbergt zichzelf
          als er deze week geen doelen zijn; verborgen in klantmodus. */}
      {!clientMode && (
        <WeekGoalsBar
          db={db}
          coachId={user?.id}
          isMobile={isMobile}
          onVisibleChange={setGoalsBarVisible}
        />
      )}

      {/* Issues / ideas / klant-pijnpunten — allen bestuurd via WidgetSidebar.
          De widgets zelf renderen alleen nog hun slide-out panel; de quick-
          access knop staat in de sidebar onderaan. */}
      <IssueNotesWidget
        db={db}
        coachId={user?.id}
        open={widgetOpen === 'issues'}
        onOpenChange={(o) => setWidgetOpen(o ? 'issues' : null)}
        onCountChange={setCount('issues')}
        onClaudePendingChange={setIssuesClaudePending}
      />
      <ContentIdeasWidget
        db={db}
        coachId={user?.id}
        open={widgetOpen === 'ideas'}
        onOpenChange={(o) => setWidgetOpen(o ? 'ideas' : null)}
        onCountChange={setCount('ideas')}
      />
      <ClientProblemsWidget
        db={db}
        coachId={user?.id}
        open={widgetOpen === 'problems'}
        onOpenChange={(o) => setWidgetOpen(o ? 'problems' : null)}
        onCountChange={setCount('problems')}
      />

      {/* Klantmodus-toggle — altijd zichtbaar (klein, links onderin) zodat je
          de coach-only balken kunt verbergen als een klant meekijkt. */}
      <button
        onClick={toggleClientMode}
        title={clientMode ? 'Klantmodus uit — toon balken' : 'Klantmodus aan — verberg balken (issues, quick-links, goals)'}
        style={{
          position: 'fixed', left: isMobile ? 10 : 14, bottom: isMobile ? 74 : 18,
          zIndex: 2147483200,
          width: 40, height: 40, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: clientMode ? 'rgba(16,185,129,0.18)' : 'rgba(0,0,0,0.55)',
          border: `1px solid ${clientMode ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'}`,
          color: clientMode ? '#34d399' : 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(8px)', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {clientMode ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>

      {/* Eén verticale balk rechts met snel-knoppen voor alle widgets.
          Verborgen in klantmodus. */}
      {!clientMode && <WidgetSidebar
        isMobile={isMobile}
        buttons={[
          {
            id: 'notifications', label: 'Meldingen', Icon: Bell, color: G.primary,
            active: widgetOpen === 'notifications', badge: widgetCounts.notifications,
            onClick: () => setWidgetOpen(o => o === 'notifications' ? null : 'notifications'),
          },
          {
            id: 'todo', label: 'To-do', Icon: ListTodo, color: G.primary,
            active: showTodoModal,
            onClick: () => setShowTodoModal(true),
          },
          {
            id: 'issues', label: 'Issues', Icon: Bug, color: '#fca5a5',
            active: widgetOpen === 'issues', badge: widgetCounts.issues,
            goldBadge: issuesClaudePending,
            onClick: () => setWidgetOpen(o => o === 'issues' ? null : 'issues'),
          },
          {
            id: 'ideas', label: 'Ideeën', Icon: Lightbulb, color: '#c4b5fd',
            active: widgetOpen === 'ideas', badge: widgetCounts.ideas,
            onClick: () => setWidgetOpen(o => o === 'ideas' ? null : 'ideas'),
          },
          {
            id: 'problems', label: 'Problemen', Icon: AlertCircle, color: '#fca5a5',
            active: widgetOpen === 'problems', badge: widgetCounts.problems,
            onClick: () => setWidgetOpen(o => o === 'problems' ? null : 'problems'),
          },
        ]}
      />}

      {showTodoModal && (
        <QuickTodoModal
          db={db}
          coachId={user?.id}
          isMobile={isMobile}
          onOpenProductivity={() => navigateTo('productivity')}
          onClose={() => setShowTodoModal(false)}
          onStartTask={handleStartTask}
          activeTaskId={timerTask?.task?.id}
        />
      )}

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
