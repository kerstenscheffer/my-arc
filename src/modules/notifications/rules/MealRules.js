// MealRules.js - Advanced Nutrition Analysis

class MealRules {
  constructor(databaseService) {
    this.db = databaseService;
  }

  async analyze(clientId) {
    const insights = [];

    // Run all meal analyses in parallel
    const [
      macroBalance,
      mealTiming,
      calorieConsistency,
      mealPrep,
      cheatMeal,
      nutritionImprovement
    ] = await Promise.all([
      this.checkMacroBalance(clientId),
      this.checkMealTiming(clientId),
      this.checkCalorieConsistency(clientId),
      this.checkMealPrepSuccess(clientId),
      this.checkCheatMealPattern(clientId),
      this.checkNutritionImprovement(clientId)
    ]);

    // Add all valid insights
    if (macroBalance) insights.push(macroBalance);
    if (mealTiming) insights.push(mealTiming);
    if (calorieConsistency) insights.push(calorieConsistency);
    if (mealPrep) insights.push(mealPrep);
    if (cheatMeal) insights.push(cheatMeal);
    if (nutritionImprovement) insights.push(nutritionImprovement);

    return insights;
  }

  async checkMacroBalance(clientId) {
    const { data: meals } = await this.db.supabase
      .from('meal_tracking')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (!meals || meals.length < 3) return null;

    // Calculate average macros
    const avgProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0) / meals.length;
    const avgCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0) / meals.length;
    const avgFats = meals.reduce((sum, m) => sum + (m.fats || 0), 0) / meals.length;
    
    const proteinGoal = meals[0]?.protein_goal || 150;
    const carbsGoal = meals[0]?.carbs_goal || 200;
    const fatsGoal = meals[0]?.fats_goal || 60;

    // Check protein intake
    if (avgProtein < proteinGoal * 0.8) {
      return {
        rule: {
          id: 'low-protein-alert',
          name: '🥩 Protein Alert',
          type: 'meal',
          message_template: 'Je eiwitinname is {percentage}% van je doel. Tijd voor een protein shake! 💪'
        },
        data: { 
          percentage: Math.round((avgProtein / proteinGoal) * 100)
        }
      };
    }

    // Check for perfect macro balance
    const proteinAccuracy = Math.abs(1 - (avgProtein / proteinGoal));
    const carbsAccuracy = Math.abs(1 - (avgCarbs / carbsGoal));
    const fatsAccuracy = Math.abs(1 - (avgFats / fatsGoal));
    
    if (proteinAccuracy < 0.1 && carbsAccuracy < 0.1 && fatsAccuracy < 0.1) {
      return {
        rule: {
          id: 'perfect-macros',
          name: '🎯 Macro Master',
          type: 'meal',
          message_template: 'PERFECT! Je macros zijn binnen 10% van alle doelen! Pro niveau! 🏆'
        },
        data: {}
      };
    }

    return null;
  }

  async checkMealTiming(clientId) {
    const { data: meals } = await this.db.supabase
      .from('meal_logs')
      .select('logged_at, meal_type')
      .eq('client_id', clientId)
      .gte('logged_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .order('logged_at', { ascending: false });

    if (!meals || meals.length < 6) return null;

    // Group meals by day and check consistency
    const mealsByDay = {};
    meals.forEach(meal => {
      const day = new Date(meal.logged_at).toDateString();
      if (!mealsByDay[day]) mealsByDay[day] = [];
      mealsByDay[day].push(meal);
    });

    // Check if eating regularly (4-6 meals per day)
    const daysWithGoodTiming = Object.values(mealsByDay)
      .filter(dayMeals => dayMeals.length >= 4 && dayMeals.length <= 6)
      .length;

    if (daysWithGoodTiming >= 3) {
      return {
        rule: {
          id: 'consistent-meal-timing',
          name: '⏰ Timing Perfect',
          type: 'meal',
          message_template: 'Je eet super consistent! {days} dagen perfect meal timing. Metabolisme op volle toeren! 🔥'
        },
        data: { days: daysWithGoodTiming }
      };
    }

    // Check for skipped breakfast
    const skippedBreakfast = Object.values(mealsByDay)
      .filter(dayMeals => !dayMeals.some(m => m.meal_type === 'breakfast'))
      .length;

    if (skippedBreakfast >= 2) {
      return {
        rule: {
          id: 'breakfast-reminder',
          name: '🌅 Breakfast Power',
          type: 'meal',
          message_template: 'Je skipt vaak ontbijt! Start je dag met energie - ontbijt is key! 🥞'
        },
        data: {}
      };
    }

    return null;
  }

  async checkCalorieConsistency(clientId) {
    const { data: meals } = await this.db.supabase
      .from('meal_tracking')
      .select('date, calories, calorie_goal')
      .eq('client_id', clientId)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (!meals || meals.length < 5) return null;

    const calorieGoal = meals[0]?.calorie_goal || 2000;
    
    // Check consistency (standard deviation)
    const calories = meals.map(m => m.calories || 0);
    const avgCalories = calories.reduce((a, b) => a + b, 0) / calories.length;
    const variance = calories.reduce((sum, cal) => sum + Math.pow(cal - avgCalories, 2), 0) / calories.length;
    const stdDev = Math.sqrt(variance);

    // Very consistent if std dev is less than 10% of goal
    if (stdDev < calorieGoal * 0.1) {
      return {
        rule: {
          id: 'calorie-consistency-champion',
          name: '📊 Consistency Champion',
          type: 'meal',
          message_template: 'WOW! Super consistente calorie intake deze week. Je discipline is next level! 🎯'
        },
        data: {
          avgCalories: Math.round(avgCalories),
          consistency: Math.round((1 - stdDev / calorieGoal) * 100)
        }
      };
    }

    // Check for under-eating
    if (avgCalories < calorieGoal * 0.75) {
      return {
        rule: {
          id: 'undereating-warning',
          name: '⚠️ Fuel Warning',
          type: 'meal',
          message_template: 'Je eet maar {percentage}% van je calorie doel. Je lichaam heeft fuel nodig! ⛽'
        },
        data: {
          percentage: Math.round((avgCalories / calorieGoal) * 100)
        }
      };
    }

    return null;
  }

  async checkMealPrepSuccess(clientId) {
    // Check if client logs meals consistently on Sunday (meal prep day)
    const { data: sundayMeals } = await this.db.supabase
      .from('meal_logs')
      .select('logged_at')
      .eq('client_id', clientId)
      .gte('logged_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString());

    if (!sundayMeals) return null;

    const sundayPrep = sundayMeals.filter(meal => {
      const day = new Date(meal.logged_at).getDay();
      return day === 0; // Sunday
    });

    if (sundayPrep.length >= 3) {
      return {
        rule: {
          id: 'meal-prep-sunday',
          name: '🍱 Prep Master',
          type: 'meal',
          message_template: 'Meal Prep Sunday on point! {weeks} weken consistent. Je bent een machine! 🍱'
        },
        data: {
          weeks: Math.floor(sundayPrep.length / 3)
        }
      };
    }

    return null;
  }

  async checkCheatMealPattern(clientId) {
    const { data: meals } = await this.db.supabase
      .from('meal_tracking')
      .select('date, calories, calorie_goal')
      .eq('client_id', clientId)
      .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (!meals || meals.length < 7) return null;

    // Detect cheat days (20% over calorie goal)
    const cheatDays = meals.filter(m => 
      m.calories && m.calorie_goal && m.calories > m.calorie_goal * 1.2
    );

    // Perfect balance: 1 cheat day per week
    if (cheatDays.length === 2) {
      return {
        rule: {
          id: 'balanced-cheat-meals',
          name: '🍕 Balance Master',
          type: 'meal',
          message_template: 'Perfect balance! Je geniet én blijft on track. Dit is hoe het moet! 👌'
        },
        data: {
          cheatDays: cheatDays.length
        }
      };
    }

    // Too many cheat days
    if (cheatDays.length > 4) {
      return {
        rule: {
          id: 'cheat-meal-control',
          name: '🎯 Focus Time',
          type: 'meal',
          message_template: '{cheatDays} cheat days in 2 weken. Tijd om te refocussen! Je kan dit! 💪'
        },
        data: {
          cheatDays: cheatDays.length
        }
      };
    }

    return null;
  }

  async checkNutritionImprovement(clientId) {
    // Compare this week vs last week
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: lastWeek } = await this.db.supabase
      .from('meal_tracking')
      .select('protein, protein_goal')
      .eq('client_id', clientId)
      .gte('date', twoWeeksAgo.toISOString())
      .lt('date', oneWeekAgo.toISOString());

    const { data: thisWeek } = await this.db.supabase
      .from('meal_tracking')
      .select('protein, protein_goal')
      .eq('client_id', clientId)
      .gte('date', oneWeekAgo.toISOString());

    if (!lastWeek || !thisWeek || lastWeek.length < 3 || thisWeek.length < 3) return null;

    // Calculate improvement
    const lastWeekHitRate = lastWeek.filter(m => m.protein >= m.protein_goal).length / lastWeek.length;
    const thisWeekHitRate = thisWeek.filter(m => m.protein >= m.protein_goal).length / thisWeek.length;

    if (thisWeekHitRate > lastWeekHitRate && thisWeekHitRate >= 0.8) {
      return {
        rule: {
          id: 'nutrition-improvement',
          name: '📈 Level Up!',
          type: 'meal',
          message_template: 'Deze week {improvement}% beter dan vorige week! Je groeit elke dag! 🚀'
        },
        data: {
          improvement: Math.round((thisWeekHitRate - lastWeekHitRate) * 100)
        }
      };
    }

    return null;
  }
}

export default MealRules;
