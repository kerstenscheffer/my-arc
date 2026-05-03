// src/modules/public-intake/components/phase3/ExperienceFlow.jsx
import React from 'react'
import { Q, Hint, BackBtn, BigOption } from '../phase1/FlowStep'

const WILLINGNESS_OPTIONS = [
  { value: 'starting', label: 'Ja, ik wil starten',     sub: 'Ik ben klaar om te beginnen met trainen' },
  { value: 'already',  label: 'Ik train al',             sub: 'Ik heb al een trainingsroutine' },
  { value: 'no',       label: 'Nee, liever niet',        sub: 'Trainen is op dit moment niet voor mij' },
]

const NO_REASON_OPTIONS = [
  { value: 'no_time',       label: 'Geen tijd',                    sub: 'Te druk met werk of privé' },
  { value: 'no_motivation', label: 'Geen motivatie',               sub: 'Ik zie er tegenop' },
  { value: 'injury',        label: 'Blessure of pijn',             sub: 'Mijn lichaam laat het niet toe' },
  { value: 'dont_know',     label: 'Weet niet waar te beginnen',   sub: 'Het voelt overweldigend' },
  { value: 'other',         label: 'Iets anders',                  sub: 'Een andere reden' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'beginner',     label: 'Beginner',   sub: 'Minder dan 1 jaar ervaring' },
  { value: 'intermediate', label: 'Gemiddeld',  sub: '1–3 jaar ervaring' },
  { value: 'advanced',     label: 'Gevorderd',  sub: '3+ jaar ervaring' },
]

export default function ExperienceFlow({ data, onChange, isMobile, onNext, onBack, onNoTraining }) {
  const [step, setStep] = React.useState('willingness')
  const history = React.useRef([])

  const update = (field, value) => onChange({ ...data, [field]: value })

  const go = (next) => { history.current.push(step); setStep(next) }
  const back = () => {
    if (history.current.length > 0) setStep(history.current.pop())
    else if (onBack) onBack()
  }

  if (step === 'willingness') {
    return (
      <div>
        <Q isMobile={isMobile}>Wil je gaan trainen?</Q>
        <Hint isMobile={isMobile}>Eerlijk antwoord helpt ons je het beste te begeleiden.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {WILLINGNESS_OPTIONS.map(opt => (
            <BigOption key={opt.value} label={opt.label} sub={opt.sub}
              selected={data.training_willingness === opt.value}
              onClick={() => {
                update('training_willingness', opt.value)
                if (opt.value === 'no') setTimeout(() => go('no_reason'), 150)
                else if (opt.value === 'starting') setTimeout(() => onNext('beginner'), 150)
                else setTimeout(() => go('experience'), 150)
              }}
              isMobile={isMobile} />
          ))}
        </div>
        {onBack && <BackBtn onBack={back} isMobile={isMobile} />}
      </div>
    )
  }

  if (step === 'no_reason') {
    return (
      <div>
        <Q isMobile={isMobile}>Wat houdt je tegen?</Q>
        <Hint isMobile={isMobile}>Geen verkeerd antwoord — we begrijpen het.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {NO_REASON_OPTIONS.map(opt => (
            <BigOption key={opt.value} label={opt.label} sub={opt.sub}
              selected={data.no_training_reason === opt.value}
              onClick={() => {
                update('no_training_reason', opt.value)
                console.log('✅ ExperienceFlow — geen training, reden:', opt.value)
                setTimeout(() => onNoTraining(), 150)
              }}
              isMobile={isMobile} />
          ))}
        </div>
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'experience') {
    return (
      <div>
        <Q isMobile={isMobile}>Hoe lang train je al?</Q>
        <Hint isMobile={isMobile}>We stemmen de vragen en je plan af op jouw niveau.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {EXPERIENCE_OPTIONS.map(opt => (
            <BigOption key={opt.value} label={opt.label} sub={opt.sub}
              selected={data.experience_level === opt.value}
              onClick={() => {
                update('experience_level', opt.value)
                console.log('✅ ExperienceFlow onNext —', opt.value)
                setTimeout(() => onNext(opt.value), 150)
              }}
              isMobile={isMobile} />
          ))}
        </div>
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  return null
}
