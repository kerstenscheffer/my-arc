// src/modules/lead-analytics/LeadAnalyticsService.js
// VERSION 1.0 - COMBINED KANBAN + DM CONVERSATION ANALYTICS
// Provides metrics for both manual kanban flow and automated DM conversations

class LeadAnalyticsService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
  }

  // ========================================
  // KANBAN FLOW ANALYTICS
  // ========================================

  /**
   * Get lead distribution across all sections
   */
  async getSectionDistribution(coachId) {
    try {
      const { data: sections, error: sectionsError } = await this.supabase
        .from('lead_sections')
        .select('id, title, color')
        .eq('coach_id', coachId)
        .order('position', { ascending: true })

      if (sectionsError) throw sectionsError

      const { data: sectionItems, error: itemsError } = await this.supabase
        .from('lead_section_items')
        .select('section_id, lead_id')

      if (itemsError) throw itemsError

      const distribution = (sections || []).map(section => {
        const count = (sectionItems || []).filter(item => item.section_id === section.id).length
        return {
          section_id: section.id,
          section_name: section.title,
          color: section.color,
          lead_count: count
        }
      })

      const total = distribution.reduce((sum, s) => sum + s.lead_count, 0)

      return {
        sections: distribution,
        total_leads: total
      }
    } catch (error) {
      console.error('❌ Get section distribution failed:', error)
      return { sections: [], total_leads: 0 }
    }
  }

  /**
   * Get stale section metrics (1 day, 2 days, 3+ days)
   */
  async getStaleMetrics(coachId) {
    try {
      const { data: sections, error: sectionsError } = await this.supabase
        .from('lead_sections')
        .select('id, title, color')
        .eq('coach_id', coachId)

      if (sectionsError) throw sectionsError

      const staleSections = {
        day1: (sections || []).find(s => s.title.toLowerCase().includes('1 dag')),
        day2: (sections || []).find(s => s.title.toLowerCase().includes('2 dag')),
        day3: (sections || []).find(s => s.title.toLowerCase().includes('3+'))
      }

      const { data: sectionItems } = await this.supabase
        .from('lead_section_items')
        .select('section_id, lead_id')

      const metrics = {
        day1: {
          section: staleSections.day1,
          count: staleSections.day1 
            ? (sectionItems || []).filter(item => item.section_id === staleSections.day1.id).length 
            : 0
        },
        day2: {
          section: staleSections.day2,
          count: staleSections.day2 
            ? (sectionItems || []).filter(item => item.section_id === staleSections.day2.id).length 
            : 0
        },
        day3: {
          section: staleSections.day3,
          count: staleSections.day3 
            ? (sectionItems || []).filter(item => item.section_id === staleSections.day3.id).length 
            : 0
        }
      }

      const totalStale = metrics.day1.count + metrics.day2.count + metrics.day3.count

      return {
        ...metrics,
        total_stale: totalStale
      }
    } catch (error) {
      console.error('❌ Get stale metrics failed:', error)
      return {
        day1: { section: null, count: 0 },
        day2: { section: null, count: 0 },
        day3: { section: null, count: 0 },
        total_stale: 0
      }
    }
  }

  /**
   * Get today's section movements
   */
  async getTodaySectionMovements(coachId) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      const { data: movements, error } = await this.supabase
        .from('lead_movements')
        .select('*')
        .gte('moved_at', todayISO)
        .order('moved_at', { ascending: false })

      if (error) throw error

      const movementsBySection = {}
      let totalMovements = 0

      ;(movements || []).forEach(mov => {
        const toSection = mov.to_section_title || 'Unknown'
        
        if (!movementsBySection[toSection]) {
          movementsBySection[toSection] = {
            section_name: toSection,
            count: 0,
            leads: []
          }
        }
        
        movementsBySection[toSection].count++
        movementsBySection[toSection].leads.push({
          name: mov.lead_name || 'Unknown',
          from: mov.from_section_title || 'Niet toegewezen',
          time: new Date(mov.moved_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        })
        
        totalMovements++
      })

      const topMovements = Object.values(movementsBySection)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        total_movements: totalMovements,
        movements_by_section: movementsBySection,
        top_movements: topMovements
      }
    } catch (error) {
      console.error('❌ Get today section movements failed:', error)
      return {
        total_movements: 0,
        movements_by_section: {},
        top_movements: []
      }
    }
  }

  // ========================================
  // DM CONVERSATION ANALYTICS - PERFORMANCE FOCUS
  // ========================================

  /**
   * Get today's DM activity
   */
  async getTodayDMActivity(coachId) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      // Messages sent today (approximate from new conversations)
      const { data: todayConversations, error: convError } = await this.supabase
        .from('dm_conversations')
        .select('messages_sent, started_at')
        .eq('coach_id', coachId)
        .gte('started_at', todayISO)

      if (convError) throw convError

      const messagesSent = (todayConversations || []).reduce((sum, conv) => sum + (conv.messages_sent || 0), 0)

      // New leads today (from call_leads)
      const { data: todayLeads, error: leadsError } = await this.supabase
        .from('call_leads')
        .select('id')
        .or(`coach_id.eq.${coachId},coach_id.is.null`)
        .gte('created_at', todayISO)
        .is('deleted_at', null)

      if (leadsError) throw leadsError

      // Calls scheduled today (from lead_movements to "Call Ingepland" section)
      const { data: sections } = await this.supabase
        .from('lead_sections')
        .select('id, title')
        .eq('coach_id', coachId)

      const callSections = (sections || []).filter(s => 
        s.title.toLowerCase().includes('call') && 
        s.title.toLowerCase().includes('ingepland')
      )

      const { data: todayCallMovements } = await this.supabase
        .from('lead_movements')
        .select('id')
        .in('to_section_id', callSections.map(s => s.id))
        .gte('moved_at', todayISO)

      return {
        messages_sent: messagesSent,
        new_leads: (todayLeads || []).length,
        calls_scheduled: (todayCallMovements || []).length,
        date: today
      }
    } catch (error) {
      console.error('❌ Get today DM activity failed:', error)
      return {
        messages_sent: 0,
        new_leads: 0,
        calls_scheduled: 0,
        date: new Date()
      }
    }
  }

  /**
   * Get this week's DM activity
   */
  async getWeekDMActivity(coachId) {
    try {
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0)
      const weekStartISO = weekStart.toISOString()

      const { data: weekConversations, error: convError } = await this.supabase
        .from('dm_conversations')
        .select('messages_sent, started_at')
        .eq('coach_id', coachId)
        .gte('started_at', weekStartISO)

      if (convError) throw convError

      const messagesSent = (weekConversations || []).reduce((sum, conv) => sum + (conv.messages_sent || 0), 0)

      const { data: weekLeads, error: leadsError } = await this.supabase
        .from('call_leads')
        .select('id')
        .or(`coach_id.eq.${coachId},coach_id.is.null`)
        .gte('created_at', weekStartISO)
        .is('deleted_at', null)

      if (leadsError) throw leadsError

      const { data: sections } = await this.supabase
        .from('lead_sections')
        .select('id, title')
        .eq('coach_id', coachId)

      const callSections = (sections || []).filter(s => 
        s.title.toLowerCase().includes('call') && 
        s.title.toLowerCase().includes('ingepland')
      )

      const { data: weekCallMovements } = await this.supabase
        .from('lead_movements')
        .select('id')
        .in('to_section_id', callSections.map(s => s.id))
        .gte('moved_at', weekStartISO)

      return {
        messages_sent: messagesSent,
        new_leads: (weekLeads || []).length,
        calls_scheduled: (weekCallMovements || []).length,
        week_start: weekStart
      }
    } catch (error) {
      console.error('❌ Get week DM activity failed:', error)
      return {
        messages_sent: 0,
        new_leads: 0,
        calls_scheduled: 0,
        week_start: new Date()
      }
    }
  }

  /**
   * Analyze conversation paths for performance
   * Returns paths grouped by patterns with conversion rates
   */
  async getPathPerformance(coachId) {
    try {
      const { data: conversations, error } = await this.supabase
        .from('dm_conversations')
        .select('conversation_path, current_phase, lead_id')
        .eq('coach_id', coachId)

      if (error) throw error

      // Get leads that reached "Call Ingepland"
      const { data: sections } = await this.supabase
        .from('lead_sections')
        .select('id, title')
        .eq('coach_id', coachId)

      const callSections = (sections || []).filter(s => 
        s.title.toLowerCase().includes('call') && 
        s.title.toLowerCase().includes('ingepland')
      )

      const { data: callLeads } = await this.supabase
        .from('lead_section_items')
        .select('lead_id')
        .in('section_id', callSections.map(s => s.id))

      const callLeadIds = new Set((callLeads || []).map(item => item.lead_id))

      // Analyze paths
      const pathStats = {}

      ;(conversations || []).forEach(conv => {
        const path = conv.conversation_path || []
        if (path.length === 0) return

        // Full path as key
        const pathKey = path.join(' → ')
        
        if (!pathStats[pathKey]) {
          pathStats[pathKey] = {
            path: pathKey,
            nodes: path,
            count: 0,
            calls_scheduled: 0,
            conversion_rate: 0
          }
        }

        pathStats[pathKey].count++
        if (callLeadIds.has(conv.lead_id)) {
          pathStats[pathKey].calls_scheduled++
        }
      })

      // Calculate conversion rates
      Object.values(pathStats).forEach(stat => {
        stat.conversion_rate = stat.count > 0 
          ? Math.round((stat.calls_scheduled / stat.count) * 100)
          : 0
      })

      // Sort by performance (conversion rate * volume)
      const sortedPaths = Object.values(pathStats)
        .sort((a, b) => {
          const scoreA = a.conversion_rate * a.count
          const scoreB = b.conversion_rate * b.count
          return scoreB - scoreA
        })

      return {
        paths: sortedPaths,
        total_paths: sortedPaths.length,
        best_path: sortedPaths[0] || null
      }
    } catch (error) {
      console.error('❌ Get path performance failed:', error)
      return {
        paths: [],
        total_paths: 0,
        best_path: null
      }
    }
  }

  /**
   * Get node-level performance (individual message effectiveness)
   */
  async getNodePerformance(coachId) {
    try {
      const { data: conversations, error } = await this.supabase
        .from('dm_conversations')
        .select('conversation_path, current_phase, lead_id')
        .eq('coach_id', coachId)

      if (error) throw error

      const { data: sections } = await this.supabase
        .from('lead_sections')
        .select('id, title')
        .eq('coach_id', coachId)

      const callSections = (sections || []).filter(s => 
        s.title.toLowerCase().includes('call') && 
        s.title.toLowerCase().includes('ingepland')
      )

      const { data: callLeads } = await this.supabase
        .from('lead_section_items')
        .select('lead_id')
        .in('section_id', callSections.map(s => s.id))

      const callLeadIds = new Set((callLeads || []).map(item => item.lead_id))

      // Track each node appearance
      const nodeStats = {}

      ;(conversations || []).forEach(conv => {
        const path = conv.conversation_path || []
        const hasCall = callLeadIds.has(conv.lead_id)

        path.forEach(node => {
          if (!nodeStats[node]) {
            nodeStats[node] = {
              node_name: node,
              appearances: 0,
              led_to_call: 0,
              conversion_rate: 0
            }
          }

          nodeStats[node].appearances++
          if (hasCall) {
            nodeStats[node].led_to_call++
          }
        })
      })

      // Calculate rates
      Object.values(nodeStats).forEach(stat => {
        stat.conversion_rate = stat.appearances > 0
          ? Math.round((stat.led_to_call / stat.appearances) * 100)
          : 0
      })

      const sortedNodes = Object.values(nodeStats)
        .sort((a, b) => b.conversion_rate - a.conversion_rate)

      return {
        nodes: sortedNodes,
        best_node: sortedNodes[0] || null,
        worst_node: sortedNodes[sortedNodes.length - 1] || null
      }
    } catch (error) {
      console.error('❌ Get node performance failed:', error)
      return {
        nodes: [],
        best_node: null,
        worst_node: null
      }
    }
  }

  /**
   * Get phase conversion rates (opening → waarde → call_admin → call)
   */
  async getPhaseConversion(coachId) {
    try {
      const { data: conversations, error } = await this.supabase
        .from('dm_conversations')
        .select('current_phase, lead_id')
        .eq('coach_id', coachId)

      if (error) throw error

      const { data: sections } = await this.supabase
        .from('lead_sections')
        .select('id, title')
        .eq('coach_id', coachId)

      const callSections = (sections || []).filter(s => 
        s.title.toLowerCase().includes('call') && 
        s.title.toLowerCase().includes('ingepland')
      )

      const { data: callLeads } = await this.supabase
        .from('lead_section_items')
        .select('lead_id')
        .in('section_id', callSections.map(s => s.id))

      const callLeadIds = new Set((callLeads || []).map(item => item.lead_id))

      // Count by phase
      const phaseCounts = {
        opening: { total: 0, converted: 0, rate: 0 },
        waarde: { total: 0, converted: 0, rate: 0 },
        qualify: { total: 0, converted: 0, rate: 0 },
        call_admin: { total: 0, converted: 0, rate: 0 },
        call_push: { total: 0, converted: 0, rate: 0 }
      }

      ;(conversations || []).forEach(conv => {
        const phase = conv.current_phase
        if (phaseCounts[phase]) {
          phaseCounts[phase].total++
          if (callLeadIds.has(conv.lead_id)) {
            phaseCounts[phase].converted++
          }
        }
      })

      // Calculate rates
      Object.values(phaseCounts).forEach(phase => {
        phase.rate = phase.total > 0
          ? Math.round((phase.converted / phase.total) * 100)
          : 0
      })

      return phaseCounts
    } catch (error) {
      console.error('❌ Get phase conversion failed:', error)
      return {
        opening: { total: 0, converted: 0, rate: 0 },
        waarde: { total: 0, converted: 0, rate: 0 },
        qualify: { total: 0, converted: 0, rate: 0 },
        call_admin: { total: 0, converted: 0, rate: 0 },
        call_push: { total: 0, converted: 0, rate: 0 }
      }
    }
  }

  /**
   * Get phase distribution for DM conversations
   */
  async getDMPhaseDistribution(coachId) {
    try {
      const { data: conversations, error } = await this.supabase
        .from('dm_conversations')
        .select('current_phase, messages_sent')
        .eq('coach_id', coachId)

      if (error) throw error

      const distribution = {}
      let totalConversations = 0
      let totalMessages = 0

      ;(conversations || []).forEach(conv => {
        const phase = conv.current_phase || 'unknown'
        
        if (!distribution[phase]) {
          distribution[phase] = {
            phase_name: phase,
            count: 0,
            total_messages: 0,
            avg_messages: 0
          }
        }
        
        distribution[phase].count++
        distribution[phase].total_messages += conv.messages_sent || 0
        totalConversations++
        totalMessages += conv.messages_sent || 0
      })

      // Calculate averages
      Object.values(distribution).forEach(phase => {
        phase.avg_messages = phase.count > 0 
          ? Math.round(phase.total_messages / phase.count * 10) / 10 
          : 0
      })

      const phases = Object.values(distribution)
        .sort((a, b) => b.count - a.count)

      return {
        phases,
        total_conversations: totalConversations,
        total_messages: totalMessages,
        avg_messages_per_conversation: totalConversations > 0 
          ? Math.round(totalMessages / totalConversations * 10) / 10 
          : 0
      }
    } catch (error) {
      console.error('❌ Get DM phase distribution failed:', error)
      return {
        phases: [],
        total_conversations: 0,
        total_messages: 0,
        avg_messages_per_conversation: 0
      }
    }
  }

  /**
   * Get conversation depth analysis (path length)
   */
  async getConversationDepth(coachId) {
    try {
      const { data: conversations, error } = await this.supabase
        .from('dm_conversations')
        .select('conversation_path')
        .eq('coach_id', coachId)

      if (error) throw error

      const depths = (conversations || []).map(conv => {
        const path = conv.conversation_path || []
        return Array.isArray(path) ? path.length : 0
      })

      const avgDepth = depths.length > 0 
        ? Math.round(depths.reduce((sum, d) => sum + d, 0) / depths.length * 10) / 10 
        : 0

      const maxDepth = depths.length > 0 ? Math.max(...depths) : 0
      const minDepth = depths.length > 0 ? Math.min(...depths) : 0

      // Distribution
      const distribution = {
        shallow: depths.filter(d => d <= 2).length,    // 1-2 nodes
        medium: depths.filter(d => d > 2 && d <= 5).length,  // 3-5 nodes
        deep: depths.filter(d => d > 5).length         // 6+ nodes
      }

      return {
        avg_depth: avgDepth,
        max_depth: maxDepth,
        min_depth: minDepth,
        distribution
      }
    } catch (error) {
      console.error('❌ Get conversation depth failed:', error)
      return {
        avg_depth: 0,
        max_depth: 0,
        min_depth: 0,
        distribution: { shallow: 0, medium: 0, deep: 0 }
      }
    }
  }

  /**
   * Get time tracking per phase (in hours)
   */
  async getPhaseTimeTracking(coachId) {
    try {
      const { data: conversations, error } = await this.supabase
        .from('dm_conversations')
        .select('current_phase, time_in_opening, time_in_qualify, time_in_call_push, time_in_bezwaar')
        .eq('coach_id', coachId)

      if (error) throw error

      const timeTracking = {
        opening: { total_seconds: 0, count: 0, avg_hours: 0 },
        qualify: { total_seconds: 0, count: 0, avg_hours: 0 },
        call_push: { total_seconds: 0, count: 0, avg_hours: 0 },
        bezwaar: { total_seconds: 0, count: 0, avg_hours: 0 }
      }

      ;(conversations || []).forEach(conv => {
        if (conv.time_in_opening > 0) {
          timeTracking.opening.total_seconds += conv.time_in_opening
          timeTracking.opening.count++
        }
        if (conv.time_in_qualify > 0) {
          timeTracking.qualify.total_seconds += conv.time_in_qualify
          timeTracking.qualify.count++
        }
        if (conv.time_in_call_push > 0) {
          timeTracking.call_push.total_seconds += conv.time_in_call_push
          timeTracking.call_push.count++
        }
        if (conv.time_in_bezwaar > 0) {
          timeTracking.bezwaar.total_seconds += conv.time_in_bezwaar
          timeTracking.bezwaar.count++
        }
      })

      // Calculate average hours
      Object.values(timeTracking).forEach(phase => {
        if (phase.count > 0) {
          phase.avg_hours = Math.round(phase.total_seconds / phase.count / 3600 * 10) / 10
        }
      })

      return timeTracking
    } catch (error) {
      console.error('❌ Get phase time tracking failed:', error)
      return {
        opening: { total_seconds: 0, count: 0, avg_hours: 0 },
        qualify: { total_seconds: 0, count: 0, avg_hours: 0 },
        call_push: { total_seconds: 0, count: 0, avg_hours: 0 },
        bezwaar: { total_seconds: 0, count: 0, avg_hours: 0 }
      }
    }
  }

  // ========================================
  // COMBINED ANALYTICS
  // ========================================

  /**
   * Get complete funnel from all leads to sales
   */
  async getCompleteFunnel(coachId) {
    try {
      // Total leads in system
      const { data: allLeads, error: leadsError } = await this.supabase
        .from('call_leads')
        .select('id')
        .or(`coach_id.eq.${coachId},coach_id.is.null`)
        .is('deleted_at', null)

      if (leadsError) throw leadsError

      // Leads in DM conversations
      const { data: dmConversations, error: dmError } = await this.supabase
        .from('dm_conversations')
        .select('lead_id')
        .eq('coach_id', coachId)

      if (dmError) throw dmError

      // Leads with call scheduled (via section)
      const { data: sections } = await this.supabase
        .from('lead_sections')
        .select('id, title')
        .eq('coach_id', coachId)

      const callSections = (sections || []).filter(s => 
        s.title.toLowerCase().includes('call') && 
        s.title.toLowerCase().includes('ingepland')
      )

      const { data: callLeads } = await this.supabase
        .from('lead_section_items')
        .select('lead_id')
        .in('section_id', callSections.map(s => s.id))

      // Leads with sale (via section)
      const saleSections = (sections || []).filter(s => 
        s.title.toLowerCase().includes('sale') &&
        !s.title.toLowerCase().includes('uitstel')
      )

      const { data: saleLeads } = await this.supabase
        .from('lead_section_items')
        .select('lead_id')
        .in('section_id', saleSections.map(s => s.id))

      const funnel = {
        total_leads: (allLeads || []).length,
        in_dm_conversations: (dmConversations || []).length,
        calls_scheduled: (callLeads || []).length,
        sales: (saleLeads || []).length
      }

      // Calculate conversion rates
      funnel.dm_conversion_rate = funnel.total_leads > 0 
        ? Math.round((funnel.in_dm_conversations / funnel.total_leads) * 100) 
        : 0

      funnel.call_conversion_rate = funnel.in_dm_conversations > 0 
        ? Math.round((funnel.calls_scheduled / funnel.in_dm_conversations) * 100) 
        : 0

      funnel.sales_conversion_rate = funnel.calls_scheduled > 0 
        ? Math.round((funnel.sales / funnel.calls_scheduled) * 100) 
        : 0

      funnel.overall_conversion_rate = funnel.total_leads > 0 
        ? Math.round((funnel.sales / funnel.total_leads) * 100) 
        : 0

      return funnel
    } catch (error) {
      console.error('❌ Get complete funnel failed:', error)
      return {
        total_leads: 0,
        in_dm_conversations: 0,
        calls_scheduled: 0,
        sales: 0,
        dm_conversion_rate: 0,
        call_conversion_rate: 0,
        sales_conversion_rate: 0,
        overall_conversion_rate: 0
      }
    }
  }

  /**
   * Get overview stats for dashboard summary
   */
  async getOverviewStats(coachId, days = 7) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      const cutoffISO = cutoffDate.toISOString()

      const [
        sectionDist,
        staleMetrics,
        dmPhases,
        funnel
      ] = await Promise.all([
        this.getSectionDistribution(coachId),
        this.getStaleMetrics(coachId),
        this.getDMPhaseDistribution(coachId),
        this.getCompleteFunnel(coachId)
      ])

      return {
        total_leads: funnel.total_leads,
        active_conversations: dmPhases.total_conversations,
        calls_scheduled: funnel.calls_scheduled,
        sales: funnel.sales,
        stale_leads: staleMetrics.total_stale,
        overall_conversion: funnel.overall_conversion_rate
      }
    } catch (error) {
      console.error('❌ Get overview stats failed:', error)
      return {
        total_leads: 0,
        active_conversations: 0,
        calls_scheduled: 0,
        sales: 0,
        stale_leads: 0,
        overall_conversion: 0
      }
    }
  }
}

export default LeadAnalyticsService
