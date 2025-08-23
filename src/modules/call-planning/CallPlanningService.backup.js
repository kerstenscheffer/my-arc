// ============================================
// MY ARC CALL PLANNING SERVICE
// ============================================
// Module: call-planning-system
// Created: 21 August 2024
// Purpose: Extends DatabaseService with call planning methods
// ============================================

import DatabaseService from '../../services/DatabaseService'

class CallPlanningService {
  constructor() {
    // Get the singleton DatabaseService instance
    this.db = DatabaseService
  }

  // ============================================
  // TEMPLATE MANAGEMENT (Coach)
  // ============================================

  /**
   * Get all templates for a coach
   */
  async getCoachTemplates(coachId = null) {
    try {
      const userId = coachId || this.db.currentUser?.id
      if (!userId) throw new Error('No coach ID provided')

      const { data, error } = await this.db.supabase
        .from('call_templates')
        .select(`
          *,
          call_template_items (
            id,
            call_number,
            call_title,
            client_subject,
            coach_subject,
            calendly_link,
            week_number,
            duration_minutes,
            preparation_notes
          )
        `)
        .eq('coach_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Sort template items by call number
      data?.forEach(template => {
        if (template.call_template_items) {
          template.call_template_items.sort((a, b) => a.call_number - b.call_number)
        }
      })

      console.log('📋 Loaded templates:', data?.length)
      return data || []
    } catch (error) {
      console.error('Error loading templates:', error)
      return []
    }
  }

  /**
   * Create a new call template
   */
  async createTemplate(templateData) {
    try {
      const { template_name, description, total_calls, bonus_calls_allowed, items } = templateData

      // Create the template
      const { data: template, error: templateError } = await this.db.supabase
        .from('call_templates')
        .insert({
          coach_id: this.db.currentUser?.id,
          template_name,
          description,
          total_calls: parseInt(total_calls),
          bonus_calls_allowed: parseInt(bonus_calls_allowed) || 2
        })
        .select()
        .single()

      if (templateError) throw templateError

      // Create template items if provided
      if (items && items.length > 0) {
        const templateItems = items.map((item, index) => ({
          template_id: template.id,
          call_number: index + 1,
          call_title: item.call_title,
          client_subject: item.client_subject,
          coach_subject: item.coach_subject,
          calendly_link: item.calendly_link,
          week_number: item.week_number,
          duration_minutes: item.duration_minutes || 30,
          preparation_notes: item.preparation_notes
        }))

        const { error: itemsError } = await this.db.supabase
          .from('call_template_items')
          .insert(templateItems)

        if (itemsError) throw itemsError
      }

      console.log('✅ Template created:', template.template_name)
      return template
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId, updates) {
    try {
      const { data, error } = await this.db.supabase
        .from('call_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Template updated:', data.template_name)
      return data
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  /**
   * Delete a template (soft delete by setting is_active = false)
   */
  async deleteTemplate(templateId) {
    try {
      const { error } = await this.db.supabase
        .from('call_templates')
        .update({ is_active: false })
        .eq('id', templateId)

      if (error) throw error
      console.log('🗑️ Template deactivated')
      return true
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  }

  /**
   * Update template items
   */
  async updateTemplateItems(templateId, items) {
    try {
      // Delete existing items
      await this.db.supabase
        .from('call_template_items')
        .delete()
        .eq('template_id', templateId)

      // Insert new items
      const templateItems = items.map((item, index) => ({
        template_id: templateId,
        call_number: index + 1,
        call_title: item.call_title,
        client_subject: item.client_subject,
        coach_subject: item.coach_subject,
        calendly_link: item.calendly_link,
        week_number: item.week_number,
        duration_minutes: item.duration_minutes || 30,
        preparation_notes: item.preparation_notes
      }))

      const { error } = await this.db.supabase
        .from('call_template_items')
        .insert(templateItems)

      if (error) throw error
      console.log('✅ Template items updated')
      return true
    } catch (error) {
      console.error('Error updating template items:', error)
      throw error
    }
  }

  // ============================================
  // CLIENT PLAN MANAGEMENT (Coach)
  // ============================================

  /**
   * Assign a template to a client
   */
  async assignTemplateToClient(clientId, templateId, startDate = null) {
    try {
      // Check if client already has an active plan
      const { data: existingPlan } = await this.db.supabase
        .from('client_call_plans')
        .select('id')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .single()

      if (existingPlan) {
        throw new Error('Client already has an active call plan')
      }

      // Create the plan
      const { data: plan, error: planError } = await this.db.supabase
        .from('client_call_plans')
        .insert({
          client_id: clientId,
          template_id: templateId,
          coach_id: this.db.currentUser?.id,
          start_date: startDate || new Date().toISOString().split('T')[0],
          status: 'active'
        })
        .select()
        .single()

      if (planError) throw planError

      // Get template items
      const { data: templateItems, error: itemsError } = await this.db.supabase
        .from('call_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('call_number')

      if (itemsError) throw itemsError

      // Create client calls based on template
      const clientCalls = templateItems.map((item, index) => ({
        plan_id: plan.id,
        client_id: clientId,
        template_item_id: item.id,
        call_number: item.call_number,
        call_title: item.call_title,
        status: index === 0 ? 'available' : 'locked' // First call is available
      }))

      const { error: callsError } = await this.db.supabase
        .from('client_calls')
        .insert(clientCalls)

      if (callsError) throw callsError

      console.log('✅ Template assigned to client')
      return plan
    } catch (error) {
      console.error('Error assigning template:', error)
      throw error
    }
  }

  /**
   * Get all active plans for a coach
   */
  async getCoachPlans() {
    try {
      const { data, error } = await this.db.supabase
        .from('client_call_plans')
        .select(`
          *,
          clients (
            id,
            full_name,
            email
          ),
          call_templates (
            template_name,
            total_calls
          ),
          client_calls (
            id,
            call_number,
            status,
            scheduled_date,
            completed_date
          )
        `)
        .eq('coach_id', this.db.currentUser?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('📋 Loaded coach plans:', data?.length)
      return data || []
    } catch (error) {
      console.error('Error loading coach plans:', error)
      return []
    }
  }

  /**
   * Get plans for a specific client
   */
  async getClientPlans(clientId) {
    try {
      const { data, error } = await this.db.supabase
        .from('client_call_plans')
        .select(`
          *,
          call_templates (
            template_name,
            total_calls,
            bonus_calls_allowed
          ),
          client_calls (
            id,
            call_number,
            call_title,
            status,
            scheduled_date,
            completed_date,
            call_template_items (
              client_subject,
              coach_subject,
              calendly_link,
              week_number,
              duration_minutes,
              preparation_notes
            )
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Sort calls by call number
      data?.forEach(plan => {
        if (plan.client_calls) {
          plan.client_calls.sort((a, b) => a.call_number - b.call_number)
        }
      })

      console.log('📋 Loaded client plans:', data?.length)
      return data || []
    } catch (error) {
      console.error('Error loading client plans:', error)
      return []
    }
  }

  // ============================================
  // CALL MANAGEMENT
  // ============================================

  /**
   * Schedule a call
   */
  async scheduleCall(callId, scheduledDate, clientNotes = null) {
    try {
      const { data, error } = await this.db.supabase
        .from('client_calls')
        .update({
          scheduled_date: scheduledDate,
          status: 'scheduled',
          client_notes: clientNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', callId)
        .select()
        .single()

      if (error) throw error

      // Create notification for coach
      await this.createCallNotification(
        data.client_id,
        callId,
        'call_scheduled',
        'Call ingepland',
        `Een call is ingepland voor ${new Date(scheduledDate).toLocaleString('nl-NL')}`
      )

      console.log('📅 Call scheduled')
      return data
    } catch (error) {
      console.error('Error scheduling call:', error)
      throw error
    }
  }

  /**
   * Complete a call
   */
  async completeCall(callId, coachNotes, coachSummary = null) {
    try {
      const { data, error } = await this.db.supabase
        .from('client_calls')
        .update({
          completed_date: new Date().toISOString(),
          status: 'completed',
          coach_notes: coachNotes,
          coach_summary: coachSummary,
          updated_at: new Date().toISOString()
        })
        .eq('id', callId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Call completed')
      return data
    } catch (error) {
      console.error('Error completing call:', error)
      throw error
    }
  }

  /**
   * Cancel a call
   */
  async cancelCall(callId, reason = null) {
    try {
      const { data, error } = await this.db.supabase
        .from('client_calls')
        .update({
          status: 'cancelled',
          coach_notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', callId)
        .select()
        .single()

      if (error) throw error

      console.log('❌ Call cancelled')
      return data
    } catch (error) {
      console.error('Error cancelling call:', error)
      throw error
    }
  }

  // ============================================
  // CALL REQUESTS (Client)
  // ============================================

  /**
   * Submit a call request
   */
  async submitCallRequest(clientId, planId, requestData) {
    try {
      const { reason, requested_date, requested_time, urgency } = requestData

      const { data, error } = await this.db.supabase
        .from('call_requests')
        .insert({
          client_id: clientId,
          plan_id: planId,
          reason,
          requested_date,
          requested_time,
          urgency: urgency || 'normal',
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      console.log('📨 Call request submitted')
      return data
    } catch (error) {
      console.error('Error submitting request:', error)
      throw error
    }
  }

  /**
   * Get pending requests for coach
   */
  async getPendingRequests() {
    try {
      const { data, error } = await this.db.supabase
        .from('call_requests')
        .select(`
          *,
          clients (
            full_name,
            email
          ),
          client_call_plans (
            id,
            call_templates (
              template_name
            )
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('📨 Pending requests:', data?.length)
      return data || []
    } catch (error) {
      console.error('Error loading requests:', error)
      return []
    }
  }

  /**
   * Approve a call request
   */
  async approveRequest(requestId, coachResponse = null) {
    try {
      const { data: request, error: fetchError } = await this.db.supabase
        .from('call_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (fetchError) throw fetchError

      // Update request status
      const { error: updateError } = await this.db.supabase
        .from('call_requests')
        .update({
          status: 'approved',
          coach_response: coachResponse,
          approved_date: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Create bonus call
      const { data: bonusCall, error: callError } = await this.db.supabase
        .from('client_calls')
        .insert({
          plan_id: request.plan_id,
          client_id: request.client_id,
          call_number: 99, // High number for bonus calls
          call_title: 'Bonus Call - ' + request.reason.substring(0, 50),
          status: 'available'
        })
        .select()
        .single()

      if (callError) throw callError

      // Update request with call reference
      await this.db.supabase
        .from('call_requests')
        .update({ scheduled_call_id: bonusCall.id })
        .eq('id', requestId)

      // Create notification for client
      await this.createCallNotification(
        request.client_id,
        null,
        'request_approved',
        'Call aanvraag goedgekeurd',
        'Je call aanvraag is goedgekeurd! Je kunt nu een tijd inplannen.'
      )

      console.log('✅ Request approved')
      return true
    } catch (error) {
      console.error('Error approving request:', error)
      throw error
    }
  }

  /**
   * Reject a call request
   */
  async rejectRequest(requestId, reason) {
    try {
      const { data, error } = await this.db.supabase
        .from('call_requests')
        .update({
          status: 'rejected',
          coach_response: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single()

      if (error) throw error

      // Create notification for client
      await this.createCallNotification(
        data.client_id,
        null,
        'request_rejected',
        'Call aanvraag afgewezen',
        `Je call aanvraag is afgewezen. Reden: ${reason}`
      )

      console.log('❌ Request rejected')
      return true
    } catch (error) {
      console.error('Error rejecting request:', error)
      throw error
    }
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  /**
   * Create a notification
   */
  async createCallNotification(recipientId, callId, type, title, message) {
    try {
      // For MY ARC, client ID is the same as their auth user ID
      // So we can use recipientId directly
      const recipientType = 'client' // Adjust based on your needs
      
      const { error } = await this.db.supabase
        .from('call_notifications')
        .insert({
          recipient_id: recipientId,
          recipient_type: recipientType,
          call_id: callId,
          type,
          title,
          message
        })

      if (error) throw error
      console.log('🔔 Notification created')
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications() {
    try {
      const { data, error } = await this.db.supabase
        .from('call_notifications')
        .select('*')
        .eq('recipient_id', this.db.currentUser?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading notifications:', error)
      return []
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId) {
    try {
      const { error } = await this.db.supabase
        .from('call_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) throw error
      console.log('✓ Notification marked as read')
    } catch (error) {
      console.error('Error marking notification:', error)
    }
  }

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get call statistics for dashboard
   */
  async getCallStatistics() {
    try {
      const coachId = this.db.currentUser?.id
      
      // Get all calls for this coach's clients
      const { data: calls, error } = await this.db.supabase
        .from('client_calls')
        .select(`
          status,
          scheduled_date,
          completed_date,
          client_call_plans (
            coach_id
          )
        `)
        .eq('client_call_plans.coach_id', coachId)

      if (error) throw error

      const stats = {
        total: calls?.length || 0,
        completed: calls?.filter(c => c.status === 'completed').length || 0,
        scheduled: calls?.filter(c => c.status === 'scheduled').length || 0,
        pending: calls?.filter(c => c.status === 'available').length || 0,
        thisWeek: 0,
        thisMonth: 0
      }

      // Calculate this week and month
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      calls?.forEach(call => {
        const callDate = new Date(call.scheduled_date || call.completed_date)
        if (callDate > weekAgo) stats.thisWeek++
        if (callDate > monthAgo) stats.thisMonth++
      })

      return stats
    } catch (error) {
      console.error('Error calculating statistics:', error)
      return {
        total: 0,
        completed: 0,
        scheduled: 0,
        pending: 0,
        thisWeek: 0,
        thisMonth: 0
      }
    }
  }
}

// Export singleton instance
export default new CallPlanningService()
