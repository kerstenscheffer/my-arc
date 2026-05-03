// src/modules/output-planning/ContentPlanningService.js
// COMPLETE v3.0 - Content Planning Service
// 
// Two systems in one:
// 1. content_items = Original scripts/ideas (for Content tab, VideoBlueprint)
// 2. content_pieces + output_day_items = Scheduling system (for Week Planning)
//
// content_pieces.source_content_id links to content_items for script viewing

class ContentPlanningService {
  constructor(supabase) {
    this.supabase = supabase
  }

  // ============================================
  // HELPER: Format date without timezone issues
  // ============================================
  
  formatDate(date) {
    if (!date) return null
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // ============================================
  // ============================================
  // PART 1: CONTENT ITEMS (Original Scripts/Ideas)
  // Used by: Content tab, VideoBlueprint, BatchModal
  // ============================================
  // ============================================

  async getContentItems(coachId, filters = {}) {
    try {
      let query = this.supabase
        .from('content_items')
        .select('*')
        .eq('coach_id', coachId)
        .order('planned_date', { ascending: true, nullsFirst: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.weekStart && filters.weekEnd) {
        query = query
          .gte('planned_date', filters.weekStart)
          .lte('planned_date', filters.weekEnd)
      }
      if (filters.isTemplate !== undefined) {
        query = query.eq('is_template', filters.isTemplate)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get content items failed:', error)
      return []
    }
  }

  async getContentForWeek(coachId, mondayDate) {
    try {
      const weekStart = this.formatDate(mondayDate)
      const weekEnd = new Date(mondayDate)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const { data, error } = await this.supabase
        .from('content_items')
        .select('*')
        .eq('coach_id', coachId)
        .gte('planned_date', weekStart)
        .lte('planned_date', this.formatDate(weekEnd))
        .order('planned_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get week content failed:', error)
      return []
    }
  }

  async getContentIdeas(coachId) {
    try {
      const { data, error } = await this.supabase
        .from('content_items')
        .select('*')
        .eq('coach_id', coachId)
        .eq('status', 'idea')
        .is('planned_date', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get content ideas failed:', error)
      return []
    }
  }

  async getBatchItems(coachId, mondayDate) {
    try {
      const weekStart = this.formatDate(mondayDate)
      const weekEnd = new Date(mondayDate)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const { data, error } = await this.supabase
        .from('content_items')
        .select('*')
        .eq('coach_id', coachId)
        .gte('planned_date', weekStart)
        .lte('planned_date', this.formatDate(weekEnd))
        .in('status', ['planned', 'idea'])
        .neq('type', 'story')
        .order('planned_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get batch items failed:', error)
      return []
    }
  }

  async createContentItem(coachId, itemData) {
    try {
      const { data, error } = await this.supabase
        .from('content_items')
        .insert({
          coach_id: coachId,
          title: itemData.title,
          type: itemData.type,
          category: itemData.category || null,
          hook: itemData.hook || null,
          script: itemData.script || null,
          notes: itemData.notes || null,
          planned_date: itemData.planned_date || null,
          planned_time: itemData.planned_time || null,
          day_of_week: itemData.day_of_week || null,
          status: itemData.status || 'idea',
          is_template: itemData.is_template || false,
          template_name: itemData.template_name || null
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Content item created:', data.title)
      return data
    } catch (error) {
      console.error('❌ Create content item failed:', error)
      throw error
    }
  }

  async updateContentItem(itemId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('content_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Content item updated:', itemId)
      return data
    } catch (error) {
      console.error('❌ Update content item failed:', error)
      throw error
    }
  }

  async updateContentStatus(itemId, status) {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'posted') {
        updates.posted_at = new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('content_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Content status updated:', status)
      return data
    } catch (error) {
      console.error('❌ Update content status failed:', error)
      throw error
    }
  }

  async deleteContentItemById(itemId) {
    try {
      const { error } = await this.supabase
        .from('content_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      console.log('✅ Content item deleted:', itemId)
      return true
    } catch (error) {
      console.error('❌ Delete content item failed:', error)
      throw error
    }
  }

  async scheduleContent(itemId, date, time = null) {
    try {
      const dayOfWeek = new Date(date).getDay()
      
      const { data, error } = await this.supabase
        .from('content_items')
        .update({
          planned_date: date,
          planned_time: time,
          day_of_week: dayOfWeek,
          status: 'planned',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Content scheduled:', date)
      return data
    } catch (error) {
      console.error('❌ Schedule content failed:', error)
      throw error
    }
  }

  // ============================================
  // CONTENT ITEMS: Templates
  // ============================================

  async getContentTemplates(coachId) {
    try {
      const { data, error } = await this.supabase
        .from('content_items')
        .select('*')
        .eq('coach_id', coachId)
        .eq('is_template', true)
        .order('template_name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get templates failed:', error)
      return []
    }
  }

  async createFromTemplate(coachId, templateId, plannedDate) {
    try {
      const { data: template, error: templateError } = await this.supabase
        .from('content_items')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError) throw templateError

      const newItem = await this.createContentItem(coachId, {
        title: template.title,
        type: template.type,
        category: template.category,
        hook: template.hook,
        script: template.script,
        notes: template.notes,
        planned_date: plannedDate,
        day_of_week: new Date(plannedDate).getDay(),
        status: 'planned',
        is_template: false
      })

      return newItem
    } catch (error) {
      console.error('❌ Create from template failed:', error)
      throw error
    }
  }

  // ============================================
  // CONTENT ITEMS: Bulk Operations
  // ============================================

  async seedWeekWithDefaults(coachId, mondayDate) {
    try {
      const defaultSchedule = [
        { dayOffset: 0, type: 'reel', category: 'lifestyle', title: 'Reel: Day in my life' },
        { dayOffset: 2, type: 'carousel', category: 'educational', title: 'Carousel: Educatief' },
        { dayOffset: 3, type: 'reel', category: 'relatable', title: 'Reel: Relatable moment' },
        { dayOffset: 4, type: 'post', category: 'social_proof', title: 'Post: Transformatie/Social Proof' }
      ]

      const items = []
      for (const schedule of defaultSchedule) {
        const date = new Date(mondayDate)
        date.setDate(date.getDate() + schedule.dayOffset)

        const item = await this.createContentItem(coachId, {
          title: schedule.title,
          type: schedule.type,
          category: schedule.category,
          planned_date: this.formatDate(date),
          day_of_week: date.getDay(),
          status: 'planned'
        })
        items.push(item)
      }

      console.log('✅ Week seeded with', items.length, 'items')
      return items
    } catch (error) {
      console.error('❌ Seed week failed:', error)
      throw error
    }
  }

  async duplicateWeekContent(coachId, fromMonday, toMonday) {
    try {
      const sourceContent = await this.getContentForWeek(coachId, fromMonday)
      const dayDiff = Math.round((toMonday - fromMonday) / (1000 * 60 * 60 * 24))
      
      const newItems = []
      for (const item of sourceContent) {
        if (item.is_template) continue

        const newDate = new Date(item.planned_date)
        newDate.setDate(newDate.getDate() + dayDiff)

        const newItem = await this.createContentItem(coachId, {
          title: item.title,
          type: item.type,
          category: item.category,
          hook: item.hook,
          script: item.script,
          notes: item.notes,
          planned_date: this.formatDate(newDate),
          day_of_week: newDate.getDay(),
          status: 'planned'
        })
        newItems.push(newItem)
      }

      console.log('✅ Week duplicated:', newItems.length, 'items')
      return newItems
    } catch (error) {
      console.error('❌ Duplicate week failed:', error)
      throw error
    }
  }

  // ============================================
  // CONTENT ITEMS: Analytics
  // ============================================

  async getContentItemStats(coachId, mondayDate) {
    try {
      const weekContent = await this.getContentForWeek(coachId, mondayDate)

      const stats = {
        total: weekContent.length,
        byStatus: { idea: 0, planned: 0, created: 0, posted: 0 },
        byType: { reel: 0, carousel: 0, post: 0, story: 0 },
        completionRate: 0
      }

      weekContent.forEach(item => {
        if (stats.byStatus[item.status] !== undefined) {
          stats.byStatus[item.status]++
        }
        if (stats.byType[item.type] !== undefined) {
          stats.byType[item.type]++
        }
      })

      const completed = stats.byStatus.created + stats.byStatus.posted
      stats.completionRate = stats.total > 0 
        ? Math.round((completed / stats.total) * 100) 
        : 0

      return stats
    } catch (error) {
      console.error('❌ Get week stats failed:', error)
      return null
    }
  }

  async getContentAnalytics(coachId, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.supabase
        .from('content_items')
        .select('*')
        .eq('coach_id', coachId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      const analytics = {
        totalCreated: data.length,
        totalPosted: data.filter(i => i.status === 'posted').length,
        byType: {},
        byCategory: {},
        postingConsistency: 0
      }

      data.forEach(item => {
        analytics.byType[item.type] = (analytics.byType[item.type] || 0) + 1
        if (item.category) {
          analytics.byCategory[item.category] = (analytics.byCategory[item.category] || 0) + 1
        }
      })

      return analytics
    } catch (error) {
      console.error('❌ Get analytics failed:', error)
      return null
    }
  }

  // ============================================
  // ============================================
  // PART 2: CONTENT PIECES + SCHEDULING SYSTEM
  // Used by: WeekPlanningView, UnscheduledSidebar
  // ============================================
  // ============================================

  // ============================================
  // CONTENT PIECES: CRUD
  // ============================================

  /**
   * Get content pieces with optional filters
   * @param {string} coachId 
   * @param {object} filters - { status, weekStart, contentType }
   */
  async getContentPieces(coachId, filters = {}) {
    try {
      let query = this.supabase
        .from('content_pieces')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.weekStart) {
        query = query.eq('scheduled_week_start', filters.weekStart)
      }
      if (filters.contentType) {
        query = query.eq('content_type', filters.contentType)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get content pieces failed:', error)
      return []
    }
  }

  /**
   * Get a single content piece with all its phase items
   */
  async getContentPieceWithItems(pieceId) {
    try {
      // Get the piece
      const { data: piece, error: pieceError } = await this.supabase
        .from('content_pieces')
        .select('*')
        .eq('id', pieceId)
        .single()

      if (pieceError) throw pieceError

      // Get all items for this piece
      const { data: items, error: itemsError } = await this.supabase
        .from('output_day_items')
        .select('*')
        .eq('content_piece_id', pieceId)
        .order('scheduled_time', { ascending: true })

      if (itemsError) throw itemsError

      // Organize items by phase
      const itemsByPhase = {
        script: items?.find(i => i.phase === 'script') || null,
        shoot: items?.find(i => i.phase === 'shoot') || null,
        edit: items?.find(i => i.phase === 'edit') || null,
        post: items?.find(i => i.phase === 'post') || null
      }

      return {
        ...piece,
        items: items || [],
        itemsByPhase
      }
    } catch (error) {
      console.error('❌ Get content piece with items failed:', error)
      return null
    }
  }

  /**
   * Get unscheduled content pieces (status = 'idea')
   */
  async getUnscheduledPieces(coachId) {
    try {
      const { data, error } = await this.supabase
        .from('content_pieces')
        .select('*')
        .eq('coach_id', coachId)
        .eq('status', 'idea')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get unscheduled pieces failed:', error)
      return []
    }
  }

  /**
   * Get content pieces scheduled for a specific week
   */
  async getWeekContentPieces(coachId, weekStart) {
    try {
      const weekStartFormatted = this.formatDate(weekStart)

      const { data: pieces, error: piecesError } = await this.supabase
        .from('content_pieces')
        .select('*')
        .eq('coach_id', coachId)
        .eq('scheduled_week_start', weekStartFormatted)

      if (piecesError) throw piecesError

      // Get all items for these pieces
      if (pieces && pieces.length > 0) {
        const pieceIds = pieces.map(p => p.id)
        
        const { data: items, error: itemsError } = await this.supabase
          .from('output_day_items')
          .select('*')
          .in('content_piece_id', pieceIds)

        if (itemsError) throw itemsError

        // Attach items to pieces
        return pieces.map(piece => ({
          ...piece,
          items: (items || []).filter(i => i.content_piece_id === piece.id)
        }))
      }

      return pieces || []
    } catch (error) {
      console.error('❌ Get week content pieces failed:', error)
      return []
    }
  }

  /**
   * Create a new content piece
   */
  async createContentPiece(coachId, data) {
    try {
      const { data: piece, error } = await this.supabase
        .from('content_pieces')
        .insert({
          coach_id: coachId,
          title: data.title,
          description: data.description || null,
          content_type: data.content_type || 'reel',
          color: data.color || 'blue',
          source_content_id: data.source_content_id || null,
          hook: data.hook || null,
          blueprint_steps: data.blueprint_steps || null,
          location: data.location || null,
          target_duration: data.target_duration || null,
          edit_notes: data.edit_notes || null,
          needs_script: data.needs_script ?? true,
          needs_shoot: data.needs_shoot ?? true,
          needs_edit: data.needs_edit ?? true,
          needs_post: data.needs_post ?? true,
          script_completed: false,
          shoot_completed: false,
          edit_completed: false,
          post_completed: false,
          status: data.status || 'idea',
          scheduled_week_start: data.scheduled_week_start || null
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Content piece created:', piece.title)
      return piece
    } catch (error) {
      console.error('❌ Create content piece failed:', error)
      throw error
    }
  }

  /**
   * Update a content piece
   */
  async updateContentPiece(pieceId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('content_pieces')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', pieceId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Content piece updated:', pieceId)
      return data
    } catch (error) {
      console.error('❌ Update content piece failed:', error)
      throw error
    }
  }

  /**
   * Delete a content piece and all its items
   */
  async deleteContentPiece(pieceId) {
    try {
      // First delete all items
      await this.supabase
        .from('output_day_items')
        .delete()
        .eq('content_piece_id', pieceId)

      // Then delete the piece
      const { error } = await this.supabase
        .from('content_pieces')
        .delete()
        .eq('id', pieceId)

      if (error) throw error
      console.log('✅ Content piece deleted:', pieceId)
      return true
    } catch (error) {
      console.error('❌ Delete content piece failed:', error)
      throw error
    }
  }


// ============================================
  // ============================================
// ============================================
  // ============================================
  // PART 3: SALES PIECES + SCHEDULING
  // Used by: WeekPlanningView (sales calls)
  // FIXED: All user_id → coach_id
  // ============================================
  // ============================================

  // ============================================
  // SALES PIECES: CRUD
  // ============================================

  /**
   * Get sales pieces with optional filters
   * FIXED: Uses coach_id instead of user_id
   */
  async getSalesPieces(coachId, filters = {}) {
    try {
      let query = this.supabase
        .from('sales_pieces')
        .select('*')
        .eq('coach_id', coachId)  // ✅ FIXED
        .order('created_at', { ascending: false, nullsFirst: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      if (error) throw error
      
      console.log('✅ Sales pieces loaded:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Get sales pieces failed:', error)
      return []
    }
  }

  /**
   * Get sales pieces by IDs (for week overview)
   */
  async getSalesPiecesByIds(ids) {
    try {
      if (!ids || ids.length === 0) return []

      const { data, error } = await this.supabase
        .from('sales_pieces')
        .select('*')
        .in('id', ids)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get sales pieces by IDs failed:', error)
      return []
    }
  }

  /**
   * Create a new sales piece
   * FIXED: Uses coach_id instead of user_id
   */
  async createSalesPiece(coachId, salesData) {
    try {
      const { data, error } = await this.supabase
        .from('sales_pieces')
        .insert({
          coach_id: coachId,  // ✅ FIXED
          title: salesData.title,
          description: salesData.description || null,
          sales_type: salesData.sales_type || 'announcement',
          hook: salesData.hook || null,
          caption: salesData.caption || null,
          cta: salesData.cta || null,
          color: salesData.color || 'gold',
          status: 'idea',
          needs_prep: true,
          needs_call: true,
          needs_followup: true,
          needs_aftersale: true,
          prep_completed: false,
          call_completed: false,
          followup_completed: false,
          aftersale_completed: false
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Sales piece created:', data.title)
      return data
    } catch (error) {
      console.error('❌ Create sales piece failed:', error)
      throw error
    }
  }

  /**
   * Update a sales piece
   */
  async updateSalesPiece(salesPieceId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('sales_pieces')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', salesPieceId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Sales piece updated:', salesPieceId)
      return data
    } catch (error) {
      console.error('❌ Update sales piece failed:', error)
      throw error
    }
  }

  /**
   * Delete a sales piece and all its items
   */
  async deleteSalesPiece(salesPieceId) {
    try {
      // First delete all items
      await this.supabase
        .from('output_day_items')
        .delete()
        .eq('sales_piece_id', salesPieceId)

      // Then delete the piece
      const { error } = await this.supabase
        .from('sales_pieces')
        .delete()
        .eq('id', salesPieceId)

      if (error) throw error
      console.log('✅ Sales piece deleted:', salesPieceId)
      return true
    } catch (error) {
      console.error('❌ Delete sales piece failed:', error)
      throw error
    }
  }

  /**
   * Get unscheduled sales pieces
   * FIXED: Uses coach_id instead of user_id
   */
  async getUnscheduledSalesPieces(coachId) {
    try {
      const { data, error } = await this.supabase
        .from('sales_pieces')
        .select('*')
        .eq('coach_id', coachId)  // ✅ FIXED
        .eq('status', 'idea')
        .order('created_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get unscheduled sales pieces failed:', error)
      return []
    }
  }

  // ============================================
  // SALES PIECES: SCHEDULING
  // ============================================

  /**
   * Schedule a sales piece into a week
   * Creates items for each required phase
   * FIXED: Uses coach_id from piece
   */
  async scheduleSalesPiece(salesPieceId, weekStart, phaseSchedule = {}) {
    try {
      // 1. Get the sales piece
      const { data: piece, error: pieceError } = await this.supabase
        .from('sales_pieces')
        .select('*')
        .eq('id', salesPieceId)
        .single()

      if (pieceError) throw pieceError

      // 2. Get or create week plan - FIXED: use coach_id
      const weekPlan = await this.getOrCreateWeekPlan(piece.coach_id, weekStart)

      // 3. Delete existing items for this piece (clean slate)
      await this.supabase
        .from('output_day_items')
        .delete()
        .eq('sales_piece_id', salesPieceId)

      // 4. Create items for each enabled phase
      const phases = ['prep', 'call', 'followup', 'aftersale']
      const createdItems = []

      for (const phase of phases) {
        // Check if phase is needed AND enabled in schedule
        if (!piece[`needs_${phase}`]) continue
        
        const schedule = phaseSchedule[phase]
        if (!schedule || !schedule.enabled) continue

        const { data: item, error: itemError } = await this.supabase
          .from('output_day_items')
          .insert({
            week_plan_id: weekPlan.id,
            sales_piece_id: salesPieceId,
            content_piece_id: null,
            day_of_week: schedule.dayOfWeek || 'monday',
            scheduled_time: schedule.time || '09:00',
            duration_minutes: schedule.duration || 30,
            phase: phase,
            title: `${piece.title} - ${phase.charAt(0).toUpperCase() + phase.slice(1)}`,
            item_type: 'sales',
            completed: piece[`${phase}_completed`] || false
          })
          .select()
          .single()

        if (itemError) throw itemError
        createdItems.push(item)
      }

      // 5. Update piece status
      await this.supabase
        .from('sales_pieces')
        .update({
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', salesPieceId)

      console.log('✅ Sales piece scheduled:', piece.title, 'with', createdItems.length, 'items')
      return { piece, items: createdItems }
    } catch (error) {
      console.error('❌ Schedule sales piece failed:', error)
      throw error
    }
  }

  /**
   * Default schedule for sales phases
   * Smart defaults based on call date/time
   */
  getDefaultSalesPhaseSchedule(phase, callDate, callTime) {
    const defaults = {
      prep: { 
        dayOfWeek: 'monday', 
        time: '09:00', 
        duration: 30 
      },
      call: { 
        dayOfWeek: 'tuesday', 
        time: callTime || '14:00', 
        duration: 30 
      },
      followup: { 
        dayOfWeek: 'wednesday', 
        time: '10:00', 
        duration: 15 
      },
      aftersale: { 
        dayOfWeek: 'thursday', 
        time: '16:00', 
        duration: 30 
      }
    }
    return defaults[phase] || { dayOfWeek: 'monday', time: '09:00', duration: 30 }
  }

  /**
   * Toggle sales phase completion
   */
  async toggleSalesPhaseComplete(salesPieceId, phase, completed) {
    try {
      const columnName = `${phase}_completed`
      
      // 1. Update the sales piece
      const { error: pieceError } = await this.supabase
        .from('sales_pieces')
        .update({ 
          [columnName]: completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', salesPieceId)

      if (pieceError) throw pieceError

      // 2. Update the corresponding item
      const { error: itemError } = await this.supabase
        .from('output_day_items')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('sales_piece_id', salesPieceId)
        .eq('phase', phase)

      if (itemError) throw itemError

      console.log('✅ Sales phase toggled:', phase, completed)
      return true
    } catch (error) {
      console.error('❌ Toggle sales phase complete failed:', error)
      throw error
    }
  }

  /**
   * Unschedule a sales piece (remove from week)
   */
  async unscheduleSalesPiece(salesPieceId) {
    try {
      // Delete all items for this piece
      await this.supabase
        .from('output_day_items')
        .delete()
        .eq('sales_piece_id', salesPieceId)

      // Update status back to idea
      await this.supabase
        .from('sales_pieces')
        .update({
          status: 'idea',
          updated_at: new Date().toISOString()
        })
        .eq('id', salesPieceId)

      console.log('✅ Sales piece unscheduled:', salesPieceId)
      return true
    } catch (error) {
      console.error('❌ Unschedule sales piece failed:', error)
      throw error
    }
  }



  // ============================================
  // SCHEDULING: Plan/Unplan/Move Content Pieces
  // ============================================

  /**
   * Schedule a content piece into a week
   * Creates items for each required phase
   * @param {string} pieceId 
   * @param {string} weekStart - YYYY-MM-DD format
   * @param {object} phaseSchedule - { script: {dayOfWeek, time, duration}, shoot: {...}, ... }
   */
  async scheduleContentPiece(pieceId, weekStart, phaseSchedule = {}) {
    try {
      // 1. Get the piece
      const { data: piece, error: pieceError } = await this.supabase
        .from('content_pieces')
        .select('*')
        .eq('id', pieceId)
        .single()

      if (pieceError) throw pieceError

      // 2. Get or create week plan
      const weekPlan = await this.getOrCreateWeekPlan(piece.coach_id, weekStart)

      // 3. Delete existing items for this piece (clean slate)
      await this.supabase
        .from('output_day_items')
        .delete()
        .eq('content_piece_id', pieceId)

      // 4. Create items for each required phase
      const phases = ['script', 'shoot', 'edit', 'post']
      const createdItems = []

      for (const phase of phases) {
        if (!piece[`needs_${phase}`]) continue

        const schedule = phaseSchedule[phase] || this.getDefaultPhaseSchedule(phase)

        const { data: item, error: itemError } = await this.supabase
          .from('output_day_items')
          .insert({
            week_plan_id: weekPlan.id,
            content_piece_id: pieceId,
            day_of_week: schedule.dayOfWeek || 'monday',
            scheduled_time: schedule.time || null,
            duration_minutes: schedule.duration || 30,
            phase: phase,
            title: `${piece.title} - ${phase.charAt(0).toUpperCase() + phase.slice(1)}`,
            item_type: 'content',
            completed: piece[`${phase}_completed`] || false
          })
          .select()
          .single()

        if (itemError) throw itemError
        createdItems.push(item)
      }

      // 5. Update piece status and week
      await this.supabase
        .from('content_pieces')
        .update({
          status: 'scheduled',
          scheduled_week_start: weekStart,
          updated_at: new Date().toISOString()
        })
        .eq('id', pieceId)

      console.log('✅ Content piece scheduled:', piece.title, 'with', createdItems.length, 'items')
      return { piece, items: createdItems }
    } catch (error) {
      console.error('❌ Schedule content piece failed:', error)
      throw error
    }
  }

  /**
   * Default schedule for phases
   */
  getDefaultPhaseSchedule(phase) {
    const defaults = {
      script: { dayOfWeek: 'monday', time: '09:00', duration: 30 },
      shoot: { dayOfWeek: 'tuesday', time: '10:00', duration: 60 },
      edit: { dayOfWeek: 'wednesday', time: '14:00', duration: 45 },
      post: { dayOfWeek: 'thursday', time: '10:00', duration: 15 }
    }
    return defaults[phase] || { dayOfWeek: 'monday', time: '09:00', duration: 30 }
  }

  /**
   * Unschedule a content piece (remove from week, delete items)
   */
  async unscheduleContentPiece(pieceId) {
    try {
      // 1. Delete all items for this piece
      await this.supabase
        .from('output_day_items')
        .delete()
        .eq('content_piece_id', pieceId)

      // 2. Update piece status
      const { data, error } = await this.supabase
        .from('content_pieces')
        .update({
          status: 'idea',
          scheduled_week_start: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pieceId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Content piece unscheduled:', pieceId)
      return data
    } catch (error) {
      console.error('❌ Unschedule content piece failed:', error)
      throw error
    }
  }

  /**
   * Move a content piece to a different week
   */
  async moveToWeek(pieceId, newWeekStart) {
    try {
      // Get current piece with items
      const pieceWithItems = await this.getContentPieceWithItems(pieceId)
      if (!pieceWithItems) throw new Error('Piece not found')

      // Build phase schedule from existing items
      const phaseSchedule = {}
      pieceWithItems.items.forEach(item => {
        if (item.phase) {
          phaseSchedule[item.phase] = {
            dayOfWeek: item.day_of_week,
            time: item.scheduled_time,
            duration: item.duration_minutes
          }
        }
      })

      // Reschedule to new week
      return await this.scheduleContentPiece(pieceId, newWeekStart, phaseSchedule)
    } catch (error) {
      console.error('❌ Move to week failed:', error)
      throw error
    }
  }

  // ============================================
  // PHASE MANAGEMENT
  // ============================================

  /**
   * Toggle phase completion (updates both item and piece)
   */
  async togglePhaseComplete(pieceId, phase, completed) {
    try {
      // 1. Update the content piece
      const { error: pieceError } = await this.supabase
        .from('content_pieces')
        .update({
          [`${phase}_completed`]: completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', pieceId)

      if (pieceError) throw pieceError

      // 2. Update the corresponding item
      const { error: itemError } = await this.supabase
        .from('output_day_items')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('content_piece_id', pieceId)
        .eq('phase', phase)

      if (itemError) throw itemError

      // 3. Check if all phases are complete
      const { data: piece } = await this.supabase
        .from('content_pieces')
        .select('*')
        .eq('id', pieceId)
        .single()

      if (piece) {
        const phases = ['script', 'shoot', 'edit', 'post']
        const allComplete = phases.every(p => 
          !piece[`needs_${p}`] || piece[`${p}_completed`]
        )

        if (allComplete && piece.status !== 'completed') {
          await this.supabase
            .from('content_pieces')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', pieceId)
        }
      }

      console.log('✅ Phase toggled:', phase, completed)
      return true
    } catch (error) {
      console.error('❌ Toggle phase complete failed:', error)
      throw error
    }
  }

  /**
   * Move a single phase item to different day/time
   */
  async movePhaseItem(itemId, dayOfWeek, scheduledTime = null) {
    try {
      const { data, error } = await this.supabase
        .from('output_day_items')
        .update({
          day_of_week: dayOfWeek,
          scheduled_time: scheduledTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Phase item moved:', itemId)
      return data
    } catch (error) {
      console.error('❌ Move phase item failed:', error)
      throw error
    }
  }

  /**
   * Update phase item details
   */
  async updatePhaseItem(itemId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('output_day_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Update phase item failed:', error)
      throw error
    }
  }

  // ============================================
  // WEEK PLAN MANAGEMENT
  // ============================================

  /**
   * Get or create week plan for a specific week
   */
  async getOrCreateWeekPlan(coachId, weekStart) {
    try {
      const weekStartFormatted = this.formatDate(weekStart)

      // Try to find existing
      let { data: weekPlan, error } = await this.supabase
        .from('output_week_plans')
        .select('*')
        .eq('coach_id', coachId)
        .eq('week_start_date', weekStartFormatted)
        .single()

      // Create if not exists
      if (!weekPlan) {
        const { data: newPlan, error: createError } = await this.supabase
          .from('output_week_plans')
          .insert({
            coach_id: coachId,
            week_start_date: weekStartFormatted
          })
          .select()
          .single()

        if (createError) throw createError
        weekPlan = newPlan
        console.log('✅ Week plan created:', weekStartFormatted)
      }

      return weekPlan
    } catch (error) {
      console.error('❌ Get/create week plan failed:', error)
      throw error
    }
  }

  /**
   * Get all items for a week
   */
  async getWeekItems(coachId, weekStart) {
    try {
      const weekPlan = await this.getOrCreateWeekPlan(coachId, weekStart)

      const { data, error } = await this.supabase
        .from('output_day_items')
        .select(`
          *,
          content_piece:content_pieces(*)
        `)
        .eq('week_plan_id', weekPlan.id)
        .order('scheduled_time', { ascending: true, nullsFirst: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get week items failed:', error)
      return []
    }
  }

  /**
   * Get complete week overview (pieces + items + unscheduled)
   * Main method for WeekPlanningView
   */

/**
   * Get complete week overview (pieces + items + unscheduled)
   * Main method for WeekPlanningView
   * UPDATED: Now includes sales pieces
   */
  async getWeekOverview(coachId, weekStart) {
    try {
      const weekStartFormatted = this.formatDate(weekStart)

      // 1. Get or create week plan
      const weekPlan = await this.getOrCreateWeekPlan(coachId, weekStartFormatted)

      // 2. Get all items for this week
      const { data: items, error: itemsError } = await this.supabase
        .from('output_day_items')
        .select('*')
        .eq('week_plan_id', weekPlan.id)
        .order('scheduled_time', { ascending: true, nullsFirst: false })

      if (itemsError) throw itemsError

      // 3. Get unique content pieces from items
      const contentPieceIds = [...new Set((items || [])
        .filter(i => i.content_piece_id)
        .map(i => i.content_piece_id))]

      let contentPieces = []
      if (contentPieceIds.length > 0) {
        const { data: pieces, error: piecesError } = await this.supabase
          .from('content_pieces')
          .select('*')
          .in('id', contentPieceIds)

        if (piecesError) throw piecesError
        contentPieces = pieces || []
      }

      // 4. NIEUW: Get unique sales pieces from items
      const salesPieceIds = [...new Set((items || [])
        .filter(i => i.sales_piece_id)
        .map(i => i.sales_piece_id))]

      let salesPieces = []
      if (salesPieceIds.length > 0) {
        const { data: pieces, error: piecesError } = await this.supabase
          .from('sales_pieces')
          .select('*')
          .in('id', salesPieceIds)

        if (piecesError) throw piecesError
        salesPieces = pieces || []
      }

      // 5. Get unscheduled pieces
      const unscheduledPieces = await this.getUnscheduledPieces(coachId)
      
      // 6. NIEUW: Get unscheduled sales pieces
      const unscheduledSales = await this.getUnscheduledSalesPieces(coachId)

      // 7. Organize items by day
      const itemsByDay = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      }

      ;(items || []).forEach(item => {
        if (item.day_of_week && itemsByDay[item.day_of_week]) {
          itemsByDay[item.day_of_week].push(item)
        }
      })

      // 8. Calculate stats
      const stats = {
        totalItems: items?.length || 0,
        completedItems: (items || []).filter(i => i.completed).length,
        totalPieces: contentPieces.length,
        totalSalesPieces: salesPieces.length, // NIEUW
        unscheduledCount: unscheduledPieces.length,
        unscheduledSalesCount: unscheduledSales.length // NIEUW
      }

      return {
        weekPlan,
        items: items || [],
        itemsByDay,
        contentPieces,
        salesPieces, // NIEUW
        unscheduledPieces,
        unscheduledSales, // NIEUW
        stats
      }
    } catch (error) {
      console.error('❌ Get week overview failed:', error)
      return {
        weekPlan: null,
        items: [],
        itemsByDay: {},
        contentPieces: [],
        salesPieces: [], // NIEUW
        unscheduledPieces: [],
        unscheduledSales: [], // NIEUW
        stats: { 
          totalItems: 0, 
          completedItems: 0, 
          totalPieces: 0, 
          totalSalesPieces: 0, // NIEUW
          unscheduledCount: 0,
          unscheduledSalesCount: 0 // NIEUW
        }
      }
    }
  }


  /**
   * Get week statistics
   */
  async getWeekStats(coachId, weekStart) {
    try {
      const overview = await this.getWeekOverview(coachId, weekStart)
      
      const stats = {
        totals: {
          items: overview.items.length,
          completed: overview.items.filter(i => i.completed).length,
          pieces: overview.contentPieces.length,
          unscheduled: overview.unscheduledPieces.length
        },
        byDay: {},
        byPhase: {
          script: { total: 0, completed: 0 },
          shoot: { total: 0, completed: 0 },
          edit: { total: 0, completed: 0 },
          post: { total: 0, completed: 0 }
        }
      }

      // Count by day
      Object.keys(overview.itemsByDay).forEach(day => {
        const dayItems = overview.itemsByDay[day]
        stats.byDay[day] = {
          total: dayItems.length,
          completed: dayItems.filter(i => i.completed).length
        }
      })

      // Count by phase
      overview.items.forEach(item => {
        if (item.phase && stats.byPhase[item.phase]) {
          stats.byPhase[item.phase].total++
          if (item.completed) {
            stats.byPhase[item.phase].completed++
          }
        }
      })

      return stats
    } catch (error) {
      console.error('❌ Get week stats failed:', error)
      return null
    }
  }

  // ============================================
  // QUICK ACTIONS
  // ============================================

  /**
   * Create a standalone item (not linked to content piece)
   * For things like "gym", "community post", etc.
   */
  async createQuickItem(coachId, weekStart, data) {
    try {
      const weekPlan = await this.getOrCreateWeekPlan(coachId, weekStart)

      const { data: item, error } = await this.supabase
        .from('output_day_items')
        .insert({
          week_plan_id: weekPlan.id,
          day_of_week: data.dayOfWeek || 'monday',
          scheduled_time: data.time || null,
          duration_minutes: data.duration || 30,
          title: data.title,
          description: data.description || null,
          phase: data.phase || 'post',
          item_type: data.itemType || 'task',
          completed: false
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Quick item created:', item.title)
      return item
    } catch (error) {
      console.error('❌ Create quick item failed:', error)
      throw error
    }
  }

  /**
   * Delete a single item
   */
  async deleteItem(itemId) {
    try {
      const { error } = await this.supabase
        .from('output_day_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      console.log('✅ Item deleted:', itemId)
      return true
    } catch (error) {
      console.error('❌ Delete item failed:', error)
      throw error
    }
  }

  /**
   * Toggle item completion (for standalone items)
   */
  async toggleItemComplete(itemId, completed) {
    try {
      const { data, error } = await this.supabase
        .from('output_day_items')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Toggle item complete failed:', error)
      throw error
    }
  }











// ============================================
  // B-ROLL MANAGEMENT
  // ============================================

  /**
   * Update complete b-roll list for a content item
   */
  async updateBRollList(itemId, bRollList) {
    try {
      const { data, error } = await this.supabase
        .from('content_items')
        .update({
          b_roll_list: bRollList,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ B-roll list updated:', itemId)
      return data
    } catch (error) {
      console.error('❌ Update b-roll list failed:', error)
      throw error
    }
  }

  /**
   * Add a single b-roll item
   */
  async addBRollItem(itemId, bRollItem) {
    try {
      // Get current item
      const { data: item, error: fetchError } = await this.supabase
        .from('content_items')
        .select('b_roll_list')
        .eq('id', itemId)
        .single()

      if (fetchError) throw fetchError

      // Add new b-roll item with unique ID
      const currentList = item.b_roll_list || []
      const newItem = {
        id: `broll_${Date.now()}`,
        type: bRollItem.type || 'custom',
        description: bRollItem.description || '',
        duration: bRollItem.duration || '3s',
        completed: false
      }

      const updatedList = [...currentList, newItem]

      // Update
      const { data, error } = await this.supabase
        .from('content_items')
        .update({
          b_roll_list: updatedList,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ B-roll item added:', newItem.id)
      return data
    } catch (error) {
      console.error('❌ Add b-roll item failed:', error)
      throw error
    }
  }

  /**
   * Toggle b-roll item completion
   */
  async toggleBRollComplete(itemId, bRollId, completed) {
    try {
      // Get current item
      const { data: item, error: fetchError } = await this.supabase
        .from('content_items')
        .select('b_roll_list')
        .eq('id', itemId)
        .single()

      if (fetchError) throw fetchError

      // Update the specific b-roll item
      const updatedList = (item.b_roll_list || []).map(broll => 
        broll.id === bRollId 
          ? { ...broll, completed }
          : broll
      )

      // Save
      const { data, error } = await this.supabase
        .from('content_items')
        .update({
          b_roll_list: updatedList,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ B-roll item toggled:', bRollId, completed)
      return data
    } catch (error) {
      console.error('❌ Toggle b-roll complete failed:', error)
      throw error
    }
  }

  /**
   * Delete a b-roll item
   */
  async deleteBRollItem(itemId, bRollId) {
    try {
      // Get current item
      const { data: item, error: fetchError } = await this.supabase
        .from('content_items')
        .select('b_roll_list')
        .eq('id', itemId)
        .single()

      if (fetchError) throw fetchError

      // Remove the b-roll item
      const updatedList = (item.b_roll_list || []).filter(broll => broll.id !== bRollId)

      // Save
      const { data, error } = await this.supabase
        .from('content_items')
        .update({
          b_roll_list: updatedList,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ B-roll item deleted:', bRollId)
      return data
    } catch (error) {
      console.error('❌ Delete b-roll item failed:', error)
      throw error
    }
  }

  /**
   * Update a single b-roll item
   */
  async updateBRollItem(itemId, bRollId, updates) {
    try {
      // Get current item
      const { data: item, error: fetchError } = await this.supabase
        .from('content_items')
        .select('b_roll_list')
        .eq('id', itemId)
        .single()

      if (fetchError) throw fetchError

      // Update the specific b-roll item
      const updatedList = (item.b_roll_list || []).map(broll => 
        broll.id === bRollId 
          ? { ...broll, ...updates }
          : broll
      )

      // Save
      const { data, error } = await this.supabase
        .from('content_items')
        .update({
          b_roll_list: updatedList,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ B-roll item updated:', bRollId)
      return data
    } catch (error) {
      console.error('❌ Update b-roll item failed:', error)
      throw error
    }
  }












}

export default ContentPlanningService
