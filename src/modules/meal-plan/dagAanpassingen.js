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
