// src/modules/coach-command-center/modules/ActivityTimelineService.js
// ActivityTimelineService - Workout activity data fetching for Command Center
// Extends DatabaseService pattern for workout_sessions queries
// NO DIRECT SUPABASE IMPORT - Uses DatabaseService methods

import DatabaseService from '../../../services/DatabaseService'

const ActivityTimelineService = {
  /**
   * Get 7-day workout activity for a SINGLE client
   * Used in: Expanded ClientCard view
   * 
   * @param {string} clientId - Client UUID
   * @returns {Array} 7 days of activity data
   */
  async get7DayWorkoutActivitySingle(clientId) {
    try {
      console.log('📊 [ActivityTimeline] Fetching 7-day activity for client:', clientId)

      // Calculate date range (today - 6 days ago = 7 days total)
      const today = new Date()
      const sixDaysAgo = new Date(today)
      sixDaysAgo.setDate(today.getDate() - 6)

      const startDate = sixDaysAgo.toISOString().split('T')[0]
      const endDate = today.toISOString().split('T')[0]

      console.log('📅 [ActivityTimeline] Date range:', startDate, 'to', endDate)

      // Use DatabaseService to query workout_sessions
      const sessions = await DatabaseService.getWorkoutSessionsForTimeline(
        clientId, 
        startDate, 
        endDate
      )

      console.log('✅ [ActivityTimeline] Fetched', sessions?.length || 0, 'workout sessions')

      // Generate 7-day structure with actual data
      return this.map7DaysWithData(sessions || [], startDate, endDate)

    } catch (error) {
      console.error('❌ [ActivityTimeline] Error fetching activity:', error)
      return this.generateEmptyWeek()
    }
  },

  /**
   * Get 7-day workout activity for MULTIPLE clients (batch query)
   * Used in: Command Center initial load (performance optimization)
   * 
   * @param {Array} clientIds - Array of client UUIDs
   * @returns {Object} Map of clientId → activity data
   */
  async get7DayWorkoutActivityBatch(clientIds) {
    try {
      console.log('📊 [ActivityTimeline] Fetching 7-day activity for', clientIds.length, 'clients')

      const today = new Date()
      const sixDaysAgo = new Date(today)
      sixDaysAgo.setDate(today.getDate() - 6)

      const startDate = sixDaysAgo.toISOString().split('T')[0]
      const endDate = today.toISOString().split('T')[0]

      // Use DatabaseService batch query for all clients
      const sessions = await DatabaseService.getWorkoutSessionsForTimelineBatch(
        clientIds,
        startDate,
        endDate
      )

      console.log('✅ [ActivityTimeline] Fetched', sessions?.length || 0, 'total workout sessions')

      // Group sessions by client_id
      const sessionsByClient = {}
      clientIds.forEach(clientId => {
        sessionsByClient[clientId] = []
      })

      sessions?.forEach(session => {
        if (sessionsByClient[session.client_id]) {
          sessionsByClient[session.client_id].push(session)
        }
      })

      // Map to 7-day structure per client
      const result = {}
      clientIds.forEach(clientId => {
        result[clientId] = this.map7DaysWithData(
          sessionsByClient[clientId] || [],
          startDate,
          endDate
        )
      })

      return result

    } catch (error) {
      console.error('❌ [ActivityTimeline] Error fetching batch activity:', error)
      
      // Return empty week for all clients on error
      const result = {}
      clientIds.forEach(clientId => {
        result[clientId] = this.generateEmptyWeek()
      })
      return result
    }
  },

  /**
   * Map workout sessions to 7-day structure
   * CRITICAL: hasWorkout = true if ANY workout_sessions record exists
   * 
   * @param {Array} sessions - Workout sessions from database
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} 7 days with workout data
   */
  map7DaysWithData(sessions, startDate, endDate) {
    const result = []
    const sessionMap = {}

    // Create map: date → session data
    sessions.forEach(session => {
      sessionMap[session.workout_date] = session
    })

    // Generate 7 days
    const start = new Date(startDate)
    const end = new Date(endDate)
    const current = new Date(start)

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const session = sessionMap[dateStr]

      result.push({
        date: dateStr,
        hasWorkout: !!session, // TRUE if ANY record exists (critical fix!)
        isCompleted: session?.is_completed || false,
        completionPercentage: session?.completion_percentage || 0,
        feeling: session?.feeling || null
      })

      current.setDate(current.getDate() + 1)
    }

    return result
  },

  /**
   * Generate empty 7-day structure (fallback)
   * Used when: No data, error, or initialization
   * 
   * @returns {Array} 7 days with no workouts
   */
  generateEmptyWeek() {
    const result = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      result.push({
        date: dateStr,
        hasWorkout: false,
        isCompleted: false,
        completionPercentage: 0,
        feeling: null
      })
    }

    return result
  },

  /**
   * Calculate workout streak from activity data
   * Counts consecutive days WITH workouts (from today backwards)
   * 
   * @param {Array} activityData - 7 days of activity
   * @returns {number} Streak count
   */
  calculateStreakFromActivity(activityData) {
    let streak = 0

    // Start from end (today) and go backwards
    for (let i = activityData.length - 1; i >= 0; i--) {
      if (activityData[i].hasWorkout) {
        streak++
      } else {
        break // Streak broken
      }
    }

    return streak
  },

  /**
   * Get Dutch day name abbreviation
   * 
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {string} Day name (Ma, Di, Wo, etc.)
   */
  getDayName(dateStr) {
    const date = new Date(dateStr + 'T12:00:00') // Prevent timezone issues
    const dayNames = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
    return dayNames[date.getDay()]
  },

  /**
   * Check if date is today
   * 
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {boolean} True if today
   */
  isToday(dateStr) {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  },

  /**
   * Calculate completion status for UI
   * Returns color/icon based on workout data
   * 
   * @param {Object} day - Day activity object
   * @returns {Object} { status: 'green'|'yellow'|'red', icon: string }
   */
  getCompletionStatus(day) {
    if (!day.hasWorkout) {
      return { status: 'red', icon: '❌' }
    }

    if (day.isCompleted && day.completionPercentage === 100) {
      return { status: 'green', icon: '✅' }
    }

    // Partial workout (started but not 100%)
    return { status: 'yellow', icon: '✅' }
  }
}

export default ActivityTimelineService
