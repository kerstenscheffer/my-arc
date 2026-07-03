// src/modules/nutrition-intake/services/IntakeFlowService.js
// INTAKE FLOW SERVICE v2.0
//
// Changes from v1.1:
// - buildClientRules: wishes (ontbijt/lunch/diner categories) → preferredMealTypes per slot
// - buildClientRules: wishes.niet_lekker + absoluut_niet → blockedIngredients
// - buildClientRules: cooking_preference → maxDifficulty filter
// - generatePlanFromTemplate: passes clientTrainingDays + trainingTime to buildScaledWeek
// - selectBestTemplate: uses meals_per_day match on client num_meals
//
// Triggers the complete chain after a client submits their nutrition intake:
// 1. Map intake preferences → clients table fields
// 2. Send coach notification: "intake completed"
// 3. Auto-select best template based on calorie range + meals_per_day
// 4. Run Smart Scaling Engine with full client rules
// 5. Save plan as concept (is_active: false)
// 6. Send coach notification: "plan ready for review"

import { getClient as apiGetClient, updateClient as apiUpdateClient } from '../../../lib/publicIntakeApi'

class IntakeFlowService {
  constructor(supabase) {
    this.supabase = supabase
  }

  // Publieke intake (geen sessie) mag de clients-tabel niet direct lezen
  // of schrijven — dat loopt dan via /api/public-intake (service key).
  async hasSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return !!session
    } catch {
      return false
    }
  }

  // ========================================
  // MAIN ENTRY POINT
  // ========================================

  async processIntake(clientId, intakeData) {
    console.log('🚀 === INTAKE FLOW SERVICE v2.0 START ===')
    console.log(`   Client: ${clientId}`)

    const result = {
      success: false,
      clientUpdated: false,
      notificationsSent: 0,
      planGenerated: false,
      planId: null,
      errors: []
    }

    try {
      const authenticated = await this.hasSession()

      // STEP 1: Map intake data to clients table
      console.log('\n📌 STEP 1: Mapping intake data to clients table...')
      const clientUpdate = this.mapIntakeToClientFields(intakeData)

      let updateError = null
      if (authenticated) {
        ({ error: updateError } = await this.supabase
          .from('clients')
          .update(clientUpdate)
          .eq('id', clientId))
      } else {
        try { await apiUpdateClient(clientId, clientUpdate) } catch (e) { updateError = e }
      }

      if (updateError) {
        console.error('❌ Failed to update client:', updateError)
        result.errors.push(`Client update failed: ${updateError.message}`)
      } else {
        result.clientUpdated = true
        console.log('✅ Client fields updated:', Object.keys(clientUpdate).join(', '))
      }

      // STEP 2: Load client data
      console.log('\n📌 STEP 2: Loading client data...')
      let client = null
      let clientError = null
      if (authenticated) {
        ({ data: client, error: clientError } = await this.supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single())
      } else {
        try { client = await apiGetClient(clientId) } catch (e) { clientError = e }
      }

      if (clientError || !client) {
        throw new Error(`Client not found: ${clientError?.message || 'no data'}`)
      }

      const coachId = client.trainer_id || client.coach_id
      if (!coachId) {
        throw new Error('Client has no coach assigned (trainer_id is empty)')
      }

      console.log(`✅ Client: ${client.first_name} ${client.last_name}`)
      console.log(`✅ Coach ID: ${coachId}`)
      console.log(`✅ Targets: ${client.target_calories} kcal, ${client.target_protein}g P`)

      // STEP 3: Send "intake completed" notification
      console.log('\n📌 STEP 3: Sending intake notification to coach...')
      try {
        await this.sendCoachNotification(coachId, clientId, {
          type: 'intake_completed',
          priority: 'normal',
          title: `${client.first_name} heeft de voedingsintake ingevuld`,
          message: this.generateIntakeSummary(intakeData, client),
          action_type: 'review_intake',
          action_data: {
            client_id: clientId,
            guidance_level: intakeData.guidance_level?.guidance_level || null
          }
        })
        result.notificationsSent++
        console.log('✅ Intake notification sent')
      } catch (notifError) {
        console.warn('⚠️ Notification failed (non-blocking):', notifError.message)
        result.errors.push(`Notification failed: ${notifError.message}`)
      }

      // STEP 4: Auto-select template
      console.log('\n📌 STEP 4: Selecting best template...')
      const clientRules = this.buildClientRules(client, intakeData)
      const template = await this.selectBestTemplate(coachId, client, clientRules)

      if (!template) {
        console.warn('⚠️ No suitable template found — skipping auto plan generation')
        result.errors.push('No template found for this calorie range')

        try {
          await this.sendCoachNotification(coachId, clientId, {
            type: 'action_required',
            priority: 'urgent',
            title: `Maak handmatig een plan voor ${client.first_name}`,
            message: `Intake is ingevuld maar er is geen passend template gevonden voor ${client.target_calories} kcal. Maak handmatig een plan aan.`,
            action_type: 'create_plan',
            action_data: { client_id: clientId }
          })
          result.notificationsSent++
        } catch (e) {
          console.warn('⚠️ Fallback notification failed:', e.message)
        }

        result.success = true
        console.log('\n🚀 === INTAKE FLOW COMPLETE (no auto plan) ===\n')
        return result
      }

      console.log(`✅ Selected template: ${template.emoji} ${template.name} (${template.base_macros?.calories} kcal base)`)

      // STEP 5: Generate plan with Smart Scaling
      console.log('\n📌 STEP 5: Generating plan with Smart Scaling...')
      try {
        const planResult = await this.generatePlanFromTemplate(template, client, intakeData, clientRules)
        result.planGenerated = true
        result.planId = planResult.planId
        console.log(`✅ Plan generated and saved: ${planResult.planId}`)
        console.log(`📊 Accuracy: ${planResult.accuracy?.calorieAccuracy}% kcal, ${planResult.accuracy?.proteinAccuracy}% protein`)
      } catch (planError) {
        console.error('❌ Plan generation failed:', planError)
        result.errors.push(`Plan generation failed: ${planError.message}`)
      }

      // STEP 6: Send "plan ready for review" notification
      if (result.planGenerated) {
        console.log('\n📌 STEP 6: Sending plan review notification...')
        try {
          await this.sendCoachNotification(coachId, clientId, {
            type: 'plan_ready',
            priority: 'normal',
            title: `Plan klaar voor review: ${client.first_name}`,
            message: `Een voedingsplan is automatisch gegenereerd op basis van de intake van ${client.first_name}. Review en activeer het plan.`,
            action_type: 'review_plan',
            action_data: { client_id: clientId, plan_id: result.planId }
          })
          result.notificationsSent++
          console.log('✅ Plan review notification sent')
        } catch (notifError) {
          console.warn('⚠️ Review notification failed:', notifError.message)
        }
      }

      result.success = true
      console.log(`\n🚀 === INTAKE FLOW v2.0 COMPLETE ===`)
      console.log(`   ✅ Client updated: ${result.clientUpdated}`)
      console.log(`   📬 Notifications: ${result.notificationsSent}`)
      console.log(`   📋 Plan generated: ${result.planGenerated}`)
      if (result.planId) console.log(`   🆔 Plan ID: ${result.planId}`)
      if (result.errors.length > 0) console.log(`   ⚠️ Warnings: ${result.errors.join(', ')}`)
      console.log('')

      return result

    } catch (error) {
      console.error('❌ INTAKE FLOW FAILED:', error)
      result.errors.push(error.message)
      return result
    }
  }

  // ========================================
  // STEP 1: MAP INTAKE DATA TO CLIENT FIELDS
  // ========================================

  mapIntakeToClientFields(intakeData) {
    const update = {}

    // Meal schedule → meals_per_day
    if (intakeData.meal_schedule?.num_meals) {
      update.meals_per_day = intakeData.meal_schedule.num_meals
    }

    // Protein preferences → loved_foods / hated_foods
    const lovedFoods = []
    const hatedFoods = []

    if (intakeData.protein_preferences?.additions?.length > 0) lovedFoods.push(...intakeData.protein_preferences.additions)
    if (intakeData.carb_preferences?.additions?.length > 0) lovedFoods.push(...intakeData.carb_preferences.additions)
    if (intakeData.fat_preferences?.additions?.length > 0) lovedFoods.push(...intakeData.fat_preferences.additions)

    if (intakeData.protein_preferences?.removals?.length > 0) hatedFoods.push(...intakeData.protein_preferences.removals)
    if (intakeData.carb_preferences?.removals?.length > 0) hatedFoods.push(...intakeData.carb_preferences.removals)
    if (intakeData.fat_preferences?.removals?.length > 0) hatedFoods.push(...intakeData.fat_preferences.removals)

    if (lovedFoods.length > 0) update.loved_foods = lovedFoods.join(', ')
    if (hatedFoods.length > 0) update.hated_foods = hatedFoods.join(', ')

    // Life context → cooking_skill, budget
    if (intakeData.life_context) {
      const lc = intakeData.life_context
      const cookingMap = { 'niet_graag': 'beginner', 'neutraal': 'intermediate', 'graag': 'advanced' }
      if (lc.cooking_preference) update.cooking_skill = cookingMap[lc.cooking_preference] || 'intermediate'
      // weekly_budget is a range string ("60-80") — not saved to numeric clients column
    }

    // Legacy: practical_info mapping (backward compat)
    if (intakeData.practical_info) {
      const practical = intakeData.practical_info
      if (practical.allergies && practical.allergies.trim().length > 0) update.allergies = practical.allergies
      const cookingMap = { 'niet_graag': 'beginner', 'neutraal': 'intermediate', 'graag': 'advanced' }
      if (practical.cooking_preference && !update.cooking_skill) update.cooking_skill = cookingMap[practical.cooking_preference] || 'intermediate'
      if (practical.variety_preference) update.variety_preference = practical.variety_preference
    }

    // Vegetable removals → hated_foods
    if (intakeData.vegetable_preferences?.removals?.length > 0) {
      const currentHated = update.hated_foods || ''
      const vegRemovals = intakeData.vegetable_preferences.removals.join(', ')
      update.hated_foods = currentHated ? `${currentHated}, ${vegRemovals}` : vegRemovals
    }

    // Training data → training_time
    if (intakeData.training) {
      const timeMap = {
        'vroege_ochtend': '06:00', 'late_ochtend': '10:00',
        'vroege_middag': '13:00', 'late_middag': '16:00',
        'vroege_avond': '18:00', 'late_avond': '20:00',
        'ochtend': '08:00', 'middag': '13:00', 'einde_werkdag': '17:00', 'avond': '19:00'
      }
      if (intakeData.training.default_time) {
        update.training_time = timeMap[intakeData.training.default_time] || '18:00'
      }
      if (intakeData.training.training_days?.length > 0) {
        update.workout_days_per_week = intakeData.training.training_days.length
      }
    }

    update.intake_completed = true
    update.intake_completed_at = new Date().toISOString()

    console.log('📋 Mapped fields:', JSON.stringify(update, null, 2))
    return update
  }

  // ========================================
  // STEP 3: SEND COACH NOTIFICATION
  // ========================================

  async sendCoachNotification(coachId, clientId, notification) {
    const { data, error } = await this.supabase
      .from('coach_notifications')
      .insert([{
        coach_id: coachId,
        client_id: clientId,
        type: notification.type || 'info',
        priority: notification.priority || 'normal',
        title: notification.title,
        message: notification.message,
        action_type: notification.action_type || null,
        action_data: notification.action_data || null,
        read_status: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  generateIntakeSummary(intakeData, client) {
    const parts = []

    const levelLabels = { strict: 'Strict coachplan', flexible: 'Flexibel plan', free: 'Vrij met richtlijnen' }
    const level = intakeData.guidance_level?.guidance_level
    if (level) parts.push(levelLabels[level] || level)

    if (intakeData.meal_schedule?.num_meals) {
      parts.push(`${intakeData.meal_schedule.num_meals} maaltijden per dag`)
    }

    const totalRemovals =
      (intakeData.protein_preferences?.removals?.length || 0) +
      (intakeData.carb_preferences?.removals?.length || 0) +
      (intakeData.fat_preferences?.removals?.length || 0)

    if (totalRemovals > 0) {
      parts.push(`${totalRemovals} voedingsmiddelen uitgesloten`)
    }

    if (intakeData.allergens?.selected_allergens?.length > 0) {
      parts.push(`${intakeData.allergens.selected_allergens.length} allergieën`)
    }

    if (intakeData.training?.training_days?.length > 0) {
      const timeLabel = intakeData.training.default_time?.replace('_', ' ') || ''
      parts.push(`Traint ${intakeData.training.training_days.length}x/week${timeLabel ? ' (' + timeLabel + ')' : ''}`)
    }

    if (intakeData.life_context?.cooking_preference === 'niet_graag') {
      parts.push('Kookt liever niet')
    }

    parts.push(`Target: ${client.target_calories} kcal, ${client.target_protein}g eiwit`)

    return parts.filter(Boolean).join(' • ')
  }

  // ========================================
  // STEP 4: AUTO-SELECT BEST TEMPLATE
  // ========================================

  async selectBestTemplate(coachId, client, clientRules = {}) {
    try {
      const { data: templates, error } = await this.supabase
        .from('meal_plan_templates')
        .select('*')
        .eq('coach_id', coachId)
        .or('plan_type.is.null,plan_type.neq.full_week')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!templates || templates.length === 0) {
        console.warn('⚠️ No templates found for coach')
        return null
      }

      console.log(`📋 Found ${templates.length} templates`)

      const targetCalories = client.target_calories || 2500
      const targetMeals = clientRules.mealsPerDay || 4
      const dietPref = clientRules.dietPreference || 'geen'
      const isVegetarian = dietPref === 'vegetarisch' || dietPref === 'veganistisch'

      const scored = templates.map(template => {
        const baseCal = template.base_macros?.calories || 2000
        const scaleFactor = targetCalories / baseCal
        const templateName = (template.name || '').toLowerCase()
        const isVegTemplate = templateName.includes('vegetar') || templateName.includes('vegan') || templateName.includes('🌱')
        const templateMeals = template.meals_per_day || 4

        let score = 100

        // Calorie proximity — meest belangrijke factor
        const scaleDistance = Math.abs(1 - scaleFactor)
        score -= scaleDistance * 80

        // Meals per day match — v2.0: nu echte match op client meals
        if (templateMeals === targetMeals) score += 25
        else if (Math.abs(templateMeals - targetMeals) === 1) score += 10
        else score -= 15

        // Protein base
        const baseProtein = template.base_macros?.protein || 0
        if (baseProtein > 100) score += 10

        // Diet match
        if (isVegetarian && isVegTemplate) score += 50
        else if (isVegetarian && !isVegTemplate) score -= 30
        else if (!isVegetarian && isVegTemplate) score -= 100

        console.log(`   ${template.emoji || ''} ${template.name}: ${baseCal} kcal base, ${templateMeals} meals, scale ${scaleFactor.toFixed(2)}x, score ${Math.round(score)}`)

        return { template, score, scaleFactor }
      })

      scored.sort((a, b) => b.score - a.score)
      const best = scored[0]

      if (best.scaleFactor > 2.0 || best.scaleFactor < 0.5) {
        console.warn(`⚠️ Best template requires ${best.scaleFactor.toFixed(2)}x scaling — too extreme`)
        return null
      }

      return best.template

    } catch (error) {
      console.error('❌ Template selection failed:', error)
      return null
    }
  }

  // ========================================
  // STEP 5: GENERATE PLAN FROM TEMPLATE
  // ========================================

  async generatePlanFromTemplate(template, client, intakeData, existingRules = null) {
    const TemplateLibrary = (await import('../../meal-templates/TemplateLibrary')).default
    const SmartScalingEngine = (await import('../../ai-meal-generator/SmartScalingEngine')).default

    const templateLib = new TemplateLibrary(this.supabase)
    const smartEngine = new SmartScalingEngine(this.supabase)

    const allMealIds = templateLib.extractMealIds(template.week_structure)
    const meals = await templateLib.loadMealsByIds(allMealIds)

    const targetCalories = client.target_calories || 2500
    const baseCal = template.base_macros?.calories || 2000
    const scaleFactor = targetCalories / baseCal

    const clientRules = existingRules || this.buildClientRules(client, intakeData)

    // v2.0: Pass client training days + training time to buildScaledWeek
    // Priority: intake training_days → client.preferred_training_days → default ma/di/wo/vr/za
    const rawTrainingDays =
      (intakeData.training?.training_days?.length > 0 ? intakeData.training.training_days : null) ||
      (client.preferred_training_days?.length > 0 ? client.preferred_training_days : null) ||
      ['ma', 'di', 'wo', 'vr', 'za']
    const clientTrainingDays = this.mapTrainingDaysToIndices(rawTrainingDays)
    // Convert training_time (HH:MM:SS) to preset string if needed
    const rawTrainingTime = intakeData.training?.default_time || client.training_time || null
    const trainingTime = rawTrainingTime ? this.convertTimeToPreset(rawTrainingTime) : null

    console.log(`📅 Client training days (indices): ${clientTrainingDays}`)
    console.log(`⏰ Client training time: ${trainingTime}`)

    const scaledWeek = templateLib.buildScaledWeek(
      template.week_structure,
      meals,
      scaleFactor,
      clientTrainingDays,   // v2.0: client training days override
      trainingTime          // v2.0: client training time for slot timing
    )

    const targets = {
      calories: client.target_calories || 2500,
      protein: client.target_protein || 150,
      carbs: client.target_carbs || 250,
      fat: client.target_fat || 70
    }

    const { weekStructure: optimizedWeek, report } = await smartEngine.optimizeFromTemplate(
      scaledWeek, targets, clientRules
    )

    const { data: savedPlan, error: saveError } = await this.supabase
      .from('client_meal_plans')
      .insert([{
        client_id: client.id,
        template_name: `${template.emoji || ''} ${template.name} (auto)`,
        template_id: template.id,
        week_structure: optimizedWeek,
        daily_calories: targets.calories,
        daily_protein: targets.protein,
        daily_carbs: targets.carbs,
        daily_fat: targets.fat,
        is_active: false,
        ai_generated: true,
        ai_version: 'intake_flow_v2.0',
        stats: {
          smartScaling: {
            replacements: report.replacements.length,
            ingredientAdjustments: report.ingredientScaling.length,
            addedMeals: report.addedMeals.length
          },
          accuracy: report.finalAccuracy
        },
        generation_settings: {
          source: 'intake_flow',
          template_id: template.id,
          template_name: template.name,
          scale_factor: scaleFactor,
          client_rules: clientRules,
          guidance_level: intakeData.guidance_level?.guidance_level || null,
          training_days: clientTrainingDays,
          training_time: trainingTime
        },
        start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (saveError) throw saveError

    console.log(`✅ Plan saved as concept (is_active: false): ${savedPlan.id}`)

    return {
      planId: savedPlan.id,
      scaleFactor,
      accuracy: report.finalAccuracy,
      report
    }
  }

  // ========================================
  // HELPER: MAP DUTCH TRAINING DAYS TO INDICES
  // monday=0 ... sunday=6
  // intake uses: ma, di, wo, do, vr, za, zo
  // ========================================

  mapTrainingDaysToIndices(trainingDays) {
    const dayMap = {
      'ma': 0, 'di': 1, 'wo': 2, 'do': 3, 'vr': 4, 'za': 5, 'zo': 6,
      // English fallback
      'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
      'friday': 4, 'saturday': 5, 'sunday': 6
    }
    return trainingDays
      .map(d => dayMap[d.toLowerCase()])
      .filter(i => i !== undefined)
  }

  // ========================================
  // BUILD CLIENT RULES — v2.0
  // Now includes:
  // - wishes.niet_lekker + absoluut_niet → blockedIngredients
  // - wishes categories → preferredMealTypes per slot
  // - cooking_preference → maxDifficulty
  // - standard_list preferences → preferredIngredients
  // ========================================

  buildClientRules(client, intakeData) {
    const rules = {
      allergies: [],
      blockedIngredients: [],
      blockedCategories: [],
      blockedMealTypes: [],
      preferredIngredients: [],       // ingredient names client likes
      preferredMealTypes: {           // v2.0: per-slot meal type preferences
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
      },
      mealsPerDay: intakeData.meal_schedule?.num_meals || client.meals_per_day || 4,
      varietyPreference: intakeData.practical_info?.variety_preference || 'moderate',
      dietPreference: 'geen',
      guidanceLevel: intakeData.guidance_level?.guidance_level || 'flexible',
      trainingDays: intakeData.training?.training_days?.length > 0
        ? intakeData.training.training_days
        : (client.preferred_training_days?.length > 0
          ? client.preferred_training_days
          : ['ma', 'di', 'wo', 'vr', 'za']), // default: coach bepaalt
      trainingTime: intakeData.training?.default_time || null,
      weeklyBudget: intakeData.life_context?.weekly_budget || null,
      cookingPreference: intakeData.life_context?.cooking_preference || null,
      maxDifficulty: 'medium' // default
    }

    // v2.0: cooking_preference → maxDifficulty
    // niet_graag → only 'etm' (easy to make) meals
    // neutraal → 'etm' + 'medium'
    // graag → all difficulties
    const cookingPref = intakeData.life_context?.cooking_preference
    if (cookingPref === 'niet_graag') rules.maxDifficulty = 'etm'
    else if (cookingPref === 'neutraal') rules.maxDifficulty = 'medium'
    else if (cookingPref === 'graag') rules.maxDifficulty = 'htm'

    // v2.0: wishes.niet_lekker + absoluut_niet → blockedIngredients
    const wishes = intakeData.wishes || {}
    if (wishes.niet_lekker?.length > 0) {
      rules.blockedIngredients.push(...wishes.niet_lekker.map(i => i.toLowerCase()))
    }
    if (wishes.absoluut_niet) {
      const absoluutNiet = wishes.absoluut_niet.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      rules.blockedIngredients.push(...absoluutNiet)
    }

    // v2.0: wishes categories + subcategories → preferredMealTypes per slot
    // Subcategories are more specific and get priority (rijst_kip > diner_rijst)
    const ontbijtTerms = [
      ...this.mapWishCategoriesToLabels(wishes.ontbijt_categories || [], 'breakfast'),
      ...this.mapWishSubsToSearchTerms(wishes.ontbijt_subs || [])
    ]
    if (ontbijtTerms.length > 0) rules.preferredMealTypes.breakfast = [...new Set(ontbijtTerms)]

    const lunchTerms = [
      ...this.mapWishCategoriesToLabels(wishes.lunch_categories || [], 'lunch'),
      ...this.mapWishSubsToSearchTerms(wishes.lunch_subs || [])
    ]
    if (lunchTerms.length > 0) rules.preferredMealTypes.lunch = [...new Set(lunchTerms)]

    const dinerTerms = [
      ...this.mapWishCategoriesToLabels(wishes.diner_categories || [], 'dinner'),
      ...this.mapWishSubsToSearchTerms(wishes.diner_subs || [])
    ]
    if (dinerTerms.length > 0) rules.preferredMealTypes.dinner = [...new Set(dinerTerms)]

    // v2.0: standard_list preferences → preferredIngredients
    // These are the ingredients the client already uses and likes
    const standardLists = [
      ...(intakeData.protein_preferences?.standard_list || []),
      ...(intakeData.carb_preferences?.standard_list || []),
      ...(intakeData.fat_preferences?.standard_list || [])
    ]
    if (standardLists.length > 0) {
      rules.preferredIngredients.push(...standardLists.map(i => i.toLowerCase()))
    }

    // Existing: additions from preferences
    const allAdditions = [
      ...(intakeData.protein_preferences?.additions || []),
      ...(intakeData.carb_preferences?.additions || []),
      ...(intakeData.fat_preferences?.additions || [])
    ]
    rules.preferredIngredients.push(...allAdditions.map(i => i.toLowerCase()))
    rules.preferredIngredients = [...new Set(rules.preferredIngredients)]

    // Allergens from new format
    if (intakeData.allergens) {
      const allergenData = intakeData.allergens
      rules.dietPreference = allergenData.diet_preference || 'geen'

      if (allergenData.diet_preference === 'vegetarisch') {
        rules.blockedCategories.push('varkensvlees', 'rund', 'vis')
        rules.blockedIngredients.push('kip', 'kipfilet', 'kalkoen', 'gehakt', 'shoarma', 'pulled chicken', 'zalm', 'tonijn', 'vis')
      }
      if (allergenData.diet_preference === 'veganistisch') {
        rules.blockedCategories.push('varkensvlees', 'rund', 'vis', 'zuivel', 'ei')
        rules.blockedIngredients.push('kip', 'kipfilet', 'kalkoen', 'gehakt', 'shoarma', 'pulled chicken', 'zalm', 'tonijn', 'vis', 'eieren', 'ei', 'kwark', 'whey', 'kaas', 'melk', 'yoghurt', 'skyr', 'cottage')
      }
      if (allergenData.diet_preference === 'halal') {
        rules.blockedCategories.push('varkensvlees')
        rules.blockedIngredients.push('varken', 'spek', 'bacon', 'ham')
      }
      if (allergenData.diet_preference === 'pescotarisch') {
        rules.blockedCategories.push('varkensvlees', 'rund')
        rules.blockedIngredients.push('kip', 'kipfilet', 'kalkoen', 'gehakt', 'shoarma', 'pulled chicken', 'rund', 'biefstuk', 'varken', 'spek', 'bacon', 'ham')
      }

      const selected = allergenData.selected_allergens || []
      if (selected.includes('lactose')) { rules.blockedCategories.push('zuivel'); rules.blockedIngredients.push('kwark', 'whey', 'yoghurt', 'yogurt', 'skyr', 'kaas', 'melk', 'room', 'boter', 'cottage', 'mozzarella', 'cheddar', 'gouda', 'ricotta') }
      if (selected.includes('gluten')) { rules.blockedCategories.push('gluten'); rules.blockedIngredients.push('brood', 'pasta', 'tarwe', 'couscous', 'crackers', 'wraps', 'havermout', 'pannenkoek') }
      if (selected.includes('noten')) { rules.blockedCategories.push('noten'); rules.blockedIngredients.push('amandel', 'walnoot', 'cashew', 'hazelnoot', 'noten') }
      if (selected.includes('pinda')) { rules.blockedCategories.push('pinda'); rules.blockedIngredients.push('pinda', 'pindakaas') }
      if (selected.includes('soja')) { rules.blockedCategories.push('soja'); rules.blockedIngredients.push('soja', 'tofu', 'tempeh', 'edamame') }
      if (selected.includes('vis')) { rules.blockedCategories.push('vis'); rules.blockedIngredients.push('zalm', 'tonijn', 'kabeljauw', 'vis', 'haring', 'makreel', 'sardine', 'garnaal', 'garnalen') }
      if (selected.includes('schaaldieren')) { rules.blockedCategories.push('schaaldieren'); rules.blockedIngredients.push('garnaal', 'garnalen', 'kreeft', 'krab', 'mosselen') }
      if (selected.includes('ei')) { rules.blockedCategories.push('ei'); rules.blockedIngredients.push('eieren', 'ei', 'omelet', 'scrambled') }
      if (selected.includes('steenvruchten')) rules.blockedIngredients.push('perzik', 'nectarine', 'pruim', 'kers', 'abrikoos', 'mango')

      if (allergenData.custom_allergens) {
        const custom = allergenData.custom_allergens.split(',').map(s => s.trim()).filter(Boolean)
        rules.allergies.push(...custom)
        rules.blockedIngredients.push(...custom)
      }
    }

    // Legacy: practical_info + client profile
    if (intakeData.practical_info?.allergies) {
      rules.allergies.push(...intakeData.practical_info.allergies.split(',').map(s => s.trim()).filter(Boolean))
    }
    if (client.allergies) {
      const clientAllergies = Array.isArray(client.allergies) ? client.allergies : client.allergies.split(',').map(s => s.trim())
      rules.allergies.push(...clientAllergies.filter(Boolean))
    }
    rules.allergies = [...new Set(rules.allergies)]

    // Blocked from removals
    const allRemovals = [
      ...(intakeData.protein_preferences?.removals || []),
      ...(intakeData.carb_preferences?.removals || []),
      ...(intakeData.fat_preferences?.removals || []),
      ...(intakeData.vegetable_preferences?.removals || [])
    ]
    rules.blockedIngredients.push(...allRemovals.map(i => i.toLowerCase()))

    // Legacy dietary_type
    if (!intakeData.allergens) {
      if (client.dietary_type === 'vegetarian' || client.dietary_type === 'vegetarisch') rules.blockedCategories.push('varkensvlees', 'rund', 'vis')
      if (client.dietary_type === 'vegan' || client.dietary_type === 'veganistisch') rules.blockedCategories.push('varkensvlees', 'rund', 'vis', 'zuivel')
    }

    // Legacy intolerances
    if (!intakeData.allergens && client.intolerances) {
      const intolerances = Array.isArray(client.intolerances) ? client.intolerances : client.intolerances.split(',').map(s => s.trim())
      intolerances.forEach(intolerance => {
        const lower = intolerance.toLowerCase()
        if (lower.includes('lactose') || lower.includes('zuivel')) rules.blockedCategories.push('zuivel')
        if (lower.includes('gluten')) rules.blockedCategories.push('gluten')
        if (lower.includes('noten') || lower.includes('noot')) rules.blockedCategories.push('noten')
      })
    }

    // Hated foods from client profile
    if (client.hated_foods) {
      const hated = Array.isArray(client.hated_foods) ? client.hated_foods : client.hated_foods.split(',').map(s => s.trim())
      rules.blockedIngredients.push(...hated.filter(Boolean).map(i => i.toLowerCase()))
    }

    // Deduplicate
    rules.blockedIngredients = [...new Set(rules.blockedIngredients)]
    rules.blockedCategories = [...new Set(rules.blockedCategories)]

    console.log('📋 Client rules v2.0:')
    console.log(`   🚫 Blocked ingredients: ${rules.blockedIngredients.length}`)
    console.log(`   🚫 Blocked categories: ${rules.blockedCategories.join(', ')}`)
    console.log(`   ❤️ Preferred ingredients: ${rules.preferredIngredients.length}`)
    console.log(`   🍳 Preferred breakfast types: ${rules.preferredMealTypes.breakfast.join(', ')}`)
    console.log(`   🥗 Preferred lunch types: ${rules.preferredMealTypes.lunch.join(', ')}`)
    console.log(`   🍽️ Preferred dinner types: ${rules.preferredMealTypes.dinner.join(', ')}`)
    console.log(`   👨‍🍳 Max difficulty: ${rules.maxDifficulty}`)
    console.log(`   📅 Training days: ${rules.trainingDays.join(', ')}`)
    console.log(`   ⏰ Training time: ${rules.trainingTime}`)

    return rules
  }

  // ========================================
  // HELPER: MAP WISH CATEGORIES TO MEAL LABELS
  // Maps intake wish categories to ai_meals labels
  // ========================================

  // Convert HH:MM or HH:MM:SS time string to timing preset
  convertTimeToPreset(time) {
    if (!time) return null
    // Already a preset string
    if (['vroege_ochtend','late_ochtend','vroege_middag','late_middag','vroege_avond','late_avond'].includes(time)) return time
    // Parse hour from time string
    const hour = parseInt(time.split(':')[0])
    if (isNaN(hour)) return null
    if (hour < 8)  return 'vroege_ochtend'
    if (hour < 12) return 'late_ochtend'
    if (hour < 15) return 'vroege_middag'
    if (hour < 17) return 'late_middag'
    if (hour < 19) return 'vroege_avond'
    return 'late_avond'
  }

  mapWishCategoriesToLabels(categories, slot) {
    // Maps intake category AND subcategory codes to meal name search terms
    // These are used by SmartScalingEngine to find meals matching what the client already eats
    const categoryMap = {
      // ── ONTBIJT CATEGORIES ──
      'havermout':      ['havermout', 'oatmeal', 'overnight oats'],
      'brood':          ['brood', 'toast', 'sandwich'],
      'fruit':          ['fruit', 'smoothie'],
      'eieren':         ['eieren', 'eggs', 'scrambled', 'omelet'],
      'ontbijt_anders': [],

      // ── ONTBIJT SUBCATEGORIES ──
      'havermout_fruit':  ['havermout', 'fruit'],
      'havermout_noten':  ['havermout', 'noten'],
      'kwark_fruit':      ['kwark', 'fruit'],
      'griekse_yoghurt':  ['griekse yoghurt', 'yoghurt'],
      'skyr':             ['skyr'],
      'smoothie_bowl':    ['smoothie'],
      'brood_kaas':       ['brood', 'kaas'],
      'brood_vleeswaren': ['brood', 'vlees'],
      'brood_pindakaas':  ['brood', 'pindakaas'],
      'brood_choco':      ['brood'],
      'brood_ei':         ['brood', 'ei'],
      'toast_avocado':    ['avocado', 'toast'],
      'eieren_gebakken':  ['eieren', 'gebakken'],
      'eieren_scrambled': ['scrambled', 'eieren'],
      'omelet':           ['omelet'],
      'eieren_gekookt':   ['eieren'],
      'roerei_toast':     ['roerei', 'toast'],
      'fruit_vers':       ['fruit'],
      'smoothie':         ['smoothie'],
      'fruit_yoghurt':    ['yoghurt', 'fruit'],
      'muesli':           ['muesli', 'granola'],

      // ── LUNCH CATEGORIES ──
      'lunch_brood':   ['brood', 'wrap', 'sandwich'],
      'lunch_salade':  ['salade', 'salad'],
      'lunch_snacks':  ['snack'],
      'lunch_warm':    ['rijst', 'pasta', 'wok', 'noodles'],

      // ── LUNCH SUBCATEGORIES ──
      'lunch_brood_kaas':    ['brood', 'kaas'],
      'lunch_brood_vlees':   ['brood', 'vlees'],
      'lunch_wrap_kip':      ['wrap', 'kip'],
      'lunch_wrap_groenten': ['wrap', 'groenten'],
      'lunch_tosti':         ['tosti', 'brood'],
      'lunch_shoarma':       ['shoarma'],
      'salade_kip':          ['salade', 'kip'],
      'salade_tonijn':       ['salade', 'tonijn'],
      'salade_ei':           ['salade', 'ei'],
      'soep':                ['soep'],
      'soep_brood':          ['soep', 'brood'],
      'lunch_rijst':         ['rijst'],
      'lunch_pasta':         ['pasta'],
      'lunch_wok':           ['wok'],
      'lunch_noodles':       ['noodles'],
      'snack_noten':         ['noten'],
      'snack_fruit':         ['fruit'],
      'snack_reep':          ['reep', 'bar'],
      'snack_yoghurt':       ['yoghurt'],
      'snack_cracker':       ['cracker'],

      // ── DINER CATEGORIES ──
      'diner_rijst':       ['rijst'],
      'diner_pasta':       ['pasta', 'noodles'],
      'diner_aardappelen': ['aardappel', 'krieltjes'],
      'diner_soep':        ['soep'],
      'diner_salade':      ['salade'],
      'diner_besteld':     [],

      // ── DINER SUBCATEGORIES ──
      'rijst_kip':      ['rijst', 'kip'],
      'rijst_rund':     ['rijst', 'rund', 'gehakt'],
      'rijst_zalm':     ['rijst', 'zalm'],
      'rijst_groenten': ['rijst', 'groenten'],
      'nasi':           ['nasi', 'rijst'],
      'pasta_bolognese':['pasta', 'gehakt', 'bolognese'],
      'pasta_carbonara':['carbonara', 'pasta'],
      'pasta_kip':      ['pasta', 'kip'],
      'pasta_zalm':     ['pasta', 'zalm'],
      'bami':           ['bami', 'noodles'],
      'noodles':        ['noodles'],
      'aard_kip':       ['aardappel', 'kip'],
      'aard_vlees':     ['aardappel', 'vlees', 'gehakt'],
      'aard_vis':       ['aardappel', 'vis'],
      'stamppot':       ['stamppot'],
      'friet':          ['friet'],
      'soep_kip':       ['soep', 'kip'],
      'soep_groente':   ['soep', 'groente'],
      'soep_tomaat':    ['tomaat', 'soep'],
      'salade_diner':   ['salade']
    }

    const searchTerms = []
    categories.forEach(cat => {
      const mapped = categoryMap[cat]
      if (mapped) searchTerms.push(...mapped)
    })
    return [...new Set(searchTerms)]
  }

  // Also map subcategories (subs) — called separately for more specific matching
  mapWishSubsToSearchTerms(subs) {
    const subMap = {
      'rijst_kip':      ['rijst', 'kip'],
      'rijst_rund':     ['rijst', 'rund'],
      'rijst_zalm':     ['rijst', 'zalm'],
      'pasta_kip':      ['pasta', 'kip'],
      'pasta_carbonara':['carbonara'],
      'pasta_bolognese':['bolognese', 'gehakt'],
      'soep_kip':       ['soep', 'kip'],
      'soep_groente':   ['soep', 'groente'],
      'soep_tomaat':    ['tomaat', 'soep'],
      'aard_kip':       ['aardappel', 'kip'],
      'lunch_wrap_kip': ['wrap', 'kip'],
      'salade_kip':     ['salade', 'kip'],
      'havermout_fruit':['havermout', 'fruit'],
      'kwark_fruit':    ['kwark', 'fruit'],
      'eieren_scrambled':['scrambled', 'eieren'],
      'omelet':         ['omelet'],
      'brood_kaas':     ['brood', 'kaas'],
    }
    const terms = []
    subs.forEach(sub => {
      const mapped = subMap[sub]
      if (mapped) terms.push(...mapped)
    })
    return [...new Set(terms)]
  }
}

export default IntakeFlowService

console.log('✅ IntakeFlowService v2.0 loaded - Full client rules: wishes, cooking, training timing')
