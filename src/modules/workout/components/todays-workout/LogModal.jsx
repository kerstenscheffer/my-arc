// src/modules/workout/components/todays-workout/LogModal.jsx
//
// Was modal — nu een **inline component**. Renders direct in de pagina flow:
// geen backdrop, geen close-knop, geen body scroll-lock. Component-naam blijft
// LogModal voor compat met bestaande imports.
import { CheckCircle, Check, MessageSquare, ChevronDown, Zap, ThumbsUp, Moon, TrendingDown, Thermometer, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import ExerciseList from './components/ExerciseList'
import WorkoutFlowWizard from './WorkoutFlowWizard'
import CustomExerciseModal from './components/CustomExerciseModal'

export default function LogModal({
  workout, todaysLogs, onClose, onLogsUpdate, client, schema, db,
}) {
  const isMobile = window.innerWidth <= 768
  const [completedCount, setCompletedCount] = useState(0)
  const [isFinishing, setIsFinishing] = useState(false)
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false)
  const [showWorkoutFlow, setShowWorkoutFlow] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  // De timer staat sinds deze wijziging in de kop (TodaysWorkoutCard), boven
  // de foto van de dag. Hij hoorde bij de lijst maar zweefde over de pagina,
  // en nu de kop blijft staan terwijl je scrolt is dat de logische plek.

  // ✅ Live exercises state — synct met workout prop na swap + reload
  // Overgeslagen oefeningen (prullenbak → "alleen deze week") horen niet in de
  // doorloop-flow; die zou anders op een oefening blijven staan die de klant
  // net uit de lijst haalde.
  const [liveExercises, setLiveExercises] = useState(actieveOefeningen(workout.exercises))

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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingTop: isMobile ? 10 : 14, paddingBottom: isMobile ? 130 : 140 }}>

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
