// src/modules/workout/services/WorkoutServiceNew.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

class WorkoutServiceNew {
  constructor() {
    this._fallback = null
  }

  _client(db) {
    if (db?.supabase) return db.supabase
    if (!this._fallback) this._fallback = createClient(supabaseUrl, supabaseKey)
    return this._fallback
  }

  getCurrentWeekStart() {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday.toISOString().split('T')[0]
  }

  async getWeeklyOverrides(clientId, schemaId, db) {
    if (!clientId || !schemaId) return []
    try {
      const weekStart = this.getCurrentWeekStart()
      const { data, error } = await this._client(db)
        .from('client_exercise_overrides')
        .select('*')
        .eq('client_id', clientId)
        .eq('schema_id', schemaId)
        .eq('week_start', weekStart)
      if (error) throw error
      console.log(`✅ Overrides geladen: ${data?.length || 0} voor week ${weekStart}`)
      return data || []
    } catch (error) {
      console.error('❌ getWeeklyOverrides failed:', error)
      return []
    }
  }

  async saveWeeklyOverride(clientId, schemaId, dayKey, exerciseIndex, exerciseData, db) {
    if (!clientId || !schemaId || !dayKey) return null
    try {
      const weekStart = this.getCurrentWeekStart()
      const { data, error } = await this._client(db)
        .from('client_exercise_overrides')
        .upsert({
          client_id: clientId,
          schema_id: schemaId,
          week_start: weekStart,
          day_key: dayKey,
          exercise_index: exerciseIndex,
          exercise_data: exerciseData
        }, { onConflict: 'client_id,schema_id,week_start,day_key,exercise_index' })
        .select()
        .single()
      if (error) throw error
      console.log('✅ Weekly override opgeslagen:', exerciseData.name)
      return data
    } catch (error) {
      console.error('❌ saveWeeklyOverride failed:', error)
      return null
    }
  }

  async removeWeeklyOverride(clientId, schemaId, dayKey, exerciseIndex, db) {
    if (!clientId || !schemaId) return false
    try {
      const weekStart = this.getCurrentWeekStart()
      const { error } = await this._client(db)
        .from('client_exercise_overrides')
        .delete()
        .eq('client_id', clientId)
        .eq('schema_id', schemaId)
        .eq('week_start', weekStart)
        .eq('day_key', dayKey)
        .eq('exercise_index', exerciseIndex)
      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ removeWeeklyOverride failed:', error)
      return false
    }
  }

  applyOverridesToSchema(schema, overrides) {
    if (!schema?.week_structure || !overrides?.length) {
      console.log('⚠️ applyOverrides — leeg:', { hasWeekStructure: !!schema?.week_structure, overridesCount: overrides?.length })
      return schema
    }
    const weekStructure = JSON.parse(JSON.stringify(schema.week_structure))
    console.log('🔍 week_structure keys:', Object.keys(weekStructure))

    overrides.forEach(override => {
      const idx = parseInt(override.exercise_index)
      const day = weekStructure[override.day_key]
      console.log('🔄 Override:', {
        day_key: override.day_key,
        idx,
        new_name: override.exercise_data?.name,
        day_found: !!day,
        exercises_count: day?.exercises?.length ?? 'geen exercises'
      })
      if (!day) { console.log('❌ day_key niet gevonden:', override.day_key); return }
      if (!day.exercises) { console.log('❌ Geen exercises array'); return }
      if (idx >= day.exercises.length) { console.log('❌ Index out of bounds:', idx, '>=', day.exercises.length); return }

      const original = day.exercises[idx]?.name
      weekStructure[override.day_key].exercises[idx] = {
        ...override.exercise_data,
        _isWeeklyOverride: true,
        _originalName: original
      }
      console.log('✅ Override toegepast:', original, '->', override.exercise_data?.name)
    })
    return { ...schema, week_structure: weekStructure }
  }

  async getSchemaWithOverrides(clientId, schema, db) {
    if (!schema?.id) return schema
    try {
      console.log('🔍 getSchemaWithOverrides — clientId:', clientId, 'schemaId:', schema.id)
      const overrides = await this.getWeeklyOverrides(clientId, schema.id, db)
      console.log('🔍 Overrides raw:', JSON.stringify(overrides))
      return this.applyOverridesToSchema(schema, overrides)
    } catch (error) {
      console.error('❌ getSchemaWithOverrides failed:', error)
      return schema
    }
  }

  async resetWeeklyOverrides(clientId, schemaId, db) {
    if (!clientId || !schemaId) return false
    try {
      const weekStart = this.getCurrentWeekStart()
      const { error } = await this._client(db)
        .from('client_exercise_overrides')
        .delete()
        .eq('client_id', clientId)
        .eq('schema_id', schemaId)
        .eq('week_start', weekStart)
      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ resetWeeklyOverrides failed:', error)
      return false
    }
  }

  hasOverride(overrides, dayKey, exerciseIndex) {
    return overrides.some(o => o.day_key === dayKey && o.exercise_index === exerciseIndex)
  }
}

export default new WorkoutServiceNew()
