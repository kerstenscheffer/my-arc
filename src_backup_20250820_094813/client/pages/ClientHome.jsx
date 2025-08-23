// src/client/pages/ClientHome.jsx - FINAL LAUNCH VERSION
// Features: Accountability Alerts, Video Player, Desktop Optimized, Progress Displays

import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { supabase } from '../../lib/supabase'

// Icon URLs
const iconUrls = {
  home: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/347a061-831e-4cd2-f3b-b6007f0caa2_MIND_17_.png",
  mealplan: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/6bbcb82-acf7-45d6-1e4e-627ff4061280_MIND_10_.png",
  workout: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/a3883-e0d0-0da8-deea-8b7e7dce467_MIND_14_.png",
  progress: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/b8015e-0fc-8aaf-b56-a13672c1bab5_MIND_13_.png",
  profile: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/1e1d3f-24b5-b48-37a-1537c7b8f05e_MIND_12_.png",
  weight: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/2eab52d-0a25-d6dd-bce2-53cd3818ad1c_5.png",
  muscle: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/c3de8d-cfd4-ace0-1162-03011e83a13_2.png",
  calendar: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/73c0ff-a73-afe-2e0f-71f1c4cf73_6.png",
  fire: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/ed8d5f8-1a5c-e7dd-f1b-b6ec3afd6ef1_4.png",
  bell: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/b83b4d-cd-c11c-bbc3-72d4e7af7c_11.png",
  video: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/01e28db-8cd3-0be1-e3dc-4103b1cd6f06_10.png",
  coach: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909596/settings_images/6fdbdf-1af6-0d32-752b-12f22af8a2ac_IMG_3254.jpeg"
}

// YouTube Video ID Extractor
function getYouTubeVideoId(url) {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

// Progress Box Component
function ProgressBox({ title, current, target, unit, color, gradientFrom, gradientTo, icon, onClick }) {
  const safeTarget = target || 1 // Prevent division by zero
  const safeCurrent = current || 0
  const percentage = Math.min(100, (safeCurrent / safeTarget) * 100)
  const remaining = Math.max(0, safeTarget - safeCurrent)
  const isCompleted = percentage >= 100
  
  return (
    <div 
      onClick={onClick}
      style={{
        padding: '1.25rem',
        background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
          {icon && <img src={icon} alt="" style={{ width: '24px', height: '24px', marginRight: '0.5rem' }} />}
          <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600', opacity: 0.9 }}>
            {title}
          </h3>
        </div>
        
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.25rem' }}>
          {safeCurrent}
          <span style={{ fontSize: '1rem', opacity: 0.8 }}> / {safeTarget}</span>
        </div>
        
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>
          {unit}
        </div>
        
        <div style={{
          height: '6px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'rgba(255,255,255,0.8)',
            transition: 'width 0.5s ease',
            boxShadow: '0 0 10px rgba(255,255,255,0.5)'
          }} />
        </div>
        
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.9)',
          marginTop: '0.5rem',
          fontWeight: '600'
        }}>
          {isCompleted 
            ? 'DOEL BEHAALD!' 
            : `Nog ${remaining} ${unit.toLowerCase()} te gaan`
          }
        </div>
      </div>
    </div>
  )
}

// Accountability Alert Component
function AccountabilityAlert({ alert, onDismiss, onAction }) {
  const getAlertStyle = () => {
    switch(alert.type) {
      case 'warning': 
        return { 
          bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', 
          border: '#fbbf24', 
          icon: '⚠️',
          textColor: '#000'
        }
      case 'reminder': 
        return { 
          bg: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', 
          border: '#60a5fa', 
          icon: '🔔',
          textColor: '#fff'
        }
      case 'coach': 
        return { 
          bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', 
          border: '#34d399', 
          icon: '💬',
          textColor: '#fff'
        }
      case 'achievement': 
        return { 
          bg: 'linear-gradient(135deg, #fbbf24 0%, #fde047 100%)', 
          border: '#fde047', 
          icon: '🏆',
          textColor: '#000'
        }
      case 'motivation':
        return {
          bg: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
          border: '#f472b6',
          icon: '🔥',
          textColor: '#fff'
        }
      default: 
        return { 
          bg: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', 
          border: '#818cf8', 
          icon: '📢',
          textColor: '#fff'
        }
    }
  }
  
  const style = getAlertStyle()
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      background: style.bg,
      borderRadius: '12px',
      border: `2px solid ${style.border}`,
      marginBottom: '0.75rem',
      animation: 'slideIn 0.3s ease',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
        {style.icon}
      </span>
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <p style={{ 
          color: style.textColor, 
          fontSize: '0.9rem', 
          fontWeight: '700',
          marginBottom: '0.25rem'
        }}>
          {alert.title}
        </p>
        {alert.message && (
          <p style={{ 
            color: style.textColor, 
            fontSize: '0.8rem', 
            opacity: 0.85,
            fontWeight: '500'
          }}>
            {alert.message}
          </p>
        )}
      </div>
      {alert.actionLabel && (
        <button
          onClick={() => onAction(alert)}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.875rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.background = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.9)'
          }}
        >
          {alert.actionLabel}
        </button>
      )}
      <button
        onClick={() => onDismiss(alert.id)}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: style.textColor,
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
        }}
      >
        ×
      </button>
    </div>
  )
}

