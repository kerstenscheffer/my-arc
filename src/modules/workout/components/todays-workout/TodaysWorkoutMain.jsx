// src/modules/workout/components/todays-workout/TodaysWorkoutMain.jsx
import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import TodaysWorkoutCard from './TodaysWorkoutCard'
import LogModal from './LogModal'
import CustomExerciseModal from './components/CustomExerciseModal'
import WorkoutServiceNew from '../../services/WorkoutServiceNew'

export default function TodaysWorkoutMain({ client, schema, db, workoutService, onWorkoutCompleted, onSchemaUpdate, scheduleReloadKey }) {
  const isMobile = window.innerWidth <= 768
  const [showLogModal, setShowLogModal] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [todaysLogs, setTodaysLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [freshSchema, setFreshSchema] = useState(schema)

  const lastReportedSchemaUpdatedAt = useRef(null)

  const currentDate = new Date()
  const todayIndex = (currentDate.getDay() + 6) % 7
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    if (schema && client?.id) {
      loadTodaysWorkout()
      loadTodaysLogs()
    }
  }, [schema?.id, client?.id, reloadKey, scheduleReloadKey])

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
      const todayName = weekDays[todayIndex]
      const workoutKey = savedSchedule?.[todayName] || null

      console.log('🏋️ todayName:', todayName, '| workoutKey:', workoutKey)

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

  const handleCustomExerciseSave = (newExercise) => {
    setTodaysWorkout(prev => {
      if (!prev) return prev
      return { ...prev, exercises: [...(prev.exercises || []), { name: newExercise.name, sets: newExercise.sets, reps: newExercise.reps, rust: newExercise.rust, primairSpieren: newExercise.primairSpieren, equipment: newExercise.equipment, image_url: newExercise.image_url, type: 'custom' }] }
    })
    if (newExercise._addedToDay) triggerReload()
    setShowCustomModal(false)
  }

  if (!schema) return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
      <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(249,115,22,0.2)', padding: isMobile ? '1.5rem' : '2rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600' }}>Nog geen workout schema toegewezen</p>
      </div>
    </div>
  )

  if (loading) return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
      <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(249,115,22,0.2)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(249,115,22,0.2)', borderTopColor: '#f97316', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
      </div>
    </div>
  )

  if (!todaysWorkout) return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
      <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(249,115,22,0.2)', padding: isMobile ? '1.5rem' : '2rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600' }}>🌙 Rustdag — geen workout vandaag</p>
      </div>
    </div>
  )

  return (
    <>
      <TodaysWorkoutCard workout={todaysWorkout} onLogClick={() => { setShowLogModal(true); loadTodaysLogs() }} logsCount={todaysLogs.length} client={client} db={db} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <button onClick={() => setShowCustomModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: 'transparent', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '6px', color: 'rgba(255,215,0,0.7)', fontSize: isMobile ? '0.72rem' : '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '32px' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,215,0,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <Plus size={13} strokeWidth={2.5} />
          Eigen Oefening
        </button>
      </div>

      {showLogModal && (
        <LogModal workout={todaysWorkout} todaysLogs={todaysLogs} onClose={() => { setShowLogModal(false); loadTodaysLogs() }} onLogsUpdate={handleLogsUpdate} client={client} schema={freshSchema} db={db} />
      )}

      {showCustomModal && (
        <CustomExerciseModal onClose={() => setShowCustomModal(false)} onSave={handleCustomExerciseSave} client={client} db={db} schema={freshSchema} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
