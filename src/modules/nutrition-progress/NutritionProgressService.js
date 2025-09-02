// src/modules/nutrition-progress/NutritionProgressService.js
// 🍎 NUTRITION PROGRESS SERVICE - Gesynct met bestaande MY ARC database

import DatabaseService from '../../services/DatabaseService'

class NutritionProgressService {
  constructor() {
    this.db = DatabaseService
    this.supabase = DatabaseService.supabase
  }

  // ===== CORE PROGRESS DATA =====
  async getNutritionProgressData(clientId, days = 30) {
    try {
      console.log(`🍎 Loading nutrition progress for ${clientId} - ${days} days`)
      
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)

      // Get meal progress (main data source)
      const { data: progressData, error: progressError } = await this.supabase
        .from('meal_progress')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (progressError) throw progressError

      // Get water intake via nutrition_compliance
      const { data: waterData, error: waterError } = await this.supabase
        .from('nutrition_compliance')
        .select('date, water_glasses')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (waterError) console.warn('Water data not found:', waterError)

      // Get client targets
      const targets = await this.db.getClientMealTargets(clientId)

      // Process data for charts
      const processedData = this.processNutritionData(progressData || [], waterData || [], targets)

      console.log('✅ Nutrition progress data loaded:', {
        entries: progressData?.length || 0,
        waterEntries: waterData?.length || 0,
        dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
      })

      return processedData

    } catch (error) {
      console.error('❌ Get nutrition progress failed:', error)
      return {
        dailyData: [],
        summary: this.getEmptySummary(),
        waterData: [],
        streakData: { current: 0, longest: 0 }
      }
    }
  }

  // ===== DATA PROCESSING =====
  processNutritionData(progressData, waterData, targets) {
    // Create date map for easy lookup
    const waterMap = {}
    waterData.forEach(entry => {
      waterMap[entry.date] = entry.water_glasses || 0
    })

    // Process daily data for charts
    const dailyData = progressData.map(entry => {
      // Parse notes JSON to get checked meals info
      let checkedMeals = {}
      let mealCount = 0
      let totalMeals = 0

      try {
        if (entry.notes) {
          const parsed = JSON.parse(entry.notes)
          checkedMeals = parsed.checked_meals || {}
          mealCount = parsed.meal_count || 0
          totalMeals = parsed.total_meals || 0
        }
      } catch (e) {
        console.warn('Could not parse meal notes:', e)
      }

      return {
        date: entry.date,
        calories: entry.calories || 0,
        protein: entry.protein || 0,
        carbs: entry.carbs || 0,
        fat: entry.fat || 0,
        water: waterMap[entry.date] || 0,
        completionRate: totalMeals > 0 ? (mealCount / totalMeals) * 100 : 0,
        mealsCompleted: mealCount,
        totalMeals: totalMeals,
        checkedMeals: checkedMeals,
        targets: targets
      }
    })

    // Calculate summary stats
    const summary = this.calculateSummary(dailyData, targets)
    
    // Calculate streak
    const streakData = this.calculateStreaks(dailyData)

    // Get top foods (mock for now, can be enhanced)
    const favoriteFoods = this.calculateFavoriteFoods(dailyData)

    return {
      dailyData,
      summary,
      waterData: this.processWaterData(dailyData),
      streakData,
      favoriteFoods
    }
  }

  calculateSummary(dailyData, targets) {
    if (!dailyData.length) return this.getEmptySummary()

    const totals = dailyData.reduce((acc, day) => {
      acc.calories += day.calories
      acc.protein += day.protein
      acc.carbs += day.carbs
      acc.fat += day.fat
      acc.water += day.water
      acc.completionSum += day.completionRate
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, completionSum: 0 })

    const avgCompletion = totals.completionSum / dailyData.length
    const daysTracked = dailyData.filter(day => day.calories > 0).length

    return {
      avgCalories: Math.round(totals.calories / dailyData.length),
      avgProtein: Math.round(totals.protein / dailyData.length),
      avgCarbs: Math.round(totals.carbs / dailyData.length),
      avgFat: Math.round(totals.fat / dailyData.length),
      avgWater: Math.round(totals.water / dailyData.length),
      avgCompletion: Math.round(avgCompletion),
      daysTracked,
      totalDays: dailyData.length,
      adherenceRate: Math.round((daysTracked / dailyData.length) * 100),
      calorieTarget: targets.calories,
      proteinTarget: targets.protein,
      targetHitRate: this.calculateTargetHitRate(dailyData, targets)
    }
  }

  calculateTargetHitRate(dailyData, targets) {
    const tolerance = 0.1 // 10% tolerance
    
    const hits = dailyData.filter(day => {
      const calorieRatio = day.calories / targets.calories
      return calorieRatio >= (1 - tolerance) && calorieRatio <= (1 + tolerance)
    }).length

    return Math.round((hits / dailyData.length) * 100)
  }

  calculateStreaks(dailyData) {
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Sort by date descending for current streak
    const sortedData = [...dailyData].sort((a, b) => new Date(b.date) - new Date(a.date))

    for (let i = 0; i < sortedData.length; i++) {
      const day = sortedData[i]
      const isCompliant = day.completionRate >= 80 // 80% completion = compliant day

      if (i === 0 && isCompliant) {
        // Check if today/most recent is compliant
        currentStreak = 1
        tempStreak = 1
      } else if (isCompliant && tempStreak > 0) {
        tempStreak++
        if (i < 10) { // Only count as current if within last 10 days
          currentStreak = tempStreak
        }
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
        }
        tempStreak = 0
        if (i === 0) currentStreak = 0
      }
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak
    }

    return {
      current: currentStreak,
      longest: Math.max(longestStreak, currentStreak)
    }
  }

  calculateFavoriteFoods(dailyData) {
    // This would need meal-level data to be truly accurate
    // For now, return mock data based on macro preferences
    const avgMacros = dailyData.reduce((acc, day) => {
      acc.protein += day.protein
      acc.carbs += day.carbs
      acc.fat += day.fat
      return acc
    }, { protein: 0, carbs: 0, fat: 0 })

    const totalDays = dailyData.length || 1
    
    // Mock favorite foods based on macro trends
    const mockFavorites = [
      { name: 'Zalm uit de oven', frequency: Math.floor(Math.random() * 15) + 5 },
      { name: 'Havermout met whey', frequency: Math.floor(Math.random() * 12) + 8 },
      { name: 'Kip wrap', frequency: Math.floor(Math.random() * 10) + 6 },
      { name: 'Magere kwark', frequency: Math.floor(Math.random() * 8) + 4 }
    ].sort((a, b) => b.frequency - a.frequency)

    return mockFavorites.slice(0, 4)
  }

  processWaterData(dailyData) {
    return dailyData.map(day => ({
      date: day.date,
      glasses: day.water,
      liters: (day.water * 0.25).toFixed(1), // Assume 250ml per glass
      target: 8 // 8 glasses target
    }))
  }

  getEmptySummary() {
    return {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      avgWater: 0,
      avgCompletion: 0,
      daysTracked: 0,
      totalDays: 0,
      adherenceRate: 0,
      calorieTarget: 2000,
      proteinTarget: 150,
      targetHitRate: 0
    }
  }

  // ===== HISTORICAL DATA METHODS =====
  async getMealHistoryEnhanced(clientId, days = 30) {
    try {
      // Use meal_history_view if available, fallback to meal_progress
      const { data, error } = await this.supabase
        .from('meal_history_view')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(days)

      if (error) {
        console.warn('meal_history_view not available, using meal_progress')
        return await this.db.getMealProgressRange(clientId, 
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        )
      }

      return data || []
    } catch (error) {
      console.error('❌ Get meal history enhanced failed:', error)
      return []
    }
  }

  // ===== WEEKLY PATTERNS =====
  async getWeeklyPatterns(clientId, weeks = 4) {
    try {
      const days = weeks * 7
      const data = await this.getNutritionProgressData(clientId, days)
      
      // Group by day of week
      const weeklyPatterns = {}
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

      data.dailyData.forEach(day => {
        const dayOfWeek = new Date(day.date).getDay()
        const dayName = dayNames[dayOfWeek]
        
        if (!weeklyPatterns[dayName]) {
          weeklyPatterns[dayName] = {
            calories: [],
            completion: [],
            water: []
          }
        }
        
        weeklyPatterns[dayName].calories.push(day.calories)
        weeklyPatterns[dayName].completion.push(day.completionRate)
        weeklyPatterns[dayName].water.push(day.water)
      })

      // Calculate averages
      const patterns = Object.keys(weeklyPatterns).map(day => {
        const data = weeklyPatterns[day]
        return {
          day,
          avgCalories: Math.round(data.calories.reduce((a, b) => a + b, 0) / data.calories.length),
          avgCompletion: Math.round(data.completion.reduce((a, b) => a + b, 0) / data.completion.length),
          avgWater: Math.round(data.water.reduce((a, b) => a + b, 0) / data.water.length),
          dataPoints: data.calories.length
        }
      })

      return patterns

    } catch (error) {
      console.error('❌ Get weekly patterns failed:', error)
      return []
    }
  }

  // ===== COMPLIANCE TRACKING =====
  async updateNutritionCompliance(clientId, date, complianceData) {
    try {
      const { data, error } = await this.supabase
        .from('nutrition_compliance')
        .upsert({
          client_id: clientId,
          date: date,
          compliant: complianceData.compliant,
          calories_actual: complianceData.calories_actual,
          calories_target: complianceData.calories_target,
          protein_actual: complianceData.protein_actual,
          protein_target: complianceData.protein_target,
          carbs_actual: complianceData.carbs_actual,
          carbs_target: complianceData.carbs_target,
          fat_actual: complianceData.fat_actual,
          fat_target: complianceData.fat_target,
          water_glasses: complianceData.water_glasses,
          created_at: new Date().toISOString()
        })
        .select()

      if (error) throw error
      
      console.log('✅ Nutrition compliance updated')
      return data

    } catch (error) {
      console.error('❌ Update nutrition compliance failed:', error)
      throw error
    }
  }
}

// Export as functions instead of class instance to avoid Supabase multiple client issues
const nutritionProgressService = {
  async getNutritionProgressData(clientId, days = 30) {
    const service = new NutritionProgressService()
    return await service.getNutritionProgressData(clientId, days)
  },

  async getMealHistoryEnhanced(clientId, days = 30) {
    const service = new NutritionProgressService()
    return await service.getMealHistoryEnhanced(clientId, days)
  },

  async getWeeklyPatterns(clientId, weeks = 4) {
    const service = new NutritionProgressService()
    return await service.getWeeklyPatterns(clientId, weeks)
  },

  async updateNutritionCompliance(clientId, date, complianceData) {
    const service = new NutritionProgressService()
    return await service.updateNutritionCompliance(clientId, date, complianceData)
  }
}

export default nutritionProgressService
