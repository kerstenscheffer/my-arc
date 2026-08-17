// src/modules/lead-management/LeadManagementService.js
// EXTENDED VERSION with Kanban Board + Activity Tracking + Lead Names + WARM-UP SYSTEM + STALE DETECTION
// FIXED: Stale section detection now properly identifies all 3 stale sections
// v7.1: Expanded stale exclusions — sale, ghost, snooze sections all excluded
import DatabaseService from '../../services/DatabaseService'

// "Dead" outcome sections — when a lead lands here, it does NOT count as a
// funnel progression in any of the stats endpoints. Without this list, a
// section titled "Sale verloren" would match the 'sale' keyword and bump
// the sales count.
const NEGATIVE_FUNNEL_WORDS = [
  'verloren', 'lost', 'afgewezen',
  'ghost', 'geghost',
  'no show', 'no-show', 'noshow',
  'unqualified',
]

class LeadManagementService {
  constructor() {
    this.db = DatabaseService
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

async createLead(leadData) {
  try {
    // Defensive: filter out string "null"/"undefined" that have been seen
    // coming from upstream when the auth session is stale. A bare ||-fallback
    // doesn't catch them because non-empty strings are truthy.
    const cleanUuid = (v) => {
      if (typeof v !== 'string') return v || null
      if (v === 'null' || v === 'undefined' || v.trim() === '') return null
      return v
    }
    const insertData = {
      first_name: leadData.firstName || leadData.name?.split(' ')[0] || '',
      last_name: leadData.lastName || leadData.name?.split(' ').slice(1).join(' ') || '',
      email: leadData.email || null,
      phone: leadData.phone || null,
      lead_source: leadData.source || 'manual',
      coach_id: cleanUuid(leadData.coachId),
      notes: leadData.notes || null,
      // scrape_campaigns reference (legacy)
      campaign_id: cleanUuid(leadData.campaignId),
      // outreach_campaigns reference (new attribution model)
      outreach_campaign_id: cleanUuid(leadData.outreachCampaignId),
      // lead magnet attribution (FK + mirror naar de legacy text[] zodat de
      // kaart-banner en LeadDetailModalV2 'm direct tonen).
      source_lead_magnet_id: cleanUuid(leadData.sourceLeadMagnetId),
      lead_magnets_shared: Array.isArray(leadData.leadMagnetsShared) && leadData.leadMagnetsShared.length
        ? leadData.leadMagnetsShared : null,
      utm_source: leadData.utmSource || null,
      utm_medium: leadData.utmMedium || null,
      utm_campaign: leadData.utmCampaign || null,
      referrer_url: leadData.referrerUrl || null,
      team_id: cleanUuid(leadData.teamId),
      last_touched: new Date().toISOString()
    }

    // Team-tagging: een nieuwe lead krijgt de team_id van de coach, zodat álle
    // teamleden hem via RLS (is_team_member) zien. Zonder dit blijft de lead
    // alleen zichtbaar voor de maker (coach_id = auth.uid()) — precies waarom
    // de andere coach z'n leads niet kon inzien.
    if (!insertData.team_id && insertData.coach_id) {
      const { data: membership } = await this.db.supabase
        .from('coach_team_members')
        .select('team_id')
        .eq('coach_id', insertData.coach_id)
        .limit(1)
        .maybeSingle()
      if (membership?.team_id) insertData.team_id = membership.team_id
    }

    let { data, error } = await this.db.supabase
      .from('call_leads')
      .insert(insertData)
      .select()
      .single()

    // FK retries — if the caller passed a campaign id that's been deleted or
    // archived (e.g. stale in-memory state after a delete in the logger modal),
    // drop the offending ref and retry rather than failing the whole create.
    if (error?.code === '23503') {
      const msg = error.message || ''
      let retried = false
      if (msg.includes('outreach_campaign_id') && insertData.outreach_campaign_id) {
        console.warn('⚠️  outreach_campaign_id FK invalid, retrying without it:', insertData.outreach_campaign_id)
        insertData.outreach_campaign_id = null
        retried = true
      }
      if (msg.includes('campaign_id_fkey') && !msg.includes('outreach_') && insertData.campaign_id) {
        console.warn('⚠️  campaign_id FK invalid, retrying without it:', insertData.campaign_id)
        insertData.campaign_id = null
        retried = true
      }
      if (msg.includes('source_lead_magnet_id') && insertData.source_lead_magnet_id) {
        console.warn('⚠️  source_lead_magnet_id FK invalid, retrying without it:', insertData.source_lead_magnet_id)
        insertData.source_lead_magnet_id = null
        retried = true
      }
      if (retried) {
        ;({ data, error } = await this.db.supabase
          .from('call_leads')
          .insert(insertData)
          .select()
          .single())
      }
    }

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
        .select(`
          *,
          lead_notes:lead_notes(count),
          source_lead_magnet:lead_magnets!call_leads_source_lead_magnet_id_fkey(id, name),
          outreach_campaign:outreach_campaigns!call_leads_outreach_campaign_id_fkey(id, name, variant_tag)
        `)
        // Geen coach_id filter — RLS bepaalt de toegang (team-membership of eigen leads).
        // Voorheen: .or(`coach_id.eq.${coachId},coach_id.is.null`)
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
    if (updates.status === 'contacted' && !updates.last_contacted_at) {
      updates.last_contacted_at = new Date().toISOString()
    }
    updates.last_touched = new Date().toISOString()

    // First-reply stamp: when reply_count is being bumped from 0 to >0
    // and we haven't already stamped first_reply_at, set it to now. This
    // is the metric-grade signal — "lead responded to outreach" — versus
    // reply_count itself which tracks every back-and-forth message and
    // is therefore conversation-volume, not response-rate.
    // Bij elke wijziging van reply_count: bepaal het verschil (delta) t.o.v.
    // de huidige waarde, zodat we élke losse reactie kunnen loggen (niet alleen
    // de eerste). Ook de first_reply_at-stempel hangt hieraan.
    let replyDelta = 0
    if (updates.reply_count !== undefined) {
      const newCount = Number(updates.reply_count) || 0
      const { data: cur } = await this.db.supabase
        .from('call_leads')
        .select('reply_count, first_reply_at')
        .eq('id', leadId).single()
      const oldCount = Number(cur?.reply_count) || 0
      replyDelta = newCount - oldCount
      if (updates.first_reply_at === undefined) {
        if (newCount > 0) {
          if (cur && (!cur.first_reply_at) && oldCount === 0) {
            updates.first_reply_at = new Date().toISOString()
          }
        } else {
          // Coach clicked the counter back down to 0 — clear the stamp so
          // a future first-click is again counted as a fresh response.
          updates.first_reply_at = null
        }
      }
      // NIEUWE REGEL: elke reactie (+1) reset de opvolg-teller naar 0. Een
      // reactie betekent dat de lead reageerde, dus het "achterna zitten"
      // (followup_count) begint weer bij 0. Alleen bij een positieve delta.
      if (replyDelta > 0) {
        if (updates.followup_count === undefined) updates.followup_count = 0
        if (updates.last_followup_sent_at === undefined) updates.last_followup_sent_at = null
      }
    }

    const { data, error } = await this.db.supabase
      .from('call_leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single()

    if (error) throw error

    // Log de losse reactie (élke +/- klik) met een timestamp. Best-effort:
    // een fout hier mag het bijwerken van de lead nooit breken.
    if (replyDelta !== 0) {
      try {
        await this.db.supabase.from('lead_reaction_events').insert({
          lead_id: leadId,
          coach_id: data?.coach_id || coachId || null,
          delta: replyDelta,
        })
      } catch (e) { console.warn('reaction event log failed:', e?.message) }
    }

    const shouldRestore = (
      updates.reply_count !== undefined || 
      updates.contacted_today_date !== undefined
    )
    
    if (shouldRestore && coachId) {
      const restoreResult = await this.restoreFromStaleIfNeeded(leadId, coachId)

      // Reactie (+1) op een lead die uit de "Follow up stil"-sectie wordt
      // teruggezet: de lead heeft gereageerd, dus de opvolg-teller (= hoe vaak
      // achterna gezeten zónder reactie) hoort terug naar 0. De verplaatsing
      // naar insta-dm regelt restoreFromStaleIfNeeded al; dit reset alleen de count.
      let resetFollowupCount = false
      if (restoreResult.restored && replyDelta > 0 && this.isFollowupStilSectionTitle(restoreResult.restoredFrom)) {
        try {
          await this.db.supabase
            .from('call_leads')
            .update({ followup_count: 0, last_followup_sent_at: null })
            .eq('id', leadId)
          resetFollowupCount = true
        } catch (e) { console.warn('followup_count reset failed:', e?.message) }
      }

      return {
        ...data,
        followup_count: resetFollowupCount ? 0 : data.followup_count,
        followupReset: resetFollowupCount,
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
      // Nieuwe secties krijgen de team_id van de coach (eerste lidmaatschap).
      // Daardoor zien alle teamleden de nieuwe kolom automatisch.
      let teamId = sectionData.teamId || null
      if (!teamId && coachId) {
        const { data: membership } = await this.db.supabase
          .from('coach_team_members')
          .select('team_id')
          .eq('coach_id', coachId)
          .limit(1)
          .maybeSingle()
        teamId = membership?.team_id || null
      }

      const { data, error } = await this.db.supabase
        .from('lead_sections')
        .insert({
          coach_id: coachId,
          team_id: teamId,
          title: sectionData.title,
          color: sectionData.color || '#10b981',
          position: sectionData.position || 0
        })
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
      // Geen coach_id filter — RLS toont alle secties van het team waarin
      // de coach zit (plus zijn eigen oude secties).
      const { data, error } = await this.db.supabase
        .from('lead_sections')
        .select('*')
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

  // Haalt ALLE rijen op ondanks de PostgREST 1000-rijen limiet, door te
  // pagineren met .range(). `build` moet telkens een VERSE query teruggeven.
  // Haalt alle rijen op (PostgREST kapt op 1000/req). Voorheen: sequentiële
  // pagina's → bij 4000+ leads waren dat 5 round-trips achter elkaar (traag).
  // Nu: eerste pagina apart (kleine tabellen = 1 request), grotere sets in
  // PARALLELLE batches → veel minder wachttijd op netwerk-latency.
  async _fetchAllRows(build, pageSize = 1000, parallel = 6) {
    const first = await build().range(0, pageSize - 1)
    if (first.error) { console.error('❌ _fetchAllRows error:', first.error.message); return [] }
    let out = first.data || []
    if (out.length < pageSize) return out // alles paste in 1 request

    let base = pageSize
    while (true) {
      const reqs = []
      for (let i = 0; i < parallel; i++) {
        const from = base + i * pageSize
        reqs.push(build().range(from, from + pageSize - 1))
      }
      const results = await Promise.all(reqs)
      let full = 0
      for (const { data, error } of results) {
        if (error) { console.error('❌ _fetchAllRows error:', error.message); return out }
        out = out.concat(data || [])
        if ((data?.length || 0) === pageSize) full++
      }
      if (full < parallel) break // laatste batch bevatte een niet-volle pagina → klaar
      base += parallel * pageSize
    }
    return out
  }

  async getKanbanBoard(coachId) {
    try {
      // Drie onafhankelijke queries parallel uitvoeren i.p.v. sequentieel.
      // Voorheen: sections → sectionItems → allLeads (3 round trips achter elkaar).
      // Nu: alle drie tegelijk → load time ~ langzaamste van de drie queries.
      const [sections, sectionItems, allLeads] = await Promise.all([
        this.getSections(coachId),
        // BELANGRIJK: gepagineerd ophalen. PostgREST geeft standaard max. 1000
        // rijen per query terug. Met >1000 leads/koppelingen viel een deel van de
        // section-links weg → die leads belandden onterecht in "Niet toegewezen".
        this._fetchAllRows(() => this.db.supabase
          .from('lead_section_items')
          .select('lead_id, section_id, position, previous_section_id, previous_section_title, previous_section_color, moved_to_stale_at')),
        this._fetchAllRows(() => this.db.supabase
          .from('call_leads')
          // Slanke selectie i.p.v. `select *`: alleen de kolommen die de kaart +
          // bord-logica gebruiken. De zware jsonb-kolommen (dm_node_history,
          // sales_call_notes) en ongebruikte vrije-tekstvelden vielen weg → veel
          // kleinere payload voor 4000+ leads. De detail-modal haalt de volledige
          // lead apart op, dus niks gaat verloren.
          .select(`
            id, first_name, last_name, email, phone, status, lead_source,
            created_at, last_contacted_at, last_touched, contacted_today_date,
            last_followup_sent_at, last_dm_interaction, current_dm_node,
            coach_id, team_id, deleted_at, notes, reply_count, first_reply_at,
            is_snoozed, campaign_id, followup_count, lead_temperature,
            lead_magnets_shared, outreach_campaign_id, source_lead_magnet_id,
            previous_section_color, previous_section_id, previous_section_title,
            qual_goal_checked, qual_pain_checked, qual_urgency_checked, qual_open_checked, gender,
            source_lead_magnet:lead_magnets!call_leads_source_lead_magnet_id_fkey(id, name),
            outreach_campaign:outreach_campaigns!call_leads_outreach_campaign_id_fkey(id, name, variant_tag)
          `)
          // Geen coach_id filter — RLS bepaalt de toegang (team-membership of eigen leads).
          .is('deleted_at', null)
          .order('created_at', { ascending: false }))
      ])
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

  async moveLeadToSection(leadId, targetSectionId, targetPosition = 0, coachId = null, callDate = null, callTime = null) {
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

      // Upsert op lead_id → nooit een tweede rij voor dezelfde lead (issue d93267cf).
      await this.db.supabase
        .from('lead_section_items')
        .upsert({ lead_id: leadId, ...updateData }, { onConflict: 'lead_id' })

      await this.db.supabase.from('call_leads').update({ last_touched: new Date().toISOString() }).eq('id', leadId)

      const movementId = await this.logMovement({
        leadId, leadName, fromSectionId, fromSectionTitle,
        toSectionId: targetSectionId, toSectionTitle, coachId, callDate, callTime
      })

      return { success: true, leadName, fromSection: fromSectionTitle, toSection: toSectionTitle, movementId }
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

  async logMovement({ leadId, leadName, fromSectionId, fromSectionTitle, toSectionId, toSectionTitle, coachId, outcomeType = null, callDate = null, callTime = null }) {
    try {
      const { data, error } = await this.db.supabase
        .from('lead_movements')
        .insert({
          lead_id: leadId, lead_name: leadName || null,
          from_section_id: fromSectionId, from_section_title: fromSectionTitle,
          to_section_id: toSectionId, to_section_title: toSectionTitle,
          coach_id: coachId, moved_at: new Date().toISOString(), outcome_type: outcomeType,
          call_date: callDate || null,
          call_time: callTime || null,
        })
        .select('id')
        .single()

      if (error) throw error
      return data?.id || null
    } catch (error) {
      console.error('❌ Log movement failed:', error)
      return null
    }
  }

  // ── INGEPLANDE CALLS ────────────────────────────────────────────────
  // Openstaande calls: leads waarvan de laatste ingepland-movement een call_date
  // heeft, nog niet is afgehandeld (call_happened = null), de lead nog in die
  // ingepland-sectie staat, én de call-datum+tijd voorbij is.
  async getDueScheduledCalls(scheduledSectionIds = []) {
    try {
      if (!scheduledSectionIds || scheduledSectionIds.length === 0) return []
      const { data: movs, error } = await this.db.supabase
        .from('lead_movements')
        .select('id, lead_id, lead_name, to_section_id, to_section_title, call_date, call_time, moved_at')
        .in('to_section_id', scheduledSectionIds)
        .not('call_date', 'is', null)
        .is('call_happened', null)
        .is('reverted_at', null)
        .order('moved_at', { ascending: false })
      if (error) throw error
      if (!movs || movs.length === 0) return []

      // Per lead alleen de meest recente ingepland-movement.
      const latestByLead = new Map()
      for (const mv of movs) { if (!latestByLead.has(mv.lead_id)) latestByLead.set(mv.lead_id, mv) }

      // Alleen leads die NU nog in die ingepland-sectie staan.
      const leadIds = [...latestByLead.keys()]
      const { data: items } = await this.db.supabase
        .from('lead_section_items').select('lead_id, section_id').in('lead_id', leadIds)
      const currentSection = new Map((items || []).map(it => [it.lead_id, it.section_id]))

      const now = new Date()
      const due = []
      for (const [leadId, mv] of latestByLead) {
        if (currentSection.get(leadId) !== mv.to_section_id) continue
        const dt = new Date(`${mv.call_date}T${mv.call_time || '23:59'}:00`)
        if (isNaN(dt.getTime()) || dt > now) continue
        due.push({ movementId: mv.id, leadId, leadName: mv.lead_name, sectionId: mv.to_section_id, sectionTitle: mv.to_section_title, callDate: mv.call_date, callTime: mv.call_time })
      }
      due.sort((a, b) => `${a.callDate}${a.callTime || ''}`.localeCompare(`${b.callDate}${b.callTime || ''}`))
      return due
    } catch (e) {
      console.error('getDueScheduledCalls failed:', e)
      return []
    }
  }

  // Markeer een ingeplande call als wel/niet gevoerd (drijft de "Call gevoerd"-stat).
  async resolveScheduledCall(movementId, happened) {
    try {
      if (!movementId) return { success: false }
      const { error } = await this.db.supabase
        .from('lead_movements').update({ call_happened: !!happened }).eq('id', movementId)
      if (error) throw error
      return { success: true }
    } catch (e) {
      console.error('resolveScheduledCall failed:', e)
      return { success: false, error: e.message }
    }
  }

  // Ingeplande call geannuleerd (lead heeft afgezegd). call_happened=false zodat
  // 'ie van de due-lijst af is, + outcome_type='cancelled' zodat de no-show-stat
  // 'm NIET meetelt (afzeggen ≠ niet komen opdagen).
  async cancelScheduledCall(movementId) {
    try {
      if (!movementId) return { success: false }
      const { error } = await this.db.supabase
        .from('lead_movements')
        .update({ call_happened: false, outcome_type: 'cancelled' })
        .eq('id', movementId)
      if (error) throw error
      return { success: true }
    } catch (e) {
      console.error('cancelScheduledCall failed:', e)
      return { success: false, error: e.message }
    }
  }

  // Verplaats een call: sluit de oude af (niet gevoerd) en leg een nieuwe
  // ingeplande call vast in dezelfde sectie met nieuwe datum/tijd.
  async rescheduleScheduledCall(oldMovementId, { leadId, leadName, sectionId, sectionTitle, callDate, callTime, coachId }) {
    try {
      if (oldMovementId) await this.resolveScheduledCall(oldMovementId, false)
      const movementId = await this.logMovement({
        leadId, leadName, fromSectionId: sectionId, fromSectionTitle: sectionTitle,
        toSectionId: sectionId, toSectionTitle: sectionTitle, coachId, callDate, callTime,
      })
      return { success: true, movementId }
    } catch (e) {
      console.error('rescheduleScheduledCall failed:', e)
      return { success: false }
    }
  }

  // ============================================================================
  // STALE LEAD DETECTION SYSTEM
  // ============================================================================

  async checkAndMoveStaleLeads(coachId) {
    try {
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
      // Alleen de genummerde stil-secties (1/2/3) tellen als "stale" voor de
      // verwerking — NIET de "Follow up stil"-doelsectie (anders zouden leads
      // daar weer uit gehaald worden).
      const staleSectionIds = new Set([staleSections[1], staleSections[2], staleSections[3]].filter(Boolean).map(s => s.id))
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

      // v8 (issue d93267cf): WHITELIST i.p.v. blacklist. ALLEEN leads uit de
      // actieve gesprek-secties (Gesprek insta / Gesprek Whatsapp) mogen door de
      // stil-automation verplaatst worden. Al het andere (Call voorgesteld,
      // Sales Call, Nieuwe volgers, Sale, No Show, Snooze, ...) blijft met rust —
      // die verplaats je zelf. De stil-secties zelf escaleren apart (staleLeads).
      const ALLOWED_SOURCE_PATTERNS = ['gesprek']
      const allowedSourceIds = new Set(
        sections
          .filter(s => ALLOWED_SOURCE_PATTERNS.some(p => (s.title || '').toLowerCase().includes(p)))
          .map(s => s.id)
      )

      const normalLeads = leadsWithActivity.filter(lead => {
        if (staleSectionIds.has(lead.current_section_id)) return false
        // Alleen gesprek-secties doorschuiven; alle andere kolommen met rust laten.
        if (!allowedSourceIds.has(lead.current_section_id)) return false
        if (lead.contacted_today_date?.split('T')[0] === today) return false
        return true
      })

      const staleLeads = leadsWithActivity.filter(lead =>
        staleSectionIds.has(lead.current_section_id)
      )

      let movedCount = 0
      const now = new Date()

      // Process NORMAL leads
      for (const lead of normalLeads) {
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
          // 3+ dagen stil én al opgevolgd → naar "Follow up stil" i.p.v.
          // "3+ Dagen Stil", zodat de opvolg-werklijst zuiver blijft.
          const targetSection = (targetDays >= 3 && (lead.followup_count || 0) >= 1 && staleSections.followupStil)
            ? staleSections.followupStil
            : staleSections[targetDays]

          if (targetSection) {
            if (lead.current_section_id === targetSection.id) continue
            const moveResult = await this.moveToStaleSection(lead, targetSection, coachId, false)
            if (moveResult) movedCount++
          }
        }
      }

      // Process STALE leads for escalation
      for (const lead of staleLeads) {
        const lastActivity = lead.last_activity ? new Date(lead.last_activity) : new Date(lead.created_at)
        const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24))

        const targetDays = daysSinceActivity >= 3 ? 3 : daysSinceActivity >= 2 ? 2 : 1

        // Al-opgevolgde leads die 3+ dagen stil staan → naar "Follow up stil"
        // (i.p.v. blijven hangen in "3+ Dagen Stil"). Moet vóór de gewone
        // escalatie, anders blokkeert de "zelfde sectie"-check de verplaatsing.
        if (targetDays >= 3 && (lead.followup_count || 0) >= 1 && staleSections.followupStil
            && lead.current_section_id !== staleSections.followupStil.id) {
          const moveResult = await this.moveToStaleSection(lead, staleSections.followupStil, coachId, true)
          if (moveResult) movedCount++
          continue
        }

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
          if (moveResult) movedCount++
        }
      }
      
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

      // "Follow up stil"-sectie: doel voor 3+-dagen-stille leads die al een
      // opvolg-bericht hebben gekregen. EERST checken zodat 'ie niet als gewone
      // stil-sectie wordt gezien.
      if (titleLower.includes('stil') && (titleLower.includes('follow') || titleLower.includes('opvolg'))) {
        staleSections.followupStil = section
        continue
      }

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
      // De stale-check kijkt alleen naar activiteit in de afgelopen 1-3 dagen.
      // Movements en notes ouder dan 7 dagen zijn nooit relevant voor stale-detectie;
      // leads zonder recente movement/note vallen terug op last_touched (al in call_leads).
      // Vier queries parallel i.p.v. sequentieel → veel kortere wachttijd.
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [leads, sectionItems, movements, notes] = await Promise.all([
        this._fetchAllRows(() => this.db.supabase
          .from('call_leads')
          .select('id, first_name, last_name, created_at, last_touched, contacted_today_date, followup_count, lead_temperature')
          .is('deleted_at', null)),
        this._fetchAllRows(() => this.db.supabase
          .from('lead_section_items')
          .select('lead_id, section_id, previous_section_id, previous_section_title, previous_section_color')),
        this._fetchAllRows(() => this.db.supabase
          .from('lead_movements')
          .select('lead_id, moved_at')
          .gte('moved_at', sevenDaysAgo)
          .order('moved_at', { ascending: false })),
        this._fetchAllRows(() => this.db.supabase
          .from('lead_notes')
          .select('lead_id, created_at')
          .is('deleted_at', null)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })),
      ])

      const sectionMap = new Map((sectionItems || []).map(item => [item.lead_id, item]))

      const latestMovement = new Map()
      ;(movements || []).forEach(m => {
        if (!latestMovement.has(m.lead_id)) latestMovement.set(m.lead_id, m.moved_at)
      })

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

  // Urgente opvolg-meldingen voor de kanban: leads die HOT zijn óf in een
  // "Call voorgesteld"-sectie staan, en al > `hoursThreshold` uur geen
  // beweging/reactie/opvolging hadden. Vandaag-gecontacteerde en
  // sale/lost/ghost-leads vallen weg. Meest urgent eerst.
  async getUrgentFollowups(coachId, hoursThreshold = 24) {
    try {
      const [leads, sections] = await Promise.all([
        this.getLeadsWithLastActivity(coachId),
        this.getSections(coachId),
      ])
      const titleById = new Map((sections || []).map(s => [s.id, s.title || '']))
      const proposedRe = /voorgesteld|voorstel/i
      const excludeRe = /sale|verkocht|gewonnen|won|klant|client|ghost|geghost|lost|verloren|afgewezen|no show|niet bereikbaar/i
      const today = new Date().toISOString().split('T')[0]
      const now = Date.now()
      const cutoff = hoursThreshold * 3600 * 1000

      const urgent = []
      for (const lead of leads) {
        const sectionTitle = titleById.get(lead.current_section_id) || ''
        if (excludeRe.test(sectionTitle)) continue
        if (lead.contacted_today_date && String(lead.contacted_today_date).split('T')[0] === today) continue

        const isHot = String(lead.lead_temperature || '').toLowerCase() === 'hot'
        const isProposed = proposedRe.test(sectionTitle) || proposedRe.test(lead.previous_section_title || '')
        if (!isHot && !isProposed) continue

        const ref = lead.last_activity ? new Date(lead.last_activity) : new Date(lead.created_at)
        const silentMs = now - ref.getTime()
        if (!(silentMs >= cutoff)) continue

        urgent.push({
          id: lead.id,
          name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Naamloze lead',
          sectionId: lead.current_section_id,
          sectionTitle,
          reason: isHot ? 'hot' : 'call',
          hoursSilent: Math.floor(silentMs / 3600000),
        })
      }
      urgent.sort((a, b) => b.hoursSilent - a.hoursSilent)
      return urgent
    } catch (error) {
      console.error('❌ Get urgent followups failed:', error)
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
      
      // VERPLAATSEN, nooit dupliceren: upsert op lead_id (unique constraint).
      // Zo kan één lead nooit in meerdere kolommen tegelijk belanden, ook niet
      // als een vorige run een rare staat achterliet (issue d93267cf, FIX 2).
      const { data: existingItem } = await this.db.supabase
        .from('lead_section_items')
        .select('id, previous_section_id')
        .eq('lead_id', lead.id)
        .limit(1)
        .maybeSingle()

      const payload = {
        lead_id: lead.id,
        section_id: targetSection.id,
        moved_at: new Date().toISOString(),
        // previous_section alleen zetten bij eerste keer stil worden.
        ...((!isAlreadyStale && !existingItem?.previous_section_id) ? previousSectionData : {}),
        ...(existingItem ? {} : { position: 0 }),
      }
      await this.db.supabase
        .from('lead_section_items')
        .upsert(payload, { onConflict: 'lead_id' })
      
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

  // Specifiek de "Follow up stil"-sectie (subset van isStaleSectionByTitle).
  // Hier hoort een binnenkomende reactie de opvolg-teller naar 0 te resetten.
  isFollowupStilSectionTitle(sectionTitle) {
    if (!sectionTitle) return false
    const t = sectionTitle.toLowerCase()
    return ['follow up stil', 'followup stil', 'opvolg stil', 'opgevolgd stil'].some(p => t.includes(p))
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

      const movements = await this._fetchMovementsPaged(today.toISOString(), null, '*')

      const NO_SHOW_KEYWORDS = ['no show', 'no-show', 'noshow']
      const funnelKeywords = {
        replied: ['replied', 'gereageerd', 'reactie', 'response', 'antwoord'],
        conversation: ['gesprek', 'conversation', 'kwalificatie', 'qualified', 'interesse'],
        callScheduled: ['call', 'meeting', 'afspraak', 'ingepland', 'scheduled', 'booking']
      }

      const funnel = {
        replied: { count: 0, leads: [] },
        conversation: { count: 0, leads: [] },
        callScheduled: { count: 0, leads: [] },
        noShow: { count: 0, leads: [] },
      }

      ;(movements || []).forEach(mov => {
        const toSection = (mov.to_section_title || '').toLowerCase()
        const leadInfo = {
          name: mov.lead_name || 'Unknown',
          from: mov.from_section_title || 'Unknown',
          time: new Date(mov.moved_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        }
        // Count no-shows BEFORE the negative-words filter — same reason as
        // the range version.
        if (NO_SHOW_KEYWORDS.some(kw => toSection.includes(kw))) {
          funnel.noShow.count++
          funnel.noShow.leads.push(leadInfo)
          return
        }
        if (NEGATIVE_FUNNEL_WORDS.some(w => toSection.includes(w))) return
        for (const [stage, keywords] of Object.entries(funnelKeywords)) {
          if (keywords.some(kw => toSection.includes(kw))) {
            funnel[stage].count++
            funnel[stage].leads.push(leadInfo)
            break
          }
        }
      })

      return funnel
    } catch (error) {
      console.error('❌ Get funnel stats failed:', error)
      return { replied: { count: 0, leads: [] }, conversation: { count: 0, leads: [] }, callScheduled: { count: 0, leads: [] }, noShow: { count: 0, leads: [] } }
    }
  }

  // All call-proposal messages logged in [startISO, endISO). Joins each
  // message back to its lead's CURRENT section so the stats UI can show
  // outcome: did this proposal land in "Sales Call" / "Klant" (worked)
  // or is the lead still sitting in "Call voorgesteld" / a stale section
  // (didn't convert)?
  async getRangeCallProposals(coachId, startISO, endISO) {
    try {
      const { data: msgs, error } = await this.db.supabase
        .from('lead_notes')
        .select('id, lead_id, content, created_at')
        .eq('coach_id', coachId)
        .eq('note_type', 'call_proposal')
        .is('deleted_at', null)
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      if (!msgs?.length) return []
      const leadIds = [...new Set(msgs.map(m => m.lead_id))]
      // Load lead names + their current section (via lead_section_items
      // joined to lead_sections). Used purely for display + outcome.
      const [{ data: leads }, { data: items }] = await Promise.all([
        this.db.supabase.from('call_leads')
          .select('id, first_name, last_name')
          .in('id', leadIds),
        this.db.supabase.from('lead_section_items')
          .select('lead_id, lead_sections:section_id(id, title, color)')
          .in('lead_id', leadIds),
      ])
      const leadMap = new Map((leads || []).map(l => [l.id, l]))
      const sectionMap = new Map(
        (items || []).map(i => [i.lead_id, i.lead_sections || null])
      )
      // Classify the outcome based on the lead's current section title.
      const classify = (sec) => {
        if (!sec) return { key: 'open', label: 'Open', color: '#6b7280' }
        const t = (sec.title || '').toLowerCase()
        if (NEGATIVE_FUNNEL_WORDS.some(w => t.includes(w))) {
          return { key: 'lost', label: 'Verloren', color: '#ef4444' }
        }
        if (t.includes('sale') || t.includes('verkocht') || t.includes('klant') || t.includes('client') || t.includes('won') || t.includes('gewonnen')) {
          return { key: 'sale', label: 'Sale', color: '#10b981' }
        }
        if (t.includes('sales call') || t.includes('ingepland') || t.includes('scheduled') || t.includes('booking') || t.includes('afspraak') || t.includes('meeting')) {
          return { key: 'scheduled', label: 'Call ingepland', color: '#FFD700' }
        }
        if (t.includes('voorgesteld') || t.includes('voorstel')) {
          return { key: 'proposed', label: 'Nog open', color: '#f59e0b' }
        }
        return { key: 'other', label: sec.title || 'Onbekend', color: sec.color || '#6b7280' }
      }
      return msgs.map(m => {
        const lead = leadMap.get(m.lead_id)
        const section = sectionMap.get(m.lead_id)
        return {
          id: m.id,
          lead_id: m.lead_id,
          lead_name: lead
            ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Onbekend'
            : 'Onbekend',
          content: m.content,
          created_at: m.created_at,
          outcome: classify(section),
        }
      })
    } catch (e) {
      console.error('❌ Get call proposals failed:', e)
      return []
    }
  }

  // Daily time-series for the growth chart. Returns one row per day in
  // [startISO, endISO) with: nieuwe leads created that day + a per-stage
  // bucket of movement-counts (replied / callProposed / callScheduled /
  // sale) + follow-ups sent that day.
  //
  // Negative-outcome sections (Sale verloren, Ghost, …) are excluded via
  // the same NEGATIVE_FUNNEL_WORDS guard used elsewhere so the chart
  // doesn't double-count a lost lead as a "sale".
  async getDailyTimeSeries(coachId, startISO, endISO) {
    try {
      // Pull the underlying rows once, then bucket client-side per local
      // calendar day. Avoids N queries (one per day) and lets us re-use
      // the existing funnel-keyword logic.
      const [{ data: leads }, movements, { data: followupLeads }] = await Promise.all([
        this.db.supabase.from('call_leads')
          .select('id, created_at')
          .eq('coach_id', coachId)
          .gte('created_at', startISO).lt('created_at', endISO)
          .is('deleted_at', null),
        // gepagineerd → niet afgekapt op 1000 rijen bij veel movements
        this._fetchMovementsPaged(startISO, endISO, 'moved_at, to_section_title'),
        this.db.supabase.from('call_leads')
          .select('last_followup_sent_at')
          .eq('coach_id', coachId)
          .gte('last_followup_sent_at', startISO).lt('last_followup_sent_at', endISO),
      ])

      const NO_SHOW_KEYWORDS = ['no show', 'no-show', 'noshow']
      const stages = {
        replied:       ['replied', 'gereageerd', 'reactie', 'response', 'antwoord'],
        callProposed:  ['voorgesteld', 'voorstel'],
        callScheduled: ['sales call', 'ingepland', 'scheduled', 'booking', 'afspraak', 'meeting'],
        sale:          ['sale', 'verkocht', 'klant', 'client', 'gewonnen', 'won', 'deal'],
      }

      // Build empty buckets for every day in the window so the chart has
      // continuous X-axis even when a day has zero activity.
      const startDay = new Date(startISO); startDay.setHours(0,0,0,0)
      // Vergelijk met de ECHTE eind-tijd (niet afgerond op middernacht), anders
      // valt de huidige/laatste dag weg — bv. bij "Vandaag" (end = nu) zou de lus
      // 0 keer draaien. Zo krijgt de dag van `endISO` altijd een emmer.
      const endTs = new Date(endISO)
      const buckets = {}
      for (let d = new Date(startDay); d < endTs; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0]
        buckets[key] = {
          date: key,
          newLeads: 0, followups: 0,
          replied: 0, callProposed: 0, callScheduled: 0, sale: 0,
          noShow: 0,
        }
      }
      const dayKey = (iso) => new Date(iso).toISOString().split('T')[0]

      ;(leads || []).forEach(l => {
        const k = dayKey(l.created_at)
        if (buckets[k]) buckets[k].newLeads += 1
      })
      ;(followupLeads || []).forEach(f => {
        if (!f.last_followup_sent_at) return
        const k = dayKey(f.last_followup_sent_at)
        if (buckets[k]) buckets[k].followups += 1
      })
      ;(movements || []).forEach(m => {
        const t = (m.to_section_title || '').toLowerCase()
        const k = dayKey(m.moved_at)
        if (!buckets[k]) return
        if (NO_SHOW_KEYWORDS.some(kw => t.includes(kw))) {
          buckets[k].noShow += 1
          return
        }
        if (NEGATIVE_FUNNEL_WORDS.some(w => t.includes(w))) return
        for (const [stage, kws] of Object.entries(stages)) {
          if (kws.some(kw => t.includes(kw))) {
            buckets[k][stage] += 1
            break
          }
        }
      })

      return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date))
    } catch (e) {
      console.error('❌ Get daily time series failed:', e)
      return []
    }
  }

  // Reaction stats for a date range. Uses the two card-counters as the
  // source of truth (NOT funnel-section keywords) because the user
  // explicitly toggles these per lead — they're the authoritative signal:
  //   reply_count    > 0  → lead reacted to outreach
  //   followup_count > 0  → coach had to chase (= no reply yet)
  // Window applies to lead.created_at — counts the cohort created in this
  // window, regardless of when the reply/follow-up happened later.
  // Gemiddeld aantal opvolg-berichten voor leads die in de periode een
  // call kregen voorgesteld (call_proposed of call_scheduled). Geeft de
  // coach inzicht in messaging-efficiency: hoeveel berichten kost het je
  // gemiddeld om bij een call-voorstel te komen?
  async getRangeAvgFollowupsBeforeCall(coachId, startISO, endISO) {
    try {
      const CALL_KEYWORDS = ['voorgesteld', 'voorstel', 'sales call', 'ingepland', 'scheduled', 'booking', 'afspraak', 'meeting']
      const NEG = NEGATIVE_FUNNEL_WORDS
      const { data: moves, error } = await this.db.supabase
        .from('lead_movements')
        .select('lead_id, to_section_title, moved_at')
        .gte('moved_at', startISO)
        .lt('moved_at', endISO)
      if (error) throw error

      const callLeadIds = new Set()
      ;(moves || []).forEach(m => {
        const t = (m.to_section_title || '').toLowerCase()
        if (NEG.some(w => t.includes(w))) return
        if (CALL_KEYWORDS.some(k => t.includes(k))) callLeadIds.add(m.lead_id)
      })
      if (callLeadIds.size === 0) return { count: 0, avgFollowups: null }

      const { data: leads, error: leadErr } = await this.db.supabase
        .from('call_leads')
        .select('id, followup_count')
        .in('id', Array.from(callLeadIds))
        .eq('coach_id', coachId)
        .is('deleted_at', null)
      if (leadErr) throw leadErr

      const counts = (leads || []).map(l => Number(l.followup_count) || 0)
      if (counts.length === 0) return { count: 0, avgFollowups: null }
      const avg = counts.reduce((s, n) => s + n, 0) / counts.length
      return { count: counts.length, avgFollowups: Math.round(avg * 10) / 10 }
    } catch (e) {
      console.error('❌ getRangeAvgFollowupsBeforeCall failed:', e)
      return { count: 0, avgFollowups: null }
    }
  }

  async getRangeReactionStats(coachId, startISO, endISO) {
    try {
      // GEEN coach_id-filter: net als getRangeFunnelStats leunen we op RLS, zodat
      // ook de team-leads (toegevoegd door een andere coach in het team) meetellen.
      // Voorheen zag je 0 nieuwe leads als een teamgenoot ze had aangemaakt.
      //
      // COUNT-only queries i.p.v. rijen ophalen: een gewone .select() capt op
      // PostgREST's 1000-rijen-default, waardoor "Nieuwe leads" bij >1000 leads
      // in de periode bleef hangen op 1000. head:true + count:'exact' telt op de
      // server en kent die cap niet.
      const base = () => this.db.supabase
        .from('call_leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .is('deleted_at', null)

      const [
        { count: newCount, error: newErr },
        // "Reacted" = de lead heeft een first_reply_at stamp (ooit van 0→1
        // geklikt). Latere +'s op andere dagen bumpen reply_count maar
        // her-markeren deze metric niet — anders verwar je response-rate met
        // conversation-engagement.
        { count: reactedCount },
        { count: followedCount },
      ] = await Promise.all([
        base(),
        base().not('first_reply_at', 'is', null),
        base().gt('followup_count', 0),
      ])
      if (newErr) throw newErr
      const newLeads       = newCount     || 0
      const reactedLeads   = reactedCount || 0
      const followedLeads  = followedCount || 0
      const notReactedYet  = newLeads - reactedLeads
      // Follow-ups SENT in the window (regardless of lead creation date) —
      // uses last_followup_sent_at on every lead the coach owns.
      const { count: followupsInWindow } = await this.db.supabase
        .from('call_leads')
        .select('id', { count: 'exact', head: true })
        .gte('last_followup_sent_at', startISO)
        .lt('last_followup_sent_at', endISO)
        .is('deleted_at', null)
      // Reacties IN het venster (ongeacht aanmaakdatum) — telt elke lead die
      // in deze periode z'n eerste reactie kreeg (first_reply_at). Dit is de
      // juiste maat voor "reacties deze week/maand"; reactedLeads telt alleen
      // reacties op leads die óók in het venster zijn aangemaakt en mist dus
      // reacties op oudere leads.
      const { count: reactionsInWindow } = await this.db.supabase
        .from('call_leads')
        .select('id', { count: 'exact', head: true })
        .gte('first_reply_at', startISO)
        .lt('first_reply_at', endISO)
        .is('deleted_at', null)
      // Élke losse reactie in het venster (uit het reactie-logje) — telt ook
      // de 2e/3e reactie van dezelfde lead. Som van de delta's (zodat een
      // teruggeklikte misklik netjes wegvalt).
      let reactionEventsInWindow = 0
      try {
        const { data: rxEvents } = await this.db.supabase
          .from('lead_reaction_events')
          .select('delta')
          .gte('created_at', startISO)
          .lt('created_at', endISO)
        reactionEventsInWindow = (rxEvents || []).reduce((s, e) => s + (Number(e.delta) || 0), 0)
        if (reactionEventsInWindow < 0) reactionEventsInWindow = 0
      } catch (e) { console.warn('reaction events read failed:', e?.message) }
      return {
        newLeads,
        reactedLeads, notReactedYet, followedLeads,
        followupsInWindow: followupsInWindow || 0,
        reactionsInWindow: reactionsInWindow || 0,
        reactionEventsInWindow,
      }
    } catch (e) {
      console.error('❌ Get range reaction stats failed:', e)
      return { newLeads: 0, reactedLeads: 0, notReactedYet: 0, followedLeads: 0, followupsInWindow: 0, reactionsInWindow: 0, reactionEventsInWindow: 0 }
    }
  }

  // Count of leads where the most recent follow-up was sent today (date,
  // local time). Uses the denormalized `last_followup_sent_at` stamp the
  // KanbanCard writes on every + click. One lead = one entry per day (option 1
  // tradeoff — 2 follow-ups to same lead in 1 day still counts as 1).
  async getTodayFollowupCount(coachId) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count, error } = await this.db.supabase
        .from('call_leads')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .gte('last_followup_sent_at', today.toISOString())
      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('❌ Get today followup count failed:', error)
      return 0
    }
  }

  // Range version of getTodayActivity — same payload shape but for any
  // [start, end) window. `startISO` is the inclusive lower bound, `endISO`
  // the exclusive upper bound (both ISO strings, e.g. midnight boundaries).
  async getRangeActivity(coachId, startISO, endISO) {
    try {
      const { data: movements, error: movError } = await this.db.supabase
        .from('lead_movements')
        .select('*')
        .gte('moved_at', startISO)
        .lt('moved_at', endISO)
        .order('moved_at', { ascending: false })
      if (movError) throw movError

      const movementsBySection = {}
      const movementsList = []
      ;(movements || []).forEach(mov => {
        const toSection = mov.to_section_title || 'Unknown'
        const fromSection = mov.from_section_title || 'Niet toegewezen'
        if (!movementsBySection[toSection]) movementsBySection[toSection] = { count: 0, leads: [] }
        movementsBySection[toSection].count++
        movementsBySection[toSection].leads.push(mov.lead_id)
        movementsList.push({
          leadName: mov.lead_name || 'Unknown',
          leadId: mov.lead_id,
          from: fromSection, to: toSection,
          time: new Date(mov.moved_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        })
      })

      // Touches: any lead whose last_touched falls in this window. New
      // outreach = those whose created_at also falls inside; otherwise it's
      // a follow-up of an older lead.
      const { data: touchedLeads, error: touchError } = await this.db.supabase
        .from('call_leads')
        .select('id, first_name, last_name, created_at, last_touched, lead_source')
        .gte('last_touched', startISO)
        .lt('last_touched', endISO)
        .is('deleted_at', null)
      if (touchError) throw touchError

      const startT = new Date(startISO).getTime()
      const endT = new Date(endISO).getTime()
      const newOutreach = (touchedLeads || []).filter(l => {
        const t = new Date(l.created_at).getTime()
        return t >= startT && t < endT
      })
      const followUps = (touchedLeads || []).filter(l => {
        const t = new Date(l.created_at).getTime()
        return t < startT
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
      }
    } catch (error) {
      console.error('❌ Get range activity failed:', error)
      return {
        movements: [], movementsBySection: {}, totalMovements: 0,
        newOutreach: 0, followUps: 0, totalTouches: 0,
        touchedLeadIds: [], movementsList: [],
      }
    }
  }

  // Range version of getTodayFunnelStats.
  // Haalt ALLE movements in een window op, gepagineerd. Zonder dit kapt Supabase
  // op 1000 rijen (de nieuwste); bij veel stil-automation-verkeer (2000+/week)
  // vielen de echte funnel-movements erbuiten -> stats toonden maar ~3. (bugfix)
  async _fetchMovementsPaged(startISO, endISO = null, columns = '*') {
    const pageSize = 1000
    const rows = []
    for (let from = 0; ; from += pageSize) {
      let q = this.db.supabase
        .from('lead_movements')
        .select(columns)
        .gte('moved_at', startISO)
        .is('reverted_at', null)
        .order('moved_at', { ascending: false })
        .range(from, from + pageSize - 1)
      if (endISO) q = q.lt('moved_at', endISO)
      const { data, error } = await q
      if (error) throw error
      if (data && data.length) rows.push(...data)
      if (!data || data.length < pageSize) break
    }
    return rows
  }

  async getRangeFunnelStats(coachId, startISO, endISO) {
    try {
      // Nieuwste eerst → drill-down leest chronologisch; gepagineerd zodat de
      // 1000-rijen-cap de tellingen niet meer afknijpt.
      const movements = await this._fetchMovementsPaged(startISO, endISO, '*')
      // ORDER MATTERS — first match wins. We check `callProposed` ahead of
      // `callScheduled` so a section titled "Call voorgesteld" lands in the
      // proposed-bucket and "Sales Call" / "Ingepland" lands in the
      // scheduled-bucket. Generic 'call' is intentionally NOT in the
      // scheduled keywords because that would catch "Call voorgesteld" too.
      // `noShow` is tracked separately and checked BEFORE the negative-words
      // skip so we can count no-shows even though "no show" is in the
      // NEGATIVE_FUNNEL_WORDS exclusion list (used to keep them out of the
      // positive stages like `sale` / `callScheduled`).
      // Call afgewezen — negatief eindpunt op de call-fase. Apart geteld (met een
      // reden-breakdown), net als no-show.
      const REJECTED_KEYWORDS = ['afgewezen', 'geweigerd', 'call afgewezen', 'rejected']
      // Sale verloren — negatief eindpunt ná de call (objectie-breakdown). Apart
      // geteld, en VÓÓR de NEGATIVE_FUNNEL_WORDS-skip (die 'verloren'/'lost' bevat).
      const SALE_LOST_KEYWORDS = ['verloren', 'lost']
      // Niet geschikt — lead die geen goede fit is (coach diskwalificeert). Eigen
      // eindpunt + stat, apart geteld op moved_at.
      const NOT_SUITABLE_KEYWORDS = ['niet geschikt', 'ongeschikt', 'niet passend']
      const funnelKeywords = {
        replied:       ['replied', 'gereageerd', 'reactie', 'response', 'antwoord'],
        conversation:  ['gesprek', 'conversation', 'kwalificatie', 'qualified', 'interesse'],
        callProposed:  ['voorgesteld', 'voorstel'],
        callScheduled: ['sales call', 'ingepland', 'scheduled', 'booking', 'afspraak', 'meeting'],
        sale:          ['sale', 'verkocht', 'klant', 'client', 'gewonnen', 'won', 'deal'],
      }
      const funnel = {
        replied:       { count: 0, leads: [] },
        conversation:  { count: 0, leads: [] },
        callProposed:  { count: 0, leads: [] },
        callScheduled: { count: 0, happenedCount: 0, leads: [] },
        callBooked:    { count: 0, leads: [] },
        callHeld:      { count: 0, leads: [] },
        sale:          { count: 0, leads: [], omzet: 0 },
        noShow:        { count: 0, leads: [] },
        callRejected:  { count: 0, leads: [], reasons: {} },
        saleLost:      { count: 0, leads: [], reasons: {} },
        notSuitable:   { count: 0, leads: [] },
      }
      // Funnel-rang van een sectietitel (zelfde first-match-volgorde als de
      // funnelKeywords hieronder). Gebruikt om TERUGWAARTSE verplaatsingen niet
      // als een nieuwe funnel-stap te tellen: een lead die van 'Sales Call'
      // terug naar 'Call voorgesteld' wordt gesleept is géén nieuw voorstel.
      // 0 = pre-funnel/neutraal (insta, gesprek, stil, no-show, niet toegewezen).
      const stageRank = { replied: 1, conversation: 2, callProposed: 3, callScheduled: 4, sale: 5 }
      const rankOf = (title) => {
        const t = (title || '').toLowerCase()
        for (const [stage, keywords] of Object.entries(funnelKeywords)) {
          if (keywords.some(kw => t.includes(kw))) return stageRank[stage] || 0
        }
        return 0
      }
      // Per stap tellen we elke lead maximaal één keer binnen de periode, zodat
      // heen-en-weer geschuif of dubbele movements de teller niet opblazen.
      const seen = {
        replied: new Set(), conversation: new Set(), callProposed: new Set(),
        callScheduled: new Set(), sale: new Set(), callRejected: new Set(),
        saleLost: new Set(), notSuitable: new Set(),
      }

      // "Door wie" — resolve coach_id → naam voor de drill-down per stat. De
      // ingelogde coach (coachId) wordt "Jij", teamleden krijgen hun
      // profiles.full_name (bv. "Coach Horstink"). Best-effort: faalt dit, dan
      // valt het terug op een neutraal label.
      const coachIds = [...new Set((movements || []).map(m => m.coach_id).filter(Boolean))]
      const coachNameMap = {}
      if (coachIds.length) {
        try {
          const { data: profs } = await this.db.supabase
            .from('profiles').select('id, full_name').in('id', coachIds)
          ;(profs || []).forEach(p => { if (p.full_name) coachNameMap[p.id] = p.full_name })
        } catch (e) { console.warn('coach name lookup failed:', e?.message) }
      }
      const coachLabel = (cid) => {
        if (!cid) return 'Onbekend'
        if (coachId && cid === coachId) return 'Jij'
        return coachNameMap[cid] || 'Teamlid'
      }

      ;(movements || []).forEach(mov => {
        const toSection = (mov.to_section_title || '').toLowerCase()
        const fromRank = rankOf(mov.from_section_title)
        const leadId = mov.lead_id
        // Omzet: elke movement met een ingevulde order-waarde telt mee (die
        // wordt alleen bij een sale gezet). Vóór de early-returns zodat 'ie
        // altijd meetelt, ook als de sectie geen puur "Sale"-label heeft.
        if (mov.order_value != null) funnel.sale.omzet += Number(mov.order_value) || 0
        const leadInfo = {
          id: mov.id,  // movement-id → nodig om deze stat-regel terug te kunnen draaien
          leadId: mov.lead_id,
          name: mov.lead_name || 'Unknown',
          from: (mov.from_section_title || 'Unknown').trim(),
          to: (mov.to_section_title || '—').trim(),
          time: new Date(mov.moved_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          at: mov.moved_at,
          by: coachLabel(mov.coach_id),
        }
        // No-show wordt NIET meer hier (op moved_at) geteld, maar verderop op
        // call_date — zie het noShow-blok na de loop. No-Show-secties vallen door
        // naar de NEGATIVE_FUNNEL_WORDS-skip zodat ze niet in positieve stappen
        // belanden.
        if (REJECTED_KEYWORDS.some(kw => toSection.includes(kw))) {
          if (leadId && seen.callRejected.has(leadId)) return
          if (leadId) seen.callRejected.add(leadId)
          const reason = (mov.rejection_reason || '').trim() || 'Onbekend'
          funnel.callRejected.reasons[reason] = (funnel.callRejected.reasons[reason] || 0) + 1
          funnel.callRejected.count++
          funnel.callRejected.leads.push({ ...leadInfo, reason })
          return
        }
        if (SALE_LOST_KEYWORDS.some(kw => toSection.includes(kw))) {
          if (leadId && seen.saleLost.has(leadId)) return
          if (leadId) seen.saleLost.add(leadId)
          const reason = (mov.rejection_reason || '').trim() || 'Onbekend'
          funnel.saleLost.reasons[reason] = (funnel.saleLost.reasons[reason] || 0) + 1
          funnel.saleLost.count++
          funnel.saleLost.leads.push({ ...leadInfo, reason })
          return
        }
        if (NOT_SUITABLE_KEYWORDS.some(kw => toSection.includes(kw))) {
          if (leadId && seen.notSuitable.has(leadId)) return
          if (leadId) seen.notSuitable.add(leadId)
          funnel.notSuitable.count++
          funnel.notSuitable.leads.push(leadInfo)
          return
        }
        if (NEGATIVE_FUNNEL_WORDS.some(w => toSection.includes(w))) return
        for (const [stage, keywords] of Object.entries(funnelKeywords)) {
          if (keywords.some(kw => toSection.includes(kw))) {
            const toRank = stageRank[stage] || 0
            // Terugwaartse/laterale verplaatsing vanaf een gelijke of latere
            // stap → geen nieuwe funnel-stap, niet tellen.
            if (fromRank >= toRank) break
            // Unieke lead per stap.
            if (leadId && seen[stage].has(leadId)) break
            if (leadId) seen[stage].add(leadId)
            funnel[stage].count++
            funnel[stage].leads.push(leadInfo)
            if (stage === 'callScheduled') {
              const todayStr = new Date().toISOString().split('T')[0]
              if (!mov.call_date || mov.call_date <= todayStr) {
                funnel.callScheduled.happenedCount++
              }
            }
            break
          }
        }
      })

      // Call gevoerd — ingeplande calls die als "gevoerd" (Sale/Sale verloren)
      // zijn afgehandeld, geteld op de CALL-datum (niet moved_at) binnen de periode.
      try {
        const startDate = (startISO || '').split('T')[0]
        const endDate = (endISO || '').split('T')[0]
        if (startDate && endDate) {
          const { data: heldRows } = await this.db.supabase
            .from('lead_movements')
            .select('lead_id, lead_name, call_date')
            .eq('call_happened', true)
            .is('reverted_at', null)
            .gte('call_date', startDate).lte('call_date', endDate)
          const heldSeen = new Set()
          ;(heldRows || []).forEach(r => {
            if (r.lead_id && !heldSeen.has(r.lead_id)) {
              heldSeen.add(r.lead_id)
              funnel.callHeld.count++
              funnel.callHeld.leads.push({ leadId: r.lead_id, name: r.lead_name || 'Unknown', at: r.call_date })
            }
          })
        }
      } catch (e) { console.warn('callHeld count failed:', e?.message) }

      // No-show — ingeplande calls die niet-gevoerd waren, geteld op de CALL-datum
      // (net als callHeld), NIET op moved_at. Zo vervuilt het opruimen van oude
      // no-show-kaarten op het bord de week-stats niet meer. Per lead kijken we naar
      // de LAATSTE ingeplande call: een verplaatsing (reschedule) zet de oude call op
      // call_happened=false maar legt een nieuwe call vast — alleen als de láátste
      // ingeplande call niet-gevoerd is, telt de lead als no-show.
      try {
        const startDate = (startISO || '').split('T')[0]
        const endDate = (endISO || '').split('T')[0]
        if (startDate && endDate) {
          const { data: schedRows } = await this.db.supabase
            .from('lead_movements')
            .select('lead_id, lead_name, call_date, call_happened, moved_at, outcome_type')
            .not('call_date', 'is', null)
            .is('reverted_at', null)
          const latestByLead = new Map()
          ;(schedRows || []).forEach(r => {
            if (!r.lead_id) return
            const prev = latestByLead.get(r.lead_id)
            if (!prev || r.call_date > prev.call_date ||
                (r.call_date === prev.call_date && r.moved_at > prev.moved_at)) {
              latestByLead.set(r.lead_id, r)
            }
          })
          latestByLead.forEach(r => {
            const inPeriod = r.call_date >= startDate && r.call_date <= endDate
            // Calls geboekt = alle calls die op hun INGEPLANDE datum in de
            // periode vallen (gevoerd, no-show óf nog open) — per lead de
            // laatste ingeplande call, zodat verzette calls niet dubbel tellen.
            if (inPeriod) {
              funnel.callBooked.count++
              funnel.callBooked.leads.push({ leadId: r.lead_id, name: r.lead_name || 'Unknown', at: r.call_date })
            }
            // Afgezegde calls (outcome_type='cancelled') tellen NIET als no-show —
            // de lead heeft netjes afgezegd, niet "niet komen opdagen".
            if (r.call_happened === false && r.outcome_type !== 'cancelled' && inPeriod) {
              funnel.noShow.count++
              funnel.noShow.leads.push({ leadId: r.lead_id, name: r.lead_name || 'Unknown', at: r.call_date, to: 'No Show' })
            }
          })
        }
      } catch (e) { console.warn('noShow/booked count failed:', e?.message) }

      return funnel
    } catch (error) {
      console.error('❌ Get range funnel stats failed:', error)
      return {
        replied: { count: 0, leads: [] }, conversation: { count: 0, leads: [] },
        callProposed: { count: 0, leads: [] }, callScheduled: { count: 0, leads: [] },
        callBooked: { count: 0, leads: [] },
        callHeld: { count: 0, leads: [] },
        sale: { count: 0, leads: [], omzet: 0 }, noShow: { count: 0, leads: [] },
        callRejected: { count: 0, leads: [], reasons: {} },
        saleLost: { count: 0, leads: [], reasons: {} },
        notSuitable: { count: 0, leads: [] },
      }
    }
  }

  // Zet de order-waarde (omzet) op de meest recente movement van een lead —
  // aangeroepen wanneer een lead naar een sale-sectie is verplaatst.
  async setMovementOrderValue(leadId, orderValue, paymentType = null, durationMonths = null, partnerSharePct = undefined) {
    try {
      const { data: rows } = await this.db.supabase
        .from('lead_movements').select('id')
        .eq('lead_id', leadId).is('reverted_at', null)
        .order('moved_at', { ascending: false }).limit(1)
      const movId = rows?.[0]?.id
      if (!movId) return { error: 'geen movement gevonden' }
      const patch = { order_value: orderValue }
      // Betaalwijze (vooruitbetaald/maandelijks) + looptijd, zodat we later de
      // cashflow kunnen berekenen (wanneer komt hoeveel binnen).
      if (paymentType !== undefined) patch.payment_type = paymentType
      if (durationMonths !== undefined) patch.duration_months = durationMonths
      // Partner-aandeel (percentage). null/leeg = geen split.
      if (partnerSharePct !== undefined) {
        const pct = partnerSharePct === null || partnerSharePct === '' ? null : Number(partnerSharePct)
        patch.partner_share_pct = (pct != null && !isNaN(pct)) ? pct : null
      }
      const { error } = await this.db.supabase
        .from('lead_movements').update(patch).eq('id', movId)
      return { error }
    } catch (error) {
      console.error('❌ setMovementOrderValue failed:', error)
      return { error }
    }
  }

  // Zet de afwijzings-reden op de meest recente movement van een lead —
  // aangeroepen wanneer een lead naar een "Call afgewezen"-sectie is verplaatst.
  async setMovementRejectionReason(leadId, reason) {
    try {
      const { data: rows } = await this.db.supabase
        .from('lead_movements').select('id')
        .eq('lead_id', leadId).is('reverted_at', null)
        .order('moved_at', { ascending: false }).limit(1)
      const movId = rows?.[0]?.id
      if (!movId) return { error: 'geen movement gevonden' }
      const { error } = await this.db.supabase
        .from('lead_movements').update({ rejection_reason: reason || null }).eq('id', movId)
      return { error }
    } catch (error) {
      console.error('❌ setMovementRejectionReason failed:', error)
      return { error }
    }
  }

  // ── REVENUE / CASHFLOW ──────────────────────────────────────────────────
  // Berekent op basis van alle sales (order_value + payment_type + looptijd):
  //   - mrr:           maandelijks terugkerende omzet die NU loopt (som van de
  //                    maandbedragen van maandplannen die deze maand actief zijn)
  //   - activeMonthly: aantal lopende maandplannen
  //   - totalBooked:   totale geboekte contractwaarde (alle sales)
  //   - months:        cashflow-projectie per maand (vooruitbetaald = alles in de
  //                    sale-maand; maandelijks = totaal/looptijd, gespreid)
  async getRevenueProjection(coachId, monthsAhead = 12, monthsBehind = 5) {
    try {
      const { data } = await this.db.supabase
        .from('lead_movements')
        .select('order_value, payment_type, duration_months, moved_at')
        .not('order_value', 'is', null)
        .is('reverted_at', null)
      const sales = (data || []).map(r => ({
        total: Number(r.order_value) || 0,
        type: r.payment_type || 'prepaid',
        months: Math.max(1, Number(r.duration_months) || 1),
        date: new Date(r.moved_at),
      })).filter(s => s.total > 0 && !isNaN(s.date?.getTime?.()))

      const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const startOfMonth = (d, add = 0) => new Date(d.getFullYear(), d.getMonth() + add, 1)

      // Cashflow per maand opbouwen.
      const cash = {}
      sales.forEach(s => {
        if (s.type === 'monthly' && s.months > 1) {
          const per = s.total / s.months
          for (let i = 0; i < s.months; i++) {
            const k = monthKey(startOfMonth(s.date, i))
            cash[k] = (cash[k] || 0) + per
          }
        } else {
          const k = monthKey(s.date)
          cash[k] = (cash[k] || 0) + s.total
        }
      })

      // MRR nu + actieve maandplannen (maandplannen die deze maand nog lopen).
      const now = new Date()
      const curMonth = startOfMonth(now)
      let mrr = 0, activeMonthly = 0
      sales.forEach(s => {
        if (s.type === 'monthly' && s.months > 1) {
          const start = startOfMonth(s.date)
          const end = startOfMonth(s.date, s.months) // exclusief
          if (curMonth >= start && curMonth < end) { mrr += s.total / s.months; activeMonthly++ }
        }
      })

      const totalBooked = sales.reduce((a, s) => a + s.total, 0)

      // Reeks: monthsBehind terug (gerealiseerd) t/m monthsAhead vooruit (projectie).
      const months = []
      for (let i = -monthsBehind; i < monthsAhead; i++) {
        const d = startOfMonth(now, i)
        const k = monthKey(d)
        months.push({
          key: k,
          label: d.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }),
          amount: Math.round(cash[k] || 0),
          isPast: i < 0,
          isCurrent: i === 0,
        })
      }

      return { mrr: Math.round(mrr), activeMonthly, totalBooked: Math.round(totalBooked), months, saleCount: sales.length }
    } catch (error) {
      console.error('❌ getRevenueProjection failed:', error)
      return { mrr: 0, activeMonthly: 0, totalBooked: 0, months: [], saleCount: 0 }
    }
  }

  // Man/vrouw-verdeling over alle (niet-verwijderde) leads. Geslacht is een
  // eigenschap van de lead, dus niet periode-gebonden. Retourneert aantallen +
  // percentages; 'unknown' = nog niet ingevuld.
  async getGenderBreakdown(coachId) {
    try {
      // Tellen via head-count queries i.p.v. rijen ophalen — anders kapt de
      // 1000-rijen-cap van PostgREST de telling af (bij 4000+ leads zag de app
      // maar een fractie van de ingevulde geslachten).
      const base = () => this.db.supabase.from('call_leads').select('*', { count: 'exact', head: true }).is('deleted_at', null)
      const [totalRes, maleRes, femaleRes] = await Promise.all([
        base(),
        base().eq('gender', 'male'),
        base().eq('gender', 'female'),
      ])
      const total = totalRes.count || 0
      const male = maleRes.count || 0
      const female = femaleRes.count || 0
      const known = male + female
      return {
        male, female, unknown: Math.max(0, total - known), total, known,
        malePct: known ? Math.round((male / known) * 100) : null,
        femalePct: known ? Math.round((female / known) * 100) : null,
      }
    } catch (e) {
      console.warn('getGenderBreakdown failed:', e?.message)
      return { male: 0, female: 0, unknown: 0, total: 0, known: 0, malePct: null, femalePct: null }
    }
  }

  // Rapport van alle 'call voorgesteld'-berichten + of ze geslaagd zijn (lead
  // bereikte de Sales Call-fase of verder ná het voorstel). Via RPC (server-side).
  async getCallProposalsReport(coachId) {
    try {
      if (!coachId) return { total: 0, reached: 0, pct: null, items: [] }
      const { data, error } = await this.db.supabase.rpc('get_call_proposals_report', { p_coach: coachId })
      if (error) throw error
      const items = (data || []).map(r => ({
        leadId: r.lead_id,
        name: r.lead_name || 'Onbekend',
        proposedAt: r.proposed_at,
        reached: r.reached === true,
        currentSection: r.current_section || 'Niet toegewezen',
        subject: r.subject || null,
        content: r.content || '',
      }))
      const reached = items.filter(i => i.reached).length
      return {
        total: items.length,
        reached,
        pct: items.length ? Math.round((reached / items.length) * 100) : null,
        items,
      }
    } catch (e) {
      console.warn('getCallProposalsReport failed:', e?.message)
      return { total: 0, reached: 0, pct: null, items: [] }
    }
  }

  // Rol van de ingelogde coach in z'n team: 'owner' | 'member' | null (solo).
  // Bepaalt wie de omzet/uitbetaal-cijfers mag zien (alleen owner/solo).
  async getMyTeamRole() {
    try {
      const { data, error } = await this.db.supabase.rpc('my_team_role')
      if (error) throw error
      return data || null
    } catch (e) {
      console.warn('getMyTeamRole failed:', e?.message)
      return null
    }
  }

  // ── PARTNER-UITBETALING ─────────────────────────────────────────────────
  // Berekent per maand wat er aan de partner (bv. Marcel) toekomt: van elke
  // sale met een partner_share_pct wordt dat % van de maand-cashflow genomen
  // (vooruitbetaald = alles in de sale-maand; maandelijks = per termijn gespreid,
  // exact zoals getRevenueProjection de omzet spreidt). Vervolgens trekken we af
  // wat er al is uitbetaald (partner_payouts.amount_paid) → openstaand per maand.
  async getPartnerPayouts(coachId, monthsBehind = 5, monthsAhead = 6, fixedCosts = 250) {
    try {
      if (!coachId) return { months: [], totalOutstanding: 0 }
      const FIXED = Math.max(0, Number(fixedCosts) || 0)
      const [{ data: saleRows }, { data: paidRows }] = await Promise.all([
        this.db.supabase
          .from('lead_movements')
          .select('order_value, payment_type, duration_months, moved_at, partner_share_pct')
          .not('order_value', 'is', null)
          .not('partner_share_pct', 'is', null)
          .is('reverted_at', null),
        // Geen coach-filter: RLS geeft je eigen rijen + die van teamgenoten
        // (de owner zet de betaal-status; teamleden lezen 'm mee).
        this.db.supabase
          .from('partner_payouts')
          .select('period, amount_paid, paid_at'),
      ])

      const sales = (saleRows || []).map(r => ({
        total: Number(r.order_value) || 0,
        type: r.payment_type || 'prepaid',
        months: Math.max(1, Number(r.duration_months) || 1),
        pct: Number(r.partner_share_pct) || 0,
        date: new Date(r.moved_at),
      })).filter(s => s.total > 0 && s.pct > 0 && !isNaN(s.date?.getTime?.()))

      const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const startOfMonth = (d, add = 0) => new Date(d.getFullYear(), d.getMonth() + add, 1)

      // Per maand: BRUTO omzet (van de split-sales) én het bruto partner-aandeel
      // opbouwen (zelfde spreiding als de omzet). De vaste lasten trekken we
      // hierna per maand van de omzet af vóór de split.
      const owedGross = {}
      const revenue = {}
      sales.forEach(s => {
        const share = s.pct / 100
        if (s.type === 'monthly' && s.months > 1) {
          const perRev = s.total / s.months
          for (let i = 0; i < s.months; i++) {
            const k = monthKey(startOfMonth(s.date, i))
            revenue[k] = (revenue[k] || 0) + perRev
            owedGross[k] = (owedGross[k] || 0) + perRev * share
          }
        } else {
          const k = monthKey(s.date)
          revenue[k] = (revenue[k] || 0) + s.total
          owedGross[k] = (owedGross[k] || 0) + s.total * share
        }
      })

      // Vaste lasten er eerst af, DAN verdelen: het partner-aandeel wordt
      // berekend over (omzet − vaste lasten). Bij meerdere %-en schaalt elk
      // aandeel evenredig mee (netto-factor = (omzet−lasten)/omzet).
      const owed = {}
      Object.keys(revenue).forEach(k => {
        const rev = revenue[k]
        const net = Math.max(0, rev - FIXED)
        const factor = rev > 0 ? net / rev : 0
        owed[k] = (owedGross[k] || 0) * factor
      })

      // Al uitbetaald per maand.
      const paid = {}
      const paidAt = {}
      ;(paidRows || []).forEach(r => {
        const d = new Date(r.period)
        const k = monthKey(d)
        paid[k] = (paid[k] || 0) + (Number(r.amount_paid) || 0)
        paidAt[k] = r.paid_at
      })

      const now = new Date()
      const months = []
      let totalOutstanding = 0
      for (let i = -monthsBehind; i < monthsAhead; i++) {
        const d = startOfMonth(now, i)
        const k = monthKey(d)
        const owedM = Math.round((owed[k] || 0) * 100) / 100
        const paidM = Math.round((paid[k] || 0) * 100) / 100
        const outstanding = Math.round((owedM - paidM) * 100) / 100
        // Alleen maanden met iets te verdelen tonen (owed > 0 of al betaald).
        if (owedM <= 0 && paidM <= 0) continue
        if (i <= 0) totalOutstanding += Math.max(0, outstanding)
        const revM = Math.round((revenue[k] || 0) * 100) / 100
        months.push({
          key: k,
          label: d.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }),
          owed: owedM,
          paid: paidM,
          outstanding,
          settled: outstanding <= 0.005 && owedM > 0,
          paidAt: paidAt[k] || null,
          revenue: revM,                                       // bruto omzet die maand
          fixedCosts: revM > 0 ? Math.min(FIXED, revM) : 0,    // afgetrokken vaste lasten
          netRevenue: Math.max(0, Math.round((revM - FIXED) * 100) / 100), // te verdelen
          isPast: i < 0,
          isCurrent: i === 0,
        })
      }
      return { months, totalOutstanding: Math.round(totalOutstanding * 100) / 100, fixedCosts: FIXED }
    } catch (error) {
      console.error('❌ getPartnerPayouts failed:', error)
      return { months: [], totalOutstanding: 0 }
    }
  }

  // Markeer een maand als (volledig) uitbetaald: zet amount_paid op het bedrag
  // dat op dat moment openstaat (owedNow), zodat de maand op €0 openstaand komt.
  // Komt er later nog een sale in die maand bij, dan wordt owed > paid en
  // verschijnt alleen dat nieuwe stukje opnieuw als openstaand.
  async settlePartnerMonth(coachId, periodKey, owedNow) {
    try {
      if (!coachId || !periodKey) return { error: 'coach/periode ontbreekt' }
      const period = `${periodKey}-01` // YYYY-MM → YYYY-MM-01
      const { error } = await this.db.supabase
        .from('partner_payouts')
        .upsert(
          { coach_id: coachId, period, amount_paid: Number(owedNow) || 0, paid_at: new Date().toISOString() },
          { onConflict: 'coach_id,period' }
        )
      return { error }
    } catch (error) {
      console.error('❌ settlePartnerMonth failed:', error)
      return { error }
    }
  }

  // Draai een uitbetaling terug (maand weer als openstaand tonen).
  async unsettlePartnerMonth(coachId, periodKey) {
    try {
      if (!coachId || !periodKey) return { error: 'coach/periode ontbreekt' }
      const period = `${periodKey}-01`
      const { error } = await this.db.supabase
        .from('partner_payouts')
        .delete().eq('coach_id', coachId).eq('period', period)
      return { error }
    } catch (error) {
      console.error('❌ unsettlePartnerMonth failed:', error)
      return { error }
    }
  }

  // ── KPI-DOELEN ──────────────────────────────────────────────────────────
  // Per coach een dag- én week-doel per stat (lead_kpi_targets). Retourneert
  // een map { stat_key: { day, week } } zodat de stats-bar en -modal 'm direct
  // kunnen gebruiken. Faalt de query, dan geven we een lege map terug.
  async getKpiTargets(coachId) {
    try {
      if (!coachId) return {}
      const { data, error } = await this.db.supabase
        .from('lead_kpi_targets')
        .select('stat_key, day_target, week_target')
        .eq('coach_id', coachId)
      if (error) throw error
      const map = {}
      ;(data || []).forEach(r => {
        map[r.stat_key] = {
          day: r.day_target != null ? Number(r.day_target) : null,
          week: r.week_target != null ? Number(r.week_target) : null,
        }
      })
      return map
    } catch (error) {
      console.error('❌ getKpiTargets failed:', error)
      return {}
    }
  }

  // Slaat een lijst doelen op: [{ stat_key, day_target, week_target }, ...].
  // Upsert per (coach_id, stat_key); lege waarden worden als null bewaard.
  async saveKpiTargets(coachId, targets) {
    try {
      if (!coachId || !Array.isArray(targets)) return { error: 'ongeldige input' }
      const rows = targets.map(t => ({
        coach_id: coachId,
        stat_key: t.stat_key,
        day_target: (t.day_target === '' || t.day_target == null) ? null : Number(t.day_target),
        week_target: (t.week_target === '' || t.week_target == null) ? null : Number(t.week_target),
        updated_at: new Date().toISOString(),
      }))
      const { error } = await this.db.supabase
        .from('lead_kpi_targets')
        .upsert(rows, { onConflict: 'coach_id,stat_key' })
      return { error }
    } catch (error) {
      console.error('❌ saveKpiTargets failed:', error)
      return { error }
    }
  }

  // Draai één funnel-verplaatsing terug vanuit de stats-drill-down. We zetten
  // een soft-stempel (reverted_at) zodat de movement uit de tellingen verdwijnt
  // maar de rij bewaard blijft (omkeerbaar). Bij terugdraaien wordt de lead OOK
  // fysiek teruggezet naar de sectie waar 'ie vandaan kwam (from_section_id) —
  // maar alleen als 'ie sindsdien niet ergens anders heen is verplaatst. Het bord
  // ververst vanzelf via de realtime-subscription op lead_section_items.
  // Geef revert=false mee om het terugdraaien ongedaan te maken (alleen stats).
  async revertMovement(movementId, revert = true) {
    try {
      if (!movementId) return { success: false, error: 'geen movement-id' }

      // Movement ophalen — nodig om de lead terug te kunnen plaatsen.
      const { data: mov } = await this.db.supabase
        .from('lead_movements')
        .select('lead_id, from_section_id, from_section_title, to_section_id, to_section_title')
        .eq('id', movementId)
        .maybeSingle()

      // Soft-stempel voor de statistiek.
      const { error } = await this.db.supabase
        .from('lead_movements')
        .update({ reverted_at: revert ? new Date().toISOString() : null })
        .eq('id', movementId)
      if (error) throw error

      // Kaart fysiek terugzetten naar de vorige sectie (alleen bij terugdraaien).
      let movedBack = false
      if (revert && mov?.lead_id && mov?.from_section_id) {
        const { data: cur } = await this.db.supabase
          .from('lead_section_items')
          .select('section_id')
          .eq('lead_id', mov.lead_id)
          .maybeSingle()
        // Alleen terugzetten als 'ie nog in de doelsectie van deze move staat.
        if (cur && cur.section_id === mov.to_section_id) {
          const { error: moveErr } = await this.db.supabase
            .from('lead_section_items')
            .update({
              section_id: mov.from_section_id,
              position: 0,
              moved_at: new Date().toISOString(),
              previous_section_id: mov.to_section_id,
              previous_section_title: mov.to_section_title || null,
              previous_section_color: null,
              moved_to_stale_at: null,
            })
            .eq('lead_id', mov.lead_id)
          if (moveErr) console.warn('Revert: kaart terugzetten mislukt:', moveErr.message)
          else movedBack = true
        }
      }

      return { success: true, reverted: revert, movedBack }
    } catch (error) {
      console.error('❌ Revert movement failed:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteMovement(movementId) {
    try {
      if (!movementId) return { success: false, error: 'geen movement-id' }
      const { error } = await this.db.supabase
        .from('lead_movements')
        .delete()
        .eq('id', movementId)
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('❌ Delete movement failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Breakdown of new leads grouped by source within [start, end). Returns
  // two arrays — by outreach campaign and by lead magnet — each with
  // counts of total new leads in the window and how many of those reached
  // a call sectie (call_proposed or call_scheduled).
  async getRangeLeadSources(coachId, startISO, endISO) {
    try {
      // Pull leads created in the window. Gepagineerd (i.p.v. de 1000-rijen-cap
      // van PostgREST) — anders miste de bron-breakdown bij >1000 nieuwe leads
      // het grootste deel (bv. de "geen bron"-groep alleen al >1900/maand). Geen
      // coach_id-filter → RLS neemt ook team-leads mee, net als de andere stats.
      const leads = await this._fetchAllRows(() => this.db.supabase
        .from('call_leads')
        .select('id, created_at, outreach_campaign_id, source_lead_magnet_id, followup_count, reply_count, first_reply_at')
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .is('deleted_at', null))

      const leadIds = (leads || []).map(l => l.id)

      // Per-lead stage flags so we can break down each source by funnel
      // stage. Order matters: callProposed is checked BEFORE callScheduled
      // (same convention as getRangeFunnelStats) so "Call voorgesteld"
      // doesn't accidentally count as scheduled.
      const stageKeywords = [
        { key: 'replied',       words: ['replied', 'gereageerd', 'reactie', 'response', 'antwoord'] },
        { key: 'callProposed',  words: ['voorgesteld', 'voorstel'] },
        { key: 'callScheduled', words: ['sales call', 'ingepland', 'scheduled', 'booking', 'afspraak', 'meeting'] },
        { key: 'sale',          words: ['sale', 'verkocht', 'klant', 'client', 'gewonnen', 'won', 'deal'] },
      ]
      // perLeadStages[leadId] = { replied, callProposed, callScheduled, sale }
      const perLeadStages = new Map()
      const reachedCall = new Set()
      if (leadIds.length > 0) {
        // Chunk de .in()-query — met duizenden lead-ids wordt de URL anders te
        // lang. Per batch de movements in het venster ophalen.
        const moves = []
        for (let i = 0; i < leadIds.length; i += 300) {
          const chunk = leadIds.slice(i, i + 300)
          const { data } = await this.db.supabase
            .from('lead_movements')
            .select('lead_id, to_section_title, moved_at')
            .in('lead_id', chunk)
            .gte('moved_at', startISO)
            .lt('moved_at', endISO)
          if (data) moves.push(...data)
        }
        ;(moves || []).forEach(m => {
          const t = (m.to_section_title || '').toLowerCase()
          if (NEGATIVE_FUNNEL_WORDS.some(w => t.includes(w))) return
          for (const stage of stageKeywords) {
            if (stage.words.some(k => t.includes(k))) {
              const entry = perLeadStages.get(m.lead_id) || { replied: 0, callProposed: 0, callScheduled: 0, sale: 0 }
              entry[stage.key] = 1
              perLeadStages.set(m.lead_id, entry)
              if (stage.key === 'callProposed' || stage.key === 'callScheduled') {
                reachedCall.add(m.lead_id)
              }
              break
            }
          }
        })
      }

      // Lookup names for campaigns + magnets we actually touched
      const campIds = [...new Set((leads || []).map(l => l.outreach_campaign_id).filter(Boolean))]
      const magnetIds = [...new Set((leads || []).map(l => l.source_lead_magnet_id).filter(Boolean))]
      const [{ data: camps }, { data: mags }] = await Promise.all([
        campIds.length ? this.db.supabase.from('outreach_campaigns').select('id, name, variant_tag, message_text, platform, purpose').in('id', campIds) : { data: [] },
        magnetIds.length ? this.db.supabase.from('lead_magnets').select('id, name, description').in('id', magnetIds) : { data: [] },
      ])
      const campMap = new Map((camps || []).map(c => [c.id, c]))
      const magMap = new Map((mags || []).map(m => [m.id, m]))

      const campStats = new Map() // id → { name, total, reached }
      const magStats = new Map()
      let noSourceTotal = 0
      let noSourceReached = 0

      const emptyStages = () => ({ replied: 0, callProposed: 0, callScheduled: 0, sale: 0 })
      const noSourceStages = emptyStages()
      let noSourceFollowups = 0
      let noSourceReplied = 0
      let noSourceFollowed = 0
      ;(leads || []).forEach(l => {
        const stages = perLeadStages.get(l.id) || emptyStages()
        const reached = reachedCall.has(l.id) ? 1 : 0
        const fc = l.followup_count || 0
        // Source breakdown — count a lead as "responded" only on the
        // first-reply stamp, same convention as the global metrics.
        const repliedOne = l.first_reply_at ? 1 : 0
        const followedOne = fc > 0 ? 1 : 0
        if (l.outreach_campaign_id) {
          const c = campMap.get(l.outreach_campaign_id)
          const entry = campStats.get(l.outreach_campaign_id) || {
            id: l.outreach_campaign_id,
            name: c ? `${c.name}${c.variant_tag ? ` · ${c.variant_tag}` : ''}` : 'Onbekende campagne',
            messageText: c?.message_text || null,
            platform: c?.platform || null,
            purpose: c?.purpose || null,
            total: 0, reached: 0, followupCount: 0,
            repliedLeads: 0, followedLeads: 0,
            stages: emptyStages(),
          }
          entry.total += 1
          entry.reached += reached
          entry.followupCount += fc
          entry.repliedLeads  += repliedOne
          entry.followedLeads += followedOne
          entry.stages.replied       += stages.replied
          entry.stages.callProposed  += stages.callProposed
          entry.stages.callScheduled += stages.callScheduled
          entry.stages.sale          += stages.sale
          campStats.set(l.outreach_campaign_id, entry)
        } else if (l.source_lead_magnet_id) {
          const m = magMap.get(l.source_lead_magnet_id)
          const entry = magStats.get(l.source_lead_magnet_id) || {
            id: l.source_lead_magnet_id,
            name: m?.name || 'Onbekende lead magnet',
            description: m?.description || null,
            total: 0, reached: 0, followupCount: 0,
            repliedLeads: 0, followedLeads: 0,
            stages: emptyStages(),
          }
          entry.total += 1
          entry.reached += reached
          entry.followupCount += fc
          entry.repliedLeads  += repliedOne
          entry.followedLeads += followedOne
          entry.stages.replied       += stages.replied
          entry.stages.callProposed  += stages.callProposed
          entry.stages.callScheduled += stages.callScheduled
          entry.stages.sale          += stages.sale
          magStats.set(l.source_lead_magnet_id, entry)
        } else {
          noSourceTotal += 1
          noSourceReached += reached
          noSourceFollowups += fc
          noSourceReplied  += repliedOne
          noSourceFollowed += followedOne
          noSourceStages.replied       += stages.replied
          noSourceStages.callProposed  += stages.callProposed
          noSourceStages.callScheduled += stages.callScheduled
          noSourceStages.sale          += stages.sale
        }
      })

      const sortByTotal = (a, b) => b.total - a.total
      return {
        campaigns: [...campStats.values()].sort(sortByTotal),
        magnets:   [...magStats.values()].sort(sortByTotal),
        noSource:  {
          total: noSourceTotal, reached: noSourceReached,
          followupCount: noSourceFollowups,
          repliedLeads: noSourceReplied, followedLeads: noSourceFollowed,
          stages: noSourceStages,
        },
        totalLeads: (leads || []).length,
        totalFollowups: (leads || []).reduce((sum, l) => sum + (l.followup_count || 0), 0),
      }
    } catch (error) {
      console.error('❌ Get range lead sources failed:', error)
      return { campaigns: [], magnets: [], noSource: { total: 0, reached: 0 }, totalLeads: 0 }
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
      // Use COUNT-only queries to avoid PostgREST's 1000-row default cap.
      const base = () => this.db.supabase
        .from('call_leads')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)

      const [
        { count: total },
        { count: newCount },
        { count: contacted },
        { count: scheduled },
        { count: converted },
      ] = await Promise.all([
        base(),
        base().eq('status', 'new'),
        base().eq('status', 'contacted'),
        base().eq('status', 'scheduled'),
        base().eq('status', 'converted'),
      ])

      return {
        total_leads:     total     || 0,
        new_leads:       newCount  || 0,
        contacted_leads: contacted || 0,
        scheduled_leads: scheduled || 0,
        converted_leads: converted || 0,
        conversion_rate: total > 0 ? Math.round(((converted || 0) / total) * 100) : 0,
        leads_by_source: {},
      }
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
      
      const [{ data: previousSection }, { data: lead }] = await Promise.all([
        this.db.supabase
          .from('lead_sections')
          .select('id, title, color')
          .eq('id', sectionItem.previous_section_id)
          .single(),
        this.db.supabase
          .from('call_leads')
          .select('first_name, last_name')
          .eq('id', leadId)
          .single()
      ])

      if (!previousSection) return { restored: false }

      const leadName = `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim() || 'Unknown'

      await Promise.all([
        this.db.supabase.from('lead_section_items').update({
          section_id: sectionItem.previous_section_id,
          previous_section_id: null, previous_section_title: null,
          previous_section_color: null, moved_to_stale_at: null, position: 0
        }).eq('id', sectionItem.id),
        this.db.supabase.from('lead_movements').insert({
          lead_id: leadId, from_section_id: sectionItem.section_id,
          to_section_id: sectionItem.previous_section_id,
          coach_id: coachId, moved_at: new Date().toISOString(),
          lead_name: leadName, outcome_type: 'restored_from_stale'
        })
      ])

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
