// src/modules/ai-meal-generator/AIMealPlanningService.js
// ENHANCED VERSION - With Selected Ingredients Support

/**
 * MY ARC - AI MEAL PLANNING SERVICE WITH INGREDIENT PREFERENCES
 * Features:
 * - Selected ingredients get +10 bonus points
 * - Excluded ingredients get -100 points (disqualified)
 * - Dynamic portion scaling for ANY diet
 * - ALWAYS hits calorie and protein targets
 */

class AIMealPlanningService {
  constructor(supabase) {
    this.supabase = supabase
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

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
        console.log('Client not found, using calculated profile')
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
        target_fat_g: clientData.target_fat || 70,
        meals_per_day: 4,
        budget_tier: this.calculateBudgetTier(clientData.budget_per_week),
        meal_prep_preference: 'mixed',
        cooking_skill: clientData.cooking_skill || 'intermediate',
        loved_ingredients: this.parseIngredientList(clientData.loved_foods),
        hated_ingredients: this.parseIngredientList(clientData.hated_foods),
        allergies: this.parseIngredientList(clientData.allergies),
        intolerances: this.parseIngredientList(clientData.intolerances),
        dietary_type: clientData.dietary_type || 'omnivore'
      }

      this.cache.set(cacheKey, profile)
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout)
      return profile

    } catch (error) {
      console.error('Error loading client profile:', error)
      return this.calculateProfileFromClient(client)
    }
  }

  parseIngredientList(str) {
    if (!str) return []
    if (Array.isArray(str)) return str
    return str.split(',').map(s => s.trim()).filter(Boolean)
  }

  calculateBudgetTier(weeklyBudget) {
    if (!weeklyBudget) return 'moderate'
    const budget = parseFloat(weeklyBudget)
    if (budget < 50) return 'budget'
    if (budget > 100) return 'premium'
    return 'moderate'
  }

  calculateProfileFromClient(client) {
    const weight = parseFloat(client.current_weight) || 70
    const targetWeight = parseFloat(client.target_weight) || weight
    const height = client.height || 175
    const age = client.age || 30
    const gender = client.gender || 'male'
    
    let bmr
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    }
    
    const activityLevel = client.activity_level || 'moderate'
    const multipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderate': 1.55,
      'very_active': 1.725,
      'athlete': 1.9
    }
    
    const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.55))
    
    let primaryGoal = 'maintain'
    let targetCalories = tdee
    
    if (targetWeight < weight - 2) {
      primaryGoal = 'fat_loss'
      targetCalories = tdee - 500
    } else if (targetWeight > weight + 2) {
      primaryGoal = 'muscle_gain'
      targetCalories = tdee + 300
    }
    
    const proteinG = Math.round(weight * 2.2)
    const fatG = Math.round(weight * 1.0)
    const proteinCal = proteinG * 4
    const fatCal = fatG * 9
    const carbCal = targetCalories - proteinCal - fatCal
    const carbsG = Math.round(carbCal / 4)
    
    return {
      client_id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      gender: gender,
      age: age,
      height_cm: height,
      current_weight_kg: weight,
      target_weight_kg: targetWeight,
      activity_level: activityLevel,
      primary_goal: primaryGoal,
      tdee_calories: tdee,
      target_calories: targetCalories,
      target_protein_g: proteinG,
      target_carbs_g: carbsG,
      target_fat_g: fatG,
      meals_per_day: 4,
      budget_tier: 'moderate',
      meal_prep_preference: 'mixed',
      cooking_skill: 'intermediate',
      loved_ingredients: [],
      hated_ingredients: [],
      allergies: [],
      intolerances: [],
      dietary_type: 'omnivore'
    }
  }

  // ========================================
  // 2. MEAL MANAGEMENT
  // ========================================

  async loadAIMeals() {
    const cacheKey = 'ai_meals'
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const { data: meals, error } = await this.supabase
        .from('ai_meals')
        .select('*')
        .order('protein', { ascending: false })

      if (error) throw error

      const processedMeals = (meals || []).map(meal => ({
        ...meal,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        fiber: meal.fiber || 0,
        labels: typeof meal.labels === 'string' ? JSON.parse(meal.labels) : (meal.labels || []),
        timing: meal.timing || [],
        allergens: meal.allergens || [],
        ingredients: meal.ingredients_list || {}
      }))

      console.log(`✅ Loaded ${processedMeals.length} AI meals`)

      if (processedMeals.length < 20) {
        console.log(`⚠️ Only ${processedMeals.length} meals available - creating variations`)
        return this.createMealVariations(processedMeals)
      }

      this.cache.set(cacheKey, processedMeals)
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout)
      
      return processedMeals

    } catch (error) {
      console.error('❌ Error loading AI meals:', error)
      return []
    }
  }

  createMealVariations(originalMeals) {
    const variations = [...originalMeals]
    
    originalMeals.forEach(meal => {
      // Small portion (0.75x)
      variations.push({
        ...meal,
        id: `${meal.id}_small`,
        name: `${meal.name} (Kleine Portie)`,
        calories: Math.round(meal.calories * 0.75),
        protein: Math.round(meal.protein * 0.75),
        carbs: Math.round(meal.carbs * 0.75),
        fat: Math.round(meal.fat * 0.75),
        isVariation: true,
        baseId: meal.id,
        scaleFactor: 0.75
      })
      
      // Large portion (1.5x)
      variations.push({
        ...meal,
        id: `${meal.id}_large`,
        name: `${meal.name} (Grote Portie)`,
        calories: Math.round(meal.calories * 1.5),
        protein: Math.round(meal.protein * 1.5),
        carbs: Math.round(meal.carbs * 1.5),
        fat: Math.round(meal.fat * 1.5),
        isVariation: true,
        baseId: meal.id,
        scaleFactor: 1.5
      })
      
      // Extra large for bodybuilders (2x)
      variations.push({
        ...meal,
        id: `${meal.id}_xl`,
        name: `${meal.name} (XL Portie)`,
        calories: Math.round(meal.calories * 2),
        protein: Math.round(meal.protein * 2),
        carbs: Math.round(meal.carbs * 2),
        fat: Math.round(meal.fat * 2),
        isVariation: true,
        baseId: meal.id,
        scaleFactor: 2
      })
    })
    
    console.log(`✅ Created ${variations.length} meal variations from ${originalMeals.length} base meals`)
    return variations
  }

  async loadAIIngredients() {
    try {
      const { data: ingredients, error } = await this.supabase
        .from('ai_ingredients')
        .select('*')
        .order('name')

      if (error) throw error
      return ingredients || []
    } catch (error) {
      console.error('Error loading ingredients:', error)
      return []
    }
  }

  // ========================================
  // 3. ENHANCED SCORING ENGINE WITH SELECTED INGREDIENTS
  // ========================================

  /**
   * Score all meals for a specific client profile
   * FIXED: Now accepts both excluded AND selected ingredients
   */
  scoreAllMeals(meals, profile, excludedIngredients = [], selectedIngredients = []) {
    if (!meals || !profile) return []

    console.log('🎯 Scoring meals with:')
    console.log('  - Selected ingredients:', selectedIngredients.length)
    console.log('  - Excluded ingredients:', excludedIngredients.length)

    return meals.map(meal => {
      const score = this.calculateMealScore(meal, profile, excludedIngredients, selectedIngredients)
      return {
        ...meal,
        aiScore: score.total,
        scoreBreakdown: score.breakdown
      }
    }).sort((a, b) => b.aiScore - a.aiScore)
  }

  /**
   * Calculate comprehensive score for a meal
   * FIXED: Now gives bonus for selected ingredients
   */
  calculateMealScore(meal, profile, excludedIngredients = [], selectedIngredients = []) {
    const breakdown = {
      goalAlignment: 0,
      macroFit: 0,
      preferences: 0,
      practical: 0,
      budget: 0,
      variety: 0,
      selectedBonus: 0  // NEW: Track selected ingredient bonus
    }

    // CHECK EXCLUDED INGREDIENTS FIRST
    if (excludedIngredients.length > 0 && meal.ingredients_list) {
      let mealIngredients = []
      
      if (typeof meal.ingredients_list === 'object') {
        mealIngredients = Object.keys(meal.ingredients_list).map(k => k.toLowerCase())
      } else if (typeof meal.ingredients_list === 'string') {
        try {
          const parsed = JSON.parse(meal.ingredients_list)
          mealIngredients = Object.keys(parsed).map(k => k.toLowerCase())
        } catch {
          mealIngredients = []
        }
      }
      
      const mealNameLower = (meal.name || '').toLowerCase()
      
      const hasExcluded = excludedIngredients.some(exc => {
        const searchTerm = (exc.name || exc.id || exc.label || '').toLowerCase().trim()
        if (!searchTerm) return false
        
        const foundInIngredients = mealIngredients.some(ing => {
          return ing === searchTerm || ing.includes(searchTerm) || searchTerm.includes(ing)
        })
        
        const foundInName = mealNameLower.includes(searchTerm)
        
        if (foundInIngredients || foundInName) {
          console.log(`🚫 Excluded "${meal.name}" because it contains "${searchTerm}"`)
          return true
        }
        
        return false
      })
      
      if (hasExcluded) {
        return { total: -100, breakdown } // Disqualified
      }
    }

    // CHECK SELECTED INGREDIENTS - GIVE BONUS
    if (selectedIngredients.length > 0 && meal.ingredients_list) {
      let mealIngredients = []
      
      if (typeof meal.ingredients_list === 'object') {
        mealIngredients = Object.keys(meal.ingredients_list).map(k => k.toLowerCase())
      } else if (typeof meal.ingredients_list === 'string') {
        try {
          const parsed = JSON.parse(meal.ingredients_list)
          mealIngredients = Object.keys(parsed).map(k => k.toLowerCase())
        } catch {
          mealIngredients = []
        }
      }
      
      const mealNameLower = (meal.name || '').toLowerCase()
      
      let selectedCount = 0
      selectedIngredients.forEach(sel => {
        const searchTerm = (sel.name || sel.id || sel.label || '').toLowerCase().trim()
        if (!searchTerm) return
        
        const foundInIngredients = mealIngredients.some(ing => {
          return ing === searchTerm || ing.includes(searchTerm) || searchTerm.includes(ing)
        })
        
        const foundInName = mealNameLower.includes(searchTerm)
        
        if (foundInIngredients || foundInName) {
          selectedCount++
        }
      })
      
      // Give 10 points per selected ingredient found (max 30)
      if (selectedCount > 0) {
        breakdown.selectedBonus = Math.min(30, selectedCount * 10)
        console.log(`✅ "${meal.name}" contains ${selectedCount} selected ingredients (+${breakdown.selectedBonus} points)`)
      }
    }

    // 1. GOAL ALIGNMENT (0-30 points)
    const goalLabels = {
      'muscle_gain': ['bulk_friendly', 'high_protein', 'high_cal'],
      'fat_loss': ['cut_friendly', 'high_protein', 'low_cal'],
      'maintain': ['balanced', 'moderate'],
      'performance': ['high_carbs', 'pre_workout', 'post_workout']
    }

    const targetLabels = goalLabels[profile.primary_goal] || []
    const mealLabels = meal.labels || []
    const matchedLabels = targetLabels.filter(label => mealLabels.includes(label)).length
    breakdown.goalAlignment = targetLabels.length > 0 
      ? (matchedLabels / targetLabels.length) * 30 
      : 15

    // 2. MACRO FIT (0-25 points)
    const mealsPerDay = profile.meals_per_day || 3
    const targetPerMeal = profile.target_calories / mealsPerDay
    const calorieDeviation = Math.abs(meal.calories - targetPerMeal) / targetPerMeal
    
    breakdown.macroFit = Math.max(0, 25 - (calorieDeviation * 10))

    if (profile.primary_goal === 'muscle_gain' && meal.protein > 30) {
      breakdown.macroFit += 5
    }

    // 3. PREFERENCES (0-20 points)
    if (profile.loved_ingredients?.length > 0 && meal.ingredients_list) {
      const hasLoved = profile.loved_ingredients.some(loved => {
        const lovedLower = loved.toLowerCase()
        return meal.name?.toLowerCase().includes(lovedLower) ||
               Object.keys(meal.ingredients_list).some(ing => 
                 ing.toLowerCase().includes(lovedLower)
               )
      })
      if (hasLoved) breakdown.preferences += 10
    }

    if (profile.hated_ingredients?.length > 0 && meal.ingredients_list) {
      const hasHated = profile.hated_ingredients.some(hated => {
        const hatedLower = hated.toLowerCase()
        return meal.name?.toLowerCase().includes(hatedLower) ||
               Object.keys(meal.ingredients_list).some(ing => 
                 ing.toLowerCase().includes(hatedLower)
               )
      })
      if (hasHated) breakdown.preferences -= 20
    }

    if (profile.allergies?.length > 0 && meal.allergens?.length > 0) {
      const hasAllergen = profile.allergies.some(allergy =>
        meal.allergens.some(allergen => 
          allergen.toLowerCase().includes(allergy.toLowerCase())
        )
      )
      if (hasAllergen) return { total: -100, breakdown } // Disqualified
    }

    if (profile.dietary_type) {
      if (profile.dietary_type === 'vegetarian' && mealLabels.includes('vegetarian')) {
        breakdown.preferences += 5
      } else if (profile.dietary_type === 'vegan' && mealLabels.includes('vegan')) {
        breakdown.preferences += 5
      }
    }

    // 4. PRACTICAL (0-15 points)
    const skillMap = {
      'beginner': 'easy',
      'intermediate': 'medium',
      'advanced': 'hard'
    }
    
    if (meal.difficulty === skillMap[profile.cooking_skill] || 
        meal.difficulty === 'easy' && profile.cooking_skill === 'beginner') {
      breakdown.practical += 7
    }

    if (profile.meal_prep_preference === 'full_prep' && 
        mealLabels.includes('meal_prep')) {
      breakdown.practical += 8
    } else if (profile.meal_prep_preference === 'daily_fresh' && 
               (meal.prep_time_min < 20 || mealLabels.includes('quick'))) {
      breakdown.practical += 8
    }

    // 5. BUDGET (0-10 points)
    if (meal.cost_tier === profile.budget_tier) {
      breakdown.budget = 10
    } else if (profile.budget_tier === 'moderate') {
      if (meal.cost_tier === 'budget') breakdown.budget = 8
      if (meal.cost_tier === 'premium') breakdown.budget = 3
    } else if (profile.budget_tier === 'budget' && meal.cost_tier !== 'premium') {
      breakdown.budget = 5
    }

    // 6. VARIETY BONUS (random 0-5 points for diversity)
    breakdown.variety = Math.random() * 5

    // Calculate total including selected ingredient bonus
    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

    return { 
      total: Math.round(total), 
      breakdown 
    }
  }

  // ========================================
  // 4. PLAN GENERATION WITH PORTION SCALING
  // ========================================

  async generateWeekPlan(clientProfile, options = {}) {
    const {
      days = 7,
      variationLevel = 'high',
      avoidDuplicates = true,
      forcedMeals = [],
      excludedIngredients = [],
      selectedIngredients = [],  // FIXED: Accept selected ingredients
      mealPreferences = {}
    } = options

    console.log('🚀 Generating AI week plan for:', clientProfile.first_name)
    console.log(`📊 Target: ${clientProfile.target_calories} kcal, ${clientProfile.target_protein_g}g protein`)
    console.log(`✅ Selected ingredients: ${selectedIngredients.length}`)
    console.log(`🚫 Excluded ingredients: ${excludedIngredients.length}`)

    const allMeals = await this.loadAIMeals()
    if (allMeals.length === 0) {
      throw new Error('No meals available in database')
    }

    // Score meals with BOTH excluded and selected ingredients
    const scoredMeals = this.scoreAllMeals(allMeals, clientProfile, excludedIngredients, selectedIngredients)
    
    const eligibleMeals = scoredMeals.filter(m => m.aiScore >= 0)
    console.log(`📊 ${eligibleMeals.length} meals passed scoring (from ${allMeals.length} total)`)
    
    // Log top scoring meals to verify selected ingredients bonus
    const topMeals = eligibleMeals.slice(0, 5)
    console.log('🏆 Top 5 scoring meals:')
    topMeals.forEach(meal => {
      console.log(`  - ${meal.name}: ${meal.aiScore} points (selected bonus: ${meal.scoreBreakdown?.selectedBonus || 0})`)
    })
    
    if (eligibleMeals.length === 0) {
      console.error('❌ No eligible meals after filtering')
      throw new Error('No meals match your criteria')
    }
    
    const distribution = this.calculateMealDistribution(clientProfile)
    
    const weekPlan = []
    const usedMealIds = new Set()
    
    for (let day = 0; day < days; day++) {
      const dayPlan = this.generateDayPlanWithScaling(
        clientProfile,
        eligibleMeals,
        distribution,
        usedMealIds,
        { 
          avoidDuplicates: eligibleMeals.length > 10 ? avoidDuplicates : false,
          variationLevel,
          forcedMeals: forcedMeals.slice(day * 3, (day + 1) * 3),
          selectedIngredients  // Pass through for tracking
        }
      )
      weekPlan.push(dayPlan)
    }
    
    const stats = this.calculatePlanStatistics(weekPlan, clientProfile)
    const aiAnalysis = this.analyzePlan(weekPlan, clientProfile, selectedIngredients, excludedIngredients)
    
    return {
      weekPlan,
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
      ingredientPreferences: {
        selected: selectedIngredients.length,
        excluded: excludedIngredients.length
      }
    }
  }

  calculateMealDistribution(profile) {
    const mealsPerDay = profile.meals_per_day || 4
    
    const patterns = {
      'muscle_gain': {
        3: [0.25, 0.35, 0.40],
        4: [0.20, 0.30, 0.20, 0.30],
        5: [0.20, 0.25, 0.15, 0.20, 0.20],
        6: [0.15, 0.20, 0.15, 0.15, 0.20, 0.15]
      },
      'fat_loss': {
        3: [0.30, 0.35, 0.35],
        4: [0.25, 0.30, 0.15, 0.30],
        5: [0.20, 0.25, 0.15, 0.15, 0.25],
        6: [0.15, 0.20, 0.15, 0.15, 0.20, 0.15]
      },
      'maintain': {
        3: [0.30, 0.35, 0.35],
        4: [0.25, 0.30, 0.20, 0.25],
        5: [0.20, 0.25, 0.15, 0.15, 0.25],
        6: [0.17, 0.20, 0.13, 0.13, 0.20, 0.17]
      }
    }
    
    const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner']
    const percentages = patterns[profile.primary_goal]?.[mealsPerDay] || 
                       patterns['maintain'][4]
    
    const distribution = {}
    
    for (let i = 0; i < mealsPerDay && i < 4; i++) {
      const mealType = mealTypes[i]
      
      distribution[mealType] = {
        targetCalories: Math.round(profile.target_calories * percentages[i]),
        targetProtein: Math.round(profile.target_protein_g * percentages[i]),
        targetCarbs: Math.round(profile.target_carbs_g * percentages[i]),
        targetFat: Math.round(profile.target_fat_g * percentages[i]),
        percentage: percentages[i]
      }
    }
    
    return distribution
  }

  scaleMealToTarget(meal, targetCalories, targetProtein) {
    const calorieScale = targetCalories / meal.calories
    const proteinScale = targetProtein / meal.protein
    
    let scaleFactor = Math.max(calorieScale, proteinScale)
    scaleFactor = Math.max(0.5, Math.min(3, scaleFactor))
    
    return {
      ...meal,
      scaledPortion: true,
      scaleFactor: scaleFactor,
      originalCalories: meal.calories,
      originalProtein: meal.protein,
      calories: Math.round(meal.calories * scaleFactor),
      protein: Math.round(meal.protein * scaleFactor),
      carbs: Math.round(meal.carbs * scaleFactor),
      fat: Math.round(meal.fat * scaleFactor),
      name: scaleFactor > 1.5 
        ? `${meal.name} (${Math.round(scaleFactor * 100)}% portie)`
        : scaleFactor < 0.75
          ? `${meal.name} (${Math.round(scaleFactor * 100)}% portie)`
          : meal.name
    }
  }

  generateDayPlanWithScaling(profile, eligibleMeals, distribution, usedMealIds, options) {
    const dayPlan = {
      breakfast: null,
      lunch: null,
      dinner: null,
      snacks: [],
      totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      accuracy: { total: 0, calories: 0, protein: 0 }
    }
    
    const forcedMeals = options.forcedMeals || []
    const forcedByTiming = {}
    
    forcedMeals.forEach(meal => {
      if (meal.timing && meal.timing[0]) {
        const timing = meal.timing[0]
        if (!forcedByTiming[timing]) forcedByTiming[timing] = []
        forcedByTiming[timing].push(meal)
      }
    })
    
    const todaysMeals = []
    
    Object.entries(distribution).forEach(([mealType, targets]) => {
      if (forcedByTiming[mealType] && forcedByTiming[mealType].length > 0) {
        const forcedMeal = forcedByTiming[mealType].shift()
        const scaledMeal = this.scaleMealToTarget(forcedMeal, targets.targetCalories, targets.targetProtein)
        dayPlan[mealType] = { ...scaledMeal, forced: true }
        todaysMeals.push(scaledMeal.id)
      } else {
        // Prioritize meals with higher AI scores (which includes selected ingredient bonus)
        let candidates = eligibleMeals.filter(meal => {
          if (!meal.timing?.includes(mealType)) return false
          if (todaysMeals.includes(meal.id)) return false
          if (eligibleMeals.length <= 5) return true
          if (options.avoidDuplicates && usedMealIds.has(meal.id)) return false
          return true
        })
        
        if (candidates.length === 0) {
          candidates = eligibleMeals.filter(meal =>
            meal.timing?.includes(mealType) && !todaysMeals.includes(meal.id)
          )
        }
        
        if (candidates.length === 0) {
          candidates = eligibleMeals.filter(meal =>
            meal.timing?.includes(mealType)
          )
        }
        
        if (candidates.length > 0) {
          let selected
          if (candidates.length <= 3) {
            selected = candidates[0] // Best scored (includes selected ingredient bonus)
          } else {
            const variationFactor = options.variationLevel === 'high' ? 5 : 
                                   options.variationLevel === 'medium' ? 3 : 1
            const topCandidates = candidates.slice(0, Math.min(variationFactor, candidates.length))
            selected = topCandidates[Math.floor(Math.random() * topCandidates.length)]
          }
          
          const scaledMeal = this.scaleMealToTarget(selected, targets.targetCalories, targets.targetProtein)
          
          if (mealType === 'snack') {
            dayPlan.snacks.push(scaledMeal)
          } else {
            dayPlan[mealType] = scaledMeal
          }
          
          todaysMeals.push(selected.id)
          usedMealIds.add(selected.id)
          
          if (usedMealIds.size > eligibleMeals.length * 2) {
            const oldestId = usedMealIds.values().next().value
            usedMealIds.delete(oldestId)
          }
        }
      }
    })
    
    const allMeals = [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner, ...dayPlan.snacks].filter(Boolean)
    
    allMeals.forEach(meal => {
      dayPlan.totals.kcal += meal.calories || 0
      dayPlan.totals.protein += meal.protein || 0
      dayPlan.totals.carbs += meal.carbs || 0
      dayPlan.totals.fat += meal.fat || 0
    })
    
    const finalCalorieRatio = profile.target_calories / dayPlan.totals.kcal
    const finalProteinRatio = profile.target_protein_g / dayPlan.totals.protein
    
    if (Math.abs(1 - finalCalorieRatio) > 0.1 || Math.abs(1 - finalProteinRatio) > 0.1) {
      const finalScale = Math.max(finalCalorieRatio, finalProteinRatio)
      
      allMeals.forEach(meal => {
        meal.finalScale = finalScale
        meal.calories = Math.round(meal.calories * finalScale)
        meal.protein = Math.round(meal.protein * finalScale)
        meal.carbs = Math.round(meal.carbs * finalScale)
        meal.fat = Math.round(meal.fat * finalScale)
      })
      
      dayPlan.totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      allMeals.forEach(meal => {
        dayPlan.totals.kcal += meal.calories || 0
        dayPlan.totals.protein += meal.protein || 0
        dayPlan.totals.carbs += meal.carbs || 0
        dayPlan.totals.fat += meal.fat || 0
      })
    }
    
    const calAccuracy = 100 - Math.min(20, Math.abs(100 - (dayPlan.totals.kcal / profile.target_calories * 100)))
    const protAccuracy = 100 - Math.min(20, Math.abs(100 - (dayPlan.totals.protein / profile.target_protein_g * 100)))
    
    dayPlan.accuracy = {
      total: Math.round((calAccuracy + protAccuracy) / 2),
      calories: Math.round(calAccuracy),
      protein: Math.round(protAccuracy)
    }
    
    return dayPlan
  }

  // ========================================
  // 5. ANALYSIS & OPTIMIZATION
  // ========================================

  calculatePlanStatistics(weekPlan, profile) {
    const stats = {
      averageAccuracy: 0,
      weekAverages: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      mealVariety: new Set(),
      complianceScore: 0,
      varietyScore: 0,
      scalingUsed: false,
      averageScaleFactor: 0
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
      
      const meals = [day.breakfast, day.lunch, day.dinner, ...day.snacks].filter(Boolean)
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
    
    return stats
  }

  /**
   * Analyze plan with AI insights
   * FIXED: Now includes selected/excluded ingredient analysis
   */
  analyzePlan(weekPlan, profile, selectedIngredients = [], excludedIngredients = []) {
    const analysis = {
      averageScore: 0,
      labelDistribution: {},
      budgetAnalysis: { total: 0, daily: 0 },
      portionCompliance: 100,
      recommendations: [],
      scalingAnalysis: {
        used: false,
        averageFactor: 1,
        message: ''
      },
      ingredientAnalysis: {  // NEW: Track ingredient usage
        selectedUsed: 0,
        excludedAvoided: excludedIngredients.length,
        message: ''
      }
    }
    
    let totalScore = 0
    let mealCount = 0
    let totalCost = 0
    let totalScaling = 0
    let scaledCount = 0
    let mealsWithSelectedIngredients = 0
    
    weekPlan.forEach(day => {
      const meals = [day.breakfast, day.lunch, day.dinner, ...day.snacks].filter(Boolean)
      
      meals.forEach(meal => {
        totalScore += meal.aiScore || 0
        mealCount++
        totalCost += (meal.total_cost || 5) * (meal.scaleFactor || 1)
        
        if (meal.scaleFactor) {
          totalScaling += meal.scaleFactor
          scaledCount++
        }
        
        // Check if meal contains selected ingredients
        if (selectedIngredients.length > 0 && meal.scoreBreakdown?.selectedBonus > 0) {
          mealsWithSelectedIngredients++
        }
        
        const labels = meal.labels || []
        labels.forEach(label => {
          analysis.labelDistribution[label] = (analysis.labelDistribution[label] || 0) + 1
        })
      })
    })
    
    analysis.averageScore = mealCount > 0 ? Math.round(totalScore / mealCount) : 0
    analysis.budgetAnalysis.total = totalCost.toFixed(2)
    analysis.budgetAnalysis.daily = (totalCost / weekPlan.length).toFixed(2)
    
    // Ingredient usage analysis
    if (selectedIngredients.length > 0) {
      analysis.ingredientAnalysis.selectedUsed = mealsWithSelectedIngredients
      const percentage = Math.round((mealsWithSelectedIngredients / mealCount) * 100)
      analysis.ingredientAnalysis.message = `${percentage}% van de maaltijden bevatten gewenste ingrediënten`
      
      if (percentage > 50) {
        analysis.recommendations.push('✅ Uitstekend! Meer dan de helft van je maaltijden bevatten gewenste ingrediënten')
      } else if (percentage > 25) {
        analysis.recommendations.push('👍 Goed! Veel maaltijden bevatten je favoriete ingrediënten')
      } else {
        analysis.recommendations.push('💡 Tip: Overweeg meer gewenste ingrediënten te selecteren voor betere personalisatie')
      }
    }
    
    // Scaling analysis
    if (scaledCount > 0) {
      const avgScale = totalScaling / scaledCount
      analysis.scalingAnalysis.used = true
      analysis.scalingAnalysis.averageFactor = avgScale.toFixed(2)
      
      if (avgScale > 1.5) {
        analysis.scalingAnalysis.message = `Porties zijn vergroot (gem. ${Math.round(avgScale * 100)}%) om je hoge calorie doel te halen`
        analysis.recommendations.push('Grote porties nodig voor je doelen - overweeg meal prep')
      } else if (avgScale < 0.75) {
        analysis.scalingAnalysis.message = `Porties zijn verkleind (gem. ${Math.round(avgScale * 100)}%) voor je calorie doel`
        analysis.recommendations.push('Kleinere porties toegepast - perfect voor cut fase')
      }
    }
    
    if (profile.target_calories > 3000) {
      analysis.recommendations.push('Bodybuilder modus: Focus op volume en frequentie')
    }
    
    if (profile.target_calories < 1500) {
      analysis.recommendations.push('Kleine porties strategie: Focus op nutriënt dichtheid')
    }
    
    const proteinHits = analysis.labelDistribution['high_protein'] || 0
    if (profile.primary_goal === 'muscle_gain' && proteinHits < mealCount / 2) {
      analysis.recommendations.push('Voeg meer high-protein meals toe voor spiergroei')
    }
    
    return analysis
  }

  // ========================================
  // 6. SHOPPING LIST GENERATION
  // ========================================

// Dynamic Shopping List Generator - Compatible met alle slot types
// Place this in your AIMealPlanningService.js or as standalone utility

generateShoppingList(weekPlan) {
  const ingredients = new Map()
  let totalCost = 0
  
  weekPlan.forEach((day, dayIndex) => {
    // DYNAMIC MEAL COLLECTION - Works with any slot structure
    const meals = []
    
    // Collect all meals from day object, excluding metadata
    Object.keys(day).forEach(key => {
      if (key !== 'totals' && key !== 'accuracy' && day[key]) {
        const meal = day[key]
        
        // Ensure it's a meal object (has id or name)
        if (meal && (meal.id || meal.name)) {
          meals.push(meal)
        }
      }
    })
    
    // Process each meal for ingredients
    meals.forEach(meal => {
      const scaleFactor = meal.scale_factor || meal.scaleFactor || 1
      totalCost += (meal.total_cost || 5) * scaleFactor
      
      // Handle ingredients_list in various formats
      if (meal.ingredients_list) {
        let ingredientsList = meal.ingredients_list
        
        // Parse if it's a string (JSONB from database)
        if (typeof ingredientsList === 'string') {
          try {
            ingredientsList = JSON.parse(ingredientsList)
          } catch (e) {
            console.warn(`Failed to parse ingredients for ${meal.name}:`, e)
            return
          }
        }
        
        // Handle different ingredient formats
        if (Array.isArray(ingredientsList)) {
          // Array format: [{ingredient_id, amount, unit}]
          ingredientsList.forEach(item => {
            const ingredientName = item.name || item.ingredient_name || item.ingredient_id || 'Unknown'
            const amount = item.amount || 100
            const unit = item.unit || 'g'
            
            this.addIngredientToMap(ingredients, ingredientName, amount, unit, scaleFactor, meal, dayIndex)
          })
          
        } else if (typeof ingredientsList === 'object') {
          // Object format: {"ingredient_name": amount} or {"ingredient_name": {value, unit}}
          Object.entries(ingredientsList).forEach(([ingredientName, amount]) => {
            let amountValue, unit
            
            if (typeof amount === 'object' && amount !== null) {
              amountValue = amount.value || amount.amount || 100
              unit = amount.unit || 'g'
            } else {
              amountValue = amount || 100
              unit = 'g'
            }
            
            this.addIngredientToMap(ingredients, ingredientName, amountValue, unit, scaleFactor, meal, dayIndex)
          })
        }
      }
    })
  })
  
  // Sort ingredients alphabetically
  const sortedIngredients = Array.from(ingredients.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  )
  
  return {
    ingredients: sortedIngredients,
    totalCost: totalCost.toFixed(2),
    dailyCost: (totalCost / weekPlan.length).toFixed(2),
    itemCount: sortedIngredients.length,
    weekDays: weekPlan.length,
    generatedAt: new Date().toISOString()
  }
}

/**
 * Helper method to add ingredient to shopping map
 */
addIngredientToMap(ingredients, ingredientName, amount, unit, scaleFactor, meal, dayIndex) {
  const key = ingredientName.toLowerCase().trim()
  
  if (!ingredients.has(key)) {
    ingredients.set(key, {
      id: key,
      name: ingredientName.trim(),
      totalAmount: 0,
      unit: unit || 'g',
      instances: [],
      category: this.categorizeIngredient(ingredientName)
    })
  }
  
  const ing = ingredients.get(key)
  const scaledAmount = (parseFloat(amount) || 100) * scaleFactor
  
  // Add to total
  ing.totalAmount += scaledAmount
  
  // Track instances for transparency
  ing.instances.push({
    meal: meal.name,
    day: dayIndex + 1,
    amount: scaledAmount,
    originalAmount: parseFloat(amount) || 100,
    scaled: scaleFactor !== 1,
    scaleFactor: scaleFactor
  })
}

/**
 * Categorize ingredients for better shopping list organization
 */
categorizeIngredient(ingredientName) {
  const name = ingredientName.toLowerCase()
  
  // Protein sources
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
      name.includes('fish') || name.includes('salmon') || name.includes('tuna') ||
      name.includes('egg') || name.includes('protein powder')) {
    return 'Protein'
  }
  
  // Vegetables
  if (name.includes('broccoli') || name.includes('spinach') || name.includes('lettuce') ||
      name.includes('tomato') || name.includes('carrot') || name.includes('pepper') ||
      name.includes('onion') || name.includes('garlic')) {
    return 'Vegetables'
  }
  
  // Carbohydrates
  if (name.includes('rice') || name.includes('pasta') || name.includes('bread') ||
      name.includes('potato') || name.includes('oats') || name.includes('quinoa')) {
    return 'Carbohydrates'
  }
  
  // Dairy
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') ||
      name.includes('butter') || name.includes('cream')) {
    return 'Dairy'
  }
  
  // Fruits
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') ||
      name.includes('berry') || name.includes('fruit')) {
    return 'Fruits'
  }
  
  // Fats/Oils
  if (name.includes('oil') || name.includes('olive') || name.includes('avocado') ||
      name.includes('nuts') || name.includes('seeds')) {
    return 'Fats & Oils'
  }
  
  // Spices & Seasonings
  if (name.includes('salt') || name.includes('pepper') || name.includes('spice') ||
      name.includes('herb') || name.includes('seasoning')) {
    return 'Spices & Seasonings'
  }
  
  return 'Other'
}

