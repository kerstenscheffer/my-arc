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
}) {
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

  // Een komende week mag je wél indelen (pijltjes) maar niet openen: de
  // workout van vandaag hoort bij vandaag.
  const handleCardClick = (day, assignedWorkout) => {
    if (localSwapMode) { if (kanPlannen) onSwapClick(day, assignedWorkout); return }
    if (!kanOpenen) return
    onDayClick(day, assignedWorkout)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
      gap: isMobile ? '0.25rem' : '0.375rem',
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
          />
        )
      })}
    </div>
  )
}
