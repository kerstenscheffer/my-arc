// src/modules/meal-plan/utils/partner.js
//
// Kant-en-klare maaltijden van partners (nu: PrepMyMeal) staan in ai_meals met
// partner, partner_url (met Kerstens ref-code) en partner_prijs.
const NAMEN = { prepmymeal: 'PrepMyMeal' }

export function partnerVan(meal) {
  if (!meal?.partner || !meal?.partner_url) return null
  const labels = Array.isArray(meal.labels) ? meal.labels.map(String) : []
  const prijs = Number(meal.partner_prijs)
  return {
    naam: NAMEN[meal.partner] || meal.partner,
    url: meal.partner_url,
    prijs: prijs > 0 ? `€${prijs.toFixed(2).replace('.', ',')}` : null,
    // XL-bakken bevatten twee porties; de macro's in de app zijn per portie.
    porties: labels.includes('bak_2_porties') ? 2 : 1,
  }
}
