import DayCard from './DayCard'

export default function WeekGrid({
  tempSchedule,
  weekDays,
  todayIndex,
  completedWorkouts,
  selectedWorkout,
  selectedForSwap,
  swapMode,
  localSwapMode,
  getWorkoutData,
  onDayClick,
  onSwapClick,
  isMobile
}) {
  const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: isMobile ? '0.4rem' : '0.6rem'
    }}>
      {weekDays.map((day, index) => {
        const assignedWorkout = tempSchedule[day]
        const workoutData = getWorkoutData(assignedWorkout)
        const isToday = index === todayIndex
        const isCompleted = Array.isArray(completedWorkouts) && 
          completedWorkouts.some(w => w.workout_day === day)
        const isSelected = selectedWorkout === assignedWorkout || 
                         (selectedForSwap && selectedForSwap.day === day)
        
        return (
          <DayCard
            key={day}
            day={day}
            dayIndex={index}
            workoutKey={assignedWorkout}
            workoutData={workoutData}
            isToday={isToday}
            isCompleted={isCompleted}
            isSelected={isSelected}
            swapMode={swapMode || localSwapMode}
            isMobile={isMobile}
            weekDaysShort={weekDaysShort}
            weekDaysDutch={weekDaysDutch}
            onClick={() => {
              if (localSwapMode) {
                onSwapClick(day, assignedWorkout)
              } else {
                onDayClick(day, assignedWorkout)
              }
            }}
            onSwapClick={() => onSwapClick(day, assignedWorkout)}
            localSwapMode={localSwapMode}
          />
        )
      })}
    </div>
  )
}
