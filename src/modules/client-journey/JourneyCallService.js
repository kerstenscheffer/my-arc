// ============================================
// FILE: src/modules/client-journey/JourneyCallService.js
// Call journey service - templates, client calls, pre-call checks
// ============================================

class JourneyCallService {
  constructor(supabase) {
    this.supabase = supabase
  }

  // ========== TEMPLATES ==========

  async getTemplateForCallNumber(callNumber) {
    try {
      const { data, error } = await this.supabase
        .from('journey_call_templates')
        .select('*')
        .eq('call_number', callNumber)
        .eq('is_active', true)
        .single()
      if (error) throw error
      return data
    } catch (e) {
      console.error('❌ Get call template failed:', e)
      return null
    }
  }

  // Get template for a specific week (maps week → call number)
  async getTemplateForWeek(weekNumber) {
    // Call number mapping: week 1=call 1, week 2=call 2, week 3=call 3, week 5=call 4, etc.
    // For weeks beyond defined templates, use the recurring template (call 7)
    try {
      // First try exact week match
      let { data, error } = await this.supabase
        .from('journey_call_templates')
        .select('*')
        .eq('week_number', weekNumber)
        .eq('is_active', true)
        .limit(1)

      if (data && data.length > 0) return data[0]

      // Fallback: recurring template for week 11+
      if (weekNumber >= 11) {
        const { data: recurring } = await this.supabase
          .from('journey_call_templates')
          .select('*')
          .eq('call_number', 7)
          .eq('is_active', true)
          .limit(1)
        return recurring?.[0] || null
      }

      return null
    } catch (e) {
      console.error('❌ Get template for week failed:', e)
      return null
    }
  }

  // ========== CLIENT CALLS ==========

  // Get or create a client call for a specific week
  async getOrCreateClientCall(journeyId, clientId, coachId, weekNumber, totalWeeks) {
    try {
      // Check if exists
      const { data: existing } = await this.supabase
        .from('journey_client_calls')
        .select('*')
        .eq('journey_id', journeyId)
        .eq('week_number', weekNumber)
        .limit(1)

      if (existing && existing.length > 0) return existing[0]

      // Get template for this week
      const template = await this.getTemplateForWeek(weekNumber)
      if (!template) return null

      // Create new client call
      const { data, error } = await this.supabase
        .from('journey_client_calls')
        .insert({
          journey_id: journeyId,
          client_id: clientId,
          coach_id: coachId,
          template_id: template.id,
          call_number: template.call_number,
          week_number: weekNumber,
          day_number: template.day_number || 0,
          status: 'upcoming',
          checklist_results: template.checklist || [],
          topics_covered: []
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (e) {
      console.error('❌ Get/create client call failed:', e)
      return null
    }
  }

  // Get client call with template data
  async getClientCallWithTemplate(journeyId, weekNumber) {
    try {
      const { data, error } = await this.supabase
        .from('journey_client_calls')
        .select('*, template:journey_call_templates(*)')
        .eq('journey_id', journeyId)
        .eq('week_number', weekNumber)
        .limit(1)

      if (error) throw error
      return data?.[0] || null
    } catch (e) {
      console.error('❌ Get client call failed:', e)
      return null
    }
  }

  // Get previous call (for "vorige week notities")
  async getPreviousCall(journeyId, currentWeekNumber) {
    try {
      const { data, error } = await this.supabase
        .from('journey_client_calls')
        .select('*')
        .eq('journey_id', journeyId)
        .lt('week_number', currentWeekNumber)
        .order('week_number', { ascending: false })
        .limit(1)

      if (error) throw error
      return data?.[0] || null
    } catch (e) {
      console.error('❌ Get previous call failed:', e)
      return null
    }
  }

  // Update call notes
  async updateCallNotes(callId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('journey_client_calls')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', callId)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (e) {
      console.error('❌ Update call notes failed:', e)
      return null
    }
  }

  // Mark call as completed
  async completeCall(callId, summary, actionItems) {
    return this.updateCallNotes(callId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      summary,
      action_items: actionItems
    })
  }

  // Toggle topic covered
  async toggleTopic(callId, topicId, currentTopics) {
    const updated = currentTopics.includes(topicId)
      ? currentTopics.filter(t => t !== topicId)
      : [...currentTopics, topicId]
    return this.updateCallNotes(callId, { topics_covered: updated })
  }

  // ========== PRE-CALL DATA CHECKS ==========

  async getPreCallData(clientId, weekNumber, journeyStartDate) {
    const data = {}

    // Weight trend (last 7 days)
    try {
      const { data: weights } = await this.supabase
        .from('weight_history')
        .select('weight, date')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(14)

      if (weights && weights.length > 0) {
        const recent = weights[0]?.weight
        const weekAgo = weights.length >= 7 ? weights[6]?.weight : weights[weights.length - 1]?.weight
        data.weight = {
          current: recent,
          weekAgo,
          change: recent && weekAgo ? (recent - weekAgo).toFixed(1) : null,
          entries: weights.length,
          trend: recent > weekAgo ? 'up' : recent < weekAgo ? 'down' : 'stable'
        }
      }
    } catch (e) { data.weight = null }

    // Workout compliance (last 7 days)
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: workouts } = await this.supabase
        .from('workout_sessions')
        .select('id, completed_at')
        .eq('client_id', clientId)
        .gte('completed_at', sevenDaysAgo.toISOString())

      data.workouts = {
        completedThisWeek: workouts?.length || 0,
        target: 4 // default, could come from client profile
      }
    } catch (e) { data.workouts = null }

    // Meal compliance (last 7 days)
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: meals } = await this.supabase
        .from('meal_progress')
        .select('id, date')
        .eq('client_id', clientId)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])

      data.meals = {
        daysTracked: new Set(meals?.map(m => m.date)).size,
        target: 7
      }
    } catch (e) { data.meals = null }

    return data
  }
}

export default JourneyCallService
