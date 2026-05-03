// src/modules/output-planning/OutputService.js
// Output Planning System - Database Service
// Gold Theme System voor Content Planning

class OutputService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
  }

  // ========================================
  // WEEK PLANS
  // ========================================

  async getWeekPlan(coachId, weekStartDate) {
    try {
      const { data, error } = await this.supabase
        .from('output_week_plans')
        .select('*')
        .eq('coach_id', coachId)
        .eq('week_start_date', weekStartDate)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('❌ Get week plan failed:', error)
      return null
    }
  }

  async createWeekPlan(coachId, weekStartDate) {
    try {
      const { data, error } = await this.supabase
        .from('output_week_plans')
        .insert({
          coach_id: coachId,
          week_start_date: weekStartDate,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Week plan created')
      return data
    } catch (error) {
      console.error('❌ Create week plan failed:', error)
      throw error
    }
  }

  async getOrCreateWeekPlan(coachId, weekStartDate) {
    let plan = await this.getWeekPlan(coachId, weekStartDate)
    if (!plan) {
      plan = await this.createWeekPlan(coachId, weekStartDate)
    }
    return plan
  }

  // ========================================
  // DAY ITEMS (Stories, Posts, Community, Gym)
  // ========================================

  async getDayItems(weekPlanId) {
    try {
      const { data, error } = await this.supabase
        .from('output_day_items')
        .select(`
          *,
          problem:output_problems(*),
          pdf:output_pdfs(*),
          content:output_content(*)
        `)
        .eq('week_plan_id', weekPlanId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get day items failed:', error)
      return []
    }
  }

  async createDayItem(itemData) {
    try {
      const { data, error } = await this.supabase
        .from('output_day_items')
        .insert(itemData)
        .select(`
          *,
          problem:output_problems(*),
          pdf:output_pdfs(*),
          content:output_content(*)
        `)
        .single()

      if (error) throw error
      console.log('✅ Day item created')
      return data
    } catch (error) {
      console.error('❌ Create day item failed:', error)
      throw error
    }
  }

  async updateDayItem(itemId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('output_day_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Day item updated')
      return data
    } catch (error) {
      console.error('❌ Update day item failed:', error)
      throw error
    }
  }

  async toggleItemCompleted(itemId, completed) {
    try {
      const updates = {
        completed,
        completed_at: completed ? new Date().toISOString() : null
      }

      const { data, error } = await this.supabase
        .from('output_day_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Item completion toggled')
      return data
    } catch (error) {
      console.error('❌ Toggle completion failed:', error)
      throw error
    }
  }

  async deleteDayItem(itemId) {
    try {
      const { error } = await this.supabase
        .from('output_day_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      console.log('✅ Day item deleted')
      return true
    } catch (error) {
      console.error('❌ Delete day item failed:', error)
      throw error
    }
  }

  // ========================================
  // PROBLEMS DATABASE
  // ========================================

  async getProblems(coachId, category = null) {
    try {
      let query = this.supabase
        .from('output_problems')
        .select('*')
        .eq('coach_id', coachId)
        .order('category', { ascending: true })
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get problems failed:', error)
      return []
    }
  }

  async createProblem(problemData) {
    try {
      const { data, error } = await this.supabase
        .from('output_problems')
        .insert(problemData)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Problem created')
      return data
    } catch (error) {
      console.error('❌ Create problem failed:', error)
      throw error
    }
  }

  async updateProblem(problemId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('output_problems')
        .update(updates)
        .eq('id', problemId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Problem updated')
      return data
    } catch (error) {
      console.error('❌ Update problem failed:', error)
      throw error
    }
  }

  async deleteProblem(problemId) {
    try {
      const { error } = await this.supabase
        .from('output_problems')
        .delete()
        .eq('id', problemId)

      if (error) throw error
      console.log('✅ Problem deleted')
      return true
    } catch (error) {
      console.error('❌ Delete problem failed:', error)
      throw error
    }
  }

  // ========================================
  // PDF LIBRARY
  // ========================================

  async getPDFs(coachId, category = null) {
    try {
      let query = this.supabase
        .from('output_pdfs')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get PDFs failed:', error)
      return []
    }
  }

  async createPDF(pdfData) {
    try {
      const { data, error } = await this.supabase
        .from('output_pdfs')
        .insert(pdfData)
        .select()
        .single()

      if (error) throw error
      console.log('✅ PDF created')
      return data
    } catch (error) {
      console.error('❌ Create PDF failed:', error)
      throw error
    }
  }

  async updatePDF(pdfId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('output_pdfs')
        .update(updates)
        .eq('id', pdfId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ PDF updated')
      return data
    } catch (error) {
      console.error('❌ Update PDF failed:', error)
      throw error
    }
  }

  async deletePDF(pdfId) {
    try {
      const { error } = await this.supabase
        .from('output_pdfs')
        .delete()
        .eq('id', pdfId)

      if (error) throw error
      console.log('✅ PDF deleted')
      return true
    } catch (error) {
      console.error('❌ Delete PDF failed:', error)
      throw error
    }
  }

  // ========================================
  // CONTENT LIBRARY
  // ========================================

  async getContent(coachId, category = null) {
    try {
      let query = this.supabase
        .from('output_content')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get content failed:', error)
      return []
    }
  }

  async createContent(contentData) {
    try {
      const { data, error } = await this.supabase
        .from('output_content')
        .insert(contentData)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Content created')
      return data
    } catch (error) {
      console.error('❌ Create content failed:', error)
      throw error
    }
  }

  async updateContent(contentId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('output_content')
        .update(updates)
        .eq('id', contentId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Content updated')
      return data
    } catch (error) {
      console.error('❌ Update content failed:', error)
      throw error
    }
  }

  async deleteContent(contentId) {
    try {
      const { error } = await this.supabase
        .from('output_content')
        .delete()
        .eq('id', contentId)

      if (error) throw error
      console.log('✅ Content deleted')
      return true
    } catch (error) {
      console.error('❌ Delete content failed:', error)
      throw error
    }
  }

  // ========================================
  // STATISTICS
  // ========================================

  async getWeekStats(weekPlanId) {
    try {
      const items = await this.getDayItems(weekPlanId)
      
      const stats = {
        total: items.length,
        completed: items.filter(i => i.completed).length,
        byDay: {},
        byType: {
          story: { total: 0, completed: 0 },
          post: { total: 0, completed: 0 },
          community: { total: 0, completed: 0 },
          gym: { total: 0, completed: 0 }
        }
      }

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      days.forEach(day => {
        const dayItems = items.filter(i => i.day_of_week === day)
        stats.byDay[day] = {
          total: dayItems.length,
          completed: dayItems.filter(i => i.completed).length
        }
      })

      items.forEach(item => {
        if (stats.byType[item.item_type]) {
          stats.byType[item.item_type].total++
          if (item.completed) {
            stats.byType[item.item_type].completed++
          }
        }
      })

      return stats
    } catch (error) {
      console.error('❌ Get week stats failed:', error)
      return null
    }
  }
}

export default OutputService
