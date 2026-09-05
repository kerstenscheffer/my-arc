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

// ── Tweede kanaal: het plan zelf is gewijzigd ────────────────────────────
//
// Een tijdwijziging kun je lokaal bijwerken — je weet welk blok waarheen
// gaat. Maar een maaltijd erbij, eruit of vervangen verandert de opbouw van
// de dag, en dan is opnieuw ophalen eerlijker dan proberen te raden wat er
// precies veranderd is.
//
// Vandaar een apart signaal: dit betekent "haal je gegevens opnieuw op",
// niet "verzet dit ene blok".

const PLAN_EVENT = 'myarc:plan-gewijzigd'

/**
 * Meld dat het weekplan van een klant is gewijzigd.
 * @param {{mealPlanId?:string, clientId?:string, reden?:string, bron:string}} detail
 */
export function meldPlanGewijzigd(detail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(PLAN_EVENT, { detail }))
}

/**
 * Luister naar wijzigingen in het weekplan.
 * @param {(detail) => void} bijWijziging
 * @param {string} eigenBron  eigen meldingen overslaan, anders herlaadt een
 *   scherm zichzelf na elke eigen wijziging.
 */
export function luisterPlanGewijzigd(bijWijziging, eigenBron) {
  if (typeof window === 'undefined') return () => {}
  const handler = (e) => {
    if (eigenBron && e.detail?.bron === eigenBron) return
    bijWijziging(e.detail || {})
  }
  window.addEventListener(PLAN_EVENT, handler)
  return () => window.removeEventListener(PLAN_EVENT, handler)
}
