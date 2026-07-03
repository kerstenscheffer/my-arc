// src/modules/meal-plan/components/food-log/portionPresets.js
// Common-food portion presets so users can tap "1 ei" / "1 glas melk" / "1 appel"
// instead of converting to grams in their head.
//
// Each entry:
//   - match:        regex tested against the food name
//   - displayUnit:  what to show next to numbers ('g' default, 'ml', 'stuks')
//   - presets:      tappable shortcuts. `grams` is always the underlying weight
//                   used for macro math (assume density ≈ 1 for liquids).
//
// Order matters — more specific patterns first.
// Note: grain weights (rijst, pasta) are DRY weights.

const PORTION_PRESETS = [
  // ═══ Drinks (display in ml) ═══════════════════════════════════════
  { match: /\b(eiwitshake|protein.?shake|whey)\b/i, displayUnit: 'ml', presets: [
    { label: '1 shake',        grams: 300 },
    { label: '1 grote shake',  grams: 500 },
  ]},
  { match: /\b(smoothie)\b/i, displayUnit: 'ml', presets: [
    { label: '1 klein glas',  grams: 200 },
    { label: '1 glas',        grams: 300 },
    { label: '1 grote beker', grams: 500 },
  ]},
  { match: /\b(sap|juice|jus|sinaasappelsap|appelsap|tomatensap)\b/i, displayUnit: 'ml', presets: [
    { label: '1 klein glas', grams: 150 },
    { label: '1 glas',       grams: 200 },
    { label: '1 grote glas', grams: 300 },
  ]},
  { match: /\b(melk|milk|sojamelk|amandelmelk|haver(melk|drink)|kokosmelk)\b/i, displayUnit: 'ml', presets: [
    { label: '1 klein glas',  grams: 150 },
    { label: '1 glas',        grams: 250 },
    { label: '1 grote beker', grams: 350 },
    { label: '1 mok',         grams: 300 },
  ]},
  { match: /\b(koffie|coffee|cappuccino|latte|espresso)\b/i, displayUnit: 'ml', presets: [
    { label: '1 espresso',  grams: 30 },
    { label: '1 kop',       grams: 150 },
    { label: '1 mok',       grams: 250 },
    { label: '1 grote mok', grams: 400 },
  ]},
  { match: /\b(thee|tea|kruidenthee)\b/i, displayUnit: 'ml', presets: [
    { label: '1 kop',  grams: 200 },
    { label: '1 mok',  grams: 300 },
  ]},
  { match: /\b(water|spa|spawater|bronwater)\b/i, displayUnit: 'ml', presets: [
    { label: '1 glas',     grams: 250 },
    { label: '1 fles',     grams: 500 },
    { label: '1 grote fles', grams: 1000 },
  ]},
  { match: /\b(frisdrank|cola|sprite|fanta|seven.?up|7.?up|ice.?tea|iced tea|red bull|energy drink|energiedrank)\b/i, displayUnit: 'ml', presets: [
    { label: '1 klein glas', grams: 200 },
    { label: '1 glas',       grams: 250 },
    { label: '1 blikje',     grams: 330 },
    { label: '1 fles',       grams: 500 },
  ]},
  { match: /\b(bier|beer|pils|pilsner|witbier|tripel)\b/i, displayUnit: 'ml', presets: [
    { label: '1 glas',   grams: 250 },
    { label: '1 pintje', grams: 300 },
    { label: '1 fles',   grams: 330 },
  ]},
  { match: /\b(wijn|wine|rode wijn|witte wijn|rosé)\b/i, displayUnit: 'ml', presets: [
    { label: '1 klein glas', grams: 100 },
    { label: '1 glas',       grams: 150 },
    { label: '1 fles',       grams: 750 },
  ]},
  { match: /\b(gin|wodka|vodka|whisky|whiskey|rum|tequila|likeur)\b/i, displayUnit: 'ml', presets: [
    { label: '1 shotje',  grams: 25 },
    { label: '1 borrel',  grams: 50 },
    { label: '1 long drink', grams: 200 },
  ]},

  // ═══ Whole-unit foods (display in stuks where natural) ════════════
  // Dooier en eiwit hebben een eigen `override` met de per-100g macros van
  // dat specifieke deel — zonder override zou het systeem het gemiddelde
  // hele-ei-profiel toepassen (~155 kcal/100g) en zo bij eiwit fout fat
  // doorrekenen. Het eigeel bevat alle vetten van het ei.
  { match: /\b(eier|eieren|egg|eggs)\b|^ei$|\bei\s/i, displayUnit: 'stuks', presets: [
    { label: '1 ei',           grams: 60 },
    { label: '2 eieren',       grams: 120 },
    { label: '3 eieren',       grams: 180 },
    { label: '5 eieren',       grams: 300 },
    {
      label: '1 dooier', grams: 20,
      // Per 100g eigeel: USDA referentiewaarden.
      override: { calories: 322, protein: 16, carbs: 3.6, fat: 27 },
    },
    {
      label: '1 eiwit (los)', grams: 33,
      // Per 100g eiwit: bijna alleen eiwit, nauwelijks koolhydraten, géén vet.
      override: { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
    },
  ]},
  { match: /\b(banaan|banana)\b/i, displayUnit: 'stuks', presets: [
    { label: '½ banaan',       grams: 60 },
    { label: '1 banaan',       grams: 120 },
    { label: '1 grote banaan', grams: 150 },
  ]},
  { match: /\b(appel|apple)\b/i, displayUnit: 'stuks', presets: [
    { label: '½ appel', grams: 90 },
    { label: '1 appel', grams: 180 },
    { label: '2 appels', grams: 360 },
  ]},
  { match: /\b(sinaasappel|orange)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 sinaasappel', grams: 150 },
    { label: '2 sinaasappels', grams: 300 },
  ]},
  { match: /\b(mandarijn|mandarin)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 mandarijn',   grams: 70 },
    { label: '2 mandarijnen', grams: 140 },
    { label: '3 mandarijnen', grams: 210 },
  ]},
  { match: /\b(peer|pear)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 peer',  grams: 175 },
    { label: '2 peren', grams: 350 },
  ]},
  { match: /\b(avocado)\b/i, displayUnit: 'stuks', presets: [
    { label: '½ avocado', grams: 100 },
    { label: '1 avocado', grams: 200 },
  ]},
  { match: /\b(kiwi)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 kiwi',  grams: 75 },
    { label: '2 kiwis', grams: 150 },
  ]},
  { match: /\b(perzik|nectarine|pruim|plum)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 stuk',  grams: 130 },
    { label: '2 stuks', grams: 260 },
  ]},

  // ═══ Whole-unit veggies ═══════════════════════════════════════════
  { match: /\b(tomaat|tomato)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 cherry-tomaat',   grams: 15 },
    { label: '5 cherry-tomaten',  grams: 75 },
    { label: '1 tomaat',          grams: 100 },
    { label: '1 vleestomaat',     grams: 200 },
  ]},
  { match: /\bkomkommer\b/i, displayUnit: 'stuks', presets: [
    { label: '¼ komkommer', grams: 100 },
    { label: '½ komkommer', grams: 200 },
    { label: '1 komkommer', grams: 400 },
  ]},
  { match: /\b(paprika|bell pepper)\b/i, displayUnit: 'stuks', presets: [
    { label: '½ paprika', grams: 75 },
    { label: '1 paprika', grams: 150 },
  ]},
  { match: /\b(wortel|wortels|carrot)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 wortel',     grams: 80 },
    { label: '2 wortels',    grams: 160 },
    { label: '1 portie',     grams: 100 },
  ]},
  { match: /\b(aardappel|aardappels|potato)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 kleine aardappel',  grams: 75 },
    { label: '1 aardappel',          grams: 150 },
    { label: '2 aardappels',         grams: 300 },
    { label: 'normale portie',       grams: 200 },
  ]},

  // ═══ Bread / grains (gram) ════════════════════════════════════════
  { match: /\b(boterham|boterhammen|sneetje|sneetjes)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 boterham',     grams: 35 },
    { label: '2 boterhammen',  grams: 70 },
    { label: '3 boterhammen',  grams: 105 },
    { label: '4 boterhammen',  grams: 140 },
  ]},
  { match: /\b(broodje|kadetje|bolletje|baguette)\b/i, displayUnit: 'stuks', presets: [
    { label: '½ broodje', grams: 30 },
    { label: '1 broodje', grams: 60 },
  ]},
  { match: /\bbrood\b/i, presets: [
    { label: '1 plakje',  grams: 35 },
    { label: '2 plakjes', grams: 70 },
  ]},
  { match: /\b(crackers?|knäckebröd)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 cracker',  grams: 8 },
    { label: '3 crackers', grams: 24 },
    { label: '5 crackers', grams: 40 },
  ]},
  // Wraps — kleine wrap ≈ 40g, grote wrap ≈ 60g (snel-kies opties).
  { match: /\b(wrap|wraps|tortilla|tortillawrap|tortilla.?wrap)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 kleine wrap', grams: 40 },
    { label: '1 grote wrap',  grams: 60 },
    { label: '2 kleine wraps', grams: 80 },
    { label: '2 grote wraps',  grams: 120 },
  ]},
  { match: /\b(rijst|rice)\b/i, presets: [
    { label: '½ portie (droog)',     grams: 60 },
    { label: '1 portie (droog)',     grams: 75 },
    { label: 'grote portie (droog)', grams: 100 },
  ]},
  { match: /\bpasta\b/i, presets: [
    { label: '½ portie (droog)',     grams: 75 },
    { label: '1 portie (droog)',     grams: 100 },
    { label: 'grote portie (droog)', grams: 125 },
  ]},
  { match: /\b(havermout|oatmeal|haver)\b/i, presets: [
    { label: '½ portie',     grams: 30 },
    { label: '1 portie',     grams: 60 },
    { label: 'grote portie', grams: 90 },
  ]},

  // ═══ Protein (gram) ═══════════════════════════════════════════════
  // Specific eerst: gesneden / plakjes / ham — dunne plakjes (~15g)
  { match: /\b(kip|kalkoen)(filet)?\s*(plakjes|plakje|gesneden|sneetjes|sneetje)\b/i, presets: [
    { label: '1 plakje',  grams: 15 },
    { label: '3 plakjes', grams: 45 },
    { label: '5 plakjes', grams: 75 },
  ]},
  { match: /\b(kipham|kalkoenham|chicken\s?ham)\b/i, presets: [
    { label: '1 plakje',  grams: 15 },
    { label: '3 plakjes', grams: 45 },
    { label: '5 plakjes', grams: 75 },
  ]},
  // Generiek: hele filet/stuk
  { match: /\b(kipfilet|kalkoenfilet|chicken\s?filet)\b/i, presets: [
    { label: '½ filet',   grams: 75 },
    { label: '1 filet',   grams: 150 },
    { label: '1½ filet',  grams: 225 },
  ]},
  { match: /\b(rundergehakt|gehakt)\b/i, presets: [
    { label: 'kleine portie',  grams: 80 },
    { label: 'normale portie', grams: 120 },
    { label: 'grote portie',   grams: 160 },
  ]},
  { match: /\b(zalm|zalmfilet|salmon)\b/i, presets: [
    { label: 'kleine moot', grams: 100 },
    { label: 'normale moot', grams: 150 },
    { label: 'grote moot',   grams: 200 },
  ]},
  { match: /\btonijn\b/i, presets: [
    { label: '½ blikje',  grams: 40 },
    { label: '1 blikje',  grams: 80 },
    { label: '2 blikjes', grams: 160 },
  ]},
  { match: /\b(broccoli)\b/i, presets: [
    { label: 'kleine portie',  grams: 100 },
    { label: 'normale portie', grams: 150 },
    { label: 'grote portie',   grams: 200 },
  ]},

  // ═══ Dairy (gram for solid, ml-flagged ones above for liquid) ═════
  { match: /\b(kaas|cheese|gouda|cheddar|brie|mozzarella|edammer|leerdammer|maaslander|jong belegen|oude kaas)\b/i, presets: [
    { label: '1 plak',    grams: 20 },
    { label: '2 plakken', grams: 40 },
    { label: '3 plakken', grams: 60 },
    { label: '1 blokje',  grams: 10 },
  ]},
  { match: /\b(yoghurt|yogurt|griekse yoghurt|skyr)\b/i, presets: [
    { label: '1 schaaltje',     grams: 150 },
    { label: '1 grote schaal',  grams: 250 },
    { label: '1 beker',         grams: 200 },
  ]},
  { match: /\bkwark\b/i, presets: [
    { label: '1 schaaltje',    grams: 150 },
    { label: '1 grote schaal', grams: 250 },
    { label: '1 beker',        grams: 500 },
  ]},

  // ═══ Berries / handful items ══════════════════════════════════════
  { match: /\b(aardbei|aardbeien|strawberry|strawberries)\b/i, displayUnit: 'stuks', presets: [
    { label: '5 stuks',  grams: 75 },
    { label: '10 stuks', grams: 150 },
  ]},
  { match: /\b(blauwe bes|blauwe bessen|bosbes|bosbessen|blueberr)\b/i, presets: [
    { label: '1 handje',     grams: 50 },
    { label: '1 schaaltje',  grams: 125 },
  ]},

  // ═══ Nuts / spreads (gram) ════════════════════════════════════════
  { match: /\b(noten|walnoot|walnoten|amandelen|pistache|pistaches|cashew|cashew(noot|noten))\b/i, presets: [
    { label: '1 handje (kl)',  grams: 15 },
    { label: '1 handje',       grams: 25 },
    { label: '1 handje (gr)',  grams: 35 },
  ]},
  { match: /\b(pindakaas|peanut butter)\b/i, presets: [
    { label: '1 theelepel',  grams: 5 },
    { label: '1 eetlepel',   grams: 16 },
    { label: '2 eetlepels',  grams: 32 },
  ]},
  { match: /\b(hummus|tapenade)\b/i, presets: [
    { label: '1 eetlepel',  grams: 15 },
    { label: '2 eetlepels', grams: 30 },
  ]},

  // ═══ Oils / butter ═══════════════════════════════════════════════
  { match: /\b(olie|oil|olijfolie|zonnebloem(olie)?)\b/i, presets: [
    { label: '1 theelepel',  grams: 5 },
    { label: '1 eetlepel',   grams: 13 },
    { label: '2 eetlepels',  grams: 26 },
  ]},
  { match: /\b(boter|butter|margarine)\b/i, presets: [
    { label: '1 mesje',     grams: 5 },
    { label: '1 eetlepel',  grams: 14 },
  ]},
]

