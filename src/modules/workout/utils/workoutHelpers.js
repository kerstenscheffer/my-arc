// src/modules/workout/utils/workoutHelpers.js

/**
 * Get the current week number of the year
 */
export const getWeekNumber = (date = new Date()) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

/**
 * Get the day index (Monday = 0, Sunday = 6)
 */
export const getDayIndex = (date = new Date()) => {
  return (date.getDay() + 6) % 7
}

/**
 * Format duration in minutes to readable string
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

/**
 * Calculate estimated workout duration
 */
export const calculateWorkoutDuration = (exercises) => {
  if (!exercises || exercises.length === 0) return 0
  
  let totalMinutes = 5 // Warm-up time
  
  exercises.forEach(exercise => {
    const sets = parseInt(exercise.sets) || 3
    const restSeconds = parseInt(exercise.rust) || 90
    const setDuration = 45 // Average seconds per set
    
    // Calculate time for this exercise
    const exerciseTime = (sets * setDuration + (sets - 1) * restSeconds) / 60
    totalMinutes += exerciseTime
  })
  
  totalMinutes += 5 // Cool-down time
  
  return Math.round(totalMinutes)
}

/**
 * Calculate total volume for a workout
 */
export const calculateWorkoutVolume = (exercises) => {
  if (!exercises || exercises.length === 0) return 0
  
  return exercises.reduce((total, exercise) => {
    const sets = parseInt(exercise.sets) || 0
    const reps = parseInt(exercise.reps) || 0
    return total + (sets * reps)
  }, 0)
}

/**
 * Get muscle group color
 */
export const getMuscleGroupColor = (muscleGroup) => {
  const colors = {
    chest: '#ef4444',
    back: '#3b82f6',
    legs: '#10b981',
    shoulders: '#f59e0b',
    biceps: '#8b5cf6',
    triceps: '#ec4899',
    abs: '#06b6d4',
    glutes: '#f97316'
  }
  
  return colors[muscleGroup.toLowerCase()] || '#6b7280'
}

/**
 * Get intensity level based on RPE
 */
export const getIntensityLevel = (rpe) => {
  const rpeValue = parseInt(rpe) || 0
  
  if (rpeValue <= 5) return { level: 'Easy', color: '#10b981' }
  if (rpeValue <= 7) return { level: 'Moderate', color: '#f59e0b' }
  if (rpeValue <= 9) return { level: 'Hard', color: '#ef4444' }
  return { level: 'Max', color: '#dc2626' }
}

/**
 * Check if two muscle groups conflict (shouldn't be trained consecutively)
 */
export const checkMuscleConflict = (muscle1, muscle2) => {
  const conflicts = {
    chest: ['chest', 'triceps', 'shoulders'],
    back: ['back', 'biceps'],
    legs: ['legs', 'glutes'],
    shoulders: ['shoulders', 'chest', 'triceps'],
    biceps: ['biceps', 'back'],
    triceps: ['triceps', 'chest', 'shoulders'],
    glutes: ['glutes', 'legs']
  }
  
  const group1 = muscle1.toLowerCase()
  const group2 = muscle2.toLowerCase()
  
  return conflicts[group1]?.includes(group2) || false
}

/**
 * Generate smart workout schedule based on frequency
 */
export const generateSmartSchedule = (workouts, frequency) => {
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const schedule = {}
  
  switch(frequency) {
    case 3:
      // 3x per week: Mon/Wed/Fri
      if (workouts[0]) schedule['Monday'] = workouts[0]
      if (workouts[1]) schedule['Wednesday'] = workouts[1]
      if (workouts[2]) schedule['Friday'] = workouts[2]
      break
      
    case 4:
      // 4x per week: Mon/Tue/Thu/Fri
      if (workouts[0]) schedule['Monday'] = workouts[0]
      if (workouts[1]) schedule['Tuesday'] = workouts[1]
      if (workouts[2]) schedule['Thursday'] = workouts[2]
      if (workouts[3]) schedule['Friday'] = workouts[3]
      break
      
    case 5:
      // 5x per week: Mon/Tue/Wed/Fri/Sat
      if (workouts[0]) schedule['Monday'] = workouts[0]
      if (workouts[1]) schedule['Tuesday'] = workouts[1]
      if (workouts[2]) schedule['Wednesday'] = workouts[2]
      if (workouts[3]) schedule['Friday'] = workouts[3]
      if (workouts[4]) schedule['Saturday'] = workouts[4]
      break
      
    case 6:
      // 6x per week: All except Sunday
      workouts.forEach((workout, i) => {
        if (i < 6) schedule[weekDays[i]] = workout
      })
      break
      
    default:
      // Default distribution
      workouts.forEach((workout, i) => {
        if (i < weekDays.length) {
          const dayIndex = Math.floor((i / workouts.length) * 7)
          schedule[weekDays[dayIndex]] = workout
        }
      })
  }
  
  return schedule
}

/**
 * Parse rest time string to seconds
 */
export const parseRestTime = (restString) => {
  if (!restString) return 90
  
  const match = restString.match(/(\d+)/)
  if (match) {
    const value = parseInt(match[1])
    if (restString.includes('min')) return value * 60
    return value
  }
  
  return 90
}

/**
 * Format seconds to display string
 */
export const formatRestTime = (seconds) => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${minutes}:${secs.toString().padStart(2, '0')}` : `${minutes}min`
}

/**
 * Get workout recommendations based on goals
 */
export const getWorkoutRecommendations = (goal) => {
  const recommendations = {
    strength: {
      sets: '3-5',
      reps: '3-6',
      rest: '2-3min',
      rpe: '7-9',
      frequency: '3-4x/week'
    },
    hypertrophy: {
      sets: '3-4',
      reps: '8-12',
      rest: '60-90s',
      rpe: '7-8',
      frequency: '4-6x/week'
    },
    endurance: {
      sets: '2-3',
      reps: '15-20',
      rest: '30-60s',
      rpe: '6-7',
      frequency: '3-5x/week'
    },
    power: {
      sets: '3-5',
      reps: '1-5',
      rest: '3-5min',
      rpe: '8-10',
      frequency: '2-3x/week'
    }
  }
  
  return recommendations[goal] || recommendations.hypertrophy
}

/**
 * Calculate progressive overload suggestions
 */
export const calculateProgressiveOverload = (currentStats, weekNumber) => {
  const suggestions = []
  
  // Week 1-2: Focus on form
  if (weekNumber <= 2) {
    suggestions.push('Focus on perfecting form and technique')
  }
  
  // Week 3-4: Increase reps
  else if (weekNumber <= 4) {
    suggestions.push('Try adding 1-2 reps per set')
  }
  
  // Week 5-6: Increase weight
  else if (weekNumber <= 6) {
    suggestions.push('Increase weight by 2.5-5%')
  }
  
  // Week 7-8: Add set
  else if (weekNumber <= 8) {
    suggestions.push('Consider adding an extra set')
  }
  
  // Week 9+: Deload
  else {
    suggestions.push('Consider a deload week (reduce volume by 40%)')
  }
  
  return suggestions
}

export default {
  getWeekNumber,
  getDayIndex,
  formatDuration,
  calculateWorkoutDuration,
  calculateWorkoutVolume,
  getMuscleGroupColor,
  getIntensityLevel,
  checkMuscleConflict,
  generateSmartSchedule,
  parseRestTime,
  formatRestTime,
  getWorkoutRecommendations,
  calculateProgressiveOverload
}
