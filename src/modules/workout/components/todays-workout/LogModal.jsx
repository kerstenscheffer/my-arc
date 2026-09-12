// src/modules/workout/components/todays-workout/LogModal.jsx
//
// Was modal — nu een **inline component**. Renders direct in de pagina flow:
// geen backdrop, geen close-knop, geen body scroll-lock. Component-naam blijft
// LogModal voor compat met bestaande imports.
import { CheckCircle, Check, MessageSquare, ChevronDown, Zap, ThumbsUp, Moon, TrendingDown, Thermometer, Plus, Timer } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import ExerciseList from './components/ExerciseList'
import WorkoutFlowWizard from './WorkoutFlowWizard'
import CustomExerciseModal from './components/CustomExerciseModal'

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

      {/* ── ZWEVENDE TIMER ──
            Was een Lucide-klokicoon van 68px met de tijd in de wijzerplaat.
            Zodra je boven het uur kwam paste "3:19:06" niet meer binnen die
            cirkel en liep de tekst eroverheen. Nu een pil: die groeit gewoon
            mee met de tekst.

            De pump-knop stond ernaast en is weg; foto's maak je in de
            Voortgang-tab. ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleTimerTap}
        aria-label="Workout timer — tik om te starten of te pauzeren, dubbel-tik om te resetten"
        title={timerRunning ? 'Tik om te pauzeren · dubbel-tik = reset' : timerStarted ? 'Tik om verder te tellen · dubbel-tik = reset' : 'Tik om te starten'}
        style={{
          position: 'fixed',
          // Onderaan, met de "+ Oefening"-knop erboven. Vaste breedte, want
          // die ronde knop staat er precies op gecentreerd; met een pil die
          // meegroeit met de tekst zou hij bij elk uur verschuiven.
          left: isMobile ? 18 : 28,
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? 24 : 28}px)`,
          zIndex: 89,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          width: isMobile ? 112 : 124,
          height: isMobile ? 42 : 46, padding: '0 0.6rem',
          borderRadius: 999,
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${timerFinished ? 'rgba(16,185,129,0.5)' : timerRunning ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)'}`,
          cursor: 'pointer',
          boxShadow: '0 8px 22px rgba(0,0,0,0.5)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {timerFinished
          ? <Check size={15} color="#10b981" strokeWidth={3} />
          : <Timer size={15} strokeWidth={2.4} color={timerRunning ? '#fff' : 'rgba(255,255,255,0.5)'} />}
        <span style={{
          fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 900,
          color: timerFinished ? '#10b981' : timerRunning ? '#fff' : 'rgba(255,255,255,0.55)',
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1,
        }}>
          {timerStarted ? formatElapsed(timerSec) : '0:00'}
        </span>
      </div>

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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
