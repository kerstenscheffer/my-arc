// src/modules/coach-command-center/components/ClientInsightModal.jsx
// ClientInsightModal.jsx - v8.3
// + onOpenMealPanel prop toegevoegd voor Meal Plan SOP widget
import React, { useState, useRef, useCallback } from 'react'
import { X, Scale, Dumbbell, UtensilsCrossed, ChevronLeft, ChevronRight, ChevronDown, TrendingUp, User, BookOpen, ClipboardCheck, Bell, Download } from 'lucide-react'
import WeightColumn from './insight/WeightColumn'
import WorkoutColumn from './insight/WorkoutColumn'
import MealsColumn from './insight/MealsColumn'
import ClientDataColumn from './insight/ClientDataColumn'
import CheckinsColumn from './insight/CheckinsColumn'
import ClientJourneyTimeline from '../../client-journey/ClientJourneyTimeline'
import CoachingLogModal from './CoachingLogModal'
import CoachingPeriodPanel from './CoachingPeriodPanel'
import SendNotificationModal from '../../notifications/SendNotificationModal'

const COLS = [
  { id: 'weight',  label: 'Gewicht',   color: '#FFD700' },
  { id: 'workout', label: 'Training',  color: '#FFD700' },
  { id: 'meals',   label: 'Voeding',   color: '#FFD700' },
  { id: 'data',    label: 'Gegevens',  color: '#FFD700' },
  { id: 'checkin', label: 'Check-ins', color: '#FFD700' },
]

