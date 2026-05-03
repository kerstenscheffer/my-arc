// src/modules/public-intake/components/phase1/HealthFlow.jsx
// Stap 5: Gezondheid — medische aandoeningen

import React, { useState } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption, TextField } from './FlowStep'

export default function HealthFlow({ data, onChange, onNext, onBack, isMobile }) {
  const update = (field, value) => onChange({ ...data, [field]: value })

  const handleOnNext = () => {
    console.log('✅ HealthFlow voltooid — door naar Coaching')
    onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <BackBtn onBack={onBack} />
      <Q isMobile={isMobile}>Heb je medische aandoeningen?</Q>
      <Hint isMobile={isMobile}>Optioneel — alleen wat relevant is voor je training en voeding.</Hint>

      <BigOption
        label="Nee, niets bijzonders"
        onClick={() => { update('medical_conditions', null); onNext() }}
        selected={data.medical_conditions === null || data.medical_conditions === undefined}
        isMobile={isMobile}
      />
      <BigOption
        label="Ja, ik wil iets vermelden"
        onClick={() => update('medical_conditions', data.medical_conditions || '')}
        selected={typeof data.medical_conditions === 'string' && data.medical_conditions !== null}
        isMobile={isMobile}
      />

      {typeof data.medical_conditions === 'string' && (
        <>
          <TextField
            value={data.medical_conditions}
            onChange={v => update('medical_conditions', v)}
            placeholder="Bijv: diabetes, astma, schildklierprobleem, hernia..."
            multiline
            isMobile={isMobile}
            autoFocus
          />
          <div style={{ fontSize: isMobile ? '0.65rem' : '0.68rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500, lineHeight: 1.5 }}>
            Blessures en allergieën komen later in de intake.
          </div>
        </>
      )}

      <NextBtn
        onClick={handleOnNext}
        label="VOLGENDE →"
        disabled={typeof data.medical_conditions === 'string' && !data.medical_conditions.trim()}
        isMobile={isMobile}
      />
    </div>
  )
}
