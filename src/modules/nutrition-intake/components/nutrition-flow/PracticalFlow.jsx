// src/modules/nutrition-intake/components/nutrition-flow/PracticalFlow.jsx
// Stap 7-8: Budget + kookvoorkeur + guidance level (pre-selectie op kennis niveau)
import React, { useState, useEffect } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption, OptionGrid, PhotoGrid } from '../../../public-intake/components/phase1/FlowStep'

// Guidance level — pre-selectie op basis van kennis niveau
// macros_kennis: ja → flexible/free, beetje → flexible, nee → strict
function getPreselectedGuidance(macrosKennis) {
  if (macrosKennis === 'ja') return 'flexible'
  if (macrosKennis === 'beetje') return 'flexible'
  return 'strict'
}

const GUIDANCE_OPTIONS = [
  {
    value: 'strict',
    label: 'Coach bouwt alles voor me',
    sub: 'Ik krijg een exact plan met hoeveelheden',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop&q=80',
    badge: null,
  },
  {
    value: 'flexible',
    label: 'Plan met targets',
    sub: 'Ik weet wat ik eet, maar wissel zelf af',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=200&fit=crop&q=80',
    badge: 'Populairst',
  },
  {
    value: 'free',
    label: 'Alleen richtlijnen',
    sub: 'Ik regel het zelf, wil wel advies',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop&q=80',
    badge: null,
  },
]

export default function PracticalFlow({ data, onChange, onNext, onBack, isMobile }) {
  // Budget, kookvoorkeur en maaltijden per dag zijn op 10 nov 2026 weggehaald;
  // alleen de begeleidingsvraag is over.
  const [step] = useState(4)

  const update = (field, value) => onChange({ ...data, [field]: value })

  // Pre-selecteer guidance level op basis van kennis niveau uit vorige flow
  useEffect(() => {
    if (!data.guidance_level && data.macros_kennis) {
      update('guidance_level', getPreselectedGuidance(data.macros_kennis))
    }
  }, [])

  const goBack = () => { if (onBack) onBack() }

  const pad = isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem'

  // Stap 4 — Guidance level (met pre-selectie)
  if (step === 4) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Hoe wil je begeleid worden?</Q>
      <Hint isMobile={isMobile}>
        {data.macros_kennis === 'nee'
          ? 'We raden aan dat je coach alles voor je bouwt. Jij hoeft alleen te volgen'
          : 'We hebben alvast een keuze voor je gemaakt op basis van je kennis. Je kan dit aanpassen.'}
      </Hint>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
        {GUIDANCE_OPTIONS.map(opt => {
          const isSelected = data.guidance_level === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => update('guidance_level', opt.value)}
              style={{
                padding: 0, overflow: 'hidden',
                background: isSelected ? 'rgba(255,255,255,0.04)' : '#0a0a0a',
                border: `1.5px solid ${isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Foto */}
              <div style={{ width: '100%', height: isMobile ? '60px' : '70px', backgroundImage: `url(${opt.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: isSelected ? 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.15))' : 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3))' }} />
                {isSelected && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #fff, #fff)' }} />}
                {opt.badge && (
                  <div style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '3px', fontSize: '0.5rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{opt.badge}</div>
                )}
                {/* Check */}
                <div style={{ position: 'absolute', bottom: '0.4rem', right: '0.4rem', width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.2)'}`, background: isSelected ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
                  {isSelected && <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#000' }}>✓</span>}
                </div>
              </div>
              {/* Tekst */}
              <div style={{ padding: isMobile ? '0.45rem 0.65rem' : '0.5rem 0.75rem' }}>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 800, color: isSelected ? '#fff' : '#fff', marginBottom: '0.1rem' }}>{opt.label}</div>
                <div style={{ fontSize: isMobile ? '0.58rem' : '0.62rem', color: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{opt.sub}</div>
              </div>
            </button>
          )
        })}
      </div>
      <NextBtn
        onClick={onNext}
        disabled={!data.guidance_level}
        isMobile={isMobile}
      onBack={goBack} />
    </div>
  )

  return null
}