export default function ClientHome({ client, setCurrentView }) {
  const { t } = useLanguage()
  const isMobile = window.innerWidth <= 768
  const isDesktop = window.innerWidth >= 1400
  
  // Safety check for client
  if (!client) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#fff' }}>Loading client data...</p>
      </div>
    )
  }
  
  // Progress states - start with 0/empty values
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0)
  const [weeklyGoal, setWeeklyGoal] = useState(4)
  const [weightCurrent, setWeightCurrent] = useState(0)
  const [weightGoal, setWeightGoal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [nextWorkout, setNextWorkout] = useState('')
  const [todayCalories, setTodayCalories] = useState(0)
  const [calorieGoal, setCalorieGoal] = useState(0)
  const [myArcScore, setMyArcScore] = useState(0)
  const [workoutPlan, setWorkoutPlan] = useState(null)
  
  // Accountability states
  const [alerts, setAlerts] = useState([])
  
  // Video states - met default video
  const [featuredVideo, setFeaturedVideo] = useState({
    url: 'https://www.youtube.com/watch?v=10FI8bNX0xw', // Default MY ARC promo video
    title: 'Welcome to MY ARC Training',
    description: 'Start jouw fitness journey vandaag! 💪'
  })
  const [showVideo, setShowVideo] = useState(true)
  
  // Load video from database or coach settings
  useEffect(() => {
    loadFeaturedVideo()
  }, [client])
  
  const loadFeaturedVideo = async () => {
    if (!client) return
    
    try {
      // Try to load video from coach_videos table
      const { data: videos } = await supabase
        .from('coach_videos')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (videos && videos.length > 0) {
        const video = videos[0]
        setFeaturedVideo({
          url: video.url,
          title: video.title || 'Training Video van de Week',
          description: video.description || ''
        })
      }
      // If no video in database, keep the default video
    } catch (error) {
      console.log('Using default video')
      // Keep default video
    }
    
    // Always show video section
    setShowVideo(true)
  }
  
  // Load progress data
  useEffect(() => {
    loadProgressData()
  }, [client])
  
  // Load accountability after progress data is loaded
  useEffect(() => {
    if (client) {
      loadAccountabilityData()
    }
  }, [client, nextWorkout, todayCalories, calorieGoal, streak])
  
  // Recalculate MY ARC Score when data changes
  useEffect(() => {
    calculateMyArcScore()
  }, [weeklyWorkouts, weeklyGoal, todayCalories, calorieGoal, streak])
  
  




const loadProgressData = async () => {
  if (!client) return

  // Debug: log client object to see what fields are available
  console.log('Client object:', client)

  // Try to find the correct ID - check all possible fields
  const clientId = client.id ||
                   client.client_id ||
                   client.uuid ||
                   client._id ||
                   (typeof client.legacy_id === 'number' ? null : client.legacy_id)

  if (!clientId) {
    console.warn('No valid UUID found for client, some features may not work:', client)
    // Doorgaan: we laden wat we kunnen
  }

  console.log('Using client ID for queries:', clientId)

  try {
    // ---- Workout plan ----
    if (clientId) {
      const { data: clientPlan, error: planError } = await supabase
        .from('client_workout_plans')
        .select('*, workout_schemas(*)')
        .eq('client_id', clientId)
        .single()

      if (!planError && clientPlan && clientPlan.workout_schemas) {
        setWorkoutPlan(clientPlan.workout_schemas)

        // Bepaal today's workout
        const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
        const today = dayNames[new Date().getDay()]
        const weekStructure = clientPlan.workout_schemas.week_structure || {}
        const todayWorkout = weekStructure[today]

        if (todayWorkout) {
          const muscleGroups = todayWorkout.name || todayWorkout.exercises?.[0]?.muscle_group || 'Training'
          setNextWorkout(muscleGroups)
        } else {
          setNextWorkout('Rust dag')
        }
      }
    }

    // ---- Goals ----
    if (clientId) {
      const { data: goals } = await supabase
        .from('client_goals')
        .select('*')
        .eq('client_id', clientId)

      if (goals && goals.length > 0) {
        const weightGoalData = goals.find(g => g.goal_type === 'weight')
        if (weightGoalData) {
          setWeightCurrent(weightGoalData.current_value || client.current_weight || 0)
          setWeightGoal(weightGoalData.target_value || client.target_weight || 0)
        }

        const weeklyGoalData = goals.find(g => g.goal_type === 'weekly_workouts')
        if (weeklyGoalData) setWeeklyGoal(weeklyGoalData.target_value || 4)

        const calorieGoalData = goals.find(g => g.goal_type === 'daily_calories')
        if (calorieGoalData) setCalorieGoal(calorieGoalData.target_value || 2000)
      } else {
        // Defaults vanuit client
        setWeightCurrent(client?.current_weight || 0)
        setWeightGoal(client?.target_weight || 0)
        setCalorieGoal(client?.daily_calorie_goal || 2000)
      }
    }

    // ---- Workouts deze week + streak ----
    if (clientId) {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const { data: workouts } = await supabase
        .from('workout_progress')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startOfWeek.toISOString().split('T')[0])

      if (workouts) {
        const uniqueDays = new Set(workouts.map(w => w.date))
        setWeeklyWorkouts(uniqueDays.size)

        // Streak
        let currentStreak = 0
        const today = new Date()
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today)
          checkDate.setDate(checkDate.getDate() - i)
          const dateStr = checkDate.toISOString().split('T')[0]

          if (workouts.some(w => w.date === dateStr && w.completed)) {
            currentStreak++
          } else if (i > 0) {
            break
          }
        }
        setStreak(currentStreak)
      }
    }

    // ---- Today’s calories ----
    if (clientId) {
      const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in lokale tijd
      const { data: mealProgress, error } = await supabase
        .from('meal_progress')
        .select('calories')
        .eq('client_id', clientId)
        .eq('date', todayStr)

      if (error) throw error

      const totalCalories = (mealProgress || []).reduce(
        (sum, m) => sum + (m?.calories || 0),
        0
      )
      setTodayCalories(Math.round(totalCalories))
    } else {
      setTodayCalories(0)
    }

  } catch (error) {
    console.error('Error loading progress data:', error)
    // veilige defaults bij fout
    setTodayCalories(0)
  }
} // <-- ✅ sluit loadProgressData netjes
  







  const loadAccountabilityData = async () => {
    if (!client) return
    
    // Use the same ID logic as loadProgressData
    const clientId = client.id || 
                    client.client_id || 
                    client.uuid || 
                    client._id ||
                    (typeof client.legacy_id === 'number' ? null : client.legacy_id)
    
    if (!clientId) {
      console.warn('No valid UUID found for accountability, using defaults')
      // Still generate some default alerts based on available data
    }
    
    try {
      const dynamicAlerts = []
      
      // Check for today's workout
      if (nextWorkout && nextWorkout !== '' && nextWorkout !== 'Rust dag') {
        dynamicAlerts.push({
          id: `workout-${Date.now()}`,
          type: 'reminder',
          title: `Vandaag: ${nextWorkout}`,
          message: 'Vergeet je workout niet! Beste tijd om te trainen.',
          actionLabel: 'Start',
          action: 'workout'
        })
      }
      
      // Check calories remaining
      const safeCalorieGoal = calorieGoal || 2000
      const caloriesRemaining = safeCalorieGoal - todayCalories
      if (caloriesRemaining > 0) {
        if (caloriesRemaining > 500) {
          dynamicAlerts.push({
            id: `calories-${Date.now()}`,
            type: 'warning',
            title: `Nog ${caloriesRemaining} kcal te gaan`,
            message: caloriesRemaining > 1000 
              ? 'Je hebt vandaag nog niet veel gegeten. Vergeet niet te eten!' 
              : 'Je hebt nog ruimte voor maaltijden vandaag.',
            actionLabel: 'Meal Plan',
            action: 'mealplan'
          })
        }
      } else if (caloriesRemaining < -200) {
        dynamicAlerts.push({
          id: `calories-over-${Date.now()}`,
          type: 'warning',
          title: `${Math.abs(caloriesRemaining)} kcal over je doel`,
          message: 'Je zit boven je calorie doel voor vandaag.',
          actionLabel: 'Bekijk',
          action: 'mealplan'
        })
      }
      
      // Load coach notifications from database - only if we have a valid UUID
      if (clientId) {
        const { data: notifications } = await supabase
          .from('accountability_notifications')
          .select('*')
          .eq('client_id', clientId)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(3)
        
        if (notifications && notifications.length > 0) {
          const dbAlerts = notifications.map(n => ({
            id: n.id,
            type: n.type || 'coach',
            title: n.title,
            message: n.message,
            actionLabel: n.action_label,
            action: n.action_target
          }))
          dynamicAlerts.push(...dbAlerts)
        }
      }
      
      // Add achievement alert if on streak
      if (streak >= 7 && streak % 7 === 0) {
        dynamicAlerts.push({
          id: `streak-${Date.now()}`,
          type: 'achievement',
          title: `🔥 ${streak} dagen streak!`,
          message: 'Geweldige consistentie! Keep it up!',
          actionLabel: null
        })
      }
      
      setAlerts(dynamicAlerts)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }
  
  const calculateMyArcScore = () => {
    let score = 0
    
    // Workout done this week: +40 (scaled by weekly progress)
    if (weeklyGoal > 0) {
      const workoutScore = Math.min(40, (weeklyWorkouts / weeklyGoal) * 40)
      score += Math.round(workoutScore)
    }
    
    // Meals logged: +30 (based on calories tracked)
    if (todayCalories > 0) {
      const mealScore = Math.min(30, (todayCalories / calorieGoal) * 30)
      score += Math.round(mealScore)
    }
    
    // On track with calories: +20 (within 80-120% of goal)
    const caloriePercentage = (todayCalories / calorieGoal) * 100
    if (caloriePercentage >= 80 && caloriePercentage <= 120) {
      score += 20
    } else if (caloriePercentage >= 60 && caloriePercentage <= 140) {
      score += 10
    }
    
    // Streak bonus: +10
    if (streak >= 7) {
      score += 10
    } else if (streak >= 3) {
      score += 5
    }
    
    setMyArcScore(Math.min(100, score))
  }
  
  const dismissAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId))
    
    // Use the same ID logic
    const clientId = client?.id || 
                    client?.client_id || 
                    client?.uuid || 
                    client?._id ||
                    (typeof client?.legacy_id === 'number' ? null : client?.legacy_id)
    
    if (!clientId) return
    
    // Mark as read in database
    supabase
      .from('accountability_notifications')
      .update({ read: true })
      .eq('id', alertId)
      .then(() => console.log('Alert marked as read'))
      .catch(err => console.error('Error marking alert as read:', err))
  }
  
  const handleAlertAction = (alert) => {
    if (alert.action) {
      setCurrentView(alert.action)
    }
    dismissAlert(alert.id)
  }
  
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Goedemorgen' : 
                   now.getHours() < 18 ? 'Goedemiddag' : 'Goedenavond'
  
  const quickActions = [
    { 
      id: 'workout', 
      label: t('nav.workout'), 
      icon: iconUrls.workout,
      gradient: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)'
    },
    { 
      id: 'mealplan', 
      label: t('nav.mealplan'), 
      icon: iconUrls.mealplan,
      gradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)'
    },
    { 
      id: 'progress', 
      label: t('nav.progress'), 
      icon: iconUrls.progress,
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
    },
    { 
      id: 'profile', 
      label: t('nav.profile'), 
      icon: iconUrls.profile,
      gradient: 'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)'
    }
  ]

  const videoId = featuredVideo ? getYouTubeVideoId(featuredVideo.url) : null

  return (
    <div className="myarc-animate-in" style={{ 
      padding: isMobile ? '0.5rem' : '1rem',
      maxWidth: isDesktop ? '1400px' : '100%',
      margin: '0 auto'
    }}>
      {/* ACCOUNTABILITY ALERTS SECTION */}
      {alerts.length > 0 && (
        <div style={{
          marginBottom: '1.5rem',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <img src={iconUrls.bell} alt="" style={{ width: '24px', height: '24px' }} />
            <h3 style={{ 
              color: '#fff', 
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              Belangrijke Updates
            </h3>
            <div style={{
              background: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {alerts.length}
            </div>
          </div>
          
          <div>
            {alerts.map(alert => (
              <AccountabilityAlert
                key={alert.id}
                alert={alert}
                onDismiss={dismissAlert}
                onAction={handleAlertAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Desktop Layout Container */}
      <div style={{
        display: isDesktop ? 'grid' : 'block',
        gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr',
        gap: '1.5rem'
      }}>
        {/* Main Content Column */}
        <div>
          {/* Welcome Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
            borderRadius: '16px',
            padding: isDesktop ? '2.5rem' : '2rem',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{ 
                color: '#fff', 
                fontSize: isDesktop ? '2.5rem' : '2rem', 
                marginBottom: '0.5rem',
                fontWeight: 'bold'
              }}>
                {greeting}, {client?.first_name}! 💪
              </h1>
              <p style={{ 
                color: '#d1fae5', 
                fontSize: isDesktop ? '1.2rem' : '1.1rem',
                marginBottom: '1.5rem'
              }}>
                {t('client.welcomeMessage')}
              </p>
              
              {/* Stats Row */}
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                flexWrap: 'wrap'
              }}>
                {streak > 0 && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255,255,255,0.2)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <img src={iconUrls.fire} alt="" style={{ width: '20px', height: '20px' }} />
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>
                      {streak} dagen streak!
                    </span>
                  </div>
                )}
                
                {myArcScore > 0 && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255,255,255,0.2)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>
                      MY ARC Score: {myArcScore}/100
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video Section */}
          {showVideo && featuredVideo && featuredVideo.url && (
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '2rem',
              border: '1px solid #10b98133',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                padding: '1rem 1.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderBottom: '1px solid #10b98133',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={iconUrls.video} alt="" style={{ width: '24px', height: '24px' }} />
                  <div>
                    <h3 style={{ color: '#10b981', fontSize: '1rem', fontWeight: 'bold' }}>
                      Video van de Week
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                      {featuredVideo.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVideo(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '0.25rem'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                {videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    controls
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <source src={featuredVideo.url} type="video/mp4" />
                    Je browser ondersteunt geen video
                  </video>
                )}
              </div>
              
              {featuredVideo.description && (
                <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.5)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                    {featuredVideo.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Progress Overview */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              color: '#fff', 
              fontSize: '1.3rem', 
              marginBottom: '1rem',
              fontWeight: 'bold' 
            }}>
              Jouw Progress
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 
                `repeat(${(weightGoal > 0 || weightCurrent > 0) ? 3 : 2}, 1fr)`,
              gap: '1rem'
            }}>
              <ProgressBox
                title="Deze Week"
                current={weeklyWorkouts}
                target={weeklyGoal || 4}
                unit="workouts"
                gradientFrom="#064e3b"
                gradientTo="#10b981"
                icon={iconUrls.calendar}
                onClick={() => setCurrentView('progress')}
              />
              
              {(weightGoal > 0 || weightCurrent > 0) && (
                <ProgressBox
                  title="Gewicht Doel"
                  current={weightCurrent || 0}
                  target={weightGoal || weightCurrent || 75}
                  unit="kg"
                  gradientFrom="#1e3a8a"
                  gradientTo="#3b82f6"
                  icon={iconUrls.weight}
                  onClick={() => setCurrentView('progress')}
                />
              )}
              
              <ProgressBox
                title="Vandaag's Calorieën"
                current={todayCalories}
                target={calorieGoal || 2000}
                unit="kcal"
                gradientFrom="#78350f"
                gradientTo="#f59e0b"
                icon={iconUrls.fire}
                onClick={() => setCurrentView('mealplan')}
              />
            </div>
          </div>

          {/* Today's Focus */}
          <div style={{
            background: 'rgba(26, 26, 26, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              color: '#10b981', 
              fontSize: '1.1rem', 
              marginBottom: '1rem',
              fontWeight: 'bold'
            }}>
              Vandaag's Focus
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #10b98133'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <img src={iconUrls.workout} alt="" style={{ width: '20px', height: '20px' }} />
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>Volgende Workout</span>
                </div>
                <p style={{ color: '#fff', fontSize: '1.1rem' }}>
                  {nextWorkout || 'Nog geen workout gepland'}
                </p>
                <button
                  onClick={() => setCurrentView('workout')}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  Start Workout
                </button>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #f59e0b33'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <img src={iconUrls.mealplan} alt="" style={{ width: '20px', height: '20px' }} />
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    {(calorieGoal || 2000) > todayCalories ? 'Calorieën Over' : 'Calorie Status'}
                  </span>
                </div>
                <p style={{ color: '#fff', fontSize: '1.1rem' }}>
                  {(calorieGoal || 2000) > todayCalories 
                    ? `${Math.max(0, (calorieGoal || 2000) - todayCalories)} kcal` 
                    : `${Math.abs(todayCalories - (calorieGoal || 2000))} kcal over`}
                </p>
                <button
                  onClick={() => setCurrentView('mealplan')}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: '#f59e0b',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  Bekijk Maaltijden
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side Column (Desktop Only) */}
        {isDesktop && (
          <div>
            {/* Quick Actions */}
            <div style={{
              background: 'rgba(26, 26, 26, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <h3 style={{ 
                color: '#fff', 
                fontSize: '1.1rem', 
                marginBottom: '1rem',
                fontWeight: 'bold'
              }}>
                Snelle Acties
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => setCurrentView(action.id)}
                    style={{
                      background: action.gradient,
                      border: 'none',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <img 
                      src={action.icon} 
                      alt={action.label}
                      style={{ 
                        width: '32px', 
                        height: '32px',
                        filter: 'brightness(1.1)'
                      }}
                    />
                    <span style={{ 
                      color: '#fff', 
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coach Message */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              border: '1px solid #10b98133'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <img 
                  src={iconUrls.coach} 
                  alt="Coach" 
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '50%',
                    border: '2px solid #10b981'
                  }}
                />
                <div>
                  <h4 style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Coach Kersten
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                    Online nu
                  </p>
                </div>
              </div>
              <p style={{ 
                color: '#fff', 
                fontSize: '0.9rem',
                lineHeight: 1.6,
                fontStyle: 'italic'
              }}>
                "Focus op progressive overload deze week. Voeg 2.5kg toe aan je compounds!"
              </p>
            </div>

            {/* Recent Activity */}
            <div style={{
              background: 'rgba(26, 26, 26, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <h3 style={{ 
                color: '#10b981', 
                fontSize: '1rem', 
                marginBottom: '1rem',
                fontWeight: 'bold'
              }}>
                Recente Activiteit
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {weeklyWorkouts > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid #10b98133'
                  }}>
                    <img src={iconUrls.workout} alt="" style={{ width: '18px', height: '18px', opacity: 0.7 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#fff', fontSize: '0.85rem' }}>
                        {weeklyWorkouts} workout{weeklyWorkouts !== 1 ? 's' : ''} deze week
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.25rem' }}>Progress</p>
                    </div>
                  </div>
                )}
                
                {todayCalories > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid #10b98133'
                  }}>
                    <img src={iconUrls.mealplan} alt="" style={{ width: '18px', height: '18px', opacity: 0.7 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#fff', fontSize: '0.85rem' }}>
                        {todayCalories} kcal vandaag
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.25rem' }}>Nutrition</p>
                    </div>
                  </div>
                )}
                
                {streak > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid #10b98133'
                  }}>
                    <img src={iconUrls.fire} alt="" style={{ width: '18px', height: '18px', opacity: 0.7 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#fff', fontSize: '0.85rem' }}>
                        {streak} dagen streak! 🔥
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.25rem' }}>Keep going!</p>
                    </div>
                  </div>
                )}
                
                {!weeklyWorkouts && !todayCalories && !streak && (
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                    Begin met trainen om activiteit te zien
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Quick Actions */}
      {!isDesktop && (
        <div style={{ marginBottom: '2rem', marginTop: '2rem' }}>
          <h3 style={{ 
            color: '#fff', 
            fontSize: '1.1rem', 
            marginBottom: '1rem',
            fontWeight: 'bold'
          }}>
            Snelle Acties
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            {quickActions.map(action => (
              <button
                key={action.id}
                onClick={() => setCurrentView(action.id)}
                style={{
                  background: action.gradient,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <img 
                  src={action.icon} 
                  alt={action.label}
                  style={{ 
                    width: '40px', 
                    height: '40px',
                    filter: 'brightness(1.1)'
                  }}
                />
                <span style={{ 
                  color: '#fff', 
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
