// src/modules/workout/components/todays-workout/LogModal.jsx
//
// Was modal — nu een **inline component**. Renders direct in de pagina flow:
// geen backdrop, geen close-knop, geen body scroll-lock. Component-naam blijft
// LogModal voor compat met bestaande imports.
import { CheckCircle, Check, MessageSquare, ChevronDown, Zap, ThumbsUp, Moon, TrendingDown, Thermometer, Plus, Camera, Timer, Video } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import ExerciseList from './components/ExerciseList'
import WorkoutFlowWizard from './WorkoutFlowWizard'
import CustomExerciseModal from './components/CustomExerciseModal'
import PumpGalleryModal from './PumpGalleryModal'
import ClientFeedbackModal from './components/ClientFeedbackModal'

export default function LogModal({
  workout, todaysLogs, onClose, onLogsUpdate, client, schema, db,
  // Timer wordt door TodaysWorkoutMain beheerd zodat'ie ook doortikt nadat de
  // dropdown is gesloten. Bediening: klik = start/stop, dubbel-tap = reset.
  timerElapsedSec = 0, timerRunning = false, timerStarted = false,
  timerFinished = false, onTimerToggle, onTimerReset,
}) {
  const isMobile = window.innerWidth <= 768
  const [completedCount, setCompletedCount] = useState(0)
  const [isFinishing, setIsFinishing] = useState(false)
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false)
  const [showWorkoutFlow, setShowWorkoutFlow] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showPumpGallery, setShowPumpGallery] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  // Timer-state komt van TodaysWorkoutMain (zie props) zodat'ie ook doortikt
  // wanneer de dropdown gesloten wordt en auto-stopt bij de laatste log. Local
  // alias zodat de bestaande naam-referenties hieronder ongewijzigd blijven.
  const timerSec = timerElapsedSec
  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      : `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Timer-bediening: één tik = start/stop (toggle), snelle dubbel-tik = reset.
  // De single-tap wordt 280ms uitgesteld zodat'ie niet ook afgaat bij een
  // dubbel-tik.
  const lastTapRef = useRef(0)
  const tapTimeoutRef = useRef(null)
  const handleTimerTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 280) {
      // Dubbel-tik → reset
      clearTimeout(tapTimeoutRef.current)
      lastTapRef.current = 0
      onTimerReset && onTimerReset()
    } else {
      lastTapRef.current = now
      clearTimeout(tapTimeoutRef.current)
      tapTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = 0
        onTimerToggle && onTimerToggle()
      }, 280)
    }
  }

  // ✅ Live exercises state — synct met workout prop na swap + reload
  const [liveExercises, setLiveExercises] = useState(workout.exercises || [])

  const handleCustomExerciseSave = (newExercise) => {
    setLiveExercises(prev => [...prev, {
      name: newExercise.name,
      sets: newExercise.sets,
      reps: newExercise.reps,
      rust: newExercise.rust,
      primairSpieren: newExercise.primairSpieren,
      equipment: newExercise.equipment,
      image_url: newExercise.image_url,
      type: 'custom'
    }])
    setShowCustomModal(false)
  }


  // Sync als workout.exercises verandert (na swap reload)
  useEffect(() => {
    console.log('📋 LogModal exercises update:', workout.exercises?.map(e => e.name))
    setLiveExercises(workout.exercises || [])
  }, [workout.exercises])

  useEffect(() => {
    // Inline component — geen body-scroll-lock of escape-binding nodig.
    checkWorkoutCompletion()
  }, [])

  useEffect(() => {
    if (todaysLogs && liveExercises) {
      const logged = new Set(todaysLogs.map(l => l.exercise_name))
      setCompletedCount(liveExercises.filter(ex => logged.has(ex.name)).length)
    }
  }, [todaysLogs, liveExercises])

  const checkWorkoutCompletion = async () => {
    if (!client?.id || !db) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await db.supabase.from('workout_completions').select('completed').eq('client_id', client.id).eq('workout_date', today).single()
      setIsWorkoutCompleted(data?.completed || false)
    } catch { setIsWorkoutCompleted(false) }
  }

  const handleClose = () => { if (onClose) onClose() }

  const handleFinishWorkout = async ({ autoClose = true } = {}) => {
    if (!client?.id || !db) return
    setIsFinishing(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { error } = await db.supabase.from('workout_completions').upsert({ client_id: client.id, workout_date: today, completed: true }, { onConflict: 'client_id,workout_date' })
      if (error) throw error
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50])
      setIsWorkoutCompleted(true)
      // Skip the auto-close when the caller wants to keep the modal open
      // (e.g. flows that need LogModal to stay mounted because they render
      // a child overlay).
      if (autoClose) setTimeout(() => handleClose(), 1200)
      else setIsFinishing(false)
    } catch (e) {
      console.error('❌ Finish workout failed:', e)
      alert('Er ging iets mis. Probeer opnieuw.')
      setIsFinishing(false)
    }
  }

  const handleWorkoutFlowComplete = () => { setShowWorkoutFlow(false); if (onLogsUpdate) onLogsUpdate(); handleFinishWorkout() }

  // Pump-knop opent niet langer de camera direct. We tonen eerst de
  // gallery (PumpGalleryModal) zodat de gebruiker zijn archief ziet — de
  // camera-flow zit als CTA in die gallery. Geen auto-finish meer hier.
  const handleOpenPumpGallery = () => {
    setShowPumpGallery(true)
  }

  const handlePumpGalleryClose = () => {
    setShowPumpGallery(false)
  }

  const buildPumpStats = () => {
    const logs = Array.isArray(todaysLogs) ? todaysLogs : []
    let setsCount = 0
    let volume = 0
    logs.forEach(log => {
      // workout_progress.sets is jsonb — array of { reps, weight, completed }
      const sets = Array.isArray(log?.sets) ? log.sets : []
      sets.forEach(s => {
        if (s?.completed === false) return
        setsCount += 1
        const reps = Number(s?.reps) || 0
        const weight = Number(s?.weight) || 0
        volume += reps * weight
      })
    })
    // Kcal via ACSM MET-formule:
    //   kcal/min = (MET × 3.5 × kg_lichaam) / 200
    // MET 5.5 = matig-zware krachttraining (Compendium of Physical Activities,
    // Ainsworth et al.). Zonder bekend gewicht: fallback 75 kg.
    //
    // De tijd-invoer komt 1) uit de Flow-timer als die gebruikt is, anders
    // 2) een schatting van ~2.5 minuten per set (≈ 45s werk + 90-100s rust,
    // ACSM-richtlijn voor krachttraining). Zo werkt formule 1 altijd.
    const timerUsed = timerSec > 0
    const SEC_PER_SET_ESTIMATE = 150
    const effectiveSec = timerUsed
      ? timerSec
      : (setsCount > 0 ? setsCount * SEC_PER_SET_ESTIMATE : 0)
    const weightKg = Number(client?.current_weight) || 75
    const kcalPerMin = (5.5 * 3.5 * weightKg) / 200
    const kcal = effectiveSec > 0
      ? Math.max(1, Math.round((effectiveSec / 60) * kcalPerMin))
      : null
    return {
      workoutName: workout?.name || workout?.day_display_name || 'Workout',
      exercisesCount: completedCount || (Array.isArray(liveExercises) ? liveExercises.length : 0),
      setsCount: setsCount > 0 ? setsCount : null,
      volume: volume > 0 ? volume : null,
      timerSec: timerUsed ? timerSec : null,
      kcal,
    }
  }

  if (showWorkoutFlow) {
    return (
      <WorkoutFlowWizard
        exercises={liveExercises}
        client={client}
        db={db}
        onComplete={handleWorkoutFlowComplete}
        onClose={() => setShowWorkoutFlow(false)}
      />
    )
  }

  const totalExercises = liveExercises.length || 0
  const progressPct = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingTop: isMobile ? 14 : 18, paddingBottom: isMobile ? 120 : 130 }}>

      {/* ── Video-feedback naar coach — duidelijke knop, opent ClientFeedbackModal ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: isMobile ? '0 1rem 0.6rem' : '0 1.25rem 0.75rem' }}>
        <button
          onClick={() => setShowFeedback(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: isMobile ? '0.65rem 1.1rem' : '0.75rem 1.35rem',
            background: 'rgba(255,215,0,0.1)',
            border: '1px solid rgba(255,215,0,0.4)',
            borderRadius: 12,
            color: '#FFD700',
            fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: 800,
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 4px 14px rgba(255,215,0,0.18)',
          }}
        >
          <Video size={16} /> Video insturen naar je coach
        </button>
      </div>

      {/* ── CONTENT — exercise list ── */}
      <div style={{ width: '100%' }}>

        {/* ✅ Oefeningen — gebruikt liveExercises ipv workout.exercises.
            De `key` is een hash van de huidige oefening-namen, zodat een
            permanent-swap (naam-verandering in het schema) een full remount
            van ExerciseList forceert. Zonder dit blijft React-state soms
            hangen aan de oude oefening tot een hard refresh — verschillende
            useEffect-dep tricks loste het niet betrouwbaar op. */}
        <ExerciseList
          key={(liveExercises || []).map(e => e.name).join('|') || 'empty'}
          exercises={liveExercises}
          todaysLogs={todaysLogs}
          onLogsUpdate={onLogsUpdate}
          client={client}
          schema={schema}
          db={db}
          workoutDayKey={workout.dayKey}
        />

        {/* "+ Eigen oefening" link weggehaald — vervangen door de floating FAB
            in ExerciseList (linksonder, MealLogFAB-stijl). */}
      </div>

      {/* ── FLOATING SECUNDAIRE FABS — Pump + Timer, beide kleine ronde
            cirkels naast de "+ Oefening" FAB linksonder. Display-only:
            timer start/stopt automatisch met de eerste/laatste log. ── */}
      <>
        {/* Pump — ronde gouden knop, opent gallery. */}
        <button
          onClick={handleOpenPumpGallery}
          aria-label="Pump foto's bekijken en toevoegen"
          style={{
            position: 'fixed',
            left: isMobile ? 92 : 110,
            bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? 24 : 28}px)`,
            zIndex: 89,
            width: isMobile ? 54 : 58,
            height: isMobile ? 54 : 58,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(20,20,20,0.96) 0%, rgba(8,8,8,0.96) 100%)',
            border: '2px solid rgba(255,215,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            boxShadow: 'inset 0 0 0 3px rgba(255,215,0,0.08), 0 12px 28px rgba(255,215,0,0.2), 0 4px 12px rgba(0,0,0,0.45)',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'transform 0.15s ease',
          }}
          onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
          onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Camera size={isMobile ? 22 : 24} color="#FFD700" strokeWidth={2.4} />
        </button>

        {/* Timer — de Lucide Timer-icoon IS de knop. Geen losse cirkel
              eromheen. De live mm:ss staat in het midden van de wijzerplaat
              (iets onder center omdat het icoon een steel-tip bovenop heeft).
              Display-only: starten/stoppen gebeurt automatisch. */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleTimerTap}
          aria-label="Workout timer — tik om te starten/stoppen, dubbel-tik om te resetten"
          title={timerRunning ? 'Tik om te pauzeren · dubbel-tik = reset' : timerStarted ? 'Tik om verder te tellen · dubbel-tik = reset' : 'Tik om te starten'}
          style={{
            cursor: 'pointer',
            // Boven de "+ Oefening"-FAB (die staat op left 18/28, bottom 24/28,
            // 76/84 groot). Horizontaal gecentreerd op die knop, met een gaatje
            // erboven zodat de timer er netjes bovenop zit.
            position: 'fixed',
            left: isMobile ? 28 : 39,
            bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? 112 : 124}px)`,
            zIndex: 89,
            width: isMobile ? 56 : 62,
            height: isMobile ? 56 : 62,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', padding: 0,
            filter: timerFinished
              ? 'drop-shadow(0 6px 14px rgba(16,185,129,0.4))'
              : timerRunning
                ? 'drop-shadow(0 6px 18px rgba(255,215,0,0.55))'
                : 'drop-shadow(0 4px 10px rgba(0,0,0,0.55))',
            transition: 'filter 0.25s ease',
            animation: timerRunning ? 'workoutTimerPulse 2.2s ease-in-out infinite' : 'none',
          }}
        >
          {/* Lucide Timer-icoon = de visuele "cirkel" zelf. */}
          <Timer
            size={isMobile ? 56 : 62}
            strokeWidth={1.6}
            color={timerFinished ? '#10b981' : '#FFD700'}
            style={{ position: 'absolute', inset: 0 }}
          />
          {/* Live tijd-display binnen de wijzerplaat. De Timer-icoon heeft
              een steeltje bovenop dus we offsetten het label iets naar
              onder voor optische balans. */}
          <div style={{
            position: 'relative', zIndex: 2,
            marginTop: isMobile ? 6 : 7,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 0,
          }}>
            {timerFinished && (
              <Check size={isMobile ? 9 : 10} color="#10b981" strokeWidth={3} style={{ marginBottom: -1 }} />
            )}
            <span style={{
              fontSize: isMobile ? '0.66rem' : '0.74rem',
              fontWeight: 900,
              color: timerFinished ? '#10b981' : timerRunning ? '#fff' : 'rgba(255,255,255,0.55)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              textShadow: timerRunning ? '0 0 6px rgba(255,215,0,0.45)' : 'none',
            }}>
              {timerStarted ? formatElapsed(timerSec) : '0:00'}
            </span>
          </div>
        </div>
        <style>{`
          @keyframes workoutTimerPulse {
            0%, 100% { filter: drop-shadow(0 6px 18px rgba(255,215,0,0.45)); }
            50%      { filter: drop-shadow(0 8px 22px rgba(255,215,0,0.65)); }
          }
        `}</style>
      </>

      {/* "Workout Voltooid" panel weggehaald — niet meer nodig op de pagina. */}

      {showCustomModal && (
        <CustomExerciseModal
          onClose={() => setShowCustomModal(false)}
          onSave={handleCustomExerciseSave}
          client={client}
          db={db}
          schema={schema}
        />
      )}

      <PumpGalleryModal
        isOpen={showPumpGallery}
        onClose={handlePumpGalleryClose}
        client={client}
        db={db}
        stats={buildPumpStats()}
      />

      {/* Video-feedback naar coach. ClientFeedbackModal is per-oefening; voor
          een workout-brede video geven we de workoutnaam als context mee. */}
      {showFeedback && (
        <ClientFeedbackModal
          exercise={{ name: workout?.name || workout?.dayName || 'Workout' }}
          client={client}
          db={db}
          onClose={() => setShowFeedback(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
