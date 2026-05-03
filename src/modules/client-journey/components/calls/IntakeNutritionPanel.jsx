// src/modules/client-journey/components/calls/IntakeNutritionPanel.jsx
// Voeding tab — guided wizard
// v2 — Flow-intro als stap 0
import React from 'react'
import { C } from './IntakeCallHelpers'
import IntakeNutritionFlow from './IntakeNutritionFlow'
import IntakeNutritionStep1 from './IntakeNutritionStep1'
import IntakeNutritionStep2 from './IntakeNutritionStep2'
import IntakeNutritionStep3 from './IntakeNutritionStep3'
import IntakeNutritionStep4 from './IntakeNutritionStep4'

const STEPS = [
  { id: 0, label: 'GESPREK' },
  { id: 1, label: 'OVERZICHT' },
  { id: 2, label: 'EETPATROON' },
  { id: 3, label: 'DROOMPLAN' },
  { id: 4, label: 'BEVESTIG' }
]

export default function IntakeNutritionPanel({ cd, np, stepNotes, setStepNotes, stepActions, setStepActions, nutritionState, updateNutritionState, isMobile }) {
  const { step } = nutritionState || { step: 0 }
  const setStep = (v) => updateNutritionState({ step: v })

  const getRemovals = (cat) => (np?.[cat]?.removals || []).map(r => r.name || r.id || r)
  const getAdditions = (cat) => (np?.[cat]?.additions || []).map(a => a.name || a)
  const prac = np?.practical_info || {}

  const shared = { cd, np, prac, getRemovals, getAdditions, stepNotes, setStepNotes, stepActions, setStepActions, isMobile }

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
              borderBottom: active ? `2px solid ${C.green}` : done ? `2px solid ${C.green}` : '2px solid transparent',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem'
            }}>
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%',
                background: done ? C.green : active ? C.green : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.35rem', fontWeight: 800,
                color: done || active ? '#000' : C.text25
              }}>{done ? '✓' : s.id === 0 ? '💬' : s.id}</div>
              <span style={{
                fontSize: '0.35rem', fontWeight: 700,
                color: active ? C.green : done ? C.green : C.text25,
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {step === 0 && (
          <IntakeNutritionFlow
            cd={cd} np={np}
            stepNotes={stepNotes} setStepNotes={setStepNotes}
            stepActions={stepActions} setStepActions={setStepActions}
            isMobile={isMobile}
            onDone={() => setStep(1)}
          />
        )}
        {step === 1 && <IntakeNutritionStep1 {...shared} onNext={() => setStep(2)} />}
        {step === 2 && <IntakeNutritionStep2 {...shared} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <IntakeNutritionStep3 {...shared} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <IntakeNutritionStep4 {...shared} onBack={() => setStep(3)} />}
      </div>
    </div>
  )
}
