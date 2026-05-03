// src/modules/lead-management/CampaignTrackingService.js
// Campaign Tracking voor Instagram Scrape Sessies
// Tracks: welke influencer → hoeveel leads → hoeveel conversies

import DatabaseService from '../../services/DatabaseService'

class CampaignTrackingService {
  constructor() {
    this.db = DatabaseService
  }

  // ============================================================================
  // CAMPAIGN CRUD
  // ============================================================================

  /**
   * Start een nieuwe scrape campaign
   * @param {string} coachId - UUID van de coach
   * @param {object} campaignData - { name, sourceAccount, sourceType, hypothesis, notes }
   */
  async startCampaign(coachId, campaignData) {
    try {
      const { data, error } = await this.db.supabase
        .from('scrape_campaigns')
        .insert({
          coach_id: coachId,
          name: campaignData.name,
          source_account: campaignData.sourceAccount || null,
          source_type: campaignData.sourceType || 'comments',
          hypothesis: campaignData.hypothesis || null,
          notes: campaignData.notes || null,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Campaign started:', data.name)
      return data
    } catch (error) {
      console.error('❌ Start campaign failed:', error)
      throw error
    }
  }

  /**
   * Beëindig een campaign
   */
  async endCampaign(campaignId) {
    try {
      const { data, error } = await this.db.supabase
        .from('scrape_campaigns')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Campaign ended:', data.name)
      return data
    } catch (error) {
      console.error('❌ End campaign failed:', error)
      throw error
    }
  }

  /**
   * Pauzeer een campaign
   */
  async pauseCampaign(campaignId) {
    try {
      const { data, error } = await this.db.supabase
        .from('scrape_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Pause campaign failed:', error)
      throw error
    }
  }

  /**
   * Hervat een gepauzeerde campaign
   */
  async resumeCampaign(campaignId) {
    try {
      const { data, error } = await this.db.supabase
        .from('scrape_campaigns')
        .update({ status: 'active' })
        .eq('id', campaignId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Resume campaign failed:', error)
      throw error
    }
  }

  /**
   * Update campaign details
   */
  async updateCampaign(campaignId, updates) {
    try {
      const { data, error } = await this.db.supabase
        .from('scrape_campaigns')
        .update({
          name: updates.name,
          source_account: updates.sourceAccount,
          source_type: updates.sourceType,
          hypothesis: updates.hypothesis,
          notes: updates.notes
        })
        .eq('id', campaignId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Update campaign failed:', error)
      throw error
    }
  }

  /**
   * Delete campaign (soft - keeps data, just marks as deleted)
   */
  async deleteCampaign(campaignId) {
    try {
      // First unlink all leads from this campaign
      await this.db.supabase
        .from('warm_up_leads')
        .update({ campaign_id: null })
        .eq('campaign_id', campaignId)

      await this.db.supabase
        .from('call_leads')
        .update({ campaign_id: null })
        .eq('campaign_id', campaignId)

      // Then delete the campaign
      const { error } = await this.db.supabase
        .from('scrape_campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) throw error
      console.log('✅ Campaign deleted')
      return true
    } catch (error) {
      console.error('❌ Delete campaign failed:', error)
      throw error
    }
  }

  // ============================================================================
  // CAMPAIGN QUERIES
  // ============================================================================

  /**
   * Get all campaigns for a coach
   */
  async getCampaigns(coachId, includeCompleted = true) {
    try {
      let query = this.db.supabase
        .from('scrape_campaigns')
        .select('*')
        .eq('coach_id', coachId)
        .order('started_at', { ascending: false })

      if (!includeCompleted) {
        query = query.neq('status', 'completed')
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get campaigns failed:', error)
      return []
    }
  }

  /**
   * Get active campaign (if any)
   */
  async getActiveCampaign(coachId) {
    try {
      const { data, error } = await this.db.supabase
        .from('scrape_campaigns')
        .select('*')
        .eq('coach_id', coachId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Get active campaign failed:', error)
      return null
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId) {
    try {
      const { data, error } = await this.db.supabase
        .from('scrape_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Get campaign failed:', error)
      return null
    }
  }

  // ============================================================================
  // LIVE STATS - The Money Maker 💰
  // ============================================================================

  /**
   * Get live funnel stats for a campaign
   * This is the core tracking functionality
   */
  async getCampaignLiveStats(campaignId) {
    try {
      // 1. Get campaign info
      const campaign = await this.getCampaign(campaignId)
      if (!campaign) throw new Error('Campaign not found')

      // 2. Get warm-up leads for this campaign
      const { data: warmUpLeads, error: warmUpError } = await this.db.supabase
        .from('warm_up_leads')
        .select('id, phase, created_at')
        .eq('campaign_id', campaignId)

      if (warmUpError) throw warmUpError

      // 3. Get converted leads for this campaign
      const { data: callLeads, error: callError } = await this.db.supabase
        .from('call_leads')
        .select('id, created_at')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)

      if (callError) throw callError

      // 4. Get section positions for converted leads
      const callLeadIds = (callLeads || []).map(l => l.id)
      let sectionData = []
      
      if (callLeadIds.length > 0) {
        const { data: sections, error: sectionError } = await this.db.supabase
          .from('lead_section_items')
          .select(`
            lead_id,
            section_id,
            lead_sections!inner(id, title)
          `)
          .in('lead_id', callLeadIds)

        if (!sectionError) sectionData = sections || []
      }

      // 5. Calculate funnel metrics
      const warmUpByPhase = {
        phase_0: 0,  // Nieuw
        phase_1: 0,  // 1 Interactie
        phase_2: 0,  // 2 Interacties
        phase_3: 0,  // Klaar voor DM
        phase_4: 0   // DM Gestuurd
      }

      ;(warmUpLeads || []).forEach(lead => {
        warmUpByPhase[`phase_${lead.phase}`]++
      })

      // 6. Categorize converted leads by section
      const sectionCounts = {}
      const sectionKeywords = {
        'gesprek': ['gesprek', 'conversation', 'chat'],
        'call_voorgesteld': ['voorgesteld', 'proposed', 'aangeboden'],
        'call_ingepland': ['ingepland', 'scheduled', 'geboekt', 'call'],
        'no_response': ['stil', 'stale', 'geen reactie', 'no response'],
        'converted': ['klant', 'client', 'converted', 'gewonnen', 'sale']
      }

      sectionData.forEach(item => {
        const sectionTitle = (item.lead_sections?.title || '').toLowerCase()
        let matched = false

        for (const [key, keywords] of Object.entries(sectionKeywords)) {
          if (keywords.some(kw => sectionTitle.includes(kw))) {
            sectionCounts[key] = (sectionCounts[key] || 0) + 1
            matched = true
            break
          }
        }

        if (!matched) {
          sectionCounts['other'] = (sectionCounts['other'] || 0) + 1
        }
      })

      // 7. Calculate rates
      const totalScraped = (warmUpLeads?.length || 0) + (callLeads?.length || 0)
      const warmUpTotal = warmUpLeads?.length || 0
      const dmSent = warmUpByPhase.phase_4
      const convertedToLead = callLeads?.length || 0
      const inConversation = sectionCounts['gesprek'] || 0
      const callsScheduled = sectionCounts['call_ingepland'] || 0

      const rates = {
        warmup_to_dm: warmUpTotal > 0 ? Math.round((dmSent / warmUpTotal) * 100) : 0,
        dm_to_lead: dmSent > 0 ? Math.round((convertedToLead / dmSent) * 100) : 0,
        lead_to_conversation: convertedToLead > 0 ? Math.round((inConversation / convertedToLead) * 100) : 0,
        conversation_to_call: inConversation > 0 ? Math.round((callsScheduled / inConversation) * 100) : 0,
        overall_conversion: totalScraped > 0 ? Math.round((callsScheduled / totalScraped) * 100) : 0
      }

      return {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          source: campaign.source_account,
          sourceType: campaign.source_type,
          hypothesis: campaign.hypothesis,
          status: campaign.status,
          startedAt: campaign.started_at,
          endedAt: campaign.ended_at
        },
        funnel: {
          total_scraped: totalScraped,
          warm_up_total: warmUpTotal,
          ...warmUpByPhase,
          converted_to_lead: convertedToLead,
          ...sectionCounts
        },
        rates,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Get campaign live stats failed:', error)
      throw error
    }
  }

  /**
   * Get stats for all campaigns (for comparison)
   */
  async getAllCampaignStats(coachId) {
    try {
      const campaigns = await this.getCampaigns(coachId, true)
      
      const statsPromises = campaigns.map(async (campaign) => {
        try {
          const stats = await this.getCampaignLiveStats(campaign.id)
          return stats
        } catch {
          return {
            campaign: { id: campaign.id, name: campaign.name },
            funnel: { total_scraped: 0 },
            rates: {},
            error: true
          }
        }
      })

      const allStats = await Promise.all(statsPromises)
      return allStats
    } catch (error) {
      console.error('❌ Get all campaign stats failed:', error)
      return []
    }
  }

  /**
   * Compare multiple campaigns side by side
   */
  async compareCampaigns(campaignIds) {
    try {
      const statsPromises = campaignIds.map(id => this.getCampaignLiveStats(id))
      const allStats = await Promise.all(statsPromises)

      // Find best performers
      let bestDmRate = { campaign: null, rate: 0 }
      let bestConversionRate = { campaign: null, rate: 0 }
      let mostLeads = { campaign: null, count: 0 }

      allStats.forEach(stats => {
        if (stats.rates.warmup_to_dm > bestDmRate.rate) {
          bestDmRate = { campaign: stats.campaign.name, rate: stats.rates.warmup_to_dm }
        }
        if (stats.rates.overall_conversion > bestConversionRate.rate) {
          bestConversionRate = { campaign: stats.campaign.name, rate: stats.rates.overall_conversion }
        }
        if (stats.funnel.total_scraped > mostLeads.count) {
          mostLeads = { campaign: stats.campaign.name, count: stats.funnel.total_scraped }
        }
      })

      return {
        campaigns: allStats,
        insights: {
          bestDmRate,
          bestConversionRate,
          mostLeads
        }
      }
    } catch (error) {
      console.error('❌ Compare campaigns failed:', error)
      throw error
    }
  }

  // ============================================================================
  // HISTORY & ANALYTICS
  // ============================================================================

  /**
   * Get campaign history with aggregated stats
   */
  async getCampaignHistory(coachId, limit = 20) {
    try {
      const campaigns = await this.getCampaigns(coachId, true)
      const limitedCampaigns = campaigns.slice(0, limit)

      const historyPromises = limitedCampaigns.map(async (campaign) => {
        // Get quick counts without full stats calculation
        const { count: warmUpCount } = await this.db.supabase
          .from('warm_up_leads')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)

        const { count: leadCount } = await this.db.supabase
          .from('call_leads')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .is('deleted_at', null)

        return {
          ...campaign,
          warmUpCount: warmUpCount || 0,
          leadCount: leadCount || 0,
          totalCount: (warmUpCount || 0) + (leadCount || 0)
        }
      })

      return await Promise.all(historyPromises)
    } catch (error) {
      console.error('❌ Get campaign history failed:', error)
      return []
    }
  }

  /**
   * Get aggregated stats across all campaigns
   */
  async getOverallStats(coachId) {
    try {
      // Total campaigns
      const { count: totalCampaigns } = await this.db.supabase
        .from('scrape_campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', coachId)

      // Active campaigns
      const { count: activeCampaigns } = await this.db.supabase
        .from('scrape_campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('status', 'active')

      // Total warm-up leads with campaign
      const { count: totalWarmUp } = await this.db.supabase
        .from('warm_up_leads')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .not('campaign_id', 'is', null)

      // Total converted leads with campaign
      const { count: totalConverted } = await this.db.supabase
        .from('call_leads')
        .select('id', { count: 'exact', head: true })
        .not('campaign_id', 'is', null)
        .is('deleted_at', null)

      return {
        totalCampaigns: totalCampaigns || 0,
        activeCampaigns: activeCampaigns || 0,
        totalWarmUpLeads: totalWarmUp || 0,
        totalConvertedLeads: totalConverted || 0,
        overallConversionRate: totalWarmUp > 0 
          ? Math.round((totalConverted / totalWarmUp) * 100) 
          : 0
      }
    } catch (error) {
      console.error('❌ Get overall stats failed:', error)
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalWarmUpLeads: 0,
        totalConvertedLeads: 0,
        overallConversionRate: 0
      }
    }
  }
}

// Singleton export
const campaignTrackingService = new CampaignTrackingService()
export default campaignTrackingService
