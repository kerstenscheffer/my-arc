// Goal Detector - Detecteert goal-gerelateerde acties
class GoalDetector {
  constructor(db) {
    this.db = db
  }

  async detect(client) {
    const actions = []
    
    try {
      // 1. Check of client goals heeft
      const noGoalsAction = await this.detectNoGoals(client)
      if (noGoalsAction) {
        actions.push(noGoalsAction)
        return actions // Als geen goals, stop hier
      }
      
      // 2. Check voor goals met deadline issues
      const deadlineActions = await this.detectDeadlineIssues(client)
      if (deadlineActions && deadlineActions.length > 0) {
        actions.push(...deadlineActions)
      }
      
      // 3. Check voor goals zonder recente progress
      const inactiveGoals = await this.detectInactiveGoals(client)
      if (inactiveGoals && inactiveGoals.length > 0) {
        actions.push(...inactiveGoals)
      }
      
      // 4. Check voor goals achter op schema
      const behindSchedule = await this.detectGoalsBehindSchedule(client)
      if (behindSchedule && behindSchedule.length > 0) {
        actions.push(...behindSchedule)
      }
      
      return actions.length > 0 ? actions : null
    } catch (error) {
      console.error('Goal detection failed for', client.first_name, ':', error)
      return null
    }
  }

