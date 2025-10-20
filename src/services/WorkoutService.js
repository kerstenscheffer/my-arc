// src/services/WorkoutService.js
// WORKOUT SERVICE - Custom Workouts & Week Templates 🏋️

class WorkoutService {
  constructor(supabase) {
    this.supabase = supabase
  }

  // ==========================================
  // CUSTOM WORKOUTS (DAG TEMPLATES)
  // ==========================================

  /**
   * Create a custom workout
   * @param {string} clientId 
   * @param {object} data - { name, type, duration, description, is_template }
   * @returns {object} Created workout
   */
  async createCustomWorkout(clientId, data) {
    try {
      console.log('📝 Creating custom workout:', data)

      const { data: workout, error } = await this.supabase
        .from('custom_workouts')
        .insert({
          client_id: clientId,
          name: data.name,
          type: data.type,
          duration: data.duration,
          description: data.description,
          is_template: data.is_template || false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Custom workout created:', workout)
      return workout
    } catch (error) {
      console.error('❌ Create custom workout failed:', error)
      throw error
    }
  }

  /**
   * Get all custom workouts for a client
   * @param {string} clientId 
   * @returns {array} All custom workouts
   */
  async getCustomWorkouts(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('custom_workouts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('✅ Custom workouts loaded:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Get custom workouts failed:', error)
      return []
    }
  }

  /**
   * Get only template custom workouts
   * @param {string} clientId 
   * @returns {array} Template workouts
   */
  async getCustomWorkoutTemplates(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('custom_workouts')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_template', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('✅ Custom workout templates loaded:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Get custom workout templates failed:', error)
      return []
    }
  }

  /**
   * Update a custom workout
   * @param {string} workoutId 
   * @param {object} updates 
   * @returns {object} Updated workout
   */
  async updateCustomWorkout(workoutId, updates) {
    try {
      console.log('✏️ Updating custom workout:', workoutId, updates)

      const { data, error } = await this.supabase
        .from('custom_workouts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', workoutId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Custom workout updated')
      return data
    } catch (error) {
      console.error('❌ Update custom workout failed:', error)
      throw error
    }
  }

  /**
   * Delete a custom workout
   * @param {string} workoutId 
   * @returns {boolean} Success
   */
  async deleteCustomWorkout(workoutId) {
    try {
      console.log('🗑️ Deleting custom workout:', workoutId)

      const { error } = await this.supabase
        .from('custom_workouts')
        .delete()
        .eq('id', workoutId)

      if (error) throw error

      console.log('✅ Custom workout deleted')
      return true
    } catch (error) {
      console.error('❌ Delete custom workout failed:', error)
      throw error
    }
  }

  /**
   * Get a single custom workout by ID
   * @param {string} workoutId 
   * @returns {object} Workout
   */
  async getCustomWorkoutById(workoutId) {
    try {
      const { data, error } = await this.supabase
        .from('custom_workouts')
        .select('*')
        .eq('id', workoutId)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('❌ Get custom workout by ID failed:', error)
      return null
    }
  }

  // ==========================================
  // WEEK TEMPLATES
  // ==========================================

  /**
   * Save current week schedule as template
   * @param {string} clientId 
   * @param {string} templateName 
   * @param {object} schedule - Week schedule object
   * @returns {object} Created template
   */
  async saveWeekTemplate(clientId, templateName, schedule) {
    try {
      console.log('💾 Saving week template:', templateName)

      const { data, error } = await this.supabase
        .from('week_templates')
        .insert({
          client_id: clientId,
          template_name: templateName,
          schedule: schedule,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Week template saved:', data)
      return data
    } catch (error) {
      console.error('❌ Save week template failed:', error)
      throw error
    }
  }

  /**
   * Get all week templates for a client
   * @param {string} clientId 
   * @returns {array} Week templates
   */
  async getWeekTemplates(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('week_templates')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('✅ Week templates loaded:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('❌ Get week templates failed:', error)
      return []
    }
  }

  /**
   * Delete a week template
   * @param {string} templateId 
   * @returns {boolean} Success
   */
  async deleteWeekTemplate(templateId) {
    try {
      console.log('🗑️ Deleting week template:', templateId)

      const { error } = await this.supabase
        .from('week_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      console.log('✅ Week template deleted')
      return true
    } catch (error) {
      console.error('❌ Delete week template failed:', error)
      throw error
    }
  }

  /**
   * Load a week template (returns schedule)
   * @param {string} templateId 
   * @returns {object} Schedule object
   */
  async loadWeekTemplate(templateId) {
    try {
      const { data, error } = await this.supabase
        .from('week_templates')
        .select('schedule')
        .eq('id', templateId)
        .single()

      if (error) throw error

      console.log('✅ Week template loaded')
      return data.schedule
    } catch (error) {
      console.error('❌ Load week template failed:', error)
      return null
    }
  }

  // ==========================================
  // WEEK SCHEDULE (from DatabaseService)
  // ==========================================

  /**
   * Get client's current week schedule
   * @param {string} clientId 
   * @returns {object} Schedule
   */
  async getWeekSchedule(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('workout_schedule')
        .eq('id', clientId)
        .single()

      if (error) throw error

      return data?.workout_schedule || null
    } catch (error) {
      console.error('❌ Get week schedule failed:', error)
      return null
    }
  }

  /**
   * Update client's week schedule
   * @param {string} clientId 
   * @param {object} schedule 
   * @returns {boolean} Success
   */
  async updateWeekSchedule(clientId, schedule) {
    try {
      const { error } = await this.supabase
        .from('clients')
        .update({
          workout_schedule: schedule,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) throw error

      console.log('✅ Week schedule updated')
      return true
    } catch (error) {
      console.error('❌ Update week schedule failed:', error)
      throw error
    }
  }

  // ==========================================
  // WORKOUT SCHEMAS (existing workouts)
  // ==========================================

  /**
   * Get workout schema by ID
   * @param {string} schemaId 
   * @returns {object} Schema
   */
  async getWorkoutSchema(schemaId) {
    try {
      const { data, error } = await this.supabase
        .from('workout_schemas')
        .select('*')
        .eq('id', schemaId)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('❌ Get workout schema failed:', error)
      return null
    }
  }

  /**
   * Update exercise in schema
   * @param {string} schemaId 
   * @param {string} dayKey 
   * @param {number} exerciseIndex 
   * @param {object} updatedExercise 
   * @returns {boolean} Success
   */
  async updateExerciseInSchema(schemaId, dayKey, exerciseIndex, updatedExercise) {
    try {
      // Get current schema
      const schema = await this.getWorkoutSchema(schemaId)
      if (!schema) throw new Error('Schema not found')

      // Update exercise
      const weekStructure = { ...schema.week_structure }
      if (!weekStructure[dayKey]) throw new Error('Day not found')

      weekStructure[dayKey].exercises[exerciseIndex] = updatedExercise

      // Save back
      const { error } = await this.supabase
        .from('workout_schemas')
        .update({
          week_structure: weekStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', schemaId)

      if (error) throw error

      console.log('✅ Exercise updated in schema')
      return true
    } catch (error) {
      console.error('❌ Update exercise in schema failed:', error)
      throw error
    }
  }
}

export default WorkoutService
