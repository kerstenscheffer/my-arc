// src/coach/pages/challenge-monitor/adjustments/WorkoutAdjustment.js
import { Dumbbell } from 'lucide-react'

export const workoutConfig = {
  icon: Dumbbell,
  title: 'Workouts',
  color: '#f97316',
  required: 24
}

export async function loadWorkoutData(db, clientId, challengeData) {
  if (!clientId || !challengeData) return null
  
  try {
    const startDate = new Date(challengeData.start_date)
    const endDate = new Date(challengeData.end_date)
    
    const { data: workouts } = await db.supabase
      .from('workout_completions')
      .select('*')
      .eq('client_id', clientId)
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .lte('workout_date', endDate.toISOString().split('T')[0])
      .eq('completed', true)
      .order('workout_date', { ascending: false })
    
    return {
      current: workouts?.length || 0,
      lastEntry: workouts?.[0]?.workout_date || null,
      lastEntryData: workouts?.[0] || null
    }
  } catch (err) {
    console.error('Error loading workout data:', err)
    return null
  }
}

export async function addWorkout(db, clientId, challengeData) {
  const startDate = new Date(challengeData.start_date)
  const endDate = new Date(challengeData.end_date)
  const today = new Date()
  
  // Get all existing workout dates
  const { data: existingWorkouts } = await db.supabase
    .from('workout_completions')
    .select('workout_date')
    .eq('client_id', clientId)
    .gte('workout_date', startDate.toISOString().split('T')[0])
    .lte('workout_date', endDate.toISOString().split('T')[0])
    .eq('completed', true)
  
  const existingDates = new Set(existingWorkouts?.map(w => w.workout_date) || [])
  
  // Find first date without workout (prioritize today backwards)
  let targetDate = null
  for (let i = 0; i <= 56; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    
    if (checkDate < startDate) break
    if (checkDate > endDate) continue
    
    const dateStr = checkDate.toISOString().split('T')[0]
    if (!existingDates.has(dateStr)) {
      targetDate = dateStr
      break
    }
  }
  
  if (!targetDate) {
    throw new Error('No available dates in challenge period')
  }
  
  // Insert workout completion
  const { error } = await db.supabase
    .from('workout_completions')
    .insert({
      client_id: clientId,
      workout_date: targetDate,
      completed: true,
      completed_at: new Date().toISOString(),
      notes: 'Manual adjustment by coach'
    })
  
  if (error) throw error
  
  return {
    success: true,
    message: `Workout added for ${new Date(targetDate).toLocaleDateString()}`
  }
}

export async function removeWorkout(db, clientId, lastEntryData) {
  if (!lastEntryData) {
    throw new Error('No workout to remove')
  }
  
  const { error } = await db.supabase
    .from('workout_completions')
    .delete()
    .eq('id', lastEntryData.id)
  
  if (error) throw error
  
  return {
    success: true,
    message: 'Workout removed'
  }
}
