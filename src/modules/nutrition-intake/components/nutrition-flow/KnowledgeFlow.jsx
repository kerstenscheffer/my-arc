// src/modules/nutrition-intake/components/nutrition-flow/KnowledgeFlow.jsx
// Stap 4: Kennis niveau — macro's, calorieën, eerder plan gevolgd
import React, { useState } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption } from '../../../public-intake/components/phase1/FlowStep'

const MACROS_KENNIS = [
  { value: 'ja',     label: 'Ja, ik weet wat het zijn',    sub: 'Eiwitten, koolhydraten, vetten' },
  { value: 'beetje', label: 'Een beetje',                  sub: 'Ik heb er wel van gehoord' },
  { value: 'nee',    label: 'Nee, nog nooit van gehoord',  sub: 'Geen probleem — je coach legt het uit' },
]

const CALORIEEN_GETELD = [
  { value: 'ja',       label: 'Ja, regelmatig',            sub: 'Via een app of zelf bijgehouden' },
  { value: 'soms',     label: 'Soms een tijdje',           sub: 'Maar ben ermee gestopt' },
  { value: 'nee',      label: 'Nee, nooit',                sub: 'Heb ik nog niet gedaan' },
]

const PLAN_GEVOLGD = [
  { value: 'ja',       label: 'Ja, een of meerdere keren', sub: 'Bijv. bij een coach of uit een boek' },
  { value: 'nee',      label: 'Nee, nog nooit',            sub: 'Dit is de eerste keer' },
]

export default function KnowledgeFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [step, setStep] = useState(1)

  const update = (field, value) => onChange({ ...data, [field]: value })

  const goBack = () => {
    if (step > 1) setStep(step - 1)
    else if (onBack) onBack()
  }

  const pad = isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem'

  // Stap 1 — Ken je macro's?
  if (step === 1) return (
    <div style={{ padding: pad }}>
      <BackBtn onBack={onBack} />
      <Q isMobile={isMobile}>Ken je het woord macro's?</Q>
      <Hint isMobile={isMobile}>Geen foute antwoorden — dit bepaalt hoe je coach met je communiceert</Hint>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {MACROS_KENNIS.map(opt => (
          <BigOption
            key={opt.value}
            label={opt.label}
            sub={opt.sub}
            selected={data.macros_kennis === opt.value}
            onClick={() => {
              update('macros_kennis', opt.value)
              setTimeout(() => setStep(2), 200)
            }}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  )

  // Stap 2 — Calorieën geteld?
  if (step === 2) return (
    <div style={{ padding: pad }}>
      <BackBtn onBack={goBack} />
      <Q isMobile={isMobile}>Heb je ooit calorieën bijgehouden?</Q>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {CALORIEEN_GETELD.map(opt => (
          <BigOption
            key={opt.value}
            label={opt.label}
            sub={opt.sub}
            selected={data.calorieen_geteld === opt.value}
            onClick={() => {
              update('calorieen_geteld', opt.value)
              setTimeout(() => setStep(3), 200)
            }}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  )

  // Stap 3 — Eerder voedingsplan gevolgd?
  if (step === 3) return (
    <div style={{ padding: pad }}>
      <BackBtn onBack={goBack} />
      <Q isMobile={isMobile}>Heb je eerder een voedingsplan gevolgd?</Q>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' }}>
        {PLAN_GEVOLGD.map(opt => (
          <BigOption
            key={opt.value}
            label={opt.label}
            sub={opt.sub}
            selected={data.plan_gevolgd === opt.value}
            onClick={() => update('plan_gevolgd', opt.value)}
            isMobile={isMobile}
          />
        ))}
      </div>
      <NextBtn
        onClick={onNext}
        disabled={!data.plan_gevolgd}
        isMobile={isMobile}
      />
    </div>
  )

  return null
}
