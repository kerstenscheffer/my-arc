// src/modules/lead-management/LeadManagementService.js
// EXTENDED VERSION with Kanban Board + Activity Tracking + Lead Names + WARM-UP SYSTEM + STALE DETECTION
// FIXED: Stale section detection now properly identifies all 3 stale sections
// v7.1: Expanded stale exclusions — sale, ghost, snooze sections all excluded
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
    const insertData = {
      first_name: leadData.firstName || leadData.name?.split(' ')[0] || '',
      last_name: leadData.lastName || leadData.name?.split(' ').slice(1).join(' ') || '',
      email: leadData.email || null,
      phone: leadData.phone || null,
      lead_source: leadData.source || 'manual',
      coach_id: leadData.coachId || null,
      notes: leadData.notes || null,
      campaign_id: leadData.campaignId || null,
      utm_source: leadData.utmSource || null,
      utm_medium: leadData.utmMedium || null,
      utm_campaign: leadData.utmCampaign || null,
      referrer_url: leadData.referrerUrl || null,
      last_touched: new Date().toISOString()
    }

    const { data, error } = await this.db.supabase
      .from('call_leads')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    console.log('✅ Lead created:', data.id, insertData.campaign_id ? `(campaign: ${insertData.campaign_id})` : '')
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
        .select(`*, lead_notes:lead_notes(count)`)
        .or(`coach_id.eq.${coachId},coach_id.is.null`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
      if (filters.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority)
      if (filters.search) query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      if (filters.limit) query = query.limit(filters.limit)

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get leads failed:', error)
      return []
    }
  }

async updateLead(leadId, updates, coachId = null) {
  try {
    console.log('📝 UPDATE LEAD:', leadId, 'Updates:', Object.keys(updates))
    
    if (updates.status === 'contacted' && !updates.last_contacted_at) {
      updates.last_contacted_at = new Date().toISOString()
    }
    updates.last_touched = new Date().toISOString()

    const { data, error } = await this.db.supabase
      .from('call_leads')
      .update(updates) 
      .eq('id', leadId)
      .select()
      .single()
  
    if (error) throw error
  
    const shouldRestore = (
      updates.reply_count !== undefined || 
      updates.contacted_today_date !== undefined
    )
    
    if (shouldRestore && coachId) {
      console.log('🔄 Triggering restore check...')
      const restoreResult = await this.restoreFromStaleIfNeeded(leadId, coachId)
      
      if (restoreResult.restored) {
        console.log('✅ Lead restored to:', restoreResult.restoredTo?.title)
      }
      
      return { 
        ...data, 
        restored: restoreResult.restored, 
        restoredTo: restoreResult.restoredTo 
      }
    }

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
      
      await this.db.supabase
        .from('lead_section_items')
        .delete()
        .eq('lead_id', leadId)
      
      return data
    } else {
      await this.db.supabase
        .from('lead_section_items')
        .delete()
        .eq('lead_id', leadId)
      
      const { error } = await this.db.supabase
        .from('call_leads')
        .delete()
        .eq('id', leadId)
      
      if (error) throw error
      return true
    }
  } catch (error) {
    console.error('❌ Delete lead failed:', error)
    throw error
  }
}

  // ============================================================================
  // WARM-UP LEAD SYSTEM
  // ============================================================================

async getWarmUpBoard(coachId) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await this.db.supabase
      .from('warm_up_leads')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const phases = [
      { id: 0, title: 'Nieuw', color: '#6b7280' },
      { id: 1, title: '1 Interactie', color: '#f59e0b' },
      { id: 2, title: '2 Interacties', color: '#3b82f6' },
      { id: 3, title: 'Klaar voor DM', color: '#8b5cf6' },
      { id: 4, title: 'DM Gestuurd', color: '#10b981' }
    ]

    const board = phases.map(phase => {
      const phaseLeads = (data || [])
        .filter(lead => lead.phase === phase.id)
        .map(lead => {
          const interactedToday = lead.last_interaction_date === today
          return {
            ...lead,
            isLocked: interactedToday,
            interactedToday: interactedToday
          }
        })
        .sort((a, b) => (a.interactedToday && !b.interactedToday) ? 1 : (!a.interactedToday && b.interactedToday) ? -1 : 0)

      return {
        ...phase,
        leads: phaseLeads,
        activeCount: phaseLeads.filter(l => !l.interactedToday).length,
        lockedCount: phaseLeads.filter(l => l.interactedToday).length
      }
    })

    return board
  } catch (error) {
    console.error('❌ Get warm-up board failed:', error)
    return []
  }
}

async createWarmUpLead(coachId, leadData) {
  try {
    const { data, error } = await this.db.supabase
      .from('warm_up_leads')
      .insert({
        coach_id: coachId,
        instagram_handle: leadData.instagramHandle,
        notes: leadData.notes || null,
        source: leadData.source || null,
        campaign_id: leadData.campaignId || null,
        phase: 0,
        last_interaction_date: null
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Create warm-up lead failed:', error)
    throw error
  }
}

  async logWarmUpInteraction(leadId) {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: current, error: fetchError } = await this.db.supabase
        .from('warm_up_leads')
        .select('phase, last_interaction_date')
        .eq('id', leadId)
        .single()

      if (fetchError) throw fetchError
      if (current.last_interaction_date === today) {
        return { success: false, reason: 'already_interacted' }
      }

      const newPhase = Math.min(current.phase + 1, 4)

      const { data, error } = await this.db.supabase
        .from('warm_up_leads')
        .update({ phase: newPhase, last_interaction_date: today })
        .eq('id', leadId)
        .select()
        .single()

      if (error) throw error
      return { success: true, lead: data, previousPhase: current.phase, newPhase }
    } catch (error) {
      console.error('❌ Log warm-up interaction failed:', error)
      throw error
    }
  }

