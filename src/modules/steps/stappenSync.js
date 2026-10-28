// src/modules/steps/stappenSync.js
//
// De telefoon uitlezen en de dag bijwerken. Eén plek, want dit gebeurt op twee
// momenten: bij het openen van de app (daar komt ook de toestemmingsvraag) en
// telkens als de app weer op de voorgrond komt — je loopt tussendoor door.
//
// Wie het resultaat wil tonen luistert naar het event: zo hoeft het dashboard
// niets te weten van de stappen-pil die ergens op een pagina staat.

import StappenService, { vandaagIso } from './StappenService'
import { stappenBijOpstart, stappenVanVandaag, stappenPerDag, isGekoppeld, stappenStatus, platform, isNative, laatsteBronnenVandaag } from './telefoonStappen'

export const STAPPEN_EVENT = 'myarc:stappen-bijgewerkt'
// De coach vroeg opnieuw om toestemming; StappenVerzoek luistert hiernaar.
export const STAPPEN_VERZOEK_EVENT = 'myarc:stappen-verzoek'
const VERZOEK_GEZIEN = 'myarc_stappen_verzoek_gezien'

// Niet vaker dan dit opnieuw langs HealthKit, hoe vaak je ook wisselt.
const RUST_MS = 5 * 60 * 1000
let laatste = 0

// Roep aan na een auth-wisseling zodat de volgende visibilitychange niet
// geblokkeerd wordt door de cooldown.
export function resetStappenCooldown() { laatste = 0 }

// Hoeveel dagen we terugkijken bij het opstarten. Zeven: wie één keer per week
// de app opent heeft dan nog steeds een kloppende week.
const INHAAL_DAGEN = 7

export async function syncStappen(db, clientId, { bijOpstart = false } = {}) {
  if (!db || !clientId) return null
  const nu = Date.now()
  if (!bijOpstart && nu - laatste < RUST_MS) return null
  laatste = nu

  // Vroeg de coach opnieuw om toestemming? Zonder erop te wachten.
  if (bijOpstart) controleerVerzoek(db, clientId)

  try {
    const n = bijOpstart ? await stappenBijOpstart() : await stappenVanVandaag()
    // Pas ná het uitlezen: de eerste keer staat hierboven nog het
    // toestemmingsscherm open, en dan zou de status 'geweigerd' zijn.
    if (bijOpstart) meldStappenStatus(db, clientId)
    if (n == null) return null
    await StappenService.bewaar(db, clientId, n, { source: 'telefoon', bronnen: laatsteBronnenVandaag() })
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
      await StappenService.bewaar(db, clientId, dag.steps, { datum: dag.iso, source: 'telefoon', bronnen: dag.bronnen })
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

// Laat de coach weten waarom er wel of geen stappen binnenkomen. Een melding
// uit de browser overschrijft geen recente melding van de telefoon: wie zijn
// stappen via de app deelt en af en toe op de laptop kijkt, is niet "web".
export async function meldStappenStatus(db, clientId) {
  if (!db?.supabase || !clientId) return
  try {
    const status = await stappenStatus()
    if (!isNative()) {
      const { data } = await db.supabase.from('clients')
        .select('stappen_platform, stappen_status_at').eq('id', clientId).maybeSingle()
      const recent = data?.stappen_status_at && (Date.now() - new Date(data.stappen_status_at).getTime()) < 3 * 86400000
      if (recent && data.stappen_platform && data.stappen_platform !== 'web') return
    }
    await db.supabase.from('clients').update({
      stappen_status: status,
      stappen_platform: platform(),
      stappen_status_at: new Date().toISOString(),
    }).eq('id', clientId)
  } catch (e) {
    console.warn('Stappen-status melden mislukt:', e?.message || e)
  }
}

// Vroeg de coach opnieuw om toestemming sinds de klant dat laatst zag?
export async function controleerVerzoek(db, clientId) {
  if (!db?.supabase || !clientId) return
  try {
    const { data } = await db.supabase.from('clients')
      .select('stappen_verzoek_at').eq('id', clientId).maybeSingle()
    const verzoek = data?.stappen_verzoek_at
    if (!verzoek) return
    let gezien = null
    try { gezien = localStorage.getItem(VERZOEK_GEZIEN) } catch { /* private mode */ }
    if (gezien && new Date(gezien) >= new Date(verzoek)) return
    openVerzoek = verzoek
    window.dispatchEvent(new CustomEvent(STAPPEN_VERZOEK_EVENT, { detail: { verzoek } }))
  } catch (e) {
    console.warn('Stappen-verzoek controleren mislukt:', e?.message || e)
  }
}

// Voor een sheet die pas ná het event mount (dashboard nog aan het laden).
let openVerzoek = null
export const openStaandVerzoek = () => openVerzoek

export function markeerVerzoekGezien(verzoek) {
  openVerzoek = null
  try { localStorage.setItem(VERZOEK_GEZIEN, verzoek || new Date().toISOString()) } catch { /* private mode */ }
}
