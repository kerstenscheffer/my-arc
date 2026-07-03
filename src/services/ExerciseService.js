// src/services/ExerciseService.js
import { supabase } from '../lib/supabase'

class ExerciseServiceClass {
  constructor() {
    this.supabase = supabase
    this.cache = new Map()
    this.cacheTimeout = 10 * 60 * 1000
    console.log('🏋️ ExerciseService initialized!')
  }

  getCached(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) return cached.data
    return null
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) this.cache.delete(key)
      }
    } else {
      this.cache.clear()
    }
  }

  /**
   * Search exercises — zoekt in `exercises` tabel + optioneel `custom_exercises` van client
   * @param {string} query
   * @param {Object} options
   * @param {string} options.clientId — als opgegeven: voeg eigen oefeningen toe bovenaan resultaten
   */
  async searchExercises(query, options = {}) {
    try {
      const {
        muscleGroup = null,
        equipment = null,
        homeOnly = false,
        difficulty = null,
        limit = 20,
        clientId = null
      } = options

      // ── 1. Query op exercises tabel ──
      let queryBuilder = this.supabase.from('exercises').select('*')

      if (homeOnly) queryBuilder = queryBuilder.eq('home_friendly', true)
      if (muscleGroup) queryBuilder = queryBuilder.eq('primair_spieren', muscleGroup)
      if (equipment) queryBuilder = queryBuilder.eq('equipment', equipment)
      if (difficulty) queryBuilder = queryBuilder.eq('difficulty', difficulty)

      if (query && query.trim()) {
        const searchTerm = query.toLowerCase().trim()
        queryBuilder = queryBuilder.or(`name.ilike.%${searchTerm}%,search_terms.cs.{${searchTerm}}`)
      }

      queryBuilder = queryBuilder.eq('is_active', true).order('name').limit(limit)

      // ── 2. Parallel: custom_exercises van deze client ──
      const promises = [queryBuilder]

      // clientId = clients.id (FK in custom_exercises)
      if (clientId && query && query.trim()) {
        const searchTerm = query.toLowerCase().trim()
        promises.push(
          this.supabase
            .from('custom_exercises')
            .select('*')
            .eq('client_id', clientId)
            .ilike('name', `%${searchTerm}%`)
            .order('created_at', { ascending: false })
            .limit(10)
        )
      }

      const results = await Promise.all(promises)

      const { data: dbExercises, error } = results[0]
      if (error) throw error

      // Normalise custom exercises naar zelfde shape als exercises
      let customResults = []
      if (results[1]) {
        const { data: customData } = results[1]
        customResults = (customData || []).map(c => ({
          id: c.id,
          name: c.name,
          primair_spieren: c.primair_spieren || c.muscleGroup || null,
          equipment: c.equipment || null,
          type: 'custom',
          image_url: c.image_url || null,
          sets: c.sets,
          reps: c.reps,
          rust: c.rust,
          is_active: true,
          _isCustom: true // marker voor UI
        }))
      }

      // Custom bovenaan, daarna db — dedup op naam
      const seen = new Set(customResults.map(c => c.name.toLowerCase()))
      const deduped = (dbExercises || []).filter(ex => !seen.has(ex.name.toLowerCase()))

      const merged = [...customResults, ...deduped]

      console.log(`✅ ExerciseService: ${customResults.length} custom + ${deduped.length} db voor "${query}"`)
      return merged

    } catch (error) {
      console.error('❌ ExerciseService.searchExercises failed:', error)
      return []
    }
  }

  async getExerciseDetails(exerciseName) {
    try {
      if (!exerciseName) return null
      const cacheKey = `exercise_details_${exerciseName}`
      const cached = this.getCached(cacheKey)
      if (cached) return cached

      const { data, error } = await this.supabase
        .from('exercises').select('*').eq('name', exerciseName).single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('❌ ExerciseService.getExerciseDetails failed:', error)
      return null
    }
  }

  async getExerciseImage(exerciseName) {
    try {
      const details = await this.getExerciseDetails(exerciseName)
      return details?.image_url || null
    } catch (error) {
      console.error('❌ ExerciseService.getExerciseImage failed:', error)
      return null
    }
  }

  async getExerciseVideo(exerciseName) {
    try {
      const details = await this.getExerciseDetails(exerciseName)
      // Coach-eigen video heeft voorrang; valt anders terug op de externe
      // creator-video (fallback_video_url) zodat de client altijd iets te
      // zien krijgt van de juiste uitvoering.
      return details?.video_url || details?.fallback_video_url || null
    } catch (error) {
      console.error('❌ ExerciseService.getExerciseVideo failed:', error)
      return null
    }
  }

  async getExercisesByMuscleGroup(muscleGroup, options = {}) {
    try {
      const { homeOnly = false, equipment = null, limit = 50 } = options
      const cacheKey = `exercises_${muscleGroup}_${homeOnly}_${equipment}`
      const cached = this.getCached(cacheKey)
      if (cached) return cached

      let q = this.supabase.from('exercises').select('*')
        .eq('primair_spieren', muscleGroup).eq('is_active', true)
      if (homeOnly) q = q.eq('home_friendly', true)
      if (equipment) q = q.eq('equipment', equipment)
      q = q.order('name').limit(limit)

      const { data, error } = await q
      if (error) throw error
      this.setCache(cacheKey, data)
      return data || []
    } catch (error) {
      console.error('❌ ExerciseService.getExercisesByMuscleGroup failed:', error)
      return []
    }
  }

  async getHomeExercises(muscleGroup = null) {
    try {
      const cacheKey = `home_exercises_${muscleGroup || 'all'}`
      const cached = this.getCached(cacheKey)
      if (cached) return cached

      let q = this.supabase.from('exercises').select('*')
        .eq('home_friendly', true).eq('is_active', true)
      if (muscleGroup) q = q.eq('primair_spieren', muscleGroup)
      q = q.order('name')

      const { data, error } = await q
      if (error) throw error
      this.setCache(cacheKey, data)
      return data || []
    } catch (error) {
      console.error('❌ ExerciseService.getHomeExercises failed:', error)
      return []
    }
  }

  async getAlternativeExercises(muscleGroup, currentExerciseName, options = {}) {
    try {
      const { homeOnly = false, equipment = null, limit = 30 } = options
      let q = this.supabase.from('exercises').select('*')
        .eq('primair_spieren', muscleGroup).neq('name', currentExerciseName).eq('is_active', true)
      if (homeOnly) q = q.eq('home_friendly', true)
      if (equipment) q = q.eq('equipment', equipment)
      q = q.order('name').limit(limit)

      const { data, error } = await q
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ ExerciseService.getAlternativeExercises failed:', error)
      return []
    }
  }

  async getAllExercises(options = {}) {
    try {
      const { homeOnly = false, equipment = null, limit = 200 } = options
      const cacheKey = `all_exercises_${homeOnly}_${equipment}`
      const cached = this.getCached(cacheKey)
      if (cached) return cached

      let q = this.supabase.from('exercises')
        .select('name, equipment, type, primair_spieren, tags, home_friendly, gym_friendly, difficulty')
        .eq('is_active', true)
      if (homeOnly) q = q.eq('home_friendly', true)
      if (equipment) q = q.eq('equipment', equipment)
      q = q.order('name').limit(limit)

      const { data, error } = await q
      if (error) throw error
      this.setCache(cacheKey, data)
      return data || []
    } catch (error) {
      console.error('❌ ExerciseService.getAllExercises failed:', error)
      return []
    }
  }

  async getEquipmentTypes(muscleGroup = null) {
    try {
      const cacheKey = `equipment_types_${muscleGroup || 'all'}`
      const cached = this.getCached(cacheKey)
      if (cached) return cached

      let q = this.supabase.from('exercises').select('equipment').eq('is_active', true)
      if (muscleGroup) q = q.eq('primair_spieren', muscleGroup)

      const { data, error } = await q
      if (error) throw error
      const unique = [...new Set(data.map(ex => ex.equipment).filter(Boolean))].sort()
      this.setCache(cacheKey, unique)
      return unique
    } catch (error) {
      console.error('❌ ExerciseService.getEquipmentTypes failed:', error)
      return []
    }
  }

  async getExerciseStats() {
    try {
      const cacheKey = 'exercise_stats'
      const cached = this.getCached(cacheKey)
      if (cached) return cached

      const { data, error } = await this.supabase.from('exercises')
        .select('primair_spieren, home_friendly, equipment').eq('is_active', true)
      if (error) throw error

      const stats = {
        total: data.length,
        homeExercises: data.filter(ex => ex.home_friendly).length,
        gymExercises: data.filter(ex => ex.gym_friendly).length,
        byMuscleGroup: {},
        byEquipment: {}
      }
      data.forEach(ex => {
        stats.byMuscleGroup[ex.primair_spieren] = (stats.byMuscleGroup[ex.primair_spieren] || 0) + 1
        stats.byEquipment[ex.equipment] = (stats.byEquipment[ex.equipment] || 0) + 1
      })
      this.setCache(cacheKey, stats)
      return stats
    } catch (error) {
      console.error('❌ ExerciseService.getExerciseStats failed:', error)
      return { total: 0, homeExercises: 0, gymExercises: 0, byMuscleGroup: {}, byEquipment: {} }
    }
  }

  async addExercise(exerciseData) {
    try {
      const { data, error } = await this.supabase.from('exercises').insert(exerciseData).select().single()
      if (error) throw error
      this.clearCache()
      return data
    } catch (error) {
      console.error('❌ ExerciseService.addExercise failed:', error)
      throw error
    }
  }

  async updateExercise(exerciseId, updates) {
    try {
      const { data, error } = await this.supabase.from('exercises').update(updates).eq('id', exerciseId).select().single()
      if (error) throw error
      this.clearCache()
      return data
    } catch (error) {
      console.error('❌ ExerciseService.updateExercise failed:', error)
      throw error
    }
  }

  async updateExerciseImage(exerciseName, imageUrl) {
    try {
      const { data, error } = await this.supabase.from('exercises')
        .update({ image_url: imageUrl }).eq('name', exerciseName).select().single()
      if (error) throw error
      this.clearCache(`exercise_details_${exerciseName}`)
      return data
    } catch (error) {
      console.error('❌ ExerciseService.updateExerciseImage failed:', error)
      throw error
    }
  }

  // Set / clear the video (and optional thumbnail) on an exercise. Accepts
  // either an exerciseId or exerciseName so it works from both flows: the
  // DayBuilder rows (which have the id) and any other UI that only knows
  // the name. Pass empty strings or null to clear.
  //
  // Resolves the target row in two steps so we get a clean error instead
  // of PostgREST's "Cannot coerce the result to a single JSON object"
  // when the name doesn't match anything in the library:
  //   1. exact match on id OR name
  //   2. fallback to case-insensitive ilike on the trimmed name
  //   3. clear error if still no row
  async updateExerciseVideo({ exerciseId, exerciseName, videoUrl, thumbnailUrl, source }) {
    try {
      const patch = {}
      if (videoUrl !== undefined)     patch.video_url = videoUrl || null
      if (thumbnailUrl !== undefined) patch.thumbnail_url = thumbnailUrl || null
      if (Object.keys(patch).length === 0) return null

      // Als de aanroeper expliciet meegeeft dat dit een custom_exercises-rij
      // is, schrijven we daar direct naartoe en slaan we de lookup in
      // `exercises` over. Voorkomt "exercise not found" voor per-client
      // custom oefeningen die niet in de shared library staan.
      if (source === 'custom_exercises' && exerciseId) {
        const { data, error } = await this.supabase
          .from('custom_exercises').update(patch).eq('id', exerciseId).select().single()
        if (error) throw error
        this.clearCache()
        if (data?.name) this.clearCache(`exercise_video_${data.name}`)
        return data
      }

      // Find target row first — maybeSingle returns null on 0 rows (no throw).
      let targetRow = null
      let targetTable = 'exercises'
      if (exerciseId) {
        const { data } = await this.supabase
          .from('exercises').select('id, name').eq('id', exerciseId).maybeSingle()
        targetRow = data
      }
      if (!targetRow && exerciseName) {
        const trimmed = String(exerciseName).trim()
        // Exact first, then case-insensitive fallback.
        const { data: exact } = await this.supabase
          .from('exercises').select('id, name').eq('name', trimmed).maybeSingle()
        if (exact) targetRow = exact
        else {
          const { data: ci } = await this.supabase
            .from('exercises').select('id, name').ilike('name', trimmed).limit(1)
          if (ci?.length) targetRow = ci[0]
        }
      }
      // Fallback naar custom_exercises als 'ie niet in de shared lib staat.
      if (!targetRow && exerciseName) {
        const trimmed = String(exerciseName).trim()
        const { data: exact } = await this.supabase
          .from('custom_exercises').select('id, name').eq('name', trimmed).maybeSingle()
        if (exact) { targetRow = exact; targetTable = 'custom_exercises' }
        else {
          const { data: ci } = await this.supabase
            .from('custom_exercises').select('id, name').ilike('name', trimmed).limit(1)
          if (ci?.length) { targetRow = ci[0]; targetTable = 'custom_exercises' }
        }
      }
      if (!targetRow) {
        const e = new Error(`Oefening "${exerciseName || exerciseId}" niet gevonden in de exercises-tabel. Eerst toevoegen aan de bibliotheek voordat je 'r een video aan hangt.`)
        e.code = 'EXERCISE_NOT_FOUND'
        throw e
      }

      const { data, error } = await this.supabase
        .from(targetTable).update(patch).eq('id', targetRow.id).select().single()
      if (error) throw error
      this.clearCache()
      if (data?.name) this.clearCache(`exercise_video_${data.name}`)
      return data
    } catch (error) {
      console.error('❌ ExerciseService.updateExerciseVideo failed:', error)
      throw error
    }
  }
}

const ExerciseService = new ExerciseServiceClass()
export default ExerciseService
export { ExerciseServiceClass }
