// src/modules/ai-meal-generator/tabs/plan-analyzer/schaalPortie.js
//
// Een maaltijd groter of kleiner maken met een factor (0,9 = 10% kleiner),
// voor het in één keer aanpassen van meerdere maaltijden in de weekkolommen
// (10 nov 2026). Zelfde rekenwijze als de portie-schaler op de kaart:
// grammen van schaalbare ingrediënten keer de factor (afgerond op 5 g, of op
// hele porties als het ingrediënt een eenheid heeft), daarna de macro's
// opnieuw uit ai_ingredients. Niet-schaalbare ingrediënten (1 ei, 1 wrap)
// blijven staan.
//
// Zonder bruikbare ingrediënten schalen we alleen de macro's.

import { portieInfo } from './portie'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const r1 = (n) => Math.round(n * 10) / 10

// Haalt de ingrediënt-rijen van alle maaltijden in één query op.
export async function laadIngredienten(db, meals) {
  const ids = new Set()
  meals.forEach(m => (Array.isArray(m?.ingredients_list) ? m.ingredients_list : []).forEach(i => {
    if (i?.ingredient_id && UUID.test(i.ingredient_id)) ids.add(i.ingredient_id)
  }))
  if (!ids.size || !db?.supabase) return new Map()
  const { data, error } = await db.supabase.from('ai_ingredients')
    .select('id, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, scalable, min_portion_gram, max_portion_gram, eenheid, gram_per_eenheid')
    .in('id', [...ids])
  if (error) throw error
  return new Map((data || []).map(r => [r.id, r]))
}

export function schaalMaaltijd(meal, factor, ingredienten) {
  if (!meal || !(factor > 0) || factor === 1) return meal
  const lijst = Array.isArray(meal.ingredients_list) ? meal.ingredients_list : null
  const bruikbaar = lijst && lijst.length && lijst.every(i => i?.ingredient_id && ingredienten.has(i.ingredient_id))
  const origineel = {
    original_calories: meal.original_calories || meal.calories,
    original_protein: meal.original_protein || meal.protein,
    original_carbs: meal.original_carbs || meal.carbs,
    original_fat: meal.original_fat || meal.fat,
  }
  if (!bruikbaar) {
    return {
      ...meal, ...origineel,
      calories: Math.round((Number(meal.calories) || 0) * factor),
      protein: r1((Number(meal.protein) || 0) * factor),
      carbs: r1((Number(meal.carbs) || 0) * factor),
      fat: r1((Number(meal.fat) || 0) * factor),
      ...(meal.fiber != null ? { fiber: r1((Number(meal.fiber) || 0) * factor) } : {}),
    }
  }
  // Macro's van de ingrediënten vóór en na het schalen. De opgeslagen macro's
  // van de maaltijd wijken soms af van deze som (oudere maaltijden); we
  // schalen ze daarom met de verhouding nieuw/oud, zodat +10% ook echt
  // ongeveer 10% meer is van wat de coach op de kaart ziet.
  const som = (items) => items.reduce((t, item) => {
    const ing = ingredienten.get(item.ingredient_id)
    const f = (Number(item.amount) || 0) / 100
    t.kcal += (Number(ing.calories_per_100g) || 0) * f
    t.eiwit += (Number(ing.protein_per_100g) || 0) * f
    t.kh += (Number(ing.carbs_per_100g) || 0) * f
    t.vet += (Number(ing.fat_per_100g) || 0) * f
    t.vezel += (Number(ing.fiber_per_100g) || 0) * f
    return t
  }, { kcal: 0, eiwit: 0, kh: 0, vet: 0, vezel: 0 })
  const nieuw = lijst.map(item => {
    const ing = ingredienten.get(item.ingredient_id)
    let gram = Number(item.amount) || 0
    if (ing.scalable !== false) {
      const portie = portieInfo(ing)
      const doel = gram * factor
      gram = portie ? Math.max(portie.gram, Math.round(doel / portie.gram) * portie.gram) : Math.max(5, Math.round(doel / 5) * 5)
      if (ing.min_portion_gram) gram = Math.max(Number(ing.min_portion_gram), gram)
      if (ing.max_portion_gram) gram = Math.min(Number(ing.max_portion_gram), gram)
    }
    return { ...item, amount: gram }
  })
  const oud = som(lijst)
  const na = som(nieuw)
  // Opgeslagen waarde × (na / voor); zonder bruikbare 'voor' de factor zelf.
  const verh = (k) => (oud[k] > 0 ? na[k] / oud[k] : factor)
  return {
    ...meal, ...origineel,
    ingredients_list: nieuw,
    calories: Math.round((Number(meal.calories) || 0) * verh('kcal')),
    protein: r1((Number(meal.protein) || 0) * verh('eiwit')),
    carbs: r1((Number(meal.carbs) || 0) * verh('kh')),
    fat: r1((Number(meal.fat) || 0) * verh('vet')),
    ...(meal.fiber != null ? { fiber: r1((Number(meal.fiber) || 0) * verh('vezel')) } : {}),
  }
}
