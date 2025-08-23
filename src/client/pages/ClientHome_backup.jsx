// src/client/pages/ClientHome.jsx - REFACTORED VERSION
// ✅ Gebruikt DatabaseService voor ALLE data
// ✅ Inclusief Notification System

import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import DatabaseService from '../../services/DatabaseService'

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

// Notification Component
const NotificationBanner = ({ notification, onDismiss, onAction }) => {
  const typeStyles = {
    motivation: { bg: '#10b981', icon: '🎯' },
    warning: { bg: '#f59e0b', icon: '⚠️' },
    announcement: { bg: '#3b82f6', icon: '📢' },
    task: { bg: '#8b5cf6', icon: '✅' },
    achievement: { bg: '#ec4899', icon: '🏆' },
    personal: { bg: '#06b6d4', icon: '💬' }
  }
  
  const style = typeStyles[notification.type] || typeStyles.announcement
  
  return (
    <div style={{
      background: `linear-gradient(135deg, ${style.bg}22 0%, ${style.bg}11 100%)`,
      border: `1px solid ${style.bg}44`,
      borderRadius: '12px',
      padding: '1rem',
      marginBottom: '1rem',
      position: 'relative',
      animation: 'slideInFromTop 0.3s ease-out'
    }}>
      {/* Priority badge */}
      {notification.priority === 'urgent' && (
        <span style={{
          position: 'absolute',
          top: '-8px',
          right: '1rem',
          background: '#ef4444',
          color: '#fff',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          BELANGRIJK
        </span>
      )}
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
        <span style={{ fontSize: '1.5rem' }}>{style.icon}</span>
        
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#fff', marginBottom: '0.25rem', fontWeight: 'bold' }}>
            {notification.title}
          </h4>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
            {notification.message}
          </p>
          
          {/* Action button */}
          {notification.action_type && (
            <button
              onClick={() => onAction(notification)}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 1rem',
                background: style.bg,
                border: 'none',
                borderRadius: '6px',
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {notification.action_label || 'Bekijk'}
            </button>
          )}
        </div>
        
        {/* Dismiss button */}
        <button
          onClick={() => onDismiss(notification.id)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#999',
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
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = '#999'
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default function ClientHome({ client, setCurrentView }) {
  const { t } = useLanguage()
  const isMobile = window.innerWidth <= 768
  const isDesktop = window.innerWidth >= 1400
  const db = DatabaseService // Use DatabaseService
  
  // Safety check for client
  if (!client) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#fff' }}>Loading client data...</p>
      </div>
    )
  }
  
  // Progress states
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
  
  // Notification states
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Video states
  const [featuredVideo, setFeaturedVideo] = useState({
    url: 'https://www.youtube.com/watch?v=10FI8bNX0xw',
    title: 'Welcome to MY ARC Training',
    description: 'Start jouw fitness journey vandaag! 💪'
  })
  const [showVideo, setShowVideo] = useState(true)
  
  // Load all data on mount
  useEffect(() => {
    loadAllData()
    
    // Refresh notifications every minute
    const interval = setInterval(() => {
      loadNotifications()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [client])
  
  const loadAllData = async () => {
    if (!client?.id) return
    
    try {
      // Load all data in parallel for performance
      await Promise.all([
        loadProgressData(),
        loadNotifications(),
        loadFeaturedVideo()
      ])
    } catch (error) {
      console.error('Error loading home data:', error)
    }
  }
  
  const loadProgressData = async () => {
    if (!client?.id) return
    
    try {
      // Get workout plan and today's workout
      const workoutPlan = await db.getClientWorkoutPlan(client.id)
      setWorkoutPlan(workoutPlan)
      
      if (workoutPlan?.workout_schemas) {
        const todayWorkout = await db.getTodaysWorkout(client.id)
        if (todayWorkout) {
          const muscleGroups = todayWorkout.name || 
            todayWorkout.exercises?.map(e => e.muscle_group).filter(Boolean).join(' & ') || 
            'Training'
          setNextWorkout(muscleGroups)
        } else {
          setNextWorkout('Rust dag')
        }
        
        // Weekly goal from schema
        const daysPerWeek = workoutPlan.workout_schemas.days_per_week || 4
        setWeeklyGoal(daysPerWeek)
      }
      
      // Get workout completions
      const weeklyCount = await db.getWeeklyWorkoutCount(client.id)
      setWeeklyWorkouts(weeklyCount)
      
      // Get streak
      const currentStreak = await db.getClientStreak(client.id)
      setStreak(currentStreak)
      
      // Get meal progress
      const mealProgress = await db.getTodaysMealProgress(client.id)
      setTodayCalories(Math.round(mealProgress.calories))
      
      // Get meal targets
      const mealTargets = await db.getClientMealTargets(client.id)
      setCalorieGoal(mealTargets.calories)
      
      // Get MY ARC Score
      const score = await db.getMyArcScore(client.id)
      setMyArcScore(score)
      
      // Get weight goals (if we have that table)
      // For now using defaults
      setWeightCurrent(client.current_weight || 80)
      setWeightGoal(client.goal_weight || 75)
      
    } catch (error) {
      console.error('Error loading progress data:', error)
    }
  }
  
  const loadNotifications = async () => {
    if (!client?.id) return
    
    try {
      // Get coach notifications
      const coachNotifications = await db.getActiveNotifications(client.id, {
        limit: 5
      })
      
      // Generate dynamic notifications based on current data
      const dynamicNotifications = []
      
      // Workout reminder
      if (nextWorkout && nextWorkout !== 'Rust dag') {
        const now = new Date().getHours()
        if (now < 20 && weeklyWorkouts < weeklyGoal) {
          dynamicNotifications.push({
            id: `workout-reminder-${Date.now()}`,
            type: 'task',
            priority: 'normal',
            title: `Vandaag: ${nextWorkout}`,
            message: 'Vergeet je workout niet! Beste tijd om te trainen.',
            action_type: 'workout',
            action_target: 'workout',
            action_label: 'Start Workout'
          })
        }
      }
      
      // Calorie tracking
      const caloriesRemaining = calorieGoal - todayCalories
      if (caloriesRemaining > 500) {
        dynamicNotifications.push({
          id: `calories-low-${Date.now()}`,
          type: 'warning',
          priority: caloriesRemaining > 1000 ? 'urgent' : 'normal',
          title: `Nog ${caloriesRemaining} kcal te gaan`,
          message: caloriesRemaining > 1000 
            ? 'Je hebt vandaag nog niet veel gegeten. Vergeet niet te eten!' 
            : 'Je hebt nog ruimte voor maaltijden vandaag.',
          action_type: 'meal',
          action_target: 'mealplan',
          action_label: 'Meal Plan'
        })
      } else if (caloriesRemaining < -200) {
        dynamicNotifications.push({
          id: `calories-over-${Date.now()}`,
          type: 'warning',
          priority: 'low',
          title: `${Math.abs(caloriesRemaining)} kcal over je doel`,
          message: 'Je zit boven je calorie doel voor vandaag.',
          action_type: 'meal',
          action_target: 'mealplan',
          action_label: 'Bekijk'
        })
      }
      
      // Streak celebration
      if (streak > 0 && streak % 7 === 0) {
        dynamicNotifications.push({
          id: `streak-celebration-${Date.now()}`,
          type: 'achievement',
          priority: 'normal',
          title: `🔥 ${streak} dagen streak!`,
          message: 'Geweldige consistentie! Keep it up!',
          action_type: null
        })
      }
      
      // Combine and sort notifications
      const allNotifications = [...coachNotifications, ...dynamicNotifications]
        .sort((a, b) => {
          // Priority order: urgent > normal > low
          const priorityOrder = { urgent: 0, normal: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
        .slice(0, 5) // Max 5 notifications
      
      setNotifications(allNotifications)
      
      // Update unread count
      const unread = await db.getUnreadNotificationCount(client.id)
      setUnreadCount(unread)
      
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }
  
  const loadFeaturedVideo = async () => {
    // In future: load from database
    // For now keep default video
    console.log('Using default video')
  }
  
  const handleNotificationAction = (notification) => {
    // Mark as read
    if (notification.id && !notification.id.includes('-')) {
      db.markNotificationRead(notification.id)
    }
    
    // Navigate based on action
    if (notification.action_target) {
      setCurrentView(notification.action_target)
    }
  }
  
  const handleNotificationDismiss = async (notificationId) => {
    // If it's a database notification, mark as dismissed
    if (notificationId && !notificationId.includes('-')) {
      await db.dismissNotification(notificationId)
    }
    
    // Remove from UI
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }
  
  const calculateMyArcScore = () => {
    // This is now handled by DatabaseService.getMyArcScore()
    // Keep for backwards compatibility
  }
  
  return (
    <div style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
      <style>
        {`
          @keyframes slideInFromTop {
            0% {
              opacity: 0;
              transform: translateY(-20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      
      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          {notifications.map(notification => (
            <NotificationBanner
              key={notification.id}
              notification={notification}
              onDismiss={handleNotificationDismiss}
              onAction={handleNotificationAction}
            />
          ))}
        </div>
      )}
      
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '12px',
        padding: isMobile ? '1.5rem' : '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: isMobile ? '1.5rem' : '2rem',
          marginBottom: '0.5rem'
        }}>
          {t('common.welcome')}, {client.first_name}! 👋
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: isMobile ? '0.9rem' : '1rem'
        }}>
          {t('client.welcomeMessage')}
        </p>
        
        {/* MY ARC Score */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `conic-gradient(#10b981 0deg, #10b981 ${myArcScore * 3.6}deg, rgba(255,255,255,0.1) ${myArcScore * 3.6}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {myArcScore}
              </span>
            </div>
          </div>
          <div>
            <p style={{ color: '#10b981', fontWeight: 'bold', margin: 0 }}>
              MY ARC Score
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: 0 }}>
              Je overall fitness performance
            </p>
          </div>
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Workouts This Week */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center',
          border: '1px solid #333'
        }}>
          <img src={iconUrls.muscle} alt="" style={{ width: '30px', height: '30px', marginBottom: '0.5rem' }} />
          <p style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold', margin: '0' }}>
            {weeklyWorkouts}/{weeklyGoal}
          </p>
          <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Workouts Deze Week
          </p>
        </div>
        
        {/* Calories Today */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center',
          border: '1px solid #333'
        }}>
          <img src={iconUrls.weight} alt="" style={{ width: '30px', height: '30px', marginBottom: '0.5rem' }} />
          <p style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold', margin: '0' }}>
            {todayCalories}
          </p>
          <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            kcal Vandaag
          </p>
        </div>
        
        {/* Streak */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center',
          border: '1px solid #333'
        }}>
          <img src={iconUrls.fire} alt="" style={{ width: '30px', height: '30px', marginBottom: '0.5rem' }} />
          <p style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold', margin: '0' }}>
            {streak}
          </p>
          <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Dagen Streak
          </p>
        </div>
        
        {/* Weight Progress */}
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center',
          border: '1px solid #333'
        }}>
          <img src={iconUrls.calendar} alt="" style={{ width: '30px', height: '30px', marginBottom: '0.5rem' }} />
          <p style={{ color: '#8b5cf6', fontSize: '1.5rem', fontWeight: 'bold', margin: '0' }}>
            {Math.abs(weightCurrent - weightGoal)}kg
          </p>
          <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Te Gaan
          </p>
        </div>
      </div>
      
      {/* Today's Focus */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Next Workout Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #10b98133'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <img src={iconUrls.workout} alt="" style={{ width: '24px', height: '24px' }} />
            <h3 style={{ color: '#10b981', margin: 0 }}>Volgende Workout</h3>
          </div>
          <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {nextWorkout || 'Nog geen workout gepland'}
          </p>
          <button
            onClick={() => setCurrentView('workout')}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#10b981',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Start Workout →
          </button>
        </div>
        
        {/* Calories Remaining Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #f59e0b33'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <img src={iconUrls.mealplan} alt="" style={{ width: '24px', height: '24px' }} />
            <h3 style={{ color: '#f59e0b', margin: 0 }}>Calorieën Status</h3>
          </div>
          <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {calorieGoal - todayCalories > 0 
              ? `Nog ${calorieGoal - todayCalories} kcal te gaan`
              : `${Math.abs(calorieGoal - todayCalories)} kcal over`
            }
          </p>
          <button
            onClick={() => setCurrentView('mealplan')}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#f59e0b',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Bekijk Meal Plan →
          </button>
        </div>
      </div>
      
      {/* Featured Video */}
      {featuredVideo && showVideo && (
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          <button
            onClick={() => setShowVideo(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              cursor: 'pointer',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}
          >
            ✕
          </button>
          
          {getYouTubeVideoId(featuredVideo.url) ? (
            <iframe
              width="100%"
              height={isMobile ? "200" : "400"}
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(featuredVideo.url)}`}
              title={featuredVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <img src={iconUrls.video} alt="" style={{ width: '60px', height: '60px', marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ color: '#fff' }}>{featuredVideo.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>{featuredVideo.description}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem'
      }}>
        <button
          onClick={() => setCurrentView('workout')}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#10b981'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <img src={iconUrls.workout} alt="" style={{ width: '40px', height: '40px', marginBottom: '0.75rem' }} />
          <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Workout Plan</p>
          <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>{t('client.todayTraining')}</p>
        </button>
        
        <button
          onClick={() => setCurrentView('mealplan')}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#f59e0b'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <img src={iconUrls.mealplan} alt="" style={{ width: '40px', height: '40px', marginBottom: '0.75rem' }} />
          <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Meal Plan</p>
          <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>{t('client.viewPlan')}</p>
        </button>
        
        <button
          onClick={() => setCurrentView('progress')}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8b5cf6'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <img src={iconUrls.progress} alt="" style={{ width: '40px', height: '40px', marginBottom: '0.75rem' }} />
          <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Progress</p>
          <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>{t('client.logProgress')}</p>
        </button>
      </div>
    </div>
  )
}
