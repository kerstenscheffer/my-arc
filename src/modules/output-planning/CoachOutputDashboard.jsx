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
import OutputHub from './components/OutputHub'
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
  const [currentWeekMonday, setCurrentWeekMonday] = useState(getMonday(new Date()))
  const [weekPlan, setWeekPlan] = useState(null)
  const [dayItems, setDayItems] = useState([])
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  // stats still loaded for potential future use, but currently no display.
  const [, setStats] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Bumpt na een actie in de ideeën-sectie (bv. inplannen) zodat de agenda
  // direct herlaadt zonder hard refresh.
  const [agendaRefresh, setAgendaRefresh] = useState(0)
  
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
      
      // Content list is still used by WeekPlanningView for the planning grid.
      const contentData = await service.getContent(user.id)
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
  
  // Refresh handler — week-planning view calls this after edits.
  const refreshDayItems = async () => {
    if (weekPlan) {
      const items = await service.getDayItems(weekPlan.id)
      setDayItems(items)
      const weekStats = await service.getWeekStats(weekPlan.id)
      setStats(weekStats)
    }
  }
  
  // ============================================
  // MAIN CONTENT (used in both normal & fullscreen)
  // ============================================
  const renderContent = (inFullscreen = false) => (
    <>
      {/* Compact header — week-pill + action icons in a single thin row. */}
      <div style={{ marginBottom: isMobile ? '0.5rem' : '0.75rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          {/* Inline week navigator (compact pill) */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 999, padding: 2,
          }}>
            <button
              onClick={goToPreviousWeek}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                touchAction: 'manipulation',
              }}
              title="Vorige week"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToCurrentWeek}
              style={{
                padding: '0 0.65rem', minHeight: 32,
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                background: 'transparent', border: 'none',
                color: isCurrentWeek ? GOLD.primary : '#fff',
                fontSize: '0.78rem', fontWeight: 700,
                cursor: 'pointer', touchAction: 'manipulation',
                whiteSpace: 'nowrap',
              }}
              title={isCurrentWeek ? 'Huidige week' : 'Spring naar huidige week'}
            >
              <Calendar size={13} />
              {formatWeekRange(currentWeekMonday)}
            </button>
            <button
              onClick={goToNextWeek}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                touchAction: 'manipulation',
              }}
              title="Volgende week"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ flex: 1 }} />

          {/* Action icons — compact, icon-only on mobile */}
          <button
            onClick={() => openWeekPlanForPrint(dayItems, currentWeekMonday)}
            title="PDF exporteren"
            style={{
              width: 36, height: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: GOLD.background,
              border: `1px solid ${GOLD.border}`,
              borderRadius: 8, color: GOLD.primary,
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            <Download size={15} />
          </button>
          <button
            onClick={() => setIsFullscreen(!inFullscreen)}
            title={inFullscreen ? 'Minimaliseer' : 'Fullscreen'}
            style={{
              width: 36, height: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: inFullscreen ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
              border: inFullscreen ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: inFullscreen ? '#ef4444' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            {inFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
        
        {/* Big week-nav block + quick stats removed — replaced by the
            compact week-pill that lives in the header row above. */}
      </div>
      
      {/* Tab Navigation - MOBILE OPTIMIZED */}
      {/* Tab-bar removed — Problemen + PDFs are gone; Content + Weekplanning
          are merged into the single unified layout below. */}

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
            // Desktop: het grid scrollt zelf NIET — elke kolom scrollt apart
            // (zie kolom-styles hieronder), zodat de agenda blijft staan terwijl
            // je door de ideeën scrollt. Mobiel blijft normaal mee-scrollen.
            overflow: isMobile ? 'visible' : 'hidden',
            display: 'grid',
            // Mobile: stack (content top, week-planning bottom).
            // Desktop: two columns side-by-side — content left, planning right.
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 5fr) minmax(0, 7fr)',
            gap: isMobile ? '0.75rem' : '1rem',
            padding: isMobile ? '0.5rem' : '0.75rem',
            alignItems: isMobile ? 'stretch' : 'start',
          }}>
            <div style={{
              minWidth: 0,
              // Eigen scroll voor de ideeën-kolom (desktop).
              ...(isMobile ? {} : {
                height: inFullscreen ? '100%' : 'calc(100vh - 130px)',
                overflowY: 'auto',
              }),
            }}>
              <OutputHub db={db} onPlanned={() => setAgendaRefresh(n => n + 1)} />
            </div>
            <div style={{
              minWidth: 0,
              // Vaste agenda-kolom met eigen scroll (desktop) → blijft op z'n plek.
              ...(isMobile ? {} : {
                height: inFullscreen ? '100%' : 'calc(100vh - 130px)',
                overflowY: 'auto',
              }),
            }}>
              <WeekPlanningView
                db={db}
                weekDays={weekDays}
                currentWeekMonday={currentWeekMonday}
                goToPreviousWeek={goToPreviousWeek}
                goToNextWeek={goToNextWeek}
                onRefresh={refreshDayItems}
                refreshSignal={agendaRefresh}
                isMobile={isMobile}
                problems={[]}
                pdfs={[]}
                content={content}
              />
            </div>
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
