
import useIsMobile from '../../hooks/useIsMobile'
// src/modules/workout/WorkoutPlan.jsx

import ProgressChartsWidget from "../progress/ProgressChartsWidget";
import ProgressWidget from '../progress-widget/ProgressWidget'
import WorkoutCard from './components/WorkoutCard'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { Calendar } from 'lucide-react'

// Import sub-components
import WeekSchedule from './components/WeekSchedule'
import WorkoutDetails from './components/WorkoutDetails'
import SwapMode from './components/SwapMode'
import TodayWorkout from './components/TodayWorkout'
import AlternativeExercises from './components/AlternativeExercises'
import WorkoutPicker from './components/WorkoutPicker'

// Import hooks
import useWorkoutSchedule from './hooks/useWorkoutSchedule'
import useWorkoutProgress from './hooks/useWorkoutProgress'

// Import service
import WorkoutService from './WorkoutService'

// Import PageVideoWidget
import PageVideoWidget from '../videos/PageVideoWidget'

export default function WorkoutPlan({ client, schema, db }) {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  
  // State management via custom hooks
  const {
    weekSchedule,
    setWeekSchedule,
    swapMode,
    setSwapMode,
    selectedWorkout,
    setSelectedWorkout,
    handleDaySwap,
    quickAssignWorkout
  } = useWorkoutSchedule(schema, client?.id, db)
  
  const {
    completedWorkouts,
    markWorkoutComplete,
    weeklyStats,
    loadWeeklyProgress
  } = useWorkoutProgress(client?.id, db)
  
  // Local state for modals
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [currentExercise, setCurrentExercise] = useState(null)
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false)
  const [selectedSwapDay, setSelectedSwapDay] = useState(null)
  
  // Get current date info
  const currentDate = new Date()
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const todayIndex = (currentDate.getDay() + 6) % 7
  const todayWorkout = weekSchedule[weekDays[todayIndex]]
  
  // Load initial data
  useEffect(() => {
    if (client?.id) {
      loadWeeklyProgress()
    }
  }, [client?.id])
  
  // Handle alternative exercises
  const handleShowAlternatives = async (exercise, muscleGroup) => {
    setCurrentExercise({ ...exercise, muscleGroup })
    setShowAlternatives(true)
  }
  
  const handleReplaceExercise = async (oldExercise, newExercise) => {
    const workoutService = new WorkoutService(db)
    const result = await workoutService.replaceExercise(
      client.id,
      selectedDay,
      oldExercise.name,
      newExercise
    )
    
    if (result) {
      // Refresh schema or update local state
      setShowAlternatives(false)
      // You might want to trigger a schema reload here
    }
  }
  
  // Handle workout completion
  const handleCompleteWorkout = async (workoutKey) => {
    const day = weekDays.find(d => weekSchedule[d] === workoutKey)
    if (day) {
      await markWorkoutComplete({
        name: schema.week_structure[workoutKey].name,
        day: day
      })
    }
  }
  
  // No plan view
  if (!schema) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
        padding: '1rem',
        animation: 'fadeIn 0.5s ease'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '4rem auto',
          textAlign: 'center',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <Calendar size={48} color="#8b5cf6" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{
            fontSize: '1.5rem',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
            fontWeight: 'bold'
          }}>
            {t('workout.noplan') || 'No Workout Plan Yet'}
          </h3>
          <p style={{
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.6
          }}>
            {t('workout.waitingForTrainer') || 'Your trainer will assign a workout plan soon!'}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      paddingBottom: isMobile ? '5rem' : '2rem',
      animation: 'fadeIn 0.5s ease',
      position: 'relative'
    }}>
    






  {/* Video Widget for Workout Page */}
      <div style={{ 
        paddingTop: isMobile ? '1rem' : '1.5rem',
        paddingLeft: isMobile ? '1rem' : '1.5rem',
        paddingRight: isMobile ? '1rem' : '1.5rem',
        paddingBottom: '0.5rem',
        position: 'relative',
        zIndex: 10,
        marginBottom: '0.5rem'
      }}>
        <PageVideoWidget
          client={client}
          db={db}
          pageContext="workout"
          title="Workout Technique Videos"
          compact={true}
        />
      </div>
   







      
      {/* Today's Workout */}
      {todayWorkout && !swapMode && (
        <TodayWorkout
          workout={schema.week_structure[todayWorkout]}
          onStart={() => setSelectedDay(todayWorkout)}
          client={client}
          db={db}
        />
     )}   


