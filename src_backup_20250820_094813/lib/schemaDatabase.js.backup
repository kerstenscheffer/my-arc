// src/lib/schemaDatabase.js
import { supabase } from './supabase'

// ===== WORKOUT SCHEMAS =====

/**
 * Save a workout schema to the database
 */
export async function saveWorkoutSchema(schema, user) {
  try {
    console.log('💾 Saving schema to database:', schema.name)
    
    const schemaData = {
      user_id: user.id,
      name: schema.name,
      description: schema.description || '',
      client_name: schema.conditions?.name || '',
      
      // Goal & Conditions
      primary_goal: schema.conditions?.goal || 'hypertrophy',
      specific_goal: schema.conditions?.specificGoal || null,
      experience_level: schema.conditions?.experience || 'intermediate',
      days_per_week: schema.conditions?.daysPerWeek || 4,
      time_per_session: schema.conditions?.timePerSession || 75,
      equipment: schema.conditions?.equipment || ['full_gym'],
      
      // Split Info
      split_type: schema.splitOverview?.type || 'custom',
      split_name: schema.splitOverview?.schema || schema.name,
      
      // Schema Data (as JSON)
      week_structure: schema.weekStructure || {},
      volume_analysis: schema.volumeAnalysis || null,
      specific_goal_data: schema.specificGoal || null,
      
      // Metadata
      is_ai_generated: schema.mode === 'ai_generated' || schema.generated || false,
      generation_options: schema.generationOptions || null,
      is_public: false,
      is_template: false
    }

    const { data, error } = await supabase
      .from('workout_schemas')
      .insert([schemaData])
      .select('*')
      .single()

    if (error) {
      console.error('❌ Error saving schema:', error)
      throw error
    }

    console.log('✅ Schema saved successfully:', data.id)
    return data

  } catch (error) {
    console.error('❌ Failed to save schema:', error)
    throw new Error(`Failed to save schema: ${error.message}`)
  }
}

/**
 * Update an existing workout schema
 */
export async function updateWorkoutSchema(schemaId, updates) {
  try {
    console.log('📝 Updating schema:', schemaId)

    const { data, error } = await supabase
      .from('workout_schemas')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', schemaId)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Error updating schema:', error)
      throw error
    }

    console.log('✅ Schema updated successfully')
    return data

  } catch (error) {
    console.error('❌ Failed to update schema:', error)
    throw new Error(`Failed to update schema: ${error.message}`)
  }
}

/**
 * Get all workout schemas for the current user
 */
export async function getUserWorkoutSchemas(userId, filters = {}) {
  try {
    console.log('📚 Loading user schemas...')

    let query = supabase
      .from('workout_schemas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.primaryGoal) {
      query = query.eq('primary_goal', filters.primaryGoal)
    }
    if (filters.specificGoal) {
      query = query.eq('specific_goal', filters.specificGoal)
    }
    if (filters.daysPerWeek) {
      query = query.eq('days_per_week', filters.daysPerWeek)
    }
    if (filters.aiGenerated !== undefined) {
      query = query.eq('is_ai_generated', filters.aiGenerated)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error loading schemas:', error)
      throw error
    }

    console.log(`✅ Loaded ${data.length} schemas`)
    return data

  } catch (error) {
    console.error('❌ Failed to load schemas:', error)
    throw new Error(`Failed to load schemas: ${error.message}`)
  }
}

/**
 * Get a specific workout schema by ID
 */
export async function getWorkoutSchema(schemaId) {
  try {
    console.log('📖 Loading schema:', schemaId)

    const { data, error } = await supabase
      .from('workout_schemas')
      .select('*')
      .eq('id', schemaId)
      .single()

    if (error) {
      console.error('❌ Error loading schema:', error)
      throw error
    }

    console.log('✅ Schema loaded successfully')
    return data

  } catch (error) {
    console.error('❌ Failed to load schema:', error)
    throw new Error(`Failed to load schema: ${error.message}`)
  }
}

/**
 * Delete a workout schema
 */
export async function deleteWorkoutSchema(schemaId) {
  try {
    console.log('🗑️ Deleting schema:', schemaId)

    const { error } = await supabase
      .from('workout_schemas')
      .delete()
      .eq('id', schemaId)

    if (error) {
      console.error('❌ Error deleting schema:', error)
      throw error
    }

    console.log('✅ Schema deleted successfully')
    return true

  } catch (error) {
    console.error('❌ Failed to delete schema:', error)
    throw new Error(`Failed to delete schema: ${error.message}`)
  }
}

// ===== USER PREFERENCES =====

/**
 * Save user workout preferences
 */
