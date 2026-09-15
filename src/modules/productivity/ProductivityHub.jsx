// src/modules/productivity/ProductivityHub.jsx
// VERSION 4.0 - Timer state omhoog naar CoachHub via onStartTask prop

import { useState, useEffect } from 'react'
import { LayoutGrid, CalendarDays, Lightbulb, Trophy, Timer, Target, ChevronDown, MoreHorizontal } from 'lucide-react'
import ProductivityService from './ProductivityService'
import ProductivityKanban from './components/kanban/ProductivityKanban'
import ReflectionsHub from './components/reflections/ReflectionsHub'
import WeeklyWinsHub from './components/weekly-wins/WeeklyWinsHub'
import ReflectionModal from './components/reflections/ReflectionModal'
import TimeInsightsHub from './components/time/TimeInsightsHub'
import WeekGoalsManager from './components/WeekGoalsManager'
import { Venster, VensterKop } from '../../components/arc-ui'

// Bord en agenda zijn de twee schermen waar je de hele dag in zit; die staan
// als schakelaar in de werkbalk. Reflecties, wins en tijd kijk je af en toe
// na, dus die zitten achter één knop. Zo past alles op één regel.
const EXTRA_TABS = [
  { id: 'reflections', label: 'Reflecties', icon: Lightbulb },
  { id: 'weekly-wins', label: 'Wins',       icon: Trophy },
  { id: 'tijd',        label: 'Tijd',       icon: Timer },
]

export default function ProductivityHub({ db, isMobile, onStartTask, activeTaskId }) {
  const [activeTab, setActiveTab] = useState('kanban')
  // Bord of agenda — hier omhoog gehaald omdat de schakelaar in de werkbalk
  // staat en niet meer in de kanban zelf.
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('productivity_view_mode') || 'kanban' }
    catch { return 'kanban' }
  })
  const [extraOpen, setExtraOpen] = useState(false)
  // Doelen van deze week: geen vaste knop meer in de balk, maar een venster
  // dat je uit het menu opent.
  const [doelenOpen, setDoelenOpen] = useState(false)
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

      {/* ═══ WERKBALK ═══ */}
      {/* Eén regel, verder niets: links de schakelaar bord/agenda, rechts het
          knopje met de rest. De titel en de reflectie-teller stonden daarboven
          en kostten een hele regel zonder iets te doen. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: isMobile ? '0.6rem 0.75rem' : '0.7rem 1rem',
      }}>
        <div style={{
          position: 'relative', display: 'inline-flex',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 999, padding: 3,
        }}>
          <div style={{
            position: 'absolute', top: 3, bottom: 3,
            left: activeTab === 'kanban' && viewMode === 'agenda' ? 'calc(50% + 1.5px)' : 3,
            width: 'calc(50% - 4.5px)',
            background: activeTab === 'kanban' ? '#fff' : 'transparent',
            borderRadius: 999,
            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s ease',
          }} />
          {[
            { id: 'kanban', label: 'Kanban', Icon: LayoutGrid },
            { id: 'agenda', label: 'Agenda', Icon: CalendarDays },
          ].map(k => {
            const aan = activeTab === 'kanban' && viewMode === k.id
            return (
              <button
                key={k.id}
                onClick={() => {
                  setActiveTab('kanban')
                  setViewMode(k.id)
                  try { localStorage.setItem('productivity_view_mode', k.id) } catch { /* private mode */ }
                }}
                style={{
                  position: 'relative', zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  minWidth: isMobile ? 78 : 92, minHeight: 32, padding: '0 0.8rem',
                  background: 'transparent', border: 'none', borderRadius: 999,
                  color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
                  fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: aan ? 900 : 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'color 0.15s ease',
                }}
              >
                <k.Icon size={13} strokeWidth={2.6} />
                {k.label}
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Reflecties, wins en tijd achter één knop. */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setExtraOpen(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              minHeight: 30, padding: '0 0.75rem', borderRadius: 999,
              background: activeTab !== 'kanban' ? '#fff' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${activeTab !== 'kanban' ? '#fff' : 'rgba(255,255,255,0.12)'}`,
              color: activeTab !== 'kanban' ? '#0a0a0a' : 'rgba(255,255,255,0.7)',
              fontSize: '0.68rem', fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {(() => {
              const huidig = EXTRA_TABS.find(t => t.id === activeTab)
              const Icon = huidig?.icon || MoreHorizontal
              return <Icon size={13} strokeWidth={2.6} />
            })()}
            {EXTRA_TABS.find(t => t.id === activeTab)?.label || 'Meer'}
            <ChevronDown size={12} strokeWidth={2.8} style={{ transform: extraOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {extraOpen && (
            <>
              {/* Klik ernaast sluit de lijst. */}
              <div onClick={() => setExtraOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 41,
                minWidth: 170, padding: 5,
                background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              }}>
                {[{ id: 'kanban', label: 'Terug naar taken', icon: LayoutGrid }, ...EXTRA_TABS, { id: 'doelen', label: 'Doelen deze week', icon: Target }].map(t => {
                  const aan = activeTab === t.id
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setExtraOpen(false)
                        if (t.id === 'doelen') setDoelenOpen(true)
                        else setActiveTab(t.id)
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        minHeight: 34, padding: '0 0.6rem', borderRadius: 8,
                        background: aan ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: 'none', color: aan ? '#fff' : 'rgba(255,255,255,0.65)',
                        fontSize: '0.72rem', fontWeight: 800, textAlign: 'left',
                        cursor: 'pointer', fontFamily: 'inherit',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Icon size={13} strokeWidth={2.5} />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div>
        {activeTab === 'kanban' && (
          <ProductivityKanban
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            productivityService={productivityService}
            coachId={coachId}
            db={db}
            isMobile={isMobile}
            onTaskCompleted={handleTaskCompleted}
            onSectionsChange={setSections}
            onStartTask={onStartTask}
            activeTaskId={activeTaskId}
          />
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

      {doelenOpen && (
        <Venster isMobile={isMobile} onClose={() => setDoelenOpen(false)} maxWidth={460}>
          <VensterKop isMobile={isMobile} titel="Doelen deze week" onClose={() => setDoelenOpen(false)} />
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '0.85rem' }}>
            <WeekGoalsManager db={db} coachId={coachId} isMobile={isMobile} />
          </div>
        </Venster>
      )}

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
