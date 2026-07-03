// src/modules/workout/components/todays-workout/components/ExerciseCard.jsx
import { useState, useEffect } from 'react'
import { Play, RefreshCw, CheckCircle, Check, Dumbbell, Send, BookmarkPlus, Youtube, Info, MessageSquare } from 'lucide-react'
import ExerciseHistory from './ExerciseHistory'
import InfoModal from './InfoModal'
import SwapModal from './SwapModal'
import ExerciseLogModal from './ExerciseLogModal'
import ClientFeedbackModal from './ClientFeedbackModal'
import ExerciseService from '../../../../../services/ExerciseService'

const getFallbackImage = (exercise) => {
  const name = (exercise.name || '').toLowerCase()
  const muscles = (exercise.primairSpieren || exercise.muscleGroup || '').toLowerCase()
  const combined = `${name} ${muscles}`
  if (combined.includes('bench') || combined.includes('chest') || combined.includes('push') || combined.includes('borst') || combined.includes('fly') || combined.includes('pec')) return 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('row') || combined.includes('back') || combined.includes('pull') || combined.includes('rug') || combined.includes('lat') || combined.includes('deadlift')) return 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('squat') || combined.includes('leg') || combined.includes('lunge') || combined.includes('been') || combined.includes('quad') || combined.includes('hamstring') || combined.includes('calf') || combined.includes('kuit')) return 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('shoulder') || combined.includes('delt') || combined.includes('schouder') || combined.includes('lateral') || combined.includes('raise') || combined.includes('overhead')) return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('bicep') || combined.includes('tricep') || combined.includes('curl') || combined.includes('arm') || combined.includes('extension') || combined.includes('hammer')) return 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('core') || combined.includes('ab') || combined.includes('plank') || combined.includes('crunch') || combined.includes('buik')) return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('glute') || combined.includes('hip thrust') || combined.includes('bil')) return 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=400&fit=crop&q=80&crop=center'
  if (combined.includes('cardio') || combined.includes('run') || combined.includes('bike') || combined.includes('fiets')) return 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=400&fit=crop&q=80&crop=center'
  return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop&q=80&crop=center'
}

