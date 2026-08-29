// src/modules/coach-command-center/components/ClientInsightModal.jsx
// ClientInsightModal.jsx - v8.3
// + onOpenMealPanel prop toegevoegd voor Meal Plan SOP widget
import React, { useState, useRef } from 'react'
import { X, Scale, Dumbbell, UtensilsCrossed, ChevronLeft, ChevronRight, ChevronDown, TrendingUp, User, BookOpen, ClipboardCheck, Bell, Download, ExternalLink } from 'lucide-react'
import WeightColumn from './insight/WeightColumn'
import WorkoutColumn from './insight/WorkoutColumn'
import MealsColumn from './insight/MealsColumn'
import ClientDataColumn from './insight/ClientDataColumn'
import CheckinsColumn from './insight/CheckinsColumn'
import ClientJourneyTimeline from '../../client-journey/ClientJourneyTimeline'
import CoachingLogModal from './CoachingLogModal'
import CoachingPeriodPanel from './CoachingPeriodPanel'
import SendNotificationModal from '../../notifications/SendNotificationModal'
import IntakeSummaryModal from '../../../coach/tabs/client-info/IntakeSummaryModal'

// Kopknop: kaal icoon, geen vak eromheen. Vier omkaderde knoppen met tekst
// namen de halve kopregel in; als icoon met tooltip is het even duidelijk en
// veel rustiger. Raakvlak blijft 32px zodat het op een telefoon te tikken is.
const kopKnop = (primair = false) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, padding: 0,
  background: 'none', border: 'none',
  color: primair ? '#fff' : 'rgba(255,255,255,0.55)',
  cursor: 'pointer', flexShrink: 0,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})


// Groepeer de foto's per MAAND (relatief vanaf de eerste foto) en binnen elke
// maand per DAG, zodat foto's van dezelfde dag (voor/zij/achter) bij elkaar
// staan. Elke item houdt z'n originele index in de `photos`-array vast, zodat
// klikken de juiste foto in de zoom opent.
function groupPhotosByMonthAndDay(photos) {
  if (!photos?.length) return []
  const items = photos
    .map((p, idx) => ({ p, idx, d: p.photo_date ? new Date(p.photo_date) : null }))
    .filter(x => x.d && !isNaN(x.d))
    .sort((a, b) => a.d - b.d) // oud → nieuw
  if (!items.length) return []
  const first = items[0].d
  const monthOf = (d) =>
    (d.getFullYear() - first.getFullYear()) * 12 + (d.getMonth() - first.getMonth())
    - (d.getDate() < first.getDate() ? 1 : 0) + 1
  const months = []
  const byMonth = new Map()
  for (const x of items) {
    const m = monthOf(x.d)
    if (!byMonth.has(m)) { const mo = { month: m, days: [], _map: new Map() }; byMonth.set(m, mo); months.push(mo) }
    const mo = byMonth.get(m)
    const dayKey = x.p.photo_date.slice(0, 10)
    if (!mo._map.has(dayKey)) { const day = { date: dayKey, items: [] }; mo._map.set(dayKey, day); mo.days.push(day) }
    mo._map.get(dayKey).items.push(x)
  }
  return months
}

