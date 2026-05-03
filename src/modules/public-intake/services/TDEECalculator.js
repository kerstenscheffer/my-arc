// src/modules/public-intake/services/TDEECalculator.js
// Mifflin-St Jeor + activity multiplier + goal adjustment

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,        // Kantoorwerk, weinig beweging
  lightly_active: 1.375,  // 1-3x per week licht
  moderately_active: 1.55, // 3-5x per week
  very_active: 1.725,     // 6-7x per week
  extra_active: 1.9       // Fysiek beroep + training
}

const GOAL_ADJUSTMENTS = {
  fat_loss: -500,         // Deficit
  muscle_gain: 300,       // Surplus
  maintain: 0,
  general_fitness: -200,  // Mild deficit
  recomp: 0               // Maintenance
}

export function calculateTDEE({ gender, age, height, weight, activityLevel }) {
  if (!gender || !age || !height || !weight) return null

  // Mifflin-St Jeor
  let bmr
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderately_active
  return Math.round(bmr * multiplier)
}

export function calculateTargetCalories({ tdee, goal }) {
  if (!tdee) return null
  const adjustment = GOAL_ADJUSTMENTS[goal] || 0
  return Math.round(tdee + adjustment)
}

export function calculateMacros({ targetCalories, weight, goal }) {
  if (!targetCalories || !weight) return null

  // Protein: 1.8-2.2g per kg depending on goal
  const proteinPerKg = goal === 'fat_loss' ? 2.2 : goal === 'muscle_gain' ? 2.0 : 1.8
  const protein = Math.round(weight * proteinPerKg)

  // Fat: 25-30% of calories
  const fatCalories = targetCalories * 0.27
  const fat = Math.round(fatCalories / 9)

  // Carbs: remainder
  const carbCalories = targetCalories - (protein * 4) - (fat * 9)
  const carbs = Math.round(carbCalories / 4)

  return { protein, fat, carbs }
}

export default { calculateTDEE, calculateTargetCalories, calculateMacros }
