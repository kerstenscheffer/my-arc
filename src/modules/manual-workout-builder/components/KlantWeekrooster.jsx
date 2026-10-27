// src/modules/manual-workout-builder/components/KlantWeekrooster.jsx
//
// Het weekrooster van de klant, precies zoals hij het op zijn workout-
// pagina ziet (WeekSchedule): dagtegels met training en cardio, stappen,
// pijltjes om te schuiven, Training toevoegen. Hier in de Workout Builder,
// zodat de coach op dezelfde plek plant als de klant zelf kijkt. Zelfde
// onderdeel, geen kopie: wat hier verandert, ziet de klant direct.

import { useEffect, useMemo, useState } from 'react'
import WeekSchedule from '../../workout/components/WeekSchedule'
import useWorkoutSchedule from '../../workout/hooks/useWorkoutSchedule'
import WorkoutService from '../../../services/WorkoutService'

const LEEG_SCHEMA = { id: null, name: 'Nog geen plan', week_structure: {} }

// `voorbeeld` = { schemaId, week }: de onopgeslagen stand uit de Workout
// Builder. Is dat het actieve plan van de klant, dan toont het rooster die
// stand meteen (namen, oefeningen), nog vóór opslaan (Kersten, 27 okt 2026).
export default function KlantWeekrooster({ client, db, isMobile = false, onSwitchPlan = null, refreshKey = 0, zonderKop = false, onKiesTraining = null, voorbeeld = null }) {
  const [schema, setSchema] = useState(null)
  const [workoutService] = useState(() => new WorkoutService(db.supabase))
  const [weekOffset, setWeekOffset] = useState(0)

  // Actieve plan van de klant; zonder plan een lege week.
  useEffect(() => {
    if (!client?.id || !db) { setSchema(LEEG_SCHEMA); return }
    let weg = false
    ;(async () => {
      try {
        // Altijd vers uit de database; het client-object kan een oud
        // assigned_schema_id hebben (cache in DatabaseService).
        const s = await db.getClientSchema(client.id)
        if (!weg) setSchema(s || LEEG_SCHEMA)
      } catch { if (!weg) setSchema(LEEG_SCHEMA) }
    })()
    return () => { weg = true }
  }, [client?.id, client?.assigned_schema_id, db, refreshKey])

  const { weekSchedule, setWeekSchedule, swapMode, selectedWorkout } = useWorkoutSchedule(schema || LEEG_SCHEMA, client?.id, db)
  const todayIndex = (new Date().getDay() + 6) % 7

  // Alleen de weergave krijgt de voorbeeldstand; de hook hierboven houdt het
  // opgeslagen plan, anders laadt hij bij elke tik de indeling opnieuw.
  const voorbeeldSleutel = voorbeeld?.week ? JSON.stringify(voorbeeld.week) : ''
  const getoond = useMemo(() => (
    schema?.id && voorbeeld?.schemaId === schema.id && voorbeeld?.week
      ? { ...schema, week_structure: voorbeeld.week }
      : schema
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [schema, voorbeeld?.schemaId, voorbeeldSleutel])

  if (!client?.id || !schema) return null

  return (
    <WeekSchedule
      weekSchedule={weekSchedule}
      schema={getoond}
      swapMode={swapMode}
      selectedWorkout={selectedWorkout}
      completedWorkouts={[]}
      todayIndex={todayIndex}
      // Tik op een training: in de Workout Builder opent die dag. Verder
      // opent de coach vanuit het rooster niets.
      onDayClick={(_dag, key) => { if (onKiesTraining && key) onKiesTraining(key) }}
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
      zonderKop={zonderKop}
    />
  )
}
