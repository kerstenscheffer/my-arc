// src/modules/ai-meal-generator/tabs/plan-analyzer/kopieMacros.js
//
// Welke macro's krijgt een klantplan dat uit een template wordt gekopieerd?
// (19 nov 2026) Per veld, in deze volgorde:
//   1. het doel van de klant   (clients.target_calories / protein / carbs / fat)
//   2. de macro's van het template (daily_* of base_macros)
//   3. de standaardwaarden
//
// Waarom dit bestaat: client_meal_plans heeft kolom-defaults 2000 / 150 / 200 /
// 67. Stuurde een kopieerpad geen daily_* mee, dan vulde de database die in en
// zag de klant in zijn app 2000 kcal staan, ook al stond zijn doel op 3150.
// De klant-app toont de macro's van het actieve plan, dus die horen gelijk te
// zijn aan zijn doelen. Alle drie de kopieerpaden (Laden in de Plan Analyzer,
// Kopie in de planwisselaar, Toewijzen in het plannenscherm) lopen hierlangs.

// Gelijk aan de kolom-defaults van client_meal_plans.
export const STANDAARD_MACROS = { calories: 2000, protein: 150, carbs: 200, fat: 67 }

const getal = (v) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n > 0 ? n : null
}

// klant: rij uit clients (of null). template: rij uit meal_plan_templates of
// een los object met daily_* / base_macros (of null).
export function macrosVoorKopie(klant, template) {
  const k = klant || {}
  const t = template || {}
  const b = (t.base_macros && typeof t.base_macros === 'object') ? t.base_macros : {}
  const kies = (doel, vanTemplate, vanBasis, standaard) => getal(doel) ?? getal(vanTemplate) ?? getal(vanBasis) ?? standaard
  return {
    daily_calories: kies(k.target_calories, t.daily_calories, b.calories, STANDAARD_MACROS.calories),
    daily_protein: kies(k.target_protein, t.daily_protein, b.protein, STANDAARD_MACROS.protein),
    daily_carbs: kies(k.target_carbs, t.daily_carbs, b.carbs, STANDAARD_MACROS.carbs),
    daily_fat: kies(k.target_fat, t.daily_fat, b.fat, STANDAARD_MACROS.fat),
  }
}

// De doelen vers uit de database, vlak voor het kopiëren: de coach kan ze net
// in het inzicht-paneel hebben aangepast. Mislukt het ophalen, dan null en
// valt macrosVoorKopie terug op het template.
export async function haalKlantDoelen(sb, clientId) {
  if (!sb || !clientId) return null
  const { data } = await sb.from('clients')
    .select('target_calories, target_protein, target_carbs, target_fat')
    .eq('id', clientId).maybeSingle()
    .then(r => r, () => ({ data: null }))
  return data || null
}
