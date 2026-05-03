// src/modules/ai-meal-generator/HTMLHelpers.js
// MY ARC MEAL PLAN PDF - HELPER FUNCTIONS
// Photo rotation, ingredient formatting, calculations

/**
 * HELPER: Meal Photo Rotation
 * Cycles through 8 meal photos for variety
 */
export class PhotoRotator {
  constructor() {
    this.photos = [
      'https://i.ibb.co/YBXKM0Zz/1.png',
      'https://i.ibb.co/FLrFV8Vq/2.png',
      'https://i.ibb.co/PvDhbSjV/3.png',
      'https://i.ibb.co/4gYjtpbY/12.png',
      'https://i.ibb.co/KzNkDpvk/11.png',
      'https://i.ibb.co/zHsdJS5y/10.png',
      'https://i.ibb.co/jvmybhpK/9.png',
      'https://i.ibb.co/Lh0Ph1vV/8.png'
    ]
    this.index = 0
  }
  
  getNext() {
    const photo = this.photos[this.index % this.photos.length]
    this.index++
    return photo
  }
  
  reset() {
    this.index = 0
  }
}

/**
 * HELPER: Format ingredients list (COMPACT for 6-meal grid)
 * Shows max 4 ingredients + "more" indicator
 */
export const formatIngredientsCompact = (ingredients) => {
  if (!ingredients || ingredients.length === 0) return ''
  
  const limitedIngredients = ingredients.slice(0, 4)
  const hasMore = ingredients.length > 4
  
  return `
    <div class="ingredients-list">
      ${limitedIngredients.map(ing => {
        const amount = Math.round(ing.amount_scaled || ing.amount || 0)
        return `
          <div class="ingredient-row">
            <span class="ing-name">${ing.name}</span>
            <span class="ing-amount">${amount}${ing.unit || 'g'}</span>
          </div>
        `
      }).join('')}
      ${hasMore ? `<div class="ingredient-more">+${ingredients.length - 4} meer</div>` : ''}
    </div>
  `
}

/**
 * HELPER: Calculate week cost
 */
export const calculateWeekCost = (enrichedPlan) => {
  let totalWeekCost = 0
  
  Object.entries(enrichedPlan.week_structure_enriched || {}).forEach(([day, dayData]) => {
    if (!dayData) return
    
    const meals = [
      dayData.breakfast, 
      dayData.lunch, 
      dayData.dinner, 
      ...(dayData.snacks || [])
    ]
    
    meals.forEach(meal => {
      if (meal?.total_cost) {
        totalWeekCost += meal.total_cost * (meal.scale_factor || 1)
      }
    })
  })
  
  return Math.round(totalWeekCost)
}

/**
 * HELPER: Day name translations
 */
export const DAY_NAMES = {
  monday: 'Maandag',
  tuesday: 'Dinsdag', 
  wednesday: 'Woensdag',
  thursday: 'Donderdag',
  friday: 'Vrijdag',
  saturday: 'Zaterdag',
  sunday: 'Zondag'
}

/**
 * HELPER: Meal type translations
 */
export const MEAL_TYPES = {
  breakfast: 'ONTBIJT',
  lunch: 'LUNCH',
  dinner: 'DINER',
  snacks: 'SNACK'
}

/**
 * HELPER: Get timing display
 * NEW: Reads from meal object (set by TemplateLibrary)
 * Fallback to slot-based defaults if no timing in meal
 */
export const getTimingDisplay = (meal, slot) => {
  console.log(`🕐 getTimingDisplay called for slot: ${slot}`, {
    hasMeal: !!meal,
    mealName: meal?.meal_name || meal?.name,
    hasTiming: !!meal?.timing,
    hasFunction: !!meal?.function,
    hasIcon: !!meal?.icon,
    timingValue: meal?.timing,
    functionValue: meal?.function,
    iconValue: meal?.icon
  })
  
  // Priority 1: Use timing from meal object (from template)
  if (meal?.timing) {
    console.log(`  ✅ Using timing from meal object: ${meal.timing}`)
    return {
      time: meal.timing,
      function: meal.function || 'MAALTIJD',
      icon: meal.icon || '🍽️'
    }
  }
  
  // Priority 2: Fallback to slot-based defaults
  console.log(`  ⚠️ No timing in meal, using fallback for slot: ${slot}`)
  const defaults = {
    breakfast: { time: '08:00', function: 'METABOLISME KICKSTART', icon: '🌅' },
    lunch: { time: '13:00', function: 'MIDDAG MAALTIJD', icon: '🍽️' },
    dinner: { time: '19:00', function: 'AVONDMAALTIJD', icon: '🌙' },
    snacks: { time: '16:00', function: 'TUSSENDOOR', icon: '⚡' }
  }
  
  const result = defaults[slot] || { time: '12:00', function: 'MAALTIJD', icon: '🍽️' }
  console.log(`  📍 Fallback result:`, result)
  return result
}

/**
 * HELPER: Build meal card data
 * Extracts timing from meal object or uses defaults
 */
export const buildMealCardData = (dayData, photoRotator) => {
  console.log('🏗️ buildMealCardData called')
  const meals = []
  
  // Add meals in order they appear in dayData
  if (dayData.breakfast) {
    console.log('  Adding breakfast...')
    meals.push({
      type: 'breakfast',
      data: dayData.breakfast,
      photo: photoRotator.getNext(),
      timing: getTimingDisplay(dayData.breakfast, 'breakfast')
    })
  }
  
  if (dayData.lunch) {
    console.log('  Adding lunch...')
    meals.push({
      type: 'lunch',
      data: dayData.lunch,
      photo: photoRotator.getNext(),
      timing: getTimingDisplay(dayData.lunch, 'lunch')
    })
  }
  
  if (dayData.dinner) {
    console.log('  Adding dinner...')
    meals.push({
      type: 'dinner',
      data: dayData.dinner,
      photo: photoRotator.getNext(),
      timing: getTimingDisplay(dayData.dinner, 'dinner')
    })
  }
  
  // Add all snacks
  if (dayData.snacks && Array.isArray(dayData.snacks)) {
    console.log(`  Adding ${dayData.snacks.length} snacks...`)
    dayData.snacks.forEach((snack, idx) => {
      if (snack) {
        console.log(`    Snack ${idx + 1}:`, {
          name: snack.meal_name || snack.name,
          hasTiming: !!snack.timing
        })
        meals.push({
          type: 'snacks',
          data: snack,
          photo: photoRotator.getNext(),
          timing: getTimingDisplay(snack, 'snacks')
        })
      }
    })
  }
  
  console.log(`  ✅ Built ${meals.length} total meals`)
  return meals
}

export default {
  PhotoRotator,
  formatIngredientsCompact,
  calculateWeekCost,
  DAY_NAMES,
  MEAL_TYPES,
  getTimingDisplay,
  buildMealCardData
}