export default function ExerciseCard({
  exercise, index, totalExercises, isLogged, onLogsUpdate,
  client, schema, db, workoutDayKey, visible, delay, onMakePermanent
}) {
  const isMobile = window.innerWidth <= 768
  const [localExercise, setLocalExercise] = useState(exercise)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoDefaultTab, setInfoDefaultTab] = useState('video')
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [previousLog, setPreviousLog] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [imageUrl, setImageUrl] = useState(getFallbackImage(exercise))
  const [loadingImage, setLoadingImage] = useState(true)
  const [makingPermanent, setMakingPermanent] = useState(false)
  const [isPermanent, setIsPermanent] = useState(!exercise._pendingPermanent)
  const [hasVideo, setHasVideo] = useState(false)
  const [hasFeedback, setHasFeedback] = useState(false)

  // Sync localExercise als de exercise prop verandert. We luisteren niet
  // alleen op naam — na een permanent-swap kunnen óók flags wijzigen
  // (_isWeeklyOverride, _pendingPermanent) en moet de card meebewegen,
  // anders blijft de oude state hangen tot een hard refresh.
  useEffect(() => {
    setLocalExercise(exercise)
    setIsPermanent(!exercise._pendingPermanent)
  }, [exercise.name, exercise._isWeeklyOverride, exercise._pendingPermanent, exercise.image_url])

  useEffect(() => {
    if (exercise.name && client?.id) { loadPreviousLog(); checkFeedback() }
    // loadExerciseImage NOW also sets hasVideo — same query, single round-
    // trip. We no longer call the separate checkVideo() because its
    // 10-min in-memory cache made freshly-attached videos invisible until
    // refresh. The video_url is read directly each mount alongside the
    // thumbnail/image lookup.
    if (exercise.name) loadExerciseImage()
  }, [exercise.name, client?.id])

  // Best-effort YouTube thumbnail derivation. Same regex as the editor
  // — keeps the two sides in sync. Returns null for any non-YouTube URL.
  const deriveYoutubeThumb = (url) => {
    if (!url) return null
    const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
    if (!m) return null
    return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`
  }

  const loadExerciseImage = async () => {
    setLoadingImage(true)
    // Reset hasVideo per mount — gets re-derived from the data below.
    let foundVideo = false
    try {
      // Coach-supplied video thumbnail wins — that's the explicit "this is
      // what this exercise looks like" frame from the workout video.
      if (exercise.thumbnail_url) {
        setImageUrl(exercise.thumbnail_url)
        if (exercise.video_url) foundVideo = true
        setHasVideo(foundVideo); setLoadingImage(false); return
      }
      // If the workout-item itself carries a video_url, try to auto-derive
      // a YouTube thumb from it BEFORE falling back to the stock image.
      const ytThumbFromExercise = deriveYoutubeThumb(exercise.video_url)
      if (ytThumbFromExercise) {
        setImageUrl(ytThumbFromExercise); foundVideo = true
        setHasVideo(foundVideo); setLoadingImage(false); return
      }
      if (exercise.video_url) foundVideo = true

      // Custom oefening — haal foto op uit custom_exercises tabel
      if ((exercise.type === 'custom' || exercise._isCustom) && client?.id && db) {
        const { data } = await db.supabase
          .from('custom_exercises')
          .select('image_url')
          .eq('client_id', client.id)
          .eq('name', exercise.name)
          .single()
        if (data?.image_url) { setImageUrl(data.image_url); setHasVideo(foundVideo); setLoadingImage(false); return }
      }

      // Standaard oefening — fresh query: thumbnail / video / fallback / image.
      // fallback_video_url is een YouTube-link van een externe creator die
      // de uitvoering laat zien wanneer coach nog geen eigen video heeft —
      // we behandelen 'em als "has video" zodat de play-overlay verschijnt.
      try {
        const { data: ex } = await db.supabase
          .from('exercises')
          .select('thumbnail_url, video_url, fallback_video_url, image_url')
          .eq('name', exercise.name)
          .maybeSingle()
        if (ex?.video_url || ex?.fallback_video_url) foundVideo = true
        // Onthoud de fallback URL op het localExercise zodat de play-handler
        // 'm kan openen (zie handleVideoClick verderop).
        if (ex?.fallback_video_url && !exercise.video_url) {
          setLocalExercise(prev => ({ ...prev, fallback_video_url: ex.fallback_video_url }))
        }
        if (ex?.thumbnail_url) { setImageUrl(ex.thumbnail_url); setHasVideo(foundVideo); setLoadingImage(false); return }
        const ytThumb = deriveYoutubeThumb(ex?.video_url)
        if (ytThumb)            { setImageUrl(ytThumb);            setHasVideo(foundVideo); setLoadingImage(false); return }
        if (ex?.image_url)      { setImageUrl(ex.image_url);       setHasVideo(foundVideo); setLoadingImage(false); return }
      } catch {}

      const url = await ExerciseService.getExerciseImage(exercise.name)
      setImageUrl(url || getFallbackImage(exercise))
      setHasVideo(foundVideo)
    } catch {
      setImageUrl(getFallbackImage(exercise))
      setHasVideo(foundVideo)
    } finally { setLoadingImage(false) }
  }

  const checkVideo = async () => {
    try { setHasVideo(!!(await ExerciseService.getExerciseVideo(exercise.name))) } catch { setHasVideo(false) }
  }

  const checkFeedback = async () => {
    if (!client?.id || !db?.getExerciseSubmission) return
    try {
      const sub = await db.getExerciseSubmission(client.id, exercise.name)
      setHasFeedback(!!sub?.coach_feedback && sub.status !== 'seen')
    } catch { setHasFeedback(false) }
  }

  const loadPreviousLog = async () => {
    if (!client?.id || !db) return
    setLoadingHistory(true)
    try { setPreviousLog(await db.getPreviousExerciseLog(client.id, exercise.name)) }
    catch { setPreviousLog(null) }
    finally { setLoadingHistory(false) }
  }

  const handleSwapComplete = async (result) => {
    // Optimistische UI update — naam direct wisselen zonder reload te wachten
    if (result?.newExercise) {
      setLocalExercise(prev => ({ ...prev, ...result.newExercise }))
      setImageUrl(getFallbackImage(result.newExercise))
      loadExerciseImageForName(result.newExercise.name)
    }
    setShowSwapModal(false)
    if (onLogsUpdate) onLogsUpdate({ reloadSchema: true })
  }

  const loadExerciseImageForName = async (name) => {
    try {
      const url = await ExerciseService.getExerciseImage(name)
      if (url) setImageUrl(url)
    } catch { }
  }

  const handleLogComplete = () => {
    setShowLogModal(false)
    loadPreviousLog()
    if (onLogsUpdate) onLogsUpdate()
  }

  const handleMakePermanent = async () => {
    if (!onMakePermanent) return
    setMakingPermanent(true)
    try { await onMakePermanent(exercise); setIsPermanent(true) }
    catch (e) { console.error(e) }
    finally { setMakingPermanent(false) }
  }

  const showPermanentBtn = exercise._pendingPermanent && !isPermanent
  const photoSize = isMobile ? 62 : 72
  const GOLD = '#FFD700'
  const DIVIDER = 'rgba(255,255,255,0.06)'

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: `all 0.3s ease ${delay}ms` }}>
      <div style={{
        margin: isMobile ? '0 0.9rem 0.4rem' : '0 1.25rem 0.5rem',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 12,
        overflow: 'hidden',
        opacity: isLogged ? 0.55 : 1,
        transition: 'opacity 0.2s ease',
        display: 'flex', flexDirection: 'column',
      }}>

        {showPermanentBtn && <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.35), transparent)' }} />}

        {/* ── HOOFDRIJ: foto + info-kolom ── */}
        <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>

          {/* Foto — donkerder voor rustigere look */}
          <div
            onClick={(e) => { e.stopPropagation(); setShowLogModal(true) }}
            style={{
              width: photoSize, height: photoSize, flexShrink: 0,
              position: 'relative', overflow: 'hidden',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: isLogged ? 0.4 : 0.6,
            }} />
            {/* Donkere overlay om foto rustiger te maken */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }} />
            {loadingImage && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.3)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>}

            {/* Nummer/check linksboven */}
            <div style={{
              position: 'absolute', top: 4, left: 4,
              width: 18, height: 18, borderRadius: 3,
              background: 'rgba(0,0,0,0.75)',
              border: isLogged ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
            }}>
              {isLogged
                ? <CheckCircle size={10} color="#10b981" strokeWidth={2.5} />
                : <span style={{ fontSize: '0.52rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>{index + 1}</span>}
            </div>

            {/* Video-knopje rechtsonder — goud ipv rood */}
            {hasVideo && !loadingImage && (
              <button onClick={(e) => { e.stopPropagation(); setInfoDefaultTab('video'); setShowInfoModal(true) }}
                style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: '#FFD700', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 3, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', padding: 0 }}>
                <svg width="6" height="6" viewBox="0 0 10 10" fill="rgba(0,0,0,0.85)"><polygon points="2,1 9,5 2,9" /></svg>
              </button>
            )}

            {isLogged && <Check size={photoSize / 2.5} color="white" strokeWidth={3} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.85, zIndex: 4 }} />}
          </div>

          {/* Info-kolom */}
          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: isMobile ? '0.35rem 0.65rem 0.3rem' : '0.4rem 0.85rem 0.35rem',
          }}>
            {/* Naam + spiergroep-pill ernaast */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 6, minWidth: 0,
              marginBottom: 3,
            }}>
              <span style={{
                fontSize: isMobile ? '0.88rem' : '0.95rem',
                fontWeight: 800,
                color: isLogged ? 'rgba(255,255,255,0.45)' : '#fff',
                lineHeight: 1.15,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                textDecoration: isLogged ? 'line-through' : 'none',
                letterSpacing: '-0.015em',
                minWidth: 0,
              }}>
                {localExercise.name}
              </span>
              {exercise.primairSpieren && (
                <span style={{
                  flexShrink: 0,
                  fontSize: isMobile ? '0.52rem' : '0.55rem',
                  fontWeight: 900,
                  color: '#000',
                  background: GOLD,
                  padding: '2px 7px',
                  borderRadius: 3,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}>
                  {exercise.primairSpieren}
                </span>
              )}
            </div>

            {/* Stats-rij — sets en reps (rust weggehaald voor rustigere look) */}
            <div style={{ display: 'flex', gap: isMobile ? '0.55rem' : '0.7rem', overflow: 'hidden' }}>
              {exercise.sets && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{exercise.sets}</span>
                  <span style={{ fontSize: isMobile ? '0.52rem' : '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>sets</span>
                </div>
              )}
              {exercise.reps && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{exercise.reps}</span>
                  <span style={{ fontSize: isMobile ? '0.52rem' : '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>reps</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ACTIE-RIJ: Video-feedback / Info / Wissel (klein, icon-only) +
            Log (zelfde grootte als voorheen = 1/3 van de rij). ── */}
        <div style={{ display: 'flex', borderTop: `1px solid ${DIVIDER}` }}>
          <ActionCell
            icon={<MessageSquare size={isMobile ? 12 : 13} />}
            badge={hasFeedback}
            flex={2}
            onClick={(e) => { e.stopPropagation(); setShowFeedbackModal(true) }}
            isMobile={isMobile}
          />
          <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
          <ActionCell
            icon={<Info size={isMobile ? 12 : 13} />}
            flex={2}
            onClick={(e) => { e.stopPropagation(); setInfoDefaultTab(hasVideo ? 'video' : 'details'); setShowInfoModal(true) }}
            isMobile={isMobile}
          />
          <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
          <ActionCell
            icon={<RefreshCw size={isMobile ? 12 : 13} />}
            flex={2}
            onClick={(e) => { e.stopPropagation(); setShowSwapModal(true) }}
            isMobile={isMobile}
          />
          <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
          <ActionCell
            icon={<Check size={isMobile ? 11 : 12} strokeWidth={2.6} />}
            label={isLogged ? 'Bekijk' : 'Log'}
            flex={3}
            onClick={(e) => { e.stopPropagation(); setShowLogModal(true) }}
            isMobile={isMobile}
            checked={isLogged}
          />
        </div>

        {/* Eerdere log — kleine link onderaan, klikbaar voor uitklappen */}
        {previousLog && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setShowHistory(p => !p) }}
              style={{
                width: '100%', padding: isMobile ? '0.35rem 0.7rem' : '0.4rem 0.95rem',
                background: showHistory ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: 'none', borderTop: `1px solid ${DIVIDER}`,
                color: 'rgba(255,255,255,0.45)',
                fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
              <Play size={10} strokeWidth={2.4} />
              {showHistory ? 'Verberg vorige log' : 'Toon vorige log'}
            </button>
            {showHistory && (
              <div style={{ padding: isMobile ? '0.625rem 0.95rem' : '0.75rem 1.25rem', borderTop: `1px solid ${DIVIDER}` }}>
                <ExerciseHistory exerciseName={exercise.name} previousLog={previousLog} loading={loadingHistory} client={client} db={db} />
              </div>
            )}
          </>
        )}

        {/* Permanent in plan */}
        {showPermanentBtn && (
          <button onClick={handleMakePermanent} disabled={makingPermanent}
            style={{ width: '100%', padding: isMobile ? '0.45rem' : '0.5rem', background: 'transparent', border: 'none', borderTop: '1px solid rgba(255,215,0,0.1)', color: 'rgba(255,215,0,0.5)', fontSize: isMobile ? '0.62rem' : '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: makingPermanent ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            {makingPermanent
              ? <><div style={{ width: '11px', height: '11px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Opslaan...</>
              : <><BookmarkPlus size={11} strokeWidth={2.5} />Permanent in plan zetten</>}
          </button>
        )}
      </div>

      {/* Modals krijgen `localExercise` — niet de prop. Na een swap update
          handleSwapComplete optimistisch localExercise, terwijl `exercise`
          (de prop) pas updatet als de parent het schema heeft herladen. De
          oude waarde gebruiken opende het log voor de pre-swap-oefening. */}
      {showInfoModal && <InfoModal exercise={localExercise} onClose={() => setShowInfoModal(false)} db={db} client={client} defaultTab={infoDefaultTab} />}
      {showSwapModal && <SwapModal exercise={localExercise} exerciseIndex={index} workoutDayKey={workoutDayKey} schema={schema} onClose={() => setShowSwapModal(false)} onSwapComplete={handleSwapComplete} db={db} client={client} />}
      {showLogModal && <ExerciseLogModal db={db} client={client} exercise={localExercise} onClose={handleLogComplete} />}
      {showFeedbackModal && <ClientFeedbackModal exercise={localExercise} client={client} db={db} onClose={() => setShowFeedbackModal(false)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// MealCard-stijl actie-cel: icoon + label, gecentreerd, flex-1.
function ActionCell({ icon, label, onClick, isMobile, checked, badge, flex = 1 }) {
  const color = checked ? '#10b981' : 'rgba(255,255,255,0.7)'
  return (
    <button
      onClick={onClick}
      style={{
        flex, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        padding: isMobile ? '0.32rem 0.3rem' : '0.4rem 0.4rem',
        background: 'transparent', border: 'none',
        color,
        fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700,
        cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        minHeight: 28, letterSpacing: '-0.005em',
      }}
    >
      {icon}
      {label && <span>{label}</span>}
      {badge && (
        <div style={{
          position: 'absolute', top: 4, right: 8,
          width: 7, height: 7, borderRadius: '50%',
          background: '#ef4444', border: '1px solid #0a0a0a',
        }} />
      )}
    </button>
  )
}
