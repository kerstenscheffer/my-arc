// NotificationService.js
// Core notification service that extends DatabaseService

class NotificationService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  // Get active notifications for client
  async getActiveNotifications(clientId, pageContext = 'all') {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      // Filter by page context
      if (pageContext !== 'all') {
        query = query.or(`page_context.eq.${pageContext},page_context.eq.all`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { data: [], error };
    }
  }

  // Send manual notification from coach
async sendManualNotification({ clientId, coachId, title, message, pageContext = 'all', priority = 'normal' }) {
  try {
    // Debug log
    console.log('📤 Sending notification with:', { clientId, coachId, title, pageContext });
    
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        title,
        message,
        page_context: pageContext,
        priority,
        source: 'manual',
        type: pageContext === 'workout' ? 'workout' : pageContext === 'meal' ? 'meal' : 'general'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    
    console.log('✅ Notification sent:', data);
    return { data, error: null };
  } catch (error) {  // <-- VOEG DIT TOE
    console.error('Error sending notification:', error);
    return { data: null, error };
  }
}
  // Create smart notification based on data patterns
  async createSmartNotification(clientId, ruleType, triggerData) {
    try {
      // Get the rule template
      const { data: rule } = await this.supabase
        .from('notification_rules')
        .select('*')
        .eq('type', ruleType)
        .eq('is_active', true)
        .single();

      if (!rule) return null;

      // Check cooldown
      const canTrigger = await this.checkRuleCooldown(clientId, rule.id, rule.cooldown_hours);
      if (!canTrigger) return null;

      // Parse message template
      let message = rule.message_template;
      Object.keys(triggerData).forEach(key => {
        message = message.replace(`{${key}}`, triggerData[key]);
      });

      // Create notification
      const { data: notification } = await this.supabase
        .from('notifications')
        .insert({
          client_id: clientId,
          title: rule.name,
          message,
          type: rule.type,
          page_context: rule.type,
          source: 'smart',
          trigger_data: triggerData,
          priority: 'normal'
        })
        .select()
        .single();

      // Log trigger
      await this.supabase
        .from('notification_rule_history')
        .insert({
          client_id: clientId,
          rule_id: rule.id,
          trigger_data: triggerData
        });

      return notification;
    } catch (error) {
      console.error('Error creating smart notification:', error);
      return null;
    }
  }

  // Check if rule can trigger (cooldown)
  async checkRuleCooldown(clientId, ruleId, cooldownHours = 24) {
    const { data } = await this.supabase
      .from('notification_rule_history')
      .select('triggered_at')
      .eq('client_id', clientId)
      .eq('rule_id', ruleId)
      .order('triggered_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return true;

    const lastTrigger = new Date(data.triggered_at);
    const now = new Date();
    const hoursSince = (now - lastTrigger) / (1000 * 60 * 60);

    return hoursSince >= cooldownHours;
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      return { success: !error, error };
    } catch (error) {
      console.error('Error marking as read:', error);
      return { success: false, error };
    }
  }

  // Dismiss notification
  async dismissNotification(notificationId) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ 
          status: 'dismissed',
          dismissed_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      return { success: !error, error };
    } catch (error) {
      console.error('Error dismissing notification:', error);
      return { success: false, error };
    }
  }

  // Get notification history for coach view
  async getNotificationHistory(clientId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data: data || [], error };
    } catch (error) {
      console.error('Error fetching history:', error);
      return { data: [], error };
    }
  }

  // Analyze workout patterns for smart notifications
  async analyzeWorkoutPatterns(clientId) {
    try {
      // Get last 2 weeks of workout data
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: workouts } = await this.supabase
        .from('workout_logs')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', twoWeeksAgo.toISOString())
        .order('created_at', { ascending: false });

      if (!workouts || workouts.length === 0) return;

      // Check for plateaus (same weight for 2+ weeks)
      const exerciseWeights = {};
      workouts.forEach(log => {
        if (!exerciseWeights[log.exercise_name]) {
          exerciseWeights[log.exercise_name] = [];
        }
        exerciseWeights[log.exercise_name].push(log.weight);
      });

      // Find plateaus
      for (const [exercise, weights] of Object.entries(exerciseWeights)) {
        if (weights.length >= 6 && new Set(weights).size === 1) {
          await this.createSmartNotification(clientId, 'Workout Plateau', {
            exercise,
            weeks: 2,
            weight: weights[0]
          });
        }
      }

      // Check for training streaks
      const uniqueDays = new Set(workouts.map(w => 
        new Date(w.created_at).toDateString()
      ));

      if (uniqueDays.size >= 5) {
        await this.createSmartNotification(clientId, 'Training Streak', {
          days: uniqueDays.size
        });
      }
    } catch (error) {
      console.error('Error analyzing workout patterns:', error);
    }
  }

  // Analyze meal patterns for smart notifications
  async analyzeMealPatterns(clientId) {
    try {
      // Get last week of meal tracking
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: meals } = await this.supabase
        .from('meal_tracking')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', oneWeekAgo.toISOString())
        .order('date', { ascending: false });

      if (!meals || meals.length === 0) return;

      // Check protein streak
      const proteinGoalMet = meals.filter(m => m.protein >= m.protein_goal);
      
      if (proteinGoalMet.length >= 7) {
        await this.createSmartNotification(clientId, 'Protein Streak', {
          days: proteinGoalMet.length
        });
      }
    } catch (error) {
      console.error('Error analyzing meal patterns:', error);
    }
  }

  // Run all smart analyses
  async runSmartAnalysis(clientId) {
    await Promise.all([
      this.analyzeWorkoutPatterns(clientId),
      this.analyzeMealPatterns(clientId)
    ]);
  }
}

export default NotificationService;
