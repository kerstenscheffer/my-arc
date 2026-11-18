// src/modules/public-intake/components/phase3/SpierFocusFlow.jsx
//
// Welke spieren wil de klant het meest zien groeien, en wat liever niet.
// Mannen en vrouwen krijgen een eigen volgorde en voorselectie (spierFocus.js).
import React from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption } from '../phase1/FlowStep'
import { MAX_FOCUS, SPIER_LABEL, spierFocusVoor } from '../../spierFocus'

export default function SpierFocusFlow({ data, onChange, isMobile, onNext, onBack, gender }) {
  const [step, setStep] = React.useState('focus')
  const profiel = spierFocusVoor(gender)
  const focus = Array.isArray(data.focus_spieren) ? data.focus_spieren : []
  const niet = Array.isArray(data.niet_groter) ? data.niet_groter : []

  // Voorselectie: alleen als de klant hier nog niets koos.
  React.useEffect(() => {
    if (data.focus_spieren === undefined && profiel.voorkeur.length) {
      onChange({ ...data, focus_spieren: profiel.voorkeur })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const wisselFocus = (k) => {
    if (focus.includes(k)) return onChange({ ...data, focus_spieren: focus.filter(x => x !== k) })
    if (focus.length >= MAX_FOCUS) return
    onChange({ ...data, focus_spieren: [...focus, k], niet_groter: niet.filter(x => x !== k) })
  }
  const wisselNiet = (k) => onChange({ ...data, niet_groter: niet.includes(k) ? niet.filter(x => x !== k) : [...niet, k] })

  const lijst = { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }

  if (step === 'focus') {
    const vol = focus.length >= MAX_FOCUS
    return (
      <div>
        <Q isMobile={isMobile}>Wat wil je het meest zien groeien?</Q>
        <Hint isMobile={isMobile}>
          {profiel.voorkeur.length
            ? `Kies er maximaal ${MAX_FOCUS}. Wat het vaakst gekozen wordt staat al aan; tik iets weg als het voor jou niet klopt.`
            : `Kies er maximaal ${MAX_FOCUS}. Hier krijgt je schema extra werk voor.`}
        </Hint>
        <div style={lijst}>
          {profiel.volgorde.map(k => {
            const aan = focus.includes(k)
            return (
              <div key={k} style={{ opacity: !aan && vol ? 0.4 : 1 }}>
                <BigOption label={SPIER_LABEL[k]} sub={profiel.sub[k]} selected={aan} onClick={() => wisselFocus(k)} isMobile={isMobile} />
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <Hint isMobile={isMobile}>
            {focus.length ? `${focus.length} van ${MAX_FOCUS} gekozen. Alles wordt getraind, dit krijgt voorrang.` : 'Niets gekozen: je coach kiest voor je.'}
          </Hint>
        </div>
        <NextBtn onClick={() => { window.scrollTo({ top: 0 }); setStep('niet') }} isMobile={isMobile} />
        <BackBtn onBack={onBack} isMobile={isMobile} />
      </div>
    )
  }

  const opties = profiel.nietGroter.filter(k => !focus.includes(k))
  return (
    <div>
      <Q isMobile={isMobile}>Is er iets wat je liever niet groter wilt?</Q>
      <Hint isMobile={isMobile}>We trainen het dan wel, maar zonder extra werk. Niets aantikken is prima.</Hint>
      <div style={lijst}>
        {opties.map(k => (
          <BigOption key={k} label={SPIER_LABEL[k]} selected={niet.includes(k)} onClick={() => wisselNiet(k)} isMobile={isMobile} />
        ))}
      </div>
      <NextBtn onClick={onNext} label={niet.length ? 'VOLGENDE →' : 'NEE, ALLES MAG GROEIEN →'} isMobile={isMobile} />
      <BackBtn onBack={() => setStep('focus')} isMobile={isMobile} />
    </div>
  )
}
