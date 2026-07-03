// src/modules/meal-templates/TemplateLibrary.js
// TEMPLATE MANAGEMENT SERVICE v3.0
//
// NEW IN v3.0:
// - ✅ buildScaledWeek accepts clientTrainingDays + trainingTime params
// - ✅ Training days from CLIENT intake instead of template defaults
// - ✅ Pre-workout slot timing calculated from client's trainingTime
// - ✅ Carb timing: trainingsdag = meer carbs (setA), rustdag = meer vet (setB)
// - ✅ Slot function labels based on training timing philosophy:
//     vroege_ochtend: ontbijt = POST-WORKOUT, snack1 = PRE-WORKOUT SNACK (volgende dag),
//                     voor bed = CASEÏNE
//     middag (14:00): lunch = PRE-WORKOUT, snack1 = PRE-WORKOUT SNACK,
//                     diner = POST-WORKOUT HERSTEL
//     avond (18:00+): lunch = normaal, diner = PRE-WORKOUT, snack na training = POST-WORKOUT
//
// EXISTING FEATURES (v2.1):
// - ✅ Smart Scaling Engine integration
// - ✅ Manual timing control per meal slot
// - ✅ Timing/function/icon metadata flows through entire system
// - ✅ Backwards compatible with old templates
// - ✅ 2x variatie per week (Set A / Set B)
// - ✅ Training day indicator (is_training_day)

class TemplateLibrary {
  constructor(supabase) {
    this.supabase = supabase
  }

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  async getTemplates(coachId) {
    try {
      const { data, error } = await this.supabase
        .from('meal_plan_templates')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (error) throw error
      // full_week-plannen worden apart opgeslagen vanuit de Plan Analyzer en horen
      // niet in deze setA/setB-gebaseerde template-tab. Filter ze eruit.
      const templates = (data || []).filter(t => t.plan_type !== 'full_week')
      console.log(`✅ Loaded ${templates.length} templates for coach ${coachId}`)
      return templates
    } catch (error) {
      console.error('❌ Error loading templates:', error)
      return []
    }
  }

  async getTemplateById(templateId) {
    try {
      const { data, error } = await this.supabase
        .from('meal_plan_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Error loading template:', error)
      return null
    }
  }

