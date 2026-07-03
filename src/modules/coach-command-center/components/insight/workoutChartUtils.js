// ============================================================
// 📁 src/modules/coach-command-center/components/insight/workoutChartUtils.js
// Pure helpers for the WorkoutOverviewChart.
// No React, no DOM — testable in isolation.
// ============================================================

// ── Estimated 8-rep weight (Epley → 8RM) ──
// est8Rep = weight × (30 + reps) / 38
// 100kg×5 → 92.1   80kg×12 → 88.4   100kg×8 → 100.0
export const est8Rep = (weight, reps) => {
  const w = parseFloat(weight)
  const r = parseInt(reps)
  if (!Number.isFinite(w) || !Number.isFinite(r)) return null
  if (w <= 0 || r <= 0 || r > 20) return null
  return (w * (30 + r)) / 38
}

// ── Muscle group base colors ──
// Echt distincte hues per spiergroep — anders zijn lijnen niet uit elkaar te
// halen in de grafiek. Goud blijft voor "back" om de brand-kleur behouden te
// houden als visueel anker (back-days zijn meest voorkomend). Andere kleuren
// gekozen op contrast + leesbaarheid op donkere achtergrond.
// Binnen één groep blijft `shadeColor` de lichtheid variëren voor multi-
// oefening days, maar de hue blijft consistent per spiergroep.
export const MUSCLE_COLORS = {
  chest:     '#ef4444', // rood
  back:      '#FFD700', // goud (brand-anker)
  shoulders: '#f59e0b', // oranje/amber
  biceps:    '#a855f7', // paars
  triceps:   '#06b6d4', // cyaan
  legs:      '#10b981', // groen
  core:      '#ec4899', // roze
  other:     '#94a3b8', // grijs/slate
}

export const MUSCLE_LABELS = {
  chest:     'Borst',
  back:      'Rug',
  shoulders: 'Schouders',
  biceps:    'Biceps',
  triceps:   'Triceps',
  legs:      'Benen',
  core:      'Core',
  other:     'Overig',
}

export const MUSCLE_ORDER = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'other']

