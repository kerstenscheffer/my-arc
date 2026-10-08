// src/modules/manual-workout-builder/components/KlantWeekrooster.jsx
//
// Het weekrooster van de klant, precies zoals hij het op zijn workout-
// pagina ziet (WeekSchedule): dagtegels met training en cardio, stappen,
// pijltjes om te schuiven, Training toevoegen. Hier in de Workout Builder,
// zodat de coach op dezelfde plek plant als de klant zelf kijkt. Zelfde
// onderdeel, geen kopie: wat hier verandert, ziet de klant direct.

import { useEffect, useState } from 'react'
import WeekSchedule from '../../workout/components/WeekSchedule'
import useWorkoutSchedule from '../../workout/hooks/useWorkoutSchedule'
import WorkoutService from '../../../services/WorkoutService'

const LEEG_SCHEMA = { id: null, name: 'Nog geen plan', week_structure: {} }

export default function KlantWeekrooster({ client, db, isMobile = false, onSwitchPlan = null, refreshKey = 0 }) {
  const [schema, setSchema] = useState(null)
  const [workoutService] = useState(() => new WorkoutService(db.supabase))
  const [weekOffset, setWeekOffset] = useState(0)

  // Actieve plan van de klant; zonder plan een lege week.
  useEffect(() => {
    if (!client?.id || !db) { setSchema(LEEG_SCHEMA); return }
    let weg = false
    ;(async () => {
      try {
        const s = client.assigned_schema_id ? await db.getClientSchema(client.id) : null
        if (!weg) setSchema(s || LEEG_SCHEMA)
      } catch { if (!weg) setSchema(LEEG_SCHEMA) }
    })()
    return () => { weg = true }
  }, [client?.id, client?.assigned_schema_id, db, refreshKey])

  const { weekSchedule, setWeekSchedule, swapMode, selectedWorkout } = useWorkoutSchedule(schema || LEEG_SCHEMA, client?.id, db)
  const todayIndex = (new Date().getDay() + 6) % 7

  if (!client?.id || !schema) return null

  return (
    <WeekSchedule
      weekSchedule={weekSchedule}
      schema={schema}
      swapMode={swapMode}
      selectedWorkout={selectedWorkout}
      completedWorkouts={[]}
      todayIndex={todayIndex}
      // De coach opent geen training vanuit het rooster; tikken doet niets.
      onDayClick={() => {}}
      clientId={client.id}
      db={db}
      workoutService={workoutService}
      onScheduleUpdate={(nieuw) => setWeekSchedule(nieuw)}
      onOpenWizard={() => {}}
      onSwitchPlan={onSwitchPlan}
      weekOffset={weekOffset}
      onWeekOffsetChange={setWeekOffset}
      client={client}
      isMobile={isMobile}
    />
  )
}
