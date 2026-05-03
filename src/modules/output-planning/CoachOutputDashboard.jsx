// src/modules/output-planning/CoachOutputDashboard.jsx
// Output Planning System - Main Dashboard Container
// Gold Theme - 4 Tabs: Weekplanning, Problemen, PDFs, Content
// WITH FULLSCREEN MODE + MOBILE OPTIMIZED
// FIXED: Correct props for WeekPlanningView

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  Calendar, 
  Target, 
  FileText, 
  Video,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  CheckCircle,
  Clock,
  TrendingUp,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react'
import OutputService from './OutputService'
import WeekPlanningView from './components/week-planning/WeekPlanningView'
import ProblemsDatabase from './components/ProblemsDatabase'
import PDFLibrary from './components/PDFLibrary'
import ContentLibrary from './components/ContentLibrary'
import { openWeekPlanForPrint } from './WeekPlanPDFGenerator'

// Gold Theme Constants
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  borderActive: 'rgba(255, 215, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)'
}

// Helper: Get Monday of current week
const getMonday = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Helper: Format date for display
const formatWeekRange = (monday) => {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  const options = { day: 'numeric', month: 'short' }
  return `${monday.toLocaleDateString('nl-NL', options)} - ${sunday.toLocaleDateString('nl-NL', options)}`
}

// Helper: Format date for database (local, no timezone issues)
const formatDateForDB = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper: Generate weekDays array from Monday
const generateWeekDays = (monday) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  return days.map((dayOfWeek, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return {
      dayOfWeek,
      date: formatDateForDB(date),
      dayIndex: index
    }
  })
}

