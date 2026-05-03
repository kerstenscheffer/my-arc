// src/modules/ai-meal-generator/pdf-generator/sections/DayPage.js
// DAY PAGE COMPONENT - With dynamic timing support

import { 
  getTimingsForDay, 
  getDayTypeLabel, 
  getDayTypeColor,
  MEAL_TYPE_LABELS,
  DAY_NAMES 
} from '../config/timingConfig'

/**
 * Format ingredients list (compact version for 6-meal grid)
 * Shows max 4 ingredients + "more" indicator
 */
function formatIngredientsCompact(ingredients) {
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
 * Get next photo from rotation
 * @param {Array} mealPhotos - Array of photo URLs
 * @param {number} index - Current photo index
 * @returns {string} Photo URL
 */
function getPhotoAtIndex(mealPhotos, index) {
  return mealPhotos[index % mealPhotos.length]
}

/**
 * Generate single day page HTML
 * 
 * @param {string} day - Day name (e.g. 'monday')
 * @param {Object} dayData - Day meal data
 * @param {number} dayIndex - Day index (0-6)
 * @param {string} trainingTime - Client's training time
 * @param {number} pageNumber - Page number for footer
 * @param {Array} mealPhotos - Array of meal photo URLs
 * @param {number} photoStartIndex - Starting index for photo rotation
 * @returns {string} HTML for single day page
 */
export function generateDayPage(day, dayData, dayIndex, trainingTime, pageNumber, mealPhotos, photoStartIndex = 0) {
  if (!dayData) return ''
  
  // Get timing configuration for this day
  const mealTimings = getTimingsForDay(dayIndex, trainingTime)
  const dayTypeLabel = getDayTypeLabel(dayIndex)
  const dayTypeColor = getDayTypeColor(dayIndex)
  
  // Collect all meals (up to 6)
  const meals = []
  let photoIndex = photoStartIndex
  
  // Breakfast
  if (dayData.breakfast) {
    meals.push({
      type: 'breakfast',
      data: dayData.breakfast,
      photo: getPhotoAtIndex(mealPhotos, photoIndex++),
      timing: mealTimings.breakfast
    })
  }
  
  // Snack1 (morning snack)
  if (dayData.snacks && dayData.snacks[0]) {
    meals.push({
      type: 'snacks',
      data: dayData.snacks[0],
      photo: getPhotoAtIndex(mealPhotos, photoIndex++),
      timing: mealTimings.snack1
    })
  }
  
  // Dinner (moved to midday on training days)
  if (dayData.dinner) {
    meals.push({
      type: 'dinner',
      data: dayData.dinner,
      photo: getPhotoAtIndex(mealPhotos, photoIndex++),
      timing: mealTimings.dinner
    })
  }
  
  // Lunch (pre-workout on training days)
  if (dayData.lunch) {
    meals.push({
      type: 'lunch',
      data: dayData.lunch,
      photo: getPhotoAtIndex(mealPhotos, photoIndex++),
      timing: mealTimings.lunch
    })
  }
  
  // Snack2 (pre-workout boost on training days)
  if (dayData.snacks && dayData.snacks[1]) {
    meals.push({
      type: 'snacks',
      data: dayData.snacks[1],
      photo: getPhotoAtIndex(mealPhotos, photoIndex++),
      timing: mealTimings.snack2
    })
  }
  
  // Snack4 (post-workout on training days / evening snack on rest days)
  if (dayData.snacks && dayData.snacks[2]) {
    meals.push({
      type: 'snacks',
      data: dayData.snacks[2],
      photo: getPhotoAtIndex(mealPhotos, photoIndex++),
      timing: mealTimings.snack4
    })
  }
  
  // Snack3 (before bed)
  if (dayData.snacks && dayData.snacks[3]) {
    meals.push({
      type: 'snacks',
      data: dayData.snacks[3],
      photo: getPhotoAtIndex(mealPhotos, photoIndex++),
      timing: mealTimings.snack3
    })
  }
  
  return `
    <!-- ${DAY_NAMES[day].toUpperCase()} - ${dayTypeLabel} -->
    <div class="page">
      <div class="day-page">
        <div class="page-header">
          <span class="page-title">Dag ${dayIndex + 1}</span>
          <span class="page-num">Pagina ${pageNumber}</span>
        </div>
        
        <h2 class="day-header-large">
          <span class="gold">${DAY_NAMES[day].toUpperCase()}</span>
          <span class="day-type-badge" style="background: ${dayTypeColor};">${dayTypeLabel}</span>
        </h2>
        
        <div class="day-totals">
          <div class="day-total">
            <div class="day-total-value">${dayData.totals?.kcal || 0}</div>
            <div class="day-total-label">Kcal</div>
          </div>
          <div class="day-total">
            <div class="day-total-value">${dayData.totals?.protein || 0}g</div>
            <div class="day-total-label">Eiwit</div>
          </div>
          <div class="day-total">
            <div class="day-total-value">${dayData.totals?.carbs || 0}g</div>
            <div class="day-total-label">Koolh</div>
          </div>
          <div class="day-total">
            <div class="day-total-value">${dayData.totals?.fat || 0}g</div>
            <div class="day-total-label">Vet</div>
          </div>
        </div>
        
        <div class="meals-grid">
          ${meals.map(({ type, data, photo, timing }) => `
            <div class="meal-card">
              <div class="meal-photo" style="background-image: url('${photo}');">
                <div class="meal-photo-overlay">
                  <div class="meal-type">${timing.icon} ${MEAL_TYPE_LABELS[type]} • ${timing.time}</div>
                </div>
              </div>
              
              <div class="meal-content">
                <div class="meal-function">${timing.function}</div>
                
                <div class="meal-header">
                  <div class="meal-name">${data.meal_name || 'Geen naam'}</div>
                  <div class="meal-calories">${data.calories || 0}</div>
                </div>
                
                ${data.ingredients && data.ingredients.length > 0 ? formatIngredientsCompact(data.ingredients) : ''}
                
                <div class="meal-macros">
                  <span class="macro-badge">${data.protein || 0}g E</span>
                  <span class="macro-badge">${data.carbs || 0}g K</span>
                  <span class="macro-badge">${data.fat || 0}g V</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `
}

/**
 * Generate all day pages
 * @param {Object} weekStructure - Week structure with all days
 * @param {string} trainingTime - Client's training time
 * @param {number} startPageNumber - Starting page number
 * @returns {string} HTML for all day pages
 */
export function generateAllDayPages(weekStructure, trainingTime, startPageNumber = 8) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  // Meal photos rotation
  const mealPhotos = [
    'https://i.ibb.co/YBXKM0Zz/1.png',
    'https://i.ibb.co/FLrFV8Vq/2.png',
    'https://i.ibb.co/PvDhbSjV/3.png',
    'https://i.ibb.co/4gYjtpbY/12.png',
    'https://i.ibb.co/KzNkDpvk/11.png',
    'https://i.ibb.co/zHsdJS5y/10.png',
    'https://i.ibb.co/jvmybhpK/9.png',
    'https://i.ibb.co/Lh0Ph1vV/8.png'
  ]
  
  let photoIndex = 0
  
  return days.map((day, index) => {
    const dayData = weekStructure[day]
    const pageHtml = generateDayPage(
      day, 
      dayData, 
      index, 
      trainingTime, 
      startPageNumber + index,
      mealPhotos,
      photoIndex
    )
    
    // Update photo index for next day (6 meals per day)
    photoIndex += 6
    
    return pageHtml
  }).join('')
}

export default { generateDayPage, generateAllDayPages }
