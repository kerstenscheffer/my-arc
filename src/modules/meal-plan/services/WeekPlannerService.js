// src/modules/meal-plan/services/WeekPlannerService.js
import DatabaseService from '../../../services/DatabaseService'

class WeekPlannerService {
  constructor(db) {
    this.db = db
  }

  /**
   * Generate complete AI week plan
   */
  async generateWeekPlan(clientId, preferences = {}) {
    try {
      console.log('🤖 Generating AI week plan for client:', clientId)
      
      // 1. Get client data
      const client = await this.db.getClient(clientId)
      if (!client) throw new Error('Client not found')
      
      // 2. Get client's custom meals
      const customMeals = await this.db.getClientCustomMeals(clientId)
      if (!customMeals || customMeals.length === 0) {
        throw new Error('No custom meals found. Create meals first!')
      }
      
      // 3. Get targets
      const activePlan = await this.db.getClientMealPlan(clientId)
      const targets = {
        calories: activePlan?.daily_calories || client.target_calories || 2200,
        protein: activePlan?.daily_protein || client.target_protein || 165,
        carbs: activePlan?.daily_carbs || client.target_carbs || 220,
        fat: activePlan?.daily_fat || client.target_fat || 73
      }
      
      // 4. Calculate distribution
      const mealsPerDay = preferences.mealsPerDay || 4
      const distribution = this.calculateMealDistribution(mealsPerDay, targets)
      
      // 5. Generate week structure
      const weekStructure = {}
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      
      const usedMealIds = new Map() // Track: mealId → last used day index
      
      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex]
        const dayMeals = {}
        
        // Generate meals for this day
        for (const [slot, targetMacros] of Object.entries(distribution)) {
          // Filter available meals (not used recently)
          let availableMeals = customMeals.filter(meal => {
            const lastUsed = usedMealIds.get(meal.id)
            
            // If never used, always available
            if (lastUsed === undefined) return true
            
            // Check variety preference
            const daysSinceUsed = dayIndex - lastUsed
            const minDaysBetween = preferences.varietyLevel === 'high' ? 3 : 
                                   preferences.varietyLevel === 'low' ? 1 : 2
            
            return daysSinceUsed >= minDaysBetween
          })
          
          // If no available meals (all used recently), use all
          if (availableMeals.length === 0) {
            availableMeals = customMeals
          }
          
          // Select best meal with randomness
          const selectedMeal = this.selectBestMeal(
            availableMeals, 
            targetMacros, 
            preferences.varietyLevel || 'medium'
          )
          
          if (selectedMeal) {
            // Calculate scale factor
            const scaleFactor = targetMacros.calories / selectedMeal.calories
            
            dayMeals[slot] = {
              meal_id: selectedMeal.id,
              meal_name: selectedMeal.name,
              calories: Math.round(selectedMeal.calories * scaleFactor),
              protein: Math.round(selectedMeal.protein * scaleFactor),
              carbs: Math.round(selectedMeal.carbs * scaleFactor),
              fat: Math.round(selectedMeal.fat * scaleFactor),
              scale_factor: Math.round(scaleFactor * 100) / 100,
              original_calories: selectedMeal.calories,
              is_custom: true
            }
            
            // Mark as used
            usedMealIds.set(selectedMeal.id, dayIndex)
          }
        }
        
        // Calculate day totals
        const slots = Object.values(dayMeals)
        dayMeals.totals = {
          kcal: slots.reduce((sum, m) => sum + m.calories, 0),
          protein: slots.reduce((sum, m) => sum + m.protein, 0),
          carbs: slots.reduce((sum, m) => sum + m.carbs, 0),
          fat: slots.reduce((sum, m) => sum + m.fat, 0)
        }
        
        // Calculate accuracy
        dayMeals.accuracy = {
          calories: Math.round((dayMeals.totals.kcal / targets.calories) * 100),
          protein: Math.round((dayMeals.totals.protein / targets.protein) * 100)
        }
        
        weekStructure[day] = dayMeals
      }
      
      console.log('✅ Week plan generated with variety')
      return {
        weekStructure,
        targets,
        generatedAt: new Date().toISOString(),
        mealsUsed: customMeals.length,
        preferences
      }
      
    } catch (error) {
      console.error('❌ Generate week plan failed:', error)
      throw error
    }
  }

  /**
   * Select best meal with randomness for variety
   */
  selectBestMeal(meals, targetMacros, varietyLevel = 'medium') {
    if (!meals || meals.length === 0) return null
    
    // Score each meal
    const scoredMeals = meals.map(meal => {
      const calorieDiff = Math.abs(meal.calories - targetMacros.calories)
      const proteinDiff = Math.abs(meal.protein - targetMacros.protein)
      
      // Base score (lower = better)
      let score = calorieDiff + (proteinDiff * 2)
      
      // Add randomness based on variety level
      const randomWeight = varietyLevel === 'high' ? 200 : 
                          varietyLevel === 'low' ? 50 : 100
      
      score += Math.random() * randomWeight
      
      return { meal, score }
    })
    
    // Sort by score
    scoredMeals.sort((a, b) => a.score - b.score)
    
    // Pick from top 3 for more variety
    const topCandidates = scoredMeals.slice(0, Math.min(3, scoredMeals.length))
    const randomIndex = Math.floor(Math.random() * topCandidates.length)
    
    return topCandidates[randomIndex].meal
  }

  /**
   * Calculate meal distribution based on meals per day
   */
  calculateMealDistribution(mealsPerDay, targets) {
    const distribution = {}
    
    if (mealsPerDay === 3) {
      distribution.breakfast = {
        calories: Math.round(targets.calories * 0.30),
        protein: Math.round(targets.protein * 0.30)
      }
      distribution.lunch = {
        calories: Math.round(targets.calories * 0.35),
        protein: Math.round(targets.protein * 0.35)
      }
      distribution.dinner = {
        calories: Math.round(targets.calories * 0.35),
        protein: Math.round(targets.protein * 0.35)
      }
    } else if (mealsPerDay === 4) {
      distribution.breakfast = {
        calories: Math.round(targets.calories * 0.25),
        protein: Math.round(targets.protein * 0.25)
      }
      distribution.lunch = {
        calories: Math.round(targets.calories * 0.30),
        protein: Math.round(targets.protein * 0.30)
      }
      distribution.dinner = {
        calories: Math.round(targets.calories * 0.35),
        protein: Math.round(targets.protein * 0.35)
      }
      distribution.snacks = {
        calories: Math.round(targets.calories * 0.10),
        protein: Math.round(targets.protein * 0.10)
      }
    } else if (mealsPerDay === 5) {
      distribution.breakfast = {
        calories: Math.round(targets.calories * 0.25),
        protein: Math.round(targets.protein * 0.25)
      }
      distribution.lunch = {
        calories: Math.round(targets.calories * 0.30),
        protein: Math.round(targets.protein * 0.30)
      }
      distribution.dinner = {
        calories: Math.round(targets.calories * 0.30),
        protein: Math.round(targets.protein * 0.30)
      }
      distribution.snacks = {
        calories: Math.round(targets.calories * 0.15),
        protein: Math.round(targets.protein * 0.15)
      }
    }
    
    return distribution
  }
}

export default WeekPlannerService
