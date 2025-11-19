// src/modules/lead-management/LeadManagementService.js
// EXTENDED VERSION with Kanban Board functionality
import DatabaseService from '../../services/DatabaseService'

class LeadManagementService {
  constructor() {
    this.db = DatabaseService
  }

  // ============================================================================
  // CRUD OPERATIONS (EXISTING)
  // ============================================================================

  async createLead(leadData) {
    try {
      console.log('🔍 CREATE LEAD - Input data:', leadData)
      
      const insertData = {
        first_name: leadData.firstName || leadData.name?.split(' ')[0] || '',
        last_name: leadData.lastName || leadData.name?.split(' ').slice(1).join(' ') || '',
        email: leadData.email || null,
        phone: leadData.phone || null,
        lead_source: leadData.source || 'manual',
        coach_id: leadData.coachId || null,
        notes: leadData.notes || null,
        utm_source: leadData.utmSource || null,
        utm_medium: leadData.utmMedium || null,
        utm_campaign: leadData.utmCampaign || null,
        referrer_url: leadData.referrerUrl || null
      }
      
      console.log('🔍 INSERT DATA to Supabase:', insertData)

      const { data, error } = await this.db.supabase
        .from('call_leads')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error DETAILS:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        throw error
      }
      
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

  async updateLead(leadId, updates) {
    try {
      if (updates.status === 'contacted' && !updates.last_contacted_at) {
        updates.last_contacted_at = new Date().toISOString()
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
  // KANBAN BOARD METHODS (NEW)
  // ============================================================================

  async createSection(coachId, sectionData) {
    try {
      const { data, error } = await this.db.supabase
        .from('lead_sections')
        .insert({
          coach_id: coachId,
          title: sectionData.title,
          color: sectionData.color || '#10b981',
          position: sectionData.position || 0
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Section created:', data.id)
      return data
    } catch (error) {
      console.error('❌ Create section failed:', error)
      throw error
    }
  }

  async getSections(coachId) {
    try {
      const { data, error } = await this.db.supabase
        .from('lead_sections')
        .select('*')
        .eq('coach_id', coachId)
        .order('position', { ascending: true })

      if (error) throw error
      console.log('✅ Sections loaded:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Get sections failed:', error)
      return []
    }
  }

  async updateSection(sectionId, updates) {
    try {
      const { data, error } = await this.db.supabase
        .from('lead_sections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sectionId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Section updated:', sectionId)
      return data
    } catch (error) {
      console.error('❌ Update section failed:', error)
      throw error
    }
  }

  async deleteSection(sectionId) {
    try {
      const { error } = await this.db.supabase
        .from('lead_sections')
        .delete()
        .eq('id', sectionId)

      if (error) throw error
      console.log('✅ Section deleted:', sectionId)
      return true
    } catch (error) {
      console.error('❌ Delete section failed:', error)
      throw error
    }
  }

  async getKanbanBoard(coachId) {
    try {
      const sections = await this.getSections(coachId)

      const { data: sectionItems, error: itemsError } = await this.db.supabase
        .from('lead_section_items')
        .select('lead_id, section_id, position')

      if (itemsError) throw itemsError

      const { data: allLeads, error: leadsError } = await this.db.supabase
        .from('call_leads')
        .select('*')
        .or(`coach_id.eq.${coachId},coach_id.is.null`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError

      const leadMap = new Map(allLeads.map(lead => [lead.id, lead]))
      const assignedLeadIds = new Set(sectionItems.map(item => item.lead_id))

      const board = sections.map(section => {
        const sectionLeads = sectionItems
          .filter(item => item.section_id === section.id)
          .map(item => ({
            ...leadMap.get(item.lead_id),
            position: item.position
          }))
          .filter(lead => lead.id)
          .sort((a, b) => a.position - b.position)

        return {
          ...section,
          leads: sectionLeads
        }
      })

      const unassignedLeads = allLeads.filter(lead => !assignedLeadIds.has(lead.id))
      
      board.push({
        id: 'unassigned',
        title: 'Niet toegewezen',
        color: '#6b7280',
        position: 9999,
        leads: unassignedLeads
      })

      console.log('✅ Kanban board loaded:', board.length, 'sections')
      return board
    } catch (error) {
      console.error('❌ Get kanban board failed:', error)
      return []
    }
  }

  async moveLeadToSection(leadId, targetSectionId, targetPosition = 0) {
    try {
      if (targetSectionId === 'unassigned') {
        return await this.removeLeadFromSection(leadId)
      }

      const { data: existing } = await this.db.supabase
        .from('lead_section_items')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle()

      if (existing) {
        const { data, error } = await this.db.supabase
          .from('lead_section_items')
          .update({
            section_id: targetSectionId,
            position: targetPosition,
            moved_at: new Date().toISOString()
          })
          .eq('lead_id', leadId)
          .select()
          .single()

        if (error) throw error
        console.log('✅ Lead moved:', leadId, 'to section:', targetSectionId)
        return data
      } else {
        const { data, error } = await this.db.supabase
          .from('lead_section_items')
          .insert({
            lead_id: leadId,
            section_id: targetSectionId,
            position: targetPosition
          })
          .select()
          .single()

        if (error) throw error
        console.log('✅ Lead assigned:', leadId, 'to section:', targetSectionId)
        return data
      }
    } catch (error) {
      console.error('❌ Move lead to section failed:', error)
      throw error
    }
  }

  async removeLeadFromSection(leadId) {
    try {
      const { error } = await this.db.supabase
        .from('lead_section_items')
        .delete()
        .eq('lead_id', leadId)

      if (error) throw error
      console.log('✅ Lead removed from section:', leadId)
      return true
    } catch (error) {
      console.error('❌ Remove lead from section failed:', error)
      throw error
    }
  }

  async createLeadWithSection(leadData, sectionId, coachId) {
    try {
      console.log('🔍 CREATE LEAD WITH SECTION:', { leadData, sectionId, coachId })
      
      const lead = await this.createLead({
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source,
        notes: leadData.notes,
        coachId: coachId
      })

      if (sectionId && sectionId !== 'unassigned') {
        await this.moveLeadToSection(lead.id, sectionId, 0)
      }

      console.log('✅ Lead created and assigned:', lead.id)
      return lead
    } catch (error) {
      console.error('❌ Create lead with section failed:', error)
      throw error
    }
  }

  async reorderSections(coachId, sectionIds) {
    try {
      const updates = sectionIds.map((id, index) => 
        this.updateSection(id, { position: index })
      )
      
      await Promise.all(updates)
      console.log('✅ Sections reordered')
      return true
    } catch (error) {
      console.error('❌ Reorder sections failed:', error)
      throw error
    }
  }

  async reorderLeadsInSection(sectionId, leadIds) {
    try {
      const updates = leadIds.map((leadId, index) => 
        this.db.supabase
          .from('lead_section_items')
          .update({ position: index })
          .eq('lead_id', leadId)
          .eq('section_id', sectionId)
      )
      
      await Promise.all(updates)
      console.log('✅ Leads reordered in section')
      return true
    } catch (error) {
      console.error('❌ Reorder leads failed:', error)
      throw error
    }
  }

  // ============================================================================
  // EXISTING METHODS (unchanged)
  // ============================================================================

  async getLeadStats(coachId, dateRange = 30) {
    console.log('🔄 Using fallback stats (RPC bypassed)')
    return await this.getLeadStatsFallback(coachId, dateRange)
  }

  async getLeadStatsFallback(coachId, dateRange) {
    try {
      const { data, error, count } = await this.db.supabase
        .from('call_leads')
        .select('status, lead_source, created_at', { count: 'exact' })
        .is('deleted_at', null)

      if (error) throw error

      const stats = {
        total_leads: data?.length || 0,
        new_leads: data?.filter(l => l.status === 'new').length || 0,
        contacted_leads: data?.filter(l => l.status === 'contacted').length || 0,
        scheduled_leads: data?.filter(l => l.status === 'scheduled').length || 0,
        converted_leads: data?.filter(l => l.status === 'converted').length || 0,
        conversion_rate: data?.length > 0 
          ? Math.round((data.filter(l => l.status === 'converted').length / data.length) * 100)
          : 0,
        leads_by_source: {}
      }

      data?.forEach(lead => {
        const source = lead.lead_source || 'unknown'
        stats.leads_by_source[source] = (stats.leads_by_source[source] || 0) + 1
      })

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
      leads_by_source: {}
    }
  }

  async bulkUpdateStatus(leadIds, newStatus, coachId) {
    try {
      const updates = { status: newStatus }
      if (coachId) updates.coach_id = coachId
      if (newStatus === 'scheduled') updates.scheduled_at = new Date().toISOString()
      if (newStatus === 'converted') updates.conversion_date = new Date().toISOString().split('T')[0]

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












// ============================================================================
  // OUTREACH ANALYTICS METHODS
  // ============================================================================

  async createCampaign(campaignData, coachId) {
    try {
      const { data, error } = await this.db.supabase
        .from('outreach_campaigns')
        .insert({
          coach_id: coachId,
          platform: campaignData.platform,
          message_text: campaignData.messageText,
          purpose: campaignData.purpose,
          total_sent: campaignData.totalSent || 0,
          campaign_date: campaignData.date || new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Campaign created:', data.id)
      return data
    } catch (error) {
      console.error('❌ Create campaign failed:', error)
      throw error
    }
  }

  async getCampaigns(coachId, limit = 50) {
    try {
      const { data, error } = await this.db.supabase
        .from('outreach_campaigns')
        .select(`
          *,
          metrics:outreach_metrics(*)
        `)
        .eq('coach_id', coachId)
        .order('campaign_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      console.log('✅ Campaigns loaded:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Get campaigns failed:', error)
      return []
    }
  }

  async updateCampaign(campaignId, updates) {
    try {
      const { data, error } = await this.db.supabase
        .from('outreach_campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Campaign updated:', campaignId)
      return data
    } catch (error) {
      console.error('❌ Update campaign failed:', error)
      throw error
    }
  }

  async deleteCampaign(campaignId) {
    try {
      // Delete metrics first
      await this.db.supabase
        .from('outreach_metrics')
        .delete()
        .eq('campaign_id', campaignId)

      // Delete campaign
      const { error } = await this.db.supabase
        .from('outreach_campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) throw error
      console.log('✅ Campaign deleted:', campaignId)
      return true
    } catch (error) {
      console.error('❌ Delete campaign failed:', error)
      throw error
    }
  }

async addMetric(campaignId, metricName, metricColor, position = 0) {
    try {
      const { data, error } = await this.db.supabase
        .from('outreach_metrics')
        .insert({
          campaign_id: campaignId,
          metric_name: metricName,
          metric_color: metricColor || '#10b981',
          metric_value: 0,
          position: position
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Metric added:', data.id)
      return data
    } catch (error) {
      console.error('❌ Add metric failed:', error)
      throw error
    }
  }
  async updateMetricValue(metricId, newValue) {
    try {
      const { data, error } = await this.db.supabase
        .from('outreach_metrics')
        .update({
          metric_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', metricId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Metric updated:', metricId, 'value:', newValue)
      return data
    } catch (error) {
      console.error('❌ Update metric failed:', error)
      throw error
    }
  }

  async incrementMetric(metricId) {
    try {
      const { data: current } = await this.db.supabase
        .from('outreach_metrics')
        .select('metric_value')
        .eq('id', metricId)
        .single()

      return await this.updateMetricValue(metricId, (current?.metric_value || 0) + 1)
    } catch (error) {
      console.error('❌ Increment metric failed:', error)
      throw error
    }
  }

  async decrementMetric(metricId) {
    try {
      const { data: current } = await this.db.supabase
        .from('outreach_metrics')
        .select('metric_value')
        .eq('id', metricId)
        .single()

      const newValue = Math.max(0, (current?.metric_value || 0) - 1)
      return await this.updateMetricValue(metricId, newValue)
    } catch (error) {
      console.error('❌ Decrement metric failed:', error)
      throw error
    }
  }

  async deleteMetric(metricId) {
    try {
      const { error } = await this.db.supabase
        .from('outreach_metrics')
        .delete()
        .eq('id', metricId)

      if (error) throw error
      console.log('✅ Metric deleted:', metricId)
      return true
    } catch (error) {
      console.error('❌ Delete metric failed:', error)
      throw error
    }
  }

  async getCampaignStats(coachId, dateRange = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - dateRange)

      const { data: campaigns, error } = await this.db.supabase
        .from('outreach_campaigns')
        .select(`
          *,
          metrics:outreach_metrics(*)
        `)
        .eq('coach_id', coachId)
        .gte('campaign_date', cutoffDate.toISOString().split('T')[0])

      if (error) throw error

      const stats = {
        total_campaigns: campaigns?.length || 0,
        total_sent: campaigns?.reduce((sum, c) => sum + (c.total_sent || 0), 0) || 0,
        total_responses: 0,
        platforms: {},
        conversion_rate: 0
      }

      campaigns?.forEach(campaign => {
        // Count platforms
        const platform = campaign.platform || 'unknown'
        stats.platforms[platform] = (stats.platforms[platform] || 0) + 1

        // Sum all metric values as "responses"
        campaign.metrics?.forEach(metric => {
          stats.total_responses += metric.metric_value || 0
        })
      })

      // Calculate conversion rate
      if (stats.total_sent > 0) {
        stats.conversion_rate = ((stats.total_responses / stats.total_sent) * 100).toFixed(2)
      }

      console.log('✅ Campaign stats calculated:', stats)
      return stats
    } catch (error) {
      console.error('❌ Get campaign stats failed:', error)
      return {
        total_campaigns: 0,
        total_sent: 0,
        total_responses: 0,
        platforms: {},
        conversion_rate: 0
      }
    }
  }














}

export default LeadManagementService
