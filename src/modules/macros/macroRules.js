// src/modules/macros/macroRules.js
//
// Single source of truth voor macro-regels. Dit bestand vervangt op
// termijn de vier verspreide formules in:
//   • modules/client-journey/components/calls/hooks/useIntakeCalc.js
//   • modules/client-journey/components/EvaluationModal.jsx
//   • modules/client-journey/components/calls/IntakeGoalPanel.jsx
//   • coach/tabs/client-info/PhysicalInfoTab.jsx
//
// De huidige regels (juni 2026):
//   • Eiwit:        2,0 g per kg lichaamsgewicht
//   • Vet:          1,0 g per kg lichaamsgewicht
//   • Koolhydraten: het rest-budget na eiwit en vet
//   • Cut    → deficit 500–700 kcal (default 600)
//   • Bulk   → surplus 300–500 kcal (default 400)
//   • Recomp → ±100 kcal (default 0 = maintenance)
//   • Maintain → kcal = TDEE
//   • TDEE: Mifflin-St Jeor × activity factor (default 1.4)

// ── Primary-goal aliases ────────────────────────────────────────────────
// De clients-tabel kent historisch verschillende waarden. Normaliseer
// alles naar één van: 'cut' | 'bulk' | 'recomp' | 'maintain'.
const GOAL_ALIAS = {
  cut: 'cut', fat_loss: 'cut', afvallen: 'cut',
  bulk: 'bulk', muscle_gain: 'bulk', spieropbouw: 'bulk',
  recomp: 'recomp', recomposition: 'recomp',
  maintain: 'maintain', maintenance: 'maintain', onderhoud: 'maintain',
  health: 'maintain', performance: 'maintain',
}
export const normalizeGoal = (g) => GOAL_ALIAS[(g || '').toLowerCase()] || 'maintain'

// ── Surplus / deficit regels per modus ──────────────────────────────────
// Negatief = deficit, positief = surplus. min/max zijn inclusief.
export const SURPLUS_RULES = {
  cut:      { min: -700, max: -500, default: -600 },
  bulk:     { min:  300, max:  500, default:  400 },
  recomp:   { min: -100, max:  100, default:    0 },
  maintain: { min:    0, max:    0, default:    0 },
}

export const surplusRuleFor = (primaryGoal) => SURPLUS_RULES[normalizeGoal(primaryGoal)]

// Begrens een door coach ingevoerd surplus binnen de regel voor die modus.
export const clampSurplus = (value, primaryGoal) => {
  const rule = surplusRuleFor(primaryGoal)
  const n = Number(value)
  if (!Number.isFinite(n)) return rule.default
  return Math.max(rule.min, Math.min(rule.max, Math.round(n)))
}

// ── Mifflin-St Jeor TDEE ────────────────────────────────────────────────
// BMR = 10·gewicht + 6,25·lengte − 5·leeftijd + (+5 man / −161 vrouw).
// TDEE = BMR × activity factor.
export const DEFAULT_ACTIVITY = 1.4

export const calcBMR = ({ weight, height, age, gender }) => {
  const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age)
  if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(a)) return null
  const sexAdjust = (gender || '').toLowerCase().startsWith('f') || (gender || '').toLowerCase().startsWith('v')
    ? -161
    : 5
  return Math.round(10 * w + 6.25 * h - 5 * a + sexAdjust)
}

export const calcTDEE = ({ weight, height, age, gender, activity = DEFAULT_ACTIVITY }) => {
  const bmr = calcBMR({ weight, height, age, gender })
  if (bmr == null) return null
  return Math.round(bmr * activity)
}

// ── Macro-bereken ───────────────────────────────────────────────────────
// targetCal = tdee + surplus (surplus is negatief bij cut).
// Eiwit en vet zijn per kg-lichaamsgewicht regels, koolhydraten is het rest.
// Returnt null voor de hele set als bodyweight of tdee ontbreken.
export const PROT_PER_KG = 2.0
export const FAT_PER_KG  = 1.0

export const computeMacros = ({ weight, tdee, surplus }) => {
  const w = parseFloat(weight)
  const t = parseFloat(tdee)
  const s = Number.isFinite(parseFloat(surplus)) ? parseFloat(surplus) : 0
  if (!Number.isFinite(w) || !Number.isFinite(t) || t <= 0) return null

  const targetCal = Math.round(t + s)
  const protein   = Math.round(w * PROT_PER_KG)
  const fat       = Math.round(w * FAT_PER_KG)
  const carbsKcal = targetCal - (protein * 4 + fat * 9)
  const carbs     = Math.max(0, Math.round(carbsKcal / 4))

  return { targetCal, protein, carbs, fat }
}

// ── Alles-in-één: pak een client-row en bereken het volgens de regels ──
// Gebruik dit in de "Herbereken volgens regels"-knop en overal waar je
// een verse plan-set wilt produceren. `overrides` laat de coach manueel
// een tdee of surplus opgeven (komen anders uit de client-row).
export const applyMacroRules = (client, overrides = {}) => {
  const primaryGoal = normalizeGoal(overrides.primary_goal ?? client?.primary_goal)
  const weight = parseFloat(overrides.weight ?? client?.current_weight ?? client?.start_weight)

  // TDEE: handmatige override > coach-input op clients.tdee > auto Mifflin
  let tdee = parseFloat(overrides.tdee ?? client?.tdee)
  if (!Number.isFinite(tdee) || tdee <= 0) {
    tdee = calcTDEE({
      weight,
      height: client?.height,
      age: client?.age,
      gender: client?.gender,
      activity: overrides.activity ?? DEFAULT_ACTIVITY,
    })
  }

  const rule = surplusRuleFor(primaryGoal)
  const surplus = overrides.surplus != null
    // Geen clamping meer: de coach bepaalt zelf wat het tekort moet
    // worden. De `rule.min/max` blijft alleen een hint in de UI.
    ? (parseInt(overrides.surplus) || 0)
    : (Number.isFinite(parseFloat(client?.surplus))
        ? parseFloat(client.surplus)
        : rule.default)

  const macros = computeMacros({ weight, tdee, surplus })
  if (!macros) return null

  return {
    primary_goal: primaryGoal,
    tdee,
    surplus,
    target_calories: macros.targetCal,
    target_protein:  macros.protein,
    target_carbs:    macros.carbs,
    target_fat:      macros.fat,
    rule, // {min, max, default} — voor UI om binnen het bereik te clampen
  }
}
