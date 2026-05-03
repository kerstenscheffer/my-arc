// src/modules/public-intake/components/phase1/BodyFlow.jsx
// Stap 2: Lichaamsgegevens — lengte, gewicht, vetpercentage visueel

import React, { useState } from 'react'
import { Q, Hint, NextBtn, BackBtn, NumberField } from './FlowStep'

const BF_OPTIONS_MALE = [
  { value: 10, label: '7–10%',  sub: 'Competitie, aderen zichtbaar', img: 'https://i.ibb.co/Y7DfXsf7/Scherm-afbeelding-2026-03-27-om-12-38-24.png' },
  { value: 14, label: '10–15%', sub: 'Duidelijke sixpack, atletisch',  img: 'https://i.ibb.co/Kjtqwfmq/Scherm-afbeelding-2026-03-27-om-12-39-55.png' },
  { value: 18, label: '15–20%', sub: 'Slank, weinig definitie',        img: 'https://i.ibb.co/3YNdy00M/Scherm-afbeelding-2026-03-27-om-12-38-46.png' },
  { value: 23, label: '20–25%', sub: 'Gemiddeld, geen abs',            img: 'https://i.ibb.co/d09DQn2f/Scherm-afbeelding-2026-03-27-om-12-38-54.png' },
  { value: 33, label: '25–35%', sub: 'Duidelijk buikje',               img: 'https://i.ibb.co/RGKN8LZr/Scherm-afbeelding-2026-03-27-om-12-39-02.png' }
]

export default function BodyFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [step, setStep] = useState('lengte')
  const [history, setHistory] = useState([])

  const go = (next) => { setHistory(h => [...h, step]); setStep(next) }
  const goBack = () => {
    if (history.length === 0) { onBack?.(); return }
    setStep(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }

  const update = (field, value) => onChange({ ...data, [field]: value })
  const updateMultiple = (fields) => onChange({ ...data, ...fields })

  const handleOnNext = () => {
    console.log('✅ SECTIE 2 (Lichaam) klaar:', {
      lengte: data.height,
      gewicht: data.current_weight,
      vet_pct: data.current_body_fat,
      vet_pct_2: data.current_body_fat_2,
    })
    onNext()
  }

  const nothingSelected = !data.current_body_fat

  const handleBfClick = (opt) => {
    const bfVal  = data.current_body_fat
    const bfVal2 = data.current_body_fat_2

    if (!bfVal) {
      update('current_body_fat', opt.value)
    } else if (bfVal === opt.value && !bfVal2) {
      update('current_body_fat', null)
    } else if (bfVal === opt.value && bfVal2) {
      updateMultiple({ current_body_fat: bfVal2, current_body_fat_2: null })
    } else if (bfVal2 === opt.value) {
      update('current_body_fat_2', null)
    } else if (!bfVal2) {
      const idx1 = BF_OPTIONS_MALE.findIndex(o => o.value === bfVal)
      const idx2 = BF_OPTIONS_MALE.findIndex(o => o.value === opt.value)
      if (Math.abs(idx1 - idx2) === 1) {
        update('current_body_fat_2', opt.value)
      } else {
        updateMultiple({ current_body_fat: opt.value, current_body_fat_2: null })
      }
    } else {
      updateMultiple({ current_body_fat: opt.value, current_body_fat_2: null })
    }
  }

  const renderStep = () => {
    switch (step) {

      case 'lengte':
        return <>
          <Q isMobile={isMobile}>Hoe lang ben je?</Q>
          <NumberField
            value={data.height}
            onChange={v => update('height', v)}
            placeholder="175"
            unit="cm"
            min={140} max={220}
            isMobile={isMobile}
          />
          <NextBtn
            onClick={() => go('gewicht')}
            disabled={!data.height || data.height < 100}
            isMobile={isMobile}
          />
        </>

      case 'gewicht':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wat weeg je nu?</Q>
          <NumberField
            value={data.current_weight}
            onChange={v => update('current_weight', v)}
            placeholder="80"
            unit="kg"
            min={40} max={250}
            isMobile={isMobile}
          />
          <NextBtn
            onClick={() => go('vetpercentage')}
            disabled={!data.current_weight || data.current_weight < 30}
            isMobile={isMobile}
          />
        </>

      case 'vetpercentage':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Klik op het lichaam waar je het meest op lijkt. Zit je ertussen in? Klik allebei aan!</Q>

          {/* Foto grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
            gap: '0.3rem'
          }}>
            {BF_OPTIONS_MALE.map((opt, photoIdx) => {
              const isSelected = data.current_body_fat === opt.value || data.current_body_fat_2 === opt.value
              const isBetween = data.current_body_fat && data.current_body_fat_2
              const isFirstEmpty = photoIdx === 0 && nothingSelected
              return (
                <button
                  key={opt.value}
                  onClick={() => handleBfClick(opt)}
                  title={opt.sub}
                  style={{
                    background: 'transparent',
                    border: `2px solid ${isSelected ? '#FFD700' : isFirstEmpty ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '8px', overflow: 'hidden',
                    cursor: 'pointer', padding: 0,
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    transition: 'border-color 0.15s ease', position: 'relative',
                    animation: isFirstEmpty ? 'bfBorderPulse 1.4s ease-in-out infinite' : 'none'
                  }}
                >
                  <img
                    src={opt.img} alt={opt.label}
                    style={{
                      width: '100%', aspectRatio: '2/3',
                      objectFit: 'cover', objectPosition: 'top', display: 'block',
                      filter: isSelected ? 'none' : 'brightness(0.55)'
                    }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '0.3rem 0.25rem',
                    background: isSelected ? 'rgba(255,215,0,0.88)' : 'rgba(0,0,0,0.72)'
                  }}>
                    <div style={{ fontSize: isMobile ? '0.55rem' : '0.58rem', fontWeight: 800, color: isSelected ? '#000' : '#fff', textAlign: 'center' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.42rem', color: isSelected ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.3, marginTop: '0.1rem' }}>{opt.sub}</div>
                  </div>
                  {isSelected && (
                    <div style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', width: '16px', height: '16px', borderRadius: '50%', background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#000' }}>
                        {isBetween ? (data.current_body_fat === opt.value ? '1' : '2') : '✓'}
                      </span>
                    </div>
                  )}
                  {nothingSelected && (
                    <div style={{ position: 'absolute', top: '0.3rem', left: '0.3rem', padding: '0.15rem 0.3rem', background: 'rgba(255,215,0,0.85)', borderRadius: '3px' }}>
                      <span style={{ fontSize: '0.4rem', fontWeight: 800, color: '#000', letterSpacing: '0.02em' }}>TAP</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {data.current_body_fat && data.current_body_fat_2 && (
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,215,0,0.6)', fontWeight: 600, textAlign: 'center' }}>
              Tussenin — we rekenen met ~{Math.round((data.current_body_fat + data.current_body_fat_2) / 2)}%
            </div>
          )}

          <NextBtn
            onClick={handleOnNext}
            disabled={!data.current_body_fat}
            isMobile={isMobile}
          />

          <style>{`
            @keyframes bfPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
            @keyframes bfBorderPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,215,0,0);border-color:rgba(255,215,0,0.35)} 50%{box-shadow:0 0 0 3px rgba(255,215,0,0.08);border-color:rgba(255,215,0,0.6)} }
          `}</style>
        </>

      default: return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {renderStep()}
    </div>
  )
}
