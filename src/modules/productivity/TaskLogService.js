// src/modules/productivity/TaskLogService.js
// Daily reflection-log per recurring task. One row per (task, date) thanks
// to the UNIQUE constraint in the DB, so upserting today's log is safe to
// call repeatedly during autosave debouncing.

export default class TaskLogService {
  constructor(db) {
    this.db = db
    this.supabase = db?.supabase || db
  }

  static todayISO() {
    const d = new Date()
    return d.toISOString().split('T')[0]
  }

  async listForTask(taskId, limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('task_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('log_date', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    } catch (e) {
      console.error('listForTask failed:', e)
      return []
    }
  }

  async getOne(taskId, logDate) {
    try {
      const { data, error } = await this.supabase
        .from('task_logs')
        .select('*')
        .eq('task_id', taskId)
        .eq('log_date', logDate)
        .maybeSingle()
      if (error) throw error
      return data || null
    } catch (e) {
      console.error('getOne failed:', e)
      return null
    }
  }

  // Idempotent upsert keyed on (task_id, log_date). Any field omitted from
  // `entry` is left untouched on existing rows via a manual update-or-insert.
  async upsert(taskId, coachId, logDate, entry) {
    try {
      const payload = {
        task_id: taskId,
        coach_id: coachId,
        log_date: logDate,
        hoe_ging_het: entry.hoe_ging_het ?? null,
        wat_ging_goed: entry.wat_ging_goed ?? null,
        genoeg_score: entry.genoeg_score ?? null,
        morgen_beter: entry.morgen_beter ?? null,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await this.supabase
        .from('task_logs')
        .upsert(payload, { onConflict: 'task_id,log_date' })
        .select().single()
      if (error) throw error
      return data
    } catch (e) {
      console.error('upsert task log failed:', e)
      throw e
    }
  }

  async remove(logId) {
    const { error } = await this.supabase.from('task_logs').delete().eq('id', logId)
    if (error) throw error
  }
}
