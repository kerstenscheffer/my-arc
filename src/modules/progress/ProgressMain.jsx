// src/modules/progress/ProgressMain.jsx
// v6.2 - overflow hidden fix

import React, { useState, useEffect } from 'react'
import { Loader2, Camera, Calendar, Sparkles, ChevronDown, ChevronUp, Coffee, Sun, Moon, GitCompareArrows } from 'lucide-react'

import ProgressPhotos from '../progress-photos/ProgressPhotos'
import WeightTrackerService from '../weight-tracker/WeightTrackerService'
import WeightProgressRing from '../weight-tracker/components/WeightProgressRing'
import WeightStatsGrid from '../weight-tracker/components/WeightStatsGrid'
import WeightHistory from '../weight-tracker/components/WeightHistory'
import CircumferenceMeasurements from '../weight-tracker/components/CircumferenceMeasurements'
import RecentProgressPhotos from './components/RecentProgressPhotos'
import PhotoCompareModal from './components/PhotoCompareModal'
import ProgressChallengeSidebar from '../../client/components/ProgressChallengeSidebar'
import { useChallenge } from '../../hooks/useChallenge'

// Dag-banner content (datum + dagelijkse tip) — selectie is deterministisch per
// dag-van-het-jaar zodat'ie consistent is binnen een dag.
const TRACKING_TIPS = [
  'Wegen op een vast moment werkt beter dan elke dag op een ander tijdstip.',
  'Eén bad-meting is een datapunt, geen trend. Kijk naar de week-lijn.',
  'Foto naast cijfer — wat de weegschaal niet ziet, ziet de spiegel wel.',
  'Vloeistof-balans schommelt 1–2 kg per dag. Vertrouw je 7-daags gemiddelde.',
  'Maandag is geen heilige weeg-dag. Vrijdag werkt voor sommigen beter.',
  'Een plateau is data, geen falen. Kijk naar omtrek en spiegel.',
  'Vandaag ook? Klein moment, lange-termijn voordeel.',
  'Trots op gisteren? Houd vandaag dezelfde lijn vast.',
  'Even checken: was je laatste foto al meer dan 2 weken geleden?',
  'Sleep + stress beïnvloeden je gewicht ~1 kg. Zie het in context.',
]
const pickTrackingTip = () => {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const diff = Date.now() - start.getTime()
  const dayOfYear = Math.floor(diff / 86400000)
  return TRACKING_TIPS[dayOfYear % TRACKING_TIPS.length]
}

const getDutchDate = () => {
  const d = new Date()
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}

