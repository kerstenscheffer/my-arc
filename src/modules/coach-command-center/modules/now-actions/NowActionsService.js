// src/modules/coach-command-center/modules/now-actions/NowActionsService.js
// Service for detecting and managing NOW actions with all 5 detectors

import CallDetector from './detectors/CallDetector'
import GoalDetector from './detectors/GoalDetector'
import WeightDetector from './detectors/WeightDetector'
import MealComplianceDetector from './detectors/MealComplianceDetector'
import WorkoutComplianceDetector from './detectors/WorkoutComplianceDetector'

class NowActionsService {
  constructor(db) {
    this.db = db
    
    // Import all detectors - 5 ACTIVE
    this.detectors = [
      new CallDetector(db),
      new GoalDetector(db),
      new WeightDetector(db),
      new MealComplianceDetector(db),      // NEW: Meal & Water tracking
      new WorkoutComplianceDetector(db)    // NEW: Workout compliance
    ]
  }

  // Main method to detect all actions
  async detectAllActions(clients, enabledDetectors = {}) {
    if (!clients || clients.length === 0) return []
    
    console.log('🔍 Detecting actions for', clients.length, 'clients...')
    console.log('Active detectors:', this.detectors.map(d => d.constructor.name))
    
    // Filter detectors based on settings
    const activeDetectors = this.detectors.filter(detector => {
      const detectorName = detector.constructor.name.toLowerCase().replace('detector', '')
      return enabledDetectors[detectorName] !== false
    })
    
    const allActions = []
    
    // Check for snoozed actions
    const snoozedIds = await this.getSnoozedActionIds()
    
    // Run all detectors for each client
    for (const client of clients) {
      for (const detector of activeDetectors) {
        try {
          const actions = await detector.detect(client)
          if (actions) {
            // Ensure actions is array
            const actionArray = Array.isArray(actions) ? actions : [actions]
            // Filter out snoozed actions
            const activeActions = actionArray.filter(a => !snoozedIds.includes(a.id))
            allActions.push(...activeActions)
          }
        } catch (error) {
          console.error(`Detector ${detector.constructor.name} failed for ${client.first_name}:`, error)
        }
      }
    }
    
    console.log(`✅ Found ${allActions.length} total actions`)
    
    // Sort by priority and time
    return this.sortActions(allActions)
  }

  // Get snoozed action IDs
  async getSnoozedActionIds() {
    try {
      const { data } = await this.db.supabase
        .from('coach_action_snoozes')
        .select('action_id')
        .or('snoozed_until.gt.now(),snoozed_until.is.null')
      
      return data ? data.map(d => d.action_id) : []
    } catch {
      return []
    }
  }

  // Get all snoozed actions
  async getSnoozedActions() {
    try {
      const { data } = await this.db.supabase
        .from('coach_action_snoozes')
        .select('*')
        .or('snoozed_until.gt.now(),snoozed_until.is.null')
      
      return data || []
    } catch {
      return []
    }
  }

  // Check for expired snoozes
  async checkExpiredSnoozes() {
    try {
      const { data } = await this.db.supabase
        .from('coach_action_snoozes')
        .select('*')
        .lt('snoozed_until', new Date().toISOString())
        .not('snoozed_until', 'is', null)
      
      if (data && data.length > 0) {
        // Remove expired snoozes
        await this.db.supabase
          .from('coach_action_snoozes')
          .delete()
          .in('id', data.map(d => d.id))
        
        return data.map(d => d.action_data)
      }
      
      return []
    } catch {
      return []
    }
  }

  // Snooze an action
  async snoozeAction(action, duration) {
    const snoozedUntil = duration === 'forever' ? null : this.calculateSnoozeTime(duration)
    
    try {
      await this.db.supabase
        .from('coach_action_snoozes')
        .insert({
          action_id: action.id,
          action_data: action,
          snoozed_until: snoozedUntil,
          snooze_type: duration
        })
      
      console.log(`💤 Action snoozed until ${snoozedUntil || 'manual unsnooze'}`)
      return true
    } catch (error) {
      console.error('Snooze failed:', error)
      return false
    }
  }

  // Calculate snooze end time
  calculateSnoozeTime(duration) {
    const now = new Date()
    
    switch(duration) {
      case '10m':
        return new Date(now.getTime() + 10 * 60 * 1000)
      case '1h':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case '4h':
        return new Date(now.getTime() + 4 * 60 * 60 * 1000)
      case '1d':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      default:
        return null
    }
  }

  // Unsnooze an action
  async unsnoozeAction(actionId) {
    try {
      await this.db.supabase
        .from('coach_action_snoozes')
        .delete()
        .eq('action_id', actionId)
      
      console.log('⏰ Action unsnoozed:', actionId)
      return true
    } catch (error) {
      console.error('Unsnooze failed:', error)
      return false
    }
  }

  // Dismiss an action permanently
  async dismissAction(actionId) {
    try {
      await this.db.supabase
        .from('coach_actions_dismissed')
        .insert({
          action_id: actionId,
          dismissed_at: new Date().toISOString()
        })
      
      console.log('✖️ Action dismissed:', actionId)
      return true
    } catch (error) {
      console.error('Dismiss failed:', error)
      return false
    }
  }

  // Sort actions by priority
  sortActions(actions) {
    const priorityOrder = { urgent: 0, today: 1, upcoming: 2 }
    
    return actions.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // Then by urgency score if available
      if (a.urgencyScore && b.urgencyScore) {
        return b.urgencyScore - a.urgencyScore
      }
      
      return 0
    })
  }

  // Mark action as handled
  async markActionHandled(actionId) {
    // Store in database that action was handled
    console.log('✅ Action marked as handled:', actionId)
    // Could store in a coach_actions_log table
    return true
  }
}

export default NowActionsService
