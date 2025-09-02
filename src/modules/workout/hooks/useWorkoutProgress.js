
import { useState, useEffect } from 'react'
import WorkoutService from '../WorkoutService'

export default function useWorkoutProgress(clientId, db) {
  const [completedWorkouts, setCompletedWorkouts] = useState([])
  const [weeklyStats, setWeeklyStats] = useState({
    total: 0,
    completed: 0,
    streak: 0,
    percentage: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  
  // Create service instance with db
  const workoutService = new WorkoutService(db)
  
  // Load weekly progress on mount
  useEffect(() => {
    if (clientId) {
      loadWeeklyProgress()
      loadWorkoutStats()
    }
  }, [clientId])
  
  // Load weekly progress
  const loadWeeklyProgress = async () => {
    setIsLoading(true)
    const progress = await workoutService.getWeeklyProgress(clientId)
    setCompletedWorkouts(progress)
    setIsLoading(false)
  }
  
  // Load workout stats
  const loadWorkoutStats = async () => {
    const stats = await workoutService.getWorkoutStats(clientId)
    
    setWeeklyStats({
      total: stats.total_workouts || 0,
      completed: stats.this_week || 0,
      streak: stats.current_streak || 0,
      percentage: stats.this_week ? Math.round((stats.this_week / 7) * 100) : 0,
      bestStreak: stats.best_streak || 0,
      lastWeek: stats.last_week || 0
    })
  }
  
  // Mark workout as complete
  const markWorkoutComplete = async (workoutData) => {
    const result = await workoutService.markWorkoutCompleted(clientId, workoutData)
    
    if (result) {
      // Reload progress
      await loadWeeklyProgress()
      await loadWorkoutStats()
      
      // Show success feedback
      if (navigator.vibrate) navigator.vibrate([50, 30, 50])
      
      return true
    }
    
    return false
  }
  
  // Check if workout is completed today
  const isWorkoutCompletedToday = () => {
    const today = new Date().toDateString()
    return completedWorkouts.some(w => 
      new Date(w.completed_at).toDateString() === today
    )
  }
  
  // Get progress for specific day
  const getDayProgress = (day) => {
    return completedWorkouts.find(w => w.workout_day === day)
  }
  
  // Calculate weekly completion rate
  const getWeeklyCompletionRate = () => {
    const plannedWorkouts = weeklyStats.total || 0
    const completed = weeklyStats.completed || 0
    
    if (plannedWorkouts === 0) return 0
    return Math.round((completed / plannedWorkouts) * 100)
  }
  
  // Get motivational message based on progress
  const getMotivationalMessage = () => {
    const rate = getWeeklyCompletionRate()
    
    if (rate === 100) return "🔥 Perfect week! Amazing job!"
    if (rate >= 80) return "💪 Great consistency! Keep it up!"
    if (rate >= 60) return "👍 Good progress! Push for more!"
    if (rate >= 40) return "📈 Building momentum!"
    if (rate >= 20) return "🚀 Just getting started!"
    return "💡 Let's make this week count!"
  }
  
  return {
    completedWorkouts,
    weeklyStats,
    isLoading,
    markWorkoutComplete,
    isWorkoutCompletedToday,
    getDayProgress,
    getWeeklyCompletionRate,
    getMotivationalMessage,
    loadWeeklyProgress
  }
}
