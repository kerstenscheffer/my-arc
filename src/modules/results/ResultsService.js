// src/modules/results/ResultsService.js
// Tabelnamen gebaseerd op CommandCenterService.js (de bron van waarheid)

export default class ResultsService {
  constructor(supabase) {
    this.supabase = supabase
  }

  // ── Gewicht → weight_challenge_logs (zelfde als CommandCenterService) ──────
  async getWeightHistory(clientId) {
    const { data, error } = await this.supabase
      .from('weight_challenge_logs')
      .select('weight, date, is_friday_weighin')
      .eq('client_id', clientId)
      .order('date', { ascending: true })

    if (error) { console.error('ResultsService.getWeightHistory:', error); return [] }
    return (data || []).map(r => ({
      weight: parseFloat(r.weight),
      date: r.date,
      isFriday: r.is_friday_weighin,
    }))
  }

  // ── Foto's → ch8_progress_photos (zelfde als CommandCenterService) ─────────
  async getProgressPhotos(clientId) {
    const { data, error } = await this.supabase
      .from('ch8_progress_photos')
      .select('id, photo_url, photo_date, metadata')
      .eq('client_id', clientId)
      .order('photo_date', { ascending: true })

    if (error) { console.error('ResultsService.getProgressPhotos:', error); return [] }
    // Zelfde filter als WeightColumn / CommandCenterService
    return (data || []).filter(p => (p.metadata?.category || 'progress') === 'progress')
  }

  // ── Exercise PRs → berekend uit workout_sessions + workout_progress ────────
  // Zelfde logica als CommandCenterService.getClientsExerciseProgress
  async getExercisePRs(clientId) {
    // Stap 1: haal alle sessies op voor deze client
    const { data: sessions, error: sessErr } = await this.supabase
      .from('workout_sessions')
      .select('id, workout_date')
      .eq('client_id', clientId)
      .order('workout_date', { ascending: true })

    // Geen error loggen als er gewoon geen sessies zijn
    if (sessErr) { console.error('ResultsService.getExercisePRs sessions error:', sessErr); return {} }
    if (!sessions?.length) { return {} }

    // Stap 2: haal workout_progress op voor alle sessies
    const sessionIds = sessions.map(s => s.id)
    const dateMap = {}
    sessions.forEach(s => { dateMap[s.id] = s.workout_date })

    const batchSize = 200
    let allProgress = []
    for (let i = 0; i < sessionIds.length; i += batchSize) {
      const batch = sessionIds.slice(i, i + batchSize)
      const { data: progress, error: progErr } = await this.supabase
        .from('workout_progress')
        .select('session_id, exercise_name, sets')
        .in('session_id', batch)
      if (progErr) { console.error('ResultsService.getExercisePRs progress:', progErr); continue }
      if (progress) allProgress = allProgress.concat(progress)
    }

    // Stap 3: groepeer per oefening, bereken beste gewicht per sessie
    const byExercise = {}
    allProgress.forEach(entry => {
      if (!entry.sets || !Array.isArray(entry.sets)) return
      const name = entry.exercise_name
      const date = dateMap[entry.session_id]
      if (!date) return

      const completedSets = entry.sets.filter(s => s.completed !== false)
      const bestSet = completedSets.reduce((best, s) =>
        (!best || (s.weight || 0) > (best.weight || 0)) ? s : best, null)
      if (!bestSet || !bestSet.weight) return

      if (!byExercise[name]) byExercise[name] = []
      byExercise[name].push({
        date,
        weight: parseFloat(bestSet.weight),
        reps: bestSet.reps || 0,
      })
    })

    // Stap 4: sorteren op datum per oefening
    Object.keys(byExercise).forEach(name => {
      byExercise[name].sort((a, b) => a.date.localeCompare(b.date))
    })

    return byExercise
  }

  // ── Wins & reviews → client_results ──────────────────────────────────────
  async getWins(clientId) {
    const { data, error } = await this.supabase
      .from('client_results')
      .select('id, title, result_type, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) { console.error('ResultsService.getWins:', error); return [] }
    return data || []
  }

  async saveWin(clientId, text) {
    const { data, error } = await this.supabase
      .from('client_results')
      .insert({ client_id: clientId, result_type: 'testimonial', title: text.trim() })
      .select()
      .single()

    if (error) { console.error('ResultsService.saveWin:', error); throw error }
    return data
  }

  async deleteWin(id) {
    const { error } = await this.supabase
      .from('client_results')
      .delete()
      .eq('id', id)

    if (error) { console.error('ResultsService.deleteWin:', error); throw error }
  }
}
