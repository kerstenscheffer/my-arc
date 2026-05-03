// src/modules/dm-conversation/utils/DMConversationService.js
// VERSION 3.1 - FIXED: Removed time_in_ columns that don't exist in database
// WITH MESSAGE VARIANT TRACKING

import { createClient } from '@supabase/supabase-js'
import { getNode, isEndNode, DECISION_TREE } from '../data/decisionTree'
import { detectPain, calculateTriggerScore } from './painDetection'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

class DMConversationService {
  constructor(db) {
    // Accept DatabaseService instance OR create new Supabase client
    if (db && db.supabase) {
      this.supabase = db.supabase
    } else {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey)
    }
  }

  // ========================================
  // PHASE TO SECTION MAPPING
  // ========================================
  PHASE_TO_SECTION_MAP = {
    'opening': 'dm_active',
    'qualify': 'dm_active',
    'call_push': 'call_push',
    'bezwaar': 'dm_active',
    'follow_up': 'follow_up_1',
    'end': {
      'call_booked': 'scheduled',
      'lost': 'lost',
      'follow_up': 'follow_up_1'
    }
  }

  // ========================================
  // PHASE TO MESSAGE CATEGORY MAPPING
  // ========================================
  PHASE_TO_CATEGORY_MAP = {
    'opening': 'opener',
    'qualify': 'qualify',
    'call_push': 'call_push',
    'bezwaar': 'bezwaar',
    'follow_up': 'follow_up',
    'waarde': 'waarde',
    'call_admin': 'call_admin',
    'end': 'end'
  }

  getSectionForPhase(phase, outcome = null) {
    if (phase === 'end' && outcome) {
      return this.PHASE_TO_SECTION_MAP.end[outcome] || 'dm_active'
    }
    return this.PHASE_TO_SECTION_MAP[phase] || 'dm_active'
  }

  getMessageCategory(phase, nodeId) {
    // Special handling for call_admin nodes
    if (nodeId && nodeId.startsWith('call_admin')) {
      return 'call_admin'
    }
    // Use phase to category mapping
    return this.PHASE_TO_CATEGORY_MAP[phase] || 'other'
  }

  // ========================================
  // 1. CONVERSATION CRUD
  // ========================================

  async getOrCreateConversation(leadId, coachId) {
    try {
      console.log('🔍 Getting conversation for lead:', leadId)
      
      // Check if conversation exists
      const { data: existing, error: fetchError } = await this.supabase
        .from('dm_conversations')
        .select('*')
        .eq('lead_id', leadId)
        .single()

      if (existing) {
        console.log('✅ Existing conversation found')
        return existing
      }

      // Create new conversation
      console.log('🆕 Creating new conversation')
      const { data: newConv, error: createError } = await this.supabase
        .from('dm_conversations')
        .insert({
          lead_id: leadId,
          coach_id: coachId,
          current_node_id: 'start',
          conversation_path: ['start'],
          current_phase: 'opening',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError

      console.log('✅ New conversation created:', newConv.id)
      return newConv

    } catch (error) {
      console.error('❌ Get/Create conversation failed:', error)
      throw error
    }
  }

  async updateConversation(conversationId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('dm_conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single()

      if (error) throw error
      return data

    } catch (error) {
      console.error('❌ Update conversation failed:', error)
      throw error
    }
  }

  async getConversationMessages(conversationId) {
    try {
      const { data, error } = await this.supabase
        .from('dm_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true })

      if (error) throw error
      return data || []

    } catch (error) {
      console.error('❌ Get messages failed:', error)
      return []
    }
  }

  // ========================================
  // 2. MESSAGE LOGGING (WITH VARIANTS)
  // ========================================

  async logMessage(conversationId, leadId, messageData) {
    try {
      const insertData = {
        conversation_id: conversationId,
        lead_id: leadId,
        node_id: messageData.nodeId,
        phase: messageData.phase,
        message_text: messageData.text,
        sent_by: messageData.sentBy || 'coach',
        pain_detected: messageData.painDetected || false,
        pain_score: messageData.painScore || 0,
        pain_keywords: messageData.painKeywords || [],
        sent_at: new Date().toISOString()
      }

      // Add variant tracking if available
      if (messageData.variantId) {
        insertData.variant_id = messageData.variantId
        insertData.variant_tone = messageData.variantTone
        insertData.variant_icon = messageData.variantIcon
        insertData.message_category = messageData.messageCategory

        console.log('📊 Logging message with variant:', {
          id: messageData.variantId,
          tone: messageData.variantTone,
          category: messageData.messageCategory
        })
      }

      const { data, error } = await this.supabase
        .from('dm_messages')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Message logged:', data.id)
      return data

    } catch (error) {
      console.error('❌ Log message failed:', error)
      throw error
    }
  }

  // ========================================
  // 3. NAVIGATION & STATE (WITH VARIANT SUPPORT)
  // ========================================

  async navigateToNode(conversationId, leadId, nodeId, coachId, leadSectionId, selectedVariantId = null) {
    try {
      console.log('🧭 navigateToNode called with:', {
        conversationId,
        leadId,
        nodeId,
        coachId,
        leadSectionId,
        selectedVariantId
      })
      
      // Get node data from decision tree
      const node = getNode(DECISION_TREE, nodeId)
      if (!node) {
        throw new Error(`Node ${nodeId} not found in decision tree`)
      }

      console.log('✅ Node found:', node.label)

      // Get current conversation
      const { data: conversation, error: fetchError } = await this.supabase
        .from('dm_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (fetchError) throw fetchError

      console.log('✅ Current conversation loaded')

      // Update conversation path and phase
      const newPath = [...(conversation.conversation_path || []), nodeId]
      const newPhase = node.phase || conversation.current_phase

      console.log('📊 Phase transition:', conversation.current_phase, '→', newPhase)

      // REMOVED: time_in_ phase tracking (columns don't exist in database)
      // This was causing the PGRST204 error

      // Prepare conversation updates
      const updates = {
        current_node_id: nodeId,
        conversation_path: newPath,
        current_phase: newPhase,
        last_message_at: new Date().toISOString(),
        messages_sent: (conversation.messages_sent || 0) + 1
      }

      // Handle end nodes
      if (isEndNode(nodeId)) {
        updates.outcome = node.outcome
        updates.outcome_at = new Date().toISOString()
        
        if (node.outcome === 'call_booked') {
          updates.call_booked_at = new Date().toISOString()
        }

        console.log('🏁 END NODE reached. Outcome:', node.outcome)
      }

      // Update conversation in database
      await this.updateConversation(conversationId, updates)
      console.log('✅ Conversation updated in database')

      // Extract variant data if selected
      let variantData = null
      let messageText = node.question || node.message || 'Node navigated'

      if (selectedVariantId && node.message?.variants) {
        const variant = node.message.variants.find(v => v.id === selectedVariantId)
        if (variant) {
          variantData = {
            variantId: variant.id,
            variantTone: variant.tone,
            variantIcon: variant.icon,
            messageCategory: this.getMessageCategory(newPhase, nodeId)
          }
          messageText = variant.text
          console.log('✅ Variant selected:', variant.tone)
        }
      }

      // Log message to dm_messages table (WITH VARIANT DATA)
      await this.logMessage(conversationId, leadId, {
        nodeId: nodeId,
        phase: newPhase,
        text: messageText,
        sentBy: 'coach',
        ...variantData
      })

      console.log('✅ Message logged to dm_messages')

      // Check if we need to transition sections
      let sectionTransitioned = false
      let newSectionId = null

      const shouldTransition = this.shouldTransitionSection(conversation.current_phase, newPhase, node)
      
      if (shouldTransition && leadSectionId) {
        newSectionId = this.getSectionForPhase(newPhase, node.outcome)
        console.log('🔄 Section transition triggered:', leadSectionId, '→', newSectionId)
        
        try {
          await this.transitionLeadSection(
            leadId,
            conversationId,
            leadSectionId,
            newSectionId,
            nodeId,
            conversation.call_trigger_score || 0,
            coachId
          )
          sectionTransitioned = true
          console.log('✅ Section transition complete')
        } catch (transError) {
          console.error('⚠️ Section transition failed (non-fatal):', transError)
        }
      }

      // Return comprehensive result
      return { 
        node, 
        conversation: { ...conversation, ...updates },
        sectionTransitioned,
        newSectionId,
        variantUsed: variantData
      }

    } catch (error) {
      console.error('❌ Navigate to node failed:', error)
      throw error
    }
  }

  shouldTransitionSection(oldPhase, newPhase, node) {
    // Transition when phase changes or end node reached
    if (oldPhase !== newPhase) return true
    if (isEndNode(node.id)) return true
    return false
  }

  // ========================================
  // 4. SECTION TRANSITIONS
  // ========================================

  async transitionLeadSection(leadId, conversationId, fromSectionId, toSectionId, triggerNode, triggerScore, coachId) {
    try {
      console.log(`🔄 Transitioning lead ${leadId}:`, fromSectionId, '→', toSectionId)

      // Get section details
      const sections = await this.getKanbanSections(coachId)
      const fromSection = sections.find(s => s.id === fromSectionId)
      const toSection = sections.find(s => s.id === toSectionId)

      if (!toSection) {
        console.warn('⚠️ Target section not found:', toSectionId)
        return
      }

      // Update lead section in call_leads
      const { error: updateError } = await this.supabase
        .from('call_leads')
        .update({
          section_id: toSectionId,
          previous_section_id: fromSectionId,
          previous_section_title: fromSection?.title,
          previous_section_color: fromSection?.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      console.log('✅ Lead section updated in call_leads')

      // Log transition
      await this.logSectionTransition(
        conversationId,
        leadId,
        fromSectionId,
        toSectionId,
        fromSection?.title,
        toSection.title,
        triggerNode,
        triggerScore
      )

      console.log('✅ Section transition complete')

    } catch (error) {
      console.error('❌ Transition section failed:', error)
      throw error
    }
  }

  async logSectionTransition(conversationId, leadId, fromSectionId, toSectionId, fromTitle, toTitle, triggerNode, triggerScore) {
    try {
      const { error } = await this.supabase
        .from('dm_section_transitions')
        .insert({
          conversation_id: conversationId,
          lead_id: leadId,
          from_section_id: fromSectionId,
          to_section_id: toSectionId,
          from_section_title: fromTitle,
          to_section_title: toTitle,
          trigger_type: 'message_sent',
          trigger_message_node: triggerNode,
          trigger_score: triggerScore,
          transitioned_at: new Date().toISOString()
        })

      if (error) throw error

      console.log('✅ Transition logged to dm_section_transitions')

    } catch (error) {
      console.error('❌ Log transition failed:', error)
    }
  }

  async getKanbanSections(coachId) {
    try {
      const { data, error } = await this.supabase
        .from('kanban_sections')
        .select('*')
        .eq('coach_id', coachId)
        .order('display_order', { ascending: true })

      if (error) throw error
      return data || []

    } catch (error) {
      console.error('❌ Get sections failed:', error)
      return []
    }
  }

  // ========================================
  // 5. PAIN DETECTION & SCORING
  // ========================================

  async updatePainDetection(conversationId, leadResponse) {
    try {
      const painResult = detectPain(leadResponse)
      
      if (painResult.detected) {
        console.log('🚨 PAIN DETECTED:', painResult)

        // Get current conversation
        const { data: conversation } = await this.supabase
          .from('dm_conversations')
          .select('*')
          .eq('id', conversationId)
          .single()

        // Update pain tracking
        await this.updateConversation(conversationId, {
          pain_detected: true,
          pain_count: (conversation.pain_count || 0) + 1,
          pain_triggers_hit: (conversation.pain_triggers_hit || 0) + painResult.triggers.length
        })

        // Recalculate trigger score
        await this.recalculateTriggerScore(conversationId)
      }

      return painResult

    } catch (error) {
      console.error('❌ Update pain detection failed:', error)
      return { detected: false, score: 0 }
    }
  }

  async recalculateTriggerScore(conversationId) {
    try {
      const { data: conversation } = await this.supabase
        .from('dm_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      const messages = await this.getConversationMessages(conversationId)

      const score = calculateTriggerScore(
        conversation.pain_count || 0,
        messages.length,
        conversation.lead_replies || 0,
        conversation.current_phase
      )

      await this.updateConversation(conversationId, {
        call_trigger_score: score
      })

      console.log('📊 Updated trigger score:', score)

    } catch (error) {
      console.error('❌ Recalculate score failed:', error)
    }
  }

  // ========================================
  // 6. ANALYTICS (WITH VARIANT ANALYTICS)
  // ========================================

  async getConversationAnalytics(coachId, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.supabase
        .from('dm_conversations')
        .select('*')
        .eq('coach_id', coachId)
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      const conversations = data || []

      // Calculate metrics
      const total = conversations.length
      const callsBooked = conversations.filter(c => c.outcome === 'call_booked').length
      const active = conversations.filter(c => !c.outcome).length
      const lost = conversations.filter(c => c.outcome === 'lost').length

      const avgMessagesToCall = conversations
        .filter(c => c.outcome === 'call_booked')
        .reduce((sum, c) => sum + c.messages_sent, 0) / (callsBooked || 1)

      const avgTimeToCall = conversations
        .filter(c => c.outcome === 'call_booked' && c.call_booked_at)
        .reduce((sum, c) => {
          const diff = new Date(c.call_booked_at) - new Date(c.started_at)
          return sum + (diff / 1000)
        }, 0) / (callsBooked || 1)

      // Profile breakdown
      const profiles = {
        dikker: conversations.filter(c => c.opening_profile === 'dikker').length,
        dunner: conversations.filter(c => c.opening_profile === 'dunner').length,
        sporter: conversations.filter(c => c.opening_profile === 'sporter').length,
        neutraal: conversations.filter(c => c.opening_profile === 'neutraal').length
      }

      return {
        total,
        active,
        callsBooked,
        lost,
        conversionRate: total > 0 ? (callsBooked / total * 100).toFixed(1) : 0,
        avgMessagesToCall: Math.round(avgMessagesToCall),
        avgTimeToCallMinutes: Math.round(avgTimeToCall / 60),
        profiles
      }

    } catch (error) {
      console.error('❌ Get analytics failed:', error)
      return {
        total: 0,
        active: 0,
        callsBooked: 0,
        lost: 0,
        conversionRate: 0,
        avgMessagesToCall: 0,
        avgTimeToCallMinutes: 0,
        profiles: { dikker: 0, dunner: 0, sporter: 0, neutraal: 0 }
      }
    }
  }

  // Get variant performance analytics
  async getVariantAnalytics(category = null, limit = 10) {
    try {
      let query = this.supabase
        .from('dm_variant_analytics')
        .select('*')

      if (category) {
        query = query.eq('message_category', category)
      }

      const { data, error } = await query
        .order('times_used', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []

    } catch (error) {
      console.error('❌ Get variant analytics failed:', error)
      return []
    }
  }

  // Get top performing variants by category
  async getTopVariants(category, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_top_variants', {
          p_category: category,
          p_limit: limit
        })

      if (error) throw error

      return data || []

    } catch (error) {
      console.error('❌ Get top variants failed:', error)
      return []
    }
  }

  async getTransitionHistory(leadId) {
    try {
      const { data, error } = await this.supabase
        .from('dm_section_transitions')
        .select('*')
        .eq('lead_id', leadId)
        .order('transitioned_at', { ascending: true })

      if (error) throw error
      return data || []

    } catch (error) {
      console.error('❌ Get transition history failed:', error)
      return []
    }
  }

  // ========================================
  // 7. OPENING PROFILE SELECTION
  // ========================================

  async setOpeningProfile(conversationId, profile) {
    try {
      await this.updateConversation(conversationId, {
        opening_profile: profile
      })

      console.log('✅ Opening profile set:', profile)

    } catch (error) {
      console.error('❌ Set opening profile failed:', error)
      throw error
    }
  }
}

export default DMConversationService
