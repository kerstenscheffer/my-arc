// src/modules/ai-meal-generator/utils/unitConverter.js
// v2.0 — Fuzzy keyword matching, wetenschappelijke portie data

const UNIT_RULES = [
  // ── EIEREN ──
  {
    keywords: ['ei', 'eier', 'egg', 'scharrelei', 'scharreleier', 'kipperei', 'kippenei'],
    gramsPerUnit: 55,
    unit: 'ei', unitPlural: 'eieren',
    // Bron: RIVM, gemiddeld ei M/L = 50-60g
  },

  // ── BROOD / SNEETJES ──
  {
    keywords: ['brood', 'bread', 'toast', 'boterham', 'snee', 'volkoren', 'rogge', 'witbrood', 'bruinbrood', 'meergranen', 'tijgerbrood', 'stokbrood'],
    gramsPerUnit: 30,
    unit: 'sneetje', unitPlural: 'sneetjes',
    // Bron: Voedingscentrum, 1 sneetje brood ≈ 25-35g
  },

  // ── RIJSTWAFELS ──
  {
    keywords: ['rijstwafel', 'rice cake'],
    gramsPerUnit: 9,
    unit: 'rijstwafel', unitPlural: 'rijstwafels',
    // Bron: AH/Jumbo productlabel, 1 rijstwafel ≈ 8-10g
  },

  // ── CRACKERS ──
  {
    keywords: ['cracker', 'knäckebröd', 'knackebrod', 'crispbread'],
    gramsPerUnit: 10,
    unit: 'cracker', unitPlural: 'crackers',
  },

  // ── BANAAN ──
  {
    keywords: ['banaan', 'banana'],
    gramsPerUnit: 100,
    unit: 'banaan', unitPlural: 'bananen',
    // Bron: Voedingscentrum, 1 banaan zonder schil ≈ 90-120g
  },

  // ── APPEL ──
  {
    keywords: ['appel', 'apple'],
    gramsPerUnit: 150,
    unit: 'appel', unitPlural: 'appels',
    // Bron: Voedingscentrum, 1 middelgrote appel ≈ 130-170g
  },

  // ── SINAASAPPEL / MANDARIJN ──
  {
    keywords: ['sinaasappel', 'orange', 'mandarijn', 'mandarine'],
    gramsPerUnit: 130,
    unit: 'stuk', unitPlural: 'stuks',
  },

  // ── WRAP / TORTILLA ──
  {
    keywords: ['wrap', 'tortilla', 'flatbread', 'pitabrood', 'pita'],
    gramsPerUnit: 55,
    unit: 'wrap', unitPlural: 'wraps',
    // Bron: Gemiddelde tortilla wrap ≈ 45-65g
  },

  // ── PANNENKOEK ──
  {
    keywords: ['pannenkoek', 'pancake'],
    gramsPerUnit: 60,
    unit: 'pannenkoek', unitPlural: 'pannenkoeken',
  },

  // ── AARDAPPEL ──
  {
    keywords: ['aardappel', 'potato', 'krieltje'],
    gramsPerUnit: 100,
    unit: 'aardappel', unitPlural: 'aardappelen',
    // Bron: Voedingscentrum, 1 middelgrote aardappel ≈ 80-120g
  },

  // ── TOMAAT ──
  {
    keywords: ['tomaat', 'tomato'],
    gramsPerUnit: 100,
    unit: 'tomaat', unitPlural: 'tomaten',
  },

  // ── EETLEPEL (sauzen, pasta's) ──
  {
    keywords: ['honing', 'honey', 'pindakaas', 'peanut butter', 'jam', 'mayonaise', 'mayo', 'ketchup', 'mosterd', 'mustard', 'sojasaus', 'soy sauce', 'sambal', 'sriracha'],
    gramsPerUnit: 15,
    unit: 'eetlepel', unitPlural: 'eetlepels',
    // Bron: 1 eetlepel ≈ 15g
  },

  // ── OLIE / BOTER (theelepel) ──
  {
    keywords: ['olie', 'olijfolie', 'oil', 'olive oil', 'kokosolie', 'zonnebloemolie', 'boter', 'butter', 'margarine'],
    gramsPerUnit: 5,
    unit: 'theelepel', unitPlural: 'theelepels',
    maxGrams: 20, // boven 20g gewoon grammen tonen
  },
]

/**
 * Geeft een human-readable hoeveelheid terug
 * bijv. "12 kakelverse scharreleieren L, 1 ster (Jumbo)" 150g → "3 eieren (150g)"
 * bijv. "eieren (Albert Heijn)" 55g → "1 ei (55g)"
 *
 * Matching: INCLUDES check op lowercase — herkent merknamen, varianten etc.
 */
export function toHumanAmount(name, grams) {
  if (!name || !grams || grams <= 0) return `${Math.round(grams)}g`

  const nameLower = name.toLowerCase()

  const rule = UNIT_RULES.find(r =>
    r.keywords.some(keyword => nameLower.includes(keyword))
  )

  if (!rule) return `${Math.round(grams)}g`

  // Check maxGrams limiet
  if (rule.maxGrams && grams > rule.maxGrams) return `${Math.round(grams)}g`

  const count = Math.round(grams / rule.gramsPerUnit)
  if (count < 1) return `${Math.round(grams)}g`

  const label = count === 1 ? rule.unit : rule.unitPlural
  return `${count} ${label} (${Math.round(grams)}g)`
}

export default toHumanAmount
