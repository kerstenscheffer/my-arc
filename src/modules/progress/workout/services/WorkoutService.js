// src/modules/progress/workout/services/WorkoutService.js
// COMPLETE WORKOUT SERVICE - Fixed & Mobile Optimized
// Alle workout logging functionaliteit voor MY ARC

import DatabaseService from '../../../../services/DatabaseService'

class WorkoutService {
  constructor(db) {
    this.db = db || DatabaseService
    this.isMobile = window.innerWidth <= 768
  }

  // ===== WORKOUT LOGGING (CORE FUNCTIE) =====
  async logWorkout(clientId, workoutData) {
    try {
      console.log('💾 Starting workout log for client:', clientId)
      
      const {
        workoutId,
        exercises,
        duration,
        feeling = 'good',
        notes = ''
      } = workoutData

      // Get current user properly with fallback
      let userId
      try {
        const currentUser = await this.db.getCurrentUser()
        userId = currentUser?.id || clientId
      } catch (error) {
        console.warn('Could not get current user, using clientId:', error)
        userId = clientId
      }

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const dutchDayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
      const today = new Date()
      const dayIndex = today.getDay()

      // Prepare session data
      const sessionData = {
        client_id: clientId,
        user_id: userId,
        workout_id: workoutId === 'hiit' ? 'cardio' : workoutId, // Normalize workoutId
        schema_id: null, // Can be extended later for scheduled workouts
        workout_date: today.toISOString().split('T')[0],
        day_name: dayNames[dayIndex],
        day_display_name: dutchDayNames[dayIndex],
        completed_at: today.toISOString(),
        duration_minutes: parseInt(duration) || 0,
        exercises_completed: exercises || [],
        notes: notes,
        feeling: feeling,
        is_completed: true,
        completion_percentage: 100
      }

      console.log('📊 Session data prepared:', sessionData)

      // Save to workout_sessions table
      const { data: session, error: sessionError } = await this.db.supabase
        .from('workout_sessions')
        .insert([sessionData])
        .select()
        .single()

      if (sessionError) {
        console.error('❌ Session save error:', sessionError)
        throw new Error(`Failed to save workout session: ${sessionError.message}`)
      }

      console.log('✅ Session saved with ID:', session.id)

      // Save individual exercises to workout_progress table
      if (exercises && exercises.length > 0) {
        let progressSaved = 0
        
        for (const exercise of exercises) {
          try {
            const { error: progressError } = await this.db.supabase
              .from('workout_progress')
              .insert({
                session_id: session.id,
                exercise_name: exercise.name,
                sets: exercise.sets || [],
                notes: exercise.notes || ''
              })
            
            if (progressError) {
              console.warn(`⚠️ Progress save warning for ${exercise.name}:`, progressError)
            } else {
              progressSaved++
              console.log(`✅ Progress saved for: ${exercise.name}`)
            }
          } catch (exerciseError) {
            console.warn(`⚠️ Exercise progress error for ${exercise.name}:`, exerciseError)
          }
        }
        
        console.log(`📈 Progress saved for ${progressSaved}/${exercises.length} exercises`)
      }

      // Vibrate for mobile feedback
      if (this.isMobile && navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100])
      }

