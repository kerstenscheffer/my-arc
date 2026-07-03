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
}) {
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

  const handleCardClick = (day, assignedWorkout) => {
    if (localSwapMode) onSwapClick(day, assignedWorkout)
    else onDayClick(day, assignedWorkout)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: isMobile ? '0.25rem' : '0.375rem',
      marginBottom: isMobile ? '0.5rem' : '0.625rem',
    }}>
      {weekDays.map((day, index) => {
        const assignedWorkout = tempSchedule[day]
        const workoutData = getWorkoutData(assignedWorkout)
        const isToday = index === todayIndex
        const isCompleted = Array.isArray(completedWorkouts)
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
            swapMode={swapMode || localSwapMode}
            isMobile={isMobile}
            weekDaysDutch={weekDaysDutch}
            onClick={() => handleCardClick(day, assignedWorkout)}
            onShiftLeft={() => onShift && onShift(day, -1)}
            onShiftRight={() => onShift && onShift(day, +1)}
            canShiftLeft={index > 0}
            canShiftRight={index < weekDays.length - 1}
          />
        )
      })}
    </div>
  )
}
