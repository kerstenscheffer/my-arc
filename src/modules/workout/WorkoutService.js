// src/modules/workout/WorkoutService.js
// According to MY ARC architecture, we receive db as prop, not extend

class WorkoutService {
  constructor(db) {
    this.db = db
  }

  // ==================== WORKOUT PLANS ====================
  
  /**
   * Get workout plan for a client
   */
  async getClientWorkoutPlan(clientId) {
    try {
      if (!this.db) return null
      
      // Use the db method to get workout schemas
      // Adjust based on your actual DatabaseService methods
      const schemas = await this.db.getWorkoutSchemas?.(clientId)
      return schemas?.[0] || null
    } catch (error) {
      console.error('Error fetching workout plan:', error)
      return null
    }
  }

  /**
   * Update week schedule for a client
   */
  async updateWeekSchedule(clientId, weekSchedule) {
    try {
      // Store in localStorage for now
      // This can be replaced with a db method when available
      const key = `workout_schedule_${clientId}`
      localStorage.setItem(key, JSON.stringify(weekSchedule))
      return weekSchedule
    } catch (error) {
      console.error('Error updating week schedule:', error)
      return null
    }
  }

  /**
   * Get saved week schedule
   */
  async getWeekSchedule(clientId) {
    try {
      // Get from localStorage for now
      const key = `workout_schedule_${clientId}`
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error fetching week schedule:', error)
      return null
    }
  }

  // ==================== PROGRESS TRACKING ====================
  
  /**
   * Mark workout as completed
   */
  async markWorkoutCompleted(clientId, workoutData) {
    try {
      const key = `workout_progress_${clientId}`
      const existing = localStorage.getItem(key)
      const progress = existing ? JSON.parse(existing) : []
      
      progress.push({
        ...workoutData,
        completed_at: new Date().toISOString(),
        id: Date.now()
      })
      
      localStorage.setItem(key, JSON.stringify(progress))
      return workoutData
    } catch (error) {
      console.error('Error marking workout completed:', error)
      return null
    }
  }

  /**
   * Get completed workouts for current week
   */
  async getWeeklyProgress(clientId) {
    try {
      const key = `workout_progress_${clientId}`
      const stored = localStorage.getItem(key)
      if (!stored) return []
      
      const allProgress = JSON.parse(stored)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      return allProgress.filter(p => 
        new Date(p.completed_at) > weekAgo
      )
    } catch (error) {
      console.error('Error fetching weekly progress:', error)
      return []
    }
  }

  /**
   * Get workout stats
   */
  async getWorkoutStats(clientId) {
    try {
      const progress = await this.getWeeklyProgress(clientId)
      
      return {
        total_workouts: progress.length,
        current_streak: 0,
        best_streak: 0,
        this_week: progress.length,
        last_week: 0
      }
    } catch (error) {
      console.error('Error fetching workout stats:', error)
      return {
        total_workouts: 0,
        current_streak: 0,
        best_streak: 0,
        this_week: 0,
        last_week: 0
      }
    }
  }

  // ==================== EXERCISE MANAGEMENT ====================
  
  /**
   * Get alternative exercises for a muscle group
   */
  async getAlternativeExercises(muscleGroup, exerciseType = 'all') {
    try {
      // Return from local database for now
      // This can be replaced with db method when available
      const alternatives = []
      
      // Import would happen at top of file normally
      const exerciseDB = {
        chest: { compound: ["Bench Press", "Incline Press"], isolation: ["Flies", "Cable Cross"] },
        back: { compound: ["Pull-ups", "Rows"], isolation: ["Pullovers", "Shrugs"] },
        legs: { compound: ["Squats", "Deadlifts"], isolation: ["Leg Curls", "Extensions"] },
        shoulders: { compound: ["Overhead Press", "Arnold Press"], isolation: ["Lateral Raises"] },
        biceps: { isolation: ["Curls", "Hammer Curls", "Preacher Curls"] },
        triceps: { compound: ["Dips", "Close-Grip Press"], isolation: ["Pushdowns", "Extensions"] }
      }
      
      const group = exerciseDB[muscleGroup.toLowerCase()]
      if (group) {
        if (exerciseType === 'all' || exerciseType === 'compound') {
          alternatives.push(...(group.compound || []))
        }
        if (exerciseType === 'all' || exerciseType === 'isolation') {
          alternatives.push(...(group.isolation || []))
        }
      }
      
      return alternatives.map(name => ({ name, id: name }))
    } catch (error) {
      console.error('Error fetching alternative exercises:', error)
      return []
    }
  }

