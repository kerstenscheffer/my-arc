// src/modules/business-os/contentBotsing.js
//
// Posts te dicht op elkaar (21 nov 2026). Uit Kerstens cijfers: een post binnen
// 15 minuten na de vorige haalt mediaan 2.027 views, met 15 minuten of meer
// ertussen 3.073 tot 3.938. De contentkalender zet daarom een oranje stip op de
// dag en kleurt in het dagblad de tijd van de botsende posts.
//
// Puur rekenwerk, geen imports: los te draaien met node.
// Telt mee: type reel, carousel of post (geen story), met een tijd, status niet
// idea, geen template. Botsing = minder dan 15 minuten uit elkaar, ook precies
// hetzelfde tijdstip.

export const BOTS_MINUTEN = 15
export const BOTS_KLEUR = '#f59e0b'

const TELT_TYPE = new Set(['reel', 'carousel', 'post'])

// 'HH:MM' (ook 'H:MM' en 'HH:MM:SS') → minuten na middernacht, anders null.
export function tijdNaarMinuten(t) {
  const m = String(t ?? '').trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const u = Number(m[1]), min = Number(m[2])
  return u > 23 || min > 59 ? null : u * 60 + min
}

const tijdTekst = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const tijdVan = (it) => tijdNaarMinuten(it?.tijd ?? it?.planned_time)

export const teltVoorBotsing = (it) => !!it
  && TELT_TYPE.has(it.type)
  && it.status !== 'idea'
  && !(it.is_template ?? it.isTemplate)
  && tijdVan(it) != null

// Items van één dag (kalender-items met tijd, of content_items-rijen met
// planned_time) → { [id]: 'HH:MM' } met per botsend item de tijd van de
// dichtstbijzijnde andere post. Leeg object = niets te dicht op elkaar.
export function botsingenVanDag(items) {
  const lijst = (items || []).filter(teltVoorBotsing).map(it => ({ id: it.id, min: tijdVan(it) }))
  const uit = {}
  for (const a of lijst) {
    let dichtst = null
    for (const b of lijst) {
      if (b === a) continue
      const verschil = Math.abs(a.min - b.min)
      if (verschil >= BOTS_MINUTEN) continue
      if (!dichtst || verschil < dichtst.verschil || (verschil === dichtst.verschil && b.min < dichtst.min)) dichtst = { verschil, min: b.min }
    }
    if (dichtst) uit[a.id] = tijdTekst(dichtst.min)
  }
  return uit
}

// { [dag]: items } → { [dag]: { [id]: 'HH:MM' } }, alleen dagen met een botsing.
export function botsingenPerDag(perDag) {
  const uit = {}
  for (const [dag, items] of Object.entries(perDag || {})) {
    const b = botsingenVanDag(items)
    if (Object.keys(b).length) uit[dag] = b
  }
  return uit
}
