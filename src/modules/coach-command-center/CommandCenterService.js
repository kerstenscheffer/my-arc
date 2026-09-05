// ============================================
// 📁 FILE: src/modules/coach-command-center/CommandCenterService.js
// CommandCenterService.js - v3.2
// + getClientsLatestCoachingLog voor coaching status + preview
// ============================================

export default class CommandCenterService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
  }

  // ═══ WEIGHT DATA ═══
  async getClientsWeightData(clients) {
    if (!clients || clients.length === 0) return []
    try {
      const clientIds = clients.map(c => c.id)
      // Was 60 dagen — te kort om volledige gewicht-geschiedenis te tonen
      // in het insight-paneel. We pakken nu 18 maanden zodat de coach
      // alle metingen vanaf challenge-start kan zien.
      const since = new Date()
      since.setDate(since.getDate() - 545)

      const { data: weightLogs, error } = await this.supabase
        .from('weight_challenge_logs')
        .select('client_id, date, weight, is_friday_weighin')
        .in('client_id', clientIds)
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) { console.error('❌ Weight error:', error); return clients.map(c => ({ ...c, weightData: null })) }

      // Actieve trajectfase per klant, in één query voor de hele lijst. De
      // kaart rekent "sinds start" en de kleuren hierop: zonder fase zou een
      // build met +0,2 kg worden afgemeten tegen het doel dat vóór de fase
      // op de klant stond.
      let faseVanKlant = {}
      try {
        // Alleen lopende fases: het fasepaneel sluit de vorige af met een
        // ended_on zodra er een nieuwe start. Zonder dit filter blijft een
        // afgesloten fase het nulpunt bepalen voor "sinds start".
        const { data: fases, error: faseFout } = await this.supabase
          .from('client_phases')
          .select('client_id, started_on, doel, start_gewicht, week_doel_kg')
          .in('client_id', clientIds)
          .is('ended_on', null)
          .order('started_on', { ascending: false })
        // De fout wel benoemen. Faalt dit stil, dan valt de kaart terug op
        // de allereerste meting en ziet dat eruit als een rekenfout in
        // plaats van als ontbrekende data.
        if (faseFout) console.warn('fases laden mislukt (niet-blokkerend):', faseFout.message)
        // Nieuwste eerst, dus de eerste die we tegenkomen is de actieve.
        ;(fases || []).forEach(f => { if (!faseVanKlant[f.client_id]) faseVanKlant[f.client_id] = f })
      } catch (e) { console.warn('fases laden mislukt (niet-blokkerend):', e?.message) }

      const weightByClient = {}
      clientIds.forEach(id => { weightByClient[id] = [] })
      weightLogs?.forEach(log => { if (weightByClient[log.client_id]) weightByClient[log.client_id].push(log) })

      return clients.map(client => {
        const logs = weightByClient[client.id] || []
        const latestLog = logs[0] || null
        let daysSinceWeighin = null
        if (latestLog) daysSinceWeighin = Math.floor((new Date() - new Date(latestLog.date)) / 86400000)
        const fridayCount = logs.filter(l => l.is_friday_weighin).length
        let weightStatus = 'unknown'
        if (!latestLog) weightStatus = 'never'
        else if (daysSinceWeighin === 0) weightStatus = 'today'
        else if (daysSinceWeighin <= 3) weightStatus = 'recent'
        else if (daysSinceWeighin <= 7) weightStatus = 'warning'
        else weightStatus = 'overdue'
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const fridayMissing = today.getDay() === 5 && !logs.some(l => l.date === todayStr)
        return {
          ...client,
          // Was begrensd op 56 entries — te weinig voor volledige
          // historiek. Geen cap meer; we pakken alles binnen het venster.
          weightData: { latest: latestLog, history: logs, daysSinceWeighin, fridayCount, weightStatus, fridayMissing, totalLogs: logs.length },
          fase: faseVanKlant[client.id] || null
        }
      })
    } catch (error) { console.error('❌ Weight error:', error); return clients.map(c => ({ ...c, weightData: null })) }
  }

  // ═══ PHOTO DATA ═══
  async getClientsPhotoData(clientIds) {
    if (!clientIds || clientIds.length === 0) return {}
    try {
      const { data: photos, error } = await this.supabase
        .from('ch8_progress_photos')
        .select('id, client_id, photo_url, photo_date, photo_type, metadata')
        .in('client_id', clientIds)
        .order('photo_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(clientIds.length * 20)
      if (error) { console.error('❌ Photo error:', error); return {} }
      const photosByClient = {}
      clientIds.forEach(id => { photosByClient[id] = { photos: [], totalCount: 0, progressCount: 0, lastPhotoDate: null, lastPhoto: null } })
      photos?.forEach(photo => {
        const cd = photosByClient[photo.client_id]
        if (cd) { cd.photos.push(photo); cd.totalCount++; if ((photo.metadata?.category || 'progress') === 'progress') cd.progressCount++; if (!cd.lastPhoto) { cd.lastPhoto = photo; cd.lastPhotoDate = photo.photo_date } }
      })
      return photosByClient
    } catch (error) { console.error('❌ Photo error:', error); return {} }
  }

  // ═══ WORKOUT SESSION DATA + SCHEMA ═══
  async getClientsWorkoutData(clientIds) {
    if (!clientIds || clientIds.length === 0) return {}
    try {
      const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const [workoutsResult, clientsResult] = await Promise.all([
        this.supabase
          .from('workout_sessions')
          .select('id, client_id, workout_date, day_name, is_completed, exercises_completed, completed_at, notes')
          .in('client_id', clientIds)
          .gte('workout_date', ninetyDaysAgo.toISOString().split('T')[0])
          .order('workout_date', { ascending: false }),
        this.supabase
          .from('clients')
          .select('id, assigned_schema_id')
          .in('id', clientIds)
      ])

      const workouts = workoutsResult.data || []
      const clientsData = clientsResult.data || []

      if (workoutsResult.error) console.error('❌ Workout sessions error:', workoutsResult.error)
      if (clientsResult.error) console.error('❌ Client schema_id error:', clientsResult.error)

      const schemaIds = [...new Set(clientsData.map(c => c.assigned_schema_id).filter(Boolean))]
      let schemasData = []
      if (schemaIds.length > 0) {
        const { data: schemas, error: schemaErr } = await this.supabase
          .from('workout_schemas')
          .select('id, name, days_per_week, experience_level')
          .in('id', schemaIds)
        if (schemaErr) console.error('❌ Schema fetch error:', schemaErr)
        schemasData = schemas || []
      }

      const schemaMap = {}
      schemasData.forEach(s => { schemaMap[s.id] = s })
      const schemaByClient = {}
      clientsData.forEach(c => {
        schemaByClient[c.id] = c.assigned_schema_id ? (schemaMap[c.assigned_schema_id] || null) : null
      })

      const workoutsByClient = {}
      clientIds.forEach(id => {
        workoutsByClient[id] = { workouts: [], totalWorkouts: 0, completedWorkouts: 0, lastWorkoutDate: null, daysSinceWorkout: null, schema: schemaByClient[id] || null }
      })

      workouts?.forEach(w => {
        const cd = workoutsByClient[w.client_id]
        if (cd) {
          cd.workouts.push(w); cd.totalWorkouts++
          if (w.is_completed) cd.completedWorkouts++
          if (!cd.lastWorkoutDate) {
            cd.lastWorkoutDate = w.workout_date
            cd.daysSinceWorkout = Math.floor((new Date() - new Date(w.workout_date)) / 86400000)
          }
        }
      })
      return workoutsByClient
    } catch (error) { console.error('❌ Workout error:', error); return {} }
  }

  // ═══ EXERCISE PROGRESS ═══
  async getClientsExerciseProgress(clientIds) {
    if (!clientIds || clientIds.length === 0) return {}
    try {
      const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      const { data: sessions, error: sessErr } = await this.supabase
        .from('workout_sessions').select('id, client_id, workout_date')
        .in('client_id', clientIds).gte('workout_date', ninetyDaysAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: true })
      if (sessErr || !sessions || sessions.length === 0) return {}
      const sessionMap = {}
      sessions.forEach(s => { sessionMap[s.id] = { client_id: s.client_id, date: s.workout_date } })
      let allProgress = []
      const batchSize = 200
      const batches = []
      for (let i = 0; i < sessions.length; i += batchSize) {
        batches.push(sessions.slice(i, i + batchSize).map(s => s.id))
      }
      const batchResults = await Promise.all(batches.map(batch =>
        this.supabase.from('workout_progress').select('session_id, exercise_name, sets, notes, attachment_used').in('session_id', batch)
      ))
      batchResults.forEach(({ data: progress }) => { if (progress) allProgress = allProgress.concat(progress) })
      const progressByClient = {}
      clientIds.forEach(id => { progressByClient[id] = {} })
      allProgress.forEach(entry => {
        const session = sessionMap[entry.session_id]
        if (!session || !entry.sets || !Array.isArray(entry.sets)) return
        const cId = session.client_id, name = entry.exercise_name
        if (!progressByClient[cId]) progressByClient[cId] = {}
        if (!progressByClient[cId][name]) progressByClient[cId][name] = []
        const completedSets = entry.sets.filter(s => s.completed !== false)
        const bestSet = completedSets.reduce((best, s) => (!best || (s.weight || 0) > (best.weight || 0)) ? s : best, null)
        progressByClient[cId][name].push({
          date: session.date, sessionId: entry.session_id,
          sets: completedSets.map(s => ({ reps: s.reps, weight: s.weight, partials: s.partials || 0, dropsets: s.dropsets || [] })),
          bestWeight: bestSet?.weight || 0, bestReps: bestSet?.reps || 0,
          totalSets: completedSets.length,
          totalVolume: completedSets.reduce((v, s) => v + ((s.weight || 0) * (s.reps || 0)), 0),
          notes: entry.notes || null,
          attachment_used: entry.attachment_used || null,
        })
      })
      return progressByClient
    } catch (error) { console.error('❌ Exercise progress error:', error); return {} }
  }

  // ═══ CIRCUMFERENCE DATA ═══
  async getClientsCircumference(clientIds) {
    if (!clientIds || clientIds.length === 0) return {}
    try {
      const { data: measurements, error } = await this.supabase
        .from('circumference_tracking')
        .select('client_id, measurement_date, waist_cm, bicep_cm, chest_cm, thigh_cm, notes')
        .in('client_id', clientIds).order('measurement_date', { ascending: false }).limit(500)
      if (error) { console.error('❌ Circumference error:', error); return {} }
      const byClient = {}
      clientIds.forEach(id => { byClient[id] = { entries: [], latest: null, previous: null } })
      measurements?.forEach(m => {
        const cd = byClient[m.client_id]
        if (cd) { cd.entries.push(m); if (!cd.latest) cd.latest = m; else if (!cd.previous) cd.previous = m }
      })
      return byClient
    } catch (error) { console.error('❌ Circumference error:', error); return {} }
  }

  // ═══ MEAL DATA ═══
  async getClientsMealData(clientIds) {
    if (!clientIds || clientIds.length === 0) return {}
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString()

      const [mealsResult, plansResult] = await Promise.all([
        this.supabase
          .from('consumed_meals')
          .select('client_id, consumed_at, calories, protein, carbs, fat, meal_type, meal_name')
          .in('client_id', clientIds)
          .gte('consumed_at', sevenDaysAgoStr)
          .order('consumed_at', { ascending: true }),
        this.supabase
          .from('client_meal_plans')
          .select('client_id, id, is_active, template_name, daily_calories, daily_protein, daily_carbs, daily_fat, created_at')
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })
      ])

      const meals = mealsResult.data || []
      const plans = plansResult.data || []

      const byClient = {}
      clientIds.forEach(id => {
        byClient[id] = {
          plan: null, targets: null, todayMeals: [],
          todayTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          dailyLog: {}, loggingDays: 0, avgCalories: 0
        }
      })

      plans.forEach(p => {
        const cd = byClient[p.client_id]
        if (cd && !cd.plan) {
          cd.plan = { id: p.id, isActive: p.is_active, name: p.template_name }
          cd.targets = (p.daily_calories || p.daily_protein) ? {
            calories: p.daily_calories || 0, protein: p.daily_protein || 0,
            carbs: p.daily_carbs || 0, fat: p.daily_fat || 0
          } : null
        }
      })

      const todayStr = new Date().toISOString().split('T')[0]
      meals.forEach(m => {
        const cd = byClient[m.client_id]
        if (!cd) return
        const day = m.consumed_at.split('T')[0]
        if (!cd.dailyLog[day]) cd.dailyLog[day] = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0, meals: [] }
        cd.dailyLog[day].calories += m.calories || 0
        cd.dailyLog[day].protein  += parseFloat(m.protein) || 0
        cd.dailyLog[day].carbs    += parseFloat(m.carbs)   || 0
        cd.dailyLog[day].fat      += parseFloat(m.fat)     || 0
        cd.dailyLog[day].count++
        cd.dailyLog[day].meals.push({ name: m.meal_name || 'Onbekend', type: m.meal_type || 'other', calories: m.calories || 0, protein: parseFloat(m.protein) || 0, carbs: parseFloat(m.carbs) || 0, fat: parseFloat(m.fat) || 0, time: m.consumed_at })
        if (day === todayStr) {
          cd.todayMeals.push(m)
          cd.todayTotals.calories += m.calories || 0
          cd.todayTotals.protein  += parseFloat(m.protein) || 0
          cd.todayTotals.carbs    += parseFloat(m.carbs)   || 0
          cd.todayTotals.fat      += parseFloat(m.fat)     || 0
        }
      })

      Object.values(byClient).forEach(cd => {
        const days = Object.keys(cd.dailyLog)
        cd.loggingDays  = days.length
        if (days.length > 0) cd.avgCalories = Math.round(days.reduce((sum, d) => sum + cd.dailyLog[d].calories, 0) / days.length)
      })

      return byClient
    } catch (error) { console.error('❌ Meal data error:', error); return {} }
  }

  // ═══ COACHING PLAN DATA ═══
  async getClientsCoachingPlan(clientIds) {
    if (!clientIds || clientIds.length === 0) return {}
    try {
      const { data, error } = await this.supabase
        .from('client_journeys')
        .select('client_id, start_date, total_weeks, coaching_plan')
        .in('client_id', clientIds)
        .not('coaching_plan', 'is', null)
      if (error) { console.error('❌ Coaching plan error:', error); return {} }
      const byClient = {}
      data?.forEach(j => {
        if (!byClient[j.client_id] && j.coaching_plan) {
          byClient[j.client_id] = { startDate: j.start_date, totalWeeks: j.total_weeks, plan: j.coaching_plan }
        }
      })
      return byClient
    } catch (error) { console.error('❌ Coaching plan error:', error); return {} }
  }

  // ═══ COACHING LOG DATA (NIEUW) ═══
  // Haalt de laatste coaching log entry per client op in één query
  async getClientsLatestCoachingLog(clientIds) {
    if (!clientIds || clientIds.length === 0) return {}
    try {
      // Haal de laatste N logs op (1 per client is genoeg), gesorteerd desc
      const { data, error } = await this.supabase
        .from('client_coaching_logs')
        .select('id, client_id, status, note, created_at')
        .in('client_id', clientIds)
        .order('created_at', { ascending: false })
        .limit(clientIds.length * 5)
      if (error) { console.error('❌ Coaching log error:', error); return {} }
      const byClient = {}
      data?.forEach(log => {
        // Eerste (nieuwste) entry per client bewaren
        if (!byClient[log.client_id]) byClient[log.client_id] = log
      })
      return byClient
    } catch (error) { console.error('❌ Coaching log error:', error); return {} }
  }

  // ═══ SORTING ═══
  sortByUrgency(clientsWithData) {
    return [...clientsWithData].sort((a, b) => {
      const order = { 'never': 0, 'overdue': 1, 'warning': 2, 'recent': 3, 'today': 4, 'unknown': 5 }
      if (a.weightData?.fridayMissing && !b.weightData?.fridayMissing) return -1
      if (!a.weightData?.fridayMissing && b.weightData?.fridayMissing) return 1
      return (order[a.weightData?.weightStatus || 'unknown']) - (order[b.weightData?.weightStatus || 'unknown'])
    })
  }
}
