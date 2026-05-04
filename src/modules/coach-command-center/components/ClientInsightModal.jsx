// src/modules/coach-command-center/components/ClientInsightModal.jsx
// ClientInsightModal.jsx - v8.3
// + onOpenMealPanel prop toegevoegd voor Meal Plan SOP widget
import React, { useState, useRef, useCallback } from 'react'
import { X, Scale, Dumbbell, UtensilsCrossed, ChevronLeft, ChevronRight, TrendingUp, User, BookOpen } from 'lucide-react'
import WeightColumn from './insight/WeightColumn'
import WorkoutColumn from './insight/WorkoutColumn'
import MealsColumn from './insight/MealsColumn'
import ClientDataColumn from './insight/ClientDataColumn'
import ClientJourneyTimeline from '../../client-journey/ClientJourneyTimeline'
import CoachingLogModal from './CoachingLogModal'

const COLS = [
  { id: 'weight',  label: 'Gewicht',  color: '#FFD700' },
  { id: 'workout', label: 'Training', color: '#f97316' },
  { id: 'meals',   label: 'Voeding',  color: '#10b981' },
  { id: 'data',    label: 'Gegevens', color: '#FFD700' },
]

export default function ClientInsightModal({ isOpen, onClose, client, isMobile, onNavigatePlan, onNavigateWorkout, db, coachId, onOpenMealPanel, onOpenWorkoutPanel }) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [photoZoom, setPhotoZoom] = useState(false)
  const [mobileTab, setMobileTab] = useState('weight')
  const [showHeader, setShowHeader] = useState(false)
  const [splitRatio, setSplitRatio] = useState(60)
  const [isDragging, setIsDragging] = useState(false)
  const [collapsed, setCollapsed] = useState(new Set())
  const [showLog, setShowLog] = useState(false)

  const [localClient, setLocalClient] = useState(null)
  const containerRef = useRef(null)

  if (!isOpen || !client) return null

  const effectiveClient = localClient ? { ...client, ...localClient } : client

  const handleClientUpdate = (updatedFields) => {
    setLocalClient(prev => ({ ...(prev || {}), ...updatedFields }))
  }

  const weightData       = effectiveClient.weightData
  const photoData        = effectiveClient.photoData
  const workoutData      = effectiveClient.workoutData
  const exerciseProgress = effectiveClient.exerciseProgress || {}
  const circumData       = effectiveClient.circumferenceData || { entries: [], latest: null, previous: null }
  const mealData         = effectiveClient.mealData || { plan: null, targets: null, todayMeals: [], todayTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 }, dailyLog: {}, loggingDays: 0, avgCalories: 0 }
  const photos           = photoData?.photos?.filter(p => (p.metadata?.category || 'progress') === 'progress') || []

  const formatDate = (d) => {
    if (!d) return '-'
    const dt = new Date(d)
    return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
  }

  const toggleCollapse = (id) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    const onMove = (ev) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY
      const pct = ((clientY - rect.top) / rect.height) * 100
      setSplitRatio(Math.max(25, Math.min(80, pct)))
    }
    const onEnd = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }, [])

  const ColWrapper = ({ id, children, isLast }) => {
    const col = COLS.find(c => c.id === id)
    const isCollapsed = collapsed.has(id)
    return (
      <div style={{
        display: 'flex', flexDirection: 'row',
        flex: isCollapsed ? '0 0 32px' : 1,
        minWidth: 0,
        borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        transition: 'flex 0.2s ease',
      }}>
        {!isCollapsed && (
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            {children}
          </div>
        )}
        <button
          onClick={() => toggleCollapse(id)}
          title={isCollapsed ? `${col?.label} uitklappen` : `${col?.label} inklappen`}
          style={{
            flexShrink: 0, width: '20px',
            background: isCollapsed ? 'rgba(255,255,255,0.02)' : 'transparent',
            border: 'none',
            borderLeft: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.04)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.5rem 0', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isCollapsed ? (
            <>
              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '0.42rem', fontWeight: '700', color: col?.color || 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', userSelect: 'none', whiteSpace: 'nowrap' }}>{col?.label}</span>
              <ChevronRight size={9} color={col?.color || 'rgba(255,255,255,0.3)'} />
            </>
          ) : (
            <ChevronLeft size={9} color="rgba(255,255,255,0.15)" />
          )}
        </button>
      </div>
    )
  }

  const mobileTabs = [
    { id: 'weight',  label: 'Gewicht',  icon: Scale,           color: '#FFD700' },
    { id: 'workout', label: 'Training', icon: Dumbbell,         color: '#f97316' },
    { id: 'meals',   label: 'Voeding',  icon: UtensilsCrossed, color: '#10b981' },
    { id: 'data',    label: 'Gegevens', icon: User,             color: '#FFD700' },
    { id: 'journey', label: 'Journey',  icon: TrendingUp,       color: '#d4a853' },
  ]

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
        zIndex: 10000, display: 'flex', flexDirection: 'column',
        animation: 'insightFadeIn 0.2s ease'
      }}>
        <div onClick={e => e.stopPropagation()} ref={containerRef} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          maxWidth: isMobile ? '100%' : '1600px',
          width: '100%', margin: '0 auto',
          background: '#0a0a0a', overflow: 'hidden', position: 'relative'
        }}>

          {/* ═══ DESKTOP HOVER HEADER ═══ */}
          {!isMobile && (
            <div
              onMouseEnter={() => setShowHeader(true)}
              onMouseLeave={() => setShowHeader(false)}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: showHeader ? 'auto' : '6px',
                background: showHeader ? 'rgba(10,10,10,0.98)' : 'transparent',
                borderBottom: showHeader ? '1px solid rgba(255,255,255,0.08)' : 'none',
                zIndex: 15, overflow: 'hidden', transition: 'all 0.2s ease'
              }}
            >
              {showHeader && (
                <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#FFD700', letterSpacing: '-0.02em', flexShrink: 0 }}>
                    {effectiveClient.first_name} {effectiveClient.last_name}
                  </span>
                  {effectiveClient.target_weight && (
                    <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                      → {parseFloat(effectiveClient.target_weight).toFixed(1)}kg
                    </span>
                  )}
                  <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                  <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '0.2rem' }}>Secties:</span>
                    {COLS.map(col => {
                      const isCol = collapsed.has(col.id)
                      return (
                        <button key={col.id} onClick={() => toggleCollapse(col.id)} style={{
                          padding: '0.15rem 0.45rem',
                          background: isCol ? 'rgba(255,255,255,0.03)' : `${col.color}15`,
                          border: `1px solid ${isCol ? 'rgba(255,255,255,0.08)' : col.color + '35'}`,
                          borderRadius: '4px', color: isCol ? 'rgba(255,255,255,0.18)' : col.color,
                          fontSize: '0.45rem', fontWeight: '700', cursor: 'pointer',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          transition: 'all 0.15s ease', minHeight: '22px'
                        }}>
                          {isCol ? '+ ' : '— '}{col.label}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setShowLog(true)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '5px', color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.55rem', fontWeight: 700, cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '22px'
                  }}>
                    <BookOpen size={10} /> Log
                  </button>
                  <button onClick={onClose} style={{
                    width: '26px', height: '26px', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {!isMobile && !showHeader && (
            <div onMouseEnter={() => setShowHeader(true)} style={{
              position: 'absolute', top: 0, right: 0, width: '80px', height: '32px', zIndex: 16
            }} />
          )}

          {/* ═══ MOBILE HEADER ═══ */}
          {isMobile && (
            <>
              <div style={{
                padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#FFD700', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {effectiveClient.first_name} {effectiveClient.last_name}
                </span>
                <button onClick={() => setShowLog(true)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                  padding: '0.3rem 0.5rem',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px', color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px',
                  flexShrink: 0
                }}>
                  <BookOpen size={11} /> Log
                </button>
                <button onClick={onClose} style={{
                  width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{
                display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none'
              }}>
                {mobileTabs.map(tab => {
                  const TabIcon = tab.icon
                  const isActive = mobileTab === tab.id
                  return (
                    <button key={tab.id} onClick={() => setMobileTab(tab.id)} style={{
                      flexShrink: 0, flex: 1, padding: '0.5rem 0', minWidth: '52px',
                      background: 'transparent', border: 'none',
                      borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                      color: isActive ? tab.color : 'rgba(255,255,255,0.3)',
                      fontSize: '0.48rem', fontWeight: isActive ? '700' : '500',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '0.15rem',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                    }}>
                      <TabIcon size={11} />{tab.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ═══ DESKTOP CONTENT ═══ */}
          {!isMobile && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ height: `${splitRatio}%`, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                <ColWrapper id="weight">
                  <WeightColumn
                    client={effectiveClient} weightData={weightData} circumData={circumData}
                    photos={photos} coachingPlan={effectiveClient.coachingPlan} isMobile={false}
                    onPhotoClick={(idx) => { setSelectedPhotoIndex(idx); setPhotoZoom(true) }}
                  />
                </ColWrapper>
                <ColWrapper id="workout">
                  <WorkoutColumn
                    db={db} workoutData={workoutData} exerciseProgress={exerciseProgress}
                    isMobile={false} onNavigateWorkout={onNavigateWorkout}
                    client={effectiveClient} onClose={onClose}
                  />
                </ColWrapper>
                <ColWrapper id="meals">
                  <MealsColumn
                    client={effectiveClient} mealData={mealData} isMobile={false}
                    onNavigatePlan={onNavigatePlan} onClose={onClose}
                    db={db} coachId={coachId}
                    onGeneratePlan={(planId) => { onNavigatePlan && onNavigatePlan(effectiveClient.id, planId); onClose() }}
                  />
                </ColWrapper>
                <ColWrapper id="data" isLast>
                  <ClientDataColumn
                    client={effectiveClient} db={db} isMobile={false}
                    onClientUpdate={handleClientUpdate}
                  />
                </ColWrapper>
              </div>

              {/* DRAGGABLE DIVIDER */}
              <div
                onMouseDown={handleDragStart} onTouchStart={handleDragStart}
                style={{
                  height: '6px', flexShrink: 0,
                  background: isDragging ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.03)',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: isDragging ? 'none' : 'background 0.2s ease', touchAction: 'none'
                }}
              >
                <div style={{
                  width: '40px', height: '3px', borderRadius: '2px',
                  background: isDragging ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)',
                  transition: isDragging ? 'none' : 'background 0.2s ease'
                }} />
              </div>

              <div style={{ height: `${100 - splitRatio}%`, overflow: 'auto', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
                {db ? (
                  <ClientJourneyTimeline
                    db={db}
                    clients={[effectiveClient]}
                    selectedClient={effectiveClient}
                    onSelectClient={() => {}}
                    coachId={coachId}
                    isMobile={false}
                    onOpenMealPanel={onOpenMealPanel}
                    onOpenWorkoutPanel={onOpenWorkoutPanel}
                  />
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                    Journey niet beschikbaar
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ MOBILE CONTENT ═══ */}
          {isMobile && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {mobileTab === 'weight' && (
                <WeightColumn
                  client={effectiveClient} weightData={weightData} circumData={circumData}
                  photos={photos} coachingPlan={effectiveClient.coachingPlan} isMobile={true}
                  onPhotoClick={(idx) => { setSelectedPhotoIndex(idx); setPhotoZoom(true) }}
                />
              )}
              {mobileTab === 'workout' && (
                <WorkoutColumn
                  db={db} workoutData={workoutData} exerciseProgress={exerciseProgress}
                  isMobile={true} onNavigateWorkout={onNavigateWorkout}
                  client={effectiveClient} onClose={onClose}
                />
              )}
              {mobileTab === 'meals' && (
                <MealsColumn
                  client={effectiveClient} mealData={mealData} isMobile={true}
                  onNavigatePlan={onNavigatePlan} onClose={onClose}
                  db={db} coachId={coachId}
                  onGeneratePlan={(planId) => { onNavigatePlan && onNavigatePlan(effectiveClient.id, planId); onClose() }}
                />
              )}
              {mobileTab === 'data' && (
                <ClientDataColumn
                  client={effectiveClient} db={db} isMobile={true}
                  onClientUpdate={handleClientUpdate}
                />
              )}
              {mobileTab === 'journey' && db && (
                <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <ClientJourneyTimeline
                    db={db}
                    clients={[effectiveClient]}
                    selectedClient={effectiveClient}
                    onSelectClient={() => {}}
                    coachId={coachId}
                    isMobile={true}
                    onOpenMealPanel={onOpenMealPanel}
                    onOpenWorkoutPanel={onOpenWorkoutPanel}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ PHOTO ZOOM ═══ */}
      {photoZoom && photos.length > 0 && (
        <div onClick={() => setPhotoZoom(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)',
          zIndex: 10500, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '2rem'
        }}>
          <button onClick={() => setPhotoZoom(false)} style={{
            position: 'absolute', top: isMobile ? '0.75rem' : '1.5rem', right: isMobile ? '0.75rem' : '1.5rem',
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10501, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}>
            <X size={18} />
          </button>
          <img onClick={e => e.stopPropagation()} src={photos[selectedPhotoIndex]?.photo_url} alt=""
            style={{ maxWidth: '90vw', maxHeight: '75vh', borderRadius: '8px', objectFit: 'contain' }} />
          {photos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setSelectedPhotoIndex(p => (p - 1 + photos.length) % photos.length) }} style={{ position: 'absolute', left: isMobile ? '0.5rem' : '2rem', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <ChevronLeft size={22} />
              </button>
              <button onClick={e => { e.stopPropagation(); setSelectedPhotoIndex(p => (p + 1) % photos.length) }} style={{ position: 'absolute', right: isMobile ? '0.5rem' : '2rem', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{formatDate(photos[selectedPhotoIndex]?.photo_date)}</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.15rem' }}>{selectedPhotoIndex + 1} / {photos.length}</div>
          </div>
        </div>
      )}

      {/* ═══ COACHING LOG MODAL ═══ */}
      {showLog && (
        <CoachingLogModal
          client={effectiveClient}
          db={db}
          coachId={coachId}
          isMobile={isMobile}
          onClose={() => setShowLog(false)}
        />
      )}

      <style>{`@keyframes insightFadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </>
  )
}
