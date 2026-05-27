// src/modules/meal-plan/mealViewMode.js
// Resolve + persist a client's preferred meal-page view mode.
//
// DB column: clients.meal_view_mode  TEXT NULL  CHECK IN ('plan','free')
//   'plan'  → follow the assigned plan (timeline w/ checkboxes + swap)
//   'free'  → free logging only (no plan UI)
//   NULL    → auto-detect from active plan presence (legacy / new clients)

export const MEAL_VIEW_MODES = Object.freeze({ PLAN: 'plan', FREE: 'free' })

/**
 * Determine which view to show.
 * Explicit user choice always wins; NULL falls back to plan-presence detection.
 *
 * @param {object} client       — the client record (must contain meal_view_mode)
 * @param {boolean} hasActivePlan — does this client have an active AI plan
 * @returns {'plan' | 'free'}
 */
export const resolveMealMode = (client, hasActivePlan) => {
  const stored = client?.meal_view_mode
  if (stored === MEAL_VIEW_MODES.PLAN || stored === MEAL_VIEW_MODES.FREE) return stored
  return hasActivePlan ? MEAL_VIEW_MODES.PLAN : MEAL_VIEW_MODES.FREE
}

/**
 * Persist the client's view-mode choice.
 * @param {object} db        — DatabaseService instance (uses db.supabase)
 * @param {string} clientId
 * @param {'plan' | 'free' | null} mode
 */
export const updateMealMode = async (db, clientId, mode) => {
  if (!db?.supabase || !clientId) throw new Error('db and clientId required')
  if (mode !== null && mode !== MEAL_VIEW_MODES.PLAN && mode !== MEAL_VIEW_MODES.FREE) {
    throw new Error(`Invalid meal_view_mode: ${mode}`)
  }
  const { error } = await db.supabase
    .from('clients')
    .update({ meal_view_mode: mode })
    .eq('id', clientId)
  if (error) throw error
  return mode
}
