// ============================================
// CLIENT JOURNEY TIMELINE - SERVICE LAYER
// src/modules/client-journey/ClientJourneyService.js
// ============================================
// Extends DatabaseService with journey-specific methods
// Uses Supabase tables: client_journey_phases, client_journey_actions, client_journey_notes

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const ClientJourneyService = {

  // ==========================================
  // JOURNEY TEMPLATES (coach creates these)
  // ==========================================
  
  async getJourneyTemplates(coachId) {
    try {
      const { data, error } = await supabase
        .from('journey_templates')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get journey templates failed:', error)
      return []
    }
  },

  async createJourneyTemplate(coachId, templateData) {
    try {
      const { data, error } = await supabase
        .from('journey_templates')
        .insert({
          coach_id: coachId,
          name: templateData.name,
          description: templateData.description || null,
          total_weeks: templateData.total_weeks || 12,
          phases: templateData.phases || [],  // JSONB: [{week_start, week_end, name, color}]
          default_actions: templateData.default_actions || [] // JSONB: [{week, title, type, description}]
        })
        .select()
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Create journey template failed:', error)
      throw error
    }
  },

  // ==========================================
  // CLIENT JOURNEY (per client instance)
  // ==========================================

  async getClientJourney(clientId) {
    try {
      const { data, error } = await supabase
        .from('client_journeys')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('❌ Get client journey failed:', error)
      return null
    }
  },

  async createClientJourney(clientId, coachId, templateData) {
    try {
      const startDate = new Date()
      const { data, error } = await supabase
        .from('client_journeys')
        .insert({
          client_id: clientId,
          coach_id: coachId,
          start_date: startDate.toISOString(),
          total_weeks: templateData.total_weeks || 12,
          phases: templateData.phases || [],
          is_active: true
        })
        .select()
        .single()
      if (error) throw error

      // Auto-create default actions from template
      if (templateData.default_actions?.length > 0) {
        const actions = templateData.default_actions.map(action => ({
          journey_id: data.id,
          client_id: clientId,
          coach_id: coachId,
          week_number: action.week,
          title: action.title,
          description: action.description || null,
          action_type: action.type || 'task', // task, message, call_prep, check_in, milestone
          status: 'pending',
          due_date: this.getWeekDate(startDate, action.week)
        }))

        await supabase.from('journey_actions').insert(actions)
      }

      return data
    } catch (error) {
      console.error('❌ Create client journey failed:', error)
      throw error
    }
  },

  // ==========================================
  // JOURNEY ACTIONS (to-do items on timeline)
  // ==========================================

  async getJourneyActions(journeyId) {
    try {
      const { data, error } = await supabase
        .from('journey_actions')
        .select('*')
        .eq('journey_id', journeyId)
        .order('week_number', { ascending: true })
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get journey actions failed:', error)
      return []
    }
  },

  async createJourneyAction(journeyId, clientId, coachId, actionData) {
    try {
      const { data, error } = await supabase
        .from('journey_actions')
        .insert({
          journey_id: journeyId,
          client_id: clientId,
          coach_id: coachId,
          week_number: actionData.week_number,
          title: actionData.title,
          description: actionData.description || null,
          action_type: actionData.action_type || 'task',
          status: 'pending',
          due_date: actionData.due_date || null,
          sort_order: actionData.sort_order || 0
        })
        .select()
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Create journey action failed:', error)
      throw error
    }
  },

  async updateJourneyAction(actionId, updates) {
    try {
      const { data, error } = await supabase
        .from('journey_actions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Update journey action failed:', error)
      throw error
    }
  },

  async deleteJourneyAction(actionId) {
    try {
      const { error } = await supabase
        .from('journey_actions')
        .delete()
        .eq('id', actionId)
      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ Delete journey action failed:', error)
      return false
    }
  },

  // ==========================================
  // JOURNEY NOTES (timeline-attached notes)
  // ==========================================

  async getJourneyNotes(journeyId) {
    try {
      const { data, error } = await supabase
        .from('journey_notes')
        .select('*')
        .eq('journey_id', journeyId)
        .order('week_number', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get journey notes failed:', error)
      return []
    }
  },

  async createJourneyNote(journeyId, clientId, coachId, noteData) {
    try {
      const { data, error } = await supabase
        .from('journey_notes')
        .insert({
          journey_id: journeyId,
          client_id: clientId,
          coach_id: coachId,
          week_number: noteData.week_number,
          title: noteData.title || '',
          content: noteData.content,
          note_type: noteData.note_type || 'general', // general, call_summary, observation, milestone
          mood: noteData.mood || null // positive, neutral, concern
        })
        .select()
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Create journey note failed:', error)
      throw error
    }
  },

  async updateJourneyNote(noteId, updates) {
    try {
      const { data, error } = await supabase
        .from('journey_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', noteId)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Update journey note failed:', error)
      throw error
    }
  },

  async deleteJourneyNote(noteId) {
    try {
      const { error } = await supabase
        .from('journey_notes')
        .delete()
        .eq('id', noteId)
      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ Delete journey note failed:', error)
      return false
    }
  },

  // ==========================================
  // CALL FLOW TEMPLATES
  // ==========================================

  async getCallFlowTemplates(coachId) {
    try {
      const { data, error } = await supabase
        .from('call_flow_templates')
        .select('*')
        .eq('coach_id', coachId)
        .order('call_number', { ascending: true })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get call flow templates failed:', error)
      return []
    }
  },

  async createCallFlowTemplate(coachId, templateData) {
    try {
      const { data, error } = await supabase
        .from('call_flow_templates')
        .insert({
          coach_id: coachId,
          call_number: templateData.call_number,
          title: templateData.title,
          week_number: templateData.week_number,
          description: templateData.description || null,
          agenda_items: templateData.agenda_items || [], // JSONB [{title, duration_min, notes}]
          deliverables: templateData.deliverables || [], // JSONB [{title, description}]
          prep_checklist: templateData.prep_checklist || [] // JSONB [{item, required}]
        })
        .select()
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Create call flow template failed:', error)
      throw error
    }
  },

  async updateCallFlowTemplate(templateId, updates) {
    try {
      const { data, error } = await supabase
        .from('call_flow_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', templateId)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Update call flow template failed:', error)
      throw error
    }
  },

  // ==========================================
  // HELPERS
  // ==========================================

  getWeekDate(startDate, weekNumber) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + (weekNumber - 1) * 7)
    return date.toISOString()
  },

  getCurrentWeek(startDate) {
    const start = new Date(startDate)
    const now = new Date()
    const diffMs = now - start
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, diffWeeks + 1)
  },

  getWeekProgress(actions) {
    if (!actions.length) return 0
    const completed = actions.filter(a => a.status === 'completed').length
    return Math.round((completed / actions.length) * 100)
  }
}

export default ClientJourneyService
