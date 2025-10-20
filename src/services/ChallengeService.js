// src/services/ChallengeService.js
class ChallengeService {
  constructor(databaseService) {
    this.db = databaseService
  }

  // === MAIN CHECK FOR ACTIVE CHALLENGE ===
  async checkActiveChallenge(clientId) {
    try {
      const { data, error } = await this.db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        console.log('No active challenge found')
        return null
      }

      return data
    } catch (error) {
      console.error('Challenge check failed:', error)
      return null
    }
  }

  // === GET ALL REQUIREMENTS PROGRESS ===
  async getAllRequirementsProgress(clientId, challengeStartDate = null) {
    try {
      // Calculate date range (default: last 56 days)
      const endDate = new Date()
      const startDate = challengeStartDate 
        ? new Date(challengeStartDate)
        : new Date(endDate.getTime() - (56 * 24 * 60 * 60 * 1000))

      // Fetch all requirements in parallel
      const [workouts, meals, weighIns, photos, calls] = await Promise.all([
        this.getWorkoutProgress(clientId, startDate, endDate),
        this.getMealProgress(clientId, startDate, endDate),
        this.getWeightProgress(clientId, startDate, endDate),
        this.getPhotoProgress(clientId, startDate, endDate),
        this.getCallProgress(clientId, startDate, endDate)
      ])

      // Calculate overall eligibility
      const allRequirementsMet = 
        workouts.met && 
        meals.met && 
        weighIns.met && 
        photos.met && 
        calls.met

      // Calculate days remaining
      const daysElapsed = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.max(0, 56 - daysElapsed)

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        currentDay: Math.min(daysElapsed, 56),
        daysRemaining,
        overallProgress: {
          completed: [workouts.met, meals.met, weighIns.met, photos.met, calls.met].filter(Boolean).length,
          total: 5,
          percentage: Math.round(([workouts.met, meals.met, weighIns.met, photos.met, calls.met].filter(Boolean).length / 5) * 100)
        },
        moneyBackEligible: allRequirementsMet,
        requirements: {
          workouts,
          meals,
          weighIns,
          photos,
          calls
        }
      }
    } catch (error) {
      console.error('Get all requirements failed:', error)
      return this.getEmptyProgress()
    }
  }

  // === WORKOUT TRACKING (24 required) ===
  async getWorkoutProgress(clientId, startDate, endDate) {
    try {
      const { data, error } = await this.db.supabase
        .from('workout_completions')
        .select('workout_date, completed')
        .eq('client_id', clientId)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .lte('workout_date', endDate.toISOString().split('T')[0])
        .eq('completed', true)

      if (error) throw error

      const completedCount = data?.length || 0
      const required = 24

      return {
        current: completedCount,
        required,
        met: completedCount >= required,
        percentage: Math.min(100, Math.round((completedCount / required) * 100)),
        remaining: Math.max(0, required - completedCount),
        dates: data?.map(w => w.workout_date) || []
      }
    } catch (error) {
      console.error('Workout tracking error:', error)
      return { current: 0, required: 24, met: false, percentage: 0, remaining: 24, dates: [] }
    }
  }

  // === MEAL TRACKING (45 days required) ===
  async getMealProgress(clientId, startDate, endDate) {
    try {
      const { data, error } = await this.db.supabase
        .from('ai_meal_progress')
        .select('date, meals_consumed, manual_intake, completion_percentage')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if (error) throw error

      // Filter days that count as tracked
      const trackedDays = data?.filter(day => 
        day.meals_consumed > 0 || 
        day.manual_intake !== null || 
        day.completion_percentage > 0
      ) || []

      // Get unique days
      const uniqueDays = [...new Set(trackedDays.map(m => m.date))]
      const daysCount = uniqueDays.length
      const required = 45

      return {
        current: daysCount,
        required,
        met: daysCount >= required,
        percentage: Math.min(100, Math.round((daysCount / required) * 100)),
        remaining: Math.max(0, required - daysCount),
        dates: uniqueDays
      }
    } catch (error) {
      console.error('Meal tracking error:', error)
      return { current: 0, required: 45, met: false, percentage: 0, remaining: 45, dates: [] }
    }
  }

  // === WEIGHT TRACKING (8 Friday weigh-ins) ===
  async getWeightProgress(clientId, startDate, endDate) {
    try {
      // Try multiple tables in order of preference
      const tables = ['weight_logs', 'weight_tracking', 'weight_challenge_logs', 'weight_history']
      let allWeightData = []

      for (const table of tables) {
        try {
          const { data } = await this.db.supabase
            .from(table)
            .select('date, weight')
            .eq('client_id', clientId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0])

          if (data && data.length > 0) {
            allWeightData = [...allWeightData, ...data]
          }
        } catch (err) {
          // Table might not exist, continue
          console.log(`Table ${table} not accessible`)
        }
      }

      // Filter for Fridays only
      const fridayWeighIns = allWeightData.filter(w => {
        const date = new Date(w.date)
        return date.getDay() === 5 // Friday
      })

      // Get unique Friday dates
      const uniqueFridays = [...new Set(fridayWeighIns.map(w => w.date))]
      const fridayCount = uniqueFridays.length
      const required = 8

      return {
        current: fridayCount,
        required,
        met: fridayCount >= required,
        percentage: Math.min(100, Math.round((fridayCount / required) * 100)),
        remaining: Math.max(0, required - fridayCount),
        dates: uniqueFridays
      }
    } catch (error) {
      console.error('Weight tracking error:', error)
      return { current: 0, required: 8, met: false, percentage: 0, remaining: 8, dates: [] }
    }
  }

  // === PHOTO TRACKING (8 Friday sets) ===
  async getPhotoProgress(clientId, startDate, endDate) {
    try {
      // First try ch8_progress_photos
      let photoData = []
      
      try {
        const { data } = await this.db.supabase
          .from('ch8_progress_photos')
          .select('photo_date, photo_type, is_friday_photo')
          .eq('client_id', clientId)
          .gte('photo_date', startDate.toISOString().split('T')[0])
          .lte('photo_date', endDate.toISOString().split('T')[0])
          .eq('is_friday_photo', true)

        if (data) photoData = data
      } catch (err) {
        // Try regular progress_photos table
        const { data } = await this.db.supabase
          .from('progress_photos')
          .select('date, photo_type')
          .eq('client_id', clientId)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])

        if (data) {
          // Filter for Fridays
          photoData = data.filter(p => {
            const date = new Date(p.date)
            return date.getDay() === 5
          })
        }
      }

      // Count unique Friday dates with photos
      const uniqueFridays = [...new Set(photoData.map(p => p.photo_date || p.date))]
      const fridayCount = uniqueFridays.length
      const required = 8

      return {
        current: fridayCount,
        required,
        met: fridayCount >= required,
        percentage: Math.min(100, Math.round((fridayCount / required) * 100)),
        remaining: Math.max(0, required - fridayCount),
        dates: uniqueFridays
      }
    } catch (error) {
      console.error('Photo tracking error:', error)
      return { current: 0, required: 8, met: false, percentage: 0, remaining: 8, dates: [] }
    }
  }

  // === CALL TRACKING (8 calls) ===
  async getCallProgress(clientId, startDate, endDate) {
    try {
      const { data, error } = await this.db.supabase
        .from('client_calls')
        .select('call_number, call_title, status, completed_date, scheduled_date')
        .eq('client_id', clientId)
        .gte('scheduled_date', startDate.toISOString())
        .lte('scheduled_date', endDate.toISOString())
        .eq('status', 'completed')

      if (error) throw error

      const completedCount = data?.length || 0
      const required = 8

      return {
        current: completedCount,
        required,
        met: completedCount >= required,
        percentage: Math.min(100, Math.round((completedCount / required) * 100)),
        remaining: Math.max(0, required - completedCount),
        calls: data?.map(c => ({
          number: c.call_number,
          title: c.call_title,
          date: c.completed_date || c.scheduled_date
        })) || []
      }
    } catch (error) {
      console.error('Call tracking error:', error)
      return { current: 0, required: 8, met: false, percentage: 0, remaining: 8, calls: [] }
    }
  }

  // === HELPER: Empty progress object ===
  getEmptyProgress() {
    return {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      currentDay: 0,
      daysRemaining: 56,
      overallProgress: {
        completed: 0,
        total: 5,
        percentage: 0
      },
      moneyBackEligible: false,
      requirements: {
        workouts: { current: 0, required: 24, met: false, percentage: 0, remaining: 24 },
        meals: { current: 0, required: 45, met: false, percentage: 0, remaining: 45 },
        weighIns: { current: 0, required: 8, met: false, percentage: 0, remaining: 8 },
        photos: { current: 0, required: 8, met: false, percentage: 0, remaining: 8 },
        calls: { current: 0, required: 8, met: false, percentage: 0, remaining: 8 }
      }
    }
  }

  // === QUICK LOG METHODS ===
  async quickLogWorkout(clientId) {
    const today = new Date().toISOString().split('T')[0]
    return await this.db.saveWorkoutCompletion(clientId, today, true)
  }

  async quickLogMeal(clientId, mealType) {
    const today = new Date().toISOString().split('T')[0]
    return await this.db.saveMealProgress(clientId, {
      date: today,
      meal_type: mealType,
      consumed: true,
      completion_percentage: 100
    })
  }

  async quickLogWeight(clientId, weight) {
    const today = new Date().toISOString().split('T')[0]
    // Try to save to multiple tables for compatibility
    const promises = [
      this.db.supabase.from('weight_logs').insert({ client_id: clientId, date: today, weight }),
      this.db.supabase.from('weight_challenge_logs').insert({ 
        client_id: clientId, 
        date: today, 
        weight,
        is_friday_weighin: new Date().getDay() === 5
      })
    ]
    
    try {
      await Promise.allSettled(promises)
      return true
    } catch (error) {
      console.error('Weight log failed:', error)
      return false
    }
  }
}

export default ChallengeService