{/* ===== PROGRESS WIDGET - HIER TOEVOEGEN ===== */}
{schema && weekSchedule && Object.keys(weekSchedule).length > 0 && (
  <div style={{ 
    paddingLeft: isMobile ? '1rem' : '1.5rem',
    paddingRight: isMobile ? '1rem' : '1.5rem',
    paddingBottom: isMobile ? '1rem' : '1.5rem',
    marginBottom: '0.5rem'
  }}>
    <ProgressWidget 
      client={client}
      schema={schema}
      weekSchedule={weekSchedule}
      db={db}
    />
  </div>
)}
{/* ===== EINDE PROGRESS WIDGET ===== */}

  
      {/* Week Schedule */}
      <WeekSchedule
        weekSchedule={weekSchedule}
        schema={schema}
        swapMode={swapMode}
        selectedWorkout={selectedWorkout}
        completedWorkouts={completedWorkouts}
        todayIndex={todayIndex}
        onDayClick={(day, workoutKey) => {
          if (swapMode) {   
            if (!workoutKey && !selectedWorkout) {
              setSelectedSwapDay(day)
              setShowWorkoutPicker(true)
            } else {
              handleDaySwap(day)
            }
          } else if (workoutKey) {
            setSelectedDay(workoutKey)
          }
        }}
      />  
        
            
        


          

          

      {/* Header */}

      <div style={{

        paddingTop: isMobile ? '1rem' : '1.5rem',

        paddingLeft: isMobile ? '1rem' : '1.5rem',

        paddingRight: isMobile ? '1rem' : '1.5rem',

        paddingBottom: 0

      }}>

        <SwapMode

          schema={schema}  

          swapMode={swapMode}

          setSwapMode={setSwapMode}

          selectedWorkout={selectedWorkout}

          setSelectedWorkout={setSelectedWorkout}

          weeklyStats={weeklyStats} 

        />

      </div>



   
      {/* Scheduled Workouts List */}
      {!swapMode && (
        <div style={{          paddingLeft: '1rem',
          paddingRight: '1rem',
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
            This Week's Schedule
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {weekDays.map((day, index) => {
              const workoutKey = weekSchedule[day]
              if (!workoutKey) return null
              
              const workout = schema.week_structure[workoutKey]
              const isToday = index === todayIndex
              const isCompleted = completedWorkouts.some(w => w.workout_day === day)
              
              return (
                <WorkoutCard
                  key={day}
                  day={day}
                  workout={workout}
                  isToday={isToday}
                  isCompleted={isCompleted}
                  onClick={() => setSelectedDay(workoutKey)}
                />
              )
            })}
          </div>
        </div>
      )}










 {/* 5. NIEUWE SECTIE - Progress Log Widget */}
      <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
        <h3>Progress Log</h3>
        <div>{/* Placeholder voor widget */}</div>
      </div>
      
<ProgressChartsWidget 
  db={db}
  clientId={client?.id}
/>

   

   {/* Modals */}
      {selectedDay && (
        <WorkoutDetails
          workout={schema.week_structure[selectedDay]}
          workoutKey={selectedDay}
          onClose={() => setSelectedDay(null)}
          onComplete={() => handleCompleteWorkout(selectedDay)}
          onShowAlternatives={handleShowAlternatives}
          client={client}
          db={db}
          weekSchedule={weekSchedule}
          weekDays={weekDays}
        />
      )}
      
      {showWorkoutPicker && (
        <WorkoutPicker
          schema={schema}
          weekSchedule={weekSchedule}
          selectedDay={selectedSwapDay}
          onSelect={(workoutKey) => {
            quickAssignWorkout(workoutKey, selectedSwapDay)
            setShowWorkoutPicker(false)
            setSelectedSwapDay(null)
          }}
          onClose={() => {
            setShowWorkoutPicker(false)
            setSelectedSwapDay(null)
          }}
          onClearDay={() => {
            const newSchedule = { ...weekSchedule }
            delete newSchedule[selectedSwapDay]
            setWeekSchedule(newSchedule)
            setShowWorkoutPicker(false)
            setSelectedSwapDay(null)
          }}
        />
      )}
      
      {showAlternatives && currentExercise && (
        <AlternativeExercises
          exercise={currentExercise}
          onSelect={handleReplaceExercise}
          onClose={() => setShowAlternatives(false)}
        />
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}

