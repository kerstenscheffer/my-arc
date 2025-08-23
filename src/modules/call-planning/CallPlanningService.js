// ============================================
// MY ARC CALL PLANNING SERVICE - V2.0
// Fixed Supabase Integration
// ============================================

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

class CallPlanningService {
  constructor() {
    this.supabase = supabase
    this.currentUser = null
    
    // Initialize current user
    this.initUser()
  }

  async initUser() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      this.currentUser = user
      return user
    } catch (error) {
      console.error('Error initializing user:', error)
      return null
    }
  }

  // ============================================
  // TEMPLATE MANAGEMENT
  // ============================================

  async getCoachTemplates(coachId = null) {
    try {
      // Ensure we have a user
      if (!this.currentUser) {
        await this.initUser()
      }
      
      const userId = coachId || this.currentUser?.id
      if (!userId) {
        console.log('No user ID available')
        return []
      }

      const { data, error } = await this.supabase
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

      console.log('📋 Loaded templates:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Error loading templates:', error)
      return []
    }
  }

  async createTemplate(templateData) {
    try {
      // Ensure we have a user
      if (!this.currentUser) {
        await this.initUser()
      }

      const { template_name, description, total_calls, bonus_calls_allowed, items } = templateData

      // Create the template
      const { data: template, error: templateError } = await this.supabase
        .from('call_templates')
        .insert({
          coach_id: this.currentUser?.id,
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
          calendly_link: item.calendly_link || '',
          week_number: item.week_number || (index + 1),
          duration_minutes: item.duration_minutes || 30,
          preparation_notes: item.preparation_notes || ''
        }))

        const { error: itemsError } = await this.supabase
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

// VERVANG de updateTemplate functie met deze versie:
async updateTemplate(templateId, updates) {
  try {
    // Haal items uit updates (die moeten apart behandeld worden)
    const { items, ...templateData } = updates;
    
    // Update alleen de template basis data (zonder items)
    const { data, error } = await this.supabase
      .from('call_templates')
      .update({
        template_name: templateData.template_name,
        description: templateData.description,
        total_calls: templateData.total_calls,
        bonus_calls_allowed: templateData.bonus_calls_allowed,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error
    
    // Als er items zijn, update die in de call_template_items tabel
    if (items && items.length > 0) {
      // Eerst oude items verwijderen
      const { error: deleteError } = await this.supabase
        .from('call_template_items')
        .delete()
        .eq('template_id', templateId)
      
      if (deleteError) {
        console.error('Error deleting old items:', deleteError)
      }
      
      // Dan nieuwe items toevoegen
      const itemsToInsert = items.map((item, index) => ({
        template_id: templateId,
        call_number: index + 1,
        call_title: item.call_title || item.title,
        client_subject: item.client_subject || item.clientSubject,
        coach_subject: item.coach_subject || item.coachSubject,
        calendly_link: item.calendly_link || item.calendlyLink || '',
        week_number: item.week_number || item.week || index + 1,
        preparation_notes: item.preparation_notes || ''
      }))
      
      const { error: insertError } = await this.supabase
        .from('call_template_items')
        .insert(itemsToInsert)
      
      if (insertError) {
        console.error('Error inserting new items:', insertError)
        throw insertError
      }
    }
    
    console.log('✅ Template and items updated')
    return data
  } catch (error) {
    console.error('Error updating template:', error)
    throw error
  }
}
  async deleteTemplate(templateId) {
    try {
      const { error } = await this.supabase
        .from('call_templates')
        .update({ is_active: false })
        .eq('id', templateId)

      if (error) throw error
      console.log('🗑️ Template deleted')
      return true
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  }

  // ============================================
  // CLIENT PLAN MANAGEMENT
  // ============================================

  async assignTemplateToClient(clientId, templateId, startDate = null) {
    try {
      // Ensure we have a user
      if (!this.currentUser) {
        await this.initUser()
      }

      // Check if client already has an active plan
      const { data: existingPlan } = await this.supabase
        .from('client_call_plans')
        .select('id, status')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .single()

      if (existingPlan) {
        // Ask to deactivate old plan
        const confirmReplace = confirm('Deze client heeft al een actief call plan. Wil je het oude plan vervangen?')
        if (!confirmReplace) {
          throw new Error('Actie geannuleerd')
        }
        
        // Deactivate old plan
        const { error: updateError } = await this.supabase
          .from('client_call_plans')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPlan.id)
        
        if (updateError) throw updateError
        console.log('Old plan deactivated')
      }

      // Create the new plan
      const { data: plan, error: planError } = await this.supabase
        .from('client_call_plans')
        .insert({
          client_id: clientId,
          template_id: templateId,
          coach_id: this.currentUser?.id,
          start_date: startDate || new Date().toISOString().split('T')[0],
          status: 'active'
        })
        .select()
        .single()

      if (planError) throw planError

      // Get template items
      const { data: templateItems, error: itemsError } = await this.supabase
        .from('call_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('call_number')

      if (itemsError) throw itemsError

      // Create client calls based on template
      if (templateItems && templateItems.length > 0) {
        const clientCalls = templateItems.map((item, index) => ({
          plan_id: plan.id,
          client_id: clientId,
          template_item_id: item.id,
          call_number: item.call_number,
          call_title: item.call_title,
          status: index === 0 ? 'available' : 'locked' // First call is available
        }))

        const { error: callsError } = await this.supabase
          .from('client_calls')
          .insert(clientCalls)

        if (callsError) throw callsError
      }

      console.log('✅ Template assigned to client')
      return plan
    } catch (error) {
      console.error('Error assigning template:', error)
      throw error
    }
  }

  async getCoachPlans() {
    try {
      // Ensure we have a user
      if (!this.currentUser) {
        await this.initUser()
      }

      if (!this.currentUser?.id) {
        console.log('No user ID for coach plans')
        return []
      }

      // Get plans first
      const { data: plans, error: plansError } = await this.supabase
        .from('client_call_plans')
        .select('*')
        .eq('coach_id', this.currentUser.id)
        .order('created_at', { ascending: false })

      if (plansError) {
        console.error('Error loading plans:', plansError)
        return []
      }

      // Get all unique client IDs
      const clientIds = [...new Set(plans.map(p => p.client_id))]
      
      // Get all clients in one query - ONLY select columns that exist
      const { data: clients, error: clientsError } = await this.supabase
        .from('clients')
        .select('*')  // Get ALL columns to see what's available
        .in('id', clientIds)

      if (clientsError) {
        console.error('Error loading clients:', clientsError)
      }

      // Log first client to see structure
      if (clients && clients.length > 0) {
        console.log('Client structure:', Object.keys(clients[0]))
      }

      // Create a map for quick lookup
      const clientMap = {}
      if (clients) {
        clients.forEach(client => {
          clientMap[client.id] = client
        })
      }

      // Get all template IDs
      const templateIds = [...new Set(plans.map(p => p.template_id))]
      
      // Get all templates in one query
      const { data: templates } = await this.supabase
        .from('call_templates')
        .select('id, template_name, total_calls')
        .in('id', templateIds)

      // Create template map
      const templateMap = {}
      if (templates) {
        templates.forEach(template => {
          templateMap[template.id] = template
        })
      }

      // Process each plan
      for (let plan of plans) {
        // Add client info
        const client = clientMap[plan.client_id]
        if (client) {
          // Use whatever name field exists
          const clientName = client.full_name || client.first_name || client.last_name || 
                           client.email || `Client ${client.id?.substring(0, 8)}`
          
          plan.clients = {
            id: client.id,
            name: clientName,
            full_name: clientName,
            email: client.email || '',
            // Include all other client fields
            ...client
          }
        } else {
          // Fallback if client not found
          plan.clients = {
            id: plan.client_id,
            name: `Client ${plan.client_id?.substring(0, 8)}`,
            full_name: `Client ${plan.client_id?.substring(0, 8)}`
          }
        }
        
        // Add template info
        const template = templateMap[plan.template_id]
        if (template) {
          plan.call_templates = template
        }
        
        // Get calls for this plan
        const { data: calls } = await this.supabase
          .from('client_calls')
          .select('*')
          .eq('plan_id', plan.id)
          .order('call_number')
        
        plan.client_calls = calls || []
      }

      console.log('📋 Loaded coach plans with details:', plans?.length || 0)
      if (plans.length > 0) {
        console.log('First plan client:', plans[0]?.clients)
      }
      return plans || []
    } catch (error) {
      console.error('Error loading coach plans:', error)
      return []
    }
  }

// VERVANG de getClientPlans functie in CallPlanningService.js met:

async getClientPlans(clientId) {
  try {
    console.log('🔍 Loading plans for client:', clientId)
        
    // Query met ALLE relaties inclusief template items
    let { data: plans, error } = await this.supabase
      .from('client_call_plans')
      .select(`
        *,
        call_templates (
          *,
          call_template_items (*)
        ),
        client_calls (
          *,
          call_template_items:template_item_id (
            calendly_link,
            preparation_notes
          )
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading client plans:', error)
      return []
    }
    
    // Fallback: als geen plans, probeer met user_id
    if ((!plans || plans.length === 0) && this.currentUser) {
      console.log('No plans found with client_id, trying with user_id...')
      
      const { data: client } = await this.supabase
        .from('clients')
        .select('id')
        .eq('id', this.currentUser.id)
        .single()
    
      if (client) {
        console.log('Found client by user_id:', client.id)
        const { data: userPlans } = await this.supabase
          .from('client_call_plans')
          .select(`
            *,
            call_templates (
              *,
              call_template_items (*)
            ),
            client_calls (
              *,
              call_template_items:template_item_id (
                calendly_link,
                preparation_notes
              )
            )
          `)
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
      
        plans = userPlans
      }
    }
    
    // Process plans - voeg calendly links toe van template OF template_items
    if (plans && plans.length > 0) {
      plans.forEach(plan => {
        if (plan.client_calls) {
          plan.client_calls.forEach(call => {
            // Eerst check of er een direct gekoppelde template_item is
            if (call.call_template_items?.calendly_link) {
              call.calendly_link = call.call_template_items.calendly_link
            }
            // Anders zoek in de template items op call_number
            else if (plan.call_templates?.call_template_items) {
              const templateItem = plan.call_templates.call_template_items.find(
                item => item.call_number === call.call_number
              )
              if (templateItem?.calendly_link) {
                call.calendly_link = templateItem.calendly_link
              }
            }
          })
        }
      })
    }
    
    console.log('Plans loaded with relations:', plans)
    return plans || []
    
  } catch (error) {
    console.error('Error in getClientPlans:', error)
    return []
  }
}

  // ============================================
  // CALL MANAGEMENT
  // ============================================
// In CallPlanningService.js, vervang de scheduleCall method:
async scheduleCall(callId, scheduledDate, clientNotes = null) {
  try {
    const { data, error } = await this.supabase
      .from('client_calls')
      .update({
        scheduled_date: scheduledDate, // DIT MOET ERIN!
        status: 'scheduled',
        client_notes: clientNotes,
        zoom_link: 'https://zoom.us/j/pending', // Tijdelijke zoom link
        meeting_location: 'Zoom Meeting',
        updated_at: new Date().toISOString()
      })
      .eq('id', callId)
      .select()
      .single()

    if (error) throw error

    console.log('📅 Call scheduled with date:', scheduledDate)
    return data
  } catch (error) {
    console.error('Error scheduling call:', error)
    throw error
  }
} 

  async completeCall(callId, coachNotes, coachSummary = null) {
    try {
      const { data, error } = await this.supabase
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

  async cancelCall(callId, reason = null) {
    try {
      const { data, error } = await this.supabase
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
  // CALL REQUESTS
  // ============================================

  async submitCallRequest(clientId, planId, requestData) {
    try {
      const { reason, requested_date, requested_time, urgency } = requestData

      const { data, error } = await this.supabase
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

  async getPendingRequests() {
    try {
      // Ensure we have a user
      if (!this.currentUser) {
        await this.initUser()
      }

      if (!this.currentUser?.id) {
        console.log('No user ID for pending requests')
        return []
      }

      // First get plans for this coach
      const { data: coachPlans, error: plansError } = await this.supabase
        .from('client_call_plans')
        .select('id')
        .eq('coach_id', this.currentUser.id)

      if (plansError) throw plansError

      if (!coachPlans || coachPlans.length === 0) {
        return []
      }

      const planIds = coachPlans.map(p => p.id)

      // Get requests for these plans
      const { data, error } = await this.supabase
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
        .in('plan_id', planIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('📨 Pending requests:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Error loading requests:', error)
      return []
    }
  }

  async approveRequest(requestId, coachResponse = null) {
    try {
      const { data: request, error: fetchError } = await this.supabase
        .from('call_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (fetchError) throw fetchError

      // Update request status
      const { error: updateError } = await this.supabase
        .from('call_requests')
        .update({
          status: 'approved',
          coach_response: coachResponse,
          approved_date: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Create bonus call
      const { data: bonusCall, error: callError } = await this.supabase
        .from('client_calls')
        .insert({
          plan_id: request.plan_id,
          client_id: request.client_id,
          call_number: 99, // High number for bonus calls
          call_title: 'Bonus Call - ' + (request.reason?.substring(0, 50) || 'Extra call'),
          status: 'available'
        })
        .select()
        .single()

      if (callError) throw callError

      // Update request with call reference
      await this.supabase
        .from('call_requests')
        .update({ scheduled_call_id: bonusCall.id })
        .eq('id', requestId)

      // Update bonus calls used count
      await this.supabase
        .from('client_call_plans')
        .update({ 
          bonus_calls_used: request.bonus_calls_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.plan_id)

      console.log('✅ Request approved')
      return true
    } catch (error) {
      console.error('Error approving request:', error)
      throw error
    }
  }

  async rejectRequest(requestId, reason) {
    try {
      const { error } = await this.supabase
        .from('call_requests')
        .update({
          status: 'rejected',
          coach_response: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

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

  async createCallNotification(recipientId, callId, type, title, message) {
    try {
      const { error } = await this.supabase
        .from('call_notifications')
        .insert({
          recipient_id: recipientId,
          recipient_type: 'client',
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

  async getUnreadNotifications() {
    try {
      // Ensure we have a user
      if (!this.currentUser) {
        await this.initUser()
      }

      const { data, error } = await this.supabase
        .from('call_notifications')
        .select('*')
        .eq('recipient_id', this.currentUser?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading notifications:', error)
      return []
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const { error } = await this.supabase
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
  // STATISTICS
  // ============================================

  async getCallStatistics() {
    try {
      // Ensure we have a user
      if (!this.currentUser) {
        await this.initUser()
      }

      if (!this.currentUser?.id) {
        return {
          total: 0,
          completed: 0,
          scheduled: 0,
          pending: 0,
          thisWeek: 0,
          thisMonth: 0
        }
      }

      // Get all plans for this coach
      const { data: plans, error: plansError } = await this.supabase
        .from('client_call_plans')
        .select('id')
        .eq('coach_id', this.currentUser.id)

      if (plansError) throw plansError

      if (!plans || plans.length === 0) {
        return {
          total: 0,
          completed: 0,
          scheduled: 0,
          pending: 0,
          thisWeek: 0,
          thisMonth: 0
        }
      }

      const planIds = plans.map(p => p.id)

      // Get all calls for these plans
      const { data: calls, error } = await this.supabase
        .from('client_calls')
        .select('status, scheduled_date, completed_date')
        .in('plan_id', planIds)

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