async convertWarmUpToLead(warmUpLeadId, sectionId = null, coachId) {
  try {
    const { data: warmUpLead, error: fetchError } = await this.db.supabase
      .from('warm_up_leads')
      .select('*')
      .eq('id', warmUpLeadId)
      .single()

    if (fetchError) throw fetchError

    const newLead = await this.createLead({
      firstName: warmUpLead.instagram_handle,
      source: 'instagram_warmup',
      notes: `Instagram: @${warmUpLead.instagram_handle}\nBron: ${warmUpLead.source || 'Direct'}\n${warmUpLead.notes || ''}`,
      coachId,
      campaignId: warmUpLead.campaign_id
    })

    let targetSectionId = sectionId

    if (!targetSectionId || targetSectionId === 'unassigned') {
      const sections = await this.getSections(coachId)
      const INSTAGRAM_PATTERNS = ['instagram', 'insta', 'dm', 'bericht']
      const instagramSection = sections.find(s => 
        INSTAGRAM_PATTERNS.some(pattern => (s.title || '').toLowerCase().includes(pattern))
      )
      
      if (instagramSection) {
        targetSectionId = instagramSection.id
      }
    }

    if (targetSectionId && targetSectionId !== 'unassigned') {
      await this.moveLeadToSection(newLead.id, targetSectionId, 0, coachId)
    }

    await this.db.supabase.from('warm_up_leads').delete().eq('id', warmUpLeadId)
    return newLead
  } catch (error) {
    console.error('❌ Convert warm-up lead failed:', error)
    throw error
  }
}

  async deleteWarmUpLead(leadId) {
    try {
      const { error } = await this.db.supabase.from('warm_up_leads').delete().eq('id', leadId)
      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ Delete warm-up lead failed:', error)
      throw error
    }
  }

  async updateWarmUpLead(leadId, updates) {
    try {
      const { data, error } = await this.db.supabase
        .from('warm_up_leads')
        .update({ instagram_handle: updates.instagramHandle, notes: updates.notes, source: updates.source })
        .eq('id', leadId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Update warm-up lead failed:', error)
      throw error
    }
  }

  async getWarmUpTodayStats(coachId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await this.db.supabase
        .from('warm_up_leads')
        .select('phase, last_interaction_date')
        .eq('coach_id', coachId)

      if (error) throw error

      const stats = { total: data?.length || 0, byPhase: [0, 0, 0, 0, 0], interactedToday: 0, pendingToday: 0 }
      data?.forEach(lead => {
        stats.byPhase[lead.phase]++
        if (lead.last_interaction_date === today) stats.interactedToday++
        else if (lead.phase < 4) stats.pendingToday++
      })

      return stats
    } catch (error) {
      console.error('❌ Get warm-up stats failed:', error)
      return { total: 0, byPhase: [0, 0, 0, 0, 0], interactedToday: 0, pendingToday: 0 }
    }
  }

  // ============================================================================
  // KANBAN BOARD METHODS
  // ============================================================================

  async createSection(coachId, sectionData) {
    try {
      const { data, error } = await this.db.supabase
        .from('lead_sections')
        .insert({ coach_id: coachId, title: sectionData.title, color: sectionData.color || '#10b981', position: sectionData.position || 0 })
        .select()
        .single()

      if (error) throw error
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
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', sectionId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Update section failed:', error)
      throw error
    }
  }

  async deleteSection(sectionId) {
    try {
      const { error } = await this.db.supabase.from('lead_sections').delete().eq('id', sectionId)
      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ Delete section failed:', error)
      throw error
    }
  }

  async getKanbanBoard(coachId) {
    try {
      const sections = await this.getSections(coachId)
      
      const { data: sectionItems } = await this.db.supabase
        .from('lead_section_items')
        .select('lead_id, section_id, position, previous_section_id, previous_section_title, previous_section_color, moved_to_stale_at')
      
      const { data: allLeads } = await this.db.supabase
        .from('call_leads')
        .select('*')
        .or(`coach_id.eq.${coachId},coach_id.is.null`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      const leadMap = new Map((allLeads || []).map(lead => [lead.id, lead]))
      const assignedLeadIds = new Set((sectionItems || []).map(item => item.lead_id))

      const board = sections.map(section => {
        const sectionLeads = (sectionItems || [])
          .filter(item => item.section_id === section.id)
          .map(item => {
            const lead = leadMap.get(item.lead_id)
            if (!lead) return null
            return {
              ...lead,
              position: item.position,
              previous_section_id: item.previous_section_id,
              previous_section_title: item.previous_section_title,
              previous_section_color: item.previous_section_color,
              moved_to_stale_at: item.moved_to_stale_at
            }
          })
          .filter(lead => lead?.id)
          .sort((a, b) => a.position - b.position)
        return { ...section, leads: sectionLeads }
      })

      const unassignedLeads = (allLeads || []).filter(lead => !assignedLeadIds.has(lead.id))
      board.push({ id: 'unassigned', title: 'Niet toegewezen', color: '#6b7280', position: 9999, leads: unassignedLeads })

      return board
    } catch (error) {
      console.error('❌ Get kanban board failed:', error)
      return []
    }
  }

  // ============================================================================
  // MOVEMENT TRACKING - WITH LEAD NAMES + STALE DETECTION
  // ============================================================================

  async moveLeadToSection(leadId, targetSectionId, targetPosition = 0, coachId = null) {
    try {
      if (targetSectionId === 'unassigned') {
        return await this.removeLeadFromSection(leadId, coachId)
      }

      const { data: leadData } = await this.db.supabase
        .from('call_leads')
        .select('first_name, last_name')
        .eq('id', leadId)
        .single()

      const leadName = leadData 
        ? `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown'

      const { data: currentItem } = await this.db.supabase
        .from('lead_section_items')
        .select('section_id, previous_section_id, previous_section_title, previous_section_color, lead_sections:section_id(id, title, color)')
        .eq('lead_id', leadId)
        .maybeSingle()

      const { data: targetSection } = await this.db.supabase
        .from('lead_sections')
        .select('id, title, color')
        .eq('id', targetSectionId)
        .single()

      const fromSectionId = currentItem?.section_id || null
      const fromSectionTitle = currentItem?.lead_sections?.title || 'Niet toegewezen'
      const toSectionTitle = targetSection?.title || 'Unknown'

      const isCurrentStale = this.isStaleSectionByTitle(fromSectionTitle)
      const isTargetStale = this.isStaleSectionByTitle(toSectionTitle)

      let updateData = {
        section_id: targetSectionId,
        position: targetPosition,
        moved_at: new Date().toISOString()
      }

      if (isTargetStale && !isCurrentStale && currentItem?.lead_sections) {
        updateData.previous_section_id = currentItem.section_id
        updateData.previous_section_title = currentItem.lead_sections.title
        updateData.previous_section_color = currentItem.lead_sections.color
        updateData.moved_to_stale_at = new Date().toISOString()
      } else if (isTargetStale && isCurrentStale) {
        updateData.previous_section_id = currentItem?.previous_section_id
        updateData.previous_section_title = currentItem?.previous_section_title
        updateData.previous_section_color = currentItem?.previous_section_color
        updateData.moved_to_stale_at = currentItem?.moved_to_stale_at || new Date().toISOString()
      } else if (!isTargetStale && isCurrentStale) {
        updateData.previous_section_id = null
        updateData.previous_section_title = null
        updateData.previous_section_color = null
        updateData.moved_to_stale_at = null
      }

      if (currentItem) {
        await this.db.supabase
          .from('lead_section_items')
          .update(updateData)
          .eq('lead_id', leadId)
      } else {
        await this.db.supabase
          .from('lead_section_items')
          .insert({ lead_id: leadId, ...updateData })
      }

      await this.db.supabase.from('call_leads').update({ last_touched: new Date().toISOString() }).eq('id', leadId)

      await this.logMovement({
        leadId, leadName, fromSectionId, fromSectionTitle,
        toSectionId: targetSectionId, toSectionTitle, coachId
      })

      return { success: true, leadName, fromSection: fromSectionTitle, toSection: toSectionTitle }
    } catch (error) {
      console.error('❌ Move lead to section failed:', error)
      throw error
    }
  }

  async removeLeadFromSection(leadId, coachId = null) {
    try {
      const { data: leadData } = await this.db.supabase
        .from('call_leads')
        .select('first_name, last_name')
        .eq('id', leadId)
        .single()

      const leadName = leadData 
        ? `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown'

      const { data: currentItem } = await this.db.supabase
        .from('lead_section_items')
        .select('section_id, lead_sections:section_id(id, title)')
        .eq('lead_id', leadId)
        .maybeSingle()

      if (currentItem) {
        await this.logMovement({
          leadId, leadName,
          fromSectionId: currentItem.section_id,
          fromSectionTitle: currentItem.lead_sections?.title || 'Unknown',
          toSectionId: null, toSectionTitle: 'Niet toegewezen', coachId
        })
      }

      await this.db.supabase.from('lead_section_items').delete().eq('lead_id', leadId)
      await this.db.supabase.from('call_leads').update({ last_touched: new Date().toISOString() }).eq('id', leadId)

      return true
    } catch (error) {
      console.error('❌ Remove lead from section failed:', error)
      throw error
    }
  }

  async logMovement({ leadId, leadName, fromSectionId, fromSectionTitle, toSectionId, toSectionTitle, coachId, outcomeType = null }) {
    try {
      const { error } = await this.db.supabase
        .from('lead_movements')
        .insert({
          lead_id: leadId, lead_name: leadName || null,
          from_section_id: fromSectionId, from_section_title: fromSectionTitle,
          to_section_id: toSectionId, to_section_title: toSectionTitle,
          coach_id: coachId, moved_at: new Date().toISOString(), outcome_type: outcomeType
        })

      if (error) throw error
    } catch (error) {
      console.error('❌ Log movement failed:', error)
    }
  }

  // ============================================================================
  // STALE LEAD DETECTION SYSTEM
  // ============================================================================

  async checkAndMoveStaleLeads(coachId) {
    try {
      console.log('🔍 ========== STALE CHECK START ==========')
      
      const sections = await this.getSections(coachId)
      const staleSections = this.identifyStaleSections(sections)
      
      const staleSectionCount = Object.keys(staleSections).length
      if (staleSectionCount === 0) {
        console.log('⚠️ Geen "Stil" secties gevonden!')
        return { moved: 0, checked: 0, error: 'No stale sections found' }
      }
      
      const leadsWithActivity = await this.getLeadsWithLastActivity(coachId)
      
      // ================================================================
      // v7.1: EXPANDED EXCLUSIONS — snooze + sale + ghost sections
      // ================================================================
      const staleSectionIds = new Set(Object.values(staleSections).map(s => s.id))
      const today = new Date().toISOString().split('T')[0]

      const EXCLUDE_FROM_STALE_PATTERNS = [
        // Snooze / later
        'later follow', 'later opvolg', 'follow up', 'followup', 'snooze', 'parkeer',
        // Sale / converted / client
        'sale', 'verkocht', 'converted', 'klant', 'client', 'gewonnen', 'won',
        // Ghost / lost / unreachable
        'ghost', 'geghost', 'lost', 'verloren', 'afgewezen', 'niet bereikbaar', 'no show'
      ]

      const excludedSectionIds = new Set(
        sections
          .filter(s => EXCLUDE_FROM_STALE_PATTERNS.some(pattern => 
            (s.title || '').toLowerCase().includes(pattern)
          ))
          .map(s => s.id)
      )

      console.log(`🛡️ Sections excluded from stale: ${excludedSectionIds.size}`,
        sections.filter(s => excludedSectionIds.has(s.id)).map(s => s.title)
      )

      const normalLeads = leadsWithActivity.filter(lead => {
        if (staleSectionIds.has(lead.current_section_id)) return false
        if (excludedSectionIds.has(lead.current_section_id)) {
          console.log(`⏭️ Skipping "${lead.first_name}" - in excluded section`)
          return false
        }
        if (lead.contacted_today_date?.split('T')[0] === today) {
          console.log(`⏭️ Skipping "${lead.first_name}" - contacted today via checkbox`)
          return false
        }
        return true
      })

      const staleLeads = leadsWithActivity.filter(lead => 
        staleSectionIds.has(lead.current_section_id)
      )

      console.log(`📊 Normal: ${normalLeads.length}, Stale: ${staleLeads.length}, Excluded: ${excludedSectionIds.size} sections`)

      let movedCount = 0
      const now = new Date()

      // Process NORMAL leads
      for (const lead of normalLeads) {
        const leadName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
        const lastActivity = lead.last_activity ? new Date(lead.last_activity) : null
        
        let daysSinceActivity
        if (!lastActivity) {
          const created = new Date(lead.created_at)
          daysSinceActivity = Math.floor((now - created) / (1000 * 60 * 60 * 24))
        } else {
          daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24))
        }
        
        if (daysSinceActivity >= 1) {
          const targetDays = daysSinceActivity >= 3 ? 3 : daysSinceActivity >= 2 ? 2 : 1
          const targetSection = staleSections[targetDays]
          
          if (targetSection) {
            if (lead.current_section_id === targetSection.id) continue
            
            const moveResult = await this.moveToStaleSection(lead, targetSection, coachId, false)
            if (moveResult) {
              movedCount++
              console.log(`  ✅ MOVED "${leadName}" to "${targetSection.title}"`)
            }
          }
        }
      }
      
      // Process STALE leads for escalation
      for (const lead of staleLeads) {
        const leadName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
        const lastActivity = lead.last_activity ? new Date(lead.last_activity) : new Date(lead.created_at)
        const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24))
        
        const targetDays = daysSinceActivity >= 3 ? 3 : daysSinceActivity >= 2 ? 2 : 1
        const targetSection = staleSections[targetDays]
        
        if (!targetSection) continue
        if (lead.current_section_id === targetSection.id) continue
        
        let currentStaleLevel = 0
        for (const [level, section] of Object.entries(staleSections)) {
          if (section.id === lead.current_section_id) {
            currentStaleLevel = parseInt(level)
            break
          }
        }
        
        if (targetDays > currentStaleLevel) {
          const moveResult = await this.moveToStaleSection(lead, targetSection, coachId, true)
          if (moveResult) {
            movedCount++
            console.log(`  ✅ ESCALATED "${leadName}" to "${targetSection.title}"`)
          }
        }
      }
      
      console.log(`✅ Stale check: ${movedCount} verplaatst, ${normalLeads.length + staleLeads.length} gecheckt`)
      
      return { 
        moved: movedCount, 
        checked: normalLeads.length + staleLeads.length,
        staleSectionsFound: staleSectionCount
      }
      
    } catch (error) {
      console.error('❌ Check stale leads failed:', error)
      return { moved: 0, checked: 0, error: error.message }
    }
  }

  identifyStaleSections(sections) {
    const staleSections = {}
    
    for (const section of sections) {
      const titleLower = (section.title || '').toLowerCase().trim()
      
      if (titleLower.includes('1 dag') || titleLower.includes('1d stil') || titleLower === '1 dag stil') {
        staleSections[1] = section
        continue
      }
      if (titleLower.includes('2 dag') || titleLower.includes('2d stil') || titleLower === '2 dagen stil') {
        staleSections[2] = section
        continue
      }
      if (titleLower.includes('3+') || titleLower.includes('3 dag') || titleLower.includes('3d stil') || titleLower === '3+ dagen stil') {
        staleSections[3] = section
        continue
      }
    }
    
    return staleSections
  }

  async getLeadsWithLastActivity(coachId) {
    try {
      const { data: leads, error: leadsError } = await this.db.supabase
        .from('call_leads')
        .select('id, first_name, last_name, created_at, last_touched, contacted_today_date')
        .or(`coach_id.eq.${coachId},coach_id.is.null`)
        .is('deleted_at', null)
      
      if (leadsError) throw leadsError
      
      const { data: sectionItems } = await this.db.supabase
        .from('lead_section_items')
        .select('lead_id, section_id, previous_section_id, previous_section_title, previous_section_color')
      
      const sectionMap = new Map((sectionItems || []).map(item => [item.lead_id, item]))
      
      const { data: movements } = await this.db.supabase
        .from('lead_movements')
        .select('lead_id, moved_at')
        .order('moved_at', { ascending: false })
      
      const latestMovement = new Map()
      ;(movements || []).forEach(m => {
        if (!latestMovement.has(m.lead_id)) latestMovement.set(m.lead_id, m.moved_at)
      })
      
      const { data: notes } = await this.db.supabase
        .from('lead_notes')
        .select('lead_id, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      
      const latestNote = new Map()
      ;(notes || []).forEach(n => {
        if (!latestNote.has(n.lead_id)) latestNote.set(n.lead_id, n.created_at)
      })
      
      return (leads || []).map(lead => {
        const sectionInfo = sectionMap.get(lead.id)
        const moveDate = latestMovement.get(lead.id)
        const noteDate = latestNote.get(lead.id)
        const touchDate = lead.last_touched
        
        const dates = [moveDate, noteDate, touchDate].filter(Boolean).map(d => new Date(d))
        const lastActivity = dates.length > 0 ? new Date(Math.max(...dates)) : null
        
        return {
          ...lead,
          current_section_id: sectionInfo?.section_id || null,
          previous_section_id: sectionInfo?.previous_section_id || null,
          previous_section_title: sectionInfo?.previous_section_title || null,
          previous_section_color: sectionInfo?.previous_section_color || null,
          last_activity: lastActivity?.toISOString() || null,
          last_movement: moveDate || null,
          last_note: noteDate || null
        }
      })
      
    } catch (error) {
      console.error('❌ Get leads with activity failed:', error)
      return []
    }
  }

  async moveToStaleSection(lead, targetSection, coachId, isAlreadyStale = false) {
    try {
      const leadName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
      
      let previousSectionData = {}
      
      if (!isAlreadyStale && lead.current_section_id) {
        const { data: currentSection } = await this.db.supabase
          .from('lead_sections')
          .select('id, title, color')
          .eq('id', lead.current_section_id)
          .single()
        
        if (currentSection) {
          previousSectionData = {
            previous_section_id: currentSection.id,
            previous_section_title: currentSection.title,
            previous_section_color: currentSection.color,
            moved_to_stale_at: new Date().toISOString()
          }
        }
      }
      
      const { data: existingItem } = await this.db.supabase
        .from('lead_section_items')
        .select('id, previous_section_id')
        .eq('lead_id', lead.id)
        .maybeSingle()
      
      if (existingItem) {
        const updateData = { section_id: targetSection.id, moved_at: new Date().toISOString() }
        if (!isAlreadyStale && !existingItem.previous_section_id) {
          Object.assign(updateData, previousSectionData)
        }
        await this.db.supabase.from('lead_section_items').update(updateData).eq('lead_id', lead.id)
      } else {
        await this.db.supabase.from('lead_section_items').insert({
          lead_id: lead.id, section_id: targetSection.id, position: 0, ...previousSectionData
        })
      }
      
      await this.db.supabase.from('lead_movements').insert({
        lead_id: lead.id, lead_name: leadName,
        from_section_id: lead.current_section_id,
        from_section_title: isAlreadyStale ? 'Stale Sectie' : (lead.current_section_title || 'Niet toegewezen'),
        to_section_id: targetSection.id, to_section_title: targetSection.title,
        coach_id: coachId, moved_at: new Date().toISOString(), outcome_type: 'auto_stale'
      })
      
      return true
    } catch (error) {
      console.error('❌ Move to stale section failed:', error)
      return false
    }
  }

  isStaleSectionByTitle(sectionTitle) {
    if (!sectionTitle) return false
    const titleLower = sectionTitle.toLowerCase().trim()
    return (
      titleLower.includes('1 dag') || titleLower.includes('2 dag') ||
      titleLower.includes('3 dag') || titleLower.includes('3+') ||
      titleLower.includes('stil') || titleLower.includes('stale') || titleLower.includes('inactive')
    )
  }

  async clearPreviousSectionData(leadId) {
    try {
      await this.db.supabase.from('lead_section_items').update({
        previous_section_id: null, previous_section_title: null,
        previous_section_color: null, moved_to_stale_at: null
      }).eq('lead_id', leadId)
      return true
    } catch (error) {
      console.error('❌ Clear previous section data failed:', error)
      return false
    }
  }

  async getPreviousSectionInfo(leadId) {
    try {
      const { data } = await this.db.supabase
        .from('lead_section_items')
        .select('previous_section_id, previous_section_title, previous_section_color, moved_to_stale_at')
        .eq('lead_id', leadId)
        .maybeSingle()
      
      if (data?.previous_section_id) {
        return { id: data.previous_section_id, title: data.previous_section_title, color: data.previous_section_color, movedAt: data.moved_to_stale_at }
      }
      return null
    } catch (error) {
      console.error('❌ Get previous section info failed:', error)
      return null
    }
  }

  // ============================================================================
  // ACTIVITY ANALYTICS
  // ============================================================================

  async getTodayActivity(coachId) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      const { data: movements, error: movError } = await this.db.supabase
        .from('lead_movements')
        .select('*')
        .gte('moved_at', todayISO)
        .order('moved_at', { ascending: false })

      if (movError) throw movError

      const movementsBySection = {}
      const movementsList = []

      ;(movements || []).forEach(mov => {
        const toSection = mov.to_section_title || 'Unknown'
        const fromSection = mov.from_section_title || 'Niet toegewezen'
        
        if (!movementsBySection[toSection]) {
          movementsBySection[toSection] = { count: 0, leads: [] }
        }
        movementsBySection[toSection].count++
        movementsBySection[toSection].leads.push(mov.lead_id)

        movementsList.push({
          leadName: mov.lead_name || 'Unknown',
          leadId: mov.lead_id,
          from: fromSection, to: toSection,
          time: new Date(mov.moved_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        })
      })

      const { data: touchedLeads, error: touchError } = await this.db.supabase
        .from('call_leads')
        .select('id, first_name, last_name, created_at, last_touched, lead_source')
        .gte('last_touched', todayISO)
        .is('deleted_at', null)

      if (touchError) throw touchError

      const newOutreach = (touchedLeads || []).filter(lead => {
        const created = new Date(lead.created_at)
        created.setHours(0, 0, 0, 0)
        return created.getTime() === today.getTime()
      })

      const followUps = (touchedLeads || []).filter(lead => {
        const created = new Date(lead.created_at)
        created.setHours(0, 0, 0, 0)
        return created.getTime() < today.getTime()
      })

      return {
        movements: movements || [],
        movementsBySection,
        totalMovements: movements?.length || 0,
        newOutreach: newOutreach.length,
        followUps: followUps.length,
        totalTouches: newOutreach.length + followUps.length,
        touchedLeadIds: (touchedLeads || []).map(l => l.id),
        movementsList,
        newOutreachLeads: newOutreach.map(l => ({
          name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
          source: l.lead_source || 'manual',
          time: new Date(l.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        })),
        followUpLeads: followUps.map(l => ({
          name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
          source: l.lead_source || 'manual'
        }))
      }
    } catch (error) {
      console.error('❌ Get today activity failed:', error)
      return {
        movements: [], movementsBySection: {}, totalMovements: 0,
        newOutreach: 0, followUps: 0, totalTouches: 0, touchedLeadIds: [],
        movementsList: [], newOutreachLeads: [], followUpLeads: []
      }
    }
  }

  async getTodayFunnelStats(coachId) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: movements } = await this.db.supabase
        .from('lead_movements')
        .select('*')
        .gte('moved_at', today.toISOString())

      const funnelKeywords = {
        replied: ['replied', 'gereageerd', 'reactie', 'response', 'antwoord'],
        conversation: ['gesprek', 'conversation', 'kwalificatie', 'qualified', 'interesse'],
        callScheduled: ['call', 'meeting', 'afspraak', 'ingepland', 'scheduled', 'booking']
      }

      const funnel = {
        replied: { count: 0, leads: [] },
        conversation: { count: 0, leads: [] },
        callScheduled: { count: 0, leads: [] }
      }

      ;(movements || []).forEach(mov => {
        const toSection = (mov.to_section_title || '').toLowerCase()
        for (const [stage, keywords] of Object.entries(funnelKeywords)) {
          if (keywords.some(kw => toSection.includes(kw))) {
            funnel[stage].count++
            funnel[stage].leads.push({
              name: mov.lead_name || 'Unknown',
              from: mov.from_section_title || 'Unknown',
              time: new Date(mov.moved_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
            })
            break
          }
        }
      })

      return funnel
    } catch (error) {
      console.error('❌ Get funnel stats failed:', error)
      return { replied: { count: 0, leads: [] }, conversation: { count: 0, leads: [] }, callScheduled: { count: 0, leads: [] } }
    }
  }

  async getActivityHistory(coachId, days = 7) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      cutoffDate.setHours(0, 0, 0, 0)

      const { data: movements, error } = await this.db.supabase
        .from('lead_movements')
        .select('*')
        .gte('moved_at', cutoffDate.toISOString())
        .order('moved_at', { ascending: false })

      if (error) throw error

      const byDay = {}
      ;(movements || []).forEach(mov => {
        const day = new Date(mov.moved_at).toISOString().split('T')[0]
        if (!byDay[day]) byDay[day] = []
        byDay[day].push(mov)
      })

      return { movements: movements || [], byDay, totalMovements: movements?.length || 0 }
    } catch (error) {
      console.error('❌ Get activity history failed:', error)
      return { movements: [], byDay: {}, totalMovements: 0 }
    }
  }

