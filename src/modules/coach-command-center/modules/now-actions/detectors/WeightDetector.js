// Weight Detector - Detecteert weight tracking issues
class WeightDetector {
  constructor(db) {
    this.db = db
  }

  async detect(client) {
    const actions = []
    
    try {
      // Skip als client geen weight goals heeft
      if (!client.target_weight && !client.current_weight) {
        return null
      }
      
      // 1. Check laatste weging
      const lastWeighIn = await this.detectLastWeighIn(client)
      if (lastWeighIn) actions.push(lastWeighIn)
      
      // 2. Check weight trend als er data is
      const trendAlert = await this.detectWeightTrend(client)
      if (trendAlert) actions.push(trendAlert)
      
      // 3. Check progress naar goal
      const goalProgress = await this.detectGoalProgress(client)
      if (goalProgress) actions.push(goalProgress)
      
      return actions.length > 0 ? actions : null
    } catch (error) {
      console.error('Weight detection failed for', client.first_name, ':', error)
      return null
    }
  }

  // Detect wanneer laatste weging was
  async detectLastWeighIn(client) {
    try {
      // Check weight_history table (de actieve table)
      const { data: lastEntry, error } = await this.db.supabase
        .from('weight_history')
        .select('date, weight')
        .eq('client_id', client.id)
        .order('date', { ascending: false })
        .limit(1)
        .single()
      
      if (error || !lastEntry) {
        // Nooit gewogen
        return {
          id: `weight_never_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'weight',
          priority: 'today',
          urgencyScore: 55,
          icon: '⚖️',
          message: 'Nog nooit gewogen',
          detail: 'Start weight tracking',
          buttonText: 'START TRACKING',
          data: {
            type: 'no_weight_data'
          }
        }
      }
      
      const daysSince = this.getDaysSince(lastEntry.date)
      
      // Alert als meer dan 7 dagen niet gewogen
      if (daysSince > 7) {
        return {
          id: `weight_inactive_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'weight',
          priority: daysSince > 14 ? 'urgent' : 'today',
          urgencyScore: daysSince > 14 ? 75 : 50,
          icon: '📊',
          message: `${daysSince} dagen niet gewogen`,
          detail: `Laatste: ${lastEntry.weight}kg op ${new Date(lastEntry.date).toLocaleDateString('nl-NL')}`,
          buttonText: 'WEEG NU',
          data: {
            days_since: daysSince,
            last_weight: lastEntry.weight
          }
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  // Detect weight trend problemen
  async detectWeightTrend(client) {
    try {
      // Haal laatste maand data op
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: recentEntries, error } = await this.db.supabase
        .from('weight_history')
        .select('date, weight')
        .eq('client_id', client.id)
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: true })
      
      if (error || !recentEntries || recentEntries.length < 3) {
        return null // Te weinig data voor trend
      }
      
      // Bereken trend
      const firstWeight = recentEntries[0].weight
      const lastWeight = recentEntries[recentEntries.length - 1].weight
      const weightChange = lastWeight - firstWeight
      const weeklyChange = (weightChange / 4).toFixed(2) // Per week over laatste maand
      
      // Check voor te snelle verandering (>1kg per week)
      if (Math.abs(weeklyChange) > 1) {
        return {
          id: `weight_rapid_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'weight_trend',
          priority: 'urgent',
          urgencyScore: 80,
          icon: '⚠️',
          message: `Te snelle ${weeklyChange > 0 ? 'toename' : 'afname'}`,
          detail: `${Math.abs(weeklyChange)}kg per week - pas op voor gezondheid`,
          buttonText: 'BEKIJK PLAN',
          data: {
            weekly_change: weeklyChange,
            total_change: weightChange
          }
        }
      }
      
      // Check voor plateau (minder dan 0.2kg verandering in maand)
      if (Math.abs(weightChange) < 0.2 && client.target_weight) {
        const toGo = Math.abs(client.current_weight - client.target_weight)
        if (toGo > 2) { // Alleen als nog ver van doel
          return {
            id: `weight_plateau_${client.id}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'weight_plateau',
            priority: 'today',
            urgencyScore: 45,
            icon: '📈',
            message: 'Weight plateau gedetecteerd',
            detail: `Geen verandering laatste maand - tijd voor aanpassing`,
            buttonText: 'AANPASSEN',
            data: {
              weight_change: weightChange,
              current_weight: lastWeight
            }
          }
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  // Detect progress naar weight goal
  async detectGoalProgress(client) {
    try {
      // Check of client weight goal heeft
      if (!client.target_weight || !client.start_weight) {
        return null
      }
      
      // Haal huidige weight op
      const { data: currentEntry } = await this.db.supabase
        .from('weight_history')
        .select('weight')
        .eq('client_id', client.id)
        .order('date', { ascending: false })
        .limit(1)
        .single()
      
      if (!currentEntry) return null
      
      const currentWeight = currentEntry.weight
      const totalToLose = Math.abs(client.start_weight - client.target_weight)
      const actualProgress = Math.abs(client.start_weight - currentWeight)
      const progressPercentage = (actualProgress / totalToLose) * 100
      
      // Check verkeerde richting
      const goingWrongWay = (client.target_weight < client.start_weight && currentWeight > client.start_weight) ||
                            (client.target_weight > client.start_weight && currentWeight < client.start_weight)
      
      if (goingWrongWay) {
        return {
          id: `weight_wrong_direction_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'weight_direction',
          priority: 'urgent',
          urgencyScore: 85,
          icon: '🔄',
          message: 'Verkeerde richting!',
          detail: `Weight gaat omhoog i.p.v. omlaag (nu: ${currentWeight}kg)`,
          buttonText: 'PLAN AANPASSEN',
          data: {
            current_weight: currentWeight,
            target_weight: client.target_weight,
            start_weight: client.start_weight
          }
        }
      }
      
      // Check bijna bij doel (binnen 2kg)
      const distanceToGoal = Math.abs(currentWeight - client.target_weight)
      if (distanceToGoal <= 2 && distanceToGoal > 0) {
        return {
          id: `weight_almost_goal_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'weight_near_goal',
          priority: 'today',
          urgencyScore: 40,
          icon: '🎯',
          message: 'Bijna bij je doel!',
          detail: `Nog ${distanceToGoal.toFixed(1)}kg te gaan naar ${client.target_weight}kg`,
          buttonText: 'LAATSTE PUSH',
          data: {
            current_weight: currentWeight,
            target_weight: client.target_weight,
            distance: distanceToGoal
          }
        }
      }
      
      // Check doel bereikt
      if (distanceToGoal < 0.5) {
        return {
          id: `weight_goal_reached_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'weight_goal_reached',
          priority: 'today',
          urgencyScore: 30,
          icon: '🏆',
          message: 'DOEL BEREIKT!',
          detail: `Target van ${client.target_weight}kg gehaald!`,
          buttonText: 'NIEUW DOEL',
          data: {
            current_weight: currentWeight,
            target_weight: client.target_weight
          }
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  // Helper: Bereken dagen sinds datum
  getDaysSince(date) {
    const now = new Date()
    const past = new Date(date)
    const diff = now - past
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }
}

export default WeightDetector
