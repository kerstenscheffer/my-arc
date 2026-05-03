// src/modules/public-intake/components/phase3/CurrentTrainingFlow.jsx
// Alleen voor ervaren trainers (intermediate/advanced)
import React from 'react'
import { Q, Hint, BackBtn, BigOption } from '../phase1/FlowStep'

const SPLIT_OPTIONS_SIMPLE = [
  { value: 'full_body',     label: 'Alles in één sessie',         sub: 'Elke training train ik mijn hele lichaam' },
  { value: 'upper_lower',   label: 'Boven- en onderlichaam',      sub: 'Ik wissel af per dag' },
  { value: 'bro_split',     label: 'Per spiergroep apart',        sub: 'Bijv. borst dag, rug dag, beendag' },
  { value: 'no_preference', label: 'Geen vaste structuur',        sub: 'Ik doe wat ik op de dag zelf bedenk' },
]

const SPLIT_OPTIONS_ADVANCED = [
  { value: 'full_body',     label: 'Full body',          sub: 'Heel lichaam elke training' },
  { value: 'ppl',           label: 'Push-Pull-Legs',     sub: '3 of 6 dagen — duw, trek, benen' },
  { value: 'upper_lower',   label: 'Upper-Lower',        sub: 'Boven- en onderlichaam afwisselen' },
  { value: 'bro_split',     label: 'Bro split',          sub: '1 spiergroep per dag' },
  { value: 'no_preference', label: 'Coach bepaalt',      sub: 'Ik heb geen voorkeur' },
]

export default function CurrentTrainingFlow({ data, onChange, isMobile, onNext, onBack, experienceLevel }) {
  const update = (field, value) => onChange({ ...data, [field]: value })
  const isAdvanced = experienceLevel === 'advanced'
  const splitOptions = isAdvanced ? SPLIT_OPTIONS_ADVANCED : SPLIT_OPTIONS_SIMPLE

  return (
    <div>
      <Q isMobile={isMobile}>Hoe ziet je huidige training eruit?</Q>
      <Hint isMobile={isMobile}>
        {isAdvanced
          ? 'Kies de split die je nu gebruikt of het meest aanspreekt.'
          : 'Kies wat het beste omschrijft hoe jij nu traint.'}
      </Hint>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        {splitOptions.map(opt => (
          <BigOption key={opt.value} label={opt.label} sub={opt.sub}
            selected={data.split_preference === opt.value}
            onClick={() => {
              update('split_preference', opt.value)
              console.log('✅ CurrentTrainingFlow onNext —', opt.value)
              setTimeout(() => onNext(), 150)
            }}
            isMobile={isMobile} />
        ))}
      </div>
      <BackBtn onBack={onBack} />
    </div>
  )
}
