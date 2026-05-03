// src/modules/content-batches/BatchService.js
// Service layer for Content Batches system
// Handles all database operations for batches and batch items
// UPDATED: Added blueprint_steps, b_roll_list, productie_checklist, edit_notes support

class BatchService {
  constructor(supabase) {
    this.supabase = supabase
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Create a new batch with items
   * @param {string} coachId - Coach UUID
   * @param {object} batchData - Batch configuration
   * @returns {object} Created batch with items
   */
  async createBatch(coachId, batchData) {
    try {
      const {
        batchName,
        postFormat,
        contentType,
        totalItems = 7,
        planningType = 'ready',
        recurringPattern = null,
        items = [] // Array of item data
      } = batchData

      // 1. Create batch
      const { data: batch, error: batchError } = await this.supabase
        .from('content_batches')
        .insert({
          coach_id: coachId,
          batch_name: batchName,
          post_format: postFormat,
          content_type: contentType,
          total_items: totalItems,
          planning_type: planningType,
          recurring_pattern: recurringPattern,
          status: planningType === 'ready' ? 'ready' : 'draft'
        })
        .select()
        .single()

      if (batchError) throw batchError
      console.log('✅ Batch created:', batch.id)

      // 2. Create batch items (including blueprint data)
      if (items.length > 0) {
        const itemsToCreate = items.map((item, index) => ({
          batch_id: batch.id,
          item_number: index + 1,
          title: item.title,
          location: item.location || null,
          caption: item.caption || null,
          hook: item.hook || null,
          script: item.script || null,
          notes: item.notes || null,
          story_goal: item.storyGoal || null,
          story_topic: item.storyTopic || null,
          planned_date: item.plannedDate || null,
          planned_time: item.plannedTime || '12:00',
          status: item.plannedDate ? 'planned' : 'ready',
          // NEW: Blueprint data
          blueprint_steps: item.blueprintSteps || null,
          b_roll_list: item.bRollList || null,
          productie_checklist: item.productieChecklist || null,
          edit_notes: item.editNotes || null
        }))

        const { data: createdItems, error: itemsError } = await this.supabase
          .from('batch_items')
          .insert(itemsToCreate)
          .select()

        if (itemsError) throw itemsError
        console.log(`✅ Created ${createdItems.length} batch items`)

        return { ...batch, items: createdItems }
      }

      return { ...batch, items: [] }
    } catch (error) {
      console.error('❌ Create batch failed:', error)
      throw error
    }
  }

  /**
   * Get all batches for a coach
   * @param {string} coachId - Coach UUID
   * @param {object} filters - Optional filters
   * @returns {array} Batches
   */
  async getBatches(coachId, filters = {}) {
    try {
      let query = this.supabase
        .from('content_batches')
        .select(`
          *,
          items:batch_items(count)
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.contentType) {
        query = query.eq('content_type', filters.contentType)
      }
      if (filters.postFormat) {
        query = query.eq('post_format', filters.postFormat)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get batches failed:', error)
      return []
    }
  }

  /**
   * Get single batch with all items (including blueprint data)
   * @param {string} batchId - Batch UUID
   * @returns {object} Batch with items
   */
  async getBatchById(batchId) {
    try {
      const { data: batch, error: batchError } = await this.supabase
        .from('content_batches')
        .select('*')
        .eq('id', batchId)
        .single()

      if (batchError) throw batchError

      const { data: items, error: itemsError } = await this.supabase
        .from('batch_items')
        .select('*')
        .eq('batch_id', batchId)
        .order('item_number')

      if (itemsError) throw itemsError

      return { ...batch, items: items || [] }
    } catch (error) {
      console.error('❌ Get batch by ID failed:', error)
      return null
    }
  }

  /**
   * Update batch
   * @param {string} batchId - Batch UUID
   * @param {object} updates - Fields to update
   * @returns {object} Updated batch
   */
  async updateBatch(batchId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('content_batches')
        .update(updates)
        .eq('id', batchId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Batch updated:', batchId)
      return data
    } catch (error) {
      console.error('❌ Update batch failed:', error)
      throw error
    }
  }

  /**
   * Delete batch (cascade deletes items)
   * @param {string} batchId - Batch UUID
   * @returns {boolean} Success
   */
  async deleteBatch(batchId) {
    try {
      const { error } = await this.supabase
        .from('content_batches')
        .delete()
        .eq('id', batchId)

      if (error) throw error
      console.log('✅ Batch deleted:', batchId)
      return true
    } catch (error) {
      console.error('❌ Delete batch failed:', error)
      throw error
    }
  }

  // ============================================
  // BATCH ITEM OPERATIONS
  // ============================================

  /**
   * Get batch items for a specific week
   * @param {string} coachId - Coach UUID
   * @param {string} weekStart - Week start date (YYYY-MM-DD)
   * @returns {array} Batch items
   */
  async getBatchItemsForWeek(coachId, weekStart) {
    try {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const { data, error } = await this.supabase
        .from('batch_items')
        .select(`
          *,
          batch:content_batches(
            batch_name,
            post_format,
            content_type
          )
        `)
        .gte('planned_date', weekStart)
        .lt('planned_date', weekEnd.toISOString().split('T')[0])
        .order('planned_date')
        .order('planned_time')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Get batch items for week failed:', error)
      return []
    }
  }

  /**
   * Get all ready items (not planned yet)
   * @param {string} coachId - Coach UUID
   * @returns {array} Ready items
   */
  async getReadyItems(coachId) {
    try {
      const { data, error } = await this.supabase
        .from('batch_items')
        .select(`
          *,
          batch:content_batches!inner(
            id,
            batch_name,
            post_format,
            content_type,
            coach_id
          )
        `)
        .eq('batch.coach_id', coachId)
        .eq('status', 'ready')
        .is('planned_date', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get ready items failed:', error)
      return []
    }
  }

  /**
   * Update batch item (including blueprint data)
   * @param {string} itemId - Item UUID
   * @param {object} updates - Fields to update
   * @returns {object} Updated item
   */
  async updateBatchItem(itemId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('batch_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()

      if (error) throw error
      
      if (!data || data.length === 0) {
        throw new Error('Item not found')
      }
      
      console.log('✅ Batch item updated:', itemId)
      return data[0]
    } catch (error) {
      console.error('❌ Update batch item failed:', error)
      throw error
    }
  }

  /**
   * Update blueprint data for a batch item
   * @param {string} itemId - Item UUID
   * @param {object} blueprintData - Blueprint fields
   * @returns {object} Updated item
   */
  async updateBatchItemBlueprint(itemId, blueprintData) {
    try {
      const { data, error } = await this.supabase
        .from('batch_items')
        .update({
          blueprint_steps: blueprintData.blueprintSteps ?? null,
          b_roll_list: blueprintData.bRollList ?? null,
          productie_checklist: blueprintData.productieChecklist ?? null,
          edit_notes: blueprintData.editNotes ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()

      if (error) throw error
      
      if (!data || data.length === 0) {
        throw new Error('Item not found')
      }
      
      console.log('✅ Batch item blueprint updated:', itemId)
      return data[0]
    } catch (error) {
      console.error('❌ Update batch item blueprint failed:', error)
      throw error
    }
  }

  /**
   * Plan a batch item (set date/time)
   * @param {string} itemId - Item UUID
   * @param {string} date - Date (YYYY-MM-DD)
   * @param {string} time - Time (HH:MM)
   * @returns {object} Updated item
   */
  async planBatchItem(itemId, date, time = '12:00') {
    try {
      const { data, error } = await this.supabase
        .from('batch_items')
        .update({
          planned_date: date,
          planned_time: time,
          status: 'planned'
        })
        .eq('id', itemId)
        .select()

      if (error) throw error
      
      if (!data || data.length === 0) {
        throw new Error('Item not found')
      }
      
      console.log('✅ Batch item planned:', itemId, 'for', date)
      return data[0]
    } catch (error) {
      console.error('❌ Plan batch item failed:', error)
      throw error
    }
  }

  /**
   * Mark batch item as posted
   * @param {string} itemId - Item UUID
   * @param {string} contentItemId - Optional link to content_items
   * @returns {object} Updated item
   */
  async markItemPosted(itemId, contentItemId = null) {
    try {
      const { data, error } = await this.supabase
        .from('batch_items')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          content_item_id: contentItemId
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Batch item marked as posted:', itemId)
      return data
    } catch (error) {
      console.error('❌ Mark item posted failed:', error)
      throw error
    }
  }

  /**
   * Delete batch item
   * @param {string} itemId - Item UUID
   * @returns {boolean} Success
   */
  async deleteBatchItem(itemId) {
    try {
      const { error } = await this.supabase
        .from('batch_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      console.log('✅ Batch item deleted:', itemId)
      return true
    } catch (error) {
      console.error('❌ Delete batch item failed:', error)
      throw error
    }
  }

  // ============================================
  // RECURRING BATCH PLANNING
  // ============================================

  /**
   * Auto-plan recurring batch items
   * @param {string} batchId - Batch UUID
   * @param {object} pattern - Recurring pattern
   * @returns {array} Planned items
   */
  async planRecurringBatch(batchId, pattern) {
    try {
      const { data: items, error: itemsError } = await this.supabase
        .from('batch_items')
        .select('*')
        .eq('batch_id', batchId)
        .order('item_number')

      if (itemsError) throw itemsError

      const dates = this.calculateRecurringDates(pattern, items.length)

      const updates = items.map((item, index) => ({
        id: item.id,
        planned_date: dates[index],
        planned_time: pattern.time || '12:00',
        status: 'planned'
      }))

      const updatePromises = updates.map(update =>
        this.supabase
          .from('batch_items')
          .update({
            planned_date: update.planned_date,
            planned_time: update.planned_time,
            status: update.status
          })
          .eq('id', update.id)
      )

      await Promise.all(updatePromises)

      await this.updateBatch(batchId, {
        planning_type: 'recurring',
        recurring_pattern: pattern,
        status: 'planned'
      })

      console.log(`✅ Planned ${items.length} items as recurring`)
      return updates
    } catch (error) {
      console.error('❌ Plan recurring batch failed:', error)
      throw error
    }
  }

  /**
   * Calculate dates based on recurring pattern
   * @param {object} pattern - {type: 'weekly', day: 'wednesday', time: '18:00'}
   * @param {number} count - Number of items
   * @returns {array} Array of dates
   */
  calculateRecurringDates(pattern, count) {
    const dates = []
    const today = new Date()
    
    if (pattern.type === 'weekly') {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = dayNames.indexOf(pattern.day.toLowerCase())
      
      let current = new Date(today)
      current.setDate(current.getDate() + ((targetDay + 7 - current.getDay()) % 7))
      
      for (let i = 0; i < count; i++) {
        dates.push(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 7)
      }
    } else if (pattern.type === 'daily') {
      let current = new Date(today)
      current.setDate(current.getDate() + 1)
      
      for (let i = 0; i < count; i++) {
        dates.push(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
      }
    }
    
    return dates
  }
}

export default BatchService
