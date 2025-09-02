// src/modules/progress/core/ProgressService.js
// FIXED: Weight saving issues
import DatabaseService from '../../../services/DatabaseService'

class ProgressService {
  constructor() {
    this.db = DatabaseService
    this.cache = new Map()
    this.subscribers = new Map()
  }

  // ===== WEIGHT MODULE - FIXED =====
  async saveWeight(clientId, data) {
    try {
      // Ensure date is properly formatted
      const saveDate = data.date || new Date().toISOString().split('T')[0]
      
      // First check if we already have an entry for today
      const { data: existing } = await this.db.supabase
        .from('weight_logs')
        .select('id')
        .eq('client_id', clientId)
        .eq('date', saveDate)
        .single()

      let result
      
      if (existing) {
        // Update existing entry
        const { data: updateResult, error: updateError } = await this.db.supabase
          .from('weight_logs')
          .update({
            weight: parseFloat(data.weight),
            time_of_day: data.timeOfDay || this.getTimeOfDay(),
            notes: data.notes || '',
            feeling: data.feeling || 'normal',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) throw updateError
        result = updateResult
      } else {
        // Insert new entry
        const { data: insertResult, error: insertError } = await this.db.supabase
          .from('weight_logs')
          .insert({
            client_id: clientId,
            weight: parseFloat(data.weight),
            date: saveDate,
            time_of_day: data.timeOfDay || this.getTimeOfDay(),
            notes: data.notes || '',
            feeling: data.feeling || 'normal'
          })
          .select()
          .single()

        if (insertError) throw insertError
        result = insertResult
      }

      // Update current weight in clients table
      await this.db.supabase
        .from('clients')
        .update({ 
          current_weight: parseFloat(data.weight),
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      // Clear cache to force fresh data
      this.cache.delete(`weight_${clientId}`)
      
      this.notifySubscribers('weight', result)
      return result
    } catch (error) {
      console.error('Error saving weight:', error)
      throw error
    }
  }

  async getWeightHistory(clientId, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.db.supabase
        .from('weight_logs')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }) // Secondary sort for same-day entries

      if (error) throw error
      
      // Filter out duplicates for same date (keep most recent)
      const uniqueByDate = data?.reduce((acc, curr) => {
        if (!acc.some(item => item.date === curr.date)) {
          acc.push(curr)
        }
        return acc
      }, []) || []
      
      return uniqueByDate
    } catch (error) {
      console.error('Error getting weight history:', error)
      return []
    }
  }

  async getWeightStats(clientId) {
    try {
      const history = await this.getWeightHistory(clientId, 90)
      if (!history || !history.length) return null

      const current = history[0]?.weight
      
      // Find weight from a week ago
      const weekAgo = history.find(w => {
        const date = new Date(w.date)
        const weekAgoDate = new Date()
        weekAgoDate.setDate(weekAgoDate.getDate() - 7)
        return date <= weekAgoDate
      })

      // Find weight from a month ago
      const monthAgo = history.find(w => {
        const date = new Date(w.date)
        const monthAgoDate = new Date()
        monthAgoDate.setDate(monthAgoDate.getDate() - 30)
        return date <= monthAgoDate
      })

      return {
        current: parseFloat(current),
        weekChange: weekAgo ? parseFloat((current - weekAgo.weight).toFixed(1)) : null,
        monthChange: monthAgo ? parseFloat((current - monthAgo.weight).toFixed(1)) : null,
        trend: this.calculateTrend(history),
        prediction: this.predictProgress(history)
      }
    } catch (error) {
      console.error('Error getting weight stats:', error)
      return null
    }
  }

  // ===== HELPER METHODS - FIXED =====
  getTimeOfDay() {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }

  calculateTrend(history) {
    if (!history || history.length < 2) return 'stable'
    
    const recent = history.slice(0, Math.min(7, history.length))
    const older = history.slice(7, Math.min(14, history.length))
    
    if (!older.length) return 'stable'
    
    const recentAvg = recent.reduce((sum, h) => sum + parseFloat(h.weight), 0) / recent.length
    const olderAvg = older.reduce((sum, h) => sum + parseFloat(h.weight), 0) / older.length
    
    const diff = recentAvg - olderAvg
    
    if (Math.abs(diff) < 0.2) return 'stable'
    return diff > 0 ? 'up' : 'down'
  }

