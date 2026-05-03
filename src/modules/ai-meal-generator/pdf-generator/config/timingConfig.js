// src/modules/ai-meal-generator/pdf-generator/config/timingConfig.js
// DYNAMIC MEAL TIMING CONFIGURATION
// Version: 1.0 - Training/Rest Day Support

/**
 * Calculate meal timings for TRAINING DAY
 * Meals are strategically timed around the training session
 * 
 * @param {string} trainingTime - Client's training time (HH:MM format, e.g. "20:00")
 * @returns {Object} Meal timings with time, function, and icon
 * 
 * Example for 20:00 training:
 * - 08:00 Breakfast
 * - 11:30 Snack (protein top-up)
 * - 14:00 Lunch (large meal, early)
 * - 17:00 Pre-workout meal (3h before training)
 * - 19:00 Pre-workout snack (1h before training)
 * - [20:00 TRAINING]
 * - 22:00 Post-workout snack (2h after training)
 * - 23:00 Before bed
 */
export function getTrainingDayTimings(trainingTime = '16:00') {
  const hour = parseInt(trainingTime.split(':')[0])
  
  // Calculate dynamic times based on training hour
  const preWorkoutMealTime = hour - 3  // 3 hours before
  const preWorkoutSnackTime = hour - 1  // 1 hour before
  const postWorkoutTime = hour + 2      // 2 hours after
  
  return {
    breakfast: { 
      time: '08:00', 
      function: 'METABOLISME KICKSTART', 
      icon: '🌅',
      description: 'Start je dag met energie'
    },
    snack1: { 
      time: '11:30', 
      function: 'EIWIT TOP-UP', 
      icon: '🔋',
      description: 'Eiwit tussen maaltijden'
    },
    dinner: { 
      time: '14:00', 
      function: 'GROTE MAALTIJD (VROEG)', 
      icon: '🍽️',
      description: 'Hoofdmaaltijd vroeg op de dag'
    },
    lunch: { 
      time: `${preWorkoutMealTime}:00`, 
      function: 'PRE-WORKOUT FUEL', 
      icon: '🏋️',
      description: `${3} uur voor training - glycogeen loading`
    },
    snack2: { 
      time: `${preWorkoutSnackTime}:00`, 
      function: 'PRE-WORKOUT BOOST', 
      icon: '⚡',
      description: `${1} uur voor training - snelle energie`
    },
    snack4: {
      time: `${postWorkoutTime}:00`,
      function: 'POST-WORKOUT SNACK',
      icon: '💪',
      description: `${2} uur na training - herstel`
    },
    snack3: { 
      time: '23:00', 
      function: 'VOOR BED', 
      icon: '🌙',
      description: 'Caseïne voor nachtelijk herstel'
    }
  }
}

/**
 * Calculate meal timings for REST DAY
 * Regular meal distribution without training considerations
 * 
 * @returns {Object} Meal timings with time, function, and icon
 */
export function getRestDayTimings() {
  return {
    breakfast: { 
      time: '08:00', 
      function: 'METABOLISME KICKSTART', 
      icon: '🌅',
      description: 'Start je dag met energie'
    },
    snack1: { 
      time: '11:30', 
      function: 'EIWIT TOP-UP', 
      icon: '🔋',
      description: 'Eiwit tussen maaltijden'
    },
    lunch: { 
      time: '14:00', 
      function: 'MIDDAG MAALTIJD', 
      icon: '🍽️',
      description: 'Hoofdmaaltijd middag'
    },
    snack2: { 
      time: '17:00', 
      function: 'TUSSENDOOR', 
      icon: '🥤',
      description: 'Energie boost namiddag'
    },
    dinner: { 
      time: '19:00', 
      function: 'AVONDMAALTIJD', 
      icon: '🌙',
      description: 'Avondmaaltijd'
    },
    snack4: {
      time: '21:00',
      function: 'AVOND SNACK',
      icon: '🍪',
      description: 'Kleine snack'
    },
    snack3: { 
      time: '22:00', 
      function: 'VOOR BED', 
      icon: '😴',
      description: 'Caseïne voor nachtelijk herstel'
    }
  }
}

/**
 * Get meal timings for specific day index
 * Alternates between training and rest days
 * 
 * @param {number} dayIndex - Day index (0-6, where 0 = Monday)
 * @param {string} trainingTime - Client's training time
 * @returns {Object} Meal timings for this specific day
 * 
 * Pattern:
 * - Day 0,2,4,6 (Mon/Wed/Fri/Sun) = Training days
 * - Day 1,3,5 (Tue/Thu/Sat) = Rest days
 */
export function getTimingsForDay(dayIndex, trainingTime = '16:00') {
  const isTrainingDay = dayIndex % 2 === 0
  
  return isTrainingDay 
    ? getTrainingDayTimings(trainingTime)
    : getRestDayTimings()
}

/**
 * Get day type label
 * @param {number} dayIndex - Day index (0-6)
 * @returns {string} "TRAININGSDAG" or "RUSTDAG"
 */
export function getDayTypeLabel(dayIndex) {
  const isTrainingDay = dayIndex % 2 === 0
  return isTrainingDay ? 'TRAININGSDAG' : 'RUSTDAG'
}

/**
 * Get day type color
 * @param {number} dayIndex - Day index (0-6)
 * @returns {string} Color for day type badge
 */
export function getDayTypeColor(dayIndex) {
  const isTrainingDay = dayIndex % 2 === 0
  return isTrainingDay ? '#10b981' : '#3b82f6'
}

/**
 * Meal type labels (Dutch)
 */
export const MEAL_TYPE_LABELS = {
  breakfast: 'ONTBIJT',
  lunch: 'LUNCH',
  dinner: 'DINER',
  snack1: 'SNACK',
  snack2: 'SNACK',
  snack3: 'SNACK',
  snack4: 'SNACK',
  snacks: 'SNACK'
}

/**
 * Day names (Dutch)
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
 * Day names array (for iteration)
 */
export const DAY_NAMES_ARRAY = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]

export default {
  getTrainingDayTimings,
  getRestDayTimings,
  getTimingsForDay,
  getDayTypeLabel,
  getDayTypeColor,
  MEAL_TYPE_LABELS,
  DAY_NAMES,
  DAY_NAMES_ARRAY
}
