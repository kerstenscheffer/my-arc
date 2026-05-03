// src/modules/qualification-funnel/FunnelAnalytics.js
// MY ARC Funnel Analytics - Track conversions & drop-offs
// Now with Supabase integration!

class FunnelAnalytics {
  constructor(supabase = null) {
    this.supabase = supabase
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
    this.events = []
    this.currentStep = null
    this.stepTimes = {}
    this.sessionCreated = false
    this.userData = {
      experienceLevel: null,
      committed: null,
      booked: false
    }
    
    // Create session in Supabase on init
    this.createSession()
  }

  // Set Supabase client (call this from your app)
  setSupabase(supabase) {
    this.supabase = supabase
    if (!this.sessionCreated) {
      this.createSession()
    }
  }

  // Generate unique session ID
  generateSessionId() {
    return 'funnel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // Create session in Supabase
  async createSession() {
    if (this.sessionCreated) return
    
    const sessionData = {
      session_id: this.sessionId,
      started_at: new Date(this.startTime).toISOString(),
      current_step: 'landing',
      current_step_number: 1,
      steps_completed: 0,
      completed: false,
      is_mobile: window.innerWidth <= 768,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      utm_source: this.getUrlParam('utm_source'),
      utm_medium: this.getUrlParam('utm_medium'),
      utm_campaign: this.getUrlParam('utm_campaign')
    }

    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('funnel_sessions')
          .insert(sessionData)
        
        if (error) {
          console.error('❌ Failed to create funnel session:', error)
        } else {
          console.log('✅ Funnel session created:', this.sessionId)
          this.sessionCreated = true
        }
      } catch (e) {
        console.error('❌ Supabase error:', e)
      }
    }
    
