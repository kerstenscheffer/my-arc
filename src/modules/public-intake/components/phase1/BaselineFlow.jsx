// src/modules/public-intake/components/phase1/BaselineFlow.jsx
//
// Nulmeting: vijf schalen 1-10 plus een open toelichting.
//
// Staat bewust vroeg in de intake, direct na 'Doel': de klant heeft net
// uitgesproken waar hij heen wil, dus dit is het moment om vast te leggen
// waar hij vandaan komt. Later kun je dezelfde vijf vragen opnieuw stellen
// (client_baselines, bron='hermeting') en de twee naast elkaar leggen.
//
// Eén vraag per scherm, zoals de rest van de intake. Op een telefoon is dat
// het verschil tussen doorklikken en afhaken.

import React from 'react'
import { Q, Hint, NextBtn, BackBtn, SkipBtn, TextField, SchaalTien } from './FlowStep'
import { BASELINE_VRAGEN } from '../../baselineVragen'

const STAPPEN = [...BASELINE_VRAGEN.map(v => v.veld), 'toelichting']

export default function BaselineFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [step, setStep] = React.useState(STAPPEN[0])

  const index = STAPPEN.indexOf(step)
  const meting = data.baseline || {}

  const zet = (veld, waarde) => onChange({ ...data, baseline: { ...meting, [veld]: waarde } })

  const vooruit = () => {
    if (index < STAPPEN.length - 1) setStep(STAPPEN[index + 1])
    else onNext()
  }
  const terug = () => {
    if (index > 0) setStep(STAPPEN[index - 1])
    else onBack?.()
  }

  if (step === 'toelichting') {
    return (
      <>
        <BackBtn onBack={terug} />
        <Q isMobile={isMobile}>In je eigen woorden — hoe voel je je nu over je lichaam en je fitheid?</Q>
        <Hint isMobile={isMobile}>
          Geen goed of fout. Dit lezen we straks terug als je vooruitgang boekt.
        </Hint>
        <TextField
          multiline
          placeholder="Schrijf op wat er in je opkomt…"
          value={meting.toelichting || ''}
          onChange={v => zet('toelichting', v)}
          isMobile={isMobile}
        />
        <NextBtn onClick={onNext} isMobile={isMobile} />
        <SkipBtn onClick={onNext} label="Liever niet — overslaan" isMobile={isMobile} />
      </>
    )
  }

  const v = BASELINE_VRAGEN.find(x => x.veld === step)
  return (
    <>
      <BackBtn onBack={terug} />
      <Q isMobile={isMobile}>{v.vraag}</Q>
      {index === 0 && (
        <Hint isMobile={isMobile}>
          Vijf korte vragen over hoe je er nu voor staat. Over een paar weken stellen we ze opnieuw.
        </Hint>
      )}
      <SchaalTien
        value={meting[v.veld]}
        onChange={n => { zet(v.veld, n) }}
        laag={v.laag}
        hoog={v.hoog}
        isMobile={isMobile}
      />
      <NextBtn onClick={vooruit} disabled={!meting[v.veld]} isMobile={isMobile} />
    </>
  )
}