// ── HSL shade variation within a muscle group ──
// idx 0..total-1 maps to lightness 38..62 (range 24).
// Single-exercise group → mid lightness 50.
const hexToHsl = (hex) => {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return [0, 0, 50]
  const [r, g, b] = m.map(x => parseInt(x, 16) / 255)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  const l = (mx + mn) / 2
  let h = 0, s = 0
  if (mx !== mn) {
    const d = mx - mn
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    switch (mx) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return [h, s * 100, l * 100]
}

export const shadeColor = (baseHex, idx, total) => {
  const [h, s] = hexToHsl(baseHex)
  if (total <= 1) return `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, 50%)`
  const lMin = 38, lMax = 62
  const l = lMin + (idx / (total - 1)) * (lMax - lMin)
  return `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`
}

// ── Per-session datapoint: max est8Rep across all valid sets ──
export const computeSessionValue = (sets) => {
  if (!Array.isArray(sets) || sets.length === 0) return null
  const vals = []
  for (const s of sets) {
    const v = est8Rep(s.weight, s.reps)
    if (v !== null) vals.push(v)
  }
  return vals.length === 0 ? null : Math.max(...vals)
}

// ── Trend detection (last vs first in window, 5% tolerance) ──
export const detectTrend = (points) => {
  if (!Array.isArray(points) || points.length < 2) return 'flat'
  const first = points[0].value
  const last = points[points.length - 1].value
  if (!first || !last) return 'flat'
  const ratio = last / first
  if (ratio >= 1.05) return 'up'
  if (ratio <= 0.95) return 'down'
  return 'flat'
}

// ── PR markers: mark every point that hits the maximum value in the window ──
export const markPRs = (points) => {
  if (!Array.isArray(points) || points.length === 0) return points
  const max = points.reduce((m, p) => p.value > m ? p.value : m, -Infinity)
  return points.map(p => ({ ...p, isPR: p.value === max }))
}

// ── Date range filter ──
const RANGE_DAYS = { '30d': 30, '90d': 90, '1y': 365, 'all': null }

const filterByRange = (entries, range) => {
  const days = RANGE_DAYS[range]
  if (days === null || days === undefined) return entries
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffMs = cutoff.getTime()
  return entries.filter(e => new Date(e.date).getTime() >= cutoffMs)
}

// ── Keyword-based muscle group guess (last-resort fallback) ──
// Used when DB lookup fails (custom exercise without primair_spieren, name typo, etc).
// Order matters: more specific compound terms first to avoid false matches.
export const guessMuscleByKeywords = (name) => {
  if (!name) return null
  const n = name.toLowerCase()
  // Core (check first — "ab roller" shouldn't match "row")
  if (/(?:\babs?\b|crunch|plank|russian|sit.?up|leg raise|hanging leg|woodchop|\bcore\b|hollow hold)/.test(n)) return 'core'
  // Legs (check before generic "curl"/"extension" — "leg curl"/"leg extension" must match legs)
  if (/(?:leg curl|leg extension|leg press|\bsquat|\blunge|\bcalf|hamstring|quad(?!riceps tricep)|\bglute|hack squat|step.?up|hip thrust|split squat|bulgarian)/.test(n)) return 'legs'
  // Back (compound first — "upright row" is shoulders, "barbell row" is back)
  if (/(?:dead.?lift|romanian|\brdl\b|pull.?up|chin.?up|pull.?down|lat pull|t.?bar row|seated row|bent.?over row|cable row|barbell row|dumbbell row|back extension|good morning)/.test(n)) return 'back'
  // Chest
  if (/(?:bench press|chest press|chest fly|pec deck|cable fly|dumbbell fly|incline press|decline press|push.?up|\bdip\b|svend press)/.test(n)) return 'chest'
  // Shoulders
  if (/(?:shoulder press|military press|overhead press|\bohp\b|arnold press|lateral raise|front raise|rear delt|\bshrug|upright row|face pull)/.test(n)) return 'shoulders'
  // Triceps
  if (/(?:tricep|push.?down|skull crusher|kickback|close.?grip|french press|tate press|jm press)/.test(n)) return 'triceps'
  // Biceps
  if (/(?:bicep|preacher curl|hammer curl|barbell curl|dumbbell curl|cable curl|concentration curl|spider curl|incline curl|reverse curl|zottman)/.test(n)) return 'biceps'
  // Generic single-word last resorts
  if (/\bcurl\b/.test(n)) return 'biceps'      // any unqualified "curl" → biceps
  if (/\brow\b/.test(n)) return 'back'         // unqualified "row" → back
  if (/\bfly\b|\bflye\b/.test(n)) return 'chest'
  if (/\bpress\b/.test(n)) return 'chest'      // educated guess: bench press is most common unqualified "press"
  return null
}

// ── Resolve muscle group for an exercise name ──
// muscleMap: { [exerciseName]: 'chest' | 'back' | ... }
// Lookup chain:  exact → case-insensitive → keyword-guess → 'other'
const resolveMuscle = (exerciseName, muscleMap) => {
  if (!exerciseName) return 'other'
  const direct = muscleMap[exerciseName]
  if (direct) return direct
  const lower = exerciseName.toLowerCase()
  for (const key in muscleMap) {
    if (key.toLowerCase() === lower) return muscleMap[key]
  }
  const guessed = guessMuscleByKeywords(exerciseName)
  if (guessed) return guessed
  return 'other'
}

// ── Main pipeline ──
// exerciseProgress: { [name]: [{ date, sessionId, sets:[{weight, reps, ...}], ... }, ...] }
// muscleMap:        { [name]: 'chest' | ... }
// range:            '30d' | '90d' | '1y' | 'all'
// minSessions:      threshold (default 3)
//
// Returns:
// {
//   datasets: [
//     { exercise, muscleGroup, color, trend: 'up'|'down'|'flat',
//       points: [{ date, value, isPR }] }
//   ],
//   byMuscleGroup: { [muscle]: [exerciseName, ...] },
//   allDates: ['2026-01-15', ...]   // sorted, all unique dates that appear
// }
export const buildChartData = (exerciseProgress = {}, muscleMap = {}, range = '90d', minSessions = 3) => {
  // 1. Per exercise: filter + compute value per session
  const perExercise = []
  for (const [name, entries] of Object.entries(exerciseProgress)) {
    if (!Array.isArray(entries)) continue
    const filtered = filterByRange(entries, range)
    if (filtered.length < minSessions) continue
    const points = filtered
      .map(e => ({ date: e.date, value: computeSessionValue(e.sets) }))
      .filter(p => p.value !== null)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    if (points.length < minSessions) continue
    perExercise.push({ exercise: name, points })
  }

  // 2. Group by muscle group
  const byMuscleGroup = {}
  for (const item of perExercise) {
    const muscle = resolveMuscle(item.exercise, muscleMap)
    if (!byMuscleGroup[muscle]) byMuscleGroup[muscle] = []
    byMuscleGroup[muscle].push(item)
  }

  // 3. Assign shaded color per exercise within its group
  const datasets = []
  for (const muscle of MUSCLE_ORDER) {
    const items = byMuscleGroup[muscle]
    if (!items || items.length === 0) continue
    items.sort((a, b) => a.exercise.localeCompare(b.exercise))
    const base = MUSCLE_COLORS[muscle] || MUSCLE_COLORS.other
    items.forEach((item, idx) => {
      const points = markPRs(item.points)
      datasets.push({
        exercise: item.exercise,
        muscleGroup: muscle,
        color: shadeColor(base, idx, items.length),
        trend: detectTrend(points),
        points,
      })
    })
  }
  // Any unexpected muscle keys not in MUSCLE_ORDER end up here:
  for (const muscle of Object.keys(byMuscleGroup)) {
    if (MUSCLE_ORDER.includes(muscle)) continue
    const items = byMuscleGroup[muscle]
    items.sort((a, b) => a.exercise.localeCompare(b.exercise))
    items.forEach((item, idx) => {
      const points = markPRs(item.points)
      datasets.push({
        exercise: item.exercise,
        muscleGroup: 'other',
        color: shadeColor(MUSCLE_COLORS.other, idx, items.length),
        trend: detectTrend(points),
        points,
      })
    })
  }

  // 4. Collect all unique dates across all datasets
  const dateSet = new Set()
  datasets.forEach(d => d.points.forEach(p => dateSet.add(p.date)))
  const allDates = Array.from(dateSet).sort()

  // 5. Group exercises by muscle group for legend rendering
  const legendGroups = {}
  for (const muscle of MUSCLE_ORDER) {
    const list = datasets.filter(d => d.muscleGroup === muscle).map(d => d.exercise)
    if (list.length > 0) legendGroups[muscle] = list
  }

  return { datasets, byMuscleGroup: legendGroups, allDates }
}

// ── Reshape to recharts-friendly format ──
// Each row: { date, [exercise]: value, [exercise]__pr: boolean, ... }
// PR flag travels with the data so the custom dot renderer can highlight records.
// Missing values are undefined so recharts can use connectNulls.
export const toRechartsData = (datasets, allDates) => {
  const map = new Map()
  for (const date of allDates) map.set(date, { date })
  for (const ds of datasets) {
    for (const p of ds.points) {
      const row = map.get(p.date) || { date: p.date }
      row[ds.exercise] = Math.round(p.value * 10) / 10
      if (p.isPR) row[`${ds.exercise}__pr`] = true
      map.set(p.date, row)
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date))
}