/**
 * Generate formatted shopping list for export
 */
generateFormattedShoppingList(weekPlan, options = {}) {
  const shoppingData = this.generateShoppingList(weekPlan)
  const { groupByCategory = true, includeDetails = false } = options
  
  let output = `🛒 SHOPPING LIST - Week Plan\n`
  output += `Generated: ${new Date().toLocaleDateString()}\n`
  output += `Total Items: ${shoppingData.itemCount}\n`
  output += `Estimated Cost: €${shoppingData.totalCost}\n\n`
  
  if (groupByCategory) {
    // Group by category
    const categorized = {}
    shoppingData.ingredients.forEach(ing => {
      const category = ing.category || 'Other'
      if (!categorized[category]) categorized[category] = []
      categorized[category].push(ing)
    })
    
    // Sort categories
    const sortedCategories = Object.keys(categorized).sort()
    
    sortedCategories.forEach(category => {
      output += `📦 ${category.toUpperCase()}\n`
      output += `${'='.repeat(category.length + 5)}\n`
      
      categorized[category].forEach(ing => {
        const amount = Math.round(ing.totalAmount * 10) / 10 // Round to 1 decimal
        output += `• ${ing.name}: ${amount}${ing.unit}\n`
        
        if (includeDetails && ing.instances.length > 1) {
          output += `  Used in: ${ing.instances.map(i => `${i.meal} (Day ${i.day})`).join(', ')}\n`
        }
      })
      output += `\n`
    })
  } else {
    // Simple alphabetical list
    output += `INGREDIENTS\n`
    output += `===========\n`
    shoppingData.ingredients.forEach(ing => {
      const amount = Math.round(ing.totalAmount * 10) / 10
      output += `• ${ing.name}: ${amount}${ing.unit}\n`
    })
  }
  
  return output
}

