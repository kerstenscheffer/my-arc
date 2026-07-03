// src/modules/workout/components/todays-workout/TodaysWorkoutMain.jsx
//
// Dropdown-render: TodaysWorkoutCard is de altijd-zichtbare header. Klik
// op de Start/Open knop klapt de inline LogModal-content open op de pagina
// (geen modal-popup meer).
import { useState, useEffect, useRef } from 'react'
import TodaysWorkoutCard from './TodaysWorkoutCard'
import LogModal from './LogModal'
import WorkoutServiceNew from '../../services/WorkoutServiceNew'
import { isWorkoutFullyLogged, workoutCompletionPct } from '../../utils/exerciseCompletion'

export default function TodaysWorkoutMain({ client, schema, db, workoutService, onWorkoutCompleted, onSchemaUpdate, scheduleReloadKey, onOpenPlanner, selectedDay, expanded: controlledExpanded, onExpandedChange }) {
  const isMobile = window.innerWidth <= 768
  // Controlled wanneer parent een `expanded` prop meegeeft (bv. zodat een
  // week-day-click de dropdown van buitenaf kan openen). Anders intern.
  const [internalExpanded, setInternalExpanded] = useState(false)
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const setExpanded = (v) => {
    const next = typeof v === 'function' ? v(expanded) : v
    if (controlledExpanded === undefined) setInternalExpanded(next)
    if (onExpandedChange) onExpandedChange(next)
  }
  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [todaysLogs, setTodaysLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [freshSchema, setFreshSchema] = useState(schema)

  const lastReportedSchemaUpdatedAt = useRef(null)

  // ── PUMP-TIMER ─────────────────────────────────────────────────────────
  // Wall-clock timer (start/stop timestamps in localStorage). Hoort hier en
  // niet in LogModal, omdat LogModal unmount wanneer de dropdown dichtgaat —
  // de timer moet doorlopen tot iemand de laatste oefening logt of'm zelf
  // stopt. Per (client, datum) één timer.
  const todayStr = new Date().toISOString().split('T')[0]
  const timerStorageKey = client?.id ? `pumpTimer:${client.id}:${todayStr}` : null
  // Timer-state: ondersteunt pauzeren/hervatten via accumulatedSec, plus
  // handmatige bediening (klik = start/stop, dubbel-tap = reset).
  const [timer, setTimer] = useState({ running: false, startedAt: null, accumulatedSec: 0, finished: false })
  // Hydrate uit localStorage (oude {startedAt,stoppedAt}-vorm wordt genormaliseerd).
  useEffect(() => {
    if (!timerStorageKey) return
    try {
      const raw = localStorage.getItem(timerStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setTimer({
            running: !!parsed.running,
            startedAt: parsed.running ? (parsed.startedAt || null) : null,
            accumulatedSec: Number(parsed.accumulatedSec) || 0,
            finished: !!parsed.finished,
          })
        }
      }
    } catch { /* localStorage niet beschikbaar — geen probleem */ }
  }, [timerStorageKey])
  // Schrijf naar localStorage zodra timer-state verandert; wis pas bij volledige reset.
  useEffect(() => {
    if (!timerStorageKey) return
    try {
      if (timer.running || timer.accumulatedSec > 0 || timer.finished) {
        localStorage.setItem(timerStorageKey, JSON.stringify(timer))
      } else {
        localStorage.removeItem(timerStorageKey)
      }
    } catch { /* localStorage niet beschikbaar — geen probleem */ }
  }, [timer, timerStorageKey])
  // Tick — forceer re-render per seconde zolang timer loopt.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!timer.running) return
    const id = setInterval(() => setTick(t => (t + 1) % 1000000), 1000)
    return () => clearInterval(id)
  }, [timer.running])
  // Afgeleide waarden voor consumenten (LogModal).
  const liveRunSec = timer.running && timer.startedAt ? Math.floor((Date.now() - timer.startedAt) / 1000) : 0
  const timerElapsedSec = timer.accumulatedSec + liveRunSec
  const timerRunning = !!timer.running
  const timerStarted = timer.running || timer.accumulatedSec > 0
  const timerFinished = !!timer.finished

  // Onder deze duur slaan we niets op — voorkomt dat losse tikken / resets de
  // DB vervuilen. ("Stop gaat na 5 min opslaan in dB.")
  const TIMER_SAVE_THRESHOLD_SEC = 300

  // ── Handmatige bediening: klik = start/stop, dubbel-tap = reset ──
  const startTimer = () => {
    setTimer(prev => prev.running ? prev : { ...prev, running: true, startedAt: Date.now(), finished: false })
  }
  const stopTimer = (markFinished = false) => {
    if (!timer.running) {
      if (markFinished && !timer.finished) setTimer(prev => ({ ...prev, finished: true }))
      return
    }
    const add = timer.startedAt ? Math.floor((Date.now() - timer.startedAt) / 1000) : 0
    const total = timer.accumulatedSec + add
    setTimer({ running: false, startedAt: null, accumulatedSec: total, finished: markFinished })
    // Opslaan alleen als de timer minstens de drempel (5 min) liep.
    if (total >= TIMER_SAVE_THRESHOLD_SEC) {
      saveTimerToSession(total).catch(e => console.error('Save pump-timer to session failed:', e))
    }
  }
  const toggleTimer = () => { timer.running ? stopTimer(false) : startTimer() }
  const resetTimer = () => {
    setTimer({ running: false, startedAt: null, accumulatedSec: 0, finished: false })
    if (navigator.vibrate) navigator.vibrate([10, 40, 10])
  }

  // Auto-start: timer begint zodra de eerste set van een card gelogd wordt.
  const prevLogCountRef = useRef(null)
  useEffect(() => {
    const currentCount = (todaysLogs || []).length
    if (prevLogCountRef.current === null) {
      prevLogCountRef.current = currentCount
      return
    }
    if (prevLogCountRef.current === 0 && currentCount > 0 && !timer.running && timer.accumulatedSec === 0 && !timer.finished) {
      setTimer({ running: true, startedAt: Date.now(), accumulatedSec: 0, finished: false })
      if (navigator.vibrate) navigator.vibrate(15)
    }
    prevLogCountRef.current = currentCount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysLogs])
  // Auto-stop: zodra de LAATSTE oefening 2x gelogd is, stoppen + opslaan.
  useEffect(() => {
    const exs = todaysWorkout?.exercises || []
    if (exs.length === 0 || !timer.running) return
    const lastName = exs[exs.length - 1]?.name
    if (!lastName) return
    const lastCount = (todaysLogs || []).filter(l => l.exercise_name === lastName).length
    if (lastCount >= 2) stopTimer(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysLogs, todaysWorkout, timer.running])

  const saveTimerToSession = async (durationSec) => {
    if (!client?.id || !db?.supabase) return
    const durationMin = Math.max(1, Math.round(durationSec / 60))
    const today = todayStr
    const { data: existing } = await db.supabase
      .from('workout_sessions')
      .select('id')
      .eq('client_id', client.id)
      .eq('workout_date', today)
      .maybeSingle()
    if (existing?.id) {
      await db.supabase.from('workout_sessions')
        .update({ duration_minutes: durationMin })
        .eq('id', existing.id)
    } else {
      await db.supabase.from('workout_sessions').insert({
        client_id: client.id,
        user_id: client.id,
        workout_date: today,
        day_name: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        day_display_name: todaysWorkout?.name || 'Workout',
        duration_minutes: durationMin,
        created_at: new Date().toISOString(),
      })
    }
  }
  // ───────────────────────────────────────────────────────────────────────

  const currentDate = new Date()
  const todayIndex = (currentDate.getDay() + 6) % 7
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    if (schema && client?.id) {
      loadTodaysWorkout()
      loadTodaysLogs()
    }
  }, [schema?.id, client?.id, reloadKey, scheduleReloadKey, selectedDay])

  const loadTodaysWorkout = async () => {
    if (!client?.id || !db) { setLoading(false); return }
    console.log('🏋️ loadTodaysWorkout START')
    try {
      let latestSchema = schema

      if (client.assigned_schema_id) {
        const { data: schemaData, error } = await db.supabase
          .from('workout_schemas').select('*').eq('id', client.assigned_schema_id).single()
        if (!error && schemaData) {
          latestSchema = schemaData
          setFreshSchema(schemaData)
          console.log('🏋️ Schema geladen:', latestSchema.id)
          if (onSchemaUpdate && schemaData.updated_at !== lastReportedSchemaUpdatedAt.current) {
            lastReportedSchemaUpdatedAt.current = schemaData.updated_at
            onSchemaUpdate(schemaData)
          }
        }
      }

      if (!latestSchema?.week_structure) { setLoading(false); return }

      console.log('🏋️ Week structure keys:', Object.keys(latestSchema.week_structure))

      const schemaWithOverrides = await WorkoutServiceNew.getSchemaWithOverrides(client.id, latestSchema, db)

      const savedSchedule = await db.getClientWorkoutSchedule(client.id)
      // selectedDay is een dag-key zoals 'monday'..'sunday' (of 'today'/null = vandaag).
      const dayKey = (selectedDay && selectedDay !== 'today') ? selectedDay : weekDays[todayIndex].toLowerCase()
      // Map naar het Schema-formaat (eerste hoofdletter), bv 'monday' → 'Monday'.
      const todayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1)
      const workoutKey = savedSchedule?.[todayName] || null

      console.log('🏋️ dag:', todayName, '| workoutKey:', workoutKey)

      if (workoutKey && schemaWithOverrides.week_structure[workoutKey]) {
        const dayData = schemaWithOverrides.week_structure[workoutKey]
        console.log('🏋️ Dag exercises:', dayData.exercises?.map(e => e.name))
        setTodaysWorkout({
          ...dayData,
          workoutKey,
          dayKey: workoutKey,
          dayName: todayName,
          isCustom: false,
          schemaId: latestSchema.id
        })
      } else if (workoutKey && workoutKey.startsWith('custom_')) {
        const customId = workoutKey.replace('custom_', '')
        try {
          const customWorkout = await workoutService.getCustomWorkoutById(customId)
          if (customWorkout) {
            setTodaysWorkout({ name: customWorkout.name, focus: getLabel(customWorkout.type), geschatteTijd: `${customWorkout.duration} min`, exercises: [], workoutKey, dayKey: workoutKey, dayName: todayName, isCustom: true, customData: customWorkout })
          } else setTodaysWorkout(null)
        } catch { setTodaysWorkout(null) }
      } else {
        console.log('🏋️ Geen workout voor vandaag')
        setTodaysWorkout(null)
      }
    } catch (error) {
      console.error('❌ Error loading workout:', error)
      setTodaysWorkout(null)
    }
    setLoading(false)
  }

  const getLabel = (type) => ({ cardio: 'Cardio', cycling: 'Fietsen', running: 'Hardlopen', swimming: 'Zwemmen', hiking: 'Wandelen', yoga: 'Yoga', sports: 'Sport', custom: 'Custom' }[type] || type)

  const loadTodaysLogs = async () => {
    if (!client?.id || !db) return
    try { setTodaysLogs(await db.getTodaysWorkoutLogs(client.id)) } catch { setTodaysLogs([]) }
  }

  const triggerReload = () => setReloadKey(prev => prev + 1)

  const handleLogsUpdate = async (options) => {
    if (options?.reloadSchema) {
      triggerReload()
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
    } else {
      await loadTodaysLogs()
    }
    if (options?.workoutCompleted && onWorkoutCompleted) onWorkoutCompleted()
  }

  if (!schema) return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
      <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 12, padding: isMobile ? '1.5rem' : '2rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600' }}>Nog geen workout schema toegewezen</p>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
      <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 12, padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,215,0,0.2)', borderTopColor: '#FFD700', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
      </div>
    </div>
  )

  if (!todaysWorkout) return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
      <div style={{
        background: 'linear-gradient(180deg, rgba(255,215,0,0.06) 0%, rgba(0,0,0,0.7) 100%)',
        border: '1px solid rgba(255,215,0,0.25)',
        borderRadius: 12,
        padding: isMobile ? '1.5rem 1.25rem' : '2rem',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: 800,
          color: '#FFD700',
          letterSpacing: '-0.01em',
          marginBottom: '0.4rem',
        }}>
          Geen workout ingepland
        </div>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          margin: '0 0 1rem',
          fontSize: isMobile ? '0.78rem' : '0.85rem',
          lineHeight: 1.4,
        }}>
          Stel je trainingsweek samen — koppel een workout aan deze dag.
        </p>
        {onOpenPlanner && (
          <button
            onClick={onOpenPlanner}
            style={{
              padding: isMobile ? '0.7rem 1.25rem' : '0.8rem 1.5rem',
              background: '#FFD700',
              border: 'none',
              borderRadius: 10,
              color: '#000',
              fontSize: isMobile ? '0.82rem' : '0.88rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              minHeight: 44,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: '0 4px 16px rgba(255,215,0,0.25)',
            }}
          >
            Plan hier je workout
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Header-card: altijd zichtbaar, klikbaar om de oefenlijst uit te klappen. */}
      <TodaysWorkoutCard
        workout={todaysWorkout}
        onLogClick={() => { setExpanded(e => !e); loadTodaysLogs() }}
        logsCount={todaysLogs.length}
        isCompleted={isWorkoutFullyLogged(todaysWorkout?.exercises, todaysLogs)}
        completionPct={workoutCompletionPct(todaysWorkout?.exercises, todaysLogs)}
        client={client}
        db={db}
        isExpanded={expanded}
      />

      {/* Inline workout-content — alleen tonen als de card uitgeklapt is. */}
      {expanded && (
        <LogModal
          workout={todaysWorkout}
          todaysLogs={todaysLogs}
          onClose={loadTodaysLogs}
          onLogsUpdate={handleLogsUpdate}
          client={client}
          schema={freshSchema}
          db={db}
          timerElapsedSec={timerElapsedSec}
          timerRunning={timerRunning}
          timerStarted={timerStarted}
          timerFinished={timerFinished}
          onTimerToggle={toggleTimer}
          onTimerReset={resetTimer}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
