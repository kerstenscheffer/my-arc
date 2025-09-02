// ChallengeService.js - Dedicated Challenge Database Service
// Separate service voor alle challenge-related database operations

import { supabase } from '../lib/supabase'

class ChallengeServiceClass {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.subscribers = new Map()
  }

  // ===== CACHE MANAGEMENT =====
  
  getCached(key) {
    const cached = this.cache.get(key)
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // ===== EVENT SYSTEM =====
  
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set())
    }
    this.subscribers.get(event).add(callback)
    
    return () => {
      this.subscribers.get(event)?.delete(callback)
    }
  }

  emit(event, data) {
    const callbacks = this.subscribers.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Event callback error:', error)
        }
      })
    }
  }

  // ===== CHALLENGE TEMPLATES =====

  async getChallengeTemplates() {
    const cacheKey = 'challenge_templates'
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await supabase
        .from('challenge_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('❌ Get challenge templates failed:', error)
      return []
    }
  }

  async getChallengeTemplate(templateId) {
    const cacheKey = `challenge_template_${templateId}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const { data: template, error: templateError } = await supabase
        .from('challenge_templates')
        .select('*')
        .eq('id', templateId)
        .single()
      
      if (templateError) throw templateError
      
      const { data: goals, error: goalsError } = await supabase
        .from('challenge_goals')
        .select('*')
        .eq('template_id', templateId)
        .order('week_number', { ascending: true })
      
      if (goalsError) throw goalsError
      
      const result = {
        ...template,
        goals: goals || []
      }
      
      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Get challenge template failed:', error)
      return null
    }
  }

  async createChallengeTemplate(templateData) {
    try {
      const { data, error } = await supabase
        .from('challenge_templates')
        .insert([templateData])
        .select()
        .single()
      
      if (error) throw error
      
      this.clearCache('challenge_templates')
      this.emit('templates_updated', await this.getChallengeTemplates())
      
      return data
    } catch (error) {
      console.error('❌ Create challenge template failed:', error)
      throw error
    }
  }

  // ===== CLIENT CHALLENGES =====

  async getClientChallenges(clientId) {
    const cacheKey = `client_challenges_${clientId}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await supabase
        .from('client_challenges')
        .select(`
          *,
          challenge_templates (
            template_name,
            category,
            duration_weeks,
            color_theme
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('❌ Get client challenges failed:', error)
      return []
    }
  }

  async startChallenge(clientId, templateId, betAmount = 0) {
    try {
      // Get client's current balance
      const balance = await this.getClientBalance(clientId)
      
      const challengeData = {
        client_id: clientId,
        template_id: templateId,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        bet_amount: betAmount,
        balance_at_start: balance?.current_balance || 0
      }
      
      const { data, error } = await supabase
        .from('client_challenges')
        .insert([challengeData])
        .select()
        .single()
      
      if (error) throw error
      
      // If betting money, deduct from balance
      if (betAmount > 0) {
        await this.addBalanceTransaction(
          clientId, 
          -betAmount, 
          'bet_placed', 
          'Challenge bet placed', 
          'challenge', 
          data.id
        )
      }
      
      this.clearCache(`client_challenges_${clientId}`)
      this.emit('client_challenges_updated', { clientId, challenges: await this.getClientChallenges(clientId) })
      
      return data
    } catch (error) {
      console.error('❌ Start challenge failed:', error)
      throw error
    }
  }

  // ===== CHALLENGE PROGRESS =====

  async logChallengeProgress(clientChallengeId, goalId, progressData) {
    try {
      const logData = {
        client_challenge_id: clientChallengeId,
        goal_id: goalId,
        completed: progressData.completed || false,
        actual_value: progressData.actualValue || 0,
        target_value: progressData.targetValue || 0,
        proof_data: progressData.proofData ? JSON.stringify(progressData.proofData) : null,
        auto_tracked: progressData.autoTracked || false,
        source_type: progressData.sourceType || 'manual',
        source_id: progressData.sourceId || null,
        week_number: progressData.weekNumber || null,
        day_number: progressData.dayNumber || null
      }
      
      const { data, error } = await supabase
        .from('challenge_progress')
        .insert([logData])
        .select()
        .single()
      
      if (error) throw error
      
      this.clearCache(`challenge_progress_${clientChallengeId}`)
      this.emit('progress_updated', { clientChallengeId, progress: data })
      
      return data
    } catch (error) {
      console.error('❌ Log challenge progress failed:', error)
      throw error
    }
  }

  async getChallengeProgress(clientChallengeId) {
    const cacheKey = `challenge_progress_${clientChallengeId}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await supabase
        .from('challenge_progress')
        .select(`
          *,
          challenge_goals (
            goal_name,
            goal_type,
            target_data
          )
        `)
        .eq('client_challenge_id', clientChallengeId)
        .order('date_logged', { ascending: false })
      
      if (error) throw error
      
      this.setCache(cacheKey, data || [])
      return data || []
    } catch (error) {
      console.error('❌ Get challenge progress failed:', error)
      return []
    }
  }

  // ===== BALANCE SYSTEM =====

  async getClientBalance(clientId) {
    const cacheKey = `client_balance_${clientId}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await supabase
        .from('client_balance')
        .select('*')
        .eq('client_id', clientId)
        .single()
      
      if (error) throw error
      
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('❌ Get client balance failed:', error)
      return { current_balance: 0, total_earned: 0, total_spent: 0 }
    }
  }

  async addBalanceTransaction(clientId, amount, transactionType, description, referenceType = null, referenceId = null) {
    try {
      // Insert transaction
      const { data: transaction, error: transError } = await supabase
        .from('balance_transactions')
        .insert([{
          client_id: clientId,
          amount: amount,
          transaction_type: transactionType,
          description: description,
          reference_type: referenceType,
          reference_id: referenceId
        }])
        .select()
        .single()
      
      if (transError) throw transError
      
      // Get current balance
      const currentBalance = await this.getClientBalance(clientId)
      const newBalance = (currentBalance.current_balance || 0) + amount
      const newTotalEarned = amount > 0 ? (currentBalance.total_earned || 0) + amount : currentBalance.total_earned
      const newTotalSpent = amount < 0 ? (currentBalance.total_spent || 0) + Math.abs(amount) : currentBalance.total_spent
      
      // Update client balance
      const { error: balanceError } = await supabase
        .from('client_balance')
        .update({
          current_balance: newBalance,
          total_earned: newTotalEarned,
          total_spent: newTotalSpent,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
      
      if (balanceError) throw balanceError
      
      this.clearCache(`client_balance_${clientId}`)
      this.emit('balance_updated', { clientId, balance: await this.getClientBalance(clientId) })
      
      return transaction
    } catch (error) {
      console.error('❌ Add balance transaction failed:', error)
      throw error
    }
  }

  async getBalanceTransactions(clientId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('client_id', clientId)
        .order('processed_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get balance transactions failed:', error)
      return []
    }
  }

  // ===== CHALLENGE GOALS =====

  async createChallengeGoal(goalData) {
    try {
      const { data, error } = await supabase
        .from('challenge_goals')
        .insert([goalData])
        .select()
        .single()
      
      if (error) throw error
      
      this.clearCache(`challenge_template_${goalData.template_id}`)
      
      return data
    } catch (error) {
      console.error('❌ Create challenge goal failed:', error)
      throw error
    }
  }

  async getChallengeGoals(templateId) {
    try {
      const { data, error } = await supabase
        .from('challenge_goals')
        .select('*')
        .eq('template_id', templateId)
        .order('week_number', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get challenge goals failed:', error)
      return []
    }
  }

  // ===== AUTO-TRACKING =====

  async autoTrackChallengeProgress(clientId, sourceType, sourceData) {
    try {
      const challenges = await this.getClientChallenges(clientId)
      const activeChallenges = challenges.filter(c => c.status === 'active')
      
      for (const challenge of activeChallenges) {
        const { data: goals, error } = await supabase
          .from('challenge_goals')
          .select('*')
          .eq('template_id', challenge.template_id)
          .eq('auto_trackable', true)
          .eq('tracking_source', sourceType)
        
        if (error) continue
        
        for (const goal of goals) {
          const today = new Date()
          const challengeStart = new Date(challenge.start_date)
          const weekNumber = Math.ceil((today - challengeStart) / (7 * 24 * 60 * 60 * 1000))
          
          if (goal.week_number && goal.week_number !== weekNumber) continue
          
          await this.logChallengeProgress(challenge.id, goal.id, {
            completed: true,
            actualValue: sourceData.value || 1,
            targetValue: goal.target_value || 1,
            autoTracked: true,
            sourceType: sourceType,
            sourceId: sourceData.id,
            weekNumber: weekNumber,
            proofData: sourceData
          })
        }
      }
    } catch (error) {
      console.error('❌ Auto-track challenge progress failed:', error)
    }
  }

  // ===== HELPER FUNCTIONS =====

  async getChallengeStats(clientId) {
    try {
      const challenges = await this.getClientChallenges(clientId)
      const balance = await this.getClientBalance(clientId)
      
      return {
        active: challenges.filter(c => c.status === 'active').length,
        completed: challenges.filter(c => c.status === 'completed').length,
        totalBet: challenges.reduce((sum, c) => sum + (c.bet_amount || 0), 0),
        currentBalance: balance.current_balance || 0,
        completionRate: challenges.length > 0 
          ? Math.round((challenges.filter(c => c.status === 'completed').length / challenges.length) * 100)
          : 0
      }
    } catch (error) {
      console.error('❌ Get challenge stats failed:', error)
      return { active: 0, completed: 0, totalBet: 0, currentBalance: 0, completionRate: 0 }
    }
  }

  async completeChallenge(clientChallengeId) {
    try {
      const { data: challenge, error: challengeError } = await supabase
        .from('client_challenges')
        .select('*, challenge_templates(template_name)')
        .eq('id', clientChallengeId)
        .single()
      
      if (challengeError) throw challengeError
      
      const { error: updateError } = await supabase
        .from('client_challenges')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_percentage: 100
        })
        .eq('id', clientChallengeId)
      
      if (updateError) throw updateError
      
      // Award money back if bet was placed
      if (challenge.bet_amount > 0) {
        const rewardAmount = challenge.bet_amount * 2
        await this.addBalanceTransaction(
          challenge.client_id,
          rewardAmount,
          'challenge_reward',
          `Challenge completed: ${challenge.challenge_templates.template_name}`,
          'challenge',
          clientChallengeId
        )
      }
      
      this.clearCache(`client_challenges_${challenge.client_id}`)
      this.emit('challenge_completed', { clientId: challenge.client_id, challengeId: clientChallengeId })
      
      return true
    } catch (error) {
      console.error('❌ Complete challenge failed:', error)
      throw error
    }
  }





// Add this method to your existing ChallengeService.js

// ===== NEW METHOD FOR CHALLENGE GOALS BY NAME =====

// TOEVOEGEN AAN je bestaande ChallengeService.js
// TOEVOEG AAN ChallengeService.js:
async getChallengeGoalsByName(challengeName) {
  const cacheKey = `challenge_goals_name_${challengeName}`
  const cached = this.getCached(cacheKey)
  if (cached) return cached

  try {
    console.log('🔍 Searching for challenge goals by name:', challengeName)
    
    // Method 1: Zoek in challenge_templates
    const { data: templates, error: templateError } = await supabase
      .from('challenge_templates')
      .select('id, template_name')
      .or(`template_name.eq.${challengeName},template_name.ilike.%${challengeName}%`)
      .limit(1)
    
    let template = null
    if (!templateError && templates && templates.length > 0) {
      template = templates[0]
      console.log('✅ Found template by name:', template.template_name)
    }
    
    // Method 2: Fuzzy search fallback
    if (!template) {
      const searchTerm = challengeName.split(' ')[0]
      const { data: fuzzyTemplates, error: fuzzyError } = await supabase
        .from('challenge_templates')
        .select('id, template_name')
        .ilike('template_name', `%${searchTerm}%`)
        .limit(1)
      
      if (!fuzzyError && fuzzyTemplates && fuzzyTemplates.length > 0) {
        template = fuzzyTemplates[0]
        console.log('✅ Found template via fuzzy search:', template.template_name)
      }
    }
    
    if (!template) {
      console.log('❌ No template found for challenge:', challengeName)
      this.setCache(cacheKey, [])
      return []
    }
    
    // Haal goals op
    const { data: goals, error: goalsError } = await supabase
      .from('challenge_goals')
      .select('*')
      .eq('template_id', template.id)
      .order('week_number', { ascending: true })
    
    if (goalsError) {
      console.error('❌ Error loading goals:', goalsError)
      this.setCache(cacheKey, [])
      return []
    }
    
    console.log(`✅ Found ${goals?.length || 0} goals`)
    const result = goals || []
    this.setCache(cacheKey, result)
    return result
    
  } catch (error) {
    console.error('❌ Get challenge goals by name failed:', error)
    this.setCache(cacheKey, [])
    return []
  }
}



// ===== plak hier =====



  // ===== TESTING & DEBUG =====

  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('challenge_templates')
        .select('count')
        .limit(1)
      
      if (error) throw error
      console.log('✅ ChallengeService connection test passed')
      return true
    } catch (error) {
      console.error('❌ ChallengeService connection test failed:', error)
      return false
    }
  }
}

// Create and export singleton instance
const ChallengeService = new ChallengeServiceClass()
export default ChallengeService