export default function ClientInsightModal({ isOpen, onClose, client, isMobile, onNavigatePlan, onNavigateWorkout, db, coachId, onOpenMealPanel, onOpenWorkoutPanel, onSwitchToClientView }) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [photoZoom, setPhotoZoom] = useState(false)
  const [showGallery, setShowGallery] = useState(false)  // volledig foto-overzicht (grid)
  const [mobileTab, setMobileTab] = useState('weight')
  const [showLog, setShowLog] = useState(false)
  const [showNotify, setShowNotify] = useState(false)
  const [showIntake, setShowIntake] = useState(false)

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


  // Eén lijst voor de rail (desktop) én de tabbalk (mobiel), zodat ze niet
  // uit elkaar kunnen lopen. Journey is nu een gewone sectie i.p.v. een
  // aparte lade onderaan.
  const SECTIES = [
    { id: 'weight',  label: 'Gewicht',  icon: Scale },
    { id: 'workout', label: 'Training', icon: Dumbbell },
    { id: 'meals',   label: 'Voeding',  icon: UtensilsCrossed },
    { id: 'data',    label: 'Gegevens', icon: User },
    { id: 'checkin', label: 'Check-in', icon: ClipboardCheck },
    { id: 'journey', label: 'Journey',  icon: TrendingUp },
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
          // Volle breedte. Stond op max 1600px omdat er vijf kolommen naast
          // elkaar pasten; met de rail + één paneel is dat alleen nog
          // weggegooid scherm.
          width: '100%',
          background: '#0a0a0a', overflow: 'hidden', position: 'relative',
          // iPhone Dynamic Island / notch beschermt anders de header met
          // de X-knop → onbereikbaar voor jou. Safe-area-inset op de
          // container voorkomt dit zonder UI te verschuiven op desktop.
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}>

          {/* ═══ DESKTOP HEADER — altijd zichtbaar ═══ */}
          {/* Zat verstopt achter een 6px hover-strip bovenaan: je moest weten
              dát 'ie er was. Nu gewoon een vaste balk in de flow. */}
          {!isMobile && (
            <div
              style={{
                flexShrink: 0,
                background: 'rgba(10,10,10,0.98)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                zIndex: 15,
              }}
            >
              <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', flexShrink: 0 }}>
                    {effectiveClient.first_name} {effectiveClient.last_name}
                  </span>
                  {effectiveClient.target_weight && (
                    <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                      → {parseFloat(effectiveClient.target_weight).toFixed(1)}kg
                    </span>
                  )}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setShowIntake(true)} title="Bekijk intake" style={kopKnop()}>
                    <ClipboardCheck size={17} />
                  </button>
                  <button onClick={() => setShowLog(true)} title="Logboek" style={kopKnop()}>
                    <BookOpen size={17} />
                  </button>
                  <button onClick={() => setShowNotify(true)} title="Stuur notificatie" style={kopKnop(true)}>
                    <Bell size={17} strokeWidth={2.4} />
                  </button>
                  {onSwitchToClientView && (
                    <button onClick={() => { onClose(); onSwitchToClientView(effectiveClient) }} title="Bekijk als client" style={kopKnop()}>
                      <ExternalLink size={17} />
                    </button>
                  )}
                  <button onClick={onClose} title="Sluiten" style={kopKnop()}>
                    <X size={17} />
                  </button>
              </div>
            </div>
          )}

          {/* ═══ MOBILE HEADER ═══ */}
          {isMobile && (
            <>
              {/* Vijf knoppen van 36-40px plus 0,5rem tussenruimte vraten op een
                  telefoon van 360px de hele regel op; de naam bleef als drie
                  letters met puntjes over. Nu 34px met minimale tussenruimte,
                  zodat de naam zelf ook nog leesbaar is. */}
              <div style={{
                padding: '0.4rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: '0.1rem', flexShrink: 0
              }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.3rem' }}>
                  {effectiveClient.first_name} {effectiveClient.last_name}
                </span>
                <button onClick={() => setShowIntake(true)} title="Bekijk intake" style={{ ...kopKnop(), width: 34, height: 34 }}>
                  <ClipboardCheck size={17} />
                </button>
                <button onClick={() => setShowLog(true)} title="Logboek" style={{ ...kopKnop(), width: 34, height: 34 }}>
                  <BookOpen size={17} />
                </button>
                <button onClick={() => setShowNotify(true)} title="Stuur notificatie" style={{ ...kopKnop(true), width: 34, height: 34 }}>
                  <Bell size={17} strokeWidth={2.4} />
                </button>
                {onSwitchToClientView && (
                  <button onClick={() => { onClose(); onSwitchToClientView(effectiveClient) }} title="Bekijk als client" style={{ ...kopKnop(), width: 34, height: 34 }}>
                    <ExternalLink size={17} />
                  </button>
                )}
                <button onClick={onClose} title="Sluiten" style={{ ...kopKnop(), width: 36, height: 36 }}>
                  <X size={19} strokeWidth={2.4} />
                </button>
              </div>
              <div style={{
                display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none'
              }}>
                {SECTIES.map(tab => {
                  const TabIcon = tab.icon
                  const isActive = mobileTab === tab.id
                  return (
                    <button key={tab.id} onClick={() => setMobileTab(tab.id)} style={{
                      flexShrink: 0, flex: 1, padding: '0.6rem 0', minWidth: '56px',
                      background: 'transparent', border: 'none',
                      borderBottom: isActive ? '2px solid #fff' : '2px solid transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                      fontSize: '0.68rem', fontWeight: isActive ? 900 : 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '0.15rem',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                    }}>
                      <TabIcon size={13} />{tab.label}
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

          {/* ═══ DESKTOP CONTENT — rail links, één paneel rechts ═══ */}
          {/* Voorheen stonden alle vijf kolommen tegelijk naast elkaar, elk
              inklapbaar, met een sleepbare splitter en Journey als lade
              eronder. Dat gaf vijf smalle kokers en drie manieren om iets te
              openen. Nu: één sectie tegelijk, volle breedte, gekozen via de
              rail — zelfde patroon als de Plan Analyzer. */}
          {!isMobile && (
            <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

              {/* Rail — smal, iconen boven het label. */}
              <div style={{
                width: 78, flexShrink: 0, display: 'flex', flexDirection: 'column',
                gap: 4, padding: '0.6rem 0.4rem', overflowY: 'auto',
                borderRight: '1px solid rgba(255,255,255,0.07)',
              }}>
                {SECTIES.map(sec => {
                  const Icon = sec.icon
                  const aan = mobileTab === sec.id
                  return (
                    <button key={sec.id} onClick={() => setMobileTab(sec.id)} title={sec.label}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        padding: '0.55rem 0.2rem', borderRadius: 10, cursor: 'pointer',
                        background: aan ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: `1px solid ${aan ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                        color: aan ? '#fff' : 'rgba(255,255,255,0.45)',
                        fontFamily: 'inherit', touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                      }}>
                      <Icon size={17} strokeWidth={aan ? 2.4 : 2} />
                      <span style={{ fontSize: '0.6rem', fontWeight: aan ? 900 : 700, letterSpacing: '-0.01em' }}>{sec.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Paneel — de gekozen sectie over de volle breedte. */}
              <div style={{ flex: 1, minWidth: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {mobileTab === 'weight' && (
                  <WeightColumn
                    client={effectiveClient} weightData={weightData} circumData={circumData}
                    photos={photos} coachingPlan={effectiveClient.coachingPlan} isMobile={false}
                    onPhotoClick={(idx) => { setSelectedPhotoIndex(idx); setPhotoZoom(true) }}
                    onDownloadPhoto={(idx) => downloadPhoto(photos[idx], idx)}
                    onOpenGallery={() => setShowGallery(true)}
                  />
                )}
                {mobileTab === 'workout' && (
                  <WorkoutColumn
                    db={db} workoutData={workoutData} exerciseProgress={exerciseProgress}
                    isMobile={false} onNavigateWorkout={onNavigateWorkout}
                    client={effectiveClient} onClose={onClose}
                  />
                )}
                {mobileTab === 'meals' && (
                  <MealsColumn
                    client={effectiveClient} mealData={mealData} isMobile={false}
                    onNavigatePlan={onNavigatePlan} onClose={onClose}
                    db={db} coachId={coachId}
                    onGeneratePlan={(planId) => { onNavigatePlan && onNavigatePlan(effectiveClient.id, planId); onClose() }}
                  />
                )}
                {mobileTab === 'data' && (
                  <ClientDataColumn
                    client={effectiveClient} db={db} isMobile={false}
                    onClientUpdate={handleClientUpdate}
                  />
                )}
                {mobileTab === 'checkin' && (
                  <CheckinsColumn client={effectiveClient} db={db} isMobile={false} />
                )}
                {mobileTab === 'journey' && (
                  db ? (
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
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* ═══ MOBILE CONTENT ═══ */}
          {isMobile && (
            // Home-indicator van de iPhone dekte anders de onderste regel af.
            <div style={{ flex: 1, overflow: 'hidden', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
            {/* Grid — per maand (vanaf eerste foto), binnen maand per dag gegroepeerd */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {groupPhotosByMonthAndDay(photos).map(mo => (
                <div key={mo.month} style={{ marginBottom: '1.5rem' }}>
                  {/* Maand-kop */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 0.75rem', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '0.35rem 0', zIndex: 1 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fff' }}>Maand {mo.month}</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
                  </div>
                  {/* Dag-clusters */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {mo.days.map(day => (
                      <div key={day.date}>
                        <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: '0.4rem' }}>{formatDate(day.date)}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 100 : 140}px, 1fr))`, gap: isMobile ? '0.5rem' : '0.75rem' }}>
                          {day.items.map(({ p, idx }) => (
                            <div key={p.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div onClick={() => { setSelectedPhotoIndex(idx); setPhotoZoom(true) }} style={{ aspectRatio: '3 / 4', cursor: 'pointer' }}>
                                <img src={p.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '0.35rem 0.45rem' }}>
                                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.photo_type || 'foto'}</span>
                                <button onClick={(e) => { e.stopPropagation(); downloadPhoto(p, idx) }} title="Download foto" style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, touchAction: 'manipulation' }}>
                                  <Download size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', minHeight: 44, padding: '0 1.1rem', borderRadius: 12, background: '#fff', color: '#000', border: 'none', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <Download size={16} /> Download foto
            </button>
          </div>

          {/* Thumbnail-strip — ALLE foto's, klik om te bekijken */}
          {photos.length > 1 && (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', overflowX: 'auto', maxWidth: '92vw', padding: '0.25rem', WebkitOverflowScrolling: 'touch' }}>
              {photos.map((p, idx) => (
                <div key={p.id} onClick={() => setSelectedPhotoIndex(idx)} style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: idx === selectedPhotoIndex ? '2px solid #fff' : '2px solid rgba(255,255,255,0.15)', opacity: idx === selectedPhotoIndex ? 1 : 0.6 }}>
                  <img src={p.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ INTAKE SUMMARY MODAL ═══ */}
      {showIntake && effectiveClient && (
        <IntakeSummaryModal
          db={db}
          client={effectiveClient}
          isMobile={isMobile}
          onClose={() => setShowIntake(false)}
        />
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
