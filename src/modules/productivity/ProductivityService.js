// src/modules/productivity/ProductivityService.js
// MY ARC PRODUCTIVITY SYSTEM - Service Layer
// VERSION 2.0 - Constructor accepts supabase instance

import DatabaseService from '../../services/DatabaseService'

class ProductivityService {
  constructor(supabaseInstance) {
    // Accepts supabase instance from ProductivityHub (new ProductivityService(db.supabase))
    // Falls back to DatabaseService singleton if no instance provided
    this.db = supabaseInstance ? { supabase: supabaseInstance } : DatabaseService
  }

  // ============================================================================
  // SECTIONS (Kanban Columns)
  // ============================================================================

  async createSection(coachId, sectionData) {
    try {
      const { data, error } = await this.db.supabase
        .from('productivity_sections')
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
        .from('productivity_sections')
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
        .from('productivity_sections')
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
      await this.db.supabase
        .from('productivity_tasks')
        .update({ section_id: null })
        .eq('section_id', sectionId)

      const { error } = await this.db.supabase
        .from('productivity_sections')
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

  async reorderSections(sectionIds) {
    try {
      const updates = sectionIds.map((id, index) =>
        this.db.supabase
          .from('productivity_sections')
          .update({ position: index })
          .eq('id', id)
      )
      await Promise.all(updates)
      console.log('✅ Sections reordered')
      return true
    } catch (error) {
      console.error('❌ Reorder sections failed:', error)
      throw error
    }
  }

  // ============================================================================
  // TASKS
  // ============================================================================

  async createTask(coachId, taskData) {
    try {
      // Forward agenda/scheduling fields so a task born from a tap on the
      // agenda actually lands on the tapped slot. Without these spreads the
      // INSERT silently dropped scheduled_day/start/end and the new card
      // ended up in "Niet gepland".
      const estMin = taskData.estimated_minutes
      const payload = {
        coach_id: coachId,
        section_id: taskData.sectionId || null,
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority || 'medium',
        category: taskData.category || null,
        deadline: taskData.deadline || null,
        position: taskData.position || 0,
        needs_reflection: (taskData.needs_reflection ?? taskData.needsReflection) !== false,
        ...(taskData.scheduled_day        !== undefined ? { scheduled_day: taskData.scheduled_day } : {}),
        ...(taskData.scheduled_date       !== undefined ? { scheduled_date: taskData.scheduled_date } : {}),
        ...(taskData.scheduled_start_time !== undefined ? { scheduled_start_time: taskData.scheduled_start_time } : {}),
        ...(taskData.scheduled_end_time   !== undefined ? { scheduled_end_time: taskData.scheduled_end_time } : {}),
        ...(estMin !== undefined && estMin !== '' && estMin !== null
          ? { estimated_minutes: Number(estMin) } : {}),
        // Recurring fields — repeat the task on the given weekdays every week
        ...(taskData.recurrence_active !== undefined ? { recurrence_active: !!taskData.recurrence_active } : {}),
        ...(taskData.recurrence_days   !== undefined ? { recurrence_days: taskData.recurrence_days } : {}),
      }
      console.log('[RECUR-DEBUG service createTask payload]', {
        recurrence_active: payload.recurrence_active,
        recurrence_days: payload.recurrence_days,
        recur_keys_in_payload: Object.keys(payload).filter(k => k.startsWith('recurrence')),
      })
      const { data, error } = await this.db.supabase
        .from('productivity_tasks').insert(payload).select().single()
      if (error) {
        console.error('[RECUR-DEBUG service createTask error]', error)
        throw error
      }
      console.log('[RECUR-DEBUG service createTask result]', {
        id: data.id,
        recurrence_active: data.recurrence_active,
        recurrence_days: data.recurrence_days,
      })
      return data
    } catch (error) {
      console.error('❌ Create task failed:', error)
      throw error
    }
  }

  async getTasks(coachId, filters = {}) {
    try {
      let query = this.db.supabase
        .from('productivity_tasks')
        .select('*')
        .eq('coach_id', coachId)
        .order('position', { ascending: true })

      if (filters.status) query = query.eq('status', filters.status)
      if (filters.sectionId) query = query.eq('section_id', filters.sectionId)
      if (filters.category) query = query.eq('category', filters.category)
      if (filters.priority) query = query.eq('priority', filters.priority)

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get tasks failed:', error)
      return []
    }
  }

  async updateTask(taskId, updates) {
    try {
      // Sanitize: lege strings naar null voor date/text velden die null verwachten
      const sanitized = { ...updates }
      if (sanitized.deadline === '') sanitized.deadline = null
      if (sanitized.category === '') sanitized.category = null
      if (sanitized.description === '') sanitized.description = null

      if ('recurrence_active' in sanitized || 'recurrence_days' in sanitized) {
        console.log('[RECUR-DEBUG service updateTask sanitized]', taskId, {
          recurrence_active: sanitized.recurrence_active,
          recurrence_days: sanitized.recurrence_days,
        })
      }
      const { data, error } = await this.db.supabase
        .from('productivity_tasks')
        .update({
          ...sanitized,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) {
        if ('recurrence_active' in sanitized || 'recurrence_days' in sanitized) {
          console.error('[RECUR-DEBUG service updateTask error]', error)
        }
        throw error
      }
      if ('recurrence_active' in sanitized || 'recurrence_days' in sanitized) {
        console.log('[RECUR-DEBUG service updateTask result]', {
          id: data.id,
          recurrence_active: data.recurrence_active,
          recurrence_days: data.recurrence_days,
        })
      }
      return data
    } catch (error) {
      console.error('❌ Update task failed:', error)
      throw error
    }
  }

  async deleteTask(taskId) {
    try {
      const { error } = await this.db.supabase
        .from('productivity_tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      console.log('✅ Task deleted:', taskId)
      return true
    } catch (error) {
      console.error('❌ Delete task failed:', error)
      throw error
    }
  }

  async completeTask(taskId) {
    try {
      const { data, error } = await this.db.supabase
        .from('productivity_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Task completed:', taskId)
      return data
    } catch (error) {
      console.error('❌ Complete task failed:', error)
      throw error
    }
  }

  async moveTaskToSection(taskId, sectionId, position = 0) {
    try {
      const { data, error } = await this.db.supabase
        .from('productivity_tasks')
        .update({
          section_id: sectionId === 'unassigned' ? null : sectionId,
          position: position,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Task moved to section:', sectionId)
      return data
    } catch (error) {
      console.error('❌ Move task failed:', error)
      throw error
    }
  }

  async reorderTasksInSection(sectionId, taskIds) {
    try {
      const updates = taskIds.map((taskId, index) =>
        this.db.supabase
          .from('productivity_tasks')
          .update({ position: index, updated_at: new Date().toISOString() })
          .eq('id', taskId)
      )
      await Promise.all(updates)
      console.log('✅ Tasks reordered in section:', sectionId)
      return true
    } catch (error) {
      console.error('❌ Reorder tasks failed:', error)
      throw error
    }
  }

  // ============================================================================
  // KANBAN BOARD (Combined view)
  // ============================================================================

  async getKanbanBoard(coachId) {
    try {
      const sections = await this.getSections(coachId)

      const { data: allTasks, error } = await this.db.supabase
        .from('productivity_tasks')
        .select('*')
        .eq('coach_id', coachId)
        .eq('status', 'active')
        .order('position', { ascending: true })

      if (error) throw error

      const board = sections.map(section => ({
        ...section,
        tasks: allTasks.filter(task => task.section_id === section.id)
      }))

      const unassignedTasks = allTasks.filter(task => !task.section_id)
      board.push({
        id: 'unassigned',
        title: 'Inbox',
        color: '#6b7280',
        position: 9999,
        tasks: unassignedTasks
      })

      console.log('✅ Kanban board loaded:', board.length, 'columns')
      return board
    } catch (error) {
      console.error('❌ Get kanban board failed:', error)
      return []
    }
  }


  // ============================================================================
  // COMPLETED TASKS HISTORY
  // ============================================================================

  async getCompletedTasks(coachId, weekStart = null, weekEnd = null) {
    try {
      let query = this.db.supabase
        .from('productivity_tasks')
        .select('*')
        .eq('coach_id', coachId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      if (weekStart) query = query.gte('completed_at', new Date(weekStart).toISOString())
      if (weekEnd)   query = query.lte('completed_at', new Date(weekEnd).toISOString())

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get completed tasks failed:', error)
      return []
    }
  }

  // ============================================================================
  // WEEK GOALS
  // ============================================================================

  async getWeekGoals(coachId, weekStart) {
    try {
      const weekStartStr = weekStart instanceof Date
        ? weekStart.toISOString().split('T')[0]
        : weekStart

      const { data, error } = await this.db.supabase
        .from('productivity_week_goals')
        .select('goals')
        .eq('coach_id', coachId)
        .eq('week_start', weekStartStr)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data?.goals || []
    } catch (error) {
      console.error('❌ Get week goals failed:', error)
      return []
    }
  }

  async saveWeekGoals(coachId, weekStart, goals) {
    try {
      const weekStartStr = weekStart instanceof Date
        ? weekStart.toISOString().split('T')[0]
        : weekStart

      const { error } = await this.db.supabase
        .from('productivity_week_goals')
        .upsert({
          coach_id: coachId,
          week_start: weekStartStr,
          goals: goals,
          updated_at: new Date().toISOString()
        }, { onConflict: 'coach_id,week_start' })

      if (error) throw error
      console.log('✅ Week goals saved')
      return true
    } catch (error) {
      console.error('❌ Save week goals failed:', error)
      throw error
    }
  }

  // ============================================================================
  // REFLECTIONS
  // ============================================================================

  async getTasksPendingReflection(coachId) {
    try {
      const { data, error } = await this.db.supabase
        .from('productivity_tasks')
        .select('*')
        .eq('coach_id', coachId)
        .eq('status', 'completed')
        .eq('needs_reflection', true)
        .eq('reflection_completed', false)
        .order('completed_at', { ascending: false })

      if (error) throw error
      console.log('✅ Pending reflections:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Get pending reflections failed:', error)
      return []
    }
  }

  async saveReflection(taskId, coachId, reflectionData) {
    try {
      const { data: reflection, error: reflectionError } = await this.db.supabase
        .from('productivity_reflections')
        .insert({
          task_id: taskId,
          coach_id: coachId,
          rating: reflectionData.rating,
          what_went_well: reflectionData.whatWentWell || null,
          what_learned: reflectionData.whatLearned || null,
          what_different: reflectionData.whatDifferent || null,
          skipped: false
        })
        .select()
        .single()

      if (reflectionError) throw reflectionError

      await this.db.supabase
        .from('productivity_tasks')
        .update({ reflection_completed: true })
        .eq('id', taskId)

      console.log('✅ Reflection saved:', reflection.id)
      return reflection
    } catch (error) {
      console.error('❌ Save reflection failed:', error)
      throw error
    }
  }

  async skipReflection(taskId, coachId) {
    try {
      const { data, error } = await this.db.supabase
        .from('productivity_reflections')
        .insert({
          task_id: taskId,
          coach_id: coachId,
          skipped: true
        })
        .select()
        .single()

      if (error) throw error

      await this.db.supabase
        .from('productivity_tasks')
        .update({ reflection_completed: true })
        .eq('id', taskId)

      console.log('✅ Reflection skipped:', taskId)
      return data
    } catch (error) {
      console.error('❌ Skip reflection failed:', error)
      throw error
    }
  }

  async getReflectionHistory(coachId, limit = 50) {
    try {
      const { data, error } = await this.db.supabase
        .from('productivity_reflections')
        .select(`
          *,
          task:productivity_tasks(id, title, category, priority, completed_at)
        `)
        .eq('coach_id', coachId)
        .eq('skipped', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get reflection history failed:', error)
      return []
    }
  }

  async getReflectionStats(coachId, dateRange = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - dateRange)

      const { data, error } = await this.db.supabase
        .from('productivity_reflections')
        .select('rating, skipped, created_at')
        .eq('coach_id', coachId)
        .gte('created_at', cutoffDate.toISOString())

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        completed: data?.filter(r => !r.skipped).length || 0,
        skipped: data?.filter(r => r.skipped).length || 0,
        averageRating: 0
      }

      const ratings = data?.filter(r => r.rating).map(r => r.rating) || []
      if (ratings.length > 0) {
        stats.averageRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      }

      return stats
    } catch (error) {
      console.error('❌ Get reflection stats failed:', error)
      return { total: 0, completed: 0, skipped: 0, averageRating: 0 }
    }
  }

  // ============================================================================
  // WEEKLY WINS
  // ============================================================================

  getWeekStart(date = new Date()) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  getWeekEnd(date = new Date()) {
    const start = this.getWeekStart(date)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
  }

  async addWeeklyWin(coachId, winText, category = 'personal') {
    try {
      const weekStart = this.getWeekStart()

      const { data, error } = await this.db.supabase
        .from('productivity_weekly_wins')
        .insert({
          coach_id: coachId,
          week_start: weekStart.toISOString().split('T')[0],
          win_text: winText,
          category: category
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Weekly win added:', data.id)
      return data
    } catch (error) {
      console.error('❌ Add weekly win failed:', error)
      throw error
    }
  }

  async getWeeklyWins(coachId, weekStart = null) {
    try {
      const targetWeek = weekStart || this.getWeekStart()

      const { data, error } = await this.db.supabase
        .from('productivity_weekly_wins')
        .select('*')
        .eq('coach_id', coachId)
        .eq('week_start', targetWeek.toISOString().split('T')[0])
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get weekly wins failed:', error)
      return []
    }
  }

  async deleteWeeklyWin(winId) {
    try {
      const { error } = await this.db.supabase
        .from('productivity_weekly_wins')
        .delete()
        .eq('id', winId)

      if (error) throw error
      console.log('✅ Weekly win deleted:', winId)
      return true
    } catch (error) {
      console.error('❌ Delete weekly win failed:', error)
      throw error
    }
  }

  // ============================================================================
  // WEEK REPORT GENERATION
  // ============================================================================

  async generateWeekReport(coachId, weekStart = null) {
    try {
      const start = weekStart || this.getWeekStart()
      const end = this.getWeekEnd(start)

      const { data: completedTasks } = await this.db.supabase
        .from('productivity_tasks')
        .select('*')
        .eq('coach_id', coachId)
        .eq('status', 'completed')
        .gte('completed_at', start.toISOString())
        .lte('completed_at', end.toISOString())
        .order('completed_at', { ascending: true })

      const { data: reflections } = await this.db.supabase
        .from('productivity_reflections')
        .select(`
          *,
          task:productivity_tasks(title, category)
        `)
        .eq('coach_id', coachId)
        .eq('skipped', false)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      const manualWins = await this.getWeeklyWins(coachId, start)

      const totalCompleted = completedTasks?.length || 0
      const totalReflections = reflections?.length || 0
      const ratings = reflections?.filter(r => r.rating).map(r => r.rating) || []
      const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null

      const byCategory = {}
      completedTasks?.forEach(task => {
        const cat = task.category || 'Overig'
        byCategory[cat] = (byCategory[cat] || 0) + 1
      })

      const byPriority = { high: 0, medium: 0, low: 0 }
      completedTasks?.forEach(task => {
        byPriority[task.priority] = (byPriority[task.priority] || 0) + 1
      })

      const reportData = {
        weekStart: start.toISOString().split('T')[0],
        weekEnd: end.toISOString().split('T')[0],
        summary: { totalCompleted, totalReflections, averageRating: avgRating, manualWinsCount: manualWins.length },
        byCategory,
        byPriority,
        completedTasks: completedTasks || [],
        reflections: reflections || [],
        manualWins: manualWins,
        generatedAt: new Date().toISOString()
      }

      const { data: savedReport, error } = await this.db.supabase
        .from('productivity_week_reports')
        .insert({
          coach_id: coachId,
          week_start: start.toISOString().split('T')[0],
          week_end: end.toISOString().split('T')[0],
          report_data: reportData
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Week report generated')
      return { ...savedReport, report_data: reportData }
    } catch (error) {
      console.error('❌ Generate week report failed:', error)
      throw error
    }
  }

  async getWeekReports(coachId, limit = 10) {
    try {
      const { data, error } = await this.db.supabase
        .from('productivity_week_reports')
        .select('*')
        .eq('coach_id', coachId)
        .order('week_start', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get week reports failed:', error)
      return []
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  async getProductivityStats(coachId, dateRange = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - dateRange)

      const { data: tasks } = await this.db.supabase
        .from('productivity_tasks')
        .select('status, priority, category, created_at, completed_at')
        .eq('coach_id', coachId)
        .gte('created_at', cutoffDate.toISOString())

      const pendingReflections = await this.getTasksPendingReflection(coachId)

      const stats = {
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
        activeTasks: tasks?.filter(t => t.status === 'active').length || 0,
        completionRate: 0,
        pendingReflections: pendingReflections.length,
        byPriority: { high: 0, medium: 0, low: 0 },
        byCategory: {}
      }

      if (stats.totalTasks > 0) {
        stats.completionRate = Math.round((stats.completedTasks / stats.totalTasks) * 100)
      }

      tasks?.forEach(task => {
        stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1
        const cat = task.category || 'Overig'
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('❌ Get productivity stats failed:', error)
      return { totalTasks: 0, completedTasks: 0, activeTasks: 0, completionRate: 0, pendingReflections: 0, byPriority: {}, byCategory: {} }
    }
  }


  // ============================================================================
  // TIME LOGGING
  // ============================================================================

  async logTime(coachId, taskId, taskTitle, category, minutesSpent) {
    try {
      if (!minutesSpent || minutesSpent < 1) return null
      const { data, error } = await this.db.supabase
        .from('productivity_time_logs')
        .insert({
          coach_id: coachId,
          task_id: taskId,
          task_title: taskTitle,
          category: category || 'overig',
          minutes_spent: Math.round(minutesSpent)
        })
        .select()
        .single()
      if (error) throw error
      console.log('✅ Time logged:', Math.round(minutesSpent), 'min for', taskTitle)
      return data
    } catch (error) {
      console.error('❌ Log time failed:', error)
      return null
    }
  }

  async getTimeLogs(coachId, days = 30) {
    try {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      const { data, error } = await this.db.supabase
        .from('productivity_time_logs')
        .select('*')
        .eq('coach_id', coachId)
        .gte('logged_at', cutoff.toISOString())
        .order('logged_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get time logs failed:', error)
      return []
    }
  }

  async getTimeStats(coachId, days = 30) {
    try {
      const logs = await this.getTimeLogs(coachId, days)
      const totalMinutes = logs.reduce((sum, l) => sum + l.minutes_spent, 0)

      // Per categorie
      const byCategory = {}
      logs.forEach(l => {
        const cat = l.category || 'overig'
        byCategory[cat] = (byCategory[cat] || 0) + l.minutes_spent
      })

      // Per dag (laatste 7 dagen)
      const byDay = {}
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        byDay[key] = 0
      }
      logs.forEach(l => {
        const key = l.logged_at.split('T')[0]
        if (byDay[key] !== undefined) byDay[key] += l.minutes_spent
      })

      // Per week
      const byWeek = {}
      logs.forEach(l => {
        const d = new Date(l.logged_at)
        const weekStart = new Date(d)
        const day = weekStart.getDay()
        weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1))
        const key = weekStart.toISOString().split('T')[0]
        byWeek[key] = (byWeek[key] || 0) + l.minutes_spent
      })

      return { totalMinutes, byCategory, byDay, byWeek, logs, sessionCount: logs.length }
    } catch (error) {
      console.error('❌ Get time stats failed:', error)
      return { totalMinutes: 0, byCategory: {}, byDay: {}, byWeek: {}, logs: [], sessionCount: 0 }
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  subscribeToTaskUpdates(coachId, callback) {
    try {
      const subscription = this.db.supabase
        .channel('productivity-tasks')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'productivity_tasks', filter: `coach_id=eq.${coachId}` },
          callback
        )
        .subscribe()

      console.log('✅ Task updates subscription active')
      return subscription
    } catch (error) {
      console.error('❌ Subscribe to task updates failed:', error)
      return null
    }
  }
}

export default ProductivityService
