// src/modules/workout/utils/exerciseCompletion.js
// Eén bron van waarheid voor "is deze oefening / workout écht klaar?".
//
// Datamodel: todaysLogs = rijen uit workout_progress, per oefening één rij met
// een jsonb `sets`-array [{ reps, weight, completed }]. Een set telt als gedaan
// zolang completed !== false (oudere logs zonder dat veld tellen mee, net als
// in buildPumpStats). Vóór deze helper werd een oefening al "voltooid" zodra er
// 1 log-rij bestond — waardoor 1 set de hele oefening doorstreepte en 1 oefening
// de hele training op "Voltooid" zette. Dat is precies wat dit oplost.

// Geplande sets uit het schema. exercise.sets kan een getal of string zijn
// ('3', '3-4', '3x10'); we pakken het eerste hele getal. Onbekend → 1, zodat
// het gedrag terugvalt op "één set = klaar" i.p.v. iets te blokkeren.
export function plannedSetCount(exercise) {
  const raw = exercise?.sets
  if (typeof raw === 'number' && raw > 0) return Math.floor(raw)
  const m = String(raw ?? '').match(/\d+/)
  const n = m ? parseInt(m[0], 10) : 0
  return n > 0 ? n : 1
}

// Aantal daadwerkelijk voltooide sets voor een oefening. Bij meerdere log-rijen
// (her-loggen) nemen we de rijkste sessie (max), niet de som — voorkomt dubbeltel.
export function completedSetCount(exerciseName, todaysLogs) {
  const logs = Array.isArray(todaysLogs) ? todaysLogs : []
  let best = 0
  for (const log of logs) {
    if (log?.exercise_name !== exerciseName) continue
    const sets = Array.isArray(log?.sets) ? log.sets : []
    const done = sets.filter(s => s?.completed !== false).length
    // Fallback: een log-rij zonder sets-array telt als 1 gedane set.
    const count = sets.length === 0 ? 1 : done
    if (count > best) best = count
  }
  return best
}

// Oefening volledig gelogd = minstens alle geplande sets gedaan (en > 0).
export function isExerciseFullyLogged(exercise, todaysLogs) {
  const done = completedSetCount(exercise?.name, todaysLogs)
  return done > 0 && done >= plannedSetCount(exercise)
}

// Hele workout klaar = er zijn oefeningen én ze zijn allemaal volledig gelogd.
export function isWorkoutFullyLogged(exercises, todaysLogs) {
  const list = Array.isArray(exercises) ? exercises : []
  if (list.length === 0) return false
  return list.every(ex => isExerciseFullyLogged(ex, todaysLogs))
}

// Voortgang als percentage op set-niveau: voltooide sets / geplande sets over
// de hele workout. Per oefening gecapt op de geplande sets zodat extra sets
// het niet boven 100% duwen. 0–100, afgerond.
export function workoutCompletionPct(exercises, todaysLogs) {
  const list = Array.isArray(exercises) ? exercises : []
  if (list.length === 0) return 0
  let planned = 0
  let done = 0
  for (const ex of list) {
    const p = plannedSetCount(ex)
    planned += p
    done += Math.min(completedSetCount(ex?.name, todaysLogs), p)
  }
  if (planned === 0) return 0
  return Math.max(0, Math.min(100, Math.round((done / planned) * 100)))
}
