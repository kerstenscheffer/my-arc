// src/modules/workout/components/todays-workout/components/ExerciseCard.jsx
import { useState, useEffect } from 'react'
import { Play, RefreshCw, CheckCircle, Dumbbell, Send, BookmarkPlus, Youtube, Info, MessageSquare } from 'lucide-react'
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

  // Sync localExercise als de exercise prop verandert (bijv. na schema reload met overrides)
  useEffect(() => {
    setLocalExercise(exercise)
  }, [exercise.name])
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

  useEffect(() => {
    if (exercise.name && client?.id) { loadPreviousLog(); checkFeedback() }
    if (exercise.name) { loadExerciseImage(); checkVideo() }
  }, [exercise.name, client?.id])

  const loadExerciseImage = async () => {
    setLoadingImage(true)
    try {
      // Direct image_url op het object — altijd prioriteit
      if (exercise.image_url) { setImageUrl(exercise.image_url); setLoadingImage(false); return }

      // Custom oefening — haal foto op uit custom_exercises tabel
      if ((exercise.type === 'custom' || exercise._isCustom) && client?.id && db) {
        const { data } = await db.supabase
          .from('custom_exercises')
          .select('image_url')
          .eq('client_id', client.id)
          .eq('name', exercise.name)
          .single()
        if (data?.image_url) { setImageUrl(data.image_url); setLoadingImage(false); return }
      }

      // Standaard oefening — zoek in exercises tabel
      const url = await ExerciseService.getExerciseImage(exercise.name)
      setImageUrl(url || getFallbackImage(exercise))
    } catch { setImageUrl(getFallbackImage(exercise)) }
    finally { setLoadingImage(false) }
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
  const imgSize = isMobile ? '60px' : '68px'

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: `all 0.3s ease ${delay}ms` }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isLogged ? 'rgba(16,185,129,0.025)' : 'transparent' }}>

        {showPermanentBtn && <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.35), transparent)' }} />}

        {/* ── HOOFDRIJ: foto + naam/stats + log knop ── */}
        <div style={{ display: 'flex', alignItems: 'stretch', minHeight: imgSize }}>

          {/* Foto */}
          <div style={{ width: imgSize, minHeight: imgSize, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: loadingImage ? 0.2 : isLogged ? 0.4 : 0.75, transition: 'opacity 0.3s ease' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, transparent 100%)' }} />
            {loadingImage && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.3)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>}

            {/* Nummer/check */}
            <div style={{ position: 'absolute', top: '4px', left: '4px', width: '18px', height: '18px', borderRadius: '3px', background: 'rgba(0,0,0,0.6)', border: isLogged ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              {isLogged
                ? <CheckCircle size={10} color="#10b981" strokeWidth={2.5} />
                : <span style={{ fontSize: '0.52rem', fontWeight: '800', color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>{index + 1}</span>}
            </div>

            {/* YouTube dot */}
            {hasVideo && !loadingImage && (
              <button onClick={(e) => { e.stopPropagation(); setInfoDefaultTab('video'); setShowInfoModal(true) }}
                style={{ position: 'absolute', bottom: '4px', right: '4px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(200,0,0,0.85)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 3, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', padding: 0 }}
                onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.85)'}
                onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <svg width="6" height="6" viewBox="0 0 10 10" fill="white"><polygon points="2,1 9,5 2,9" /></svg>
              </button>
            )}

            {isLogged && <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,185,129,0.1)', zIndex: 1 }} />}
          </div>

          {/* Naam + meta */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: isMobile ? '0 0.75rem' : '0 1rem', gap: '0.625rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? '0.875rem' : '0.95rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {localExercise.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                {exercise.primairSpieren && (
                  <span style={{ fontSize: isMobile ? '0.57rem' : '0.62rem', color: 'rgba(255,255,255,0.22)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <Dumbbell size={8} strokeWidth={2} />{exercise.primairSpieren}
                  </span>
                )}
                {exercise.sets && <span style={{ fontSize: isMobile ? '0.57rem' : '0.62rem', color: 'rgba(255,255,255,0.22)', fontWeight: '600' }}>{exercise.sets}×{exercise.reps}</span>}
                {exercise.rust && <span style={{ fontSize: isMobile ? '0.57rem' : '0.62rem', color: 'rgba(255,255,255,0.22)', fontWeight: '600' }}>{exercise.rust}</span>}
              </div>
            </div>

            {/* LOG knop — primaire actie rechts */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowLogModal(true) }}
              style={{ flexShrink: 0, padding: isMobile ? '0.4rem 0.75rem' : '0.45rem 0.875rem', background: isLogged ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)', border: isLogged ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: isLogged ? '#10b981' : 'rgba(255,255,255,0.6)', fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', minHeight: '32px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}
              onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <Play size={isMobile ? 10 : 11} strokeWidth={2.5} />
              {isLogged ? 'Bekijk' : 'Log'}
            </button>
          </div>
        </div>

        {/* ── SECUNDAIRE STRIP: icon-only knoppen ── */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.04)', height: isMobile ? '34px' : '38px' }}>
          {[
            { icon: hasVideo ? Youtube : Info, label: hasVideo ? 'Video' : 'Info', onClick: () => { setInfoDefaultTab(hasVideo ? 'video' : 'details'); setShowInfoModal(true) } },
            { icon: RefreshCw, label: 'Wissel', onClick: () => setShowSwapModal(true) },
            { icon: MessageSquare, label: 'Feedback', onClick: () => { setShowFeedbackModal(true); setHasFeedback(false) }, badge: hasFeedback },
            ...(previousLog ? [{ icon: Play, label: 'Eerdere', onClick: () => setShowHistory(p => !p), active: showHistory }] : [])
          ].map(({ icon: Icon, label, onClick, active, badge }, i, arr) => (
            <button key={label} onClick={(e) => { e.stopPropagation(); onClick() }}
              style={{ flex: 1, background: active ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', color: active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)', fontSize: isMobile ? '0.58rem' : '0.62rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease', position: 'relative' }}
              onTouchStart={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onTouchEnd={(e) => e.currentTarget.style.background = active ? 'rgba(255,255,255,0.05)' : 'transparent'}
              onMouseEnter={(e) => { if (window.innerWidth > 768) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={(e) => { if (window.innerWidth > 768) e.currentTarget.style.background = active ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
              <Icon size={isMobile ? 11 : 12} strokeWidth={2} />
              {label}
              {badge && (
                <div style={{ position: 'absolute', top: '5px', right: '8px', width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', border: '1px solid #0a0a0a' }} />
              )}
            </button>
          ))}
        </div>

        {/* Vorige log uitklap */}
        {showHistory && previousLog && (
          <div style={{ padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <ExerciseHistory exerciseName={exercise.name} previousLog={previousLog} loading={loadingHistory} client={client} db={db} />
          </div>
        )}

        {/* Permanent in plan */}
        {showPermanentBtn && (
          <button onClick={handleMakePermanent} disabled={makingPermanent}
            style={{ width: '100%', padding: isMobile ? '0.45rem' : '0.5rem', background: 'transparent', border: 'none', borderTop: '1px solid rgba(255,215,0,0.1)', color: 'rgba(255,215,0,0.5)', fontSize: isMobile ? '0.62rem' : '0.67rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: makingPermanent ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            {makingPermanent
              ? <><div style={{ width: '11px', height: '11px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Opslaan...</>
              : <><BookmarkPlus size={11} strokeWidth={2.5} />Permanent in plan zetten</>}
          </button>
        )}
      </div>

      {showInfoModal && <InfoModal exercise={exercise} onClose={() => setShowInfoModal(false)} db={db} client={client} defaultTab={infoDefaultTab} />}
      {showSwapModal && <SwapModal exercise={exercise} exerciseIndex={index} workoutDayKey={workoutDayKey} schema={schema} onClose={() => setShowSwapModal(false)} onSwapComplete={handleSwapComplete} db={db} client={client} />}
      {showLogModal && <ExerciseLogModal db={db} client={client} exercise={exercise} onClose={handleLogComplete} />}
      {showFeedbackModal && <ClientFeedbackModal exercise={exercise} client={client} db={db} onClose={() => setShowFeedbackModal(false)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
