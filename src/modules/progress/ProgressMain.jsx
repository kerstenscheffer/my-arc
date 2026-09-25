// src/modules/progress/ProgressMain.jsx
// v6.2 - overflow hidden fix

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Camera, Calendar, Sparkles, ChevronDown, ChevronUp, Coffee, Sun, Moon, GitCompareArrows, Ruler, X } from 'lucide-react'

import ProgressPhotos from '../progress-photos/ProgressPhotos'
import WeightTrackerService from '../weight-tracker/WeightTrackerService'
import WeightProgressRing from '../weight-tracker/components/WeightProgressRing'
import WeightStatsGrid from '../weight-tracker/components/WeightStatsGrid'
import CircumferenceMeasurements from '../weight-tracker/components/CircumferenceMeasurements'
import RecentProgressPhotos from './components/RecentProgressPhotos'
import CheckinHistoryCard from './components/CheckinHistoryCard'
import SlaapKnop from './SlaapKnop'
import BeforeAfterCard from './components/BeforeAfterCard'
import PhotoCompareModal from './components/PhotoCompareModal'
import ProgressChallengeSidebar from '../../client/components/ProgressChallengeSidebar'
import GewichtBandGrafiek from '../coach-command-center/components/insight/GewichtBandGrafiek'
import { useChallenge } from '../../hooks/useChallenge'

// Coach-tip bovenaan de tracking pagina — foto links, vaste boodschap rechts.
// Vervangt de rotating daily-tip: deze tekst is een vast reminder over week-
// gemiddeldes ipv dagelijkse schommelingen.
// Dezelfde foto als de andere meldingen, lokaal in plaats van een gratis
// image-host.
const COACH_PHOTO_URL = '/coach-compliment.jpg'
const COACH_TRACKING_MESSAGE = 'Gewichtsschommelingen zijn normaal. We sturen op basis van het week op week gemiddelde.'

