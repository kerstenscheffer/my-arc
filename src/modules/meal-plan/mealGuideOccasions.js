// src/modules/meal-plan/mealGuideOccasions.js
// Gedeelde gelegenheden voor de meal-guide Gelegenheden-hub (issue 19ee0bf7).
export const OCCASIONS = [
  { id: 'verjaardag',     label: 'Verjaardag',    emoji: '🎂' },
  { id: 'uiteten',        label: 'Uit eten',      emoji: '🍽️' },
  { id: 'ontbijt_buffet', label: 'Ontbijtbuffet', emoji: '🥐' },
  { id: 'lunch_buffet',   label: 'Lunchbuffet',   emoji: '🥗' },
  { id: 'mcdonalds',      label: 'McDonald\'s',   emoji: '🍔' },
  { id: 'snackbar',       label: 'Snackbar',      emoji: '🍟' },
  { id: 'festival',       label: 'Festival',      emoji: '🎪' },
]

export const occasionLabel = (id) => OCCASIONS.find(o => o.id === id)?.label || id
