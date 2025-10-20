// src/services/AIMealPlanGeneratorService.js
import DatabaseService from './DatabaseService';

class AIMealPlanGeneratorService {
  constructor() {
    this.supabase = DatabaseService.supabase;
  }

  // =============== MEAL DATA OPERATIONS ===============
  
  /**
   * Get all AI meals with optional filtering
   */
  async getAIMeals(filters = {}) {
    try {
      let query = this.supabase
        .from('ai_meals')
        .select('*');

      // Apply filters
      if (filters.timing) {
        query = query.contains('timing', [filters.timing]);
      }
      if (filters.minCalories) {
        query = query.gte('calories', filters.minCalories);
      }
      if (filters.maxCalories) {
        query = query.lte('calories', filters.maxCalories);
      }
      if (filters.minProtein) {
        query = query.gte('protein', filters.minProtein);
      }
      if (filters.costTier) {
        query = query.eq('cost_tier', filters.costTier);
      }
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI meals:', error);
      return [];
    }
  }

  /**
   * Get meals by specific IDs
   */
  async getMealsByIds(mealIds) {
    try {
      const { data, error } = await this.supabase
        .from('ai_meals')
        .select('*')
        .in('id', mealIds);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching meals by IDs:', error);
      return [];
    }
  }

  /**
   * Smart meal filtering based on client preferences
   */
  async getSmartMealSuggestions(clientId, mealType = 'lunch') {
    try {
      // Get client preferences
      const client = await this.getClientPreferences(clientId);
      
      if (!client) return [];

      // Build smart query
      let query = this.supabase
        .from('ai_meals')
        .select('*')
        .contains('timing', [mealType]);

      // Apply calorie range (25% of daily for breakfast, 35% lunch/dinner, 5% snacks)
      const caloriePercentage = mealType === 'breakfast' ? 0.25 : 
                               mealType === 'snack' ? 0.05 : 0.35;
      const targetCalories = client.target_calories * caloriePercentage;
      
      query = query
        .gte('calories', targetCalories * 0.8)  // 20% margin
        .lte('calories', targetCalories * 1.2);

      // Apply protein minimum (distribute daily protein across meals)
      const minProtein = client.target_protein / 4; // Minimum per meal
      query = query.gte('protein', minProtein);

      // Apply budget filter
      if (client.budget_per_week) {
        const budgetTier = this.calculateBudgetTier(client.budget_per_week);
        query = query.eq('cost_tier', budgetTier);
      }

      // Apply cooking skill filter
      if (client.cooking_skill === 'beginner') {
        query = query.eq('difficulty', 'etm');
      }

      // Exclude allergens
      if (client.allergies) {
        const allergensList = client.allergies.split(',').map(a => a.trim());
        // Note: This needs a NOT contains query - might need adjustment
        for (const allergen of allergensList) {
          query = query.not('allergens', 'cs', `{${allergen}}`);
        }
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;

      // Score and sort meals
      const scoredMeals = this.scoreMeals(data || [], client);
      return scoredMeals.slice(0, 10); // Top 10 suggestions
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      return [];
    }
  }

  /**
   * Score meals based on client preferences
   */
  scoreMeals(meals, client) {
    return meals.map(meal => {
      let score = 0;
      
      // Protein score (higher is better for most goals)
      score += (meal.protein / meal.calories) * 100;
      
      // Goal alignment
      if (client.primary_goal === 'muscle_gain' && meal.labels?.bulk_friendly) {
        score += 20;
      }
      if (client.primary_goal === 'fat_loss' && meal.labels?.cut_friendly) {
        score += 20;
      }
      
      // Favorite foods bonus
      if (client.loved_foods) {
        const favorites = client.loved_foods.toLowerCase().split(',');
        const mealName = meal.name.toLowerCase();
        if (favorites.some(fav => mealName.includes(fav.trim()))) {
          score += 15;
        }
      }
      
      // Variety score (add randomness)
      score += Math.random() * 10;
      
      return { ...meal, score };
    }).sort((a, b) => b.score - a.score);
  }

  // =============== CLIENT OPERATIONS ===============

  /**
   * Get client preferences for meal planning
   */
  async getClientPreferences(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          current_weight,
          target_weight,
          height,
          age,
          gender,
          primary_goal,
          target_calories,
          target_protein,
          target_carbs,
          target_fat,
          activity_level,
          dietary_type,
          allergies,
          intolerances,
          loved_foods,
          hated_foods,
          favorite_cuisines,
          budget_per_week,
          cooking_skill,
          cooking_time
        `)
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching client preferences:', error);
      return null;
    }
  }

  /**
   * Calculate budget tier based on weekly budget
   */
  calculateBudgetTier(weeklyBudget) {
    if (weeklyBudget < 50) return 'budget';
    if (weeklyBudget < 100) return 'medium';
    return 'premium';
  }

  // =============== MEAL PLAN OPERATIONS ===============

  /**
   * Generate a complete week plan for a client
   */
  async generateWeekPlan(clientId, preferences = {}) {
    const isMobile = window.innerWidth <= 768;
    
    try {
      const client = await this.getClientPreferences(clientId);
      if (!client) throw new Error('Client not found');

      const weekPlan = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      };

      const days = Object.keys(weekPlan);
      
      for (const day of days) {
        // Generate meals for each day
        const dayMeals = await this.generateDayMeals(client, day);
        weekPlan[day] = dayMeals;
      }

      return {
        client_id: clientId,
        week_structure: weekPlan,
        daily_calories: client.target_calories,
        daily_protein: client.target_protein,
        daily_carbs: client.target_carbs,
        daily_fat: client.target_fat,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating week plan:', error);
      return null;
    }
  }

  /**
   * Generate meals for a single day
   */
  async generateDayMeals(client, day) {
    const meals = [];
    
    // Get breakfast
    const breakfast = await this.getSmartMealSuggestions(client.id, 'breakfast');
    if (breakfast.length > 0) {
      meals.push({
        slot: 'breakfast',
        meal: breakfast[0],
        time: '08:00'
      });
    }

    // Get lunch
    const lunch = await this.getSmartMealSuggestions(client.id, 'lunch');
    if (lunch.length > 0) {
      meals.push({
        slot: 'lunch',
        meal: lunch[0],
        time: '12:30'
      });
    }

    // Get dinner
    const dinner = await this.getSmartMealSuggestions(client.id, 'dinner');
    if (dinner.length > 0) {
      meals.push({
        slot: 'dinner',
        meal: dinner[0],
        time: '18:30'
      });
    }

    // Add snacks if needed to hit calorie target
    const currentCalories = meals.reduce((sum, m) => sum + (m.meal.calories || 0), 0);
    if (currentCalories < client.target_calories * 0.9) {
      const snack = await this.getSmartMealSuggestions(client.id, 'snack');
      if (snack.length > 0) {
        meals.push({
          slot: 'snack',
          meal: snack[0],
          time: '15:00'
        });
      }
    }

    return meals;
  }

  /**
   * Save meal plan to database
   */
  async saveMealPlan(planData) {
    try {
      // Deactivate old plans
      await this.supabase
        .from('client_meal_plans')
        .update({ is_active: false })
        .eq('client_id', planData.client_id);

      // Insert new plan
      const { data, error } = await this.supabase
        .from('client_meal_plans')
        .insert([{
          client_id: planData.client_id,
          name: planData.name || 'AI Generated Plan',
          week_structure: planData.week_structure,
          daily_calories: planData.daily_calories,
          daily_protein: planData.daily_protein,
          daily_carbs: planData.daily_carbs,
          daily_fat: planData.daily_fat,
          is_active: true,
          start_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving meal plan:', error);
      return null;
    }
  }

  /**
   * Get active meal plan for client
   */
  async getActiveMealPlan(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_meal_plans')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching active meal plan:', error);
      return null;
    }
  }

  // =============== INGREDIENT OPERATIONS ===============

  /**
   * Get all ingredients for shopping list
   */
  async getIngredients(ingredientIds) {
    try {
      const { data, error } = await this.supabase
        .from('ai_ingredients')
        .select('*')
        .in('id', ingredientIds);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      return [];
    }
  }

  /**
   * Generate shopping list from meal plan
   */
  async generateShoppingList(mealPlan) {
    const ingredients = {};
    
    // Collect all ingredients from all meals
    Object.values(mealPlan.week_structure).forEach(dayMeals => {
      dayMeals.forEach(mealSlot => {
        if (mealSlot.meal?.ingredients_list) {
          mealSlot.meal.ingredients_list.forEach(ing => {
            if (ingredients[ing.name]) {
              ingredients[ing.name].amount += ing.amount;
            } else {
              ingredients[ing.name] = { ...ing };
            }
          });
        }
      });
    });

    return Object.values(ingredients);
  }
}

// Create singleton instance
const aiMealService = new AIMealPlanGeneratorService();

// Export as default
export default aiMealService;
