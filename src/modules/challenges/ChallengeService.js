// src/modules/challenges/ChallengeService.js
// Challenge System Service - Extends DatabaseService
// Integrates met bestaand Goals System

import DatabaseService from '../../services/DatabaseService'

// ===== CHALLENGE SYSTEM SERVICE METHODS =====
// Voeg deze methods toe aan DatabaseService.js

// ===== COACH CHALLENGE MANAGEMENT =====

DatabaseService.createChallenge = async function(challengeData) {
  try {
    const { data, error } = await this.supabase
      .from('challenges')
      .insert({
        coach_id: challengeData.coach_id,
        title: challengeData.title,
        description: challengeData.description,
        category: challengeData.category,
        default_duration_weeks: challengeData.duration_weeks || 4,
        is_template: challengeData.is_template || false,
        template_name: challengeData.template_name
      })
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Challenge created:', data.title)
    return data
  } catch (error) {
    console.error('❌ Create challenge failed:', error)
    throw error
  }
}

DatabaseService.createChallengeStrategy = async function(challengeId, strategyWeeks) {
  try {
    const strategyEntries = strategyWeeks.map((week, index) => ({
      challenge_id: challengeId,
      week_number: index + 1,
      week_title: week.title,
      week_description: week.description,
      primary_target: week.primary_target,
      target_value: week.target_value,
      target_unit: week.target_unit,
      frequency_target: week.frequency_target || 3,
      checkpoint_title: week.checkpoint_title,
      checkpoint_description: week.checkpoint_description,
      checkpoint_type: week.checkpoint_type || 'performance',
      secondary_targets: week.secondary_targets || []
    }))
    
    const { data, error } = await this.supabase
      .from('challenge_strategy')
      .insert(strategyEntries)
      .select()
    
    if (error) throw error
    console.log('✅ Challenge strategy created:', data.length, 'weeks')
    return data
  } catch (error) {
    console.error('❌ Create challenge strategy failed:', error)
    throw error
  }
}

