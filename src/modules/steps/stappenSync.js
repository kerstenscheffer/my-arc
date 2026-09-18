// src/modules/steps/stappenSync.js
//
// De telefoon uitlezen en de dag bijwerken. Eén plek, want dit gebeurt op twee
// momenten: bij het openen van de app (daar komt ook de toestemmingsvraag) en
// telkens als de app weer op de voorgrond komt — je loopt tussendoor door.
//
// Wie het resultaat wil tonen luistert naar het event: zo hoeft het dashboard
// niets te weten van de stappen-pil die ergens op een pagina staat.

import StappenService from './StappenService'
import { stappenBijOpstart, stappenVanVandaag } from './telefoonStappen'

export const STAPPEN_EVENT = 'myarc:stappen-bijgewerkt'

// Niet vaker dan dit opnieuw langs HealthKit, hoe vaak je ook wisselt.
const RUST_MS = 5 * 60 * 1000
let laatste = 0

export async function syncStappen(db, clientId, { bijOpstart = false } = {}) {
  if (!db || !clientId) return null
  const nu = Date.now()
  if (!bijOpstart && nu - laatste < RUST_MS) return null
  laatste = nu

  try {
    const n = bijOpstart ? await stappenBijOpstart() : await stappenVanVandaag()
    if (n == null) return null
    await StappenService.bewaar(db, clientId, n, { source: 'telefoon' })
    window.dispatchEvent(new CustomEvent(STAPPEN_EVENT, { detail: { steps: n } }))
    return n
  } catch (e) {
    console.error('Stappen synchroniseren mislukt:', e)
    return null
  }
}