export default function CoachOutputDashboard({ db }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // State
  const [activeTab, setActiveTab] = useState('weekplanning')
  const [currentWeekMonday, setCurrentWeekMonday] = useState(getMonday(new Date()))
  const [weekPlan, setWeekPlan] = useState(null)
  const [dayItems, setDayItems] = useState([])
  const [problems, setProblems] = useState([])
  const [pdfs, setPdfs] = useState([])
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Service instance
  const [service] = useState(() => new OutputService(db))
  
  // Generate weekDays from currentWeekMonday
  const weekDays = generateWeekDays(currentWeekMonday)
  
  // ESC key handler for fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isFullscreen])
  
  // Load data on mount and week change
  useEffect(() => {
    loadAllData()
  }, [currentWeekMonday])
  
  const loadAllData = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      // Get or create week plan
      const plan = await service.getOrCreateWeekPlan(
        user.id, 
        formatDateForDB(currentWeekMonday)
      )
      setWeekPlan(plan)
      
      // Load day items if plan exists
      if (plan) {
        const items = await service.getDayItems(plan.id)
        setDayItems(items)
        
        const weekStats = await service.getWeekStats(plan.id)
        setStats(weekStats)
      }
      
      // Load supporting data
      const [problemsData, pdfsData, contentData] = await Promise.all([
        service.getProblems(user.id),
        service.getPDFs(user.id),
        service.getContent(user.id)
      ])
      
      setProblems(problemsData)
      setPdfs(pdfsData)
      setContent(contentData)
      
    } catch (error) {
      console.error('❌ Load data failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Navigation
  const goToPreviousWeek = () => {
    const newMonday = new Date(currentWeekMonday)
    newMonday.setDate(newMonday.getDate() - 7)
    setCurrentWeekMonday(newMonday)
  }
  
  const goToNextWeek = () => {
    const newMonday = new Date(currentWeekMonday)
    newMonday.setDate(newMonday.getDate() + 7)
    setCurrentWeekMonday(newMonday)
  }
  
  const goToCurrentWeek = () => {
    setCurrentWeekMonday(getMonday(new Date()))
  }
  
  // Check if viewing current week
  const isCurrentWeek = formatDateForDB(currentWeekMonday) === formatDateForDB(getMonday(new Date()))
  
  // Tabs configuration
  const tabs = [
    { id: 'weekplanning', label: isMobile ? 'Week' : 'Weekplanning', icon: Calendar },
    { id: 'problemen', label: isMobile ? 'Prob.' : 'Problemen', icon: Target },
    { id: 'pdfs', label: 'PDFs', icon: FileText },
    { id: 'content', label: 'Content', icon: Video }
  ]
  
  // Refresh handlers for child components
  const refreshDayItems = async () => {
    if (weekPlan) {
      const items = await service.getDayItems(weekPlan.id)
      setDayItems(items)
      const weekStats = await service.getWeekStats(weekPlan.id)
      setStats(weekStats)
    }
  }
  
  const refreshProblems = async () => {
    const user = await db.getCurrentUser()
    if (user) {
      const data = await service.getProblems(user.id)
      setProblems(data)
    }
  }
  
  const refreshPDFs = async () => {
    const user = await db.getCurrentUser()
    if (user) {
      const data = await service.getPDFs(user.id)
      setPdfs(data)
    }
  }
  
  const refreshContent = async () => {
    const user = await db.getCurrentUser()
    if (user) {
      const data = await service.getContent(user.id)
      setContent(data)
    }
  }

  // ============================================
  // MAIN CONTENT (used in both normal & fullscreen)
  // ============================================
  const renderContent = (inFullscreen = false) => (
    <>
      {/* Header */}
      <div style={{
        marginBottom: isMobile ? '0.75rem' : '1.5rem'
      }}>
        {/* Title Row - MOBILE OPTIMIZED */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: '1rem'
        }}>
          {/* Title */}
          <h1 style={{
            fontSize: isMobile ? '1.25rem' : '2rem',
            fontWeight: '800',
            color: GOLD.primary,
            margin: 0,
            textShadow: `0 0 20px ${GOLD.glow}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📤 Output
            {inFullscreen && (
              <span style={{
                fontSize: '0.55rem',
                padding: '0.2rem 0.4rem',
                background: GOLD.background,
                border: `1px solid ${GOLD.border}`,
                borderRadius: '4px',
                color: GOLD.primary,
                fontWeight: '600'
              }}>
                FULL
              </span>
            )}
          </h1>
          
          {/* Buttons Row - ALWAYS HORIZONTAL */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            alignItems: 'center',
            justifyContent: isMobile ? 'space-between' : 'flex-end',
            width: isMobile ? '100%' : 'auto'
          }}>
            {/* ESC hint in fullscreen - desktop only */}
            {inFullscreen && !isMobile && (
              <span style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.4)',
                marginRight: '0.5rem'
              }}>
                <kbd style={{
                  padding: '0.1rem 0.3rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '0.65rem'
                }}>ESC</kbd>
              </span>
            )}
            
            {/* PDF Export Button */}
            <button
              onClick={() => openWeekPlanForPrint(dayItems, currentWeekMonday)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                padding: isMobile ? '0.625rem 0.875rem' : '0.625rem 1.25rem',
                background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: '700',
                fontSize: isMobile ? '0.75rem' : '0.9rem',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${GOLD.glow}`,
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                flex: isMobile ? 1 : 'none'
              }}
            >
              <Download size={isMobile ? 16 : 18} />
              PDF
            </button>
            
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!inFullscreen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                padding: isMobile ? '0.625rem 0.875rem' : '0.625rem 1.25rem',
                background: inFullscreen 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: inFullscreen 
                  ? '1px solid rgba(239, 68, 68, 0.4)' 
                  : `1px solid ${GOLD.border}`,
                borderRadius: '8px',
                color: inFullscreen ? '#ef4444' : GOLD.primary,
                fontWeight: '600',
                fontSize: isMobile ? '0.75rem' : '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                flex: isMobile ? 1 : 'none'
              }}
            >
              {inFullscreen ? (
                <>
                  <Minimize2 size={isMobile ? 16 : 18} />
                  {isMobile ? 'Min' : 'Minimaliseer'}
                </>
              ) : (
                <>
                  <Maximize2 size={isMobile ? 16 : 18} />
                  {isMobile ? 'Full' : 'Fullscreen'}
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Week Navigation (only show on weekplanning tab) */}
        {activeTab === 'weekplanning' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '0.375rem' : '1rem',
            padding: isMobile ? '0.625rem' : '1rem',
            background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
            borderRadius: '10px',
            border: `1px solid ${GOLD.border}`
          }}>
            <button
              onClick={goToPreviousWeek}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${GOLD.border}`,
                borderRadius: '8px',
                color: GOLD.primary,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                flexShrink: 0
              }}
            >
              <ChevronLeft size={isMobile ? 18 : 20} />
            </button>
            
            <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '1.125rem',
                fontWeight: '700',
                color: '#fff'
              }}>
                {formatWeekRange(currentWeekMonday)}
              </div>
              {!isCurrentWeek && (
                <button
                  onClick={goToCurrentWeek}
                  style={{
                    marginTop: '0.2rem',
                    padding: '0.2rem 0.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: GOLD.primary,
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Huidige week
                </button>
              )}
            </div>
            
            <button
              onClick={goToNextWeek}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${GOLD.border}`,
                borderRadius: '8px',
                color: GOLD.primary,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                flexShrink: 0
              }}
            >
              <ChevronRight size={isMobile ? 18 : 20} />
            </button>
          </div>
        )}
        
        {/* Quick Stats (only show on weekplanning tab) */}
        {activeTab === 'weekplanning' && stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: isMobile ? '0.375rem' : '0.75rem',
            marginTop: '0.75rem'
          }}>
            {/* Total Items */}
            <div style={{
              padding: isMobile ? '0.5rem' : '1rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.5rem',
                fontWeight: '800',
                color: '#fff'
              }}>
                {stats.total}
              </div>
              <div style={{
                fontSize: isMobile ? '0.6rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '0.125rem'
              }}>
                Totaal
              </div>
            </div>
            
            {/* Completed */}
            <div style={{
              padding: isMobile ? '0.5rem' : '1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.5rem',
                fontWeight: '800',
                color: '#10b981'
              }}>
                {stats.completed}
              </div>
              <div style={{
                fontSize: isMobile ? '0.6rem' : '0.75rem',
                color: 'rgba(16, 185, 129, 0.7)',
                marginTop: '0.125rem'
              }}>
                Done
              </div>
            </div>
            
            {/* Progress */}
            <div style={{
              padding: isMobile ? '0.5rem' : '1rem',
              background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
              borderRadius: '8px',
              border: `1px solid ${GOLD.border}`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.5rem',
                fontWeight: '800',
                color: GOLD.primary
              }}>
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </div>
              <div style={{
                fontSize: isMobile ? '0.6rem' : '0.75rem',
                color: GOLD.primary,
                opacity: 0.7,
                marginTop: '0.125rem'
              }}>
                Progress
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tab Navigation - MOBILE OPTIMIZED */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.25rem' : '0.5rem',
        marginBottom: isMobile ? '0.75rem' : '1.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                padding: isMobile ? '0.5rem 0.625rem' : '0.75rem 1.25rem',
                background: isActive 
                  ? `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive 
                  ? `2px solid ${GOLD.borderActive}` 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: isActive ? GOLD.primary : 'rgba(255, 255, 255, 0.6)',
                fontWeight: isActive ? '700' : '500',
                fontSize: isMobile ? '0.7rem' : '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                flex: isMobile ? 1 : 'none'
              }}
            >
              <Icon size={isMobile ? 14 : 18} />
              {tab.label}
            </button>
          )
        })}
      </div>
      
      {/* Content Area */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: isMobile ? '12px' : '16px',
        border: `1px solid ${GOLD.border}`,
        overflow: 'hidden',
        position: 'relative',
        flex: inFullscreen ? 1 : 'none',
        display: inFullscreen ? 'flex' : 'block',
        flexDirection: 'column'
      }}>
        {/* Top Accent Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
        }} />
        
        {/* Loading State */}
        {loading ? (
          <div style={{
            padding: isMobile ? '2rem' : '3rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: `3px solid ${GOLD.border}`,
              borderTopColor: GOLD.primary,
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: isMobile ? '0.85rem' : '1rem' }}>
              Laden...
            </div>
          </div>
        ) : (
          <div style={{ 
            flex: inFullscreen ? 1 : 'none', 
            overflow: inFullscreen ? 'auto' : 'visible' 
          }}>
            {activeTab === 'weekplanning' && (
             

<WeekPlanningView
  db={db}
  weekDays={weekDays}
  currentWeekMonday={currentWeekMonday}
  goToPreviousWeek={goToPreviousWeek}
  goToNextWeek={goToNextWeek}
  onRefresh={refreshDayItems}
  isMobile={isMobile}
  problems={problems}
  pdfs={pdfs}
  content={content}
/>
            )}
            
            {activeTab === 'problemen' && (
              <ProblemsDatabase
                problems={problems}
                service={service}
                db={db}
                onRefresh={refreshProblems}
              />
            )}
            
            {activeTab === 'pdfs' && (
              <PDFLibrary
                pdfs={pdfs}
                service={service}
                db={db}
                onRefresh={refreshPDFs}
              />
            )}
            
            {activeTab === 'content' && (
              <ContentLibrary
                content={content}
                service={service}
                db={db}
                onRefresh={refreshContent}
              />
            )}
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Normal View */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
        padding: isMobile ? '0.75rem' : '1.5rem',
        boxSizing: 'border-box',
        width: '100%',
        overflowX: 'hidden'
      }}>
        {renderContent(false)}
      </div>
      
      {/* Fullscreen Portal */}
      {isFullscreen && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: isMobile ? '0.75rem' : '1.5rem',
            overflow: 'hidden',
            animation: 'fullscreenIn 0.25s ease',
            boxSizing: 'border-box'
          }}
        >
          {renderContent(true)}
        </div>,
        document.body
      )}
      
      {/* CSS Animations + Mobile Fixes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fullscreenIn {
          from { 
            opacity: 0; 
            transform: scale(0.98); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        /* Hide scrollbar but keep scroll */
        div::-webkit-scrollbar {
          display: none;
        }
        
        /* Prevent horizontal scroll */
        body {
          overflow-x: hidden;
        }
      `}</style>
    </>
  )
}