DatabaseService.getChallenges = async function(coachId) {
  try {
    const { data, error } = await this.supabase
      .from('challenges')
      .select(`
        *,
        challenge_strategy (
          week_number,
          week_title,
          primary_target,
          target_value,
          target_unit,
          checkpoint_title
        )
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get challenges failed:', error)
    return []
  }
}

DatabaseService.getChallengeTemplates = async function(category = null) {
  try {
    let query = this.supabase
      .from('challenge_templates')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false })
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get challenge templates failed:', error)
    return []
  }
}

// ===== CLIENT CHALLENGE ASSIGNMENT =====

DatabaseService.assignChallengeToClient = async function(challengeId, clientId, coachId, customStartDate = null) {
  try {
    const startDate = customStartDate || new Date().toISOString().split('T')[0]
    
    // 1. Create client challenge assignment
    const { data: clientChallenge, error: assignError } = await this.supabase
      .from('client_challenges')
      .insert({
        challenge_id: challengeId,
        client_id: clientId,
        coach_id: coachId,
        start_date: startDate,
        status: 'active'
      })
      .select()
      .single()
    
    if (assignError) throw assignError
    
    // 2. Create corresponding goal using existing goal system
    await this.createGoalFromChallenge(clientChallenge.id)
    
    // 3. Send notification to client
    await this.createNotification({
      client_id: clientId,
      type: 'challenge_assigned',
      priority: 'high',
      title: '🎯 Nieuwe Challenge Ontvangen!',
      message: 'Je coach heeft een nieuwe challenge voor je klaargezet. Check je goals!',
      action_type: 'challenge',
      action_target: clientChallenge.id,
      action_label: 'Bekijk Challenge'
    })
    
    console.log('✅ Challenge assigned to client:', clientChallenge.id)
    return clientChallenge
  } catch (error) {
    console.error('❌ Assign challenge failed:', error)
    throw error
  }
}

DatabaseService.createGoalFromChallenge = async function(clientChallengeId) {
  try {
    // Get challenge details
    const { data: challengeData, error: challengeError } = await this.supabase
      .from('client_challenges')
      .select(`
        *,
        challenges (
          title,
          description,
          category,
          default_duration_weeks
        )
      `)
      .eq('id', clientChallengeId)
      .single()
    
    if (challengeError) throw challengeError
    
    const challenge = challengeData.challenges
    
    // Create main goal
    const { data: goal, error: goalError } = await this.supabase
      .from('client_goals')
      .insert({
        client_id: challengeData.client_id,
        title: `${challenge.title} Challenge`,
        goal_type: 'challenge',
        category: challenge.category,
        main_category: challenge.category,
        target_value: 100, // percentage completion
        current_value: 0,
        target_date: challengeData.end_date,
        status: 'active',
        frequency: 'weekly',
        frequency_target: 3,
        notes: `Challenge: ${challenge.description}`,
        challenge_id: challengeData.challenge_id,
        measurement_type: 'number',
        unit: '%',
        color: this.getCategoryColor(challenge.category),
        icon: 'target'
      })
      .select()
      .single()
    
    if (goalError) throw goalError
    
    // Get strategy and create milestones
    const { data: strategy, error: strategyError } = await this.supabase
      .from('challenge_strategy')
      .select('*')
      .eq('challenge_id', challengeData.challenge_id)
      .order('week_number')
    
    if (strategyError) throw strategyError
    
    // Create milestone for each week
    const milestones = strategy.map(week => ({
      goal_id: goal.id,
      title: week.checkpoint_title || `Week ${week.week_number}: ${week.week_title}`,
      target_value: week.target_value,
      unit: week.target_unit,
      target_date: new Date(new Date(challengeData.start_date).getTime() + (week.week_number * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      order_index: week.week_number,
      icon: 'flag',
      notes: week.checkpoint_description
    }))
    
    if (milestones.length > 0) {
      const { error: milestoneError } = await this.supabase
        .from('goal_milestones')
        .insert(milestones)
      
      if (milestoneError) throw milestoneError
    }
    
    console.log('✅ Goal created from challenge:', goal.title)
    return goal
  } catch (error) {
    console.error('❌ Create goal from challenge failed:', error)
    throw error
  }
}

// ===== CLIENT CHALLENGE PROGRESS =====

DatabaseService.getClientChallenges = async function(clientId) {
  try {
    const { data, error } = await this.supabase
      .from('client_challenges')
      .select(`
        *,
        challenges (
          title,
          description,
          category
        ),
        challenge_progress (
          week_number,
          target_achieved,
          actual_value,
          checkpoint_passed,
          week_rating,
          notes
        )
      `)
      .eq('client_id', clientId)
      .order('assigned_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get client challenges failed:', error)
    return []
  }
}

DatabaseService.getChallengeStrategy = async function(challengeId) {
  try {
    const { data, error } = await this.supabase
      .from('challenge_strategy')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('week_number')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Get challenge strategy failed:', error)
    return []
  }
}

DatabaseService.updateChallengeProgress = async function(clientChallengeId, weekNumber, progressData) {
  try {
    const { data, error } = await this.supabase
      .from('challenge_progress')
      .upsert({
        client_challenge_id: clientChallengeId,
        week_number: weekNumber,
        target_achieved: progressData.target_achieved,
        actual_value: progressData.actual_value,
        target_value: progressData.target_value,
        checkpoint_passed: progressData.checkpoint_passed,
        checkpoint_notes: progressData.checkpoint_notes,
        week_rating: progressData.week_rating,
        notes: progressData.notes,
        week_start_date: progressData.week_start_date,
        week_end_date: progressData.week_end_date,
        completed_at: progressData.target_achieved ? new Date().toISOString() : null
      }, {
        onConflict: 'client_challenge_id,week_number'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Update overall challenge progress
    await this.updateChallengeCompletionPercentage(clientChallengeId)
    
    // Update corresponding goal progress
    await this.updateGoalFromChallengeProgress(clientChallengeId, progressData)
    
    console.log('✅ Challenge progress updated:', weekNumber)
    return data
  } catch (error) {
    console.error('❌ Update challenge progress failed:', error)
    throw error
  }
}

DatabaseService.updateChallengeCompletionPercentage = async function(clientChallengeId) {
  try {
    // Calculate completion percentage based on achieved weeks
    const { data: progress, error: progressError } = await this.supabase
      .from('challenge_progress')
      .select('target_achieved')
      .eq('client_challenge_id', clientChallengeId)
    
    if (progressError) throw progressError
    
    const totalWeeks = progress.length
    const achievedWeeks = progress.filter(p => p.target_achieved).length
    const completionPercentage = totalWeeks > 0 ? Math.round((achievedWeeks / totalWeeks) * 100) : 0
    
    const { error: updateError } = await this.supabase
      .from('client_challenges')
      .update({
        completion_percentage: completionPercentage,
        current_week: Math.min(totalWeeks, achievedWeeks + 1),
        last_progress_update: new Date().toISOString(),
        status: completionPercentage === 100 ? 'completed' : 'active',
        completed_at: completionPercentage === 100 ? new Date().toISOString() : null
      })
      .eq('id', clientChallengeId)
    
    if (updateError) throw updateError
    
    // Send achievement notification if completed
    if (completionPercentage === 100) {
      const { data: challengeData } = await this.supabase
        .from('client_challenges')
        .select('client_id, challenges(title)')
        .eq('id', clientChallengeId)
        .single()
      
      if (challengeData) {
        await this.createNotification({
          client_id: challengeData.client_id,
          type: 'challenge_completed',
          priority: 'high',
          title: '🏆 Challenge Voltooid!',
          message: `Gefeliciteerd! Je hebt de "${challengeData.challenges.title}" challenge succesvol afgerond!`,
          action_type: 'celebration',
          action_target: clientChallengeId,
          action_label: 'Vier het!'
        })
      }
    }
    
    return completionPercentage
  } catch (error) {
    console.error('❌ Update challenge completion failed:', error)
    throw error
  }
}

DatabaseService.updateGoalFromChallengeProgress = async function(clientChallengeId, progressData) {
  try {
    // Find corresponding goal
    const { data: challenge, error: challengeError } = await this.supabase
      .from('client_challenges')
      .select('client_id, challenge_id')
      .eq('id', clientChallengeId)
      .single()
    
    if (challengeError) throw challengeError
    
    const { data: goal, error: goalError } = await this.supabase
      .from('client_goals')
      .select('id')
      .eq('client_id', challenge.client_id)
      .eq('challenge_id', challenge.challenge_id)
      .single()
    
    if (goalError) return // Goal might not exist, that's ok
    
    // Update goal progress
    const completionPercentage = await this.updateChallengeCompletionPercentage(clientChallengeId)
    
    await this.supabase
      .from('client_goals')
      .update({
        current_value: completionPercentage,
        status: completionPercentage === 100 ? 'completed' : 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', goal.id)
    
    console.log('✅ Goal updated from challenge progress:', completionPercentage + '%')
  } catch (error) {
    console.error('❌ Update goal from challenge progress failed:', error)
  }
}

// ===== CHALLENGE ANALYTICS =====

DatabaseService.getChallengeAnalytics = async function(coachId, challengeId = null) {
  try {
    let query = this.supabase
      .from('client_challenges')
      .select(`
        *,
        challenges (title, category),
        challenge_progress (
          target_achieved,
          checkpoint_passed,
          week_rating
        )
      `)
      .eq('coach_id', coachId)
    
    if (challengeId) {
      query = query.eq('challenge_id', challengeId)
    }
    
    const { data, error } = await query
    if (error) throw error
    
    // Calculate analytics
    const totalAssigned = data.length
    const completed = data.filter(c => c.status === 'completed').length
    const active = data.filter(c => c.status === 'active').length
    const averageCompletion = data.length > 0 
      ? data.reduce((sum, c) => sum + c.completion_percentage, 0) / data.length 
      : 0
    
    const weeklySuccess = {}
    data.forEach(challenge => {
      challenge.challenge_progress.forEach(progress => {
        const week = `week_${progress.week_number || 1}`
        if (!weeklySuccess[week]) {
          weeklySuccess[week] = { total: 0, achieved: 0 }
        }
        weeklySuccess[week].total++
        if (progress.target_achieved) {
          weeklySuccess[week].achieved++
        }
      })
    })
    
    return {
      totalAssigned,
      completed,
      active,
      averageCompletion: Math.round(averageCompletion),
      successRate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0,
      weeklySuccess,
      challengeData: data
    }
  } catch (error) {
    console.error('❌ Get challenge analytics failed:', error)
    return {
      totalAssigned: 0,
      completed: 0,
      active: 0,
      averageCompletion: 0,
      successRate: 0,
      weeklySuccess: {},
      challengeData: []
    }
  }
}

// ===== UTILITY FUNCTIONS =====

DatabaseService.getCategoryColor = function(category) {
  const colors = {
    running: '#ef4444',
    workout: '#f59e0b', 
    nutrition: '#10b981',
    sleep: '#60a5fa',
    mindset: '#8b5cf6',
    lifestyle: '#06b6d4'
  }
  return colors[category] || '#8b5cf6'
}

DatabaseService.createChallengeFromTemplate = async function(templateId, coachId, customizations = {}) {
  try {
    // Get template
    const { data: template, error: templateError } = await this.supabase
      .from('challenge_templates')
      .select('*')
      .eq('id', templateId)
      .single()
    
    if (templateError) throw templateError
    
    // Create challenge from template
    const challengeData = {
      coach_id: coachId,
      title: customizations.title || template.name,
      description: customizations.description || template.description,
      category: template.category,
      duration_weeks: customizations.duration_weeks || template.duration_weeks,
      is_template: false
    }
    
    const challenge = await this.createChallenge(challengeData)
    
    // Create strategy from template data
    const strategyWeeks = template.strategy_data.weeks.map(week => ({
      title: week.title,
      description: week.description || '',
      primary_target: week.targets[0]?.type || 'complete',
      target_value: week.targets[0]?.distance || week.targets[0]?.value || 1,
      target_unit: week.targets[0]?.unit || 'times',
      frequency_target: week.targets[0]?.frequency || 3,
      checkpoint_title: week.checkpoint || `Week ${week.week} voltooid`,
      checkpoint_description: week.checkpoint_description || '',
      checkpoint_type: 'performance',
      secondary_targets: week.targets.slice(1) || []
    }))
    
    await this.createChallengeStrategy(challenge.id, strategyWeeks)
    
    // Update template usage
    await this.supabase
      .from('challenge_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId)
    
    console.log('✅ Challenge created from template:', challenge.title)
    return challenge
  } catch (error) {
    console.error('❌ Create challenge from template failed:', error)
    throw error
  }
}

export default DatabaseService
