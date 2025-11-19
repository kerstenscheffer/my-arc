// src/modules/plan-wizard/PlanWizardService.js
// Complete calculation engine voor Plan Wizard

class PlanWizardService {
  constructor(databaseService) {
    this.db = databaseService
  }

  // ============================================
  // JOUW HARDE REGELS
  // ============================================
  
  PROTEIN_RULES = {
    high_muscle: 2.2,        // Hoog spier percentage
    regular: 2.0             // Regulier
  }

  CALORIE_ADJUSTMENTS = {
    aggressive_cut: -500,
    body_recomp: -200,
    maintain: 0,
    lean_bulk: 300,
    aggressive_bulk: 500
  }

  ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderate: 1.55,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  }

  FAT_PER_KG = 1.1  // 1.1g vet per kg lichaamsgewicht

  // ============================================
  // DATA VALIDATION
  // ============================================

  validateClientData(client) {
    const required = ['height', 'current_weight', 'age', 'gender', 'activity_level', 'primary_goal']
    const missing = []
    
    required.forEach(field => {
      if (!client[field]) missing.push(field)
    })
    
    return {
      isValid: missing.length === 0,
      missing: missing,
      completion: ((required.length - missing.length) / required.length * 100).toFixed(0)
    }
  }

  // ============================================
  // PLAN DETERMINATION
  // ============================================

  determinePlanType(client, quizAnswers) {
    const { current_weight, target_weight, primary_goal } = client
    
    // Als geen target weight, gebruik primary goal
    if (!target_weight) {
      if (primary_goal === 'muscle_gain') return 'lean_bulk'
      if (primary_goal === 'fat_loss') return 'aggressive_cut'
      return 'maintain'
    }
    
    const weightDiff = current_weight - target_weight
    
    // Weight-based determination
    if (weightDiff > 5) {
      return 'aggressive_cut'  // Moet > 5kg afvallen
    } else if (weightDiff > 0 && weightDiff <= 5) {
      return 'body_recomp'  // Lichte cut met recomp
    } else if (weightDiff < 0 && Math.abs(weightDiff) <= 3) {
      return 'lean_bulk'  // Controlled bulk
    } else if (weightDiff < -3) {
      return 'aggressive_bulk'  // Needs mass
    }
    
    return 'maintain'
  }

  getPlanRationale(planType, client) {
    const { current_weight, target_weight, primary_goal } = client
    const diff = target_weight ? (target_weight - current_weight).toFixed(1) : 0
    
    const rationales = {
      aggressive_cut: `
        **PLAN: Aggressive Cut**
        
        **Waarom:**
        - Current: ${current_weight}kg → Target: ${target_weight}kg (${Math.abs(diff)}kg verschil)
        - Doel: ${this.translateGoal(primary_goal)}
        - Significant gewichtsverlies nodig
        
        **Focus:**
        ✓ Hoog eiwit behouden (spiermassa behoud)
        ✓ -500 kcal deficit voor effectief vetlies
        ✓ Krachttraining essentieel
        ✓ Progressie monitoren: weekllijks wegen
      `,
      body_recomp: `
        **PLAN: Body Recomp**
        
        **Waarom:**
        - Current: ${current_weight}kg → Target: ${target_weight}kg (${Math.abs(diff)}kg verschil)
        - Doel: ${this.translateGoal(primary_goal)}
        - Perfect voor vet verliezen + spier opbouwen
        
        **Focus:**
        ✓ Licht deficit (-200 kcal)
        ✓ Hoog eiwit voor spiergroei
        ✓ Progressieve overload in gym
        ✓ Geduld: recomp duurt langer maar beste resultaat
      `,
      lean_bulk: `
        **PLAN: Lean Bulk**
        
        **Waarom:**
        - Current: ${current_weight}kg → Target: ${target_weight}kg (+${diff}kg)
        - Doel: ${this.translateGoal(primary_goal)}
        - Gecontroleerde massa opbouw
        
        **Focus:**
        ✓ +300 kcal surplus (0.2-0.5kg/week gain)
        ✓ Hoog eiwit (2.0-2.2g/kg)
        ✓ Volume in training verhogen
        ✓ Minimaal vetaanzet, maximaal spier
      `,
      aggressive_bulk: `
        **PLAN: Aggressive Bulk**
        
        **Waarom:**
        - Current: ${current_weight}kg → Target: ${target_weight}kg (+${diff}kg)
        - Doel: ${this.translateGoal(primary_goal)}
        - Snelle massa opbouw gewenst
        
        **Focus:**
        ✓ +500 kcal surplus (0.5-1kg/week gain)
        ✓ Hoog eiwit + high carbs
        ✓ Heavy compound lifts
        ✓ Accepteer enige vetaanzet voor snelle groei
      `,
      maintain: `
        **PLAN: Maintain & Build**
        
        **Waarom:**
        - Current: ${current_weight}kg (perfect gewicht)
        - Doel: ${this.translateGoal(primary_goal)}
        - Focus op kracht en compositie
        
        **Focus:**
        ✓ Onderhoud calorieën
        ✓ Eiwit hoog voor recovery
        ✓ Performance gains in gym
        ✓ Slow recomp mogelijk
      `
    }
    
    return rationales[planType] || rationales.maintain
  }

  translateGoal(goal) {
    const translations = {
      muscle_gain: 'Spiermassa opbouwen',
      fat_loss: 'Vet verliezen',
      general_fitness: 'Algemene fitness',
      maintain: 'Behouden & verbeteren'
    }
    return translations[goal] || goal
  }

  // ============================================
  // MACRO CALCULATOR
  // ============================================

  calculateMacros(client, planType, quizAnswers) {
    const { gender, current_weight, age, height, activity_level } = client
    const bodyComp = quizAnswers?.body_comp || 'average'
    
    // 1. BMR (Mifflin-St Jeor)
    let bmr
    if (gender === 'male') {
      bmr = 10 * current_weight + 6.25 * height - 5 * age + 5
    } else {
      bmr = 10 * current_weight + 6.25 * height - 5 * age - 161
    }
    
    // 2. TDEE
    const activityMult = this.ACTIVITY_MULTIPLIERS[activity_level] || 1.55
    const tdee = Math.round(bmr * activityMult)
    
    // 3. Target Calories
    const calorieAdj = this.CALORIE_ADJUSTMENTS[planType] || 0
    const targetCalories = tdee + calorieAdj
    
    // 4. VET EERST - 1.1g per kg (JOUW REGEL)
    const fat = Math.round(current_weight * this.FAT_PER_KG)
    
    // 5. EIWIT - obv body compositie
    let proteinPerKg
    if (bodyComp === 'lean') {
      // Lean = hoog spierpercentage → 2.2g/kg
      proteinPerKg = this.PROTEIN_RULES.high_muscle
    } else {
      // Average/Higher BF = 2.0g/kg
      proteinPerKg = this.PROTEIN_RULES.regular
    }
    const protein = Math.round(current_weight * proteinPerKg)
    
    // 6. CARBS - rest van calorieën
    const proteinCals = protein * 4
    const fatCals = fat * 9
    const carbCals = targetCalories - proteinCals - fatCals
    const carbs = Math.round(carbCals / 4)
    
    return {
      calories: targetCalories,
      protein: protein,
      carbs: carbs,
      fat: fat,
      breakdown: {
        bmr: Math.round(bmr),
        tdee: tdee,
        adjustment: calorieAdj,
        proteinPerKg: proteinPerKg,
        fatPerKg: this.FAT_PER_KG,
        proteinCals: proteinCals,
        carbCals: carbCals,
        fatCals: fatCals
      }
    }
  }

  getMacroRationale(macros, client, planType) {
    return `
**MACRO BREAKDOWN:**
━━━━━━━━━━━━━━━━━━━━━━━━

**Totaal:** ${macros.calories} kcal/dag

**Macros:**
- 🥩 Eiwit: ${macros.protein}g (${(macros.breakdown.proteinPerKg).toFixed(1)}g/kg)
- 🍚 Koolhydraten: ${macros.carbs}g
- 🥑 Vetten: ${macros.fat}g (${(macros.breakdown.fatPerKg).toFixed(1)}g/kg)

**Berekening:**
1. BMR (basis metabolisme): ${macros.breakdown.bmr} kcal
2. TDEE (${client.activity_level}): ${macros.breakdown.tdee} kcal
3. Plan adjustment (${planType}): ${macros.breakdown.adjustment > 0 ? '+' : ''}${macros.breakdown.adjustment} kcal
4. **→ Target: ${macros.calories} kcal**

**Volgorde:**
1. Vet eerst: ${macros.fat}g (1.1g/kg × ${client.current_weight}kg)
2. Eiwit: ${macros.protein}g (${macros.breakdown.proteinPerKg.toFixed(1)}g/kg)
3. Carbs: ${macros.carbs}g (rest van calorieën)

**Percentages:**
- Eiwit: ${Math.round(macros.breakdown.proteinCals / macros.calories * 100)}%
- Koolhydraten: ${Math.round(macros.breakdown.carbCals / macros.calories * 100)}%
- Vetten: ${Math.round(macros.breakdown.fatCals / macros.calories * 100)}%
    `.trim()
  }

  // ============================================
  // FOCUS AREAS
  // ============================================

  determineFocusAreas(client) {
    const focus = []
    
    // Check assignments
    if (!client.assigned_schema_id) {
      focus.push({
        priority: 'HIGH',
        area: 'Workout Schema',
        action: 'Wijs een workout schema toe',
        icon: '🏋️'
      })
    }
    
    // Check meal plan (via separate query needed)
    focus.push({
      priority: 'MEDIUM',
      area: 'Meal Plan',
      action: 'Controleer of meal plan actief is',
      icon: '🍽️'
    })
    
    // Check macro's
    if (!client.target_calories || !client.target_protein) {
      focus.push({
        priority: 'HIGH',
        area: 'Macro Targets',
        action: 'Macro doelen instellen (gebeurt nu!)',
        icon: '📊'
      })
    }
    
    // Check progress tracking
    if (!client.start_weight) {
      focus.push({
        priority: 'LOW',
        area: 'Start Weight',
        action: 'Start gewicht vastleggen',
        icon: '⚖️'
      })
    }
    
    return focus
  }

  // ============================================
  // WHATSAPP EXPORT
  // ============================================

  generateWhatsAppMessage(client, planType, macros, focusAreas) {
    const { first_name, current_weight, target_weight } = client
    
    return `
🎯 **JOUW PERSOONLIJKE PLAN**
Hey ${first_name}! 

**PLAN TYPE:** ${planType.toUpperCase()}
Current: ${current_weight}kg → Target: ${target_weight || '?'}kg

**DAGELIJKSE MACRO'S:**
━━━━━━━━━━━━━━━━━━━━
🔥 Calorieën: ${macros.calories} kcal
🥩 Eiwit: ${macros.protein}g
🍚 Koolhydraten: ${macros.carbs}g
🥑 Vetten: ${macros.fat}g

**FOCUS PUNTEN:**
${focusAreas.map(f => `${f.icon} ${f.action}`).join('\n')}

**VOLGENDE STAPPEN:**
1️⃣ Check je workout schema in de app
2️⃣ Bekijk je meal plan
3️⃣ Start met tracking vandaag nog

Let's get it! 💪
    `.trim()
  }

  // ============================================
  // DATABASE OPERATIONS
  // ============================================

  async saveClientPlan(clientId, macros, planType) {
    try {
      const { data, error } = await this.db.supabase
        .from('clients')
        .update({
          target_calories: macros.calories,
          target_protein: macros.protein,
          target_carbs: macros.carbs,
          target_fat: macros.fat,
          coach_notes: `Plan Wizard - ${planType} - ${new Date().toLocaleDateString()}`,
          profile_updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Client plan saved:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Save plan failed:', error)
      return { success: false, error: error.message }
    }
  }

  async checkExistingAssignments(clientId) {
    try {
      // Check workout
      const { data: client } = await this.db.supabase
        .from('clients')
        .select('assigned_schema_id')
        .eq('id', clientId)
        .single()
      
      // Check meal plan
      const { data: mealPlan } = await this.db.supabase
        .from('client_meal_plans')
        .select('id, template_name, is_active')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle()
      
      return {
        hasWorkout: !!client?.assigned_schema_id,
        hasMealPlan: !!mealPlan,
        mealPlanName: mealPlan?.template_name
      }
    } catch (error) {
      console.error('❌ Check assignments failed:', error)
      return { hasWorkout: false, hasMealPlan: false }
    }
  }
}

export default PlanWizardService
