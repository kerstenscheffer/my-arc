// src/modules/meal-plan/utils/logBron.js
//
// Waar komt een gelogde maaltijd vandaan? consumed_meals.source is in de loop
// der tijd door veel logroutes gevuld, elk met een eigen naam. Hier worden ze
// teruggebracht tot wat een coach wil weten: stond het klaar in het plan, was
// het een wisseloptie, of heeft de klant het zelf gezocht, gescand of bedacht.
//
// Een plan-maaltijd (plan_check) is een wissel of een aanpassing als die dag in
// ai_meal_progress een slot met dezelfde meal_id als gewisseld staat. Geef die
// slots mee via `dagWissels` ({ meal_id: 'wissel' | 'aangepast' }).

export const BRONNEN = {
  plan:      { tekst: 'Plan',           uitleg: 'Stond klaar in het voedingsplan' },
  wissel:    { tekst: 'Wissel',         uitleg: 'Wisseloptie uit het plan' },
  aangepast: { tekst: 'Aangepast',      uitleg: 'Planmaaltijd, door de klant aangepast' },
  database:  { tekst: 'Database',       uitleg: 'Gezocht in de MY ARC-database' },
  barcode:   { tekst: 'Barcode',        uitleg: 'Gescand met de barcodescanner' },
  extern:    { tekst: 'Zoekfunctie',    uitleg: 'Gevonden via de externe zoekfunctie' },
  eigen:     { tekst: 'Eigen maaltijd', uitleg: 'Maaltijd die de klant zelf heeft gemaakt' },
  zelf:      { tekst: 'Zelf ingevuld',  uitleg: 'Macro\'s zelf ingetypt' },
  opnieuw:   { tekst: 'Opnieuw',        uitleg: 'Eerder gelogd en opnieuw toegevoegd' },
  bewerkt:   { tekst: 'Bewerkt',        uitleg: 'Gelogd en daarna door de klant bewerkt' },
  onbekend:  { tekst: 'Gelogd',         uitleg: 'Bron onbekend' },
}

const PER_SOURCE = {
  plan_check: 'plan',
  myarc: 'database', app_meals: 'database',
  barcode: 'barcode', openfoodfacts: 'barcode',
  fatsecret: 'extern', external: 'extern',
  my_meals: 'eigen', custom: 'eigen', custom_meal: 'eigen', new_meal_flow: 'eigen', route_y_new_meal_flow: 'eigen',
  quick_add: 'zelf', quick_add_flow: 'zelf', manual: 'zelf', manual_log: 'zelf',
  recent: 'opnieuw', recent_relog: 'opnieuw', copy_yesterday: 'opnieuw', existing_meal_flow: 'opnieuw',
  edit: 'bewerkt',
}

export function bronVan(log, dagWissels = null) {
  const sleutel = PER_SOURCE[log?.source] || 'onbekend'
  if (sleutel === 'plan' && log?.meal_id && dagWissels?.[log.meal_id]) return dagWissels[log.meal_id]
  return sleutel
}

// Uit de ai_meal_progress-rijen: per lokale datum welke meal_id's die dag
// gewisseld of aangepast waren.
export function wisselsPerDag(progressRijen) {
  const uit = {}
  ;(progressRijen || []).forEach(rij => {
    const dag = String(rij.date).slice(0, 10)
    Object.values(rij.consumed_meals || {}).forEach(v => {
      if (!v?.was_swapped || !v.meal_id) return
      uit[dag] = uit[dag] || {}
      uit[dag][v.meal_id] = v.edited_meal ? 'aangepast' : 'wissel'
    })
  })
  return uit
}