// Generic gram fallback shown for any food that has no specific category
// match (the long list of presets above). Keeps the quick-pick row visible
// at all times so the coach/client never has to type a value from scratch.
const DEFAULT_GRAM_PRESETS = {
  presets: [
    { label: '1 g',   grams: 1 },
    { label: '30 g',  grams: 30 },
    { label: '100 g', grams: 100 },
  ],
  displayUnit: 'g',
}

/**
 * Find the matching portion-config entry for a food name.
 * Falls back to a generic 1g / 30g / 100g row when no category matches so
 * the quick-pick row is always visible.
 *
 * Shape: { presets: [...], displayUnit: 'g' | 'ml' | 'stuks' }
 */
export const findPortionConfig = (foodName) => {
  if (!foodName || typeof foodName !== 'string') return DEFAULT_GRAM_PRESETS
  const name = foodName.trim()
  if (!name) return DEFAULT_GRAM_PRESETS
  for (const entry of PORTION_PRESETS) {
    if (entry.match.test(name)) {
      return {
        presets: entry.presets,
        displayUnit: entry.displayUnit || 'g',
      }
    }
  }
  return DEFAULT_GRAM_PRESETS
}

/**
 * Backward-compat wrapper — returns just the presets array.
 */
export const findPortionPresets = (foodName) => {
  const cfg = findPortionConfig(foodName)
  return cfg ? cfg.presets : []
}

export default PORTION_PRESETS
