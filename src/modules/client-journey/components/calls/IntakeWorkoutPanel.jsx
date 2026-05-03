// src/modules/client-journey/components/calls/IntakeWorkoutPanel.jsx
// Training tab — guided wizard
// v2 — Flow-intro als stap 0
import React from 'react'
import { C } from './IntakeCallHelpers'
import IntakeWorkoutFlow from './IntakeWorkoutFlow'
import IntakeWorkoutStep1 from './IntakeWorkoutStep1'
import IntakeWorkoutStep2 from './IntakeWorkoutStep2'
import IntakeWorkoutStep3 from './IntakeWorkoutStep3'

const STEPS = [
  { id: 0, label: 'GESPREK' },
  { id: 1, label: 'OVERZICHT' },
  { id: 2, label: 'BESPREEK' },
  { id: 3, label: 'BEVESTIG' }
]

export default function IntakeWorkoutPanel({ cd, wp, stepNotes, setStepNotes, stepActions, setStepActions, workoutState, updateWorkoutState, isMobile }) {
  const { step } = workoutState || { step: 0 }
  const setStep = (v) => updateWorkoutState({ step: v })

  const shared = { cd, wp, stepNotes, setStepNotes, stepActions, setStepActions, isMobile }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {STEPS.map(s => {
          const active = step === s.id, done = step > s.id
          return (
            <button key={s.id} onClick={() => setStep(s.id)} style={{
              flex: 1, padding: '0.5rem 0', background: 'transparent', border: 'none',
              borderBottom: active ? `2px solid ${C.blue}` : done ? `2px solid ${C.blue}` : '2px solid transparent',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem'
            }}>
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%',
                background: done ? C.blue : active ? C.blue : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.35rem', fontWeight: 800,
                color: done || active ? '#000' : C.text25
              }}>{done ? '✓' : s.id === 0 ? '💬' : s.id}</div>
              <span style={{
                fontSize: '0.35rem', fontWeight: 700,
                color: active ? C.blue : done ? C.blue : C.text25,
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {step === 0 && (
          <IntakeWorkoutFlow
            cd={cd} wp={wp}
            stepNotes={stepNotes} setStepNotes={setStepNotes}
            stepActions={stepActions} setStepActions={setStepActions}
            isMobile={isMobile}
            onDone={() => setStep(1)}
          />
        )}
        {step === 1 && <IntakeWorkoutStep1 {...shared} onNext={() => setStep(2)} />}
        {step === 2 && <IntakeWorkoutStep2 {...shared} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <IntakeWorkoutStep3 {...shared} onBack={() => setStep(2)} />}
      </div>
    </div>
  )
}