// Top-level component zodat z'n referentie stabiel blijft tussen renders.
// Voorheen werd ColWrapper binnen ClientInsightModal gedefinieerd; React
// kreeg dan elke render een nieuw functie-type en mounted de hele subtree
// (incl. ClientDataColumn-state als activeSection) opnieuw. Daardoor
// "sprong" de Gegevens-kolom terug naar de Profiel-tab na elke save.
function ColWrapper({ id, children, isLast, collapsed, onToggle }) {
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
        onClick={() => onToggle(id)}
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

export default function ClientInsightModal({ isOpen, onClose, client, isMobile, onNavigatePlan, onNavigateWorkout, db, coachId, onOpenMealPanel, onOpenWorkoutPanel }) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [photoZoom, setPhotoZoom] = useState(false)
  const [showGallery, setShowGallery] = useState(false)  // volledig foto-overzicht (grid)
  const [mobileTab, setMobileTab] = useState('weight')
  const [showHeader, setShowHeader] = useState(false)
  const [splitRatio, setSplitRatio] = useState(60)
  const [isDragging, setIsDragging] = useState(false)
  // Journey-vak standaard ingeklapt; klik op de header klapt'm open.
  const [journeyCollapsed, setJourneyCollapsed] = useState(true)
  // Default-collapse 'data' so the new 5-column layout stays comfortable.
  // Coach can re-expand it via the "Secties"-toggles in the hover header.
  const [collapsed, setCollapsed] = useState(() => new Set(['data']))
  const [showLog, setShowLog] = useState(false)
  const [showNotify, setShowNotify] = useState(false)

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

  // Download een foto naar het apparaat. Via blob (i.p.v. <a download> op een
  // externe URL) omdat Supabase-storage-URLs anders in een tab openen i.p.v.
  // downloaden. Valt bij een fout terug op openen in een nieuw tabblad.
  const downloadPhoto = async (photo, index = 0) => {
    if (!photo?.photo_url) return
    const base = `${(effectiveClient.first_name || 'client')}_${(photo.photo_date || '').slice(0,10) || (index + 1)}`.replace(/[^\w.-]+/g, '-').toLowerCase()
    const ext = (photo.photo_url.split('?')[0].match(/\.(jpg|jpeg|png|webp)$/i)?.[1] || 'jpg').toLowerCase()
    try {
      const res = await fetch(photo.photo_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `myarc-${base}.${ext}`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (e) {
      console.error('Download mislukt, open in tab:', e)
      window.open(photo.photo_url, '_blank')
    }
  }

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

  const mobileTabs = [
    { id: 'weight',  label: 'Gewicht',   icon: Scale,            color: '#FFD700' },
    { id: 'workout', label: 'Training',  icon: Dumbbell,         color: '#FFD700' },
    { id: 'meals',   label: 'Voeding',   icon: UtensilsCrossed,  color: '#FFD700' },
    { id: 'checkin', label: 'Check-in',  icon: ClipboardCheck,   color: '#FFD700' },
    { id: 'data',    label: 'Gegevens',  icon: User,             color: '#FFD700' },
    { id: 'journey', label: 'Journey',   icon: TrendingUp,       color: '#FFD700' },
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
          background: '#0a0a0a', overflow: 'hidden', position: 'relative',
          // iPhone Dynamic Island / notch beschermt anders de header met
          // de X-knop → onbereikbaar voor jou. Safe-area-inset op de
          // container voorkomt dit zonder UI te verschuiven op desktop.
          paddingTop: 'env(safe-area-inset-top, 0px)',
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
                  <button onClick={() => setShowNotify(true)} title="Stuur notificatie" style={{
                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)',
                    borderRadius: '5px', color: '#FFD700',
                    fontSize: '0.55rem', fontWeight: 800, cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '22px',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    <Bell size={10} strokeWidth={2.6} /> Notif
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
                <button onClick={() => setShowNotify(true)} title="Stuur notificatie" style={{
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                  padding: '0.3rem 0.55rem',
                  background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: '6px', color: '#FFD700',
                  fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px',
                  flexShrink: 0,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  <Bell size={11} strokeWidth={2.6} /> Notif
                </button>
                <button onClick={onClose} style={{
                  width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  minHeight: '40px', minWidth: '40px',
                }}>
                  <X size={18} strokeWidth={2.5} />
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

          {/* ═══ COACHING-PERIODE STRIP — boven alle data zichtbaar ═══ */}
          <CoachingPeriodPanel
            client={effectiveClient}
            coachId={coachId}
            isMobile={isMobile}
            onClientUpdate={handleClientUpdate}
          />

          {/* ═══ DESKTOP CONTENT ═══ */}
          {!isMobile && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ height: journeyCollapsed ? 'auto' : `${splitRatio}%`, flex: journeyCollapsed ? 1 : 'none', display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                <ColWrapper id="weight" collapsed={collapsed} onToggle={toggleCollapse}>
                  <WeightColumn
                    client={effectiveClient} weightData={weightData} circumData={circumData}
                    photos={photos} coachingPlan={effectiveClient.coachingPlan} isMobile={false}
                    onPhotoClick={(idx) => { setSelectedPhotoIndex(idx); setPhotoZoom(true) }}
                    onDownloadPhoto={(idx) => downloadPhoto(photos[idx], idx)}
                    onOpenGallery={() => setShowGallery(true)}
                  />
                </ColWrapper>
                <ColWrapper id="workout" collapsed={collapsed} onToggle={toggleCollapse}>
                  <WorkoutColumn
                    db={db} workoutData={workoutData} exerciseProgress={exerciseProgress}
                    isMobile={false} onNavigateWorkout={onNavigateWorkout}
                    client={effectiveClient} onClose={onClose}
                  />
                </ColWrapper>
                <ColWrapper id="meals" collapsed={collapsed} onToggle={toggleCollapse}>
                  <MealsColumn
                    client={effectiveClient} mealData={mealData} isMobile={false}
                    onNavigatePlan={onNavigatePlan} onClose={onClose}
                    db={db} coachId={coachId}
                    onGeneratePlan={(planId) => { onNavigatePlan && onNavigatePlan(effectiveClient.id, planId); onClose() }}
                  />
                </ColWrapper>
                <ColWrapper id="data" collapsed={collapsed} onToggle={toggleCollapse}>
                  <ClientDataColumn
                    client={effectiveClient} db={db} isMobile={false}
                    onClientUpdate={handleClientUpdate}
                  />
                </ColWrapper>
                <ColWrapper id="checkin" isLast collapsed={collapsed} onToggle={toggleCollapse}>
                  <CheckinsColumn
                    client={effectiveClient} db={db} isMobile={false}
                  />
                </ColWrapper>
              </div>

              {/* DRAGGABLE DIVIDER — alleen zichtbaar wanneer journey open is */}
              {!journeyCollapsed && (
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
              )}

              {/* JOURNEY — klikbare header, standaard ingeklapt */}
              <button
                onClick={() => setJourneyCollapsed(c => !c)}
                style={{
                  flexShrink: 0, height: '44px', width: '100%',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0 1.25rem',
                  background: journeyCollapsed ? 'rgba(255,215,0,0.04)' : 'rgba(255,215,0,0.08)',
                  border: 'none', borderTop: '1px solid rgba(255,215,0,0.15)',
                  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <TrendingUp size={15} color="#FFD700" strokeWidth={2.4} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', letterSpacing: '0.01em' }}>Journey</span>
                <span style={{ flex: 1 }} />
                <ChevronDown size={16} color="rgba(255,215,0,0.6)" style={{ transform: journeyCollapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.18s ease' }} />
              </button>

              {!journeyCollapsed && (
                <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
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
              )}
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
                  onDownloadPhoto={(idx) => downloadPhoto(photos[idx], idx)}
                  onOpenGallery={() => setShowGallery(true)}
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
              {mobileTab === 'checkin' && (
                <CheckinsColumn
                  client={effectiveClient} db={db} isMobile={true}
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
      {/* ═══ FOTO-GALERIJ (volledig overzicht) ═══ */}
      {showGallery && photos.length > 0 && (
        <div onClick={() => setShowGallery(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)',
          zIndex: 10450, display: 'flex', flexDirection: 'column', padding: isMobile ? '0.75rem' : '1.5rem'
        }}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1000, margin: '0 auto', flex: 1, minHeight: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
              <div>
                <div style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color: '#fff' }}>Alle foto's</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{effectiveClient.first_name} · {photos.length} foto's</div>
              </div>
              <button onClick={() => setShowGallery(false)} aria-label="Sluiten" style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
                <X size={20} />
              </button>
            </div>
            {/* Grid */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 100 : 140}px, 1fr))`, gap: isMobile ? '0.5rem' : '0.75rem' }}>
                {photos.map((p, idx) => (
                  <div key={p.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div onClick={() => { setSelectedPhotoIndex(idx); setPhotoZoom(true) }} style={{ aspectRatio: '3 / 4', cursor: 'pointer' }}>
                      <img src={p.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '0.35rem 0.45rem' }}>
                      <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(p.photo_date)}</span>
                      <button onClick={(e) => { e.stopPropagation(); downloadPhoto(p, idx) }} title="Download foto" style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 7, background: 'rgba(255,215,0,0.14)', border: '1px solid rgba(255,215,0,0.4)', color: '#FFD700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, touchAction: 'manipulation' }}>
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{formatDate(photos[selectedPhotoIndex]?.photo_date)}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.15rem' }}>{selectedPhotoIndex + 1} / {photos.length}</div>
            </div>
            {/* Downloadknop voor de huidige foto */}
            <button
              onClick={(e) => { e.stopPropagation(); downloadPhoto(photos[selectedPhotoIndex], selectedPhotoIndex) }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', minHeight: 44, padding: '0 1.1rem', borderRadius: 12, background: '#FFD700', color: '#000', border: 'none', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 18px rgba(255,215,0,0.22)', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <Download size={16} /> Download foto
            </button>
          </div>

          {/* Thumbnail-strip — ALLE foto's, klik om te bekijken */}
          {photos.length > 1 && (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', overflowX: 'auto', maxWidth: '92vw', padding: '0.25rem', WebkitOverflowScrolling: 'touch' }}>
              {photos.map((p, idx) => (
                <div key={p.id} onClick={() => setSelectedPhotoIndex(idx)} style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: idx === selectedPhotoIndex ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.15)', opacity: idx === selectedPhotoIndex ? 1 : 0.6 }}>
                  <img src={p.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
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

      <SendNotificationModal
        open={showNotify}
        onClose={() => setShowNotify(false)}
        client={effectiveClient}
        db={db}
        coachId={coachId}
        isMobile={isMobile}
      />

      <style>{`@keyframes insightFadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </>
  )
}