async createLeadWithSection(leadData, sectionId, coachId) {
  try {
    const lead = await this.createLead({ ...leadData, coachId })
    if (sectionId && sectionId !== 'unassigned') {
      await this.moveLeadToSection(lead.id, sectionId, 0, coachId)
    }
    return lead
  } catch (error) {
    console.error('❌ Create lead with section failed:', error)
    throw error
  }
}

  async reorderSections(coachId, sectionIds) {
    try {
      await Promise.all(sectionIds.map((id, index) => this.updateSection(id, { position: index })))
      return true
    } catch (error) {
      console.error('❌ Reorder sections failed:', error)
      throw error
    }
  }

  async reorderLeadsInSection(sectionId, leadIds) {
    try {
      await Promise.all(leadIds.map((leadId, index) => 
        this.db.supabase.from('lead_section_items').update({ position: index }).eq('lead_id', leadId).eq('section_id', sectionId)
      ))
      return true
    } catch (error) {
      console.error('❌ Reorder leads failed:', error)
      throw error
    }
  }

  // ============================================================================
  // STATS & SUBSCRIPTIONS
  // ============================================================================

  async getLeadStats(coachId, dateRange = 30) {
    return await this.getLeadStatsFallback(coachId, dateRange)
  }

  async getLeadStatsFallback(coachId, dateRange) {
    try {
      const { data } = await this.db.supabase
        .from('call_leads')
        .select('status, lead_source, created_at')
        .is('deleted_at', null)

      const stats = {
        total_leads: data?.length || 0,
        new_leads: data?.filter(l => l.status === 'new').length || 0,
        contacted_leads: data?.filter(l => l.status === 'contacted').length || 0,
        scheduled_leads: data?.filter(l => l.status === 'scheduled').length || 0,
        converted_leads: data?.filter(l => l.status === 'converted').length || 0,
        conversion_rate: data?.length > 0 ? Math.round((data.filter(l => l.status === 'converted').length / data.length) * 100) : 0,
        leads_by_source: {}
      }

      data?.forEach(lead => {
        const source = lead.lead_source || 'unknown'
        stats.leads_by_source[source] = (stats.leads_by_source[source] || 0) + 1
      })

      return stats
    } catch (error) {
      return { total_leads: 0, new_leads: 0, contacted_leads: 0, scheduled_leads: 0, converted_leads: 0, conversion_rate: 0, leads_by_source: {} }
    }
  }

  async bulkUpdateStatus(leadIds, newStatus, coachId) {
    try {
      const updates = { status: newStatus, last_touched: new Date().toISOString() }
      if (coachId) updates.coach_id = coachId
      if (newStatus === 'scheduled') updates.scheduled_at = new Date().toISOString()
      if (newStatus === 'converted') updates.conversion_date = new Date().toISOString().split('T')[0]

      const { data, error } = await this.db.supabase.from('call_leads').update(updates).in('id', leadIds).select()
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Bulk update status failed:', error)
      throw error
    }
  }

  async bulkDeleteLeads(leadIds, softDelete = true) {
    try {
      if (softDelete) {
        const { data, error } = await this.db.supabase.from('call_leads').update({ deleted_at: new Date().toISOString() }).in('id', leadIds).select()
        if (error) throw error
        return data
      } else {
        const { error } = await this.db.supabase.from('call_leads').delete().in('id', leadIds)
        if (error) throw error
        return true
      }
    } catch (error) {
      console.error('❌ Bulk delete failed:', error)
      throw error
    }
  }

  subscribeToLeadUpdates(coachId, callback) {
    return this.db.supabase
      .channel('lead-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_leads' }, callback)
      .subscribe()
  }

  // ============================================================================
  // OUTREACH CAMPAIGNS
  // ============================================================================

  async createCampaign(campaignData, coachId) {
    try {
      const { data, error } = await this.db.supabase
        .from('outreach_campaigns')
        .insert({
          coach_id: coachId, platform: campaignData.platform,
          message_text: campaignData.messageText, purpose: campaignData.purpose,
          total_sent: campaignData.totalSent || 0,
          campaign_date: campaignData.date || new Date().toISOString().split('T')[0]
        })
        .select().single()

      if (error) throw error
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
        .select('*, metrics:outreach_metrics(*)')
        .eq('coach_id', coachId)
        .order('campaign_date', { ascending: false })
        .limit(limit)

      if (error) throw error
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
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', campaignId)
        .select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Update campaign failed:', error)
      throw error
    }
  }

  async deleteCampaign(campaignId) {
    try {
      await this.db.supabase.from('outreach_metrics').delete().eq('campaign_id', campaignId)
      const { error } = await this.db.supabase.from('outreach_campaigns').delete().eq('id', campaignId)
      if (error) throw error
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
        .insert({ campaign_id: campaignId, metric_name: metricName, metric_color: metricColor || '#10b981', metric_value: 0, position })
        .select().single()

      if (error) throw error
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
        .update({ metric_value: newValue, updated_at: new Date().toISOString() })
        .eq('id', metricId)
        .select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Update metric failed:', error)
      throw error
    }
  }

  async incrementMetric(metricId) {
    try {
      const { data: current } = await this.db.supabase.from('outreach_metrics').select('metric_value').eq('id', metricId).single()
      return await this.updateMetricValue(metricId, (current?.metric_value || 0) + 1)
    } catch (error) {
      console.error('❌ Increment metric failed:', error)
      throw error
    }
  }

  async decrementMetric(metricId) {
    try {
      const { data: current } = await this.db.supabase.from('outreach_metrics').select('metric_value').eq('id', metricId).single()
      return await this.updateMetricValue(metricId, Math.max(0, (current?.metric_value || 0) - 1))
    } catch (error) {
      console.error('❌ Decrement metric failed:', error)
      throw error
    }
  }

  async deleteMetric(metricId) {
    try {
      const { error } = await this.db.supabase.from('outreach_metrics').delete().eq('id', metricId)
      if (error) throw error
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
        .select('*, metrics:outreach_metrics(*)')
        .eq('coach_id', coachId)
        .gte('campaign_date', cutoffDate.toISOString().split('T')[0])

      if (error) throw error

      const stats = { total_campaigns: campaigns?.length || 0, total_sent: 0, total_responses: 0, platforms: {}, conversion_rate: 0 }
      campaigns?.forEach(campaign => {
        stats.total_sent += campaign.total_sent || 0
        const platform = campaign.platform || 'unknown'
        stats.platforms[platform] = (stats.platforms[platform] || 0) + 1
        campaign.metrics?.forEach(metric => { stats.total_responses += metric.metric_value || 0 })
      })

      if (stats.total_sent > 0) stats.conversion_rate = ((stats.total_responses / stats.total_sent) * 100).toFixed(2)

      return stats
    } catch (error) {
      console.error('❌ Get campaign stats failed:', error)
      return { total_campaigns: 0, total_sent: 0, total_responses: 0, platforms: {}, conversion_rate: 0 }
    }
  }

  // ============================================================================
  // LEAD NOTES
  // ============================================================================

  async addLeadNote(leadId, noteData, coachId) {
    try {
      const { data: note, error: noteError } = await this.db.supabase
        .from('lead_notes')
        .insert({
          lead_id: leadId,
          content: noteData.content || noteData.text || noteData.note || '',
          note_type: noteData.type || 'general',
          coach_id: coachId,
          created_at: new Date().toISOString()
        })
        .select().single()
      
      if (noteError) throw noteError
      
      await this.db.supabase.from('call_leads').update({ last_touched: new Date().toISOString() }).eq('id', leadId)
      
      const restoreResult = await this.restoreFromStaleIfNeeded(leadId, coachId)
      
      return { note, restored: restoreResult.restored, restoredTo: restoreResult.restoredTo || null }
    } catch (error) {
      console.error('❌ Add lead note failed:', error)
      throw error
    }
  }

  async restoreFromStaleIfNeeded(leadId, coachId) {
    try {
      const { data: sectionItem } = await this.db.supabase
        .from('lead_section_items')
        .select(`id, section_id, previous_section_id, previous_section_title, previous_section_color, lead_sections!inner(id, title, color)`)
        .eq('lead_id', leadId)
        .single()
      
      if (!sectionItem) return { restored: false }
      
      const currentSectionTitle = sectionItem.lead_sections?.title || ''
      const isInStale = this.isStaleSectionByTitle(currentSectionTitle)
      
      if (!isInStale) return { restored: false }
      if (!sectionItem.previous_section_id) return { restored: false }
      
      const { data: previousSection } = await this.db.supabase
        .from('lead_sections')
        .select('id, title, color')
        .eq('id', sectionItem.previous_section_id)
        .single()
      
      if (!previousSection) return { restored: false }
      
      const { data: lead } = await this.db.supabase
        .from('call_leads')
        .select('first_name, last_name')
        .eq('id', leadId)
        .single()
      
      const leadName = `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim() || 'Unknown'
      
      await this.db.supabase.from('lead_section_items').update({
        section_id: sectionItem.previous_section_id,
        previous_section_id: null, previous_section_title: null,
        previous_section_color: null, moved_to_stale_at: null, position: 0
      }).eq('id', sectionItem.id)
      
      await this.db.supabase.from('lead_movements').insert({
        lead_id: leadId, from_section_id: sectionItem.section_id,
        to_section_id: sectionItem.previous_section_id,
        coach_id: coachId, moved_at: new Date().toISOString(),
        lead_name: leadName, outcome_type: 'restored_from_stale'
      })
      
      return {
        restored: true,
        restoredTo: { id: previousSection.id, title: previousSection.title, color: previousSection.color },
        restoredFrom: currentSectionTitle
      }
    } catch (error) {
      console.error('❌ Restore from stale failed:', error)
      return { restored: false, error: error.message }
    }
  }

  async getLeadNotes(leadId) {
    try {
      const { data, error } = await this.db.supabase
        .from('lead_notes').select('*').eq('lead_id', leadId)
        .is('deleted_at', null).order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get lead notes failed:', error)
      return []
    }
  }

  async updateLeadNote(noteId, updates) {
    try {
      const { data, error } = await this.db.supabase
        .from('lead_notes').update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', noteId).select().single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Update lead note failed:', error)
      throw error
    }
  }

  async deleteLeadNote(noteId) {
    try {
      const { error } = await this.db.supabase
        .from('lead_notes').update({ deleted_at: new Date().toISOString() }).eq('id', noteId)
      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ Delete lead note failed:', error)
      throw error
    }
  }
}

export default LeadManagementService
