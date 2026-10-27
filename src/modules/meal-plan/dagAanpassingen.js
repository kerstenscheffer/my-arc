// src/modules/meal-plan/dagAanpassingen.js
//
// Een klant kan een maaltijd "alleen vandaag" aanpassen. Die versie staat niet
// in het weekplan maar in ai_meal_progress.consumed_meals[slot].edited_meal van
// die datum. Alleen de vandaag-weergave las 'm; de dagweergave van een andere
// dag en de agenda pakten het weekplan. Logde je zondag pas op maandag af, dan
// ging de originele maaltijd met de originele macro's het logboek in
// (12 okt 2026: 665 kcal gelogd waar de klant 911 had aangepast).
//
// Geeft { 'JJJJ-MM-DD': { slot: bewerkteMaaltijd } }. Mislukt het ophalen, dan
// een leeg object: dan zie je het weekplan, net als voorheen.
import { PRE_WORKOUT_SLOT } from './utils/preWorkoutMeal'

export async function laadDagAanpassingen(supabase, clientId, vanIso, totIso = vanIso) {
  if (!supabase || !clientId || !vanIso) return {}
  const { data } = await supabase
    .from('ai_meal_progress')
    .select('date, consumed_meals')
    .eq('client_id', clientId)
    .gte('date', vanIso)
    .lte('date', totIso)
    .then(r => r, () => ({ data: null }))
  const uit = {}
  ;(data || []).forEach(rij => {
    Object.entries(rij.consumed_meals || {}).forEach(([slot, v]) => {
      // Eenmalig weggehaald: een merkteken in plaats van een maaltijd. Wie
      // dit leest slaat het slot die dag over.
      if (v?.verwijderd) {
        uit[rij.date] = uit[rij.date] || {}
        uit[rij.date][slot] = { verwijderd: true }
        return
      }
      const m = v?.edited_meal
      if (!m || typeof m !== 'object') return
      uit[rij.date] = uit[rij.date] || {}
      uit[rij.date][slot] = m
    })
  })
  return uit
}

// Na een aanpassing: staat deze maaltijd die dag al afgevinkt, dan krijgt de
// log de nieuwe macro's. Anders blijft het logboek de oude versie tellen.
export async function werkGelogdeMaaltijdBij(supabase, clientId, mealId, datum, maaltijd) {
  if (!supabase || !clientId || !mealId || !datum || !maaltijd) return
  const start = new Date(datum); start.setHours(0, 0, 0, 0)
  const eind = new Date(start); eind.setDate(eind.getDate() + 1)
  const { error } = await supabase
    .from('consumed_meals')
    .update({
      meal_name: maaltijd.name || maaltijd.meal_name,
      ingredients: maaltijd.ingredients_list || [],
      calories: Math.round(maaltijd.calories || 0),
      protein: Math.round(maaltijd.protein || 0),
      carbs: Math.round(maaltijd.carbs || 0),
      fat: Math.round(maaltijd.fat || 0),
    })
    .eq('client_id', clientId)
    .eq('meal_id', mealId)
    .eq('source', 'plan_check')
    .gte('consumed_at', start.toISOString())
    .lt('consumed_at', eind.toISOString())
    .then(r => r, e => ({ error: e }))
  if (error) console.error('Gelogde maaltijd bijwerken mislukt:', error)
}

// Zet één maaltijd blijvend op een moment (slot) op meerdere weekdagen. Eén
// keer lezen en één keer schrijven, in plaats van per dag de hele week op te
// halen en terug te zetten (dan kan de ene schrijfactie de andere wissen).
//
// De kloktijd en eigen titel horen bij het slot van díé dag, niet bij de
// maaltijd: die blijven staan, net als bij swapMealInWeekStructure.
export async function zetMaaltijdOpDagen(supabase, planId, dagen, slot, maaltijd) {
  if (!supabase || !planId || !slot || !maaltijd || !dagen?.length) return
  const { data: plan, error: leesFout } = await supabase
    .from('client_meal_plans')
    .select('week_structure')
    .eq('id', planId)
    .single()
  if (leesFout) throw leesFout
  const week = { ...(plan?.week_structure || {}) }
  dagen.forEach(dag => {
    const oud = week[dag]?.[slot]
    const oudObject = (oud && typeof oud === 'object') ? oud : {}
    const nieuw = {
      ...maaltijd,
      meal_id: maaltijd.meal_id || maaltijd.id,
      meal_name: maaltijd.name || maaltijd.meal_name,
      timing: oudObject.timing ?? maaltijd.timing ?? null,
      display_label: oudObject.display_label ?? maaltijd.display_label ?? null,
    }
    // Weergave-velden van de dagweergave horen niet in het plan.
    ;['slot', 'timeSlot', 'plannedTime', 'isConsumed', 'consumedAt', 'volgtTraining'].forEach(k => { delete nieuw[k] })
    const dagPlan = { ...(week[dag] || {}), [slot]: nieuw }
    const maaltijden = Object.entries(dagPlan)
      .filter(([k, m]) => k !== 'totals' && m && typeof m === 'object' && m.calories)
      .map(([, m]) => m)
    dagPlan.totals = {
      kcal: maaltijden.reduce((s, m) => s + (m.calories || 0), 0),
      protein: maaltijden.reduce((s, m) => s + (m.protein || 0), 0),
      carbs: maaltijden.reduce((s, m) => s + (m.carbs || 0), 0),
      fat: maaltijden.reduce((s, m) => s + (m.fat || 0), 0),
    }
    week[dag] = dagPlan
  })
  const { error } = await supabase
    .from('client_meal_plans')
    .update({ week_structure: week, updated_at: new Date().toISOString() })
    .eq('id', planId)
  if (error) throw error
}