function TrackingTipBlock({ isMobile }) {
  return (
    // Geen kader: de foto staat links en loopt naar rechts weg in het zwart
    // van de pagina, met de tekst er half overheen. Een kaartje eromheen
    // maakte er een blokje van dat los op de pagina lag.
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: isMobile ? 130 : 150,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '46%',
        backgroundImage: `url(${COACH_PHOTO_URL})`,
        backgroundSize: 'cover', backgroundPosition: 'center 28%',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(90deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.35) 22%, rgba(10,10,10,0.8) 40%, #0a0a0a 58%)',
      }} />
      <div style={{
        position: 'relative',
        marginLeft: '26%',
        padding: isMobile ? '0.9rem 1rem 1rem 0.5rem' : '1.1rem 1.5rem 1.2rem 0.75rem',
      }}>
        <div style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          fontWeight: 800, color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: 5,
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
        }}>
          Van Kersten
        </div>
        <div style={{
          fontSize: isMobile ? '0.88rem' : '0.95rem',
          fontWeight: 900, color: '#fff',
          lineHeight: 1.35, letterSpacing: '-0.015em',
          textShadow: '0 2px 12px rgba(0,0,0,0.95)',
        }}>
          {COACH_TRACKING_MESSAGE}
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
  // De fases van deze klant (cut/build/onderhoud). De coaching-band tekent zijn
  // tempo per fase, dus zonder deze lijst staat er een band omheen die nergens
  // op slaat. Eerste rij = de lopende fase, zelfde volgorde als in het
  // coach-paneel.
  const [fases, setFases] = useState([])
  // Omtrekken zitten achter een knop naast de slider en openen in een blad van
  // onderen — zelfde patroon als de slaapknop. Als blok in de pagina stond het
  // er altijd, terwijl je je omtrek hooguit één keer per week meet.
  const [omtrekOpen, setOmtrekOpen] = useState(false)
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
      const [stats, friday, history, entry, photos, recent, faseLijst] = await Promise.all([
        weightService.getWeightStats(client.id),
        weightService.getFridayCompliance(client.id),
        weightService.getWeightHistory(client.id, 730),
        weightService.getTodayEntry(client.id),
        getPhotoCount(client.id),
        getRecentPhotos(client.id),
        getFases(client.id)
      ])
      setWeightStats(stats || {}); setFridayData(friday || {}); setWeightHistory(history || [])
      setFases(faseLijst || [])
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

  // Let op: een Supabase query-builder heeft geen .catch(), dus de fout vangen
  // we met het tweede argument van then — anders sloopt hij de Promise.all
  // hierboven nog voor de query vertrekt.
  const getFases = async (id) => {
    const { data } = await db.supabase
      .from('client_phases')
      .select('*')
      .eq('client_id', id)
      .order('started_on', { ascending: false })
      .then(r => r, () => ({ data: [] }))
    return data || []
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

  // Terugval voor de hero: de laatste foto die er wél is, zodat er nooit een
  // leeg vak bovenaan de pagina staat. Zonder foto's valt BeforeAfterCard terug
  // op deze afbeelding met de MA-overlay eroverheen.
  const heroFoto = (recentPhotos.find(p => p.photo_url) || {}).photo_url
    || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=1000&fit=crop&q=80'

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

      {/* Je nacht loggen. Links zwevend, zodat het 's ochtends één tik is en
          niet een halve pagina scrollen. */}
      <SlaapKnop client={client} db={db} isMobile={isMobile} onderMarge={isMobile ? 96 : 102} onOpgeslagen={loadAllData} />

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

      {/* ═══ ZONE 0: TRANSFORMATIE — het eerste wat je ziet ═══
            De before/after met de MA-overlay en de maand-labels, over de volle
            breedte. Onderaan loopt hij weg in het zwart van de pagina; de knop
            naar de foto's ligt daar overheen. Hij stond eerder halverwege de
            pagina als plaatje van 120 pixels naast wat tekst — daar zag je je
            eigen verandering niet op, en dat is precies waarom je hier komt. */}
      {!photosOpen && (
        <div
          onClick={() => setPhotosOpen(true)}
          style={{
            position: 'relative',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            maxWidth: isMobile ? '100%' : 420,
            margin: '0 auto',
          }}
        >
          <BeforeAfterCard
            bare client={client} db={db} isMobile={isMobile}
            fallbackUrl={heroFoto}
          />
          {/* Zwarte fade: laat de maand-labels net vrij en loopt daaronder dicht
              naar het zwart van de pagina, zodat de knop leesbaar is zonder een
              vak eromheen. */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%',
            background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.9) 32%, rgba(10,10,10,0.45) 65%, transparent 100%)',
            pointerEvents: 'none', borderRadius: '0 0 14px 14px',
          }} />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: isMobile ? '0 0.9rem 0.85rem' : '0 1.1rem 1rem',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? '1.05rem' : '1.15rem',
                fontWeight: 900, color: '#fff',
                letterSpacing: '-0.02em', lineHeight: 1.1,
                textShadow: '0 2px 12px rgba(0,0,0,0.9)',
              }}>
                Progress foto's
              </div>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.6)', marginTop: 3,
                textShadow: '0 1px 8px rgba(0,0,0,0.9)',
              }}>
                {photoCount > 0
                  ? `${photoCount} ${photoCount === 1 ? 'foto' : "foto's"} · open om te bekijken`
                  : 'Open om je eerste foto toe te voegen'}
              </div>
            </div>
            <div style={{
              flexShrink: 0,
              width: isMobile ? 42 : 46, height: isMobile ? 42 : 46,
              borderRadius: '50%', background: '#fff', color: '#0a0a0a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
            }}>
              <ChevronDown size={isMobile ? 22 : 24} strokeWidth={3} />
            </div>
          </div>
        </div>
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
          extraKnop={(
            <button
              onClick={() => setOmtrekOpen(true)}
              style={{
                // Geen vlak eromheen: naast een slider die zelf alleen uit
                // cijfers bestaat, is een witte knop een blok dat de aandacht
                // van het gewicht wegtrekt. Icoon boven het woord, allebei wit
                // en dik — dat is genoeg om een knop te zijn.
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                width: isMobile ? 52 : 58, minHeight: 52, padding: '0.4rem 0',
                background: 'transparent', border: 'none', color: '#fff',
                fontSize: isMobile ? '0.6rem' : '0.64rem', fontWeight: 900,
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Ruler size={20} strokeWidth={2.8} />
              Omtrek
            </button>
          )}
        />
      )}

      {/* De boodschap over weekgemiddeldes hoort hier: je hebt net je gewicht
          van vandaag ingetikt en ziet het tegelijk in de cijfers eronder. */}
      {!photosOpen && (
        <div style={{ marginTop: isMobile ? '1.25rem' : '1.5rem' }}>
          <TrackingTipBlock isMobile={isMobile} />
        </div>
      )}

      {/* ═══ ZONE 2b: GEWICHT-STATS — direct onder het logmoment ═══ */}
      {!photosOpen && (
        <div style={{ marginTop: isMobile ? '1rem' : '1.25rem' }}>
          {/* Geen `fase` hier, met opzet: dan rekent de balk 'sinds start' vanaf
              de eerste weging ooit en staan er vier cellen (gemiddelde, tempo,
              vorige week, sinds start). Dat is de balk die de klant kent. De
              fase-cijfers — tempo deze week, boven/onder plan — horen bij het
              sturen, en dat doet de coach. */}
          <WeightStatsGrid
            stats={weightStats}
            client={client}
            fridayData={fridayData}
            history={weightHistory}
            isMobile={isMobile}
            toonGrafiek={false}
          />
          {/* De coaching-band: dezelfde grafiek die de coach ziet. Het losse
              verloop dat hier stond (witte lijn, doel-streep) toonde alleen de
              metingen — en daar valt niets aan af te lezen, want twee kilo
              verschil tussen twee ochtenden is normaal. Hier staat de band
              omheen waarin je hoort te blijven, met het 7-daags gemiddelde als
              lijn: dat is waar het over gaat. */}
          {weightHistory.length > 0 && (
            <div style={{ marginTop: isMobile ? '1.25rem' : '1.5rem' }}>
              <GewichtBandGrafiek
                client={client}
                history={weightHistory}
                fase={fases[0] || null}
                fases={fases}
                isMobile={isMobile}
                klantModus
              />
            </div>
          )}
        </div>
      )}

      {/* Omtrekken horen bij het gewicht: de weegschaal staat stil terwijl de
          taille krimpt. Ze staan daarom achter de knop naast de slider, in een
          blad van onderen — niet meer als blok verderop de pagina. */}
      {omtrekOpen && createPortal(
        <div
          onClick={() => setOmtrekOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2147483100,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 520, maxHeight: '92dvh', overflowY: 'auto',
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '18px 18px 0 0',
              padding: '0.9rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem)',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
              animation: 'omtrekOmhoog 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.9rem' }}>
              <Ruler size={17} color="#fff" strokeWidth={2.4} />
              <span style={{ flex: 1, fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                Omtrekmetingen
              </span>
              <button onClick={() => setOmtrekOpen(false)} aria-label="Sluiten" style={{
                width: 30, height: 30, padding: 0, background: 'transparent', border: 'none',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <X size={18} strokeWidth={3} />
              </button>
            </div>
            <CircumferenceMeasurements
              weightService={weightService} clientId={client?.id}
              isMobile={isMobile} onSave={loadAllData} alsBlad
            />
            <style>{`
              @keyframes omtrekOmhoog { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ ZONE 4: GEWICHT-CONTENT — alleen wanneer foto-dropdown gesloten ═══
            Volgorde: histograaf bovenaan, daarna omtrekken. */}
      {!photosOpen && (
        <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
          {/* De lijst met alle weeglogs stond hier. Die staat al in het verloop
              hierboven, en tweehonderd regels onder een grafiek leest niemand. */}

          {/* Je eigen check-ins teruglezen — hoort bij het terugkijken dat je
              op deze pagina toch al doet. */}
          <CheckinHistoryCard db={db} client={client} isMobile={isMobile} />

          {/* Het slaapblok met zijn eigen fotokop stond hier. Loggen en
              terugkijken zitten nu allebei in het blad achter de maan-knop
              linksonder; een tweede plek met dezelfde lijst maakte de pagina
              alleen langer. */}
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