  /**
   * Save custom exercise for client
   */
  async saveCustomExercise(clientId, exerciseData) {
    try {
      const key = `custom_exercises_${clientId}`
      const existing = localStorage.getItem(key)
      const exercises = existing ? JSON.parse(existing) : []
      
      exercises.push({
        ...exerciseData,
        created_at: new Date().toISOString(),
        id: Date.now()
      })
      
      localStorage.setItem(key, JSON.stringify(exercises))
      return exerciseData
    } catch (error) {
      console.error('Error saving custom exercise:', error)
      return null
    }
  }

  /**
   * Replace exercise in workout
   */
  async replaceExercise(clientId, workoutDay, oldExercise, newExercise) {
    try {
      // This would need the schema to be updated
      // For now just return success
      console.log('Replace exercise:', { clientId, workoutDay, oldExercise, newExercise })
      return { success: true }
    } catch (error) {
      console.error('Error replacing exercise:', error)
      return null
    }
  }

  // ==================== WORKOUT NOTES ====================
  
  /**
   * Save notes for a specific exercise
   */
  async saveExerciseNotes(clientId, workoutDay, exerciseName, notes) {
    try {
      const key = `exercise_notes_${clientId}_${workoutDay}_${exerciseName}`
      localStorage.setItem(key, notes)
      return { notes }
    } catch (error) {
      console.error('Error saving exercise notes:', error)
      return null
    }
  }

  /**
   * Get all exercise notes for client
   */
  async getExerciseNotes(clientId) {
    try {
      const notes = []
      // Get all keys that match the pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`exercise_notes_${clientId}`)) {
          const parts = key.split('_')
          const note = {
            workout_day: parts[3],
            exercise_name: parts.slice(4).join('_'),
            notes: localStorage.getItem(key)
          }
          notes.push(note)
        }
      }
      return notes
    } catch (error) {
      console.error('Error fetching exercise notes:', error)
      return []
    }
  }

  // ==================== PERSONAL RECORDS ====================
  
  /**
   * Save personal record for an exercise
   */
  async savePersonalRecord(clientId, exerciseName, recordData) {
    try {
      const key = `personal_records_${clientId}`
      const existing = localStorage.getItem(key)
      const records = existing ? JSON.parse(existing) : []
      
      records.push({
        exercise_name: exerciseName,
        ...recordData,
        recorded_at: new Date().toISOString(),
        id: Date.now()
      })
      
      localStorage.setItem(key, JSON.stringify(records))
      return recordData
    } catch (error) {
      console.error('Error saving personal record:', error)
      return null
    }
  }

  /**
   * Get personal records for client
   */
  async getPersonalRecords(clientId, exerciseName = null) {
    try {
      const key = `personal_records_${clientId}`
      const stored = localStorage.getItem(key)
      if (!stored) return []
      
      let records = JSON.parse(stored)
      
      if (exerciseName) {
        records = records.filter(r => r.exercise_name === exerciseName)
      }
      
      // Sort by date, newest first
      records.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
      
      return records.slice(0, 50) // Limit to 50 records
    } catch (error) {
      console.error('Error fetching personal records:', error)
      return []
    }
  }
}

// Export the class itself, not an instance
export default WorkoutService
