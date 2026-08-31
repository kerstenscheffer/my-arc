// src/modules/meal-plan/utils/preWorkoutMeal.js
//
// Pre-workout maaltijd: één maaltijd per plan, die alleen op trainingsdagen
// verschijnt.
//
// Waarom niet gewoon in week_structure per dag?
// Omdat de klant z'n trainingsdagen verschuift. Zou de maaltijd op maandag
// staan en de klant verplaatst z'n training naar dinsdag, dan moest iemand het
// meal-plan herschrijven. Nu staat hij één keer op het plan
// (client_meal_plans.pre_workout_meal) en bepaalt de app per dag of hij
// getoond wordt. Verschuift de training, dan schuift de maaltijd mee zonder
// dat er data verandert.
//
// Bron voor "is dit een trainingsdag" is clients.workout_schedule — dezelfde
// bron als de agenda en de workout-pagina. De vlag week_structure[dag]
// .is_training_day bestaat ook, maar die kan stale zijn (zie de opmerking in
// ClientAgendaService); die gebruiken we alleen als er geen workout_schedule is.

export const PRE_WORKOUT_SLOT = 'pre_workout'

// week_structure gebruikt kleine Engelse dagnamen; workout_schedule gebruikt
// hoofdletters ("Monday"). Vandaar overal een case-ongevoelige vergelijking.
const DAG_VOLGORDE = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export const dagSleutelVanIndex = (i) => DAG_VOLGORDE[i] ?? null

/**
 * Traint de klant op deze dag?
 * @param {object} workoutSchedule  clients.workout_schedule — { Monday: 'dag1', … }
 * @param {string} dagSleutel       'monday' | 'tuesday' | …
 * @param {object} [dagData]        week_structure[dag], voor de terugval
 */
export const isTrainingsdag = (workoutSchedule, dagSleutel, dagData = null) => {
  if (!dagSleutel) return false
  if (workoutSchedule && typeof workoutSchedule === 'object') {
    const doel = String(dagSleutel).toLowerCase()
    for (const k of Object.keys(workoutSchedule)) {
      if (String(k).toLowerCase() === doel) return !!workoutSchedule[k]
    }
    // Er ís een schedule, deze dag staat er niet in → geen trainingsdag.
    return false
  }
  return !!dagData?.is_training_day
}

/**
 * De pre-workout maaltijd voor één dag, of null.
 * Geeft alleen iets terug als het plan er een heeft én de dag een trainingsdag is.
 */
export const preWorkoutVoorDag = (plan, workoutSchedule, dagSleutel, dagData = null) => {
  const maaltijd = plan?.pre_workout_meal
  if (!maaltijd || typeof maaltijd !== 'object') return null
  if (!isTrainingsdag(workoutSchedule, dagSleutel, dagData)) return null
  return maaltijd
}

/**
 * Tel de pre-workout maaltijd op bij de dagtotalen.
 *
 * De totalen in week_structure[dag].totals zijn berekend zónder deze maaltijd —
 * hij staat immers niet in de dagstructuur. Op een trainingsdag eet de klant
 * hem wél, dus moet hij meetellen, anders klopt het kcal-totaal niet met wat er
 * op het scherm staat.
 */
export const totalenMetPreWorkout = (totals, maaltijd) => {
  const basis = {
    kcal: Math.round(totals?.kcal || totals?.calories || 0),
    protein: Math.round(totals?.protein || 0),
    carbs: Math.round(totals?.carbs || 0),
    fat: Math.round(totals?.fat || 0),
  }
  if (!maaltijd) return basis
  return {
    kcal: basis.kcal + Math.round(maaltijd.calories || 0),
    protein: basis.protein + Math.round(maaltijd.protein || 0),
    carbs: basis.carbs + Math.round(maaltijd.carbs || 0),
    fat: basis.fat + Math.round(maaltijd.fat || 0),
  }
}