// Tracking-header — sticky met grote gouden DAG-naam + datum-pill ernaast.
function TrackingHeader({ client, isMobile }) {
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december']
  const today = new Date()
  const dayName = days[today.getDay()]
  const dateLabel = `${today.getDate()} ${months[today.getMonth()]}`

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(10,10,10,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      paddingTop: 'env(safe-area-inset-top, 0)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        padding: isMobile ? '0.85rem 1rem' : '1rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: isMobile ? '1.2rem' : '1.35rem',
          fontWeight: 900, color: '#FFD700', letterSpacing: '-0.02em',
          lineHeight: 1.1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {dayName}
          <span style={{
            fontSize: '0.62rem', fontWeight: 800,
            color: 'rgba(0,0,0,0.85)', background: '#FFD700',
            padding: '2px 7px', borderRadius: 4,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {dateLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

// Coach-tip bovenaan de tracking pagina — foto links, vaste boodschap rechts.
// Vervangt de rotating daily-tip: deze tekst is een vast reminder over week-
// gemiddeldes ipv dagelijkse schommelingen.
const COACH_PHOTO_URL = 'https://i.ibb.co/mCQzTZrZ/ea169061-c9f1-4b4d-ab88-fc746cbde003.jpg'
const COACH_TRACKING_MESSAGE = 'Het is normaal dat je gewicht schommelt en hoeft niks te betekenen. We focussen op jouw week gemiddelde en sturen vanuit daar bij.'

function TrackingTipBlock({ isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '1rem 1rem 0' : '1.25rem 1.5rem 0',
    }}>
      <div style={{
        display: 'flex', gap: isMobile ? 12 : 14,
        alignItems: 'flex-start',
      }}>
        <img
          src={COACH_PHOTO_URL}
          alt="Coach"
          style={{
            width: isMobile ? 48 : 56,
            height: isMobile ? 48 : 56,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(255,215,0,0.45)',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(255,215,0,0.18)',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '0.62rem' : '0.68rem',
            fontWeight: 800, color: '#FFD700',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 4,
          }}>
            Bericht van Kersten
          </div>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.92rem',
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 500, lineHeight: 1.5,
          }}>
            {COACH_TRACKING_MESSAGE}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProgressMain({ db, client }) {
  const [weightService] = useState(() => new WeightTrackerService(db))
  const { isInChallenge, challengeData } = useChallenge(db, client?.id)
  // Foto-sectie als dropdown: wanneer open, verbergen we de rest van de pagina
  // — zelfde patroon als TodaysWorkoutCard's expand-mode.
  const [photosOpen, setPhotosOpen] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [weight, setWeight] = useState(70.0)
  const [weightStats, setWeightStats] = useState(null)
  const [fridayData, setFridayData] = useState(null)
  const [weightHistory, setWeightHistory] = useState([])
  const [todayEntry, setTodayEntry] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [photoCount, setPhotoCount] = useState(0)
  const [recentPhotos, setRecentPhotos] = useState([])
  const [todayData, setTodayData] = useState({})
  // Angle picker modal — opens when a 'progress' photo is being uploaded.
  // Replaces the old browser prompt() flow.
  const [anglePicker, setAnglePicker] = useState(null)   // { file, photoType } when open
  const [angleChoice, setAngleChoice] = useState('front')
  const [customAngle, setCustomAngle] = useState('')

  const isMobile = window.innerWidth <= 768
  const today = new Date()
  const isFriday = today.getDay() === 5
  const dateString = today.toISOString().split('T')[0]

  useEffect(() => { if (client?.id) loadAllData() }, [client?.id])

  const loadAllData = async () => {
    if (!client?.id) return
    setLoading(true)
    try {
      const [stats, friday, history, entry, photos, recent] = await Promise.all([
        weightService.getWeightStats(client.id),
        weightService.getFridayCompliance(client.id),
        weightService.getWeightHistory(client.id, 730),
        weightService.getTodayEntry(client.id),
        getPhotoCount(client.id),
        getRecentPhotos(client.id)
      ])
      setWeightStats(stats || {}); setFridayData(friday || {}); setWeightHistory(history || [])
      setTodayEntry(entry); setPhotoCount(photos); setRecentPhotos(recent || [])
      const tp = recent.filter(p => p.photo_date === dateString)
      const counts = { progress: 0, meal: 0, workout: 0, victory: 0, total: 0 }
      tp.forEach(p => { const c = p.metadata?.category || 'progress'; counts[c] = (counts[c]||0)+1; counts.total++ })
      setTodayData({ photos: tp, counts })
      if (stats?.current) setWeight(stats.current)
      else if (client?.current_weight) setWeight(client.current_weight)
    } catch (e) { console.error('Error:', e); showMessage('Fout bij laden', 'error') }
    finally { setLoading(false) }
  }

  const getPhotoCount = async (id) => {
    try { const { data } = await db.supabase.from('ch8_progress_photos').select('id').eq('client_id', id); return data?.length || 0 }
    catch { return 0 }
  }

  const getRecentPhotos = async (id) => {
    try { const { data } = await db.supabase.from('ch8_progress_photos').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(300); return data || [] }
    catch { return [] }
  }

  const handlePhotoUpload = async (file, photoType) => {
    // Progress photos need an angle. Open the picker modal; non-progress uploads run directly.
    if (photoType === 'progress') {
      setAnglePicker({ file, photoType })
      setAngleChoice('front')
      setCustomAngle('')
      return
    }
    await doUpload(file, photoType, null)
  }

  const doUpload = async (file, photoType, subtype) => {
    try {
      const PSS = (await import('../progress-photos/ProgressPhotosService')).default
      const svc = new PSS(db)
      const metadata = {}
      if (subtype) metadata.subtype = subtype
      await svc.uploadPhoto(client.id, file, photoType, metadata)
      showMessage({ progress:'Progressie foto geupload!', meal:'Maaltijd foto vastgelegd!', workout:'Workout vastgelegd!', victory:'Overwinning opgeslagen!' }[photoType] || 'Foto geupload!')
      await loadAllData()
    } catch { showMessage('Upload mislukt', 'error') }
  }

  const handleAngleConfirm = async () => {
    if (!anglePicker) return
    let subtype = angleChoice
    if (angleChoice === 'other') {
      subtype = customAngle.trim().toLowerCase()
      if (!subtype) { showMessage('Vul een hoek in', 'error'); return }
    }
    const { file, photoType } = anglePicker
    setAnglePicker(null)
    await doUpload(file, photoType, subtype)
  }

  const cancelAnglePicker = () => {
    setAnglePicker(null)
    setCustomAngle('')
    setAngleChoice('front')
  }

  const handleSaveWeight = async () => {
    if (!weight || weight <= 0 || weight > 300) { showMessage('Geldig gewicht (1-300 kg)', 'error'); return }
    setSaving(true)
    try { await weightService.saveWeight(client.id, weight, dateString); showMessage('Gewicht opgeslagen!'); await loadAllData() }
    catch { showMessage('Fout bij opslaan', 'error') }
    finally { setSaving(false) }
  }

  const showMessage = (text, type = 'success') => { setMessage({ text, type }); setTimeout(() => setMessage(null), 3000) }

  const progressPercent = weightStats?.current && client?.target_weight
    ? Math.round((weightStats.current / parseFloat(client.target_weight)) * 100) : 0

  if (loading) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} color="#FFD700" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', overflow: 'hidden', paddingBottom: isMobile ? '5rem' : '2rem' }}>
      {isInChallenge && challengeData && <ProgressChallengeSidebar challengeData={challengeData} isMobile={isMobile} />}

      {/* Toast */}
      {message && (
        <div style={{
          position: 'fixed', top: isMobile ? '12px' : '20px',
          left: '50%', transform: 'translateX(-50%)',
          padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
          background: message.type === 'error'
            ? 'linear-gradient(135deg, rgba(220,38,38,0.92) 0%, rgba(153,27,27,0.92) 100%)'
            : 'linear-gradient(135deg, rgba(16,185,129,0.92) 0%, rgba(5,150,105,0.92) 100%)',
          backdropFilter: 'blur(12px)', borderRadius: '8px',
          border: message.type === 'error' ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(16,185,129,0.3)',
          color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem',
          zIndex: 2000, fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '700',
          animation: 'slideDown 0.3s ease', boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          {message.text}
        </div>
      )}

      {/* ═══ ZONE 0: DAG-BANNER ═══ */}
      {!photosOpen && (
        <>
          <TrackingHeader client={client} isMobile={isMobile} />
          <TrackingTipBlock isMobile={isMobile} />
        </>
      )}

      {/* ═══ ZONE 1: FRIDAY ALERT ═══ */}
      {!photosOpen && isFriday && !todayEntry && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.625rem',
          padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.5rem',
          background: 'rgba(139, 92, 246, 0.06)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
        }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8b5cf6', animation: 'pulse 2s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Vrijdag weegmoment vereist
          </span>
        </div>
      )}

      {/* ═══ ZONE 2: GEWICHT — Ring + Picker + Save ═══ */}
      {!photosOpen && (
        <WeightProgressRing
          weight={weight} onWeightChange={setWeight} onSave={handleSaveWeight}
          saving={saving} todayEntry={todayEntry} progressPercent={progressPercent}
          isFriday={isFriday} isMobile={isMobile}
          targetWeight={parseFloat(client?.target_weight) || 75}
        />
      )}

      {/* ═══ ZONE 3: FOTO-KNOP — TodaysWorkoutCard-stijl: foto-banner bovenaan,
            info-rij eronder, gouden cirkel-chevron rechts ═══ */}
      {!photosOpen && (() => {
        // Pak de laatste progress-foto als banner-image, fallback op een
        // generieke gym-shot zodat de knop nooit leeg is.
        const bannerUrl =
          (recentPhotos.find(p => p.photo_url) || {}).photo_url
          || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop&q=80'
        const photoH = isMobile ? 240 : 320
        // Front-foto's op tijd (oud → nieuw). Bij 2+ tonen we een before/after
        // preview: LINKS de laatste front-foto, RECHTS de eerste.
        const frontPhotos = recentPhotos
          .filter(p => (p.metadata?.subtype || '').toLowerCase() === 'front' && p.photo_url)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        const hasBeforeAfter = frontPhotos.length >= 2
        const leftPhoto = hasBeforeAfter ? frontPhotos[frontPhotos.length - 1] : null  // laatste
        const rightPhoto = hasBeforeAfter ? frontPhotos[0] : null                       // eerste
        const baLabel = { position: 'absolute', top: 6, fontSize: isMobile ? '0.5rem' : '0.55rem', fontWeight: 900, letterSpacing: '0.08em', padding: '0.1rem 0.4rem', borderRadius: 5 }
        return (
          <div
            onClick={() => setPhotosOpen(true)}
            style={{
              marginTop: isMobile ? '4rem' : '5rem',
              padding: isMobile ? '0 1rem' : '0 1.5rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Foto-banner — full width, rounded, met subtiele bottom-gradient */}
            <div style={{
              width: '100%',
              height: photoH,
              borderRadius: 14,
              position: 'relative',
              overflow: 'hidden',
              marginBottom: isMobile ? '0.65rem' : '0.85rem',
            }}>
              {hasBeforeAfter ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                  <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRight: '2px solid rgba(0,0,0,0.65)' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${leftPhoto.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
                    <span style={{ ...baLabel, left: 6, background: '#FFD700', color: '#000' }}>NU</span>
                  </div>
                  <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${rightPhoto.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
                    <span style={{ ...baLabel, right: 6, background: 'rgba(0,0,0,0.7)', color: '#fff' }}>START</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${bannerUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }} />
              )}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.55) 100%)',
                pointerEvents: 'none',
              }} />
              {photoCount === 0 && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(10,10,10,0.5)',
                }}>
                  <Camera size={photoH / 3} color="rgba(255,215,0,0.8)" strokeWidth={1.6} />
                </div>
              )}
            </div>

            {/* Info-rij — label + titel + meta links, gouden chevron-cirkel rechts */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: isMobile ? '0.6rem' : '0.85rem',
            }}>
              <div style={{
                flex: 1, minWidth: 0,
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div style={{
                  fontSize: isMobile ? '0.55rem' : '0.6rem',
                  fontWeight: 800,
                  color: '#FFD700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  lineHeight: 1, marginBottom: 4, opacity: 0.85,
                }}>
                  Progressie
                </div>
                <h2 style={{
                  fontSize: isMobile ? '1.05rem' : '1.2rem',
                  fontWeight: 900, color: '#fff',
                  margin: 0, marginBottom: 5,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                }}>
                  Progress foto's
                </h2>
                <div style={{
                  display: 'flex', gap: isMobile ? '0.6rem' : '0.8rem',
                  alignItems: 'baseline',
                  fontSize: isMobile ? '0.7rem' : '0.76rem',
                  color: 'rgba(255,255,255,0.55)',
                  fontWeight: 600,
                }}>
                  {photoCount > 0
                    ? <>
                        <span style={{ color: '#FFD700', fontWeight: 800 }}>{photoCount}</span>
                        <span>{photoCount === 1 ? 'foto' : "foto's"}</span>
                        <span style={{ opacity: 0.5 }}>·</span>
                        <span>open om te bekijken</span>
                      </>
                    : <span>Open om foto toe te voegen</span>}
                </div>
              </div>

              {/* Chevron — gouden cirkel-knop, identiek aan TodaysWorkoutCard */}
              <div style={{
                flexShrink: 0,
                width: isMobile ? 42 : 48, height: isMobile ? 42 : 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                border: 'none',
                boxShadow: '0 6px 16px rgba(255,215,0,0.35), 0 2px 6px rgba(0,0,0,0.4)',
                color: '#0a0a0a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}>
                <ChevronDown size={isMobile ? 22 : 26} strokeWidth={3} />
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═══ ZONE 4: GEWICHT-CONTENT — alleen wanneer foto-dropdown gesloten ═══
            Volgorde: stat-bar bovenaan (zwevend), daaronder de historie. */}
      {!photosOpen && (
        <div style={{ marginTop: isMobile ? '4.25rem' : '5.25rem' }}>
          <WeightStatsGrid stats={weightStats} client={client} fridayData={fridayData} history={weightHistory} isMobile={isMobile} />
          <div style={{ marginTop: isMobile ? '4rem' : '5rem' }}>
            <WeightHistory history={weightHistory} isMobile={isMobile} maxItems={200} />
          </div>
          <div style={{
            marginTop: isMobile ? '4rem' : '5rem',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <CircumferenceMeasurements weightService={weightService} clientId={client?.id} isMobile={isMobile} onSave={loadAllData} />
          </div>
        </div>
      )}

      {/* ═══ FOTO-DROPDOWN — vervangt rest van pagina ═══ */}
      {photosOpen && (
        <>
          {/* Header met collapse-knop */}
          <div style={{
            padding: isMobile ? '0.95rem 1rem' : '1.15rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <button
              onClick={() => setPhotosOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0.4rem 0.7rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.75)',
                cursor: 'pointer',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ChevronUp size={isMobile ? 14 : 15} strokeWidth={2.4} />
              Sluiten
            </button>
            <div style={{
              flex: 1,
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.015em',
            }}>
              Progress foto's
            </div>
            {photoCount > 0 && (
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.78rem',
                color: 'rgba(255,215,0,0.7)', fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {photoCount}
              </div>
            )}
          </div>
          <RecentProgressPhotos photos={recentPhotos} onUpload={handlePhotoUpload} todayData={todayData} isFriday={isFriday} isMobile={isMobile} />

          {/* Vergelijk-knop — opent de voor/na vergelijk-modal */}
          <div style={{ padding: isMobile ? '0 1rem 0.75rem' : '0 1.5rem 0.85rem' }}>
            <button
              onClick={() => setShowCompare(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                padding: isMobile ? '0.8rem' : '0.9rem',
                background: 'rgba(255,215,0,0.08)',
                border: '1px solid rgba(255,215,0,0.4)',
                borderRadius: 12,
                color: '#FFD700',
                fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 800, letterSpacing: '-0.01em',
                cursor: 'pointer', minHeight: '48px',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <GitCompareArrows size={isMobile ? 16 : 17} /> Vergelijk foto's
            </button>
          </div>

          <ProgressPhotos db={db} client={client} />
        </>
      )}

      {/* PageVideoWidget gemigreerd naar centrale WidgetSidebar in ClientDashboard. */}

      {/* ═══ VERGELIJK MODAL ═══ */}
      {showCompare && (
        <PhotoCompareModal db={db} client={client} isMobile={isMobile} onClose={() => setShowCompare(false)} />
      )}

      {/* ═══ ANGLE PICKER MODAL — for progress photos ═══ */}
      {anglePicker && (
        <div
          onClick={cancelAnglePicker}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2100, padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f0f0f', border: '1px solid rgba(255,215,0,0.1)',
              borderRadius: '12px', padding: '1.75rem',
              width: '100%', maxWidth: '340px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', margin: '0 0 0.3rem' }}>
              Welke hoek?
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', margin: '0 0 1.25rem' }}>
              Kies de hoek voor je progressie foto
            </p>

            <select
              value={angleChoice}
              onChange={(e) => setAngleChoice(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23FFD700\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'/></svg>")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem',
              }}
            >
              <option value="front">Voorkant (front)</option>
              <option value="side">Zijkant (side)</option>
              <option value="back">Achterkant (back)</option>
              <option value="other">Anders…</option>
            </select>

            {angleChoice === 'other' && (
              <input
                type="text"
                placeholder="Bijv. links, rechts, detail…"
                value={customAngle}
                onChange={(e) => setCustomAngle(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  marginTop: '0.625rem',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  WebkitAppearance: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#FFD700'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={handleAngleConfirm}
                style={{
                  width: '100%', padding: '0.9rem', minHeight: '48px',
                  background: '#FFD700', border: 'none', borderRadius: '10px',
                  color: '#000', fontSize: '0.95rem', fontWeight: '800',
                  cursor: 'pointer', letterSpacing: '0.02em',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                Bevestig & upload
              </button>
              <button
                type="button"
                onClick={cancelAnglePicker}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.25)',
                  fontSize: '0.78rem', cursor: 'pointer', padding: '0.25rem',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideDown { from { opacity:0; transform:translate(-50%,-20px); } to { opacity:1; transform:translate(-50%,0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  )
}
