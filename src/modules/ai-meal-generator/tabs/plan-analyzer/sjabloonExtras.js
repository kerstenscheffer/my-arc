// src/modules/ai-meal-generator/tabs/plan-analyzer/sjabloonExtras.js
//
// Wat er naast de maaltijden mee moet in een opgeslagen sjabloon
// (meal_plan_templates, plan_type='full_week'): de plan-brede pre-workout
// maaltijd en de supplementen. Beide zaten eerder níet in het sjabloon, dus
// bij een nieuwe klant moest je ze elke keer opnieuw zetten.
//
// Supplementen hebben `days` (['monday', ...] of niets = elke dag). Die dagen
// zijn de trainingsdagen van de klant voor wie het sjabloon gemaakt is, en
// die kloppen bij de volgende klant niet. Daarom bewaren we per supplement
// een regel in plaats van de letterlijke dagen:
//   'all'      -> elke dag
//   'training' -> precies de trainingsdagen (van wie het ook laadt)
//   'custom'   -> vaste dagen, letterlijk overgenomen

import { DAG_SLEUTELS } from '../../../supplements/utils/supplementSchedule'

const zelfdeSet = (a, b) => a.length === b.length && a.every(d => b.includes(d))

// Bij bewaren: supplementen van de klant omzetten naar sjabloonvorm.
export function supplementenVoorSjabloon(supplementen, trainingDayKeys = []) {
  if (!Array.isArray(supplementen)) return []
  return supplementen.map(s => {
    const dagen = Array.isArray(s?.days) ? s.days.filter(d => DAG_SLEUTELS.includes(d)) : null
    let days_rule = 'all'
    if (dagen && dagen.length && dagen.length < 7) {
      days_rule = trainingDayKeys.length && zelfdeSet(dagen, trainingDayKeys) ? 'training' : 'custom'
    }
    const kopie = { ...s, days_rule }
    if (days_rule !== 'custom') delete kopie.days
    return kopie
  })
}

// Bij laden: sjabloonvorm terug naar een lijst voor supplement_plans.
export function supplementenUitSjabloon(items, trainingDayKeys = []) {
  if (!Array.isArray(items)) return []
  return items.map(s => {
    const { days_rule, ...rest } = s || {}
    if (days_rule === 'training') {
      return trainingDayKeys.length ? { ...rest, days: [...trainingDayKeys] } : rest
    }
    if (days_rule === 'custom') return rest
    const zonder = { ...rest }; delete zonder.days
    return zonder
  })
}

// Trainingsdag-indices (0 = maandag) naar 'monday'-sleutels, zoals het
// supplementenpaneel ze verwacht.
export const dagIndicesNaarSleutels = (indices = []) =>
  (indices || []).map(i => DAG_SLEUTELS[i]).filter(Boolean)

// Zet de supplementen uit een sjabloon op het actieve supplementenplan van
// de klant. Is er al een actief plan, dan vervangt dit de lijst; anders
// komt er een nieuw actief plan. Geeft true terug als er iets geschreven is.
export async function pasSupplementenToe(supabase, { clientId, coachId, items, trainingDayKeys = [] }) {
  if (!supabase || !clientId) return false
  const lijst = supplementenUitSjabloon(items, trainingDayKeys)
  if (!lijst.length) return false
  const nu = new Date().toISOString()
  const { data } = await supabase
    .from('supplement_plans')
    .select('id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .then(r => r, e => ({ data: null, error: e }))
  const bestaand = data?.[0]?.id
  if (bestaand) {
    const { error } = await supabase
      .from('supplement_plans')
      .update({ supplements: lijst, updated_at: nu })
      .eq('id', bestaand)
    if (error) throw error
    return true
  }
  const { error } = await supabase
    .from('supplement_plans')
    .insert({
      client_id: clientId,
      coach_id: coachId || null,
      supplements: lijst,
      status: 'active',
      training_frequency: trainingDayKeys.length || null,
    })
  if (error) throw error
  return true
}

// Korte samenvatting voor in de lijst en de bewaarknop: "pre-workout · 3 supp."
export function extrasSamenvatting({ pre_workout_meal, supplements } = {}) {
  const delen = []
  if (pre_workout_meal?.name) delen.push(`pre-workout: ${pre_workout_meal.name}`)
  const n = Array.isArray(supplements) ? supplements.length : 0
  if (n) delen.push(`${n} supplement${n === 1 ? '' : 'en'}`)
  return delen.join(' · ')
}
