// src/modules/workout/WorkoutPlan.jsx
import useIsMobile from '../../hooks/useIsMobile'
import ProgressChartsWidget from "../progress/ProgressChartsWidget"
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { Calendar } from 'lucide-react'

// Import sub-components
import WeekSchedule from './components/WeekSchedule'
import TodaysWorkoutMain from './components/todays-workout/TodaysWorkoutMain'
import LogModal from './components/todays-workout/LogModal'
import WorkoutChallengeSidebar from '../../client/components/WorkoutChallengeSidebar'
import WorkoutPhotoSlider from './components/WorkoutPhotoSlider'
import WorkoutProgressToast from './components/WorkoutProgressToast'
import TodaysLogToast from './components/TodaysLogToast'
import ProgressInsightsSection from '../progress/ProgressInsightsSection'
import PlanningWizard from './components/planning/PlanningWizard'

// Import hooks
import useWorkoutSchedule from './hooks/useWorkoutSchedule'
import useWorkoutProgress from './hooks/useWorkoutProgress'
import PageVideoWidget from '../videos/PageVideoWidget'

// 🔥 Import WorkoutService
import WorkoutService from '../../services/WorkoutService'

export default function WorkoutPlan({ client, schema, db }) {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const chartsRef = useRef(null)
  const chartWidgetRef = useRef(null)
  
  // 🔥 Initialize WorkoutService
  const [workoutService] = useState(() => new WorkoutService(db.supabase))
  
  // ⭐ Challenge refresh key
  const [challengeRefreshKey, setChallengeRefreshKey] = useState(0)
  
  // 🔥 NEW: LogModal state for any day
  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedWorkoutData, setSelectedWorkoutData] = useState(null)
  const [selectedDayLogs, setSelectedDayLogs] = useState([])
  
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
  const [showWizard, setShowWizard] = useState(false)
  
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
  
  // 🔥 NEW: Handle day click - Open LogModal with workout data
  const handleDayClick = async (day, workoutKey) => {
    if (!workoutKey) return
    
    console.log('🎯 Day clicked:', day, 'Workout key:', workoutKey)
    
    try {
      let workoutData = null
      
      // Check if custom workout
      if (workoutKey.startsWith('custom_')) {
        const customId = workoutKey.replace('custom_', '')
        console.log('🔍 Loading custom workout:', customId)
        
        const customWorkout = await workoutService.getCustomWorkoutById(customId)
        
        if (customWorkout) {
          workoutData = {
            name: customWorkout.name,
            focus: getCustomWorkoutTypeLabel(customWorkout.type),
            geschatteTijd: `${customWorkout.duration} min`,
            exercises: [],
            workoutKey: workoutKey,
            dayKey: workoutKey,
            dayName: day,
            isCustom: true,
            customData: customWorkout
          }
        }
      }
      // Check if activity (cardio, swimming, etc)
      else if (['swimming', 'cardio', 'hiking', 'cycling', 'running'].includes(workoutKey)) {
        const activityLabels = {
          swimming: 'Zwemmen',
          cardio: 'Cardio',
          hiking: 'Wandelen',
          cycling: 'Fietsen',
          running: 'Hardlopen'
        }
        
        workoutData = {
          name: activityLabels[workoutKey],
          focus: 'Cardio',
          geschatteTijd: '60 min',
          exercises: [],
          workoutKey: workoutKey,
          dayKey: workoutKey,
          dayName: day,
          isActivity: true
        }
      }
      // Schema workout
      else if (schema?.week_structure?.[workoutKey]) {
        const workout = schema.week_structure[workoutKey]
        workoutData = {
          ...workout,
          workoutKey: workoutKey,
          dayKey: workoutKey,
          dayName: day,
          isCustom: false
        }
      }
      
      if (workoutData) {
        console.log('✅ Workout data prepared:', workoutData)
        setSelectedWorkoutData(workoutData)
        
        // Load logs for this day
        await loadDayLogs(day)
        
        // Open modal
        setShowLogModal(true)
      } else {
        console.log('❌ No workout data found')
      }
      
    } catch (error) {
      console.error('❌ Error loading workout for day:', error)
    }
  }
  
  // Helper: Load logs for specific day
  const loadDayLogs = async (dayName) => {
    if (!client?.id || !db) return
    
    try {
      // Get the date for this day
      const dayIndex = weekDays.indexOf(dayName)
      const targetDate = new Date()
      const currentDayIndex = (targetDate.getDay() + 6) % 7
      const daysDiff = dayIndex - currentDayIndex
      targetDate.setDate(targetDate.getDate() + daysDiff)
      
      const dateString = targetDate.toISOString().split('T')[0]
      
      const { data, error } = await db.supabase
        .from('workout_logs')
        .select('*')
        .eq('client_id', client.id)
        .eq('date', dateString)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      console.log(`✅ Logs loaded for ${dayName}:`, data?.length || 0)
      setSelectedDayLogs(data || [])
      
    } catch (error) {
      console.error('❌ Error loading day logs:', error)
      setSelectedDayLogs([])
    }
  }
  
  // Helper: Get custom workout type label
  const getCustomWorkoutTypeLabel = (type) => {
    const labels = {
      cardio: 'Cardio',
      cycling: 'Fietsen',
      running: 'Hardlopen',
      swimming: 'Zwemmen',
      hiking: 'Wandelen',
      yoga: 'Yoga',
      sports: 'Sport',
      custom: 'Custom'
    }
    return labels[type] || type
  }
  
  // Handle close log modal
  const handleCloseLogModal = () => {
    setShowLogModal(false)
    setSelectedWorkoutData(null)
    setSelectedDayLogs([])
  }
  
  // Handle logs update from modal
  const handleLogsUpdate = async (options) => {
    console.log('🔄 Logs updated from modal')
    
    // Reload progress
    await loadWeeklyProgress()
    
    // Reload day logs if modal still open
    if (selectedWorkoutData?.dayName) {
      await loadDayLogs(selectedWorkoutData.dayName)
    }
    
    // If workout completed, refresh challenge
    if (options?.workoutCompleted) {
      handleWorkoutCompleted()
    }
  }
  
  // Handle toast click - scroll to chart
  const handleToastViewChart = (exercise) => {
    if (chartsRef.current) {
      const elementPosition = chartsRef.current.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - (isMobile ? 100 : 150)
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }
  
  // Handle insight exercise selection - scroll to chartsRef
  const handleInsightExerciseSelect = (exercise, metric = '1rm') => {
    // Scroll to charts with offset for better visibility
    if (chartsRef.current) {
      const elementPosition = chartsRef.current.getBoundingClientRect().top + window.pageYOffset
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
  
  // Handle wizard complete
  const handleWizardComplete = (newSchedule) => {
    setWeekSchedule(newSchedule)
    setShowWizard(false)
  }
  
  // Handle workout completed - refresh challenge banner
  const handleWorkoutCompleted = () => {
    console.log('🔔 Workout completed - refreshing challenge banner')
    setChallengeRefreshKey(prev => prev + 1)
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
        workoutService={workoutService}
        onWorkoutCompleted={handleWorkoutCompleted}
      />
      
      {/* 2. Today's Log Toast */}
      <TodaysLogToast
        client={client}
        db={db}
      />
      
      {/* 3. Progress Toast Notification */}
      <WorkoutProgressToast
        client={client}
        db={db}
        onViewChart={handleToastViewChart}
      />
      
      {/* 4. Challenge Sidebar */}
      <WorkoutChallengeSidebar 
        client={client} 
        db={db}
        key={challengeRefreshKey}
      />

      {/* 5. Video Widget */}
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
      
      {/* 6. Week Schedule - WITH DAY CLICK TO LOGMODAL */}
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
        workoutService={workoutService}
        onScheduleUpdate={(newSchedule) => {
          setWeekSchedule(newSchedule)
        }}
        onOpenWizard={() => setShowWizard(true)}
      />
      
      {/* 7. Photo Slider */}
      <WorkoutPhotoSlider />
      
      {/* 8. Progress Insights & Stats */}
      <div style={{ marginTop: '2rem' }}>
        {/* Progress Insights */}
        <ProgressInsightsSection
          db={db}
          clientId={client?.id}
          onSelectExercise={handleInsightExerciseSelect}
        />
        
        {/* Charts Wrapper */}
        <div ref={chartsRef}>
          <ProgressChartsWidget 
            ref={chartWidgetRef}
            db={db}
            clientId={client?.id}
          />
        </div>
      </div>
      
      {/* 🔥 WIZARD MODAL */}
      {showWizard && (
        <PlanningWizard
          schema={schema}
          clientId={client?.id}
          db={db}
          workoutService={workoutService}
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}
        />
      )}
      
      {/* 🔥 LOG MODAL - FOR ANY DAY WORKOUT */}
      {showLogModal && selectedWorkoutData && (
        <LogModal
          workout={selectedWorkoutData}
          todaysLogs={selectedDayLogs}
          onClose={handleCloseLogModal}
          onLogsUpdate={handleLogsUpdate}
          client={client}
          schema={schema}
          db={db}
        />
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