// Pre-workout blijvend wisselen: hij wordt dé pre-workout van het plan, op
// élke trainingsdag (schuift mee als de training verschuift). Losse
// pre-workouts per dag in week_structure gaan weg, anders winnen die op hun
// dag en staat er toch nog de oude (zie de regel in AIMealPlanService,
// AIDaySchedule en ClientAgendaService). Uitzonderingen (uit_dagen) vervallen:
// het is een nieuwe keuze.
export async function zetPreWorkoutOpTrainingsdagen(supabase, planId, maaltijd) {
  if (!supabase || !planId || !maaltijd) return
  const { data: plan, error: leesFout } = await supabase
    .from('client_meal_plans')
    .select('week_structure, pre_workout_meal')
    .eq('id', planId)
    .single()
  if (leesFout) throw leesFout
  const week = { ...(plan?.week_structure || {}) }
  Object.keys(week).forEach(dag => {
    const dagPlan = week[dag]
    if (!dagPlan || typeof dagPlan !== 'object' || !(PRE_WORKOUT_SLOT in dagPlan)) return
    const kopie = { ...dagPlan }
    delete kopie[PRE_WORKOUT_SLOT]
    const maaltijden = Object.entries(kopie)
      .filter(([k, m]) => k !== 'totals' && m && typeof m === 'object' && m.calories)
      .map(([, m]) => m)
    kopie.totals = {
      kcal: maaltijden.reduce((s, m) => s + (m.calories || 0), 0),
      protein: maaltijden.reduce((s, m) => s + (m.protein || 0), 0),
      carbs: maaltijden.reduce((s, m) => s + (m.carbs || 0), 0),
      fat: maaltijden.reduce((s, m) => s + (m.fat || 0), 0),
    }
    week[dag] = kopie
  })
  const oud = (plan?.pre_workout_meal && typeof plan.pre_workout_meal === 'object') ? plan.pre_workout_meal : {}
  const nieuw = {
    ...maaltijd,
    meal_id: maaltijd.meal_id || maaltijd.id,
    meal_name: maaltijd.name || maaltijd.meal_name,
    timing: oud.timing ?? null,
    display_label: oud.display_label ?? maaltijd.display_label ?? null,
  }
  ;['slot', 'timeSlot', 'plannedTime', 'isConsumed', 'consumedAt', 'volgtTraining', 'uit_dagen'].forEach(k => { delete nieuw[k] })
  const { error } = await supabase
    .from('client_meal_plans')
    .update({ week_structure: week, pre_workout_meal: nieuw, updated_at: new Date().toISOString() })
    .eq('id', planId)
  if (error) throw error
}

// Haalt een moment (slot) blijvend uit het weekplan op de gekozen weekdagen.
// Eén lees- en één schrijfactie; dagtotalen worden opnieuw opgeteld.
export async function haalMaaltijdWegOpDagen(supabase, planId, dagen, slot) {
  if (!supabase || !planId || !slot || !dagen?.length) return
  const { data: plan, error: leesFout } = await supabase
    .from('client_meal_plans')
    .select('week_structure, pre_workout_meal')
    .eq('id', planId)
    .single()
  if (leesFout) throw leesFout
  const week = { ...(plan?.week_structure || {}) }
  // De pre-workout van het plan (pre_workout_meal) staat niet per dag in
  // week_structure; die dagen onthouden we op de maaltijd zelf. Altijd beide:
  // alleen het slot van de dag weghalen liet op een trainingsdag de
  // plan-pre-workout ervoor in de plaats verschijnen (27 okt 2026).
  const preUit = []
  dagen.forEach(dag => {
    if (slot === PRE_WORKOUT_SLOT && plan?.pre_workout_meal) preUit.push(dag)
    if (!week[dag] || !(slot in week[dag])) return
    const dagPlan = { ...week[dag] }
    delete dagPlan[slot]
    const maaltijden = Object.entries(dagPlan)
      .filter(([k, m]) => k !== 'totals' && m && typeof m === 'object' && m.calories)
      .map(([, m]) => m)
    dagPlan.totals = {
      kcal: maaltijden.reduce((s, m) => s + (m.calories || 0), 0),
      protein: maaltijden.reduce((s, m) => s + (m.protein || 0), 0),
      carbs: maaltijden.reduce((s, m) => s + (m.carbs || 0), 0),
      fat: maaltijden.reduce((s, m) => s + (m.fat || 0), 0),
    }
    week[dag] = dagPlan
  })
  const wijziging = { week_structure: week, updated_at: new Date().toISOString() }
  if (preUit.length) {
    const pre = plan.pre_workout_meal
    wijziging.pre_workout_meal = { ...pre, uit_dagen: [...new Set([...(pre.uit_dagen || []), ...preUit])] }
  }
  const { error } = await supabase
    .from('client_meal_plans')
    .update(wijziging)
    .eq('id', planId)
  if (error) throw error
}
