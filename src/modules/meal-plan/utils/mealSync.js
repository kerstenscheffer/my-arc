// src/modules/meal-plan/utils/mealSync.js
//
// Kanaal tussen de agenda en de Plan Analyzer.
//
// In split screen staan die twee in aparte componentbomen: verschuif je een
// maaltijd in de agenda links, dan weet de analyzer rechts van niets en zie
// je twee verschillende tijden voor dezelfde maaltijd. Ze delen geen ouder,
// dus props helpen hier niet.
//
// Een window-event is hier het juiste gereedschap: dezelfde pagina, dezelfde
// document, geen extra bibliotheek en geen globale state die je moet
// opruimen. Wie luistert, luistert; wie niet luistert, merkt niets.
//
// Bewust géén realtime via Supabase: dit gaat om twee schermen van dezelfde
// coach in dezelfde tab. Een netwerkrondje is trager dan wat je hier wil, en
// je zou je eigen wijziging terugkrijgen.

const EVENT = 'myarc:maaltijd-tijd-gewijzigd'

/**
 * Meld dat een maaltijd een andere tijd heeft gekregen.
 * @param {{mealPlanId:string, day:string, slot:string, newTiming:string, bron:string}} detail
 */
export function meldMaaltijdTijd(detail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT, { detail }))
}

/**
 * Luister naar tijdwijzigingen van maaltijden.
 * Geeft een opruim-functie terug voor in de useEffect.
 *
 * @param {(detail) => void} bijWijziging
 * @param {string} eigenBron  meldingen met deze bron worden overgeslagen —
 *   anders reageert een scherm op zijn eigen wijziging en krijg je een lus.
 */
export function luisterMaaltijdTijd(bijWijziging, eigenBron) {
  if (typeof window === 'undefined') return () => {}
  const handler = (e) => {
    if (eigenBron && e.detail?.bron === eigenBron) return
    bijWijziging(e.detail || {})
  }
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
