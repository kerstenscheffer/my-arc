// RealAIAnalysis.js - AI Analysis met JOUW database tables

export class RealAIAnalysis {
  constructor(db) {
    this.db = db;
  }

  // MAIN ANALYSIS FUNCTION
  async analyzeClient(clientId) {
    console.log('🤖 Starting AI Analysis for client:', clientId);
    
    const insights = [];
    
    try {
      // Run all analyses in parallel
      const [
        workoutInsights,
        nutritionInsights,
        progressInsights,
        streakInsights,
        bonusInsights
      ] = await Promise.all([
        this.analyzeWorkouts(clientId),
        this.analyzeNutrition(clientId),
        this.analyzeProgress(clientId),
        this.analyzeStreaks(clientId),
        this.analyzeBonuses(clientId)
      ]);

      // Combine all insights
      insights.push(...workoutInsights);
      insights.push(...nutritionInsights);
      insights.push(...progressInsights);
      insights.push(...streakInsights);
      insights.push(...bonusInsights);

      // Calculate overall stats
      const stats = await this.calculateStats(clientId);

      console.log(`✅ Analysis complete: ${insights.length} insights found`);

      return {
        insights: insights.filter(i => i !== null),
        stats
      };
    } catch (error) {
      console.error('❌ Analysis error:', error);
      return { insights: [], stats: {} };
    }
  }

  // 🏋️ WORKOUT ANALYSIS
  async analyzeWorkouts(clientId) {
    const insights = [];

    try {
      // Get recent workout sessions
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: sessions } = await this.db.supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', twoWeeksAgo.toISOString())
        .order('created_at', { ascending: false });

      const { data: completions } = await this.db.supabase
        .from('workout_completions')
        .select('*')
        .eq('client_id', clientId)
        .gte('completed_at', twoWeeksAgo.toISOString());

      // Check workout frequency
      if (sessions && sessions.length > 0) {
        const uniqueDays = new Set(sessions.map(s => 
          new Date(s.created_at).toDateString()
        ));

        if (uniqueDays.size >= 10) {
          insights.push({
            type: 'workout',
            title: '🔥 Workout Machine!',
            message: `Incredible! ${uniqueDays.size} training days in 2 weeks! You're unstoppable!`,
            priority: 'normal',
            confidence: 0.95,
            data: { days: uniqueDays.size }
          });
        } else if (uniqueDays.size <= 3) {
          insights.push({
            type: 'workout',
            title: '💪 Time to Get Moving!',
            message: `Only ${uniqueDays.size} workouts in 2 weeks. Let's turn this around! Book your next session now!`,
            priority: 'high',
            confidence: 0.90,
            data: { days: uniqueDays.size }
          });
        }
      } else {
        insights.push({
          type: 'workout',
          title: '🚀 Start Your Journey!',
          message: 'No workouts logged recently. Today is the perfect day to begin! I believe in you!',
          priority: 'urgent',
          confidence: 1.0,
          data: { days: 0 }
        });
      }

      // Check for PRs
      const { data: prs } = await this.db.supabase
        .from('exercise_prs')
        .select('*')
        .eq('client_id', clientId)
        .gte('achieved_at', twoWeeksAgo.toISOString())
        .order('achieved_at', { ascending: false })
        .limit(5);

      if (prs && prs.length > 0) {
        insights.push({
          type: 'workout',
          title: '🏆 PR CRUSHER!',
          message: `${prs.length} Personal Records this week! You're getting stronger every day! 💪`,
          priority: 'normal',
          confidence: 1.0,
          data: { prCount: prs.length }
        });
      }

      // Check exercise progress
      const { data: exerciseProgress } = await this.db.supabase
        .from('exercise_progress_updates')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (exerciseProgress && exerciseProgress.length > 10) {
        // Group by exercise to find plateaus
        const exerciseGroups = {};
        exerciseProgress.forEach(ep => {
          if (!exerciseGroups[ep.exercise_name]) {
            exerciseGroups[ep.exercise_name] = [];
          }
          exerciseGroups[ep.exercise_name].push(ep.weight || ep.reps);
        });

        // Check for plateaus
        for (const [exercise, values] of Object.entries(exerciseGroups)) {
          if (values.length >= 4 && new Set(values).size === 1) {
            insights.push({
              type: 'workout',
              title: '📈 Time to Progress!',
              message: `You've been using the same weight/reps for ${exercise}. Ready to level up? Add 2.5kg next time!`,
              priority: 'high',
              confidence: 0.88,
              data: { exercise, plateauCount: values.length }
            });
            break; // Only one plateau notification
          }
        }
      }

    } catch (error) {
      console.error('Workout analysis error:', error);
    }