  predictProgress(history, targetDays = 30) {
    if (!history || history.length < 7) return null

    // Calculate weekly average change
    const weeklyChanges = []
    for (let i = 0; i < Math.min(4, Math.floor(history.length / 7)); i++) {
      const weekStart = history[i * 7]
      const weekEnd = history[Math.min((i + 1) * 7 - 1, history.length - 1)]
      if (weekStart && weekEnd) {
        weeklyChanges.push(parseFloat(weekEnd.weight) - parseFloat(weekStart.weight))
      }
    }

    if (!weeklyChanges.length) return null

    const avgWeeklyChange = weeklyChanges.reduce((a, b) => a + b, 0) / weeklyChanges.length
    const predictedChange = (avgWeeklyChange / 7) * targetDays

    return {
      change: parseFloat(predictedChange.toFixed(1)),
      confidence: Math.min(95, 50 + (history.length * 1.5)),
      timeframe: targetDays
    }
  }

  // ===== WORKOUT MODULE =====
  async logWorkout(clientId, workoutData) {
    try {
      const { data, error } = await this.db.supabase
        .from('workout_logs')
        .insert({
          client_id: clientId,
          workout_id: workoutData.workoutId,
          scheduled_date: workoutData.scheduledDate,
          completed_date: new Date().toISOString(),
          exercises: workoutData.exercises,
          total_volume: this.calculateVolume(workoutData.exercises),
          duration: workoutData.duration,
          feeling: workoutData.feeling,
          notes: workoutData.notes
        })
        .select()
        .single()

      if (error) throw error

      await this.updateWorkoutStreak(clientId)
      this.notifySubscribers('workout', data)
      return data
    } catch (error) {
      console.error('Error logging workout:', error)
      throw error
    }
  }

