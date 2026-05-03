// src/modules/ai-meal-generator/SmartScalingEngine.js
// SMART SCALING ENGINE v2.0
//
// NEW IN v2.0:
// ✅ maxDifficulty filter: niet_graag → only 'etm' meals, neutraal → etm+medium, graag → all
// ✅ preferredMealTypes per slot: breakfast/lunch/dinner/snack labels from wishes categories
// ✅ preferredIngredients scoring: standard_list ingredients get +20 score bonus
// ✅ preferredIngredients in replacement finder: preferred meals score higher
//
// FIXES FROM v1.2 (preserved):
// ✅ Per-dag isolatie - elke dag wordt onafhankelijk gebalanceerd
// ✅ Schone eiwitbron check - eiwit moet PRIMAIR macro zijn
// ✅ Auto snack toevoegen - als na balancing >20g eiwit tekort
// ✅ Max 2x cap - geen enkel ingrediënt mag meer dan 2x originele hoeveelheid
//
// SUPPORTS TWO INPUT FORMATS:
// 1. Template format: { monday: { breakfast: {meal}, snack1: {meal}, totals: {} } }
// 2. AI Generator format: [{ meals: [{ slot, meal, isSnack }], totals: {} }]

class SmartScalingEngine {
  constructor(supabase) {
    this.supabase = supabase
    this.ingredientCache = new Map()
    this.mealCache = new Map()
    this.allMeals = []
    this.allIngredients = []
    this.initialized = false
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  async initialize() {
    if (this.initialized) return

    console.log('🧠 === SMART SCALING ENGINE v2.0 INITIALIZING ===')

    const { data: ingredients, error: ingError } = await this.supabase
      .from('ai_ingredients')
      .select('*')

    if (ingError) throw new Error(`Failed to load ingredients: ${ingError.message}`)

    this.allIngredients = ingredients || []
    ingredients.forEach(ing => this.ingredientCache.set(ing.id, ing))
    console.log(`✅ Loaded ${this.allIngredients.length} ingredients with macro profiles`)

    const { data: meals, error: mealError } = await this.supabase
      .from('ai_meals')
      .select('*')

    if (mealError) throw new Error(`Failed to load meals: ${mealError.message}`)

    this.allMeals = meals || []
    meals.forEach(meal => this.mealCache.set(meal.id, meal))
    console.log(`✅ Loaded ${this.allMeals.length} meals`)
    console.log('🧠 === ENGINE READY ===\n')

    this.initialized = true
  }

  // ========================================
  // FORMAT CONVERTERS
  // ========================================

  templateToEngineFormat(weekStructure) {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return dayOrder.map(dayName => {
      const dayData = weekStructure[dayName]
      if (!dayData) return { breakfast: null, lunch: null, dinner: null, snacks: [], totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 } }
      const day = {
        breakfast: dayData.breakfast || null,
        lunch: dayData.lunch || null,
        dinner: dayData.dinner || null,
        snacks: [],
        totals: dayData.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 },
        is_training_day: dayData.is_training_day || false
      }
      if (dayData.snack1) day.snacks.push(dayData.snack1)
      if (dayData.snack2) day.snacks.push(dayData.snack2)
      if (dayData.snack3) day.snacks.push(dayData.snack3)
      return day
    })
  }

  engineToTemplateFormat(weekPlanArray, originalWeekStructure) {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const result = {}

    // Helper: normaliseer een meal object voor opslag in week_structure
    // Zorgt dat meal_id, meal_name, name en image_url altijd aanwezig zijn
    const normalizeMeal = (meal, origSlot) => {
      if (!meal) return null
      return {
        ...meal,
        meal_id:   meal.meal_id   || meal.id   || origSlot?.meal_id   || null,
        meal_name: meal.meal_name || meal.name  || origSlot?.meal_name || null,
        name:      meal.name      || meal.meal_name || origSlot?.name  || null,
        image_url: meal.image_url || origSlot?.image_url || null,
        timing:    meal.timing    || origSlot?.timing    || null,
        function:  meal.function  || origSlot?.function  || null,
        icon:      meal.icon      || origSlot?.icon      || null,
      }
    }

    weekPlanArray.forEach((day, index) => {
      const dayName = dayOrder[index]
      const orig = originalWeekStructure?.[dayName] || {}
      const dayData = {}

      if (day.breakfast) dayData.breakfast = normalizeMeal(day.breakfast, orig.breakfast)
      if (day.lunch)     dayData.lunch     = normalizeMeal(day.lunch,     orig.lunch)
      if (day.dinner)    dayData.dinner    = normalizeMeal(day.dinner,    orig.dinner)

      if (day.snacks) {
        day.snacks.forEach((snack, i) => {
          if (snack) {
            const sk = `snack${i + 1}`
            dayData[sk] = normalizeMeal(snack, orig[sk])
          }
        })
      }

      dayData.totals = day.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      dayData.is_training_day = day.is_training_day || orig.is_training_day || false
      result[dayName] = dayData
    })
    return result
  }

  aiGeneratorToEngineFormat(weekPlan) {
    return weekPlan.map(day => {
      if (day.breakfast !== undefined || day.lunch !== undefined || day.dinner !== undefined) {
        return { breakfast: day.breakfast || null, lunch: day.lunch || null, dinner: day.dinner || null, snacks: day.snacks || [], totals: day.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 } }
      }
      const converted = { breakfast: null, lunch: null, dinner: null, snacks: [], totals: day.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 } }
      if (day.meals && Array.isArray(day.meals)) {
        day.meals.forEach(({ slot, meal, isSnack }) => {
          if (!meal) return
          if (isSnack || slot.startsWith('snack')) converted.snacks.push(meal)
          else if (slot === 'breakfast') converted.breakfast = meal
          else if (slot === 'lunch') converted.lunch = meal
          else if (slot === 'dinner') converted.dinner = meal
        })
      }
      return converted
    })
  }

  // ========================================
  // ENTRY POINTS
  // ========================================

  async optimizeFromTemplate(weekStructure, targets, clientRules = {}) {
    await this.initialize()
    console.log('🧠 === SMART SCALING (TEMPLATE MODE) ===')
    const engineFormat = this.templateToEngineFormat(weekStructure)
    const { weekPlan: optimized, report } = await this.optimizePlan(engineFormat, targets, clientRules)
    const optimizedStructure = this.engineToTemplateFormat(optimized, weekStructure)
    return { weekStructure: optimizedStructure, report }
  }

  async optimizeFromAIGenerator(weekPlan, targets, clientRules = {}) {
    await this.initialize()
    console.log('🧠 === SMART SCALING (AI GENERATOR MODE) ===')
    const engineFormat = this.aiGeneratorToEngineFormat(weekPlan)
    const { weekPlan: optimized, report } = await this.optimizePlan(engineFormat, targets, clientRules)
    return { weekPlan: optimized, report }
  }

  // ========================================
  // MAIN PIPELINE
  // ========================================

  async optimizePlan(weekPlan, targets, clientRules = {}) {
    console.log(`🎯 Targets: ${targets.calories} kcal, ${targets.protein}g P, ${targets.carbs}g C, ${targets.fat}g F`)
    console.log(`📋 Rules: ${clientRules.blockedCategories?.length || 0} blocked categories, ${clientRules.allergies?.length || 0} allergies`)
    console.log(`👨‍🍳 Max difficulty: ${clientRules.maxDifficulty || 'medium'}`)
    console.log(`❤️ Preferred ingredients: ${clientRules.preferredIngredients?.length || 0}`)

    const report = { replacements: [], ingredientScaling: [], addedMeals: [], macroAdjustments: [], finalAccuracy: {} }

    const isolatedPlan = this.deepCloneWeekPlan(weekPlan)

    console.log('\n📌 STEP 1: Checking preference violations...')
    const cleanedPlan = await this.replaceViolatingMeals(isolatedPlan, clientRules, targets, report)

    console.log('\n📌 STEP 1.5: Aligning meals with client eating habits...')
    const alignedPlan = await this.alignWithClientHabits(cleanedPlan, clientRules, targets, report)
    console.log('\n📌 STEP 2: Filling empty slots...')
    const filledPlan = await this.fillEmptySlots(alignedPlan, clientRules, targets, report)

    console.log('\n📌 STEP 3: Smart macro balancing...')
    const balancedPlan = await this.balanceMacros(filledPlan, targets, clientRules, report)

    console.log('\n📌 STEP 4: Final validation...')
    report.finalAccuracy = this.validatePlan(balancedPlan, targets)

    console.log('\n🧠 === SMART SCALING COMPLETE ===')
    console.log(`📊 Final: ${report.finalAccuracy.calorieAccuracy}% kcal, ${report.finalAccuracy.proteinAccuracy}% protein`)
    console.log(`🔄 ${report.replacements.length} replacements, ➕ ${report.addedMeals.length} added, ⚖️ ${report.ingredientScaling.length} ingredient adjustments\n`)

    return { weekPlan: balancedPlan, report }
  }

  deepCloneWeekPlan(weekPlan) {
    return weekPlan.map(day => ({
      breakfast: this.deepCloneMeal(day.breakfast),
      lunch: this.deepCloneMeal(day.lunch),
      dinner: this.deepCloneMeal(day.dinner),
      snacks: (day.snacks || []).map(s => this.deepCloneMeal(s)),
      totals: { ...(day.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 }) },
      is_training_day: day.is_training_day || false
    }))
  }

  deepCloneMeal(meal) {
    if (!meal) return null
    const cloned = { ...meal }
    if (meal.ingredients_list) {
      if (Array.isArray(meal.ingredients_list)) {
        cloned.ingredients_list = meal.ingredients_list.map(ing => ({ ...ing }))
      } else if (typeof meal.ingredients_list === 'object') {
        cloned.ingredients_list = JSON.parse(JSON.stringify(meal.ingredients_list))
      }
    }
    return cloned
  }

  // ========================================
  // v2.0: DIFFICULTY FILTER
  // Check if meal difficulty is within client's cooking preference
  // ========================================

  mealDifficultyAllowed(meal, clientRules) {
    const maxDifficulty = clientRules.maxDifficulty || 'medium'
    const mealDifficulty = meal.difficulty || 'etm'

    // Difficulty order: etm < medium < htm
    const difficultyOrder = { 'etm': 0, 'medium': 1, 'htm': 2 }
    const mealLevel = difficultyOrder[mealDifficulty] ?? 1
    const maxLevel = difficultyOrder[maxDifficulty] ?? 1

    return mealLevel <= maxLevel
  }

  // ========================================
  // v2.0: PREFERRED MEAL TYPE SCORE
  // Check if meal matches client's preferred categories for a slot
  // ========================================

  getPreferredTypeScore(meal, slotType, clientRules) {
    const preferredMealTypes = clientRules.preferredMealTypes || {}
    const slotPreferences = preferredMealTypes[slotType] || []

    if (slotPreferences.length === 0) return 0

    const mealName = (meal.name || '').toLowerCase()
    const mealLabels = Array.isArray(meal.labels) ? meal.labels.map(l => l.toLowerCase()) : []

    // Count how many search terms match — more matches = higher score
    // This means rijst_kip (matches 'rijst' AND 'kip') scores higher than just rijst
    let matchCount = 0
    for (const pref of slotPreferences) {
      const p = pref.toLowerCase()
      if (mealName.includes(p) || mealLabels.some(l => l.includes(p))) {
        matchCount++
      }
    }

    if (matchCount === 0) return 0
    if (matchCount === 1) return 15   // Single term match
    if (matchCount === 2) return 35   // Double match (e.g. rijst + kip = rijst_kip)
    return 50                          // Triple+ match — very close to what client eats
  }

  // ========================================
  // v2.0: PREFERRED INGREDIENT SCORE
  // Score bonus if meal contains ingredients from client's standard_list
  // ========================================

  getPreferredIngredientScore(meal, clientRules) {
    const preferred = clientRules.preferredIngredients || []
    if (preferred.length === 0) return 0

    const mealName = (meal.name || '').toLowerCase()

    // Check meal name first (fast)
    const nameMatch = preferred.some(p => mealName.includes(p.toLowerCase()))
    if (nameMatch) return 20

    // Check ingredients
    for (const ing of this.parseMealIngredients(meal)) {
      const ingredient = this.ingredientCache.get(ing.ingredient_id)
      if (ingredient) {
        const ingName = ingredient.name.toLowerCase()
        if (preferred.some(p => ingName.includes(p.toLowerCase()) || p.toLowerCase().includes(ingName))) {
          return 15
        }
      }
    }

    return 0
  }

  // ========================================
  // STEP 1.5: ALIGN WITH CLIENT EATING HABITS
  // Proactively replaces template meals with meals that match
  // what the client already eats (based on wishes subcategories)
  // Only replaces if a significantly better match exists (score threshold)
  // ========================================

  async alignWithClientHabits(weekPlan, clientRules, targets, report) {
    const preferredMealTypes = clientRules.preferredMealTypes || {}
    const hasPreferences = Object.values(preferredMealTypes).some(arr => arr.length > 0)

    if (!hasPreferences) {
      console.log('   ℹ️ No meal preferences found — skipping alignment')
      return weekPlan
    }

    const slotToType = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' }

    console.log('   📋 Client preferences per slot:')
    console.log(`      🍳 Breakfast: ${(preferredMealTypes.breakfast || []).join(', ') || 'none'}`)
    console.log(`      🥗 Lunch: ${(preferredMealTypes.lunch || []).join(', ') || 'none'}`)
    console.log(`      🍽️ Dinner: ${(preferredMealTypes.dinner || []).join(', ') || 'none'}`)

    // v2.1: Track used meal IDs per slot — prevents same meal every day
    const usedMealIds = { breakfast: new Set(), lunch: new Set(), dinner: new Set() }

    for (let di = 0; di < weekPlan.length; di++) {
      const day = weekPlan[di]
      const isTrainingDay = day.is_training_day || false

      for (const [slot, slotType] of Object.entries(slotToType)) {
        const currentMeal = day[slot]
        if (!currentMeal) continue

        const prefs = preferredMealTypes[slotType] || []
        if (prefs.length === 0) continue

        // Score the current meal against preferences
        const currentScore = this.getPreferredTypeScore(currentMeal, slotType, clientRules)

        // v2.1: Raised threshold from 35 to 50
        if (currentScore >= 50) {
          // Even if it matches well, track it and try to vary if already used
          if (usedMealIds[slotType].has(currentMeal.id)) {
            console.log(`   🔁 Day ${di + 1} ${slot}: "${currentMeal.name}" already used — searching for variety...`)
            const varied = this.findWishesAlignedMeal(currentMeal, slot, slotType, clientRules, targets, usedMealIds[slotType], isTrainingDay)
            if (varied && varied.id !== currentMeal.id) {
              console.log(`   🔄 Day ${di + 1} ${slot}: variety → "${varied.name}"`)
              day[slot] = this.deepCloneMeal({ ...varied, timing: currentMeal.timing || null, function: currentMeal.function || null, icon: currentMeal.icon || null })
              usedMealIds[slotType].add(varied.id)
              report.replacements.push({ day: di + 1, slot, original: currentMeal.name, replacement: varied.name, reason: 'Variatie (zelfde maaltijd al gebruikt)' })
            } else {
              console.log(`   ✅ Day ${di + 1} ${slot}: "${currentMeal.name}" score ${currentScore} — keeping (no varied alternative)`)
              usedMealIds[slotType].add(currentMeal.id)
            }
          } else {
            console.log(`   ✅ Day ${di + 1} ${slot}: "${currentMeal.name}" matches preferences well (score: ${currentScore}) — keeping`)
            usedMealIds[slotType].add(currentMeal.id)
          }
          continue
        }

        console.log(`   🔍 Day ${di + 1} ${slot}: "${currentMeal.name}" score ${currentScore} < 50 — searching for better match...`)

        // Find a better matching meal, excluding already-used meals
        const better = this.findWishesAlignedMeal(currentMeal, slot, slotType, clientRules, targets, usedMealIds[slotType], isTrainingDay)

        if (!better) {
          console.log(`      ⚠️ No better match found — keeping "${currentMeal.name}"`)
          usedMealIds[slotType].add(currentMeal.id)
          continue
        }

        const betterScore = this.getPreferredTypeScore(better, slotType, clientRules)
        console.log(`      🎯 Best candidate: "${better.name}" (score: ${betterScore})`)

        if (betterScore > currentScore + 10) {
          console.log(`   🔄 Day ${di + 1} ${slot}: "${currentMeal.name}" (score: ${currentScore}) → "${better.name}" (score: ${betterScore}) — habits match`)
          day[slot] = this.deepCloneMeal({ ...better, timing: currentMeal.timing || null, function: currentMeal.function || null, icon: currentMeal.icon || null })
          usedMealIds[slotType].add(better.id)
          report.replacements.push({ day: di + 1, slot, original: currentMeal.name, replacement: better.name, reason: `Afgestemd op eetgewoontes (score ${currentScore} → ${betterScore})` })
        } else {
          console.log(`      ℹ️ Candidate score ${betterScore} not significantly better than ${currentScore} — keeping "${currentMeal.name}"`)
          usedMealIds[slotType].add(currentMeal.id)
        }
      }
    }

    return weekPlan
  }

  // Returns true if meal name conflicts with the slot type
  mealNameConflictsWithSlot(meal, slotType) {
    const name = (meal.name || '').toLowerCase()
    const slotConflicts = {
      'breakfast': ['snack', 'lunch', 'diner', 'dinner', 'voor bed'],
      'lunch':     ['snack', 'ontbijt', 'breakfast', 'voor bed', 'diner', 'dinner'],
      'dinner':    ['snack', 'ontbijt', 'breakfast', 'lunch', 'voor bed'],
      'snack':     ['ontbijt', 'breakfast', 'diner', 'dinner']
    }
    const conflicts = slotConflicts[slotType] || []
    return conflicts.some(c => {
      const words = name.split(/[\s\-]+/)
      return words.some(w => w === c) || name.startsWith(c + ' ') || name.startsWith(c + '-')
    })
  }

  findWishesAlignedMeal(originalMeal, slot, slotType, clientRules, targets, excludeIds = new Set(), isTrainingDay = false) {
    const targetTiming = slotType
    const prefs = (clientRules.preferredMealTypes || {})[slotType] || []
    if (prefs.length === 0) return null

    // v2.1: Pre-workout lunch filter
    // Op trainingsdagen is lunch de pre-workout maaltijd — moet koolhydraatrijk zijn
    // Salades zijn niet geschikt als pre-workout maaltijd
    const isPreWorkoutSlot = slot === 'lunch' && isTrainingDay
    const preWorkoutBlockedTerms = ['salade', 'salad', 'sla', 'wrap']

    // v2.1: Wider calorie range (50%) = more candidates = better habit matches
    // excludeIds: meals already used this week in this slot — prefer unused meals
    let candidates = this.allMeals.filter(m =>
      m.id !== originalMeal.id &&
      !excludeIds.has(m.id) &&
      !this.checkMealViolation(m, clientRules) &&
      this.mealDifficultyAllowed(m, clientRules) &&
      !this.mealNameConflictsWithSlot(m, slotType) &&
      (!(m.timing?.length > 0) || m.timing.includes(targetTiming)) &&
      this.getPreferredTypeScore(m, slotType, clientRules) > 0 &&
      m.calories >= (originalMeal.calories || 400) * 0.5 &&
      m.calories <= (originalMeal.calories || 400) * 1.5 &&
      // v2.1: Pre-workout filter — geen salades in lunch slot op trainingsdagen
      (!isPreWorkoutSlot || !preWorkoutBlockedTerms.some(t => (m.name || '').toLowerCase().includes(t)))
    )

    // Fallback: if no unused candidates, allow used meals (keep pre-workout filter)
    if (candidates.length === 0) {
      candidates = this.allMeals.filter(m =>
        m.id !== originalMeal.id &&
        !this.checkMealViolation(m, clientRules) &&
        this.mealDifficultyAllowed(m, clientRules) &&
        !this.mealNameConflictsWithSlot(m, slotType) &&
        (!(m.timing?.length > 0) || m.timing.includes(targetTiming)) &&
        this.getPreferredTypeScore(m, slotType, clientRules) > 0 &&
        m.calories >= (originalMeal.calories || 400) * 0.5 &&
        m.calories <= (originalMeal.calories || 400) * 1.5 &&
        (!isPreWorkoutSlot || !preWorkoutBlockedTerms.some(t => (m.name || '').toLowerCase().includes(t)))
      )
    }

    console.log(`      📊 findWishesAlignedMeal: ${candidates.length} candidates found for ${slotType} slot`)
    if (candidates.length > 0) {
      const top3 = candidates
        .map(m => ({ name: m.name, score: this.getPreferredTypeScore(m, slotType, clientRules), cal: m.calories }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
      console.log('      Top candidates: ' + top3.map(m => '"' + m.name + '" (score:' + m.score + ', ' + m.cal + 'kcal)').join(', '))
    }

    if (candidates.length === 0) return null

    const scored = candidates.map(m => ({
      meal: m,
      score: this.getPreferredTypeScore(m, slotType, clientRules) +
             this.getPreferredIngredientScore(m, clientRules) +
             Math.max(0, 20 - Math.abs((m.protein || 0) - (originalMeal.protein || 0)) / (originalMeal.protein || 1) * 20)
    }))

    scored.sort((a, b) => b.score - a.score)

    // v2.1: Selecteer willekeurig uit de top kandidaten met gelijke score
    // Dit voorkomt dat elke dag dezelfde maaltijd wint
    const topScore = scored[0]?.score || 0
    const topCandidates = scored.filter(s => s.score >= topScore - 5)
    const chosen = topCandidates[Math.floor(Math.random() * Math.min(topCandidates.length, 5))]
    return chosen?.meal || null
  }

  // ========================================
  // STEP 1: REPLACE VIOLATING MEALS
  // ========================================

  async replaceViolatingMeals(weekPlan, clientRules, targets, report) {
    for (let di = 0; di < weekPlan.length; di++) {
      const day = weekPlan[di]

      for (const slot of ['breakfast', 'lunch', 'dinner']) {
        const meal = day[slot]
        if (!meal) continue

        // v2.0: Also check difficulty + slot name conflicts
        const violation = this.checkMealViolation(meal, clientRules)
        const difficultyViolation = !this.mealDifficultyAllowed(meal, clientRules)
        const slotConflict = this.mealNameConflictsWithSlot(meal, slot)

        if (violation || difficultyViolation || slotConflict) {
          const reason = violation || (slotConflict ? `naam conflict: "${meal.name}" in ${slot} slot` : `difficulty too high: ${meal.difficulty}`)
          console.log(`   ❌ Day ${di + 1} ${slot}: "${meal.name}" → ${reason}`)
          const replacement = this.findBestReplacement(meal, slot, clientRules, targets)
          if (replacement) {
            day[slot] = this.deepCloneMeal({ ...replacement, timing: meal.timing || null, function: meal.function || null, icon: meal.icon || null })
            report.replacements.push({ day: di + 1, slot, original: meal.name, replacement: replacement.name, reason })
            console.log(`   ✅ → "${replacement.name}"`)
          }
        }
      }

      for (let i = 0; i < day.snacks.length; i++) {
        const snack = day.snacks[i]
        if (!snack) continue

        const violation = this.checkMealViolation(snack, clientRules)
        const difficultyViolation = !this.mealDifficultyAllowed(snack, clientRules)

        if (violation || difficultyViolation) {
          const reason = violation || `difficulty too high: ${snack.difficulty}`
          console.log(`   ❌ Day ${di + 1} snack${i + 1}: "${snack.name}" → ${reason}`)
          const replacement = this.findBestReplacement(snack, 'snack', clientRules, targets)
          if (replacement) {
            day.snacks[i] = this.deepCloneMeal({ ...replacement, timing: snack.timing || null, function: snack.function || null, icon: snack.icon || null })
            report.replacements.push({ day: di + 1, slot: `snack${i + 1}`, original: snack.name, replacement: replacement.name, reason })
            console.log(`   ✅ → "${replacement.name}"`)
          }
        }
      }
    }

    return weekPlan
  }

  checkMealViolation(meal, clientRules) {
    if (!meal || !clientRules) return null
    const name = (meal.name || '').toLowerCase()
    const labels = Array.isArray(meal.labels) ? meal.labels : []
    const allergens = Array.isArray(meal.allergens) ? meal.allergens : []

    if (clientRules.allergies?.length > 0) {
      for (const a of clientRules.allergies) {
        const al = a.toLowerCase()
        if (allergens.some(x => x.toLowerCase().includes(al))) return `allergie: ${a}`
        if (name.includes(al)) return `allergie in naam: ${a}`
        if (this.mealContainsIngredient(meal, al)) return `allergie in ingrediënt: ${a}`
      }
    }
    if (clientRules.blockedCategories?.length > 0) {
      for (const cat of clientRules.blockedCategories) {
        if (this.mealBelongsToCategory(meal, cat.toLowerCase())) return `geblokkeerde categorie: ${cat}`
      }
    }
    if (clientRules.blockedMealTypes?.length > 0) {
      for (const type of clientRules.blockedMealTypes) {
        const t = type.toLowerCase()
        if (name.includes(t) || labels.some(l => l.toLowerCase().includes(t))) return `geblokkeerd type: ${type}`
      }
    }
    if (clientRules.blockedIngredients?.length > 0) {
      // Map blocked ingredient names to allergen categories
      const allergenMap = {
        'vis': ['fish'], 'zalm': ['fish'], 'tonijn': ['fish'], 'garnaal': ['fish'],
        'kabeljauw': ['fish'], 'haring': ['fish'], 'makreel': ['fish'],
        'gluten': ['gluten'], 'lactose': ['lactose', 'dairy'], 'melk': ['dairy'],
        'noten': ['nuts'], 'pinda': ['peanuts'], 'ei': ['eggs'], 'soja': ['soy'],
        'varken': ['pork'], 'alcohol': ['alcohol']
      }

      for (const b of clientRules.blockedIngredients) {
        const bl = b.toLowerCase()

        // Check meal allergens first (catches tonijn via fish allergen)
        const mappedAllergens = allergenMap[bl] || []
        if (mappedAllergens.length > 0) {
          if (allergens.some(a => mappedAllergens.includes(a.toLowerCase()))) {
            return `geblokkeerd ingrediënt (allergen): ${b}`
          }
        }

        // Word boundary name check
        const nameWords = name.split(' ')
        const exactMatch = nameWords.some(w => w.replace(/[^a-z]/g, '') === bl)
        const longMatch = bl.length > 4 && name.includes(bl)
        if (exactMatch || longMatch) return `geblokkeerd ingrediënt in naam: ${b}`

        // Check ingredient list
        if (this.mealContainsIngredient(meal, bl)) return `geblokkeerd ingrediënt: ${b}`
      }
    }
    return null
  }

  mealContainsIngredient(meal, searchTerm) {
    for (const ing of this.parseMealIngredients(meal)) {
      const ingredient = this.ingredientCache.get(ing.ingredient_id)
      if (ingredient) {
        const n = ingredient.name.toLowerCase()
        if (n.includes(searchTerm) || searchTerm.includes(n)) return true
      }
    }
    return false
  }

  mealBelongsToCategory(meal, category) {
    const kw = {
      'zuivel': ['melk', 'milk', 'kaas', 'cheese', 'kwark', 'yoghurt', 'yogurt', 'cottage', 'room', 'cream', 'boter', 'butter', 'whey', 'casein', 'skyr', 'carbonara', 'panna', 'ricotta', 'mozzarella', 'cheddar', 'gouda', 'protein pudding', 'frozen yogurt', 'zuivel'],
      'vis': ['zalm', 'tonijn', 'vis', 'garnaal', 'kabeljauw', 'haring', 'makreel', 'sardine'],
      'varkensvlees': ['varken', 'spek', 'bacon', 'ham'],
      'rund': ['rund', 'biefstuk', 'gehakt'],
      'gluten': ['brood', 'pasta', 'tarwe', 'couscous', 'crackers', 'wraps'],
      'noten': ['noten', 'amandel', 'cashew', 'walnoot', 'hazelnoot', 'pistache', 'pecan', 'macadamia'],
      'soja': ['soja', 'tofu', 'tempeh', 'edamame'],
      'ei': ['ei', 'eieren', 'omelet', 'scrambled', 'egg', 'roerei', 'spiegelei', 'eiwitomelet'],
      'pinda': ['pinda', 'pindakaas', 'peanut'],
      'schaaldieren': ['garnaal', 'garnalen', 'kreeft', 'krab', 'mosselen', 'oester', 'scampi', 'crevette'],
      'steenvruchten': ['perzik', 'nectarine', 'pruim', 'kers', 'abrikoos', 'mango', 'lychee']
    }

    const keywords = kw[category]
    if (!keywords) return false
    const n = (meal.name || '').toLowerCase()
    if (keywords.some(k => n.includes(k))) return true
    for (const ing of this.parseMealIngredients(meal)) {
      const ingredient = this.ingredientCache.get(ing.ingredient_id)
      if (ingredient && keywords.some(k => ingredient.name.toLowerCase().includes(k))) return true
    }
    return false
  }

  // ========================================
  // STEP 2: FILL EMPTY SLOTS
  // ========================================

  async fillEmptySlots(weekPlan, clientRules, targets, report) {
    const mealsPerDay = clientRules.mealsPerDay || 4
    const requiredSnacks = Math.max(0, mealsPerDay - 3)

    for (let di = 0; di < weekPlan.length; di++) {
      const day = weekPlan[di]
      const dayTotals = this.calculateDayTotals(day)
      const remaining = { calories: targets.calories - dayTotals.calories, protein: targets.protein - dayTotals.protein }

      if (remaining.calories <= 50) continue

      for (const slot of ['breakfast', 'lunch', 'dinner']) {
        if (day[slot] || remaining.calories <= 50) continue
        const target = { calories: Math.round(remaining.calories / 2), protein: Math.round(remaining.protein / 2) }
        const best = this.findBestMealForSlot(slot, target, clientRules, remaining)
        if (best) {
          day[slot] = this.deepCloneMeal(best)
          remaining.calories -= best.calories || 0
          remaining.protein -= best.protein || 0
          report.addedMeals.push({ day: di + 1, slot, meal: best.name, calories: best.calories, protein: best.protein, reason: 'Leeg slot gevuld' })
          console.log(`   ➕ Day ${di + 1} ${slot}: "${best.name}" (${best.calories} kcal, ${best.protein}g P)`)
        }
      }

      const currentSnacks = day.snacks.filter(Boolean).length
      for (let i = 0; i < requiredSnacks - currentSnacks; i++) {
        if (remaining.calories <= 50) break
        const slotsLeft = requiredSnacks - currentSnacks - i
        const target = { calories: Math.round(remaining.calories / slotsLeft), protein: Math.round(remaining.protein / slotsLeft) }
        const best = this.findBestMealForSlot('snack', target, clientRules, remaining)
        if (best) {
          day.snacks.push(this.deepCloneMeal(best))
          remaining.calories -= best.calories || 0
          remaining.protein -= best.protein || 0
          report.addedMeals.push({ day: di + 1, slot: `snack${currentSnacks + i + 1}`, meal: best.name, calories: best.calories, protein: best.protein, reason: 'Snack slot gevuld' })
          console.log(`   ➕ Day ${di + 1} snack: "${best.name}" (${best.calories} kcal, ${best.protein}g P)`)
        }
      }
    }

    return weekPlan
  }

  // v2.0: findBestMealForSlot now scores on preferredMealTypes + preferredIngredients + maxDifficulty
  findBestMealForSlot(slotType, targetMacros, clientRules, remainingMacros) {
    const proteinNeeded = remainingMacros.protein > 20
    const targetTiming = { 'breakfast': 'breakfast', 'lunch': 'lunch', 'dinner': 'dinner', 'snack': 'snack' }[slotType] || 'lunch'

    let candidates = this.allMeals.filter(meal => {
      // Timing filter
      const timing = meal.timing || []
      if (timing.length > 0 && !timing.includes(targetTiming)) return false
      // Violation filter
      if (this.checkMealViolation(meal, clientRules)) return false
      // v2.0: Difficulty filter
      if (!this.mealDifficultyAllowed(meal, clientRules)) return false
      // Slot name conflict filter (no "Snack" meals in lunch slot etc.)
      if (this.mealNameConflictsWithSlot(meal, slotType)) return false
      // Calorie range filter
      if (meal.calories < targetMacros.calories * 0.4 || meal.calories > targetMacros.calories * 1.6) return false
      return true
    })

    // Fallback: relax timing filter
    if (candidates.length === 0) {
      candidates = this.allMeals.filter(meal =>
        !this.checkMealViolation(meal, clientRules) &&
        this.mealDifficultyAllowed(meal, clientRules) &&
        meal.calories >= targetMacros.calories * 0.4 &&
        meal.calories <= targetMacros.calories * 1.6
      )
    }

    if (candidates.length === 0) return null

    const scored = candidates.map(meal => {
      let score = 0

      // Calorie proximity
      score += Math.max(0, 30 - (Math.abs(meal.calories - targetMacros.calories) / targetMacros.calories * 30))

      // Protein scoring
      if (proteinNeeded) {
        const proteinRatio = (meal.protein || 0) / (meal.calories || 1) * 100
        score += Math.min(40, proteinRatio * 2)
      } else {
        score += Math.max(0, 20 - (Math.abs((meal.protein || 0) - targetMacros.protein) / (targetMacros.protein || 1) * 20))
      }

      // v2.0: Preferred meal type score (wishes categories)
      score += this.getPreferredTypeScore(meal, slotType, clientRules)

      // v2.0: Preferred ingredient score (standard_list)
      score += this.getPreferredIngredientScore(meal, clientRules)

      // Small randomization for variety
      score += Math.random() * 5

      return { meal, score }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored[0]?.meal || null
  }

  findProteinSnack(proteinNeeded, clientRules) {
    const candidates = this.allMeals.filter(meal => {
      const timing = meal.timing || []
      const isSnackTiming = timing.length === 0 || timing.includes('snack')
      if (!isSnackTiming) return false
      if (this.checkMealViolation(meal, clientRules)) return false
      if (!this.mealDifficultyAllowed(meal, clientRules)) return false
      const p = meal.protein || 0
      const c = meal.carbs || 0
      const f = meal.fat || 0
      if (p < 15) return false
      if (p < c || p < f) return false
      if (meal.calories > 500) return false
      return true
    })

    if (candidates.length === 0) return null

    const scored = candidates.map(meal => {
      const proteinEfficiency = (meal.protein || 0) / (meal.calories || 1)
      const proteinFit = 1 - Math.abs((meal.protein || 0) - proteinNeeded) / proteinNeeded
      // v2.0: Also score preferred ingredients
      const prefScore = this.getPreferredIngredientScore(meal, clientRules) / 50
      const score = (proteinEfficiency * 50) + (Math.max(0, proteinFit) * 30) + (prefScore * 10) + (Math.random() * 5)
      return { meal, score }
    })

    scored.sort((a, b) => b.score - a.score)
    console.log(`      🔍 Found ${candidates.length} protein snack candidates, best: "${scored[0].meal.name}" (${scored[0].meal.protein}g P, ${scored[0].meal.calories} kcal)`)
    return scored[0]?.meal || null
  }

  // ========================================
  // STEP 3: SMART MACRO BALANCING
  // ========================================

  async balanceMacros(weekPlan, targets, clientRules, report) {
    for (let di = 0; di < weekPlan.length; di++) {
      const day = weekPlan[di]
      const dayTotals = this.calculateDayTotals(day)
      const deficit = {
        protein: targets.protein - dayTotals.protein,
        carbs: targets.carbs - dayTotals.carbs,
        fat: targets.fat - dayTotals.fat,
        calories: targets.calories - dayTotals.calories
      }

      if (Math.abs(deficit.protein) / targets.protein < 0.05 && Math.abs(deficit.calories) / targets.calories < 0.05) {
        console.log(`   Day ${di + 1}: ✅ Within 5% tolerance (${Math.round(dayTotals.protein)}g P, ${Math.round(dayTotals.calories)} kcal)`)
        this.updateDayTotals(day, targets)
        continue
      }

      console.log(`   Day ${di + 1}: ${Math.round(deficit.protein)}g P deficit, ${Math.round(deficit.calories)} kcal deficit`)
      const dayMeals = this.getDayMeals(day)

      if (deficit.protein > 5) {
        this.balanceProtein(day, dayMeals, deficit, targets, report, di)
      }

      const postProteinTotals = this.calculateDayTotals(day)
      const stillProteinShort = targets.protein - postProteinTotals.protein

      if (stillProteinShort > 20) {
        console.log(`      🚨 Still ${Math.round(stillProteinShort)}g protein short → adding protein snack`)
        const proteinSnack = this.findProteinSnack(stillProteinShort, clientRules)
        if (proteinSnack) {
          day.snacks.push(this.deepCloneMeal(proteinSnack))
          report.addedMeals.push({
            day: di + 1, slot: `snack${day.snacks.length}`, meal: proteinSnack.name,
            calories: proteinSnack.calories, protein: proteinSnack.protein,
            reason: `Eiwit tekort: +${Math.round(stillProteinShort)}g nodig`
          })
          console.log(`      ➕ Added protein snack: "${proteinSnack.name}" (${proteinSnack.protein}g P, ${proteinSnack.calories} kcal)`)
        }
      }

      const updatedTotals = this.calculateDayTotals(day)
      const calDeficit = targets.calories - updatedTotals.calories
      if (Math.abs(calDeficit) > 50) {
        this.balanceCalories(day, this.getDayMeals(day), calDeficit, report, di)
      }

      this.updateDayTotals(day, targets)
    }

    return weekPlan
  }

  balanceProtein(day, dayMeals, deficit, targets, report, di) {
    if (deficit.protein <= 0) return
    let needed = deficit.protein
    console.log(`      🥩 Need +${Math.round(needed)}g protein`)

    const sources = []
    for (const { slot, meal } of dayMeals) {
      for (const ing of this.parseMealIngredients(meal)) {
        const ingredient = this.ingredientCache.get(ing.ingredient_id)
        if (!ingredient) continue

        const pPer100 = ingredient.protein_per_100g || 0
        const cPer100 = ingredient.carbs_per_100g || 0
        const fPer100 = ingredient.fat_per_100g || 0
        const calPer100 = ingredient.calories_per_100g || 0

        const isCleanProtein = pPer100 >= 15 && pPer100 > fPer100 && pPer100 > cPer100

        if (isCleanProtein) {
          sources.push({
            slot, meal, ingredient, ingredientData: ing,
            proteinPer100g: pPer100, calsPer100g: calPer100,
            proteinDensity: calPer100 > 0 ? pPer100 / calPer100 : 0,
            currentAmount: ing.amount || 100,
            originalAmount: ing.amount || 100
          })
        }
      }
    }

    sources.sort((a, b) => b.proteinDensity - a.proteinDensity)

    if (sources.length === 0) {
      console.log(`      ⚠️ No clean protein sources found in current meals`)
      return
    }

    for (const s of sources) {
      if (needed <= 2) break

      const maxAllowed = s.originalAmount * 2
      const roomToGrow = maxAllowed - s.currentAmount
      if (roomToGrow <= 0) {
        console.log(`      ⏭️ ${s.ingredient.name}: already at max (${Math.round(s.currentAmount)}g / ${Math.round(maxAllowed)}g max)`)
        continue
      }

      const extraNeeded = (needed / s.proteinPer100g) * 100
      const actualExtra = Math.min(extraNeeded, roomToGrow)
      const pGained = (actualExtra / 100) * s.proteinPer100g
      const cGained = (actualExtra / 100) * s.calsPer100g

      s.ingredientData.amount = Math.round(s.currentAmount + actualExtra)
      s.ingredientData.scaled = true
      s.ingredientData.originalAmount = s.originalAmount
      needed -= pGained

      report.ingredientScaling.push({
        day: di + 1, slot: s.slot, meal: s.meal.name, ingredient: s.ingredient.name,
        originalAmount: Math.round(s.originalAmount), newAmount: Math.round(s.currentAmount + actualExtra),
        proteinGained: Math.round(pGained), calsAdded: Math.round(cGained)
      })

      console.log(`      ⚖️ ${s.ingredient.name}: ${Math.round(s.currentAmount)}g → ${Math.round(s.currentAmount + actualExtra)}g (+${Math.round(pGained)}g P) [max: ${Math.round(maxAllowed)}g]`)
    }

    if (needed > 5) {
      console.log(`      ⚠️ Still ${Math.round(needed)}g protein short after ingredient scaling`)
    }
  }

  balanceCalories(day, dayMeals, calDeficit, report, di) {
    if (Math.abs(calDeficit) < 50) return
    const isDeficit = calDeficit > 0
    console.log(`      🔥 Need ${isDeficit ? '+' : ''}${Math.round(calDeficit)} kcal`)

    const adjustable = []
    for (const { slot, meal } of dayMeals) {
      for (const ing of this.parseMealIngredients(meal)) {
        const ingredient = this.ingredientCache.get(ing.ingredient_id)
        if (!ingredient) continue

        const c = ingredient.carbs_per_100g || 0
        const f = ingredient.fat_per_100g || 0
        const p = ingredient.protein_per_100g || 0
        const cal = ingredient.calories_per_100g || 0

        if (p > 20 && ing.scaled) continue

        if (c >= 15 || f >= 10) {
          adjustable.push({
            slot, meal, ingredient, ingredientData: ing,
            calsPer100g: cal, currentAmount: ing.amount || 100,
            originalAmount: ing.originalAmount || ing.amount || 100,
            priority: c >= 20 ? 2 : 1
          })
        }
      }
    }

    adjustable.sort((a, b) => b.priority - a.priority)
    let remaining = Math.abs(calDeficit)

    for (const s of adjustable) {
      if (remaining < 20) break

      const maxAllowed = s.originalAmount * 2
      const minAllowed = s.originalAmount * 0.5

      let newAmount
      if (isDeficit) {
        const extra = Math.min((remaining / s.calsPer100g) * 100, maxAllowed - s.currentAmount)
        if (extra <= 0) continue
        newAmount = s.currentAmount + extra
      } else {
        const reduction = Math.min((remaining / s.calsPer100g) * 100, s.currentAmount - minAllowed)
        if (reduction <= 0) continue
        newAmount = s.currentAmount - reduction
      }

      const calsChanged = ((newAmount - s.currentAmount) / 100) * s.calsPer100g
      s.ingredientData.amount = Math.round(newAmount)
      remaining -= Math.abs(calsChanged)

      report.macroAdjustments.push({
        day: di + 1, slot: s.slot, ingredient: s.ingredient.name,
        originalAmount: Math.round(s.originalAmount), newAmount: Math.round(newAmount),
        calsChanged: Math.round(calsChanged)
      })

      console.log(`      ⚖️ ${s.ingredient.name}: ${Math.round(s.currentAmount)}g → ${Math.round(newAmount)}g (${Math.round(calsChanged)} kcal)`)
    }
  }

  // ========================================
  // REPLACEMENT FINDER — v2.0
  // Now scores on: macro fit + preferred types + preferred ingredients + difficulty + cost/difficulty match
  // ========================================

  findBestReplacement(originalMeal, slotType, clientRules, targets) {
    const targetTiming = {
      'breakfast': 'breakfast', 'lunch': 'lunch', 'dinner': 'dinner',
      'snack': 'snack', 'snack1': 'snack', 'snack2': 'snack', 'snack3': 'snack'
    }[slotType] || 'lunch'

    let candidates = this.allMeals.filter(m =>
      m.id !== originalMeal.id &&
      !this.checkMealViolation(m, clientRules) &&
      this.mealDifficultyAllowed(m, clientRules) &&
      !this.mealNameConflictsWithSlot(m, slotType) &&
      (!(m.timing?.length > 0) || m.timing.includes(targetTiming))
    )

    // Fallback: relax timing but keep slot name filter
    if (candidates.length === 0) {
      candidates = this.allMeals.filter(m =>
        m.id !== originalMeal.id &&
        !this.checkMealViolation(m, clientRules) &&
        this.mealDifficultyAllowed(m, clientRules) &&
        !this.mealNameConflictsWithSlot(m, slotType)
      )
    }

    if (candidates.length === 0) return null

    const scored = candidates.map(m => {
      let score = 0

      // Macro proximity
      score += Math.max(0, 30 - (Math.abs((m.calories || 0) - (originalMeal.calories || 0)) / (originalMeal.calories || 1) * 30))
      score += Math.max(0, 30 - (Math.abs((m.protein || 0) - (originalMeal.protein || 0)) / (originalMeal.protein || 1) * 30))

      // v2.0: Preferred meal type score
      score += this.getPreferredTypeScore(m, slotType, clientRules)

      // v2.0: Preferred ingredient score
      score += this.getPreferredIngredientScore(m, clientRules)

      // Cost and difficulty match bonuses
      if (originalMeal.cost_tier === m.cost_tier) score += 5
      if (originalMeal.difficulty === m.difficulty) score += 5

      return { meal: m, score }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored[0]?.meal || null
  }

  // ========================================
  // HELPERS
  // ========================================

  parseMealIngredients(meal) {
    if (!meal) return []
    let list = meal.ingredients_list || meal.ingredients
    if (!list) return []
    if (typeof list === 'string') { try { list = JSON.parse(list) } catch { return [] } }
    if (Array.isArray(list)) return list.filter(i => i && i.ingredient_id)
    if (typeof list === 'object') return Object.entries(list).map(([k, v]) => ({ ingredient_id: k, amount: typeof v === 'number' ? v : (v?.amount || 100), unit: 'gram' }))
    return []
  }

  getDayMeals(day) {
    const meals = []
    if (day.breakfast) meals.push({ slot: 'breakfast', meal: day.breakfast })
    if (day.lunch) meals.push({ slot: 'lunch', meal: day.lunch })
    if (day.dinner) meals.push({ slot: 'dinner', meal: day.dinner })
    if (day.snacks) day.snacks.forEach((s, i) => { if (s) meals.push({ slot: `snack${i + 1}`, meal: s }) })
    return meals
  }

  calculateDayTotals(day) {
    let calories = 0, protein = 0, carbs = 0, fat = 0
    for (const { meal } of this.getDayMeals(day)) {
      const ings = this.parseMealIngredients(meal)
      if (ings.length > 0) {
        for (const ing of ings) {
          const i = this.ingredientCache.get(ing.ingredient_id)
          if (i) {
            const f = (ing.amount || 100) / 100
            calories += (i.calories_per_100g || 0) * f
            protein += (i.protein_per_100g || 0) * f
            carbs += (i.carbs_per_100g || 0) * f
            fat += (i.fat_per_100g || 0) * f
          }
        }
      } else {
        calories += meal.calories || 0
        protein += meal.protein || 0
        carbs += meal.carbs || 0
        fat += meal.fat || 0
      }
    }
    return { calories, protein, carbs, fat }
  }

  updateDayTotals(day, targets) {
    const t = this.calculateDayTotals(day)
    day.totals = { kcal: Math.round(t.calories), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat) }
    const pAcc = Math.round((t.protein / targets.protein) * 100)
    const cAcc = Math.round((t.calories / targets.calories) * 100)
    day.accuracy = { total: Math.round((pAcc + cAcc) / 2), calories: cAcc, protein: pAcc }
  }

  validatePlan(weekPlan, targets) {
    let tC = 0, tP = 0, tCa = 0, tF = 0
    weekPlan.forEach(day => { const t = this.calculateDayTotals(day); tC += t.calories; tP += t.protein; tCa += t.carbs; tF += t.fat })
    const aC = Math.round(tC / 7), aP = Math.round(tP / 7), aCa = Math.round(tCa / 7), aF = Math.round(tF / 7)
    return {
      averages: { calories: aC, protein: aP, carbs: aCa, fat: aF },
      calorieAccuracy: Math.round((aC / targets.calories) * 100),
      proteinAccuracy: Math.round((aP / targets.protein) * 100),
      carbsAccuracy: Math.round((aCa / targets.carbs) * 100),
      fatAccuracy: Math.round((aF / targets.fat) * 100),
      withinTolerance: {
        calories: Math.abs(aC - targets.calories) / targets.calories < 0.05,
        protein: Math.abs(aP - targets.protein) / targets.protein < 0.05,
        carbs: Math.abs(aCa - targets.carbs) / targets.carbs < 0.10,
        fat: Math.abs(aF - targets.fat) / targets.fat < 0.10
      }
    }
  }
}

export default SmartScalingEngine

console.log('✅ SmartScalingEngine v2.0 loaded - preferredMealTypes, maxDifficulty, preferredIngredients, per-dag isolatie, max 2x cap')
