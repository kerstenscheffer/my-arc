// ============================================
// CHALLENGES SERVICE - Database Integration
// Add these methods to DatabaseService.js
// ============================================

// Add to existing DatabaseService class:

// ==================== CHALLENGES SYSTEM ====================

// Get all available challenges
async getChallenges(category = null) {
  try {
    let query = this.supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('difficulty', { ascending: true });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return [];
  }
}

// Get single challenge details
async getChallenge(challengeId) {
  try {
    const { data, error } = await this.supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return null;
  }
}

// Get client's active challenges
async getClientActiveChallenges(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('client_challenges')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('client_id', clientId)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Merge challenge data into main object
    return data.map(item => ({
      ...item,
      ...item.challenge,
      client_challenge_id: item.id,
      progress_percentage: item.progress_percentage,
      current_streak: item.current_streak,
      is_money_back_challenge: item.is_money_back_challenge,
      money_back_number: item.money_back_number
    }));
  } catch (error) {
    console.error('Error fetching client challenges:', error);
    return [];
  }
}

// Start a new challenge for client
async startClientChallenge(challengeData) {
  try {
    const challenge = await this.getChallenge(challengeData.challenge_id);
    if (!challenge) throw new Error('Challenge not found');
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + challenge.duration_days);
    
    const { data, error } = await this.supabase
      .from('client_challenges')
      .insert({
        client_id: challengeData.client_id,
        challenge_id: challengeData.challenge_id,
        status: 'active',
        is_money_back_challenge: challengeData.is_money_back_challenge || false,
        money_back_number: challengeData.money_back_number || null,
        target_end_date: endDate.toISOString().split('T')[0],
        motivation_reason: challengeData.motivation || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Create initial milestones
    if (challenge.milestones && challenge.milestones.length > 0) {
      await this.createChallengeMilestones(data.id, challenge.milestones);
    }
    
    // Send notification
    await this.sendNotification(
      challengeData.client_id,
      'challenge_started',
      `🎯 Challenge "${challenge.name}" gestart! Je hebt ${challenge.duration_days} dagen om deze te voltooien!`
    );
    
    return data;
  } catch (error) {
    console.error('Error starting challenge:', error);
    throw error;
  }
}

// Update challenge progress
async updateChallengeProgress(clientChallengeId, progressData) {
  try {
    const updates = {
      progress_percentage: progressData.progress,
      current_streak: progressData.streak || 0,
      updated_at: new Date().toISOString()
    };
    
    if (progressData.milestone_completed) {
      updates.completed_milestones = progressData.completed_milestones;
      updates.current_milestone_index = progressData.current_milestone_index;
    }
    
    if (progressData.progress >= 100) {
      updates.status = 'completed';
      updates.actual_end_date = new Date().toISOString().split('T')[0];
    }
    
    const { data, error } = await this.supabase
      .from('client_challenges')
      .update(updates)
      .eq('id', clientChallengeId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Award points if completed
    if (data.status === 'completed') {
      await this.awardChallengeCompletion(data);
    }
    
    return data;
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    throw error;
  }
}

// Log daily challenge activity
async logChallengeDaily(clientChallengeId, logData) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await this.supabase
      .from('challenge_daily_logs')
      .upsert({
        client_challenge_id: clientChallengeId,
        log_date: today,
        completed: logData.completed || false,
        workout_completed: logData.workout_completed || null,
        meal_plan_followed: logData.meal_followed || null,
        water_intake: logData.water || null,
        custom_metrics: logData.custom || {},
        notes: logData.notes || null,
        photo_url: logData.photo || null,
        points_earned: logData.completed ? 10 : 0
      }, {
        onConflict: 'client_challenge_id,log_date'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update streak
    if (logData.completed) {
      await this.updateChallengeStreak(clientChallengeId);
    }
    
    return data;
  } catch (error) {
    console.error('Error logging daily challenge:', error);
    throw error;
  }
}

// Update challenge streak
async updateChallengeStreak(clientChallengeId) {
  try {
    // Get last 7 days of logs
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    
    const { data: logs, error: logError } = await this.supabase
      .from('challenge_daily_logs')
      .select('log_date, completed')
      .eq('client_challenge_id', clientChallengeId)
      .gte('log_date', startDate.toISOString().split('T')[0])
      .lte('log_date', endDate.toISOString().split('T')[0])
      .order('log_date', { ascending: false });
    
    if (logError) throw logError;
    
    // Calculate current streak
    let streak = 0;
    for (const log of logs) {
      if (log.completed) {
        streak++;
      } else {
        break;
      }
    }
    
    // Update client challenge
    const { data, error } = await this.supabase
      .from('client_challenges')
      .update({
        current_streak: streak,
        longest_streak: this.supabase.sql`GREATEST(longest_streak, ${streak})`
      })
      .eq('id', clientChallengeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
}

// Get challenge leaderboard
async getChallengeLeaderboard(challengeId, limit = 10) {
  try {
    const { data, error } = await this.supabase
      .from('challenge_leaderboard')
      .select(`
        *,
        client:clients(first_name, last_name, avatar_url)
      `)
      .eq('challenge_id', challengeId)
      .order('rank', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Award challenge completion
async awardChallengeCompletion(challengeData) {
  try {
    const challenge = await this.getChallenge(challengeData.challenge_id);
    
    // Calculate total points
    const totalPoints = challenge.base_points + 
                       challenge.completion_bonus + 
                       (challengeData.current_streak * 10);
    
    // Create reward record
    const { data: reward, error: rewardError } = await this.supabase
      .from('challenge_rewards')
      .insert({
        client_id: challengeData.client_id,
        challenge_id: challengeData.challenge_id,
        reward_type: 'completion',
        reward_value: {
          points: totalPoints,
          badge: challenge.name,
          completion_date: new Date().toISOString()
        },
        badge_name: `${challenge.name} Champion`,
        badge_icon: '🏆',
        badge_color: '#fbbf24'
      })
      .select()
      .single();
    
    if (rewardError) throw rewardError;
    
    // Check money back eligibility
    if (challengeData.is_money_back_challenge) {
      await this.checkMoneyBackEligibility(challengeData.client_id);
    }
    
    // Send completion notification
    await this.sendNotification(
      challengeData.client_id,
      'challenge_completed',
      `🎉 GEFELICITEERD! Je hebt "${challenge.name}" voltooid en ${totalPoints} punten verdiend!`
    );
    
    return reward;
  } catch (error) {
    console.error('Error awarding completion:', error);
    throw error;
  }
}

// Check if client completed 3 money back challenges
async checkMoneyBackEligibility(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('client_challenges')
      .select('id, money_back_number')
      .eq('client_id', clientId)
      .eq('is_money_back_challenge', true)
      .eq('status', 'completed');
    
    if (error) throw error;
    
    if (data.length >= 3) {
      // Client is eligible for money back!
      await this.sendNotification(
        clientId,
        'money_back_earned',
        '💰 GEFELICITEERD! Je hebt 3 challenges voltooid en komt in aanmerking voor 100% GELD TERUG!'
      );
      
      // Create money back reward
      await this.supabase
        .from('challenge_rewards')
        .insert({
          client_id: clientId,
          challenge_id: null,
          reward_type: 'money_back',
          reward_value: {
            status: 'eligible',
            completed_challenges: data.map(c => c.money_back_number),
            date: new Date().toISOString()
          },
          badge_name: '💰 Money Back Champion',
          badge_icon: '💰',
          badge_color: '#fbbf24'
        });
    }
    
    return data.length >= 3;
  } catch (error) {
    console.error('Error checking money back:', error);
    return false;
  }
}

// Pause a challenge
async pauseChallenge(clientChallengeId) {
  try {
    const { data, error } = await this.supabase
      .from('client_challenges')
      .update({
        status: 'paused',
        paused_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', clientChallengeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error pausing challenge:', error);
    throw error;
  }
}

// Resume a challenge
async resumeChallenge(clientChallengeId) {
  try {
    const { data, error } = await this.supabase
      .from('client_challenges')
      .update({
        status: 'active',
        paused_date: null
      })
      .eq('id', clientChallengeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error resuming challenge:', error);
    throw error;
  }
}

// Create milestones for a challenge
async createChallengeMilestones(clientChallengeId, milestones) {
  try {
    const milestoneRecords = milestones.map((milestone, index) => ({
      client_challenge_id: clientChallengeId,
      milestone_index: index,
      title: milestone.title,
      description: milestone.description,
      target_value: milestone.target_value || null,
      unit: milestone.unit || null,
      points_value: milestone.points || 50
    }));
    
    const { error } = await this.supabase
      .from('challenge_milestones')
      .insert(milestoneRecords);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating milestones:', error);
    return false;
  }
}
