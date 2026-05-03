// src/modules/client-journey/SalesCallService.js
// Service voor sales call notities en kwalificatie
// Zelfde patroon als JourneyCallService

class SalesCallService {
  constructor(supabase) {
    this.supabase = supabase
  }

  // ── SALES CALL NOTITIES ──────────────────────────────────────────────────

  async getSalesCallNotes(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('sales_call_notes')
        .eq('id', clientId)
        .single()

      if (error) throw error
      return data?.sales_call_notes || null
    } catch (error) {
      console.error('❌ getSalesCallNotes failed:', error)
      return null
    }
  }

  async saveSalesCallNotes(clientId, notes) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .update({
          sales_call_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select('id, sales_call_notes')
        .single()

      if (error) throw error
      console.log('✅ Sales call notes saved')
      return data
    } catch (error) {
      console.error('❌ saveSalesCallNotes failed:', error)
      throw error
    }
  }

  // ── COACHING METHOD ──────────────────────────────────────────────────────

  async getCoachingMethod(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('coaching_method')
        .eq('id', clientId)
        .single()

      if (error) throw error
      return data?.coaching_method || null
    } catch (error) {
      console.error('❌ getCoachingMethod failed:', error)
      return null
    }
  }

  async saveCoachingMethod(clientId, method) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .update({
          coaching_method: method,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select('id, coaching_method')
        .single()

      if (error) throw error
      console.log('✅ Coaching method saved')
      return data
    } catch (error) {
      console.error('❌ saveCoachingMethod failed:', error)
      throw error
    }
  }

  // ── CLIENT OPHALEN VOOR SALES CALL ───────────────────────────────────────

  async getClientForSalesCall(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          primary_goal,
          motivation,
          biggest_obstacle,
          coaching_expectations,
          coaching_style_pref,
          previous_coaching,
          wat_werkte_eerder,
          waarom_gestopt,
          sales_call_notes,
          coaching_method
        `)
        .eq('id', clientId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ getClientForSalesCall failed:', error)
      return null
    }
  }
}

export default SalesCallService
