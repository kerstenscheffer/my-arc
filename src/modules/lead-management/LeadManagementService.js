// src/modules/lead-management/LeadManagementService.js
import DatabaseService from '../../services/DatabaseService'

class LeadManagementService {
  constructor() {
    this.db = DatabaseService
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  async createLead(leadData) {
    try {
      const { data, error } = await this.db.supabase
        .from('call_leads')
        .insert({
          first_name: leadData.firstName,
          last_name: leadData.lastName,
          email: leadData.email,
          phone: leadData.phone,
          lead_source: leadData.source || 'website',
          coach_id: leadData.coachId || null,
          utm_source: leadData.utmSource || null,
          utm_medium: leadData.utmMedium || null,
          utm_campaign: leadData.utmCampaign || null,
          referrer_url: leadData.referrerUrl || null
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Lead created:', data.id)
      return data
    } catch (error) {
      console.error('❌ Create lead failed:', error)
      throw error
    }
  }

  async getLeads(coachId, filters = {}) {
    try {
      let query = this.db.supabase
        .from('call_leads')
        .select(`
          *,
          lead_notes:lead_notes(count)
        `)
        .or(`coach_id.eq.${coachId},coach_id.is.null`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority)
      }

      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
      }

      if (filters.dateRange) {
        const dateRanges = {
          'today': 1,
          'week': 7,
          'month': 30,
          'quarter': 90
        }
        const days = dateRanges[filters.dateRange]
        if (days) {
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - days)
          query = query.gte('created_at', cutoffDate.toISOString())
        }
      }

      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) throw error
      console.log('✅ Leads loaded:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Get leads failed:', error)
      return []
    }
  }

  async getLeadById(leadId) {
    try {
      const { data, error } = await this.db.supabase
        .from('call_leads')
        .select(`
          *,
          lead_notes:lead_notes(*),
          lead_activities:lead_activities(*)
        `)
        .eq('id', leadId)
        .is('deleted_at', null)
        .single()

      if (error) throw error
      console.log('✅ Lead details loaded:', leadId)
      return data
    } catch (error) {
      console.error('❌ Get lead by ID failed:', error)
      return null
    }
  }

  async updateLead(leadId, updates) {
    try {
      if (updates.status === 'contacted' && !updates.last_contacted_at) {
        updates.last_contacted_at = new Date().toISOString()
        
        const { data: lead } = await this.db.supabase
          .from('call_leads')
          .select('created_at')
          .eq('id', leadId)
          .single()

        if (lead) {
          const responseTimeMs = new Date() - new Date(lead.created_at)
          updates.response_time_hours = Math.round(responseTimeMs / (1000 * 60 * 60))
        }
      }

      const { data, error } = await this.db.supabase
        .from('call_leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Lead updated:', leadId)
      return data
    } catch (error) {
      console.error('❌ Update lead failed:', error)
      throw error
    }
  }

  async deleteLead(leadId, softDelete = true) {
    try {
      if (softDelete) {
        const { data, error } = await this.db.supabase
          .from('call_leads')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', leadId)
          .select()
          .single()

        if (error) throw error
        console.log('✅ Lead soft deleted:', leadId)
        return data
      } else {
        const { error } = await this.db.supabase
          .from('call_leads')
          .delete()
          .eq('id', leadId)

        if (error) throw error
        console.log('✅ Lead permanently deleted:', leadId)
        return true
      }
    } catch (error) {
      console.error('❌ Delete lead failed:', error)
      throw error
    }
  }

  // ============================================================================
  // STATUS MANAGEMENT
  // ============================================================================

  async updateLeadStatus(leadId, newStatus, coachId) {
    try {
      const updates = { 
        status: newStatus
      }

      if (coachId) {
        updates.coach_id = coachId
      }

      if (newStatus === 'scheduled') {
        updates.scheduled_at = new Date().toISOString()
      } else if (newStatus === 'converted') {
        updates.conversion_date = new Date().toISOString().split('T')[0]
      }

      return await this.updateLead(leadId, updates)
    } catch (error) {
      console.error('❌ Update lead status failed:', error)
      throw error
    }
  }

  async bulkUpdateStatus(leadIds, newStatus, coachId) {
    try {
      const updates = { 
        status: newStatus
      }

      if (coachId) {
        updates.coach_id = coachId
      }

      if (newStatus === 'scheduled') {
        updates.scheduled_at = new Date().toISOString()
      } else if (newStatus === 'converted') {
        updates.conversion_date = new Date().toISOString().split('T')[0]
      }

      const { data, error } = await this.db.supabase
        .from('call_leads')
        .update(updates)
        .in('id', leadIds)
        .select()

      if (error) throw error
      console.log('✅ Bulk status update:', leadIds.length, 'leads')
      return data
    } catch (error) {
      console.error('❌ Bulk update status failed:', error)
      throw error
    }
  }

  // ============================================================================
  // NOTES & ACTIVITIES
  // ============================================================================

  async addLeadNote(leadId, noteData, coachId) {
    try {
      const { data, error } = await this.db.supabase
        .from('lead_notes')
        .insert({
          lead_id: leadId,
          coach_id: coachId,
          note_type: noteData.type || 'general',
          subject: noteData.subject || null,
          content: noteData.content
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Note added to lead:', leadId)
      return data
    } catch (error) {
      console.error('❌ Add lead note failed:', error)
      throw error
    }
  }

  async getLeadNotes(leadId) {
    try {
      const { data, error } = await this.db.supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('✅ Lead notes loaded:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Get lead notes failed:', error)
      return []
    }
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  async getLeadStats(coachId, dateRange = 30) {
    // ✅ FORCE FALLBACK - Skip broken RPC function
    console.log('🔄 Using fallback stats (RPC bypassed)')
    return await this.getLeadStatsFallback(coachId, dateRange)
  }

  async getLeadStatsFallback(coachId, dateRange) {
    try {
      console.log('📊 STATS FALLBACK - Fetching ALL leads...')
      
      // ✅ CRITICAL FIX: Fetch ALL leads without ANY filters
      const { data, error, count } = await this.db.supabase
        .from('call_leads')
        .select('status, lead_source, created_at', { count: 'exact' })
        .is('deleted_at', null)

      if (error) {
        console.error('📊 Stats query error:', error)
        throw error
      }

      console.log('📊 Raw stats data - Total count:', count)
      console.log('📊 Raw stats data - Rows:', data?.length)
      console.log('📊 First lead example:', data?.[0])

      // Calculate stats from ALL leads
      const stats = {
        total_leads: data?.length || 0,
        new_leads: data?.filter(l => l.status === 'new').length || 0,
        contacted_leads: data?.filter(l => l.status === 'contacted').length || 0,
        scheduled_leads: data?.filter(l => l.status === 'scheduled').length || 0,
        converted_leads: data?.filter(l => l.status === 'converted').length || 0,
        conversion_rate: data?.length > 0 
          ? Math.round((data.filter(l => l.status === 'converted').length / data.length) * 100)
          : 0,
        avg_response_time_hours: 0,
        leads_by_source: {}
      }

      // Count by source
      data?.forEach(lead => {
        const source = lead.lead_source || 'unknown'
        stats.leads_by_source[source] = (stats.leads_by_source[source] || 0) + 1
      })

      console.log('📊 FINAL CALCULATED STATS:', stats)

      return stats
    } catch (error) {
      console.error('❌ Fallback stats failed:', error)
      return this.getEmptyStats()
    }
  }

  getEmptyStats() {
    return {
      total_leads: 0,
      new_leads: 0,
      contacted_leads: 0,
      scheduled_leads: 0,
      converted_leads: 0,
      conversion_rate: 0,
      avg_response_time_hours: 0,
      leads_by_source: {}
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkDeleteLeads(leadIds, softDelete = true) {
    try {
      if (softDelete) {
        const { data, error } = await this.db.supabase
          .from('call_leads')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', leadIds)
          .select()

        if (error) throw error
        console.log('✅ Bulk soft delete:', leadIds.length, 'leads')
        return data
      } else {
        const { error } = await this.db.supabase
          .from('call_leads')
          .delete()
          .in('id', leadIds)

        if (error) throw error
        console.log('✅ Bulk permanent delete:', leadIds.length, 'leads')
        return true
      }
    } catch (error) {
      console.error('❌ Bulk delete failed:', error)
      throw error
    }
  }

  async exportLeadsCSV(filters, coachId) {
    try {
      const leads = await this.getLeads(coachId, { ...filters, limit: 10000 })
      
      const csvHeaders = [
        'Naam', 'Email', 'Telefoon', 'Status', 'Prioriteit', 
        'Bron', 'Aangemaakt', 'Laatst Contact'
      ]

      const csvRows = leads.map(lead => [
        `${lead.first_name} ${lead.last_name}`,
        lead.email,
        lead.phone,
        lead.status,
        lead.priority,
        lead.lead_source,
        new Date(lead.created_at).toLocaleDateString('nl-NL'),
        lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString('nl-NL') : ''
      ])

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      console.log('✅ CSV export prepared:', leads.length, 'leads')
      return csvContent
    } catch (error) {
      console.error('❌ Export CSV failed:', error)
      throw error
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  subscribeToLeadUpdates(coachId, callback) {
    try {
      const subscription = this.db.supabase
        .channel('lead-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'call_leads'
          },
          callback
        )
        .subscribe()

      console.log('✅ Lead updates subscription active')
      return subscription
    } catch (error) {
      console.error('❌ Subscribe to lead updates failed:', error)
      return null
    }
  }
}

export default LeadManagementService
