// src/modules/client-journey/components/calls/IntakeGoalPanel.jsx
// v8 — Flow als stap 0, correcte opslag via stepNotes/stepActions van parent
import React from 'react'
import { C } from './IntakeCallHelpers'
import IntakeGoalFlow from './IntakeGoalFlow'
import IntakeGoalStep1 from './IntakeGoalStep1'
import IntakeGoalStep2 from './IntakeGoalStep2'
import IntakeGoalStep3 from './IntakeGoalStep3'
import IntakeGoalStep4 from './IntakeGoalStep4'

const STEPS = [
  { id: 0, label: 'GESPREK' },
  { id: 1, label: 'DOEL' },
  { id: 2, label: 'PLAN' },
  { id: 3, label: 'RESULTAAT' },
  { id: 4, label: 'BEVESTIG' }
]

export default function IntakeGoalPanel({
  cd, np, db,
  notes, onNotesChange,
  actions, onActionsChange,
  goalState, updateGoalState,
  stepNotes, setStepNotes, stepActions, setStepActions,
  isMobile
}) {
  const { deficitPreset, manualCal, cardioSessions, cheatDays, cheatDayCal, coachingLevel, confirmed, step } = goalState
  const setStep = (v) => updateGoalState({ step: v })
  const setDeficitPreset = (v) => updateGoalState({ deficitPreset: v })
  const setManualCal = (v) => updateGoalState({ manualCal: v })
  const setCardioSessions = (v) => updateGoalState({ cardioSessions: v })
  const setCheatDays = (v) => updateGoalState({ cheatDays: v })
  const setCheatDayCal = (v) => updateGoalState({ cheatDayCal: v })
  const setCoachingLevel = (v) => updateGoalState({ coachingLevel: v })
  const setConfirmed = (v) => updateGoalState({ confirmed: v })

  const qNotes = typeof notes === 'object' && notes !== null ? notes : {}
  const updateQ = (id, val) => onNotesChange({ ...qNotes, [id]: val })

  const calcResult = useCalc(cd, deficitPreset, manualCal, cardioSessions, cheatDays, cheatDayCal)

  // stepNotes/stepActions komen direct van IntakeCallPanel (via detailProps)
  // Als ze niet meekomen (backward compat), gebruik lege fallback
  const _stepNotes = stepNotes || {}
  const _setStepNotes = setStepNotes || (() => {})
  const _stepActions = stepActions || {}
  const _setStepActions = setStepActions || (() => {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {STEPS.map((s) => {
          const active = step === s.id
          const done = step > s.id
          return (
            <button key={s.id} onClick={() => setStep(s.id)} style={{
              flex: 1, padding: '0.5rem 0', background: 'transparent', border: 'none',
              borderBottom: active ? `2px solid ${C.gold}` : done ? `2px solid ${C.green}` : '2px solid transparent',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem'
            }}>
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%',
                background: done ? C.green : active ? C.gold : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.35rem', fontWeight: 800,
                color: done || active ? '#000' : C.text25
              }}>{done ? '✓' : s.id === 0 ? '●' : s.id}</div>
              <span style={{
                fontSize: '0.35rem', fontWeight: 700,
                color: active ? C.gold : done ? C.green : C.text25,
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {step === 0 && (
          <IntakeGoalFlow
            cd={cd}
            np={np}
            stepNotes={_stepNotes}
            setStepNotes={_setStepNotes}
            stepActions={_stepActions}
            setStepActions={_setStepActions}
            isMobile={isMobile}
            onDone={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <IntakeGoalStep1
            cd={cd} qNotes={qNotes} updateQ={updateQ}
            isMobile={isMobile} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <IntakeGoalStep2
            cd={cd} result={calcResult} isMobile={isMobile}
            deficitPreset={deficitPreset} setDeficitPreset={setDeficitPreset}
            manualCal={manualCal} setManualCal={setManualCal}
            cardioSessions={cardioSessions} setCardioSessions={setCardioSessions}
            cheatDays={cheatDays} setCheatDays={setCheatDays}
            cheatDayCal={cheatDayCal} setCheatDayCal={setCheatDayCal}
            onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <IntakeGoalStep3
            cd={cd} result={calcResult} isMobile={isMobile}
            deficitPreset={deficitPreset} cardioSessions={cardioSessions} cheatDays={cheatDays}
            onNext={() => setStep(4)} onBack={() => setStep(2)} />
        )}
        {step === 4 && (
          <IntakeGoalStep4
            cd={cd} db={db} result={calcResult} isMobile={isMobile}
            coachingLevel={coachingLevel} setCoachingLevel={setCoachingLevel}
            confirmed={confirmed} setConfirmed={setConfirmed}
            qNotes={qNotes} updateQ={updateQ}
            actions={actions} onActionsChange={onActionsChange}
            onBack={() => setStep(3)} />
        )}
      </div>
    </div>
  )
}

function useCalc(cd, deficitPreset, manualCal, cardioSessions, cheatDays, cheatDayCal) {
  const w = parseFloat(cd.current_weight) || 80
  const h = parseFloat(cd.height) || 180
  const age = cd.date_of_birth ? Math.floor((Date.now() - new Date(cd.date_of_birth)) / 31557600000) : (cd.age || 25)
  const bmr = (cd.gender || 'male') === 'male' ? (10*w)+(6.25*h)-(5*age)+5 : (10*w)+(6.25*h)-(5*age)-161
  const multi = { sedentary:1.2, lightly_active:1.375, moderately_active:1.55, very_active:1.725 }
  const baseTdee = Math.round(bmr * (multi[cd.activity_level] || 1.55))
  const cardioDaily = Math.round((cardioSessions * 200) / 7)
  const tdee = baseTdee + cardioDaily
  const isCut = ['fat_loss','recomp','general_fitness'].includes(cd.primary_goal)
  const kgToLose = cd.current_weight && cd.target_weight ? Math.abs(cd.current_weight - cd.target_weight) : 5
  const urgency = parseInt(cd.goal_urgency) || 5
  let recPreset = 'moderate'
  let recReason = `${kgToLose} kg, urgentie ${urgency}/10`
  if (kgToLose > 10 || urgency >= 8) { recPreset = 'aggressive'; recReason = `${kgToLose} kg, urgentie ${urgency}/10 → agressief` }
  else if (kgToLose < 5 || cd.primary_goal === 'recomp') { recPreset = 'mild'; recReason = cd.primary_goal === 'recomp' ? 'Recomp → klein deficit' : `${kgToLose} kg, geen haast → mild` }
  const activePreset = deficitPreset || recPreset
  const pctMap = { mild: 0.125, moderate: 0.20, aggressive: 0.30 }
  const deficitFromPreset = Math.round(tdee * (pctMap[activePreset] || 0.20))
  const manualCalInt = parseInt(manualCal)
  const useManual = manualCal && manualCalInt > 0
  let targetCal = useManual ? manualCalInt : (isCut ? Math.max(tdee - deficitFromPreset, 1400) : tdee + Math.round(deficitFromPreset * 0.5))
  const actualDeficit = Math.abs(tdee - targetCal)
  const deficitPct = Math.round((actualDeficit / tdee) * 100)
  const prot = Math.round(w * 2.0)
  const fat = Math.round(w * 0.9)
  const carbs = Math.max(Math.round((targetCal - (prot * 4) - (fat * 9)) / 4), 50)
  const cheatExtra = cheatDays * (cheatDayCal || 500)
  const weeklyDeficit = (actualDeficit * 7) - cheatExtra
  const weeklyLoss = Math.max(weeklyDeficit / 7700, 0.05)
  const weeksNeeded = Math.ceil(kgToLose / weeklyLoss)
  const weeksWithoutCheat = Math.ceil(kgToLose / (actualDeficit * 7 / 7700))
  const timeline = []
  let cw = w
  for (let wk = 1; wk <= Math.min(weeksNeeded, 52); wk++) {
    cw = isCut ? Math.round((cw - weeklyLoss) * 10) / 10 : Math.round((cw + weeklyLoss * 0.3) * 10) / 10
    timeline.push({ week: wk, weight: cw, lost: Math.round(Math.abs(w - cw) * 10) / 10 })
  }
  const goalWeight = isCut ? Math.round((w - kgToLose) * 10) / 10 : Math.round((w + kgToLose) * 10) / 10
  return {
    tdee, baseTdee, cardioDaily, targetCal, actualDeficit, deficitPct, isCut,
    prot, carbs, fat, weeksNeeded, weeksWithoutCheat, weeklyLoss: Math.round(weeklyLoss * 10) / 10,
    cheatExtra, goalWeight, timeline, startWeight: w, kgToLose, useManual,
    recPreset, recReason, activePreset
  }
}