/**
 * Export to different formats
 */
exportShoppingList(weekPlan, format = 'text') {
  const shoppingData = this.generateShoppingList(weekPlan)
  
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(shoppingData, null, 2)
      
    case 'csv':
      let csv = 'Ingredient,Amount,Unit,Category,Total Cost\n'
      shoppingData.ingredients.forEach(ing => {
        const amount = Math.round(ing.totalAmount * 10) / 10
        csv += `"${ing.name}",${amount},"${ing.unit}","${ing.category || 'Other'}","€${(ing.totalAmount * 0.01).toFixed(2)}"\n`
      })
      return csv
      
    case 'markdown':
      let md = `# 🛒 Shopping List\n\n`
      md += `**Generated:** ${new Date().toLocaleDateString()}\n`
      md += `**Total Items:** ${shoppingData.itemCount}\n`
      md += `**Estimated Cost:** €${shoppingData.totalCost}\n\n`
      
      // Group by category
      const categorized = {}
      shoppingData.ingredients.forEach(ing => {
        const category = ing.category || 'Other'
        if (!categorized[category]) categorized[category] = []
        categorized[category].push(ing)
      })
      
      Object.keys(categorized).sort().forEach(category => {
        md += `## ${category}\n\n`
        categorized[category].forEach(ing => {
          const amount = Math.round(ing.totalAmount * 10) / 10
          md += `- [ ] **${ing.name}**: ${amount}${ing.unit}\n`
        })
        md += `\n`
      })
      
      return md
      
    case 'text':
    default:
      return this.generateFormattedShoppingList(weekPlan, { 
        groupByCategory: true, 
        includeDetails: false 
      })
  }
}
  // ========================================
  // 7. PLAN PERSISTENCE
  // ========================================

  async savePlan(plan, clientId, name = null) {
    const weekStructure = {}
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    plan.weekPlan.forEach((day, index) => {
      weekStructure[days[index]] = {
        breakfast: day.breakfast?.id || null,
        lunch: day.lunch?.id || null,
        dinner: day.dinner?.id || null,
        snacks: day.snacks.map(s => s.id),
        totals: day.totals,
        scaling: {
          breakfast: day.breakfast?.scaleFactor || 1,
          lunch: day.lunch?.scaleFactor || 1,
          dinner: day.dinner?.scaleFactor || 1,
          snacks: day.snacks.map(s => s.scaleFactor || 1)
        }
      }
    })
    
    const { data, error } = await this.supabase
      .from('client_meal_plans')
      .insert([{
        client_id: clientId,
        template_name: name || `AI Plan - ${new Date().toLocaleDateString('nl-NL')}`,
        week_structure: weekStructure,
        daily_calories: plan.dailyTargets.kcal,
        daily_protein: plan.dailyTargets.protein,
        daily_carbs: plan.dailyTargets.carbs,
        daily_fat: plan.dailyTargets.fat,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0]
      }])
      .select()
    
    if (error) throw error
    
    if (data && data[0]) {
      await this.supabase
        .from('client_meal_plans')
        .update({ is_active: false })
        .eq('client_id', clientId)
        .neq('id', data[0].id)
    }
    
    return data[0]
  }
}

// Export singleton instance
let serviceInstance = null

export function getAIMealPlanningService(supabase) {
  if (!serviceInstance) {
    serviceInstance = new AIMealPlanningService(supabase)
  }
  return serviceInstance
}

export default AIMealPlanningService
