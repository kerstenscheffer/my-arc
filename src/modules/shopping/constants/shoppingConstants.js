// src/modules/shopping/constants/shoppingConstants.js
// Shopping list categorization with smart ingredient mapping

export const CATEGORY_CONFIG = {
  protein: {
    label: 'Eiwitten',
    emoji: '🥩',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    keywords: [
      'kip', 'chicken', 'kipfilet', 'kippendij',
      'rund', 'beef', 'gehakt', 'biefstuk',
      'varken', 'pork', 'spek', 'bacon',
      'vis', 'fish', 'zalm', 'salmon', 'tonijn', 'tuna',
      'ei', 'egg', 'eieren',
      'whey', 'protein', 'proteine',
      'tofu', 'tempeh',
      'garnalen', 'shrimp'
    ]
  },
  
  carbs: {
    label: 'Koolhydraten',
    emoji: '🌾',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    keywords: [
      'rijst', 'rice', 'basmati', 'zilvervlies',
      'pasta', 'spaghetti', 'penne',
      'aardappel', 'potato', 'pataat',
      'brood', 'bread', 'volkoren',
      'haver', 'oats', 'havermout',
      'couscous', 'quinoa',
      'wrap', 'tortilla',
      'muesli', 'granola'
    ]
  },
  
  vegetables: {
    label: 'Groenten',
    emoji: '🥬',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
    keywords: [
      'broccoli', 'spinazie', 'spinach',
      'sla', 'lettuce', 'ijsbergsla',
      'tomaat', 'tomato', 'cherry',
      'paprika', 'pepper', 'peper',
      'ui', 'onion', 'look',
      'wortel', 'carrot', 'peen',
      'komkommer', 'cucumber',
      'courgette', 'zucchini',
      'champignon', 'mushroom',
      'kool', 'cabbage',
      'aubergine', 'eggplant'
    ]
  },
  
  fruit: {
    label: 'Fruit',
    emoji: '🍎',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    keywords: [
      'appel', 'apple',
      'banaan', 'banana',
      'bes', 'berry', 'bessen', 'blauwe', 'aardbeien', 'frambozen',
      'sinaasappel', 'orange',
      'citroen', 'lemon', 'limoen', 'lime',
      'mango', 'ananas', 'pineapple',
      'druif', 'grape',
      'peer', 'pear',
      'kiwi', 'meloen', 'watermeloen'
    ]
  },
  
  dairy: {
    label: 'Zuivel',
    emoji: '🥛',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    keywords: [
      'melk', 'milk', 'halfvol', 'vol',
      'yoghurt', 'yogurt', 'griekse',
      'kaas', 'cheese', 'mozzarella', 'cheddar',
      'kwark', 'quark',
      'boter', 'butter',
      'room', 'cream', 'slagroom'
    ]
  },
  
  fats: {
    label: 'Vetten',
    emoji: '🥑',
    color: '#84cc16',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    keywords: [
      'olie', 'oil', 'olijf', 'olive', 'zonnebloem',
      'avocado',
      'noten', 'nuts', 'amandel', 'walnoot', 'cashew',
      'pindakaas', 'peanut butter',
      'boter', 'butter'
    ]
  },
  
  sauces: {
    label: 'Sauzen & Kruiden',
    emoji: '🧂',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    keywords: [
      'saus', 'sauce', 'bbq', 'teriyaki', 'soja',
      'ketchup', 'mayonaise', 'mayo', 'mosterd',
      'pesto', 'tapenade',
      'zout', 'salt', 'peper', 'pepper',
      'kruiden', 'herbs', 'basilicum', 'oregano',
      'knoflook', 'garlic',
      'azijn', 'vinegar'
    ]
  },
  
  other: {
    label: 'Overig',
    emoji: '📦',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    keywords: []
  }
}

/**
 * Categorize ingredient based on name
 */
export function categorizeIngredient(ingredientName) {
  if (!ingredientName || ingredientName === 'Unknown Ingredient') {
    return 'other'
  }
  
  const nameLower = ingredientName.toLowerCase().trim()
  
  // Check each category's keywords
  for (const [categoryKey, config] of Object.entries(CATEGORY_CONFIG)) {
    if (categoryKey === 'other') continue
    
    const hasMatch = config.keywords.some(keyword => 
      nameLower.includes(keyword.toLowerCase())
    )
    
    if (hasMatch) {
      return categoryKey
    }
  }
  
  return 'other'
}

/**
 * Format amount with proper units (kg for >1000g)
 */
export function formatAmount(amount, unit = 'g') {
  if (!amount) return '0g'
  
  const roundedAmount = Math.round(amount * 10) / 10
  
  // Convert grams to kg if > 1000
  if (unit === 'g' || unit === 'gram') {
    if (roundedAmount >= 1000) {
      const kg = roundedAmount / 1000
      return `${Math.round(kg * 10) / 10}kg`
    }
    return `${roundedAmount}g`
  }
  
  // Convert ml to liters if > 1000
  if (unit === 'ml') {
    if (roundedAmount >= 1000) {
      const liters = roundedAmount / 1000
      return `${Math.round(liters * 10) / 10}L`
    }
    return `${roundedAmount}ml`
  }
  
  // Return as-is for other units
  return `${roundedAmount}${unit}`
}

/**
 * Get ingredient display name (fallback for Unknown)
 */
export function getIngredientDisplayName(ingredient) {
  if (!ingredient) return 'Onbekend Product'
  
  // Check if it has a proper name
  if (ingredient.name && 
      ingredient.name !== 'Unknown Ingredient' && 
      ingredient.name.trim() !== '') {
    return ingredient.name
  }
  
  // Try name_en (English name)
  if (ingredient.name_en && 
      ingredient.name_en !== 'Unknown Ingredient' && 
      ingredient.name_en.trim() !== '') {
    return ingredient.name_en
  }
  
  // Try ingredient_name field
  if (ingredient.ingredient_name && 
      ingredient.ingredient_name.trim() !== '') {
    return ingredient.ingredient_name
  }
  
  // Try to extract from ingredient_id
  if (ingredient.ingredient_id && typeof ingredient.ingredient_id === 'string') {
    // Skip if it's a UUID (contains dashes in UUID format)
    if (!ingredient.ingredient_id.match(/^[a-f0-9]{8}-[a-f0-9]{4}-/)) {
      const idParts = ingredient.ingredient_id.split('_')
      if (idParts.length > 1) {
        return idParts.slice(1).join(' ')
          .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }
    }
  }
  
  // Try id field as last resort
  if (ingredient.id && typeof ingredient.id === 'string') {
    // Skip if it's a UUID
    if (!ingredient.id.match(/^[a-f0-9]{8}-[a-f0-9]{4}-/)) {
      return ingredient.id.replace(/_/g, ' ')
        .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }
  
  // If we have category info, use that with amount
  if (ingredient.category && ingredient.totalAmount) {
    return `${ingredient.category} (${Math.round(ingredient.totalAmount)}g)`
  }
  
  return 'Onbekend Product'
}
