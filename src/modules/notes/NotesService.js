// src/modules/notes/NotesService.js
import DatabaseService from '../../services/DatabaseService'

export default class NotesService {
  constructor(db) {
    this.db = db || DatabaseService
    this.supabase = this.db.supabase
  }

  // ============== CREATE OPERATIONS ==============
  
  async createNote(clientId, noteData) {
    try {
      const user = await this.db.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await this.supabase
        .from('client_notes')
        .insert({
          client_id: clientId,
          coach_id: user.id,
          title: noteData.title || 'Untitled Note',
          subtitle: noteData.subtitle || '',
          category: noteData.category || 'session',
          content: noteData.content || { sections: [] },
          note_date: noteData.date || new Date().toISOString().split('T')[0],
          priority: noteData.priority || 'medium',
          status: noteData.status || 'active',
          tags: noteData.tags || [],
          linked_workout_id: noteData.linkedWorkoutId || null,
          linked_meal_plan_id: noteData.linkedMealPlanId || null,
          linked_challenge_id: noteData.linkedChallengeId || null,
          call_duration: noteData.callDuration || null,
          call_type: noteData.callType || null
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating note:', error)
      throw error
    }
  }

  async createQuickNote(clientId, content, sessionId = null) {
    try {
      const user = await this.db.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await this.supabase
        .from('quick_notes')
        .insert({
          client_id: clientId,
          coach_id: user.id,
          content: content,
          session_id: sessionId || `session_${Date.now()}`
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating quick note:', error)
      throw error
    }
  }

  // ============== READ OPERATIONS ==============
  
  async getNotes(clientId, filters = {}) {
    try {
      let query = this.supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', clientId)
        .neq('status', 'deleted')
        .order('note_date', { ascending: false })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }
      if (filters.startDate) {
        query = query.gte('note_date', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('note_date', filters.endDate)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notes:', error)
      return []
    }
  }

  async getNote(noteId) {
    try {
      const { data, error } = await this.supabase
        .from('client_notes')
        .select('*')
        .eq('id', noteId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching note:', error)
      return null
    }
  }

  async searchNotes(clientId, searchQuery) {
    try {
      const { data, error } = await this.supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', clientId)
        .neq('status', 'deleted')
        .or(`title.ilike.%${searchQuery}%,subtitle.ilike.%${searchQuery}%,content::text.ilike.%${searchQuery}%`)
        .order('note_date', { ascending: false })
        .limit(20)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching notes:', error)
      return []
    }
  }

  async getRecentNotes(clientId, limit = 5) {
    return this.getNotes(clientId, { limit })
  }

  async getTodos(clientId, includeCompleted = false) {
    const filters = {
      category: 'todo',
      status: includeCompleted ? undefined : 'active'
    }
    return this.getNotes(clientId, filters)
  }

  async getGoals(clientId, activeOnly = true) {
    const filters = {
      category: 'goal',
      status: activeOnly ? 'active' : undefined
    }
    return this.getNotes(clientId, filters)
  }

  async getQuickNotes(clientId, sessionId = null) {
    try {
      let query = this.supabase
        .from('quick_notes')
        .select('*')
        .eq('client_id', clientId)
        .is('converted_to_note_id', null)
        .order('timestamp', { ascending: false })

      if (sessionId) {
        query = query.eq('session_id', sessionId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching quick notes:', error)
      return []
    }
  }

  // ============== UPDATE OPERATIONS ==============
  
  async updateNote(noteId, updates) {
    try {
      console.log('📝 Updating note:', noteId, updates)
      
      // If content is being updated, merge with existing
      if (updates.content && typeof updates.content === 'object') {
        const existing = await this.getNote(noteId)
        if (existing && existing.content) {
          updates.content = {
            ...existing.content,
            ...updates.content,
            sections: updates.content.sections || existing.content.sections
          }
        }
      }

      const { data, error } = await this.supabase
        .from('client_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()

      if (error) {
        console.error('❌ Update error:', error)
        throw error
      }
      
      console.log('✅ Note updated:', data)
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('Error updating note:', error)
      throw error
    }
  }

  async addSection(noteId, section) {
    try {
      const note = await this.getNote(noteId)
      if (!note) throw new Error('Note not found')

      const sections = note.content?.sections || []
      sections.push({
        id: `section_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...section
      })

      return this.updateNote(noteId, {
        content: { ...note.content, sections }
      })
    } catch (error) {
      console.error('Error adding section:', error)
      throw error
    }
  }

  async updateSection(noteId, sectionId, updates) {
    try {
      const note = await this.getNote(noteId)
      if (!note) throw new Error('Note not found')

      const sections = note.content?.sections || []
      const sectionIndex = sections.findIndex(s => s.id === sectionId)
      
      if (sectionIndex === -1) throw new Error('Section not found')
      
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        ...updates,
        updated_at: new Date().toISOString()
      }

      return this.updateNote(noteId, {
        content: { ...note.content, sections }
      })
    } catch (error) {
      console.error('Error updating section:', error)
      throw error
    }
  }

  async deleteSection(noteId, sectionId) {
    try {
      const note = await this.getNote(noteId)
      if (!note) throw new Error('Note not found')

      const sections = (note.content?.sections || []).filter(s => s.id !== sectionId)

      return this.updateNote(noteId, {
        content: { ...note.content, sections }
      })
    } catch (error) {
      console.error('Error deleting section:', error)
      throw error
    }
  }

  async completeNote(noteId) {
    return this.updateNote(noteId, {
      status: 'completed',
      completed_at: new Date().toISOString()
    })
  }

  async archiveNote(noteId) {
    return this.updateNote(noteId, {
      status: 'archived'
    })
  }

  async toggleTodo(noteId, todoId) {
    try {
      const note = await this.getNote(noteId)
      if (!note) throw new Error('Note not found')

      const sections = note.content?.sections || []
      
      for (let section of sections) {
        if (section.type === 'todo' && section.items) {
          const todo = section.items.find(item => item.id === todoId)
          if (todo) {
            todo.completed = !todo.completed
            todo.completed_at = todo.completed ? new Date().toISOString() : null
            break
          }
        }
      }

      return this.updateNote(noteId, {
        content: { ...note.content, sections }
      })
    } catch (error) {
      console.error('Error toggling todo:', error)
      throw error
    }
  }

  // ============== DELETE OPERATIONS ==============
  
  async deleteNote(noteId) {
    try {
      // Soft delete by updating status
      return this.updateNote(noteId, {
        status: 'deleted'
      })
    } catch (error) {
      console.error('Error deleting note:', error)
      throw error
    }
  }

  async hardDeleteNote(noteId) {
    try {
      const { error } = await this.supabase
        .from('client_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error hard deleting note:', error)
      throw error
    }
  }

  // ============== TEMPLATE OPERATIONS ==============
  
  async getTemplates(category = null) {
    try {
      const user = await this.db.getCurrentUser()
      let query = this.supabase
        .from('note_templates')
        .select('*')
        .or(`coach_id.eq.${user?.id},is_default.eq.true`)
        .order('usage_count', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching templates:', error)
      return []
    }
  }

  async createTemplate(templateData) {
    try {
      const user = await this.db.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await this.supabase
        .from('note_templates')
        .insert({
          coach_id: user.id,
          name: templateData.name,
          category: templateData.category,
          template_content: templateData.content,
          is_default: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  async createNoteFromTemplate(clientId, templateId, additionalData = {}) {
    try {
      const template = await this.supabase
        .from('note_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (template.error) throw template.error

      const noteData = {
        title: template.data.name,
        category: template.data.category,
        content: template.data.template_content,
        ...additionalData
      }

      // Update template usage count
      await this.supabase
        .from('note_templates')
        .update({ usage_count: (template.data.usage_count || 0) + 1 })
        .eq('id', templateId)

      return this.createNote(clientId, noteData)
    } catch (error) {
      console.error('Error creating note from template:', error)
      throw error
    }
  }

  // ============== TAG OPERATIONS ==============
  
  async getTags() {
    try {
      const user = await this.db.getCurrentUser()
      if (!user) return []

      const { data, error } = await this.supabase
        .from('note_tags')
        .select('*')
        .eq('coach_id', user.id)
        .order('usage_count', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching tags:', error)
      return []
    }
  }

  async createTag(tagName, color = '#10b981') {
    try {
      const user = await this.db.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await this.supabase
        .from('note_tags')
        .insert({
          coach_id: user.id,
          tag_name: tagName,
          color: color
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating tag:', error)
      throw error
    }
  }

  async updateTagUsage(tagName) {
    try {
      const user = await this.db.getCurrentUser()
      if (!user) return

      await this.supabase.rpc('increment', {
        table_name: 'note_tags',
        column_name: 'usage_count',
        row_id: tagName,
        x: 1
      })
    } catch (error) {
      console.error('Error updating tag usage:', error)
    }
  }

  // ============== STATISTICS ==============
  
  async getNoteStats(clientId) {
    try {
      const notes = await this.getNotes(clientId)
      
      return {
        total: notes.length,
        byCategory: this.groupByCategory(notes),
        byStatus: this.groupByStatus(notes),
        byPriority: this.groupByPriority(notes),
        recentActivity: notes.slice(0, 5),
        todos: {
          active: notes.filter(n => n.category === 'todo' && n.status === 'active').length,
          completed: notes.filter(n => n.category === 'todo' && n.status === 'completed').length
        },
        goals: {
          active: notes.filter(n => n.category === 'goal' && n.status === 'active').length,
          completed: notes.filter(n => n.category === 'goal' && n.status === 'completed').length
        }
      }
    } catch (error) {
      console.error('Error getting note stats:', error)
      return null
    }
  }

  // Helper functions
  groupByCategory(notes) {
    return notes.reduce((acc, note) => {
      acc[note.category] = (acc[note.category] || 0) + 1
      return acc
    }, {})
  }

  groupByStatus(notes) {
    return notes.reduce((acc, note) => {
      acc[note.status] = (acc[note.status] || 0) + 1
      return acc
    }, {})
  }

  groupByPriority(notes) {
    return notes.reduce((acc, note) => {
      acc[note.priority] = (acc[note.priority] || 0) + 1
      return acc
    }, {})
  }

  // ============== QUICK NOTE CONVERSION ==============
  
  async convertQuickNotesToNote(clientId, sessionId, title = 'Session Notes') {
    try {
      const quickNotes = await this.getQuickNotes(clientId, sessionId)
      if (quickNotes.length === 0) return null

      // Create sections from quick notes
      const sections = quickNotes.map(qn => ({
        id: `section_${qn.id}`,
        type: 'text',
        title: `Note ${new Date(qn.timestamp).toLocaleTimeString()}`,
        content: qn.content,
        timestamp: qn.timestamp
      }))

      // Create the main note
      const note = await this.createNote(clientId, {
        title: title,
        subtitle: `Converted from ${quickNotes.length} quick notes`,
        category: 'session',
        content: { sections }
      })

      // Mark quick notes as converted
      for (const qn of quickNotes) {
        await this.supabase
          .from('quick_notes')
          .update({ converted_to_note_id: note.id })
          .eq('id', qn.id)
      }

      return note
    } catch (error) {
      console.error('Error converting quick notes:', error)
      throw error
    }
  }
}
