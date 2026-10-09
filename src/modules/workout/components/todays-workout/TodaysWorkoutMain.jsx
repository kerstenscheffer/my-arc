// src/modules/workout/components/todays-workout/TodaysWorkoutMain.jsx
//
// Dropdown-render: TodaysWorkoutCard is de altijd-zichtbare header. Klik
// op de Start/Open knop klapt de inline LogModal-content open op de pagina
// (geen modal-popup meer).
import { WorkoutKopSkelet } from '../WorkoutSkelet'
import { useState, useEffect, useRef } from 'react'
import TodaysWorkoutCard from './TodaysWorkoutCard'
import LogModal from './LogModal'
import WorkoutServiceNew from '../../services/WorkoutServiceNew'
import { workoutFoto } from '../../utils/workoutFoto'
import { isWorkoutFullyLogged, workoutCompletionPct } from '../../utils/exerciseCompletion'
import { ontleedPlanKey } from '../../utils/planKey'
import { trainingenVanDag } from '../../utils/extraTrainingen'
import CardioVandaag from './CardioVandaag'
import { useCardioVanDag } from './useCardioVanDag'

// onOpenPlanner is vervallen: op een dag zonder training staat geen knop meer,
// je koppelt hem in de weekstrip eronder.
export default function TodaysWorkoutMain({ client, schema, db, workoutService, onWorkoutCompleted, onSchemaUpdate, scheduleReloadKey, selectedDay, selectedWorkoutKey = null, expanded: controlledExpanded, onExpandedChange }) {
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
  const ooitGeladen = useRef(false)
  // Twee trainingen op één dag: alle sleutels van de dag, en welke open staat.
  const [dagSleutels, setDagSleutels] = useState([])
  const [gekozenKey, setGekozenKey] = useState(null)
  useEffect(() => { setGekozenKey(selectedWorkoutKey || null) }, [selectedWorkoutKey, selectedDay])
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
    // Via de gedeelde helper. Stond hier met .maybeSingle(), die net als
    // .single() een fout geeft zodra er twee rijen zijn — waarna deze code
    // dacht dat er nog geen sessie was en er een nieuwe bijmaakte.
    try {
      const sessie = await db.getOrCreateWorkoutSession(client.id, todayStr, {
        day_display_name: todaysWorkout?.name || 'Workout',
      })
      const naam = todaysWorkout?.name || todaysWorkout?.focus || null
      await db.supabase.from('workout_sessions')
        .update({ duration_minutes: durationMin, ...(naam && /^quick log/i.test(sessie?.day_display_name || '') ? { day_display_name: naam } : {}) })
        .eq('id', sessie.id)
    } catch (e) {
      console.error('Trainingsduur opslaan mislukt:', e)
    }
  }
  // ───────────────────────────────────────────────────────────────────────

  const currentDate = new Date()
  const todayIndex = (currentDate.getDay() + 6) % 7
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  // Cardio van de gekozen dag (uit het weekrooster), naast of in plaats van
  // de training bovenaan.
  const geselecteerdeDatum = (() => {
    const key = (selectedDay && selectedDay !== 'today') ? String(selectedDay).toLowerCase() : null
    const idx = key ? weekDays.findIndex(d => d.toLowerCase() === key) : todayIndex
    const d = new Date(currentDate); d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() + ((idx < 0 ? todayIndex : idx) - todayIndex))
    return d
  })()
  const cardioLijst = useCardioVanDag(client, db, geselecteerdeDatum)

  useEffect(() => {
    if (schema && client?.id) {
      loadTodaysWorkout()
      loadTodaysLogs()
    }
  }, [schema?.id, client?.id, reloadKey, scheduleReloadKey, selectedDay, gekozenKey])

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

      // Zonder opgeslagen plan (lege week) zijn er geen overrides om te laden.
      const schemaWithOverrides = latestSchema?.id ? await WorkoutServiceNew.getSchemaWithOverrides(client.id, latestSchema, db) : latestSchema

      const savedSchedule = await db.getClientWorkoutSchedule(client.id)
      // selectedDay is een dag-key zoals 'monday'..'sunday' (of 'today'/null = vandaag).
      const dayKey = (selectedDay && selectedDay !== 'today') ? selectedDay : weekDays[todayIndex].toLowerCase()
      // Map naar het Schema-formaat (eerste hoofdletter), bv 'monday' → 'Monday'.
      const todayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1)
      // Alle trainingen van de dag (hoofd + extra's); de gekozen tegel wint.
      const sleutelsVanDag = trainingenVanDag(savedSchedule, todayName)
      setDagSleutels(sleutelsVanDag)
      let workoutKey = (gekozenKey && sleutelsVanDag.includes(gekozenKey)) ? gekozenKey : (sleutelsVanDag[0] || null)

      console.log('🏋️ dag:', todayName, '| workoutKey:', workoutKey)

      // Dag uit een ánder plan van de klant (plan_<schemaId>__<dag>). Dat
      // plan wordt dan ook het schema waar het log-scherm tegenaan werkt,
      // zodat overrides en wissels bij de juiste dag landen.
      const pk = ontleedPlanKey(workoutKey)
      if (pk && pk.schemaId === latestSchema.id) {
        workoutKey = pk.dagKey
      } else if (pk) {
        const { data: ander } = await db.supabase
          .from('workout_schemas').select('*').eq('id', pk.schemaId).maybeSingle()
        if (ander?.week_structure?.[pk.dagKey]) {
          const anderMetOverrides = await WorkoutServiceNew.getSchemaWithOverrides(client.id, ander, db)
          setFreshSchema(ander)
          const dayData = anderMetOverrides.week_structure[pk.dagKey]
          setTodaysWorkout({
            ...dayData,
            workoutKey: pk.dagKey, dayKey: pk.dagKey, dayName: todayName,
            isCustom: false, schemaId: ander.id, uitPlan: ander.name,
          })
        } else {
          setTodaysWorkout(null)
        }
        setLoading(false)
        return
      }

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
            // Met oefeningen (eigen gymdag, 9 okt 2026) toont de pagina de
            // oefeningkaarten zoals bij een plan-dag; zonder is het de oude
            // cardio-achtige eigen training.
            const oef = Array.isArray(customWorkout.exercises) ? customWorkout.exercises : []
            setTodaysWorkout({
              name: customWorkout.name,
              focus: oef.length ? 'Eigen training' : getLabel(customWorkout.type),
              geschatteTijd: `${customWorkout.duration} min`,
              exercises: oef, workoutKey, dayKey: workoutKey, dayName: todayName,
              isCustom: true, customData: customWorkout,
            })
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
    ooitGeladen.current = true
  }

  const getLabel = (type) => ({ cardio: 'Cardio', cycling: 'Fietsen', running: 'Hardlopen', swimming: 'Zwemmen', hiking: 'Wandelen', yoga: 'Yoga', sports: 'Sport', custom: 'Custom' }[type] || type)

  const loadTodaysLogs = async () => {
    if (!client?.id || !db) return
    try { setTodaysLogs(await db.getTodaysWorkoutLogs(client.id)) } catch { setTodaysLogs([]) }
    // Het weekrooster luistert hiernaar om 'Gedaan' op de dag te zetten.
    window.dispatchEvent(new CustomEvent('myarc:workout-changed'))
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

  // Spinner alleen bij de allereerste keer laden. Bij een andere dag blijft
  // de vorige kop staan (iets gedimd) en vervaagt de nieuwe erin; het blok
  // sprong anders eerst naar een spinnerkaartje en dan hard naar de nieuwe
  // training (9 okt 2026).
  const dagFade = (inhoud) => (
    <div key={`${selectedDay || 'today'}|${todaysWorkout?.customData?.id || todaysWorkout?.workoutKey || 'leeg'}`}
      style={{ animation: 'dagFade 0.32s cubic-bezier(0.22, 1, 0.36, 1)', opacity: loading ? 0.55 : 1, transition: 'opacity 0.2s ease' }}>
      <style>{'@keyframes dagFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } }'}</style>
      {inhoud}
    </div>
  )
  // Eerste keer laden: de vorm van de kop in plaats van een spinner.
  if (loading && !ooitGeladen.current) return <WorkoutKopSkelet isMobile={isMobile} />

  // Geen training vandaag: dezelfde kop als een gewone dag — foto die onderin
  // wegloopt in het zwart met de titel eroverheen. Zonder foto viel de pagina
  // terug op een geel kaartje met een knop, wat er als een foutmelding uitzag.
  // De knop is weg: plannen doe je in de weekstrip die er direct onder staat.
  if (!todaysWorkout && cardioLijst.length > 0) return dagFade(
    <CardioVandaag lijst={cardioLijst} isMobile={isMobile} volledig />
  )

  if (!todaysWorkout) return dagFade(
    <div style={{ position: 'relative', width: '100%', height: isMobile ? 200 : 250 }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${workoutFoto(null)})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.75,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0) 32%, rgba(10,10,10,0.78) 70%, #0a0a0a 100%)',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: isMobile ? 10 : 14,
        padding: isMobile ? '0 1rem' : '0 1.5rem',
      }}>
        <div style={{
          fontSize: isMobile ? '1.7rem' : '2.4rem',
          fontWeight: 900, color: '#fff',
          letterSpacing: '-0.03em', lineHeight: 1.05,
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}>
          Geen workout gepland
        </div>
        <div style={{
          marginTop: 4,
          fontSize: isMobile ? '0.78rem' : '0.85rem',
          fontWeight: 800, color: 'rgba(255,255,255,0.6)',
          textShadow: '0 2px 10px rgba(0,0,0,0.7)',
        }}>
          Koppel hieronder een workout aan deze dag.
        </div>
      </div>
    </div>
  )

  // Kop bovenaan de pagina: de foto van de trainingsdag die onderin dood
  // loopt in het zwart, met "Vandaags workout" eroverheen. Dezelfde vorm als
  // de kop boven de oefeningenlijst, zodat de pagina en het log-scherm op
  // elkaar lijken. De kaart eronder laat zijn eigen foto dan weg.
  const kop = (
    <div style={{ position: 'relative', width: '100%', height: isMobile ? 200 : 250 }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${workoutFoto(todaysWorkout)})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0) 32%, rgba(10,10,10,0.78) 70%, #0a0a0a 100%)',
      }} />
      {/* De titel staat in de kaart eronder, die over de uitloop van de
          foto heen schuift: zo staan titel, pijl en cijfers bij elkaar. */}
    </div>
  )

  // Schakelaar tussen de trainingen van de dag (alleen bij twee of meer).
  const naamVanSleutel = (k) => {
    if (!k) return 'Training'
    const ws = freshSchema?.week_structure || {}
    if (ws[k]) return ws[k].name || ws[k].focus || k
    if (todaysWorkout && (todaysWorkout.workoutKey === k || (k.startsWith('custom_') && todaysWorkout.customData?.id === k.replace('custom_', '')))) return todaysWorkout.name || 'Training'
    if (k.startsWith('custom_')) return 'Eigen training'
    const pk = ontleedPlanKey(k)
    return pk ? 'Ander plan' : k
  }
  const actieveSleutel = todaysWorkout?.customData?.id ? `custom_${todaysWorkout.customData.id}` : todaysWorkout?.workoutKey
  const schakelaar = dagSleutels.length > 1 ? (
    <div style={{ display: 'flex', gap: 6, padding: isMobile ? '0.6rem 1rem 0' : '0.75rem 1.5rem 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
      {dagSleutels.map((k, i) => {
        const aan = gekozenKey ? gekozenKey === k : (actieveSleutel ? actieveSleutel === k || (ontleedPlanKey(k)?.dagKey === actieveSleutel) : i === 0)
        return (
          <button key={k} onClick={() => setGekozenKey(k)} style={{
            flexShrink: 0, padding: '0.45rem 0.85rem', borderRadius: 999, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer',
            background: aan ? '#fff' : 'rgba(255,255,255,0.06)', color: aan ? '#0a0a0a' : '#fff',
            border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>{i + 1}. {naamVanSleutel(k)}</button>
        )
      })}
    </div>
  ) : null

  const kaart = (
    <TodaysWorkoutCard
      workout={todaysWorkout}
      onLogClick={() => { setExpanded(e => !e); loadTodaysLogs() }}
      logsCount={todaysLogs.length}
      isCompleted={isWorkoutFullyLogged(todaysWorkout?.exercises, todaysLogs)}
      completionPct={workoutCompletionPct(todaysWorkout?.exercises, todaysLogs)}
      client={client}
      db={db}
      isExpanded={expanded}
      zonderFoto
      timerElapsedSec={timerElapsedSec}
      timerRunning={timerRunning}
      timerStarted={timerStarted}
      timerFinished={timerFinished}
      onTimerToggle={toggleTimer}
      onTimerReset={resetTimer}
    />
  )

  // Uitgeklapt is dit een scherm op zichzelf: de kop met de foto, de timer en
  // de naam blijft staan, en alleen de oefeningen scrollen. Stond eerder als
  // twee blokken in de paginascroll, waardoor je de kop kwijt was zodra je
  // naar de vierde oefening ging — en dus ook de timer en de sluitknop.
  if (expanded) {
    return (
      <>
        <div style={{
          // Boven de zwevende dingen van het dashboard: de widgetbalk staat op
          // 99 en de check-in-melding op 90. Die hoorden hier niet overheen te
          // liggen — dit scherm is waar je mee bezig bent. De onderbalk blijft
          // er wél boven (101), zodat je nog van tab kunt wisselen.
          position: 'fixed', inset: 0, height: '100dvh', zIndex: 100,
          background: '#0a0a0a',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ flexShrink: 0 }}>{schakelaar}{kaart}</div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <LogModal
              workout={todaysWorkout}
              todaysLogs={todaysLogs}
              onClose={loadTodaysLogs}
              onLogsUpdate={handleLogsUpdate}
              client={client}
              schema={freshSchema}
              db={db}
            />
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    )
  }

  return dagFade(
    <>
      {kop}
      <div style={{ position: 'relative', zIndex: 1, marginTop: isMobile ? -64 : -84 }}>{schakelaar}{kaart}</div>
      {/* Staat er die dag ook cardio, dan direct onder de training. */}
      <CardioVandaag lijst={cardioLijst} isMobile={isMobile} />
    </>
  )
}
