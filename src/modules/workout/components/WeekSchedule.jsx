import useIsMobile from '../../../hooks/useIsMobile'
// src/modules/workout/components/WeekSchedule.jsx
import { Activity, Moon, Plus, CheckCircle, Flame } from 'lucide-react'

export default function WeekSchedule({
  weekSchedule,
  schema,
  swapMode,
  selectedWorkout,
  completedWorkouts,
  todayIndex,
  onDayClick
}) {
  const isMobile = useIsMobile()
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  
  return (
    <div style={{ 
      paddingLeft: isMobile ? '0.75rem' : '1.5rem',
      paddingRight: isMobile ? '0.75rem' : '1.5rem',
      marginBottom: '1.5rem',
      marginTop: '1rem'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: isMobile ? '0.4rem' : '0.6rem'
      }}>
        {weekDays.map((day, index) => {
          const assignedWorkout = weekSchedule[day]
          const workoutData = assignedWorkout ? schema.week_structure[assignedWorkout] : null
          const isToday = index === todayIndex
          const isCompleted = completedWorkouts.some(w => w.workout_day === day)
          const isSelected = selectedWorkout === assignedWorkout
          
          return (
            <DayCard
              key={day}
              day={day}
              dayIndex={index}
              workoutData={workoutData}
              isToday={isToday}
              isCompleted={isCompleted}
              isSelected={isSelected}
              swapMode={swapMode}
              isMobile={isMobile}
              weekDaysShort={weekDaysShort}
              weekDaysDutch={weekDaysDutch}
              onClick={() => onDayClick(day, assignedWorkout)}
            />
          )
        })}
      </div>
    </div>
  )
}

function DayCard({
  day,
  dayIndex,
  workoutData,
  isToday,
  isCompleted,
  isSelected,
  swapMode,
  isMobile,
  weekDaysShort,
  weekDaysDutch,
  onClick
}) {
  return (
    <div 
      onClick={onClick}
      style={{
        padding: isMobile ? '0.75rem 0.4rem' : '1rem',
        minHeight: isMobile ? '90px' : '120px',
        background: workoutData 
          ? `linear-gradient(135deg, ${
              isToday ? 'rgba(249, 115, 22, 0.15)' : 
              isCompleted ? 'rgba(16, 185, 129, 0.1)' : 
              'rgba(249, 115, 22, 0.05)'
            } 0%, ${
              isToday ? 'rgba(234, 88, 12, 0.08)' : 
              isCompleted ? 'rgba(5, 150, 105, 0.05)' : 
              'rgba(234, 88, 12, 0.02)'
            } 100%)`
          : isSelected 
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(23, 23, 23, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)',
        border: `1px solid ${
          isSelected ? 'rgba(249, 115, 22, 0.3)' :
          isToday ? 'rgba(249, 115, 22, 0.25)' : 
          workoutData ? 'rgba(249, 115, 22, 0.1)' : 
          'rgba(255, 255, 255, 0.03)'
        }`,
        borderRadius: '14px',
        cursor: swapMode || workoutData ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        transform: isSelected && swapMode ? 'scale(0.95)' : 'scale(1)',
        boxShadow: isToday ? '0 8px 20px rgba(249, 115, 22, 0.15)' : 'none',
        backdropFilter: 'blur(10px)'
      }}
      onMouseEnter={(e) => {
        if (swapMode || workoutData) {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isSelected && swapMode ? 'scale(0.95)' : 'scale(1)'
        e.currentTarget.style.borderColor = isSelected ? 'rgba(249, 115, 22, 0.3)' :
          isToday ? 'rgba(249, 115, 22, 0.25)' : 
          workoutData ? 'rgba(249, 115, 22, 0.1)' : 
          'rgba(255, 255, 255, 0.03)'
      }}
    >
      {/* Completed indicator */}
      {isCompleted && (
        <CheckCircle 
          size={14} 
          color="#10b981" 
          style={{ 
            position: 'absolute',
            top: '0.35rem',
            right: '0.35rem'
          }} 
        />
      )}
      
      {/* Day label */}
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.75rem',
        fontWeight: isToday ? '800' : '600',
        marginBottom: '0.35rem',
        color: isToday ? '#f97316' : workoutData ? 'rgba(249, 115, 22, 0.8)' : 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {isMobile ? weekDaysDutch[dayIndex] : weekDaysShort[dayIndex]}
        {isToday && (
          <div style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#f97316',
            margin: '0.2rem auto 0',
            boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)'
          }} />
        )}
      </div>
      
      {/* Workout or Rest indicator */}
      {workoutData ? (
        <WorkoutIndicator workoutData={workoutData} isMobile={isMobile} />
      ) : (
        <RestIndicator swapMode={swapMode} isMobile={isMobile} />
      )}
    </div>
  )
}

function WorkoutIndicator({ workoutData, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      <div style={{
        width: isMobile ? '32px' : '36px',
        height: isMobile ? '32px' : '36px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Activity 
          size={isMobile ? 16 : 18} 
          color="#f97316"
        />
      </div>
      <div style={{
        fontSize: isMobile ? '0.55rem' : '0.65rem',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 1.2,
        maxWidth: isMobile ? '45px' : '60px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {workoutData.focus?.split(',')[0]}
      </div>
    </div>
  )
}

function RestIndicator({ swapMode, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      {swapMode ? (
        <>
          <div style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed rgba(249, 115, 22, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Plus size={isMobile ? 16 : 20} color="rgba(249, 115, 22, 0.4)" />
          </div>
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.65rem',
            color: 'rgba(249, 115, 22, 0.4)'
          }}>
            Voeg toe
          </div>
        </>
      ) : (
        <>
          <div style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Moon size={isMobile ? 14 : 16} color="rgba(255,255,255,0.2)" />
          </div>
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.65rem',
            color: 'rgba(255,255,255,0.2)',
            marginTop: '0.15rem'
          }}>
            Rust
          </div>
        </>
      )}
    </div>
  )
}