  // Detect als client geen goals heeft
  async detectNoGoals(client) {
    try {
      const { data: goals, error } = await this.db.supabase
        .from('client_goals')
        .select('id')
        .eq('client_id', client.id)
        .eq('status', 'active')
        .limit(1)
      
      if (error || !goals || goals.length === 0) {
        return {
          id: `goal_none_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'goals',
          priority: 'today',
          urgencyScore: 50,
          icon: '🎯',
          message: 'Geen actieve doelen',
          detail: 'Help client met doelen stellen',
          buttonText: 'STEL DOELEN',
          data: {
            type: 'no_goals'
          }
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  // Detect goals met deadline problemen
  async detectDeadlineIssues(client) {
    try {
      const { data: goals, error } = await this.db.supabase
        .from('client_goals')
        .select(`
          id,
          title,
          target_date,
          current_value,
          target_value,
          category
        `)
        .eq('client_id', client.id)
        .eq('status', 'active')
        .lte('target_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) // Binnen 7 dagen
      
      if (error || !goals || goals.length === 0) return null
      
      return goals.map(goal => {
        const daysUntil = this.getDaysUntil(goal.target_date)
        const progress = this.calculateProgress(goal.current_value, goal.target_value)
        
        if (daysUntil < 0) {
          // Deadline gemist
          return {
            id: `goal_overdue_${goal.id}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'goal_overdue',
            priority: 'urgent',
            urgencyScore: 90,
            icon: '⚠️',
            message: `Doel deadline gemist: "${goal.title}"`,
            detail: `${Math.abs(daysUntil)} dagen over tijd - ${progress}% voltooid`,
            buttonText: 'BEKIJK DOEL',
            data: {
              goal_id: goal.id,
              title: goal.title,
              days_overdue: Math.abs(daysUntil)
            }
          }
        } else if (daysUntil <= 3) {
          // Deadline zeer dichtbij
          return {
            id: `goal_deadline_${goal.id}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'goal_deadline',
            priority: 'urgent',
            urgencyScore: 80,
            icon: '⏰',
            message: `Deadline nadert: "${goal.title}"`,
            detail: `Nog ${daysUntil} ${daysUntil === 1 ? 'dag' : 'dagen'} - ${progress}% voltooid`,
            buttonText: 'CHECK PROGRESS',
            data: {
              goal_id: goal.id,
              title: goal.title,
              days_remaining: daysUntil
            }
          }
        } else {
          // Deadline binnen week
          return {
            id: `goal_week_${goal.id}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'goal_week',
            priority: 'today',
            urgencyScore: 40,
            icon: '📅',
            message: `"${goal.title}" deadline deze week`,
            detail: `Nog ${daysUntil} dagen - ${progress}% voltooid`,
            buttonText: 'BEKIJK',
            data: {
              goal_id: goal.id,
              title: goal.title,
              days_remaining: daysUntil
            }
          }
        }
      })
    } catch (error) {
      console.error('Deadline detection failed:', error)
      return null
    }
  }

  // Detect goals zonder recente progress updates
  async detectInactiveGoals(client) {
    try {
      // Haal alle actieve goals op
      const { data: goals } = await this.db.supabase
        .from('client_goals')
        .select(`
          id,
          title,
          category,
          measurement_type,
          frequency_target
        `)
        .eq('client_id', client.id)
        .eq('status', 'active')
      
      if (!goals || goals.length === 0) return null
      
      const inactiveActions = []
      
      for (const goal of goals) {
        // Check laatste progress entry
        const { data: lastProgress } = await this.db.supabase
          .from('goal_progress')
          .select('date')
          .eq('goal_id', goal.id)
          .order('date', { ascending: false })
          .limit(1)
          .single()
        
        const daysSinceProgress = lastProgress 
          ? this.getDaysSince(lastProgress.date)
          : 999
        
        // Voor checkbox goals (dagelijkse tracking)
        if (goal.measurement_type === 'checkbox' && daysSinceProgress > 3) {
          inactiveActions.push({
            id: `goal_inactive_${goal.id}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'goal_inactive',
            priority: daysSinceProgress > 7 ? 'urgent' : 'today',
            urgencyScore: daysSinceProgress > 7 ? 70 : 45,
            icon: '📊',
            message: `"${goal.title}" niet bijgehouden`,
            detail: daysSinceProgress === 999 
              ? 'Nog nooit progress gelogd'
              : `${daysSinceProgress} dagen geen update`,
            buttonText: 'CHECK IN',
            data: {
              goal_id: goal.id,
              title: goal.title,
              days_inactive: daysSinceProgress
            }
          })
        }
        
        // Voor number/weight goals (wekelijkse tracking)
        if ((goal.measurement_type === 'number' || goal.measurement_type === 'weight') 
            && daysSinceProgress > 7) {
          inactiveActions.push({
            id: `goal_inactive_${goal.id}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'goal_inactive',
            priority: 'today',
            urgencyScore: 50,
            icon: '📏',
            message: `"${goal.title}" meting nodig`,
            detail: `Laatste meting ${daysSinceProgress} dagen geleden`,
            buttonText: 'UPDATE',
            data: {
              goal_id: goal.id,
              title: goal.title,
              days_inactive: daysSinceProgress
            }
          })
        }
      }
      
      return inactiveActions.length > 0 ? inactiveActions : null
    } catch (error) {
      console.error('Inactive goals detection failed:', error)
      return null
    }
  }

  // Detect goals die achter lopen op schema
  async detectGoalsBehindSchedule(client) {
    try {
      const { data: goals } = await this.db.supabase
        .from('client_goals')
        .select(`
          id,
          title,
          current_value,
          target_value,
          start_value,
          target_date,
          created_at
        `)
        .eq('client_id', client.id)
        .eq('status', 'active')
        .not('target_value', 'is', null)
      
      if (!goals || goals.length === 0) return null
      
      const behindActions = []
      
      for (const goal of goals) {
        // Alleen voor goals met numerieke waarden
        if (goal.target_value && goal.current_value !== null) {
          const progress = this.calculateProgress(goal.current_value, goal.target_value)
          const expectedProgress = this.calculateExpectedProgress(goal.created_at, goal.target_date)
          
          // Als meer dan 20% achter op schema
          if (expectedProgress - progress > 20) {
            const deviation = Math.round(expectedProgress - progress)
            
            behindActions.push({
              id: `goal_behind_${goal.id}`,
              clientId: client.id,
              clientName: client.first_name,
              type: 'goal_behind',
              priority: deviation > 40 ? 'urgent' : 'today',
              urgencyScore: deviation > 40 ? 65 : 35,
              icon: '📉',
              message: `"${goal.title}" loopt achter`,
              detail: `${progress}% voltooid, verwacht ${expectedProgress}%`,
              buttonText: 'AANPASSEN',
              data: {
                goal_id: goal.id,
                title: goal.title,
                current_progress: progress,
                expected_progress: expectedProgress,
                deviation: deviation
              }
            })
          }
        }
      }
      
      return behindActions.length > 0 ? behindActions : null
    } catch (error) {
      console.error('Behind schedule detection failed:', error)
      return null
    }
  }

  // Helper: Bereken dagen tot datum
  getDaysUntil(targetDate) {
    const now = new Date()
    const target = new Date(targetDate)
    const diff = target - now
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  // Helper: Bereken dagen sinds datum
  getDaysSince(date) {
    const now = new Date()
    const past = new Date(date)
    const diff = now - past
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  // Helper: Bereken progress percentage
  calculateProgress(current, target) {
    if (!target || target === 0) return 0
    return Math.round((current / target) * 100)
  }

  // Helper: Bereken verwachte progress
  calculateExpectedProgress(startDate, targetDate) {
    const now = new Date()
    const start = new Date(startDate)
    const target = new Date(targetDate)
    
    const totalDays = (target - start) / (1000 * 60 * 60 * 24)
    const elapsedDays = (now - start) / (1000 * 60 * 60 * 24)
    
    if (totalDays <= 0) return 100
    return Math.round((elapsedDays / totalDays) * 100)
  }
}

export default GoalDetector
