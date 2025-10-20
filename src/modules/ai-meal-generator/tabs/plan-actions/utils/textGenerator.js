// src/modules/ai-meal-generator/tabs/plan-actions/utils/textGenerator.js
// Utility functions for generating text exports

/**
 * Generate complete text version of meal plan
 */
export function generateTextVersion(generatedPlan, exportOptions) {
  if (!generatedPlan?.weekPlan) return 'Geen plan beschikbaar'
  
  let text = `╔════════════════════════════════════════╗\n`
  text += `║     MY ARC - AI MEAL PLAN              ║\n`
  text += `╚════════════════════════════════════════╝\n\n`
  
  // Header info
  text += `Client: ${generatedPlan.clientProfile?.first_name || ''} ${generatedPlan.clientProfile?.last_name || ''}\n`
  text += `Gegenereerd: ${new Date().toLocaleDateString('nl-NL')}\n`
  text += `Doel: ${formatGoal(generatedPlan.clientProfile?.primary_goal)}\n`
  
  if (exportOptions.includeMacros) {
    text += `\nDAGELIJKSE TARGETS:\n`
    text += `├─ Calorieën: ${generatedPlan.dailyTargets?.kcal || 0} kcal\n`
    text += `├─ Eiwitten: ${generatedPlan.dailyTargets?.protein || 0}g\n`
    text += `├─ Koolhydraten: ${generatedPlan.dailyTargets?.carbs || 0}g\n`
    text += `└─ Vetten: ${generatedPlan.dailyTargets?.fat || 0}g\n`
  }
  
  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  
  // Days
  const dayNames = [
    'MAANDAG', 'DINSDAG', 'WOENSDAG', 'DONDERDAG',
    'VRIJDAG', 'ZATERDAG', 'ZONDAG'
  ]
  
  generatedPlan.weekPlan.forEach((day, index) => {
    text += `📅 ${dayNames[index]}\n`
    text += `─────────────────────────────────────────\n`
    
    // Breakfast
    if (day.breakfast) {
      text += formatMealSlot('🌅 ONTBIJT', day.breakfast, exportOptions.includeMacros)
    }
    
    // Lunch
    if (day.lunch) {
      text += formatMealSlot('🥗 LUNCH', day.lunch, exportOptions.includeMacros)
    }
    
    // Dinner
    if (day.dinner) {
      text += formatMealSlot('🍽️ DINER', day.dinner, exportOptions.includeMacros)
    }
    
    // Snacks
    day.snacks?.forEach((snack, i) => {
      if (snack) {
        text += formatMealSlot(`🥜 SNACK ${i + 1}`, snack, exportOptions.includeMacros)
      }
    })
    
    // Day totals
    if (exportOptions.includeMacros && day.totals) {
      text += `\n📊 DAG TOTAAL:\n`
      text += `   ${Math.round(day.totals.kcal || 0)} kcal | `
      text += `${Math.round(day.totals.protein || 0)}g eiwit | `
      text += `${Math.round(day.totals.carbs || 0)}g koolh. | `
      text += `${Math.round(day.totals.fat || 0)}g vet\n`
      
      if (day.accuracy) {
        text += `   Nauwkeurigheid: ${day.accuracy.total}%\n`
      }
    }
    
    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  })
  
  // Shopping list
  if (exportOptions.includeShoppingList && generatedPlan.stats?.shoppingList) {
    text += generateShoppingListText(generatedPlan.stats.shoppingList)
  }
  
  // Footer
  text += `\n╔════════════════════════════════════════╗\n`
  text += `║  Powered by MY ARC AI Meal Generator   ║\n`
  text += `╚════════════════════════════════════════╝\n`
  
  return text
}

/**
 * Format a single meal slot
 */
function formatMealSlot(label, meal, includeMacros) {
  let text = `\n${label}\n`
  text += `   📍 ${meal.name}\n`
  
  if (includeMacros) {
    text += `   └─ ${Math.round(meal.calories || 0)} kcal | `
    text += `${Math.round(meal.protein || 0)}g P | `
    text += `${Math.round(meal.carbs || 0)}g C | `
    text += `${Math.round(meal.fat || 0)}g F`
    
    if (meal.scaleFactor && meal.scaleFactor !== 1) {
      text += ` (${Math.round(meal.scaleFactor * 100)}% portie)`
    }
    
    if (meal.aiScore) {
      text += ` [AI: ${meal.aiScore}]`
    }
    
    text += '\n'
  }
  
  return text
}

