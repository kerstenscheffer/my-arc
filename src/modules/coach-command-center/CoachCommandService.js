// src/modules/coach-command-center/CoachCommandService.js
// Coach Command Center Service - DEBUGGED VERSION with verbose logging
// Now with detailed error messages to identify issues

import DatabaseService from '../../services/DatabaseService'

class CoachCommandService {
  /**
   * Get all clients with their status information
   * Calculates red/yellow/green status based on activity
   */
  static async getAllClientsStatus(clients) {
    try {
      console.log('📊 [CommandCenter] Calculating status for', clients.length, 'clients')

      if (!clients || clients.length === 0) {
        return []
      }

      const clientIds = clients.map(c => c.id)

      // Parallel queries for performance
      const [meals, calls, weights] = await Promise.all([
        this.getLatestMeals(clientIds),
        this.getUpcomingCalls(clientIds),
        this.getLatestWeights(clientIds)
      ])

      // Calculate status for each client
      const clientsStatus = clients.map(client => {
        const status = this.calculateClientStatus(client, meals, calls, weights)
        return {
          client,
          ...status
        }
      })

      console.log('✅ [CommandCenter] Status calculated for all clients')
      return clientsStatus

    } catch (error) {
      console.error('❌ [CommandCenter] Error in getAllClientsStatus:', error)
      console.error('   Error name:', error.name)
      console.error('   Error message:', error.message)
      console.error('   Error stack:', error.stack)
      return []
    }
  }

  /**
   * Calculate individual client status
   */
  static calculateClientStatus(client, mealsData, callsData, weightsData) {
    const issues = []
    let priority = 0

    // Days since last workout
    const daysSinceWorkout = client.last_workout_date
      ? Math.floor((new Date() - new Date(client.last_workout_date)) / (1000 * 60 * 60 * 24))
      : 999

    // Days since last meal log
    const clientMeals = mealsData.filter(m => m.client_id === client.id)
    const daysSinceMeal = clientMeals.length > 0
      ? Math.floor((new Date() - new Date(clientMeals[0].date)) / (1000 * 60 * 60 * 24))
      : 999

    // Upcoming calls
    const clientCalls = callsData.filter(c => c.client_id === client.id)
    const nextCall = clientCalls.length > 0 ? clientCalls[0] : null

    // Weight tracking
    const clientWeights = weightsData.filter(w => w.client_id === client.id)
    const latestWeight = clientWeights.length > 0 ? clientWeights[0] : null

    // WORKOUT ISSUES
    if (daysSinceWorkout > 3) {
      issues.push(`No workout logged in ${daysSinceWorkout} days`)
      priority += 5
    } else if (daysSinceWorkout >= 2) {
      issues.push(`Last workout ${daysSinceWorkout} days ago`)
      priority += 2
    }

    // MEAL ISSUES
    if (daysSinceMeal > 3) {
      issues.push(`No meals logged in ${daysSinceMeal} days`)
      priority += 5
    } else if (daysSinceMeal >= 2) {
      issues.push(`Last meal log ${daysSinceMeal} days ago`)
      priority += 2
    }

    // CALL ISSUES
    if (nextCall) {
      const daysUntilCall = Math.floor((new Date(nextCall.scheduled_date) - new Date()) / (1000 * 60 * 60 * 24))
      if (daysUntilCall === 0) {
        issues.push('Call scheduled today')
        priority += 3
      } else if (daysUntilCall === 1) {
        issues.push('Call scheduled tomorrow')
        priority += 1
      }
    }

    // GOAL DEADLINE
    if (client.goal_deadline) {
      const daysUntilDeadline = Math.floor((new Date(client.goal_deadline) - new Date()) / (1000 * 60 * 60 * 24))
      if (daysUntilDeadline < 7 && daysSinceWorkout > 2) {
        issues.push(`Goal deadline in ${daysUntilDeadline} days - low activity`)
        priority += 5
      }
    }

    // Determine status color
    let status = 'green'
    if (priority >= 5) status = 'red'
    else if (priority >= 2) status = 'yellow'

    return {
      status,
      priority,
      issues,
      metrics: {
        daysSinceWorkout,
        daysSinceMeal,
        workoutStreak: client.workout_streak || 0,
        nextCallDate: nextCall?.scheduled_date || null,
        latestWeight: latestWeight?.weight || null
      }
    }
  }

