// src/coach/pages/challenge-monitor/adjustments/MealAdjustment.js
import { Utensils } from 'lucide-react'

export const mealConfig = {
  icon: Utensils,
  title: 'Meal Days',
  color: '#10b981',
  required: 45
}

export async function loadMealData(db, clientId, challengeData) {
  if (!clientId || !challengeData) return null
  
  try {
    const startDate = new Date(challengeData.start_date)
    const endDate = new Date(challengeData.end_date)
    
    const { data: meals } = await db.supabase
      .from('ai_meal_progress')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    // Filter days with ANY tracking (matches banner logic)
    const trackedDays = meals?.filter(day => 
      day.meals_consumed > 0 || 
      day.manual_intake !== null || 
      day.completion_percentage > 0
    ) || []
    
    // Get unique dates
    const uniqueDates = [...new Set(trackedDays.map(m => m.date))]
    
    return {
      current: uniqueDates.length,
      lastEntry: trackedDays[0]?.date || null,
      lastEntryData: trackedDays[0] || null
    }
  } catch (err) {
    console.error('Error loading meal data:', err)
    return null
  }
}

export async function addMeal(db, clientId, challengeData) {
  const startDate = new Date(challengeData.start_date)
  const endDate = new Date(challengeData.end_date)
  const today = new Date()
  
  // Get all existing meal progress dates
  const { data: existingMeals } = await db.supabase
    .from('ai_meal_progress')
    .select('date')
    .eq('client_id', clientId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
  
  const existingDates = new Set(existingMeals?.map(m => m.date) || [])
  
  // Find first date without meal tracking (prioritize today backwards)
  let targetDate = null
  for (let i = 0; i <= 56; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    
    if (checkDate < startDate) break
    if (checkDate > endDate) continue
    
    const dateStr = checkDate.toISOString().split('T')[0]
    if (!existingDates.has(dateStr)) {
      targetDate = dateStr
      break
    }
  }
  
  if (!targetDate) {
    throw new Error('No available dates in challenge period')
  }
  
  // Insert meal progress entry
  const { error } = await db.supabase
    .from('ai_meal_progress')
    .insert({
      client_id: clientId,
      date: targetDate,
      meals_consumed: 1,
      completion_percentage: 20,
      created_at: new Date().toISOString()
    })
  
  if (error) throw error
  
  return {
    success: true,
    message: `Meal day added for ${new Date(targetDate).toLocaleDateString()}`
  }
}

export async function removeMeal(db, clientId, lastEntryData) {
  if (!lastEntryData) {
    throw new Error('No meal day to remove')
  }
  
  const { error } = await db.supabase
    .from('ai_meal_progress')
    .delete()
    .eq('id', lastEntryData.id)
  
  if (error) throw error
  
  return {
    success: true,
    message: 'Meal day removed'
  }
}
