// src/lib/mealTemplateTypes.js
//
// Soorten rijen in meal_plan_templates.
//
// Eén tabel draagt drie dingen door elkaar:
//
//   plan_type = null          de klassieke setA/setB-sjablonen (Sjablonen-tab)
//   plan_type = 'full_week'   een volledige week, bewaard vanuit de Plan Analyzer
//   plan_type = 'single_day'  één losse dag, bewaard vanuit de Plan Analyzer
//
// Elke lijst die de klassieke sjablonen toont moet de andere twee eruit
// filteren. Dat is niet cosmetisch: de voedingsintake kiest automatisch een
// sjabloon uit die lijst en zou anders een losse dag als weekplan aan een
// nieuwe klant toewijzen.
//
// Daarom staat de filter hier één keer. Bij 'full_week' stond hij vijf keer
// los overgeschreven; deze module bestaat zodat een vierde soort niet
// opnieuw langs al die bestanden hoeft.

export const SJABLOON_WEEK = 'full_week'
export const SJABLOON_DAG = 'single_day'

// Alles wat géén klassiek setA/setB-sjabloon is.
export const AFWIJKENDE_SJABLONEN = [SJABLOON_WEEK, SJABLOON_DAG]

// Voor .or() in PostgREST. Let op de vorm: `plan_type.neq.full_week` liet
// 'single_day' gewoon door — een neq sluit één waarde uit, niet de rest.
// Vandaar not.in met de hele lijst. De null-tak moet erbij blijven: NOT IN
// levert NULL op voor een lege plan_type en die rij zou dan wegvallen.
export const KLASSIEKE_SJABLONEN_FILTER =
  `plan_type.is.null,plan_type.not.in.(${AFWIJKENDE_SJABLONEN.join(',')})`

// Zelfde regel, voor lijsten die al in JS filteren.
export const isKlassiekSjabloon = (rij) =>
  !AFWIJKENDE_SJABLONEN.includes(rij?.plan_type)
