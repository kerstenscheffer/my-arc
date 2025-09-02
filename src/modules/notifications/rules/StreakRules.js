// StreakRules.js - Advanced Streak Detection System

class StreakRules {
  constructor(databaseService) {
    this.db = databaseService;
  }

  async analyze(clientId) {
    const insights = [];

    // Analyze multiple streak types
    const [
      workoutStreak,
      proteinStreak,
      waterStreak,
      checkInStreak,
      weightLogStreak
    ] = await Promise.all([
      this.checkWorkoutStreak(clientId),
      this.checkProteinStreak(clientId),
      this.checkWaterStreak(clientId),
      this.checkCheckInStreak(clientId),
      this.checkWeightLogStreak(clientId)
    ]);

    // Add insights for each streak
    if (workoutStreak) insights.push(workoutStreak);
    if (proteinStreak) insights.push(proteinStreak);
    if (waterStreak) insights.push(waterStreak);
    if (checkInStreak) insights.push(checkInStreak);
    if (weightLogStreak) insights.push(weightLogStreak);

    // Check for broken streaks (motivational recovery)
    const brokenStreaks = await this.checkBrokenStreaks(clientId);
    if (brokenStreaks) insights.push(brokenStreaks);

    return insights;
  }

  async checkWorkoutStreak(clientId) {
    const { data: workouts } = await this.db.supabase
      .from('workout_logs')
      .select('created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!workouts || workouts.length < 3) return null;

    const streak = this.calculateStreak(workouts.map(w => w.created_at));
    
    if (streak >= 3) {
      // Different messages for different streak lengths
      if (streak === 3) {
        return {
          rule: {
            id: 'workout-streak-start',
            name: '🔥 Streak Started!',
            type: 'streak',
            message_template: '3 dagen op rij! Je bent on fire! Keep it going! 💪'
          },
          data: { days: streak }
        };
      } else if (streak === 7) {
        return {
          rule: {
            id: 'workout-streak-week',
            name: '🏆 Week Warrior',
            type: 'streak',
            message_template: 'WAUW! Een hele week non-stop training! Je bent een machine! 🚀'
          },
          data: { days: streak }
        };
      } else if (streak === 14) {
        return {
          rule: {
            id: 'workout-streak-fortnight',
            name: '💎 Diamond Status',
            type: 'streak',
            message_template: '2 weken streak! Dit is elite niveau. Respect! 💎'
          },
          data: { days: streak }
        };
      } else if (streak === 30) {
        return {
          rule: {
            id: 'workout-streak-month',
            name: '👑 Legend Status',
            type: 'streak',
            message_template: '30 DAGEN STREAK! Je bent officieel een LEGEND! 👑🔥'
          },
          data: { days: streak }
        };
      } else if (streak % 10 === 0) {
        return {
          rule: {
            id: 'workout-streak-milestone',
            name: '🎯 Milestone Unlocked',
            type: 'streak',
            message_template: '{days} dagen streak! Je blijft maar doorgaan! 🎯'
          },
          data: { days: streak }
        };
      }
    }

    return null;
  }

  async checkProteinStreak(clientId) {
    const { data: meals } = await this.db.supabase
      .from('meal_tracking')
      .select('date, protein, protein_goal')
      .eq('client_id', clientId)
      .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (!meals || meals.length < 3) return null;

    const goalMetDays = meals.filter(m => m.protein >= m.protein_goal);
    const streak = this.calculateStreak(goalMetDays.map(m => m.date));

    if (streak >= 5) {
      return {
        rule: {
          id: 'protein-streak',
          name: '🥩 Protein Power',
          type: 'meal',
          message_template: '{days} dagen je eiwitdoel gehaald! Je spieren groeien als kool! 💪'
        },
        data: { days: streak }
      };
    }

    return null;
  }

  async checkWaterStreak(clientId) {
    const { data: hydration } = await this.db.supabase
      .from('hydration_logs')
      .select('date, amount')
      .eq('client_id', clientId)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (!hydration || hydration.length < 3) return null;

    const goalMetDays = hydration.filter(h => h.amount >= 2000); // 2L minimum
    const streak = this.calculateStreak(goalMetDays.map(h => h.date));

    if (streak >= 3) {
      return {
        rule: {
          id: 'water-streak',
          name: '💧 Hydration Hero',
          type: 'meal',
          message_template: '{days} dagen perfect gehydrateerd! Je lichaam bedankt je! 💧'
        },
        data: { days: streak }
      };
    }

    return null;
  }

  async checkCheckInStreak(clientId) {
    // Check for consistent weekly check-ins
    const { data: checkIns } = await this.db.supabase
      .from('check_ins')
      .select('created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!checkIns || checkIns.length < 2) return null;

    // Calculate weeks with check-ins
    const weeks = new Set();
    checkIns.forEach(ci => {
      const date = new Date(ci.created_at);
      const weekNum = this.getWeekNumber(date);
      weeks.add(weekNum);
    });

    if (weeks.size >= 4) {
      return {
        rule: {
          id: 'checkin-streak',
          name: '📊 Consistency King',
          type: 'progress',
          message_template: '{weeks} weken op rij ingecheckt! Consistency is key! 📊'
        },
        data: { weeks: weeks.size }
      };
    }

    return null;
  }

  async checkWeightLogStreak(clientId) {
    const { data: weights } = await this.db.supabase
      .from('weight_logs')
      .select('date')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(14);

    if (!weights || weights.length < 3) return null;

    // Check for at least 3 logs per week for 2 weeks
    const weeks = {};
    weights.forEach(w => {
      const weekNum = this.getWeekNumber(new Date(w.date));
      weeks[weekNum] = (weeks[weekNum] || 0) + 1;
    });

    const consistentWeeks = Object.values(weeks).filter(count => count >= 3).length;

    if (consistentWeeks >= 2) {
      return {
        rule: {
          id: 'weight-tracking-consistency',
          name: '⚖️ Tracking Master',
          type: 'progress',
          message_template: 'Perfect tracking voor {weeks} weken! Data = Progress! 📈'
        },
        data: { weeks: consistentWeeks }
      };
    }

    return null;
  }

  async checkBrokenStreaks(clientId) {
    // Check if a streak was recently broken (motivational recovery)
    const { data: recentWorkouts } = await this.db.supabase
      .from('workout_logs')
      .select('created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentWorkouts || recentWorkouts.length < 5) return null;

    // Check for gap in dates
    const dates = recentWorkouts.map(w => new Date(w.created_at));
    const daysSinceLastWorkout = Math.floor((new Date() - dates[0]) / (1000 * 60 * 60 * 24));

    if (daysSinceLastWorkout >= 3 && daysSinceLastWorkout <= 5) {
      return {
        rule: {
          id: 'streak-recovery',
          name: '💪 Comeback Time',
          type: 'workout',
          message_template: 'Hey warrior! {days} dagen geen workout gezien. Tijd voor een epic comeback! 🚀'
        },
        data: { days: daysSinceLastWorkout }
      };
    }

    return null;
  }

  // Helper functions
  calculateStreak(dates) {
    if (!dates || dates.length === 0) return 0;

    // Sort dates in descending order
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

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
}

export default StreakRules;
