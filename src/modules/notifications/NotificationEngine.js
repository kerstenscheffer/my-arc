// NotificationEngine.js - Updated
import WorkoutRules from './rules/WorkoutRules';
import MealRules from './rules/MealRules';
import StreakRules from './rules/StreakRules';

class NotificationEngine {
  constructor(notificationService, databaseService) {
    this.notificationService = notificationService;
    this.db = databaseService;
    
    this.ruleProcessors = [
      new WorkoutRules(this.db),
      new MealRules(this.db),
      new StreakRules(this.db)
    ];
  }

  async processClientData(clientId) {
    console.log('🤖 AI Analysis starting for client:', clientId);
    const notifications = [];

    for (const processor of this.ruleProcessors) {
      try {
        const insights = await processor.analyze(clientId);
        
        for (const insight of insights) {
          const notification = await this.notificationService.createSmartNotification(
            clientId,
            insight.rule,
            insight.data
          );
          
          if (notification) {
            notifications.push(notification);
            console.log('✅ Smart notification created:', insight.rule.name);
          }
        }
      } catch (error) {
        console.error('Error in processor:', processor.constructor.name, error);
      }
    }

    console.log(`🎯 AI Analysis complete: ${notifications.length} insights generated`);
    return notifications;
  }

  // Real-time trigger points
  async checkTriggerPoints(clientId, eventType, eventData) {
    // Immediate notifications for key events
    switch(eventType) {
      case 'workout_completed':
        return this.onWorkoutCompleted(clientId, eventData);
      case 'meal_logged':
        return this.onMealLogged(clientId, eventData);
      case 'weight_logged':
        return this.onWeightLogged(clientId, eventData);
      case 'goal_achieved':
        return this.onGoalAchieved(clientId, eventData);
      default:
        return null;
    }
  }

  async onWorkoutCompleted(clientId, workout) {
    // Check for PRs
    if (workout.is_pr) {
      await this.notificationService.createSmartNotification(clientId, {
        name: '🏆 NEW PR!',
        type: 'workout',
        message_template: 'BEAST MODE! Nieuwe PR op {exercise}: {weight}kg x {reps}! 🔥'
      }, workout);
    }
  }

  async onMealLogged(clientId, meal) {
    // Check if protein goal hit
    if (meal.protein >= meal.protein_goal) {
      const today = new Date().toDateString();
      const key = `protein_goal_${clientId}_${today}`;
      
      // Use cache to avoid duplicate notifications
      if (!this.notificationCache?.has(key)) {
        this.notificationCache?.set(key, true);
        
        await this.notificationService.createSmartNotification(clientId, {
          name: '✅ Protein Goal Hit',
          type: 'meal',
          message_template: 'Protein doel gehaald! {protein}g vandaag. Keep it up! 💪'
        }, meal);
      }
    }
  }

  async onWeightLogged(clientId, weight) {
    // Check for milestone weights
    if (weight.current % 5 === 0) { // Every 5kg milestone
      await this.notificationService.createSmartNotification(clientId, {
        name: '⚖️ Milestone Weight',
        type: 'progress',
        message_template: 'Milestone bereikt: {current}kg! Elke stap telt! 🎯'
      }, weight);
    }
  }

  async onGoalAchieved(clientId, goal) {
    await this.notificationService.createSmartNotification(clientId, {
      name: '🎯 GOAL ACHIEVED!',
      type: 'progress',
      message_template: 'YESSS! Je hebt "{goalName}" bereikt! Time to celebrate! 🎉'
    }, goal);
  }
}

export default NotificationEngine;
