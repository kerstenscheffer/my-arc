// src/modules/shopping/utils/shoppingHelpers.js

/**
 * Group shopping list items by category
 * @param {Array} items - Shopping list items
 * @returns {Object} Items grouped by category
 */
export const getGroupedItems = (items) => {
  if (!items || !Array.isArray(items)) return {}
  
  const filtered = items.filter(item => item && item.name && item.category)
  
  return filtered.reduce((acc, item) => {
    const category = item.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {})
}

/**
 * Calculate shopping statistics
 * @param {Array} items - Shopping list items
 * @param {Object} checkedItems - Checked items state
 * @returns {Object} Statistics object
 */
export const calculateShoppingStats = (items, checkedItems) => {
  const totalItems = items?.length || 0
  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0
  const remainingCost = items?.reduce((sum, item) => 
    !checkedItems[item.id] ? sum + (item.estimatedCost || 0) : sum, 0
  ) || 0
  
  return {
    totalItems,
    checkedCount,
    progress,
    remainingCost
  }
}

/**
 * Simplify shopping list for database storage
 * @param {Object} shoppingList - Full shopping list object
 * @returns {Object} Simplified list for database
 */
export const simplifyShoppingList = (shoppingList) => {
  if (!shoppingList) return null
  
  return {
    items: shoppingList.items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      totalAmount: item.totalAmount,
      displayAmount: item.displayAmount,
      unit: item.unit,
      estimatedCost: item.estimatedCost
    })),
    totalCost: shoppingList.totalCost,
    itemCount: shoppingList.itemCount,
    generatedAt: shoppingList.generatedAt || new Date().toISOString()
  }
}
