// src/modules/productivity/ProductivityHub.jsx
// VERSION 4.0 - Timer state omhoog naar CoachHub via onStartTask prop

import { useState, useEffect } from 'react'
import { LayoutGrid, Lightbulb, Trophy, Bell, Zap, Timer, Target } from 'lucide-react'
import ProductivityService from './ProductivityService'
import ProductivityKanban from './components/kanban/ProductivityKanban'
import ReflectionsHub from './components/reflections/ReflectionsHub'
import WeeklyWinsHub from './components/weekly-wins/WeeklyWinsHub'
import ReflectionModal from './components/reflections/ReflectionModal'
import TimeInsightsHub from './components/time/TimeInsightsHub'
import WeekGoalsManager from './components/WeekGoalsManager'
import FloatingPanel from './components/FloatingPanel'

const TABS = [
  { id: 'kanban',      label: 'Tasks',      icon: LayoutGrid, color: '#10b981' },
  { id: 'reflections', label: 'Reflecties', icon: Lightbulb,  color: '#8b5cf6' },
  { id: 'weekly-wins', label: 'Wins',       icon: Trophy,     color: '#f59e0b' },
  { id: 'tijd',        label: 'Tijd',       icon: Timer,      color: '#3b82f6' }
]

export default function ProductivityHub({ db, isMobile, onStartTask, activeTaskId }) {
  const [activeTab, setActiveTab] = useState('kanban')
  const [productivityService, setProductivityService] = useState(null)
  const [coachId, setCoachId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingReflections, setPendingReflections] = useState([])
  const [showReflectionModal, setShowReflectionModal] = useState(false)
  const [currentReflectionTask, setCurrentReflectionTask] = useState(null)
  const [sections, setSections] = useState([])

  useEffect(() => {
    const init = async () => {
      try {
        const user = await db.getCurrentUser()
        if (user?.id) {
          setCoachId(user.id)
          const service = new ProductivityService(db.supabase)
          setProductivityService(service)
          const pending = await service.getTasksPendingReflection(user.id)
          setPendingReflections(pending)
        }
      } catch (error) {
        console.error('❌ Init ProductivityHub failed:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [db])

  const handleTaskCompleted = (task) => {
    if (task.needs_reflection) {
      setCurrentReflectionTask(task)
      setShowReflectionModal(true)
      setPendingReflections(prev => [...prev, task])
    }
  }

  const handleReflectionSubmit = async (reflectionData) => {
    if (!productivityService || !currentReflectionTask) return
    try {
      await productivityService.saveReflection(currentReflectionTask.id, coachId, reflectionData)
      setPendingReflections(prev => prev.filter(t => t.id !== currentReflectionTask.id))
      setShowReflectionModal(false)
      setCurrentReflectionTask(null)
    } catch (error) {
      console.error('❌ Save reflection failed:', error)
    }
  }

  const handleSkipReflection = async () => {
    if (!productivityService || !currentReflectionTask) return
    try {
      await productivityService.skipReflection(currentReflectionTask.id, coachId)
      setPendingReflections(prev => prev.filter(t => t.id !== currentReflectionTask.id))
      setShowReflectionModal(false)
      setCurrentReflectionTask(null)
    } catch (error) {
      console.error('❌ Skip reflection failed:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', borderRadius: isMobile ? '10px' : '12px' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'phSpin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!productivityService || !coachId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', background: '#0a0a0a', borderRadius: isMobile ? '10px' : '12px', fontSize: '0.8rem' }}>
        Kon productivity service niet laden.
      </div>
    )
  }

  const activeTabConfig = TABS.find(t => t.id === activeTab)

  return (
    <div style={{ background: '#0a0a0a', borderRadius: isMobile ? '10px' : '12px', overflow: 'hidden' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 0 }}>
          <Zap size={14} color="#10b981" />
          <h2 style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '800', color: '#fff', margin: 0 }}>Productivity</h2>
          <span style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {activeTabConfig?.label?.toUpperCase()}
          </span>
        </div>
        {pendingReflections.length > 0 && (
          <button onClick={() => { setCurrentReflectionTask(pendingReflections[0]); setShowReflectionModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '5px', color: '#a78bfa', fontSize: '0.55rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px', flexShrink: 0 }}>
            <Bell size={10} />
            {pendingReflections.length} reflectie{pendingReflections.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* ═══ TAB NAV ═══ */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: isMobile ? '0.5rem 0.25rem' : '0.5rem 0.5rem', background: 'transparent', border: 'none', borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent', color: isActive ? tab.color : 'rgba(255,255,255,0.25)', fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: isActive ? '700' : '500', cursor: 'pointer', transition: 'all 0.15s ease', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '36px', whiteSpace: 'nowrap' }}>
              <Icon size={isMobile ? 12 : 13} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div>
        {activeTab === 'kanban' && (
          <>
            <div style={{
              display: 'flex', justifyContent: 'flex-end',
              padding: isMobile ? '0.5rem 0.75rem 0' : '0.625rem 1rem 0',
            }}>
              <FloatingPanel
                icon={Target}
                label="Doelen deze week"
                accent="#FFD700"
                iconColor="#FFD700"
                isMobile={isMobile}
                align="right"
                panelWidth={isMobile ? 320 : 420}
                panelMaxHeight="75vh"
              >
                <div style={{ padding: '0.5rem 0.65rem' }}>
                  <WeekGoalsManager db={db} coachId={coachId} isMobile={isMobile} />
                </div>
              </FloatingPanel>
            </div>
            <ProductivityKanban
              productivityService={productivityService}
              coachId={coachId}
              db={db}
              isMobile={isMobile}
              onTaskCompleted={handleTaskCompleted}
              onSectionsChange={setSections}
              onStartTask={onStartTask}
              activeTaskId={activeTaskId}
            />
          </>
        )}
        {activeTab === 'reflections' && (
          <ReflectionsHub
            productivityService={productivityService}
            coachId={coachId}
            isMobile={isMobile}
            pendingReflections={pendingReflections}
            onStartReflection={(task) => { setCurrentReflectionTask(task); setShowReflectionModal(true) }}
          />
        )}
        {activeTab === 'weekly-wins' && (
          <WeeklyWinsHub
            productivityService={productivityService}
            coachId={coachId}
            isMobile={isMobile}
            sections={sections}
          />
        )}
        {activeTab === 'tijd' && (
          <TimeInsightsHub
            productivityService={productivityService}
            coachId={coachId}
            isMobile={isMobile}
          />
        )}
      </div>

      {showReflectionModal && currentReflectionTask && (
        <ReflectionModal
          isMobile={isMobile}
          task={currentReflectionTask}
          onClose={() => { setShowReflectionModal(false); setCurrentReflectionTask(null) }}
          onSubmit={handleReflectionSubmit}
          onSkip={handleSkipReflection}
        />
      )}

      <style>{`@keyframes phSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
