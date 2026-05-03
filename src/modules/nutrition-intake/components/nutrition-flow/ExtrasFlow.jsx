// src/modules/nutrition-intake/components/nutrition-flow/ExtrasFlow.jsx
// Stap 9-10: Supplementen + flexibel eten / cheat meals
import React, { useState } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption, OptionGrid } from '../../../public-intake/components/phase1/FlowStep'

const SUPPS_OPTIONS = [
  { value: 'ja_graag',    label: 'Ja, graag',              sub: 'Open voor adviezen over supplementen' },
  { value: 'basics',      label: 'Alleen de basis',        sub: 'Eiwitpoeder, creatine — niet meer dan dat' },
  { value: 'liever_niet', label: 'Liever niet',            sub: 'Ik doe het liever zonder' },
  { value: 'nee',         label: 'Nee, helemaal niet',     sub: 'Geen interesse in supplementen' },
]

const CHEAT_OPTIONS = [
  { value: 'nooit',    label: 'Ik wil het plan strikt volgen', sub: 'Geen uitzonderingen, ik ga er volledig voor' },
  { value: '1x_week',  label: '1 keer per week iets extra',    sub: 'Bijv. vrijdagavond pizza of een biertje' },
  { value: 'weekend',  label: 'Weekenden flexibel',             sub: 'Door de week strict, weekend losser' },
  { value: 'als_nodig',label: 'Als het nodig is',              sub: 'Verjaardagen, etentjes — met gezond verstand' },
]

const SOCIAAL_OPTIONS = [
  { value: 'zelden',    label: 'Zelden of nooit',          sub: 'Ik eet bijna altijd thuis' },
  { value: '1x_week',  label: '1 keer per week',           sub: 'Etentje, restaurant of sociale gelegenheid' },
  { value: 'vaker',    label: 'Meerdere keren per week',   sub: 'Eten buiten de deur is normaal voor mij' },
]

export default function ExtrasFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [step, setStep] = useState(1)

  const update = (field, value) => onChange({ ...data, [field]: value })

  const goBack = () => {
    if (step > 1) setStep(step - 1)
    else if (onBack) onBack()
  }

  const pad = isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem'

  // Stap 1 — Supplementen
  if (step === 1) return (
    <div style={{ padding: pad }}>
      <BackBtn onBack={onBack} />
      <Q isMobile={isMobile}>Hoe sta je tegenover supplementen?</Q>
      <Hint isMobile={isMobile}>Eiwitpoeder, vitamines, creatine — wil je hier advies over?</Hint>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {SUPPS_OPTIONS.map(opt => (
          <BigOption
            key={opt.value}
            label={opt.label}
            sub={opt.sub}
            selected={data.supps_openheid === opt.value}
            onClick={() => {
              update('supps_openheid', opt.value)
              setTimeout(() => setStep(2), 200)
            }}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  )

  // Stap 2 — Flexibel eten
  if (step === 2) return (
    <div style={{ padding: pad }}>
      <BackBtn onBack={goBack} />
      <Q isMobile={isMobile}>Hoe wil je omgaan met cheat meals?</Q>
      <Hint isMobile={isMobile}>Geen enkel antwoord is fout — eerlijk is beter</Hint>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {CHEAT_OPTIONS.map(opt => (
          <BigOption
            key={opt.value}
            label={opt.label}
            sub={opt.sub}
            selected={data.cheat_aanpak === opt.value}
            onClick={() => {
              update('cheat_aanpak', opt.value)
              setTimeout(() => setStep(3), 200)
            }}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  )

  // Stap 3 — Hoe vaak sociaal eten
  if (step === 3) return (
    <div style={{ padding: pad }}>
      <BackBtn onBack={goBack} />
      <Q isMobile={isMobile}>Hoe vaak eet je buiten de deur of bij anderen?</Q>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.25rem' }}>
        {SOCIAAL_OPTIONS.map(opt => (
          <BigOption
            key={opt.value}
            label={opt.label}
            sub={opt.sub}
            selected={data.sociaal_eten === opt.value}
            onClick={() => update('sociaal_eten', opt.value)}
            isMobile={isMobile}
          />
        ))}
      </div>
      <NextBtn
        onClick={onNext}
        disabled={!data.sociaal_eten}
        isMobile={isMobile}
      />
    </div>
  )

  return null
}
