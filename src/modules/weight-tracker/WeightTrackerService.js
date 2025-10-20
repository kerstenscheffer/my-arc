// WeightTrackerService.js - Service voor 8-week challenge weight tracking
export default class WeightTrackerService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
    this.tableName = 'weight_challenge_logs'
  }

  // Save or update weight entry (one per day)
  async saveWeight(clientId, weight, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      const dateObj = new Date(targetDate)
      const isFriday = dateObj.getDay() === 5
      
      const { data, error } = await this.supabase
        .from(this.tableName)
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
  
  // Get weight history for client
  async getWeightHistory(clientId, days = 56) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await this.supabase
        .from(this.tableName)
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
  
  // Get Friday compliance for 8-week challenge
  async getFridayCompliance(clientId) {
    try {
      const eightWeeksAgo = new Date()
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 55) // 8 weeks = 56 days - 1
      
      // Get all Friday entries
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('date, weight')
        .eq('client_id', clientId)
        .eq('is_friday_weighin', true)
        .gte('date', eightWeeksAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })
      
      if (error) throw error
      
      // Calculate all Fridays in period
      const allFridays = []
      const tempDate = new Date(eightWeeksAgo)
      const today = new Date()
      
      while (tempDate <= today) {
        if (tempDate.getDay() === 5) { // Friday
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
  
  // Get weight statistics
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
      
      // Sort by date (newest first)
      history.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      const current = history[0].weight
      const weights = history.map(h => h.weight)
      
      // Week change
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const weekEntry = history.find(entry => 
        new Date(entry.date) <= oneWeekAgo
      )
      
      // Month change
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
  
  // Check if today's weight is logged
  async getTodayEntry(clientId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from(this.tableName)
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
  
  // Delete weight entry
  async deleteEntry(clientId, date) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
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
  
  // Get next Friday date
  getNextFriday() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + daysUntilFriday)
    return nextFriday
  }
  
  // Check if date is Friday
  isFriday(date = new Date()) {
    return date.getDay() === 5
  }
}
