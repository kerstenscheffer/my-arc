// src/modules/workout/WorkoutPlan.jsx
import useIsMobile from '../../hooks/useIsMobile'
import ProgressChartsWidget from "../progress/ProgressChartsWidget"
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'

// Import sub-components
import WeekSchedule from './components/WeekSchedule'
import WorkoutDetailsPage from './components/WorkoutDetailsPage'
import TodaysWorkoutMain from './components/todays-workout/TodaysWorkoutMain'
import WorkoutChallengeSidebar from '../../client/components/WorkoutChallengeSidebar'
import WorkoutPhotoSlider from './components/WorkoutPhotoSlider'
import WorkoutProgressToast from './components/WorkoutProgressToast'
import TodaysLogToast from './components/TodaysLogToast'
import ProgressInsightsSection from '../progress/ProgressInsightsSection'

// Import hooks
import useWorkoutSchedule from './hooks/useWorkoutSchedule'
import useWorkoutProgress from './hooks/useWorkoutProgress'
import PageVideoWidget from '../videos/PageVideoWidget'

export default function WorkoutPlan({ client, schema, db }) {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const detailsRef = useRef(null)
  const chartRef = useRef(null)
  const chartWidgetRef = useRef(null)
  
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
  
  // Local state
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(null)
  const [detailsExpanded, setDetailsExpanded] = useState(false) // ⭐ NEW
  
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
  
  // Set today's workout as default
  useEffect(() => {
    if (schema && todayWorkout && !selectedDay) {
      setSelectedDay(todayWorkout)
      setSelectedDayIndex(todayIndex)
    }
  }, [schema, todayWorkout])
  
  // Handle day click
  const handleDayClick = (day, workoutKey) => {
    if (workoutKey) {
      setSelectedDay(workoutKey)
      const dayIndex = weekDays.indexOf(day)
      setSelectedDayIndex(dayIndex)
      setDetailsExpanded(true) // ⭐ Auto expand on click
      
      // Smooth scroll to details section
      if (detailsRef.current) {
        setTimeout(() => {
          detailsRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        }, 100)
      }
    }
  }
  
  // Handle day navigation in details
  const handleDayNavigation = (newDayIndex) => {
    const newDay = weekDays[newDayIndex]
    const newWorkoutKey = weekSchedule[newDay]
    if (newWorkoutKey) {
      setSelectedDay(newWorkoutKey)
      setSelectedDayIndex(newDayIndex)
    }
  }
  
  // Handle toast click - scroll to chart
  const handleToastViewChart = (exercise) => {
    if (chartRef.current) {
      const elementPosition = chartRef.current.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - (isMobile ? 100 : 150)
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }
  
  // Handle insight exercise selection with metric - WITH OFFSET SCROLL
  const handleInsightExerciseSelect = (exercise, metric = '1rm') => {
    // Scroll to chart with offset for better visibility
    if (chartRef.current) {
      const elementPosition = chartRef.current.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - (isMobile ? 100 : 150)
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
    
    // Open specific exercise + metric in chart widget
    if (chartWidgetRef.current && chartWidgetRef.current.openExercise) {
      setTimeout(() => {
        chartWidgetRef.current.openExercise(exercise, metric)
      }, 400)
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
      {/* 1. Today's Workout */}
      <TodaysWorkoutMain
        client={client}
        schema={schema}
        db={db}
      />
      
      {/* 2. ❌ REMOVED: PumpPhotoSection */}
      
      {/* 3. Today's Log Toast (priority) */}
      <TodaysLogToast
        client={client}
        db={db}
      />
      
      {/* 4. Progress Toast Notification */}
      <WorkoutProgressToast
        client={client}
        db={db}
        onViewChart={handleToastViewChart}
      />
      
      {/* 5. Challenge Sidebar */}
      <WorkoutChallengeSidebar client={client} db={db} />

      {/* 6. Video Widget */}
      <div style={{ 
        paddingTop: isMobile ? '1rem' : '1.5rem',
        paddingLeft: isMobile ? '1rem' : '1.5rem',
        paddingRight: isMobile ? '1rem' : '1.5rem',
        paddingBottom: '0.5rem',
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
      
      {/* 7. Workout Details - ⭐ COLLAPSIBLE */}
      {selectedDay && (
        <div 
          ref={detailsRef}
          style={{
            marginTop: '1.5rem',
            marginLeft: isMobile ? '1rem' : '1.5rem',
            marginRight: isMobile ? '1rem' : '1.5rem',
            background: 'rgba(23, 23, 23, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(249, 115, 22, 0.1)',
            borderRadius: isMobile ? '10px' : '12px',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Collapsible Header */}
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            style={{
              width: '100%',
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <h3 style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0,
                marginBottom: '0.25rem'
              }}>
                Workout Details
              </h3>
              {selectedDayIndex !== null && (
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: '#f97316',
                  fontWeight: '700',
                  background: 'rgba(249, 115, 22, 0.15)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  textTransform: 'capitalize',
                  display: 'inline-block'
                }}>
                  {weekDays[selectedDayIndex]}
                </span>
              )}
            </div>
            
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: detailsExpanded 
                ? 'rgba(249, 115, 22, 0.2)' 
                : 'rgba(249, 115, 22, 0.1)',
              border: `1px solid ${detailsExpanded ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}>
              {detailsExpanded ? (
                <ChevronUp size={20} color="#f97316" />
              ) : (
                <ChevronDown size={20} color="#f97316" />
              )}
            </div>
          </button>
          
          {/* Collapsible Content */}
          {detailsExpanded && (
            <div style={{
              borderTop: '1px solid rgba(249, 115, 22, 0.1)',
              animation: 'slideDown 0.3s ease'
            }}>
              <WorkoutDetailsPage
                workout={schema.week_structure[selectedDay]}
                workoutKey={selectedDay}
                client={client}
                db={db}
                onDayChange={handleDayNavigation}
                currentDayIndex={selectedDayIndex}
                weekDays={weekDays}
              />
            </div>
          )}
        </div>
      )}
      
      {/* 8. Photo Slider */}
      <WorkoutPhotoSlider />
      
      {/* 9. Week Schedule - ⭐ FOCUS VOOR UPGRADE */}
      <WeekSchedule
        weekSchedule={weekSchedule}
        schema={schema}
        swapMode={swapMode}
        selectedWorkout={selectedWorkout}
        completedWorkouts={completedWorkouts}
        todayIndex={todayIndex}
        onDayClick={handleDayClick}
        clientId={client?.id}
        db={db}
        onScheduleUpdate={(newSchedule) => {
          setWeekSchedule(newSchedule)
        }}
      />
      
      {/* 10. Progress Insights & Stats */}
      <div ref={chartRef} style={{ marginTop: '2rem' }}>
        {/* Progress Insights */}
        <ProgressInsightsSection
          db={db}
          clientId={client?.id}
          onSelectExercise={handleInsightExerciseSelect}
        />
        
        {/* Progress Charts */}
        <ProgressChartsWidget 
          ref={chartWidgetRef}
          db={db}
          clientId={client?.id}
        />
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}
