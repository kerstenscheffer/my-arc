// src/modules/results/TrajectPDFService.js
// Verzamelt alle data voor de eind-van-traject-PDF van één klant:
//  - gewicht-progressie (weight_challenge_logs)
//  - before/after-foto's (ch8_progress_photos, voorkant)
//  - kracht per spiergroep (workout_sessions + workout_progress) — per spiergroep
//    de 2 meest gedane oefeningen, met start- en eindgewicht (top-set).
import EXERCISE_DATABASE from '../workout/constants/exerciseDatabase'

const MUSCLE_LABELS = {
  chest: 'Borst', back: 'Rug', legs: 'Benen', shoulders: 'Schouders',
  biceps: 'Biceps', triceps: 'Triceps', abs: 'Buik', glutes: 'Bilspieren',
  overig: 'Overig',
}
const MUSCLE_ORDER = ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'glutes', 'abs', 'overig']

// Oefeningnaam (lowercase) → spiergroep, opgebouwd uit EXERCISE_DATABASE.
function buildReverseMuscleMap() {
  const map = {}
  for (const [muscle, groups] of Object.entries(EXERCISE_DATABASE || {})) {
    for (const list of Object.values(groups || {})) {
      if (!Array.isArray(list)) continue
      for (const ex of list) { if (ex?.name) map[ex.name.toLowerCase()] = muscle }
    }
  }
  return map
}

// Zwaarste set uit een sets-array ([{reps, weight, completed}]).
function topSetWeight(sets) {
  let arr = sets
  if (typeof arr === 'string') { try { arr = JSON.parse(arr) } catch { return null } }
  if (!Array.isArray(arr)) return null
  let max = null
  for (const s of arr) {
    const w = Number(s?.weight)
    if (!isNaN(w) && (max == null || w > max)) max = w
  }
  return max
}

export default class TrajectPDFService {
  constructor(supabase) { this.supabase = supabase }

  async getTrajectData(clientId) {
    const sb = this.supabase

    // ── Gewicht ──
    const { data: weights } = await sb
      .from('weight_challenge_logs').select('date, weight')
      .eq('client_id', clientId).order('date', { ascending: true })
    const w = (weights || []).filter(x => x.weight != null)
    const weight = w.length >= 1 ? {
      first: w[0], last: w[w.length - 1], series: w,
      diff: Math.round((Number(w[w.length - 1].weight) - Number(w[0].weight)) * 10) / 10,
    } : null

    // ── Foto's (voorkant, eerste + laatste) ──
    const { data: photos } = await sb
      .from('ch8_progress_photos').select('photo_url, photo_type, photo_date, metadata')
      .eq('client_id', clientId).order('photo_date', { ascending: true })
    const ph = (photos || []).filter(p => p.photo_url)
    const isFront = (p) => {
      const s = (p.metadata?.subtype || p.photo_type || '').toLowerCase()
      return s === 'front' || s === 'voor' || s.includes('front') || s.includes('voor')
    }
    const front = ph.filter(isFront)
    const usePh = front.length >= 2 ? front : ph
    const photoPair = usePh.length >= 2 ? { first: usePh[0], last: usePh[usePh.length - 1] } : null

    // ── Kracht ──
    const { data: sessions } = await sb
      .from('workout_sessions').select('id, workout_date').eq('client_id', clientId)
    const sessById = new Map((sessions || []).map(s => [s.id, s.workout_date]))
    const sessionIds = [...sessById.keys()]
    let progress = []
    if (sessionIds.length) {
      const { data: prog } = await sb
        .from('workout_progress').select('session_id, exercise_name, sets')
        .in('session_id', sessionIds)
      progress = prog || []
    }
    const exMap = new Map()
    for (const row of progress) {
      const date = sessById.get(row.session_id)
      if (!date || !row.exercise_name) continue
      const top = topSetWeight(row.sets)
      if (!exMap.has(row.exercise_name)) exMap.set(row.exercise_name, { name: row.exercise_name, count: 0, entries: [] })
      const e = exMap.get(row.exercise_name)
      e.count++
      if (top != null) e.entries.push({ date, weight: top })
    }
    const muscleMap = buildReverseMuscleMap()
    const byMuscle = {}
    for (const e of exMap.values()) {
      e.entries.sort((a, b) => new Date(a.date) - new Date(b.date))
      const start = e.entries[0], end = e.entries[e.entries.length - 1]
      const muscle = muscleMap[e.name.toLowerCase()] || 'overig'
      ;(byMuscle[muscle] ||= []).push({
        name: e.name, count: e.count,
        start: start?.weight ?? null, end: end?.weight ?? null,
      })
    }
    // Per spiergroep de 2 meest gedane oefeningen, in vaste volgorde.
    const strength = MUSCLE_ORDER
      .filter(m => byMuscle[m]?.length)
      .map(m => ({
        muscle: m, label: MUSCLE_LABELS[m] || m,
        exercises: byMuscle[m].sort((a, b) => b.count - a.count).slice(0, 2),
      }))

    // ── Periode ──
    const allDates = [
      ...w.map(x => x.date),
      ...usePh.map(p => p.photo_date),
      ...[...sessById.values()],
    ].filter(Boolean).map(d => new Date(d)).sort((a, b) => a - b)
    const period = allDates.length ? { start: allDates[0], end: allDates[allDates.length - 1] } : null

    return {
      weight, photoPair, strength, period,
      photos: usePh.map(p => ({ url: p.photo_url, date: p.photo_date })),
    }
  }
}