  /**
   * Helper: Get latest meals for all clients
   * IMPROVED: Better error handling and fallback
   */
  static async getLatestMeals(clientIds) {
    try {
      console.log('🍽️ [CommandCenter] Fetching meals for', clientIds.length, 'clients')
      
      const { data, error } = await DatabaseService.supabase
        .from('meal_progress')
        .select('client_id, date')
        .in('client_id', clientIds)
        .order('date', { ascending: false })
        .limit(100)

      if (error) {
        console.error('❌ Meal query error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ [CommandCenter] Meals loaded:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Error getting latest meals (DETAILED):')
      console.error('   Error type:', error.constructor.name)
      console.error('   Error message:', error.message)
      console.error('   Error code:', error.code)
      console.error('   Error details:', error.details)
      console.error('   Error hint:', error.hint)
      console.error('   Full error:', JSON.stringify(error, null, 2))
      return [] // Return empty array to allow status calc to continue
    }
  }

  /**
   * Helper: Get upcoming calls
   */
  static async getUpcomingCalls(clientIds) {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('client_calls')
        .select('client_id, scheduled_date')
        .in('client_id', clientIds)
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(100)

      if (error) {
        console.error('❌ Calls query error:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        throw error
      }
      return data || []
    } catch (error) {
      console.error('❌ Error getting calls (DETAILED):', error.message || error)
      return []
    }
  }

  /**
   * Helper: Get latest weights
   */
  static async getLatestWeights(clientIds) {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('weight_history')
        .select('client_id, weight, date')
        .in('client_id', clientIds)
        .order('date', { ascending: false })
        .limit(100)

      if (error) {
        console.error('❌ Weights query error:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        throw error
      }
      return data || []
    } catch (error) {
      console.error('❌ Error getting weights (DETAILED):', error.message || error)
      return []
    }
  }

  /**
   * Toggle pin status for a client
   * IMPROVED: Better error logging and validation
   */
  static async togglePin(clientId) {
    try {
      console.log('📌 [CommandCenter] Toggle pin request for:', clientId)

      // Validate clientId
      if (!clientId) {
        throw new Error('Client ID is required')
      }

      const user = await DatabaseService.getCurrentUser()
      if (!user) {
        throw new Error('Not authenticated - no user found')
      }

      console.log('   User authenticated:', user.id, user.email)

      // Check if already pinned
      console.log('   Checking existing pins...')
      const { data: existing, error: checkError } = await DatabaseService.supabase
        .from('client_notes')
        .select('id')
        .eq('client_id', clientId)
        .eq('coach_id', user.id)
        .eq('category', 'pinned')
        .maybeSingle()

      if (checkError) {
        console.error('❌ Error checking existing pin:', {
          message: checkError.message,
          code: checkError.code,
          details: checkError.details,
          hint: checkError.hint
        })
        throw checkError
      }

      console.log('   Existing pin found:', existing ? 'YES' : 'NO')

      if (existing) {
        // Unpin - delete the note
        console.log('   Unpinning client...')
        const { error: deleteError } = await DatabaseService.supabase
          .from('client_notes')
          .delete()
          .eq('id', existing.id)

        if (deleteError) {
          console.error('❌ Error deleting pin:', {
            message: deleteError.message,
            code: deleteError.code,
            details: deleteError.details
          })
          throw deleteError
        }
        
        console.log('✅ [CommandCenter] Client unpinned:', clientId)
        return false
      } else {
        // Pin - create note with all required fields
        console.log('   Pinning client...')
        
        const noteData = {
          client_id: clientId,
          coach_id: user.id,
          title: 'Pinned in Command Center',
          subtitle: '',
          category: 'pinned',
          content: { sections: [] },
          note_date: new Date().toISOString().split('T')[0],
          priority: 'medium',
          status: 'active',
          tags: []
        }

        console.log('   Note data to insert:', noteData)

        const { data: insertedData, error: insertError } = await DatabaseService.supabase
          .from('client_notes')
          .insert(noteData)
          .select()

        if (insertError) {
          console.error('❌ Error inserting pin (DETAILED):')
          console.error('   Message:', insertError.message)
          console.error('   Code:', insertError.code)
          console.error('   Details:', insertError.details)
          console.error('   Hint:', insertError.hint)
          console.error('   Full error:', JSON.stringify(insertError, null, 2))
          throw insertError
        }

        console.log('✅ [CommandCenter] Client pinned:', clientId)
        console.log('   Inserted data:', insertedData)
        return true
      }
    } catch (error) {
      console.error('❌ [CommandCenter] Error toggling pin (DETAILED):')
      console.error('   Error type:', error.constructor.name)
      console.error('   Error message:', error.message)
      console.error('   Error code:', error.code)
      console.error('   Error details:', error.details)
      console.error('   Error hint:', error.hint)
      console.error('   Client ID:', clientId)
      console.error('   Full error object:', error)
      console.error('   Error stack:', error.stack)
      throw error
    }
  }

  /**
   * Get pinned client IDs
   * IMPROVED: Better error logging
   */
  static async getPinnedClients() {
    try {
      console.log('📌 [CommandCenter] Loading pinned clients...')
      
      const user = await DatabaseService.getCurrentUser()
      if (!user) {
        console.log('   No user authenticated')
        return []
      }

      console.log('   User:', user.id, user.email)

      const { data, error } = await DatabaseService.supabase
        .from('client_notes')
        .select('client_id')
        .eq('coach_id', user.id)
        .eq('category', 'pinned')
        .eq('status', 'active')

      if (error) {
        console.error('❌ Error querying pins:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }
      
      const pinnedIds = data ? data.map(n => n.client_id) : []
      console.log('📌 [CommandCenter] Pinned clients loaded:', pinnedIds.length)
      console.log('   Pinned IDs:', pinnedIds)
      return pinnedIds
    } catch (error) {
      console.error('❌ [CommandCenter] Error getting pinned clients (DETAILED):', error.message || error)
      return []
    }
  }

  /**
   * Quick action: Send message (via notifications table)
   */
  static async sendQuickMessage(clientId, message) {
    try {
      const user = await DatabaseService.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await DatabaseService.supabase
        .from('notifications')
        .insert({
          client_id: clientId,
          coach_id: user.id,
          type: 'coach_message',
          title: 'Message from Coach',
          message: message,
          read: false,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Error sending message:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        throw error
      }
      
      console.log('💬 [CommandCenter] Message sent to client:', clientId)
      return true
    } catch (error) {
      console.error('❌ [CommandCenter] Error sending message (DETAILED):', error.message || error)
      throw error
    }
  }
}

export default CoachCommandService
