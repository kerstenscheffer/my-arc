// src/modules/workout/components/week-schedule/WeekGrid.jsx
//
// Toont een rij van 7 dag-cards. Drag-and-drop is verwijderd ten gunste van
// chevron-knoppen binnenin elke card (zie DayCard). De cards reageren alleen
// nog op tap-to-open.
import DayCard from './DayCard'

export default function WeekGrid({
  tempSchedule, weekDays, todayIndex, completedWorkouts,
  selectedWorkout, selectedForSwap, swapMode, localSwapMode,
  getWorkoutData, onDayClick, onSwapClick, onShift, isMobile,
  dayDates, kanPlannen = true, kanOpenen = true, gedimd = false,
  rustPerDag = {},
  cardioPerDag = {},
  onCardioShift = null,
  trainingTijdPerDag = {},
}) {
  // Lege rustdagen smal, dagen met training of cardio breed: dan is er ruimte
  // voor de naam van de sport in plaats van zeven even smalle vakjes.
  const leeg = weekDays.map((day, i) => !tempSchedule[day] && !(cardioPerDag[i]?.length))
  const kolommen = leeg.map(l => (l ? 'minmax(0, 0.55fr)' : 'minmax(0, 1.6fr)')).join(' ')
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

  // Een komende week mag je wél indelen (pijltjes) maar niet openen: de
  // workout van vandaag hoort bij vandaag.
  const handleCardClick = (day, assignedWorkout) => {
    if (localSwapMode) { if (kanPlannen) onSwapClick(day, assignedWorkout); return }
    if (!kanOpenen) return
    onDayClick(day, assignedWorkout)
  }

  const gap = isMobile ? '0.3rem' : '0.5rem'
  return (<>
    {/* Eén dagenstrook boven het rooster, in dezelfde kolommen als de
        kaarten: dag en datum, vandaag als witte pil. De kaarten zelf hebben
        geen label meer, dus de tegels krijgen de hoogte. */}
    <div style={{ display: 'grid', gridTemplateColumns: kolommen, gap, minWidth: 0, width: '100%', marginBottom: isMobile ? 4 : 6 }}>
      {weekDays.map((day, index) => {
        const vandaag = kanOpenen && index === todayIndex
        const d = dayDates ? dayDates[index] : null
        return (
          <div key={day} style={{
            minWidth: 0, textAlign: 'center', minHeight: isMobile ? 22 : 26, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            background: vandaag ? '#fff' : 'transparent',
            color: vandaag ? '#000' : (leeg[index] ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.7)'),
            fontSize: isMobile ? '0.62rem' : '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
            whiteSpace: 'nowrap', overflow: 'hidden',
          }}>
            {weekDaysDutch[index]}{d && !leeg[index] ? <span style={{ fontWeight: 800, opacity: vandaag ? 0.75 : 0.6, letterSpacing: 0 }}>{d.getDate()}</span> : null}
          </div>
        )
      })}
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: kolommen,
      gap,
      marginBottom: isMobile ? '0.5rem' : '0.625rem',
      minWidth: 0, width: '100%',
    }}>
      {weekDays.map((day, index) => {
        const assignedWorkout = tempSchedule[day]
        const workoutData = getWorkoutData(assignedWorkout)
        const isToday = kanOpenen && index === todayIndex
        const isCompleted = kanOpenen && Array.isArray(completedWorkouts)
          && completedWorkouts.some(w => w.workout_day === day)
        const isSelected = selectedWorkout === assignedWorkout
          || (selectedForSwap && selectedForSwap.day === day)

        return (
          <DayCard
            key={day}
            dayIndex={index}
            workoutKey={assignedWorkout}
            workoutData={workoutData}
            isToday={isToday}
            isCompleted={isCompleted}
            isSelected={isSelected}
            swapMode={kanPlannen && (swapMode || localSwapMode)}
            isMobile={isMobile}
            weekDaysDutch={weekDaysDutch}
            onClick={() => handleCardClick(day, assignedWorkout)}
            onShiftLeft={() => onShift && onShift(day, -1)}
            onShiftRight={() => onShift && onShift(day, +1)}
            canShiftLeft={index > 0}
            canShiftRight={index < weekDays.length - 1}
            dayDate={dayDates ? dayDates[index] : null}
            kanPlannen={kanPlannen}
            kanOpenen={kanOpenen}
            gedimd={gedimd}
            rust={rustPerDag[index] || null}
            cardio={cardioPerDag[index] || []}
            onCardioShiftLeft={onCardioShift ? (c) => onCardioShift(c, -1) : null}
            onCardioShiftRight={onCardioShift ? (c) => onCardioShift(c, +1) : null}
            smal={leeg[index]}
            metLabel={false}
            trainingTijd={trainingTijdPerDag[index] || null}
          />
        )
      })}
    </div>
  </>)
}