  async getScheduledWorkout(clientId, date = new Date()) {
    const dateStr = date.toISOString().split('T')[0]
    
    const { data: assignment } = await this.db.supabase
      .from('client_workouts')
      .select(`
        *,
        workout_schemas (
          *,
          exercises: workout_exercises (*)
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single()

    if (!assignment) return null

    const { data: completed } = await this.db.supabase
      .from('workout_logs')
      .select('*')
      .eq('client_id', clientId)
      .eq('scheduled_date', dateStr)
      .single()

    return {
      scheduled: assignment.workout_schemas,
      completed: completed || null,
      lastWorkout: await this.getLastWorkout(clientId, assignment.workout_schemas.id)
    }
  }

  async getLastWorkout(clientId, workoutId) {
    const { data } = await this.db.supabase
      .from('workout_logs')
      .select('*')
      .eq('client_id', clientId)
      .eq('workout_id', workoutId)
      .order('completed_date', { ascending: false })
      .limit(1)
      .single()

    return data
  }

  async getWorkoutStats(clientId, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: logs } = await this.db.supabase
      .from('workout_logs')
      .select('*')
      .eq('client_id', clientId)
      .gte('completed_date', startDate.toISOString())
      .order('completed_date', { ascending: false })

    const streak = await this.calculateStreak(clientId)
    const prs = await this.getPersonalRecords(clientId)

    return {
      totalWorkouts: logs?.length || 0,
      streak,
      prs,
      weeklyVolume: this.calculateWeeklyVolume(logs),
      consistency: this.calculateConsistency(logs, days)
    }
  }

  // ===== NUTRITION MODULE =====
  async syncWithMealPlan(clientId) {
    const { data: mealLogs } = await this.db.supabase
      .from('meal_plan_progress')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(30)

    if (!mealLogs) return null

    const insights = this.calculateNutritionInsights(mealLogs)
    
    return {
      logs: mealLogs,
      insights,
      funFacts: this.generateFunFacts(mealLogs),
      recommendations: this.generateRecommendations(insights)
    }
  }

  calculateNutritionInsights(logs) {
    const totalDays = logs.length
    if (totalDays === 0) return null

    const totals = logs.reduce((acc, log) => {
      const data = log.daily_totals || {}
      return {
        calories: (acc.calories || 0) + (data.calories || 0),
        protein: (acc.protein || 0) + (data.protein || 0),
        carbs: (acc.carbs || 0) + (data.carbs || 0),
        fat: (acc.fat || 0) + (data.fat || 0)
      }
    }, {})

    return {
      averages: {
        calories: Math.round(totals.calories / totalDays),
        protein: Math.round(totals.protein / totalDays),
        carbs: Math.round(totals.carbs / totalDays),
        fat: Math.round(totals.fat / totalDays)
      },
      compliance: this.calculateCompliance(logs),
      trends: this.calculateNutritionTrends(logs)
    }
  }

  generateFunFacts(logs) {
    if (!logs.length) return []

    const facts = []
    const mealCounts = {}
    
    logs.forEach(log => {
      if (log.meals_completed) {
        Object.values(log.meals_completed).forEach(meal => {
          if (meal.name) {
            mealCounts[meal.name] = (mealCounts[meal.name] || 0) + 1
          }
        })
      }
    })
    
    const mostEaten = Object.entries(mealCounts)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (mostEaten) {
      facts.push({
        icon: '🍽️',
        title: 'Meest gegeten',
        value: `${mostEaten[0]} (${mostEaten[1]}x)`
      })
    }

    const highestDay = logs.reduce((max, log) => {
      const calories = log.daily_totals?.calories || 0
      return calories > (max.calories || 0) ? { ...log, calories } : max
    }, {})

    if (highestDay.calories) {
      facts.push({
        icon: '🔥',
        title: 'Hoogste calorie dag',
        value: `${highestDay.calories} kcal`,
        date: new Date(highestDay.date).toLocaleDateString('nl-NL')
      })
    }

    const perfectDays = logs.filter(log => log.compliance_score >= 95).length
    if (perfectDays > 0) {
      facts.push({
        icon: '⭐',
        title: 'Perfect macro dagen',
        value: `${perfectDays} dagen`
      })
    }

    return facts
  }

  generateRecommendations(insights) {
    if (!insights) return []
    
    const recs = []
    const { averages } = insights

    if (averages.calories < 1500) {
      recs.push({
        type: 'warning',
        message: `Je eet gemiddeld ${1500 - averages.calories} kcal onder aanbeveling. Dit kan je metabolisme vertragen.`
      })
    }

    if (averages.protein < 100) {
      recs.push({
        type: 'tip',
        message: 'Verhoog je eiwitinname voor betere spieropbouw en herstel.'
      })
    }

    if (insights.compliance >= 80) {
      recs.push({
        type: 'success',
        message: `Geweldig! ${insights.compliance}% compliance betekent dat je op schema ligt voor je doelen.`
      })
    }

    return recs
  }

  // ===== REST OF THE SERVICE REMAINS THE SAME =====
  // (All other methods stay unchanged from original)
  
  calculateVolume(exercises) {
    return exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => {
        return sum + (set.reps * set.weight)
      }, 0)
      return total + exerciseVolume
    }, 0)
  }

  async calculateStreak(clientId) {
    const { data: logs } = await this.db.supabase
      .from('workout_logs')
      .select('completed_date')
      .eq('client_id', clientId)
      .order('completed_date', { ascending: false })
      .limit(30)

    if (!logs || !logs.length) return 0

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const log of logs) {
      const logDate = new Date(log.completed_date)
      logDate.setHours(0, 0, 0, 0)

      const diffDays = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24))

      if (diffDays === streak) {
        streak++
      } else if (diffDays > streak) {
        break
      }
    }

    return streak
  }

  async updateWorkoutStreak(clientId) {
    const streak = await this.calculateStreak(clientId)
    
    await this.db.supabase
      .from('clients')
      .update({ workout_streak: streak })
      .eq('id', clientId)

    return streak
  }

  calculateConsistency(logs, days) {
    if (!logs || !logs.length) return 0
    const expectedWorkouts = Math.floor(days / 7) * 3
    return Math.min(100, Math.round((logs.length / expectedWorkouts) * 100))
  }

  calculateWeeklyVolume(logs) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const weekLogs = logs?.filter(log => 
      new Date(log.completed_date) >= weekAgo
    ) || []

    return weekLogs.reduce((total, log) => 
      total + (log.total_volume || 0), 0
    )
  }

  async getPersonalRecords(clientId) {
    return []
  }

  calculateCompliance(logs) {
    const compliantDays = logs.filter(log => 
      log.compliance_score >= 80
    ).length

    return Math.round((compliantDays / logs.length) * 100)
  }

  calculateNutritionTrends(logs) {
    const recent = logs.slice(0, 7)
    const older = logs.slice(7, 14)

    if (!older.length) return 'stable'

    const recentAvg = recent.reduce((sum, log) => 
      sum + (log.daily_totals?.calories || 0), 0
    ) / recent.length

    const olderAvg = older.reduce((sum, log) => 
      sum + (log.daily_totals?.calories || 0), 0
    ) / older.length

    const diff = ((recentAvg - olderAvg) / olderAvg) * 100

    if (Math.abs(diff) < 5) return 'stable'
    return diff > 0 ? 'increasing' : 'decreasing'
  }

  async getCurrentWeight(clientId) {
    const { data } = await this.db.supabase
      .from('clients')
      .select('current_weight')
      .eq('id', clientId)
      .single()

    return data?.current_weight
  }

  async getCurrentMeasurements(clientId) {
    const { data } = await this.db.supabase
      .from('body_measurements')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    return data
  }

  async applyChallengeStrategy(clientId, strategy) {
    if (strategy.workouts) {
      for (const workout of strategy.workouts) {
        await this.db.assignWorkoutToClient(clientId, workout)
      }
    }

    if (strategy.meals) {
      await this.db.updateMealTargets(clientId, strategy.meals)
    }

    if (strategy.notifications) {
      for (const notification of strategy.notifications) {
        await this.db.scheduleNotification(clientId, notification)
      }
    }
  }

  async completeChallenge(clientId, challengeId) {
    const { data, error } = await this.db.supabase
      .from('client_challenges')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('challenge_id', challengeId)
      .select()
      .single()

    if (error) throw error

    await this.awardAchievement(clientId, `challenge_${challengeId}_complete`)

    return data
  }

  async awardAchievement(clientId, achievementType) {
    const { data, error } = await this.db.supabase
      .from('achievements')
      .insert({
        client_id: clientId,
        type: achievementType,
        earned_at: new Date().toISOString()
      })

    if (!error) {
      this.notifySubscribers('achievements', data)
    }

    return data
  }

  // ===== PHOTOS MODULE =====
// Update deze methods in ProgressService.js






// Fix deze methods in ProgressService.js

async uploadProgressPhoto(clientId, file, type, metadata = {}) {
  try {
    // Gebruik mock data voor nu - Supabase storage niet beschikbaar
    console.log('Uploading photo:', { clientId, type, metadata })
    
    // Simuleer upload success
    const mockPhoto = {
      id: `photo_${Date.now()}`,
      client_id: clientId,
      photo_url: URL.createObjectURL(file), // Tijdelijke local URL
      photo_type: type,
      date_taken: new Date().toISOString(),
      metadata: {
        ...metadata,
        milestone_week: metadata.milestone_week || null,
        file_name: file.name
      }
    }
    
    // Store in localStorage als tijdelijke oplossing
    const existingPhotos = JSON.parse(localStorage.getItem('progress_photos') || '[]')
    existingPhotos.push(mockPhoto)
    localStorage.setItem('progress_photos', JSON.stringify(existingPhotos))
    
    return mockPhoto
  } catch (error) {
    console.error('Error uploading progress photo:', error)
    throw error
  }
}

async getProgressPhotos(clientId, type = null) {
  try {
    // Gebruik localStorage voor demo
    const allPhotos = JSON.parse(localStorage.getItem('progress_photos') || '[]')
    let photos = allPhotos.filter(p => p.client_id === clientId)
    
    if (type) {
      photos = photos.filter(p => p.photo_type === type)
    }
    
    // Als geen photos, return demo data
    if (photos.length === 0) {
      return [
        {
          id: 'demo_1',
          client_id: clientId,
          photo_url: 'https://via.placeholder.com/400x300/ec4899/ffffff?text=Week+1',
          photo_type: 'progress',
          date_taken: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { milestone_week: 1, weight: 78.5 }
        },
        {
          id: 'demo_2',
          client_id: clientId,
          photo_url: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Meal',
          photo_type: 'meal',
          date_taken: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {}
        }
      ]
    }
    
    return photos.sort((a, b) => new Date(b.date_taken) - new Date(a.date_taken))
  } catch (error) {
    console.error('Error fetching progress photos:', error)
    return []
  }
}

async getPhotoStats(clientId) {
  try {
    const photos = await this.getProgressPhotos(clientId)
    
    const stats = {
      total: photos.length,
      progress: photos.filter(p => p.photo_type === 'progress').length,
      meals: photos.filter(p => p.photo_type === 'meal').length,
      actions: photos.filter(p => p.photo_type === 'action').length,
      milestones: photos.filter(p => p.metadata?.milestone_week !== null).length
    }
    
    return stats
  } catch (error) {
    console.error('Error fetching photo stats:', error)
    return { total: 0, progress: 0, meals: 0, actions: 0, milestones: 0 }
  }
}



















  // ===== CHALLENGES MODULE =====
  async getAvailableChallenges(category = null) {
    let query = this.db.supabase
      .from('challenges')
      .select('*')
      .eq('active', true)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('difficulty')

    if (error) throw error
    return data || []
  }

  async acceptChallenge(clientId, challengeId) {
    try {
      const { data: challenge } = await this.db.supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single()

      if (!challenge) throw new Error('Challenge not found')

      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + challenge.duration_days)

      const { data: clientChallenge, error } = await this.db.supabase
        .from('client_challenges')
        .insert({
          client_id: clientId,
          challenge_id: challengeId,
          started_at: new Date().toISOString(),
          target_date: targetDate.toISOString(),
          progress: { current: 0, target: challenge.target_value }
        })
        .select()
        .single()

      if (error) throw error

      if (challenge.strategy) {
        await this.applyChallengeStrategy(clientId, challenge.strategy)
      }

      this.notifySubscribers('challenges', clientChallenge)
      return clientChallenge
    } catch (error) {
      console.error('Error accepting challenge:', error)
      throw error
    }
  }

  async updateChallengeProgress(clientId, challengeId, progress) {
    const { data, error } = await this.db.supabase
      .from('client_challenges')
      .update({
        progress,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('challenge_id', challengeId)
      .select()
      .single()

    if (error) throw error

    if (progress.current >= progress.target) {
      await this.completeChallenge(clientId, challengeId)
    }

    return data
  }

  async getActiveChallenges(clientId) {
    const { data, error } = await this.db.supabase
      .from('client_challenges')
      .select(`
        *,
        challenge:challenges (*)
      `)
      .eq('client_id', clientId)
      .eq('completed', false)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // ===== SUBSCRIPTION SYSTEM =====
  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set())
    }
    this.subscribers.get(type).add(callback)

    return () => {
      this.subscribers.get(type)?.delete(callback)
    }
  }

  notifySubscribers(type, data) {
    this.subscribers.get(type)?.forEach(callback => {
      callback(data)
    })
  }

  // ===== EXPORT FUNCTIONALITY =====
  async exportProgressData(clientId, format = 'json') {
    const [weight, workouts, nutrition, photos, challenges] = await Promise.all([
      this.getWeightHistory(clientId, 365),
      this.getWorkoutStats(clientId, 365),
      this.syncWithMealPlan(clientId),
      this.getProgressPhotos(clientId),
      this.getActiveChallenges(clientId)
    ])

    const data = {
      exportDate: new Date().toISOString(),
      client: clientId,
      progress: {
        weight,
        workouts,
        nutrition,
        photos: photos.map(p => ({ ...p, signedUrl: undefined })),
        challenges
      }
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    }

    return data
  }
}

export default new ProgressService()
