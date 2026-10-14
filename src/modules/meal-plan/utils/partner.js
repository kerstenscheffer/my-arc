// src/modules/meal-plan/utils/partner.js
//
// Kant-en-klare maaltijden van partners (nu: PrepMyMeal) staan in ai_meals met
// partner, partner_url (met Kerstens ref-code) en partner_prijs.
const NAMEN = { prepmymeal: 'PrepMyMeal' }

// Korting via Kerstens code/ref-link. Pas hier aan als de afspraak verandert.
const KORTING = { prepmymeal: { procent: 10, code: 'KERSTENSCHEFFER' } }

const euro = (n) => `€${n.toFixed(2).replace('.', ',')}`

export function partnerVan(meal) {
  if (!meal?.partner || !meal?.partner_url) return null
  const labels = Array.isArray(meal.labels) ? meal.labels.map(String) : []
  const prijs = Number(meal.partner_prijs)
  const korting = KORTING[meal.partner] || null
  return {
    naam: NAMEN[meal.partner] || meal.partner,
    url: meal.partner_url,
    prijs: prijs > 0 ? euro(prijs) : null,
    // Prijs na korting, en de korting zelf (procent + code).
    prijsKorting: prijs > 0 && korting ? euro(prijs * (1 - korting.procent / 100)) : null,
    korting,
    // XL-bakken bevatten twee porties; de macro's in de app zijn per portie.
    porties: labels.includes('bak_2_porties') ? 2 : 1,
  }
}
