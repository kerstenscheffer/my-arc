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

  return (
    <div style={{ background: '#0a0a0a', borderRadius: isMobile ? '10px' : '12px', overflow: 'hidden' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1, minWidth: 0 }}>
          <Zap size={14} color="rgba(255,255,255,0.65)" strokeWidth={2.6} />
          <h2 style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.025em' }}>
            Productiviteit
          </h2>
        </div>
        {pendingReflections.length > 0 && (
          <button onClick={() => { setCurrentReflectionTask(pendingReflections[0]); setShowReflectionModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 0.7rem', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 999, color: '#a78bfa', fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 30, flexShrink: 0 }}>
            <Bell size={10} />
            {pendingReflections.length} reflectie{pendingReflections.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* ═══ TABBLADEN ═══ */}
      {/* Schuifknop met een wit blokje op het actieve tabblad — zelfde
          schakelaar als in de log-modal, in plaats van vier gekleurde
          onderstrepingen die om aandacht vochten. */}
      <div style={{ padding: isMobile ? '0.6rem 0.75rem' : '0.7rem 1rem' }}>
        <div style={{
          position: 'relative', display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 999, padding: 3,
        }}>
          <div style={{
            position: 'absolute', top: 3, bottom: 3,
            left: `calc(${(TABS.findIndex(t => t.id === activeTab) * 100) / TABS.length}% + 3px)`,
            width: `calc(${100 / TABS.length}% - 6px)`,
            background: '#fff', borderRadius: 999,
            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
          {TABS.map(tab => {
            const aan = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: 'relative', zIndex: 1,
                  flex: 1, minHeight: 34,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: 'transparent', border: 'none', borderRadius: 999,
                  color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
                  fontSize: isMobile ? '0.68rem' : '0.74rem', fontWeight: aan ? 900 : 800,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'color 0.15s ease',
                }}
              >
                <Icon size={isMobile ? 12 : 13} strokeWidth={2.6} />
                {tab.label}
              </button>
            )
          })}
        </div>
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
