// src/modules/public-intake/components/phase1/LifestyleFlow.jsx
// Stap 4: Levensstijl — activiteit, WeekBuilder, koken, stress

import React, { useState } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption, PhotoGrid, OptionGrid, Slider, TextField } from './FlowStep'
import WeekBuilder from '../WeekBuilder/WeekBuilder'

export default function LifestyleFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [step, setStep] = useState('activiteit')
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
    if (!data.stress_level) update('stress_level', 5)
    console.log('✅ SECTIE 4 (Levensstijl) klaar:', {
      activiteit: data.activity_level,
      stappen: data.daily_steps,
      kooktijd: data.cooking_time,
      stress: data.stress_level || 5,
      slaap: data.sleep_hours,
      trainingsdagen: data.preferred_training_days,
      training_time: data.training_time,
      week_schedule: data.week_schedule ? '✓ aanwezig' : '✗ leeg',
    })
    onNext()
  }

  const renderStep = () => {
    switch (step) {

      // Activiteit en stappen op één scherm (10 nov 2026): de stappen staan
      // direct onder "Hoe actief ben je". Los van elkaar gevraagd omdat
      // "matig actief" niets zegt over hoeveel iemand echt loopt; dat
      // verschil is bruikbaar voor de dagelijkse verbranding. Banden i.p.v.
      // een precies getal: bijna niemand weet zijn stappen exact.
      case 'activiteit':
        return <>
          <Q isMobile={isMobile}>Hoe actief ben je op dit moment?</Q>
          <Hint isMobile={isMobile}>Los van sport, denk aan je dagelijkse leven.</Hint>
          <PhotoGrid
            value={data.activity_level}
            onChange={v => update('activity_level', v)}
            isMobile={isMobile}
            options={[
              { value: 'sedentary',         label: 'Weinig beweging',  sub: 'Zit veel, kantoorwerk',       image: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400&h=200&fit=crop&q=80' },
              { value: 'lightly_active',    label: 'Licht actief',     sub: 'Loop wat, 1 tot 3x sport/week',   image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=200&fit=crop&q=80' },
              { value: 'moderately_active', label: 'Matig actief',     sub: '3 tot 5x per week actief',        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=200&fit=crop&q=80' },
              { value: 'very_active',       label: 'Heel actief',      sub: 'Dagelijks bewegen + fysiek werk', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop&q=80' },
            ]}
          />

          <div style={{ marginTop: '1.2rem' }}>
            <Q isMobile={isMobile}>Hoeveel stappen zet je gemiddeld op een dag?</Q>
            <Hint isMobile={isMobile}>Een schatting is prima, kies wat het dichtst in de buurt komt.</Hint>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { value: '4000_6000',  label: '4.000 tot 6.000',  sub: 'Ik zit veel' },
                { value: '6000_8000',  label: '6.000 tot 8.000',  sub: 'Loop regelmatig, zit ook veel' },
                { value: '8000_10000', label: '8.000 tot 10.000', sub: 'Ik loop meer dan ik zit' },
                { value: '10000_plus', label: '10.000+',          sub: 'Ik loop de hele dag door' },
              ].map(o => {
                const aan = data.daily_steps === o.value
                return (
                  <button key={o.value} onClick={() => update('daily_steps', o.value)} style={{
                    minHeight: 60, padding: '0.55rem 0.5rem', borderRadius: 12, textAlign: 'center',
                    background: aan ? '#fff' : '#0d0d0d', color: aan ? '#000' : '#fff',
                    border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.15)'}`,
                    fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s ease',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <div style={{ fontSize: isMobile ? '0.88rem' : '0.9rem', fontWeight: 900 }}>{o.label}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: 2, color: aan ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)' }}>{o.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ height: '0.6rem' }} />
          <NextBtn onClick={() => go('week_builder')} disabled={!data.activity_level || !data.daily_steps} isMobile={isMobile} />
        </>

      case 'week_builder':
        return <>
          {/* Geen eigen terug-knop hier: de WeekBuilder heeft er per stap al
              een, en die van hier zou je uit de hele agenda gooien. Vanaf de
              eerste stap geeft hij 'm via onBack aan ons door. */}
          <WeekBuilder
            data={data}
            onBack={goBack}
            onChange={fields => updateMultiple(fields)}
            onComplete={result => {
              updateMultiple(result)
              go('stress')
            }}
            isMobile={isMobile}
          />
        </>

      case 'stress':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Hoeveel stress heb je op dit moment?</Q>
          <Slider
            label="Stressniveau"
            value={data.stress_level || 5}
            onChange={v => update('stress_level', v)}
            min={1} max={10} suffix="/10"
            isMobile={isMobile}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Geen stress</span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Heel veel stress</span>
          </div>
          {/* Bij hoge stress (7+) willen we weten waar het vandaan komt: dat
              bepaalt hoe hard je kunt pushen met training en voeding. */}
          {(data.stress_level || 5) >= 7 && (
            <div style={{ marginTop: '0.9rem' }}>
              <Q isMobile={isMobile}>Waar komt die stress vandaan?</Q>
              <Hint isMobile={isMobile}>Werk, thuis, gezondheid, geld: vertel wat je kwijt wil.</Hint>
              <TextField
                multiline
                placeholder="Bijv: druk op werk, slaap slecht door de kinderen…"
                value={data.stress_toelichting || ''}
                onChange={v => update('stress_toelichting', v)}
                isMobile={isMobile}
              />
            </div>
          )}
          <NextBtn onClick={handleOnNext} isMobile={isMobile} />
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
