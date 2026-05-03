// src/modules/workout/services/ClientPlanEditorService.js

export default class ClientPlanEditorService {
  constructor(supabase) {
    this.supabase = supabase
  }

  // Maak een client fork van het originele schema
  async forkSchema(originalSchema, clientId) {
    try {
      const forkedStructure = JSON.parse(JSON.stringify(originalSchema.week_structure))

      const { data, error } = await this.supabase
        .from('workout_schemas')
        .insert({
          user_id: originalSchema.user_id, // coach blijft eigenaar
          name: `${originalSchema.name} (aangepast)`,
          description: originalSchema.description || null,
          client_name: originalSchema.client_name || null,
          week_structure: forkedStructure,
          primary_goal: originalSchema.primary_goal || 'general_fitness',
          specific_goal: originalSchema.specific_goal || null,
          experience_level: originalSchema.experience_level || 'intermediate',
          days_per_week: originalSchema.days_per_week || null,
          time_per_session: originalSchema.time_per_session || null,
          equipment: originalSchema.equipment || null,
          split_type: originalSchema.split_type || null,
          split_name: originalSchema.split_name || null,
          is_client_edited: true,
          original_schema_id: originalSchema.id,
          client_edited_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Schema fork aangemaakt:', data.id)
      return data
    } catch (e) {
      console.error('❌ Fork schema failed:', e)
      throw e
    }
  }

  // Wijs het forked schema toe aan de client
  async assignSchemaToClient(clientId, schemaId) {
    try {
      const { error } = await this.supabase
        .from('clients')
        .update({ assigned_schema_id: schemaId })
        .eq('id', clientId)

      if (error) throw error
      console.log('✅ Schema toegewezen aan client')
    } catch (e) {
      console.error('❌ Assign schema failed:', e)
      throw e
    }
  }

  // Sla de gewijzigde week_structure op in het forked schema
  async saveForkedSchema(schemaId, weekStructure) {
    try {
      const { data, error } = await this.supabase
        .from('workout_schemas')
        .update({
          week_structure: weekStructure,
          client_edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', schemaId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (e) {
      console.error('❌ Save forked schema failed:', e)
      throw e
    }
  }

  // Zoek oefeningen voor toevoegen
  async searchExercises(query, clientId) {
    try {
      const [dbResult, customResult] = await Promise.all([
        this.supabase
          .from('exercises')
          .select('id, name, primair_spieren, equipment, image_url')
          .ilike('name', `%${query}%`)
          .limit(30),
        clientId
          ? this.supabase
              .from('custom_exercises')
              .select('id, name, muscle_group, sets, reps')
              .eq('client_id', clientId)
              .ilike('name', `%${query}%`)
              .limit(10)
          : Promise.resolve({ data: [] })
      ])

      const custom = (customResult.data || []).map(e => ({
        ...e,
        primair_spieren: e.muscle_group || null,
        image_url: null,
        _isCustom: true
      }))
      const standard = dbResult.data || []
      const seen = new Set(custom.map(c => c.name.toLowerCase()))
      return [...custom, ...standard.filter(e => !seen.has(e.name.toLowerCase()))]
    } catch (e) {
      console.error('❌ Search exercises failed:', e)
      return []
    }
  }
}
