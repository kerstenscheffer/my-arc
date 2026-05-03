// src/modules/ai-meal-generator/tabs/plan-analyzer/ConflictChecker.js
// Pure utility — checks meals against client allergens, diet, hated foods
// v1.2 — meal_name fallback added

const ALLERGEN_KEYWORDS = {
  lactose: ['kwark', 'whey', 'yoghurt', 'yogurt', 'skyr', 'kaas', 'melk', 'room', 'boter', 'cottage', 'mozzarella', 'cheddar', 'gouda', 'ricotta', 'protein pudding', 'frozen yogurt', 'carbonara', 'zuivel', 'crème', 'roomkaas', 'mascarpone'],
  gluten: ['brood', 'pasta', 'tarwe', 'couscous', 'crackers', 'wraps', 'havermout', 'pannenkoek', 'tortilla', 'volkoren', 'bloem', 'pita', 'naan', 'croissant'],
  noten: ['amandel', 'walnoot', 'cashew', 'hazelnoot', 'noten', 'pecan', 'pistache', 'macadamia'],
  pinda: ['pinda', 'pindakaas'],
  soja: ['soja', 'tofu', 'tempeh', 'edamame', 'sojasaus'],
  vis: ['zalm', 'tonijn', 'kabeljauw', 'vis', 'haring', 'makreel', 'sardine', 'garnaal', 'garnalen', 'tilapia', 'forel'],
  schaaldieren: ['garnaal', 'garnalen', 'kreeft', 'krab', 'mosselen', 'scampi'],
  ei: ['eieren', 'ei', 'omelet', 'scrambled', 'eierdooier', 'eiwit'],
  steenvruchten: ['perzik', 'nectarine', 'pruim', 'kers', 'abrikoos', 'mango']
}

const DIET_BLOCKED = {
  vegetarisch: ['kip', 'kipfilet', 'kalkoen', 'gehakt', 'shoarma', 'pulled chicken', 'zalm', 'tonijn', 'vis', 'rundvlees', 'biefstuk', 'varkensvlees', 'spek', 'bacon', 'ham', 'garnaal', 'garnalen'],
  veganistisch: ['kip', 'kipfilet', 'kalkoen', 'gehakt', 'shoarma', 'pulled chicken', 'zalm', 'tonijn', 'vis', 'rundvlees', 'biefstuk', 'eieren', 'ei', 'kwark', 'whey', 'kaas', 'melk', 'yoghurt', 'skyr', 'cottage', 'honing', 'boter', 'room'],
  halal: ['varken', 'spek', 'bacon', 'ham', 'varkensvlees', 'chorizo', 'salami'],
  pescotarisch: ['kip', 'kipfilet', 'kalkoen', 'gehakt', 'shoarma', 'pulled chicken', 'rundvlees', 'biefstuk', 'varkensvlees', 'spek', 'bacon', 'ham']
}

// v1.2: Haal maaltijdnaam op uit meerdere mogelijke velden
function getMealName(meal) {
  return meal?.name || meal?.meal_name || meal?.title || ''
}

export function checkMealConflicts(meal, clientData) {
  if (!meal || !clientData) {
    console.warn('⚠️ ConflictChecker | geen meal of clientData', { meal, clientData })
    return []
  }

  const conflicts = []
  const mealName = getMealName(meal).toLowerCase()
  const mealAllergens = meal.allergens || []

  const ingredientNames = []
  if (meal.ingredients_list && typeof meal.ingredients_list === 'object' && !Array.isArray(meal.ingredients_list)) {
    Object.keys(meal.ingredients_list).forEach(name => ingredientNames.push(name.toLowerCase()))
  }
  ingredientNames.push(mealName)

  const allText = ingredientNames.join(' ')

  // ── CHECK ALLERGENS ──
  const selectedAllergens = clientData.allergens?.selected_allergens || []

  if (selectedAllergens.length === 0) {
    console.log('ℹ️ ConflictChecker | geen allergeën ingesteld voor client')
  }

  selectedAllergens.forEach(allergen => {
    const keywords = ALLERGEN_KEYWORDS[allergen.toLowerCase()] || [allergen.toLowerCase()]
    const found = keywords.filter(kw => allText.includes(kw.toLowerCase()))
    if (found.length > 0) {
      console.warn(`🚨 ConflictChecker | allergen conflict [${allergen}] in meal "${getMealName(meal)}"`, { found, allText })
      conflicts.push({
        type: 'allergen',
        severity: 'high',
        message: `Bevat ${allergen}: ${found.slice(0, 2).join(', ')}`,
        allergen,
        matchedKeywords: found
      })
    }
  })

  // ── CHECK DIET ──
  const diet = clientData.allergens?.diet_preference || clientData.dietPreference || 'geen'
  if (diet !== 'geen') {
    const blocked = DIET_BLOCKED[diet] || []
    const found = blocked.filter(kw => allText.includes(kw.toLowerCase()))
    if (found.length > 0) {
      console.warn(`🚨 ConflictChecker | dieet conflict [${diet}] in meal "${getMealName(meal)}"`, { found })
      conflicts.push({
        type: 'diet',
        severity: 'high',
        message: `Niet ${diet}: bevat ${found.slice(0, 2).join(', ')}`,
        diet,
        matchedKeywords: found
      })
    }
  }

  // ── CHECK HATED FOODS ──
  const hatedFoods = clientData.hatedFoods || ''
  if (hatedFoods) {
    const hatedList = (typeof hatedFoods === 'string' ? hatedFoods.split(',') : hatedFoods)
      .map(f => f.trim().toLowerCase())
      .filter(Boolean)

    const found = hatedList.filter(hated => allText.includes(hated))
    if (found.length > 0) {
      console.warn(`😤 ConflictChecker | hated food conflict in meal "${getMealName(meal)}"`, { found })
      conflicts.push({
        type: 'hated',
        severity: 'medium',
        message: `Client haat: ${found.slice(0, 2).join(', ')}`,
        matchedKeywords: found
      })
    }
  }

  if (conflicts.length === 0) {
    console.log(`✅ ConflictChecker | geen conflicts voor "${getMealName(meal) || '(naamloos)'}"`)
  }

  return conflicts
}

export function buildConflictClientData(clientRecord, nutritionPrefs) {
  const result = {
    allergens: nutritionPrefs?.allergens || {
      selected_allergens: clientRecord?.allergies
        ? (typeof clientRecord.allergies === 'string' ? clientRecord.allergies.split(',').map(s => s.trim()) : clientRecord.allergies)
        : [],
      diet_preference: clientRecord?.dietary_type || 'geen'
    },
    dietPreference: nutritionPrefs?.allergens?.diet_preference || clientRecord?.dietary_type || 'geen',
    hatedFoods: clientRecord?.hated_foods || ''
  }

  console.log('🔨 ConflictChecker | buildConflictClientData', {
    allergeën: result.allergens?.selected_allergens,
    dieet: result.dietPreference,
    hatedFoods: result.hatedFoods || '(geen)'
  })

  return result
}

export function checkDayConflicts(dayMeals, clientData) {
  const results = {}
  Object.entries(dayMeals).forEach(([slot, meal]) => {
    if (meal) {
      const conflicts = checkMealConflicts(meal, clientData)
      if (conflicts.length > 0) {
        results[slot] = conflicts
      }
    }
  })
  return results
}