export async function saveUserPreferences(userId, preferences) {
  try {
    console.log('💾 Saving user preferences...')

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_workout_preferences')
      .select('id')
      .eq('user_id', userId)
      .single()

    let result
    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_workout_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('*')
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('user_workout_preferences')
        .insert([{
          user_id: userId,
          ...preferences
        }])
        .select('*')
        .single()

      if (error) throw error
      result = data
    }

    console.log('✅ User preferences saved successfully')
    return result

  } catch (error) {
    console.error('❌ Failed to save user preferences:', error)
    throw new Error(`Failed to save preferences: ${error.message}`)
  }
}

/**
 * Get user workout preferences
 */
export async function getUserPreferences(userId) {
  try {
    console.log('📚 Loading user preferences...')

    const { data, error } = await supabase
      .from('user_workout_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error loading preferences:', error)
      throw error
    }

    if (!data) {
      // Return default preferences
      return {
        default_experience_level: 'intermediate',
        default_days_per_week: 4,
        default_time_per_session: 75,
        default_equipment: ['full_gym'],
        default_primary_goal: 'hypertrophy',
        exercise_ratings: {},
        split_preferences: {},
        emphasize_stretch: true,
        prioritize_compounds: true,
        use_personal_ratings: true
      }
    }

    console.log('✅ User preferences loaded successfully')
    return data

  } catch (error) {
    console.error('❌ Failed to load user preferences:', error)
    throw new Error(`Failed to load preferences: ${error.message}`)
  }
}

// ===== WORKOUT SESSIONS =====

/**
 * Save a completed workout session
 */
export async function saveWorkoutSession(session) {
  try {
    console.log('💾 Saving workout session...')

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert([session])
      .select('*')
      .single()

    if (error) {
      console.error('❌ Error saving session:', error)
      throw error
    }

    console.log('✅ Workout session saved successfully')
    return data

  } catch (error) {
    console.error('❌ Failed to save session:', error)
    throw new Error(`Failed to save session: ${error.message}`)
  }
}

/**
 * Get workout sessions for a schema
 */
export async function getWorkoutSessions(schemaId, limit = 50) {
  try {
    console.log('📚 Loading workout sessions...')

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('schema_id', schemaId)
      .order('workout_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error loading sessions:', error)
      throw error
    }

    console.log(`✅ Loaded ${data.length} workout sessions`)
    return data

  } catch (error) {
    console.error('❌ Failed to load sessions:', error)
    throw new Error(`Failed to load sessions: ${error.message}`)
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Convert database schema back to app format
 */
export function convertDbSchemaToApp(dbSchema) {
  return {
    id: dbSchema.id,
    name: dbSchema.name,
    description: dbSchema.description,
    conditions: {
      name: dbSchema.client_name,
      goal: dbSchema.primary_goal,
      specificGoal: dbSchema.specific_goal,
      experience: dbSchema.experience_level,
      daysPerWeek: dbSchema.days_per_week,
      timePerSession: dbSchema.time_per_session,
      equipment: dbSchema.equipment
    },
    splitOverview: {
      schema: dbSchema.split_name,
      type: dbSchema.split_type
    },
    weekStructure: dbSchema.week_structure,
    volumeAnalysis: dbSchema.volume_analysis,
    specificGoal: dbSchema.specific_goal_data,
    mode: dbSchema.is_ai_generated ? 'ai_generated' : 'manual',
    generated: dbSchema.is_ai_generated,
    createdAt: dbSchema.created_at,
    updatedAt: dbSchema.updated_at
  }
}

/**
 * Get schema statistics for dashboard
 */
export async function getUserSchemaStats(userId) {
  try {
    console.log('📊 Loading schema statistics...')

    // Get total schemas
    const { count: totalSchemas, error: countError } = await supabase
      .from('workout_schemas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) throw countError

    // Get AI generated count
    const { count: aiGenerated, error: aiError } = await supabase
      .from('workout_schemas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_ai_generated', true)

    if (aiError) throw aiError

    // Get most popular goals
    const { data: goalStats, error: goalError } = await supabase
      .from('workout_schemas')
      .select('primary_goal')
      .eq('user_id', userId)

    if (goalError) throw goalError

    const goalCounts = goalStats.reduce((acc, schema) => {
      acc[schema.primary_goal] = (acc[schema.primary_goal] || 0) + 1
      return acc
    }, {})

    console.log('✅ Schema statistics loaded')
    return {
      totalSchemas: totalSchemas || 0,
      aiGenerated: aiGenerated || 0,
      manualCreated: (totalSchemas || 0) - (aiGenerated || 0),
      goalBreakdown: goalCounts
    }

  } catch (error) {
    console.error('❌ Failed to load statistics:', error)
    throw new Error(`Failed to load statistics: ${error.message}`)
  }
}
