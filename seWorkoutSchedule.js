// src/modules/workout/hooks/useWorkoutSchedule.js
import { useState, useEffect } from 'react'
import workoutService from '../WorkoutService'

export default function useWorkoutSchedule(schema, clientId) {
  const [weekSchedule, setWeekSchedule] = useState({})
  const [swapMode, setSwapMode] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialize default schedule
  useEffect(() => {
    if (schema?.week_structure) {
      initializeSchedule()
    }
  }, [schema, clientId])
  
  const initializeSchedule = async () => {
    setIsLoading(true)
    
    // Try to load saved schedule first
    if (clientId) {
      const savedSchedule = await workoutService.getWeekSchedule(clientId)
      if (savedSchedule) {
        setWeekSchedule(savedSchedule)
        setIsLoading(false)
        return
      }
    }
    
    // Otherwise use default schedule
    const workoutDays = Object.keys(schema.week_structure)
    const defaultSchedule = {}
    
    // Smart default assignment
    if (workoutDays[0]) defaultSchedule['Monday'] = workoutDays[0]
    if (workoutDays[1]) defaultSchedule['Wednesday'] = workoutDays[1]
    if (workoutDays[2]) defaultSchedule['Friday'] = workoutDays[2]
    if (workoutDays[3]) defaultSchedule['Sunday'] = workoutDays[3]
    if (workoutDays[4]) defaultSchedule['Tuesday'] = workoutDays[4]
    if (workoutDays[5]) defaultSchedule['Thursday'] = workoutDays[5]
    
    setWeekSchedule(defaultSchedule)
    setIsLoading(false)
  }
  
  // Save schedule to database
  const saveSchedule = async (newSchedule) => {
    if (clientId) {
      await workoutService.updateWeekSchedule(clientId, newSchedule)
    }
  }
  
  // Handle day swap
  const handleDaySwap = (day) => {
    if (!swapMode) return
    
    if (selectedWorkout) {
      // Assign selected workout to this day
      const newSchedule = { ...weekSchedule }
      
      // Remove workout from other days
      Object.keys(newSchedule).forEach(d => {
        if (newSchedule[d] === selectedWorkout) {
          delete newSchedule[d]
        }
      })
      
      // Assign to new day
      newSchedule[day] = selectedWorkout
      setWeekSchedule(newSchedule)
      saveSchedule(newSchedule)
      
      // Reset selection
      setSelectedWorkout(null)
      
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50)
    } else if (weekSchedule[day]) {
      // Select this day's workout for swapping
      setSelectedWorkout(weekSchedule[day])
    }
  }
  
  // Quick assign workout
  const quickAssignWorkout = (workoutKey, day) => {
    const newSchedule = { ...weekSchedule }
    
    // Remove from other days
    Object.keys(newSchedule).forEach(d => {
      if (newSchedule[d] === workoutKey) {
        delete newSchedule[d]
      }
    })
    
    // Assign to selected day
    newSchedule[day] = workoutKey
    setWeekSchedule(newSchedule)
    saveSchedule(newSchedule)
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50)
  }
  
  // Check for conflicts
  const checkConflict = (day, workoutKey) => {
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayIndex = weekDays.indexOf(day)
    const prevDay = dayIndex > 0 ? weekDays[dayIndex - 1] : null
    
    if (!schema?.week_structure[workoutKey]) return null
    
    const currentFocus = schema.week_structure[workoutKey].focus?.toLowerCase()
    
    if (prevDay && weekSchedule[prevDay]) {
      const prevFocus = schema.week_structure[weekSchedule[prevDay]]?.focus?.toLowerCase()
      
      if (prevFocus && currentFocus) {
        // Check for same muscle group on consecutive days
        if (prevFocus.includes('chest') && currentFocus.includes('chest')) {
          return '⚠️ Same muscle group on consecutive days!'
        }
        if (prevFocus.includes('legs') && currentFocus.includes('legs')) {
          return '⚠️ Legs on consecutive days - need recovery!'
        }
        if (prevFocus.includes('back') && currentFocus.includes('back')) {
          return '⚠️ Back on consecutive days - consider rest!'
        }
      }
    }
    
    return null
  }
  
  return {
    weekSchedule,
    setWeekSchedule,
    swapMode,
    setSwapMode,
    selectedWorkout,
    setSelectedWorkout,
    handleDaySwap,
    quickAssignWorkout,
    checkConflict,
    isLoading
  }
}

