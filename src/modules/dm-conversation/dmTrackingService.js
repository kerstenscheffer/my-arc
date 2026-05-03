// src/modules/dm-conversation/services/dmTrackingService.js
// Service for tracking DM conversation progress in database

import DatabaseService from '../../services/DatabaseService'

class DMTrackingService {
  constructor() {
    this.db = DatabaseService
  }

  /**
   * Update lead's current DM node and add to history
   * @param {string} leadId - Lead UUID
   * @param {string} nodeId - Current conversation node (e.g. 'call_push_soft')
   * @param {Object} metadata - Optional metadata (section moved to, variant sent, etc)
   * @returns {Promise<Object>} - Updated lead data
   */
  async updateCurrentNode(leadId, nodeId, metadata = {}) {
    try {
      console.log(`📝 Updating DM node for lead ${leadId}:`, nodeId)
      
      // 1. Get current lead data to preserve history
      const { data: currentLead, error: fetchError } = await this.db.supabase
        .from('call_leads')
        .select('dm_node_history, dm_messages_sent')
        .eq('id', leadId)
        .single()
      
      if (fetchError) throw fetchError
      
      // 2. Build history entry
      const historyEntry = {
        node: nodeId,
        timestamp: new Date().toISOString(),
        ...metadata
      }
      
      // 3. Append to history array (preserve existing history)
      const currentHistory = currentLead?.dm_node_history || []
      const updatedHistory = [...currentHistory, historyEntry]
      
      // 4. Update lead record
      const { data, error } = await this.db.supabase
        .from('call_leads')
        .update({
          current_dm_node: nodeId,
          dm_node_history: updatedHistory,
          last_dm_interaction: new Date().toISOString(),
          dm_messages_sent: (currentLead?.dm_messages_sent || 0) + 1,
          last_touched: new Date().toISOString() // Also update general last_touched
        })
        .eq('id', leadId)
        .select()
        .single()
      
      if (error) throw error
      
      console.log(`✅ DM node updated:`, {
        leadId,
        node: nodeId,
        totalMessages: data.dm_messages_sent,
        historyLength: updatedHistory.length
      })
      
      return {
        success: true,
        lead: data,
        historyEntry
      }
      
    } catch (error) {
      console.error('❌ Update DM node failed:', error)
      throw error
    }
  }

  /**
   * Log detailed conversation history (optional separate table)
   * Use this if you want granular analytics beyond the JSONB array
   * @param {Object} historyData - Complete history entry data
   */
  async logConversationHistory(historyData) {
    try {
      const {
        leadId,
        nodeId,
        nodeCategory,
        messageVariant = 0,
        movedToSectionId = null,
        movedToSectionTitle = null,
        previousSectionId = null,
        previousSectionTitle = null,
        coachId = null
      } = historyData
      
      // Only log if dm_conversation_history table exists
      // This is optional - basic tracking works without it
      const { data, error } = await this.db.supabase
        .from('dm_conversation_history')
        .insert({
          lead_id: leadId,
          node_id: nodeId,
          node_category: nodeCategory,
          message_variant: messageVariant,
          sent_at: new Date().toISOString(),
          moved_to_section_id: movedToSectionId,
          moved_to_section_title: movedToSectionTitle,
          previous_section_id: previousSectionId,
          previous_section_title: previousSectionTitle,
          coach_id: coachId
        })
        .select()
        .single()
      
      if (error) {
        // Table might not exist - that's ok
        console.log('ℹ️ dm_conversation_history table not available (optional)')
        return null
      }
      
      console.log('✅ Conversation history logged:', data.id)
      return data
      
    } catch (error) {
      // Fail silently - this is optional
      console.log('ℹ️ Conversation history logging skipped:', error.message)
      return null
    }
  }

  /**
   * Get lead's conversation history
   * @param {string} leadId - Lead UUID
   * @returns {Promise<Array>} - Array of history entries
   */
  async getLeadHistory(leadId) {
    try {
      const { data, error } = await this.db.supabase
        .from('call_leads')
        .select('dm_node_history, current_dm_node, last_dm_interaction, dm_messages_sent')
        .eq('id', leadId)
        .single()
      
      if (error) throw error
      
      return {
        history: data?.dm_node_history || [],
        currentNode: data?.current_dm_node,
        lastInteraction: data?.last_dm_interaction,
        totalMessages: data?.dm_messages_sent || 0
      }
      
    } catch (error) {
      console.error('❌ Get lead history failed:', error)
      return {
        history: [],
        currentNode: null,
        lastInteraction: null,
        totalMessages: 0
      }
    }
  }

