// Central service for Coach Command Center
// Coordinates all module services

class CoachCommandService {
  constructor(db) {
    this.db = db
    
    // Module services will be initialized here
    // this.nowActionsService = new NowActionsService(db)
    // this.todayWinsService = new TodayWinsService(db)
    // this.clientPulseService = new ClientPulseService(db)
    // this.smartInsightsService = new SmartInsightsService(db)
  }

  // Central data loading - can be used by main component
  async loadDashboardData(coachId) {
    try {
      console.log('📊 Loading Coach Command Center data...')
      
      // Parallel load all module data
      const [clients, alerts, wins, insights] = await Promise.all([
        this.db.getClients(coachId),
        this.loadAlerts(coachId),
        this.loadTodayWins(coachId),
        this.loadInsights(coachId)
      ])

      return {
        clients,
        alerts,
        wins,
        insights,
        lastUpdate: new Date()
      }
    } catch (error) {
      console.error('❌ Dashboard data load failed:', error)
      throw error
    }
  }

  // Placeholder methods - will be replaced by module services
  async loadAlerts(coachId) {
    // Will be replaced by NowActionsService
    return []
  }

  async loadTodayWins(coachId) {
    // Will be replaced by TodayWinsService
    return []
  }

  async loadInsights(coachId) {
    // Will be replaced by SmartInsightsService
    return []
  }

  // Helper method to check client activity
  async getLastClientActivity(clientId) {
    try {
      // Check multiple tables for last activity
      const [workoutActivity, mealActivity, weightActivity] = await Promise.all([
        this.db.getLastWorkoutDate(clientId),
        this.db.getLastMealLogDate(clientId),
        this.db.getLastWeightEntry(clientId)
      ])

      // Return most recent activity
      const dates = [workoutActivity, mealActivity, weightActivity].filter(d => d)
      return dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d)))) : null
    } catch (error) {
      console.error('❌ Activity check failed:', error)
      return null
    }
  }

  // Calculate days since last activity
  getDaysSinceActivity(lastActivityDate) {
    if (!lastActivityDate) return 999
    const now = new Date()
    const diff = now - new Date(lastActivityDate)
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  // Determine alert level based on inactivity
  getAlertLevel(daysSince) {
    if (daysSince >= 4) return 'urgent'
    if (daysSince >= 2) return 'warning'
    return 'normal'
  }

  // Format time until event
  getTimeUntil(eventTime) {
    const now = new Date()
    const event = new Date(eventTime)
    const diff = event - now
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} dagen`
    if (hours > 0) return `${hours} uur`
    if (minutes > 0) return `${minutes} minuten`
    return 'Nu'
  }

  // Calculate goal deviation
  calculateGoalDeviation(current, target, weeklyGoal, weeksElapsed) {
    const expectedProgress = weeklyGoal * weeksElapsed
    const actualProgress = Math.abs(target - current)
    return expectedProgress - actualProgress
  }

  // Format client status for display
  formatClientStatus(client, lastActivity) {
    const daysSince = this.getDaysSinceActivity(lastActivity)
    const alertLevel = this.getAlertLevel(daysSince)
    
    return {
      id: client.id,
      name: client.first_name,
      alertLevel,
      daysSince,
      statusText: daysSince === 0 ? 'Vandaag actief' : 
                  daysSince === 1 ? 'Gisteren actief' :
                  `${daysSince} dagen geleden`,
      statusColor: alertLevel === 'urgent' ? '#ef4444' :
                   alertLevel === 'warning' ? '#f59e0b' :
                   '#10b981'
    }
  }

  // Subscribe to real-time updates
  subscribeToUpdates(callback) {
    // Setup Supabase subscriptions here
    console.log('📡 Setting up real-time subscriptions...')
    
    // Example subscription setup (uncomment when ready):
    /*
    const subscription = this.db.supabase
      .channel('coach-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workout_completion'
      }, (payload) => {
        callback({ type: 'workout', data: payload })
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meal_progress'
      }, (payload) => {
        callback({ type: 'meal', data: payload })
      })
      .subscribe()
    
    return subscription
    */
  }

  // Cleanup subscriptions
  unsubscribe(subscription) {
    if (subscription) {
      this.db.supabase.removeChannel(subscription)
    }
  }
}

export default CoachCommandService
