// src/modules/productivity/WeekGoalsService.js
// CRUD for `weekly_goals`. The service is intentionally thin — progress
// is computed in the UI by pulling from LeadManagementService for goals
// with source='leadkanban' and from manual_progress for source='manual'.

export default class WeekGoalsService {
  constructor(db) {
    this.db = db
    this.supabase = db?.supabase || db
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  static mondayOf(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  static weekISO(date) {
    const m = WeekGoalsService.mondayOf(date)
    const y = m.getFullYear()
    const mm = String(m.getMonth() + 1).padStart(2, '0')
    const dd = String(m.getDate()).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  // ── Queries ─────────────────────────────────────────────────────────────
  async getGoalsForWeek(coachId, weekStart) {
    try {
      const { data, error } = await this.supabase
        .from('weekly_goals')
        .select('*')
        .eq('coach_id', coachId)
        .eq('week_start', weekStart)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data || []
    } catch (e) {
      console.error('getGoalsForWeek failed:', e)
      return []
    }
  }

  async createGoal(coachId, goal) {
    const payload = {
      coach_id: coachId,
      week_start: goal.week_start || WeekGoalsService.weekISO(new Date()),
      label: goal.label,
      target: Number(goal.target) || 1,
      period: goal.period === 'daily' ? 'daily' : 'weekly',
      source: goal.source === 'leadkanban' ? 'leadkanban' : 'manual',
      source_key: goal.source_key || null,
      manual_progress: 0,
      position: goal.position ?? 0,
    }
    const { data, error } = await this.supabase
      .from('weekly_goals').insert(payload).select().single()
    if (error) throw error
    return data
  }

  async updateGoal(goalId, updates) {
    const { error } = await this.supabase
      .from('weekly_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', goalId)
    if (error) throw error
  }

  async deleteGoal(goalId) {
    const { error } = await this.supabase.from('weekly_goals').delete().eq('id', goalId)
    if (error) throw error
  }

  // Manual progress: nudge by ±delta. Clamps to 0 lower-bound; can exceed target.
  async incrementManualProgress(goalId, delta) {
    // Fetch current to avoid race conditions on rapid taps.
    const { data, error: fErr } = await this.supabase
      .from('weekly_goals').select('manual_progress').eq('id', goalId).single()
    if (fErr) throw fErr
    const next = Math.max(0, Number(data?.manual_progress || 0) + delta)
    await this.updateGoal(goalId, { manual_progress: next })
    return next
  }

  // Copy all goals from `fromWeekStart` into `toWeekStart` (reset progress).
  // Useful for "duplicate previous week" actions.
  async duplicateWeek(coachId, fromWeekStart, toWeekStart) {
    const prev = await this.getGoalsForWeek(coachId, fromWeekStart)
    if (!prev.length) return []
    const inserts = prev.map(g => ({
      coach_id: coachId,
      week_start: toWeekStart,
      label: g.label,
      target: g.target,
      period: g.period,
      source: g.source,
      source_key: g.source_key,
      manual_progress: 0,
      position: g.position,
    }))
    const { data, error } = await this.supabase
      .from('weekly_goals').insert(inserts).select()
    if (error) throw error
    return data || []
  }
}
