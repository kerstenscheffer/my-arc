// src/modules/meal-plan/components/wizard/utils/wizardData.js
// Static data voor Meal Setup Wizard - NO JSX

/**
 * COACH PICKS - Kersten's favoriete ingrediënten
 * UUIDs komen uit ai_ingredients table
 */
export const COACH_PICKS = {
  proteins: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Kipfilet',
      name_en: 'Chicken Breast',
      reason: 'Mager, veelzijdig en betaalbaar'
    },
    {
      id: '33333333-3333-3333-3333-333333333333', // Placeholder - check actual whey UUID
      name: 'Whey Protein',
      name_en: 'Whey Protein',
      reason: 'Snelle eiwit opname, perfect post-workout'
    },
    {
      id: '44444444-4444-4444-4444-444444444444', // Placeholder - check actual egg UUID
      name: 'Eieren',
      name_en: 'Eggs',
      reason: 'Complete eiwitbron met alle aminozuren'
    }
  ],
  carbs: [
    {
      id: '66666666-6666-6666-6666-666666666666',
      name: 'Havermout',
      name_en: 'Oats',
      reason: 'Langzame energie, hoog in vezels'
    },
    {
      id: '11111111-1111-1111-1111-111111111116',
      name: 'Rijst',
      name_en: 'Rice',
      reason: 'Schone koolhydraten, makkelijk te schalen'
    },
    {
      id: '55555555-5555-5555-5555-555555555555', // Placeholder - check actual brown bread UUID
      name: 'Bruin Brood',
      name_en: 'Brown Bread',
      reason: 'Volkoren, ideaal voor breakfast'
    }
  ]
}

/**
 * CALORIE RANGES - Suggesties op basis van dagelijkse intake
 */
export const CALORIE_RANGES = [
  {
    id: 'low',
    label: 'Cut / Afvallen',
    min: 1500,
    max: 2000,
    meals: 3,
    snacks: 1,
    description: '3 maaltijden + 1 snack per dag',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  },
  {
    id: 'medium',
    label: 'Maintain / Onderhoud',
    min: 2000,
    max: 2500,
    meals: 4,
    snacks: 2,
    description: '4 maaltijden + 2 snacks per dag',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  {
    id: 'high',
    label: 'Bulk / Massa',
    min: 2500,
    max: 3500,
    meals: 5,
    snacks: 2,
    description: '5 maaltijden + 2 snacks per dag',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
  }
]

/**
 * MEAL STRUCTURE OPTIONS
 * Verschillende dagindelingen op basis van client doelen
 */
export const MEAL_STRUCTURE_OPTIONS = [
  {
    id: 'cut',
    meals: 3,
    snacks: 1,
    totalMoments: 4,
    calorieRange: '1500-2000',
    label: '3 Maaltijden + 1 Snack',
    subtitle: 'Ideaal voor afvallen',
    distribution: {
      breakfast: 25,  // Percentage van dagelijkse calorieën
      lunch: 30,
      dinner: 35,
      snack1: 10
    },
    color: '#3b82f6',
    icon: '🍽️'
  },
  {
    id: 'maintain',
    meals: 4,
    snacks: 2,
    totalMoments: 6,
    calorieRange: '2000-2500',
    label: '4 Maaltijden + 2 Snacks',
    subtitle: 'Perfect voor onderhoud',
    distribution: {
      breakfast: 20,
      snack1: 10,
      lunch: 25,
      snack2: 10,
      dinner: 30,
      evening: 5
    },
    color: '#10b981',
    icon: '🍽️🍽️'
  },
  {
    id: 'bulk',
    meals: 5,
    snacks: 2,
    totalMoments: 7,
    calorieRange: '2500-3500',
    label: '5 Maaltijden + 2 Snacks',
    subtitle: 'Maximale massa opbouw',
    distribution: {
      breakfast: 18,
      snack1: 8,
      lunch: 22,
      snack2: 8,
      preworkout: 12,
      dinner: 25,
      evening: 7
    },
    color: '#f97316',
    icon: '🍽️🍽️🍽️'
  }
]

/**
 * WIZARD SLIDES CONFIG
 */
export const WIZARD_SLIDES = [
  {
    id: 1,
    title: 'Welkom bij je Meal Plan Setup',
    icon: '👋',
    coachMessage: "Laten we samen jouw perfecte weekplan maken!"
  },
  {
    id: 2,
    title: 'Jouw Macro Doelen',
    icon: '🎯',
    coachMessage: "Op basis van je doelen heb ik deze targets voor je berekend"
  },
  {
    id: 3,
    title: 'Dagelijkse Structuur',
    icon: '📅',
    coachMessage: "Hoeveel eet-momenten wil je per dag?"
  },
  {
    id: 4,
    title: 'Eiwit Bronnen',
    icon: '🥩',
    coachMessage: "Kies 3 eiwit sources die je dagelijks wilt eten"
  },
  {
    id: 5,
    title: 'Koolhydraat Bronnen',
    icon: '🍚',
    coachMessage: "Kies 3 complexe koolhydraten die makkelijk te schalen zijn"
  },
  {
    id: 6,
    title: 'Meal Prep Planning',
    icon: '🍱',
    coachMessage: "Laten we kijken hoe jij meal prep kunt inzetten"
  }
]

/**
 * COACH INFO
 */
export const COACH_INFO = {
  name: 'Kersten',
  photoUrl: 'https://cdn.shopify.com/s/files/1/0862/1237/8954/files/MIND_512_x_512_px_3.png?v=1758299988',
  role: 'Personal Trainer & Nutrition Coach'
}

/**
 * MEAL PREP TYPES
 */
export const MEAL_PREP_TYPES = {
  weekly: {
    id: 'weekly',
    title: 'Weekly Meal Prep',
    subtitle: 'Kook 1x per week, eet hele week',
    icon: '📦',
    benefits: [
      '1x koken = hele week klaar',
      'Maximale tijdsbesparing',
      'Perfecte portie controle',
      'Altijd gezonde keuze beschikbaar'
    ],
    defaultPortions: 7,
    defaultCookDay: 'sunday',
    color: '#10b981'
  },
  daily: {
    id: 'daily',
    title: 'Daily Meal Prep',
    subtitle: 'Kleine preps voor dagelijks',
    icon: '🍽️',
    benefits: [
      'Vers elke dag',
      'Meer variatie mogelijk',
      'Kleinere kook sessies',
      'Minder vriezer ruimte nodig'
    ],
    defaultPortions: 2,
    color: '#3b82f6'
  }
}

/**
 * VALIDATION RULES
 */
export const VALIDATION = {
  minProteins: 3,
  maxProteins: 3,
  minCarbs: 3,
  maxCarbs: 3,
  minWeeklyPrepMeals: 1,
  maxWeeklyPrepMeals: 5,
  minDailyPrepMeals: 1,
  maxDailyPrepMeals: 3
}

/**
 * COOK DAYS OPTIONS
 */
export const COOK_DAYS = [
  { value: 'sunday', label: 'Zondag', emoji: '☀️' },
  { value: 'monday', label: 'Maandag', emoji: '📅' },
  { value: 'tuesday', label: 'Dinsdag', emoji: '📅' },
  { value: 'wednesday', label: 'Woensdag', emoji: '📅' },
  { value: 'thursday', label: 'Donderdag', emoji: '📅' },
  { value: 'friday', label: 'Vrijdag', emoji: '📅' },
  { value: 'saturday', label: 'Zaterdag', emoji: '🎉' }
]
