// src/modules/public-intake/components/phase3/LimitationsFlow.jsx
import React from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption } from '../phase1/FlowStep'

const AVOID_PILLS = [
  'Deadlift', 'Squat', 'Lunges', 'Pull-ups', 'Dips',
  'Burpees', 'Overhead press', 'Leg press', 'Sit-ups', 'Hardlopen',
  'Bench press', 'Romanian deadlift', 'Box jumps', 'Kettlebell swing',
]

export default function LimitationsFlow({ data, onChange, isMobile, onNext, onBack }) {
  const [step, setStep] = React.useState('injuries')
  const history = React.useRef([])

  const update = (field, value) => onChange({ ...data, [field]: value })
  const go = (next) => { history.current.push(step); setStep(next) }
  const back = () => {
    if (history.current.length > 0) setStep(history.current.pop())
    else if (onBack) onBack()
  }

  const togglePill = (label) => {
    const current = data.avoided_exercises_pills || []
    const next = current.includes(label) ? current.filter(v => v !== label) : [...current, label]
    update('avoided_exercises_pills', next)
  }

  if (step === 'injuries') {
    return (
      <div>
        <Q isMobile={isMobile}>Heb je blessures of pijn die je training beperken?</Q>
        <Hint isMobile={isMobile}>Denk aan knie, rug, schouder, pols — iets dat we moeten weten.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <BigOption label="Nee, geen blessures" sub="Ik kan alles doen"
            selected={!data.injuries}
            onClick={() => { update('injuries', null); setTimeout(() => go('avoided'), 150) }}
            isMobile={isMobile} />
          <BigOption label="Ja, ik heb iets te melden" sub="Beschrijf hieronder wat er speelt"
            selected={!!data.injuries}
            onClick={() => go('injuries_text')}
            isMobile={isMobile} />
        </div>
        {onBack && <BackBtn onBack={back} isMobile={isMobile} />}
      </div>
    )
  }

  if (step === 'injuries_text') {
    return (
      <div>
        <Q isMobile={isMobile}>Beschrijf je blessure(s) kort</Q>
        <Hint isMobile={isMobile}>Wat, waar, hoe lang al?</Hint>
        <textarea
          value={data.injuries || ''}
          onChange={e => update('injuries', e.target.value)}
          placeholder="Bijv. linkerknie — meniscus, al 3 maanden, geen diepe squats..."
          rows={4}
          style={{
            width: '100%', padding: isMobile ? '0.75rem' : '0.85rem',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${data.injuries ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px', color: data.injuries ? '#FFD700' : '#fff',
            fontSize: isMobile ? '0.82rem' : '0.87rem', fontWeight: 600,
            fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, marginTop: '1rem'
          }}
        />
        <NextBtn onClick={() => go('avoided')} disabled={!data.injuries || data.injuries.trim().length < 3} isMobile={isMobile} />
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'avoided') {
    const selectedPills = data.avoided_exercises_pills || []
    const hasAvoided = selectedPills.length > 0 || (data.avoided_exercises && data.avoided_exercises.trim().length > 0)

    return (
      <div>
        <Q isMobile={isMobile}>Zijn er oefeningen die je wil vermijden?</Q>
        <Hint isMobile={isMobile}>Klik aan wat van toepassing is, of vul zelf in.</Hint>

        {/* Klikbare pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem', marginBottom: '0.75rem' }}>
          {AVOID_PILLS.map(label => {
            const sel = selectedPills.includes(label)
            return (
              <button key={label} onClick={() => togglePill(label)} style={{
                padding: '0.4rem 0.75rem', borderRadius: '20px',
                background: sel ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${sel ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: sel ? '#FFD700' : 'rgba(255,255,255,0.5)',
                fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: sel ? 700 : 500,
                cursor: 'pointer', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease', fontFamily: 'inherit'
              }}>
                {sel && '✓ '}{label}
              </button>
            )
          })}
        </div>

        {/* Open tekstveld */}
        <input
          type="text"
          value={data.avoided_exercises || ''}
          onChange={e => update('avoided_exercises', e.target.value)}
          placeholder="Iets anders? Typ hier..."
          style={{
            width: '100%', padding: isMobile ? '0.65rem 0.75rem' : '0.7rem 0.85rem',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${data.avoided_exercises ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px', color: data.avoided_exercises ? '#FFD700' : '#fff',
            fontSize: isMobile ? '0.82rem' : '0.87rem', fontWeight: 600,
            fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
          }}
        />

        <NextBtn
          onClick={() => go('other')}
          isMobile={isMobile}
          label={hasAvoided ? 'Verder' : 'Nee, alles is prima'}
        />
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'other') {
    return (
      <div>
        <Q isMobile={isMobile}>Heb je andere beperkingen?</Q>
        <Hint isMobile={isMobile}>Bijv. beperkte mobiliteit, herstellend van operatie, chronische klacht.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <BigOption label="Nee, verder niks" sub="Dit was alles"
            selected={!data.other_limitations}
            onClick={() => { update('other_limitations', null); console.log('✅ LimitationsFlow onNext'); setTimeout(() => onNext(), 150) }}
            isMobile={isMobile} />
          <BigOption label="Ja, nog iets te melden" sub="Ik vul het hieronder in"
            selected={!!data.other_limitations}
            onClick={() => go('other_text')}
            isMobile={isMobile} />
        </div>
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'other_text') {
    return (
      <div>
        <Q isMobile={isMobile}>Wat wil je nog kwijt?</Q>
        <textarea
          value={data.other_limitations || ''}
          onChange={e => update('other_limitations', e.target.value)}
          placeholder="Bijv. beperkte mobiliteit linkerschouder, herstellend van knieoperatie..."
          rows={3}
          style={{
            width: '100%', padding: isMobile ? '0.75rem' : '0.85rem',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${data.other_limitations ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px', color: data.other_limitations ? '#FFD700' : '#fff',
            fontSize: isMobile ? '0.82rem' : '0.87rem', fontWeight: 600,
            fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, marginTop: '1rem'
          }}
        />
        <NextBtn
          onClick={() => { console.log('✅ LimitationsFlow onNext — klaar'); onNext() }}
          disabled={!data.other_limitations || data.other_limitations.trim().length < 2}
          isMobile={isMobile}
          label="Training intake afronden"
        />
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  return null
}
