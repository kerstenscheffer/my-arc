// src/modules/manual-workout-builder/cyclus.js
//
// Trainingscyclus (10 nov 2026). Voor de meeste klanten is dat gewoon de week
// (7 dagen) en komt de volgorde uit hun weekrooster. Een langere cyclus (8-14
// dagen, bv. PPL met een rustdag na elke 3) bewaart de builder zelf in
// workout_schemas.cyclus. Met de cyclus rekenen we volume per week
// (sets × 7 / lengte), frequentie per week en rust tussen dezelfde spier.
//
// In de builder: { lengte, volgorde: [dayId | null] } (null = rust).
// In de database: { lengte, volgorde: ['dag1' | null] }.

export const STANDAARD_LENGTE = 7
export const MAX_LENGTE = 14
const WEEKDAGEN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const WEEKDAG_KORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

// Dagen gelijk over de cyclus verdelen: [id, null, id, null, id, null, null].
function verdeel(dayIds, lengte) {
  const slots = Array(lengte).fill(null)
  dayIds.forEach((id, i) => {
    let p = Math.min(lengte - 1, Math.round((i * lengte) / Math.max(1, dayIds.length)))
    while (slots[p] !== null && p < lengte - 1) p++
    while (slots[p] !== null) p--
    slots[p] = id
  })
  return slots
}

// Volgorde netjes maken: weg wat niet meer bestaat, nieuwe dagen in de eerste rustplek.
function normaliseer(volgorde, dayIds, lengte) {
  const L = Math.max(lengte, dayIds.length)
  const slots = Array.from({ length: L }, (_, i) => (dayIds.includes(volgorde[i]) ? volgorde[i] : null))
  const gezien = new Set()
  for (let i = 0; i < L; i++) { if (slots[i] !== null && gezien.has(slots[i])) slots[i] = null; else if (slots[i] !== null) gezien.add(slots[i]) }
  for (const id of dayIds) {
    if (gezien.has(id)) continue
    const vrij = slots.indexOf(null)
    if (vrij === -1) slots.push(id); else slots[vrij] = id
    gezien.add(id)
  }
  return slots
}

// Rooster van de klant (Monday → 'dag2' of 'plan_<id>__dag2') naar dag-ids van dit plan.
function uitRooster(rooster, schemaId, actief, keyNaarId) {
  if (!rooster || typeof rooster !== 'object') return null
  const slots = WEEKDAGEN.map(dag => {
    const v = String(rooster[dag] || '')
    let k = null
    if (actief && /^dag\d+$/.test(v)) k = v
    else if (schemaId && v.startsWith(`plan_${schemaId}__`)) k = v.split('__')[1]
    return k ? keyNaarId.get(k) ?? null : null
  })
  return slots.some(Boolean) ? slots : null
}

// De cyclus die de builder toont.
// plan.cyclus: opgeslagen (ids) of null. rooster/actief/schemaId: van de klant.
// keyNaarId: Map 'dag2' → dayId (uit het laden).
// Geeft { lengte, slots: [dayId|null], bron: 'rooster' | 'plan' | 'verdeeld', weekdagen: bool }.
export function cyclusVan(plan, { rooster = null, actief = false, schemaId = null, keyNaarId = new Map() } = {}) {
  const ids = (plan.days || []).map(d => d.id)
  const c = plan.cyclus
  if (c?.lengte && c.lengte !== STANDAARD_LENGTE) {
    return { lengte: Math.max(c.lengte, ids.length), slots: normaliseer(c.volgorde || [], ids, c.lengte), bron: 'plan', weekdagen: false }
  }
  // 7 dagen: het weekrooster van de klant is de waarheid (dat ziet hij in de app).
  // Een training die de klant niet heeft ingepland komt NIET op een rustdag te
  // staan (12 nov 2026: de builder toonde er een op maandag terwijl de klant
  // daar rust had). Die komen als losse kolommen ná de week: slots[0..6] is de
  // week zoals de klant hem ziet, slots[7..] = `los` = niet ingepland.
  const r = uitRooster(rooster, schemaId, actief, keyNaarId)
  if (r && ids.length <= STANDAARD_LENGTE) {
    // Dezelfde training twee keer in de week (Pull op ma en do) blijft op beide
    // dagen staan: eerst werd de tweede keer een rustdag, waardoor de kolommen
    // niet klopten met het weekrooster erboven (13 nov 2026, Duuk). `herhaald`
    // = de plekken waar een training voor de tweede keer staat.
    const gezien = new Set()
    const herhaald = []
    const week = r.map((id, plek) => {
      if (id == null || !ids.includes(id)) return null
      if (gezien.has(id)) herhaald.push(plek); else gezien.add(id)
      return id
    })
    const los = ids.filter(id => !gezien.has(id))
    return { lengte: STANDAARD_LENGTE, slots: [...week, ...los], bron: 'rooster', weekdagen: true, ingepland: STANDAARD_LENGTE, los, herhaald }
  }
  if (c?.volgorde?.length) return { lengte: Math.max(STANDAARD_LENGTE, ids.length), slots: normaliseer(c.volgorde, ids, STANDAARD_LENGTE), bron: 'plan', weekdagen: false }
  const L = Math.max(STANDAARD_LENGTE, ids.length)
  return { lengte: L, slots: verdeel(ids, L), bron: 'verdeeld', weekdagen: false }
}

// Opgeslagen vorm: ids → 'dagN' volgens de volgorde van plan.days (zoals opslaan nummert).
export function cyclusVoorOpslaan(plan, cyc) {
  if (!cyc || (cyc.bron !== 'plan' && cyc.lengte === STANDAARD_LENGTE)) return null
  const nr = new Map((plan.days || []).map((d, i) => [d.id, `dag${i + 1}`]))
  return { lengte: cyc.lengte, volgorde: cyc.slots.map(id => (id == null ? null : nr.get(id) || null)) }
}

// Bij het laden: 'dagN' → dag-ids.
export function cyclusUitOpslag(opgeslagen, keyNaarId) {
  if (!opgeslagen?.lengte) return null
  return { lengte: opgeslagen.lengte, volgorde: (opgeslagen.volgorde || []).map(k => (k == null ? null : keyNaarId.get(k) ?? null)) }
}

// Rustdagen tussen twee trainingen van dezelfde spier, rond de cyclus:
// { spier: kleinste aantal dagen ertussen } (0 = twee dagen achter elkaar).
export function rustPerSpier(slots, spierenVanDag) {
  const L = slots.length
  const posities = {}
  slots.forEach((id, i) => { if (id != null) for (const s of spierenVanDag(id)) (posities[s] = posities[s] || []).push(i) })
  const uit = {}
  for (const [s, p] of Object.entries(posities)) {
    if (p.length < 2) continue
    let min = Infinity
    for (let i = 0; i < p.length; i++) {
      const volgende = i + 1 < p.length ? p[i + 1] : p[0] + L
      min = Math.min(min, volgende - p[i] - 1)
    }
    uit[s] = min
  }
  return uit
}
