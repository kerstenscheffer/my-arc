// src/modules/meal-plan/utils/maaltijdenVoorDag.js
//
// De maaltijden van één dag, zoals de dagplanning ze toont: weekplan (of een
// dagtemplate voor die datum), de eenmalige aanpassingen van de klant op die
// datum, en de pre-workout volgens de vaste regel. Uit AIDaySchedule gehaald
// (27 okt 2026) zodat het weekoverzicht ("plan vooruit") precies hetzelfde
// laat zien als de dagpagina, zonder een vierde eigen route.
import { laadDagAanpassingen } from '../dagAanpassingen'
import { preWorkoutVoorDag, PRE_WORKOUT_SLOT, preWorkoutTijd } from './preWorkoutMeal'

// dagTemplate = client_day_overrides.dag voor deze datum (wint van het plan).
// trainingStart = aanvang van de training op deze weekdag ('18:00') of null.
export async function maaltijdenVoorDag({ supabase, clientId, activePlan, dagTemplate = null, dayKey, datum, workoutSchedule = null, trainingStart = null }) {
  const dayPlan = dagTemplate || activePlan?.week_structure?.[dayKey]
  if (!dayPlan || !dayKey) return []
  // Maaltijden die de klant voor díé datum heeft aangepast ("alleen
  // vandaag"). Die winnen van het plan, ook als je de dag later bekijkt
  // en dan pas afvinkt.
  const aangepast = (await laadDagAanpassingen(supabase, clientId, datum))[datum] || {}

  const meals = []
  const getMealData = async (mealRef) => {
    if (!mealRef) return null
    if (typeof mealRef === 'object') {
      if (mealRef.calories) return mealRef
      if (mealRef.id || mealRef.meal_id) {
        const mealId = mealRef.id || mealRef.meal_id
        if (typeof mealId === 'string') mealRef = mealId; else return mealRef
      }
    }
    if (typeof mealRef === 'string') {
      try {
        const cleanId = mealRef.replace('_small','').replace('_large','').replace('_xl','').replace('_medium','')
        const { data, error } = await supabase.from('ai_meals').select('*').eq('id', cleanId).single()
        return error ? null : data
      } catch { return null }
    }
    return null
  }
  
  // Standaard label + tijd per slot. Coach kan dit overrulen met een eigen
  // titel (display_label, bv. "Pre Workout Meal") — die wint altijd.
  const SLOT_META = {
    breakfast: { label: 'Ontbijt', time: 8 },
    lunch:     { label: 'Lunch', time: 12.5 },
    dinner:    { label: 'Diner', time: 18.5 },
    snack1:    { label: 'Snack 1', time: 10 },
    snack2:    { label: 'Snack 2', time: 15 },
    snack3:    { label: 'Snack 3', time: 20.5 },
    snack4:    { label: 'Snack 4', time: 21.5 },
  }
  // Niet-maaltijd keys in het dag-object overslaan.
  const NON_MEAL = new Set(['totals', 'is_training_day', 'dayId', 'scaling'])
  const pretty = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Maaltijd'
  const parseTime = (t) => { const mm = /(\d{1,2}):(\d{2})/.exec(t || ''); return mm ? parseInt(mm[1], 10) + parseInt(mm[2], 10) / 60 : null }

  // ALLE slots in het dag-plan doorlopen (niet alleen de vaste 5), zodat
  // snack3+/custom maaltijden óók verschijnen.
  for (const slot of Object.keys(dayPlan)) {
    if (NON_MEAL.has(slot) || !dayPlan[slot]) continue
    const stored = dayPlan[slot]
    const displayLabel = (stored && typeof stored === 'object' && stored.display_label) || null
    const meta = SLOT_META[slot] || {}
    // Eenmalig weggehaald op deze datum (prullenbakje).
    if (aangepast[slot]?.verwijderd) continue
    const d = aangepast[slot] || await getMealData(stored)
    if (!d) continue
    const label = displayLabel || meta.label || pretty(slot)
    let plannedTime = parseTime(typeof stored === 'object' ? stored.timing : null) ?? meta.time ?? 12
    // De pre-workout maaltijd volgt de training van die dag. Ook `timing`
    // bijwerken: dat is het veld dat de kaart toont, plannedTime stuurt
    // alleen de volgorde.
    let toonTijd = (typeof stored === 'object' && typeof stored.timing === 'string') ? stored.timing : null
    if (slot === PRE_WORKOUT_SLOT) {
      const uitTraining = preWorkoutTijd(trainingStart, null)
      if (uitTraining) { plannedTime = parseTime(uitTraining); toonTijd = uitTraining }
    }
    meals.push({
      ...d,
      slot,
      display_label: displayLabel || d.display_label || null,
      timeSlot: label,
      plannedTime,
      // Ná de spread: de maaltijd uit ai_meals draagt zijn eigen timing
      // en die zou de berekende tijd anders overschrijven.
      timing: toonTijd,
      meal_name: d.name || d.meal_name || label,
      meal_id: d.id || d.meal_id,
    })
  }
  // ── Pre-workout maaltijd ──
  // Staat één keer op het plan en hoort er alleen bij op trainingsdagen.
  // Hij zit niet in week_structure, dus de lus hierboven ziet 'm niet —
  // daarom hier apart. Welke dagen trainingsdagen zijn komt uit
  // clients.workout_schedule: verschuift de klant een training, dan
  // verhuist deze maaltijd vanzelf mee.
  // Niet als de dag zelf al een pre-workout slot heeft: die is in de lus
  // hierboven al opgepikt en zou anders twee keer op de tijdlijn staan.
  const preWorkoutPlan = dayPlan?.[PRE_WORKOUT_SLOT] || aangepast[PRE_WORKOUT_SLOT]?.verwijderd
    ? null
    : preWorkoutVoorDag(activePlan, workoutSchedule, dayKey, dayPlan)
  // Kopie, niet het object uit het plan zelf aanpassen.
  const preWorkout = preWorkoutPlan && aangepast[PRE_WORKOUT_SLOT]
    ? { ...preWorkoutPlan, ...aangepast[PRE_WORKOUT_SLOT], timing: preWorkoutPlan.timing }
    : preWorkoutPlan
  if (preWorkout) {
    const pwTekst = preWorkoutTijd(trainingStart, preWorkout.timing)
    const pwTijd = parseTime(pwTekst) ?? 15.5
    meals.push({
      ...preWorkout,
      timing: typeof pwTekst === 'string' ? pwTekst : null,
      slot: PRE_WORKOUT_SLOT,
      display_label: preWorkout.display_label || 'Pre-workout',
      timeSlot: preWorkout.display_label || 'Pre-workout',
      plannedTime: pwTijd,
      meal_name: preWorkout.name || preWorkout.meal_name || 'Pre-workout',
      meal_id: preWorkout.id || preWorkout.meal_id,
    })
  }

  // Eenmalig toegevoegd op een moment dat niet in het plan staat.
  for (const [slot, m] of Object.entries(aangepast)) {
    if (!m || m.verwijderd || dayPlan[slot] || meals.some(x => x.slot === slot)) continue
    const meta = SLOT_META[slot] || (slot === PRE_WORKOUT_SLOT ? { label: 'Pre-workout', time: 15.5 } : {})
    meals.push({
      ...m, slot,
      timeSlot: meta.label || pretty(slot),
      plannedTime: meta.time ?? 12,
      timing: null,
      meal_name: m.name || m.meal_name || meta.label || pretty(slot),
      meal_id: m.id || m.meal_id,
    })
  }

  // Op geplande tijd sorteren zodat de volgorde klopt (ook voor custom slots).
  meals.sort((a, b) => (a.plannedTime ?? 12) - (b.plannedTime ?? 12))
  return meals
}
