// src/modules/ai-meal-generator/AIMealPlanningService.js
// 🔥 VERSION 5.0 - KERSTEN'S COMPLETE OVERHAUL
/**
 * MY ARC - AI MEAL PLANNING SERVICE
 * 
 * FIXED STRATEGY (v5.0):
 * ✅ Parse meals + snacks APART (niet totaal)
 * ✅ Realistische schaling (95-105% target OK)
 * ✅ 2 rotating sets + weekend (Optie C)
 * ✅ UUID → ingredient name mapping FIXED
 * ✅ 6-factor AI scoring
 * 
 * WEEK PATROON:
 * - Ma, Di, Do, Vr: SET A (4 dagen primary)
 * - Wo: SET B (1 dag midweek variety)
 * - Za, Zo: WEEKEND ALT (2 dagen fun variety)
 */
import { getShoppingListFormatter } from './ShoppingListFormatter'

class AIMealPlanningService {
  constructor(supabase) {
    this.supabase = supabase
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000
    this.ingredientLookup = new Map()
 this.formatter = getShoppingListFormatter()
  }

  POPULAR_PROTEINS = ['kwark', 'eieren', 'whey', 'hüttenkäse', 'kipfilet', 'zalm', 'tonijn', 'kip', 'greek yogurt', 'skyr']
  POPULAR_CARBS = ['bruin brood', 'havermout', 'rijst', 'pasta', 'aardappel', 'zoete aardappel', 'quinoa', 'couscous']

