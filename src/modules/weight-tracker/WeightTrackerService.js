// WeightTrackerService.js - EXTENDED VERSION
// Weight + Circumference tracking voor 8-week challenge
export default class WeightTrackerService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
    this.weightTable = 'weight_challenge_logs'
    this.circumferenceTable = 'circumference_tracking'
  }

  // ============================================
  // WEIGHT TRACKING METHODS (EXISTING)
  // ============================================
  
  async saveWeight(clientId, weight, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      const dateObj = new Date(targetDate)
      const isFriday = dateObj.getDay() === 5
      
      const { data, error } = await this.supabase
        .from(this.weightTable)
        .upsert({
          client_id: clientId,
          date: targetDate,
          weight: parseFloat(weight),
          time_of_day: 'morning',
          is_friday_weighin: isFriday,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,date'
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Weight saved:', { 
        date: targetDate, 
        weight, 
        isFriday 
      })
      
      return { success: true, data, isFriday }
    } catch (error) {
      console.error('❌ Save weight failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  async getWeightHistory(clientId, days = 730) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await this.supabase
        .from(this.weightTable)
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('❌ Get weight history failed:', error)
      return []
    }
  }
  
  async getFridayCompliance(clientId) {
    try {
      const eightWeeksAgo = new Date()
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 55)
      
      const { data, error } = await this.supabase
        .from(this.weightTable)
        .select('date, weight')
        .eq('client_id', clientId)
        .eq('is_friday_weighin', true)
        .gte('date', eightWeeksAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })
      
      if (error) throw error
      
      const allFridays = []
      const tempDate = new Date(eightWeeksAgo)
      const today = new Date()
      
      while (tempDate <= today) {
        if (tempDate.getDay() === 5) {
          allFridays.push(tempDate.toISOString().split('T')[0])
        }
        tempDate.setDate(tempDate.getDate() + 1)
      }
      
      const completedDates = data?.map(entry => entry.date) || []
      const missingFridays = allFridays.filter(friday => !completedDates.includes(friday))
      
      return {
        friday_count: completedDates.length,
        total_fridays: Math.min(allFridays.length, 8),
        completed_dates: completedDates,
        missing_dates: missingFridays,
        all_fridays: allFridays.slice(0, 8),
        is_compliant: completedDates.length >= 8,
        percentage: Math.round((completedDates.length / 8) * 100)
      }
    } catch (error) {
      console.error('❌ Get Friday compliance failed:', error)
      return {
        friday_count: 0,
        total_fridays: 8,
        completed_dates: [],
        missing_dates: [],
        all_fridays: [],
        is_compliant: false,
        percentage: 0
      }
    }
  }
  
  async getWeightStats(clientId) {
    try {
      const history = await this.getWeightHistory(clientId, 56)
      
      if (!history || history.length === 0) {
        return {
          current: null,
          weekChange: null,
          monthChange: null,
          totalChange: null,
          average: null,
          lowest: null,
          highest: null
        }
      }
      
      history.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      const current = history[0].weight
      const weights = history.map(h => h.weight)
      
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const weekEntry = history.find(entry => 
        new Date(entry.date) <= oneWeekAgo
      )
      
      const oneMonthAgo = new Date()
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
      const monthEntry = history.find(entry => 
        new Date(entry.date) <= oneMonthAgo
      )
      
      return {
        current: parseFloat(current.toFixed(1)),
        weekChange: weekEntry ? parseFloat((current - weekEntry.weight).toFixed(1)) : null,
        monthChange: monthEntry ? parseFloat((current - monthEntry.weight).toFixed(1)) : null,
        totalChange: history.length > 1 ? 
          parseFloat((current - history[history.length - 1].weight).toFixed(1)) : null,
        average: parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)),
        lowest: Math.min(...weights),
        highest: Math.max(...weights)
      }
    } catch (error) {
      console.error('❌ Get weight stats failed:', error)
      return {
        current: null,
        weekChange: null,
        monthChange: null,
        totalChange: null,
        average: null,
        lowest: null,
        highest: null
      }
    }
  }
  
  // Latest active client_journey met coaching_plan JSON. Levert de data
  // die WeightStatsGrid nodig heeft om de verwachte plan-lijn te tekenen
  // (start_weight, tdee, target_cal, adjustments…). Zelfde shape als wat
  // CommandCenterService aan de coach-kant teruggeeft, zodat de chart-
  // logica identiek blijft tussen coach- en klant-view.
  async getCoachingPlan(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_journeys')
        .select('start_date, total_weeks, coaching_plan')
        .eq('client_id', clientId)
        .not('coaching_plan', 'is', null)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error && error.code !== 'PGRST116') throw error
      if (!data || !data.coaching_plan) return null
      return {
        startDate: data.start_date,
        totalWeeks: data.total_weeks,
        plan: data.coaching_plan,
      }
    } catch (error) {
      console.error('❌ Get coaching plan failed:', error)
      return null
    }
  }

  async getTodayEntry(clientId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from(this.weightTable)
        .select('*')
        .eq('client_id', clientId)
        .eq('date', today)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      return data || null
    } catch (error) {
      console.error('❌ Get today entry failed:', error)
      return null
    }
  }
  
  async deleteEntry(clientId, date) {
    try {
      const { error } = await this.supabase
        .from(this.weightTable)
        .delete()
        .eq('client_id', clientId)
        .eq('date', date)
      
      if (error) throw error
      
      console.log('✅ Weight entry deleted')
      return { success: true }
    } catch (error) {
      console.error('❌ Delete entry failed:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================
  // CIRCUMFERENCE TRACKING METHODS (NEW)
  // ============================================
  
  /**
   * Save circumference measurements
   * @param {string} clientId - Client UUID
   * @param {object} measurements - { waist_cm, bicep_cm, chest_cm, thigh_cm }
   * @param {string} date - ISO date string (optional, defaults to today)
   */
  async saveCircumference(clientId, measurements, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      const dateObj = new Date(targetDate)
      const isFriday = dateObj.getDay() === 5
      
      // Validate measurements
      const validMeasurements = {}
      if (measurements.waist_cm) validMeasurements.waist_cm = parseFloat(measurements.waist_cm)
      if (measurements.bicep_cm) validMeasurements.bicep_cm = parseFloat(measurements.bicep_cm)
      if (measurements.chest_cm) validMeasurements.chest_cm = parseFloat(measurements.chest_cm)
      if (measurements.thigh_cm) validMeasurements.thigh_cm = parseFloat(measurements.thigh_cm)
      
      const { data, error } = await this.supabase
        .from(this.circumferenceTable)
        .upsert({
          client_id: clientId,
          measurement_date: targetDate,
          ...validMeasurements,
          is_friday_entry: isFriday,
          notes: measurements.notes || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,measurement_date'
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Circumference saved:', { 
        date: targetDate, 
        measurements: validMeasurements,
        isFriday 
      })
      
      return { success: true, data, isFriday }
    } catch (error) {
      console.error('❌ Save circumference failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Get circumference history
   */
  async getCircumferenceHistory(clientId, days = 56) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await this.supabase
        .from(this.circumferenceTable)
        .select('*')
        .eq('client_id', clientId)
        .gte('measurement_date', startDate.toISOString().split('T')[0])
        .order('measurement_date', { ascending: false })
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('❌ Get circumference history failed:', error)
      return []
    }
  }
  
  /**
   * Get today's circumference entry
   */
  async getTodayCircumference(clientId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from(this.circumferenceTable)
        .select('*')
        .eq('client_id', clientId)
        .eq('measurement_date', today)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      return data || null
    } catch (error) {
      console.error('❌ Get today circumference failed:', error)
      return null
    }
  }
  
  /**
   * Get previous circumference entry (for comparison)
   */
  async getPreviousCircumference(clientId, currentDate = null) {
    try {
      const targetDate = currentDate || new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from(this.circumferenceTable)
        .select('*')
        .eq('client_id', clientId)
        .lt('measurement_date', targetDate)
        .order('measurement_date', { ascending: false })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      return data || null
    } catch (error) {
      console.error('❌ Get previous circumference failed:', error)
      return null
    }
  }
  
  /**
   * Calculate 7-day averages for all metrics
   */
  async get7DayAverages(clientId) {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data, error } = await this.supabase
        .from(this.circumferenceTable)
        .select('*')
        .eq('client_id', clientId)
        .gte('measurement_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('measurement_date', { ascending: false })
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        return {
          waist_avg: null,
          bicep_avg: null,
          chest_avg: null,
          thigh_avg: null,
          count: 0
        }
      }
      
      // Calculate averages (only for non-null values)
      const calculateAvg = (metric) => {
        const values = data.map(d => d[metric]).filter(v => v !== null)
        return values.length > 0 
          ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
          : null
      }
      
      return {
        waist_avg: calculateAvg('waist_cm'),
        bicep_avg: calculateAvg('bicep_cm'),
        chest_avg: calculateAvg('chest_cm'),
        thigh_avg: calculateAvg('thigh_cm'),
        count: data.length
      }
    } catch (error) {
      console.error('❌ Get 7-day averages failed:', error)
      return {
        waist_avg: null,
        bicep_avg: null,
        chest_avg: null,
        thigh_avg: null,
        count: 0
      }
    }
  }
  
  /**
   * Get weekly comparison (last 2 Fridays)
   */
  async getWeeklyCircumferenceComparison(clientId) {
    try {
      const { data, error } = await this.supabase
        .from(this.circumferenceTable)
        .select('*')
        .eq('client_id', clientId)
        .eq('is_friday_entry', true)
        .order('measurement_date', { ascending: false })
        .limit(2)
      
      if (error) throw error
      
      if (!data || data.length < 2) {
        return {
          current: data?.[0] || null,
          previous: null,
          changes: null
        }
      }
      
      const current = data[0]
      const previous = data[1]
      
      const calculateChange = (curr, prev) => {
        if (curr === null || prev === null) return null
        return parseFloat((curr - prev).toFixed(1))
      }
      
      return {
        current,
        previous,
        changes: {
          waist: calculateChange(current.waist_cm, previous.waist_cm),
          bicep: calculateChange(current.bicep_cm, previous.bicep_cm),
          chest: calculateChange(current.chest_cm, previous.chest_cm),
          thigh: calculateChange(current.thigh_cm, previous.thigh_cm)
        }
      }
    } catch (error) {
      console.error('❌ Get weekly comparison failed:', error)
      return {
        current: null,
        previous: null,
        changes: null
      }
    }
  }
  
  /**
   * Delete circumference entry
   */
  async deleteCircumferenceEntry(clientId, date) {
    try {
      const { error } = await this.supabase
        .from(this.circumferenceTable)
        .delete()
        .eq('client_id', clientId)
        .eq('measurement_date', date)
      
      if (error) throw error
      
      console.log('✅ Circumference entry deleted')
      return { success: true }
    } catch (error) {
      console.error('❌ Delete circumference entry failed:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  getNextFriday() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + daysUntilFriday)
    return nextFriday
  }
  
  isFriday(date = new Date()) {
    return date.getDay() === 5
  }
}