      return session
    } catch (error) {
      console.error('❌ Complete workout log failed:', error)
      throw new Error(`Workout logging failed: ${error.message}`)
    }
  }

  // ===== WORKOUT STATISTICS =====
  async getWorkoutStats(clientId, days = 30) {
    try {
      console.log(`📊 Loading workout stats for client ${clientId} (${days} days)`)
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: sessions, error } = await this.db.supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_completed', true)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .order('workout_date', { ascending: false })

      if (error) {
        console.error('❌ Stats query error:', error)
        return this.getEmptyStats()
      }

      if (!sessions || sessions.length === 0) {
        console.log('📊 No workout sessions found')
        return this.getEmptyStats()
      }

      console.log(`📊 Found ${sessions.length} workout sessions`)

      // Calculate streak (consecutive days)
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Sort sessions by date and check for consecutive days
      const sortedDates = sessions
        .map(s => s.workout_date)
        .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
        .sort((a, b) => new Date(b) - new Date(a))

      for (let i = 0; i < Math.min(sortedDates.length, 30); i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]
        
        if (sortedDates.includes(dateStr)) {
          streak++
        } else if (i > 0) {
          break // Stop at first gap (excluding today)
        }
      }

      // Calculate other metrics
      const totalWorkouts = sessions.length
      const totalMinutes = sessions.reduce((sum, s) => sum + (parseInt(s.duration_minutes) || 0), 0)
      
      // Calculate weekly volume (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekSessions = sessions.filter(s => new Date(s.workout_date) >= weekAgo)
      
      let weeklyVolume = 0
      weekSessions.forEach(session => {
        if (session.exercises_completed && Array.isArray(session.exercises_completed)) {
          session.exercises_completed.forEach(exercise => {
            if (exercise.sets && Array.isArray(exercise.sets)) {
              exercise.sets.forEach(set => {
                const weight = parseFloat(set.weight) || 0
                const reps = parseInt(set.reps) || 0
                weeklyVolume += weight * reps
              })
            }
          })
        }
      })

      // Calculate consistency percentage
      const expectedWorkouts = Math.floor(days / 7) * 3 // Assume 3x per week target
      const consistency = expectedWorkouts > 0 ? Math.min(100, Math.round((totalWorkouts / expectedWorkouts) * 100)) : 0

      const stats = {
        streak,
        totalWorkouts,
        totalMinutes,
        weeklyVolume: Math.round(weeklyVolume),
        consistency
      }

      console.log('📊 Stats calculated:', stats)
      return stats

    } catch (error) {
      console.error('❌ Failed to calculate workout stats:', error)
      return this.getEmptyStats()
    }
  }

  // ===== EMPTY STATS FALLBACK =====
  getEmptyStats() {
    return {
      streak: 0,
      totalWorkouts: 0,
      totalMinutes: 0,
      weeklyVolume: 0,
      consistency: 0
    }
  }

  // ===== SCHEDULED WORKOUT (Future Enhancement) =====
  async getScheduledWorkout(clientId) {
    try {
      // Check if client has a scheduled workout for today
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.db.supabase
        .from('workout_schedule')
        .select(`
          *,
          workout:workouts(*)
        `)
        .eq('client_id', clientId)
        .eq('scheduled_date', today)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn('Scheduled workout query error:', error)
      }
      
      return data || null
    } catch (error) {
      console.log('No scheduled workout found (table may not exist)')
      return null
    }
  }

  // ===== WORKOUT HISTORY =====
  async getWorkoutHistory(clientId, days = 30) {
    try {
      console.log(`📚 Loading workout history for ${days} days`)
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.db.supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', clientId)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .eq('is_completed', true)
        .order('workout_date', { ascending: false })

      if (error) {
        console.error('❌ History query error:', error)
        return []
      }

      console.log(`📚 Found ${data?.length || 0} workout sessions`)
      return data || []
    } catch (error) {
      console.error('❌ Failed to fetch workout history:', error)
      return []
    }
  }

  // ===== PREVIOUS WORKOUT DATA FOR SUGGESTIONS =====
  async getLastWorkoutData(clientId, exerciseName) {
    try {
      console.log(`🔍 Looking for last workout data: ${exerciseName}`)

      // Get the most recent workout progress for this exercise
      const { data, error } = await this.db.supabase
        .from('workout_progress')
        .select(`
          *,
          workout_sessions!inner (
            client_id,
            workout_date
          )
        `)
        .eq('workout_sessions.client_id', clientId)
        .eq('exercise_name', exerciseName)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.log('No previous workout data found:', error)
        return null
      }

      if (data) {
        console.log(`🔍 Found previous data for ${exerciseName}`)
        return data
      }

      return null
    } catch (error) {
      console.error('❌ Error fetching last workout data:', error)
      return null
    }
  }

  // ===== PROGRESS DATA FOR CHARTS =====
  async getProgressData(clientId, exerciseName, days = 90) {
    try {
      console.log(`📈 Loading progress data for: ${exerciseName}`)
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.db.supabase
        .from('workout_progress')
        .select(`
          *,
          workout_sessions!inner (
            client_id,
            workout_date,
            created_at
          )
        `)
        .eq('workout_sessions.client_id', clientId)
        .eq('exercise_name', exerciseName)
        .gte('workout_sessions.workout_date', startDate.toISOString().split('T')[0])
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Progress data query error:', error)
        return []
      }
      
      // Transform data for chart compatibility
      const transformedData = (data || []).map(item => ({
        ...item,
        date: item.workout_sessions?.workout_date || item.created_at?.split('T')[0],
        workout_date: item.workout_sessions?.workout_date
      }))
      
      console.log(`📈 Found ${transformedData.length} progress entries`)
      return transformedData
    } catch (error) {
      console.error('❌ Error fetching progress data:', error)
      return []
    }
  }

  // ===== QUICK WORKOUT TEMPLATES =====
  getQuickWorkouts() {
    return [
      {
        id: 'upper',
        name: 'Upper Body',
        icon: '💪',
        duration: 45,
        description: 'Bovenlichaam training',
        exercises: [
          { 
            name: 'Bench Press', 
            sets: 3, 
            reps: 8, 
            rest: 90,
            description: 'Bankdrukken voor borst'
          },
          { 
            name: 'Bent Over Row', 
            sets: 3, 
            reps: 10, 
            rest: 90,
            description: 'Rowing voor rugspieren'
          },
          { 
            name: 'Shoulder Press', 
            sets: 3, 
            reps: 10, 
            rest: 60,
            description: 'Schouderdrukken'
          },
          { 
            name: 'Lat Pulldown', 
            sets: 3, 
            reps: 12, 
            rest: 60,
            description: 'Lat pulldown voor rug'
          },
          { 
            name: 'Bicep Curls', 
            sets: 3, 
            reps: 12, 
            rest: 45,
            description: 'Biceps curls'
          }
        ]
      },
      {
        id: 'lower',
        name: 'Lower Body', 
        icon: '🦵',
        duration: 50,
        description: 'Onderlichaam training',
        exercises: [
          { 
            name: 'Squats', 
            sets: 4, 
            reps: 8, 
            rest: 120,
            description: 'Squats voor benen'
          },
          { 
            name: 'Romanian Deadlift', 
            sets: 3, 
            reps: 10, 
            rest: 90,
            description: 'RDL voor hamstrings'
          },
          { 
            name: 'Leg Press', 
            sets: 3, 
            reps: 12, 
            rest: 90,
            description: 'Beenpers machine'
          },
          { 
            name: 'Walking Lunges', 
            sets: 3, 
            reps: 10, 
            rest: 60,
            description: 'Loopuitvallen'
          },
          { 
            name: 'Calf Raises', 
            sets: 4, 
            reps: 15, 
            rest: 45,
            description: 'Kuiten oefening'
          }
        ]
      },
      {
        id: 'hiit',
        name: 'HIIT Cardio',
        icon: '🔥', 
        duration: 30,
        description: 'High Intensity Interval Training',
        exercises: [
          { 
            name: 'Burpees', 
            sets: 4, 
            reps: 10, 
            rest: 30,
            description: 'Full body burpees'
          },
          { 
            name: 'Mountain Climbers', 
            sets: 4, 
            reps: 20, 
            rest: 30,
            description: 'Bergbeklimmers cardio'
          },
          { 
            name: 'Jump Squats', 
            sets: 4, 
            reps: 15, 
            rest: 30,
            description: 'Explosieve jump squats'
          },
          { 
            name: 'High Knees', 
            sets: 4, 
            reps: 30, 
            rest: 30,
            description: 'Hoge knieën op plaats'
          }
        ]
      }
    ]
  }

  // ===== UTILITY METHODS =====

  // Calculate 1RM from weight and reps
  calculate1RM(weight, reps) {
    if (!weight || !reps || reps === 1) return weight
    return Math.round(weight * (1 + (reps / 30)))
  }

  // Format duration for display
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  // Get week dates for progress tracking
  getWeekDates() {
    const dates = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    return dates
  }

  // Mobile optimized rest timer
  startRestTimer(seconds, onTick, onComplete) {
    if (!this.isMobile) return null
    
    let remaining = seconds
    const interval = setInterval(() => {
      remaining--
      if (onTick) onTick(remaining)
      
      if (remaining <= 0) {
        clearInterval(interval)
        if (onComplete) onComplete()
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200])
        }
      }
    }, 1000)
    
    return interval
  }

  // Validate workout data before saving
  validateWorkoutData(workoutData) {
    const errors = []
    
    if (!workoutData.exercises || !Array.isArray(workoutData.exercises)) {
      errors.push('Geen oefeningen gevonden')
    }
    
    if (workoutData.exercises && workoutData.exercises.length === 0) {
      errors.push('Minimaal 1 oefening vereist')
    }
    
    workoutData.exercises?.forEach((exercise, index) => {
      if (!exercise.name) {
        errors.push(`Oefening ${index + 1}: naam ontbreekt`)
      }
      
      if (!exercise.sets || !Array.isArray(exercise.sets) || exercise.sets.length === 0) {
        errors.push(`Oefening ${index + 1}: geen sets gelogd`)
      }
    })
    
    if (!workoutData.duration || workoutData.duration <= 0) {
      errors.push('Workout duur ontbreekt')
    }
    
    return errors
  }

  // Debug method for troubleshooting
  async debugWorkoutTables() {
    try {
      console.log('🔍 Debugging workout tables...')
      
      // Test workout_sessions table
      const { data: sessions, error: sessionsError } = await this.db.supabase
        .from('workout_sessions')
        .select('count')
        .limit(1)
      
      console.log('workout_sessions table:', sessionsError ? 'ERROR' : 'OK')
      
      // Test workout_progress table
      const { data: progress, error: progressError } = await this.db.supabase
        .from('workout_progress')
        .select('count')
        .limit(1)
      
      console.log('workout_progress table:', progressError ? 'ERROR' : 'OK')
      
      return {
        sessions: !sessionsError,
        progress: !progressError
      }
    } catch (error) {
      console.error('❌ Debug failed:', error)
      return { sessions: false, progress: false }
    }
  }
}

export default WorkoutService
