import WorkoutListCard from './WorkoutListCard'

export default function WeekList({
  tempSchedule,
  weekDays,
  todayIndex,
  completedWorkouts,
  selectedWorkout,
  selectedForSwap,
  localSwapMode,
  getWorkoutData,
  onDayClick,
  onSwapClick,
  isMobile
}) {
  const scheduledDays = weekDays.filter(day => tempSchedule[day])
  
  if (scheduledDays.length === 0) return null
  
  return (
    <div style={{
      marginTop: '1rem'
    }}>
      <h3 style={{
        fontSize: '0.9rem',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Deze Week's Schema
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {scheduledDays.map((day) => {
          const workoutKey = tempSchedule[day]
          const workout = getWorkoutData(workoutKey)
            
          if (!workout) return null
          
          const dayIndex = weekDays.indexOf(day)
          const isToday = dayIndex === todayIndex
          const isCompleted = Array.isArray(completedWorkouts) && 
            completedWorkouts.some(w => w.workout_day === day)
          const isSelected = selectedWorkout === workoutKey ||
                           (selectedForSwap && selectedForSwap.day === day)
          
          return (
            <WorkoutListCard
              key={day}
              day={day}
              workout={workout}
              isCustom={workoutKey?.startsWith('custom_')}
              isToday={isToday}
              isCompleted={isCompleted}
              isSelected={isSelected}
              onClick={() => onDayClick(day, workoutKey)}
              onSwapClick={() => onSwapClick(day, workoutKey)}
              localSwapMode={localSwapMode}
              isMobile={isMobile}
            />
          )
        })}
      </div>
    </div>
  )
}