  async createTemplate(templateData, coachId) {
    try {
      if (!templateData.name || !templateData.weekStructure) {
        throw new Error('Template must have name and weekStructure')
      }
      if (!templateData.weekStructure.setA || !templateData.weekStructure.setB) {
        throw new Error('Template must have weekStructure with setA and setB')
      }

      const mealIds = this.extractMealIds(templateData.weekStructure)
      const meals = await this.loadMealsByIds(mealIds)
      const calculatedMacros = this.calculateActualMacros(templateData.weekStructure, meals)

      console.log('📊 Calculated base macros from meals:', calculatedMacros)

      const { data, error } = await this.supabase
        .from('meal_plan_templates')
        .insert([{
          coach_id: coachId,
          name: templateData.name,
          emoji: templateData.emoji || '🍽️',
          description: templateData.description || '',
          base_macros: calculatedMacros,
          meals_per_day: templateData.meals_per_day || 4,
          week_structure: templateData.weekStructure,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      console.log('✅ Template created:', data.name)
      return data
    } catch (error) {
      console.error('❌ Error creating template:', error)
      throw error
    }
  }

  async updateTemplate(templateId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('meal_plan_templates')
        .update({
          name: updates.name,
          emoji: updates.emoji,
          description: updates.description,
          base_macros: updates.baseMacros,
          meals_per_day: updates.mealsPerDay,
          week_structure: updates.weekStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Template updated:', data.name)
      return data
    } catch (error) {
      console.error('❌ Error updating template:', error)
      throw error
    }
  }

  async deleteTemplate(templateId) {
    try {
      console.log('🗑️ Deleting client plans using this template...')
      const { error: clientPlansError } = await this.supabase
        .from('client_meal_plans')
        .delete()
        .eq('template_id', templateId)

      if (clientPlansError) {
        console.warn('⚠️ Error deleting client plans:', clientPlansError)
      }

      const { error } = await this.supabase
        .from('meal_plan_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      console.log('✅ Template deleted successfully')
      return true
    } catch (error) {
      console.error('❌ Error deleting template:', error)
      throw error
    }
  }

  // ==========================================
  // TEMPLATE APPLICATION & SCALING
  // ==========================================

  async applyTemplateToClient(templateId, clientId, userMacros) {
    try {
      console.log('🎯 Applying template to client...')

      const template = await this.getTemplateById(templateId)
      if (!template) throw new Error('Template not found')

      console.log(`📋 Template: ${template.name}`)
      console.log(`🎯 Target macros: ${userMacros.calories} kcal, ${userMacros.protein}g protein`)

      const { data: clientData } = await this.supabase
        .from('clients')
        .select('allergies, hated_foods, loved_foods, dietary_type, cooking_skill, intolerances, workout_schedule, training_time, preferred_training_days, assigned_schema_id')
        .eq('id', clientId)
        .single()

      let validSchemaDagKeys = null
      if (clientData?.assigned_schema_id) {
        const { data: schema } = await this.supabase
          .from('workout_schemas')
          .select('week_structure')
          .eq('id', clientData.assigned_schema_id)
          .single()
        const ws = schema?.week_structure
        if (ws && typeof ws === 'object') validSchemaDagKeys = new Set(Object.keys(ws))
      }

      const clientTrainingDays = this.resolveClientTrainingDays(clientData, validSchemaDagKeys)
      const trainingTime = clientData?.training_time || null
      console.log(`🗓️ Client training days (indices): ${JSON.stringify(clientTrainingDays)}`)
      console.log(`⏰ Client training time: ${trainingTime || 'unknown'}`)

      const allMealIds = this.extractMealIds(template.week_structure)
      const meals = await this.loadMealsByIds(allMealIds)

      console.log(`🍽️ Loaded ${Object.keys(meals).length} unique meals`)

      const templateTotal = template.base_macros.calories
      const scaleFactor = userMacros.calories / templateTotal

      console.log(`⚖️ Scale factor: ${scaleFactor.toFixed(3)} (${userMacros.calories} / ${templateTotal})`)

      const scaledWeekStructure = this.buildScaledWeek(
        template.week_structure,
        meals,
        scaleFactor,
        clientTrainingDays,
        trainingTime
      )

      let finalWeekStructure = scaledWeekStructure
      let smartReport = null

      try {
        const SmartScalingEngine = (await import('../ai-meal-generator/SmartScalingEngine')).default
        const smartEngine = new SmartScalingEngine(this.supabase)

        const targets = {
          calories: userMacros.calories,
          protein: userMacros.protein,
          carbs: userMacros.carbs || 200,
          fat: userMacros.fat || 70
        }

        const clientRules = {
          allergies: this.parseStringToArray(clientData?.allergies),
          blockedIngredients: this.parseStringToArray(clientData?.hated_foods),
          blockedCategories: this.buildBlockedCategories(clientData?.dietary_type, clientData?.intolerances),
          blockedMealTypes: [],
          preferredIngredients: this.parseStringToArray(clientData?.loved_foods),
          mealsPerDay: template.meals_per_day || 4
        }

        console.log('🧠 Running Smart Scaling Engine...')
        const { weekStructure: optimizedStructure, report } = await smartEngine.optimizeFromTemplate(
          scaledWeekStructure, targets, clientRules
        )

        finalWeekStructure = optimizedStructure
        smartReport = report

        console.log(`🧠 Smart Scaling complete: ${report.replacements.length} replacements, ${report.addedMeals.length} added`)

      } catch (smartError) {
        console.warn('⚠️ Smart Scaling Engine failed (falling back to uniform scaling):', smartError.message)
        finalWeekStructure = scaledWeekStructure
      }

      const savedPlan = await this.saveToClientMealPlans(
        clientId,
        template,
        finalWeekStructure,
        userMacros
      )

      console.log('✅ Template applied successfully with smart scaling!')

      return {
        success: true,
        planId: savedPlan.id,
        templateName: template.name,
        scaleFactor: scaleFactor,
        smartScaling: smartReport ? {
          replacements: smartReport.replacements.length,
          ingredientAdjustments: smartReport.ingredientScaling.length,
          addedMeals: smartReport.addedMeals.length,
          calorieAccuracy: smartReport.finalAccuracy.calorieAccuracy,
          proteinAccuracy: smartReport.finalAccuracy.proteinAccuracy
        } : null
      }

    } catch (error) {
      console.error('❌ Error applying template:', error)
      throw error
    }
  }

  // ==========================================
  // CLIENT TRAINING DAYS RESOLUTION
  // Single source of truth: clients.workout_schedule (EN day keys).
  // Falls back to preferred_training_days (NL abbreviations) when schedule is missing.
  // Returns array of indices [0..6] (Monday=0) or empty array.
  // ==========================================
  resolveClientTrainingDays(clientData, validSchemaDagKeys = null) {
    if (!clientData) return []
    const EN_DAY_INDEX = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 }
    const NL_DAY_INDEX = { ma: 0, di: 1, wo: 2, do: 3, vr: 4, za: 5, zo: 6 }

    const schedule = clientData.workout_schedule
    if (schedule && typeof schedule === 'object') {
      const idx = Object.entries(schedule)
        .filter(([, dagKey]) => !validSchemaDagKeys || validSchemaDagKeys.has(dagKey))
        .map(([day]) => EN_DAY_INDEX[day])
        .filter(v => v !== undefined)
        .sort((a, b) => a - b)
      if (idx.length > 0) return idx
    }

    const preferred = clientData.preferred_training_days
    if (Array.isArray(preferred) && preferred.length > 0) {
      const idx = preferred
        .map(d => NL_DAY_INDEX[String(d).toLowerCase()])
        .filter(v => v !== undefined)
        .sort((a, b) => a - b)
      if (idx.length > 0) return idx
    }

    return []
  }

  // ==========================================
  // CORE: BUILD SCALED WEEK — v3.1
  // Training days come from the client (workout_schedule). Template's
  // training_days is ignored — it lives at the wrong level.
  // ==========================================

  /**
   * Build a scaled week structure from a template.
   *
   * @param {object} templateStructure - Template with setA + setB
   * @param {object} mealMap - Map of meal_id → meal object
   * @param {number} scaleFactor - Calorie scale factor
   * @param {number[]} clientTrainingDays - Day indices 0=mon..6=sun from client.workout_schedule
   * @param {string} trainingTime - Optional: 'vroege_ochtend' | 'late_ochtend' | 'vroege_middag' |
   *                                          'late_middag' | 'vroege_avond' | 'late_avond'
   */
  buildScaledWeek(templateStructure, mealMap, scaleFactor, clientTrainingDays = null, trainingTime = null) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const weekStructure = {}

    let trainingDays = clientTrainingDays
    if (!Array.isArray(trainingDays) || trainingDays.length === 0) {
      console.warn('⚠️ No client training days provided — every day will use the rest-day set (setB). Fill in clients.workout_schedule to fix.')
      trainingDays = []
    }

    console.log(`📅 Using training days (indices): ${JSON.stringify(trainingDays)}`)
    console.log(`⏰ Training time: ${trainingTime || 'not specified'}`)

    // v3.0: Build timing config based on client's training time
    const timingConfig = this.buildTimingConfig(trainingTime)
    console.log('⏱️ Timing config:', JSON.stringify(timingConfig))

    days.forEach((day, index) => {
      const isTrainingDay = trainingDays.includes(index)

      // setA = training day (higher carbs), setB = rest day (higher fat, lower carbs)
      const set = isTrainingDay ? templateStructure.setA : templateStructure.setB

      if (!set) {
        console.warn(`⚠️ No set found for ${day} (isTrainingDay: ${isTrainingDay})`)
        weekStructure[day] = { totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, is_training_day: isTrainingDay }
        return
      }

      const dayPlan = {}

      Object.keys(set).forEach(slot => {
        const slotData = set[slot]
        const mealId = slotData?.meal_id || slotData
        const meal = mealMap[mealId]

        if (meal) {
          // v3.0: Determine timing + function based on training time philosophy
          const slotTiming = this.resolveSlotTiming(slot, isTrainingDay, timingConfig, slotData)

          dayPlan[slot] = {
            ...meal,
            calories: Math.round(parseFloat(meal.calories) * scaleFactor),
            protein: Math.round(parseFloat(meal.protein) * scaleFactor),
            carbs: meal.carbs ? Math.round(parseFloat(meal.carbs) * scaleFactor) : 0,
            fat: meal.fat ? Math.round(parseFloat(meal.fat) * scaleFactor) : 0,
            timing: slotTiming.timing,
            function: slotTiming.function,
            icon: slotTiming.icon,
            scale_factor: scaleFactor,
            original_calories: meal.calories,
            original_protein: meal.protein
          }
        }
      })

      // Calculate day totals
      const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      Object.values(dayPlan).forEach(meal => {
        if (meal && meal.calories) {
          totals.kcal += meal.calories || 0
          totals.protein += meal.protein || 0
          totals.carbs += meal.carbs || 0
          totals.fat += meal.fat || 0
        }
      })

      dayPlan.totals = totals
      dayPlan.is_training_day = isTrainingDay

      console.log(`📅 ${day}: is_training_day=${isTrainingDay}, ${Math.round(totals.kcal)} kcal`)

      weekStructure[day] = dayPlan
    })

    console.log('✅ Week structure built with client training days + timing')
    return weekStructure
  }

  // ==========================================
  // v3.0: BUILD TIMING CONFIG FROM TRAINING TIME
  // Encodes Kersten's meal timing philosophy:
  // - Vroege ochtend training: ontbijt = post-workout, snack3/voor_bed = caseïne
  // - Middag training: lunch = pre-workout, snack1 = pre-workout snack, diner = post-workout
  // - Avond training: diner = pre-workout, snack na diner = post-workout
  // ==========================================

  buildTimingConfig(trainingTime) {
    // Default: middag training (14:00) — meest gebruikelijk
    const configs = {

      'vroege_ochtend': {
        // Traint ~06:00 — opstaan, trainen, dan ontbijten
        trainingHour: 6,
        slots: {
          breakfast: { timing: '07:30', function: 'POST-WORKOUT HERSTEL', icon: '💪' },
          snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
          lunch:     { timing: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
          snack2:    { timing: '16:00', function: 'TUSSENDOOR', icon: '⚡' },
          dinner:    { timing: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
          snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        },
        restSlots: {
          breakfast: { timing: '08:00', function: 'ONTBIJT', icon: '🌅' },
          snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
          lunch:     { timing: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
          snack2:    { timing: '16:00', function: 'TUSSENDOOR', icon: '⚡' },
          dinner:    { timing: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
          snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        }
      },

      'late_ochtend': {
        // Traint ~10:00
        trainingHour: 10,
        slots: {
          breakfast: { timing: '07:30', function: 'METABOLISME KICKSTART', icon: '🌅' },
          snack1:    { timing: '09:00', function: 'PRE-WORKOUT SNACK', icon: '⚡' },
          lunch:     { timing: '12:00', function: 'POST-WORKOUT HERSTEL', icon: '💪' },
          snack2:    { timing: '15:30', function: 'TUSSENDOOR', icon: '🥤' },
          dinner:    { timing: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
          snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        },
        restSlots: {
          breakfast: { timing: '08:00', function: 'ONTBIJT', icon: '🌅' },
          snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
          lunch:     { timing: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
          snack2:    { timing: '16:00', function: 'TUSSENDOOR', icon: '⚡' },
          dinner:    { timing: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
          snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        }
      },

      'vroege_middag': {
        // Traint ~13:00
        trainingHour: 13,
        slots: {
          breakfast: { timing: '08:00', function: 'METABOLISME KICKSTART', icon: '🌅' },
          snack1:    { timing: '11:00', function: 'PRE-WORKOUT FUEL', icon: '🏋️' },
          lunch:     { timing: '12:00', function: 'PRE-WORKOUT SNACK', icon: '⚡' },
          snack2:    { timing: '15:00', function: 'POST-WORKOUT HERSTEL', icon: '💪' },
          dinner:    { timing: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
          snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        },
        restSlots: {
          breakfast: { timing: '08:00', function: 'ONTBIJT', icon: '🌅' },
          snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
          lunch:     { timing: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
          snack2:    { timing: '16:00', function: 'TUSSENDOOR', icon: '⚡' },
          dinner:    { timing: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
          snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        }
      },

      'late_middag': {
        // Traint ~16:00 — klassiek: lunch = pre-workout, snack1 = pre-workout snack, diner = post-workout
        trainingHour: 16,
        slots: {
          breakfast: { timing: '08:00', function: 'METABOLISME KICKSTART', icon: '🌅' },
          snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
          lunch:     { timing: '13:00', function: 'PRE-WORKOUT FUEL', icon: '🏋️' },
          snack2:    { timing: '15:00', function: 'PRE-WORKOUT SNACK', icon: '⚡' },
          dinner:    { timing: '18:30', function: 'POST-WORKOUT HERSTEL', icon: '💪' },
          snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        },
        restSlots: {
          breakfast: { timing: '08:00', function: 'ONTBIJT', icon: '🌅' },
          snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
          lunch:     { timing: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
          snack2:    { timing: '16:00', function: 'TUSSENDOOR', icon: '⚡' },
          dinner:    { timing: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
          snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        }
      },

      'vroege_avond': {
        // Traint ~18:00
        trainingHour: 18,
        slots: {
          breakfast: { timing: '08:00', function: 'METABOLISME KICKSTART', icon: '🌅' },
          snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
          lunch:     { timing: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
          snack2:    { timing: '16:00', function: 'PRE-WORKOUT FUEL', icon: '🏋️' },
          dinner:    { timing: '20:30', function: 'POST-WORKOUT HERSTEL', icon: '💪' },
          snack3:    { timing: '22:00', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        },
        restSlots: {
          breakfast: { timing: '08:00', function: 'ONTBIJT', icon: '🌅' },
          snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
          lunch:     { timing: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
          snack2:    { timing: '16:00', function: 'TUSSENDOOR', icon: '⚡' },
          dinner:    { timing: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
          snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        }
      },

      'late_avond': {
        // Traint ~20:00
        trainingHour: 20,
        slots: {
          breakfast: { timing: '08:00', function: 'METABOLISME KICKSTART', icon: '🌅' },
          snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
          lunch:     { timing: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
          snack2:    { timing: '17:30', function: 'PRE-WORKOUT FUEL', icon: '🏋️' },
          dinner:    { timing: '19:00', function: 'PRE-WORKOUT SNACK', icon: '⚡' },
          snack3:    { timing: '22:30', function: 'POST-WORKOUT + CASEÏNE', icon: '💪' }
        },
        restSlots: {
          breakfast: { timing: '08:00', function: 'ONTBIJT', icon: '🌅' },
          snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
          lunch:     { timing: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
          snack2:    { timing: '16:00', function: 'TUSSENDOOR', icon: '⚡' },
          dinner:    { timing: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
          snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' }
        }
      }
    }

    // Default: late_middag (14:00 training) if no match
    return configs[trainingTime] || configs['late_middag']
  }

  // ==========================================
  // v3.0: RESOLVE SLOT TIMING
  // Picks the correct timing/function/icon for a slot
  // Priority: template manual timing > client training time config > default
  // ==========================================

  resolveSlotTiming(slot, isTrainingDay, timingConfig, slotData) {
    // If template has manual timing set, respect it (coach override)
    if (slotData?.timing && slotData?.function) {
      return {
        timing: slotData.timing,
        function: slotData.function,
        icon: slotData.icon || this.getDefaultTiming(slot).icon
      }
    }

    // Use client training time config
    const configSlots = isTrainingDay ? timingConfig.slots : timingConfig.restSlots
    if (configSlots?.[slot]) {
      return configSlots[slot]
    }

    // Final fallback: generic defaults
    return this.getDefaultTiming(slot)
  }

  // ==========================================
  // HELPERS
  // ==========================================

  parseStringToArray(value) {
    if (!value) return []
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim()).filter(Boolean)
    }
    return []
  }

  buildBlockedCategories(dietaryType, intolerances) {
    const blocked = []

    if (dietaryType === 'vegetarian' || dietaryType === 'vegetarisch') {
      blocked.push('varkensvlees', 'rund', 'vis')
    }
    if (dietaryType === 'vegan' || dietaryType === 'veganistisch') {
      blocked.push('varkensvlees', 'rund', 'vis', 'zuivel')
    }
    if (dietaryType === 'pescatarian' || dietaryType === 'pescatarisch') {
      blocked.push('varkensvlees', 'rund')
    }

    const intoleranceList = this.parseStringToArray(intolerances)
    intoleranceList.forEach(intolerance => {
      const lower = intolerance.toLowerCase()
      if (lower.includes('lactose') || lower.includes('zuivel')) blocked.push('zuivel')
      if (lower.includes('gluten')) blocked.push('gluten')
      if (lower.includes('noten') || lower.includes('noot')) blocked.push('noten')
      if (lower.includes('soja')) blocked.push('soja')
    })

    return [...new Set(blocked)]
  }

  extractMealIds(weekStructure) {
    const mealIds = new Set()

    Object.values(weekStructure).forEach(set => {
      if (typeof set !== 'object' || set === null) return
      Object.values(set).forEach(slotData => {
        if (slotData && typeof slotData === 'object' && slotData.meal_id) {
          mealIds.add(slotData.meal_id)
        } else if (slotData && typeof slotData === 'string') {
          mealIds.add(slotData)
        }
      })
    })

    return Array.from(mealIds)
  }

  calculateActualMacros(weekStructure, mealMap) {
    const calculateSet = (set) => {
      let calories = 0, protein = 0, carbs = 0, fat = 0

      Object.values(set).forEach(slotData => {
        const mealId = slotData?.meal_id || slotData
        const meal = mealMap[mealId]

        if (meal) {
          calories += parseFloat(meal.calories) || 0
          protein += parseFloat(meal.protein) || 0
          carbs += parseFloat(meal.carbs) || 0
          fat += parseFloat(meal.fat) || 0
        }
      })

      return { calories, protein, carbs, fat }
    }

    const setA = calculateSet(weekStructure.setA)
    const setB = calculateSet(weekStructure.setB)

    return {
      calories: Math.round((setA.calories + setB.calories) / 2),
      protein: Math.round((setA.protein + setB.protein) / 2),
      carbs: Math.round((setA.carbs + setB.carbs) / 2),
      fat: Math.round((setA.fat + setB.fat) / 2)
    }
  }

  async loadMealsByIds(mealIds) {
    try {
      const { data, error } = await this.supabase
        .from('ai_meals')
        .select('*')
        .in('id', mealIds)

      if (error) throw error

      const mealMap = {}
      data.forEach(meal => {
        mealMap[meal.id] = meal
      })

      return mealMap
    } catch (error) {
      console.error('❌ Error loading meals:', error)
      return {}
    }
  }

  async saveToClientMealPlans(clientId, template, weekStructure, userMacros) {
    try {
      await this.supabase
        .from('client_meal_plans')
        .update({ is_active: false })
        .eq('client_id', clientId)
        .eq('is_active', true)

      const { data, error } = await this.supabase
        .from('client_meal_plans')
        .insert([{
          client_id: clientId,
          template_name: `${template.emoji || ''} ${template.name}`,
          template_id: template.id,
          week_structure: weekStructure,
          daily_calories: userMacros.calories,
          daily_protein: userMacros.protein,
          daily_carbs: userMacros.carbs || 0,
          daily_fat: userMacros.fat || 0,
          is_active: true,
          ai_generated: false,
          start_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      console.log('✅ Saved to client_meal_plans with timing metadata')
      return data
    } catch (error) {
      console.error('❌ Error saving to client_meal_plans:', error)
      throw error
    }
  }

  getDefaultTiming(slot) {
    const defaults = {
      breakfast: { timing: '08:00', function: 'METABOLISME KICKSTART', icon: '🌅' },
      lunch:     { timing: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
      dinner:    { timing: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
      snack1:    { timing: '10:30', function: 'EIWIT TOP-UP', icon: '🥤' },
      snack2:    { timing: '16:00', function: 'TUSSENDOOR', icon: '⚡' },
      snack3:    { timing: '21:30', function: 'VOOR BED — CASEÏNE', icon: '🌙' },
      snack4:    { timing: '21:00', function: 'AVOND SNACK', icon: '🍪' }
    }
    return defaults[slot] || { timing: '12:00', function: 'MAALTIJD', icon: '🍽️' }
  }

  getStarterTemplate() {
    return {
      name: "💪 Mass Builder (20:00 Training)",
      emoji: "💪",
      description: "High-protein bulk plan voor training om 20:00 (2800 kcal)",
      baseMacros: {
        calories: 2800,
        protein: 200,
        carbs: 320,
        fat: 80
      },
      mealsPerDay: 4,
      weekStructure: {
        setA: {
          breakfast: {
            meal_id: "ed8b4d96-e41b-406c-81d2-4c58b6dc1bf9",
            timing: "08:00",
            function: "METABOLISME KICKSTART",
            icon: "🌅"
          },
          lunch: {
            meal_id: "38948ee9-293d-48e7-84e9-56fd2a853071",
            timing: "17:00",
            function: "PRE-WORKOUT FUEL",
            icon: "🏋️"
          },
          dinner: {
            meal_id: "7c82c10d-f25d-4730-8fb3-c94266bc64ba",
            timing: "22:00",
            function: "POST-WORKOUT RECOVERY",
            icon: "💪"
          },
          snack1: {
            meal_id: "793747ed-36f4-4524-8154-f0ab600bec55",
            timing: "19:00",
            function: "PRE-WORKOUT BOOST",
            icon: "⚡"
          }
        },
        setB: {
          breakfast: {
            meal_id: "898aa67c-9598-45ee-aaa1-e3bdbfb58d94",
            timing: "08:00",
            function: "METABOLISME KICKSTART",
            icon: "🌅"
          },
          lunch: {
            meal_id: "4c89c062-7de7-4f16-9a09-08955ed6820d",
            timing: "13:00",
            function: "MIDDAG MAALTIJD",
            icon: "🍽️"
          },
          dinner: {
            meal_id: "49c8f10c-7e13-470e-a9d3-2aa3e4c6f1a0",
            timing: "19:00",
            function: "AVONDMAALTIJD",
            icon: "🌙"
          },
          snack1: {
            meal_id: "8b4dfc58-aa57-4e18-b337-e0a53aac535c",
            timing: "16:00",
            function: "TUSSENDOOR",
            icon: "🥤"
          }
        }
      }
    }
  }
}

export default TemplateLibrary

console.log('✅ TemplateLibrary v3.0 loaded - Client training days + timing philosophy integrated')