/**
 * Generate shopping list text
 */
export function generateShoppingListText(shoppingList) {
  if (!shoppingList) return ''
  
  let text = `🛒 BOODSCHAPPENLIJST\n`
  text += `─────────────────────────────────────────\n\n`
  
  if (shoppingList.ingredients && Array.isArray(shoppingList.ingredients)) {
    // Group by category if available
    const grouped = {}
    
    shoppingList.ingredients.forEach(item => {
      const category = item.category || 'Overig'
      if (!grouped[category]) grouped[category] = []
      grouped[category].push(item)
    })
    
    Object.entries(grouped).forEach(([category, items]) => {
      text += `📦 ${category.toUpperCase()}\n`
      items.sort((a, b) => a.name.localeCompare(b.name))
        .forEach(item => {
          text += `   • ${item.name}: ${Math.round(item.totalAmount || item.amount || 0)}`
          text += `${item.unit || 'g'}\n`
        })
      text += '\n'
    })
    
    // Cost summary
    if (shoppingList.totalCost) {
      text += `💰 KOSTEN OVERZICHT\n`
      text += `   Totaal: €${shoppingList.totalCost}\n`
      text += `   Per dag: €${shoppingList.dailyCost || (shoppingList.totalCost / 7).toFixed(2)}\n`
    }
  } else if (typeof shoppingList === 'object') {
    // Fallback for object format
    Object.entries(shoppingList)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([ingredient, data]) => {
        if (ingredient !== 'totalCost' && ingredient !== 'dailyCost') {
          text += `   • ${ingredient}: ${Math.round(data.amount || 0)}${data.unit || 'g'}\n`
        }
      })
  }
  
  return text
}

/**
 * Format goal for display
 */
function formatGoal(goal) {
  const goals = {
    'muscle_gain': '💪 Spieropbouw',
    'fat_loss': '🔥 Vetverlies',
    'maintain': '⚖️ Onderhoud',
    'performance': '🏃 Prestatie'
  }
  return goals[goal] || goal || 'Algemeen'
}

/**
 * Generate CSV export (for Excel)
 */
export function generateCSV(generatedPlan) {
  if (!generatedPlan?.weekPlan) return ''
  
  let csv = 'Dag,Maaltijd,Naam,Calorieën,Eiwitten,Koolhydraten,Vetten\n'
  
  const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
  
  generatedPlan.weekPlan.forEach((day, dayIndex) => {
    const dayName = dayNames[dayIndex]
    
    if (day.breakfast) {
      csv += `${dayName},Ontbijt,"${day.breakfast.name}",${Math.round(day.breakfast.calories)},`
      csv += `${Math.round(day.breakfast.protein)},${Math.round(day.breakfast.carbs)},${Math.round(day.breakfast.fat)}\n`
    }
    
    if (day.lunch) {
      csv += `${dayName},Lunch,"${day.lunch.name}",${Math.round(day.lunch.calories)},`
      csv += `${Math.round(day.lunch.protein)},${Math.round(day.lunch.carbs)},${Math.round(day.lunch.fat)}\n`
    }
    
    if (day.dinner) {
      csv += `${dayName},Diner,"${day.dinner.name}",${Math.round(day.dinner.calories)},`
      csv += `${Math.round(day.dinner.protein)},${Math.round(day.dinner.carbs)},${Math.round(day.dinner.fat)}\n`
    }
    
    day.snacks?.forEach((snack, i) => {
      if (snack) {
        csv += `${dayName},Snack ${i + 1},"${snack.name}",${Math.round(snack.calories)},`
        csv += `${Math.round(snack.protein)},${Math.round(snack.carbs)},${Math.round(snack.fat)}\n`
      }
    })
    
    // Day total
    if (day.totals) {
      csv += `${dayName},TOTAAL,,${Math.round(day.totals.kcal)},`
      csv += `${Math.round(day.totals.protein)},${Math.round(day.totals.carbs)},${Math.round(day.totals.fat)}\n`
    }
  })
  
  return csv
}