    // Also store locally as backup
    this.storeLocally('session_created', sessionData)
  }

  // Get URL parameter
  getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(param) || null
  }

  // Track step view
  trackStepView(stepName) {
    const now = Date.now()
    
    // Calculate time on previous step
    if (this.currentStep && this.stepTimes[this.currentStep]) {
      const timeOnStep = now - this.stepTimes[this.currentStep]
      this.trackEvent('step_time', {
        step: this.currentStep,
        duration_ms: timeOnStep,
        duration_seconds: Math.round(timeOnStep / 1000)
      })
    }

    this.currentStep = stepName
    this.stepTimes[stepName] = now

    this.trackEvent('step_view', {
      step: stepName,
      step_number: this.getStepNumber(stepName),
      time_since_start: now - this.startTime
    })

    // Update session in Supabase
    this.updateSession({
      current_step: stepName,
      current_step_number: this.getStepNumber(stepName)
    })

    console.log(`📊 Funnel: Step viewed - ${stepName}`)
  }

  // Track step completion
  trackStepComplete(stepName, data = {}) {
    const now = Date.now()
    const timeOnStep = this.stepTimes[stepName] 
      ? now - this.stepTimes[stepName] 
      : 0

    this.trackEvent('step_complete', {
      step: stepName,
      step_number: this.getStepNumber(stepName),
      time_on_step_ms: timeOnStep,
      time_on_step_seconds: Math.round(timeOnStep / 1000),
      ...data
    })

    // Update steps completed count
    this.updateSession({
      steps_completed: this.getStepNumber(stepName)
    })

    console.log(`✅ Funnel: Step completed - ${stepName}`)
  }

  // Track drop-off
  trackDropOff(stepName, reason = 'unknown') {
    const now = Date.now()
    const timeOnStep = this.stepTimes[stepName] 
      ? now - this.stepTimes[stepName] 
      : 0

    this.trackEvent('drop_off', {
      step: stepName,
      step_number: this.getStepNumber(stepName),
      reason: reason,
      time_on_step_ms: timeOnStep,
      time_on_step_seconds: Math.round(timeOnStep / 1000),
      total_time_ms: now - this.startTime,
      total_time_seconds: Math.round((now - this.startTime) / 1000)
    })

    // Update session with final state
    this.updateSession({
      ended_at: new Date().toISOString(),
      total_time_seconds: Math.round((now - this.startTime) / 1000)
    })

    console.log(`❌ Funnel: Drop-off at ${stepName} - Reason: ${reason}`)
    
    // Flush immediately on drop-off
    this.flush()
  }

  // Track funnel completion
  trackComplete(data = {}) {
    const now = Date.now()
    const totalTime = now - this.startTime

    this.trackEvent('funnel_complete', {
      total_time_ms: totalTime,
      total_time_seconds: Math.round(totalTime / 1000),
      total_time_minutes: Math.round(totalTime / 60000 * 10) / 10,
      steps_completed: Object.keys(this.stepTimes).length,
      ...data
    })

    // Update session as completed
    this.updateSession({
      completed: true,
      booked: true,
      ended_at: new Date().toISOString(),
      total_time_seconds: Math.round(totalTime / 1000),
      experience_level: this.userData.experienceLevel,
      committed: this.userData.committed
    })

    console.log(`🎉 Funnel: COMPLETED in ${Math.round(totalTime / 1000)}s`)
    
    this.flush()
  }

  // Track user choice
  trackChoice(stepName, choice, value) {
    // Store user data
    if (choice === 'experience_level') this.userData.experienceLevel = value
    if (choice === 'committed') this.userData.committed = value
    if (choice === 'booked') this.userData.booked = value

    this.trackEvent('user_choice', {
      step: stepName,
      choice: choice,
      value: value
    })

    // Update session with choice
    const updateData = {}
    if (choice === 'experience_level') updateData.experience_level = value
    if (choice === 'committed') updateData.committed = value
    if (choice === 'booked') updateData.booked = value
    
    if (Object.keys(updateData).length > 0) {
      this.updateSession(updateData)
    }

    console.log(`📝 Funnel: Choice made - ${choice}: ${value}`)
  }

  // Track exit intent
  trackExitIntent(stepName) {
    this.trackEvent('exit_intent', {
      step: stepName,
      step_number: this.getStepNumber(stepName)
    })
    console.log(`⚠️ Funnel: Exit intent detected at ${stepName}`)
  }

  // Generic event tracker
  async trackEvent(eventName, data = {}) {
    const event = {
      session_id: this.sessionId,
      event_type: eventName,
      step: data.step || this.currentStep,
      step_number: data.step_number || this.getStepNumber(this.currentStep),
      event_data: data,
      timestamp: new Date().toISOString(),
      time_since_start_ms: Date.now() - this.startTime,
      time_on_step_ms: data.time_on_step_ms || 0
    }

    this.events.push(event)

    // Send to Supabase immediately
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('funnel_events')
          .insert(event)
        
        if (error) {
          console.error('❌ Failed to track event:', error)
          this.storeLocally('event', event)
        }
      } catch (e) {
        console.error('❌ Supabase error:', e)
        this.storeLocally('event', event)
      }
    } else {
      this.storeLocally('event', event)
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📈 Analytics Event:', event)
    }
  }

  // Update session in Supabase
  async updateSession(data) {
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('funnel_sessions')
          .update(data)
          .eq('session_id', this.sessionId)
        
        if (error) {
          console.error('❌ Failed to update session:', error)
        }
      } catch (e) {
        console.error('❌ Supabase error:', e)
      }
    }
  }

  // Get step number
  getStepNumber(stepName) {
    const steps = {
      'landing': 1,
      'filter': 2,
      'commitment': 3,
      'social_proof': 4,
      'calendly': 5,
      'confirmation': 6
    }
    return steps[stepName] || 0
  }

  // Get all events
  getEvents() {
    return this.events
  }

  // Get summary
  getSummary() {
    const now = Date.now()
    const completedSteps = Object.keys(this.stepTimes)
    const lastStep = this.currentStep

    return {
      session_id: this.sessionId,
      started_at: new Date(this.startTime).toISOString(),
      current_step: lastStep,
      current_step_number: this.getStepNumber(lastStep),
      steps_viewed: completedSteps.length,
      total_time_seconds: Math.round((now - this.startTime) / 1000),
      completed: lastStep === 'confirmation',
      events_count: this.events.length,
      user_data: this.userData
    }
  }

  // Store locally as backup
  storeLocally(type, data) {
    try {
      const key = 'funnel_analytics_backup'
      const stored = JSON.parse(localStorage.getItem(key) || '[]')
      stored.push({ type, data, timestamp: new Date().toISOString() })
      
      // Keep last 100 items
      if (stored.length > 100) stored.shift()
      
      localStorage.setItem(key, JSON.stringify(stored))
    } catch (e) {
      console.warn('Could not store locally:', e)
    }
  }

  // Flush (sync any pending local data)
  async flush() {
    const summary = this.getSummary()
    console.log('📤 Funnel analytics flushed:', summary)

    // Try to sync any locally stored backup data
    if (this.supabase) {
      try {
        const backup = JSON.parse(localStorage.getItem('funnel_analytics_backup') || '[]')
        if (backup.length > 0) {
          console.log(`📤 Syncing ${backup.length} backup events...`)
          // Could implement batch insert here
          localStorage.removeItem('funnel_analytics_backup')
        }
      } catch (e) {
        console.warn('Could not sync backup:', e)
      }
    }
  }
}

// Singleton instance
let analyticsInstance = null
let supabaseClient = null

export function initFunnelAnalytics(supabase) {
  supabaseClient = supabase
  if (analyticsInstance) {
    analyticsInstance.setSupabase(supabase)
  }
  return getAnalytics()
}

export function getAnalytics() {
  if (!analyticsInstance) {
    analyticsInstance = new FunnelAnalytics(supabaseClient)
  }
  return analyticsInstance
}

export function resetAnalytics() {
  analyticsInstance = new FunnelAnalytics(supabaseClient)
  return analyticsInstance
}

export function useFunnelAnalytics() {
  return getAnalytics()
}

export default FunnelAnalytics
