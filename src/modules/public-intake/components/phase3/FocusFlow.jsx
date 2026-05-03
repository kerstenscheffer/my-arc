// src/modules/public-intake/components/phase3/FocusFlow.jsx
import React from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption } from '../phase1/FlowStep'

const FOCUS_OPTIONS = [
  { value: 'strength',    label: 'Kracht',              sub: 'Zwaarder tillen, sterker worden', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop&q=80' },
  { value: 'hypertrophy', label: 'Spieren opbouwen',    sub: 'Groter en voller worden',         img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=200&fit=crop&q=80' },
  { value: 'conditioning',label: 'Conditie',            sub: 'Fitter, meer uithoudingsvermogen',img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=300&h=200&fit=crop&q=80' },
  { value: 'fat_loss',    label: 'Afvallen',            sub: 'Vet verbranden, strakker worden', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&q=80' },
  { value: 'mix',         label: 'Alles uitbalanceren', sub: 'Geen specifiek doel — gewoon fit', img: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=300&h=200&fit=crop&q=80' },
]

const STRETCH_OPTIONS = [
  { value: true,  label: 'Ja, graag',        sub: 'Voeg stretching en mobiliteit toe' },
  { value: false, label: 'Nee, liever niet', sub: 'Alleen training' },
]

export default function FocusFlow({ data, onChange, isMobile, onNext, onBack, isBeginner }) {
  const [step, setStep] = React.useState('focus')
  const history = React.useRef([])

  const update = (field, value) => onChange({ ...data, [field]: value })

  const toggleFocus = (val) => {
    const current = data.training_focus || []
    const arr = Array.isArray(current) ? current : [current].filter(Boolean)
    const next = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
    onChange({ ...data, training_focus: next })
  }
  const go = (next) => { history.current.push(step); setStep(next) }
  const back = () => {
    if (history.current.length > 0) setStep(history.current.pop())
    else if (onBack) onBack()
  }

  if (step === 'focus') {
    return (
      <div>
        <Q isMobile={isMobile}>Waar wil je op focussen?</Q>
        <Hint isMobile={isMobile}>Dit bepaalt hoe we je trainingen opbouwen.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {FOCUS_OPTIONS.map(opt => (
            <FocusCard key={opt.value} opt={opt}
              selected={(Array.isArray(data.training_focus) ? data.training_focus : [data.training_focus]).includes(opt.value)}
              onClick={() => toggleFocus(opt.value)}
              isMobile={isMobile} />
          ))}
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <Hint isMobile={isMobile}>
            {(Array.isArray(data.training_focus) ? data.training_focus : []).length > 0
              ? `${(Array.isArray(data.training_focus) ? data.training_focus : []).length} geselecteerd`
              : 'Je kunt meerdere opties kiezen'}
          </Hint>
        </div>
        <NextBtn
          onClick={() => go('stretch')}
          disabled={!data.training_focus || (Array.isArray(data.training_focus) ? data.training_focus.length === 0 : false)}
          isMobile={isMobile}
        />
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'stretch') {
    return (
      <div>
        <Q isMobile={isMobile}>Wil je stretching en mobiliteit erbij?</Q>
        <Hint isMobile={isMobile}>We voegen dan korte stretching-blokken toe aan je trainingen.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {STRETCH_OPTIONS.map(opt => (
            <BigOption key={String(opt.value)} label={opt.label} sub={opt.sub}
              selected={data.emphasize_stretch === opt.value}
              onClick={() => {
                update('emphasize_stretch', opt.value)
                console.log('✅ FocusFlow onNext')
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

function FocusCard({ opt, selected, onClick, isMobile }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: isMobile ? '0.65rem 0.75rem' : '0.75rem 1rem',
      background: selected ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${selected ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'all 0.15s ease', minHeight: '44px'
    }}>
      <img src={opt.img} alt={opt.label} style={{
        width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px',
        borderRadius: '8px', objectFit: 'cover', flexShrink: 0,
        filter: selected ? 'none' : 'brightness(0.6)', transition: 'filter 0.15s ease'
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 800, color: selected ? '#FFD700' : '#fff', marginBottom: '0.15rem' }}>{opt.label}</div>
        <div style={{ fontSize: isMobile ? '0.62rem' : '0.65rem', color: selected ? 'rgba(255,215,0,0.65)' : 'rgba(255,255,255,0.35)', fontWeight: 500, lineHeight: 1.4 }}>{opt.sub}</div>
      </div>
      {selected && (
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#000' }}>✓</span>
        </div>
      )}
    </button>
  )
}
