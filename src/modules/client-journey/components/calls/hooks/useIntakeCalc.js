// src/modules/client-journey/components/calls/hooks/useIntakeCalc.js
// v3 — TDEE komt uit de DB (al berekend door intake flow)
// Coach past alleen aan: modus, tempo, cardio, cheat, doelgewicht
import { useMemo } from 'react'

const PRESETS = {
  mild:       { pct: 0.12, label: 'Mild',      desc: '~0.3 kg/week' },
  moderate:   { pct: 0.20, label: 'Moderate',  desc: '~0.5 kg/week' },
  aggressive: { pct: 0.30, label: 'Agressief', desc: '~0.8 kg/week' },
}

// Detecteer modus op basis van goal step antwoord (leidend) → dan primary_goal → dan gewichtsverschil
function detectMode(cd, notes, targetW) {
  const w = parseFloat(cd?.current_weight) || 80

  // 1. Goal step antwoord — leidend
  const doelAntwoord = [
    notes?.doel?.doel || '',
    notes?.doel?.aanpak || '',
  ].join(' ').toLowerCase()

  if (doelAntwoord.includes('recomp') || doelAntwoord.includes('strakk') || doelAntwoord.includes('definitie') || doelAntwoord.includes('tegelijk')) return 'recomp'
  if (doelAntwoord.includes('lean bulk') || doelAntwoord.includes('spier') || doelAntwoord.includes('massa') || doelAntwoord.includes('bulk') || doelAntwoord.includes('groter') || doelAntwoord.includes('gespierd')) return 'bulk'
  if (doelAntwoord.includes('afvall') || doelAntwoord.includes('kwijt') || doelAntwoord.includes('cutt') || doelAntwoord.includes('lichter') || doelAntwoord.includes('minder vet')) return 'cut'

  // 2. primary_goal uit intake
  const goal = cd?.primary_goal
  if (goal === 'recomp') return 'recomp'
  if (goal === 'muscle_gain') return 'bulk'
  if (goal === 'fat_loss' || goal === 'general_fitness') return 'cut'

  // 3. Gewichtsverschil als laatste fallback
  const diff = targetW - w
  if (diff < -0.5) return 'cut'
  if (diff > 0.5) return 'bulk'
  return 'recomp'
}

function calcRecPreset(mode, cd, wp) {
  const bf = cd?.current_body_fat || cd?.current_body_fat_2
  const exp = wp?.default_experience_level || 'intermediate'
  const urgency = parseInt(cd?.goal_urgency) || 5

  if (mode === 'recomp') return { preset: 'moderate', reason: 'Recomp — onderhoud kcal, hoog eiwit' }
  if (mode === 'bulk') {
    if (exp === 'beginner') return { preset: 'mild', reason: 'Beginner bulk — minimaal vet erbij' }
    return { preset: 'mild', reason: 'Lean bulk — minimaal vet erbij' }
  }
  // cut
  if (bf && bf > 25) return { preset: 'aggressive', reason: `Hoog vet% (${bf}%) — agressief verantwoord` }
  if (exp === 'beginner') return { preset: 'mild', reason: 'Beginner — rustig starten' }
  if (urgency >= 8) return { preset: 'moderate', reason: `Hoge urgentie (${urgency}/10)` }
  return { preset: 'moderate', reason: 'Beste balans snelheid & behoud' }
}

export function useIntakeCalc(cd, wp, planState, notes) {
  return useMemo(() => {
    const {
      deficitPreset,
      manualCal,
      cardioSessions,
      cheatDays,
      cheatDayCal,
      targetWeight: planTargetWeight,
      mode: modeOverride,
    } = planState

    const w = parseFloat(cd?.current_weight) || 80

    // Doelgewicht: coach override → intake → fallback
    const targetW = planTargetWeight
      ? parseFloat(planTargetWeight)
      : parseFloat(cd?.target_weight || cd?.goal_weight) || w

    // Modus: coach override → goal step → primary_goal → gewichtsverschil
    const mode = modeOverride || detectMode(cd, notes, targetW)
    const isCut    = mode === 'cut'
    const isBulk   = mode === 'bulk'
    const isRecomp = mode === 'recomp'

    // TDEE: altijd uit DB (al berekend door intake flow)
    // Cardio bovenop TDEE
    const baseTdee = parseInt(cd?.tdee) || 2000
    const cardioExtra = Math.round((cardioSessions || 0) * 200 / 7)
    const tdee = baseTdee + cardioExtra

    // Preset aanbeveling
    const { preset: recPresetId, reason: recReason } = calcRecPreset(mode, cd, wp)
    const activePreset = deficitPreset || recPresetId
    const presetPct = PRESETS[activePreset]?.pct || 0.20

    // Target kcal
    const useManual = !!manualCal && !isNaN(parseInt(manualCal))
    const targetCal = useManual
      ? parseInt(manualCal)
      : isCut    ? Math.round(tdee * (1 - presetPct))
      : isBulk   ? Math.round(tdee * (1 + presetPct))
      : tdee // recomp = onderhoud

    const actualDiff = Math.abs(tdee - targetCal)
    const deficitPct = Math.round((actualDiff / tdee) * 100)

    // kg/week
    const weeklyChange = actualDiff > 0
      ? Math.round((actualDiff * 7) / 7700 * 10) / 10
      : 0
    const weeklyLoss = isCut ? -weeklyChange : isBulk ? weeklyChange : 0

    // Macros — eiwit op basis van lichaamsgewicht
    const prot = Math.round(w * (isRecomp ? 2.4 : isCut ? 2.2 : 1.8))
    const fat  = Math.round((targetCal * 0.25) / 9)
    const carbs = Math.max(0, Math.round((targetCal - prot * 4 - fat * 9) / 4))

    // Tijdlijn
    const kgToChange = Math.abs(w - targetW)
    const cheatExtra = (cheatDays || 0) * (cheatDayCal || 500)
    const effectiveDiff = actualDiff - cheatExtra / 7
    const weeksNeeded = isRecomp || kgToChange === 0
      ? 0
      : effectiveDiff > 0
        ? Math.ceil((kgToChange * 7700) / (effectiveDiff * 7))
        : 99

    return {
      // Basisdata
      tdee, baseTdee, cardioExtra,
      targetCal, actualDeficit: actualDiff, deficitPct,

      // Modus
      mode, isCut, isBulk, isRecomp,

      // Macros
      prot, carbs, fat,

      // Tijdlijn
      weeklyLoss, weeksNeeded,
      goalWeight: targetW, startWeight: w, kgToLose: kgToChange,

      // Preset
      useManual, recPreset: recPresetId, recReason,
      activePreset, presetData: PRESETS[activePreset] || PRESETS.moderate,
    }
  }, [cd, wp, planState, notes])
}
