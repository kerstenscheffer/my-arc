// src/modules/steps/stappenSync.js
//
// De telefoon uitlezen en de dag bijwerken. Eén plek, want dit gebeurt op twee
// momenten: bij het openen van de app (daar komt ook de toestemmingsvraag) en
// telkens als de app weer op de voorgrond komt — je loopt tussendoor door.
//
// Wie het resultaat wil tonen luistert naar het event: zo hoeft het dashboard
// niets te weten van de stappen-pil die ergens op een pagina staat.

import StappenService, { vandaagIso } from './StappenService'
import { stappenBijOpstart, stappenVanVandaag, stappenPerDag, isGekoppeld } from './telefoonStappen'

export const STAPPEN_EVENT = 'myarc:stappen-bijgewerkt'

// Niet vaker dan dit opnieuw langs HealthKit, hoe vaak je ook wisselt.
const RUST_MS = 5 * 60 * 1000
let laatste = 0

// Hoeveel dagen we terugkijken bij het opstarten. Zeven: wie één keer per week
// de app opent heeft dan nog steeds een kloppende week.
const INHAAL_DAGEN = 7

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

    // Bij het opstarten ook de dagen ervoor bijwerken. De telefoon heeft ze,
    // wij niet: opende de klant de app een paar dagen niet, dan stonden die
    // dagen op nul terwijl er gelopen is. Dit draait ná het bewaren van
    // vandaag, zodat het scherm niet hoeft te wachten op de inhaalslag.
    if (bijOpstart && isGekoppeld()) haalAchterstandIn(db, clientId)
    return n
  } catch (e) {
    console.error('Stappen synchroniseren mislukt:', e)
    return null
  }
}

// De afgelopen week nalopen en alleen schrijven wat nog niet klopt.
//
// Wat de klant zelf invulde blijft staan: een stand uit Apple Health hoort een
// handmatig getal niet stilletjes te overschrijven. Vandaag slaan we over —
// die is hierboven al bijgewerkt en is nog niet af.
async function haalAchterstandIn(db, clientId) {
  try {
    const telefoon = await stappenPerDag(INHAAL_DAGEN)
    if (!telefoon?.length) return

    const bestaand = await StappenService.haalDagen(db, clientId, INHAAL_DAGEN)
    const perDag = new Map((bestaand || []).map(r => [r.iso, r]))
    const vandaag = vandaagIso()

    let bijgewerkt = 0
    for (const dag of telefoon) {
      if (dag.iso === vandaag || !dag.steps) continue
      const rij = perDag.get(dag.iso)
      if (rij?.source === 'handmatig' && rij.steps > 0) continue
      if (rij && rij.steps === dag.steps) continue
      await StappenService.bewaar(db, clientId, dag.steps, { datum: dag.iso, source: 'telefoon' })
      bijgewerkt++
    }
    if (bijgewerkt > 0) {
      console.log(`Stappen ingehaald voor ${bijgewerkt} dag(en)`)
      window.dispatchEvent(new CustomEvent(STAPPEN_EVENT, { detail: { ingehaald: bijgewerkt } }))
    }
  } catch (e) {
    console.warn('Stappen inhalen mislukt:', e?.message || e)
  }
}