    return insights;
  }

  // 🥗 NUTRITION ANALYSIS
  async analyzeNutrition(clientId) {
    const insights = [];

    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Check meal progress
      const { data: mealProgress } = await this.db.supabase
        .from('meal_progress')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', oneWeekAgo.toISOString())
        .order('date', { ascending: false });

      // Check nutrition compliance
      const { data: compliance } = await this.db.supabase
        .from('nutrition_compliance')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', oneWeekAgo.toISOString());

      if (compliance && compliance.length > 0) {
        const compliantDays = compliance.filter(c => c.is_compliant).length;
        const complianceRate = (compliantDays / compliance.length) * 100;

        if (complianceRate >= 85) {
          insights.push({
            type: 'meal',
            title: '🎯 Nutrition Champion!',
            message: `${Math.round(complianceRate)}% nutrition compliance this week! Your discipline is incredible!`,
            priority: 'normal',
            confidence: 0.95,
            data: { complianceRate }
          });
        } else if (complianceRate < 50) {
          insights.push({
            type: 'meal',
            title: '🍽️ Let\'s Refocus on Nutrition',
            message: `${Math.round(complianceRate)}% compliance this week. Small improvements = big results. You got this!`,
            priority: 'high',
            confidence: 0.90,
            data: { complianceRate }
          });
        }
      }

      // Check water intake
      const { data: waterLogs } = await this.db.supabase
        .from('water_tracking')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', oneWeekAgo.toISOString());

      if (waterLogs && waterLogs.length > 0) {
        const avgWater = waterLogs.reduce((sum, w) => sum + (w.amount || 0), 0) / waterLogs.length;
        
        if (avgWater < 2000) {
          insights.push({
            type: 'meal',
            title: '💧 Hydration Alert!',
            message: `Averaging only ${Math.round(avgWater/1000)}L water per day. Aim for 2-3L for optimal performance!`,
            priority: 'normal',
            confidence: 0.85,
            data: { avgWater }
          });
        } else if (avgWater >= 3000) {
          insights.push({
            type: 'meal',
            title: '💧 Hydration Hero!',
            message: `${Math.round(avgWater/1000)}L water daily average! Perfect hydration = better results!`,
            priority: 'normal',
            confidence: 0.90,
            data: { avgWater }
          });
        }
      }

      // Check meal plan adherence
      const { data: mealPlans } = await this.db.supabase
        .from('client_meal_plans')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (!mealPlans) {
        insights.push({
          type: 'meal',
          title: '📝 No Active Meal Plan',
          message: 'You don\'t have an active meal plan. Let\'s create one together for better results!',
          priority: 'high',
          confidence: 1.0,
          data: {}
        });
      }

    } catch (error) {
      console.error('Nutrition analysis error:', error);
    }

    return insights;
  }

  // 📈 PROGRESS ANALYSIS
  async analyzeProgress(clientId) {
    const insights = [];

    try {
      // Check weight tracking
      const { data: weights } = await this.db.supabase
        .from('weight_tracking')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(10);

      if (weights && weights.length >= 3) {
        // Calculate trend
        const recentWeights = weights.slice(0, 3);
        const olderWeights = weights.slice(-3);
        
        const recentAvg = recentWeights.reduce((sum, w) => sum + w.weight, 0) / recentWeights.length;
        const olderAvg = olderWeights.reduce((sum, w) => sum + w.weight, 0) / olderWeights.length;
        const change = recentAvg - olderAvg;

        if (Math.abs(change) > 0.5) {
          const direction = change > 0 ? 'up' : 'down';
          const emoji = change > 0 ? '📈' : '📉';
          
          insights.push({
            type: 'progress',
            title: `${emoji} Weight Trending ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
            message: `${Math.abs(change).toFixed(1)}kg change detected. ${change < 0 ? 'Great progress!' : 'Bulk mode activated!'} Keep tracking!`,
            priority: 'normal',
            confidence: 0.88,
            data: { change, direction }
          });
        }

        // Check consistency
        const daysBetween = [];
        for (let i = 0; i < weights.length - 1; i++) {
          const diff = Math.abs(
            (new Date(weights[i].date) - new Date(weights[i + 1].date)) / (1000 * 60 * 60 * 24)
          );
          daysBetween.push(diff);
        }

        const avgDaysBetween = daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length;

        if (avgDaysBetween <= 3) {
          insights.push({
            type: 'progress',
            title: '⚖️ Tracking Master!',
            message: 'Perfect weight tracking consistency! Data drives progress. Keep it up!',
            priority: 'normal',
            confidence: 0.90,
            data: { avgDaysBetween }
          });
        } else if (avgDaysBetween >= 7) {
          insights.push({
            type: 'progress',
            title: '⚖️ Time for a Weigh-In',
            message: `Last weight log was ${Math.round(daysBetween[0])} days ago. Hop on the scale for accurate tracking!`,
            priority: 'normal',
            confidence: 0.85,
            data: { daysSince: Math.round(daysBetween[0]) }
          });
        }
      } else if (!weights || weights.length === 0) {
        insights.push({
          type: 'progress',
          title: '📊 Start Tracking Weight',
          message: 'No weight entries found. Regular tracking = visible progress. Start today!',
          priority: 'high',
          confidence: 1.0,
          data: {}
        });
      }

      // Check body measurements
      const { data: measurements } = await this.db.supabase
        .from('body_measurements')
        .select('*')
        .eq('client_id', clientId)
        .order('measured_at', { ascending: false })
        .limit(5);

      if (!measurements || measurements.length === 0) {
        insights.push({
          type: 'progress',
          title: '📏 Take Measurements',
          message: 'No body measurements yet. Measurements show progress the scale doesn\'t! Let\'s measure today!',
          priority: 'normal',
          confidence: 0.95,
          data: {}
        });
      }

      // Check progress photos
      const { data: photos } = await this.db.supabase
        .from('progress_photos')
        .select('*')
        .eq('client_id', clientId)
        .order('taken_at', { ascending: false })
        .limit(5);

      if (!photos || photos.length === 0) {
        insights.push({
          type: 'progress',
          title: '📸 Photo Time!',
          message: 'No progress photos yet. Photos reveal changes you can\'t see daily. Take your first today!',
          priority: 'normal',
          confidence: 0.95,
          data: {}
        });
      } else if (photos.length > 0) {
        const daysSincePhoto = Math.floor(
          (new Date() - new Date(photos[0].taken_at)) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSincePhoto >= 14) {
          insights.push({
            type: 'progress',
            title: '📸 New Photo Time!',
            message: `${daysSincePhoto} days since last photo. Time to capture your progress!`,
            priority: 'normal',
            confidence: 0.85,
            data: { daysSincePhoto }
          });
        }
      }

    } catch (error) {
      console.error('Progress analysis error:', error);
    }

    return insights;
  }

  // 🔥 STREAK ANALYSIS
  async analyzeStreaks(clientId) {
    const insights = [];

    try {
      // Workout streak
      const { data: workoutDates } = await this.db.supabase
        .from('workout_completions')
        .select('completed_at')
        .eq('client_id', clientId)
        .order('completed_at', { ascending: false })
        .limit(30);

      if (workoutDates && workoutDates.length > 0) {
        const streak = this.calculateStreak(workoutDates.map(w => w.completed_at));
        
        if (streak >= 3 && streak < 7) {
          insights.push({
            type: 'streak',
            title: '🔥 Streak Alert!',
            message: `${streak} day workout streak! Keep going for a full week!`,
            priority: 'normal',
            confidence: 0.95,
            data: { streak, type: 'workout' }
          });
        } else if (streak >= 7) {
          insights.push({
            type: 'streak',
            title: '🏆 Streak Master!',
            message: `AMAZING! ${streak} day workout streak! You're officially unstoppable!`,
            priority: 'normal',
            confidence: 0.95,
            data: { streak, type: 'workout' }
          });
        }
      }

      // Check-in streak
      const { data: checkIns } = await this.db.supabase
        .from('daily_checklist')
        .select('completed_at')
        .eq('client_id', clientId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(30);

      if (checkIns && checkIns.length >= 5) {
        const checkInStreak = this.calculateStreak(checkIns.map(c => c.completed_at));
        
        if (checkInStreak >= 5) {
          insights.push({
            type: 'streak',
            title: '✅ Check-in Champion!',
            message: `${checkInStreak} day check-in streak! Consistency is your superpower!`,
            priority: 'normal',
            confidence: 0.90,
            data: { streak: checkInStreak, type: 'checkin' }
          });
        }
      }

      // Water streak
      const { data: waterDays } = await this.db.supabase
        .from('water_tracking')
        .select('date, amount')
        .eq('client_id', clientId)
        .gte('amount', 2000)
        .order('date', { ascending: false })
        .limit(14);

      if (waterDays && waterDays.length >= 3) {
        const waterStreak = this.calculateStreak(waterDays.map(w => w.date));
        
        if (waterStreak >= 3) {
          insights.push({
            type: 'streak',
            title: '💧 Hydration Streak!',
            message: `${waterStreak} days hitting your water goal! Your body thanks you!`,
            priority: 'normal',
            confidence: 0.85,
            data: { streak: waterStreak, type: 'water' }
          });
        }
      }

    } catch (error) {
      console.error('Streak analysis error:', error);
    }

    return insights;
  }

  // 🎁 BONUS ANALYSIS
  async analyzeBonuses(clientId) {
    const insights = [];

    try {
      // Check earned bonuses
      const { data: bonuses } = await this.db.supabase
        .from('client_bonuses')
        .select('*, bonuses(*)')
        .eq('client_id', clientId)
        .order('earned_at', { ascending: false })
        .limit(5);

      if (bonuses && bonuses.length > 0) {
        const recentBonus = bonuses[0];
        const daysSince = Math.floor(
          (new Date() - new Date(recentBonus.earned_at)) / (1000 * 60 * 60 * 24)
        );

        if (daysSince <= 1) {
          insights.push({
            type: 'bonus',
            title: '🎁 Bonus Unlocked!',
            message: `You earned "${recentBonus.bonuses?.name}"! Your hard work is paying off!`,
            priority: 'normal',
            confidence: 1.0,
            data: { bonusName: recentBonus.bonuses?.name }
          });
        }
      }

      // Check goals
      const { data: goals } = await this.db.supabase
        .from('client_goals')
        .select('*, goals(*)')
        .eq('client_id', clientId)
        .eq('status', 'active');

      if (goals && goals.length > 0) {
        const nearCompletion = goals.filter(g => g.progress >= 80 && g.progress < 100);
        
        if (nearCompletion.length > 0) {
          insights.push({
            type: 'goal',
            title: '🎯 Goal Almost Complete!',
            message: `You're ${nearCompletion[0].progress}% done with "${nearCompletion[0].goals?.name}". Final push!`,
            priority: 'high',
            confidence: 0.95,
            data: { 
              goalName: nearCompletion[0].goals?.name,
              progress: nearCompletion[0].progress
            }
          });
        }
      }

    } catch (error) {
      console.error('Bonus analysis error:', error);
    }

    return insights;
  }

  // 📊 CALCULATE OVERALL STATS
  async calculateStats(clientId) {
    const stats = {
      workoutConsistency: 0,
      nutritionAdherence: 0,
      progressRate: 'unknown',
      riskOfDropout: 'unknown',
      totalWorkouts: 0,
      currentStreaks: 0,
      bonusesEarned: 0
    };

    try {
      // Workout consistency (last 14 days)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const { data: workouts } = await this.db.supabase
        .from('workout_completions')
        .select('completed_at')
        .eq('client_id', clientId)
        .gte('completed_at', twoWeeksAgo.toISOString());

      if (workouts) {
        const uniqueDays = new Set(workouts.map(w => 
          new Date(w.completed_at).toDateString()
        )).size;
        stats.workoutConsistency = Math.min(100, Math.round((uniqueDays / 14) * 100));
        stats.totalWorkouts = workouts.length;
      }

      // Nutrition adherence (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data: compliance } = await this.db.supabase
        .from('nutrition_compliance')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', oneWeekAgo.toISOString());

      if (compliance && compliance.length > 0) {
        const compliantDays = compliance.filter(c => c.is_compliant).length;
        stats.nutritionAdherence = Math.round((compliantDays / compliance.length) * 100);
      }

      // Count bonuses
      const { data: bonuses } = await this.db.supabase
        .from('client_bonuses')
        .select('id')
        .eq('client_id', clientId);

      if (bonuses) {
        stats.bonusesEarned = bonuses.length;
      }

      // Determine progress rate
      if (stats.workoutConsistency >= 70 && stats.nutritionAdherence >= 70) {
        stats.progressRate = 'excellent';
      } else if (stats.workoutConsistency >= 50 || stats.nutritionAdherence >= 50) {
        stats.progressRate = 'steady';
      } else {
        stats.progressRate = 'slow';
      }

      // Determine risk of dropout
      if (stats.workoutConsistency < 30 && stats.nutritionAdherence < 30) {
        stats.riskOfDropout = 'high';
      } else if (stats.workoutConsistency < 50 || stats.nutritionAdherence < 50) {
        stats.riskOfDropout = 'medium';
      } else {
        stats.riskOfDropout = 'low';
      }

    } catch (error) {
      console.error('Stats calculation error:', error);
    }

    return stats;
  }

  // HELPER: Calculate streak from dates
  calculateStreak(dates) {
    if (!dates || dates.length === 0) return 0;

    const sortedDates = dates
      .map(d => new Date(d))
      .sort((a, b) => b - a);

    let streak = 1;
    let lastDate = sortedDates[0];

    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      const dayDiff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff <= 1) {
        streak++;
        lastDate = currentDate;
      } else {
        break;
      }
    }

    return streak;
  }
}

export default RealAIAnalysis;
