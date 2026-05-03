// src/intake/IntakeService.js
// Standalone service — geen DatabaseService dependency
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const IntakeService = {

  /**
   * Submit intake form (PUBLIC - geen auth nodig)
   */
  async submitIntake(answers, contact) {
    try {
      const { data, error } = await supabase
        .from('intake_submissions')
        .insert({
          goal: answers.goal || null,
          age_range: answers.age || null,
          goal_description: answers.goal_description || null,
          obstacle: answers.obstacle || null,
          urgency: answers.urgency || null,
          budget: answers.budget || null,
          commitment: answers.commitment || null,
          contact_name: contact.name,
          contact_email: contact.email || null,
          contact_phone: contact.phone,
          source: 'intake_funnel'
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Intake saved:', data.id)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Intake submit failed:', error)
      return { success: false, error }
    }
  },

  /**
   * Get all submissions (Coach view)
   */
  async getSubmissions(status = null) {
    try {
      let query = supabase
        .from('intake_submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (status) query = query.eq('status', status)

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get submissions failed:', error)
      return []
    }
  },

  /**
   * Update status (Coach action)
   */
  async updateStatus(id, status, notes = null) {
    try {
      const updates = { status }
      if (notes !== null) updates.notes = notes
      if (status === 'contacted') updates.contacted_at = new Date().toISOString()
      if (status === 'converted') updates.converted_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('intake_submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Status updated:', id, '→', status)
      return data
    } catch (error) {
      console.error('❌ Update status failed:', error)
      throw error
    }
  },

  /**
   * Delete a submission
   */
  async deleteSubmission(id) {
    try {
      const { error } = await supabase
        .from('intake_submissions')
        .delete()
        .eq('id', id)

      if (error) throw error
      console.log('✅ Submission deleted:', id)
      return true
    } catch (error) {
      console.error('❌ Delete failed:', error)
      throw error
    }
  }
}

export default IntakeService