  /**
   * Get conversation stats for a lead
   * @param {string} leadId - Lead UUID
   * @returns {Promise<Object>} - Stats object
   */
  async getLeadConversationStats(leadId) {
    try {
      const historyData = await this.getLeadHistory(leadId)
      
      // Analyze history
      const nodesByCategory = {}
      const uniqueNodes = new Set()
      
      historyData.history.forEach(entry => {
        uniqueNodes.add(entry.node)
        // Count by category if available in metadata
        if (entry.category) {
          nodesByCategory[entry.category] = (nodesByCategory[entry.category] || 0) + 1
        }
      })
      
      // Calculate engagement metrics
      const firstInteraction = historyData.history[0]?.timestamp
      const lastInteraction = historyData.lastInteraction
      
      let daysSinceFirstContact = null
      if (firstInteraction) {
        const diff = new Date() - new Date(firstInteraction)
        daysSinceFirstContact = Math.floor(diff / (1000 * 60 * 60 * 24))
      }
      
      return {
        totalMessages: historyData.totalMessages,
        uniqueNodesVisited: uniqueNodes.size,
        currentNode: historyData.currentNode,
        nodesByCategory,
        firstInteraction,
        lastInteraction,
        daysSinceFirstContact,
        conversationPath: historyData.history.map(h => h.node)
      }
      
    } catch (error) {
      console.error('❌ Get conversation stats failed:', error)
      return {
        totalMessages: 0,
        uniqueNodesVisited: 0,
        currentNode: null,
        nodesByCategory: {},
        conversationPath: []
      }
    }
  }

  /**
   * Mark response received from lead (for analytics)
   * @param {string} leadId - Lead UUID
   * @returns {Promise<boolean>}
   */
  async markResponseReceived(leadId) {
    try {
      // Try to update dm_conversation_history if it exists
      const { data: latestHistory } = await this.db.supabase
        .from('dm_conversation_history')
        .select('id')
        .eq('lead_id', leadId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (latestHistory) {
        await this.db.supabase
          .from('dm_conversation_history')
          .update({
            response_received: true,
            response_received_at: new Date().toISOString()
          })
          .eq('id', latestHistory.id)
        
        console.log('✅ Response marked for history entry:', latestHistory.id)
      }
      
      return true
      
    } catch (error) {
      console.log('ℹ️ Response marking skipped:', error.message)
      return false
    }
  }

  /**
   * Get all leads at a specific conversation node
   * Useful for bulk operations or analytics
   * @param {string} nodeId - Node to filter by
   * @param {string} coachId - Coach UUID
   * @returns {Promise<Array>} - Array of leads
   */
  async getLeadsByNode(nodeId, coachId) {
    try {
      const { data, error } = await this.db.supabase
        .from('call_leads')
        .select('id, first_name, last_name, current_dm_node, last_dm_interaction, dm_messages_sent')
        .eq('current_dm_node', nodeId)
        .or(`coach_id.eq.${coachId},coach_id.is.null`)
        .is('deleted_at', null)
        .order('last_dm_interaction', { ascending: false })
      
      if (error) throw error
      
      console.log(`📊 Found ${data?.length || 0} leads at node "${nodeId}"`)
      return data || []
      
    } catch (error) {
      console.error('❌ Get leads by node failed:', error)
      return []
    }
  }

  /**
   * Reset lead's conversation (start over)
   * @param {string} leadId - Lead UUID
   * @returns {Promise<boolean>}
   */
  async resetConversation(leadId) {
    try {
      const { error } = await this.db.supabase
        .from('call_leads')
        .update({
          current_dm_node: null,
          // Keep history for analytics, just clear current state
          last_dm_interaction: new Date().toISOString()
        })
        .eq('id', leadId)
      
      if (error) throw error
      
      console.log('✅ Conversation reset for lead:', leadId)
      return true
      
    } catch (error) {
      console.error('❌ Reset conversation failed:', error)
      return false
    }
  }

  /**
   * Get conversation analytics for coach dashboard
   * @param {string} coachId - Coach UUID
   * @param {number} days - Days to look back (default 7)
   * @returns {Promise<Object>} - Analytics data
   */
  async getCoachConversationAnalytics(coachId, days = 7) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      // Get all leads with recent DM activity
      const { data: leads, error } = await this.db.supabase
        .from('call_leads')
        .select('id, current_dm_node, dm_messages_sent, last_dm_interaction, dm_node_history')
        .or(`coach_id.eq.${coachId},coach_id.is.null`)
        .gte('last_dm_interaction', cutoffDate.toISOString())
        .is('deleted_at', null)
      
      if (error) throw error
      
      // Analyze data
      const analytics = {
        totalConversations: leads?.length || 0,
        totalMessagesSent: 0,
        leadsPerNode: {},
        averageMessagesPerLead: 0,
        activeConversations: 0,
        completedConversations: 0
      }
      
      leads?.forEach(lead => {
        analytics.totalMessagesSent += lead.dm_messages_sent || 0
        
        const node = lead.current_dm_node
        if (node) {
          analytics.leadsPerNode[node] = (analytics.leadsPerNode[node] || 0) + 1
          
          // Check if conversation is at end state
          if (node.startsWith('end_')) {
            analytics.completedConversations++
          } else {
            analytics.activeConversations++
          }
        }
      })
      
      if (analytics.totalConversations > 0) {
        analytics.averageMessagesPerLead = 
          Math.round(analytics.totalMessagesSent / analytics.totalConversations)
      }
      
      console.log('📊 Conversation analytics:', analytics)
      return analytics
      
    } catch (error) {
      console.error('❌ Get conversation analytics failed:', error)
      return {
        totalConversations: 0,
        totalMessagesSent: 0,
        leadsPerNode: {},
        averageMessagesPerLead: 0,
        activeConversations: 0,
        completedConversations: 0
      }
    }
  }
}

// Export singleton instance
const dmTrackingService = new DMTrackingService()
export default dmTrackingService
