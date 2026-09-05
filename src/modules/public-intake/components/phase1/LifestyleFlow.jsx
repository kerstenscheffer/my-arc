// src/modules/public-intake/components/phase1/LifestyleFlow.jsx
// Stap 4: Levensstijl — activiteit, WeekBuilder, koken, stress

import React, { useState } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption, PhotoGrid, OptionGrid, Slider } from './FlowStep'
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

      case 'activiteit':
        return <>
          <Q isMobile={isMobile}>Hoe actief ben je op dit moment?</Q>
          <Hint isMobile={isMobile}>Los van sport — denk aan je dagelijkse leven.</Hint>
          <PhotoGrid
            value={data.activity_level}
            onChange={v => { update('activity_level', v); go('stappen') }}
            isMobile={isMobile}
            options={[
              { value: 'sedentary',         label: 'Weinig beweging',  sub: 'Zit veel, kantoorwerk',       image: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400&h=200&fit=crop&q=80' },
              { value: 'lightly_active',    label: 'Licht actief',     sub: 'Loop wat, 1–3x sport/week',   image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=200&fit=crop&q=80' },
              { value: 'moderately_active', label: 'Matig actief',     sub: '3–5x per week actief',        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=200&fit=crop&q=80' },
              { value: 'very_active',       label: 'Heel actief',      sub: 'Dagelijks bewegen + fysiek werk', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop&q=80' },
            ]}
          />
        </>

      // Stappen per dag. Los van de vraag hierboven: "matig actief" zegt
      // niets over hoeveel iemand daadwerkelijk loopt, en juist dat verschil
      // is bruikbaar bij het bepalen van de dagelijkse verbranding en bij
      // bijsturen als het gewicht stilstaat.
      //
      // Banden in plaats van een precies getal: bijna niemand weet zijn
      // stappen op honderd nauwkeurig, en een verzonnen precies getal is
      // erger dan een eerlijke band. De zin erachter is wat mensen herkennen.
      case 'stappen':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Hoeveel stappen zet je gemiddeld op een dag?</Q>
          <Hint isMobile={isMobile}>Een schatting is prima — kies wat het dichtst in de buurt komt.</Hint>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[
              { value: '4000_6000',  label: '4.000 – 6.000',  sub: 'Ik zit veel' },
              { value: '6000_8000',  label: '6.000 – 8.000',  sub: 'Ik loop regelmatig, maar zit ook veel' },
              { value: '8000_10000', label: '8.000 – 10.000', sub: 'Ik loop meer dan ik zit' },
              { value: '10000_plus', label: '10.000+',        sub: 'Ik loop de hele dag door' },
            ].map(o => (
              <BigOption
                key={o.value}
                label={o.label}
                sub={o.sub}
                selected={data.daily_steps === o.value}
                onClick={() => { update('daily_steps', o.value); go('week_builder') }}
                isMobile={isMobile}
              />
            ))}
          </div>
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
              go('koken')
            }}
            isMobile={isMobile}
          />
        </>

      case 'koken':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Hoeveel tijd wil je kwijt aan koken?</Q>

          {/* Coach tip */}
          <div style={{
            padding: '0.6rem 0.75rem',
            background: 'rgba(255,215,0,0.04)',
            border: '1px solid rgba(255,215,0,0.1)',
            borderLeft: '2px solid rgba(255,215,0,0.4)',
            borderRadius: '0 7px 7px 0',
            marginBottom: '0.25rem'
          }}>
            <div style={{ fontSize: '0.48rem', fontWeight: 800, color: 'rgba(255,215,0,0.6)', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>COACH TIP</div>
            <div style={{ fontSize: isMobile ? '0.68rem' : '0.7rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, fontWeight: 500 }}>
              Meal preppen bespaart je tijd, geld en energie doordeweeks.
            </div>
          </div>

          {[
            { value: 'minimal',  label: 'Zo min mogelijk',  sub: 'Max 20 min per dag' },
            { value: 'low',      label: 'Weinig',           sub: '20–30 min per dag' },
            { value: 'moderate', label: 'Prima',            sub: '30–60 min per dag' },
            { value: 'high',     label: 'Ik kook graag',    sub: '1+ uur per dag' },
          ].map(opt => (
            <BigOption
              key={opt.value}
              label={opt.label} sub={opt.sub}
              onClick={() => { update('cooking_time', opt.value); go('stress') }}
              selected={data.cooking_time === opt.value}
              isMobile={isMobile}
            />
          ))}
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
