// src/modules/shopping/BudgetService.js - V2 FREQUENCY-BASED BUDGET
export default class BudgetService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase

    // Average cost per occasion (NL pricing)
    this.COST_PER_OCCASION = {
      breakfast_out: 6.50,   // Bakker/café ontbijt
      lunch_out: 10,         // Broodjeszaak/kantine
      dinner_out: 27.50,     // Restaurant
      delivery: 25,          // Thuisbezorgd/UberEats
      going_out: 60,         // Uitgaan (eten + drinken)
      snacks: 3.50           // Tankstation/kiosk/automaat
    }
  }

  // ── CALCULATE WEEKLY COST FROM FREQUENCIES ──
  calculateWeeklyFromFrequencies(frequencies, costs = null) {
    const useCosts = costs || this.COST_PER_OCCASION
    const breakdown = {
      breakfast_out: (frequencies.breakfast_out || 0) * (useCosts.breakfast_out || 0),
      lunch_out: (frequencies.lunch_out || 0) * (useCosts.lunch_out || 0),
      dinner_out: (frequencies.dinner_out || 0) * (useCosts.dinner_out || 0),
      delivery: (frequencies.delivery || 0) * (useCosts.delivery || 0),
      going_out: (frequencies.going_out || 0) * (useCosts.going_out || 0),
      snacks: (frequencies.snacks || 0) * (useCosts.snacks || 0)
    }

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

    return {
      breakdown,
      total: Math.round(total * 100) / 100,
      frequencies
    }
  }

  // ── GET CLIENT BUDGET BASELINE ──
  async getBudgetBaseline(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('budget_breakfast_out_freq, budget_lunch_out_freq, budget_dinner_out_freq, budget_delivery_freq, budget_going_out_freq, budget_snacks_freq, budget_total_baseline, budget_baseline_set_at, budget_breakdown')
        .eq('id', clientId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Failed to get budget baseline:', error)
      return null
    }
  }

  // ── SAVE BUDGET BASELINE ──
  async saveBudgetBaseline(clientId, frequencies, costsPerTime = {}) {
    try {
      // Use custom costs if provided, otherwise defaults
      const mergedCosts = { ...this.COST_PER_OCCASION, ...costsPerTime }
      const result = this.calculateWeeklyFromFrequencies(frequencies, mergedCosts)

      const { error } = await this.supabase
        .from('clients')
        .update({
          budget_breakfast_out_freq: frequencies.breakfast_out || 0,
          budget_lunch_out_freq: frequencies.lunch_out || 0,
          budget_dinner_out_freq: frequencies.dinner_out || 0,
          budget_delivery_freq: frequencies.delivery || 0,
          budget_going_out_freq: frequencies.going_out || 0,
          budget_snacks_freq: frequencies.snacks || 0,
          budget_total_baseline: result.total,
          budget_breakdown: result.breakdown,
          budget_baseline_set_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) throw error
      console.log(`✅ Budget baseline saved: €${result.total}/week`)
      return { success: true, ...result }
    } catch (error) {
      console.error('❌ Failed to save budget baseline:', error)
      return { success: false }
    }
  }

  // ── CALCULATE SAVINGS ──
  calculateSavings(baseline, planCost) {
    if (!baseline || baseline <= 0) return null

    const weekly = Math.max(0, baseline - planCost)
    const monthly = weekly * 4.33
    const yearly = weekly * 52
    const fiveYear = yearly * 5
    const tenYear = yearly * 10

    return {
      weekly: Math.round(weekly * 100) / 100,
      monthly: Math.round(monthly),
      yearly: Math.round(yearly),
      fiveYear: Math.round(fiveYear),
      tenYear: Math.round(tenYear),
      percentSaved: baseline > 0 ? Math.round((weekly / baseline) * 100) : 0,
      planCost: Math.round(planCost * 100) / 100,
      baseline: Math.round(baseline * 100) / 100
    }
  }

  // ── RECORD WEEKLY SAVINGS ──
  async recordWeeklySavings(clientId, planCost) {
    try {
      const baseline = await this.getBudgetBaseline(clientId)
      if (!baseline?.budget_total_baseline) return null

      const now = new Date()
      const weekStart = this.getMonday(now)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekStartStr = weekStart.toISOString().split('T')[0]
      const weekEndStr = weekEnd.toISOString().split('T')[0]

      const baselineAmount = parseFloat(baseline.budget_total_baseline)
      const savedAmount = Math.max(0, baselineAmount - planCost)

      // Get previous cumulative
      const { data: lastRecord } = await this.supabase
        .from('client_budget_tracking')
        .select('cumulative_saved')
        .eq('client_id', clientId)
        .lt('week_start', weekStartStr)
        .order('week_start', { ascending: false })
        .limit(1)
        .single()

      const previousCumulative = parseFloat(lastRecord?.cumulative_saved || 0)
      const cumulativeSaved = previousCumulative + savedAmount

      // Upsert
      const { data: existing } = await this.supabase
        .from('client_budget_tracking')
        .select('id')
        .eq('client_id', clientId)
        .eq('week_start', weekStartStr)
        .single()

      if (existing) {
        const { error } = await this.supabase
          .from('client_budget_tracking')
          .update({ baseline_amount: baselineAmount, plan_amount: planCost, saved_amount: savedAmount, cumulative_saved: cumulativeSaved })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await this.supabase
          .from('client_budget_tracking')
          .insert({ client_id: clientId, week_start: weekStartStr, week_end: weekEndStr, baseline_amount: baselineAmount, plan_amount: planCost, saved_amount: savedAmount, cumulative_saved: cumulativeSaved })
        if (error) throw error
      }

      console.log(`✅ Week tracked: saved €${savedAmount.toFixed(2)}, cumulative €${cumulativeSaved.toFixed(2)}`)
      return { savedAmount, cumulativeSaved }
    } catch (error) {
      console.error('❌ Failed to record weekly savings:', error)
      return null
    }
  }

  // ── GET CUMULATIVE SAVINGS ──
  async getCumulativeSavings(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_budget_tracking')
        .select('*')
        .eq('client_id', clientId)
        .order('week_start', { ascending: false })
        .limit(52)

      if (error) throw error
      if (!data || data.length === 0) return { totalSaved: 0, weekCount: 0, history: [], averageWeekly: 0 }

      const latest = data[0]
      const totalSaved = parseFloat(latest.cumulative_saved) || 0
      const weekCount = data.length
      const averageWeekly = weekCount > 0 ? totalSaved / weekCount : 0

      return {
        totalSaved: Math.round(totalSaved * 100) / 100,
        weekCount,
        averageWeekly: Math.round(averageWeekly * 100) / 100,
        history: data.reverse(),
        latestWeek: {
          saved: parseFloat(latest.saved_amount) || 0,
          planCost: parseFloat(latest.plan_amount) || 0,
          baseline: parseFloat(latest.baseline_amount) || 0
        }
      }
    } catch (error) {
      console.error('❌ Failed to get cumulative savings:', error)
      return { totalSaved: 0, weekCount: 0, history: [], averageWeekly: 0 }
    }
  }

  // ── GET FULL DASHBOARD DATA ──
  async getDashboardData(clientId, currentPlanCost) {
    try {
      const [baseline, cumulative] = await Promise.all([
        this.getBudgetBaseline(clientId),
        this.getCumulativeSavings(clientId)
      ])

      const totalBaseline = parseFloat(baseline?.budget_total_baseline || 0)
      const hasBaseline = totalBaseline > 0
      const breakdown = baseline?.budget_breakdown || {}

      const savings = hasBaseline ? this.calculateSavings(totalBaseline, currentPlanCost) : null

      if (hasBaseline && currentPlanCost > 0) {
        await this.recordWeeklySavings(clientId, currentPlanCost)
      }

      return {
        hasBaseline,
        baseline: {
          total: totalBaseline,
          breakdown,
          frequencies: {
            breakfast_out: baseline?.budget_breakfast_out_freq || 0,
            lunch_out: baseline?.budget_lunch_out_freq || 0,
            dinner_out: baseline?.budget_dinner_out_freq || 0,
            delivery: baseline?.budget_delivery_freq || 0,
            going_out: baseline?.budget_going_out_freq || 0,
            snacks: baseline?.budget_snacks_freq || 0
          },
          setAt: baseline?.budget_baseline_set_at
        },
        savings,
        cumulative,
        planCost: currentPlanCost
      }
    } catch (error) {
      console.error('❌ Failed to get dashboard data:', error)
      return { hasBaseline: false, baseline: null, savings: null, cumulative: null }
    }
  }

  getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }
}
