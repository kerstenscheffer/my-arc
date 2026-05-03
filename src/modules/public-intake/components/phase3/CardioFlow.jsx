// src/modules/public-intake/components/phase3/CardioFlow.jsx
import React from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption } from '../phase1/FlowStep'

const DOES_CARDIO_OPTIONS = [
  { value: 'yes',   label: 'Ja, regelmatig', sub: 'Cardio zit al in mijn routine' },
  { value: 'sometimes', label: 'Soms',       sub: 'Af en toe, niet gepland' },
  { value: 'no',    label: 'Nee',            sub: 'Ik doe momenteel geen cardio' },
]

const WANTS_CARDIO_OPTIONS = [
  { value: 'yes',   label: 'Ja graag',       sub: 'Voeg cardio toe aan mijn schema' },
  { value: 'maybe', label: 'Misschien',      sub: 'Beetje cardio is prima' },
  { value: 'no',    label: 'Liever niet',    sub: 'Ik focus liever alleen op training' },
]

const CARDIO_TYPE_OPTIONS = [
  { value: 'running',     label: 'Hardlopen' },
  { value: 'cycling',     label: 'Fietsen' },
  { value: 'rowing',      label: 'Roeien' },
  { value: 'swimming',    label: 'Zwemmen' },
  { value: 'hiit',        label: 'HIIT' },
  { value: 'stairmaster', label: 'Stairmaster' },
  { value: 'elliptical',  label: 'Crosstrainer' },
  { value: 'walking',     label: 'Wandelen' },
  { value: 'incline_walk',label: 'Incline walking' },
  { value: 'jump_rope',   label: 'Touwtje springen' },
]

const CARDIO_FREQ_OPTIONS = [
  { value: 1, label: '1x per week' },
  { value: 2, label: '2x per week' },
  { value: 3, label: '3x per week' },
  { value: 4, label: '4x per week' },
  { value: 5, label: '5x per week' },
]

const CARDIO_DURATION_OPTIONS = [
  { value: 20, label: '20 min',  sub: 'Kort en intens' },
  { value: 30, label: '30 min',  sub: 'Standaard' },
  { value: 45, label: '45 min',  sub: 'Uitgebreid' },
  { value: 60, label: '60 min+', sub: 'Lang duurtraining' },
]

export default function CardioFlow({ data, onChange, isMobile, onNext, onBack, isBeginner }) {
  const [step, setStep] = React.useState(isBeginner ? 'wants_cardio' : 'does_cardio')
  const history = React.useRef([])

  const update = (field, value) => onChange({ ...data, [field]: value })
  const go = (next) => { history.current.push(step); setStep(next) }
  const back = () => {
    if (history.current.length > 0) setStep(history.current.pop())
    else if (onBack) onBack()
  }

  const toggleType = (val) => {
    const current = data.cardio_types || []
    update('cardio_types', current.includes(val) ? current.filter(v => v !== val) : [...current, val])
  }

  // Ervaren: eerst "doe je al cardio?"
  if (step === 'does_cardio') {
    return (
      <div>
        <Q isMobile={isMobile}>Doe je op dit moment al aan cardio?</Q>
        <Hint isMobile={isMobile}>Denk aan hardlopen, fietsen, zwemmen, HIIT, etc.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {DOES_CARDIO_OPTIONS.map(opt => (
            <BigOption key={opt.value} label={opt.label} sub={opt.sub}
              selected={data.does_cardio === opt.value}
              onClick={() => {
                update('does_cardio', opt.value)
                setTimeout(() => go('wants_cardio'), 150)
              }}
              isMobile={isMobile} />
          ))}
        </div>
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  // Iedereen: wil je cardio in je schema?
  if (step === 'wants_cardio') {
    return (
      <div>
        <Q isMobile={isMobile}>Wil je cardio opnemen in je schema?</Q>
        <Hint isMobile={isMobile}>We kunnen dit inplannen naast je trainingen.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {WANTS_CARDIO_OPTIONS.map(opt => (
            <BigOption key={opt.value} label={opt.label} sub={opt.sub}
              selected={data.cardio_interest === opt.value}
              onClick={() => {
                update('cardio_interest', opt.value)
                if (opt.value === 'no') {
                  console.log('✅ CardioFlow onNext — geen cardio gewenst')
                  setTimeout(() => onNext(), 150)
                } else {
                  setTimeout(() => go('types'), 150)
                }
              }}
              isMobile={isMobile} />
          ))}
        </div>
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'types') {
    const selected = data.cardio_types || []
    return (
      <div>
        <Q isMobile={isMobile}>Welke cardio doe je het liefst?</Q>
        <Hint isMobile={isMobile}>Kies alles wat je aantrekt.</Hint>
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '0.5rem', marginTop: '1rem'
        }}>
          {CARDIO_TYPE_OPTIONS.map(opt => {
            const sel = selected.includes(opt.value)
            return (
              <button key={opt.value} onClick={() => toggleType(opt.value)} style={{
                padding: '0.65rem 0.75rem', borderRadius: '8px',
                background: sel ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                color: sel ? '#FFD700' : 'rgba(255,255,255,0.55)',
                fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: sel ? 700 : 600,
                cursor: 'pointer', minHeight: '44px',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease', fontFamily: 'inherit'
              }}>
                {sel && <span style={{ marginRight: '0.3rem', fontSize: '0.5rem' }}>✓</span>}
                {opt.label}
              </button>
            )
          })}
        </div>
        <NextBtn onClick={() => go('frequency')} disabled={selected.length === 0} isMobile={isMobile} />
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'frequency') {
    return (
      <div>
        <Q isMobile={isMobile}>Hoe vaak per week wil je cardio doen?</Q>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {CARDIO_FREQ_OPTIONS.map(opt => (
            <BigOption key={opt.value} label={opt.label}
              selected={data.cardio_frequency === opt.value}
              onClick={() => { update('cardio_frequency', opt.value); setTimeout(() => go('duration'), 150) }}
              isMobile={isMobile} />
          ))}
        </div>
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'duration') {
    return (
      <div>
        <Q isMobile={isMobile}>Hoe lang per cardiosessie?</Q>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {CARDIO_DURATION_OPTIONS.map(opt => (
            <BigOption key={opt.value} label={opt.label} sub={opt.sub}
              selected={data.cardio_duration === opt.value}
              onClick={() => {
                update('cardio_duration', opt.value)
                console.log('✅ CardioFlow onNext')
                setTimeout(() => onNext(), 150)
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
