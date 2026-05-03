// src/modules/workout/hooks/useWorkoutStats.js
// 🎯 WORKOUT STATS HOOK - Real DB queries

import { useState, useEffect } from 'react'

export default function useWorkoutStats(client, schema, db) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    exercisePR: { current: 0, target: 0, exercise: 'Bench Press', lastValue: 0 },
    weekProgress: { completed: 0, total: 5 },
    todayPlan: { exercises: 0, minutes: 0, name: 'Rest Day' },
    totalVolume: { current: 0, target: 15000 }
  })

  useEffect(() => {
    if (client?.id && db) {
      loadAllStats()
    }
  }, [client?.id, db])

  const loadAllStats = async () => {
    try {
      setLoading(true)
      
      const [prData, weekData, todayData, volumeData] = await Promise.all([
        loadExercisePR(),
        loadWeekProgress(),
        loadTodayPlan(),
        loadTotalVolume()
      ])
      
      setStats({
        exercisePR: prData,
        weekProgress: weekData,
        todayPlan: todayData,
        totalVolume: volumeData
      })
      
      setLoading(false)
    } catch (error) {
      console.error('❌ Error loading workout stats:', error)
      setLoading(false)
    }
  }

  // 1. EXERCISE PR - From workout_progress
  const loadExercisePR = async () => {
    try {
      const exerciseName = 'Barbell Bench Press'
      
      const { data, error } = await db.supabase
        .from('workout_progress')
        .select(`
          exercise_name,
          sets,
          created_at,
          session_id,
          workout_sessions!inner(workout_date, user_id)
        `)
        .eq('workout_sessions.user_id', client.id)
        .ilike('exercise_name', `%${exerciseName}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      if (data && data.length > 0) {
        // Get max weight from latest session
        const latest = data[0]
        const sets = latest.sets || []
        const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0))
        
        // Get previous max
        let previousMax = maxWeight * 0.95
        if (data.length > 1) {
          const previousSets = data[1].sets || []
          previousMax = Math.max(...previousSets.map(s => parseFloat(s.weight) || 0))
        }
        
        return {
          current: Math.round(maxWeight),
          target: Math.round(maxWeight * 1.05),
          exercise: exerciseName,
          lastValue: Math.round(previousMax)
        }
      }
      
      return {
        current: 0,
        target: 0,
        exercise: exerciseName,
        lastValue: 0
      }
    } catch (error) {
      console.error('❌ Error loading PR:', error)
      return {
        current: 0,
        target: 0,
        exercise: 'Bench Press',
        lastValue: 0
      }
    }
  }

  // 2. WEEK PROGRESS - From workout_completion
  const loadWeekProgress = async () => {
    try {
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
      startOfWeek.setHours(0, 0, 0, 0)
      
      const { data, error } = await db.supabase
        .from('workout_completion')
        .select('*')
        .eq('client_id', client.id)
        .gte('workout_date', startOfWeek.toISOString().split('T')[0])
        .eq('completed', true)

      if (error) throw error

      // Get target from schema
      const targetWorkouts = schema?.days_per_week || 5

      return {
        completed: data?.length || 0,
        total: targetWorkouts
      }
    } catch (error) {
      console.error('❌ Error loading week progress:', error)
      return { completed: 0, total: 5 }
    }
  }

  // 3. TODAY'S PLAN - From schema
  const loadTodayPlan = async () => {
    try {
      if (!schema?.week_structure) {
        return { exercises: 0, minutes: 0, name: 'Rest Day' }
      }

      const today = new Date()
      const dayIndex = (today.getDay() + 6) % 7 // 0=Monday
      const dayKeys = ['dag1', 'dag2', 'dag3', 'dag4', 'dag5', 'dag6', 'dag7']
      
      // Simple mapping - dag1 = Monday, dag2 = Tuesday, etc
      const todayKey = dayKeys[dayIndex]
      const todayWorkout = schema.week_structure[todayKey]
      
      if (todayWorkout) {
        return {
          exercises: todayWorkout.exercises?.length || 0,
          minutes: parseInt(todayWorkout.geschatteTijd) || 60,
          name: todayWorkout.name || todayWorkout.focus || 'Workout'
        }
      }
      
      return { exercises: 0, minutes: 0, name: 'Rest Day' }
    } catch (error) {
      console.error('❌ Error loading today plan:', error)
      return { exercises: 0, minutes: 0, name: 'Rest Day' }
    }
  }

  // 4. TOTAL VOLUME - From workout_progress this week
  const loadTotalVolume = async () => {
    try {
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1)
      
      const { data, error } = await db.supabase
        .from('workout_progress')
        .select(`
          sets,
          workout_sessions!inner(workout_date, user_id)
        `)
        .eq('workout_sessions.user_id', client.id)
        .gte('workout_sessions.workout_date', startOfWeek.toISOString().split('T')[0])

      if (error) throw error

      let totalVolume = 0
      if (data) {
        data.forEach(log => {
          const sets = log.sets || []
          sets.forEach(set => {
            const weight = parseFloat(set.weight) || 0
            const reps = parseInt(set.reps) || 0
            totalVolume += weight * reps
          })
        })
      }

      return {
        current: Math.round(totalVolume),
        target: 15000
      }
    } catch (error) {
      console.error('❌ Error loading volume:', error)
      return { current: 0, target: 15000 }
    }
  }

  return { stats, loading, refresh: loadAllStats }
}