  // ========================================
  // 1. CLIENT PROFILE MANAGEMENT
  // ========================================
  async ensureClientProfile(client) {
    if (!client?.id) throw new Error('No client provided')
    
    const cacheKey = `profile_${client.id}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const { data: clientData, error } = await this.supabase
        .from('clients')
        .select(`
          id, first_name, last_name,
          age, gender, height, 
          current_weight, target_weight,
          activity_level, primary_goal,
          target_calories, target_protein, 
          target_carbs, target_fat,
          dietary_type, allergies, intolerances,
          loved_foods, hated_foods,
          budget_per_week, cooking_skill
        `)
        .eq('id', client.id)
        .single()

      if (error || !clientData) {
        return this.calculateProfileFromClient(client)
      }

      const profile = {
        client_id: clientData.id,
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        gender: clientData.gender || 'male',
        age: clientData.age || 30,
        height_cm: clientData.height || 175,
        current_weight_kg: parseFloat(clientData.current_weight) || 70,
        target_weight_kg: parseFloat(clientData.target_weight) || 70,
        activity_level: clientData.activity_level || 'moderate',
        primary_goal: clientData.primary_goal || 'maintain',
        target_calories: clientData.target_calories || 2000,
        target_protein_g: clientData.target_protein || 150,
        target_carbs_g: clientData.target_carbs || 200,
        target_fat_g: clientData.target_fat || 60,
        budget_tier: this.calculateBudgetTier(clientData.budget_per_week),
        cooking_skill: clientData.cooking_skill || 'intermediate',
        meal_prep_preference: 'mixed',
        meals_per_day: 4,
        loved_ingredients: clientData.loved_foods || [],
        hated_ingredients: clientData.hated_foods || [],
        allergies: clientData.allergies || [],
        dietary_type: clientData.dietary_type || 'flexible'
      }

      this.cache.set(cacheKey, profile)
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout)
      
      return profile
    } catch (error) {
      console.error('Error loading profile:', error)
      return this.calculateProfileFromClient(client)
    }
  }

  calculateBudgetTier(weeklyBudget) {
    if (!weeklyBudget) return 'moderate'
    if (weeklyBudget < 50) return 'budget'
    if (weeklyBudget > 100) return 'premium'
    return 'moderate'
  }

  calculateProfileFromClient(client) {
    const weight = parseFloat(client.current_weight) || 70
    const height = parseFloat(client.height) || 175
    
    return {
      client_id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      gender: client.gender || 'male',
      age: client.age || 30,
      height_cm: height,
      current_weight_kg: weight,
      target_weight_kg: weight,
      activity_level: 'moderate',
      primary_goal: client.primary_goal || 'maintain',
      target_calories: 2500,
      target_protein_g: Math.round(weight * 2),
      target_carbs_g: 250,
      target_fat_g: 70,
      budget_tier: 'moderate',
      cooking_skill: 'intermediate',
      meal_prep_preference: 'mixed',
      meals_per_day: 4,
      loved_ingredients: [],
      hated_ingredients: [],
      allergies: [],
      dietary_type: 'flexible'
    }
  }

  // ========================================
  // 2. MEAL & INGREDIENT LOADING
  // ========================================
  async loadAIMeals() {
    const cacheKey = 'all_ai_meals'
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const { data: meals, error } = await this.supabase
        .from('ai_meals')
        .select('*')
        .order('name')

      if (error) throw error

      const processedMeals = (meals || []).map(meal => ({
        ...meal,
        labels: typeof meal.labels === 'string' ? 
          JSON.parse(meal.labels) : (meal.labels || []),
        timing: meal.timing || [],
        allergens: meal.allergens || [],
        ingredients: meal.ingredients_list || {}
      }))

      console.log(`✅ Loaded ${processedMeals.length} AI meals`)

      this.cache.set(cacheKey, processedMeals)
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout)
      
      return processedMeals
    } catch (error) {
      console.error('❌ Error loading AI meals:', error)
      return []
    }
  }

  async loadAIIngredients() {
    try {
      const { data: ingredients, error } = await this.supabase
        .from('ai_ingredients')
        .select('*')
        .order('name')

      if (error) throw error
      
      // BUILD LOOKUP MAP: UUID → name
      this.ingredientLookup.clear()
      ingredients.forEach(ing => {
        if (ing.id && ing.name) {
          this.ingredientLookup.set(ing.id, ing.name.toLowerCase())
        }
      })
      
      console.log(`✅ Built ingredient lookup: ${this.ingredientLookup.size} mappings`)
      
      return ingredients || []
    } catch (error) {
      console.error('Error loading ingredients:', error)
      return []
    }
  }

  // ========================================
  // 3. INGREDIENT MATCHING
  // ========================================
  normalizeSelectedIngredient(selected) {
    if (typeof selected === 'object' && selected !== null) {
      return (selected.name || selected.label || '').toLowerCase().trim()
    }
    
    if (typeof selected === 'string') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selected)
      
      if (isUUID) {
        const ingredientName = this.ingredientLookup.get(selected)
        if (ingredientName) {
          return ingredientName
        } else {
          console.warn(`⚠️ UUID not found in lookup: ${selected.substring(0, 8)}...`)
          return null
        }
      }
      
      return selected.toLowerCase().trim()
    }
    
    return null
  }

  extractMealIngredients(meal) {
    const mealIngredients = []
    
    let ingredientsList = meal.ingredients_list
    if (typeof ingredientsList === 'string') {
      try {
        ingredientsList = JSON.parse(ingredientsList)
      } catch {
        return []
      }
    }
    
    if (Array.isArray(ingredientsList)) {
      ingredientsList.forEach(item => {
        if (item.ingredient_id) {
          const name = this.ingredientLookup.get(item.ingredient_id)
          if (name) mealIngredients.push(name)
        }
      })
    } else if (typeof ingredientsList === 'object' && ingredientsList !== null) {
      Object.keys(ingredientsList).forEach(key => {
        mealIngredients.push(key.toLowerCase())
      })
    }
    
    return mealIngredients
  }

  mealHasSelectedIngredient(meal, selectedIngredients) {
    if (!selectedIngredients || selectedIngredients.length === 0) return true
    
    const mealIngredients = this.extractMealIngredients(meal)
    const mealNameLower = (meal.name || '').toLowerCase()
    
    return selectedIngredients.some(sel => {
      const searchTerm = this.normalizeSelectedIngredient(sel)
      if (!searchTerm) return false
      
      const foundInIngredients = mealIngredients.some(ing => {
        return ing === searchTerm || 
               ing.includes(searchTerm) || 
               searchTerm.includes(ing)
      })
      
      const foundInName = mealNameLower.includes(searchTerm)
      
      return foundInIngredients || foundInName
    })
  }

  countSelectedIngredientsInMeal(meal, selectedIngredients) {
    const mealIngredients = this.extractMealIngredients(meal)
    const mealNameLower = (meal.name || '').toLowerCase()
    
    let count = 0
    const foundIngredients = []
    
    selectedIngredients.forEach(sel => {
      const searchTerm = this.normalizeSelectedIngredient(sel)
      if (!searchTerm) return
      
      const foundInIngredients = mealIngredients.some(ing => 
        ing === searchTerm || ing.includes(searchTerm) || searchTerm.includes(ing)
      )
      
      const foundInName = mealNameLower.includes(searchTerm)
      
      if (foundInIngredients || foundInName) {
        count++
        foundIngredients.push(searchTerm)
      }
    })
    
    return { count, foundIngredients }
  }

  filterMealsBySelectedIngredients(meals, selectedIngredients, forcedMealIds = []) {
    if (!selectedIngredients || selectedIngredients.length === 0) {
      console.log('⚠️ No selected ingredients - returning all meals')
      return meals
    }

    console.log(`🔍 FILTERING: ${meals.length} meals by ${selectedIngredients.length} ingredients`)
    
    const forcedMealIdSet = new Set(forcedMealIds)
    
    const strictFiltered = meals.filter(meal => {
      if (forcedMealIdSet.has(meal.id)) return true
      return this.mealHasSelectedIngredient(meal, selectedIngredients)
    })
    
    console.log(`✅ STRICT FILTER: ${strictFiltered.length} meals passed`)
    
    if (strictFiltered.length < 8) {
      console.log(`⚠️ Only ${strictFiltered.length} meals - ACTIVATING RELAXED MODE`)
      
      const relaxedMeals = meals.filter(meal => {
        if (strictFiltered.some(m => m.id === meal.id)) return false
        if (meal.protein > 35) return true
        const popularLabels = ['high_protein', 'meal_prep', 'easy']
        if (meal.labels?.some(l => popularLabels.includes(l)) && meal.difficulty === 'easy') {
          return true
        }
        return false
      })
      
      console.log(`✅ RELAXED FILTER: Added ${relaxedMeals.length} high-quality meals`)
      return [...strictFiltered, ...relaxedMeals]
    }
    
    return strictFiltered
  }

  // ========================================
  // 4. AI SCORING SYSTEM (6 FACTORS)
  // ========================================
  calculateMealScore(meal, profile, selectedIngredients = []) {
    let score = 0
    const breakdown = {}
    
    // FACTOR 1: GOAL ALIGNMENT (0-30)
    const goalLabels = {
      'muscle_gain': ['high_protein', 'bulk_friendly', 'high_cal'],
      'fat_loss': ['cut_friendly', 'low_cal', 'high_protein'],
      'maintain': ['balanced', 'moderate']
    }
    
    const targetLabels = goalLabels[profile.primary_goal] || []
    const matchedLabels = targetLabels.filter(label => meal.labels?.includes(label))
    breakdown.goalAlignment = matchedLabels.length * 10
    score += breakdown.goalAlignment
    
    // FACTOR 2: MACRO FIT (0-25)
    const targetCal = profile.target_calories / (profile.meals_per_day || 4)
    const calDeviation = Math.abs(meal.calories - targetCal) / targetCal
    breakdown.macroFit = Math.max(0, 15 - (calDeviation * 15))
    
    if (profile.primary_goal === 'muscle_gain' && meal.protein > 30) {
      breakdown.macroFit += 10
    }
    score += breakdown.macroFit
    
    // FACTOR 3: PREFERENCES (0-20)
    breakdown.preferences = 0
    const mealIngredients = this.extractMealIngredients(meal)
    
    const lovedCount = (profile.loved_ingredients || []).filter(loved => 
      mealIngredients.some(ing => ing.includes(loved.toLowerCase()))
    ).length
    breakdown.preferences += lovedCount * 10
    
    const hatedCount = (profile.hated_ingredients || []).filter(hated =>
      mealIngredients.some(ing => ing.includes(hated.toLowerCase()))
    ).length
    breakdown.preferences -= hatedCount * 20
    
    const hasAllergen = (profile.allergies || []).some(allergen =>
      meal.allergens?.includes(allergen)
    )
    if (hasAllergen) return { score: -100, breakdown, disqualified: true }
    
    score += breakdown.preferences
    
    // FACTOR 4: PRACTICAL (0-15)
    breakdown.practical = 0
    const skillMatch = {
      'beginner': { 'easy': 15, 'medium': 5, 'hard': 0 },
      'intermediate': { 'easy': 10, 'medium': 15, 'hard': 5 },
      'advanced': { 'easy': 5, 'medium': 10, 'hard': 15 }
    }
    breakdown.practical += skillMatch[profile.cooking_skill]?.[meal.difficulty] || 0
    score += breakdown.practical
    
    // FACTOR 5: BUDGET (0-10)
    breakdown.budget = 0
    const budgetMatch = {
      'budget': { 'budget': 10, 'moderate': 5, 'premium': 0 },
      'moderate': { 'budget': 5, 'moderate': 10, 'premium': 5 },
      'premium': { 'budget': 0, 'moderate': 5, 'premium': 10 }
    }
    breakdown.budget += budgetMatch[profile.budget_tier]?.[meal.cost_tier] || 5
    score += breakdown.budget
    
    // FACTOR 6: VARIETY (0-5)
    breakdown.variety = Math.floor(Math.random() * 6)
    score += breakdown.variety
    
    // BONUS: Selected ingredients (+50 per match)
    if (selectedIngredients.length > 0) {
      const { count } = this.countSelectedIngredientsInMeal(meal, selectedIngredients)
      breakdown.selectedIngredientBonus = count * 50
      score += breakdown.selectedIngredientBonus
    }
    
    return { score: Math.max(0, score), breakdown, disqualified: false }
  }

  scoreAllMeals(meals, profile, selectedIngredients = []) {
    console.log(`🎯 Scoring ${meals.length} meals...`)
    
    const scored = meals
      .map(meal => {
        const scoreData = this.calculateMealScore(meal, profile, selectedIngredients)
        return {
          ...meal,
          ai_score: scoreData.score,
          score_breakdown: scoreData.breakdown,
          disqualified: scoreData.disqualified
        }
      })
      .filter(m => !m.disqualified)
      .sort((a, b) => b.ai_score - a.ai_score)
    
    console.log(`✅ Scored ${scored.length} meals (avg: ${Math.round(scored.reduce((sum, m) => sum + m.ai_score, 0) / scored.length)})`)
    
    return scored
  }

  // ========================================
  // 🔥 5. MEAL STRUCTURE PARSING
  // ========================================
  parseMealStructure(options) {
    const structure = options.mealStructure || {}
    
    console.log(`📊 Parsing meal structure:`, structure)
    
    if (structure.meals !== undefined && structure.snacks !== undefined) {
      console.log(`✅ Using wizard data: ${structure.meals} meals + ${structure.snacks} snacks`)
      return {
        realMeals: structure.meals,
        realSnacks: structure.snacks,
        totalMoments: structure.totalMoments || (structure.meals + structure.snacks)
      }
    }
    
    const mealsPerDay = options.mealsPerDay || 4
    console.log(`⚠️ Fallback: ${mealsPerDay} total moments`)
    return {
      realMeals: Math.max(3, mealsPerDay - 1),
      realSnacks: Math.min(2, mealsPerDay - 3),
      totalMoments: mealsPerDay
    }
  }

  // ========================================
  // 🔥 6. MEAL DISTRIBUTION (MEALS + SNACKS APART)
  // ========================================
  calculateMealDistribution(profile, options = {}) {
    const { realMeals, realSnacks, totalMoments } = this.parseMealStructure(options)
    
    console.log(`📊 Calculating distribution for ${realMeals} meals + ${realSnacks} snacks`)
    console.log(`   Target: ${profile.target_calories} kcal, ${profile.target_protein_g}g protein`)
    
    // Patterns: meals get 60-70%, snacks get 30-40%
    const patterns = {
      'muscle_gain': {
        3: { meals: [0.28, 0.32, 0.40], snacks: [] },
        4: { meals: [0.22, 0.28, 0.30], snacks: [0.20] },
        5: { meals: [0.18, 0.22, 0.25], snacks: [0.17, 0.18] },
        6: { meals: [0.16, 0.18, 0.20, 0.16], snacks: [0.15, 0.15] },
        7: { meals: [0.18, 0.22, 0.24, 0.18, 0.08], snacks: [0.05, 0.05] }  // 🔥 SNACKS=200kcal, meals=rest
      },
      'fat_loss': {
        3: { meals: [0.30, 0.35, 0.35], snacks: [] },
        4: { meals: [0.25, 0.30, 0.30], snacks: [0.15] },
        5: { meals: [0.22, 0.26, 0.27], snacks: [0.12, 0.13] },
        6: { meals: [0.18, 0.20, 0.22, 0.18], snacks: [0.11, 0.11] },
        7: { meals: [0.15, 0.18, 0.20, 0.18, 0.14], snacks: [0.08, 0.07] }
      },
      'maintain': {
        3: { meals: [0.30, 0.35, 0.35], snacks: [] },
        4: { meals: [0.24, 0.28, 0.28], snacks: [0.20] },
        5: { meals: [0.20, 0.24, 0.26], snacks: [0.15, 0.15] },
        6: { meals: [0.17, 0.19, 0.21, 0.18], snacks: [0.13, 0.12] },
        7: { meals: [0.14, 0.18, 0.20, 0.16, 0.12], snacks: [0.10, 0.10] }
      }
    }
    
    const goalPattern = patterns[profile.primary_goal] || patterns['maintain']
    const pattern = goalPattern[totalMoments] || goalPattern[4]
    
    const distribution = {}
    const mealSlots = ['breakfast', 'lunch', 'dinner', 'meal4', 'meal5', 'meal6', 'meal7']
    const snackSlots = ['snack1', 'snack2', 'snack3']
    
    // Assign meals
    pattern.meals.forEach((pct, idx) => {
      if (idx < realMeals) {
        const slot = mealSlots[idx]
        distribution[slot] = {
          targetCalories: Math.round(profile.target_calories * pct),
          targetProtein: Math.round(profile.target_protein_g * pct),
          isSnack: false
        }
      }
    })
    
    // Assign snacks
    pattern.snacks.forEach((pct, idx) => {
      if (idx < realSnacks) {
        const slot = snackSlots[idx]
        distribution[slot] = {
          targetCalories: Math.round(profile.target_calories * pct),
          targetProtein: Math.round(profile.target_protein_g * pct),
          isSnack: true
        }
      }
    })
    
    console.log('📊 Distribution:')
    Object.entries(distribution).forEach(([slot, data]) => {
      console.log(`   ${slot}: ${data.targetCalories} kcal (${data.targetProtein}g protein)`)
    })
    
    return distribution
  }

  // ========================================
  // 🔥 7. EXACT SCALING - NO LIMITS
  // ========================================
  scaleMealToTarget(meal, targetCalories, targetProtein) {
    // 🔥 CRITICAL: Use ONLY calorie-based scaling
    // Protein will scale proportionally with calories
    const finalScaleFactor = targetCalories / meal.calories
    
    // 🔥 DEBUG LOGGING
    console.log(`   🎯 SCALING: "${meal.name}" (${meal.calories} kcal) → ${targetCalories} kcal target`)
    console.log(`      Factor: ${finalScaleFactor.toFixed(2)}x → Result: ${Math.round(meal.calories * finalScaleFactor)} kcal`)
    
    return {
      ...meal,
      calories: Math.round(meal.calories * finalScaleFactor),
      protein: Math.round(meal.protein * finalScaleFactor),
      carbs: Math.round(meal.carbs * finalScaleFactor),
      fat: Math.round(meal.fat * finalScaleFactor),
      scaleFactor: finalScaleFactor,
      baseId: meal.id,
      originalCalories: meal.calories,
      name: finalScaleFactor > 1.3 || finalScaleFactor < 0.7
        ? `${meal.name} (${Math.round(finalScaleFactor * 100)}%)`
        : meal.name
    }
  }

  // ========================================
  // 🔥 8. SMART MEAL GROUPING BY CALORIE RANGE
  // ========================================
  groupMealsBySlot(scoredMeals, distribution) {
    console.log('📊 === GROUPING MEALS BY SLOT (CALORIE-AWARE) ===')
    
    const grouped = {}
    const anyTimeMeals = scoredMeals.filter(m => 
      !m.timing || m.timing.length === 0 || m.timing.includes('any')
    )
    
    Object.keys(distribution).forEach(slot => {
      const isSnack = distribution[slot].isSnack
      const targetCal = distribution[slot].targetCalories
      
      // 🔥 CALORIE RANGE: 75% - 125% van target
      const minCal = targetCal * 0.75
      const maxCal = targetCal * 1.25
      
      let timingKeyword = slot
      if (slot.startsWith('meal')) {
        const mealNum = parseInt(slot.replace('meal', ''))
        timingKeyword = mealNum <= 5 ? 'dinner' : 'lunch'
      } else if (slot.startsWith('snack')) {
        timingKeyword = 'snack'
      }
      
      // 🔥 STEP 1: Find meals with correct timing AND calorie range
      let candidates = scoredMeals.filter(m => 
        m.timing?.includes(timingKeyword) &&
        m.calories >= minCal &&
        m.calories <= maxCal
      )
      
      console.log(`   ${slot} (${targetCal} kcal): ${candidates.length} in range ${Math.round(minCal)}-${Math.round(maxCal)}`)
      
      // 🔥 FALLBACK 1: Relax calorie range (50% - 150%)
      if (candidates.length < 3) {
        console.log(`   🔄 FALLBACK: Relaxing calorie range for ${slot}`)
        candidates = scoredMeals.filter(m =>
          m.timing?.includes(timingKeyword) &&
          m.calories >= targetCal * 0.5 &&
          m.calories <= targetCal * 1.5
        )
        console.log(`   Found ${candidates.length} with relaxed range`)
      }
      
      // 🔥 FALLBACK 2: Ignore calorie, just timing
      if (candidates.length === 0) {
        console.log(`   🔄 FALLBACK: Ignoring calorie range for ${slot}`)
        candidates = scoredMeals.filter(m => m.timing?.includes(timingKeyword))
        
        // FALLBACK 3: Use any-time meals or all meals
        if (candidates.length === 0) {
          if (isSnack) {
            candidates = scoredMeals.filter(m => m.calories < targetCal * 1.5).slice(0, 10)
          } else {
            candidates = anyTimeMeals.length > 0 ? anyTimeMeals : scoredMeals.slice(0, 10)
          }
          console.log(`   🔄 FALLBACK: Using ${candidates.length} generic meals`)
        }
      }
      
      grouped[slot] = candidates
    })
    
    return grouped
  }

  selectSetA(groupedMeals) {
    console.log('🎯 === SELECTING SET A (Primary - 4 days) ===')
    
    const setA = {}
    const usedMealIds = new Set()
    
    Object.entries(groupedMeals).forEach(([slot, candidates]) => {
      const available = candidates.filter(m => !usedMealIds.has(m.id))
      
      if (available.length === 0) {
        setA[slot] = candidates[0]
      } else {
        setA[slot] = available[0]
        usedMealIds.add(available[0].id)
      }
      
      console.log(`   ✅ ${slot}: "${setA[slot].name}" (${setA[slot].calories} kcal)`)
    })
    
    return setA
  }

  selectSetB(groupedMeals, setA) {
    console.log('🔄 === SELECTING SET B (Midweek - 1 day) ===')
    
    const setB = {}
    const usedMealIds = new Set(Object.values(setA).map(m => m.id))
    
    Object.entries(groupedMeals).forEach(([slot, candidates]) => {
      const available = candidates.filter(m => !usedMealIds.has(m.id))
      
      if (available.length === 0) {
        setB[slot] = setA[slot]
        console.log(`   ⚠️ ${slot}: Using Set A`)
      } else {
        const topOptions = available.slice(0, Math.min(3, available.length))
        setB[slot] = topOptions[Math.floor(Math.random() * topOptions.length)]
        usedMealIds.add(setB[slot].id)
        console.log(`   ✅ ${slot}: "${setB[slot].name}" (${setB[slot].calories} kcal)`)
      }
    })
    
    return setB
  }

  selectWeekendAlt(groupedMeals, setA, setB) {
    console.log('🎉 === SELECTING WEEKEND ALT (Fun - 2 days) ===')
    
    const weekendAlt = {}
    const usedMealIds = new Set([
      ...Object.values(setA).map(m => m.id),
      ...Object.values(setB).map(m => m.id)
    ])
    
    Object.entries(groupedMeals).forEach(([slot, candidates]) => {
      const available = candidates.filter(m => !usedMealIds.has(m.id))
      
      if (available.length === 0) {
        weekendAlt[slot] = setB[slot]
        console.log(`   ⚠️ ${slot}: Using Set B`)
      } else {
        const topOptions = available.slice(0, Math.min(5, available.length))
        weekendAlt[slot] = topOptions[Math.floor(Math.random() * topOptions.length)]
        usedMealIds.add(weekendAlt[slot].id)
        console.log(`   ✅ ${slot}: "${weekendAlt[slot].name}" (${weekendAlt[slot].calories} kcal)`)
      }
    })
    
    return weekendAlt
  }

  // ========================================
  // 🔥 9. WEEK PLAN GENERATION
  // ========================================
  async generateWeekPlan(clientProfile, options = {}) {
    const {
      days = 7,
      forcedMealIds = [],
      excludedIngredients = [],
      selectedIngredients = [],
      mealStructure = null
    } = options

    console.log('🚀 === GENERATING AI WEEK PLAN V5 ===')
    console.log(`   Client: ${clientProfile.first_name}`)
    console.log(`   Target: ${clientProfile.target_calories} kcal, ${clientProfile.target_protein_g}g protein`)
    console.log(`   Selected ingredients: ${selectedIngredients.length}`)
    console.log(`   Meal structure:`, mealStructure)

    // STEP 1: Load meals + ingredients
    const [allMeals, ingredients] = await Promise.all([
      this.loadAIMeals(),
      this.loadAIIngredients()
    ])
    
    if (allMeals.length === 0) {
      throw new Error('No meals available in database')
    }

    // STEP 2: Filter by selected ingredients
    const eligibleMeals = this.filterMealsBySelectedIngredients(
      allMeals, 
      selectedIngredients, 
      forcedMealIds
    )

    if (eligibleMeals.length === 0) {
      throw new Error('No meals match your selected ingredients')
    }

    // STEP 3: Score all eligible meals
    const scoredMeals = this.scoreAllMeals(eligibleMeals, clientProfile, selectedIngredients)

    // STEP 4: Calculate distribution (meals + snacks)
    const distribution = this.calculateMealDistribution(clientProfile, { 
      ...options,
      mealStructure 
    })

    // STEP 5: Group meals by slot
    const groupedMeals = this.groupMealsBySlot(scoredMeals, distribution)

    // STEP 6: Select 3 meal sets
    const setA = this.selectSetA(groupedMeals)
    const setB = this.selectSetB(groupedMeals, setA)
    const weekendAlt = this.selectWeekendAlt(groupedMeals, setA, setB)

    // STEP 7: Build week structure (Optie C patroon)
    const weekPlan = []
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    // Patroon: Ma(A), Di(A), Wo(B), Do(A), Vr(A), Za(ALT), Zo(ALT)
    const setAssignment = [setA, setA, setB, setA, setA, weekendAlt, weekendAlt]
    
    dayNames.forEach((dayName, dayIndex) => {
      const mealsToUse = setAssignment[dayIndex]
      
      const dayPlan = {
        meals: [],
        totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      }
      
      // Add all slots
      Object.entries(distribution).forEach(([slot, targets]) => {
        const meal = mealsToUse[slot]
        if (!meal) return
        
        const scaledMeal = this.scaleMealToTarget(meal, targets.targetCalories, targets.targetProtein)
        
        dayPlan.meals.push({
          slot,
          meal: scaledMeal,
          isSnack: targets.isSnack
        })
        
        dayPlan.totals.kcal += scaledMeal.calories || 0
        dayPlan.totals.protein += scaledMeal.protein || 0
        dayPlan.totals.carbs += scaledMeal.carbs || 0
        dayPlan.totals.fat += scaledMeal.fat || 0
      })
      
      weekPlan.push(dayPlan)
      
      const setName = dayIndex === 2 ? 'SET B' : (dayIndex >= 5 ? 'WEEKEND' : 'SET A')
      console.log(`📅 ${dayName} (${setName}): ${Math.round(dayPlan.totals.kcal)} kcal, ${Math.round(dayPlan.totals.protein)}g protein`)
    })





// STEP 8: Stats & analysis
const stats = this.calculatePlanStatistics(weekPlan, clientProfile)
const aiAnalysis = this.analyzePlan(weekPlan, clientProfile, selectedIngredients, excludedIngredients)

// STEP 9: Generate shopping list for PDF export
console.log('🛒 Generating shopping list for week plan...')
const shoppingList = this.generateShoppingListFromWeekPlan(weekPlan)
console.log(`✅ Shopping list: ${shoppingList.ingredients.length} items, €${shoppingList.totalCost}`)

// Add shopping list to stats
stats.shoppingList = shoppingList

console.log('✅ Week plan V5 generated successfully')

return {      weekPlan,
      dailyTargets: {
        kcal: clientProfile.target_calories,
        protein: clientProfile.target_protein_g,
        carbs: clientProfile.target_carbs_g,
        fat: clientProfile.target_fat_g
      },
      stats,
      aiAnalysis,
      clientProfile,
      generatedAt: new Date(),
      aiOptimized: true,
      repetitionStrategy: 'v5_2_sets_rotating',
      setA: Object.entries(setA).map(([slot, meal]) => ({
        slot,
        id: meal.id,
        name: meal.name
      })),
      setB: Object.entries(setB).map(([slot, meal]) => ({
        slot,
        id: meal.id,
        name: meal.name
      })),
      weekendAlt: Object.entries(weekendAlt).map(([slot, meal]) => ({
        slot,
        id: meal.id,
        name: meal.name
      }))
    }
  }

// ========================================
// 10. STATISTICS & ANALYSIS - COMPLETE REPLACEMENT
// ========================================
// VERWIJDER de oude calculatePlanStatistics methode VOLLEDIG
// PLAK deze nieuwe versie in plaats daarvan:

// ========================================
// FIX: calculatePlanStatistics - Dynamic Meal Structure
// Replace in AIMealPlanningService.js (around line 870-920)
// ========================================

async calculatePlanStatistics(weekPlan, profile) {
  const stats = {
    averageAccuracy: 0,
    weekAverages: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    mealVariety: new Set(),
    complianceScore: 0,
    varietyScore: 0,
    scalingUsed: false,
    averageScaleFactor: 0,
    shoppingList: null
  }
  
  let totalAccuracy = 0
  let totalScaleFactor = 0
  let scaledMealsCount = 0
  
  weekPlan.forEach(day => {
    totalAccuracy += day.accuracy?.total || 0
    
    stats.weekAverages.kcal += day.totals.kcal
    stats.weekAverages.protein += day.totals.protein
    stats.weekAverages.carbs += day.totals.carbs
    stats.weekAverages.fat += day.totals.fat
    
    // ✅ DYNAMIC MEAL COLLECTION - Works with ANY slot structure
    const meals = []
    Object.keys(day).forEach(key => {
      // Skip metadata keys
      if (key === 'totals' || key === 'accuracy') return
      
      const meal = day[key]
      // Check if it's a valid meal object
      if (meal && typeof meal === 'object' && (meal.id || meal.name)) {
        meals.push(meal)
      }
    })
    
    // Process collected meals
    meals.forEach(meal => {
      const baseId = meal.baseId || meal.id
      stats.mealVariety.add(baseId)
      
      if (meal.scaleFactor) {
        totalScaleFactor += meal.scaleFactor
        scaledMealsCount++
        stats.scalingUsed = true
      }
    })
  })
  
  const days = weekPlan.length || 1
  
  stats.averageAccuracy = Math.round(totalAccuracy / days)
  stats.weekAverages.kcal = Math.round(stats.weekAverages.kcal / days)
  stats.weekAverages.protein = Math.round(stats.weekAverages.protein / days)
  stats.weekAverages.carbs = Math.round(stats.weekAverages.carbs / days)
  stats.weekAverages.fat = Math.round(stats.weekAverages.fat / days)
  
  if (scaledMealsCount > 0) {
    stats.averageScaleFactor = (totalScaleFactor / scaledMealsCount).toFixed(2)
  }
  
  const totalMealSlots = days * (profile.meals_per_day || 4)
  stats.varietyScore = Math.round((stats.mealVariety.size / Math.min(totalMealSlots, 20)) * 100)
  
  const calCompliance = 100 - Math.min(10, Math.abs(100 - (stats.weekAverages.kcal / profile.target_calories * 100)))
  const protCompliance = 100 - Math.min(10, Math.abs(100 - (stats.weekAverages.protein / profile.target_protein_g * 100)))
  stats.complianceScore = Math.round((calCompliance + protCompliance) / 2)
  
  // ✅ GENERATE SHOPPING LIST
  console.log('📊 Generating shopping list in calculatePlanStatistics...')
  try {
    stats.shoppingList = await this.generateShoppingListFromWeekPlan(weekPlan)
    console.log(`✅ Shopping list generated: ${stats.shoppingList?.itemCount || 0} items`)
  } catch (error) {
    console.error('❌ Shopping list generation failed:', error)
    stats.shoppingList = {
      ingredients: [],
      totalCost: '0.00',
      dailyCost: '0.00',
      itemCount: 0,
      weekDays: weekPlan.length,
      generatedAt: new Date().toISOString()
    }
  }
  
  return stats
}

// ========================================
// SHOPPING LIST GENERATION - COMPLETE CODE
// Add these methods to AIMealPlanningService class
// ========================================

/**
 * Generate shopping list from week plan (MAIN METHOD)
 */

// ========================================
// FIX: Ingredient Name Resolution in Shopping List
// Add to AIMealPlanningService.js
// ========================================

/**
 * Enhanced shopping list generation WITH ingredient name lookup
 */
async generateShoppingListFromWeekPlan(weekPlan) {
  console.log('🛒 === SHOPPING LIST GENERATION START (WITH NAME LOOKUP) ===')
  console.log(`📊 Week plan received: ${weekPlan?.length || 0} days`)
  
  const ingredients = new Map()
  let totalCost = 0
  let mealCount = 0
  let mealsWithIngredients = 0
  let mealsWithoutIngredients = 0
  
  // ✅ LOAD ALL INGREDIENTS FROM DATABASE FOR NAME LOOKUP
  let ingredientLookup = new Map()
  try {
    const { data: allIngredients } = await this.supabase
      .from('ai_ingredients')
      .select('id, name, name_en')
    
    if (allIngredients) {
      allIngredients.forEach(ing => {
        ingredientLookup.set(ing.id, ing.name || ing.name_en || ing.id)
      })
      console.log(`✅ Loaded ${ingredientLookup.size} ingredient names for lookup`)
    }
  } catch (error) {
    console.warn('⚠️ Could not load ingredient lookup table:', error)
  }
  
  if (!weekPlan || weekPlan.length === 0) {
    console.error('❌ Empty or null week plan provided')
    return {
      ingredients: [],
      totalCost: '0.00',
      dailyCost: '0.00',
      itemCount: 0,
      weekDays: 0,
      generatedAt: new Date().toISOString()
    }
  }
  
  // Process each day
  weekPlan.forEach((day, dayIndex) => {
    if (!day) {
      console.warn(`⚠️ Day ${dayIndex + 1} is null/undefined`)
      return
    }
    
    console.log(`\n📅 Processing Day ${dayIndex + 1}:`)
    
    // Get all slot keys
    const slotKeys = Object.keys(day).filter(key => 
      key !== 'totals' && 
      key !== 'accuracy' && 
      key !== 'snacks'
    )
    
    console.log(`   Slots found: ${slotKeys.join(', ')}`)
    
    slotKeys.forEach(slotKey => {
      const meal = day[slotKey]
      
      if (!meal || typeof meal !== 'object') {
        console.log(`   ${slotKey}: Empty slot`)
        return
      }
      
      if (!meal.id && !meal.name) {
        console.warn(`   ${slotKey}: Invalid meal object`)
        return
      }
      
      mealCount++
      console.log(`   ${slotKey}: "${meal.name}" (ID: ${meal.id})`)
      
      const scaleFactor = meal.scaleFactor || meal.scale_factor || meal.finalScale || 1
      if (scaleFactor !== 1) {
        console.log(`      Scale factor: ${scaleFactor}`)
      }
      
      const mealCost = (meal.total_cost || meal.totalCost || 5) * scaleFactor
      totalCost += mealCost
      
      // Extract ingredients
      const ingredientsList = meal.ingredients_list || meal.ingredientsList || meal.ingredients
      
      if (!ingredientsList) {
        console.warn(`      ⚠️ No ingredients_list found`)
        mealsWithoutIngredients++
        return
      }
      
      // Parse if string
      let parsedIngredients = ingredientsList
      if (typeof ingredientsList === 'string') {
        try {
          parsedIngredients = JSON.parse(ingredientsList)
          console.log(`      Parsed string ingredients`)
        } catch (e) {
          console.error(`      ❌ Failed to parse ingredients:`, e.message)
          mealsWithoutIngredients++
          return
        }
      }
      
      // Check if empty
      if (Array.isArray(parsedIngredients) && parsedIngredients.length === 0) {
        console.warn(`      ⚠️ Empty ingredients array`)
        mealsWithoutIngredients++
        return
      }
      
      if (typeof parsedIngredients === 'object' && Object.keys(parsedIngredients).length === 0) {
        console.warn(`      ⚠️ Empty ingredients object`)
        mealsWithoutIngredients++
        return
      }
      
      mealsWithIngredients++
      
      // Process ingredients based on format
      if (Array.isArray(parsedIngredients)) {
        console.log(`      Processing ${parsedIngredients.length} ingredients (array format)`)
        
        parsedIngredients.forEach(item => {
          // Try to get name, fallback to lookup by ID
          let name = item.name || item.ingredient_name
          
          if (!name && item.ingredient_id && ingredientLookup.has(item.ingredient_id)) {
            name = ingredientLookup.get(item.ingredient_id)
            console.log(`      ✅ Resolved ID ${item.ingredient_id.substring(0, 8)}... → "${name}"`)
          }
          
          if (!name) {
            name = item.ingredient_id || 'Unknown'
            console.warn(`      ⚠️ Could not resolve ingredient name for: ${name}`)
          }
          
          const amount = parseFloat(item.amount) || 100
          const unit = item.unit || 'g'
          
          this.addIngredientToMap(ingredients, name, amount, unit, scaleFactor, meal.name, dayIndex + 1, slotKey)
        })
        
      } else if (typeof parsedIngredients === 'object') {
        const ingredientKeys = Object.keys(parsedIngredients)
        console.log(`      Processing ${ingredientKeys.length} ingredients (object format)`)
        
        ingredientKeys.forEach(key => {
          // Check if key is UUID (ingredient ID) or actual name
          let name = key
          const isUUID = key.length === 36 && key.includes('-')
          
          if (isUUID && ingredientLookup.has(key)) {
            name = ingredientLookup.get(key)
            console.log(`      ✅ Resolved UUID ${key.substring(0, 8)}... → "${name}"`)
          } else if (isUUID) {
            console.warn(`      ⚠️ UUID not found in lookup: ${key}`)
          }
          
          const value = parsedIngredients[key]
          let amount, unit
          
          if (typeof value === 'object' && value !== null) {
            amount = parseFloat(value.amount || value.value) || 100
            unit = value.unit || 'g'
          } else {
            amount = parseFloat(value) || 100
            unit = 'g'
          }
          
          this.addIngredientToMap(ingredients, name, amount, unit, scaleFactor, meal.name, dayIndex + 1, slotKey)
        })
      }
    })
  })
  
  // Sort ingredients alphabetically
  const sortedIngredients = Array.from(ingredients.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  )
  

  // ✅ ENRICH WITH DATABASE INFO
  console.log('📦 Enriching ingredients with purchase info...')
  const ingredientNames = sortedIngredients.map(ing => ing.name)
  
  let enrichedIngredients = sortedIngredients
  try {
    const { data: ingredientDetails } = await this.supabase
      .from('ai_ingredients')
      .select('name, purchase_unit, purchase_price, unit_type, default_portion_gram')
      .in('name', ingredientNames)
    
    if (ingredientDetails && ingredientDetails.length > 0) {
      enrichedIngredients = sortedIngredients.map(ing => {
        const details = ingredientDetails.find(d => 
          d.name.toLowerCase() === ing.name.toLowerCase()
        )
        
        if (details) {
          return {
            ...ing,
            purchase_unit: details.purchase_unit,
            purchase_price: details.purchase_price,
            db_unit_type: details.unit_type,
            default_portion: details.default_portion_gram
          }
        }
        return ing
      })
      console.log(`✅ Enriched ${ingredientDetails.length} ingredients with purchase info`)
    }
  } catch (error) {
    console.warn('⚠️ Could not enrich ingredients:', error)
  }

  console.log('\n✅ === SHOPPING LIST GENERATION COMPLETE ===')
  console.log(`📊 Total meals processed: ${mealCount}`)
  console.log(`✅ Meals with ingredients: ${mealsWithIngredients}`)
  console.log(`⚠️ Meals without ingredients: ${mealsWithoutIngredients}`)
  console.log(`🛒 Unique ingredients: ${enrichedIngredients.length}`)
  console.log(`💰 Estimated total cost: €${totalCost.toFixed(2)}`)
  
  // ✅ APPLY FORMATTER
  const rawList = {
    ingredients: enrichedIngredients,  // ← CHANGED!
    totalCost: totalCost.toFixed(2),
    dailyCost: (totalCost / weekPlan.length).toFixed(2),
    itemCount: enrichedIngredients.length,  // ← CHANGED!
    weekDays: weekPlan.length,
    mealsProcessed: mealCount,
    mealsWithIngredients: mealsWithIngredients,
    mealsWithoutIngredients: mealsWithoutIngredients,
    generatedAt: new Date().toISOString()
  }
  
  const formattedList = this.formatter.formatShoppingList(rawList)
  const tips = this.formatter.generateShoppingTips(formattedList)
  
  return {
    raw: rawList,
    formatted: formattedList,
    tips: tips
  }
}

/**
 * Alias for backward compatibility
 */
generateShoppingList(weekPlan) {
  return this.generateShoppingListFromWeekPlan(weekPlan)
}

/**
 * Helper to add ingredient to shopping map
 */
addIngredientToMap(ingredients, name, amount, unit, scaleFactor, mealName, day, slot) {
  const key = name.toLowerCase().trim()
  
  if (!ingredients.has(key)) {
    ingredients.set(key, {
      id: key,
      name: name.trim(),
      totalAmount: 0,
      unit: unit || 'g',
      usedIn: [],
      category: this.categorizeIngredient(name)
    })
  }
  
  const ing = ingredients.get(key)
  const scaledAmount = amount * scaleFactor
  
  ing.totalAmount += scaledAmount
  ing.usedIn.push({
    meal: mealName,
    day: day,
    slot: slot,
    amount: scaledAmount,
    originalAmount: amount,
    scaled: scaleFactor !== 1
  })
}

/**
 * Categorize ingredient for shopping list organization
 */
categorizeIngredient(name) {
  const n = name.toLowerCase()
  
  // Protein
  if (n.includes('kip') || n.includes('chicken') || n.includes('vlees') || n.includes('beef') ||
      n.includes('varken') || n.includes('pork') || n.includes('vis') || n.includes('fish') ||
      n.includes('zalm') || n.includes('salmon') || n.includes('tonijn') || n.includes('tuna') ||
      n.includes('ei') || n.includes('egg') || n.includes('protein')) {
    return 'Eiwitten'
  }
  
  // Vegetables
  if (n.includes('broccoli') || n.includes('spinazie') || n.includes('spinach') ||
      n.includes('sla') || n.includes('lettuce') || n.includes('tomaat') || n.includes('tomato') ||
      n.includes('wortel') || n.includes('carrot') || n.includes('paprika') || n.includes('pepper') ||
      n.includes('ui') || n.includes('onion') || n.includes('knoflook') || n.includes('garlic') ||
      n.includes('komkommer') || n.includes('cucumber')) {
    return 'Groenten'
  }
  
  // Carbs
  if (n.includes('rijst') || n.includes('rice') || n.includes('pasta') || n.includes('brood') ||
      n.includes('bread') || n.includes('aardappel') || n.includes('potato') ||
      n.includes('haver') || n.includes('oats') || n.includes('quinoa')) {
    return 'Koolhydraten'
  }
  
  // Dairy
  if (n.includes('melk') || n.includes('milk') || n.includes('kaas') || n.includes('cheese') ||
      n.includes('yoghurt') || n.includes('yogurt') || n.includes('kwark') || n.includes('quark') ||
      n.includes('boter') || n.includes('butter')) {
    return 'Zuivel'
  }
  
  // Fruit
  if (n.includes('appel') || n.includes('apple') || n.includes('banaan') || n.includes('banana') ||
      n.includes('sinaasappel') || n.includes('orange') || n.includes('bes') || n.includes('berry') ||
      n.includes('fruit')) {
    return 'Fruit'
  }
  
  // Fats
  if (n.includes('olie') || n.includes('oil') || n.includes('olijf') || n.includes('olive') ||
      n.includes('avocado') || n.includes('noten') || n.includes('nuts') ||
      n.includes('pinda') || n.includes('peanut')) {
    return 'Vetten & Oliën'
  }
  
  // Spices
  if (n.includes('zout') || n.includes('salt') || n.includes('peper') || n.includes('pepper') ||
      n.includes('kruid') || n.includes('spice') || n.includes('herb')) {
    return 'Kruiden & Specerijen'
  }
  
  return 'Overig'
}









  // ========================================
  
// 11. PLAN MANAGEMENT
  // ========================================
  async savePlan(plan, clientId, name) {
    try {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const weekStructure = {}
      
      plan.weekPlan.forEach((day, index) => {
        const dayData = {
          meals: {},
          snacks: [],
          totals: day.totals,
          scaling: {}
        }
        
        day.meals?.forEach(({ slot, meal, isSnack }) => {
          if (isSnack) {
            dayData.snacks.push(meal.id)
            dayData.scaling[slot] = meal.scaleFactor || 1
          } else {
            dayData.meals[slot] = meal.id
            dayData.scaling[slot] = meal.scaleFactor || 1
          }
        })
        
        weekStructure[days[index]] = dayData
      })

      console.log('🛒 Auto-generating shopping list...')
      
      let shoppingList = null
      try {
        const ShoppingService = (await import('../shopping/ShoppingService')).default
        const shoppingService = new ShoppingService({ supabase: this.supabase })
        
        shoppingList = await shoppingService.generateShoppingList(weekStructure)
        console.log(`✅ Shopping list: ${shoppingList.itemCount} items, €${shoppingList.totalCost.toFixed(2)}`)
      } catch (error) {
        console.error('⚠️ Shopping generation failed (non-blocking):', error)
        shoppingList = {
          items: [],
          totalCost: 0,
          itemCount: 0,
          generatedAt: new Date().toISOString()
        }
      }
      
      const planData = {
        client_id: clientId,
        template_name: name || `AI Plan - ${new Date().toLocaleDateString('nl-NL')}`,
        week_structure: weekStructure,
        shopping_list: shoppingList,
        daily_calories: plan.dailyTargets?.kcal || 2000,
        daily_protein: plan.dailyTargets?.protein || 150,
        daily_carbs: plan.dailyTargets?.carbs || 200,
        daily_fat: plan.dailyTargets?.fat || 70,
        is_active: true,
        ai_generated: true,
        ai_version: 'v5_rotating_sets',
        stats: plan.stats,
        start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      }
      
      const { data, error } = await this.supabase
        .from('client_meal_plans')
        .insert([planData])
        .select()
      
      if (error) throw error
      
      if (data && data[0]) {
        await this.supabase
          .from('client_meal_plans')
          .update({ is_active: false })
          .eq('client_id', clientId)
          .neq('id', data[0].id)
      }
      
      console.log('✅ Plan saved successfully')
      return data[0]
      
    } catch (error) {
      console.error('❌ Failed to save plan:', error)
      throw error
    }
  }
}

// ========================================
// EXPORT
// ========================================
let serviceInstance = null

export function getAIMealPlanningService(supabase) {
  if (!serviceInstance || serviceInstance.supabase !== supabase) {
    serviceInstance = new AIMealPlanningService(supabase)
  }
  return serviceInstance
}

export default AIMealPlanningService
